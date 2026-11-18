// Tivvy Programme Designer V3.2 storage API.
// This Worker must be deployed behind Cloudflare Access. The JWT is ALSO
// cryptographically verified here; an unverified identity header is never trusted.
// It is intentionally NOT called by the browser-only V3.1 application yet.
const MAX_SNAPSHOT_BYTES = 3_000_000;
// Large artwork uses a streamed single upload up to 95 MB; multipart is a future phase.
const TYPES = new Set(["image/png","image/jpeg","image/webp","image/gif","image/avif","application/pdf"]);
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
const failure=(message,status=400)=>json({ok:false,error:message},status);
const uid=()=>crypto.randomUUID();
const now=()=>new Date().toISOString();
const safeId=id=>/^[a-zA-Z0-9_-]{1,90}$/.test(String(id||""));
const bytes=s=>new TextEncoder().encode(s).length;
function decodeBase64url(input){
 const str=atob(input.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(input.length/4)*4,"="));
 return Uint8Array.from(str,c=>c.charCodeAt(0));
}
async function verifiedAccessIdentity(request,env){
 const token=request.headers.get("Cf-Access-Jwt-Assertion");
 if(!token||!env.ACCESS_TEAM_DOMAIN||!env.ACCESS_AUD)return null;
 const parts=token.split(".");
 if(parts.length!==3)return null;
 let header,payload;
 try{header=JSON.parse(new TextDecoder().decode(decodeBase64url(parts[0])));payload=JSON.parse(new TextDecoder().decode(decodeBase64url(parts[1])))}catch{return null}
 if(header.alg!=="RS256"||!header.kid)return null;
 const issuer="https://"+env.ACCESS_TEAM_DOMAIN.replace(/^https?:\/\//,"").replace(/\/$/,"");
 const clock=Math.floor(Date.now()/1000);
 if(payload.iss!==issuer||!Array.isArray(payload.aud)||!payload.aud.includes(env.ACCESS_AUD)||!Number.isFinite(payload.exp)||payload.exp<=clock||!Number.isFinite(payload.iat)||payload.iat>clock+60)return null;
 const res=await fetch(issuer+"/cdn-cgi/access/certs",{cf:{cacheTtl:300,cacheEverything:true}});
 if(!res.ok)return null;
 const keys=await res.json();
 const jwk=(keys.keys||[]).find(k=>k.kid===header.kid&&k.kty==="RSA");
 if(!jwk)return null;
 try{
  const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
  const signature=decodeBase64url(parts[2]);
  if(!await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,signature,new TextEncoder().encode(parts[0]+"."+parts[1])))return null;
 }catch{return null}
 if(!payload.email||typeof payload.email!=="string")return null;
 return payload.email.toLowerCase().trim();
}
async function member(env,email){
 return await env.DB.prepare("SELECT role FROM programme_members WHERE email=? AND active=1").bind(email).first();
}
function allowed(role,action){
 if(action==="read")return ["admin","editor","reviewer","viewer"].includes(role);
 if(action==="edit")return ["admin","editor"].includes(role);
 if(action==="restore")return role==="admin";
 return false;
}
function validDocument(doc){
 if(!doc||typeof doc!=="object"||Array.isArray(doc)||!Array.isArray(doc.pages)||doc.pages.length>300)return false;
 const ids=new Set();
 for(const p of doc.pages){
  if(!p||!safeId(p.id)||ids.has(p.id)||typeof p.name!=="string"||p.name.length>200)return false;
  ids.add(p.id);
  if(p.layers!==undefined&&!Array.isArray(p.layers))return false;
  if(p.layers?.length>1200)return false;
 }
 return true;
}
async function payload(request,max=MAX_SNAPSHOT_BYTES){
 const text=await request.text();
 if(bytes(text)>max)throw new Error("Payload exceeds size limit");
 return JSON.parse(text);
}
async function requireIssue(env,id){
 return await env.DB.prepare("SELECT id,title,status,current_version,created_at,updated_at FROM programme_issues WHERE id=?").bind(id).first();
}
async function readIssue(env,id){
 const issue=await requireIssue(env,id);
 if(!issue)return failure("Issue not found",404);
 const rev=await env.DB.prepare("SELECT id,version,snapshot_json,summary,actor,created_at FROM issue_revisions WHERE issue_id=? AND version=?").bind(id,issue.current_version).first();
 if(!rev)return failure("Issue has no readable revision",500);
 return json({ok:true,issue,version:rev.version,document:JSON.parse(rev.snapshot_json)});
}
async function createIssue(env,actor,request){
 const input=await payload(request);if(!safeId(input.id)||typeof input.title!=="string"||!validDocument(input.document))return failure("Invalid issue ID/title/document");
 const text=JSON.stringify(input.document);if(bytes(text)>MAX_SNAPSHOT_BYTES)return failure("Document too large",413);
 const time=now(),revision=uid();
 try{
 await env.DB.batch([
  env.DB.prepare("INSERT INTO programme_issues(id,title,status,current_version,created_at,updated_at,created_by) VALUES (?,?, 'draft',1,?,?,?)").bind(input.id,input.title.trim().slice(0,200),time,time,actor),
  env.DB.prepare("INSERT INTO issue_revisions(id,issue_id,version,snapshot_json,summary,actor,created_at) VALUES (?,?,1,?,'Initial issue',?,?)").bind(revision,input.id,text,actor,time),
  env.DB.prepare("INSERT INTO activity_events(id,issue_id,revision_id,actor,action,after_json,created_at) VALUES (?,?,?,?, 'issue.create',?,?)").bind(uid(),input.id,revision,actor,JSON.stringify({title:input.title}),time)
 ]);
 }catch{return failure("Issue already exists or could not be created",409)}
 return json({ok:true,id:input.id,version:1},201);
}

function safeAuditField(value){
 if(value===undefined)return null;
 // Audit meaningful attributes without copying huge private photo bytes into D1.
 // The original bytes remain in R2 and archival revisions; logs contain asset IDs.
 const sanitize=(v,depth=0)=>{
  if(typeof v==="string"){
   if(v.startsWith("data:"))return {media:"embedded-data-url",characters:v.length,mime:v.slice(0,120).split(";")[0]};
   if(v.length>1000)return {excerpt:v.slice(0,1000),truncated:true,characters:v.length};
   return v;
  }
  if(v&&typeof v==="object"){
   if(depth>3)return "[deep object]";
   if(Array.isArray(v))return {entries:v.length,sample:v.slice(0,5).map(x=>sanitize(x,depth+1))};
   return Object.fromEntries(Object.entries(v).slice(0,30).map(([k,x])=>[k,sanitize(x,depth+1)]));
  }
  return v;
 };
 return sanitize(value);
}
function detailedDocumentAudit(before,after){
 const changes=[];
 const append=(action,page,layer,field,b,a)=>{
  if(changes.length>=250)return;
  changes.push({action,page,layer,field,before:safeAuditField(b),after:safeAuditField(a)});
 };
 const oldPages=new Map((before.pages||[]).map(p=>[p.id,p]));
 for(const p of after.pages||[]){
  const old=oldPages.get(p.id);
  if(!old){append("page.create",p.id,null,null,null,{name:p.name});continue}
  oldPages.delete(p.id);
  for(const key of ["name","include","source","mode"]){
   if(JSON.stringify(old[key])!==JSON.stringify(p[key]))append("page.property.change",p.id,null,key,old[key],p[key]);
  }
  const oldLayers=new Map((old.layers||[]).map(l=>[String(l.id),l]));
  for(const layer of p.layers||[]){
   const layerId=String(layer.id);
   const prev=oldLayers.get(layerId);
   if(!prev){append("layer.create",p.id,layerId,null,null,layer);continue}
   oldLayers.delete(layerId);
   for(const key of new Set([...Object.keys(prev),...Object.keys(layer)])){
    if(key==="id")continue;
    if(JSON.stringify(prev[key])!==JSON.stringify(layer[key]))
     append("layer.property.change",p.id,layerId,key,prev[key],layer[key]);
   }
  }
  for(const removed of oldLayers.values())append("layer.delete",p.id,String(removed.id),null,removed,null);
 }
 for(const removed of oldPages.values())append("page.delete",removed.id,null,null,{name:removed.name},null);
 const olderIds=(before.pages||[]).map(x=>x.id),newIds=(after.pages||[]).map(x=>x.id);
 if(JSON.stringify(olderIds)!==JSON.stringify(newIds))append("pages.reorder",null,null,"order",olderIds,newIds);
 return changes;
}

async function saveIssue(env,actor,issueId,request){
 const input=await payload(request);
 if(!Number.isSafeInteger(input.expected_version)||input.expected_version<1||!validDocument(input.document))return failure("Expected version and valid page document required");
 const serialized=JSON.stringify(input.document);
 if(bytes(serialized)>MAX_SNAPSHOT_BYTES)return failure("Document exceeds 3MB limit",413);
 const expected=input.expected_version,ver=expected+1,time=now(),rev=uid(),event=uid();
 const summary=String(input.summary||"Save programme").slice(0,300),targetPage=typeof input.page_id==="string"?input.page_id:null,targetLayer=typeof input.layer_id==="string"?input.layer_id:null;
 const previous=await env.DB.prepare("SELECT snapshot_json FROM issue_revisions WHERE issue_id=? AND version=?").bind(issueId,expected).first();
 if(!previous)return failure("Expected issue revision not found",409);
 const changes=detailedDocumentAudit(JSON.parse(previous.snapshot_json),input.document);
 // All statements are one atomic D1 batch. Each insert is conditional on
 // the expected issue version. No stale writer can overwrite newer data.
 await env.DB.batch([
  env.DB.prepare("INSERT INTO issue_revisions(id,issue_id,version,snapshot_json,summary,actor,created_at) SELECT ?,id,?,?,?, ?,? FROM programme_issues WHERE id=? AND current_version=?").bind(rev,ver,serialized,summary,actor,time,issueId,expected),
  env.DB.prepare("UPDATE programme_issues SET current_version=?,updated_at=? WHERE id=? AND current_version=? AND EXISTS(SELECT 1 FROM issue_revisions WHERE id=?)").bind(ver,time,issueId,expected,rev),
  env.DB.prepare("INSERT INTO activity_events(id,issue_id,revision_id,actor,action,target_page_id,target_layer_id,detail_json,created_at) SELECT ?,?,?,?,?,?,?,?,? FROM issue_revisions WHERE id=?").bind(event,issueId,rev,actor,"issue.save",targetPage,targetLayer,JSON.stringify({summary,from_version:expected,to_version:ver,field_changes:changes.length,max_logged:250}),time,rev),
  ...changes.map(c=>env.DB.prepare("INSERT INTO activity_events(id,issue_id,revision_id,actor,action,target_page_id,target_layer_id,before_json,after_json,detail_json,created_at) SELECT ?,?,?,?,?,?,?,?,?,?,? FROM issue_revisions WHERE id=?")
   .bind(uid(),issueId,rev,actor,c.action,c.page,c.layer,c.before===null?null:JSON.stringify(c.before),c.after===null?null:JSON.stringify(c.after),JSON.stringify({field:c.field,from_version:expected,to_version:ver}),time,rev))
 ]);
 const ownRevision=await env.DB.prepare("SELECT id FROM issue_revisions WHERE id=? AND issue_id=?").bind(rev,issueId).first();
 const check=await env.DB.prepare("SELECT current_version FROM programme_issues WHERE id=?").bind(issueId).first();
 if(!check)return failure("Issue not found",404);
 if(!ownRevision)return json({ok:false,error:"Version conflict: another editor saved newer changes",current_version:check.current_version},409);
 return json({ok:true,id:issueId,version:ver,revision_id:rev,saved_at:time});
}
async function restoreIssue(env,actor,id,version,request){
 if(!Number.isSafeInteger(version)||version<1)return failure("Invalid restore version");
 const input=await payload(request);if(!Number.isSafeInteger(input.expected_version)||input.expected_version<1)return failure("Expected current version required");
 const previous=await env.DB.prepare("SELECT snapshot_json FROM issue_revisions WHERE issue_id=? AND version=?").bind(id,version).first();
 if(!previous)return failure("Requested revision not found",404);
 const current=await requireIssue(env,id);
 if(!current)return failure("Issue not found",404);
 if(current.current_version!==input.expected_version)return json({ok:false,error:"Version conflict",current_version:current.current_version},409);
 const synthetic=new Request(request.url,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({expected_version:input.expected_version,document:JSON.parse(previous.snapshot_json),summary:"Restore revision "+version})});
 return await saveIssue(env,actor,id,synthetic);
}
async function uploadAsset(env,actor,id,request){
  // Original bytes are streamed directly to R2: no re-encoding, resizing,
  // lossy compression or in-memory buffering of large photographs.
  // Free/Pro Cloudflare HTTP request-body caps are 100 MB; reserve headroom.
  const MAX_STREAMED_ASSET_BYTES = 95_000_000;
  const mime=(request.headers.get("content-type")||"").split(";")[0].trim().toLowerCase();
  if(!TYPES.has(mime))return failure("Unsupported asset MIME type",415);
  const declaredSize=Number(request.headers.get("content-length"));
  if(!Number.isSafeInteger(declaredSize)||declaredSize<=0)
    return failure("A positive Content-Length is required for streamed artwork uploads",411);
  if(declaredSize>MAX_STREAMED_ASSET_BYTES)
    return failure("Single-upload limit is 95 MB; larger original files need multipart upload",413);
  if(!request.body)return failure("Missing upload body",400);
  const filename=(request.headers.get("x-file-name")||"uploaded-file").replace(/[\r\n\\/]/g,"_").slice(0,160);
  const assetId=uid(),key=id+"/"+assetId,time=now();
  const object=await env.ASSETS.put(key,request.body,{
    httpMetadata:{contentType:mime},
    customMetadata:{uploadedBy:actor,originalFilename:filename}
  });
  if(!object)return failure("R2 did not confirm object storage",500);
  if(object.size!==declaredSize){
    await env.ASSETS.delete(key);
    return failure("Uploaded byte count differed from declared size; no asset was retained",422);
  }
  try{
    await env.DB.batch([
      env.DB.prepare("INSERT INTO programme_assets(id,issue_id,r2_key,original_filename,mime_type,byte_size,uploaded_by,uploaded_at) VALUES (?,?,?,?,?,?,?,?)").bind(assetId,id,key,filename,mime,object.size,actor,time),
      env.DB.prepare("INSERT INTO activity_events(id,issue_id,actor,action,detail_json,created_at) VALUES (?,?,?,'asset.upload',?,?)").bind(uid(),id,actor,JSON.stringify({assetId,filename,mime,size:object.size}),time)
    ]);
  }catch(e){await env.ASSETS.delete(key);throw e}
  return json({ok:true,asset_id:assetId,mime_type:mime,byte_size:object.size},201);
}
async function getAsset(env,id,assetId){
 const asset=await env.DB.prepare("SELECT * FROM programme_assets WHERE id=? AND issue_id=?").bind(assetId,id).first();
 if(!asset)return failure("Asset not found",404);
 const result=await env.ASSETS.get(asset.r2_key);if(!result)return failure("Stored object missing",404);
 return new Response(result.body,{headers:{"content-type":asset.mime_type,"cache-control":"private, no-store","x-content-type-options":"nosniff","content-disposition":"inline"}});
}


// Shared original-artwork library. Files stay in private R2; only metadata goes to D1.
// Idempotent schema bootstrap is required because the existing CI token has only
// Workers Scripts:Edit (not the D1 admin permission to apply remote SQL migrations).
async function ensureAssetLibrary(env){
 await env.DB.batch([
  env.DB.prepare("CREATE TABLE IF NOT EXISTS asset_library (id TEXT PRIMARY KEY,r2_key TEXT NOT NULL UNIQUE,original_filename TEXT NOT NULL,title TEXT NOT NULL DEFAULT '',description TEXT NOT NULL DEFAULT '',tags_json TEXT NOT NULL DEFAULT '[]',category TEXT NOT NULL DEFAULT '',credit TEXT NOT NULL DEFAULT '',mime_type TEXT NOT NULL,byte_size INTEGER NOT NULL,sha256 TEXT,created_by TEXT NOT NULL,created_at TEXT NOT NULL,updated_by TEXT NOT NULL,updated_at TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','trash','purging')),trashed_at TEXT,purge_after TEXT,trashed_by TEXT,deleted_at TEXT)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_asset_library_status ON asset_library(status,updated_at DESC)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_asset_library_trash ON asset_library(status,purge_after)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS asset_library_events (id TEXT PRIMARY KEY,asset_id TEXT NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,before_json TEXT,after_json TEXT,detail_json TEXT,created_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_asset_events_id_time ON asset_library_events(asset_id,created_at DESC)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_asset_events_time ON asset_library_events(created_at DESC)")
 ]);
}
function assetSummary(item){
 const {id,original_filename,title,description,tags_json,category,credit,mime_type,byte_size,sha256,created_by,created_at,updated_by,updated_at,status,trashed_at,purge_after,trashed_by}=item;
 let tags;try{tags=JSON.parse(tags_json)}catch{tags=[]}
 return {id,original_filename,title,description,tags,category,credit,mime_type,byte_size,sha256,created_by,created_at,updated_by,updated_at,status,trashed_at,purge_after,trashed_by};
}
function libraryEvent(env,id,actor,action,before,after,detail={}){
 return env.DB.prepare("INSERT INTO asset_library_events(id,asset_id,actor,action,before_json,after_json,detail_json,created_at) VALUES(?,?,?,?,?,?,?,?)")
 .bind(uid(),id,actor,action,before?JSON.stringify(before):null,after?JSON.stringify(after):null,JSON.stringify(detail),now());
}
async function listLibrary(env,url){
 await ensureAssetLibrary(env);
 const query=String(url.searchParams.get("q")||"").trim().slice(0,120);
 const status=url.searchParams.get("status")==="trash"?"trash":"active";
 const term="%"+query.replace(/[%_\\]/g,ch=>"\\"+ch)+"%";
 const result=await env.DB.prepare("SELECT * FROM asset_library WHERE status=? AND (original_filename LIKE ? ESCAPE '\\' OR title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\' OR tags_json LIKE ? ESCAPE '\\' OR category LIKE ? ESCAPE '\\' OR credit LIKE ? ESCAPE '\\') ORDER BY updated_at DESC LIMIT 200")
 .bind(status,term,term,term,term,term,term).all();
 return json({ok:true,items:(result.results||[]).map(assetSummary),query,status});
}
async function uploadLibraryAsset(env,actor,request){
 await ensureAssetLibrary(env);
 const MAX_BYTES=95_000_000;
 const mime=(request.headers.get("content-type")||"").split(";")[0].trim().toLowerCase();
 if(!TYPES.has(mime))return failure("Unsupported original artwork type",415);
 const size=Number(request.headers.get("content-length"));
 if(!Number.isSafeInteger(size)||size<1)return failure("Content-Length required for original artwork",411);
 if(size>MAX_BYTES)return failure("Use multipart for originals over 95 MB; the file was not altered",413);
 if(!request.body)return failure("Missing original artwork body",400);
 const filename=(request.headers.get("x-file-name")||"Untitled original").replace(/[\r\n\\/]/g,"_").slice(0,160);
 const checksum=(request.headers.get("x-original-sha256")||"").trim().toLowerCase();
 if(checksum&&!/^[0-9a-f]{64}$/.test(checksum))return failure("Invalid SHA-256 metadata",400);
 const id=uid(),key="library/"+id,t=now();
 const object=await env.ASSETS.put(key,request.body,{httpMetadata:{contentType:mime},customMetadata:{uploadedBy:actor,originalFilename:filename}});
 if(!object||object.size!==size){await env.ASSETS.delete(key);return failure("Original byte count mismatch; upload rejected",422)}
 const title=filename.slice(0,160);
 try{
  await env.DB.batch([
   env.DB.prepare("INSERT INTO asset_library(id,r2_key,original_filename,title,mime_type,byte_size,sha256,created_by,created_at,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").bind(id,key,filename,title,mime,object.size,checksum||null,actor,t,actor,t),
   libraryEvent(env,id,actor,"asset.upload",null,{original_filename:filename,title,mime_type:mime,byte_size:object.size,sha256:checksum||null},{source:"original bytes; no processing"})
  ]);
 }catch(e){await env.ASSETS.delete(key);throw e}
 return json({ok:true,id,byte_size:object.size,mime_type:mime},201);
}
async function libraryDetail(env,id){
 await ensureAssetLibrary(env);
 const item=await env.DB.prepare("SELECT * FROM asset_library WHERE id=?").bind(id).first();
 return item?item:null;
}
async function libraryOriginal(env,id){
 const item=await libraryDetail(env,id);
 if(!item||!["active","trash"].includes(item.status))return failure("Artwork unavailable",404);
 const object=await env.ASSETS.get(item.r2_key);
 if(!object)return failure("Original bytes not found",404);
 return new Response(object.body,{headers:{"content-type":item.mime_type,"cache-control":"private, no-store","x-content-type-options":"nosniff","content-disposition":"inline"}});
}
async function updateLibraryAsset(env,actor,id,request){
 const item=await libraryDetail(env,id);
 if(!item)return failure("Artwork not found",404);
 const body=await payload(request,32_000);
 const action=String(body.action||"metadata");
 const before=assetSummary(item);
 if(action==="metadata"){
  if(item.status!=="active")return failure("Restore asset before editing metadata",409);
  const title=String(body.title??item.title).trim().slice(0,160);
  const description=String(body.description??item.description).slice(0,1500);
  const category=String(body.category??item.category).slice(0,80);
  const credit=String(body.credit??item.credit).slice(0,160);
  const rawTags=Array.isArray(body.tags)?body.tags:before.tags;
  const tags=[...new Set(rawTags.filter(x=>typeof x==="string").map(x=>x.trim().slice(0,50)).filter(Boolean))].slice(0,40);
  const after={...before,title,description,category,credit,tags,updated_by:actor,updated_at:now()};
  await env.DB.batch([
   env.DB.prepare("UPDATE asset_library SET title=?,description=?,category=?,credit=?,tags_json=?,updated_by=?,updated_at=? WHERE id=? AND status='active'").bind(title,description,category,credit,JSON.stringify(tags),actor,after.updated_at,id),
   libraryEvent(env,id,actor,"asset.metadata.update",before,after)
  ]);
  return json({ok:true,item:after});
 }
 if(action==="trash"){
  if(item.status!=="active")return failure("Only active originals can be moved to trash",409);
  const t=now(),purgeAfter=new Date(Date.now()+90*86400000).toISOString();
  const after={...before,status:"trash",trashed_at:t,purge_after:purgeAfter,trashed_by:actor,updated_by:actor,updated_at:t};
  await env.DB.batch([
   env.DB.prepare("UPDATE asset_library SET status='trash',trashed_at=?,purge_after=?,trashed_by=?,updated_by=?,updated_at=? WHERE id=? AND status='active'").bind(t,purgeAfter,actor,actor,t,id),
   libraryEvent(env,id,actor,"asset.trash",before,after,{retentionDays:90})
  ]);
  return json({ok:true,item:after});
 }
 if(action==="restore"){
  if(item.status!=="trash")return failure("Artwork is not in trash",409);
  if(item.purge_after<=now())return failure("The 90-day recovery period has expired",410);
  const t=now();
  const after={...before,status:"active",trashed_at:null,purge_after:null,trashed_by:null,updated_by:actor,updated_at:t};
  await env.DB.batch([
   env.DB.prepare("UPDATE asset_library SET status='active',trashed_at=NULL,purge_after=NULL,trashed_by=NULL,updated_by=?,updated_at=? WHERE id=? AND status='trash' AND purge_after>?").bind(actor,t,id,t),
   libraryEvent(env,id,actor,"asset.restore",before,after)
  ]);
  return json({ok:true,item:after});
 }
 return failure("Unknown library action",400);
}
async function libraryAudit(env,url){
 await ensureAssetLibrary(env);
 const id=url.searchParams.get("asset");
 const limit=Math.min(500,Math.max(1,Number(url.searchParams.get("limit"))||200));
 const query=id&&/^[a-f0-9-]{36}$/.test(id)?"SELECT * FROM asset_library_events WHERE asset_id=? ORDER BY created_at DESC LIMIT ?":"SELECT * FROM asset_library_events ORDER BY created_at DESC LIMIT ?";
 const result=id&&/^[a-f0-9-]{36}$/.test(id)?await env.DB.prepare(query).bind(id,limit).all():await env.DB.prepare(query).bind(limit).all();
 return json({ok:true,events:result.results||[]});
}
// Delete only expired, unreferenced files. A historical issue revision referencing
// the artwork protects it from irreversible deletion, even after 90 days.
async function purgeExpiredLibrary(env){
 await ensureAssetLibrary(env);
 const expired=await env.DB.prepare("SELECT * FROM asset_library WHERE status='trash' AND purge_after<=? ORDER BY purge_after ASC LIMIT 20").bind(now()).all();
 for(const item of expired.results||[]){
  const used=await env.DB.prepare("SELECT 1 AS used FROM issue_revisions WHERE instr(snapshot_json, ?) > 0 LIMIT 1").bind(item.id).first();
  if(used)continue;
  const t=now();
  await env.DB.batch([
   env.DB.prepare("UPDATE asset_library SET status='purging',deleted_at=?,updated_at=? WHERE id=? AND status='trash' AND purge_after<=?").bind(t,t,item.id,t),
   libraryEvent(env,item.id,"system:retention","asset.purge.begin",assetSummary(item),null,{retentionDays:90})
  ]);
  // Restore and purge may race. Only delete when the DB still records purging.
  const still=await env.DB.prepare("SELECT status FROM asset_library WHERE id=?").bind(item.id).first();
  if(still?.status!=="purging")continue;
  await env.ASSETS.delete(item.r2_key);
  await env.DB.batch([
   env.DB.prepare("DELETE FROM asset_library WHERE id=? AND status='purging'").bind(item.id),
   libraryEvent(env,item.id,"system:retention","asset.purge.complete",null,null,{originalFilename:item.original_filename,expiredAt:item.purge_after})
  ]);
 }
}

async function globalActivity(env,url){
 await ensureAssetLibrary(env);
 const limit=Math.min(300,Math.max(1,Number(url.searchParams.get("limit"))||200));
 const offset=Math.min(1000000,Math.max(0,Number(url.searchParams.get("offset"))||0));
 const sql="SELECT 'programme' AS kind,id,issue_id,NULL AS asset_id,actor,action,target_page_id,target_layer_id,before_json,after_json,detail_json,created_at FROM activity_events UNION ALL SELECT 'artwork' AS kind,id,NULL AS issue_id,asset_id,actor,action,NULL AS target_page_id,NULL AS target_layer_id,before_json,after_json,detail_json,created_at FROM asset_library_events ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?";
 const result=await env.DB.prepare(sql).bind(limit,offset).all();
 const events=result.results||[];
 return json({ok:true,events,offset,next_offset:offset+events.length,has_more:events.length===limit});
}
async function appendAuditNote(env,actor,request){
 const data=await payload(request,20000);
 const note=String(data.text||"").trim().slice(0,8000);
 const issueId=String(data.issue_id||"").trim();
 if(note.length<2)return failure("A meaningful note is required",400);
 if(!safeId(issueId)||!await requireIssue(env,issueId))return failure("Select a valid issue",400);
 const time=now(),event=uid();
 await env.DB.prepare("INSERT INTO activity_events(id,issue_id,actor,action,detail_json,created_at) VALUES(?,?,?,'project.note',?,?)").bind(event,issueId,actor,JSON.stringify({text:note,source:"authenticated user note"}),time).run();
 return json({ok:true,id:event,created_at:time,actor});
}


// Read-only source discovery using the existing hourly public Viv Curtis Flickr index.
// This does NOT download, claim ownership of, or modify third-party photographs.
async function vivFlickrDiscovery(url){
 const q=String(url.searchParams.get("q")||"").trim().toLowerCase().slice(0,120);
 const source="https://nickabull.github.io/Tiverton-Town-Control-Centre/data/flickr-gallery.json";
 let response;
 try{response=await fetch(source,{cf:{cacheEverything:true,cacheTtl:300}})}
 catch{return json({ok:false,error:"Viv public catalogue is currently unavailable; no photos imported"},503)}
 if(!response.ok)return json({ok:false,error:"Viv catalogue not published yet; existing source workflow must index it first"},503);
 const length=Number(response.headers.get("content-length")||0);
 if(length>12_000_000)return failure("Public photo index exceeds preview size budget",413);
 const raw=await response.text();
 if(raw.length>12_000_000)return failure("Public photo index too large",413);
 let catalog;try{catalog=JSON.parse(raw)}catch{return json({ok:false,error:"Flickr index unavailable or malformed"},503)}
 if(!Array.isArray(catalog.rows)||!Array.isArray(catalog.photo_fields))return json({ok:false,error:"Flickr catalogue is not populated"},503);
 const fields=catalog.photo_fields,rows=[];
 const find=(row,key)=>row[fields.indexOf(key)]||"";
 for(const row of catalog.rows){
  if(!Array.isArray(row))continue;
  const photo_id=String(find(row,"photo_id")),title=String(find(row,"title"));
  const date_taken=String(find(row,"date_taken")),tags=String(find(row,"tags"));
  const thumbnail_url=String(find(row,"thumbnail_url"));
  const original_url=String(find(row,"original_url"));
  const source_url=String(find(row,"source_url")||"https://www.flickr.com/photos/90186291@N04/"+photo_id+"/");
  if(!/^\d+$/.test(photo_id))continue;
  if(q&&!(title+" "+date_taken+" "+tags+" "+String(find(row,"album_id"))).toLowerCase().includes(q))continue;
  rows.push({photo_id,title,date_taken,tags,thumbnail_url:thumbnail_url.startsWith("https://")?thumbnail_url:null,
   original_available:original_url.startsWith("https://"),source_url,credit:"Viv Curtis",
   license:String(find(row,"license")||"Unverified; check rights before reuse")});
  if(rows.length>=100)break;
 }
 return json({ok:true,provider:"Viv Curtis Flickr public index",source_updated_at:catalog.updated_at||null,total:(catalog.rows||[]).length,results:rows});
}


// Safe, read-only adapter to the existing Tivvy Live collector.
// Southern League, FootballWebPages and official X updates stay in their existing
// shared collector, avoiding duplicate paid API requests or independent scrapers.
// ESPN is not present in the verified collector source and is NOT represented as live.
async function existingLiveSources(url){
 const date=String(url.searchParams.get("date")||"");
 if(!/^202[6-9]-\d{2}-\d{2}$/.test(date))return failure("Provide a valid date YYYY-MM-DD",400);
 const type=url.searchParams.get("view")==="audit"?"log":"live";
 const origin="https://tivvy-live-collector.nickabull.workers.dev/";
 let res;try{res=await fetch(origin+type+"?date="+date,{cf:{cacheTtl:20,cacheEverything:true}})}
 catch{return json({ok:false,error:"Existing live collector unavailable"},503)}
 if(!res.ok)return json({ok:false,error:"Live collector returned HTTP "+res.status},503);
 const content=await res.text();
 if(content.length>3_000_000)return failure("Live source data too large for preview",413);
 let data;try{data=JSON.parse(content)}catch{return failure("Invalid live collector response",502)}
 return json({ok:true,provider:"Existing Tivvy Live collector",queriedDate:date,
  sources:["Southern League API","FootballWebPages cross-check","Official club X API when enabled"],
  espnConnected:false,data});
}

// Authenticated, read-only cloud vault. Hosted on this Worker origin so Access
// cookies and the same-origin API never have to be exposed to GitHub Pages.
function storagePortal(){
 const html=`<!doctype html><html lang="en"><meta charset="utf-8">
 <meta name="viewport" content="width=device-width,initial-scale=1">
 <title>Tivvy V3 Cloud Vault</title>
 <style>body{font:15px system-ui,Arial;background:#18191b;color:#eee;margin:0}
 main{max-width:950px;margin:auto;padding:24px}h1{color:#ffda00}
 button,select{background:#303237;color:#fff;border:1px solid #777;border-radius:4px;padding:10px;cursor:pointer}
 button:disabled{opacity:.45;cursor:not-allowed}a{color:#ffda00}section{border:1px solid #505050;padding:17px;margin:14px 0;border-radius:8px}
 .muted{color:#ccc}.good{color:#8cdb9c}.bad{color:#ffaaa9}
 pre{white-space:pre-wrap;word-break:break-word}#status{font-weight:bold}
 </style><main>
 <h1>TIVVY · CLOUD VAULT</h1>
 <p class="muted">Secure read-only storage view · no browser drafts are uploaded, replaced or deleted here.</p>
 <p id="status" role="status">Checking protected connection…</p>
 <section><h2>Stored issues</h2><button id="refresh">REFRESH LIST</button>
 <p><label for="issue">Choose a cloud issue</label></p><select id="issue"><option value="">Select an issue</option></select>
 <p id="details" class="muted">Nothing selected.</p>
 <button id="download" disabled>DOWNLOAD SELECTED ISSUE JSON</button>
 </section><section><h2>Revision history</h2><button id="history" disabled>LOAD REVISIONS</button><pre id="revisions">No revisions loaded.</pre></section>
 <p class="muted">Local design drafts remain on GitHub Pages in your browser. Cloud edit/sync and full-size R2 migration are not connected. Download is a recovery copy, not an editor restore.</p>
 <p><a href="/cloud-workspace">CLOUD WORKING COPY (EDITING TRIAL)</a> · <a href="/cloud-import">SAFE CLOUD MIGRATION — CREATE VERIFIED COPY</a> · <a href="https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html">RETURN TO DESIGNER</a></p></main>
 <script>
 (()=>{"use strict";
 const $=id=>document.getElementById(id);
 let issueData=null;
 async function get(path){
  const r=await fetch(path,{credentials:"same-origin",cache:"no-store"});
  if(!r.ok)throw Error("HTTP "+r.status+" from "+path);
  const body=await r.json();if(!body.ok)throw Error(body.error||"Request failed");return body;
 }
 function error(e){$("status").textContent="Cloud request failed: "+e.message;$("status").className="bad"}
 async function selected(){
  const id=$("issue").value;issueData=null;$("download").disabled=true;$("history").disabled=true;
  $("revisions").textContent="No revisions loaded.";
  if(!id){$("details").textContent="Nothing selected.";return}
  try{const body=await get("/api/issues/"+encodeURIComponent(id));
   issueData=body;$("details").textContent="Version "+body.version+" · "+body.document.pages.length+" pages · cloud record only";
   $("download").disabled=false;$("history").disabled=false;
  }catch(e){error(e)}
 }
 async function refresh(){
  try{
   const me=await get("/api/me");
   $("status").textContent="Protected connection verified · role: "+me.role;
   $("status").className="good";
   const body=await get("/api/issues");const sel=$("issue");sel.replaceChildren(new Option("Select an issue",""));
   for(const item of body.issues)sel.add(new Option(item.title+" · v"+item.current_version,item.id));
   $("details").textContent=body.issues.length+" cloud issue(s) found. Browser-only artwork is not included.";
   issueData=null;$("download").disabled=true;$("history").disabled=true;$("revisions").textContent="No revisions loaded.";
  }catch(e){error(e)}
 }
 $("refresh").addEventListener("click",refresh);
 $("issue").addEventListener("change",selected);
 $("history").addEventListener("click",async()=>{try{
  const b=await get("/api/issues/"+encodeURIComponent($("issue").value)+"/revisions");
  $("revisions").textContent=b.revisions.map(x=>"Version "+x.version+" · "+x.created_at+" · "+x.summary).join("\\n")||"No revisions found";
 }catch(e){error(e)}});
 $("download").addEventListener("click",()=>{
  if(!issueData)return;
  const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),source:"tivvy-v3-cloud-vault",...issueData},null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="tivvy-cloud-"+$("issue").value+"-v"+issueData.version+".json";a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 });
 refresh();
 })();
 </script></html>`;
 return new Response(html,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","content-security-policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
}


function cloudImportPortal(){
 const html=`<!doctype html><html lang="en"><meta charset="utf-8">
 <meta name="viewport" content="width=device-width,initial-scale=1">
 <title>Tivvy V3 · Protected cloud migration</title>
 <style>
 body{margin:0;background:#171819;color:#f3f3f3;font:15px system-ui,Arial}
 main{max-width:900px;margin:auto;padding:24px}
 h1,h2{color:#ffda00}a{color:#ffda00}section{border:1px solid #545454;border-radius:8px;padding:17px;margin:16px 0}
 button,input{font:inherit}button{background:#ffda00;color:#111;padding:12px;border:0;border-radius:4px;font-weight:bold;cursor:pointer}
 button:disabled{background:#555;color:#aaa;cursor:not-allowed}pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:300px;overflow:auto;background:#222;padding:12px}
 .note{color:#ccc}.bad{color:#ff9999}.good{color:#9beca2}
 </style><main>
 <h1>TIVVY · SAFE CLOUD MIGRATION</h1>
 <p class="note">Creates a separate, versioned cloud copy. Your original programme in this browser is not replaced, edited or deleted.</p>
 <p id="identity" role="status">Verifying administrator access…</p>
 <section><h2>0. Check cloud storage safely</h2><p class="note">Creates a disposable issue, verifies one tiny PNG in R2 byte-for-byte and checks D1 versioned recovery. It never touches your real programme.</p><button id="storageTest" disabled>RUN DISPOSABLE STORAGE TEST</button><pre id="testResult">Not tested in this browser session.</pre></section>
 <section>
 <h2>1. Choose the full local backup</h2>
 <p>In Programme Designer, use BACKUP JSON first. Choose that downloaded complete issue backup here. The smaller readiness report cannot be migrated.</p>
 <input id="source" type="file" accept=".json,application/json">
 <p><button id="inspect" disabled>ANALYSE BACKUP — NO UPLOAD</button></p>
 <pre id="report">No backup selected.</pre>
 </section>
 <section>
 <h2>2. Make a separate cloud copy</h2>
 <p class="note">The source file must pass validation. Images are transferred as their unchanged original bytes, downloaded again and SHA-256 checked. Duplicate image bytes are uploaded only once. If anything fails, this stage stays incomplete and the browser original is untouched.</p>
 <button id="migrate" disabled>UPLOAD VERIFIED CLOUD COPY</button>
 <p id="progress" role="status">No cloud upload started.</p>
 <pre id="log"></pre>
 </section>
 <section><h2>3. Recover a completed cloud archive (read-only)</h2>
 <p class="note">After an archival import reaches version 2, reconstruct a full browser-compatible JSON backup containing the byte-identical original image files. No browser drafts are overwritten. This can consume substantial browser memory for a 316 MB programme.</p>
 <p><button id="listArchives" disabled>FIND CLOUD ARCHIVES</button></p>
 <select id="archive" aria-label="Choose completed archive"><option value="">Select a completed cloud archive</option></select>
 <p><button id="recoverArchive" disabled>VERIFY AND DOWNLOAD PORTABLE BACKUP</button></p>
 <pre id="recoverStatus">No archival recovery requested.</pre>
 </section>
 <p class="note"><strong>Limits:</strong> 95 MB single image upload; 3 MB metadata JSON. Assets above 95 MB need multipart support. Unsupported embedded formats are blocked until reviewed. Reference-only source PDF images stored in a separate browser database are not part of the issue JSON backup. This is an archival cloud copy, not yet automatic live editor sync.</p>
 <p><a href="/cloud-workspace">OPEN CLOUD WORKING COPY (EDITING TRIAL)</a> · <a href="/cloud-vault">RETURN TO CLOUD VAULT</a></p>
 </main>
 <script>
 (()=>{"use strict";
 const $=id=>document.getElementById(id),encoder=new TextEncoder();
 const allowed=new Set(["image/png","image/jpeg","image/webp","image/gif","image/avif","application/pdf"]);
 const limit=95000000;
 let prepared=null,busy=false;
 function line(t){$("log").textContent+=t+"\\n";$("log").scrollTop=$("log").scrollHeight}
 function fail(e){$("progress").textContent="NOT COMPLETE: "+e.message;$("progress").className="bad";line("FAILED: "+e.message)}
 async function api(path,opts){
   const res=await fetch(path,{credentials:"same-origin",cache:"no-store",...opts});
   let body;try{body=await res.json()}catch{throw Error(path+" returned HTTP "+res.status)}
   if(!res.ok||!body.ok)throw Error((body.error||path+" HTTP "+res.status));
   return body;
 }
 async function identity(){
   try{const me=await api("/api/me");
     if(!["admin","editor"].includes(me.role))throw Error("Editor or admin role required");
     $("identity").textContent="Authenticated · "+me.role;$("identity").className="good";$("inspect").disabled=false;$("storageTest").disabled=false;$("listArchives").disabled=false;
   }catch(e){$("identity").textContent="Access unavailable: "+e.message;$("identity").className="bad"}
 }
 function decode(uri){
   const match=/^data:([^;,]+)(;base64)?,(.*)$/is.exec(uri);
   if(!match)return null;
   const mime=match[1].toLowerCase();
   const raw=match[2]?atob(match[3]):decodeURIComponent(match[3]);
   const data=Uint8Array.from(raw,c=>c.charCodeAt(0));
   return {mime,data};
 }
 async function sha(bytes){
   const digest=await crypto.subtle.digest("SHA-256",bytes);
   return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,"0")).join("");
 }
 // Visit every nested image value; no code or HTML is ever evaluated.
 function visit(value,handler,path="",seen=new WeakSet()){
   if(typeof value==="string"){
     if(value.startsWith("data:"))handler(value,path);
     return;
   }
   if(!value||typeof value!=="object"||seen.has(value))return;
   seen.add(value);
   for(const [key,child] of Object.entries(value))visit(child,handler,path+"/"+key,seen);
 }
 function replaceUrls(value,assetMap){
   if(typeof value==="string"&&value.startsWith("data:")){
     const rec=assetMap.get(value);
     if(!rec)throw Error("An embedded asset was not verified");
     return {v3CloudAsset:rec.asset_id,mime_type:rec.mime,sha256:rec.sha,size:rec.size};
   }
   if(Array.isArray(value))return value.map(x=>replaceUrls(x,assetMap));
   if(value&&typeof value==="object")
     return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,replaceUrls(v,assetMap)]));
   return value;
 }
 async function inspect(){
   if(busy)return;busy=true;$("migrate").disabled=true;prepared=null;
   $("report").textContent="Reading and validating backup file…";$("log").textContent="";
   try{
     const file=$("source").files[0];if(!file)throw Error("Select a full issue JSON backup");
     if(file.size>550000000)throw Error("Backup exceeds this browser migration tool's 550 MB inspection limit");
     const content=JSON.parse(await file.text());
     if(content.format!=="tivvy-v3-draft-v2"||!Array.isArray(content.pages)||!content.layerData)
       throw Error("This is not a full Tivvy V3 issue BACKUP JSON");
     if(content.pages.length<1||content.pages.length>300)throw Error("Invalid page count");
     const targets=[],trashTargets=[],problems=[],occurrences=[],seenIds=new Set();
     for(const page of content.pages){
       if(!/^[A-Za-z0-9_-]{1,90}$/.test(page.id)||seenIds.has(page.id))throw Error("Invalid/duplicate page ID");
       seenIds.add(page.id);
       const layers=content.layerData[page.id]||[];
       if(!Array.isArray(layers))throw Error("Invalid layers on "+page.name);
       targets.push({id:page.id,name:String(page.name||"Untitled"),include:page.include,source:page.source,
         mode:page.mode,layers});
       visit(layers,(value,path)=>occurrences.push({value,page:page.name,path}));
     }
     for(const page of content.trash||[]){
       if(!/^[A-Za-z0-9_-]{1,90}$/.test(page.id)||seenIds.has(page.id))throw Error("Invalid/duplicate deleted-page ID");
       seenIds.add(page.id);
       const layers=content.layerData[page.id]||[];
       if(!Array.isArray(layers))throw Error("Invalid recovered layers on "+page.name);
       trashTargets.push({id:page.id,name:String(page.name||"Untitled"),include:false,deletedAt:page.deletedAt,source:page.source,mode:page.mode,layers});
       visit(layers,(value,path)=>occurrences.push({value,page:"RECOVERY: "+page.name,path}));
     }
     const types={},unique=new Map(),encountered=occurrences.length;
     for(let i=0;i<occurrences.length;i++){
       const item=occurrences[i],m=/^data:([^;,]+)(;base64)?,/i.exec(item.value);
       const mime=m?.[1]?.toLowerCase()||"unknown";
       types[mime]=(types[mime]||0)+1;
       if(!allowed.has(mime)){problems.push("Unsupported "+mime+" on "+item.page+" "+item.path);continue}
       const body=item.value.slice(m[0].length);
       const approx=m[2]?Math.floor(body.length*3/4)-(body.endsWith("==")?2:body.endsWith("=")?1:0):new TextEncoder().encode(decodeURIComponent(body)).length;
       if(approx>limit){problems.push("Original over 95 MB on "+item.page+" "+item.path);continue}
       // Same data URL reused by several pages is one upload.
       if(!unique.has(item.value))unique.set(item.value,{mime,size:approx});
     }
     // Existing full backup may contain unsaved source PDF reference pages
     // separately in another IndexedDB database: do not claim a complete print issue.
     const tiny=targets.map(x=>({...x,layers:[]}));
     if(encoder.encode(JSON.stringify({pages:tiny})).length>2900000)problems.push("Metadata alone exceeds D1 limit");
     // Simulate the exact asset-reference schema BEFORE upload, so a D1 size
     // failure cannot come as a surprise after transferring hundreds of MB.
     const placeholders=new Map();
     for(const [value,info] of unique)placeholders.set(value,{
       asset_id:"00000000-0000-4000-8000-000000000000",
       sha:"0".repeat(64),mime:info.mime,size:info.size
     });
     if(!problems.length){
       try{
         const candidate={pages:targets.map(x=>({...x,layers:replaceUrls(x.layers,placeholders)})),
           trash:trashTargets.map(x=>({...x,layers:replaceUrls(x.layers,placeholders)})),
           sourceActivity:content.activity||[],sourceActivePage:content.active||null,
           source:"tivvy-v3-browser-backup",migrationState:"ARCHIVAL_COPY_NOT_EDITOR_READY",
           migratedAt:new Date().toISOString(),sourcePageCount:targets.length,
           assetCount:unique.size,referencePdfArtIncluded:false};
         const bytes=encoder.encode(JSON.stringify({expected_version:1,document:candidate,summary:"Verified lossless artwork migration to archival cloud copy"})).byteLength;
         if(bytes>2900000)problems.push("Cloud metadata would need "+bytes+" bytes (3MB limit); no upload permitted");
       }catch(e){problems.push("Cannot prepare reversible asset references: "+e.message)}
     }
     prepared={content,targets,trashTargets,unique,problems};
     $("report").textContent=[
       "SOURCE: "+file.name+" ("+(file.size/1000000).toFixed(1)+" MB)",
       "Active pages: "+targets.length+" · deleted-page recovery: "+trashTargets.length+" · embedded image occurrences: "+encountered,
       "Distinct data URL values: "+unique.size+" · MIME types: "+JSON.stringify(types),
       "Blocking issues: "+problems.length,
       ...problems.slice(0,30),
       problems.length>30?"... plus "+(problems.length-30)+" more":""
     ].filter(Boolean).join("\\n");
     $("migrate").disabled=problems.length>0;
     $("progress").textContent=problems.length?"Resolve blocking issues first — nothing uploaded.":"Ready for a separately labelled CLOUD COPY. Nothing has been uploaded.";
   }catch(e){$("report").textContent="PREPARATION FAILED: "+e.message;prepared=null;$("progress").textContent="No upload started."}
   finally{busy=false}
 }
 async function migrate(){
   if(busy||!prepared||prepared.problems.length)return;
   busy=true;$("inspect").disabled=true;$("migrate").disabled=true;$("log").textContent="";
   const job="import_"+crypto.randomUUID().replaceAll("-","");
   const root="/api/issues/"+job;
   try{
     if(!confirm("Create a SEPARATE cloud staging copy? Your browser originals remain unchanged. Continue?"))return;
     $("progress").textContent="Creating isolated cloud staging issue…";
     await api("/api/issues",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
       id:job,title:"CLOUD ARCHIVAL COPY · "+new Date().toISOString(),
       document:{pages:[],source:"browser-backup-migration",state:"INCOMPLETE",sourcePageCount:prepared.targets.length}
     })});
     line("Staging issue: "+job+" (version 1, incomplete)");
     let number=0;
     const assetMap=new Map(),hashed=new Map();
     for(const [value,info] of prepared.unique){
       const decoded=decode(value);if(!decoded)throw Error("Unable to decode an embedded image");
       if(decoded.data.byteLength>limit)throw Error("Original exceeds 95 MB");
       const checksum=await sha(decoded.data);
       let record=hashed.get(decoded.mime+":"+checksum);
       if(!record){
         const response=await api(root+"/assets",{
           method:"POST",headers:{"content-type":decoded.mime,"x-file-name":"original-"+checksum.slice(0,16)},
           body:new Blob([decoded.data],{type:decoded.mime})
         });
         const read=await fetch(root+"/assets/"+response.asset_id,{credentials:"same-origin",cache:"no-store"});
         if(!read.ok)throw Error("Asset read-back failed HTTP "+read.status);
         const copy=new Uint8Array(await read.arrayBuffer());
         if(copy.length!==decoded.data.length||await sha(copy)!==checksum)throw Error("Uploaded asset checksum mismatch");
         record={asset_id:response.asset_id,sha:checksum,size:copy.length,mime:decoded.mime};
         hashed.set(decoded.mime+":"+checksum,record);
       }
       assetMap.set(value,record);
       number++;
       $("progress").textContent="Verified "+number+" of "+prepared.unique.size+" image values";
       line("Verified asset "+number+"/"+prepared.unique.size+" · "+(record.size/1000000).toFixed(2)+" MB");
       await new Promise(done=>setTimeout(done,0));
     }
     const doc={pages:prepared.targets.map(x=>({...x,layers:replaceUrls(x.layers,assetMap)})),
       trash:prepared.trashTargets.map(x=>({...x,layers:replaceUrls(x.layers,assetMap)})),
       sourceActivity:prepared.content.activity||[], sourceActivePage:prepared.content.active||null,
       source:"tivvy-v3-browser-backup",migrationState:"ARCHIVAL_COPY_NOT_EDITOR_READY",
       migratedAt:new Date().toISOString(),sourcePageCount:prepared.targets.length,
       assetCount:hashed.size,referencePdfArtIncluded:false};
     const json=JSON.stringify({expected_version:1,document:doc,summary:"Verified lossless artwork migration to archival cloud copy"});
     if(encoder.encode(json).length>3000000)throw Error("Cloud layout exceeds 3MB limit, staging issue remains incomplete");
     const saved=await api(root,{method:"PUT",headers:{"content-type":"application/json"},body:json});
     const checked=await api(root);
     if(saved.version!==2||checked.version!==2||checked.document.pages.length!==doc.pages.length)
       throw Error("Final cloud snapshot read-back mismatch");
     $("progress").textContent="ARCHIVAL CLOUD COPY VERIFIED · "+doc.pages.length+" pages · "+hashed.size+" distinct originals · "+job;
     $("progress").className="good";
     line("Cloud staging now version 2. Browser original untouched. Reference PDF source library still not migrated.");
   }catch(e){fail(e);line("Any cloud staging issue remains marked incomplete until a version-2 save succeeds.")}
   finally{busy=false;$("inspect").disabled=false;$("migrate").disabled=!prepared||prepared.problems.length>0}
 }
 // Rebuild the browser backup ONLY from a completed, versioned archival copy.
 // Download every distinct cloud asset once and verify the original bytes.
 function hydrate(value,urls){
  if(value&&typeof value==="object"&&!Array.isArray(value)&&typeof value.v3CloudAsset==="string"){
   const found=urls.get(value.v3CloudAsset);
   if(!found)throw Error("Missing verified artwork "+value.v3CloudAsset);
   return found;
  }
  if(Array.isArray(value))return value.map(x=>hydrate(x,urls));
  if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,hydrate(v,urls)]));
  return value;
 }
 $("listArchives").addEventListener("click",async()=>{
  const status=$("recoverStatus"),select=$("archive");
  $("recoverArchive").disabled=true;select.replaceChildren(new Option("Select a completed cloud archive",""));
  try{
   const data=await api("/api/issues");let completed=0;
   for(const x of data.issues){
    if(x.current_version<2||!x.id.startsWith("import_"))continue;
    const document=await api("/api/issues/"+encodeURIComponent(x.id));
    if(document.document?.migrationState!=="ARCHIVAL_COPY_NOT_EDITOR_READY")continue;
    select.add(new Option(x.title+" · v"+document.version,x.id));completed++;
   }
   status.textContent="Found "+completed+" completed archival copies. Source PDF reference library is not included.";
  }catch(e){status.textContent="Unable to load archives: "+e.message}
 });
 $("archive").addEventListener("change",()=>{$("recoverArchive").disabled=!$("archive").value});
 $("recoverArchive").addEventListener("click",async()=>{
  if(busy)return;busy=true;const btn=$("recoverArchive"),status=$("recoverStatus");
  btn.disabled=true;status.textContent="Loading completed archive…";
  try{
   const id=$("archive").value;
   if(!id.startsWith("import_"))throw Error("Select a completed archival issue");
   const data=await api("/api/issues/"+encodeURIComponent(id));
   const doc=data.document;
   if(data.version<2||doc.migrationState!=="ARCHIVAL_COPY_NOT_EDITOR_READY")throw Error("Archive is not marked complete");
   const records=new Map();
   visit(doc,(value)=>{}, ""); // Does not modify archival metadata.
   function collect(node){
    if(Array.isArray(node)){for(const x of node)collect(x);return}
    if(!node||typeof node!=="object")return;
    if(typeof node.v3CloudAsset==="string"){
      const old=records.get(node.v3CloudAsset);
      if(old&&(old.sha256!==node.sha256||old.mime_type!==node.mime_type))throw Error("Inconsistent asset metadata");
      records.set(node.v3CloudAsset,node);return;
    }
    for(const value of Object.values(node))collect(value);
   }
   collect(doc.pages);collect(doc.trash||[]);
   const urls=new Map();let processed=0;
   for(const [assetId,record] of records){
    const response=await fetch("/api/issues/"+encodeURIComponent(id)+"/assets/"+encodeURIComponent(assetId),{credentials:"same-origin",cache:"no-store"});
    if(!response.ok)throw Error("Cannot retrieve asset "+assetId+" HTTP "+response.status);
    const image=new Uint8Array(await response.arrayBuffer());
    if(image.byteLength!==record.size||await sha(image)!==record.sha256)throw Error("Restored asset SHA-256/size mismatch: "+assetId);
    // Encode the exact verified bytes; preserve their original MIME and data URI format.
    let binary="";const chunk=32768;
    for(let off=0;off<image.length;off+=chunk)binary+=String.fromCharCode(...image.subarray(off,off+chunk));
    urls.set(assetId,"data:"+record.mime_type+";base64,"+btoa(binary));
    processed++;status.textContent="Restored and verified "+processed+"/"+records.size+" distinct originals…";
    await new Promise(done=>setTimeout(done,0));
   }
   const active=doc.pages.map(p=>({id:p.id,name:p.name,include:p.include,source:p.source,mode:p.mode}));
   const trash=(doc.trash||[]).map(p=>({id:p.id,name:p.name,include:false,source:p.source,mode:p.mode,deletedAt:p.deletedAt}));
   const layerData={};
   for(const page of [...doc.pages,...(doc.trash||[])])layerData[page.id]=hydrate(page.layers,urls);
   const portable={format:"tivvy-v3-draft-v2",created:new Date().toISOString(),issue:"Recovered cloud archival copy",
     pages:active,trash,active:doc.sourceActivePage||active[0]?.id||null,layerData,activity:doc.sourceActivity||[],
     storage:"Restored from verified R2 + D1 archival cloud copy; PDF reference images NOT included"};
   const json=JSON.stringify(portable);
   const blob=new Blob([json],{type:"application/json"});
   const link=document.createElement("a");link.href=URL.createObjectURL(blob);
   link.download="tivvy-cloud-recovered-"+id+".json";link.click();
   setTimeout(()=>URL.revokeObjectURL(link.href),30000);
   status.textContent="PORTABLE BACKUP GENERATED · "+active.length+" pages · "+records.size+" original assets verified · "+(blob.size/1000000).toFixed(1)+" MB. Downloaded locally. Original browser drafts unchanged. PDF reference art not included.";
  }catch(e){status.textContent="RECOVERY NOT COMPLETE: "+e.message+". Original browser drafts unchanged."}
  finally{busy=false;btn.disabled=false}
 });
 $("storageTest").addEventListener("click",async()=>{
  if(busy)return;busy=true;const btn=$("storageTest"),out=$("testResult");
  btn.disabled=true;out.textContent="Testing a disposable D1 issue and R2 PNG…";
  try{
   const id="smoke_"+crypto.randomUUID().replaceAll("-",""),root="/api/issues/"+id;
   const bytes=Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+nmh8AAAAASUVORK5CYII="),x=>x.charCodeAt(0));
   const hash=await sha(bytes);
   await api("/api/issues",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
    id,title:"DISPOSABLE CLOUD STORAGE TEST",document:{pages:[{id:"test",name:"Test only",layers:[]}]}
   })});
   const a=await api(root+"/assets",{method:"POST",headers:{"content-type":"image/png","x-file-name":"disposable-test.png"},body:new Blob([bytes],{type:"image/png"})});
   const response=await fetch(root+"/assets/"+a.asset_id,{credentials:"same-origin",cache:"no-store"});
   if(!response.ok)throw Error("Asset read-back HTTP "+response.status);
   const copy=new Uint8Array(await response.arrayBuffer());
   if(copy.length!==bytes.length||await sha(copy)!==hash)throw Error("PNG checksum mismatch");
   const document={pages:[{id:"test",name:"Verified test",layers:[]}],testAsset:a.asset_id};
   const saved=await api(root,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({expected_version:1,document,summary:"Disposable storage and checksum verified"})});
   const check=await api(root);
   if(saved.version!==2||check.version!==2||check.document.testAsset!==a.asset_id)throw Error("D1 version/read-back mismatch");
   out.textContent="PASS: D1 versioned save, R2 original byte upload/download, matching SHA-256. No real artwork changed. Disposable issue: "+id;
   out.className="good";
  }catch(e){out.textContent="FAIL: "+e.message+". Do not upload your real backup yet.";out.className="bad"}
  finally{busy=false;btn.disabled=false}
 });
 $("source").addEventListener("change",()=>{$("migrate").disabled=true;prepared=null;$("report").textContent="Backup selected. Click ANALYSE BACKUP."});
 $("inspect").addEventListener("click",inspect);
 $("migrate").addEventListener("click",migrate);
 identity();
 })();
 <\/script></html>`;
 return new Response(html,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","content-security-policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
}


function cloudWorkspacePortal(){
 const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
 <title>Tivvy V3 · Cloud editing trial</title>
 <style>
 *{box-sizing:border-box}body{margin:0;background:#151619;color:#eee;font:14px system-ui,Arial}main{max-width:1250px;margin:auto;padding:20px}
 h1{font-size:28px;color:#ffda00;margin:0 0 9px}h2{font-size:18px}a{color:#ffda00}
 button,input,select,textarea{font:inherit}button,select,input,textarea{background:#2c2e33;border:1px solid #676971;color:#fff;padding:9px;border-radius:4px}
 button{cursor:pointer}button:disabled{opacity:.4;cursor:not-allowed}.gold{background:#ffda00;color:#151515;border-color:#ffda00;font-weight:bold}
 .box{border:1px solid #484b52;border-radius:7px;padding:14px;margin:14px 0}.muted{color:#c7c9cf}.good{color:#92e5a4}.bad{color:#ff9999}
 #layout{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:18px;align-items:start}
 #previewWrap{overflow:auto;max-height:76vh;background:#292b31;padding:12px}
 #pagePreview{position:relative;width:595px;height:842px;background:white;color:#191919;transform-origin:top left;overflow:hidden;box-shadow:0 2px 12px #0008}
 .layer{position:absolute;overflow:hidden;white-space:pre-wrap;overflow-wrap:anywhere;border:1px solid transparent;cursor:pointer}
 .layer.selected{border:2px dashed #dcb900;z-index:9999!important}.layer.missing{background:#ddd;color:#777;display:grid;place-items:center}
 .layer img{width:100%;height:100%;object-fit:fill;display:block}
 label{display:block;font-size:12px;margin:8px 0 3px;color:#bbb}.input{width:100%}
 .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}#layers{max-height:190px;overflow:auto}#layers button{display:block;text-align:left;width:100%;margin:3px 0;font-size:12px}
 #status{min-height:21px}#hidden{display:none}@media(max-width:940px){#layout{display:block}#pagePreview{transform:scale(.65);margin-bottom:-295px}#previewWrap{max-height:600px}}
 </style><main>
 <h1>TIVVY · CLOUD WORKING COPY</h1>
 <p class="muted">Protected experimental editor. Creates a separate working copy of a completed cloud archive. The historical cloud archive and browser drafts remain unchanged.</p>
 <p id="auth" role="status">Checking access…</p>
 <section class="box"><h2>Choose a programme</h2>
 <button id="refresh">REFRESH CLOUD ISSUES</button>
 <label for="existing">Open an existing cloud working copy</label><select class="input" id="existing"><option value="">Select a working copy</option></select>
 <button id="open" disabled>OPEN WORKING COPY</button>
 <label for="archive">Or create a new working copy from a verified archive</label>
 <select class="input" id="archive"><option value="">Select a verified archive</option></select>
 <button class="gold" id="clone" disabled>CREATE SEPARATE WORKING COPY</button>
 </section>
 <section class="box" id="workspace" hidden>
 <h2 id="issueTitle">Working copy</h2>
 <p id="version" class="muted"></p>
 <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
 <label for="page" style="margin:0">Page</label><select id="page"></select>
 <button id="save" class="gold" disabled>SAVE NOW / RETRY CLOUD SYNC</button>
 <button id="reload">RELOAD CLOUD VERSION</button>
 </div>
 <p id="status" role="status" class="muted">Select a layer to edit.</p>
 <div id="layout"><div id="previewWrap"><div id="pagePreview"></div></div>
 <aside>
 <h2>Layers on this page</h2><div id="layers"></div>
 <h2>Insert cloud artwork</h2><input class="input" id="librarySearch" placeholder="Search saved original photos…">
 <button id="findLibrary">FIND ARTWORK</button><div id="libraryResults" style="max-height:200px;overflow:auto"></div>
 <div id="properties" hidden>
 <h2>Edit selected layer</h2><label for="layerName">Layer name</label><input class="input" id="layerName">
 <label for="textValue">Editable text</label><textarea class="input" id="textValue" rows="6"></textarea>
 <div class="grid"><div><label for="x">X</label><input class="input" id="x" type="number" step=".1"></div>
 <div><label for="y">Y</label><input class="input" id="y" type="number" step=".1"></div>
 <div><label for="w">Width</label><input class="input" id="w" type="number" step=".1"></div>
 <div><label for="h">Height</label><input class="input" id="h" type="number" step=".1"></div></div>
 <p class="muted" id="layerInfo"></p>
 </div></aside></div>
 </section>
 <p class="muted"><strong>Trial limitations:</strong> text/position editing and cloud revisions with debounced autosave and local emergency backup. Not yet the full V3 canvas editor, no source PDF reference images, no complete print PDF. Original PNG, JPEG and AVIF images are served directly from their verified private R2 objects; no conversion or compression.</p>
 <p><a href="/full-designer">OPEN ORIGINAL FULL V3 DESIGNER · CLOUD TRIAL</a> · <a href="/cloud-import">ARCHIVE AND RECOVERY</a> · <a href="/cloud-vault">CLOUD VAULT</a></p>
 </main><script>
 (()=>{"use strict";
 const $=id=>document.getElementById(id);
 let role="",record=null,selectedPage=0,selectedLayer=-1,dirty=false;
 let saveTimer=null,saveInFlight=false,editSerial=0,saveBlocked=false;
 const backupKey=id=>"tivvy-cloud-unsaved-"+id;
 function safeLocalBackup(){
  if(!record||!dirty)return true;
  try{
   const json=JSON.stringify({savedAt:new Date().toISOString(),version:record.version,document:record.document});
   localStorage.setItem(backupKey(record.issue.id),json);return true;
  }catch(e){state("WARNING: Browser could not retain unsaved backup: "+e.message+". Keep this tab open until cloud saving succeeds.",true);return false}
 }
 function scheduleCloudSave(){
  if(!record||!dirty||saveBlocked)return;
  clearTimeout(saveTimer);
  const backed=safeLocalBackup();
  if(backed)state("Unsaved changes backed up locally; cloud autosave pending…");
  saveTimer=setTimeout(()=>saveCloud(true),1800);
 }
 async function api(path,options){
  const r=await fetch(path,{credentials:"same-origin",cache:"no-store",...options});
  let j;try{j=await r.json()}catch{throw Error(path+" HTTP "+r.status)}
  if(!r.ok||!j.ok)throw Error(j.error||"HTTP "+r.status);return j;
 }
 function state(message,bad=false){$("status").textContent=message;$("status").className=bad?"bad":"muted"}
 const editable=()=>role==="admin"||role==="editor";
 const layers=()=>record?.document.pages[selectedPage]?.layers||[];
 const imageUrl=assetId=>"/api/issues/"+encodeURIComponent(record.document.assetSourceIssueId||record.issue.id)+"/assets/"+encodeURIComponent(assetId);
 function boxStyle(el,l){
   for(const prop of ["x","y","w","h"]){const val=Number(l[prop]);if(!Number.isFinite(val))return}
   el.style.left=(Number(l.x)||0)+"px";el.style.top=(Number(l.y)||0)+"px";
   el.style.width=Math.max(1,Number(l.w)||100)+"px";el.style.height=Math.max(1,Number(l.h)||35)+"px";
   el.style.transform="rotate("+Math.max(-360,Math.min(360,Number(l.rotate)||0))+"deg)";
   el.style.zIndex=String(Math.max(0,Math.min(999,Number(l.z)||0)));
   el.style.opacity=String(Math.max(0,Math.min(1,1-(Number(l.transparency)||0)/100)));
 }
 function render(){
  if(!record)return;
  const page=record.document.pages[selectedPage];
  if(!page)return;
  $("issueTitle").textContent=record.issue.title+" · "+page.name;
  $("version").textContent="Cloud version "+record.version+" · "+record.document.pages.length+" pages · protected workspace";
  const canvas=$("pagePreview");canvas.replaceChildren();
  const list=$("layers");list.replaceChildren();
  layers().forEach((l,i)=>{
   if(!l||typeof l!=="object")return;
   const choose=document.createElement("button");choose.type="button";
   choose.textContent=(i===selectedLayer?"● ":"")+"#"+(i+1)+" "+(l.name||l.type||"Layer");
   choose.onclick=()=>selectLayer(i);list.append(choose);
   if(l.hidden)return;
   const el=document.createElement("div");el.className="layer"+(selectedLayer===i?" selected":"");boxStyle(el,l);
   if(l.type==="text"){
    el.textContent=String(l.text||"");
    el.style.fontFamily=String(l.family||l.fontFamily||"Arial,sans-serif").slice(0,90);
    el.style.fontSize=Math.max(5,Math.min(120,Number(l.font)||22))+"px";
    el.style.fontWeight=String(l.weight||"normal");
    el.style.textAlign=["left","center","right","justify"].includes(l.align)?l.align:"left";
    el.style.color=/^#[0-9a-fA-F]{3,8}$/.test(l.color||"")?l.color:"#161616";
   }else if(l.type==="image"){
    const ref=l.src?.v3CloudAsset;
    const lib=l.src?.v3LibraryAsset;
    if(typeof ref==="string"||typeof lib==="string"){
     const image=document.createElement("img");
     image.src=typeof lib==="string"?"/api/library/assets/"+encodeURIComponent(lib)+"/original":imageUrl(ref);
     image.alt=l.name||"Cloud artwork";image.loading="lazy";el.append(image);
    }else {el.classList.add("missing");el.textContent="Reference image not available in cloud"}
   }else{
    el.style.background=/^#[0-9a-fA-F]{3,8}$/.test(l.color||"")?l.color:"transparent";
   }
   el.onclick=()=>selectLayer(i);canvas.append(el);
  });
  $("save").disabled=!editable()||!dirty;
 }
 function selectLayer(i){
  selectedLayer=i;const l=layers()[i];
  $("properties").hidden=!l;
  if(!l){render();return}
  $("layerName").value=String(l.name||"");
  $("textValue").value=String(l.text||"");
  $("textValue").disabled=l.type!=="text";
  $("layerInfo").textContent="Type: "+String(l.type||"other")+". Original artwork bytes are not modified here.";
  for(const k of ["x","y","w","h"])$(k).value=Number(l[k])||0;
  render();
 }
 function change(k,value){
  if(!record||selectedLayer<0)return;const l=layers()[selectedLayer];if(!l)return;
  if(k==="text"&&l.type!=="text")return;
  if(["x","y","w","h"].includes(k)){
   const n=Number(value);if(!Number.isFinite(n)||n<-1000||n>5000)return;
   l[k]=n;
  }else l[k]=String(value).slice(0,k==="text"?50000:200);
  dirty=true;editSerial++;render();scheduleCloudSave();
 }
 $("layerName").oninput=e=>change("name",e.target.value);
 $("textValue").oninput=e=>change("text",e.target.value);
 for(const k of ["x","y","w","h"])$(k).onchange=e=>change(k,e.target.value);
 function load(data){
  clearTimeout(saveTimer);record=data;dirty=false;saveBlocked=false;selectedPage=0;selectedLayer=-1;
  const stored=localStorage.getItem(backupKey(data.issue.id));
  if(stored){
   try{
    const local=JSON.parse(stored);
    if(local.version===data.version&&JSON.stringify(local.document)!==JSON.stringify(data.document)){
     if(confirm("Unsaved local backup found from "+local.savedAt+". Restore it into this working copy without overwriting cloud until autosave confirms?")){
      record.document=local.document;dirty=true;editSerial++;scheduleCloudSave();
     }
    }else if(local.version!==data.version)state("An older unsaved local backup exists. Cloud version has advanced. Export before manually reconciling.",true);
   }catch(e){state("Saved browser recovery data could not be read. Keep this tab open.",true)}
  }
  const sel=$("page");sel.replaceChildren();
  record.document.pages.forEach((p,i)=>sel.add(new Option((i+1)+". "+p.name,i)));
  $("workspace").hidden=false;$("properties").hidden=true;render();
  state("Cloud working copy opened. Select a layer to edit.");
 }
 async function refresh(){
  try{
   const data=await api("/api/issues"),archive=$("archive"),existing=$("existing");
   archive.replaceChildren(new Option("Select a verified archive",""));existing.replaceChildren(new Option("Select a working copy",""));
   for(const x of data.issues){
    if(x.id.startsWith("import_")&&x.current_version>=2){
     const d=await api("/api/issues/"+encodeURIComponent(x.id));
     if(d.document?.migrationState==="ARCHIVAL_COPY_NOT_EDITOR_READY")archive.add(new Option(x.title,x.id));
    }else if(x.id.startsWith("work_")){
     const d=await api("/api/issues/"+encodeURIComponent(x.id));
     if(d.document?.migrationState==="CLOUD_EDIT_TRIAL")existing.add(new Option(x.title+" · v"+x.current_version,x.id));
    }
   }
   $("clone").disabled=!editable()||!archive.value;
   $("open").disabled=!existing.value;
  }catch(e){$("auth").textContent="Cloud listing failed: "+e.message;$("auth").className="bad"}
 }
 $("archive").onchange=()=>{$("clone").disabled=!editable()||!$("archive").value};
 $("existing").onchange=()=>{$("open").disabled=!$("existing").value};
 $("open").onclick=async()=>{
  if(dirty&&!confirm("Discard unsaved trial edits and open the selected cloud version?"))return;
  try{const d=await api("/api/issues/"+encodeURIComponent($("existing").value));
   if(d.document?.migrationState!=="CLOUD_EDIT_TRIAL")throw Error("Not a cloud working copy");
   load(d)}catch(e){state(e.message,true)}
 };
 $("clone").onclick=async()=>{
  const source=$("archive").value;if(!source)return;
  if(!confirm("Create an independent editable trial from this archived issue? The archive remains unchanged."))return;
  $("clone").disabled=true;
  try{
   const original=await api("/api/issues/"+encodeURIComponent(source));
   if(original.version<2||original.document?.migrationState!=="ARCHIVAL_COPY_NOT_EDITOR_READY")throw Error("Source archive not verified");
   const copy=structuredClone(original.document);
   copy.migrationState="CLOUD_EDIT_TRIAL";copy.assetSourceIssueId=source;
   copy.derivedFromArchive=source;copy.cloudTrialStartedAt=new Date().toISOString();
   const id="work_"+crypto.randomUUID().replaceAll("-","");
   await api("/api/issues",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
    id,title:"CLOUD EDIT TRIAL · "+new Date().toISOString(),document:copy
   })});
   const result=await api("/api/issues/"+id);load(result);
   state("New independent cloud working copy created. Historical archive and original browser drafts unchanged.");
  }catch(e){state("Could not create working copy: "+e.message,true)}
  finally{$("clone").disabled=false}
 };
 $("page").onchange=e=>{selectedPage=Number(e.target.value);selectedLayer=-1;$("properties").hidden=true;render()};
 $("reload").onclick=async()=>{
  if(!record)return;if(dirty&&!confirm("Discard unsaved changes and reload last cloud revision?"))return;
  try{const d=await api("/api/issues/"+encodeURIComponent(record.issue.id));load(d)}catch(e){state(e.message,true)}
 };
 async function saveCloud(automatic=false){
  if(!record||!dirty||!editable()||saveInFlight||saveBlocked)return;
  clearTimeout(saveTimer);saveInFlight=true;$("save").disabled=true;
  const id=record.issue.id,expected=record.version,serial=editSerial;
  const snapshot=structuredClone(record.document);
  state(automatic?"Autosaving cloud revision…":"Saving cloud revision…");
  try{
   const res=await api("/api/issues/"+encodeURIComponent(id),{method:"PUT",headers:{"content-type":"application/json"},
    body:JSON.stringify({expected_version:expected,document:snapshot,summary:automatic?"Autosave from protected cloud editor":"Manual save from protected cloud editor",
      page_id:record.document.pages[selectedPage]?.id,layer_id:layers()[selectedLayer]?.id||null})
   });
   if(res.version!==expected+1)throw Error("Unexpected cloud version returned");
   const latest=await api("/api/issues/"+encodeURIComponent(id));
   if(latest.version!==res.version||JSON.stringify(latest.document)!==JSON.stringify(snapshot))
     throw Error("Cloud save read-back does not match requested revision");
   record.version=latest.version;record.issue=latest.issue;
   if(serial===editSerial){
    record.document=latest.document;dirty=false;localStorage.removeItem(backupKey(id));
    render();state("CLOUD AUTOSAVED & VERIFIED · v"+latest.version+" · "+new Date().toLocaleTimeString());
   }else{
    // User typed while the save was in flight: their newer local edits take priority.
    dirty=true;render();state("Cloud saved v"+latest.version+"; newer edits pending autosave.");
   }
  }catch(e){
   saveBlocked=true;dirty=true;safeLocalBackup();
   state("CLOUD SAVE FAILED / CONFLICT: "+e.message+". Local recovery copy retained. Do not reload; reconcile before retrying.",true);
  }finally{
   saveInFlight=false;$("save").disabled=!dirty||!editable();
   if(dirty&&!saveBlocked)scheduleCloudSave();
  }
 }
 $("save").onclick=()=>{saveBlocked=false;saveCloud(false)};
 window.addEventListener("beforeunload",e=>{
  if(dirty){safeLocalBackup();e.preventDefault();e.returnValue=""}
 });
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden"&&dirty&&!saveInFlight&&!saveBlocked)saveCloud(true)});

 $("findLibrary").onclick=async()=>{
  const box=$("libraryResults");box.textContent="Searching original artwork…";
  try{
   const data=await api("/api/library/assets?status=active&q="+encodeURIComponent($("librarySearch").value.trim()));
   box.replaceChildren();
   if(!data.items.length){box.textContent="No matching saved originals.";return}
   for(const item of data.items){
    const btn=document.createElement("button");btn.type="button";btn.style.display="block";btn.style.width="100%";
    btn.textContent="ADD · "+(item.title||item.original_filename)+" · "+(item.credit||"credit unknown");
    btn.disabled=!editable()||!record||!item.mime_type.startsWith("image/");
    btn.onclick=()=>{
     if(!record||!editable())return;
     const page=record.document.pages[selectedPage];
     if(!page)return;
     const layer={id:"lib-"+crypto.randomUUID().slice(0,12),name:item.title||item.original_filename,
      type:"image",src:{v3LibraryAsset:item.id,mime_type:item.mime_type},
      x:45,y:100,w:280,h:180,z:(page.layers||[]).length+1,
      locked:false,hidden:false,transparency:0,scale:100,rotate:0};
     page.layers=page.layers||[];page.layers.push(layer);
     selectedLayer=page.layers.length-1;dirty=true;editSerial++;
     render();selectLayer(selectedLayer);scheduleCloudSave();
     state("Added original cloud artwork reference; awaiting verified autosave. Photographer: "+(item.credit||"unspecified"));
    };
    box.append(btn);
   }
  }catch(e){box.textContent="Artwork search failed: "+e.message}
 };
 $("refresh").onclick=refresh;
 (async()=>{try{const me=await api("/api/me");role=me.role;$("auth").textContent="Protected connection verified · "+role;$("auth").className="good";await refresh()}
  catch(e){$("auth").textContent="Access denied: "+e.message;$("auth").className="bad"}})();
 })();
 <\/script></html>`;
 return new Response(html,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","content-security-policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
}


function assetLibraryPortal(){
 const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
 <title>Tivvy · Original artwork library</title>
 <style>
 :root{--gold:#ffda00}*{box-sizing:border-box}body{font:14px system-ui,Arial;background:#17181a;color:#eee;margin:0}
 main{max-width:1200px;margin:auto;padding:24px}h1{color:var(--gold);font-size:29px;margin:0 0 12px}
 h2{color:var(--gold);font-size:19px}section{border:1px solid #505256;border-radius:8px;padding:18px;margin:16px 0}
 label{display:block;font-size:12px;color:#ccc;margin:10px 0 4px}
 input,select,textarea,button{font:inherit;border:1px solid #65686e;border-radius:5px;padding:11px;background:#2d3035;color:#fff}
 input,textarea{width:100%}button{cursor:pointer}button:disabled{opacity:.4;cursor:not-allowed}
 button.gold{background:var(--gold);border-color:var(--gold);color:#161616;font-weight:bold}
 a{color:var(--gold)}.muted{color:#c5c6ca}.good{color:#8feb9e}.bad{color:#ff9999}
 .toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.toolbar input{flex:1;min-width:180px}
 #files{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
 .item{border:1px solid #505256;padding:10px;border-radius:6px;overflow:hidden}
 .item img{width:100%;height:150px;object-fit:contain;background:#292a2e;display:block}
 .item button{margin:8px 0 0;width:100%;text-align:left;font-size:12px}
 .item small{color:#bbb}#detail{max-width:700px}#status{min-height:20px}
 .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
 pre{white-space:pre-wrap;word-break:break-word;max-height:330px;overflow:auto}
 </style><main>
 <h1>TIVVY · ORIGINAL ARTWORK LIBRARY</h1>
 <p>Keep original files in private cloud storage. Search by filename, title, tags, credit, category or description. Trash retains recoverable items for 90 days; existing programme versions protect referenced originals.</p>
 <p id="identity" role="status">Checking protected access…</p>
 <section><h2>Upload original artwork</h2>
 <input id="uploadFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif,application/pdf">
 <p class="muted">Original bytes only: no compression, resizing or format conversion. Single upload limit 95 MB; multipart for larger files is still to come.</p>
 <button id="upload" class="gold" disabled>STORE ORIGINAL IN CLOUD</button>
 <p id="uploadStatus" role="status"></p></section>
 <section><h2>Find and reuse artwork</h2>
 <div class="toolbar"><input id="query" placeholder="Search by player, opponent, photographer, match, tag…">
 <select id="mode"><option value="active">Saved artwork</option><option value="trash">Trash · 90 days</option></select>
 <button id="search" class="gold">SEARCH</button></div>
 <p id="status" role="status"></p><div id="files"></div></section>
 <section id="detail" hidden><h2>Selected artwork</h2>
 <p id="fileInfo"></p><div class="grid"><div><label for="title">Title</label><input id="title"></div>
 <div><label for="category">Category</label><input id="category" placeholder="Match photography"></div></div>
 <label for="description">Description and match notes</label><textarea id="description" rows="3"></textarea>
 <div class="grid"><div><label for="credit">Credit / photographer</label><input id="credit" placeholder="Viv Curtis"></div>
 <div><label for="tags">Searchable tags (comma-separated)</label><input id="tags" placeholder="Tiverton, Melksham, 2026"></div></div>
 <p id="recoverInfo"></p><div class="toolbar">
 <button id="saveMeta" class="gold">SAVE METADATA</button><button id="copyUrl">COPY PRIVATE ARTWORK URL</button>
 <button id="trash">MOVE TO TRASH</button><button id="restore">RESTORE FROM TRASH</button>
 </div><p id="editStatus" role="status"></p></section>
 <section><h2>Discover Viv Curtis photographs</h2>
 <p class="muted">Search our existing hourly Flickr index. These are source references, not yet copies saved in our private R2 library. Check attribution and usage rights before importing an original.</p>
 <div class="toolbar"><input id="vivQuery" placeholder="Player, match, album or date…"><button id="vivSearch">SEARCH VIV'S FLICKR CATALOGUE</button></div>
 <p id="vivStatus"></p><div id="vivPhotos" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:9px"></div></section>
 <section><h2>Detailed audit history</h2>
 <button id="audit">REFRESH AUDIT LOG</button> <button id="csv">DOWNLOAD AUDIT CSV</button>
 <p class="muted">Shows who uploaded, changed metadata, moved or restored an asset, with timestamps and before/after records.</p>
 <pre id="events">No audit records loaded.</pre></section>
 <p class="muted">External imagery from Flickr/X is linked to its source and usage rights before any separate download. We will add direct provider integrations as authenticated, source-specific services rather than silently copying third-party images.</p>
 <p><a href="/full-designer">ORIGINAL FULL DESIGNER TRIAL</a> · <a href="/cloud-workspace">CLOUD WORKSPACE</a> · <a href="/cloud-vault">CLOUD VAULT</a></p>
 </main><script>
 (()=>{"use strict";
 const $=id=>document.getElementById(id);let role="",selected=null,rows=[],events=[];
 async function api(path,options){
  const res=await fetch(path,{credentials:"same-origin",cache:"no-store",...options});
  const data=await res.json();
  if(!res.ok||!data.ok)throw Error(data.error||"HTTP "+res.status);
  return data;
 }
 function setText(id,value,bad=false){$(id).textContent=value;$(id).className=bad?"bad":"muted"}
 const canEdit=()=>["admin","editor"].includes(role);
 const path=id=>"/api/library/assets/"+encodeURIComponent(id);
 async function refresh(){
  $("files").textContent="Searching cloud library…";
  try{
   const data=await api("/api/library/assets?status="+$("mode").value+"&q="+encodeURIComponent($("query").value));
   rows=data.items;$("files").replaceChildren();
   setText("status",rows.length+" asset(s) found in "+data.status+".");
   for(const item of rows){
    const card=document.createElement("div");card.className="item";
    if(item.mime_type.startsWith("image/")&&item.status==="active"){
     const image=document.createElement("img");image.src=path(item.id)+"/original";image.alt=item.title||item.original_filename;image.loading="lazy";card.append(image);
    }
    const label=document.createElement("button");label.textContent=item.title||item.original_filename;label.onclick=()=>choose(item.id);card.append(label);
    const meta=document.createElement("small");meta.textContent=item.original_filename+" · "+(item.byte_size/1000000).toFixed(2)+" MB · "+(item.credit||"Uncredited");card.append(meta);
    $("files").append(card);
   }
  }catch(e){setText("status","SEARCH FAILED: "+e.message,true);$("files").replaceChildren()}
 }
 function choose(id){
  selected=rows.find(x=>x.id===id);if(!selected)return;
  $("detail").hidden=false;
  for(const k of ["title","category","description","credit"])$(k).value=selected[k]||"";
  $("tags").value=(selected.tags||[]).join(", ");
  $("fileInfo").textContent=selected.original_filename+" · original "+selected.mime_type+" · "+selected.byte_size+" bytes · "+selected.id;
  $("recoverInfo").textContent=selected.status==="trash"?"Recoverable until "+selected.purge_after+" (unless protected by programme revision)":"Stored in cloud; no automatic expiry.";
  $("saveMeta").disabled=!canEdit()||selected.status!=="active";
  $("trash").disabled=!canEdit()||selected.status!=="active";
  $("restore").disabled=!canEdit()||selected.status!=="trash";
  $("copyUrl").disabled=selected.status!=="active";
  setText("editStatus","");
 }
 async function modify(action){
  if(!selected)return;
  const old=selected.id;
  try{
   const body={action};
   if(action==="metadata")Object.assign(body,{title:$("title").value,category:$("category").value,
    description:$("description").value,credit:$("credit").value,
    tags:$("tags").value.split(",").map(x=>x.trim()).filter(Boolean)});
   if(action==="trash"&&!confirm("Move original to recoverable trash for 90 days? The artwork is not immediately destroyed."))return;
   const data=await api(path(old),{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
   setText("editStatus","Saved · "+action+" · "+new Date().toLocaleString());
   await refresh();choose(data.item.id);await audit();
  }catch(e){setText("editStatus","Could not "+action+": "+e.message,true)}
 }
 $("saveMeta").onclick=()=>modify("metadata");$("trash").onclick=()=>modify("trash");$("restore").onclick=()=>modify("restore");
 $("copyUrl").onclick=()=>{if(selected)navigator.clipboard.writeText(location.origin+path(selected.id)+"/original").then(()=>setText("editStatus","Private artwork URL copied. Login required to view."))};
 $("search").onclick=refresh;$("query").onkeydown=e=>{if(e.key==="Enter")refresh()};$("mode").onchange=refresh;
 $("upload").onclick=async()=>{
  const file=$("uploadFile").files[0];if(!file)return;
  if(file.size>95000000){setText("uploadStatus","Original over 95MB: multipart upload not yet supported. File unchanged.",true);return}
  $("upload").disabled=true;
  try{
   setText("uploadStatus","Storing original bytes without processing…");
   const original=new Uint8Array(await file.arrayBuffer());
   const digest=x=>crypto.subtle.digest("SHA-256",x).then(buffer=>Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,"0")).join(""));
   const checksum=await digest(original);
   const resp=await api("/api/library/assets",{method:"POST",headers:{"content-type":file.type,"x-file-name":file.name,"x-original-sha256":checksum},body:file});
   const fetched=await fetch(path(resp.id)+"/original",{credentials:"same-origin",cache:"no-store"});
   if(!fetched.ok)throw Error("Original read-back HTTP "+fetched.status);
   const recovered=new Uint8Array(await fetched.arrayBuffer());
   if(recovered.byteLength!==original.byteLength||await digest(recovered)!==checksum)
    throw Error("Cloud original failed SHA-256 or exact-byte count verification");
   setText("uploadStatus","ORIGINAL VERIFIED · "+file.name+" · "+resp.byte_size+" bytes · SHA-256 identical. Add tags/photographer to make it searchable.");
   $("mode").value="active";$("query").value="";await refresh();choose(resp.id);await audit();
  }catch(e){setText("uploadStatus","UPLOAD NOT VERIFIED: "+e.message,true)}
  finally{$("upload").disabled=!canEdit()}
 };
 async function audit(){
  try{
   const data=await api("/api/library/activity?limit=200");events=data.events;
   $("events").textContent=events.map(x=>x.created_at+" · "+x.actor+" · "+x.action+" · "+x.asset_id+"\\n"+(x.detail_json||"")).join("\\n\\n")||"No asset events yet.";
  }catch(e){setText("events","AUDIT ERROR: "+e.message,true)}
 }

 $("vivSearch").onclick=async()=>{
  const target=$("vivPhotos");target.replaceChildren();setText("vivStatus","Searching public photo catalogue…");
  try{
   const data=await api("/api/sources/viv?q="+encodeURIComponent($("vivQuery").value.trim()));
   setText("vivStatus",data.results.length+" matching indexed photo(s). Last source refresh: "+(data.source_updated_at||"unknown")+".");
   for(const photo of data.results){
    const card=document.createElement("div");card.className="item";
    if(photo.thumbnail_url&&photo.thumbnail_url.startsWith("https://")){
     const img=document.createElement("img");img.src=photo.thumbnail_url;img.alt=photo.title;img.loading="lazy";card.append(img);
    }
    const title=document.createElement("p");title.textContent=photo.title||"Untitled photograph";card.append(title);
    const credit=document.createElement("small");credit.textContent="Viv Curtis · "+(photo.date_taken||"Date unknown")+" · License: "+photo.license;card.append(credit);
    const link=document.createElement("a");link.href=photo.source_url;link.target="_blank";link.rel="noopener noreferrer";link.textContent="View original on Flickr";card.append(document.createElement("p"),link);
    target.append(card);
   }
  }catch(e){setText("vivStatus","Flickr discovery unavailable: "+e.message+". Existing uploaded originals remain safe.",true)}
 };
 $("audit").onclick=audit;
 $("csv").onclick=()=>{
  const cols=["created_at","actor","action","asset_id","before_json","after_json","detail_json"];
  const quote=x=>'"'+String(x??"").replace(/"/g,'""')+'"';
  const csv=[cols.join(","),...events.map(x=>cols.map(k=>quote(x[k])).join(","))].join("\\n");
  const link=document.createElement("a");link.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));link.download="tivvy-artwork-audit.csv";link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href),10000);
 };
 (async()=>{try{
  const data=await api("/api/me");role=data.role;$("identity").textContent="Protected connection verified · "+role;$("identity").className="good";
  $("upload").disabled=!canEdit();await refresh();await audit();
 }catch(e){$("identity").textContent="ACCESS FAILED: "+e.message;$("identity").className="bad"}})();
 })();
 <\/script></html>`;
 return new Response(html,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","content-security-policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data: https://live.staticflickr.com https://*.staticflickr.com; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
}


function activityLogPortal(){
 const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
 <title>Tivvy · Complete activity log</title><style>
 body{background:#161719;color:#eee;margin:0;font:14px system-ui,Arial}main{max-width:1200px;margin:auto;padding:22px}h1{color:#ffda00}
 button,input,select,textarea{background:#2d2f33;color:#fff;border:1px solid #646870;border-radius:4px;padding:10px;font:inherit}
 button{cursor:pointer}button:disabled{opacity:.4}a{color:#ffda00}.box{border:1px solid #54575b;padding:16px;border-radius:8px;margin:15px 0}
 .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}textarea{width:100%}table{width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed}
 td,th{text-align:left;vertical-align:top;border-bottom:1px solid #46484c;padding:12px 10px;overflow-wrap:anywhere;line-height:1.55}tbody tr:nth-child(odd){background:#ffffff06}.event-time{white-space:nowrap}.event-summary{line-height:1.55}.event-detail{margin-top:8px}.event-detail summary{color:#ffda00;cursor:pointer;font-size:12px}.event-detail pre{white-space:pre-wrap;word-break:break-word;background:#111215;padding:10px;border-radius:4px;max-height:350px;overflow:auto}.event-label{background:#34363b;padding:4px 7px;border-radius:4px;display:inline-block}th{color:#ffda00}
 .muted{color:#ccc}.good{color:#90e8a7}.bad{color:#ffa6a6}pre{white-space:pre-wrap;overflow:auto;max-height:300px}
 </style><main><h1>TIVVY · COMPLETE ACTIVITY HISTORY</h1>
 <p>Who did what, when and to which page, layer or original photograph. Times are displayed in the UK timezone; full original UTC timestamps and previous values remain in expandable details.</p>
 <p id="identity">Checking protected access…</p>
 <section class="box"><div class="row"><button id="load">REFRESH ACTIVITY</button><button id="more" disabled>LOAD OLDER EVENTS</button><button id="export">EXPORT ALL CSV AUDIT</button>
 <input id="filter" placeholder="Filter by actor, action, page, note…" style="flex:1;min-width:240px"></div>
 <p id="summary"></p><div style="overflow:auto"><table><colgroup><col style="width:155px"><col style="width:145px"><col style="width:160px"><col style="width:155px"><col></colgroup><thead><tr><th>When (UK)</th><th>Who</th><th>Action</th><th>Where</th><th>Summary / details</th></tr></thead>
 <tbody id="entries"></tbody></table></div></section>
 <section class="box"><h2>Record a project decision or instruction</h2>
 <p class="muted">Notes are attributed to your authenticated account, with an exact time. This does not automatically read ChatGPT messages.</p>
 <select id="issue"><option value="">Choose issue</option></select><textarea rows="3" id="note" placeholder="e.g. Request: retain Viv's full-resolution originals. No compression."></textarea>
 <p><button id="submit" disabled>ADD TIMESTAMPED AUDIT NOTE</button></p><p id="noteStatus"></p>
 </section><p><a href="/artwork-library">ARTWORK LIBRARY</a> · <a href="/cloud-workspace">CLOUD WORKING COPY</a></p>
 </main><script>
 (()=>{"use strict";const $=id=>document.getElementById(id);
 let logs=[],role="",nextOffset=0;
 async function api(url,opts){const response=await fetch(url,{credentials:"same-origin",cache:"no-store",...opts});const d=await response.json();
  if(!response.ok||!d.ok)throw Error(d.error||"HTTP "+response.status);return d}
 function parsed(raw){try{return JSON.parse(raw)}catch{return raw||null}}
 function when(raw){const d=new Date(raw);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(d):String(raw||"—")}
 function who(raw){return String(raw||"Unknown").split("@")[0]}
 function actionLabel(a){return ({"layer.property.change":"Layer edited","issue.save":"Cloud saved","issue.create":"Working copy created","asset.upload":"Artwork uploaded","asset.metadata.update":"Metadata edited","asset.trash":"Moved to Trash","asset.restore":"Restored from Trash","project.note":"Project note","layer.create":"Layer added","layer.delete":"Layer removed"})[a]||String(a||"Event").replaceAll("."," · ")}
 function short(v,max=130){if(v===null||v===undefined)return "—";const raw=typeof v==="string"?v:JSON.stringify(v);const str=raw.split("\\n").join(" ").trim();return str.length>max?str.slice(0,max-1)+"…":str}
 function synopsis(e){
  const meta=parsed(e.detail_json)||{},before=parsed(e.before_json),after=parsed(e.after_json);
  if(e.action==="layer.property.change")return "Changed "+(meta.field||"property")+": "+short(before,80)+" → "+short(after,100);
  if(e.action==="issue.save")return (meta.summary||"Saved cloud revision")+" · v"+(meta.from_version||"?")+" → v"+(meta.to_version||"?");
  if(e.action==="asset.trash")return "Moved "+short(before?.title||before?.original_filename||"original",100)+" into recoverable Trash";
  if(e.action==="asset.restore")return "Recovered "+short(after?.title||after?.original_filename||"original",100)+" from Trash";
  if(e.action==="asset.metadata.update")return "Updated metadata for "+short(after?.title||e.asset_id,100);
  if(e.action==="project.note")return short(meta.text||"Project note",220);
  if(e.action==="asset.upload")return "Stored original image "+short(after?.original_filename||e.asset_id,100);
  return short(meta.summary||meta.text||e.action,200);
 }
 function full(e){return ["UTC: "+e.created_at,"Account: "+e.actor,"Action: "+e.action,"Issue: "+(e.issue_id||"—"),"Page: "+(e.target_page_id||"—"),"Layer: "+(e.target_layer_id||"—"),"Artwork: "+(e.asset_id||"—"),"Details: "+(e.detail_json||"—"),"Before: "+(e.before_json||"—"),"After: "+(e.after_json||"—")].join("\\n")}
 function filtered(){const q=$("filter").value.toLowerCase().trim();return q?logs.filter(e=>JSON.stringify(e).toLowerCase().includes(q)):logs}
 function display(){
  const items=filtered();$("entries").replaceChildren();$("summary").textContent=items.length+" event(s) shown · Newest first · Load older events for complete history";
  for(const e of items){
   const tr=document.createElement("tr");
   for(const [value,kind] of [[when(e.created_at),"event-time"],[who(e.actor),"event-who"],[actionLabel(e.action),"event-label"],[e.target_page_id||e.asset_id||e.issue_id||"—","event-where"]]){
    const td=document.createElement("td");if(kind==="event-label"){const span=document.createElement("span");span.className=kind;span.textContent=value;td.append(span)}else{td.className=kind;td.textContent=value}tr.append(td);
   }
   const td=document.createElement("td"),summary=document.createElement("div");summary.className="event-summary";summary.textContent=synopsis(e);td.append(summary);
   const details=document.createElement("details");details.className="event-detail";
   const toggle=document.createElement("summary");toggle.textContent="Full details / before & after";details.append(toggle);
   const pre=document.createElement("pre");pre.textContent=full(e);details.append(pre);td.append(details);tr.append(td);$("entries").append(tr);
  }
 }
 async function load(append=false){
  if(!append){nextOffset=0;logs=[]}
  try{
   const r=await api("/api/activity?limit=300&offset="+nextOffset);
   logs.push(...r.events);nextOffset=r.next_offset;$("more").disabled=!r.has_more;display();
  }catch(e){$("summary").textContent="Audit fetch failed: "+e.message}
 }
 $("load").onclick=()=>load(false);
 $("more").onclick=()=>load(true);
 $("filter").oninput=display;
 $("export").onclick=async()=>{
  const button=$("export");button.disabled=true;
  const fields=["created_at","actor","kind","action","issue_id","asset_id","target_page_id","target_layer_id","before_json","after_json","detail_json"];
  const quote=x=>'"'+String(x??"").replace(/"/g,'""')+'"';
  try{
   const all=[];let offset=0;let batches=0;
   do{
    const r=await api("/api/activity?limit=300&offset="+offset);
    all.push(...r.events);offset=r.next_offset;batches++;
    $("summary").textContent="Preparing full audit export: "+all.length+" events…";
    if(!r.has_more)break;
    if(batches>=4000)throw Error("Export reached a safety limit; contact admin for archival export");
    await new Promise(resolve=>setTimeout(resolve,0));
   }while(true);
   const csv=[fields.join(","),...all.map(x=>fields.map(k=>quote(x[k])).join(","))].join("\\n");
   const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
   a.download="tivvy-complete-activity-"+new Date().toISOString().slice(0,10)+".csv";a.click();
   setTimeout(()=>URL.revokeObjectURL(a.href),15000);display();
  }catch(e){$("summary").textContent="Full audit export failed: "+e.message}
  finally{button.disabled=false}
 };
 $("submit").onclick=async()=>{
  try{const text=$("note").value.trim(),issue_id=$("issue").value;
   if(!issue_id||!text)throw Error("Select an issue and enter a note");
   const r=await api("/api/activity/notes",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text,issue_id})});
   $("note").value="";$("noteStatus").textContent="Saved by "+r.actor+" at "+r.created_at;await load();
  }catch(e){$("noteStatus").textContent="Note not saved: "+e.message}
 };
 (async()=>{try{const me=await api("/api/me");role=me.role;$("identity").textContent="Authenticated as "+role;
  $("submit").disabled=!["admin","editor"].includes(role);
  const issues=await api("/api/issues");for(const x of issues.issues)$("issue").add(new Option(x.title,x.id));
  await load();
 }catch(e){$("identity").textContent="Access failed: "+e.message}})();
 })();
 <\/script></html>`;
 return new Response(html,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","content-security-policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
}


function sourcesHubPortal(){
 const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
 <title>Tivvy · Programme data sources</title><style>
 body{background:#17181a;color:#eee;margin:0;font:14px system-ui,Arial}main{max-width:1150px;margin:auto;padding:24px}h1{color:#ffda00}
 section{border:1px solid #505256;padding:16px;border-radius:8px;margin:15px 0}h2{color:#ffda00;font-size:19px}
 button,input{font:inherit;background:#313337;color:#fff;padding:10px;border:1px solid #62646b;border-radius:4px}
 button{cursor:pointer}a{color:#ffda00}.muted{color:#ccc}.good{color:#9ce9ae}.bad{color:#ffaaaa}
 .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}
 .card{border:1px solid #55575c;border-radius:6px;padding:12px;background:#222326}
 .card p{margin:5px 0}small{color:#bbb}pre{white-space:pre-wrap;max-height:270px;overflow:auto}
 </style><main><h1>TIVVY · LIVE SOURCE HUB</h1>
 <p>Bring existing match feeds and image catalogues into programme research. This is a read-only source browser, not an automatic overwrite of published match facts or artwork.</p>
 <p id="identity">Checking staff login…</p>
 <section><h2>Matchday feeds</h2>
 <p class="muted">Reuses the existing Tivvy Live collector: Southern League's match feed, optional FootballWebPages cross-check and authorised club X API updates. No duplicate X scraping or second paid polling system.</p>
 <label for="date">Match date</label> <input id="date" type="date"><button id="load">LOAD MATCHDAY SOURCES</button>
 <p id="status"></p><div class="grid" id="summary"></div>
 <h3>Southern League matches</h3><div class="grid" id="matches"></div>
 <h3>FootballWebPages cross-check</h3><div class="grid" id="fwp"></div>
 <h3>Official club X posts</h3><div id="posts"></div>
 </section>
 <section><h2>Viv Curtis photography</h2><p>The existing hourly Flickr catalogue supplies searchable public album titles, photographs and photographer metadata, with links back to original sources.</p>
 <a href="/artwork-library">SEARCH VIV'S PHOTO CATALOGUE AND SAVED ORIGINAL ARTWORK</a></section>
 <section><h2>Other feeds</h2><p><strong>ESPN:</strong> Not connected in this verified collector. We can add a compliant source adapter once its data endpoint and permitted use are confirmed.</p>
 <p>Source priority: Southern League verified fixtures/results, FootballWebPages as a cross-check where configured, X for club announcements with provenance. Conflicting sources should be flagged for review rather than silently replacing programme text.</p></section>
 <p><a href="/cloud-workspace">EDIT CLOUD WORKING COPY</a> · <a href="/activity-log">AUDIT HISTORY</a></p>
 </main><script>
 (()=>{"use strict";const $=id=>document.getElementById(id);
 async function api(url){const r=await fetch(url,{credentials:"same-origin",cache:"no-store"});const x=await r.json();if(!r.ok||!x.ok)throw Error(x.error||"HTTP "+r.status);return x}
 function div(text,parent,cls="card"){const e=document.createElement("div");e.className=cls;e.textContent=text;parent.append(e);return e}
 function fixture(x){
  const score=x.score&&x.score.home!==undefined?String(x.score.home)+"–"+String(x.score.away):"—";
  return (x.home||"?")+" "+score+" "+(x.away||"?")+" · "+(x.status||"unknown");
 }
 $("date").value=new Date().toISOString().slice(0,10);
 $("load").onclick=async()=>{
  const date=$("date").value;if(!date)return;
  for(const id of ["summary","matches","fwp","posts"])$(id).replaceChildren();
  $("status").textContent="Reading existing collector for "+date+"…";
  try{
   const data=await api("/api/sources/live?date="+encodeURIComponent(date));
   const feed=data.data||{},league=feed.matchday||{},fwp=feed.fwp||{},x=feed.x||{};
   div("Southern League · "+(league.status||"not available")+" · checked "+(league.checkedAt||"not recorded"),$("summary"));
   div("FootballWebPages · "+(fwp.status||"not available")+" · checked "+(fwp.checkedAt||"not recorded"),$("summary"));
   div("Club X API · "+(x.status||feed.xCollectionMode||"not available")+" · checked "+(x.checkedAt||"not recorded"),$("summary"));
   const matches=[...(league.featured?[league.featured]:[]),...(league.matches||[])];
   for(const row of matches.slice(0,100))div(fixture(row)+" · "+(row.competition||"competition not classified"),$("matches"));
   if(!matches.length)div("No league matches supplied for this date; don't infer a nil-nil result.",$("matches"));
   for(const row of (fwp.matches||[]).slice(0,100))div(fixture(row),$("fwp"));
   if(!(fwp.matches||[]).length)div(fwp.warning||"No FootballWebPages cross-check supplied.",$("fwp"));
   for(const row of (x.posts||[]).slice(0,40)){
    const card=document.createElement("div");card.className="card";
    const header=document.createElement("strong");header.textContent="Official club X · "+(row.createdAt||"time unavailable");card.append(header);
    const message=document.createElement("p");message.textContent=row.text||"";card.append(message);$("posts").append(card);
   }
   if(!(x.posts||[]).length)div("No X posts returned; check whether this date is within the enabled collection window.",$("posts"));
   $("status").textContent="Source view loaded. Date "+date+". Always verify conflicts before publishing.";
  }catch(e){$("status").textContent="Source retrieval unavailable: "+e.message}
 };
 (async()=>{try{const me=await api("/api/me");$("identity").textContent="Protected login verified · "+me.role}
 catch(e){$("identity").textContent="Access unavailable: "+e.message}})();
 })();
 <\/script></html>`;
 return new Response(html,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","content-security-policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
}


async function originalFullEditorFrame(){
 // The full, approved V3 renderer is fetched from this repository's source.
 // It runs within this Access-protected Worker origin; the GitHub Pages
 // browser draft database and published site are not changed.
 const upstream="https://raw.githubusercontent.com/nickabull/Tiverton-Town-Control-Centre/main/programme-designer-v3-editor.html";
 let res;try{res=await fetch(upstream,{cf:{cacheTtl:60}})}catch{return failure("Original V3 editor source temporarily unavailable",503)}
 if(!res.ok)return failure("Original V3 editor source not published: HTTP "+res.status,503);
 const html=await res.text();
 if(html.length<100000||html.length>2500000||!html.includes("V3_CLOUD_TRIAL")||!html.includes("tivvy-v3-ready"))
  return failure("Full editor source failed integrity markers; refusing fallback renderer",503);
 return new Response(html,{headers:{
  "content-type":"text/html; charset=utf-8","cache-control":"no-store",
  "x-content-type-options":"nosniff","referrer-policy":"no-referrer",
  "content-security-policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'"
 }});
}
function fullDesignerTrialPortal(){
 const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
 <title>Tivvy · Original V3 full editor in cloud trial</title>
 <style>
 *{box-sizing:border-box}html,body{margin:0;background:#141517;color:#f2f2f3;font:13px system-ui,Arial}
 header{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:12px 16px;border-bottom:3px solid #ffda00;background:#1b1c20}
 h1{font-size:19px;color:#ffda00;margin:0 10px 0 0}p{margin:0}
 button,select{background:#2e3136;color:white;padding:9px;border:1px solid #666971;border-radius:4px;font:inherit}
 button{cursor:pointer}button:disabled{opacity:.5;cursor:not-allowed}button.gold{background:#ffda00;color:#161616;font-weight:bold}
 #state{padding:9px 16px;min-height:40px;color:#d5d6db;border-bottom:1px solid #444}
 #state.good{color:#95e7a5}#state.bad{color:#ffabab}
 #frame{width:100%;height:calc(100vh - 114px);min-height:600px;border:0;display:block}
 #initial{max-width:800px;margin:70px auto;border:1px solid #56575d;padding:22px;border-radius:7px}
 #initial h2{color:#ffda00}a{color:#ffda00}
 </style>
 <header><h1>FULL V3 DESIGNER · CLOUD TRIAL</h1><select id="working"><option value="">Choose separate cloud working copy</option></select>
 <button id="open">OPEN</button><select id="pages" disabled><option value="">Choose page</option></select>
 <button id="save" class="gold" disabled>SAVE CLOUD REVISION</button>
 <button id="refresh" disabled>RELOAD CLOUD COPY</button>
 <a href="/cloud-workspace">Previous cloud trial</a></header>
 <div id="state" role="status">Verifying cloud access and listing working copies…</div>
 <div id="initial"><h2>Your original editing tools, without the old browser storage dependency</h2>
 <p>Open a previously created separate cloud working copy. The full V3 editor will appear unchanged, with its typography, rich text, layer controls, resizing and zoom. Changes are automatically sent to D1 with a read-back confirmation and local browser recovery.</p>
 <p style="margin-top:12px"><strong>Safe trial:</strong> your original GitHub Pages drafts and historical cloud archive are not changed. Reference PDF pages and brand-new embedded image uploads still require separate migration.</p></div>
 <iframe id="frame" title="Original full V3 Designer trial" hidden></iframe>
 <script>
 (()=>{"use strict";
 const $=id=>document.getElementById(id);
 const API="/api/issues/",WORK=/^work_[a-f0-9]{32}$/;
 let role="",copy=null,pageId="",frameReady=false,loaded=false,dirty=false,blocked=false,serial=0,timer=null,saving=false,savePromise=null,waiters=[];
 function state(text,kind=""){const el=$("state");el.textContent=text;el.className=kind}
 async function api(url,opts){const r=await fetch(url,{credentials:"same-origin",cache:"no-store",...opts});let j;try{j=await r.json()}catch{throw Error("Cloud returned HTTP "+r.status)}
  if(!r.ok||!j.ok)throw Error(j.error||"HTTP "+r.status);return j}
 const storageKey=()=>copy?"tivvy-full-v3-trial-unsaved-"+copy.issue.id:"";
 function keepLocal(){
  if(!copy||!dirty)return true;
  try{localStorage.setItem(storageKey(),JSON.stringify({version:copy.version,pageId,document:copy.document,stored:new Date().toISOString()}));return true}
  catch(e){state("WARNING: cloud pending and browser emergency copy could not be written: "+e.message,"bad");return false}
 }
 function sourceUrl(node){
  if(!node||typeof node!=="object")return node;
  if(node.v3CloudAsset)return "/api/issues/"+encodeURIComponent(copy.document.assetSourceIssueId||copy.document.derivedFromArchive||copy.issue.id)+"/assets/"+encodeURIComponent(node.v3CloudAsset);
  if(node.v3LibraryAsset)return "/api/library/assets/"+encodeURIComponent(node.v3LibraryAsset)+"/original";
  return node;
 }
 function toEditor(layers){
  return structuredClone(layers||[]).map(l=>{
   if(l&&l.type==="image"&&l.src&&typeof l.src==="object")l.src=sourceUrl(l.src);
   return l;
  });
 }
 function fromEditor(layers){
  return structuredClone(layers||[]).map(l=>{
   if(l&&l.type==="image"&&typeof l.src==="string"){
    const raw=l.src;
    const asset=raw.match(/^\\/api\\/issues\\/([A-Za-z0-9_-]+)\\/assets\\/([0-9a-f-]{36})$/);
    const library=raw.match(/^\\/api\\/library\\/assets\\/([0-9a-f-]{36})\\/original$/);
    if(asset)l.src={v3CloudAsset:asset[2]};
    else if(library)l.src={v3LibraryAsset:library[1]};
    else if(raw.startsWith("data:"))throw Error("New embedded image is not yet in the cloud library. The local trial draft was kept; upload that image to Artwork Library before cloud save.");
   }
   return l;
  });
 }
 function page(){return copy?.document.pages.find(x=>x.id===pageId)}
 function inject(){
  if(!copy||!page()||!frameReady)return;
  const draft=toEditor(page().layers);
  $("frame").contentWindow.postMessage({type:"tivvy-cloud-load",cloudIssue:copy.issue.id,pageId,layers:draft},location.origin);
 }
 function schedule(){clearTimeout(timer);if(blocked)return;timer=setTimeout(()=>void save(true),1800)}
 async function save(automatic=false){
  clearTimeout(timer);
  if(saving)return savePromise;
  if(!copy||!dirty||blocked)return !blocked;
  saving=true;$("save").disabled=true;
  const requested=structuredClone(copy.document),previous=copy.version,at=serial,issueId=copy.issue.id,current=pageId;
  state(automatic?"Cloud autosave in progress…":"Saving full V3 layers to cloud…");
  savePromise=(async()=>{
   try{
    const result=await api(API+encodeURIComponent(issueId),{method:"PUT",headers:{"content-type":"application/json"},
     body:JSON.stringify({expected_version:previous,document:requested,summary:automatic?"Autosave · original V3 editor":"Manual save · original V3 editor",page_id:current})});
    if(result.version!==previous+1)throw Error("Unexpected revision number");
    const read=await api(API+encodeURIComponent(issueId));
    if(read.version!==result.version||JSON.stringify(read.document)!==JSON.stringify(requested))throw Error("Cloud revision did not read back identically");
    copy.version=read.version;copy.issue=read.issue;
    if(at===serial){copy.document=read.document;dirty=false;try{localStorage.removeItem(storageKey())}catch{};state("CLOUD AUTOSAVED & VERIFIED · v"+read.version+" · "+new Date().toLocaleTimeString("en-GB"),"good")}
    else{dirty=true;keepLocal();state("Cloud v"+read.version+" verified; more recent changes are queued.");}
    return true;
   }catch(e){blocked=true;dirty=true;keepLocal();state("CLOUD SAVE NOT VERIFIED: "+e.message+". Local recovery retained. Do not close or reload.","bad");return false}
   finally{saving=false;$("save").disabled=!dirty; if(dirty&&!blocked)schedule()}
  })();
  return savePromise;
 }
 function setPages(){
  const sel=$("pages");sel.replaceChildren();
  copy.document.pages.forEach((p,i)=>sel.add(new Option(String(i+1)+". "+p.name,p.id)));
  sel.disabled=false;
 }
 function openPage(id){
  if(!copy||!copy.document.pages.some(p=>p.id===id))return;
  pageId=id;frameReady=false;loaded=false;$("pages").value=id;$("initial").hidden=true;$("frame").hidden=false;
  $("frame").src="/full-editor-frame?page="+encodeURIComponent(id)+"&cloudTrial=1&cloudIssue="+encodeURIComponent(copy.issue.id);
  state("Loading the ORIGINAL V3 layer editor for "+page().name+"…");
 }
 async function loadWork(id){
  if(!WORK.test(id))throw Error("Only separate work_ trials can use this editor");
  const obj=await api(API+encodeURIComponent(id));
  if(obj.document.migrationState!=="CLOUD_EDIT_TRIAL")throw Error("The selected issue is not an independent cloud trial");
  copy=obj;dirty=false;blocked=false;serial=0;
  const saved=localStorage.getItem(storageKey());
  if(saved){let fallback;try{fallback=JSON.parse(saved)}catch{}
   if(fallback&&fallback.version===obj.version&&JSON.stringify(fallback.document)!==JSON.stringify(obj.document)){
    if(confirm("An unsaved local trial recovery exists. Restore its edits to this cloud working copy?")){
     copy.document=fallback.document;dirty=true;serial++;keepLocal();schedule();
    }
   }else if(fallback&&fallback.version!==obj.version){state("An old local recovery differs from the newer cloud version. It was not silently applied.","bad")}
  }
  setPages();openPage(copy.document.pages[0].id);$("refresh").disabled=false;
 }
 async function refreshList(){
  const me=await api("/api/me");role=me.role;
  if(!["admin","editor"].includes(role))throw Error("Editing rights required");
  const listing=await api("/api/issues");const select=$("working");select.replaceChildren(new Option("Choose separate cloud working copy",""));
  for(const item of listing.issues)if(WORK.test(item.id)){
   const x=await api(API+encodeURIComponent(item.id));
   if(x.document.migrationState==="CLOUD_EDIT_TRIAL")select.add(new Option(item.title+" · v"+x.version,item.id));
  }
  state("Protected connection verified · "+role+". Choose a separate working copy.");
 }
 window.addEventListener("message",e=>{
  if(e.origin!==location.origin||e.source!==$("frame").contentWindow||!copy)return;
  const data=e.data||{};
  if(data.cloudIssue&&data.cloudIssue!==copy.issue.id)return;
  if(data.pageId!==pageId)return;
  if(data.type==="tivvy-v3-ready"){frameReady=true;inject();return}
  if(data.type==="tivvy-cloud-loaded"){loaded=true;state("Original full V3 editor loaded: "+page().name+". Edits will auto-save to cloud.");return}
  if(data.type==="tivvy-cloud-load-error"){state("Full V3 page load failed: "+data.error,"bad");return}
  if(data.type==="tivvy-cloud-layer-snapshot"){
   if(!loaded)return;
   try{
    const result=fromEditor(JSON.parse(data.snapshot));
    page().layers=result;serial++;dirty=true;const backed=keepLocal();
    state(backed?"Local recovery stored · cloud autosave pending…":"Local backup unavailable; cloud autosave pending…",backed?"":"bad");
    schedule();
   }catch(err){blocked=true;dirty=true;keepLocal();state("CLOUD SAVE BLOCKED: "+err.message,"bad")}
  }
 });
 $("open").onclick=async()=>{try{if(dirty&&!await save(false))return;await loadWork($("working").value)}catch(e){state("Cannot open working copy: "+e.message,"bad")}};
 $("pages").onchange=async()=>{
  const target=$("pages").value;
  if(dirty&&!await save(false)){$("pages").value=pageId;return}
  openPage(target);
 };
 $("refresh").onclick=async()=>{
  if(!copy)return;
  if(dirty&&!await save(false))return;
  try{await loadWork(copy.issue.id)}catch(e){state("Cloud reload failed: "+e.message,"bad")}
 };
 $("save").onclick=async()=>{blocked=false;await save(false)};
 window.addEventListener("beforeunload",e=>{if(dirty){keepLocal();e.preventDefault();e.returnValue=""}});
 (async()=>{try{await refreshList();const value=new URLSearchParams(location.search).get("issue");
  if(value&&WORK.test(value)){$("working").value=value;await loadWork(value)}
 }catch(e){state("Cloud access failed: "+e.message,"bad")}})();
 })();
 <\/script></html>`;
 return new Response(html,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","content-security-policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
}

export default {
 async fetch(request,env){
  const url=new URL(request.url),path=url.pathname,method=request.method;
  if(path==="/api/health")return json({ok:true,service:"tivvy-v3-storage",status:"deployment required"});
  if(!env.DB||!env.ASSETS)return failure("Database/object bindings not configured",503);
  const email=await verifiedAccessIdentity(request,env);
  if(!email)return failure("Cloudflare Access login required",401);
  const membership=await member(env,email);
  if(!membership)return failure("Not authorised for Tivvy Programme Studio",403);
  const isRead=["GET","HEAD"].includes(method);
  if(!isRead){
   const origin=request.headers.get("origin");
   if(!origin||origin!==url.origin)return failure("Request origin is not allowed",403);
  }
  const role=membership.role,actor=email;
  try{
   if(path==="/cloud-vault"&&method==="GET")return storagePortal();
    if(path==="/cloud-import"&&method==="GET"&&allowed(role,"edit"))return cloudImportPortal();
    if(path==="/cloud-workspace"&&method==="GET"&&allowed(role,"read"))return cloudWorkspacePortal();
    if(path==="/full-designer"&&method==="GET"&&allowed(role,"edit"))return fullDesignerTrialPortal();
    if(path==="/full-editor-frame"&&method==="GET"&&allowed(role,"edit"))return originalFullEditorFrame();
    if(path==="/artwork-library"&&method==="GET"&&allowed(role,"read"))return assetLibraryPortal();
    if(path==="/activity-log"&&method==="GET"&&allowed(role,"read"))return activityLogPortal();
    if(path==="/source-hub"&&method==="GET"&&allowed(role,"read"))return sourcesHubPortal();
    if(path==="/api/library/assets"&&method==="GET"&&allowed(role,"read"))return listLibrary(env,url);
   if(path==="/api/library/assets"&&method==="POST"&&allowed(role,"edit"))return uploadLibraryAsset(env,actor,request);
   if(path==="/api/library/activity"&&method==="GET"&&allowed(role,"read"))return libraryAudit(env,url);
   if(path==="/api/activity"&&method==="GET"&&allowed(role,"read"))return globalActivity(env,url);
   if(path==="/api/activity/notes"&&method==="POST"&&allowed(role,"edit"))return appendAuditNote(env,actor,request);
   if(path==="/api/sources/viv"&&method==="GET"&&allowed(role,"read"))return vivFlickrDiscovery(url);
   if(path==="/api/sources/live"&&method==="GET"&&allowed(role,"read"))return existingLiveSources(url);
   const lib=path.match(/^\/api\/library\/assets\/([0-9a-f-]{36})(?:\/(original))?$/);
   if(lib){
    if(method==="GET"&&lib[2]==="original"&&allowed(role,"read"))return libraryOriginal(env,lib[1]);
    if(method==="PATCH"&&!lib[2]&&allowed(role,"edit"))return updateLibraryAsset(env,actor,lib[1],request);
   }
   if(path==="/api/me"&&method==="GET")return json({ok:true,email,role});
   if(path==="/api/issues"&&method==="GET"){
    if(!allowed(role,"read"))return failure("Forbidden",403);
    const issues=await env.DB.prepare("SELECT id,title,status,current_version,updated_at FROM programme_issues ORDER BY updated_at DESC LIMIT 100").all();
    return json({ok:true,issues:issues.results});
   }
   if(path==="/api/issues"&&method==="POST"){
    if(!allowed(role,"edit"))return failure("Forbidden",403);
    return createIssue(env,actor,request);
   }
   const m=path.match(/^\/api\/issues\/([A-Za-z0-9_-]{1,90})(?:\/(.*))?$/);if(!m)return failure("Not found",404);
   const id=m[1],section=m[2]||"";
   if(!allowed(role,"read"))return failure("Forbidden",403);
   if(section===""&&method==="GET")return readIssue(env,id);
   if(section===""&&method==="PUT"){
    if(!allowed(role,"edit"))return failure("Forbidden",403);
    return saveIssue(env,actor,id,request);
   }
   if(section==="revisions"&&method==="GET"){
    const data=await env.DB.prepare("SELECT version,summary,actor,created_at FROM issue_revisions WHERE issue_id=? ORDER BY version DESC LIMIT 100").bind(id).all();
    return json({ok:true,revisions:data.results});
   }
   const rev=section.match(/^revisions\/(\d+)$/);if(rev&&method==="GET"){
    const item=await env.DB.prepare("SELECT version,snapshot_json,summary,actor,created_at FROM issue_revisions WHERE issue_id=? AND version=?").bind(id,Number(rev[1])).first();
    return item?json({ok:true,revision:{version:item.version,summary:item.summary,actor:item.actor,created_at:item.created_at},document:JSON.parse(item.snapshot_json)}):failure("Revision not found",404);
   }
   if(section==="restore"&&method==="POST"){
    if(!allowed(role,"restore"))return failure("Admin required for restoration",403);
    return restoreIssue(env,actor,id,Number(url.searchParams.get("version")),request);
   }
   if(section==="activity"&&method==="GET"){
    const limit=Math.min(500,Math.max(1,Number(url.searchParams.get("limit"))||100));
    const events=await env.DB.prepare("SELECT * FROM activity_events WHERE issue_id=? ORDER BY created_at DESC LIMIT ?").bind(id,limit).all();
    return json({ok:true,events:events.results});
   }
   if(section==="assets"&&method==="POST"){
    if(!allowed(role,"edit"))return failure("Forbidden",403);
    if(!await requireIssue(env,id))return failure("Issue not found",404);
    return uploadAsset(env,actor,id,request);
   }
   const asset=section.match(/^assets\/([0-9a-f-]{36})$/);
   if(asset&&method==="GET")return getAsset(env,id,asset[1]);
   return failure("Not found",404);
  }catch(e){
   if(e instanceof SyntaxError)return failure("Invalid JSON request",400);
   if(String(e.message).includes("size limit"))return failure(e.message,413);
   console.error("Storage API error",e);
   return failure("Storage service error; nothing was confirmed saved",500);
  }
 },
 async scheduled(event,env,ctx){ ctx.waitUntil(purgeExpiredLibrary(env)); }
};

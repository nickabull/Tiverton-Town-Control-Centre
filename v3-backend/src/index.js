// Tivvy Programme Designer V3.2 storage API.
// This Worker must be deployed behind Cloudflare Access. The JWT is ALSO
// cryptographically verified here; an unverified identity header is never trusted.
// It is intentionally NOT called by the browser-only V3.1 application yet.
const MAX_SNAPSHOT_BYTES = 3_000_000;
// Large artwork uses a streamed single upload up to 95 MB; multipart is a future phase.
const TYPES = new Set(["image/png","image/jpeg","image/webp","image/gif","application/pdf"]);
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
async function saveIssue(env,actor,issueId,request){
 const input=await payload(request);
 if(!Number.isSafeInteger(input.expected_version)||input.expected_version<1||!validDocument(input.document))return failure("Expected version and valid page document required");
 const serialized=JSON.stringify(input.document);
 if(bytes(serialized)>MAX_SNAPSHOT_BYTES)return failure("Document exceeds 3MB limit",413);
 const expected=input.expected_version,ver=expected+1,time=now(),rev=uid(),event=uid();
 const summary=String(input.summary||"Save programme").slice(0,300),targetPage=typeof input.page_id==="string"?input.page_id:null,targetLayer=typeof input.layer_id==="string"?input.layer_id:null;
 // All statements are one atomic D1 batch. Each insert is conditional on
 // the expected issue version. No stale writer can overwrite newer data.
 await env.DB.batch([
  env.DB.prepare("INSERT INTO issue_revisions(id,issue_id,version,snapshot_json,summary,actor,created_at) SELECT ?,id,?,?,?, ?,? FROM programme_issues WHERE id=? AND current_version=?").bind(rev,ver,serialized,summary,actor,time,issueId,expected),
  env.DB.prepare("UPDATE programme_issues SET current_version=?,updated_at=? WHERE id=? AND current_version=? AND EXISTS(SELECT 1 FROM issue_revisions WHERE id=?)").bind(ver,time,issueId,expected,rev),
  env.DB.prepare("INSERT INTO activity_events(id,issue_id,revision_id,actor,action,target_page_id,target_layer_id,detail_json,created_at) SELECT ?,?,?,?,?,?,?,?,? FROM issue_revisions WHERE id=?").bind(event,issueId,rev,actor,"issue.save",targetPage,targetLayer,JSON.stringify({summary,from_version:expected,to_version:ver}),time,rev)
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
 <p><a href="/cloud-import">SAFE CLOUD MIGRATION — CREATE VERIFIED COPY</a> · <a href="https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html">RETURN TO DESIGNER</a></p></main>
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
 <p class="note"><strong>Limits:</strong> 95 MB single image upload; 3 MB metadata JSON. Assets above 95 MB need multipart support. Unsupported embedded formats are blocked until reviewed. Reference-only source PDF images stored in a separate browser database are not part of the issue JSON backup. This is an archival cloud copy, not yet automatic live editor sync.</p>
 <p><a href="/cloud-vault">RETURN TO CLOUD VAULT</a></p>
 </main>
 <script>
 (()=>{"use strict";
 const $=id=>document.getElementById(id),encoder=new TextEncoder();
 const allowed=new Set(["image/png","image/jpeg","image/webp","image/gif","application/pdf"]);
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
     $("identity").textContent="Authenticated · "+me.role;$("identity").className="good";$("inspect").disabled=false;
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
     const targets=[],problems=[],occurrences=[],seenIds=new Set();
     for(const page of content.pages){
       if(!/^[A-Za-z0-9_-]{1,90}$/.test(page.id)||seenIds.has(page.id))throw Error("Invalid/duplicate page ID");
       seenIds.add(page.id);
       const layers=content.layerData[page.id]||[];
       if(!Array.isArray(layers))throw Error("Invalid layers on "+page.name);
       targets.push({id:page.id,name:String(page.name||"Untitled"),include:page.include,source:page.source,
         mode:page.mode,layers});
       visit(layers,(value,path)=>occurrences.push({value,page:page.name,path}));
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
     prepared={content,targets,unique,problems};
     $("report").textContent=[
       "SOURCE: "+file.name+" ("+(file.size/1000000).toFixed(1)+" MB)",
       "Pages: "+targets.length+" · embedded image occurrences: "+encountered,
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
       id:job,title:"INCOMPLETE CLOUD IMPORT "+new Date().toISOString(),
       document:{pages:[],source:"browser-backup-migration",state:"INCOMPLETE",sourcePageCount:prepared.targets.length}
     })});
     line("Staging issue: "+job+" (version 1, incomplete)");
     let number=0;
     const assetMap=new Map(),hashed=new Map();
     for(const [value,info] of prepared.unique){
       const decoded=decode(value);if(!decoded)throw Error("Unable to decode an embedded image");
       if(decoded.data.byteLength>limit)throw Error("Original exceeds 95 MB");
       const checksum=await sha(decoded.data);
       let record=hashed.get(checksum);
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
         hashed.set(checksum,record);
       }
       assetMap.set(value,record);
       number++;
       $("progress").textContent="Verified "+number+" of "+prepared.unique.size+" image values";
       line("Verified asset "+number+"/"+prepared.unique.size+" · "+(record.size/1000000).toFixed(2)+" MB");
       await new Promise(done=>setTimeout(done,0));
     }
     const doc={pages:prepared.targets.map(x=>({...x,layers:replaceUrls(x.layers,assetMap)})),
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
 $("source").addEventListener("change",()=>{$("migrate").disabled=true;prepared=null;$("report").textContent="Backup selected. Click ANALYSE BACKUP."});
 $("inspect").addEventListener("click",inspect);
 $("migrate").addEventListener("click",migrate);
 identity();
 })();
 <\/script></html>`;
 return new Response(html,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","content-security-policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
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
 }
};

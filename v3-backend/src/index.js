// Tivvy Programme Designer V3.2 storage API.
// This Worker must be deployed behind Cloudflare Access. The JWT is ALSO
// cryptographically verified here; an unverified identity header is never trusted.
// It is intentionally NOT called by the browser-only V3.1 application yet.
const MAX_SNAPSHOT_BYTES = 3_000_000;
const MAX_ASSET_BYTES = 12_000_000;
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
 const mime=(request.headers.get("content-type")||"").split(";")[0].trim().toLowerCase();
 const body=await request.arrayBuffer();
 if(!TYPES.has(mime))return failure("Unsupported asset MIME type",415);
 if(body.byteLength<1||body.byteLength>MAX_ASSET_BYTES)return failure("Image/PDF must be 1 byte to 12MB",413);
 const filename=(request.headers.get("x-file-name")||"uploaded-file").replace(/[\r\n\\/]/g,"_").slice(0,160);
 const assetId=uid(),key=id+"/"+assetId,time=now();
 await env.ASSETS.put(key,body,{httpMetadata:{contentType:mime},customMetadata:{uploadedBy:actor,originalFilename:filename}});
 try{
 await env.DB.batch([
  env.DB.prepare("INSERT INTO programme_assets(id,issue_id,r2_key,original_filename,mime_type,byte_size,uploaded_by,uploaded_at) VALUES (?,?,?,?,?,?,?,?)").bind(assetId,id,key,filename,mime,body.byteLength,actor,time),
  env.DB.prepare("INSERT INTO activity_events(id,issue_id,actor,action,detail_json,created_at) VALUES (?,?,?,'asset.upload',?,?)").bind(uid(),id,actor,JSON.stringify({assetId,filename,mime,size:body.byteLength}),time)
 ]);
 }catch(e){await env.ASSETS.delete(key);throw e}
 return json({ok:true,asset_id:assetId,mime_type:mime,byte_size:body.byteLength},201);
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
 <p><a href="https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html">RETURN TO DESIGNER</a></p></main>
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

/**
 * Tivvy Live shared-collector backend.
 * One Durable Object owns the cache for today's match. Browsers request /live
 * every ~20s; only the first request after the TTL calls the source.
 * No X token is ever sent to a browser.
 */
const LEAGUE_URL="https://api.southern-football-league.co.uk/matches";
const FIXTURES={
 "2026-11-11":{id:"6a5a1cc3ce9ef452b61f44b6",home:"Paulton Rovers",away:"Tiverton Town",kickoff:"19:30"},
 "2026-11-14":{id:"6a5a1cc3ce9ef452b61f44e0",home:"Tiverton Town",away:"Bishops Cleeve",kickoff:"15:00"}
};
const validDate=date=>/^202[6-9]-\d{2}-\d{2}$/.test(date);
const ukClock=date=>new Date().toLocaleTimeString("en-GB",{timeZone:"Europe/London",hour12:false,hour:"2-digit",minute:"2-digit"});

const LEAGUE_TTL=20_000;
const MATCH_POLL_MS=20_000;
const AUDIT_LIMIT=1800;
const X_TTL=600_000; // 10-minute X refresh; separate from ~20-second football updates
const MAX_X_CALLS_PER_DAY=30; // hard cap on paid X requests per matchday
function xAllowed(date,kickoff){
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const get=k=>parts.find(p=>p.type===k)?.value||"";
 const today=get("year")+"-"+get("month")+"-"+get("day");
 const clock=ukClock();
 return today===date&&inLiveWindow(date,kickoff);
}
const stamp=()=>new Date().toISOString();
function ukNow(){
 const dt=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());
 const part=k=>dt.find(x=>x.type===k)?.value||"";
 return {date:part("year")+"-"+part("month")+"-"+part("day"),clock:part("hour")+":"+part("minute")};
}
const inLiveWindow=(date,kickoff=FIXTURES[date]?.kickoff)=>{
 const n=ukNow();
 if(!kickoff||!/^[0-2]\d:[0-5]\d$/.test(kickoff)||n.date!==date)return false;
 const [h,m]=kickoff.split(":").map(Number);
 const start=Math.max(0,h*60+m-30),end=Math.min(1439,h*60+m+210);
 const [nh,nm]=n.clock.split(":").map(Number),t=nh*60+nm;
 return t>=start&&t<=end;
};
function recordAudit(record,source,type,detail){
 record.audit=Array.isArray(record.audit)?record.audit:[];
 record.audit.unshift({at:stamp(),source,type,detail});
 if(record.audit.length>AUDIT_LIMIT)record.audit.length=AUDIT_LIMIT;
}
const eventKey=e=>String(e._id||e.id||[e.minute,e.eventType,e.teamId,e.person?.name,e.personOff?.name].join("|"));
function auditLeagueChange(record,before,after){
 const oldMatches=[before?.featured,...(before?.matches||[])].filter(Boolean);
 const newMatches=[after?.featured,...(after?.matches||[])].filter(Boolean);
 const prev=new Map(oldMatches.map(m=>[m.id||m.home+"|"+m.away,m]));
 if(!before){recordAudit(record,"southern-league","initial-snapshot",
   "Baseline: "+newMatches.length+" matches, "+newMatches.reduce((n,m)=>n+(m.events?.length||0),0)+" incidents");return}
 for(const m of newMatches){
  const earlier=prev.get(m.id||m.home+"|"+m.away);
  const fixture=m.home+" v "+m.away;
  if(!earlier){recordAudit(record,"southern-league","fixture-added",fixture);continue}
  const score=x=>x?x.home+"-"+x.away:"not-reported";
  if(score(m.score)!==score(earlier.score))recordAudit(record,"southern-league","score",
    fixture+" · "+score(earlier.score)+" -> "+score(m.score));
  if(m.status!==earlier.status)recordAudit(record,"southern-league","status",
    fixture+" · "+earlier.status+" -> "+m.status);
  const beforeEvents=new Set((earlier.events||[]).map(eventKey));
  for(const e of m.events||[])if(!beforeEvents.has(eventKey(e)))
   recordAudit(record,"southern-league","incident",
    fixture+" · "+String(e.minute??"?")+"' · "+String(e.eventType||"EVENT")+
    (e.person?.name?" · "+e.person.name:""));
 }
}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
 "content-type":"application/json; charset=utf-8","cache-control":"no-store",
 "access-control-allow-origin":"*","access-control-allow-methods":"GET, OPTIONS",
 "access-control-allow-headers":"Content-Type"
}});
function team(m,side){
 const t=m[side+"Team"]||{};
 return typeof t==="object"?String(t.fullName||t.shortName||m[side+"TeamName"]||"").trim():String(m[side+"TeamName"]||"").trim();
}
function competition(m,home,away){
 const h=home.toLowerCase(),a=away.toLowerCase();
 if(h==="paulton rovers"&&a==="tiverton town")return "onesouth";
 if(h==="larkhall athletic"&&a==="slimbridge afc")return "onesouth";
 if(h==="willand rovers"&&a==="shaftesbury")return "onesouth";
 if(h==="frome town"&&a==="plymouth parkway")return "premiersouth";
 const v=[m.competition,m.competitionName,m.competitionTitle,m.league]
  .map(z=>typeof z==="object"?JSON.stringify(z||{}):String(z||"")).join(" ").toLowerCase();
 if(v.includes("one")&&v.includes("south"))return "onesouth";
 if(v.includes("one")&&v.includes("central"))return "onecentral";
 if(v.includes("premier")&&v.includes("south"))return "premiersouth";
 if(v.includes("premier")&&v.includes("central"))return "premiercentral";
 return "unclassified";
}
function normaliseLeague(payload,date){
 const doc={date,checkedAt:stamp(),status:"ok",source:"Southern League public match API",
  featured:null,matches:[],unclassified:[],apiMatchesInspected:0};
 const items=Array.isArray(payload.items)?payload.items:[];
 for(const m of items){
  if(!m||typeof m!=="object")continue;
  const date=String(m.kickOffDate||m.date||m.dateTime||m.kickoffDate||"");
  if(!date.startsWith(doc.date))continue;
  doc.apiMatchesInspected++;
  const home=team(m,"home"),away=team(m,"away");
  if(!home||!away)continue;
  const comp=competition(m,home,away);
  const score=m.score?.current;
  const cleanScore=score&&Number.isInteger(score.home)&&Number.isInteger(score.away)?{home:score.home,away:score.away}:null;
  const selected=FIXTURES[doc.date];
  const item={id:String(m._id||m.id||""),home,away,
   homeTeamId:String(m.homeTeam?._id||m.homeTeam?.id||m.homeTeamId||""),
   awayTeamId:String(m.awayTeam?._id||m.awayTeam?.id||m.awayTeamId||""),competition:comp,
   status:String(m.status||"unknown"),score:cleanScore,
   events:Array.isArray(m.events)?m.events.filter(e=>e&&typeof e==="object"):[],
   kickoff:String(m.time||m.dateTime||""),isFeatured:
    (selected&&String(m._id||m.id)===selected.id)||
    (selected&&home.toLowerCase()===selected.home.toLowerCase()&&away.toLowerCase()===selected.away.toLowerCase())||
    home.toLowerCase()==="tiverton town"||away.toLowerCase()==="tiverton town"};
  if(item.isFeatured)doc.featured=item;
  else {
   // Preserve *all* simultaneous Southern League fixtures, even where the
   // public API doesn't provide a competition label we can classify.
   doc.matches.push(item);
   if(comp==="unclassified")doc.unclassified.push({home,away});
  }
 }
 if(!doc.featured)doc.warning="Featured fixture missing from official response";
 return doc;
}
async function collectLeague(date){
 const query=new URLSearchParams({withEvents:"1",period:"Custom",startDate:date+"T00:00:00.000Z",
  endDate:date+"T23:59:59.999Z",limit:"100",status:"any"});
 const response=await fetch(LEAGUE_URL+"?"+query,{headers:{"Accept":"application/json",
  "X-TENANT-ID":"sfl","Origin":"https://www.southern-football-league.co.uk",
  "Referer":"https://www.southern-football-league.co.uk/live",
  "User-Agent":"TivvyLive/2.0"},cache:"no-store"});
 if(!response.ok)throw new Error("Southern League HTTP "+response.status);
 return normaliseLeague(await response.json(),date);
}
async function collectX(env,sinceId){
 if(!env.X_BEARER_TOKEN)return null;
 const url=new URL("https://api.x.com/2/users/244486255/tweets");
 const q=new URLSearchParams({max_results:"10","tweet.fields":"created_at,author_id,attachments,entities,referenced_tweets",
  expansions:"attachments.media_keys","media.fields":"type,url,preview_image_url,alt_text"});
 if(sinceId&&/^\d{5,20}$/.test(String(sinceId)))q.set("since_id",String(sinceId));
 url.search=q.toString();
 const response=await fetch(url,{headers:{Authorization:"Bearer "+env.X_BEARER_TOKEN,
  Accept:"application/json","User-Agent":"TivvyLive/2.0"},cache:"no-store"});
 if(!response.ok)throw new Error("X HTTP "+response.status);
 const raw=await response.json();
 const media=new Map((raw.includes?.media||[]).map(m=>[m.media_key,m]));
 const posts=(raw.data||[]).map(t=>({id:String(t.id),createdAt:t.created_at,text:t.text||"",
  media:(t.attachments?.media_keys||[]).map(k=>{const m=media.get(k)||{};return {
   type:m.type||"unknown",url:m.url||m.preview_image_url||"",alt:m.alt_text||""}}),
  url:"https://x.com/tivertontownfc/status/"+t.id}));
 return {checkedAt:stamp(),account:"@tivertontownfc",state:"ok",readOnly:true,
  posts,userId:"244486255",count:posts.length,contentRetrieved:true};
}
export class MatchCache {
 constructor(state,env){this.state=state;this.env=env;this.pending=null;}
 async fetch(request){
  const url=new URL(request.url),date=url.searchParams.get("date")||"2026-11-11";
  if(!validDate(date))return json({status:"error",message:"Unsupported matchday"},400);
  if(url.pathname==="/log"){
   const r=await this.state.storage.get("cache")||{};
   return json({status:"ok",date,events:r.audit||[],recentChecks:r.log||[],
    retained:(r.audit||[]).length,lastLeagueCollection:r.matchday?.checkedAt||null,
    xRequestsToday:r.xCalls||0,pollIntervalSeconds:20,pollingActive:inLiveWindow(date,(await this.state.storage.get("matchKickoff"))||FIXTURES[date]?.kickoff)});
  }
  if(url.pathname==="/start"){
   const kickoff=url.searchParams.get("kickoff")||FIXTURES[date]?.kickoff;
   if(inLiveWindow(date,kickoff)){
    await this.state.storage.put("matchKickoff",kickoff);
    // Cloudflare Cron starts the matchday without waiting for any browser.
    const alarm=await this.state.storage.getAlarm();
    if(!alarm)await this.state.storage.setAlarm(Date.now()+1000);
    return json({status:"ok",scheduled:true,date});
   }
   return json({status:"ok",scheduled:false,date,reason:"outside-match-window"});
  }
  if(this.pending)return this.pending.then(value=>json(value));
  this.pending=this.collect(date).finally(()=>{this.pending=null;});
  return this.pending.then(value=>json(value)).catch(e=>json({status:"error",message:String(e.message||e)},503));
 }
 async alarm(){
  const date=await this.state.storage.get("matchDate");
  const kickoff=await this.state.storage.get("matchKickoff");
  if(!validDate(date)||!inLiveWindow(date,kickoff))return;
  try{await this.collect(date);}
  finally{if(inLiveWindow(date,kickoff))await this.state.storage.setAlarm(Date.now()+MATCH_POLL_MS);}
 }
 async collect(date){
  const now=Date.now();
  await this.state.storage.put("matchDate",date);
  const kickoff=await this.state.storage.get("matchKickoff")||FIXTURES[date]?.kickoff;
  let record=await this.state.storage.get("cache")||{matchday:null,x:null,leagueAt:0,xAt:0,xCalls:0,log:[],audit:[]};
  if(!Array.isArray(record.audit))record.audit=[];
  const log=(type,detail)=>{record.log.unshift({at:stamp(),type,detail});record.log=record.log.slice(0,150);};
  if(now-record.leagueAt>=LEAGUE_TTL){
   try{
    const updated=await collectLeague(date);
    const previous=record.matchday;
    auditLeagueChange(record,previous,updated);
    record.matchday=updated;record.leagueAt=Date.now();
    const changed=JSON.stringify(previous?.featured)!==JSON.stringify(updated.featured) ||
     JSON.stringify(previous?.matches)!==JSON.stringify(updated.matches);
    log("southern-league",changed?"Source updated; fixtures/incidents changed":"HTTP 200; no incident changes");
   }catch(e){record.leagueAt=Date.now();log("southern-league-error",String(e.message||e));recordAudit(record,"southern-league","error",String(e.message||e));}
  }
  if(this.env.X_BEARER_TOKEN&&xAllowed(date,kickoff)&&record.xCalls<MAX_X_CALLS_PER_DAY&&now-record.xAt>=X_TTL){
   try{
    record.xCalls++;
    const latestId=record.x?.posts?.[0]?.id||null;
    const next=await collectX(this.env,latestId);
    const merged=new Map((record.x?.posts||[]).map(p=>[p.id,p]));
    for(const p of next.posts){
     if(!merged.has(p.id))recordAudit(record,"x","club-post",p.id+" · "+String(p.text||"").slice(0,180));
     merged.set(p.id,p);
    }
    next.posts=[...merged.values()].sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)).slice(0,200);
    record.x=next;record.xAt=Date.now();
    log("x","HTTP 200; "+next.posts.length+" retained posts");
   }catch(e){record.xAt=Date.now();log("x-error",String(e.message||e));recordAudit(record,"x","error",String(e.message||e));}
  }
  await this.state.storage.put("cache",record);
  return {status:record.matchday?"ok":"unavailable",matchday:record.matchday,x:record.x,
   lastLeagueCollection:record.matchday?.checkedAt||null,lastXCollection:record.x?.checkedAt||null,
   eventLog:record.log.slice(0,30),auditSummary:{entries:record.audit.length,latest:record.audit[0]||null},mode:"shared-live-cache",date,
   xRequestsToday:record.xCalls||0,xRequestCap:MAX_X_CALLS_PER_DAY,
   xCollectionMode:xAllowed(date,kickoff)?"matchday-window":"inactive"};
 }
}
export default {
 async scheduled(event,env,ctx){
  // GitHub Pages publishes Tivvy's fixture source. It supplies future match
  // dates and kickoffs, so no code deployment is needed for the next fixture.
  const n=ukNow();
  let kickoff=FIXTURES[n.date]?.kickoff;
  if(!kickoff){
   try{
    const response=await fetch("https://nickabull.github.io/Tiverton-Town-Get-Player-Info/match-centre-fixtures-2026-27.json",
     {cf:{cacheTtl:300,cacheEverything:true},headers:{Accept:"application/json"}});
    if(!response.ok)return;
    const data=await response.json();
    const match=(data.fixtures||[]).find(f=>f.date===n.date&&
     !String(f.result||"").trim()&&
     /^([0-2]\d):([0-5]\d)$/.test(String(f.kickOff||""))&&
     f.competition!=="PSF");
    if(!match)return;
    kickoff=match.kickOff;
   }catch(e){console.log("Fixture discovery unavailable",String(e));return}
  }
  if(!inLiveWindow(n.date,kickoff))return;
  const stub=env.MATCH_CACHE.get(env.MATCH_CACHE.idFromName("tivvy-live-"+n.date));
  ctx.waitUntil(stub.fetch("https://internal/start?date="+n.date+"&kickoff="+encodeURIComponent(kickoff)));
 },
 async fetch(request,env){
  const url=new URL(request.url);
  if(request.method==="OPTIONS")return json({});
  if(request.method!=="GET")return json({error:"method not allowed"},405);
  if(url.pathname==="/health")return json({status:"ok",service:"Tivvy Live collector"});
  if(url.pathname!=="/live"&&url.pathname!=="/log")return json({error:"not found"},404);
  const date=url.searchParams.get("date")||"2026-11-11";
  if(!validDate(date))return json({error:"Unsupported matchday"},400);
  const stub=env.MATCH_CACHE.get(env.MATCH_CACHE.idFromName("tivvy-live-"+date));
  return stub.fetch("https://internal"+url.pathname+"?date="+date);

 }
};
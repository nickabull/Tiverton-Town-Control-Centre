(function(){
"use strict";
const ORDER=["BAR","BID","BIS","BRI","DOR","EXM","FAL","HAR","HUN","LAR","MEL","PAU","POR","SHA","SLI","SPO","SWI","TIV","WES","WEY","WIL","WOR"],NAMES={"BAR":"Barnstaple Town","BID":"Bideford","BIS":"Bishops Cleeve","BRI":"Bristol Manor Farm","DOR":"Dorchester","EXM":"Exmouth Town","FAL":"Falmouth Town","HAR":"Hartpury","HUN":"Hungerford","LAR":"Larkhall Athletic","MEL":"Melksham Town","PAU":"Paulton Rovers","POR":"Portland United","SHA":"Shaftesbury","SLI":"Slimbridge","SPO":"Sporting Club Inkberrow","SWI":"Swindon Supermarine","TIV":"Tiverton Town","WES":"Westbury United","WEY":"Weymouth","WIL":"Willand Rovers","WOR":"Worcester Raiders"},CRESTS={"BAR":"barnstapletown","BID":"bideford","BIS":"bishopscleeve","BRI":"bristolmanorfarm","DOR":"dorchestertown","EXM":"exmouthtown","FAL":"falmouthtown","HAR":"hartpury","HUN":"hungerfordtown","LAR":"larkhallathletic","MEL":"melkshamtown","PAU":"paultonrovers","POR":"portlandunited","SHA":"shaftesbury","SLI":"slimbridge","SPO":"scinkberrow","SWI":"swindonsupermarine","TIV":"tivertontown","WES":"westburyunited","WEY":"weymouth","WIL":"willandrovers","WOR":"worcesterraiders"},ALIASES={"barnstapletown":"BAR","bideford":"BID","bishopscleeve":"BIS","bristolmanorfarm":"BRI","dorchester":"DOR","exmouthtown":"EXM","falmouthtown":"FAL","hartpury":"HAR","hungerford":"HUN","larkhallathletic":"LAR","melkshamtown":"MEL","paultonrovers":"PAU","portlandunited":"POR","shaftesbury":"SHA","slimbridge":"SLI","sportingclubinkberrow":"SPO","swindonsupermarine":"SWI","tivertontown":"TIV","westburyunited":"WES","weymouth":"WEY","willandrovers":"WIL","worcesterraiders":"WOR","bidefordafc":"BID","dorchestertown":"DOR","hartpuryfc":"HAR","hungerfordtown":"HUN","portlandutd":"POR","slimbridgeafc":"SLI","swindonsm":"SWI","westbury":"WES","weymouthfc":"WEY","scinkberrow":"SPO"},BASE={"BRI:BAR":"0-0","FAL:BAR":"3-1","HAR:BAR":"2-1","MEL:BAR":"1-4","TIV:BAR":"1-0","WIL:BAR":"0-2","WOR:BAR":"2-1","BIS:BID":"2-3","FAL:BID":"4-3","MEL:BID":"0-0","SHA:BID":"7-2","WES:BID":"2-2","BAR:BIS":"0-4","HUN:BIS":"3-0","LAR:BIS":"0-0","SHA:BIS":"1-2","SPO:BIS":"0-4","BID:BRI":"3-0","BIS:BRI":"4-1","PAU:BRI":"1-0","SLI:BRI":"1-2","SPO:BRI":"1-1","SWI:BRI":"3-1","WOR:BRI":"0-0","BID:DOR":"1-3","SPO:DOR":"1-3","SWI:DOR":"0-1","WEY:DOR":"5-1","WIL:DOR":"2-3","BAR:EXM":"1-2","BID:EXM":"1-1","DOR:EXM":"4-1","HUN:EXM":"5-1","POR:EXM":"3-2","TIV:EXM":"1-2","WES:EXM":"2-1","BRI:FAL":"2-2","HUN:FAL":"2-0","PAU:FAL":"1-3","POR:FAL":"1-2","SWI:FAL":"1-1","WEY:FAL":"2-1","BID:HAR":"2-1","BIS:HAR":"1-0","DOR:HAR":"2-1","EXM:HAR":"1-1","HUN:HAR":"4-1","PAU:HAR":"0-0","SPO:HAR":"0-2","TIV:HAR":"3-1","WES:HAR":"0-2","BAR:HUN":"1-2","DOR:HUN":"1-0","LAR:HUN":"1-2","MEL:HUN":"1-0","SLI:HUN":"0-3","WES:HUN":"1-0","FAL:LAR":"2-1","MEL:LAR":"0-2","POR:LAR":"4-1","SLI:LAR":"0-1","SPO:LAR":"2-2","WIL:LAR":"4-1","WOR:LAR":"3-1","BIS:MEL":"3-0","BRI:MEL":"0-0","DOR:MEL":"3-0","HAR:MEL":"3-1","SPO:MEL":"1-1","WIL:MEL":"2-0","BAR:PAU":"1-2","BID:PAU":"0-0","DOR:PAU":"2-0","SWI:PAU":"3-1","TIV:PAU":"2-2","BID:POR":"1-2","BRI:POR":"0-0","MEL:POR":"6-0","PAU:POR":"3-3","SLI:POR":"1-0","TIV:POR":"1-4","BRI:SHA":"0-2","EXM:SHA":"1-0","LAR:SHA":"1-2","POR:SHA":"2-0","SPO:SHA":"3-1","SWI:SHA":"1-0","WEY:SHA":"4-1","DOR:SLI":"0-2","EXM:SLI":"2-0","FAL:SLI":"0-1","SHA:SLI":"5-4","SPO:SLI":"2-0","WOR:SLI":"4-0","HUN:SPO":"2-1","PAU:SPO":"1-3","POR:SPO":"0-4","WES:SPO":"1-3","BAR:SWI":"1-2","BID:SWI":"0-2","BIS:SWI":"0-1","HAR:SWI":"4-1","LAR:SWI":"1-2","SLI:SWI":"2-7","WES:SWI":"3-0","WIL:SWI":"0-2","DOR:TIV":"2-1","FAL:TIV":"2-1","HUN:TIV":"1-1","LAR:TIV":"1-3","SHA:TIV":"1-4","WES:TIV":"1-0","BRI:WES":"1-4","LAR:WES":"3-0","POR:WES":"1-2","SHA:WES":"1-4","WEY:WES":"1-0","WIL:WES":"3-1","WOR:WES":"0-0","BAR:WEY":"0-3","BRI:WEY":"1-4","EXM:WEY":"2-5","HUN:WEY":"0-0","LAR:WEY":"2-3","MEL:WEY":"0-2","WOR:WEY":"0-1","BID:WIL":"1-1","FAL:WIL":"0-1","HAR:WIL":"3-2","SHA:WIL":"1-1","SLI:WIL":"3-3","BAR:WOR":"4-0","BIS:WOR":"1-2","FAL:WOR":"1-1","HAR:WOR":"1-1","MEL:WOR":"1-2","PAU:WOR":"0-0","SHA:WOR":"3-0","SWI:WOR":"1-0","TIV:WOR":"2-2","BAR:WES":"1-2","DOR:LAR":"3-0","EXM:BRI":"5-0","HAR:FAL":"3-0","HUN:SHA":"3-1","PAU:WIL":"0-1","SLI:MEL":"2-4","SWI:POR":"0-0","TIV:BIS":"3-1","WOR:BID":"0-0"};
const CREST_ROOT="https://raw.githubusercontent.com/nickabull/Tiverton-Town-Get-Player-Info/main/assets/locked-crests/";
const FEED="https://nickabull.github.io/Tiverton-Town-Get-Results/data.json";
const VERIFIED="https://raw.githubusercontent.com/nickabull/Tiverton-Town-Get-Results/main/verified-results.json";
const crest=c=>CREST_ROOT+CRESTS[c]+".png",code=n=>ALIASES[String(n||"").toLowerCase().replace(/[^a-z0-9]/g,"")]||null;
function el(tag,cls,parent){const x=document.createElement(tag);x.className=cls||"";if(parent)parent.append(x);return x}
function draw(div,layer,save){
 div.classList.add("mx-layer");const box=el("div","mx-body",div);
 el("div","mx-handle",box).textContent="DRAG TABLE";
 const grid=el("div","mx-grid",box);
 function axis(c){const n=el("div","mx-cell mx-axis"+(c==="TIV"?" mx-tivhead":""),grid);const image=el("img","",n);image.src=crest(c);image.alt="";el("span","",n).textContent=c;n.title=NAMES[c]}
 el("div","mx-cell mx-corner",grid).textContent="A/H";
 ORDER.forEach(axis);
 for(const away of ORDER){
  axis(away);
  for(const home of ORDER){
   const diag=home===away;
   const cell=el("div","mx-cell"+(diag?" mx-diag":(home==="TIV"||away==="TIV"?" mx-tivband":""))+(diag?"":" mx-score"),grid);
   if(diag)continue;
   const key=home+":"+away;let last=(layer.matrixScores||{})[key]||"";
   function show(value){cell.replaceChildren();const m=String(value||"").match(/^(\d+)-(\d+)$/);if(!m){cell.textContent=value||"";return}
    el("span",home==="TIV"?"mx-red":"",cell).textContent=m[1];el("span","",cell).textContent="-";el("span",away==="TIV"?"mx-red":"",cell).textContent=m[2]}
   show(last);cell.title=NAMES[home]+" v "+NAMES[away]+" - click to edit";
   cell.contentEditable=String(!layer.locked);cell.spellcheck=false;
   cell.addEventListener("pointerdown",e=>e.stopPropagation());
   cell.addEventListener("focus",()=>{cell.textContent=(layer.matrixScores||{})[key]||""});
   cell.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();cell.blur()}});
   cell.addEventListener("blur",()=>{const val=cell.textContent.trim().replace(/\s+/g,"");
    if(val&&!/^\d+-\d+$/.test(val)){alert("Enter a score like 2-1, or leave blank");show(last);return}
    if(val!==last){layer.matrixScores=layer.matrixScores||{};layer.matrixManual=layer.matrixManual||{};
      if(val)layer.matrixScores[key]=val;else delete layer.matrixScores[key];
      layer.matrixManual[key]=true;last=val;save("matrix-cell")}
    show(last)});
  }
 }
 const legend=el("div","mx-legend",box);
 ORDER.forEach(c=>{const item=el("div","mx-legenditem"+(c==="TIV"?" mx-tivlegend":""),legend);
  const im=el("img","",item);im.src=crest(c);im.alt="";
  const t=el("div","",item);el("strong","",t).textContent=c;el("small","",t).textContent=NAMES[c]});
}
async function refresh(layer,save,confirmed){
 if(confirmed&&!confirm("Refresh the matrix from Programme Centre results? Manually edited cells will be retained."))return null;
 const scores={...BASE};let date="2026-11-14";let loaded=0;
 const get=async url=>{const r=await fetch(url+"?v="+Date.now(),{cache:"no-store"});if(!r.ok)throw Error(String(r.status));return r.json()};
 try{const d=await get(FEED);for(const m of d.results||[]){const h=code(m.home),a=code(m.away);if(h&&a&&/^\d+-\d+$/.test(m.score||"")){scores[h+":"+a]=m.score;loaded++}if(m.date&&m.date>date)date=m.date}}catch(e){console.warn("Results feed unavailable, verified baseline retained",e)}
 try{const d=await get(VERIFIED);for(const m of d.results||[]){const h=code(m.home),a=code(m.away);if(h&&a&&/^\d+-\d+$/.test(m.score||""))scores[h+":"+a]=m.score;if(m.date&&m.date>date)date=m.date}}catch(e){console.warn("Verified results overlay unavailable",e)}
 layer.matrixScores=layer.matrixScores||{};for(const [k,val]of Object.entries(scores))if(!layer.matrixManual?.[k])layer.matrixScores[k]=val;
 layer.matrixDate=date;save("matrix-refresh");return {date,loaded,count:Object.keys(scores).length};
}
window.TivvyMatrix={ORDER,NAMES,BASE,draw,refresh};
})();
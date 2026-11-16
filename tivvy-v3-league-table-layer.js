/* Tivvy V3 independent, editable 14 Nov 2026 standings trial.
   Source figures: footballwebpages.co.uk/southern-football-league-division-one-south
   and nonleagueranking.com/leaguerank.php?League=SL+1S&view=table
   Data is a dated snapshot, not a live refresh feed. */
(function(){
"use strict";
const DATE="2026-11-14";
const CREST_ROOT="https://raw.githubusercontent.com/nickabull/Tiverton-Town-Get-Player-Info/main/assets/locked-crests/";
const CRESTS={
 WEY:"weymouthfc",WES:"westburyunited",SWI:"swindonsm",DOR:"dorchestertown",
 HUN:"hungerfordtown",HAR:"hartpury",SPO:"scinkberrow",TIV:"tivertontown",
 FAL:"falmouthtown",POR:"portlandunited",WIL:"willandrovers",WOR:"worcesterraiders",
 BIS:"bishopscleeve",EXM:"exmouthtown",BAR:"barnstapletown",MEL:"melkshamtown",
 SHA:"shaftesbury",BID:"bideford",SLI:"slimbridge",LAR:"larkhallathletic",
 PAU:"paultonrovers",BRI:"bristolmanorfarm"};
// position, short code, club, played, won, drawn, lost, goals for, against, points
const SNAPSHOT=[
[1,"WEY","Weymouth",15,13,1,1,42,11,40],
[2,"WES","Westbury United",19,12,2,5,35,20,38],
[3,"SWI","Swindon Supermarine",18,12,2,4,34,20,38],
[4,"DOR","Dorchester Town",17,12,1,4,37,21,37],
[5,"HUN","Hungerford Town",17,10,3,4,31,13,33],
[6,"HAR","Hartpury",18,9,3,6,34,22,30],
[7,"SPO","Sporting Club Inkberrow",16,7,4,5,29,25,25],
[8,"TIV","Tiverton Town",17,7,4,6,29,25,25],
[9,"FAL","Falmouth Town",17,7,4,6,25,25,25],
[10,"POR","Portland United",16,7,4,5,25,25,25],
[11,"WIL","Willand Rovers",16,7,3,6,23,24,24],
[12,"WOR","Worcester Raiders",20,5,9,6,19,25,24],
[13,"BIS","Bishops Cleeve",16,7,2,7,26,25,23],
[14,"EXM","Exmouth Town",15,6,3,6,24,26,21],
[15,"BAR","Barnstaple Town",19,6,2,11,27,30,20],
[16,"MEL","Melksham Town",17,5,3,9,22,32,18],
[17,"SHA","Shaftesbury",18,5,2,11,28,40,17],
[18,"BID","Bideford",17,3,7,7,22,30,16],
[19,"SLI","Slimbridge",17,4,2,11,21,43,14],
[20,"LAR","Larkhall Athletic",18,3,4,11,20,34,13],
[21,"PAU","Paulton Rovers",16,2,6,8,11,23,12],
[22,"BRI","Bristol Manor Farm",19,1,7,11,12,37,10]
];
// The original printed page 19 is already saved locally as a reference JPEG.
 // It contains every club badge. Use a small crop only when a live crest URL is broken.
 const REFERENCE_CREST_ORDER=["WEY","SWI","WES","DOR","HUN","HAR","SPO","FAL","POR","BIS","WOR","TIV","WIL","BAR","EXM","SHA","BID","MEL","SLI","LAR","PAU","BRI"];
 let referenceCrestPromise=null;
 function fromOriginalPrintedPage(){
  if(referenceCrestPromise)return referenceCrestPromise;
  referenceCrestPromise=new Promise(resolve=>{
   try{
    const req=indexedDB.open("tivvy-v3-reference-art-v1",1);
    req.onerror=()=>resolve({});
    req.onsuccess=()=>{
     const db=req.result;
     if(!db.objectStoreNames.contains("images")){db.close();resolve({});return}
     const tx=db.transaction("images","readonly"),read=tx.objectStore("images").get("page-19");
     read.onerror=()=>{db.close();resolve({})};
     read.onsuccess=()=>{
      const blob=read.result;db.close();
      if(!(blob instanceof Blob)){resolve({});return}
      const url=URL.createObjectURL(blob),im=new Image();
      im.onload=()=>{
       URL.revokeObjectURL(url);
       const output={},ratio=im.naturalWidth/804;
       REFERENCE_CREST_ORDER.forEach((code,i)=>{
        const cv=document.createElement("canvas");cv.width=40;cv.height=40;
        const cx=cv.getContext("2d"),y=(273.5+i*(685/21));
        try{cx.drawImage(im,95*ratio,(y-16)*ratio,31*ratio,32*ratio,0,0,40,40);output[code]=cv.toDataURL("image/png")}
        catch(e){}
       });
       resolve(output);
      };
      im.onerror=()=>{URL.revokeObjectURL(url);resolve({})};
      im.src=url;
     };
    };
   }catch(e){resolve({})}
  });
  return referenceCrestPromise;
 }
 function makeRows(){return SNAPSHOT.map(([rank,code,club,p,w,d,l,gf,ga,pts])=>({rank,code,club,p,w,d,l,gf,ga,gd:gf-ga,pts}));}
function editable(td,row,key,save){
 const editable=document.createElement("span");editable.className="v3-standings-field";
 editable.textContent=String(row[key]);editable.contentEditable="true";editable.spellcheck=false;
 editable.setAttribute("aria-label",row.club+" "+key);
 editable.addEventListener("pointerdown",e=>e.stopPropagation());
 editable.addEventListener("dblclick",e=>e.stopPropagation());
 editable.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();editable.blur()}});
 editable.addEventListener("blur",()=>{
  const old=row[key],value=editable.textContent.trim().replace(/\s+/g," ");
  if(key==="club"){if(!value){editable.textContent=old;return}row.club=value.slice(0,80)}
  else if(key==="gd"){
   if(!/^-?\d{1,4}$/.test(value)){editable.textContent=old;return}
   row.gd=Number(value);
  }else{
   if(!/^\d{1,4}$/.test(value)){editable.textContent=old;return}
   row[key]=Number(value);
  }
  editable.textContent=String(row[key]);
  if(row[key]!==old)save("standings-cell");
 });
 td.append(editable);
}
function draw(div,layer,save){
 div.classList.add("v3-standings-layer");
 const table=document.createElement("table");table.className="v3-standings";table.setAttribute("aria-label","Southern League Division One South league standings");
 const head=document.createElement("thead"),tr=document.createElement("tr");
 for(const label of ["POS","", "CLUB","P","W","D","L","GF","GA","GD","PTS"]){
  const th=document.createElement("th");th.textContent=label;tr.append(th);
 }head.append(tr);table.append(head);
 const body=document.createElement("tbody");
 const rows=Array.isArray(layer.standingsRows)&&layer.standingsRows.length?layer.standingsRows:makeRows();
 layer.standingsRows=rows;
 for(const row of rows){
  const tr=document.createElement("tr");tr.className=row.code==="TIV"?"v3-standings-tiv":row.rank===1?"v3-standings-promotion":row.rank>=2&&row.rank<=5?"v3-standings-playoffs":row.rank>=19?"v3-standings-relegation":"v3-standings-clear";
  const pos=document.createElement("td");pos.textContent=String(row.rank);tr.append(pos);
  const badge=document.createElement("td");const img=document.createElement("img");img.className="v3-standings-crest";
  img.src=CREST_ROOT+(CRESTS[row.code]||row.code.toLowerCase())+".png";img.alt=row.club+" crest";
  const fallback=document.createElement("span");fallback.className="v3-standings-crest-fallback";
  fallback.textContent=row.code;fallback.title=row.club+" — crest image not available";
  fallback.style.display="none";
  // Try both the original matrix crest name and the team short code before falling back.
  const candidates=[CREST_ROOT+(CRESTS[row.code]||row.code.toLowerCase())+".png",CREST_ROOT+row.code.toLowerCase()+".png"];
  let attempt=0;
  img.onerror=async()=>{
   attempt++;
   if(attempt<candidates.length){img.src=candidates[attempt];return}
   const crops=await fromOriginalPrintedPage();
   if(crops[row.code]){img.onerror=null;img.src=crops[row.code];img.style.display="inline-block";return}
   img.style.display="none";fallback.style.display="inline-flex";
   badge.title=row.club+" — crest not found in available sources";
  };
  img.src=candidates[0];
  badge.append(img,fallback);tr.append(badge);
  for(const key of ["club","p","w","d","l","gf","ga","gd","pts"]){
   const td=document.createElement("td");if(key==="club")td.className="v3-standings-club";
   if(key==="pts")td.classList.add("v3-standings-points");
   if(layer.locked)td.textContent=String(row[key]);else editable(td,row,key,save);
   tr.append(td);
  }
  body.append(tr);
 }
 table.append(body);div.append(table);
}
window.TivvyV3Standings={DATE,CRESTS,makeRows,draw};
})();

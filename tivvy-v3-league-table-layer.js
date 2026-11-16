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
function makeRows(){return SNAPSHOT.map(([rank,code,club,p,w,d,l,gf,ga,pts])=>({rank,code,club,p,w,d,l,gf,ga,gd:gf-ga,pts}));}
function editable(td,row,key,save){
 const editable=document.createElement("span");editable.className="v3-standings-field";
 editable.textContent=String(row[key]);editable.contentEditable="true";editable.spellcheck=false;
 editable.setAttribute("aria-label",row.club+" "+key);
 editable.addEventListener("pointerdown",e=>e.stopPropagation());
 editable.addEventListener("dblclick",e=>e.stopPropagation());
 editable.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();editable.blur()}});
 editable.addEventListener("blur",()=>{
  const old=row[key],value=editable.textContent.trim().replace(/\\s+/g," ");
  if(key==="club"){if(!value){editable.textContent=old;return}row.club=value.slice(0,80)}
  else if(key==="gd"){
   if(!/^-?\\d{1,4}$/.test(value)){editable.textContent=old;return}
   row.gd=Number(value);
  }else{
   if(!/^\\d{1,4}$/.test(value)){editable.textContent=old;return}
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
  img.onerror=()=>{img.style.display="none";badge.title=row.club+" crest unavailable"};
  badge.append(img);tr.append(badge);
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

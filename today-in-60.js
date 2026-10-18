(function(){
'use strict';
const keys=['story','ourForm','visitors','watchFor'],labels=['THE STORY','OUR FORM','THE VISITORS','WATCH FOR'];
const $=id=>document.getElementById(id);let data=null;const storageKey='tivvy-today-in-60-bideford-20261020-v1';
function say(text){$('status').textContent=text;}
function current(){return Object.fromEntries(keys.map(k=>[k,$(k).innerText.replace(/\r/g,'').trim()]));}
function countWords(text){return (text.trim().match(/\S+/g)||[]).length;}
function measure(){const count=countWords(Object.values(current()).join(' '));const seconds=Math.ceil(count/3);$('reading').textContent=`${count} words · about ${seconds} seconds at 180 words/min${seconds>60?' · trim the copy to fit 60 seconds':''}`;}
function save(){measure();try{localStorage.setItem(storageKey,JSON.stringify(current()));localStorage.removeItem('tivvy-v21-approved-today_in_60');say('Edits saved in this browser.');}catch(e){say('Browser storage is unavailable. Copy your text to keep these edits.');}}
function fill(copy){keys.forEach(k=>{$(k).textContent=typeof copy[k]==='string'?copy[k]:data.copy[k];});measure();}
function badges(id,matches){$(id).replaceChildren(...matches.map(m=>{const b=document.createElement('span');b.className='badge '+m.outcome;b.textContent=m.outcome;b.title=`${m.date} · ${m.opponent} (${m.venue}) ${m.gf}–${m.ga}`;return b;}));}
function plainText(){const c=current();return `${data.title.toUpperCase()}\n${data.fixture}\n${data.date} · ${data.kickoff}\n\n`+keys.map((k,i)=>labels[i]+'\n'+c[k]+(k==='ourForm'?'\nLast five: '+data.home.lastFive.map(r=>r.outcome).join(' '):k==='visitors'?'\nLast five: '+data.away.lastFive.map(r=>r.outcome).join(' '):'')).join('\n\n')+'\n\nLeague form through 17 October 2026; oldest first.\n\nSources\n'+data.sources.map(s=>s.label+': '+s.url).join('\n');}
$('copy').addEventListener('click',async()=>{if(!data)return;try{await navigator.clipboard.writeText(plainText());say('Programme text copied, with form dates and source links.');}catch(e){say('Clipboard is unavailable. Select the text in the preview to copy it, or use Print / save PDF.');}});
$('print').addEventListener('click',()=>window.print());
$('reset').addEventListener('click',()=>{if(!data||!window.confirm('Replace your edited paragraphs with the original match copy?'))return;fill(data.copy);save();});
keys.forEach(k=>$(k).addEventListener('input',save));
async function boot(){try{const r=await fetch('data/today-in-60-bideford.json?v=1');if(!r.ok)throw Error('Snapshot unavailable');data=await r.json();let saved=null;try{saved=JSON.parse(localStorage.getItem(storageKey)||'null');}catch(e){}fill(saved&&typeof saved==='object'?saved:data.copy);badges('our-badges',data.home.lastFive);badges('their-badges',data.away.lastFive);say(saved?'Your saved match edits are loaded.':'Bideford cup preview ready. Click a paragraph to edit it.');}catch(e){say('The demo snapshot could not load. Reload the page to try again.');$('copy').disabled=true;$('reset').disabled=true;}}
boot();
})();

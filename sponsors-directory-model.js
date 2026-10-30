(function(root){
 'use strict';
 const normalize=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim();
 function visible(record,today=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/London'})){
  return record.status==='active'&&record.confidence==='confirmed'&&(!record.activeFrom||record.activeFrom<=today)&&(!record.activeUntil||record.activeUntil>=today);
 }
 function search(records,query,category){
  const words=normalize(query).split(' ').filter(Boolean);
  return records.filter(r=>(!category||(r.categories||[]).includes(category))&&words.every(word=>normalize([r.name,r.summary,r.address,r.serviceArea,...(r.categories||[]),...(r.keywords||[]),...(r.searchAliases||[])].join(' ')).includes(word))).sort((a,b)=>a.name.localeCompare(b.name,'en-GB',{sensitivity:'base'}));
 }
 function url(value,kind='web'){
  if(!value)return '';
  if(kind==='phone')return /^\+?[\d\s().-]{6,30}$/.test(value)?'tel:'+value.replace(/[^+\d]/g,''):'';
  if(kind==='email')return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)?'mailto:'+value:'';
  try{const u=new URL(value);return u.protocol==='https:'||u.protocol==='http:'?u.href:''}catch{return ''}
 }
 const api={normalize,visible,search,url};root.TivvySponsors=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

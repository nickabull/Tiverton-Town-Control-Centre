export const PUBLISHER_URL='https://www.tivertontownfc.uk/_functions/newsPublisher';

// Only the formats offered by the article editor are converted to Wix rich content.
export function articleToRicos(root){
  function blocks(parent,styles=[]){
    const output=[];let runs=[];
    function flush(force=false){if(runs.length||force)output.push({type:'PARAGRAPH',nodes:runs,paragraphData:{}});runs=[];}
    function inline(node,formats){
      if(node.nodeType===3){
        node.textContent.split(/\r?\n/).forEach((text,i)=>{if(i)flush(true);if(text)runs.push({type:'TEXT',textData:{text,decorations:formats}});});return;
      }
      const tag=node.nodeName;
      if(tag==='BR'){flush(true);return;}
      if(tag==='P'||tag==='DIV'){flush();output.push(...blocks(node,formats));return;}
      if(tag==='UL'||tag==='OL'){
        flush();const ordered=tag==='OL';
        output.push({type:ordered?'ORDERED_LIST':'BULLETED_LIST',nodes:[...node.children].filter(x=>x.nodeName==='LI').map(li=>({type:'LIST_ITEM',nodes:blocks(li,formats)})),[ordered?'orderedListData':'bulletedListData']:{indentation:0}});return;
      }
      let next=formats;
      const decoration={B:{type:'BOLD',fontWeightValue:700},STRONG:{type:'BOLD',fontWeightValue:700},I:{type:'ITALIC',italicData:true},EM:{type:'ITALIC',italicData:true},U:{type:'UNDERLINE'}}[tag];
      if(decoration&&!formats.some(x=>x.type===decoration.type))next=[...formats,decoration];
      [...node.childNodes].forEach(child=>inline(child,next));
    }
    [...parent.childNodes].forEach(node=>inline(node,styles));flush();
    return output.length?output:[{type:'PARAGRAPH',nodes:[],paragraphData:{}}];
  }
  return {nodes:blocks(root)};
}

async function request(payload,getToken){
  const token=await getToken();
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),60000);
  try{
    const response=await fetch(PUBLISHER_URL,{method:'POST',headers:{'Content-Type':'application/json','X-Tivvy-Token':token},body:JSON.stringify(payload),signal:controller.signal});
    const result=await response.json().catch(()=>({}));
    if(!response.ok||!result.ok)throw new Error(result.error||'Wix could not complete the request. Your draft is retained.');
    return result;
  }catch(error){
    if(error.name==='AbortError')throw new Error('Wix has not confirmed the result yet. Your draft is retained; retry to check the same Wix article.');
    throw error;
  }finally{clearTimeout(timer);}
}

export async function connectionReady(){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
  try{const response=await fetch(PUBLISHER_URL,{signal:controller.signal,cache:'no-store'});const result=await response.json();return response.ok&&result.service==='tivvy-news-publisher'&&result.version===1;}
  catch{return false;}finally{clearTimeout(timer);}
}

export async function photoPayload(file){
  if(!file)return null;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Please choose a JPG, PNG or WebP photograph.');
  const image=new Image();const url=URL.createObjectURL(file);
  try{
    await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('The selected photograph could not be read.'));image.src=url;});
    const scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
    const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
    let data=canvas.toDataURL('image/jpeg',.85);
    for(const quality of [.7,.55,.4]){if(data.length<=1000000)break;data=canvas.toDataURL('image/jpeg',quality);}
    if(data.length>1000000)throw new Error('Please choose a smaller photograph for this upload.');
    return {name:file.name.replace(/\.[^.]+$/,'')+'.jpg',mimeType:'image/jpeg',base64:data.split(',')[1]};
  }finally{URL.revokeObjectURL(url);}
}

// Remember the Wix draft before publishing. A retry publishes that same ID.
export async function publishArticle(article,getToken,notify=()=>{}){
  const identity=JSON.stringify([article.title,article.credit,article.bodyHtml]);
  const storageKey='ttfc-news-publisher-wix-result-v1';
  let saved;try{saved=JSON.parse(localStorage.getItem(storageKey)||'null');}catch{}
  if(saved?.identity===identity&&saved.published)return saved;
  if(saved?.identity!==identity){
    notify('Uploading photograph and preparing the article in Wix…');
    const ready=await request({action:'prepare',title:article.title,credit:article.credit,richContent:article.richContent,image:article.image},getToken);
    saved={identity,draftId:ready.draftId,url:ready.url,published:false};
    try{localStorage.setItem(storageKey,JSON.stringify(saved));}catch{throw new Error('Wix saved the draft, but this browser could not retain its ID. Nothing has been published; check Wix drafts before retrying.');}
  }
  notify('Publishing the article to the News page…');
  const result=await request({action:'publish',draftId:saved.draftId},getToken);
  saved={...saved,...result,published:true};
  try{localStorage.setItem(storageKey,JSON.stringify(saved));}catch{}
  return saved;
}

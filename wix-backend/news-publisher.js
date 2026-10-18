// Install as backend/news-publisher.js in the EXISTING Tiverton Town Wix site.
import { response } from 'wix-http-functions';
import { fetch } from 'wix-fetch';
import { draftPosts } from 'wix-blog-backend';
import { mediaManager } from 'wix-media-backend';
import { elevate } from 'wix-auth';
import { Buffer } from 'buffer';

const ORIGIN='https://nickabull.github.io';
const FIREBASE_KEY='AIzaSyDh_C_04Im_WVTHzkacmkmWrC1_IErSznU'; // Public project identifier, not a publishing secret.
const ALLOWED_UID='Zd5BIrcwXhdpYHWCck0MmOEL9Ws2';
// Same public author ID used on the club's Portland preview.
const AUTHOR_ID='2f6bb74c-3b7b-4853-bfcd-dda9893843b3';
const createDraft=elevate(draftPosts.createDraftPost);
const publishDraft=elevate(draftPosts.publishDraftPost);
const getDraft=elevate(draftPosts.getDraftPost);

function reply(status,body){const options={status,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Tivvy-Token','Cache-Control':'no-store','Vary':'Origin'}};if(status!==204)options.body=body;return response(options);}
function fail(message,status=400){const error=new Error(message);error.status=status;throw error;}
function header(request,name){return Object.entries(request.headers||{}).find(([key])=>key.toLowerCase()===name)?.[1];}
function originAllowed(request){return header(request,'origin')===ORIGIN;}
export function publisherHealth(){return reply(200,{service:'tivvy-news-publisher',version:1});}
export function publisherPreflight(request){return originAllowed(request)?reply(204,null):reply(403,{ok:false,error:'Origin not permitted.'});}

async function authorise(request){
  if(!originAllowed(request))fail('Origin not permitted.',403);
  const token=header(request,'x-tivvy-token');
  if(typeof token!=='string'||token.length>10000)fail('Please sign in to the Programme Centre.',401);
  const result=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+FIREBASE_KEY,{method:'post',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:token})});
  if(!result.ok)fail('Your sign-in has expired. Please sign in again.',401);
  const data=await result.json();
  if(data.users?.length!==1||data.users[0].localId!==ALLOWED_UID||data.users[0].disabled)fail('This account is not authorised to publish.',403);
}

// Rebuild a small, known Ricos subset; never pass through arbitrary plugin data.
export function safeContent(content){
  let count=0,characters=0,hasText=false;
  function node(value,parent,depth){
    if(!value||depth>15||++count>6000)fail('Article structure is too large.');
    const type=value.type;
    const allowed={ROOT:['PARAGRAPH','BULLETED_LIST','ORDERED_LIST'],BULLETED_LIST:['LIST_ITEM'],ORDERED_LIST:['LIST_ITEM'],LIST_ITEM:['PARAGRAPH'],PARAGRAPH:['TEXT']}[parent];
    if(!allowed?.includes(type))fail('Unsupported article formatting.');
    if(type==='TEXT'){
      const text=value.textData?.text;if(typeof text!=='string'||/[\r\n]/.test(text))fail('Invalid article text.');
      characters+=text.length;hasText=hasText||Boolean(text.trim());if(characters>100000)fail('Article is too long.');
      const decorations=(value.textData.decorations||[]).map(format=>{
        if(format.type==='BOLD')return {type:'BOLD',fontWeightValue:700};
        if(format.type==='ITALIC')return {type:'ITALIC',italicData:true};
        if(format.type==='UNDERLINE')return {type:'UNDERLINE'};
        fail('Unsupported article formatting.');
      });
      return {type:'TEXT',textData:{text,decorations}};
    }
    if(!Array.isArray(value.nodes||[]))fail('Invalid article structure.');
    const clean={type,nodes:(value.nodes||[]).map(child=>node(child,type,depth+1))};
    if(type==='PARAGRAPH')clean.paragraphData={};
    if(type==='BULLETED_LIST')clean.bulletedListData={indentation:0};
    if(type==='ORDERED_LIST')clean.orderedListData={indentation:0};
    return clean;
  }
  if(!Array.isArray(content?.nodes)||!content.nodes.length)fail('Add article text before publishing.');
  const nodes=content.nodes.map(value=>node(value,'ROOT',0));
  if(!hasText)fail('Add article text before publishing.');
  return {nodes};
}

async function prepare(data){
  const title=typeof data.title==='string'?data.title.trim():'';
  if(!title||title.length>180)fail('Add a title of up to 180 characters.');
  const richContent=safeContent(data.richContent);
  const credit=typeof data.credit==='string'?data.credit.replace(/[\r\n]+/g,' ').trim():'';
  if(credit.length>1000)fail('Please shorten the photograph credit.');
  if(credit)richContent.nodes.unshift({type:'PARAGRAPH',nodes:[{type:'TEXT',textData:{text:credit,decorations:[{type:'ITALIC',italicData:true}]}}],paragraphData:{}},{type:'PARAGRAPH',nodes:[],paragraphData:{}});
  const post={title,memberId:AUTHOR_ID,richContent};
  if(data.image){
    const photo=data.image;
    if(photo.mimeType!=='image/jpeg'||typeof photo.base64!=='string'||photo.base64.length>1000000||!/^[A-Za-z0-9+/]*={0,2}$/.test(photo.base64))fail('Invalid photograph. Please select it again.');
    const bytes=Buffer.from(photo.base64,'base64');
    if(bytes.length<4||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)fail('Invalid JPEG photograph.');
    const name=String(photo.name||'article.jpg').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,120);
    const file=await mediaManager.upload('/News Publisher',bytes,name,{mediaOptions:{mimeType:'image/jpeg',mediaType:'image'},metadataOptions:{isPrivate:false,isVisitorUpload:false}});
    if(!file.fileUrl)fail('Wix did not confirm the photograph upload.',502);
    post.media={custom:true,displayed:true,wixMedia:{image:file.fileUrl}};
  }
  const draft=await createDraft(post,{publish:false,fieldsets:['URL']});
  if(!draft._id)fail('Wix did not return an article ID.',502);
  return {ok:true,draftId:draft._id,url:draft.url||'',published:false};
}

export async function publisherPost(request){
  try{
    await authorise(request);
    const text=await request.body.text();if(text.length>1400000)fail('The article and photograph are too large.');
    let data;try{data=JSON.parse(text);}catch{fail('The article request could not be read.');}
    if(data.action==='prepare')return reply(200,await prepare(data));
    if(data.action!=='publish'||typeof data.draftId!=='string'||!/^[a-f0-9-]{36}$/i.test(data.draftId))fail('Invalid publishing request.');
    const draft=await getDraft(data.draftId,{fieldsets:['URL']});
    if(draft.memberId!==AUTHOR_ID)fail('This draft is not part of the Programme Centre publisher.',403);
    if(draft.status==='PUBLISHED'&&!draft.hasUnpublishedChanges)return reply(200,{ok:true,published:true,draftId:data.draftId,url:draft.url||''});
    const published=await publishDraft(data.draftId);
    if(!published.postId)fail('Wix has not confirmed publication. Retry the same draft.',502);
    return reply(200,{ok:true,published:true,draftId:data.draftId,postId:published.postId,url:draft.url||''});
  }catch(error){
    console.error('News Publisher request failed:',error.message);
    return reply(error.status||500,{ok:false,error:error.status?error.message:'Wix could not finish publishing. Your draft is retained; retry the same article.'});
  }
}

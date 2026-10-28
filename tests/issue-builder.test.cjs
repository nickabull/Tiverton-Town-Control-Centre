const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const P=require('../issue-page-plan.js');
const values=new Map([['tivvy-v21-meta-matchDate','03/11/2026'],['tivvy-v21-meta-opponent','Test opposition'],['tivvy-v21-meta-kickoff','19:30'],['tivvy-v21-lastOut-report','Current report supplied'],['tivvy-v21-oppPreview-report','Current preview supplied'],['tivvy-issue-penpics','Club pen-pics document'],['tivvy-issue-clubfacts','Club website']]);
const localStorage={get length(){return values.size},key:i=>[...values.keys()][i],getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
const nodes={},events={},downloads=[];
function node(id){return nodes[id]||=(new class{innerHTML='';textContent='';value='';hidden=true;disabled=false;querySelectorAll(){return [];}onclick=null;});}
const document={getElementById:node,addEventListener:(name,fn)=>events[name]=fn,createElement:()=>({click(){downloads.push(this.download)}})};
class URLMock extends URL{static createObjectURL(){return 'blob:unit-test'}static revokeObjectURL(){}}
const ctx={window:{},document,localStorage,TivvyIssuePlan:P,Blob,URL:URLMock,Intl,Date,JSON,Map,Number,String,Error,Uint8Array,setTimeout:()=>{},draw:()=>{},fetch:async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(url.split('?')[0]))}),coverPhotoDb:async()=>({transaction(){const tx={objectStore(){return {getAllKeys(){return {result:[]}},getAll(){return {result:[]}}}}};setImmediate(()=>tx.oncomplete());return tx},close(){}})};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('issue-builder.js','utf8'),ctx);
(async()=>{await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));assert.match(node('issueBuilder').innerHTML,/Build this issue/);assert.match(node('issueBuilder').innerHTML,/Source documents/);assert.match(node('issueBuildPreview').innerHTML,/52 pages planned/);
 await node('issueReview').onclick();assert.equal(node('issueConfirmation').hidden,false);assert.match(node('issueConfirmText').textContent,/Test opposition/);
 localStorage.setItem('tivvy-issue-count-last_time_out','3');await node('issueDownload').onclick();assert.match(node('issueBuildFeedback').textContent,/Inputs changed/);assert.equal(downloads.length,0);
 await node('issueReview').onclick();assert.match(node('issueBuildPreview').innerHTML,/51 pages planned/);await node('issueDownload').onclick();assert.equal(downloads.length,1);assert.equal(downloads[0],'tivvy-programme-2026-11-03-build.zip');assert.match(node('issueBuildFeedback').textContent,/master is unchanged/);
 console.log('Issue builder: loads audited map, reviews complete request, blocks stale confirmation and downloads ZIP without any Canva write.');
})().catch(e=>{console.error(e);process.exitCode=1});

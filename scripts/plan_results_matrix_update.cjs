// node scripts/plan_results_matrix_update.cjs feed.json canva-snapshot.json [run-time-ISO]
const fs=require('node:fs');
const path=require('node:path');
const {planUpdate,snapshot}=require('../results-matrix-update.js');
const binding=require('../data/results-matrix-binding.json');
const [feedPath,currentPath,at]=process.argv.slice(2);
if(!feedPath||!currentPath)throw Error('Provide the refreshed feed and a live Canva transaction snapshot.');
const feed=JSON.parse(fs.readFileSync(feedPath,'utf8'));
const current=JSON.parse(fs.readFileSync(currentPath,'utf8'));
if(!current.pages?.some(p=>p.page_id===binding.page_id))throw Error('Expected Canva page not found. Bind a copied issue before updating.');
const plan=planUpdate(feed,binding,snapshot(current.richtexts,binding),at||new Date());
console.log(JSON.stringify(plan,null,2));

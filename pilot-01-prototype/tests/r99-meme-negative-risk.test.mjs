import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { TOPIC_GUIDES } from '../src/data/topic-guides-data.js';
import { TOPIC_GUIDES as before } from '../docs/evidence/four-week-growth-20260927/r99-before/topic-guides-data.js';
import { sanitizePublicText } from '../src/data/public-copy-sanitizer.js';
const meme=TOPIC_GUIDES['meme-coins'];
function collectAddedLocaleKeys(current, snapshot, path=[], out=[]){
 if(Array.isArray(current)){
  for(let i=0;i<current.length;i++)collectAddedLocaleKeys(current[i],snapshot?.[i],[...path,String(i)],out);
  return out;
 }
 if(current&&typeof current==='object'){
  for(const [key,val] of Object.entries(current)){
   if(!(snapshot&&Object.hasOwn(snapshot,key))){
    out.push({path:[...path,key].join('.'),hash:createHash('sha256').update(JSON.stringify(val)).digest('hex')});
    continue;
   }
   collectAddedLocaleKeys(val,snapshot[key],[...path,key],out);
  }
 }
 return out;
}
function deletePath(target,path){
 const parts=path.split('.');
 let cursor=target;
 for(const part of parts.slice(0,-1))cursor=cursor[part];
 delete cursor[parts.at(-1)];
}
test('MEV and routing tools do not establish execution certainty after public filtering',()=>{
 const text=sanitizePublicText(meme.painPoints[1].descEn);
 assert.match(text,/do not establish execution certainty/);
 assert.doesNotMatch(text,/execution stated terms/);
});
test('reserve disclosures do not establish solvency after public filtering',()=>{
 const text=sanitizePublicText(meme.evaluationPillars[3].descEn);
 assert.match(text,/do not establish solvency/);
 assert.doesNotMatch(text,/solvency stated terms/);
});

test('R99 changes only the two approved English Meme descriptions',()=>{
 const restored=structuredClone(TOPIC_GUIDES);
 for(const [key,index] of [['painPoints',1],['evaluationPillars',3]]){
  assert.notEqual(restored['meme-coins'][key][index].descEn,before['meme-coins'][key][index].descEn);
  restored['meme-coins'][key][index].descEn=before['meme-coins'][key][index].descEn;
 }
 const added=collectAddedLocaleKeys(restored,before);
 assert.deepEqual(added,[
  {path:'derivatives.decisionRoutes.0.copy.ur',hash:'e534462afa97197b11c745b7e56e1210afb441ae538034713221317eb62c7623'},
  {path:'derivatives.decisionRoutes.0.copy.uk',hash:'6026844327dbd9240234e8467b8d800798d7bad5ab6bd0ce5a4a3cb17cb6aa81'},
  {path:'derivatives.decisionRoutes.1.copy.ur',hash:'def663317ac8678b39f1cb333a81d0a08672f0c865117af304a3a17c4c4692fb'},
  {path:'derivatives.decisionRoutes.1.copy.uk',hash:'bbdc727b58595cc68ae699f9bd2793d68e5db91c10b697fd1236c8050267eeb3'},
  {path:'derivatives.decisionRoutes.2.copy.ur',hash:'9d08be360cf545625829bb11988552f04f5b8c65b05f66f6bcb233b1023399db'},
  {path:'derivatives.decisionRoutes.2.copy.uk',hash:'57eb13c24617ad31f2218d6665efb0d042d0c5e6bcf3e3f8ba21e7808db70067'},
  {path:'derivatives.decisionRoutes.3.copy.ur',hash:'8e3843c35e9bea8aa1b88a047e45d841bedc22700e3207f0b0ea1eed9d057aef'},
  {path:'derivatives.decisionRoutes.3.copy.uk',hash:'8a58b6714d9e9d8e5c688602a5339de55a87f8dbeb3ae2bc59ad45af00c107f3'},
 ]);
 for(const {path} of added)deletePath(restored,path);
 assert.deepEqual(restored,before);
});

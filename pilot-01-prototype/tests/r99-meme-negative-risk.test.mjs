import assert from 'node:assert/strict';
import test from 'node:test';
import { TOPIC_GUIDES } from '../src/data/topic-guides-data.js';
import { TOPIC_GUIDES as before } from '../docs/evidence/four-week-growth-20260927/r99-before/topic-guides-data.js';
import { sanitizePublicText } from '../src/data/public-copy-sanitizer.js';
const meme=TOPIC_GUIDES['meme-coins'];
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
 assert.deepEqual(restored,before);
});

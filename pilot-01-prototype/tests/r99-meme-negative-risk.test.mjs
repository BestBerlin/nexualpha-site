import { committedFileHash } from './r100-test-contracts.mjs';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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

test('both reviewed negative-risk descriptions remain distinct from their original weaker wording', () => {
 for (const [key, index] of [['painPoints', 1], ['evaluationPillars', 3]]) {
   assert.notEqual(meme[key][index].descEn, before['meme-coins'][key][index].descEn);
 }
 assert.equal(createHash('sha256').update(readFileSync(new URL('../src/data/topic-guides-data.js', import.meta.url))).digest('hex'), committedFileHash('src/data/topic-guides-data.js'));
});

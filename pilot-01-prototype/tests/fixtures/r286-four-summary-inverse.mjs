import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const hash=value=>createHash('sha256').update(value).digest('hex');
const raw=readFileSync(new URL('./r286-four-summary-field-patch.json',import.meta.url));
assert.equal(hash(raw),'4682b59371f3a6932f79b0037cebe19bff9c1cca3f840bcce1db469c00a716ce');
export const fourSummaryFixture=JSON.parse(raw);
export function restoreFourSummaries(value) {
 const restored=structuredClone(typeof value==='string'||Buffer.isBuffer(value)?JSON.parse(value):value);
 for(const item of fourSummaryFixture.items){
  const found=restored.articles.filter(a=>a.slug===item.slug);
  assert.equal(found.length,1);assert.equal(found[0].summary['zh-Hans'],item.new);
  found[0].summary['zh-Hans']=item.old;
 }
 return restored;
}
export function restoreFourSummaryBytes(bytes,kind='full'){
 const original=Buffer.isBuffer(bytes)?bytes.toString():bytes;
 const parsed=JSON.parse(original);
 assert.equal(original,(kind==='full'?JSON.stringify(parsed,null,2):JSON.stringify(parsed))+'\n', 'original artifact serialization is fixed');
 const restored=restoreFourSummaries(parsed);
 const normalized=(kind==='full'?JSON.stringify(restored,null,2):JSON.stringify(restored))+'\n';
 assert.equal(hash(normalized),kind==='full'?fourSummaryFixture.fullBeforeSha:fourSummaryFixture.summaryBeforeSha);
 return Buffer.from(normalized);
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../four-summary-feed-integration/news-feed.before.json", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const { fourSummaryFixture: f, restoreFourSummaryBytes: restoreFourSummaryBytes } = await import("./fixtures/r286-four-summary-inverse.mjs");
const root=new URL('../',import.meta.url);
const hash=v=>createHash('sha256').update(v).digest('hex');
test('four exact source-bound summary leaves change and everything else restores fixed full feed',async()=>{
 const bytes=await readFile(new URL('public/content/news-feed.json',root));
 const before=await readFile(new URL('../../four-summary-feed-integration/news-feed.before.json',import.meta.url));
 assert.deepEqual(restoreFourSummaryBytes(bytes),before);
 const data=JSON.parse(bytes);assert.equal(data.articles.length,416);
 for(const item of f.items){
  const md=await readFile(item.markdownPath);assert.equal(hash(md),item.markdownSha);
  assert.equal(hash(await readFile(item.mapPath)),item.mapSha);
  const paragraphs=md.toString().split('\n## ',1)[0].trim().split('\n\n');assert.equal(paragraphs.at(-1).trim(),item.new);
  assert.equal(data.articles.filter(a=>a.slug===item.slug)[0].summary['zh-Hans'],item.new);
 }
 for(const mutate of [d=>d.articles[0].title['zh-Hans']='rogue',d=>d.articles.reverse(),d=>d.articles.find(a=>a.slug===f.items[0].slug).summary['zh-Hans']+='rogue']){
  const rogue=structuredClone(data);mutate(rogue);assert.throws(()=>restoreFourSummaryBytes(JSON.stringify(rogue,null,2)+'\n'));
 }
 assert.equal(hash(await readFile(new URL('src/data/partner-registry.js',root))),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
test('derived summary is exact existing-generator projection and fixed inverse restores prior summary',async()=>{
 const full=JSON.parse(await readFile(new URL('public/content/news-feed.json',root),'utf8'));
 const summary=await readFile(new URL('public/content/news-feed-summary.json',root));
 const expected={version:full.version??1,generatedAt:full.generatedAt,batchId:full.batchId??null,articles:full.articles.map(({content,sources,seo,aeo,geo,claims,...a})=>a)};
 assert.deepEqual(JSON.parse(summary),expected);
 assert.deepEqual(restoreFourSummaryBytes(summary,'summary'),await readFile(new URL('../../four-summary-feed-integration/news-feed-summary.before.json',import.meta.url)));
});
}

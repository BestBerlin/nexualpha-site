import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {computeRouteSeo} from '../src/data/seo-injection.js';
import {routeMetadata} from '../worker/index.js';
const serialized = value => JSON.parse(JSON.stringify(value));
const before=JSON.parse(fs.readFileSync(new URL('../docs/evidence/four-week-growth-20260927/r101-before/hyperliquid-seo-15.json',import.meta.url),'utf8'));
const approvedCurrentSeoSha256='3430a238b702dfaaf2c779df828d243dde3bb2fe9f8a94aa3b13a0bb83be44d0';
test('fee tool preserves exact serialized client and Worker SEO across all 15 owner locales',async()=>{
 assert.equal(before.length,15);
 const approved=[];
 for(const row of before){
  const client=serialized(computeRouteSeo({pathname:row.path,locale:row.locale}));
  const worker=serialized(await routeMetadata(new URL('https://nexualpha.com'+row.path),{}));
  // Class b: PR #86 intentionally changed Hyperliquid keyword/referral SEO; keep the old frozen route envelope and pin the current reviewed referral intent.
  assert.equal(client.canonical,row.client.canonical,row.path+' canonical');
  assert.equal(client.locale,row.client.locale,row.path+' locale');
  assert.equal(client.status,200,row.path+' client status');
  assert.equal(worker.status,200,row.path+' Worker status');
  assert.deepEqual(client.alternates,row.client.alternates,row.path+' alternates');
  assert.doesNotMatch(JSON.stringify({client,worker}), /bsmkweb|guaranteed signup|guaranteed registration|private commission/i);
  approved.push({path:row.path,locale:row.locale,client,worker});
 }
 assert.equal(createHash('sha256').update(JSON.stringify(approved)).digest('hex'),approvedCurrentSeoSha256,'exact current reviewed Hyperliquid client/Worker SEO rows');
});

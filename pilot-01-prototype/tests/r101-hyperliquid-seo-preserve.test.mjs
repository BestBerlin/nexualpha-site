import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {computeRouteSeo} from '../src/data/seo-injection.js';
import {routeMetadata} from '../worker/index.js';
const serialized = value => JSON.parse(JSON.stringify(value));
const before=JSON.parse(fs.readFileSync(new URL('../docs/evidence/four-week-growth-20260927/r101-before/hyperliquid-seo-15.json',import.meta.url),'utf8'));
test('fee tool preserves exact serialized client and Worker SEO across all 15 owner locales',async()=>{
 assert.equal(before.length,15);
 for(const row of before){assert.deepEqual(serialized(computeRouteSeo({pathname:row.path,locale:row.locale})),row.client,row.path+' client');assert.deepEqual(serialized(await routeMetadata(new URL('https://nexualpha.com'+row.path),{})),row.worker,row.path+' Worker');}
});

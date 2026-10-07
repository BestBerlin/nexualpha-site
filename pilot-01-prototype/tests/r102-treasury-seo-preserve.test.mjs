import {assertVersionedAcceptedFeed} from './r189-feed-contract.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {computeRouteSeo} from '../src/data/seo-injection.js';
import {routeMetadata} from '../worker/index.js';
const serialized=value=>JSON.parse(JSON.stringify(value));
const before=JSON.parse(fs.readFileSync(new URL('../docs/evidence/four-week-growth-20260927/r102-before/tokenized-seo-45.json',import.meta.url),'utf8'));
test('Treasury checklist keeps serialized SEO for all 45 cluster locale routes',async()=>{
 assert.equal(before.length,45);
 for(const row of before){assert.deepEqual(serialized(computeRouteSeo({pathname:row.path,locale:row.locale})),row.client,row.path+' client');assert.deepEqual(serialized(await routeMetadata(new URL('https://nexualpha.com'+row.path),{})),row.worker,row.path+' Worker');}
});
test('Treasury checklist preserves commercial files, newsfeed and original historical dataset bytes',()=>{
 const lines=fs.readFileSync(new URL('../docs/evidence/four-week-growth-20260927/r102-before/protected-sha.txt',import.meta.url),'utf8').trim().split('\n');assert.equal(lines.length,6);
 for(const line of lines){const [hash,path]=line.split(/\s+/,2);const bytes=fs.readFileSync(new URL('../'+path,import.meta.url));if(path==='public/content/news-feed.json')assertVersionedAcceptedFeed(bytes,hash);else assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),hash,path);}
});

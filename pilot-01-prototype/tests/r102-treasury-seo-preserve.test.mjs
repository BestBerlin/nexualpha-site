import {assertVersionedAcceptedFeed} from './r189-feed-contract.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {computeRouteSeo} from '../src/data/seo-injection.js';
import {routeMetadata} from '../worker/index.js';
import {budgetTitle} from '../src/data/meta-description.js';
const serialized=value=>JSON.parse(JSON.stringify(value));
const before=JSON.parse(fs.readFileSync(new URL('../docs/evidence/four-week-growth-20260927/r102-before/tokenized-seo-45.json',import.meta.url),'utf8'));
function normalizeAuthorizedSeoTransition(value, mode) {
 const clone=structuredClone(value);
 const walk=(node)=>{
  if(!node||typeof node!=='object')return;
  if(node['@type']==='Organization'&&node.name==='NexuAlpha Research Desk'){
   // Class b: PR #58 added a canonical Research Desk entity to some route schemas; old-shaped source nodes stay under full equality.
   if(mode==='current'&&node['@id']!==undefined){
    assert.equal(node['@id'],'https://nexualpha.com/about#research-desk');assert.equal(node.url,'https://nexualpha.com/about#research-desk');assert.deepEqual(node.parentOrganization,{'@id':'https://nexualpha.com/#organization','@type':'Organization',name:'NexuAlpha'});
    delete node['@id'];delete node.parentOrganization;node.url='https://nexualpha.com/methodology';
   }
  }
  if(node['@type']==='Organization'&&node.name==='NexuAlpha'){
   if(mode==='current'&&node['@id']!==undefined){
    assert.equal(node['@id'],'https://nexualpha.com/#organization');assert.deepEqual(node.logo,{'@type':'ImageObject',url:'https://nexualpha.com/brand/nexualpha/nexualpha-round.svg',width:'512',height:'512'});
    delete node['@id'];node.logo=node.logo.url;
   }
  }
  for(const child of Object.values(node))if(child&&typeof child==='object')walk(child);
 };
 walk(clone);
 if(mode==='baseline'&&typeof clone.title==='string')clone.title=budgetTitle(clone.title);
 return clone;
}
test('Treasury checklist keeps serialized SEO for all 45 cluster locale routes',async()=>{
 assert.equal(before.length,45);
 for(const row of before){assert.deepEqual(normalizeAuthorizedSeoTransition(serialized(computeRouteSeo({pathname:row.path,locale:row.locale})),'current'),normalizeAuthorizedSeoTransition(row.client,'baseline'),row.path+' client');assert.deepEqual(normalizeAuthorizedSeoTransition(serialized(await routeMetadata(new URL('https://nexualpha.com'+row.path),{})),'current'),normalizeAuthorizedSeoTransition(row.worker,'baseline'),row.path+' Worker');}
});
test('Treasury checklist preserves commercial files, newsfeed and original historical dataset bytes',()=>{
 const lines=fs.readFileSync(new URL('../docs/evidence/four-week-growth-20260927/r102-before/protected-sha.txt',import.meta.url),'utf8').trim().split('\n');assert.equal(lines.length,6);
	 const authorizedCurrentHashes={
	  // Class b: 84b6426 made the official binance.com referral route the accepted current registry bytes while preserving the archived before-hash fixture.
	  'src/data/partner-registry.js':'e53261a6e7e39e64bd35bbedda4ef4a36c1521521750a77eaff3d26c52925d69',
	 };
	 for(const line of lines){const [hash,path]=line.split(/\s+/,2);const bytes=fs.readFileSync(new URL('../'+path,import.meta.url));if(path==='public/content/news-feed.json')assertVersionedAcceptedFeed(bytes,hash);else assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),authorizedCurrentHashes[path]||hash,path);}
});

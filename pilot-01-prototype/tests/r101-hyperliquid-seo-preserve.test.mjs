import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {computeRouteSeo} from '../src/data/seo-injection.js';
import {routeMetadata} from '../worker/index.js';
const serialized = value => JSON.parse(JSON.stringify(value));
const before=JSON.parse(fs.readFileSync(new URL('../docs/evidence/four-week-growth-20260927/r101-before/hyperliquid-seo-15.json',import.meta.url),'utf8'));
test('fee tool preserves canonical SEO and reviewed client/Worker FAQ answers in all 15 owner locales',async()=>{
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
 for(const {path,client,worker} of approved){
  for(const key of ['canonical','locale','status','robots','alternates'])assert.deepEqual(client[key],worker[key],path+' '+key+' client/Worker parity');
  for(const metadata of [client,worker]){assert.match(metadata.title,/Hyperliquid/i,path+' owner identity');assert.ok(metadata.description.length>0&&metadata.description.length<=160,path+' snippet budget');}
  const stripContext=node=>Array.isArray(node)?node.map(stripContext):node&&typeof node==='object'?Object.fromEntries(Object.entries(node).filter(([key])=>key!=='@context').map(([key,value])=>[key,stripContext(value)])):node;
  const faqs=nodes=>nodes.filter(node=>node['@type']==='FAQPage').map(({mainEntity,inLanguage})=>({inLanguage,mainEntity:mainEntity.map(q=>({question:q.name,answer:q.acceptedAnswer.text}))}));
  assert.deepEqual(stripContext(faqs(client.schemas)),stripContext(faqs(worker.schema)),path+' reviewed FAQ question and answer parity');
  for(const nodes of [client.schemas,worker.schema]){for(const faq of nodes.filter(node=>node['@type']==='FAQPage'))for(const q of faq.mainEntity){assert.ok(q.acceptedAnswer.citation?.length,path+' sourced FAQ');for(const url of q.acceptedAnswer.citation)assert.ok(['hyperliquid.gitbook.io','app.hyperliquid.xyz','hyperfoundation.org','hyperliquid.xyz'].includes(new URL(url).hostname),path+' official Hyperliquid citation: '+url);}assert.ok(nodes.some(node=>node['@type']==='WebPage'&&node.url===client.canonical),path+' WebPage owner');assert.ok(nodes.some(node=>node['@type']==='BreadcrumbList'),path+' breadcrumb');}
 }
});

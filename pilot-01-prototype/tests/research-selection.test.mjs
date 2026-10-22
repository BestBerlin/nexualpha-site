import test from 'node:test';
import assert from 'node:assert/strict';
import {selectResearch,researchItems} from '../src/components/research/research-selection.js';
const row=(slug,date,extra={})=>({slug,status:'PUBLISHED',title:{en:slug,es:`ES ${slug}`},availableLocales:['en','es'],publishedAt:date,relatedVenues:['okx'],...extra});
const pool=[row('older','2026-10-01'),row('newest','2026-10-21'),row('english-only','2026-10-22',{availableLocales:['en']}),row('draft','2026-10-23',{status:'DRAFT'}),row('../bad','2026-10-24'),row('invalid-date','invalid'),row('unrelated','2026-10-25',{relatedVenues:[]})];
test('research is published, locale-strict, valid, deduplicated and newest-first',()=>{
 assert.deepEqual(selectResearch([...pool,pool[1]],{locale:'es',venueIds:['okx']}).map(a=>a.slug),['newest','older']);
 assert.deepEqual(researchItems(pool,{locale:'es',venueIds:['okx']}).map(a=>a.href),['/es/news/newest','/es/news/older']);
});
test('older primary venue excludes current/future and respects limit',()=>{
 assert.deepEqual(selectResearch(pool,{venueIds:['okx'],before:'2026-10-21',excludeSlug:'newest',limit:4}).map(a=>a.slug),['older']);
});
test('coin/ticker text matches whole tokens, with claims and no substring false positives',()=>{
 const articles=[row('nvda-news','2026-10-21',{relatedVenues:[],title:{en:'NVDA stock tokens'}}),row('not-matching','2026-10-22',{relatedVenues:[],title:{en:'NVDAX token'}}),row('claim-match','2026-10-20',{relatedVenues:[],claims:[{claim:'Bitcoin deposits'}]})];
 assert.deepEqual(selectResearch(articles,{terms:['NVDA']}).map(a=>a.slug),['nvda-news']);
 assert.deepEqual(selectResearch(articles,{terms:['Bitcoin']}).map(a=>a.slug),['claim-match']);
});
test('full content must prove the target edition exists',()=>{
 assert.deepEqual(selectResearch([row('no-body','2026-10-21',{content:{en:'Body'},summary:{en:'Summary'}})],{locale:'es'}),[]);
});

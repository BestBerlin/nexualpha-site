import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDecisionReturnHref, readDecisionReturnState, decisionReturnCopy } from '../src/data/decision-return.js';
import { LOCALE_PREFIX_BY_CODE } from '../src/data/locale-routing.js';
import { routeMetadata } from '../worker/index.js';

test('comparison links retain chosen order and public context without copying tracking or private fields', () => {
  const href = buildDecisionReturnHref({kind:'compare',slugs:['bybit','bitget'],locale:'ja',market:'JP',product:'spot',email:'private@example.com',ref:'should-not-copy',utm_source:'secret'});
  assert.equal(href,'/ja/compare/bybit-vs-bitget#nxa-context?market=JP&product=spot');
  assert.equal(buildDecisionReturnHref({kind:'compare',slugs:['binance','unknown']}),null);
  assert.equal(buildDecisionReturnHref({kind:'compare',slugs:['binance','binance']}),null);
});

test('fee scenarios round trip through the existing embedded calculator in every locale', () => {
  for(const locale of Object.keys(LOCALE_PREFIX_BY_CODE)) {
    const href=buildDecisionReturnHref({kind:'fees',locale,market:'BR',venue:'bitget',instrument:'spot',volume:500000});
    const url=new URL(href,'https://nexualpha.com');
    assert.equal(url.pathname,'/embed/calculator');
    assert.deepEqual(readDecisionReturnState(url.search, url.hash),{kind:'fees',market:'BR',product:'spot',venue:'bitget',instrument:'spot',volume:500000});
    assert.equal(url.searchParams.has('locale'), false);
    if(locale!=='en') assert.equal(new URLSearchParams(url.hash.split('?')[1] || '').get('locale'),locale);
  }
});

test('cost scenarios preserve zero, decimals, product and order without preserving a quoted result', () => {
  for(const volume of [0,12500.25,1e10]) {
    const url=new URL(buildDecisionReturnHref({kind:'cost',locale:'ko',market:'KR',instrument:'futures',order:'maker',volume,result:333}),'https://nexualpha.com');
    assert.equal(url.pathname,'/ko/rates');
    assert.match(url.hash,/^#cost-scenario\?/);
    assert.deepEqual(readDecisionReturnState(url.search, url.hash),{kind:'cost',market:'KR',product:'perpetuals',instrument:'futures',order:'maker',volume});
    assert.equal(url.searchParams.has('result'),false);
  }
});

test('invalid or duplicate inputs cannot become a saved scenario', () => {
  for(const search of ['?scenario=fees&venue=okx&instrument=spot&volume=2','?scenario=cost&instrument=spot&order=maker&volume=Infinity','?scenario=cost&instrument=spot&order=maker&volume=-1','?scenario=cost&instrument=spot&order=maker&volume=1e12','?scenario=cost&instrument=spot&order=maker&volume=0&volume=5','?scenario=unknown','?scenario=fees&venue=https://evil.test&instrument=spot&volume=5000']) assert.equal(readDecisionReturnState(search),null,search);
  assert.equal(buildDecisionReturnHref({kind:'fees',venue:'okx',volume:NaN,instrument:'spot'}),null);
  assert.equal(readDecisionReturnState('?volume=5000&venue=okx&instrument=spot'),null);
});

test('return controls have explicit copy, error recovery and accurate Bot wording in all UI locales', () => {
  for(const locale of Object.keys(LOCALE_PREFIX_BY_CODE)) {
    const copy=decisionReturnCopy(locale);
    for(const key of ['copy','copied','failed','linkLabel','botFeeOpen']) assert.ok(copy[key]?.length,`${locale} ${key}`);
    if(locale!=='en') assert.notEqual(copy.copy,decisionReturnCopy('en').copy,locale);
  }
});

test('restorable tool URLs retain the original canonical page rather than generating indexable variants', async () => {
  for(const locale of ['en','ja','zh-Hant','ar']) for(const kind of ['fees','cost']) {
    const href=buildDecisionReturnHref({kind,locale,venue:'bitget',market:'BR',instrument:'spot',volume:50000,order:'maker'});
    const url=new URL(href,'https://nexualpha.com');
    const meta=await routeMetadata(url,{});
    assert.equal(meta.status,200);
    for(const key of ['scenario','venue','volume','instrument','order','market','product']) assert.equal(new URL(meta.canonical).searchParams.has(key),false,`${locale} ${kind} ${key}`);
  }
});

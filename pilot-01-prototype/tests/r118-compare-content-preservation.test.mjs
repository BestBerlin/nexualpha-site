import { compareVenueCta } from '../src/data/compare-cta.js';
import { outboundLink, sourceDomain } from '../src/data/exchange-outbound.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {render} from '../dist/ssr/entry-server.js';
import {compareDirectAnswerFor} from '../src/data/compare-direct-answers.js';

const locales=['en','zh-Hans','zh-Hant','es','pt-BR','fr','de','ja','ko','ar','tr','ru','id','vi','it'];
test('supporting comparison stays reachable and opens by default when no final decision exists',()=>{
  for(const locale of locales){
    const html=render('/compare/binance-vs-okx?locale='+locale);
    const tag=html.match(/<details\b[^>]*id="compare-versus-card"[^>]*>/)?.[0];
    assert.ok(tag, locale+' semantic support disclosure must exist');
    assert.equal(/\bopen(?:=|\s|>)/.test(tag),!compareDirectAnswerFor('binance-vs-okx',locale),locale+' preserve the primary choice when no final card exists');
    for(const id of ['compare-versus-stats-binance','compare-versus-stats-okx','compare-versus-sources-binance','compare-versus-sources-okx'])assert.ok(html.includes(id),locale+' '+id);
    for(const slug of ['binance','okx'])assert.equal(html.includes(`/go/${slug}?src=compare-binance-vs-okx&amp;locale=${locale}`),compareVenueCta(slug,['binance','okx'],locale).direct,locale+' contextual commercial route follows locale policy');
    const quick=html.match(/<nav class="v3-compare-quick-actions[^\"]*"[\s\S]*?<\/nav>/)?.[0];
    if(compareDirectAnswerFor('binance-vs-okx',locale))assert.ok(html.includes('id="compare-final-choice"'),locale+' primary decision retained');
    else assert.ok(quick,locale+' fallback quick choices retained');
    if(locale!=='en'&&quick)assert.doesNotMatch(quick,/Review choice/);
    assert.ok(html.includes(`data-source-plain="${sourceDomain('https://www.binance.com/en/fee/trading')}"`) || html.includes(outboundLink('https://www.binance.com/en/fee/trading',{locale})?.href?.replaceAll('&','&amp;') || 'https://www.binance.com/en/fee/trading'),locale+' fee source retained through current outbound policy');
  }
});
test('three-platform primary choice cannot be hidden by the support disclosure',()=>{
  const html=render('/compare/binance-vs-okx-vs-bitget?locale=en');
  const tag=html.match(/<details\b[^>]*id="compare-versus-card"[^>]*>/)?.[0];
  assert.ok(tag&&/\bopen(?:=|\s|>)/.test(tag));
  assert.ok(html.includes('/go/bitget?src=compare-binance-vs-okx-vs-bitget&amp;locale=en'));
});

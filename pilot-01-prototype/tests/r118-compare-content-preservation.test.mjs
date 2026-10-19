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
    assert.match(html,/https:\/\/www.bsmkweb.cc\/join\?ref=11350287&amp;utm_medium=web_share_copy/);
    assert.match(html,/https:\/\/www.okx.com\/join\/nexu888/);
    const quick=html.match(/<nav class="v3-compare-quick-actions"[\s\S]*?<\/nav>/)?.[0];
    assert.ok(quick);
    if(locale!=='en')assert.doesNotMatch(quick,/Review choice/);
    assert.ok(html.includes('https://www.binance.com/en/fee/trading'),locale+' fee source retained');
  }
});
test('three-platform primary choice cannot be hidden by the support disclosure',()=>{
  const html=render('/compare/binance-vs-okx-vs-bitget?locale=en');
  const tag=html.match(/<details\b[^>]*id="compare-versus-card"[^>]*>/)?.[0];
  assert.ok(tag&&/\bopen(?:=|\s|>)/.test(tag));
  assert.match(html,/https:\/\/partner.bitget.com\/bg\/C6PRAF/);
});

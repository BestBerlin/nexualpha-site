import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import * as registry from '../src/data/factbook-registry.js';
import { neutralVenueCatalog } from '../src/data/market-command.js';
import { localizedHref } from '../src/data/locale-routing.js';
import { publicCtaForVenue } from '../src/data/source-bound-cta.js';
const requireWorkspace = createRequire(new URL('../package.json', import.meta.url));
const React = requireWorkspace('react');
const { renderToStaticMarkup } = requireWorkspace('react-dom/server');
const { transformSync } = requireWorkspace('esbuild');
const locales = ['en','zh-Hans','zh-Hant','ja','ko','es','pt-BR','fr','de','tr','ru','ar','id','vi','it'];
const source = readFileSync(new URL('../src/components/v3/FactbookPage.jsx', import.meta.url), 'utf8');
const mocks = { ...registry, neutralVenueCatalog, localizedHref, publicCtaForVenue, BrandMark: () => React.createElement('span'), DecisionPathRail: () => null };
function compile(react = React, extra = {}) {
  const module = { exports: {} };
  vm.runInNewContext(transformSync(source, { loader:'jsx', format:'cjs' }).code, {React:react,module, exports:module.exports, require: name => name === 'react' ? react : mocks, ...extra});
  return module.exports.FactbookPage;
}
const Page = compile();
const render = (locale, slug = 'binance') => renderToStaticMarkup(React.createElement(Page, {slug,locale,market:'BR',product:'spot'}));
const hrefs = html => [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
const baselineUrl = new URL('./r120-factbook-links-baseline.json', import.meta.url);
if (process.env.RECORD_FACTBOOK_BASELINE === '1') {
  writeFileSync(baselineUrl, JSON.stringify(Object.fromEntries(locales.flatMap(locale => ['binance','hyperliquid'].map(slug => [`${slug}:${locale}`, hrefs(render(locale,slug))]))),null,2));
}
const baseline = JSON.parse(readFileSync(baselineUrl,'utf8'));
test('all existing research/commercial routes and values remain intact in 15 locales', () => {
  for (const locale of locales) for (const slug of ['binance','hyperliquid']) {
    const html = render(locale,slug);
    assert.deepEqual(hrefs(html),baseline[`${slug}:${locale}`]);
    assert.ok(html.includes(registry.FACTBOOK_REGISTRY[slug].auditHash));
    assert.ok(html.includes(registry.AUDIT_DATE));
    assert.equal([...html.matchAll(/class="[^"]*factbook-fee-tier-row/g)].length,registry.FACTBOOK_REGISTRY[slug].vipTiers.length);
    assert.ok(!html.includes('0.1000%'), 'unverified fee remains masked');
  }
  const hash=createHash('sha256').update(readFileSync(new URL('../src/data/partner-registry.js',import.meta.url))).digest('hex');
  assert.equal(hash,'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
test('human identity and direct answer precede closed secondary export/review tools', () => {
  for (const locale of locales) {
    const html=render(locale);
    assert.ok(html.indexOf('<h1') < html.indexOf('factbook-copy-btn'));
    assert.ok(html.indexOf('factbook-direct-answer-title') < html.indexOf('factbook-source-tools'));
    assert.match(html,/<details class="factbook-source-tools">/);
    assert.ok(!/SHA-256|Checksum|チェックサム|체크섬|不可偽造/.test(html));
    if(locale !== 'en') {
      assert.ok(!html.includes('Copy Markdown data'));
      assert.ok(!html.includes('Record identifier'));
      assert.ok(!html.includes('Source notes and data export'));
    }
    assert.match(html, /<details class="factbook-fee-records">/);
    assert.match(html, /factbook-table-wrapper is-expanded/);
    assert.ok(!html.includes('factbook-fee-tiers-toggle'), 'unknown matrix needs only native disclosure');
  }
});
test('verified fee disclosure stays chosen over resize without inventing an offer', () => {
  const original = registry.FACTBOOK_REGISTRY.binance;
  registry.FACTBOOK_REGISTRY.binance = { ...original, feeVerifiedAt: '2026-10-05', feeSourceUrl: 'https://www.binance.com/en/fee/trading' };
  try {
  let cursor=0; const slots=[], effects=[],listeners=new Map();
  const react={...React,
    useState(initial) { const i=cursor++; if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v]; },
    useMemo(fn) { return fn(); }, useCallback(fn) { return fn; }, useEffect(fn) { effects.push(fn); }
  };
  const window={innerWidth:390,addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key)};
  const component=compile(react,{window});
  const get=()=>{cursor=0;return component({slug:'binance',locale:'en'});};
  const find=(node,predicate)=>{if(!node||typeof node!=='object')return null;if(predicate(node))return node;for(const c of React.Children.toArray(node.props?.children)){const found=find(c,predicate);if(found)return found;}return null;};
  let tree=get(); effects.splice(0).forEach(fn=>fn());tree=get();
  let toggle=find(tree,node=>node.props?.className==='factbook-fee-tiers-toggle');
  assert.equal(toggle.props['aria-expanded'],false);
  toggle.props.onClick(); window.innerWidth=1024;listeners.get('resize')?.();tree=get();
  toggle=find(tree,node=>node.props?.className==='factbook-fee-tiers-toggle');assert.equal(toggle.props['aria-expanded'],true);
  window.innerWidth=390;listeners.get('resize')?.();tree=get();assert.equal(find(tree,node=>node.props?.className==='factbook-fee-tiers-toggle').props['aria-expanded'],true);
  assert.equal(listeners.has('resize'),false,'viewport does not own the reader disclosure');
  } finally { registry.FACTBOOK_REGISTRY.binance = original; }
});

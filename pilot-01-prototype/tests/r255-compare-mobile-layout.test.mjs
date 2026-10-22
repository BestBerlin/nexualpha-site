import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { buildSync } from 'esbuild';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("fixtures/r237-approved-inverses.json", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const { assertProjectedTree: assertProjectedTree } = await import("./helpers/r237-approved-inverses.mjs");










const root = fileURLToPath(new URL('../', import.meta.url));
const base = fileURLToPath(new URL('../../../r252-compare-fit-readable/candidate/', import.meta.url));
const cross = 'src/components/v3/crossroads-compare.css';
const registry = 'src/data/partner-registry.js';
const read = (dir, file) => fs.readFileSync(path.join(dir, file), 'utf8');
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const fixedNowMs = Date.parse('2026-10-05T00:00:00.000Z');
class FixedDate extends Date {
  constructor(...args) {
    super(...(args.length ? args : [fixedNowMs]));
  }
  static now() { return fixedNowMs; }
}
FixedDate.UTC = Date.UTC;
FixedDate.parse = Date.parse;

function loadCompareRuntime(projectRoot) {
  const code = buildSync({
    stdin: {
      contents: `
        import { CompareDeepPage } from './src/components/v3/V3Pages.jsx';
        import { venueDatabase } from './src/data/venue-database.js';
        import { v3Copy } from './src/data/v3-product.js';
        export { CompareDeepPage, venueDatabase, v3Copy };
      `,
      resolveDir: projectRoot,
      loader: 'jsx',
    },
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    external: ['react', 'react/jsx-runtime'],
    loader: { '.css': 'empty', '.svg': 'text', '.webp': 'text' },
    logLevel: 'warning',
  }).outputFiles[0].text;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require,
    console,
    URL,
    URLSearchParams,
    Intl,
    Date: FixedDate,
    setTimeout,
    clearTimeout,
  });
  return module.exports;
}

const locales = ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'tr', 'ar', 'es', 'pt-BR', 'fr', 'de', 'ru', 'id', 'vi', 'it'];

function renderCompare(runtime, locale, selection = ['bybit', 'bitget']) {
  return renderToStaticMarkup(React.createElement(runtime.CompareDeepPage, {
    copy: { ...runtime.v3Copy(locale), common: { dimension: 'Dimension' }, assetCapabilities: { none: 'Pending source review' } },
    locale,
    selected: selection,
    venues: Object.values(runtime.venueDatabase),
    updates: [],
    market: 'unknown',
    product: 'unknown',
  }));
}


const crypto=require('node:crypto');
const block=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/r255-layout-block.json'),'utf8'));
const selector='.v3-compare-page .v3-versus-card--supporting:not([style])';
function rulesAt(width){const out=[];postcss.parse(read(root,cross)).walkRules(r=>{let active=true;for(let p=r.parent;p;p=p.parent){if(p.type==='atrule'&&p.name==='media'){const max=p.params.match(/max-width:\s*(\d+)px/),min=p.params.match(/min-width:\s*(\d+)px/);if(max&&width>+max[1]||min&&width<+min[1])active=false;}}if(active&&r.selector===selector)out.push(r);});return out;}
for(const width of [320,390,412,480])test('fullwidth dual support at '+width,()=>{const r=rulesAt(width).at(-1);assert.ok(r,'required scoped narrow policy');assert.equal(r.nodes.find(n=>n.prop==='grid-template-columns')?.value,'minmax(0, 1fr)');});
for(const width of [481,680,780,1024,1440])test('outside480 policy untouched at '+width,()=>assert.equal(rulesAt(width).length,0));
test('natural sequence not subgrid and only narrow decorative separator changes',()=>{const css=read(root,cross);assert.ok(css.endsWith(block));const rules=[];postcss.parse(block).walkRules(r=>rules.push(r));assert.equal(rules[1].nodes.find(n=>n.prop==='display').value,'flex');assert.equal(rules[1].nodes.find(n=>n.prop==='grid-row').value,'auto');assert.equal(rules[1].nodes.find(n=>n.prop==='border-inline-end').value,'none');assert.ok(rules[2].nodes.some(n=>n.prop==='border-block-start'));assert.equal(rules.some(r=>r.nodes.some(n=>['font-size','overflow','height','max-height','transform'].includes(n.prop))),false);});
test('only exact appended block differs from R252',()=>assert.equal(read(root,cross).slice(0,-block.length),read(base,cross)));
const runtime=loadCompareRuntime(root),baseline=loadCompareRuntime(base);
for(const locale of locales)test(locale+' dual/triple real wholeSSR exact',()=>{for(const pair of [['bybit','bitget'],['bybit','bitget','binance']]){const h=renderCompare(runtime,locale,pair);assert.equal(h,renderCompare(baseline,locale,pair));assert.match(h,/class="v3-versus-card v3-versus-card--supporting"/);if(pair.length===3)assert.match(h,/grid-template-columns:repeat\(3, 1fr\)/);else assert.ok(!h.includes('class="v3-versus-card v3-versus-card--supporting" style='));}});
test('all integrated R254 src/config/public bytes except scoped compare CSS unchanged after exact R256 inverse',()=>{const integratedBase=path.resolve(root,'../../r254-compare-directory-integration/candidate');assertProjectedTree(root,integratedBase,'r254-compare-directory-integration',[cross]);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,registry))).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});

test('actual competing shared mobile subgrid is lower specificity than scoped flex reset',()=>{const premium=postcss.parse(read(root,'src/styles/fintech-premium.css'));let oldSubgrid;premium.walkRules('.v3-versus-side',r=>{if(r.nodes.some(n=>n.prop==='grid-row'&&n.value==='span 5'))oldSubgrid=r;});assert.ok(oldSubgrid,'real shared competing rule required');assert.ok(oldSubgrid.nodes.some(n=>n.prop==='display'&&n.value==='grid'));assert.ok(oldSubgrid.nodes.every(n=>!n.important));const ast=postcss.parse(block);let reset;ast.walkRules(r=>{if(r.selector===selector+' > .v3-versus-side')reset=r;});assert.ok(reset);const specificity=s=>(s.match(/.[w-]+|[[^]]+]/g)||[]).length;assert.ok(specificity(reset.selector)>specificity(oldSubgrid.selector));assert.equal(reset.nodes.find(n=>n.prop==='grid-row').value,'auto');assert.equal(reset.nodes.find(n=>n.prop==='display').value,'flex');});
test('negative boundary parser rejects extending this patch to481 or dropping dual scope',()=>{assert.equal(block.includes('@media (max-width: 480px)'),true);assert.notEqual(block.replace('480px','481px'),block);assert.ok(block.includes(':not([style])'));assert.equal(block.includes('!important'),false,'do not override three-platform inline columns');});
}

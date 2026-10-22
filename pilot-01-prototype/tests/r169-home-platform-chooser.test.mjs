import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../../r163-home-decision-copy/candidate/src/components/v3/LeanHero.jsx", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const { withoutR181: withoutR181 } = await import("./r182-peer-scope.mjs");
const { withoutR180Copy: withoutR180Copy } = await import("./r180-source-scope.mjs");
const { expectedRegistrationSource: expectedRegistrationSource } = await import("./r176-peer-source.mjs");









const req = createRequire(import.meta.url);
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const { buildSync } = req('esbuild');
const base = new URL('../../../r163-home-decision-copy/candidate/', import.meta.url);
const current = new URL('../', import.meta.url);
const locales = ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];
const read = (root, p) => root===current&&p==='src/components/v3/LeanHero.jsx'?withoutR181(readFileSync(new URL(p,root),'utf8'),p):readFileSync(new URL(p,root),'utf8');
let sequence = null;
let index = 0;
class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : [1791172800000])); } static now() { return 1791172800000; } }
const hooks = { ...React, useState: (init) => sequence && index < sequence.length ? [sequence[index++], () => {}] : React.useState(init) };
function load(root, p, extra = '') {
  const file = fileURLToPath(new URL(p, root));
  const output = buildSync({ stdin: { contents: (root === base ? read(root,p).replace('import { RegistrationCard } from "./RegistrationCard.jsx";', 'import { RegistrationCard } from '+JSON.stringify(fileURLToPath(new URL('../../../r172-registration-nextstep-locales/candidate/src/components/v3/RegistrationCard.jsx',import.meta.url)))+';') : read(root,p)) + extra, resolveDir: path.dirname(file), sourcefile: file, loader: 'jsx' }, jsx: 'automatic', bundle: true, write: false, format: 'cjs', platform: 'node', external: ['react','react-dom','react/jsx-runtime'], loader: { '.css': 'empty' } }).outputFiles[0].text;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require: (name) => name === 'react' ? hooks : req(name), URL, URLSearchParams, Intl, Date: FixedDate, console, setTimeout, clearTimeout });
  return module.exports;
}
const oldHero = load(base, 'src/components/v3/LeanHero.jsx', '\nexport { HomeDecisionPanel, getUi };');
const newHero = load(current, 'src/components/v3/LeanHero.jsx', '\nexport { HomeDecisionPanel, getUi };');
function panel(mod, locale, q = '', slug = 'binance', mode = 'direct', chooserOpen = false) {
  sequence = [q, slug, mode, chooserOpen];
  index = 0;
  try { return renderToStaticMarkup(React.createElement(mod.HomeDecisionPanel, { locale, ui: mod.getUi(locale) })); }
  finally { sequence = null; }
}
const anchors = (h) => [...h.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map((m) => m[0]).sort();
function divAt(html, index) {
  assert.ok(index >= 0, 'start index exists');
  let depth = 0;
  for (const m of html.slice(index).matchAll(/<\/??div\b[^>]*>/g)) {
    depth += m[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return html.slice(index, index + m.index + m[0].length);
  }
  throw new Error('unterminated div');
}
const regCard = (h) => divAt(h, h.indexOf('<div class="registration-card registration-card--compact"'));
const chooser = (h) => h.match(/<details class="growth-platform-chooser"[\s\S]*?<\/details>/)?.[0] || '';
const r175Names = { 'binance':'Binance', 'okx':'OKX', 'bybit':'Bybit', 'bitget':'Bitget', 'gate-io':'Gate.io', 'mexc':'MEXC' };
function normalizeR175JaHome(html, slug = 'binance') {
  const name = r175Names[slug] || 'Binance';
  return html
    .replace(` aria-label="${name}、プラットフォームを変更"`, '')
    .replace('class="growth-platform-chooser__change">変更</span>', 'class="growth-platform-chooser__change">プラットフォームを変更</span>')
    .replace(/(<button\b[^>]*class="registration-card__copy-btn"[^>]*) aria-label="コードをコピー"([^>]*>)コピー<\/button>/g, '$1$2コードをコピー</button>');
}
const maybeNormalizeR175 = (html, locale, slug = 'binance') => locale === 'ja' ? normalizeR175JaHome(html, slug) : html;

const platformButtons = (html) => [...html.matchAll(/<button[^>]*class="growth-platform-option[^"]*"[\s\S]*?<!--\/?-->?[\s\S]*?\/button>/g)].map((m) => m[0]).sort();
const platformButtonsLoose = (html) => [...html.matchAll(/<button\b[^>]*class="growth-platform-option[^"]*"[\s\S]*?<\/button>/g)].map((m) => m[0]).sort();
const searchLabel = (html) => html.match(/<label class="growth-platform-search">[\s\S]*?<\/label>/)?.[0] || '';
const directWorkbench = (html) => html.match(/<div class="growth-direct-workbench">[\s\S]*?<details class="growth-decision-explanation">/)?.[0] || '';

let treeStates = [];
let treeIndex = 0;
let treeEvents = [];
let treeRef = null;
const jsxNode = (type, props, key) => ({ type, key, props: props || {} });
function loadTreeModule(root, p, extra = '') {
  const file = fileURLToPath(new URL(p, root));
  const output = buildSync({ stdin: { contents: (root === base ? read(root,p).replace('import { RegistrationCard } from "./RegistrationCard.jsx";', 'import { RegistrationCard } from '+JSON.stringify(fileURLToPath(new URL('../../../r172-registration-nextstep-locales/candidate/src/components/v3/RegistrationCard.jsx',import.meta.url)))+';') : read(root,p)) + extra, resolveDir: path.dirname(file), sourcefile: file, loader: 'jsx' }, jsx: 'automatic', bundle: true, write: false, format: 'cjs', platform: 'node', external: ['react','react/jsx-runtime'], loader: { '.css': 'empty' } }).outputFiles[0].text;
  const module = { exports: {} };
  const fakeReact = {
    ...React,
    useState: (init) => {
      const slot = treeIndex++;
      const value = slot < treeStates.length ? treeStates[slot] : init;
      return [value, (next) => treeEvents.push(['setState', slot, next])];
    },
    useEffect: () => undefined,
    useRef: () => {
      treeRef = { current: { focus: () => treeEvents.push(['focus', 'summary']) } };
      return treeRef;
    },
    useCallback: (fn) => fn,
  };
  const fakeRuntime = { jsx: jsxNode, jsxs: jsxNode, Fragment: 'Fragment' };
  vm.runInNewContext(output, { module, exports: module.exports, require: (name) => name === 'react' ? fakeReact : name === 'react/jsx-runtime' ? fakeRuntime : req(name), URL, URLSearchParams, Intl, Date: FixedDate, console, setTimeout, clearTimeout });
  return module.exports;
}
const treeHero = loadTreeModule(current, 'src/components/v3/LeanHero.jsx', '\nexport { HomeDecisionPanel, getUi };');
function treePanel(locale = 'en', q = '', slug = 'binance', mode = 'direct', chooserOpen = true) {
  treeStates = [q, slug, mode, chooserOpen];
  treeIndex = 0;
  treeEvents = [];
  treeRef = null;
  return treeHero.HomeDecisionPanel({ locale, ui: treeHero.getUi(locale) });
}
function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  const children = node.props?.children;
  for (const child of Array.isArray(children) ? children : [children]) walk(child, visit);
}
function findNode(node, predicate) {
  let found = null;
  walk(node, (candidate) => { if (!found && predicate(candidate)) found = candidate; });
  return found;
}

test('R169 direct mode uses a closed native platform chooser before the unchanged registration card', () => {
  for (const locale of locales) {
    const before = panel(oldHero, locale, '', 'binance', 'direct');
    const after = panel(newHero, locale, '', 'binance', 'direct');
    assert.deepEqual(anchors(after), anchors(before), locale + ' full anchor markup preserved');
    assert.equal(regCard(maybeNormalizeR175(after, locale)), regCard(before), locale + ' exact RegistrationCard subtree preserved after approved R175 JA normalization');
    assert.match(after, /<details class="growth-platform-chooser"/);
    assert.doesNotMatch(after, /<details class="growth-platform-chooser" open=""/);
    assert.ok(after.indexOf('growth-platform-chooser') < after.indexOf('registration-card registration-card--compact'), locale + ' chooser precedes card');
    const selectedRoute = after.match(/<div class="growth-selected-route">[\s\S]*?<div class="registration-card registration-card--compact"/)?.[0] || '';
    assert.doesNotMatch(selectedRoute, /growth-selected-route__identity/, locale + ' repeated selected identity removed from card shell');
    assert.match(chooser(after), /growth-platform-chooser__summary/);
    assert.match(chooser(after), /<strong translate="no" lang="en" dir="ltr">Binance<\/strong>/);
    assert.match(chooser(after), /growth-platform-search/);
    assert.match(chooser(after), /growth-platform-list/);
    assert.ok(chooser(after).indexOf('growth-platform-search') < chooser(after).indexOf('growth-platform-list'), locale + ' search and options live inside chooser');
    assert.ok(after.indexOf('registration-card__preflight') < after.indexOf('registration-card__primary-btn'), locale + ' preflight remains before CTA');
    assert.ok(after.indexOf('registration-card__primary-btn') < after.indexOf('growth-decision-explanation'), locale + ' CTA remains outside optional explanation');
  }
});

test('R169 chooser keeps the original default four and query-expanded six platform options reachable', () => {
  const closed = panel(newHero, 'en', '', 'binance', 'direct');
  assert.equal((chooser(closed).match(/growth-platform-option/g) || []).length, 4, 'default closed chooser keeps four platform choices in SSR');
  const searched = panel(newHero, 'en', 'e', 'binance', 'direct');
  assert.equal((chooser(searched).match(/growth-platform-option/g) || []).length, 6, 'query mode keeps six reachable choices');
  for (const name of ['Binance','OKX','Bybit','Bitget','Gate.io','MEXC']) assert.ok(chooser(searched).includes(name), name + ' visible in query-expanded chooser');
});



test('R169 selected venue routes preserve each original registration card and empty search fallback', () => {
  for (const slug of ['binance','okx','bybit','bitget','gate-io','mexc']) {
    const before = panel(oldHero, 'en', '', slug, 'direct');
    const after = panel(newHero, 'en', '', slug, 'direct');
    assert.equal(regCard(maybeNormalizeR175(after, 'en', slug)), regCard(before), slug + ' exact selected registration card subtree');
    assert.deepEqual(anchors(after), anchors(before), slug + ' anchors unchanged');
    assert.match(chooser(after), new RegExp(`<strong translate="no" lang="en" dir="ltr">${slug === 'gate-io' ? 'Gate.io' : slug === 'okx' ? 'OKX' : slug === 'mexc' ? 'MEXC' : slug[0].toUpperCase() + slug.slice(1)}<\/strong>`));
  }
  const emptySearch = panel(newHero, 'en', 'zzzz-no-match', 'binance', 'direct');
  assert.equal((chooser(emptySearch).match(/growth-platform-option/g) || []).length, 6, 'empty search fallback keeps six original options reachable');
  assert.equal(regCard(emptySearch), regCard(panel(oldHero, 'en', 'zzzz-no-match', 'binance', 'direct')), 'empty search does not change the registration card');
});



test('R169 preserves original search label/input SSR and platform button attribute/text multisets inside chooser', () => {
  for (const locale of locales) {
    for (const query of ['', 'e', 'zzzz-no-match']) {
      const before = panel(oldHero, locale, query, 'binance', 'direct');
      const after = panel(newHero, locale, query, 'binance', 'direct');
      assert.equal(searchLabel(chooser(after)), searchLabel(before), locale + '/' + query + ' search label/input markup unchanged after moving inside chooser');
      assert.deepEqual(platformButtonsLoose(chooser(after)), platformButtonsLoose(before), locale + '/' + query + ' platform buttons full SSR markup unchanged');
    }
  }
});

test('R169 preserves complete commercial card and anchors for 15 locales times six selectable venues', () => {
  for (const locale of locales) {
    for (const slug of ['binance','okx','bybit','bitget','gate-io','mexc']) {
      const before = panel(oldHero, locale, '', slug, 'direct');
      const after = panel(newHero, locale, '', slug, 'direct');
      assert.equal(regCard(maybeNormalizeR175(after, locale, slug)), regCard(before), `${locale}/${slug} exact registration card subtree after approved R175 JA normalization`);
      assert.deepEqual(anchors(after), anchors(before), `${locale}/${slug} full anchor markup`);
    }
  }
});

test('R169 keeps source outside HomeDecisionPanel byte-identical to R163', () => {
  const p = 'src/components/v3/LeanHero.jsx';
  const before = read(base, p);
  const after = read(current, p);
  const start = (src) => src.indexOf('function HomeDecisionPanel(');
  const end = (src) => src.indexOf('\nexport function LeanHero(');
  assert.equal(after.slice(0, start(after)), before.slice(0, start(before)), 'source before HomeDecisionPanel exact');
  assert.equal(after.slice(end(after)), before.slice(end(before)), 'source after HomeDecisionPanel exact');
});

test('R169 chooser handlers call original setters, native toggle intent, and summary focus in order', () => {
  const tree = treePanel('en', '', 'binance', 'direct', true);
  const details = findNode(tree, (node) => node.type === 'details' && node.props.className === 'growth-platform-chooser');
  assert.ok(details, 'chooser details node exists');
  details.props.onToggle({ currentTarget: { open: false } });
  assert.deepEqual(treeEvents, [['setState', 3, false]], 'native details toggle writes only chooser open state');

  treeEvents = [];
  const searchInput = findNode(tree, (node) => node.type === 'input' && node.props.type === 'search');
  assert.ok(searchInput, 'search input stays in component tree');
  searchInput.props.onChange({ target: { value: 'okx' } });
  assert.deepEqual(treeEvents, [['setState', 0, 'okx']], 'original search onChange still writes query state');

  treeEvents = [];
  const bitget = findNode(tree, (node) => node.type === 'button' && node.props['data-growth-decision'] === 'bitget');
  assert.ok(bitget, 'bitget option button exists');
  bitget.props.onClick();
  assert.deepEqual(treeEvents, [['setState', 1, 'bitget'], ['setState', 3, false], ['focus', 'summary']], 'select platform updates selected slug, closes chooser, then returns focus');
});

test('R169 compare mode remains byte-identical and protected data files stay exact', () => {
  for (const locale of locales) assert.equal(panel(newHero, locale, '', 'binance', 'compare'), panel(oldHero, locale, '', 'binance', 'compare'), locale + ' compare branch exact');
  for (const p of ['src/data/partner-registry.js','src/data/source-bound-cta.js','src/components/v3/registration-decision-state.js']) assert.equal(read(current, p), read(base, p), p);
  assert.equal(withoutR180Copy(read(current,'src/components/v3/RegistrationCard.jsx')),expectedRegistrationSource(),'complete approved combined registration source');
  assert.equal(createHash('sha256').update(read(current, 'src/data/partner-registry.js')).digest('hex'), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});

test('R169 source keeps chooser behavior scoped to HomeDecisionPanel', () => {
  const src = read(current, 'src/components/v3/LeanHero.jsx');
  assert.match(src, /const \[chooserOpen, setChooserOpen\] = useState\(false\)/);
  assert.match(src, /const chooserSummaryRef = useRef\(null\)/);
  assert.match(src, /onToggle=\{\(event\) => setChooserOpen\(event\.currentTarget\.open\)\}/);
  assert.match(src, /setChooserOpen\(false\);[\s\S]*chooserSummaryRef\.current\?\.focus\?\.\(\)/);
});

test('R169 CSS adds only scoped chooser rules and keeps native summary/touch targets', () => {
  const before = read(base, 'src/components/v3/growth-conversion.css');
  const after = read(current, 'src/components/v3/growth-conversion.css');
  assert.ok(after.startsWith(before), 'CSS is append-only against R163');
  const extra = after.slice(before.length);
  assert.match(extra, /\.growth-platform-chooser/);
  assert.match(extra, /\.growth-platform-chooser__summary[\s\S]*min-height:\s*44px/);
  assert.doesNotMatch(extra, /font-size\s*:\s*(?:0\.[0-7]|[0-9]+px)/, 'no smaller text hack in new chooser CSS');
  assert.doesNotMatch(extra, /display\s*:\s*none|visibility\s*:\s*hidden|overflow\s*:\s*hidden/);
});
}

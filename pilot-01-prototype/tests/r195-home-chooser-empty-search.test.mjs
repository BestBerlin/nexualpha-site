import { existsSync as historicalFixtureExists } from 'node:fs';
// Only historical comparisons need this external review snapshot. Local checks run.
const historicalFixture = new URL("../../../r193-desktop-hero-composition/candidate/src/components/v3/LeanHero.jsx", import.meta.url);
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { buildSync } from 'esbuild';
import postcss from 'postcss';

const req = createRequire(import.meta.url);
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const current = new URL('../', import.meta.url);
const base = new URL('../../../r193-desktop-hero-composition/candidate/', import.meta.url);
const locales = ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];
const expectedEmptyCopy = {
  en: ['No matching platform in this shortlist.', 'Clear search'],
  'zh-Hans': ['暂无匹配平台', '清除搜索'],
  'zh-Hant': ['暫無匹配平台', '清除搜尋'],
  ja: ['該当するプラットフォームはありません', '検索をクリア'],
  ko: ['일치하는 플랫폼이 없습니다', '검색 지우기'],
  tr: ['Eşleşen platform yok', 'Aramayı temizle'],
  ar: ['لا توجد منصة مطابقة', 'مسح البحث'],
  es: ['No hay plataformas coincidentes', 'Borrar búsqueda'],
  'pt-BR': ['Nenhuma plataforma correspondente', 'Limpar busca'],
  fr: ['Aucune plateforme correspondante', 'Effacer la recherche'],
  de: ['Keine passende Plattform', 'Suche löschen'],
  ru: ['Нет совпадающих платформ', 'Очистить поиск'],
  id: ['Tidak ada platform yang cocok', 'Hapus pencarian'],
  vi: ['Không có nền tảng phù hợp', 'Xóa tìm kiếm'],
  it: ['Nessuna piattaforma corrispondente', 'Cancella ricerca'],
};
let stateSequence = null;
let stateIndex = 0;
class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : [1791172800000])); } static now() { return 1791172800000; } }
const hooks = { ...React, useState: (init) => stateSequence && stateIndex < stateSequence.length ? [stateSequence[stateIndex++], () => {}] : React.useState(init) };
function read(root, p) { return readFileSync(new URL(p, root), 'utf8'); }
function load(root, extra = '') {
  const file = fileURLToPath(new URL('src/components/v3/LeanHero.jsx', root));
  const output = buildSync({ stdin: { contents: read(root, 'src/components/v3/LeanHero.jsx') + extra, resolveDir: path.dirname(file), sourcefile: file, loader: 'jsx' }, jsx: 'automatic', bundle: true, write: false, format: 'cjs', platform: 'node', external: ['react','react-dom','react/jsx-runtime'], loader: { '.css': 'empty' } }).outputFiles[0].text;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require: (name) => name === 'react' ? hooks : req(name), URL, URLSearchParams, Intl, Date: FixedDate, console, setTimeout, clearTimeout });
  return module.exports;
}
const hero = load(current, '\nexport { HomeDecisionPanel, getUi };');
function panel(locale = 'en', query = '', slug = 'binance', mode = 'direct', chooserOpen = true) {
  stateSequence = [query, slug, mode, chooserOpen];
  stateIndex = 0;
  try { return renderToStaticMarkup(React.createElement(hero.HomeDecisionPanel, { locale, ui: hero.getUi(locale) })); }
  finally { stateSequence = null; }
}
const chooser = (html) => html.match(/<details class="growth-platform-chooser"[\s\S]*?<\/details>/)?.[0] || '';
const optionCount = (html) => (chooser(html).match(/class="growth-platform-option/g) || []).length;
const anchors = (html) => [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map((m) => m[0]).sort();

let treeStates = [];
let treeIndex = 0;
let treeRefIndex = 0;
let treeEvents = [];
const jsxNode = (type, props, key) => ({ type, key, props: props || {} });
function loadTreeModule() {
  const file = fileURLToPath(new URL('src/components/v3/LeanHero.jsx', current));
  const output = buildSync({ stdin: { contents: read(current, 'src/components/v3/LeanHero.jsx') + '\nexport { HomeDecisionPanel, getUi };', resolveDir: path.dirname(file), sourcefile: file, loader: 'jsx' }, jsx: 'automatic', bundle: true, write: false, format: 'cjs', platform: 'node', external: ['react','react/jsx-runtime'], loader: { '.css': 'empty' } }).outputFiles[0].text;
  const module = { exports: {} };
  const fakeReact = {
    ...React,
    useState: (init) => {
      const slot = treeIndex++;
      const value = slot < treeStates.length ? treeStates[slot] : init;
      return [value, (next) => treeEvents.push(['setState', slot, next])];
    },
    useRef: () => {
      const refSlot = treeRefIndex++;
      const name = refSlot === 0 ? 'summary' : 'search';
      return { current: { focus: () => treeEvents.push(['focus', name]) } };
    },
    useEffect: () => undefined,
    useCallback: (fn) => fn,
  };
  vm.runInNewContext(output, { module, exports: module.exports, require: (name) => name === 'react' ? fakeReact : name === 'react/jsx-runtime' ? { jsx: jsxNode, jsxs: jsxNode, Fragment: 'Fragment' } : req(name), URL, URLSearchParams, Intl, Date: FixedDate, console, setTimeout, clearTimeout });
  return module.exports;
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

test('R195 non-matching chooser query shows empty state instead of fallback venues while keeping selected registration card', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
  const html = panel('en', 'zzzz-no-platform', 'binance', 'direct', true);
  assert.equal(optionCount(html), 0, 'no fallback platform options appear for a real zero-match query');
  assert.match(chooser(html), /No matching platform in this shortlist\./);
  assert.match(chooser(html), /<button\b[^>]*class="growth-platform-empty__clear"[^>]*>Clear search<\/button>/);
  assert.match(html, /registration-card registration-card--compact/);
  assert.match(html, /11350287/);
  assert.ok(anchors(html).some((anchor) => anchor.includes('ref=11350287')), 'selected Binance invite href remains visible outside chooser');
});

test('R195 default and matching query counts stay unchanged', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
  assert.equal(optionCount(panel('en', '', 'binance', 'direct', true)), 4, 'empty query keeps four common options');
  const matched = panel('en', 'e', 'binance', 'direct', true);
  assert.equal(optionCount(matched), 6, 'matching query still expands to six options');
  for (const name of ['Binance','OKX','Bybit','Bitget','Gate.io','MEXC']) assert.match(chooser(matched), new RegExp(name.replace('.', '\\.')));
});

test('R195 empty-state copy is native for every supported locale', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
  for (const locale of locales) {
    const html = chooser(panel(locale, 'zzzz-no-platform', 'binance', 'direct', true));
    for (const text of expectedEmptyCopy[locale]) assert.ok(html.includes(text), `${locale} missing ${text}`);
    if (locale !== 'en') assert.doesNotMatch(html, /No matching platform|Clear search/, `${locale} must not fall back to English`);
  }
});

test('R195 clear-search button resets query and returns keyboard focus to the search input', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
  const treeHero = loadTreeModule();
  treeStates = ['zzzz-no-platform', 'binance', 'direct', true];
  treeIndex = 0;
  treeRefIndex = 0;
  treeEvents = [];
  const tree = treeHero.HomeDecisionPanel({ locale: 'en', ui: treeHero.getUi('en') });
  const clear = findNode(tree, (node) => node.type === 'button' && node.props?.className === 'growth-platform-empty__clear');
  assert.ok(clear, 'clear button node exists in zero-match state');
  clear.props.onClick();
  assert.deepEqual(treeEvents, [['setState', 0, ''], ['focus', 'search']], 'clear resets query and restores focus to search input');
});

test('R195 CSS gives the empty-state clear button a 44px touch target', () => {
  const ast = postcss.parse(read(current, 'src/components/v3/growth-conversion.css'));
  const rule = ast.nodes.find((node) => node.type === 'rule' && node.selector === '.growth-platform-empty__clear');
  assert.ok(rule, 'empty clear button rule exists');
  const declarations = Object.fromEntries(rule.nodes.filter((node) => node.type === 'decl').map((node) => [node.prop, node.value]));
  assert.equal(declarations['min-height'], '44px');
  assert.equal(declarations['width'], '100%');
});

test('R195 protected registry and commercial anchors stay unchanged from R193 for non-empty states', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
  assert.equal(createHash('sha256').update(read(current, 'src/data/partner-registry.js')).digest('hex'), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
  for (const query of ['', 'e']) assert.deepEqual(anchors(panel('en', query, 'binance', 'direct', true)), anchors(renderToStaticMarkup(React.createElement(load(base, '\nexport { HomeDecisionPanel, getUi };').HomeDecisionPanel, { locale: 'en', ui: load(base, '\nexport { HomeDecisionPanel, getUi };').getUi('en') }))));
});

function normalizeR195LeanHeroSource(source) {
  const oldList = read(base, 'src/components/v3/LeanHero.jsx').match(/                <ul className="growth-platform-list" aria-label=\{ui\.searchLabel\}>[\s\S]*?                <\/ul>\n/)?.[0];
  assert.ok(oldList, 'baseline platform list block found');
  const newList = source.match(/                \{visibleVenueOptions\.length > 0 \? \([\s\S]*?                \)\}\n/)?.[0];
  assert.ok(newList, 'R195 conditional empty-state block found');
  return source
    .replace(/  const chooserEmptyCopy = \{\n[\s\S]*?  \};\n(?=  const localeBase)/, '')
    .replace('  const chooserEmpty = chooserEmptyCopy[locale] || chooserEmptyCopy[localeBase] || chooserEmptyCopy.en;\n', '')
    .replace('  const chooserSearchRef = useRef(null);\n', '')
    .replace('  const hasChooserQuery = query.trim().length > 0;\n  const visibleVenueOptions = (hasChooserQuery ? filtered : venues).slice(0, hasChooserQuery ? 6 : 4);', '  const visibleVenueOptions = (filtered.length ? filtered : venues).slice(0, query.trim() ? 6 : 4);')
    .replace('  const clearChooserSearch = () => {\n    setQuery("");\n    chooserSearchRef.current?.focus?.();\n  };\n', '')
    .replace('                    ref={chooserSearchRef}\n', '')
    .replace(newList, oldList);
}

function normalizeR195HomeCss(css) {
  return css.replace(/\.growth-platform-empty \{\n[\s\S]*?\.growth-platform-empty__clear:focus-visible \{\n  outline: 2px solid #8fb0ff;\n  outline-offset: 3px;\n\}\n\n/, '');
}

test('R195 LeanHero source inverse is exactly R193 except the empty-search feature', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
  const currentSource = read(current, 'src/components/v3/LeanHero.jsx');
  const baseSource = read(base, 'src/components/v3/LeanHero.jsx');
  assert.equal(normalizeR195LeanHeroSource(currentSource), baseSource);
  assert.doesNotMatch(currentSource, /filtered\.length \? filtered : venues/, 'zero-match query must not use fallback venues');
});

test('R195 CSS inverse is exactly R193 except the empty-state rule block', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
  assert.equal(normalizeR195HomeCss(read(current, 'src/components/v3/growth-conversion.css')), read(base, 'src/components/v3/growth-conversion.css'));
});

import {withoutR181} from './r182-peer-scope.mjs';
import {withoutR180Copy} from './r180-source-scope.mjs';
import {expectedRegistrationSource} from './r176-peer-source.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const req = createRequire(import.meta.url);
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const { buildSync } = req('esbuild');
const base = new URL('../../../r169-home-platform-chooser/candidate/', import.meta.url);
const current = new URL('../', import.meta.url);
const locales = ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];
const slugs = ['binance','okx','bybit','bitget','gate-io','mexc'];
const names = { 'binance':'Binance', 'okx':'OKX', 'bybit':'Bybit', 'bitget':'Bitget', 'gate-io':'Gate.io', 'mexc':'MEXC' };
const read = (root, p) => root===current&&p==='src/components/v3/LeanHero.jsx'?withoutR181(readFileSync(new URL(p,root),'utf8'),p):readFileSync(new URL(p,root),'utf8');
let sequence = null;
let index = 0;
class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : [1791172800000])); } static now() { return 1791172800000; } }
const hooks = { ...React, useState: (init) => sequence && index < sequence.length ? [sequence[index++], () => {}] : React.useState(init) };
function load(root, p, extra = '') {
  const file = fileURLToPath(new URL(p, root));
  const output = buildSync({ stdin: { contents: (root===base&&p==='src/components/v3/RegistrationCard.jsx'?read(new URL('../../../r172-registration-nextstep-locales/candidate/',import.meta.url),p):root===base?read(root,p).replace('import { RegistrationCard } from "./RegistrationCard.jsx";', 'import { RegistrationCard } from '+JSON.stringify(fileURLToPath(new URL('../../../r172-registration-nextstep-locales/candidate/src/components/v3/RegistrationCard.jsx',import.meta.url)))+';'):read(root,p)) + extra, resolveDir: path.dirname(file), sourcefile: file, loader: 'jsx' }, jsx: 'automatic', bundle: true, write: false, format: 'cjs', platform: 'node', external: ['react','react-dom','react/jsx-runtime'], loader: { '.css': 'empty' } }).outputFiles[0].text;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require: (name) => name === 'react' ? hooks : req(name), URL, URLSearchParams, Intl, Date: FixedDate, console, setTimeout, clearTimeout });
  return module.exports;
}
const oldHero = load(base, 'src/components/v3/LeanHero.jsx', '\nexport { HomeDecisionPanel, getUi };');
const newHero = load(current, 'src/components/v3/LeanHero.jsx', '\nexport { HomeDecisionPanel, getUi };');
const oldReg = load(base, 'src/components/v3/RegistrationCard.jsx').RegistrationCard;
const newReg = load(current, 'src/components/v3/RegistrationCard.jsx').RegistrationCard;
function panel(mod, locale, slug = 'binance', mode = 'direct') {
  sequence = ['', slug, mode, false];
  index = 0;
  try { return renderToStaticMarkup(React.createElement(mod.HomeDecisionPanel, { locale, ui: mod.getUi(locale) })); }
  finally { sequence = null; }
}
function normalizeApprovedJaHome(html, slug = 'binance') {
  const name = names[slug];
  return html
    .replace(` aria-label="${name}、プラットフォームを変更"`, '')
    .replace('class="growth-platform-chooser__change">変更</span>', 'class="growth-platform-chooser__change">プラットフォームを変更</span>')
    .replace(/(<button\b[^>]*class="registration-card__copy-btn"[^>]*) aria-label="コードをコピー"([^>]*>)コピー<\/button>/g, '$1$2コードをコピー</button>');
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

function renderRegistrationWithState(Component, props, states) {
  sequence = states;
  index = 0;
  try { return renderToStaticMarkup(React.createElement(Component, props)); }
  finally { sequence = null; }
}

test('R175 JA homepage uses compact visible labels with full accessible names', () => {
  const html = panel(newHero, 'ja', 'binance', 'direct');
  assert.match(html, /<summary class="growth-platform-chooser__summary" aria-label="Binance、プラットフォームを変更">/);
  assert.match(html, /class="growth-platform-chooser__change">変更<\/span>/);
  assert.match(html, /class="registration-card__copy-btn"[^>]*aria-label="コードをコピー"[^>]*>コピー<\/button>/);
  assert.doesNotMatch(regCard(html), />コードをコピー<\/button>/, 'home compact visible copy label is shortened only in the button text');
});

test('R175 only approved JA homepage text and aria attrs differ from R169', () => {
  for (const slug of slugs) {
    const before = panel(oldHero, 'ja', slug, 'direct');
    const after = panel(newHero, 'ja', slug, 'direct');
    assert.equal(normalizeApprovedJaHome(after, slug), before, 'JA/' + slug + ' only approved labels differ');
    assert.deepEqual(anchors(after), anchors(before), 'JA/' + slug + ' anchors unchanged');
  }
  assert.equal(panel(newHero, 'ja', 'binance', 'compare'), panel(oldHero, 'ja', 'binance', 'compare'), 'JA compare branch unchanged');
});

test('R175 all non-JA home locales remain byte-identical to R169', () => {
  for (const locale of locales.filter((locale) => locale !== 'ja')) {
    for (const mode of ['direct','compare']) assert.equal(panel(newHero, locale, 'binance', mode), panel(oldHero, locale, 'binance', mode), locale + '/' + mode + ' exact');
  }
});

test('R175 standalone RegistrationCard remains exact unless explicit home compact label props are passed', () => {
  for (const locale of locales) {
    for (const compact of [false, true]) {
      const before = renderToStaticMarkup(React.createElement(oldReg, { venueSlug: 'binance', locale, compact }));
      const after = renderToStaticMarkup(React.createElement(newReg, { venueSlug: 'binance', locale, compact }));
      assert.equal(after, before, locale + '/' + compact + ' standalone card exact');
    }
  }
  const homeScoped = renderToStaticMarkup(React.createElement(newReg, { venueSlug: 'binance', locale: 'ja', compact: true, compactCopyLabel: 'コピー', compactCopyAriaLabel: 'コードをコピー' }));
  assert.match(homeScoped, /class="registration-card__copy-btn"[^>]*aria-label="コードをコピー"[^>]*>コピー<\/button>/);
  const copiedScoped = renderRegistrationWithState(newReg, { venueSlug: 'binance', locale: 'ja', compact: true, compactCopyLabel: 'コピー', compactCopyAriaLabel: 'コードをコピー' }, [true, false]);
  assert.match(copiedScoped, /class="registration-card__copy-btn"[^>]*aria-label="コピーしました ✓"[^>]*>コピーしました ✓<\/button>/, 'copied state remains announced when compact aria is supplied');
  const copiedStandalone = renderRegistrationWithState(newReg, { venueSlug: 'binance', locale: 'ja', compact: true }, [true, false]);
  assert.match(copiedStandalone, /class="registration-card__copy-btn"[^>]*data-copied="true"[^>]*>コピーしました ✓<\/button>/);
  assert.doesNotMatch(copiedStandalone, /aria-label="コピーしました ✓"/, 'original standalone copied branch keeps aria undefined');
  assert.match(homeScoped, /11350287/);
  assert.match(homeScoped, /第三者の登録/);
});

test('R175 protected files and registry remain unchanged', () => {
  for (const p of ['src/data/partner-registry.js','src/data/source-bound-cta.js','src/components/v3/registration-decision-state.js','src/components/v3/growth-conversion.css']) assert.equal(read(current, p), read(base, p), p);
  assert.equal(withoutR180Copy(read(current,'src/components/v3/RegistrationCard.jsx')),expectedRegistrationSource());
  assert.equal(createHash('sha256').update(read(current, 'src/data/partner-registry.js')).digest('hex'), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});

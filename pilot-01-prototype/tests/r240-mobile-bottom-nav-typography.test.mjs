import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { buildSync } from 'esbuild';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = path.resolve(root, '../../r238-news-prose-direction-scope/candidate');
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const read = (projectRoot, rel) => fs.readFileSync(path.join(projectRoot, rel), 'utf8');

function load(projectRoot) {
  const source = `import { MobileBottomNav, mobileNavCurrentValue } from './src/components/v3/MobileBottomNav.jsx'; export { MobileBottomNav, mobileNavCurrentValue };`;
  const code = buildSync({
    stdin: { contents: source, resolveDir: projectRoot, loader: 'jsx' },
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    external: ['react', 'react/jsx-runtime'],
    loader: { '.css': 'empty' },
  }).outputFiles[0].text;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require, console, URL, URLSearchParams, Intl, setTimeout, clearTimeout });
  return module.exports;
}

const current = load(root);
const baseline = load(base);
const render = (mod, locale = 'en') => renderToStaticMarkup(React.createElement(mod.MobileBottomNav, { locale, onSearch: () => {} }));
const labels = (html) => [...html.matchAll(/<span class="mobile-bottom-nav__label">([\s\S]*?)<\/span>/g)].map((m) => m[1]);
const ariaLabels = (html) => [...html.matchAll(/<(?:a|button)\b[^>]*class="mobile-bottom-nav__item"[^>]*>/g)].map((m) => m[0].match(/aria-label="([^"]+)"/)?.[1] || null);
const hrefs = (html) => [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((m) => m[1]);
const cssBlock = (css, selector, afterIndex = 0) => {
  const start = css.indexOf(`${selector} {`, afterIndex);
  assert.notEqual(start, -1, `missing selector ${selector}`);
  const end = css.indexOf('}', start);
  assert.notEqual(end, -1, `missing close for ${selector}`);
  return css.slice(start, end + 1);
};

test('R240 keeps five mobile nav entries and route targets while using a semantically neutral short English Campaigns label', () => {
  const html = render(current, 'en');
  const old = render(baseline, 'en');
  assert.deepEqual(hrefs(html), hrefs(old), 'route hrefs stay byte-equivalent to R238');
  assert.deepEqual(labels(old), ['Directory', 'Fees', 'Campaigns', 'Compare', 'Search']);
  assert.deepEqual(labels(html), ['Directory', 'Fees', 'Events', 'Compare', 'Search']);
  assert.deepEqual(ariaLabels(html), ['Directory', 'Fees', 'Campaigns', 'Compare', 'Search']);
  assert.equal((html.match(/data-cta-placement="mobile-nav-/g) || []).length, 5);
});

test('R242 uses locale-aware short visible labels for long mobile cells while full aria labels stay intact', () => {
  const cases = {
    ru: {
      visible: ['Каталог', 'Сборы', 'События', 'Сравн.', 'Поиск'],
      aria: ['Каталог', 'Комиссии', 'Кампании', 'Сравнить', 'Поиск'],
    },
    de: {
      visible: ['Börsen', 'Gebühren', 'Events', 'Vergl.', 'Suchen'],
      aria: ['Verzeichnis', 'Gebühren', 'Kampagnen', 'Vergleichen', 'Suchen'],
    },
    fr: {
      visible: ['Annuaire', 'Frais', 'Évén.', 'Compar.', 'Chercher'],
      aria: ['Annuaire', 'Frais', 'Campagnes', 'Comparer', 'Rechercher'],
    },
    tr: {
      visible: ['Dizin', 'Ücret', 'Etkinlik', 'Kıyas', 'Ara'],
      aria: ['Dizin', 'Ücretler', 'Kampanyalar', 'Karşılaştır', 'Ara'],
    },
  };
  for (const [locale, expected] of Object.entries(cases)) {
    const html = render(current, locale);
    assert.deepEqual(labels(html), expected.visible, locale);
    assert.deepEqual(ariaLabels(html), expected.aria, locale);
  }
  for (const locale of ['ja', 'ko', 'ar', 'es', 'pt-BR', 'zh-Hant']) {
    assert.deepEqual(labels(render(current, locale)), labels(render(baseline, locale)), locale);
  }
  assert.equal(current.mobileNavCurrentValue('https://nexualpha.com/activities', 'https://nexualpha.com/activities'), 'page');
  assert.equal(current.mobileNavCurrentValue('https://nexualpha.com/#compare', 'https://nexualpha.com/#compare'), 'location');
  assert.equal(current.mobileNavCurrentValue('https://nexualpha.com/#compare', 'https://nexualpha.com/#exchanges'), undefined);
});

test('R240 prevents arbitrary mid-word label breaks while preserving 44px item targets and resize reserve code', () => {
  const css = read(root, 'src/components/v3/mobile-bottom-nav.css');
  const lastLabelRule = cssBlock(css, '.mobile-bottom-nav__label', css.lastIndexOf('/* R170'));
  assert.match(lastLabelRule, /white-space:\s*nowrap/);
  assert.match(lastLabelRule, /overflow-wrap:\s*normal/);
  assert.match(lastLabelRule, /word-break:\s*normal/);
  assert.doesNotMatch(lastLabelRule, /anywhere/);
  const itemRule = cssBlock(css, '.mobile-bottom-nav__item', css.lastIndexOf('/* R170'));
  assert.match(itemRule, /min-height:\s*44px/);
  assert.match(itemRule, /padding:\s*6px 3px/);
  const source = read(root, 'src/components/v3/MobileBottomNav.jsx');
  assert.match(source, /syncMobileBottomNavReserve/);
  assert.match(source, /readMeasuredHeight\(nav\)/);
  assert.match(source, /aria-label=\{item\.ariaLabel \|\| item\.label\}/);
});

test('R240 protects registry and invite data from this typography-only slice', () => {
  assert.equal(read(root, 'src/data/partner-registry.js'), read(base, 'src/data/partner-registry.js'));
  assert.equal(crypto.createHash('sha256').update(read(root, 'src/data/partner-registry.js')).digest('hex'), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
  for (const rel of ['src/data/source-bound-cta.js', 'src/data/venue-database.js']) {
    assert.equal(read(root, rel), read(base, rel), rel);
  }
});

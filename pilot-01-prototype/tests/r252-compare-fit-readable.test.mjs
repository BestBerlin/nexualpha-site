import {projectApproved} from './helpers/r237-approved-inverses.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { buildSync } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = fileURLToPath(new URL('../../../r251-motion-integration/candidate/', import.meta.url));
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

const beforeBlock = `  .v3-compare-page .v3-versus-fit {\n    display: -webkit-box;\n    margin: 0.15rem 0;\n    overflow: hidden;\n    color: rgba(226, 232, 240, 0.9);\n    font-size: 0.84rem;\n    line-height: 1.42;\n    -webkit-box-orient: vertical;\n    -webkit-line-clamp: 2;\n  }`;
const afterBlock = `  .v3-compare-page .v3-versus-fit {\n    display: block;\n    margin: 0.15rem 0;\n    overflow: visible;\n    color: rgba(226, 232, 240, 0.9);\n    font-size: 0.84rem;\n    line-height: 1.42;\n  }`;

function collectDeclarations(cssText, selector, prop, width = 390) {
  const values = [];
  const rootCss = postcss.parse(cssText);
  const applies = (node) => {
    for (let p = node.parent; p; p = p.parent) {
      if (p.type !== 'atrule' || p.name !== 'media') continue;
      const params = p.params;
      const max = params.match(/max-width:\s*(\d+)px/);
      const min = params.match(/min-width:\s*(\d+)px/);
      if (max && width > Number(max[1])) return false;
      if (min && width < Number(min[1])) return false;
    }
    return true;
  };
  rootCss.walkRules((rule) => {
    if (!rule.selectors?.includes(selector) || !applies(rule)) return;
    rule.walkDecls(prop, (decl) => values.push(decl.value));
  });
  return values;
}

test('mobile compare fit support text uses natural wrapping instead of hidden two-line clipping', () => {
  const css = read(root, cross);
  assert.equal(css.includes(afterBlock), true, 'new natural-wrap block is present exactly once');
  assert.equal(css.split(afterBlock).length, 2, 'new block occurs once');
  assert.equal(css.includes(beforeBlock), false, 'old clipping tuple is removed');
  assert.deepEqual(collectDeclarations(css, '.v3-compare-page .v3-versus-fit', 'display', 390).at(-1), 'block');
  assert.deepEqual(collectDeclarations(css, '.v3-compare-page .v3-versus-fit', 'overflow', 390).at(-1), 'visible');
  assert.deepEqual(collectDeclarations(css, '.v3-compare-page .v3-versus-fit', '-webkit-line-clamp', 390), []);
  assert.deepEqual(collectDeclarations(css, '.v3-compare-page .v3-versus-fit', '-webkit-box-orient', 390), []);
});

test('R252 compare CSS differs from R251 only by the fit readability block', () => {
  const current = projectApproved(cross, read(root, cross), 'r254-compare-directory-integration');
  const previous = read(base, cross);
  assert.equal(current.replace(afterBlock, beforeBlock), previous);
});

test('R250 motion gates remain in the compare CSS after the fit readability change', () => {
  const css = read(root, cross);
  assert.equal(css.includes('@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'), true);
  assert.equal(css.includes('.crossroads__card:hover .crossroads__arrow {\n    transform: translateX(4px);\n  }'), true);
});

test('partner registry remains byte-identical to frozen R251', () => {
  assert.deepEqual(fs.readFileSync(path.join(root, registry)), fs.readFileSync(path.join(base, registry)));
});


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

function renderCompare(runtime, locale) {
  return renderToStaticMarkup(React.createElement(runtime.CompareDeepPage, {
    copy: { ...runtime.v3Copy(locale), common: { dimension: 'Dimension' }, assetCapabilities: { none: 'Pending source review' } },
    locale,
    selected: ['bybit', 'bitget'],
    venues: Object.values(runtime.venueDatabase),
    updates: [],
    market: 'unknown',
    product: 'unknown',
  }));
}

function anchorAttrs(html, href) {
  const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/&/g, '&amp;');
  const match = html.match(new RegExp(`<a\\b(?=[^>]*href="${escaped}")[^>]*>`, 'g'));
  return match || [];
}

test('15 locale real compare SSR keeps all text and CTA attributes byte-identical to R251', () => {
  const current = loadCompareRuntime(root);
  const previous = loadCompareRuntime(base);
  for (const locale of locales) {
    const html = renderCompare(current, locale);
    const baseline = renderCompare(previous, locale);
    assert.equal(html, baseline, `${locale} compare SSR text/attrs should be unchanged by CSS-only R252`);
    assert.match(html, /class="v3-versus-fit"/, `${locale} renders the support fit text nodes`);
    for (const [slug, href] of [
      ['bybit', 'https://www.bybit.com/register?affiliate_id=48553'],
      ['bitget', 'https://partner.bitget.cafe/bg/C6PRAF'],
    ]) {
      const anchors = anchorAttrs(html, href);
      const baselineAnchors = anchorAttrs(baseline, href);
      assert.deepEqual(anchors, baselineAnchors, `${locale} ${slug} protected registration CTA anchors stay byte-identical to R251`);
      assert.ok(anchors.length >= 2, `${locale} ${slug} keeps its existing protected registration CTAs`);
      for (const anchor of anchors) {
        assert.match(anchor, /data-cta-kind="registration"/);
        assert.match(anchor, new RegExp(`data-cta-platform="${slug}"`));
        assert.match(anchor, /data-cta-placement="compare-(sticky-registration|final-choice-registration|hero-versus)"/);
      }
    }
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';


import { existsSync } from 'node:fs';

if (existsSync(new URL('../../../r128-home-mobile/candidate/', import.meta.url))) {
const req = createRequire(new URL('../package.json', import.meta.url));
const { buildSync } = req('esbuild');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = fileURLToPath(new URL('../../../r128-home-mobile/candidate/', import.meta.url));
const locales = ['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ru','ar','id','vi','it'];

class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : ['2026-10-05T09:00:00Z'])); }
  static now() { return Date.parse('2026-10-05T09:00:00Z'); }
}

function loadTopicGuide(projectRoot) {
  const code = buildSync({
    stdin: {
      contents: `export { TopicGuidePage } from ${JSON.stringify(projectRoot + 'src/components/v3/TopicGuidePage.jsx')};`,
      resolveDir: projectRoot,
    },
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    jsx: 'automatic',
    external: ['react', 'react/jsx-runtime'],
    loader: { '.css': 'empty' },
    logLevel: 'silent',
  }).outputFiles[0].text;
  const module = { exports: {} };
  const jsx = (type, props, key) => React.createElement(type, key === undefined ? props : { ...props, key });
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name) => name === 'react' ? React : name === 'react/jsx-runtime' ? { jsx, jsxs: jsx, Fragment: React.Fragment } : req(name),
    console: { ...console, error() {}, warn() {} },
    URL,
    URLSearchParams,
    Intl,
    Date: FixedDate,
    setTimeout,
    clearTimeout,
  });
  return module.exports.TopicGuidePage;
}

function hrefMultiset(html) {
  return [...html.matchAll(/href="([^"]*)"/g)].map((match) => match[1]).sort();
}

test('meme topic keeps the exact raw href multiset for all 15 locales versus R128', () => {
  const Before = loadTopicGuide(baseline);
  const After = loadTopicGuide(root);
  for (const locale of locales) {
    const props = { slug: 'meme-coins', locale, market: 'unknown', product: 'spot' };
    const before = hrefMultiset(renderToStaticMarkup(React.createElement(Before, props)));
    const after = hrefMultiset(renderToStaticMarkup(React.createElement(After, props)));
    assert.deepEqual(after, before, locale);
  }
});

} else {
  test('historical regression requires original archived checkout', { skip: 'Original historical source snapshot is absent from a fresh checkout; current-source tests run separately.' }, () => {});
}

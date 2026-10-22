import { existsSync as historicalFixtureExists } from 'node:fs';
// Only historical comparisons need this external review snapshot. Local checks run.
const historicalFixture = new URL("../../../r184-home-code-identity/candidate/src/components/v3/RebateTickerBar.jsx", import.meta.url);
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { buildSync } from 'esbuild';

const req = createRequire(import.meta.url);
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const root = fileURLToPath(new URL('../', import.meta.url));
const base = fileURLToPath(new URL('../../../r184-home-code-identity/candidate/', import.meta.url));
const registrySha = '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a';
const read = (r, p) => readFileSync(path.join(r, p), 'utf8');

function load(r) {
  const file = path.join(r, 'src/components/v3/RebateTickerBar.jsx');
  const output = buildSync({
    entryPoints: [file],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    loader: { '.css': 'empty' },
    external: ['react', 'react/jsx-runtime'],
  }).outputFiles[0].text;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require: (name) => name === 'react' ? React : req(name), URL, URLSearchParams, Intl, Date, console });
  return module.exports;
}

function renderTicker(r, locale = 'ru') {
  const mod = load(r);
  return renderToStaticMarkup(React.createElement(mod.RebateTickerBar, { locale, market: 'BR', product: 'spot' }));
}

function summary(html) {
  const match = html.match(/<summary class="rebate-ticker__summary"[^>]*>[\s\S]*?<\/summary>/);
  assert.ok(match, 'native source notes summary exists');
  return match[0];
}

function notes(html) {
  return [...html.matchAll(/<li\b[\s\S]*?<p class="rebate-ticker__text">([\s\S]*?)<\/p>[\s\S]*?<a class="rebate-ticker__item" href="([^"]+)"/g)].map((m) => ({ text: m[1], href: m[2] }));
}

test('R186 Russian summary uses a short visible label while keeping the full source-notes name accessible', () => {
  const html = renderTicker(root, 'ru');
  const sum = summary(html);
  assert.match(sum, /aria-label="ЗАМЕТКИ ОБ ИСТОЧНИКАХ"/, 'full original RU label remains accessible on summary');
  assert.match(sum, /<span class="rebate-ticker__tag"[^>]*>Источники<\/span>/, 'visible RU tag is short');
  assert.match(sum, /<span class="rebate-ticker__action-label">Показать все<\/span>/, 'view-all action remains visible');
  assert.doesNotMatch(sum.replace(/aria-label="[^"]+"/g, ''), /ЗАМЕТКИ ОБ ИСТОЧНИКАХ/, 'full RU label is not duplicated as visible text');
});

test('R186 Russian notes keep original text order and onsite destinations', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
  const before = notes(renderTicker(base, 'ru'));
  const after = notes(renderTicker(root, 'ru'));
  assert.equal(before.length, 6, 'base RU has six notes');
  assert.deepEqual(after, before, 'R186 preserves all RU source notes and hrefs exactly');
});


test('R186 inverse patch restores the R184 RebateTickerBar source exactly', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
  const current = read(root, 'src/components/v3/RebateTickerBar.jsx');
  const newRuLine = 'ru: { aria: "Статус источников", tag: "Источники", fullTag: "ЗАМЕТКИ ОБ ИСТОЧНИКАХ", viewAll: "Показать все", hide: "Закрыть", badge:';
  const oldRuLine = 'ru: { aria: "Статус источников", tag: "ЗАМЕТКИ ОБ ИСТОЧНИКАХ", viewAll: "Показать все", hide: "Закрыть", badge:';
  const newLabelLines = `  const sourceFullLabel = tickerUi.fullTag || null;
  const sourceRegionLabel = tickerUi.fullTag || tickerUi.aria || (isHant ? "來源狀態提示" : isZh ? "来源状态提示" : "Source status notes");
`;
  const reversed = current
    .replace(newRuLine, oldRuLine)
    .replace(newLabelLines, '')
    .replace('aria-label={sourceRegionLabel}', 'aria-label={tickerUi.aria || (isHant ? "來源狀態提示" : isZh ? "来源状态提示" : "Source status notes")}')
    .replace('<summary className="rebate-ticker__summary" aria-label={sourceFullLabel || undefined}>', '<summary className="rebate-ticker__summary">');
  assert.equal(reversed, read(base, 'src/components/v3/RebateTickerBar.jsx'));
});

test('R186 source boundaries and native summary behavior stay scoped', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
  const source = read(root, 'src/components/v3/RebateTickerBar.jsx');
  assert.match(source, /<details className="rebate-ticker__details">/, 'native details remains');
  assert.match(source, /<summary className="rebate-ticker__summary" aria-label=\{sourceFullLabel \|\| undefined\}>/, 'summary owns the full accessible label only when needed');
  assert.match(read(root, 'src/components/v3/rebate-ticker-bar.css'), /\.rebate-ticker__summary[\s\S]*?min-height:\s*44px/, 'existing compact summary target remains unchanged at the R184 value');
  assert.equal(read(root, 'src/components/v3/rebate-ticker-bar.css'), read(base, 'src/components/v3/rebate-ticker-bar.css'), 'R186 does not change ticker CSS');
  assert.equal(read(root, 'src/data/partner-registry.js'), read(base, 'src/data/partner-registry.js'), 'registry source remains byte-identical to R184');
  assert.equal(createHash('sha256').update(readFileSync(path.join(root, 'src/data/partner-registry.js'))).digest('hex'), registrySha);
});

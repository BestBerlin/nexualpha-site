import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { buildSync } from 'esbuild';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../../r267-telegram-locale-layout/candidate", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const root = fileURLToPath(new URL('../', import.meta.url));
const base = fileURLToPath(new URL('../../../r267-telegram-locale-layout/candidate/', import.meta.url));
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const FixedDate = class extends Date { constructor(...args) { super(...(args.length ? args : ['2026-10-05T00:00:00.000Z'])); } static now() { return new Date('2026-10-05T00:00:00.000Z').getTime(); } };

function read(projectRoot, file) { return fs.readFileSync(path.join(projectRoot, file), 'utf8'); }

function loadTelegram(projectRoot) {
  const code = buildSync({
    stdin: { contents: "export { TelegramBotHub } from './src/components/v3/TelegramBotHub.jsx';", resolveDir: projectRoot, loader: 'jsx' },
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    external: ['react', 'react/jsx-runtime'],
    loader: { '.css': 'empty' },
  }).outputFiles[0].text;
  const module = { exports: {} };
  const jsx = (type, props, key) => React.createElement(type, key === undefined ? props : { ...props, key });
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name) => {
      if (name === 'react') return React;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: React.Fragment };
      return require(name);
    },
    console,
    URL,
    URLSearchParams,
    Intl,
    Date: FixedDate,
    setTimeout,
    clearTimeout,
  });
  return module.exports.TelegramBotHub;
}

function render(projectRoot, locale) {
  const Component = loadTelegram(projectRoot);
  return renderToStaticMarkup(React.createElement(Component, { locale, headingLevel: 1, market: 'GLOBAL', product: 'research' }));
}

function hrefs(html) { return [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]); }
function ariaLabels(html) { return [...html.matchAll(/aria-label="([^"]*)"/g)].map((m) => m[1]); }

const ariaByLocale = {
  en: 'Primary Telegram actions',
  'zh-Hans': '主要 Telegram 操作',
  'zh-Hant': '主要 Telegram 動作',
  ja: '主な Telegram 操作',
  ko: '주요 Telegram 작업',
  tr: 'Birincil Telegram eylemleri',
  es: 'Acciones principales de Telegram',
  'pt-BR': 'Ações principais do Telegram',
  fr: 'Actions Telegram principales',
  de: 'Primäre Telegram-Aktionen',
  ru: 'Основные действия Telegram',
  ar: 'إجراءات Telegram الأساسية',
  id: 'Aksi utama Telegram',
  vi: 'Hành động Telegram chính',
  it: 'Azioni Telegram principali',
};

test('R272 gives the quick Telegram CTA group a native aria-label across all 15 locales', () => {
  for (const [locale, expected] of Object.entries(ariaByLocale)) {
    const html = render(root, locale);
    assert.ok(ariaLabels(html).includes(expected), `${locale} has expected quick CTA group aria`);
    if (locale !== 'en') assert.equal(html.includes('aria-label="Primary Telegram actions"'), false, `${locale} no English quick CTA aria fallback`);
  }
});

test('R272 only changes quick CTA aria copy; all hrefs stay identical to R267', () => {
  for (const locale of Object.keys(ariaByLocale)) {
    assert.deepEqual(hrefs(render(root, locale)), hrefs(render(base, locale)), `${locale} href order unchanged`);
  }
});

test('R272 keeps R267 Telegram CSS and protected data byte-identical', () => {
  for (const file of [
    'src/components/v3/telegram-bot-hub.css',
    'src/data/partner-registry.js',
    'src/data/telegram-config.js',
    'src/data/telegram-decision-return.js',
    'src/data/generated-tg-broadcast-feed.json',
  ]) assert.equal(read(root, file), read(base, file), `${file} unchanged from R267`);
});

test('R272 JSX diff is limited to adding seven primaryActionsLabel values', () => {
  const current = read(root, 'src/components/v3/TelegramBotHub.jsx');
  const previous = read(base, 'src/components/v3/TelegramBotHub.jsx');
  for (const expected of Object.values(ariaByLocale).filter((value) => value !== 'Primary Telegram actions')) assert.ok(current.includes(expected), `${expected} present`);
  for (const r267Field of ['channelFeedBadge: "القناة الرسمية"', 'tgGroupTitle: "مجتمع متداولي NexuAlpha"', 'tgGroupDesc: "ناقش شروط المنصات']) assert.ok(current.includes(r267Field), `${r267Field} preserved`);
  assert.equal((current.match(/primaryActionsLabel:/g) || []).length, 14, '14 localized labels plus English fallback literal');
  assert.ok(current.length > previous.length, 'R272 adds labels only');
});
}

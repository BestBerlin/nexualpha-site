import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { buildSync } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = fileURLToPath(new URL('../../../r260-final-task-integration/candidate/', import.meta.url));
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const FixedDate = class extends Date { constructor(...args) { super(...(args.length ? args : ['2026-10-05T00:00:00.000Z'])); } static now() { return new Date('2026-10-05T00:00:00.000Z').getTime(); } };

function read(projectRoot, file) {
  return fs.readFileSync(path.join(projectRoot, file), 'utf8');
}

function loadTelegram(projectRoot) {
  const code = buildSync({
    stdin: {
      contents: "export { TelegramBotHub } from './src/components/v3/TelegramBotHub.jsx';",
      resolveDir: projectRoot,
      loader: 'jsx',
    },
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

function hrefs(html) {
  return [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
}

function telegramHrefs(html) {
  return hrefs(html).filter((href) => href.includes('t.me/'));
}

function attr(html, re) {
  const found = html.match(re);
  assert.ok(found, `missing attr match ${re}`);
  return found[1];
}

const localeExpectations = {
  fr: {
    badge: 'CANAL OFFICIEL',
    group: 'Communauté de traders NexuAlpha',
    desc: 'Discutez des conditions des plateformes, des définitions de frais et des vérifications de liens officiels',
    channel: 'Le canal publie des recherches sourcées, des comparaisons et des notes de sécurité',
    aria: 'Actions Telegram principales',
  },
  de: {
    badge: 'OFFIZIELLER KANAL',
    group: 'NexuAlpha-Trader-Community',
    desc: 'Besprechen Sie Plattformbedingungen, Gebührendefinitionen und Prüfungen offizieller Links',
    channel: 'Der Kanal veröffentlicht quellenbasierte Recherchen, Vergleiche und Sicherheitshinweise',
    aria: 'Primäre Telegram-Aktionen',
  },
  ru: {
    badge: 'ОФИЦИАЛЬНЫЙ КАНАЛ',
    group: 'Сообщество трейдеров NexuAlpha',
    desc: 'Обсуждайте условия платформ, определения комиссий и проверку официальных ссылок',
    channel: 'Канал публикует исследования с источниками, сравнения и заметки по безопасности',
    aria: 'Основные действия Telegram',
  },
  ar: {
    badge: 'القناة الرسمية',
    group: 'مجتمع متداولي NexuAlpha',
    desc: 'ناقش شروط المنصات وتعريفات الرسوم وفحص الروابط الرسمية',
    channel: 'تنشر القناة أبحاثاً موثقة بالمصادر ومقارنات وملاحظات أمان',
    aria: 'إجراءات Telegram الأساسية',
  },
  id: {
    badge: 'KANAL RESMI',
    group: 'Komunitas trader NexuAlpha',
    desc: 'Diskusikan kondisi platform, definisi biaya, dan pemeriksaan tautan resmi',
    channel: 'Kanal menerbitkan riset bersumber, perbandingan, dan catatan keamanan',
    aria: 'Aksi utama Telegram',
  },
  vi: {
    badge: 'KÊNH CHÍNH THỨC',
    group: 'Cộng đồng nhà giao dịch NexuAlpha',
    desc: 'Thảo luận điều kiện nền tảng, định nghĩa phí và kiểm tra liên kết chính thức',
    channel: 'Kênh đăng nghiên cứu có nguồn, so sánh và ghi chú bảo mật',
    aria: 'Hành động Telegram chính',
  },
  it: {
    badge: 'CANALE UFFICIALE',
    group: 'Community di trader NexuAlpha',
    desc: 'Discuti condizioni delle piattaforme, definizioni delle commissioni e verifiche dei link ufficiali',
    channel: 'Il canale pubblica ricerche con fonti, confronti e note di sicurezza',
    aria: 'Azioni Telegram principali',
  },
};

test('R267 localizes owned Telegram community and broadcast copy for all fallback locales', () => {
  for (const [locale, expected] of Object.entries(localeExpectations)) {
    const html = render(root, locale);
    assert.ok(html.includes(expected.badge), `${locale} badge native`);
    assert.ok(html.includes(expected.group), `${locale} group title native`);
    assert.ok(html.includes(expected.desc), `${locale} group desc native`);
    assert.ok(html.includes(expected.channel), `${locale} channel desc native`);
    assert.ok(html.includes(expected.aria), `${locale} quick CTA group aria native`);
    assert.equal(html.includes('NexuAlpha Trader Community'), false, `${locale} no English group fallback`);
    assert.equal(html.includes('Discuss platform conditions'), false, `${locale} no English group desc fallback`);
    assert.equal(html.includes('The channel publishes sourced research'), false, `${locale} no English channel desc fallback`);
    assert.equal(html.includes('aria-label="Primary Telegram actions"'), false, `${locale} no English quick CTA aria fallback`);
    assert.ok(html.includes('@NexuAlphaAssistantBot'), `${locale} official bot handle remains brand text`);
  }
});

test('R267 keeps every Telegram href and start payload ordered for all affected locales', () => {
  for (const locale of Object.keys(localeExpectations)) {
    assert.deepEqual(telegramHrefs(render(root, locale)), telegramHrefs(render(base, locale)), `${locale} Telegram hrefs ordered unchanged`);
  }
});

test('R267 keeps Telegram context data attributes and onsite href order unchanged for Arabic', () => {
  const next = render(root, 'ar');
  const prev = render(base, 'ar');
  assert.deepEqual(hrefs(next), hrefs(prev), 'all hrefs ordered unchanged for AR');
  for (const key of ['data-telegram-return-status', 'data-telegram-return-href', 'data-cta-placement', 'data-growth-placement']) {
    const re = new RegExp(`${key}="([^"]*)"`, 'g');
    assert.deepEqual([...next.matchAll(re)].map((m) => m[1]), [...prev.matchAll(re)].map((m) => m[1]), `${key} ordered unchanged`);
  }
});

test('R267 scopes mobile CSS to Telegram CTA and broadcast layout without clamping or global button changes', () => {
  const css = read(root, 'src/components/v3/telegram-bot-hub.css');
  const baseCss = read(base, 'src/components/v3/telegram-bot-hub.css');
  assert.match(css, /@media \(max-width: 480px\) \{[\s\S]*\.tg-cta-left,[\s\S]*\.tg-broadcast-content,[\s\S]*\.tg-broadcast-actions[\s\S]*min-width: 0;/);
  assert.match(css, /\.tg-bot-handle \{[\s\S]*overflow-wrap: anywhere;[\s\S]*word-break: break-word;/);
  assert.match(css, /\.tg-cta-buttons \.tg-btn,[\s\S]*\.tg-broadcast-actions \.tg-btn--ghost[\s\S]*white-space: normal;/);
  assert.equal(css.includes('line-clamp'), baseCss.includes('line-clamp'), 'does not introduce clamp');
  assert.equal(css.includes('text-overflow: ellipsis'), baseCss.includes('text-overflow: ellipsis'), 'does not introduce ellipsis');
  assert.ok(baseCss.includes('.tg-btn {\n  display: inline-flex;'));
  assert.ok(css.includes('.tg-btn {\n  display: inline-flex;'));
});

test('R267 protects non-target source files and partner registry hash', () => {
  const protectedFiles = [
    'src/data/partner-registry.js',
    'src/data/telegram-config.js',
    'src/data/telegram-decision-return.js',
    'src/data/generated-tg-broadcast-feed.json',
  ];
  for (const file of protectedFiles) assert.equal(read(root, file), read(base, file), `${file} unchanged`);
});

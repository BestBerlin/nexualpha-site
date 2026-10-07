import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { localizedHref } from '../src/data/locale-routing.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const localizedRights = {
  ja: 'すべての権利を留保します。', ko: '모든 권리 보유.', ar: 'جميع الحقوق محفوظة.',
  id: 'Hak cipta dilindungi.', vi: 'Bảo lưu mọi quyền.',
};
const expected = {
  en: ['Topic Guides', 'Factbook'],
  'zh-Hans': ['主题指南', '事实库'], 'zh-Hant': ['主題指南', '事實庫'],
  'zh-CN': ['主题指南', '事实库'], 'zh-TW': ['主題指南', '事實庫'],
  es: ['Guías temáticas', 'Ficha de fuentes'], 'pt-BR': ['Guias temáticos', 'Ficha de fontes'],
  fr: ['Guides thématiques', 'Fiche des sources'], de: ['Themen-Guides', 'Quellen-Factbook'],
  ja: ['トピックガイド', '出典ファクトブック'], ko: ['주제 가이드', '출처 팩트북'],
  ar: ['أدلة المواضيع', 'سجل المصادر'], tr: ['Konu Rehberleri', 'Kaynak inceleme bilgi kitabı'],
  ru: ['Тематические гиды', 'Досье источников'], id: ['Panduan topik', 'Factbook sumber'],
  vi: ['Hướng dẫn chủ đề', 'Hồ sơ nguồn'], it: ['Guide tematiche', 'Factbook delle fonti'],
};

test('shared footer renders localized topic and factbook labels without changing locale destinations', async () => {
  const temp = await mkdtemp(path.join(root, 'tests/.tmp-footer-'));
  try {
    const entry = path.join(temp, 'entry.mjs');
    const bundle = path.join(temp, 'bundle.cjs');
    await writeFile(entry, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { CleanFooter } from '../../src/components/v3/CleanFooter.jsx';
      const locales = ${JSON.stringify(Object.keys(expected))};
      console.log(JSON.stringify(Object.fromEntries(locales.map(locale => [locale,
        renderToStaticMarkup(React.createElement(CleanFooter, { locale }))]))));
    `);
    execFileSync(path.join(root, 'node_modules/.bin/esbuild'), [entry, '--bundle', '--platform=node',
      '--format=cjs', '--loader:.css=empty', '--log-level=warning', `--outfile=${bundle}`], { cwd: root });
    const rendered = JSON.parse(execFileSync('node', [bundle], { cwd: root, encoding: 'utf8' }));
    for (const [locale, [topics, factbook]] of Object.entries(expected)) {
      if (localizedRights[locale]) {
        assert.ok(rendered[locale].includes(localizedRights[locale]), `${locale}: copyright localized`);
        assert.ok(!rendered[locale].includes('All rights reserved.'), `${locale}: no copyright English fallback`);
      }
      const nav = rendered[locale].match(/<nav\b[^>]*>(.*?)<\/nav>/s)?.[1];
      assert.ok(nav, `${locale}: semantic navigation exists`);
      assert.ok(nav.includes(`<a href="${localizedHref('/topics', { locale })}">${topics}</a>`), `${locale}: topic link`);
      assert.ok(nav.includes(`<a href="${localizedHref('/factbook', { locale })}">${factbook}</a>`), `${locale}: factbook link`);
      if (locale !== 'en') {
        assert.ok(!nav.includes('>Topic Guides<'), `${locale}: no topic English fallback`);
        assert.ok(!nav.includes('>Factbook<'), `${locale}: no standalone factbook English fallback`);
      }
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

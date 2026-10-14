import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { localizedHref } from '../src/data/locale-routing.js';
import { homePartnersFor, homePushFor } from '../src/data/home-rebate-tiers.js';
import { PARTNER_EXCHANGE_PAGE_SLUGS, partnerExchangePageLinks } from '../src/data/partner-page-links.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const localizedRights = {
  ja: 'すべての権利を留保します。', ko: '모든 권리 보유.', ar: 'جميع الحقوق محفوظة.',
  id: 'Hak cipta dilindungi.', vi: 'Bảo lưu mọi quyền.',
};
const expected = {
  en: ['Topic guides', 'Factbook'],
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
      assert.ok(rendered[locale].includes('© 2026 NexuAlpha'), `${locale}: compact copyright`);
      assert.ok(!rendered[locale].includes('All rights reserved.'), `${locale}: no old rights sentence`);
      if (localizedRights[locale]) assert.ok(!rendered[locale].includes(localizedRights[locale]), `${locale}: old rights sentence removed`);
      const nav = rendered[locale].match(/<nav\b[^>]*>(.*?)<\/nav>/s)?.[1];
      assert.ok(nav, `${locale}: semantic navigation exists`);
      assert.ok(nav.includes(`<a href="${localizedHref('/topics', { locale })}">${topics}</a>`), `${locale}: topic link`);
      assert.ok(nav.includes(`<a href="${localizedHref('/factbook', { locale })}">${factbook}</a>`), `${locale}: factbook link`);
      assert.equal((rendered[locale].match(/class="clean-footer__column"/g) || []).length, 4, `${locale}: four desktop columns`);
      assert.equal((rendered[locale].match(/class="clean-footer__mobile-column"/g) || []).length, 4, `${locale}: four mobile disclosure rows`);
      assert.doesNotMatch(rendered[locale], /nx-ftr-policy-details|clean-footer__policies|关于我们与政策|About & policies/, `${locale}: no policy accordion`);
      for (const section of rendered[locale].matchAll(/<section class="clean-footer__column"[\s\S]*?<\/section>/g)) {
        assert.ok((section[0].match(/<li>/g) || []).length <= 6, `${locale}: column has at most six links`);
      }
      if (locale === 'en') {
        const bitget = rendered[locale].indexOf('/exchanges/bitget#registration-path');
        const okx = rendered[locale].indexOf('/exchanges/okx#registration-path');
        const binance = rendered[locale].indexOf('/exchanges/binance#registration-path');
        assert.ok(bitget > 0 && bitget < okx && okx < binance, `${locale}: referral codes follow shared venue priority`);
      }
      if (locale === 'tr') {
        assert.ok(!rendered[locale].includes('/tr/exchanges/bitget'), `${locale}: no Bitget link`);
        assert.ok(!rendered[locale].includes('/tr/exchanges/coinw'), `${locale}: no CoinW link`);
        assert.ok(rendered[locale].indexOf('/tr/exchanges/okx') < rendered[locale].indexOf('/tr/exchanges/binance'), `${locale}: Turkish referral links start with OKX`);
      }
      if (locale !== 'en') {
        assert.ok(!nav.includes('>Topic Guides<'), `${locale}: no topic English fallback`);
        assert.ok(!nav.includes('>Factbook<'), `${locale}: no standalone factbook English fallback`);
      }
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('shared footer renders partner exchange page links without code wording in neutral locales', async () => {
  const temp = await mkdtemp(path.join(root, 'tests/.tmp-footer-partners-'));
  try {
    const entry = path.join(temp, 'entry.mjs');
    const bundle = path.join(temp, 'bundle.cjs');
    await writeFile(entry, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { CleanFooter } from '../../src/components/v3/CleanFooter.jsx';
      const locales = ['en', 'tr', 'ru', 'zh-Hant', 'vi'];
      const rendered = Object.fromEntries(locales.map(locale => [locale,
        renderToStaticMarkup(React.createElement(CleanFooter, { locale }))]));
      rendered['en@TR'] = renderToStaticMarkup(React.createElement(CleanFooter, { locale: 'en', market: 'TR' }));
      rendered['en@VN'] = renderToStaticMarkup(React.createElement(CleanFooter, { locale: 'en', market: 'VN' }));
      rendered['tr@SG'] = renderToStaticMarkup(React.createElement(CleanFooter, { locale: 'tr', market: 'SG' }));
      rendered['tr@VN'] = renderToStaticMarkup(React.createElement(CleanFooter, { locale: 'tr', market: 'VN' }));
      console.log(JSON.stringify(rendered));
    `);
    execFileSync(path.join(root, 'node_modules/.bin/esbuild'), [entry, '--bundle', '--platform=node',
      '--format=cjs', '--loader:.css=empty', '--log-level=warning', `--outfile=${bundle}`], { cwd: root });
    const rendered = JSON.parse(execFileSync('node', [bundle], { cwd: root, encoding: 'utf8' }));
    for (const key of Object.keys(rendered)) {
      const [locale, market] = key.split('@');
      const section = rendered[key].match(/<nav\b[^>]*data-footer-partner-links[^>]*>[\s\S]*?<\/nav>/)?.[0] || '';
      if (['ru', 'zh-Hant', 'vi'].includes(locale) || market === 'VN') {
        assert.equal(section, '', `${key}: neutral locales hide the partner chip row`);
      } else {
        const expectedSlugs = [...new Set([...homePushFor(locale, market), ...homePartnersFor(locale, market)])].slice(0, 6);
        assert.equal((section.match(/data-footer-partner-link=/g) || []).length, expectedSlugs.length, key);
        for (const slug of expectedSlugs) assert.ok(section.includes(`href="${localizedHref(`/exchanges/${slug}#registration-path`, { locale })}"`), `${key}: ${slug}`);
        assert.ok(expectedSlugs.length <= 6, `${key}: six partner chips max`);
        if (key === 'en') assert.match(section, /Referral codes/);
        assert.match(section, /#registration-path/);
      }
      if (locale === 'tr' || market === 'TR') {
        assert.doesNotMatch(section, /exchanges\/bitget|exchanges\/coinw/, `${key}: no Bitget or CoinW link on Türkiye pages`);
        if (section) assert.ok(section.indexOf('exchanges/okx') < section.indexOf('exchanges/binance'), `${key}: OKX before Binance`);
      }
    }
    assert.ok(rendered.en.indexOf('exchanges/bitget') < rendered.en.indexOf('exchanges/okx'), 'en: Bitget first, then OKX');
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});


test('partner page link group covers every published real partner including Hyperliquid', async () => {
  const { buildPartnersFeed } = await import('../src/data/partners-feed.js');
  const { partnerExchangePageLinks } = await import('../src/data/partner-page-links.js');
  const expected = buildPartnersFeed().partners.map(partner => partner.slug).sort();
  for (const locale of ['en', 'ru', 'zh-Hant', 'vi']) {
    assert.deepEqual(partnerExchangePageLinks(locale).map(link => link.slug).sort(), expected, locale);
  }
  for (const link of partnerExchangePageLinks('en', { market: 'VN' })) {
    assert.equal(link.code, null);
    assert.doesNotMatch(link.label, /referral|code/i);
    assert.doesNotMatch(link.href, /registration-path/);
  }
});

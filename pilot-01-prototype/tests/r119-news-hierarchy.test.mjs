import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { contextualHref } from '../src/data/contextual-href.js';

const requireWorkspace = createRequire(new URL('../../../../pilot-01-prototype/package.json', import.meta.url));
const React = requireWorkspace('react');
const { renderToStaticMarkup } = requireWorkspace('react-dom/server');
const { transformSync } = requireWorkspace('esbuild');
const locales = ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'es', 'pt-BR', 'fr', 'de', 'tr', 'ru', 'ar', 'id', 'vi', 'it'];
const platforms = ['binance', 'okx', 'bybit', 'bitget', 'kraken', 'backpack'];
const article = { slug: 'fixture', content: Object.fromEntries(locales.map(locale => [locale, 'Preserved article body.'])), title: 'Fixture', categoryName: 'Research', publishedAt: '2026-10-05', readTime: '2 min', author: 'Fixture', sources: [] };
const venueDatabase = Object.fromEntries(platforms.map(slug => [slug, { name: slug, officialDomain: `www.${slug}.com` }]));
const mocks = {
  getNewsArticleBySlug: () => article, venueDatabase, OKX_USD_USDC_OWNER_CHECKLIST: { slug: 'other' },
  resolveNewsContentLocale: locale => locale,
  localizedValue: (value, locale) => typeof value === 'object' ? value[locale] || value.en : value,
  localizedNewsTitle: () => 'Fixture', localizedNewsSummary: () => 'Fixture summary', contextualHref,
  BrandMark: () => React.createElement('span', { 'aria-hidden': true }),
  NextDecisionBridge: () => null, OnsiteTelegramBotHandoff: props => React.createElement('a', { 'data-test-bot-handoff': true, href: props.returnRoute }, 'Continue research'), TopDecisionBox: () => null
};
const source = readFileSync(new URL('../src/components/v3/news/NewsDetailPage.jsx', import.meta.url), 'utf8');
const compiled = transformSync(`${source}\nexport { copy };`, { loader: 'jsx', format: 'cjs' }).code;
const module = { exports: {} };
vm.runInNewContext(compiled, { module, exports: module.exports, require: name => name === 'react' ? React : mocks });
const decode = value => value.replaceAll('&amp;', '&');

for (const count of [1, 2, 6]) {
  test(`${count} platform contexts preserve every research route and text in 15 locales`, () => {
    article.relatedVenues = platforms.slice(0, count);
    for (const locale of locales) {
      const context = { locale, market: 'BR', product: 'spot' };
      const html = renderToStaticMarkup(React.createElement(module.exports.NewsDetailPage, { slug: article.slug, initialArticles: [article], ...context }));
      const region = html.match(/<aside class="news-detail__partners-box">([\s\S]*?)<\/aside>/)?.[1];
      assert.ok(region);
      const links = [...region.matchAll(/<a[^>]*href="([^"]*)"[^>]*class="news-partner-card"[^>]*>([\s\S]*?)<\/a>/g)];
      assert.equal(links.length, count);
      for (let index = 0; index < count; index++) {
        const slug = platforms[index];
        assert.equal(decode(links[index][1]), contextualHref(`/exchanges/${slug}#registration-path`, context));
        assert.ok(links[index][2].includes(`www.${slug}.com`));
        assert.ok(links[index][2].includes(module.exports.copy[locale].verifiedDomain));
        assert.ok(links[index][2].includes(module.exports.copy[locale].claimBtn));
        assert.ok(!links[index][2].includes('<a '), 'one research link per context, no nested anchors');
      }
      assert.equal([...region.matchAll(/data-cta-kind="research"/g)].length, count);
      assert.ok(html.includes('Preserved article body.'));
      assert.ok(!region.includes('data-cta-kind="register"'));
    }
  });
}

test('article lead appears before the Telegram follow-up in every locale', () => {
  for (const locale of locales) {
    const html = renderToStaticMarkup(React.createElement(module.exports.NewsDetailPage, { slug: article.slug, initialArticles: [article], locale }));
    assert.ok(html.indexOf('Preserved article body.') >= 0);
    assert.ok(html.indexOf('Preserved article body.') < html.indexOf('data-test-bot-handoff'));
    assert.ok(html.includes('href="/news/fixture"'));
  }
});

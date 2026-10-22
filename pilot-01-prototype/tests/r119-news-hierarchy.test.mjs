import { venueDatabase as currentVenues } from '../src/data/venue-database.js';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { contextualHref } from '../src/data/contextual-href.js';

const requireWorkspace = createRequire(new URL('../package.json', import.meta.url));
const React = requireWorkspace('react');
const { renderToStaticMarkup } = requireWorkspace('react-dom/server');
const { buildSync } = requireWorkspace('esbuild');
const locales = ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'es', 'pt-BR', 'fr', 'de', 'tr', 'ru', 'ar', 'id', 'vi', 'it'];
const platforms = ['binance', 'okx', 'bybit', 'bitget', 'kraken', 'backpack'];
const article = { slug: 'fixture', content: Object.fromEntries(locales.map(locale => [locale, 'Preserved article body.'])), title: 'Fixture', categoryName: 'Research', publishedAt: '2026-10-05', readTime: '2 min', author: 'Fixture', sources: [] };
const source = readFileSync(new URL('../src/components/v3/news/NewsDetailPage.jsx', import.meta.url), 'utf8');
const compiled = buildSync({stdin:{contents:`${source}\nexport { copy };`,resolveDir:fileURLToPath(new URL('../src/components/v3/news',import.meta.url)),loader:'jsx'},bundle:true,platform:'node',format:'cjs',write:false,external:['react'],loader:{'.css':'empty'}}).outputFiles[0].text;
const module = { exports: {} };
vm.runInNewContext(compiled, { module, exports: module.exports, require: requireWorkspace, URL, URLSearchParams, Intl, setTimeout, clearTimeout });
const decode = value => value.replaceAll('&amp;', '&');

for (const count of [1, 2, 6]) {
  test(`${count} platform contexts preserve every research route and text in 15 locales`, () => {
    article.relatedVenues = platforms.slice(0, count);
    for (const locale of locales) {
      const expectedSlugs=platforms.slice(0,count).filter(slug=>!(locale==='tr'&&slug==='bitget'));
      const context = { locale, market: 'BR', product: 'spot' };
      const html = renderToStaticMarkup(React.createElement(module.exports.NewsDetailPage, { slug: article.slug, initialArticles: [article], ...context }));
      const region = html.match(/<aside class="news-detail__partners-box">([\s\S]*?)<\/aside>/)?.[1];
      assert.ok(region);
      const links = [...region.matchAll(/<a[^>]*href="([^"]*)"[^>]*class="news-partner-card"[^>]*>([\s\S]*?)<\/a>/g)];
      assert.equal(links.length, expectedSlugs.length);
      for (let index = 0; index < expectedSlugs.length; index++) {
        const slug = expectedSlugs[index];
        assert.equal(decode(links[index][1]), contextualHref(`/exchanges/${slug}#registration-path`, context));
        assert.ok(links[index][2].includes(currentVenues[slug].officialDomain));
        assert.ok(links[index][2].includes(module.exports.copy[locale].verifiedDomain));
        assert.ok(links[index][2].includes(module.exports.copy[locale].claimBtn));
        assert.ok(!links[index][2].includes('<a '), 'one research link per context, no nested anchors');
      }
      assert.equal([...region.matchAll(/data-cta-kind="research"/g)].length, expectedSlugs.length);
      assert.ok(html.includes('Preserved article body.'));
      assert.ok(!region.includes('data-cta-kind="register"'));
    }
  });
}

test('article lead appears before the Telegram follow-up in every locale', () => {
  for (const locale of locales) {
    const html = renderToStaticMarkup(React.createElement(module.exports.NewsDetailPage, { slug: article.slug, initialArticles: [article], locale }));
    assert.ok(html.indexOf('Preserved article body.') >= 0);
    assert.ok(html.indexOf('Preserved article body.') < html.indexOf('data-cta-placement="news-onsite-bot-handoff-fixture"'));
    assert.ok(html.includes('/news/fixture'));
  }
});

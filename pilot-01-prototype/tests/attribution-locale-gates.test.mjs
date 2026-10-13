import test from 'node:test';
import assert from 'node:assert/strict';
import { partnerRegistry } from '../src/data/partner-registry.js';
import { publicCtaForVenue, regionalVenueCta, publicCtaForTopicPlatform } from '../src/data/source-bound-cta.js';
import { pickNewsOfferVenue } from '../src/data/news-offer.js';
import { DATA_PAGE_SIGNUP_VENUES } from '../src/data/market-data-pages.js';

const neutralLocales = ['ru', 'ar', 'zh-Hant', 'ur', 'uk'];

test('neutral locale projection closes every venue signup even with a promotable explicit market', () => {
  for (const locale of neutralLocales) for (const slug of Object.keys(partnerRegistry)) {
    const cta = publicCtaForVenue(slug, locale, 'BR');
    assert.equal(cta.registrationUrl, null, `${locale}/${slug}`);
    assert.deepEqual(cta.registrationUrls, []);
    assert.equal(cta.hasPartnerRoute, false);
    assert.equal(cta.routeAvailable, false);
    assert.equal(cta.inviteCode, null);
    assert.equal(cta.actionGate.reason, 'neutral-locale-signup-disabled');
    const regional = regionalVenueCta(slug, locale, 'BR', 'spot');
    assert.equal(regional.direct, false);
    assert.equal(regional.registrationUrl, null);
    assert.match(regional.ctaHref, /#source-review(?:\?|$)/);
    const topic = publicCtaForTopicPlatform({ slug, affiliateUrl: '/go/binance', inviteCode: 'stale' }, locale);
    assert.equal(topic.affiliateUrl, null);
    assert.equal(topic.inviteCode, null);
  }
});

test('news, academy and funding/liquidation shared offers are absent on neutral locales', () => {
  for (const locale of neutralLocales) {
    assert.equal(pickNewsOfferVenue(Object.keys(partnerRegistry), locale, 'BR'), null);
    assert.equal(pickNewsOfferVenue(DATA_PAGE_SIGNUP_VENUES, locale), null);
  }
});

test('promotable locale routes and registry destinations remain intact', () => {
  for (const slug of ['binance', 'okx', 'bybit', 'mexc']) {
    assert.equal(publicCtaForVenue(slug, 'en').registrationUrl, partnerRegistry[slug].registrationUrl);
  }
  assert.ok(pickNewsOfferVenue(DATA_PAGE_SIGNUP_VENUES, 'en'));
  assert.equal(publicCtaForVenue('bitget', 'tr').registrationUrl, null);
});

test('Türkiye citation rendering retains labels while blocking Bitget external anchors', async () => {
  const { buildSync } = await import('esbuild');
  const { fileURLToPath } = await import('node:url');
  const { createRequire } = await import('node:module');
  const { runInNewContext } = await import('node:vm');
  const require = createRequire(import.meta.url);
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const module = { exports: {} };
  const bundle = buildSync({ entryPoints: [fileURLToPath(new URL('../src/components/shared/SourceLink.jsx', import.meta.url))], bundle: true, write: false, format: 'cjs', platform: 'node', external: ['react'], loader: { '.jsx': 'jsx' } });
  runInNewContext(bundle.outputFiles[0].text, { module, exports: module.exports, require, URL, URLSearchParams });
  const { SourceLink } = module.exports;
  const render = (href, locale) => renderToStaticMarkup(React.createElement(SourceLink, { href, locale, target: '_blank', rel: 'noopener noreferrer', className: 'citation' }, 'Official source'));
  // Türkiye: every Bitget source is a plain label (title + domain), never a link.
  for (const href of ['https://www.bitget.com/support/articles/123', 'https://api.bitget.com/api/v2/test', 'https://partner.bitget.cafe/bg/C6PRAF']) {
    assert.match(render(href, 'tr'), /^<span class="citation"[^>]*>Official source<span class="source-plain__domain"> · [a-z.]*bitget\.[a-z]+<\/span><\/span>$/);
  }
  // Owner 2026-10-13: Bitget has no sitewide referral parameter, so its help pages are plain text everywhere; the
  // registry sign-up link (with the code) stays a link.
  assert.doesNotMatch(render('https://www.bitget.com/support/articles/123', 'en'), /<a /);
  const registryLink = render('https://partner.bitget.cafe/bg/C6PRAF', 'en');
  assert.match(registryLink, /<a [^>]*href="https:\/\/partner\.bitget\.cafe\/bg\/C6PRAF"/);
  assert.match(registryLink, /rel="noopener noreferrer nofollow sponsored"/);
  // Binance pages carry the code through /go/binance-page in Türkiye; non-exchange links are unchanged.
  assert.match(render('https://www.binance.com/en/fee/trading', 'tr'), /<a [^>]*href="\/go\/binance-page\?to=%2Fen%2Ffee%2Ftrading"/);
  for (const href of ['/tr/exchanges/bitget#platform-facts', 'https://bitget.com.evil.test/source']) {
    assert.match(render(href, 'tr'), /<a href=/);
  }
  // Neutral locales: exchange sources are plain text.
  assert.doesNotMatch(render('https://www.binance.com/en/fee/trading', 'ru'), /<a /);
});

test('actual Turkish home, activities, venue and comparison SSR retain facts without external Bitget links', async () => {
  const { createServer } = await import('vite');
  const { parse } = await import('parse5');
  const root = new URL('..', import.meta.url).pathname;
  const server = await createServer({ root: decodeURIComponent(root), optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
  try {
    const { render } = await server.ssrLoadModule('/src/entry-server.jsx');
    for (const path of ['/tr/', '/tr/activities', '/tr/exchanges/bitget', '/tr/compare/bitget-vs-mexc', '/tr/compare/bybit-vs-bitget']) {
      const html = await render(path);
      assert.match(html, /<h1\b/, `${path} renders a complete page`);
      assert.match(html, /Bitget/, `${path} retains informational venue labels`);
      const failures = [];
      const walk = node => {
        if (node.tagName === 'a') {
          const href = node.attrs.find(attr => attr.name === 'href')?.value;
          if (href) {
            let host = '';
            try { host = new URL(href).hostname; } catch { /* Internal facts links remain allowed. */ }
            if (/(?:^|\.)(?:bitget\.com|bitget\.cafe)$/.test(host)) failures.push(href);
          }
        }
        for (const child of node.childNodes || []) walk(child);
      };
      walk(parse(html));
      assert.deepEqual(failures, [], `${path} external Bitget links`);
    }
  } finally { await server.close(); }
});

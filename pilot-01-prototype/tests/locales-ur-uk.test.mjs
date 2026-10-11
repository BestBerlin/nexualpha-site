import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import worker, { routeMetadata, renderLocaleSitemap } from '../worker/index.js';
import { LOCALE_PREFIX_BY_CODE, localizedPath, parsePublicRoute, legacyLocaleRedirect } from '../src/data/locale-routing.js';
import { PRERENDER_LOCALES, INDEXABLE_LOCALES } from '../scripts/generate-prerender-manifest.mjs';
import { referralSeoFor, referralTitleAllowed } from '../src/data/referral-seo.js';
import { platformCount } from '../src/data/plural-copy.js';

const paths = ['/', '/exchanges', '/exchanges/okx', '/news', '/about'];
const shell = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const assets = { fetch: async request => {
  const path = new URL(request.url).pathname;
  if (path === '/prerender-manifest.json') return Response.json({ version: 'nexualpha-prerender-v1', routes: {} });
  if (path === '/index.html') return new Response(shell, { headers: { 'content-type': 'text/html' } });
  return new Response('missing', { status: 404 });
}};

test('17 UI locales use collision-free, round-trip public routes', () => {
  assert.equal(Object.keys(LOCALE_PREFIX_BY_CODE).length, 17);
  assert.equal(LOCALE_PREFIX_BY_CODE.uk, 'uk-ua');
  assert.equal(parsePublicRoute('/uk').locale, 'en');
  assert.equal(parsePublicRoute('/uk').isCountryRoute, true);
  for (const locale of ['ur', 'uk']) for (const path of paths) {
    const publicPath = localizedPath(path, locale);
    const route = parsePublicRoute(publicPath);
    assert.equal(route.locale, locale, publicPath);
    assert.equal(route.contentPathname, path, publicPath);
    assert.equal(legacyLocaleRedirect(new URL(`https://nexualpha.com${path}?locale=${locale}`)), publicPath);
    assert.ok(PRERENDER_LOCALES.includes(locale));
    assert.ok(!INDEXABLE_LOCALES.includes(locale));
  }
});

test('native-review locales are noindex and absent from sitemap and hreflang clusters', async () => {
  const sitemap = await renderLocaleSitemap({});
  assert.doesNotMatch(sitemap, /https:\/\/nexualpha\.com\/(?:ur|uk-ua)(?:[<\/])/);
  for (const locale of ['ur', 'uk']) for (const path of paths) {
    const metadata = await routeMetadata(new URL(`https://nexualpha.com${localizedPath(path, locale)}`), {});
    assert.equal(metadata.robots, 'noindex,follow', `${locale}${path}`);
    assert.equal(metadata.canonical, `https://nexualpha.com${localizedPath(path, locale)}`);
    assert.deepEqual(metadata.alternates, [], `${locale}${path}`);
  }
  const en = await routeMetadata(new URL('https://nexualpha.com/'), {});
  const ar = await routeMetadata(new URL('https://nexualpha.com/ar'), {});
  assert.deepEqual(en.alternates, ar.alternates, 'existing indexable home alternates remain reciprocal');
  assert.ok(!en.alternates.some(a => ['ur', 'uk'].includes(a.locale || a.hreflang)));
});

test('Urdu shell is RTL with the local Arabic fallback; Ukrainian is LTR', async () => {
  for (const locale of ['ur', 'uk']) for (const path of paths) {
    const href = localizedPath(path, locale);
    const response = await worker.fetch(new Request(`https://nexualpha.com${href}`, { headers: { accept: 'text/html' } }), { ASSETS: assets });
    assert.equal(response.status, 200, href);
    const html = await response.text();
    assert.match(html, new RegExp(`<html[^>]*lang="${locale}"[^>]*dir="${locale === 'ur' ? 'rtl' : 'ltr'}"`), href);
    assert.equal(html.includes('href="/fonts/ar-400.woff2"'), locale === 'ur', href);
  }
});

test('Ukrainian and Urdu counts use their own plural forms', () => {
  assert.equal(platformCount(1, 'uk'), '1 платформа');
  assert.equal(platformCount(2, 'uk'), '2 платформи');
  assert.equal(platformCount(5, 'uk'), '5 платформ');
  assert.equal(platformCount(2, 'ur'), '2 پلیٹ فارم');
});

test('new locales keep partner metadata neutral pending regulator review', async () => {
  for (const locale of ['ur', 'uk']) for (const slug of ['binance', 'okx', 'bitget', 'bybit', 'mexc']) {
    assert.equal(referralTitleAllowed(slug, locale), false);
    assert.equal(referralSeoFor(slug, locale), null);
    const meta = await routeMetadata(new URL(`https://nexualpha.com${localizedPath(`/exchanges/${slug}`, locale)}`), {});
    assert.equal(meta.robots, 'noindex,follow');
    assert.doesNotMatch(meta.title, /referral|invite|cashback|rebate|реферальн|запрошенн|دعوتی|ریفرل/i);
  }
});

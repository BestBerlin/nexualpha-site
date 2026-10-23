import assert from 'node:assert/strict';
import test from 'node:test';
import { BEGINNER_LOCALES, beginnerPath, parseBeginnerPath } from '../src/data/beginner-routes.js';
import { BEGINNER_COPY } from '../src/data/beginner-content-all.js';
import { beginnerChoice, checkBeginnerLink } from '../src/data/beginner.js';
import { beginnerRouteSeo, beginnerSitemapEntries } from '../src/data/beginner-seo.js';
import { beginnerAliasRedirect, LOCALE_PREFIX_BY_CODE, LOCALE_PATH_ALIASES, localizedPath, localizedLanguageHref, parsePublicRoute } from '../src/data/locale-routing.js';
import { NEUTRAL_CTA_LOCALE_LIST } from '../src/data/locale-policy.js';
import { routeMetadata } from '../worker/index.js';
import worker from '../worker/index.js';
import { computeRouteSeo } from '../src/data/seo-injection.js';
import { modulePathsForRoute } from '../src/data/route-module-cache.js';
import { createSsrHarness, SHELL_HTML, decodeEntities, hydrateInJsdom, hydrationErrors } from './helpers/ssr-hydration-harness.mjs';

test('English beginner aliases 301 directly to canonical 200 pages and preserve queries', async () => {
  const assets = { fetch: async () => new Response(SHELL_HTML, { headers: { 'content-type': 'text/html' } }) };
  const prefixes = [...Object.entries(LOCALE_PREFIX_BY_CODE).map(([locale, prefix]) => [prefix || 'en', locale]),
    ...Object.entries(LOCALE_PATH_ALIASES).map(([alias, prefix]) => [alias, Object.keys(LOCALE_PREFIX_BY_CODE).find(code => LOCALE_PREFIX_BY_CODE[code] === prefix)])];
  for (const [prefix, locale] of prefixes) {
    for (const [kind, step] of [['start', null], ['questions', null], ['check', null], ...Array.from({ length: 7 }, (_, i) => ['start', i + 1])]) {
      const alias = `/${prefix}/${kind}${step ? `/${step}` : ''}`;
      const canonical = localizedPath(beginnerPath(kind, locale, step), locale);
      const search = '?market=TR&tag=a%2Fb&tag=two';
      if (alias === canonical) { assert.equal(beginnerAliasRedirect(alias + search), null); continue; }
      for (const method of ['GET', 'HEAD']) {
        const response = await worker.fetch(new Request('https://nexualpha.com' + alias + search, { method }), { ASSETS: assets });
        assert.equal(response.status, 301, alias);
        assert.equal(response.headers.get('location'), 'https://nexualpha.com' + canonical + search, alias);
      }
      const response = await worker.fetch(new Request('https://nexualpha.com' + canonical + search), { ASSETS: assets });
      assert.equal(response.status, 200, canonical);
      assert.equal(beginnerAliasRedirect(canonical + search), null, canonical);
    }
  }
  for (const pathname of ['/tr/start/8', '/tr/start/1/extra', '/tr/questions/1', '/tr/check/2', '/unknown/start']) assert.equal(beginnerAliasRedirect(pathname), null, pathname);
  assert.equal(beginnerAliasRedirect('/tr/start/'), '/tr/basla');
});

test('home doors and footer link directly to localized beginner canonicals in every locale', async () => {
  const harness = await createSsrHarness();
  try {
    for (const locale of BEGINNER_LOCALES) {
      const html = harness.render('https://nexualpha.com' + localizedPath('/', locale));
      const canonical = localizedPath(beginnerPath('start', locale), locale);
      assert.ok(!html.includes('h7-doors'), `${locale}: no two-door strip above the hero (owner 2026-10-14)`);
      assert.ok(html.match(/<footer[\s\S]*?<\/footer>/)?.[0].includes(`href="${canonical}"`), locale);
    }
  } finally { await harness.close(); }
});

test('each locale has 7 actionable steps, 50 distinct answers and localized route round trips', () => {
  assert.equal(BEGINNER_LOCALES.length, 17);
  for (const locale of BEGINNER_LOCALES) {
    const copy = BEGINNER_COPY[locale];
    assert.equal(copy.locale, locale);
    assert.equal(copy.seo.steps.length, 7, locale);
    const seoPages = [copy.seo.start, copy.seo.questions, copy.seo.check, ...copy.seo.steps];
    assert.equal(new Set(seoPages.map(page => page.title)).size, 10, locale);
    for (const page of seoPages) {
      assert.ok(page.title.length > 0 && page.title.length <= 60, `${locale}: ${page.title}`);
      assert.ok(page.description.length > 0 && page.description.length <= 155, `${locale}: ${page.description}`);
    }
    assert.equal(copy.steps.length, 7);
    assert.equal(copy.faqs.length, 50);
    assert.equal(new Set(copy.faqs.map(f => f.q)).size, 50);
    assert.equal(copy.scams.length, 3);
    assert.equal(copy.why.length, 2);
    for (const step of copy.steps) { assert.equal(step.actions.length, 3); assert.equal(step.mistakes.length, 2); assert.ok(step.answer); }
    for (const faq of copy.faqs) { assert.ok(faq.q && faq.a); assert.ok(faq.step >= 1 && faq.step <= 7); }
    for (const kind of ['start', 'questions', 'check']) {
      const path = beginnerPath(kind, locale);
      const publicRoute = parsePublicRoute(localizedPath(path, locale), new URLSearchParams());
      assert.equal(publicRoute.locale, locale);
      assert.deepEqual(parseBeginnerPath(publicRoute.contentPathname, locale), { kind, step: null });
    }
    assert.equal(parseBeginnerPath(`${beginnerPath('start', locale)}/8`, locale).kind, 'missing');
  }
  assert.equal(parseBeginnerPath('/questions/1', 'en').kind, 'missing');
  assert.equal(parseBeginnerPath('/start/1/extra', 'en').kind, 'missing');
  assert.equal(parseBeginnerPath('/other', 'en'), null);
});

test('language switching translates beginner slugs and preserves step and country context', () => {
  for (const source of BEGINNER_LOCALES) for (const target of BEGINNER_LOCALES) {
    for (const kind of ['start', 'questions', 'check']) {
      const step = kind === 'start' ? 2 : null;
      const from = `${localizedPath(beginnerPath(kind, source, step), source)}#nxa-context?market=TR`;
      const href = localizedLanguageHref(from, { locale: target });
      assert.equal(href, `${localizedPath(beginnerPath(kind, target, step), target)}#nxa-context?market=TR`);
    }
  }
});

test('country gates and owner ordering select one venue without reopening neutral locales', () => {
  assert.equal(beginnerChoice('en', 'BR').slug, 'bitget');
  assert.equal(beginnerChoice('tr', 'TR').slug, 'okx');
  assert.equal(beginnerChoice('tr', 'BR').slug, 'okx');
  assert.notEqual(beginnerChoice('en', 'FR')?.slug, 'bitget');
  assert.equal(beginnerChoice('en', 'VN'), null);
  for (const locale of NEUTRAL_CTA_LOCALE_LIST) assert.equal(beginnerChoice(locale, 'BR'), null);
  assert.match(beginnerChoice('en', 'BR').href, /^\/go\/bitget\?/);
});

test('link checker accepts only HTTPS exact approved domains and rejects spoofing without network access', () => {
  assert.equal(checkBeginnerLink('https://www.binance.com/').kind, 'valid');
  assert.equal(checkBeginnerLink('https://partner.bitget.com/').kind, 'valid');
  for (const href of ['http://binance.com/', 'https://binance.com@evil.test/', 'https://binance.com.evil.test/', 'https://evil-binance.com/', 'javascript:alert(1)', 'https://127.0.0.1/', 'https://[::1]/', 'https://binance.com:444/', 'https://xn--binance-123.test/']) assert.equal(checkBeginnerLink(href).kind, 'invalid', href);
  assert.equal(checkBeginnerLink('https://example.org/').kind, 'unknown');
});

test('all 170 beginner editions have matching Worker and app metadata, reviewed reciprocal hreflang and 50 visible FAQ answers', async () => {
  const entries = beginnerSitemapEntries(); assert.equal(entries.length, 170);
  assert.equal(new Set(entries.map(e => e.loc)).size, 170);
  for (const entry of entries) {
    assert.equal(beginnerAliasRedirect(entry.loc), null, entry.loc);
    const metadata = await routeMetadata(new URL(entry.loc), {});
    assert.equal(metadata.status, 200, entry.loc);
    const reviewPending = ['ur', 'uk'].includes(entry.locale);
    const alternates = reviewPending ? [] : entry.alternates.filter(alt => !['ur', 'uk'].includes(alt.hreflang));
    assert.equal(metadata.robots, reviewPending ? 'noindex,follow' : 'index,follow', entry.loc);
    assert.equal(metadata.canonical, entry.loc);
    assert.equal(metadata.alternates.length, reviewPending ? 0 : 16);
    assert.deepEqual(metadata.alternates, alternates);
    assert.ok(metadata.title.length <= 60, `${entry.loc}: ${metadata.title}`);
    assert.ok(metadata.description.length <= 155, `${entry.loc}: ${metadata.description}`);
    assert.doesNotMatch(`${metadata.title} ${metadata.description}`, /promotable|official terms|terms apply|subject to|可推广|以.*为准|官方条款|平台条款|以.*為準|官方條款|平台條款/i);
    const app = computeRouteSeo({ url: entry.loc });
    assert.equal(app.canonical, entry.loc);
    assert.equal(app.locale, entry.locale);
    assert.equal(app.robots, metadata.robots, entry.loc);
    assert.deepEqual(app.alternates, alternates);
    const route = parseBeginnerPath(entry.pathname, entry.locale);
    if (route.kind === 'questions') assert.equal(metadata.schema.find(s => s['@type'] === 'FAQPage').mainEntity.length, 50);
    for (const alt of alternates.filter(a => a.hreflang !== 'x-default')) {
      assert.equal(beginnerAliasRedirect(alt.href), null, alt.href);
      const altUrl = new URL(alt.href); const parsed = parsePublicRoute(altUrl.pathname, altUrl.searchParams);
      assert.ok(beginnerRouteSeo(parsed.contentPathname, parsed.locale)?.indexable, alt.href);
    }
  }
  const route = { name: 'beginner' };
  assert.deepEqual(modulePathsForRoute(route, 'https://nexualpha.com/es/empezar'), ['./components/beginner/BeginnerPages.jsx', './data/beginner-copy/es.json']);
});

test('real SSR pages contain the steps and FAQ, neutral bodies have zero commercial routes, and hydration retains content', async () => {
  const harness = await createSsrHarness();
  try {
    const assets = { fetch: async request => new URL(request.url).pathname === '/prerender-manifest.json' ? Response.json({ routes: {} }) : new Response(SHELL_HTML, { headers: { 'content-type': 'text/html' } }) };
    for (const locale of BEGINNER_LOCALES) {
      for (const [kind, step] of [['start', null], ['questions', null], ['check', null], ...Array.from({ length: 7 }, (_, i) => ['start', i + 1])]) {
        const path = localizedPath(beginnerPath(kind, locale, step), locale);
        const url = `https://nexualpha.com${path}?market=${locale === 'tr' ? 'TR' : 'BR'}`;
        const res = await worker.fetch(new Request(url, { headers: { accept: 'text/html' } }), { ASSETS: assets, NEWS_SSR_RENDER: harness.render });
        assert.equal(res.status, 200, path);const html = await res.text();
        assert.match(html, /class="nxb /, path);
        const seo = beginnerRouteSeo(beginnerPath(kind, locale, step), locale);
        const hero = decodeEntities(html.match(/<p class="nxb-lead">([\s\S]*?)<\/p>/)?.[1] || '');
        assert.equal(hero, seo.description, path);
        if (kind !== 'questions') assert.match(html, /class="nxb-country"/, path);
        if (kind === 'questions') assert.equal((html.match(/id="q-\d+"/g) || []).length, 50, path);
        const body = html.match(/<main class="nxb[\s\S]*?<\/main>/)?.[0] || '';
        if (NEUTRAL_CTA_LOCALE_LIST.includes(locale)) { assert.doesNotMatch(body, /href="\/go\//, path); assert.doesNotMatch(body, /<code>/, path); }
        if (kind === 'start' && step === 2 && !NEUTRAL_CTA_LOCALE_LIST.includes(locale)) assert.match(body, /href="\/go\/(bitget|okx)\?/, path);
      }
    }
    assert.match(harness.render('https://nexualpha.com/ar/funding-rates'), /href="\/ar\/glossary\/funding-rate"/, 'Neutral glossary handoffs preserve the current locale');
    const url = 'https://nexualpha.com/start/2?market=BR';
    const response = await worker.fetch(new Request(url, { headers: { accept: 'text/html' } }), { ASSETS: assets, NEWS_SSR_RENDER: harness.render });
    const html = await response.text();
    const hydration = await hydrateInJsdom(harness.vite, html, url, { timeoutMs: 800 });
    assert.deepEqual(hydrationErrors(hydration.errors), []);
    const fragmentUrl = 'https://nexualpha.com/start/2#nxa-context?market=TR';
    const fragmentResponse = await worker.fetch(new Request('https://nexualpha.com/start/2', { headers: { accept: 'text/html' } }), { ASSETS: assets, NEWS_SSR_RENDER: harness.render });
    const fragmentHydration = await hydrateInJsdom(harness.vite, await fragmentResponse.text(), fragmentUrl, { browserUrlAsWindowUrl: true, timeoutMs: 800,
      inspect: window => ({ country: window.document.querySelector('main.nxb select')?.value, href: window.document.querySelector('main.nxb a[data-cta-kind="registration"]')?.getAttribute('href') }) });
    assert.deepEqual(hydrationErrors(fragmentHydration.errors), []);
    assert.equal(fragmentHydration.inspected.country, 'TR');
    assert.match(fragmentHydration.inspected.href, /^\/go\/okx\?/);
    assert.ok(fragmentHydration.inspected.href.includes('market=TR'));
  } finally { await harness.close(); }
});

test('a temporary beginner SSR failure retains the client shell without exposing a commercial route', async () => {
  const assets = { fetch: async request => new URL(request.url).pathname === '/prerender-manifest.json' ? Response.json({ routes: {} }) : new Response(SHELL_HTML, { headers: { 'content-type': 'text/html' } }) };
  const errors = [];
  const savedError = console.error;
  console.error = (...args) => errors.push(args.join(' '));
  try {
    const response = await worker.fetch(new Request('https://nexualpha.com/start?market=BR', { headers: { accept: 'text/html' } }), { ASSETS: assets, NEWS_SSR_RENDER: () => { throw new Error('SSR unavailable'); } });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /id="root"/);
    assert.doesNotMatch(html, /href="\/go\//);
    assert.ok(errors.some(error => error.includes('SSR unavailable') && error.includes('/start')));
  } finally { console.error = savedError; }
});

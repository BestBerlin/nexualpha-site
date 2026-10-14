import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker, { routeMetadata, renderLocaleSitemap } from '../worker/index.js';
import { computeRouteSeo } from '../src/data/seo-injection.js';
import { LEGAL_PAGE_PATHS, LEGAL_LOCALES, LEGAL_COPY, legalPageSeo } from '../src/data/legal-pages.js';
import { localizedPath } from '../src/data/locale-routing.js';
import { buildSplitSitemaps, routeInventory } from '../scripts/generate-prerender-manifest.mjs';
import { loadSearchPublicationBaseline, sitemapLocalesForRoute, sitemapHreflangAlternates } from '../scripts/sitemap-publication-policy.mjs';
const root = fileURLToPath(new URL('..', import.meta.url));
const origin = 'https://nexualpha.com';

test('legal metadata: six indexable URLs and English canonical for other locales', async () => {
  for (const pathname of LEGAL_PAGE_PATHS) for (const locale of [...LEGAL_LOCALES, 'zh-Hant', 'es', 'ar', 'ur', 'uk']) {
    const url = `${origin}${localizedPath(pathname, locale)}`;
    const expected = legalPageSeo(pathname, locale);
    for (const result of [await routeMetadata(new URL(url), {}), computeRouteSeo({ url, locale })]) {
      assert.equal(result.status, 200, url);
      for (const key of ['canonical', 'locale', 'robots', 'title']) assert.equal(result[key], expected[key], `${url} ${key}`);
      assert.deepEqual(result.alternates, expected.alternates, url);
    }
  }
});

test('legal SSR through worker: 200, headings, canonical, hreflang, footer and external contacts', async () => {
  const temp = await mkdtemp(path.join(root, '.legal-test-'));
  try {
    const entry = path.join(temp, 'entry.jsx');
    const bundle = path.join(temp, 'render.cjs');
    await writeFile(entry, `import React from 'react'; import {renderToString} from 'react-dom/server';
      import {LegalPage} from '../src/components/v3/brand-pages/LegalPage.jsx';
      import {CleanFooter} from '../src/components/v3/CleanFooter.jsx';
      import {parsePublicRoute} from '../src/data/locale-routing.js';
      export function render(url) {const r = parsePublicRoute(new URL(url).pathname); return renderToString(<><LegalPage locale={r.locale} pathname={r.contentPathname}/><CleanFooter locale={r.locale}/></>);}`);
    execFileSync(path.join(root, 'node_modules/.bin/esbuild'), [entry, '--bundle', '--platform=node', '--format=cjs', '--loader:.css=empty', '--log-level=warning', `--outfile=${bundle}`], {cwd: root});
    const {render} = (await import(bundle)).default;
    const shell = '<!doctype html><html lang="en"><head><title>Base</title></head><body><div id="root"></div></body></html>';
    const env = {ASSETS: {fetch: async () => new Response(shell, {headers: {'content-type': 'text/html'}})}, NEWS_SSR_RENDER: render};
    for (const pathname of LEGAL_PAGE_PATHS) for (const locale of [...LEGAL_LOCALES, 'ar']) {
      const url = `${origin}${localizedPath(pathname, locale)}`;
      const response = await worker.fetch(new Request(url, {headers: {accept: 'text/html'}}), env);
      const html = await response.text();
      const meta = legalPageSeo(pathname, locale);
      assert.equal(response.status, 200, url);
      assert.ok(html.includes(`<h1>${LEGAL_COPY[pathname][meta.locale].title}</h1>`), url);
      assert.ok(html.includes(`rel="canonical" href="${meta.canonical}"`), url);
      for (const alt of meta.alternates) assert.ok(html.includes(`hreflang="${alt.hreflang}" href="${alt.href}"`), url);
      for (const target of LEGAL_PAGE_PATHS) assert.ok(html.includes(`href="${localizedPath(target, locale)}"`), `${url} footer ${target}`);
      assert.doesNotMatch(html, /href="#nx-ftr-policy-details"/);
      if (pathname !== '/contact') for (const link of ['https://www.youtube.com/t/terms', 'http://www.google.com/policies/privacy', 'https://security.google.com/settings/security/permissions']) assert.ok(html.includes(link), `${url} ${link}`);
      if (pathname === '/privacy') assert.match(html, /nx_hero/);
      if (pathname === '/contact') for (const handle of ['contact@nexualpha.com', '@NexuAlphaClub', '@NexuAlpha', '@NexuAlphaCN']) assert.ok(html.includes(handle), handle);
    }
  } finally {await rm(temp, {recursive: true, force: true});}
});

test('legal sitemap source, generated inventory and runtime sitemap include only the two published editions', async () => {
  const inventory = routeInventory([]);
  const split = buildSplitSitemaps(inventory, [], { policy: loadSearchPublicationBaseline() });
  const splitLocs = new Set([...split.files.values()].flatMap(({ xml }) => [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])));
  const runtime = await renderLocaleSitemap({});
  for (const pathname of LEGAL_PAGE_PATHS) {
    const route = inventory.find((r) => r.pathname === pathname);
    assert.ok(route?.index, pathname);
    assert.equal(route.template, "legal", pathname);
    assert.deepEqual(sitemapLocalesForRoute(route), [...LEGAL_LOCALES]);
    assert.deepEqual(sitemapHreflangAlternates(pathname), []);
    for (const locale of LEGAL_LOCALES) {
      const loc = `<loc>${origin}${localizedPath(pathname, locale)}</loc>`;
      assert.ok(splitLocs.has(`${origin}${localizedPath(pathname, locale)}`), loc); assert.ok(runtime.includes(loc), loc);
    }
    assert.ok(!runtime.includes(`<loc>${origin}/ar${pathname}</loc>`));
  }
});

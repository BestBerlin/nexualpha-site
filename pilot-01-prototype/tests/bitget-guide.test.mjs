import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { JSDOM } from 'jsdom';
import { createProductionServer } from '../server.mjs';
import { BITGET_GUIDE_PATH, BITGET_GUIDE_LOCALES } from '../src/data/bitget-guide-routes.js';
import { bitgetGuideCopy } from '../src/data/bitget-guide.js';
import { bitgetGuideSeo, bitgetGuideSitemapEntries } from '../src/data/bitget-guide-seo.js';
import { localizedPath } from '../src/data/locale-routing.js';
import { beginnerPath } from '../src/data/beginner-routes.js';
import { partnerRegistry } from '../src/data/partner-registry.js';
import { buildSplitSitemaps } from '../scripts/generate-prerender-manifest.mjs';

test('guide has five editions, one registry code and matching structured data/sitemap', () => {
  assert.equal(partnerRegistry.bitget.inviteCode, 'nexu888');
  const entries = bitgetGuideSitemapEntries();
  assert.equal(entries.length, 5);
  for (const locale of BITGET_GUIDE_LOCALES) {
    const copy = bitgetGuideCopy(locale);
    const seo = bitgetGuideSeo(BITGET_GUIDE_PATH, locale);
    assert.equal(copy.steps.length, 7);
    assert.ok(JSON.stringify(copy).includes(partnerRegistry.bitget.inviteCode));
    assert.deepEqual(seo.alternates.map(a => a.hreflang), [...BITGET_GUIDE_LOCALES, 'x-default']);
    assert.equal(seo.schemas[0].step.length, 7);
    assert.deepEqual(seo.schemas[1].mainEntity.map(q => q.name), copy.faqs.map(f => f.q));
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(seo.schemas)));
    assert.ok(copy.sources.every(s => /^https:\/\/www\.bitget\.com\/support(?:\/|$)/.test(s.url)));
  }
  const xml = buildSplitSitemaps([], []).beginner.xml;
  for (const entry of entries) assert.ok(xml.includes(entry.loc), entry.loc);
  for (const locale of ['tr','ru','ar','zh-Hant','ur','uk','vi','fr','de','it','ko','ja']) {
    assert.equal(bitgetGuideSeo(BITGET_GUIDE_PATH, locale).status, 404);
    assert.ok(!xml.includes(localizedPath(BITGET_GUIDE_PATH, locale)));
  }
});

test('built server renders guides, schemas, one /go CTA and inbound links; excluded locales 404', async () => {
  const server = await createProductionServer({ env: { INTEL_REFRESH: 'off', FX_REFRESH: 'off', BITGET_ALLIANCE_POOL: 'off', KRAKEN_USDG_LIVE: 'off' } });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const locale of BITGET_GUIDE_LOCALES) {
      const path = localizedPath(BITGET_GUIDE_PATH, locale);
      const response = await fetch(origin + path);
      assert.equal(response.status, 200, path);
      const html = await response.text();
      const doc = new JSDOM(html).window.document;
      assert.equal(doc.querySelector('main.nxb h1')?.textContent, bitgetGuideCopy(locale).title);
      assert.equal(doc.querySelectorAll('main.nxb li[id^="step-"]').length, 7);
      const ctas = doc.querySelectorAll('main.nxb a[href^="/go/"]');
      assert.equal(ctas.length, 1);
      assert.equal(ctas[0].getAttribute('href'), '/go/bitget?src=guide');
      if (locale === 'zh-Hans') assert.equal(ctas[0].textContent, '前往 Bitget 官方开户');
      const schemas = [...doc.querySelectorAll('script[type="application/ld+json"]')].flatMap(s => { const value = JSON.parse(s.textContent); return value["@graph"] || value; });
      assert.equal(schemas.filter(s => s['@type'] === 'HowTo').length, 1);
      assert.equal(schemas.filter(s => s['@type'] === 'FAQPage').length, 1);
      for (const entry of [beginnerPath('start', locale, 2), '/exchanges/bitget']) {
        const page = await fetch(origin + localizedPath(entry, locale));
        assert.ok((await page.text()).includes(path), `${locale} ${entry}`);
      }
    }
    for (const locale of ['tr','ru','ar','zh-Hant','ur','uk','vi','fr','de','it','ko','ja']) {
      const response = await fetch(origin + localizedPath(BITGET_GUIDE_PATH, locale), { redirect: 'manual' });
      assert.equal(response.status, 404, locale);
      assert.ok(!(await response.text()).includes('data-cta-placement="bitget-first-trade-guide"'));
    }
    const turkey = await fetch(origin + BITGET_GUIDE_PATH + '?market=TR', { redirect: 'manual' });
    assert.equal(turkey.status, 404);
    const turkeyHtml = await turkey.text();
    assert.match(turkeyHtml, /<h1[^>]*>404<\/h1>/);
    assert.ok(!turkeyHtml.includes('data-cta-placement="bitget-first-trade-guide"'));
    const go = await fetch(origin + '/go/bitget?src=guide', { redirect: 'manual' });
    assert.equal(go.status, 302);
    assert.ok(partnerRegistry.bitget.registrationUrl === go.headers.get('location') || partnerRegistry.bitget.alternateRegistrationUrls.some(url => go.headers.get('location')?.startsWith(url)));
  } finally {
    await new Promise((resolve, reject) => { server.close(error => error ? reject(error) : resolve()); server.closeAllConnections(); });
  }
});

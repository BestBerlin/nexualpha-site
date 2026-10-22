import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { venueAnnouncementPreview, venueSlimmingCopy } from '../src/components/v3/venue-page-slimming.js';

const items = Array.from({length: 26}, (_, i) => ({id: String(i), venue: 'binance', category: 'listing', title: `Binance Will List TEST${i}`, publishedAt: '2026-10-14T00:00:00Z'}));
test('announcement preview bounds the server-rendered collection to five localized titles', () => {
  for (const locale of ['en','zh-Hans','zh-Hant','ja','ko','es','pt-BR','fr','de','tr','vi','id','ru','ar','it','ur','uk']) {
    const preview = venueAnnouncementPreview(items, locale);
    assert.equal(preview.length, 5);
    assert.ok(preview.every(item => item.previewTitle && !item.previewTitle.includes('Will List') || locale === 'en'));
    assert.ok(venueSlimmingCopy(locale).all);
  }
  assert.equal(venueSlimmingCopy('zh-Hans').all, '查看全部');
  assert.equal(venueAnnouncementPreview([{...items[0], headlines: {'zh-Hans': '币安上线测试币'}}], 'zh-Hans')[0].previewTitle, '币安上线测试币');
  assert.doesNotMatch(venueAnnouncementPreview([{...items[0], title: 'A complicated English notice', category:'product'}], 'ja')[0].previewTitle, /complicated|English/);
});
test('secondary disclosures preserve server content and protected component calls', async () => {
  const source = await readFile(new URL('../src/components/v3/VenueDetailPage.jsx', import.meta.url), 'utf8');
  assert.match(source, /venueAnnouncementPreview\(updates, locale\)/);
  assert.match(source, /<VenueSectionDisclosure label=\{slimmingUi.facts\}>[\s\S]*<ExchangeLicenseSection[\s\S]*<ExchangeKeyFacts[\s\S]*<ExchangeFactsV5[\s\S]*<\/VenueSectionDisclosure>/);
  assert.match(source, /<VenueSectionDisclosure label=\{slimmingUi.questions\}>[\s\S]*<VenueFaqSection/);
  assert.match(source, /<VenueTokenizedStocks slug=\{profile.slug\} locale=\{locale\} market=\{effectiveMarket\} \/>/);
  assert.match(source, /<ExchangeFiatSection slug=\{profile.slug\} locale=\{locale\} market=\{effectiveMarket\} \/>/);
  const component = await readFile(new URL('../src/components/v3/VenueSectionDisclosure.jsx', import.meta.url), 'utf8');
  assert.match(component, /<details/);
  assert.doesNotMatch(component, /open=|useState|useEffect/);
  assert.match(component, /\{children\}/);
});

test('real venue SSR includes five localized notices, visible research links and closed secondary section bodies', async () => {
  const { createSsrHarness } = await import('./helpers/ssr-hydration-harness.mjs');
  const { JSDOM } = await import('jsdom');
  const harness = await createSsrHarness();
  const publishedAt = new Date(Date.now() - 3600000).toISOString();
  const feed = { items: items.map(item => ({...item, publishedAt, sourceType: 'official_api', url: `https://www.binance.com/en/support/announcement/${item.id}`})) };
  const locales = ['en', 'zh-Hans', 'ja', 'ko'];
  const research = [{ slug: 'binance-research-visibility', status: 'PUBLISHED', publishedAt, relatedVenues: ['binance'],
    title: Object.fromEntries(locales.map(locale => [locale, `Binance ${locale}`])),
    summary: Object.fromEntries(locales.map(locale => [locale, `Research ${locale}`])), availableLocales: locales }];
  try {
    for (const [locale, prefix] of [['en',''],['zh-Hans','/zh-hans'],['ja','/ja'],['ko','/ko']]) {
      const html = harness.render(`https://nexualpha.com${prefix}/exchanges/binance`, { officialAnnouncements: feed, newsArticles: research });
      const document = new JSDOM(html).window.document;
      const rows = document.querySelectorAll('.venue-announcement-preview > li');
      assert.equal(rows.length, 5, locale);
      assert.ok(rows[0].textContent.includes(locale === 'en' ? 'Will List' : venueAnnouncementPreview(items, locale)[0].previewTitle));
      const disclosures = [...document.querySelectorAll('.venue-section-disclosure')];
      // Research is intentionally visible: indexed hubs must expose new article editions without opening a panel.
      assert.equal(disclosures.length, 4);
      const researchSection = document.querySelector('[data-hub-news-links]');
      assert.ok(researchSection, locale);
      assert.equal(researchSection.closest('details'), null, `${locale}: research and tools remain outside disclosures`);
      const researchLink = researchSection.querySelector('[data-hub-news-link="binance-research-visibility"]');
      assert.equal(researchLink?.getAttribute('href'), `${prefix}/news/binance-research-visibility`);
      assert.ok(researchSection.querySelector('[data-hub-tool-link]'), `${locale}: informational tool links stay visible`);
      assert.ok(disclosures.every(node => !node.hasAttribute('open') && node.querySelector('.venue-section-disclosure__body').children.length));
      const all = document.querySelector(`.v3-activity-panel__actions a[href='${prefix}/activities']`);
      assert.equal(all?.textContent, venueSlimmingCopy(locale).all);
    }
    for (const path of ['/exchanges/uniswap','/tr/exchanges/bitget','/exchanges/dydx']) {
      const html = harness.render(`https://nexualpha.com${path}`, {officialAnnouncements: {items: []}});
      const document = new JSDOM(html).window.document;
      for (const body of document.querySelectorAll('.venue-section-disclosure__body')) {
        assert.ok(body.children.length > 0, `${path}: no empty disclosure`);
      }
      if (path === '/tr/exchanges/bitget') assert.equal(document.querySelector('.exchange-quick-answers'), null);
    }
  } finally { await harness.close(); }
});

test('real feed previews identify distinct assets and never leak English listing suffixes', async () => {
  const feed = JSON.parse(await readFile(new URL('../public/intel/official-announcements.json', import.meta.url), 'utf8'));
  for (const locale of ['zh-Hans','zh-Hant','ja','ko']) {
    for (const venue of ['binance', 'bybit', 'okx']) {
      const preview = venueAnnouncementPreview(feed.items.filter(item => item.venue === venue), locale);
      assert.equal(new Set(preview.map(item => item.previewTitle)).size, preview.length, `${locale}/${venue}: distinguish notices`);
    }
    const [listing] = venueAnnouncementPreview([{title:'Binance Will List Example (TEST) with Seed Tag Applied', category:'listing'}], locale);
    assert.match(listing.previewTitle, /TEST/);
    assert.doesNotMatch(listing.previewTitle, /with Seed Tag Applied|Example/);
  }
});

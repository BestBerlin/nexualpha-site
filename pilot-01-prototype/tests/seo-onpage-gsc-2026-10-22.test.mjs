import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeRouteSeo } from '../src/data/seo-injection.js';
import { routeMetadata } from '../worker/index.js';
import { compareDirectAnswerFor } from '../src/data/compare-direct-answers.js';
import { strikingDistanceVenueH1, strikingDistanceVenueLead } from '../src/data/striking-distance-venue-copy.js';
import { partnerVenueFaqFor } from '../src/data/partner-venue-faq.js';
import { feeFact } from '../src/data/exchange-facts.js';
import { formatFee } from '../src/data/format-fee.js';
import { serpCtrNewsOverride } from '../src/data/serp-ctr-news-overrides.js';

// All 9 eligible snapshot rows share these 5 ranking URLs. Query variants belong to one answer,
// not competing titles or new URLs. Other snapshot rows explicitly have eligible:false.
const targets = [
  ['/exchanges/hyperliquid', 'Hyperliquid fees', ['hyperliquid fees', 'hyperliquid funded account', 'get funded to trade hyperliquid', 'hyperliquid rebates']],
  ['/exchanges/gate-io', 'Gate.io register', ['gate.io register']],
  ['/compare/binance-vs-kraken', 'Kraken vs Binance', ['kraken vs binance', 'kraken ou binance']],
  ['/compare/binance-vs-bybit', 'Binance vs Bybit', ['binance vs bybit']],
  ['/compare/okx-vs-bybit', 'OKX vs Bybit', ['okx vs bybit']],
];
const faqOf = schemas => schemas.find(x => x['@type'] === 'FAQPage') || schemas.find(x => x.subjectOf?.['@type'] === 'FAQPage')?.subjectOf;
const plain = html => html.replace(/<[^>]*>/g, ' ').replaceAll('&amp;', '&').replaceAll('&#x27;', "'").replaceAll('&quot;', '"').replace(/\s+/g, ' ').trim();

test('all eligible ranking pages share query-first metadata across SSR and Worker within snippet budgets', async () => {
  assert.equal(targets.flatMap(([, , queries]) => queries).length, 9);
  for (const [url, primary] of targets) {
    const seo = computeRouteSeo({ url });
    const worker = await routeMetadata(new URL(url, 'https://nexualpha.com'), {});
    assert.equal(seo.status, 200, url);
    assert.equal(worker.title, seo.title, url);
    assert.equal(worker.description, seo.description, url);
    assert.equal(seo.canonical, `https://nexualpha.com${url}`);
    assert.equal(seo.locale, 'en');
    assert.equal(seo.robots, 'index,follow');
    assert.ok(seo.title.startsWith(primary), seo.title);
    assert.ok(seo.description.startsWith(primary), seo.description);
    assert.ok(seo.title.length <= 60, `${url}: ${seo.title.length}`);
    assert.ok(seo.description.length >= 110 && seo.description.length <= 155, `${url}: ${seo.description.length}`);
    assert.match(seo.description, /\d+(?:\.\d+)?%/, 'concrete existing fee data');
    assert.doesNotMatch(`${seo.title} ${seo.description}`, /null|undefined|guaranteed|free money|lowest fees/i);
  }
});

test('checked maker/taker figures and funded-account boundaries survive the intent recovery', () => {
  for (const [path] of targets) {
    const slug = path.split('/').at(-1);
    const description = computeRouteSeo({ url: path }).description;
    for (const venue of slug.split('-vs-')) {
      const product = venue === 'hyperliquid' ? 'perp' : 'spot';
      const fact = feeFact(venue, product);
      for (const value of [fact.maker, fact.taker]) assert.ok(description.includes(formatFee(value, 'en')), `${path}: ${value}`);
    }
  }
  const lead = strikingDistanceVenueLead('hyperliquid');
  assert.match(lead, /your own USDC collateral/);
  assert.match(lead, /not an offer to get funded to trade Hyperliquid/);
  assert.match(lead, /conditional 4% referral fee discount/);
  assert.match(lead, /not cashback/);
  assert.doesNotMatch(strikingDistanceVenueLead('hyperliquid', 'en', { referral: false }), /conditional 4% referral/);
});

test('every eligible query variant has a source-bound FAQ on its ranking URL', () => {
  for (const [url, , queries] of targets) {
    const schema = faqOf(computeRouteSeo({ url }).schemas);
    assert.ok(schema, url);
    assert.equal(new Set(schema.mainEntity.map(x => x.name)).size, schema.mainEntity.length, `${url}: unique FAQ questions`);
    for (const query of queries) assert.ok(schema.mainEntity.some(x => `${x.name} ${x.acceptedAnswer.text}`.toLowerCase().includes(query)), `${url}: ${query}`);
  }
  for (const slug of ['hyperliquid', 'gate-io']) {
    const faq = partnerVenueFaqFor(slug);
    assert.ok(faq.entries.every(x => x.citations.length > 0));
  }
});

test('the English opportunity pass does not leak English queries into other locale editions', async () => {
  for (const locale of ['zh-Hans', 'fr', 'pt-BR', 'tr', 'ar', 'ru', 'vi']) {
    const prefix = locale.toLowerCase();
    for (const [path, primary] of targets) {
      const seo = computeRouteSeo({ url: `/${prefix}${path}`, locale });
      assert.equal(seo.locale, locale);
      assert.notEqual(seo.title, computeRouteSeo({ url: path }).title, `${locale}: ${seo.title}`);
      assert.notEqual(seo.description, computeRouteSeo({ url: path }).description, `${locale}: ${seo.description}`);
    }
  }
  assert.match(strikingDistanceVenueH1('hyperliquid', 'zh-Hans'), /手续费与钱包使用/);
  assert.match(compareDirectAnswerFor('binance-vs-kraken', 'zh-Hans').body, /^现货手续费/);
});

test('decayed article recovery preserves source facts and historical OKX registration intent', () => {
  const feed = JSON.parse(readFileSync(new URL('../public/content/news-feed.json', import.meta.url)));
  for (const slug of ['how-to-register-okx-account-verify-identity-safely', 'okx-order-book-checksum-deprecation-sequence-integrity-radar']) {
    const article = feed.articles.find(x => x.slug === slug);
    const override = serpCtrNewsOverride(slug, 'en');
    const seo = computeRouteSeo({ url: `/news/${slug}`, article });
    assert.equal(seo.status, 200);
    assert.equal(seo.title, override.title);
    assert.ok(override.title.length <= 60);
    assert.ok(override.description.length <= 155);
    assert.ok(article.content.en.includes(override.intro), 'lead is copied from the existing source article');
  }
  assert.equal(serpCtrNewsOverride('how-to-register-okx-account-verify-identity-safely', 'en').title, 'How to Register an OKX Account and Verify Identity Safely');
  assert.match(serpCtrNewsOverride('okx-order-book-checksum-deprecation-sequence-integrity-radar', 'en').title, /Checksum: Sequence Gaps and Resync$/);
});

test('rendered ranking pages expose query-first H1, first two answer sentences and the FAQ variants', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const dir = await mkdtemp(path.join(root, 'tests/.tmp-gsc-onpage-'));
  try {
    const entry = path.join(dir, 'render.mjs'), bundle = path.join(dir, 'render.cjs');
    await writeFile(entry, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { VenueDetailPage } from '../../src/components/v3/VenueDetailPageStatic.jsx';
      import { CompareDeepPage } from '../../src/components/v3/V3Pages.jsx';
      import { venueDatabase } from '../../src/data/venue-database.js';
      const copy = { common: { dimension: 'Dimension' }, assetCapabilities: { none: 'Pending source review' } };
      const pages = ${JSON.stringify(targets)}.map(([url]) => {
        const slug = url.split('/').at(-1);
        const props = { copy, locale: 'en', venues: Object.values(venueDatabase), updates: [], market: 'unknown', product: 'unknown' };
        return [url, renderToStaticMarkup(url.startsWith('/compare/')
          ? React.createElement(CompareDeepPage, { ...props, selected: slug.split('-vs-') })
          : React.createElement(VenueDetailPage, { ...props, venue: venueDatabase[slug] }))];
      });
      console.log(JSON.stringify(pages));
    `);
    execFileSync(path.join(root, 'node_modules/.bin/esbuild'), [entry, '--bundle', '--platform=node', '--format=cjs', `--outfile=${bundle}`, '--loader:.css=empty', '--log-level=warning'], { cwd: root, stdio: 'pipe' });
    const pages = new Map(JSON.parse(execFileSync(process.execPath, [bundle], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })));
    for (const [url, primary, queries] of targets) {
      const html = pages.get(url);
      const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
      assert.equal(h1s.length, 1, url);
      assert.ok(plain(h1s[0][1]).startsWith(primary), `${url}: ${plain(h1s[0][1])}`);
      const answer = html.match(/data-short-answer-placement="(?:venue|compare)-hero"[^>]*>([\s\S]*?)<\/p>/)?.[1];
      assert.ok(answer, `${url}: hero short answer`);
      assert.ok(plain(answer).toLowerCase().includes(primary.toLowerCase()), `${url}: first answer`);
      const text = plain(html).toLowerCase();
      for (const query of queries) assert.ok(text.includes(query), `${url}: ${query}`);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

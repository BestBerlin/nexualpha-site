import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import worker, { routeMetadata } from '../worker/index.js';
import { computeRouteSeo } from '../src/data/seo-injection.js';
import { compareDirectAnswerFor } from '../src/data/compare-direct-answers.js';
import { canonicalComparePairSlug } from '../src/data/compare-generated.js';
import { strikingDistanceVenueLead, STRIKING_DISTANCE_VENUE_COMPARISONS } from '../src/data/striking-distance-venue-copy.js';
import { REFERRAL_PARTNERS } from '../src/data/referral-partners.generated.js';
import { localizedHref } from '../src/data/locale-routing.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const venues = ['bybit', 'gate-io', 'okx', 'hyperliquid', 'deribit', 'jupiter', 'mexc', 'backpack'];
const names = ['Bybit', 'Gate', 'OKX', 'Hyperliquid', 'Deribit', 'Jupiter', 'MEXC', 'Backpack'];
const pairs = ['binance-vs-kraken', 'binance-vs-okx', 'binance-vs-bybit', 'bitget-vs-bybit', 'bybit-vs-okx', 'gate-io-vs-mexc', 'dydx-vs-hyperliquid', 'coinbase-vs-gate-io'].map(slug => canonicalComparePairSlug(slug.split('-vs-')));
const locales = ['en', 'zh-Hans'];

test('target metadata answers fee and registration intent consistently in client and worker', async () => {
  for (const locale of locales) {
    for (const [index, slug] of venues.entries()) {
      const url = new URL(localizedHref(`/exchanges/${slug}`, { locale }), 'https://nexualpha.com');
      const client = computeRouteSeo({ url: url.href, locale });
      const server = await routeMetadata(url, {});
      assert.equal(server.title, client.title, `${locale}/${slug}: SSR title parity`);
      assert.equal(server.description, client.description, `${locale}/${slug}: SSR description parity`);
      assert.ok(server.title.startsWith(names[index]) || server.title.startsWith('NexuAlpha'), `${locale}/${slug}: venue first: ${server.title}`);
      assert.doesNotMatch(server.title, /^referral code/i);
      const code = REFERRAL_PARTNERS.find(partner => partner.slug === slug)?.inviteCode;
      // The English Hyperliquid SERP title now leads with fees and funded-account checks.
      if (slug === 'hyperliquid' && locale === 'en') {
        assert.match(server.title, /^Hyperliquid fees, rebates & funded account checks/);
        assert.doesNotMatch(server.title, /referral code/i);
      } else if (code) assert.ok(server.title.includes(code), `${locale}/${slug}: registry code retained`);
      assert.match(server.title, locale === 'en' ? /fees|sign-up|KYC/i : /手续费|注册|KYC/);
      assert.ok(server.description.length > 20, `${locale}/${slug}: substantive description`);
      assert.doesNotMatch(server.description, /^No verified user benefit\.?$/i);
    }
    const url = new URL(localizedHref('/', { locale }), 'https://nexualpha.com');
    const meta = await routeMetadata(url, {});
    assert.match(meta.title, /^NexuAlpha/);
    assert.match(meta.title, locale === 'en' ? /Fee Comparison/ : /手续费对比/);
    assert.equal(meta.title, computeRouteSeo({ url: url.href, locale }).title);
  }
});

test('comparison metadata and reverse heading preserve a qualified fee verdict first', async () => {
  for (const locale of locales) for (const slug of pairs) {
    const answer = compareDirectAnswerFor(slug, locale);
    assert.ok(answer, `${locale}/${slug}: direct answer`);
    const firstSentence = answer.body.split(/(?<=[。])\s*|(?<=\.)\s+(?=[A-Z])/u)[0];
    assert.match(firstSentence, locale === 'en' ? /lower base fees|schedules tie|neither venue wins|fee winner can be verified/ : /更低|相同|不能确定单一赢家|不能确认/);
    const url = new URL(localizedHref(`/compare/${slug}`, { locale }), 'https://nexualpha.com');
    const server = await routeMetadata(url, {});
    const client = computeRouteSeo({ url: url.href, locale });
    assert.equal(server.title, client.title, `${locale}/${slug}: title parity`);
    assert.equal(server.description, client.description, `${locale}/${slug}: description parity`);
    assert.match(server.title, /fees|手续费/i);
    const [left, right] = slug.split('-vs-');
    const queryOrder = locale === 'en' ? ({ 'binance-vs-kraken': [right, left], 'binance-vs-bybit': [left, right], 'okx-vs-bybit': [left, right] })[slug] : null;
    const [first, second] = queryOrder || [right, left];
    const display = value => ({ 'gate-io': 'Gate.io', dydx: 'dYdX', okx: 'OKX', mexc: 'MEXC' }[value] || value[0].toUpperCase() + value.slice(1));
    assert.ok(answer.title.startsWith(`${display(first)} vs ${display(second)}`), `${locale}/${slug}: observed query order or reverse ordering in answer heading`);
  }
});

test('all eight reverse comparison routes remain permanent redirects with locale and attribution', async () => {
  for (const locale of locales) for (const slug of pairs) {
    const reverse = slug.split('-vs-').reverse().join('-vs-');
    const target = new URL(localizedHref(`/compare/${slug}`, { locale }), 'https://nexualpha.com');
    target.search = '?utm_source=striking-distance';
    // localizedHref intentionally canonicalizes pairs, so build the incoming reverse URL directly.
    const url = new URL(`${locale === 'zh-Hans' ? '/zh-hans' : ''}/compare/${reverse}`, target.origin);
    url.search = target.search;
    const response = await worker.fetch(new Request(url, { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('<!doctype html><html><head><title>Shell</title></head><body><div id="root"></div></body></html>', { headers: { 'content-type': 'text/html' } }) } });
    assert.equal(response.status, 301, `${locale}/${reverse}`);
    assert.equal(response.headers.get('location'), target.href);
  }
});

test('SSR venue answer follows H1 and body and footer expose the comparison routes', async () => {
  const temp = await mkdtemp(path.join(root, 'tests/.tmp-striking-distance-'));
  try {
    const entry = path.join(temp, 'entry.mjs');
    const bundle = path.join(temp, 'bundle.cjs');
    await writeFile(entry, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { VenueDetailPage } from '../../src/components/v3/VenueDetailPageStatic.jsx';
      import { CleanFooter } from '../../src/components/v3/CleanFooter.jsx';
      import { venueDatabase } from '../../src/data/venue-database.js';
      import { v3Copy } from '../../src/data/v3-product.js';
      const pages = [];
      for (const locale of ${JSON.stringify(locales)}) {
        const copy = { ...v3Copy(locale), common: { dimension: 'Dimension' }, assetCapabilities: { none: 'None' } };
        for (const slug of ${JSON.stringify(venues)}) pages.push({ locale, slug, html: renderToStaticMarkup(React.createElement(VenueDetailPage, { copy, locale, venue: venueDatabase[slug], venues: Object.values(venueDatabase), updates: [], market: 'unknown', product: 'unknown' })) });
        pages.push({ locale, slug: 'footer', html: renderToStaticMarkup(React.createElement(CleanFooter, { locale })) });
      }
      console.log(JSON.stringify(pages));
    `);
    execFileSync(path.join(root, 'node_modules/.bin/esbuild'), [entry, '--bundle', '--platform=node', '--format=cjs', '--loader:.css=empty', '--log-level=warning', `--outfile=${bundle}`], { cwd: root });
    const pages = JSON.parse(execFileSync('node', [bundle], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
    for (const { locale, slug, html } of pages) {
      const document = new JSDOM(html).window.document;
      const links = [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'));
      if (slug === 'footer') {
        for (const route of [...venues.map(v => `/exchanges/${v}`), ...pairs.filter(p => !p.includes('bitget')).map(p => `/compare/${p}`), '/compare/binance-vs-gate-io']) assert.ok(links.includes(localizedHref(route, { locale })), `${locale}: footer ${route}`);
        continue;
      }
      const headings = document.querySelectorAll('h1');
      assert.equal(headings.length, 1, `${locale}/${slug}: one H1`);
      assert.match(headings[0].textContent, locale === 'en' ? /fees|sign-up|KYC/i : /手续费|注册|KYC/);
      const paragraphs = [...document.querySelectorAll('p')];
      const first = paragraphs.find(p => headings[0].compareDocumentPosition(p) & 4);
      assert.equal(first?.textContent.trim().replace(/^(?:The short answer:|简短回答：)\s*/, ''), strikingDistanceVenueLead(slug, locale), `${locale}/${slug}: shared answer is the first visible paragraph`);
      assert.ok(first?.textContent.trim(), `${locale}/${slug}: first answer paragraph`);
      assert.ok(first.textContent.trim().length > 35, `${locale}/${slug}: substantive answer`);
      const sentences = first.textContent.trim().split(/(?<=[!?。！？])\s*|(?<=\.)\s+(?=[A-Z])/u).filter(Boolean);
      assert.ok(sentences.length <= 2, `${locale}/${slug}: answer leads in at most two sentences`);
      const compareLinks = new Set(links.filter(href => /\/compare\/[^/?]+-vs-/.test(href)));
      for (const pair of STRIKING_DISTANCE_VENUE_COMPARISONS[slug]) assert.ok(links.includes(localizedHref(`/compare/${pair}`, { locale })), `${locale}/${slug}: relevant comparison ${pair}`);
      assert.ok(compareLinks.size >= 2, `${locale}/${slug}: at least two body comparisons`);
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('Hyperliquid answer copy respects markets where referral promotion is unavailable', async () => {
  const { strikingDistanceVenueLead } = await import('../src/data/striking-distance-venue-copy.js');
  assert.match(strikingDistanceVenueLead('hyperliquid', 'en'), /conditional 4% referral fee discount/);
  for (const locale of locales) {
    assert.doesNotMatch(strikingDistanceVenueLead('hyperliquid', locale, { referral: false }), /(?<![\d.])4%|discount|折扣/);
    const url = new URL(localizedHref('/exchanges/hyperliquid', { locale }), 'https://nexualpha.com');
    url.searchParams.set('market', 'VN');
    const meta = await routeMetadata(url, {});
    assert.doesNotMatch(`${meta.title} ${meta.description}`, /NEXU888|(?<![\d.])4%|discount|折扣/);
    assert.equal(meta.description, computeRouteSeo({ url: url.href, locale }).description);
  }
});

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

async function bundleAndRun(source) {
  const tempDir = await mkdtemp(path.join(projectRoot, 'tests/.tmp-decision-return-calculators-'));
  try {
    const entryPath = path.join(tempDir, 'entry.mjs');
    const bundlePath = path.join(tempDir, 'bundle.cjs');
    await writeFile(entryPath, source);
    const esbuildBin = path.join(projectRoot, 'node_modules/.bin/esbuild');
    await access(esbuildBin);
    execFileSync(esbuildBin, [
      entryPath,
      '--bundle',
      '--platform=node',
      '--format=cjs',
      `--outfile=${bundlePath}`,
      '--loader:.css=empty',
      '--log-level=warning',
    ], { cwd: projectRoot, stdio: 'pipe' });
    return execFileSync('node', [bundlePath], { cwd: projectRoot, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test('calculator restore helpers accept only their own scenario kind', async () => {
  const output = await bundleAndRun(`
    import { calculateBleedScenario, copyTextWithFeedback, reviewedBleedAnalyzerRate, restoreBleedAnalyzerState, visibleCopyResultForValue } from '../../src/components/v3/TradingBleedAnalyzer.jsx';
    import { restoreCostDecisionState, reviewedCostDecisionRate } from '../../src/components/v3/CostDecision.jsx';
    import { venueDatabase } from '../../src/data/venue-database.js';
    async function main() {
      const result = {
        fees: restoreBleedAnalyzerState('?scenario=fees&venue=bitget&instrument=spot&volume=500000&market=BR'),
      feesRejectCost: restoreBleedAnalyzerState('?scenario=cost&instrument=spot&order=maker&volume=500000'),
      feesRejectOffTier: restoreBleedAnalyzerState('?scenario=fees&venue=bitget&instrument=spot&volume=1234'),
      cost: restoreCostDecisionState('?scenario=cost&instrument=futures&order=maker&volume=12500.25&market=BR'),
      costZero: restoreCostDecisionState('?scenario=cost&instrument=spot&order=taker&volume=0'),
      costRejectFees: restoreCostDecisionState('?scenario=fees&venue=bitget&instrument=spot&volume=500000'),
      reviewedSpotMaker: Object.fromEntries(['binance', 'bybit', 'bitget'].map(slug => [slug, reviewedCostDecisionRate(venueDatabase[slug], 'spotFee', 'makerRate')?.rate * 100000])),
      okxPending: reviewedCostDecisionRate(venueDatabase.okx, 'spotFee', 'makerRate'),
      bitgetFuturesPending: reviewedCostDecisionRate(venueDatabase.bitget, 'futuresFee', 'makerRate'),
      bleedSpotCost: calculateBleedScenario({ db: venueDatabase.bitget, type: 'spot', volume: 100000 }),
      bleedFuturesPending: calculateBleedScenario({ db: venueDatabase.bitget, type: 'futures', volume: 100000 }),
      bleedOkxPending: reviewedBleedAnalyzerRate(venueDatabase.okx, 'spot'),
      copySuccess: await copyTextWithFeedback({ writeText: async (value) => { globalThis.__copied = value; } }, 'nexu888'),
      copyFailure: await copyTextWithFeedback({ writeText: async () => { throw new Error('denied'); } }, 'nexu888'),
        copyUnavailable: await copyTextWithFeedback(null, 'iframe'),
        staleCopyHidden: visibleCopyResultForValue({ status: 'failed', value: 'nexu888' }, '11350287'),
        freshCopyVisible: visibleCopyResultForValue({ status: 'failed', value: 'nexu888' }, 'nexu888'),
      };
      console.log(JSON.stringify(result));
    }
    main().catch((error) => { console.error(error); process.exit(1); });
  `);
  const result = JSON.parse(output);
  assert.deepEqual(result.fees, { selectedSlug: 'bitget', type: 'spot', volIndex: 5 });
  assert.equal(result.feesRejectCost, null);
  assert.equal(result.feesRejectOffTier, null);
  assert.deepEqual(result.cost, { volume: '12500.25', market: 'futuresFee', order: 'makerRate' });
  assert.deepEqual(result.costZero, { volume: '0', market: 'spotFee', order: 'takerRate' });
  assert.equal(result.costRejectFees, null);
  assert.deepEqual(result.reviewedSpotMaker, { binance: 100, bybit: 100, bitget: 100 });
  assert.equal(result.okxPending, null);
  assert.equal(result.bitgetFuturesPending, null);
  assert.deepEqual(result.bleedSpotCost, { rate: 0.001, annualTotalFee: 1200, annualBleed: 0 });
  assert.deepEqual(result.bleedFuturesPending, { rate: null, annualTotalFee: null, annualBleed: null });
  assert.equal(result.bleedOkxPending, null);
  assert.deepEqual(result.copySuccess, { status: 'copied', value: 'nexu888' });
  assert.deepEqual(result.copyFailure, { status: 'failed', value: 'nexu888' });
  assert.deepEqual(result.copyUnavailable, { status: 'failed', value: 'iframe' });
  assert.equal(result.staleCopyHidden, null);
  assert.deepEqual(result.freshCopyVisible, { status: 'failed', value: 'nexu888' });
});

test('calculator SSR defaults stay stable while exposing return-copy controls', async () => {
  const html = await bundleAndRun(`
    import React from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import { TradingBleedAnalyzer } from '../../src/components/v3/TradingBleedAnalyzer.jsx';
    import { CostDecision } from '../../src/components/v3/CostDecision.jsx';
    const fees = renderToStaticMarkup(React.createElement(TradingBleedAnalyzer, { locale: 'en', headingLevel: 2 }));
    const feesRegional = renderToStaticMarkup(React.createElement(TradingBleedAnalyzer, { locale: 'en', headingLevel: 2, market: 'BR', product: 'spot' }));
    const cost = renderToStaticMarkup(React.createElement(CostDecision, { locale: 'en', regionMarket: 'BR', product: 'spot' }));
    console.log(JSON.stringify({ fees, feesRegional, cost }));
  `);
  const { fees, feesRegional, cost } = JSON.parse(html);
  assert.match(fees, /value="3"/); // default 100000 tier remains SSR default
  assert.match(fees, /Open fee query in Telegram/);
  assert.doesNotMatch(fees, /Save report to Telegram Bot|保存诊断至 Telegram/);
  assert.match(fees, /Copy link to continue later/);
  assert.match(fees, /nexu888/);
  assert.match(fees, /Pending/);
  assert.doesNotMatch(fees, /bleed-verdict__numbers/);
  assert.doesNotMatch(fees, /bleed-seats-counter/);
  assert.equal((fees.match(/User benefit pending official verification/g) || []).length, 1);
  assert.match(feesRegional, /href="\/exchanges\/okx\?market=BR&amp;product=spot&amp;utm_source=regional_preview&amp;utm_campaign=br-research-preview#registration-path"/);
  assert.match(feesRegional, /data-cta-kind="research"/);
  assert.doesNotMatch(feesRegional, /href="https:\/\/www\.okx\.com\/join\/nexu888"/);
  assert.match(feesRegional, /data-growth-market="BR"/);
  assert.match(feesRegional, /data-growth-product="spot"/);
  assert.match(cost, /id="cost-scenario"/);
  assert.match(cost, /value="100000"/);
  assert.match(cost, /Copy link to continue later/);
  for (const venue of ['Binance', 'Bybit', 'Bitget']) {
    const match = cost.match(new RegExp(`<article><h3>${venue}</h3>[\\s\\S]*?</article>`));
    assert.ok(match, `${venue} card should render`);
    assert.match(match[0], /<p class=\"cost-decision__amount\">100<small> USDT\/mo<\/small><\/p>/);
    assert.match(match[0], /View fee source/);
  }
  const okx = cost.match(/<article><h3>OKX<\/h3>[\s\S]*?<\/article>/);
  assert.ok(okx, 'OKX card should render');
  assert.match(okx[0], /Pending source review/);
  assert.doesNotMatch(okx[0], /View fee source/);
});


test('TradingBleedAnalyzer SSR has native visible copy across all supported locales', async () => {
  const output = await bundleAndRun(`
    import React from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import { TradingBleedAnalyzer } from '../../src/components/v3/TradingBleedAnalyzer.jsx';
    import { tradingBleedCopy, tradingBleedLocales } from '../../src/data/trading-bleed-copy.js';
    const result = Object.fromEntries(tradingBleedLocales.map((locale) => [locale, { copy: tradingBleedCopy(locale), html: renderToStaticMarkup(React.createElement(TradingBleedAnalyzer, { locale, headingLevel: 2 })) }]));
    console.log(JSON.stringify(result));
  `);
  const result = JSON.parse(output);
  const englishSentinels = [
    'Estimate your current exchange',
    'My Current Primary Platform',
    'Trading Instrument',
    'Monthly Volume',
    'DIAGNOSIS COMPLETE',
    'Base-Rate Scenario Review',
    'Standard account baseline',
    'User benefit pending official verification',
    'Review official terms',
    'Partner Referral Code',
    'Click to copy',
    'Embed this calculator',
    'Copy iframe embed code',
    'USDT/yr',
  ];
  for (const [locale, { copy, html }] of Object.entries(result)) {
    const visible = html.replace(/&#x27;/g, "'").replace(/&amp;/g, '&');
    for (const key of ['title', 'currentVenue', 'tradingType', 'monthlyVol', 'bleedResultTitle', 'baseline', 'benefitPending', 'codeLabel', 'embed', 'embedTitle']) {
      assert.ok(copy[key]?.trim(), `${locale}.${key}`);
      assert.match(visible, new RegExp(copy[key].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    assert.match(visible, /nexu888/);
    if (locale !== 'en') {
      for (const sentinel of englishSentinels) assert.doesNotMatch(visible, new RegExp(sentinel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${locale} leaked ${sentinel}`);
    }
  }
});

test('calculator source wires safe return hrefs and preserves protected third-party hrefs', async () => {
  const bleed = await readFile(new URL('../src/components/v3/TradingBleedAnalyzer.jsx', import.meta.url), 'utf8');
  const cost = await readFile(new URL('../src/components/v3/CostDecision.jsx', import.meta.url), 'utf8');
  assert.match(bleed, /buildDecisionReturnHref\(\{\s*kind: "fees"/s);
  assert.match(bleed, /regionalVenueCta\(selectedSlug, locale, market, product\)/);
  assert.match(bleed, /await copyTextWithFeedback/);
  assert.match(bleed, /partner\.inviteCode \?\? db\.inviteCode/);
  assert.doesNotMatch(bleed, /benefitVerified \? \(partner\.inviteCode/);
  assert.match(bleed, /const directRoute = Boolean\(regionalCta\.direct && \/\^https:/);
  assert.match(bleed, /data-growth-market=\{market\}/);
  assert.match(bleed, /data-growth-product=\{product\}/);
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const embed = await readFile(new URL('../src/components/v3/EmbedCalculator.jsx', import.meta.url), 'utf8');
  assert.match(app, /<TradingBleedAnalyzer locale=\{locale\} market=\{decisionPassport\.market\} product=\{decisionPassport\.product\}/);
  assert.match(app, /<EmbedCalculator locale=\{locale\} market=\{embedUrl\.searchParams\.get\("market"\)\} product=\{embedUrl\.searchParams\.get\("product"\)\}/);
  assert.match(embed, /<TradingBleedAnalyzer locale=\{locale\} market=\{market\} product=\{product\}/);
  assert.match(bleed, /buildVenueFeeSummary\(db\)/);
  assert.doesNotMatch(bleed, /db\.futuresFee\?\.takerRate \?\? 0\.0005/);
  assert.doesNotMatch(bleed, /db\.spotFee\?\.takerRate \?\? 0\.001/);
  assert.match(bleed, /<DecisionReturnLink href=\{decisionReturnHref\} locale=\{locale\}/);
  assert.match(cost, /buildDecisionReturnHref\(\{kind:'cost'/);
  assert.match(cost, /<DecisionReturnLink href=\{decisionReturnHref\} locale=\{locale\}/);

  const partnerRegistry = await readFile(new URL('../src/data/partner-registry.js', import.meta.url), 'utf8');
  assert.match(partnerRegistry, /https:\/\/partner\.bitget\.cafe\/bg\/C6PRAF/);
  assert.match(partnerRegistry, /https:\/\/www\.bsmkweb\.cc\/join\?ref=11350287/);
  assert.match(partnerRegistry, /https:\/\/www\.okx\.com\/join\/nexu888/);
  assert.match(partnerRegistry, /https:\/\/backpack\.exchange\/join\/luckybitcoin/);
});


test('embed calculator uses compact shell without changing standalone analyzer CSS scope', async () => {
  const embed = await readFile(new URL('../src/components/v3/EmbedCalculator.jsx', import.meta.url), 'utf8');
  const embedCss = await readFile(new URL('../src/components/v3/embed-calculator.css', import.meta.url), 'utf8');
  const bleedCss = await readFile(new URL('../src/components/v3/trading-bleed-analyzer.css', import.meta.url), 'utf8');
  assert.match(embed, /className="embed-container embed-container--calculator"/);
  assert.match(embedCss, /\.embed-container--calculator \.bleed-analyzer__container/);
  assert.match(embedCss, /\.embed-container--calculator \.bleed-analyzer__controls,[\s\S]*\.embed-container--calculator \.bleed-analyzer__verdict-card,[\s\S]*\.embed-container--calculator \.bleed-solution-box/);
  assert.match(bleedCss, /\.bleed-code-row \{[\s\S]*flex-wrap: wrap;[\s\S]*gap: 8px;/);
  assert.match(bleedCss, /\.bleed-embed-row \{[\s\S]*flex-wrap: wrap;[\s\S]*gap: 8px;/);
  assert.match(bleedCss, /\.bleed-copy-status \{[\s\S]*flex: 1 0 100%;/);
  assert.match(bleedCss, /\.bleed-manual-copy \{[\s\S]*flex: 1 0 100%;/);
});

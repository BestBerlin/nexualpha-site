import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { buildGrowthReport, summarize, summarizeExperimentReadouts } from '../server/growth-report.mjs';

const event = (type, overrides = {}) => ({
  version: 2,
  type,
  eventId: randomUUID(),
  session: overrides.session || randomUUID(),
  page: overrides.page || '/markets/br',
  locale: 'pt-BR',
  source: overrides.source || 'creator_a',
  market: overrides.market || 'BR',
  product: overrides.product || 'spot',
  campaign: 'br_pix',
  publisher: overrides.publisher || 'creator_a',
  ...(overrides.experiment ? { experiment: overrides.experiment } : {}),
  ...(overrides.variant ? { variant: overrides.variant } : {}),
  ...(overrides.accountStage ? { accountStage: overrides.accountStage } : {}),
  ...(overrides.funding ? { funding: overrides.funding } : {}),
  ...(['referral_click', 'cta_visible', 'outbound_handoff'].includes(type) ? { platform: overrides.platform || 'binance', placement: overrides.placement || 'market-primary' } : {}),
  ...(['decision_impression', 'decision_select'].includes(type) ? { decision: overrides.decision || 'binance', placement: overrides.placement || 'market-card' } : {}),
  ...(type === 'telegram_handoff' ? {
    decision: overrides.decision || 'telegram_research',
    placement: overrides.placement || 'telegram-handoff',
    telegramTarget: 'bot',
    telegramReturnKind: 'route',
    telegramReturnPath: overrides.telegramReturnPath || '/telegram',
  } : {}),
});

test('keeps Telegram outbound handoffs separate from explicit Telegram return aliases', () => {
  const channel = randomUUID();
  const legacy = randomUUID();
  const unrelated = randomUUID();
  const outbound = randomUUID();
  const report = summarize([
    event('page_view', { session: channel, source: 'tg_channel', publisher: 'creator_a' }),
    event('decision_select', { session: channel, source: 'tg_channel', publisher: 'creator_a' }),
    event('page_view', { session: legacy, source: 'tg', publisher: 'creator_a' }),
    event('page_view', { session: unrelated, source: 'newsletter', publisher: 'creator_a' }),
    event('page_view', { session: outbound, source: 'direct', publisher: 'creator_a' }),
    event('telegram_handoff', { session: outbound, source: 'direct', publisher: 'creator_a', page: '/rates' }),
  ]);

  assert.equal(report.totals.telegramHandoffs, 1);
  assert.equal(report.dataQuality.telegramHandoffs, 1);
  assert.equal(report.onsiteJourney.telegramReturn.sessions, 2);
  assert.equal(report.onsiteJourney.stages.find((row) => row.id === 'telegram_handoff').sessions, 1);
  assert.equal(report.onsiteJourney.stages.find((row) => row.id === 'telegram_return').sessions, 2);
  assert.equal(report.byPage.find((row) => row.page === '/rates').telegramHandoffs, 1);
  assert.equal(report.onsiteJourney.byMarketProduct[0].telegramHandoffSessions, 1);
  assert.equal(report.totals.confirmedRegistrations, null);
  assert.equal(report.partnerSideOutcomes.commissions, null);
});

test('keeps the headline referral metric unique by session and platform while retaining page attribution', () => {
  const session = randomUUID();
  const report = summarize([
    event('page_view', { session, page: '/rates' }),
    event('referral_click', { session, page: '/rates', platform: 'bitget', placement: 'rates-primary' }),
    event('page_view', { session, page: '/exchanges/bitget' }),
    event('referral_click', { session, page: '/exchanges/bitget', platform: 'bitget', placement: 'venue-primary' }),
  ]);

  assert.equal(report.totals.referralClicks, 1);
  assert.equal(report.byPage.find((row) => row.page === '/rates').referralClicks, 1);
  assert.equal(report.byPage.find((row) => row.page === '/exchanges/bitget').referralClicks, 1);
});

test('summarizes the private funnel without inventing registrations', () => {
  const session = randomUUID();
  const report = summarize([
    event('page_view', { session, accountStage: 'new_account', funding: 'Pix' }),
    event('decision_impression', { session, accountStage: 'new_account', funding: 'Pix' }),
    event('decision_select', { session, accountStage: 'new_account', funding: 'Pix' }),
    event('cta_visible', { session, accountStage: 'new_account', funding: 'Pix' }),
    event('referral_click', { session, platform: 'binance', accountStage: 'new_account', funding: 'Pix' }),
    event('referral_click', { session, platform: 'okx', accountStage: 'new_account', funding: 'Pix' }),
  ], '/private/local-cta.jsonl');
  assert.equal(report.totals.uniqueVisitors, 1);
  assert.equal(report.totals.uniqueSessions, 1);
  assert.equal(report.totals.uniquePageViews, 1);
  assert.equal(report.totals.decisionImpressions, 1);
  assert.equal(report.totals.decisionSelections, 1);
  assert.equal(report.totals.clickingSessions, 1);
  assert.equal(report.totals.referralClicks, 2);
  assert.deepEqual(report.funnel, {
    decisionPerVisitor: 1,
    ctaVisiblePerPageView: 1,
    referralClicksPerVisibleCta: 2,
    clickingSessionPerCtaPageView: 1,
    outboundHandoffPerReferralClick: 0,
    clickingSessionPerVisitor: 1,
  });
  assert.equal(report.totals.confirmedRegistrations, null);
  assert.deepEqual(report.partnerSideOutcomes, {
    registrations: null,
    kyc: null,
    deposits: null,
    trades: null,
    commissions: null,
    status: 'UNAVAILABLE',
    reason: 'No official partner API, webhook or reviewed private import is connected to this first-party CTA report.',
  });
  assert.deepEqual(report.eventTaxonomy.filter((row) => row.partnerSide).map((row) => [row.type, row.value]), [
    ['partner_registration', null],
    ['partner_kyc', null],
    ['partner_deposit', null],
    ['partner_trade', null],
    ['partner_commission', null],
  ]);
  assert.deepEqual(report.firstPartyFunnelStages.map((row) => [row.stage, row.value, row.valueStatus]), [
    ['first_party_surface_impression', 1, 'observed_positive'],
    ['internal_decision_impression', 1, 'observed_positive'],
    ['internal_decision_selection', 1, 'observed_positive'],
    ['partner_cta_exposure', 1, 'observed_positive'],
    ['onsite_external_handoff_attempt', 0, 'observed_zero'],
    ['qualified_external_cta_click', 2, 'observed_positive'],
    ['onsite_telegram_handoff', 0, 'observed_zero'],
    ['partner_side_registration', null, 'unknown_unavailable'],
    ['partner_side_kyc', null, 'unknown_unavailable'],
    ['partner_side_deposit', null, 'unknown_unavailable'],
    ['partner_side_trade', null, 'unknown_unavailable'],
    ['private_partner_commission', null, 'unknown_unavailable'],
  ]);
  assert.equal(report.dataQuality.status, 'PASS');
  assert.equal(report.dataQuality.decisionImpressions, 1);
  assert.deepEqual(report.dataQuality.observedEventTypes, ['cta_visible', 'decision_impression', 'decision_select', 'page_view', 'referral_click']);
  assert.deepEqual(report.quality, { inputRows: 6, validRows: 6, invalidRows: 0 });
  assert.equal(report.byMarket[0].market, 'BR');
  assert.equal(report.byCountry[0].country, 'BR');
  assert.equal(report.byLocale[0].locale, 'pt-BR');
  assert.equal(report.bySource[0].source, 'creator_a');
  assert.equal(report.byCampaign[0].campaign, 'br_pix');
  assert.equal(report.byProduct[0].product, 'spot');
  assert.equal(report.byDevice[0].device, 'unknown');
  assert.equal(report.byEntry[0].entry, 'creator_a|br_pix|creator_a');
  assert.deepEqual(report.byPlatform.map((row) => row.platform).sort(), ['binance', 'okx']);
  assert.equal(report.byExperiment[0].experiment, 'none');
  assert.equal(report.byExperiment[0].variant, 'control');
  assert.equal(report.byAccountStage[0].accountStage, 'new_account');
  assert.equal(report.byAccountStage[0].decisionImpressions, 1);
  assert.equal(report.byAccountStage[0].referralClicks, 2);
  assert.equal(report.byFunding[0].funding, 'Pix');
  assert.equal(report.byFunding[0].referralClicks, 2);
});

test('first-party funnel stages distinguish recorded zero from missing partner outcomes and missing input', async () => {
  const report = summarize([
    event('page_view', { session: randomUUID(), source: 'direct' }),
  ], '/private/local-cta.jsonl');
  const stage = (id) => report.firstPartyFunnelStages.find((row) => row.stage === id);
  assert.deepEqual({ value: stage('internal_decision_selection').value, status: stage('internal_decision_selection').valueStatus }, {
    value: 0,
    status: 'observed_zero',
  });
  assert.deepEqual({ value: stage('internal_decision_impression').value, status: stage('internal_decision_impression').valueStatus }, {
    value: 0,
    status: 'observed_zero',
  });
  assert.deepEqual({ value: stage('partner_side_registration').value, status: stage('partner_side_registration').valueStatus }, {
    value: null,
    status: 'unknown_unavailable',
  });

  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-growth-stage-missing-'));
  try {
    const { report: missing, markdownPath } = await buildGrowthReport({
      inputFile: path.join(dir, 'missing.jsonl'),
      outputDir: path.join(dir, 'reports'),
      environment: 'production',
    });
    assert.equal(missing.firstPartyFunnelStages[0].value, null);
    assert.equal(missing.firstPartyFunnelStages[0].valueStatus, 'input_missing');
    assert.equal(missing.dataQuality.decisionImpressions, null);
    const markdown = await readFile(markdownPath, 'utf8');
    assert.match(markdown, /First-Party Funnel Stages/);
    assert.match(markdown, /input_missing/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('keeps funding routes distinct in funnel dimensions and markdown', async () => {
  const session = randomUUID();
  const rows = [
    event('page_view', { session, funding: 'Pix' }),
    event('page_view', { session, funding: 'BRL bank transfer' }),
  ];
  const report = summarize(rows, '/private/local-cta.jsonl');
  assert.equal(report.totals.uniquePageViews, 2);
  assert.deepEqual(report.byFunding.map((row) => row.funding).sort(), ['BRL bank transfer', 'Pix']);

  const root = await mkdtemp(path.join(os.tmpdir(), 'growth-funding-'));
  try {
    const inputFile = path.join(root, 'local-cta.jsonl');
    await writeFile(inputFile, `${rows.map((row, index) => JSON.stringify({ ...row, receivedAt: `2026-09-29T00:00:0${index}.000Z`, environment: 'local-preview' })).join('\n')}\n`);
    const { markdownPath } = await buildGrowthReport({ inputFile, outputDir: path.join(root, 'out'), environment: 'local-preview' });
    const markdown = await readFile(markdownPath, 'utf8');
    assert.match(markdown, /## Funding Routes/);
    assert.match(markdown, /\| Pix \|/);
    assert.match(markdown, /\| BRL bank transfer \|/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('experiment readouts keep first-party signals separate from partner outcomes', () => {
  const control = randomUUID();
  const treatment = randomUUID();
  const experiment = 'br_compare_entry_v1';
  const report = summarize([
    event('page_view', { session: control, experiment, variant: 'control' }),
    event('decision_select', { session: control, experiment, variant: 'control' }),
    event('referral_click', { session: control, experiment, variant: 'control' }),
    event('page_view', { session: treatment, experiment, variant: 'comparison' }),
    event('cta_visible', { session: treatment, experiment, variant: 'comparison' }),
  ], '/private/local-cta.jsonl');
  const readout = report.experimentReadouts.find((row) => row.experiment === experiment);
  assert.equal(readout.definitionStatus, 'DESIGNED');
  assert.equal(readout.outcomeClass, 'first_party_behavior');
  assert.equal(readout.status, 'DESIGNED_NOT_ACTIVE');
  assert.equal(readout.minimumSamplePerVariant, 200);
  assert.equal(readout.canCallWinner, false);
  assert.equal(readout.winner, null);
  assert.ok(readout.measuredOutcomes.includes('decision_select'));
  assert.ok(readout.unavailableOutcomes.includes('partner_registration'));
  assert.ok(readout.unavailableOutcomes.includes('partner_commission'));
  assert.deepEqual(readout.variants.map((row) => [row.variant, row.sampleSufficient]), [['comparison', false], ['control', false]]);
  assert.equal(report.totals.confirmedRegistrations, null);
  assert.equal(report.byExperiment.find((row) => row.experiment === experiment).confirmedRegistrations, null);
  assert.match(report.notes.join('\n'), /first-party onsite events only/);
  assert.match(report.notes.join('\n'), /KYC, deposits, trades, commissions/);
});

test('data quality flags referral clicks when CTA visibility is not observed', () => {
  const session = randomUUID();
  const report = summarize([
    event('page_view', { session }),
    event('referral_click', { session, platform: 'binance' }),
  ], '/private/local-cta.jsonl');
  assert.equal(report.dataQuality.status, 'NEEDS_REVIEW');
  assert.ok(report.dataQuality.issues.includes('referral_clicks_without_cta_visibility'));
  assert.equal(report.totals.confirmedRegistrations, null);
  assert.equal(report.partnerSideOutcomes.commissions, null);
});

test('builds privacy-safe CTA drop-off queues without session ids or raw query strings', () => {
  const visibleNoClick = randomUUID();
  const visibleWithClick = randomUUID();
  const decisionNoHandoff = randomUUID();
  const telegramNoDecision = randomUUID();
  const telegramWithDecision = randomUUID();
  const report = summarize([
    event('page_view', { session: visibleNoClick, page: '/br?market=BR&secret=raw' }),
    event('cta_visible', { session: visibleNoClick, page: '/br?market=BR&secret=raw', platform: 'binance', placement: 'market-primary' }),
    event('page_view', { session: visibleWithClick, page: '/br' }),
    event('cta_visible', { session: visibleWithClick, page: '/br', platform: 'okx', placement: 'market-primary' }),
    event('referral_click', { session: visibleWithClick, page: '/br', platform: 'okx', placement: 'market-primary' }),
    event('page_view', { session: decisionNoHandoff, page: '/compare/bybit-vs-bitget?utm_source=telegram' }),
    event('decision_select', { session: decisionNoHandoff, page: '/compare/bybit-vs-bitget?utm_source=telegram', decision: 'bitget' }),
    event('page_view', { session: telegramNoDecision, page: '/telegram?tg_draft=secret', source: 'telegram', publisher: 'telegram', campaign: 'tg_weekly' }),
    event('page_view', { session: telegramWithDecision, page: '/telegram', source: 'telegram', publisher: 'telegram', campaign: 'tg_weekly' }),
    event('decision_select', { session: telegramWithDecision, page: '/telegram', source: 'telegram', publisher: 'telegram', campaign: 'tg_weekly' }),
    event('cta_visible', { session: telegramWithDecision, page: '/telegram', source: 'telegram', publisher: 'telegram', campaign: 'tg_weekly', platform: 'telegram', placement: 'telegram-return-card' }),
    event('outbound_handoff', { session: telegramWithDecision, page: '/telegram', source: 'telegram', publisher: 'telegram', campaign: 'tg_weekly', placement: 'telegram-return-card' }),
  ]);
  assert.equal(report.dropOffQueues.status, 'INSUFFICIENT_SAMPLE');
  assert.deepEqual(report.dropOffQueues.partnerSideOutcomes, {
    registrations: null,
    kyc: null,
    deposits: null,
    trades: null,
    commissions: null,
  });
  assert.deepEqual(report.dropOffQueues.visible_no_click_pages.map((row) => [row.page, row.visibleCtas, row.referralClicks, row.dropOffCtaViews]), [
    ['/br', 2, 1, 1],
    ['/telegram', 1, 0, 1],
  ]);
  assert.deepEqual(report.dropOffQueues.decision_no_handoff_pages.map((row) => [row.page, row.decisionSelections, row.outboundHandoffs, row.referralClicks, row.dropOffDecisions]), [
    ['/compare/bybit-vs-bitget', 1, 0, 0, 1],
  ]);
  assert.deepEqual(report.dropOffQueues.telegram_entry_no_decision.map((row) => [row.entry, row.page, row.entrySessions, row.decisionSelections, row.dropOffSessions]), [
    ['telegram|br_pix|telegram', '/telegram', 2, 1, 1],
  ]);
  assert.deepEqual(report.dropOffQueues.platform_visible_no_click.map((row) => [row.platform, row.visibleCtas, row.referralClicks, row.dropOffCtaViews]), [
    ['binance', 1, 0, 1],
    ['telegram', 1, 0, 1],
  ]);
  assert.deepEqual(report.dropOffQueues.placement_visible_no_click.map((row) => [row.placement, row.visibleCtas, row.outboundHandoffs, row.referralClicks, row.dropOffCtaViews]), [
    ['market-primary', 2, 0, 1, 1],
    ['telegram-return-card', 1, 1, 0, 1],
  ]);
  const serialized = JSON.stringify(report.dropOffQueues);
  assert.doesNotMatch(serialized, /\?/);
  assert.doesNotMatch(serialized, /secret|tg_draft|utm_source/);
  for (const id of [visibleNoClick, visibleWithClick, decisionNoHandoff, telegramNoDecision, telegramWithDecision]) {
    assert.doesNotMatch(serialized, new RegExp(id, 'i'));
  }
  assert.doesNotMatch(serialized, /registrationUrl|rawUrl|query/i);
});

test('derives the onsite CTA journey from first-party events only', () => {
  const regional = randomUUID();
  const comparison = randomUUID();
  const detail = randomUUID();
  const telegram = randomUUID();
  const report = summarize([
    event('page_view', { session: regional, page: '/br', market: 'BR', product: 'spot' }),
    event('decision_select', { session: regional, page: '/br', market: 'BR', product: 'spot', decision: 'binance', placement: 'home-selector' }),
    event('page_view', { session: comparison, page: '/compare/binance-vs-okx', market: 'BR', product: 'spot' }),
    event('decision_select', { session: comparison, page: '/compare/binance-vs-okx', market: 'BR', product: 'spot', decision: 'binance-vs-okx', placement: 'compare-card' }),
    event('page_view', { session: detail, page: '/exchanges/bitget', market: 'TR', product: 'perpetuals' }),
    event('cta_visible', { session: detail, page: '/exchanges/bitget', market: 'TR', product: 'perpetuals', platform: 'bitget' }),
    event('outbound_handoff', { session: detail, page: '/exchanges/bitget', market: 'TR', product: 'perpetuals', platform: 'bitget' }),
    event('referral_click', { session: detail, page: '/exchanges/bitget', market: 'TR', product: 'perpetuals', platform: 'bitget' }),
    event('page_view', { session: telegram, page: '/telegram', source: 'telegram', publisher: 'telegram', campaign: 'tg_weekly', market: 'BR', product: 'spot' }),
    event('decision_select', { session: telegram, page: '/telegram', source: 'telegram', publisher: 'telegram', campaign: 'tg_weekly', market: 'BR', product: 'spot' }),
    event('referral_click', { session: telegram, page: '/telegram', source: 'telegram', publisher: 'telegram', campaign: 'tg_weekly', market: 'BR', product: 'spot', platform: 'okx' }),
  ]);

  assert.equal(report.onsiteJourney.status, 'READY');
  const stage = (id) => report.onsiteJourney.stages.find((row) => row.id === id);
  assert.equal(stage('regional_product_selection').sessions, 4);
  assert.equal(stage('shortlist_review').sessions, 1);
  assert.equal(stage('platform_compare').sessions, 1);
  assert.equal(stage('platform_detail').sessions, 1);
  assert.equal(stage('external_handoff').sessions, 2);
  assert.equal(stage('telegram_return').sessions, 1);
  assert.deepEqual(report.onsiteJourney.telegramReturn, {
    sessions: 1,
    decisionSessions: 1,
    externalHandoffSessions: 0,
    referralClickSessions: 1,
    decisionRate: 1,
    referralClickRate: 1,
  });
  const brSpot = report.onsiteJourney.byMarketProduct.find((row) => row.market === 'BR' && row.product === 'spot');
  assert.equal(brSpot.shortlistSessions, 1);
  assert.equal(brSpot.compareSessions, 1);
  assert.equal(brSpot.telegramReturnSessions, 1);
  assert.equal(brSpot.partnerRegistrations, null);
  assert.equal(brSpot.partnerCommissions, null);
  assert.match(report.onsiteJourney.boundary, /not proof of registration/);
});

test('experiment readiness requires configured variants and treats paused experiments as not analyzed', () => {
  const registry = {
    exp_ready: {
      status: 'ACTIVE',
      control: { id: 'control' },
      treatment: { id: 'treatment' },
      minimumSamplePerVariant: 2,
      outcomeClass: 'first_party_behavior',
      primaryMetric: 'decision_select_rate',
      observableOutcomes: ['decision_select'],
      unavailableOutcomes: ['partner_registration'],
    },
    exp_paused: {
      status: 'PAUSED',
      control: { id: 'control' },
      treatment: { id: 'treatment' },
      minimumSamplePerVariant: 1,
      outcomeClass: 'first_party_behavior',
      primaryMetric: 'decision_select_rate',
      observableOutcomes: ['decision_select'],
      unavailableOutcomes: ['partner_registration'],
    },
  };
  const missingDefinedVariant = summarizeExperimentReadouts([
    { experiment: 'exp_ready', variant: 'control', uniqueVisitors: 2, uniquePageViews: 2, decisionSelections: 1, referralClicks: 0, outboundHandoffs: 0 },
    { experiment: 'exp_ready', variant: 'other', uniqueVisitors: 2, uniquePageViews: 2, decisionSelections: 1, referralClicks: 0, outboundHandoffs: 0 },
  ], registry)[0];
  assert.equal(missingDefinedVariant.status, 'MISSING_CONFIGURED_VARIANT_TRAFFIC');
  assert.deepEqual(missingDefinedVariant.missingVariants, ['treatment']);
  assert.equal(missingDefinedVariant.canCallWinner, false);

  const paused = summarizeExperimentReadouts([
    { experiment: 'exp_paused', variant: 'control', uniqueVisitors: 1, uniquePageViews: 1, decisionSelections: 1, referralClicks: 0, outboundHandoffs: 0 },
    { experiment: 'exp_paused', variant: 'treatment', uniqueVisitors: 1, uniquePageViews: 1, decisionSelections: 1, referralClicks: 0, outboundHandoffs: 0 },
  ], registry)[0];
  assert.equal(paused.status, 'PAUSED_NOT_ANALYZED');
  assert.equal(paused.sampleThresholdMeaning, 'exploratory_readiness_threshold_not_statistical_significance');
  assert.equal(paused.canCallWinner, false);

  const readyForSeparateAnalysis = summarizeExperimentReadouts([
    { experiment: 'exp_ready', variant: 'control', uniqueVisitors: 2, uniquePageViews: 2, decisionSelections: 1, referralClicks: 0, outboundHandoffs: 0 },
    { experiment: 'exp_ready', variant: 'treatment', uniqueVisitors: 2, uniquePageViews: 2, decisionSelections: 1, referralClicks: 0, outboundHandoffs: 0 },
  ], registry)[0];
  assert.equal(readyForSeparateAnalysis.status, 'READY_FOR_ANALYSIS');
  assert.equal(readyForSeparateAnalysis.decision, 'ANALYSIS_REQUIRED_NO_WINNER_DECLARED');
  assert.equal(readyForSeparateAnalysis.canCallWinner, false);
});

test('bucket summaries use the same dedupe sets as totals', () => {
  const session = randomUUID();
  const report = summarize([
    event('page_view', { session, product: 'spot' }),
    event('page_view', { session, product: 'spot' }),
    event('page_view', { session, product: 'perpetuals' }),
    event('referral_click', { session, platform: 'binance' }),
    event('referral_click', { session, platform: 'binance' }),
  ], '/private/local-cta.jsonl');
  assert.equal(report.totals.uniqueVisitors, 1);
  assert.equal(report.totals.uniquePageViews, 2);
  assert.equal(report.totals.clickingSessions, 1);
  assert.equal(report.totals.referralClicks, 1);
  assert.equal(report.byMarket[0].uniqueVisitors, 1);
  assert.equal(report.byMarket[0].uniquePageViews, 2);
  assert.equal(report.byMarket[0].clickingSessions, 1);
  assert.equal(report.byMarket[0].referralClicks, 1);
  assert.equal(report.byMarket[0].funnel.referralClicksPerVisibleCta, null);
  assert.equal(report.byMarket[0].funnel.clickingSessionPerCtaPageView, null);
  assert.deepEqual(report.byPage.map((row) => `${row.market}:${row.product}:${row.uniquePageViews}`).sort(), ['BR:perpetuals:1', 'BR:spot:1']);
});

test('entry summaries aggregate by stable source campaign publisher key', () => {
  const session = randomUUID();
  const report = summarize([
    event('page_view', { session, source: 't.co', publisher: 'x' }),
    event('decision_select', { session, source: 't.co', publisher: 'x' }),
    event('referral_click', { session, source: 't.co', publisher: 'x' }),
  ]);
  assert.equal(report.byEntry.length, 1);
  assert.equal(report.byEntry[0].entry, 't.co|br_pix|x');
  assert.equal(report.byEntry[0].uniqueSessions, 1);
  assert.equal(report.byEntry[0].decisionSelections, 1);
  assert.equal(report.byEntry[0].referralClicks, 1);
});

test('page-view dedupe keeps account-stage changes distinct', () => {
  const session = randomUUID();
  const report = summarize([
    event('page_view', { session, accountStage: 'new_account' }),
    event('page_view', { session, accountStage: 'existing_account' }),
  ]);
  assert.equal(report.totals.uniqueVisitors, 1);
  assert.equal(report.totals.uniquePageViews, 2);
  assert.deepEqual(report.byAccountStage.map((row) => row.accountStage).sort(), ['existing_account', 'new_account']);
});

test('writes private JSON and Markdown reports from valid rows only', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-growth-report-'));
  try {
    const inputFile = path.join(dir, 'local-cta.jsonl');
    const outputDir = path.join(dir, 'reports');
    await writeFile(inputFile, `${JSON.stringify({ ...event('page_view'), receivedAt: '2026-09-08T00:00:00.000Z', environment: 'local-preview' })}\n{"bad":true}\n`);
    const result = await buildGrowthReport({ inputFile, outputDir });
    assert.equal(result.report.totals.events, 1);
    assert.deepEqual(result.report.quality, { inputRows: 2, validRows: 1, invalidRows: 1 });
    assert.match(await readFile(result.markdownPath, 'utf8'), /Measurable sessions: 1/);
    assert.match(await readFile(result.markdownPath, 'utf8'), /Confirmed registrations: null/);
    assert.match(await readFile(result.markdownPath, 'utf8'), /Countries/);
    assert.match(await readFile(result.markdownPath, 'utf8'), /Platforms/);
    assert.match(await readFile(result.markdownPath, 'utf8'), /Experiment Readiness/);
    assert.match(await readFile(result.markdownPath, 'utf8'), /CTA Drop-off Queues/);
    assert.match(await readFile(result.jsonPath, 'utf8'), /"qualifiedAccounts": null/);
    assert.deepEqual(result.report.byDate.map((row) => row.date), ['2026-09-08']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('week-over-week compares the previous equal UTC window without partner outcomes', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-growth-wow-'));
  try {
    const inputFile = path.join(dir, 'events.jsonl');
    const currentSession = randomUUID();
    const previousSession = randomUUID();
    const rows = [
      { ...event('page_view', { session: previousSession }), receivedAt: '2026-09-07T00:00:00.000Z', environment: 'production' },
      { ...event('referral_click', { session: previousSession, platform: 'binance' }), receivedAt: '2026-09-07T01:00:00.000Z', environment: 'production' },
      { ...event('page_view', { session: currentSession, source: 'telegram', publisher: 'telegram' }), receivedAt: '2026-09-14T00:00:00.000Z', environment: 'production' },
      { ...event('decision_select', { session: currentSession, decision: 'bitget', source: 'telegram', publisher: 'telegram' }), receivedAt: '2026-09-14T00:10:00.000Z', environment: 'production' },
      { ...event('cta_visible', { session: currentSession, platform: 'bitget', source: 'telegram', publisher: 'telegram' }), receivedAt: '2026-09-14T00:12:00.000Z', environment: 'production' },
      { ...event('outbound_handoff', { session: currentSession, platform: 'bitget', source: 'telegram', publisher: 'telegram' }), receivedAt: '2026-09-14T00:13:00.000Z', environment: 'production' },
      { ...event('referral_click', { session: currentSession, platform: 'bitget', source: 'telegram', publisher: 'telegram' }), receivedAt: '2026-09-14T00:14:00.000Z', environment: 'production' },
    ];
    await writeFile(inputFile, rows.map(JSON.stringify).join('\n') + '\n');
    const { report, markdownPath } = await buildGrowthReport({
      inputFile,
      outputDir: path.join(dir, 'reports'),
      environment: 'production',
      fromUtc: '2026-09-14T00:00:00Z',
      toUtc: '2026-09-21T00:00:00Z',
    });

    assert.equal(report.weekOverWeek.status, 'READY');
    assert.equal(report.weekOverWeek.current.referralClicks, 1);
    assert.equal(report.weekOverWeek.previous.referralClicks, 1);
    assert.equal(report.weekOverWeek.delta.decisionSelections, 1);
    assert.equal(report.totals.confirmedRegistrations, null);
    assert.equal(report.byEntry[0].source, 'telegram');
    assert.equal(report.byPlatform[0].platform, 'bitget');
    const markdown = await readFile(markdownPath, 'utf8');
    assert.match(markdown, /Week Over Week/);
    assert.match(markdown, /confirmed registrations: null/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('production report uses UTC start-inclusive/end-exclusive selection and excludes smoke', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-growth-window-'));
  try {
    const inputFile = path.join(dir, 'events.jsonl');
    const rows = [
      { ...event('page_view'), receivedAt: '2026-09-13T23:59:59.999Z', environment: 'production' },
      { ...event('page_view'), receivedAt: '2026-09-14T00:00:00.000Z', environment: 'production' },
      { ...event('referral_click'), receivedAt: '2026-09-14T10:00:00.000Z', environment: 'production' },
      { ...event('page_view'), receivedAt: '2026-09-15T00:00:00.000Z', environment: 'production' },
      { ...event('page_view'), receivedAt: '2026-09-14T12:00:00.000Z', environment: 'smoke' },
      { ...event('page_view'), receivedAt: 'bad-date', environment: 'production' },
    ];
    await writeFile(inputFile, rows.map(JSON.stringify).join('\n') + '\n{"partial":');
    const options = { inputFile, outputDir: path.join(dir, 'reports'), environment: 'production', fromUtc: '2026-09-14T00:00:00Z', toUtc: '2026-09-15T00:00:00Z' };
    const { report, markdownPath } = await buildGrowthReport(options);
    assert.equal(report.status, 'INSUFFICIENT_SAMPLE');
    assert.equal(report.sampleReadiness.status, 'INSUFFICIENT_SAMPLE');
    assert.equal(report.totals.events, 2);
    assert.equal(report.totals.uniqueVisitors, 1);
    assert.equal(report.totals.referralClicks, 1);
    assert.deepEqual(report.quality, { inputRows: 7, validRows: 2, invalidRows: 2 });
    assert.equal(report.selection.excludedRows, 3);
    assert.equal(report.selection.endExclusive, true);
    assert.match(await readFile(markdownPath, 'utf8'), /Environment: production/);
    assert.equal((await buildGrowthReport({ ...options, environment: 'smoke' })).report.totals.events, 1);
    await assert.rejects(buildGrowthReport({ ...options, fromUtc: '2026-09-14T00:00:00+08:00' }), /FROM_UTC_INVALID/);
    await assert.rejects(buildGrowthReport({ ...options, fromUtc: '2026-02-30T00:00:00Z' }), /FROM_UTC_INVALID/);
    await assert.rejects(buildGrowthReport({ ...options, toUtc: options.fromUtc }), /RANGE_INVALID/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('production report includes rotated private CTA archives beside an empty active file', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-growth-rotated-'));
  try {
    const analyticsDir = path.join(dir, 'analytics');
    await mkdir(analyticsDir);
    const inputFile = path.join(analyticsDir, 'production.jsonl');
    const archiveFile = path.join(analyticsDir, 'production.jsonl-20260926');
    const session = randomUUID();
    await writeFile(inputFile, '');
    await writeFile(archiveFile, [
      { ...event('page_view', { session }), receivedAt: '2026-09-26T03:00:00.000Z', environment: 'production' },
      { ...event('referral_click', { session, platform: 'bitget' }), receivedAt: '2026-09-26T03:01:00.000Z', environment: 'production' },
    ].map(JSON.stringify).join('\n') + '\n');

    const { report } = await buildGrowthReport({
      inputFile,
      outputDir: path.join(dir, 'reports'),
      environment: 'production',
      fromUtc: '2026-09-26T00:00:00Z',
      toUtc: '2026-09-27T00:00:00Z',
    });

    assert.equal(report.status, 'INSUFFICIENT_SAMPLE');
    assert.equal(report.totals.events, 2);
    assert.equal(report.totals.referralClicks, 1);
    assert.deepEqual(report.selection.sourceFiles, [archiveFile, inputFile]);
    assert.match(report.notes[0], /rotated CTA archive files/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('missing input means unknown counts while an empty selection only means no recorded events', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-growth-missing-'));
  try {
    const inputFile = path.join(dir, 'missing.jsonl');
    const options = { inputFile, outputDir: path.join(dir, 'reports'), environment: 'production' };
    const missing = await buildGrowthReport(options);
    assert.equal(missing.report.status, 'INPUT_MISSING');
    assert.ok(Object.values(missing.report.totals).every((count) => count === null));
    assert.equal(missing.report.dropOffQueues.status, 'INPUT_MISSING');
    assert.equal(missing.report.dropOffQueues.visible_no_click_pages, null);
    assert.equal(missing.report.dropOffQueues.placement_visible_no_click, null);
    const markdown = await readFile(missing.markdownPath, 'utf8');
    assert.match(markdown, /unknown/);
    assert.doesNotMatch(markdown, /Unique visitors: 0/);
    await writeFile(inputFile, '');
    const empty = await buildGrowthReport(options);
    assert.equal(empty.report.status, 'INSUFFICIENT_SAMPLE');
    assert.equal(empty.report.totals.events, 0);
    assert.match(empty.report.notes[0], /does not prove zero visitors/);
    const emptyMarkdown = await readFile(empty.markdownPath, 'utf8');
    assert.match(emptyMarkdown, /not recorded \\| unknown/);
    assert.equal(emptyMarkdown.includes('| none | 0 | 0 | 0'), false);
    assert.match(emptyMarkdown, /Measurable sessions: unknown/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('marks the private CTA report ready only after minimum first-party sessions', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-growth-ready-'));
  try {
    const inputFile = path.join(dir, 'events.jsonl');
    const rows = [];
    for (let index = 0; index < 10; index += 1) {
      const session = randomUUID();
      rows.push({ ...event('page_view', { session, source: 'direct', publisher: 'creator_a' }), receivedAt: `2026-09-14T00:${String(index).padStart(2, '0')}:00.000Z`, environment: 'production' });
    }
    rows.push({ ...event('telegram_handoff', { session: randomUUID(), source: 'direct', publisher: 'creator_a' }), receivedAt: '2026-09-14T01:00:00.000Z', environment: 'production' });
    await writeFile(inputFile, rows.map(JSON.stringify).join('\n') + '\n');

    const { report, markdownPath } = await buildGrowthReport({
      inputFile,
      outputDir: path.join(dir, 'reports'),
      environment: 'production',
      fromUtc: '2026-09-14T00:00:00Z',
      toUtc: '2026-09-15T00:00:00Z',
    });

    assert.equal(report.status, 'READY');
    assert.equal(report.sampleReadiness.status, 'READY');
    assert.equal(report.sampleReadiness.minimumSessions, 10);
    assert.equal(report.dropOffQueues.status, 'READY');
    assert.equal(report.telegramSignals.status, 'INSUFFICIENT_SAMPLE');
    assert.equal(report.telegramSignals.handoffSessions, 1);
    assert.equal(report.telegramSignals.partnerSideOutcomes.commissions, null);
    const markdown = await readFile(markdownPath, 'utf8');
    assert.match(markdown, /Sample readiness: READY/);
    assert.match(markdown, /## Telegram Signals/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});


test('mixed collector metadata preserves all valid old and new events and selected release counts', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-provenance-report-'));
  try {
    const inputFile = path.join(dir, 'events.jsonl');
    const session = randomUUID();
    const persisted = (type, metadata = {}, day = '14', environment = 'production') => ({
      ...event(type, { session }), receivedAt: `2026-09-${day}T01:00:00.000Z`, environment, ...metadata,
    });
    const rows = [
      persisted('page_view'),
      persisted('decision_impression', { collectorRelease: null }),
      persisted('decision_select', { collectorRelease: 'R58' }),
      persisted('cta_visible', { collectorRelease: 'R58' }),
      persisted('outbound_handoff', { collectorRelease: 'R59' }),
      persisted('referral_click', { collectorRelease: 'R59' }),
      persisted('telegram_handoff', { collectorRelease: 'R59' }),
      persisted('page_view', { collectorRelease: 'R57' }, '13'),
      persisted('page_view', { collectorRelease: 'SMOKE' }, '14', 'smoke'),
    ];
    await writeFile(inputFile, rows.map(JSON.stringify).join('\n') + '\n');
    const result = await buildGrowthReport({ inputFile, outputDir: path.join(dir, 'reports'), environment: 'production',
      fromUtc: '2026-09-14T00:00:00Z', toUtc: '2026-09-15T00:00:00Z' });
    const { report } = result;
    assert.deepEqual(report.quality, { inputRows: 9, validRows: 7, invalidRows: 0 });
    assert.equal(report.selection.excludedRows, 2);
    assert.equal(report.totals.events, 7);
    assert.equal(report.totals.uniqueSessions, 1);
    for (const metric of ['uniquePageViews', 'decisionImpressions', 'decisionSelections', 'visibleCtas', 'outboundHandoffs', 'referralClicks', 'telegramHandoffs']) {
      assert.equal(report.totals[metric], 1, metric);
    }
    assert.equal(report.collectorProvenance.knownRecords, 5);
    assert.equal(report.collectorProvenance.unknownRecords, 2);
    assert.deepEqual(report.collectorProvenance.byRelease, [{ collectorRelease: 'R58', records: 2 }, { collectorRelease: 'R59', records: 3 }]);
    const markdown = await readFile(result.markdownPath, 'utf8');
    assert.match(markdown, /Unknown release records: 2/);
    assert.match(markdown, /\| R59 \| 3 \|/);
    assert.match(report.collectorProvenance.boundary, /not identify web build, natural visitors or internal QA/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('invalid stored release metadata stays unknown without inventing provenance; missing source stays unknown', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-provenance-unknown-'));
  try {
    const inputFile = path.join(dir, 'events.jsonl');
    const missing = await buildGrowthReport({ inputFile, outputDir: path.join(dir, 'reports'), environment: 'production' });
    assert.equal(missing.report.collectorProvenance.status, 'INPUT_MISSING');
    assert.equal(missing.report.collectorProvenance.unknownRecords, null);
    const rows = ['', 'R58\n', 'x'.repeat(121), { release: 'R58' }].map(collectorRelease => ({
      ...event('page_view'), receivedAt: '2026-09-14T01:00:00.000Z', environment: 'production', collectorRelease,
    }));
    await writeFile(inputFile, rows.map(JSON.stringify).join('\n') + '\n');
    const result = await buildGrowthReport({ inputFile, outputDir: path.join(dir, 'reports'), environment: 'production' });
    assert.equal(result.report.totals.events, 4);
    assert.equal(result.report.collectorProvenance.unknownRecords, 4);
    assert.equal(result.report.collectorProvenance.knownRecords, 0);
    assert.deepEqual(result.report.collectorProvenance.byRelease, []);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

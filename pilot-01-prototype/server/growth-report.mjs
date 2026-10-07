#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CTA_ENVIRONMENTS, validateCta } from './cta-collector.mjs';
import { experimentRegistry } from '../src/data/experiment-registry.js';
import { isTelegramSource } from '../src/data/analytics-event-contract.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PARTNER_SIDE_OUTCOMES = Object.freeze({
  registrations: null,
  kyc: null,
  deposits: null,
  trades: null,
  commissions: null,
  status: 'UNAVAILABLE',
  reason: 'No official partner API, webhook or reviewed private import is connected to this first-party CTA report.',
});
const MINIMUM_CTA_SAMPLE_SESSIONS = 10;
const FUNNEL_EVENT_TAXONOMY = Object.freeze([
  Object.freeze({ type: 'page_view', stage: 'entry_or_content_view', observed: true, partnerSide: false }),
  Object.freeze({ type: 'decision_impression', stage: 'internal_decision_impression', observed: true, partnerSide: false }),
  Object.freeze({ type: 'decision_select', stage: 'comparison_or_choice_intent', observed: true, partnerSide: false }),
  Object.freeze({ type: 'cta_visible', stage: 'onsite_cta_exposure', observed: true, partnerSide: false }),
  Object.freeze({ type: 'outbound_handoff', stage: 'onsite_external_handoff_attempt', observed: true, partnerSide: false }),
  Object.freeze({ type: 'referral_click', stage: 'qualified_external_cta_click', observed: true, partnerSide: false }),
  Object.freeze({ type: 'telegram_handoff', stage: 'onsite_telegram_handoff', observed: true, partnerSide: false }),
  Object.freeze({ type: 'partner_registration', stage: 'partner_side_registration', observed: false, partnerSide: true, value: null }),
  Object.freeze({ type: 'partner_kyc', stage: 'partner_side_kyc', observed: false, partnerSide: true, value: null }),
  Object.freeze({ type: 'partner_deposit', stage: 'partner_side_deposit', observed: false, partnerSide: true, value: null }),
  Object.freeze({ type: 'partner_trade', stage: 'partner_side_trade', observed: false, partnerSide: true, value: null }),
  Object.freeze({ type: 'partner_commission', stage: 'private_partner_commission', observed: false, partnerSide: true, value: null }),
]);
const ONSITE_JOURNEY_STAGES = Object.freeze([
  Object.freeze({ id: 'regional_product_selection', label: 'Region or product selection', measuredBy: 'page_view or decision_select carrying sanitized market/product context' }),
  Object.freeze({ id: 'shortlist_review', label: 'Shortlist review', measuredBy: 'directory, market, home selector or shortlist-style first-party page/decision activity' }),
  Object.freeze({ id: 'platform_compare', label: 'Platform comparison', measuredBy: 'comparison pages or pairwise comparison decisions' }),
  Object.freeze({ id: 'platform_detail', label: 'Platform detail review', measuredBy: 'first-party /exchanges/... detail page activity' }),
  Object.freeze({ id: 'external_handoff', label: 'External CTA handoff', measuredBy: 'outbound_handoff or referral_click events only' }),
  Object.freeze({ id: 'telegram_handoff', label: 'Telegram handoff', measuredBy: 'telegram_handoff events from NexuAlpha to Telegram' }),
  Object.freeze({ id: 'telegram_return', label: 'Telegram return', measuredBy: 'first-party events whose source or publisher is telegram' }),
]);

export async function buildGrowthReport({ inputFile, outputDir, fromUtc, toUtc, environment } = {}) {
  const sourceFile = inputFile || process.env.CTA_DATA_FILE || path.join(root, '.private', 'analytics', 'local-cta.jsonl');
  const targetDir = outputDir || process.env.GROWTH_REPORT_DIR || path.join(root, '.private', 'analytics', 'reports');
  const selectedEnvironment = environment || process.env.GROWTH_REPORT_ENVIRONMENT || process.env.CTA_ENVIRONMENT || 'local-preview';
  const report = await buildGrowthReportData({ inputFile: sourceFile, fromUtc, toUtc, environment: selectedEnvironment });
  await mkdir(targetDir, { recursive: true, mode: 0o700 });
  const jsonPath = path.join(targetDir, 'growth-report.json');
  const markdownPath = path.join(targetDir, 'growth-report.md');
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  await writeFile(markdownPath, renderMarkdown(report), { mode: 0o600 });
  return { report, jsonPath, markdownPath };
}

export async function buildGrowthReportData({ inputFile, fromUtc, toUtc, environment } = {}) {
  const sourceFile = inputFile || process.env.CTA_DATA_FILE || path.join(root, '.private', 'analytics', 'local-cta.jsonl');
  const selectedEnvironment = environment || process.env.GROWTH_REPORT_ENVIRONMENT || process.env.CTA_ENVIRONMENT || 'local-preview';
  if (!CTA_ENVIRONMENTS.has(selectedEnvironment)) throw new Error('GROWTH_REPORT_ENVIRONMENT_INVALID');
  const from = parseUtc(fromUtc ?? process.env.GROWTH_REPORT_FROM_UTC, 'FROM');
  const to = parseUtc(toUtc ?? process.env.GROWTH_REPORT_TO_UTC, 'TO');
  if (from !== null && to !== null && from >= to) throw new Error('GROWTH_REPORT_RANGE_INVALID');
  const input = await readRows(sourceFile);
  const validRows = input.rows.filter((row) => validateCta(toClientEvent(row))
    && CTA_ENVIRONMENTS.has(row.environment || 'local-preview') && Number.isFinite(Date.parse(row.receivedAt)));
  const selected = validRows.filter((row) => (row.environment || 'local-preview') === selectedEnvironment
    && (from === null || Date.parse(row.receivedAt) >= from) && (to === null || Date.parse(row.receivedAt) < to));
  const report = summarize(selected.map(toReportEvent), sourceFile, {
    inputRows: input.rows.length + input.invalidJsonRows,
    invalidRows: input.rows.length - validRows.length + input.invalidJsonRows,
  });
  report.sampleReadiness = sampleReadinessFor(report);
  report.status = input.missing ? 'INPUT_MISSING' : report.sampleReadiness.status;
  report.selection = { environment: selectedEnvironment, fromUtc: from === null ? null : new Date(from).toISOString(),
    toUtc: to === null ? null : new Date(to).toISOString(), endExclusive: true, excludedRows: validRows.length - selected.length,
    sourceFiles: input.files };
  report.weekOverWeek = comparePreviousWindow(validRows, selectedEnvironment, from, to);
  if (input.missing) {
    report.totals = Object.fromEntries(Object.keys(report.totals).map((key) => [key, null]));
    report.collectorProvenance = { ...report.collectorProvenance, status: 'INPUT_MISSING', knownRecords: null, unknownRecords: null, byRelease: [] };
    report.dataQuality = inputMissingDataQuality();
    report.firstPartyFunnelStages = inputMissingFunnelStages();
    report.dropOffQueues = inputMissingDropOffQueues();
    report.weekOverWeek = inputMissingComparison();
    report.telegramSignals = inputMissingTelegramSignals();
    report.sampleReadiness = inputMissingSampleReadiness();
    report.notes.unshift('The input file is missing. Traffic and CTA counts are unknown; this is not evidence of zero traffic.');
  } else if (report.sampleReadiness.status === 'INSUFFICIENT_SAMPLE') {
    report.notes.unshift(report.sampleReadiness.reason);
  }
  if (input.files.length > 1) {
    report.notes.unshift('The report includes rotated CTA archive files from the same private analytics directory, so an empty active JSONL file after log rotation is not treated as missing historical data.');
  }
  return report;
}

function toClientEvent(row) {
  const { receivedAt, environment, collectorRelease, ...event } = row || {};
  void receivedAt;
  void environment;
  void collectorRelease;
  return event;
}

// This is collector write provenance, not web build identity or human/QA classification.
function summarizeCollectorProvenance(rows) {
  const counts = new Map();
  let unknownRecords = 0;
  for (const row of rows) {
    const release = row.collectorRelease;
    if (typeof release !== 'string' || release.length < 1 || release.length > 120
      || /[^A-Za-z0-9._-]/.test(release)) {
      unknownRecords += 1;
    } else {
      counts.set(release, (counts.get(release) || 0) + 1);
    }
  }
  return {
    status: 'AVAILABLE',
    knownRecords: rows.length - unknownRecords,
    unknownRecords,
    byRelease: [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([collectorRelease, records]) => ({ collectorRelease, records })),
    boundary: 'Counts cover valid records in the selected environment and UTC interval. Missing, null or invalid release metadata is unknown; historical releases are not inferred. Collector release does not identify web build, natural visitors or internal QA.',
  };
}

function toReportEvent(row) {
  const { environment, ...event } = row || {};
  void environment;
  return event;
}

export function summarize(rows, sourceFile = null, quality = {}) {
  const dates = new Map();
  const countries = new Map();
  const pages = new Map();
  const sources = new Map();
  const publishers = new Map();
  const markets = new Map();
  const locales = new Map();
  const campaigns = new Map();
  const accountStages = new Map();
  const fundingRoutes = new Map();
  const products = new Map();
  const devices = new Map();
  const entries = new Map();
  const platforms = new Map();
  const experiments = new Map();
  const pageViewKeys = new Set();
  const visitorSessions = new Set();
  const referralClickKeys = new Set();
  const visibleCtaKeys = new Set();
  const visibleCtaPageKeys = new Set();
  const outboundHandoffKeys = new Set();
  const telegramHandoffKeys = new Set();
  const clickingSessions = new Set();
  const decisionImpressionKeys = new Set();
  const decisionKeys = new Set();

  for (const row of rows) {
    const market = row.version === 2 ? row.market : 'unknown';
    const country = countryFromMarket(market);
    const product = row.version === 2 ? row.product : 'unknown';
    const source = row.source || 'direct';
    const publisher = row.version === 2 && row.publisher ? row.publisher : 'unknown';
    const locale = row.locale || 'unknown';
    const campaign = row.version === 2 && row.campaign ? row.campaign : 'unknown';
    const accountStage = row.version === 2 && row.accountStage ? row.accountStage : 'unknown';
    const funding = row.version === 2 && row.funding ? row.funding : 'unknown';
    const device = row.version === 2 && row.device ? row.device : 'unknown';
    const experiment = row.version === 2 && row.experiment ? row.experiment : 'none';
    const variant = row.version === 2 && row.variant ? row.variant : 'control';
    const experimentKey = `${experiment}:${variant}`;
    const entry = entryFrom(row);
    const platform = platformFrom(row);
    const date = dateFrom(row);
    const pageKey = `${row.page}|${market}|${product}`;
    const keys = eventKeys(row, market, product);

    if (row.type === 'page_view') {
      pageViewKeys.add(keys.pageView);
      visitorSessions.add(row.session);
    }
    if (row.type === 'referral_click') {
      referralClickKeys.add(keys.referralClick);
      clickingSessions.add(row.session);
    }
    if (row.type === 'cta_visible') {
      visibleCtaKeys.add(keys.ctaVisible);
      visibleCtaPageKeys.add(keys.pageView);
    }
    if (row.type === 'outbound_handoff') {
      outboundHandoffKeys.add(keys.outboundHandoff);
      clickingSessions.add(row.session);
    }
    if (row.type === 'telegram_handoff') telegramHandoffKeys.add(keys.telegramHandoff);
    if (row.type === 'decision_impression') decisionImpressionKeys.add(keys.decisionImpression);
    if (row.type === 'decision_select') decisionKeys.add(keys.decision);

    if (date) addBucket(dates, date, { date }, row, keys);
    addBucket(countries, country, { country, market }, row, keys);
    addBucket(pages, pageKey, { page: row.page, market, product }, row, keys);
    addBucket(markets, market, { market }, row, keys);
    addBucket(locales, locale, { locale }, row, keys);
    addBucket(campaigns, campaign, { campaign }, row, keys);
    addBucket(accountStages, accountStage, { accountStage }, row, keys);
    addBucket(fundingRoutes, funding, { funding }, row, keys);
    addBucket(products, product, { product }, row, keys);
    addBucket(devices, device, { device }, row, keys);
    addBucket(entries, entry.entry, entry, row, keys);
    addBucket(platforms, platform, { platform }, row, keys);
    addBucket(experiments, experimentKey, { experiment, variant }, row, keys);
    addBucket(sources, source, { source }, row, keys);
    addBucket(publishers, publisher, { publisher }, row, keys);
  }

  const byExperiment = serializeBuckets(experiments).sort(byClicksThenVisitors);
  const experimentReadouts = summarizeExperimentReadouts(byExperiment);
  const dataQuality = summarizeDataQuality({
    rows,
    quality,
    visitorSessions,
    pageViewKeys,
    decisionKeys,
    decisionImpressionKeys,
    visibleCtaKeys,
    outboundHandoffKeys,
    telegramHandoffKeys,
    referralClickKeys,
  });

  return {
    generatedAt: new Date().toISOString(),
    sourceFile,
    quality: {
      inputRows: Number.isInteger(quality.inputRows) ? quality.inputRows : rows.length,
      validRows: rows.length,
      invalidRows: Number.isInteger(quality.invalidRows) ? quality.invalidRows : 0,
    },
    collectorProvenance: summarizeCollectorProvenance(rows),
    totals: {
      events: rows.length,
      uniqueSessions: visitorSessions.size,
      uniqueVisitors: visitorSessions.size,
      uniquePageViews: pageViewKeys.size,
      referralClicks: referralClickKeys.size,
      visibleCtas: visibleCtaKeys.size,
      visibleCtaPageViews: visibleCtaPageKeys.size,
      outboundHandoffs: outboundHandoffKeys.size,
      telegramHandoffs: telegramHandoffKeys.size,
      clickingSessions: clickingSessions.size,
      decisionImpressions: decisionImpressionKeys.size,
      decisionSelections: decisionKeys.size,
      confirmedRegistrations: null,
      qualifiedAccounts: null,
    },
    partnerSideOutcomes: { ...PARTNER_SIDE_OUTCOMES },
    eventTaxonomy: FUNNEL_EVENT_TAXONOMY.map((item) => ({ ...item })),
    firstPartyFunnelStages: buildFirstPartyFunnelStages({
      uniquePageViews: pageViewKeys.size,
      decisionImpressions: decisionImpressionKeys.size,
      decisionSelections: decisionKeys.size,
      visibleCtas: visibleCtaKeys.size,
      outboundHandoffs: outboundHandoffKeys.size,
      referralClicks: referralClickKeys.size,
      telegramHandoffs: telegramHandoffKeys.size,
    }),
    onsiteJourney: buildOnsiteJourney(rows),
    dropOffQueues: buildDropOffQueues(rows),
    telegramSignals: buildTelegramSignals(rows),
    dataQuality,
    funnel: funnelRates({
      uniqueVisitors: visitorSessions.size,
      uniquePageViews: pageViewKeys.size,
      decisionImpressions: decisionImpressionKeys.size,
      decisionSelections: decisionKeys.size,
      visibleCtas: visibleCtaKeys.size,
      visibleCtaPageViews: visibleCtaPageKeys.size,
      referralClicks: referralClickKeys.size,
      outboundHandoffs: outboundHandoffKeys.size,
      clickingSessions: clickingSessions.size,
    }),
    byDate: serializeBuckets(dates).sort((a, b) => a.date.localeCompare(b.date)),
    byCountry: serializeBuckets(countries).sort(byClicksThenVisitors),
    byMarket: serializeBuckets(markets).sort(byClicksThenVisitors),
    byLocale: serializeBuckets(locales).sort(byClicksThenVisitors),
    byCampaign: serializeBuckets(campaigns).sort(byClicksThenVisitors),
    byAccountStage: serializeBuckets(accountStages).sort(byClicksThenVisitors),
    byFunding: serializeBuckets(fundingRoutes).sort(byClicksThenVisitors),
    byProduct: serializeBuckets(products).sort(byClicksThenVisitors),
    byDevice: serializeBuckets(devices).sort(byClicksThenVisitors),
    byEntry: serializeBuckets(entries).sort(byClicksThenVisitors),
    byPlatform: serializeBuckets(platforms).filter((row) => row.platform !== 'none').sort(byClicksThenVisitors),
    byExperiment,
    experimentReadouts,
    byPage: serializeBuckets(pages).sort(byClicksThenVisitors),
    bySource: serializeBuckets(sources).sort(byClicksThenVisitors),
    byPublisher: serializeBuckets(publishers).sort(byClicksThenVisitors),
    notes: [
      'Unique visitors are distinct page-view sessions; they are not verified people or residents.',
      'The uniqueVisitors field is a legacy-compatible name for measurable page-view sessions; use uniqueSessions for the same first-party count.',
      'Referral-click events are persisted by page, platform, placement and decision context; the headline referralClicks metric remains unique by session and platform.',
      'Telegram handoffs measure anonymous NexuAlpha-to-Telegram exits and remain separate from Telegram returns and partner-side outcomes.',
      'Country is derived from the existing market field; it is a planning dimension, not a verified user residence.',
      'Entry combines first-party source, campaign and publisher fields; it does not store referrers, IP addresses, emails or account identifiers.',
      'This report measures first-party onsite events only; referral clicks, outbound handoffs and Telegram entries are not partner registrations.',
      'Confirmed registrations, KYC, deposits, trades, commissions and qualified accounts remain null until a private partner reconciliation or reviewed import is connected.',
      'Experiment readouts never declare a winner from low sample, designed-only status or third-party outcome gaps.',
      'The report excludes invalid rows by the same collector validator used by the local preview endpoint.',
    ],
  };
}

function sampleReadinessFor(report) {
  const sessions = report.totals.uniqueSessions;
  const selectedEvents = report.totals.events;
  const minimumSessions = MINIMUM_CTA_SAMPLE_SESSIONS;
  if (selectedEvents === 0) {
    return {
      status: 'INSUFFICIENT_SAMPLE',
      minimumSessions,
      observedSessions: 0,
      selectedEvents: 0,
      reason: 'No recorded events match this environment and UTC interval. This alone does not prove zero visitors or a healthy collector.',
      boundary: 'Empty or low-sample first-party CTA windows are operating inputs, not conversion proof.',
    };
  }
  if (sessions < minimumSessions) {
    return {
      status: 'INSUFFICIENT_SAMPLE',
      minimumSessions,
      observedSessions: sessions,
      selectedEvents,
      reason: `Only ${sessions} measurable sessions were observed; at least ${minimumSessions} are required before using the CTA report as an operating queue.`,
      boundary: 'Low first-party sample can show instrumentation health and examples, but not reliable funnel movement or conversion lift.',
    };
  }
  return {
    status: 'READY',
    minimumSessions,
    observedSessions: sessions,
    selectedEvents,
    reason: 'The selected CTA window has enough first-party sessions for operating queues and week-over-week review.',
    boundary: 'Ready means first-party operating readiness only. Partner registrations, KYC, deposits, trades and commissions remain unavailable.',
  };
}

function inputMissingSampleReadiness() {
  return {
    status: 'INPUT_MISSING',
    minimumSessions: MINIMUM_CTA_SAMPLE_SESSIONS,
    observedSessions: null,
    selectedEvents: null,
    reason: 'CTA input is missing; sample readiness is unknown, not zero.',
    boundary: 'Missing input cannot support funnel movement, drop-off queues or conversion-lift claims.',
  };
}

function comparePreviousWindow(validRows, environment, from, to) {
  if (from === null || to === null) {
    return {
      status: 'RANGE_REQUIRED',
      current: null,
      previous: null,
      delta: null,
      notes: ['Provide both GROWTH_REPORT_FROM_UTC and GROWTH_REPORT_TO_UTC to compare against the immediately preceding equal UTC window.'],
    };
  }
  const duration = to - from;
  const previousFrom = from - duration;
  const previousTo = from;
  const currentRows = validRows.filter((row) => (row.environment || 'local-preview') === environment
    && Date.parse(row.receivedAt) >= from && Date.parse(row.receivedAt) < to);
  const previousRows = validRows.filter((row) => (row.environment || 'local-preview') === environment
    && Date.parse(row.receivedAt) >= previousFrom && Date.parse(row.receivedAt) < previousTo);
  const current = comparisonSnapshot(currentRows.map(toReportEvent));
  const previous = comparisonSnapshot(previousRows.map(toReportEvent));
  return {
    status: 'READY',
    window: {
      currentFromUtc: new Date(from).toISOString(),
      currentToUtc: new Date(to).toISOString(),
      previousFromUtc: new Date(previousFrom).toISOString(),
      previousToUtc: new Date(previousTo).toISOString(),
      endExclusive: true,
    },
    current,
    previous,
    delta: Object.fromEntries(Object.keys(current).map((key) => [
      key,
      current[key] === null || previous[key] === null ? null : current[key] - previous[key],
    ])),
    notes: [
      'Week-over-week compares recorded first-party CTA events only.',
      'Registration, KYC, deposit, trade and commission outcomes remain unavailable without a private partner import.',
    ],
  };
}

function inputMissingComparison() {
  return {
    status: 'INPUT_MISSING',
    current: null,
    previous: null,
    delta: null,
    notes: ['The CTA input file is missing; current and previous funnel movement are unknown, not zero.'],
  };
}

function inputMissingDataQuality() {
  return {
    status: 'INPUT_MISSING',
    inputRows: null,
    validRows: null,
    invalidRows: null,
    selectedEvents: null,
    observedEventTypes: [],
    measurableSessions: null,
    uniquePageViews: null,
    decisionImpressions: null,
    decisionSelections: null,
    visibleCtas: null,
    outboundHandoffs: null,
    telegramHandoffs: null,
    referralClicks: null,
    issues: ['input_missing'],
    boundary: 'CTA input is missing; quality and funnel completeness are unknown, not zero.',
  };
}

function inputMissingFunnelStages() {
  return [
    'first_party_surface_impression',
    'internal_decision_impression',
    'internal_decision_selection',
    'partner_cta_exposure',
    'onsite_external_handoff_attempt',
    'qualified_external_cta_click',
    'onsite_telegram_handoff',
    'partner_side_registration',
    'partner_side_kyc',
    'partner_side_deposit',
    'partner_side_trade',
    'private_partner_commission',
  ].map((stage) => ({
    stage,
    value: null,
    valueStatus: 'input_missing',
    partnerSide: stage.startsWith('partner_side_') || stage === 'private_partner_commission',
    boundary: 'CTA input is missing; this stage is unknown, not zero.',
  }));
}

function buildFirstPartyFunnelStages({ uniquePageViews, decisionImpressions, decisionSelections, visibleCtas, outboundHandoffs, referralClicks, telegramHandoffs }) {
  const observed = (stage, value, boundary) => ({
    stage,
    value,
    valueStatus: value > 0 ? 'observed_positive' : 'observed_zero',
    partnerSide: false,
    boundary,
  });
  const unavailable = (stage) => ({
    stage,
    value: null,
    valueStatus: 'unknown_unavailable',
    partnerSide: true,
    boundary: 'No official partner API, webhook or reviewed private import is connected to this first-party CTA report.',
  });
  return [
    observed('first_party_surface_impression', uniquePageViews, 'Bounded first-party page-view denominators. These can include internal decision or Telegram surfaces when the frontend emits sanitized growth context.'),
    observed('internal_decision_impression', decisionImpressions, 'Recorded first-party decision_impression events only. Zero means no valid decision module or Telegram decision CTA exposure was recorded in this input window.'),
    observed('internal_decision_selection', decisionSelections, 'Recorded first-party decision_select events only. Zero means no valid decision selection was recorded in this input window.'),
    observed('partner_cta_exposure', visibleCtas, 'Recorded partner CTA visibility events only. Zero means no valid partner CTA exposure was recorded in this input window.'),
    observed('onsite_external_handoff_attempt', outboundHandoffs, 'Recorded first-party outbound handoff attempts only. Zero means no valid handoff was recorded in this input window.'),
    observed('qualified_external_cta_click', referralClicks, 'Recorded first-party referral-click events only. These are not partner registrations.'),
    observed('onsite_telegram_handoff', telegramHandoffs, 'Recorded NexuAlpha-to-Telegram handoffs only. Zero means no valid Telegram handoff was recorded in this input window.'),
    unavailable('partner_side_registration'),
    unavailable('partner_side_kyc'),
    unavailable('partner_side_deposit'),
    unavailable('partner_side_trade'),
    unavailable('private_partner_commission'),
  ];
}

function inputMissingDropOffQueues() {
  return {
    status: 'INPUT_MISSING',
    visible_no_click_pages: null,
    decision_no_handoff_pages: null,
    telegram_entry_no_decision: null,
    platform_visible_no_click: null,
    placement_visible_no_click: null,
    partnerSideOutcomes: {
      registrations: null,
      kyc: null,
      deposits: null,
      trades: null,
      commissions: null,
    },
    boundary: 'CTA input is missing; drop-off queues are unknown, not zero. No session ids, raw URL queries, registrations, KYC, deposits, trades or commissions are available.',
  };
}

function inputMissingTelegramSignals() {
  return {
    status: 'INPUT_MISSING',
    handoffSessions: null,
    returnSessions: null,
    returnDecisionSessions: null,
    returnReferralClickSessions: null,
    returnReferralClicks: null,
    partnerSideOutcomes: {
      registrations: null,
      kyc: null,
      deposits: null,
      trades: null,
      commissions: null,
    },
    boundary: 'CTA input is missing; Telegram handoff, return and referral behavior are unknown, not zero.',
  };
}

function comparisonSnapshot(rows) {
  const summary = summarize(rows);
  return {
    events: summary.totals.events,
    uniqueSessions: summary.totals.uniqueSessions,
    uniquePageViews: summary.totals.uniquePageViews,
    decisionImpressions: summary.totals.decisionImpressions,
    decisionSelections: summary.totals.decisionSelections,
    visibleCtas: summary.totals.visibleCtas,
    referralClicks: summary.totals.referralClicks,
    outboundHandoffs: summary.totals.outboundHandoffs,
    telegramHandoffs: summary.totals.telegramHandoffs,
    clickingSessions: summary.totals.clickingSessions,
    partnerRegistrations: null,
    partnerKyc: null,
    partnerDeposits: null,
    partnerTrades: null,
    partnerCommissions: null,
  };
}

function buildOnsiteJourney(rows) {
  if (!rows.length) {
    return {
      status: 'NO_RECORDED_EVENTS',
      stages: ONSITE_JOURNEY_STAGES.map((stage) => ({
        ...stage,
        sessions: 0,
        pageViews: 0,
        decisions: 0,
        visibleCtas: 0,
        outboundHandoffs: 0,
        telegramHandoffs: 0,
        referralClicks: 0,
      })),
      byMarketProduct: [],
      telegramReturn: {
        sessions: 0,
        decisionSessions: 0,
        externalHandoffSessions: 0,
        referralClickSessions: 0,
        decisionRate: null,
        referralClickRate: null,
      },
      boundary: 'First-party anonymous journey stages only. Partner registration, KYC, deposit, trade and commission outcomes are unavailable.',
    };
  }

  const stages = new Map(ONSITE_JOURNEY_STAGES.map((stage) => [stage.id, {
    ...stage,
    _sessions: new Set(),
    _pageViews: new Set(),
    _decisions: new Set(),
    _visibleCtas: new Set(),
    _outboundHandoffs: new Set(),
    _telegramHandoffs: new Set(),
    _referralClicks: new Set(),
  }]));
  const marketProducts = new Map();
  const telegramSessions = new Map();

  for (const row of rows) {
    const market = row.version === 2 ? row.market : 'unknown';
    const product = row.version === 2 ? row.product : 'unknown';
    const keys = eventKeys(row, market, product);
    const rowStages = journeyStagesFor(row);
    for (const stageId of rowStages) {
      addJourneyStage(stages.get(stageId), row, keys);
      const marketProduct = marketProductBucket(marketProducts, market, product);
      addMarketProductStage(marketProduct, stageId, row, keys);
    }
    if (isTelegramReturn(row)) {
      const item = telegramSessions.get(row.session) || {
        decision: false,
        externalHandoff: false,
        referralClick: false,
      };
      if (row.type === 'decision_select') item.decision = true;
      if (row.type === 'outbound_handoff') item.externalHandoff = true;
      if (row.type === 'referral_click') item.referralClick = true;
      telegramSessions.set(row.session, item);
    }
  }

  const telegramValues = [...telegramSessions.values()];
  const telegramReturn = {
    sessions: telegramValues.length,
    decisionSessions: telegramValues.filter((row) => row.decision).length,
    externalHandoffSessions: telegramValues.filter((row) => row.externalHandoff).length,
    referralClickSessions: telegramValues.filter((row) => row.referralClick).length,
    decisionRate: ratio(telegramValues.filter((row) => row.decision).length, telegramValues.length),
    referralClickRate: ratio(telegramValues.filter((row) => row.referralClick).length, telegramValues.length),
  };

  return {
    status: 'READY',
    stages: [...stages.values()].map(serializeJourneyStage),
    byMarketProduct: [...marketProducts.values()].map(serializeMarketProductStage)
      .sort((a, b) => b.externalHandoffSessions - a.externalHandoffSessions || b.shortlistSessions - a.shortlistSessions || `${a.market}:${a.product}`.localeCompare(`${b.market}:${b.product}`))
      .slice(0, 20),
    telegramReturn,
    boundary: 'First-party anonymous journey stages only. Telegram handoff means NexuAlpha-to-Telegram; Telegram return means an explicit Telegram source alias returning onsite. These signals are not proof of registration, KYC, deposit, trade or commission.',
  };
}

function buildTelegramSignals(rows) {
  if (!rows.length) {
    return {
      status: 'INSUFFICIENT_SAMPLE',
      handoffSessions: 0,
      returnSessions: 0,
      returnDecisionSessions: 0,
      returnReferralClickSessions: 0,
      returnReferralClicks: 0,
      partnerSideOutcomes: {
        registrations: null,
        kyc: null,
        deposits: null,
        trades: null,
        commissions: null,
      },
      boundary: 'No recorded CTA events in selection. Telegram handoff, return and referral behavior are not observed; partner outcomes remain null.',
    };
  }

  const handoffSessions = new Set();
  const returnSessions = new Set();
  const returnDecisionSessions = new Set();
  const returnReferralClickSessions = new Set();
  const returnReferralClickKeys = new Set();
  const entries = new Map();

  for (const row of rows) {
    const market = row.version === 2 ? row.market : 'unknown';
    const product = row.version === 2 ? row.product : 'unknown';
    const keys = eventKeys(row, market, product);
    if (row.type === 'telegram_handoff') handoffSessions.add(row.session);
    if (!isTelegramReturn(row)) continue;
    const entry = entryFrom(row);
    const key = `${entry.entry}|${safePage(row.page)}|${market}|${product}`;
    const bucket = entries.get(key) || {
      ...entry,
      page: safePage(row.page),
      market,
      product,
      _sessions: new Set(),
      _decisions: new Set(),
      _referralClickSessions: new Set(),
      _referralClicks: new Set(),
    };
    bucket._sessions.add(row.session);
    returnSessions.add(row.session);
    if (row.type === 'decision_select') {
      bucket._decisions.add(keys.decision);
      returnDecisionSessions.add(row.session);
    }
    if (row.type === 'referral_click') {
      bucket._referralClickSessions.add(row.session);
      bucket._referralClicks.add(keys.referralClick);
      returnReferralClickSessions.add(row.session);
      returnReferralClickKeys.add(keys.referralClick);
    }
    entries.set(key, bucket);
  }

  return {
    status: returnSessions.size + handoffSessions.size < MINIMUM_CTA_SAMPLE_SESSIONS ? 'INSUFFICIENT_SAMPLE' : 'READY',
    handoffSessions: handoffSessions.size,
    returnSessions: returnSessions.size,
    returnDecisionSessions: returnDecisionSessions.size,
    returnReferralClickSessions: returnReferralClickSessions.size,
    returnReferralClicks: returnReferralClickKeys.size,
    returnDecisionRate: ratio(returnDecisionSessions.size, returnSessions.size),
    returnReferralClickRate: ratio(returnReferralClickSessions.size, returnSessions.size),
    byEntry: [...entries.values()].map((row) => ({
      entry: row.entry,
      source: row.source,
      campaign: row.campaign,
      publisher: row.publisher,
      page: row.page,
      market: row.market,
      product: row.product,
      returnSessions: row._sessions.size,
      decisions: row._decisions.size,
      referralClickSessions: row._referralClickSessions.size,
      referralClicks: row._referralClicks.size,
      partnerRegistrations: null,
      partnerCommissions: null,
    })).sort((a, b) => b.referralClicks - a.referralClicks || b.returnSessions - a.returnSessions || a.entry.localeCompare(b.entry)).slice(0, 20),
    partnerSideOutcomes: {
      registrations: null,
      kyc: null,
      deposits: null,
      trades: null,
      commissions: null,
    },
    boundary: 'Telegram handoff is NexuAlpha-to-Telegram exit. Telegram return is explicit Telegram source or publisher returning onsite. Telegram referral clicks are first-party clicks from those return sessions, not partner registrations or commissions.',
  };
}

function journeyStagesFor(row) {
  const stages = new Set();
  const page = safePage(row.page);
  const market = row.version === 2 ? row.market : 'unknown';
  const product = row.version === 2 ? row.product : 'unknown';
  const placement = row.placement || '';
  const decision = row.decision || '';
  const shortlistPage = /^\/(?:$|br(?:\/|$)|markets(?:\/|$)|exchanges\/?$|rates(?:\/|$)|topics(?:\/|$))/i.test(page);
  if ((row.type === 'page_view' || row.type === 'decision_select') && (market !== 'unknown' || product !== 'unknown')) stages.add('regional_product_selection');
  if (row.type === 'page_view' && shortlistPage) stages.add('shortlist_review');
  if (row.type === 'decision_select' && shortlistPage && /selector|shortlist|market|home/i.test(placement)) stages.add('shortlist_review');
  if (/^\/compare(?:\/|$)/i.test(page) || (row.type === 'decision_select' && /-vs-/i.test(decision))) stages.add('platform_compare');
  if (/^\/exchanges\/[^/]+/i.test(page)) stages.add('platform_detail');
  if (row.type === 'outbound_handoff' || row.type === 'referral_click') stages.add('external_handoff');
  if (row.type === 'telegram_handoff') stages.add('telegram_handoff');
  if (isTelegramReturn(row)) stages.add('telegram_return');
  return stages;
}

function isTelegramReturn(row) {
  return isTelegramSource(row.source) || (row.version === 2 && isTelegramSource(row.publisher));
}

function addJourneyStage(stage, row, keys) {
  if (!stage) return;
  stage._sessions.add(row.session);
  if (row.type === 'page_view') stage._pageViews.add(keys.pageView);
  if (row.type === 'decision_select') stage._decisions.add(keys.decision);
  if (row.type === 'cta_visible') stage._visibleCtas.add(keys.ctaVisible);
  if (row.type === 'outbound_handoff') stage._outboundHandoffs.add(keys.outboundHandoff);
  if (row.type === 'telegram_handoff') stage._telegramHandoffs.add(keys.telegramHandoff);
  if (row.type === 'referral_click') stage._referralClicks.add(keys.referralClick);
}

function serializeJourneyStage(stage) {
  return {
    id: stage.id,
    label: stage.label,
    measuredBy: stage.measuredBy,
    sessions: stage._sessions.size,
    pageViews: stage._pageViews.size,
    decisions: stage._decisions.size,
    visibleCtas: stage._visibleCtas.size,
    outboundHandoffs: stage._outboundHandoffs.size,
    telegramHandoffs: stage._telegramHandoffs.size,
    referralClicks: stage._referralClicks.size,
  };
}

function marketProductBucket(map, market, product) {
  const key = `${market}|${product}`;
  const bucket = map.get(key) || {
    market,
    product,
    _regionalProductSelectionSessions: new Set(),
    _shortlistSessions: new Set(),
    _compareSessions: new Set(),
    _detailSessions: new Set(),
    _externalHandoffSessions: new Set(),
    _telegramHandoffSessions: new Set(),
    _telegramReturnSessions: new Set(),
    _referralClicks: new Set(),
    _outboundHandoffs: new Set(),
  };
  map.set(key, bucket);
  return bucket;
}

function addMarketProductStage(bucket, stageId, row, keys) {
  if (stageId === 'regional_product_selection') bucket._regionalProductSelectionSessions.add(row.session);
  if (stageId === 'shortlist_review') bucket._shortlistSessions.add(row.session);
  if (stageId === 'platform_compare') bucket._compareSessions.add(row.session);
  if (stageId === 'platform_detail') bucket._detailSessions.add(row.session);
  if (stageId === 'external_handoff') bucket._externalHandoffSessions.add(row.session);
  if (stageId === 'telegram_handoff') bucket._telegramHandoffSessions.add(row.session);
  if (stageId === 'telegram_return') bucket._telegramReturnSessions.add(row.session);
  if (row.type === 'referral_click') bucket._referralClicks.add(keys.referralClick);
  if (row.type === 'outbound_handoff') bucket._outboundHandoffs.add(keys.outboundHandoff);
}

function serializeMarketProductStage(bucket) {
  return {
    market: bucket.market,
    product: bucket.product,
    regionalProductSelectionSessions: bucket._regionalProductSelectionSessions.size,
    shortlistSessions: bucket._shortlistSessions.size,
    compareSessions: bucket._compareSessions.size,
    detailSessions: bucket._detailSessions.size,
    externalHandoffSessions: bucket._externalHandoffSessions.size,
    telegramHandoffSessions: bucket._telegramHandoffSessions.size,
    telegramReturnSessions: bucket._telegramReturnSessions.size,
    outboundHandoffs: bucket._outboundHandoffs.size,
    referralClicks: bucket._referralClicks.size,
    partnerRegistrations: null,
    partnerCommissions: null,
  };
}

function buildDropOffQueues(rows) {
  if (!rows.length) {
    return {
      status: 'INSUFFICIENT_SAMPLE',
      visible_no_click_pages: [],
      decision_no_handoff_pages: [],
      telegram_entry_no_decision: [],
      platform_visible_no_click: [],
      placement_visible_no_click: [],
      partnerSideOutcomes: {
        registrations: null,
        kyc: null,
        deposits: null,
        trades: null,
        commissions: null,
      },
      boundary: 'Anonymous aggregate drop-off queues only. Session ids, event ids, raw URL queries, registration, KYC, deposit, trade and commission outcomes are not included.',
    };
  }

  const sessions = new Map();
  for (const row of rows) {
    const session = sessions.get(row.session) || {
      pages: new Set(),
      entries: new Map(),
      visiblePages: new Set(),
      visiblePlatforms: new Set(),
      visiblePlacements: new Set(),
      clickedPlatforms: new Set(),
      clickedPlacements: new Set(),
      handoffPlacements: new Set(),
      decisionPages: new Set(),
      decisionCountByPage: new Map(),
      handoffPages: new Set(),
      referralPages: new Set(),
    };
    const page = safePage(row.page);
    const market = row.version === 2 ? row.market : 'unknown';
    const product = row.version === 2 ? row.product : 'unknown';
    const pageKey = `${page}|${market}|${product}`;
    const placement = row.placement || 'unknown';
    const entry = entryFrom(row);
    if (row.type === 'page_view') {
      session.pages.add(pageKey);
      session.entries.set(`${entry.entry}|${pageKey}`, { ...entry, page, market, product });
    }
    if (row.type === 'cta_visible') {
      session.visiblePages.add(pageKey);
      session.visiblePlatforms.add(row.platform || 'unknown');
      session.visiblePlacements.add(placement);
    }
    if (row.type === 'referral_click') {
      session.referralPages.add(pageKey);
      session.clickedPlatforms.add(row.platform || 'unknown');
      session.clickedPlacements.add(placement);
    }
    if (row.type === 'outbound_handoff') {
      session.handoffPages.add(pageKey);
      session.handoffPlacements.add(placement);
    }
    if (row.type === 'decision_select') {
      session.decisionPages.add(pageKey);
      session.decisionCountByPage.set(pageKey, (session.decisionCountByPage.get(pageKey) || 0) + 1);
    }
    sessions.set(row.session, session);
  }

  const visibleNoClickPages = new Map();
  const decisionNoHandoffPages = new Map();
  const telegramEntryNoDecision = new Map();
  const platformVisibleNoClick = new Map();
  const placementVisibleNoClick = new Map();

  for (const session of sessions.values()) {
    for (const pageKey of session.visiblePages) {
      const item = pageBucket(visibleNoClickPages, pageKey);
      item.visibleCtas += 1;
      if (session.referralPages.has(pageKey)) item.referralClicks += 1;
      else item.dropOffCtaViews += 1;
    }

    for (const [pageKey, decisions] of session.decisionCountByPage.entries()) {
      const item = pageBucket(decisionNoHandoffPages, pageKey);
      item.decisionSelections += decisions;
      if (session.handoffPages.has(pageKey)) item.outboundHandoffs += 1;
      if (session.referralPages.has(pageKey)) item.referralClicks += 1;
      if (!session.handoffPages.has(pageKey) && !session.referralPages.has(pageKey)) item.dropOffDecisions += decisions;
    }

    for (const entry of session.entries.values()) {
      if (!isTelegramSource(entry.source) && !isTelegramSource(entry.publisher)) continue;
      const key = `${entry.entry}|${entry.page}|${entry.market}|${entry.product}`;
      const item = telegramEntryNoDecision.get(key) || {
        entry: entry.entry,
        source: entry.source,
        campaign: entry.campaign,
        publisher: entry.publisher,
        page: entry.page,
        market: entry.market,
        product: entry.product,
        entrySessions: 0,
        decisionSelections: 0,
        dropOffSessions: 0,
      };
      item.entrySessions += 1;
      const pageKey = `${entry.page}|${entry.market}|${entry.product}`;
      const decisions = session.decisionCountByPage.get(pageKey) || 0;
      item.decisionSelections += decisions;
      if (decisions === 0) item.dropOffSessions += 1;
      telegramEntryNoDecision.set(key, item);
    }

    for (const platform of session.visiblePlatforms) {
      const item = platformVisibleNoClick.get(platform) || {
        platform,
        visibleCtas: 0,
        referralClicks: 0,
        dropOffCtaViews: 0,
      };
      item.visibleCtas += 1;
      if (session.clickedPlatforms.has(platform)) item.referralClicks += 1;
      else item.dropOffCtaViews += 1;
      platformVisibleNoClick.set(platform, item);
    }

    for (const placement of session.visiblePlacements) {
      const item = placementVisibleNoClick.get(placement) || {
        placement,
        visibleCtas: 0,
        referralClicks: 0,
        outboundHandoffs: 0,
        dropOffCtaViews: 0,
      };
      item.visibleCtas += 1;
      if (session.clickedPlacements.has(placement)) item.referralClicks += 1;
      if (session.handoffPlacements.has(placement)) item.outboundHandoffs += 1;
      if (!session.clickedPlacements.has(placement)) item.dropOffCtaViews += 1;
      placementVisibleNoClick.set(placement, item);
    }
  }

  return {
    status: sessions.size < MINIMUM_CTA_SAMPLE_SESSIONS ? 'INSUFFICIENT_SAMPLE' : 'READY',
    visible_no_click_pages: serializeDropOffQueue(visibleNoClickPages, 'dropOffCtaViews'),
    decision_no_handoff_pages: serializeDropOffQueue(decisionNoHandoffPages, 'dropOffDecisions'),
    telegram_entry_no_decision: serializeDropOffQueue(telegramEntryNoDecision, 'dropOffSessions'),
    platform_visible_no_click: serializeDropOffQueue(platformVisibleNoClick, 'dropOffCtaViews'),
    placement_visible_no_click: serializeDropOffQueue(placementVisibleNoClick, 'dropOffCtaViews'),
    partnerSideOutcomes: {
      registrations: null,
      kyc: null,
      deposits: null,
      trades: null,
      commissions: null,
    },
    boundary: 'Anonymous aggregate drop-off queues only. Session ids, event ids, raw URL queries, registration, KYC, deposit, trade and commission outcomes are not included.',
  };
}

function pageBucket(map, pageKey) {
  const [page, market, product] = pageKey.split('|');
  const item = map.get(pageKey) || {
    page,
    market,
    product,
    visibleCtas: 0,
    referralClicks: 0,
    dropOffCtaViews: 0,
    decisionSelections: 0,
    outboundHandoffs: 0,
    dropOffDecisions: 0,
  };
  map.set(pageKey, item);
  return item;
}

function serializeDropOffQueue(map, sortMetric) {
  return [...map.values()]
    .filter((row) => (row[sortMetric] || 0) > 0)
    .sort((a, b) => (b[sortMetric] || 0) - (a[sortMetric] || 0) || String(a.page || a.entry || a.platform || a.placement).localeCompare(String(b.page || b.entry || b.platform || b.placement)))
    .slice(0, 20);
}

function safePage(page) {
  const raw = typeof page === 'string' && page.trim() ? page.trim() : 'unknown';
  if (raw === 'unknown') return raw;
  try {
    return new URL(raw, 'https://nexualpha.com').pathname || '/';
  } catch {
    return raw.split('?')[0].split('#')[0] || 'unknown';
  }
}

function summarizeDataQuality({ rows, quality, visitorSessions, pageViewKeys, decisionKeys, decisionImpressionKeys, visibleCtaKeys, outboundHandoffKeys, telegramHandoffKeys, referralClickKeys }) {
  const inputRows = Number.isInteger(quality.inputRows) ? quality.inputRows : rows.length;
  const invalidRows = Number.isInteger(quality.invalidRows) ? quality.invalidRows : 0;
  const validRows = rows.length;
  const visibleCtas = visibleCtaKeys.size;
  const referralClicks = referralClickKeys.size;
  const outboundHandoffs = outboundHandoffKeys.size;
  const issues = [];
  if (inputRows === 0) issues.push('no_input_rows');
  if (invalidRows > 0) issues.push('invalid_rows_excluded');
  if (validRows > 0 && visitorSessions.size === 0) issues.push('no_page_view_sessions');
  if (referralClicks > 0 && visibleCtas === 0) issues.push('referral_clicks_without_cta_visibility');
  if (outboundHandoffs > referralClicks) issues.push('outbound_handoffs_exceed_referral_clicks');
  return {
    status: issues.length ? 'NEEDS_REVIEW' : 'PASS',
    inputRows,
    validRows,
    invalidRows,
    selectedEvents: rows.length,
    observedEventTypes: [...new Set(rows.map((row) => row.type))].sort(),
    measurableSessions: visitorSessions.size,
    uniquePageViews: pageViewKeys.size,
    decisionImpressions: decisionImpressionKeys.size,
    decisionSelections: decisionKeys.size,
    visibleCtas,
    outboundHandoffs,
    telegramHandoffs: telegramHandoffKeys.size,
    referralClicks,
    issues,
    boundary: 'Quality checks validate first-party event shape and funnel consistency only; missing partner outcomes remain null, not zero.',
  };
}

function countryFromMarket(market) {
  if (!market || market === 'unknown' || market === 'GLOBAL') return 'unknown';
  return market;
}

function entryFrom(row) {
  const source = row.source || 'direct';
  const campaign = row.version === 2 && row.campaign ? row.campaign : 'unknown';
  const publisher = row.version === 2 && row.publisher ? row.publisher : 'unknown';
  return { entry: `${source}|${campaign}|${publisher}`, source, campaign, publisher };
}

function platformFrom(row) {
  if (row.platform) return row.platform;
  if (row.type === 'decision_select' && row.decision) return row.decision;
  return 'none';
}

function dateFrom(row) {
  if (!row.receivedAt) return null;
  const timestamp = Date.parse(row.receivedAt);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 10) : null;
}

export function summarizeExperimentReadouts(rows, registry = experimentRegistry) {
  const groups = new Map();
  for (const row of rows) {
    if (!row.experiment || row.experiment === 'none') continue;
    const variants = groups.get(row.experiment) || [];
    variants.push(row);
    groups.set(row.experiment, variants);
  }

  return [...groups.entries()].map(([experiment, variants]) => {
    const definition = registry[experiment] || null;
    const minimumSamplePerVariant = Number.isInteger(definition?.minimumSamplePerVariant) ? definition.minimumSamplePerVariant : null;
    const expectedVariants = definition ? [definition.control.id, definition.treatment.id] : [];
    const seenVariants = new Set(variants.map((variant) => variant.variant));
    const missingVariants = expectedVariants.filter((variant) => !seenVariants.has(variant));
    const variantReadiness = variants.map((variant) => ({
      variant: variant.variant,
      uniqueVisitors: variant.uniqueVisitors,
      uniquePageViews: variant.uniquePageViews,
      decisionSelections: variant.decisionSelections,
      referralClicks: variant.referralClicks,
      outboundHandoffs: variant.outboundHandoffs,
      sampleSufficient: minimumSamplePerVariant !== null ? variant.uniqueVisitors >= minimumSamplePerVariant : false,
    })).sort((a, b) => String(a.variant).localeCompare(String(b.variant)));
    const configuredVariantRows = variantReadiness.filter((variant) => expectedVariants.includes(variant.variant));
    const allConfiguredVariantsSampleReady = minimumSamplePerVariant !== null
      && expectedVariants.length === 2
      && missingVariants.length === 0
      && configuredVariantRows.every((variant) => variant.sampleSufficient);
    const status = !definition ? 'UNREGISTERED_EXPERIMENT' : definition.status === 'DESIGNED' ? 'DESIGNED_NOT_ACTIVE'
      : definition.status === 'PAUSED' ? 'PAUSED_NOT_ANALYZED'
        : missingVariants.length ? 'MISSING_CONFIGURED_VARIANT_TRAFFIC'
          : allConfiguredVariantsSampleReady ? 'READY_FOR_ANALYSIS' : 'INSUFFICIENT_SAMPLE';
    return {
      experiment,
      definitionStatus: definition?.status || 'UNREGISTERED',
      outcomeClass: definition?.outcomeClass || 'unknown',
      primaryMetric: definition?.primaryMetric || null,
      minimumSamplePerVariant,
      sampleThresholdMeaning: 'exploratory_readiness_threshold_not_statistical_significance',
      expectedVariants,
      missingVariants,
      variants: variantReadiness,
      status,
      canCallWinner: false,
      winner: null,
      measuredOutcomes: definition ? [...definition.observableOutcomes] : [],
      unavailableOutcomes: definition ? [...definition.unavailableOutcomes] : ['partner_registration', 'partner_kyc', 'partner_deposit', 'partner_trade', 'partner_commission'],
      decision: status === 'READY_FOR_ANALYSIS' ? 'ANALYSIS_REQUIRED_NO_WINNER_DECLARED' : 'NO_WINNER_DECLARED',
      notes: [
        'First-party events do not prove partner registration, KYC, deposit, trade or commission.',
        'The minimum sample threshold is an exploratory readiness gate, not statistical significance.',
        'Winner selection requires an active experiment, both configured variants, full exposure window, maturity window and a separate analysis step.',
      ],
    };
  }).sort((a, b) => a.experiment.localeCompare(b.experiment));
}

async function readRows(file) {
  const files = await analyticsInputFiles(file);
  const rows = [];
  let invalidJsonRows = 0;
  let readFiles = 0;
  for (const inputFile of files) {
    let text;
    try { text = await readFile(inputFile, 'utf8'); } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    readFiles += 1;
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try { rows.push(JSON.parse(line)); } catch { invalidJsonRows += 1; }
    }
  }
  return { rows, invalidJsonRows, missing: readFiles === 0, files: readFiles ? files : [file] };
}

async function analyticsInputFiles(file) {
  const basename = path.basename(file);
  if (!/^(?:production|smoke)\.jsonl$/.test(basename)) return [file];
  const directory = path.dirname(file);
  let names;
  try { names = await readdir(directory); } catch {
    return [file];
  }
  const archive = new RegExp(`^${basename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-\\d{8}$`);
  return [
    ...names.filter((name) => archive.test(name)).sort().map((name) => path.join(directory, name)),
    file,
  ];
}

function parseUtc(value, label) {
  if (value === undefined || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
    || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value.replace(/(?<=:\d{2})Z$/, '.000Z')) {
    throw new Error(`GROWTH_REPORT_${label}_UTC_INVALID`);
  }
  return Date.parse(value);
}

function eventKeys(row, market, product) {
  const accountStage = row.accountStage || 'unknown';
  const funding = row.funding || 'unknown';
  const decisionContext = `${accountStage}|${funding}`;
  return {
    pageView: `${row.session}|${row.page}|${market}|${product}|${decisionContext}`,
    visitor: row.session,
    referralClick: `${row.session}|${row.platform || 'none'}`,
    ctaVisible: `${row.session}|${row.page}|${market}|${product}|${decisionContext}|${row.platform || 'none'}|${row.placement || 'none'}`,
    outboundHandoff: `${row.session}|${row.page}|${market}|${product}|${decisionContext}|${row.platform || 'none'}|${row.placement || 'none'}`,
    telegramHandoff: `${row.session}|${row.page}|${market}|${product}|${decisionContext}|${row.placement || 'none'}|${row.decision || 'none'}|${row.telegramTarget || 'unknown'}|${row.telegramReturnKind || 'none'}|${row.telegramReturnPath || '/'}`,
    clickingSession: row.session,
    decisionImpression: `${row.session}|${row.page}|${market}|${product}|${decisionContext}|${row.placement || 'none'}|${row.decision || 'none'}`,
    decision: `${row.session}|${row.page}|${market}|${product}|${decisionContext}|${row.placement || 'none'}|${row.decision || 'none'}`,
  };
}

function addBucket(map, key, identity, row, keys) {
  const bucket = map.get(key) || {
    ...identity,
    _uniquePageViews: new Set(),
    _uniqueVisitors: new Set(),
    _referralClicks: new Set(),
    _visibleCtas: new Set(),
    _visibleCtaPageViews: new Set(),
    _outboundHandoffs: new Set(),
    _telegramHandoffs: new Set(),
    _clickingSessions: new Set(),
    _decisionImpressions: new Set(),
    _decisionSelections: new Set(),
  };
  if (row.type === 'page_view') {
    bucket._uniquePageViews.add(keys.pageView);
    bucket._uniqueVisitors.add(keys.visitor);
  }
  if (row.type === 'referral_click') {
    bucket._referralClicks.add(keys.referralClick);
    bucket._clickingSessions.add(keys.clickingSession);
  }
  if (row.type === 'cta_visible') {
    bucket._visibleCtas.add(keys.ctaVisible);
    bucket._visibleCtaPageViews.add(keys.pageView);
  }
  if (row.type === 'outbound_handoff') bucket._outboundHandoffs.add(keys.outboundHandoff);
  if (row.type === 'telegram_handoff') bucket._telegramHandoffs.add(keys.telegramHandoff);
  if (row.type === 'decision_impression') bucket._decisionImpressions.add(keys.decisionImpression);
  if (row.type === 'decision_select') bucket._decisionSelections.add(keys.decision);
  map.set(key, bucket);
}

function serializeBuckets(map) {
  return [...map.values()].map((bucket) => ({
    ...Object.fromEntries(Object.entries(bucket).filter(([key]) => !key.startsWith('_'))),
    uniqueSessions: bucket._uniqueVisitors.size,
    uniqueVisitors: bucket._uniqueVisitors.size,
    uniquePageViews: bucket._uniquePageViews.size,
    decisionImpressions: bucket._decisionImpressions.size,
    decisionSelections: bucket._decisionSelections.size,
    referralClicks: bucket._referralClicks.size,
    visibleCtas: bucket._visibleCtas.size,
    outboundHandoffs: bucket._outboundHandoffs.size,
    telegramHandoffs: bucket._telegramHandoffs.size,
    clickingSessions: bucket._clickingSessions.size,
    confirmedRegistrations: null,
    qualifiedAccounts: null,
    funnel: funnelRates({
      uniqueVisitors: bucket._uniqueVisitors.size,
      uniquePageViews: bucket._uniquePageViews.size,
      decisionImpressions: bucket._decisionImpressions.size,
      decisionSelections: bucket._decisionSelections.size,
      visibleCtas: bucket._visibleCtas.size,
      visibleCtaPageViews: bucket._visibleCtaPageViews.size,
      referralClicks: bucket._referralClicks.size,
      outboundHandoffs: bucket._outboundHandoffs.size,
      clickingSessions: bucket._clickingSessions.size,
    }),
  }));
}

function funnelRates({ uniqueVisitors, uniquePageViews, decisionSelections, visibleCtas, visibleCtaPageViews, referralClicks, outboundHandoffs, clickingSessions }) {
  return {
    decisionPerVisitor: ratio(decisionSelections, uniqueVisitors),
    ctaVisiblePerPageView: ratio(visibleCtaPageViews, uniquePageViews),
    referralClicksPerVisibleCta: ratio(referralClicks, visibleCtas),
    clickingSessionPerCtaPageView: ratio(clickingSessions, visibleCtaPageViews),
    outboundHandoffPerReferralClick: ratio(outboundHandoffs, referralClicks),
    clickingSessionPerVisitor: ratio(clickingSessions, uniqueVisitors),
  };
}

function ratio(numerator, denominator) {
  return denominator > 0 ? Number((numerator / denominator).toFixed(4)) : null;
}

function byClicksThenVisitors(a, b) {
  return b.referralClicks - a.referralClicks || b.uniqueVisitors - a.uniqueVisitors || b.uniquePageViews - a.uniquePageViews || bucketLabel(a).localeCompare(bucketLabel(b));
}

function bucketLabel(row) {
  return String(row.page || row.country || row.market || row.locale || row.source || row.publisher || row.campaign || row.device || row.entry || row.platform || row.product || row.accountStage || row.funding || row.experiment || row.date || '');
}

function renderMarkdown(report) {
  if (report.status === 'INPUT_MISSING') {
    const firstPartyFunnelStages = renderDropOffRows(report.firstPartyFunnelStages, ['stage', 'value', 'valueStatus', 'partnerSide']) || '| unknown | unknown | input_missing | unknown |';
    return `# NexuAlpha Private Growth Report\n\nStatus: INPUT_MISSING\n\nSource: ${report.sourceFile}\n\nTraffic and CTA counts: unknown. The input file does not exist; no zero-traffic conclusion is possible.\n\n## First-Party Funnel Stages\n\n| Stage | Value | Value status | Partner side |\n| --- | ---: | --- | --- |\n${firstPartyFunnelStages}\n`;
  }
  const unknownRow = report.sampleReadiness?.selectedEvents === 0;
  const emptyCell = unknownRow ? 'not recorded' : 'none';
  const emptyCount = unknownRow ? 'unknown' : '0';
  const topMarkets = report.byMarket.slice(0, 8).map((row) => `| ${row.market} | ${row.uniqueSessions ?? row.uniqueVisitors} | ${row.uniquePageViews} | ${row.decisionSelections} | ${row.clickingSessions} | ${row.referralClicks} | null |`).join('\n') || `| ${emptyCell} | ${emptyCount} | ${emptyCount} | ${emptyCount} | ${emptyCount} | ${emptyCount} | null |`;
  const topCountries = report.byCountry.slice(0, 8).map((row) => `| ${row.country} | ${row.market} | ${row.uniqueSessions ?? row.uniqueVisitors} | ${row.uniquePageViews} | ${row.decisionSelections} | ${row.referralClicks} |`).join('\n') || `| ${emptyCell} | unknown | ${emptyCount} | ${emptyCount} | ${emptyCount} | ${emptyCount} |`;
  const topPages = report.byPage.slice(0, 12).map((row) => `| ${row.page} | ${row.market} | ${row.product} | ${row.uniqueSessions ?? row.uniqueVisitors} | ${row.uniquePageViews} | ${row.decisionSelections} | ${row.referralClicks} |`).join('\n') || `| ${emptyCell} | unknown | unknown | ${emptyCount} | ${emptyCount} | ${emptyCount} | ${emptyCount} |`;
  const topLocales = report.byLocale.slice(0, 12).map((row) => `| ${row.locale} | ${row.uniqueSessions ?? row.uniqueVisitors} | ${row.uniquePageViews} | ${row.decisionSelections} | ${row.referralClicks} |`).join('\n') || `| ${emptyCell} | ${emptyCount} | ${emptyCount} | ${emptyCount} | ${emptyCount} |`;
  const topCampaigns = report.byCampaign.slice(0, 12).map((row) => `| ${row.campaign} | ${row.uniqueSessions ?? row.uniqueVisitors} | ${row.uniquePageViews} | ${row.decisionSelections} | ${row.referralClicks} |`).join('\n') || `| ${emptyCell} | ${emptyCount} | ${emptyCount} | ${emptyCount} | ${emptyCount} |`;
  const topAccountStages = report.byAccountStage.slice(0, 12).map((row) => `| ${row.accountStage} | ${row.uniqueSessions ?? row.uniqueVisitors} | ${row.uniquePageViews} | ${row.decisionSelections} | ${row.referralClicks} |`).join('\n') || `| ${emptyCell} | ${emptyCount} | ${emptyCount} | ${emptyCount} | ${emptyCount} |`;
  const topFundingRoutes = report.byFunding.slice(0, 12).map((row) => `| ${row.funding} | ${row.uniqueSessions ?? row.uniqueVisitors} | ${row.uniquePageViews} | ${row.decisionSelections} | ${row.referralClicks} |`).join('\n') || `| ${emptyCell} | ${emptyCount} | ${emptyCount} | ${emptyCount} | ${emptyCount} |`;
  const topSources = report.bySource.slice(0, 12).map((row) => `| ${row.source} | ${row.uniqueSessions ?? row.uniqueVisitors} | ${row.uniquePageViews} | ${row.decisionSelections} | ${row.referralClicks} |`).join('\n') || `| ${emptyCell} | ${emptyCount} | ${emptyCount} | ${emptyCount} | ${emptyCount} |`;
  const topDevices = report.byDevice.slice(0, 8).map((row) => `| ${row.device} | ${row.uniqueSessions ?? row.uniqueVisitors} | ${row.uniquePageViews} | ${row.decisionSelections} | ${row.referralClicks} |`).join('\n') || `| ${emptyCell} | ${emptyCount} | ${emptyCount} | ${emptyCount} | ${emptyCount} |`;
  const topEntries = report.byEntry.slice(0, 12).map((row) => `| ${row.source} | ${row.campaign} | ${row.publisher} | ${row.uniqueSessions ?? row.uniqueVisitors} | ${row.uniquePageViews} | ${row.decisionSelections} | ${row.referralClicks} |`).join('\n') || `| ${emptyCell} | unknown | unknown | ${emptyCount} | ${emptyCount} | ${emptyCount} | ${emptyCount} |`;
  const topPlatforms = report.byPlatform.slice(0, 12).map((row) => `| ${row.platform} | ${row.uniqueSessions ?? row.uniqueVisitors} | ${row.decisionSelections} | ${row.visibleCtas} | ${row.outboundHandoffs} | ${row.referralClicks} | null |`).join('\n') || `| ${emptyCell} | ${emptyCount} | ${emptyCount} | ${emptyCount} | ${emptyCount} | ${emptyCount} | null |`;
  const dailyRows = report.byDate.slice(-14).map((row) => `| ${row.date} | ${row.uniqueSessions ?? row.uniqueVisitors} | ${row.uniquePageViews} | ${row.decisionSelections} | ${row.visibleCtas} | ${row.outboundHandoffs} | ${row.referralClicks} |`).join('\n') || `| ${emptyCell} | ${emptyCount} | ${emptyCount} | ${emptyCount} | ${emptyCount} | ${emptyCount} | ${emptyCount} |`;
  const experimentReadouts = report.experimentReadouts.map((row) => `| ${row.experiment} | ${row.definitionStatus} | ${row.status} | ${row.minimumSamplePerVariant ?? 'unknown'} | ${row.canCallWinner ? 'yes' : 'no'} | null |`).join('\n') || '| none | none | NO_REGISTERED_EXPERIMENT_TRAFFIC | unknown | no | null |';
  const firstPartyFunnelStages = renderDropOffRows(report.firstPartyFunnelStages, ['stage', 'value', 'valueStatus', 'partnerSide']) || '| unknown | unknown | unknown | unknown |';
  const journeyStages = renderDropOffRows(report.onsiteJourney?.stages, ['id', 'sessions', 'pageViews', 'decisions', 'outboundHandoffs', 'telegramHandoffs', 'referralClicks']) || '| unknown | unknown | unknown | unknown | unknown | unknown | unknown |';
  const marketProductJourney = renderDropOffRows(report.onsiteJourney?.byMarketProduct, ['market', 'product', 'regionalProductSelectionSessions', 'shortlistSessions', 'compareSessions', 'detailSessions', 'externalHandoffSessions', 'telegramHandoffSessions', 'telegramReturnSessions', 'referralClicks']) || '| unknown | unknown | unknown | unknown | unknown | unknown | unknown | unknown | unknown | unknown |';
  const visibleNoClickRows = renderDropOffRows(report.dropOffQueues?.visible_no_click_pages, ['page', 'market', 'product', 'visibleCtas', 'referralClicks', 'dropOffCtaViews']) || '| unknown | unknown | unknown | unknown | unknown | unknown |';
  const decisionNoHandoffRows = renderDropOffRows(report.dropOffQueues?.decision_no_handoff_pages, ['page', 'market', 'product', 'decisionSelections', 'outboundHandoffs', 'referralClicks', 'dropOffDecisions']) || '| unknown | unknown | unknown | unknown | unknown | unknown | unknown |';
  const telegramNoDecisionRows = renderDropOffRows(report.dropOffQueues?.telegram_entry_no_decision, ['entry', 'page', 'market', 'product', 'entrySessions', 'decisionSelections', 'dropOffSessions']) || '| unknown | unknown | unknown | unknown | unknown | unknown | unknown |';
  const platformNoClickRows = renderDropOffRows(report.dropOffQueues?.platform_visible_no_click, ['platform', 'visibleCtas', 'referralClicks', 'dropOffCtaViews']) || '| unknown | unknown | unknown | unknown |';
  const placementNoClickRows = renderDropOffRows(report.dropOffQueues?.placement_visible_no_click, ['placement', 'visibleCtas', 'outboundHandoffs', 'referralClicks', 'dropOffCtaViews']) || '| unknown | unknown | unknown | unknown | unknown |';
  const measurableSessions = unknownRow ? 'unknown' : report.totals.uniqueSessions ?? report.totals.uniqueVisitors;
  const legacyUniqueVisitors = unknownRow ? 'unknown' : report.totals.uniqueVisitors;
  const uniquePageViews = unknownRow ? 'unknown' : report.totals.uniquePageViews;
  const decisionImpressions = unknownRow ? 'unknown' : report.totals.decisionImpressions;
  const decisionSelections = unknownRow ? 'unknown' : report.totals.decisionSelections;
  const clickingSessions = unknownRow ? 'unknown' : report.totals.clickingSessions;
  const referralClicks = unknownRow ? 'unknown' : report.totals.referralClicks;
  const telegramHandoffs = unknownRow ? 'unknown' : report.totals.telegramHandoffs;
  const telegramEntryRows = renderDropOffRows(report.telegramSignals?.byEntry, ['entry', 'page', 'market', 'product', 'returnSessions', 'decisions', 'referralClickSessions', 'referralClicks', 'partnerRegistrations', 'partnerCommissions']) || '| unknown | unknown | unknown | unknown | unknown | unknown | unknown | unknown | null | null |';
  return [
    '# NexuAlpha Private Growth Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Source: ${report.sourceFile}`,
    `Status: ${report.status}`,
    `Environment: ${report.selection.environment}`,
    `UTC interval: ${report.selection.fromUtc || 'unbounded'} inclusive to ${report.selection.toUtc || 'unbounded'} exclusive`,
    `Sample readiness: ${report.sampleReadiness?.status || report.status}`,
    `Sample: ${report.sampleReadiness?.observedSessions ?? 'unknown'} sessions / ${report.sampleReadiness?.minimumSessions ?? 'unknown'} minimum`,
    `Sample boundary: ${report.sampleReadiness?.boundary || 'First-party CTA sample readiness only.'}`,
    '',
    '## Totals',
    '',
    `- Recorded events in selection: ${report.totals.events}`,
    `- Measurable sessions: ${measurableSessions}`,
    `- Legacy uniqueVisitors: ${legacyUniqueVisitors}`,
    `- Unique page views: ${uniquePageViews}`,
    `- Decision impressions: ${decisionImpressions}`,
    `- Decision selections: ${decisionSelections}`,
    `- Clicking sessions: ${clickingSessions}`,
    `- Referral clicks: ${referralClicks}`,
    `- Telegram handoffs: ${telegramHandoffs}`,
    '- Confirmed registrations: null',
    '- Qualified accounts: null',
    '',
    '## Collector Provenance',
    '',
    `Known release records: ${report.collectorProvenance.knownRecords}`,
    `Unknown release records: ${report.collectorProvenance.unknownRecords}`,
    '',
    '| Collector release | Recorded events |',
    '| --- | ---: |',
    ...report.collectorProvenance.byRelease.map((row) => `| ${row.collectorRelease} | ${row.records} |`),
    '',
    report.collectorProvenance.boundary,
    '',
    '## Week Over Week',
    '',
    `Status: ${report.weekOverWeek.status}`,
    '',
    renderComparisonMarkdown(report.weekOverWeek),
    '',
    '## Dates',
    '',
    '| Date | Measurable sessions | Page views | Decisions | Visible CTAs | Outbound handoffs | Referral clicks |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
    dailyRows,
    '',
    '## Countries',
    '',
    '| Country | Market | Measurable sessions | Page views | Decisions | Referral clicks |',
    '| --- | --- | ---: | ---: | ---: | ---: |',
    topCountries,
    '',
    '## Markets',
    '',
    '| Market | Measurable sessions | Page views | Decisions | Clicking sessions | Referral clicks | Confirmed registrations |',
    '| --- | ---: | ---: | ---: | ---: | ---: | --- |',
    topMarkets,
    '',
    '## Pages',
    '',
    '| Page | Market | Product | Measurable sessions | Page views | Decisions | Referral clicks |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: |',
    topPages,
    '',
    '## Locales',
    '',
    '| Locale | Measurable sessions | Page views | Decisions | Referral clicks |',
    '| --- | ---: | ---: | ---: | ---: |',
    topLocales,
    '',
    '## Sources',
    '',
    '| Source | Measurable sessions | Page views | Decisions | Referral clicks |',
    '| --- | ---: | ---: | ---: | ---: |',
    topSources,
    '',
    '## Campaigns',
    '',
    '| Campaign | Measurable sessions | Page views | Decisions | Referral clicks |',
    '| --- | ---: | ---: | ---: | ---: |',
    topCampaigns,
    '',
    '## Account Stages',
    '',
    '| Account stage | Measurable sessions | Page views | Decisions | Referral clicks |',
    '| --- | ---: | ---: | ---: | ---: |',
    topAccountStages,
    '',
    '## Funding Routes',
    '',
    '| Funding route | Measurable sessions | Page views | Decisions | Referral clicks |',
    '| --- | ---: | ---: | ---: | ---: |',
    topFundingRoutes,
    '',
    '## Devices',
    '',
    '| Device | Measurable sessions | Page views | Decisions | Referral clicks |',
    '| --- | ---: | ---: | ---: | ---: |',
    topDevices,
    '',
    '## Entries',
    '',
    '| Source | Campaign | Publisher | Measurable sessions | Page views | Decisions | Referral clicks |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: |',
    topEntries,
    '',
    '## Platforms',
    '',
    '| Platform | Measurable sessions | Decisions | Visible CTAs | Outbound handoffs | Referral clicks | Confirmed registrations |',
    '| --- | ---: | ---: | ---: | ---: | ---: | --- |',
    topPlatforms,
    '',
    '## First-Party Funnel Stages',
    '',
    '| Stage | Value | Value status | Partner side |',
    '| --- | ---: | --- | --- |',
    firstPartyFunnelStages,
    '',
    '## Experiment Readiness',
    '',
    '| Experiment | Definition status | Readout status | Minimum sample / variant | Can call winner | Winner |',
    '| --- | --- | --- | ---: | --- | --- |',
    experimentReadouts,
    '',
    '## Onsite Journey',
    '',
    `Status: ${report.onsiteJourney?.status || 'unknown'}`,
    '',
    `Boundary: ${report.onsiteJourney?.boundary || 'First-party anonymous journey stages only.'}`,
    '',
    `Telegram return sessions: ${report.onsiteJourney?.telegramReturn?.sessions ?? 'unknown'}`,
    `Telegram return decision rate: ${report.onsiteJourney?.telegramReturn?.decisionRate ?? 'unknown'}`,
    `Telegram return referral-click rate: ${report.onsiteJourney?.telegramReturn?.referralClickRate ?? 'unknown'}`,
    '',
    '| Stage | Sessions | Page views | Decisions | Outbound handoffs | Telegram handoffs | Referral clicks |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
    journeyStages,
    '',
    '### Market Product Journey',
    '',
    '| Market | Product | Regional/product sessions | Shortlist sessions | Compare sessions | Detail sessions | External handoff sessions | Telegram handoff sessions | Telegram return sessions | Referral clicks |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    marketProductJourney,
    '',
    '## Telegram Signals',
    '',
    `Status: ${report.telegramSignals?.status || 'unknown'}`,
    '',
    `Handoff sessions: ${report.telegramSignals?.handoffSessions ?? 'unknown'}`,
    `Return sessions: ${report.telegramSignals?.returnSessions ?? 'unknown'}`,
    `Return decision sessions: ${report.telegramSignals?.returnDecisionSessions ?? 'unknown'}`,
    `Return referral-click sessions: ${report.telegramSignals?.returnReferralClickSessions ?? 'unknown'}`,
    `Return referral clicks: ${report.telegramSignals?.returnReferralClicks ?? 'unknown'}`,
    `Boundary: ${report.telegramSignals?.boundary || 'Telegram signals are first-party only.'}`,
    '',
    '| Entry | Page | Market | Product | Return sessions | Decisions | Referral-click sessions | Referral clicks | Partner registrations | Partner commissions |',
    '| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |',
    telegramEntryRows,
    '',
    '## CTA Drop-off Queues',
    '',
    `Status: ${report.dropOffQueues?.status || 'unknown'}`,
    '',
    `Boundary: ${report.dropOffQueues?.boundary || 'Anonymous aggregate drop-off queues only.'}`,
    '',
    '### visible_no_click_pages',
    '',
    '| Page | Market | Product | Visible CTAs | Referral clicks | Drop-off CTA views |',
    '| --- | --- | --- | ---: | ---: | ---: |',
    visibleNoClickRows,
    '',
    '### decision_no_handoff_pages',
    '',
    '| Page | Market | Product | Decisions | Outbound handoffs | Referral clicks | Drop-off decisions |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: |',
    decisionNoHandoffRows,
    '',
    '### telegram_entry_no_decision',
    '',
    '| Entry | Page | Market | Product | Entry sessions | Decisions | Drop-off sessions |',
    '| --- | --- | --- | --- | ---: | ---: | ---: |',
    telegramNoDecisionRows,
    '',
    '### platform_visible_no_click',
    '',
    '| Platform | Visible CTAs | Referral clicks | Drop-off CTA views |',
    '| --- | ---: | ---: | ---: |',
    platformNoClickRows,
    '',
    '### placement_visible_no_click',
    '',
    '| Placement | Visible CTAs | Outbound handoffs | Referral clicks | Drop-off CTA views |',
    '| --- | ---: | ---: | ---: | ---: |',
    placementNoClickRows,
    '',
    '## Notes',
    '',
    report.notes.map((note) => `- ${note}`).join('\n'),
    '',
  ].join('\n');
}

function renderDropOffRows(rows, keys) {
  if (!Array.isArray(rows) || !rows.length) return '';
  return rows.slice(0, 10).map((row) => `| ${keys.map((key) => row[key] ?? 'unknown').join(' | ')} |`).join('\n');
}

function renderComparisonMarkdown(weekOverWeek) {
  if (weekOverWeek.status !== 'READY') return weekOverWeek.notes.map((note) => `- ${note}`).join('\n');
  return [
    `Current: ${weekOverWeek.window.currentFromUtc} to ${weekOverWeek.window.currentToUtc} exclusive`,
    `Previous: ${weekOverWeek.window.previousFromUtc} to ${weekOverWeek.window.previousToUtc} exclusive`,
    '',
    '| Metric | Current | Previous | Delta |',
    '| --- | ---: | ---: | ---: |',
    ...Object.keys(weekOverWeek.current).map((key) => `| ${key} | ${weekOverWeek.current[key]} | ${weekOverWeek.previous[key]} | ${weekOverWeek.delta[key]} |`),
  ].join('\n');
}

function printHelp() {
  process.stdout.write(`Usage: CTA_DATA_FILE=/private/analytics/production.jsonl GROWTH_REPORT_DIR=/private/reports GROWTH_REPORT_ENVIRONMENT=production GROWTH_REPORT_FROM_UTC=2026-09-14T00:00:00Z GROWTH_REPORT_TO_UTC=2026-09-15T00:00:00Z node server/growth-report.mjs\n\nThe UTC interval includes FROM and excludes TO. Environment defaults to CTA_ENVIRONMENT or local-preview. Missing input returns INPUT_MISSING and null totals. Registrations remain null; this report measures first-party events only.\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp();
  } else {
    const result = await buildGrowthReport();
    process.stdout.write(`${JSON.stringify({ status: result.report.status, jsonPath: result.jsonPath, markdownPath: result.markdownPath, totals: result.report.totals })}\n`);
    if (result.report.status === 'INPUT_MISSING') process.exitCode = 2;
  }
}

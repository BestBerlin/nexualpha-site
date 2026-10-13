import { readFileSync } from 'node:fs';
import { countIndependentSources } from './dedupe.mjs';
import { isMirrorEvidence } from './evidence-quality.mjs';
import { claimQualityState, normalizeClaimQualityConfig } from './claim-quality.mjs';
import { trigramSimilarity } from './normalization.mjs';
import { verifyEvent } from './verification.mjs';
import { storyFacts } from './facts.mjs';

export const DEFAULT_NEWSROOM_CONFIG = {
  weights: { relevance: 25, heat: 20, timeliness: 20, new_info: 20, impact: 15 },
  thresholds: {
    publish: 55,
    review: 70,
    publishCredibilityMin: 2,
    flashCredibilityMin: 3,
    reviewCredibilityMin: 1,
    repeatAngleSimilarity: 0.5,
  },
};

const HIGH_RELEVANCE_TYPES = new Set([
  'withdrawal_halt',
  'hack_exploit',
  'delisting',
  'listing',
  'stablecoin_depeg',
  'liquidation_wave',
  'exchange_flow',
  'bankruptcy_filing',
  'enforcement',
]);

const SCOPED_EVENT_TYPES = new Set(['price_move', 'liquidity_anomaly', 'stablecoin_depeg', 'flows', 'listing', 'delisting', 'product_launch', 'market_structure', 'whale_transfer', 'exchange_flow', 'institutional_trade', 'liquidation_wave', 'withdrawal_halt', 'insolvency', 'bankruptcy_filing', 'hack_exploit', 'loss_repayment', 'lawsuit', 'enforcement', 'regulation', 'key_person_statement', 'dispute', 'viral_claim', 'equity_event', 'earnings_flows', 'crypto_treasury_company', 'fx_macro', 'politics_market']);

const LOW_RELEVANCE_TYPES = new Set(['pure_politics', 'unrelated_society', 'routine_pr', 'empty_speech', 'unknown']);

const OFFICIAL_MAJOR_TYPES = new Set(['withdrawal_halt', 'hack_exploit', 'delisting', 'enforcement', 'bankruptcy_filing', 'stablecoin_depeg']);
const OFFICIAL_KINDS = new Set(['official_notice', 'original_statement', 'filing', 'court_record', 'onchain_tx']);
const EXCHANGE_LISTING_TYPES = new Set(['listing', 'delisting']);
const MAJOR_LISTING_VENUES = new Set(['binance', 'okx', 'bybit', 'bitget', 'coinbase']);
const TOP_200_SYMBOLS = loadTop200Symbols();

function loadTop200Symbols() {
  try {
    const rows = JSON.parse(readFileSync(new URL('../db/coin-universe.json', import.meta.url), 'utf8'));
    return new Set(rows.map(row => String(row.symbol ?? '').toUpperCase()).filter(Boolean));
  } catch {
    return new Set();
  }
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function eventMarketChannel(event) {
  return event.market_channel ?? event.marketChannel ?? event.discussion?.market_channel ?? event.discussion?.marketChannel ?? null;
}

function scoreRelevance(event, entitiesById = {}) {
  const entity = entitiesById[event.subject_entity] ?? {};
  const priorityScore = { 1: 100, 2: 70, 3: 40 }[entity.priority ?? event.entity_priority ?? event.entityPriority ?? 2] ?? 50;
  if (!SCOPED_EVENT_TYPES.has(event.event_type) || LOW_RELEVANCE_TYPES.has(event.event_type)) return 0;
  const marketChannel = eventMarketChannel(event);
  if ((event.event_type === 'fx_macro' || event.event_type === 'politics_market') && !marketChannel) return 0;
  const typeFactor = HIGH_RELEVANCE_TYPES.has(event.event_type) ? 1 : marketChannel ? 0.8 : 0.45;
  if (event.out_of_scope || event.outOfScope) return 0;
  return clamp(priorityScore * typeFactor);
}

function hoursSince(value, now) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return Math.max(0, (now - date) / 36e5);
}

function heatDecayWeight(hours) {
  if (!Number.isFinite(hours)) return 1;
  if (hours <= 6) return 1;
  if (hours >= 72) return 0.1;
  return Math.max(0.1, Math.pow(0.5, (hours - 6) / 24));
}

function independentSourceHeat(event, now) {
  const seenOrigins = new Set();
  const seenPublishers = new Set();
  const rows = (event.evidence ?? []).filter(row => !isMirrorEvidence(row) && row.is_independent !== false && ((row.origin_key ?? row.originKey) || publisherKey(row)));
  let weighted = 0;
  let count = 0;
  let oldestHours = null;
  let newestHours = null;
  for (const row of rows) {
    const origin = row.origin_key ?? row.originKey ?? null;
    const publisher = publisherKey(row);
    if ((origin && seenOrigins.has(origin)) || (publisher && seenPublishers.has(publisher))) continue;
    if (origin) seenOrigins.add(origin);
    if (publisher) seenPublishers.add(publisher);
    count += 1;
    const hours = hoursSince(row.published_at ?? row.publishedAt ?? event.source_published_at ?? event.sourcePublishedAt, now);
    if (hours != null) {
      oldestHours = oldestHours == null ? hours : Math.max(oldestHours, hours);
      newestHours = newestHours == null ? hours : Math.min(newestHours, hours);
    }
    weighted += heatDecayWeight(hours);
  }
  if (count) return { count, weighted, oldestHours, newestHours, decayed: true };
  const fallback = (event.evidence ?? []).some(isMirrorEvidence)
    ? countIndependentSources(rows)
    : Number(event.discussion?.independent_sources ?? countIndependentSources(event.evidence ?? []));
  return {
    count: Number.isFinite(fallback) ? fallback : 0,
    weighted: Number.isFinite(fallback) ? fallback : 0,
    oldestHours: null,
    newestHours: null,
    decayed: false,
  };
}

function publisherKey(row) {
  try {
    const hostname = new URL(row.url).hostname.toLowerCase().replace(/^www\./, '');
    if (hostname) return hostname;
  } catch {
    // Fall back to registry/account identity when evidence has no usable URL.
  }
  return row.source_id ?? row.sourceId ?? row.author_account ?? row.authorAccount ?? row.source_name ?? row.sourceName ?? row.source_platform ?? row.sourcePlatform ?? null;
}

function scoreHeat(event, now) {
  const discussion = event.discussion ?? {};
  const byPlatform = discussion.by_platform ?? discussion.byPlatform ?? {};
  const sourceHeat = independentSourceHeat(event, now);
  const independentSources = sourceHeat.count;
  const containsMirrors = (event.evidence ?? []).some(isMirrorEvidence);
  const independentPlatforms = new Set((event.evidence ?? [])
    .filter(row => !isMirrorEvidence(row) && row.is_independent !== false)
    .map(row => row.source_platform ?? row.sourcePlatform).filter(Boolean));
  const platformsWithIndependentItems = containsMirrors ? independentPlatforms.size : discussion.platforms_with_independent_items ?? Object.values(byPlatform).filter(value => value.independent_posts > 0).length;
  // Cached platform aggregates cannot attribute growth to individual sources.
  // Re-score mixed mirror bundles from captured independent origins only.
  const growthScores = Object.entries(containsMirrors ? {} : byPlatform).map(([platform, value]) => {
    const computedGrowth = Number.isFinite(value.metric_now) && Number.isFinite(value.baseline) && value.baseline > 0
      ? value.metric_now / value.baseline
      : null;
    const growth = value.metric_growth_max ?? value.top_growth_x ?? computedGrowth;
    return {
      platform,
      metric_growth_max: Number.isFinite(growth) ? Number(growth) : null,
      metrics_unknown: value.metrics_unknown === true || growth == null,
      baseline_unknown: !(Number.isFinite(value.baseline) && value.baseline > 0) && Number.isFinite(value.metric_now),
    };
  });
  const knownGrowth = growthScores.map(row => row.metric_growth_max).filter(Number.isFinite);
  const maxGrowth = knownGrowth.reduce((max, value) => Math.max(max, value), 0);
  const growthComponent = Math.min(50, maxGrowth * 10);
  const independentComponent = Math.min(50, Math.max(0, sourceHeat.weighted) * 12);
  const platformComponent = Math.min(30, Math.max(0, platformsWithIndependentItems - 1) * 10);
  return {
    score: clamp(growthComponent + independentComponent + platformComponent),
    explain: {
      independent_sources: independentSources,
      independent_sources_decayed: Number(sourceHeat.weighted.toFixed(2)),
      independent_source_decay_applied: sourceHeat.decayed,
      newest_independent_source_hours: sourceHeat.newestHours == null ? null : Number(sourceHeat.newestHours.toFixed(2)),
      oldest_independent_source_hours: sourceHeat.oldestHours == null ? null : Number(sourceHeat.oldestHours.toFixed(2)),
      platforms_with_independent_items: platformsWithIndependentItems,
      per_platform_growth: growthScores,
      max_platform_growth: knownGrowth.length ? maxGrowth : null,
      metric_total_across_platforms: null,
    },
  };
}

function scoreTimeliness(event, now) {
  const rawSourceTime = event.source_published_at ?? event.sourcePublishedAt ?? event.published_at ?? event.publishedAt;
  if (!rawSourceTime) return { score: 10, hours: null, unknown: true };
  const sourceTime = new Date(rawSourceTime);
  if (!Number.isFinite(sourceTime.getTime())) return { score: 10, hours: null, unknown: true };
  const hours = Math.max(0, (now - sourceTime) / 36e5);
  if (hours <= 1) return { score: 100, hours };
  if (hours <= 12) return { score: clamp(100 - ((hours - 1) * 60) / 11), hours };
  if (hours <= 48) return { score: clamp(40 - ((hours - 12) * 30) / 36), hours };
  return { score: 10, hours };
}

function sameEntityAndType(article, event) {
  const articleSubject = article.subject_entity ?? article.subjectEntity;
  const articleType = article.event_type ?? article.eventType;
  return Boolean(articleSubject && articleType) && articleSubject === event.subject_entity && articleType === event.event_type;
}

function scoreNewInfo(event, articles = [], now, threshold) {
  const fourteenDays = 14 * 24 * 36e5;
  const recent = articles.filter(article => sameEntityAndType(article, event)
    && now - new Date(article.published_at ?? article.publishedAt ?? article.created_at ?? article.createdAt ?? 0) <= fourteenDays);
  if (!recent.length) return { score: 100, reason: 'no_recent_article' };
  const question = event.main_question ?? event.mainQuestion ?? event.title_internal ?? '';
  const repeat = recent.find(article => trigramSimilarity(question, article.main_question ?? article.mainQuestion ?? article.title ?? '') >= threshold);
  if (repeat) return { score: 0, reason: 'repeat_angle', matched_slug: repeat.slug ?? null };
  if ((event.new_fact_types ?? event.newFactTypes ?? []).length) return { score: 60, reason: 'new_fact_type' };
  return { score: 0, reason: 'same_entity_type_without_new_fact' };
}

function scoreImpact(event) {
  if (Number.isFinite(event.impact_score ?? event.impactScore)) return clamp(event.impact_score ?? event.impactScore);
  const usd = event.usd_amount ?? event.usdAmount ?? event.money_at_stake_usd ?? event.moneyAtStakeUsd ?? null;
  const users = event.affected_users ?? event.affectedUsers ?? 0;
  const venues = event.affected_venues ?? event.affectedVenues ?? 0;
  const usdScore = Number.isFinite(usd) && usd > 0 ? Math.min(70, Math.log10(usd) * 10) : 0;
  return clamp(usdScore + Math.min(20, users / 5000) + Math.min(10, venues * 5) + (event.retail_can_act_this_week ? 10 : 0));
}

function tokenSet(values = []) {
  return new Set(values.flatMap(value => String(value ?? '').toUpperCase().match(/[A-Z0-9]{2,12}/g) ?? []));
}

function eventVenueTokens(event) {
  return tokenSet([
    event.subject_entity,
    event.subjectEntity,
    ...(event.subjects ?? []),
    event.venue,
    event.exchange,
    event.title_internal,
    event.titleInternal,
    ...(event.evidence ?? []).flatMap(row => [row.source_id, row.sourceId, row.url, row.author_account, row.authorAccount]),
  ]);
}

function listedAssetTokens(event) {
  // Only captured symbols/names or explicit asset fields qualify; ordinary
  // words such as "one" must not become a token through case folding.
  return new Set([
    ...storyFacts({ ...event, title: event.title_internal ?? event.titleInternal ?? event.fact_summary ?? '' }).tickers,
    ...tokenSet([
      ...(event.asset_symbols ?? event.assetSymbols ?? []),
      ...(event.listed_assets ?? event.listedAssets ?? []),
      ...(event.delisted_assets ?? event.delistedAssets ?? []),
      ...(event.tokens ?? []),
    ]),
  ]);
}

function hasOfficialPrimaryEvidence(event) {
  if ((event.evidence ?? []).length && event.evidence.every(isMirrorEvidence)) return false;
  if (event.verification_status === 'verified-primary' || event.verificationStatus === 'verified-primary') return true;
  return verifyEvent(event) === 'verified-primary';
}

export function notableExchangeListing(event) {
  if (!EXCHANGE_LISTING_TYPES.has(event.event_type ?? event.eventType)) return false;
  if (!hasOfficialPrimaryEvidence(event)) return false;
  const venues = eventVenueTokens(event);
  const listedAssets = listedAssetTokens(event);
  const majorVenue = [...MAJOR_LISTING_VENUES].some(venue => venues.has(venue.toUpperCase()));
  const top200Asset = [...listedAssets].some(symbol => TOP_200_SYMBOLS.has(symbol));
  return majorVenue || top200Asset;
}

export function credibilityScore(event) {
  const evidence = (event.evidence ?? []).filter(row => !isMirrorEvidence(row));
  if (evidence.some(row => OFFICIAL_KINDS.has(row.kind))) return 3;
  if (evidence.some(row => row.kind === 'market_data')) return 2;
  const reputableReports = evidence.filter(row => row.kind === 'media_report' && Number(row.source_tier ?? row.sourceTier ?? 2) <= 2);
  if (new Set(reputableReports.map(row => row.origin_key ?? row.originKey).filter(Boolean)).size >= 2) return 2;
  if (reputableReports.length >= 1) return 1;
  return 0;
}

export function officialMajorOverride(event) {
  if (!OFFICIAL_MAJOR_TYPES.has(event.event_type)) return null;
  const evidence = (event.evidence ?? []).filter(row => !isMirrorEvidence(row));
  const hasTierOneOfficial = evidence.some(row => row.kind === 'official_notice' && Number(row.source_tier ?? row.sourceTier ?? 3) === 1);
  return hasTierOneOfficial ? 'official_major' : null;
}

export function configFromNewsroomRows(rows = []) {
  const config = structuredClone(DEFAULT_NEWSROOM_CONFIG);
  for (const row of rows) {
    const key = row.key;
    const value = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
    if (key === 'weights') config.weights = { ...config.weights, ...value };
    if (key === 'thresholds' || key === 'scoring_thresholds') config.thresholds = normalizeThresholdConfig(value, config.thresholds);
    if (key === 'claim_quality') config.claim_quality = normalizeClaimQualityConfig(value);
  }
  validateWeights(config.weights);
  validateThresholds(config.thresholds);
  return config;
}

function normalizeThresholdConfig(value = {}, base = DEFAULT_NEWSROOM_CONFIG.thresholds) {
  return {
    ...base,
    publish: value.publish ?? value.publish_editorial_score_min ?? base.publish,
    review: value.review ?? value.review_editorial_score_min ?? base.review,
    publishCredibilityMin: value.publishCredibilityMin ?? value.publish_credibility_min ?? base.publishCredibilityMin,
    flashCredibilityMin: value.flashCredibilityMin ?? value.flash_credibility_min ?? base.flashCredibilityMin,
    reviewCredibilityMin: value.reviewCredibilityMin ?? value.review_credibility_min ?? base.reviewCredibilityMin,
    repeatAngleSimilarity: value.repeatAngleSimilarity ?? value.repeat_angle_similarity ?? base.repeatAngleSimilarity,
  };
}

function validateWeights(weights) {
  const keys = ['relevance', 'heat', 'timeliness', 'new_info', 'impact'];
  if (!weights || typeof weights !== 'object' || Object.keys(weights).length !== keys.length) throw new Error('weights must contain exactly relevance, heat, timeliness, new_info and impact');
  if (keys.some(key => !Number.isFinite(weights[key]) || weights[key] < 0)) throw new Error('weights must be non-negative numbers');
  const total = keys.reduce((sum, key) => sum + weights[key], 0);
  if (Math.abs(total - 100) > 1e-9) throw new Error('weights must total 100');
}

function validateThresholds(thresholds) {
  for (const key of ['publish', 'review', 'publishCredibilityMin', 'flashCredibilityMin', 'reviewCredibilityMin', 'repeatAngleSimilarity']) {
    const value = thresholds[key];
    const max = key === 'repeatAngleSimilarity' ? 1 : key.endsWith('CredibilityMin') ? 3 : 100;
    if (!Number.isFinite(value) || value < 0 || value > max || (key.endsWith('CredibilityMin') && !Number.isInteger(value))) throw new Error(`invalid threshold ${key}`);
  }
}

export function scoreEvent(event, options = {}) {
  const config = {
    weights: { ...DEFAULT_NEWSROOM_CONFIG.weights, ...(options.config?.weights ?? {}) },
    thresholds: normalizeThresholdConfig(options.config?.thresholds ?? {}),
  };
  validateWeights(config.weights);
  validateThresholds(config.thresholds);
  const now = new Date(options.now ?? Date.now());
  const claimQuality = claimQualityState(event, { now, config: options.config?.claim_quality ?? {} });
  const relevance = scoreRelevance(event, options.entitiesById ?? {});
  const heat = scoreHeat(event, now);
  const timeliness = scoreTimeliness(event, now);
  const newInfo = scoreNewInfo(event, options.articles ?? [], now, config.thresholds.repeatAngleSimilarity);
  const impactRaw = scoreImpact(event);
  const notableListing = relevance > 0 && notableExchangeListing(event);
  const relevanceScore = notableListing ? Math.max(relevance, 70) : relevance;
  const impact = notableListing ? Math.max(impactRaw, 50) : impactRaw;
  const factors = {
    relevance: relevanceScore,
    heat: heat.score,
    timeliness: timeliness.score,
    new_info: newInfo.score,
    impact,
  };
  const editorialScore = Object.entries(config.weights).reduce((sum, [key, weight]) => sum + factors[key] * (weight / 100), 0);
  const credibility = credibilityScore(event);
  const priorityOverride = officialMajorOverride(event);
  const requiredCredibility = (event.format === 'flash' || event.lane_format === 'flash') ? config.thresholds.flashCredibilityMin : config.thresholds.publishCredibilityMin;
  const eligible = claimQuality.claimable && relevance > 0 && editorialScore >= config.thresholds.publish && credibility >= requiredCredibility;
  const review = relevance > 0 && !eligible && credibility >= config.thresholds.reviewCredibilityMin && editorialScore >= config.thresholds.review;
  return {
    relevance: factors.relevance,
    heat: factors.heat,
    timeliness: factors.timeliness,
    new_info: factors.new_info,
    impact: factors.impact,
    weights: config.weights,
    editorial_score: Number(editorialScore.toFixed(2)),
    credibility,
    priority_override: priorityOverride,
    publish_eligible: eligible,
    review_eligible: review,
    explain: {
      claim_quality: claimQuality,
      heat: heat.explain,
      timeliness: { hours_since_source: timeliness.hours == null ? null : Number(timeliness.hours.toFixed(2)), unknown_source_time: timeliness.unknown === true },
      new_info: newInfo,
      impact: { input: event.impact_score ?? event.impactScore ?? event.usd_amount ?? event.usdAmount ?? null, raw_score: impactRaw },
      notable_exchange_listing: notableListing,
      notable_listing_boosts: notableListing ? { relevance_floor: 70, impact_floor: 50, raw_relevance: relevance } : null,
      credibility_separate_from_editorial_score: true,
      priority_override_does_not_bypass_eligibility: true,
      required_credibility_for_publish: requiredCredibility,
    },
  };
}

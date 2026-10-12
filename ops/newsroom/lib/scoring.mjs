import { countIndependentSources } from './dedupe.mjs';
import { trigramSimilarity } from './normalization.mjs';

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

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreRelevance(event, entitiesById = {}) {
  const entity = entitiesById[event.subject_entity] ?? {};
  const priorityScore = { 1: 100, 2: 70, 3: 40 }[entity.priority ?? event.entity_priority ?? event.entityPriority ?? 2] ?? 50;
  if (!SCOPED_EVENT_TYPES.has(event.event_type) || LOW_RELEVANCE_TYPES.has(event.event_type)) return 0;
  if ((event.event_type === 'fx_macro' || event.event_type === 'politics_market') && !(event.market_channel || event.marketChannel)) return 0;
  const typeFactor = HIGH_RELEVANCE_TYPES.has(event.event_type) ? 1 : event.market_channel || event.marketChannel ? 0.8 : 0.45;
  if (event.out_of_scope || event.outOfScope) return 0;
  return clamp(priorityScore * typeFactor);
}

function scoreHeat(event) {
  const discussion = event.discussion ?? {};
  const byPlatform = discussion.by_platform ?? discussion.byPlatform ?? {};
  const independentSources = discussion.independent_sources ?? countIndependentSources(event.evidence ?? []);
  const platformsWithIndependentItems = discussion.platforms_with_independent_items ?? Object.values(byPlatform).filter(value => value.independent_posts > 0).length;
  const growthScores = Object.entries(byPlatform).map(([platform, value]) => {
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
  const independentComponent = Math.min(40, Math.max(0, independentSources - 1) * 10);
  const platformComponent = Math.min(30, Math.max(0, platformsWithIndependentItems - 1) * 10);
  return {
    score: clamp(growthComponent + independentComponent + platformComponent),
    explain: {
      independent_sources: independentSources,
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

export function credibilityScore(event) {
  const evidence = event.evidence ?? [];
  if (evidence.some(row => OFFICIAL_KINDS.has(row.kind))) return 3;
  if (evidence.some(row => row.kind === 'market_data')) return 2;
  const reputableReports = evidence.filter(row => row.kind === 'media_report' && Number(row.source_tier ?? row.sourceTier ?? 2) <= 2);
  if (new Set(reputableReports.map(row => row.origin_key ?? row.originKey).filter(Boolean)).size >= 2) return 2;
  if (reputableReports.length >= 1) return 1;
  return 0;
}

export function officialMajorOverride(event) {
  if (!OFFICIAL_MAJOR_TYPES.has(event.event_type)) return null;
  const evidence = event.evidence ?? [];
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
  const relevance = scoreRelevance(event, options.entitiesById ?? {});
  const heat = scoreHeat(event);
  const timeliness = scoreTimeliness(event, now);
  const newInfo = scoreNewInfo(event, options.articles ?? [], now, config.thresholds.repeatAngleSimilarity);
  const impact = scoreImpact(event);
  const factors = {
    relevance,
    heat: heat.score,
    timeliness: timeliness.score,
    new_info: newInfo.score,
    impact,
  };
  const editorialScore = Object.entries(config.weights).reduce((sum, [key, weight]) => sum + factors[key] * (weight / 100), 0);
  const credibility = credibilityScore(event);
  const priorityOverride = officialMajorOverride(event);
  const requiredCredibility = (event.format === 'flash' || event.lane_format === 'flash') ? config.thresholds.flashCredibilityMin : config.thresholds.publishCredibilityMin;
  const eligible = relevance > 0 && editorialScore >= config.thresholds.publish && credibility >= requiredCredibility;
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
      heat: heat.explain,
      timeliness: { hours_since_source: timeliness.hours == null ? null : Number(timeliness.hours.toFixed(2)), unknown_source_time: timeliness.unknown === true },
      new_info: newInfo,
      impact: { input: event.impact_score ?? event.impactScore ?? event.usd_amount ?? event.usdAmount ?? null },
      credibility_separate_from_editorial_score: true,
      priority_override_does_not_bypass_eligibility: true,
      required_credibility_for_publish: requiredCredibility,
    },
  };
}

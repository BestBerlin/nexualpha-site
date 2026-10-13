export const DEFAULT_CLAIM_QUALITY = {
  defaultFreshnessHours: 48,
  freshnessHoursByType: {
    flash: 12,
    liquidation_wave: 6,
    price_move: 6,
    listing: 48,
    delisting: 48,
  },
  storyWindowDays: 7,
  marketStoryCadenceHours: 6,
  liquidationUsd1hMin: 50_000_000,
  majorCoinPriceMovePct1hMin: 3,
};

const MAJOR_PRICE_SUBJECTS = new Set(['BTC', 'BITCOIN', 'ETH', 'ETHEREUM']);
const MARKET_NOISE_TYPES = new Set(['liquidation_wave', 'price_move']);

const num = value => (Number.isFinite(Number(value)) ? Number(value) : null);
const text = value => String(value ?? '').trim();
const upper = value => text(value).toUpperCase();

function metric(event, keys) {
  const roots = [event, event.discussion, event.metrics, event.discussion?.metrics, event.discussion?.market, event.market];
  for (const root of roots) {
    if (!root || typeof root !== 'object') continue;
    for (const key of keys) {
      const value = root[key];
      const parsed = num(value);
      if (parsed != null) return parsed;
    }
  }
  return null;
}

function provenanceWindow(event) {
  return text(event.metrics?.provenance?.window ?? event.discussion?.provenance?.window ?? event.discussion?.metrics?.provenance?.window ?? event.discussion?.market?.provenance?.window).toLowerCase();
}

function dateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function earliestDate(values) {
  const dates = values.map(dateOrNull).filter(Boolean).sort((a, b) => a - b);
  return dates[0] ?? null;
}

function integerHours(value, label) {
  const parsed = num(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 24 * 30) throw new Error(`invalid ${label}`);
  return parsed;
}

export function freshnessHoursForType(type, config = {}) {
  const merged = normalizeClaimQualityConfig(config);
  const raw = merged.freshnessHoursByType[type] ?? merged.defaultFreshnessHours ?? merged.default_freshness_hours;
  const parsed = num(raw);
  return parsed && parsed > 0 ? parsed : DEFAULT_CLAIM_QUALITY.defaultFreshnessHours;
}

export function normalizeClaimQualityConfig(value = {}) {
  const config = value && typeof value === 'object' ? value : {};
  const normalized = {
    defaultFreshnessHours: config.defaultFreshnessHours ?? config.default_freshness_hours ?? DEFAULT_CLAIM_QUALITY.defaultFreshnessHours,
    freshnessHoursByType: {
      ...DEFAULT_CLAIM_QUALITY.freshnessHoursByType,
      ...(config.freshnessHoursByType ?? config.freshness_hours_by_type ?? {}),
    },
    storyWindowDays: config.storyWindowDays ?? config.story_window_days ?? DEFAULT_CLAIM_QUALITY.storyWindowDays,
    marketStoryCadenceHours: config.marketStoryCadenceHours ?? config.market_story_cadence_hours ?? DEFAULT_CLAIM_QUALITY.marketStoryCadenceHours,
    liquidationUsd1hMin: num(config.liquidationUsd1hMin ?? config.liquidation_usd_1h_min) ?? DEFAULT_CLAIM_QUALITY.liquidationUsd1hMin,
    majorCoinPriceMovePct1hMin: num(config.majorCoinPriceMovePct1hMin ?? config.major_coin_price_move_pct_1h_min) ?? DEFAULT_CLAIM_QUALITY.majorCoinPriceMovePct1hMin,
  };
  normalized.defaultFreshnessHours = integerHours(normalized.defaultFreshnessHours, 'claim quality defaultFreshnessHours');
  normalized.storyWindowDays = integerHours(normalized.storyWindowDays, 'claim quality storyWindowDays');
  normalized.marketStoryCadenceHours = integerHours(normalized.marketStoryCadenceHours, 'claim quality marketStoryCadenceHours');
  for (const [key, raw] of Object.entries(normalized.freshnessHoursByType)) {
    normalized.freshnessHoursByType[key] = integerHours(raw, `freshness hours for ${key}`);
  }
  for (const [key, valueNumber] of Object.entries({
    liquidationUsd1hMin: normalized.liquidationUsd1hMin,
    majorCoinPriceMovePct1hMin: normalized.majorCoinPriceMovePct1hMin,
  })) {
    if (!Number.isFinite(valueNumber) || valueNumber <= 0) throw new Error(`invalid claim quality ${key}`);
  }
  return normalized;
}

export function claimFreshnessState(event, { now = Date.now(), config = {} } = {}) {
  const nowMs = new Date(now).getTime();
  const source = new Date(event.source_published_at ?? event.sourcePublishedAt ?? event.occurred_at ?? event.occurredAt ?? 0);
  const rawHours = Number.isFinite(source.getTime()) ? (nowMs - source.getTime()) / 36e5 : null;
  const hours = rawHours == null || rawHours < 0 ? null : rawHours;
  const cutoff = freshnessHoursForType(event.event_type ?? event.eventType, config);
  const effective = earliestDate([event.deadline_at, event.deadlineAt, event.effective_at, event.effectiveAt, event.discussion?.deadline_at, event.discussion?.deadlineAt, event.discussion?.effective_at, event.discussion?.effectiveAt]);
  const rawFollowup = event.major_followup_at ?? event.majorFollowupAt ?? event.discussion?.major_followup_at ?? event.discussion?.majorFollowupAt;
  const followup = dateOrNull(rawFollowup);
  const deadlinePassed = Boolean(effective) && Number.isFinite(effective.getTime()) && effective.getTime() < nowMs;
  const followupHours = followup ? (nowMs - followup.getTime()) / 36e5 : null;
  const hasFollowupAfterDeadline = deadlinePassed && Boolean(followup)
    && followup.getTime() >= effective.getTime()
    && followup.getTime() <= nowMs
    && followupHours >= 0
    && followupHours <= cutoff;
  return {
    hours_since_source: hours == null ? null : Number(hours.toFixed(2)),
    freshness_hours: cutoff,
    fresh: hours == null ? false : hours <= cutoff,
    deadline_passed: deadlinePassed,
    has_major_followup_after_deadline: hasFollowupAfterDeadline,
    passed_cutoff_at: deadlinePassed ? effective.toISOString() : null,
    claimable: hours != null && hours <= cutoff && (!deadlinePassed || hasFollowupAfterDeadline),
  };
}

export function marketNoiseState(event, { now = Date.now(), config = {} } = {}) {
  const type = event.event_type ?? event.eventType;
  if (!MARKET_NOISE_TYPES.has(type)) return { noise_type: null, claimable: true, reason: 'not_market_noise' };
  const cfg = normalizeClaimQualityConfig(config);
  const lastMarketStoryAt = event.last_market_story_at ?? event.lastMarketStoryAt ?? event.discussion?.last_market_story_at ?? event.discussion?.lastMarketStoryAt;
  if (lastMarketStoryAt) {
    const lastMs = new Date(lastMarketStoryAt).getTime();
    if (Number.isFinite(lastMs) && new Date(now).getTime() - lastMs < cfg.marketStoryCadenceHours * 36e5) {
      return { noise_type: type, claimable: false, reason: 'market_story_cadence' };
    }
  }
  if (type === 'liquidation_wave') {
    const oneHourWindow = provenanceWindow(event) === 'h1';
    const value = metric(event, ['liquidations_usd_1h', 'liquidation_usd_1h', 'total_liquidations_usd_1h'])
      ?? (oneHourWindow ? metric(event, ['total_liquidations_usd']) : null);
    return {
      noise_type: type,
      liquidation_usd_1h: value,
      claimable: value != null && value >= cfg.liquidationUsd1hMin,
      reason: value != null && value >= cfg.liquidationUsd1hMin ? 'important_liquidation_threshold' : 'below_liquidation_threshold',
    };
  }
  const move = Math.abs(metric(event, ['price_move_pct_1h', 'price_change_pct_1h', 'change_pct_1h']) ?? 0);
  const subjects = [event.subject_entity, event.subjectEntity, ...(event.subjects ?? []), event.story_asset, event.storyAsset].map(upper);
  const major = subjects.some(value => MAJOR_PRICE_SUBJECTS.has(value));
  return {
    noise_type: type,
    price_move_pct_1h: move,
    major_subject: major,
    claimable: major && move >= cfg.majorCoinPriceMovePct1hMin,
    reason: major && move >= cfg.majorCoinPriceMovePct1hMin ? 'important_price_move_threshold' : 'below_price_move_threshold',
  };
}

export function claimQualityState(event, options = {}) {
  const freshness = claimFreshnessState(event, options);
  const noise = marketNoiseState(event, options);
  return {
    freshness,
    market_noise: noise,
    claimable: freshness.claimable && noise.claimable,
  };
}

export function claimFreshnessEligibilitySql({ eventAlias = 'e' } = {}) {
  const e = eventAlias;
  const freshnessHours = `coalesce(
      (SELECT (value->'freshness_hours_by_type'->>${e}.event_type)::int FROM newsroom_config WHERE key='claim_quality'),
      (SELECT (value->'freshnessHoursByType'->>${e}.event_type)::int FROM newsroom_config WHERE key='claim_quality'),
      (SELECT (value->>'default_freshness_hours')::int FROM newsroom_config WHERE key='claim_quality'),
      (SELECT (value->>'defaultFreshnessHours')::int FROM newsroom_config WHERE key='claim_quality'),
      CASE WHEN ${e}.event_type IN ('liquidation_wave','price_move') THEN ${DEFAULT_CLAIM_QUALITY.freshnessHoursByType.price_move} ELSE ${DEFAULT_CLAIM_QUALITY.defaultFreshnessHours} END)`;
  const cutoffAt = `(SELECT min(cutoff_at) FROM (VALUES (${e}.deadline_at), (${e}.effective_at)) AS cutoff(cutoff_at) WHERE cutoff_at IS NOT NULL)`;
  return `coalesce(${e}.source_published_at, ${e}.occurred_at) <= now()
    AND coalesce(${e}.source_published_at, ${e}.occurred_at) >= now() - make_interval(hours => ${freshnessHours})
    AND (
      ${cutoffAt} IS NULL
      OR ${cutoffAt} >= now()
      OR (${e}.major_followup_at >= ${cutoffAt}
        AND ${e}.major_followup_at <= now()
        AND ${e}.major_followup_at >= now() - make_interval(hours => ${freshnessHours}))
    )`;
}

export function claimMarketNoiseEligibilitySql({ eventAlias = 'e' } = {}) {
  const e = eventAlias;
  const liquidation = `coalesce(
      (${e}.discussion->>'liquidations_usd_1h')::numeric,
      (${e}.discussion->'metrics'->>'liquidations_usd_1h')::numeric,
      (${e}.discussion->'market'->>'liquidations_usd_1h')::numeric,
      CASE WHEN coalesce(${e}.discussion->'provenance'->>'window', ${e}.discussion->'metrics'->'provenance'->>'window', ${e}.discussion->'market'->'provenance'->>'window')='h1'
        THEN (${e}.discussion->>'total_liquidations_usd')::numeric END,
      0) >= coalesce((SELECT (value->>'liquidation_usd_1h_min')::numeric FROM newsroom_config WHERE key='claim_quality'), ${DEFAULT_CLAIM_QUALITY.liquidationUsd1hMin})`;
  const price = `upper(coalesce(${e}.story_asset, ${e}.subject_entity, ${e}.subjects[1], '')) = ANY(ARRAY['BTC','BITCOIN','ETH','ETHEREUM'])
      AND abs(coalesce(
        (${e}.discussion->>'price_move_pct_1h')::numeric,
        (${e}.discussion->'metrics'->>'price_move_pct_1h')::numeric,
        (${e}.discussion->'market'->>'price_move_pct_1h')::numeric,
        (${e}.discussion->>'change_pct_1h')::numeric,
        0)) >= coalesce((SELECT (value->>'major_coin_price_move_pct_1h_min')::numeric FROM newsroom_config WHERE key='claim_quality'), ${DEFAULT_CLAIM_QUALITY.majorCoinPriceMovePct1hMin})`;
  return `(${e}.event_type NOT IN ('liquidation_wave','price_move')
    OR ((${e}.event_type='liquidation_wave' AND ${liquidation})
      OR (${e}.event_type='price_move' AND ${price}))
      AND NOT EXISTS (
        SELECT 1 FROM events active_market
        WHERE active_market.state='claimed'
          AND active_market.event_type IN ('liquidation_wave','price_move')
      )
      AND NOT EXISTS (
        SELECT 1 FROM articles recent_article
        JOIN events recent_event ON recent_event.id=recent_article.event_id
        WHERE recent_event.event_type IN ('liquidation_wave','price_move')
          AND recent_article.published_at > now() - make_interval(hours => coalesce((SELECT (value->>'market_story_cadence_hours')::int FROM newsroom_config WHERE key='claim_quality'), ${DEFAULT_CLAIM_QUALITY.marketStoryCadenceHours}))
      ))`;
}

export function claimStoryGroupKeySql({ eventAlias = 'e' } = {}) {
  const e = eventAlias;
  return `CASE
    WHEN ${e}.parent_event_id IS NOT NULL THEN 'event:' || ${e}.id::text
    WHEN ${e}.event_type IN ('listing','delisting') AND (${e}.story_group_key IS NOT NULL OR ${e}.story_asset IS NOT NULL OR ${e}.story_action IS NOT NULL)
      THEN coalesce(${e}.story_group_key, concat_ws(':', coalesce(${e}.story_action, ${e}.event_type), lower(${e}.story_asset)))
      ELSE 'event:' || ${e}.id::text END`;
}


export function claimStoryVenueJsonSql({ eventAlias = 'e' } = {}) {
  const e = eventAlias;
  return `CASE
    WHEN coalesce(jsonb_array_length(CASE WHEN jsonb_typeof(${e}.discussion->'story_venues')='array' THEN ${e}.discussion->'story_venues' ELSE '[]'::jsonb END), 0) > 0 THEN ${e}.discussion->'story_venues'
    WHEN ${e}.subject_entity IS NOT NULL THEN to_jsonb(ARRAY[${e}.subject_entity])
    ELSE '[]'::jsonb END`;
}

export function claimFreshnessRankSql({ eventAlias = 'e', scoreAlias = 's' } = {}) {
  const e = eventAlias;
  const s = scoreAlias;
  return `(${s}.editorial_score * greatest(0.05, least(1, 1 - (extract(epoch from (now() - coalesce(${e}.source_published_at, ${e}.occurred_at, ${e}.first_seen_at))) / 3600) / coalesce(
      (SELECT (value->'freshness_hours_by_type'->>${e}.event_type)::numeric FROM newsroom_config WHERE key='claim_quality'),
      (SELECT (value->'freshnessHoursByType'->>${e}.event_type)::numeric FROM newsroom_config WHERE key='claim_quality'),
      (SELECT (value->>'default_freshness_hours')::numeric FROM newsroom_config WHERE key='claim_quality'),
      (SELECT (value->>'defaultFreshnessHours')::numeric FROM newsroom_config WHERE key='claim_quality'),
      CASE WHEN ${e}.event_type IN ('liquidation_wave','price_move') THEN ${DEFAULT_CLAIM_QUALITY.freshnessHoursByType.price_move} ELSE ${DEFAULT_CLAIM_QUALITY.defaultFreshnessHours} END))))`;
}

export function claimRankOrderSql(options = {}) {
  const weighted = claimFreshnessRankSql(options);
  const e = options.eventAlias ?? 'e';
  const s = options.scoreAlias ?? 's';
  return `${weighted} DESC, ${s}.editorial_score DESC, (${s}.priority_override='official_major') DESC NULLS LAST, ${e}.source_published_at DESC NULLS LAST, ${e}.id`;
}

export function claimStoryWindowSql() {
  return `make_interval(days => coalesce((SELECT (value->>'story_window_days')::int FROM newsroom_config WHERE key='claim_quality'), ${DEFAULT_CLAIM_QUALITY.storyWindowDays}))`;
}

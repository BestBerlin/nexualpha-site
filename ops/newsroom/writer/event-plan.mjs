// The resolver lives in the site repo; deploy.sh vendors its module closure into the release
// (ops/newsroom/vendor/site-data). Fall back to tool-only CTAs rather than break the CLI.
async function loadResolver() {
  for (const spec of ['../vendor/site-data/promotions.js', '../../../pilot-01-prototype/src/data/promotions.js']) {
    try { return (await import(new URL(spec, import.meta.url).href)).resolvePromotions; } catch { /* try next */ }
  }
  return null;
}
const loadedResolver = await loadResolver();
export const promotionsResolverAvailable = Boolean(loadedResolver);
const defaultResolvePromotions = loadedResolver ?? (() => []);

const FORMAT_BY_EVENT = {
  key_person_statement: 'quote_check',
  dispute: 'dispute',
  viral_claim: 'dispute',
  lawsuit: 'dispute',
  liquidation_wave: 'data_explainer',
  liquidity_anomaly: 'data_explainer',
  stablecoin_depeg: 'data_explainer',
  price_move: 'data_explainer',
  flows: 'data_explainer',
  whale_transfer: 'data_explainer',
  exchange_flow: 'data_explainer',
  listing: 'flash',
  delisting: 'flash',
  product_launch: 'breakdown',
  campaign: 'breakdown',
  withdrawal_halt: 'breakdown',
  insolvency: 'breakdown',
  bankruptcy_filing: 'breakdown',
  hack_exploit: 'breakdown',
  loss_repayment: 'breakdown',
  enforcement: 'breakdown',
  regulation: 'breakdown',
  market_structure: 'breakdown',
  institutional_trade: 'breakdown',
  equity_event: 'breakdown',
  earnings_flows: 'breakdown',
  crypto_treasury_company: 'breakdown',
  fx_macro: 'breakdown',
  politics_market: 'breakdown',
  followup: 'followup',
};

const QUESTION_BY_EVENT = {
  liquidation_wave: 'How do I avoid getting liquidated?',
  price_move: 'What changed, and what risk level should readers watch?',
  liquidity_anomaly: 'What market stress does this signal?',
  withdrawal_halt: 'Is customer money safe, and what withdrawal conditions changed?',
  insolvency: 'What is verified, and what remains unknown about solvency?',
  hack_exploit: 'What happened, what funds are at risk, and what should users check?',
  listing: 'Where is this asset available, and what does it cost to use?',
  product_launch: 'Who can use it, what does it cost, and what are the limits?',
  campaign: 'Who is eligible, what are the real conditions, and when does it end?',
  regulation: 'What changes for users or venues?',
  enforcement: 'What did the authority say, and what changes now?',
  lawsuit: 'What is alleged, what is the response, and what is proven?',
  dispute: 'What is claimed, what is disputed, and what evidence exists?',
  viral_claim: 'What is the claim, and has any primary source confirmed it?',
  key_person_statement: 'What exactly was said, by whom, and when?',
  stablecoin_depeg: 'How large is the deviation, and what sources measured it?',
  flows: 'What moved, through which venue or product, and why does it matter?',
  whale_transfer: 'What moved on-chain, and what cannot be inferred from the transfer?',
  exchange_flow: 'What moved to or from exchanges, and what does the evidence prove?',
  liquidation_wave: 'How large is the liquidation wave, and what is the measurement window?',
  fx_macro: 'What changes for crypto readers from this macro move?',
  politics_market: 'What is the market mechanism, without overstating causality?',
};

const CTA_INTENTS_BY_EVENT = {
  liquidation_wave: ['site_tool', 'risk_tools'],
  price_move: ['site_tool', 'risk_tools'],
  liquidity_anomaly: ['site_tool', 'risk_tools'],
  withdrawal_halt: ['site_tool', 'withdrawal_conditions'],
  insolvency: ['site_tool', 'withdrawal_conditions'],
  hack_exploit: ['site_tool', 'withdrawal_conditions'],
  listing: ['fees', 'venue_support'],
  product_launch: ['fees', 'venue_support'],
  campaign: ['fees', 'venue_support'],
  regulation: ['site_tool'],
  enforcement: ['site_tool'],
  lawsuit: ['site_tool'],
  politics_market: ['site_tool'],
  fx_macro: ['site_tool'],
  dispute: ['site_tool'],
  viral_claim: ['site_tool'],
};

const FALLBACK_HREF_BY_INTENT = {
  site_tool: '/compare',
  risk_tools: '/liquidations',
  withdrawal_conditions: '/compare',
  venue_support: '/compare',
  fees: '/compare',
  signup: '/compare',
};

const SITE_TOOL_BY_EVENT = {
  liquidation_wave: '/liquidations',
  price_move: '/funding-rates',
  liquidity_anomaly: '/funding-rates',
};

const NEUTRAL_ONLY_EVENTS = new Set([
  'withdrawal_halt',
  'insolvency',
  'hack_exploit',
  'regulation',
  'enforcement',
  'lawsuit',
  'politics_market',
  'fx_macro',
  'dispute',
  'viral_claim',
]);

const text = value => String(value ?? '').trim();
const lower = value => text(value).toLowerCase();

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function displayName(entity, locale = 'en') {
  if (!entity) return '';
  if (typeof entity === 'string') return entity;
  if (typeof entity.display_name === 'string') return entity.display_name;
  return entity.display_name?.[locale] ?? entity.display_name?.en ?? entity.id ?? '';
}

function normalizeEntity(entity, locale = 'en') {
  if (typeof entity === 'string') return { id: entity, name: entity };
  return {
    ...entity,
    id: entity.id,
    kind: entity.kind,
    name: displayName(entity, locale),
    partner_slug: entity.partner_slug,
    aliases: Array.isArray(entity.aliases) ? entity.aliases : [],
    priority: entity.priority,
  };
}

function inferCoins(event, entities) {
  const values = [...(event.subjects ?? []), ...(event.original_links ?? []), event.title_internal, event.fact_summary]
    .join(' ')
    .match(/\b[A-Z]{2,10}\b/g) ?? [];
  return unique([
    ...entities.filter(entity => entity.kind === 'coin').flatMap(entity => [entity.id, entity.name, ...entity.aliases]),
    ...values.filter(value => !['UTC', 'ETF', 'SEC', 'CFTC', 'USD'].includes(value)),
  ]).slice(0, 4);
}

function topicTagsFor(event, entities, coins) {
  return unique([
    event.event_type,
    event.subject_entity,
    ...(event.subjects ?? []),
    ...coins,
    ...entities.flatMap(entity => [entity.id, entity.partner_slug, entity.kind, entity.name, ...(entity.aliases ?? [])]),
  ].map(lower));
}

function supportedCommercialVenues(event, entities) {
  if (NEUTRAL_ONLY_EVENTS.has(event.event_type)) return [];
  const eligibleEvents = new Set(['listing', 'product_launch', 'campaign', 'liquidation_wave', 'price_move', 'liquidity_anomaly']);
  if (!eligibleEvents.has(event.event_type)) return [];
  const evidenceText = (event.evidence ?? []).map(item => [
    item.url,
    item.excerpt,
    item.supports,
    ...(item.venues ?? []),
  ].join(' ')).join(' ').toLowerCase();
  return unique(entities.flatMap(entity => {
    const candidates = [entity.partner_slug, entity.id, entity.name, ...(entity.aliases ?? [])].filter(Boolean);
    const supported = candidates.some(candidate => evidenceText.includes(lower(candidate)));
    return supported ? [entity.partner_slug, entity.kind === 'exchange' ? entity.id : null] : [];
  }).map(lower));
}

function sanitizePromotion(promotion) {
  return {
    id: promotion.id,
    kind: promotion.kind,
    name: promotion.name,
    link: promotion.link,
    partner: promotion.partner,
  };
}

function evidenceSummary(event) {
  return (event.evidence ?? []).map(item => ({
    ...item,
    id: item.id,
    url: item.url,
    kind: item.kind,
    excerpt: item.excerpt,
    author_account: item.author_account,
    published_at: item.published_at,
    confidence: item.confidence,
    supports: item.supports,
    is_independent: item.is_independent,
  }));
}

function relatedFromHistory(event, history = [], locale = 'en') {
  const eventTerms = new Set([
    lower(event.subject_entity),
    ...(event.subjects ?? []).map(lower),
    ...text(event.title_internal).split(/\W+/).filter(term => term.length > 3).map(lower),
  ]);
  return history.map(row => {
    const title = typeof row.title === 'string' ? row.title : row.title?.[locale] ?? row.titles?.[locale] ?? row.title?.en ?? row.titles?.en ?? '';
    const haystack = [title, row.slug, row.primaryQuery, ...(row.entities ?? [])].join(' ').toLowerCase();
    const score = [...eventTerms].filter(term => term && haystack.includes(term)).length;
    return { row, score };
  }).filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ row }) => ({
      slug: row.slug,
      title: typeof row.title === 'string' ? row.title : row.title?.[locale] ?? row.titles?.[locale] ?? row.title?.en ?? row.titles?.en,
      url: row.url ?? row.href ?? (row.slug ? `/news/${row.slug}` : undefined),
      published_at: row.publishedAt ?? row.published_at ?? row.createdAt,
    }));
}

function angleFor(event, format) {
  const isFollowup = event.parent_event_id != null || event.event_type === 'followup';
  const question = QUESTION_BY_EVENT[event.event_type] ?? 'What happened, what is verified, and what should readers check next?';
  return {
    format: isFollowup ? 'followup' : format,
    main_question: question,
    angle: `${question} ${isFollowup ? 'Frame this as a follow-up to the earlier event and state what changed.' : 'Keep facts, interpretation and unknowns separate; open with the verified fact and avoid unsupported causality.'}`,
  };
}

function ctaHints(event, entities, coins, { locale, market, now, resolvePromotions }) {
  const eventType = event.event_type;
  const intents = CTA_INTENTS_BY_EVENT[eventType] ?? ['site_tool'];
  const venueCandidates = supportedCommercialVenues(event, entities);
  const topicTags = topicTagsFor(event, entities, coins);
  const hints = [];
  for (const intent of intents.slice(0, 2)) {
    const venue = venueCandidates[0];
    const commercialAllowed = Boolean(venue && !NEUTRAL_ONLY_EVENTS.has(eventType) && intent !== 'site_tool');
    const promotions = resolvePromotions({
      topicTags: unique([intent, ...topicTags]),
      venue: commercialAllowed ? [venue] : undefined,
      coin: coins[0],
      locale,
      market,
      now,
    }).filter(promotion => commercialAllowed || promotion.kind === 'tool').map(sanitizePromotion);
    const fallback_href = intent === 'site_tool' ? SITE_TOOL_BY_EVENT[eventType] ?? FALLBACK_HREF_BY_INTENT.site_tool : FALLBACK_HREF_BY_INTENT[intent] ?? '/compare';
    hints.push({
      intent,
      directive: commercialAllowed ? `::cta ${intent} ${venue}` : `::cta ${intent}`,
      commercial_allowed: commercialAllowed,
      venue: commercialAllowed ? venue : undefined,
      fallback_href,
      promotions: promotions.length ? promotions : [{ id: 'site-tool', kind: 'tool', name: 'NexuAlpha tool', link: fallback_href }],
    });
  }
  return hints;
}

export function suggestEventFormat(event) {
  return FORMAT_BY_EVENT[event.event_type] ?? 'breakdown';
}

export function enrichEvent(event, {
  history = [],
  locale = 'en',
  market,
  now = new Date().toISOString(),
  resolvePromotions = defaultResolvePromotions,
} = {}) {
  if (!event || typeof event !== 'object') throw new Error('event is required');
  const entities = (event.entities ?? []).map(entity => normalizeEntity(entity, locale));
  const coins = inferCoins(event, entities);
  const suggested_format = event.parent_event_id != null ? 'followup' : suggestEventFormat(event);
  const angle = angleFor(event, suggested_format);
  const cta_hints = ctaHints(event, entities, coins, { locale, market, now, resolvePromotions });
  return {
    ...event,
    entities,
    evidence: evidenceSummary(event),
    suggested_format,
    suggested_angle: angle.angle,
    main_question: angle.main_question,
    cta_hints,
    topic_tags: topicTagsFor(event, entities, coins),
    related_existing_articles: [
      ...(event.related_articles ?? []),
      ...relatedFromHistory(event, history, locale),
    ],
    writer_guardrails: [
      'Re-fetch each key source before writing.',
      'No partner codes or affiliate URLs in prose; use only ::cta directives.',
      'Risk, dispute, regulation and security events use neutral CTAs only.',
      'Separate verified facts, interpretation and unknowns.',
    ],
  };
}

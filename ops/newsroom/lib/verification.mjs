import { normalizeText } from './normalization.mjs';
import { storyFacts, conflictingFacts, factsMatch, titleSimilarity } from './facts.mjs';

const primaryKinds = new Set(['official_notice', 'filing', 'court_record']);
const primaryPlatforms = new Set(['exchange', 'regulator', 'court', 'edgar', 'company']);
const allegation = /fraud|scam|rug.?pull|insolven|bankrupt|诈骗|詐騙|跑路|破产|破產|资不抵债|資不抵債/iu;
const mirror = row => /^nexualpha-official/.test(row.source_id ?? '');

// Fact matching is conservative about contradictory symbols, amounts and dates.
export function matchingFacts(event, row, watchlist = []) {
  const fact = normalizeText(event.fact_summary || event.title_internal);
  const captured = normalizeText([row.title, row.excerpt, row.body_excerpt].filter(Boolean).join(' '));
  const left = storyFacts({ ...event, title: event.fact_summary || event.title_internal }, watchlist);
  // Do not copy the event's subject/type into source evidence: they must be captured.
  const right = storyFacts(row, watchlist);
  if (conflictingFacts(left, right) || ['tickers', 'amounts', 'dates'].some(key => left[key].some(value => !right[key].includes(value)))) return false;
  const eventTime = event.source_published_at ?? event.published_at;
  if (eventTime && row.published_at && Math.abs(Date.parse(eventTime) - Date.parse(row.published_at)) > 48 * 36e5) return false;
  if (event.occurred_at && row.occurred_at && Math.abs(Date.parse(event.occurred_at) - Date.parse(row.occurred_at)) > 48 * 36e5) return false;
  if (fact.length >= 12 && captured.includes(fact)) return true;
  return factsMatch(left, right) || (left.action !== 'unknown' && left.action === right.action
    && left.entities.some(entity => right.entities.includes(entity)) && titleSimilarity(fact, captured) >= 0.65);
}

export function verifyEvent(event, { watchlist = [] } = {}) {
  const evidence = event.evidence ?? [];
  if (event.verification_status === 'conflicting' || evidence.some(row => row.conflicting)) return 'needs-review';
  if (event.verification_status === 'debunked') return 'debunked';
  const matched = evidence.filter(row => !mirror(row) && matchingFacts(event, row, watchlist) && /^https?:\/\//.test(row.url ?? ''));
  const primary = matched.some(row => row.verified_official === true && Number(row.source_tier) === 1 && primaryPlatforms.has(row.source_platform) && primaryKinds.has(row.kind));
  if (primary) return 'verified-primary';
  if (allegation.test([event.title_internal, event.fact_summary, event.event_type].join(' '))) return 'needs-review';
  // URLs are origins, not independent publishers. One outlet's two URLs count once.
  const independent = matched.filter(row => row.is_independent !== false && row.origin_key && ['media', 'google_news', 'exchange', 'regulator', 'court', 'edgar', 'company'].includes(row.source_platform));
  const origins = new Set(), publishers = new Set();
  for (const row of independent) {
    let publisher;
    try { publisher = new URL(row.url).hostname.toLowerCase().replace(/^www\./, ''); } catch { continue; }
    if (origins.has(row.origin_key) || publishers.has(publisher)) continue;
    origins.add(row.origin_key); publishers.add(publisher);
  }
  return publishers.size >= 2 ? 'corroborated' : 'unverified';
}

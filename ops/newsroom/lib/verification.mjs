import { normalizeText } from './normalization.mjs';

const primaryKinds = new Set(['official_notice', 'filing', 'court_record']);
const primaryPlatforms = new Set(['exchange', 'regulator', 'court', 'edgar', 'company']);
const allegation = /fraud|scam|rug.?pull|insolven|bankrupt|诈骗|詐騙|跑路|破产|破產|资不抵债|資不抵債/iu;
const mirror = row => /^nexualpha-official/.test(row.source_id ?? '');

// Event verification checks the captured fact, not every claim of a future article.
// Exact normalized headline/excerpt containment is intentionally conservative.
export function matchingFacts(event, row) {
  const fact = normalizeText(event.fact_summary || event.title_internal);
  const captured = normalizeText([row.title, row.excerpt, row.body_excerpt].filter(Boolean).join(' '));
  return fact.length >= 12 && captured.includes(fact);
}

export function verifyEvent(event) {
  const evidence = event.evidence ?? [];
  if (event.verification_status === 'conflicting' || evidence.some(row => row.conflicting)) return 'needs-review';
  if (event.verification_status === 'debunked') return 'debunked';
  const matched = evidence.filter(row => !mirror(row) && matchingFacts(event, row) && /^https?:\/\//.test(row.url ?? ''));
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

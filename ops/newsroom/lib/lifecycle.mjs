import { trigramSimilarity } from './normalization.mjs';

/** A published event earns a follow-up only with declared new facts or a new
 * reader question. Returns a decision; never publishes or mutates history. */
export function followupDecision(event, item, { questionSimilarity = 0.5 } = {}) {
  if (event.state !== 'published') return { action: 'append_evidence', reason: 'not_published' };
  const types = item.new_fact_types ?? [];
  const majorFact = types.find(type => ['official_response', 'filing', 'repayment'].includes(type));
  if (majorFact) return { action: 'create_followup', reason: majorFact, parent_event_id: event.id };
  const change = item.number_change;
  if (change && Number.isFinite(change.previous) && Number.isFinite(change.current) && change.previous !== 0) {
    const ratio = Math.abs(change.current - change.previous) / Math.abs(change.previous);
    if (ratio > 0.2) return { action: 'create_followup', reason: 'number_change_over_20_percent', change_ratio: ratio, parent_event_id: event.id };
  }
  const previous = event.main_question;
  const next = item.main_question;
  if (typeof previous === 'string' && previous.trim() && typeof next === 'string' && next.trim()
      && trigramSimilarity(previous, next) < questionSimilarity) {
    return { action: 'create_followup', reason: 'different_reader_question', parent_event_id: event.id };
  }
  return { action: 'append_evidence', reason: 'no_major_new_fact_or_question', update_existing_article: true };
}

/** Unknown source time stays unknown. Claimed/published/history states never
 * expire here. Callers persist this decision in their own transaction. */
export function expiryDecision(event, { now = Date.now(), format = event.format ?? 'breakdown' } = {}) {
  if (!['new', 'candidate'].includes(event.state ?? 'new') || event.claimed_at) return { expired: false, reason: 'not_unclaimed' };
  const timestamp = event.source_published_at;
  const time = timestamp == null ? NaN : new Date(timestamp).getTime();
  const current = new Date(now).getTime();
  if (!Number.isFinite(time) || !Number.isFinite(current)) return { expired: false, reason: 'unknown_time', age_hours: null };
  const age = Math.max(0, (current - time) / 3600000);
  const hours = format === 'flash' ? 12 : ['data_explainer', 'explainer', 'guide'].includes(format) ? 168 : 48;
  return { expired: age > hours, reason: age > hours ? 'timeliness_window_elapsed' : 'within_window', age_hours: age, window_hours: hours };
}

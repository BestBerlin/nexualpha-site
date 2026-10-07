export const ANALYTICS_EVENT_TYPES = Object.freeze([
  'page_view',
  'decision_impression',
  'decision_select',
  'cta_visible',
  'outbound_handoff',
  'referral_click',
  'telegram_handoff',
]);

export const ANALYTICS_EVENT_TYPE_SET = new Set(ANALYTICS_EVENT_TYPES);

export const TELEGRAM_SOURCE_ALIASES = Object.freeze(['telegram', 'tg', 'tg_channel']);
const TELEGRAM_SOURCE_ALIAS_SET = new Set(TELEGRAM_SOURCE_ALIASES);

export function isTelegramSource(value) {
  return typeof value === 'string' && TELEGRAM_SOURCE_ALIAS_SET.has(value.toLowerCase());
}

export function referralClickPersistenceIdentity(row = {}) {
  return JSON.stringify([
    row.session || 'unknown',
    row.page || '/',
    row.market || 'unknown',
    row.product || 'unknown',
    row.accountStage || 'unknown',
    row.funding || 'unknown',
    row.platform || 'unknown',
    row.placement || 'unknown',
    row.experiment || 'none',
    row.variant || 'control',
  ]);
}

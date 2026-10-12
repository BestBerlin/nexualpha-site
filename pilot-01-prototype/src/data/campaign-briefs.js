export const CAMPAIGN_BRIEFS_URL = '/content/campaign-briefs.json';
export const BRIEF_LIMITS = { headline: 180, summary: 1200, who_can_join: 600, reward_text: 300, label: 80, value: 300 };
export const BRIEF_LOCALES = ['en', 'zh-Hans', 'zh-Hant', 'es', 'pt-BR', 'fr', 'de', 'it', 'ja', 'ko', 'ru', 'tr', 'id', 'vi', 'ar', 'ur', 'uk'];
export const localizedBriefText = (record, locale = 'en') => {
  const requested = String(locale || 'en');
  if (typeof record?.[requested] === 'string' && record[requested].trim()) return record[requested].trim();
  if (typeof record?.en === 'string' && record.en.trim()) return record.en.trim();
  return '';
};
export const campaignBriefItems = briefs => (Array.isArray(briefs) ? briefs : Array.isArray(briefs?.items) ? briefs.items : []).filter(brief => brief && typeof brief === "object" && typeof brief.id === "string");
export function attachCampaignBriefs(feed, briefs) {
  return { ...(feed && typeof feed === 'object' ? feed : {}), campaignBriefs: campaignBriefItems(briefs) };
}
export function campaignBrief(item, feed) {
  return feed?.campaignBriefs?.find(brief => brief.id === String(item.id || item.url || item.officialSource?.url || '')) || item.brief || null;
}
export function applyCampaignBriefs(item, feed, locale = 'en') {
  const brief = campaignBrief(item, feed);
  const rawTitle = typeof item.title === 'object' ? item.title?.en || '' : item.title || '';
  return { ...item, rawTitle, brief, title: localizedBriefText(brief?.headline, locale) || (typeof item.title === 'object' ? item.title?.[locale] || item.title?.en : item.title), summary: localizedBriefText(brief?.summary, locale) || (typeof item.summary === 'object' ? item.summary?.[locale] || item.summary?.en : item.summary) };
}
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const iso = value => {
  if (typeof value !== 'string') return false;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  const [, year, month, day, hour, minute, second] = match.map(Number);
  const calendar = new Date(0);
  calendar.setUTCFullYear(year, month - 1, day);
  return calendar.getUTCFullYear() === year && calendar.getUTCMonth() === month - 1 && calendar.getUTCDate() === day && hour < 24 && minute < 60 && second < 60;
};
// Validation is intentionally separate from display: content publishing must run it before replacing the asset.
export function validateCampaignBriefs(payload, { ids = [], now = Date.now(), partnerCodes = [] } = {}) {
  const errors = [];
  if (!record(payload) || !Array.isArray(payload.items) || Object.keys(payload).some(key => key !== 'items')) return ['Expected {"items": [...]}'];
  const seen = new Set();
  const current = new Set(ids.map(String));
  const text = (value, limit, path) => {
    if (typeof value !== 'string' || !value.trim() || [...value].length > limit) errors.push(`${path}: nonempty text, maximum ${limit} characters`);
    if (typeof value === 'string' && (/(?:https?:\/\/|\b(?:referral|invite|partner)[ _-]?code\b|[?&](?:ref|invite|affiliate|code)=)/i.test(value) || partnerCodes.some(code => code && value.toLowerCase().includes(String(code).toLowerCase())))) errors.push(`${path}: partner codes, referral text and URLs are forbidden`);
  };
  const localized = (value, limit, path) => {
    if (!record(value)) { errors.push(`${path}: expected locale object`); return; }
    for (const [locale, copy] of Object.entries(value)) {
      if (!BRIEF_LOCALES.includes(locale)) errors.push(`${path}: unsupported locale ${locale}`);
      text(copy, limit, `${path}.${locale}`);
    }
  };
  payload.items.forEach((brief, index) => {
    const path = `items[${index}]`;
    if (!record(brief)) { errors.push(`${path}: expected object`); return; }
    const fields = ['id', 'updated', 'headline', 'summary', 'key_facts', 'who_can_join', 'deadline', 'reward_text', 'source_checked'];
    for (const key of Object.keys(brief)) if (!fields.includes(key)) errors.push(`${path}: unknown field ${key}`);
    if (typeof brief.id !== 'string' || !brief.id.trim() || brief.id.length > 2048 || seen.has(brief.id)) errors.push(`${path}: invalid or duplicate id`);
    seen.add(brief.id);
    for (const key of ['updated', 'source_checked']) if (brief[key] !== undefined && (!iso(brief[key]) || Date.parse(brief[key]) > now)) errors.push(`${path}.${key}: expected past ISO timestamp`);
    if (!current.has(brief.id) && (!iso(brief.updated) || now - Date.parse(brief.updated) > 30 * 86400000 || Date.parse(brief.updated) > now)) errors.push(`${path}: absent feed id requires updated within 30 days`);
    for (const key of ['headline', 'summary', 'who_can_join', 'reward_text']) if (brief[key] !== undefined && !(key === 'reward_text' && brief[key] === null)) localized(brief[key], BRIEF_LIMITS[key], `${path}.${key}`);
    if (brief.deadline !== undefined && brief.deadline !== null && !iso(brief.deadline)) errors.push(`${path}.deadline: expected ISO timestamp or null`);
    if (brief.key_facts !== undefined) {
      if (!Array.isArray(brief.key_facts) || brief.key_facts.length > 8) errors.push(`${path}.key_facts: maximum 8 facts`);
      else brief.key_facts.forEach((fact, i) => {
        if (!record(fact) || Object.keys(fact).some(key => !['label', 'value'].includes(key))) { errors.push(`${path}.key_facts[${i}]: invalid fact`); return; }
        localized(fact.label, BRIEF_LIMITS.label, `${path}.key_facts[${i}].label`);
        text(fact.value, BRIEF_LIMITS.value, `${path}.key_facts[${i}].value`);
      });
    }
  });
  return errors;
}

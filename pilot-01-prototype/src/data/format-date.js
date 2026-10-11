// Locale-aware date rendering for UI copy that used to embed hard-coded stamps ("2026-09", "2026-09-06T18:35:39Z").
// Companion of format-percent.js: components pass the UI locale and an ISO value; Intl.DateTimeFormat renders it in
// the reader's convention (UTC, so SSR and hydration agree). Unknown or malformed input returns "" so callers can fall
// back to their "date unavailable" copy instead of printing "Invalid Date".

const INTL_LOCALE_ALIASES = Object.freeze({ "pt-br": "pt-BR", "zh-hans": "zh-Hans", "zh-hant": "zh-Hant", "zh-tw": "zh-Hant", "zh-cn": "zh-Hans" });

export function intlLocale(locale) {
  const raw = String(locale || "en").trim();
  const candidate = INTL_LOCALE_ALIASES[raw.toLowerCase()] || raw;
  try {
    return Intl.DateTimeFormat.supportedLocalesOf([candidate]).length ? candidate : "en";
  } catch {
    return "en";
  }
}

function toDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const text = String(value || "").trim();
  if (!text) return null;
  // Month precision ("2026-09") and day precision ("2026-09-15") are anchored to UTC midnight.
  const iso = /^\d{4}-\d{2}$/.test(text) ? `${text}-01T00:00:00Z` : /^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00Z` : text;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** formatDate("de", "2026-09-06T18:35:39Z") → "06.09.2026"; formatDate("en", "2026-09-15", { dateStyle: "medium" }) → "Sep 15, 2026". */
export function formatDate(locale, value, options = { dateStyle: "medium" }) {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat(intlLocale(locale), { timeZone: "UTC", ...options }).format(date);
}

/** formatMonthYear("en", "2026-09") → "September 2026"; formatMonthYear("ja", "2026-09") → "2026年9月". */
export function formatMonthYear(locale, value) {
  return formatDate(locale, value, { year: "numeric", month: "long" });
}

/** Replaces the "{date}" placeholder used by localized copy with the locale's rendering of `value`. */
export function replaceDate(text, locale, value, options) {
  return String(text).replace("{date}", formatDate(locale, value, options));
}

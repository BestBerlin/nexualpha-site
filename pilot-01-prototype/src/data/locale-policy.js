// One list of information-only ("neutral") locales. Pages in these languages keep news, market data and tools, but
// show no sign-up CTA, no invite code, no /go/ partner button and no campaign join button.
// Why each locale is here:
//   ru  local advertising rules
//   ar  Egypt CBE law 194/2020
//   zh-Hant, ur, uk  pending partner/regulator review
//   vi  owner 2026-10-13: Vietnam Resolution 05/2025/NQ-CP (only Ministry-of-Finance-licensed platforms may offer or
//       advertise crypto services). The VN market is gated separately in partner-geo-restrictions.js.
// Every copy of this list (site data, ops/academy, Telegram senders, newsroom SQL default) must match; the parity
// test in tests/locale-policy.test.mjs fails when one drifts.
export const NEUTRAL_CTA_LOCALE_LIST = Object.freeze(["ru", "ar", "zh-Hant", "ur", "uk", "vi"]);
export const NEUTRAL_CTA_LOCALES = Object.freeze(new Set(NEUTRAL_CTA_LOCALE_LIST));

// Region and script variants (ru-RU, vi-VN, uk-UA, zh-TW, zh-HK) are neutral as well.
const NEUTRAL_CTA_LOCALE_PATTERN = /^(ru|ar|ur|uk|vi)(-|$)|^zh-(Hant|TW|HK)(-|$)/i;
export function isNeutralCtaLocale(locale) {
  return NEUTRAL_CTA_LOCALE_PATTERN.test(String(locale || ""));
}

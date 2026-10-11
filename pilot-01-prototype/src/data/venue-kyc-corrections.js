// KYC corrections layered over venue-database.js (owner plan 2026-10-12). venue-database.js is a hash-pinned commercial
// registry (tests/r76-pix-recipient.test.mjs), so a sourced correction of a non-commercial KYC field lives here and the
// readers apply it.
//
// MEXC: the User Agreement (https://www.mexc.com/terms, updated 2025-05-29, clauses 52-53) requires complete identity
// information and documents; MEXC's own help pages disagree on unverified-account limits and its learn page (2026-10-09)
// says the Help Center publishes none, so no numeric no-KYC limit is shown anywhere.
export const VENUE_KYC_CORRECTIONS = Object.freeze({
  mexc: Object.freeze({
    kycLevel: "mandatory",
    source: "https://www.mexc.com/terms",
    kycSummary: Object.freeze({
      en: "Identity verification required under the MEXC User Agreement (https://www.mexc.com/terms); withdrawal limits rise with the KYC tier, and MEXC publishes no official limit for unverified accounts.",
      "zh-Hans": "根据 MEXC 用户协议（https://www.mexc.com/terms）须完成身份认证；提币限额随 KYC 等级提高，MEXC 未公布未认证账户的官方限额。",
      "zh-Hant": "根據 MEXC 用戶協議（https://www.mexc.com/terms）須完成身分驗證；提幣限額隨 KYC 等級提高，MEXC 未公布未驗證帳戶的官方限額。",
    }),
  }),
});

/** KYC level of a venue after sourced corrections (falls back to the registry value). */
export function venueKycLevel(slug, db = {}) {
  return VENUE_KYC_CORRECTIONS[slug]?.kycLevel ?? db?.kycLevel ?? null;
}

/** KYC summary of a venue after sourced corrections (falls back to the registry value). */
export function venueKycSummary(slug, db = {}) {
  return VENUE_KYC_CORRECTIONS[slug]?.kycSummary ?? db?.kycSummary ?? null;
}

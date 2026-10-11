// Country extracts from docs/company/market-expansion-2026-10.md, read 2026-10-11.
// This is a promotion policy, not a claim that any other country is licensed.
const checked = "2026-10-11";
const rows = (countries, source, reason = "Restricted jurisdiction in partner terms", verified = true) =>
  countries.split(" ").map(country => Object.freeze({ country, source, checked, reason, verified }));
const spkSource = "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/tasfiye-surecinde-olanlar-listesi";
// Preserve the existing sourced Turkey allow-list, not a claim of SPK authorization.
export const TURKEY_PROMOTION_POLICY = Object.freeze({ source: "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi", checked, reason: "Existing Turkey policy: only the five listed partners retain promotion; listing is not an authorization verdict" });
export const TURKEY_PROMOTED_PARTNERS = Object.freeze(["okx", "binance", "bybit", "gate-io", "mexc"]);
export const PARTNER_GEO_RESTRICTIONS = Object.freeze({
  okx: Object.freeze(rows("AF CA CU HK IR IN JP MY NP KP SY UZ", "https://www.okx.com/help/risk-compliance-disclosure")),
  bitget: Object.freeze([...rows("AT CA FR DE HK IR JP KZ MY SG US IQ LY YE AF CF CD GW HT LB SO SS TH SD", "https://www.bitget.com/support/articles/360014944032"), ...rows("TR", spkSource, "Existing Turkey policy: Bitget is on the SPK liquidation list")]),
  mexc: Object.freeze([...rows("KP CU SD IR CN SG MY US GB HK KZ CA", "https://www.mexc.com/terms"), ...rows("ID VE", "https://www.mexc.com/es/support/articles/360031501631", "Restricted in Spanish-language terms")]),
  kucoin: Object.freeze(rows("US SG CN HK MY KZ UZ CA-ON CA-BC FR NL", "https://www.kucoin.com/legal/terms-of-use")),
  "gate-io": Object.freeze(rows("US CN SG CA FR DE HK MY MT ES NL GB MM VE UZ AT IN ID JP AR KH AE TH KR PH PK VN RU", "https://www.gate.com/legal/user-agreement")),
  kraken: Object.freeze(rows("AF BY CU CD IR IQ JP LY KP RU SD SS SY", "https://support.kraken.com/articles/360001368823")),
  hyperliquid: Object.freeze(rows("US CA-ON", "https://app.hyperliquid.xyz/terms")),
  bybit: Object.freeze(rows("US CA CN HK SG UZ IR SY AE-DU SD KP CU", "https://www.datawallet.com/es/cripto/países-con-bybit-restringido", "Secondary list; official page timed out (Dubai applies to global entity)", false)),
  binance: Object.freeze(rows("CA NL", "https://cointelegraph.com/news/regulators-invite-binance-seek-new-license-mica-setback-teng", "Secondary list; official terms did not render a list", false)),
  htx: Object.freeze(rows("BD VE BO EC ES", "https://cryptoticker.io/es/htx-prohibicion-transacciones-ue/", "Secondary list; official page empty and sources conflict", false)),
});
// Terms with non-enumerated territories remain explicit rather than inventing a country list.
const territory = (scope, source, reason, verified = true) => Object.freeze({ scope, source, checked, reason, verified });
export const PARTNER_TERRITORIAL_RESTRICTIONS = Object.freeze({
  okx: [territory("OCCUPIED_UKRAINE", "https://www.okx.com/help/risk-compliance-disclosure", "Occupied Ukraine regions"), territory("US_UNSPECIFIED", "https://www.okx.com/help/risk-compliance-disclosure", "Certain US jurisdictions; exact list absent from facts document")],
  mexc: [territory("OCCUPIED_UKRAINE", "https://www.mexc.com/terms", "Occupied Ukraine regions"), territory("SANCTIONED", "https://www.mexc.com/terms", "Sanctioned jurisdictions"), territory("FATF_HIGH_RISK", "https://www.mexc.com/terms", "FATF high-risk jurisdictions")],
  kucoin: [territory("OCCUPIED_UKRAINE", "https://www.kucoin.com/legal/terms-of-use", "Occupied Ukraine regions")],
  kraken: [territory("OCCUPIED_UKRAINE", "https://support.kraken.com/articles/360001368823", "Occupied Ukraine regions")],
  hyperliquid: [territory("SANCTIONED", "https://app.hyperliquid.xyz/terms", "Sanctions or export-control jurisdictions; also citizens of restricted territories regardless of location")],
  bybit: [territory("OCCUPIED_UKRAINE", "https://www.datawallet.com/es/cripto/países-con-bybit-restringido", "Occupied regions; official page timed out", false)],
  binance: [territory("SANCTIONED", "https://cointelegraph.com/news/regulators-invite-binance-seek-new-license-mica-setback-teng", "Sanctioned territories; secondary list", false), territory("EU", "https://cointelegraph.com/news/regulators-invite-binance-seek-new-license-mica-setback-teng", "EU wind-down after MiCA; unverified", false)],
  htx: [territory("EU", "https://cryptoticker.io/es/htx-prohibicion-transacciones-ue/", "Possibly all EU; conflicting secondary sources", false)],
  backpack: [territory("SANCTIONED", "https://assets.ctfassets.net/ft3afpzda8pn/2fAZnrqUKZsCSZUsWE3rPT/09d6bc2fdde9afd8a23709ad0838d618/User_Agreement.pdf", "Sanctioned jurisdictions; country list unverified", false)],
});
export const COUNTRY_BY_LOCALE = Object.freeze({ tr: "TR", vi: "VN", id: "ID", "id-id": "ID", ru: "RU", uk: "UA", "uk-ua": "UA", ur: "PK", "pt-BR": "BR", "pt-br": "BR", ja: "JP", ko: "KR" });
export const COUNTRY_BY_MARKET = Object.freeze({ EU: Object.freeze(["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"]), INT: Object.freeze([]), UK: "GB", BR: "BR", MX: "MX", TW: "TW", ID: "ID", VN: "VN", HK: "HK", US: "US", JP: "JP", KR: "KR", SG: "SG", TR: "TR", IN: "IN", "AR-COUNTRY": "AR" });
export { promotionCountries, partnerPromotionGate, isPartnerPromotableIn } from "./partner-geo-policy.js";
export function unverifiedPartnerRestrictions() {
  return Object.entries(PARTNER_GEO_RESTRICTIONS).flatMap(([slug, entries]) => entries.filter(row => !row.verified).map(row => ({ slug, ...row }))).concat(Object.entries(PARTNER_TERRITORIAL_RESTRICTIONS).flatMap(([slug, entries]) => entries.filter(row => !row.verified).map(row => ({ slug, ...row }))));
}
export function buildPartnerGeoRestrictionsFeed() {
  return { version: 1, checked, restrictions: PARTNER_GEO_RESTRICTIONS, territorialRestrictions: PARTNER_TERRITORIAL_RESTRICTIONS, countryByLocale: COUNTRY_BY_LOCALE, countryByMarket: COUNTRY_BY_MARKET, turkeyPromotedPartners: TURKEY_PROMOTED_PARTNERS, turkeyPromotionPolicy: TURKEY_PROMOTION_POLICY, unverified: unverifiedPartnerRestrictions() };
}

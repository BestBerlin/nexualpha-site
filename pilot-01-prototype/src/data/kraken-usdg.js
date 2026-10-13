// Kraken 5M USDG Futures Challenge (owner 2026-10-13, strong push; the owner is enrolled): one NexuAlpha page
// (/activities/kraken-usdg-challenge) and one tracked route to the official challenge page (/go/kraken-usdg-challenge).
// Shared by the browser, the Worker head, the sitemap and the server's /go redirect (server/go-redirect.mjs). The full
// page copy lives in kraken-usdg-copy.js (route chunk only).
//
// Funnel (owner: always carry our invite code and link): the competition link has no referral parameter, so
//   step 1 = create the Kraken account with our registry code through /go/kraken?src=kraken-usdg-<placement> (primary),
//   step 2 = register for the challenge through /go/kraken-usdg-challenge (secondary, new tab, after step 1),
//   step 3 = trade futures to 50,000 USD.
// The competition link is never presented as the sign-up.
//
// Sources (read 2026-10-13, logged out):
// - Kraken official rules "The $5,000,000 USDG Kraken Futures Challenge" (kraken.com/legal/futures-5m-usdg-challenge-terms):
//   period 13:30:00 UTC 12 Oct 2026 – 23:59:59 UTC 10 Dec 2026; enroll ("Join the Challenge") before trading, only trades
//   after enrollment count; ranking by Weighted Trading Volume (gold PF_XAUUSD 3x, RWA perps 2x, crypto 1x); Qualifying
//   Minimum 50,000 USD actual (not weighted) volume; Reward Pool tiers by Community Volume (weighted USD): default 25,000,
//   3B 100,000, 3.5B 300,000, 5B 700,000, 6B 1,000,000, 7.5B 1,500,000, 12B 3,000,000, 18.5B 5,000,000 USDG; rank prizes
//   per tier (ranks 1, 2, 3, 4–5, 6–10, 11–20, 21–50 fixed, 51+ Tail Pool shared equally); rewards in USDG to the spot
//   account, winners notified within 14 days after final rankings; rewards >= 10,000 USD need Intermediate KYC before the
//   end; Eligible Areas exclude the US, UK, EEA, Switzerland, Canada, Australia, Brazil and Argentina; 18+; individuals.
// - Kraken support "Kraken Derivatives eligibility" (support.kraken.com/articles/360023786632, updated 2026-07-28): Kraken
//   Derivatives unavailable in AF, AU, BD, BY, CA, CD, CU, IR, IQ, KP, LY, NZ, RU, UK, occupied Ukraine.
// - Kraken challenge page kraken.com/competitions/futures-5m-usdg-challenge-10-26: same tiers and prizes (the 8 tiers are
//   numbered 1–8 there), live community volume, active tier and the top-5 leaderboard in its server-rendered data (no
//   login). The server re-reads it for /intel/kraken-usdg.json (server/kraken-usdg-live.mjs).
import { isPartnerPromotableIn, promotionCountries } from "./partner-geo-policy.js";
import { partnerRegistry } from "./partner-registry.js";
import { KRAKEN_USDG_PATH, parseKrakenUsdgPath } from "./kraken-usdg-path.js";
import { NEUTRAL_CTA_LOCALES } from "./locale-policy.js";

export { KRAKEN_USDG_PATH, parseKrakenUsdgPath };
export const KRAKEN_USDG_ORIGIN = "https://nexualpha.com";
export const KRAKEN_USDG_PUBLISHED = "2026-10-13";
export const KRAKEN_USDG_CHECKED = "2026-10-13";
export const KRAKEN_USDG_VENUE = "kraken";
export const KRAKEN_USDG_GO_SLUG = "kraken-usdg-challenge";
export const KRAKEN_USDG_LIVE_JSON = "/intel/kraken-usdg.json";
export const KRAKEN_USDG_OFFICIAL_URL = "https://www.kraken.com/competitions/futures-5m-usdg-challenge-10-26";
export const KRAKEN_USDG_TERMS_URL = "https://www.kraken.com/legal/futures-5m-usdg-challenge-terms";
export const KRAKEN_USDG_ANNOUNCEMENT_ID = `kraken:${KRAKEN_USDG_OFFICIAL_URL}`;

export const KRAKEN_USDG_CAMPAIGN = Object.freeze({
  name: "The $5,000,000 USDG Kraken Futures Challenge",
  startAt: "2026-10-12T13:30:00Z", // 12 Oct 21:30 SGT
  endAt: "2026-12-10T23:59:59Z", // 11 Dec 07:59:59 SGT: /go/kraken-usdg-challenge falls back to /exchanges/kraken after this
  minVolume: 50000,
  maxPool: 5000000,
  multipliers: Object.freeze({ gold: 3, rwa: 2, crypto: 1 }),
});

// The 8 tiers (Kraken's numbering 1–8): community-volume threshold (weighted USD) and the USDG prize of each rank group.
const RANKS = [[1, 1], [2, 2], [3, 3], [4, 5], [6, 10], [11, 20], [21, 50]];
const tier = (threshold, pool, prizes, tail) => Object.freeze({ threshold, pool, prizes: Object.freeze(prizes), tail });
export const KRAKEN_USDG_RANKS = Object.freeze(RANKS.map(([from, to]) => Object.freeze({ from, to })));
export const KRAKEN_USDG_TIERS = Object.freeze([
  tier(0, 25000, [3750, 2000, 1500, 750, 500, 250, 37.5], 10125),
  tier(3e9, 100000, [15000, 8000, 6000, 3000, 2000, 1000, 150], 40500),
  tier(3.5e9, 300000, [45000, 24000, 18000, 9000, 6000, 3000, 450], 121500),
  tier(5e9, 700000, [105000, 56000, 42000, 21000, 14000, 7000, 1050], 283500),
  tier(6e9, 1000000, [150000, 80000, 60000, 30000, 20000, 10000, 1500], 405000),
  tier(7.5e9, 1500000, [225000, 120000, 90000, 45000, 30000, 15000, 2250], 607500),
  tier(12e9, 3000000, [450000, 240000, 180000, 90000, 60000, 30000, 4500], 1215000),
  tier(18.5e9, 5000000, [750000, 400000, 300000, 150000, 100000, 50000, 7500], 2025000),
]);

/** Sum of every prize of a tier (rank prizes × winners + tail pool) — equals the tier's pool. */
export function krakenUsdgTierTotal(t) {
  return t.prizes.reduce((sum, prize, i) => sum + prize * (RANKS[i][1] - RANKS[i][0] + 1), 0) + t.tail;
}

/** Index of the highest tier whose threshold the community volume has reached. */
export function krakenUsdgTierFor(volume) {
  let index = 0;
  KRAKEN_USDG_TIERS.forEach((t, i) => { if (Number(volume) >= t.threshold) index = i; });
  return index;
}

/** Weighted volume that counts toward the rank, and whether the actual volume reaches the qualifying minimum. */
export function krakenUsdgExample(volume, multiplier = 1) {
  const v = Math.max(0, Number(volume) || 0);
  return { weighted: v * multiplier, qualifies: v >= KRAKEN_USDG_CAMPAIGN.minVolume };
}

// Kraken's own figures (challenge page, read 2026-10-13 08:49 SGT). The page renders these in the HTML and refreshes
// them from /intel/kraken-usdg.json after load.
export const KRAKEN_USDG_SNAPSHOT = Object.freeze({
  fetchedAt: "2026-10-13T00:49:00Z",
  communityVolume: 1376892.83,
  activeTier: 0,
  leaderboard: Object.freeze([
    { rank: 1, name: "BriskPapayaGapBatch", volume: 405595.37 },
    { rank: 2, name: "OpenGrayIntoEntropy", volume: 211910.5 },
    { rank: 3, name: "RaptAmberNubRange", volume: 189996.78 },
    { rank: 4, name: "TimelyBrownUrnPledge", volume: 51537.9 },
    { rank: 5, name: "DevotedVioletIonEpoch", volume: 51024.9 },
  ]),
});

export function krakenUsdgActive(now = Date.now()) {
  return Date.parse(KRAKEN_USDG_CAMPAIGN.endAt) > (now instanceof Date ? now.getTime() : now);
}

// Locales with a written edition of the page (indexable, in the sitemap). Other UI locales read English, noindex.
export const KRAKEN_USDG_INDEX_LOCALES = Object.freeze(["en", "zh-Hans", "es", "pt-BR", "vi", "id", "ja", "ko", "fr", "de"]);
// Same neutral set as the academy and the other campaign pages: informational, no sign-up wording, no CTA.
export const KRAKEN_USDG_NEUTRAL_LOCALES = NEUTRAL_CTA_LOCALES;
// French, German and Italian editions are read mostly from the EEA and Switzerland, which the challenge excludes; without
// an explicit market they stay informational.
const EXCLUDED_FIRST_LOCALES = new Set(["fr", "de", "it"]);
const EEA = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO"];
// Excluded by the challenge rules (Section 2) plus the countries where Kraken Derivatives is unavailable. Kraken-wide
// restrictions (JP, sanctioned countries, occupied Ukraine) and Türkiye come from the site's Kraken policy.
export const KRAKEN_USDG_RESTRICTED_COUNTRIES = Object.freeze([
  ...EEA, "US", "GB", "CH", "CA", "AU", "BR", "AR",
  "AF", "BD", "BY", "CD", "CU", "IR", "IQ", "KP", "LY", "NZ", "RU",
]);

/** Why the challenge CTA is not offered here (null = offered). */
export function krakenUsdgSignupGate({ locale = "en", market } = {}) {
  if (KRAKEN_USDG_NEUTRAL_LOCALES.has(locale)) return "neutral-locale";
  if (!market && EXCLUDED_FIRST_LOCALES.has(locale)) return "challenge-restricted";
  if (!isPartnerPromotableIn(KRAKEN_USDG_VENUE, { locale, market })) return "partner-geo-restricted";
  const countries = promotionCountries({ locale, market });
  if (countries.some((country) => KRAKEN_USDG_RESTRICTED_COUNTRIES.includes(String(country).split("-")[0]))) return "challenge-restricted";
  return null;
}

const placementSrc = (placement) => `kraken-usdg-${String(placement).toLowerCase().replace(/[^a-z0-9_-]/g, "-")}`.slice(0, 48);

/**
 * The two links of the funnel, or null where they may not be shown or the challenge has ended:
 * signup = our registry invite route (/go/kraken, code from the partner registry, never typed by hand);
 * register = the tracked route to Kraken's challenge page (/go/kraken-usdg-challenge).
 */
export function krakenUsdgSignup({ locale = "en", market, placement = "page", now } = {}) {
  if (krakenUsdgSignupGate({ locale, market })) return null;
  if (!krakenUsdgActive(now ?? Date.now())) return null;
  const code = partnerRegistry[KRAKEN_USDG_VENUE]?.inviteCode;
  if (!code) return null;
  const src = placementSrc(placement);
  return { code, href: `/go/${KRAKEN_USDG_VENUE}?src=${src}`, registerHref: `/go/${KRAKEN_USDG_GO_SLUG}?src=${src}` };
}

/** Teasers (home, /activities, /exchanges/kraken, /flash) only where the CTA may be offered, while the challenge runs. */
export function krakenUsdgPromotable({ locale = "en", market, now = Date.now() } = {}) {
  return krakenUsdgActive(now) && !krakenUsdgSignupGate({ locale, market });
}

// Teasers link our page, never Kraken. Lead with the pool and what the reader gets.
const TEASER = {
  en: { tag: "Hot", title: "Kraken Futures Challenge: up to 5,000,000 USDG", body: "Every trader who reaches 50,000 USD in futures volume gets a share; #1 wins up to 750,000 USDG. 2x and 3x volume boosts. Until 11 Dec, 07:59 SGT.", go: "See how to join" },
  "zh-Hans": { tag: "热门", title: "Kraken 合约挑战赛：奖池最高 5,000,000 USDG", body: "合约交易量满 50,000 USD 人人有奖，第 1 名最高赢 750,000 USDG，还有 2 倍、3 倍交易量加成。12 月 11 日 07:59 SGT 截止。", go: "看怎么参加" },
  es: { tag: "Destacado", title: "Desafío de Futuros Kraken: hasta 5,000,000 USDG", body: "Todo trader que llegue a 50,000 USD de volumen en futuros se lleva una parte; el #1 gana hasta 750,000 USDG. Volumen x2 y x3. Hasta el 11 dic, 07:59 SGT.", go: "Ver cómo participar" },
  "pt-BR": { tag: "Em alta", title: "Desafio de Futuros Kraken: até 5,000,000 USDG", body: "Todo trader que chegar a 50,000 USD em volume de futuros leva uma parte; o 1º ganha até 750,000 USDG. Volume em dobro e triplo. Até 11 dez, 07:59 SGT.", go: "Veja como participar" },
  vi: { tag: "Hot", title: "Thử thách Futures Kraken: quỹ thưởng tới 5,000,000 USDG", body: "Ai đạt 50,000 USD khối lượng futures đều có phần; hạng 1 nhận tới 750,000 USDG. Khối lượng nhân 2, nhân 3. Đến 07:59 SGT ngày 11/12.", go: "Xem cách tham gia" },
  id: { tag: "Populer", title: "Tantangan Futures Kraken: hadiah hingga 5,000,000 USDG", body: "Setiap trader yang mencapai volume futures 50,000 USD dapat bagian; peringkat 1 menang hingga 750,000 USDG. Volume 2x dan 3x. Hingga 11 Des, 07:59 SGT.", go: "Lihat cara ikut" },
  ja: { tag: "注目", title: "Kraken先物チャレンジ：賞金プール最大5,000,000 USDG", body: "先物取引高50,000 USDに達した全員に賞金、1位は最大750,000 USDG。取引高2倍・3倍ブーストも。12月11日07:59 SGTまで。", go: "参加方法を見る" },
  ko: { tag: "인기", title: "Kraken 선물 챌린지: 상금 풀 최대 5,000,000 USDG", body: "선물 거래량 50,000 USD를 넘기면 누구나 상금을 받고, 1위는 최대 750,000 USDG. 거래량 2배·3배 부스트까지. 12월 11일 07:59 SGT까지.", go: "참여 방법 보기" },
  fr: { tag: "À la une", title: "Défi Futures Kraken : jusqu’à 5,000,000 USDG", body: "Chaque trader qui atteint 50,000 USD de volume en futures touche sa part ; le n°1 gagne jusqu’à 750,000 USDG. Volume x2 et x3. Jusqu’au 11 déc., 07:59 SGT.", go: "Voir comment participer" },
  de: { tag: "Top", title: "Kraken Futures Challenge: bis zu 5,000,000 USDG", body: "Jeder Trader mit 50,000 USD Futures-Volumen bekommt einen Anteil; Platz 1 gewinnt bis zu 750,000 USDG. 2x- und 3x-Volumen. Bis 11. Dez., 07:59 SGT.", go: "So nehmen Sie teil" },
};
export function krakenUsdgTeaser(locale = "en") {
  return TEASER[locale] || TEASER.en;
}

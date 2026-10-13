// Bitget Alliance campaign (owner 2026-10-13): one NexuAlpha page (/activities/bitget-alliance) and one tracked campaign
// route (/go/bitget-alliance). Shared by the browser, the Worker head, the sitemap and the server's /go redirect
// (server/go-redirect.mjs). The full page copy lives in bitget-alliance-copy.js (route chunk only).
//
// DPRWSXAS is a CAMPAIGN code, separate from our main Bitget code in the registry (owner: 活动是活动，和官网主推的邀请码是两码事).
// It is used ONLY by this page's CTAs, always through /go/bitget-alliance; every other Bitget CTA keeps /go/bitget.
// The owner's link used a mirror domain; only the official www.bitget.com page is ever published or redirected to.
//
// Sources (read 2026-10-13, logged out):
// - Bitget announcement "Bitget Alliance Program" (bitget.com/en/support/articles/12560603896118, 2026-09-28 08:00 UTC+8):
//   pool = 30% of the platform's net trading-fee revenue from eligible non-institutional users; 60% trading pool, 40% asset
//   pool, shared daily pro rata; thresholds 100 USDT daily valid volume / 100 USDT daily valid assets (lowest hourly
//   snapshot), both capped at 3,000,000 USDT; futures, spot and stock trades count (not Onchain, CFD, U.S. Stock+, Convert,
//   stablecoin or zero-fee pairs); no registration needed; 3-day settlement periods paid within 2 working days, claimed on
//   the campaign page within 180 days; promotion 2026-09-28 00:00 – 2026-10-26 16:00 (UTC+8); 8th-anniversary mystery
//   box with a guaranteed reward for each period's rewarded users (7 rounds: 10, 13, 16, 19, 22, 25, 27 Oct; last claim
//   30 Oct 23:59 UTC+8; Earn APR boost up to 5%, futures position voucher up to 10,000 USDT, grid vouchers, GetAgent
//   Ultra); not eligible: market makers, PRO users, brokers, institutional accounts, restricted regions.
// - Bitget campaign page bitget.com/<locale>/activity/bitget-alliance (same rules in its i18n bundle; total pool and
//   rewarded-users counters) and its public data endpoint POST bitget.com/v1/act/withdraw/special/v2/getActivityInfo
//   (no login): totalRewardPool, tradeRewardPool, fundRewardPool, the last day's pools and platform totals. The server
//   re-reads it for /intel/bitget-alliance.json (server/bitget-alliance-pool.mjs).
import { isPartnerPromotableIn } from "./partner-geo-policy.js";
import { updatePath } from "./activity-update-path.js";
import { BITGET_ALLIANCE_PATH, parseBitgetAlliancePath } from "./bitget-alliance-path.js";
import { NEUTRAL_CTA_LOCALES } from "./locale-policy.js";
import { BITGET_ALLIANCE_CODE } from "./campaign-codes.js";

export { BITGET_ALLIANCE_PATH, parseBitgetAlliancePath };
export const BITGET_ALLIANCE_ORIGIN = "https://nexualpha.com";
export const BITGET_ALLIANCE_PUBLISHED = "2026-10-13";
export const BITGET_ALLIANCE_CHECKED = "2026-10-13";
export const BITGET_ALLIANCE_VENUE = "bitget";
export const BITGET_ALLIANCE_GO_SLUG = "bitget-alliance";
export { BITGET_ALLIANCE_CODE };
export const BITGET_ALLIANCE_POOL_JSON = "/intel/bitget-alliance.json";

export const BITGET_ALLIANCE_CAMPAIGN = Object.freeze({
  name: "Bitget Alliance Program",
  startAt: "2026-09-27T16:00:00Z", // 28 Sep 00:00 UTC+8
  endAt: "2026-10-26T08:00:00Z", // 26 Oct 16:00 UTC+8: /go/bitget-alliance falls back to /go/bitget from here
  lastBoxClaimAt: "2026-10-30T15:59:00Z", // 30 Oct 23:59 UTC+8
  feeShare: 30,
  tradeShare: 60,
  assetShare: 40,
  threshold: 100,
  cap: 3000000,
  boxRounds: ["10", "13", "16", "19", "22", "25", "27"],
});

// Bitget's own figures (public endpoint above, read 2026-10-13 07:22 UTC+8; data day 11 Oct, updated daily at 12:00 UTC+8).
// The page renders these in the HTML and refreshes them from /intel/bitget-alliance.json after load.
export const BITGET_ALLIANCE_SNAPSHOT = Object.freeze({
  statDay: "2026-10-11",
  totalPool: 4847923.09,
  tradePool: 2908753.85,
  assetPool: 1939169.23,
  dailyTradePool: 70791.14,
  dailyAssetPool: 47194.09,
  tradeVolume: 1455137611.37,
  assetValue: 4655907681.65,
  rewardedUsers: 2277318,
});

/** Reward of one day by the official formula: pool share × your valid amount ÷ everyone's valid amount (amount capped). */
export function bitgetAllianceDailyReward({ volume = 0, assets = 0 } = {}, data = BITGET_ALLIANCE_SNAPSHOT) {
  const { threshold, cap } = BITGET_ALLIANCE_CAMPAIGN;
  const v = Math.min(Math.max(Number(volume) || 0, 0), cap);
  const a = Math.min(Math.max(Number(assets) || 0, 0), cap);
  const trade = v >= threshold && data.tradeVolume > 0 ? (data.dailyTradePool * v) / data.tradeVolume : 0;
  const asset = a >= threshold && data.assetValue > 0 ? (data.dailyAssetPool * a) / data.assetValue : 0;
  return { trade, asset, total: trade + asset };
}

// The announcement row (shipped in the announcement archive; Bitget's collector does not list this help-centre category).
export const BITGET_ALLIANCE_ANNOUNCEMENT_URL = "https://www.bitget.com/en/support/articles/12560603896118";
export const BITGET_ALLIANCE_ANNOUNCEMENT_ID = "bitget:12560603896118";
export const BITGET_ALLIANCE_UPDATE_PATH = updatePath({ venue: "bitget", id: BITGET_ALLIANCE_ANNOUNCEMENT_ID, title: "Bitget Alliance Program" });

// Locale segment of www.bitget.com for each NexuAlpha locale ("" = the English page). Checked 2026-10-13: every one
// answers 200 on www.bitget.com; /ko redirects to the English page, so Korean opens English directly.
export const BITGET_LOCALE_SEGMENT = Object.freeze({
  en: "", "zh-Hans": "zh-CN", "zh-Hant": "zh-TC", es: "es", "pt-BR": "pt", vi: "vi", id: "id", ja: "ja", de: "de", fr: "fr", it: "it", ru: "ru", ar: "ar",
});

/** Official www.bitget.com campaign URL with the campaign code (server-side redirect target only, never a page link). */
export function bitgetAllianceUrl(locale = "en") {
  const segment = BITGET_LOCALE_SEGMENT[locale] || "";
  return `https://www.bitget.com/${segment ? `${segment}/` : ""}activity/bitget-alliance?clacCode=${BITGET_ALLIANCE_CODE}`;
}

export function bitgetAllianceActive(now = Date.now()) {
  return Date.parse(BITGET_ALLIANCE_CAMPAIGN.endAt) > (now instanceof Date ? now.getTime() : now);
}

// Locales with a written edition of the page (indexable, in the sitemap). Other UI locales read English, noindex.
export const BITGET_ALLIANCE_INDEX_LOCALES = Object.freeze(["en", "zh-Hans", "es", "pt-BR", "vi", "id", "ja", "ko", "fr", "de"]);
// Same neutral set as the academy and the other campaign pages: informational, no sign-up wording, no CTA.
export const BITGET_ALLIANCE_NEUTRAL_LOCALES = NEUTRAL_CTA_LOCALES;
// Bitget is restricted in France, Germany and Austria (partner-geo-restrictions.js); the French and German editions are
// read mostly there, so without an explicit market they stay informational.
const RESTRICTED_FIRST_LOCALES = new Set(["fr", "de"]);

/**
 * Why the campaign CTA is not offered here (null = offered). Türkiye (SPK list), the US and every other Bitget-restricted
 * country come from the site's Bitget policy (isPartnerPromotableIn); neutral locales are informational.
 */
export function bitgetAllianceSignupGate({ locale = "en", market } = {}) {
  if (locale === "tr") return "partner-geo-restricted";
  if (BITGET_ALLIANCE_NEUTRAL_LOCALES.has(locale)) return "neutral-locale";
  if (!market && RESTRICTED_FIRST_LOCALES.has(locale)) return "partner-geo-restricted";
  if (!isPartnerPromotableIn(BITGET_ALLIANCE_VENUE, { locale, market })) return "partner-geo-restricted";
  return null;
}

/** Tracked CTA of the page: always /go/bitget-alliance, or null where it may not be shown or the campaign has ended. */
export function bitgetAllianceSignup({ locale = "en", market, placement = "page", now } = {}) {
  if (bitgetAllianceSignupGate({ locale, market })) return null;
  if (!bitgetAllianceActive(now ?? Date.now())) return null;
  const params = new URLSearchParams({ src: `alliance-${String(placement).toLowerCase().replace(/[^a-z0-9_-]/g, "-")}`.slice(0, 48) });
  if (BITGET_LOCALE_SEGMENT[locale] !== undefined && locale !== "en") params.set("lang", locale);
  return { code: BITGET_ALLIANCE_CODE, href: `/go/${BITGET_ALLIANCE_GO_SLUG}?${params}` };
}

/** Teasers (home, /activities, /exchanges/bitget, /flash) only where the CTA may be offered, while the campaign runs. */
export function bitgetAlliancePromotable({ locale = "en", market, now = Date.now() } = {}) {
  return bitgetAllianceActive(now) && !bitgetAllianceSignupGate({ locale, market });
}

// Teasers link our page, never Bitget. Lead with the pool and what the reader gets.
const TEASER = {
  en: { tag: "Hot", title: "Bitget Alliance: share a 4.8M+ USDT prize pool", body: "Bitget puts 30% of its trading fees into the pool. Trade or hold 100 USDT a day and you are in automatically, with a guaranteed mystery box each round. Until 26 Oct.", go: "See how to join" },
  "zh-Hans": { tag: "热门", title: "Bitget 同行计划：瓜分近 500 万 USDT 奖池", body: "Bitget 拿出 30% 平台手续费做奖池。每天交易或持仓满 100 USDT 自动参与，每期再开一次必中盲盒。10 月 26 日截止。", go: "看怎么参与" },
  es: { tag: "Destacado", title: "Bitget Alliance: reparte un bote de más de 4.8M USDT", body: "Bitget destina el 30% de sus comisiones al bote. Opera o mantén 100 USDT al día y participas automáticamente, con una caja sorpresa garantizada en cada ronda. Hasta el 26 de octubre.", go: "Ver cómo participar" },
  "pt-BR": { tag: "Em alta", title: "Bitget Alliance: divida um prêmio de mais de 4.8M USDT", body: "A Bitget coloca 30% das taxas de negociação no prêmio. Negocie ou mantenha 100 USDT por dia e você entra automaticamente, com uma caixa surpresa garantida a cada rodada. Até 26 de outubro.", go: "Veja como participar" },
  vi: { tag: "Hot", title: "Bitget Alliance: chia quỹ thưởng hơn 4.8 triệu USDT", body: "Bitget trích 30% phí giao dịch vào quỹ thưởng. Giao dịch hoặc nắm giữ 100 USDT mỗi ngày là tự động tham gia, kèm hộp quà bí ẩn chắc chắn trúng mỗi đợt. Đến hết 26/10.", go: "Xem cách tham gia" },
  id: { tag: "Populer", title: "Bitget Alliance: bagi hadiah lebih dari 4.8 juta USDT", body: "Bitget menyisihkan 30% biaya trading ke kolam hadiah. Trading atau simpan 100 USDT per hari dan Anda otomatis ikut, plus mystery box yang pasti dapat setiap putaran. Hingga 26 Oktober.", go: "Lihat cara ikut" },
  ja: { tag: "注目", title: "Bitget Alliance：480万USDT超の賞金プールを山分け", body: "Bitgetが取引手数料の30%を賞金プールに。1日100 USDTの取引か保有で自動参加、毎回必ず当たるミステリーボックスも。10月26日まで。", go: "参加方法を見る" },
  ko: { tag: "인기", title: "Bitget Alliance: 480만 USDT 이상 상금 풀을 나눠 받으세요", body: "Bitget이 거래 수수료의 30%를 상금 풀에 넣습니다. 하루 100 USDT 거래나 보유만으로 자동 참여, 회차마다 꽝 없는 미스터리 박스도. 10월 26일까지.", go: "참여 방법 보기" },
  fr: { tag: "À la une", title: "Bitget Alliance : partagez une cagnotte de plus de 4.8M USDT", body: "Bitget verse 30% de ses frais de trading dans la cagnotte. Tradez ou détenez 100 USDT par jour et vous participez automatiquement, avec une boîte mystère garantie à chaque tour. Jusqu’au 26 octobre.", go: "Voir comment participer" },
  de: { tag: "Top", title: "Bitget Alliance: Teilen Sie einen Preispool von über 4.8 Mio. USDT", body: "Bitget zahlt 30% seiner Handelsgebühren in den Pool. Handeln oder halten Sie 100 USDT am Tag und Sie sind automatisch dabei, mit einer garantierten Mystery Box pro Runde. Bis 26. Oktober.", go: "So nehmen Sie teil" },
  it: { tag: "In evidenza", title: "Bitget Alliance: dividi un montepremi di oltre 4.8M USDT", body: "Bitget versa il 30% delle commissioni di trading nel montepremi. Fai trading o detieni 100 USDT al giorno e partecipi in automatico, con una mystery box garantita a ogni round. Fino al 26 ottobre.", go: "Scopri come partecipare" },
};
export function bitgetAllianceTeaser(locale = "en") {
  return TEASER[locale] || TEASER.en;
}

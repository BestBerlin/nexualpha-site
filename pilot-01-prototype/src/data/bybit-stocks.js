// Bybit Stocks campaign landing page (/activities/bybit-stocks, owner 2026-10-12): route, campaign dates, sign-up
// gating and the short teaser strings used on the home page, /activities and /exchanges/bybit. Shared by the browser,
// the Worker head and the sitemap; the full page copy lives in bybit-stocks-copy.js (route chunk only).
//
// Sources (checked 2026-10-12):
// - Bybit Help Center "Introduction to Bybit Stocks" and "FAQ — Bybit Stocks" (both updated 2026-10-08): custody by
//   Alpaca Securities LLC (FINRA/SIPC member), introducing broker Infra Capital Limited (FSC Mauritius GB23202169), USDC in
//   the Unified Trading Account, Advanced Identity Verification, 5 USDC minimum, sessions, fees, corporate actions,
//   shareholder voting not available, service-restricted countries (EEA, India, Mauritius, South Africa (TBC), UAE).
// - Bybit Help Center "Service Restricted Countries" (Bybit-wide excluded jurisdictions).
// - Bybit announcement API (announcements.bybit.com, "Latest Campaigns"): "Bybit Expands Beyond Crypto With Direct Access
//   to U.S. Stocks & ETFs", 2026-10-12 00:00 UTC to 2026-10-31 00:00 UTC.
// - Bybit press releases of 2026-10-12 (PR Newswire / Chainwire, issued by Bybit): 1,000+ U.S. stocks and ETFs and the
//   "Full Stocks Ahead" campaign rules (150,000 USDC pool, daily box, Stock Splash), campaign page bybit.com/stock_launch_carnival.
import { isPartnerPromotableIn, promotionCountries } from "./partner-geo-policy.js";
import { updatePath } from "./activity-update-path.js";
import { partnerRegistry } from "./partner-registry.js";

import { BYBIT_STOCKS_PATH, parseBybitStocksPath } from "./bybit-stocks-path.js";
import { NEUTRAL_CTA_LOCALES } from "./locale-policy.js";

export { BYBIT_STOCKS_PATH, parseBybitStocksPath };
export const BYBIT_STOCKS_ORIGIN = "https://nexualpha.com";
export const BYBIT_STOCKS_PUBLISHED = "2026-10-12";
export const BYBIT_STOCKS_CHECKED = "2026-10-12";
export const BYBIT_STOCKS_VENUE = "bybit";

// The official announcement row in /intel/official-announcements.json (feed id = venue + official URL).
export const BYBIT_STOCKS_ANNOUNCEMENT_URL = "https://announcements.bybit.com/en-US/article/bybit-expands-beyond-crypto-with-direct-access-to-u-s-stocks-etfs--art55453cbc5bf2/";
export const BYBIT_STOCKS_ANNOUNCEMENT_ID = `bybit:${BYBIT_STOCKS_ANNOUNCEMENT_URL}`;
export const BYBIT_STOCKS_UPDATE_PATH = updatePath({ venue: "bybit", id: BYBIT_STOCKS_ANNOUNCEMENT_ID });

export const BYBIT_STOCKS_CAMPAIGN = Object.freeze({
  name: "Full Stocks Ahead",
  startAt: "2026-10-12T00:00:00Z",
  endAt: "2026-10-31T00:00:00Z",
  pool: "150,000 USDC",
});

// Locales with a written edition of the page (indexable, in the sitemap). Other UI locales show English, noindex.
export const BYBIT_STOCKS_INDEX_LOCALES = Object.freeze(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "tr", "vi", "id", "ja", "ko", "fr", "de", "ar", "ru"]);
// Same neutral set as the academy and the campaign join block: informational page, no sign-up wording.
export const BYBIT_STOCKS_NEUTRAL_LOCALES = NEUTRAL_CTA_LOCALES;
// Bybit Stocks is a service-restricted product in the EEA (Help Center, 2026-10-08). French, German and Italian editions
// are read mostly from EEA countries, so they stay informational too.
const EEA_FIRST_LOCALES = new Set(["fr", "de", "it"]);
// Countries where Bybit Stocks itself is restricted, on top of Bybit's own excluded jurisdictions (isPartnerPromotableIn).
const EEA = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO"];
export const BYBIT_STOCKS_RESTRICTED_COUNTRIES = Object.freeze([...EEA, "IN", "MU", "ZA", "AE", "US"]);

const isActive = (now = Date.now()) => Date.parse(BYBIT_STOCKS_CAMPAIGN.endAt) > now;
export const bybitStocksCampaignActive = isActive;

/** Why the sign-up is not offered here (null = offered). */
export function bybitStocksSignupGate({ locale = "en", market } = {}) {
  if (BYBIT_STOCKS_NEUTRAL_LOCALES.has(locale)) return "neutral-locale";
  if (!market && EEA_FIRST_LOCALES.has(locale)) return "stocks-restricted";
  if (!isPartnerPromotableIn(BYBIT_STOCKS_VENUE, { locale, market })) return "partner-geo-restricted";
  const countries = promotionCountries({ locale, market });
  if (countries.some((country) => BYBIT_STOCKS_RESTRICTED_COUNTRIES.includes(String(country).split("-")[0]))) return "stocks-restricted";
  return null;
}

/** Registry invite code where the sign-up may be shown (head/meta use); the page itself uses bybit-stocks-signup.js. */
export function bybitStocksInviteCode({ locale = "en", market } = {}) {
  if (bybitStocksSignupGate({ locale, market })) return null;
  const partner = partnerRegistry[BYBIT_STOCKS_VENUE];
  return partner?.hasReferral && partner.inviteCode ? partner.inviteCode : null;
}

// Teasers (home campaigns stream, /activities, /exchanges/bybit). Neutral locales get the same informational wording.
const TEASER = {
  en: { tag: "Hot", title: "Bybit Stocks: buy Apple, Nvidia and Tesla with USDC", body: "1,000+ U.S. stocks and ETFs, real shares, from 5 USDC. Launch campaign with a 150,000 USDC prize pool until 31 Oct.", go: "See how it works" },
  "zh-Hans": { tag: "热门", title: "Bybit 美股：用 USDC 买苹果、英伟达和特斯拉", body: "1,000+ 只美股和 ETF，真实股票，5 USDC 起买。上线活动奖池 150,000 USDC，10 月 31 日截止。", go: "看看怎么玩" },
  "zh-Hant": { tag: "熱門", title: "Bybit 美股：用 USDC 買蘋果、輝達和特斯拉", body: "1,000+ 檔美股和 ETF，真實股票，5 USDC 起。上線活動獎池 150,000 USDC，10 月 31 日截止。", go: "了解運作方式" },
  es: { tag: "Destacado", title: "Bybit Stocks: compra Apple, Nvidia y Tesla con USDC", body: "Más de 1,000 acciones y ETF de EE. UU., acciones reales, desde 5 USDC. Campaña de lanzamiento con 150,000 USDC en premios hasta el 31 de octubre.", go: "Ver cómo funciona" },
  "pt-BR": { tag: "Em alta", title: "Bybit Stocks: compre Apple, Nvidia e Tesla com USDC", body: "Mais de 1,000 ações e ETFs dos EUA, ações reais, a partir de 5 USDC. Campanha de lançamento com 150,000 USDC em prêmios até 31 de outubro.", go: "Veja como funciona" },
  tr: { tag: "Popüler", title: "Bybit Stocks: Apple, Nvidia ve Tesla'yı USDC ile alın", body: "1.000+ ABD hissesi ve ETF, gerçek hisseler, 5 USDC'den başlayan tutarlarla. 150.000 USDC ödüllü lansman kampanyası 31 Ekim'e kadar.", go: "Nasıl çalıştığını gör" },
  vi: { tag: "Hot", title: "Bybit Stocks: mua Apple, Nvidia và Tesla bằng USDC", body: "Hơn 1,000 cổ phiếu và ETF Mỹ, cổ phiếu thật, từ 5 USDC. Sự kiện ra mắt với quỹ thưởng 150,000 USDC đến hết 31/10.", go: "Xem cách hoạt động" },
  id: { tag: "Populer", title: "Bybit Stocks: beli Apple, Nvidia, dan Tesla dengan USDC", body: "1,000+ saham dan ETF AS, saham sungguhan, mulai 5 USDC. Kampanye peluncuran dengan hadiah 150,000 USDC hingga 31 Oktober.", go: "Lihat cara kerjanya" },
  ja: { tag: "注目", title: "Bybit Stocks：USDCでApple、Nvidia、Teslaを購入", body: "1,000以上の米国株・ETFを実株で、5 USDCから。賞金総額150,000 USDCのローンチキャンペーンは10月31日まで。", go: "仕組みを見る" },
  ko: { tag: "인기", title: "Bybit Stocks: USDC로 애플·엔비디아·테슬라 매수", body: "1,000개 이상의 미국 주식·ETF를 실제 주식으로, 5 USDC부터. 총상금 150,000 USDC 런칭 캠페인은 10월 31일까지.", go: "이용 방법 보기" },
  fr: { tag: "À la une", title: "Bybit Stocks : acheter Apple, Nvidia et Tesla en USDC", body: "Plus de 1,000 actions et ETF américains, de vraies actions, dès 5 USDC. Campagne de lancement dotée de 150,000 USDC jusqu’au 31 octobre.", go: "Voir le fonctionnement" },
  de: { tag: "Top", title: "Bybit Stocks: Apple, Nvidia und Tesla mit USDC kaufen", body: "Über 1,000 US-Aktien und ETFs, echte Aktien, ab 5 USDC. Launch-Kampagne mit 150,000 USDC Preispool bis 31. Oktober.", go: "So funktioniert es" },
  ar: { tag: "رائج", title: "Bybit Stocks: شراء أسهم Apple وNvidia وTesla بعملة USDC", body: "أكثر من 1,000 سهم وصندوق ETF أمريكي، أسهم حقيقية، بدءًا من 5 USDC. حملة إطلاق بجوائز 150,000 USDC حتى 31 أكتوبر.", go: "كيف تعمل" },
  ru: { tag: "Новое", title: "Bybit Stocks: акции Apple, Nvidia и Tesla за USDC", body: "Более 1,000 акций и ETF США, настоящие акции, от 5 USDC. Запускная кампания с призовым фондом 150,000 USDC до 31 октября.", go: "Как это работает" },
  it: { tag: "In evidenza", title: "Bybit Stocks: compra Apple, Nvidia e Tesla in USDC", body: "Oltre 1,000 azioni ed ETF USA, azioni reali, da 5 USDC. Campagna di lancio con 150,000 USDC di premi fino al 31 ottobre.", go: "Scopri come funziona" },
  // l10n: needs native review
  ur: { tag: "نمایاں", title: "Bybit Stocks: USDC سے Apple، Nvidia اور Tesla خریدیں", body: "1,000+ امریکی اسٹاکس اور ETFs، حقیقی شیئرز، 5 USDC سے۔ 150,000 USDC انعامی لانچ مہم 31 اکتوبر تک۔", go: "یہ کیسے کام کرتا ہے" },
  // l10n: needs native review
  uk: { tag: "Нове", title: "Bybit Stocks: акції Apple, Nvidia і Tesla за USDC", body: "Понад 1,000 акцій та ETF США, справжні акції, від 5 USDC. Кампанія запуску з призовим фондом 150,000 USDC до 31 жовтня.", go: "Як це працює" },
};
export function bybitStocksTeaser(locale = "en") {
  return TEASER[locale] || (String(locale || "").startsWith("zh") ? TEASER["zh-Hans"] : TEASER.en);
}

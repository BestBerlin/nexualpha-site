// Binance October campaigns (owner 2026-10-12): one NexuAlpha page (/activities/binance-october-gifts) for two Binance
// referral campaigns, each with its own tracked redirect. Shared by the browser, the Worker head, the sitemap and the
// server's /go redirect (server/go-redirect.mjs). The full page copy lives in binance-october-copy.js (route chunk only).
//
// These campaign links are separate from the regular Binance partner code in the registry: they are used ONLY by this
// page's CTAs (via /go/binance-gifts and /go/binance-refer2earn); every other Binance CTA keeps /go/binance.
//
// Sources (checked 2026-10-12):
// - Binance campaign page "十月免费领礼品" (binance.com/<locale>/referral/tier-reward/2610tierreferral/claim, logged out):
//   "立即参与，解锁8.8美金！邀1人还可解锁最高28.8美金，最高享$200旅游基金".
// - Owner's screenshots of the same campaign in the Binance app (2026-10-12): new-user reward an 8.8 USDT token voucher
//   after App login, a C2C (P2P) net deposit and a trade, then a 48-hour risk check; ~4,358 vouchers left; 26,141 users
//   joined; inviter tiers 1/3/5/10 friends; the in-app countdown showed ~23 days (end ≈ 2026-11-04). The detailed rules
//   need a logged-in account and were not readable, so the page states only these facts.
// - Binance "Refer2Earn" page (binance.com/<locale>/referral/earn-together/refer2earn-usdc/claim, logged out): title
//   "Join Referral Boost Program, Earn Up to 400 USDC Every 30 Days"; "Join me and win your USDC rewards!". Programme tasks
//   per the owner's copy of the in-app rules: 6 rounds × 5 days; friends' Spot/Convert volume milestones $100, $500,
//   $1,000; zero-fee pairs excluded; KYC required; rewards within 48 h. No public end date: reviewed after 30 days.
// - Binance "October Referral Tournament" page and its Activity Rules (public, read 2026-10-12): Promotion A referral
//   points (6 referee tasks, max 14 points per referee, 48 h risk check), leaderboard 1,000/800/600/300/150 USDC with
//   minimum points 1,200/1,000/800/450/250, milestones 80/30/10 USDC for the first 100/300/1,000 referrers at 80/30/10
//   points; Promotion B: first 5,000 eligible new users get 2–10 USDC after App login, a $30 top-up (fiat, Buy Crypto
//   or P2P) and $100 Convert/Spot volume, +5 USDC for the first 1,000 with $1,000 bStocks volume; KYC; vouchers by
//   2026-11-20, valid 14 days. The rules also say Binance Affiliates cannot access the promotion, so the page pitches
//   the tournament to visitors as referrers after they join, not as a guaranteed new-user reward.
import { isPartnerPromotableIn } from "./partner-geo-policy.js";
import { BINANCE_OCTOBER_PATH, parseBinanceOctoberPath } from "./binance-october-path.js";

export { BINANCE_OCTOBER_PATH, parseBinanceOctoberPath };
export const BINANCE_OCTOBER_ORIGIN = "https://nexualpha.com";
export const BINANCE_OCTOBER_PUBLISHED = "2026-10-12";
export const BINANCE_OCTOBER_CHECKED = "2026-10-12";
export const BINANCE_OCTOBER_VENUE = "binance";

// Locale segment of binance.com for each NexuAlpha locale (anything else opens the English page).
export const BINANCE_LOCALE_SEGMENT = Object.freeze({
  "zh-Hans": "zh-CN", en: "en", es: "es", "pt-BR": "pt-BR", tr: "tr", vi: "vi", id: "id", ja: "ja", ko: "ko", fr: "fr", de: "de",
});
export const binanceLocaleSegment = (locale) => BINANCE_LOCALE_SEGMENT[locale] || "en";

// Each campaign: its own /go slug, official URL (binance.com only) and the moment its route falls back to /go/binance.
export const BINANCE_OCTOBER_CAMPAIGNS = Object.freeze({
  gifts: Object.freeze({
    slug: "binance-gifts",
    path: "referral/tier-reward/2610tierreferral/claim",
    ref: "GRO_100029289_0QEW9",
    startAt: "2026-10-12T00:00:00Z",
    // In-app countdown on 2026-10-12 showed ~23 days: end of 4 Nov 2026, China time.
    endAt: "2026-11-04T15:59:59Z",
  }),
  refer2earn: Object.freeze({
    slug: "binance-refer2earn",
    path: "referral/earn-together/refer2earn-usdc/claim",
    ref: "GRO_28502_ES1YJ",
    startAt: "2026-10-12T00:00:00Z",
    // No public end date: review 30 days after launch; the route falls back to /go/binance from then on.
    endAt: "2026-11-11T00:00:00Z",
    reviewOnly: true,
  }),
  // October Referral Tournament (binance.com/<locale>/activity/trading-competition/ref-tournament-oct, public rules read
  // 2026-10-12): 2026-10-01 00:00 – 2026-10-31 23:59 UTC. This link carries our main Binance code (registry 11350287).
  tournament: Object.freeze({
    slug: "binance-tournament",
    path: "activity/trading-competition/ref-tournament-oct",
    ref: "11350287",
    startAt: "2026-10-01T00:00:00Z",
    endAt: "2026-10-31T23:59:59Z",
  }),
});
export const BINANCE_OCTOBER_GO_SLUGS = Object.freeze(Object.fromEntries(Object.entries(BINANCE_OCTOBER_CAMPAIGNS).map(([key, c]) => [c.slug, key])));

export function binanceCampaignActive(key = "gifts", now = Date.now()) {
  const campaign = BINANCE_OCTOBER_CAMPAIGNS[key];
  return Boolean(campaign) && Date.parse(campaign.endAt) > (now instanceof Date ? now.getTime() : now);
}
export const binanceOctoberActive = (now = Date.now()) => Object.keys(BINANCE_OCTOBER_CAMPAIGNS).some((key) => binanceCampaignActive(key, now));

/** Official binance.com URL of a campaign for a NexuAlpha locale (server-side redirect target only). */
export function binanceCampaignUrl(key, locale = "en") {
  const campaign = BINANCE_OCTOBER_CAMPAIGNS[key];
  if (!campaign) return null;
  return `https://www.binance.com/${binanceLocaleSegment(locale)}/${campaign.path}?ref=${campaign.ref}`;
}

// Locales with a written edition of the page (indexable, in the sitemap). Other UI locales read English, noindex.
export const BINANCE_OCTOBER_INDEX_LOCALES = Object.freeze(["en", "zh-Hans", "es", "pt-BR", "tr", "vi", "id", "ja", "ko", "fr", "de"]);
// Same neutral set as the academy and the campaign join block: no sign-up wording, no CTA.
export const BINANCE_OCTOBER_NEUTRAL_LOCALES = new Set(["ru", "ar", "zh-Hant", "ur", "uk"]);

/** Why the sign-up is not offered here (null = offered). Follows the site's Binance gating. */
export function binanceOctoberSignupGate({ locale = "en", market } = {}) {
  if (BINANCE_OCTOBER_NEUTRAL_LOCALES.has(locale)) return "neutral-locale";
  if (!isPartnerPromotableIn(BINANCE_OCTOBER_VENUE, { locale, market })) return "partner-geo-restricted";
  return null;
}

/** Tracked CTA href of a campaign (always /go/<campaign slug>), or null where it may not be shown or has ended. */
export function binanceCampaignHref(key, { locale = "en", market, placement = "page", now } = {}) {
  if (binanceOctoberSignupGate({ locale, market })) return null;
  if (!binanceCampaignActive(key, now ?? Date.now())) return null;
  const params = new URLSearchParams({ src: String(placement).toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 48) });
  if (BINANCE_LOCALE_SEGMENT[locale]) params.set("lang", locale);
  return `/go/${BINANCE_OCTOBER_CAMPAIGNS[key].slug}?${params}`;
}

/** Promotion teasers (home, /activities, /exchanges/binance) are shown only where the sign-up may be offered. */
export function binanceOctoberPromotable({ locale = "en", market, now = Date.now() } = {}) {
  return binanceCampaignActive("gifts", now) && !binanceOctoberSignupGate({ locale, market });
}

// Teasers (home campaigns stream, /activities spotlight, /exchanges/binance banner). They link our page, not Binance.
const TEASER = {
  en: { tag: "Gift", title: "Get an 8.8 USDT voucher when you join Binance through NexuAlpha", body: "Log in to the app, make a C2C net deposit, trade once. Invite friends for gift boxes up to 28.8 USD. Until about 4 Nov.", go: "See the 3 steps" },
  "zh-Hans": { tag: "送礼", title: "通过 NexuAlpha 注册币安，领 8.8 USDT 代金券", body: "登录 App、完成 C2C 净入金、交易一笔即可。邀请好友再开最高 28.8 美金礼盒，约至 11 月 4 日。", go: "看 3 步领取" },
  es: { tag: "Regalo", title: "Consigue un cupón de 8.8 USDT al unirte a Binance con NexuAlpha", body: "Inicia sesión en la app, haz un depósito neto por P2P y opera una vez. Invita amigos y abre cajas regalo de hasta 28.8 USD. Hasta el 4 nov aprox.", go: "Ver los 3 pasos" },
  "pt-BR": { tag: "Presente", title: "Ganhe um voucher de 8,8 USDT ao abrir sua conta na Binance pela NexuAlpha", body: "Entre no app, faça um depósito líquido via P2P e negocie uma vez. Convide amigos e abra caixas de presente de até 28,8 USD. Até cerca de 4 nov.", go: "Ver os 3 passos" },
  tr: { tag: "Hediye", title: "NexuAlpha ile Binance'e kaydolun, 8,8 USDT kupon alın", body: "Uygulamaya giriş yapın, P2P ile net para yatırın, bir işlem yapın. Arkadaş davet ederek 28,8 USD'ye kadar hediye kutusu açın. 4 Kasım civarına kadar.", go: "3 adımı gör" },
  vi: { tag: "Quà", title: "Nhận voucher 8.8 USDT khi tham gia Binance qua NexuAlpha", body: "Đăng nhập ứng dụng, nạp ròng qua P2P và giao dịch một lần. Mời bạn bè để mở hộp quà tới 28.8 USD. Đến khoảng 4/11.", go: "Xem 3 bước" },
  id: { tag: "Hadiah", title: "Dapatkan voucher 8.8 USDT saat bergabung dengan Binance lewat NexuAlpha", body: "Masuk ke aplikasi, lakukan deposit bersih via Binance P2P, dan trading sekali. Undang teman untuk kotak hadiah hingga 28,8 USD. Hingga sekitar 4 Nov.", go: "Lihat 3 langkah" },
  ja: { tag: "ギフト", title: "NexuAlpha経由でBinanceに登録して8.8 USDTバウチャー", body: "アプリにログイン、C2Cで純入金、1回取引するだけ。友だち招待で最大28.8 USDのギフトボックスも。11月4日頃まで。", go: "3ステップを見る" },
  ko: { tag: "기프트", title: "NexuAlpha를 통해 바이낸스 가입 시 8.8 USDT 바우처", body: "앱 로그인, P2P 순입금, 거래 1회면 됩니다. 친구를 초대하면 최대 28.8 USD 기프트 박스도. 11월 4일경까지.", go: "3단계 보기" },
  fr: { tag: "Cadeau", title: "Un bon de 8.8 USDT en rejoignant Binance via NexuAlpha", body: "Connectez-vous à l’app, faites un dépôt net C2C, tradez une fois. Invitez des amis pour des coffrets jusqu’à 28.8 USD. Jusqu’au 4 nov. environ.", go: "Voir les 3 étapes" },
  de: { tag: "Geschenk", title: "8.8 USDT Gutschein, wenn Sie Binance über NexuAlpha beitreten", body: "In der App anmelden, C2C-Nettoeinzahlung, einmal handeln. Freunde einladen und Geschenkboxen bis 28.8 USD öffnen. Bis etwa 4. Nov.", go: "Die 3 Schritte" },
};
export function binanceOctoberTeaser(locale = "en") {
  return TEASER[locale] || TEASER.en;
}

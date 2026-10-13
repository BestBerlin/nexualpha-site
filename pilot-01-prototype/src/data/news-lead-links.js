// First-screen links on news articles (CTR pass 2026-10-13, GSC 28 days).
//
// 1. Intent bridge: registration searches ("okx register", "bybit registro", "bybit注册", "gate verification",
//    "kucoin register") land on /news/how-to-register-... tutorials, while the page built for that intent is the
//    exchange profile (/exchanges/<venue>, with the sign-up path, KYC and code) and, for app searches, the app page.
//    Registration tutorials therefore open with a prominent link to the matching profile (and app page where one exists).
//    Neutral locales (ru, ar, zh-Hant, ur, uk, vi) and geo-gated partners get a plain profile link: no code, no sign-up
//    wording.
// 2. Query owners: where two of our articles split one query, the weaker article links to the owner with the query's
//    own words (no rel=canonical unless the pages are near-duplicates; those live in ops/newsroom/thin-noindex-*.json).
import { isPartnerPromotableIn } from "./partner-geo-policy.js";
import { REFERRAL_PARTNERS } from "./referral-partners.generated.js";
import { APP_DOWNLOAD_SLUGS, appDownloadPath } from "./app-download-path.js";
import { NEUTRAL_CTA_LOCALES } from "./locale-policy.js";

const NEUTRAL_LOCALES = NEUTRAL_CTA_LOCALES;
// Wallet venues have no exchange KYC: their bridge keeps the plain profile wording.
const WALLET_VENUES = new Set(["hyperliquid"]);
const VENUE_ALIASES = Object.freeze({ gate: "gate-io", "backpack-exchange": "backpack", "hashkey-global": "hashkey" });
// how-to-register-okx-account-..., how-to-create-coinbase-account-..., how-to-onboard-gate-with-kyc-...,
// how-to-sign-up-okx-referral-code-..., how-to-register-deribit-complete-kyc-...
const TUTORIAL_SLUG = /^how-to-(?:register|create|open|sign-up|onboard)-([a-z0-9]+(?:-(?:io|exchange|global))?)-(?:account|with-kyc|complete-kyc|referral-code)(?:-|$)/;
// okx-kyc-level-1-vs-level-2-2026-..., bybit-referral-code-2026-how-to-use-at-sign-up
const VENUE_SIGNUP_SLUG = /^([a-z0-9]+(?:-io)?)-(?:kyc-level|referral-code)-/;

/** Venue slug a registration tutorial is about, or null. `hasVenue(slug)` confirms a profile page exists. */
export function registrationVenueForArticle(articleSlug, hasVenue = () => true) {
  const slug = String(articleSlug || "");
  const token = TUTORIAL_SLUG.exec(slug)?.[1] || VENUE_SIGNUP_SLUG.exec(slug)?.[1];
  if (!token) return null;
  const venue = VENUE_ALIASES[token] || token;
  return hasVenue(venue) ? venue : null;
}

const SIGNUP_COPY = {
  en: { eyebrow: "Opening an account?", guide: (n, c) => `${n} sign-up guide: steps, KYC${c ? ` and code ${c}` : " and fees"}`, app: (n) => `Download the ${n} app` },
  "zh-Hans": { eyebrow: "准备注册？", guide: (n, c) => `${n} 注册教程：步骤、KYC${c ? `、邀请码 ${c}` : "与手续费"}`, app: (n) => `下载 ${n} App` },
  es: { eyebrow: "¿Vas a abrir una cuenta?", guide: (n, c) => `Registro en ${n}: pasos, KYC${c ? ` y código ${c}` : " y comisiones"}`, app: (n) => `Descargar la app de ${n}` },
  "pt-BR": { eyebrow: "Vai abrir conta?", guide: (n, c) => `Cadastro na ${n}: passos, KYC${c ? ` e código ${c}` : " e taxas"}`, app: (n) => `Baixar o app da ${n}` },
  fr: { eyebrow: "Vous ouvrez un compte ?", guide: (n, c) => `Inscription ${n} : étapes, KYC${c ? ` et code ${c}` : " et frais"}`, app: (n) => `Télécharger l’app ${n}` },
  de: { eyebrow: "Konto eröffnen?", guide: (n, c) => `${n} Anmeldung: Schritte, KYC${c ? ` und Code ${c}` : " und Gebühren"}`, app: (n) => `${n} App herunterladen` },
  it: { eyebrow: "Apri un conto?", guide: (n, c) => `Iscrizione a ${n}: passi, KYC${c ? ` e codice ${c}` : " e commissioni"}`, app: (n) => `Scarica l’app ${n}` },
  ja: { eyebrow: "口座開設の前に", guide: (n, c) => `${n} 登録方法：手順・本人確認${c ? `・招待コード ${c}` : "・手数料"}`, app: (n) => `${n} アプリをダウンロード` },
  ko: { eyebrow: "계정을 만들 계획인가요?", guide: (n, c) => `${n} 가입 방법: 절차, KYC${c ? `, 추천 코드 ${c}` : ", 수수료"}`, app: (n) => `${n} 앱 다운로드` },
  tr: { eyebrow: "Hesap mı açacaksınız?", guide: (n, c) => `${n} kayıt rehberi: adımlar, KYC${c ? ` ve kod ${c}` : " ve ücretler"}`, app: (n) => `${n} uygulamasını indir` },
  id: { eyebrow: "Mau buka akun?", guide: (n, c) => `Cara daftar ${n}: langkah, KYC${c ? `, kode ${c}` : ", biaya"}`, app: (n) => `Unduh aplikasi ${n}` },
};
const PROFILE_COPY = {
  en: (n) => `${n} profile: fees, products and access`,
  "zh-Hans": (n) => `${n} 资料：手续费、产品与可用地区`,
  "zh-Hant": (n) => `${n} 資料：手續費、產品與可用地區`,
  es: (n) => `Perfil de ${n}: comisiones, productos y acceso`,
  "pt-BR": (n) => `Perfil da ${n}: taxas, produtos e acesso`,
  fr: (n) => `Profil ${n} : frais, produits et accès`,
  de: (n) => `${n} Profil: Gebühren, Produkte und Zugang`,
  it: (n) => `Profilo ${n}: commissioni, prodotti e accesso`,
  ja: (n) => `${n} プロフィール：手数料・商品・利用地域`,
  ko: (n) => `${n} 프로필: 수수료, 상품, 이용 지역`,
  tr: (n) => `${n} profili: ücretler, ürünler ve erişim`,
  id: (n) => `Profil ${n}: biaya, produk, dan akses`,
  ru: (n) => `Профиль ${n}: комиссии, продукты и доступ`,
  ar: (n) => `ملف ${n}: الرسوم والمنتجات والتوفر`,
  vi: (n) => `Hồ sơ ${n}: phí, sản phẩm và khả dụng`,
  ur: (n) => `${n} پروفائل: فیس، مصنوعات اور دستیابی`,
  uk: (n) => `Профіль ${n}: комісії, продукти та доступ`,
};
const CODES = Object.fromEntries(REFERRAL_PARTNERS.filter((p) => p.inviteCode).map((p) => [p.slug, p.inviteCode]));

/**
 * First-screen bridge for a registration tutorial, or null.
 * Returns { venue, neutral, eyebrow, links: [{ kind: "profile" | "app", href, label }] } with unprefixed hrefs.
 */
export function newsSignupBridge({ articleSlug, locale = "en", market, venueName, hasVenue }) {
  const venue = registrationVenueForArticle(articleSlug, hasVenue);
  if (!venue) return null;
  const name = venueName?.(venue) || venue;
  const neutral = WALLET_VENUES.has(venue) || NEUTRAL_LOCALES.has(locale) || !SIGNUP_COPY[locale] || !isPartnerPromotableIn(venue, { locale, market });
  const profileHref = `/exchanges/${venue}`;
  if (neutral) {
    return { venue, neutral: true, eyebrow: null, links: [{ kind: "profile", href: profileHref, label: (PROFILE_COPY[locale] || PROFILE_COPY.en)(name) }] };
  }
  const copy = SIGNUP_COPY[locale];
  const links = [{ kind: "profile", href: CODES[venue] ? `${profileHref}#registration-path` : profileHref, label: copy.guide(name, CODES[venue] || null) }];
  if (APP_DOWNLOAD_SLUGS.includes(venue)) links.push({ kind: "app", href: appDownloadPath(venue), label: copy.app(name) });
  return { venue, neutral: false, eyebrow: copy.eyebrow, links };
}

// Query owners for split queries (GSC 28 days to 2026-10-13). Key: the weaker article; value: the owner and the anchor.
const NEWS_QUERY_OWNER_LINKS = Object.freeze({
  // "okx api doc(s)": 9 impressions on the upcoming-changes article, 4 on this one.
  "okx-api-kyc-order-tagged-rate-limit-migration-checklist": {
    query: "okx api docs",
    href: "/news/okx-api-upcoming-changes-websocket-amend-cancel-order-controls",
    label: { en: "OKX API docs: upcoming WebSocket amend and cancel changes", "zh-Hans": "OKX API 文档：WebSocket 改单与撤单即将变更" },
  },
  // "funding 2fa kraken": the 2FA + Global Settings Lock guide owns the query.
  "how-to-secure-a-kraken-account-passkeys-funding-2fa-verification": {
    query: "funding 2fa kraken",
    href: "/news/how-to-enable-kraken-trading-funding-2fa-global-settings-lock-safely",
    label: { en: "How to turn on Kraken funding 2FA with Global Settings Lock", "zh-Hans": "如何开启 Kraken 资金 2FA 与全局设置锁" },
  },
});

/** { query, href, label } for an article that should point at the query owner, or null. */
export function newsQueryOwnerLink(articleSlug, locale = "en") {
  const row = NEWS_QUERY_OWNER_LINKS[articleSlug];
  if (!row) return null;
  return { query: row.query, href: row.href, label: row.label[locale] || row.label.en };
}

// Factbook pages that compete with the exchange profile for a review query link to the profile with the query's words.
// "backpack exchange avis" (fr) was split across /fr/exchanges/backpack and /fr/factbook/backpack; the profile owns it.
const FACTBOOK_PROFILE_ANCHORS = Object.freeze({
  backpack: { fr: "Backpack Exchange : avis, frais et code de parrainage →", en: "Backpack Exchange review: fees and referral code →" },
});

/** Anchor text for the factbook → profile link when a query owner is set, or null (keep the default copy). */
export function factbookProfileAnchor(venueSlug, locale = "en") {
  const row = FACTBOOK_PROFILE_ANCHORS[venueSlug];
  if (!row) return null;
  const label = row[locale] || null;
  if (!label) return null;
  // Codes and review wording stay out of neutral locales.
  return NEUTRAL_LOCALES.has(locale) ? null : label;
}

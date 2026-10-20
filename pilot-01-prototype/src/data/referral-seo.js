import { strikingDistanceVenueTitle, strikingDistanceVenueDescription } from './striking-distance-venue-copy.js';
import { nativeReferralFor } from './referral-native.js';
import { isPartnerPromotableIn } from "./partner-geo-policy.js";
// Search titles for partner exchange profiles (owner 2026-10-10: grow search traffic). People who are about to open
// an account search for "<exchange> referral code" / "<交易所> 邀请码" / "código de indicação <exchange>", so the
// profile title and description lead with the real invite code and, where the owner has a rebate share, the share.
// Codes, shares and payout cadence come from the partner feed (one source of truth) via the generated
// referral-partners.generated.js (scripts/generate-referral-partners.mjs); nothing is typed by hand here, and an
// exchange without a real invite route gets no referral title.
import { REFERRAL_PARTNERS } from "./referral-partners.generated.js";
import { trPercentDative } from "./tr-percent.js";
import { NEUTRAL_CTA_LOCALES } from "./locale-policy.js";

const YEAR = () => new Date().getUTCFullYear();

// CTR pass 2026-10-13 (GSC 28 d: registration searches such as "okx register", "okx怎么注册", "okx nasıl kayıt olunur",
// "cara daftar okx" landed on /news tutorials instead of the profile, and the profile sat in the top 10 with 0 clicks):
// the profile title answers the sign-up query first ("How to Sign Up for OKX: Steps, KYC, Code nexu888") and
// the owner rebate share moves into the description. `titles` are tried in order; the first one inside the title
// budget (60 characters, 32 for zh/ja/ko) wins. Descriptions stay within 155 characters and carry no fine print.
// Only promotable locales are listed: ru, ar, zh-Hant, ur, uk and vi stay neutral (NEUTRAL_TITLE_LOCALES below).
const CADENCE = {
  en: { hourly: " hourly", daily: " daily" },
  "zh-Hans": { hourly: "每小时", daily: "每天" },
};
const COPY = {
  en: {
    titles: [
      (n, c) => `How to Sign Up for ${n}: Steps, KYC, Code ${c}`,
      (n, c) => `Sign Up for ${n}: Steps, KYC, Code ${c}`,
      (n, c) => `${n} Sign-Up: KYC and Code ${c}`,
    ],
    describe: (n, c, p, s) => `Register for ${n} with code ${c} on the official site or app, then complete KYC${p ? `: up to ${p}% of trading fees back, paid by ${n}${CADENCE.en[s] || ""}.` : ". Steps, documents and fees on one page."}`,
  },
  "zh-Hans": {
    titles: [
      (n, c) => `${n} 怎么注册：邀请码 ${c}`,
      (n, c) => `${n} 注册邀请码 ${c}`,
      (n, c) => `${n} 注册邀请码 ${c}`,
    ],
    describe: (n, c, p, s) => `${n} 注册步骤：先在官网或 App 填写邀请码 ${c} 并注册，再完成 KYC${p ? `，手续费最高返还 ${p}%，由 ${n} ${CADENCE["zh-Hans"][s] || ""}结算` : "，附所需证件与手续费"}。`,
  },
  es: {
    titles: [
      (n, c) => `Registro en ${n}: pasos, KYC y código ${c}`,
      (n, c) => `Registro en ${n}: KYC y código ${c}`,
    ],
    describe: (n, c, p) => `Regístrate en ${n} con el código ${c} en la web o app oficial; después completa el KYC${p ? `: hasta ${p}% de comisiones de vuelta, pagado por ${n}.` : ". Pasos, documentos y comisiones."}`,
  },
  // Exchange keyword map 2026-10-11: Brazilians type "código de convite" more often than "código de indicação"
  // (Google autocomplete 16 vs 6), so the title keeps convite and the description keeps indicação as well.
  "pt-BR": {
    titles: [
      (n, c) => `Código de convite ${n} ${c}: cadastro e KYC`,
      (n, c) => `Código de convite ${n} ${c}: cadastro`,
      (n, c) => `Código de convite ${n} ${c}`,
    ],
    describe: (n, c, p) => `Cadastre-se na ${n} com o código de convite (indicação) ${c} no site/app oficial; depois faça o KYC${p ? `: até ${p}% das taxas de volta, pago pela ${n}.` : ". Passos, documentos e taxas."}`,
  },
  fr: {
    titles: [
      (n, c) => `Inscription ${n} : étapes, KYC et code ${c}`,
      (n, c) => `Inscription ${n} : KYC et code ${c}`,
    ],
    describe: (n, c, p) => `Inscrivez-vous sur ${n} avec le code ${c} via le site ou l’app officiels, puis validez le KYC${p ? ` : jusqu’à ${p} % des frais remboursés par ${n}.` : ". Étapes, documents et frais."}`,
  },
  de: {
    titles: [
      (n, c) => `${n} Anmeldung: Schritte, KYC und Code ${c}`,
      (n, c) => `${n} Anmeldung: KYC und Code ${c}`,
    ],
    describe: (n, c, p) => `Bei ${n} mit Code ${c} auf der offiziellen Website oder App anmelden, danach KYC abschließen${p ? `: bis zu ${p} % der Gebühren zurück, gezahlt von ${n}.` : ". Schritte, Dokumente und Gebühren."}`,
  },
  it: {
    titles: [
      (n, c) => `Iscrizione a ${n}: passi, KYC e codice ${c}`,
      (n, c) => `Iscrizione a ${n}: KYC e codice ${c}`,
    ],
    describe: (n, c, p) => `Iscriviti a ${n} con il codice ${c} dal sito o dall’app ufficiale, poi completa il KYC${p ? `: fino al ${p}% delle commissioni rimborsate da ${n}.` : ". Passi, documenti e commissioni."}`,
  },
  ja: {
    titles: [
      (n, c) => `${n} 登録方法：招待コード ${c}`,
      (n, c) => `${n} 招待コード ${c}`,
      (n, c) => `${n} 招待コード ${c}`,
    ],
    describe: (n, c, p) => `${n} の登録手順：公式サイトかアプリで招待コード ${c} を入力して登録し、その後に本人確認（KYC）を完了${p ? `。取引手数料の最大${p}%を ${n} が還元` : "。必要書類と手数料も確認"}。`,
  },
  ko: {
    titles: [
      (n, c) => `${n} 가입 방법: 추천 코드 ${c}`,
      (n, c) => `${n} 가입 추천 코드 ${c}`,
      (n, c) => `${n} 가입 추천 코드 ${c}`,
    ],
    describe: (n, c, p) => `${n} 가입 절차: 공식 사이트나 앱에서 추천 코드 ${c} 입력 후 가입하고 KYC 완료${p ? `. 거래 수수료 최대 ${p}%를 ${n}에서 페이백` : ". 필요 서류와 수수료 안내"}.`,
  },
  tr: {
    titles: [
      (n, c) => `${n} nasıl kayıt olunur? KYC ve kod ${c}`,
      (n, c) => `${n} kayıt: KYC ve kod ${c}`,
    ],
    describe: (n, c, p) => `${n} hesabını resmî site veya uygulamada ${c} koduyla açın, ardından KYC’yi tamamlayın${p ? `; ücretlerin ${trPercentDative(p)} varan kısmını ${n} iade eder.` : ". Adımlar, belgeler ve ücretler."}`,
  },
  id: {
    titles: [
      (n, c) => `Cara daftar ${n}: langkah, KYC, kode ${c}`,
      (n, c) => `Cara daftar ${n}: KYC, kode ${c}`,
    ],
    describe: (n, c, p) => `Daftar ${n} dengan kode ${c} di situs atau aplikasi resmi, lalu selesaikan KYC${p ? `; hingga ${p}% biaya kembali, dibayar ${n}.` : ". Langkah, dokumen, dan biaya."}`,
  },
};

// Hyperliquid is a wallet venue with no exchange KYC: its profile keeps fee wording and a wallet-based description.
// The referral discount (4% on fees) is the one documented in /news/hyperliquid-referral-code-2026-where-to-enter-4-percent-discount.
const WALLET_COPY = {
  en: { title: (n, c) => `${n} Fees, Code ${c} & Funded Accounts`, describe: (n, c) => `Trade on ${n} from your own wallet: connect on the official app, deposit USDC and enter referral code ${c} for a 4% discount on trading fees.` },
  "zh-Hans": { title: (n, c) => `${n} 邀请码 ${c}`, describe: (n, c) => `${n} 无需注册账户：在官方 App 连接自己的钱包、存入 USDC，填写邀请码 ${c} 即可享受交易手续费 4% 折扣。` },
  es: { title: (n, c) => `${n}: comisiones y código de referido ${c}`, describe: (n, c) => `Opera en ${n} con tu propia wallet: conéctala en la app oficial, deposita USDC y usa el código ${c} para un 4% de descuento en comisiones.` },
  "pt-BR": { title: (n, c) => `Código de convite ${n} ${c}: taxas`, describe: (n, c) => `Opere na ${n} com sua própria carteira: conecte no app oficial, deposite USDC e use o código de convite (indicação) ${c}: 4% a menos de taxas.` },
  fr: { title: (n, c) => `${n} : frais et code de parrainage ${c}`, describe: (n, c) => `Tradez sur ${n} avec votre wallet : connectez-le sur l’app officielle, déposez des USDC et saisissez le code ${c} pour 4 % de frais en moins.` },
  de: { title: (n, c) => `${n}: Gebühren und Empfehlungscode ${c}`, describe: (n, c) => `Auf ${n} mit eigener Wallet handeln: in der offiziellen App verbinden, USDC einzahlen, Code ${c} eingeben und 4 % Handelsgebühren sparen.` },
  it: { title: (n, c) => `${n}: commissioni e codice referral ${c}`, describe: (n, c) => `Fai trading su ${n} dal tuo wallet: collegalo nell’app ufficiale, deposita USDC e usa il codice ${c} per il 4% di sconto sulle commissioni.` },
  ja: { title: (n, c) => `${n} 招待コード ${c}`, describe: (n, c) => `${n} は口座登録不要：公式アプリで自分のウォレットを接続し USDC を入金、招待コード ${c} の入力で取引手数料が4%割引。` },
  ko: { title: (n, c) => `${n} 추천 코드 ${c}`, describe: (n, c) => `${n}는 계정 가입 없이 지갑으로 거래: 공식 앱에서 지갑 연결, USDC 입금 후 추천 코드 ${c} 입력 시 거래 수수료 4% 할인.` },
  tr: { title: (n, c) => `${n} ücretleri ve referans kodu ${c}`, describe: (n, c) => `${n} üzerinde kendi cüzdanınızla işlem yapın: resmî uygulamada bağlayın, USDC yatırın ve ${c} kodunu girerek işlem ücretlerinde %4 indirim alın.` },
  id: { title: (n, c) => `${n}: biaya dan kode referral ${c}`, describe: (n, c) => `Trading di ${n} dari wallet sendiri: hubungkan di aplikasi resmi, setor USDC, lalu masukkan kode ${c} untuk diskon 4% biaya trading.` },
};
const WALLET_VENUES = new Set(["hyperliquid"]);

const BY_SLUG = Object.fromEntries(REFERRAL_PARTNERS.map((p) => [p.slug, p]));
// Pages that already earn impressions keep the words people search with, with the invite code added.
const TITLE_OVERRIDES = {
  // Striking distance (GSC 2026-10-11, 2026-10-13): "backpack fee" ranks ~6.5 on the English profile; fees first.
  // Exchange keyword map 2026-10-11 row 38: French searchers type "backpack exchange avis"; /fr/exchanges/backpack is
  // the one page that answers it (partner-venue-faq.js fr entries), and the title now fits the 60-character budget.
  backpack: {
    en: (n, c, y) => `${n} Exchange Fees (${y}) & Referral Code ${c}`,
    fr: (n, c, y) => `${n} Exchange avis (${y}) : frais et code ${c}`,
  },
};
const partnersBySlug = () => BY_SLUG;

// Owner decision 2026-10-10 (keyword/market research): where local law restricts promoting crypto platforms to
// residents, the localized title stays neutral (the page keeps its regular localized fee/profile title):
// ru (Russia advertising rules), ar (Egypt CBE law 194/2020), zh-Hant (Hong Kong SFC Part 5B). In Turkish, Law 7518
// treats promotion of platforms without SPK authorization as unauthorized service, so only exchanges whose Turkish
// entity is on the SPK list keep a referral title.
const NEUTRAL_TITLE_LOCALES = NEUTRAL_CTA_LOCALES;
// Turkey SPK allow-list and every other country restriction live in partner-geo-restrictions.js (sourced, dated).
export function referralTitleAllowed(slug, locale, market) {
  if (NEUTRAL_TITLE_LOCALES.has(locale)) return false;
  return isPartnerPromotableIn(slug, { locale, market });
}

/** Owner-confirmed rebate share (percent) from the partner feed, or null. Used by the localized profile H1. */
export function referralSharePercent(slug) {
  const share = partnersBySlug()[slug]?.share;
  return share != null ? Math.round(share * 100) : null;
}

/** { title, description } for a partner exchange profile in `locale`, or null when there is no real invite code. */
export function referralSeoFor(slug, locale = "en", market) {
  const p = partnersBySlug()[slug];
  if (!p?.inviteCode || !referralTitleAllowed(slug, locale, market)) return null;
  const strikingTitle = strikingDistanceVenueTitle(slug, locale, p.inviteCode);
  if (strikingTitle) return { title: strikingTitle, description: strikingDistanceVenueDescription(slug, locale, p) };
  const native = nativeReferralFor(slug, locale, market);
  if (native?.title) return { title: native.title, description: locale === "tr" && p.share != null ? `${native.copy.query(p.name)}: ${p.inviteCode}. ${trPercentDative(Math.round(p.share * 100))} varan ücret iadesi.` : `${native.copy.query(p.name)}${locale === "pt-BR" ? " (indicação)" : ""}: ${p.inviteCode}. ${native.benefit}.` };
  const pct = p.share != null ? Math.round(p.share * 100) : null;
  if (WALLET_VENUES.has(slug)) {
    const copy = WALLET_COPY[locale] || WALLET_COPY.en;
    return { title: copy.title(p.name, p.inviteCode, YEAR()), description: copy.describe(p.name, p.inviteCode, pct, p.settle) };
  }
  const copy = COPY[locale] || COPY.en;
  const override = TITLE_OVERRIDES[slug]?.[locale];
  const budget = /^(zh|ja|ko)(?:-|$)/.test(locale) ? 32 : 60;
  const candidates = (override ? [override] : copy.titles).map((title) => title(p.name, p.inviteCode, YEAR()));
  return {
    title: candidates.find((title) => title.length <= budget) || candidates[candidates.length - 1],
    description: copy.describe(p.name, p.inviteCode, pct, p.settle),
  };
}

/** Remove code-bearing legacy overrides when promotion is gated; keep neutral reviewed metadata. */
export function geoSafeVenueSeoOverride(override, slug, context = {}) {
  const code = partnersBySlug()[slug]?.inviteCode;
  if (!override || !code || isPartnerPromotableIn(slug, context)) return override;
  const safe = { ...override };
  for (const field of ["title", "description"]) if (safe[field]?.includes(code)) delete safe[field];
  return safe;
}

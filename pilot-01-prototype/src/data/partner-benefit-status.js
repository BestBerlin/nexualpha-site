// One record per partner venue for the user-facing rebate status (audit NX-02, 2026-10-11). The home, the venue page
// (registration card), the factbook, article partner blocks and /rates all read the rebate share, its basis and what
// still needs account-level confirmation from here, so no page says "confirmed" while another says "pending".
//
// No new numbers: the share, auto-settlement and payout cadence come from home-rebate-tiers.js (owner-confirmed
// 2026-10-10: OKX up to 40%, Bitget up to 60%, Binance up to 25%). Invite codes and links stay in partner-registry.js /
// source-bound-cta.js. A venue without a share keeps the "pending" state.
import { HOME_REBATE_SHARE, HOME_AUTO_SETTLE, HOME_SETTLE } from "./home-rebate-tiers.js";

/** Date the site owner confirmed the partner programme terms (shares + settlement) — the "benefit terms confirmed" date. */
export const PARTNER_TERMS_CONFIRMED_ON = "2026-10-10";
/** Venues whose terms were confirmed later than the first batch (owner 2026-10-14: HTX up to 40%). */
const CONFIRMED_ON_BY_VENUE = Object.freeze({ htx: "2026-10-14" });

/** What the exchange still confirms per account after sign-up (the share is each programme's maximum). */
export const ACCOUNT_LEVEL_CHECKS = Object.freeze(["product-scope", "region", "account-tier", "promotion-stacking"]);

const key = (slug) => (typeof slug === "string" ? slug.trim().toLowerCase() : "");

/**
 * null when the venue has no confirmed partner share (callers keep "pending"); otherwise
 * { slug, share (0–1), sharePct, basis, confirmedOn, autoSettle, settle: "hourly"|"daily"|null, accountChecks }.
 */
export function partnerBenefitStatus(slug) {
  const s = key(slug);
  const share = HOME_REBATE_SHARE[s];
  if (!(typeof share === "number" && share > 0)) return null;
  return Object.freeze({
    slug: s,
    share,
    sharePct: Math.round(share * 100),
    basis: "partner-terms-confirmed-by-site-owner",
    confirmedOn: CONFIRMED_ON_BY_VENUE[s] || PARTNER_TERMS_CONFIRMED_ON,
    autoSettle: HOME_AUTO_SETTLE.includes(s),
    settle: HOME_SETTLE[s] || null,
    accountChecks: ACCOUNT_LEVEL_CHECKS,
  });
}

/** Rebate share (0–1) or null; the single read used by calculators (home, /rates). */
export const partnerRebateShare = (slug) => partnerBenefitStatus(slug)?.share ?? null;

// label, "terms confirmed {date}", account sentence, account-level checks sentence
const COPY = {
  en: ["Partner rebate share", "partner terms confirmed {date}", "your account's eligibility is confirmed by the exchange after sign-up", "Confirmed per account by the exchange: product scope, region, account tier and stacking with exchange promotions."],
  "zh-Hans": ["合作返佣比例", "合作条款确认于 {date}", "你的账户是否适用由交易所在注册后确认", "需按账户由交易所确认：适用产品、地区、账户等级，以及能否与交易所活动叠加。"],
  "zh-Hant": ["合作返傭比例", "合作條款確認於 {date}", "你的帳戶是否適用由交易所在註冊後確認", "需依帳戶由交易所確認：適用產品、地區、帳戶等級，以及能否與交易所活動疊加。"],
  es: ["Porcentaje de reembolso de socio", "condiciones de socio confirmadas el {date}", "la plataforma confirma la elegibilidad de tu cuenta tras el registro", "La plataforma lo confirma por cuenta: productos incluidos, región, nivel de cuenta y si se acumula con sus promociones."],
  "pt-BR": ["Percentual de cashback de parceiro", "termos de parceria confirmados em {date}", "a corretora confirma a elegibilidade da sua conta após o cadastro", "A corretora confirma por conta: produtos incluídos, região, nível da conta e acúmulo com promoções da corretora."],
  fr: ["Part de remboursement partenaire", "conditions partenaire confirmées le {date}", "l’éligibilité de votre compte est confirmée par la plateforme après l’inscription", "Confirmé par la plateforme pour chaque compte : produits concernés, région, niveau de compte et cumul avec ses promotions."],
  de: ["Partner-Rückvergütungsanteil", "Partnerbedingungen bestätigt am {date}", "die Börse bestätigt nach der Registrierung, ob Ihr Konto berechtigt ist", "Pro Konto bestätigt die Börse: erfasste Produkte, Region, Kontostufe und Kombinierbarkeit mit Börsenaktionen."],
  it: ["Quota di rimborso partner", "condizioni partner confermate il {date}", "l’idoneità del tuo account è confermata dalla piattaforma dopo la registrazione", "Confermato dalla piattaforma per ogni account: prodotti inclusi, regione, livello dell’account e cumulabilità con le sue promozioni."],
  ja: ["パートナー還元率", "パートナー条件の確認日 {date}", "口座の適用可否は登録後に取引所が確認します", "口座ごとに取引所が確認：対象商品、地域、口座ランク、取引所キャンペーンとの併用可否。"],
  ko: ["파트너 리베이트 비율", "파트너 조건 확인일 {date}", "계정 적용 여부는 가입 후 거래소가 확인합니다", "계정별로 거래소가 확인: 적용 상품, 지역, 계정 등급, 거래소 프로모션과의 중복 여부."],
  ru: ["Доля партнёрского возврата", "партнёрские условия подтверждены {date}", "право вашего аккаунта на возврат биржа подтверждает после регистрации", "Биржа подтверждает для каждого аккаунта: охват продуктов, регион, уровень аккаунта и совместимость с акциями биржи."],
  tr: ["Ortaklık iade oranı", "ortaklık koşulları {date} tarihinde teyit edildi", "hesabınızın uygunluğunu kayıttan sonra borsa teyit eder", "Borsa her hesap için teyit eder: kapsanan ürünler, bölge, hesap seviyesi ve borsa kampanyalarıyla birleşip birleşmediği."],
  id: ["Porsi rabat mitra", "ketentuan mitra dikonfirmasi {date}", "kelayakan akun Anda dikonfirmasi bursa setelah pendaftaran", "Dikonfirmasi bursa per akun: cakupan produk, wilayah, tingkat akun, dan apakah dapat digabung dengan promo bursa."],
  vi: ["Tỷ lệ hoàn phí đối tác", "điều khoản đối tác xác nhận ngày {date}", "sàn xác nhận tài khoản của bạn có đủ điều kiện sau khi đăng ký", "Sàn xác nhận theo từng tài khoản: sản phẩm áp dụng, khu vực, cấp tài khoản và việc cộng dồn với khuyến mãi của sàn."],
  // l10n: needs native review
  ur: ["پارٹنر کی فیس واپسی کا تناسب", "پارٹنر کی شرائط کی تصدیق: {date}", "رجسٹریشن کے بعد ایکسچینج آپ کے اکاؤنٹ کی اہلیت کی تصدیق کرتا ہے", "ایکسچینج ہر اکاؤنٹ کے لیے مصنوعات، علاقہ، اکاؤنٹ کی سطح اور دیگر آفرز کے ساتھ استعمال کی تصدیق کرتا ہے۔"],
  // l10n: needs native review
  uk: ["Частка партнерського повернення комісій", "партнерські умови підтверджено {date}", "біржа підтверджує відповідність вашого облікового запису після реєстрації", "Біржа підтверджує для кожного облікового запису: продукти, регіон, рівень і сумісність з акціями біржі."],
  ar: ["نسبة استرداد الشريك", "تم تأكيد شروط الشراكة في {date}", "تؤكد المنصة أهلية حسابك بعد التسجيل", "تؤكدها المنصة لكل حساب: المنتجات المشمولة والمنطقة ومستوى الحساب وإمكانية الجمع مع عروض المنصة."],
};

export function partnerBenefitCopy(locale = "en") {
  const raw = String(locale || "en");
  const k = raw === "zh-CN" || raw === "zh" ? "zh-Hans" : raw === "zh-TW" || raw === "zh-HK" ? "zh-Hant" : raw;
  const [label, confirmed, account, checks] = COPY[k] || COPY[k.split("-")[0]] || COPY.en;
  return { label, confirmed, account, checks };
}

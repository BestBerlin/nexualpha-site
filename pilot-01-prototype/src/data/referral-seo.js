// Search titles for partner exchange profiles (owner 2026-10-10: grow search traffic). People who are about to open
// an account search for "<exchange> referral code" / "<交易所> 邀请码" / "código de indicação <exchange>", so the
// profile title and description lead with the real invite code and, where the owner has a rebate share, the share.
// Codes, shares and payout cadence come from the partner feed (one source of truth) via the generated
// referral-partners.generated.js (scripts/generate-referral-partners.mjs); nothing is typed by hand here, and an
// exchange without a real invite route gets no referral title.
import { REFERRAL_PARTNERS } from "./referral-partners.generated.js";

const YEAR = () => new Date().getUTCFullYear();

// [title with share, title without share, description builder]
// Descriptions stay within the search snippet budget (160 characters; 80 for zh/ja/ko), see worker clampMetaDescription.
const COPY = {
  en: [
    (n, c, p, y) => `${n} Referral Code ${c}: Up to ${p}% Fee Rebate (${y})`,
    (n, c, y) => `${n} Referral Code ${c}: Sign-up, Fees & Official Route (${y})`,
    (n, c, p, s) => `${n} referral code ${c}: fees and official sign-up link checked by NexuAlpha${p ? `; up to ${p}% of fees back, paid by ${n}${s === "hourly" ? " hourly" : s === "daily" ? " daily" : ""}` : ""}. Partner link disclosed.`,
  ],
  "zh-Hans": [
    (n, c, p, y) => `${n} 邀请码 ${c}：最高返佣 ${p}%（${y}）`,
    (n, c, y) => `${n} 邀请码 ${c}：注册教程、手续费与官方入口（${y}）`,
    (n, c, p, s) => `${n} 邀请码 ${c}${p ? `：手续费最高返还 ${p}%，由 ${n} 结算${s === "hourly" ? "、每小时到账" : s === "daily" ? "、每天到账" : ""}` : "：注册入口与手续费"}。NexuAlpha 核验官方入口，合作关系已披露。`,
  ],
  "zh-Hant": [
    (n, c, p, y) => `${n} 邀請碼 ${c}：最高返傭 ${p}%（${y}）`,
    (n, c, y) => `${n} 邀請碼 ${c}：註冊教學、手續費與官方入口（${y}）`,
    (n, c, p, s) => `${n} 邀請碼 ${c}${p ? `：手續費最高返還 ${p}%，由 ${n} 結算${s === "hourly" ? "、每小時到帳" : s === "daily" ? "、每天到帳" : ""}` : "：註冊入口與手續費"}。NexuAlpha 核驗官方入口，合作關係已揭露。`,
  ],
  es: [
    (n, c, p, y) => `Código de referido ${n} ${c}: hasta ${p}% de reembolso (${y})`,
    (n, c, y) => `Código de referido ${n} ${c}: registro y comisiones (${y})`,
    (n, c, p) => `Código de referido ${n} ${c}: comisiones y enlace oficial verificados por NexuAlpha${p ? `; hasta ${p}% de comisiones de vuelta, paga ${n}` : ""}. Enlace de socio.`,
  ],
  // Exchange keyword map 2026-10-11: Brazilians type "código de convite" more often than "código de indicação"
  // (Google autocomplete 16 vs 6), so the title leads with convite and the description keeps indicação as well.
  "pt-BR": [
    (n, c, p, y) => `Código de convite ${n} ${c}: até ${p}% de cashback (${y})`,
    (n, c, y) => `Código de convite ${n} ${c}: indicação, cadastro e taxas (${y})`,
    (n, c, p) => `Código de convite (indicação) ${n} ${c}: taxas e link oficial verificados pela NexuAlpha${p ? `; até ${p}% das taxas de volta, pago pela ${n}` : ""}. Link de parceiro.`,
  ],
  fr: [
    (n, c, p, y) => `Code de parrainage ${n} ${c} : jusqu’à ${p} % de remise (${y})`,
    (n, c, y) => `Code de parrainage ${n} ${c} : inscription et frais (${y})`,
    (n, c, p) => `Code de parrainage ${n} ${c} : frais et lien officiel vérifiés par NexuAlpha${p ? ` ; jusqu’à ${p} % des frais remboursés par ${n}` : ""}. Lien partenaire signalé.`,
  ],
  de: [
    (n, c, p, y) => `${n} Empfehlungscode ${c}: bis zu ${p} % Gebührenrabatt (${y})`,
    (n, c, y) => `${n} Empfehlungscode ${c}: Anmeldung und Gebühren (${y})`,
    (n, c, p) => `${n} Empfehlungscode ${c}: Gebühren und offizieller Link, geprüft von NexuAlpha${p ? `; bis zu ${p} % der Gebühren zurück, zahlt ${n}` : ""}. Partnerlink offengelegt.`,
  ],
  it: [
    (n, c, p, y) => `Codice referral ${n} ${c}: fino al ${p}% di rimborso (${y})`,
    (n, c, y) => `Codice referral ${n} ${c}: iscrizione e commissioni (${y})`,
    (n, c, p) => `Codice referral ${n} ${c}: commissioni e link ufficiale verificati da NexuAlpha${p ? `; fino al ${p}% di commissioni rimborsate da ${n}` : ""}. Link partner.`,
  ],
  ja: [
    (n, c, p, y) => `${n} 招待コード ${c}：手数料最大${p}%還元（${y}）`,
    (n, c, y) => `${n} 招待コード ${c}：登録方法と手数料（${y}）`,
    (n, c, p) => `${n} 招待コード ${c}${p ? `：取引手数料の最大${p}%を ${n} が還元` : "：登録方法と手数料"}。公式リンクを NexuAlpha が確認、提携を開示。`,
  ],
  ko: [
    (n, c, p, y) => `${n} 추천 코드 ${c}: 수수료 최대 ${p}% 페이백 (${y})`,
    (n, c, y) => `${n} 추천 코드 ${c}: 가입 방법과 수수료 (${y})`,
    (n, c, p) => `${n} 추천 코드 ${c}${p ? `: 거래 수수료 최대 ${p}%를 ${n}이 페이백` : ": 가입 방법과 수수료"}. 공식 링크 NexuAlpha 확인, 제휴 공개.`,
  ],
  ru: [
    (n, c, p, y) => `Реферальный код ${n} ${c}: возврат до ${p}% комиссии (${y})`,
    (n, c, y) => `Реферальный код ${n} ${c}: регистрация и комиссии (${y})`,
    (n, c, p) => `Реферальный код ${n} ${c}: комиссии, условия и официальная ссылка проверены NexuAlpha${p ? `; до ${p}% комиссий возвращает ${n}` : ""}. Партнёрская ссылка раскрыта.`,
  ],
  tr: [
    (n, c, p, y) => `${n} referans kodu ${c}: %${p}'e varan komisyon iadesi (${y})`,
    (n, c, y) => `${n} referans kodu ${c}: kayıt ve ücretler (${y})`,
    (n, c, p) => `${n} referans kodu ${c}: ücretler ve resmî bağlantı NexuAlpha kontrolünden geçti${p ? `; ücretlerin %${p}'e varan kısmını ${n} iade eder` : ""}. Ortaklık bağlantısı.`,
  ],
  id: [
    (n, c, p, y) => `Kode referral ${n} ${c}: rabat biaya hingga ${p}% (${y})`,
    (n, c, y) => `Kode referral ${n} ${c}: cara daftar dan biaya (${y})`,
    (n, c, p) => `Kode referral ${n} ${c}: biaya, syarat, dan tautan resmi diperiksa NexuAlpha${p ? `; hingga ${p}% biaya kembali, dibayar ${n}` : ""}. Tautan mitra diungkapkan.`,
  ],
  vi: [
    (n, c, p, y) => `Mã giới thiệu ${n} ${c}: hoàn phí đến ${p}% (${y})`,
    (n, c, y) => `Mã giới thiệu ${n} ${c}: đăng ký và phí (${y})`,
    (n, c, p) => `Mã giới thiệu ${n} ${c}: phí và liên kết chính thức được NexuAlpha kiểm tra${p ? `; hoàn đến ${p}% phí, do ${n} chi trả` : ""}. Có công bố liên kết đối tác.`,
  ],
  ar: [
    (n, c, p, y) => `رمز إحالة ${n} ‏${c}: استرداد حتى ${p}% من الرسوم (${y})`,
    (n, c, y) => `رمز إحالة ${n} ‏${c}: التسجيل والرسوم (${y})`,
    (n, c, p) => `رمز إحالة ${n} ‏${c}: الرسوم والشروط والرابط الرسمي راجعتها NexuAlpha${p ? `؛ استرداد حتى ${p}% من الرسوم تدفعها ${n}` : ""}. رابط الشراكة مُفصح عنه.`,
  ],
};

const BY_SLUG = Object.fromEntries(REFERRAL_PARTNERS.map((p) => [p.slug, p]));
// Pages that already earn impressions keep the words people search with (GSC 2026-09-09..10-06: "hyperliquid fees"
// 68 impressions, "hyperliquid funded account" 16), with the invite code added.
const TITLE_OVERRIDES = {
  hyperliquid: { en: (n, c, y) => `${n} Fees & Referral Code ${c}: Funded Account Checks (${y})` },
  // Striking distance (GSC 2026-10-11): "backpack fee" ranks ~6; the default no-share title ran past 60 characters and
  // put "Fees" late. Same invite code from the partner feed, fees first, within the title budget.
  // Exchange keyword map 2026-10-11 row 38: French searchers type "backpack exchange avis" (GSC impressions at ~67);
  // the French profile answers it (partner-venue-faq.js fr entries), so the title names it.
  backpack: {
    en: (n, c, y) => `${n} Fees & Referral Code ${c} (${y})`,
    fr: (n, c, y) => `${n} Exchange : avis, frais et code de parrainage ${c} (${y})`,
  },
};
const partnersBySlug = () => BY_SLUG;

// Owner decision 2026-10-10 (keyword/market research): where local law restricts promoting crypto platforms to
// residents, the localized title stays neutral (the page keeps its regular localized fee/profile title):
// ru (Russia advertising rules), ar (Egypt CBE law 194/2020), zh-Hant (Hong Kong SFC Part 5B). In Turkish, Law 7518
// treats promotion of platforms without SPK authorization as unauthorized service, so only exchanges whose Turkish
// entity is on the SPK list keep a referral title.
const NEUTRAL_TITLE_LOCALES = new Set(["ru", "ar", "zh-Hant"]);
// SPK "Faaliyette Bulunanlar Listesi" (temporary list dated 01 Ekim 2026, read 2026-10-11:
// https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi) lists OKX TR (#38),
// Binance Turkey (#4), Bybit (#11) and Gate (#23). Bitget Teknoloji AŞ is on the liquidation list
// (tasfiye-surecinde-olanlar-listesi). MEXC is left out by owner decision 2026-10-11 (exchange keyword plan: Turkish
// referral targets are OKX, Binance and Bybit; MEXC stays neutral) even though the 01 Oct list carries a
// "Mexc Kripto Varlık Alım Satım Platformu AŞ" (#35); flip it back only on an explicit owner decision.
// The list itself says being on it is not an authorization verdict. Pinned in tests/exchange-keywords.test.mjs.
export const TR_SPK_LISTED = Object.freeze(["okx", "binance", "bybit", "gate-io"]);
export function referralTitleAllowed(slug, locale) {
  if (NEUTRAL_TITLE_LOCALES.has(locale)) return false;
  if (locale === "tr") return TR_SPK_LISTED.includes(slug);
  return true;
}

/** Owner-confirmed rebate share (percent) from the partner feed, or null. Used by the localized profile H1. */
export function referralSharePercent(slug) {
  const share = partnersBySlug()[slug]?.share;
  return share != null ? Math.round(share * 100) : null;
}

/** { title, description } for a partner exchange profile in `locale`, or null when there is no real invite code. */
export function referralSeoFor(slug, locale = "en") {
  const p = partnersBySlug()[slug];
  if (!p?.inviteCode || !referralTitleAllowed(slug, locale)) return null;
  const [withShare, withoutShare, describe] = COPY[locale] || COPY.en;
  const pct = p.share != null ? Math.round(p.share * 100) : null;
  const override = TITLE_OVERRIDES[slug]?.[locale];
  return {
    title: override ? override(p.name, p.inviteCode, YEAR()) : pct ? withShare(p.name, p.inviteCode, pct, YEAR()) : withoutShare(p.name, p.inviteCode, YEAR()),
    description: describe(p.name, p.inviteCode, pct, p.settle),
  };
}

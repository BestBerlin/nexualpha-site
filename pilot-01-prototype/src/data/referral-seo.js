// Search titles for partner exchange profiles (owner 2026-10-10: grow search traffic). People who are about to open
// an account search for "<exchange> referral code" / "<交易所> 邀请码" / "código de indicação <exchange>", so the
// profile title and description lead with the real invite code and, where the owner has a rebate share, the share.
// Codes, shares and payout cadence come from the partner feed (one source of truth); nothing is typed by hand here,
// and an exchange without a real invite route gets no referral title.
import { buildPartnersFeed } from "./partners-feed.js";

const YEAR = () => new Date().getUTCFullYear();

// [title with share, title without share, description builder]
const COPY = {
  en: [
    (n, c, p, y) => `${n} Referral Code ${c}: Up to ${p}% Fee Rebate (${y})`,
    (n, c, y) => `${n} Referral Code ${c}: Sign-up, Fees & Official Route (${y})`,
    (n, c, p, s) => `Use ${n} referral code ${c} when you sign up${p ? ` and get up to ${p}% of your trading fees back, settled by ${n}${s === "hourly" ? " every hour" : s === "daily" ? " daily" : ""}` : ""}. Fees, account conditions and the official sign-up link, checked by NexuAlpha. Partner link disclosed.`,
  ],
  "zh-Hans": [
    (n, c, p, y) => `${n} 邀请码 ${c}：最高返佣 ${p}%（${y}）`,
    (n, c, y) => `${n} 邀请码 ${c}：注册教程、手续费与官方入口（${y}）`,
    (n, c, p, s) => `注册 ${n} 时填写邀请码 ${c}${p ? `，手续费最高返还 ${p}%，由 ${n} 官方自动结算${s === "hourly" ? "、每小时到账" : s === "daily" ? "、每天到账" : ""}` : ""}。NexuAlpha 核验手续费、账户条件与官方注册入口，合作关系已披露。`,
  ],
  "zh-Hant": [
    (n, c, p, y) => `${n} 邀請碼 ${c}：最高返傭 ${p}%（${y}）`,
    (n, c, y) => `${n} 邀請碼 ${c}：註冊教學、手續費與官方入口（${y}）`,
    (n, c, p, s) => `註冊 ${n} 時填寫邀請碼 ${c}${p ? `，手續費最高返還 ${p}%，由 ${n} 官方自動結算${s === "hourly" ? "、每小時到帳" : s === "daily" ? "、每天到帳" : ""}` : ""}。NexuAlpha 核驗手續費、帳戶條件與官方註冊入口，合作關係已揭露。`,
  ],
  es: [
    (n, c, p, y) => `Código de referido ${n} ${c}: hasta ${p}% de reembolso (${y})`,
    (n, c, y) => `Código de referido ${n} ${c}: registro y comisiones (${y})`,
    (n, c, p) => `Usa el código de referido ${c} al registrarte en ${n}${p ? ` y recupera hasta el ${p}% de tus comisiones, pagado por ${n}` : ""}. Comisiones, condiciones de cuenta y enlace oficial verificados por NexuAlpha. Enlace de socio declarado.`,
  ],
  "pt-BR": [
    (n, c, p, y) => `Código de indicação ${n} ${c}: até ${p}% de cashback (${y})`,
    (n, c, y) => `Código de indicação ${n} ${c}: cadastro e taxas (${y})`,
    (n, c, p) => `Use o código de indicação ${c} ao se cadastrar na ${n}${p ? ` e receba de volta até ${p}% das taxas, pago pela própria ${n}` : ""}. Taxas, condições da conta e link oficial verificados pela NexuAlpha. Link de parceiro informado.`,
  ],
  fr: [
    (n, c, p, y) => `Code de parrainage ${n} ${c} : jusqu’à ${p} % de remise (${y})`,
    (n, c, y) => `Code de parrainage ${n} ${c} : inscription et frais (${y})`,
    (n, c, p) => `Utilisez le code de parrainage ${c} lors de votre inscription sur ${n}${p ? ` et récupérez jusqu’à ${p} % de vos frais, versés par ${n}` : ""}. Frais, conditions du compte et lien officiel vérifiés par NexuAlpha. Lien partenaire signalé.`,
  ],
  de: [
    (n, c, p, y) => `${n} Empfehlungscode ${c}: bis zu ${p} % Gebührenrabatt (${y})`,
    (n, c, y) => `${n} Empfehlungscode ${c}: Anmeldung und Gebühren (${y})`,
    (n, c, p) => `Nutzen Sie den ${n} Empfehlungscode ${c} bei der Anmeldung${p ? ` und erhalten Sie bis zu ${p} % Ihrer Handelsgebühren zurück, ausgezahlt von ${n}` : ""}. Gebühren, Kontobedingungen und offizieller Link, geprüft von NexuAlpha. Partnerlink offengelegt.`,
  ],
  it: [
    (n, c, p, y) => `Codice referral ${n} ${c}: fino al ${p}% di rimborso (${y})`,
    (n, c, y) => `Codice referral ${n} ${c}: iscrizione e commissioni (${y})`,
    (n, c, p) => `Usa il codice referral ${c} quando ti iscrivi a ${n}${p ? ` e ricevi indietro fino al ${p}% delle commissioni, pagato da ${n}` : ""}. Commissioni, condizioni del conto e link ufficiale verificati da NexuAlpha. Link partner dichiarato.`,
  ],
  ja: [
    (n, c, p, y) => `${n} 招待コード ${c}：手数料最大${p}%還元（${y}）`,
    (n, c, y) => `${n} 招待コード ${c}：登録方法と手数料（${y}）`,
    (n, c, p) => `${n} の登録時に招待コード ${c} を入力${p ? `すると、取引手数料の最大${p}%が ${n} から還元されます` : "してください"}。手数料・口座条件・公式登録リンクを NexuAlpha が確認。パートナーリンクを開示しています。`,
  ],
  ko: [
    (n, c, p, y) => `${n} 추천 코드 ${c}: 수수료 최대 ${p}% 페이백 (${y})`,
    (n, c, y) => `${n} 추천 코드 ${c}: 가입 방법과 수수료 (${y})`,
    (n, c, p) => `${n} 가입 시 추천 코드 ${c}를 입력하세요${p ? `. 거래 수수료의 최대 ${p}%를 ${n}이 직접 돌려줍니다` : ""}. 수수료, 계정 조건, 공식 가입 링크를 NexuAlpha가 확인했습니다. 파트너 링크 공개.`,
  ],
  ru: [
    (n, c, p, y) => `Реферальный код ${n} ${c}: возврат до ${p}% комиссии (${y})`,
    (n, c, y) => `Реферальный код ${n} ${c}: регистрация и комиссии (${y})`,
    (n, c, p) => `Укажите реферальный код ${c} при регистрации на ${n}${p ? ` и возвращайте до ${p}% торговых комиссий — выплачивает сама ${n}` : ""}. Комиссии, условия аккаунта и официальная ссылка проверены NexuAlpha. Партнёрская ссылка раскрыта.`,
  ],
  tr: [
    (n, c, p, y) => `${n} referans kodu ${c}: %${p}'e varan komisyon iadesi (${y})`,
    (n, c, y) => `${n} referans kodu ${c}: kayıt ve ücretler (${y})`,
    (n, c, p) => `${n} kaydında ${c} referans kodunu kullanın${p ? `; işlem ücretlerinizin %${p}'e varan kısmı ${n} tarafından iade edilir` : ""}. Ücretler, hesap koşulları ve resmî kayıt bağlantısı NexuAlpha tarafından kontrol edildi. Ortaklık bağlantısı belirtilmiştir.`,
  ],
  id: [
    (n, c, p, y) => `Kode referral ${n} ${c}: rabat biaya hingga ${p}% (${y})`,
    (n, c, y) => `Kode referral ${n} ${c}: cara daftar dan biaya (${y})`,
    (n, c, p) => `Gunakan kode referral ${c} saat mendaftar di ${n}${p ? ` dan dapatkan kembali hingga ${p}% biaya trading, dibayar oleh ${n}` : ""}. Biaya, syarat akun, dan tautan resmi diperiksa NexuAlpha. Tautan mitra diungkapkan.`,
  ],
  vi: [
    (n, c, p, y) => `Mã giới thiệu ${n} ${c}: hoàn phí đến ${p}% (${y})`,
    (n, c, y) => `Mã giới thiệu ${n} ${c}: đăng ký và phí (${y})`,
    (n, c, p) => `Nhập mã giới thiệu ${c} khi đăng ký ${n}${p ? ` để nhận lại đến ${p}% phí giao dịch, do ${n} chi trả` : ""}. Phí, điều kiện tài khoản và liên kết chính thức được NexuAlpha kiểm tra. Có công bố liên kết đối tác.`,
  ],
  ar: [
    (n, c, p, y) => `رمز إحالة ${n} ‏${c}: استرداد حتى ${p}% من الرسوم (${y})`,
    (n, c, y) => `رمز إحالة ${n} ‏${c}: التسجيل والرسوم (${y})`,
    (n, c, p) => `استخدم رمز الإحالة ${c} عند التسجيل في ${n}${p ? ` واسترد حتى ${p}% من رسوم التداول، تدفعها ${n} مباشرة` : ""}. راجعت NexuAlpha الرسوم وشروط الحساب ورابط التسجيل الرسمي. رابط الشراكة مُفصح عنه.`,
  ],
};

let cache = null;
function partnersBySlug() {
  if (!cache) cache = Object.fromEntries(buildPartnersFeed({ generatedAt: "static" }).partners.map((p) => [p.slug, p]));
  return cache;
}

/** { title, description } for a partner exchange profile in `locale`, or null when there is no real invite code. */
export function referralSeoFor(slug, locale = "en") {
  const p = partnersBySlug()[slug];
  if (!p?.inviteCode) return null;
  const [withShare, withoutShare, describe] = COPY[locale] || COPY.en;
  const pct = p.share != null ? Math.round(p.share * 100) : null;
  return {
    title: pct ? withShare(p.name, p.inviteCode, pct, YEAR()) : withoutShare(p.name, p.inviteCode, YEAR()),
    description: describe(p.name, p.inviteCode, pct, p.settle),
  };
}

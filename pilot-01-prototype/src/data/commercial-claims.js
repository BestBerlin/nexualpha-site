/**
 * Public commercial claims are fail-closed. A referral URL can be useful and
 * still have an unverified user benefit. Only a record with an explicit
 * verification timestamp and source URL may publish a fixed percentage or
 * reward amount.
 */
export function resolveCommercialClaim({ partner = {}, venue = {} } = {}) {
  const checkedAt = partner.benefitVerifiedAt || venue.benefitVerifiedAt || null;
  const sourceUrl = partner.benefitSourceUrl || venue.benefitSourceUrl || null;
  const verified = Boolean(checkedAt && sourceUrl && /^https:\/\//i.test(sourceUrl));
  const rebatePercent = verified
    ? Number(partner.rebatePercent ?? venue.rebatePercent ?? 0)
    : 0;
  return {
    status: verified ? "verified" : "unverified",
    checkedAt,
    sourceUrl,
    rebatePercent: Number.isFinite(rebatePercent) && rebatePercent >= 0 && rebatePercent <= 100 ? rebatePercent : 0,
  };
}

const benefitVerificationCopy = {
  en: (venueName) => `User benefits need verification in the official ${venueName} account`,
  "zh-Hans": (venueName) => `用户权益需在 ${venueName} 官方账户内核验`,
  "zh-Hant": (venueName) => `用戶權益需在 ${venueName} 官方帳戶內核驗`,
  es: (venueName) => `Verifica los beneficios en la cuenta oficial de ${venueName}`,
  "pt-BR": (venueName) => `Verifique os benefícios na conta oficial da plataforma ${venueName}`,
  fr: (venueName) => `Vérifiez les avantages dans le compte officiel ${venueName}`,
  de: (venueName) => `Vorteile im offiziellen ${venueName}-Konto prüfen`,
  ja: (venueName) => `${venueName} の公式アカウントで特典条件を確認してください`,
  ko: (venueName) => `${venueName} 공식 계정에서 혜택 조건을 확인하세요`,
  ar: (venueName) => `تحقق من مزايا المستخدم داخل حساب ${venueName} الرسمي`,
  tr: (venueName) => `Kullanıcı avantajlarını resmi ${venueName} hesabında doğrulayın`,
  ru: (venueName) => `Проверьте преимущества в официальном аккаунте ${venueName}`,
  id: (venueName) => `Verifikasi manfaat di akun resmi ${venueName}`,
  vi: (venueName) => `Kiểm tra quyền lợi trong tài khoản chính thức ${venueName}`,
  it: (venueName) => `Verifica i vantaggi nell'account ufficiale ${venueName}`,
};

function normalizeLocale(locale) {
  const value = String(locale || "en");
  if (value === "zh-CN" || value === "zh-SG" || value === "zh") return "zh-Hans";
  if (value === "zh-TW" || value === "zh-HK" || value === "zh-MO" || /hant/i.test(value)) return "zh-Hant";
  if (value.toLowerCase().startsWith("pt")) return "pt-BR";
  const base = value.split("-")[0];
  return benefitVerificationCopy[value] ? value : base;
}

export function publicCommercialBenefit({ locale = "en", venueName = "the platform", claim } = {}) {
  if (claim?.status === "verified") return null;
  const normalizedLocale = normalizeLocale(locale);
  const copy = benefitVerificationCopy[normalizedLocale] || benefitVerificationCopy.en;
  return copy(venueName);
}

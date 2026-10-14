// Home hero copy variants (scorecard X5, 2026-10-11). Variant "a" is the live copy in home7-copy.js / home7-copy-i18n.js;
// variant "b" overrides only the headline (h1a + h1b) and the subline (sub). Same claims as A, no new numbers: the
// headline share ("{max}", replaced with HOME_REBATE_MAX_PCT at render time) and the partner invite link. No sentence
// about NexuAlpha's own commission in the page body (owner rule 2026-10-13: that disclosure lives in the footer only). Shown only to visitors the worker assigned to "b" while experimentRegistry.home_hero_copy_v1
// is enabled (src/data/home-hero-experiment.js); crawlers always get "a". Every locale needs all three keys and h1b
// must keep "{max}%" (tests/home-hero-experiment.test.mjs).
export const HOME_HERO_B = Object.freeze({
  en: { h1a: "Your fees, returned.", h1b: "Up to {max}% back.", sub: "Sign up on the exchange's official page with NexuAlpha's partner invite link.\nPart of every fee you pay comes back to you." },
  "zh-Hans": { h1a: "你付的手续费，", h1b: "最高返还 {max}%。", sub: "通过 NexuAlpha 合作邀请链接在交易所官网开户，\n每笔手续费按比例返还给你。" },
  "zh-Hant": { h1a: "你付的手續費，", h1b: "最高返還 {max}%。", sub: "透過 NexuAlpha 合作邀請連結在交易所官網開戶，\n每筆手續費按比例返還給你。" },
  es: { h1a: "Recupera comisiones.", h1b: "Hasta un {max}%.", sub: "Regístrate en la página oficial de la plataforma con el enlace de invitación de socio de NexuAlpha.\nParte de cada comisión que pagas vuelve a ti." },
  "pt-BR": { h1a: "Suas taxas de volta.", h1b: "Até {max}% em cashback.", sub: "Cadastre-se na página oficial da corretora com o link de convite parceiro da NexuAlpha.\nParte de cada taxa que você paga volta para você." },
  fr: { h1a: "Vos frais, reversés.", h1b: "Jusqu’à {max}% récupérés.", sub: "Inscrivez-vous sur la page officielle de la plateforme avec le lien d’invitation partenaire de NexuAlpha.\nUne part de chaque frais payé vous revient." },
  de: { h1a: "Gebühren zurückholen.", h1b: "Bis zu {max}%.", sub: "Eröffnen Sie Ihr Konto auf der offiziellen Seite der Börse – mit dem Partner-Einladungslink von NexuAlpha.\nEin Teil jeder Gebühr fließt an Sie zurück." },
  it: { h1a: "Riprenditi le commissioni.", h1b: "Fino al {max}%.", sub: "Registrati sulla pagina ufficiale della piattaforma con il link di invito partner di NexuAlpha.\nParte di ogni commissione che paghi ti torna indietro." },
  ja: { h1a: "払った手数料から、", h1b: "最大 {max}% を還元。", sub: "NexuAlpha の提携招待リンクで、取引所の公式ページから口座開設。\n支払った手数料の一部があなたに戻ります。" },
  ko: { h1a: "낸 수수료에서", h1b: "최대 {max}% 환급.", sub: "NexuAlpha 제휴 초대 링크로 거래소 공식 페이지에서 가입하세요.\n낸 수수료의 일부가 돌아옵니다." },
  ru: { h1a: "Ваши комиссии —", h1b: "до {max}% обратно.", sub: "Откройте счёт на официальной странице биржи по партнёрской ссылке-приглашению NexuAlpha.\nЧасть каждой комиссии возвращается вам." },
  tr: { h1a: "Ücretler size dönsün.", h1b: "En fazla {max}%.", sub: "NexuAlpha partner davet bağlantısıyla borsanın resmî sayfasında hesap açın.\nÖdediğiniz her ücretin bir kısmı size geri döner." },
  id: { h1a: "Biaya Anda kembali,", h1b: "hingga {max}%.", sub: "Daftar di halaman resmi bursa lewat tautan undangan mitra NexuAlpha.\nSebagian dari setiap biaya yang Anda bayar kembali ke Anda." },
  vi: { h1a: "Phí bạn đã trả,", h1b: "hoàn lại đến {max}%.", sub: "Đăng ký trên trang chính thức của sàn qua liên kết mời đối tác của NexuAlpha.\nMột phần mỗi khoản phí bạn trả sẽ quay về bạn." },
  ar: { h1a: "رسومك تعود إليك.", h1b: "حتى {max}%.", sub: "سجّل من الصفحة الرسمية للمنصة عبر رابط دعوة الشريك من NexuAlpha.\nيعود إليك جزء من كل رسوم تدفعها." },
  // l10n: needs native review
  ur: { h1a: "آپ کی فیس، واپس۔", h1b: "{max}% تک واپس۔", sub: "NexuAlpha کے پارٹنر دعوتی لنک سے ایکسچینج کے سرکاری صفحے پر رجسٹر کریں۔\nہر فیس کا ایک حصہ آپ کو واپس ملتا ہے۔" },
  // l10n: needs native review
  uk: { h1a: "Ваші комісії повертаються.", h1b: "До {max}% назад.", sub: "Зареєструйтеся на офіційній сторінці біржі через партнерське запрошення NexuAlpha.\nЧастина кожної сплаченої комісії повертається вам." },
});

export { withHomeHeroVariant, useHomeHeroVariant } from "./home7-hero-context.js";

// Copy for the hero: A returns `t` unchanged; B swaps headline and subline when the locale has them (a locale without
// B copy renders A, never English B inside a localized page).
export function heroCopyFor(t, locale, variant) {
  if (variant !== "b") return t;
  const b = HOME_HERO_B[locale] || (String(locale || "").startsWith("zh") ? HOME_HERO_B["zh-Hans"] : null);
  return b ? { ...t, ...b } : t;
}

// Home hero copy variants (scorecard X5, 2026-10-11). Variant "a" is the live copy in home7-copy.js / home7-copy-i18n.js;
// variant "b" overrides only the headline (h1a + h1b) and the subline (sub). Same claims as A, no new numbers: the
// headline share ("{max}", replaced with HOME_REBATE_MAX_PCT at render time), the partner invite link and the
// disclosed commission. Shown only to visitors the worker assigned to "b" while experimentRegistry.home_hero_copy_v1
// is enabled (src/data/home-hero-experiment.js); crawlers always get "a". Every locale needs all three keys and h1b
// must keep "{max}%" (tests/home-hero-experiment.test.mjs).
import { createContext, createElement, useContext } from "react";

export const HOME_HERO_B = Object.freeze({
  en: { h1a: "Your fees, returned.", h1b: "Up to {max}% back.", sub: "Sign up on the exchange's official page with NexuAlpha's partner invite link.\nOur commission is disclosed, and part of every fee comes back to you." },
  "zh-Hans": { h1a: "你付的手续费，", h1b: "最高返还 {max}%。", sub: "通过 NexuAlpha 合作邀请链接在交易所官网开户，\n佣金公开披露，每笔手续费按比例返还给你。" },
  "zh-Hant": { h1a: "你付的手續費，", h1b: "最高返還 {max}%。", sub: "透過 NexuAlpha 合作邀請連結在交易所官網開戶，\n佣金公開揭露，每筆手續費按比例返還給你。" },
  es: { h1a: "Recupera comisiones.", h1b: "Hasta un {max}%.", sub: "Regístrate en la página oficial de la plataforma con el enlace de invitación de socio de NexuAlpha.\nNuestra comisión está declarada; parte de cada comisión vuelve a ti." },
  "pt-BR": { h1a: "Suas taxas de volta.", h1b: "Até {max}% em cashback.", sub: "Cadastre-se na página oficial da corretora com o link de convite parceiro da NexuAlpha.\nNossa comissão é declarada e parte de cada taxa volta para você." },
  fr: { h1a: "Vos frais, reversés.", h1b: "Jusqu’à {max}% récupérés.", sub: "Inscrivez-vous sur la page officielle de la plateforme avec le lien d’invitation partenaire de NexuAlpha.\nNotre commission est déclarée et une part de vos frais vous revient." },
  de: { h1a: "Gebühren zurückholen.", h1b: "Bis zu {max}%.", sub: "Eröffnen Sie Ihr Konto auf der offiziellen Seite der Börse – mit dem Partner-Einladungslink von NexuAlpha.\nUnsere Provision ist offengelegt, ein Teil jeder Gebühr fließt an Sie zurück." },
  it: { h1a: "Riprenditi le commissioni.", h1b: "Fino al {max}%.", sub: "Registrati sulla pagina ufficiale della piattaforma con il link di invito partner di NexuAlpha.\nLa nostra commissione è dichiarata e parte di ogni commissione ti torna indietro." },
  ja: { h1a: "払った手数料から、", h1b: "最大 {max}% を還元。", sub: "NexuAlpha の提携招待リンクで、取引所の公式ページから口座開設。\n紹介報酬は開示済み。手数料の一部があなたに戻ります。" },
  ko: { h1a: "낸 수수료에서", h1b: "최대 {max}% 환급.", sub: "NexuAlpha 제휴 초대 링크로 거래소 공식 페이지에서 가입하세요.\n커미션은 공개되어 있으며, 수수료 일부가 돌아옵니다." },
  ru: { h1a: "Ваши комиссии —", h1b: "до {max}% обратно.", sub: "Откройте счёт на официальной странице биржи по партнёрской ссылке-приглашению NexuAlpha.\nНаше вознаграждение раскрыто, часть каждой комиссии возвращается вам." },
  tr: { h1a: "Ücretler size dönsün.", h1b: "En fazla {max}%.", sub: "NexuAlpha partner davet bağlantısıyla borsanın resmî sayfasında hesap açın.\nKomisyonumuz açıklanmıştır; her ücretin bir kısmı size geri döner." },
  id: { h1a: "Biaya Anda kembali,", h1b: "hingga {max}%.", sub: "Daftar di halaman resmi bursa lewat tautan undangan mitra NexuAlpha.\nKomisi kami diungkapkan, dan sebagian dari setiap biaya kembali ke Anda." },
  vi: { h1a: "Phí bạn đã trả,", h1b: "hoàn lại đến {max}%.", sub: "Đăng ký trên trang chính thức của sàn qua liên kết mời đối tác của NexuAlpha.\nHoa hồng của chúng tôi được công khai, một phần mỗi khoản phí quay về bạn." },
  ar: { h1a: "رسومك تعود إليك.", h1b: "حتى {max}%.", sub: "سجّل من الصفحة الرسمية للمنصة عبر رابط دعوة الشريك من NexuAlpha.\nعمولتنا مُفصح عنها، ويعود إليك جزء من كل رسوم تدفعها." },
});

// The variant the home hero renders with. Provided by the SSR entry (worker-assigned variant) and the browser entry
// (prerender state, so hydration renders exactly the server markup). Default "a" = the live copy.
export const HomeHeroVariantContext = createContext("a");

export function withHomeHeroVariant(element, variant) {
  return createElement(HomeHeroVariantContext.Provider, { value: variant === "b" ? "b" : "a" }, element);
}

export function useHomeHeroVariant() {
  return useContext(HomeHeroVariantContext);
}

// Copy for the hero: A returns `t` unchanged; B swaps headline and subline when the locale has them (a locale without
// B copy renders A, never English B inside a localized page).
export function heroCopyFor(t, locale, variant) {
  if (variant !== "b") return t;
  const b = HOME_HERO_B[locale] || (String(locale || "").startsWith("zh") ? HOME_HERO_B["zh-Hans"] : null);
  return b ? { ...t, ...b } : t;
}

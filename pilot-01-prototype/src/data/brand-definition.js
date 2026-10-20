// Lightweight canonical copy: safe for home browser imports without the schema graph.
export const ENTITY_DEFINITION = Object.freeze({
  "en": "NexuAlpha compares crypto exchange fees and applicable rebates using official sources. Free, independent guidance funded by disclosed exchange referrals.",
  "zh-Hans": "NexuAlpha 是独立的加密交易所手续费比较与返还指南，依据官方来源帮助交易者核对费率、注册链接和适用返还，降低交易成本。内容免费，由公开披露的交易所推荐计划资助。",
  "zh-Hant": "NexuAlpha 是獨立的加密交易所手續費比較指南，依官方來源核對費率與平台條件，協助評估交易成本。內容免費，由公開揭露的交易所推薦計畫資助。",
  "es": "NexuAlpha compara tarifas y reembolsos cripto con fuentes oficiales. Guía gratuita e independiente, financiada por referidos declarados.",
  "pt-BR": "NexuAlpha compara taxas e reembolsos cripto com fontes oficiais. Guia gratuito e independente, financiado por indicações divulgadas.",
  "fr": "NexuAlpha compare les frais et remises crypto avec des sources officielles. Guide gratuit et indépendant, financé par des parrainages déclarés.",
  "de": "NexuAlpha vergleicht Kryptogebühren und Rabatte anhand offizieller Quellen. Kostenlos und unabhängig, durch offengelegte Empfehlungen finanziert.",
  "it": "NexuAlpha confronta costi e rimborsi crypto da fonti ufficiali. Guida gratuita e indipendente, finanziata da referral dichiarati.",
  "ja": "NexuAlpha は公式情報に基づく独立した暗号資産取引所の手数料比較ガイドです。取引コストの確認を支援します。無料で、開示された取引所紹介制度により運営されています。",
  "ko": "NexuAlpha는 공식 출처로 암호화폐 거래소 수수료와 조건을 비교하는 독립 가이드입니다. 거래 비용 확인을 돕습니다. 무료이며 공개된 거래소 추천 프로그램으로 운영됩니다.",
  "ru": "NexuAlpha сравнивает комиссии криптобирж по официальным источникам. Бесплатный независимый гид финансируется раскрытыми реферальными программами.",
  "tr": "NexuAlpha resmi kaynaklarla kripto ücret ve iadelerini karşılaştırır. Ücretsiz, bağımsız rehber; açıklanan referans programlarıyla finanse edilir.",
  "id": "NexuAlpha membandingkan biaya dan rabat kripto dari sumber resmi. Panduan gratis dan independen, didanai referral yang diungkapkan.",
  "vi": "NexuAlpha so sánh phí sàn crypto từ nguồn chính thức. Hướng dẫn độc lập, miễn phí, được tài trợ bởi chương trình giới thiệu đã công bố.",
  "ar": "NexuAlpha دليل مستقل لمقارنة رسوم منصات العملات المشفرة من مصادر رسمية. المحتوى مجاني وتموله برامج إحالة معلنة.",
  "ur": "NexuAlpha سرکاری ذرائع سے کرپٹو ایکسچینج فیس کا موازنہ کرتا ہے۔ آزاد، مفت رہنمائی؛ ظاہر کردہ ریفرل پروگراموں سے مالی معاونت۔",
  "uk": "NexuAlpha порівнює комісії криптобірж за офіційними джерелами. Безкоштовний незалежний гід фінансують розкриті реферальні програми."
});

export function organizationDescription(locale = "en") {
  const raw = String(locale || "en");
  const aliases = { "zh-CN": "zh-Hans", "zh-TW": "zh-Hant", "zh-HK": "zh-Hant", pt: "pt-BR", zh: "zh-Hans" };
  const code = ENTITY_DEFINITION[raw] ? raw : aliases[raw] || aliases[raw.split("-")[0]] || raw.split("-")[0];
  return ENTITY_DEFINITION[code] || ENTITY_DEFINITION.en;
}

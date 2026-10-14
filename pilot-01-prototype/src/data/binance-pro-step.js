// Owner 2026-10-14: the Binance invite code 11350287 is a Pro-mode code. Every Binance sign-up flow on the site gives
// this one plain step (an instruction, not a disclaimer). Neutral editions show no Binance code, so they never render it.
export const BINANCE_PRO_STEP = Object.freeze({
  "zh-Hans": "注册时请使用币安专业版（Pro），不要选简易版（Lite）。",
  "zh-Hant": "註冊時請使用幣安專業版（Pro），不要選簡易版（Lite）。",
  en: "When you sign up, use Binance Pro, not Binance Lite.",
  ja: "登録時は Binance のプロ版（Pro）を選び、ライト版（Lite）は選ばないでください。",
  ko: "가입할 때 바이낸스 프로(Pro)를 사용하고 라이트(Lite)는 선택하지 마세요.",
  tr: "Kayıt olurken Binance Pro'yu kullanın, Binance Lite'ı seçmeyin.",
  es: "Al registrarte, usa Binance Pro, no Binance Lite.",
  "pt-BR": "Ao se cadastrar, use o Binance Pro, não o Binance Lite.",
  fr: "Lors de l’inscription, utilisez Binance Pro, pas Binance Lite.",
  de: "Wählen Sie bei der Registrierung Binance Pro, nicht Binance Lite.",
  id: "Saat mendaftar, gunakan Binance Pro, bukan Binance Lite.",
  it: "Durante la registrazione usa Binance Pro, non Binance Lite.",
  ar: "عند التسجيل استخدم Binance Pro وليس Binance Lite.",
  ru: "При регистрации выберите Binance Pro, а не Binance Lite.",
  vi: "Khi đăng ký, hãy dùng Binance Pro, không chọn Binance Lite.",
  ur: "رجسٹریشن کے وقت Binance Pro استعمال کریں، Binance Lite نہیں۔",
  uk: "Під час реєстрації оберіть Binance Pro, а не Binance Lite.",
});
export function binanceProStep(locale = "en") {
  const normalized = locale === "zh-CN" ? "zh-Hans" : locale === "zh-TW" ? "zh-Hant" : locale === "pt" ? "pt-BR" : locale;
  return BINANCE_PRO_STEP[normalized] || BINANCE_PRO_STEP[String(normalized).split("-")[0]] || BINANCE_PRO_STEP.en;
}

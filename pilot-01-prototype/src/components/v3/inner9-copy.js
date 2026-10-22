// Inner-page conversion strings (2026-10-23 inner-page pass), all 17 site locales. Pinned to its own chunk
// (shared-registration-helpers in vite.config.mjs) because the venue, compare and news route chunks all read it.
// median: fee-ledger legend ({n} = number of exchanges with a checked figure for that row).
// auto / enter: the invite-code line under a sign-up button; "auto" only when the sign-up URL itself carries the code.
// signup: primary button label ({name} = exchange). code: invite-code label. lower: tag on the side of a pair with the lower verified spot fee.
const C = (median, auto, enter, signup, code, lower) => ({ median, auto, enter, signup, code, lower });

export const INNER9_COPY = {
  en: C("Median of {n} checked exchanges", "Code applied automatically by the sign-up link", "Enter the code when you sign up", "Sign up on {name}", "Invite code", "Lower fees"),
  "zh-Hans": C("{n} 家已核验交易所的中位数", "注册链接已自动带入邀请码", "注册时请填写邀请码", "前往 {name} 官方注册", "邀请码", "费率更低"),
  "zh-Hant": C("{n} 家已核驗交易所的中位數", "註冊連結已自動帶入邀請碼", "註冊時請填寫邀請碼", "前往 {name} 官方註冊", "邀請碼", "費率較低"),
  es: C("Mediana de {n} exchanges revisados", "El enlace de registro aplica el código automáticamente", "Introduce el código al registrarte", "Regístrate en {name}", "Código de invitación", "Comisiones más bajas"),
  "pt-BR": C("Mediana de {n} corretoras verificadas", "O link de cadastro aplica o código automaticamente", "Informe o código ao se cadastrar", "Cadastre-se na {name}", "Código de convite", "Taxas menores"),
  fr: C("Médiane de {n} plateformes vérifiées", "Le lien d’inscription applique le code automatiquement", "Saisissez le code lors de l’inscription", "S’inscrire sur {name}", "Code d’invitation", "Frais plus bas"),
  de: C("Median von {n} geprüften Börsen", "Der Registrierungslink setzt den Code automatisch ein", "Code bei der Registrierung eingeben", "Bei {name} registrieren", "Einladungscode", "Niedrigere Gebühren"),
  ja: C("確認済み {n} 取引所の中央値", "登録リンクで招待コードが自動適用されます", "登録時に招待コードを入力してください", "{name} に公式登録", "招待コード", "手数料が低い"),
  ko: C("확인된 거래소 {n}곳의 중앙값", "가입 링크에 초대 코드가 자동 적용됩니다", "가입할 때 초대 코드를 입력하세요", "{name} 공식 가입", "초대 코드", "수수료 더 낮음"),
  tr: C("Kontrol edilen {n} borsanın medyanı", "Kayıt bağlantısı kodu otomatik uygular", "Kayıt olurken kodu girin", "{name} kaydı", "Davet kodu", "Daha düşük ücret"),
  ru: C("Медиана {n} проверенных бирж", "Ссылка регистрации подставляет код автоматически", "Введите код при регистрации", "Регистрация на {name}", "Код приглашения", "Комиссии ниже"),
  ar: C("الوسيط لـ {n} منصات تم التحقق منها", "رابط التسجيل يطبّق الرمز تلقائيًا", "أدخل الرمز عند التسجيل", "سجّل في {name}", "رمز الدعوة", "رسوم أقل"),
  id: C("Median dari {n} bursa yang dicek", "Tautan pendaftaran menerapkan kode secara otomatis", "Masukkan kode saat mendaftar", "Daftar di {name}", "Kode undangan", "Biaya lebih rendah"),
  vi: C("Trung vị của {n} sàn đã kiểm tra", "Liên kết đăng ký tự động áp dụng mã", "Nhập mã khi đăng ký", "Đăng ký {name}", "Mã mời", "Phí thấp hơn"),
  it: C("Mediana di {n} exchange verificati", "Il link di registrazione applica il codice automaticamente", "Inserisci il codice durante la registrazione", "Registrati su {name}", "Codice invito", "Commissioni più basse"),
  // l10n: needs native review
  ur: C("{n} چیک شدہ ایکسچینجز کا میڈین", "رجسٹریشن لنک کوڈ خود بخود لگا دیتا ہے", "رجسٹر کرتے وقت کوڈ درج کریں", "{name} پر رجسٹر کریں", "دعوتی کوڈ", "کم فیس"),
  // l10n: needs native review
  uk: C("Медіана {n} перевірених бірж", "Посилання реєстрації застосовує код автоматично", "Введіть код під час реєстрації", "Реєстрація на {name}", "Код запрошення", "Нижчі комісії"),
};

export function inner9Copy(locale) {
  const key = String(locale || "en");
  if (INNER9_COPY[key]) return INNER9_COPY[key];
  if (key.toLowerCase() === "zh-hant" || key === "zh-TW" || key === "zh-HK") return INNER9_COPY["zh-Hant"];
  if (key.startsWith("zh")) return INNER9_COPY["zh-Hans"];
  if (key.toLowerCase() === "pt-br" || key === "pt") return INNER9_COPY["pt-BR"];
  return INNER9_COPY[key.split("-")[0]] || INNER9_COPY.en;
}

// True only when the registration URL itself carries the invite code (OKX /join/<code>, Backpack /join/<code>).
// Bitget's partner link (/bg/<id>) does not, so its pages ask the reader to enter the code.
export function signupUrlCarriesCode(url, code) {
  if (!url || !code) return false;
  return String(url).toLowerCase().includes(String(code).toLowerCase());
}

// "Up to 60%" / "最高 60%" -> { pre: "Up to", num: "60%", post: "" } so the figure can be set large.
export function splitShareFigure(value) {
  const text = String(value || "");
  const m = text.match(/(\d+(?:[.,]\d+)?\s?%)/);
  if (!m) return { pre: "", num: text, post: "" };
  return { pre: text.slice(0, m.index).trim(), num: m[1].replace(/\s/g, ""), post: text.slice(m.index + m[1].length).trim() };
}

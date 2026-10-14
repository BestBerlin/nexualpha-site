const LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"];

const FEEDBACK = {
  en: { copied: "Copied", failed: "Copy failed. Select and copy the text below.", codeLabel: "Referral code for manual copy", embedLabel: "Embed code for manual copy" },
  "zh-Hans": { copied: "已复制", failed: "复制失败，请选中并复制下方文本。", codeLabel: "手动复制的邀请码", embedLabel: "手动复制的嵌入代码" },
  "zh-Hant": { copied: "已複製", failed: "複製失敗，請選取並複製下方文字。", codeLabel: "手動複製的邀請碼", embedLabel: "手動複製的嵌入碼" },
  es: { copied: "Copiado", failed: "No se pudo copiar. Selecciona y copia el texto de abajo.", codeLabel: "Código de referido para copia manual", embedLabel: "Código embed para copia manual" },
  "pt-BR": { copied: "Copiado", failed: "Não foi possível copiar. Selecione e copie o texto abaixo.", codeLabel: "Código de indicação para copiar manualmente", embedLabel: "Código de incorporação para copiar manualmente" },
  fr: { copied: "Copié", failed: "Copie impossible. Sélectionnez et copiez le texte ci-dessous.", codeLabel: "Code de parrainage à copier manuellement", embedLabel: "Code d’intégration à copier manuellement" },
  de: { copied: "Kopiert", failed: "Kopieren fehlgeschlagen. Wählen und kopieren Sie den Text unten.", codeLabel: "Empfehlungscode zum manuellen Kopieren", embedLabel: "Einbettungscode zum manuellen Kopieren" },
  ja: { copied: "コピー済み", failed: "コピーできませんでした。下のテキストを選択してコピーしてください。", codeLabel: "手動コピー用の紹介コード", embedLabel: "手動コピー用の埋め込みコード" },
  ko: { copied: "복사됨", failed: "복사하지 못했습니다. 아래 텍스트를 선택해 복사하세요.", codeLabel: "수동 복사용 추천 코드", embedLabel: "수동 복사용 임베드 코드" },
  ar: { copied: "تم النسخ", failed: "تعذّر النسخ. حدّد النص أدناه وانسخه.", codeLabel: "رمز الإحالة للنسخ اليدوي", embedLabel: "رمز التضمين للنسخ اليدوي" },
  tr: { copied: "Kopyalandı", failed: "Kopyalanamadı. Aşağıdaki metni seçip kopyalayın.", codeLabel: "Elle kopyalanacak referans kodu", embedLabel: "Elle kopyalanacak yerleştirme kodu" },
  ru: { copied: "Скопировано", failed: "Не удалось скопировать. Выделите и скопируйте текст ниже.", codeLabel: "Реферальный код для ручного копирования", embedLabel: "Код iframe для ручного копирования" },
  id: { copied: "Disalin", failed: "Gagal menyalin. Pilih dan salin teks di bawah.", codeLabel: "Kode referral untuk disalin manual", embedLabel: "Kode sematan untuk disalin manual" },
  vi: { copied: "Đã sao chép", failed: "Không thể sao chép. Chọn và sao chép văn bản bên dưới.", codeLabel: "Mã giới thiệu để sao chép thủ công", embedLabel: "Mã nhúng để sao chép thủ công" },
  it: { copied: "Copiato", failed: "Copia non riuscita. Seleziona e copia il testo qui sotto.", codeLabel: "Codice referral da copiare manualmente", embedLabel: "Codice embed da copiare manualmente" },
  ur: { copied: "کاپی ہو گیا", failed: "کاپی نہیں ہو سکا۔ نیچے کا متن منتخب کر کے کاپی کریں۔", codeLabel: "دستی کاپی کے لیے ریفرل کوڈ", embedLabel: "دستی کاپی کے لیے ایمبیڈ کوڈ" },
  uk: { copied: "Скопійовано", failed: "Не вдалося скопіювати. Виділіть і скопіюйте текст нижче.", codeLabel: "Реферальний код для ручного копіювання", embedLabel: "Код вставки для ручного копіювання" },
};

function normalizeLocale(locale = "en") {
  const value = String(locale || "en");
  if (value === "zh-CN" || value === "zh-SG" || value === "zh") return "zh-Hans";
  if (value === "zh-TW" || value === "zh-HK" || value === "zh-MO" || /hant/i.test(value)) return "zh-Hant";
  if (value.toLowerCase().startsWith("pt")) return "pt-BR";
  if (LOCALES.includes(value)) return value;
  const base = value.split("-")[0];
  return LOCALES.includes(base) ? base : "en";
}

export function bleedCopyFeedback(locale = "en") {
  return FEEDBACK[normalizeLocale(locale)] || FEEDBACK.en;
}

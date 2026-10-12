const rows = {
  en: ['Sponsored', 'Site tool', 'Open', 'Compare platforms', 'Check regional eligibility and account terms'],
  'zh-Hans': ['推广', '站内工具', '打开', '比较平台', '核对地区资格与账户条款'],
  'zh-Hant': ['推廣', '站內工具', '開啟', '比較平台', '核對地區資格與帳戶條款'],
  ja: ['広告', 'サイトツール', '開く', 'プラットフォーム比較', '地域の利用資格と口座条件を確認'],
  ko: ['광고', '사이트 도구', '열기', '플랫폼 비교', '지역 자격과 계정 조건 확인'],
  tr: ['Sponsorlu', 'Site aracı', 'Aç', 'Platformları karşılaştır', 'Bölgesel uygunluk ve hesap koşullarını kontrol edin'],
  es: ['Patrocinado', 'Herramienta', 'Abrir', 'Comparar plataformas', 'Consulta la elegibilidad regional y las condiciones de cuenta'],
  'pt-BR': ['Patrocinado', 'Ferramenta', 'Abrir', 'Comparar plataformas', 'Confira a elegibilidade regional e os termos da conta'],
  fr: ['Sponsorisé', 'Outil du site', 'Ouvrir', 'Comparer les plateformes', 'Vérifiez l’éligibilité régionale et les conditions du compte'],
  de: ['Gesponsert', 'Website-Tool', 'Öffnen', 'Plattformen vergleichen', 'Regionale Berechtigung und Kontobedingungen prüfen'],
  ru: ['Реклама', 'Инструмент сайта', 'Открыть', 'Сравнить платформы', 'Проверьте региональные ограничения и условия счёта'],
  ar: ['إعلان', 'أداة الموقع', 'افتح', 'قارن المنصات', 'تحقق من الأهلية الإقليمية وشروط الحساب'],
  id: ['Bersponsor', 'Alat situs', 'Buka', 'Bandingkan platform', 'Periksa kelayakan wilayah dan ketentuan akun'],
  vi: ['Được tài trợ', 'Công cụ', 'Mở', 'So sánh nền tảng', 'Kiểm tra điều kiện khu vực và tài khoản'],
  it: ['Sponsorizzato', 'Strumento del sito', 'Apri', 'Confronta piattaforme', 'Verifica idoneità regionale e condizioni del conto'],
  ur: ['اشتہار', 'سائٹ ٹول', 'کھولیں', 'پلیٹ فارم کا موازنہ', 'علاقائی اہلیت اور اکاؤنٹ کی شرائط چیک کریں'],
  uk: ['Реклама', 'Інструмент сайту', 'Відкрити', 'Порівняти платформи', 'Перевірте регіональні обмеження та умови рахунку'],
};
export function promotionCopy(locale = 'en') {
  const key = Object.keys(rows).find(key => key.toLowerCase() === String(locale).toLowerCase());
  const [sponsored, tool, open, compare, conditions] = rows[key] || rows.en;
  return { sponsored, tool, open, compare, conditions };
}
export const promotionConditions = Object.fromEntries(Object.keys(rows).map(locale => [locale, promotionCopy(locale).conditions]));

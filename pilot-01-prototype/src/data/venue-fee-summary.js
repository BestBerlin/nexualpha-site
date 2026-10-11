import { reviewedBaseFeesForVenue } from './reviewed-base-fees.js';

// Base fees come only from exchange-facts.js (through reviewed-base-fees.js) and are independent of partner economics. A source review is required
// for each published number; a venue's base rate cannot imply its VIP schedule.
const httpsSource = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? value : null;
  } catch { return null; }
};

const completeRate = (rate) => {
  const sourceUrl = httpsSource(rate?.sourceUrl);
  const checkedAt = rate?.checkedAt;
  if (!sourceUrl || !checkedAt || !Number.isFinite(Date.parse(checkedAt))) return null;
  if (!Number.isFinite(rate?.makerRate) || !Number.isFinite(rate?.takerRate)) return null;
  const product = typeof rate.product === 'string' && rate.product.trim() ? rate.product.trim() : null;
  const tierKey = typeof rate.tierKey === 'string' && rate.tierKey.trim() ? rate.tierKey.trim() : null;
  const scopeKey = typeof rate.scopeKey === 'string' && rate.scopeKey.trim() ? rate.scopeKey.trim() : null;
  if (!product || !tierKey || !scopeKey) return null;
  return {
    product,
    makerRate: rate.makerRate,
    takerRate: rate.takerRate,
    tierKey,
    scopeKey,
    sourceUrl,
    checkedAt,
    ...(Array.isArray(rate.conditions) ? { conditions: rate.conditions.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()) } : {}),
  };
};

export function buildVenueFeeSummary(db = {}, research = {}) {
  const reviewed = reviewedBaseFeesForVenue(db.slug);
  const reviewedRates = reviewed?.rates?.map(completeRate).filter(Boolean) || [];
  // No fallback to venue-database fee copies: exchange-facts.js (via reviewed-base-fees.js) is the only source.
  const rates = reviewedRates;
  const sources = [...new Set([
    ...rates.map(rate => rate.sourceUrl),
    ...(research.facts || []).filter(fact => fact.axis === 'fees').map(fact => httpsSource(fact.sourceUrl)).filter(Boolean),
  ])];
  return { rates, sources };
}

// Title, account boundary, source action, commercial action, review date label.
const copy = {
  en: ['Trading fees', 'Compare spot and futures maker/taker rates on the official fee pages. VIP tiers, discounts and your final rate depend on the platform and account conditions.', 'View fee source', 'Open registration link', 'Checked'],
  'zh-Hans': ['交易费用', '通过官方费率页比较现货与合约的挂单、吃单费用。VIP 档位、优惠和最终费率取决于平台及账户条件。', '查看费率来源', '打开邀请注册链接', '核实日期'],
  'zh-Hant': ['交易費用', '透過官方費率頁比較現貨與合約的掛單、吃單費用。VIP 等級、優惠及最終費率取決於平台及帳戶條件。', '查看費率來源', '開啟邀請註冊連結', '核實日期'],
  es: ['Comisiones de trading', 'Compara las comisiones maker/taker de spot y futuros en las páginas oficiales. Los niveles VIP, descuentos y la tarifa final dependen de la plataforma y de tu cuenta.', 'Ver fuente de comisiones', 'Abrir enlace de registro', 'Verificado'],
  'pt-BR': ['Taxas de negociação', 'Compare as taxas maker/taker de spot e futuros nas páginas oficiais. Os níveis VIP, descontos e a taxa final dependem da plataforma e das condições da conta.', 'Ver fonte das taxas', 'Abrir link de cadastro', 'Verificado'],
  fr: ['Frais de trading', 'Comparez les frais maker/taker au comptant et sur les contrats à terme sur les pages officielles. Les niveaux VIP, remises et frais finaux dépendent de la plateforme et du compte.', 'Consulter la source des frais', 'Ouvrir le lien d’inscription', 'Vérifié'],
  de: ['Handelsgebühren', 'Vergleichen Sie Maker-/Taker-Gebühren für Spot und Futures auf den offiziellen Gebührenseiten. VIP-Stufen, Rabatte und endgültige Gebühren hängen von Plattform und Konto ab.', 'Gebührenquelle öffnen', 'Registrierungslink öffnen', 'Geprüft'],
  ja: ['取引手数料', '公式の手数料ページで現物と先物のメイカー・テイカー手数料を比較してください。VIPランク、割引、最終手数料はプラットフォームと口座の条件によって異なります。', '手数料の出典を見る', '登録リンクを開く', '確認日'],
  ko: ['거래 수수료', '공식 수수료 페이지에서 현물과 선물의 메이커·테이커 수수료를 비교하세요. VIP 등급, 할인 및 최종 수수료는 플랫폼과 계정 조건에 따라 달라집니다.', '수수료 출처 보기', '가입 링크 열기', '확인일'],
  // l10n: needs native review
  ur: ["ٹریڈنگ فیس", "سرکاری فیس صفحات پر اسپاٹ اور فیوچرز کی میکر اور ٹیکر فیس کا موازنہ کریں۔ VIP سطح، رعایتیں اور حتمی فیس پلیٹ فارم اور اکاؤنٹ کی شرائط پر منحصر ہیں۔", "فیس کا ماخذ دیکھیں", "رجسٹریشن لنک کھولیں", "جانچ کی تاریخ"],
  // l10n: needs native review
  uk: ["Торгові комісії", "Порівнюйте комісії мейкера й тейкера для споту та ф’ючерсів на офіційних сторінках. Рівні VIP, знижки та остаточні комісії залежать від умов платформи й облікового запису.", "Переглянути джерело комісій", "Відкрити посилання реєстрації", "Дата перевірки"],
  ar: ['رسوم التداول', 'قارن رسوم الصانع والآخذ للتداول الفوري والعقود الآجلة في صفحات الرسوم الرسمية. تعتمد مستويات VIP والخصومات والرسوم النهائية على شروط المنصة والحساب.', 'عرض مصدر الرسوم', 'فتح رابط التسجيل', 'تاريخ التحقق'],
  tr: ['İşlem ücretleri', 'Resmî ücret sayfalarında spot ve vadeli işlemlerin piyasa yapıcı/alıcı ücretlerini karşılaştırın. VIP seviyeleri, indirimler ve son ücret platform ile hesap koşullarına bağlıdır.', 'Ücret kaynağını aç', 'Kayıt bağlantısını aç', 'Kontrol tarihi'],
  ru: ['Торговые комиссии', 'Сравните комиссии мейкера и тейкера для спота и фьючерсов на официальных страницах. Уровни VIP, скидки и итоговая комиссия зависят от условий платформы и аккаунта.', 'Источник комиссий', 'Открыть ссылку регистрации', 'Проверено'],
  id: ['Biaya perdagangan', 'Bandingkan biaya maker/taker spot dan futures di halaman biaya resmi. Tingkat VIP, diskon, dan biaya akhir bergantung pada platform serta ketentuan akun.', 'Lihat sumber biaya', 'Buka tautan pendaftaran', 'Diperiksa'],
  vi: ['Phí giao dịch', 'So sánh phí maker/taker giao ngay và hợp đồng tương lai trên trang phí chính thức. Bậc VIP, ưu đãi và phí cuối cùng phụ thuộc vào nền tảng và điều kiện tài khoản.', 'Xem nguồn biểu phí', 'Mở liên kết đăng ký', 'Ngày kiểm tra'],
  it: ['Commissioni di trading', 'Confronta le commissioni maker/taker spot e futures sulle pagine ufficiali. Livelli VIP, sconti e commissioni finali dipendono dalla piattaforma e dalle condizioni del conto.', 'Vedi la fonte delle commissioni', 'Apri il link di registrazione', 'Verificato'],
};

export function feeSummaryCopy(locale = 'en') {
  const [title, body, source, registration, checked] = copy[locale] || copy.en;
  return { title, body, source, registration, checked };
}

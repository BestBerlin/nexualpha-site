// Home v7 for neutral locales (ru, ar, zh-Hant, ur, uk, vi) and no-promotion markets (Vietnam, Resolution 05/2025/NQ-CP): the same
// fee data and tools, with no rebate ledger, no invite code, no sign-up button and no rebate wording. Overlays the
// locale's regular copy (home7-copy.js); Vietnamese has its own wording, every other UI locale on a VN market reads the
// English overlay for the replaced lines.
const NEUTRAL = {
  en: {
    kick: "NEXUALPHA · EXCHANGE FEES & MARKET DATA",
    h1a: "Exchange fees, side by side.", h1b: "Compare before you trade.",
    sub: "Official fee schedules, checked domains and market data for each exchange.\nInformation only: we compare, the exchanges publish.",
    heroGo: "Browse the exchange directory", calcLink: "Estimate fees for my volume",
    pw: (n) => `${n} exchanges`,
    cap: (n) => `${n} exchanges, each with its own fee profile and official domain.`,
    t2: "Fees from official sources", t2b: "Every fee links back to the schedule the exchange publishes.",
    t3b: "We only publish information; accounts and trading stay on each exchange's official site.",
    howH: "Compare in three steps",
    how: [["Pick an exchange", "See its official fees and checked domain."], ["Put two side by side", "Compare maker/taker fees, funding and regional conditions."], ["Check the source", "Every figure links to the exchange's official page."]],
    open: "View profile", pending: "Base fee", shH: "Compare fees first",
    lowest: (n, v) => `${n} has the lowest base fees: ${v} a year.`, most: () => "",
  },
  vi: {
    kick: "NEXUALPHA · PHÍ SÀN & DỮ LIỆU THỊ TRƯỜNG",
    h1a: "Phí sàn, đặt cạnh nhau.", h1b: "So sánh trước khi giao dịch.",
    sub: "Biểu phí chính thức, tên miền đã kiểm tra và dữ liệu thị trường của từng sàn.\nChỉ là thông tin: chúng tôi so sánh, các sàn công bố.",
    heroGo: "Xem danh bạ sàn", calcLink: "Ước tính phí theo khối lượng",
    pw: (n) => `${n} sàn giao dịch`,
    cap: (n) => `${n} sàn giao dịch, mỗi sàn có hồ sơ phí và tên miền chính thức riêng.`,
    t2: "Phí theo nguồn chính thức", t2b: "Mỗi mức phí dẫn về biểu phí do sàn công bố.",
    t3b: "Chúng tôi chỉ cung cấp thông tin; tài khoản và giao dịch diễn ra trên trang chính thức của từng sàn.",
    howH: "So sánh trong ba bước",
    how: [["Chọn một sàn", "Xem phí chính thức và tên miền đã kiểm tra."], ["Đặt hai sàn cạnh nhau", "So sánh phí maker/taker, funding và điều kiện theo khu vực."], ["Kiểm tra nguồn", "Mỗi con số đều dẫn về trang chính thức của sàn."]],
    open: "Xem hồ sơ", pending: "Phí cơ bản", shH: "So sánh phí trước",
    lowest: (n, v) => `${n} có phí cơ bản thấp nhất: ${v} mỗi năm.`, most: () => "",
  },
  ru: {
    kick: "NEXUALPHA · КОМИССИИ БИРЖ И РЫНОЧНЫЕ ДАННЫЕ",
    h1a: "Комиссии бирж — рядом.", h1b: "Сравните, прежде чем торговать.",
    sub: "Официальные тарифы, проверенные домены и рыночные данные по каждой бирже.\nТолько информация: мы сравниваем, биржи публикуют.",
    heroGo: "Открыть каталог бирж", calcLink: "Оценить комиссии для моего объёма",
    pw: (n) => `Бирж: ${n}`,
    cap: (n) => `Бирж: ${n}. У каждой свой профиль комиссий и официальный домен.`,
    t2: "Комиссии из официальных источников", t2b: "Каждая ставка ведёт к тарифам, которые публикует биржа.",
    t3b: "Мы только публикуем информацию; счёт и торговля остаются на официальном сайте биржи.",
    howH: "Сравнение в три шага",
    how: [["Выберите биржу", "Посмотрите официальные комиссии и проверенный домен."], ["Поставьте две рядом", "Сравните комиссии maker/taker, фандинг и региональные условия."], ["Проверьте источник", "Каждая цифра ведёт на официальную страницу биржи."]],
    open: "Профиль", pending: "Базовая комиссия", shH: "Сначала сравните комиссии",
    lowest: (n, v) => `${n}: самые низкие базовые комиссии — ${v} в год.`, most: () => "",
  },
  ar: {
    kick: "NEXUALPHA · رسوم المنصات وبيانات السوق",
    h1a: "رسوم المنصات جنبًا إلى جنب.", h1b: "قارن قبل أن تتداول.",
    sub: "جداول الرسوم الرسمية والنطاقات المتحقق منها وبيانات السوق لكل منصة.\nمعلومات فقط: نحن نقارن، والمنصات تنشر.",
    heroGo: "تصفح دليل المنصات", calcLink: "قدّر الرسوم لحجم تداولي",
    pw: (n) => `${n} منصات`,
    cap: (n) => `${n} منصات، لكل منها ملف رسوم ونطاق رسمي خاص بها.`,
    t2: "رسوم من مصادر رسمية", t2b: "كل رسم يحيل إلى الجدول الذي تنشره المنصة.",
    t3b: "ننشر المعلومات فقط؛ الحسابات والتداول تبقى على الموقع الرسمي لكل منصة.",
    howH: "قارن في ثلاث خطوات",
    how: [["اختر منصة", "اطلع على رسومها الرسمية ونطاقها المتحقق منه."], ["ضع منصتين جنبًا إلى جنب", "قارن رسوم الصانع والآخذ والتمويل والشروط الإقليمية."], ["تحقق من المصدر", "كل رقم يحيل إلى الصفحة الرسمية للمنصة."]],
    open: "عرض الملف", pending: "الرسوم الأساسية", shH: "قارن الرسوم أولًا",
    lowest: (n, v) => `${n} لديها أدنى رسوم أساسية: ${v} سنويًا.`, most: () => "",
  },
  "zh-Hant": {
    kick: "NEXUALPHA · 交易所手續費與市場數據",
    h1a: "交易所手續費，並列比較。", h1b: "先比較，再交易。",
    sub: "各交易所的官方費率表、已核實的官方網域與市場數據。\n僅供資訊參考：我們比較，交易所公布。",
    heroGo: "瀏覽交易所目錄", calcLink: "依我的交易量估算手續費",
    pw: (n) => `${n} 家交易所`,
    cap: (n) => `${n} 家交易所，各有自己的費率資料與官方網域。`,
    t2: "手續費來自官方來源", t2b: "每項費率都連回交易所公布的費率表。",
    t3b: "我們只提供資訊；開戶與交易都在各交易所官網進行。",
    howH: "三步完成比較",
    how: [["選擇交易所", "查看官方手續費與已核實網域。"], ["兩家並列比較", "比較 maker/taker 手續費、資金費率與地區條件。"], ["核對來源", "每個數字都連到交易所官方頁面。"]],
    open: "查看資料", pending: "基礎費率", shH: "先比較手續費",
    lowest: (n, v) => `${n} 基礎手續費最低：每年 ${v}。`, most: () => "",
  },
  // l10n: needs native review
  ur: {
    kick: "NEXUALPHA · ایکسچینج فیس اور مارکیٹ ڈیٹا",
    h1a: "ایکسچینج فیس، ساتھ ساتھ۔", h1b: "ٹریڈ سے پہلے موازنہ کریں۔",
    sub: "ہر ایکسچینج کی سرکاری فیس، تصدیق شدہ ڈومین اور مارکیٹ ڈیٹا۔\nصرف معلومات: ہم موازنہ کرتے ہیں، ایکسچینج شائع کرتے ہیں۔",
    heroGo: "ایکسچینج ڈائریکٹری دیکھیں", calcLink: "میرے حجم کے لیے فیس کا اندازہ",
    pw: (n) => `${n} ایکسچینج`,
    cap: (n) => `${n} ایکسچینج، ہر ایک کا اپنا فیس پروفائل اور سرکاری ڈومین۔`,
    t2: "سرکاری ذرائع سے فیس", t2b: "ہر فیس ایکسچینج کے شائع کردہ جدول سے منسلک ہے۔",
    t3b: "ہم صرف معلومات شائع کرتے ہیں؛ اکاؤنٹ اور ٹریڈنگ ہر ایکسچینج کی سرکاری سائٹ پر رہتے ہیں۔",
    howH: "تین مراحل میں موازنہ",
    how: [["ایکسچینج منتخب کریں", "اس کی سرکاری فیس اور تصدیق شدہ ڈومین دیکھیں۔"], ["دو کو ساتھ رکھیں", "میکر/ٹیکر فیس، فنڈنگ اور علاقائی شرائط کا موازنہ کریں۔"], ["ذریعہ چیک کریں", "ہر عدد ایکسچینج کے سرکاری صفحے سے منسلک ہے۔"]],
    open: "پروفائل دیکھیں", pending: "بنیادی فیس", shH: "پہلے فیس کا موازنہ کریں",
    lowest: (n, v) => `${n} کی بنیادی فیس سب سے کم ہے: سالانہ ${v}۔`, most: () => "",
  },
  // l10n: needs native review
  uk: {
    kick: "NEXUALPHA · КОМІСІЇ БІРЖ І РИНКОВІ ДАНІ",
    h1a: "Комісії бірж — поруч.", h1b: "Порівняйте, перш ніж торгувати.",
    sub: "Офіційні тарифи, перевірені домени та ринкові дані кожної біржі.\nЛише інформація: ми порівнюємо, біржі публікують.",
    heroGo: "Відкрити каталог бірж", calcLink: "Оцінити комісії для мого обсягу",
    pw: (n) => `Бірж: ${n}`,
    cap: (n) => `Бірж: ${n}. Кожна має власний профіль комісій і офіційний домен.`,
    t2: "Комісії з офіційних джерел", t2b: "Кожна ставка веде до тарифів, які публікує біржа.",
    t3b: "Ми лише публікуємо інформацію; рахунок і торгівля залишаються на офіційному сайті біржі.",
    howH: "Порівняння у три кроки",
    how: [["Оберіть біржу", "Перегляньте офіційні комісії та перевірений домен."], ["Поставте дві поруч", "Порівняйте комісії maker/taker, фандинг і регіональні умови."], ["Перевірте джерело", "Кожна цифра веде на офіційну сторінку біржі."]],
    open: "Профіль", pending: "Базова комісія", shH: "Спершу порівняйте комісії",
    lowest: (n, v) => `${n}: найнижчі базові комісії — ${v} на рік.`, most: () => "",
  },
};

export function h7NeutralCopy(locale) {
  const raw = String(locale || "");
  return NEUTRAL[raw] || (/^zh-(TW|HK)/i.test(raw) ? NEUTRAL["zh-Hant"] : null) || NEUTRAL[raw.split("-")[0]] || NEUTRAL.en;
}

// Information-only hero copy for every supported UI locale.
export const NEUTRAL_HERO_COPY = Object.freeze({
  "en": {"eyebrow": "Independent comparison", "lead": "Compare published exchange fees for the same trading volume.", "compare": "Compare fees side by side", "course": "Beginner course", "title": "Fees at a glance", "calculator": "Open the full calculator", "updated": "Updated", "volume": "10M USDT · perpetual taker fees"},
  "zh-Hans": {"eyebrow": "独立比较", "lead": "用相同交易量，对比各交易所公布的手续费。", "compare": "并列比较手续费", "course": "新手课程", "title": "手续费一览", "calculator": "打开完整计算器", "updated": "更新", "volume": "1000万 USDT · 永续合约吃单手续费"},
  "zh-Hant": {"eyebrow": "獨立比較", "lead": "以相同交易量，比較各交易所公布的手續費。", "compare": "並列比較手續費", "course": "新手課程", "title": "手續費一覽", "calculator": "開啟完整計算機", "updated": "更新", "volume": "1000萬 USDT · 永續合約吃單手續費"},
  "ru": {"eyebrow": "Независимое сравнение", "lead": "Сравните опубликованные комиссии бирж для одного объёма торгов.", "compare": "Сравнить комиссии", "course": "Курс для начинающих", "title": "Комиссии в цифрах", "calculator": "Открыть полный калькулятор", "updated": "Обновлено", "volume": "10M USDT · комиссии тейкера, бессрочные контракты"},
  "vi": {"eyebrow": "So sánh độc lập", "lead": "So sánh phí do các sàn công bố cho cùng một khối lượng giao dịch.", "compare": "So sánh phí cạnh nhau", "course": "Khóa học cho người mới", "title": "Phí trong nháy mắt", "calculator": "Mở máy tính đầy đủ", "updated": "Cập nhật", "volume": "10M USDT · phí taker hợp đồng vĩnh cửu"},
  "ar": {"eyebrow": "مقارنة مستقلة", "lead": "قارن الرسوم المنشورة للمنصات عند حجم تداول واحد.", "compare": "قارن الرسوم جنبًا إلى جنب", "course": "دورة للمبتدئين", "title": "الرسوم في لمحة", "calculator": "افتح الحاسبة الكاملة", "updated": "آخر تحديث", "volume": "10M USDT · رسوم الآخذ للعقود الدائمة"},
  "ur": {"eyebrow": "آزاد موازنہ", "lead": "ایک ہی تجارتی حجم پر ایکسچینجز کی شائع کردہ فیس کا موازنہ کریں۔", "compare": "فیس کا ساتھ ساتھ موازنہ", "course": "ابتدائی کورس", "title": "فیس ایک نظر میں", "calculator": "مکمل کیلکولیٹر کھولیں", "updated": "تازہ کاری", "volume": "10M USDT · دائمی معاہدوں کی ٹیکر فیس"},
  "uk": {"eyebrow": "Незалежне порівняння", "lead": "Порівняйте опубліковані комісії бірж для однакового обсягу торгів.", "compare": "Порівняти комісії", "course": "Курс для початківців", "title": "Комісії в цифрах", "calculator": "Відкрити повний калькулятор", "updated": "Оновлено", "volume": "10M USDT · комісії тейкера, безстрокові контракти"},
  "es": {"eyebrow": "Comparación independiente", "lead": "Compara las tarifas publicadas para el mismo volumen de operaciones.", "compare": "Comparar comisiones", "course": "Curso para principiantes", "title": "Comisiones de un vistazo", "calculator": "Abrir la calculadora completa", "updated": "Actualizado", "volume": "10M USDT · tarifas taker de perpetuos"},
  "pt-BR": {"eyebrow": "Comparação independente", "lead": "Compare as taxas publicadas para o mesmo volume negociado.", "compare": "Comparar taxas lado a lado", "course": "Curso para iniciantes", "title": "Taxas em resumo", "calculator": "Abrir a calculadora completa", "updated": "Atualizado", "volume": "10M USDT · taxas taker de perpétuos"},
  "fr": {"eyebrow": "Comparaison indépendante", "lead": "Comparez les frais publiés pour un même volume de transactions.", "compare": "Comparer les frais", "course": "Cours pour débutants", "title": "Les frais en un coup d’œil", "calculator": "Ouvrir le calculateur complet", "updated": "Mis à jour", "volume": "10M USDT · frais taker des contrats perpétuels"},
  "de": {"eyebrow": "Unabhängiger Vergleich", "lead": "Vergleichen Sie veröffentlichte Gebühren für dasselbe Handelsvolumen.", "compare": "Gebühren direkt vergleichen", "course": "Einsteigerkurs", "title": "Gebühren auf einen Blick", "calculator": "Vollständigen Rechner öffnen", "updated": "Aktualisiert", "volume": "10M USDT · Taker-Gebühren für Perpetuals"},
  "it": {"eyebrow": "Confronto indipendente", "lead": "Confronta le tariffe pubblicate per lo stesso volume di scambi.", "compare": "Confronta le commissioni", "course": "Corso per principianti", "title": "Commissioni a colpo d’occhio", "calculator": "Apri il calcolatore completo", "updated": "Aggiornato", "volume": "10M USDT · commissioni taker dei perpetui"},
  "ja": {"eyebrow": "独立した比較", "lead": "同じ取引量で、各取引所が公表する手数料を比較します。", "compare": "手数料を並べて比較", "course": "初心者向け講座", "title": "手数料の一覧", "calculator": "計算機を開く", "updated": "更新", "volume": "1000万 USDT · 無期限契約のテイカー手数料"},
  "ko": {"eyebrow": "독립적인 비교", "lead": "같은 거래량으로 거래소가 공개한 수수료를 비교하세요.", "compare": "수수료 나란히 비교", "course": "초보자 강좌", "title": "수수료 한눈에 보기", "calculator": "전체 계산기 열기", "updated": "업데이트", "volume": "1000만 USDT · 무기한 계약 테이커 수수료"},
  "tr": {"eyebrow": "Bağımsız karşılaştırma", "lead": "Aynı işlem hacmi için yayımlanan borsa ücretlerini karşılaştırın.", "compare": "Ücretleri yan yana karşılaştır", "course": "Başlangıç kursu", "title": "Bir bakışta ücretler", "calculator": "Tam hesaplayıcıyı aç", "updated": "Güncellendi", "volume": "10M USDT · sürekli vadeli taker ücretleri"},
  "id": {"eyebrow": "Perbandingan independen", "lead": "Bandingkan biaya yang diterbitkan bursa untuk volume trading yang sama.", "compare": "Bandingkan biaya berdampingan", "course": "Kursus pemula", "title": "Sekilas biaya", "calculator": "Buka kalkulator lengkap", "updated": "Diperbarui", "volume": "10M USDT · biaya taker perpetual"},
});
export function neutralHeroCopy(locale) {
  return NEUTRAL_HERO_COPY[locale] || NEUTRAL_HERO_COPY[String(locale || "").split("-")[0]] || NEUTRAL_HERO_COPY.en;
}

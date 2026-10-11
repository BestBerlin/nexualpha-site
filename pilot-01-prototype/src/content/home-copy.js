const rows = {
  en: ["Compare platforms, understand account and funding requirements, and explore official announcements before you decide.", "Start with a comparison", "Account access, trading model, and the conditions that matter — side by side.", "Explore all platforms", "Explore platforms"],
  "zh-Hans": ["比较交易平台，了解开户与入金条件，查看官方动态，找到适合自己的交易入口。", "从一组对比开始", "账户方式、交易类型与使用条件，一起看清楚。", "探索全部平台", "探索平台"],
  "zh-Hant": ["比較交易平台，了解開戶與入金條件，查看官方動態，找到適合自己的交易入口。", "從一組比較開始", "帳戶方式、交易類型與使用條件，一起看清楚。", "探索全部平台", "探索平台"],
  es: ["Compara plataformas, conoce las condiciones de cuenta y depósitos y consulta anuncios oficiales antes de decidir.", "Empieza comparando", "Acceso a cuentas, modelos de negociación y condiciones, lado a lado.", "Explorar todas las plataformas", "Explorar plataformas"],
  "pt-BR": ["Compare plataformas, entenda requisitos de conta e depósitos e consulte anúncios oficiais antes de decidir.", "Comece por uma comparação", "Acesso à conta, modelo de negociação e condições lado a lado.", "Explorar todas as plataformas", "Explorar plataformas"],
  fr: ["Comparez les plateformes, les conditions de compte et de dépôt, puis consultez les annonces officielles avant de choisir.", "Commencez par comparer", "Accès au compte, modèle de trading et conditions, côte à côte.", "Explorer toutes les plateformes", "Explorer les plateformes"],
  de: ["Vergleichen Sie Plattformen, Konto- und Einzahlungsbedingungen und lesen Sie offizielle Mitteilungen vor Ihrer Entscheidung.", "Mit einem Vergleich starten", "Kontozugang, Handelsmodell und Bedingungen im direkten Vergleich.", "Alle Plattformen entdecken", "Plattformen entdecken"],
  ja: ["取引プラットフォームを比較し、口座開設・入金条件と公式発表を確認して、自分に合うサービスを選びましょう。", "まずは比較から", "口座の利用方法、取引形態、利用条件を並べて確認。", "すべてのプラットフォームを見る", "プラットフォームを探す"],
  ko: ["거래 플랫폼을 비교하고 계좌 개설, 입금 조건과 공식 공지를 확인하여 자신에게 맞는 곳을 선택하세요.", "비교부터 시작하세요", "계좌 이용 방식, 거래 유형, 이용 조건을 나란히 확인하세요.", "모든 플랫폼 보기", "플랫폼 탐색"],
  ar: ["قارن المنصات وتعرّف على متطلبات الحساب والإيداع واطّلع على الإعلانات الرسمية قبل اتخاذ قرارك.", "ابدأ بالمقارنة", "قارن طرق الوصول إلى الحساب ونماذج التداول والشروط المهمة.", "استكشف جميع المنصات", "استكشف المنصات"],
  tr: ["Karar vermeden önce platformları karşılaştırın, hesap ve para yatırma koşullarını öğrenin, resmî duyuruları inceleyin.", "Bir karşılaştırmayla başlayın", "Hesap erişimi, işlem modeli ve önemli koşullar yan yana.", "Tüm platformları keşfet", "Platformları keşfet"],
  ru: ["Сравните платформы, условия открытия счёта и пополнения, изучите официальные объявления перед выбором.", "Начните со сравнения", "Доступ к счёту, модель торговли и важные условия рядом.", "Все платформы", "Обзор платформ"],
  id: ["Bandingkan platform, pahami persyaratan akun dan setoran, serta baca pengumuman resmi sebelum memilih.", "Mulai dengan perbandingan", "Akses akun, model perdagangan, dan syarat penting berdampingan.", "Jelajahi semua platform", "Jelajahi platform"],
  vi: ["So sánh nền tảng, tìm hiểu điều kiện mở tài khoản và nạp tiền, rồi xem thông báo chính thức trước khi lựa chọn.", "Bắt đầu bằng so sánh", "Đặt cạnh nhau cách truy cập, mô hình giao dịch và các điều kiện quan trọng.", "Khám phá tất cả nền tảng", "Khám phá nền tảng"],
  // l10n: needs native review
  ur: ["پلیٹ فارمز کا موازنہ کریں، اکاؤنٹ اور فنڈنگ شرائط سمجھیں، اور فیصلہ کرنے سے پہلے سرکاری اعلانات دیکھیں۔", "موازنہ سے شروع کریں", "اکاؤنٹ رسائی، ٹریڈنگ ماڈل اور اہم شرائط ایک ساتھ۔", "تمام پلیٹ فارمز دیکھیں", "پلیٹ فارمز دیکھیں"],
  // l10n: needs native review
  uk: ["Порівнюйте платформи, розумійте вимоги до акаунта й поповнення та переглядайте офіційні оголошення перед рішенням.", "Почніть із порівняння", "Доступ до акаунта, модель торгівлі та важливі умови поруч.", "Переглянути всі платформи", "Переглянути платформи"],
  it: ["Confronta le piattaforme, scopri i requisiti di conto e deposito e consulta gli annunci ufficiali prima di scegliere.", "Inizia con un confronto", "Accesso al conto, modello di trading e condizioni importanti a confronto.", "Esplora tutte le piattaforme", "Esplora le piattaforme"],
};

const featuredLabels = {
  // l10n: needs native review
  ur: "نمایاں پلیٹ فارمز",
  // l10n: needs native review
  uk: "Вибрані платформи",
  en: "Featured platforms", "zh-Hans": "精选交易平台", "zh-Hant": "精選交易平台", es: "Plataformas destacadas", "pt-BR": "Plataformas em destaque", fr: "Sélection de plateformes", de: "Ausgewählte Plattformen", ja: "注目のプラットフォーム", ko: "주요 플랫폼", ar: "منصات مختارة", tr: "Öne çıkan platformlar", ru: "Избранные платформы", id: "Platform pilihan", vi: "Nền tảng nổi bật", it: "Piattaforme in evidenza",
};

const slogans = {
  en: "Published fee benchmarks, reserve sources & official exchange routes.",
  "zh-Hans": "公开费率核对 · 储备金来源 · 用户权益待核验 · 官方入口核验。",
  "zh-Hant": "公開費率核對 · 儲備金來源 · 用戶權益待核驗 · 官方入口核驗。",
  es: "Ve la diferencia. Elige por ti.",
  "pt-BR": "Veja a diferença. Escolha por você.",
  fr: "Voyez les écarts. Choisissez librement.",
  de: "Unterschiede sehen. Selbst wählen.",
  ja: "違いを見て、自分で選ぶ。",
  ko: "차이를 보고, 스스로 선택하세요.",
  ar: "افهم الفروق. اختر بنفسك.",
  tr: "Farkı gör. Seçimi sen yap.",
  ru: "Увидьте различия. Выбирайте сами.",
  id: "Lihat bedanya. Pilih sendiri.",
  vi: "Thấy rõ khác biệt. Tự chọn.",
  // l10n: needs native review
  ur: "فرق سمجھیں۔ خود انتخاب کریں۔",
  // l10n: needs native review
  uk: "Побачте різницю. Оберіть самі.",
  it: "Vedi le differenze. Scegli tu.",
};

const researchLabels = {
  en: "Independent crypto platform research",
  "zh-Hans": "独立加密平台研究",
  "zh-Hant": "獨立加密平台研究",
  es: "Investigación independiente de plataformas cripto",
  "pt-BR": "Pesquisa independente sobre plataformas cripto",
  fr: "Recherche indépendante sur les plateformes crypto",
  de: "Unabhängige Krypto-Plattform-Recherche",
  ja: "独立した暗号資産プラットフォーム調査",
  ko: "독립 암호화폐 플랫폼 리서치",
  ar: "بحث مستقل عن منصات العملات الرقمية",
  tr: "Bağımsız kripto platform araştırması",
  ru: "Независимое исследование криптоплатформ",
  id: "Riset platform kripto independen",
  vi: "Nghiên cứu nền tảng crypto độc lập",
  // l10n: needs native review
  ur: "کرپٹو پلیٹ فارمز کی آزاد تحقیق",
  // l10n: needs native review
  uk: "Незалежне дослідження криптоплатформ",
  it: "Ricerca indipendente sulle piattaforme crypto",
};

const heroH1 = {
  en: "Compare crypto platforms and official account routes",
  "zh-Hans": "比较加密平台与官方开户路径",
  "zh-Hant": "比較加密平台與官方開戶路徑",
  es: "Compara plataformas cripto y rutas oficiales",
  "pt-BR": "Compare plataformas cripto e rotas oficiais",
  fr: "Comparer les plateformes crypto et les accès officiels",
  de: "Krypto-Plattformen und offizielle Zugänge vergleichen",
  ja: "暗号資産プラットフォームと公式ルートを比較",
  ko: "암호화폐 플랫폼과 공식 경로 비교",
  ar: "قارن منصات العملات الرقمية والمسارات الرسمية",
  tr: "Kripto platformlarını ve resmi rotaları karşılaştır",
  ru: "Сравните криптоплатформы и официальные маршруты",
  id: "Bandingkan platform kripto dan rute resmi",
  vi: "So sánh nền tảng crypto và tuyến chính thức",
  // l10n: needs native review
  ur: "کرپٹو پلیٹ فارمز اور سرکاری اکاؤنٹ راستوں کا موازنہ",
  // l10n: needs native review
  uk: "Порівнюйте криптоплатформи та офіційні маршрути акаунтів",
  it: "Confronta piattaforme crypto e percorsi ufficiali",
};

const compareDimensionLabels = {
  en: ["Products", "Fees", "Account access"],
  "zh-Hans": ["产品", "费用", "使用条件"],
  "zh-Hant": ["產品", "費用", "使用條件"],
  es: ["Productos", "Comisiones", "Acceso a cuenta"],
  "pt-BR": ["Produtos", "Taxas", "Acesso à conta"],
  fr: ["Produits", "Frais", "Accès au compte"],
  de: ["Produkte", "Gebühren", "Kontozugang"],
  ja: ["商品", "手数料", "口座アクセス"],
  ko: ["상품", "수수료", "계정 접근"],
  ar: ["المنتجات", "الرسوم", "الوصول للحساب"],
  tr: ["Ürünler", "Ücretler", "Hesap erişimi"],
  ru: ["Продукты", "Комиссии", "Доступ к счёту"],
  id: ["Produk", "Biaya", "Akses akun"],
  vi: ["Sản phẩm", "Phí", "Truy cập tài khoản"],
  // l10n: needs native review
  ur: ["مصنوعات", "فیس", "اکاؤنٹ رسائی"],
  // l10n: needs native review
  uk: ["Продукти", "Комісії", "Доступ до акаунта"],
  it: ["Prodotti", "Commissioni", "Accesso account"],
};

export function homeHeroH1(locale) {
  return heroH1[locale] ?? heroH1.en;
}

export function homeCopy(locale) {
  const [intro, compareTitle, compareIntro, viewAll] = rows[locale] ?? rows.en;
  const featured = featuredLabels[locale] ?? featuredLabels.en;
  const slogan = slogans[locale] ?? slogans.en;
  const researchLabel = researchLabels[locale] ?? researchLabels.en;
  const compareDimensionLabelsForLocale = compareDimensionLabels[locale] ?? compareDimensionLabels.en;
  return { intro, compareTitle, compareIntro, viewAll, featured, slogan, researchLabel, compareDimensionLabels: compareDimensionLabelsForLocale };
}

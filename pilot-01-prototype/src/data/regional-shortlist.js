import { REGIONAL_FUNDING_VERIFICATION_MATRIX, regionalFundingRowsForMarkets } from "./regional-funding-verification-matrix.js";
import { regionalDirectoryHref, regionalToolHref } from "./regional-directory.js";
import { getTelegramDeepLink } from "./telegram-start-payload.js";

export const REGIONAL_SHORTLIST_STATES = Object.freeze({
  RESEARCHABLE: "researchable",
  ACCOUNT_CONFIRM: "account_confirm",
  PAUSED: "paused",
});

const STATE_COPY = {
  // l10n: needs native review
  ur: {"heading": "علاقائی مختصر فہرست", "controls": "فہرست کی شرائط بدلیں", "residence": "رہائش", "product": "مصنوعات", "funding": "فنڈنگ راستہ", "accountStage": "اکاؤنٹ کا مرحلہ", "researchable": "تحقیق ممکن", "account_confirm": "اکاؤنٹ میں تصدیق کریں", "paused": "موقوف / جائزہ", "openProfile": "تحقیقی پروفائل کھولیں", "noDirectCta": "براہ راست رجسٹریشن نہیں", "compare": "موجودہ فہرست کا موازنہ", "telegram": "اسی سیاق کے ساتھ Telegram میں جاری رکھیں", "note": "فہرست کی حیثیت جانچی گئی علاقائی پالیسی اور فنڈنگ ریکارڈ سے آتی ہے۔ یہ اکاؤنٹ کی منظوری، مصنوعات تک رسائی، فنڈنگ یا فوائد کی دستیابی ثابت نہیں کرتی۔"},
  // l10n: needs native review
  uk: {"heading": "Регіональний короткий список", "controls": "Налаштувати список", "residence": "Місце проживання", "product": "Продукт", "funding": "Маршрут поповнення", "accountStage": "Етап облікового запису", "researchable": "Можна досліджувати", "account_confirm": "Підтвердити в обліковому записі", "paused": "Призупинено / перевірка", "openProfile": "Відкрити дослідницький профіль", "noDirectCta": "Без прямої реєстрації", "compare": "Порівняти поточний список", "telegram": "Продовжити з цим контекстом у Telegram", "note": "Стани списку походять із перевірених регіональних правил і записів поповнення. Вони не підтверджують схвалення облікового запису, доступність продукту, поповнення чи переваг."},

  en: {
    heading: "Regional shortlist",
    controls: "Tune the shortlist",
    residence: "Residence",
    product: "Product",
    funding: "Funding route",
    accountStage: "Account stage",
    researchable: "Can research",
    account_confirm: "Confirm in account",
    paused: "Paused / review",
    openProfile: "Open research profile",
    noDirectCta: "No direct CTA",
    compare: "Compare current shortlist",
    telegram: "Continue with this context in Telegram",
    note: "Shortlist states come from reviewed regional policy and funding rows. They do not prove account approval, product access, funding availability or benefits.",
  },
  "zh-Hans": {
    heading: "地区短名单",
    controls: "调整短名单条件",
    residence: "居住地",
    product: "产品",
    funding: "入金路径",
    accountStage: "账户阶段",
    researchable: "可研究",
    account_confirm: "需账户内确认",
    paused: "暂停 / 复核",
    openProfile: "打开研究档案",
    noDirectCta: "无直达 CTA",
    compare: "比较当前短名单",
    telegram: "带当前条件去 Telegram",
    note: "短名单状态来自已审阅地区政策和资金矩阵；不证明开户通过、产品可用、入金可用或用户权益。",
  },
  "zh-Hant": {
    heading: "地區短名單",
    controls: "調整短名單條件",
    residence: "居住地",
    product: "產品",
    funding: "入金路徑",
    accountStage: "帳戶階段",
    researchable: "可研究",
    account_confirm: "需帳戶內確認",
    paused: "暫停 / 複核",
    openProfile: "打開研究檔案",
    noDirectCta: "無直達 CTA",
    compare: "比較目前短名單",
    telegram: "帶目前條件去 Telegram",
    note: "短名單狀態來自已審閱地區政策與資金矩陣；不證明開戶通過、產品可用、入金可用或用戶權益。",
  },
  es: {
    heading: "Lista corta regional",
    controls: "Ajustar la lista corta",
    residence: "Residencia",
    product: "Producto",
    funding: "Ruta de financiación",
    accountStage: "Etapa de la cuenta",
    researchable: "Se puede investigar",
    account_confirm: "Confirmar en la cuenta",
    paused: "Pausado / revisar",
    openProfile: "Abrir perfil de investigación",
    noDirectCta: "Sin CTA directo",
    compare: "Comparar la lista actual",
    telegram: "Continuar con este contexto en Telegram",
    note: "Los estados de la lista corta vienen de políticas regionales y filas de financiación revisadas. No prueban aprobación de cuenta, acceso a producto, disponibilidad de depósito ni beneficios.",
  },
  "pt-BR": {
    heading: "Lista regional",
    controls: "Ajustar lista",
    residence: "Residência",
    product: "Produto",
    funding: "Rota de depósito",
    accountStage: "Etapa da conta",
    researchable: "Pode pesquisar",
    account_confirm: "Confirmar na conta",
    paused: "Pausado / revisar",
    openProfile: "Abrir perfil de pesquisa",
    noDirectCta: "Sem CTA direto",
    compare: "Comparar lista atual",
    telegram: "Continuar com este contexto no Telegram",
    note: "Os estados da lista vêm de políticas regionais e linhas de depósito revisadas. Não provam aprovação de conta, acesso a produto, disponibilidade de depósito ou benefícios.",
  },
  fr: {
    heading: "Liste régionale",
    controls: "Ajuster la liste",
    residence: "Résidence",
    product: "Produit",
    funding: "Route de dépôt",
    accountStage: "Étape du compte",
    researchable: "Recherche possible",
    account_confirm: "Confirmer dans le compte",
    paused: "En pause / à vérifier",
    openProfile: "Ouvrir le profil de recherche",
    noDirectCta: "Aucun CTA direct",
    compare: "Comparer la liste actuelle",
    telegram: "Continuer avec ce contexte dans Telegram",
    note: "Les états de la liste viennent de politiques régionales et de lignes de dépôt vérifiées. Ils ne prouvent pas l'approbation du compte, l'accès produit, la disponibilité du dépôt ni les avantages.",
  },
  de: {
    heading: "Regionale Shortlist",
    controls: "Shortlist anpassen",
    residence: "Wohnsitz",
    product: "Produkt",
    funding: "Einzahlungsweg",
    accountStage: "Kontostufe",
    researchable: "Prüfbar",
    account_confirm: "Im Konto bestätigen",
    paused: "Pausiert / prüfen",
    openProfile: "Rechercheprofil öffnen",
    noDirectCta: "Kein direkter CTA",
    compare: "Aktuelle Shortlist vergleichen",
    telegram: "Mit diesem Kontext in Telegram fortfahren",
    note: "Shortlist-Status stammen aus geprüften regionalen Regeln und Einzahlungszeilen. Sie belegen keine Kontoannahme, Produktfreigabe, Einzahlungsmöglichkeit oder Nutzerleistungen.",
  },
  ja: {
    heading: "地域別ショートリスト",
    controls: "ショートリスト条件を調整",
    residence: "居住地",
    product: "商品",
    funding: "入金経路",
    accountStage: "口座の段階",
    researchable: "調査可能",
    account_confirm: "口座内で確認",
    paused: "停止 / 要確認",
    openProfile: "調査プロフィールを開く",
    noDirectCta: "直接CTAなし",
    compare: "現在の候補を比較",
    telegram: "この条件でTelegramに進む",
    note: "短候補の状態は、確認済みの地域ポリシーと入金行に基づきます。口座承認、商品利用、入金可否、特典を証明するものではありません。",
  },
  ko: {
    heading: "지역별 후보 목록",
    controls: "후보 조건 조정",
    residence: "거주지",
    product: "상품",
    funding: "입금 경로",
    accountStage: "계정 단계",
    researchable: "조사 가능",
    account_confirm: "계정에서 확인",
    paused: "중지 / 재검토",
    openProfile: "리서치 프로필 열기",
    noDirectCta: "직접 CTA 없음",
    compare: "현재 후보 비교",
    telegram: "이 조건으로 Telegram 계속",
    note: "후보 상태는 검토된 지역 정책과 입금 매트릭스에 기반합니다. 계정 승인, 상품 이용, 입금 가능성 또는 혜택을 증명하지 않습니다.",
  },
  tr: {
    heading: "Bölgesel kısa liste",
    controls: "Kısa liste koşullarını ayarla",
    residence: "İkamet",
    product: "Ürün",
    funding: "Fonlama yolu",
    accountStage: "Hesap aşaması",
    researchable: "Araştırılabilir",
    account_confirm: "Hesapta doğrula",
    paused: "Durdur / incele",
    openProfile: "Araştırma profilini aç",
    noDirectCta: "Doğrudan CTA yok",
    compare: "Mevcut kısa listeyi karşılaştır",
    telegram: "Bu bağlamla Telegram'da devam et",
    note: "Kısa liste durumları incelenmiş bölgesel politika ve fonlama satırlarından gelir. Hesap onayı, ürün erişimi, fonlama kullanılabilirliği veya avantaj kanıtı değildir.",
  },
  ru: {
    heading: "Региональный список",
    controls: "Настроить список",
    residence: "Резидентство",
    product: "Продукт",
    funding: "Маршрут пополнения",
    accountStage: "Этап аккаунта",
    researchable: "Можно изучать",
    account_confirm: "Подтвердить в аккаунте",
    paused: "Пауза / проверка",
    openProfile: "Открыть профиль исследования",
    noDirectCta: "Нет прямого CTA",
    compare: "Сравнить текущий список",
    telegram: "Продолжить с этим контекстом в Telegram",
    note: "Статусы списка основаны на проверенных региональных правилах и строках пополнения. Они не доказывают одобрение аккаунта, доступ к продукту, доступность пополнения или преимущества.",
  },
  ar: {
    heading: "قائمة إقليمية مختصرة",
    controls: "تعديل القائمة",
    residence: "الإقامة",
    product: "المنتج",
    funding: "مسار الإيداع",
    accountStage: "مرحلة الحساب",
    researchable: "قابل للبحث",
    account_confirm: "التأكيد داخل الحساب",
    paused: "متوقف / مراجعة",
    openProfile: "فتح ملف البحث",
    noDirectCta: "لا يوجد CTA مباشر",
    compare: "مقارنة القائمة الحالية",
    telegram: "المتابعة بهذا السياق في Telegram",
    note: "تعتمد حالات القائمة على سياسات إقليمية وصفوف تمويل تمت مراجعتها. وهي لا تثبت قبول الحساب أو توفر المنتج أو إمكانية الإيداع أو المزايا.",
  },
  vi: {
    heading: "Danh sách nghiên cứu theo khu vực",
    controls: "Điều chỉnh điều kiện nghiên cứu",
    residence: "Nơi cư trú",
    product: "Sản phẩm",
    funding: "Đường nạp tiền",
    accountStage: "Giai đoạn tài khoản",
    researchable: "Có thể nghiên cứu",
    account_confirm: "Xác nhận trong tài khoản",
    paused: "Tạm dừng / rà soát",
    openProfile: "Mở hồ sơ nghiên cứu",
    noDirectCta: "Không có CTA trực tiếp",
    compare: "So sánh danh sách hiện tại",
    telegram: "Tiếp tục với ngữ cảnh này trên Telegram",
    note: "Trạng thái nghiên cứu dựa trên chính sách khu vực và dữ liệu funding đã rà soát. Trạng thái này không chứng minh tài khoản được duyệt, sản phẩm khả dụng, nạp tiền thành công hay có quyền lợi.",
  },
  id: {
    heading: "Daftar riset regional",
    controls: "Atur daftar riset",
    residence: "Domisili",
    product: "Produk",
    funding: "Jalur pendanaan",
    accountStage: "Tahap akun",
    researchable: "Dapat diriset",
    account_confirm: "Konfirmasi di akun",
    paused: "Dijeda / tinjau ulang",
    openProfile: "Buka profil riset",
    noDirectCta: "Tidak ada CTA langsung",
    compare: "Bandingkan daftar saat ini",
    telegram: "Lanjutkan konteks ini di Telegram",
    note: "Status daftar berasal dari kebijakan regional dan baris pendanaan yang sudah ditinjau. Ini tidak membuktikan persetujuan akun, akses produk, ketersediaan pendanaan, atau manfaat pengguna.",
  },
  it: {
    heading: "Lista regionale",
    controls: "Regola la lista",
    residence: "Residenza",
    product: "Prodotto",
    funding: "Percorso di deposito",
    accountStage: "Fase account",
    researchable: "Ricercabile",
    account_confirm: "Conferma nell'account",
    paused: "In pausa / revisione",
    openProfile: "Apri profilo di ricerca",
    noDirectCta: "Nessun CTA diretto",
    compare: "Confronta la lista attuale",
    telegram: "Continua con questo contesto in Telegram",
    note: "Gli stati della lista derivano da policy regionali e righe di deposito revisionate. Non provano approvazione dell'account, accesso al prodotto, disponibilità di deposito o vantaggi.",
  },
};

export const REGIONAL_SHORTLIST_PRODUCTS = Object.freeze([
  { value: "spot", label: "Spot" },
  { value: "perpetuals", label: "Perpetuals" },
  { value: "dex", label: "DEX" },
]);

export const REGIONAL_SHORTLIST_ACCOUNT_STAGES = Object.freeze([
  { value: "new_account", label: "New account" },
  { value: "another_platform", label: "Another platform" },
  { value: "existing_account", label: "Existing account" },
]);

const PRODUCT_LABELS = {
  // l10n: needs native review
  ur: { spot: "اسپاٹ", perpetuals: "پرپیچوئل", dex: "DEX" },
  // l10n: needs native review
  uk: { spot: "Спот", perpetuals: "Безстрокові контракти", dex: "DEX" },
  es: { spot: "Spot", perpetuals: "Perpetuos", dex: "DEX" },
  "pt-BR": { spot: "Spot", perpetuals: "Perpétuos", dex: "DEX" },
  fr: { spot: "Spot", perpetuals: "Perpétuels", dex: "DEX" },
  de: { spot: "Spot", perpetuals: "Perpetuals", dex: "DEX" },
  "zh-Hant": { spot: "現貨", perpetuals: "永續合約", dex: "DEX" },
  ja: { spot: "現物", perpetuals: "無期限先物", dex: "DEX" },
  ko: { spot: "현물", perpetuals: "무기한 선물", dex: "DEX" },
  tr: { spot: "Spot", perpetuals: "Sürekli vadeli", dex: "DEX" },
  ru: { spot: "Спот", perpetuals: "Бессрочные фьючерсы", dex: "DEX" },
  ar: { spot: "فوري", perpetuals: "عقود دائمة", dex: "DEX" },
  vi: { spot: "Giao ngay", perpetuals: "Hợp đồng vĩnh cửu", dex: "DEX" },
  id: { spot: "Spot", perpetuals: "Perpetual", dex: "DEX" },
  it: { spot: "Spot", perpetuals: "Perpetui", dex: "DEX" },
};

const ACCOUNT_STAGE_LABELS = {
  // l10n: needs native review
  ur: { new_account: "نیا اکاؤنٹ", another_platform: "دوسرا پلیٹ فارم استعمال کرتا ہوں", existing_account: "موجودہ اکاؤنٹ" },
  // l10n: needs native review
  uk: { new_account: "Новий обліковий запис", another_platform: "Користуюся іншою платформою", existing_account: "Наявний обліковий запис" },
  es: { new_account: "Cuenta nueva", another_platform: "Ya uso otra plataforma", existing_account: "Cuenta existente" },
  "pt-BR": { new_account: "Conta nova", another_platform: "Já uso outra plataforma", existing_account: "Conta existente" },
  fr: { new_account: "Nouveau compte", another_platform: "J'utilise déjà une autre plateforme", existing_account: "Compte existant" },
  de: { new_account: "Neues Konto", another_platform: "Ich nutze bereits eine andere Plattform", existing_account: "Bestehendes Konto" },
  "zh-Hant": { new_account: "第一次開戶", another_platform: "已使用其他平台", existing_account: "既有帳戶" },
  ja: { new_account: "初めての口座", another_platform: "他サービスを利用中", existing_account: "既存口座" },
  ko: { new_account: "처음 계정", another_platform: "다른 플랫폼 이용 중", existing_account: "기존 계정" },
  tr: { new_account: "İlk hesap", another_platform: "Başka platform kullanıyorum", existing_account: "Mevcut hesap" },
  ru: { new_account: "Новый аккаунт", another_platform: "Уже использую другую платформу", existing_account: "Существующий аккаунт" },
  ar: { new_account: "حساب جديد", another_platform: "أستخدم منصة أخرى", existing_account: "حساب قائم" },
  vi: { new_account: "Tài khoản mới", another_platform: "Đang dùng nền tảng khác", existing_account: "Đã có tài khoản" },
  id: { new_account: "Akun baru", another_platform: "Sudah memakai platform lain", existing_account: "Akun yang sudah ada" },
  it: { new_account: "Nuovo account", another_platform: "Uso già un'altra piattaforma", existing_account: "Account esistente" },
};

const MARKET_LABELS = {
  ja: {
    JP: "日本",
    KR: "韓国",
    TR: "トルコ",
    US: "米国",
    EU: "欧州連合",
    UK: "英国",
    SG: "シンガポール",
    HK: "香港",
    BR: "ブラジル",
    MX: "メキシコ",
    TW: "台湾",
    ID: "インドネシア",
  },
  ko: {
    JP: "일본",
    KR: "대한민국",
    TR: "튀르키예",
    US: "미국",
    EU: "유럽연합",
    UK: "영국",
    SG: "싱가포르",
    HK: "홍콩",
    BR: "브라질",
    MX: "멕시코",
    TW: "대만",
    ID: "인도네시아",
  },
  tr: {
    JP: "Japonya",
    KR: "Güney Kore",
    TR: "Türkiye",
    US: "ABD",
    EU: "Avrupa Birliği",
    UK: "Birleşik Krallık",
    SG: "Singapur",
    HK: "Hong Kong",
    BR: "Brezilya",
    MX: "Meksika",
    TW: "Tayvan",
    ID: "Endonezya",
  },
};

const CANDIDATE_NOTE_COPY = {
  // l10n: needs native review
  ur: { paused: "ماخذ کے سیاق کا جائزہ باقی ہے؛ اسے براہ راست رجسٹریشن راستہ نہ سمجھیں۔", researchable: "ماخذ کے ساتھ تحقیقی امیدوار؛ اکاؤنٹ کا نتیجہ تصدیق شدہ نہیں۔", fundingName: (currency) => `${currency} فنڈنگ راستہ`, fundingNote: (funding) => `${funding} کی جانچ سرکاری لاگ ان اکاؤنٹ میں کریں۔` },
  // l10n: needs native review
  uk: { paused: "Контекст джерела призупинено для перевірки; це не прямий шлях реєстрації.", researchable: "Кандидат для дослідження з джерелами; результат облікового запису не підтверджено.", fundingName: (currency) => `Маршрут поповнення ${currency}`, fundingNote: (funding) => `${funding} слід перевірити в офіційному обліковому записі після входу.` },
  en: {
    paused: "Stop-and-review source context; do not present as a direct handoff.",
    researchable: "Source-linked research candidate; account outcome remains unconfirmed.",
    fundingName: (currency) => `${currency} funding route`,
    fundingNote: (funding) => `${funding} must be checked in the official logged-in account flow.`,
  },
  es: {
    paused: "Contexto de fuente en pausa y revisión; no lo presentes como una ruta directa de registro.",
    researchable: "Candidato de investigación con fuente; el resultado de la cuenta sigue sin confirmarse.",
    fundingName: (currency) => `Ruta de financiación ${currency}`,
    fundingNote: (funding) => `${funding} debe verificarse en el flujo oficial de la cuenta con sesión iniciada.`,
  },
  "pt-BR": {
    paused: "Contexto de fonte pausado para revisão; não apresente como rota direta de cadastro.",
    researchable: "Candidato de pesquisa com fonte; o resultado da conta continua não confirmado.",
    fundingName: (currency) => `Rota de depósito ${currency}`,
    fundingNote: (funding) => `${funding} deve ser verificado no fluxo oficial da conta logada.`,
  },
  fr: {
    paused: "Contexte source en pause pour vérification; ne pas présenter comme route d'inscription directe.",
    researchable: "Candidat de recherche lié à une source; le résultat du compte reste non confirmé.",
    fundingName: (currency) => `Route de dépôt ${currency}`,
    fundingNote: (funding) => `${funding} doit être vérifié dans le parcours officiel du compte connecté.`,
  },
  de: {
    paused: "Quellenkontext pausiert zur Prüfung; nicht als direkte Registrierungsroute darstellen.",
    researchable: "Quellengebundener Recherchekandidat; das Kontoergebnis bleibt unbestätigt.",
    fundingName: (currency) => `${currency}-Einzahlungsweg`,
    fundingNote: (funding) => `${funding} muss im offiziellen eingeloggten Kontofluss geprüft werden.`,
  },
  "zh-Hant": {
    paused: "此來源需要暫停並複核；不要作為直接開戶導流。",
    researchable: "有來源連結的研究候選；帳戶結果仍未確認。",
    fundingName: (currency) => `${currency} 入金路徑`,
    fundingNote: (funding) => `${funding} 必須在官方登入帳戶流程中確認。`,
  },
  id: {
    paused: "Konteks sumber dijeda untuk ditinjau ulang; jangan tampilkan sebagai jalur pendaftaran langsung.",
    researchable: "Kandidat riset bertaut sumber; hasil akun tetap belum dikonfirmasi.",
    fundingName: (currency) => `Jalur pendanaan ${currency}`,
    fundingNote: (funding) => `${funding} harus dicek di alur akun resmi yang sudah login.`,
  },
  ja: {
    paused: "停止して確認する情報源です。直接登録の導線として扱わないでください。",
    researchable: "情報源に紐づく調査候補です。口座結果は未確認です。",
    fundingName: (currency) => `${currency} の入金経路`,
    fundingNote: (funding) => `${funding} は公式ログイン後の口座画面で確認してください。`,
  },
  ko: {
    paused: "중지 후 재검토가 필요한 출처 맥락입니다. 직접 가입 경로로 표시하지 마세요.",
    researchable: "출처가 연결된 리서치 후보입니다. 계정 결과는 아직 확인되지 않았습니다.",
    fundingName: (currency) => `${currency} 입금 경로`,
    fundingNote: (funding) => `${funding}는 공식 로그인 계정 화면에서 확인해야 합니다.`,
  },
  tr: {
    paused: "Durdurup inceleme gerektiren kaynak bağlamı; doğrudan kayıt yönlendirmesi olarak sunmayın.",
    researchable: "Kaynak bağlantılı araştırma adayı; hesap sonucu doğrulanmış değildir.",
    fundingName: (currency) => `${currency} fonlama yolu`,
    fundingNote: (funding) => `${funding} resmi giriş yapılmış hesap akışında kontrol edilmelidir.`,
  },
  ru: {
    paused: "Источник поставлен на проверку; не показывайте как прямой путь регистрации.",
    researchable: "Кандидат исследования с привязкой к источнику; результат аккаунта не подтвержден.",
    fundingName: (currency) => `Маршрут пополнения ${currency}`,
    fundingNote: (funding) => `${funding} нужно проверить в официальном аккаунте после входа.`,
  },
  ar: {
    paused: "سياق المصدر متوقف للمراجعة؛ لا تعرضه كمسار تسجيل مباشر.",
    researchable: "مرشح بحث مرتبط بمصدر؛ نتيجة الحساب غير مؤكدة.",
    fundingName: (currency) => `مسار إيداع ${currency}`,
    fundingNote: (funding) => `يجب التحقق من ${funding} داخل مسار الحساب الرسمي بعد تسجيل الدخول.`,
  },
  vi: {
    paused: "Ngữ cảnh nguồn cần dừng lại và rà soát; không dùng làm đường đăng ký trực tiếp.",
    researchable: "Ứng viên nghiên cứu có nguồn; kết quả tài khoản vẫn chưa được xác nhận.",
    fundingName: (currency) => `Đường nạp ${currency}`,
    fundingNote: (funding) => `${funding} phải được kiểm tra trong tài khoản chính thức sau khi đăng nhập.`,
  },
  it: {
    paused: "Contesto fonte in pausa per revisione; non presentarlo come percorso diretto di registrazione.",
    researchable: "Candidato di ricerca collegato a fonte; l'esito dell'account resta non confermato.",
    fundingName: (currency) => `Percorso di deposito ${currency}`,
    fundingNote: (funding) => `${funding} deve essere verificato nel flusso ufficiale dell'account dopo il login.`,
  },
};

const FUNDING_NOTE_VALUE_COPY = {
  ja: {
    "JPY deposit": "JPY 入金",
    "registered bank account in user's name": "本人名義の登録銀行口座",
    "crypto transfer route pending account confirmation": "口座確認が必要な暗号資産転送",
  },
  ko: {
    "KRW deposit and withdrawal": "KRW 입출금",
    "real-name bank account where shown": "표시되는 경우 실명 은행계좌",
    "crypto transfer route pending account confirmation": "계정 확인이 필요한 암호화폐 전송",
  },
  tr: {
    "TRY bank transfer": "TRY banka transferi",
    "matching bank account where shown": "gösterildiğinde eşleşen banka hesabı",
    "crypto transfer route pending account confirmation": "hesap onayı gereken kripto transfer rotası",
  },
};

function localizedFundingNoteValue(locale, value) {
  const key = locale === "pt-BR" ? locale : String(locale || "").split("-")[0];
  return FUNDING_NOTE_VALUE_COPY[locale]?.[value] || FUNDING_NOTE_VALUE_COPY[key]?.[value] || value;
}

const PLATFORM_PATTERNS = [
  { pattern: /Binance/i, name: "Binance", slug: "binance" },
  { pattern: /\bOKX\b/i, name: "OKX", slug: "okx" },
  { pattern: /Coinbase/i, name: "Coinbase", slug: "coinbase" },
  { pattern: /Kraken/i, name: "Kraken", slug: "kraken" },
  { pattern: /HashKey/i, name: "HashKey", slug: "hashkey" },
  { pattern: /\bOSL\b/i, name: "OSL", slug: null },
  { pattern: /Upbit/i, name: "Upbit", slug: null },
  { pattern: /bitFlyer/i, name: "bitFlyer", slug: null },
  { pattern: /Independent Reserve/i, name: "Independent Reserve", slug: null },
  { pattern: /Paribu/i, name: "Paribu", slug: null },
  { pattern: /Bitget/i, name: "Bitget", slug: "bitget" },
];

export function regionalShortlistCopy(locale = "en") {
  const key = locale === "pt-BR" ? locale : String(locale || "").split("-")[0];
  return STATE_COPY[locale] || STATE_COPY[key] || STATE_COPY.en;
}

function localizedOptionLabel(option, locale, dictionary) {
  const key = locale === "pt-BR" ? locale : String(locale || "").split("-")[0];
  return dictionary[locale]?.[option.value] || dictionary[key]?.[option.value] || option.label;
}

export function regionalShortlistProductOptions(locale = "en") {
  return REGIONAL_SHORTLIST_PRODUCTS.map((option) => ({ ...option, label: localizedOptionLabel(option, locale, PRODUCT_LABELS) }));
}

export function regionalShortlistAccountStageOptions(locale = "en") {
  return REGIONAL_SHORTLIST_ACCOUNT_STAGES.map((option) => ({ ...option, label: localizedOptionLabel(option, locale, ACCOUNT_STAGE_LABELS) }));
}

export function regionalShortlistMarketOptions(locale = "en") {
  const key = locale === "pt-BR" ? locale : String(locale || "").split("-")[0];
  return REGIONAL_FUNDING_VERIFICATION_MATRIX.map((row) => ({
    value: row.market,
    label: `${MARKET_LABELS[locale]?.[row.market] || MARKET_LABELS[key]?.[row.market] || row.marketName} · ${row.fiatCurrency}`,
  }));
}

function normalizeMarket(value) {
  return String(value || "").trim().toUpperCase();
}

function platformFromSource(source) {
  return PLATFORM_PATTERNS.find((entry) => entry.pattern.test(`${source?.label || ""} ${source?.url || ""}`)) || null;
}

function statusForSource(source, market) {
  const text = `${source?.label || ""} ${source?.url || ""}`;
  if (market === "TR" && /Bitget Teknoloji|Bitget/i.test(text)) return REGIONAL_SHORTLIST_STATES.PAUSED;
  return REGIONAL_SHORTLIST_STATES.RESEARCHABLE;
}

function selectedFunding(row, funding) {
  if (!row?.paymentRails?.length) return "";
  return row.paymentRails.includes(funding) ? funding : row.paymentRails[0];
}

function candidateCopy(locale) {
  const key = locale === "pt-BR" ? locale : String(locale || "").split("-")[0];
  return CANDIDATE_NOTE_COPY[locale] || CANDIDATE_NOTE_COPY[key] || CANDIDATE_NOTE_COPY.en;
}

function productComparePair(product, candidates) {
  if (product === "perpetuals") return "hyperliquid-vs-dydx";
  if (product === "dex") return "uniswap-vs-jupiter";
  const slugs = candidates
    .filter((candidate) => candidate.status !== REGIONAL_SHORTLIST_STATES.PAUSED && candidate.slug)
    .map((candidate) => candidate.slug);
  return slugs.length >= 2 ? `${slugs[0]}-vs-${slugs[1]}` : "";
}

function withTelegramContext(href, context) {
  const joiner = href.includes("?") ? "&" : "?";
  const params = new URLSearchParams();
  params.set("account_stage", context.accountStage);
  if (context.funding) params.set("funding", context.funding);
  return `${href}${joiner}${params.toString()}`;
}

export function buildRegionalShortlist({
  market = "MX",
  locale = "en",
  product = "spot",
  funding = "",
  accountStage = "new_account",
} = {}) {
  const targetMarket = normalizeMarket(market);
  const notes = candidateCopy(locale);
  const row = regionalFundingRowsForMarkets([targetMarket])[0] || null;
  const resolvedFunding = selectedFunding(row, funding);
  const platformCandidates = (row?.officialSources || [])
    .filter((source) => /platform/i.test(source.role) || platformFromSource(source))
    .map((source) => {
      const platform = platformFromSource(source);
      if (!platform) return null;
      const status = statusForSource(source, targetMarket);
      return {
        id: `${targetMarket}-${platform.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: platform.name,
        slug: platform.slug,
        market: targetMarket,
        status,
        sourceLabel: source.label,
        sourceUrl: source.url,
        note: status === REGIONAL_SHORTLIST_STATES.PAUSED
          ? notes.paused
          : notes.researchable,
        directHref: status !== REGIONAL_SHORTLIST_STATES.PAUSED && platform.slug
          ? regionalToolHref({ path: `/exchanges/${platform.slug}`, market: targetMarket, locale, product, accountStage, funding: resolvedFunding })
          : "",
      };
    })
    .filter(Boolean);

  const dedupedPlatforms = Array.from(new Map(platformCandidates.map((candidate) => [candidate.id, candidate])).values());
  const stopReviewText = [
    ...(row?.accountScreenChecks || []),
    ...(row?.unknowns || []),
    row?.cannotPromise,
  ].join(" ");
  if (targetMarket === "TR" && /Bitget Teknoloji|Bitget/i.test(stopReviewText) && !dedupedPlatforms.some((candidate) => candidate.name === "Bitget")) {
    dedupedPlatforms.push({
      id: "TR-bitget-stop-review",
      name: "Bitget",
      slug: "bitget",
      market: targetMarket,
      status: REGIONAL_SHORTLIST_STATES.PAUSED,
      sourceLabel: "SPK operation and liquidation list context",
      sourceUrl: row?.officialSources?.find((source) => /liquidation|tasfiye/i.test(`${source.label} ${source.url}`))?.url || "",
      note: notes.paused,
      directHref: "",
    });
  }
  const fundingCandidate = row ? {
    id: `${targetMarket}-funding-${resolvedFunding || row.fiatCurrency}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    name: notes.fundingName(row.fiatCurrency),
    slug: null,
    market: targetMarket,
    status: REGIONAL_SHORTLIST_STATES.ACCOUNT_CONFIRM,
    sourceLabel: row.officialSources[0]?.label || row.marketName,
    sourceUrl: row.officialSources[0]?.url || "",
    note: notes.fundingNote(localizedFundingNoteValue(locale, resolvedFunding || row.fiatCurrency)),
    directHref: "",
  } : null;

  const candidates = [...dedupedPlatforms, fundingCandidate].filter(Boolean);
  const pair = productComparePair(product, candidates);
  const compareHref = pair
    ? regionalToolHref({ path: `/compare/${pair}`, market: targetMarket, locale, product, accountStage, funding: resolvedFunding })
    : regionalDirectoryHref({ market: targetMarket, locale, stage: accountStage, product, funding: resolvedFunding });
  const telegramHref = withTelegramContext(getTelegramDeepLink({
    action: pair ? "compare" : "partner_desk",
    ...(pair ? { pair } : {}),
    market: targetMarket,
    locale,
    product,
    campaign: `${targetMarket.toLowerCase()}-regional-shortlist-${accountStage}`,
  }), { accountStage, funding: resolvedFunding });

  return {
    market: targetMarket,
    product,
    funding: resolvedFunding,
    accountStage,
    row,
    candidates,
    pair,
    compareHref,
    telegramHref,
  };
}

import { exchangeResearch } from "./exchange-research.js";

// Editorial fit judgments, derived from the dated research below. These are not
// platform endorsements, new source checks, availability claims, region permissions, or offers.
const tr = (en, hans, hant) => ({ en, "zh-Hans": hans, "zh-Hant": hant });
const supportedDecisionLocales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"];
const localeText = (values) => {
  const missing = supportedDecisionLocales.filter((locale) => !values[locale]);
  if (missing.length) throw new Error(`VENUE_DECISION_LOCALE_MISSING:${missing.join(",")}`);
  return values;
};
const entry = (fit, why, avoid, factIndexes, options = {}) => ({ fit, why, avoid, factIndexes, ...options });
const reviewedEntry = (fit, why, avoid, factIndexes) => entry(fit, why, avoid, factIndexes, { editorialReviewed: true });
export const venueDecisionContent = {
  binance: reviewedEntry(
    localeText({
      en: "Choose Binance when you need a broad account exchange with spot, margin, fiat, P2P and product-specific fee pages checked before signup.",
      "zh-Hans": "需要在开户前核对现货、杠杆、法币、P2P 和分产品费率时，可把 Binance 作为综合账户型交易所候选。",
      "zh-Hant": "需要在開戶前核對現貨、槓桿、法幣、P2P 和分產品費率時，可把 Binance 作為綜合帳戶型交易所候選。",
      es: "Considera Binance si necesitas una cuenta amplia con spot, margen, fiat, P2P y páginas de comisiones por producto antes de registrarte.",
      "pt-BR": "Considere a Binance quando precisar comparar uma conta ampla com spot, margem, fiat, P2P e páginas de taxas por produto antes do cadastro.",
      fr: "Considérez Binance si vous devez vérifier spot, marge, fiat, P2P et frais par produit avant l'inscription.",
      de: "Nutze Binance als Kandidat, wenn du Spot, Margin, Fiat, P2P und produktbezogene Gebühren vor der Anmeldung prüfen willst.",
      ja: "登録前にスポット、マージン、法定通貨、P2P、商品別手数料を確認したい場合、Binance は総合口座型の候補になります。",
      ko: "가입 전에 현물, 마진, 법정화폐, P2P, 상품별 수수료를 확인해야 한다면 Binance를 종합 계정형 후보로 볼 수 있습니다.",
      // l10n: needs native review
      ur: "Binance کو تب منتخب کریں جب رجسٹریشن سے پہلے اسپاٹ، مارجن، فیاٹ، P2P اور ہر پروڈکٹ کی فیس جانچنے کے لیے جامع اکاؤنٹ والا ایکسچینج درکار ہو۔",
      // l10n: needs native review
      uk: "Розгляньте Binance, якщо перед реєстрацією потрібна комплексна біржа зі спотом, маржею, фіатом, P2P і комісіями за окремими продуктами.",
      ar: "اختر Binance كمرشح حساب شامل عندما تحتاج إلى فحص الفوري والهامش والعملات التقليدية وP2P ورسوم كل منتج قبل التسجيل.",
      tr: "Kayıttan önce spot, marjin, fiat, P2P ve ürüne göre ücret sayfalarını kontrol etmek istiyorsan Binance geniş kapsamlı bir hesap borsası adayıdır.",
      ru: "Рассматривайте Binance, если перед регистрацией нужно проверить спот, маржу, фиат, P2P и комиссии по отдельным продуктам.",
      id: "Pertimbangkan Binance bila perlu memeriksa spot, margin, fiat, P2P, dan biaya per produk sebelum mendaftar.",
      vi: "Hãy cân nhắc Binance khi cần kiểm tra spot, margin, fiat, P2P và phí theo từng sản phẩm trước khi đăng ký.",
      it: "Valuta Binance se prima della registrazione devi controllare spot, margin, fiat, P2P e commissioni per prodotto.",
    }),
    localeText({
      en: "The official sources separate fee tiers, BNB balance rules, identity verification and announcement checks, so the signup path can be reviewed in one place.",
      "zh-Hans": "官方来源把费率阶梯、BNB 持仓规则、身份验证和公告核对分开列明，适合集中做开户前检查。",
      "zh-Hant": "官方來源把費率階梯、BNB 持倉規則、身份驗證和公告核對分開列明，適合集中做開戶前檢查。",
      es: "Sus fuentes oficiales separan niveles de comisión, reglas de saldo BNB, verificación de identidad y anuncios, lo que permite revisar la ruta de alta en un solo lugar.",
      "pt-BR": "As fontes oficiais separam níveis de taxa, regras de saldo BNB, verificação de identidade e anúncios, facilitando uma checagem pré-cadastro.",
      fr: "Les sources officielles séparent niveaux de frais, règles de solde BNB, identité et annonces, ce qui facilite l'examen avant inscription.",
      de: "Die offiziellen Quellen trennen Gebührenstufen, BNB-Bestandsregeln, Identitätsprüfung und Ankündigungen, sodass die Anmeldung gebündelt geprüft werden kann.",
      ja: "公式情報は手数料階層、BNB 残高条件、本人確認、告知確認を分けているため、登録前の確認を一か所で進めやすい構成です。",
      ko: "공식 자료가 수수료 등급, BNB 보유 조건, 신원 인증, 공지 확인을 분리해 가입 전 점검을 한곳에서 하기 쉽습니다.",
      // l10n: needs native review
      ur: "سرکاری ماخذ فیس کی سطح، BNB بیلنس کے قواعد، شناخت کی تصدیق اور اعلانات کو الگ رکھتے ہیں، تاکہ رجسٹریشن کے راستے کا ایک جگہ جائزہ لیا جا سکے۔",
      // l10n: needs native review
      uk: "Офіційні джерела окремо описують рівні комісій, правила балансу BNB, перевірку особи й оголошення, тож шлях реєстрації можна перевірити в одному місці.",
      ar: "تفصل المصادر الرسمية مستويات الرسوم وقواعد رصيد BNB والتحقق من الهوية والإعلانات، لذلك يمكن مراجعة مسار التسجيل بوضوح.",
      tr: "Resmi kaynaklar ücret kademelerini, BNB bakiye kurallarını, kimlik doğrulamayı ve duyuruları ayırdığı için kayıt yolu tek yerde denetlenebilir.",
      ru: "Официальные источники разделяют уровни комиссий, правила баланса BNB, верификацию и объявления, поэтому путь регистрации удобно проверить вместе.",
      id: "Sumber resmi memisahkan tingkat biaya, aturan saldo BNB, verifikasi identitas, dan pengumuman sehingga alur pendaftaran mudah ditinjau.",
      vi: "Nguồn chính thức tách riêng bậc phí, quy tắc số dư BNB, xác minh danh tính và thông báo, nên có thể kiểm tra lộ trình đăng ký rõ ràng.",
      it: "Le fonti ufficiali separano livelli di commissione, regole sul saldo BNB, verifica identità e annunci, rendendo chiaro il controllo prima dell'iscrizione.",
    }),
    localeText({
      en: "Avoid treating it as universally available: identity verification, product access and regional rules still have to match the user's account.",
      "zh-Hans": "不要把它理解成全球无条件可用；身份验证、产品权限和地区规则仍要匹配具体账户。",
      "zh-Hant": "不要把它理解成全球無條件可用；身份驗證、產品權限和地區規則仍要匹配具體帳戶。",
      es: "No lo trates como disponible para todos: verificación, acceso a productos y reglas regionales deben coincidir con la cuenta del usuario.",
      "pt-BR": "Não trate como acesso universal: verificação, produtos e regras regionais ainda precisam bater com a conta do usuário.",
      fr: "Ne le présentez pas comme disponible partout : identité, accès produit et règles régionales doivent correspondre au compte.",
      de: "Nicht als weltweit bedingungslos verfügbar darstellen: Identität, Produktzugang und Regionenregeln müssen zum Konto passen.",
      ja: "無条件に全地域で使えるとは扱わないでください。本人確認、商品アクセス、地域ルールはアカウントごとに確認が必要です。",
      ko: "전 세계에서 무조건 이용 가능하다고 보지 마세요. 신원 인증, 상품 접근, 지역 규정은 계정별로 맞아야 합니다.",
      // l10n: needs native review
      ur: "اسے ہر جگہ دستیاب نہ سمجھیں: شناخت کی تصدیق، مصنوعات تک رسائی اور علاقائی قواعد صارف کے اکاؤنٹ کے مطابق ہونے چاہییں۔",
      // l10n: needs native review
      uk: "Не вважайте її доступною всюди: перевірка особи, доступ до продуктів і регіональні правила мають відповідати обліковому запису користувача.",
      ar: "لا تعتبره متاحًا عالميًا بلا شروط؛ فالتحقق والمنتجات والقواعد الإقليمية يجب أن تطابق حساب المستخدم.",
      tr: "Her yerde koşulsuz erişilebilir sayma; kimlik doğrulama, ürün erişimi ve bölge kuralları kullanıcının hesabıyla uyumlu olmalı.",
      ru: "Не считайте доступ универсальным: верификация, продукты и региональные правила должны соответствовать аккаунту пользователя.",
      id: "Jangan anggap selalu tersedia: verifikasi, akses produk, dan aturan wilayah tetap harus sesuai dengan akun pengguna.",
      vi: "Không xem đây là lựa chọn luôn khả dụng toàn cầu: xác minh, quyền sản phẩm và quy định khu vực vẫn phải khớp với tài khoản.",
      it: "Non considerarlo disponibile ovunque: verifica, accesso ai prodotti e regole regionali devono corrispondere all'account.",
    }), [0, 1, 2, 3]),
  coinbase: entry(
    tr("Nasdaq-listed regulated exchange with top-tier asset security, ideal for Western fiat rails and institutional-grade custody.", "纳斯达克合规上市背景，资金安全绝对顶级，适合欧美法币出入金与机构级托管。", "那斯達克合規上市背景，資金安全絕對頂級，適合歐美法幣出入金與機構級託管。"),
    tr("Strictly supervised by US regulators with FDIC-insured USD cash balances; serves as the native ecosystem hub for Base L2.", "受美联储与监管机构严格监督，美元存款享 FDIC 保障，Base 链原生核心枢纽。", "受美聯儲與監管機構嚴格監督，美元存款享 FDIC 保障，Base 鏈原生核心樞紐。"),
    tr("Not suitable for high-frequency traders seeking lowest fees; standard retail taker fees are high, and U.S. derivatives access is subject to licensed-region rules.", "不适合追求最低费率的高频交易用户；普通现货吃单费率较高，美国衍生品权限还受许可地区规则限制。", "不適合追求最低費率的高頻交易用戶；普通現貨吃單費率較高，美國衍生品權限還受許可地區規則限制。"), [0, 1, 2, 3]),
  bybit: reviewedEntry(
    localeText({
      en: "Choose Bybit when derivatives, copy-trading checks and product-specific fee tables matter more than a simple spot-only account.",
      "zh-Hans": "如果重点是衍生品、跟单前检查和分产品费率表，而不是单纯现货账户，可把 Bybit 纳入候选。",
      "zh-Hant": "如果重點是衍生品、跟單前檢查和分產品費率表，而不是單純現貨帳戶，可把 Bybit 納入候選。",
      es: "Considera Bybit cuando derivados, revisión de copy trading y comisiones por producto pesen más que una cuenta solo spot.",
      "pt-BR": "Considere a Bybit quando derivativos, checagem de copy trading e tabelas de taxa por produto forem mais importantes que uma conta apenas spot.",
      fr: "Considérez Bybit si dérivés, contrôle du copy trading et frais par produit comptent plus qu'un simple compte spot.",
      de: "Bybit passt, wenn Derivate, Copy-Trading-Prüfung und produktbezogene Gebühren wichtiger sind als ein reines Spot-Konto.",
      ja: "デリバティブ、コピー取引の確認、商品別手数料表を重視するなら、単純なスポット口座より Bybit を候補にできます。",
      ko: "파생상품, 카피 트레이딩 확인, 상품별 수수료표가 단순 현물 계정보다 중요하다면 Bybit를 후보로 볼 수 있습니다.",
      // l10n: needs native review
      ur: "Bybit کو تب منتخب کریں جب مشتقات، کاپی ٹریڈنگ کی جانچ اور ہر پروڈکٹ کی فیس سادہ اسپاٹ اکاؤنٹ سے زیادہ اہم ہوں۔",
      // l10n: needs native review
      uk: "Розгляньте Bybit, якщо деривативи, перевірка копітрейдингу й комісії за продуктами важливіші за простий спотовий обліковий запис.",
      ar: "اختر Bybit عندما تكون المشتقات وفحص نسخ التداول وجداول الرسوم حسب المنتج أهم من حساب فوري بسيط.",
      tr: "Türevler, copy trading kontrolü ve ürüne göre ücret tabloları basit spot hesaptan daha önemliyse Bybit adaydır.",
      ru: "Рассматривайте Bybit, если деривативы, проверка копитрейдинга и комиссии по продуктам важнее простого спот-счета.",
      id: "Pertimbangkan Bybit bila derivatif, pengecekan copy trading, dan biaya per produk lebih penting daripada akun spot saja.",
      vi: "Hãy cân nhắc Bybit khi phái sinh, kiểm tra copy trading và bảng phí theo sản phẩm quan trọng hơn tài khoản spot đơn giản.",
      it: "Valuta Bybit se derivati, controlli sul copy trading e commissioni per prodotto contano più di un semplice conto spot.",
    }),
    localeText({
      en: "The official KYC FAQ says Standard identity verification is mandatory, and the fee source separates maker and taker roles by product type.",
      "zh-Hans": "官方 KYC FAQ 说明 Standard 身份验证为必需，费用来源也按产品类型区分 maker 与 taker。",
      "zh-Hant": "官方 KYC FAQ 說明 Standard 身分驗證為必需，費用來源也按產品類型區分 maker 與 taker。",
      es: "La FAQ oficial de KYC exige verificación Standard, y la fuente de comisiones separa maker y taker por tipo de producto.",
      "pt-BR": "O FAQ oficial de KYC exige verificação Standard, e a fonte de taxas separa maker e taker por tipo de produto.",
      fr: "La FAQ KYC officielle exige la vérification Standard, et la source de frais distingue maker et taker par produit.",
      de: "Die offizielle KYC-FAQ verlangt Standard-Verifizierung, und die Gebührenquelle trennt Maker/Taker nach Produkttyp.",
      ja: "公式 KYC FAQ は Standard 本人確認を必須とし、手数料情報も商品タイプごとに maker/taker を分けています。",
      ko: "공식 KYC FAQ는 Standard 신원 인증을 필수로 두며, 수수료 자료도 상품 유형별 maker/taker를 구분합니다.",
      // l10n: needs native review
      ur: "سرکاری KYC سوالات کے مطابق Standard شناختی تصدیق لازمی ہے، اور فیس کا ماخذ ہر مصنوعات کے میکر اور ٹیکر کو الگ کرتا ہے۔",
      // l10n: needs native review
      uk: "Офіційні відповіді KYC зазначають обов’язкову перевірку особи Standard, а джерело комісій розділяє ролі мейкера й тейкера за типом продукту.",
      ar: "توضح أسئلة KYC الرسمية أن التحقق Standard إلزامي، كما تفصل صفحة الرسوم maker وtaker حسب نوع المنتج.",
      tr: "Resmi KYC SSS Standard kimlik doğrulamayı zorunlu kılar; ücret kaynağı da maker/taker rollerini ürün tipine göre ayırır.",
      ru: "Официальный FAQ KYC требует Standard-верификацию, а источник комиссий разделяет maker/taker по типам продуктов.",
      id: "FAQ KYC resmi mewajibkan verifikasi Standard, dan sumber biaya memisahkan maker/taker menurut jenis produk.",
      vi: "FAQ KYC chính thức yêu cầu xác minh Standard, và nguồn phí tách maker/taker theo loại sản phẩm.",
      it: "La FAQ KYC ufficiale richiede la verifica Standard, e la fonte commissioni separa maker e taker per tipo di prodotto.",
    }),
    localeText({
      en: "Avoid assuming anonymous access, universal copy trading, or local derivative eligibility; all depend on account, product and region checks.",
      "zh-Hans": "不要假定可匿名使用、跟单全球可用或本地一定能开衍生品；都要按账户、产品和地区核对。",
      "zh-Hant": "不要假定可匿名使用、跟單全球可用或本地一定能開衍生品；都要按帳戶、產品和地區核對。",
      es: "No presupongas acceso anónimo, copy trading universal ni elegibilidad local para derivados; depende de cuenta, producto y región.",
      "pt-BR": "Não presuma acesso anônimo, copy trading universal ou elegibilidade local para derivativos; tudo depende de conta, produto e região.",
      fr: "Ne supposez pas l'accès anonyme, le copy trading universel ou l'éligibilité locale aux dérivés ; tout dépend du compte, du produit et de la région.",
      de: "Keine anonyme Nutzung, globales Copy Trading oder lokale Derivateignung annehmen; alles hängt von Konto, Produkt und Region ab.",
      ja: "匿名利用、全地域でのコピー取引、地域別デリバティブ資格を前提にしないでください。口座、商品、地域で確認が必要です。",
      ko: "익명 접근, 전 세계 카피 트레이딩, 현지 파생상품 자격을 가정하지 마세요. 계정, 상품, 지역 확인이 필요합니다.",
      // l10n: needs native review
      ur: "گمنام رسائی، ہر جگہ کاپی ٹریڈنگ یا مقامی مشتقات کی اہلیت فرض نہ کریں؛ سب اکاؤنٹ، مصنوعات اور علاقائی جانچ پر منحصر ہیں۔",
      // l10n: needs native review
      uk: "Не припускайте анонімного доступу, універсального копітрейдингу чи місцевої доступності деривативів: усе залежить від облікового запису, продукту й регіону.",
      ar: "لا تفترض وصولًا مجهولًا أو نسخ تداول عالميًا أو أهلية مشتقات محلية؛ كل ذلك يعتمد على الحساب والمنتج والمنطقة.",
      tr: "Anonim erişim, evrensel copy trading veya yerel türev uygunluğu varsayma; hesap, ürün ve bölge kontrolü gerekir.",
      ru: "Не предполагайте анонимный доступ, универсальный копитрейдинг или местную доступность деривативов; нужны проверки аккаунта, продукта и региона.",
      id: "Jangan anggap akses anonim, copy trading universal, atau kelayakan derivatif lokal; semuanya bergantung pada akun, produk, dan wilayah.",
      vi: "Không giả định truy cập ẩn danh, copy trading toàn cầu hay đủ điều kiện phái sinh tại địa phương; cần kiểm tra tài khoản, sản phẩm và khu vực.",
      it: "Non presumere accesso anonimo, copy trading universale o idoneità locale ai derivati; dipende da account, prodotto e regione.",
    }), [0, 1, 2, 3]),
  bitget: reviewedEntry(
    localeText({
      en: "Choose Bitget when the decision turns on spot and futures fee mechanics plus copy-trading style workflows that must be checked before signup.",
      "zh-Hans": "如果决策重点是现货/合约费用机制，以及开户前必须核对的跟单式使用流程，可把 Bitget 纳入候选。",
      "zh-Hant": "如果決策重點是現貨/合約費用機制，以及開戶前必須核對的跟單式使用流程，可把 Bitget 納入候選。",
      es: "Considera Bitget cuando la decisión dependa de mecánicas de fees spot/futuros y flujos tipo copy trading que debes revisar antes del alta.",
      "pt-BR": "Considere a Bitget quando a decisão depender de taxas spot/futuros e fluxos de copy trading que precisam ser checados antes do cadastro.",
      fr: "Considérez Bitget si la décision dépend des frais spot/futures et de parcours de copy trading à vérifier avant inscription.",
      de: "Bitget passt, wenn Spot-/Futures-Gebührenmechanik und Copy-Trading-ähnliche Abläufe vor der Anmeldung geprüft werden müssen.",
      ja: "スポット/先物の手数料構造と、登録前に確認すべきコピー取引型の流れを重視する場合、Bitget を候補にできます。",
      ko: "현물/선물 수수료 구조와 가입 전 확인해야 하는 카피 트레이딩식 흐름이 중요하다면 Bitget를 후보로 볼 수 있습니다.",
      // l10n: needs native review
      ur: "Bitget کو تب منتخب کریں جب فیصلہ اسپاٹ اور فیوچرز کی فیس اور کاپی ٹریڈنگ کے ان طریقوں پر منحصر ہو جنہیں رجسٹریشن سے پہلے جانچنا ہے۔",
      // l10n: needs native review
      uk: "Розгляньте Bitget, якщо рішення залежить від спотових і ф’ючерсних комісій та процесів копітрейдингу, які слід перевірити перед реєстрацією.",
      ar: "اختر Bitget عندما يعتمد القرار على آليات رسوم الفوري والعقود وتدفقات نسخ التداول التي يجب فحصها قبل التسجيل.",
      tr: "Karar spot/futures ücret mekaniği ve kayıt öncesi kontrol edilmesi gereken copy trading akışlarına bağlıysa Bitget adaydır.",
      ru: "Рассматривайте Bitget, если решение зависит от механики спот/фьючерсных комиссий и сценариев копитрейдинга до регистрации.",
      id: "Pertimbangkan Bitget bila keputusan bergantung pada mekanisme biaya spot/futures dan alur copy trading yang harus dicek sebelum mendaftar.",
      vi: "Hãy cân nhắc Bitget khi quyết định phụ thuộc vào cơ chế phí spot/futures và quy trình copy trading cần kiểm tra trước đăng ký.",
      it: "Valuta Bitget se la scelta dipende da commissioni spot/futures e flussi di copy trading da verificare prima dell'iscrizione.",
    }),
    localeText({
      en: "Its official pages split spot maker/taker fees, futures transaction and funding fees, identity flow and announcement checks into separate review points.",
      "zh-Hans": "官方页面把现货 maker/taker、合约交易费与资金费、身份验证流程和公告核对拆成不同检查点。",
      "zh-Hant": "官方頁面把現貨 maker/taker、合約交易費與資金費、身分驗證流程和公告核對拆成不同檢查點。",
      es: "Sus páginas oficiales separan maker/taker spot, fees y funding de futuros, identidad y anuncios como puntos de revisión distintos.",
      "pt-BR": "As páginas oficiais separam maker/taker spot, taxas e funding de futuros, identidade e anúncios em pontos de revisão distintos.",
      fr: "Les pages officielles séparent maker/taker spot, frais et funding futures, identité et annonces en points de contrôle distincts.",
      de: "Die offiziellen Seiten trennen Spot Maker/Taker, Futures-Transaktions- und Funding-Gebühren, Identitätsfluss und Ankündigungen.",
      ja: "公式ページはスポットの maker/taker、先物取引手数料と資金調達費、本人確認、告知確認を別々の確認点に分けています。",
      ko: "공식 페이지는 현물 maker/taker, 선물 거래 수수료와 펀딩, 신원 인증, 공지 확인을 별도 점검점으로 나눕니다.",
      // l10n: needs native review
      ur: "سرکاری صفحات اسپاٹ میکر/ٹیکر فیس، فیوچرز لین دین اور فنڈنگ فیس، شناخت اور اعلانات کو الگ جائزے کے نکات میں تقسیم کرتے ہیں۔",
      // l10n: needs native review
      uk: "Офіційні сторінки окремо описують спотові комісії мейкера/тейкера, ф’ючерсні й фінансувальні комісії, перевірку особи та оголошення.",
      ar: "تفصل الصفحات الرسمية رسوم maker/taker الفورية ورسوم معاملات العقود والتمويل ومسار الهوية والإعلانات كنقاط مراجعة منفصلة.",
      tr: "Resmi sayfalar spot maker/taker, futures işlem ve funding ücretleri, kimlik akışı ve duyuruları ayrı kontrol noktaları yapar.",
      ru: "Официальные страницы разделяют spot maker/taker, комиссии и funding фьючерсов, идентификацию и объявления на отдельные проверки.",
      id: "Halaman resmi memisahkan maker/taker spot, biaya transaksi dan funding futures, alur identitas, serta pengumuman sebagai titik tinjau.",
      vi: "Trang chính thức tách maker/taker spot, phí giao dịch và funding futures, xác minh danh tính và thông báo thành các điểm kiểm tra riêng.",
      it: "Le pagine ufficiali separano maker/taker spot, commissioni e funding futures, identità e annunci in punti di controllo distinti.",
    }),
    localeText({
      en: "Avoid relying on BGB discounts, rewards, copy availability or futures costs until the user's account terms and region are confirmed.",
      "zh-Hans": "不要在未确认账户条款和地区前依赖 BGB 折扣、奖励、跟单可用性或合约成本。",
      "zh-Hant": "不要在未確認帳戶條款和地區前依賴 BGB 折扣、獎勵、跟單可用性或合約成本。",
      es: "No dependas de descuentos BGB, recompensas, copy trading o costes de futuros hasta confirmar cuenta y región.",
      "pt-BR": "Não dependa de descontos BGB, recompensas, copy trading ou custos de futuros até confirmar termos da conta e região.",
      fr: "Ne dépendez pas des remises BGB, récompenses, copy trading ou coûts futures avant confirmation du compte et de la région.",
      de: "Verlasse dich nicht auf BGB-Rabatte, Rewards, Copy-Verfügbarkeit oder Futures-Kosten, bevor Konto und Region bestätigt sind.",
      ja: "アカウント条件と地域を確認するまで、BGB 割引、報酬、コピー取引の可否、先物コストを前提にしないでください。",
      ko: "계정 조건과 지역을 확인하기 전에는 BGB 할인, 보상, 카피 가능 여부, 선물 비용에 의존하지 마세요.",
      // l10n: needs native review
      ur: "صارف کے اکاؤنٹ کی شرائط اور علاقے کی تصدیق سے پہلے BGB رعایت، انعام، کاپی ٹریڈنگ کی دستیابی یا فیوچرز کی لاگت پر انحصار نہ کریں۔",
      // l10n: needs native review
      uk: "Не покладайтеся на знижки BGB, винагороди, доступність копітрейдингу чи вартість ф’ючерсів до підтвердження умов облікового запису й регіону.",
      ar: "لا تعتمد على خصومات BGB أو المكافآت أو توفر النسخ أو تكاليف العقود قبل تأكيد شروط الحساب والمنطقة.",
      tr: "Hesap şartları ve bölge doğrulanmadan BGB indirimleri, ödüller, copy erişimi veya futures maliyetlerine güvenme.",
      ru: "Не полагайтесь на скидки BGB, rewards, доступность копирования или стоимость фьючерсов до проверки условий аккаунта и региона.",
      id: "Jangan bergantung pada diskon BGB, reward, ketersediaan copy, atau biaya futures sebelum syarat akun dan wilayah dikonfirmasi.",
      vi: "Không dựa vào giảm giá BGB, phần thưởng, khả dụng copy hay chi phí futures cho đến khi xác nhận điều khoản tài khoản và khu vực.",
      it: "Non fare affidamento su sconti BGB, reward, disponibilità copy o costi futures finché account e regione non sono confermati.",
    }), [0, 1, 2, 3]),
  okx: reviewedEntry(
    localeText({
      en: "Choose OKX when you want one account path that also exposes Web3, DEX, bots, copy trading, Earn and proof-of-reserves review areas.",
      "zh-Hans": "如果想用一个账户路径同时核对 Web3、DEX、机器人、跟单、Earn 和储备证明，可把 OKX 纳入候选。",
      "zh-Hant": "如果想用一個帳戶路徑同時核對 Web3、DEX、機器人、跟單、Earn 和儲備證明，可把 OKX 納入候選。",
      es: "Considera OKX si quieres una ruta de cuenta que también muestre Web3, DEX, bots, copy trading, Earn y reservas.",
      "pt-BR": "Considere a OKX se quiser uma rota de conta que também exponha Web3, DEX, bots, copy trading, Earn e prova de reservas.",
      fr: "Considérez OKX si vous voulez un compte couvrant aussi Web3, DEX, bots, copy trading, Earn et réserves.",
      de: "OKX passt, wenn ein Konto auch Web3, DEX, Bots, Copy Trading, Earn und Reservenprüfung abdecken soll.",
      ja: "1 つの口座導線で Web3、DEX、ボット、コピー取引、Earn、準備金確認も見たい場合、OKX を候補にできます。",
      ko: "하나의 계정 경로에서 Web3, DEX, 봇, 카피 트레이딩, Earn, 준비금 확인까지 보려면 OKX를 후보로 볼 수 있습니다.",
      // l10n: needs native review
      ur: "OKX کو تب منتخب کریں جب اکاؤنٹ کے ساتھ Web3، DEX، بوٹس، کاپی ٹریڈنگ، Earn اور ذخائر کے ثبوت کی تحقیق بھی درکار ہو۔",
      // l10n: needs native review
      uk: "Розгляньте OKX, якщо разом з обліковим записом потрібно дослідити Web3, DEX, ботів, копітрейдинг, Earn і підтвердження резервів.",
      ar: "اختر OKX عندما تريد مسار حساب يعرض أيضًا Web3 وDEX والبوتات ونسخ التداول وEarn وإثبات الاحتياطيات.",
      tr: "Tek hesap yolu içinde Web3, DEX, botlar, copy trading, Earn ve rezerv kanıtı alanlarını görmek istiyorsan OKX adaydır.",
      ru: "Рассматривайте OKX, если нужен один путь аккаунта с Web3, DEX, ботами, копитрейдингом, Earn и проверкой резервов.",
      id: "Pertimbangkan OKX bila ingin satu jalur akun yang juga memuat Web3, DEX, bot, copy trading, Earn, dan bukti cadangan.",
      vi: "Hãy cân nhắc OKX nếu muốn một lộ trình tài khoản có cả Web3, DEX, bot, copy trading, Earn và bằng chứng dự trữ.",
      it: "Valuta OKX se vuoi un percorso account che includa anche Web3, DEX, bot, copy trading, Earn e prova delle riserve.",
    }),
    localeText({
      en: "The fee source separates spot, futures, options and other instruments, while the navigation distinguishes exchange and Web3-style choices.",
      "zh-Hans": "费用来源把现货、合约、期权和其他工具分开，导航也区分交易所与 Web3 式选择。",
      "zh-Hant": "費用來源把現貨、合約、期權和其他工具分開，導覽也區分交易所與 Web3 式選擇。",
      es: "La fuente de fees separa spot, futuros, opciones y otros instrumentos, y la navegación distingue exchange y opciones Web3.",
      "pt-BR": "A fonte de taxas separa spot, futuros, opções e outros instrumentos, enquanto a navegação distingue exchange e escolhas Web3.",
      fr: "La source de frais sépare spot, futures, options et autres instruments, tandis que la navigation distingue exchange et choix Web3.",
      de: "Die Gebührenquelle trennt Spot, Futures, Optionen und andere Instrumente; die Navigation unterscheidet Exchange- und Web3-Wege.",
      ja: "手数料情報はスポット、先物、オプション、その他商品を分け、ナビゲーションも取引所と Web3 型の選択を区別しています。",
      ko: "수수료 자료는 현물, 선물, 옵션, 기타 상품을 구분하고, 내비게이션은 거래소와 Web3식 선택지를 나눕니다.",
      // l10n: needs native review
      ur: "فیس کا ماخذ اسپاٹ، فیوچرز، آپشنز اور دیگر مصنوعات الگ کرتا ہے، جبکہ نیویگیشن ایکسچینج اور Web3 کے اختیارات میں فرق دکھاتی ہے۔",
      // l10n: needs native review
      uk: "Джерело комісій розділяє спот, ф’ючерси, опціони та інші інструменти, а навігація відрізняє біржові можливості від Web3.",
      ar: "تفصل صفحة الرسوم الفوري والعقود والخيارات وأدوات أخرى، كما يميز التنقل بين البورصة وخيارات Web3.",
      tr: "Ücret kaynağı spot, futures, opsiyon ve diğer araçları ayırır; navigasyon da borsa ve Web3 seçeneklerini ayırt eder.",
      ru: "Источник комиссий разделяет спот, фьючерсы, опционы и другие инструменты, а навигация различает биржу и Web3-направления.",
      id: "Sumber biaya memisahkan spot, futures, options, dan instrumen lain, sementara navigasi membedakan exchange dan pilihan Web3.",
      vi: "Nguồn phí tách spot, futures, options và công cụ khác, còn điều hướng phân biệt lựa chọn sàn và Web3.",
      it: "La fonte commissioni separa spot, futures, opzioni e altri strumenti; la navigazione distingue exchange e scelte Web3.",
    }),
    localeText({
      en: "Avoid treating Web3, DEX, Earn or copy trading as the same promise as an exchange account; each needs product, risk and region checks.",
      "zh-Hans": "不要把 Web3、DEX、Earn 或跟单等同于交易所账户承诺；每项都要单独核对产品、风险和地区。",
      "zh-Hant": "不要把 Web3、DEX、Earn 或跟單等同於交易所帳戶承諾；每項都要單獨核對產品、風險和地區。",
      es: "No equipares Web3, DEX, Earn o copy trading con una promesa de cuenta exchange; cada uno exige revisar producto, riesgo y región.",
      "pt-BR": "Não trate Web3, DEX, Earn ou copy trading como a mesma promessa de uma conta exchange; cada item exige checar produto, risco e região.",
      fr: "Ne confondez pas Web3, DEX, Earn ou copy trading avec une promesse de compte exchange ; chacun exige produit, risque et région.",
      de: "Web3, DEX, Earn oder Copy Trading nicht als identisch mit einem Exchange-Konto darstellen; jedes braucht Produkt-, Risiko- und Regionenprüfung.",
      ja: "Web3、DEX、Earn、コピー取引を取引所口座と同じ約束として扱わないでください。商品、リスク、地域の確認が別途必要です。",
      ko: "Web3, DEX, Earn, 카피 트레이딩을 거래소 계정과 같은 약속으로 보지 마세요. 각각 상품, 위험, 지역 확인이 필요합니다.",
      // l10n: needs native review
      ur: "Web3، DEX، Earn یا کاپی ٹریڈنگ کو ایکسچینج اکاؤنٹ جیسا وعدہ نہ سمجھیں؛ ہر ایک کی مصنوعات، خطرات اور علاقے کی جانچ ضروری ہے۔",
      // l10n: needs native review
      uk: "Не сприймайте Web3, DEX, Earn чи копітрейдинг як ту саму обіцянку, що й біржовий обліковий запис: кожен потребує перевірки продукту, ризиків і регіону.",
      ar: "لا تعامل Web3 أو DEX أو Earn أو نسخ التداول كالوعد نفسه لحساب البورصة؛ كل منها يحتاج فحص المنتج والمخاطر والمنطقة.",
      tr: "Web3, DEX, Earn veya copy trading'i borsa hesabıyla aynı vaat gibi görme; her biri ürün, risk ve bölge kontrolü ister.",
      ru: "Не приравнивайте Web3, DEX, Earn или копитрейдинг к обещанию биржевого аккаунта; нужны отдельные проверки продукта, риска и региона.",
      id: "Jangan samakan Web3, DEX, Earn, atau copy trading dengan janji akun exchange; masing-masing perlu cek produk, risiko, dan wilayah.",
      vi: "Không xem Web3, DEX, Earn hay copy trading như lời hứa của tài khoản sàn; từng mục cần kiểm tra sản phẩm, rủi ro và khu vực.",
      it: "Non trattare Web3, DEX, Earn o copy trading come la stessa promessa di un account exchange; servono controlli su prodotto, rischio e regione.",
    }), [0, 1, 2, 3]),
  backpack: reviewedEntry(
    localeText({
      en: "Choose Backpack when you are comparing a narrower exchange-plus-wallet ecosystem and need to verify spot, perps, margin and wallet boundaries first.",
      "zh-Hans": "如果要比较更窄的交易所加钱包生态，并先核对现货、永续、保证金和钱包边界，可把 Backpack 纳入候选。",
      "zh-Hant": "如果要比較更窄的交易所加錢包生態，並先核對現貨、永續、保證金和錢包邊界，可把 Backpack 納入候選。",
      es: "Considera Backpack si comparas un ecosistema más estrecho de exchange y wallet, verificando antes spot, perps, margen y límites de wallet.",
      "pt-BR": "Considere a Backpack se estiver comparando um ecossistema mais estreito de exchange e carteira, verificando spot, perps, margem e limites da carteira.",
      fr: "Considérez Backpack si vous comparez un écosystème exchange plus wallet plus étroit, avec spot, perps, marge et limites wallet à vérifier d'abord.",
      de: "Backpack passt, wenn du ein engeres Exchange-plus-Wallet-Ökosystem vergleichst und Spot, Perps, Margin und Wallet-Grenzen zuerst prüfen willst.",
      ja: "より絞られた取引所＋ウォレットのエコシステムを比較し、スポット、永続先物、マージン、ウォレット境界を先に確認したい場合、Backpack を候補にできます。",
      ko: "더 좁은 거래소+지갑 생태계를 비교하고 현물, 무기한, 마진, 지갑 경계를 먼저 확인해야 한다면 Backpack을 후보로 볼 수 있습니다.",
      // l10n: needs native review
      ur: "Backpack کو تب منتخب کریں جب محدود ایکسچینج اور والیٹ نظام کا موازنہ کرتے ہوئے پہلے اسپاٹ، پرپس، مارجن اور والیٹ کی حدود جانچنا ہوں۔",
      // l10n: needs native review
      uk: "Розгляньте Backpack, якщо порівнюєте вужчу екосистему біржі й гаманця та спочатку перевіряєте межі споту, безстрокових контрактів, маржі й гаманця.",
      ar: "اختر Backpack عند مقارنة منظومة أضيق تجمع البورصة والمحفظة مع فحص الفوري والعقود الدائمة والهامش وحدود المحفظة أولًا.",
      tr: "Daha dar bir borsa artı cüzdan ekosistemini karşılaştırıp spot, perp, marjin ve cüzdan sınırlarını önce doğrulamak istiyorsan Backpack adaydır.",
      ru: "Рассматривайте Backpack, если сравниваете более узкую экосистему биржа плюс кошелек и сначала проверяете спот, бессрочные контракты, маржу и границы кошелька.",
      id: "Pertimbangkan Backpack bila membandingkan ekosistem exchange plus wallet yang lebih sempit dan perlu memeriksa spot, perps, margin, serta batas wallet dahulu.",
      vi: "Hãy cân nhắc Backpack khi so sánh hệ sinh thái sàn cộng ví hẹp hơn và cần kiểm tra spot, perps, margin cùng ranh giới ví trước.",
      it: "Valuta Backpack se confronti un ecosistema più stretto exchange più wallet e devi verificare spot, perps, margin e confini wallet.",
    }),
    localeText({
      en: "Official sources separate Backpack Exchange from Backpack Wallet, and the API and margin docs describe spot, perpetual futures and cross-margin mechanics.",
      "zh-Hans": "官方来源区分 Backpack Exchange 与 Backpack Wallet，API 和保证金文档说明现货、永续和全仓保证金机制。",
      "zh-Hant": "官方來源區分 Backpack Exchange 與 Backpack Wallet，API 和保證金文檔說明現貨、永續和全倉保證金機制。",
      es: "Las fuentes oficiales separan Backpack Exchange de Backpack Wallet, y los docs de API/margen describen spot, perpetuos y margen cruzado.",
      "pt-BR": "As fontes oficiais separam Backpack Exchange de Backpack Wallet, e os docs de API/margem descrevem spot, perpétuos e margem cruzada.",
      fr: "Les sources officielles distinguent Backpack Exchange de Backpack Wallet, et les docs API/marge décrivent spot, perpétuels et marge croisée.",
      de: "Offizielle Quellen trennen Backpack Exchange von Backpack Wallet; API- und Margin-Dokumente beschreiben Spot, Perps und Cross-Margin.",
      ja: "公式情報は Backpack Exchange と Backpack Wallet を分け、API とマージン文書はスポット、永続先物、クロスマージンを説明しています。",
      ko: "공식 자료는 Backpack Exchange와 Backpack Wallet을 구분하고, API 및 마진 문서는 현물, 무기한, 크로스 마진 구조를 설명합니다.",
      // l10n: needs native review
      ur: "سرکاری ماخذ Backpack Exchange اور Backpack Wallet کو الگ رکھتے ہیں، جبکہ API اور مارجن دستاویزات اسپاٹ، پرپیچوئل فیوچرز اور کراس مارجن کی وضاحت کرتی ہیں۔",
      // l10n: needs native review
      uk: "Офіційні джерела відрізняють Backpack Exchange від Backpack Wallet, а документація API та маржі описує спот, безстрокові ф’ючерси й кросмаржу.",
      ar: "تفصل المصادر الرسمية Backpack Exchange عن Backpack Wallet، وتشرح وثائق API والهامش الفوري والعقود الدائمة وآليات الهامش المتقاطع.",
      tr: "Resmi kaynaklar Backpack Exchange ile Backpack Wallet'ı ayırır; API ve marjin dokümanları spot, perp ve cross-margin mekaniklerini açıklar.",
      ru: "Официальные источники разделяют Backpack Exchange и Backpack Wallet, а API и margin-документы описывают спот, бессрочные контракты и кросс-маржу.",
      id: "Sumber resmi memisahkan Backpack Exchange dan Backpack Wallet, sementara dokumen API/margin menjelaskan spot, perpetual futures, dan cross-margin.",
      vi: "Nguồn chính thức tách Backpack Exchange khỏi Backpack Wallet, còn tài liệu API/margin mô tả spot, perpetual futures và cơ chế cross-margin.",
      it: "Le fonti ufficiali separano Backpack Exchange da Backpack Wallet, e i documenti API/margin descrivono spot, perpetual futures e cross-margin.",
    }),
    localeText({
      en: "Avoid framing it as a broad CEX replacement, a self-custody guarantee, or a points opportunity; supported products and account risk must be checked first.",
      "zh-Hans": "不要把它写成大型 CEX 替代、自托管保证或积分机会；支持产品和账户风险要先核对。",
      "zh-Hant": "不要把它寫成大型 CEX 替代、自託管保證或積分機會；支援產品和帳戶風險要先核對。",
      es: "No lo presentes como reemplazo amplio de CEX, garantía de autocustodia ni oportunidad de puntos; primero revisa productos y riesgo de cuenta.",
      "pt-BR": "Não enquadre como substituto amplo de CEX, garantia de autocustódia ou oportunidade de pontos; verifique produtos e risco da conta primeiro.",
      fr: "Ne le présentez pas comme remplaçant CEX généraliste, garantie d'auto-garde ou opportunité de points ; vérifiez produits et risque du compte.",
      de: "Nicht als breiten CEX-Ersatz, Self-Custody-Garantie oder Punktechance darstellen; unterstützte Produkte und Kontorisiko zuerst prüfen.",
      ja: "広範な CEX 代替、セルフカストディ保証、ポイント機会として扱わないでください。対応商品と口座リスクを先に確認します。",
      ko: "광범위한 CEX 대체재, 셀프커스터디 보장, 포인트 기회로 표현하지 마세요. 지원 상품과 계정 위험을 먼저 확인해야 합니다.",
      // l10n: needs native review
      ur: "اسے جامع CEX کا متبادل، خود تحویلی کی ضمانت یا پوائنٹس کی آفر نہ کہیں؛ پہلے دستیاب مصنوعات اور اکاؤنٹ کے خطرات چیک کریں۔",
      // l10n: needs native review
      uk: "Не представляйте його як універсальну заміну CEX, гарантію самостійного зберігання чи можливість заробити бали: спочатку перевірте продукти й ризики облікового запису.",
      ar: "لا تقدمه كبديل واسع لـ CEX أو ضمان حفظ ذاتي أو فرصة نقاط؛ يجب فحص المنتجات المدعومة ومخاطر الحساب أولًا.",
      tr: "Geniş CEX alternatifi, self-custody garantisi veya puan fırsatı gibi sunma; desteklenen ürünler ve hesap riski önce kontrol edilmeli.",
      ru: "Не описывайте его как широкую замену CEX, гарантию self-custody или возможность points; сначала проверяйте продукты и риск аккаунта.",
      id: "Jangan posisikan sebagai pengganti CEX luas, jaminan self-custody, atau peluang poin; produk yang didukung dan risiko akun harus dicek dulu.",
      vi: "Không mô tả như lựa chọn thay thế CEX rộng, bảo đảm tự lưu ký hay cơ hội điểm; cần kiểm tra sản phẩm hỗ trợ và rủi ro tài khoản trước.",
      it: "Non presentarlo come ampio sostituto CEX, garanzia self-custody o opportunità punti; prima controlla prodotti supportati e rischio account.",
    }), [0, 1, 2]),
  kraken: entry(
    tr("13-year track record with zero major security incidents, deep USD/EUR fiat liquidity, preferred by veteran traders and institutions.", "创立 13 年零安全事故合规标杆，欧美法币流动性深厚，资深专业交易员首选。", "創立 13 年零安全事故合規標竿，歐美法幣流動性深厚，資深專業交易員首選。"),
    tr("Pioneer in cryptographic Proof of Reserves; highly stable Pro terminal and API with direct EUR/USD banking settlement.", "密码学储备金证明先驱，Pro 交易终端与 API 极为稳定，支持欧元美元直接清算。", "密碼學儲備金證明先驅，Pro 交易終端與 API 極為穩定，支援歐元美元直接清算。"),
    tr("Instant retail buy fees are relatively high; margin and futures access requires specific regional eligibility and extra verification.", "普通简易买币费率偏高，杠杆交易对用户所在地区和身份审核有独立前置要求。", "普通簡易買幣費率偏高，槓桿交易對用戶所在地區和身分審核有獨立前置要求。"), [0, 1]),
  "gate-io": entry(
    tr("Over 1,800 listed tokens (widest market selection), premier destination for initial listings and multi-asset collateral staking.", "全网收录币种最多（超 1800 个），新币首发打新与全仓跨币种质押第一站。", "全網收錄幣種最多（超 1800 個），新幣首發打新與全倉跨幣種質押第一站。"),
    tr("Generous Startup free airdrop program, robust spot and futures APIs, and long-standing Proof of Reserves publications.", "Startup 免费空投频道权益丰厚，现货与合约 API 接口开放成熟，资产储备长期公示。", "Startup 免費空投頻道權益豐厚，現貨與合約 API 介面開放成熟，資產儲備長期公示。"),
    tr("Extreme volatility on micro-cap altcoins with potential slippage; complex feature-rich interface requires an onboarding curve.", "微型代币与长尾山寨币波动剧烈，需警惕低流动性滑点风险；功能繁多需适应界面。", "微型代幣與長尾山寨幣波動劇烈，需警惕低流動性滑點風險；功能繁多需適應介面。"), [0, 1]),
  kucoin: entry(
    tr("Popular hub for altcoin gems with mature built-in grid trading bots, well-suited for multi-token portfolio rotation.", "全球山寨币掘金热门场所，内置成熟网格量化策略机器人，适合多币种轮动配置。", "全球山寨幣掘金熱門場所，內建成熟網格量化策略機器人，適合多幣種輪動配置。"),
    tr("Comprehensive conditional orders, trailing stop-losses, automated trading bots, and broad global community support.", "条件单、追踪止损与自动化网格交易工具完善，全球化社群覆盖广泛。", "條件單、追蹤止損與自動化網格交易工具完善，全球化社群覆蓋廣泛。"),
    tr("Major pair liquidity depth trails Binance; increasing regulatory requirements in key regions mandate KYC completion.", "主流币巨额深度相比币安略有差距，部分主流地区监管要求逐步提升，须完成认证。", "主流幣巨額深度相比幣安略有差距，部分主流地區監管要求逐步提升，須完成認證。"), [0, 1]),
  mexc: entry(
    tr("Persistent 0% spot maker fees, fastest token listing pace in crypto, preferred exchange for early hot trends and meme tokens.", "现货挂单长期零费率，新币上线全网最快，Meme 币与早期热点首选打新平台。", "現貨掛單長期零費率，新幣上線全網最快，Meme 幣與早期熱點首選打新平台。"),
    tr("Lowest maker fees across the industry, ultra-low futures cost, fast liquidity bootstrapping, and quick email onboarding.", "挂单手续费全网最低，合约开仓成本低廉，新币流动性启动迅速且支持邮箱极速开户。", "掛單手續費全網最低，合約開倉成本低廉，新幣流動性啟動迅速且支援郵箱極速開戶。"),
    tr("The reviewed PAIRUSDT futures API notice describes an Innovation Zone restriction and does not establish the status of every MEXC market; micro-caps also carry sharp volatility and delisting risks.", "已复核的 PAIRUSDT 合约 API 公告只说明创新区限制，不能代表所有 MEXC 市场；长尾新币仍有较高波动与退市风险。", "已複核的 PAIRUSDT 合約 API 公告只說明創新區限制，不能代表所有 MEXC 市場；長尾新幣仍有較高波動與下架風險。"), [0, 1]),
  deribit: entry(
    tr("Undisputed global crypto options leader (>85% market share), tailored for professional market makers and institutional hedging.", "全球加密期权市场绝对霸主（市占率超 85%），适合专业做市商与机构对冲交易。", "全球加密期權市場絕對霸主（市占率超 85%），適合專業做市商與機構對沖交易。"),
    tr("Institutional implied volatility surface, complete Greeks risk parameters, sub-millisecond API matching, and deep order books.", "专业级隐含波动率曲面、希腊字母风控参数完备，API 撮合延迟极低，盘口厚度极深。", "專業級隱含波動率曲面、希臘字母風控參數完備，API 撮合延遲極低，盤口厚度極深。"),
    tr("Specialized in complex derivatives and margin; lacks basic retail fiat ramps, presenting a steep learning curve for beginners.", "平台专注复杂衍生品与保证金交易，无普通法币一键买币入口，新手操作门槛较高。", "平台專注複雜衍生品與保證金交易，無普通法幣一鍵買幣入口，新手操作門檻較高。"), [0, 1]),
  uniswap: entry(
    tr("Self-custody DEX route for users who can verify the official app, pool fee, hook behavior, token contract, network and wallet path before connecting.", "适合能在连接钱包前核验官方 App、池费用、hook 行为、代币合约、网络与钱包路径的自托管 DEX 用户。", "適合能在連接錢包前核驗官方 App、池費用、hook 行為、代幣合約、網路與錢包路徑的自託管 DEX 用戶。"),
    tr("The sourced docs separate AMM mechanics, v4 deployments, dynamic fee design, hook test environments and CTA link testing, so the page can act as a swap-preparation checklist rather than a signup page.", "已核验来源把 AMM 机制、v4 部署、动态费用设计、hook 测试环境与 CTA 链接测试分开说明，因此本页更适合作为 swap 前检查清单，而不是注册页。", "已核驗來源把 AMM 機制、v4 部署、動態費用設計、hook 測試環境與 CTA 連結測試分開說明，因此本頁更適合作為 swap 前檢查清單，而不是註冊頁。"),
    tr("Do not assume one fee, one contract address, one network path or centralized order book depth applies everywhere; verify the deployments feed, chain-specific mapping, wallet approval and route before sending funds.", "不要假定单一费率、单一合约地址、单一网络路径或中心化订单簿深度适用于所有情况；转账前需核验部署 feed、对应链映射、钱包授权与路由。", "不要假定單一費率、單一合約地址、單一網路路徑或中心化訂單簿深度適用於所有情況；轉帳前需核驗部署 feed、對應鏈映射、錢包授權與路由。"), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]),
  pancakeswap: entry(
    tr("Leading DEX on BNB Chain and multi-chain, preferred for low-fee micro-swaps, yield farming, and IFO launch pools.", "BNB 链及多链头部 DEX，低手续费微额兑换首选，聚合农场与 IFO 打新生态丰富。", "BNB 鏈及多鏈頭部 DEX，低手續費微額兌換首選，聚合農場與 IFO 打新生態豐富。"),
    tr("Ultra-low gas fees on BNB Chain, concentrated liquidity pools, and automated vaults for yield optimization and market making.", "BNB Chain 交易 Gas 成本极低，提供集中流动性与自动化金库，适合高频兑换与做市。", "BNB Chain 交易 Gas 成本極低，提供集中流動性與自動化金庫，適合高頻兌換與做市。"),
    tr("Thinner liquidity on secondary chains; verify token contract addresses carefully to guard against scam honeypots.", "部分非核心网络流动性较薄，需手动核对目标代币合约真伪防范貔貅盘。", "部分非核心網路流動性較薄，需手動核對目標代幣合約真偽防範貔貅盤。"), [0, 1]),
  jupiter: entry(
    tr("Solana self-custody route for users who can review Jupiter Swap or Ultra quotes, token mints, route legs, slippage, price impact and wallet-built transactions before signing.", "适合能在签名前核验 Jupiter Swap 或 Ultra 报价、Token mint、路由腿、滑点、价格影响和钱包构建交易的 Solana 自托管用户。", "適合能在簽名前核驗 Jupiter Swap 或 Ultra 報價、Token mint、路由腿、滑點、價格影響和錢包構建交易的 Solana 自託管用戶。"),
    tr("The sourced docs separate Swap API, router competition, Ultra execution, token-list checks and transaction building, so the page can work as a Solana route checklist instead of a custodial signup page.", "已核验来源把 Swap API、路由竞争、Ultra 执行、Token 列表核验和交易构建分开说明，因此本页适合作为 Solana 路由检查清单，而不是托管开户链接。", "已核驗來源把 Swap API、路由競爭、Ultra 執行、Token 列表核驗和交易構建分開說明，因此本頁適合作為 Solana 路由檢查清單，而不是託管開戶連結。"),
    tr("Do not treat a quote as proof that every token is safe, every fee is absent, or every Solana wallet path will execute; verify the official route, mint list and final wallet transaction first.", "不要把一次报价视为所有 Token 都安全、所有费用都不存在或所有 Solana 钱包路径都可执行；需先核验官方路由、mint 列表和最终钱包交易。", "不要把一次報價視為所有 Token 都安全、所有費用都不存在或所有 Solana 錢包路徑都可執行；需先核驗官方路由、mint 列表和最終錢包交易。"), [0, 1, 2, 3, 4, 5, 6, 7, 8]),
  raydium: entry(
    tr("Solana's core native AMM liquidity provider, prime venue for new meme launches and concentrated liquidity market making.", "Solana 链上原生 AMM 核心流动性发源地，新 Meme 币开盘与集中流动性做市中心。", "Solana 鏈上原生 AMM 核心流動性發源地，新 Meme 幣開盤與集中流動性做市中心。"),
    tr("Deep integration with CLMM concentrated liquidity algorithms, offering high capital efficiency and rapid on-chain execution.", "深度整合 CLMM 集中流动性算法，提供超高资本利用率与快速链上撮合响应。", "深度整合 CLMM 集中流動性演算法，提供超高資本利用率與快速鏈上撮合響應。"),
    tr("Liquidity providers face impermanent loss risk on volatile pairs; adjust slippage tolerance during peak network congestion.", "做市 LP 面临价格单边脱锚的无常损失；链上网络瞬时拥堵时需调高滑点容忍度。", "做市 LP 面臨價格單邊脫錨的無常損失；鏈上網路瞬時擁堵時需調高滑點容忍度。"), [0, 1]),
  aerodrome: entry(
    tr("Base-native DEX route for users who can verify the Base network, bridge path, token contract, pool address, pool fee type, Slipstream or standard-pool behavior and veAERO reward boundary.", "适合能核验 Base 网络、跨链路径、代币合约、池地址、池费用类型、Slipstream 或标准池行为以及 veAERO 奖励边界的 Base 原生 DEX 用户。", "適合能核驗 Base 網路、跨鏈路徑、代幣合約、池地址、池費用類型、Slipstream 或標準池行為以及 veAERO 獎勵邊界的 Base 原生 DEX 用戶。"),
    tr("The sourced docs separate trading and liquidity, pool-level fees, voting incentives, veAERO reward claims and launcher liquidity, so the decision can focus on Base execution instead of a generic exchange account.", "已核验来源把交易与流动性、池级费用、投票激励、veAERO 奖励领取和启动流动性分开说明，因此决策应聚焦 Base 执行路径，而不是泛化交易所账户。", "已核驗來源把交易與流動性、池級費用、投票激勵、veAERO 獎勵領取和啟動流動性分開說明，因此決策應聚焦 Base 執行路徑，而不是泛化交易所帳戶。"),
    tr("Do not assume multi-chain availability, reward entitlement, or uniform fees; bridge route, Base gas, pool contract, active incentives and locked-launch liquidity must be checked before moving funds.", "不要假定多链可用、必然获得奖励或统一费用；转入资金前必须核对跨链路径、Base gas、池合约、当前激励和锁定启动流动性。", "不要假定多鏈可用、必然獲得獎勵或統一費用；轉入資金前必須核對跨鏈路徑、Base gas、池合約、目前激勵和鎖定啟動流動性。"), [0, 1, 2, 3, 4, 5, 6]),
  curve: entry(
    tr("Decentralized benchmark for stablecoins and correlated asset swaps, offering near-zero slippage on large-size transactions.", "全球去中心化稳定币与同质化大额资产兑换基石，大额兑换滑点趋近于零。", "全球去中心化穩定幣與同質化大額資產兌換基石，大額兌換滑點趨近於零。"),
    tr("Proprietary StableSwap invariant and internal Cryptoswap oracle algorithms, the gold standard for large-volume capital repositioning.", "独创 StableSwap 曲线与 Cryptoswap 内部预言机算法，大额资产置换首选场所。", "獨創 StableSwap 曲線與 Cryptoswap 內部預言機演算法，大額資產置換首選場所。"),
    tr("Retro-style UI requires user familiarization; not built for ordinary speculative long-tail altcoin trading.", "UI 界面保留早期复古风格需熟悉操作；普通非同质长尾代币非其核心优势方向。", "UI 介面保留早期復古風格需熟悉操作；普通非同質長尾代幣非其核心優勢方向。"), [0, 1]),
  hyperliquid: entry(
    tr("On-chain order-book Perp DEX for users who can verify Hyperliquid fees, funding payments, USDC funding, sub-account gates, API-wallet signing and liquidation margin before trading.", "适合能在交易前核验 Hyperliquid 费率、资金费支付、USDC 入金、子账户门槛、API 钱包签名和清算保证金的链上订单簿永续用户。", "適合能在交易前核驗 Hyperliquid 費率、資金費支付、USDC 入金、子帳戶門檻、API 錢包簽名和清算保證金的鏈上訂單簿永續用戶。"),
    tr("The sourced docs separate HyperCore order books, HIP-3 perps, rolling 14 day fee tiers, peer-to-peer funding, account modes and native USDC transfer paths, so the page can answer fee searches with a checklist instead of a signup reward promise.", "已核验来源把 HyperCore 订单簿、HIP-3 永续、滚动 14 日费率阶梯、点对点资金费、账户模式和原生 USDC 转账路径分开说明，因此本页可用检查清单回答费率搜索，而不是承诺注册奖励。", "已核驗來源把 HyperCore 訂單簿、HIP-3 永續、滾動 14 日費率階梯、點對點資金費、帳戶模式和原生 USDC 轉帳路徑分開說明，因此本頁可用檢查清單回答費率搜尋，而不是承諾註冊獎勵。"),
    tr("Do not treat it as a normal exchange signup page or a funded-account guarantee; the funding path, wallet transfer, testnet faucet gate, account mode, maintenance margin and liquidation flow must match the official docs before use.", "不要把它当成普通交易所注册页，也不要写成 funded account 保证；入金路径、钱包转账、测试网水龙头门槛、账户模式、维持保证金和清算流程都需与官方文档一致后再使用。", "不要把它當成普通交易所註冊頁，也不要寫成 funded account 保證；入金路徑、錢包轉帳、測試網水龍頭門檻、帳戶模式、維持保證金和清算流程都需與官方文檔一致後再使用。"), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
  dydx: entry(
    tr("Veteran on-chain perpetual pioneer, Cosmos sovereign appchain architecture with fully open-source decentralized matching.", "老牌链上合约开拓者，Cosmos 独立链架构高速撮合，代码完全开源去中心化。", "老牌鏈上合約開拓者，Cosmos 獨立鏈架構高速撮合，代碼完全開源去中心化。"),
    tr("Mature v4 order book engine, community treasury governance, multi-cycle battle-tested stability, and full transparency.", "成熟的 v4 订单簿引擎与社区金库治理，历经多轮牛熊沉淀，数据公开透明。", "成熟的 v4 訂單簿引擎與社區金庫治理，歷經多輪牛熊沉澱，數據公開透明。"),
    tr("Deposits require bridging to the dYdX standalone chain; monitor funding costs and recent competition from emerging L1 perpetuals.", "资金充值需经过跨链桥接进入 dYdX 独立链；需关注资金费率成本与新兴 L1 永续产品的竞争。", "資金充值需經過跨鏈橋接進入 dYdX 獨立鏈；需留意資金費率成本與新興 L1 永續產品的競爭。"), [0, 1]),
  gmx: entry(
    tr("Leading multi-asset liquidity pool derivatives protocol on Arbitrum and Avalanche, zero-slippage execution on large orders.", "Arbitrum 与 Avalanche 链上多资产混合流动性池衍生品龙头，零滑点大单撮合。", "Arbitrum 與 Avalanche 鏈上多資產混合流動性池衍生品龍頭，零滑點大單撮合。"),
    tr("Chainlink dynamic oracle pricing with GM/GLV liquidity pools acting directly as counterparty for predictable execution.", "采用 Chainlink 预言机动态报价，GM/GLV 资产池直接作为交易对手盘，撮合稳定可靠。", "採用 Chainlink 預言機動態報價，GM/GLV 資產池直接作為交易對手盤，撮合穩定可靠。"),
    tr("No traditional limit order book depth; position fees and borrowing rates depend on pool utilization and oracle feeds.", "无传统订单薄挂单深度，开平仓费用及资金费率略高于头部 CEX，依赖预言机喂价。", "無傳統訂單薄掛單深度，開平倉費用及資金費率略高於頭部 CEX，依賴預言機喂價。"), [0, 1]),
  drift: entry(
    tr("Solana's #1 derivatives suite, sub-second execution with integrated multi-asset cross-margin lending and borrowing.", "Solana 链上第一衍生品交易套件，毫秒级撮合与多资产混合抵押借贷一体化。", "Solana 鏈上第一衍生品交易套件，毫秒級撮合與多資產混合抵押借貸一體化。"),
    tr("Available source coverage is insufficient to establish a broader venue fit; published material describes a proprietary DLMM hybrid liquidity order book and SOL/BTC cross-margin collateral.", "现有来源不足以确认更广泛的适用性；已发布材料描述了 DLMM 混合流动性订单簿与 SOL/BTC 跨币种抵押。", "現有來源不足以確認更廣泛的適用性；已發布材料描述了 DLMM 混合流動性訂單簿與 SOL/BTC 跨幣種抵押。"),
    tr("Asset coverage focuses primarily on high-cap tokens; a redirected documentation path alone does not establish a product migration, and margin requirements still need monitoring during extreme Solana volatility.", "币种覆盖主要围绕热门主流标的；文档重定向本身不能证明产品迁移，Solana 极端波动时仍需留意保证金要求。", "幣種覆蓋主要圍繞熱門主流標的；文檔重定向本身不能證明產品遷移，Solana 極端波動時仍需留意保證金要求。"), [0, 1]),
};

const unresolvedFit = new Set(["gate-io", "kucoin", "deribit", "drift"]);
const mexcListingBasis = {
  id: "mexc-pair-september",
  sourceUrl: "https://www.mexc.com/announcements/article/mexc-to-list-pairusdt-futures-in-innovation-zone-on-sep-6-2026-15-17827791538274",
  checkedAt: "2026-09-06T18:35:39Z",
};

export const decisionCopy = {
  // l10n: needs native review
  ur: ["اوپر دی گئی ماخذ پر مبنی تحقیق سے موزونیت کا تجزیہ۔", "فیصلے کے نوٹس انگریزی میں", "معاون حقائق دیکھیں", "موزونیت ابھی ثابت نہیں"],
  // l10n: needs native review
  uk: ["Оцінка відповідності на основі досліджень із джерелами вище.", "Примітки до рішення англійською", "Перевірити підтверджувальні факти", "Відповідність ще не встановлено"],
  en: ["Editorial fit based on the source-linked research above.", "Decision notes in English", "Review supporting facts", "Suitability not yet established"],
  "zh-Hans": ["以下为基于上方来源事实的选择分析。", "以下选择分析为英文原文", "核对依据事实", "适用性待核实"],
  "zh-Hant": ["以下為基於上方來源事實的選擇分析。", "以下選擇分析為英文原文", "核對依據事實", "適用性待核實"],
  es: ["Análisis de encaje basado en las fuentes anteriores.", "Notas de decisión en inglés", "Revisar los hechos", "Idoneidad pendiente de verificar"],
  "pt-BR": ["Análise de adequação baseada nas fontes acima.", "Notas de decisão em inglês", "Revisar os fatos", "Adequação ainda não verificada"],
  fr: ["Analyse de pertinence fondée sur les sources ci-dessus.", "Notes de décision en anglais", "Examiner les faits", "Pertinence à vérifier"],
  de: ["Eignungsanalyse auf Basis der oben belegten Fakten.", "Entscheidungshinweise auf Englisch", "Belegte Fakten prüfen", "Eignung noch ungeklärt"],
  ja: ["上記の出典付き調査に基づく適合性の分析です。", "選択の分析は英語原文です", "根拠となる事実を確認", "適合性は未確認"],
  ko: ["위 출처 기반 조사에 따른 적합성 분석입니다.", "선택 분석은 영어 원문입니다", "근거 사실 확인", "적합성 미확인"],
  ar: ["تحليل الملاءمة استنادًا إلى البحث الموثق أعلاه.", "ملاحظات الاختيار باللغة الإنجليزية", "مراجعة الحقائق الداعمة", "الملاءمة لم تُحسم بعد"],
  tr: ["Yukarıdaki kaynaklı araştırmaya dayalı uygunluk analizi.", "Karar notları İngilizcedir", "Dayanak bilgileri incele", "Uygunluk henüz doğrulanmadı"],
  ru: ["Анализ соответствия на основе источников выше.", "Рекомендации по выбору на английском", "Проверить факты", "Пригодность пока не подтверждена"],
  id: ["Analisis kesesuaian berdasarkan riset bersumber di atas.", "Catatan keputusan dalam bahasa Inggris", "Tinjau fakta pendukung", "Kesesuaian belum dipastikan"],
  vi: ["Phân tích mức độ phù hợp dựa trên nguồn ở trên.", "Ghi chú lựa chọn bằng tiếng Anh", "Xem dữ kiện hỗ trợ", "Mức độ phù hợp chưa được xác minh"],
  it: ["Analisi di idoneità basata sulle fonti sopra.", "Note di scelta in inglese", "Esamina i fatti", "Idoneità ancora da verificare"],
};

export function hasReviewedEditorialDecision(slug) {
  const record = venueDecisionContent[slug];
  const research = exchangeResearch[slug];
  return Boolean(
    record?.editorialReviewed &&
    research &&
    record.factIndexes?.length >= 2 &&
    record.factIndexes.every((index) => research.facts[index]?.sourceUrl?.startsWith("https://"))
  );
}

export function decisionForVenue(slug, locale = "en") {
  const record = venueDecisionContent[slug];
  const research = exchangeResearch[slug];
  if (!record || !research) return null;
  const contentLocale = record.fit[locale] ? locale : "en";
  const sourceBasis = record.factIndexes.map((index) => ({
    id: research.facts[index].id, sourceUrl: research.facts[index].sourceUrl, checkedAt: research.checkedAt,
  }));
  if (slug === "mexc") sourceBasis.push(mexcListingBasis);
  return {
    slug, contentLocale, suitabilityUnresolved: unresolvedFit.has(slug), sourceBasis,
    editorialReviewed: hasReviewedEditorialDecision(slug),
    supplementalSources: slug === "mexc" ? [mexcListingBasis] : [],
    fit: record.fit[contentLocale], why: record.why[contentLocale], avoid: record.avoid[contentLocale],
    basisCheckedAt: research.checkedAt,
    basisFactIds: sourceBasis.map((basis) => basis.id),
    sourceUrls: [...new Set(sourceBasis.map((basis) => basis.sourceUrl))],
  };
}

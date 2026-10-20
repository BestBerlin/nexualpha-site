import { organizationDescription } from "../../data/brand-definition.js";
import { NexuAlphaWordmark } from "../brand/NexuAlphaWordmark";
import { enFallback } from "../../utils/fallback-lang.js";
import { localizedHref } from "../../data/locale-routing.js";
import { withoutTurkeyUnlisted } from "../../data/partner-geo-policy.js";
import { getTextDirection } from "../../paraglide/runtime.js";
import { formatDate, formatMonthYear } from "../../data/format-date.js";
import "./methodology-page.css";

const RESEARCH_PAGE_REVIEWED_AT = "2026-09-15";
const METHODOLOGY_REVISED_MONTH = "2026-09";
const METHODOLOGY_SPEC_VERSION = "v3.8";

const researchTrustCopy = {
  en: { label: "Research identity", byline: "Published by NexuAlpha Research Desk", reviewed: "Page reviewed {date}", assets: "Downloadable research data", perp: "Perp cost-field dictionary", funding: "Regional funding verification matrix", json: "JSON", csv: "CSV" },
  "zh-Hans": { label: "研究身份", byline: "由 NexuAlpha 研究团队发布", reviewed: "页面复核：{date}", assets: "可下载研究数据", perp: "永续合约成本字段字典", funding: "区域入金核验矩阵", json: "JSON", csv: "CSV" },
  "zh-Hant": { label: "研究身分", byline: "由 NexuAlpha 研究團隊發布", reviewed: "頁面複核：{date}", assets: "可下載研究資料", perp: "永續合約成本欄位字典", funding: "區域入金核驗矩陣", json: "JSON", csv: "CSV" },
  es: { label: "Identidad de investigación", byline: "Publicado por NexuAlpha Research Desk", reviewed: "Página revisada: {date}", assets: "Datos de investigación descargables", perp: "Diccionario de costes de perpetuos", funding: "Matriz regional de verificación de fondos", json: "JSON", csv: "CSV" },
  "pt-BR": { label: "Identidade da pesquisa", byline: "Publicado pela equipe de pesquisa NexuAlpha", reviewed: "Página revisada: {date}", assets: "Dados de pesquisa para download", perp: "Dicionário de custos de perpétuos", funding: "Matriz regional de verificação de depósitos", json: "JSON", csv: "CSV" },
  fr: { label: "Identité de la recherche", byline: "Publié par le NexuAlpha Research Desk", reviewed: "Page révisée : {date}", assets: "Données de recherche téléchargeables", perp: "Dictionnaire des coûts des perpétuels", funding: "Matrice régionale de vérification des dépôts", json: "JSON", csv: "CSV" },
  de: { label: "Forschungsidentität", byline: "Veröffentlicht vom NexuAlpha Research Desk", reviewed: "Seite geprüft: {date}", assets: "Herunterladbare Forschungsdaten", perp: "Kostenfeld-Lexikon für Perpetuals", funding: "Regionale Einzahlungs-Prüfmatrix", json: "JSON", csv: "CSV" },
  ja: { label: "調査主体", byline: "NexuAlpha Research Desk が公開", reviewed: "ページ確認日：{date}", assets: "ダウンロード可能な調査データ", perp: "無期限契約のコスト項目辞書", funding: "地域別入金確認マトリクス", json: "JSON", csv: "CSV" },
  ko: { label: "연구 주체", byline: "NexuAlpha Research Desk 게시", reviewed: "페이지 검토일: {date}", assets: "다운로드 가능한 연구 데이터", perp: "무기한 계약 비용 필드 사전", funding: "지역별 입금 검증 매트릭스", json: "JSON", csv: "CSV" },
  ar: { label: "هوية البحث", byline: "منشور بواسطة فريق أبحاث NexuAlpha", reviewed: "تمت مراجعة الصفحة: {date}", assets: "بيانات بحث قابلة للتنزيل", perp: "قاموس حقول تكلفة العقود الدائمة", funding: "مصفوفة التحقق من التمويل الإقليمي", json: "JSON", csv: "CSV" },
  tr: { label: "Araştırma kimliği", byline: "NexuAlpha Research Desk tarafından yayımlandı", reviewed: "Sayfa inceleme tarihi: {date}", assets: "İndirilebilir araştırma verileri", perp: "Sürekli vadeli maliyet alanları sözlüğü", funding: "Bölgesel fonlama doğrulama matrisi", json: "JSON", csv: "CSV" },
  ru: { label: "Авторство исследования", byline: "Опубликовано NexuAlpha Research Desk", reviewed: "Страница проверена: {date}", assets: "Данные для скачивания", perp: "Словарь полей стоимости бессрочных контрактов", funding: "Матрица проверки регионального пополнения", json: "JSON", csv: "CSV" },
  id: { label: "Identitas riset", byline: "Diterbitkan oleh NexuAlpha Research Desk", reviewed: "Halaman ditinjau: {date}", assets: "Data riset yang dapat diunduh", perp: "Kamus bidang biaya perpetual", funding: "Matriks verifikasi pendanaan regional", json: "JSON", csv: "CSV" },
  vi: { label: "Danh tính nghiên cứu", byline: "Được xuất bản bởi NexuAlpha Research Desk", reviewed: "Trang được rà soát: {date}", assets: "Dữ liệu nghiên cứu có thể tải xuống", perp: "Từ điển trường chi phí hợp đồng vĩnh cửu", funding: "Ma trận xác minh nạp tiền theo khu vực", json: "JSON", csv: "CSV" },
  it: { label: "Identità della ricerca", byline: "Pubblicato dal NexuAlpha Research Desk", reviewed: "Pagina verificata: {date}", assets: "Dati di ricerca scaricabili", perp: "Dizionario dei costi dei perpetual", funding: "Matrice regionale di verifica dei depositi", json: "JSON", csv: "CSV" },
};

const DATA_LICENSE_COPY = {
  en: {
    title: "NexuAlpha Data License and Source Boundary",
    body: "Access to NexuAlpha datasets does not grant redistribution rights. NexuAlpha reserves rights in its original compilation, field definitions, normalized metadata, review notes and limitation text. Third-party source documents, names, trademarks and linked materials remain subject to their respective owners and terms. Contact contact@nexualpha.com for reuse, republication or licensing requests.",
  },
  "zh-Hans": {
    title: "NexuAlpha 数据许可与来源边界",
    body: "访问 NexuAlpha 数据集不等于获得再分发授权。NexuAlpha 对原创编排、字段定义、标准化元数据、复核说明和限制文本保留权利。第三方来源文件、名称、商标和链接材料的权利归各自权利人及其条款约束。如需复用、转载或授权，请联系 contact@nexualpha.com。",
  },
  es: {
    title: "Licencia de datos y límite de fuentes de NexuAlpha",
    body: "Acceder a los datasets de NexuAlpha no concede derechos de redistribución. NexuAlpha conserva derechos sobre su compilación original, definiciones de campos, metadatos normalizados, notas de revisión y textos de limitación. Los documentos, nombres, marcas y materiales enlazados de terceros siguen sujetos a sus respectivos titulares y condiciones. Para reutilización, republicación o licencias, contacte a contact@nexualpha.com.",
  },
  "pt-BR": {
    title: "Licença de dados e limite de fontes da NexuAlpha",
    body: "O acesso aos datasets da NexuAlpha não concede direitos de redistribuição. A NexuAlpha preserva direitos sobre sua compilação original, definições de campos, metadados normalizados, notas de revisão e textos de limitação. Documentos, nomes, marcas e materiais vinculados de terceiros continuam sujeitos aos respectivos titulares e termos. Para reutilização, republicação ou licenciamento, contate contact@nexualpha.com.",
  },
  "zh-Hant": {
    title: "NexuAlpha 資料授權與來源邊界",
    body: "存取 NexuAlpha 資料集不等於取得再散布授權。NexuAlpha 對原創編排、欄位定義、標準化中繼資料、複核說明與限制文字保留權利。第三方來源文件、名稱、商標與連結材料的權利歸各自權利人並受其條款約束。如需再利用、轉載或授權，請聯絡 contact@nexualpha.com。",
  },
  // l10n: needs native review (legal/compliance wording)
  ja: {
    title: "NexuAlpha データライセンスと出典の範囲",
    body: "NexuAlpha のデータセットへのアクセスは再配布権を付与するものではありません。NexuAlpha は独自の編集物、フィールド定義、正規化されたメタデータ、確認メモ、制限事項の記述に関する権利を保持します。第三者の出典文書、名称、商標、リンク先の資料は、それぞれの権利者と利用条件に従います。再利用、再掲載、ライセンスについては contact@nexualpha.com までご連絡ください。",
  },
  // l10n: needs native review (legal/compliance wording)
  ko: {
    title: "NexuAlpha 데이터 라이선스와 출처 경계",
    body: "NexuAlpha 데이터세트에 접근하는 것이 재배포 권한을 부여하지는 않습니다. NexuAlpha는 원본 편집물, 필드 정의, 정규화된 메타데이터, 검토 메모 및 제한 문구에 대한 권리를 보유합니다. 제3자 출처 문서, 명칭, 상표 및 링크된 자료는 각 권리자와 해당 약관에 따릅니다. 재사용, 재게재 또는 라이선스 요청은 contact@nexualpha.com으로 문의하세요.",
  },
  // l10n: needs native review (legal/compliance wording)
  tr: {
    title: "NexuAlpha veri lisansı ve kaynak sınırı",
    body: "NexuAlpha veri kümelerine erişim, yeniden dağıtım hakkı vermez. NexuAlpha; özgün derlemesi, alan tanımları, normalleştirilmiş meta veriler, inceleme notları ve sınırlama metinleri üzerindeki haklarını saklı tutar. Üçüncü taraf kaynak belgeleri, adlar, markalar ve bağlantılı materyaller ilgili sahiplerine ve koşullarına tabidir. Yeniden kullanım, yeniden yayım veya lisans talepleri için contact@nexualpha.com adresine yazın.",
  },
  fr: {
    title: "Licence des données NexuAlpha et périmètre des sources",
    body: "L’accès aux jeux de données NexuAlpha ne confère aucun droit de redistribution. NexuAlpha conserve ses droits sur sa compilation originale, les définitions de champs, les métadonnées normalisées, les notes de vérification et les textes de limitation. Les documents sources, noms, marques et contenus liés de tiers restent soumis à leurs titulaires et conditions respectifs. Pour toute réutilisation, republication ou licence, écrivez à contact@nexualpha.com.",
  },
  de: {
    title: "NexuAlpha-Datenlizenz und Quellengrenze",
    body: "Der Zugriff auf NexuAlpha-Datensätze gewährt keine Weiterverbreitungsrechte. NexuAlpha behält sich die Rechte an seiner eigenen Zusammenstellung, den Felddefinitionen, normalisierten Metadaten, Prüfnotizen und Einschränkungstexten vor. Quelldokumente, Namen, Marken und verlinkte Materialien Dritter unterliegen weiterhin deren Inhabern und Bedingungen. Anfragen zu Wiederverwendung, Neuveröffentlichung oder Lizenzierung richten Sie an contact@nexualpha.com.",
  },
  it: {
    title: "Licenza dei dati NexuAlpha e confine delle fonti",
    body: "L’accesso ai dataset NexuAlpha non concede diritti di ridistribuzione. NexuAlpha conserva i diritti sulla propria compilazione originale, sulle definizioni dei campi, sui metadati normalizzati, sulle note di verifica e sui testi di limitazione. Documenti, nomi, marchi e materiali collegati di terze parti restano soggetti ai rispettivi titolari e condizioni. Per riutilizzo, ripubblicazione o licenze scrivere a contact@nexualpha.com.",
  },
  // l10n: needs native review (legal/compliance wording)
  ru: {
    title: "Лицензия на данные NexuAlpha и границы источников",
    body: "Доступ к наборам данных NexuAlpha не даёт права на их распространение. NexuAlpha сохраняет права на собственную компиляцию, определения полей, нормализованные метаданные, заметки о проверке и тексты ограничений. Документы, названия, товарные знаки и материалы третьих сторон остаются собственностью их правообладателей и регулируются их условиями. По вопросам повторного использования, перепубликации или лицензирования пишите на contact@nexualpha.com.",
  },
  // l10n: needs native review (legal/compliance wording)
  id: {
    title: "Lisensi data NexuAlpha dan batas sumber",
    body: "Akses ke dataset NexuAlpha tidak memberikan hak redistribusi. NexuAlpha mempertahankan hak atas kompilasi aslinya, definisi bidang, metadata yang dinormalisasi, catatan tinjauan, dan teks batasan. Dokumen sumber, nama, merek dagang, dan materi tertaut milik pihak ketiga tetap tunduk pada pemilik dan ketentuan masing-masing. Untuk penggunaan ulang, publikasi ulang, atau lisensi, hubungi contact@nexualpha.com.",
  },
  // l10n: needs native review (legal/compliance wording)
  vi: {
    title: "Giấy phép dữ liệu NexuAlpha và ranh giới nguồn",
    body: "Việc truy cập bộ dữ liệu NexuAlpha không đồng nghĩa với quyền phân phối lại. NexuAlpha giữ quyền đối với phần biên soạn gốc, định nghĩa trường, siêu dữ liệu đã chuẩn hóa, ghi chú rà soát và nội dung giới hạn. Tài liệu nguồn, tên, nhãn hiệu và tài liệu liên kết của bên thứ ba vẫn thuộc chủ sở hữu và điều khoản tương ứng. Để tái sử dụng, đăng lại hoặc cấp phép, liên hệ contact@nexualpha.com.",
  },
  // l10n: needs native review (legal/compliance wording)
  ar: {
    title: "ترخيص بيانات NexuAlpha وحدود المصادر",
    body: "لا يمنح الوصول إلى مجموعات بيانات NexuAlpha أي حق في إعادة التوزيع. تحتفظ NexuAlpha بحقوقها في التجميع الأصلي وتعريفات الحقول والبيانات الوصفية الموحدة وملاحظات المراجعة ونصوص القيود. وتبقى وثائق المصادر والأسماء والعلامات التجارية والمواد المرتبطة التابعة لأطراف ثالثة خاضعة لأصحابها وشروطهم. لطلبات إعادة الاستخدام أو إعادة النشر أو الترخيص، راسل contact@nexualpha.com.",
  },
};

const REGIONAL_FUNDING_ROUTE_COPY = {
  en: {
    eyebrow: "Regional funding route answer",
    title: "How should international users verify crypto funding routes?",
    answer: "Start from the regional funding matrix, then open the market page for residence, identity, local rail and official-account checks. Use comparison pages only after the region, product and funding path are clear. The matrix is a dated research checklist, not a live fee quote, account approval promise, funding guarantee, user-benefit promise or registration outcome.",
    routesLabel: "Source-backed regional entry points",
    datasetLabel: "Machine-readable matrix",
    compareLabel: "Then compare platform routes",
    marketRoutes: [
      ["Hong Kong", "/hk", "SFC status, HKD funding, identity and product scope"],
      ["European Union", "/eu", "MiCA register context, country scope and EUR or SEPA route"],
      ["United Kingdom", "/uk", "FCA context, GBP funding, residence and onboarding checks"],
      ["Japan", "/jp?locale=ja", "FSA registration context, JPY funding and account-name checks"],
      ["Korea", "/kr?locale=ko", "KRW funding, real-name bank account and identity checks"],
      ["Singapore", "/sg", "MAS DPT context, SGD funding and product scope"],
      ["Türkiye", "/tr/markets/turkiye", "SPK list context, TRY funding and product scope"],
      ["Brazil", "/br", "Pix, CPF/KYC and BRL funding route checks"],
      ["Mexico", "/mx", "MXN, SPEI and identity checks before signup"],
    ],
    compareLinks: [
      ["Binance vs OKX", "/compare/binance-vs-okx"],
      ["Bybit vs Bitget", "/compare/bybit-vs-bitget"],
      ["Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"],
    ],
  },
  "zh-Hans": {
    eyebrow: "区域入金路径解答",
    title: "国际用户应如何核验加密货币入金路径？",
    answer: "先从区域入金矩阵出发，再打开对应市场页核对居住地、身份、本地支付通道与官方账户要求。只有在地区、产品和入金路径都明确后，再使用比较页。该矩阵是带日期的研究清单，不是实时费率报价、开户承诺、入金保证、用户权益承诺或注册结果。",
    routesLabel: "有来源支持的区域入口",
    datasetLabel: "机器可读矩阵",
    compareLabel: "再比较平台路径",
    marketRoutes: [
      ["香港", "/hk", "SFC 牌照状态、港元入金、身份与产品范围"],
      ["欧盟", "/eu", "MiCA 登记背景、国家范围与欧元或 SEPA 通道"],
      ["英国", "/uk", "FCA 背景、英镑入金、居住地与开户检查"],
      ["日本", "/jp?locale=ja", "FSA 登记背景、日元入金与账户名核对"],
      ["韩国", "/kr?locale=ko", "韩元入金、实名银行账户与身份检查"],
      ["新加坡", "/sg", "MAS DPT 背景、新元入金与产品范围"],
      ["土耳其", "/tr/markets/turkiye", "SPK 名单背景、里拉入金与产品范围"],
      ["巴西", "/br", "Pix、CPF/KYC 与雷亚尔入金路径检查"],
      ["墨西哥", "/mx", "墨西哥比索、SPEI 与注册前身份检查"],
    ],
    compareLinks: [
      ["Binance vs OKX", "/compare/binance-vs-okx"],
      ["Bybit vs Bitget", "/compare/bybit-vs-bitget"],
      ["Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"],
    ],
  },
  "zh-Hant": {
    eyebrow: "區域入金路徑解答",
    title: "國際用戶應如何核驗加密貨幣入金路徑？",
    answer: "先從區域入金矩陣出發，再打開對應市場頁核對居住地、身分、本地支付通道與官方帳戶要求。只有在地區、產品和入金路徑都明確後，再使用比較頁。該矩陣是附日期的研究清單，不是即時費率報價、開戶承諾、入金保證、用戶權益承諾或註冊結果。",
    routesLabel: "有來源支持的區域入口",
    datasetLabel: "機器可讀矩陣",
    compareLabel: "再比較平台路徑",
    marketRoutes: [
      ["香港", "/hk", "SFC 牌照狀態、港元入金、身分與產品範圍"],
      ["歐盟", "/eu", "MiCA 登記背景、國家範圍與歐元或 SEPA 通道"],
      ["英國", "/uk", "FCA 背景、英鎊入金、居住地與開戶檢查"],
      ["日本", "/jp?locale=ja", "FSA 登記背景、日圓入金與帳戶名核對"],
      ["韓國", "/kr?locale=ko", "韓元入金、實名銀行帳戶與身分檢查"],
      ["新加坡", "/sg", "MAS DPT 背景、新元入金與產品範圍"],
      ["土耳其", "/tr/markets/turkiye", "SPK 名單背景、里拉入金與產品範圍"],
      ["巴西", "/br", "Pix、CPF/KYC 與雷亞爾入金路徑檢查"],
      ["墨西哥", "/mx", "墨西哥披索、SPEI 與註冊前身分檢查"],
    ],
    compareLinks: [
      ["Binance vs OKX", "/compare/binance-vs-okx"],
      ["Bybit vs Bitget", "/compare/bybit-vs-bitget"],
      ["Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"],
    ],
  },
  // l10n: needs native review (legal/compliance wording)
  ja: {
    eyebrow: "地域別入金ルートの回答",
    title: "海外ユーザーは暗号資産の入金ルートをどう確認すべきですか？",
    answer: "まず地域別入金マトリクスから始め、次に該当する市場ページで居住地、本人確認、現地の送金手段、公式アカウントの条件を確認します。比較ページは、地域・商品・入金経路が明確になってから使ってください。このマトリクスは日付付きの調査チェックリストであり、リアルタイムの手数料見積、口座承認の約束、入金の保証、ユーザー特典の約束、登録結果ではありません。",
    routesLabel: "出典に基づく地域別の入口",
    datasetLabel: "機械可読マトリクス",
    compareLabel: "次にプラットフォームのルートを比較",
    marketRoutes: [
      ["香港", "/hk", "SFC の登録状況、HKD 入金、本人確認と商品範囲"],
      ["欧州連合", "/eu", "MiCA 登録の背景、対象国と EUR または SEPA ルート"],
      ["英国", "/uk", "FCA の背景、GBP 入金、居住地と口座開設の確認"],
      ["日本", "/jp?locale=ja", "金融庁登録の背景、JPY 入金と口座名義の確認"],
      ["韓国", "/kr?locale=ko", "KRW 入金、実名銀行口座と本人確認"],
      ["シンガポール", "/sg", "MAS DPT の背景、SGD 入金と商品範囲"],
      ["トルコ", "/tr/markets/turkiye", "SPK リストの背景、TRY 入金と商品範囲"],
      ["ブラジル", "/br", "Pix、CPF/KYC と BRL 入金ルートの確認"],
      ["メキシコ", "/mx", "MXN、SPEI と登録前の本人確認"],
    ],
    compareLinks: [
      ["Binance vs OKX", "/compare/binance-vs-okx"],
      ["Bybit vs Bitget", "/compare/bybit-vs-bitget"],
      ["Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"],
    ],
  },
  // l10n: needs native review (legal/compliance wording)
  ko: {
    eyebrow: "지역별 입금 경로 답변",
    title: "해외 사용자는 암호화폐 입금 경로를 어떻게 확인해야 하나요?",
    answer: "먼저 지역별 입금 매트릭스에서 시작한 뒤 해당 시장 페이지에서 거주지, 신원 확인, 현지 송금 수단, 공식 계정 조건을 확인하세요. 비교 페이지는 지역·상품·입금 경로가 명확해진 뒤에만 사용하세요. 이 매트릭스는 날짜가 표기된 연구 체크리스트이며 실시간 수수료 견적, 계정 승인 약속, 입금 보장, 사용자 혜택 약속 또는 가입 결과가 아닙니다.",
    routesLabel: "출처 기반 지역 진입점",
    datasetLabel: "기계 판독용 매트릭스",
    compareLabel: "다음으로 플랫폼 경로 비교",
    marketRoutes: [
      ["홍콩", "/hk", "SFC 라이선스 상태, HKD 입금, 신원 확인 및 상품 범위"],
      ["유럽연합", "/eu", "MiCA 등록 배경, 국가 범위 및 EUR 또는 SEPA 경로"],
      ["영국", "/uk", "FCA 배경, GBP 입금, 거주지 및 가입 절차 확인"],
      ["일본", "/jp?locale=ja", "FSA 등록 배경, JPY 입금 및 계좌 명의 확인"],
      ["한국", "/kr?locale=ko", "KRW 입금, 실명 은행 계좌 및 신원 확인"],
      ["싱가포르", "/sg", "MAS DPT 배경, SGD 입금 및 상품 범위"],
      ["튀르키예", "/tr/markets/turkiye", "SPK 목록 배경, TRY 입금 및 상품 범위"],
      ["브라질", "/br", "Pix, CPF/KYC 및 BRL 입금 경로 확인"],
      ["멕시코", "/mx", "MXN, SPEI 및 가입 전 신원 확인"],
    ],
    compareLinks: [
      ["Binance vs OKX", "/compare/binance-vs-okx"],
      ["Bybit vs Bitget", "/compare/bybit-vs-bitget"],
      ["Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"],
    ],
  },
  // l10n: needs native review (legal/compliance wording)
  tr: {
    eyebrow: "Bölgesel fonlama rotası yanıtı",
    title: "Uluslararası kullanıcılar kripto fonlama rotalarını nasıl doğrulamalı?",
    answer: "Bölgesel fonlama matrisinden başlayın; ardından ikamet, kimlik, yerel ödeme kanalı ve resmî hesap kontrolleri için pazar sayfasını açın. Karşılaştırma sayfalarını yalnızca bölge, ürün ve fonlama yolu netleştikten sonra kullanın. Matris tarihli bir araştırma kontrol listesidir; canlı ücret teklifi, hesap onayı vaadi, fonlama garantisi, kullanıcı avantajı vaadi veya kayıt sonucu değildir.",
    routesLabel: "Kaynağa dayalı bölgesel giriş noktaları",
    datasetLabel: "Makine tarafından okunabilir matris",
    compareLabel: "Ardından platform rotalarını karşılaştırın",
    marketRoutes: [
      ["Hong Kong", "/hk", "SFC durumu, HKD fonlama, kimlik ve ürün kapsamı"],
      ["Avrupa Birliği", "/eu", "MiCA kayıt bağlamı, ülke kapsamı ve EUR ya da SEPA rotası"],
      ["Birleşik Krallık", "/uk", "FCA bağlamı, GBP fonlama, ikamet ve hesap açma kontrolleri"],
      ["Japonya", "/jp?locale=ja", "FSA kayıt bağlamı, JPY fonlama ve hesap adı kontrolleri"],
      ["Güney Kore", "/kr?locale=ko", "KRW fonlama, gerçek isimli banka hesabı ve kimlik kontrolleri"],
      ["Singapur", "/sg", "MAS DPT bağlamı, SGD fonlama ve ürün kapsamı"],
      ["Türkiye", "/tr/markets/turkiye", "SPK listesi bağlamı, TRY fonlama ve ürün kapsamı"],
      ["Brezilya", "/br", "Pix, CPF/KYC ve BRL fonlama rotası kontrolleri"],
      ["Meksika", "/mx", "MXN, SPEI ve kayıt öncesi kimlik kontrolleri"],
    ],
    compareLinks: [
      ["Binance vs OKX", "/compare/binance-vs-okx"],
      ["Bybit vs Bitget", "/compare/bybit-vs-bitget"],
      ["Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"],
    ],
  },
  es: {
    eyebrow: "Respuesta sobre rutas regionales de depósito",
    title: "¿Cómo deben verificar los usuarios internacionales las rutas de depósito cripto?",
    answer: "Empiece por la matriz regional de depósitos y luego abra la página del mercado para comprobar residencia, identidad, vía de pago local y cuenta oficial. Use las páginas de comparación solo cuando la región, el producto y la ruta de depósito estén claros. La matriz es una lista de verificación de investigación con fecha, no una cotización de comisiones en vivo, una promesa de aprobación de cuenta, una garantía de depósito, una promesa de beneficios ni un resultado de registro.",
    routesLabel: "Puntos de entrada regionales con fuente",
    datasetLabel: "Matriz legible por máquina",
    compareLabel: "Después compare las rutas de las plataformas",
    marketRoutes: [
      ["Hong Kong", "/hk", "Estado SFC, depósitos en HKD, identidad y alcance de productos"],
      ["Unión Europea", "/eu", "Contexto del registro MiCA, alcance por país y ruta EUR o SEPA"],
      ["Reino Unido", "/uk", "Contexto FCA, depósitos en GBP, residencia y comprobaciones de alta"],
      ["Japón", "/jp?locale=ja", "Contexto del registro FSA, depósitos en JPY y comprobación del titular"],
      ["Corea del Sur", "/kr?locale=ko", "Depósitos en KRW, cuenta bancaria a nombre propio y comprobaciones de identidad"],
      ["Singapur", "/sg", "Contexto MAS DPT, depósitos en SGD y alcance de productos"],
      ["Turquía", "/tr/markets/turkiye", "Contexto de la lista SPK, depósitos en TRY y alcance de productos"],
      ["Brasil", "/br", "Comprobaciones de Pix, CPF/KYC y ruta de depósito en BRL"],
      ["México", "/mx", "MXN, SPEI y comprobaciones de identidad antes del registro"],
    ],
    compareLinks: [
      ["Binance vs OKX", "/compare/binance-vs-okx"],
      ["Bybit vs Bitget", "/compare/bybit-vs-bitget"],
      ["Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"],
    ],
  },
  "pt-BR": {
    eyebrow: "Resposta sobre rotas regionais de depósito",
    title: "Como usuários internacionais devem verificar rotas de depósito em cripto?",
    answer: "Comece pela matriz regional de depósitos e depois abra a página do mercado para verificar residência, identidade, meio de pagamento local e conta oficial. Use as páginas de comparação apenas quando região, produto e rota de depósito estiverem claros. A matriz é uma lista de verificação de pesquisa com data, não uma cotação de taxas em tempo real, promessa de aprovação de conta, garantia de depósito, promessa de benefício ou resultado de cadastro.",
    routesLabel: "Pontos de entrada regionais com fonte",
    datasetLabel: "Matriz legível por máquina",
    compareLabel: "Depois compare as rotas das plataformas",
    marketRoutes: [
      ["Hong Kong", "/hk", "Status na SFC, depósitos em HKD, identidade e escopo de produtos"],
      ["União Europeia", "/eu", "Contexto do registro MiCA, escopo por país e rota EUR ou SEPA"],
      ["Reino Unido", "/uk", "Contexto FCA, depósitos em GBP, residência e checagens de abertura"],
      ["Japão", "/jp?locale=ja", "Contexto do registro na FSA, depósitos em JPY e checagem do titular"],
      ["Coreia do Sul", "/kr?locale=ko", "Depósitos em KRW, conta bancária em nome próprio e checagens de identidade"],
      ["Singapura", "/sg", "Contexto MAS DPT, depósitos em SGD e escopo de produtos"],
      ["Turquia", "/tr/markets/turkiye", "Contexto da lista SPK, depósitos em TRY e escopo de produtos"],
      ["Brasil", "/br", "Checagens de Pix, CPF/KYC e rota de depósito em BRL"],
      ["México", "/mx", "MXN, SPEI e checagens de identidade antes do cadastro"],
    ],
    compareLinks: [
      ["Binance vs OKX", "/compare/binance-vs-okx"],
      ["Bybit vs Bitget", "/compare/bybit-vs-bitget"],
      ["Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"],
    ],
  },
  fr: {
    eyebrow: "Réponse sur les voies de dépôt régionales",
    title: "Comment les utilisateurs internationaux doivent-ils vérifier les voies de dépôt crypto ?",
    answer: "Partez de la matrice régionale de dépôt, puis ouvrez la page du marché pour vérifier la résidence, l’identité, le moyen de paiement local et le compte officiel. N’utilisez les pages de comparaison qu’une fois la région, le produit et la voie de dépôt clarifiés. La matrice est une liste de contrôle de recherche datée : ni devis de frais en temps réel, ni promesse d’approbation de compte, ni garantie de dépôt, ni promesse d’avantage, ni résultat d’inscription.",
    routesLabel: "Points d’entrée régionaux sourcés",
    datasetLabel: "Matrice lisible par machine",
    compareLabel: "Comparez ensuite les parcours des plateformes",
    marketRoutes: [
      ["Hong Kong", "/hk", "Statut SFC, dépôts en HKD, identité et périmètre produit"],
      ["Union européenne", "/eu", "Contexte du registre MiCA, périmètre par pays et voie EUR ou SEPA"],
      ["Royaume-Uni", "/uk", "Contexte FCA, dépôts en GBP, résidence et contrôles d’ouverture"],
      ["Japon", "/jp?locale=ja", "Contexte de l’enregistrement FSA, dépôts en JPY et contrôle du titulaire"],
      ["Corée du Sud", "/kr?locale=ko", "Dépôts en KRW, compte bancaire nominatif et contrôles d’identité"],
      ["Singapour", "/sg", "Contexte MAS DPT, dépôts en SGD et périmètre produit"],
      ["Turquie", "/tr/markets/turkiye", "Contexte de la liste SPK, dépôts en TRY et périmètre produit"],
      ["Brésil", "/br", "Contrôles Pix, CPF/KYC et voie de dépôt en BRL"],
      ["Mexique", "/mx", "MXN, SPEI et contrôles d’identité avant inscription"],
    ],
    compareLinks: [
      ["Binance vs OKX", "/compare/binance-vs-okx"],
      ["Bybit vs Bitget", "/compare/bybit-vs-bitget"],
      ["Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"],
    ],
  },
  de: {
    eyebrow: "Antwort zu regionalen Einzahlungswegen",
    title: "Wie sollten internationale Nutzer Krypto-Einzahlungswege prüfen?",
    answer: "Beginnen Sie mit der regionalen Einzahlungsmatrix und öffnen Sie dann die Marktseite für die Prüfung von Wohnsitz, Identität, lokalem Zahlungsweg und offiziellem Konto. Nutzen Sie Vergleichsseiten erst, wenn Region, Produkt und Einzahlungsweg klar sind. Die Matrix ist eine datierte Recherche-Checkliste, kein Live-Gebührenangebot, keine Zusage einer Kontofreigabe, keine Einzahlungsgarantie, kein Nutzervorteil-Versprechen und kein Registrierungsergebnis.",
    routesLabel: "Quellenbasierte regionale Einstiegspunkte",
    datasetLabel: "Maschinenlesbare Matrix",
    compareLabel: "Danach Plattformwege vergleichen",
    marketRoutes: [
      ["Hongkong", "/hk", "SFC-Status, HKD-Einzahlung, Identität und Produktumfang"],
      ["Europäische Union", "/eu", "MiCA-Registerkontext, Länderumfang und EUR- oder SEPA-Weg"],
      ["Vereinigtes Königreich", "/uk", "FCA-Kontext, GBP-Einzahlung, Wohnsitz und Onboarding-Prüfungen"],
      ["Japan", "/jp?locale=ja", "FSA-Registrierungskontext, JPY-Einzahlung und Kontonamensprüfung"],
      ["Südkorea", "/kr?locale=ko", "KRW-Einzahlung, Bankkonto auf eigenen Namen und Identitätsprüfungen"],
      ["Singapur", "/sg", "MAS-DPT-Kontext, SGD-Einzahlung und Produktumfang"],
      ["Türkei", "/tr/markets/turkiye", "SPK-Listenkontext, TRY-Einzahlung und Produktumfang"],
      ["Brasilien", "/br", "Pix-, CPF/KYC- und BRL-Einzahlungswegprüfungen"],
      ["Mexiko", "/mx", "MXN, SPEI und Identitätsprüfungen vor der Registrierung"],
    ],
    compareLinks: [
      ["Binance vs OKX", "/compare/binance-vs-okx"],
      ["Bybit vs Bitget", "/compare/bybit-vs-bitget"],
      ["Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"],
    ],
  },
  it: {
    eyebrow: "Risposta sui percorsi regionali di deposito",
    title: "Come dovrebbero verificare i percorsi di deposito crypto gli utenti internazionali?",
    answer: "Partite dalla matrice regionale dei depositi, poi aprite la pagina del mercato per i controlli su residenza, identità, canale di pagamento locale e account ufficiale. Usate le pagine di confronto solo quando regione, prodotto e percorso di deposito sono chiari. La matrice è una checklist di ricerca datata, non un preventivo di commissioni in tempo reale, una promessa di approvazione dell’account, una garanzia di deposito, una promessa di vantaggi o un esito di registrazione.",
    routesLabel: "Punti di accesso regionali con fonte",
    datasetLabel: "Matrice leggibile da macchina",
    compareLabel: "Poi confrontate i percorsi delle piattaforme",
    marketRoutes: [
      ["Hong Kong", "/hk", "Stato SFC, depositi in HKD, identità e ambito prodotti"],
      ["Unione Europea", "/eu", "Contesto del registro MiCA, ambito per paese e percorso EUR o SEPA"],
      ["Regno Unito", "/uk", "Contesto FCA, depositi in GBP, residenza e controlli di apertura"],
      ["Giappone", "/jp?locale=ja", "Contesto della registrazione FSA, depositi in JPY e controllo del titolare"],
      ["Corea del Sud", "/kr?locale=ko", "Depositi in KRW, conto bancario nominativo e controlli d’identità"],
      ["Singapore", "/sg", "Contesto MAS DPT, depositi in SGD e ambito prodotti"],
      ["Turchia", "/tr/markets/turkiye", "Contesto della lista SPK, depositi in TRY e ambito prodotti"],
      ["Brasile", "/br", "Controlli su Pix, CPF/KYC e percorso di deposito in BRL"],
      ["Messico", "/mx", "MXN, SPEI e controlli d’identità prima della registrazione"],
    ],
    compareLinks: [
      ["Binance vs OKX", "/compare/binance-vs-okx"],
      ["Bybit vs Bitget", "/compare/bybit-vs-bitget"],
      ["Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"],
    ],
  },
  // l10n: needs native review (legal/compliance wording)
  ru: {
    eyebrow: "Ответ о региональных способах пополнения",
    title: "Как международным пользователям проверять способы пополнения криптосчёта?",
    answer: "Начните с региональной матрицы пополнения, затем откройте страницу рынка для проверки резидентства, идентификации, локального платёжного канала и официального аккаунта. Используйте страницы сравнения только после того, как регион, продукт и способ пополнения определены. Матрица — это датированный исследовательский чек-лист, а не котировка комиссий в реальном времени, обещание одобрения аккаунта, гарантия пополнения, обещание бонуса или результат регистрации.",
    routesLabel: "Региональные точки входа с источниками",
    datasetLabel: "Машиночитаемая матрица",
    compareLabel: "Затем сравните маршруты платформ",
    marketRoutes: [
      ["Гонконг", "/hk", "Статус SFC, пополнение в HKD, идентификация и охват продуктов"],
      ["Европейский союз", "/eu", "Контекст реестра MiCA, охват стран и маршрут EUR или SEPA"],
      ["Великобритания", "/uk", "Контекст FCA, пополнение в GBP, резидентство и проверки при открытии"],
      ["Япония", "/jp?locale=ja", "Контекст регистрации FSA, пополнение в JPY и проверка имени владельца счёта"],
      ["Южная Корея", "/kr?locale=ko", "Пополнение в KRW, банковский счёт на своё имя и проверки идентификации"],
      ["Сингапур", "/sg", "Контекст MAS DPT, пополнение в SGD и охват продуктов"],
      ["Турция", "/tr/markets/turkiye", "Контекст списка SPK, пополнение в TRY и охват продуктов"],
      ["Бразилия", "/br", "Проверки Pix, CPF/KYC и маршрута пополнения в BRL"],
      ["Мексика", "/mx", "MXN, SPEI и проверки идентификации перед регистрацией"],
    ],
    compareLinks: [
      ["Binance vs OKX", "/compare/binance-vs-okx"],
      ["Bybit vs Bitget", "/compare/bybit-vs-bitget"],
      ["Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"],
    ],
  },
  // l10n: needs native review (legal/compliance wording)
  id: {
    eyebrow: "Jawaban rute pendanaan regional",
    title: "Bagaimana pengguna internasional sebaiknya memverifikasi rute pendanaan kripto?",
    answer: "Mulailah dari matriks pendanaan regional, lalu buka halaman pasar untuk memeriksa domisili, identitas, jalur pembayaran lokal, dan akun resmi. Gunakan halaman perbandingan hanya setelah wilayah, produk, dan jalur pendanaan sudah jelas. Matriks ini adalah daftar periksa riset bertanggal, bukan kuotasi biaya langsung, janji persetujuan akun, jaminan pendanaan, janji manfaat pengguna, atau hasil pendaftaran.",
    routesLabel: "Titik masuk regional berbasis sumber",
    datasetLabel: "Matriks yang dapat dibaca mesin",
    compareLabel: "Lalu bandingkan rute platform",
    marketRoutes: [
      ["Hong Kong", "/hk", "Status SFC, pendanaan HKD, identitas, dan cakupan produk"],
      ["Uni Eropa", "/eu", "Konteks register MiCA, cakupan negara, dan rute EUR atau SEPA"],
      ["Inggris", "/uk", "Konteks FCA, pendanaan GBP, domisili, dan pemeriksaan pembukaan akun"],
      ["Jepang", "/jp?locale=ja", "Konteks registrasi FSA, pendanaan JPY, dan pemeriksaan nama rekening"],
      ["Korea Selatan", "/kr?locale=ko", "Pendanaan KRW, rekening bank atas nama sendiri, dan pemeriksaan identitas"],
      ["Singapura", "/sg", "Konteks MAS DPT, pendanaan SGD, dan cakupan produk"],
      ["Turki", "/tr/markets/turkiye", "Konteks daftar SPK, pendanaan TRY, dan cakupan produk"],
      ["Brasil", "/br", "Pemeriksaan Pix, CPF/KYC, dan rute pendanaan BRL"],
      ["Meksiko", "/mx", "MXN, SPEI, dan pemeriksaan identitas sebelum pendaftaran"],
    ],
    compareLinks: [
      ["Binance vs OKX", "/compare/binance-vs-okx"],
      ["Bybit vs Bitget", "/compare/bybit-vs-bitget"],
      ["Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"],
    ],
  },
  // l10n: needs native review (legal/compliance wording)
  vi: {
    eyebrow: "Giải đáp về lộ trình nạp tiền theo khu vực",
    title: "Người dùng quốc tế nên xác minh lộ trình nạp tiền crypto như thế nào?",
    answer: "Bắt đầu từ ma trận nạp tiền theo khu vực, sau đó mở trang thị trường để kiểm tra nơi cư trú, danh tính, kênh thanh toán nội địa và tài khoản chính thức. Chỉ dùng trang so sánh khi khu vực, sản phẩm và lộ trình nạp tiền đã rõ. Ma trận là danh sách kiểm tra nghiên cứu có ghi ngày, không phải báo giá phí trực tiếp, lời hứa phê duyệt tài khoản, bảo đảm nạp tiền, cam kết quyền lợi người dùng hay kết quả đăng ký.",
    routesLabel: "Điểm vào theo khu vực có nguồn dẫn",
    datasetLabel: "Ma trận máy đọc được",
    compareLabel: "Sau đó so sánh lộ trình các nền tảng",
    marketRoutes: [
      ["Hồng Kông", "/hk", "Trạng thái SFC, nạp HKD, danh tính và phạm vi sản phẩm"],
      ["Liên minh châu Âu", "/eu", "Bối cảnh đăng ký MiCA, phạm vi quốc gia và lộ trình EUR hoặc SEPA"],
      ["Vương quốc Anh", "/uk", "Bối cảnh FCA, nạp GBP, nơi cư trú và kiểm tra mở tài khoản"],
      ["Nhật Bản", "/jp?locale=ja", "Bối cảnh đăng ký FSA, nạp JPY và kiểm tra tên tài khoản"],
      ["Hàn Quốc", "/kr?locale=ko", "Nạp KRW, tài khoản ngân hàng chính chủ và kiểm tra danh tính"],
      ["Singapore", "/sg", "Bối cảnh MAS DPT, nạp SGD và phạm vi sản phẩm"],
      ["Thổ Nhĩ Kỳ", "/tr/markets/turkiye", "Bối cảnh danh sách SPK, nạp TRY và phạm vi sản phẩm"],
      ["Brazil", "/br", "Kiểm tra Pix, CPF/KYC và lộ trình nạp BRL"],
      ["Mexico", "/mx", "MXN, SPEI và kiểm tra danh tính trước khi đăng ký"],
    ],
    compareLinks: [
      ["Binance vs OKX", "/compare/binance-vs-okx"],
      ["Bybit vs Bitget", "/compare/bybit-vs-bitget"],
      ["Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"],
    ],
  },
  // l10n: needs native review (legal/compliance wording)
  ar: {
    eyebrow: "إجابة حول مسارات التمويل الإقليمية",
    title: "كيف ينبغي للمستخدمين الدوليين التحقق من مسارات تمويل حسابات العملات المشفرة؟",
    answer: "ابدأ من مصفوفة التمويل الإقليمية، ثم افتح صفحة السوق للتحقق من الإقامة والهوية وقناة الدفع المحلية والحساب الرسمي. استخدم صفحات المقارنة فقط بعد أن تتضح المنطقة والمنتج ومسار التمويل. المصفوفة قائمة تحقق بحثية مؤرخة، وليست عرض رسوم مباشرًا ولا وعدًا بالموافقة على الحساب ولا ضمانًا للتمويل ولا وعدًا بمزايا للمستخدم ولا نتيجة تسجيل.",
    routesLabel: "نقاط دخول إقليمية مدعومة بالمصادر",
    datasetLabel: "مصفوفة قابلة للقراءة آليًا",
    compareLabel: "ثم قارن مسارات المنصات",
    marketRoutes: [
      ["هونغ كونغ", "/hk", "حالة SFC، التمويل بالدولار الهونغ كونغي، الهوية ونطاق المنتجات"],
      ["الاتحاد الأوروبي", "/eu", "سياق سجل MiCA، نطاق الدول ومسار اليورو أو SEPA"],
      ["المملكة المتحدة", "/uk", "سياق FCA، التمويل بالجنيه الإسترليني، الإقامة وفحوص فتح الحساب"],
      ["اليابان", "/jp?locale=ja", "سياق تسجيل FSA، التمويل بالين وفحوص اسم الحساب"],
      ["كوريا الجنوبية", "/kr?locale=ko", "التمويل بالوون الكوري، حساب بنكي بالاسم الحقيقي وفحوص الهوية"],
      ["سنغافورة", "/sg", "سياق MAS DPT، التمويل بالدولار السنغافوري ونطاق المنتجات"],
      ["تركيا", "/tr/markets/turkiye", "سياق قائمة SPK، التمويل بالليرة التركية ونطاق المنتجات"],
      ["البرازيل", "/br", "فحوص Pix وCPF/KYC ومسار التمويل بالريال البرازيلي"],
      ["المكسيك", "/mx", "البيزو المكسيكي وSPEI وفحوص الهوية قبل التسجيل"],
    ],
    compareLinks: [
      ["Binance vs OKX", "/compare/binance-vs-okx"],
      ["Bybit vs Bitget", "/compare/bybit-vs-bitget"],
      ["Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"],
    ],
  },
};

// Pillars are a set, not a sequence: the "1." … "4." prefixes in the copy are not shown.
const unnumbered = (t) => String(t || "").replace(/^\s*\d+\.\s*/, "");

const methodologyCopy = {
  "zh-Hans": {
    badge: "E-E-A-T 机构级评审准则",
    title: "NexuAlpha 评测方法论与数据审计标准",
    subtitle: "我们如何核对交易所费率、储备金披露与官方域名，以及每条记录背后的来源、日期与限制。",
    lastUpdated: "最后修订：{date}（{version} 规范）",
    pill1: "来源可追溯",
    pill2: "零付费改榜",
    pill3: "链上储备核验",
    pillarsTitle: "四项评审支柱",
    pillarsSummary: "查看四项评审标准与数据边界",
    pillar1Title: "1. 基础费率、来源页面与核验日期",
    pillar1Desc: "我们只发布已经核验的内容：每家平台普通用户档的 maker/taker 基础费率、对应的官方费率页面以及核验日期。VIP 档位、平台币折扣和用户权益在有官方来源支持之前，一律标注为尚未复核。",
    pillar2Title: "2. 储备金证明 (Proof of Reserves) 与清偿能力透视",
    pillar2Desc: "当平台公开 Merkle Tree 资产快照或第三方审计报告时，我们记录其覆盖范围、日期、审计主体与限制。未能找到可复核来源的准备金、保险或偿付能力说法会保持待核验。",
    pillar3Title: "3. 域名防钓鱼来源记录与官方通道核对",
    pillar3Desc: "针对 Google 搜索广告钓鱼与假冒 Telegram 群泛滥，NexuAlpha 记录交易所主域名、备用登录域名及官方核对页面的来源线索。未知域名会提示风险；已记录域名也不代表实时授权或安全保证。",
    pillar4Title: "4. 运营韧性与合规出入金门槛",
    pillar4Desc: "评估交易所针对全球不同司法管辖区的 KYC 强制等级（免 KYC / 基础认证 / 严格认证）、单日提币额度限制，以及面对极端行情（如 519、FTX 事件）时撮合引擎的可用性与宕机历史记录。",
    wallTitle: "商业利益隔离墙与编辑独立性声明 (Wall of Separation)",
    wallDesc: "NexuAlpha 坚守严格的编辑独立性原则。我们通过合规的交易所官方返佣（Affiliate Commission）维持服务器与量化爬虫系统运转，返佣支出由交易所商业推广预算承担，绝不向用户收取额外费用。绝没有任何交易所可以通过赞助、付费广告或商业合作更改其费率数据、储备金记录或对比顺序。",
    feedbackTitle: "数据纠错与社区监督",
    feedbackDesc: "如果您发现费率、镜像域名或准备金来源发生变化，请通过我们的研究员渠道提交来源。我们会在完成官方或链上复核后更新，并保留复核日期与限制。",
    btnBack: "← 返回全景交易终端",
    btnTg: "在 Telegram 中联系研究员",
  },
  en: {
    badge: "E-E-A-T Institutional Research Standards",
    title: "NexuAlpha data and review methodology",
    subtitle: "How we check exchange fee schedules, reserve disclosures and official domains, and the sources, dates and limits behind every record.",
    lastUpdated: "Last revised {date} · specification {version}",
    pill1: "Traceable Sources",
    pill2: "Zero Pay-for-Rank",
    pill3: "On-Chain Solvency Audit",
    pillarsTitle: "Four evaluation pillars",
    pillarsSummary: "View the four evaluation standards and data boundaries",
    pillar1Title: "1. Base fees, source page and check date",
    pillar1Desc: "We publish only what we have checked: each venue's base (regular user) maker and taker fee, the official fee page it comes from, and the date we checked it. VIP tiers, token discounts and user benefits stay marked as not yet reviewed until an official source supports them.",
    pillar2Title: "2. Proof of reserves (PoR) and solvency transparency",
    pillar2Desc: "When a venue publishes a Merkle Tree snapshot or third-party audit, we record its scope, date, auditor and limitations. Reserve, insurance and solvency statements remain pending when no reproducible source is available.",
    pillar3Title: "3. Anti-phishing domain records and official route checks",
    pillar3Desc: "To reduce search-ad phishing and clone-community risk, NexuAlpha records source clues for primary domains, alternate login domains, and official validation pages. Unknown domains trigger risk warnings; recorded matches are not live authorization or safety guarantees.",
    pillar4Title: "4. Operational resilience and custody access",
    pillar4Desc: "We record KYC requirements by jurisdiction, withdrawal limits and API rate limits only where an official page states them, with the date checked. We do not track or score matching-engine uptime.",
    wallTitle: "Editorial independence and commercial separation",
    wallDesc: "NexuAlpha strictly separates commercial monetization from research output. We receive standard affiliate commissions paid from exchange marketing budgets at no cost to users. No exchange can pay to change fee records, verification status or the order of comparisons.",
    feedbackTitle: "Data correction and community governance",
    feedbackDesc: "If you detect an outdated fee schedule, changed domain or reserve source, send the supporting source to our Research Desk. We update the record after official or on-chain review and retain the review date and limitations.",
    btnBack: "← Back to Terminal",
    btnTg: "Contact Research Desk on Telegram",
  }
};

methodologyCopy.ja = { ...methodologyCopy.en, badge: "E-E-A-T 機関レベルの調査基準", title: "NexuAlpha 評価方法論とデータ監査フレームワーク", subtitle: "取引所の手数料、Proof of Reserves、運用上の安全性をどのように検証するかを公開します。", lastUpdated: "最終更新：{date}（{version}）", pill1: "追跡可能な出典", pill2: "有料順位なし", pill3: "オンチェーン監査", pillarsTitle: "4つの評価基準", pillarsSummary: "評価基準とデータ範囲を見る", wallTitle: "編集独立性と商業分離", feedbackTitle: "データ訂正とコミュニティ監督", btnBack: "← 端末に戻る", btnTg: "Telegramで調査チームに連絡" };
methodologyCopy.ko = { ...methodologyCopy.en, badge: "E-E-A-T 기관급 연구 기준", title: "NexuAlpha 평가 방법론 및 데이터 감사 프레임워크", subtitle: "거래소 수수료, Proof of Reserves와 운영 보안을 검증하는 방식을 공개합니다.", lastUpdated: "최종 수정: {date} ({version})", pill1: "추적 가능한 출처", pill2: "유료 순위 없음", pill3: "온체인 감사", pillarsTitle: "4가지 평가 기준", pillarsSummary: "평가 기준과 데이터 범위 보기", wallTitle: "편집 독립성과 상업적 분리", feedbackTitle: "데이터 정정 및 커뮤니티 감독", btnBack: "← 터미널로 돌아가기", btnTg: "Telegram에서 리서치 팀에 문의" };
methodologyCopy.tr = { ...methodologyCopy.en, badge: "E-E-A-T kurumsal araştırma standartları", title: "NexuAlpha değerlendirme yöntemi ve veri denetimi", subtitle: "Platform ücretlerini, Proof of Reserves verilerini ve operasyonel güvenliği nasıl doğruladığımızı açıklıyoruz.", lastUpdated: "Son güncelleme: {date} ({version})", pill1: "İzlenebilir kaynaklar", pill2: "Ücretli sıralama yok", pill3: "On-chain denetim", pillarsTitle: "Dört değerlendirme standardı", pillarsSummary: "Standartları ve veri sınırlarını gör", wallTitle: "Editoryal bağımsızlık ve ticari ayrım", feedbackTitle: "Veri düzeltme ve topluluk denetimi", btnBack: "← Terminale dön", btnTg: "Telegram'da araştırma ekibine ulaş" };
methodologyCopy.es = { ...methodologyCopy.en, badge: "Estándares de investigación institucional E-E-A-T", title: "Metodología de evaluación y marco de auditoría de datos de NexuAlpha", subtitle: "Cómo verificamos de forma transparente las comisiones de plataformas, Proof of Reserves y seguridad operativa.", lastUpdated: "Última revisión: {date} ({version})", pill1: "Fuentes rastreables", pill2: "Sin ranking pagado", pill3: "Auditoría on-chain", pillarsTitle: "Cuatro pilares de evaluación", pillarsSummary: "Ver estándares y límites de datos", wallTitle: "Independencia editorial y separación comercial", feedbackTitle: "Corrección de datos y supervisión comunitaria", btnBack: "← Volver al terminal", btnTg: "Contactar al equipo de investigación en Telegram" };
methodologyCopy["pt-BR"] = { ...methodologyCopy.en, badge: "Padrões institucionais de pesquisa E-E-A-T", title: "Metodologia de avaliação e estrutura de auditoria de dados da NexuAlpha", subtitle: "Como verificamos taxas de plataformas, Proof of Reserves e segurança operacional de forma transparente.", lastUpdated: "Última revisão: {date} ({version})", pill1: "Fontes rastreáveis", pill2: "Sem ranking pago", pill3: "Auditoria on-chain", pillarsTitle: "Quatro pilares de avaliação", pillarsSummary: "Ver padrões e limites dos dados", wallTitle: "Independência editorial e separação comercial", feedbackTitle: "Correção de dados e supervisão da comunidade", btnBack: "← Voltar ao terminal", btnTg: "Contatar a equipe de pesquisa no Telegram" };


methodologyCopy.ar = { ...methodologyCopy.en, badge: "معايير بحث مؤسسية وفق E-E-A-T", title: "منهجية تقييم NexuAlpha وإطار تدقيق البيانات", subtitle: "نوضح كيف نتحقق من رسوم المنصات وإثبات الاحتياطيات والأمان التشغيلي بطريقة شفافة وقابلة للمراجعة.", lastUpdated: "آخر تحديث: {date} ({version})", pill1: "مصادر قابلة للتتبع", pill2: "لا ترتيب مدفوع", pill3: "تدقيق للاحتياطيات على السلسلة", pillarsTitle: "أربع ركائز للتقييم", pillarsSummary: "عرض معايير التقييم وحدود البيانات", wallTitle: "الاستقلال التحريري والفصل التجاري", feedbackTitle: "تصحيح البيانات والرقابة المجتمعية", btnBack: "← العودة إلى محطة التداول", btnTg: "التواصل مع فريق البحث عبر Telegram" };


methodologyCopy.id = { ...methodologyCopy.en, badge: "Standar riset institusional E-E-A-T", title: "Metodologi riset dan kerangka audit data NexuAlpha", subtitle: "Cara kami memverifikasi biaya platform, Proof of Reserves, dan keamanan operasional secara transparan.", lastUpdated: "Pembaruan terakhir: {date} ({version})", pill1: "Sumber terlacak", pill2: "Tanpa peringkat berbayar", pill3: "Audit solvabilitas on-chain", pillarsTitle: "Empat pilar evaluasi", pillarsSummary: "Lihat standar evaluasi dan batas data", wallTitle: "Independensi editorial dan pemisahan komersial", feedbackTitle: "Koreksi data dan pengawasan komunitas", btnBack: "← Kembali ke terminal", btnTg: "Hubungi tim riset di Telegram" };
methodologyCopy.vi = { ...methodologyCopy.en, badge: "Tiêu chuẩn nghiên cứu tổ chức E-E-A-T", title: "Phương pháp đánh giá và khung kiểm toán dữ liệu NexuAlpha", subtitle: "Cách chúng tôi xác minh phí nền tảng, Proof of Reserves và an toàn vận hành một cách minh bạch.", lastUpdated: "Cập nhật lần cuối: {date} ({version})", pill1: "Nguồn có thể truy xuất", pill2: "Không xếp hạng trả phí", pill3: "Kiểm toán khả năng thanh toán on-chain", pillarsTitle: "Bốn trụ cột đánh giá", pillarsSummary: "Xem tiêu chuẩn và giới hạn dữ liệu", wallTitle: "Độc lập biên tập và tách biệt thương mại", feedbackTitle: "Sửa dữ liệu và giám sát cộng đồng", btnBack: "← Quay lại terminal", btnTg: "Liên hệ nhóm nghiên cứu trên Telegram" };
methodologyCopy.it = { ...methodologyCopy.en, badge: "Standard di ricerca istituzionale E-E-A-T", title: "Metodologia di valutazione e framework di audit dei dati NexuAlpha", subtitle: "Come verifichiamo in modo trasparente commissioni, Proof of Reserves e sicurezza operativa.", lastUpdated: "Ultimo aggiornamento: {date} ({version})", pill1: "Fonti tracciabili", pill2: "Nessuna classifica a pagamento", pill3: "Audit di solvibilità on-chain", pillarsTitle: "Quattro pilastri di valutazione", pillarsSummary: "Visualizza standard e limiti dei dati", wallTitle: "Indipendenza editoriale e separazione commerciale", feedbackTitle: "Correzione dei dati e controllo della comunità", btnBack: "← Torna al terminale", btnTg: "Contatta il team di ricerca su Telegram" };

methodologyCopy.ru = { ...methodologyCopy.en, badge: "Институциональные стандарты исследований E-E-A-T", title: "Методология оценки и аудит данных NexuAlpha", subtitle: "Как мы прозрачно проверяем комиссии платформ, Proof of Reserves и операционную безопасность.", lastUpdated: "Последнее обновление: {date} ({version})", pill1: "Отслеживаемые источники", pill2: "Без платного ранжирования", pill3: "Ончейн-аудит платёжеспособности", pillarsTitle: "Четыре опоры оценки", pillarsSummary: "Стандарты оценки и границы данных", wallTitle: "Редакционная независимость и коммерческое разделение", feedbackTitle: "Исправление данных и контроль сообщества", btnBack: "← Вернуться к терминалу", btnTg: "Связаться с исследовательской командой в Telegram" };

methodologyCopy.fr = { ...methodologyCopy.en, badge: "Standards de recherche institutionnels E-E-A-T", subtitle: "Comment nous vérifions les grilles de frais, les publications de réserves et les domaines officiels des plateformes, ainsi que les sources, dates et limites derrière chaque enregistrement.", lastUpdated: "Dernière révision : {date} · spécification {version}", pill1: "Sources traçables", pill2: "Aucun classement payant", pill3: "Audit de solvabilité on-chain", pillarsTitle: "Quatre piliers d’évaluation", pillarsSummary: "Voir les quatre standards d’évaluation et les limites des données", wallTitle: "Indépendance éditoriale et séparation commerciale", feedbackTitle: "Correction des données et gouvernance communautaire", btnBack: "← Retour au terminal", btnTg: "Contacter le Research Desk sur Telegram" };
methodologyCopy.de = { ...methodologyCopy.en, badge: "Institutionelle E-E-A-T-Forschungsstandards", subtitle: "Wie wir Gebührentabellen, Reserveangaben und offizielle Domains der Börsen prüfen – und welche Quellen, Daten und Grenzen hinter jedem Eintrag stehen.", lastUpdated: "Zuletzt überarbeitet: {date} · Spezifikation {version}", pill1: "Nachvollziehbare Quellen", pill2: "Kein bezahltes Ranking", pill3: "On-Chain-Solvenzprüfung", pillarsTitle: "Vier Bewertungssäulen", pillarsSummary: "Die vier Bewertungsstandards und Datengrenzen ansehen", wallTitle: "Redaktionelle Unabhängigkeit und kommerzielle Trennung", feedbackTitle: "Datenkorrektur und Community-Governance", btnBack: "← Zurück zum Terminal", btnTg: "Research Desk auf Telegram kontaktieren" };
// l10n: needs native review (legal/compliance wording)
methodologyCopy["zh-Hant"] = {
  badge: "E-E-A-T 機構級評審準則",
  title: "NexuAlpha 評測方法論與資料審計標準",
  subtitle: "我們如何核對交易所費率、儲備金披露與官方域名，以及每條記錄背後的來源、日期與限制。",
  lastUpdated: "最後修訂：{date}（{version} 規範）",
  pill1: "來源可追溯",
  pill2: "零付費改榜",
  pill3: "鏈上儲備核驗",
  pillarsTitle: "四項評審支柱",
  pillarsSummary: "查看四項評審標準與資料邊界",
  pillar1Title: "1. 基礎費率、來源頁面與核驗日期",
  pillar1Desc: "我們只發布已經核驗的內容：每家平台普通用戶檔的 maker/taker 基礎費率、對應的官方費率頁面以及核驗日期。VIP 檔位、平台幣折扣和用戶權益在有官方來源支持之前，一律標註為尚未複核。",
  pillar2Title: "2. 儲備金證明 (Proof of Reserves) 與清償能力透視",
  pillar2Desc: "當平台公開 Merkle Tree 資產快照或第三方審計報告時，我們記錄其覆蓋範圍、日期、審計主體與限制。未能找到可複核來源的儲備金、保險或償付能力說法會保持待核驗。",
  pillar3Title: "3. 域名防釣魚來源記錄與官方通道核對",
  pillar3Desc: "針對 Google 搜尋廣告釣魚與假冒 Telegram 群氾濫，NexuAlpha 記錄交易所主域名、備用登入域名及官方核對頁面的來源線索。未知域名會提示風險；已記錄域名也不代表即時授權或安全保證。",
  pillar4Title: "4. 營運韌性與合規出入金門檻",
  pillar4Desc: "評估交易所針對全球不同司法管轄區的 KYC 強制等級（免 KYC / 基礎認證 / 嚴格認證）、單日提幣額度限制，以及面對極端行情（如 519、FTX 事件）時撮合引擎的可用性與停機歷史記錄。",
  wallTitle: "商業利益隔離牆與編輯獨立性聲明 (Wall of Separation)",
  wallDesc: "NexuAlpha 堅守嚴格的編輯獨立性原則。我們透過合規的交易所官方返佣（Affiliate Commission）維持伺服器與量化爬蟲系統運轉，返佣支出由交易所商業推廣預算承擔，絕不向用戶收取額外費用。沒有任何交易所可以透過贊助、付費廣告或商業合作更改其費率資料、儲備金記錄或對比順序。",
  feedbackTitle: "資料糾錯與社群監督",
  feedbackDesc: "如果您發現費率、鏡像域名或儲備金來源發生變化，請透過我們的研究員管道提交來源。我們會在完成官方或鏈上複核後更新，並保留複核日期與限制。",
  btnBack: "← 返回全景交易終端",
  btnTg: "在 Telegram 中聯絡研究員",
};

// The first version localized only the shell of this page and inherited the
// English pillar copy when a disclosure was opened. Keep the shared template,
// but give every supported locale a complete, concise body for the high intent
// research sections.
const methodologyDetails = {
  ja: {
    pillar1Title: "1. 基本手数料・出典ページ・確認日", pillar1Desc: "確認済みの内容だけを掲載します：各サービスの一般ユーザー向けメイカー／テイカー基本手数料、その公式手数料ページ、確認日です。VIP段階・トークン割引・ユーザー特典は、公式情報で裏付けられるまで未確認と表示します。",
    pillar2Title: "2. 準備金証明 (PoR) と支払能力", pillar2Desc: "Merkle Treeのスナップショットや第三者監査が公開されている場合は、範囲、日付、監査主体、制限を記録します。再現できる出典がない準備金や保険の主張は確認待ちのままです。",
    pillar3Title: "3. フィッシング対策ドメインと公式経路", pillar3Desc: "検索広告や偽のコミュニティによるなりすましを避けるため、主要ドメイン、ログインミラー、公式確認ページを出典とともに整理します。確認できないミラーには警告を表示します。",
    pillar4Title: "4. 運用の耐性と地域別アクセス条件", pillar4Desc: "地域ごとのKYC水準、出金上限、API制限、流動性ストレス時の稼働実績を確認します。利用可否はブランド名から推測せず、公式条件を参照します。",
    wallDesc: "NexuAlphaは編集判断と商業関係を分離します。運営費は取引所の通常のアフィリエイト報酬で賄い、ユーザーに追加料金は請求しません。報酬で手数料データ、評価、比較順位を変更することはありません。",
    feedbackDesc: "手数料、ドメイン、準備金の出典が変わった場合は、根拠をResearch Deskへ送ってください。公式またはオンチェーンの確認後に更新し、確認日と制限を残します。"
  },
  ko: {
    pillar1Title: "1. 기본 수수료, 출처 페이지, 확인일", pillar1Desc: "확인한 내용만 게시합니다: 각 플랫폼의 일반 사용자 메이커·테이커 기본 수수료, 해당 공식 수수료 페이지, 확인 날짜입니다. VIP 등급, 토큰 할인, 사용자 혜택은 공식 출처가 확인될 때까지 미검토로 표시합니다.",
    pillar2Title: "2. 준비금 증명(PoR)과 지급 능력", pillar2Desc: "Merkle Tree 스냅샷이나 제3자 감사가 공개되면 범위, 날짜, 감사 주체와 한계를 기록합니다. 재현 가능한 출처가 없는 준비금·보험 주장은 확인 대기 상태로 둡니다.",
    pillar3Title: "3. 피싱 방지 도메인과 공식 경로", pillar3Desc: "검색 광고와 가짜 커뮤니티의 사칭을 막기 위해 기본 도메인, 안전한 로그인 미러, 공식 확인 페이지를 출처와 함께 정리합니다. 확인되지 않은 미러에는 경고를 표시합니다.",
    pillar4Title: "4. 운영 복원력과 지역별 이용 조건", pillar4Desc: "지역별 KYC 수준, 출금 한도, API 제한, 유동성 스트레스 상황의 운영 기록을 확인합니다. 이용 가능 여부는 브랜드로 추정하지 않고 공식 조건을 기준으로 합니다.",
    wallDesc: "NexuAlpha는 편집 판단과 상업적 관계를 분리합니다. 운영 비용은 거래소의 일반 제휴 보상으로 충당하며 사용자에게 추가 비용을 청구하지 않습니다. 보상으로 수수료 데이터, 평가, 비교 순위를 바꾸지 않습니다.",
    feedbackDesc: "수수료, 도메인 또는 준비금 출처가 바뀌었다면 근거를 Research Desk로 보내 주세요. 공식 또는 온체인 확인 후 업데이트하고 확인 날짜와 한계를 남깁니다."
  },
  tr: {
    pillar1Title: "1. Temel ücretler, kaynak sayfa ve kontrol tarihi", pillar1Desc: "Yalnızca kontrol ettiğimizi yayınlarız: her platformun normal kullanıcı maker/taker temel ücreti, alındığı resmî ücret sayfası ve kontrol tarihi. VIP kademeleri, token indirimleri ve kullanıcı avantajları resmî bir kaynak desteklenene kadar incelenmedi olarak kalır.",
    pillar2Title: "2. Rezerv kanıtı (PoR) ve ödeme gücü", pillar2Desc: "Merkle Tree görüntüsü veya üçüncü taraf denetimi yayımlanmışsa kapsamı, tarihi, denetçiyi ve sınırlamaları kaydederiz. Tekrar üretilebilir kaynak yoksa rezerv ve sigorta iddiaları beklemede kalır.",
    pillar3Title: "3. Kimlik avına karşı alan adları ve resmî yollar", pillar3Desc: "Arama reklamları ve sahte topluluklardaki taklitleri azaltmak için ana alan adlarını, güvenli giriş aynalarını ve resmî doğrulama sayfalarını kaynaklarıyla listeleriz. Doğrulanmamış aynalar uyarı alır.",
    pillar4Title: "4. Operasyonel dayanıklılık ve bölgesel erişim", pillar4Desc: "Bölgesel KYC seviyelerini, çekim limitlerini, API sınırlarını ve yoğun piyasa koşullarındaki çalışma geçmişini inceleriz. Erişilebilirlik marka adına göre değil, resmî koşullara göre doğrulanır.",
    wallDesc: "NexuAlpha editoryal kararları ticari ilişkilerden ayırır. İşletme giderleri borsaların standart ortaklık ödemeleriyle karşılanır; kullanıcıdan ek ücret alınmaz. Bu ödemeler ücret verilerini, puanları veya karşılaştırma sıralamasını değiştirmez.",
    feedbackDesc: "Ücret, alan adı veya rezerv kaynağı değiştiyse kanıtı Research Desk'e gönderin. Resmî ya da zincir üstü inceleme sonrası günceller, inceleme tarihini ve sınırlamaları koruruz."
  },
  fr: {
    pillar1Title: "1. Frais de base, page source et date de vérification", pillar1Desc: "Nous publions seulement ce que nous avons vérifié : les frais maker/taker de base (utilisateur standard) de chaque plateforme, la page officielle d’où ils viennent et la date de vérification. Niveaux VIP, remises en jeton et avantages restent marqués non vérifiés tant qu’aucune source officielle ne les appuie.",
    pillar2Title: "2. Preuve de réserves (PoR) et solvabilité", pillar2Desc: "Lorsqu’un instantané Merkle Tree ou un audit tiers est publié, nous enregistrons sa portée, sa date, son auditeur et ses limites. Sans source reproductible, les affirmations restent en attente.",
    pillar3Title: "3. Domaines anti-hameçonnage et voies officielles", pillar3Desc: "Nous répertorions les domaines principaux, miroirs de connexion et pages de vérification officielles avec leurs sources. Les miroirs non vérifiés déclenchent un avertissement.",
    pillar4Title: "4. Résilience opérationnelle et accès régional", pillar4Desc: "Nous vérifions le niveau de KYC, les limites de retrait, les limites API et l’historique de fonctionnement sous forte liquidité. L’accès régional se vérifie auprès de la source officielle.",
    wallDesc: "NexuAlpha sépare la rédaction des relations commerciales. Les coûts sont couverts par les commissions d’affiliation standard des plateformes, sans frais supplémentaires pour l’utilisateur. Elles ne peuvent modifier nos données, notes ou classements.",
    feedbackDesc: "Si un tarif, domaine ou document de réserves change, envoyez la source à notre équipe de recherche. Nous mettons à jour après vérification officielle ou on-chain et conservons la date et les limites."
  },
  de: {
    pillar1Title: "1. Basisgebühren, Quellseite und Prüfdatum", pillar1Desc: "Wir veröffentlichen nur Geprüftes: die Maker- und Taker-Basisgebühr (normaler Nutzer) jeder Plattform, die offizielle Gebührenseite und das Prüfdatum. VIP-Stufen, Token-Rabatte und Nutzervorteile bleiben als nicht geprüft markiert, bis eine offizielle Quelle sie belegt.",
    pillar2Title: "2. Reservenachweis (PoR) und Solvenz", pillar2Desc: "Bei einem veröffentlichten Merkle-Tree-Snapshot oder Drittgutachten erfassen wir Umfang, Datum, Prüfer und Einschränkungen. Ohne reproduzierbare Quelle bleiben Reserve- und Versicherungsangaben offen.",
    pillar3Title: "3. Phishing-Schutz und offizielle Wege", pillar3Desc: "Wir sammeln Hauptdomains, sichere Login-Mirrors und offizielle Prüfseiten mit ihren Quellen. Nicht bestätigte Mirrors erhalten einen Sicherheitshinweis.",
    pillar4Title: "4. Betriebsstabilität und regionaler Zugang", pillar4Desc: "Wir prüfen KYC-Stufe, Auszahlungslimits, API-Grenzen und die Betriebsbilanz bei hoher Marktbelastung. Regionale Verfügbarkeit wird anhand offizieller Bedingungen geprüft.",
    wallDesc: "NexuAlpha trennt redaktionelle Entscheidungen von Geschäftsbeziehungen. Der Betrieb wird durch übliche Affiliate-Zahlungen der Plattformen finanziert, ohne Zusatzkosten für Nutzer. Diese Zahlungen ändern keine Daten, Bewertungen oder Rangfolge.",
    feedbackDesc: "Wenn sich Gebühren, Domains oder Reservenachweise ändern, senden Sie die Quelle an unser Research Desk. Nach offizieller oder On-Chain-Prüfung aktualisieren wir den Eintrag und speichern Datum und Grenzen."
  },
  es: {
    pillar1Title: "1. Comisiones base, página de origen y fecha de revisión", pillar1Desc: "Solo publicamos lo que hemos revisado: la comisión maker y taker base (usuario regular) de cada plataforma, la página oficial de la que procede y la fecha de revisión. Los niveles VIP, descuentos con token y beneficios siguen marcados como no revisados hasta que una fuente oficial los respalde.",
    pillar2Title: "2. Prueba de reservas (PoR) y solvencia", pillar2Desc: "Cuando existe un snapshot de Merkle Tree o una auditoría externa, registramos alcance, fecha, auditor y limitaciones. Sin una fuente reproducible, las afirmaciones quedan pendientes.",
    pillar3Title: "3. Dominios contra el phishing y rutas oficiales", pillar3Desc: "Reunimos dominios principales, espejos de acceso y páginas oficiales de verificación con sus fuentes. Los espejos no verificados reciben una advertencia.",
    pillar4Title: "4. Resiliencia operativa y acceso regional", pillar4Desc: "Revisamos el nivel de KYC, límites de retiro, límites de API y el historial operativo bajo alta liquidez. La disponibilidad regional se confirma en la fuente oficial.",
    wallDesc: "NexuAlpha separa la edición de las relaciones comerciales. El servicio se financia con comisiones de afiliación estándar, sin coste adicional para el usuario. No pueden cambiar nuestros datos, puntuaciones ni posiciones.",
    feedbackDesc: "Si cambia una tarifa, un dominio o una fuente de reservas, envía la evidencia a nuestro Research Desk. Actualizamos tras la revisión oficial o on-chain y conservamos fecha y limitaciones."
  },
  "pt-BR": {
    pillar1Title: "1. Taxas base, página de origem e data da checagem", pillar1Desc: "Publicamos apenas o que checamos: a taxa maker e taker base (usuário regular) de cada plataforma, a página oficial de onde ela vem e a data da checagem. Níveis VIP, descontos com token e benefícios ficam marcados como não revisados até que uma fonte oficial os sustente.",
    pillar2Title: "2. Prova de reservas (PoR) e solvência", pillar2Desc: "Quando há um snapshot de Merkle Tree ou auditoria independente, registramos escopo, data, auditor e limitações. Sem fonte reproduzível, as alegações ficam pendentes.",
    pillar3Title: "3. Domínios contra phishing e rotas oficiais", pillar3Desc: "Reunimos domínios principais, espelhos seguros de login e páginas oficiais de verificação com suas fontes. Espelhos não verificados recebem um alerta.",
    pillar4Title: "4. Resiliência operacional e acesso regional", pillar4Desc: "Verificamos nível de KYC, limites de saque, limites de API e histórico operacional sob estresse de liquidez. A disponibilidade regional deve ser confirmada na fonte oficial.",
    wallDesc: "A NexuAlpha separa decisões editoriais de relações comerciais. A operação é financiada por comissões de afiliados padrão, sem custo adicional ao usuário. Elas não alteram dados, notas ou classificações.",
    feedbackDesc: "Se uma taxa, domínio ou fonte de reservas mudar, envie a evidência ao Research Desk. Atualizamos após revisão oficial ou on-chain e mantemos a data e as limitações."
  },
  ru: {
    pillar1Title: "1. Базовые комиссии, страница источника и дата проверки", pillar1Desc: "Мы публикуем только проверенное: базовую комиссию мейкера и тейкера (обычный пользователь) каждой площадки, официальную страницу комиссий и дату проверки. VIP-уровни, скидки за токен и бонусы остаются непроверенными, пока их не подтвердит официальный источник.",
    pillar2Title: "2. Подтверждение резервов (PoR) и платёжеспособность", pillar2Desc: "Для снимка Merkle Tree или аудита третьей стороны мы фиксируем охват, дату, аудитора и ограничения. Без воспроизводимого источника заявления остаются на проверке.",
    pillar3Title: "3. Домены против фишинга и официальные пути", pillar3Desc: "Мы собираем основные домены, безопасные зеркала входа и официальные страницы проверки с источниками. Неподтверждённые зеркала получают предупреждение.",
    pillar4Title: "4. Операционная устойчивость и доступ по регионам", pillar4Desc: "Мы проверяем уровень KYC, лимиты вывода, ограничения API и работу в периоды высокой нагрузки. Региональный доступ подтверждается официальными условиями.",
    wallDesc: "NexuAlpha отделяет редакционные решения от коммерческих отношений. Работа финансируется стандартными партнёрскими выплатами платформ, без доплат для пользователей. Они не меняют данные, оценки или места в сравнении.",
    feedbackDesc: "Если изменились комиссия, домен или источник резервов, отправьте подтверждение в Research Desk. После официальной или ончейн-проверки мы обновим запись и сохраним дату и ограничения."
  },
  ar: {
    pillar1Title: "1. الرسوم الأساسية وصفحة المصدر وتاريخ التحقق", pillar1Desc: "ننشر فقط ما تحققنا منه: رسوم صانع وآخذ الأساسية (المستخدم العادي) لكل منصة، وصفحة الرسوم الرسمية التي جاءت منها، وتاريخ التحقق. تبقى مستويات VIP وخصومات الرمز ومزايا المستخدم غير مراجعة حتى يدعمها مصدر رسمي.",
    pillar2Title: "2. إثبات الاحتياطيات (PoR) والملاءة", pillar2Desc: "عند توفر لقطة Merkle Tree أو تدقيق مستقل نسجل النطاق والتاريخ والمدقق والقيود. تبقى ادعاءات الاحتياطيات قيد التحقق عند غياب مصدر قابل لإعادة الإنتاج.",
    pillar3Title: "3. نطاقات مكافحة التصيد والطرق الرسمية", pillar3Desc: "نجمع النطاقات الأساسية ومرايا الدخول وصفحات التحقق الرسمية مع مصادرها. تحصل المرايا غير الموثقة على تحذير أمني.",
    pillar4Title: "4. المرونة التشغيلية والوصول الإقليمي", pillar4Desc: "نراجع مستوى KYC وحدود السحب وحدود API وسجل التشغيل أثناء ضغط السيولة. يجب تأكيد الإتاحة الإقليمية من المصدر الرسمي.",
    wallDesc: "تفصل NexuAlpha بين التحرير والعلاقات التجارية. يمول التشغيل من عمولات شراكة اعتيادية دون تكلفة إضافية للمستخدم، ولا يمكنها تغيير البيانات أو التقييمات أو الترتيب.",
    feedbackDesc: "إذا تغيرت الرسوم أو النطاق أو مصدر الاحتياطيات، أرسل الدليل إلى فريق البحث. نحدّث السجل بعد المراجعة الرسمية أو على السلسلة ونحتفظ بتاريخها وقيودها."
  },
  id: {
    pillar1Title: "1. Biaya dasar, halaman sumber, dan tanggal cek", pillar1Desc: "Kami hanya menerbitkan yang sudah dicek: biaya maker dan taker dasar (pengguna reguler) setiap platform, halaman biaya resmi sumbernya, dan tanggal pengecekan. Tingkat VIP, diskon token, dan manfaat pengguna tetap ditandai belum ditinjau sampai ada sumber resmi.",
    pillar2Title: "2. Bukti cadangan (PoR) dan solvabilitas", pillar2Desc: "Jika snapshot Merkle Tree atau audit pihak ketiga tersedia, kami mencatat cakupan, tanggal, auditor, dan batasannya. Tanpa sumber yang dapat direproduksi, klaim tetap menunggu verifikasi.",
    pillar3Title: "3. Domain anti-phishing dan jalur resmi", pillar3Desc: "Kami mengumpulkan domain utama, cermin login aman, dan halaman verifikasi resmi beserta sumbernya. Cermin yang belum terverifikasi diberi peringatan.",
    pillar4Title: "4. Ketahanan operasional dan akses wilayah", pillar4Desc: "Kami memeriksa tingkat KYC, batas penarikan, batas API, dan riwayat operasi saat likuiditas tertekan. Ketersediaan wilayah harus dikonfirmasi melalui sumber resmi.",
    wallDesc: "NexuAlpha memisahkan keputusan editorial dari hubungan komersial. Operasi didanai komisi afiliasi standar tanpa biaya tambahan bagi pengguna. Pembayaran tersebut tidak mengubah data, skor, atau peringkat.",
    feedbackDesc: "Jika biaya, domain, atau sumber cadangan berubah, kirim buktinya ke Research Desk. Kami memperbarui setelah pemeriksaan resmi atau on-chain dan menyimpan tanggal serta batasannya."
  },
  vi: {
    pillar1Title: "1. Phí cơ bản, trang nguồn và ngày kiểm tra", pillar1Desc: "Chúng tôi chỉ công bố những gì đã kiểm tra: phí maker và taker cơ bản (người dùng thường) của mỗi nền tảng, trang phí chính thức và ngày kiểm tra. Bậc VIP, giảm giá token và ưu đãi người dùng vẫn được ghi là chưa rà soát cho đến khi có nguồn chính thức.",
    pillar2Title: "2. Bằng chứng dự trữ (PoR) và khả năng thanh toán", pillar2Desc: "Khi có ảnh chụp Merkle Tree hoặc kiểm toán bên thứ ba, chúng tôi ghi lại phạm vi, ngày, đơn vị kiểm toán và giới hạn. Không có nguồn tái lập thì tuyên bố vẫn chờ xác minh.",
    pillar3Title: "3. Tên miền chống lừa đảo và đường dẫn chính thức", pillar3Desc: "Chúng tôi lập danh mục tên miền chính, mirror đăng nhập an toàn và trang xác minh chính thức kèm nguồn. Mirror chưa xác minh sẽ có cảnh báo.",
    pillar4Title: "4. Khả năng vận hành và quyền truy cập theo khu vực", pillar4Desc: "Chúng tôi kiểm tra cấp độ KYC, hạn mức rút, giới hạn API và lịch sử hoạt động khi thanh khoản chịu áp lực. Khả năng dùng theo khu vực phải được xác nhận từ nguồn chính thức.",
    wallDesc: "NexuAlpha tách quyết định biên tập khỏi quan hệ thương mại. Hoạt động được tài trợ bằng hoa hồng liên kết tiêu chuẩn mà không thu thêm phí người dùng; các khoản này không thay đổi dữ liệu, điểm số hay thứ hạng.",
    feedbackDesc: "Nếu phí, tên miền hoặc nguồn dự trữ thay đổi, hãy gửi bằng chứng cho Research Desk. Chúng tôi cập nhật sau khi kiểm tra chính thức hoặc on-chain và lưu ngày kiểm tra cùng giới hạn."
  },
  it: {
    pillar1Title: "1. Commissioni base, pagina fonte e data di verifica", pillar1Desc: "Pubblichiamo solo ciò che abbiamo verificato: la commissione maker e taker base (utente regolare) di ogni piattaforma, la pagina ufficiale da cui proviene e la data di verifica. Livelli VIP, sconti in token e vantaggi restano segnati come non verificati finché una fonte ufficiale non li conferma.",
    pillar2Title: "2. Prova delle riserve (PoR) e solvibilità", pillar2Desc: "Quando è disponibile uno snapshot Merkle Tree o un audit terzo, registriamo ambito, data, revisore e limiti. Senza una fonte riproducibile, le dichiarazioni restano in verifica.",
    pillar3Title: "3. Domini anti-phishing e percorsi ufficiali", pillar3Desc: "Raccogliamo domini principali, mirror di accesso sicuri e pagine ufficiali di verifica con le relative fonti. I mirror non verificati ricevono un avviso.",
    pillar4Title: "4. Resilienza operativa e accesso regionale", pillar4Desc: "Verifichiamo livello KYC, limiti di prelievo, limiti API e operatività durante i picchi di liquidità. La disponibilità regionale va confermata nella fonte ufficiale.",
    wallDesc: "NexuAlpha separa le decisioni editoriali dai rapporti commerciali. Il servizio è finanziato da commissioni di affiliazione standard senza costi aggiuntivi per l’utente; non modificano dati, punteggi o classifiche.",
    feedbackDesc: "Se cambiano commissioni, domini o fonti delle riserve, invia le prove al Research Desk. Aggiorniamo dopo la verifica ufficiale o on-chain conservando data e limiti."
  },
  // l10n: needs native review
  ur: {
    pillar1Title: "1. بنیادی فیس، ماخذ صفحہ اور چیک تاریخ", pillar1Desc: "ہم صرف وہی شائع کرتے ہیں جو چیک کیا گیا ہو: ہر پلیٹ فارم کی عام صارف maker/taker بنیادی فیس، اس کا سرکاری فیس صفحہ اور چیک تاریخ۔ VIP درجے، ٹوکن رعایتیں اور صارف فائدے سرکاری ماخذ سے ثابت ہونے تک غیر جائزہ شدہ رہتے ہیں۔",
    pillar2Title: "2. ذخائر کا ثبوت (PoR) اور ادائیگی صلاحیت", pillar2Desc: "جب Merkle Tree snapshot یا تیسرے فریق کا آڈٹ شائع ہو تو ہم دائرہ، تاریخ، آڈیٹر اور حدود ریکارڈ کرتے ہیں۔ قابل تکرار ماخذ کے بغیر ذخائر یا انشورنس دعوے زیر التوا رہتے ہیں۔",
    pillar3Title: "3. فشنگ مخالف ڈومینز اور سرکاری راستے", pillar3Desc: "ہم مرکزی ڈومینز، محفوظ لاگ اِن mirrors اور سرکاری تصدیقی صفحات کو ان کے ذرائع کے ساتھ درج کرتے ہیں۔ غیر تصدیق شدہ mirrors پر خطرہ دکھایا جاتا ہے۔",
    pillar4Title: "4. آپریشنل مزاحمت اور علاقائی رسائی", pillar4Desc: "ہم علاقائی KYC سطح، نکاسی حدود، API حدود اور شدید لیکویڈیٹی دباؤ میں آپریشن تاریخ چیک کرتے ہیں۔ دستیابی کو برانڈ نام سے نہیں، سرکاری شرائط سے چیک کیا جاتا ہے۔",
    wallDesc: "NexuAlpha ادارتی فیصلوں کو تجارتی تعلقات سے الگ رکھتا ہے۔ اخراجات پلیٹ فارمز کی معمول کی افیلیئٹ ادائیگیوں سے پورے ہوتے ہیں؛ صارف سے اضافی فیس نہیں لی جاتی۔ یہ ادائیگیاں فیس ڈیٹا، اسکور یا موازنہ ترتیب نہیں بدل سکتیں۔",
    feedbackDesc: "اگر فیس، ڈومین یا ذخائر کا ماخذ بدل جائے تو ثبوت Research Desk کو بھیجیں۔ سرکاری یا آن چین جائزے کے بعد ہم اپ ڈیٹ کرتے ہیں اور جائزہ تاریخ و حدود محفوظ رکھتے ہیں۔"
  },
  // l10n: needs native review
  uk: {
    pillar1Title: "1. Базові комісії, сторінка джерела й дата перевірки", pillar1Desc: "Ми публікуємо лише перевірене: базові комісії maker/taker для звичайного користувача кожної платформи, офіційну сторінку комісій і дату перевірки. VIP-рівні, токен-знижки й користувацькі переваги залишаються неперевіреними, доки їх не підтвердить офіційне джерело.",
    pillar2Title: "2. Підтвердження резервів (PoR) і платоспроможність", pillar2Desc: "Коли опубліковано snapshot Merkle Tree або аудит третьої сторони, ми записуємо охоплення, дату, аудитора й обмеження. Без відтворюваного джерела твердження про резерви чи страхування лишаються в очікуванні.",
    pillar3Title: "3. Антифішингові домени й офіційні шляхи", pillar3Desc: "Ми збираємо основні домени, безпечні дзеркала входу й офіційні сторінки перевірки разом із джерелами. Непідтверджені дзеркала отримують попередження.",
    pillar4Title: "4. Операційна стійкість і регіональний доступ", pillar4Desc: "Ми перевіряємо регіональні рівні KYC, ліміти виведення, API-обмеження й історію роботи під час стресу ліквідності. Доступність перевіряється за офіційними умовами, а не за назвою бренду.",
    wallDesc: "NexuAlpha відокремлює редакційні рішення від комерційних відносин. Витрати покриваються стандартними партнерськими виплатами платформ без додаткової плати для користувача. Ці виплати не змінюють дані комісій, оцінки чи порядок порівняння.",
    feedbackDesc: "Якщо змінилася комісія, домен або джерело резервів, надішліть доказ Research Desk. Після офіційної або ончейн-перевірки ми оновлюємо запис і зберігаємо дату та обмеження."
  }
};

// Exposed for the locale-completeness tests (tests/l10n-gaps.test.mjs).

// l10n: needs native review
researchTrustCopy.ur = { label: "تحقیقی شناخت", byline: "NexuAlpha تحقیق ڈیسک سے شائع", reviewed: "صفحہ جائزہ: {date}", assets: "ڈاؤن لوڈ ہونے والا تحقیقی ڈیٹا", perp: "دائمی معاہدہ لاگت فیلڈ لغت", funding: "علاقائی فنڈنگ تصدیقی میٹرکس", json: "JSON", csv: "CSV" };
// l10n: needs native review
researchTrustCopy.uk = { label: "Ідентичність дослідження", byline: "Опубліковано NexuAlpha Research Desk", reviewed: "Сторінку перевірено: {date}", assets: "Дослідницькі дані для завантаження", perp: "Словник полів вартості безстрокових контрактів", funding: "Матриця перевірки регіонального поповнення", json: "JSON", csv: "CSV" };
// l10n: needs native review
DATA_LICENSE_COPY.ur = { title: "NexuAlpha ڈیٹا لائسنس اور ذریعہ حد", body: "NexuAlpha ڈیٹاسیٹس تک رسائی دوبارہ تقسیم کا حق نہیں دیتی۔ NexuAlpha اپنی اصل ترتیب، فیلڈ تعریفوں، معمول بنائے گئے میٹا ڈیٹا، جائزہ نوٹس اور حد بندی متن پر حقوق محفوظ رکھتا ہے۔ تیسرے فریق کے ذریعہ دستاویزات، نام، ٹریڈ مارک اور منسلک مواد اپنے مالکان اور شرائط کے تابع رہتے ہیں۔ دوبارہ استعمال، دوبارہ اشاعت یا لائسنس کے لیے contact@nexualpha.com سے رابطہ کریں۔" };
// l10n: needs native review
DATA_LICENSE_COPY.uk = { title: "Ліцензія даних NexuAlpha і межі джерел", body: "Доступ до наборів даних NexuAlpha не надає права повторного поширення. NexuAlpha зберігає права на власну компіляцію, визначення полів, нормалізовані метадані, нотатки перевірки та тексти обмежень. Документи джерел, назви, торговельні марки й пов'язані матеріали третіх сторін лишаються під умовами їхніх власників. Для повторного використання, публікації або ліцензування пишіть на contact@nexualpha.com." };
// l10n: needs native review
REGIONAL_FUNDING_ROUTE_COPY.ur = { ...REGIONAL_FUNDING_ROUTE_COPY.en, eyebrow: "علاقائی فنڈنگ راستہ جواب", title: "بین الاقوامی صارفین کرپٹو فنڈنگ راستے کیسے چیک کریں؟", answer: "علاقائی فنڈنگ میٹرکس سے شروع کریں، پھر رہائش، شناخت، مقامی ریل اور سرکاری اکاؤنٹ چیک کے لیے مارکیٹ صفحہ کھولیں۔ خطہ، پروڈکٹ اور فنڈنگ راستہ واضح ہونے کے بعد ہی موازنہ صفحات استعمال کریں۔ یہ میٹرکس تاریخ والی تحقیقی فہرست ہے، براہ راست فیس کوٹ، اکاؤنٹ منظوری، فنڈنگ ضمانت، صارف فائدہ وعدہ یا رجسٹریشن نتیجہ نہیں۔", routesLabel: "ذریعہ سے پشتیبانی شدہ علاقائی داخلے", datasetLabel: "مشین پڑھنے کے قابل میٹرکس", compareLabel: "پھر پلیٹ فارم راستوں کا موازنہ کریں", marketRoutes: [
  ["Hong Kong", "/hk", "SFC حیثیت، HKD فنڈنگ، شناخت اور پروڈکٹ دائرہ"],
  ["European Union", "/eu", "MiCA رجسٹر سیاق، ملک کا دائرہ اور EUR یا SEPA راستہ"],
  ["United Kingdom", "/uk", "FCA سیاق، GBP فنڈنگ، رہائش اور آن بورڈنگ چیک"],
  ["Japan", "/jp?locale=ja", "FSA رجسٹریشن سیاق، JPY فنڈنگ اور اکاؤنٹ نام چیک"],
  ["Korea", "/kr?locale=ko", "KRW فنڈنگ، حقیقی نام بینک اکاؤنٹ اور شناخت چیک"],
  ["Singapore", "/sg", "MAS DPT سیاق، SGD فنڈنگ اور پروڈکٹ دائرہ"],
  ["Türkiye", "/tr/markets/turkiye", "SPK فہرست سیاق، TRY فنڈنگ اور پروڈکٹ دائرہ"],
  ["Brazil", "/br", "Pix، CPF/KYC اور BRL فنڈنگ راستہ چیک"],
  ["Mexico", "/mx", "MXN، SPEI اور شناخت چیک قبل از رجسٹریشن"],
] };
// l10n: needs native review
REGIONAL_FUNDING_ROUTE_COPY.uk = { ...REGIONAL_FUNDING_ROUTE_COPY.en, eyebrow: "Відповідь про регіональний маршрут поповнення", title: "Як міжнародним користувачам перевіряти маршрути поповнення криптоакаунта?", answer: "Почніть із регіональної матриці поповнення, потім відкрийте сторінку ринку для перевірки резиденції, ідентифікації, локального каналу й офіційного акаунта. Сторінки порівнянь використовуйте лише після ясності щодо регіону, продукту й маршруту поповнення. Матриця є датованим дослідницьким списком, а не живою котировкою комісій, обіцянкою схвалення акаунта, гарантією поповнення, обіцянкою користувацької вигоди або результатом реєстрації.", routesLabel: "Регіональні входи з джерелами", datasetLabel: "Машинозчитувана матриця", compareLabel: "Потім порівняйте маршрути платформ", marketRoutes: [
  ["Hong Kong", "/hk", "Статус SFC, поповнення HKD, ідентифікація й охоплення продуктів"],
  ["European Union", "/eu", "Контекст реєстру MiCA, охоплення країни та маршрут EUR або SEPA"],
  ["United Kingdom", "/uk", "Контекст FCA, поповнення GBP, резиденція й перевірки онбордингу"],
  ["Japan", "/jp?locale=ja", "Контекст реєстрації FSA, поповнення JPY і перевірки імені акаунта"],
  ["Korea", "/kr?locale=ko", "Поповнення KRW, банківський рахунок на справжнє ім'я та перевірка особи"],
  ["Singapore", "/sg", "Контекст MAS DPT, поповнення SGD і охоплення продуктів"],
  ["Türkiye", "/tr/markets/turkiye", "Контекст списку SPK, поповнення TRY і охоплення продуктів"],
  ["Brazil", "/br", "Pix, CPF/KYC і перевірки маршруту поповнення BRL"],
  ["Mexico", "/mx", "MXN, SPEI й перевірка особи перед реєстрацією"],
] };
// l10n: needs native review
methodologyCopy.ur = { ...methodologyCopy.en, badge: "E-E-A-T ادارہ جاتی تحقیقی معیار", title: "NexuAlpha تشخیصی طریقہ کار اور ڈیٹا آڈٹ فریم ورک", subtitle: "ہم واضح کرتے ہیں کہ پلیٹ فارم فیس، ذخائر کے ثبوت اور عملی سلامتی کو شفاف طریقے سے کیسے چیک کرتے ہیں۔", lastUpdated: "آخری نظر ثانی: {date} · تفصیلات {version}", pill1: "قابل پیروی ذرائع", pill2: "کوئی ادا شدہ درجہ بندی نہیں", pill3: "آن چین سالوینسی آڈٹ", pillarsTitle: "چار تشخیصی ستون", pillarsSummary: "معیار اور ڈیٹا حدود دیکھیں", pillar1Title: "1. بنیادی فیس، ماخذ صفحہ اور جانچ کی تاریخ", pillar1Desc: "ہم صرف وہی شائع کرتے ہیں جو چیک کیا گیا ہو: ہر پلیٹ فارم کی عام صارف maker/taker بنیادی فیس، سرکاری فیس صفحہ اور جانچ کی تاریخ۔ VIP سطحیں، ٹوکن رعایتیں اور صارف فوائد سرکاری ماخذ تک غیر جائزہ شدہ رہتے ہیں۔", pillar2Title: "2. ذخائر کا ثبوت (PoR) اور ادائیگی کی صلاحیت", pillar2Desc: "Merkle Tree snapshot یا تیسرے فریق آڈٹ دستیاب ہو تو ہم دائرہ، تاریخ، آڈیٹر اور حدود درج کرتے ہیں۔ قابل تکرار ماخذ کے بغیر دعوے زیر تصدیق رہتے ہیں۔", pillar3Title: "3. اینٹی فشنگ ڈومینز اور سرکاری راستے", pillar3Desc: "ہم مرکزی ڈومینز، محفوظ لاگ ان mirrors اور سرکاری تصدیقی صفحات کو ان کے ماخذوں کے ساتھ جمع کرتے ہیں۔ غیر تصدیق شدہ mirrors کو انتباہ ملتا ہے۔", pillar4Title: "4. عملی مضبوطی اور علاقائی رسائی", pillar4Desc: "ہم KYC سطح، ودڈرال حدود، API حدود اور زیادہ مارکیٹ دباؤ کے دوران کام کرنے کی تاریخ دیکھتے ہیں۔ علاقائی دستیابی سرکاری ماخذ سے تصدیق ہوتی ہے۔", wallTitle: "ادارتی آزادی اور تجارتی علیحدگی", wallDesc: "NexuAlpha ادارتی فیصلوں کو تجارتی تعلقات سے الگ رکھتا ہے۔ آپریشن معیاری affiliate ادائیگیوں سے چلتا ہے، صارف پر اضافی لاگت نہیں۔ یہ ادائیگیاں ڈیٹا، اسکور یا ترتیب تبدیل نہیں کر سکتیں۔", feedbackTitle: "ڈیٹا درستگی اور کمیونٹی نگرانی", feedbackDesc: "اگر فیس، ڈومین یا ذخائر کا ماخذ بدلے تو ثبوت Research Desk کو بھیجیں۔ ہم سرکاری یا آن چین جانچ کے بعد اپ ڈیٹ کرتے ہیں اور تاریخ و حدود محفوظ رکھتے ہیں۔", btnBack: "← ٹرمینل پر واپس", btnTg: "Telegram پر تحقیق ٹیم سے رابطہ" };
// l10n: needs native review
methodologyCopy.uk = { ...methodologyCopy.en, badge: "Інституційні стандарти досліджень E-E-A-T", title: "Методологія оцінювання NexuAlpha і рамка аудиту даних", subtitle: "Як ми прозоро перевіряємо комісії платформ, Proof of Reserves і операційну безпеку.", lastUpdated: "Останній перегляд: {date} · специфікація {version}", pill1: "Джерела, які можна простежити", pill2: "Без платного ранжування", pill3: "Ончейн-аудит платоспроможності", pillarsTitle: "Чотири опори оцінювання", pillarsSummary: "Переглянути стандарти й межі даних", pillar1Title: "1. Базові комісії, сторінка джерела й дата перевірки", pillar1Desc: "Ми публікуємо лише перевірене: базову комісію maker/taker для звичайного користувача кожної платформи, офіційну сторінку комісій і дату перевірки. Рівні VIP, знижки токеном і переваги користувача лишаються неперевіреними, доки їх не підтвердить офіційне джерело.", pillar2Title: "2. Proof of Reserves і платоспроможність", pillar2Desc: "Коли доступний snapshot Merkle Tree або сторонній аудит, ми записуємо охоплення, дату, аудитора й обмеження. Без відтворюваного джерела твердження лишаються на перевірці.", pillar3Title: "3. Домени проти фішингу й офіційні маршрути", pillar3Desc: "Ми збираємо основні домени, безпечні дзеркала входу й офіційні сторінки перевірки з їхніми джерелами. Неперевірені дзеркала отримують попередження.", pillar4Title: "4. Операційна стійкість і регіональний доступ", pillar4Desc: "Ми перевіряємо рівень KYC, ліміти виведення, обмеження API й історію роботи під час високого ринкового навантаження. Регіональна доступність підтверджується офіційним джерелом.", wallTitle: "Редакційна незалежність і комерційне відокремлення", wallDesc: "NexuAlpha відокремлює редакційні рішення від комерційних відносин. Робота фінансується стандартними affiliate-виплатами платформ без додаткової вартості для користувача. Вони не можуть змінювати дані, оцінки чи порядок.", feedbackTitle: "Виправлення даних і нагляд спільноти", feedbackDesc: "Якщо змінюється комісія, домен або джерело резервів, надішліть доказ до Research Desk. Ми оновлюємо після офіційної або ончейн-перевірки й зберігаємо дату та обмеження.", btnBack: "← Назад до термінала", btnTg: "Зв'язатися з дослідницькою командою в Telegram" };

export const methodologyCopyMaps = Object.freeze({ methodologyCopy, methodologyDetails, researchTrustCopy, DATA_LICENSE_COPY, REGIONAL_FUNDING_ROUTE_COPY });

export function MethodologyPage({ locale = "en" }) {
  const base = methodologyCopy[locale] || methodologyCopy[String(locale || "").split("-")[0]] || (locale === "zh-TW" || locale === "zh-HK" ? methodologyCopy["zh-Hant"] : locale.startsWith("zh") ? methodologyCopy["zh-Hans"] : methodologyCopy.en);
  const methodologyH1 = {
    fr: "Méthodologie d’évaluation et cadre d’audit des données NexuAlpha",
    de: "NexuAlpha-Bewertungsmethodik und Datenprüfungsrahmen",
  }[String(locale || "").split("-")[0]];
  const t = { ...base, ...(methodologyDetails[locale] || methodologyDetails[String(locale || "").split("-")[0]] || {}), ...(methodologyH1 ? { title: methodologyH1 } : {}) };
  // Dates come from Intl, not from the copy: "2026-09" → "September 2026" / "2026年9月" / "settembre 2026".
  const lastUpdated = String(t.lastUpdated).replace("{date}", formatMonthYear(locale, METHODOLOGY_REVISED_MONTH)).replace("{version}", METHODOLOGY_SPEC_VERSION);
  const reviewedOn = formatDate(locale, RESEARCH_PAGE_REVIEWED_AT, { dateStyle: "medium" });
  const trust = researchTrustCopy[locale] || researchTrustCopy[String(locale || "").split("-")[0]] || (locale.startsWith("zh") ? researchTrustCopy["zh-Hans"] : researchTrustCopy.en);
  const dataLicense = DATA_LICENSE_COPY[locale] || DATA_LICENSE_COPY[String(locale || "").split("-")[0]] || (locale.startsWith("zh") ? DATA_LICENSE_COPY["zh-Hans"] : DATA_LICENSE_COPY.en);
  const fundingRoute = REGIONAL_FUNDING_ROUTE_COPY[locale] || REGIONAL_FUNDING_ROUTE_COPY[String(locale || "").split("-")[0]] || (locale.startsWith("zh") ? REGIONAL_FUNDING_ROUTE_COPY["zh-Hans"] : REGIONAL_FUNDING_ROUTE_COPY.en);

  return (
    <main className="v6 methodology-page v2-page" id="top" lang={locale} dir={getTextDirection(locale)}>
      <div className="methodology-page__inner v2-shell">
        <header className="methodology-page__header">
          <div className="methodology-page__badge-row">
            <span className="methodology-page__date"><time dateTime={METHODOLOGY_REVISED_MONTH}>{lastUpdated}</time></span>
          </div>
          <h1 className="methodology-page__title">{t.title}</h1>
          <p data-aeo-extractable-answer>{organizationDescription(locale)}</p>
          <p className="methodology-page__subtitle">{t.subtitle}</p>

          <aside className="methodology-page__research-trust" aria-label={trust.label}>
            <div className="methodology-page__research-byline">
              <strong>{trust.byline}</strong>
              <time dateTime="2026-09-15">{String(trust.reviewed).replace("{date}", reviewedOn)}</time>
            </div>
            <div className="methodology-page__research-assets">
              <span>{trust.assets}</span>
              <span>
                {trust.perp}: <a href="/research/perp-dex-cost-field-dictionary.json">{trust.json}</a> · <a href="/research/perp-dex-cost-field-dictionary.csv">{trust.csv}</a>
              </span>
              <span>
                {trust.funding}: <a href="/research/regional-funding-verification-matrix.json">{trust.json}</a> · <a href="/research/regional-funding-verification-matrix.csv">{trust.csv}</a>
              </span>
            </div>
          </aside>

        </header>

        <section className="methodology-page__section" aria-labelledby="methodology-pillars-title">
          <h2 className="methodology-page__sec-title" id="methodology-pillars-title">{t.pillarsTitle}</h2>
          <div className="methodology-pillars-list">
            <div className="methodology-pillars-grid">
              <article className="methodology-pillar-card">
                <h3>{unnumbered(t.pillar1Title)}</h3>
                <p>{t.pillar1Desc}</p>
              </article>
              <article className="methodology-pillar-card">
                <h3>{unnumbered(t.pillar2Title)}</h3>
                <p>{t.pillar2Desc}</p>
              </article>
              <article className="methodology-pillar-card">
                <h3>{unnumbered(t.pillar3Title)}</h3>
                <p>{t.pillar3Desc}</p>
              </article>
              <article className="methodology-pillar-card">
                <h3>{unnumbered(t.pillar4Title)}</h3>
                <p>{t.pillar4Desc}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="methodology-page__wall-card" id="disclosure" aria-labelledby="methodology-disclosure-title">
          <div className="methodology-page__wall-icon" aria-hidden="true"></div>
          <div className="methodology-page__wall-content">
            <h2 id="methodology-disclosure-title">{t.wallTitle}</h2>
            <p>{t.wallDesc}</p>
          </div>
        </section>

        <section className="methodology-page__funding-answer" id="regional-funding-routes" aria-labelledby="methodology-regional-funding-title" {...enFallback(fundingRoute, REGIONAL_FUNDING_ROUTE_COPY.en, locale)}>
          <div className="methodology-page__funding-copy">
            <span className="methodology-page__funding-eyebrow">{fundingRoute.eyebrow}</span>
            <h2 id="methodology-regional-funding-title">{fundingRoute.title}</h2>
            <p data-aeo-extractable-answer>{fundingRoute.answer}</p>
            <div className="methodology-page__funding-assets" role="group" aria-label={fundingRoute.datasetLabel}>
              <strong>{fundingRoute.datasetLabel}</strong>
              <a href="/research/regional-funding-verification-matrix.json">JSON</a>
              <a href="/research/regional-funding-verification-matrix.csv">CSV</a>
            </div>
          </div>
          <div className="methodology-page__funding-links">
            <div>
              <h3>{fundingRoute.routesLabel}</h3>
              <ul>
                {fundingRoute.marketRoutes.map(([label, href, detail]) => (
                  <li key={href}>
                    <a href={localizedHref(href, { locale })}>{label}</a>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>{fundingRoute.compareLabel}</h3>
              <ul>
                {withoutTurkeyUnlisted(fundingRoute.compareLinks, { locale }, ([, href]) => href).map(([label, href]) => (
                  <li key={href}>
                    <a href={localizedHref(href, { locale })}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="methodology-page__feedback-card" id="data-license" aria-labelledby="methodology-data-license-title" {...enFallback(dataLicense, DATA_LICENSE_COPY.en, locale)}>
          <div className="methodology-page__feedback-left">
            <h2 id="methodology-data-license-title">{dataLicense.title}</h2>
            <p>{dataLicense.body}</p>
          </div>
          <div className="methodology-page__feedback-actions">
            <a href="mailto:contact@nexualpha.com?subject=NexuAlpha%20data%20license" className="button-quiet">
              contact@nexualpha.com
            </a>
          </div>
        </section>

        <section className="methodology-page__feedback-card" aria-labelledby="methodology-feedback-title">
          <div className="methodology-page__feedback-left">
            <h2 id="methodology-feedback-title">{t.feedbackTitle}</h2>
            <p>{t.feedbackDesc}</p>
          </div>
          <div className="methodology-page__feedback-actions">
            <a href="https://t.me/NexuAlphaAssistantBot" target="_blank" rel="noopener noreferrer" className="button-quiet">
              {t.btnTg} ↗
            </a>
            <a href={localizedHref("/", { locale })} className="button-quiet">
              {t.btnBack}
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

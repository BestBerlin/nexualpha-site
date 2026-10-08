import { NexuAlphaWordmark } from "../brand/NexuAlphaWordmark";
import { localizedHref } from "../../data/locale-routing.js";
import { getTextDirection } from "../../paraglide/runtime.js";
import "./methodology-page.css";

const researchTrustCopy = {
  en: { label: "Research identity", byline: "Published by NexuAlpha Research Desk", reviewed: "Page reviewed 2026-09-15", assets: "Downloadable research data", perp: "Perp cost-field dictionary", funding: "Regional funding verification matrix", json: "JSON", csv: "CSV" },
  "zh-Hans": { label: "研究身份", byline: "由 NexuAlpha 研究团队发布", reviewed: "页面复核：2026-09-15", assets: "可下载研究数据", perp: "永续合约成本字段字典", funding: "区域入金核验矩阵", json: "JSON", csv: "CSV" },
  "zh-Hant": { label: "研究身分", byline: "由 NexuAlpha 研究團隊發布", reviewed: "頁面複核：2026-09-15", assets: "可下載研究資料", perp: "永續合約成本欄位字典", funding: "區域入金核驗矩陣", json: "JSON", csv: "CSV" },
  es: { label: "Identidad de investigación", byline: "Publicado por NexuAlpha Research Desk", reviewed: "Página revisada: 2026-09-15", assets: "Datos de investigación descargables", perp: "Diccionario de costes de perpetuos", funding: "Matriz regional de verificación de fondos", json: "JSON", csv: "CSV" },
  "pt-BR": { label: "Identidade da pesquisa", byline: "Publicado pela equipe de pesquisa NexuAlpha", reviewed: "Página revisada: 2026-09-15", assets: "Dados de pesquisa para download", perp: "Dicionário de custos de perpétuos", funding: "Matriz regional de verificação de depósitos", json: "JSON", csv: "CSV" },
  fr: { label: "Identité de la recherche", byline: "Publié par le NexuAlpha Research Desk", reviewed: "Page révisée : 2026-09-15", assets: "Données de recherche téléchargeables", perp: "Dictionnaire des coûts des perpétuels", funding: "Matrice régionale de vérification des dépôts", json: "JSON", csv: "CSV" },
  de: { label: "Forschungsidentität", byline: "Veröffentlicht vom NexuAlpha Research Desk", reviewed: "Seite geprüft: 2026-09-15", assets: "Herunterladbare Forschungsdaten", perp: "Kostenfeld-Lexikon für Perpetuals", funding: "Regionale Einzahlungs-Prüfmatrix", json: "JSON", csv: "CSV" },
  ja: { label: "調査主体", byline: "NexuAlpha Research Desk が公開", reviewed: "ページ確認日：2026-09-15", assets: "ダウンロード可能な調査データ", perp: "無期限契約のコスト項目辞書", funding: "地域別入金確認マトリクス", json: "JSON", csv: "CSV" },
  ko: { label: "연구 주체", byline: "NexuAlpha Research Desk 게시", reviewed: "페이지 검토일: 2026-09-15", assets: "다운로드 가능한 연구 데이터", perp: "무기한 계약 비용 필드 사전", funding: "지역별 입금 검증 매트릭스", json: "JSON", csv: "CSV" },
  ar: { label: "هوية البحث", byline: "منشور بواسطة فريق أبحاث NexuAlpha", reviewed: "تمت مراجعة الصفحة: 2026-09-15", assets: "بيانات بحث قابلة للتنزيل", perp: "قاموس حقول تكلفة العقود الدائمة", funding: "مصفوفة التحقق من التمويل الإقليمي", json: "JSON", csv: "CSV" },
  tr: { label: "Araştırma kimliği", byline: "NexuAlpha Research Desk tarafından yayımlandı", reviewed: "Sayfa inceleme tarihi: 2026-09-15", assets: "İndirilebilir araştırma verileri", perp: "Sürekli vadeli maliyet alanları sözlüğü", funding: "Bölgesel fonlama doğrulama matrisi", json: "JSON", csv: "CSV" },
  ru: { label: "Авторство исследования", byline: "Опубликовано NexuAlpha Research Desk", reviewed: "Страница проверена: 2026-09-15", assets: "Данные для скачивания", perp: "Словарь полей стоимости бессрочных контрактов", funding: "Матрица проверки регионального пополнения", json: "JSON", csv: "CSV" },
  id: { label: "Identitas riset", byline: "Diterbitkan oleh NexuAlpha Research Desk", reviewed: "Halaman ditinjau: 2026-09-15", assets: "Data riset yang dapat diunduh", perp: "Kamus bidang biaya perpetual", funding: "Matriks verifikasi pendanaan regional", json: "JSON", csv: "CSV" },
  vi: { label: "Danh tính nghiên cứu", byline: "Được xuất bản bởi NexuAlpha Research Desk", reviewed: "Trang được rà soát: 2026-09-15", assets: "Dữ liệu nghiên cứu có thể tải xuống", perp: "Từ điển trường chi phí hợp đồng vĩnh cửu", funding: "Ma trận xác minh nạp tiền theo khu vực", json: "JSON", csv: "CSV" },
  it: { label: "Identità della ricerca", byline: "Pubblicato dal NexuAlpha Research Desk", reviewed: "Pagina verificata: 2026-09-15", assets: "Dati di ricerca scaricabili", perp: "Dizionario dei costi dei perpetual", funding: "Matrice regionale di verifica dei depositi", json: "JSON", csv: "CSV" },
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
};

// Pillars are a set, not a sequence: the "1." … "4." prefixes in the copy are not shown.
const unnumbered = (t) => String(t || "").replace(/^\s*\d+\.\s*/, "");

const methodologyCopy = {
  "zh-Hans": {
    badge: "E-E-A-T 机构级评审准则",
    title: "NexuAlpha 评测方法论与数据审计标准",
    subtitle: "我们如何核对交易所费率、储备金披露与官方域名，以及每条记录背后的来源、日期与限制。",
    lastUpdated: "最后修订：2026-09（v3.8 规范）",
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
    lastUpdated: "Last revised 2026-09 · specification v3.8",
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

methodologyCopy.ja = { ...methodologyCopy.en, badge: "E-E-A-T 機関レベルの調査基準", title: "NexuAlpha 評価方法論とデータ監査フレームワーク", subtitle: "取引所の手数料、Proof of Reserves、運用上の安全性をどのように検証するかを公開します。", lastUpdated: "最終更新：2026-09（v3.8）", pill1: "追跡可能な出典", pill2: "有料順位なし", pill3: "オンチェーン監査", pillarsTitle: "4つの評価基準", pillarsSummary: "評価基準とデータ範囲を見る", wallTitle: "編集独立性と商業分離", feedbackTitle: "データ訂正とコミュニティ監督", btnBack: "← 端末に戻る", btnTg: "Telegramで調査チームに連絡" };
methodologyCopy.ko = { ...methodologyCopy.en, badge: "E-E-A-T 기관급 연구 기준", title: "NexuAlpha 평가 방법론 및 데이터 감사 프레임워크", subtitle: "거래소 수수료, Proof of Reserves와 운영 보안을 검증하는 방식을 공개합니다.", lastUpdated: "최종 수정: 2026-09 (v3.8)", pill1: "추적 가능한 출처", pill2: "유료 순위 없음", pill3: "온체인 감사", pillarsTitle: "4가지 평가 기준", pillarsSummary: "평가 기준과 데이터 범위 보기", wallTitle: "편집 독립성과 상업적 분리", feedbackTitle: "데이터 정정 및 커뮤니티 감독", btnBack: "← 터미널로 돌아가기", btnTg: "Telegram에서 리서치 팀에 문의" };
methodologyCopy.tr = { ...methodologyCopy.en, badge: "E-E-A-T kurumsal araştırma standartları", title: "NexuAlpha değerlendirme yöntemi ve veri denetimi", subtitle: "Platform ücretlerini, Proof of Reserves verilerini ve operasyonel güvenliği nasıl doğruladığımızı açıklıyoruz.", lastUpdated: "Son güncelleme: 2026-09 (v3.8)", pill1: "İzlenebilir kaynaklar", pill2: "Ücretli sıralama yok", pill3: "On-chain denetim", pillarsTitle: "Dört değerlendirme standardı", pillarsSummary: "Standartları ve veri sınırlarını gör", wallTitle: "Editoryal bağımsızlık ve ticari ayrım", feedbackTitle: "Veri düzeltme ve topluluk denetimi", btnBack: "← Terminale dön", btnTg: "Telegram'da araştırma ekibine ulaş" };
methodologyCopy.es = { ...methodologyCopy.en, badge: "Estándares de investigación institucional E-E-A-T", title: "Metodología de evaluación y marco de auditoría de datos de NexuAlpha", subtitle: "Cómo verificamos de forma transparente las comisiones de plataformas, Proof of Reserves y seguridad operativa.", lastUpdated: "Última revisión: 2026-09 (v3.8)", pill1: "Fuentes rastreables", pill2: "Sin ranking pagado", pill3: "Auditoría on-chain", pillarsTitle: "Cuatro pilares de evaluación", pillarsSummary: "Ver estándares y límites de datos", wallTitle: "Independencia editorial y separación comercial", feedbackTitle: "Corrección de datos y supervisión comunitaria", btnBack: "← Volver al terminal", btnTg: "Contactar al equipo de investigación en Telegram" };
methodologyCopy["pt-BR"] = { ...methodologyCopy.en, badge: "Padrões institucionais de pesquisa E-E-A-T", title: "Metodologia de avaliação e estrutura de auditoria de dados da NexuAlpha", subtitle: "Como verificamos taxas de plataformas, Proof of Reserves e segurança operacional de forma transparente.", lastUpdated: "Última revisão: 2026-09 (v3.8)", pill1: "Fontes rastreáveis", pill2: "Sem ranking pago", pill3: "Auditoria on-chain", pillarsTitle: "Quatro pilares de avaliação", pillarsSummary: "Ver padrões e limites dos dados", wallTitle: "Independência editorial e separação comercial", feedbackTitle: "Correção de dados e supervisão da comunidade", btnBack: "← Voltar ao terminal", btnTg: "Contatar a equipe de pesquisa no Telegram" };


methodologyCopy.ar = { ...methodologyCopy.en, badge: "معايير بحث مؤسسية وفق E-E-A-T", title: "منهجية تقييم NexuAlpha وإطار تدقيق البيانات", subtitle: "نوضح كيف نتحقق من رسوم المنصات وإثبات الاحتياطيات والأمان التشغيلي بطريقة شفافة وقابلة للمراجعة.", lastUpdated: "آخر تحديث: 2026-09 (الإصدار 3.8)", pill1: "مصادر قابلة للتتبع", pill2: "لا ترتيب مدفوع", pill3: "تدقيق للاحتياطيات على السلسلة", pillarsTitle: "أربع ركائز للتقييم", pillarsSummary: "عرض معايير التقييم وحدود البيانات", wallTitle: "الاستقلال التحريري والفصل التجاري", feedbackTitle: "تصحيح البيانات والرقابة المجتمعية", btnBack: "← العودة إلى محطة التداول", btnTg: "التواصل مع فريق البحث عبر Telegram" };


methodologyCopy.id = { ...methodologyCopy.en, badge: "Standar riset institusional E-E-A-T", title: "Metodologi riset dan kerangka audit data NexuAlpha", subtitle: "Cara kami memverifikasi biaya platform, Proof of Reserves, dan keamanan operasional secara transparan.", lastUpdated: "Pembaruan terakhir: 2026-09 (v3.8)", pill1: "Sumber terlacak", pill2: "Tanpa peringkat berbayar", pill3: "Audit solvabilitas on-chain", pillarsTitle: "Empat pilar evaluasi", pillarsSummary: "Lihat standar evaluasi dan batas data", wallTitle: "Independensi editorial dan pemisahan komersial", feedbackTitle: "Koreksi data dan pengawasan komunitas", btnBack: "← Kembali ke terminal", btnTg: "Hubungi tim riset di Telegram" };
methodologyCopy.vi = { ...methodologyCopy.en, badge: "Tiêu chuẩn nghiên cứu tổ chức E-E-A-T", title: "Phương pháp đánh giá và khung kiểm toán dữ liệu NexuAlpha", subtitle: "Cách chúng tôi xác minh phí nền tảng, Proof of Reserves và an toàn vận hành một cách minh bạch.", lastUpdated: "Cập nhật lần cuối: 2026-09 (v3.8)", pill1: "Nguồn có thể truy xuất", pill2: "Không xếp hạng trả phí", pill3: "Kiểm toán khả năng thanh toán on-chain", pillarsTitle: "Bốn trụ cột đánh giá", pillarsSummary: "Xem tiêu chuẩn và giới hạn dữ liệu", wallTitle: "Độc lập biên tập và tách biệt thương mại", feedbackTitle: "Sửa dữ liệu và giám sát cộng đồng", btnBack: "← Quay lại terminal", btnTg: "Liên hệ nhóm nghiên cứu trên Telegram" };
methodologyCopy.it = { ...methodologyCopy.en, badge: "Standard di ricerca istituzionale E-E-A-T", title: "Metodologia di valutazione e framework di audit dei dati NexuAlpha", subtitle: "Come verifichiamo in modo trasparente commissioni, Proof of Reserves e sicurezza operativa.", lastUpdated: "Ultimo aggiornamento: 2026-09 (v3.8)", pill1: "Fonti tracciabili", pill2: "Nessuna classifica a pagamento", pill3: "Audit di solvibilità on-chain", pillarsTitle: "Quattro pilastri di valutazione", pillarsSummary: "Visualizza standard e limiti dei dati", wallTitle: "Indipendenza editoriale e separazione commerciale", feedbackTitle: "Correzione dei dati e controllo della comunità", btnBack: "← Torna al terminale", btnTg: "Contatta il team di ricerca su Telegram" };

methodologyCopy.ru = { ...methodologyCopy.en, badge: "Институциональные стандарты исследований E-E-A-T", title: "Методология оценки и аудит данных NexuAlpha", subtitle: "Как мы прозрачно проверяем комиссии платформ, Proof of Reserves и операционную безопасность.", lastUpdated: "Последнее обновление: 2026-09 (v3.8)", pill1: "Отслеживаемые источники", pill2: "Без платного ранжирования", pill3: "Ончейн-аудит платёжеспособности", pillarsTitle: "Четыре опоры оценки", pillarsSummary: "Стандарты оценки и границы данных", wallTitle: "Редакционная независимость и коммерческое разделение", feedbackTitle: "Исправление данных и контроль сообщества", btnBack: "← Вернуться к терминалу", btnTg: "Связаться с исследовательской командой в Telegram" };

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
  }
};

export function MethodologyPage({ locale = "en" }) {
  const base = methodologyCopy[locale] || methodologyCopy[String(locale || "").split("-")[0]] || (locale.startsWith("zh") ? methodologyCopy["zh-Hans"] : methodologyCopy.en);
  const methodologyH1 = {
    fr: "Méthodologie d’évaluation et cadre d’audit des données NexuAlpha",
    de: "NexuAlpha-Bewertungsmethodik und Datenprüfungsrahmen",
  }[String(locale || "").split("-")[0]];
  const t = { ...base, ...(methodologyDetails[locale] || methodologyDetails[String(locale || "").split("-")[0]] || {}), ...(methodologyH1 ? { title: methodologyH1 } : {}) };
  const trust = researchTrustCopy[locale] || researchTrustCopy[String(locale || "").split("-")[0]] || (locale.startsWith("zh") ? researchTrustCopy["zh-Hans"] : researchTrustCopy.en);
  const dataLicense = DATA_LICENSE_COPY[locale] || DATA_LICENSE_COPY[String(locale || "").split("-")[0]] || (locale.startsWith("zh") ? DATA_LICENSE_COPY["zh-Hans"] : DATA_LICENSE_COPY.en);
  const fundingRoute = REGIONAL_FUNDING_ROUTE_COPY[locale] || REGIONAL_FUNDING_ROUTE_COPY[String(locale || "").split("-")[0]] || REGIONAL_FUNDING_ROUTE_COPY.en;

  return (
    <main className="v6 methodology-page v2-page" id="top" lang={locale} dir={getTextDirection(locale)}>
      <div className="methodology-page__inner v2-shell">
        <header className="methodology-page__header">
          <div className="methodology-page__badge-row">
            <span className="methodology-page__date">{t.lastUpdated}</span>
          </div>
          <h1 className="methodology-page__title">{t.title}</h1>
          <p className="methodology-page__subtitle">{t.subtitle}</p>

          <aside className="methodology-page__research-trust" aria-label={trust.label}>
            <div className="methodology-page__research-byline">
              <strong>{trust.byline}</strong>
              <time dateTime="2026-09-15">{trust.reviewed}</time>
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

        <section className="methodology-page__funding-answer" id="regional-funding-routes" aria-labelledby="methodology-regional-funding-title">
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
                {fundingRoute.compareLinks.map(([label, href]) => (
                  <li key={href}>
                    <a href={localizedHref(href, { locale })}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="methodology-page__feedback-card" id="data-license" aria-labelledby="methodology-data-license-title">
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

// Topic clusters and tool <-> article cross-links (links-l10n lane, 2026-10-11; scorecard C5 + D4).
//
// One mapping drives three things, so they can never disagree:
//   1. C5 query families: every Google Search Console query family has one main page (`path`). `query` classifies GSC
//      queries into families (scripts/topic-clusters-report.mjs writes docs/company/topic-clusters.md from it).
//   2. Article -> main page: an article whose title / slug / primary keyword (or summary, where `summary` is set) matches
//      a cluster ends with a "Topic hubs & tools" line linking that cluster's main page (NewsDetailPage + the Worker's
//      fallback body, both through articleClusterLinks).
//   3. Tool page -> articles: the data/tool pages (/liquidations, /funding-rates, /rates, /compare, /activities and the
//      compare pairs) list the newest matching articles (toolArticleLinks), computed on the server from the live feed.
// Pure functions only (Worker, SSR, build scripts and the news route chunk share it); no fetch, no DOM.
import { localizedPath } from "./locale-routing.js";
import { hasNewsArticleLocale, localizedNewsTitle, localizedValue, newsArticleUrl } from "./news-feed-client.js";
import { BRAZIL_DEADLINE_PATH_EN, BRAZIL_DEADLINE_PATH_PT } from "./brazil-vasp-deadline-slugs.js";
import { tsArticleLinks } from "./tokenized-stocks-news.js";

const LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"];

// "<Venue> profile & fees" and "Compare A vs B" templates (venue / compare clusters).
const PROFILE_LABEL = {
  en: (n) => `${n} profile & fees`, "zh-Hans": (n) => `${n} 平台档案与费率`, "zh-Hant": (n) => `${n} 平台檔案與費率`,
  es: (n) => `Perfil y comisiones de ${n}`, "pt-BR": (n) => `Perfil e taxas da ${n}`, fr: (n) => `Profil et frais ${n}`,
  de: (n) => `${n}: Profil und Gebühren`, it: (n) => `Profilo e commissioni ${n}`, ja: (n) => `${n} の概要と手数料`,
  ko: (n) => `${n} 프로필과 수수료`, ru: (n) => `${n}: профиль и комиссии`, tr: (n) => `${n} profili ve ücretleri`,
  id: (n) => `Profil dan biaya ${n}`, vi: (n) => `Hồ sơ và phí ${n}`, ar: (n) => `ملف ${n} ورسومها`,
  // l10n: needs native review
  ur: (n) => `${n} پروفائل اور فیس`,
  // l10n: needs native review
  uk: (n) => `${n}: профіль і комісії`,
};
const COMPARE_LABEL = {
  en: (a, b) => `Compare ${a} vs ${b}`, "zh-Hans": (a, b) => `对比 ${a} 与 ${b}`, "zh-Hant": (a, b) => `比較 ${a} 與 ${b}`,
  es: (a, b) => `Comparar ${a} y ${b}`, "pt-BR": (a, b) => `Comparar ${a} e ${b}`, fr: (a, b) => `Comparer ${a} et ${b}`,
  de: (a, b) => `${a} und ${b} vergleichen`, it: (a, b) => `Confronta ${a} e ${b}`, ja: (a, b) => `${a} と ${b} を比較`,
  ko: (a, b) => `${a} vs ${b} 비교`, ru: (a, b) => `Сравнить ${a} и ${b}`, tr: (a, b) => `${a} ile ${b} karşılaştırması`,
  id: (a, b) => `Bandingkan ${a} vs ${b}`, vi: (a, b) => `So sánh ${a} và ${b}`, ar: (a, b) => `مقارنة ${a} و${b}`,
  // l10n: needs native review
  ur: (a, b) => `${a} اور ${b} کا موازنہ`,
  // l10n: needs native review
  uk: (a, b) => `Порівняти ${a} і ${b}`,
};

const L = (values) => Object.freeze(Object.fromEntries(LOCALES.map((locale, index) => [locale, values[index]])));

// Labels of tool, topic-hub, category and pillar-article clusters, in LOCALES order.
const LABELS = {
  liquidations: L(["Crypto liquidations tracker", "加密货币爆仓数据", "加密貨幣爆倉數據", "Liquidaciones cripto", "Liquidações cripto", "Liquidations crypto", "Krypto-Liquidationen", "Liquidazioni crypto", "暗号資産の清算データ", "암호화폐 청산 데이터", "Ликвидации на криптобиржах", "Kripto likidasyonları", "Data likuidasi kripto", "Dữ liệu thanh lý tiền mã hóa", "تصفيات العملات الرقمية", "کرپٹو لیکویڈیشن ٹریکر", "Трекер криптоліквідацій"]),
  "funding-rates": L(["Perpetual funding rates", "永续合约资金费率", "永續合約資金費率", "Tasas de financiación de perpetuos", "Taxas de financiamento de perpétuos", "Taux de financement des perpétuels", "Funding Rates für Perpetuals", "Tassi di finanziamento dei perpetui", "無期限先物の資金調達率", "무기한 선물 펀딩비", "Ставки финансирования бессрочных контрактов", "Sürekli vadeli fonlama oranları", "Funding rate kontrak perpetual", "Funding rate hợp đồng vĩnh cửu", "معدلات التمويل للعقود الدائمة", "دائمی معاہدوں کی فنڈنگ شرحیں", "Ставки фінансування безстрокових контрактів"]),
  rates: L(["Exchange fee calculator", "交易所手续费计算器", "交易所手續費計算器", "Calculadora de comisiones", "Calculadora de taxas", "Calculateur de frais", "Gebührenrechner", "Calcolatore delle commissioni", "取引所手数料計算", "거래소 수수료 계산기", "Калькулятор комиссий бирж", "Borsa ücret hesaplayıcı", "Kalkulator biaya bursa", "Công cụ tính phí sàn", "حاسبة رسوم المنصات", "ایکسچینج فیس کیلکولیٹر", "Калькулятор біржових комісій"]),
  compare: L(["Compare any two exchanges", "任选两家交易所对比", "任選兩家交易所比較", "Comparar dos exchanges", "Comparar duas exchanges", "Comparer deux plateformes", "Zwei Börsen vergleichen", "Confronta due exchange", "2つの取引所を比較", "두 거래소 비교", "Сравнить две биржи", "İki borsayı karşılaştırın", "Bandingkan dua bursa", "So sánh hai sàn", "قارن بين منصتين", "کوئی دو ایکسچینجز موازنہ کریں", "Порівняти будь-які дві біржі"]),
  activities: L(["Official exchange campaigns", "交易所官方活动", "交易所官方活動", "Campañas oficiales de exchanges", "Campanhas oficiais das exchanges", "Campagnes officielles des plateformes", "Offizielle Börsenaktionen", "Campagne ufficiali degli exchange", "取引所の公式キャンペーン", "거래소 공식 이벤트", "Официальные акции бирж", "Resmî borsa kampanyaları", "Kampanye resmi bursa", "Chương trình chính thức của sàn", "الحملات الرسمية للمنصات", "ایکسچینجز کی سرکاری مہمات", "Офіційні кампанії бірж"]),
  "tokenized-treasuries": L(["Tokenized Treasuries checklist", "代币化美债核对清单", "代幣化美債核對清單", "Lista de bonos del Tesoro tokenizados", "Checklist de títulos do Tesouro tokenizados", "Liste des bons du Trésor tokenisés", "Prüfliste tokenisierte Staatsanleihen", "Checklist dei titoli di Stato tokenizzati", "トークン化国債チェックリスト", "토큰화 국채 점검표", "Проверка токенизированных казначейских бумаг", "Tokenleştirilmiş tahvil kontrol listesi", "Daftar periksa obligasi tertokenisasi", "Danh sách kiểm tra trái phiếu token hóa", "قائمة تحقق سندات الخزانة المرمّزة", "ٹوکنائزڈ ٹریژریز چیک لسٹ", "Чеклист токенізованих казначейських паперів"]),
  "tokenized-stocks": L(["Tokenized stocks vs perpetuals", "代币化股票与永续合约", "代幣化股票與永續合約", "Acciones tokenizadas y perpetuos", "Ações tokenizadas e perpétuos", "Actions tokenisées et perpétuels", "Tokenisierte Aktien und Perpetuals", "Azioni tokenizzate e perpetui", "トークン化株式と無期限先物", "토큰화 주식과 무기한 선물", "Токенизированные акции и бессрочные контракты", "Tokenleştirilmiş hisseler ve sürekli vadeli", "Saham tertokenisasi dan perpetual", "Cổ phiếu token hóa và hợp đồng vĩnh cửu", "الأسهم المرمّزة والعقود الدائمة", "ٹوکنائزڈ اسٹاکس اور دائمی معاہدے", "Токенізовані акції й безстрокові контракти"]),
  "meme-coins": L(["Meme coin trading checks", "Meme 币交易核查", "Meme 幣交易核查", "Controles para memecoins", "Verificações de memecoins", "Contrôles des memecoins", "Memecoin-Prüfungen", "Controlli sulle memecoin", "ミームコイン取引のチェック", "밈코인 거래 점검", "Проверка мемкоинов", "Meme coin işlem kontrolleri", "Pemeriksaan meme coin", "Kiểm tra giao dịch meme coin", "فحوص تداول عملات الميم", "میم کوائن ٹریڈنگ چیکس", "Перевірки торгівлі мемкоїнами"]),
  derivatives: L(["Derivatives & perpetuals hub", "衍生品与永续合约专题", "衍生品與永續合約專題", "Derivados y perpetuos", "Derivativos e perpétuos", "Dérivés et perpétuels", "Derivate und Perpetuals", "Derivati e perpetui", "デリバティブと無期限先物", "파생상품과 무기한 선물", "Деривативы и бессрочные контракты", "Türevler ve sürekli vadeli işlemler", "Derivatif dan perpetual", "Phái sinh và hợp đồng vĩnh cửu", "المشتقات والعقود الدائمة", "مشتقات اور دائمی معاہدوں کا مرکز", "Хаб деривативів і безстрокових контрактів"]),
  "account-setup": L(["Account setup & security guides", "开户与账户安全教程", "開戶與帳戶安全教學", "Guías de cuenta y seguridad", "Guias de conta e segurança", "Guides de compte et de sécurité", "Leitfäden zu Konto und Sicherheit", "Guide su conto e sicurezza", "口座開設とセキュリティのガイド", "계정 개설과 보안 가이드", "Руководства по аккаунту и безопасности", "Hesap ve güvenlik rehberleri", "Panduan akun dan keamanan", "Hướng dẫn tài khoản và bảo mật", "أدلة الحساب والأمان", "اکاؤنٹ سیٹ اپ اور سیکیورٹی گائیڈز", "Гайди з налаштування акаунта й безпеки"]),
  "exchange-directory": L(["Crypto exchange directory", "加密交易所名录", "加密交易所名錄", "Directorio de exchanges", "Diretório de exchanges", "Annuaire des plateformes", "Verzeichnis der Krypto-Börsen", "Elenco degli exchange", "暗号資産取引所一覧", "암호화폐 거래소 목록", "Каталог криптобирж", "Kripto borsa rehberi", "Direktori bursa kripto", "Danh bạ sàn tiền mã hóa", "دليل منصات العملات الرقمية", "کرپٹو ایکسچینج ڈائریکٹری", "Каталог криптобірж"]),
  regulation: L(["Crypto regulation news", "加密监管动态", "加密監管動態", "Noticias de regulación cripto", "Notícias de regulação cripto", "Actualités de la réglementation crypto", "Krypto-Regulierung", "Notizie sulla regolamentazione crypto", "暗号資産規制ニュース", "암호화폐 규제 소식", "Новости регулирования криптовалют", "Kripto düzenleme haberleri", "Berita regulasi kripto", "Tin quy định tiền mã hóa", "أخبار تنظيم العملات الرقمية", "کرپٹو ضابطہ کاری کی خبریں", "Новини крипторегулювання"]),
  "exchange-api": L(["Exchange API & market data controls", "交易所 API 与行情数据核查", "交易所 API 與行情資料核查", "API de exchanges y datos de mercado", "API de exchanges e dados de mercado", "API des plateformes et données de marché", "Börsen-APIs und Marktdaten", "API degli exchange e dati di mercato", "取引所APIと市場データの確認", "거래소 API와 시장 데이터 점검", "API бирж и рыночные данные", "Borsa API'leri ve piyasa verisi", "API bursa dan data pasar", "API sàn và dữ liệu thị trường", "واجهات API للمنصات وبيانات السوق", "ایکسچینج API اور مارکیٹ ڈیٹا کنٹرولز", "API бірж і контроль ринкових даних"]),
  "usdc-cctp": L(["USDC & CCTP transfer risk map", "USDC 与 CCTP 转账风险图", "USDC 與 CCTP 轉帳風險圖", "Riesgos de transferencias USDC y CCTP", "Riscos de transferências USDC e CCTP", "Risques des transferts USDC et CCTP", "USDC- und CCTP-Transferrisiken", "Rischi dei trasferimenti USDC e CCTP", "USDC と CCTP の送金リスク", "USDC·CCTP 전송 위험", "Риски переводов USDC и CCTP", "USDC ve CCTP transfer riskleri", "Risiko transfer USDC dan CCTP", "Rủi ro chuyển USDC và CCTP", "مخاطر تحويلات USDC وCCTP", "USDC اور CCTP منتقلی خطرات کا نقشہ", "Мапа ризиків переказів USDC і CCTP"]),
  "brazil-vasp-deadline": L(["Brazil exchange authorization deadline (30 Oct 2026)", "巴西交易所授权申请截止日（2026-10-30）", "巴西交易所授權申請截止日（2026-10-30）", "Plazo de autorización de exchanges en Brasil (30/10/2026)", "Prazo do Banco Central para corretoras cripto (30/10/2026)", "Brésil : date limite d’autorisation des plateformes (30/10/2026)", "Brasilien: Zulassungsfrist für Krypto-Börsen (30.10.2026)", "Brasile: scadenza per l’autorizzazione degli exchange (30/10/2026)", "ブラジルの取引所認可申請期限（2026年10月30日）", "브라질 거래소 인가 신청 마감(2026-10-30)", "Бразилия: срок подачи заявок на авторизацию бирж (30.10.2026)", "Brezilya borsa yetkilendirme son tarihi (30.10.2026)", "Tenggat otorisasi bursa di Brasil (30/10/2026)", "Hạn chót cấp phép sàn tại Brazil (30/10/2026)", "مهلة ترخيص منصات العملات الرقمية في البرازيل (30/10/2026)", // l10n: needs native review
    "برازیل میں ایکسچینج کی اجازت کی آخری تاریخ (30/10/2026)", // l10n: needs native review
    "Кінцевий строк авторизації бірж у Бразилії (30/10/2026)"]),
  "network-maintenance": L(["Network upgrades vs wallet maintenance", "网络升级与钱包维护对比", "網路升級與錢包維護比較", "Actualizaciones de red y mantenimiento de billeteras", "Atualizações de rede e manutenção de carteiras", "Mises à niveau réseau et maintenance des portefeuilles", "Netzwerk-Upgrades und Wallet-Wartung", "Aggiornamenti di rete e manutenzione dei wallet", "ネットワーク更新とウォレット保守", "네트워크 업그레이드와 지갑 점검", "Обновления сетей и обслуживание кошельков", "Ağ yükseltmeleri ve cüzdan bakımı", "Peningkatan jaringan dan pemeliharaan dompet", "Nâng cấp mạng và bảo trì ví", "ترقيات الشبكات وصيانة المحافظ", "نیٹ ورک اپ گریڈز اور والیٹ دیکھ بھال", "Оновлення мережі й обслуговування гаманців"]),
};

const NAME = (name) => new RegExp(`(?<![A-Za-z0-9])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9])`, "i");

const venue = (slug, name, query, extra = {}) => ({ id: slug, kind: "venue", path: `/exchanges/${slug}`, name, venues: [slug], query, match: { title: extra.title || NAME(name) } });
const pair = (a, b, names, query) => ({ id: `${a}-vs-${b}`, kind: "compare", path: `/compare/${a}-vs-${b}`, names, venues: [a, b], query, match: { all: names.map((n) => NAME(n)) } });

/**
 * Clusters in priority order: an article's link line lists matching clusters in this order; GSC queries go to the first
 * matching pair, then exchange, then other family (QUERY_ORDER). `match.title` tests title + slug + primary keyword (every edition), `match.summary`
 * also tests the English summary, `match.all` needs every pattern in the title text, `match.category` the feed category.
 */
export const TOPIC_CLUSTERS = Object.freeze([
  // Tools (D4) — every one of these pages lists its articles, so they come first in an article's link line.
  { id: "funding-rates", kind: "tool", path: "/funding-rates", tool: true, query: /funding/i,
    // Funding is paid on perpetual contracts, so articles about perpetuals (listings, X-perps, perp DEXs) belong here too.
    match: { title: /funding[- ]?rates?|funding fees?|funding payments?|funding intervals?|funding caps?|\bperp(?:etual)?s?\b|perpetual futures|x-perps?/i, summary: /funding[- ]?rates?|funding payments?/i } },
  { id: "liquidations", kind: "tool", path: "/liquidations", tool: true, query: /liquidat|leverage|槓桿|杠杆|爆仓|清算|maintenance margin/i,
    match: { title: /liquidat|leverag|margin call|maintenance margin|deleverag|insurance fund|爆仓|强平|清算|杠杆|槓桿/i } },
  { id: "rates", kind: "tool", path: "/rates", tool: true, query: /\bfees?\b|gebühr|taxas?\b|comisi|手續費|手续费|费率|cashback|rebate/i,
    match: { title: /\bfees?\b|fee schedule|fee tier|maker|taker|trading costs?|commission|rebate|手续费|手續費|费率|返佣/i } },
  { id: "activities", kind: "tool", path: "/activities", tool: true, query: /campaign|promotion|airdrop|bonus|reward|giveaway|listing campaign/i,
    match: { title: /campaign|promotion|airdrop|launchpool|launchpad|megadrop|giveaway|tournament|welcome (?:bonus|pack|reward)|rewards?\b|bonus|voucher|空投|活动/i } },
  { id: "compare", kind: "tool", path: "/compare", tool: true, query: /\bvs\b|versus|\bou\b|对比|比較|alternative|competitor/i,
    match: { title: /\bvs\.?\b|versus|对比|對比/i, category: "comparison" } },
  // Curated comparison pairs (GSC families with impressions).
  pair("bybit", "bitget", ["Bybit", "Bitget"], /bybit.*bitget|bitget.*bybit/i),
  pair("binance", "kraken", ["Binance", "Kraken"], /binance.*kraken|kraken.*binance/i),
  pair("binance", "okx", ["Binance", "OKX"], /binance.*okx|okx.*binance/i),
  pair("binance", "bybit", ["Binance", "Bybit"], /binance.*bybit|bybit.*binance|bybit (?:alternatives?|competitors?)|bybit vs phemex|phemex vs bybit|binance perps alternative/i),
  // Venue families.
  venue("hyperliquid", "Hyperliquid", /hyperliquid/i),
  venue("uniswap", "Uniswap", /uniswap/i),
  venue("drift", "Drift", /\bdrift/i, { title: /\bdrift(?:\s+protocol)?\b(?!\s+(?:risk|check))/i }),
  venue("gmx", "GMX", /\bgmx\b/i),
  venue("backpack", "Backpack", /backpack/i),
  venue("jupiter", "Jupiter", /jupiter/i),
  venue("deribit", "Deribit", /deribit/i),
  // Topic hubs and categories.
  { id: "tokenized-treasuries", kind: "topic", path: "/topics/tokenized-treasuries", query: /treasur/i,
    match: { title: /tokeni[sz]ed treasur|treasury (?:fund|bill|token)|t-bill|代币化美债|代幣化美債|代币化国债/i } },
  { id: "tokenized-stocks", kind: "topic", path: "/topics/tokenized-stocks-vs-perpetuals", query: /stock|股票|equity/i,
    match: { title: /tokeni[sz]ed (?:stocks?|equit)|stock perps?|equity perpetual|bstocks|xstocks|代币化股票|代幣化股票/i } },
  { id: "meme-coins", kind: "topic", path: "/topics/meme-coins", query: /meme|ميم|밈/i,
    match: { title: /\bmemes?\b|memecoin|pump\.fun|meme 币|meme幣/i } },
  { id: "derivatives", kind: "topic", path: "/topics/derivatives", query: /perp|futures|derivative|dydx|aevo/i,
    match: { title: /perp dex|perpetual dex|decentrali[sz]ed perpetual|cex vs dex|dex vs cex|perpetual (?:platform|exchange)s?|derivatives? (?:platform|venue)s?/i } },
  { id: "account-setup", kind: "category", path: "/news/category/guide", query: /kyc|verif|identity|anti.?phishing|2fa|whitelist|allowlist|withdrawal address|settings lock|satoshi test|ssn/i,
    match: { title: /\bkyc\b|identity verification|verify (?:your )?identity|anti-?phishing|\b2fa\b|withdrawal (?:address|whitelist|allowlist)|allowlist|whitelist|passkey|settings lock|satoshi test|实名认证|身份验证/i } },
  { id: "exchange-api", kind: "article", path: "/news/binance-sbe-vs-coinbase-websocket-market-data-schema-control-checklist", query: /\bapi\b|\bsbe\b|websocket|order book|market data|rate limits?|sandbox|\brpi\b|okx test/i,
    match: { title: /\bapi\b|websocket|\bsbe\b|order book|market data|rate limits?/i } },
  { id: "usdc-cctp", kind: "article", path: "/news/circle-cctp-v2-usdc-fast-transfer-hooks-and-finality-risk-map", query: /cctp|circle|usdc|noble/i,
    match: { title: /\bcctp\b/i } },
  // Brazil BCB deadline topic: English slug for every locale except pt-BR, which links its Portuguese edition (localePaths).
  { id: "brazil-vasp-deadline", kind: "topic", path: BRAZIL_DEADLINE_PATH_EN, localePaths: { "pt-BR": BRAZIL_DEADLINE_PATH_PT },
    query: /banco central|\bbcb\b|\bpsav\b|\bvasp\b.*bra[sz]il|cnpj|opera no brasil|é brasileira|receita federal|(?:brasil|brazil).*(?:regula|autoriza|authori[sz]|licen|legal|confi[aá]vel|prazo|deadline)/i,
    match: { title: /banco central do brasil|central bank of brazil|brazil(?:ian)? central bank|\bbcb\b|\b(?:brazil|brasil)\b.*\b(?:regulat|regula[çc]|licen[cs]|authori[sz]|autoriza|vasp|psav|deadline|prazo)|\b(?:regulat|licen[cs]|authori[sz]|vasp|deadline)\w*\b.*\b(?:brazil|brasil)\b/i } },
  { id: "regulation", kind: "category", path: "/news/category/regulation", query: /\bsec\b|site\.sec|cftc|innovation exemption|token taxonomy|bitlicense|34-106402|project agora|hkma/i,
    match: { category: "regulation" } },
  { id: "network-maintenance", kind: "article", path: "/news/blockchain-network-upgrade-vs-exchange-wallet-maintenance-service-impact-comparison", query: /maintenance (?:and repair )?services|network maintenance|system maintenance/i,
    match: { title: /network upgrade|wallet maintenance|hard fork|network maintenance/i } },
  { id: "exchange-directory", kind: "hub", path: "/exchanges", query: /listado|listing service|register|registr|sign up|注册|註冊|inscrib|verified .* account|exchange avis|plateforme/i,
    match: { title: /how to (?:register|sign up|create)|registration|注册|開戶|开户/i } },
]);

export const TOOL_CLUSTER_IDS = Object.freeze(TOPIC_CLUSTERS.filter((cluster) => cluster.tool).map((cluster) => cluster.id));
const CLUSTER_BY_ID = new Map(TOPIC_CLUSTERS.map((cluster) => [cluster.id, cluster]));

export function topicCluster(id) {
  return CLUSTER_BY_ID.get(id) || null;
}

// Query classification order: a named pair or exchange owns its query ("hyperliquid fees" lands on the Hyperliquid
// profile, which is the page Google already ranks for it); generic families (tools, topics) take the rest.
const QUERY_ORDER = [...TOPIC_CLUSTERS.filter((cluster) => cluster.kind === "compare"), ...TOPIC_CLUSTERS.filter((cluster) => cluster.kind === "venue"), ...TOPIC_CLUSTERS.filter((cluster) => cluster.kind !== "compare" && cluster.kind !== "venue")];

/** The family a Search Console query belongs to (null when none). */
export function clusterForQuery(query) {
  const text = String(query || "");
  return QUERY_ORDER.find((cluster) => cluster.query && cluster.query.test(text)) || null;
}


const englishText = (value) => (typeof value === "string" ? value : value && typeof value === "object" && typeof value.en === "string" ? value.en : "");

const topicTextCache = new WeakMap();
function articleText(article) {
  let cached = topicTextCache.get(article);
  if (!cached) {
    cached = {
      // English edition + slug + keyword only: hydration payloads carry the reader's locale and English, so matching on
      // every edition would let the server (full article) and the browser (projected article) disagree.
      title: [englishText(article?.title), String(article?.slug || "").replace(/-/g, " "), String(article?.seo?.primaryKeyword || "")].join(" \u0001 "),
      summary: englishText(article?.summary),
    };
    topicTextCache.set(article, cached);
  }
  return cached;
}

/** True when the article belongs to the cluster. Articles never match the cluster whose main page they are. */
export function articleMatchesCluster(article, cluster) {
  if (!article?.slug || !cluster?.match) return false;
  if (cluster.path === `/news/${article.slug}`) return false;
  const { title, summary } = articleText(article);
  const rule = cluster.match;
  if (rule.category && article.category === rule.category) return true;
  if (rule.all) return rule.all.every((pattern) => pattern.test(title));
  if (rule.title && rule.title.test(title)) return true;
  return Boolean(rule.summary && rule.summary.test(summary));
}

export function clusterLabel(cluster, locale = "en") {
  const code = LOCALES.includes(locale) ? locale : "en";
  if (cluster.kind === "venue") return PROFILE_LABEL[code](cluster.name);
  if (cluster.kind === "compare") return COMPARE_LABEL[code](cluster.names[0], cluster.names[1]);
  return LABELS[cluster.id]?.[code] || LABELS[cluster.id]?.en || cluster.path;
}

export const ARTICLE_CLUSTER_LINK_LIMIT = 6;

/**
 * "Topic hubs & tools" line of an article: main pages of the clusters it belongs to, in cluster priority order, then
 * (SEO w43) the /tokenized-stocks hub and the ticker pages a tokenized-stocks article names. The tokenized-stocks links
 * have their own cap (tokenized-stocks-news.js), so they never push a cluster family out of the line.
 */
export function articleClusterLinks(article, locale = "en", { limit = ARTICLE_CLUSTER_LINK_LIMIT } = {}) {
  const links = [];
  for (const cluster of TOPIC_CLUSTERS) {
    if (links.length >= limit) break;
    if (!articleMatchesCluster(article, cluster)) continue;
    const path = cluster.localePaths?.[locale] || cluster.path;
    links.push({ id: cluster.id, kind: cluster.kind, path, href: localizedPath(path, locale), label: clusterLabel(cluster, locale) });
  }
  for (const link of tsArticleLinks(article, locale)) if (!links.some((item) => item.path === link.path)) links.push(link);
  return links;
}

const ARTICLE_LINE_COPY = L(["Topic hubs & tools", "相关专题与工具", "相關專題與工具", "Temas y herramientas", "Temas e ferramentas", "Thèmes et outils", "Themen und Tools", "Temi e strumenti", "関連テーマとツール", "관련 주제와 도구", "Темы и инструменты", "Konular ve araçlar", "Topik dan alat", "Chủ đề và công cụ", "مواضيع وأدوات", "موضوعی مراکز اور اوزار", "Тематичні хаби й інструменти"]);
export function articleClusterLineLabel(locale = "en") {
  return ARTICLE_LINE_COPY[LOCALES.includes(locale) ? locale : "en"];
}

const time = (article) => { const value = Date.parse(article?.publishedAt); return Number.isFinite(value) ? value : 0; };
const indexable = (article) => article?.seo?.noindex === false;

// T10 internal linking (2026-10-12): besides the tool pages, the /news hub ("news-hub"), every exchange profile
// ("venue:<slug>") and every topic hub with a cluster ("topic:<id>") list related articles, strongest first.
export const NEWS_HUB_TOOL_KEY = "news-hub";
export const NEWS_HUB_ARTICLE_LIMIT = 24;
const TOPIC_KEY_BY_PATH = new Map(TOPIC_CLUSTERS.filter((cluster) => cluster.kind === "topic").map((cluster) => [cluster.path, `topic:${cluster.id}`]));

/** True for tool keys the related-articles block and /api/news/tool-articles accept. */
export function isRelatedArticlesToolKey(toolKey) {
  const key = String(toolKey || "");
  if (key === NEWS_HUB_TOOL_KEY || TOOL_CLUSTER_IDS.includes(key)) return true;
  if (/^compare:[a-z0-9-]+(?:-vs-[a-z0-9-]+){1,2}$/.test(key)) return true;
  if (/^venue:[a-z0-9][a-z0-9-]{0,40}$/.test(key)) return true;
  return key.startsWith("topic:") && TOPIC_CLUSTERS.some((cluster) => cluster.kind === "topic" && `topic:${cluster.id}` === key);
}

/** Tool key for an app route (null for routes that are not tools). Compare pairs carry their venues. */
export function toolKeyForRoute(route) {
  const name = route?.name;
  if (name === "newsList" && !route.category && (!route.page || Number(route.page) === 1)) return NEWS_HUB_TOOL_KEY;
  if (name === "venue" && typeof route.slug === "string" && route.slug) return `venue:${route.slug}`;
  if ((name === "topic" || name === "tokenizedAssets") && TOPIC_KEY_BY_PATH.has(`/topics/${route.slug}`)) return TOPIC_KEY_BY_PATH.get(`/topics/${route.slug}`);
  if (name === "liquidations") return "liquidations";
  if (name === "fundingRates") return "funding-rates";
  if (name === "rateTerminal") return "rates";
  if (name === "compareHub") return "compare";
  if (name === "activities") return "activities";
  if (name === "compare" && Array.isArray(route.slugs) && route.slugs.length >= 2) return `compare:${route.slugs.join("-vs-")}`;
  return null;
}

/** Tool key for a content pathname (no locale prefix), for the Worker and the build. */
export function toolKeyForPath(pathname) {
  const path = String(pathname || "");
  if (path === "/liquidations") return "liquidations";
  if (path === "/funding-rates") return "funding-rates";
  if (path === "/rates") return "rates";
  if (path === "/compare") return "compare";
  if (path === "/activities") return "activities";
  if (path === "/news") return NEWS_HUB_TOOL_KEY;
  const venueMatch = path.match(/^\/exchanges\/([a-z0-9][a-z0-9-]{0,40})$/);
  if (venueMatch) return `venue:${venueMatch[1]}`;
  if (TOPIC_KEY_BY_PATH.has(path)) return TOPIC_KEY_BY_PATH.get(path);
  const pairMatch = path.match(/^\/compare\/([a-z0-9-]+(?:-vs-[a-z0-9-]+){1,2})$/);
  return pairMatch ? `compare:${pairMatch[1]}` : null;
}

export const TOOL_ARTICLE_LIMIT = 6;
const TOOL_ARTICLE_MINIMUM = 3;

/**
 * Articles a tool page lists: matching articles, search-published ones first when there are enough. `rank(slug)` (server
 * only: src/data/news-search-state.js newsStrengthRank) puts the articles with the most Google impressions first so crawl
 * budget flows to them (T10); without it the order is newest first.
 */
export function toolArticles(toolKey, articles, { limit, rank = null } = {}) {
  const rows = (Array.isArray(articles) ? articles : []).filter((article) => article?.slug && (!article.status || article.status === "PUBLISHED"));
  const strength = (article) => (typeof rank === "function" ? rank(article.slug) : Number.POSITIVE_INFINITY);
  const byStrength = (left, right) => {
    const a = strength(left), b = strength(right);
    return a === b ? 0 : a < b ? -1 : 1;
  };
  let pool;
  if (toolKey === NEWS_HUB_TOOL_KEY) {
    // The hub lists the strongest articles only (the paginated library below it already lists the newest).
    pool = rows.filter((article) => Number.isFinite(strength(article))).sort(byStrength);
    limit = limit ?? NEWS_HUB_ARTICLE_LIMIT;
  } else if (String(toolKey).startsWith("venue:")) {
    const slug = String(toolKey).slice(6);
    const name = NAME(slug.replace(/-io$/, ".io").replace(/-com$/, ".com").replace(/-/g, " "));
    pool = rows.filter((article) => (Array.isArray(article.relatedVenues) && article.relatedVenues.includes(slug)) || name.test(articleText(article).title))
      .sort((left, right) => byStrength(left, right) || time(right) - time(left));
  } else if (String(toolKey).startsWith("compare:")) {
    // A comparison pair lists articles that name both venues, then articles that name either, then the compare cluster.
    const slugs = String(toolKey).slice(8).split("-vs-");
    const mentions = (article) => slugs.filter((slug) => (Array.isArray(article.relatedVenues) && article.relatedVenues.includes(slug))
      || NAME(slug.replace(/-io$/, ".io")).test(articleText(article).title)).length;
    const scored = rows.map((article) => [mentions(article), article]).filter(([score]) => score > 0);
    scored.sort((left, right) => right[0] - left[0] || byStrength(left[1], right[1]) || time(right[1]) - time(left[1]));
    pool = scored.map(([, article]) => article);
  } else {
    const cluster = topicCluster(String(toolKey).replace(/^topic:/, ""));
    if (!cluster) return [];
    pool = rows.filter((article) => articleMatchesCluster(article, cluster)).sort((left, right) => byStrength(left, right) || time(right) - time(left));
  }
  limit = limit ?? TOOL_ARTICLE_LIMIT;
  const published = pool.filter(indexable);
  const ordered = published.length >= Math.min(limit, TOOL_ARTICLE_MINIMUM) ? [...published, ...pool.filter((article) => !indexable(article))] : pool;
  return ordered.slice(0, limit);
}

/**
 * The payload a tool page renders and hydrates with: { tool, locale, items: [{ slug, href, title, lang, publishedAt }] }.
 * Links follow the news library rules (localized edition when present, otherwise the locale news home; never query-locale article variants).
 * A locale without its own edition shows the real English headline marked lang="en" (an article headline is data), not
 * the generic "Research: <venue>" placeholder title.
 */
export function toolArticleLinks(toolKey, articles, locale = "en", options = {}) {
  if (!toolKey) return null;
  const items = toolArticles(toolKey, articles, options).map((article) => {
    const native = locale === "en" || String(locale).startsWith("zh") || hasNewsArticleLocale(article, locale);
    return {
      slug: article.slug,
      href: newsArticleUrl(article.slug, locale, article),
      title: (native ? localizedNewsTitle(article, locale) : localizedValue(article.title, "en")) || article.slug,
      lang: native ? (String(locale).startsWith("zh") && !article.title?.[locale] ? "zh-Hans" : locale) : "en",
      publishedAt: String(article.publishedAt || "").slice(0, 10),
    };
  });
  return items.length ? { tool: toolKey, locale, items } : null;
}

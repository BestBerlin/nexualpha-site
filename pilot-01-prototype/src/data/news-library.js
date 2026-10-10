// News library (2026-10-10): crawlable pagination, category archives, full-library search and related articles.
// Shared by the Worker (server-rendered fallback, /api/news/search, sitemap) and the React news pages so both
// produce the same pages, links and ordering. Pure functions only; no fetch, no DOM.
import { localizedPath } from "./locale-routing.js";
import { NEWS_CORE_LOCALES, hasNewsArticleLocale } from "./news-feed-client.js";

export const NEWS_PAGE_SIZE = 24;
export const NEWS_SEARCH_MAX_LIMIT = 48;
export const NEWS_CATEGORY_KEYS = Object.freeze(["guide", "comparison", "exchange-update", "regulation", "rwa", "research"]);
const CATEGORY_SET = new Set(NEWS_CATEGORY_KEYS);

export function isNewsCategory(value) {
  return typeof value === "string" && CATEGORY_SET.has(value);
}

// Content paths (no locale prefix): /news, /news/page/N, /news/category/<key>, /news/category/<key>/page/N.
// Returns null when the path is not a listing path. `redirect` is set for /page/1 and other non-canonical forms.
export function parseNewsListingPath(pathname) {
  const match = String(pathname || "").match(/^\/news(?:\/category\/([a-z0-9-]+))?(?:\/page\/([0-9]{1,4}))?$/);
  if (!match) return null;
  const category = match[1] || null;
  const rawPage = match[2];
  const page = rawPage === undefined ? 1 : Number.parseInt(rawPage, 10);
  if (category && !isNewsCategory(category)) return { category, page, invalid: true };
  if (rawPage !== undefined && (!Number.isFinite(page) || page < 1)) return { category, page: 1, invalid: true };
  const canonicalPath = newsListingPath({ category, page });
  return { category, page, canonicalPath, redirect: canonicalPath !== pathname ? canonicalPath : null };
}

export function newsListingPath({ category = null, page = 1 } = {}) {
  const base = category ? `/news/category/${category}` : "/news";
  return page > 1 ? `${base}/page/${page}` : base;
}

export function newsListingHref({ category = null, page = 1 } = {}, locale = "en") {
  return localizedPath(newsListingPath({ category, page }), locale);
}

const time = (article) => {
  const value = Date.parse(article?.publishedAt);
  return Number.isFinite(value) ? value : 0;
};

export function compareNewestFirst(left, right) {
  return time(right) - time(left) || String(left?.slug || "").localeCompare(String(right?.slug || ""));
}

export function sortNewsArticles(articles) {
  return (Array.isArray(articles) ? articles : []).filter((article) => article && article.slug).slice().sort(compareNewestFirst);
}

export function filterNewsByCategory(articles, category) {
  const rows = Array.isArray(articles) ? articles : [];
  return category ? rows.filter((article) => article?.category === category) : rows;
}

/**
 * Localized news lane (2026-10-10): on a non-core listing locale (e.g. /tr/news) the articles written natively in that
 * locale come first, newest first, followed by the rest of the library in its usual order. Core locales (en, zh-Hans)
 * keep the plain newest-first order because every article has those editions.
 */
export function sortNewsForLocale(articles, locale = "en") {
  const rows = sortNewsArticles(articles);
  if (!locale || NEWS_CORE_LOCALES.includes(locale)) return rows;
  const localized = rows.filter((article) => hasNewsArticleLocale(article, locale));
  if (!localized.length) return rows;
  const localizedSlugs = new Set(localized.map((article) => article.slug));
  return [...localized, ...rows.filter((article) => !localizedSlugs.has(article.slug))];
}

export function paginateNews(articles, { category = null, page = 1, pageSize = NEWS_PAGE_SIZE, locale = "en" } = {}) {
  const pool = sortNewsForLocale(filterNewsByCategory(articles, category), locale);
  const total = pool.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  return { rows: pool.slice((current - 1) * pageSize, current * pageSize), total, totalPages, page: current, requestedPage: page, category, pageSize };
}

// Page numbers for a pagination bar: first, last and a window around the current page; null marks a gap.
export function newsPaginationItems(page, totalPages, radius = 1) {
  const pages = new Set([1, totalPages]);
  for (let n = page - radius; n <= page + radius; n += 1) if (n >= 1 && n <= totalPages) pages.add(n);
  const sorted = [...pages].sort((a, b) => a - b);
  const items = [];
  for (const n of sorted) {
    const previous = items.length ? items[items.length - 1] : null;
    if (previous !== null && n - previous === 2) items.push(n - 1);
    else if (previous !== null && n - previous > 2) items.push(null);
    items.push(n);
  }
  return items;
}

export function newsCategoryCounts(articles) {
  const counts = Object.fromEntries(NEWS_CATEGORY_KEYS.map((key) => [key, 0]));
  for (const article of Array.isArray(articles) ? articles : []) if (isNewsCategory(article?.category)) counts[article.category] += 1;
  return counts;
}

// ---------------------------------------------------------------------------------------------------------------
// Search: every term must appear in a title, summary, venue, category or slug of any published language.
const normalize = (value) => String(value || "").normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase().replace(/ı/g, "i").replace(/\s+/g, " ").trim();
const textValues = (value) => typeof value === "string" ? [value] : value && typeof value === "object" ? Object.values(value).filter((item) => typeof item === "string") : [];

const searchIndexCache = new WeakMap();
function searchIndex(articles) {
  let index = searchIndexCache.get(articles);
  if (!index) {
    index = articles.map((article) => ({
      article,
      title: normalize(textValues(article.title).join(" \u0001 ")),
      body: normalize([
        ...textValues(article.summary),
        ...(Array.isArray(article.relatedVenues) ? article.relatedVenues : []),
        ...textValues(article.categoryName),
        String(article.category || ""),
        String(article.slug || "").replace(/-/g, " "),
      ].join(" \u0001 ")),
    }));
    searchIndexCache.set(articles, index);
  }
  return index;
}

export function newsSearchTerms(query) {
  // A plural Latin term also matches its singular ("fees" finds "fee schedule"); CJK and short terms stay exact.
  return normalize(String(query || "").slice(0, 120)).split(" ").filter(Boolean).slice(0, 8)
    .map((term) => /^[a-z0-9-]{4,}s$/.test(term) && !term.endsWith("ss") ? term.slice(0, -1) : term);
}

export function searchNewsArticles(articles, { query = "", category = null } = {}) {
  const rows = Array.isArray(articles) ? articles : [];
  const terms = newsSearchTerms(query);
  if (!terms.length) return sortNewsArticles(filterNewsByCategory(rows, category));
  const scored = [];
  for (const entry of searchIndex(rows)) {
    if (category && entry.article.category !== category) continue;
    let score = 0;
    let matched = true;
    for (const term of terms) {
      if (entry.title.includes(term)) score += 3;
      else if (entry.body.includes(term)) score += 1;
      else { matched = false; break; }
    }
    if (matched) scored.push([score, entry.article]);
  }
  return scored.sort((left, right) => right[0] - left[0] || compareNewestFirst(left[1], right[1])).map(([, article]) => article);
}

// ---------------------------------------------------------------------------------------------------------------
// Related articles: same category first, then shared relatedVenues; deterministic so SSR and hydration agree.
export function relatedNewsArticles(article, articles, { limit = 6, minimum = 4 } = {}) {
  if (!article?.slug) return [];
  const venues = new Set(Array.isArray(article.relatedVenues) ? article.relatedVenues : []);
  const scored = [];
  for (const candidate of Array.isArray(articles) ? articles : []) {
    if (!candidate?.slug || candidate.slug === article.slug) continue;
    const sharedVenues = (Array.isArray(candidate.relatedVenues) ? candidate.relatedVenues : []).filter((venue) => venues.has(venue)).length;
    const sameCategory = Boolean(article.category) && candidate.category === article.category;
    if (!sameCategory && !sharedVenues) continue;
    scored.push([(sameCategory ? 2 : 0) + Math.min(sharedVenues, 3) * 3, candidate]);
  }
  scored.sort((left, right) => right[0] - left[0] || compareNewestFirst(left[1], right[1]));
  const picked = scored.slice(0, limit).map(([, candidate]) => candidate);
  if (picked.length >= minimum) return picked;
  const chosen = new Set(picked.map((item) => item.slug));
  for (const candidate of sortNewsArticles(articles)) {
    if (picked.length >= minimum) break;
    if (candidate.slug === article.slug || chosen.has(candidate.slug)) continue;
    picked.push(candidate);
    chosen.add(candidate.slug);
  }
  return picked;
}

// ---------------------------------------------------------------------------------------------------------------
// Copy (15 locales). Category labels double as archive H1s; intros are one sentence.
const CATEGORY_COPY = {
  en: {
    guide: ["Guides", "Step-by-step guides to opening, funding and securing crypto exchange accounts, with every claim linked to an official source."],
    comparison: ["Comparisons", "Side-by-side comparisons of crypto exchanges and protocols on fees, products, access and risk controls, built from published sources."],
    "exchange-update": ["Exchange Updates", "Dated notes on listings, fee changes, product launches and policy updates announced by crypto exchanges, each tied to the official notice."],
    regulation: ["Regulation", "How licensing, MiCA, tax and enforcement changes affect access to crypto platforms, explained from regulator and exchange sources."],
    rwa: ["RWA & Tokenization", "Research on tokenized treasuries, stocks and other real-world assets: structure, access rules and the risks behind the yield."],
    research: ["Source-Backed Research", "Long-form research on market structure, exchange operations and trading costs, with sources listed under every article."],
  },
  "zh-Hans": {
    guide: ["教程", "开户、入金与账户安全的分步教程，每一项说明都附官方来源链接。"],
    comparison: ["平台对比", "从费率、产品、准入和风控角度对比加密交易平台与协议，内容基于公开来源。"],
    "exchange-update": ["交易所动态", "交易所上新、费率调整、产品发布与政策变化的日期化记录，每条对应官方公告。"],
    regulation: ["监管动态", "牌照、MiCA、税务与执法变化如何影响加密平台准入，依据监管机构与交易所原文解读。"],
    rwa: ["代币化资产", "代币化国债、股票等现实世界资产研究：结构、准入规则与收益背后的风险。"],
    research: ["源头核验研究", "关于市场结构、交易所运营与交易成本的深度研究，每篇文章下方列出来源。"],
  },
  "zh-Hant": {
    guide: ["教學", "開戶、入金與帳戶安全的分步教學，每一項說明都附官方來源連結。"],
    comparison: ["平台對比", "從費率、產品、准入與風控角度比較加密交易平台與協議，內容基於公開來源。"],
    "exchange-update": ["交易所動態", "交易所上新、費率調整、產品發布與政策變化的日期化紀錄，每則對應官方公告。"],
    regulation: ["監管動態", "牌照、MiCA、稅務與執法變化如何影響加密平台准入，依據監管機構與交易所原文解讀。"],
    rwa: ["代幣化資產", "代幣化國債、股票等現實世界資產研究：結構、准入規則與收益背後的風險。"],
    research: ["源頭核驗研究", "關於市場結構、交易所營運與交易成本的深度研究，每篇文章下方列出來源。"],
  },
  ja: {
    guide: ["ガイド", "取引所口座の開設、入金、セキュリティ設定を手順ごとに解説し、すべての記述に公式出典を付けています。"],
    comparison: ["比較", "手数料、商品、利用条件、リスク管理の観点から取引所とプロトコルを公開情報に基づいて比較します。"],
    "exchange-update": ["取引所アップデート", "上場、手数料変更、新商品、ポリシー変更など取引所の発表を日付付きで記録し、公式告知に紐づけています。"],
    regulation: ["規制", "ライセンス、MiCA、税制、執行の変化が暗号資産プラットフォームの利用にどう影響するかを一次資料から解説します。"],
    rwa: ["RWA・トークン化", "トークン化国債や株式など現実資産の構造、利用条件、利回りの裏にあるリスクを調査します。"],
    research: ["出典付きリサーチ", "市場構造、取引所運営、取引コストに関する詳細リサーチ。各記事の末尾に出典を掲載しています。"],
  },
  ko: {
    guide: ["가이드", "거래소 계정 개설, 입금, 보안 설정을 단계별로 설명하며 모든 내용에 공식 출처를 연결합니다."],
    comparison: ["비교", "수수료, 상품, 이용 조건, 위험 관리 기준으로 거래소와 프로토콜을 공개 자료에 근거해 비교합니다."],
    "exchange-update": ["거래소 업데이트", "상장, 수수료 변경, 신상품, 정책 변경 등 거래소 발표를 날짜별로 기록하고 공식 공지와 연결합니다."],
    regulation: ["규제", "라이선스, MiCA, 세금, 집행 변화가 암호화폐 플랫폼 이용에 미치는 영향을 규제 기관과 거래소 원문으로 설명합니다."],
    rwa: ["RWA·토큰화", "토큰화 국채, 주식 등 실물 자산의 구조, 접근 규칙, 수익 뒤의 위험을 연구합니다."],
    research: ["출처 기반 리서치", "시장 구조, 거래소 운영, 거래 비용에 관한 심층 리서치로 각 기사 하단에 출처를 표시합니다."],
  },
  tr: {
    guide: ["Rehberler", "Borsa hesabı açma, para yatırma ve güvenlik ayarlarını adım adım anlatan, her iddiayı resmî kaynağa bağlayan rehberler."],
    comparison: ["Karşılaştırmalar", "Kripto borsaları ve protokolleri ücret, ürün, erişim ve risk kontrolleri açısından yayımlanmış kaynaklarla karşılaştırır."],
    "exchange-update": ["Borsa güncellemeleri", "Listeleme, ücret değişikliği, yeni ürün ve politika duyurularının tarihli kayıtları; her biri resmî duyuruya bağlıdır."],
    regulation: ["Düzenleme", "Lisans, MiCA, vergi ve yaptırım değişikliklerinin kripto platformlarına erişimi nasıl etkilediğini düzenleyici ve borsa kaynaklarıyla açıklar."],
    rwa: ["RWA ve tokenizasyon", "Tokenleştirilmiş tahviller, hisseler ve diğer gerçek dünya varlıklarının yapısı, erişim kuralları ve getirinin ardındaki riskler."],
    research: ["Kaynaklı araştırma", "Piyasa yapısı, borsa işleyişi ve işlem maliyetleri üzerine kapsamlı araştırmalar; kaynaklar her makalenin altında yer alır."],
  },
  es: {
    guide: ["Guías", "Guías paso a paso para abrir, fondear y proteger cuentas en exchanges cripto, con cada dato enlazado a una fuente oficial."],
    comparison: ["Comparativas", "Comparativas de exchanges y protocolos cripto en comisiones, productos, acceso y controles de riesgo, basadas en fuentes publicadas."],
    "exchange-update": ["Novedades de exchanges", "Notas fechadas sobre listados, cambios de comisiones, lanzamientos y políticas anunciadas por exchanges, cada una ligada al aviso oficial."],
    regulation: ["Regulación", "Cómo afectan las licencias, MiCA, los impuestos y la supervisión al acceso a plataformas cripto, explicado con fuentes de reguladores y exchanges."],
    rwa: ["RWA y tokenización", "Investigación sobre bonos del Tesoro, acciones y otros activos reales tokenizados: estructura, reglas de acceso y riesgos detrás del rendimiento."],
    research: ["Investigación con fuentes", "Investigación extensa sobre estructura de mercado, operación de exchanges y costos de trading, con fuentes al pie de cada artículo."],
  },
  "pt-BR": {
    guide: ["Guias", "Guias passo a passo para abrir, financiar e proteger contas em exchanges cripto, com cada informação ligada a uma fonte oficial."],
    comparison: ["Comparações", "Comparações de exchanges e protocolos cripto em taxas, produtos, acesso e controles de risco, com base em fontes publicadas."],
    "exchange-update": ["Novidades das exchanges", "Registros datados de listagens, mudanças de taxas, lançamentos e políticas anunciadas pelas exchanges, cada um ligado ao aviso oficial."],
    regulation: ["Regulação", "Como licenças, MiCA, tributação e fiscalização afetam o acesso a plataformas cripto, explicado com fontes de reguladores e exchanges."],
    rwa: ["RWA e tokenização", "Pesquisa sobre títulos do Tesouro, ações e outros ativos reais tokenizados: estrutura, regras de acesso e riscos por trás do rendimento."],
    research: ["Pesquisa com fontes", "Pesquisa aprofundada sobre estrutura de mercado, operação de exchanges e custos de negociação, com fontes ao final de cada artigo."],
  },
  fr: {
    guide: ["Guides", "Guides pas à pas pour ouvrir, alimenter et sécuriser un compte sur une plateforme crypto, chaque point étant relié à une source officielle."],
    comparison: ["Comparatifs", "Comparatifs de plateformes et protocoles crypto sur les frais, les produits, l’accès et la gestion des risques, à partir de sources publiées."],
    "exchange-update": ["Actualités des plateformes", "Notes datées sur les listings, changements de frais, lancements et politiques annoncés par les plateformes, chacune liée à l’avis officiel."],
    regulation: ["Réglementation", "Comment licences, MiCA, fiscalité et contrôles influencent l’accès aux plateformes crypto, expliqué à partir des sources des régulateurs et des plateformes."],
    rwa: ["RWA et tokenisation", "Recherche sur les bons du Trésor, actions et autres actifs réels tokenisés : structure, règles d’accès et risques derrière le rendement."],
    research: ["Recherche sourcée", "Recherche approfondie sur la structure de marché, le fonctionnement des plateformes et les coûts de trading, avec les sources sous chaque article."],
  },
  de: {
    guide: ["Leitfäden", "Schritt-für-Schritt-Anleitungen zum Eröffnen, Einzahlen und Absichern von Krypto-Börsenkonten, jede Aussage mit offizieller Quelle."],
    comparison: ["Vergleiche", "Vergleiche von Krypto-Börsen und Protokollen nach Gebühren, Produkten, Zugang und Risikokontrollen auf Basis veröffentlichter Quellen."],
    "exchange-update": ["Börsen-Updates", "Datierte Notizen zu Listings, Gebührenänderungen, Produktstarts und Richtlinien der Börsen, jeweils mit der offiziellen Mitteilung verknüpft."],
    regulation: ["Regulierung", "Wie Lizenzen, MiCA, Steuern und Aufsicht den Zugang zu Krypto-Plattformen beeinflussen, erklärt anhand von Aufsichts- und Börsenquellen."],
    rwa: ["RWA & Tokenisierung", "Recherche zu tokenisierten Staatsanleihen, Aktien und anderen Realwerten: Struktur, Zugangsregeln und die Risiken hinter der Rendite."],
    research: ["Quellenbasierte Recherche", "Ausführliche Recherche zu Marktstruktur, Börsenbetrieb und Handelskosten, mit Quellen unter jedem Artikel."],
  },
  it: {
    guide: ["Guide", "Guide passo passo per aprire, finanziare e proteggere un conto su un exchange crypto, con ogni informazione collegata a una fonte ufficiale."],
    comparison: ["Confronti", "Confronti tra exchange e protocolli crypto su commissioni, prodotti, accesso e controlli del rischio, basati su fonti pubblicate."],
    "exchange-update": ["Aggiornamenti degli exchange", "Note datate su listing, modifiche alle commissioni, lanci e policy annunciati dagli exchange, ognuna legata all’avviso ufficiale."],
    regulation: ["Regolamentazione", "Come licenze, MiCA, fisco e vigilanza influenzano l’accesso alle piattaforme crypto, spiegato con fonti di autorità ed exchange."],
    rwa: ["RWA e tokenizzazione", "Ricerca su titoli di Stato, azioni e altri asset reali tokenizzati: struttura, regole di accesso e rischi dietro il rendimento."],
    research: ["Ricerca con fonti", "Ricerca approfondita su struttura di mercato, operatività degli exchange e costi di trading, con le fonti sotto ogni articolo."],
  },
  ru: {
    guide: ["Руководства", "Пошаговые руководства по открытию, пополнению и защите аккаунтов на криптобиржах; каждое утверждение связано с официальным источником."],
    comparison: ["Сравнения", "Сравнения криптобирж и протоколов по комиссиям, продуктам, доступу и контролю рисков на основе опубликованных источников."],
    "exchange-update": ["Новости бирж", "Датированные заметки о листингах, изменениях комиссий, запусках и правилах бирж, каждая со ссылкой на официальное объявление."],
    regulation: ["Регулирование", "Как лицензии, MiCA, налоги и надзор влияют на доступ к криптоплатформам — по материалам регуляторов и бирж."],
    rwa: ["RWA и токенизация", "Исследования токенизированных гособлигаций, акций и других реальных активов: структура, правила доступа и риски за доходностью."],
    research: ["Исследования с источниками", "Подробные исследования рыночной структуры, работы бирж и торговых издержек с источниками под каждой статьёй."],
  },
  ar: {
    guide: ["أدلة", "أدلة خطوة بخطوة لفتح حسابات منصات العملات الرقمية وتمويلها وتأمينها، مع ربط كل معلومة بمصدر رسمي."],
    comparison: ["مقارنات", "مقارنات بين منصات وبروتوكولات العملات الرقمية في الرسوم والمنتجات وشروط الوصول وضوابط المخاطر، استناداً إلى مصادر منشورة."],
    "exchange-update": ["تحديثات المنصات", "ملاحظات مؤرخة عن الإدراجات وتغييرات الرسوم وإطلاق المنتجات والسياسات التي تعلنها المنصات، وكل منها مرتبط بالإعلان الرسمي."],
    regulation: ["التنظيم", "كيف تؤثر التراخيص وMiCA والضرائب والرقابة في الوصول إلى منصات العملات الرقمية، بالاستناد إلى مصادر الجهات التنظيمية والمنصات."],
    rwa: ["الأصول الحقيقية والترميز", "أبحاث حول سندات الخزانة والأسهم وغيرها من الأصول الحقيقية المرمّزة: البنية وقواعد الوصول والمخاطر وراء العائد."],
    research: ["أبحاث موثقة بالمصادر", "أبحاث معمقة حول بنية السوق وتشغيل المنصات وتكاليف التداول، مع ذكر المصادر أسفل كل مقال."],
  },
  id: {
    guide: ["Panduan", "Panduan langkah demi langkah untuk membuka, mendanai, dan mengamankan akun bursa kripto, dengan setiap klaim terhubung ke sumber resmi."],
    comparison: ["Perbandingan", "Perbandingan bursa dan protokol kripto dari sisi biaya, produk, akses, dan kontrol risiko berdasarkan sumber yang dipublikasikan."],
    "exchange-update": ["Pembaruan bursa", "Catatan bertanggal tentang listing, perubahan biaya, peluncuran produk, dan kebijakan bursa, masing-masing terhubung ke pengumuman resmi."],
    regulation: ["Regulasi", "Bagaimana lisensi, MiCA, pajak, dan penegakan hukum memengaruhi akses ke platform kripto, dijelaskan dari sumber regulator dan bursa."],
    rwa: ["RWA & tokenisasi", "Riset tentang obligasi negara, saham, dan aset dunia nyata lain yang ditokenisasi: struktur, aturan akses, dan risiko di balik imbal hasil."],
    research: ["Riset berbasis sumber", "Riset mendalam tentang struktur pasar, operasional bursa, dan biaya trading, dengan sumber di bawah setiap artikel."],
  },
  vi: {
    guide: ["Hướng dẫn", "Hướng dẫn từng bước để mở, nạp tiền và bảo mật tài khoản sàn tiền mã hóa, mỗi thông tin đều dẫn tới nguồn chính thức."],
    comparison: ["So sánh", "So sánh các sàn và giao thức tiền mã hóa về phí, sản phẩm, điều kiện truy cập và kiểm soát rủi ro dựa trên nguồn đã công bố."],
    "exchange-update": ["Cập nhật sàn giao dịch", "Ghi chép có ngày về niêm yết, thay đổi phí, ra mắt sản phẩm và chính sách do các sàn công bố, mỗi mục gắn với thông báo chính thức."],
    regulation: ["Quy định", "Giấy phép, MiCA, thuế và thực thi ảnh hưởng thế nào đến việc truy cập nền tảng tiền mã hóa, giải thích từ nguồn của cơ quan quản lý và sàn."],
    rwa: ["RWA & token hóa", "Nghiên cứu về trái phiếu chính phủ, cổ phiếu và tài sản thực khác được token hóa: cấu trúc, quy tắc truy cập và rủi ro phía sau lợi suất."],
    research: ["Nghiên cứu có nguồn", "Nghiên cứu chuyên sâu về cấu trúc thị trường, vận hành sàn và chi phí giao dịch, có nguồn ở cuối mỗi bài viết."],
  },
};

// [all, browse-by-category label, previous, next, page {n} of {total}, pagination label, searching, library scope {n}, no match, related]
const UI_COPY = {
  en: ["All articles", "Browse by category", "Previous page", "Next page", "Page {n} of {total}", "Article pages", "Searching the library…", "Searches all {n} published articles by title, summary and platform.", "No articles match these conditions.", "Related research"],
  "zh-Hans": ["全部文章", "按分类浏览", "上一页", "下一页", "第 {n} 页，共 {total} 页", "文章分页", "正在检索文章库…", "检索全部 {n} 篇已发布文章的标题、摘要与平台。", "没有符合这些条件的文章。", "相关研究"],
  "zh-Hant": ["全部文章", "依分類瀏覽", "上一頁", "下一頁", "第 {n} 頁，共 {total} 頁", "文章分頁", "正在搜尋文章庫…", "搜尋全部 {n} 篇已發布文章的標題、摘要與平台。", "沒有符合這些條件的文章。", "相關研究"],
  ja: ["すべての記事", "カテゴリから探す", "前のページ", "次のページ", "{n} / {total} ページ", "記事ページ", "記事ライブラリを検索中…", "公開済み {n} 件の記事をタイトル、要約、プラットフォームで検索します。", "条件に一致する記事はありません。", "関連リサーチ"],
  ko: ["전체 기사", "카테고리별 보기", "이전 페이지", "다음 페이지", "{total}페이지 중 {n}페이지", "기사 페이지", "기사 라이브러리 검색 중…", "게시된 기사 {n}건을 제목, 요약, 플랫폼으로 검색합니다.", "조건에 맞는 기사가 없습니다.", "관련 리서치"],
  tr: ["Tüm makaleler", "Kategoriye göre göz at", "Önceki sayfa", "Sonraki sayfa", "Sayfa {n} / {total}", "Makale sayfaları", "Kütüphane aranıyor…", "Yayımlanan {n} makalenin tamamında başlık, özet ve platforma göre arar.", "Bu koşullara uyan makale yok.", "İlgili araştırma"],
  es: ["Todos los artículos", "Explorar por categoría", "Página anterior", "Página siguiente", "Página {n} de {total}", "Páginas de artículos", "Buscando en la biblioteca…", "Busca en los {n} artículos publicados por título, resumen y plataforma.", "Ningún artículo coincide con estas condiciones.", "Investigación relacionada"],
  "pt-BR": ["Todos os artigos", "Navegar por categoria", "Página anterior", "Próxima página", "Página {n} de {total}", "Páginas de artigos", "Pesquisando na biblioteca…", "Pesquisa nos {n} artigos publicados por título, resumo e plataforma.", "Nenhum artigo corresponde a estas condições.", "Pesquisa relacionada"],
  fr: ["Tous les articles", "Parcourir par catégorie", "Page précédente", "Page suivante", "Page {n} sur {total}", "Pages d’articles", "Recherche dans la bibliothèque…", "Recherche dans les {n} articles publiés par titre, résumé et plateforme.", "Aucun article ne correspond à ces critères.", "Recherches associées"],
  de: ["Alle Artikel", "Nach Kategorie stöbern", "Vorherige Seite", "Nächste Seite", "Seite {n} von {total}", "Artikelseiten", "Bibliothek wird durchsucht…", "Durchsucht alle {n} veröffentlichten Artikel nach Titel, Zusammenfassung und Plattform.", "Keine Artikel entsprechen diesen Bedingungen.", "Verwandte Recherchen"],
  it: ["Tutti gli articoli", "Sfoglia per categoria", "Pagina precedente", "Pagina successiva", "Pagina {n} di {total}", "Pagine degli articoli", "Ricerca nella libreria…", "Cerca tra tutti i {n} articoli pubblicati per titolo, sintesi e piattaforma.", "Nessun articolo corrisponde a queste condizioni.", "Ricerche correlate"],
  ru: ["Все статьи", "Обзор по категориям", "Предыдущая страница", "Следующая страница", "Страница {n} из {total}", "Страницы статей", "Поиск по библиотеке…", "Поиск по всем {n} опубликованным статьям: заголовок, краткое описание и платформа.", "Нет статей, соответствующих условиям.", "Похожие исследования"],
  ar: ["كل المقالات", "تصفح حسب الفئة", "الصفحة السابقة", "الصفحة التالية", "الصفحة {n} من {total}", "صفحات المقالات", "جارٍ البحث في المكتبة…", "يبحث في جميع المقالات المنشورة وعددها {n} حسب العنوان والملخص والمنصة.", "لا توجد مقالات تطابق هذه الشروط.", "أبحاث ذات صلة"],
  id: ["Semua artikel", "Jelajahi per kategori", "Halaman sebelumnya", "Halaman berikutnya", "Halaman {n} dari {total}", "Halaman artikel", "Mencari di pustaka…", "Mencari di seluruh {n} artikel yang diterbitkan berdasarkan judul, ringkasan, dan platform.", "Tidak ada artikel yang sesuai dengan kondisi ini.", "Riset terkait"],
  vi: ["Tất cả bài viết", "Duyệt theo danh mục", "Trang trước", "Trang sau", "Trang {n} / {total}", "Các trang bài viết", "Đang tìm trong thư viện…", "Tìm trong toàn bộ {n} bài viết đã xuất bản theo tiêu đề, tóm tắt và nền tảng.", "Không có bài viết nào khớp điều kiện.", "Nghiên cứu liên quan"],
};

function localeKey(locale, table) {
  if (table[locale]) return locale;
  if (locale === "zh-TW") return "zh-Hant";
  if (String(locale).startsWith("zh")) return "zh-Hans";
  const base = String(locale || "").split("-")[0];
  if (table[base]) return base;
  if (base === "pt") return "pt-BR";
  return "en";
}

export function newsCategoryCopy(category, locale = "en") {
  if (!isNewsCategory(category)) return null;
  const [label, intro] = CATEGORY_COPY[localeKey(locale, CATEGORY_COPY)][category];
  return { key: category, label, intro };
}

export function newsLibraryCopy(locale = "en") {
  const [all, browse, previous, next, pageOf, pagination, searching, scope, empty, related] = UI_COPY[localeKey(locale, UI_COPY)];
  return {
    all, browse, previous, next, pagination, searching, empty, related,
    pageOf: (n, total) => pageOf.replace("{n}", String(n)).replace("{total}", String(total)),
    scope: (n) => scope.replace("{n}", String(n)),
  };
}

export const NEWS_LIBRARY_LOCALES = Object.freeze(Object.keys(UI_COPY));

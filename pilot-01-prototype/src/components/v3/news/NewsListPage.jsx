/**
 * NewsListPage — 实时新闻、深度研报与 SEO 文章大厅二级页面
 * 路由：/news, /news/page/N, /news/category/<key>[/page/N]
 */
import React, { useEffect, useRef, useState } from "react";
import { newsIndexSearchCopy } from "../../../data/news-index-search.js";
import { NEWS_CATEGORY_KEYS, NEWS_SEARCH_MAX_LIMIT, isNewsCategory, newsCategoryCopy, newsCategoryCounts, newsLibraryCopy, newsListingPath, newsPaginationItems, paginateNews, searchNewsArticles } from "../../../data/news-library.js";
import { venueDatabase } from "../../../data/venue-database.js";
import { exchangeUrl, hasLocalizedNewsText, loadNewsArticleSummaries, loadNewsLibraryPage, localizedNewsSummary, localizedNewsTitle, localizedValue, newsArticleUrl, normalizeNewsFeedSummaries } from "../../../data/news-feed-client.js";
import { contextualHref } from "../../../data/contextual-href.js";
import { BrandMark } from "../../brand/BrandMark.jsx";
import { DecisionPathRail } from "../DecisionPathRail.jsx";
import "./news-list-page.css";

const NEWS_INITIAL_VISIBLE_COUNT = 4;
const NEWS_BATCH_SIZE = 4;

const copy = {
  "zh-Hans": {
    eyebrow: "市场观察与研究",
    title: "新闻与研究",
    subtitle: "通过附有官方来源的分析，了解平台选择、交易成本与政策变化。",
    all: "全部文章",
    research: "深度研报",
    rates: "费率变动",
    compliance: "合规风向",
    readArticle: "阅读全文 →",
    compareVenues: "比较提及平台 →",
    readTime: "预计阅读",
    verifiedSource: "官方源头核验",
    partnerOffer: "提及交易所",
    openRegister: "去官网开户 ↗",
    emptyTitle: "暂未发布可展示文章",
    emptyBody: "文章暂时无法显示，请稍后重试。",
    emptyCategory: "这个分类暂时没有文章",
    emptyCategoryBody: "可以查看全部文章，继续了解平台和交易费用。",
    loadingTitle: "正在加载已核验文章…",
    loadingBody: "正在读取最新的来源核验内容。",
    showMore: "展开更多文章",
    showFewer: "收起文章",
  },
  "zh-Hant": {
    eyebrow: "市場觀察與研究",
    title: "新聞與研究",
    subtitle: "透過附有官方來源的分析，了解平台選擇、交易成本與政策變化。",
    all: "全部文章",
    research: "深度研報",
    rates: "費率變動",
    compliance: "合規風向",
    readArticle: "閱讀全文 →",
    compareVenues: "比較提及平台 →",
    readTime: "預計閱讀",
    verifiedSource: "官方源頭核驗",
    partnerOffer: "提及交易所",
    openRegister: "去官網開戶 ↗",
    emptyTitle: "暫未發布可展示文章",
    emptyBody: "文章暫時無法顯示，請稍後再試。",
    emptyCategory: "這個分類暫時沒有文章",
    emptyCategoryBody: "可以查看全部文章，繼續了解平台與交易費用。",
    loadingTitle: "正在載入已核驗文章…",
    loadingBody: "正在讀取最新的來源核驗內容。",
    showMore: "展開更多文章",
    showFewer: "收起文章",
  },
  en: {
    eyebrow: "Market news & research",
    title: "News & Research",
    subtitle: "Explore platform choices, trading costs and policy changes through analysis linked to official sources.",
    all: "All Articles",
    research: "Deep Research",
    rates: "Fee Rates",
    compliance: "Compliance",
    readArticle: "Read Article →",
    compareVenues: "Compare mentioned venues →",
    readTime: "Read time",
    verifiedSource: "Verified Source",
    partnerOffer: "Mentioned Venues",
    openRegister: "Open Account ↗",
    emptyTitle: "No Reviewed Articles Yet",
    emptyBody: "Articles are temporarily unavailable. Please try again later.",
    emptyCategory: "No articles in this category yet",
    emptyCategoryBody: "View all articles to explore platforms and trading costs.",
    loadingTitle: "Loading Reviewed Articles…",
    loadingBody: "Reading the latest source-verified content.",
    showMore: "Show more articles",
    showFewer: "Show fewer articles",
    researchIndex: "Research index",
    researchIndexBody: "Browse the reviewed archive by article.",
  },
};
copy.ja = { ...copy.en, eyebrow:"市場ニュースとリサーチ", title: "ニュースとリサーチ", subtitle: "公式資料に基づく分析で、プラットフォーム選び、取引コスト、政策の変化を確認できます。", all: "すべての記事", research: "深掘り調査", rates: "手数料変更", compliance: "規制情報", readArticle: "記事を読む →", compareVenues: "掲載サービスを比較 →", readTime: "読了時間", verifiedSource: "公式出典を確認", partnerOffer: "関連プラットフォーム", originalLanguageNotice: "この記事は英語原文です。翻訳版は確認後に追加します。", openRegister: "公式サイトを見る ↗", emptyTitle: "公開中の記事はありません", loadingTitle: "確認済み記事を読み込み中…", showMore: "記事をもっと見る", showFewer: "記事を折りたたむ", researchDesk: "NexuAlpha調査デスク" };
copy.ko = { ...copy.en, eyebrow:"시장 뉴스와 리서치", title: "뉴스와 리서치", subtitle: "공식 출처를 바탕으로 한 분석으로 플랫폼 선택, 거래 비용, 정책 변화를 살펴보세요.", all: "전체 기사", research: "심층 리서치", rates: "수수료 변경", compliance: "규제 동향", readArticle: "기사 읽기 →", compareVenues: "언급된 플랫폼 비교 →", readTime: "읽는 시간", verifiedSource: "공식 출처 확인", openRegister: "공식 사이트 보기 ↗", emptyTitle: "공개된 기사가 없습니다", loadingTitle: "검토된 기사 로드 중…", showMore: "더 많은 기사 보기", showFewer: "기사 접기" };
copy.tr = { ...copy.en, eyebrow:"Piyasa haberleri ve araştırma", title: "Haberler ve araştırma", subtitle: "Resmî kaynaklara dayanan analizlerle platform seçimini, işlem maliyetlerini ve politika değişikliklerini inceleyin.", all: "Tüm yazılar", research: "Derin araştırma", rates: "Ücret değişiklikleri", compliance: "Mevzuat", readArticle: "Makaleyi oku →", compareVenues: "Bahsedilen platformları karşılaştır →", readTime: "Okuma süresi", verifiedSource: "Resmi kaynak doğrulandı", openRegister: "Resmi siteyi aç ↗", emptyTitle: "Yayınlanmış makale yok", loadingTitle: "İncelenmiş makaleler yükleniyor…", showMore: "Daha fazla makale", showFewer: "Daha az göster" };
copy["pt-BR"] = { ...copy.en, eyebrow:"Notícias de mercado e pesquisa", title:"Notícias e pesquisa", subtitle:"Entenda a escolha de plataformas, os custos de negociação e as mudanças regulatórias com análises baseadas em fontes oficiais.", all:"Todos os artigos", research:"Pesquisa aprofundada", rates:"Alterações de taxas", compliance:"Conformidade", readArticle:"Ler artigo →", compareVenues:"Comparar plataformas citadas →", readTime:"Tempo de leitura", verifiedSource:"Fonte oficial verificada", openRegister:"Abrir site oficial ↗", emptyTitle:"Ainda não há artigos revisados", loadingTitle:"Carregando artigos revisados…", showMore:"Ver mais artigos", showFewer:"Recolher artigos" };
copy.es = { ...copy.en, eyebrow:"Noticias de mercado e investigación", title:"Noticias e investigación", subtitle:"Explora la elección de plataformas, los costes de negociación y los cambios normativos con análisis vinculados a fuentes oficiales.", all:"Todos los artículos", research:"Investigación profunda", rates:"Cambios de tarifas", compliance:"Cumplimiento", readArticle:"Leer artículo →", compareVenues:"Comparar plataformas mencionadas →", readTime:"Tiempo de lectura", verifiedSource:"Fuente oficial verificada", openRegister:"Abrir sitio oficial ↗", emptyTitle:"Aún no hay artículos revisados", loadingTitle:"Cargando artículos revisados…", showMore:"Ver más artículos", showFewer:"Mostrar menos" };
copy.fr = { ...copy.en, eyebrow:"Actualités du marché et recherche", title:"Actualités et recherche", subtitle:"Consultez des analyses fondées sur des sources officielles pour choisir une plateforme et comprendre les frais et les évolutions réglementaires.", all:"Tous les articles", research:"Recherche approfondie", rates:"Évolution des frais", compliance:"Conformité", readArticle:"Lire l'article →", compareVenues:"Comparer les plateformes citées →", readTime:"Temps de lecture", verifiedSource:"Source officielle vérifiée", openRegister:"Ouvrir le site officiel ↗", emptyTitle:"Aucun article vérifié pour le moment", loadingTitle:"Chargement des articles vérifiés…", showMore:"Voir plus d'articles", showFewer:"Réduire les articles" };
copy.de = { ...copy.en, eyebrow:"Marktnachrichten und Research", title:"Nachrichten und Research", subtitle:"Analysen mit offiziellen Quellen helfen bei der Plattformwahl und beim Verständnis von Handelskosten und regulatorischen Änderungen.", all:"Alle Artikel", research:"Tiefenrecherche", rates:"Gebührenänderungen", compliance:"Compliance", readArticle:"Artikel lesen →", compareVenues:"Genannte Plattformen vergleichen →", readTime:"Lesezeit", verifiedSource:"Offizielle Quelle geprüft", openRegister:"Offizielle Website öffnen ↗", emptyTitle:"Noch keine geprüften Artikel", loadingTitle:"Geprüfte Artikel werden geladen…", showMore:"Mehr Artikel anzeigen", showFewer:"Artikel einklappen" };
copy.ru = { ...copy.en, eyebrow:"Новости рынка и исследования", title:"Новости и исследования", subtitle:"Изучайте выбор платформ, торговые издержки и изменения регулирования с помощью анализа на основе официальных источников.", all:"Все статьи", research:"Глубокое исследование", rates:"Изменения комиссий", compliance:"Регулирование", readArticle:"Читать статью →", compareVenues:"Сравнить упомянутые площадки →", readTime:"Время чтения", verifiedSource:"Официальный источник проверен", openRegister:"Открыть официальный сайт ↗", emptyTitle:"Проверенных статей пока нет", loadingTitle:"Загрузка проверенных статей…", showMore:"Показать ещё статьи", showFewer:"Свернуть статьи" };
copy.ar = { ...copy.en, eyebrow:"أخبار السوق والأبحاث", title:"الأخبار والأبحاث", subtitle:"اطّلع على تحليلات تستند إلى مصادر رسمية لفهم اختيار المنصات وتكاليف التداول والتغييرات التنظيمية.", all:"كل المقالات", research:"بحث معمق", rates:"تغييرات الرسوم", compliance:"الامتثال", readArticle:"قراءة المقال →", compareVenues:"مقارنة المنصات المذكورة →", readTime:"وقت القراءة", verifiedSource:"مصدر رسمي متحقق", openRegister:"فتح الموقع الرسمي ↗", emptyTitle:"لا توجد مقالات مراجعة بعد", loadingTitle:"جارٍ تحميل المقالات المراجعة…", showMore:"عرض المزيد", showFewer:"طي المقالات" };
copy.id = { ...copy.en, eyebrow:"Berita pasar dan riset", title:"Berita dan riset", subtitle:"Pelajari pilihan platform, biaya perdagangan, dan perubahan kebijakan melalui analisis yang merujuk pada sumber resmi.", all:"Semua artikel", research:"Riset mendalam", rates:"Perubahan biaya", compliance:"Kepatuhan", readArticle:"Baca artikel →", compareVenues:"Bandingkan platform yang disebut →", readTime:"Waktu baca", verifiedSource:"Sumber resmi terverifikasi", openRegister:"Buka situs resmi ↗", emptyTitle:"Belum ada artikel yang ditinjau", loadingTitle:"Memuat artikel yang ditinjau…", showMore:"Tampilkan artikel lainnya", showFewer:"Ringkas artikel" };
copy.vi = { ...copy.en, eyebrow:"Tin thị trường và nghiên cứu", title:"Tin tức và nghiên cứu", subtitle:"Tìm hiểu cách chọn nền tảng, chi phí giao dịch và thay đổi chính sách qua các phân tích dựa trên nguồn chính thức.", all:"Tất cả bài viết", research:"Nghiên cứu chuyên sâu", rates:"Thay đổi phí", compliance:"Tuân thủ", readArticle:"Đọc bài →", compareVenues:"So sánh nền tảng được đề cập →", readTime:"Thời gian đọc", verifiedSource:"Đã xác minh nguồn chính thức", openRegister:"Mở trang chính thức ↗", emptyTitle:"Chưa có bài viết được duyệt", loadingTitle:"Đang tải bài viết đã duyệt…", showMore:"Xem thêm bài viết", showFewer:"Thu gọn bài viết" };
copy.it = { ...copy.en, eyebrow:"Notizie di mercato e ricerca", title:"Notizie e ricerca", subtitle:"Approfondisci la scelta delle piattaforme, i costi di negoziazione e i cambiamenti normativi con analisi basate su fonti ufficiali.", all:"Tutti gli articoli", research:"Ricerca approfondita", rates:"Variazioni delle commissioni", compliance:"Conformità", readArticle:"Leggi l'articolo →", compareVenues:"Confronta le piattaforme citate →", readTime:"Tempo di lettura", verifiedSource:"Fonte ufficiale verificata", openRegister:"Apri il sito ufficiale ↗", emptyTitle:"Nessun articolo verificato", loadingTitle:"Caricamento degli articoli verificati…", showMore:"Mostra altri articoli", showFewer:"Riduci articoli" };
const untranslatedNotice = {
  ko: "이 글은 영어 원문입니다. 검토 후 번역본을 추가합니다.", tr: "Bu yazı İngilizce aslıyla gösteriliyor. İnceleme sonrası çeviri eklenecek.", es: "Este artículo está en inglés original. Añadiremos la traducción tras su revisión.", "pt-BR": "Este artigo está no idioma original em inglês. A tradução será adicionada após revisão.", fr: "Cet article est dans sa langue originale anglaise. La traduction sera ajoutée après vérification.", de: "Dieser Artikel liegt im englischen Original vor. Die Übersetzung folgt nach der Prüfung.", ar: "هذا المقال باللغة الإنجليزية الأصلية. ستُضاف الترجمة بعد المراجعة.", ru: "Статья приведена на английском оригинале. Перевод будет добавлен после проверки.", id: "Artikel ini ditampilkan dalam bahasa Inggris asli. Terjemahan ditambahkan setelah peninjauan.", vi: "Bài viết đang ở bản gốc tiếng Anh. Bản dịch sẽ được thêm sau khi rà soát.", it: "Questo articolo è nella versione originale inglese. La traduzione sarà aggiunta dopo la revisione.", "zh-Hans": "本文暂以英文原文展示，审核后补充翻译。", "zh-Hant": "本文暫以英文原文展示，審閱後補充翻譯。"
};
for (const [locale, notice] of Object.entries(untranslatedNotice)) copy[locale] = { ...copy[locale], originalLanguageNotice: notice };

const newsReaderUi = {
  "en": {
    "sourceBackedResearch": "Source-Backed Research"
  },
  "zh-Hans": {
    "researchIndex": "研究索引",
    "researchIndexBody": "按文章浏览已审核的研究档案。",
    "sourceBackedResearch": "有来源依据的研究"
  },
  "zh-Hant": {
    "researchIndex": "研究索引",
    "researchIndexBody": "按文章瀏覽已審閱的研究檔案。",
    "sourceBackedResearch": "有來源依據的研究"
  },
  "ja": {
    "emptyBody": "記事を一時的に表示できません。後ほど再度お試しください。",
    "emptyCategory": "このカテゴリーにはまだ記事がありません",
    "emptyCategoryBody": "すべての記事から、プラットフォームや取引コストについて確認できます。",
    "loadingBody": "出典を確認した最新コンテンツを読み込んでいます。",
    "researchIndex": "リサーチ一覧",
    "researchIndexBody": "確認済みの資料を記事ごとに閲覧できます。",
    "sourceBackedResearch": "出典に基づくリサーチ"
  },
  "ko": {
    "emptyBody": "기사를 일시적으로 표시할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    "emptyCategory": "이 카테고리에는 아직 기사가 없습니다",
    "emptyCategoryBody": "전체 기사에서 플랫폼과 거래 비용을 살펴보세요.",
    "loadingBody": "출처를 확인한 최신 콘텐츠를 읽고 있습니다.",
    "researchIndex": "리서치 목록",
    "researchIndexBody": "검토된 자료를 기사별로 살펴보세요.",
    "sourceBackedResearch": "출처에 근거한 리서치"
  },
  "tr": {
    "emptyBody": "Makaleler geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.",
    "emptyCategory": "Bu kategoride henüz makale yok",
    "emptyCategoryBody": "Platformları ve işlem maliyetlerini incelemek için tüm makalelere göz atın.",
    "loadingBody": "Kaynakları kontrol edilmiş en yeni içerik okunuyor.",
    "researchIndex": "Araştırma dizini",
    "researchIndexBody": "İncelenmiş arşive makale bazında göz atın.",
    "sourceBackedResearch": "Kaynaklara dayalı araştırma"
  },
  "pt-BR": {
    "emptyBody": "Os artigos estão temporariamente indisponíveis. Tente novamente mais tarde.",
    "emptyCategory": "Ainda não há artigos nesta categoria",
    "emptyCategoryBody": "Veja todos os artigos para explorar plataformas e custos de negociação.",
    "loadingBody": "Carregando o conteúdo mais recente com fontes verificadas.",
    "researchIndex": "Índice de pesquisa",
    "researchIndexBody": "Explore o arquivo revisado por artigo.",
    "sourceBackedResearch": "PESQUISA COM BASE EM FONTES"
  },
  "es": {
    "emptyBody": "Los artículos no están disponibles temporalmente. Inténtalo de nuevo más tarde.",
    "emptyCategory": "Aún no hay artículos en esta categoría",
    "emptyCategoryBody": "Consulta todos los artículos para explorar plataformas y costes de negociación.",
    "loadingBody": "Cargando el contenido más reciente con fuentes verificadas.",
    "researchIndex": "Índice de investigación",
    "researchIndexBody": "Explora el archivo revisado por artículo.",
    "sourceBackedResearch": "INVESTIGACIÓN BASADA EN FUENTES"
  },
  "fr": {
    "emptyBody": "Les articles sont temporairement indisponibles. Réessayez plus tard.",
    "emptyCategory": "Aucun article dans cette catégorie pour le moment",
    "emptyCategoryBody": "Consultez tous les articles pour découvrir les plateformes et les coûts de trading.",
    "loadingBody": "Chargement des derniers contenus vérifiés à partir des sources.",
    "researchIndex": "Index des recherches",
    "researchIndexBody": "Parcourez les archives examinées, article par article.",
    "sourceBackedResearch": "RECHERCHE ÉTAYÉE PAR DES SOURCES"
  },
  "de": {
    "emptyBody": "Artikel sind vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.",
    "emptyCategory": "In dieser Kategorie gibt es noch keine Artikel",
    "emptyCategoryBody": "Alle Artikel zeigen weitere Informationen zu Plattformen und Handelskosten.",
    "loadingBody": "Die neuesten quellengeprüften Inhalte werden geladen.",
    "researchIndex": "Rechercheverzeichnis",
    "researchIndexBody": "Durchsuchen Sie das geprüfte Archiv nach Artikeln.",
    "sourceBackedResearch": "QUELLENGESTÜTZTE RECHERCHE"
  },
  "ru": {
    "emptyBody": "Статьи временно недоступны. Попробуйте позже.",
    "emptyCategory": "В этой категории пока нет статей",
    "emptyCategoryBody": "Откройте все статьи, чтобы изучить площадки и торговые расходы.",
    "loadingBody": "Загружаются свежие материалы с проверенными источниками.",
    "researchIndex": "Каталог исследований",
    "researchIndexBody": "Просматривайте проверенный архив по статьям.",
    "sourceBackedResearch": "ИССЛЕДОВАНИЯ НА ОСНОВЕ ИСТОЧНИКОВ"
  },
  "ar": {
    "emptyBody": "المقالات غير متاحة مؤقتًا. يُرجى المحاولة لاحقًا.",
    "emptyCategory": "لا توجد مقالات في هذه الفئة بعد",
    "emptyCategoryBody": "تصفح كل المقالات لاستكشاف المنصات وتكاليف التداول.",
    "loadingBody": "جارٍ تحميل أحدث المحتوى الذي جرى التحقق من مصادره.",
    "researchIndex": "فهرس الأبحاث",
    "researchIndexBody": "تصفح الأرشيف المُراجع حسب المقالة.",
    "sourceBackedResearch": "أبحاث تستند إلى المصادر"
  },
  "id": {
    "emptyBody": "Artikel sementara tidak tersedia. Coba lagi nanti.",
    "emptyCategory": "Belum ada artikel dalam kategori ini",
    "emptyCategoryBody": "Lihat semua artikel untuk mempelajari platform dan biaya perdagangan.",
    "loadingBody": "Memuat konten terbaru yang sumbernya telah diperiksa.",
    "researchIndex": "Indeks riset",
    "researchIndexBody": "Jelajahi arsip yang telah ditinjau berdasarkan artikel.",
    "sourceBackedResearch": "RISET BERDASARKAN SUMBER"
  },
  "vi": {
    "emptyBody": "Các bài viết tạm thời không khả dụng. Vui lòng thử lại sau.",
    "emptyCategory": "Chưa có bài viết trong danh mục này",
    "emptyCategoryBody": "Xem tất cả bài viết để tìm hiểu nền tảng và chi phí giao dịch.",
    "loadingBody": "Đang tải nội dung mới nhất đã kiểm tra nguồn.",
    "researchIndex": "Mục lục nghiên cứu",
    "researchIndexBody": "Duyệt kho nội dung đã rà soát theo từng bài viết.",
    "sourceBackedResearch": "NGHIÊN CỨU DỰA TRÊN NGUỒN"
  },
  "it": {
    "emptyBody": "Gli articoli non sono temporaneamente disponibili. Riprova più tardi.",
    "emptyCategory": "Non ci sono ancora articoli in questa categoria",
    "emptyCategoryBody": "Consulta tutti gli articoli per approfondire piattaforme e costi di trading.",
    "loadingBody": "Caricamento dei contenuti più recenti con fonti verificate.",
    "researchIndex": "Indice delle ricerche",
    "researchIndexBody": "Sfoglia l’archivio revisionato per articolo.",
    "sourceBackedResearch": "RICERCA BASATA SU FONTI"
  }
};
for (const [locale, nativeUi] of Object.entries(newsReaderUi)) copy[locale] = { ...copy[locale], ...nativeUi };

// News library (2026-10-10): real <a href> category archives and pages; search covers the whole published library
// through /api/news/search (compact rows only) and falls back to the compact summary feed on static hosts.
const NEWS_SEARCH_DEBOUNCE_MS = 250;
const idleSearch = { status: "idle", query: "", rows: [], total: 0, page: 0, totalPages: 0 };

export function NewsListPage({ locale = "en", market, product, initialArticles, category = null, page = 1, listing }) {
  const activeCategory = isNewsCategory(category) ? category : null;
  const requestedPage = Number.isInteger(page) && page > 0 ? page : 1;
  const [query, setQuery] = useState("");
  const searchInputRef = useRef(null);
  const searchCopy = newsIndexSearchCopy(locale);
  const libraryCopy = newsLibraryCopy(locale);
  const [visibleArticleCount, setVisibleArticleCount] = useState(NEWS_INITIAL_VISIBLE_COUNT);
  const [feedArticles, setFeedArticles] = useState(() => initialArticles ? normalizeNewsFeedSummaries(initialArticles) : []);
  const [feedState, setFeedState] = useState(() => initialArticles ? "ready" : "loading");
  // Server-paginated rows (Worker hydration state or the search endpoint); null means feedArticles is the whole library.
  const [serverListing, setServerListing] = useState(() => initialArticles && Number.isFinite(listing?.totalPages) ? listing : null);
  const [search, setSearch] = useState(idleSearch);
  const isZh = locale.startsWith("zh");
  const isHant = locale === "zh-Hant" || locale === "zh-TW";
  const t = copy[locale] || copy[String(locale || "").split("-")[0]] || (isHant ? copy["zh-Hant"] : isZh ? copy["zh-Hans"] : copy.en);
  const localizeCategory = (article) => {
    const own = article.categoryName && typeof article.categoryName === "object" ? article.categoryName[locale] : null;
    if (own) return own;
    const categoryName = localizedValue(article.categoryName, locale);
    if (article.category === "research" && categoryName === "Source-Backed Research") return newsCategoryCopy("research", locale)?.label || t.sourceBackedResearch;
    return newsCategoryCopy(article.category, locale)?.label || categoryName || article.category;
  };
  const localizeAuthor = (author) => author === "NexuAlpha Research Desk" ? (t.researchDesk || "NexuAlpha Research Desk") : author;
  const withContext = (href) => contextualHref(href, { locale, market, product });

  useEffect(() => {
    if (initialArticles) return undefined;
    let alive = true;
    loadNewsLibraryPage({ category: activeCategory, page: requestedPage, locale }).then(async (result) => {
      if (!alive) return;
      if (result) {
        setFeedArticles(result.articles);
        setServerListing({ category: activeCategory, page: result.page, total: result.total, totalPages: result.totalPages, libraryTotal: result.libraryTotal, counts: result.counts });
        setFeedState("ready");
        return;
      }
      const articles = await loadNewsArticleSummaries();
      if (alive) {
        setFeedArticles(articles);
        setServerListing(null);
        setFeedState("ready");
      }
    });
    return () => { alive = false; };
  }, [initialArticles, activeCategory, requestedPage, locale]);

  const trimmedQuery = query.trim();
  useEffect(() => {
    if (!trimmedQuery) {
      setSearch(idleSearch);
      return undefined;
    }
    let alive = true;
    setSearch((current) => ({ ...current, status: "loading", query: trimmedQuery }));
    const timer = setTimeout(async () => {
      // Search always covers the whole published library (the scope line says so), also on category archives.
      const result = await loadNewsLibraryPage({ query: trimmedQuery, locale, limit: NEWS_SEARCH_MAX_LIMIT });
      if (!alive) return;
      if (result) {
        setSearch({ status: "ready", query: trimmedQuery, rows: result.articles, total: result.total, page: result.page, totalPages: result.totalPages });
        return;
      }
      const library = serverListing ? await loadNewsArticleSummaries() : feedArticles;
      if (!alive) return;
      const rows = searchNewsArticles(library, { query: trimmedQuery });
      setSearch({ status: "ready", query: trimmedQuery, rows, total: rows.length, page: 1, totalPages: 1 });
    }, NEWS_SEARCH_DEBOUNCE_MS);
    return () => { alive = false; clearTimeout(timer); };
  }, [trimmedQuery, locale]);

  const localPage = serverListing ? null : paginateNews(feedArticles, { category: activeCategory, page: requestedPage });
  const pageRows = serverListing ? feedArticles : localPage.rows;
  const currentPage = serverListing ? serverListing.page : localPage.page;
  const totalPages = serverListing ? serverListing.totalPages : localPage.totalPages;
  const libraryTotal = serverListing?.libraryTotal || (serverListing ? 0 : feedArticles.length);
  const counts = serverListing?.counts || (!serverListing && feedArticles.length ? newsCategoryCounts(feedArticles) : null);
  const searching = Boolean(trimmedQuery);
  const articles = searching ? search.rows : pageRows;
  const visibleArticles = articles.slice(0, visibleArticleCount);
  const moreSearchPages = searching && search.status === "ready" && search.page < search.totalPages;
  const hasMoreArticles = visibleArticleCount < articles.length || moreSearchPages;

  useEffect(() => {
    setVisibleArticleCount(NEWS_INITIAL_VISIBLE_COUNT);
  }, [activeCategory, trimmedQuery, requestedPage]);

  const showMore = async () => {
    if (visibleArticleCount < articles.length) {
      setVisibleArticleCount((count) => Math.min(count + NEWS_BATCH_SIZE, articles.length));
      return;
    }
    if (!moreSearchPages) return;
    const next = await loadNewsLibraryPage({ query: search.query, locale, page: search.page + 1, limit: NEWS_SEARCH_MAX_LIMIT });
    if (!next) return;
    setSearch((current) => current.query === search.query
      ? { ...current, rows: [...current.rows, ...next.articles], page: next.page, totalPages: next.totalPages, total: next.total }
      : current);
    setVisibleArticleCount((count) => count + NEWS_BATCH_SIZE);
  };

  const categoryCopy = activeCategory ? newsCategoryCopy(activeCategory, locale) : null;
  const statusText = searching
    ? (search.status === "ready" ? searchCopy.results(search.total) : libraryCopy.searching)
    : libraryCopy.pageOf(currentPage, totalPages);
  const tabs = [{ key: null, label: libraryCopy.all }, ...NEWS_CATEGORY_KEYS.map((key) => ({ key, label: newsCategoryCopy(key, locale).label }))];

  return (
    <main className="v6 v2-page v3-page news-page" id="top" data-news-category={activeCategory || "all"} data-news-page={currentPage}>
      <section className="news-hero v2-shell">
        <div className="news-hero__badge">
          <span className="news-hero__pulse"></span>
          {t.eyebrow}
        </div>
        <h1 className="news-hero__title">{categoryCopy ? categoryCopy.label : t.title}</h1>
        <p className="news-hero__subtitle">{categoryCopy ? categoryCopy.intro : t.subtitle}</p>

        <div className="news-index-controls">
        <div className="news-index-search">
          <label htmlFor="news-index-query">{searchCopy.label}</label>
          <input ref={searchInputRef} id="news-index-query" type="search" value={query} placeholder={searchCopy.placeholder} aria-describedby="news-index-search-scope" onChange={(event) => setQuery(event.target.value)} />
          {query && <button type="button" className="news-index-search__clear" onClick={() => { setQuery(""); searchInputRef.current?.focus({ preventScroll: true }); }}>{searchCopy.clear}</button>}
          <p className="news-index-search__scope" id="news-index-search-scope">{libraryTotal ? libraryCopy.scope(libraryTotal) : null}</p>
        </div>
        <nav className="news-tabs news-category-nav" aria-label={libraryCopy.browse}>
          {tabs.map(({ key, label }) => {
            const current = (key || null) === activeCategory;
            return (
              <a
                key={key || "all"}
                className={`news-tab ${current ? "news-tab--active" : ""}`}
                href={withContext(newsListingPath({ category: key }))}
                aria-current={current ? "page" : undefined}
                data-cta-kind="research"
                data-cta-placement="news-category-nav"
              >
                {label}
                {key && counts && Number.isFinite(counts[key]) && <span className="news-tab__count">{counts[key]}</span>}
              </a>
            );
          })}
        </nav>
        </div>
        {feedState === "ready" && <p className="news-index-status" role="status" aria-live="polite">{statusText}</p>}
      </section>

      <section className="news-grid-section v2-shell" aria-live="polite" aria-busy={feedState === "loading" || search.status === "loading"} data-route-label={t.all || copy.en.all}>
        {feedState === "loading" && (
          <div className="news-grid news-grid--loading" role="status" aria-label={t.loadingTitle}>
            {Array.from({ length: 6 }, (_, index) => (
              <div className="news-article-card news-article-card--skeleton" key={`loading-${index}`} aria-hidden="true">
                <span className="news-skeleton-line news-skeleton-line--short" />
                <span className="news-skeleton-line news-skeleton-line--title" />
                <span className="news-skeleton-line" />
                <span className="news-skeleton-line news-skeleton-line--wide" />
              </div>
            ))}
          </div>
        )}
        {feedState === "ready" && articles.length === 0 && !(searching && search.status === "loading") && (
          <div className="news-article-card">
            <h2 className="news-article-card__title">{searching ? libraryCopy.empty : feedArticles.length || serverListing?.total === 0 ? t.emptyCategory : t.emptyTitle}</h2>
            <p className="news-article-card__summary">{searching ? (libraryTotal ? libraryCopy.scope(libraryTotal) : null) : feedArticles.length || serverListing?.total === 0 ? t.emptyCategoryBody : t.emptyBody}</p>
            {searching
              ? <button type="button" className="news-tab" onClick={() => { setQuery(""); searchInputRef.current?.focus({ preventScroll: true }); }}>{searchCopy.reset}</button>
              : activeCategory && <a className="news-tab" href={withContext(newsListingPath({}))}>{libraryCopy.all}</a>}
          </div>
        )}
        <div className="news-grid" id="news-article-grid" data-visible-count={visibleArticles.length}>
          {visibleArticles.map((article) => {
            const title = localizedNewsTitle(article, locale);
            const summary = localizedNewsSummary(article, locale);
            const hasLocalizedContent = hasLocalizedNewsText(article, "title", locale) && hasLocalizedNewsText(article, "summary", locale);
            const catName = localizeCategory(article);
            const articleUrl = withContext(newsArticleUrl(article.slug, locale));
            const compareSlugs = (article.relatedVenues || []).slice(0, 2);
            const compareUrl = compareSlugs.length === 2
              ? withContext(`/compare/${compareSlugs.join("-vs-")}`)
              : null;

            return (
              <article key={article.slug} className="news-article-card">
                <div className="news-article-card__header">
                  <span className={`news-article-card__tag news-article-card__tag--${article.category}`}>
                    {catName}
                  </span>
                  <time className="news-article-card__time" dateTime={article.publishedAt}>
                    {String(article.publishedAt).slice(0, 10)}
                  </time>
                </div>

                <h2 className="news-article-card__title">
                  <a href={articleUrl}>{title}</a>
                </h2>

                <p className="news-article-card__summary">{summary}</p>
                {!hasLocalizedContent && locale !== "en" && <p className="news-article-card__translation-note" role="note">{t.originalLanguageNotice || "Original-language source; translation pending review."}</p>}

                {article.relatedVenues && article.relatedVenues.length > 0 && (
                  <div className="news-article-card__venues">
                    <span className="news-article-card__venues-label">{t.partnerOffer}:</span>
                    {article.relatedVenues.map((slug) => {
                      const db = venueDatabase[slug] || {};
                      return (
                        <a
                          key={slug}
                          href={withContext(exchangeUrl(slug, locale))}
                          className="news-article-card__venue-chip"
                          data-cta-kind="research"
                          data-cta-platform={slug}
                          data-cta-placement="news-card-venue"
                          data-growth-decision={slug}
                          data-growth-placement="news-card-venue"
                        >
                          <BrandMark slug={slug} compact />
                          <span translate="no" lang="en">{db.name || slug}</span>
                        </a>
                      );
                    })}
                  </div>
                )}

                <footer className="news-article-card__footer">
                  <span className="news-article-card__author">{localizeAuthor(article.author)}</span>
                  {compareUrl && (
                    <a
                      href={compareUrl}
                      className="news-article-card__compare-link"
                      data-cta-kind="research"
                      data-cta-placement="news-card-compare"
                      data-growth-decision={`${compareSlugs[0]}_vs_${compareSlugs[1]}`}
                      data-growth-placement="news-card-compare"
                    >
                      {t.compareVenues}
                    </a>
                  )}
                  <a href={articleUrl} className="news-article-card__read-link" data-cta-kind="research" data-cta-placement="news-card-read" data-growth-decision={article.slug || article.id} data-growth-placement="news-card-read">
                    {t.readArticle}
                  </a>
                </footer>
              </article>
            );
          })}
        </div>
        {hasMoreArticles && (
          <button
            type="button"
            className="news-articles-toggle"
            aria-controls="news-article-grid news-research-index"
            aria-expanded={visibleArticleCount > NEWS_INITIAL_VISIBLE_COUNT}
            aria-label={`${t.showMore}: ${Math.min(visibleArticleCount + NEWS_BATCH_SIZE, searching ? search.total : articles.length)} / ${searching ? search.total : articles.length}`}
            data-cta-placement="news-articles-more"
            onClick={showMore}
          >
            {t.showMore}
          </button>
        )}
        {!searching && feedState === "ready" && (
          <NewsPagination locale={locale} category={activeCategory} page={currentPage} totalPages={totalPages} withContext={withContext} copy={libraryCopy} />
        )}
      <div className="v2-shell news-page__decision-rail">
        <DecisionPathRail locale={locale} market={market} product={product} current="news" />
      </div>
        {feedState === "ready" && pageRows.length > NEWS_INITIAL_VISIBLE_COUNT && (
          <details className="news-research-index" id="news-research-index" data-ssr-indexable="true" data-route-label={t.researchIndex || copy.en.researchIndex}>
            <summary className="news-research-index__summary">{t.researchIndex || copy.en.researchIndex}</summary>
            <p className="news-research-index__body">{t.researchIndexBody || copy.en.researchIndexBody}</p>
            <nav aria-label={t.researchIndex || copy.en.researchIndex} className="news-research-index__links">
              {pageRows.map((article) => (
                <a key={`index-${article.slug}`} href={withContext(newsArticleUrl(article.slug, locale))}>
                  {localizedNewsTitle(article, locale)}
                </a>
              ))}
            </nav>
          </details>
        )}
      </section>
    </main>
  );
}

function NewsPagination({ locale, category, page, totalPages, withContext, copy: libraryCopy }) {
  if (totalPages <= 1) return null;
  const href = (n) => withContext(newsListingPath({ category, page: n }));
  return (
    <nav className="news-pagination" aria-label={libraryCopy.pagination} data-page={page} data-total-pages={totalPages} lang={locale}>
      {page > 1 && (
        <a className="news-pagination__step news-pagination__step--prev" href={href(page - 1)} rel="prev" data-cta-placement="news-pagination-prev">
          <span aria-hidden="true">←</span> {libraryCopy.previous}
        </a>
      )}
      <ol className="news-pagination__pills">
        {newsPaginationItems(page, totalPages).map((n, index) => n === null
          ? <li key={`gap-${index}`} className="news-pagination__gap" aria-hidden="true">…</li>
          : <li key={n}><a className="news-pagination__pill" href={href(n)} aria-current={n === page ? "page" : undefined}>{n}</a></li>)}
      </ol>
      <p className="news-pagination__status">{libraryCopy.pageOf(page, totalPages)}</p>
      {page < totalPages && (
        <a className="news-pagination__step news-pagination__step--next" href={href(page + 1)} rel="next" data-cta-placement="news-pagination-next">
          {libraryCopy.next} <span aria-hidden="true">→</span>
        </a>
      )}
    </nav>
  );
}

export default NewsListPage;

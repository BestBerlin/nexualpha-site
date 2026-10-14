/**
 * NewsListPage — 实时新闻、深度研报与 SEO 文章大厅二级页面
 * 路由：/news, /news/page/N, /news/category/<key>[/page/N]
 */
import React, { useEffect, useRef, useState } from "react";
import { sectionEyebrowAttrs } from "../../../data/section-eyebrow.js";
import { TelegramAlertsStrip } from "../TelegramAlertsStrip.jsx";
import { newsIndexSearchCopy } from "../../../data/news-index-search.js";
import { newsListHeroCopy } from "../../../data/news-list-copy.js";
import { NEWS_CATEGORY_KEYS, NEWS_PAGE_SIZE, NEWS_SEARCH_MAX_LIMIT, isNewsCategory, newsCategoryCopy, newsCategoryCounts, newsLibraryCopy, newsListingPath, newsPaginationItems, paginateNews, searchNewsArticles } from "../../../data/news-library.js";
import { exchangeUrl, hasLocalizedNewsText, loadNewsArticleSummaries, loadNewsLibraryPage, localizedNewsSummary, localizedNewsTitle, localizedValue, newsArticleUrl, newsVenueName, normalizeNewsFeedSummaries } from "../../../data/news-feed-client.js";
import { contextualHref } from "../../../data/contextual-href.js";
import { BrandMark } from "../../brand/BrandMark.jsx";
import { DecisionPathRail } from "../DecisionPathRail.jsx";
import { DataRule, utcClock, utcStamp } from "../../shared/DataRule.jsx";
import { formatSgt, readerDayKey } from "../../../data/local-time.js";
import "../../../styles/news-list-page.css";

// Editorial index (2026-10-11): a whole page is one lead story plus dense day-grouped rows, so every row of the page is
// visible; search results still arrive in page-sized batches.
const NEWS_INITIAL_VISIBLE_COUNT = NEWS_PAGE_SIZE;
const NEWS_BATCH_SIZE = NEWS_PAGE_SIZE;

const DAY_MS = 86_400_000;

function groupNewsByDay(rows = []) {
  const groups = [];
  for (const row of rows) {
    const day = readerDayKey(row?.publishedAt) || "undated";
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.rows.push(row);
    else groups.push({ day, rows: [row] });
  }
  return groups;
}

function relativeDay(day, nowMs) {
  if (!nowMs || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const today = readerDayKey(new Date(nowMs).toISOString());
  if (day === today) return "today";
  if (day === readerDayKey(new Date(nowMs - DAY_MS).toISOString())) return "yesterday";
  return null;
}

const NEWS_DAY_COPY = {
  en: { latest: "Latest", today: "Today", yesterday: "Yesterday", stories: (n) => `${n} ${n === 1 ? "story" : "stories"}` },
  "zh-Hans": { latest: "最新", today: "今天", yesterday: "昨天", stories: (n) => `${n} 篇` },
  "zh-Hant": { latest: "最新", today: "今天", yesterday: "昨天", stories: (n) => `${n} 篇` },
  es: { latest: "Lo último", today: "Hoy", yesterday: "Ayer", stories: (n) => `${n} ${n === 1 ? "artículo" : "artículos"}` },
  "pt-BR": { latest: "Mais recente", today: "Hoje", yesterday: "Ontem", stories: (n) => `${n} ${n === 1 ? "artigo" : "artigos"}` },
  fr: { latest: "À la une", today: "Aujourd’hui", yesterday: "Hier", stories: (n) => `${n} ${n === 1 ? "article" : "articles"}` },
  de: { latest: "Neueste Meldung", today: "Heute", yesterday: "Gestern", stories: (n) => `${n} ${n === 1 ? "Beitrag" : "Beiträge"}` },
  it: { latest: "Ultima ora", today: "Oggi", yesterday: "Ieri", stories: (n) => `${n} ${n === 1 ? "articolo" : "articoli"}` },
  ja: { latest: "最新", today: "今日", yesterday: "昨日", stories: (n) => `${n} 件` },
  ko: { latest: "최신", today: "오늘", yesterday: "어제", stories: (n) => `${n}건` },
  ru: { latest: "Главное", today: "Сегодня", yesterday: "Вчера", stories: (n) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? "статья" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "статьи" : "статей"}` },
  tr: { latest: "Son haber", today: "Bugün", yesterday: "Dün", stories: (n) => `${n} haber` },
  id: { latest: "Terbaru", today: "Hari ini", yesterday: "Kemarin", stories: (n) => `${n} artikel` },
  vi: { latest: "Mới nhất", today: "Hôm nay", yesterday: "Hôm qua", stories: (n) => `${n} bài` },
  ar: { latest: "الأحدث", today: "اليوم", yesterday: "أمس", stories: (n) => `${n} ${n === 1 ? "مقال" : n === 2 ? "مقالان" : n <= 10 ? "مقالات" : "مقالًا"}` },
  ur: { latest: "تازہ ترین", today: "آج", yesterday: "گزشتہ روز", stories: (n) => `${n} ${n === 1 ? "تحریر" : "تحریریں"}` },
  uk: { latest: "Найновіше", today: "Сьогодні", yesterday: "Учора", stories: (n) => `${n} ${{ one: "матеріал", few: "матеріали", many: "матеріалів", other: "матеріалу" }[new Intl.PluralRules("uk").select(n)]}` },
};

function newsDayCopy(locale) {
  return NEWS_DAY_COPY[locale] || (String(locale || "").startsWith("zh") ? NEWS_DAY_COPY["zh-Hans"] : NEWS_DAY_COPY.en);
}

const copy = {
  "zh-Hans": {
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
copy.ja = { ...copy.en, all: "すべての記事", research: "深掘り調査", rates: "手数料変更", compliance: "規制情報", readArticle: "記事を読む →", compareVenues: "掲載サービスを比較 →", readTime: "読了時間", verifiedSource: "公式出典を確認", partnerOffer: "関連プラットフォーム", originalLanguageNotice: "この記事は英語原文です。翻訳版は確認後に追加します。", openRegister: "公式サイトを見る ↗", emptyTitle: "公開中の記事はありません", loadingTitle: "確認済み記事を読み込み中…", showMore: "記事をもっと見る", showFewer: "記事を折りたたむ", researchDesk: "NexuAlpha調査デスク" };
copy.ko = { ...copy.en, all: "전체 기사", research: "심층 리서치", rates: "수수료 변경", compliance: "규제 동향", readArticle: "기사 읽기 →", compareVenues: "언급된 플랫폼 비교 →", readTime: "읽는 시간", verifiedSource: "공식 출처 확인", openRegister: "공식 사이트 보기 ↗", emptyTitle: "공개된 기사가 없습니다", loadingTitle: "검토된 기사 로드 중…", showMore: "더 많은 기사 보기", showFewer: "기사 접기" };
copy.tr = { ...copy.en, all: "Tüm yazılar", research: "Derin araştırma", rates: "Ücret değişiklikleri", compliance: "Mevzuat", readArticle: "Makaleyi oku →", compareVenues: "Bahsedilen platformları karşılaştır →", readTime: "Okuma süresi", verifiedSource: "Resmi kaynak doğrulandı", openRegister: "Resmi siteyi aç ↗", emptyTitle: "Yayınlanmış makale yok", loadingTitle: "İncelenmiş makaleler yükleniyor…", showMore: "Daha fazla makale", showFewer: "Daha az göster" };
copy["pt-BR"] = { ...copy.en, all:"Todos os artigos", research:"Pesquisa aprofundada", rates:"Alterações de taxas", compliance:"Conformidade", readArticle:"Ler artigo →", compareVenues:"Comparar plataformas citadas →", readTime:"Tempo de leitura", verifiedSource:"Fonte oficial verificada", openRegister:"Abrir site oficial ↗", emptyTitle:"Ainda não há artigos revisados", loadingTitle:"Carregando artigos revisados…", showMore:"Ver mais artigos", showFewer:"Recolher artigos" };
copy.es = { ...copy.en, all:"Todos los artículos", research:"Investigación profunda", rates:"Cambios de tarifas", compliance:"Cumplimiento", readArticle:"Leer artículo →", compareVenues:"Comparar plataformas mencionadas →", readTime:"Tiempo de lectura", verifiedSource:"Fuente oficial verificada", openRegister:"Abrir sitio oficial ↗", emptyTitle:"Aún no hay artículos revisados", loadingTitle:"Cargando artículos revisados…", showMore:"Ver más artículos", showFewer:"Mostrar menos" };
copy.fr = { ...copy.en, all:"Tous les articles", research:"Recherche approfondie", rates:"Évolution des frais", compliance:"Conformité", readArticle:"Lire l'article →", compareVenues:"Comparer les plateformes citées →", readTime:"Temps de lecture", verifiedSource:"Source officielle vérifiée", openRegister:"Ouvrir le site officiel ↗", emptyTitle:"Aucun article vérifié pour le moment", loadingTitle:"Chargement des articles vérifiés…", showMore:"Voir plus d'articles", showFewer:"Réduire les articles" };
copy.de = { ...copy.en, all:"Alle Artikel", research:"Tiefenrecherche", rates:"Gebührenänderungen", compliance:"Compliance", readArticle:"Artikel lesen →", compareVenues:"Genannte Plattformen vergleichen →", readTime:"Lesezeit", verifiedSource:"Offizielle Quelle geprüft", openRegister:"Offizielle Website öffnen ↗", emptyTitle:"Noch keine geprüften Artikel", loadingTitle:"Geprüfte Artikel werden geladen…", showMore:"Mehr Artikel anzeigen", showFewer:"Artikel einklappen" };
copy.ru = { ...copy.en, all:"Все статьи", research:"Глубокое исследование", rates:"Изменения комиссий", compliance:"Регулирование", readArticle:"Читать статью →", compareVenues:"Сравнить упомянутые площадки →", readTime:"Время чтения", verifiedSource:"Официальный источник проверен", openRegister:"Открыть официальный сайт ↗", emptyTitle:"Проверенных статей пока нет", loadingTitle:"Загрузка проверенных статей…", showMore:"Показать ещё статьи", showFewer:"Свернуть статьи" };
copy.ar = { ...copy.en, all:"كل المقالات", research:"بحث معمق", rates:"تغييرات الرسوم", compliance:"الامتثال", readArticle:"قراءة المقال →", compareVenues:"مقارنة المنصات المذكورة →", readTime:"وقت القراءة", verifiedSource:"مصدر رسمي متحقق", openRegister:"فتح الموقع الرسمي ↗", emptyTitle:"لا توجد مقالات مراجعة بعد", loadingTitle:"جارٍ تحميل المقالات المراجعة…", showMore:"عرض المزيد", showFewer:"طي المقالات" };
// l10n: needs native review
copy.ur = { ...copy.en, all:"تمام مضامین", research:"گہری تحقیق", rates:"فیس تبدیلیاں", compliance:"کمپلائنس", readArticle:"مضمون پڑھیں →", compareVenues:"ذکر کردہ پلیٹ فارمز کا موازنہ →", readTime:"مطالعہ وقت", verifiedSource:"تصدیق شدہ سرکاری ذریعہ", partnerOffer:"ذکر کردہ پلیٹ فارمز", openRegister:"سرکاری سائٹ کھولیں ↗", emptyTitle:"ابھی کوئی جائزہ شدہ مضمون نہیں", emptyBody:"مضامین عارضی طور پر دستیاب نہیں۔ بعد میں دوبارہ کوشش کریں۔", emptyCategory:"اس زمرے میں ابھی کوئی مضمون نہیں", emptyCategoryBody:"پلیٹ فارمز اور ٹریڈنگ لاگت دیکھنے کے لیے تمام مضامین کھولیں۔", loadingTitle:"جائزہ شدہ مضامین لوڈ ہو رہے ہیں…", loadingBody:"تازہ ترین ذریعہ تصدیق شدہ مواد پڑھا جا رہا ہے۔", showMore:"مزید مضامین دکھائیں", showFewer:"مضامین کم دکھائیں", researchIndex:"تحقیق اشاریہ", researchIndexBody:"جائزہ شدہ آرکائیو کو مضمون کے حساب سے دیکھیں۔" };
// l10n: needs native review
copy.uk = { ...copy.en, all:"Усі статті", research:"Глибоке дослідження", rates:"Зміни комісій", compliance:"Комплаєнс", readArticle:"Читати статтю →", compareVenues:"Порівняти згадані платформи →", readTime:"Час читання", verifiedSource:"Перевірене офіційне джерело", partnerOffer:"Згадані платформи", openRegister:"Відкрити офіційний сайт ↗", emptyTitle:"Переглянутих статей ще немає", emptyBody:"Статті тимчасово недоступні. Спробуйте пізніше.", emptyCategory:"У цій категорії ще немає статей", emptyCategoryBody:"Перегляньте всі статті, щоб дослідити платформи й торгові витрати.", loadingTitle:"Завантаження переглянутих статей…", loadingBody:"Читаємо найновіший матеріал із перевіреними джерелами.", showMore:"Показати більше статей", showFewer:"Показати менше статей", researchIndex:"Індекс досліджень", researchIndexBody:"Переглядайте перевірений архів за статтями." };
copy.id = { ...copy.en, all:"Semua artikel", research:"Riset mendalam", rates:"Perubahan biaya", compliance:"Kepatuhan", readArticle:"Baca artikel →", compareVenues:"Bandingkan platform yang disebut →", readTime:"Waktu baca", verifiedSource:"Sumber resmi terverifikasi", openRegister:"Buka situs resmi ↗", emptyTitle:"Belum ada artikel yang ditinjau", loadingTitle:"Memuat artikel yang ditinjau…", showMore:"Tampilkan artikel lainnya", showFewer:"Ringkas artikel" };
copy.vi = { ...copy.en, all:"Tất cả bài viết", research:"Nghiên cứu chuyên sâu", rates:"Thay đổi phí", compliance:"Tuân thủ", readArticle:"Đọc bài →", compareVenues:"So sánh nền tảng được đề cập →", readTime:"Thời gian đọc", verifiedSource:"Đã xác minh nguồn chính thức", openRegister:"Mở trang chính thức ↗", emptyTitle:"Chưa có bài viết được duyệt", loadingTitle:"Đang tải bài viết đã duyệt…", showMore:"Xem thêm bài viết", showFewer:"Thu gọn bài viết" };
copy.it = { ...copy.en, all:"Tutti gli articoli", research:"Ricerca approfondita", rates:"Variazioni delle commissioni", compliance:"Conformità", readArticle:"Leggi l'articolo →", compareVenues:"Confronta le piattaforme citate →", readTime:"Tempo di lettura", verifiedSource:"Fonte ufficiale verificata", openRegister:"Apri il sito ufficiale ↗", emptyTitle:"Nessun articolo verificato", loadingTitle:"Caricamento degli articoli verificati…", showMore:"Mostra altri articoli", showFewer:"Riduci articoli" };
const untranslatedNotice = {
  ko: "이 글은 영어 원문입니다. 검토 후 번역본을 추가합니다.", tr: "Bu yazı İngilizce aslıyla gösteriliyor. İnceleme sonrası çeviri eklenecek.", es: "Este artículo está en inglés original. Añadiremos la traducción tras su revisión.", "pt-BR": "Este artigo está no idioma original em inglês. A tradução será adicionada após revisão.", fr: "Cet article est dans sa langue originale anglaise. La traduction sera ajoutée après vérification.", de: "Dieser Artikel liegt im englischen Original vor. Die Übersetzung folgt nach der Prüfung.", ar: "هذا المقال باللغة الإنجليزية الأصلية. ستُضاف الترجمة بعد المراجعة.",
  // l10n: needs native review
  ur: "یہ مضمون انگریزی اصل زبان میں دکھایا جا رہا ہے۔ جائزے کے بعد ترجمہ شامل کیا جائے گا.",
  // l10n: needs native review
  uk: "Цю статтю показано в оригіналі англійською. Переклад буде додано після перегляду.", ru: "Статья приведена на английском оригинале. Перевод будет добавлен после проверки.", id: "Artikel ini ditampilkan dalam bahasa Inggris asli. Terjemahan ditambahkan setelah peninjauan.", vi: "Bài viết đang ở bản gốc tiếng Anh. Bản dịch sẽ được thêm sau khi rà soát.", it: "Questo articolo è nella versione originale inglese. La traduzione sarà aggiunta dopo la revisione.", "zh-Hans": "本文暂以英文原文展示，审核后补充翻译。", "zh-Hant": "本文暫以英文原文展示，審閱後補充翻譯。"
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
  // l10n: needs native review
  "ur": {
    "emptyBody": "مضامین عارضی طور پر دستیاب نہیں۔ بعد میں دوبارہ کوشش کریں۔",
    "emptyCategory": "اس زمرے میں ابھی کوئی مضمون نہیں",
    "emptyCategoryBody": "پلیٹ فارمز اور ٹریڈنگ لاگت دیکھنے کے لیے تمام مضامین دیکھیں۔",
    "loadingBody": "تازہ ترین ذریعہ تصدیق شدہ مواد لوڈ ہو رہا ہے۔",
    "researchIndex": "تحقیق اشاریہ",
    "researchIndexBody": "جائزہ شدہ آرکائیو کو مضمون کے حساب سے دیکھیں۔",
    "sourceBackedResearch": "ذرائع پر مبنی تحقیق"
  },
  // l10n: needs native review
  "uk": {
    "emptyBody": "Статті тимчасово недоступні. Спробуйте пізніше.",
    "emptyCategory": "У цій категорії ще немає статей",
    "emptyCategoryBody": "Перегляньте всі статті, щоб дослідити платформи й торгові витрати.",
    "loadingBody": "Завантажуємо найновіший матеріал із перевіреними джерелами.",
    "researchIndex": "Індекс досліджень",
    "researchIndexBody": "Переглядайте перевірений архів за статтями.",
    "sourceBackedResearch": "Дослідження на основі джерел"
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
  const fullLibraryRef = useRef(null);
  const loadStaticLibrary = async (full = false) => {
    if (!full) return loadNewsArticleSummaries(globalThis.fetch, { locale });
    if (!fullLibraryRef.current) fullLibraryRef.current = loadNewsArticleSummaries(globalThis.fetch, { full: true, locale });
    return fullLibraryRef.current;
  };
  const isZh = locale.startsWith("zh");
  const isHant = locale === "zh-Hant" || locale === "zh-TW";
  const t = copy[locale] || copy[String(locale || "").split("-")[0]] || (isHant ? copy["zh-Hant"] : isZh ? copy["zh-Hans"] : copy.en);
  // Heading, eyebrow and intro come from the shared module the worker also renders (SSR H1 === client H1).
  const hero = newsListHeroCopy(locale);
  const localizeCategory = (article) => {
    const own = article.categoryName && typeof article.categoryName === "object" ? article.categoryName[locale] : null;
    if (own) return own;
    const categoryName = localizedValue(article.categoryName, locale);
    if (article.category === "research" && categoryName === "Source-Backed Research") return newsCategoryCopy("research", locale)?.label || t.sourceBackedResearch;
    return newsCategoryCopy(article.category, locale)?.label || categoryName || article.category;
  };
  const localizeAuthor = (author) => author === "NexuAlpha Research Desk" ? (t.researchDesk || "NexuAlpha Research Desk") : author;
  const withContext = (href) => contextualHref(href, { locale, market, product });
  const dayCopy = newsDayCopy(locale);
  // Reader clock for "Today" / "Yesterday": set after mount only, so SSR and hydration render the same dates.
  const [nowMs, setNowMs] = useState(null);
  useEffect(() => { setNowMs(Date.now()); }, []);

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
      const articles = await loadStaticLibrary(Boolean(activeCategory || requestedPage > 1));
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
      const library = await loadStaticLibrary(true);
      if (!alive) return;
      const rows = searchNewsArticles(library, { query: trimmedQuery });
      setSearch({ status: "ready", query: trimmedQuery, rows, total: rows.length, page: 1, totalPages: 1 });
    }, NEWS_SEARCH_DEBOUNCE_MS);
    return () => { alive = false; clearTimeout(timer); };
  }, [trimmedQuery, locale, feedArticles]);

  const localPage = serverListing ? null : paginateNews(feedArticles, { category: activeCategory, page: requestedPage, locale });
  const pageRows = serverListing ? feedArticles : localPage.rows;
  const currentPage = serverListing ? serverListing.page : localPage.page;
  const totalPages = serverListing ? serverListing.totalPages : localPage.totalPages;
  const libraryTotal = serverListing?.libraryTotal || (serverListing ? 0 : feedArticles.length);
  const counts = serverListing?.counts || (!serverListing && feedArticles.length ? newsCategoryCounts(feedArticles) : null);
  const searching = Boolean(trimmedQuery);
  const articles = searching ? search.rows : pageRows;
  const visibleArticles = articles.slice(0, visibleArticleCount);
  // Lead story: the newest row of a listing's first page (not in search results); the rest are the day-grouped rows.
  const leadArticle = !searching && currentPage === 1 && visibleArticles.length > 1 ? visibleArticles[0] : null;
  const listRows = leadArticle ? visibleArticles.slice(1) : visibleArticles;
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
    <main className="v6 v2-page v3-page news-page" id="top" {...sectionEyebrowAttrs(locale, "news")} data-news-category={activeCategory || "all"} data-news-page={currentPage}>
      <section className="news-hero v2-shell">
        <div className="news-hero__badge">
          <span className="news-hero__pulse"></span>
          {hero.eyebrow}
        </div>
        <h1 className="news-hero__title">{categoryCopy ? categoryCopy.label : hero.title}</h1>
        <p className="news-hero__subtitle">{categoryCopy ? categoryCopy.intro : hero.subtitle}</p>
        <TelegramAlertsStrip locale={locale} placement="news-list-telegram-alerts" className="tg-signal-strip--news" />

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
        {leadArticle && (() => {
          const article = leadArticle;
          const title = localizedNewsTitle(article, locale);
          const summary = localizedNewsSummary(article, locale);
          const hasLocalizedContent = hasLocalizedNewsText(article, "title", locale) && hasLocalizedNewsText(article, "summary", locale);
          const articleUrl = withContext(newsArticleUrl(article.slug, locale, article));
          const compareSlugs = (article.relatedVenues || []).slice(0, 2);
          const compareUrl = compareSlugs.length === 2
            ? withContext(`/compare/${compareSlugs.join("-vs-")}`)
            : null;
          return (
            <article className="news-lead" aria-labelledby="news-lead-title" data-news-lead={article.slug}>
              <DataRule label={dayCopy.latest} stamp={utcStamp(article.publishedAt)} dateTime={article.publishedAt} />
              <p className="news-lead__meta">
                <span className={`news-row__cat news-row__cat--${article.category}`}>{localizeCategory(article)}</span>
              </p>
              <h2 className="news-lead__title" id="news-lead-title"><a href={articleUrl}>{title}</a></h2>
              <p className="news-lead__summary">{summary}</p>
              {!hasLocalizedContent && locale !== "en" && <p className="news-article-card__translation-note" role="note">{t.originalLanguageNotice || "Original-language source; translation pending review."}</p>}
              <div className="news-lead__foot">
                {article.relatedVenues && article.relatedVenues.length > 0 && (
                  <div className="news-article-card__venues">
                    <span className="news-article-card__venues-label">{t.partnerOffer}:</span>
                    {article.relatedVenues.map((slug) => {
                      const name = newsVenueName(slug);
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
                          <span translate="no" lang="en">{name || slug}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
                <div className="news-lead__actions">
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
                </div>
              </div>
            </article>
          );
        })()}
        <div className="news-grid news-days" id="news-article-grid" data-visible-count={visibleArticles.length}>
          {groupNewsByDay(listRows).map((group) => {
            const relative = relativeDay(group.day, nowMs);
            const headingId = `news-day-${group.day}`;
            return (
              <section className="news-day" key={group.day} aria-labelledby={headingId} data-news-day={group.day}>
                <DataRule as="h2" label={relative ? dayCopy[relative] : <bdi dir="ltr">{group.day}</bdi>} labelId={headingId} stamp={relative ? <><bdi dir="ltr">{group.day}</bdi> · {dayCopy.stories(group.rows.length)}</> : dayCopy.stories(group.rows.length)} />
                <ol className="news-day__list">
                  {group.rows.map((article) => {
                    const title = localizedNewsTitle(article, locale);
                    const summary = localizedNewsSummary(article, locale);
                    const hasLocalizedContent = hasLocalizedNewsText(article, "title", locale) && hasLocalizedNewsText(article, "summary", locale);
                    const articleUrl = withContext(newsArticleUrl(article.slug, locale, article));
                    return (
                      <li key={article.slug} className="news-row" data-news-row={article.slug}>
                        <time className="news-row__time" dateTime={article.publishedAt}>{formatSgt(article.publishedAt, locale, "clock") || utcClock(article.publishedAt)}</time>
                        <div className="news-row__main">
                          <h3 className="news-row__title"><a href={articleUrl} data-cta-kind="research" data-cta-placement="news-row-read" data-growth-decision={article.slug || article.id} data-growth-placement="news-row-read">{title}</a></h3>
                          <p className="news-row__summary">{summary}</p>
                          {!hasLocalizedContent && locale !== "en" && <p className="news-row__note">{t.originalLanguageNotice || "Original-language source; translation pending review."}</p>}
                        </div>
                        <span className={`news-row__cat news-row__cat--${article.category}`}>{localizeCategory(article)}</span>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
        {hasMoreArticles && (
          <button
            type="button"
            className="news-articles-toggle"
            aria-controls="news-article-grid"
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

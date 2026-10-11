import { localizedValue } from './news-feed-client.js';
const normalize = value => String(value || '').normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase().replace(/ı/g, 'i').trim();
// The feed tags almost every article as "research", so the Fee Rates / Compliance tabs
// derive a single primary topic from the English title. An explicit non-research
// category in the data always wins. Order matters: fee topics first, then regulation.
const FEE_TOPIC = /\bfees?\b|funding[- ]rates?|rebates?|commissions?|\bmaker\b|\btaker\b|trading[- ]costs?|\bcosts?\b|\bspreads?\b|vip[- ]tiers?/i;
const COMPLIANCE_TOPIC = /\b(sec|cftc|fatf|fsb|bis|esma|fca|iosco|occ|finra|fincen|ofac)\b|mica|regulat|complian|\bkyc\b|\baml\b|travel[- ]rule|licen[cs]|\btax|sanction|polic(?:y|ies)|jurisdiction|regional[- ]availability|\blegal|\blaws?\b|supervis/i;
const englishTitle = title => typeof title === 'string' ? title : (title && (title.en || Object.values(title)[0])) || '';
export function newsTopicOf(article = {}) {
  if (article.category && article.category !== 'research') return article.category;
  const text = englishTitle(article.title) || String(article.slug || '').replace(/-/g, ' ');
  if (FEE_TOPIC.test(text)) return 'rates';
  if (COMPLIANCE_TOPIC.test(text)) return 'compliance';
  return 'research';
}
export function filterNewsIndex(articles, {query = '', category = 'all', locale = 'en'} = {}) {
  const terms = normalize(query).split(/\s+/u).filter(Boolean);
  return articles.filter(article => {
    if (category !== 'all' && newsTopicOf(article) !== category) return false;
    const fields = [typeof article.title === 'string' ? article.title : localizedValue(article.title, locale), typeof article.summary === 'string' ? article.summary : localizedValue(article.summary, locale), ...(article.relatedVenues || [])];
    const text = normalize(fields.join(' '));
    return terms.every(term => text.includes(term));
  });
}
const copy = {
 en:['Search articles','Topic or platform','Search applies to articles loaded on this page.','Clear search','No loaded articles match these conditions.','Reset search and category','Results: {n}'],
 'zh-Hans':['搜索文章','主题或平台','仅检索本页已加载的文章。','清除搜索','已加载文章中没有符合这些条件的结果。','重置搜索与分类','结果：{n}'],
 'zh-Hant':['搜尋文章','主題或平台','僅搜尋本頁已載入的文章。','清除搜尋','已載入文章中沒有符合這些條件的結果。','重設搜尋與分類','結果：{n}'],
 ja:['記事を検索','テーマまたはプラットフォーム','このページに読み込まれた記事のみを検索します。','検索をクリア','条件に一致する読み込み済み記事はありません。','検索とカテゴリをリセット','検索結果：{n}'],
 ko:['기사 검색','주제 또는 플랫폼','이 페이지에 불러온 기사만 검색합니다.','검색 지우기','조건에 맞는 불러온 기사가 없습니다.','검색과 분류 초기화','결과: {n}'],
 tr:['Makalelerde ara','Konu veya platform','Yalnızca bu sayfada yüklenen makaleler aranır.','Aramayı temizle','Yüklenen makaleler arasında eşleşme yok.','Aramayı ve kategoriyi sıfırla','Sonuçlar: {n}'],
  // l10n: needs native review
  ur: ["مضامین تلاش کریں", "موضوع یا پلیٹ فارم", "تلاش صرف اس صفحے پر لوڈ کیے گئے مضامین میں ہوتی ہے۔", "تلاش صاف کریں", "لوڈ کیے گئے مضامین میں ان شرائط کے مطابق کوئی نتیجہ نہیں۔", "تلاش اور زمرہ دوبارہ ترتیب دیں", "نتائج: {n}"],
  // l10n: needs native review
  uk: ["Пошук статей", "Тема або платформа", "Пошук лише серед статей, завантажених на цій сторінці.", "Очистити пошук", "Серед завантажених статей немає відповідних результатів.", "Скинути пошук і категорію", "Результати: {n}"],
 ar:['البحث في المقالات','موضوع أو منصة','يقتصر البحث على المقالات المحمّلة في هذه الصفحة.','مسح البحث','لا توجد مقالات محمّلة تطابق هذه الشروط.','إعادة ضبط البحث والفئة','النتائج: {n}'],
 es:['Buscar artículos','Tema o plataforma','La búsqueda se limita a los artículos cargados en esta página.','Borrar búsqueda','Ningún artículo cargado coincide con estas condiciones.','Restablecer búsqueda y categoría','Resultados: {n}'],
 'pt-BR':['Pesquisar artigos','Tema ou plataforma','A pesquisa abrange apenas os artigos carregados nesta página.','Limpar pesquisa','Nenhum artigo carregado corresponde a estas condições.','Redefinir pesquisa e categoria','Resultados: {n}'],
 fr:['Rechercher des articles','Sujet ou plateforme','La recherche porte uniquement sur les articles chargés sur cette page.','Effacer la recherche','Aucun article chargé ne correspond à ces critères.','Réinitialiser la recherche et la catégorie','Résultats : {n}'],
 de:['Artikel durchsuchen','Thema oder Plattform','Die Suche umfasst nur die auf dieser Seite geladenen Artikel.','Suche löschen','Keine geladenen Artikel entsprechen diesen Bedingungen.','Suche und Kategorie zurücksetzen','Ergebnisse: {n}'],
 ru:['Поиск статей','Тема или платформа','Поиск только по статьям, загруженным на этой странице.','Очистить поиск','Нет загруженных статей, соответствующих условиям.','Сбросить поиск и категорию','Результаты: {n}'],
 id:['Cari artikel','Topik atau platform','Pencarian hanya mencakup artikel yang dimuat di halaman ini.','Hapus pencarian','Tidak ada artikel yang dimuat yang sesuai dengan kondisi ini.','Reset pencarian dan kategori','Hasil: {n}'],
 vi:['Tìm bài viết','Chủ đề hoặc nền tảng','Chỉ tìm trong các bài viết đã tải trên trang này.','Xóa tìm kiếm','Không có bài viết đã tải nào khớp điều kiện.','Đặt lại tìm kiếm và danh mục','Kết quả: {n}'],
 it:['Cerca articoli','Tema o piattaforma','La ricerca riguarda solo gli articoli caricati in questa pagina.','Cancella ricerca','Nessun articolo caricato corrisponde a queste condizioni.','Reimposta ricerca e categoria','Risultati: {n}']
};
export function newsIndexSearchCopy(locale='en') {
 const row=copy[locale] || copy[String(locale).split('-')[0]] || copy.en;
 const [label,placeholder,scope,clear,empty,reset,result]=row;
 return {label,placeholder,scope,clear,empty,reset,results:n=>result.replace('{n}',String(n))};
}

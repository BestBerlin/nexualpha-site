// Keep this module independent of the activity index's full feed and campaign graph.
const copy = {
  en: ['View all', 'Quick answers', 'Facts and licences', 'News and tools', 'Questions and answers', 'Popular coins', 'Listing', 'Campaign', 'Delisting', 'Announcement', 'will list'],
  'zh-Hans': ['查看全部', '快速解答', '基本信息与牌照', '新闻与工具', '常见问题', '热门币种', '上币', '活动', '下架', '公告', '将上线'],
  'zh-Hant': ['查看全部', '快速解答', '基本資訊與牌照', '新聞與工具', '常見問題', '熱門幣種', '上幣', '活動', '下架', '公告', '將上線'],
  ja: ['すべて見る', '要点を確認', '基本情報とライセンス', 'ニュースとツール', 'よくある質問', '人気の銘柄', '上場', 'キャンペーン', '上場廃止', 'お知らせ', '上場予定：'],
  ko: ['전체 보기', '핵심 질문', '기본 정보 및 라이선스', '뉴스 및 도구', '자주 묻는 질문', '인기 코인', '상장', '이벤트', '상장 폐지', '공지', '상장 예정:'],
  es: ['Ver todo', 'Respuestas rápidas', 'Datos y licencias', 'Noticias y herramientas', 'Preguntas frecuentes', 'Monedas populares', 'Listado', 'Campaña', 'Retirada', 'Anuncio', 'listará'],
  'pt-BR': ['Ver tudo', 'Respostas rápidas', 'Dados e licenças', 'Notícias e ferramentas', 'Perguntas frequentes', 'Moedas populares', 'Listagem', 'Campanha', 'Remoção', 'Anúncio', 'vai listar'],
  fr: ['Tout voir', 'Réponses rapides', 'Informations et agréments', 'Actualités et outils', 'Questions fréquentes', 'Cryptos populaires', 'Cotation', 'Campagne', 'Retrait', 'Annonce', 'listera'],
  de: ['Alle ansehen', 'Kurze Antworten', 'Daten und Zulassungen', 'Nachrichten und Tools', 'Häufige Fragen', 'Beliebte Coins', 'Listing', 'Aktion', 'Delisting', 'Mitteilung', 'listet'],
  tr: ['Tümünü gör', 'Kısa yanıtlar', 'Bilgiler ve lisanslar', 'Haberler ve araçlar', 'Sık sorulan sorular', 'Popüler coinler', 'Listeleme', 'Kampanya', 'Listeden çıkarma', 'Duyuru', 'listeleyecek'],
  vi: ['Xem tất cả', 'Giải đáp nhanh', 'Thông tin và giấy phép', 'Tin tức và công cụ', 'Câu hỏi thường gặp', 'Coin phổ biến', 'Niêm yết', 'Sự kiện', 'Hủy niêm yết', 'Thông báo', 'sẽ niêm yết'],
  id: ['Lihat semua', 'Jawaban singkat', 'Informasi dan lisensi', 'Berita dan alat', 'Pertanyaan umum', 'Koin populer', 'Listing', 'Kampanye', 'Delisting', 'Pengumuman', 'akan melisting'],
  ru: ['Смотреть все', 'Краткие ответы', 'Данные и лицензии', 'Новости и инструменты', 'Частые вопросы', 'Популярные монеты', 'Листинг', 'Акция', 'Делистинг', 'Объявление', 'добавит в листинг'],
  ar: ['عرض الكل', 'إجابات سريعة', 'المعلومات والتراخيص', 'الأخبار والأدوات', 'الأسئلة الشائعة', 'العملات الشائعة', 'إدراج', 'حملة', 'إلغاء الإدراج', 'إعلان', 'ستدرج'],
  it: ['Vedi tutto', 'Risposte rapide', 'Dati e licenze', 'Notizie e strumenti', 'Domande frequenti', 'Monete popolari', 'Quotazione', 'Campagna', 'Rimozione', 'Annuncio', 'quoterà'],
  ur: ['سب دیکھیں', 'مختصر جوابات', 'معلومات اور لائسنس', 'خبریں اور ٹولز', 'عام سوالات', 'مقبول کوائنز', 'لسٹنگ', 'مہم', 'ڈی لسٹنگ', 'اعلان', 'لسٹ کرے گا'],
  uk: ['Переглянути все', 'Короткі відповіді', 'Відомості та ліцензії', 'Новини й інструменти', 'Поширені запитання', 'Популярні монети', 'Лістинг', 'Акція', 'Делістинг', 'Оголошення', 'додасть до лістингу'],
};
export function venueSlimmingCopy(locale) {
  const c = copy[locale] || copy.en;
  return { all: c[0], quick: c[1], facts: c[2], news: c[3], questions: c[4], coins: c[5] };
}
function announcementTitle(item, locale) {
  const c = copy[locale] || copy.en;
  const local = item.brief?.headline?.[locale] || item.headlines?.[locale] || (typeof item.title === 'object' ? item.title?.[locale] : null);
  if (typeof local === 'string' && local.trim()) return local;
  const title = typeof item.title === 'string' ? item.title : item.title?.en || '';
  if (locale === 'en') return title;
  // Symbols and product brands are source identifiers, not translated prose.
  // Extract only those identifiers instead of leaking English headline suffixes.
  const ignored = new Set(['OKX', 'APR', 'APY', 'VIP', 'UTC', 'AM', 'PM', 'USD', 'NEW', 'THE', 'AND', 'FOR', 'WILL', 'LIST']);
  const symbols = [...new Set(title.match(/\b[A-Z][A-Z0-9]{1,14}\b/g) || [])].filter(value => !ignored.has(value));
  const product = title.match(/\b(?:Binance Alpha|ByPick|TradFi|X-Perps?|Pre-IPO)\b/)?.[0];
  const subject = [product, ...symbols.slice(0, 6)].filter(Boolean).join(' · ');
  const listing = title.match(/^(Binance|OKX|Bitget|Bybit|KuCoin|Kraken) Will List /i);
  if (listing && subject) return `${listing[1]} ${c[10]} ${subject}`;
  const category = item.category || item.kind;
  const index = ({listing: 6, LISTING: 6, event: 7, campaign: 7, PLATFORM_ACTIVITY: 7, delisting: 8})[category] ?? 9;
  const publishedAt = String(item.publishedAt || item.discoveredAt || '');
  const date = publishedAt.slice(0, 10);
  const stamp = /^\d{4}-\d{2}-\d{2}$/.test(date) ? (subject ? date : publishedAt.replace('T', ' ').replace(/\.\d+Z$/, ' UTC')) : '';
  return [item.platform?.name || item.venue || '', c[index], subject, stamp].filter(Boolean).join(' · ');
}
export function venueAnnouncementPreview(items, locale) {
  return items.slice(0, 5).map(item => ({ ...item, previewTitle: announcementTitle(item, locale) }));
}

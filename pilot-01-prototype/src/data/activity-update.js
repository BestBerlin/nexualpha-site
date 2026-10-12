import { campaignBrief, localizedBriefText } from './campaign-briefs.js';
import { readIntelFeed } from './announcement-intel.js';
import { localizedHref } from './locale-routing.js';
import { OFFICIAL_EXCHANGE_ACTIVITIES } from './generated-official-activities.js';
import { OWNER_CAMPAIGNS } from './owner-campaigns.js';
import { updatePath } from './activity-update-path.js';

export { updatePath };
// Stable across headline corrections and locales; feed IDs may themselves be URLs.
function identity(item) {
  return String(item.id || item.url || item.officialSource?.url || '');
}
export function updateHref(item, locale = 'en', { market, product } = {}) { return localizedHref(updatePath(item), { locale, market, product }); }
export function normalizeUpdateItem(item) {
  if (!item || typeof item !== 'object') return {};
  return { ...item, id: identity(item), venue: item.venue || item.platform?.slug,
    title: item.title && typeof item.title === 'object' ? item.title.en : item.title,
    ...(typeof item.title === 'object' && item.title ? { headlines: item.title } : {}),
    category: item.category || ({ LISTING: 'listing', PLATFORM_ACTIVITY: 'event', PRODUCT_UPDATE: 'product', ASSET_UPDATE: 'news', listing: 'listing' })[item.kind] || 'event',
    url: item.url || item.officialSource?.url,
    publishedAt: item.publishedAt || item.discoveredAt || item.checkedAt || item.startAt };
}
export function updateItems(feed) {
  const candidates = [...(Array.isArray(feed?.items) ? feed.items : []), ...OFFICIAL_EXCHANGE_ACTIVITIES, ...OWNER_CAMPAIGNS].map(normalizeUpdateItem);
  return [...new Map(readIntelFeed({ items: candidates }).map(item => [updatePath(item), item])).values()].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).map(item => ({ ...item, brief: campaignBrief(item, feed) }));
}
export function findUpdate(feed, venue, slug) {
  return updateItems(feed).find(item => updatePath(item) === `/activities/updates/${venue}/${slug}`) || null;
}
const categories = {
  en: ['Listing', 'Campaign', 'Delisting', 'Announcement'], 'zh-Hans': ['上币', '活动', '下架', '公告'], 'zh-Hant': ['上幣', '活動', '下架', '公告'],
  es: ['Listado', 'Campaña', 'Retirada', 'Anuncio'], 'pt-BR': ['Listagem', 'Campanha', 'Remoção', 'Anúncio'], fr: ['Cotation', 'Campagne', 'Retrait', 'Annonce'], de: ['Listing', 'Aktion', 'Delisting', 'Mitteilung'], it: ['Quotazione', 'Campagna', 'Rimozione', 'Annuncio'], ja: ['上場', 'キャンペーン', '上場廃止', 'お知らせ'], ko: ['상장', '이벤트', '상장 폐지', '공지'], vi: ['Niêm yết', 'Sự kiện', 'Hủy niêm yết', 'Thông báo'], id: ['Listing', 'Kampanye', 'Delisting', 'Pengumuman'], tr: ['Listeleme', 'Kampanya', 'Listeden çıkarma', 'Duyuru'], ru: ['Листинг', 'Акция', 'Делистинг', 'Объявление'], ar: ['إدراج', 'حملة', 'إلغاء الإدراج', 'إعلان'], ur: ['لسٹنگ', 'مہم', 'ڈی لسٹنگ', 'اعلان'], uk: ['Лістинг', 'Акція', 'Делістинг', 'Оголошення'],
};
export function updateCategory(item, locale = 'en') { return (categories[locale] || categories.en)[({ listing: 0, event: 1, campaign: 1, delisting: 2 })[item.category] ?? 3]; }
const listVerbs = { 'zh-Hans': '将上线', 'zh-Hant': '將上線', es: 'listará', 'pt-BR': 'vai listar', vi: 'sẽ niêm yết', id: 'akan melisting', tr: 'listeleyecek', ru: 'добавит в листинг', ar: 'ستدرج', fr: 'listera', de: 'listet', it: 'quoterà', ja: 'が上場予定：', ko: '상장 예정:', ur: 'لسٹ کرے گا', uk: 'додасть до лістингу' };
export function updateHeadline(item, locale = 'en') {
  const headline = localizedBriefText(item.brief?.headline, locale);
  if (headline) return headline;
  const candidate = item.headlines?.[locale] || (item.title && typeof item.title === 'object' ? item.title[locale] || item.title.en : item.title);
  const title = typeof candidate === 'string' ? candidate : typeof item.title === 'string' ? item.title : '';
  const match = title.match(/^(Binance|OKX|Bitget|Bybit|KuCoin|Kraken) Will List (.+)$/i);
  if (!match || !listVerbs[locale]) return title;
  const venue = locale === 'zh-Hans' && /^binance$/i.test(match[1]) ? '币安' : locale === 'zh-Hant' && /^binance$/i.test(match[1]) ? '幣安' : match[1];
  return `${venue}${locale.startsWith('zh') ? '' : ' '}${listVerbs[locale]} ${match[2]}`;
}
export const isUpdateNoindex = item => item.category === 'delisting' || /maintenance|suspension|suspend|维护|維護/i.test(item.title);

// News-route-only entity links: informational paths, never registration redirects.
import { tsArticleLinks } from './tokenized-stocks-news.js';
import { venueDatabase } from './venue-database.js';
import { COIN_ROWS } from './coins-data.generated.js';
import { articleClusterLinks, clusterLabel } from './topic-clusters.js';
import { CURATED_COMPARISON_SLUGS } from './compare-slug.js';
import { hasNewsArticleLocale } from './news-feed-client.js';
import { compareNewestFirst, newsReadingNeighbors } from './news-library.js';
import { fundingMatrixCopy } from './funding-matrix-copy.js';
import { DATA_PAGE_NAV } from './market-data-pages-nav.js';
import { localizedHref } from './locale-routing.js';
import { isPartnerPromotableIn } from './partner-geo-policy.js';
import { isNeutralCtaLocale } from './locale-policy.js';
import { parseConverterPath } from './converter-routes.js';

const PRIORITY_PROFILE_FALLBACK = ['bitget', 'okx', 'binance'];
const COIN_ENTITIES = COIN_ROWS.map(([, slug, name, symbol]) => [slug, name, symbol]);
// Match converter.js's fixed release universe without importing its page copy into news.
const CONVERTER_SYMBOLS = new Set(COIN_ROWS.slice().sort((a, b) => a[4] - b[4]).slice(0, 30).map(row => row[3].toLowerCase()));
const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = new Map();
const mentions = (text, name, sensitive = false) => {
  const key = `${sensitive}:${name}`;
  if (!patterns.has(key)) patterns.set(key, new RegExp(`(?<![\\p{L}\\p{N}])${escape(name)}(?![\\p{L}\\p{N}])`, sensitive ? 'u' : 'iu'));
  return patterns.get(key).test(text);
};
const entities = new WeakMap();
const values = (value) => typeof value === 'string' ? value : (value?.en || value?.['zh-Hans'] || '');
export function articleEntities(article) {
  if (article && entities.has(article)) return entities.get(article);
  const text = [values(article?.title), values(article?.summary), values(article?.content), article?.seo?.primaryKeyword].join('\n');
  const venues = Object.values(venueDatabase).filter(v => (article?.relatedVenues || []).includes(v.slug) || mentions(text, v.name)).map(v => v.slug);
  const coins = COIN_ENTITIES.filter(([, name, symbol]) => mentions(text, name, true) || (symbol.length >= 3 && mentions(text, symbol, true)));
  const result = { text, venues, coins };
  if (article) entities.set(article, result);
  return result;
}

const UTILITY_LABELS = {
  en: ['Converter', 'Calendar', 'Licenses'], 'zh-Hans': ['兑换工具', '日历', '牌照'], 'zh-Hant': ['兌換工具', '日曆', '牌照'], es: ['Conversor', 'Calendario', 'Licencias'], 'pt-BR': ['Conversor', 'Calendário', 'Licenças'], fr: ['Convertisseur', 'Calendrier', 'Licences'], de: ['Umrechner', 'Kalender', 'Lizenzen'], it: ['Convertitore', 'Calendario', 'Licenze'], ja: ['換算ツール', 'カレンダー', 'ライセンス'], ko: ['환산 도구', '캘린더', '라이선스'], tr: ['Dönüştürücü', 'Takvim', 'Lisanslar'], ru: ['Конвертер', 'Календарь', 'Лицензии'], id: ['Konverter', 'Kalender', 'Lisensi'], vi: ['Quy đổi', 'Lịch', 'Giấy phép'], ar: ['المحوّل', 'التقويم', 'التراخيص'], ur: ['کنورٹر', 'کیلنڈر', 'لائسنس'], uk: ['Конвертер', 'Календар', 'Ліцензії'],
};

export function articleRelatedLinks(article, locale, { profileSuffix = '', comparePrefix = 'Compare' } = {}) {
  const { text, venues, coins } = articleEntities(article);
  const labels = UTILITY_LABELS[locale] || UTILITY_LABELS.en;
  const links = [];
  const add = (path, label) => { const href = localizedHref(path, { locale }); if (!links.some(l => l.href === href)) links.push({ href, label }); };
  const profileLabel = (slug) => profileSuffix ? `${venueDatabase[slug].name} ${profileSuffix}`.trim() : clusterLabel({ kind: 'venue', name: venueDatabase[slug].name }, locale);
  // Reserve room for each relevant entity family rather than letting several venues crowd out a coin or tool.
  const pair = CURATED_COMPARISON_SLUGS.map(slug => slug.split('-vs-')).find(([a, b]) => venues.includes(a) && venues.includes(b));
  if (venues[0]) add(`/exchanges/${venues[0]}`, profileLabel(venues[0]));
  // Neutral editions use the informational directory when no venue is named. Reserve it
  // before optional tools so every article retains an exchange decision destination.
  else if (isNeutralCtaLocale(locale)) add('/exchanges', ({ ru: 'Биржи', ar: 'المنصات', 'zh-Hant': '交易平台', ur: 'ایکسچینجز', uk: 'Біржі', vi: 'Sàn giao dịch' })[locale] || 'Exchanges');
  // SEO/GEO pass 2026-10-15: 28% of sampled articles (mostly tokenization and regulation) linked no exchange profile,
  // so the news -> exchange profile -> official sign-up path stopped at the article. Venue-free articles now link the
  // first priority partner allowed in this edition (owner order Bitget > OKX > Binance; Türkiye skips Bitget).
  // Neutral editions keep their informational directory destination.
  if (!venues.length && !isNeutralCtaLocale(locale)) {
    const slug = PRIORITY_PROFILE_FALLBACK.find((candidate) => venueDatabase[candidate] && isPartnerPromotableIn(candidate, { locale }));
    if (slug) add(`/exchanges/${slug}`, profileLabel(slug));
  }
  if (pair) add(`/compare/${pair.join('-vs-')}`, `${comparePrefix} ${pair.map(s => venueDatabase[s].name).join(' vs ')}`);
  if (coins[0]) add(`/coins/${coins[0][0]}`, `${coins[0][1]} (${coins[0][2]})`);
  // Reserve an equity backlink before optional tools and extra venue links.
  for (const link of tsArticleLinks(article, locale).filter(link => link.kind === 'ticker')) if (links.length < 5) add(link.path, link.label);
  // Comparison alternatives already appear in the topic line. Keep this smaller
  // entity panel for the pair actually discussed, coins and useful tools.
  for (const link of articleClusterLinks(article, locale).filter(link => link.kind !== 'compare')) if (links.length < 5 && !links.some(l => l.href === link.href)) links.push({ href: link.href, label: link.label });
  const candidateConverter = `/convert/${(coins[0]?.[2] || 'BTC').toLowerCase()}-to-usd`;
  const converterRoute = parseConverterPath(candidateConverter);
  const converterPath = converterRoute?.kind === 'pair' && CONVERTER_SYMBOLS.has(converterRoute.symbol) ? candidateConverter : '/convert/btc-to-usd';
  const tools = [
    [/funding|perpetual|资金费率|資金費率/i, '/funding-rates/matrix', fundingMatrixCopy(locale).internalLinkLabel],
    [/liquidat|爆仓|清算/i, '/liquidations/heatmap', (DATA_PAGE_NAV[locale] || DATA_PAGE_NAV.en).liquidations],
    [/convert|兑换|兌換/i, converterPath, labels[0]],
    [/calendar|macro|fomc|日历|日曆/i, '/calendar', labels[1]],
    [/licen[sc]|regulat|许可|監管|监管/i, '/licenses', labels[2]],
  ];
  // Specific tools precede extra exchanges; labels remain informational.
  for (const [pattern, path, label] of tools) if (pattern.test(text) && links.length < 5) add(path, label);
  for (const slug of venues.slice(1)) if (links.length < 5) add(`/exchanges/${slug}`, profileLabel(slug));
  for (const coin of coins.slice(1)) if (links.length < 5) add(`/coins/${coin[0]}`, `${coin[1]} (${coin[2]})`);
  // General informational hubs keep even entity-free articles connected.
  for (const path of ['/news', '/exchanges', '/coins']) if (links.length < 3) add(path, path.slice(1));
  return links.slice(0, 5);
}

export function recentEntityArticles(article, articles, limit = 5, locale = 'en') {
  const own = articleEntities(article);
  const tags = article.topicTags || article.tags || [];
  const candidates = (articles || []).filter(candidate => candidate?.slug && candidate.slug !== article.slug
    && (!candidate.status || candidate.status === 'PUBLISHED') && candidate.seo?.noindex === false
    && Number.isFinite(Date.parse(candidate.publishedAt)) && hasNewsArticleLocale(candidate, locale)).sort(compareNewestFirst);
  const related = candidates.filter(candidate => {
    const other = articleEntities(candidate);
    return own.venues.some(v => other.venues.includes(v)) || own.coins.some(([slug]) => other.coins.some(([s]) => s === slug))
      || tags.some(tag => (candidate.topicTags || candidate.tags || []).includes(tag))
      || (article.category && article.category === candidate.category);
  });
  // Always expose the latest two editions; fill the remaining slots by relevance, then recency.
  return [...new Map([...candidates.slice(0, 2), ...related, ...candidates].map(item => [item.slug, item])).values()].slice(0, limit);
}

/** Older articles from the first declared venue, with a real edition in the requested locale. */
export function primaryVenueResearch(article, articles, locale = 'en') {
  const venue = article?.relatedVenues?.find(slug => venueDatabase[slug]);
  const before = Date.parse(article?.publishedAt);
  if (!venue || !Number.isFinite(before)) return [];
  const seen = new Set();
  return (articles || []).filter(candidate => candidate?.slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate.slug) && candidate.slug !== article.slug
    && !seen.has(candidate.slug) && seen.add(candidate.slug)
    && (!candidate.status || candidate.status === 'PUBLISHED') && candidate.seo?.noindex === false
    && candidate.relatedVenues?.includes(venue) && hasNewsArticleLocale(candidate, locale)
    && Date.parse(candidate.publishedAt) < before).sort(compareNewestFirst).slice(0, 4);
}

// Carry just the selected cards and archive neighbors into hydration. Selection remains identical
// when the client receives this smaller pool, rather than the entire library.
export function articleRelatedPool(article, articles, locale = 'en') {
  const seen = new Set();
  return [article, ...recentEntityArticles(article, articles, 5, locale), ...primaryVenueResearch(article, articles, locale), ...newsReadingNeighbors(article, articles)]
    .filter(item => item?.slug && !seen.has(item.slug) && seen.add(item.slug));
}

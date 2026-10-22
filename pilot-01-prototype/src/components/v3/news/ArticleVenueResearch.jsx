import React from 'react';
import { primaryVenueResearch } from '../../../data/article-related-links.js';
import { localizedHref } from '../../../data/locale-routing.js';
import { localizedNewsTitle, newsArticleUrl } from '../../../data/news-feed-client.js';
import { venueDatabase } from '../../../data/venue-database.js';

const headings = {
  en: 'More from', 'zh-Hans': '更多研究：', 'zh-Hant': '更多研究：', es: 'Más sobre', 'pt-BR': 'Mais sobre',
  fr: 'Autres recherches sur', de: 'Mehr über', it: 'Altre ricerche su', ja: '関連する調査：', ko: '더 많은 리서치:',
  ru: 'Другие исследования:', tr: 'Daha fazla araştırma:', id: 'Riset lainnya tentang', vi: 'Nghiên cứu thêm về',
  ar: 'المزيد عن', ur: 'مزید تحقیق:', uk: 'Більше досліджень про',
};

export function ArticleVenueResearch({ article, articles, locale = 'en' }) {
  const venue = article?.relatedVenues?.find(slug => venueDatabase[slug]);
  if (!venue) return null;
  const older = primaryVenueResearch(article, articles, locale);
  return <section className="news-detail__venue-research" data-news-venue-research="" lang={locale}>
    <h2>{headings[locale] || headings.en} {venueDatabase[venue].name}</h2>
    <p><a href={localizedHref(`/exchanges/${venue}`, { locale })}>{venueDatabase[venue].name}</a></p>
    {older.length > 0 && <ol>{older.map(item => <li key={item.slug}>
      <a href={newsArticleUrl(item.slug, locale, item)} data-cta-kind="research" data-cta-placement="news-detail-venue-research">{localizedNewsTitle(item, locale)}</a>
    </li>)}</ol>}
  </section>;
}

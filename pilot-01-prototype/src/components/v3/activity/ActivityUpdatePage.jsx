import { useCampaignBriefs } from '../../shared/useCampaignBriefs.js';
import { CampaignBriefFacts } from '../../shared/CampaignBriefFacts.jsx';
import { localizedBriefText } from '../../../data/campaign-briefs.js';
import React, { useEffect, useState } from 'react';
import { BrandMark } from '../../brand/BrandMark.jsx';
import { SectionRule } from '../../shared/DataRule.jsx';
import { CampaignJoin } from './CampaignJoin.jsx';
import { updateCopy } from './update-copy.js';
import { findUpdate, normalizeUpdateItem, updateCategory, updateHeadline, updateItems, updateHref, updatePath } from '../../../data/activity-update.js';
import { ARCHIVE_PATH, archiveItems } from '../../../data/announcement-archive.js';
import { localizedHref } from '../../../data/locale-routing.js';
import { publicCtaForVenue, regionalVenueCta } from '../../../data/source-bound-cta.js';
import { isPartnerPromotableIn } from '../../../data/partner-geo-policy.js';
import { campaignVisibleInLocale } from '../../../data/campaign-locale-policy.js';
import { formatSgt } from '../../../data/local-time.js';
import './activity-update.css';
import { isNeutralCtaLocale } from '../../../data/locale-policy.js';

// Market gating is a compliance control (blocked countries must not see partner codes), so links between update pages keep
// ?market= as a real query the server can read; those URLs canonicalise to the bare path, so crawl authority is unaffected.
const withMarket = (href, market) => {
  if (!market) return href;
  const [base, hash = ''] = String(href).split('#');
  const clean = base.replace(/([?&])market=[^&]*&?/, '$1').replace(/[?&]$/, '');
  return `${clean}${clean.includes('?') ? '&' : '?'}market=${encodeURIComponent(market)}${hash ? `#${hash}` : ''}`;
};

export function ActivityUpdatePage({ venue, slug, locale = 'en', market, initialFeed }) {
  const [feed, setFeed] = useState(initialFeed);
  useEffect(() => {
    if (initialFeed) { setFeed(initialFeed); return; }
    const controller = new AbortController();
    fetch('/intel/official-announcements.json', { signal: controller.signal }).then(r => r.ok ? r.json() : null).then(data => { if (data) setFeed(data); }).catch(() => {});
    return () => controller.abort();
  }, [initialFeed]);
  // An update that left the live feed is served from the archive as an ended update (SSR puts it in the feed with
  // archived: true; a client-side navigation looks it up here). Never a "not found" for a page we once published.
  const [archivedItem, setArchivedItem] = useState(null);
  useEffect(() => {
    if (!feed || findUpdate(feed, venue, slug)) return undefined;
    const controller = new AbortController();
    const pathname = `/activities/updates/${venue}/${slug}`;
    fetch(ARCHIVE_PATH, { signal: controller.signal }).then(r => r.ok ? r.json() : null).then(data => {
      const row = archiveItems(data).map(normalizeUpdateItem).find(entry => updatePath(entry) === pathname);
      if (row) setArchivedItem({ ...row, archived: true });
    }).catch(() => {});
    return () => controller.abort();
  }, [feed, venue, slug]);
  const briefFeed = useCampaignBriefs(feed);
  const item = findUpdate(briefFeed, venue, slug) || archivedItem;
  const t = updateCopy(locale);
  if (!item) return <main className="update-page"><h1>{t.missing}</h1><a href={withMarket(localizedHref('/activities', { locale }), market)}>{updateCategory({ category: 'event' }, locale)}</a></main>;
  if (!campaignVisibleInLocale(item, locale)) return <main className="update-page"><h1>{t.missing}</h1><a href={withMarket(localizedHref('/activities', { locale }), market)}>{updateCategory({ category: 'event' }, locale)}</a></main>;
  const cta = publicCtaForVenue(venue, locale, market);
  const regional = regionalVenueCta(venue, locale, market);
  const neutral = isNeutralCtaLocale(locale);
  const promotable = !neutral && regional.ctaState !== 'blocked' && isPartnerPromotableIn(venue, { locale, market });
  const officialEntry = cta.officialDomain ? `https://${cta.officialDomain}` : null;
  const related = updateItems(briefFeed).filter(row => row.venue === venue && row.id !== item.id && !row.archived && campaignVisibleInLocale(row, locale)).slice(0, 5);
  return <main className="update-page" id="top" dir={/^(ar|ur)$/.test(locale) ? 'rtl' : undefined}>
    <article>
      <header className="update-page__header">
        <a href={withMarket(localizedHref('/activities', { locale }), market)}>{updateCategory({ category: 'event' }, locale)} ←</a>
        <div className="update-page__meta"><BrandMark slug={venue} compact /><b>{cta.name || venue}</b><span>{updateCategory(item, locale)}</span>{item.archived ? <span className="update-page__ended">{t.ended}</span> : null}<time dateTime={item.publishedAt}><bdi>{formatSgt(item.publishedAt, locale, 'date')}</bdi></time></div>
        <h1 dir="auto">{updateHeadline(item, locale)}</h1>
        <CampaignBriefFacts brief={item.brief} locale={locale} />
      </header>
      <section><SectionRule /><h2>{t.means}</h2><p>{localizedBriefText(item.brief?.summary, locale) || t[item.category] || t.news}</p></section>
      <section><SectionRule /><h2>{t.join}</h2><ol>{t.steps.map(step => <li key={step}>{step}</li>)}</ol>
        {promotable ? <CampaignJoin venue={venue} locale={locale} market={market} officialUrl={officialEntry} placement="activity-update-join" /> : officialEntry && <a href={officialEntry} target="_blank" rel="nofollow noopener noreferrer">{cta.name || venue} ↗</a>}
      </section>
      <section><SectionRule /><h2>{t.related}</h2><ul>{related.map(row => <li key={row.id}><a href={withMarket(updateHref(row, locale), market)}>{updateHeadline(row, locale)}</a></li>)}</ul><nav aria-label={t.related}><a href={withMarket(localizedHref(`/exchanges/${venue}`, { locale }), market)}>{t.profile}</a><a href={withMarket(localizedHref('/academy', { locale }), market)}>{t.starter}</a></nav></section>
      <footer className="update-page__source"><a href={item.url} target="_blank" rel="nofollow noopener noreferrer">{t.original} ↗</a></footer>
    </article>
  </main>;
}

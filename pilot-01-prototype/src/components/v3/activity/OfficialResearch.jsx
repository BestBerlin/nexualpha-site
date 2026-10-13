import { useState } from 'react';
import { BrandMark } from '../../brand/BrandMark';
import { officialCampaignResearchByVenue } from '../../../data/official-campaign-research';
import { researchView } from '../../../data/official-campaign-model';
import { v3Copy } from '../../../data/v3-product';
import { campaignCopy } from './campaign-copy';
import { researchFieldsCopy, researchUnknown, researchDateNote } from './research-fields-copy';
import { useActivityNow } from './useActivityNow';
import { contextualHref } from '../../../data/contextual-href.js';
import { sectionEyebrowAttrs } from '../../../data/section-eyebrow.js';
import './OfficialResearch.css';

const records = Object.values(officialCampaignResearchByVenue);
const deadlines = records.flatMap((record) => [record.signupReward?.startAt, record.signupReward?.endAt, ...record.sources.flatMap((source) => [source.startAt, source.endAt])]);
const statusKey = { PUBLIC_TERMS: 'publicTerms', ACCOUNT_CONFIRMATION: 'accountConfirmation', UNCONFIRMED: 'unconfirmed', NOT_APPLICABLE: 'notApplicable', ENDED: 'ended' };
const periodKey = { ENDED: 'ended', UPCOMING: 'upcoming', WITHIN_DATES: 'withinDates', UNKNOWN: 'unknownPeriod', INVALID: 'invalidPeriod' };

function SourceDate({ value, locale, unknown, displayedDate }) {
  if (!value && displayedDate) return <><span dir="ltr">{displayedDate}</span><small className="official-research__date-note">{researchDateNote(locale)}</small></>;
  if (!value || !Number.isFinite(Date.parse(value))) return <span>{unknown}</span>;
  // One date format site-wide: ISO day.
  return <time dateTime={value}>{new Date(value).toISOString().slice(0, 10)}</time>;
}

function RewardState({ view, text, recheck = true }) {
  const period = view.signupReward.period;
  return <div className="official-research__states"><span className="official-research__state" data-period={period}>{text[statusKey[view.signupReward.status]]}</span>{view.signupReward.status !== 'NOT_APPLICABLE' && <span className="official-research__state" data-period={period}>{text[periodKey[period]]}</span>}{recheck && view.freshness === 'NEEDS_RECHECK' && <strong className="official-research__recheck">{text.recheck}</strong>}</div>;
}

function isRtlLocale(locale) {
  return String(locale || '').split('-')[0] === 'ar';
}

function ResearchBody({ view, children }) {
  return <div className="official-research__body" lang={view.contentLocale} dir={isRtlLocale(view.contentLocale) ? 'rtl' : 'ltr'}>{children}</div>;
}

export function OfficialResearchIndex({ locale = 'en', market, product, venues = [], currentDate, embedded = false }) {
  const text = campaignCopy(locale);
  const nav = v3Copy(locale);
  const [selected, setSelected] = useState(() => {
    const value = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('researchVenue');
    return venues.some((venue) => venue.slug === value) ? value : '';
  });
  const [expanded, setExpanded] = useState(false);
  const now = useActivityNow(deadlines, currentDate);
  const entries = venues.flatMap((venue) => {
    const view = researchView(officialCampaignResearchByVenue[venue.slug], locale, now);
    return view && (!selected || selected === venue.slug) ? [{ venue, view }] : [];
  });
  const visibleEntries = expanded || selected ? entries : entries.slice(0, 6);
  function selectVenue(value) {
    setSelected(value);
    setExpanded(false);
    const url = new URL(window.location.href);
    if (value) url.searchParams.set('researchVenue', value); else url.searchParams.delete('researchVenue');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }
  return <section className="official-research activity-center-v3__sources" aria-labelledby={embedded ? undefined : "official-research-title"} aria-label={embedded ? text.title : undefined}>
    {/* embedded in the /activities drawer: the section's own h2 and intro already sit above it, so only the filter shows */}
    <div className="official-research__heading">{!embedded && <div><h2 id="official-research-title">{text.title}</h2><p>{text.intro}</p></div>}
      <label className="official-research__filter">{text.filterVenue}<select name="researchVenue" value={selected} onChange={(event) => selectVenue(event.target.value)}><option value="">{text.allVenues}</option>{venues.filter((venue) => officialCampaignResearchByVenue[venue.slug]).map((venue) => <option key={venue.slug} value={venue.slug}>{venue.name}</option>)}</select></label>
    </div>
    {!["en", "zh-Hans", "zh-Hant"].includes(locale) && <p className="official-research__fallback">{text.fallback}</p>}
    <div className="official-research__list">{visibleEntries.map(({ venue, view }) => <article key={venue.slug} className="official-research__row">
      <div className="official-research__identity"><BrandMark slug={venue.slug} compact /><h3 translate="no" lang="en" dir="ltr">{venue.name}</h3></div>
      <div className="official-research__summary"><RewardState view={view} text={text} recheck={false} /><ResearchBody view={view}><p>{view.summary}</p></ResearchBody><small className="official-research__checked">{text.checked}: <SourceDate value={view.checkedAt} locale={locale} unknown={text.recheck} />{view.freshness === 'NEEDS_RECHECK' && view.checkedAt && <> · <strong className="official-research__recheck">{text.recheck}</strong></>}</small></div>
      <div className="official-research__actions"><a href={contextualHref(`/activities/research/${venue.slug}`, { locale, market, product })}>{text.openResearch}</a><a href={contextualHref(`/exchanges/${venue.slug}`, { locale, market, product })}>{nav.openDetail}</a></div>
    </article>)}</div>
    {!selected && entries.length > 6 && <button className="official-research__expand" type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? text.showFewer : text.showAll}</button>}
  </section>;
}

export function OfficialResearchPage({ locale = 'en', market, product, venue, venues = [], currentDate }) {
  const text = campaignCopy(locale);
  const nav = v3Copy(locale);
  const fields = researchFieldsCopy(locale);
  const now = useActivityNow(deadlines, currentDate);
  const view = researchView(officialCampaignResearchByVenue[venue?.slug], locale, now);
  const alternatives = venues.filter((candidate) => candidate.slug !== venue?.slug && candidate.category === venue?.category);
  const comparison = alternatives[0] ? `${venue.slug}-vs-${alternatives[0].slug}` : null;
  const withContext = (path) => contextualHref(path, { locale, market, product });
  return <main className="v6 v2-page v3-page official-research-page" id="top" {...sectionEyebrowAttrs(locale, "campaigns")} dir={['ar', 'ur'].includes(locale) ? 'rtl' : 'ltr'}>
    <div className="v2-shell official-research-page__inner">
      <nav className="official-research__actions" aria-label={nav.activities}><a href={withContext('/activities')}>{nav.activities}</a>{venue && <a href={withContext(`/exchanges/${venue.slug}`)}>{nav.openDetail}</a>}{comparison && <a href={withContext(`/compare/${comparison}`)}>{nav.compareTitle}</a>}</nav>
      <header className="official-research-page__hero"><div className="official-research__identity">{venue && <BrandMark slug={venue.slug} />}<h1><span translate="no" lang="en" dir="ltr">{venue?.name}</span><span>{text.detailTitle}</span></h1></div>{view?.usedFallback && <p className="official-research__fallback">{text.fallback}</p>}</header>
      {!view ? <p role="status">{text.notFound}</p> : <>
        <ResearchBody view={view}><p className="official-research-page__intro">{view.summary}</p></ResearchBody>
        <div className="official-research-page__meta"><RewardState view={view} text={text} /><span>{text.checked}: <SourceDate value={view.checkedAt} locale={locale} unknown={text.recheck} /></span></div>
        <section className="official-research-page__reward" aria-labelledby="research-reward-title"><h2 id="research-reward-title">{view.signupReward.status === 'NOT_APPLICABLE' ? fields.rewardType : text.reward}</h2><ResearchBody view={view}><p>{view.signupReward.summary}</p></ResearchBody>
          <details className="official-research-page__reward-details">
            <summary>{text.conditions}</summary>
            <ResearchBody view={view}><ul>{view.signupReward.conditions.map((condition) => <li key={condition}>{condition}</li>)}</ul></ResearchBody>
            <dl className="official-research__facts">{Object.entries(fields).filter(([key]) => key !== "gaps" || view.evidenceRequirements[key]?.length).map(([key, label]) => <div key={key}><dt>{label}</dt><dd lang={view.evidenceRequirements[key] ? view.contentLocale : locale} dir={view.evidenceRequirements[key] ? (isRtlLocale(view.contentLocale) ? "rtl" : "ltr") : locale !== "ar" ? "ltr" : "rtl"}>{Array.isArray(view.evidenceRequirements[key]) ? <ul>{view.evidenceRequirements[key].map((item) => <li key={item}>{item}</li>)}</ul> : view.evidenceRequirements[key] || researchUnknown(locale)}</dd></div>)}</dl>
          </details>
        </section>
        <section className="official-research-page__sources" aria-labelledby="research-sources-title"><h2 id="research-sources-title">{text.sources}</h2>{view.sources.map((source) => <article key={source.id} className="official-research__source" data-source-state={source.access}>
          <div className="official-research__source-head"><h3 translate="no" lang="en" dir="ltr"><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></h3><div><span className="official-research__state">{source.access === 'READ' ? text.readSource : text.failedSource}</span>{source.freshness === 'NEEDS_RECHECK' && <strong className="official-research__recheck">{text.recheck}</strong>}</div></div>
          <span className="official-research__host" translate="no" lang="en" dir="ltr">{source.host}</span><ResearchBody view={view}><p>{source.summary}</p></ResearchBody>
          <dl className="official-research__source-dates"><div><dt>{text.checked}</dt><dd><SourceDate value={source.checkedAt} locale={locale} unknown={text.recheck} /></dd></div><div><dt>{text.published}</dt><dd><SourceDate value={source.publishedAt} displayedDate={source.publishedDate} locale={locale} unknown={researchUnknown(locale)} /></dd></div>{(source.startAt || source.endAt || source.period === 'ENDED') && <><div><dt>{text.starts}</dt><dd><SourceDate value={source.startAt} locale={locale} unknown={text.unknownPeriod} /></dd></div><div><dt>{text.ends}</dt><dd><SourceDate value={source.endAt} locale={locale} unknown={text.unknownPeriod} /></dd></div></>}</dl>
          {source.period !== 'UNKNOWN' && <p className="official-research__state" data-period={source.period}>{text[periodKey[source.period]]}</p>}
        </article>)}</section>
        {view.notices.length > 0 && <ResearchBody view={view}><ul className="official-research__notices">{view.notices.map((notice) => <li key={notice}>{notice}</li>)}</ul></ResearchBody>}
        <div className="official-research__faq"><details><summary>{text.faqQuestion}</summary><p>{text.faqAnswer}</p></details><details><summary>{text.listingQuestion}</summary><p>{text.listingAnswer}</p></details></div><p className="official-research__policy">{text.recheckPolicy}</p>
      </>}
    </div>
  </main>;
}

// A compact doorway keeps the platform profile focused on the choice decision.
export function OfficialResearchTeaser({ locale = 'en', market, product, venue, currentDate }) {
  const text = campaignCopy(locale);
  const now = useActivityNow(deadlines, currentDate);
  const view = researchView(officialCampaignResearchByVenue[venue?.slug], locale, now);
  if (!view) return null;
  return <section className="v2-section official-research-teaser" id="reward-research">
    <h2>{text.title}</h2><RewardState view={view} text={text} />
    {view.usedFallback && <p className="official-research__fallback">{text.fallback}</p>}
    <ResearchBody view={view}><p>{view.summary}</p></ResearchBody>
    <div className="official-research__actions"><a href={contextualHref(`/activities/research/${venue.slug}`, { locale, market, product })}>{text.openResearch}</a><span>{text.checked}: <SourceDate value={view.signupReward.checkedAt || view.checkedAt} locale={locale} unknown={text.recheck} /></span></div>
  </section>;
}

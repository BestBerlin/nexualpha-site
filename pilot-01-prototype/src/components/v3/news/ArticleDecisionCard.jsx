import React from 'react';
import { BrandMark } from '../../brand/BrandMark.jsx';
import { buildVenueFeeSummary, feeSummaryCopy } from '../../../data/venue-fee-summary.js';
import { ownerRebateLine } from '../../../data/owner-rebate-line.js';
import { localizedHref } from '../../../data/locale-routing.js';
import { canonicalComparePairSlug, isActiveCompareVenue } from '../../../data/compare-slug.js';
import { labels as feeLabels } from '../ExchangeFactsV5.jsx';
import { feePctOfRate } from '../../../data/exchange-facts.js';
import { articleVenueKeys, conversionCta } from '../conversion/conversion-model.js';
import { CommissionDisclosureLine, ConversionCode, ConversionSignup } from '../conversion/ConversionActions.jsx';
import { PARTNER_RELATED_COPY } from './partner-autolink.js';
import './article-decision-card.css';

export function articleDecision(article, locale, market, product) {
  const candidates = articleVenueKeys(article).map(slug => ({ slug, cta: conversionCta(slug, locale, market, product) })).filter(item => item.cta);
  // Every named, promotable venue needs checked spot and perpetual facts, including compare cards.
  const checked = candidates.map(venue => buildVenueFeeSummary({ slug: venue.slug }));
  if (checked.some(fees => !['spot', 'futures'].every(product => fees.rates.some(rate => rate.product === product)))) return null;
  if (candidates.length >= 2) {
    const pair = candidates.filter(item => isActiveCompareVenue(item.slug)).slice(0, 2);
    return pair.length === 2 ? { kind: 'compare', venues: pair } : null;
  }
  if (candidates.length !== 1) return null;
  const venue = candidates[0];
  const fees = checked[0];
  return { kind: 'signup', ...venue, fees };
}

export function ArticleDecisionCard({ article, locale = 'en', market, product }) {
  const decision = articleDecision(article, locale, market, product);
  if (!decision) return null;
  const t = PARTNER_RELATED_COPY[locale] || PARTNER_RELATED_COPY.en;
  if (decision.kind === 'compare') {
    const [a, b] = decision.venues;
    return <aside className="cv-decision" data-article-decision="compare" lang={locale} dir={['ar', 'ur'].includes(locale) ? 'rtl' : 'ltr'}>
      <a className="cv-decision__compare" href={localizedHref(`/compare/${canonicalComparePairSlug([a.slug, b.slug])}`, { locale })}
        data-cta-kind="research" data-cta-placement="article-decision-compare">
        <span className="cv-decision__logos"><BrandMark slug={a.slug} compact /><BrandMark slug={b.slug} compact /></span>
        <strong>{t.compare(a.cta.name || a.slug, b.cta.name || b.slug)}</strong><span aria-hidden="true">→</span>
      </a>
    </aside>;
  }
  const { slug, cta, fees } = decision;
  const l = feeLabels(locale);
  const f = feeSummaryCopy(locale);
  const terms = ownerRebateLine(slug, locale, cta.name || slug);
  return <aside className="cv-decision" data-article-decision="signup" data-decision-venue={slug} lang={locale} dir={['ar', 'ur'].includes(locale) ? 'rtl' : 'ltr'}>
    <div className="cv-decision__head"><BrandMark slug={slug} compact /><strong>{t.feesRebate(cta.name || slug)}</strong></div>
    <dl className="cv-decision__fees">{fees.rates.map(rate => <div key={rate.product}>
      <dt>{rate.product === 'spot' ? l.spot : l.perp} · {l.maker} / {l.taker}</dt>
      <dd><span translate="no">{feePctOfRate(rate.makerRate, locale)} / {feePctOfRate(rate.takerRate, locale)}</span> <a href={rate.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={f.source}>{f.checked} <time dateTime={rate.checkedAt}>{rate.checkedAt}</time></a></dd>
    </div>)}</dl>
    <p className="cv-decision__scope">{f.body}</p>
    {terms && <p className="cv-decision__terms">{terms}</p>}
    <div className="cv-decision__actions"><ConversionCode cta={cta} slug={slug} locale={locale} placement="article-decision-code" />
      <ConversionSignup cta={cta} slug={slug} locale={locale} placement="article-decision-signup" /></div>
    <CommissionDisclosureLine locale={locale} />
  </aside>;
}

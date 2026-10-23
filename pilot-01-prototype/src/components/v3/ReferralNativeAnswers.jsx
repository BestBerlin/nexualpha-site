import { nativeReferralFor } from '../../data/referral-native.js';
import { partnerBenefitCopy } from '../../data/partner-benefit-status.js';
import { SourceLink } from '../shared/SourceLink.jsx';
import { LocalLink } from './v3-pages-shared.jsx';
import './referral-native-answers.css';
import { VenueVisualIcon } from './VenueDetailPageVisuals.jsx';

export function ReferralNativeAnswers({ slug, locale, market, hideShortAnswer = false, disclosure }) {
  const data = nativeReferralFor(slug, locale, market);
  if (!data) return null;
  const { copy, help } = data;
  const terms = partnerBenefitCopy(locale);
  const source = (href) => <SourceLink locale={locale} market={market} href={href} data-cta-kind="source" data-cta-placement="referral-verification-source">{data.slug} · {copy.labels.source}</SourceLink>;
  return <section className="referral-native-answers" id="referral-answer" aria-label={copy.labels.log}>
    {data.shortAnswer && !hideShortAnswer && <p className="referral-native-answers__short" data-short-answer=""><strong>{data.shortAnswer.label}</strong> {data.shortAnswer.text}</p>}
    <dl className="vx-registration-flow">
      {!data.neutral && <div data-registration-stage="entry"><dt><VenueVisualIcon kind="identity" /><span><small aria-hidden="true">01</small>{copy.labels.entry}</span></dt><dd>{data.entry}</dd></div>}
      {data.code && <div data-registration-stage="code"><dt><VenueVisualIcon kind="source" /><span><small aria-hidden="true">02</small>{copy.labels.code}</span></dt><dd><bdi translate="no">{data.code}</bdi></dd></div>}
      <div data-registration-stage="payout"><dt><VenueVisualIcon kind="fees" /><span>{!data.neutral && <small aria-hidden="true">03</small>}{copy.labels.payout}</span></dt><dd>{data.payout}</dd></div>
      {!data.neutral && <div className="vx-registration-benefit"><dt><VenueVisualIcon kind="shield" />{copy.labels.benefit}</dt><dd>{data.benefit}{data.partnerDate && <> · {terms.confirmed.replace('{date}', data.partnerDate)}</>}{disclosure && <small className="vx-registration-disclosure">{disclosure}</small>}</dd></div>}
      <div className="vx-registration-later"><dt><VenueVisualIcon kind="question" />{copy.labels.later}</dt><dd>{data.later}</dd></div>
    </dl>
    <details>
      <summary>{copy.labels.log}</summary>
      {data.partnerDate && <p>{terms.checks}</p>}
      <table><thead><tr><th>{copy.labels.verified}</th><th>{copy.labels.check}</th><th>{copy.labels.source}</th></tr></thead><tbody>
        <tr><td>{help.reviewedAt ? <time dateTime={help.reviewedAt}>{help.reviewedAt}</time> : copy.pending}</td><td>{copy.labels.later}</td><td>{source(help.href)}</td></tr>
        {!data.neutral && help.entry && <tr><td><time dateTime={help.reviewedAt}>{help.reviewedAt}</time></td><td>{copy.labels.entry}</td><td>{source(help.entryHref)}</td></tr>}
        {data.partnerDate && <tr><td><time dateTime={data.partnerDate}>{data.partnerDate}</time></td><td>{copy.labels.benefit} / {copy.labels.payout}</td><td>{terms.label} · {terms.account}</td></tr>}
      </tbody></table>
    </details>
    {data.neutral && locale === "zh-Hant" && <LocalLink locale={locale} href="/rates">{copy.labels.calculator}</LocalLink>}
    {!data.neutral && data.partnerDate && <LocalLink locale={locale} href={`/rates?venue=${slug}${market ? `&market=${encodeURIComponent(market)}` : ''}`}>{copy.labels.calculator}</LocalLink>}
  </section>;
}

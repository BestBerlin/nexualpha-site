import { nativeReferralFor } from '../../data/referral-native.js';
import { partnerBenefitCopy } from '../../data/partner-benefit-status.js';
import { SourceLink } from '../shared/SourceLink.jsx';
import { LocalLink } from './v3-pages-shared.jsx';
import './referral-native-answers.css';

export function ReferralNativeAnswers({ slug, locale, market }) {
  const data = nativeReferralFor(slug, locale, market);
  if (!data) return null;
  const { copy, help } = data;
  const terms = partnerBenefitCopy(locale);
  const source = (href) => <SourceLink locale={locale} market={market} href={href} data-cta-kind="source" data-cta-placement="referral-verification-source">{data.slug} · {copy.labels.source}</SourceLink>;
  return <section className="referral-native-answers" id="referral-answer" aria-label={copy.labels.log}>
    <dl>
      {data.code && <div><dt>{copy.labels.code}</dt><dd><bdi translate="no">{data.code}</bdi></dd></div>}
      {!data.neutral && <div><dt>{copy.labels.benefit}</dt><dd>{data.benefit}{data.partnerDate && <> · {terms.confirmed.replace('{date}', data.partnerDate)}</>}</dd></div>}
      {!data.neutral && <div><dt>{copy.labels.entry}</dt><dd>{data.entry}</dd></div>}
      <div><dt>{copy.labels.later}</dt><dd>{data.later}</dd></div>
      <div><dt>{copy.labels.payout}</dt><dd>{data.payout}</dd></div>
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

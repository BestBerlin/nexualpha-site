import { formatSgt } from "../../../data/local-time.js";
import { SourceLink } from "../../shared/SourceLink.jsx";
import { CampaignJoin } from "./CampaignJoin.jsx";
import { BrandMark } from "../../brand/BrandMark";
import { visibleOfficialUpdates } from "../../official-updates/official-updates-model";
import { contextualHref } from "../../../data/contextual-href.js";
import { venueProfile, v3Copy } from "../../../data/v3-product";
import { campaignCopy } from "./campaign-copy";
import { useActivityNow } from "./useActivityNow";
import { normalizeActivityEligibility } from "./activity-eligibility.js";
import { sectionEyebrowAttrs } from "../../../data/section-eyebrow.js";
import { campaignVisibleInLocale } from "../../../data/campaign-locale-policy.js";

function DecisionBrief({ text, eyebrow, title, body, facts = [] }) {
  return <aside className="v3-decision-brief" aria-label={eyebrow}>
    <h2>{title}</h2>
    <p>{body}</p>
    {facts.length > 0 && <dl>{facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd translate={fact.translate ?? undefined} lang={fact.lang ?? undefined} dir={fact.lang === "en" ? "ltr" : undefined}>{fact.value}</dd></div>)}</dl>}
    <small>{text.ctaLocked}</small>
  </aside>;
}

function SnapshotStrip({ items }) {
  const visibleItems = items.filter((item) => item && item.value !== null && item.value !== undefined && item.value !== "");
  return <div className="v3-snapshot-strip">{visibleItems.map((item) => <article key={item.label}>
    <span>{item.label}</span>
    <b translate={item.translate ?? "no"} lang={item.lang ?? "en"}>{item.value}</b>
    <p>{item.hint}</p>
  </article>)}</div>;
}

export function ActivityDetailPage({ copy, locale, market, product, update: candidateUpdate, venues }) {
  const now = useActivityNow([candidateUpdate?.expiresAt]);
  const visibleCandidate = candidateUpdate && campaignVisibleInLocale(candidateUpdate, locale) ? candidateUpdate : null;
  const update = visibleOfficialUpdates(visibleCandidate ? [visibleCandidate] : [], now)[0];
  const text = v3Copy(locale);
  const venue = update ? venues.find((candidate) => candidate.slug === update.platform.slug) : null;
  const profile = venue ? venueProfile(venue, locale) : null;
  const eligibility = update ? normalizeActivityEligibility(update, {
    locale,
    now,
    researchHref: venue ? contextualHref(`/activities/research/${venue.slug}`, { locale, market, product }) : contextualHref("/activities", { locale, market, product }),
  }) : null;
  const snapshotItems = update ? [
    { label: text.platformType, value: update.platform.name, hint: update.kind, translate: "no", lang: "en" },
    { label: copy.opportunity.source, value: update.officialSource.type, hint: update.officialSource.url, translate: "no", lang: "en" },
    { label: copy.decisionWorkbench.discovered, value: formatSgt(update.discoveredAt, locale), hint: copy.common.verifiedSource },
    { label: copy.listings.expired, value: update.expiresAt ? formatSgt(update.expiresAt, locale) : "—", hint: eligibility?.statusLabel ?? text.sourceState },
  ] : [];
  return <main className={`v6 v2-page v3-page v3-activity-detail${update ? "" : " v3-page--empty"}`} id="top" {...sectionEyebrowAttrs(locale, "campaigns")}>
    <section className="v3-page-hero v2-shell">
      <a href={contextualHref("/activities", { locale, market, product })} className="v3-back-link">{text.activities}</a>
      <div className="v3-venue-hero">
        <span className="v3-independent-badge">{text.independent}</span>
        <h1>{update?.title || text.activityDetail}</h1>
        <p>{update ? text.verifiedOnly : text.activityNotFound}</p>
      </div>
      {profile && <DecisionBrief
        text={text}
        eyebrow={text.activities}
        title={profile.name}
        body={profile.positioning}
        facts={[{ label: text.officialDomain, value: profile.officialDomain, translate: "no", lang: "en" }]}
      />}
      {update && venue && <div className="v3-activity-decision-strip" aria-label={text.activities}>
        <div>
          <span>{copy.common.verifiedSource}</span>
          <strong>{update.officialSource.type}</strong>
        </div>
        <div>
          <span>{text.sourceState}</span>
          <strong>{eligibility.statusLabel}</strong>
        </div>
        <div className="v3-activity-decision-strip__actions">
          <a href={contextualHref(`/exchanges/${venue.slug}`, { locale, market, product })} data-cta-kind="research" data-cta-platform={venue.slug} data-cta-placement="activity-detail-hero" data-growth-decision={venue.slug} data-growth-placement="activity-detail-hero">{text.openDetail} →</a>
          {eligibility.cta.enabled
            ? <a href={eligibility.cta.href} target="_blank" rel="noopener noreferrer" data-cta-kind="source" data-cta-platform={venue.slug} data-cta-placement="activity-detail-action" data-growth-decision={venue.slug} data-growth-placement="activity-detail-action">{eligibility.cta.label} →</a>
            : <a href={eligibility.cta.alternativeHref} data-cta-kind="research" data-cta-platform={venue.slug} data-cta-placement="activity-detail-hero-research" data-growth-decision={venue.slug} data-growth-placement="activity-detail-hero-research">{eligibility.cta.alternativeLabel} →</a>}
        </div>
      </div>}
    </section>
    {update && <section className="v2-section"><CampaignJoin venue={update.platform.slug} locale={locale} market={market} officialUrl={update.officialSource.url} placement="activity-detail-join" /></section>}
    {update && <section className="v2-section v3-page-snapshot v3-activity-snapshot">
      <SnapshotStrip items={snapshotItems} />
    </section>}
    {update && <section className="v2-section">
      <div className="v3-matrix">
        <div><b>{text.platformType}</b><span translate="no" lang="en">{update.platform.name}</span></div>
        <div><b>{copy.opportunity.source}</b><span translate="no" lang="en">{update.officialSource.type}</span></div>
        <div><b>{copy.decisionWorkbench.discovered}</b><span><time dateTime={update.discoveredAt}>{formatSgt(update.discoveredAt, locale)}</time></span></div>
        <div><b>{copy.common.verifiedSource}</b><span><time dateTime={update.verifiedAt}>{formatSgt(update.verifiedAt, locale)}</time></span></div>
        <div><b>{copy.listings.expired}</b><span>{update.expiresAt ? <time dateTime={update.expiresAt}>{formatSgt(update.expiresAt, locale)}</time> : "—"}</span></div>
        <div><b>{text.sourceState}</b><span><SourceLink locale={locale} market={market} href={update.officialSource.url} target="_blank" rel="noopener noreferrer">{text.openOfficialSource}</SourceLink></span></div>
      </div>
      {eligibility && <div className="v3-matrix v3-activity-eligibility" aria-label={eligibility.statusLabel}>
        {eligibility.rows.map((row) => <div key={row.key} data-missing={row.missing ? "true" : undefined}>
          <b>{row.label}</b>
          <span translate={row.key === "officialSource" ? "no" : undefined} lang={row.key === "officialSource" ? "en" : undefined}>{row.value}</span>
        </div>)}
      </div>}
      {eligibility && !eligibility.cta.enabled && <p className="v3-activity-detail__cta-note">{eligibility.cta.label}</p>}
    </section>}
    {venue && <section className="v2-section v3-activity-detail__venue"><div className="v3-source-board__identity"><BrandMark slug={venue.slug} compact /><h2 translate="no" lang="en" dir="ltr">{venue.name}</h2></div><p>{profile.positioning}</p><a href={contextualHref(`/exchanges/${venue.slug}`, { locale, market, product })}>{text.openDetail}</a><a href={contextualHref(`/activities/research/${venue.slug}`, { locale, market, product })}>{campaignCopy(locale).openResearch}</a></section>}
  </main>;
}

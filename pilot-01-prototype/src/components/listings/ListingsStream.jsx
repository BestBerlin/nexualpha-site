import { formatSgt } from "../../data/local-time.js";
import { useMemo, useState } from "react";
import { intlLocale } from "../../content/v2-copy";
import { track } from "../../data/market-command";

const listingSummary = (listing, copy) => {
  if (listing.state === "Expired") return copy.listings.termsEnded;
  if (listing.sourceLabel !== "verified" || listing.state === "Pending") return copy.listings.sourceReceived;
  return copy.listings.opensAt;
};

export function ListingsStream({ copy, locale, listings, availability, reasonCode, filters }) {
  const [filter, setFilter] = useState(filters[0]);
  const [opened, setOpened] = useState(null);
  const [saved, setSaved] = useState(new Set());
  const visible = useMemo(() => filter === filters[0] ? listings : listings.filter((item) => listingSummary(item, copy).toLocaleLowerCase(copy.locale).includes(filter.toLocaleLowerCase(copy.locale))), [copy, filter, filters, listings]);
  const sourcePending = availability === "unavailable";

  return <section id="listings" className="v2-section listings-section">
    <div className="section-lead"><p>{copy.listings.eyebrow}</p><h2>{copy.listings.title}</h2><span>{copy.common.readFirst}</span></div>
    {sourcePending ? <div className="listing-stream" role="status"><p className="empty-row">{copy.common.sourceRequired}{reasonCode ? ` · ${reasonCode}` : ""}</p></div> : <>
      <div className="filter-bar" role="tablist" aria-label={copy.listings.title}>{filters.map((item) => <button key={item} type="button" className={filter === item ? "is-selected" : ""} onClick={() => setFilter(item)} role="tab" aria-selected={filter === item}>{item}</button>)}</div>
      <div className="listing-stream" tabIndex="0" role="region" aria-label={copy.listings.title}>
        <div className="listing-stream__head"><span>{copy.common.time}</span><span>{copy.finder.listing}</span><span>{copy.nav.exchanges}</span><span>{copy.common.product}</span><span>{copy.common.action}</span></div>
        {visible.length ? visible.map((listing) => {
          const isSaved = saved.has(listing.slug);
          return <article key={listing.slug} className={opened === listing.slug ? "is-open" : ""}><time dateTime={listing.updatedAt}>{formatSgt(listing.updatedAt, intlLocale(locale), "clock")}</time><b>{listing.title}</b><span>{listing.venue || copy.compare.checkTerms}</span><p>{opened === listing.slug ? copy.opportunity.condition : listingSummary(listing, copy)}</p><div className="listing-actions"><button type="button" aria-pressed={isSaved} onClick={() => setSaved((current) => { const next = new Set(current); if (next.has(listing.slug)) next.delete(listing.slug); else next.add(listing.slug); return next; })}>{isSaved ? copy.common.savedState : copy.common.save}</button><button type="button" aria-expanded={opened === listing.slug} onClick={() => { setOpened((current) => current === listing.slug ? null : listing.slug); track("listing_open", { slug: listing.slug }); }}>{opened === listing.slug ? copy.actions.close : `${copy.listings.details} →`}</button></div></article>;
        }) : <p className="empty-row">{copy.finder.empty}</p>}
      </div>
    </>}
  </section>;
}

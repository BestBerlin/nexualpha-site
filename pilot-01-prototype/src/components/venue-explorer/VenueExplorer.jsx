import { useMemo, useState } from "react";
import { BrandMark } from "../brand/BrandMark";
import { track } from "../../data/market-command";
import { v3Copy, venueProfile } from "../../data/v3-product";
import { homeCopy } from "../../content/home-copy";
import { researchForVenue } from "../../data/exchange-research";
import { localizedHref } from "../../data/locale-routing.js";

const filterIds = ["ALL", "CEX", "DEX", "Perp DEX"];
const categoryOrder = new Map([["CEX", 0], ["DEX", 1], ["Perp DEX", 2]]);

const withLocale = (locale, href) => {
  return localizedHref(href, { locale });
};

export function VenueExplorer({ copy, locale = "en", venues: venueCatalog, selected = [], onSelectionChange, compact = false, headingLevel = 1, allVenuesHref }) {
  const [filter, setFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("cards");
  const [sortBy, setSortBy] = useState("name");
  const text = v3Copy(locale);
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const venues = useMemo(() => {
    const filtered = venueCatalog.filter((venue) => filter === "ALL" || venue.category === filter);
    const sortable = [...filtered];
    sortable.sort((a, b) => {
      if (sortBy === "type") {
        const categoryDelta = (categoryOrder.get(a.category) ?? 99) - (categoryOrder.get(b.category) ?? 99);
        if (categoryDelta !== 0) return categoryDelta;
      }
      return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
    });
    return sortable;
  }, [filter, sortBy, venueCatalog]);
  const labels = new Map([["ALL", copy.common.all], ["CEX", "CEX"], ["DEX", "DEX"], ["Perp DEX", "Perp DEX"]]);
  const sortOptions = [
    ["name", text.sortName],
    ["type", text.sortType],
  ];
  const toggleComparison = (slug) => {
    if (selected.includes(slug)) return onSelectionChange(selected.filter((item) => item !== slug));
    if (selected.length < 3) { onSelectionChange([...selected, slug]); track("compare_start"); }
  };
  return <section id="exchanges" className={`v2-section explorer-section${compact ? " explorer-section--compact" : ""}`}>
    <div className="section-lead"><p>{copy.discovery.eyebrow}</p><Heading>{compact ? homeCopy(locale).featured : copy.discovery.title}</Heading><span>{copy.home.compareText}</span></div>
    <div className="venue-explorer__controls">
      <div className="filter-bar venue-filter" role="tablist" aria-label={copy.discovery.title}>{filterIds.map((id) => <button type="button" key={id} className={filter === id ? "is-selected" : ""} onClick={() => setFilter(id)} role="tab" aria-selected={filter === id}>{labels.get(id)}</button>)}</div>
      <div className="venue-explorer__tools">
        <div className="venue-explorer__view" role="group" aria-label={text.viewLabel}>
          <button type="button" className={viewMode === "cards" ? "is-selected" : ""} aria-pressed={viewMode === "cards"} onClick={() => setViewMode("cards")}>{text.cardsView}</button>
          <button type="button" className={viewMode === "list" ? "is-selected" : ""} aria-pressed={viewMode === "list"} onClick={() => setViewMode("list")}>{text.listView}</button>
        </div>
        <label className="venue-explorer__sort">
          <span>{text.sortLabel}</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {sortOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        <span className="venue-explorer__count">{text.resultVenues(venues.length)}</span>
      </div>
    </div>
    <div className={`venue-grid venue-grid--${viewMode}`}>{venues.map((venue) => {
      const chosen = selected.includes(venue.slug);
      const profile = venueProfile(venue, locale);
      const research = researchForVenue(venue.slug, locale);
      const primaryCheck = profile.checks[0] ?? text.verifyBefore;
      const secondaryCheck = profile.checks[1] ?? text.noOfficial;
      return <article key={venue.slug} className={`${chosen ? "is-selected-for-compare " : ""}venue-card`}>
        <div className="venue-card__top"><a className="venue-card__identity" href={withLocale(locale, `/exchanges/${venue.slug}`)} translate="no" lang="en" dir="ltr"><BrandMark slug={venue.slug} /><div><b>{venue.name}</b><small>{venue.category}</small></div></a></div>
        <div className="venue-card__route">{research?.contentLocale === locale ? <strong>{research.summary}</strong> : <><span>{copy.compare.bestFor}</span><strong>{profile.useCases[0] ?? primaryCheck}</strong></>}</div>
        {!compact && <div className="venue-card__facts">
          <div><span>{text.officialDomain}</span><b translate="no" lang="en" dir="ltr">{profile.officialDomain}</b></div>
        </div>}
        <p className="venue-card__decision"><span>{text.verifyBefore}</span>{primaryCheck}{!compact && <small>{secondaryCheck}</small>}</p>
        <div className="venue-actions"><a href={withLocale(locale, `/exchanges/${venue.slug}`)}>{text.openDetail}</a><button type="button" aria-pressed={chosen} disabled={!chosen && selected.length >= 3} onClick={() => toggleComparison(venue.slug)}>{chosen ? copy.decisionWorkbench.remove : copy.decisionWorkbench.select}</button></div>
      </article>;
    })}</div>
    {allVenuesHref && <div className="venue-explorer__more"><a className="button-quiet" href={allVenuesHref}>{homeCopy(locale).viewAll} <span aria-hidden="true">→</span></a></div>}
  </section>;
}

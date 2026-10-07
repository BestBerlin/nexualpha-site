import { useEffect, useRef, useState } from "react";
import { BrandMark } from "../brand/BrandMark";
import { track } from "../../data/market-command";
import { v3Copy } from "../../data/v3-product";

export function FeaturedOpportunity({ copy, locale = "en", model, venues = [], dataStatus, onAlternatives }) {
  const [expanded, setExpanded] = useState(false);
  const details = useRef(null);
  const { featured } = model;
  const text = v3Copy(locale);
  const state = copy.opportunity.state[featured.state] ?? featured.state;
  const source = featured.sourceLabel === "verified" ? copy.opportunity.official : copy.listings.pending;
  const comparisonPair = venues.filter(Boolean).slice(0, 2);
  const pair = comparisonPair.length >= 2 ? comparisonPair : [
    { slug: "bybit", name: "Bybit", category: "CEX", sourceStatus: "VERIFIED" },
    { slug: "okx", name: "OKX", category: "CEX", sourceStatus: "VERIFIED" },
  ];
  useEffect(() => { track("opportunity_impression", { slug: featured.slug }); }, [featured.slug]);
  useEffect(() => { if (expanded) details.current?.focus({ preventScroll: window.matchMedia("(prefers-reduced-motion: reduce)").matches }); }, [expanded]);
  const toggleDetails = () => { setExpanded((value) => !value); track("opportunity_open", { slug: featured.slug }); };
  if (model.preview || featured.state !== "Active") return <article className="featured-ticket featured-ticket--directory">
    <div className="ticket-kicker"><span className="signal-dot" />{text.shortlist}</div>
    <h2>{text.conversionPreviewTitle}</h2>
    <p className="preview-note">{text.conversionPreviewBody}</p>
    <div className="ticket-readiness" role="list" aria-label={text.conversionPath}>
      {text.funnelSteps.slice(0, 3).map((item, index) => <span key={item.title} role="listitem"><b>{String(index + 1).padStart(2, "0")}</b>{item.title}</span>)}
    </div>
    <div className="ticket-compare">
      <span>{text.shortlist}</span>
      <div className="ticket-compare__pair">
        {pair.map((venue) => <div key={venue.slug} className="ticket-compare__venue"><BrandMark slug={venue.slug} compact /><div><b translate="no" lang="en">{venue.name}</b><small>{venue.category}</small></div></div>)}
      </div>
    </div>
    <div className="ticket-actions"><button className="button-primary" type="button" onClick={onAlternatives}>{copy.home.exploreLabel} →</button></div>
    <p className="ticket-disclosure">{text.relationship}</p>
  </article>;
  return <article className="featured-ticket" aria-busy={dataStatus === "loading"}>
    <div className="ticket-kicker"><span className="signal-dot" />{copy.opportunity.current(state)}</div>
    <h2>{featured.title}</h2>
    {model.preview && <p className="preview-note">{copy.opportunity.noOffer}</p>}
    <div className="ticket-compare">
      <span>{copy.compare.evidence}</span>
      <div className="ticket-compare__pair">
        {pair.map((venue, index) => <div key={venue.slug} className="ticket-compare__venue"><BrandMark slug={venue.slug} compact /><div><b>{venue.name}</b><small>{venue.category}{index === 0 ? "" : ` · ${venue.sourceStatus}`}</small></div></div>)}
      </div>
    </div>
    <dl>
      <div><dt>{copy.common.assetEvent}</dt><dd>{featured.venue || copy.common.sourceRequired}</dd></div>
      <div><dt>{copy.opportunity.source}</dt><dd className={featured.sourceLabel === "verified" ? "positive" : ""}>{source}</dd></div>
      <div><dt>{copy.common.region}</dt><dd>{model.availability}</dd></div>
      <div><dt>{copy.finder.conditions}</dt><dd>{featured.summary || copy.opportunity.condition}</dd></div>
    </dl>
    {expanded && <div ref={details} tabIndex="-1" className="ticket-details"><b>{copy.common.route}</b><ol><li>{copy.opportunity.official}</li><li>{model.availability}</li><li>{copy.hero.compare}</li></ol></div>}
    <div className="ticket-actions">
      {model.isRestricted ? <button className="button-primary" type="button" onClick={onAlternatives}>{copy.opportunity.alternatives} →</button> : <button className="button-primary" type="button" onClick={toggleDetails}>{copy.opportunity.condition} →</button>}
      <button className="button-quiet" type="button" aria-expanded={expanded} onClick={toggleDetails}>{expanded ? copy.actions.close : copy.actions.expand}</button>
    </div>
    <p className="ticket-disclosure">{model.disclosure}</p>
  </article>;
}

import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "../brand/BrandMark";
import { track } from "../../data/market-command";
import { v3Copy, venueProfile } from "../../data/v3-product";
import "./decision-workbench.css";
import "./compare-dock.css";

export function QuickCompare({ copy, locale = "en", venues, selected, onSelectionChange, onAdjustSelection, comparisonHref }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const rows = useMemo(() => selected.map((slug) => venues.find((venue) => venue.slug === slug)).filter(Boolean), [selected, venues]);
  const ready = rows.length >= 2;
  const text = v3Copy(locale);
  const dimensions = [
    [text.platformType, (venue) => venue.category],
    [text.accessModel, (venue) => venueProfile(venue, locale).accessModel],
    [text.officialDomain, (venue) => venue.officialDomain || text.pendingReview],
    [text.sourceState, (venue) => venueProfile(venue, locale).sourceHubs.length ? text.trackedSources : text.pendingReview],
    [text.partnerState, () => text.notConfigured],
  ];
  const remove = (slug) => onSelectionChange(selected.filter((item) => item !== slug));
  const add = () => onAdjustSelection?.();

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const close = (event) => { if (event.key === "Escape") setDrawerOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [drawerOpen]);

  const openComparison = () => {
    track("compare_cta_click");
    if (comparisonHref) {
      window.location.href = comparisonHref;
      return;
    }
    setDrawerOpen((value) => !value);
  };

  return <section id="compare" className="v2-section compare-section compare-dock" aria-label={copy.compare.title}>
    <div className="section-lead compare-dock__lead">
      <p>{copy.compare.evidence}</p>
      <h2>{copy.compare.title}</h2>
      <span>{text.compareIntro}</span>
    </div>
    <div className="decision-workbench decision-workbench--dock" aria-live="polite">
      <div className="decision-workbench__status">
        <span>{rows.length} / 3 {copy.common.selectedVenues}</span>
        <b>{ready ? copy.decisionWorkbench.ready : copy.decisionWorkbench.selectMore(2 - rows.length)}</b>
      </div>
      <div className="decision-workbench__selection">
        {rows.length ? rows.map((venue) => <button key={venue.slug} type="button" onClick={() => remove(venue.slug)} title={`${copy.actions.close} ${venue.name}`} translate="no" lang="en" dir="ltr"><BrandMark slug={venue.slug} compact /><span>{venue.name}</span><i aria-hidden="true">×</i></button>) : <span>{copy.decisionWorkbench.selectMore(2)}</span>}
      </div>
      <div className="decision-workbench__actions">
        <button type="button" onClick={onAdjustSelection}>{copy.decisionWorkbench.adjust}</button>
        <button type="button" onClick={add} disabled={selected.length >= 3 || venues.length <= selected.length}>{copy.compare.add}</button>
        <button type="button" className="button-primary" disabled={!ready} aria-expanded={!comparisonHref ? drawerOpen : undefined} aria-controls={!comparisonHref ? "comparison-workbench-drawer" : undefined} onClick={openComparison}>{drawerOpen && !comparisonHref ? copy.common.closeCompare : copy.common.seeFullComparison}</button>
      </div>
    </div>
    {drawerOpen && ready && !comparisonHref && <div id="comparison-workbench-drawer" className="comparison-drawer" role="region" aria-label={copy.compare.title}>
      <div className="comparison-drawer__header"><div><span>{copy.decisionWorkbench.ready}</span><h3>{copy.compare.title}</h3></div><button type="button" onClick={() => setDrawerOpen(false)}>{copy.actions.close}</button></div>
      <div className="compare-matrix">
        <div className="compare-matrix__head"><span>{copy.common.dimension}</span>{rows.map((venue) => <span key={venue.slug} translate="no" lang="en" dir="ltr"><BrandMark slug={venue.slug} compact />{venue.name}</span>)}</div>
        {dimensions.map(([dimension, valueFor]) => <div className="compare-row" key={dimension}><b>{dimension}</b>{rows.map((venue) => <span className={valueFor(venue) !== valueFor(rows[0]) ? "is-different" : ""} key={venue.slug}>{valueFor(venue)}</span>)}</div>)}
      </div>
    </div>}
  </section>;
}

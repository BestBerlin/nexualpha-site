import { BrandMark } from "../brand/BrandMark";
import { v3Copy } from "../../data/v3-product";
import "./scenario-router.css";

const routes = ["CEX", "DEX", "Perp DEX"];

export function ScenarioRouter({ copy, venues, selected, onSelectionChange }) {
  const text = v3Copy(copy.locale);
  const choose = (category) => {
    const candidates = venues.filter((venue) => venue.category === category).slice(0, 2).map((venue) => venue.slug);
    if (candidates.length >= 2) onSelectionChange(candidates);
  };
  return <section className="v2-section scenario-router" aria-labelledby="scenario-router-title">
    <div className="section-lead">
      <p>{copy.discovery.eyebrow}</p>
      <h2 id="scenario-router-title">{copy.home.compareLabel}</h2>
      <span>{copy.home.compareText}</span>
    </div>
    <div className="scenario-router__grid">
      {routes.map((category) => {
        const candidates = venues.filter((venue) => venue.category === category).slice(0, 2);
        const active = candidates.length >= 2 && candidates.every((venue) => selected.includes(venue.slug));
        return <button key={category} type="button" className={active ? "is-active" : ""} aria-pressed={active} disabled={candidates.length < 2} onClick={() => choose(category)}>
          <span>{category}</span>
          <strong>{category} · {text.verifyBefore}</strong>
          <div translate="no" lang="en" dir="ltr">{candidates.map((venue) => <span key={venue.slug}><BrandMark slug={venue.slug} compact />{venue.name}</span>)}</div>
        </button>;
      })}
    </div>
  </section>;
}

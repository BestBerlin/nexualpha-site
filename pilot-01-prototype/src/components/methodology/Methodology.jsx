import "./methodology.css";

export function Methodology({ copy, disclosure }) {
  const principles = [
    [copy.common.route, copy.markets.limits],
    [copy.common.verifiedSource, `${copy.opportunity.source} · ${copy.common.sourceRequired}`],
    [copy.listings.verificationPending || copy.common.sourceRequired, copy.opportunity.unavailable || copy.common.sourceRequired],
    [copy.opportunity.noOffer, copy.opportunity.condition],
  ];
  return <section id="methodology" className="v2-section methodology"><div className="section-lead"><p>{copy.nav.policy}</p><h2>{copy.nav.policy}</h2><span>{copy.markets.limits}</span></div><div className="methodology__statement"><b>{copy.common.route}</b><p>{disclosure}</p></div><div className="methodology__grid">{principles.map(([title, detail], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{detail}</p></article>)}</div><p className="methodology__note">{copy.opportunity.noOffer} · {copy.common.sourceRequired}</p></section>;
}

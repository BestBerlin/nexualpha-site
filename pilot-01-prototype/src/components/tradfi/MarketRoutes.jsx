import { useState } from "react";
import { track } from "../../data/market-command";

export function MarketRoutes({ copy, routes }) {
  const [active, setActive] = useState("equity");
  const move = (event) => {
    const index = routes.findIndex((route) => route.id === active);
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? routes.length - 1 : (index + (event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1) + routes.length) % routes.length;
    setActive(routes[next].id);
    document.getElementById(`route-${routes[next].id}`)?.focus();
  };
  return <section id="stocks" className="v2-section routes-section"><div className="section-lead"><p>{copy.markets.eyebrow}</p><h2>{copy.markets.title}</h2><span>{copy.markets.limits}</span></div><div className="route-columns" role="tablist" aria-label={copy.markets.title} onKeyDown={move}>{routes.map((route, index) => <button key={route.id} id={`route-${route.id}`} role="tab" aria-selected={active === route.id} aria-controls={`route-panel-${route.id}`} tabIndex={active === route.id ? 0 : -1} className={active === route.id ? "route-card is-active" : "route-card"} type="button" onClick={() => { setActive(route.id); track("tradfi_open", { route: route.id }); }}><span>0{index + 1}</span><b>{route.label}</b><dl id={`route-panel-${route.id}`}><div><dt>{copy.compare.bestFor}</dt><dd>{route.ownership}</dd></div><div><dt>{copy.nav.exchanges}</dt><dd>{route.venue}</dd></div><div><dt>SGT</dt><dd>{route.hours}</dd></div><div><dt>{copy.finder.conditions}</dt><dd>{route.settlement}</dd></div></dl></button>)}</div></section>;
}

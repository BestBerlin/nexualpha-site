import { useEffect, useRef, useState } from "react";
export function MarketRail({ copy, rail: marketRail }) {
  const [paused, setPaused] = useState(false);
  const [offset, setOffset] = useState(0);
  const rail = useRef(null);
  const drag = useRef(null);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => setOffset((current) => (current + 1) % marketRail.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused]);
  const startDrag = (event) => { if (!rail.current) return; setPaused(true); drag.current = { x: event.clientX, scroll: rail.current.scrollLeft }; rail.current.setPointerCapture?.(event.pointerId); };
  const moveDrag = (event) => { if (!drag.current || !rail.current) return; rail.current.scrollLeft = drag.current.scroll + drag.current.x - event.clientX; };
  const endDrag = () => { drag.current = null; setPaused(false); };
  return <section className="market-rail" aria-label={copy.rail.label} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
    <div className="market-rail__label"><span className={paused ? "signal-dot signal-dot--paused" : "signal-dot"} />{copy.rail.label}</div>
    <div ref={rail} className="market-rail__items" tabIndex="0" aria-label={copy.rail.label} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
      {[...marketRail.slice(offset), ...marketRail.slice(0, offset)].map((signal, index) => <article key={`${signal.type}-${signal.asset}`} className={index === 0 ? "is-current" : ""}><time>{signal.time}</time><span>{signal.type}</span><b>{signal.asset}</b><em>{signal.venue}</em><strong>{signal.value}</strong></article>)}
    </div>
  </section>;
}

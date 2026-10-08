// V6 signature: ONE continuous route rail. It starts at the hero finder's active intent, runs down the page gutter and
// docks (node + tick) at each act as the visitor scrolls; the closing CTA is the destination. Decorative only:
// aria-hidden, pointer-events none, lives in the inline-start gutter so it never touches content. Static without JS / reduced motion.
// It docks onto the acts by querying their existing root class names at runtime, so it needs no props from them.
import { useEffect, useRef, useState } from "react";

const ACTS = [".cl", ".vb", ".dir6"]; // compare lab, verify, directory; the destination is the closing CTA
const DEST = ".v6-close__form button, .v6-close a, .v6-close button";
const HEAD = "h2, h1";
const MIN_ROOM = 76; // content inset (px) needed before the docking ticks can live in the gutter

export function RouteRail() {
  const host = useRef(null);
  const [geo, setGeo] = useState(null);

  useEffect(() => {
    const el = host.current;
    const main = el?.parentElement;
    if (!el || !main) return undefined;
    let raf = 0;
    let fillRaf = 0;
    let startY = 0;
    let total = 0;
    const mq = window.matchMedia("(min-width: 64rem)");

    const measure = () => {
      const mr = main.getBoundingClientRect();
      const rtl = getComputedStyle(main).direction === "rtl";
      const wide = mq.matches;
      const inset = Math.max(24, (main.clientWidth - 1200) / 2); // content edge, from the inline-start page edge
      const room = wide && inset >= MIN_ROOM;
      const x = wide ? (room ? inset - 56 : 10) : 3;
      const yOf = (node, mid = true) => { const r = node.getBoundingClientRect(); return r.top - mr.top + (mid ? Math.min(r.height / 2, 28) : 0); };
      const list = [];
      // start: the active intent of the hero finder (the route the visitor chose)
      const intent = main.querySelector('.rf-intent[aria-checked="true"]') || main.querySelector(".rf-intent");
      let sy;
      let sx = inset;
      if (intent) {
        const r = intent.getBoundingClientRect();
        sy = r.top - mr.top + r.height / 2;
        sx = rtl ? mr.right - r.right : r.left - mr.left;
      } else { const rf = main.querySelector(".rf"); sy = rf ? rf.getBoundingClientRect().top - mr.top + 120 : 120; }
      startY = sy;
      ACTS.forEach((sel) => {
        const act = main.querySelector(sel);
        if (!act) return;
        const h = act.querySelector(HEAD);
        list.push({ y: h ? yOf(h) : yOf(act, false) + 48, kind: "act" });
      });
      const dest = main.querySelector(DEST);
      const close = main.querySelector(".v6-close");
      if (dest) list.push({ y: yOf(dest), kind: "dest" });
      else if (close) list.push({ y: yOf(close, false) + 64, kind: "dest" });
      const docks = list.filter((p) => Number.isFinite(p.y) && p.y > sy).sort((a, b) => a.y - b.y);
      total = docks.length ? docks[docks.length - 1].y - startY : 0;
      const len = room ? Math.max(0, inset - 16 - x) : 0;
      const next = { x: Math.round(x), start: Math.round(sy), total: Math.round(total), stub: Math.round(Math.max(0, sx - x - 4)), docks: docks.map((d) => ({ kind: d.kind, y: Math.round(d.y), len })) };
      setGeo((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    const fill = () => {
      fillRaf = 0;
      const mr = main.getBoundingClientRect();
      const f = Math.max(0, Math.min(total, window.innerHeight * 0.58 - mr.top - startY));
      el.style.setProperty("--rr-s", total ? (f / total).toFixed(4) : "0");
      el.querySelectorAll("[data-y]").forEach((n) => {
        const on = Number(n.dataset.y) - startY <= f + 0.5 && f > 0;
        const cur = n.dataset.on === "1";
        if (on !== cur) n.dataset.on = on ? "1" : "0";
      });
    };
    const queue = () => { if (!fillRaf) fillRaf = requestAnimationFrame(fill); };
    const remeasure = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { measure(); queue(); }); };
    const onClick = (e) => { if (e.target.closest?.(".rf-intent")) { remeasure(); setTimeout(remeasure, 480); } };

    el.__fill = queue;
    remeasure();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(remeasure) : null;
    ro?.observe(main);
    window.addEventListener("resize", remeasure);
    document.addEventListener("scroll", queue, { passive: true, capture: true }); // body may be the scroll container
    document.addEventListener("click", onClick);
    document.fonts?.ready?.then(remeasure);
    const late = setTimeout(remeasure, 1800);
    return () => {
      cancelAnimationFrame(raf); cancelAnimationFrame(fillRaf); clearTimeout(late); ro?.disconnect();
      window.removeEventListener("resize", remeasure);
      document.removeEventListener("scroll", queue, { capture: true });
      document.removeEventListener("click", onClick);
    };
  }, []);

  // Fill/dock state is written straight to the DOM on scroll (no React work per frame); re-assert it after each geometry change.
  useEffect(() => { if (geo) host.current?.__fill?.(); }, [geo]);

  const g = geo;
  return (
    <div className="rr" ref={host} aria-hidden="true" data-ready={g ? "" : undefined} style={g ? { "--rr-x": `${g.x}px`, "--rr-y": `${g.start}px`, "--rr-h": `${g.total}px` } : undefined}>
      {g && g.total > 0 && (
        <>
          <i className="rr__track" />
          <i className="rr__fill" />
          <i className="rr__stub" style={{ "--rr-len": `${g.stub}px` }} />
          <b className="rr__node rr__node--start" style={{ "--rr-ny": `${g.start}px` }} />
          {g.docks.map((d, i) => (
            <span key={i} className={`rr__dock rr__dock--${d.kind}`} data-y={d.y} data-on="0" style={{ "--rr-ny": `${d.y}px`, "--rr-len": `${d.len}px` }}>
              {d.len > 24 && <i className="rr__tick" />}
              <b className="rr__node" />
            </span>
          ))}
        </>
      )}
    </div>
  );
}

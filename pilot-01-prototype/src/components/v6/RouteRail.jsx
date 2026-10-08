// V6 signature: ONE continuous route rail. It starts at the hero finder's active intent, runs down the page gutter and
// docks (node + tick) at each act as the visitor scrolls; the closing CTA is the destination. Decorative only:
// aria-hidden, pointer-events none, lives in the inline-start gutter so it never touches content. Static without JS / reduced motion.
// It docks onto the acts by querying their existing root class names at runtime, so it needs no props from them.
import { useEffect, useRef, useState } from "react";
import { RAIL, pickLocale } from "../v3/LeanHeroCopyV6.js";

const ACTS = [".cl", ".vb", ".dir6"]; // compare lab, verify, directory; the destination is the closing CTA
const DEST = ".v6-close__route"; // the closing CTA's route stroke: the rail's destination dock joins its start
const HEAD = "h2, h1";
const MIN_ROOM = 76; // content inset (px) needed before the rail sits one gutter (24px) outside the container edge

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
      // on the grid: one 24px gutter outside the container edge (x = 96 at 1440); narrower viewports split the margin
      const x = room ? inset - 24 : Math.max(8, Math.round(inset / 2));
      const yOf = (node, mid = true) => { const r = node.getBoundingClientRect(); return r.top - mr.top + (mid ? Math.min(r.height / 2, 28) : 0); };
      const list = [];
      // start: the hero finder's active route. The route runs from the active intent down to "You" and the verify gate; the rail
      // is that same line carried out to the page gutter, so it begins at the You pill's centre line.
      const you = main.querySelector(".rf-you");
      const intent = main.querySelector('.rf-intent[aria-checked="true"]') || main.querySelector(".rf-intent");
      const heroWide = window.matchMedia("(min-width: 74rem)").matches;
      const edge = (r) => (rtl ? mr.right - r.right : r.left - mr.left); // inline-start distance of a rect
      let sy;
      let sx = inset;
      if (you) {
        const yr = you.getBoundingClientRect();
        sy = yr.top - mr.top + yr.height / 2;
        if (heroWide && intent) {
          const ir = intent.getBoundingClientRect();
          const first = main.querySelector(".rf-intent")?.getBoundingClientRect() || ir;
          // never cross the intent buttons: when the You line sits level with them, stop at the row's start edge
          sx = sy + mr.top > first.top - 6 && sy + mr.top < first.bottom + 6 ? edge(first) - 2 : edge(ir) + ir.width / 2 - 1;
        }
        else sx = edge(yr) - 2; // stacked hero: stop at the pill
      } else { const rf = main.querySelector(".rf"); sy = rf ? rf.getBoundingClientRect().top - mr.top + 120 : 120; }
      startY = sy;
      const names = pickLocale(RAIL, document.documentElement.lang);
      ACTS.forEach((sel, i) => {
        const act = main.querySelector(sel);
        if (!act) return;
        const h = act.querySelector(HEAD);
        list.push({ y: h ? yOf(h) : yOf(act, false) + 48, kind: "act", lab: names[i] });
      });
      const dest = main.querySelector(DEST);
      const close = main.querySelector(".v6-close");
      // the route stroke starts at its viewBox y=34 of 40, at the container edge: dock exactly there so the rail and the CTA route are one line
      if (dest) { const r = dest.getBoundingClientRect(); list.push({ y: r.top - mr.top + r.height * (34 / 40), kind: "dest", lab: names[3] }); }
      else if (close) list.push({ y: yOf(close, false) + 64, kind: "dest", lab: names[3] });
      const docks = list.filter((p) => Number.isFinite(p.y) && p.y > sy).sort((a, b) => a.y - b.y);
      total = docks.length ? docks[docks.length - 1].y - startY : 0;
      // act docks: a tick toward the act's heading (stops 8px short of the container edge); the destination tick reaches the edge
      const len = Math.max(0, inset - x - 8);
      const next = { x: Math.round(x), start: Math.round(sy), total: Math.round(total), stub: Math.round(Math.max(0, sx - x - 4)), lab: x >= 72 ? Math.round(x - 24) : 0, docks: docks.map((d) => ({ kind: d.kind, lab: d.lab, y: Math.round(d.y), len: d.kind === "dest" ? Math.max(0, inset - x) : len })) };
      setGeo((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    const fill = () => {
      fillRaf = 0;
      const mr = main.getBoundingClientRect();
      const atEnd = window.innerHeight - mr.bottom >= -4; // page bottom reached: the destination is always docked
      const f = atEnd ? total : Math.max(0, Math.min(total, window.innerHeight * 0.62 - mr.top - startY));
      el.style.setProperty("--rr-s", total ? (f / total).toFixed(4) : "0");
      // every reached dock keeps its accent node; only the current (last reached) dock's label is lit
      let last = null;
      el.querySelectorAll("[data-y]").forEach((n) => {
        const on = Number(n.dataset.y) - startY <= f + 0.5 && f > 0;
        const cur = n.dataset.on === "1";
        if (on !== cur) n.dataset.on = on ? "1" : "0";
        if (on) last = n;
      });
      el.querySelectorAll("[data-y]").forEach((n) => { if ((n === last) !== n.hasAttribute("data-cur")) n.toggleAttribute("data-cur", n === last); });
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
              {d.len > 4 && <i className="rr__tick" />}
              {g.lab > 0 && d.lab && <em className="rr__lab" style={{ "--rr-lab": `${g.lab}px` }}>{d.lab}</em>}
              <b className="rr__node" />
            </span>
          ))}
        </>
      )}
    </div>
  );
}

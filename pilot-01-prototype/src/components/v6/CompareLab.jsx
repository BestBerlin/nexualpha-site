// V6 Act 2: Compare Lab. Paired ledger of verified fee figures that morphs between two chosen venues.
// Only values present in EXCHANGE_FACTS are shown; anything else reads "Not yet checked". No ranking, no verdicts.
import { startTransition, useLayoutEffect, useEffect, useRef, useState } from "react";
import { RailDock, RailSeg } from "./RouteRail.jsx";
import { useScrollEdges } from "./useScrollEdges.js";
import { BrandMark } from "../brand/BrandMark";
import { getUi } from "../v3/CrossroadsCompare";
import { EXCHANGE_FACTS } from "../../data/exchange-facts.js";
import { directoryContext } from "../../data/directory-context.js";
import { localizedHref } from "../../data/locale-routing.js";
import { prefersReducedMotion } from "../../lib/v5/useInView.js";
import { labText } from "../v3/LeanHeroCopyLab.js";
import { comparePathFor } from "./compare-routes.js";
import { useSharedSelection } from "./home-selection.js";
import "../../styles/v6/compare-lab.css";

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const CHIPS = ["binance", "okx", "bybit", "bitget", "coinbase", "kraken", "hyperliquid", "uniswap", "jupiter", "dydx"];
const NAMES = { binance: "Binance", okx: "OKX", bybit: "Bybit", bitget: "Bitget", coinbase: "Coinbase", kraken: "Kraken", hyperliquid: "Hyperliquid", uniswap: "Uniswap", jupiter: "Jupiter", dydx: "dYdX" };
const TYPES = { cex: "CEX", dex: "DEX", "perp-dex": "Perp DEX" };
// Rows: [fact key, index]. Bars share one scale per product, taken from the whole fact set (never invented).
const ROWS = [["spot", 0], ["spot", 1], ["perp", 0], ["perp", 1]];
const PRODUCTS = ["spot", "perp"];

const fmtCache = new Map();
function fmt(n, locale, suffix = "%") {
  let f = fmtCache.get(locale);
  if (!f) { try { f = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 3 }); } catch { f = new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 3 }); } fmtCache.set(locale, f); }
  return f.format(n) + suffix;
}

// Figure: always the final, verified value. A change re-mounts the node and it rolls in (opacity + translate only);
// no intermediate numbers are ever rendered, so a verified fee can never flash a wrong value.
function Fig({ v, locale, suffix = "%", className = "cl-fig v6-num" }) {
  return <span key={v} className={`${className} cl-roll`}>{fmt(v, locale, suffix)}</span>;
}

// One side of a ledger row. Bars share one scale per product (the larger of the two venues), the lower figure carries the accent.
function Cell({ side, name, value, scale, other, locale, pending, text }) {
  const has = value != null;
  const low = has && other != null && value < other;
  return (
    <div className={`cl-cell cl-cell--${side}`}>
      <span className="cl-sr">{name}: </span>
      {text != null
        ? <span className="cl-text">{text}</span>
        : has ? <Fig v={value} locale={locale} /> : <><span className="cl-dash" aria-hidden="true">{"\u2013"}</span><span className="cl-sr">{pending}</span></>}
      {scale != null && (has
        ? <span className="cl-bar" aria-hidden="true" data-low={low ? "" : undefined}><i style={{ "--w": Math.min(value / scale, 1) }} /></span>
        : <span className="cl-bar cl-bar--nc" aria-hidden="true" />)}
    </div>
  );
}

const Arrow = () => <svg className="cl-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>;

export function keepInStrip(strip, el) {
  if (!strip || !el || strip.scrollWidth <= strip.clientWidth) return;
  const sr = strip.getBoundingClientRect(), er = el.getBoundingClientRect(), pad = 24;
  const d = er.left < sr.left + pad ? er.left - sr.left - pad : er.right > sr.right - pad ? er.right - sr.right + pad : 0;
  if (d) strip.scrollBy({ left: d, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

function Chips({ slot, cur, other, chips, label, nameOf, onPick, onDown, onKey, hintId, grabbed }) {
  const ref = useRef(null);
  useScrollEdges(ref);
  useEffect(() => { keepInStrip(ref.current, ref.current?.querySelector(`[data-venue="${cur}"]`)); }, [cur]);
  // One click, one handler: a pointer click on the label is handled here and the browser's synthetic click on the radio is
  // cancelled (it used to run the whole pick a second time). Keyboard (Space / arrows) still goes through the radio's onChange.
  const labelClick = (e, s) => {
    if (e.target instanceof HTMLInputElement) return;
    e.preventDefault();
    e.currentTarget.querySelector("input")?.focus({ preventScroll: true });
    onPick(slot, s);
  };
  return (
    <div className={`cl-pick cl-pick--${slot ? "b" : "a"}`} role="radiogroup" aria-label={label}>
      <span className="cl-pick__label v6-meta" aria-hidden="true">{label}</span>
      <div className="cl-chips" ref={ref}>
        {chips.map((s) => (
          <label key={s} className="cl-chip" data-venue={s} data-name={nameOf(s)} data-other={other === s || undefined} data-grabbed={grabbed === s || undefined} onPointerDown={(e) => onDown(e, s)} onDragStart={(e) => e.preventDefault()} onClick={(e) => labelClick(e, s)}>
            <input type="radio" name={`cl-slot-${slot}`} value={s} checked={cur === s} onChange={() => onPick(slot, s)} onKeyDown={(e) => onKey(e, s, slot)} aria-describedby={hintId} />
            <span translate="no"><BrandMark slug={s} compact /><em className="cl-chip__name">{nameOf(s)}</em></span>
          </label>
        ))}
      </div>
    </div>
  );
}

function normalize(selected) {
  const out = [];
  for (const s of Array.isArray(selected) ? selected : []) if (typeof s === "string" && /^[a-z0-9-]+$/.test(s) && !out.includes(s)) out.push(s);
  for (const d of ["binance", "okx", "bybit"]) if (out.length < 2 && !out.includes(d)) out.push(d);
  return out.slice(0, 2);
}

export function CompareLab({ locale = "en", venues = [], selected, onSelectionChange, feeCheck, store }) {
  const t = labText(locale);
  const ui = getUi(locale);
  const ctx = directoryContext({ locale });
  // The lab owns its pair: a pick re-renders the lab in the click frame (FLIP starts at once); the rest of the page
  // (verify, directory) follows in a transition.
  const shared = useSharedSelection(store, selected);
  const selKey = normalize(shared).join(",");
  const [pair, setPair] = useState(() => selKey.split(","));
  useEffect(() => { setPair((p) => (p.join(",") === selKey ? p : selKey.split(","))); }, [selKey]);
  const [a, b] = pair;
  // One shared logo rail: it fills the active slot (the highlighted identity); click / Space on an identity makes it active.
  const [slot, setSlot] = useState(1);
  const plate = useRef(null);
  const snapshot = useRef(null);
  const drag = useRef(null);
  const thud = useRef(null);
  const catalog = Object.fromEntries((Array.isArray(venues) ? venues : []).map((v) => [v.slug, v]));
  const nameOf = (s) => catalog[s]?.name || NAMES[s] || s;
  const typeOf = (s) => TYPES[EXCHANGE_FACTS[s]?.type] || catalog[s]?.category || "";
  const chips = [...CHIPS, ...[a, b].filter((s) => !CHIPS.includes(s))];
  const href = (slug) => localizedHref(`/compare/${slug}`, {
    locale, market: ctx.market, product: ctx.product,
    ...(ctx.scoped ? { utm_source: "regional_preview", utm_campaign: `${ctx.market.toLowerCase()}-research-preview` } : {}),
  });

  // FLIP: remember where each venue block sits, then glide it from there after the selection changes.
  const snap = () => {
    const m = {};
    plate.current?.querySelectorAll("[data-flip]").forEach((el) => { m[el.dataset.flip] = el.getBoundingClientRect(); });
    snapshot.current = m;
    if (plate.current) plate.current.dataset.live = "1";
  };
  useIso(() => {
    const m = snapshot.current;
    plate.current?.removeAttribute("data-moving");
    if (!m || !plate.current) return;
    snapshot.current = null;
    if (prefersReducedMotion()) return;
    if (thud.current != null) {
      const slot = plate.current.querySelector(`.cl-id[data-slot="${thud.current}"]`);
      thud.current = null;
      slot?.animate([{ scale: 0.94 }, { scale: 1.035, offset: 0.55 }, { scale: 1 }], { duration: 380, easing: EASE });
    }
    plate.current.querySelectorAll("[data-flip]").forEach((el) => {
      const p = m[el.dataset.flip], r = el.getBoundingClientRect();
      if (p) {
        const dx = p.left - r.left, dy = p.top - r.top;
        if (Math.abs(dx) + Math.abs(dy) > 1) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 420, easing: EASE });
      } else el.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: EASE });
    });
  }, [a, b]);

  // The click frame answers at once (the slots give way: an attribute change, no re-render); the new pair commits one frame
  // later, so that first frame is painted before the page re-styles. The FLIP then glides the venues into their slots.
  const commit = (na, nb) => {
    if (na === a && nb === b) return;
    snap();
    const el = plate.current;
    const go = () => { setPair([na, nb]); startTransition(() => { if (store) store.set([na, nb]); else onSelectionChange?.([na, nb]); }); };
    if (!el || prefersReducedMotion() || typeof requestAnimationFrame !== "function") { go(); return; }
    el.setAttribute("data-moving", "");
    requestAnimationFrame(() => setTimeout(go, 0));
  };
  const pick = (slot, slug) => {
    if (slot === 0) commit(slug, slug === b ? a : b);
    else commit(slug === a ? b : a, slug);
  };

  // Direct manipulation: press a venue chip (or a venue already in a slot) and drag it onto a slot. Pointer events only, so it
  // covers mouse, pen and touch (touch needs a short hold so the chip row can still scroll). The keyboard path is the chip
  // radio rows themselves. Near a slot the dragged label is pulled toward its centre (magnetic), the slot lights up, and the
  // drop lands with a small thud (plus a haptic tick where the device has one).
  const live = useRef({});
  live.current = { a, b, pick, nameOf };

  // Keyboard path for the same gesture: Enter picks a venue up (from a chip or a slot), the arrow keys choose the
  // target slot (it lights exactly like a pointer drag), Enter/Space drops it, Escape cancels.
  // Announcements are built from strings the lab already localizes (slot labels, venue names) plus key names.
  const kbd = { hint: `${t.first} / ${t.second}: Enter, \u2190 \u2192, Enter, Esc`, grabbed: "{n} \u2192 {s}", cancelled: "" };
  const [held, setHeld] = useState(null); // { slug, target }
  const [say, setSay] = useState("");
  const slotName = (n) => (n === 0 ? t.first : t.second);
  useEffect(() => {
    const plateEl = plate.current;
    if (!plateEl) return;
    plateEl.querySelectorAll(".cl-id[data-slot]").forEach((el) => {
      if (held && Number(el.dataset.slot) === held.target) el.setAttribute("data-hot", ""); else el.removeAttribute("data-hot");
    });
    if (held) plateEl.setAttribute("data-dragging", ""); else if (!drag.current) plateEl.removeAttribute("data-dragging");
  }, [held]);
  const onKey = (e, slug, fromSlot) => {
    const rtl = e.currentTarget.closest("[dir='rtl']") ? -1 : 1;
    if (!held) {
      if (e.key === " " && String(fromSlot).startsWith("id-")) { e.preventDefault(); setSlot(fromSlot === "id-a" ? 0 : 1); return; }
      if (e.key !== "Enter") return;
      e.preventDefault();
      const target = fromSlot === "id-a" ? 1 : fromSlot === "id-b" ? 0 : fromSlot;
      setHeld({ slug, target });
      setSay(kbd.grabbed.replace("{n}", nameOf(slug)).replace("{s}", slotName(target)));
      return;
    }
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      const dir = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : (e.key === "ArrowRight" ? 1 : -1) * rtl;
      const target = dir < 0 ? 0 : 1;
      setHeld({ ...held, target });
      setSay(kbd.grabbed.replace("{n}", nameOf(held.slug)).replace("{s}", slotName(target)));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const { slug: s, target } = held;
      setHeld(null);
      setSay("");
      thud.current = target;
      if ((target === 0 ? a : b) !== s) pick(target, s);
      else plate.current?.querySelector(`.cl-id[data-slot="${target}"]`)?.animate([{ scale: 1 }, { scale: 0.96 }, { scale: 1.03 }, { scale: 1 }], { duration: 320, easing: EASE });
    } else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      setHeld(null);
      setSay(status);
    }
  };
  const onDown = (e, slug) => {
    const plateEl = plate.current;
    if (!plateEl || (e.button != null && e.button > 0) || drag.current) return;
    const touch = e.pointerType === "touch";
    const st = { slug, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, active: false, hot: null, ghost: null, raf: 0, timer: 0, gx: e.clientX, gy: e.clientY };
    drag.current = st;
    const slotRects = () => [...plateEl.querySelectorAll(".cl-id[data-slot]")].map((el) => ({ el, slot: Number(el.dataset.slot), r: el.getBoundingClientRect() }));
    const frame = () => {
      st.raf = 0;
      if (!st.active) return;
      const slots = slotRects();
      let best = null;
      for (const s of slots) {
        const dx = Math.max(s.r.left - st.x, 0, st.x - s.r.right), dy = Math.max(s.r.top - st.y, 0, st.y - s.r.bottom);
        const d = Math.hypot(dx, dy);
        if (d < 96 && (!best || d < best.d)) best = { ...s, d };
      }
      const hot = best ? best.slot : null;
      if (hot !== st.hot) {
        st.hot = hot;
        slots.forEach((s) => { if (s.slot === hot) s.el.setAttribute("data-hot", ""); else s.el.removeAttribute("data-hot"); });
        if (hot != null) { try { navigator.vibrate?.(6); } catch { /* no haptics */ } }
      }
      // magnetic pull: inside the field the label drifts toward the slot centre instead of sticking to the cursor
      let tx = st.x, ty = st.y;
      if (best) { const cx = (best.r.left + best.r.right) / 2, cy = (best.r.top + best.r.bottom) / 2; const k = best.d === 0 ? 0.55 : 0.4; tx = st.x + (cx - st.x) * k; ty = st.y + (cy - st.y) * k; }
      st.gx += (tx - st.gx) * 0.38; st.gy += (ty - st.gy) * 0.38;
      if (st.ghost) st.ghost.style.transform = `translate3d(${st.gx}px, ${st.gy}px, 0) translate(-50%, -50%) scale(${best ? 1.06 : 1})`;
      if (Math.abs(tx - st.gx) + Math.abs(ty - st.gy) > 0.5) st.raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!st.raf) st.raf = requestAnimationFrame(frame); };
    const start = () => {
      st.active = true;
      const g = document.createElement("div");
      g.className = "cl-ghost"; g.setAttribute("aria-hidden", "true");
      g.textContent = live.current.nameOf(slug);
      g.style.transform = `translate3d(${st.x}px, ${st.y}px, 0) translate(-50%, -50%)`;
      plateEl.appendChild(g);
      st.ghost = g;
      plateEl.setAttribute("data-dragging", "");
      try { navigator.vibrate?.(8); } catch { /* no haptics */ }
      kick();
    };
    const blockTouch = (ev) => { if (st.active) ev.preventDefault(); };
    const move = (ev) => {
      st.x = ev.clientX; st.y = ev.clientY;
      const dist = Math.hypot(st.x - st.x0, st.y - st.y0);
      if (!st.active) {
        if (touch) { if (dist > 8) end(false); } else if (dist > 5) start();
        return;
      }
      kick();
    };
    const end = (drop) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("touchmove", blockTouch);
      clearTimeout(st.timer);
      if (st.raf) cancelAnimationFrame(st.raf);
      drag.current = null;
      if (!st.active) return;
      plateEl.removeAttribute("data-dragging");
      plateEl.querySelectorAll(".cl-id[data-hot]").forEach((el) => el.removeAttribute("data-hot"));
      // the drag was a gesture, not a click: swallow the click the browser is about to synthesise
      const swallow = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
      window.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 60);
      const g = st.ghost;
      const target = drop && st.hot != null ? slotRects().find((s) => s.slot === st.hot) : null;
      if (target && g) {
        const cx = (target.r.left + target.r.right) / 2, cy = (target.r.top + target.r.bottom) / 2;
        const anim = g.animate([{ transform: g.style.transform, opacity: 1 }, { transform: `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%) scale(0.7)`, opacity: 0 }], { duration: 200, easing: EASE, fill: "forwards" });
        anim.onfinish = () => g.remove();
        thud.current = target.slot;
        const { a: ca, b: cb, pick: cpick } = live.current;
        if ((target.slot === 0 ? ca : cb) !== slug) cpick(target.slot, slug);
        else target.el.animate([{ scale: 1 }, { scale: 0.96 }, { scale: 1.03 }, { scale: 1 }], { duration: 320, easing: EASE });
        try { navigator.vibrate?.([10, 30, 10]); } catch { /* no haptics */ }
      } else if (g) {
        const anim = g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" });
        anim.onfinish = () => g.remove();
      }
    };
    const up = () => end(true);
    const cancel = () => end(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    if (touch) {
      window.addEventListener("touchmove", blockTouch, { passive: false });
      st.timer = setTimeout(() => { if (drag.current === st) start(); }, 280);
    }
  };

  const fa = EXCHANGE_FACTS[a], fb = EXCHANGE_FACTS[b];
  const date = (f) => {
    if (f?.status !== "verified" || !f.verifiedOn) return null;
    return String(f.verifiedOn).slice(0, 10); // ISO, as on every inner page
  };
  const val = (f, g, i) => (f?.status === "verified" ? f[g]?.[i] ?? null : null);
  // Rows with no figure on either side disappear; whatever is missing is named once, in one quiet line.
  // Bar rows only where both venues carry the checked figure; a product checked on one side only collapses into one text row
  // (the other side reads "Not yet checked"); a product checked on neither side is named once in the pending line.
  const full = (g) => [0, 1].every((i) => val(fa, g, i) != null && val(fb, g, i) != null);
  const rows = ROWS.map(([g, i], n) => ({ g, i, n, va: val(fa, g, i), vb: val(fb, g, i) })).filter((r) => full(r.g));
  const half = PRODUCTS.map((g, gi) => ({ g, gi, pa: [val(fa, g, 0), val(fa, g, 1)], pb: [val(fb, g, 0), val(fb, g, 1)] }))
    .filter((p) => !full(p.g) && [...p.pa, ...p.pb].some((x) => x != null));
  const scaleOf = (g) => Math.max(0, ...rows.filter((r) => r.g === g).flatMap((r) => [r.va, r.vb]).filter((x) => x != null)) || null;
  const pairText = (p) => (p.every((x) => x != null) ? `${fmt(p[0], locale, "")} / ${fmt(p[1], locale)}` : p.some((x) => x != null) ? p.map((x) => (x == null ? "\u2013" : fmt(x, locale, ""))).join(" / ") + "%" : null);
  const pendingBits = [];
  PRODUCTS.forEach((g, gi) => { if ([val(fa, g, 0), val(fa, g, 1), val(fb, g, 0), val(fb, g, 1)].every((x) => x == null)) pendingBits.push(t.prod[gi]); });
  // The one bold type moment: the largest spot base-fee gap between the two venues, in percentage points.
  const spot = [0, 1].map((i) => [val(fa, "spot", i), val(fb, "spot", i)]);
  const haveGap = spot.every(([x, y]) => x != null && y != null);
  let gap = null;
  if (haveGap) {
    const d = spot.map(([x, y]) => Math.abs(x - y));
    const k = d[0] >= d[1] ? 0 : 1;
    const [x, y] = spot[k];
    gap = { v: Math.round(d[k] * 1e4) / 1e4, row: t.rows[k], low: x === y ? null : nameOf(x < y ? a : b) };
  }
  const metaHas = date(fa) || date(fb);
  const status = t.status.replace("{a}", nameOf(a)).replace("{b}", nameOf(b));
  const isCurrent = (pair) => (pair.left === a && pair.right === b) || (pair.left === b && pair.right === a);

  const popInner = (pair) => (
    <>
      <span className="cl-pop__marks"><BrandMark slug={pair.left} compact /><BrandMark slug={pair.right} compact /></span>
      <span className="cl-pop__text">
        <span className="cl-pop__names" translate="no" lang="en">{pair.leftName} <small>vs</small> {pair.rightName}</span>
        <span className="cl-pop__desc v6-small">{pair.desc}</span>
      </span>
      <Arrow />
    </>
  );

  const Identity = ({ slug, side }) => (
    <div className={`cl-id cl-id--${side}`} data-flip={slug} data-slot={side === "a" ? 0 : 1} data-active={slot === (side === "a" ? 0 : 1) || undefined} data-grabbed={held?.slug === slug || undefined} onPointerDown={(e) => onDown(e, slug)} onClick={() => setSlot(side === "a" ? 0 : 1)}
      tabIndex={0} role="button" aria-label={`${side === "a" ? t.first : t.second}: ${nameOf(slug)}`} aria-describedby="cl-kbd-hint" onKeyDown={(e) => onKey(e, slug, `id-${side}`)} onBlur={() => { if (held?.slug === slug) setHeld(null); }}>
      <BrandMark slug={slug} />
      <div className="cl-id__text">
        <span className="cl-id__name" translate="no">{nameOf(slug)}</span>
        <span className="cl-id__type v6-meta">{typeOf(slug)}</span>
      </div>
    </div>
  );

  return (
    <section className="cl v6-section" id="compare" aria-labelledby="cl-title">
      <RailSeg /><RailDock i={0} locale={locale} />
      <div className="v6-wrap">
        <header className="cl__head">
          <h2 className="v6-h1" id="cl-title">{ui.title}</h2>
          <p className="v6-lead">{ui.lead}</p>
        </header>

        <div className="cl__plate" ref={plate}>
          <div className="cl-grid cl-grid--ids">
            {Identity({ slug: a, side: "a" })}
            <div className="cl-mid">
              <button type="button" className="cl-swap" onClick={() => commit(b, a)} aria-label={t.swap} title={t.swap}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h13M12 3l4 4-4 4M17 13H4M8 9l-4 4 4 4" /></svg>
              </button>
            {/* Always mounted (no 80px jump): a venue without a checked spot fee shows a dash and "Not yet checked". */}
            <div className="cl-gap" role="group" aria-label={t.gap} data-none={gap ? undefined : ""}>
              <p className="cl-gap__fig" aria-hidden="true">
                {gap ? <Fig v={gap.v} locale={locale} suffix="" className="cl-gap__num v6-num" /> : <span className="cl-gap__num v6-num">{"\u2013"}</span>}
                <span className="cl-gap__unit v6-num">pp</span>
              </p>
              <p className="cl-gap__cap">
                <span className="cl-gap__label v6-small">{t.gap}</span>
                <span className="cl-gap__low v6-meta">{gap ? (gap.low ? t.lower.replace("{n}", gap.low).replace("{row}", gap.row) : t.same) : t.nc}</span>
              </p>
              <span className="cl-sr">{gap ? `${t.gap}: ${fmt(gap.v, locale, " pp")}. ${gap.low ? t.lower.replace("{n}", gap.low).replace("{row}", gap.row) : t.same}` : `${t.gap}: ${t.nc}`}</span>
            </div>
            </div>
            {Identity({ slug: b, side: "b" })}
          </div>

          <div className="cl-grid cl-grid--pick">
            <Chips slot={slot} cur={slot ? b : a} other={slot ? a : b} chips={chips} label={slot ? t.second : t.first} nameOf={nameOf} onPick={pick} onDown={onDown} onKey={onKey} hintId="cl-kbd-hint" grabbed={held?.slug} />
            <p className="cl-sr" id="cl-kbd-hint">{kbd.hint}</p>
          </div>


          <p className="cl-sr" role="status" aria-live="polite">{say || status}</p>

          <div className="cl-ledger" id="bleed-analyzer">
            {rows.map((r) => (
              <div className="cl-row" key={r.g + r.i} role="group" aria-label={t.rows[r.n]}>
                <Cell side="a" name={nameOf(a)} value={r.va} other={r.vb} scale={scaleOf(r.g)} locale={locale} pending={t.pending} />
                <span className="cl-label v6-small">{t.rows[r.n]}</span>
                <Cell side="b" name={nameOf(b)} value={r.vb} other={r.va} scale={scaleOf(r.g)} locale={locale} pending={t.pending} />
              </div>
            ))}
            {half.map((p) => (
              <div className="cl-row cl-row--half" key={p.g} role="group" aria-label={`${t.rows[p.gi * 2]} / ${t.rows[p.gi * 2 + 1]}`}>
                <Cell side="a" name={nameOf(a)} locale={locale} pending={t.pending} text={pairText(p.pa) ?? t.nc} />
                <span className="cl-label v6-small">{t.prod[p.gi]}</span>
                <Cell side="b" name={nameOf(b)} locale={locale} pending={t.pending} text={pairText(p.pb) ?? t.nc} />
              </div>
            ))}
            {metaHas && (
              <div className="cl-row cl-row--meta" role="group" aria-label={t.checked}>
                <Cell side="a" name={nameOf(a)} locale={locale} pending={t.pending} text={date(fa) ?? "\u2013"} />
                <span className="cl-label v6-small">{t.checked}</span>
                <Cell side="b" name={nameOf(b)} locale={locale} pending={t.pending} text={date(fb) ?? "\u2013"} />
              </div>
            )}
            {pendingBits.length > 0 && (
              <p className="cl-pending v6-small">
                <span className="cl-pending__dot" aria-hidden="true" />
                <span>{`${t.nc}: ${pendingBits.join(", ")}`}</span>
              </p>
            )}
          </div>

          <div className="cl-foot">
            <p className="cl-note v6-meta">{t.note}</p>
            <a
              className="btn btn-primary cl-cta"
              href={comparePathFor([a, b]).fallback ? localizedHref(comparePathFor([a, b]).path, { locale }) : href(`${a}-vs-${b}`)}
              data-growth-decision={`${a}-vs-${b}`}
              data-growth-placement="compare-lab-cta"
              data-growth-product="spot"
            >
              <span>{t.cta}</span><Arrow />
              <span className="cl-sr"> ({nameOf(a)} / {nameOf(b)})</span>
            </a>
          </div>

          <div className="cl-pop">
            <h3 className="v6-h3">{t.popular}</h3>
            <ul className="cl-pop__list">
              {ui.pairs.map((pair) => (
                <li key={pair.slug} className="cl-pop__item" data-active={isCurrent(pair) ? "1" : undefined}>
                  {isCurrent(pair) ? (
                    <div className="cl-pop__link" aria-current="true">{popInner(pair)}</div>
                  ) : (
                    <a
                      className="cl-pop__link"
                      href={href(pair.slug)}
                      data-decision-path={({ "binance-vs-okx": "cex", "bybit-vs-bitget": "derivatives", "uniswap-vs-jupiter": "onchain", "hyperliquid-vs-dydx": "perp" })[pair.slug]}
                      data-growth-decision={pair.slug}
                      data-growth-placement="crossroads-compare-card"
                      data-growth-product={pair.slug.includes("dydx") ? "perpetuals" : "spot"}
                    >{popInner(pair)}</a>
                  )}
                  <button type="button" className="cl-pop__load v6-small" aria-pressed={isCurrent(pair)} onClick={() => commit(pair.left, pair.right)}>{t.preview}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* The legacy fee calculator no longer renders in the plate (full tool: /rates). Its links stay in the DOM,
              hidden, so the page's link graph is unchanged. */}
          {feeCheck ? <div className="cl-fees-carrier" hidden>{feeCheck}</div> : null}
        </div>
      </div>
    </section>
  );
}

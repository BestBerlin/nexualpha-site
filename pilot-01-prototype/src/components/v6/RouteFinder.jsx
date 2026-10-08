// V6 Act 1: the route finder. Intent -> animated routes -> venue node -> the same registration card as before.
// The legacy hero (ticker, LeanHero, Brazil entry, section nav) is re-hosted: LeanHero renders through its `render`
// prop so copy, data, hrefs, codes and rel attributes stay exactly the ones the old hero produced.
import { Children, cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState } from "react";
import { EXCHANGE_FACTS } from "../../data/exchange-facts.js";
import { directoryLabel } from "./ClosingBand.jsx";
import { RailSeg } from "./RouteRail.jsx";
import { RF_T, RF_HUB, CLOSE_COPY, pickLocale } from "../v3/LeanHeroCopyV6.js";
import { venueDatabase } from "../../data/venue-database.js";

const NODE_SLUGS = ["binance", "okx", "bybit", "bitget", "kraken", "gate-io", "hyperliquid", "gmx"];
const INTENTS = ["spot", "perps", "fiat", "chain"];
// Which venues offer which product. Derived from catalog + verified facts, never ranked: order is the fixed catalog order.
const OFFERS = {
  spot: (v, f) => v.category === "CEX" || Number.isFinite(f?.spot?.[0]),
  perps: (v) => v.hasPerp,
  fiat: (v) => v.category === "CEX" && v.fiat >= 2,
  chain: (v) => v.category !== "CEX",
};

const copyFor = (locale) => pickLocale(RF_T, locale);

// "You" origin + official-domain verify gate captions (every locale; English fallback).
const hubFor = (locale) => pickLocale(RF_HUB, locale);

const ICONS = {
  spot: <path d="M4 8h13m0 0-3-3m3 3-3 3M20 16H7m0 0 3-3m-3 3 3 3" />,
  perps: <path d="M4 17l5-5 3 3 7-8M15 7h4v4" />,
  fiat: <><rect x="3.5" y="6" width="17" height="12" rx="2" /><path d="M3.5 10.5h17M7 15h3" /></>,
  chain: <><circle cx="6" cy="12" r="2.2" /><circle cx="18" cy="6.5" r="2.2" /><circle cx="18" cy="17.5" r="2.2" /><path d="M8 11l8-3.5M8 13l8 3.5" /></>,
};
const Icon = ({ name }) => (
  <svg className="rf-ico" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{ICONS[name]}</svg>
);

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isWide = () => typeof window !== "undefined" && window.matchMedia("(min-width: 74rem)").matches;
const isStrip = () => typeof window !== "undefined" && window.matchMedia("(max-width: 37.5rem)").matches;
// One official domain per venue, everywhere (gate, node chip, card, Verify): the recorded value, never shortened.
const bareDomain = (d) => String(d || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
// The chain(s) a decentralised venue runs on, from the venue record ("Decentralized (Arbitrum / Avalanche)").
const chainOf = (slug) => {
  const m = /^Decentralized \((.+)\)$/.exec(String(venueDatabase[slug]?.headquarters || ""));
  if (!m) return null;
  const parts = m[1].split(/\s*\/\s*/).filter(Boolean);
  const named = parts.filter((x) => !/^multi-chain$/i.test(x));
  return (named.length ? named : parts).slice(0, 2).join(" · ");
};
const NET = { en: "Network", "zh-Hans": "网络", "zh-Hant": "網路", ja: "ネットワーク", ko: "네트워크", tr: "Ağ", fr: "Réseau", de: "Netzwerk", es: "Red", "pt-BR": "Rede", ru: "Сеть", ar: "الشبكة", id: "Jaringan", vi: "Mạng lưới", it: "Rete" };
const pairText = (locale, p) => `${fmt(locale, p[0])}/${fmt(locale, p[1])}%`;
const verifiedPair = (f, key) => (f?.status === "verified" && Number.isFinite(f?.[key]?.[0]) && Number.isFinite(f?.[key]?.[1]) ? f[key] : null);
const RTL = new Set(["ar", "he", "fa", "ur"]);

// Fee figure: ALWAYS the final verified value, in the first frame and on the server. Change is signalled by opacity/translate only
// (a keyed remount replays the CSS entrance); no intermediate number is ever rendered.
const fmt = (locale, v) => new Intl.NumberFormat(locale === "ar" ? "en" : locale, { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(v);
function Fee({ value, tick, locale }) {
  const text = fmt(locale, value);
  return <span key={tick} className="rf-fee">{text}</span>;
}

// Numerals are isolated LTR (Arabic / RTL pages keep "0.10 / 0.10%" in reading order).
function FeePair({ pair, tick, none, locale }) {
  if (!pair) return <span className="rf-na">{none}</span>;
  return <bdi dir="ltr" className="rf-pair"><Fee value={pair[0]} tick={tick} locale={locale} /> / <Fee value={pair[1]} tick={tick} locale={locale} />%</bdi>;
}

// The gate's official domain is server-rendered and never cleared: a light sweep (mask) passes over text that is already there.
function Domain({ text }) {
  return <span key={text} className="rf-gate__dom" dir="ltr">{text}</span>;
}

// Japanese display titles: break only between phrases (script runs, a trailing particle may move to the next line), never inside
// a katakana or kanji word. Other locales render the string as is.
function phrased(title, locale) {
  const s = String(title || "");
  if (locale !== "ja") return s;
  const parts = s.match(/[゠-ヿー]+|[一-鿿々]+|[぀-ゟ]+|[^゠-ヿ一-鿿々぀-ゟ]+/g) || [s];
  return parts.flatMap((p, i) => (i ? [<wbr key={i} />, p] : [p]));
}

// ---------- route geometry ----------
// One pure function draws every route from a set of boxes (in the SVG's own px, logical LTR: RTL pages mirror the whole <g>).
// The server feeds it a nominal 1440 layout (the default intent's routes exist at first paint and without JS); the client feeds it
// measured boxes. Box: { l, r, t, b }.
const mid = (b) => (b.t + b.b) / 2;
const f1 = (n) => (Math.round(n * 10) / 10).toString();
function drawRoutes(B, lit, active, noCard) {
  const { mode, port } = B;
  const out = { base: [], chain: [], fan: [], dock: 0 };
  if (!port) return out;
  if (mode === "strip") {
    // phone: the active intent drops straight into the selected venue in the logo strip, and from there into the card
    const n = B.nodes[active];
    if (!n || !B.list) return out;
    const nx = Math.min(Math.max((n.l + n.r) / 2, B.list.l + 16), B.list.r - 16);
    const h = n.t - port.y;
    out.fan.push(`M${f1(port.x)} ${f1(port.y)}C${f1(port.x)} ${f1(port.y + h * 0.6)} ${f1(nx)} ${f1(n.t - h * 0.6)} ${f1(nx)} ${f1(n.t)}`);
    if (B.card && !noCard) out.fan.push(`M${f1(nx)} ${f1(n.b)}V${f1(B.card.t)}`);
    return out;
  }
  const { you, gate } = B;
  if (!you || !gate) return out;
  let origin;
  if (mode === "wide") {
    // intent port -> under the intent row -> up into "You" -> the verify gate; the gate is the one origin of every venue route
    const yb = port.y + 14;
    const yx = (you.l + you.r) / 2;
    out.chain.push(`M${f1(port.x)} ${f1(port.y)}V${f1(yb - 8)}Q${f1(port.x)} ${f1(yb)} ${f1(port.x + 8)} ${f1(yb)}H${f1(yx - 8)}Q${f1(yx)} ${f1(yb)} ${f1(yx)} ${f1(yb - 8)}V${f1(you.b)}`);
    out.chain.push(`M${f1(you.r)} ${f1(mid(you))}H${f1(gate.l)}`);
    origin = [gate.r, mid(gate)];
  } else {
    const ux = you.l + 18;
    out.chain.push(`M${f1(port.x)} ${f1(port.y)}C${f1(port.x)} ${f1(port.y + 28)} ${f1(ux)} ${f1(you.t - 28)} ${f1(ux)} ${f1(you.t)}`);
    out.chain.push(`M${f1(ux)} ${f1(you.b)}V${f1(mid(gate))}`);
    origin = [ux, mid(gate)];
  }
  const [ox, oy] = origin;
  for (const s of lit) {
    const n = B.nodes[s];
    if (!n) continue;
    const by = mid(n);
    let d;
    if (mode === "wide") {
      // a radial map: every qualifying venue sits on an arc around the gate and gets its own sweep out of it
      const dx = n.l - ox;
      d = `M${f1(ox)} ${f1(oy)}C${f1(ox + dx * 0.55)} ${f1(oy)} ${f1(ox + dx * 0.4)} ${f1(by)} ${f1(n.l)} ${f1(by)}`;
    } else {
      d = `M${f1(ox)} ${f1(oy)}V${f1(by + (by > oy ? -10 : 10))}Q${f1(ox)} ${f1(by)} ${f1(ox + 10)} ${f1(by)}H${f1(n.l)}`;
    }
    out.base.push({ slug: s, d });
    if (s !== active) continue;
    out.fan.push(d);
    if (mode === "wide" && B.card && !noCard) {
      // the card docks beside the chosen venue: its head slides level with the node (kept inside the map column)
      const c = B.card;
      const head = 32;
      const want = by - head - c.t;
      out.dock = Math.round(Math.max(0, Math.min(want, (B.floor ?? c.b) - c.b)));
      const y1 = c.t + out.dock + head;
      const m = (n.r + c.l) / 2;
      out.fan.push(`M${f1(n.r)} ${f1(by)}C${f1(m)} ${f1(by)} ${f1(m)} ${f1(y1)} ${f1(c.l)} ${f1(y1)}`);
    }
  }
  return out;
}

// Nominal wide layout (container px at 1440: 12 x 78 cols, 24 gutters). Mirrors the CSS below; the client replaces it once measured.
const ARC = [0, 2, 6, 13, 23, 36, 51, 68]; // node inset from the map column's end edge, top to bottom (px)
const NOM = { W: 1200, H: 823, top: 63, pitch: 80, nodeH: 72, nodeW: 184, colEnd: 894, tileW: 93, tileGap: 4, tileT: 399, tileB: 485, hubC: 435 };
function nominalBoxes(nodes, intentIndex) {
  const box = { mode: "wide", nodes: {} };
  box.port = { x: intentIndex * (NOM.tileW + NOM.tileGap) + NOM.tileW / 2, y: NOM.tileB };
  const c = NOM.hubC;
  box.you = { l: 408, r: 444, t: c - 18, b: c + 18 };
  box.gate = { l: 452, r: 488, t: c - 18, b: c + 18 };
  nodes.forEach((v, k) => {
    const r = NOM.colEnd - (ARC[k] ?? 0);
    const t = NOM.top + k * NOM.pitch;
    box.nodes[v.slug] = { l: r - NOM.nodeW, r, t, b: t + NOM.nodeH };
  });
  box.card = { l: 918, r: 1200, t: 32, b: 32 + 470 };
  box.floor = NOM.tileB;
  return box;
}

// Client: measure the real boxes relative to the SVG (which spans the container box of the hero), mirrored for RTL.
function useRoutes(svgRef, stageRef, refs, intent, litKey, slug, noCard, initial) {
  const [geo, setGeo] = useState(initial);
  const raf = useRef(0);
  const { intentRefs, nodeRefs, youRef, gateRef, cardRef, listRef } = refs;
  const measure = useCallback(() => {
    const svg = svgRef.current;
    const from = intentRefs.current[intent];
    if (!svg || !from) return;
    const sr = svg.getBoundingClientRect();
    if (!sr.width) return;
    const rtl = getComputedStyle(svg).direction === "rtl";
    const wide = isWide();
    const mode = wide ? "wide" : isStrip() ? "strip" : "stack";
    const bx = (el, dy = 0) => {
      const r = el.getBoundingClientRect();
      const l = rtl ? sr.right - r.right : r.left - sr.left;
      return { l, r: l + r.width, t: r.top - sr.top - dy, b: r.bottom - sr.top - dy };
    };
    const fr = bx(from);
    const B = { mode, nodes: {}, port: { x: (fr.l + fr.r) / 2, y: fr.b } };
    if (youRef.current?.offsetParent) B.you = bx(youRef.current);
    if (gateRef.current?.offsetParent) B.gate = bx(gateRef.current);
    Object.entries(nodeRefs.current).forEach(([s, el]) => { if (el?.offsetParent) B.nodes[s] = bx(el); });
    const card = cardRef.current;
    const stage = stageRef.current;
    if (card) {
      B.card = bx(card);
      if (mode === "wide" && stage && card.offsetParent === stage) {
        // the card's untranslated box (layout offsets ignore its dock translate, also mid-transition)
        const t = stage.getBoundingClientRect().top + stage.clientTop + card.offsetTop - sr.top;
        B.card = { ...B.card, t, b: t + card.offsetHeight };
      }
    }
    if (listRef.current) {
      const lr = bx(listRef.current);
      B.list = lr;
      B.floor = lr.b;
    }
    const slugs = litKey ? litKey.split(",") : [];
    const d = drawRoutes(B, slugs, slug, noCard);
    const next = { w: Math.round(sr.width), h: Math.round(sr.height), rtl, live: true, ...d };
    setGeo((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [svgRef, stageRef, intentRefs, nodeRefs, youRef, gateRef, cardRef, listRef, intent, litKey, slug, noCard]);
  useEffect(() => {
    const schedule = () => { cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(measure); };
    schedule();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
    if (ro) {
      if (svgRef.current) ro.observe(svgRef.current);
      if (cardRef.current) ro.observe(cardRef.current);
    }
    window.addEventListener("resize", schedule);
    document.fonts?.ready?.then(schedule);
    const strip = listRef.current;
    strip?.addEventListener("scroll", schedule, { passive: true });
    return () => { cancelAnimationFrame(raf.current); ro?.disconnect(); window.removeEventListener("resize", schedule); strip?.removeEventListener("scroll", schedule); };
  }, [measure, svgRef, cardRef, listRef]);
  return geo;
}

const withData = (intent, f) => ((intent === "spot" || intent === "perps")
  ? Boolean(verifiedPair(f, intent === "perps" ? "perp" : "spot"))
  : true);

// Verified facts for one venue. Spot and perp show the checked figures; when neither is checked the readout says so once.
// Only the on-ramp line may add its own "Not yet checked", because nothing for it has been checked.
function Facts({ className, facts, intent, t, tick, locale, chain }) {
  const sp = verifiedPair(facts, "spot");
  const pp = verifiedPair(facts, "perp");
  // On-chain: the venue's network is a recorded fact, shown first (the node above it shows the same value)
  const net = intent === "chain" && chain ? <div data-on="true" className="rf-facts__net"><dt>{pickLocale(NET, locale)}</dt><dd><span lang="en" translate="no">{chain}</span></dd></div> : null;
  if (!sp && !pp) {
    return (
      <dl className={className}>
        {net}
        <div data-on={!net} className="rf-facts__intent"><dt>{t.spot} · {t.perp} {t.mt}</dt><dd><span className="rf-na">{t.none}</span></dd></div>
      </dl>
    );
  }
  return (
    <dl className={className}>
      {net}
      <div data-on={intent === "spot"}><dt>{t.spot} {t.mt}</dt><dd><FeePair pair={sp} tick={tick} none={t.none} locale={locale} /></dd></div>
      <div data-on={intent === "perps" || intent === "chain"}><dt>{t.perp} {t.mt}</dt><dd><FeePair pair={pp} tick={tick} none={t.none} locale={locale} /></dd></div>
      {intent === "fiat" && <div data-on="true" className="rf-facts__intent"><dt>{t.i[intent][0]}</dt><dd><span className="rf-na">{t.none}</span></dd></div>}
    </dl>
  );
}

function Finder({ kit, tail, venues }) {
  const { locale } = kit;
  const t = copyFor(locale);
  const [youLabel, gateLabel] = hubFor(locale);
  const uid = useId();
  const partners = NODE_SLUGS.map((s) => kit.venue(s)).filter(Boolean);
  // On-chain gets its own node set from the venue catalog (wallet venues such as Uniswap / Jupiter, plus the perp DEXs).
  // Venues with an account route come first (grouped, not ranked), each group in catalog order. Wallet venues have no account
  // route: picking one previews it, the card stays on a venue with a route.
  const cat = (Array.isArray(venues) ? venues : []).filter((v) => v?.slug && v.category !== "CEX");
  const ix = (v) => { const i = cat.findIndex((c) => c.slug === v.slug); return i < 0 ? 99 : i; };
  const chainNodes = [...new Set([...partners.filter((v) => v.category !== "CEX").map((v) => v.slug), ...cat.filter((v) => v.category === "DEX").slice(0, 4).map((v) => v.slug), ...cat.filter((v) => v.category !== "DEX").map((v) => v.slug)])]
    .slice(0, 8).map((s) => partners.find((v) => v.slug === s) || { ...cat.find((v) => v.slug === s), wallet: true })
    .sort((a, b) => (a.wallet ? 1 : 0) - (b.wallet ? 1 : 0) || ix(a) - ix(b));
  const setFor = (k) => (k === "chain" && cat.length ? chainNodes : partners);
  const offered = (intent) => setFor(intent).filter((v) => OFFERS[intent](v, EXCHANGE_FACTS[v.slug])).map((v) => v.slug);
  // Default node = first venue that actually has data for the intent (display order, never a ranking).
  const pickDefault = (intent) => { const l = offered(intent).filter((s) => partners.some((v) => v.slug === s)); return l.find((s) => withData(intent, EXCHANGE_FACTS[s])) || l[0] || partners[0]?.slug; };
  const [intent, setIntent] = useState("spot");
  const [slug, setSlug] = useState(() => pickDefault("spot"));
  const [pin, setPin] = useState(null); // a wallet venue being previewed (no account route, so no card)
  const [swap, setSwap] = useState(false); // the card head animates only on a user change, never on first paint
  const [reroute, setReroute] = useState(false); // a venue change redraws only gate -> node -> card (320ms)
  const nodes = setFor(intent);
  const [hot, setHot] = useState(null);
  const [tick, setTick] = useState(0);
  const stageRef = useRef(null);
  const svgRef = useRef(null);
  const intentRefs = useRef({});
  const nodeRefs = useRef({});
  const youRef = useRef(null);
  const gateRef = useRef(null);
  const cardRef = useRef(null);
  const listRef = useRef(null);
  const labelRef = useRef(null);
  const kbd = useRef(false);
  const lit = offered(intent);
  const litKey = lit.join(",");
  const activeSlug = pin || slug;
  // server / first paint: the default intent's routes, drawn on the nominal wide layout (refined as soon as the client measures)
  const [initial] = useState(() => {
    const d = drawRoutes(nominalBoxes(nodes, INTENTS.indexOf(intent)), lit, activeSlug, false);
    return { w: NOM.W, h: NOM.H, rtl: RTL.has(String(locale).split("-")[0]), live: false, ...d };
  });
  const geo = useRoutes(svgRef, stageRef, { intentRefs, nodeRefs, youRef, gateRef, cardRef, listRef }, intent, litKey, activeSlug, Boolean(pin), initial);

  // Pointer light on the map grid + magnetic primary CTAs (progressive: static without JS or with reduced motion).
  useEffect(() => {
    const el = stageRef.current;
    if (!el || reduced()) return undefined;
    let raf = 0;
    const R = 96;
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
    const CTA = ".rf-btn--primary, .registration-card__primary-btn";
    const move = (e) => {
      const { clientX: x, clientY: y, pointerType } = e;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${x - r.left}px`);
        el.style.setProperty("--my", `${y - r.top}px`);
        if (pointerType === "touch") return;
        el.querySelectorAll(CTA).forEach((b) => {
          const q = b.getBoundingClientRect();
          const near = x > q.left - R && x < q.right + R && y > q.top - R && y < q.bottom + R;
          b.style.setProperty("--tx", near ? `${clamp((x - (q.left + q.width / 2)) * 0.16, -8, 8).toFixed(1)}px` : "0px");
          b.style.setProperty("--ty", near ? `${clamp((y - (q.top + q.height / 2)) * 0.22, -6, 6).toFixed(1)}px` : "0px");
        });
      });
    };
    const leave = () => el.querySelectorAll(CTA).forEach((b) => { b.style.setProperty("--tx", "0px"); b.style.setProperty("--ty", "0px"); });
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => { cancelAnimationFrame(raf); el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, []);

  const pickIntent = (next) => {
    setIntent(next);
    setSlug(pickDefault(next));
    setPin(null);
    setSwap(true);
    setReroute(false);
    setHot(null);
    setTick((n) => n + 1);
    // Stacked layout: the venues sit below the intents. Bring them into view on a deliberate tap (not keyboard arrow roving).
    if (!isWide() && !kbd.current) requestAnimationFrame(() => requestAnimationFrame(() => {
      const lab = labelRef.current;
      const el = listRef.current;
      if (!lab || !el) return;
      const r = lab.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.62) lab.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" });
      if (isStrip()) { const n = nodeRefs.current[pickDefault(next)]; if (n) el.scrollTo({ left: n.offsetLeft - el.offsetLeft - 24, behavior: reduced() ? "auto" : "smooth" }); }
    }));
  };
  const onRadioKey = (e) => {
    const i = INTENTS.indexOf(intent);
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    let n = null;
    if (e.key === "ArrowDown" || e.key === (rtl ? "ArrowLeft" : "ArrowRight")) n = INTENTS[(i + 1) % 4];
    if (e.key === "ArrowUp" || e.key === (rtl ? "ArrowRight" : "ArrowLeft")) n = INTENTS[(i + 3) % 4];
    if (e.key === "Home") n = INTENTS[0];
    if (e.key === "End") n = INTENTS[3];
    if (!n) return;
    e.preventDefault();
    kbd.current = true;
    pickIntent(n);
    kbd.current = false;
    intentRefs.current[n]?.focus();
  };
  const pickNode = (s) => {
    if (!lit.includes(s)) return;
    const wallet = !partners.some((v) => v.slug === s);
    setPin(wallet ? s : null);
    setReroute(true);
    if (!wallet) { setSlug(s); setSwap(true); }
    setTick((n) => n + 1);
    // Stacked list: the card opens inline under the node; keep the tapped node in view as the old card collapses. (The phone strip keeps the card below it.)
    if (!isWide() && !isStrip()) requestAnimationFrame(() => requestAnimationFrame(() => nodeRefs.current[s]?.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" })));
  };
  // Hover / focus never changes the subject: the readout and the card stay on the chosen venue. The hovered route lights up to
  // its node, and the node itself carries its own verified fee (or official domain).
  const hover = (s, on) => { if (on) setHot(s); };
  const sel = partners.find((v) => v.slug === slug) || partners[0];
  const peek = nodes.find((v) => v.slug === pin) || sel;
  const facts = EXCHANGE_FACTS[sel.slug];
  const peekFacts = EXCHANGE_FACTS[peek.slug];
  const BrandMark = kit.BrandMark;
  const nodeKey = intent === "perps" ? "perp" : "spot";
  const panelId = `${uid}-panel`;
  const selIdx = Math.max(0, nodes.findIndex((v) => v.slug === sel.slug));
  const title = String(kit.title);
  const g = geo;

  return (
    <>
    <div className="rf-grid" ref={stageRef} data-intent={intent}>
      <div className="rf-copy">
        <h1 className={`rf-title${/\s/.test(title.trim()) && Math.max(...title.split(/\s+/).map((w) => w.length)) > 11 ? " rf-title--long" : ""}`}>{phrased(title, locale)}</h1>
        <p className="rf-lede">{kit.lede}</p>
      </div>

      <div className="rf-pick">
      <div className="rf-intents">
        <p className="rf-label" id={`${uid}-g`}>{t.group}</p>
        <div role="radiogroup" aria-labelledby={`${uid}-g`} className="rf-radios" onKeyDown={onRadioKey}>
          {INTENTS.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={intent === k}
              tabIndex={intent === k ? 0 : -1}
              ref={(el) => { intentRefs.current[k] = el; }}
              className="rf-intent"
              onClick={() => pickIntent(k)}
            >
              <Icon name={k} />
              <span className="rf-intent__text"><b>{t.i[k][0]}</b><small>{t.i[k][1]}</small></span>
              <i className="rf-port" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className="rf-readout" aria-hidden="true">
        <p className="rf-readout__who">
          <b key={peek.slug} translate="no" lang="en">{peek.name}</b>
          {peekFacts?.verifiedOn && <small>{t.chk} <bdi dir="ltr">{peekFacts.verifiedOn}</bdi></small>}
        </p>
        <Facts className="rf-readout__facts" facts={peekFacts} intent={intent} t={t} locale={locale} tick={`${peek.slug}-${intent}`} chain={chainOf(peek.slug)} />
      </div>
      </div>

      <div className="rf-hub" aria-hidden="true">
        <span className="rf-you" ref={youRef}>{youLabel}</span>
        <span className="rf-gate" ref={gateRef} title={gateLabel}>
          <svg className="rf-gate__ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false">
            <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
            <path key={peek.slug} className="rf-gate__tick" pathLength="1" d="M8.5 12l2.5 2.5 4.5-5" />
          </svg>
          <Domain text={bareDomain(peek.officialDomain)} />
        </span>
        <span className="rf-gate__cap">{gateLabel}</span>
      </div>

      <div className="rf-nodes">
        <p className="rf-label" id={`${uid}-n`} ref={labelRef}>
          {t.venues} <span className="rf-count" dir="ltr">{lit.length}/{nodes.length}</span>
        </p>
        <ul className="rf-list" aria-labelledby={`${uid}-n`} ref={listRef}>
          {nodes.map((v, i) => {
            const on = lit.includes(v.slug);
            const active = v.slug === activeSlug;
            const pair = intent === "chain" ? null : verifiedPair(EXCHANGE_FACTS[v.slug], nodeKey);
            const chain = intent === "chain" ? chainOf(v.slug) : null;
            // hover / focus chip: the recorded domain plus the checked fee for this intent (final values only)
            const tip = verifiedPair(EXCHANGE_FACTS[v.slug], intent === "chain" || intent === "perps" ? "perp" : "spot");
            return (
              <li key={v.slug} style={{ "--arc": `${ARC[i] ?? 0}px` }}>
                <button
                  type="button"
                  ref={(el) => { nodeRefs.current[v.slug] = el; }}
                  className="rf-node"
                  style={{ "--ord": 10 + i * 2, "--k": Math.max(0, lit.indexOf(v.slug)) }}
                  data-on={on}
                  data-active={active}
                  data-hot={hot === v.slug ? "" : undefined}
                  aria-pressed={active}
                  aria-disabled={!on}
                  aria-controls={panelId}
                  tabIndex={on ? 0 : -1}
                  title={on ? undefined : t.off}
                  onClick={() => pickNode(v.slug)}
                  onPointerEnter={(e) => { if (e.pointerType !== "touch") hover(v.slug, on); }}
                  onPointerLeave={() => setHot(null)}
                  onFocus={() => hover(v.slug, on)}
                  onBlur={() => setHot(null)}
                >
                  <i className="rf-port" aria-hidden="true" />
                  <BrandMark slug={v.slug} compact priority />
                  <b className="rf-node__name" translate="no" lang="en">{v.name}</b>
                  <span className="rf-node__fee">
                    {on
                      ? (chain
                        ? <span className="rf-node__net" lang="en" translate="no">{chain}</span>
                        : pair
                        ? <><span className="rf-sr">{nodeKey === "perp" ? t.perp : t.spot} </span><bdi dir="ltr">{fmt(locale, pair[0])}/{fmt(locale, pair[1])}%</bdi></>
                        : <><span className="rf-node__dom" dir="ltr" translate="no">{bareDomain(v.officialDomain)}</span><span className="rf-sr"> {t.none}</span></>)
                      : <span className="rf-sr">{t.off}</span>}
                  </span>
                  {on && (
                    <span className="rf-chip" aria-hidden="true" dir="ltr">
                      <span translate="no">{bareDomain(v.officialDomain)}</span>
                      {tip && <bdi>{pairText(locale, tip)}</bdi>}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rf-card" id={panelId} ref={cardRef} role="region" aria-label={sel.name} style={{ "--ord": 11 + selIdx * 2, "--dock": `${g.dock || 0}px` }} data-swap={swap || undefined}>
        <div className="rf-card__head">
          <span className="rf-card__who" key={sel.slug}><BrandMark slug={sel.slug} priority /><b translate="no" lang="en">{sel.name}</b><small translate="no" lang="en">{sel.category}</small></span>
          <Facts className="rf-facts" facts={facts} intent={intent} t={t} locale={locale} tick={tick} chain={chainOf(sel.slug)} />
          {facts?.verifiedOn && <p className="rf-card__chk">{t.chk} <bdi dir="ltr">{facts.verifiedOn}</bdi></p>}
        </div>
        {kit.card(sel.slug)}
      </div>

      {/* one ghost button + one text link (the card holds the one filled CTA). The directory jump stays in the DOM in its
          original order and shows on keyboard focus, like a skip link (the rail and the section nav also lead there). */}
      <div className="rf-actions">
        <button type="button" className="rf-btn rf-btn--ghost rf-btn--wizard" onClick={kit.openWizard}>{locale === "en" ? "Find my match in 30 seconds" : kit.wizardLabel}</button>
        <a className="rf-link rf-link--skip" href={kit.exploreHref}>{directoryLabel(locale)}</a>
        <a className="rf-link rf-link--compare" href={kit.compareHref}>{(CLOSE_COPY[locale] || CLOSE_COPY.en).cmp}<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M3 8h9M8.5 4l4 4-4 4" /></svg></a>
      </div>

      {/* The "On this page" nav stays in the DOM (keyboard / screen readers; visible on focus). Its acts are named on the
          page rail. Telegram, directory facets and the Brazil entry moved to the closing index. */}
      <div className="rf-skip">{tail}</div>

      <svg className="rf-svg" ref={svgRef} data-live={g.live ? "" : undefined} viewBox={`0 0 ${g.w || 1} ${g.h || 1}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <g transform={g.rtl ? `matrix(-1 0 0 1 ${g.w} 0)` : undefined}>
          {g.chain.map((d, i) => <path key={`s${i}`} className="rf-route__line rf-route__line--chain" d={d} />)}
          {g.base.map((r, i) => (
            <g key={`${intent}-${r.slug}`} className={`rf-route${hot === r.slug && r.slug !== activeSlug ? " is-hot" : ""}`} style={{ "--i": i }}>
              <path className="rf-route__line" d={r.d} pathLength="1" />
            </g>
          ))}
          {/* intent -> You -> gate: drawn (staged) on an intent change only; a venue change redraws gate -> node -> card in 320ms */}
          {g.fan.length > 0 && g.chain.length > 0 && (
            <g key={`${intent}-on`} className="rf-route is-on is-chain">
              {g.chain.map((d, i) => <path key={i} className="rf-route__line rf-route__line--on" style={{ "--seg": i }} d={d} pathLength="1" />)}
            </g>
          )}
          {g.fan.length > 0 && (
            <g key={`${intent}-${activeSlug}-on`} className={`rf-route is-on is-fan${reroute ? " is-re" : ""}`} style={{ "--base": g.chain.length }}>
              {g.fan.map((d, i) => <path key={i} className="rf-route__line rf-route__line--on" style={{ "--seg": i }} d={d} pathLength="1" />)}
              <path className="rf-route__pulse" d={g.fan[0]} pathLength="1" />
            </g>
          )}
        </g>
      </svg>
      <span className="rf-sr" role="status">{t.i[intent][0]}: {lit.length}/{nodes.length}</span>
    </div>
    {kit.wizardModal}
    </>
  );
}

const nameOf = (el) => el?.type?.displayName || el?.type?.name || "";

export function RouteFinder({ legacy, venues }) {
  // Re-host the legacy hero parts (ticker, hero, Brazil entry, section nav) inside the V6 layout. The Brazil entry and the section
  // nav move into the finder's quiet foot row; their hrefs keep the same DOM order (they followed the hero's links before too).
  const top = isValidElement(legacy) ? Children.toArray(legacy.props.children) : [];
  const boundary = top.find((el) => isValidElement(el) && Children.toArray(el.props?.children).some((c) => nameOf(c).includes("LeanHero")));
  if (!boundary) return <>{legacy}</>;
  const nav = top.find((el) => el !== boundary);
  const kids = Children.toArray(boundary.props.children);
  const brazil = kids.find((c) => nameOf(c).includes("Brazil"));
  const tail = nav;
  const parts = kids.filter((c) => c !== brazil).map((c) => (nameOf(c).includes("LeanHero")
    ? cloneElement(c, { render: (kit) => <Finder kit={kit} tail={tail} venues={venues} /> })
    : c));
  return (
    <section className="rf" aria-label="NexuAlpha">
      {cloneElement(boundary, {}, ...parts)}
      <RailSeg start />
    </section>
  );
}

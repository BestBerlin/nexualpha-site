// Home v7: one number as the signature visual, a dark scroll story, and one row per exchange that goes straight to the
// official sign-up. Reads fees from exchange-facts.js and the registration link/code from publicCtaForVenue (same source as
// the directory), so invite codes, hrefs and rel attributes are never typed here.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { feeFact, FACTS_AS_OF } from "../../data/exchange-facts.js";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { localizedHref } from "../../data/locale-routing.js";
import { HOME_REBATE_MAX_PCT, HOME_REBATE_SHARE, HOME_PARTNERS, HOME_PUSH, HOME_AUTO_SETTLE } from "../../data/home-rebate-tiers.js";
import { brandsBySlug } from "../../content/brand-manifest";
import { readIntelFeed } from "../../data/announcement-intel.js";
import { h7Copy, h7IsFallback } from "./home7-copy.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import "../../styles/v7/home7.css";

const nameOf = (slug) => brandsBySlug[slug]?.name || slug;
const CHIPS = [10000, 50000, 100000, 500000];
// Volume slider: log scale $10K..$5M, snapped to readable steps.
const VMIN = 1e4, VMAX = 5e6;
const toVol = (p) => { const v = VMIN * Math.pow(VMAX / VMIN, p / 1000); const step = v < 1e5 ? 1e3 : v < 1e6 ? 1e4 : 1e5; return Math.round(v / step) * step; };
const toPos = (v) => Math.round(1000 * Math.log(Math.min(Math.max(v, VMIN), VMAX) / VMIN) / Math.log(VMAX / VMIN));
const usd = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Owner (2026-10-10): show perpetual-contract fees by default; spot stays one tap away.
function useVenues(locale, product) {
  return useMemo(() => HOME_PARTNERS.map((slug) => {
    const f = feeFact(slug, product);
    const cta = publicCtaForVenue(slug, locale);
    const checked = f.state === "checked" && Number.isFinite(f.maker) && Number.isFinite(f.taker);
    return {
      slug, name: nameOf(slug), maker: checked ? f.maker : null, taker: checked ? f.taker : null,
      share: HOME_REBATE_SHARE[slug], code: cta.hasReferral ? cta.inviteCode : null,
      url: cta.registrationUrl, open: Boolean(cta.hasReferral && /^https:\/\//i.test(cta.registrationUrl || "")),
    };
  }), [locale, product]);
}

// Ledger figures roll to their new value (eased); reduced motion and SSR render the final value.
function Roll({ value, prefix = "", fmt = usd, nudge }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (value == null || from.current == null || reduced()) { from.current = value; setShown(value); return undefined; }
    const a = from.current, b = value, t0 = performance.now(); let raf = 0;
    const f = (n) => { const k = Math.min(1, (n - t0) / 700); const v = a + (b - a) * (1 - Math.pow(1 - k, 4)); setShown(v); if (k < 1) raf = requestAnimationFrame(f); else from.current = b; };
    raf = requestAnimationFrame(f);
    return () => { cancelAnimationFrame(raf); from.current = b; };
  }, [value]);
  // a spring nudge plays when `nudge` changes (e.g. another exchange picked), not on every slider step
  return <span className={nudge == null ? undefined : "h7-roll"} key={nudge ?? "v"}>{shown == null ? "–" : `${prefix}${fmt(shown)}`}</span>;
}

function CopyCode({ code, t }) {
  const [done, setDone] = useState(false);
  const copy = () => {
    const ok = () => { setDone(true); setTimeout(() => setDone(false), 2000); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(code).then(ok, () => {}); else ok();
  };
  return <button type="button" className={`h7-cc${done ? " done" : ""}`} onClick={copy} aria-live="polite">{done ? t.copied : t.copy}</button>;
}

// Phones: once the hero has scrolled away, a dock keeps the exchange pick and its sign-up link one tap away.
function MobileDock({ heroRef, sel, rebated, setPick, t, locale }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const h = heroRef.current; if (!h || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => setOn(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(h); return () => io.disconnect();
  }, [heroRef]);
  if (!sel?.open) return null;
  return (
    <div className={`h7-dock${on ? " on" : ""}`} {...(on ? {} : { inert: "", "aria-hidden": "true" })}>
      <label className="h7-dock-pick"><span className="h7-sr">{t.lgPick}</span>
        <select value={sel.slug} onChange={(e) => setPick(e.target.value)}>{rebated.map((r) => <option key={r.slug} value={r.slug}>{r.name} · {Math.round(r.share * 100)}%</option>)}</select>
      </label>
      <Cta v={sel} locale={locale} className={`h7-btn h7-dock-go h7-go--${sel.slug}`} placement="home-v7-dock"><span>{t.dockGo}</span><small className="h7-go-disclosure">{t.lgAd}</small></Cta>
    </div>
  );
}

function Cta({ v, locale, children, className, placement }) {
  if (v.open) {
    return <a className={className} href={v.url} target="_blank" rel="sponsored noopener noreferrer" data-cta-kind="registration" data-cta-platform={v.slug} data-cta-placement={placement} data-cta-code={v.code || undefined}>{children}</a>;
  }
  return <a className={className} href={localizedHref(`/exchanges/${v.slug}#registration-path`, { locale })} data-cta-placement={`${placement}-eligibility`}>{children}</a>;
}


const INTEL_URL = "/intel/official-announcements.json";
const INTEL_SHOW = ["listing", "event", "delisting", "news", "product", "security"];
function useIntel(venues) {
  const [feed, setFeed] = useState(null);
  const slugs = venues.map((v) => v.slug).join(",");
  useEffect(() => {
    let alive = true;
    fetch(INTEL_URL, { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return;
        const items = j ? readIntelFeed(j, { venues: slugs.split(",") }).filter((i) => INTEL_SHOW.includes(i.category)) : [];
        // null = still loading, false = unavailable (fail closed: no invented notices).
        setFeed(items.length ? { items: items.slice(0, 40), generatedAt: j.generatedAt } : false);
      })
      .catch(() => { if (alive) setFeed(false); });
    return () => { alive = false; };
  }, [slugs]);
  return feed;
}

const PERP_RE = /(futures|perp|contract|永续|合约)/i;
const pct = (n) => `${n.toFixed(n < 0.1 ? 3 : 2).replace(/0+$/, "").replace(/\.$/, "")}%`;
// Base fees for the market an announcement concerns, with the disclosed rebate applied. Unchecked fees stay null.
function compareRows(venues, perp) {
  return venues.map((v) => {
    const f = feeFact(v.slug, perp ? "perp" : "spot");
    const ok = f.state === "checked" && Number.isFinite(f.maker) && Number.isFinite(f.taker);
    const k = 1 - (v.share || 0);
    return { ...v, maker: ok ? f.maker : null, taker: ok ? f.taker : null, mk: ok ? f.maker * k : null, tk: ok ? f.taker * k : null };
  });
}

function IntelSheet({ item, venues, t, locale, onClose }) {
  const ref = useRef(null);
  const perp = PERP_RE.test(item.title);
  useEffect(() => {
    const d = ref.current;
    const opener = document.activeElement;
    if (d && !d.open) d.showModal();
    const root = document.documentElement; const prev = root.style.overflow; root.style.overflow = "hidden";
    return () => { root.style.overflow = prev; if (opener && opener.isConnected && typeof opener.focus === "function") opener.focus(); };
  }, []);
  const rows = compareRows(venues, perp);
  return (
    <dialog ref={ref} className="h7-sheet" aria-labelledby="h7-sh-t" onClose={onClose} onClick={(e) => { if (e.target === ref.current) ref.current.close(); }}>
      <div className="h7-sh-in">
        <button type="button" className="h7-sh-x" onClick={() => ref.current.close()} aria-label={t.shClose}>×</button>
        <h3 id="h7-sh-t" className="h7-sh-h">{t.shH}</h3>
        <p className="h7-sh-ev"><span className={`h7-ic h7-ic-${item.category}`}>{t.inCat[item.category]}</span> {item.title}</p>
        <p className="h7-sh-sub">{perp ? t.shPerp : t.shSpot}</p>
        <ul className="h7-sh-l">
          {rows.map((r) => (
            <li key={r.slug}>
              <div className="h7-sh-n"><BrandMark slug={r.slug} compact /><b>{r.name}</b>{r.share ? <span className="h7-bd">{t.rebate} {Math.round(r.share * 100)}%</span> : <span className="h7-bd" data-nr>{t.pending}</span>}</div>
              <div className="h7-sh-f">{r.maker != null ? <>{t.maker} {pct(r.maker)} / {t.taker} {pct(r.taker)}{r.share ? <small>{t.shAfter} {pct(r.mk)} / {pct(r.tk)}</small> : null}</> : t.unchecked}</div>
              <Cta v={r} locale={locale} className="h7-btn h7-sm h7-sh-b" placement="home-v7-intel"><span>{t.open}</span><span className="h7-sr"> {r.name}</span></Cta>
            </li>
          ))}
        </ul>
        <a className="h7-ln" href={item.url} target="_blank" rel="noopener noreferrer nofollow">{t.shSrc}</a>
        <p className="h7-sh-note">{t.t2b} {t.shNote}</p>
      </div>
    </dialog>
  );
}

const fmtAsOf = (iso, locale) => new Date(iso).toLocaleString(locale === "zh-Hans" ? "zh-CN" : "en-GB", { dateStyle: "medium", timeStyle: "short" });

function IntelBlock({ intel, t, locale, venues }) {
  const [open, setOpen] = useState(null);
  if (!intel) return null;
  const now = Date.now();
  const asOf = fmtAsOf(intel.generatedAt, locale);
  return (
    <section className="h7-in h7-intel" id="h7-intel" aria-label={t.inH}>
      <div className="h7-ih"><h2>{t.inH}</h2><p>{t.inSub}</p></div>
      <ul className="h7-il">
        {intel.items.slice(0, 6).map((i) => (
          <li key={i.id}>
            <span className={`h7-ic h7-ic-${i.category}`}>{t.inCat[i.category]}</span>
            <span className="h7-iv"><BrandMark slug={i.venue} compact />{nameOf(i.venue)}</span>
            <a className="h7-it" href={i.url} target="_blank" rel="noopener noreferrer nofollow">{i.title}<span className="h7-sr"> ({t.inOpen})</span></a>
            <time dateTime={i.publishedAt}>{t.inAgo(now - Date.parse(i.publishedAt))}</time>
            <button type="button" className="h7-iw" aria-haspopup="dialog" onClick={() => setOpen(i)}>{t.inBtn}</button>
          </li>
        ))}
      </ul>
      <p className="h7-ia">{t.inAsOf(asOf)}</p>
      {open && <IntelSheet item={open} venues={venues} t={t} locale={locale} onClose={() => setOpen(null)} />}
    </section>
  );
}

export function HomeV7({ locale, venues: _catalog }) {
  const t = h7Copy(locale);
  const [product, setProduct] = useState("perp");
  const venues = useVenues(locale, product);
  const [vol, setVol] = useState(100000);
  const [mode, setMode] = useState("taker");
  const intel = useIntel(venues);

  const priced = useMemo(() => venues.filter((v) => v.maker != null), [venues]);
  const calc = useMemo(() => {
    const rows = priced.map((v) => {
      const rate = mode === "maker" ? v.maker : v.taker;
      if (rate == null || !vol) return { ...v, gross: null, net: null, save: null };
      const gross = (vol * 12 * rate) / 100;
      const net = gross * (1 - (v.share || 0));
      return { ...v, gross, net, save: gross - net };
    });
    const ok = rows.filter((r) => r.net != null);
    const best = ok.length ? ok.reduce((a, b) => (b.net < a.net ? b : a)) : null;
    const most = ok.length ? ok.reduce((a, b) => (b.save > a.save ? b : a)) : null;
    const maxGross = Math.max(1, ...ok.map((r) => r.gross));
    return { rows, best, most, maxGross };
  }, [priced, vol, mode]);

  // Hero CTA: the cheapest venue among those with a disclosed rebate (the hero promises a rebate).
  const top = useMemo(() => {
    const r = calc.rows.filter((x) => x.share && x.net != null);
    return r.length ? r.reduce((a, b) => (b.net < a.net ? b : a)) : calc.best || calc.rows[0];
  }, [calc]);

  // Ledger: venues with a disclosed rebate share; the pick drives the ledger and the hero CTA.
  const rebated = useMemo(() => HOME_PUSH.map((slug) => calc.rows.find((r) => r.slug === slug && r.share)).filter(Boolean), [calc]);
  const [pickSlug, setPick] = useState(null);
  const sel = rebated.find((r) => r.slug === pickSlug) || rebated[0] || top;
  const auto = HOME_AUTO_SETTLE.includes(sel.slug);
  const topShare = Math.max(0, ...rebated.map((r) => r.share || 0));
  const spot = (e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`); e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`); };

  /* ---------- hero: rebate flow into the number ---------- */
  const heroRef = useRef(null), cvRef = useRef(null), numRef = useRef(null), srcRefs = useRef([]), pillRefs = useRef([]);
  useEffect(() => {
    const hero = heroRef.current, cv = cvRef.current, num = numRef.current;
    if (!hero || !cv || !num) return undefined;
    const cx = cv.getContext("2d"); if (!cx) return undefined;
    let W = 0, H = 0, src = [], P = [], raf = 0, stopped = false, phone = false;
    const geo = () => {
      const r = hero.getBoundingClientRect(); W = r.width; H = r.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = num.getBoundingClientRect(); const tx = n.left - r.left + n.width * 0.46, ty = n.top - r.top + n.height * 0.5;
      // Phones: the stream starts at the exchange pills right under the figure (inside the ledger, no text in between).
      phone = window.matchMedia("(max-width: 900px)").matches;
      src = (phone ? pillRefs : srcRefs).current.filter(Boolean).map((e) => {
        const b = e.getBoundingClientRect(); const x = b.left - r.left + b.width / 2, y = phone ? b.bottom - r.top - 2 : b.top - r.top + 2; // tiles: top edge; phone tabs sit above the figure: bottom edge
        // Run along the strip first, then rise into the ledger figure: never across the headline column.
        return { x, y, tx, ty, cx: tx, cy: phone ? y + 8 : y - 8 };
      });
    };
    const bez = (s, k) => { const u = 1 - k; return [u * u * s.x + 2 * u * k * s.cx + k * k * s.tx, u * u * s.y + 2 * u * k * s.cy + k * k * s.ty]; };
    const draw = () => {
      cx.clearRect(0, 0, W, H);
      const lit = (i) => phone || venues[i]?.share;
      src.forEach((s, i) => { cx.strokeStyle = lit(i) ? "rgba(31,224,192,.22)" : "rgba(237,238,240,.08)"; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(s.x, s.y); cx.quadraticCurveTo(s.cx, s.cy, s.tx, s.ty); cx.stroke(); });
      P.forEach((p) => { const s = src[p.i]; if (!s) return; const b = bez(s, p.t), a = Math.sin(Math.PI * p.t); cx.fillStyle = lit(p.i) ? `rgba(31,224,192,${a * 0.9})` : `rgba(237,238,240,${a * 0.25})`; cx.beginPath(); cx.arc(b[0], b[1], p.r, 0, 6.283); cx.fill(); });
    };
    const frame = () => { if (stopped) return; P.forEach((p) => { p.t += p.v; if (p.t >= 1) { p.t = 0; p.v = 0.003 + Math.random() * 0.004; } }); draw(); raf = requestAnimationFrame(frame); };
    const init = () => { geo(); P = []; for (let i = 0; i < src.length; i++) { const k = phone || venues[i]?.share ? 7 : 3; for (let j = 0; j < k; j++) P.push({ i, t: Math.random(), v: 0.003 + Math.random() * 0.004, r: 1.6 + Math.random() * 1.8 }); } draw(); };
    const onResize = () => { const was = phone; geo(); if (was !== phone) init(); else draw(); };
    init(); window.addEventListener("resize", onResize);
    document.fonts?.ready?.then(() => { if (!stopped) { geo(); draw(); } });
    let io; if (!reduced()) { io = new IntersectionObserver((es) => { cancelAnimationFrame(raf); if (es[0].isIntersecting) raf = requestAnimationFrame(frame); }, { threshold: 0.05 }); io.observe(hero); }
    return () => { stopped = true; cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); io?.disconnect(); };
  }, [venues]);

  const rowsRef = useRef(null), rowEls = useRef([]);

  const onVol = (e) => { const d = e.target.value.replace(/[^0-9]/g, ""); setVol(Math.min(Number(d) || 0, 1e8)); };

  return (
    <div className="h7" {...(h7IsFallback(locale) ? { lang: "en", dir: "ltr" } : {})}>
      <section className="h7-hero" ref={heroRef} aria-label="NexuAlpha">
        <canvas ref={cvRef} className="h7-fl" aria-hidden="true" />
        <div className="h7-hc">
          <p className="h7-kick">{t.kick}</p>
          <h1>{t.h1a}<br />{t.h1b.split("{max}%").map((part, i) => i ? <span key={i}><em className="h7-h1n">{HOME_REBATE_MAX_PCT}%</em>{part}</span> : <span key={i}>{part}</span>)}</h1>
          <p className="h7-sub">{t.sub}</p>
          <div className="h7-cta">
            <a className="h7-btn h7-hero-go" href="#h7-desk" onClick={(e) => { const go = document.querySelector(".h7-lg-go"); if (go) { e.preventDefault(); document.getElementById("h7-desk")?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" }); go.focus({ preventScroll: true }); } }}>{t.heroGo}</a>
            <a className="h7-ln h7-ln-down" href="#h7-calc">{t.calcLink}</a>
          </div>
        </div>

        <aside className="h7-lg" id="h7-desk" aria-label={t.lgTitle} onPointerMove={spot} data-pick={sel.slug}>
          <div className="h7-lg-tabs" role="group" aria-label={t.lgPick} style={{ "--n": rebated.length }}>
            {rebated.map((r, i) => <button key={r.slug} ref={(e) => { pillRefs.current[i] = e; }} type="button" data-brand={r.slug} aria-pressed={r.slug === sel.slug} onClick={() => setPick(r.slug)}><BrandMark slug={r.slug} compact /><span>{r.name}</span><b><span className="h7-sr">{t.rebate} </span>{Math.round(r.share * 100)}%</b>{r.share === topShare && rebated.length > 1 ? <i>{t.lgTop}</i> : null}</button>)}
          </div>
          <div className="h7-lg-max">
            <p className="h7-num" ref={numRef}><span className="h7-sr">{t.lgShare(sel.name)} </span><Roll value={Math.round(sel.share * 100)} fmt={(n) => String(Math.round(n))} nudge={sel.slug} /><span>%</span></p>
            <div className="h7-lg-who"><b>{t.lgShare(sel.name)}</b>{auto && <span className="h7-auto">{t.lgAuto}</span>}</div>
          </div>
          <p className="h7-lg-top"><span className="h7-dot" aria-hidden="true" />{t.lgEst}<span className="h7-lg-vol">{t.lgVol(usd(vol), `${product === "perp" ? t.perpL : t.spotL}${t.sep}${mode === "maker" ? t.maker : t.taker}`)}</span></p>
          <dl className="h7-lg-rows">
            <div><dt>{t.lgWithout}</dt><dd><Roll value={sel.gross} nudge={sel.slug} /></dd></div>
            <div className="up"><dt>{t.lgBack}</dt><dd><Roll value={sel.save} prefix="+" nudge={sel.slug} /></dd></div>
            <div className="h7-lg-net"><dt>{t.lgNet}</dt><dd><Roll value={sel.net} nudge={sel.slug} /></dd></div>
          </dl>
          {sel.code && <p className="h7-lg-code"><span>{t.code}</span><code>{sel.code}</code><CopyCode code={sel.code} t={t} /></p>}
          <Cta v={sel} locale={locale} className={`h7-btn h7-lg-go h7-go--${sel.slug}`} placement="home-v7-hero"><span className="h7-go-l">{t.lgGo(sel.name)}</span><small className="h7-go-disclosure">{sel.open ? `${t.lgBuilt} · ` : ""}{t.lgAd}</small></Cta>
          <p className="h7-lg-disclosure">{t.t2b}</p>
        </aside>

        <div className="h7-strip">
          <p className="h7-strip-h">{t.cap(venues.length).replace("{max}", String(HOME_REBATE_MAX_PCT))}</p>
          <ul className="h7-pw" aria-label={t.pw(venues.length)}>
            {venues.map((v, i) => (
              <li key={v.slug}>
                <a href={localizedHref(`/exchanges/${v.slug}#registration-path`, { locale })} ref={(e) => { srcRefs.current[i] = e; }} className={v.share ? "on" : undefined}>
                  <BrandMark slug={v.slug} compact priority={i < 4} /><span className="h7-pn">{v.name}</span>{v.share ? <small><span className="h7-sr">{t.rebate} </span>{Math.round(v.share * 100)}%</small> : null}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="h7-trust"><div>{t.t1}<span>{t.t1b}</span></div><div>{t.t2}<span>{t.t2b}</span></div><div>{t.t3}<span>{t.t3b}</span></div></div>

      <section className="h7-in h7-how" aria-labelledby="h7-how-h">
        <h2 id="h7-how-h">{t.howH}</h2>
        <ol className="h7-steps">
          {t.how.map(([h, b], i) => <li key={h}><span className="h7-sn" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span><h3>{h}</h3><p>{b}</p></li>)}
        </ol>
      </section>

      <section className="h7-in h7-calc" id="h7-calc">
        <div>
          <h2>{t.calcH}</h2>
          <label className="h7-vin"><span>$</span><input value={vol ? vol.toLocaleString("en-US") : ""} onChange={onVol} inputMode="numeric" aria-label={t.volLabel} /><small>{t.perMonth}</small></label>
          <input className="h7-range" type="range" min="0" max="1000" step="1" value={toPos(vol || VMIN)} style={{ "--p": `${toPos(vol || VMIN) / 10}%` }} onChange={(e) => setVol(toVol(Number(e.target.value)))} aria-label={t.volLabel} aria-valuetext={`${usd(vol)} ${t.perMonth}`} />
          <div className="h7-range-scale" aria-hidden="true">{[[1e4, "$10K"], [1e5, "$100K"], [1e6, "$1M"], [5e6, "$5M"]].map(([v, l]) => <span key={l} style={{ "--x": `${toPos(v) / 10}%` }}>{l}</span>)}</div>
          <div className="h7-ctl">
            {CHIPS.map((c) => <button key={c} type="button" aria-pressed={vol === c} onClick={() => setVol(c)}>${c / 1000}K</button>)}
            <div className="h7-seg" role="group" aria-label={`${t.perpL} / ${t.spotL}`}><button type="button" aria-pressed={product === "perp"} onClick={() => setProduct("perp")}>{t.perpL}</button><button type="button" aria-pressed={product === "spot"} onClick={() => setProduct("spot")}>{t.spotL}</button></div>
            <div className="h7-seg" role="group" aria-label="maker / taker"><button type="button" aria-pressed={mode === "maker"} onClick={() => setMode("maker")}>{t.maker}</button><button type="button" aria-pressed={mode === "taker"} onClick={() => setMode("taker")}>{t.taker}</button></div>
          </div>
          <p className="h7-vd" aria-live="polite">{!vol ? t.calcEmpty : <>{calc.best && <>{t.lowest(calc.best.name, usd(calc.best.net))}<br /></>}{calc.most && calc.most.save > 0 && t.most(calc.most.name, usd(calc.most.save))}</>}</p>
          <a className="h7-ln h7-all" href={localizedHref("/exchanges", { locale })}>{t.all}</a>
        </div>
        <div className="h7-rows" ref={rowsRef}>
          <p className="h7-disc">{t.t2b}</p>
          {calc.rows.map((r, i) => (
            <div key={r.slug} ref={(e) => { rowEls.current[i] = e; }} className={`h7-xr${calc.best?.slug === r.slug ? " best" : ""}${r.share ? "" : " nr"}`}>
              <p className="h7-xn"><BrandMark slug={r.slug} compact /><b>{r.name}</b><span className="h7-bd">{r.share ? `${t.rebate} ${Math.round(r.share * 100)}%` : t.pending}</span></p>
              <div className="h7-am">{r.net == null ? "–" : <>{r.share ? <s>{usd(r.gross)}</s> : null}<Roll value={r.net} /></>}</div>
              <p className="h7-meta"><span>{t.rate} {r.maker != null ? `${r.maker.toFixed(2)}% / ${r.taker.toFixed(2)}%` : t.unchecked}</span>{r.code && <span>{t.code} <code>{r.code}</code></span>}<a className="h7-dt" href={localizedHref(`/exchanges/${r.slug}`, { locale })}>{t.detail}</a></p>
              <Cta v={r} locale={locale} className="h7-btn h7-sm" placement="home-v7-row"><span>{t.open}</span><span className="h7-sr"> {r.name}</span></Cta>
            </div>
          ))}
        </div>
      </section>
      <IntelBlock intel={intel} t={t} locale={locale} venues={priced} />
      <div className="h7-in h7-foot">{t.foot(FACTS_AS_OF).replace("{max}", String(HOME_REBATE_MAX_PCT)).split(/(?<=[。．.])\s*(?=\S)/u).map((x) => <p key={x}>{x}</p>)}</div>
      <MobileDock heroRef={heroRef} sel={sel} rebated={rebated} setPick={setPick} t={t} locale={locale} />
    </div>
  );
}

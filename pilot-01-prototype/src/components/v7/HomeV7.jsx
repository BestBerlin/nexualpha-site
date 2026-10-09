// Home v7: one number as the signature visual, a dark scroll story, and one row per exchange that goes straight to the
// official sign-up. Reads fees from exchange-facts.js and the registration link/code from publicCtaForVenue (same source as
// the directory), so invite codes, hrefs and rel attributes are never typed here.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { feeFact, FACTS_AS_OF } from "../../data/exchange-facts.js";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { localizedHref } from "../../data/locale-routing.js";
import { HOME_REBATE_MAX_PCT, HOME_REBATE_SHARE, HOME_PARTNERS } from "../../data/home-rebate-tiers.js";
import { brandsBySlug } from "../../content/brand-manifest";
import { readIntelFeed } from "../../data/announcement-intel.js";
import { h7Copy, h7IsFallback } from "./home7-copy.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import "../../styles/v7/home7.css";

const nameOf = (slug) => brandsBySlug[slug]?.name || slug;
const CHIPS = [10000, 50000, 100000, 500000];
const usd = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useVenues(locale) {
  return useMemo(() => HOME_PARTNERS.map((slug) => {
    const f = feeFact(slug, "spot");
    const cta = publicCtaForVenue(slug, locale);
    const checked = f.state === "checked" && Number.isFinite(f.maker) && Number.isFinite(f.taker);
    return {
      slug, name: nameOf(slug), maker: checked ? f.maker : null, taker: checked ? f.taker : null,
      share: HOME_REBATE_SHARE[slug], code: cta.hasReferral ? cta.inviteCode : null,
      url: cta.registrationUrl, open: Boolean(cta.hasReferral && /^https:\/\//i.test(cta.registrationUrl || "")),
    };
  }), [locale]);
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
        {intel.items.slice(0, 8).map((i) => (
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
  const venues = useVenues(locale);
  const [vol, setVol] = useState(100000);
  const [mode, setMode] = useState("maker");
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

  /* ---------- hero: rebate flow into the number ---------- */
  const heroRef = useRef(null), cvRef = useRef(null), numRef = useRef(null), srcRefs = useRef([]);
  useEffect(() => {
    const hero = heroRef.current, cv = cvRef.current, num = numRef.current;
    if (!hero || !cv || !num) return undefined;
    const cx = cv.getContext("2d"); if (!cx) return undefined;
    let W = 0, H = 0, src = [], P = [], raf = 0, stopped = false;
    const geo = () => {
      const r = hero.getBoundingClientRect(); W = r.width; H = r.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = num.getBoundingClientRect(); const tx = n.left - r.left + n.width * 0.46, ty = n.top - r.top + n.height * 0.5;
      src = srcRefs.current.filter(Boolean).map((e) => {
        const b = e.getBoundingClientRect(); const x = b.left - r.left + b.width / 2, y = b.top - r.top + 2; // leave from the tile's top edge, never across its text
        const mx = (x + tx) / 2, my = (y + ty) / 2, dx = tx - x, dy = ty - y, L = Math.hypot(dx, dy) || 1, off = L * 0.22 * (y < ty ? -1 : 1);
        return { x, y, tx, ty, cx: mx + (dy / L) * off, cy: my - (dx / L) * off };
      });
    };
    const bez = (s, k) => { const u = 1 - k; return [u * u * s.x + 2 * u * k * s.cx + k * k * s.tx, u * u * s.y + 2 * u * k * s.cy + k * k * s.ty]; };
    const draw = () => {
      cx.clearRect(0, 0, W, H);
      src.forEach((s, i) => { cx.strokeStyle = venues[i]?.share ? "rgba(31,224,192,.22)" : "rgba(237,238,240,.08)"; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(s.x, s.y); cx.quadraticCurveTo(s.cx, s.cy, s.tx, s.ty); cx.stroke(); });
      P.forEach((p) => { const s = src[p.i]; if (!s) return; const b = bez(s, p.t), a = Math.sin(Math.PI * p.t); cx.fillStyle = venues[p.i]?.share ? `rgba(31,224,192,${a * 0.9})` : `rgba(237,238,240,${a * 0.25})`; cx.beginPath(); cx.arc(b[0], b[1], p.r, 0, 6.283); cx.fill(); });
    };
    const frame = () => { if (stopped) return; P.forEach((p) => { p.t += p.v; if (p.t >= 1) { p.t = 0; p.v = 0.003 + Math.random() * 0.004; } }); draw(); raf = requestAnimationFrame(frame); };
    const init = () => { geo(); P = []; for (let i = 0; i < venues.length; i++) { const k = venues[i].share ? 7 : 3; for (let j = 0; j < k; j++) P.push({ i, t: Math.random(), v: 0.003 + Math.random() * 0.004, r: 1.6 + Math.random() * 1.8 }); } draw(); };
    const onResize = () => { geo(); draw(); };
    init(); window.addEventListener("resize", onResize);
    document.fonts?.ready?.then(() => { if (!stopped) { geo(); draw(); } });
    let io; if (!reduced()) { io = new IntersectionObserver((es) => { cancelAnimationFrame(raf); if (es[0].isIntersecting) raf = requestAnimationFrame(frame); }, { threshold: 0.05 }); io.observe(hero); }
    return () => { stopped = true; cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); io?.disconnect(); };
  }, [venues]);

  /* ---------- dark story: drawn by scroll position (the venue that returns the most) ---------- */
  const storyRef = useRef(null), loRef = useRef(null), lbRef = useRef(null), dotRef = useRef(null), tagRef = useRef(null), gapRef = useRef(null), progRef = useRef(null), chartRef = useRef(null), svgRef = useRef(null);
  const pRef = useRef(1);
  const W = 1000, HH = 380, L = 46, R = 18, T = 14, B = 34;
  const maxY = Math.max(1, calc.maxGross);
  const X = (m) => L + (W - L - R) * m / 12, Y = (v) => HH - B - (HH - B - T) * v / maxY;
  const setStory = useCallback((p) => {
    pRef.current = p; const b = calc.most; if (!b || !loRef.current) return;
    loRef.current.style.strokeDashoffset = String(1 - p); lbRef.current.style.strokeDashoffset = String(1 - p);
    const x = X(12 * p), y = Y(b.net * p); dotRef.current?.setAttribute("cx", x); dotRef.current?.setAttribute("cy", y);
    if (progRef.current) progRef.current.style.width = `${p * 100}%`;
    const k = (svgRef.current?.getBoundingClientRect().width || W) / W, tg = tagRef.current;
    if (tg) { tg.style.opacity = p > 0.02 && p < 0.97 ? "1" : "0"; const cw = svgRef.current?.getBoundingClientRect().width || W * k, half = (tg.offsetWidth || 0) / 2; tg.style.left = `${Math.min(Math.max(x * k, half), cw - half)}px`; tg.style.top = `${y * k}px`; tg.textContent = `${Math.round(p * 12) || 1} ${t.mo} · ${b.name} ${t.tagPaid} ${usd(b.net * p)}`; }
    gapRef.current?.classList.toggle("on", p > 0.96);
  }, [calc.most, maxY, t]);
  useEffect(() => {
    const el = storyRef.current; if (!el) return undefined;
    if (reduced()) { setStory(1); return undefined; }
    let tick = false, scrolled = false, timed = false;
    // Pinned (desktop): progress through the tall section. Unpinned (mobile, section shorter than the viewport): progress as it travels up the screen.
    const calcP = () => { const r = el.getBoundingClientRect(), vh = window.innerHeight, tot = r.height - vh; return tot > 0 ? Math.min(1, Math.max(0, -r.top / tot)) : Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (r.height * 0.9))); };
    const on = () => { scrolled = true; if (tick) return; tick = true; requestAnimationFrame(() => { tick = false; if (!timed) setStory(calcP()); }); };
    setStory(calcP());
    window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) setTimeout(() => { if (!scrolled && !timed) { timed = true; const t0 = performance.now(); const f = (n) => { const k = Math.min(1, (n - t0) / 4200); setStory(ease(k)); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); } }, 2500); }, { threshold: 0.5 });
    if (chartRef.current) io.observe(chartRef.current);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); io.disconnect(); };
  }, [setStory]);

  /* ---------- rows: a year runs through them when they scroll in ---------- */
  const rowsRef = useRef(null), rowEls = useRef([]);
  const paintRows = useCallback((p) => {
    calc.rows.forEach((r, i) => { const el = rowEls.current[i]; if (!el || r.net == null) return; const bar = el.querySelector("[data-bar]"), am = el.querySelector("[data-am]"); if (bar) bar.style.width = `${(r.net / calc.maxGross) * 100 * p}%`; if (am) am.innerHTML = `${r.share ? `<s>${usd(r.gross)}</s>` : ""}${usd(r.gross - (r.gross - r.net) * p)}`; });
  }, [calc]);
  const ran = useRef(false);
  useEffect(() => {
    const el = rowsRef.current; if (!el || reduced()) return undefined;
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting && !ran.current) { ran.current = true; const t0 = performance.now(); const f = (n) => { const k = Math.min(1, (n - t0) / 1400); paintRows(ease(k)); if (k < 1) requestAnimationFrame(f); }; paintRows(0); requestAnimationFrame(f); } }, { threshold: 0.25 });
    io.observe(el); return () => io.disconnect();
  }, [paintRows]);
  useEffect(() => { if (ran.current) paintRows(1); }, [calc, paintRows]);

  const onVol = (e) => { const d = e.target.value.replace(/[^0-9]/g, ""); setVol(Math.min(Number(d) || 0, 1e8)); };

  return (
    <div className="h7" {...(h7IsFallback(locale) ? { lang: "en", dir: "ltr" } : {})}>
      <section className="h7-hero" ref={heroRef} aria-label="NexuAlpha">
        <canvas ref={cvRef} className="h7-fl" aria-hidden="true" />
        <div className="h7-hc">
          <p className="h7-kick">{t.kick}</p>
          <h1>{t.h1a}<br />{t.h1b}<span className="h7-sr"> {HOME_REBATE_MAX_PCT}%</span></h1>
          <p className="h7-sub">{t.sub}</p>
          <div className="h7-cta"><Cta v={top} locale={locale} className="h7-btn" placement="home-v7-hero">{t.cta(top.name)}</Cta><a className="h7-ln" href="#h7-calc">{t.calcLink}</a></div>
          <p className="h7-cta-disc">{t.t2b}</p>
        </div>
        <div className="h7-big">
          <p className="h7-num" ref={numRef} aria-hidden="true">{HOME_REBATE_MAX_PCT}<span>%</span></p>
          <ul className="h7-pw" aria-label={t.pw(venues.length)}>
            {venues.map((v, i) => (
              <li key={v.slug}>
                <a href={localizedHref(`/exchanges/${v.slug}#registration-path`, { locale })} ref={(e) => { srcRefs.current[i] = e; }} className={v.share ? "on" : undefined}>
                  <BrandMark slug={v.slug} compact priority={i < 4} /><span className="h7-pn">{v.name}</span>{v.share ? <small><span className="h7-sr">{t.rebate} </span>{Math.round(v.share * 100)}%</small> : null}
                </a>
              </li>
            ))}
          </ul>
          <p className="h7-cap">{t.cap(venues.length).replace("{max}", String(HOME_REBATE_MAX_PCT))}</p>
        </div>
      </section>

      <div className="h7-trust"><div>{t.t1}<span>{t.t1b}</span></div><div>{t.t2}<span>{t.t2b}</span></div><div>{t.t3}<span>{t.t3b}</span></div></div>

      <section className="h7-dk h7-story" ref={storyRef} aria-label={t.storyH}>
        <div className="h7-in h7-pin">
          <h2>{t.storyH}</h2>
          <div className="h7-chart" ref={chartRef}>
            <svg ref={svgRef} viewBox={`0 0 ${W} ${HH}`} role="img" aria-label={t.storyH}>
              {[0, 1, 2, 3, 4].map((g) => <g key={g}><line x1={L} x2={W - R} y1={Y(maxY * g / 4)} y2={Y(maxY * g / 4)} className="h7-gl" /><text x={L - 8} y={Y(maxY * g / 4) + 4} textAnchor="end" className={`h7-ax h7-ax-y${g ? "" : " h7-ax-0"}`}>{usd(maxY * g / 4)}</text></g>)}
              {[0, 3, 6, 9, 12].map((m) => <text key={m} x={X(m)} y={HH - 10} textAnchor="middle" className="h7-ax">{m ? `${m} ${t.mo}` : t.y0}</text>)}
              {calc.most && <>
                <path d={`M${X(0)} ${Y(0)} L${X(12)} ${Y(calc.most.gross)}`} className="h7-lnp h7-ghost" stroke="#6B717B" aria-hidden="true" />
                <path d={`M${X(0)} ${Y(0)} L${X(12)} ${Y(calc.most.net)}`} className="h7-lnp h7-ghost" stroke="#1FE0C0" aria-hidden="true" />
                <path ref={loRef} d={`M${X(0)} ${Y(0)} L${X(12)} ${Y(calc.most.gross)}`} className="h7-lnp" stroke="#6B717B" pathLength="1" strokeDasharray="1" />
                <path ref={lbRef} d={`M${X(0)} ${Y(0)} L${X(12)} ${Y(calc.most.net)}`} className="h7-lnp" stroke="#1FE0C0" pathLength="1" strokeDasharray="1" />
                <circle ref={dotRef} r="7" cx={X(12)} cy={Y(calc.most.net)} fill="#1FE0C0" stroke="#0C0D10" strokeWidth="4" />
              </>}
            </svg>
            <div className="h7-tag" ref={tagRef} style={{ opacity: 0 }} />
            {calc.most && <div className="h7-gap on" ref={gapRef}><span>{usd(calc.most.save)}</span><small>{t.gapNote(calc.most.name)}</small></div>}
          </div>
          <div className="h7-prog"><i ref={progRef} /></div>
        </div>
      </section>

      <section className="h7-in h7-calc" id="h7-calc">
        <div>
          <h2>{t.calcH}</h2>
          <label className="h7-vin"><span>$</span><input value={vol ? vol.toLocaleString("en-US") : ""} onChange={onVol} inputMode="numeric" aria-label={t.volLabel} /><small>{t.perMonth}</small></label>
          <div className="h7-ctl">
            {CHIPS.map((c) => <button key={c} type="button" aria-pressed={vol === c} onClick={() => setVol(c)}>${c / 1000}K</button>)}
            <div className="h7-seg" role="group" aria-label="maker / taker"><button type="button" aria-pressed={mode === "maker"} onClick={() => setMode("maker")}>{t.maker}</button><button type="button" aria-pressed={mode === "taker"} onClick={() => setMode("taker")}>{t.taker}</button></div>
          </div>
          <p className="h7-vd" aria-live="polite">{!vol ? t.calcEmpty : <>{calc.best && <>{t.lowest(calc.best.name, usd(calc.best.net))}<br /></>}{calc.most && calc.most.save > 0 && t.most(calc.most.name, usd(calc.most.save))}</>}</p>
          <a className="h7-ln h7-all" href={localizedHref("/exchanges", { locale })}>{t.all}</a>
        </div>
        <div className="h7-rows" ref={rowsRef}>
          <p className="h7-disc">{t.t2b}</p>
          {calc.rows.map((r, i) => (
            <div key={r.slug} ref={(e) => { rowEls.current[i] = e; }} className={`h7-xr${calc.best?.slug === r.slug ? " best" : ""}${r.share ? "" : " nr"}`}>
              <div>
                <b><BrandMark slug={r.slug} compact />{r.name}<span className="h7-bd">{r.share ? `${t.rebate} ${Math.round(r.share * 100)}%` : t.pending}</span></b>
                <div className="h7-meta"><span>{t.rate} {r.maker != null ? `${r.maker.toFixed(2)}% / ${r.taker.toFixed(2)}%` : t.unchecked}</span>{r.code && <span>{t.code} <code>{r.code}</code></span>}</div>
                <a className="h7-dt" href={localizedHref(`/exchanges/${r.slug}`, { locale })}>{t.detail}</a>
                <div className="h7-bar" data-bar style={{ width: r.net != null ? `${(r.net / calc.maxGross) * 100}%` : 0 }} />
              </div>
              <div className="h7-am" data-am dangerouslySetInnerHTML={{ __html: r.net == null ? "–" : `${r.share ? `<s>${usd(r.gross)}</s>` : ""}${usd(r.net)}` }} />
              <Cta v={r} locale={locale} className="h7-btn h7-sm" placement="home-v7-row"><span>{t.open}</span><span className="h7-sr"> {r.name}</span></Cta>
            </div>
          ))}
        </div>
      </section>
      <IntelBlock intel={intel} t={t} locale={locale} venues={priced} />
      <p className="h7-in h7-foot">{t.foot(FACTS_AS_OF).replace("{max}", String(HOME_REBATE_MAX_PCT))}</p>
    </div>
  );
}

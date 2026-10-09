// Home v7: one number as the signature visual, a dark scroll story, and one row per exchange that goes straight to the
// official sign-up. Reads fees from exchange-facts.js and the registration link/code from publicCtaForVenue (same source as
// the directory), so invite codes, hrefs and rel attributes are never typed here.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { feeFact, FACTS_AS_OF } from "../../data/exchange-facts.js";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { localizedHref } from "../../data/locale-routing.js";
import { HOME_REBATE_MAX_PCT, HOME_REBATE_SHARE, HOME_VENUES } from "../../data/home-rebate-tiers.js";
import { h7Copy } from "./home7-copy.js";
import "../../styles/v7/home7.css";

const NAMES = { okx: "OKX", binance: "Binance", bitget: "Bitget", bybit: "Bybit" };
const CHIPS = [10000, 50000, 100000, 500000];
const usd = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useVenues(locale) {
  return useMemo(() => HOME_VENUES.map((slug) => {
    const f = feeFact(slug, "spot");
    const cta = publicCtaForVenue(slug, locale);
    const checked = f.state === "checked" && Number.isFinite(f.maker) && Number.isFinite(f.taker);
    return {
      slug, name: NAMES[slug], maker: checked ? f.maker : null, taker: checked ? f.taker : null,
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

export function HomeV7({ locale, venues: _catalog }) {
  const t = h7Copy(locale);
  const venues = useVenues(locale);
  const [vol, setVol] = useState(100000);
  const [mode, setMode] = useState("maker");

  const calc = useMemo(() => {
    const rows = venues.map((v) => {
      const rate = mode === "maker" ? v.maker : v.taker;
      if (rate == null) return { ...v, gross: null, net: null, save: null };
      const gross = (vol * 12 * rate) / 100;
      const net = gross * (1 - (v.share || 0));
      return { ...v, gross, net, save: gross - net };
    });
    const ok = rows.filter((r) => r.net != null);
    const best = ok.length ? ok.reduce((a, b) => (b.net < a.net ? b : a)) : null;
    const most = ok.length ? ok.reduce((a, b) => (b.save > a.save ? b : a)) : null;
    const maxGross = Math.max(1, ...ok.map((r) => r.gross));
    return { rows, best, most, maxGross };
  }, [venues, vol, mode]);
  const top = calc.best || calc.rows[0];

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
        const b = e.getBoundingClientRect(); const x = b.left - r.left + b.width / 2, y = b.top - r.top + b.height / 2;
        const mx = (x + tx) / 2, my = (y + ty) / 2, dx = tx - x, dy = ty - y, L = Math.hypot(dx, dy) || 1, off = L * 0.22 * (y < ty ? -1 : 1);
        return { x, y, tx, ty, cx: mx + (dy / L) * off, cy: my - (dx / L) * off };
      });
    };
    const bez = (s, k) => { const u = 1 - k; return [u * u * s.x + 2 * u * k * s.cx + k * k * s.tx, u * u * s.y + 2 * u * k * s.cy + k * k * s.ty]; };
    const draw = () => {
      cx.clearRect(0, 0, W, H); if (window.innerWidth <= 900) return;
      src.forEach((s, i) => { cx.strokeStyle = venues[i]?.share ? "rgba(0,183,106,.28)" : "rgba(11,13,12,.10)"; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(s.x, s.y); cx.quadraticCurveTo(s.cx, s.cy, s.tx, s.ty); cx.stroke(); });
      P.forEach((p) => { const s = src[p.i]; if (!s) return; const b = bez(s, p.t), a = Math.sin(Math.PI * p.t); cx.fillStyle = venues[p.i]?.share ? `rgba(0,183,106,${a * 0.95})` : `rgba(11,13,12,${a * 0.35})`; cx.beginPath(); cx.arc(b[0], b[1], p.r, 0, 6.283); cx.fill(); });
    };
    const frame = () => { if (stopped) return; P.forEach((p) => { p.t += p.v; if (p.t >= 1) { p.t = 0; p.v = 0.003 + Math.random() * 0.004; } }); draw(); raf = requestAnimationFrame(frame); };
    const init = () => { geo(); P = []; for (let i = 0; i < venues.length; i++) { const k = venues[i].share ? 9 : 3; for (let j = 0; j < k; j++) P.push({ i, t: Math.random(), v: 0.003 + Math.random() * 0.004, r: 1.6 + Math.random() * 1.8 }); } draw(); };
    const onResize = () => { geo(); draw(); };
    init(); window.addEventListener("resize", onResize);
    document.fonts?.ready?.then(() => { if (!stopped) { geo(); draw(); } });
    let io; if (!reduced()) { io = new IntersectionObserver((es) => { cancelAnimationFrame(raf); if (es[0].isIntersecting) raf = requestAnimationFrame(frame); }, { threshold: 0.05 }); io.observe(hero); }
    return () => { stopped = true; cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); io?.disconnect(); };
  }, [venues]);

  /* ---------- dark story: drawn by scroll position ---------- */
  const storyRef = useRef(null), loRef = useRef(null), lbRef = useRef(null), dotRef = useRef(null), tagRef = useRef(null), gapRef = useRef(null), progRef = useRef(null), chartRef = useRef(null), svgRef = useRef(null);
  const pRef = useRef(1);
  const W = 1000, HH = 380, L = 46, R = 18, T = 14, B = 34;
  const maxY = Math.max(1, calc.maxGross);
  const X = (m) => L + (W - L - R) * m / 12, Y = (v) => HH - B - (HH - B - T) * v / maxY;
  const setStory = useCallback((p) => {
    pRef.current = p; const b = calc.best; if (!b || !loRef.current) return;
    loRef.current.style.strokeDashoffset = String(1 - p); lbRef.current.style.strokeDashoffset = String(1 - p);
    const x = X(12 * p), y = Y(b.net * p); dotRef.current?.setAttribute("cx", x); dotRef.current?.setAttribute("cy", y);
    if (progRef.current) progRef.current.style.width = `${p * 100}%`;
    const k = (svgRef.current?.getBoundingClientRect().width || W) / W, tg = tagRef.current;
    if (tg) { tg.style.opacity = p > 0.02 && p < 0.97 ? "1" : "0"; tg.style.left = `${x * k}px`; tg.style.top = `${y * k}px`; tg.textContent = `${Math.round(p * 12) || 1} ${t.mo} · ${b.name} ${t.tagPaid} ${usd(b.net * p)}`; }
    gapRef.current?.classList.toggle("on", p > 0.96);
  }, [calc.best, maxY, t]);
  useEffect(() => {
    const el = storyRef.current; if (!el) return undefined;
    if (reduced()) { setStory(1); return undefined; }
    let tick = false, scrolled = false, timed = false;
    const calcP = () => { const r = el.getBoundingClientRect(), tot = r.height - window.innerHeight; return tot > 0 ? Math.min(1, Math.max(0, -r.top / tot)) : 0; };
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
    calc.rows.forEach((r, i) => { const el = rowEls.current[i]; if (!el || r.net == null) return; const bar = el.querySelector("[data-bar]"), am = el.querySelector("[data-am]"); if (bar) bar.style.width = `${(r.net / calc.maxGross) * 100 * p}%`; if (am) am.innerHTML = `${r.share ? `<s>${usd(r.gross * p)}</s>` : ""}${usd(r.net * p)}`; });
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
    <div className="h7">
      <section className="h7-hero" ref={heroRef} aria-label="NexuAlpha">
        <canvas ref={cvRef} className="h7-fl" aria-hidden="true" />
        {venues.map((v, i) => <span key={v.slug} ref={(e) => { srcRefs.current[i] = e; }} className={`h7-src h7-s${i}`} aria-hidden="true">{v.name}<small>{v.share ? `${Math.round(v.share * 100)}%` : "–"}</small></span>)}
        <div className="h7-hc">
          <h1>{t.h1a}<br />{t.h1b}</h1>
          <p className="h7-sub">{t.sub}</p>
          <div className="h7-cta"><Cta v={top} locale={locale} className="h7-btn" placement="home-v7-hero">{t.cta(top.name)}</Cta><a className="h7-ln" href="#h7-calc">{t.calcLink}</a></div>
        </div>
        <div className="h7-big"><p className="h7-num" ref={numRef} aria-label={`${HOME_REBATE_MAX_PCT}%`}>{HOME_REBATE_MAX_PCT}<span>%</span></p><p className="h7-cap">{t.cap}</p></div>
      </section>

      <div className="h7-trust"><div>{t.t1}<span>{t.t1b}</span></div><div>{t.t2}<span>{t.t2b}</span></div><div>{t.t3}<span>{t.t3b}</span></div></div>

      <section className="h7-dk h7-story" ref={storyRef} aria-label={t.storyH}>
        <div className="h7-in h7-pin">
          <h2>{t.storyH}</h2>
          <div className="h7-chart" ref={chartRef}>
            <svg ref={svgRef} viewBox={`0 0 ${W} ${HH}`} role="img" aria-label={t.storyH}>
              {[0, 1, 2, 3, 4].map((g) => <g key={g}><line x1={L} x2={W - R} y1={Y(maxY * g / 4)} y2={Y(maxY * g / 4)} className="h7-gl" /><text x={L - 8} y={Y(maxY * g / 4) + 4} textAnchor="end" className="h7-ax">{usd(maxY * g / 4)}</text></g>)}
              {[0, 3, 6, 9, 12].map((m) => <text key={m} x={X(m)} y={HH - 10} textAnchor="middle" className="h7-ax">{m ? `${m} ${t.mo}` : t.y0}</text>)}
              {calc.best && <>
                <path ref={loRef} d={`M${X(0)} ${Y(0)} L${X(12)} ${Y(calc.best.gross)}`} className="h7-lnp" stroke="#59605C" pathLength="1" strokeDasharray="1" />
                <path ref={lbRef} d={`M${X(0)} ${Y(0)} L${X(12)} ${Y(calc.best.net)}`} className="h7-lnp" stroke="#19D27F" pathLength="1" strokeDasharray="1" />
                <circle ref={dotRef} r="7" cx={X(12)} cy={Y(calc.best.net)} fill="#19D27F" stroke="#0B0D0C" strokeWidth="3" />
              </>}
            </svg>
            <div className="h7-tag" ref={tagRef} style={{ opacity: 0 }} />
            {calc.best && <div className="h7-gap on" ref={gapRef}><span>{usd(calc.best.save)}</span><small>{t.gapNote(calc.best.name)}</small></div>}
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
          <p className="h7-vd">{calc.best && <>{t.lowest(calc.best.name, usd(calc.best.net))}<br /></>}{calc.most && calc.most.save > 0 && t.most(calc.most.name, usd(calc.most.save))}</p>
          <a className="h7-ln h7-all" href={localizedHref("/exchanges", { locale })}>{t.all}</a>
        </div>
        <div className="h7-rows" ref={rowsRef}>
          {calc.rows.map((r, i) => (
            <div key={r.slug} ref={(e) => { rowEls.current[i] = e; }} className={`h7-xr${calc.best?.slug === r.slug ? " best" : ""}${r.share ? "" : " nr"}`}>
              <div>
                <b>{r.name}<span className="h7-bd">{r.share ? `${t.rebate} ${Math.round(r.share * 100)}%` : t.pending}</span></b>
                <div className="h7-meta"><span>{t.rate} {r.maker != null ? `${r.maker.toFixed(2)}% / ${r.taker.toFixed(2)}%` : t.unchecked}</span>{r.code && <span>{t.code} <code>{r.code}</code></span>}<a href={localizedHref(`/exchanges/${r.slug}`, { locale })}>{t.detail}</a></div>
                <div className="h7-bar" data-bar style={{ width: r.net != null ? `${(r.net / calc.maxGross) * 100}%` : 0 }} />
              </div>
              <div className="h7-am" data-am dangerouslySetInnerHTML={{ __html: r.net == null ? "–" : `${r.share ? `<s>${usd(r.gross)}</s>` : ""}${usd(r.net)}` }} />
              <Cta v={r} locale={locale} className="h7-btn h7-sm" placement="home-v7-row"><span>{t.open}</span><span className="h7-sr"> {r.name}</span></Cta>
            </div>
          ))}
        </div>
      </section>
      <p className="h7-in h7-foot">{t.foot(FACTS_AS_OF).replace("{max}", String(HOME_REBATE_MAX_PCT))}</p>
    </div>
  );
}

// Home v7: one number as the signature visual, a dark scroll story, and one row per exchange that goes straight to the
// official sign-up. Reads fees from exchange-facts.js and the registration link/code from publicCtaForVenue (same source as
// the directory), so invite codes, hrefs and rel attributes are never typed here.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { feeFact, FACTS_AS_OF } from "../../data/exchange-facts.js";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { localizedHref } from "../../data/locale-routing.js";
import { HOME_REBATE_MAX_PCT, HOME_REBATE_SHARE, HOME_VENUES } from "../../data/home-rebate-tiers.js";
import { supportedLocales } from "../../content/locale-manifest";
import { readIntelFeed } from "../../data/announcement-intel.js";
import { h7Copy, h7IsFallback } from "./home7-copy.js";
import { BrandMark } from "../brand/BrandMark.jsx";
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

// Live strip of the newest official notices. Duplicated once for a seamless loop; the copy is aria-hidden.
function NoticeTicker({ intel, t }) {
  if (!intel) return null;
  const now = Date.now();
  const items = intel.items.slice(0, 6);
  const row = (hidden) => items.map((i) => (
    <span key={`${hidden ? "d" : "o"}-${i.id}`} className="h7-tk-i" aria-hidden={hidden || undefined}><b>{NAMES[i.venue]}</b> {t.inCat[i.category]} · {i.title} · {t.inAgo(now - Date.parse(i.publishedAt))}</span>
  ));
  return (
    <div className="h7-tick" role="region" aria-label={t.tick}>
      <span className="h7-tk-live">{t.tick}</span>
      <div className="h7-tk-vp"><div className="h7-tk-run">{row(false)}{row(true)}</div></div>
    </div>
  );
}

// Hero terminal: newest notices; the selected one drives a four-exchange fee comparison for its market.
function IntelDesk({ intel, t, locale, venues, onOpen }) {
  // Newest notice per exchange first (so selecting a row really changes the comparison), then fill by recency.
  const items = useMemo(() => {
    if (!intel) return [];
    const seen = new Set(); const first = []; const rest = [];
    for (const i of intel.items) (seen.has(i.venue) ? rest : (seen.add(i.venue), first)).push(i);
    return [...first, ...rest].slice(0, 3);
  }, [intel]);
  const [selId, setSelId] = useState(null);
  const sel = items.find((i) => i.id === selId) || items[0] || null;
  const perp = sel ? PERP_RE.test(sel.title) : false;
  const rows = compareRows(venues, perp);
  const checked = rows.filter((r) => r.mk != null);
  const best = checked.length ? checked.reduce((a, b) => (b.mk < a.mk ? b : a)) : null;
  const now = Date.now();
  return (
    <div className="h7-desk">
      <div className="h7-dh"><span>{intel ? t.deskAsOf(fmtAsOf(intel.generatedAt, locale)) : intel === false ? t.deskTitle : t.deskLoading}</span><span>{[...new Set(items.map((i) => NAMES[i.venue]))].join(" · ")}</span></div>
      <ul className="h7-dl" aria-busy={intel === null || undefined}>
        {intel ? items.map((i) => (
          <li key={i.id}>
            <button type="button" className="h7-dr" aria-pressed={sel?.id === i.id} onClick={() => setSelId(i.id)}>
              <span className={`h7-ic h7-ic-${i.category}`}>{t.inCat[i.category]}</span>
              <span className="h7-dv">{NAMES[i.venue]}</span>
              <span className="h7-dt2">{i.title}</span>
              <time dateTime={i.publishedAt}>{t.inAgo(now - Date.parse(i.publishedAt))}</time>
            </button>
          </li>
        )) : intel === null ? [0, 1, 2].map((k) => <li key={k} className="h7-dsk" aria-hidden="true"><i /><i /><i /></li>) : null}
      </ul>
      {intel === false && <p className="h7-dempty">{t.deskEmpty}</p>}
      <div className="h7-dh h7-dh2"><span>{perp ? t.shPerp : t.shSpot}</span><span>{t.shAfter}</span></div>
      <div className="h7-dc">
        {rows.map((r) => (
          <div key={r.slug} className={best?.slug === r.slug ? "best" : undefined}>
            <b><BrandMark slug={r.slug} compact priority />{r.name}</b>
            <span className="h7-dfig">{r.mk != null ? pct(r.mk) : "—"}</span>
            <small>{r.maker != null ? `${pct(r.maker)} / ${pct(r.taker)}` : t.unchecked}{r.maker != null && <> · <span className="h7-nw">{r.share ? `${t.rebate} ${Math.round(r.share * 100)}%` : t.pending}</span></>}</small>
          </div>
        ))}
      </div>
      <div className="h7-dfoot">
        {best && <Cta v={best} locale={locale} className="h7-btn h7-sm" placement="home-v7-desk">{t.deskOpen(best.name)} ↗</Cta>}
        {/* Rule 8: the commission line follows the sponsored action directly, before the secondary actions. */}
        <p className="h7-ddisc" data-disclosure-placement="home-desk">{t.t2b}</p>
        {sel && <button type="button" className="h7-iw" aria-haspopup="dialog" onClick={() => onOpen(sel)}>{t.inBtn}</button>}
        {sel && <a className="h7-ln" href={sel.url} target="_blank" rel="noopener noreferrer nofollow">{t.shSrc}</a>}
      </div>
    </div>
  );
}

function IntelBlock({ intel, t, locale, venues }) {
  const [open, setOpen] = useState(null);
  if (!intel) return null;
  const now = Date.now();
  const names = NAMES;
  const asOf = fmtAsOf(intel.generatedAt, locale);
  return (
    <section className="h7-in h7-intel" id="h7-intel" aria-label={t.inH}>
      <div className="h7-ih"><h2>{t.inH}</h2><p>{t.inSub}</p></div>
      <ul className="h7-il">
        {intel.items.slice(0, 8).map((i) => (
          <li key={i.id}>
            <span className={`h7-ic h7-ic-${i.category}`}>{t.inCat[i.category]}</span>
            <span className="h7-iv"><BrandMark slug={i.venue} compact />{names[i.venue]}</span>
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

  const calc = useMemo(() => {
    const rows = venues.map((v) => {
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
  }, [venues, vol, mode]);

  const [sheet, setSheet] = useState(null);
  const lowSpot = Math.min(...venues.filter((v) => v.maker != null).map((v) => v.maker));
  const verified = venues.filter((v) => v.maker != null).length;

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
    if (tg) { tg.style.opacity = p > 0.02 && p < 0.97 ? "1" : "0"; const cw = svgRef.current?.getBoundingClientRect().width || W * k, half = (tg.offsetWidth || 0) / 2; tg.style.left = `${Math.min(Math.max(x * k, half), cw - half)}px`; tg.style.top = `${y * k}px`; tg.textContent = `${Math.round(p * 12) || 1} ${t.mo} · ${b.name} ${t.tagPaid} ${usd(b.net * p)}`; }
    gapRef.current?.classList.toggle("on", p > 0.96);
  }, [calc.best, maxY, t]);
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
      <NoticeTicker intel={intel} t={t} />
      <section className="h7-hero" aria-label="NexuAlpha">
        <div className="h7-hc">
          <p className="h7-kick">{t.kick}</p>
          <h1>{t.h1[0]}<br />{t.h1[1][0]}<em>{t.h1[1][1].replace("{max}", String(HOME_REBATE_MAX_PCT))}</em>{t.h1[1][2]}{t.h1[2] ? <><br />{t.h1[2]}</> : null}</h1>
          <p className="h7-sub">{t.lead}</p>
          <div className="h7-cta"><a className="h7-btn h7-ol" href="#h7-intel">{t.ctaAll} ↓</a><a className="h7-ln" href="#h7-calc">{t.ctaCmp}</a></div>
          <p className="h7-cta-disc">{t.t2b}</p>
          <dl className="h7-stats">
            <div><dd>{verified}</dd><dt>{t.statVenues}</dt></div>
            {Number.isFinite(lowSpot) && <div><dd>{pct(lowSpot)}</dd><dt>{t.statLow}</dt></div>}
            <div><dd>{supportedLocales.length}</dd><dt>{t.statLangs}</dt></div>
          </dl>
        </div>
        <IntelDesk intel={intel} t={t} locale={locale} venues={venues} onOpen={setSheet} />
        {sheet && <IntelSheet item={sheet} venues={venues} t={t} locale={locale} onClose={() => setSheet(null)} />}
      </section>

      <div className="h7-trust"><div>{t.t1}<span>{t.t1b}</span></div><div>{t.t2}<span>{t.t2b}</span></div><div>{t.t3}<span>{t.t3b}</span></div></div>

      <IntelBlock intel={intel} t={t} locale={locale} venues={venues} />

      <section className="h7-dk h7-story" ref={storyRef} aria-label={t.storyH}>
        <div className="h7-in h7-pin">
          <h2>{t.storyH}</h2>
          <div className="h7-chart" ref={chartRef}>
            <svg ref={svgRef} viewBox={`0 0 ${W} ${HH}`} role="img" aria-label={t.storyH}>
              {[0, 1, 2, 3, 4].map((g) => <g key={g}><line x1={L} x2={W - R} y1={Y(maxY * g / 4)} y2={Y(maxY * g / 4)} className="h7-gl" /><text x={L - 8} y={Y(maxY * g / 4) + 4} textAnchor="end" className={`h7-ax h7-ax-y${g ? "" : " h7-ax-0"}`}>{usd(maxY * g / 4)}</text></g>)}
              {[0, 3, 6, 9, 12].map((m) => <text key={m} x={X(m)} y={HH - 10} textAnchor="middle" className="h7-ax">{m ? `${m} ${t.mo}` : t.y0}</text>)}
              {calc.best && <>
                <path d={`M${X(0)} ${Y(0)} L${X(12)} ${Y(calc.best.gross)}`} className="h7-lnp h7-ghost" stroke="#6B717B" aria-hidden="true" />
                <path d={`M${X(0)} ${Y(0)} L${X(12)} ${Y(calc.best.net)}`} className="h7-lnp h7-ghost" stroke="#1FE0C0" aria-hidden="true" />
                <path ref={loRef} d={`M${X(0)} ${Y(0)} L${X(12)} ${Y(calc.best.gross)}`} className="h7-lnp" stroke="#6B717B" pathLength="1" strokeDasharray="1" />
                <path ref={lbRef} d={`M${X(0)} ${Y(0)} L${X(12)} ${Y(calc.best.net)}`} className="h7-lnp" stroke="#1FE0C0" pathLength="1" strokeDasharray="1" />
                <circle ref={dotRef} r="7" cx={X(12)} cy={Y(calc.best.net)} fill="#1FE0C0" stroke="#0C0D10" strokeWidth="4" />
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
      <p className="h7-in h7-foot">{t.foot(FACTS_AS_OF).replace("{max}", String(HOME_REBATE_MAX_PCT))}</p>
    </div>
  );
}

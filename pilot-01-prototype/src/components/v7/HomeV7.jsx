// Home v7: one number as the signature visual, a dark scroll story, and one row per exchange that goes straight to the
// official sign-up. Reads fees from exchange-facts.js and the registration link/code from publicCtaForVenue (same source as
// the directory), so invite codes, hrefs and rel attributes are never typed here.
import { lazy, useEffect, useMemo, useRef, useState } from "react";
import { feeFact } from "../../data/exchange-facts.js";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { localizedHref } from "../../data/locale-routing.js";
import { HOME_AUTO_SETTLE, HOME_SETTLE, homePartnersFor, homePushFor, homeRebateMaxPctFor } from "../../data/home-rebate-tiers.js";
import { TelegramAlertsStrip } from "../v3/TelegramAlertsStrip.jsx";
import { partnerRebateShare } from "../../data/partner-benefit-status.js";
import { formatPercent, replaceMaxPercent } from "../../data/format-percent.js";
import { h7Copy, h7IsFallback } from "./home7-copy.js";
import { heroCopyFor, useHomeHeroVariant } from "./home7-hero-variants.js";
import { h7NeutralCopy } from "./home7-neutral-copy.js";
import { jurisdictionPromotionBan } from "../../data/partner-geo-policy.js";
import { isNeutralCtaLocale } from "../../data/locale-policy.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import { DeferUntilVisible } from "../shared/DeferUntilVisible.jsx";
import { academyShellCopy } from "../../data/academy.js";
import { Cta, Roll, nameOf, reduced, usd } from "./home7-shared.jsx";
import "../../styles/v7/home7.css";

// Below the first viewport (calculator, funding board, announcement stream, Telegram): the server renders the module
// inline; the browser fetches its chunk only when the calculator scrolls near (perf lane 2026-10-11). The eager glob is
// dropped from browser builds by vite.config.mjs (nexualpha-client-drops-ssr-eager-glob).
const ssrHomeBelowModules = import.meta.env.SSR ? import.meta.glob(["./home7-below.jsx"], { eager: true }) : {};
let homeBelowChunk;
const loadHomeBelow = () => (homeBelowChunk ??= import("./home7-below.jsx"));
const HomeBelowFold = import.meta.env.SSR ? ssrHomeBelowModules["./home7-below.jsx"].HomeBelowFold : lazy(() => loadHomeBelow().then((m) => ({ default: m.HomeBelowFold })));

// Academy teaser (owner 2026-10-12): one compact row that sends newcomers to the 24-lesson course on our own site.
function AcademyTeaser({ locale }) {
  const a = academyShellCopy(locale);
  return <section className="h7-in h7-academy" aria-labelledby="h7-academy-h">
    <a className="h7-academy-card" href={localizedHref("/academy", { locale })}>
      <img src="/brand/academy/nexubo-wave-hello.svg" alt="" width="88" height="88" loading="lazy" decoding="async" />
      <span className="h7-academy-text">
        <span className="h7-academy-kick">{a.brand}</span>
        <h2 id="h7-academy-h">{a.homeTitle}</h2>
        <span className="h7-academy-body">{a.homeBody}</span>
      </span>
      <span className="h7-academy-go">{a.homeCta}<span aria-hidden="true" className="h7-academy-arrow">→</span></span>
    </a>
  </section>;
}

// Owner (2026-10-10): show perpetual-contract fees by default; spot stays one tap away.
// Partners a market may not be offered (Türkiye: Bitget, SPK list) are left out of the whole home, not just unlinked.
// In a no-promotion market (Vietnam) every venue keeps its fees but carries no rebate share, code or sign-up link.
function useVenues(locale, product, market, banned) {
  return useMemo(() => homePartnersFor(locale, market).map((slug) => {
    const f = feeFact(slug, product);
    const cta = publicCtaForVenue(slug, locale, market);
    if (banned) {
      return { slug, name: nameOf(slug), maker: f.state === "checked" && Number.isFinite(f.maker) && Number.isFinite(f.taker) ? f.maker : null, taker: f.state === "checked" && Number.isFinite(f.maker) && Number.isFinite(f.taker) ? f.taker : null, share: null, code: null, url: null, open: false };
    }
    const checked = f.state === "checked" && Number.isFinite(f.maker) && Number.isFinite(f.taker);
    return {
      slug, name: nameOf(slug), maker: checked ? f.maker : null, taker: checked ? f.taker : null,
      share: partnerRebateShare(slug), code: cta.hasReferral ? cta.inviteCode : null,
      url: cta.registrationUrl, open: Boolean(cta.hasReferral && /^https:\/\//i.test(cta.registrationUrl || "")),
    };
  }), [locale, product, market, banned]);
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
  // React 19 treats `inert` as a boolean prop: an empty-string value renders nothing and left the hidden dock in the Tab order.
  return (
    <div className={`h7-dock${on ? " on" : ""}`} {...(on ? {} : { inert: true, "aria-hidden": "true" })}>
      <label className="h7-dock-pick"><span className="h7-sr">{t.lgPick}</span>
        <select value={sel.slug} onChange={(e) => setPick(e.target.value)}>{rebated.map((r) => <option key={r.slug} value={r.slug}>{r.name} · {t.upTo} {formatPercent(locale, Math.round(r.share * 100))}</option>)}</select>
      </label>
      <Cta v={sel} locale={locale} className={`h7-btn h7-dock-go h7-go--${sel.slug}`} placement="home-v7-dock"><span>{t.dockGo}</span></Cta>
    </div>
  );
}


export function HomeV7({ locale, market, movers, fundingFeed, venues: _catalog, initialOfficialAnnouncements }) {
  // Owner 2026-10-13 (legal): Vietnam (vi pages, VN market) is information-only — no rebate ledger, code or sign-up.
  // Neutral locales (locale-policy.js: ru, ar, zh-Hant, ur, uk, vi) read the same information-only home (lead 2026-10-13).
  const banned = isNeutralCtaLocale(locale) || Boolean(jurisdictionPromotionBan({ locale, market }));
  const t = banned ? { ...h7Copy(locale), ...h7NeutralCopy(locale) } : h7Copy(locale);
  // Hero copy experiment (X5): the variant comes from the SSR/hydration context, never from a client-side swap.
  const heroVariant = useHomeHeroVariant();
  const heroText = banned ? t : heroCopyFor(t, locale, heroVariant);
  const [product, setProduct] = useState("perp");
  const venues = useVenues(locale, product, market, banned);
  const maxPct = homeRebateMaxPctFor(locale, market);
  const [vol, setVol] = useState(100000);
  const [mode, setMode] = useState("taker");

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
  const rebated = useMemo(() => homePushFor(locale, market).map((slug) => calc.rows.find((r) => r.slug === slug && r.share)).filter(Boolean), [calc, locale, market]);
  const [pickSlug, setPick] = useState(null);
  // The SSR/LCP figures are already final. Animate the spring only after a visitor picks a venue.
  const animateLedgerNudge = pickSlug !== null;
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

  return (
    <div className="h7" {...(h7IsFallback(locale) ? { lang: "en", dir: "ltr" } : {})}>
      <section className="h7-hero" ref={heroRef} aria-label="NexuAlpha" {...(heroVariant === "b" ? { "data-hero-variant": "b" } : {})} {...(banned ? { "data-neutral": "" } : {})}>
        <canvas ref={cvRef} className="h7-fl" aria-hidden="true" />
        <div className="h7-hc">
          <p className="h7-kick">{t.kick}</p>
          <h1><span className="h7-h1l">{heroText.h1a}</span><br /><span className="h7-h1l">{banned ? heroText.h1b : heroText.h1b.split("{max}%").map((part, i) => i ? <span key={i}><em className="h7-h1n">{formatPercent(locale, maxPct)}</em>{part}</span> : <span key={i}>{part.replace(/ $/, "\u00a0")}</span>)}</span></h1>
          <p className="h7-sub">{heroText.sub}</p>
          <div className="h7-cta">
            {banned
              ? <a className="h7-btn h7-hero-go" href={localizedHref("/exchanges", { locale })}>{t.heroGo}</a>
              : <a className="h7-btn h7-hero-go" href="#h7-desk" onClick={(e) => { const go = document.querySelector(".h7-lg-go"); if (go) { e.preventDefault(); document.getElementById("h7-desk")?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" }); go.focus({ preventScroll: true }); } }}>{t.heroGo}</a>}
            <a className="h7-ln h7-ln-down" href="#h7-calc">{t.calcLink}</a>
          </div>
        </div>

        {!banned && (
        <aside className="h7-lg" id="h7-desk" aria-label={t.lgTitle} onPointerMove={spot} data-pick={sel.slug}>
          <div className="h7-lg-tabs" role="group" aria-label={t.lgPick} style={{ "--n": rebated.length }}>
            {rebated.map((r, i) => <button key={r.slug} ref={(e) => { pillRefs.current[i] = e; }} type="button" data-brand={r.slug} aria-pressed={r.slug === sel.slug} onClick={() => setPick(r.slug)}><BrandMark slug={r.slug} compact /><span>{r.name}</span><b>{t.upTo} {formatPercent(locale, Math.round(r.share * 100))}</b>{r.share === topShare && rebated.length > 1 ? <i>{t.lgTop}</i> : null}</button>)}
          </div>
          <div className="h7-lg-max">
            <p className="h7-num" ref={numRef}><span className="h7-sr">{t.lgShare(sel.name)} </span>{formatPercent(locale, 1).startsWith("%") && <span>%</span>}<Roll value={Math.round(sel.share * 100)} fmt={(n) => String(Math.round(n))} nudge={sel.slug} animateNudge={animateLedgerNudge} />{!formatPercent(locale, 1).startsWith("%") && <span>%</span>}</p>
            <div className="h7-lg-who"><b>{t.lgShare(sel.name)}</b>{auto && <span className="h7-auto">{t.lgAuto}</span>}{auto && HOME_SETTLE[sel.slug] && <span className="h7-auto h7-auto--cad">{HOME_SETTLE[sel.slug] === "hourly" ? t.settleH : t.settleD}</span>}</div>
          </div>
          <p className="h7-lg-top"><span className="h7-dot" aria-hidden="true" />{t.lgEst}<span className="h7-lg-vol">{t.lgVol(usd(vol), `${product === "perp" ? t.perpL : t.spotL}${t.sep}${mode === "maker" ? t.maker : t.taker}`)}</span></p>
          <dl className="h7-lg-rows">
            <div><dt>{t.lgWithout}</dt><dd><Roll value={sel.gross} nudge={sel.slug} animateNudge={animateLedgerNudge} /></dd></div>
            <div className="up"><dt>{t.lgBack}</dt><dd><Roll value={sel.save} prefix="+" nudge={sel.slug} animateNudge={animateLedgerNudge} /></dd></div>
            <div className="h7-lg-net"><dt>{t.lgNet}</dt><dd><Roll value={sel.net} nudge={sel.slug} animateNudge={animateLedgerNudge} /></dd></div>
          </dl>
          {sel.code && <p className="h7-lg-code"><span>{t.code}</span><code>{sel.code}</code><CopyCode code={sel.code} t={t} /></p>}
          <Cta v={sel} locale={locale} className={`h7-btn h7-lg-go h7-go--${sel.slug}`} placement="home-v7-hero"><span className="h7-go-l">{t.lgGo(sel.name)}</span>{sel.open ? <small className="h7-go-disclosure">{t.lgBuilt}</small> : null}</Cta>
        </aside>
        )}

        <div className="h7-strip">
          <p className="h7-strip-h">{replaceMaxPercent(t.cap(venues.length), locale, maxPct)}</p>
          <ul className="h7-pw" aria-label={t.pw(venues.length)}>
            {venues.map((v, i) => (
              <li key={v.slug}>
                <a href={localizedHref(banned ? `/exchanges/${v.slug}` : `/exchanges/${v.slug}#registration-path`, { locale })} ref={(e) => { srcRefs.current[i] = e; }} className={v.share ? "on" : undefined}>
                  <BrandMark slug={v.slug} compact priority={i < 4} /><span className="h7-pn">{v.name}</span>{v.share ? <small>{t.upTo} {formatPercent(locale, Math.round(v.share * 100))}</small> : null}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <TelegramAlertsStrip locale={locale} placement="home-telegram-alerts" className="tg-signal-strip--home" />

      <div className="h7-trust"><div>{t.t1}<span>{t.t1b}</span></div><div>{t.t2}<span>{t.t2b}</span></div><div>{t.t3}<span>{t.t3b}</span></div></div>


      <section className="h7-in h7-how" aria-labelledby="h7-how-h">
        <h2 id="h7-how-h">{t.howH}</h2>
        <ol className="h7-steps">
          {t.how.map(([h, b], i) => <li key={h}><span className="h7-sn" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span><h3>{h}</h3><p>{b}</p></li>)}
        </ol>
      </section>

      <AcademyTeaser locale={locale} />

      <DeferUntilVisible target="#h7-flash" prefetch={loadHomeBelow}>
        <HomeBelowFold t={t} locale={locale} market={market} movers={movers} fundingFeed={fundingFeed} vol={vol} setVol={setVol} mode={mode} setMode={setMode} product={product} setProduct={setProduct} calc={calc} priced={priced} initialOfficialAnnouncements={initialOfficialAnnouncements} />
      </DeferUntilVisible>
      {/* Owner 2026-10-13: no fine print or commission wording in the page body; disclosures live in the site footer. */}
      <MobileDock heroRef={heroRef} sel={sel} rebated={rebated} setPick={setPick} t={t} locale={locale} />
    </div>
  );
}

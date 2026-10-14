import { beginnerPath } from "../../data/beginner-routes.js";
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
import { HeroExchangeSelector } from "./HeroExchangeSelector.jsx";
import { RebateNumber } from "./RebateNumber.jsx";
import { jurisdictionPromotionBan } from "../../data/partner-geo-policy.js";
import { isNeutralCtaLocale } from "../../data/locale-policy.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import { DeferUntilVisible } from "../shared/DeferUntilVisible.jsx";
import { academyShellCopy } from "../../data/academy.js";
import { Cta, Roll, nameOf, reduced, usd } from "./home7-shared.jsx";
import "../../styles/v7/home7.css";
import "../../styles/v7/selector-owner.css";
import "../../styles/v7/terminal-owner.css";
import "../../styles/v7/movers-owner.css";

// Below the first viewport (calculator, funding board, announcement stream, Telegram): the server renders the module
// inline; the browser fetches its chunk only when the calculator scrolls near (perf lane 2026-10-11). The eager glob is
// dropped from browser builds by vite.config.mjs (nexualpha-client-drops-ssr-eager-glob).
const ssrHomeBelowModules = import.meta.env.SSR ? import.meta.glob(["./home7-below.jsx"], { eager: true }) : {};
const ssrHeroTerminalModules = import.meta.env.SSR ? import.meta.glob(["./HeroTerminal.jsx"], { eager: true }) : {};
let homeBelowChunk;
let heroTerminalChunk;
const loadHomeBelow = () => (homeBelowChunk ??= import("./home7-below.jsx"));
const loadHeroTerminal = () => (heroTerminalChunk ??= import("./HeroTerminal.jsx"));
const HomeBelowFold = import.meta.env.SSR ? ssrHomeBelowModules["./home7-below.jsx"].HomeBelowFold : lazy(() => loadHomeBelow().then((m) => ({ default: m.HomeBelowFold })));
const HeroTerminal = import.meta.env.SSR ? ssrHeroTerminalModules["./HeroTerminal.jsx"].HeroTerminal : lazy(() => loadHeroTerminal().then((m) => ({ default: m.HeroTerminal })));

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


export function HomeV7({ locale, market, movers, fundingFeed, venues: _catalog, initialOfficialAnnouncements, initialFlash, initialTicker }) {
  // Owner 2026-10-13 (legal): Vietnam (vi pages, VN market) is information-only — no rebate ledger, code or sign-up.
  // Neutral locales (locale-policy.js: ru, ar, zh-Hant, ur, uk, vi) read the same information-only home (lead 2026-10-13).
  const banned = isNeutralCtaLocale(locale) || Boolean(jurisdictionPromotionBan({ locale, market }));
  const t = banned ? { ...h7Copy(locale), ...h7NeutralCopy(locale) } : h7Copy(locale);
  // Hero copy experiment (X5): the variant comes from the SSR/hydration context, never from a client-side swap.
  const heroVariant = useHomeHeroVariant();
  const heroText = banned ? t : heroCopyFor(t, locale, heroVariant);
  // Keep the SSR clock in the HTML so a deferred client render reuses the same snapshot,
  // including homes without a seeded announcement feed.
  const [renderedAt] = useState(() => {
    const snapshot = typeof document !== "undefined" ? document.querySelector(".h7[data-rendered-at]")?.getAttribute("data-rendered-at") : null;
    return snapshot || new Date(Date.now()).toISOString();
  });
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

  const heroRef = useRef(null), pillRefs = useRef([]);

  return (
    <div className="h7" data-rendered-at={renderedAt} {...(h7IsFallback(locale) ? { lang: "en", dir: "ltr" } : {})}>
      <section className="h7-hero" ref={heroRef} aria-label="NexuAlpha" {...(heroVariant === "b" ? { "data-hero-variant": "b" } : {})} {...(banned ? { "data-neutral": "" } : {})}>
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
          {banned ? (
            <DeferUntilVisible target=".h7-terminal--neutral" rootMargin="20% 0px" prefetch={loadHeroTerminal}>
              <HeroTerminal locale={locale} selected={{ slug: "nexualpha", name: "NexuAlpha" }} initialTicker={initialTicker} neutral />
            </DeferUntilVisible>
          ) : null}
        </div>

        {!banned && (
        <aside className="h7-lg" id="h7-desk" aria-label={t.lgTitle} onPointerMove={spot} data-pick={sel.slug}>
          <HeroExchangeSelector locale={locale} market={market} venues={venues} rebated={rebated} selectedSlug={sel.slug} topShare={topShare} onPick={setPick} t={t} pillRefs={pillRefs} />
          <div className="h7-lg-max">
            <RebateNumber locale={locale} venue={sel} />
            <div className="h7-lg-who"><b>{t.lgShare(sel.name)}</b>{auto && <span className="h7-auto">{t.lgAuto}</span>}{auto && HOME_SETTLE[sel.slug] && <span className="h7-auto h7-auto--cad">{HOME_SETTLE[sel.slug] === "hourly" ? t.settleH : t.settleD}</span>}</div>
          </div>
          <p className="h7-lg-top"><span className="h7-dot" aria-hidden="true" />{t.lgEst}<span className="h7-lg-vol">{t.lgVol(usd(vol), `${product === "perp" ? t.perpL : t.spotL}${t.sep}${mode === "maker" ? t.maker : t.taker}`)}</span></p>
          <dl className="h7-lg-rows">
            <div><dt>{t.lgWithout}</dt><dd><Roll value={sel.gross} nudge={sel.slug} animateNudge={animateLedgerNudge} /></dd></div>
            <div className="up"><dt>{t.lgBack}</dt><dd><Roll value={sel.save} prefix="+" nudge={sel.slug} animateNudge={animateLedgerNudge} /></dd></div>
            <div className="h7-lg-net"><dt>{t.lgNet}</dt><dd><Roll value={sel.net} nudge={sel.slug} animateNudge={animateLedgerNudge} /></dd></div>
          </dl>
          {sel.code && <p className="h7-lg-code"><span>{t.code}</span><code>{sel.code}</code><CopyCode code={sel.code} t={t} /></p>}
          <Cta v={sel} locale={locale} className={`h7-btn h7-lg-go h7-go--${sel.slug}`} placement="home-v7-hero"><span className="h7-go-l">{t.lgGo(sel.name)}</span></Cta>
          <DeferUntilVisible target=".h7-terminal" rootMargin="20% 0px" prefetch={loadHeroTerminal}>
            <HeroTerminal locale={locale} selected={sel} estimate={sel.save} estimateLabel={t.lgBack} initialTicker={initialTicker} />
          </DeferUntilVisible>
        </aside>
        )}

        <div className="h7-strip">
          <p className="h7-strip-h">{replaceMaxPercent(t.cap(venues.length), locale, maxPct)}</p>
          <ul className="h7-pw" aria-label={t.pw(venues.length)}>
            {venues.map((v, i) => (
              <li key={v.slug}>
                <a href={localizedHref(banned ? `/exchanges/${v.slug}` : `/exchanges/${v.slug}#registration-path`, { locale })} className={v.share ? "on" : undefined}>
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

      <DeferUntilVisible target="#h7-flash, #h7-calc, #h7-funding, #h7-intel" prefetch={loadHomeBelow}>
        <HomeBelowFold renderedAt={renderedAt} t={t} locale={locale} market={market} movers={movers} fundingFeed={fundingFeed} vol={vol} setVol={setVol} mode={mode} setMode={setMode} product={product} setProduct={setProduct} calc={calc} priced={priced} initialOfficialAnnouncements={initialOfficialAnnouncements} initialFlash={initialFlash} />
      </DeferUntilVisible>
      {/* Owner 2026-10-13: no fine print or commission wording in the page body; disclosures live in the site footer. */}
      <MobileDock heroRef={heroRef} sel={sel} rebated={rebated} setPick={setPick} t={t} locale={locale} />
    </div>
  );
}

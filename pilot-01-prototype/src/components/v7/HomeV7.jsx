// Home v7: one number as the signature visual, a dark scroll story, and one row per exchange that goes straight to the
// official sign-up. Reads fees from exchange-facts.js and the registration link/code from publicCtaForVenue (same source as
// the directory), so invite codes, hrefs and rel attributes are never typed here.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { feeFact } from "../../data/exchange-facts.js";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { localizedHref } from "../../data/locale-routing.js";
import { HOME_AUTO_SETTLE, homePartnersFor, homePushFor, homeRebateMaxPctFor } from "../../data/home-rebate-tiers.js";
import { TelegramAlertsStrip } from "../v3/TelegramAlertsStrip.jsx";
import { partnerRebateShare } from "../../data/partner-benefit-status.js";
import { formatPercent } from "../../data/format-percent.js";
import { h7Copy, h7IsFallback, h7TurkeyCopy } from "./home7-copy.js";
import { heroCopyFor, useHomeHeroVariant } from "./home7-hero-variants.js";
import { h7NeutralCopy } from "./home7-neutral-copy.js";
import { isTurkeyPage, jurisdictionPromotionBan } from "../../data/partner-geo-policy.js";
import { isNeutralCtaLocale } from "../../data/locale-policy.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import { academyShellCopy } from "../../data/academy.js";
import { Cta, nameOf } from "./home7-shared.jsx";
import "../../styles/v7/home7.css";
import "../../styles/v7/selector-owner.css";
import "../../styles/v7/terminal-owner.css";
import "../../styles/v7/movers-owner.css";
import "../../styles/v7/flash-rail.css";

const ssrHomeBelowModules = import.meta.env.SSR ? import.meta.glob(["./home7-below.jsx"], { eager: true }) : {};
const ServerHomeBelowFold = import.meta.env.SSR ? ssrHomeBelowModules["./home7-below.jsx"].HomeBelowFold : null;
let homeBelowChunk;
const loadHomeBelow = () => (homeBelowChunk ??= Promise.all([import("./home7-below.jsx"), import("react-dom/client")]));
const ssrTerminalModules = import.meta.env.SSR ? import.meta.glob(["./HeroTerminal.jsx"], { eager: true }) : {};
const ServerHeroTerminal = import.meta.env.SSR ? ssrTerminalModules["./HeroTerminal.jsx"].HeroTerminal : null;
let terminalFrameChunk;
const loadTerminalFrame = () => (terminalFrameChunk ??= Promise.all([import("./HeroTerminal.jsx"), import("react-dom/client")]));

const PRIMARY_DEFAULT = Object.freeze(["bitget", "okx", "binance"]);
const PRIMARY_TR = Object.freeze(["okx", "binance", "bybit"]);

const MORE_LABELS = Object.freeze({
  en: "More",
  "zh-Hans": "更多",
  "zh-Hant": "更多",
  es: "Más",
  "pt-BR": "Mais",
  fr: "Plus",
  de: "Mehr",
  it: "Altro",
  ja: "その他",
  ko: "더보기",
  tr: "Daha",
  ru: "Еще",
  ar: "المزيد",
  id: "Lainnya",
  vi: "Thêm",
  ur: "مزید",
  uk: "Ще",
});

function moreLabel(locale) {
  const raw = String(locale || "en");
  return MORE_LABELS[raw] || MORE_LABELS[raw.split("-")[0]] || MORE_LABELS.en;
}

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

function BelowHydrationCommit({ children, onReady }) {
  useEffect(() => { onReady(); }, [onReady]);
  return children;
}

function StableHeroTerminal(props) {
  if (import.meta.env.SSR) return <div id="h7-terminal-root" className="hx-terminal-host"><ServerHeroTerminal {...props} /></div>;
  const host = useRef(null), root = useRef(null), initial = useRef(props), latest = useRef(props);
  latest.current = props;
  const [html] = useState(() => document.getElementById("h7-terminal-root")?.innerHTML || "");
  const frozen = useMemo(() => ({ __html: html }), [html]);
  const ready = useRef(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    let cancelled = false, near = false, idle = null;
    const start = () => {
      if (!near || cancelled || idle !== null || document.visibilityState !== "visible") return;
      const run = () => {
        idle = null;
        if (cancelled || document.visibilityState !== "visible") return;
        loadTerminalFrame().then(([mod, client]) => {
          if (cancelled || !host.current || root.current) return;
          ready.current = () => { if (!cancelled) setHydrated(true); };
          const element = <BelowHydrationCommit onReady={ready.current}><mod.HeroTerminal {...initial.current} /></BelowHydrationCommit>;
          if (html) root.current = client.hydrateRoot(host.current, element);
          else { root.current = client.createRoot(host.current); root.current.render(element); }
        });
      };
      idle = window.requestIdleCallback ? window.requestIdleCallback(run, { timeout: 2500 }) : window.setTimeout(run, 0);
    };
    const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver(entries => { near = entries.some(entry => entry.isIntersecting); start(); }, { rootMargin: "200px 0px" }) : null;
    const figure = host.current?.firstElementChild;
    if (observer && figure) observer.observe(figure); else { near = true; start(); }
    document.addEventListener("visibilitychange", start);
    return () => {
      cancelled = true; observer?.disconnect(); document.removeEventListener("visibilitychange", start);
      if (idle !== null) { window.cancelIdleCallback?.(idle); window.clearTimeout(idle); }
      const child = root.current; root.current = null; if (child) setTimeout(() => child.unmount(), 0);
    };
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    loadTerminalFrame().then(([mod]) => root.current?.render(<BelowHydrationCommit onReady={ready.current}><mod.HeroTerminal {...latest.current} /></BelowHydrationCommit>));
  }, [hydrated, props.locale, props.selected, props.estimate, props.neutral]);
  return <div id="h7-terminal-root" className="hx-terminal-host" ref={host} suppressHydrationWarning dangerouslySetInnerHTML={frozen} />;
}

function StableHomeBelowFold(props) {
  if (import.meta.env.SSR) {
    return <div id="h7-below-root"><ServerHomeBelowFold {...props} /></div>;
  }
  const hostRef = useRef(null);
  const rootRef = useRef(null);
  const readyRef = useRef(null);
  const elementRef = useRef(null);
  const hydratedRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);
  elementRef.current = props;
  const [serverHtml] = useState(() => (typeof document === "undefined" ? "" : document.getElementById("h7-below-root")?.innerHTML || ""));
  // The parent must not rewrite the island's live DOM when its own controls update.
  const frozenHtml = useMemo(() => ({ __html: serverHtml }), [serverHtml]);

  useEffect(() => {
    let cancelled = false;
    loadHomeBelow().then(([mod, client]) => {
      if (cancelled || !hostRef.current) return;
      const markHydrated = () => {
        if (cancelled || hydratedRef.current) return;
        hydratedRef.current = true;
        hostRef.current?.setAttribute("data-hydrated", "true");
        setHydrated(true);
      };
      readyRef.current = markHydrated;
      const element = <BelowHydrationCommit onReady={markHydrated}><mod.HomeBelowFold {...elementRef.current} /></BelowHydrationCommit>;
      if (serverHtml) rootRef.current = client.hydrateRoot(hostRef.current, element);
      else { rootRef.current = client.createRoot(hostRef.current); rootRef.current.render(element); }
    });
    return () => {
      cancelled = true;
      const root = rootRef.current;
      rootRef.current = null;
      hydratedRef.current = false;
      if (root) setTimeout(() => root.unmount(), 0);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    loadHomeBelow().then(([mod]) => {
      rootRef.current?.render(<BelowHydrationCommit onReady={readyRef.current}><mod.HomeBelowFold {...props} /></BelowHydrationCommit>);
    });
  }, [hydrated, props.renderedAt, props.t, props.locale, props.market, props.movers, props.fundingFeed, props.vol, props.mode, props.product, props.calc, props.priced, props.initialOfficialAnnouncements, props.initialFlash]);

  return <div id="h7-below-root" ref={hostRef} suppressHydrationWarning dangerouslySetInnerHTML={frozenHtml} />;
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
  const timer = useRef(null);
  const currentCode = useRef(code);
  currentCode.current = code;
  useEffect(() => { setDone(false); return () => clearTimeout(timer.current); }, [code]);
  const copy = () => {
    const ok = () => {
      if (currentCode.current !== code) return;
      clearTimeout(timer.current); setDone(true); timer.current = setTimeout(() => setDone(false), 2000);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(code).then(ok, () => {});
    else {
      const input = document.createElement("textarea");
      input.value = code; input.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.append(input); input.select();
      try { if (document.execCommand?.("copy")) ok(); } finally { input.remove(); }
    }
  };
  return <button type="button" className={`h7-cc${done ? " done" : ""}`} onClick={copy} aria-live="polite">{done ? t.copied : t.copy}</button>;
}

function HeroRebate({ locale, venue, autoLabel, t }) {
  // Static final value (owner 2026-10-14, hotfix #231): no count-up of any kind; the digits are real text so the
  // figure reads "60%" everywhere, and the gradient sits on each glyph run (never on the parent) so iPhone Safari keeps the %.
  const target = Math.max(0, Math.round((venue?.share || 0) * 100));
  const percentBefore = formatPercent(locale, 1).startsWith("%");
  const feeLabel = locale === "zh-Hans" ? `${venue.name} 最高返还手续费`
    : locale === "zh-Hant" ? `${venue.name} 最高返還手續費` : t.lgShare(venue.name);
  const label = `${feeLabel} ${formatPercent(locale, target)}`;

  return (
    <div className="hx-rate" data-pick={venue?.slug || "none"}>
      <span className="hx-rate-logo" aria-hidden="true"><BrandMark slug={venue?.slug} compact priority /></span>
      <p className="hx-rate-num h7-rebate-value" aria-label={label} data-final-value={target}>
        {percentBefore && <span className="hx-rate-pct" aria-hidden="true">%</span>}
        <span className="hx-rate-n" aria-hidden="true">{String(target)}</span>
        {!percentBefore && <span className="hx-rate-pct" aria-hidden="true">%</span>}
      </p>
      <p className="hx-rate-label">{feeLabel}{autoLabel ? <span className="hx-chip">{autoLabel}</span> : null}</p>
    </div>
  );
}

function MoreRows({ overflow, selectableBySlug, selectedSlug, onPick, locale, t }) {
  return overflow.map((venue) => {
    const selectable = selectableBySlug.get(venue.slug);
    const labelVenue = selectable || venue;
    const share = labelVenue.share ? Math.round(labelVenue.share * 100) : null;
    if (selectable) {
      return (
        <button
          key={venue.slug}
          type="button"
          role="menuitemradio"
          aria-checked={venue.slug === selectedSlug}
          onClick={(event) => {
            onPick(venue.slug);
            event.currentTarget.closest("[popover]")?.hidePopover?.();
            event.currentTarget.closest("details")?.removeAttribute("open");
          }}
        >
          <BrandMark slug={venue.slug} compact />
          <span>{venue.name}</span>
          {share != null ? <b>{t.upTo} {formatPercent(locale, share)}</b> : null}
        </button>
      );
    }
    return (
      <a key={venue.slug} role="menuitem" href={localizedHref(`/exchanges/${venue.slug}`, { locale })}>
        <BrandMark slug={venue.slug} compact />
        <span>{venue.name}</span>
        {share != null ? <b>{t.upTo} {formatPercent(locale, share)}</b> : null}
      </a>
    );
  });
}

function HeroExchangeSwitcher({ locale, market, venues, rebated, selectedSlug, onPick, t }) {
  const wrapRef = useRef(null);
  const tabRefs = useRef(new Map());
  const [indicator, setIndicator] = useState({ x: 3, w: 0 });
  const previousIndicator = useRef(indicator);
  const selectableBySlug = useMemo(() => new Map(rebated.map((venue) => [venue.slug, venue])), [rebated]);
  const venueBySlug = useMemo(() => new Map(venues.map((venue) => [venue.slug, venue])), [venues]);
  const primaryOrder = market === "TR" || /^tr(?:-|$)/i.test(String(locale || "")) ? PRIMARY_TR : PRIMARY_DEFAULT;
  const primary = useMemo(() => primaryOrder.map((slug) => selectableBySlug.get(slug) || venueBySlug.get(slug)).filter(Boolean), [primaryOrder, selectableBySlug, venueBySlug]);
  const primarySlugs = useMemo(() => new Set(primary.map((venue) => venue.slug)), [primary]);
  const overflow = useMemo(() => venues.filter((venue) => !primarySlugs.has(venue.slug)), [venues, primarySlugs]);
  const selectedOverflow = overflow.find((venue) => venue.slug === selectedSlug);
  const more = moreLabel(locale);

  useEffect(() => {
    const wrap = wrapRef.current;
    const tab = tabRefs.current.get(primarySlugs.has(selectedSlug) ? selectedSlug : "more");
    if (!wrap || !tab) return;
    const measure = () => {
      const wr = wrap.getBoundingClientRect();
      const tr = tab.getBoundingClientRect();
      setIndicator({ x: tr.left - wr.left, w: tr.width });
    };
    measure();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(wrap);
    return () => observer?.disconnect();
  }, [primarySlugs, selectedSlug, overflow.length]);

  useLayoutEffect(() => {
    const before = previousIndicator.current;
    previousIndicator.current = indicator;
    if (!before.w || !indicator.w || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    wrapRef.current?.querySelector(".hx-tab-ind")?.animate?.([
      { transform: `translateX(${before.x}px) scaleX(${before.w / indicator.w})` },
      { transform: `translateX(${indicator.x}px) scaleX(1)` },
    ], { duration: 320, easing: "cubic-bezier(.16,1,.3,1)" });
  }, [indicator]);

  return (
    <div className="hx-tabs" ref={wrapRef} role="group" aria-label={t.lgPick} style={{ "--hx-tab-x": `${indicator.x}px`, "--hx-tab-w": `${indicator.w}px` }}>
      <span className="hx-tab-ind" aria-hidden="true" />
      {primary.map((venue) => {
        const selectable = selectableBySlug.get(venue.slug);
        const selected = venue.slug === selectedSlug;
        if (!selectable) {
          return (
            <a key={venue.slug} className="hx-tab" href={localizedHref(`/exchanges/${venue.slug}`, { locale })}>
              <BrandMark slug={venue.slug} compact />
              <span>{venue.name}</span>
            </a>
          );
        }
        return (
          <button key={venue.slug} ref={(node) => { if (node) tabRefs.current.set(venue.slug, node); }} className="hx-tab" type="button" aria-pressed={selected} onClick={() => onPick(venue.slug)}>
            <BrandMark slug={venue.slug} compact />
            <span>{venue.name}</span>
          </button>
        );
      })}
      {overflow.length ? (
        <>
          <button ref={(node) => { if (node) tabRefs.current.set("more", node); }} className="hx-more" type="button" popoverTarget="hx-more" aria-pressed={selectedOverflow ? "true" : "false"}>
            {selectedOverflow ? <BrandMark slug={selectedOverflow.slug} compact /> : null}
            <span>{selectedOverflow?.name || more}</span><span aria-hidden="true">▾</span>
          </button>
          <div id="hx-more" className="hx-more-pop" popover="auto" role="menu" aria-label={more}>
            <MoreRows overflow={overflow} selectableBySlug={selectableBySlug} selectedSlug={selectedSlug} onPick={onPick} locale={locale} t={t} />
          </div>
          <details className="hx-more-fallback" onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); event.preventDefault();
          }}>
            <summary><span>{selectedOverflow?.name || more}</span><span aria-hidden="true">▾</span></summary>
            <div className="hx-more-pop" role="menu" aria-label={more}>
              <MoreRows overflow={overflow} selectableBySlug={selectableBySlug} selectedSlug={selectedSlug} onPick={onPick} locale={locale} t={t} />
            </div>
          </details>
        </>
      ) : null}
    </div>
  );
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
        <select value={sel.slug} onChange={(e) => setPick(e.target.value)}>{rebated.map((r) => <option key={r.slug} value={r.slug}>{r.name} · {formatPercent(locale, Math.round(r.share * 100))}</option>)}</select>
      </label>
      <Cta v={sel} locale={locale} className={`h7-btn h7-dock-go h7-go--${sel.slug}`} placement="home-v7-dock"><span>{t.dockGo}</span></Cta>
    </div>
  );
}


export function HomeV7({ locale, market, movers, fundingFeed, venues: _catalog, initialOfficialAnnouncements, initialFlash, initialTicker }) {
  // Owner 2026-10-13 (legal): Vietnam (vi pages, VN market) is information-only — no rebate ledger, code or sign-up.
  // Neutral locales (locale-policy.js: ru, ar, zh-Hant, ur, uk, vi) read the same information-only home (lead 2026-10-13).
  const banned = isNeutralCtaLocale(locale) || Boolean(jurisdictionPromotionBan({ locale, market }));
  const baseCopy = banned ? { ...h7Copy(locale), ...h7NeutralCopy(locale) } : h7Copy(locale);
  const t = isTurkeyPage({ locale, market }) ? h7TurkeyCopy(baseCopy, locale) : baseCopy;
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
  const sel = rebated.find((r) => r.slug === pickSlug) || rebated[0] || top;
  const auto = sel?.slug ? HOME_AUTO_SETTLE.includes(sel.slug) : false;
  // The terminal's stated scenario stays $100K/month, perpetual taker even if the lower calculator changes.
  const terminalFee = feeFact(sel?.slug, "perp");
  const terminalEstimate = terminalFee.state === "checked" && Number.isFinite(terminalFee.taker)
    ? 100000 * 12 * terminalFee.taker / 100 * (sel?.share || 0) : undefined;

  const heroRef = useRef(null);
  const h1b = banned ? heroText.h1b : heroText.h1b.replace("{max}%", formatPercent(locale, maxPct));

  return (
    <div className="h7" data-rendered-at={renderedAt} {...(h7IsFallback(locale) ? { lang: "en", dir: "ltr" } : {})}>
      <section className="h7-hero" ref={heroRef} aria-label="NexuAlpha" {...(heroVariant === "b" ? { "data-hero-variant": "b" } : {})} {...(banned ? { "data-neutral": "" } : {})}>
        <div className="h7-hc">
          <h1><span className="h7-h1l">{heroText.h1a}</span><br /><span className="h7-h1l">{h1b}</span></h1>
        </div>

        {!banned && (
        <aside className="h7-lg hx-hero-panel" id="h7-desk" aria-label={t.lgTitle} data-pick={sel.slug}>
          <HeroExchangeSwitcher locale={locale} market={market} venues={venues} rebated={rebated} selectedSlug={sel.slug} onPick={setPick} t={t} />
          <HeroRebate locale={locale} venue={sel} autoLabel={auto ? t.lgAuto : ""} t={t} />
          {sel.code && <p className="hx-code"><span>{t.code}</span><code>{sel.code}</code><CopyCode code={sel.code} t={t} /></p>}
          <Cta v={sel} locale={locale} className={`h7-btn h7-lg-go hx-go h7-go--${sel.slug}`} placement="home-v7-hero"><span className="h7-go-l">{t.lgGo(sel.name)}</span></Cta>
        </aside>
        )}
        <StableHeroTerminal locale={locale} selected={banned ? { slug: "nexualpha", name: "NexuAlpha" } : sel} estimate={banned ? undefined : terminalEstimate} initialTicker={initialTicker} neutral={banned} />
      </section>

      <section className="h7-strip" aria-label={t.pw(venues.length)}>
        <ul className="h7-pw">
          {venues.map((v, i) => (
            <li key={v.slug}>
              <a href={localizedHref(banned ? `/exchanges/${v.slug}` : `/exchanges/${v.slug}#registration-path`, { locale })} className={v.share ? "on" : undefined}>
                <BrandMark slug={v.slug} compact priority={i < 4} /><span className="h7-pn">{v.name}</span>{v.share ? <small>{t.upTo} {formatPercent(locale, Math.round(v.share * 100))}</small> : null}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <TelegramAlertsStrip locale={locale} placement="home-telegram-alerts" className="tg-signal-strip--home" />

      <section className="h7-in h7-how" aria-labelledby="h7-how-h">
        <h2 id="h7-how-h">{t.howH}</h2>
        <ol className="h7-steps">
          {t.how.map(([h, b], i) => <li key={h}><span className="h7-sn" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span><h3>{h}</h3><p>{b}</p></li>)}
        </ol>
      </section>

      <AcademyTeaser locale={locale} />

      <StableHomeBelowFold renderedAt={renderedAt} t={t} locale={locale} market={market} movers={movers} fundingFeed={fundingFeed} vol={vol} setVol={setVol} mode={mode} setMode={setMode} product={product} setProduct={setProduct} calc={calc} priced={priced} initialOfficialAnnouncements={initialOfficialAnnouncements} initialFlash={initialFlash} />
      {/* Owner 2026-10-13: no fine print or commission wording in the page body; disclosures live in the site footer. */}
      <MobileDock heroRef={heroRef} sel={sel} rebated={rebated} setPick={setPick} t={t} locale={locale} />
    </div>
  );
}

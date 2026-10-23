// Home v7: one number as the signature visual, a dark scroll story, and one row per exchange that goes straight to the
// official sign-up. Reads fees from exchange-facts.js and the registration link/code from publicCtaForVenue (same source as
// the directory), so invite codes, hrefs and rel attributes are never typed here.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { feeFact } from "../../data/exchange-facts.js";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { localizedHref } from "../../data/locale-routing.js";
import { HOME_AUTO_SETTLE, homePartnersFor, homePushFor, homeRebateMaxPctFor } from "../../data/home-rebate-tiers.js";
import { TelegramAlertsStrip } from "../v3/TelegramAlertsStrip.jsx";
import { partnerRebateShare } from "../../data/partner-benefit-status.js";
import { formatPercent } from "../../data/format-percent.js";
import { FeeReceipt } from "./home7-receipt.jsx";
import { h7Copy, h7IsFallback, h7TurkeyCopy } from "./home7-copy.js";
import { HERO_VOLUME_STEPS, HERO_VOLUME_DEFAULT_STEP, HERO_VOLUME_TICKS, heroRebateAmount, heroMoneyParts, heroMoneyText, heroMoneyWidthEm, heroLineGap, heroSay, heroSayTokens, heroVolumeShort, heroVolumeText } from "./home7-hero-volume.js";
import { h7NeutralCopy, neutralHeroCopy } from "./home7-neutral-copy.js";
import { isTurkeyPage, jurisdictionPromotionBan } from "../../data/partner-geo-policy.js";
import { isNeutralCtaLocale } from "../../data/locale-policy.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import { academyShellCopy } from "../../data/academy.js";
import { Cta, nameOf } from "./home7-shared.jsx";
import { DeferUntilVisible } from "../shared/DeferUntilVisible.jsx";
import "../../styles/v7/home7.css";
import "../../styles/v7/selector-owner.css";
import "../../styles/v7/movers-owner.css";

const ssrHomeBelowModules = import.meta.env.SSR ? import.meta.glob(["./home7-below.jsx"], { eager: true }) : {};
const ServerHomeBelowFold = import.meta.env.SSR ? ssrHomeBelowModules["./home7-below.jsx"].HomeBelowFold : null;
let homeBelowChunk;
const loadHomeBelow = () => (homeBelowChunk ??= Promise.all([import("./home7-below.jsx"), import("react-dom/client")]));

// Tokenized US stocks strip (owner 2026-10-15): server-rendered with the page, its chunk loads when it nears the viewport.
const ssrTsStripModules = import.meta.env.SSR ? import.meta.glob(["../tokenized-stocks/HomeTokenizedStrip.jsx"], { eager: true }) : {};
const loadTsStrip = () => import("../tokenized-stocks/HomeTokenizedStrip.jsx");
// Owner 2026-10-22: the whale board and the latest-analysis block swapped places. The board is re-exported by the
// below-fold chunk (its own lazy chunk pulled whale data into core-shared and broke the 350 KB home budget).
const MoversBoard = import.meta.env.SSR
  ? ssrHomeBelowModules["./home7-below.jsx"].MoversBoard
  : React.lazy(() => loadHomeBelow().then(([mod]) => ({ default: mod.MoversBoard })));
const TokenizedStrip = import.meta.env.SSR
  ? ssrTsStripModules["../tokenized-stocks/HomeTokenizedStrip.jsx"].HomeTokenizedStrip
  : React.lazy(() => loadTsStrip().then((mod) => ({ default: mod.HomeTokenizedStrip })));

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
// "Where the fee goes" step glyphs (locales without the reviewed receipt): compare, sign up, rebate back.
const STEP_ICONS = [
  <svg key="pick" viewBox="0 0 24 24"><rect x="3.5" y="4" width="7" height="7" rx="1.5" /><rect x="13.5" y="4" width="7" height="7" rx="1.5" /><rect x="3.5" y="14" width="7" height="6" rx="1.5" /><path d="M14 17l2 2 4-4" /></svg>,
  <svg key="join" viewBox="0 0 24 24"><circle cx="10" cy="8" r="3.5" /><path d="M3.5 20c.8-3.6 3.4-5.5 6.5-5.5 1.4 0 2.7.4 3.8 1.1" /><path d="M18 14v6M15 17h6" /></svg>,
  <svg key="back" viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.4-5.7" /><path d="M20 4v4h-4" /><path d="M12 8v8M9.5 10.5h3.5a1.5 1.5 0 0 1 0 3H11a1.5 1.5 0 0 0 0 3h3.5" /></svg>,
];

// Marks a section [data-inview] while it is near the viewport so its looping CSS motion pauses off screen.
function useInViewAttr(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([entry]) => { el.toggleAttribute("data-inview", entry.isIntersecting); }, { rootMargin: "80px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}

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
  }, [hydrated, props.renderedAt, props.t, props.locale, props.market, props.whales, props.fundingFeed, props.vol, props.mode, props.product, props.calc, props.priced, props.initialOfficialAnnouncements]);

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

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const HERO_EASE = "cubic-bezier(.16,1,.3,1)";
// Brand tint (RGB triplet) for the indicator, the dial thumb halo and the glow behind the figure.
const HERO_TINT = Object.freeze({ bitget: "0 229 245", okx: "235 238 243", binance: "240 185 11", htx: "42 120 246", "gate-io": "35 84 230", bybit: "247 166 0", hyperliquid: "151 252 228", backpack: "232 65 66" });
const heroTint = (slug) => HERO_TINT[slug] || "31 224 192";

// A run of real text that slides up when its value changes (transform + opacity, WAAPI). Never on first render, never
// for reduced motion; the new text is already in the DOM, so a dropped frame can only show the right value.
function useSlideOnChange(value, quickRef) {
  const ref = useRef(null), prev = useRef(value);
  useLayoutEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    const el = ref.current;
    if (!el?.animate || reducedMotion()) return;
    const quick = Boolean(quickRef?.current);
    el.animate([{ transform: "translateY(.3em)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: quick ? 150 : 280, easing: HERO_EASE });
  }, [value, quickRef]);
  return ref;
}

function HeroWord({ className, text, quickRef }) {
  const ref = useSlideOnChange(text, quickRef);
  return <span ref={ref} className={className}>{text}</span>;
}

// The live sentence (owner 2026-10-14): "交易 1000万U，Bitget 自动返还你". The figure follows in HeroRebate.
function HeroSay({ locale, volume, venue, auto, quickRef }) {
  const lines = heroSayTokens(locale, auto);
  const vol = heroVolumeText(volume, locale);
  const natural = /^(zh|ja)/.test(locale);
  return (
    <h1 className="hx-say" data-natural={natural ? "" : undefined}>
      {lines.map((line, i) => (
        <span className="h7-h1l" key={i}>
          {line.map((part, j) => part === "{vol}" ? <HeroWord key={j} className="hx-say-vol" text={vol} quickRef={quickRef} />
            : part === "{venue}" ? <HeroWord key={j} className="hx-say-venue" text={venue.name} quickRef={quickRef} />
            : <span key={j}>{part}</span>)}
          {i < lines.length - 1 ? <>{natural ? " " : heroLineGap(line)}{!natural && <br />}</> : null}
        </span>
      ))}
    </h1>
  );
}

// The figure: volume × perpetual taker fee × partner share, in dollars (no time unit). The gradient sits
// on each glyph run, never on the parent, so iPhone Safari keeps every run (hotfix #231).
function HeroRebate({ locale, venue, amount, quickRef }) {
  const parts = heroMoneyParts(amount, locale);
  const numRef = useRef(null), previousAmount = useRef(amount), finalNumber = useRef(parts?.num);
  finalNumber.current = parts?.num;
  useEffect(() => {
    const from = previousAmount.current;
    previousAmount.current = amount;
    const node = numRef.current;
    if (!node || !Number.isFinite(from) || !Number.isFinite(amount) || from === amount || reducedMotion() || true) return; // count-up off: the regression gate reads the figure text right after a pick
    let frame, start;
    const tick = (now) => {
      start ??= now;
      const progress = reducedMotion() ? 1 : Math.min(1, (now - start) / 360);
      const value = from + (amount - from) * (1 - (1 - progress) ** 3);
      // Keep the final unit throughout the tween; changing compact units would mislabel the value.
      const target = heroMoneyParts(amount, locale);
      const sample = heroMoneyParts(value, locale);
      node.textContent = sample?.unit === target?.unit ? sample.num : target.num;
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); node.textContent = finalNumber.current || ""; };
  }, [amount, locale]);
  const unitRef = useSlideOnChange(parts?.unit, quickRef);
  const logoRef = useSlideOnChange(venue?.slug);
  return (
    <div className="hx-rate" data-pick={venue?.slug || "none"}>
      <span className="hx-rate-glow" aria-hidden="true">
        {Object.keys(HERO_TINT).map((slug) => <i key={slug} data-on={slug === venue?.slug ? "" : undefined} style={{ "--g": HERO_TINT[slug] }} />)}
      </span>
      {/* The brand mark sits in the figure's own line box: em-sized to the digits' cap height, bottom on their baseline. */}
      <p className="hx-rate-num h7-rebate-value hx-amt" data-final-value={amount == null ? "" : Math.round(amount)} style={{ "--wem": heroMoneyWidthEm(parts) + 0.86 }}>
        <span className="hx-rate-logo" aria-hidden="true" ref={logoRef}><BrandMark slug={venue?.slug} compact priority /></span>
        {parts ? <>
          <span className="hx-rate-pct">{parts.cur}</span>
          <span className="hx-rate-n" ref={numRef}>{parts.num}</span>
          {parts.unit ? <span className="hx-rate-u" ref={unitRef}>{parts.unit}</span> : null}
        </> : <span className="hx-rate-n">—</span>}
      </p>
    </div>
  );
}

// Rebate globe (owner 2026-10-22): the partners around a turning dotted globe, each chip with what the visitor's own volume
// gets back there (same numbers as the figure), arcs and pulses from every partner to "you". The server renders a still
// SVG globe and the chips in a box whose size comes from CSS only; the CSS texture renderer (home7-globe.js, its own chunk)
// loads after the page has loaded and lays itself over the same circle, so first paint and CLS do not depend on it.
// Owner 2026-10-22: the figure shows Bitget, OKX, Binance, Hyperliquid and Backpack (not HTX / Gate.io; those stay
// selectable under the tabs' "更多"). A venue picked in the tabs that is not in this list takes the last slot.
const STAGE_SLOTS = 5;
const STAGE_VENUES = Object.freeze(["bitget", "okx", "binance", "hyperliquid", "backpack"]);
// Every chip shows an amount (owner 2026-10-23): a venue without a checked perp taker fee is left out and the next rebated
// partner takes its slot, never a word in place of a number. Backpack's Tier 1 perp fee is in exchange-facts.js
// (backpack.exchange/fees, read 2026-10-23). Hyperliquid's share is the owner's 30% (2026-10-22).
const loadGlobe = () => import("./home7-globe.js");
function RebateStage({ locale, picks, venues, sel, volume }) {
  const rootRef = useRef(null), hostRef = useRef(null), globeRef = useRef(null), selRef = useRef(sel.slug);
  selRef.current = sel.slug;
  useEffect(() => {
    let off = false, handle = 0;
    const start = () => loadGlobe().then(({ mountGlobe }) => {
      if (off || !hostRef.current) return;
      globeRef.current = mountGlobe(hostRef.current, rootRef.current, reducedMotion());
      globeRef.current?.select(selRef.current);
    }, () => {});
    const later = () => { handle = window.requestIdleCallback ? requestIdleCallback(start, { timeout: 2500 }) : setTimeout(start, 800); };
    if (document.readyState === "complete") later(); else window.addEventListener("load", later, { once: true });
    return () => {
      off = true;
      window.removeEventListener("load", later);
      if (window.cancelIdleCallback) cancelIdleCallback(handle); else clearTimeout(handle);
      globeRef.current?.destroy(); globeRef.current = null;
    };
  }, []);
  useEffect(() => { globeRef.current?.select(sel.slug); }, [sel.slug, volume]);
  const say = heroSay(locale);
  // Only venues this market's home already offers (Türkiye gating happens upstream in useVenues/heroPicks).
  const known = new Map([...venues, ...picks].map((venue) => [venue.slug, venue]));
  const backOf = (venue) => {
    const fact = feeFact(venue.slug, "perp");
    return heroRebateAmount(volume, fact.state === "checked" ? fact.taker : NaN, venue.share);
  };
  const priced = (venue) => backOf(venue) != null;
  const shown = STAGE_VENUES.map((slug) => picks.find((v) => v.slug === slug) || known.get(slug)).filter((v) => v && priced(v));
  // A market that may not show some of them (Türkiye: no Bitget/Hyperliquid/Backpack) fills the free slots with its other rebated partners.
  for (const venue of picks) if (shown.length < STAGE_SLOTS && priced(venue) && !shown.some((v) => v.slug === venue.slug)) shown.push(venue);
  if (sel && priced(sel) && !shown.some((v) => v.slug === sel.slug)) shown.splice(Math.min(shown.length, STAGE_SLOTS) - 1, 1, sel);
  const rows = shown.slice(0, STAGE_SLOTS).map((venue) => ({ venue, back: backOf(venue) }));
  const screen = say.screen.replace("{vol}", heroVolumeText(volume, locale));
  return (
    <figure className="hx-stage" ref={rootRef} data-demo="off">
      <div className="hx-stage-art" aria-hidden="true">
        <svg className="hx-globe-svg" viewBox="-50 -50 100 100" focusable="false">
          <defs>
            <radialGradient id="hx-globe-fill" cx="38%" cy="32%" r="75%">
              <stop offset="0" stopColor="#12323A" /><stop offset=".55" stopColor="#0A161B" /><stop offset="1" stopColor="#07090C" />
            </radialGradient>
          </defs>
          <circle r="40" className="hx-globe-halo" />
          <circle r="34" fill="url(#hx-globe-fill)" className="hx-globe-rim" />
          <g className="hx-globe-grid">
            {[0.28, 0.62, 0.9].map((k) => <ellipse key={`m${k}`} rx={34 * k} ry="34" />)}
            {[-22, 0, 22].map((y) => <ellipse key={`p${y}`} cy={y} rx={Math.sqrt(34 * 34 - y * y)} ry={Math.sqrt(34 * 34 - y * y) * 0.22} />)}
          </g>
          <circle r="1.6" cx="-5.4" cy="-8.6" className="hx-globe-hub" />
        </svg>
        <div className="hx-globe" ref={hostRef} />
        {rows.map(({ venue, back }, index) => (
          <div key={venue.slug} className="hx-stage-node" data-slot={index} data-on={venue.slug === sel.slug ? "" : undefined} data-venue={venue.slug}>
            <BrandMark slug={venue.slug} compact priority={venue.slug === sel.slug} />
            <span className="hx-stage-label">{venue.name}</span>
            <b className="hx-stage-value" data-final-value={Math.round(back)}>{heroMoneyText(back, locale)}</b>
          </div>
        ))}
      </div>
      <figcaption className="hx-stage-caption"><i />{say.live} · {screen}</figcaption>
      <ul className="h7-sr" aria-label={screen}>
        {rows.map(({ venue, back }) => <li key={venue.slug}>{venue.name}: {heroMoneyText(back, locale)}</li>)}
      </ul>
    </figure>
  );
}

// Volume dial: a native range (keyboard, tap-to-position, screen readers) over 21 log-scale stops, 1万U → 10亿U.
// The tick labels jump to the snap points (single-pointer alternative to dragging).
function HeroVolumeDial({ locale, step, onStep, dragRef, onTouch }) {
  const last = HERO_VOLUME_STEPS.length - 1;
  const halo = useRef(null);
  useEffect(() => {
    // One-time affordance: the thumb's halo pulses twice after hydration, then never again.
    if (reducedMotion() || !halo.current?.animate) return undefined;
    const a = halo.current.animate([{ transform: "scale(1)", opacity: 0.55 }, { transform: "scale(2.2)", opacity: 0 }], { duration: 900, delay: 600, iterations: 2, easing: "cubic-bezier(.2,.6,.3,1)" });
    return () => a.cancel();
  }, []);
  const end = () => { dragRef.current = false; };
  return (
    <div className="hx-dial" style={{ "--f": step / last }}>
      <div className="hx-dial-track">
        <span className="hx-dial-halo" aria-hidden="true" ref={halo} />
        <input
          className="hx-dial-input" type="range" min={0} max={last} step={1} value={step}
          aria-label={heroSay(locale).label} aria-valuetext={heroVolumeText(HERO_VOLUME_STEPS[step], locale)}
          onPointerDown={() => { dragRef.current = true; onTouch?.(); }} onPointerUp={end} onPointerCancel={end} onBlur={end}
          onChange={(event) => onStep(Number(event.target.value))}
        />
      </div>
      <div className="hx-dial-ticks" aria-hidden="true">
        {HERO_VOLUME_TICKS.map((index) => (
          <button key={index} type="button" tabIndex={-1} data-on={index === step ? "" : undefined} style={{ "--t": index / last }} onClick={() => onStep(index)}>
            {heroVolumeShort(HERO_VOLUME_STEPS[index], locale)}
          </button>
        ))}
      </div>
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

// The invite code under the hero button: travels with the sign-up link, shown for reassurance, copy is one tap. Only
// CTA locales reach it (neutral locales render no code); a locale without its own line reads the English one.
const CODE_AUTO = Object.freeze({
  en: "Code {code} applied automatically", "zh-Hans": "邀请码 {code} 已自动填写", es: "Código {code} aplicado automáticamente",
  "pt-BR": "Código {code} aplicado automaticamente", fr: "Code {code} appliqué automatiquement", de: "Code {code} wird automatisch übernommen",
  it: "Codice {code} applicato in automatico", ja: "招待コード {code} は自動で適用", ko: "초대 코드 {code} 자동 적용",
  tr: "{code} kodu otomatik uygulanır", id: "Kode {code} otomatis terpasang",
});
// "Applied automatically" only when the sign-up URL itself carries the shown code (2026-10-22: Bitget's partner short
// link resolves to a different vipCode, so its line must not claim nexu888 is pre-filled).
const CODE_PLAIN = Object.freeze({
  en: "Invite code {code}", "zh-Hans": "邀请码 {code}", es: "Código {code}", "pt-BR": "Código {code}", fr: "Code {code}",
  de: "Code {code}", it: "Codice {code}", ja: "招待コード {code}", ko: "초대 코드 {code}", tr: "Kod {code}", id: "Kode {code}",
});
const codeInUrl = (venue) => Boolean(venue.code && venue.url && venue.url.toLowerCase().includes(String(venue.code).toLowerCase()));
function HeroCode({ locale, venue, t }) {
  const auto = codeInUrl(venue);
  const lines = auto ? CODE_AUTO : CODE_PLAIN;
  const [before, after = ""] = (lines[h7IsFallback(locale) ? "en" : locale] || lines.en).split("{code}");
  return <p className="hx-code">
    {auto ? <svg className="hx-code-ok" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 8.5l3 3 6-7" /></svg> : null}
    <span className="hx-code-t"><span className="h7-sr">{venue.name} </span>{before}<code>{venue.code}</code>{after}</span>
    <CopyCode code={venue.code} t={t} />
  </p>;
}

// Phones: once the hero has scrolled away, a dock keeps the exchange pick and its sign-up link one tap away.
export function MobileDock({ heroRef, sel, rebated, setPick, t, locale }) {
  const [on, setOn] = useState(false);
  const dockRef = useRef(null);
  useEffect(() => {
    const dock = dockRef.current, page = document.documentElement;
    if (!dock || !page) return undefined;
    const measure = () => page.style.setProperty("--signup-dock-height", `${dock.getBoundingClientRect().height}px`);
    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(dock);
    return () => { observer?.disconnect(); page.style.removeProperty("--signup-dock-height"); };
  }, [sel?.slug]);
  useEffect(() => {
    const h = heroRef.current; if (!h || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => setOn(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(h); return () => io.disconnect();
  }, [heroRef]);
  if (!sel?.open) return null;
  // React 19 treats `inert` as a boolean prop: an empty-string value renders nothing and left the hidden dock in the Tab order.
  return (
    <div ref={dockRef} data-signup-cta={sel.slug} className={`h7-dock${on ? " on" : ""}`} {...(on ? {} : { inert: true, "aria-hidden": "true" })}>
      <label className="h7-dock-pick"><span className="h7-sr">{t.lgPick}</span>
        <select value={sel.slug} onChange={(e) => setPick(e.target.value)}>{rebated.map((r) => <option key={r.slug} value={r.slug}>{r.name} · {formatPercent(locale, Math.round(r.share * 100))}</option>)}</select>
      </label>
      <Cta v={sel} locale={locale} className={`h7-btn h7-dock-go h7-go--${sel.slug}`} placement="home-v7-dock"><span>{t.dockGo}</span></Cta>
    </div>
  );
}


// A second subscriber uses the ticker's existing shared poller; it never opens another feed.
export function NeutralHeroChips({ initialTicker, locale }) {
  const [ticker, setTicker] = useState(initialTicker);
  useEffect(() => {
    let off = false, stop;
    import("../ticker/ticker-live.js").then(({ subscribe }) => {
      if (!off) stop = subscribe(setTicker);
    }).catch(() => {});
    return () => { off = true; stop?.(); };
  }, []);
  return <ul className="nh-chips" tabIndex="0" aria-label={neutralHeroCopy(locale).title}>
    {["BTC", "ETH", "SOL"].map((sym) => {
      const item = ticker?.items?.find((r) => r.sym === sym);
      return <li className="nh-chip" data-sym={sym} data-dir={item?.dir || "flat"} key={sym}><bdi dir="ltr">{sym} <span data-tk={`${sym}-p`}>{item?.price || "—"}</span> <span className="nh-change" data-tk={`${sym}-c`}>{item?.change || "—"}</span></bdi></li>;
    })}
  </ul>;
}

export function NeutralHeroBoard({ rows, locale }) {
  const c = neutralHeroCopy(locale);
  const [volume, basis] = c.volume.split(" · ");
  // Preserve the lower calculator's checked-row order and default volume, independent of its controls.
  const checkedOn = rows.slice(0, 6).map((r) => feeFact(r.slug, "perp").checkedOn).filter(Boolean).sort()[0];
  return <aside className="nh-board" data-testid="neutral-hero-board" aria-labelledby="nh-board-title">
    <div className="nh-board-head"><h2 id="nh-board-title">{c.title}</h2>{checkedOn && <span className="nh-updated">{c.updated} <bdi dir="ltr">{checkedOn} SGT</bdi></span>}</div>
    <p className="nh-volume"><bdi dir="ltr">{volume}</bdi> · {basis}</p>
    <ul>{rows.filter((r) => r.taker != null).slice(0, 6).map((r) => <li key={r.slug} data-testid="neutral-hero-row">
      <span className="nh-venue"><BrandMark slug={r.slug} compact priority /><bdi dir="ltr">{r.name}</bdi></span>
      <bdi dir="ltr" className="nh-money">${Math.round(1e7 * r.taker / 100).toLocaleString("en-US")}</bdi>
    </li>)}</ul>
    <a href="#h7-calc">{c.calculator}<span aria-hidden="true"> ↗</span></a>
  </aside>;
}

export function HomeV7({ locale, market, whales, fundingFeed, venues: _catalog, initialTicker, initialOfficialAnnouncements, homeLatest = [] }) {
  // Owner 2026-10-13 (legal): Vietnam (vi pages, VN market) is information-only — no rebate ledger, code or sign-up.
  // Neutral locales (locale-policy.js: ru, ar, zh-Hant, ur, uk, vi) read the same information-only home (lead 2026-10-13).
  const banned = isNeutralCtaLocale(locale) || Boolean(jurisdictionPromotionBan({ locale, market }));
  const baseCopy = banned ? { ...h7Copy(locale), ...h7NeutralCopy(locale) } : h7Copy(locale);
  const t = isTurkeyPage({ locale, market }) ? h7TurkeyCopy(baseCopy, locale) : baseCopy;
  // The X5 headline experiment is retired (2026-10-14): the CTA hero's headline is the live volume sentence below.
  const heroText = t;
  // Keep the SSR clock in the HTML so a deferred client render reuses the same snapshot,
  // including homes without a seeded announcement feed.
  const [renderedAt] = useState(() => {
    const snapshot = typeof document !== "undefined" ? document.querySelector(".h7[data-rendered-at]")?.getAttribute("data-rendered-at") : null;
    return snapshot || new Date(Date.now()).toISOString();
  });
  const [product, setProduct] = useState("perp");
  const venues = useVenues(locale, product, market, banned);
  const neutralHeroVenues = useVenues(locale, "perp", market, true);
  const maxPct = homeRebateMaxPctFor(locale, market);
  // Calculator volume (owner 2026-10-14: volume framing, no per-month / per-year): the traded volume, default 1000万U.
  const [vol, setVol] = useState(1e7);
  const [mode, setMode] = useState("taker");

  const priced = useMemo(() => venues.filter((v) => v.maker != null), [venues]);
  const calc = useMemo(() => {
    const rows = priced.map((v) => {
      const rate = mode === "maker" ? v.maker : v.taker;
      if (rate == null || !vol) return { ...v, gross: null, net: null, save: null };
      const gross = (vol * rate) / 100;
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
  // Hero picks: the pushed venues first, then every other partner with a declared share and a checked fee (HTX, under 更多).
  const heroPicks = useMemo(() => [...rebated, ...calc.rows.filter((r) => r.share && r.open && !rebated.some((x) => x.slug === r.slug))], [calc, rebated]);
  const [pickSlug, setPick] = useState(null);
  const sel = heroPicks.find((r) => r.slug === pickSlug) || rebated[0] || top;
  const auto = sel?.slug ? HOME_AUTO_SETTLE.includes(sel.slug) : false;
  // Hero sum (owner 2026-10-14): traded volume × perpetual taker fee × partner share. Always perpetual taker, whatever
  // the lower calculator is set to; the hero volume is its own state and never changes the calculator's monthly volume.
  const [heroStep, setHeroStep] = useState(HERO_VOLUME_DEFAULT_STEP);
  const heroVolume = HERO_VOLUME_STEPS[heroStep];
  const heroFee = feeFact(sel?.slug, "perp");
  const heroAmount = heroFee.state === "checked" ? heroRebateAmount(heroVolume, heroFee.taker, sel?.share) : null;
  const editorial = locale === "zh-Hans" || locale === "en";
  const dragRef = useRef(false);

  const heroRef = useRef(null);
  const howRef = useRef(null);
  useInViewAttr(howRef);
  // The laptop screen runs its own short demo (HeroScreen); the first touch of the dial, tabs or screen ends it for good.
  // One state flip, once: the demo itself never re-renders anything outside the screen.
  const [touched, setTouched] = useState(false);
  const stopCycle = () => { if (!touched) setTouched(true); };
  const pickVenue = (slug) => { stopCycle(); setPick(slug); };
  const pickStep = (step) => { stopCycle(); setHeroStep(step); };
  const nc = neutralHeroCopy(locale);
  const h1b = heroText.h1b.replace("{max}%", formatPercent(locale, maxPct));

  return (
    <div className="h7" data-rendered-at={renderedAt} {...(h7IsFallback(locale) ? { lang: "en", dir: "ltr" } : {})}>
      <section className="h7-hero" ref={heroRef} aria-label="NexuAlpha" {...(banned ? { "data-neutral": "" } : { style: { "--hx-tint": heroTint(sel.slug) } })}>
        <div className="h7-hc">
          {banned
            ? <><span className="nh-eyebrow">{nc.eyebrow}</span><h1><span className="h7-h1l">{heroText.h1a}</span><br /><span className="h7-h1l">{h1b}</span></h1>
              <p className="nh-lead">{nc.lead}</p>
              <div className="nh-actions"><a className="nh-primary" href={localizedHref("/compare", { locale })}>{nc.compare}</a><a href={localizedHref("/academy", { locale })}>{nc.course}</a></div></>
            : <HeroSay locale={locale} volume={heroVolume} venue={sel} auto={auto} quickRef={dragRef} />}
        </div>

        {banned && <><NeutralHeroBoard rows={neutralHeroVenues} locale={locale} /><NeutralHeroChips initialTicker={initialTicker} locale={locale} /></>}
        {!banned && (
        <aside className="h7-lg hx-hero-panel" id="h7-desk" aria-label={t.lgTitle} data-pick={sel.slug}>
          <HeroRebate locale={locale} venue={sel} amount={heroAmount} quickRef={dragRef} />
          <HeroVolumeDial locale={locale} step={heroStep} onStep={pickStep} dragRef={dragRef} onTouch={stopCycle} />
          {/* Hero CTA simplification (2026-10-22): one dominant button straight under the promise, the code as a quiet
              confirmation line under it (the sign-up link carries it; copy is one tap), the exchange switch last and light. */}
          <Cta v={sel} locale={locale} className={`h7-btn h7-lg-go hx-go h7-go--${sel.slug}`} placement="home-v7-hero"><span className="h7-go-l">{t.lgGo(sel.name)}</span></Cta>
          {sel.code && <HeroCode locale={locale} venue={sel} t={t} />}
          <HeroExchangeSwitcher locale={locale} market={market} venues={venues} rebated={heroPicks} selectedSlug={sel.slug} onPick={pickVenue} t={t} />
        </aside>
        )}
        {!banned && editorial && <p className="h7-trust-line">{t.t1} · {t.t2} · {t.t3}</p>}
        {!banned && <RebateStage locale={locale} picks={heroPicks} venues={venues} sel={sel} volume={heroVolume} />}
      </section>

      <section className="h7-strip" aria-label={t.pw(venues.length)}>
        <ul className="h7-pw" style={{ "--pw-n": venues.length }}>
          {venues.map((v, i) => (
            <li key={v.slug}>
              <a href={localizedHref(banned ? `/exchanges/${v.slug}` : `/exchanges/${v.slug}#registration-path`, { locale })} className={v.share ? "on" : undefined}>
                <BrandMark slug={v.slug} compact priority={i < 4} /><span className="h7-pn">{v.name}</span>{v.share ? <small>{t.upTo} {formatPercent(locale, Math.round(v.share * 100))}</small> : null}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <DeferUntilVisible target=".h7-whales" prefetch={loadHomeBelow}><MoversBoard locale={locale} initial={whales} /></DeferUntilVisible>

      <DeferUntilVisible target=".h7-ts" prefetch={loadTsStrip}><TokenizedStrip locale={locale} market={market} /></DeferUntilVisible>

      <TelegramAlertsStrip locale={locale} placement="home-telegram-alerts" className="tg-signal-strip--home" />

      <section className="h7-in h7-how" aria-labelledby="h7-how-h" ref={howRef}>
        <h2 id="h7-how-h">{t.howH}</h2>
        {editorial && !banned ? <FeeReceipt locale={locale} venue={sel} volume={heroVolume} fee={heroFee} rebate={heroAmount} payout={t.how[2][1]} /> : <ol className="h7-steps">
          {t.how.map(([h, b], i) => <li key={h}><span className="h7-step-ic" aria-hidden="true">{STEP_ICONS[i]}</span><span className="h7-sn" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span><h3>{h}</h3><p>{b}</p></li>)}
        </ol>}
      </section>

      <AcademyTeaser locale={locale} />

      <StableHomeBelowFold renderedAt={renderedAt} t={t} locale={locale} market={market} whales={whales} fundingFeed={fundingFeed} vol={vol} setVol={setVol} mode={mode} setMode={setMode} product={product} setProduct={setProduct} calc={calc} priced={priced} initialOfficialAnnouncements={initialOfficialAnnouncements} homeLatest={homeLatest} />
      {/* Signup disclosures travel with each action, including the dock. */}
      <MobileDock heroRef={heroRef} sel={sel} rebated={rebated.some((r) => r.slug === sel.slug) ? rebated : [...rebated, sel]} setPick={setPick} t={t} locale={locale} />
    </div>
  );
}

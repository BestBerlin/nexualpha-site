import { SignupEvidence } from "../shared/SignupEvidence.jsx";
// Home "代币化美股" strip (owner 2026-10-15; card grid 2026-10-23, owner: the matrix of dash pairs was unreadable).
// Six popular tickers as cards: a local company-logo tile, the live last price with its 24h change, a
// change-magnitude bar, the venue with the lowest last price, and which of the first six exchanges (owner order) list the
// stock as a token and/or a perpetual (lit logo + chips; dimmed = not listed), then max leverage and the lowest standard
// perpetual taker fee. Listing values come from tsMatrix (the exchanges' public market data + sourced facts); prices are
// read only inside this lazy module, after mount, and expire after 15 minutes. Without a fresh price a card shows its
// listing count in the reserved price line: nothing is invented and nothing moves when prices arrive (CLS 0).
// SSR and the first client render use the listing snapshot baked into the release (identical HTML); after mount the
// strip reads the host's fresher snapshot (/intel/tokenized-stocks.json) and keeps the baked one when that read fails.
// One primary action (sign-up of the first exchange that may show one, via tsSignup -> /go/<venue>) plus the hub link.
// Card styles live in home7.src.css (.h7-ts / .h7-tsc) so the server HTML is styled before this lazy chunk arrives.
import { StockLogo } from "./StockLogo.jsx";
import React, { useEffect, useRef, useState } from "react";
import { TS_TEASER } from "../../data/tokenized-stocks-teaser.js";
import { TS_TICKERS } from "../../data/tokenized-stocks-facts.js";
import { fillTs, tsSignup, tsVenues } from "../../data/tokenized-stocks.js";
import { TS_PATH, tsTickerPath } from "../../data/tokenized-stocks-routes.js";
import { tsLive } from "../../data/tokenized-stocks-rows.js";
import { compactLive, isUsableLiveSnapshot } from "../../data/tokenized-stocks-live-sources.js";
import { sgtStamp, tsMatrix } from "../../data/tokenized-stocks-matrix.js";
import { localizedHref } from "../../data/locale-routing.js";
import { listedTsPrices, tsHomePriceSummary, tsPriceNumber, tsPricePercent, tsPriceStamp, useTsPrices } from "./tokenized-prices-client.js";
import { tsPriceCopy } from "./tokenized-prices-copy.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import { LiveBadge } from "../v7/home7-board-motion.jsx";

const teaserFor = (locale) => TS_TEASER[locale] || (String(locale || "").startsWith("zh") ? TS_TEASER["zh-Hans"] : TS_TEASER.en);
const HOME_TICKERS = TS_TICKERS.slice(0, 6);
const HOME_VENUES = 6;
const pct = (n) => `${Number(n).toString()}%`;
// Monogram accent per ticker (hue only; no company marks). Unknown tickers get a stable hue from their letters.
const HUES = { NVDA: 140, TSLA: 2, AAPL: 215, MSFT: 198, COIN: 226, MSTR: 28, HOOD: 96, CRCL: 186, GOOGL: 48, AMZN: 34 };
const hueOf = (ticker) => HUES[ticker] ?? [...ticker].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
// Chip labels must fit a 9px pill; long localized "perpetual" words fall back to the market term.
const PERP_CHIP = { en: "Perp", de: "Perp", es: "Perp", fr: "Perp", it: "Perp", "pt-BR": "Perp", id: "Perp", tr: "Perp", vi: "Perp", ru: "Перп", uk: "Перп" };
// A ±8% move fills half the bar; anything larger is clamped.
const BAR_SPAN = 8;

/** The host's runtime snapshot, compacted; null when unreadable, unusable or not fresh (fail closed to the baked copy). */
async function readRuntimeSnapshot(signal) {
  const res = await fetch("/intel/tokenized-stocks.json", { signal, headers: { accept: "application/json" } });
  if (!res.ok) return null;
  const json = await res.json();
  if (json?.status && json.status !== "OK") return null;
  return isUsableLiveSnapshot(json) ? compactLive(json) : null;
}

/** Direction of the last price change per ticker (one flash per feed update, none on first paint). */
function usePriceFlash(summaries) {
  const prev = useRef(new Map());
  const flash = {};
  for (const [ticker, s] of summaries) {
    const before = prev.current.get(ticker), now = s.price?.lastPrice;
    if (before != null && now != null && before !== now) flash[ticker] = now > before ? "up" : "down";
  }
  useEffect(() => {
    for (const [ticker, s] of summaries) if (s.price?.lastPrice != null) prev.current.set(ticker, s.price.lastPrice);
  });
  return flash;
}

/** Pauses the strip's looping decoration while it is off screen (one observer, no timers). */
function useInView(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([entry]) => { el.toggleAttribute("data-inview", entry.isIntersecting); }, { rootMargin: "80px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}

function StockCard({ row, t, mx, pt, locale, venues, summary, flash }) {
  const price = summary?.price;
  const change = price?.change24hPct;
  const dir = change == null ? undefined : change > 0 ? "up" : change < 0 ? "down" : "flat";
  const fill = change == null ? 0 : Math.min(Math.abs(change) / BAR_SPAN, 1);
  const bestVenue = price ? venues.find((v) => v.slug === price.venueId) : null;
  const perpChip = PERP_CHIP[locale] || mx.perp;
  const listed = venues.filter((ex) => row.by[ex.slug]);
  const name = t.names?.[row.ticker] || row.ticker;
  return (
    <li className="h7-tsc" style={{ "--h": hueOf(row.ticker) }} data-dir={dir}>
      <div className="h7-tsc-top">
        <StockLogo ticker={row.ticker} size={40} />
        <a className="h7-tsc-name" href={localizedHref(tsTickerPath(row.ticker), { locale })}>
          <b translate="no">{row.ticker}</b><small>{name}</small>
        </a>
        {change != null ? <span className="h7-tsc-chg" data-dir={dir}><span aria-hidden="true">{dir === "up" ? "▲" : dir === "down" ? "▼" : "•"}</span><bdi dir="ltr">{tsPricePercent(change)}</bdi></span> : null}
      </div>
      <div className="h7-tsc-px">
        {price ? (
          <p className="h7-tsc-price" key={price.lastPrice} data-flash={flash || undefined}>
            <bdi dir="ltr"><b>{tsPriceNumber(price.lastPrice)}</b> <small>{price.quoteCurrency}</small></bdi>
          </p>
        ) : (
          <p className="h7-tsc-price" data-empty=""><b>{fillTs(t.listed, { n: listed.length })}</b></p>
        )}
        <span className="h7-tsc-bar" aria-hidden="true" data-dir={dir}><i style={{ transform: `scaleX(${fill})` }} /></span>
        <p className="h7-tsc-best">
          {bestVenue ? <>{pt.bestPrice}<span className="h7-tsc-bv"><BrandMark slug={bestVenue.slug} compact />{bestVenue.name}</span><span className="h7-tsc-lane">{price.marketType === "spot" ? mx.token : perpChip}</span></> : <span>{t.lanes.spot} · {t.lanes.perp}</span>}
        </p>
      </div>
      <ul className="h7-tsc-ven" aria-label={mx.venues}>
        {venues.map((ex) => {
          const on = row.by[ex.slug] || {};
          const lanes = ["spot", "perp"].filter((lane) => on[lane]).map((lane) => t.lanes[lane]).join(" · ");
          return (
            <li key={ex.slug} data-on={lanes ? "" : undefined} title={fillTs(mx.cell, { name: ex.name, lanes: lanes || mx.none })}>
              <BrandMark slug={ex.slug} compact />
              <span className="h7-ts-sr">{fillTs(mx.cell, { name: ex.name, lanes: lanes || mx.none })}</span>
              <span className="h7-tsc-chips" aria-hidden="true">
                <i data-lane="spot" data-on={on.spot ? "" : undefined}>{mx.token}</i>
                <i data-lane="perp" data-on={on.perp ? "" : undefined}>{perpChip}</i>
              </span>
            </li>
          );
        })}
      </ul>
      <dl className="h7-tsc-foot">
        <div><dt>{mx.lev}</dt><dd>{row.maxLev ? <><b>{row.maxLev}x</b><small>{row.maxLevVenues.slice(0, 2).join(" · ")}</small></> : <b aria-label={mx.none}>—</b>}</dd></div>
        <div><dt>{mx.fee}</dt><dd>{row.minTaker != null ? <><b>{pct(row.minTaker)}</b><small>{row.minTakerVenues.slice(0, 2).join(" · ")}</small></> : <b aria-label={mx.none}>—</b>}</dd></div>
      </dl>
    </li>
  );
}

export function HomeTokenizedStrip({ locale = "en", market }) {
  const t = teaserFor(locale);
  const mx = t.mx;
  const ref = useRef(null);
  const [live, setLive] = useState(null);
  useEffect(() => {
    const ctrl = new AbortController();
    readRuntimeSnapshot(ctrl.signal).then((next) => { if (next) setLive(next); }).catch(() => { /* keep the baked snapshot */ });
    return () => ctrl.abort();
  }, []);
  useInView(ref);
  const data = tsLive(live);
  const venues = tsVenues(locale, market).slice(0, HOME_VENUES);
  const rows = tsMatrix({ locale, market, live: data, tickers: HOME_TICKERS });
  const prices = listedTsPrices(useTsPrices(HOME_TICKERS), rows, data).filter((p) => venues.some((v) => v.slug === p.venueId));
  const summaries = tsHomePriceSummary(prices);
  const flash = usePriceFlash(summaries);
  const priceStamp = tsPriceStamp([...summaries.values()].map((s) => s.price));
  const pt = tsPriceCopy(locale);
  const hub = localizedHref(TS_PATH, { locale });
  const go = venues.map((ex) => ({ ex, signup: tsSignup(ex.slug, { locale, market, placement: "home-strip" }) })).find((v) => v.signup);
  const stamp = sgtStamp(data.generatedAt);
  const perpChip = PERP_CHIP[locale] || mx.perp;
  return (
    <section className="h7-in h7-ts" aria-labelledby="h7-ts-h" ref={ref} data-priced={summaries.size ? "" : undefined}>
      <div className="h7-ts-head">
        <div className="h7-ts-copy">
          <p className="h7-ts-k">{t.homeKicker}<span className="h7-ts-live" data-off={summaries.size ? undefined : ""}><LiveBadge locale={locale} /></span></p>
          <h2 id="h7-ts-h">{t.homeTitle}</h2>
          <p className="h7-ts-b">{t.homeBody}</p>
        </div>
        <div className="h7-ts-go">
          {go ? (
            <span data-signup-cta={go.ex.slug} className="signup-cta-block"><a className="h7-btn h7-sm h7-ts-cta" href={go.signup.href} target="_blank" rel="sponsored noopener noreferrer"
              data-offer-link="go" data-cta-kind="signup" data-cta-platform={go.ex.slug} data-cta-placement="tokenized-stocks-home-strip">
              {fillTs(t.cta, { name: go.ex.name })}<span aria-hidden="true" className="h7-ts-arrow">→</span>
            </a><SignupEvidence slug={go.ex.slug} locale={locale} market={market} /></span>
          ) : null}
          <a className="h7-ln h7-ts-all" href={hub}>{fillTs(mx.homeMore, { n: TS_TICKERS.length })}</a>
        </div>
      </div>
      <p className="h7-ts-lg">
        <span><i data-lane="spot" data-on="">{mx.token}</i>{t.lanes.spot}</span>
        <span><i data-lane="perp" data-on="">{perpChip}</i>{t.lanes.perp}</span>
        <span><i data-dim="" />{mx.none}</span>
      </p>
      <ul className="h7-tsg" aria-label={mx.h}>
        {rows.map((row) => <StockCard key={row.ticker} row={row} t={t} mx={mx} pt={pt} locale={locale} venues={venues} summary={summaries.get(row.ticker)} flash={flash[row.ticker]} />)}
      </ul>
      <p className="h7-ts-d">
        {priceStamp ? <span>{pt.asOf} <bdi dir="ltr">{priceStamp}</bdi></span> : null}
        {stamp ? <span>{fillTs(mx.dataNote, { time: stamp })}</span> : null}
      </p>
    </section>
  );
}

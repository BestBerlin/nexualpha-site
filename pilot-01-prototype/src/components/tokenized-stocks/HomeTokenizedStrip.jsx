// Home "代币化美股" strip (owner 2026-10-15, deepened 2026-10-22): right after the hero, before the whale board.
// A stock x exchange matrix for six popular tickers: which of the first six exchanges (owner order) list each one as a
// stock token and/or a stock perpetual, the highest leverage and the lowest standard perpetual taker fee, with the
// exchange that offers it. Every value comes from tsMatrix (the exchanges' public market data + sourced facts); a value
// nobody publishes is a dash. No prices: we read no price feed for these instruments.
// SSR and the first client render use the listing snapshot baked into the release (identical HTML); after mount the
// strip reads the host's fresher snapshot (/intel/tokenized-stocks.json) and keeps the baked one when that read fails.
// One primary action (sign-up of the first exchange that may show one, via tsSignup -> /go/<venue>) plus the hub link.
// Styles live in home7.src.css (.h7-ts) so the server HTML is styled before this lazy chunk arrives.
import React, { useEffect, useState } from "react";
import { TS_TEASER } from "../../data/tokenized-stocks-teaser.js";
import { TS_TICKERS } from "../../data/tokenized-stocks-facts.js";
import { fillTs, tsSignup, tsVenues } from "../../data/tokenized-stocks.js";
import { TS_PATH, tsTickerPath } from "../../data/tokenized-stocks-routes.js";
import { tsLive } from "../../data/tokenized-stocks-rows.js";
import { compactLive, isUsableLiveSnapshot } from "../../data/tokenized-stocks-live-sources.js";
import { sgtStamp, tsMatrix } from "../../data/tokenized-stocks-matrix.js";
import { localizedHref } from "../../data/locale-routing.js";
import { BrandMark } from "../brand/BrandMark.jsx";

const teaserFor = (locale) => TS_TEASER[locale] || (String(locale || "").startsWith("zh") ? TS_TEASER["zh-Hans"] : TS_TEASER.en);
const HOME_TICKERS = TS_TICKERS.slice(0, 6);
const HOME_VENUES = 6;
const pct = (n) => `${Number(n).toString()}%`;

/** The host's runtime snapshot, compacted; null when unreadable, unusable or not fresh (fail closed to the baked copy). */
async function readRuntimeSnapshot(signal) {
  const res = await fetch("/intel/tokenized-stocks.json", { signal, headers: { accept: "application/json" } });
  if (!res.ok) return null;
  const json = await res.json();
  if (json?.status && json.status !== "OK") return null;
  return isUsableLiveSnapshot(json) ? compactLive(json) : null;
}

export function HomeTokenizedStrip({ locale = "en", market }) {
  const t = teaserFor(locale);
  const mx = t.mx;
  const [live, setLive] = useState(null);
  useEffect(() => {
    const ctrl = new AbortController();
    readRuntimeSnapshot(ctrl.signal).then((next) => { if (next) setLive(next); }).catch(() => { /* keep the baked snapshot */ });
    return () => ctrl.abort();
  }, []);
  const data = tsLive(live);
  const venues = tsVenues(locale, market).slice(0, HOME_VENUES);
  const rows = tsMatrix({ locale, market, live: data, tickers: HOME_TICKERS });
  const hub = localizedHref(TS_PATH, { locale });
  const go = venues.map((ex) => ({ ex, signup: tsSignup(ex.slug, { locale, market, placement: "home-strip" }) })).find((v) => v.signup);
  const stamp = sgtStamp(data.generatedAt);
  return (
    <section className="h7-in h7-ts" aria-labelledby="h7-ts-h">
      <div className="h7-ts-head">
        <p className="h7-ts-k">{t.homeKicker}</p>
        <h2 id="h7-ts-h">{t.homeTitle}</h2>
        <p className="h7-ts-b">{t.homeBody}</p>
        <div className="h7-ts-go">
          {go ? (
            <a className="h7-btn h7-sm h7-ts-cta" href={go.signup.href} target="_blank" rel="sponsored noopener noreferrer"
              data-offer-link="go" data-cta-kind="signup" data-cta-platform={go.ex.slug} data-cta-placement="tokenized-stocks-home-strip">
              {fillTs(t.cta, { name: go.ex.name })}<span aria-hidden="true" className="h7-ts-arrow">→</span>
            </a>
          ) : null}
          <a className="h7-ln h7-ts-all" href={hub}>{fillTs(mx.homeMore, { n: TS_TICKERS.length })}</a>
        </div>
        {stamp ? <p className="h7-ts-d">{fillTs(mx.dataNote, { time: stamp })}</p> : null}
      </div>
      <div className="h7-ts-mx">
        <div className="h7-ts-tb" role="table" aria-label={mx.h}>
          <div className="h7-ts-r h7-ts-rh" role="row">
            <span className="h7-ts-s" role="columnheader">{mx.stock}</span>
            {venues.map((ex) => (
              <span key={ex.slug} className="h7-ts-v" role="columnheader">
                <a href={`${hub}#ts-${ex.slug}`} title={ex.name}><BrandMark slug={ex.slug} compact /><span className="h7-ts-vn">{ex.name}</span></a>
              </span>
            ))}
            <span className="h7-ts-x" role="columnheader">{mx.lev}</span>
            <span className="h7-ts-x" role="columnheader">{mx.fee}</span>
          </div>
          {rows.map((row) => (
            <div key={row.ticker} className="h7-ts-r" role="row">
              <span className="h7-ts-s" role="rowheader">
                <a href={localizedHref(tsTickerPath(row.ticker), { locale })}><b translate="no">{row.ticker}</b><small>{t.names?.[row.ticker] || row.ticker}</small></a>
              </span>
              {venues.map((ex) => {
                const on = row.by[ex.slug] || {};
                const lanes = ["spot", "perp"].filter((lane) => on[lane]).map((lane) => t.lanes[lane]).join(" · ");
                return (
                  <span key={ex.slug} className="h7-ts-c" role="cell" data-empty={lanes ? undefined : ""}>
                    <span className="h7-ts-sr">{fillTs(mx.cell, { name: ex.name, lanes: lanes || mx.none })}</span>
                    <i data-lane="spot" data-on={on.spot ? "" : undefined} aria-hidden="true" />
                    <i data-lane="perp" data-on={on.perp ? "" : undefined} aria-hidden="true" />
                  </span>
                );
              })}
              <span className="h7-ts-x" role="cell">
                <span className="h7-ts-ml">{mx.lev}</span>
                {row.maxLev ? <><b>{row.maxLev}x</b><small>{row.maxLevVenues.slice(0, 2).join(" · ")}</small></> : <b aria-label={mx.none}>—</b>}
              </span>
              <span className="h7-ts-x" role="cell">
                <span className="h7-ts-ml">{mx.fee}</span>
                {row.minTaker != null ? <><b>{pct(row.minTaker)}</b><small>{row.minTakerVenues.slice(0, 2).join(" · ")}</small></> : <b aria-label={mx.none}>—</b>}
              </span>
            </div>
          ))}
        </div>
        <p className="h7-ts-lg" aria-hidden="true"><span><i data-lane="spot" data-on="" />{t.lanes.spot}</span><span><i data-lane="perp" data-on="" />{t.lanes.perp}</span></p>
      </div>
    </section>
  );
}

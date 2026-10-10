// /liquidations — today's crypto liquidations from the market collector feed (see src/data/market-data-pages.js).
import React from "react";
import { LIQUIDATIONS_PATH, dataPageCopy, formatUsdCompact, formatUsdFull, formatUtc, formatUtcTime, readLiquidations } from "../../data/market-data-pages.js";
import { DataPageHero, DataPageTail, DataUnavailable, textDirection } from "./DataPageFrame.jsx";
import { useMarketEvents } from "./useMarketEvents.js";

const pct = (share) => `${Math.round(share * 100)}%`;

function WindowCard({ label, window: w, copy, primary }) {
  if (!w) return null;
  return (
    <article className={`nxd-stat${primary ? " nxd-stat--primary" : ""}`}>
      <h3>{label}</h3>
      <p className="nxd-stat__value" dir="ltr"><span>{formatUsdCompact(w.totalUsd)}</span></p>
      <p className="nxd-stat__meta">
        <span className="nxd-long" dir="ltr">{copy.longs}: {formatUsdCompact(w.longUsd)}</span>
        <span className="nxd-short" dir="ltr">{copy.shorts}: {formatUsdCompact(w.shortUsd)}</span>
        <span dir="ltr">{copy.orders(w.orders)}</span>
      </p>
    </article>
  );
}

export function LiquidationsPage({ locale = "en", initialFeed }) {
  const copy = dataPageCopy(locale);
  const page = copy.liquidations;
  const feed = useMarketEvents(initialFeed);
  const data = readLiquidations(feed);
  const day = data?.windows.h24 || data?.windows.h4 || data?.windows.h1;
  return (
    <main className="v6 v2-page v3-page nxd nxd--liquidations" id="top" dir={textDirection(locale)} data-testid="liquidations-page">
      <DataPageHero locale={locale} page={page} pathname={LIQUIDATIONS_PATH} generatedAt={data?.generatedAt} sourceLine={page.sourceLine}>
        {data?.coverageSince ? <p className="nxd-coverage"><span>{page.coverage}</span> <time dateTime={data.coverageSince} dir="ltr">{formatUtc(data.coverageSince)}</time></p> : null}
      </DataPageHero>

      {!data ? <DataUnavailable locale={locale} /> : (
        <>
          <section className="nxd-stats v2-shell" data-rv="1" aria-label={page.total}>
            <WindowCard label={page.h1Window} window={data.windows.h1} copy={page} />
            <WindowCard label={page.h4Window} window={data.windows.h4} copy={page} />
            <WindowCard label={page.h24Window} window={data.windows.h24} copy={page} primary />
          </section>

          {day ? (
            <section className="nxd-split v2-shell" data-rv="1" aria-labelledby="nxd-split-h">
              <h2 id="nxd-split-h">{page.split}</h2>
              <div className="nxd-bar" role="img" aria-label={`${page.longs} ${pct(day.longShare)} · ${page.shorts} ${pct(1 - day.longShare)}`} dir="ltr">
                <span className="nxd-bar__long" style={{ width: `${Math.max(2, Math.min(98, day.longShare * 100))}%` }} />
                <span className="nxd-bar__short" />
              </div>
              <p className="nxd-bar__legend">
                <span className="nxd-long" dir="ltr"><b>{pct(day.longShare)}</b> {page.longs} · {formatUsdFull(day.longUsd)}</span>
                <span className="nxd-short" dir="ltr"><b>{pct(1 - day.longShare)}</b> {page.shorts} · {formatUsdFull(day.shortUsd)}</span>
              </p>
            </section>
          ) : null}

          {day ? (
            <section className="nxd-two v2-shell" data-rv="1">
              <div className="nxd-panel">
                <h2>{page.topTitle}</h2>
                {day.topSymbols.length ? (
                  <table className="nxd-table" dir="ltr">
                    <thead><tr><th scope="col">{page.colSymbol}</th><th scope="col">{page.colVenue}</th><th scope="col" className="num">{page.colUsd}</th><th scope="col" className="num">{page.colShare}</th></tr></thead>
                    <tbody>
                      {day.topSymbols.map((row) => (
                        <tr key={row.raw}>
                          <th scope="row" translate="no">{row.base}</th>
                          <td translate="no">{row.venue}</td>
                          <td className="num">{formatUsdCompact(row.usd)}</td>
                          <td className="num">{pct(row.share)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="nxd-muted">—</p>}
              </div>
              <div className="nxd-panel nxd-largest">
                <h2>{page.largestTitle}</h2>
                {day.largest ? (
                  <>
                    <p className="nxd-largest__value" dir="ltr">{formatUsdFull(day.largest.usd)}</p>
                    <p className="nxd-largest__line">{page.largestLine({ base: day.largest.base, venue: day.largest.venue, side: day.largest.side === "short" ? page.sideShort : page.sideLong })}</p>
                    {day.largest.at ? <p className="nxd-muted"><time dateTime={day.largest.at} dir="ltr">{formatUtcTime(day.largest.at)}</time></p> : null}
                  </>
                ) : <p className="nxd-muted">—</p>}
              </div>
            </section>
          ) : null}
        </>
      )}

      <DataPageTail locale={locale} page={page} pathname={LIQUIDATIONS_PATH} />
    </main>
  );
}

export default LiquidationsPage;

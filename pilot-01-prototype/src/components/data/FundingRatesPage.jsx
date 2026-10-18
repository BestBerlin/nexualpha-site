// /funding-rates — Binance vs OKX perpetual funding for the top symbols, from the market collector feed.
import React from "react";
import { localizedHref } from "../../data/locale-routing.js";
import { SectionRule, UtcRuleStamp } from "../shared/DataRule.jsx";
import { FUNDING_RATES_PATH, dataPageCopy, formatCountdown, formatRatePct, formatUtcTime, readFunding } from "../../data/market-data-pages.js";
import { DataPageHero, DataPageTail, DataUnavailable, textDirection } from "./DataPageFrame.jsx";
import { prefersReducedMotion, useClientNow, useMarketEvents } from "./useMarketEvents.js";

const tone = (rate) => (rate == null ? "" : rate > 0 ? " pos" : rate < 0 ? " neg" : "");

function NextCell({ at, now, copy }) {
  if (!at) return <span className="nxd-muted">—</span>;
  const remaining = now == null ? null : Date.parse(at) - now;
  return (
    <span className="nxd-next" dir="ltr">
      <time dateTime={at}>{formatUtcTime(at)}</time>
      <small aria-hidden={remaining == null ? "true" : undefined} style={remaining == null ? { visibility: "hidden" } : undefined}>{copy.nextIn} {remaining == null ? "00:00:00" : formatCountdown(remaining, { seconds: !prefersReducedMotion() })}</small>
    </span>
  );
}

export function FundingRatesPage({ locale = "en", initialFeed }) {
  const copy = dataPageCopy(locale);
  const page = copy.funding;
  const feed = useMarketEvents(initialFeed);
  const data = readFunding(feed);
  const now = useClientNow(Boolean(data));
  return (
    <main className="v6 v2-page v3-page nxd nxd--funding" id="top" dir={textDirection(locale)} data-testid="funding-rates-page">
      <DataPageHero locale={locale} page={page} pathname={FUNDING_RATES_PATH} generatedAt={data?.generatedAt} sourceLine={page.sourceLine} />

      <nav className="v2-shell nxd-legend"><a href={localizedHref("/funding-rates/matrix", { locale })}>{copy.nav.funding} · {locale === "zh-Hans" ? "跨所矩阵与计算器" : locale === "zh-Hant" ? "跨所矩陣與計算器" : "Matrix"}</a></nav>

      {!data ? <DataUnavailable locale={locale} /> : (
        <section className="nxd-funding v2-shell" data-rv="1" aria-label={page.h1}>
          <SectionRule stamp={<UtcRuleStamp iso={data.generatedAt} />} dateTime={data.generatedAt} />
          <p className="nxd-legend"><span className="pos">▲</span> <span className="neg">▼</span> {page.legend}</p>
          <table className="nxd-table nxd-table--funding" dir="ltr">
            <thead>
              <tr>
                <th scope="col">{page.colSymbol}</th>
                <th scope="col" className="num">{page.colBinance}<small>{page.perPeriod}</small></th>
                <th scope="col" className="num">{page.colOkx}<small>{page.perPeriod}</small></th>
                <th scope="col" className="num">{page.colApr}<small>{page.colBinance} / {page.colOkx}</small></th>
                <th scope="col" className="num">{page.colNext}<small>{page.colBinance} / {page.colOkx}</small></th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.symbol}>
                  <th scope="row" translate="no">{row.symbol}</th>
                  <td className={`num${tone(row.binanceRate)}`} data-label={page.colBinance}>{formatRatePct(row.binanceRate)}</td>
                  <td className={`num${tone(row.okxRate)}`} data-label={page.colOkx}>{formatRatePct(row.okxRate)}</td>
                  <td className="num" data-label={page.colApr}>
                    <span className={tone(row.binanceApr)}>{formatRatePct(row.binanceApr, 1)}</span>
                    <span className="nxd-sep" aria-hidden="true"> / </span>
                    <span className={tone(row.okxApr)}>{formatRatePct(row.okxApr, 1)}</span>
                  </td>
                  <td className="num nxd-nextcell" data-label={page.colNext}>
                    <NextCell at={row.binanceNextAt} now={now} copy={page} />
                    <span className="nxd-sep" aria-hidden="true"> / </span>
                    <NextCell at={row.okxNextAt} now={now} copy={page} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="nxd-estnote">{page.estNote}</p>
        </section>
      )}

      <DataPageTail locale={locale} page={page} pathname={FUNDING_RATES_PATH} />
    </main>
  );
}

export default FundingRatesPage;

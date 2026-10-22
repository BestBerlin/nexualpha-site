// /funding-rates — Binance vs OKX perpetual funding for the top symbols, from the market collector feed.
import React, { useEffect, useRef } from "react";
import { localizedHref } from "../../data/locale-routing.js";
import { SectionRule, UtcRuleStamp } from "../shared/DataRule.jsx";
import { FUNDING_RATES_PATH, dataPageCopy, formatCountdown, formatRatePct, formatUtcTime, readFunding } from "../../data/market-data-pages.js";
import { DataPageHero, DataPageTail, DataUnavailable, textDirection } from "./DataPageFrame.jsx";
import { prefersReducedMotion, useClientNow, useMarketEvents } from "./useMarketEvents.js";

const tone = (rate) => (rate == null ? "" : rate > 0 ? " pos" : rate < 0 ? " neg" : "");

// Heat language shared with the home board (owner 2026-10-22): teal = shorts pay longs, amber = longs pay shorts,
// tint = |APR| against the table's largest (floor 20% APR), ring + breathing dot on the single most extreme reading.
const PEAK = {
  en: "Most extreme", "zh-Hans": "最极端", "zh-Hant": "最極端", ja: "最も極端", ko: "가장 극단적", tr: "En uç", es: "Más extremo",
  "pt-BR": "Mais extremo", fr: "Le plus extrême", de: "Am extremsten", ru: "Экстремум", ar: "الأكثر تطرفًا", id: "Paling ekstrem",
  vi: "Cực trị", it: "Più estremo", ur: "سب سے نمایاں", uk: "Екстремум",
};
const peakId = (symbol) => String(symbol).toLowerCase().replace(/[^a-z0-9]+/g, "-");
const heatOf =(apr, scale) => (apr == null ? 0 : Math.min(1, Math.abs(apr) / scale)).toFixed(3);

// A rate that tweens to its new value and flashes its cell once (direction colour) when the feed refreshes.
function LiveRate({ value, digits = 4 }) {
  const ref = useRef(null), previous = useRef(value);
  useEffect(() => {
    const before = previous.current;
    previous.current = value;
    if (before === value || before == null || value == null || prefersReducedMotion()) return;
    const cell = ref.current?.closest("td");
    const cls = value > before ? "nxd-up" : "nxd-dn";
    cell?.classList.remove("nxd-up", "nxd-dn"); void cell?.offsetWidth; cell?.classList.add(cls);
    const flash = setTimeout(() => cell?.classList.remove(cls), 900);
    let stopped = false, stop;
    import("../v7/home7-board-motion.js").then(({ tweenValue }) => {
      if (!stopped && ref.current) stop = tweenValue(ref.current, before, value, (n) => formatRatePct(n, digits));
    });
    return () => { stopped = true; clearTimeout(flash); stop?.(); };
  }, [value, digits]);
  return <span ref={ref}>{formatRatePct(value, digits)}</span>;
}

function RateCell({ rate, apr, label, scale, peak, peakLabel }) {
  return (
    <td className={`num nxd-heat${tone(rate)}${peak ? " is-peak" : ""}`} data-label={label} style={{ "--heat": heatOf(apr, scale) }}>
      <span className="nxd-heat__v"><LiveRate value={rate} />{peak ? <small className="nxd-peak"><i aria-hidden="true" />{peakLabel}</small> : null}</span>
    </td>
  );
}

function NextCell({ at, now, copy }) {
  if (!at) return null;
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
  const rows = data ? data.rows.filter((row) => row.binanceRate != null && row.okxRate != null) : [];
  const cells = rows.flatMap((row) => [{ symbol: row.symbol, venue: "binance", rate: row.binanceRate, apr: row.binanceApr }, { symbol: row.symbol, venue: "okx", rate: row.okxRate, apr: row.okxApr }]).filter((c) => c.apr != null);
  const scale = Math.max(0.2, ...cells.map((c) => Math.abs(c.apr)));
  const peak = cells.length > 1 ? cells.reduce((a, b) => (Math.abs(b.apr) > Math.abs(a.apr) ? b : a)) : null;
  const peakLabel = PEAK[locale] || PEAK.en;
  return (
    <main className="v6 v2-page v3-page nxd nxd--funding" id="top" dir={textDirection(locale)} data-testid="funding-rates-page">
      <DataPageHero locale={locale} page={page} pathname={FUNDING_RATES_PATH} generatedAt={data?.generatedAt} sourceLine={page.sourceLine} />

      <nav className="v2-shell nxd-legend"><a href={localizedHref("/funding-rates/matrix", { locale })}>{copy.nav.funding} · {locale === "zh-Hans" ? "跨所矩阵与计算器" : locale === "zh-Hant" ? "跨所矩陣與計算器" : "Matrix"}</a></nav>

      {!data ? <DataUnavailable locale={locale} /> : (
        <section className="nxd-funding v2-shell" data-rv="1" aria-label={page.h1}>
          <SectionRule stamp={<UtcRuleStamp iso={data.generatedAt} />} dateTime={data.generatedAt} />
          <div className="nxd-heatkey">
            {peak ? (
              <a className={`nxd-peakline${tone(peak.apr)}`} href={`#fr-${peakId(peak.symbol)}`}>
                <span className="nxd-peak"><i aria-hidden="true" />{peakLabel}</span>
                <b translate="no">{peak.symbol}</b>
                <span className="nxd-peakline__venue">{peak.venue === "okx" ? page.colOkx : page.colBinance}</span>
                <span className="nxd-peakline__v" dir="ltr">{formatRatePct(peak.rate)} · {formatRatePct(peak.apr, 1)}</span>
              </a>
            ) : null}
            <span className="nxd-heatkey__scale" aria-hidden="true"><b className="neg">▼ −</b><i /><b className="pos">+ ▲</b></span>
            <p className="nxd-legend">{page.legend}</p>
          </div>
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
              {rows.map((row) => (
                <tr key={row.symbol} id={`fr-${peakId(row.symbol)}`} className={peak && peak.symbol === row.symbol ? "is-peak-row" : undefined}>
                  <th scope="row" translate="no">{row.symbol}</th>
                  <RateCell rate={row.binanceRate} apr={row.binanceApr} label={page.colBinance} scale={scale} peak={peak?.symbol === row.symbol && peak.venue === "binance"} peakLabel={peakLabel} />
                  <RateCell rate={row.okxRate} apr={row.okxApr} label={page.colOkx} scale={scale} peak={peak?.symbol === row.symbol && peak.venue === "okx"} peakLabel={peakLabel} />
                  <td className="num" data-label={page.colApr}>
                    <span className={tone(row.binanceApr)}>{row.binanceApr == null ? null : formatRatePct(row.binanceApr, 1)}</span>
                    {row.binanceApr != null && row.okxApr != null ? <span className="nxd-sep" aria-hidden="true"> / </span> : null}
                    <span className={tone(row.okxApr)}>{row.okxApr == null ? null : formatRatePct(row.okxApr, 1)}</span>
                  </td>
                  <td className="num nxd-nextcell" data-label={page.colNext}>
                    <NextCell at={row.binanceNextAt} now={now} copy={page} />
                    {row.binanceNextAt && row.okxNextAt ? <span className="nxd-sep" aria-hidden="true"> / </span> : null}
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

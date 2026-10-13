// /etf-flows — US spot crypto ETF daily flows from issuer-published fund data (src/data/etf-flows.js). Every number is
// read from the snapshot; a fund that has not published a day shows "—", nothing is estimated.
import React, { useState } from "react";
import { SectionRule } from "../shared/DataRule.jsx";
import { ETF_FLOWS_JSON_PATH } from "../../data/intel-tools-routes.js";
import { fill, intelToolsCopy } from "../../data/intel-tools-copy.js";
import {
  ETF_CHART, ETF_CHART_WINDOWS, etfAssetView, etfAssets, etfChartModel, formatAmount, formatFeePct, formatNav, formatSignedMillions,
  formatSignedUsd, formatUsdShort, readEtfFlows,
} from "../../data/etf-flows.js";
import { etfSignup } from "../../data/etf-signup.js";
import { SourcesList, ToolHero, ToolTail, ToolUnavailable, textDirection, useSnapshot } from "./shared.jsx";

function FlowChart({ view, page, locale, windowDays }) {
  const days = view.days.slice(-windowDays);
  const label = fill(page.chartLabel, { asset: page.assets[view.asset] || view.asset });
  const models = [["wide", ETF_CHART.wide], ["compact", ETF_CHART.compact]].map(([variant, size]) => [variant, etfChartModel(days, { ...size, format: (v) => formatUsdShort(v) })]);
  return (
    <div className="nxd-history__chart" dir="ltr">
      {models.map(([variant, m]) => (
        <svg key={variant} className={`nxd-chart nxd-chart--${variant}`} viewBox={`0 0 ${m.width} ${m.height}`} role="img" aria-label={label} lang={locale} data-testid={`etf-chart-${variant}`}>
          <title>{label}</title>
          <desc>{days.map((d) => `${d.date}: ${formatSignedUsd(d.totalUsd)}`).join("; ")}</desc>
          {m.ticks.map((t) => <g key={t.value} className="nxd-chart__tick"><line x1={m.plot.x} x2={m.plot.x + m.plot.width} y1={t.y} y2={t.y} /><text x={m.plot.x - 6} y={t.y + 4} textAnchor="end">{t.label}</text></g>)}
          {m.bars.map((b) => (
            <g key={b.date} className={`nxi-bar nxi-bar--${b.sign}${b.partial ? " nxi-bar--partial" : ""}`}>
              <title>{`${b.date} · ${formatSignedUsd(b.totalUsd)}${b.partial ? ` · ${page.partialDay}` : ""}`}</title>
              <rect x={b.x} y={b.y} width={b.width} height={b.height} />
            </g>
          ))}
          <line className="nxd-chart__base" x1={m.plot.x} x2={m.plot.x + m.plot.width} y1={m.plot.baseline} y2={m.plot.baseline} />
          {m.xLabels.map((l) => <text key={l.x} className="nxd-chart__x" x={l.x} y={l.y} textAnchor="middle">{l.label}</text>)}
        </svg>
      ))}
    </div>
  );
}

function FundsTable({ view, page, digits }) {
  const latestDate = view.latest?.date;
  const showFee = view.funds.some((f) => f.feePct != null);
  return (
    <div className="nxi-scroll" role="region" aria-labelledby="nxi-funds-h" tabIndex={0}>
      <table className="nxd-table nxi-table" dir="ltr" data-testid="etf-funds-table">
        <thead><tr>
          <th scope="col">{page.colFund}</th><th scope="col">{page.colIssuer}</th>
          <th scope="col" className="num">{page.colFlow}{latestDate ? <small>{latestDate}</small> : null}</th>
          <th scope="col" className="num">{page.colAum}</th><th scope="col" className="num">{page.colHoldings}</th>
          <th scope="col" className="num">{page.colShares}</th><th scope="col" className="num">{page.colNav}</th>
          {showFee ? <th scope="col" className="num">{page.colFee}</th> : null}
          <th scope="col">{page.colAsOf}</th><th scope="col">{page.colSource}</th>
        </tr></thead>
        <tbody>
          {view.funds.map((f) => {
            const flow = latestDate ? view.latest.flows[f.ticker] : null;
            return (
              <tr key={f.ticker}>
                <th scope="row"><span translate="no">{f.ticker}</span><small>{f.name}</small></th>
                <td>{f.issuer}</td>
                <td className={`num ${flow > 0 ? "pos" : flow < 0 ? "neg" : ""}`}>{formatSignedUsd(flow)}</td>
                <td className="num" title={f.latest.aumUsd != null ? formatSignedUsd(f.latest.aumUsd).replace("+", "") : undefined}>{formatUsdShort(f.latest.aumUsd)}</td>
                <td className="num">{formatAmount(f.latest.holdings, digits)}</td>
                <td className="num">{formatAmount(f.latest.sharesOutstanding)}</td>
                <td className="num">{formatNav(f.latest.nav)}</td>
                {showFee ? <td className="num">{formatFeePct(f.feePct)}</td> : null}
                <td>{f.latest.date || "—"}</td>
                <td>{f.sourceUrl ? <a href={f.sourceUrl} target="_blank" rel="noopener nofollow">{f.sourceName || f.issuer}</a> : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DailyMatrix({ view, page }) {
  const rows = view.days.slice(-10).reverse();
  if (!rows.length) return null;
  return (
    <section className="nxi-daily v2-shell" aria-labelledby="nxi-daily-h">
      <SectionRule stamp={rows.length} />
      <h2 id="nxi-daily-h">{page.dailyTitle}</h2>
      <div className="nxi-scroll" role="region" aria-labelledby="nxi-daily-h" tabIndex={0}>
        <table className="nxd-table nxi-table nxi-matrix" dir="ltr" data-testid="etf-daily-table">
          <thead><tr><th scope="col">{page.colDate}</th>{view.funds.map((f) => <th key={f.ticker} scope="col" className="num" translate="no">{f.ticker}</th>)}<th scope="col" className="num">{page.colTotal}</th></tr></thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.date}>
                <th scope="row">{d.date}</th>
                {view.funds.map((f) => { const v = d.flows[f.ticker]; return <td key={f.ticker} className={`num ${v > 0 ? "pos" : v < 0 ? "neg" : ""}`}>{v == null ? "—" : formatSignedMillions(v)}</td>; })}
                <td className={`num nxi-total ${d.totalUsd > 0 ? "pos" : d.totalUsd < 0 ? "neg" : ""}`}>{formatSignedMillions(d.totalUsd)}{d.reported < d.expected ? <small>{fill(page.reporting, { n: d.reported, m: d.expected })}</small> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function EtfFlowsPage({ locale = "en", market, initial }) {
  const copy = intelToolsCopy(locale);
  const page = copy.etf;
  const json = useSnapshot(ETF_FLOWS_JSON_PATH, initial);
  const data = readEtfFlows(json);
  const assets = data ? etfAssets(data) : [];
  const [assetChoice, setAsset] = useState(null);
  const [windowDays, setWindow] = useState(30);
  const asset = assets.includes(assetChoice) ? assetChoice : assets[0];
  const view = data && asset ? etfAssetView(data, asset) : null;
  const assetName = page.assets[asset] || asset;
  const signup = etfSignup({ locale, market });
  const digits = asset === "BTC" ? 2 : 0;
  const latest = view?.latest || null;
  const since = view?.since || view?.asOf || data?.generatedAt?.slice(0, 10);
  return (
    <main className="v6 v2-page v3-page nxd nxi nxi--etf" id="top" dir={textDirection(locale)} data-testid="etf-flows-page">
      <ToolHero locale={locale} market={market} page={page} generatedAt={data?.generatedAt} />
      {!view ? <ToolUnavailable locale={locale} /> : (
        <>
          {assets.length > 1 ? (
            <div className="nxi-tabs v2-shell" role="group" aria-label={page.tabs}>
              {assets.map((a) => <button key={a} type="button" className="nxi-tab" aria-pressed={a === asset} onClick={() => setAsset(a)} data-testid={`etf-tab-${a}`}>{page.assets[a] || a}</button>)}
            </div>
          ) : null}
          <section className="nxd-stats v2-shell" aria-label={assetName} data-testid="etf-summary">
            {latest ? (
              <>
                <article className="nxd-stat nxd-stat--primary">
                  <h3>{fill(page.netFlowOn, { date: latest.date })}</h3>
                  <p className={`nxd-stat__value ${latest.totalUsd > 0 ? "pos" : latest.totalUsd < 0 ? "neg" : ""}`} dir="ltr"><span>{formatSignedUsd(latest.totalUsd)}</span></p>
                  <p className="nxd-stat__meta"><span>{fill(page.reporting, { n: latest.reported, m: latest.expected })}</span></p>
                </article>
                <article className="nxd-stat">
                  <h3>{fill(page.cumulative, { date: since })}</h3>
                  <p className="nxd-stat__value" dir="ltr"><span>{formatSignedUsd(view.cumulativeUsd)}</span></p>
                  <p className="nxd-stat__meta"><span>{fill(page.lastDays, { n: view.days.length })}</span></p>
                </article>
              </>
            ) : null}
            <article className="nxd-stat">
              <h3>{page.aum}</h3>
              <p className="nxd-stat__value" dir="ltr"><span>{formatUsdShort(view.aumUsd)}</span></p>
              <p className="nxd-stat__meta">
                {view.holdings != null ? <span dir="ltr">{fill(page.holdings, { asset })}: {formatAmount(view.holdings, digits)}</span> : null}
                <span>{fill(page.fundsCount, { n: view.funds.length })}{view.asOf ? ` · ${view.asOf}` : ""}</span>
              </p>
            </article>
          </section>

          <section className="nxd-history v2-shell" aria-labelledby="nxi-chart-h" data-testid="etf-chart">
            <SectionRule stamp={latest?.date || null} />
            <div className="nxi-chart-head">
              <h2 id="nxi-chart-h">{page.chartTitle}</h2>
              {view.days.length >= 2 ? (
                <div className="nxi-tabs nxi-tabs--small" role="group" aria-label={page.chartTitle}>
                  {ETF_CHART_WINDOWS.map((n) => <button key={n} type="button" className="nxi-tab" aria-pressed={windowDays === n} onClick={() => setWindow(n)}>{`${n}D`}</button>)}
                </div>
              ) : null}
            </div>
            {view.days.length < 2 ? <p className="nxd-history__collecting" role="status">{fill(page.collecting, { date: since })}</p> : (
              <>
                <FlowChart view={view} page={page} locale={locale} windowDays={windowDays} />
                <p className="nxd-history__legend">
                  <span className="pos"><i className="nxd-swatch nxd-swatch--long" aria-hidden="true" /> {page.inflow}</span>
                  <span className="neg"><i className="nxd-swatch nxd-swatch--short" aria-hidden="true" /> {page.outflow}</span>
                </p>
              </>
            )}
          </section>

          <section className="nxi-funds v2-shell" aria-labelledby="nxi-funds-h">
            <SectionRule stamp={view.funds.length} />
            <h2 id="nxi-funds-h">{page.fundsTitle} · {assetName}</h2>
            <FundsTable view={view} page={page} digits={digits} />
          </section>

          <DailyMatrix view={view} page={page} />

          {signup ? (
            <aside className="nxi-cta v2-shell" data-testid="etf-cta">
              <div>
                <h2>{fill(page.ctaTitle, { asset: assetName })}</h2>
                <p>{page.ctaBody}</p>
              </div>
              <a className="nxi-cta__btn" href={signup.href} target="_blank" rel="sponsored noopener" data-offer-link="go" data-cta-platform={signup.venue} data-cta-placement="etf-flows">{fill(page.ctaButton, { asset: assetName, venue: signup.name })}</a>
            </aside>
          ) : null}
        </>
      )}
      {data ? <SourcesList locale={locale} sources={data.sources} /> : null}
      <ToolTail locale={locale} market={market} page={page} current="etf" jsonPath={ETF_FLOWS_JSON_PATH} />
    </main>
  );
}

export default EtfFlowsPage;

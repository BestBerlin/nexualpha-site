// "Last 30 days" on /liquidations (2026-10-11): daily liquidation totals from the collector's `history` block drawn as
// a dependency-free inline SVG (longs from the baseline, shorts stacked), plus two facts in words. Server-rendered from
// the same feed as the live numbers; while fewer than two days exist the section says the history is being collected.
// The chart is always LTR (dates and numerals); the surrounding copy follows the page direction.
import React from "react";
import { formatUsdCompact, formatUtc } from "../../data/market-data-pages.js";
import { CHART_COMPACT_HEIGHT, CHART_COMPACT_WIDTH, historyChartModel, historyFacts } from "../../data/liquidation-history.js";

const dayLabel = (iso) => formatUtc(`${iso}T00:00:00Z`).slice(0, 10);

export function HistoryChart({ model, page, locale, variant = "wide" }) {
  const { width, height, plot, bars, ticks, xLabels } = model;
  const summary = bars.map((b) => `${b.day}: ${formatUsdCompact(b.totalUsd)}`).join("; ");
  return (
    <svg className={`nxd-chart nxd-chart--${variant}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={page.historyChartLabel} dir="ltr" lang={locale} preserveAspectRatio="xMidYMid meet" data-testid={`liquidation-history-chart-${variant}`}>
      <title>{page.historyChartLabel}</title>
      <desc>{summary}</desc>
      {ticks.map((t) => (
        <g key={t.y} className="nxd-chart__tick">
          <line x1={plot.x} x2={plot.x + plot.width} y1={t.y} y2={t.y} />
          <text x={plot.x - 8} y={t.y + 4} textAnchor="end">{t.label}</text>
        </g>
      ))}
      {bars.map((b) => (
        <g key={b.day} className={`nxd-chart__bar${b.partial ? " nxd-chart__bar--partial" : ""}`}>
          <title>{`${b.day} · ${formatUsdCompact(b.totalUsd)} · ${page.longs} ${formatUsdCompact(b.longUsd)} · ${page.shorts} ${formatUsdCompact(b.shortUsd)}${b.partial ? ` · ${page.historyToday}` : ""}`}</title>
          {b.long.height > 0 ? <rect className="nxd-chart__long" x={b.x} y={b.long.y} width={b.width} height={b.long.height} /> : null}
          {b.short.height > 0 ? <rect className="nxd-chart__short" x={b.x} y={b.short.y} width={b.width} height={b.short.height} /> : null}
          {b.partial ? <rect className="nxd-chart__partial" x={b.x} y={b.short.height > 0 ? b.short.y : b.long.y} width={b.width} height={Math.max(0, plot.baseline - (b.short.height > 0 ? b.short.y : b.long.y))} /> : null}
        </g>
      ))}
      <line className="nxd-chart__base" x1={plot.x} x2={plot.x + plot.width} y1={plot.baseline} y2={plot.baseline} />
      {xLabels.map((l) => <text key={l.x} className="nxd-chart__x" x={l.x} y={l.y} textAnchor="middle">{l.label}</text>)}
    </svg>
  );
}

export function LiquidationHistory({ history, now24hUsd, page, locale }) {
  if (!history) return null;
  if (history.collecting) {
    return (
      <section className="nxd-history v2-shell" id="history" data-rv="1" aria-labelledby="nxd-history-h" data-testid="liquidation-history" data-state="collecting">
        <h2 id="nxd-history-h">{page.historyTitle}</h2>
        <p className="nxd-history__collecting" role="status">{page.historyCollecting(dayLabel(history.since.slice(0, 10)))}</p>
      </section>
    );
  }
  const model = historyChartModel(history.daily);
  const compact = historyChartModel(history.daily, { width: CHART_COMPACT_WIDTH, height: CHART_COMPACT_HEIGHT });
  const facts = historyFacts(history, now24hUsd);
  return (
    <section className="nxd-history v2-shell" id="history" data-rv="1" aria-labelledby="nxd-history-h" data-testid="liquidation-history" data-state="ready">
      <h2 id="nxd-history-h">{page.historyTitle}</h2>
      <p className="nxd-history__lead">{page.historyLead}</p>
      {facts?.vsAverage || facts?.rank ? (
        <ul className="nxd-history__facts" data-testid="liquidation-history-facts">
          {facts.vsAverage ? <li>{page.historyVsAvg(facts.vsAverage)}</li> : null}
          {facts.rank ? <li>{page.historyRank(facts.rank.rank, facts.rank.days)}</li> : null}
        </ul>
      ) : null}
      <div className="nxd-history__chart" dir="ltr">
        {/* two viewBoxes of the same 30 days: CSS shows one per breakpoint so axis text stays legible on phones */}
        <HistoryChart model={model} page={page} locale={locale} variant="wide" />
        <HistoryChart model={compact} page={page} locale={locale} variant="compact" />
      </div>
      <p className="nxd-history__legend">
        <span className="nxd-long"><i className="nxd-swatch nxd-swatch--long" aria-hidden="true" /> {page.longs}</span>
        <span className="nxd-short"><i className="nxd-swatch nxd-swatch--short" aria-hidden="true" /> {page.shorts}</span>
        <span className="nxd-muted">{page.historyAxis}</span>
      </p>
      <dl className="nxd-history__stats" dir="ltr">
        {history.avgDailyUsd != null ? <div><dt>{page.historyAvg}</dt><dd>{formatUsdCompact(history.avgDailyUsd)}</dd></div> : null}
        {facts?.today ? <div><dt>{page.historyToday}</dt><dd>{formatUsdCompact(facts.today.totalUsd)}</dd></div> : null}
        {facts?.largestDay ? <div><dt>{page.historyLargest}</dt><dd>{formatUsdCompact(facts.largestDay.totalUsd)} <small>{facts.largestDay.day}</small></dd></div> : null}
        <div><dt>{page.coverage}</dt><dd><time dateTime={history.since}>{dayLabel(history.since.slice(0, 10))}</time> <small>{page.historyDays(history.days)}</small></dd></div>
      </dl>
      {facts?.today ? <p className="nxd-muted nxd-history__note">{page.historyPartial}</p> : null}
    </section>
  );
}

export default LiquidationHistory;

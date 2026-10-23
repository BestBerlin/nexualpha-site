import { SignupEvidence } from "../shared/SignupEvidence.jsx";
import { WHALE_COINS, coinPageForWhaleCoin, whaleCoinPath, whaleRowCoin, whaleSignalBucket } from "../../data/whale-routes.js";
import React, { useEffect, useMemo, useState } from "react";
import { SectionRule, UtcRuleStamp } from "../shared/DataRule.jsx";
import { NewsVenueOffer } from "../v3/news/NewsVenueOffer.jsx";
import { localizedHref } from "../../data/locale-routing.js";
import { startJsonPolling } from "../shared/json-polling.js";
import {
  LONG_SHORT_API_PATH,
  LONG_SHORT_PATH,
  RADAR_REFRESH_MS,
  RADAR_SIGNUP_VENUES,
  WHALES_API_PATH,
  WHALES_PATH,
  extractInitialRadar,
  formatAmount,
  formatOpenInterest,
  formatPct,
  formatRatio,
  formatUsd,
  formatUtc,
  limitRowsBySymbols,
  normalizeLongShort,
  normalizeWhales,
  radarCopy,
  sortRows,
  venueDisplayName,
  venueGoHref,
} from "../../data/radar.js";
import { whaleExplorerHref, whaleSentenceParts, whaleStealthLabel, whalesCopy } from "../../data/whales-home.js";
import { formatSgt } from "../../data/local-time.js";
import "./radar.css";
import { NEUTRAL_CTA_LOCALES } from "../../data/locale-policy.js";
import { dataUpdatedStamp } from "../../data/data-updated.js";

// The collector's "why it matters" line is English-only evidence text; localized pages already carry the localized
// WhaleSentence, so the English line is shown on English pages only (no English text on zh/ja/ar pages).
const isEnglishLocale = (locale) => /^en(?:-|$)/i.test(String(locale || "en"));
const CONFIDENCE_LABELS = {
  en: "Confidence", "zh-Hans": "置信度", "zh-Hant": "置信度", ja: "信頼度", ko: "신뢰도", es: "Confianza", "pt-BR": "Confiança",
  fr: "Confiance", de: "Konfidenz", it: "Affidabilità", ru: "Достоверность", uk: "Достовірність", tr: "Güven", id: "Keyakinan",
  vi: "Độ tin cậy", ar: "درجة الثقة", ur: "اعتماد",
};
const confidenceLabel = (locale) => CONFIDENCE_LABELS[locale] || (String(locale).startsWith("zh") ? "置信度" : CONFIDENCE_LABELS.en);
const directionFor = (locale) => (["ar", "ur"].includes(locale) ? "rtl" : "ltr");

// Neutral locales (ru/ar/zh-Hant/ur/uk/vi) carry no partner offer or sponsored row links.
const SOURCE_DISPLAY = { btcMempool: "mempool.space", ethereumRpc: "PublicNode Ethereum RPC", "publicnode-ethereum-rpc": "PublicNode" };
const chainDisplay = (chain) => (chain ? `${chain.charAt(0).toUpperCase()}${chain.slice(1)}` : "");
const sourceDisplay = (value) => SOURCE_DISPLAY[value] || venueDisplayName(value);
const isUnknownLabel = (label) => !label || String(label).toLowerCase() === "unknown";

function useRadarFeed(kind, initial) {
  const apiPath = kind === "longShort" ? LONG_SHORT_API_PATH : WHALES_API_PATH;
  const normalize = kind === "longShort" ? normalizeLongShort : normalizeWhales;
  const [feed, setFeed] = useState(() => normalize(extractInitialRadar(initial, kind)));

  useEffect(() => {
    const stop = startJsonPolling({
      request: apiPath,
      intervalMs: RADAR_REFRESH_MS,
      immediate: !feed.updatedAt || !feed.rows.length,
      cache: "no-cache",
      isData: (next) => next && typeof next === "object",
      onData: (next) => setFeed(normalize(next)),
      onError: () => {
        setFeed((current) => {
          const age = current.updatedAt ? Date.now() - Date.parse(current.updatedAt) : Number.POSITIVE_INFINITY;
          return age > RADAR_REFRESH_MS ? { ...current, status: "unavailable" } : current;
        });
      },
    });
    return stop;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- the API path is fixed by route kind

  return feed;
}

function RadarHero({ locale, page, pathname, feed, apiPath }) {
  const copy = radarCopy(locale);
  const sourceLine = feed.sources.length ? feed.sources.map(sourceDisplay).join(" · ") : page.sourceNames;
  const statusLabel = copy.statuses?.[feed.status] || feed.status;
  return (
    <header className="nxradar-hero v2-shell">
      <nav className="nxradar-crumbs" aria-label="Breadcrumb">
        <a href={localizedHref("/", { locale })}>{copy.home}</a>
        <span aria-hidden="true">›</span>
        <span>{copy.data}</span>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{page.title}</span>
      </nav>
      <h1>{page.title}</h1>
      <p className="nxradar-lead">{page.lead}</p>
      <p className="nxradar-updated">
        {feed.updatedAt ? <><span className="nxradar-dot" aria-hidden="true" /><time dateTime={feed.updatedAt} dir="ltr" data-updated-stamp="live">{dataUpdatedStamp(feed.updatedAt, locale)?.text}</time> · </> : null}
        <strong>{copy.source}:</strong> <span translate="no">{sourceLine}</span> <span className={`nxradar-status nxradar-status--${feed.status}`}>{statusLabel}</span>
      </p>
    </header>
  );
}

function RadarUnavailable({ locale }) {
  const copy = radarCopy(locale);
  return (
    <section className="nxradar-empty v2-shell" role="status" aria-live="polite" data-testid="radar-unavailable">
      <h2>{copy.unavailableTitle}</h2>
      <p>{copy.unavailable}</p>
    </section>
  );
}

function SortButton({ active, direction, onClick, children }) {
  return (
    <button type="button" className={`nxradar-sort${active ? " is-active" : ""}`} onClick={onClick}>
      <span>{children}</span>
      <span aria-hidden="true">{active ? (direction === "asc" ? "▲" : "▼") : "↕"}</span>
    </button>
  );
}

function Sparkline({ values, label }) {
  if (!values?.length) return <span className="nxradar-muted">—</span>;
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const points = values.map((value, index) => {
    const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
    const y = 28 - ((value - min) / span) * 24;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg className="nxradar-spark" viewBox="0 0 100 32" role="img" aria-label={label} focusable="false">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VenueAction({ venue, locale, market, src }) {
  const copy = radarCopy(locale);
  const slug = String(venue || "").toLowerCase().replace(/\s+/g, "-").replace(".", "-");
  if (!slug) return null;
  const label = copy.viewVenueNamed.replace("{venue}", venueDisplayName(slug));
  // Partner locales keep the attributed /go route; neutral locales link to the exchange profile instead.
  const href = NEUTRAL_CTA_LOCALES.has(locale) ? null : venueGoHref(slug, src, locale, market);
  if (href) return <span data-signup-cta={slug}><a className="nxradar-go" href={href} rel="sponsored">{label}</a><SignupEvidence slug={slug} locale={locale} market={market} /></span>;
  return <a className="nxradar-go nxradar-go--profile" href={localizedHref(`/exchanges/${slug}`, { locale })}>{label}</a>;
}

function AddressLine({ label, address, source, labelSource, unknownLabel }) {
  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";
  const known = !isUnknownLabel(label);
  const text = known ? venueDisplayName(label) : unknownLabel;
  return (
    <span className={`nxradar-address${known ? " is-labelled" : ""}`}>
      {known && labelSource ? <a href={labelSource} target="_blank" rel="noopener noreferrer">{text}</a> : <span>{text}</span>}
      {short ? <small translate="no">{short}</small> : null}
      {source ? <small>{sourceDisplay(source)}</small> : null}
    </span>
  );
}

function LongShortTable({ rows, locale, market }) {
  const copy = radarCopy(locale);
  const [sort, setSort] = useState({ key: "accountRatio", direction: "desc" });
  const sorted = useMemo(() => limitRowsBySymbols(sortRows(rows, sort.key, sort.direction), 30), [rows, sort]);
  const toggle = (key) => setSort((current) => ({ key, direction: current.key === key && current.direction === "desc" ? "asc" : "desc" }));
  const ariaSort = (key) => (sort.key === key ? (sort.direction === "asc" ? "ascending" : "descending") : "none");

  return (
    <section className="nxradar-panel v2-shell" aria-label={copy.longShortTitle}>
      <SectionRule stamp={sorted.length || null} />
      <div className="nxradar-tablewrap">
        <table className="nxradar-table" dir="ltr">
          <thead>
            <tr>
              <th scope="col">{copy.columns.rank}</th>
              <th scope="col">{copy.columns.symbol}</th>
              <th scope="col">{copy.columns.venue}</th>
              <th scope="col" className="num" aria-sort={ariaSort("accountRatio")}><SortButton active={sort.key === "accountRatio"} direction={sort.direction} onClick={() => toggle("accountRatio")}>{copy.columns.accountRatio}</SortButton></th>
              <th scope="col" className="num" aria-sort={ariaSort("topTraderRatio")}><SortButton active={sort.key === "topTraderRatio"} direction={sort.direction} onClick={() => toggle("topTraderRatio")}>{copy.columns.topTraderRatio}</SortButton></th>
              <th scope="col" className="num" aria-sort={ariaSort("openInterestUsd")}><SortButton active={sort.key === "openInterestUsd"} direction={sort.direction} onClick={() => toggle("openInterestUsd")}>{copy.columns.oi}</SortButton></th>
              <th scope="col" className="num" aria-sort={ariaSort("openInterestChange24hPct")}><SortButton active={sort.key === "openInterestChange24hPct"} direction={sort.direction} onClick={() => toggle("openInterestChange24hPct")}>{copy.columns.oiChange}</SortButton></th>
              <th scope="col">{copy.columns.spark}</th>
              <th scope="col"><span className="sr-only">{copy.viewVenue}</span></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, index) => (
              <tr key={row.id}>
                <td data-label={copy.columns.rank}>{index + 1}</td>
                <th scope="row" data-label={copy.columns.symbol} translate="no">{row.symbol}</th>
                <td data-label={copy.columns.venue} translate="no"><span>{venueDisplayName(row.venue)}</span>{row.source ? <small>{row.source}</small> : null}</td>
                <td className="num" data-label={copy.columns.accountRatio}>{formatRatio(row.accountRatio)}</td>
                <td className="num" data-label={copy.columns.topTraderRatio}>{formatRatio(row.topTraderRatio)}</td>
                <td className="num" data-label={copy.columns.oi}>{formatOpenInterest(row)}</td>
                <td className={`num${row.openInterestChange24hPct > 0 ? " pos" : row.openInterestChange24hPct < 0 ? " neg" : ""}`} data-label={copy.columns.oiChange}>{formatPct(row.openInterestChange24hPct)}</td>
                <td data-label={copy.columns.spark}><Sparkline values={row.sparkline24h} label={`${row.symbol} ${copy.columns.spark}`} /></td>
                <td><VenueAction venue={row.venue} locale={locale} market={market} src="long-short" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WhalesTable({ rows, locale, all = false }) {
  const copy = radarCopy(locale);
  const [sort, setSort] = useState({ key: "time", direction: "desc" });
  const sorted = useMemo(() => sortRows(rows, sort.key, sort.direction).slice(0, all ? undefined : 50), [rows, sort, all]);
  const toggle = (key) => setSort((current) => ({ key, direction: current.key === key && current.direction === "desc" ? "asc" : "desc" }));
  const ariaSort = (key) => (sort.key === key ? (sort.direction === "asc" ? "ascending" : "descending") : "none");

  return (
    <section className="nxradar-panel v2-shell" aria-label={copy.whalesTitle}>
      <SectionRule stamp={sorted.length || null} />
      <div className="nxradar-tablewrap">
        <table className="nxradar-table nxradar-table--whales" dir="ltr">
          <thead>
            <tr>
              <th scope="col">{copy.columns.asset}</th>
              <th scope="col" className="num" aria-sort={ariaSort("amountUsd")}><SortButton active={sort.key === "amountUsd"} direction={sort.direction} onClick={() => toggle("amountUsd")}>{copy.columns.amount}</SortButton></th>
              <th scope="col">{copy.columns.from}</th>
              <th scope="col">{copy.columns.to}</th>
              <th scope="col" aria-sort={ariaSort("direction")}><SortButton active={sort.key === "direction"} direction={sort.direction} onClick={() => toggle("direction")}>{copy.columns.direction}</SortButton></th>
              <th scope="col" aria-sort={ariaSort("time")}><SortButton active={sort.key === "time"} direction={sort.direction} onClick={() => toggle("time")}>{copy.columns.time}</SortButton></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.id}>
                <th scope="row" data-label={copy.columns.asset} translate="no">{whaleCoinPath(row.asset) ? <a href={localizedHref(whaleCoinPath(row.asset), { locale })}>{row.asset}</a> : row.asset}{row.chain ? <small>{chainDisplay(row.chain)}</small> : null}</th>
                <td className="num" data-label={copy.columns.amount}>
                  <span>{formatAmount(row.amount, row.asset)}</span>
                  <small>{formatUsd(row.amountUsd)}</small>
                  {row.valuation ? <small>{row.valuation}</small> : null}
                  {row.whyItMatters && isEnglishLocale(locale) ? <small>{row.whyItMatters}</small> : null}
                </td>
                <td data-label={copy.columns.from}><AddressLine label={row.fromLabel} address={row.fromAddress} source={row.source} labelSource={row.fromLabelSource} unknownLabel={copy.unknown} /></td>
                <td data-label={copy.columns.to}><AddressLine label={row.toLabel} address={row.toAddress} labelSource={row.toLabelSource} unknownLabel={copy.unknown} /></td>
                <td data-label={copy.columns.direction}><span className={`nxradar-dir nxradar-dir--${row.direction}`}>{copy.directions[row.direction] || copy.directions.unknown}</span></td>
                <td data-label={copy.columns.time}>{row.explorerUrl ? <a href={row.explorerUrl} rel="nofollow noopener noreferrer" target="_blank">{formatUtc(row.time)}</a> : formatUtc(row.time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WhaleSentence({ row, locale }) {
  const [before, amount, after] = whaleSentenceParts(row, locale);
  const stealth = whaleStealthLabel(row, locale);
  return <>
    {stealth ? <em className="nxradar-whale-tag" data-stealth={stealth.kind}>{stealth.badge}{stealth.meta ? <small>{stealth.meta}</small> : null}</em> : null}
    <span>{before.trimStart()}<strong dir="ltr">{amount}</strong>{after.trimEnd()}</span>
  </>;
}

const whaleBucket = whaleSignalBucket;

function WhalesTabs({ feed, locale, all = false }) {
  const c = whalesCopy(locale);
  const priority = (row) => ({ signals: 0, positions: 1, transfers: 2 })[whaleBucket(row)] ?? 2;
  // Signals and positions keep the collector ranking; transfers are newest first.
  const lead = (row) => (row.stealth === "buy" || row.stealth === "sell" ? 0 : 1);
  const baseRows = [...feed.rows].sort((a, b) => lead(a) - lead(b) || priority(a) - priority(b) || (priority(a) === 2 ? Date.parse(b.time || b.updatedAt || 0) - Date.parse(a.time || a.updatedAt || 0) : 0));
  const defaultFilter = ["signals", "distribution", "positions", "transfers"].find((key) => baseRows.some((row) => whaleBucket(row) === key)) || "signals";
  const [filter, setFilter] = useState(defaultFilter);
  const labels = { ...c.tabs, distribution: locale === "zh-Hans" ? "出货" : locale === "zh-Hant" ? "出貨" : c.actions.distribution };
  const FILTERS = ["signals", "distribution", "positions", "transfers"].map((key) => [key, labels[key]]);
  const buckets = { signals: [], distribution: [], positions: [], transfers: [] };
  const matches = (row) => all || whaleBucket(row) === filter;
  const rows = baseRows.filter(matches);
  for (const row of rows) buckets[whaleBucket(row)].push(row);
  const sections = [
    ["signals", buckets.signals],
    ["distribution", buckets.distribution],
    ["positions", buckets.positions],
    ["transfers", buckets.transfers],
  ].filter(([, rows]) => rows.length);
  return (
    <section className="nxradar-panel nxradar-whales-tabs v2-shell" aria-label={c.title}>
      {!all ? <div className="nxradar-tabbar" role="group" aria-label={c.title}>
        {FILTERS.map(([key, label]) => <button type="button" key={key} data-whale-filter={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}
      </div> : null}
      {!sections.length ? <p className="nxradar-empty-line" role="status">{radarCopy(locale).unavailableTitle}</p> : null}
      {sections.map(([key, rows]) => (
        <section key={key} className={`nxradar-whale-section nxradar-whale-section--${key}`} data-whale-section={key} aria-labelledby={`whales-${key}-h`}>
          <h2 id={`whales-${key}-h`}>{labels[key]}</h2>
          {key === "transfers" ? <WhalesTable rows={rows} locale={locale} all={all} /> : (
            <ul className="nxradar-whale-cards">
              {rows.slice(0, all ? undefined : 50).map((row) => {
                const href = whaleExplorerHref(row);
                const content = (
                  <>
                    <b translate="no">{whaleRowCoin(row)}</b>
                    <WhaleSentence row={row} locale={locale} />
                    {row.time ? <time dateTime={row.time} dir="ltr">{formatSgt(row.time, locale, "end")}</time> : null}
                  </>
                );
                return (
                  <li key={row.id} data-kind={key} {...(row.stealth ? { "data-stealth": row.stealth } : {})}>
                    {href ? <a href={href} target="_blank" rel="nofollow noopener noreferrer">{content}</a> : content}
                    {row.whyItMatters && isEnglishLocale(locale) ? <p>{row.whyItMatters}</p> : null}
                    {Number.isFinite(row.confidenceScore) ? <small>{confidenceLabel(locale)}: {row.confidenceScore}/100</small> : null}
                    {whaleCoinPath(whaleRowCoin(row)) ? <a href={localizedHref(whaleCoinPath(whaleRowCoin(row)), { locale })}>{whaleRowCoin(row)} · {c.title} →</a> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </section>
  );
}

function RadarMethod({ locale, page, apiPath, src }) {
  const copy = radarCopy(locale);
  return (
    <details className="nxradar-method v2-shell" data-testid={`radar-method-${src}`}>
      <summary>{copy.methodTitle}</summary>
      <div className="nxradar-method-body">
        <p>{page.summary}</p>
        {page.explainer.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <p>{page.methodExtra}</p>
        <p><strong>{copy.sourcesLabel}:</strong> {page.sourceLine}</p>
        <p className="nxradar-json"><a href={apiPath} rel="nofollow" dir="ltr">{copy.openData}</a></p>
      </div>
    </details>
  );
}

function RadarTail({ locale, market, page, relatedPath, relatedLabel, src, apiPath, offer = true, coinPage = null }) {
  const copy = radarCopy(locale);
  return (
    <>
      {offer && !NEUTRAL_CTA_LOCALES.has(locale) ? (
      <div className="v2-shell nxradar-offer">
        <NewsVenueOffer
          venues={RADAR_SIGNUP_VENUES}
          locale={locale}
          articleSlug={src}
          variant="inline"
          placementPrefix="radar-offer"
          market={market}
          linkFor={(slug) => venueGoHref(slug, src, locale, market)}
        />
      </div>
      ) : null}
      <footer className="nxradar-foot v2-shell">
        <p><span>{copy.related}:</span> <a href={localizedHref(relatedPath, { locale })}>{relatedLabel}</a>{coinPage ? <>{" · "}<a href={localizedHref(coinPage.path, { locale })} data-whale-coin-page={coinPage.symbol} translate="no">{coinPage.name} ({coinPage.symbol})</a></> : null}</p>
      </footer>
      <RadarMethod locale={locale} page={page} apiPath={apiPath} src={src} />
    </>
  );
}

export function LongShortPage({ locale = "en", market, initial }) {
  const copy = radarCopy(locale);
  const feed = useRadarFeed("longShort", initial);
  const page = { title: copy.longShortTitle, lead: copy.longShortLead, sourceLine: copy.longShortSourceLine, sourceNames: "Binance · OKX · Bybit", summary: copy.longShortSummary, explainer: copy.longShortExplainer, methodExtra: copy.longShortMethodExtra };
  return (
    <main className="v6 v2-page v3-page nxradar nxradar--long-short" id="top" dir={directionFor(locale)} data-market={market || "global"} data-testid="long-short-page">
      <RadarHero locale={locale} page={page} pathname={LONG_SHORT_PATH} feed={feed} apiPath={LONG_SHORT_API_PATH} />
      {feed.rows.length ? <LongShortTable rows={feed.rows} locale={locale} market={market} /> : <RadarUnavailable locale={locale} />}
      <RadarTail locale={locale} market={market} page={page} relatedPath={WHALES_PATH} relatedLabel={copy.whalesTitle} src="long-short" apiPath={LONG_SHORT_API_PATH} />
    </main>
  );
}

export function WhalesPage({ locale = "en", market, initial, coin }) {
  const copy = radarCopy(locale);
  const whaleCopy = whalesCopy(locale);
  const snapshot = useRadarFeed("whales", initial);
  const feed = coin ? { ...snapshot, rows: snapshot.rows.filter((row) => whaleRowCoin(row) === coin) } : snapshot;
  const page = { title: coin ? `${coin} ${whaleCopy.title}` : whaleCopy.title, lead: `${whaleCopy.tabs.signals} · Hyperliquid · ${whaleCopy.tabs.positions} · ${whaleCopy.tabs.transfers}`, sourceLine: copy.whalesSourceLine, sourceNames: "Hyperliquid · mempool.space · Ethereum RPC · Tronscan", summary: copy.whalesSummary, explainer: copy.whalesExplainer, methodExtra: copy.whalesMethodExtra };
  return (
    <main className="v6 v2-page v3-page nxradar nxradar--whales whales-page" id="top" dir={directionFor(locale)} data-market={market || "global"} data-testid="whales-page">
      <RadarHero locale={locale} page={page} pathname={WHALES_PATH} feed={feed} apiPath={WHALES_API_PATH} />
      <nav className="nxradar-coin-nav v2-shell" aria-label={whaleCopy.title}>
        <a href={localizedHref(WHALES_PATH, { locale })}>{whaleCopy.all}</a>{WHALE_COINS.map((symbol) => <a key={symbol} href={localizedHref(whaleCoinPath(symbol), { locale })} aria-current={coin === symbol ? "page" : undefined}>{symbol}</a>)}
      </nav>
      {feed.rows.length ? <WhalesTabs feed={feed} locale={locale} all={Boolean(coin)} /> : <RadarUnavailable locale={locale} />}
      <RadarTail locale={locale} market={market} page={page} relatedPath={LONG_SHORT_PATH} relatedLabel={copy.longShortTitle} src="whales" apiPath={WHALES_API_PATH} offer={false} coinPage={coin ? coinPageForWhaleCoin(coin) : null} />
    </main>
  );
}

export default LongShortPage;


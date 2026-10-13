import React, { useEffect, useMemo, useState } from "react";
import { feeFact, feePct } from "../../data/exchange-facts.js";
import { buildFundingMatrix, calculateFundingArbitrage, FUNDING_MATRIX_PATH as FUNDING_MATRIX_FEED_PATH, fundingMatrixCell, venueName as modelVenueName, venueSlug } from "../../data/funding-matrix.js";
import { localizedHref } from "../../data/locale-routing.js";
import { partnerPromotionGate } from "../../data/partner-geo-policy.js";
import { publicCtaForVenue } from "../../data/public-cta.js";
import { dataPageCopy, formatUtc, formatUtcTime } from "../../data/market-data-pages.js";
import { fundingMatrixCopy } from "../../data/funding-matrix-copy.js";
import { textDirection } from "./DataPageFrame.jsx";
import "./funding-matrix.css";

export const FUNDING_MATRIX_PATH = "/funding-rates/matrix";
const NEUTRAL_CTA_LOCALES = new Set(["ru", "ar", "zh-Hant", "ur", "uk"]);
const TURKEY_CTA_ALLOWLIST = new Set(["binance", "okx", "bybit"]);

const num = (value) => {
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
};
const venueName = (slug, venues = []) => venues.find((v) => v.slug === slug)?.name || modelVenueName(slug);

function feedPayload(initialFeed) {
  return initialFeed?.fundingMatrix || initialFeed?.funding?.matrix || initialFeed?.matrix || initialFeed || null;
}

export function normalizeFundingMatrixFeed(initialFeed) {
  const payload = feedPayload(initialFeed);
  const matrix = Array.isArray(payload?.quotes) ? buildFundingMatrix(payload.quotes, { generatedAt: payload.generatedAt }) : Array.isArray(payload) ? buildFundingMatrix(payload) : payload;
  const rows = (Array.isArray(matrix?.rows) ? matrix.rows : [])
    .filter((row) => row?.symbol && row?.maxSpread && Object.keys(row.venues || {}).length >= 2)
    .slice(0, 60);
  const venues = (Array.isArray(matrix?.venues) ? matrix.venues : [])
    .map((venue) => ({ slug: venueSlug(venue?.slug || venue), name: venue?.name || modelVenueName(venue?.slug || venue), profileHref: venue?.profileHref, tradeHref: venue?.tradeHref }))
    .filter((venue) => venue.slug);
  if (!rows.length || venues.length < 2) return null;
  return {
    generatedAt: matrix?.generatedAt || initialFeed?.generatedAt || null,
    source: matrix?.source || payload?.source || "",
    ttlSeconds: Math.min(num(matrix?.ttlSeconds) ?? 60, 60),
    venues,
    rows,
  };
}

export function formatFundingPct(rate, digits = 4) {
  const n = num(rate);
  if (n == null) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${(Math.abs(n) * 100).toFixed(digits)}%`;
}

const formatUsd = (value) => {
  const n = num(value);
  if (n == null) return "—";
  const sign = n < 0 ? "−" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
};

function venueCta(slug, locale, market) {
  const normalizedMarket = String(market || "").trim().toUpperCase();
  if (NEUTRAL_CTA_LOCALES.has(locale)) return null;
  if ((locale === "tr" || normalizedMarket === "TR") && !TURKEY_CTA_ALLOWLIST.has(slug)) return null;
  if (partnerPromotionGate(slug, { locale, market })) return null;
  const cta = publicCtaForVenue(slug, locale);
  return cta?.routeAvailable ? `/go/${slug}?src=funding-matrix` : null;
}

function SortButton({ active, children, onClick }) {
  return <button type="button" className="nxdm-sort__button" aria-pressed={active} onClick={onClick}>{children}</button>;
}

function HeaderSortButton({ active, children, onClick }) {
  return <button type="button" className="nxdm-thbutton" aria-pressed={active} onClick={onClick}>{children}</button>;
}

function VenueCell({ row, venue, copy, locale, market, allVenues }) {
  const cell = row.venues[venue.slug];
  if (!cell) return <td className="nxdm-empty" data-label={venue.name}>—</td>;
  const isEdge = venue.slug === row.maxSpread.shortVenue || venue.slug === row.maxSpread.longVenue;
  const profile = localizedHref(`/exchanges/${venue.slug}`, { locale, market });
  const ctaHref = venueCta(venue.slug, locale, market);
  return (
    <td className={`nxdm-venue${isEdge ? " nxdm-venue--edge" : ""}`} data-label={venue.name}>
      <a className="nxdm-rate" href={profile} translate="no">
        <strong>{formatFundingPct(cell.rate8h)}</strong>
        <span>{copy.interval}: {cell.intervalHours}h</span>
        <span>{copy.rawRate}: {formatFundingPct(cell.rate)} / {cell.intervalHours}h</span>
        <span>{copy.annualized}: {formatFundingPct(cell.annualized, 1)}</span>
      </a>
      <span className="nxdm-next" dir="ltr">{cell.nextFundingAt ? formatUtcTime(cell.nextFundingAt) : "—"}</span>
      <span className="nxdm-actions">
        <a href={profile}>{copy.venueProfile}</a>
          {ctaHref ? <a href={ctaHref} rel="nofollow sponsored">{copy.tradeOn(venueName(venue.slug, allVenues))}</a> : <span>{copy.neutralRoute}</span>}
      </span>
    </td>
  );
}

function MatrixTable({ matrix, copy, locale, market }) {
  const [sort, setSort] = useState("spread");
  const rows = useMemo(() => {
    const next = [...matrix.rows];
    if (sort === "symbol") next.sort((a, b) => a.symbol.localeCompare(b.symbol));
    else if (sort === "annualized") next.sort((a, b) => b.maxSpread.annualized - a.maxSpread.annualized);
    else if (sort.startsWith("venue:")) {
      const slug = sort.slice("venue:".length);
      next.sort((a, b) => (b.venues?.[slug]?.rate8h ?? -Infinity) - (a.venues?.[slug]?.rate8h ?? -Infinity));
    }
    else next.sort((a, b) => b.maxSpread.spread8h - a.maxSpread.spread8h);
    return next;
  }, [matrix.rows, sort]);
  const ariaSort = (key) => (sort === key ? "descending" : "none");
  return (
    <section className="nxdm-section v2-shell" aria-labelledby="nxdm-table-h" data-rv="1">
      <div className="nxdm-section__head">
        <div>
          <h2 id="nxdm-table-h">{copy.tableTitle}</h2>
          <p>{copy.tableIntro}</p>
        </div>
        <div className="nxdm-sort" aria-label={copy.sortBy}>
          <SortButton active={sort === "spread"} onClick={() => setSort("spread")}>{copy.sortSpread}</SortButton>
          <SortButton active={sort === "annualized"} onClick={() => setSort("annualized")}>{copy.sortAnnualized}</SortButton>
          <SortButton active={sort === "symbol"} onClick={() => setSort("symbol")}>{copy.sortSymbol}</SortButton>
        </div>
      </div>
      <div className="nxdm-tablewrap">
        <table className="nxdm-table" dir="ltr">
          <thead>
            <tr>
              <th scope="col" aria-sort={ariaSort("symbol")}><HeaderSortButton active={sort === "symbol"} onClick={() => setSort("symbol")}>{copy.colSymbol}</HeaderSortButton></th>
              <th scope="col" className="num" aria-sort={ariaSort("spread")}><HeaderSortButton active={sort === "spread"} onClick={() => setSort("spread")}>{copy.colSpread}</HeaderSortButton></th>
              <th scope="col" className="num" aria-sort={ariaSort("annualized")}><HeaderSortButton active={sort === "annualized"} onClick={() => setSort("annualized")}>{copy.colAnnualized}</HeaderSortButton></th>
              {matrix.venues.map((venue) => (
                <th scope="col" key={venue.slug} aria-sort={ariaSort(`venue:${venue.slug}`)}>
                  <HeaderSortButton active={sort === `venue:${venue.slug}`} onClick={() => setSort(`venue:${venue.slug}`)}>{venue.name}</HeaderSortButton>
                  <small>{copy.colRate} · {copy.colNext}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.symbol} id={`symbol-${row.symbol}`}>
                <th scope="row" translate="no">{row.symbol}</th>
                <td className="num nxdm-spread" data-label={copy.colSpread}>{formatFundingPct(row.maxSpread.spread8h)}</td>
                <td className="num" data-label={copy.colAnnualized}>{formatFundingPct(row.maxSpread.annualized, 1)}</td>
                {matrix.venues.map((venue) => <VenueCell key={venue.slug} row={row} venue={venue} copy={copy} locale={locale} market={market} allVenues={matrix.venues} />)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ResultCta({ slug, copy, locale, market, venues }) {
  const href = venueCta(slug, locale, market);
  return href ? <a className="nxdm-result__cta" href={href} rel="nofollow sponsored">{copy.tradeOn(venueName(slug, venues))}</a> : <span className="nxdm-result__neutral">{venueName(slug, venues)} · {copy.neutralRoute}</span>;
}

function Calculator({ matrix, copy, locale, market }) {
  const first = matrix.rows[0];
  const [symbol, setSymbol] = useState(first.symbol);
  const activeRow = matrix.rows.find((row) => row.symbol === symbol) || first;
  const activeVenues = matrix.venues.filter((venue) => activeRow.venues[venue.slug]);
  const [longVenue, setLongVenue] = useState(activeRow.maxSpread.longVenue);
  const [shortVenue, setShortVenue] = useState(activeRow.maxSpread.shortVenue);
  const [feeSide, setFeeSide] = useState("taker");
  const [notional, setNotional] = useState(10000);
  const [hours, setHours] = useState(24);
  const currentLong = activeRow.venues[longVenue] ? longVenue : activeRow.maxSpread.longVenue;
  const currentShort = activeRow.venues[shortVenue] ? shortVenue : activeRow.maxSpread.shortVenue;
  const result = calculateFundingArbitrage({ matrix, symbol: activeRow.symbol, longVenue: currentLong, shortVenue: currentShort, notional, holdingHours: hours, feeSide });
  const longCell = fundingMatrixCell(matrix, activeRow.symbol, currentLong);
  const shortCell = fundingMatrixCell(matrix, activeRow.symbol, currentShort);
  const longFeePct = feeFact(currentLong, "perp")[feeSide];
  const shortFeePct = feeFact(currentShort, "perp")[feeSide];
  return (
    <section className="nxdm-section nxdm-calc v2-shell" aria-labelledby="nxdm-calc-h" data-rv="1">
      <div className="nxdm-section__head">
        <div>
          <h2 id="nxdm-calc-h">{copy.calculatorTitle}</h2>
          <p>{copy.calculatorLead}</p>
        </div>
      </div>
      <div className="nxdm-calc__grid">
        <label>{copy.symbol}<select value={symbol} onChange={(e) => setSymbol(e.target.value)}>{matrix.rows.map((row) => <option key={row.symbol} value={row.symbol}>{row.symbol}</option>)}</select></label>
        <label>{copy.longVenue}<select value={currentLong} onChange={(e) => setLongVenue(e.target.value)}>{activeVenues.map((venue) => <option key={venue.slug} value={venue.slug}>{venue.name}</option>)}</select></label>
        <label>{copy.shortVenue}<select value={currentShort} onChange={(e) => setShortVenue(e.target.value)}>{activeVenues.map((venue) => <option key={venue.slug} value={venue.slug}>{venue.name}</option>)}</select></label>
        <label>{copy.feeSide}<select value={feeSide} onChange={(e) => setFeeSide(e.target.value)}><option value="taker">{copy.taker}</option><option value="maker">{copy.maker}</option></select></label>
        <label>{copy.notional}<input type="number" min="0" step="100" value={notional} onChange={(e) => setNotional(e.target.value)} /></label>
        <label>{copy.holdingHours}<input type="number" min="0" step="1" value={hours} onChange={(e) => setHours(e.target.value)} /><span>{copy.hours}</span></label>
      </div>
      {result ? (
        <div className="nxdm-result" aria-live="polite">
          <div><dt>{copy.estimatedFunding}</dt><dd>{formatUsd(result.fundingPnl)} <small>{longCell?.intervalHours}h / {shortCell?.intervalHours}h</small></dd></div>
          <div><dt>{copy.checkedFees}</dt><dd>{result.fees == null ? "—" : formatUsd(result.fees)} <small>{feePct(longFeePct)} + {feePct(shortFeePct)} {feeSide}</small></dd></div>
          <div className={result.netPnl == null || result.netPnl >= 0 ? "pos" : "neg"}><dt>{copy.netEstimate}</dt><dd>{result.netPnl == null ? "—" : formatUsd(result.netPnl)}</dd></div>
          <div><dt>{copy.breakEven}</dt><dd>{result.breakEvenHours == null ? "—" : `${result.breakEvenHours.toFixed(1)}h`}</dd></div>
          <div><dt>{copy.annualized}</dt><dd>{formatFundingPct(result.annualized, 1)}</dd></div>
          <p className="nxdm-result__plain">{copy.resultLine({
            longVenue: venueName(currentLong, matrix.venues),
            shortVenue: venueName(currentShort, matrix.venues),
            symbol: activeRow.symbol,
            funding: formatUsd(result.fundingPnl),
            fees: result.fees == null ? null : formatUsd(result.fees),
          })}</p>
          <div className="nxdm-result__actions">
            <ResultCta slug={currentLong} copy={copy} locale={locale} market={market} venues={matrix.venues} />
            <ResultCta slug={currentShort} copy={copy} locale={locale} market={market} venues={matrix.venues} />
          </div>
        </div>
      ) : <p className="nxdm-muted">{copy.noSpread}</p>}
      <p className="nxdm-fees">{copy.feeSource}</p>
    </section>
  );
}

export function FundingMatrixPage({ locale = "en", initialFeed, market }) {
  const copy = fundingMatrixCopy(locale);
  const dataCopy = dataPageCopy(locale);
  const initialMatrix = useMemo(() => normalizeFundingMatrixFeed(initialFeed), [initialFeed]);
  const [remoteMatrix, setRemoteMatrix] = useState(null);
  const [clientNow, setClientNow] = useState(null);
  useEffect(() => {
    let stopped = false;
    async function readMatrix() {
      setClientNow(Date.now());
      try {
        const response = await fetch(FUNDING_MATRIX_FEED_PATH, { cache: "no-store" });
        if (!response.ok) return;
        const next = normalizeFundingMatrixFeed(await response.json());
        if (!stopped) setRemoteMatrix(next);
      } catch {
        // Keep the server-rendered matrix until its TTL expires.
      }
    }
    readMatrix();
    const fetchId = setInterval(readMatrix, 60 * 1000);
    const clockId = setInterval(() => setClientNow(Date.now()), 5 * 1000);
    return () => { stopped = true; clearInterval(fetchId); clearInterval(clockId); };
  }, []);
  const matrix = remoteMatrix || initialMatrix;
  const generatedMs = matrix?.generatedAt ? Date.parse(matrix.generatedAt) : NaN;
  const expired = clientNow && Number.isFinite(generatedMs) && clientNow - generatedMs > (matrix.ttlSeconds || 60) * 1000;
  const displayMatrix = expired ? null : matrix;
  return (
    <main className="v6 v2-page v3-page nxd nxdm" id="top" dir={textDirection(locale)} data-testid="funding-matrix-page">
      <header className="nxd-hero nxdm-hero v2-shell">
        <nav className="nxd-crumbs" aria-label="Breadcrumb">
          <a href={localizedHref("/", { locale, market })}>{dataCopy.common.home}</a>
          <span aria-hidden="true">›</span>
          <a href={localizedHref("/funding-rates", { locale, market })}>{dataCopy.nav.funding}</a>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{copy.crumb}</span>
        </nav>
        <h1>{copy.h1}</h1>
        <p className="nxd-lead">{copy.lead}</p>
        <p className="nxd-updated" data-testid="funding-rates-matrix-updated">
          {displayMatrix?.generatedAt ? <><span className="nxd-dot" aria-hidden="true" /><strong>{copy.updated}</strong> <time dateTime={displayMatrix.generatedAt} dir="ltr">{formatUtc(displayMatrix.generatedAt)}</time> · </> : null}
          <strong>{copy.source}:</strong> {displayMatrix?.source || copy.sourceLine}
        </p>
      </header>
      {!displayMatrix ? (
        <section className="nxd-unavailable v2-shell" data-rv="1" role="status" data-testid="funding-matrix-unavailable">
          <h2>{copy.unavailableTitle}</h2>
          <p>{copy.unavailable}</p>
        </section>
      ) : (
        <>
          <MatrixTable matrix={displayMatrix} copy={copy} locale={locale} market={market} />
          <Calculator matrix={displayMatrix} copy={copy} locale={locale} market={market} />
        </>
      )}
    </main>
  );
}

export default FundingMatrixPage;

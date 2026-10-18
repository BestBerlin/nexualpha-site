// Route module of the linkable data assets and /press (chunk route-data-assets, SEO W43 2026-10-18).
// /data/exchange-fee-index, /data/tokenized-stock-tracker, /data/whale-accumulation-report: key figures, chart (the same
// SVG the embed serves), table, CSV download, embed snippets, "Cite this", methodology and FAQ. /press: boilerplate,
// key facts, logos, the three datasets with embed codes and the official accounts.
// No codes, no sign-up buttons: these pages are reference material. Exchange source links go through SourceLink.
import React, { useEffect, useRef, useState } from "react";
import { localizedHref } from "../../data/locale-routing.js";
import { SourceLink } from "../shared/SourceLink.jsx";
import { SectionRule } from "../shared/DataRule.jsx";
import { BRAND } from "../../data/brand-entity.js";
import { DATA_ASSETS, DATA_ASSET_KEYS, PRESS_PATH, dataAssetCsvPath, dataAssetSvgPath } from "../../data/data-assets-routes.js";
import {
  DATA_ASSET_LICENSE_URL, FEE_INDEX_EDITION, WHALE_CATEGORIES, compactWhaleReport, dataAssetCitation, dataAssetEmbedSnippets, formatUsdShort,
  readWhaleReport, sgtStamp as formatSgtStamp, svgHeight, SVG_WIDTH,
} from "../../data/data-assets.js";
import { PRESS_BOILERPLATE, dataAssetsCopy, fillCopy } from "../../data/data-assets-copy.js";
import { PRESS_LANGUAGE_COUNT, dataAssetView, pageKeyForAsset } from "../../data/data-assets-seo.js";
import { feePair } from "../../data/exchange-facts.js";
import { TS_PATH } from "../../data/tokenized-stocks-routes.js";
import "../data/data-pages.css";
import "./data-assets.css";

const dir = (locale) => (["ar", "ur"].includes(locale) ? "rtl" : "ltr");
const hrefFor = (path, locale, market) => {
  const href = localizedHref(path, { locale });
  return market ? `${href}${href.includes("?") ? "&" : "?"}market=${encodeURIComponent(market)}` : href;
};

function CopyButton({ text, copy }) {
  const [done, setDone] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(false), 1800);
    } catch { /* clipboard blocked: the snippet stays selectable */ }
  };
  return <button type="button" className="nxd-embed__copy" onClick={onClick} aria-live="polite">{done ? copy.copied : copy.copy}</button>;
}

function Snippet({ label, code, copy }) {
  return (
    <div className="nxd-embed__snippet">
      <div className="nxd-embed__head"><span>{label}</span><CopyButton text={code} copy={copy} /></div>
      <pre dir="ltr" tabIndex={0}><code>{code}</code></pre>
    </div>
  );
}

function Hero({ locale, market, h1, lead, children }) {
  const common = dataAssetsCopy(locale).common;
  return (
    <header className="nxd-hero v2-shell">
      <nav className="nxd-crumbs" aria-label="Breadcrumb">
        <a href={hrefFor("/", locale, market)}>{common.home}</a>
        <span aria-hidden="true">›</span>
        {h1 === dataAssetsCopy(locale).press.h1 ? null : <><a href={hrefFor(PRESS_PATH, locale, market)}>{common.press}</a><span aria-hidden="true">›</span></>}
        <span aria-current="page">{h1}</span>
      </nav>
      <h1>{h1}</h1>
      <p className="nxd-lead">{lead}</p>
      {children}
    </header>
  );
}

function Stats({ items }) {
  return (
    <div className="nxd-stats nxr-stats">
      {items.map(([label, value, meta], i) => (
        <article key={label} className={`nxd-stat${i === 0 ? " nxd-stat--primary" : ""}`}>
          <h3>{label}</h3>
          <p className="nxd-stat__value" dir="ltr">{value}</p>
          {meta ? <p className="nxd-stat__meta">{meta}</p> : null}
        </article>
      ))}
    </div>
  );
}

function Chart({ assetKey, title, version }) {
  return (
    <figure className="nxr-chart v2-shell">
      <img src={`${dataAssetSvgPath(assetKey)}${version ? `?v=${encodeURIComponent(version)}` : ""}`} width={SVG_WIDTH} height={svgHeight(assetKey)} alt={title} loading="lazy" decoding="async" />
    </figure>
  );
}

/** Download, license, embed snippets and "Cite this" (shared by the three asset pages). */
function ReuseBlock({ locale, assetKey, title, year, version }) {
  const common = dataAssetsCopy(locale).common;
  const snippets = dataAssetEmbedSnippets(assetKey, title);
  const cite = dataAssetCitation(assetKey, title, { year, version });
  return (
    <section className="nxr-reuse v2-shell" aria-labelledby={`nxr-reuse-${assetKey}`} data-testid={`data-asset-reuse-${assetKey}`}>
      <SectionRule />
      <div className="nxr-reuse__grid">
        <div className="nxd-panel nxr-download">
          <h2 id={`nxr-reuse-${assetKey}`}>{common.download}</h2>
          <p className="nxd-muted">{common.downloadNote}</p>
          <p className="nxr-actions"><a className="nxr-button" href={dataAssetCsvPath(assetKey)} download data-testid={`data-asset-csv-${assetKey}`}>{common.download} ↓</a></p>
          <p className="nxr-license"><strong>{common.license}:</strong> <a href={DATA_ASSET_LICENSE_URL} rel="license noopener" target="_blank">CC BY 4.0</a>. {common.licenseBody}</p>
        </div>
        <div className="nxd-panel nxr-cite" data-testid={`data-asset-cite-${assetKey}`}>
          <h2>{common.citeTitle}</h2>
          <Snippet label={common.citeApa} code={cite.apa} copy={common} />
          <Snippet label={common.citeAttribution} code={cite.attribution} copy={common} />
        </div>
      </div>
      <details className="nxd-embed nxr-embed" data-testid={`data-asset-embed-${assetKey}`}>
        <summary><h2>{common.embedTitle}</h2></summary>
        <div className="nxd-embed__body">
          <p className="nxd-embed__intro">{common.embedIntro}</p>
          <Snippet label={common.embedImage} code={snippets.image} copy={common} />
          <Snippet label={common.embedIframe} code={snippets.iframe} copy={common} />
        </div>
      </details>
    </section>
  );
}

function MethodFaq({ locale, page, faq }) {
  const common = dataAssetsCopy(locale).common;
  return (
    <>
      <section className="nxd-explainer v2-shell nxr-method" id="methodology" aria-labelledby="nxr-method-h">
        <SectionRule />
        <h2 id="nxr-method-h">{common.methodTitle}</h2>
        {page.method.map((p, i) => <p key={i}>{p}</p>)}
      </section>
      {faq.length ? (
        <section className="nxd-faq v2-shell" aria-labelledby="nxr-faq-h">
          <SectionRule stamp={faq.length} />
          <h2 id="nxr-faq-h">{common.faqTitle}</h2>
          {faq.map(([q, a]) => <article key={q} className="nxd-faq__item"><h3>{q}</h3><p>{a}</p></article>)}
        </section>
      ) : null}
    </>
  );
}

function OtherAssets({ locale, market, current }) {
  const copy = dataAssetsCopy(locale);
  return (
    <footer className="nxd-foot v2-shell" data-testid="data-asset-related">
      <p className="nxd-foot__links">
        <span>{copy.common.otherAssets}:</span>{" "}
        {DATA_ASSET_KEYS.filter((k) => k !== current).map((k, i) => (
          <React.Fragment key={k}>{i ? <span aria-hidden="true"> · </span> : null}<a href={hrefFor(DATA_ASSETS[k], locale, market)}>{copy[pageKeyForAsset(k)].h1}</a></React.Fragment>
        ))}
        <span aria-hidden="true"> · </span>
        <a href={hrefFor(PRESS_PATH, locale, market)}>{copy.common.press}</a>
      </p>
      <p>{copy.common.timesSgt}</p>
    </footer>
  );
}

const Fee = ({ side, common, locale }) => (Number.isFinite(side.maker) && Number.isFinite(side.taker)
  ? <span dir="ltr">{feePair(side.maker, side.taker, locale)}</span>
  : <span className="nxd-muted">{side.state === "none" ? common.notOffered : common.notChecked}</span>);

export function FeeIndexPage({ locale = "en", market }) {
  const copy = dataAssetsCopy(locale);
  const common = copy.common;
  const view = dataAssetView("exchange-fee-index", locale, { market });
  const { page, rows, stats, vars } = view;
  return (
    <main className="v6 v2-page v3-page nxd nxr" id="top" dir={dir(locale)} lang={locale} data-testid="data-asset-exchange-fee-index">
      <Hero locale={locale} market={market} h1={page.h1} lead={view.lead}>
        <p className="nxd-updated"><span className="nxd-dot" aria-hidden="true" /><strong>{common.reviewed}</strong> <time dir="ltr" dateTime={stats.lastReviewed}>{stats.firstReviewed} – {stats.lastReviewed}</time> · <span dir="ltr">{FEE_INDEX_EDITION}</span></p>
      </Hero>
      <div className="v2-shell">
        <Stats items={[[page.statMedianSpot, vars.spot], [page.statMedianPerp, vars.perp], [page.statLowestPerp, vars.lowest, vars.lowestVenues], [page.statVenues, String(stats.venues), fillCopy(page.statVenuesMeta, vars)]]} />
        <p className="nxr-finding" data-testid="data-asset-finding">{view.keyFinding}</p>
      </div>
      <Chart assetKey="exchange-fee-index" title={page.h1} version={FEE_INDEX_EDITION} />
      <section className="v2-shell nxr-table-wrap" aria-labelledby="nxr-table-h">
        <SectionRule stamp={rows.length} />
        <h2 id="nxr-table-h">{page.tableTitle}</h2>
        <div className="nxr-scroll" tabIndex={0}>
          <table className="nxd-table nxr-table">
            <thead><tr><th scope="col">{page.colExchange}</th><th scope="col" className="num">{page.colSpot}</th><th scope="col" className="num">{page.colPerp}</th><th scope="col">{page.colReviewed}</th><th scope="col">{page.colSource}</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.slug} data-venue={r.slug}>
                  <th scope="row"><a href={hrefFor(`/exchanges/${r.slug}`, locale, market)}>{r.name}</a></th>
                  <td className="num"><Fee side={r.spot} common={common} locale={locale} /></td>
                  <td className="num"><Fee side={r.perp} common={common} locale={locale} /></td>
                  <td dir="ltr">{r.reviewedOn || "—"}</td>
                  <td>{r.sourceUrl ? <SourceLink locale={locale} market={market} href={r.sourceUrl} target="_blank" rel="noopener nofollow">{common.openSource} ↗</SourceLink> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <ReuseBlock locale={locale} assetKey="exchange-fee-index" title={page.datasetName} year="2026" version={FEE_INDEX_EDITION} />
      <MethodFaq locale={locale} page={page} faq={view.faq} />
      <OtherAssets locale={locale} market={market} current="exchange-fee-index" />
    </main>
  );
}

export function TokenizedTrackerPage({ locale = "en", market }) {
  const copy = dataAssetsCopy(locale);
  const common = copy.common;
  const view = dataAssetView("tokenized-stock-tracker", locale, { market });
  const { page, rows, stats, coverage, vars } = view;
  return (
    <main className="v6 v2-page v3-page nxd nxr" id="top" dir={dir(locale)} lang={locale} data-testid="data-asset-tokenized-stock-tracker">
      <Hero locale={locale} market={market} h1={page.h1} lead={view.lead}>
        <p className="nxd-updated"><span className="nxd-dot" aria-hidden="true" /><strong>{common.reviewed}</strong> <time dir="ltr" dateTime={stats.checkedOn}>{stats.checkedOn}</time></p>
      </Hero>
      <div className="v2-shell">
        <Stats items={[[page.statTop, vars.top, fillCopy(page.statTopMeta, vars)], [page.statExchanges, String(stats.exchanges)], [page.statSpot, String(stats.spotExchanges)], [page.statPerp, String(stats.perpExchanges)]]} />
        <p className="nxr-finding" data-testid="data-asset-finding">{view.keyFinding}</p>
      </div>
      <Chart assetKey="tokenized-stock-tracker" title={page.coverageTitle} version={stats.checkedOn} />
      <section className="v2-shell nxr-table-wrap" aria-labelledby="nxr-table-h">
        <SectionRule stamp={rows.length} />
        <h2 id="nxr-table-h">{page.tableTitle}</h2>
        <div className="nxr-scroll" tabIndex={0}>
          <table className="nxd-table nxr-table nxr-table--ts">
            <thead><tr><th scope="col">{page.colExchange}</th><th scope="col">{page.colProduct}</th><th scope="col">{page.colFamily}</th><th scope="col">{page.colTickers}</th><th scope="col">{page.colRegions}</th><th scope="col">{page.colSource}</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.slug}-${r.lane}`} data-venue={r.slug}>
                  <th scope="row">{r.exchange}</th>
                  <td>{page.lanes[r.lane]}</td>
                  <td>{r.family}</td>
                  <td dir="ltr" translate="no">{r.tickers.join(", ")}{r.listedCount ? <small> · {r.listedCount}{r.listedCountAsOf ? ` (${r.listedCountAsOf})` : ""}</small> : null}</td>
                  <td dir="ltr">{r.restricted.length ? r.restricted.join(", ") : "—"}</td>
                  <td>{r.sourceUrl ? <><SourceLink locale={locale} market={market} href={r.sourceUrl} target="_blank" rel="noopener nofollow">{common.openSource} ↗</SourceLink> <small dir="ltr">{r.sourceDate}</small></> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="nxr-coverage" data-testid="ts-coverage">
          <strong>{page.coverageTitle}:</strong>{" "}
          <span dir="ltr">{coverage.slice(0, 12).map((c) => `${c.ticker} ${c.count}`).join(" · ")}</span>
        </p>
        <p className="nxr-coverage"><a href={hrefFor(TS_PATH, locale, market)} data-testid="ts-hub-link">{page.hubLink} →</a></p>
      </section>
      <ReuseBlock locale={locale} assetKey="tokenized-stock-tracker" title={page.datasetName} year="2026" version={stats.checkedOn} />
      <MethodFaq locale={locale} page={page} faq={view.faq} />
      <OtherAssets locale={locale} market={market} current="tokenized-stock-tracker" />
    </main>
  );
}

/** `initial` is the report the server rendered with; after a client-side navigation the page reads /api/whales.json once. */
export function WhaleReportPage({ locale = "en", market, initial }) {
  const copy = dataAssetsCopy(locale);
  const common = copy.common;
  const [report, setReport] = useState(initial ?? null);
  useEffect(() => {
    if (initial !== undefined) return undefined;
    let live = true;
    fetch("/api/whales.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).then((json) => { if (live) setReport(compactWhaleReport(readWhaleReport(json))); }).catch(() => {});
    return () => { live = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- initial is the hydration seed only
  const view = dataAssetView("whale-accumulation-report", locale, { report });
  const page = view.page;
  const t = report?.totals;
  return (
    <main className="v6 v2-page v3-page nxd nxr" id="top" dir={dir(locale)} lang={locale} data-testid="data-asset-whale-accumulation-report">
      <Hero locale={locale} market={market} h1={page.h1} lead={view.lead}>
        {report ? <p className="nxd-updated"><span className="nxd-dot" aria-hidden="true" /><strong>{common.updated}</strong> <time dir="ltr" dateTime={report.windowEnd}>{formatSgtStamp(report.windowEnd, locale)}</time></p> : null}
      </Hero>
      {!report ? (
        <section className="nxd-unavailable v2-shell" role="status" data-testid="whale-report-unavailable">
          <h2>{common.unavailableTitle}</h2>
          <p>{common.unavailable}</p>
        </section>
      ) : (
        <>
          <div className="v2-shell">
            <Stats items={[
              [page.statAccumulation, formatUsdShort(t.accumulation.usd), fillCopy(page.statMeta, { count: t.accumulation.count })],
              [page.statDistribution, formatUsdShort(t.distribution.usd), fillCopy(page.statMeta, { count: t.distribution.count })],
              [page.statShortAdd, formatUsdShort(t.shortAdd.usd), fillCopy(page.statMeta, { count: t.shortAdd.count })],
              [page.statShortCover, formatUsdShort(t.shortCover.usd), fillCopy(page.statMeta, { count: t.shortCover.count })],
            ]} />
            {view.keyFinding ? <p className="nxr-finding" data-testid="data-asset-finding">{view.keyFinding}</p> : null}
          </div>
          <Chart assetKey="whale-accumulation-report" title={page.h1} version={report.windowEnd} />
          <section className="v2-shell nxr-table-wrap" aria-labelledby="nxr-table-h">
            <SectionRule stamp={report.byCoin.length} />
            <h2 id="nxr-table-h">{page.tableTitle}</h2>
            <div className="nxr-scroll" tabIndex={0}>
              <table className="nxd-table nxr-table">
                <thead><tr><th scope="col">{page.colCoin}</th><th scope="col" className="num">{page.colAcc}</th><th scope="col" className="num">{page.colDist}</th><th scope="col" className="num">{page.colSAdd}</th><th scope="col" className="num">{page.colSCover}</th><th scope="col" className="num">{page.colSignals}</th></tr></thead>
                <tbody>
                  {report.byCoin.map((r) => (
                    <tr key={r.coin}>
                      <th scope="row" translate="no">{r.coin}</th>
                      {WHALE_CATEGORIES.map((k) => <td key={k} className={`num${k === "accumulation" && r[k] ? " pos" : k === "distribution" && r[k] ? " neg" : ""}`} dir="ltr">{r[k] ? formatUsdShort(r[k]) : "—"}</td>)}
                      <td className="num">{r.signals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="v2-shell nxr-table-wrap" aria-labelledby="nxr-signals-h">
            <SectionRule stamp={Math.min(report.signals.length, 12)} />
            <h2 id="nxr-signals-h">{page.signalsTitle}</h2>
            <div className="nxr-scroll" tabIndex={0}>
              <table className="nxd-table nxr-table">
                <thead><tr><th scope="col">{page.colCoin}</th><th scope="col">{page.colType}</th><th scope="col">{page.colMarket}</th><th scope="col" className="num">{page.colUsd}</th><th scope="col">{page.colLast}</th><th scope="col">{page.colWallet}</th></tr></thead>
                <tbody>
                  {report.signals.slice(0, 12).map((s) => (
                    <tr key={s.id}>
                      <th scope="row" translate="no">{s.coin}</th>
                      <td>{page.categories[s.category]}</td>
                      <td dir="ltr">{s.market}{s.side && s.side !== "spot" ? ` · ${s.side}` : ""}</td>
                      <td className="num" dir="ltr">{formatUsdShort(s.usd)}</td>
                      <td dir="ltr">{formatSgtStamp(s.time, locale)}</td>
                      <td dir="ltr">{s.explorerUrl && s.address ? <SourceLink locale={locale} market={market} href={s.explorerUrl} target="_blank" rel="noopener nofollow">{`${s.address.slice(0, 6)}…${s.address.slice(-4)}`}</SourceLink> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="nxr-coverage"><a href={hrefFor("/whales", locale, market)}>{page.liveLink} →</a></p>
          </section>
        </>
      )}
      <ReuseBlock locale={locale} assetKey="whale-accumulation-report" title={page.datasetName} year={(report?.windowEnd || "2026").slice(0, 4)} version={report ? `7 days to ${report.windowEnd.slice(0, 10)}` : undefined} />
      <MethodFaq locale={locale} page={page} faq={view.faq} />
      <OtherAssets locale={locale} market={market} current="whale-accumulation-report" />
    </main>
  );
}

const LOGOS = [
  ["logoRound", "/brand/nexualpha/nexualpha-round.svg"],
  ["logoSquare", "/brand/nexualpha/nexualpha-square.png"],
  ["logoHorizontal", "/brand/nexualpha/nexualpha-horizontal-light.png"],
];
const ACCOUNTS = [
  ["X", "https://x.com/NexuAlpha", "@NexuAlpha"],
  ["YouTube", "https://www.youtube.com/@NexuAlphaCN", "@NexuAlphaCN"],
  ["YouTube", "https://www.youtube.com/@NexuAlphaGlobal", "@NexuAlphaGlobal"],
  ["Telegram", BRAND.telegram.channelEn, "@NexuAlphaGlobal"],
  ["Telegram", BRAND.telegram.channelZh, "@NexuAlphaClub"],
];

export function PressPage({ locale = "en", market }) {
  const copy = dataAssetsCopy(locale);
  const page = copy.press;
  const facts = page.facts.map(([k, v]) => [k, fillCopy(v, {
    languages: String(PRESS_LANGUAGE_COUNT),
    feeVenues: String(dataAssetView("exchange-fee-index", locale, { market }).stats.venues),
    tsExchanges: String(dataAssetView("tokenized-stock-tracker", locale, { market }).stats.exchanges),
  })]);
  return (
    <main className="v6 v2-page v3-page nxd nxr nxr--press" id="top" dir={dir(locale)} lang={locale} data-testid="press-page">
      <Hero locale={locale} market={market} h1={page.h1} lead={page.lead} />
      <section className="v2-shell nxr-section" aria-labelledby="nxr-bp-h" id="boilerplate">
        <SectionRule />
        <h2 id="nxr-bp-h">{page.boilerplateTitle}</h2>
        <div className="nxr-reuse__grid">
          {[["en", page.boilerplateEn], ["zh-Hans", page.boilerplateZh]].map(([lang, label]) => (
            <div key={lang} className="nxd-panel" lang={lang}>
              <Snippet label={label} code={PRESS_BOILERPLATE[lang]} copy={copy.common} />
            </div>
          ))}
        </div>
      </section>
      <section className="v2-shell nxr-section" aria-labelledby="nxr-facts-h" id="facts">
        <SectionRule stamp={facts.length} />
        <h2 id="nxr-facts-h">{page.factsTitle}</h2>
        <dl className="nxr-facts">{facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      </section>
      <section className="v2-shell nxr-section" aria-labelledby="nxr-data-h" id="datasets">
        <SectionRule stamp={DATA_ASSET_KEYS.length} />
        <h2 id="nxr-data-h">{page.dataTitle}</h2>
        <p className="nxd-muted">{page.dataBody}</p>
        <div className="nxr-assets">
          {DATA_ASSET_KEYS.map((key) => {
            const p = copy[pageKeyForAsset(key)];
            const snippets = dataAssetEmbedSnippets(key, p.datasetName);
            return (
              <article key={key} className="nxd-panel nxr-asset" data-testid={`press-asset-${key}`}>
                <h3><a href={hrefFor(DATA_ASSETS[key], locale, market)}>{p.h1}</a></h3>
                <p>{p.datasetDescription}</p>
                <p className="nxr-actions">
                  <a href={hrefFor(DATA_ASSETS[key], locale, market)}>{page.openPage} →</a>
                  <a href={dataAssetCsvPath(key)} download>{copy.common.download} ↓</a>
                </p>
                <details className="nxd-embed nxr-embed">
                  <summary><h4>{copy.common.embedTitle}</h4></summary>
                  <div className="nxd-embed__body"><Snippet label={copy.common.embedImage} code={snippets.image} copy={copy.common} /></div>
                </details>
              </article>
            );
          })}
        </div>
      </section>
      <section className="v2-shell nxr-section" aria-labelledby="nxr-logos-h" id="logos">
        <SectionRule stamp={LOGOS.length} />
        <h2 id="nxr-logos-h">{page.logosTitle}</h2>
        <p className="nxd-muted">{page.logosBody}</p>
        <ul className="nxr-logos">
          {LOGOS.map(([key, src]) => (
            <li key={src}><img src={src} alt={`NexuAlpha ${page[key]}`} width="96" height="96" loading="lazy" /><a href={src} download>{page[key]} ↓</a></li>
          ))}
        </ul>
      </section>
      <section className="v2-shell nxr-section" aria-labelledby="nxr-acc-h" id="accounts">
        <SectionRule stamp={ACCOUNTS.length} />
        <h2 id="nxr-acc-h">{page.accountsTitle}</h2>
        <ul className="nxr-accounts">
          {ACCOUNTS.map(([network, url, handle]) => <li key={url}><span>{network}</span><a href={url} dir="ltr" target="_blank" rel="noopener noreferrer me">{handle}</a></li>)}
        </ul>
      </section>
      <section className="v2-shell nxr-section" aria-labelledby="nxr-contact-h" id="contact">
        <SectionRule />
        <h2 id="nxr-contact-h">{page.contactTitle}</h2>
        <p>{page.contactBody} <a href={`mailto:${BRAND.email}`} dir="ltr">{BRAND.email}</a></p>
        <h3 className="nxr-subhead">{page.citeTitle}</h3>
        <p>{page.citeBody}</p>
      </section>
    </main>
  );
}


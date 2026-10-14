// Shared pieces of /etf-flows and /calendar (route chunk route-intel-tools): snapshot hook, hero, unavailable state,
// method/FAQ tail and the "more data" links. Server-rendered from the snapshot the Worker read; the browser starts
// from that hydration state and re-reads the JSON every 10 minutes while the tab is visible.
import React, { useEffect, useState } from "react";
import { SourceLink } from "../shared/SourceLink.jsx";
import { SectionRule } from "../shared/DataRule.jsx";
import { localizedHref } from "../../data/locale-routing.js";
import { CALENDAR_PATH, ETF_FLOWS_LIVE, ETF_FLOWS_PATH } from "../../data/intel-tools-routes.js";
import { intelToolLinks } from "../../data/intel-tools-links.js";
import { FUNDING_RATES_PATH, LIQUIDATIONS_PATH, dataPageCopy } from "../../data/market-data-pages-nav.js";
import { FLASH_PATH, flashNavLabel } from "../../data/flash-path.js";
import { formatSgtStamp } from "../../data/sgt-time.js";
import { intelToolsCopy } from "../../data/intel-tools-copy.js";
import { NewsTelegramAlerts } from "../v3/news/NewsTelegramAlerts.jsx";
import { startJsonPolling } from "../shared/json-polling.js";
import "../data/data-pages.css";
import "./intel-tools.css";

export const REFRESH_MS = 10 * 60 * 1000;
export const textDirection = (locale) => (["ar", "ur"].includes(locale) ? "rtl" : "ltr");
export const hrefFor = (path, locale, market) => {
  const href = localizedHref(path, { locale });
  return market ? `${href}${href.includes("?") ? "&" : "?"}market=${encodeURIComponent(market)}` : href;
};

/** Raw snapshot: the hydration seed, then the JSON re-read every REFRESH_MS (a failed read keeps what is shown). */
export function useSnapshot(path, initial) {
  const [json, setJson] = useState(initial ?? null);
  useEffect(() => {
    return startJsonPolling({
      request: path,
      intervalMs: REFRESH_MS,
      immediate: !initial,
      cache: "no-cache",
      isData: (next) => Boolean(next && typeof next === "object" && next.generatedAt),
      onData: setJson,
    });
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps -- initial is the hydration seed only
  return json;
}

export function ToolHero({ locale, market, page, generatedAt, children }) {
  const common = intelToolsCopy(locale).common;
  return (
    <header className="nxd-hero v2-shell">
      <nav className="nxd-crumbs" aria-label="Breadcrumb">
        <a href={hrefFor("/", locale, market)}>{common.home}</a>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{page.h1}</span>
      </nav>
      <h1>{page.h1}</h1>
      <p className="nxd-lead">{page.lead}</p>
      {generatedAt ? (
        <p className="nxd-updated" data-testid="intel-tool-updated">
          <span className="nxd-dot" aria-hidden="true" /><strong>{common.updated}</strong> <time dateTime={generatedAt} dir="ltr">{formatSgtStamp(generatedAt, locale)}</time>
        </p>
      ) : null}
      {children}
    </header>
  );
}

export function ToolUnavailable({ locale }) {
  const common = intelToolsCopy(locale).common;
  return (
    <section className="nxd-unavailable v2-shell" role="status" data-testid="intel-tool-unavailable">
      <h2>{common.unavailableTitle}</h2>
      <p>{common.unavailable}</p>
    </section>
  );
}

export function SourcesList({ locale, sources }) {
  if (!sources?.length) return null;
  const common = intelToolsCopy(locale).common;
  return (
    <section className="nxi-sources v2-shell" aria-labelledby="nxi-sources-h">
      <SectionRule stamp={sources.length} />
      <h2 id="nxi-sources-h">{common.sources}</h2>
      <ul>{sources.map((s) => <li key={s.url}><SourceLink locale={locale} href={s.url} target="_blank" rel="noopener nofollow">{s.name}</SourceLink></li>)}</ul>
    </section>
  );
}

export function ToolTail({ locale, market, page, current, jsonPath }) {
  const common = intelToolsCopy(locale).common;
  const links = intelToolLinks(locale);
  const nav = dataPageCopy(locale).nav;
  const related = [
    current !== "etf" && ETF_FLOWS_LIVE ? [ETF_FLOWS_PATH, links.etf] : null,
    current !== "calendar" ? [CALENDAR_PATH, links.calendar] : null,
    [FLASH_PATH, flashNavLabel(locale)],
    [LIQUIDATIONS_PATH, nav.liquidations],
    [FUNDING_RATES_PATH, nav.funding],
  ].filter(Boolean);
  return (
    <>
      <div className="v2-shell nxd-alerts"><NewsTelegramAlerts locale={locale} /></div>
      <section className="nxd-explainer v2-shell" aria-labelledby="nxi-method-h">
        <SectionRule />
        <h2 id="nxi-method-h">{common.method}</h2>
        {page.methodBody.map((p, i) => <p key={i}>{p}</p>)}
      </section>
      <section className="nxd-faq v2-shell" aria-labelledby="nxi-faq-h">
        <SectionRule stamp={page.faq.length} />
        <h2 id="nxi-faq-h">{common.faq}</h2>
        {page.faq.map(([q, a]) => <article key={q} className="nxd-faq__item"><h3>{q}</h3><p>{a}</p></article>)}
      </section>
      <footer className="nxd-foot v2-shell">
        <p>{common.timesUtc}</p>
        <p className="nxd-foot__links" data-testid="intel-tool-related">
          <span>{common.related}:</span>{" "}
          {related.map(([path, label], i) => <React.Fragment key={path}>{i ? <span aria-hidden="true"> · </span> : null}<a href={hrefFor(path, locale, market)}>{label}</a></React.Fragment>)}
          <span aria-hidden="true"> · </span>
          <a href={jsonPath} rel="nofollow" dir="ltr">{common.json}</a>
        </p>
      </footer>
    </>
  );
}

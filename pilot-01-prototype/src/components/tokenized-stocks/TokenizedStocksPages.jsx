// Tokenized US stocks: hub (/tokenized-stocks) and ticker pages (/tokenized-stocks/<ticker>), owner 2026-10-15.
// Every number, symbol, hour, fee, leverage, region and promotion on these pages comes from tokenized-stocks-facts.js
// and is printed next to the official page it comes from (plain text where a link would carry no invite code).
// Values the research left unknown are not rendered. No fine print, no disclaimers (owner rule).
// SSR renders every word; the browser only adds the copy buttons, so the first client render matches the server HTML.
import React, { useState } from "react";
import { useTsCopy } from "../../data/tokenized-stocks-copy-client.js";
import { TS_CHECKED, TS_LANES, TS_TICKERS, tsListings, tsSymbol } from "../../data/tokenized-stocks-facts.js";
import { fillTs, tsActivePromo, tsCitable, tsFeeText, tsList, tsSignup, tsVenues } from "../../data/tokenized-stocks.js";
import { TS_EXCHANGE_SLUGS, TS_PATH, tsExchangePath, tsTickerPath } from "../../data/tokenized-stocks-routes.js";
import { tsLive } from "../../data/tokenized-stocks-rows.js";
import { localizedHref } from "../../data/locale-routing.js";
import { outboundLink, sourceDomain } from "../../data/exchange-outbound.js";
import { formatSgt } from "../../data/local-time.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import "./tokenized-stocks.css";

const RTL = new Set(["ar", "ur"]);
// The page's copy edition carries its locale (tokenized-stocks-copy-client.js): lang follows the edition shown.
const contentLang = (t) => t.locale;
const hrefFor = (path, locale, market) => {
  const href = localizedHref(path, { locale });
  return market ? `${href}${href.includes("?") ? "&" : "?"}market=${encodeURIComponent(market)}` : href;
};
const regionName = (code, t) => t.regions?.[code] || code;

function Sources({ ids, locale, market, t, className = "" }) {
  const list = tsCitable(ids, locale, market);
  if (!list.length) return null;
  return (
    <p className={`nxts-src ${className}`}>
      <span className="nxts-src__k">{t.source}</span>
      {list.map((src) => {
        const label = `${sourceDomain(src.url)} · ${src.date}`;
        const link = outboundLink(src.url, { locale, market, src: "tokenized-stocks-source" });
        return link?.href
          ? <a key={src.id} href={link.href} title={src.title} target="_blank" rel={link.sponsored ? "sponsored noopener noreferrer" : "noopener noreferrer"}>{label}</a>
          : <span key={src.id} title={src.title}>{label}</span>;
      })}
    </p>
  );
}

function CodeChip({ code, t }) {
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked: the code stays visible */ }
  };
  return (
    <span className="nxts-code">
      <span className="nxts-code__k">{t.codeLabel}</span>
      <code translate="no">{code}</code>
      <button type="button" onClick={doCopy} aria-live="polite">{copied ? t.copied : t.copy}</button>
    </span>
  );
}

function SignupButton({ ex, signup, t, className = "" }) {
  return (
    <a className={`nxts-btn ${className}`} href={signup.href} target="_blank" rel="sponsored noopener noreferrer"
      data-offer-link="go" data-cta-kind="signup" data-cta-platform={ex.slug} data-cta-placement={new URLSearchParams(signup.href.split("?")[1]).get("src")}>
      <span>{fillTs(t.cta, { name: ex.name })}</span><span aria-hidden="true" className="nxts-arrow">→</span>
    </a>
  );
}

function Crumbs({ items, locale, market, t }) {
  return (
    <nav className="nxts-crumbs" aria-label="Breadcrumb">
      <a href={hrefFor("/", locale, market)}>{t.home}</a>
      {items.map(([label, path]) => (
        <React.Fragment key={label}><span aria-hidden="true">/</span>{path ? <a href={hrefFor(path, locale, market)}>{label}</a> : <span aria-current="page">{label}</span>}</React.Fragment>
      ))}
    </nav>
  );
}

const hoursText = (fact, t) => (fact ? t.hours[fact.v] || fact.v : "");
const levText = (fact, t) => (fact ? `${fillTs(t.levUpTo, { x: fact.v })}${fact.asOf ? ` · ${fact.asOf}` : ""}` : "");

const TICKERS_SHOWN = 4;
/** A fact value with its "as of" month on a quiet second line. */
const factValue = (fact, text) => (fact && text ? <>{text}{fact.asOf ? <> <small>{fact.asOf}</small></> : null}</> : "");

/** Example tickers as one line of mono text (links where a ticker page exists) plus a "+N" count. */
function TickerLine({ d, t, locale, market }) {
  const symbols = d.tickers?.v || [];
  if (!symbols.length) return null;
  return (
    <p className="nxts-syms">
      <span className="nxts-sr">{t.cols.tickers}: </span>
      {symbols.slice(0, TICKERS_SHOWN).map((ticker) => {
        const sym = tsSymbol(d, ticker);
        return TS_TICKERS.includes(ticker)
          ? <a key={ticker} href={hrefFor(tsTickerPath(ticker), locale, market)} translate="no">{sym}</a>
          : <span key={ticker} translate="no">{sym}</span>;
      })}
      {symbols.length > TICKERS_SHOWN ? <span className="nxts-syms__more">+{symbols.length - TICKERS_SHOWN}</span> : null}
    </p>
  );
}

/** One product line of an exchange: label, form, then count / hours / leverage / fee as a definition grid, tickers. */
function LaneCell({ ex, lane, t, locale, market }) {
  const d = ex[lane];
  const facts = [
    ["count", t.cols.count, d.count ? factValue(d.count, fillTs(t.listed, { n: d.count.v })) : ""],
    ["hours", t.cols.hours, factValue(d.hours, hoursText(d.hours, t))],
    ["lev", t.cols.lev, d.lev ? factValue(d.lev, fillTs(t.levUpTo, { x: d.lev.v })) : ""],
    ["fees", t.cols.fees, d.fee ? factValue(d.fee, tsFeeText(d.fee, t)) : ""],
  ];
  return (
    <div className="nxts-cell" data-lane={lane}>
      <p className="nxts-cell__head">
        <span className="nxts-cell__lane" data-lane={lane}>{t.lanes[lane]}</span>
        {d.form && lane !== "preipo" ? <b translate="no">{d.form.v}</b> : null}
        {d.settle ? <small translate="no">{d.settle.v}</small> : null}
      </p>
      <dl className="nxts-facts">
        {facts.map(([key, k, v]) => (
          <div key={key} data-k={key} data-empty={v ? undefined : ""}><dt>{k}</dt><dd>{v || <span className="nxts-dash" aria-label={t.notListed}>—</span>}</dd></div>
        ))}
      </dl>
      <TickerLine d={d} t={t} locale={locale} market={market} />
    </div>
  );
}

function ExchangeRow({ ex, t, locale, market, now }) {
  const signup = tsSignup(ex.slug, { locale, market, placement: "hub-row" });
  const promo = tsActivePromo(ex, { locale, market, now });
  const excluded = ex.excluded?.v || [];
  const lanes = TS_LANES.filter((lane) => ex[lane]);
  const ids = [
    ...lanes.flatMap((lane) => { const d = ex[lane]; return [d.form, d.tickers, d.count, d.hours, d.lev, d.fee, d.settle].filter(Boolean).flatMap((fact) => fact.s); }),
    ...(excluded.length ? ex.excluded.s : []),
  ];
  const nSources = tsCitable(ids, locale, market).length;
  return (
    <article className="nxts-row" id={`ts-${ex.slug}`} aria-labelledby={`ts-${ex.slug}-h`}>
      <div className="nxts-row__id">
        <h3 id={`ts-${ex.slug}-h`}><BrandMark slug={ex.slug} compact /><span>{ex.name}</span></h3>
        {signup ? <div className="nxts-row__go"><SignupButton ex={ex} signup={signup} t={t} /><CodeChip code={signup.code} t={t} /></div> : null}
        {promo ? (
          <p className="nxts-promo">
            <span className="nxts-promo__k">{t.cols.promo}</span>
            {promo.href ? <a href={hrefFor(promo.href, locale, market)}>{t.promos[promo.key]}</a> : <span>{t.promos[promo.key]}</span>}
            <small>{fillTs(t.promoEnds, { date: formatSgt(promo.endAt, locale, "end") })}</small>
          </p>
        ) : null}
        {TS_EXCHANGE_SLUGS.includes(ex.slug)
          ? <a className="nxts-row__profile" href={hrefFor(tsExchangePath(ex.slug), locale, market)}>{fillTs(t.tk.exLink, { name: t.exNames?.[ex.slug] || ex.name })}</a>
          : <a className="nxts-row__profile" href={hrefFor(`/exchanges/${ex.slug}`, locale, market)}>{fillTs(t.profile, { name: ex.name })}</a>}
      </div>
      <div className="nxts-row__body">
        {lanes.map((lane) => <LaneCell key={lane} ex={ex} lane={lane} t={t} locale={locale} market={market} />)}
        <div className="nxts-row__foot">
          {excluded.length ? (
            <p className="nxts-geo"><span className="nxts-geo__k">{t.cols.excluded}</span>{excluded.slice(0, 5).map((code) => regionName(code, t)).join(" · ")}{excluded.length > 5 ? ` ${fillTs(t.more, { n: excluded.length - 5 })}` : ""}</p>
          ) : null}
          {nSources ? (
            <details className="nxts-row__src">
              <summary>{t.source}<span aria-hidden="true">· {nSources}</span></summary>
              <Sources ids={ids} locale={locale} market={market} t={t} />
            </details>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/** The answer-first paragraph: USDT venues first, then the others with their settlement assets. */
function shortAnswer(venues, t, locale) {
  const usdt = venues.filter((ex) => ["spot", "perp", "preipo"].some((lane) => ex[lane]?.settle?.v === "USDT"));
  const other = venues.filter((ex) => !usdt.includes(ex));
  const assets = [...new Set(other.flatMap((ex) => TS_LANES.flatMap((lane) => String(ex[lane]?.settle?.v || "").split("/")).filter(Boolean)))].sort();
  return {
    main: fillTs(t.answer, { n: usdt.length, list: tsList(usdt.map((ex) => ex.name), locale) }),
    other: other.length && assets.length ? fillTs(t.answerOther, { list: tsList(other.map((ex) => ex.name), locale), assets: tsList(assets, locale) }) : "",
  };
}

/** Exchanges (shown on this page) that list a ticker, and its lanes, from the live table plus the sourced fact rows. */
function tickerCoverage(ticker, slugs, live) {
  const keys = Object.keys(tsLive(live).rows?.[ticker] || {}).filter((key) => slugs.has(key.split(":")[0]));
  const rows = tsListings(ticker).filter((row) => slugs.has(row.exchange.slug));
  return { n: new Set([...keys.map((key) => key.split(":")[0]), ...rows.map((row) => row.exchange.slug)]).size, lanes: new Set([...keys.map((key) => key.split(":")[1]), ...rows.map((row) => row.lane)]) };
}

function TickerBoard({ venues, t, locale, market, live }) {
  const slugs = new Set(venues.map((ex) => ex.slug));
  return (
    <ul className="nxts-board" aria-label={t.tickersH}>
      {TS_TICKERS.slice(0, 8).map((ticker) => {
        const { n, lanes } = tickerCoverage(ticker, slugs, live);
        return (
          <li key={ticker}>
            <a href={hrefFor(tsTickerPath(ticker), locale, market)}>
              <b translate="no">{ticker}</b>
              <span className="nxts-board__name">{t.names[ticker]}</span>
              <span className="nxts-board__lanes" aria-hidden="true">{["spot", "perp"].map((lane) => <i key={lane} data-lane={lane} data-on={lanes.has(lane) ? "" : undefined} />)}</span>
              <span className="nxts-board__n">{fillTs(t.tickerVenues, { n })}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function TickerChips({ t, locale, market, venues, except, live }) {
  const slugs = new Set(venues.map((ex) => ex.slug));
  return (
    <ul className="nxts-chips">
      {TS_TICKERS.filter((ticker) => ticker !== except).map((ticker) => {
        const { n } = tickerCoverage(ticker, slugs, live);
        return (
          <li key={ticker}>
            <a href={hrefFor(tsTickerPath(ticker), locale, market)}>
              <b translate="no">{ticker}</b><span>{t.names[ticker] || ticker}</span><small>{fillTs(t.tickerVenues, { n })}</small>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function Faq({ t, locale, market, items }) {
  return (
    <div className="nxts-faq">
      {items.map(([q, a, ids]) => (
        <details key={q}>
          <summary><h3>{q}</h3></summary>
          <p>{a}</p>
          <Sources ids={ids} locale={locale} market={market} t={t} />
        </details>
      ))}
    </div>
  );
}

export function TokenizedStocksHubPage({ locale = "en", market, live, page }) {
  const t = useTsCopy(locale, page?.copy);
  if (!t) return <main className="nxts" id="top" aria-busy="true" />;
  const venues = tsVenues(locale, market);
  // Render time from the server (prerender state) so expired campaigns drop identically on server and client.
  const now = page?.now ?? Date.now();
  const answer = shortAnswer(venues, t, locale);
  const anySignup = venues.some((ex) => tsSignup(ex.slug, { locale, market }));
  const steps = t.steps.map((step, index) => (index === 1 && !anySignup ? t.stepTwoNeutral : step));
  const paths = venues.flatMap((ex) => ["spot", "perp"].filter((lane) => ex[lane]?.path).map((lane) => ({ ex, lane, path: ex[lane].path })));
  return (
    <main className="nxts" id="top" dir={RTL.has(locale) ? "rtl" : "ltr"} lang={contentLang(t)}>
      <section className="nxts-hero">
        <div className="nxts-shell nxts-hero__in">
          <div className="nxts-hero__copy">
            <Crumbs items={[[t.breadcrumb, null]]} locale={locale} market={market} t={t} />
            <h1 className="nxts-h1">{t.h1}</h1>
            <p className="nxts-lead">{t.lead}</p>
            <div className="nxts-answer" role="note" aria-label={t.answerLabel}>
              <h2 className="nxts-answer__k">{t.answerLabel}</h2>
              <p className="nxts-answer__main">{answer.main}</p>
              {answer.other ? <p>{answer.other}</p> : null}
              <p>{t.answerForms}</p>
              <p className="nxts-answer__checked">{fillTs(t.checked, { date: TS_CHECKED })}</p>
            </div>
          </div>
          <TickerBoard venues={venues} t={t} locale={locale} market={market} live={live} />
        </div>
      </section>

      <section className="nxts-shell nxts-sec" aria-labelledby="ts-table-h">
        <div className="nxts-sec__head">
          <h2 id="ts-table-h">{t.tableH}</h2>
          <p className="nxts-sec__lead">{t.tableLead}</p>
        </div>
        <ul className="nxts-legend">
          {TS_LANES.map((lane) => <li key={lane} data-lane={lane}><b>{t.lanes[lane]}</b><span>{t.laneHint[lane]}</span></li>)}
        </ul>
        <div className="nxts-table" role="list">
          <div className="nxts-row nxts-row--head" aria-hidden="true">
            <span>{t.cols.exchange}</span>
            <span className="nxts-row--head__cols"><span>{t.tickerCols.form}</span><span>{t.cols.count}</span><span>{t.cols.hours}</span><span>{t.cols.lev}</span><span>{t.cols.fees}</span><span>{t.cols.tickers}</span></span>
          </div>
          {venues.map((ex) => <div role="listitem" key={ex.slug}><ExchangeRow ex={ex} t={t} locale={locale} market={market} now={now} /></div>)}
        </div>
      </section>

      <section className="nxts-shell nxts-sec" aria-labelledby="ts-pick-h">
        <h2 id="ts-pick-h">{t.pickH}</h2>
        <ul className="nxts-picks">{t.picks.map(([h, b]) => <li key={h}><h3>{h}</h3><p>{b}</p></li>)}</ul>
      </section>

      <section className="nxts-shell nxts-sec" id="how" aria-labelledby="ts-how-h">
        <h2 id="ts-how-h">{t.howH}</h2>
        <p className="nxts-sec__lead">{t.howLead}</p>
        <ol className="nxts-steps">
          {steps.map(([h, b], index) => <li key={h}><span className="nxts-steps__n" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><h3>{h}</h3><p>{b}</p></li>)}
        </ol>
        {paths.length ? (
          <div className="nxts-paths">
            <h3>{t.pathsH}</h3>
            <ul>
              {paths.map(({ ex, lane, path }) => (
                <li key={`${ex.slug}-${lane}`}>
                  <span className="nxts-paths__ex"><BrandMark slug={ex.slug} compact />{ex.name}</span>
                  <span className="nxts-cell__lane" data-lane={lane}>{t.lanes[lane]}</span>
                  <code translate="no">{path.v}</code>
                  <Sources ids={path.s} locale={locale} market={market} t={t} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="nxts-shell nxts-sec" aria-labelledby="ts-tickers-h">
        <h2 id="ts-tickers-h">{t.tickersH}</h2>
        <p className="nxts-sec__lead">{t.tickersLead}</p>
        <TickerChips t={t} locale={locale} market={market} venues={venues} live={live} />
      </section>

      <section className="nxts-shell nxts-sec" aria-labelledby="ts-faq-h">
        <h2 id="ts-faq-h">{t.faqH}</h2>
        <Faq t={t} locale={locale} market={market} items={t.faq} />
      </section>

      <section className="nxts-shell nxts-sec" aria-labelledby="ts-rel-h">
        <h2 id="ts-rel-h">{t.relatedH}</h2>
        <ul className="nxts-related">
          <li><a href={hrefFor("/topics/tokenized-stocks-vs-perpetuals", locale, market)}>{t.related.topic}</a></li>
          <li><a href={hrefFor("/activities/bybit-stocks", locale, market)}>{t.related.bybitStocks}</a></li>
          <li><a href={hrefFor("/exchanges", locale, market)}>{t.related.exchanges}</a></li>
          <li><a href={hrefFor("/academy", locale, market)}>{t.related.academy}</a></li>
        </ul>
      </section>
    </main>
  );
}

// Ticker and exchange-product pages live in TokenizedStocksDetail.jsx (same route chunk).
export { TokenizedStocksTickerPage, TokenizedStocksExchangePage } from "./TokenizedStocksDetail.jsx";

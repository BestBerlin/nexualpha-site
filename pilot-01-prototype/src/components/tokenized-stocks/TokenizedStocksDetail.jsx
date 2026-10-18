// Tokenized US stocks: ticker pages (/tokenized-stocks/<ticker>) and exchange-product pages
// (/tokenized-stocks/exchange/<venue>), 2026-10-18.
// Symbols, maximum leverage and standard fees come from the live listing snapshot (each exchange's own public market
// data, refreshed on the host; the server passes the copy it rendered with as `live`, so the browser hydrates the same
// table). Hours, dividends, in-app paths and region exclusions come from the sourced facts. Every value is printed next
// to its source and date; values nobody publishes are not rendered. Sign-ups go through /go/<venue> with our code, never
// in neutral locales and never for Bitget in Türkiye. No fine print (owner rule).
import React, { useState } from "react";
import { TS_COPY } from "../../data/tokenized-stocks-copy.js";
import { TS_ETFS, TS_PREIPO, TS_TICKERS, tsExchange } from "../../data/tokenized-stocks-facts.js";
import { fillTs, tsCampaigns, tsCitable, tsFeeText, tsSignup, tsVenues } from "../../data/tokenized-stocks.js";
import { tsLive, tsRowSources } from "../../data/tokenized-stocks-rows.js";
import { exchangePageModel, sgtStamp, tickerPageModel } from "../../data/tokenized-stocks-model.js";
import { TS_LIVE_ENDPOINTS } from "../../data/tokenized-stocks-live-sources.js";
import { TS_EXCHANGE_SLUGS, TS_PATH, tsExchangePath, tsTickerPath } from "../../data/tokenized-stocks-routes.js";
import { localizedHref } from "../../data/locale-routing.js";
import { outboundLink, sourceDomain } from "../../data/exchange-outbound.js";
import { formatSgt, readerDayKey } from "../../data/local-time.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import "./tokenized-stocks.css";
import "./ts-detail.css";

const RTL = new Set(["ar", "ur"]);
const contentLang = (locale) => (TS_COPY[locale] ? locale : String(locale || "").startsWith("zh") ? "zh-Hans" : "en");
const hrefFor = (path, locale, market) => {
  const href = localizedHref(path, { locale });
  return market ? `${href}${href.includes("?") ? "&" : "?"}market=${encodeURIComponent(market)}` : href;
};
const pct = (n) => `${Number(n).toString()}%`;

function SourceList({ sources, locale, market, t }) {
  if (!sources.length) return null;
  return (
    <p className="nxts-src">
      <span className="nxts-src__k">{t.source}</span>
      {sources.map((src) => {
        const label = `${sourceDomain(src.url)} · ${src.date}`;
        // Market-data endpoints are cited as text (they are JSON, not pages); official pages link through /go.
        if (src.live) return <span key={src.id} title={src.url}>{label}</span>;
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
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* the code stays visible */ }
  };
  return (
    <span className="nxts-code">
      <span className="nxts-code__k">{t.codeLabel}</span>
      <code translate="no">{code}</code>
      <button type="button" onClick={doCopy} aria-live="polite">{copied ? t.copied : t.copy}</button>
    </span>
  );
}

function SignupButton({ ex, signup, t, label }) {
  return (
    <a className="nxts-btn" href={signup.href} target="_blank" rel="sponsored noopener noreferrer"
      data-offer-link="go" data-cta-kind="signup" data-cta-platform={ex.slug} data-cta-placement={new URLSearchParams(signup.href.split("?")[1]).get("src")}>
      <span>{label || fillTs(t.cta, { name: ex.name })}</span><span aria-hidden="true" className="nxts-arrow">→</span>
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

function Updated({ at, t }) {
  const text = sgtStamp(at);
  return text ? <p className="nxts-updated"><time dateTime={new Date(at).toISOString()}>{fillTs(t.updated, { time: text })}</time></p> : null;
}

function Faq({ items, locale, market, t }) {
  return (
    <div className="nxts-faq">
      {items.map(([q, a, sources]) => (
        <details key={q} open>
          <summary><h3>{q}</h3></summary>
          <p>{a}</p>
          {sources?.length ? <SourceList sources={sources} locale={locale} market={market} t={t} /> : null}
        </details>
      ))}
    </div>
  );
}

const hoursText = (fact, t) => (fact ? t.hours[fact.v] || fact.v : "");
function feeText(row, t) {
  if (!row.fee) return "";
  if (row.feeLive) return fillTs(t.feeMakerTaker, { maker: row.fee.v.maker != null ? pct(row.fee.v.maker) : "—", taker: pct(row.fee.v.taker) });
  return tsFeeText(row.fee, t);
}
const levOf = (row, t) => (row.lev != null ? fillTs(t.levUpTo, { x: row.lev }) : row.levFact ? `${fillTs(t.levUpTo, { x: row.levFact.v })}${row.levFact.asOf ? ` · ${row.levFact.asOf}` : ""}` : "");
const laneLabel = (row, t) => (row.lane === "spot" ? `${t.lanes.spot}${row.form ? ` · ${row.form}` : ""}` : t.lanes[row.lane]);

function TickerRow({ row, ticker, t, tk, locale, market }) {
  const signup = tsSignup(row.exchange.slug, { locale, market, placement: `ticker-${ticker.toLowerCase()}` });
  const div = row.dividends?.v ? tk.div[row.dividends.v] : "";
  return (
    <div className="nxts-tk2__row" role="row">
      <span role="cell" className="nxts-tk__ex"><BrandMark slug={row.exchange.slug} compact /><a href={hrefFor(TS_EXCHANGE_SLUGS.includes(row.exchange.slug) ? tsExchangePath(row.exchange.slug) : `/exchanges/${row.exchange.slug}`, locale, market)}>{row.exchange.name}</a></span>
      <span role="cell" data-k={tk.cols.form}><span className="nxts-cell__lane" data-lane={row.lane}>{laneLabel(row, t)}</span></span>
      <span role="cell" data-k={tk.cols.symbol}><code translate="no">{row.symbol}</code>{row.alt ? <small className="nxts-tk2__alt">{fillTs(tk.altToken, { sym: row.alt.sym, form: row.alt.form })}</small> : null}</span>
      <span role="cell" data-k={tk.cols.lev}>{levOf(row, t) || "—"}</span>
      <span role="cell" data-k={tk.cols.fee}>{feeText(row, t) || "—"}</span>
      <span role="cell" data-k={tk.cols.hours}>{hoursText(row.hours, t) || "—"}</span>
      <span role="cell" data-k={tk.cols.dividends}>{div || "—"}</span>
      <span role="cell" className="nxts-tk__go">
        {signup ? <><CodeChip code={signup.code} t={t} /><SignupButton ex={row.exchange} signup={signup} t={t} /></> : null}
        <SourceList sources={tsRowSources(row, locale, market)} locale={locale} market={market} t={t} />
      </span>
    </div>
  );
}

/** Stock campaigns running now on the exchanges of this page (our pages first, sign-up through /go on the rows). */
function Campaigns({ items, venues, t, tk, locale, market }) {
  if (!items.length) return null;
  const names = new Map(venues.map((ex) => [ex.slug, ex.name]));
  return (
    <section className="nxts-shell nxts-sec" aria-labelledby="ts-cmp-h">
      <h2 id="ts-cmp-h">{tk.campaignsH}</h2>
      <ul className="nxts-campaigns">
        {items.map((c) => {
          const signup = tsSignup(c.venue, { locale, market, placement: `campaign-${c.key.toLowerCase()}`.slice(0, 31) });
          return (
            <li key={`${c.venue}-${c.key}`}>
              <BrandMark slug={c.venue} compact />
              <p className="nxts-promo">
                <span className="nxts-promo__k">{names.get(c.venue) || c.venue}</span>
                {c.href ? <a href={hrefFor(c.href, locale, market)}>{t.promos[c.key]}</a> : <span>{t.promos[c.key]}</span>}
                <small>{fillTs(t.promoEnds, { date: formatSgt(c.endAt, locale, "end") })}</small>
              </p>
              {signup ? <SignupButton ex={{ slug: c.venue, name: names.get(c.venue) || c.venue }} signup={signup} t={t} /> : null}
              <SourceList sources={tsCitable(c.s, locale, market)} locale={locale} market={market} t={t} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Listing changes the host refresh job saw for this ticker (newest first), in owner venue order filtering. */
function Changes({ events, venues, t, tk }) {
  const names = new Map(venues.map((ex) => [ex.slug, ex.name]));
  const list = events.filter((e) => names.has(e.venue)).slice(0, 8);
  if (!list.length) return null;
  return (
    <section className="nxts-shell nxts-sec" aria-labelledby="ts-chg-h">
      <h2 id="ts-chg-h">{tk.changesH}</h2>
      <ul className="nxts-changes">
        {list.map((e) => (
          <li key={`${e.observedAt}-${e.venue}-${e.lane}`} data-type={e.type}>
            <time dateTime={e.observedAt}>{sgtStamp(e.observedAt)} SGT</time>
            <span>{fillTs(e.type === "listed" ? tk.changeListed : tk.changeDelisted, { exchange: names.get(e.venue), sym: e.sym })}</span>
            <span className="nxts-cell__lane" data-lane={e.lane === "spot" ? "spot" : "perp"}>{t.lanes[e.lane === "spot" ? "spot" : "perp"]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TickerLinks({ t, locale, market, except, live }) {
  const data = tsLive(live);
  return (
    <ul className="nxts-chips">
      {TS_TICKERS.filter((ticker) => ticker !== except).map((ticker) => {
        const n = new Set(Object.keys(data.rows?.[ticker] || {}).map((key) => key.split(":")[0])).size;
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

export function TokenizedStocksTickerPage({ locale = "en", market, ticker, live }) {
  const model = tickerPageModel(ticker, { locale, market, live });
  const { t, tk, rows, name, preipo, answer, faq, about, data } = model;
  const venues = tsVenues(locale, market);
  const exLinks = venues.filter((ex) => TS_EXCHANGE_SLUGS.includes(ex.slug) && rows.some((row) => row.exchange.slug === ex.slug));
  const h1 = preipo ? fillTs(tk.preH1, { name }) : fillTs(t.tickerH1, { name, ticker });
  return (
    <main className="nxts nxts--ticker" id="top" dir={RTL.has(locale) ? "rtl" : "ltr"} lang={contentLang(locale)}>
      <section className="nxts-hero nxts-hero--ticker">
        <div className="nxts-shell">
          <Crumbs items={[[t.breadcrumb, TS_PATH], [preipo ? name : ticker, null]]} locale={locale} market={market} t={t} />
          <h1 className="nxts-h1">{h1}{TS_ETFS.has(ticker) ? <span className="nxts-etf">{t.etf}</span> : null}{preipo ? <span className="nxts-etf" data-lane="preipo">{tk.preipoBadge}</span> : null}</h1>
          <Updated at={data.generatedAt} t={t} />
          <p className="nxts-lead">{preipo ? fillTs(tk.preLead, { name }) : fillTs(t.tickerLead, { name })}</p>
          <div className="nxts-answer" role="note" aria-label={t.answerLabel}>
            <h2 className="nxts-answer__k">{t.answerLabel}</h2>
            <p className="nxts-answer__main">{answer[0]}</p>
            {answer.slice(1).map((line) => <p key={line}>{line}</p>)}
          </div>
        </div>
      </section>

      <section className="nxts-shell nxts-sec" aria-labelledby="ts-tk-h">
        <h2 id="ts-tk-h">{fillTs(t.tickerH1, { name, ticker })}</h2>
        <div className="nxts-tk2" role="table" aria-label={h1}>
          <div className="nxts-tk2__row nxts-tk2__row--head" role="row">
            {["exchange", "form", "symbol", "lev", "fee", "hours", "dividends"].map((key) => <span key={key} role="columnheader">{tk.cols[key]}</span>)}
            <span role="columnheader"><span className="nxts-sr">{tk.cols.source}</span></span>
          </div>
          {rows.map((row) => <TickerRow key={`${row.exchange.slug}-${row.lane}`} row={row} ticker={ticker} t={t} tk={tk} locale={locale} market={market} />)}
        </div>
      </section>

      <Campaigns items={tsCampaigns({ venues: venues.map((ex) => ex.slug).filter((slug) => rows.some((row) => row.exchange.slug === slug)), ticker, locale, market })} venues={venues} t={t} tk={tk} locale={locale} market={market} />

      <Changes events={(data.events || []).filter((e) => e.ticker === ticker)} venues={venues} t={t} tk={tk} />

      {about ? (
        <section className="nxts-shell nxts-sec" aria-labelledby="ts-about-h">
          <h2 id="ts-about-h">{fillTs(tk.aboutH, { name })}</h2>
          <p className="nxts-sec__lead nxts-about">{about}</p>
        </section>
      ) : null}

      <section className="nxts-shell nxts-sec" aria-labelledby="ts-tfaq-h">
        <h2 id="ts-tfaq-h">{fillTs(tk.faqH, { ticker: preipo ? name : ticker })}</h2>
        <Faq items={faq} locale={locale} market={market} t={t} />
      </section>

      {exLinks.length ? (
        <section className="nxts-shell nxts-sec" aria-labelledby="ts-exl-h">
          <h2 id="ts-exl-h">{t.ex.otherEx}</h2>
          <ul className="nxts-related">
            {exLinks.map((ex) => <li key={ex.slug}><a href={hrefFor(tsExchangePath(ex.slug), locale, market)}>{fillTs(tk.exLink, { name: t.exNames[ex.slug] || ex.name })}</a></li>)}
          </ul>
        </section>
      ) : null}

      <section className="nxts-shell nxts-sec" aria-labelledby="ts-other-h">
        <h2 id="ts-other-h">{tk.other}</h2>
        <TickerLinks t={t} locale={locale} market={market} except={ticker} live={data} />
        <p className="nxts-back"><a className="nxts-btn nxts-btn--ghost" href={hrefFor(TS_PATH, locale, market)}>{t.tickerBack}<span aria-hidden="true" className="nxts-arrow">→</span></a></p>
      </section>
    </main>
  );
}

function Products({ ex, t, locale, market }) {
  const tk = t.tk;
  const lanes = ["spot", "perp", "preipo"].filter((lane) => ex[lane]);
  return (
    <div className="nxts-exprod">
      {lanes.map((lane) => {
        const d = ex[lane];
        const facts = [
          [t.cols.hours, d.hours ? hoursText(d.hours, t) : ""],
          [t.cols.lev, d.lev ? `${fillTs(t.levUpTo, { x: d.lev.v })}${d.lev.asOf ? ` · ${d.lev.asOf}` : ""}` : ""],
          [t.cols.fees, d.fee ? tsFeeText(d.fee, t) : ""],
          [tk.cols.dividends, d.dividends ? tk.div[d.dividends.v] : ""],
          [t.cols.settle, d.settle ? d.settle.v : ""],
        ].filter(([, v]) => v);
        const ids = [d.form, d.hours, d.lev, d.fee, d.dividends, d.settle, d.path].filter(Boolean).flatMap((fact) => fact.s);
        return (
          <article key={lane} className="nxts-exprod__lane">
            <h3><span className="nxts-cell__lane" data-lane={lane}>{t.lanes[lane]}</span>{d.form && lane !== "preipo" ? <b translate="no">{d.form.v}</b> : null}</h3>
            <p className="nxts-exprod__hint">{t.laneHint[lane]}</p>
            {facts.length ? <dl className="nxts-facts">{facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl> : null}
            {d.path ? <p className="nxts-exprod__path"><code translate="no">{d.path.v}</code></p> : null}
            <SourceList sources={tsCitable(ids, locale, market)} locale={locale} market={market} t={t} />
          </article>
        );
      })}
    </div>
  );
}

export function TokenizedStocksExchangePage({ locale = "en", market, slug, live }) {
  const model = exchangePageModel(slug, { locale, market, live });
  const { t, ex, exName, tickers, answer, faq, excluded, at, data } = model;
  if (!ex) return null;
  const signup = tsSignup(slug, { locale, market, placement: "exchange-page" });
  const campaigns = tsCampaigns({ venues: [slug], all: true, locale, market });
  const path = ex.perp?.path?.v || ex.spot?.path?.v || t.ex.pathNone;
  const tsla = tickers.find((row) => row.ticker === "TSLA");
  const sym = tsla ? [tsla.spot?.sym, tsla.perp?.sym].filter(Boolean).join(" / ") : "";
  const steps = t.ex.steps.map(([h, b], index) => (index === 0 && !signup ? t.ex.stepOneNeutral : [h, b]))
    .map(([h, b]) => [fillTs(h, { name: exName }), fillTs(b, { name: exName, path, sym })]);
  const others = tsVenues(locale, market).filter((v) => v.slug !== slug && TS_EXCHANGE_SLUGS.includes(v.slug));
  return (
    <main className="nxts nxts--exchange" id="top" dir={RTL.has(locale) ? "rtl" : "ltr"} lang={contentLang(locale)}>
      <section className="nxts-hero nxts-hero--ticker">
        <div className="nxts-shell">
          <Crumbs items={[[t.breadcrumb, TS_PATH], [exName, null]]} locale={locale} market={market} t={t} />
          <h1 className="nxts-h1 nxts-h1--ex"><BrandMark slug={slug} compact /><span>{model.h1}</span></h1>
          <Updated at={at} t={t} />
          <p className="nxts-lead">{model.intro}</p>
          <div className="nxts-answer" role="note" aria-label={t.answerLabel}>
            <h2 className="nxts-answer__k">{t.answerLabel}</h2>
            {answer.length ? <p className="nxts-answer__main">{answer[0]}</p> : null}
            {answer.slice(1).map((line) => <p key={line}>{line}</p>)}
          </div>
          {signup ? (
            <div className="nxts-exgo">
              <SignupButton ex={ex} signup={signup} t={t} label={fillTs(t.cta, { name: exName })} /><CodeChip code={signup.code} t={t} />
            </div>
          ) : null}
        </div>
      </section>

      <Campaigns items={campaigns} venues={[ex]} t={t} tk={t.tk} locale={locale} market={market} />

      <section className="nxts-shell nxts-sec" aria-labelledby="ts-exp-h">
        <h2 id="ts-exp-h">{fillTs(t.ex.productsH, { name: exName })}</h2>
        <Products ex={ex} t={t} locale={locale} market={market} />
      </section>

      <section className="nxts-shell nxts-sec" aria-labelledby="ts-exs-h">
        <h2 id="ts-exs-h">{fillTs(t.ex.stepsH, { name: exName })}</h2>
        <ol className="nxts-steps">
          {steps.map(([h, b], index) => <li key={h}><span className="nxts-steps__n" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><h3>{h}</h3><p>{b}</p></li>)}
        </ol>
      </section>

      <section className="nxts-shell nxts-sec" aria-labelledby="ts-ext-h">
        <h2 id="ts-ext-h">{fillTs(t.ex.tableH, { name: exName })}</h2>
        <p className="nxts-sec__lead">{fillTs(t.ex.tableLead, { name: exName })}</p>
        <div className="nxts-ext" role="table" aria-label={fillTs(t.ex.tableH, { name: exName })}>
          <div className="nxts-ext__row nxts-ext__row--head" role="row">
            {["stock", "token", "perp", "lev"].map((key) => <span key={key} role="columnheader">{t.ex.cols[key]}</span>)}
          </div>
          {tickers.map((row) => (
            <div className="nxts-ext__row" role="row" key={row.ticker}>
              <span role="cell" className="nxts-ext__stock"><a href={hrefFor(tsTickerPath(row.ticker), locale, market)}><b translate="no">{row.ticker}</b><span>{t.names[row.ticker] || row.ticker}</span></a></span>
              <span role="cell" data-k={t.ex.cols.token}>{row.spot ? <code translate="no">{row.spot.sym}</code> : "—"}</span>
              <span role="cell" data-k={t.ex.cols.perp}>{row.perp ? <code translate="no">{row.perp.sym}</code> : "—"}{row.preipo && row.perp ? <small className="nxts-cell__lane" data-lane="preipo"> {t.tk.preipoBadge}</small> : null}</span>
              <span role="cell" data-k={t.ex.cols.lev}>{row.perp?.lev != null ? fillTs(t.levUpTo, { x: row.perp.lev }) : "—"}</span>
            </div>
          ))}
        </div>
        <SourceList sources={["perp", "spot"].map((lane) => {
          const iso = data.checked?.[slug]?.[lane];
          return iso ? { id: `live:${slug}:${lane}`, url: TS_LIVE_ENDPOINTS[slug]?.[lane] || "", date: readerDayKey(iso), live: true } : null;
        }).filter((src) => src?.url)} locale={locale} market={market} t={t} />
      </section>

      {excluded.length || faq.length ? (
        <section className="nxts-shell nxts-sec" aria-labelledby="ts-exf-h">
          <h2 id="ts-exf-h">{t.faqH}</h2>
          <Faq items={faq} locale={locale} market={market} t={t} />
        </section>
      ) : null}

      <section className="nxts-shell nxts-sec" aria-labelledby="ts-exo-h">
        <h2 id="ts-exo-h">{t.ex.otherEx}</h2>
        <ul className="nxts-related">
          {others.map((v) => <li key={v.slug}><a href={hrefFor(tsExchangePath(v.slug), locale, market)}>{fillTs(t.tk.exLink, { name: t.exNames[v.slug] || v.name })}</a></li>)}
          <li><a href={hrefFor(TS_PATH, locale, market)}>{t.tickerBack}</a></li>
          <li><a href={hrefFor(`/exchanges/${slug}`, locale, market)}>{fillTs(t.profile, { name: exName })}</a></li>
        </ul>
      </section>
    </main>
  );
}

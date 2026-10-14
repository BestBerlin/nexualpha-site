// "Tokenized US stocks on <exchange>" block of /exchanges/<slug> (owner 2026-10-15): the lanes the exchange lists, with
// form, ticker count, symbols, hours and leverage from tokenized-stocks-facts.js and the official page each comes from.
// Links to the ticker pages and to the exchange's row on /tokenized-stocks. Renders nothing for an exchange without
// sourced stock products or where the hub hides it (Türkiye: Bitget).
import React from "react";
import { TS_TEASER } from "../../data/tokenized-stocks-teaser.js";
import { TS_LANES, TS_TICKERS, tsSymbol } from "../../data/tokenized-stocks-facts.js";
import { fillTs, tsCitable, tsVenues } from "../../data/tokenized-stocks.js";
import { TS_PATH, tsTickerPath } from "../../data/tokenized-stocks-routes.js";
import { localizedHref } from "../../data/locale-routing.js";
import { outboundLink, sourceDomain } from "../../data/exchange-outbound.js";
import "./venue-tokenized-stocks.css";

const teaserFor = (locale) => TS_TEASER[locale] || (String(locale || "").startsWith("zh") ? TS_TEASER["zh-Hans"] : TS_TEASER.en);

export function VenueTokenizedStocks({ slug, locale = "en", market }) {
  const ex = tsVenues(locale, market).find((venue) => venue.slug === slug);
  if (!ex) return null;
  const t = teaserFor(locale);
  const lanes = TS_LANES.filter((lane) => ex[lane]);
  const ids = lanes.flatMap((lane) => [ex[lane].form, ex[lane].tickers, ex[lane].count, ex[lane].hours, ex[lane].lev].filter(Boolean).flatMap((fact) => fact.s));
  const sources = tsCitable(ids, locale, market);
  return (
    <section className="v2-section vts" id="tokenized-stocks" aria-labelledby={`vts-${slug}`}>
      <div className="section-lead"><h2 id={`vts-${slug}`}>{fillTs(t.venueH, { name: ex.name })}</h2></div>
      <ul className="vts-lanes">
        {lanes.map((lane) => {
          const d = ex[lane];
          const symbols = d.tickers?.v || [];
          return (
            <li key={lane} data-lane={lane}>
              <p className="vts-lane"><span>{t.lanes[lane]}</span>{d.form && lane !== "preipo" ? <b translate="no">{d.form.v}</b> : null}</p>
              {d.count ? <p className="vts-count">{fillTs(t.listed, { n: d.count.v })}{d.count.asOf ? <small> · {d.count.asOf}</small> : null}</p> : null}
              {symbols.length ? <ul className="vts-syms">{symbols.slice(0, 8).map((ticker) => <li key={ticker} translate="no">{TS_TICKERS.includes(ticker) ? <a href={localizedHref(tsTickerPath(ticker), { locale })}>{tsSymbol(d, ticker)}</a> : <span>{tsSymbol(d, ticker)}</span>}</li>)}</ul> : null}
              <p className="vts-meta">
                {d.hours ? <span>{t.cols.hours} {t.hours[d.hours.v] || d.hours.v}</span> : null}
                {d.lev ? <span>{t.cols.lev} {fillTs(t.levUpTo, { x: d.lev.v })}</span> : null}
              </p>
            </li>
          );
        })}
      </ul>
      {sources.length ? (
        <p className="vts-src"><span>{t.source}</span>{sources.map((src) => {
          const link = outboundLink(src.url, { locale, market, src: "tokenized-stocks-venue" });
          const label = `${sourceDomain(src.url)} · ${src.date}`;
          return link?.href ? <a key={src.id} href={link.href} title={src.title} target="_blank" rel={link.sponsored ? "sponsored noopener noreferrer" : "noopener noreferrer"}>{label}</a> : <span key={src.id} title={src.title}>{label}</span>;
        })}</p>
      ) : null}
      <p className="vts-all"><a href={`${localizedHref(TS_PATH, { locale })}#ts-${ex.slug}`}>{t.venueLink} →</a></p>
    </section>
  );
}

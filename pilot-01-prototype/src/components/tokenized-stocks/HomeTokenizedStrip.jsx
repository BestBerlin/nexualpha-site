// Home "代币化美股" strip (owner 2026-10-15): right after the hero, before the whale board. Six exchange cards with the
// forms they list (stock tokens / stock perpetuals / pre-IPO) and the ticker count where the exchange publishes one,
// six ticker links and the hub link. Static links only: no CTA, no animation. Styles live in home7.src.css (.h7-ts) so
// the server HTML is styled before this lazy chunk arrives (HomeV7 hydrates it through DeferUntilVisible).
import React from "react";
import { TS_TEASER } from "../../data/tokenized-stocks-teaser.js";
import { TS_LANES, TS_TICKERS } from "../../data/tokenized-stocks-facts.js";
import { fillTs, tsVenues } from "../../data/tokenized-stocks.js";
import { TS_PATH, tsTickerPath } from "../../data/tokenized-stocks-routes.js";
import { localizedHref } from "../../data/locale-routing.js";
import { BrandMark } from "../brand/BrandMark.jsx";

const teaserFor = (locale) => TS_TEASER[locale] || (String(locale || "").startsWith("zh") ? TS_TEASER["zh-Hans"] : TS_TEASER.en);

export function HomeTokenizedStrip({ locale = "en", market }) {
  const t = teaserFor(locale);
  const venues = tsVenues(locale, market).slice(0, 6);
  const hub = localizedHref(TS_PATH, { locale });
  return (
    <section className="h7-in h7-ts" aria-labelledby="h7-ts-h">
      <div className="h7-ts-head">
        <p className="h7-ts-k">{t.homeKicker}</p>
        <h2 id="h7-ts-h">{t.homeTitle}</h2>
        <p className="h7-ts-b">{t.homeBody}</p>
        <a className="h7-ln h7-ts-all" href={hub}>{t.homeAll}</a>
      </div>
      <ul className="h7-ts-cards">
        {venues.map((ex) => {
          const count = ex.spot?.count || ex.perp?.count;
          return (
            <li key={ex.slug}>
              <a href={`${hub}#ts-${ex.slug}`}>
                <span className="h7-ts-n"><BrandMark slug={ex.slug} compact /><b>{ex.name}</b></span>
                <span className="h7-ts-f">{TS_LANES.filter((lane) => ex[lane]).map((lane) => <i key={lane} data-lane={lane}>{t.lanes[lane]}</i>)}</span>
                {count ? <span className="h7-ts-c">{fillTs(t.homeTickers, { n: count.v })}{count.asOf ? <small> · {count.asOf}</small> : null}</span> : null}
              </a>
            </li>
          );
        })}
      </ul>
      <ul className="h7-ts-tk" aria-label={t.breadcrumb}>
        {TS_TICKERS.slice(0, 6).map((ticker) => <li key={ticker}><a href={localizedHref(tsTickerPath(ticker), { locale })} translate="no">{ticker}</a></li>)}
      </ul>
    </section>
  );
}

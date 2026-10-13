// Live market context in the article rail (BTC / ETH / SOL articles). Client-only: the server and the first client
// render output nothing, then the feed is read once after mount; a missing feed or missing figures render nothing.
import React, { useEffect, useState } from "react";
import { DATA_PAGE_NAV, FUNDING_RATES_PATH, LIQUIDATIONS_PATH, MARKET_EVENTS_PATH } from "../../../data/market-data-pages-nav.js";
import { localizedHref } from "../../../data/locale-routing.js";
import { DataRule, utcClock } from "../../shared/DataRule.jsx";
import { formatSgt } from "../../../data/local-time.js";
import { formatFunding, formatPrice, formatSignedPct, formatUsdShort, marketContextCopy, marketContextSnapshot } from "./article-market-context.js";

export function ArticleMarketContext({ assets = [], locale = "en" }) {
  const [snapshot, setSnapshot] = useState(null);
  const key = assets.join(",");
  useEffect(() => {
    if (!key) return undefined;
    let alive = true;
    fetch(MARKET_EVENTS_PATH, { headers: { accept: "application/json" }, cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((feed) => { if (alive) setSnapshot(marketContextSnapshot(feed, key.split(","))); })
      .catch(() => { /* no feed: the slot stays empty */ });
    return () => { alive = false; };
  }, [key]);
  if (!snapshot) return null;
  const t = marketContextCopy(locale);
  const nav = DATA_PAGE_NAV[locale] || (String(locale).startsWith("zh") ? DATA_PAGE_NAV["zh-Hans"] : DATA_PAGE_NAV.en);
  return (
    <aside className="news-market-context" aria-labelledby="news-market-context-title" data-market-context={key}>
      <DataRule label={t.title} labelId="news-market-context-title" stamp={formatSgt(snapshot.generatedAt, locale, "clock") || utcClock(snapshot.generatedAt)} dateTime={snapshot.generatedAt} />
      <dl className="news-market-context__rows">
        {snapshot.rows.map((row) => (
          <div className="news-market-context__asset" key={row.symbol}>
            <dt translate="no">{row.symbol}</dt>
            <dd>
              <dl className="news-market-context__figures">
                {row.price != null && <div><dt>{t.price}</dt><dd>{formatPrice(row.price)} <span data-sign={row.change24hPct > 0 ? "up" : row.change24hPct < 0 ? "down" : "flat"}>{formatSignedPct(row.change24hPct)}</span></dd></div>}
                {(row.fundingBinance != null || row.fundingOkx != null) && <div><dt>{t.funding} <small>{t.venues}</small></dt><dd>{formatFunding(row.fundingBinance)} · {formatFunding(row.fundingOkx)}</dd></div>}
                {row.liquidations24hUsd != null && <div><dt>{t.liq}</dt><dd>{formatUsdShort(row.liquidations24hUsd)}</dd></div>}
              </dl>
            </dd>
          </div>
        ))}
      </dl>
      <p className="news-market-context__foot">
        <span>{t.source}</span>
        <a href={localizedHref(LIQUIDATIONS_PATH, { locale })} data-cta-kind="research" data-cta-placement="news-detail-market-context">{nav.liquidations}</a>
        <a href={localizedHref(FUNDING_RATES_PATH, { locale })} data-cta-kind="research" data-cta-placement="news-detail-market-context">{nav.funding}</a>
      </p>
    </aside>
  );
}

export default ArticleMarketContext;

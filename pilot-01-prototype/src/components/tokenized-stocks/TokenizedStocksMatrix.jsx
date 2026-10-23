import { StockLogo } from "./StockLogo.jsx";
// /tokenized-stocks hub, stock-by-stock sections (2026-10-22): the sortable stock table, the newest listings and the
// risks list. Numbers come from tsMatrix / tsNewestListings (exchanges' public market data + sourced facts); nothing is
// estimated. Live prices load after mount and expire independently of polling. SSR renders the default sort
// (most exchanges first); the browser only re-sorts, so the first client render matches the server HTML.
import React, { useMemo, useState } from "react";
import { fillTs } from "../../data/tokenized-stocks.js";
import { tsTickerPath } from "../../data/tokenized-stocks-routes.js";
import { tsLive } from "../../data/tokenized-stocks-rows.js";
import { sgtStamp, tsMatrix, tsNewestListings, tsSortMatrix } from "../../data/tokenized-stocks-matrix.js";
import { localizedHref } from "../../data/locale-routing.js";
import { listedTsPrices, sortTsPrices, tsPriceGroup, tsPriceGroups, tsPriceCompact, tsPriceNumber, tsPricePercent, tsPremiumByTicker, tsPriceStamp, tsPriceSummary, useTsPrices } from "./tokenized-prices-client.js";
import { tsPriceCopy } from "./tokenized-prices-copy.js";
import { BrandMark } from "../brand/BrandMark.jsx";

const hrefFor = (path, locale, market) => {
  const href = localizedHref(path, { locale });
  return market ? `${href}${href.includes("?") ? "&" : "?"}market=${encodeURIComponent(market)}` : href;
};
const pct = (n) => `${Number(n).toString()}%`;
// Fee sorts cheapest first, every other column largest / newest first.
const firstDir = (key) => (["fee", "price", "bestPrice"].includes(key) ? "asc" : "desc");

function SortHeader({ k, label, sort, onSort, mx }) {
  const active = sort.key === k;
  return (
    <th scope="col" className="is-num" aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => onSort(k)} aria-label={fillTs(mx.sort, { col: label })} data-active={active ? "" : undefined}>
        <span>{label}</span><span className="nxts-mx__arrow" aria-hidden="true">{active ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}</span>
      </button>
    </th>
  );
}

export function StockMatrix({ t, locale, market, live, venues }) {
  const mx = t.mx;
  const data = tsLive(live);
  const base = useMemo(() => tsMatrix({ locale, market, live: data }), [locale, market, data]);
  const [sort, setSort] = useState({ key: "venues", dir: "desc" });
  const prices = listedTsPrices(useTsPrices(), base, data);
  const pt = tsPriceCopy(locale);
  const groups = tsPriceGroups(prices);
  const [selectedGroup, setSelectedGroup] = useState("");
  const group = groups.includes(selectedGroup) ? selectedGroup : groups[0];
  const summaries = tsPriceSummary(prices, group);
  const premiums = tsPremiumByTicker(prices);
  for (const [ticker, summary] of summaries) summary.premiumRow = premiums.get(ticker) || null;
  const rows = sortTsPrices(tsSortMatrix(base, sort.key, sort.dir), summaries, sort.key, sort.dir);
  const priceStamp = tsPriceStamp(prices.filter((p) => tsPriceGroup(p) === group));
  const marketLabel = (g) => { const [lane, quote] = g.split(":"); return `${t.lanes[lane === "spot" ? "spot" : "perp"]} · ${quote}`; };
  const onSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: firstDir(key) }));
  const stamp = sgtStamp(data.generatedAt);
  const cols = [["venues", mx.venues], ["spot", mx.token], ["perp", mx.perp], ["lev", mx.lev], ["fee", mx.fee], ["weekend", mx.weekend], ["latest", mx.latest]];
  const priceCols = prices.length ? [["price", pt.price], ["change", pt.change], ["volume", pt.volume], ["premium", pt.premium], ["bestPrice", pt.bestPrice], ["bestVolume", pt.bestVolume]] : [];
  const names = Object.fromEntries(venues.map((ex) => [ex.slug, ex.name]));
  return (
    <section className="nxts-shell nxts-sec" id="stocks" aria-labelledby="ts-mx-h">
      <div className="nxts-sec__head">
        <h2 id="ts-mx-h">{mx.h}</h2>
        <p className="nxts-sec__lead">{mx.lead}</p>
        {stamp ? <p className="nxts-mx__stamp">{fillTs(mx.dataNote, { time: stamp })}</p> : null}
      </div>
      {prices.length ? <div className="nxts-prices-controls">
        <label>{pt.market}<select value={group} onChange={(event) => setSelectedGroup(event.target.value)}>{groups.map((g) => <option key={g} value={g}>{marketLabel(g)}</option>)}</select></label>
        <p className="nxts-mx__stamp">{pt.asOf} <bdi dir="ltr"><time>{priceStamp}</time></bdi></p>
        <p>{pt.note}</p>
      </div> : null}
      <div className="nxts-mx" role="region" aria-labelledby="ts-mx-h" tabIndex={0}>
        <table className="nxts-mx__t">
          <thead>
            <tr>
              <th scope="col" className="nxts-mx__stock">{mx.stock}</th>
              {priceCols.map(([k, label]) => <SortHeader key={k} k={k} label={label} sort={sort} onSort={onSort} mx={mx} />)}
              {cols.map(([k, label]) => <SortHeader key={k} k={k} label={label} sort={sort} onSort={onSort} mx={mx} />)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const summary = summaries.get(row.ticker);
              const price = summary?.price;
              const volume = summary?.volume;
              const listed = venues.filter((ex) => row.by[ex.slug]);
              return (
                <tr key={row.ticker}>
                  <th scope="row" className="nxts-mx__stock">
                    <a href={hrefFor(tsTickerPath(row.ticker), locale, market)}><StockLogo ticker={row.ticker} size={28} /><b translate="no">{row.ticker}</b><span>{t.names?.[row.ticker] || row.ticker}</span></a>
                  </th>
                  {prices.length ? <>
                    <td className="is-num"><b><bdi dir="ltr">{tsPriceNumber(price?.lastPrice)}{price ? ` ${price.quoteCurrency}` : ""}</bdi></b>{price ? <small>{names[price.venueId]} · <bdi dir="ltr">{price.instrument}</bdi></small> : null}</td>
                    <td className="is-num"><b><bdi dir="ltr">{tsPricePercent(price?.change24hPct)}</bdi></b></td>
                    <td className="is-num"><b><bdi dir="ltr">{tsPriceCompact(price?.quoteVolume24h)}</bdi></b>{price?.quoteVolume24h != null ? <small>{price.quoteCurrency}</small> : null}</td>
                    {(() => { const prem = price?.premiumPct != null ? price : premiums.get(row.ticker); return <td className="is-num"><b><bdi dir="ltr">{tsPricePercent(prem?.premiumPct)}</bdi></b>{prem?.premiumPct != null ? <small><bdi dir="ltr">{names[prem.venueId] || prem.venueId} · {tsPriceNumber(prem.indexPrice)} {prem.quoteCurrency}</bdi></small> : null}</td>; })()}
                    <td className="is-num">{price ? <><a href={`#ts-${price.venueId}`}>{names[price.venueId]}</a><small><bdi dir="ltr">{price.instrument}</bdi></small></> : "—"}</td>
                    <td className="is-num">{volume ? <><a href={`#ts-${volume.venueId}`}>{names[volume.venueId]}</a><small><bdi dir="ltr">{tsPriceCompact(volume.quoteVolume24h)} {volume.quoteCurrency}</bdi></small></> : "—"}</td>
                  </> : null}
                  <td className="is-num">
                    <b className="nxts-mx__n">{row.venues}</b>
                    <span className="nxts-mx__dots" aria-hidden="true">
                      {venues.map((ex) => {
                        const on = row.by[ex.slug];
                        return <i key={ex.slug} title={ex.name} data-lane={on ? (on.spot ? "spot" : "perp") : undefined} data-on={on ? "" : undefined} />;
                      })}
                    </span>
                    <span className="nxts-sr">{listed.map((ex) => ex.name).join(", ")}</span>
                  </td>
                  <td className="is-num">{row.spot ? <b>{row.spot}</b> : <span className="nxts-dash" aria-label={mx.none}>—</span>}</td>
                  <td className="is-num">{row.perp ? <b>{row.perp}</b> : <span className="nxts-dash" aria-label={mx.none}>—</span>}</td>
                  <td className="is-num">{row.maxLev ? <><b>{row.maxLev}x</b><small>{row.maxLevVenues.slice(0, 2).join(" · ")}</small></> : <span className="nxts-dash">—</span>}</td>
                  <td className="is-num">{row.minTaker != null ? <><b>{pct(row.minTaker)}</b><small>{row.minTakerVenues.slice(0, 2).join(" · ")}</small></> : <span className="nxts-dash">—</span>}</td>
                  <td className="is-num">{row.weekend ? <b>{row.weekend}</b> : <span className="nxts-dash">—</span>}</td>
                  <td className="is-num">{row.latest ? <><b>{row.latest.date}</b><small>{names[row.latest.slug] || row.latest.slug} · {t.lanes[row.latest.lane === "perp" && row.preipo ? "preipo" : row.latest.lane]}</small></> : <span className="nxts-dash">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="nxts-mx__legend" aria-hidden="true">
        <span><i data-lane="spot" data-on="" />{t.lanes.spot}</span>
        <span><i data-lane="perp" data-on="" />{t.lanes.perp}</span>
        <span><i />{mx.none}</span>
      </p>
    </section>
  );
}

export function NewestListings({ t, locale, market, live }) {
  const items = tsNewestListings({ locale, market, live: tsLive(live), limit: 8 });
  if (!items.length) return null;
  return (
    <section className="nxts-shell nxts-sec" aria-labelledby="ts-new-h">
      <div className="nxts-sec__head">
        <h2 id="ts-new-h">{t.mx.newH}</h2>
        <p className="nxts-sec__lead">{t.mx.newLead}</p>
      </div>
      <ol className="nxts-new">
        {items.map((item) => (
          <li key={`${item.ticker}-${item.slug}-${item.lane}`}>
            <time dateTime={item.date}>{item.date}</time>
            <a href={hrefFor(tsTickerPath(item.ticker), locale, market)} translate="no">{item.ticker}</a>
            <span className="nxts-new__ex"><BrandMark slug={item.slug} compact />{item.name}</span>
            <span className="nxts-cell__lane" data-lane={item.lane}>{t.lanes[item.lane]}</span>
            <code translate="no">{item.sym}</code>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function RiskList({ t }) {
  const r = t.risk;
  if (!r?.items?.length) return null;
  return (
    <section className="nxts-shell nxts-sec" id="risks" aria-labelledby="ts-risk-h">
      <div className="nxts-sec__head">
        <h2 id="ts-risk-h">{r.h}</h2>
        <p className="nxts-sec__lead">{r.lead}</p>
      </div>
      <ol className="nxts-risk">
        {r.items.map(([h, b], index) => (
          <li key={h}><span className="nxts-risk__n" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><h3>{h}</h3><p>{b}{index === 1 ? ` ${tsPriceCopy(t.locale).risk}` : ""}</p></li>
        ))}
      </ol>
    </section>
  );
}

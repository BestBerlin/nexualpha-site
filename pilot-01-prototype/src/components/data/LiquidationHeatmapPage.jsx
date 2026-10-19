import React, { useEffect, useRef, useState } from 'react';
import { localizedHref } from '../../data/locale-routing.js';
import { heatmapCopy } from '../../data/heatmap-copy.js';
// Neutral locales (ru/ar/zh-Hant/ur/uk) carry no partner offer.
import { heatmapPartnerHref, timelineRows } from '../../data/heatmap-view.js';
import { formatUsdCompact, formatUsdFull, formatUtc, readLiquidationCoverage } from '../../data/market-data-pages.js';
import { HeatmapCanvas } from './HeatmapCanvas.jsx';
import { useMarketEvents } from './useMarketEvents.js';
import { DataUnavailable, textDirection } from './DataPageFrame.jsx';
import { NewsVenueOffer } from '../v3/news/NewsVenueOffer.jsx';
import { startJsonPolling } from '../shared/json-polling.js';
import './heatmap.css';
import { NEUTRAL_CTA_LOCALES } from "../../data/locale-policy.js";

// This component accepts only collector buckets, never sums overlapping h24
// snapshots into a timeline. Absent timeline data remains unavailable.
export function LiquidationTimeline({ feed, locale = 'en', showSource = true }) {
 const c = heatmapCopy(locale);
 const [windowKey,setWindow] = useState('h24'), [symbol,setSymbol] = useState('ALL');
 const [detailFeed, setDetailFeed] = useState(null);
 const detailRequest = useRef(null);
 const detailController = useRef(null);
 const mounted = useRef(false);
 useEffect(() => {
  mounted.current = true;
  return () => { mounted.current = false; detailController.current?.abort(); };
 }, []);
 const loadDetails = () => {
  if (!feed?.liquidations?.timeline?.detailsDeferred || detailFeed) return Promise.resolve(true);
  if (detailRequest.current) return detailRequest.current;
  const controller = new AbortController();
  detailController.current = controller;
  const timer = setTimeout(() => controller.abort(), 12000);
  detailRequest.current = fetch('/intel/market-events.json', { cache: 'no-cache', signal: controller.signal })
   .then(response => { if (!response.ok) throw new Error('Market details unavailable'); return response.json(); })
   .then(next => {
    if (!mounted.current || !next?.liquidations?.timeline) return false;
    setDetailFeed(next);
    return true;
   })
   .catch(() => false) // Keep the selected aggregate view on failure; refocus retries.
   .finally(() => { clearTimeout(timer); detailRequest.current = null; });
  return detailRequest.current;
 };
 useEffect(() => {
  if (!detailFeed) return undefined;
  return startJsonPolling({ request: '/intel/market-events.json', intervalMs: 60000,
   immediate: false, cache: 'no-cache',
   isData: next => Boolean(next?.liquidations?.timeline), onData: setDetailFeed });
 }, [Boolean(detailFeed)]);
 const timeline = detailFeed?.liquidations?.timeline || feed?.liquidations?.timeline;
 const window = timeline?.[windowKey];
 const symbols = timeline?.symbols || [];
 const rows = timeline?.detailsDeferred && symbol !== 'ALL' ? [] : timelineRows(window,symbol);
 const largest = (symbol === 'ALL' ? (window?.largest || []) : (window?.largestBySymbol?.[symbol] || (window?.largest || []).filter(r=>r.symbol===symbol))).slice(0,10);
 const coverage = readLiquidationCoverage(window?.coverage, window?.largest || []);
 const longUsd = rows.reduce((a,r)=>a+r.longUsd,0), shortUsd = rows.reduce((a,r)=>a+r.shortUsd,0);
 return <section className="nxh-section v2-shell" data-testid="liquidation-timeline">
  <h2>{c.timeline}</h2>
  <div className="nxh-controls">
   <label>{c.timeline}<select value={windowKey} onFocus={loadDetails} onChange={async e=>{const value=e.target.value;if(await loadDetails()) setWindow(value);}}><option value="h24">24h · 5 min</option><option value="d7">7d · 1h</option></select></label>
   <label>{c.all}<select value={symbol} onFocus={loadDetails} onChange={async e=>{const value=e.target.value;if(await loadDetails()) setSymbol(value);}}><option value="ALL">{c.all}</option>{symbols.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
  </div>
  <p className="nxh-legend">{showSource ? `${coverage.label} · ` : ''}{c.lowerBound} · {c.longs} / {c.shorts} · USD · SGT</p>
  {rows.length ? <>
   <p className="nxh-summary">{c.longs}: <b>{formatUsdFull(longUsd)}</b> ({longUsd+shortUsd ? Math.round(longUsd/(longUsd+shortUsd)*100):0}%) · {c.shorts}: <b>{formatUsdFull(shortUsd)}</b></p>
   <HeatmapCanvas rows={rows} title={`${c.timeline} · USD / SGT`} longs={c.longs} shorts={c.shorts} />
   {timeline.coverage?.since ? <p className="nxd-muted">{c.updated}: {formatUtc(timeline.coverage.since)} → {formatUtc((detailFeed || feed).generatedAt)}</p>:null}
   <p className="nxd-muted">{c.gaps}: {window.unobservedBuckets} / {rows.length}</p><h3>{c.biggest}</h3>
   {largest.length ? <div className="nxh-scroll"><table className="nxd-table" dir="ltr"><thead><tr><th>{c.all}</th><th>{c.longs} / {c.shorts}</th><th>USD</th><th>SGT</th></tr></thead><tbody>{largest.map((r,i)=><tr key={`${r.at}-${r.symbol}-${i}`}><th scope="row">{r.symbol} <small>{r.venue}</small></th><td>{r.side==='short'?c.shorts:c.longs}</td><td>{formatUsdFull(r.usd)}</td><td>{formatUtc(r.at)}</td></tr>)}</tbody></table></div>:<p>—</p>}
  </>:<p role="status">{c.unavailable}</p>}
 </section>;
}

function useLevels(initialLevels) {
 const [levels,setLevels] = useState(initialLevels || null);
 useEffect(()=>{
  return startJsonPolling({
   request:'/api/liquidation-levels',
   intervalMs:60000,
   immediate:!initialLevels,
   cache:'no-store',
   isData:(next)=>Boolean(next),
   onData:setLevels,
   onError:()=>setLevels((current)=>current || null),
  });
 },[]);
 return levels;
}
export function LiquidationHeatmapPage({ locale='en', initialFeed, initialLevels }) {
 const c=heatmapCopy(locale), feed=useMarketEvents(initialFeed), levels=useLevels(initialLevels);
 const [symbol,setSymbol]=useState('BTC');
 const market=levels?.symbols?.find(r=>r.symbol===symbol);
 const rows=[...(market?.levels || [])].sort((a,b)=>a.price-b.price);
 return <main className="v6 v2-page v3-page nxd" dir={textDirection(locale)} data-testid="liquidation-heatmap-page">
  <header className="nxd-hero v2-shell"><nav className="nxd-crumbs"><a href={localizedHref('/liquidations',{locale})}>{c.timeline}</a></nav><h1>{c.title}</h1><p className="nxd-lead">{c.model}</p></header>
  <LiquidationTimeline feed={feed} locale={locale} />
  <section className="nxh-section v2-shell" data-testid="estimated-levels">
   <h2>{c.levels}</h2><div className="nxh-controls"><label>{c.levels}<select value={symbol} onChange={e=>setSymbol(e.target.value)}>{['BTC','ETH','SOL'].map(s=><option key={s}>{s}</option>)}</select></label></div>
   {rows.length ? <><p className="nxh-summary">{symbol} · {formatUsdFull(market.price)} · OI {formatUsdCompact(market.openInterestUsd)}</p><p className="nxd-muted">{c.updated}: {formatUtc(levels.generatedAt)} · {(market.exchanges || []).map(r=>r.venue).join(' + ')}</p><HeatmapCanvas rows={rows} kind="levels" marketPrice={market.price} title={`${c.levels} · USD`} longs={c.sideLong} shorts={c.sideShort} /><details><summary>{c.levels}</summary><div className="nxh-scroll"><table className="nxd-table" dir="ltr"><thead><tr><th>{c.levels} · USD</th><th>{c.longs} / {c.shorts}</th><th>USD</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td>{formatUsdFull(r.price)}</td><td>{r.side==='long'?c.sideLong:c.sideShort} · {r.leverage}×</td><td>{formatUsdCompact(r.usd)}</td></tr>)}</tbody></table></div></details></>:<DataUnavailable locale={locale} />}
  </section>
  <nav className="nxh-lessons v2-shell"><a href={localizedHref('/academy/what-leverage-does',{locale})}>{c.leverage}</a><a href={localizedHref('/academy/liquidation-mark-price',{locale})}>{c.liquidation}</a></nav>
  {NEUTRAL_CTA_LOCALES.has(locale) ? null : <div className="v2-shell"><NewsVenueOffer venues={['okx','bybit','binance']} locale={locale} articleSlug="liq-heatmap" placementPrefix="liq-heatmap" variant="inline" linkFor={slug=>heatmapPartnerHref(slug,locale)} /></div>}
 </main>;
}

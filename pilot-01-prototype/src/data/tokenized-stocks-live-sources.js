// Public market-data endpoints the tokenized-stocks live snapshot reads (scripts/build-tokenized-stocks-live.mjs) and the
// ticker / exchange pages cite next to every symbol, leverage and fee they print. No keys, read-only.
// Also the snapshot helpers the generator and the server share (pure, Node + browser safe).
import { TS_TICKERS_ALL } from "./tokenized-stocks-routes.js";
export const TS_LIVE_ENDPOINTS = Object.freeze({
  bitget: Object.freeze({ perp: "https://api.bitget.com/api/v2/mix/market/contracts?productType=USDT-FUTURES", spot: "https://api.bitget.com/api/v2/spot/public/symbols" }),
  okx: Object.freeze({ perp: "https://www.okx.com/api/v5/public/instruments?instType=SWAP", spot: "https://www.okx.com/api/v5/public/instruments?instType=SPOT" }),
  binance: Object.freeze({ perp: "https://fapi.binance.com/fapi/v1/exchangeInfo", spot: "https://api.binance.com/api/v3/exchangeInfo?permissions=SPOT" }),
  bybit: Object.freeze({ perp: "https://api.bybit.com/v5/market/instruments-info?category=linear&limit=1000", spot: "https://api.bybit.com/v5/market/instruments-info?category=spot" }),
  "gate-io": Object.freeze({ perp: "https://api.gateio.ws/api/v4/futures/usdt/contracts", spot: "https://api.gateio.ws/api/v4/spot/currency_pairs" }),
  mexc: Object.freeze({ perp: "https://contract.mexc.com/api/v1/contract/detail", spot: "https://api.mexc.com/api/v3/exchangeInfo" }),
  kraken: Object.freeze({ perp: "https://futures.kraken.com/derivatives/api/v3/instruments", spot: "https://api.kraken.com/0/public/AssetPairs?aclass_base=tokenized_asset" }),
});
export const TS_LIVE_VENUES = Object.freeze(Object.keys(TS_LIVE_ENDPOINTS));

// Stock-trading campaigns with official start/end times (Bybit's announcements API publishes both). The refresh job keeps
// the ones still running; pages drop each one at its end date by themselves (tsCampaigns), no edit needed.
export const TS_CAMPAIGN_ENDPOINTS = Object.freeze({ bybit: "https://api.bybit.com/v5/announcements/index?locale=en-US&type=latest_activities&limit=50" });
// English names used only to tie a campaign title ("Stock Buzz: Trade Tesla…") to the stock pages it is about.
export const TS_MATCH_NAMES = Object.freeze({
  NVDA: "Nvidia", TSLA: "Tesla", AAPL: "Apple", MSFT: "Microsoft", COIN: "Coinbase", MSTR: "Strategy|MicroStrategy", HOOD: "Robinhood",
  CRCL: "Circle", GOOGL: "Alphabet|Google", AMZN: "Amazon", SPY: "S&P 500", QQQ: "Nasdaq", META: "Meta", PLTR: "Palantir", AMD: "AMD",
  NFLX: "Netflix", AVGO: "Broadcom", TSM: "TSMC", MU: "Micron", INTC: "Intel", ORCL: "Oracle", ARM: "Arm Holdings", SNDK: "Sandisk",
  CRWV: "CoreWeave", BMNR: "BitMine", GME: "GameStop", BABA: "Alibaba", SPCX: "SpaceX", OPENAI: "OpenAI", ANTHROPIC: "Anthropic",
});
const STOCK_CAMPAIGN = /\b(?:stocks?|xStocks|TradFi|equit(?:y|ies)|pre-?IPO)\b/i;
/** Bybit announcements API -> [{ venue, title, url, startAt, endAt, tickers }] for stock campaigns that have not ended. */
export function parseBybitCampaigns(raw, now = Date.now()) {
  const out = [];
  for (const x of raw?.result?.list || []) {
    const title = String(x?.title || "").trim();
    const url = String(x?.url || "");
    const end = Number(x?.endDateTimestamp), start = Number(x?.startDateTimestamp);
    if (!title || !/^https:\/\/announcements\.bybit\.com\//.test(url) || !STOCK_CAMPAIGN.test(title) || !(end > now) || !(end > start)) continue;
    const tickers = Object.entries(TS_MATCH_NAMES).filter(([sym, names]) => new RegExp(`\\b(?:${sym}|${names.replace(/&/g, "\\&")})\\b`).test(title)).map(([sym]) => sym);
    out.push({ venue: "bybit", title: title.slice(0, 140), url, startAt: new Date(start).toISOString(), endAt: new Date(end).toISOString(), tickers: tickers.length ? tickers : null });
  }
  return out;
}

/** Compact table the pages render: only the page tickers, plus the per-venue stock counts. */
export function compactLive(snapshot, tickers = TS_TICKERS_ALL) {
  const rows = {};
  const counts = {};
  const checked = {};
  for (const venue of TS_LIVE_VENUES) {
    for (const lane of ["perp", "spot"]) {
      const data = snapshot.venues?.[venue]?.[lane];
      if (!data) continue;
      const items = data.items || {};
      counts[venue] = { ...(counts[venue] || {}), [lane]: Object.keys(items).length };
      if (data.checkedAt) checked[venue] = { ...(checked[venue] || {}), [lane]: data.checkedAt };
      for (const ticker of tickers) if (items[ticker]) (rows[ticker] ||= {})[`${venue}:${lane}`] = items[ticker];
    }
  }
  // Latest listing changes of the page tickers (newest first), for the "latest changes" lines on the pages.
  const events = (Array.isArray(snapshot.events) ? snapshot.events : []).filter((e) => tickers.includes(e.ticker))
    .slice(0, 40).map((e) => ({ type: e.type, venue: e.venue, lane: e.lane, ticker: e.ticker, sym: e.sym, observedAt: e.observedAt }));
  const at = Date.parse(snapshot.generatedAt);
  const campaigns = (Array.isArray(snapshot.campaigns) ? snapshot.campaigns : []).filter((c) => Date.parse(c.endAt) > at);
  return { generatedAt: snapshot.generatedAt, counts, checked, rows, events, campaigns };
}

export function isUsableLiveSnapshot(s) {
  if (!s || s.schema !== 1 || !Number.isFinite(Date.parse(s.generatedAt)) || !s.venues) return false;
  const total = Object.values(s.venues).reduce((n, lanes) => n + Object.values(lanes || {}).reduce((m, lane) => m + Object.keys(lane?.items || {}).length, 0), 0);
  return total >= 200;
}


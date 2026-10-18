# Tokenized stocks: live listings and refresh

`/tokenized-stocks/<ticker>` and `/tokenized-stocks/exchange/<venue>` print, for every exchange product, the symbol, the
maximum leverage and the standard maker/taker fee from the exchanges' own public market data, next to the sourced facts
(hours, dividends, in-app path, region exclusions) in `src/data/tokenized-stocks-facts.js`.

| Venue | Endpoints (no keys) | Stock instruments |
| --- | --- | --- |
| Bitget | `/api/v2/mix/market/contracts?productType=USDT-FUTURES`, `/api/v2/spot/public/symbols` | `isRwa=YES` perps (gold/oil/FX excluded); rTokens `R<T>USDT` whose stock also trades as a Bitget perp (lower bound: the exchange page prints Bitget's own rToken count) |
| OKX | `/api/v5/public/instruments` SWAP + SPOT | `instCategory=3`; xStocks `X<T>-USDT`; `ruleType=pre_market` = pre-IPO |
| Binance | `fapi/v1/exchangeInfo`, `api/v3/exchangeInfo` | `TRADIFI_PERPETUAL` with `EQUITY`/`PREMARKET`; bStocks `<T>B/USDT` |
| Bybit | `/v5/market/instruments-info` linear + spot | `symbolType` stock/ETF; spot `xstocks` |
| Gate | `/api/v4/futures/usdt/contracts`, `/api/v4/spot/currency_pairs` | `contract_type=stocks`; spot names ending "xStock" / "Ondo Tokenized" |
| MEXC | contract `/api/v1/contract/detail`, `/api/v3/exchangeInfo` | Stock zone (`mc-trade-zone-Stock`, ticker from `displayNameEn`); spot "xStock" / "(Ondo)" |
| Kraken | `/0/public/AssetPairs?aclass_base=tokenized_asset`, futures `/derivatives/api/v3/instruments` | xStocks `<T>x`; `PF_<T>XUSD` (max leverage = 1 / first initial margin) |

HTX, Backpack, Hyperliquid and CoinW keep their sourced fact rows.

## Commands

```sh
cd pilot-01-prototype
node scripts/build-tokenized-stocks-live.mjs            # fetch, write public/intel/tokenized-stocks.json + src/data/tokenized-stocks-live.generated.js
node scripts/build-tokenized-stocks-live.mjs --offline  # rebuild the module from the committed snapshot
```

A lane that fails (or returns implausibly few instruments) keeps its previous items, marked `stale`; nothing is written
when the whole snapshot has fewer than 200 stock instruments.

## Scheduled refresh (no redeploy)

Host cron (every 3 hours at :35): `/data/agent/srv/tokenized-stocks-refresh/run.sh` runs the generator in a throwaway
`node:20-bookworm-slim` container with `--json-only --out /data/private/nexualpha/intel/tokenized-stocks.json --events
/data/private/nexualpha/intel/tokenized-stocks-events.jsonl`. The web container reads it as
`TS_LIVE_FILE=/intel-state/tokenized-stocks.json` (`deploy/stage-remote.py`, at most every 5 minutes,
`server/tokenized-stocks-feed.mjs`) and serves it at `/intel/tokenized-stocks.json`.

Host layout: `run.sh` plus `app/scripts/build-tokenized-stocks-live.mjs` and `app/src/data/` copies of
`tokenized-stocks-live-sources.js`, `tokenized-stocks-routes.js`, `tokenized-stocks-labels.js`. Re-copy them after changing them.

How pages use it: when the runtime snapshot is newer than the table baked into the release, the Worker renders the page
with it (head, FAQ, Dataset JSON-LD and body) and ships the compact table as prerender state `tsLive`, so the browser
hydrates the same rows. The page set (30 tickers, 7 exchanges, sitemap) still comes from the release.

Listing changes: every run diffs the new snapshot against the previous one; each new or removed stock instrument is
appended to `tokenized-stocks-events.jsonl` and to the snapshot's rolling `events` log (60 days, newest first). Ticker pages
show the latest changes of their stock; the newsroom source `nexualpha-tokenized-stocks` reads the log from
`/intel/tokenized-stocks.json` and files each change as a listing or delisting event.

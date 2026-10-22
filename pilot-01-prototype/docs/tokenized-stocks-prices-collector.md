# Tokenized stocks price collection

`ops/tokenized-stocks-prices/collector.mjs` is a standalone, public, no-auth collector. It reads the existing listing
snapshot, intersects it with `TS_TICKERS_ALL` (32 current page tickers), requests bulk venue tickers, and atomically
replaces `tokenized-stocks-prices.json`. No listing, price, volume, fee, or reference is invented. Unmatched instruments
and invalid prices produce no row. Explicit `alt` token families in the directory may produce separate rows.

## Endpoints and metric semantics

| Venue | Public endpoints | Accepted metrics and limitations |
| --- | --- | --- |
| Bitget | `https://api.bitget.com/api/v3/market/tickers?category=SPOT` and `?category=USDT-FUTURES` | `lastPrice`, rolling `openPrice24h` for change, `turnover24h`, futures `indexPrice`, per-row `ts`. The current official docs redirect the former v2 documentation to v3. |
| Bybit | `https://api.bybit.com/v5/market/tickers?category=spot` and `?category=linear` | `lastPrice`, `price24hPcnt × 100`, `turnover24h`, linear `indexPrice`, envelope `time`. Spot `usdIndexPrice` is account collateral valuation, so it is deliberately unused as an equity reference. |
| OKX | `https://www.okx.com/api/v5/market/tickers?instType=SPOT`, `?instType=SWAP`; `https://www.okx.com/api/v5/market/index-tickers?quoteCcy=USDT` | `last`, rolling `open24h`, spot `volCcy24h`, per-row `ts`. Swap `volCcy24h` is base quantity, so quote turnover is `null`. A fresh matching index ticker supplies `idxPx`; its clock is independent. |
| Binance | `https://api.binance.com/api/v3/ticker/24hr`; `https://fapi.binance.com/fapi/v1/ticker/24hr`; `https://fapi.binance.com/fapi/v1/premiumIndex` | `lastPrice`, rolling `openPrice`, `quoteVolume`, `closeTime`; a fresh matching premium-index response supplies `indexPrice` with its own `time`. Bulk futures ticker request weight is 40, premium index 10. |
| Gate | `https://api.gateio.ws/api/v4/spot/tickers`; `https://api.gateio.ws/api/v4/futures/usdt/tickers` | `last`, `change_percentage` in percentage points, `quote_volume` (spot) / `volume_24h_quote` (perpetual), futures `index_price`. No ticker generation timestamp is documented: rows are explicitly `timestampBasis: "observed"`. |
| MEXC | `https://api.mexc.com/api/v3/ticker/24hr`; `https://api.mexc.com/api/v1/contract/ticker` | Spot: `lastPrice`, change derived from rolling `openPrice`, `quoteVolume`, `closeTime`. Futures: `lastPrice`, `riseFallRate × 100`, `amount24`, `indexPrice`, `timestamp`. No base-volume × last-price turnover approximation. |
| Kraken | `https://api.kraken.com/0/public/AssetPairs?aclass_base=tokenized_asset`; `https://api.kraken.com/0/public/Ticker?asset_class=tokenized_asset`; `https://futures.kraken.com/derivatives/api/v3/tickers` | Spot identities require a fresh tokenized pair with the exact directory base and USD quote. Spot last is `c[0]`; `o` is midnight UTC, not rolling 24h open, so change is `null`; exact quote volume is unavailable, so volume is `null`. Spot observation time is explicit. Futures: `last`, rolling `open24h`, `volumeQuote`, `indexPrice`, last-trade `lastTime` (old trades are dropped), source `serverTime`. |

Official contracts reviewed on 2026-10-23:

- [Bitget public market data](https://www.bitget.com/docs/catalog/market/market-data)
- [Bybit tickers](https://bybit-exchange.github.io/docs/v5/market/tickers)
- [OKX tickers and index tickers](https://app.okx.com/docs-v5/en/)
- [Binance futures market data](https://developers.binance.com/en/docs/catalog/core-trading-derivatives-trading-usd-s-m-futures/api/rest-api/market-data)
- [Gate spot tickers](https://www.gate.com/docs/developers/apiv4/en/spot/) and [perpetual tickers](https://www.gate.com/docs/developers/apiv4/en/futures/)
- [MEXC spot ticker](https://mexcdevelop.github.io/apidocs/spot_v3_en/#24hr-ticker-price-change-statistics), [futures ticker](https://www.mexc.io/api-docs/futures/market-endpoints/get-ticker-contract-market-data), [current futures base URL](https://www.mexc.io/api-docs/futures/integration-guide)
- [Kraken spot ticker](https://docs.kraken.com/api-reference/market-data/get-ticker-information), [pair identities](https://docs.kraken.com/api-reference/market-data/get-tradable-asset-pairs), [futures ticker](https://docs.kraken.com/api-reference/market-data/get-tickers)

## Freshness and failure behavior

The top-level `updatedAt` is the collection completion time. Every source records its endpoint, `checkedAt`,
`updatedAt`, `status` (`ok` / `error`), timestamp basis, and any bounded error. Every price row records its exact
directory `instrument`, raw `exchangeInstrument`, ticker, venue, market type (`spot` / `perpetual`), quote currency,
metrics, `sourceId`, and `updatedAt`.

Exchange clocks take precedence over response observation time. Rows and sources at least 15 minutes old are omitted
from usable prices; future clocks more than 60 seconds ahead are rejected. For endpoints without a documented ticker
clock, `timestampBasis: "observed"` means the time a public snapshot was received, **not the verified last-trade time**.
If collection fails, the previous file's rows are never refreshed or carried over. Empty files remain valid JSON and
contain source failure evidence; the CLI exits 2 so the scheduler can alert.

Rows have `null` for absent/invalid optional metrics; zero volume remains zero. Numbers are fully parsed, finite and
unit-aware. Price and index must be positive; negative turnover and impossible changes of −100% or below are unknown.
`premiumPct = (lastPrice / indexPrice - 1) × 100` uses only a fresh **venue-published index**. This is not verified equity
NAV, a broker execution price, or an assurance of redeemability. Separate index requests carry `indexSourceId` and
`indexUpdatedAt`; a failed/stale reference hides the premium while keeping the valid price.

NYSE market hours matter: venue indexes and stock tokens/perpetuals can continue trading while the underlying cash
market is closed; premiums may widen and references may update differently. USD and USDT are distinct quote units;
spot tokens and perpetual contracts are different products. Compare only like units and products.

## Server and UI integration

The Node web server reads only `TS_PRICES_FILE`; it never calls exchanges itself and has no baked price fallback.
`GET /api/tokenized-stocks/prices` returns `{ updatedAt, sources, rows, unavailable }` with `Cache-Control: no-store`;
`HEAD` has the same headers without a body, and other methods return 405. File reads coalesce and cache for at most
60 seconds. Feed, source, row and separate index clocks are rechecked on every response, including cache hits.
Missing, malformed or unreadable files return an empty unavailable feed. An expired separate index removes only
the reference and premium, not an otherwise fresh ticker price.

The hub adds live sortable columns only after fresh data arrives. Its selector keeps spot/perpetual and quote
currencies separate; the displayed change, volume and premium belong to the lowest-last-price instrument, while
the highest-volume venue is selected independently within that same market/quote group. Both winners are last-trade
comparisons, not executable offers. The home strip chooses a labelled available market/quote per ticker, preferring
spot and USDT, entirely behind the existing lazy boundary. Both clients enforce the allowed regional listing
universe, refresh every minute, and expire retained rows even if refresh fails. Missing data hides live columns.

Requests run sequentially with a minimum 500 ms gap, bounded 12-second header/body reads, and no automatic retries.
HTTP 418/429 backs off other requests to the same host for at least 60 seconds (or the longer `Retry-After` value)
within that run. Schedule without overlapping processes and respect longer rate-limit responses operationally.

## Tests and actual probe coverage

`tests/fixtures/tokenized-stocks-prices/documentation-examples.json` records selected fields from official response
examples with provenance URLs and any array wrapping documented. These are historical documentation examples, mostly
BTC, **not recorded live stock quotes**. Stock identity and failure cases in the unit tests are explicitly synthetic.
The test suite performs no network requests.

```sh
node --check ops/tokenized-stocks-prices/collector.mjs
node --test pilot-01-prototype/tests/tokenized-stocks-prices-collector.test.mjs
```

The actual full collector probe in this sandbox used:

```sh
node ops/tokenized-stocks-prices/collector.mjs \
  --listings pilot-01-prototype/public/intel/tokenized-stocks.json \
  --out ops/tokenized-stocks-prices/probe-output.json
```

At `2026-10-22T19:50:49.781Z`, it exited **2**, wrote a valid empty feed atomically, and reported **17/17 source fetches
failed**, **0 live ticker × venue pairs across all seven venues**. The independent command
`curl -sS --max-time 15 'https://api.bybit.com/v5/market/tickers?category=spot'` failed with
`curl: (6) Could not resolve host: api.bybit.com`. Web-tool probes to public ticker URLs at Bybit, Bitget, OKX, Gate,
Kraken (spot/futures), MEXC and Binance were also inaccessible. Official documentation was accessible. Therefore no
venue endpoint has verified live price coverage from this environment, and no runtime feed is committed. The recovery
condition is a first run from the lead's network-enabled production lane with nonzero rows and source-by-source
coverage inspected. The temporary empty probe file is removed after verification.

## Production run for the lead (not deployed or scheduled here)

Stage the repository tree (or preserve these relative paths: collector, `ops/market-collector/resilience.mjs`,
`pilot-01-prototype/src/data/tokenized-stocks-routes.js`, and its `tokenized-stocks-labels.js` dependency). Use Node 22+
and a directory writable by the collector user. Example intended host invocation after staging the app:

```sh
cd /data/agent/srv/tokenized-stocks-prices/app
node ops/tokenized-stocks-prices/collector.mjs \
  --listings /data/private/nexualpha/intel/tokenized-stocks.json \
  --out /data/private/nexualpha/intel/tokenized-stocks-prices.json
```

Suggested cadence is every five minutes with `flock -n /run/lock/nexualpha-ts-prices.lock` around that exact invocation;
route logs into the existing host scheduler/monitoring lane. The host's existing intel-state mount can expose the file
to the web process as `TS_PRICES_FILE=/intel-state/tokenized-stocks-prices.json`. The lead must verify that mount and
server environment, inspect emitted coverage and references, and then enable scheduling. This document is a runbook,
not evidence of installation, scheduling or production reachability.

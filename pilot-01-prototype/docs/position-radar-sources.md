# Position and transfer radar sources

Reviewed 2026-10-13. This is a local implementation; no deployment or continuous feed coverage is asserted.

## Public access and terms

- Binance USDT-M public futures data: https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Long-Short-Ratio and adjacent top-position/OI endpoints. Binance geography restrictions and rate limits can make a source unavailable.
- OKX Rubik public statistics: https://www.okx.com/docs-v5/en/#trading-statistics-rest-api. Rubik is currency-level aggregate statistics, not an instrument-matched USDT perpetual position book. Display venue rows separately.
- Bybit account-ratio and OI: https://bybit-exchange.github.io/docs/v5/market/long-short-ratio and https://bybit-exchange.github.io/docs/v5/market/open-interest. Linear OI is denominated in the base coin; a buy-account fraction is divided by the sell-account fraction.
- BTC: https://mempool.space/docs/api/rest. Public hosted access is rate-limited; recent mempool transactions are an incomplete sample. Read transaction details, not total output value as a transfer. Outputs may be change/self-transfers. Unconfirmed transaction time remains unknown; cache update time is not transaction time.
- Ethereum: https://ethereum.publicnode.com/ advertises the keyless public RPC https://ethereum-rpc.publicnode.com/. Terms reviewed: https://www.publicnode.com/terms (section B grants an RPC access license, also contains broad service-content redistribution and data-extraction restrictions). This implementation uses the explicitly provided RPC interface for bounded read-only blockchain queries; it does not scrape the website or resell RPC access. Unrestricted commercial redistribution rights are not established. Confirm the intended public display with the provider before production promotion, or replace the injectable source with an authorized RPC. No availability guarantee is inferred. Blockchair and Ethplorer were considered but are not enabled because keyless public application access terms were not established.
- Labels: exact exchange addresses live in `server/exchange-address-labels.mjs`, one official source URL per address (exchanges' own published proof-of-reserves wallet lists; Etherscan name tags only as corroboration of an official list). Refresh from those sources; do not add heuristics. Unknown-to-unknown direction remains unknown.

## Coverage and interpretation

The board selects 30 Binance USDT symbols by 24-hour turnover (falling back to Bybit linear USDT turnover if Binance is unavailable) and requests each venue's public statistics. Missing fields remain null. Top-trader position L/S is Binance-specific; OKX/Bybit do not supply that metric through the selected endpoints. A 24h OI change requires timestamp coverage spanning 24h. OI values are never averaged across venues.

Whale thresholds: BTC output >=50 BTC; native ETH >=250 ETH; USDT/USDC >=1 million tokens on Ethereum mainnet. Stablecoin amounts are face units, not live USD valuations. Ethereum scanning is incremental: a cold start reads 10 full blocks for native ETH, 50 blocks of all USDT/USDC Transfer logs, and 300 blocks of Transfer logs topic-filtered to labelled exchange addresses (cheap server-side filter); later refreshes only read blocks after the stored cursor (catch-up capped at 50 blocks). Qualifying rows are kept in a rolling 3-hour window (first-seen time), deduplicated by log/output id, and the feed returns at most 60 rows. Receipt status must succeed for native ETH; two-block depth is not finality. BTC detail lookups are capped at ten candidates. Repeated visitors reuse a single-flight cache capped at 60s; source failure is explicit. The UI keeps these notes in a collapsed "How this works" block at the bottom of the page.

Transfers into an exchange are address movement, not proof of a sale. The UI never guesses identities or trade intent.

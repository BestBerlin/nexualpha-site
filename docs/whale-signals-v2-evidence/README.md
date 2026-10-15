# Whale v2 read-only evidence

The harness calls public endpoints and writes only local evidence. It sends no Telegram messages and does not deploy or restart a service. Run from the repository root:

```sh
node docs/whale-signals-v2-evidence/run-dry.mjs
```

The window lasts at least 600,000 ms, with eleven requested collector cycles (start plus ten minute boundaries). Requests can finish after their boundary; there is never more than one collector cycle at a time. Raw snapshots and history are ignored; `summary.json` is the compact review artifact. It distinguishes intent signals from transfer and position facts and does not relabel five rows as five accumulation signals.

## Source and inference boundaries

- Base public RPC reads a bounded 100-block Transfer window for AERO, WELL and VIRTUAL. A window exceeding 1,000 logs is retried once at 25 blocks; a still oversized response fails closed. The returned block bounds disclose the actual sample. At most three recipients per token receive balanceOf calls at the block before the window and at its end. A zero-to-positive balance is a **new holder of that token in the sampled window**, not a fresh wallet, total holder growth, whale identity, purchase or accumulation. Where available, prior nonce/native-balance/code are recorded as bounded freshness context with `freshWalletVerified:false`.
- Finality is bounded by a two-block lag, not guaranteed finality; reorg-removed logs are rejected. Contract address, Transfer topic, indexed-address length, 32-byte amount, transaction hash, log index and block range are checked. Mints/burns/self-transfers are not promoted as whale transfer rows.
- DEX Screener supplies the deepest returned base-token pair's current price/liquidity and aggregate hourly buy/sell counts. Aggregates are context only. They cannot prove whale buys or a DEX buy streak. For a returned Uniswap V2 pair only, at most two candidate receipts are checked: successful receipt, exact Swap event, token0 orientation, and matching same-receipt token Transfer from pool to swap recipient must agree. Confirmed outputs remain `dexBuys` observations; recipients can be routers and do not establish whale identities or streaks. Unsupported pool types emit no buy records. Transfer USD is a current reference estimate, not transaction-time execution value. Unknown prices produce no USD-qualified transfer row.
- Existing ETH/ERC20 exchange classifications use the repository's existing validated catalog. The local `.gemini-whale-addresses` files were inspected: their ETH/SOL/BSC/BTC/TRON labels must not be reused on Base. There are no Base entries. No new Base exchange label is asserted.
- Full SOL holder growth, verified fresh-wallet withdrawal streaks, and confirmed wallet-level DEX buy streaks are not available from this adapter. A Solana largest-accounts response would cover token accounts, not all holders; nonce zero alone would not prove wallet freshness. These remain explicit coverage gaps rather than fabricated signals.
- Confidence is an evidence-strength heuristic, not a calibrated probability. Missing fills/days/liquidity/wallets remain null. Real active-day counts take precedence over elapsed spans. Transaction/log dedupe preserves separate token events; Solana addresses retain case.

Official contracts checked 2026-10-15:

- [Ethereum JSON-RPC](https://ethereum.org/developers/docs/apis/json-rpc/): `eth_getLogs`, `eth_blockNumber`, historical `eth_call`, hex quantities and block parameters.
- [ERC-20](https://eips.ethereum.org/EIPS/eip-20): Transfer indexed addresses, balanceOf, optional decimals.
- [DEX Screener API](https://docs.dexscreener.com/api/reference): `/token-pairs/v1/{chainId}/{tokenAddress}`, pair base token, price, liquidity and aggregate transactions. Three sequential watchlist reads per cycle are below the published API request budgets; no keys are required.
- [Blockscout REST](https://docs.blockscout.com/devs/apis/rest): current documentation points to PRO; per-instance access is not assumed free. A direct Base endpoint TLS probe failed in this environment, so it is not used by the collector.

- [Uniswap V2 Pair reference](https://github.com/Uniswap/v2-core/blob/master/contracts/interfaces/IUniswapV2Pair.sol): Swap event output amounts, indexed recipient and token0.

## Completed live window

2026-10-15 04:14:48.883Z–04:25:04.596Z: **615,713 ms**, eleven completed cycles. The compact `summary.json` contains five distinct real Hyperliquid fill-derived signals and eight distinct transfer facts. The five signal records below were retrieved/backfilled during the window; their underlying executions occurred earlier, as the event timestamps disclose. They are not five new trades executed within ten minutes.

| Coin | Observed signal | Fills | Net reference USD | Last event UTC |
| --- | --- | ---: | ---: | --- |
| XRP | Reduce short | 447 | 2,208,215.66 | 2026-10-14 17:28:31.892 |
| ETH | Reduce short | 110 | 1,223,213.73 | 2026-10-15 02:22:15.236 |
| BTC | Increase short | 335 | 1,511,415.78 | 2026-10-15 02:12:51.262 |
| HYPE | Accumulation | 14 | 5,500,108.57 | 2026-10-14 18:06:38.141 |
| HYPE | Reduce short | 127 | 3,136,299.93 | 2026-10-15 03:39:37.435 |

Wallet addresses, source labels, confidence factors, explorer links, event times, observed cycle times and source-status samples are preserved in `summary.json`. Base AERO/WELL/VIRTUAL logs were genuinely read; no verified small-cap whale accumulation or confirmed V2 output was observed. Historical balance requests that failed remain unknown. The dry run therefore verifies source plumbing and existing fill signals, while the new small-cap intent coverage remains limited.

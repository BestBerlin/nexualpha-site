# Sources

Accessed: 2026-10-12T08:54:03Z

- upbit-notice-6651: Upbit, "리저브라이트(RSR) KRW, USDT 마켓 디지털 자산 추가 (Upbit notice 6651, via api-manager.upbit.com/api/v1/announcements/6651)", https://upbit.com/service_center/notice?id=6651, primary=true
- upbit-ticker: Upbit, "Upbit public ticker and hourly candles for KRW-RSR and KRW-USDT", https://api.upbit.com/v1/ticker?markets=KRW-RSR,USDT-RSR,KRW-USDT, primary=true
- binance-rsr: Binance, "Binance RSRUSDT premium index, funding history, fundingInfo, open interest history, long/short account ratio, 24h tickers and 1h klines (spot and USDT-M)", https://fapi.binance.com/fapi/v1/premiumIndex?symbol=RSRUSDT, primary=true
- okx-rsr: OKX, "OKX RSR-USDT-SWAP funding rate and history; RSR-USDT spot ticker", https://www.okx.com/api/v5/public/funding-rate?instId=RSR-USDT-SWAP, primary=true
- hyperliquid-rsr: Hyperliquid, "Hyperliquid metaAndAssetCtxs (RSR perpetual)", https://api.hyperliquid.xyz/info, primary=true
- nexualpha-market-events: NexuAlpha, "NexuAlpha market events feed (movers, funding)", https://nexualpha.com/intel/market-events.json, primary=true
- nexualpha-partners: NexuAlpha, "Partner feed: invite codes, rebate shares and settlement cadence", https://nexualpha.com/intel/partners.json, primary=false

## Claim map

- c1: Upbit announced RSR KRW and USDT markets at 13:54 KST (04:54 UTC) on 12 October 2026 with trading from 14:05 KST. Sources: upbit-notice-6651
- c2: RSR rose about 46-47% in 24 hours on Binance; spot high $0.002999, $0.00236 at 08:48 UTC. Sources: binance-rsr, nexualpha-market-events
- c3: Binance RSR perpetual funding settled at -1.96% at 08:00 UTC against a -2% floor; OKX settled at its -1% floor. Sources: binance-rsr, okx-rsr
- c4: Binance RSR open interest rose about 4.4x in coins between 00:00 and 08:48 UTC (our arithmetic). Sources: binance-rsr
- c5: Upbit KRW-RSR peaked at 4.98 won, about $0.0037 at 1,347 won per USDT (our arithmetic), and traded about 1.6% above Binance at 08:48 UTC. Sources: upbit-ticker, binance-rsr
- c6: Hyperliquid lists RSR with 3x max leverage and -0.1254% hourly funding. Sources: hyperliquid-rsr
- c7: OKX code nexu888 returns 40% of fees hourly; Hyperliquid code NEXU888; Bybit code 48553. Sources: nexualpha-partners

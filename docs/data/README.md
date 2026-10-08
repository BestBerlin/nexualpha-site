# exchange-facts-20261008

Method: each figure was taken from the exchange's own official fee/help page via WebFetch on 2026-10-08. Anything not stated on the fetched page is null; no estimates. Units are percent.

Status: verified (at least some figures confirmed), unverifiable (official page returned no fee table or 404).

Caveats:
- Several fee pages are JS-rendered and returned no tables (OKX, Bitget, Coinbase): left null, need manual/browser check.
- Binance perp base rate unconfirmed; Bybit perp row not labeled USDT; Kraken spot 0.40/0.80 looks high, re-check.
- KYC and restricted regions were not stated on fetched pages: null/empty, not "none".
- Page text was summarized by a fetch model; spot-check before publishing.
- Gate, MEXC, KuCoin not covered. No referral codes/links included.

CHANGELOG
- 2026-10-08 (2): Browser-pane + official support articles. Now verified: OKX (spot 0.08/0.10, perp 0.02/0.05), Bitget (0.1/0.1, 0.02/0.06; support FAQ), Gate (0.1/0.1, 0.02/0.05). Added gate, mexc, kucoin, htx rows. Still unverifiable: Coinbase (login-gated), MEXC (per-pair ranges only; spot maker 0), KuCoin (VIP0 rows hidden), HTX (pages did not load), Binance perp (bot-blocked).

# Tokenized stocks prices collector

Run once with Node 22+; it needs no packages, API keys, account, or background Mac service:

```sh
node ops/tokenized-stocks-prices/collector.mjs \
  --listings pilot-01-prototype/public/intel/tokenized-stocks.json \
  --out /path/to/tokenized-stocks-prices.json
```

`--listings` defaults to `TS_LIVE_FILE`, then the repository's committed listing snapshot. `--out` defaults to
`TS_PRICES_FILE`, then `/var/lib/nexualpha-market/tokenized-stocks-prices.json`. A successful write with at least one
accepted quote exits 0; an atomically written empty, fail-closed feed exits 2; invalid input or a write error exits 1.
Failed sources never retain prior prices. Run one process at a time.

The collector joins public bulk tickers against exact instrument identities in the supplied directory and the existing
32-page ticker roster; it never adds listings. API identifiers are preserved separately as `exchangeInstrument`, while
`instrument` retains the directory's exact display symbol. Rows carry `marketType` and `quoteCurrency`; comparisons must
keep spot/perpetual and USD/USDT separate. Missing metrics are `null`.

Full endpoint, timestamp, fixture, probe, and proposed production scheduling details:
[`tokenized-stocks-prices-collector.md`](../../pilot-01-prototype/docs/tokenized-stocks-prices-collector.md).

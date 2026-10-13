# Funding coverage recordings

`recorded-responses.json` contains public API responses recorded on 2026-10-13,
keyed by request URL. Bulk arrays are projected to matrix symbols; Binance,
Bybit and Gate rows retain collector-consumed fields. MEXC detail
retains symbol, baseCoin, quoteCoin, displayName, contractSize and state. Rates,
intervals and settlement timestamps are retained as returned, not synthesized.
Binance premium index and funding info were read via curl on BaoTa because the
Mac egress received Binance error -1003 (IP ban). Other captures used Mac curl.
These fixtures prove parser coverage, not current production availability.

MEXC contract metadata identifies PEPE_USDT, SHIB_USDT, FLOKI_USDT and SATS_USDT
as their underlying assets, and 1000BONK_USDT as an exact contract. Funding is a
notional ratio: neither the matrix's 1000 prefix nor contractSize multiplies it.
See [MEXC official contract API](https://mexcdevelop.github.io/apidocs/contract_v1_en/#get-the-contract-information).
Bitget's recorded bulk current-fund-rate response (no symbol parameter) includes
fundingRateInterval and nextUpdate, avoiding per-symbol request deadlines.

HTX Mac probes used:

```sh
for host in api.hbdm.com api.hbdm.vn api.huobi.pro; do
  curl -L --max-time 5 -sS -w "${host} HTTP %{http_code}\n" \
    "https://${host}/linear-swap-api/v1/swap_batch_funding_rate" \
    -o "/tmp/funding-${host}.json"
done
```

- api.hbdm.com: connection timeout, HTTP 000.
- api.hbdm.vn: HTTP 200, status ok; recorded matrix rows all have
  next_funding_time=null. The funding interval cannot be derived safely.
- api.huobi.pro: HTTP 404.

Try api.hbdm.vn first at runtime, then the other hosts with bounded timeouts.
Missing interval metadata remains unavailable; do not assume every HTX contract
settles every eight hours. Zero-coverage venues get one status notice and no
repeated empty table column. Their absent quotes never enter spread calculations.
The reader retains lastSuccessAt across failed refreshes, without carrying old
quotes into a newly generated snapshot. This history resets on process restart.

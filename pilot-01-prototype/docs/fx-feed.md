# FX feed for converter pages

`/intel/fx.json` is served by the Node runtime, not generated at build time. It fetches the free open endpoint at
`https://open.er-api.com/v6/latest/USD`, validates that every converter fiat is present, and returns a USD-based snapshot:

```json
{
  "generatedAt": "2026-10-13T08:00:00.000Z",
  "base": "USD",
  "rates": { "USD": 1, "EUR": 0.86, "BRL": 5.44 },
  "source": "Rates By Exchange Rate API",
  "sourceUrl": "https://open.er-api.com/v6/latest/USD"
}
```

The full rate map is limited to the converter fiat set: `USD`, `EUR`, `BRL`, `TRY`, `IDR`, `VND`, `MXN`, `JPY`, `KRW`,
`CNY`, `GBP`, `INR`. If the source omits any of those currencies, the refresh fails and the server keeps the last good
snapshot only inside the stale window.

The endpoint uses ExchangeRate-API because the open feed is USD-based and includes VND, which the ECB reference-rate XML
does not cover. The provider documents that the open endpoint needs no API key, updates once per day, permits caching, and
requires attribution on pages using the rates. Visible attribution should use `Rates By Exchange Rate API` linked to
`https://www.exchangerate-api.com`.

## Runtime behavior

- Default source: `FX_SOURCE_URL=https://open.er-api.com/v6/latest/USD`.
- Default refresh: once every 24 hours. Override with `FX_REFRESH_MS`.
- Disable automatic refresh with `FX_REFRESH=off`.
- Force refresh even when tests pass a supplied Worker with `FX_REFRESH=on`.
- Successful response: `200`, `base: "USD"`, `rates.USD: 1`, all 12 converter fiats present. Source timestamps older
  than seven days, more than five minutes in the future, or older than the snapshot already in memory are rejected.
- Failed refresh with a recent previous snapshot: still `200`, but `status: "stale"`, `freshness: "stale"`, and `lastError`
  are included.
- Failed refresh with no usable snapshot, or a snapshot beyond the stale window: `503` with `rates: null`.

`server.mjs` serves `/intel/fx.json` before the Worker and passes `FX_SNAPSHOT_READ` into the Worker environment so SSR can
reuse the exact same validated snapshot. `server/local-sites-preview.mjs` uses the same route for local Sites preview.

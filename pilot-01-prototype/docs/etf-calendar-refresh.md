# Crypto calendar and spot ETF flows: data and refresh

`/calendar` (all locale prefixes; indexable in en, zh-Hans, es, pt-BR, tr, vi, id, ja, ko) and `/calendar.ics` render
at request time from `/intel/calendar.json`, which a host job rewrites every 6 hours (no redeploy).

## Sources (each event links the one it came from)

| Events | Source | Access |
| --- | --- | --- |
| FOMC decisions (2:00 pm ET) | federalreserve.gov FOMC calendar page | fetched each run |
| GDP, PCE (Personal Income and Outlays) | BEA iCalendar subscription | fetched each run |
| CPI, Employment Situation (8:30 am ET) | BLS release schedule | bls.gov refuses automated requests: dates in `BLS_SCHEDULE` (`scripts/intel-tools/macro-schedule.mjs`); add 2027 when BLS publishes it |
| Token unlocks | each project's own tokenomics docs | `scripts/intel-tools/token-unlock-schedules.json` (official source required); USD value from the OKX public ticker, under $5M left out |
| Exchange listings/delistings | our official-announcement feed | only titles that name a date ("on Oct 12, 2026", "on 2026-10-08") |
| Campaign deadlines | `/content/campaign-briefs.json` | deadline from the official rules we summarised |

Not used (terms forbid automated collection or republishing): DefiLlama (incl. its emissions data), Tokenomist,
FRED pages (personal, non-commercial use).

## Spot ETF flows (`/etf-flows`): built, not live

The page, reader (`src/data/etf-flows.js`), Dataset schema and runtime reader (`ETF_FLOWS_FILE`) are in place, but
`ETF_FLOWS_LIVE` (`src/data/intel-tools-routes.js`) is `false`: the page is noindex, out of the sitemap and unlinked.
Checked 2026-10-13: BlackRock/iShares and Bitwise (Network Firm) terms forbid robots/scraping, 21Shares (ARKB) forbids
scraping and data mining, Fidelity, Grayscale, WisdomTree, VanEck, Farside and SoSoValue block automated requests.
To go live: get a licensed feed (or written issuer permission), write `etf-flows.json` in the `nexualpha.etf-flows.v1`
shape (see the header of `src/data/etf-flows.js`), add `run.sh etf`, then set `ETF_FLOWS_LIVE = true`.

## Commands and host job

```sh
cd pilot-01-prototype && node scripts/intel-tools/collect-calendar.mjs   # writes public/intel/calendar.json
```

Host: `/data/agent/srv/intel-tools/run.sh calendar` (cron `40 */6 * * *`, CST) runs the collector in
`node:20-bookworm-slim` against `app/` (same relative paths as the repo: `app/scripts/intel-tools/*`,
`app/src/data/{crypto-calendar,activity-update-path}.js`); output `/data/private/nexualpha/intel/calendar.json`
(`calendar.json.prev` kept), log `/data/agent/srv/intel-tools/refresh.log`. A failing source keeps its previous events
(`status` in the snapshot); the file is replaced only by a usable snapshot. Re-copy `app/` after changing those files.

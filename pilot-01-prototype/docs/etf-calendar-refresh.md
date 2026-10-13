# Crypto calendar and spot ETF flows: data and refresh

`/calendar` (all locale prefixes; indexable in en, zh-Hans, es, pt-BR, tr, vi, id, ja, ko) and `/calendar.ics` render
at request time from `/intel/calendar.json`, which a host job rewrites every 6 hours (no redeploy).

## Sources (each event links the one it came from)

| Events | Source | Access |
| --- | --- | --- |
| FOMC decisions (2:00 pm ET) | federalreserve.gov FOMC calendar page | fetched each run |
| GDP, PCE (Personal Income and Outlays) | BEA iCalendar subscription | fetched each run |
| CPI, Employment Situation (8:30 am ET) | BLS release schedule | bls.gov refuses automated requests: dates in `BLS_SCHEDULE` (`scripts/intel-tools/macro-schedule.mjs`); add 2027 when BLS publishes it |
| Exchange listings/delistings | our official-announcement feed | only titles that name a date ("on Oct 12, 2026", "on 2026-10-08") |
| Campaign deadlines | `/content/campaign-briefs.json` | deadline from the official rules we summarised |

Not used: DefiLlama (terms forbid republishing; owner decision 2026-10-13: no Pro plan, no datasets bucket), so the
calendar has no token-unlock section; FRED pages (personal, non-commercial use). Page times are Singapore time (SGT,
"新加坡时间"), the iCal export is UTC.

## Spot ETF flows (`/etf-flows`): built, not live

The page, reader (`src/data/etf-flows.js`), Dataset schema and runtime reader (`ETF_FLOWS_FILE`) are in place, but
`ETF_FLOWS_LIVE` (`src/data/intel-tools-routes.js`) is `false`: the page is noindex, out of the sitemap and unlinked.
Checked 2026-10-13 (rule: only issuer sites that load and whose terms allow it): pages load for iShares (IBIT, ETHA),
Bitwise (BITB) and ARK (holdings CSV), but BlackRock's terms forbid robots and reuse, Bitwise's (The Network Firm)
forbid screen scraping and redistribution, ARK's terms page is blocked to us and 21Shares (ARKB co-issuer) forbids
scraping; Fidelity, Grayscale, WisdomTree and VanEck block automated requests; Farside and SoSoValue block them too.
Coverage today: 0 funds, so nothing is shown.
To go live: get a licensed feed (or written issuer permission), write `etf-flows.json` in the `nexualpha.etf-flows.v1`
shape (see the header of `src/data/etf-flows.js`), add `run.sh etf`, then set `ETF_FLOWS_LIVE = true`.

## Commands and host job

```sh
cd pilot-01-prototype && node scripts/intel-tools/collect-calendar.mjs   # writes public/intel/calendar.json
```

Host: `/data/agent/srv/intel-tools/run.sh calendar` (cron `40 */6 * * *`, CST) runs the collector in
`node:20-bookworm-slim` against `app/` (same relative paths as the repo: `app/scripts/intel-tools/{collect-calendar,macro-schedule}.mjs`,
`app/src/data/{crypto-calendar,sgt-time,activity-update-path}.js`); output `/data/private/nexualpha/intel/calendar.json`
(`calendar.json.prev` kept), log `/data/agent/srv/intel-tools/refresh.log`. A failing source keeps its previous events
(`status` in the snapshot); the file is replaced only by a usable snapshot. Re-copy `app/` after changing those files.

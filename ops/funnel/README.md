# Placement click report

Run this dependency-free Node report from a **complete source checkout**. It reads the same JSONL as `ops/alert-sender/funnel-report.mjs`: one event per line, `{t, partner, src, ref, kind?, experiment?, variant?, path?, locale?, country?}`. `kind: "site"` is a website beacon; other rows are `/go` redirects. Partner codes, registration URLs and redirect targets are unchanged.

## BaoTa server paths and runbook

The click-log host path documented by the alert sender is `/data/private/nexualpha/clicks/go-clicks.jsonl`. Confirm the running web service's `CLICK_EVENT_FILE` and its volume mapping before running: a container path can differ from the host path. The report does not create missing input or interpret an unreadable log as zero clicks.

Place a complete reviewed source snapshot at `/data/private/nexualpha/ops/placement-report-code` (a proposed operator-managed location, **not a verified existing deployment**). The source scanner needs the active frontend and ops source files, not just the built web bundle. Use a Node version supported by the project (Node 22+). On BaoTa:

```sh
cd /data/private/nexualpha/ops/placement-report-code
umask 077
mkdir -p /data/private/nexualpha/ops/funnel-reports
CLICK_EVENT_FILE=/data/private/nexualpha/clicks/go-clicks.jsonl node ops/funnel/placement-report.mjs \
  --json /data/private/nexualpha/ops/funnel-reports/placement-latest.json \
  --markdown /data/private/nexualpha/ops/funnel-reports/placement-latest.md
```

Or pass `--input <host-log.jsonl>` explicitly. `--now <ISO timestamp>` fixes the window end for reproducible review. Input and output paths must differ. Output parent directories must exist. Reports contain counts and attribution dimensions, never raw events, IPs, full user agents, cookies or subscriber records.

A local synthetic smoke run (no credentials or network):

```sh
node ops/funnel/placement-report.mjs --input ops/funnel/fixtures/clicks.jsonl \
  --json /tmp/placement-report.json --markdown /tmp/placement-report.md \
  --now 2026-10-12T12:00:00Z
node --test ops/funnel/*.test.mjs ops/alert-sender/*.test.mjs
```

## Interpretation and weekly cadence

Review once weekly, for example Monday after the daily owner DM. Archive the two output files under a dated filename before the next run. Compare the 7-day ranking with the 28-day baseline before changing placements. The existing daily DM adds a combined top-five source block across website beacons and `/go` redirects; its site-only and Telegram blocks remain.

Windows are rolling 1, 7 and 28 UTC days, inclusive at the start and exclusive at `now`; future rows are excluded. JSON includes every venue × source placement × locale × page path × country group. Markdown shows the top 30 groups **per window**, ordered by descending count with deterministic ties. Missing dimensions are `null` in JSON and `unknown` in Markdown. Historical site `ref` paths are recoverable; historical `/go` host-only refs cannot recover a page. Locale is inferred from safe site paths or recognized source-language suffixes when explicit metadata is absent. Country is reported only if already logged; this change does not collect geolocation.

The known-placement registry is derived from active source patterns, including `?src=`, source assignments and website CTA placement attributes. It expands supported dynamic source families and excludes tests, generated builds and archived evidence. Consult `known-placements.mjs` for discovery rules. The zero-click list means **no recorded events for a known source in 7 days**; it is not an impression count or proof of tracking health. Generic landing sources may legitimately be zero because only registration events are counted.

Counts measure logged click events, not unique visitors, completed sign-ups, commissions or revenue. There is no event identity for deduplicating a beacon and a redirect, so both count if both were recorded. Retain at least 28 days of logs, including rotated logs merged in chronological order without duplicate lines, for a complete baseline. Malformed/incomplete lines are skipped. An empty readable file yields an empty report; an unreadable file fails.

For deployment, ship the new server metadata helper with the existing Node `/go` and beacon handlers through the normal release process, and update `funnel-report.mjs` alongside the alert sender. No production deployment, scheduling change or Telegram send is performed by this local task.

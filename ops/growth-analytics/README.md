# Growth measurement loop

Run from the repository root with Node 22+; no package installation or paid APIs are required:

```sh
/opt/homebrew/bin/node ops/growth-analytics/nightly.mjs --output-dir ops/growth-analytics/reports --aeo
node --test ops/growth-analytics/tests/*.test.mjs ops/growth-analytics/umami.test.mjs
plutil -lint ops/growth-analytics/com.nexualpha.growth-analytics.plist
```

The nightly run measures the previous full Asia/Shanghai calendar day. `--run-date YYYY-MM-DD` sets the execution day; `--aeo` recovers the weekly monitor immediately. AEO otherwise runs on Monday. GSC final data has a lag; its rolling window and Bing's provider-native date buckets are labeled separately. Do not compare these totals as the same reporting window. Cohorts overlap.

Private credentials are loaded from `~/.codex/private/umami.env`, `gsc-api.env`, and `bing-webmaster-api.env`. Reports never include tokens, passwords, authentication responses, raw IPs or user agents. Errors use bounded codes instead of exception strings or upstream response bodies. Report and content task files are operational inputs, not public publication artifacts.

`daily/<date>.json` and `.md` provide the run status and source evidence paths. The Umami Chinese report contains country, device, top pages, /go attribution, code-copy and Telegram aggregates. Human candidates are heuristic anonymous sessions, not verified people. Missing UA/IP/ASN fields and missing event instrumentation remain explicit coverage gaps. Datacenter ASNs, no-JS and bursts are suspicious rather than proof of bots; known automation and configured QA markers are excluded. Configure comma-separated `ANALYTICS_QA_UAS`, `ANALYTICS_QA_IPS`, and optional `ANALYTICS_DATACENTER_ASNS` in the private environment. Do not guess QA addresses.

Public web search observations are proxies. They do not establish ChatGPT Search or Perplexity citations. No paid AI API is called and no historical week is backfilled as observed.

## Answer-engine observation (`aeo-browser.mjs`)

`runAeo` calls `aeo-browser.mjs` unless `NEXU_AEO_EVIDENCE_FILE` is supplied or `NEXU_AEO_BROWSER=0`. It opens the public, logged-out answer page in a normal visible Chrome window (puppeteer-core from `~/.codex/shared-tools/web-quality`, Chrome at `/Applications/Google Chrome.app`). The rules:

- robots.txt is fetched for every engine on every run, and a query URL is opened only when the `User-agent: *` group allows it. As of 2026-10-18, chatgpt.com allows `/?*`, so it is observed. Perplexity (`Disallow: /*?*q=`), Google (`Disallow: /search`, so no AI Overview check) and Bing (`Disallow: /search`) are recorded as `ROBOTS_DISALLOWS_QUERY_URL`.
- Human-verification pages, CAPTCHAs, login walls and rate-limit notices are recorded as `blocked` and stop that engine for the run. They are never solved or worked around. Headless Chrome gets a Cloudflare check on chatgpt.com, which is why a visible window is used. DuckDuckGo Search Assist and you.com are not in the engine list: on 2026-10-18 they served a CAPTCHA and a login wall respectively.
- Queries run one at a time, with a 12–16 s pause between them. Each observation keeps a screenshot (`aeo-evidence/<date>/`), the cleaned citation URLs (query strings stripped), whether the answer text mentions NexuAlpha, and an excerpt.
- Logged-out answers depend on the egress IP's location and on time. Read them as a sample, not a ranking.

- Known gap (2026-10-18): citations are taken from `utm_source=chatgpt.com` anchors. Some third-party sources (Reddit, blogs) render as citation pills without an anchor, so they are undercounted. Check the screenshot when a third-party source matters.

Manual run: `node aeo-browser.mjs --date YYYY-MM-DD [--limit N]`. It writes `aeo-browser-<date>.json`, which `runAeo` consumes as evidence.

## Content tasks

`contentTasks` lists GSC/Bing rows at positions 8–20. Rows in a money cohort (referral, tokenized stocks, deposit, exchange how-to, brand) are P1. Any other row with at least 2 impressions is P2. Before 2026-10-18 only cohort rows qualified, and because the site has no money-query impressions yet, `content-tasks-*.json` came out empty.

## Scheduler staging and installation boundary

This task's explicit write boundary is the assigned worktree. The first reports and plist are therefore staged here. Nothing was installed in `~/Library/LaunchAgents`, no job was loaded, and nothing was written to `/Volumes/致态2TB/nx-agents/analytics/`.

The plist is prepared for that canonical external directory, invokes `/opt/homebrew/bin/node` directly (no shell), and schedules 06:30 in the host's calendar timezone. `TZ=Asia/Shanghai` controls Node's date behavior, not launchd's host calendar; the Mac must remain in Asia/Shanghai for the requested wall-clock schedule. Before installation, copy the standalone `.mjs` modules from this directory to the canonical directory and the plist to `~/Library/LaunchAgents/`, then load it with `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.nexualpha.growth-analytics.plist`. Confirm the SSD is mounted and the private credential files are readable by that user. Do not create a substitute mount directory. Loading this job is a separate deployment step outside the authorized checkout scope.

A `.nightly-lock` directory prevents overlapping pulls. A crashed process intentionally leaves it behind: inspect its `owner.json` and confirm the process is no longer running before removing it. A source failure does not prevent other collectors from producing evidence. Missing data must not be interpreted as zero traffic, successful indexing, or conversions.

## Attribution policy

Browser activation adds bounded page/module `src` and safe UTM values to same-origin `/go` links. Without JavaScript, existing source tags and sanitized referrer metadata remain available; composite page/module decoration is unavailable. External partner propagation requires an explicit exact-host parameter allowlist supplied to the redirect handler. Existing referral parameters are preserved, and no partner permission has been inferred. Default partner policy remains empty; populate it only from reviewed partner evidence. Unit tests exercise both approved propagation and default denial.

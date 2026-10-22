# Sign-up click measurement

Both `/go/<partner>` GETs and `/api/cta-click` POSTs classify at write time. Redirect destinations, CTA hrefs, and policy gates remain unchanged. Rejected, rate-limited, HEAD, and unresolved requests do not produce click rows. Internal QA produces no rows.

## Classes, in precedence order

| Class | Rule |
| --- | --- |
| `internal` | UA contains `NexuAlpha-internal/`, proxy-validated address is in `CLICK_INTERNAL_IPS`, or `X-NexuAlpha-Internal` equals `CLICK_INTERNAL_TOKEN`. Classified but **not written**. |
| `bot` | Known crawler, headless, automation, or link-preview UA (including HeadlessChrome, Playwright, puppeteer, python, curl, node, Go-http-client, TelegramBot, Twitterbot, facebookexternalhit, Slackbot, WhatsApp, Discordbot); existing analytics automation exclusions; Purpose / Sec-Purpose / X-Moz prefetch or prerender. |
| `burst` | More than 12 eligible requests per daily IP hash × partner in a fixed 10-minute window. |
| `duplicate` | Same daily IP hash × partner seen within the preceding 30 minutes; source and GET/POST do not create a new visitor. |
| `human` | None of the exclusions applies, and a valid proxy-validated IP plus nonempty UA and a configured stable `CLICK_HASH_SECRET` are available. |
| `unknown` | Insufficient network/UA evidence or missing stable hash secret. Never included in human uniques. |

Internal/bot requests do not consume visitor duplicate or burst counters. Both routes share the same classifier in `server.mjs`. Counters are process-local, bounded to 10,000 keys each, and reset on restart; daily report dedup still spans all recorded human events with the same hash. Burst takes precedence over duplicate. Campaign, alternate and page redirects use their exchange `venue` as the dedup identity; their historical route slug remains in `partner` for attribution. The report groups these rows by `venue`.

`human` is a filtered click estimate, not proof of a person, registration, revenue, or conversion. NAT can merge visitors, address changes can split them, and undisclosed automation can imitate a normal browser. The legacy sample lacks the evidence needed for retrospective human verification.

## Privacy and configuration

- `ipHash` is 64 hex characters: HMAC-SHA256 of the normalized validated IP using a secret UTC-day salt. No raw client IP, full UA, secret, cookie value, or referrer query is added to click rows.
- Set a strong private `CLICK_HASH_SECRET` identically on all click-writing processes. This preserves same-day hashes across restarts/instances. Without it, a random in-memory process seed is used for privacy, but otherwise-human requests fail closed to `unknown` and cannot inflate daily unique counts. Configure it before relying on human metrics. Do not rotate the secret mid-day. Never expose it in client code or reports.
- `CLICK_INTERNAL_IPS` is a comma-separated exact-address list for the owner's server/Mac egress addresses; IPv4-mapped IPv6 and canonical IPv6 forms are normalized. It uses the caller's validated address, not forwarding headers read by the classifier. Keep the existing trusted-proxy origin boundary intact.
- Optional `CLICK_INTERNAL_TOKEN` enables header-only internal marking. Send the token itself as `X-NexuAlpha-Internal`; value `1` alone has no authority from an unlisted address. An allowlisted address is internal even without the header. No token is needed for the UA marker.
- `uaFamily` is a coarse enum: bot, telegram, x, youtube, wechat, instagram, tiktok, edge, opera, firefox, chrome, safari, other, unknown. Existing `inapp` remains available.
- GET evidence is boolean: `hasFetchSite` means Sec-Fetch-Site is present; `hasFetchUser` means Sec-Fetch-User is `?1`; `hasReferrerOrigin` means a valid HTTP(S) referrer origin was present. These are evidence, not human guarantees. Existing sanitized `ref` host and site `path` metadata remain; IP-literal referrer hosts are dropped.

QA regression already sets `internalUserAgent('qa-regression', device.ua)` on each Puppeteer page and intercepts click beacons with 204. The page-level UA also covers anchor navigations and browser beacons. `qa-browser-sweep.py` and `qa-flows.py` use context-level internal UAs, so their requests remain excluded even without interception. No client bundle code or href decoration is needed.

## Green-board JSON contract

```sh
node scripts/click-report.mjs /data/private/nexualpha/clicks/go-clicks.jsonl --json
```

Require exit status 0, parse JSON, and require `schemaVersion === 1`. A missing/unreadable log or parse failure of the command output is unavailable evidence, not zero clicks. `invalidRows` exposes malformed records skipped within the input scan.

- `totals.humanUnique`: owner metric for the rolling window, distinct **UTC day × partner × daily IP hash**. It sums daily uniques, not seven-day unique people.
- `byDay.find(row => row.day === 'YYYY-MM-DD')?.humanUnique ?? 0`: metric for that UTC day after a successful read. The current day is partial.
- `byPartner` and `bySourceGroup`: window breakdowns; `daily`: day × partner × source group breakdown. Each view conserves totals; do not add views together.
- `humanEvents` and `humanRepeatEvents`: raw human-class rows and additional same-day human rows. Daily dedup also handles repeats after 30 minutes or across process restarts when the hash secret is stable. Earliest human source receives the unique; equal timestamps break ties by lexical source group.
- `excluded`: exact normalized excluded-class event counts: internal, bot, burst, duplicate, unknown, legacy-unverified. Internal is normally zero because writers suppress it. Report-time human repeats do not increase write-time `excluded.duplicate`.
- Every old line without a valid `ipHash` is `legacy-unverified`, even if its stored `cls` says human/bot. Old `prefetch` with a hash maps to bot. New unknown rows without an address also lack a valid hash and appear as legacy-unverified; neither can enter the owner metric.
- Sources: `tg-*` → telegram; article/news prefixes → article; home prefix → home; venue/profile/fee-summary/registration-card prefixes → venue; everything else → other.
- `window.start` and `window.end` are inclusive, exactly now minus 7×24 hours through now, in UTC. Boundary dates may be partial; the board must respect `window` rather than assume seven complete calendar days.

The green-board consumer is outside this worktree and must adopt this JSON explicitly. Existing partner-program/raw-log consumers are not upgraded by this report change and must not be used as the filtered owner metric.

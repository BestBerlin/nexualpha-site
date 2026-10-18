# 2026-10-18 update: hashtags + daily keywords

- New `hashtags.mjs`: every post gets 2–4 tags (topic cashtags/hashtags, the day's hot keyword, one
  rotated evergreen tag), cashtags inline, hashtags on the last line, ≤ limit with URLs as 23.
- Daily keyword set from calendar (FOMC/CPI/NFP/PCE), newsroom top-events (host-synced slim copy),
  whales, market movers/liquidations, keyword-radar snapshot and CoinGecko trending; all fail soft.
- Removed the `Partner links disclosed.` and liquidation lower-bound footers (owner rule: no
  disclaimers/commission talk); rebate/code/commission sentences are dropped instead.
- The 403 length fallback now sends a pre-built tagged ≤280 version.
- Tests: `x-poster.test.mjs` (20) + `hashtags.test.mjs` (11). The historical report below predates this.

# Changed files

- `ops/x-poster/x-poster.mjs`: dependency-free single-run publisher and pure builders.
- `ops/x-poster/x-poster.test.mjs`: 19 tests.
- `ops/x-poster/preview.mjs`: read-only five-article, market and daily builder preview.
- `ops/x-poster/README.md`: scheduling, configuration, cost estimates, recovery and official references.
- `ops/x-poster/REPORT.md`: this report and current-feed preview samples.
- `pilot-01-prototype/package.json`: prepend the X tests to `test:sites`, as required by the common brief.

# What and why

Implemented English article plain posts (default 1,200 weighted maximum), one prioritized daily article link,
supported high-severity market alerts (rolling three-hour type throttle), and the 13:00 UTC daily brief.
Articles have an hourly throttle. Existing articles establish a baseline without posting on the first run.
Daily UTC caps default to 10 plain / 2 link attempts; all plain types share the cap. There is only one daily
article-link selection. Atomic state updates and a process lock prevent overlap. Reservations precede every
POST; ambiguous outcomes are never retried. The authenticated username must be `NexuAlpha`.

No private credential file was read, no X API request was made, and no scheduler/deployment was installed.
The direct task request and handoff README require a local commit, superseding the older uncommitted line
in BRIEF.md. All changed files are in the assigned worktree on `codex/x-poster`; no push.

**Local commit blocked by the sandbox.** `git add ops/x-poster pilot-01-prototype/package.json` failed:

```text
fatal: Unable to create '/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-x-poster/index.lock': Operation not permitted
```

No files were staged or committed. Approval policy is `never`, so this session cannot expand filesystem
access. Recovery: allow Git to write this worktree's metadata, then stage the six listed files and commit
on `codex/x-poster`. Suggested Lore commit message:

```text
Keep official X publishing bounded and duplicate-safe

Constraint: Single-run scheduler with UTC attempt budgets and no new dependencies
Rejected: Retrying ambiguous POST responses | X offers no client idempotency key
Confidence: high
Scope-risk: narrow
Directive: Preserve pre-send reservations and the @NexuAlpha identity guard
Tested: 19 X tests and 85 combined ops tests; app typecheck passed
Not-tested: Live X posting, Premium API entitlement, Node 20; app suite has 13 unrelated failures
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
```

Copy reuses Claude-authored English summaries and source-mapped claims, excluding partner-source claims;
it does not invent facts or pad sparse articles. URLs/domains in plain copy become `[URL omitted]`.
Disclosures remain last when rebates/partners/codes are mentioned. Weighted counting uses the official v3
ranges, NFC and emoji graphemes, with detected URLs counting as 23. No npm dependencies added.

The updated brief explicitly permits one short replacement after a length-specific 403; other 4xx are
never retried. Both attempts consume budget reservations, and both outcomes are retained. A fallback
cannot exceed the hard daily cap. A reviewer found a 13:00 clock-boundary bug; one captured clock now
serves planning/execution, and a regression test proves the fix.

## Scheduler and environment

BaoTa shell job: every five minutes, after the lead copies this folder to `/data/agent/ops/x-poster` and
creates a scheduler-owned mode-0700 `/data/agent/state/x-poster` directory. Exact shell line:

```sh
X_ENV_FILE=/data/agent/secrets/x-nexualpha.env X_STATE_DIR=/data/agent/state/x-poster MAX_PLAIN_PER_DAY=10 MAX_LINK_PER_DAY=2 X_MAX_WEIGHTED=1200 /usr/bin/node /data/agent/ops/x-poster/x-poster.mjs --once >> /data/agent/state/x-poster/job.log 2>&1
```

Equivalent cron line:

```cron
*/5 * * * * X_ENV_FILE=/data/agent/secrets/x-nexualpha.env X_STATE_DIR=/data/agent/state/x-poster MAX_PLAIN_PER_DAY=10 MAX_LINK_PER_DAY=2 X_MAX_WEIGHTED=1200 /usr/bin/node /data/agent/ops/x-poster/x-poster.mjs --once >> /data/agent/state/x-poster/job.log 2>&1
```

Runtime credential keys in the private env file: `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`,
`X_ACCESS_TOKEN_SECRET` (aliases in README). Values are never sourced as shell or logged.
Optional `X_MARKET_MAX_AGE_MS=900000`; stale/future market data skips market/daily posts.
`X_MAX_WEIGHTED` accepts 280–25000; markets, daily briefs and links remain capped at 280.

Using the brief's estimated rates, a saturated normal day is 10 × $0.015 + one × $0.20 = **$0.35**,
before account-lookup charges (roughly 71 days of $25 before reads). Configured two-link safety ceiling:
**$0.55/day** before reads. Identity lookup happens only on invocations with eligible posts, never on
baseline/empty/dry runs. Failed attempts count conservatively even when billing may not charge them.

The official [Create Posts reference](https://docs.x.com/x-api/posts/create-post) documents the `text`
payload at `/2/tweets` and no `note_tweet` flag; it does not explicitly guarantee Premium long-text API
access. [X Help](https://help.x.com/en/using-x/types-of-posts) confirms the product's Premium 25,000-character
limit. API entitlement is still a live verification gap; the implementation follows the brief and includes
the narrowly detected 403 fallback. Signing tests use the public invalid example in the
[official OAuth guide](https://docs.x.com/fundamentals/authentication/oauth-1-0a/creating-a-signature).

# Tests (exact commands and results)

Executed from the worktree root except the app command. Runtime: Node `v26.0.0`.

| Command | Result |
|---|---|
| `node --check ops/x-poster/x-poster.mjs` | Exit 0. |
| `node --check ops/x-poster/preview.mjs` | Exit 0. |
| `node --test ops/x-poster/x-poster.test.mjs` | Exit 0; 19 passed, 0 failed. |
| `node --test ops/alert-sender/*.test.mjs ops/channel-feed/*.test.mjs ops/x-poster/*.test.mjs` | Exit 0; 85 passed, 0 failed. |
| `cd pilot-01-prototype && npm test` | Exit 1; typecheck passed; test:sites reported 1,110 tests, 1,092 passed, 13 failed, 5 skipped. Downstream suite stopped after test:sites. |
| `X_STATE_DIR=/tmp/x-poster-live-dry node ops/x-poster/x-poster.mjs --dry-run` | Exit 0; `{"baselineArticles":634,"dryRun":true}`; no X request or state write. |
| `node ops/x-poster/preview.mjs` | Exit 0; five current articles, one explicitly synthetic market example, one daily brief (samples below). |
| `git diff --check` | Exit 0. |

The full app test command before adding the package integration reported 1,091 tests, 1,073 passed,
the same 13 failed and 5 skipped. The final integrated run adds exactly 19 passing X tests and no new
failure name relative to that fresh worktree run. Ten failures match the supplied historical baseline.
The other three depend on missing `dist/news-ssr/entry-server.js` / `dist/client/index.html` artifacts;
no production build or app behavior was changed for this ops task. Exact failing names:

- `fee benchmark mobile expand controls are localized for every supported locale`
- `fee benchmark preserves source-bound CTA destinations and mobile six-row behavior`
- `homepage keeps primary decisions above a collapsible research drawer`
- `Telegram research hub answers first and keeps command depth expandable`
- `detail and comparison routes keep one mobile action layer`
- `deep comparison keeps high-intent metrics visible while expanding the full matrix on mobile`
- `3.0 secondary pages stay visibly independent and keep commercial handoffs explicit`
- `rate benchmark keeps the mobile table progressive without removing full venue access`
- `directory cards can form a bounded two-platform comparison handoff`
- `V3 adds first-class conversion routes without exchange impersonation`
- `served Worker HTML preserves explicit country context instead of using unscoped prerender codes`
- `tests/prerender-contract.test.mjs`
- `emits the files required by Sites packaging`

## Current-feed builder preview

This is a read-only builder preview, not a scheduler plan or a live-post receipt. A real first-run dry run
prints only the baseline count. The execution machine clock reported October 11 UTC while the task
context says October 12; all runtime UTC calculations use that machine clock. Market snapshot metadata:

```json
{"previewOnly": true, "marketGeneratedAt": "2026-10-11T18:33:13.841Z", "marketAgeMinutes": 2}
```

### Article — 1000 weighted, plain

Slug: `clarity-act-failed-senate-what-happens-now-sec-cftc-crypto-rules`.

```text
The CLARITY Act Failed in the Senate: What Happens to US Crypto Rules Now, and What It Means for Your Accounts

The CLARITY Act failed a 49-50 Senate vote on 15 September 2026. Here is what the SEC and CFTC have done since, what gap remains for spot crypto, and what it means for your accounts.

• The CLARITY Act failed a Senate procedural vote 49-50 on 15 September 2026; 60 votes were needed.
• The SEC issued a five-year Innovation Exemption for trading tokenized NMS stock on Tokenized Securities Venues on 17 September 2026.
• The SEC proposed crypto custody rules for advisers and funds on 1 October 2026, including state trust companies as custodians.
• The CFTC published an ANPRM on Regulation CTX and Regulation CAM on 5 October 2026 with a 60-day comment period.
• Unleveraged spot crypto trading still lacks comprehensive federal oversight beyond CFTC anti-fraud and anti-manipulation authority.

What to watch: follow the source updates and the data behind these findings.

#crypto
```

### Article — 1053 weighted, plain

Slug: `bitcoin-short-squeeze-trump-energy-ceasefire-shorts-liquidated`.

```text
Bitcoin Short Squeeze After Trump's "Energy Ceasefire" Post: $12.5 Million Liquidated in Four Hours, 99.7% of It Shorts

A short squeeze on 11 October 2026 liquidated $12.5 million in four hours, 99.7% of it shorts, led by ETH on OKX, on the day Trump announced a Russia-Ukraine energy ceasefire.

• NexuAlpha recorded $12.54M of liquidations in the four hours to 16:48 UTC on 11 Oct 2026, 99.7% shorts; lower bound.
• Largest single liquidation was a $2,528,150 ETH short on OKX at 15:40:26 UTC.
• Trump announced an energy ceasefire between Russia and Ukraine on Truth Social; Zelenskyy said it was news to him and Ukraine would agree if Russia did.
• CoinDesk reported markets were not reacting at the time, with BTC just under $83,000.
• Binance ETHUSDT funding settled at -0.0118% and -0.0117% before flipping to +0.0012% at 16:00 UTC; BTC from -0.0027%/-0.0010% to +0.0013%.

NexuAlpha liquidation figures are lower bounds for the covered venues.

What to watch: follow the source updates and the data behind these findings.

#Bitcoin #crypto
```

### Article — 977 weighted, plain

Slug: `october-10-crypto-crash-one-year-later-liquidity-leverage-liquidations`.

```text
One Year After the $19 Billion October 10 Crash: Bitcoin Liquidity Has Rebuilt, Altcoins Have Not — and What Leverage…

A year after $19 billion was liquidated on 10 October 2025, bitcoin and ether order books are deeper but altcoin liquidity is thinner. Our liquidation and funding data show where leverage stands now.

• More than $19B of leveraged positions were liquidated on 10 October 2025 as BTC fell from ~$122.6K to below $105K after 100% tariff announcement.
• Bitcoin 1% depth ~$11.7M on 7 Oct 2026, ~75% above crash day; altcoin 5% depth down about a third since early 2025.
• NexuAlpha tracked $3.23M of liquidations in 24h to 14:48 UTC 11 Oct 2026, 47% longs / 53% shorts, 478 orders; lower bound.
• Binance ETHUSDT funding settled at -0.0118% and -0.0117% on 11 Oct at 00:00 and 08:00 UTC.

NexuAlpha liquidation figures are lower bounds for the covered venues.

What to watch: follow the source updates and the data behind these findings.

#Bitcoin #crypto
```

### Article — 861 weighted, plain

Slug: `imf-tokenized-us-stocks-after-hours-volatility-liquidity-what-it-means`.

```text
IMF on Tokenized US Stocks: Half of Trades Happen After Hours, Prices Swing 1.5x More — What It Means for You

The IMF's October 2026 stability report found more than half of tokenized US stock trading happens after hours and prices swing 1.5 times more than the shares. What it means for investors.

• In the IMF sample more than half of tokenized US equity trading took place outside regular US hours and about 80% of trades were below one share.
• Tokenized stocks were about 1.5 times as volatile as the underlying shares; DEXs were most volatile and least liquid.
• Public tokenized RWAs were about $65B at end-July 2026, of which tokenized equities about $2.3B.
• OKX and ICE filed for a venue offering round-the-clock trading in tokenized US shares.

What to watch: follow the source updates and the data behind these findings.

#Tokenization #crypto
```

### Article — 1068 weighted, plain

Slug: `coldcard-x-account-phishing-post-what-to-do`.

```text
Coldcard's Official X Account Posted a Phishing Link: What Happened and What Bitcoin Holders Should Do Now

A phishing link was posted from COLDCARD's official X account on 11 October 2026. What the company said, why it suspects platform-level access at X, and what to do if you clicked or still need to migrate a seed.

• On 11 October 2026 a phishing link was posted from COLDCARD's official X account; COLDCARD deleted it and said [URL omitted] is its only official website.
• COLDCARD told X Support it found no matching login, session or access records, that its credentials and offline 2FA remain secure, and that it is concerned about platform-level or administrative access.
• The July 2026 COLDCARD exploit stole at least $100M of bitcoin from about 7,300 wallets per Galaxy Digital; DefiLlama estimates $115M.
• COLDCARD's current recommended releases are Mk4/Mk5 5.6.3 and Q 1.5.3Q, and updating firmware does not repair a seed created on affected firmware.

What to watch: follow the source updates and the data behind these findings.

#Bitcoin #crypto
```

### Market — 107 weighted, plain

No supported high event exists in the snapshot. This event header is synthetic; only the numbers come from the public snapshot. It is not eligible for posting.

```text
Liquidation spike
Liquidations (lower bound):
1h long $0.12M / short $0.56M
24h long $1.52M / short $14.34M
```

### Daily — 179 weighted, plain

```text
NexuAlpha daily brief
BTC $83,815 (+1.01% 24h)
ETH $2,539.56 (+1.24% 24h)
SOL $111.93 (+1.75% 24h)
24h liquidations (lower bound): long $1.52M / short $14.34M
Top mover: S +44.21%
```

# Open questions

- Local commit requires writable Git worktree metadata; the exact staging rejection is above.

- Lead must verify Premium long-text API entitlement and runtime credentials during deployment;
  neither was accessed here. Confirm current X billing and identity-read charges before scheduling.
- The live feed lacks explicit `type` values on sampled articles. Unknown types default to news,
  `rwa` maps to tokenization. A once-daily choice uses articles available at the first eligible run,
  not future articles published later. Should upstream expose the brief's explicit priority types?
- Claude should approve the mechanical hook/template and generic watch line. Sparse feeds can produce
  fewer than three facts or fewer than 600 characters. No invented padding is used. The lexical content
  gate is not semantic moderation, and the conservative URL detector is not a full twitter-text TLD parser.
- The 13:00–13:59 UTC window has no later catch-up. All plain types share the daily budget, so an earlier
  cap exhaustion can skip the daily brief. Failed/unknown reservations require manual reconciliation;
  they are intentionally not reposted automatically. A length fallback also requires another free slot.
- Node 20 compatibility follows the built-in APIs used, but this machine verified Node 26 only.
  Full app tests remain blocked by existing assertions/missing build artifacts described above.

# Official NexuAlpha X publisher

Node ≥20, ESM, built-ins only. Run once every five minutes; no resident Mac service.
This code does not install jobs, deploy, or post during tests or previews.

## Scheduler (BaoTa shell job, every 5 minutes)

Copy `ops/x-poster/` into `/data/agent/ops/x-poster` during the lead's deployment.
Pre-create the private state directory, owned by the scheduler user, with mode 0700.
BaoTa job **shell content** (set its schedule to every five minutes):

```sh
X_ENV_FILE=/data/agent/secrets/x-nexualpha.env X_STATE_DIR=/data/agent/state/x-poster MAX_PLAIN_PER_DAY=10 MAX_LINK_PER_DAY=2 X_MAX_WEIGHTED=1200 /usr/bin/node /data/agent/ops/x-poster/x-poster.mjs --once >> /data/agent/state/x-poster/job.log 2>&1
```

Equivalent crontab line:

```cron
*/5 * * * * X_ENV_FILE=/data/agent/secrets/x-nexualpha.env X_STATE_DIR=/data/agent/state/x-poster MAX_PLAIN_PER_DAY=10 MAX_LINK_PER_DAY=2 X_MAX_WEIGHTED=1200 /usr/bin/node /data/agent/ops/x-poster/x-poster.mjs --once >> /data/agent/state/x-poster/job.log 2>&1
```

UTC is used inside the program regardless of the scheduler's timezone. A daily brief
is eligible during 13:00–13:59 UTC; an outage lasting that hour skips that day's brief.
An article link is selected at the first eligible run that day: it cannot foresee later
articles. Explicit `type` priority is market-event > news > tokenization > explainer;
`category: rwa` maps to tokenization; other missing/unknown types default to news.

## Configuration

- `X_ENV_FILE`: required for a run with posts. Read-only dotenv-style file, never sourced
  as shell code. Keys: `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`.
  Aliases: `X_CONSUMER_KEY`, `X_CONSUMER_SECRET`, `X_API_KEY_SECRET`. Values must be literal;
  quoted values accepted, no interpolation or inline comments. Keep file mode 0600.
- `X_STATE_DIR`: required, persistent private directory; keep the same directory on every
  invocation. Deleting state establishes a new baseline and loses post/budget history.
- `MAX_PLAIN_PER_DAY=10`, `MAX_LINK_PER_DAY=2`: nonnegative integer attempt caps per UTC day.
  All plain types share one cap. Only one article link is selected per day, so the link cap
  of 2 is a safety ceiling, not a target. Errors and the short fallback consume reservations.
- `X_MAX_WEIGHTED=1200`: 280–25000; applies to articles only. Alerts, briefs and links ≤280.
- `X_MARKET_MAX_AGE_MS=900000`: maximum market age, 1–3600000 ms. Missing/future/stale
  snapshots skip alerts and daily briefs; malformed required numeric data fails closed.

## Copy and costs

English published editions only. First real run records existing articles and sends
nothing. Later runs send at most one new article per rolling hour. Summaries plus up to
five source-mapped claims provide long copy; partner-source claims are excluded. Sparse
source copy stays short rather than adding invented facts. The hook is mechanically
shortened/dequestioned; the watch line is generic. Claude must review these templates
and feed copy before deploying. No LLM or new factual content is generated.

Plain copy removes domain/URL strings, using `[URL omitted]`. No disclosure, commission or
data-caveat footers are added (owner rule): sentences about rebates, referral/invite/registration
codes or commission are dropped from summaries, and partner-source claims are excluded. A lexical
policy gate blocks common tax avoidance and price prediction wording; it is not a semantic
moderation system. Editorial review remains necessary for paraphrases or novel wording.

## Hashtags and the day's keywords (`hashtags.mjs`, since 2026-10-18)

Every post carries **2–4 tags**: cashtags inline where the ticker already appears in the text,
everything else on one final tag line. Tags never add a URL, so the cost class is unchanged.

1. **Topic (0–2)**: coins in the post as cashtags (`$BTC`, `$ETH`, `$HYPE`; at most two), then topics
   such as `#TokenizedStocks`, `#NVDA`, `#ETF`, `#Hyperliquid`, `#Liquidations`, then one venue tag
   in push order Bitget > OKX > Binance (then Bybit, Gate, HTX, KuCoin, Kraken, Coinbase).
2. **Hot keyword (1)**: the highest-ranked daily keyword the post touches; if the day's #1 keyword is
   already tagged in the post that covers it; otherwise the top macro/topic/major (`#FOMC`, `#CPI`,
   `#BTC` …). Random trending alts are never put on unrelated posts.
3. **Evergreen (1)**: rotated by SGT day + post key from `#crypto #Bitcoin #CryptoNews #Web3`
   (Chinese posts: `#加密货币 #比特币 #crypto #CryptoNews`).

No duplicates (`$BTC` and `#BTC` count as one); a banned list blocks giveaway/100x/casino/tax-style
tags; only curated coins can become a hashtag keyword. If tags do not fit, the body is truncated
(URLs and required numbers stay intact) and the second topic tag is dropped before anything else.

Daily keyword set, computed every run that may post (all sources optional, failures only logged):
`/intel/calendar.json` (FOMC/CPI/NFP/PCE days dominate), newsroom top-events (slim copy synced by
`sync-top-events.py` via `/etc/cron.d/nexualpha-x-keywords` into `$X_STATE_DIR/top-events.json`,
override `X_TOP_EVENTS_FILE`), `/api/whales.json`, market majors/movers and 24h liquidations, the
keyword-radar snapshot `radar-terms.json` (rebuild on the Mac with `node build-radar-snapshot.mjs`
before each deploy; override `X_RADAR_FILE`), and CoinGecko trending (`X_TRENDING=off` disables).

Weighted counting uses NFC, Twitter text v3 ranges, grapheme-safe emoji/ZWJ/flag/keycap
weight 2 and detected URL weight 23. URL extraction conservatively treats bare domains
as URLs; it is not a complete port of Twitter's TLD/URL validation tables. Production
plain posts sanitize domains; generated link URLs use the fixed canonical site path.

At the brief's supplied rates, ten plain attempts cost approximately **$0.15/day**;
one article link adds **$0.20/day**, or **$0.35/day** at saturation (about 71 days for
$25 before reads). The configured two-link ceiling is **$0.55/day**. Real account
verification calls to `/2/users/me` can incur additional read charges: one per invocation
with eligible posts, none for empty/baseline/dry runs. Rates/read costs and actual X
billing must be confirmed by the lead; these are estimates, not billed receipts.

## Failure behavior

A lock prevents overlapping jobs; a crash leaves `run.lock`. Check that the old process
has exited before deleting that lock. State parsing is fail-closed, updates use atomic
rename, and each request's budget and key are saved **before** network submission.
Pending/unknown/failed attempts are not automatically retried. Lost responses can mean
missed posts: reconcile them manually against X before making any state edit. A JSON
journal records cost class, weighted length, status, id and estimated cost; scheduler
stdout captures each attempt. Never reset state to retry a 4xx.

The sole 4xx exception is the updated brief's explicit fallback: a **length-specific 403**
on an article >280 triggers one distinct ≤280 payload, only if budget remains. General
403, 400, 401 and 429 are never retried. Other failures also stop the cycle. No credentials,
Authorization headers, raw API error bodies or key values are logged.

The authenticated username must equal `NexuAlpha` before sending. Tests never access
real credentials. Dry runs read state/public feeds only and do not create directories,
locks or state; a first-run dry preview reports only the baseline count, as a real run
would send nothing.

```sh
X_STATE_DIR=/data/agent/state/x-poster node ops/x-poster/x-poster.mjs --dry-run
node ops/x-poster/preview.mjs
node --test ops/x-poster/x-poster.test.mjs ops/x-poster/hashtags.test.mjs
```

`preview.mjs` prints the day's keyword set and the next five article posts (plus the 280 fallback,
the daily link, one market alert and the daily brief) with their tags, without state or X credentials. If no supported high event exists, its market
example is explicitly synthetic; it does not promote a medium event. This is not a
scheduler dry run or permission to send those samples.

## Official references checked

- [Create Posts](https://docs.x.com/x-api/posts/create-post): `/2/tweets` accepts `text`;
  no `note_tweet` field. This page does not explicitly guarantee Premium long-text access.
- [X longer posts](https://help.x.com/en/using-x/types-of-posts): Premium supports up to
  25,000 characters in the product. API entitlement still needs a lead-authorized live check.
- [OAuth signature](https://docs.x.com/fundamentals/authentication/oauth-1-0a/creating-a-signature):
  test uses its public invalid credentials and expected `api.x.com` signature.
- [Twitter text v3 weights](https://github.com/twitter/twitter-text/blob/master/config/v3.json).

# Draft writer pipeline

Free writers draft, Claude reviews and publishes. Writer priority (owner 2026-10-18): **Antigravity (`agy`) → Gemini CLI → Codex exec**. Nothing here publishes, posts to X, or edits the publication ledgers. Installed and verified live on 2026-10-18 (Antigravity + Codex live; Gemini CLI blocked by the service, see gemini-diagnostics.md).

## Files and target placement

| Committed files | Intended installed location |
|---|---|
| `agy`, `agy.mjs` | `/Volumes/致态2TB/nx-agents/bin/` (keep together) |
| `write-batch.sh`, `write-batch.mjs`, `validate-drafts.mjs`, `review-checklist.md`, `REVIEW-QUEUE.md` | `/Volumes/致态2TB/nx-agents/writers/` |
| `agy`, `agy.mjs` (second copy or symlinks) | `writers/` beside `write-batch.mjs`, which invokes this adapter |
| `com.nexualpha.writer-pipeline.plist` | `~/Library/LaunchAgents/` — every 2 h at :15 (00:15 … 22:15 local), 20 min before Claude's :35 review |

Installed 2026-10-18 (copies, not symlinks; re-copy after changing the repo). The plist runs `/opt/homebrew/bin/node` directly (launchd bash/zsh cannot write the external disk); no RunAtLoad. `agy` needs a running Antigravity app (language server); if it is closed the agy attempts fail fast and the batch falls through to Gemini/Codex.

Run from the checkout after a backend is recovered:

```sh
node ops/writer-pipeline/write-batch.mjs --config /absolute/config.json
node ops/writer-pipeline/validate-drafts.mjs /absolute/package-directory
node --test ops/writer-pipeline/agy.test.mjs ops/writer-pipeline/write-batch.test.mjs
```

Config JSON may override `limit` (1–3 topics; 1 = search lane only, for smoke tests), `root`, `engine`, `keywords`, `events` (a read-only top-events export), `newsroomSsh`, `nativeDrafts`, `nativeBriefs`, `providers` and provider `timeout` milliseconds. Omit overrides after installation to use the brief's target paths. A checkout smoke test must override **root and engine** to directories within this checkout. The engine must include `state/article-ledger.jsonl`, `state/claude-daily-ledger.jsonl`, `CLAUDE-CONTENT-RUNBOOK.md` and `tools/build-package.py`. Defaults write real draft staging only after installation. Do not invoke defaults from this restricted task.

Providers are tried in order: agy pro, agy flash, Gemini, `codex exec` (ephemeral, read-only sandbox). Each attempt (provider, seconds, error) is logged in the manifest; the winner is `meta.writer` + `meta.writerInfo` (Antigravity conversation ID and served model). For search topics whose seed page has fewer than three readable sources, `agy --model flash` runs a web-search **discovery** step that only proposes URLs; the pipeline then curl-fetches them itself and only fetched bodies reach the writer. A missing fresh retail news event now skips the news lane (no filler) instead of blocking the whole batch; Claude's fallback covers hot news. Each gets the freshly fetched runbook, research text and partners.json; provider errors are reduced to secret-free failure records. Antigravity and Gemini tool prohibition is a prompt contract, not an OS sandbox; do not call it a proven isolation boundary. Do not enable unattended scheduling until the provider environment and tool permissions are reviewed. Antigravity timeouts can leave remote conversations running; inspect the IDE before retrying. Distinct output files prevent partial pro output from masquerading as flash output.

The controller reads both ledgers, live multilingual titles/slugs and pending reservations. It reads the newest fresh radar, falls back to keyword CSVs only without usable radar, alternates beginner preference using reservations and ledger, selects a fresh retail newsroom event with tokenized stocks first, and rotates native locales with unused draft/brief preference. It reserves three independently packaged topic intents per run, conservatively including the independently researched localized topic in the 24-topic daily cap. A missing safe native topic or fresh retail event blocks the run; there is no filler/catchup.

Selected source URLs must be readable HTTPS. Research uses curl with a browser User-Agent, public pinned IPv4, bounded responses, one retry, and manually followed redirects (max 3, each hop re-validated). `research.json` stores the page's readable **text** (scripts/styles/tags stripped), not raw HTML — the first 20 kB of a help-centre page is usually only `<head>` markup. Unreadable URLs are listed in `failedUrls` and never cited. Binance web pages answer curl with an empty WAF challenge (HTTP 202) and are therefore unusable as sources; topics that cannot reach two readable sources are skipped for the next radar candidate (max 3 per batch, skipped queries stay reserved). Search profiles provide discovery links to official venue help pages; thin/unlinked pages fail closed. Native drafts are untrusted context, never accepted as facts. `research.json` stores fetched excerpts, citations must match fetched URLs, and local checks enforce minimum structure, pending review, primary sources, claim IDs, locale restrictions and code/title rules. The builder's automatic review PASS is explicitly removed. These mechanical checks cannot establish factual accuracy, native prose quality or complete jurisdictional compliance.

All batches use `<engine>/staging/<Shanghai-date>/<UTC-run>-draft/`; packages initially use stable `topic-N` directories and store the intended slug in metadata. A manifest tracks `writing`, `blocked` or `needs_review`. Blocked/partial manifests retain all query reservations and appear in REVIEW-QUEUE.md; never silently recycle them. A per-root atomic lock prevents this writer's overlapping runs. If a process is killed, inspect the PID/activity, manifest and IDE conversations before removing its stale `.writer.lock`. The lock does not coordinate with the reviewer or other publishers: disable any competing writer schedule before rollout, and have the reviewer use the same reservation policy.

Before the draft gate, purely mechanical issues are normalised instead of failing the batch: blank lines around headings/lists, titles synced to each edition's H1, absolute nexualpha.com links made site-relative and collected into `internalLinks`, tokenized-stock hub/ticker links added to first mentions, unrequested/null editions dropped, `seo.description` terminal punctuation. Each package gets `reviewWarnings.ungroundedNumbers` (numbers in the English edition found in no fetched source) for the reviewer.

The controller never grants PASS, invokes the publisher or submits search URLs. The reviewer owns the checklist, canonical validator, four review passes and publication. The writer manifest and review queue are not publication/indexing evidence.

Known scope limits: not a complete automated implementation of every runbook discovery source; unattended X discovery is explicitly skipped. Owner priority prose and rewards fact-sheet interpretation remain editorial responsibilities: packages must not invent rewards from those mentions. Keyword `refresh existing page` actions become reviewable new article drafts, never site UI edits. Automated code/locale regex checks are conservative and incomplete across every language; reviewer confirmation is mandatory. No live end-to-end manuscript was produced here.

## Social drafts: X, Telegram, YouTube Shorts scripts (2026-10-18)

Same contract: writers draft, Claude reviews and posts. Writers: `agy --model flash` (gemini-3.8-flash-tiered), then `codex exec`. Gemini CLI is skipped because it is ineligible.

| File | Role |
|---|---|
| `social-batch.mjs` | Gathers newsroom top-events (ssh, read-only), `/api/whales.json`, `/content/news-feed-summary.json`, `/intel/partners.json` and `/intel/market-events.json`. It builds a brief with tokenized-stock topics first and makes one writer call per channel. Every draft is checked by `social-rules.mjs`. Valid drafts land in `<root>/social/<SGT-date>/<UTC-run>-social/drafts.json` as `needs_review`; failing ones go in `invalid[]` with their errors. The script then rebuilds REVIEW-QUEUE.md. |
| `social-rules.mjs` | Shared validator for all channels (see rules below). |
| `social-queue.mjs` | Draft storage plus the REVIEW-QUEUE sections, one per channel. |
| `social-post.mjs` | Review CLI: `list`, `show`, `approve [--text-file]`, `reject --reason`, `post [--live]`, `handoff`. |
| `com.nexualpha.social-writers.plist` | launchd job at 07:50, 11:50, 15:50, 19:50 and 23:50 local time, 45 min before Claude's :35 review. |

- **X (@NexuAlpha).** Writers produce 3 candidates per locale (en, zh-Hans, es, pt-BR, id, tr). Each body is ≤200 chars with no tags of its own. The tool strips writer tags and adds 2–4 tags with `ops/x-poster/hashtags.mjs`: stock tickers become cashtags (`$TSLA`, `$NVDA`), plus `#TokenizedStocks`, the day's hot keyword and an evergreen tag. Posts stay ≤280 weighted chars. A link is optional and must be our page (`?src=x-social`). Link posts cost about $0.20, so at most one per day.
- **Telegram.** One post per channel: zh-Hans @NexuAlphaClub, en @NexuAlphaGlobal, ru @NexuAlphaRU, tr and vi private channels. Telegram HTML (`<b>`, `<i>`, `<a>`) only, ≤1000 chars, with a "read more" link to our locale page. `post --live` sends over `ssh nexualpha-prod`: python on the server reads `COMMUNITY_BOT_TOKEN` from `community-poller.env`. The token never reaches the Mac or its logs.
- **YouTube Shorts.** Scripts only, in en, es, pt-BR, id, tr, vi and ru. Style is a cartoon Q-version Bitcoin mascot, 9:16, 4–6 scenes, ≤170 narration words. `handoff` copies an approved script to `<root>/social/youtube-approved/` for the separate video/voice pipeline, which owns the voiceover and audio gate. Nothing is uploaded from here.
- **Rules enforced by `social-rules.mjs`.** No fine print or disclaimers, in any language. Never mention what we or the inviter earn (commission, kickback, rev-share, "inviter gets…"); regulators named "… Commission" are exempt. No price predictions or guarantees. Links go only to nexualpha.com pages: never /go/, never `ref=`, never an exchange URL or a bare domain such as `Gate.io`. Neutral locales (ru, ar, zh-Hant, ur, uk, vi) get no codes, sign-up, bonus or rebate wording. tr never mentions Bitget and gets no Backpack/Hyperliquid promotion. Partner codes must exist in partners.json. Owner anonymity: no BestBerlin, Btc_Berlin, 柏萬億 or personal handles.
- **Posting safety.** `post` is a dry run unless `--live`. It refuses drafts that are not `approved`, are older than 18 h, or fail the rules again at post time. It also enforces caps: X 4/day (1 link), Telegram 3 per chat per day, on top of the automatic x-poster and channel feeds. Intent is recorded before the network call. An ambiguous result becomes `post_unknown` and is never retried. X uses the `@NexuAlpha` keys in `~/.codex/private/x-nexualpha-publisher.env`; `X_BERLIN_*` is never read, and `verifyAccount` requires @NexuAlpha.
- **Unchanged automatic jobs.** The 09:00 SGT `daily-social` card job and the 5-minute `x-poster` on the prod scheduler are deterministic templates and are not touched. Social drafts are an extra, reviewed lane.

```sh
node ops/writer-pipeline/social-batch.mjs --config /abs/config.json   # {"root": "/scratch"} for a smoke test
node ops/writer-pipeline/social-post.mjs list
node --test ops/writer-pipeline/social.test.mjs
```

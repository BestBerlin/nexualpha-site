# SEO on-page recovery — GSC snapshot 2026-10-22

Local branch: `codex/seo-onpage`. No deployment, push or production mutation. Source snapshot windows end 2026-10-19.

## Eligible queries and metadata

The snapshot marks exactly 9 eligible queries across 5 ranking URLs (position 4–70, impressions ≥3, not excluded). Existing ineligible, top-eight-protected and excluded rows are not promoted into this optimization pass.

| Query | Page | Old title (snapshot) | New title |
|---|---|---|---|
| hyperliquid fees | /exchanges/hyperliquid | Hyperliquid fees & wallet setup — referral code NEXU888 (2026) \| NexuAlpha | Hyperliquid fees, rebates & funded account checks (2026) |
| kraken vs binance | /compare/binance-vs-kraken | Binance vs Kraken: fees, KYC & rebates (2026) \| NexuAlpha | Kraken vs Binance: spot fees & KYC (2026) |
| hyperliquid funded account | /exchanges/hyperliquid | Hyperliquid fees & wallet setup — referral code NEXU888 (2026) \| NexuAlpha | Hyperliquid fees, rebates & funded account checks (2026) |
| get funded to trade hyperliquid | /exchanges/hyperliquid | Hyperliquid fees & wallet setup — referral code NEXU888 (2026) \| NexuAlpha | Hyperliquid fees, rebates & funded account checks (2026) |
| binance vs bybit | /compare/binance-vs-bybit | Binance vs Bybit: fees, KYC & rebates (2026) \| NexuAlpha | Binance vs Bybit: spot fees & KYC (2026) |
| gate.io register | /exchanges/gate-io | Gate.io fees, sign-up & KYC — referral code nexubest (2026) \| NexuAlpha | Gate.io register: KYC, fees & code nexubest |
| hyperliquid rebates | /exchanges/hyperliquid | Hyperliquid fees & wallet setup — referral code NEXU888 (2026) \| NexuAlpha | Hyperliquid fees, rebates & funded account checks (2026) |
| kraken ou binance | /compare/binance-vs-kraken | Binance vs Kraken: fees, KYC & rebates (2026) \| NexuAlpha | Kraken vs Binance: spot fees & KYC (2026) |
| okx vs bybit | /compare/okx-vs-bybit | OKX vs Bybit: fees, KYC & rebates (2026) \| NexuAlpha | OKX vs Bybit: spot fees & KYC (2026) |

There is one title per canonical URL. All five titles lead with the primary observed query and fit 60 characters; descriptions fit 155 and use the existing checked fee data. Four Hyperliquid queries cannot all appear verbatim in one 60-character title. Their terms are consolidated in its title/H1 and all four full variants are answered in the two-sentence lead and source-bound FAQs. The Portuguese query “kraken ou binance” landed on the English URL: that page retains English copy and covers the literal variant in a FAQ rather than changing the page language. No separate keyword pages or competing canonical URLs were added.

The comparison first-screen answer, metadata and FAQ read the same checked fee facts. Account tiers, regional eligibility and referral conditions remain explicit. Hyperliquid’s funded-account answer describes personal USDC collateral and excludes an offer of third-party funding; its referral discount is not described as cashback. Invite codes remain data-bound.

## Page decay and history

- Hyperliquid (25→4 impressions): `f232202a` (October 13) retained fee/funded-account wording; `37b7bba9` (October 21) replaced the hero/title with fee/wallet setup copy. Restore fee and funded-account checks within the title budget while keeping current fee facts and boundaries. October 21 is after the measured window, so it cannot be claimed as the cause of this decline.
- OKX registration (70→3): `b2d936bb` (October 19) replaced the original registration title/H1/lead via the existing news override. Restore the historical source title/H1 and copy the source article’s first two sentences exactly; keep existing sourced description and non-English editions. This is a recovery hypothesis, not proof of ranking causality.
- OKX checksum (23→10): feed title/H1/content unchanged over the inspected history. Automatic title budgeting dropped sequence-gap/resynchronization terms. A 47-character override preserves checksum, sequence gaps and resync, with the original source lead and June 23, 2026 date.
- Both article source records are unchanged from October 8 through HEAD. Their “not published” snapshot descriptions came from article-free local metadata fallback, not verified live outages.

## Contextual links

Scoped evidence: [exact source URLs, anchors, placements and rendered source samples](seo-onpage-2026-10-22-links.json). It covers 334 local source pages (312 indexable English articles and 22 venue hubs), excluding global header/footer links. Five distinct referring pages per target were actually rendered with React SSR and their plain anchors were verified inside main content. This is a bounded local graph, not a complete site crawl or live production claim.

| Money page | Before → after distinct scoped sources | Added source→target edges |
|---|---:|---:|
| /compare/binance-vs-okx | 13 → 48 | 35 |
| /compare/binance-vs-bybit | 2 → 32 | 30 |
| /compare/okx-vs-bybit | 0 → 21 | 21 |
| /compare/binance-vs-mexc | 0 → 22 | 22 |
| /compare/okx-vs-mexc | 0 → 19 | 19 |
| /compare/bybit-vs-bitget | 0 → 17 | 17 |
| /compare/hyperliquid-vs-dydx | 0 → 5 | 5 |
| /compare/uniswap-vs-jupiter | 0 → 6 | 6 |
| /compare/binance-vs-kraken | 5 → 50 | 45 |
| /compare/gate-io-vs-mexc | 0 → 7 | 7 |
| /compare/binance-vs-bitget | 0 → 28 | 28 |
| /compare/bitget-vs-okx | 0 → 20 | 20 |
| /compare/bybit-vs-mexc | 0 → 17 | 17 |
| /compare/bitget-vs-mexc | 0 → 10 | 10 |
| /exchanges/bitget | 21 → 21 | 0 |
| /exchanges/okx | 21 → 21 | 0 |
| /exchanges/binance | 21 → 21 | 0 |
| /exchanges/bybit | 21 → 21 | 0 |
| /exchanges/gate-io | 21 → 21 | 0 |
| /exchanges/mexc | 21 → 21 | 0 |
| /exchanges/htx | 22 → 22 | 0 |
| /exchanges/kraken | 21 → 21 | 0 |
| /exchanges/backpack | 22 → 22 | 0 |
| /exchanges/hyperliquid | 23 → 23 | 0 |
| /exchanges/coinw | 21 → 21 | 0 |
| /tokenized-stocks | 23 → 23 | 0 |

Total: 282 added scoped-module contextual comparison edges (some may already have a separate entity-panel link on the same source page). Every one of the 26 scoped money pages has ≥5 distinct sources. Fee/referral intent lives on the existing exchange profiles; all 14 curated comparison pairs and the tokenized-stocks hub are covered. Unrelated generated comparison combinations are not expanded. Existing article/topic link budgets remain bounded; comparison alternatives require a matching venue, and Türkiye eligibility gates remain enforced.

## Snapshot availability warnings

| Snapshot URL | Existing Worker response | Destination |
|---|---|---|
| /compare/bybit-vs-bitget?locale=en | 308 | /compare/bybit-vs-bitget |
| /fr/factbook/backpack | 301 | /fr/exchanges/backpack#sources |
| /tr/factbook/raydium | 301 | /tr/exchanges/raydium#sources |
| /exchanges?locale=es | 308 | /es/exchanges |
| /exchanges/bybit?locale=pt-BR | 308 | /pt-br/exchanges/bybit |

The collector previously rejected all redirects. It now validates and follows up to five same-origin redirects; loops, off-site redirects and HTTP failures still fail. Live description parsing also prevents the article-free fallback from replacing a successfully fetched article’s metadata. The collector now analyzes contextual anchors in already-fetched target HTML, deduplicates canonical sources, excludes noindex and off-site sources, and reports `coverage: gsc-target-sample`, `complete: false` and observed lower-bound inlinks. It no longer unconditionally skips analysis. The no-unmatched-radar message is informational and now lives in notes.

## Validation

- All 34 tests across the five changed test files passed with `node --test --test-force-exit --test-concurrency=1 --test-timeout=120000 tests/compare-striking-distance.test.mjs tests/crosslinks.test.mjs tests/striking-answer-first-2026-10-18.test.mjs tests/seo-onpage-gsc-2026-10-22.test.mjs tests/seo-onpage-links.test.mjs` from `pilot-01-prototype`.
- `npm run typecheck` and `git diff --check` passed.
- Strict build-budget check passed: home entry static closure 349,783 bytes gzip, limit 350,000.
- Broader existing title/description checks (`node --test --test-force-exit tests/title-budget.test.mjs tests/seo-onpage-metadata-length.test.mjs`) gave 7 passes and 1 pre-existing failure: the unchanged 67-character home brand title is tested against a generic 60-character ceiling. Existing branded-home tests separately allow 70; neither the home copy nor that title-budget test was changed.
- Build prerequisites missing from this worktree were recovered from the shared checkout into ignored local paths: the exact pinned Paraglide plugin cache (settings byte-identical, hashes checked) and the empty `.openai/hosting.json`. No dependency or tracked build configuration was changed.
- A sandbox listener probe returned `EPERM` for `127.0.0.1:4387`; responsive browser QA could not run. Real React SSR was verified. Better Design calls were blocked by the existing account quota; no account was created.

`npm run build` completed successfully, including 2,719 prerendered routes, Sites packaging and strict budgets. `node scripts/verify-build-budget.mjs --strict` also passed separately. Build-only changes in 10 tracked generated files were restored to HEAD; the intentional Worker SEO projection remains. Local staging was blocked with exit 128: Git cannot create `/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-seo-onpage/index.lock` (`Operation not permitted`). No commit was created; all scoped changes remain reviewable in this worktree, as allowed by the shared brief’s sandbox fallback. No SEO ranking, indexing, traffic, registration or conversion improvement is claimed from local tests.

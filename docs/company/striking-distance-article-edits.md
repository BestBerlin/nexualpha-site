# Striking-distance article edits — 2026-10-11

Edit list for article pages that already earn Google impressions at average position 4–30 (baseline:
`docs/company/striking-distance-2026-10-11.md` / `.json`, Search Console 2026-07-11..2026-10-09). The striking lane does not
republish articles; the lead applies these through the content publisher.

Rules for every edit below:

- Claims stay inside each article's existing `sources` (listed per article). Nothing here adds a number, date, ranking or
  eligibility statement that the article body does not already carry from those sources.
- Titles are at most 60 display columns (`titleDisplayWidth`; CJK counts 2). Descriptions are at most 160 characters
  (80 for zh text). The publisher's `seo.title` / `seo.description` and the visible `title` / `summary` should match.
- "Short answer" = the first paragraph under `## The short answer` (content-lane rule). Where the article opens with
  `## Direct answer` or a "NexuAlpha direct answer:" line, replace that opening paragraph with the text given here.
- Internal links point only to indexable pages that exist today (checked against the live feed, `seo.noindex === false`).
- Many summaries are the generator boilerplate "A source-mapped NexuAlpha decision brief for … It separates verified
  facts, editorial interpretation and unknowns before action." That sentence is the search snippet today and says nothing
  about the query; replacing it is the single highest-value change in this list.

## Target list (20 pages) and what happens to each

Query-level rows (each [query, page] row ≥ 3 impressions at position 4–30) produced only 11 pages on this small property,
so the list also uses the snapshot's page-level supplement (page average 4–30, ≥ 3 impressions, queries hidden or thin).

| # | Page | Baseline (90d impr / avg pos) | Action |
|---|---|---|---|
| 1 | `/news` | 83 / 10.8 | **Code (PR):** title, description, H1, intro name exchange news + covered venues |
| 2 | `/news/how-to-register-okx-account-verify-identity-safely` | 59 / 8.4 | Article edit #3 |
| 3 | `/news/okx-usd-to-usdc-spot-pair-migration` | 49 (+17 `?locale=en`) / 6.7 | Article edit #4 |
| 4 | `/news/hyperliquid-vs-dydx` | 50 / 8.2 | Article edit #5 |
| 5 | `/news/bybit-v5-api-rate-limit-header-retry-budget-checklist` | 27 / 6.6 | Article edit #6 |
| 6 | `/news/dtc-tokenization-service-vs-sec-tokenized-securities-venue-market-function-comparison` | 25 / 15.3 | Article edit #9 |
| 7 | `/news/bybit-vs-okx-api-key-ip-binding-expiry-withdraw-permission-controls` | 23 / 5.7 | Article edit #8 |
| 8 | `/news/okx-order-book-checksum-deprecation-sequence-integrity-radar` | 22 / 4.0 | Article edit #7 |
| 9 | `/exchanges/deribit` | 22 / 11.0 (`deribit fees` 35, `deribit mark price` 32) | **Code (PR):** fees-first title ≤ 60, description, H1 |
| 10 | `/zh-hans/news/how-to-verify-binance-travel-rule-address-book-satoshi-test` | 13 / 7.5 | Article edit #1 (noindex blocker) |
| 11 | `/news/binance-sbe-vs-coinbase-websocket-market-data-schema-control-checklist` | 12 / 8.8 | Article edit #2 |
| 12 | `/news/how-to-create-gemini-account-verify-identity-and-set-withdrawal-protection` | 12 / 28.5 | Article edit #15 |
| 13 | `/exchanges/backpack` | 11 / 6.3 (`backpack fee` 6) | **Code (PR):** fees-first referral title ≤ 60 (code from partner feed) |
| 14 | `/topics/no-kyc` | 10 / 11.9 (`does hyperliquid require kyc` 64) | **Code (PR):** sourced FAQ "Does Hyperliquid require KYC?" (en, zh-Hans, zh-Hant + FAQPage schema) |
| 15 | `/news/circle-cctp-v2-usdc-fast-transfer-hooks-and-finality-risk-map` | 4 / 6.8 | Article edit #10 |
| 16 | `/news/how-to-set-up-kraken-global-settings-lock-safely` | 4 / 7.0 | Article edit #11 |
| 17 | `/news/okx-api-upcoming-changes-websocket-amend-cancel-order-controls` | 9 / 22.8 | Article edit #12 |
| 18 | `/news/okx-api-kyc-order-tagged-rate-limit-migration-checklist` | 4 / 21.5 | Article edit #13 |
| 19 | `/news/binance-local-order-book-vs-okx-checksum-depth-controls` | 3 / 6.3 | Article edit #14 (accuracy check) |
| 20 | `/news/how-to-set-up-binance-anti-phishing-code` | 3 / 24 | Article edit #16 |

Looked at and left alone: `/` (54 / 6.9, every query hidden; title already matches the commercial intent);
`/exchanges/hyperliquid` (`hyperliquid cashback` 25.8 — the page already answers it in an FAQ; adding "cashback" to the
title would promise something the page explicitly does not); `/exchanges/aerodrome` (17 / 10.4, queries hidden, title
already fits); `/factbook/gmx` (6 / 6.0, queries hidden; the factbook title template is pinned by several existing tests);
`/es/exchanges/hyperliquid` and `/vi/exchanges/uniswap` (noindex editions); `/compare/gate-io-vs-coinbase`
(10 / 10.0, `gate io vs coinbase` 21 — now 301s to `/compare/coinbase-vs-gate-io`, which is a generated, **noindex**
pair: the ranking will be lost unless the pair becomes a curated page; owner decision, not changed here).

Order = combined striking score (impressions × closeness to the top 10). Baseline columns: page-level impressions /
average position over 90 days, then the visible queries Google reports for the page.

---

## 1. `/zh-hans/news/how-to-verify-binance-travel-rule-address-book-satoshi-test`

Baseline: 13 impr, pos 7.5 — query `binance satoshi test` (13 / 0 clicks / 7.5).

**Blocker first:** the article's `seo.noindex` is `true` and the live zh-Hans page serves `noindex,follow`, so this
ranking will disappear. An indexable English sibling exists (`/news/binance-travel-rule-address-book-satoshi-test-checklist`).
Decide one of: (a) pass this article through the quality gate (`seo.noindex = false`) with the edits below, or
(b) keep it noindex and apply the same zh-Hans title/summary to the indexable sibling's zh-Hans edition. Do not run both
as indexable pages for the same query.

Sources: Binance Support — What Is the Travel Rule?; What Is Satoshi Test and Travel Rule Address Book Feature?;
Crypto Deposit/Withdrawal FAQ; Travel Rule: Crypto Transfer Procedures.

- New zh-Hans title (56): `币安 Satoshi Test 怎么做：Travel Rule 地址簿安全核验步骤`
- New zh-Hans summary / meta (≤80): `币安 Satoshi Test 用一笔小额转账证明你控制自托管钱包地址；先在官方页面确认 Travel Rule 要求，再保存地址簿信息。`
- New zh-Hans short answer:
  > 币安的 Satoshi Test 是通过一笔小额加密货币转账，证明你控制某个自托管钱包地址。只从币安官方页面进入流程：先确认这笔充值或提现是否适用 Travel Rule，再按要求填写发送方或接收方信息；验证通过后，Travel Rule 地址簿可以保存这些信息，用于预先核验以后的转账。不要在站外透露验证码或助记词，复用地址前先检查已保存的信息是否仍然准确。
- English edition (if published): title `How to Pass the Binance Satoshi Test and Travel Rule Address Book` (61 → drop "the":
  `How to Pass Binance Satoshi Test and Travel Rule Address Book`, 60).
- Internal links to add: `/zh-hans/exchanges/binance`; `/news/binance-one-step-withdrawal-whitelist-limit-control-checklist`;
  `/news/how-to-enable-binance-withdrawal-whitelist-address-limit-safely`; `/news/category/guide`.

## 2. `/news/binance-sbe-vs-coinbase-websocket-market-data-schema-control-checklist`

Baseline: 12 impr, pos 8.8 — `binance sbe` (9 / 0 / 9.1), `binance sbe market data` (3 / 0 / 8). This article is also
the main page of the `exchange-api` topic cluster, so every API article already links to it.

Sources: Binance Developers — SBE Market Data; SBE FAQ. Coinbase Developer Docs — Advanced Trade WebSocket Channels;
Advanced Trade WebSocket Endpoints.

- New title (55): `Binance SBE Market Data vs Coinbase WebSocket Checklist`
- New description (≤160): `Binance SBE market data needs schema decoding, version pinning and a fallback parser; Coinbase WebSocket needs channel, endpoint and JWT checks before trading.`
- New short answer:
  > Binance SBE (Simple Binary Encoding) market data and Coinbase Advanced Trade WebSocket channels solve different integration problems, so the question is not which feed is faster. Use Binance SBE only after schema decoding, version pinning and fallback parsing are tested; use Coinbase WebSocket only after channel selection, endpoint separation, JWT boundaries and reconnect reconciliation are tested. Pause if a bot treats either feed as complete account state.
- Internal links to add: `/news/binance-vs-okx-websocket-rate-limit-session-controls`;
  `/news/crypto-api-binary-protocol-json-fallback-disclosure-radar`; `/news/okx-sbe-order-entry-private-data-api-migration-readiness`;
  `/exchanges/binance`; `/exchanges/coinbase`.

## 3. `/news/how-to-register-okx-account-verify-identity-safely`

Baseline: 59 impr, pos 8.4 (page level; queries mostly hidden) — visible `okx register` (1 / 16).

Sources: OKX Help — How Do I Register an Account on OKX?; How Do I Verify an Individual Account?

- New title (54): `OKX Register Guide: Sign Up and Verify Identity Safely`
- New description (≤160): `Register on OKX only through the official site or app, choose the region where you ordinarily live, then verify identity from your signed-in account settings.`
- New short answer (tightened from the current direct answer; same facts):
  > To register on OKX, use only the official website or app and choose the country or region where you currently and ordinarily reside — OKX says residence can decide the service entity and the features you get. Verify your email and phone (each can register only one account), set a unique password, then start individual identity verification from the signed-in verification page or the app's account settings. Approval does not guarantee every product, so check the products and limits your account actually shows before funding it.
- Internal links to add: `/exchanges/okx` (keep the commission disclosure line wherever the OKX code/link appears);
  `/news/how-to-set-up-okx-passkey-and-withdrawal-address-book-safely`; `/news/okx-withdrawal-address-verification-allowlist-controls`;
  `/compare/binance-vs-okx`.
- Inbound link to add (site code, follow-up): the OKX profile has no "guides" link block today; a link from
  `/exchanges/okx` to this article is the strongest internal signal available for "okx register".

## 4. `/news/okx-usd-to-usdc-spot-pair-migration`

Baseline: 49 impr, pos 6.7 (+17 impr, pos 6.2 on the `?locale=en` variant, which now 308-redirects to the canonical).
Queries hidden.

Sources: OKX Help — OKX to migrate USD spot trading pairs; Changes to USD spot trading pairs; OKX API changelog;
Unified USD Orderbook FAQ; Circle — Transparency & Stability; USDC Terms.

The site already overrides this head in `SERP_CTR_NEWS_OVERRIDES` (live title "OKX USD to USDC Migration: API, Orders and
Bot Checklist"). Keep one source of truth: write the override's text into the feed so both agree, and add the date.

- New title (59): `OKX USD to USDC Migration (Sept 2026): API, Orders and Bots`
- New description (≤160): `OKX moved affected Crypto-USD spot pairs to Crypto-USDC in September 2026. Check open orders, bots, API instId and tradeQuoteCcy before a live change.`
- Short answer: keep the current direct answer; change its first sentence to past tense to match the historical schedule
  ("OKX migrated affected `Crypto-USD` spot pairs to replacement `Crypto-USDC` pairs on the September 2026 schedule.").
- Internal links to add: `/news/okx-usd-usdc-spot-order-book-migration-api-bot-checklist` (sibling — link both ways);
  `/exchanges/okx`.
- After republishing, update `SERP_CTR_NEWS_OVERRIDES["okx-usd-to-usdc-spot-pair-migration"]` to the same text (or remove it).

## 5. `/news/hyperliquid-vs-dydx`

Baseline: 50 impr, pos 8.2 (page level). Visible: `hyperliquid vs dydx` (2 / pos 71.5) — Google ranks the exact-match
query far lower than the page average, which suggests it splits the query with `/compare/hyperliquid-vs-dydx`.

Sources: Hyperliquid Docs — Fees, Funding, Liquidations, Oracle, Clearinghouse. dYdX Help Center — Trading fees,
Default funding rates, Liquidations, Oracle prices, Default Liquidity Tiers.

- Title: keep the live override `Hyperliquid vs dYdX: Fees, Funding and Liquidation` (50); copy it into the feed `seo.title`.
- Description: keep the live override.
- New short answer (fees-first, same sources):
  > Hyperliquid and dYdX are both perpetual DEX venues, but they price and liquidate differently. Hyperliquid fee tiers use rolling 14-day volume with separate perp and spot schedules and hourly funding; dYdX uses trailing 30-day taker volume with governance-adjustable funding parameters. Hyperliquid tries order-book liquidation first with a liquidator vault backstop; dYdX documents liquidity tiers, validator oracle prices and protocol-generated liquidation matches. Public docs do not prove your final fee, liquidity or regional access.
- Internal links: make the first link in the body point to `/compare/hyperliquid-vs-dydx` with the anchor "side-by-side
  Hyperliquid vs dYdX comparison", and keep `/exchanges/hyperliquid`, `/exchanges/dydx`, `/topics/derivatives`.

## 6. `/news/bybit-v5-api-rate-limit-header-retry-budget-checklist`

Baseline: 27 impr, pos 6.6 — visible `bybit api rate limits` (1 / 10).

Sources: Bybit API Documentation — Rate Limit Rules; Error Codes; V5 API Introduction.

- New title (59): `Bybit API Rate Limits (V5): Headers, 10006 and Retry Budget`
- New description (≤160): `Bybit V5 rate limits are not one number: HTTP IP limits, WebSocket connection limits and per-UID endpoint limits, with response headers for the current budget.`
- New short answer:
  > Bybit V5 API rate limits are not a single number. The official rate-limit page separates HTTP IP limits, WebSocket IP connection limits and endpoint-level per-UID limits, and returns response headers that describe the current endpoint budget. Budget retries from those headers, handle retCode 10006 and a 403 with a cooldown instead of reconnecting blindly, and reconcile any throttled order action before resending it.
- Internal links to add: `/news/bybit-v5-api-timestamp-recv-window-rate-limit-checklist`;
  `/news/how-to-set-up-bybit-api-key-read-only-ip-restriction-safely`; `/exchanges/bybit`.

## 7. `/news/okx-order-book-checksum-deprecation-sequence-integrity-radar`

Baseline: 22 impr, pos 4.0 (queries hidden). Current title is 89 characters and truncated in results.

Sources: OKX — Order Book Channels Checksum Field Deprecation; OKX API Changelog; Order Book Channel Documentation;
Kraken Futures WebSocket Book Sequence Reference.

- New title (59): `OKX Order Book Checksum Deprecated: Use seqId and prevSeqId`
- New description (≤160): `Since June 23, 2026 OKX's order-book checksum is fixed to zero on books, books-l2-tbt and books50-l2-tbt. Validate seqId and prevSeqId and resync on a gap.`
- Short answer: keep the current direct answer (already answers the query in its first two sentences).
- Internal links to add: `/news/binance-local-order-book-vs-okx-checksum-depth-controls` (link both ways);
  `/news/crypto-order-book-sequence-checksum-gap-recovery-disclosure-radar`; `/exchanges/okx`.

## 8. `/news/bybit-vs-okx-api-key-ip-binding-expiry-withdraw-permission-controls`

Baseline: 23 impr, pos 5.7 (queries hidden). Summary is generator boilerplate.

Sources: Bybit API Documentation — Get API Key Information; FAQ; Error Codes. OKX — API Guide; OKX API FAQ.

- New title (58): `Bybit vs OKX API Keys: IP Binding, Expiry, Withdraw Access`
- New description (≤160): `Bybit API keys without bound IPs can expire after 90 days; OKX keys can bind up to 20 IPs, and unbound trade or withdraw keys can expire after 14 idle days.`
- New short answer:
  > Bybit and OKX both let you restrict API keys, but the expiry rules differ. Bybit's FAQ says keys created without bound IP addresses can expire after 90 days, and its V5 API reports read-only status, permission groups and remaining validity days. OKX keys can carry Read, Trade and Withdraw permissions and bind up to 20 IP addresses; trade or withdraw keys without IP binding can expire after 14 days of inactivity. Give each key the smallest permission set, bind IPs where possible and plan a rotation date before funds move.
- Internal links to add: `/news/how-to-set-up-okx-subaccount-api-permissions-and-ip-binding-safely`;
  `/news/how-to-set-up-bybit-api-key-read-only-ip-restriction-safely`; `/news/bybit-vs-okx-subaccounts-risk-isolation-api-controls`.

## 9. `/news/dtc-tokenization-service-vs-sec-tokenized-securities-venue-market-function-comparison`

Baseline: 25 impr, 2 clicks, pos 15.3 — visible `site.sec.gov "34-106402"` variants (pos 4–9.5). Searchers look for
the SEC order by number; the title does not contain it.

Sources: DTCC — DTC tokenization service development; Tokenization service FAQ. SEC — Order 34-106402.

- New title (53): `SEC Order 34-106402 (TSV) vs DTC Tokenization Service`
- New description (≤160): `SEC Order 34-106402 defines a Tokenized Securities Venue as a permissioned AMM venue for tokenized NMS stock; DTC's service covers post-trade records.`
- New short answer:
  > SEC Order 34-106402 defines a Tokenized Securities Venue (TSV) as a permissioned venue that uses one or more automated market maker liquidity pools for tokenized NMS stock, under a temporary exemption. DTC's tokenization service is different infrastructure: it covers eligible securities records, registered participant wallets and lifecycle processing inside regulated post-trade systems. Map issuance, ownership record, custody, trading, clearing, settlement and corporate actions separately rather than treating either label as a full market stack.
- Internal links to add: `/news/sec-innovation-exemption-tokenized-nms-stock-tsv-risk-map`;
  `/news/dtcc-tokenization-service-faq-governance-investor-protection-map`; `/topics/tokenized-assets`; `/news/category/regulation`.

## 10. `/news/circle-cctp-v2-usdc-fast-transfer-hooks-and-finality-risk-map`

Baseline: 4 impr, pos 6.8 — `is circle cctp an open protocol that any developer can integrate?` (4 / 6.8). Main page of
the `usdc-cctp` cluster.

Sources: Circle Help — Getting started with CCTP; What is the USDC Bridge?; Transfer times and status explained.
Circle — CCTP V2: The future of cross-chain.

- New title (59): `Circle CCTP V2: Fast Transfer, Hooks and Finality Explained`
- New description (≤160): `Circle describes CCTP as a permissionless onchain utility that moves native USDC across chains by burning and minting. V2 adds Fast Transfer and Hooks.`
- New short answer:
  > Circle describes CCTP as a permissionless onchain utility for moving USDC between blockchains by burning it on the source chain and minting native USDC on the destination, not as a wrapped-token bridge. CCTP V2 is the canonical version (V1 is legacy with no new chains or features). V2 Fast Transfer can settle in seconds, Standard Transfer follows the source chain's finality, and Hooks let developers automate actions after the transfer.
- Internal links to add: `/news/circle-cctp-v2-attestation-supported-chain-transfer-risk-map`;
  `/news/circle-gateway-vs-cctp-unified-balance-transfer-boundary-map`; `/news/circle-noble-usdc-cctp-v1-winddown-exit-redemption-timeline`.

## 11. `/news/how-to-set-up-kraken-global-settings-lock-safely`

Baseline: 4 impr, pos 7.0 — `global settings lock` (4 / 7). Current title is 84 characters.

Sources: Kraken Support — Setting Up the Global Settings Lock; What Is the Global Settings Lock?; What Is a Master Key?;
I Can't Unlock My Account Settings.

- New title (52): `Kraken Global Settings Lock: How to Set It Up Safely`
- New description (≤160): `Kraken's Global Settings Lock blocks account-setting changes. Create a Master Key first: without one, unlocking waits 1–30 days and support cannot speed it up.`
- Short answer: keep the current direct answer (it already answers the query).
- Internal links to add: `/news/kraken-master-key-gsl-api-key-change-disclosure-radar`;
  `/news/bitstamp-withdrawal-whitelist-vs-kraken-global-settings-lock-control-map`; `/exchanges/kraken`.

## 12. `/news/okx-api-upcoming-changes-websocket-amend-cancel-order-controls`

Baseline: 9 impr, pos 22.8 — `okx api doc` (9 / 22.8). Navigational query: searchers want OKX's own docs, so the page
can at best rank as the companion read. Low expected gain; cheap edit.

Sources: OKX API Documentation — Upcoming Changes; WebSocket amend order; WebSocket cancel order.

- New title (57): `OKX API Docs: Upcoming WebSocket Amend and Cancel Changes`
- New description (≤160): `Where the OKX API docs list upcoming changes, and what to test before WebSocket amend or cancel changes reach production: rate limits, order IDs and rollback.`
- Short answer: first sentence names the official page — "The OKX API docs publish an Upcoming Changes section
  (okx.com/docs-v5); treat each WebSocket amend or cancel change there as an order-lifecycle migration …" (rest unchanged).
- Internal links: link #13 below and `/news/binance-vs-okx-websocket-rate-limit-session-controls`.

## 13. `/news/okx-api-kyc-order-tagged-rate-limit-migration-checklist`

Baseline: 4 impr, pos 21.5 — `okx api doc` (4 / 21.5). Competes with #12 for the same query.

Sources: OKX API Documentation — Upcoming Changes; V5 API Guide; API Documentation Root.

- New title (53): `OKX API Docs: KYC and Order-Tagged Rate Limit Changes`
- New description (≤160): `Before routing orders through the OKX API, record KYC level, key scope, endpoint, tag-level throttles and a stop rule for 429s, per the OKX API docs.`
- Short answer: replace the opening "API change management should be handled as …" sentence with: "OKX's API docs can tie
  order access and rate limits to KYC level, endpoint and request tag, so verify all three before production routing."
- Internal links: link #12 and `/news/okx-api-upcoming-changes-websocket-amend-cancel-order-controls` ↔ each other.

## 14. `/news/binance-local-order-book-vs-okx-checksum-depth-controls`

Baseline: 3 impr, pos 6.3 — `site.developers.binance.com "how to manage a local order book correctly"` (3 / 6.3):
the searcher wants Binance's "How to manage a local order book correctly" procedure.

Sources: Binance Developers — Spot WebSocket Market Streams; How to manage a local order book correctly. OKX API Docs —
Order book channel.

- New title (57): `How to Manage a Local Order Book: Binance vs OKX Checksum`
- New description (≤160): `Bootstrap from a snapshot, apply deltas in order, detect sequence or checksum breaks and rebuild before stale depth reaches a strategy: Binance vs OKX.`
- Short answer: keep the current direct answer; add one sentence linking Binance's own guide by its title
  ("Binance's developer guide 'How to manage a local order book correctly' describes the snapshot-plus-delta procedure.").
- Internal links to add: #7 (`/news/okx-order-book-checksum-deprecation-sequence-integrity-radar`).
- **Accuracy check before republishing:** this article (published 2026-09-20) frames OKX depth validation around the
  checksum, while #7 cites OKX's notice that the checksum on books, books-l2-tbt and books50-l2-tbt is fixed to zero since
  June 23, 2026 and that seqId/prevSeqId should be used instead. Align the OKX half with that notice (same source set as #7)
  before the head is promoted; otherwise the higher-ranking page would carry outdated guidance.

## 15. `/news/how-to-create-gemini-account-verify-identity-and-set-withdrawal-protection`

Baseline: 12 impr, pos 28.5 — `gemini verify identity` (8 / 27.9), `gemini id verification` (4 / 29.8). Summary is
generator boilerplate.

Sources: Gemini Support — apply through the app; verify identity in the app; documents required; two-factor
authentication; What is Withdrawal Protection.

- New title (60): `Gemini Identity Verification and Withdrawal Protection Guide`
- New description (≤160): `Gemini identity verification asks for a clear photo ID and may need a government ID plus face scan. Then set 2FA and Withdrawal Protection's 7-day hold.`
- New short answer:
  > To verify your identity on Gemini, upload a clear photo ID inside the official app or site; Gemini says some users may also need a valid government ID plus a biometric face scan. 2FA is required and passkeys are recommended. Before large balances arrive, add withdrawal addresses early: Withdrawal Protection can impose a 7-day wait on newly added addresses, and EU, EEA and UK approved addresses have a 7-day approval hold.
- Internal links to add: `/news/how-to-set-up-gemini-passkeys-and-approved-addresses-safely`;
  `/news/gemini-vs-coinbase-withdrawal-protection-vault-delay-controls`; `/news/category/guide`.

## 16. `/news/how-to-set-up-binance-anti-phishing-code`

Baseline: 3 impr, pos 24 — `how to create anti phishing code` (3 / 24).

Sources: Binance Support — What Is an Anti-Phishing Code and How to Set It up; Examples of Phishing Emails; How to
Protect Your Binance Account from Scam; What Is Binance Verify.

- New title (59): `How to Create a Binance Anti-Phishing Code (6–8 Characters)`
- New description (≤160): `Create your Binance anti-phishing code on the signed-in Security page: 6–8 characters from at least three of upper, lower, digits and underscore.`
- Short answer: keep the current direct answer; move the setup steps (signed-in Security page, choose the code, confirm
  with 2FA or passkey) into the first two sentences so the "how to create" answer comes before the explanation.
- Internal links to add: `/news/how-to-set-up-binance-authenticator-2fa-scenario-controls-safely`;
  `/news/how-to-enable-binance-withdrawal-whitelist-address-limit-safely`; `/exchanges/binance`.

## Not edited (reasons)

- `/news/cex-vs-dex-vs-perp-dex` (15 impr, pos 17.4; visible `dex vs cex for perpetuals` at 87.5): title and short answer
  already match; the visible query ranks too deep for a head change to matter. Revisit at the 2-week re-measure.
- `/news/bybit-tradfi-cfd-leverage-upgrade-margin-release-risk-radar`, `/news/binance-spot-api-rate-limit-websocket-order-control-checklist`,
  `/news/bybit-vs-okx-subaccounts-risk-isolation-api-controls` (12–15 impr, pos 5–7): queries hidden; next batch.

# NexuAlpha Keyword Map v1 (English core, 120 queries)

Status: draft for owner review. Research only; no site code changed. Prepared 2026-10-08.

## 0. Read this first (honesty notes)

1. **Baseline evidence file not found.** The path `docs/evidence/four-week-growth-20260927/gsc-live-baseline-20260929.md` does not exist in this checkout (`docs/` contains only `design-directions/`). Performance figures below are taken from the brief: **3 clicks / 773 impressions / average position about 26 over 3 weeks; top queries "hyperliquid fees" and "uniswap testnet"**. Re-check against the real GSC export before committing to the priorities.
2. **Difficulty is a judgement, not a measurement.** I had no Ahrefs/Semrush/GSC API. I ran 16 sample queries through the WebSearch tool (US-only, not Google itself, no rank positions, no personalisation). It shows *which kinds of domains* surface, not exact rank. Where a row says "probed" the evidence is in section 4; every other difficulty value is a guess from brand strength and the type of page that normally ranks.
3. **Honest SERP read.** For "referral code" queries the probed results were mostly thin or user-generated pages (flux.ai, intercom help-center clones, together.ai shares, wokwi, spotify/audible podcast pages, notion, discourse). No exchange-owned page appeared in the tool's top 10 for those. That suggests the *quality bar* is low, **but** real Google results will also carry the exchange's own referral page and large affiliates (not visible here), and Google may demote the thin pages. Treat referral-code queries as "winnable on trust and accuracy, not on volume". For fee and comparison queries the established reviewers (coinbureau, nerdwallet, finder, brokerchooser, datawallet, coinledger, tradersunion, cointelegraph) dominate, so those are hard for a new domain with about 26 average position. Reddit did not surface in the probed results, which is not proof it is absent on Google.
4. **Not a legal opinion.** Any copy touching referral CTAs must follow `region-compliance-v1.md` and be reviewed by counsel where flagged.
5. **No search volumes.** I have none and did not invent any. Priority is by (a) already earning impressions, (b) existing page on site, (c) commercial intent, (d) probed beatability, (e) compliance risk.

## 1. Existing site URL inventory (from `pilot-01-prototype/public/sitemap.xml`, 861 URLs)

- Exchange pages: `/exchanges/{slug}` exist for binance, bybit, bitget, okx, coinbase, kraken, kucoin, mexc, gate-io, hyperliquid, uniswap (plus others). **There is no `/exchanges/htx`** (only `/factbook/htx`).
- Comparison pages that exist: binance-vs-bybit, binance-vs-kraken, binance-vs-mexc, binance-vs-okx, bybit-vs-bitget, gate-io-vs-mexc, hyperliquid-vs-dydx, okx-vs-bybit, okx-vs-mexc, uniswap-vs-jupiter (`/compare/{a}-vs-{b}`).
- Other: `/factbook/{slug}`, `/topics/compliant-exchanges`, `/topics/no-kyc`, `/rates`, `/methodology`, locale hubs `/br`, `/pt-br`, `/es`, `/mx`, `/vi`, `/tr`, `/id`, `/id-id`, `/uk`, `/us`, `/eu`, `/de`, `/fr`, `/it`, `/ar`, and Brazil pages `/br/pix`, `/br/kyc-cpf`, `/br/custos`, `/br/comparar`, `/br/conta`, `/br/saque-pix`.
- The sitemap is dominated by `/zh-hans/*` (about 313 news URLs plus mirrors). English long-tail intent pages (referral, fees, legit, availability) are the main gap.
- "(exists)" in the table means the URL pattern is in the sitemap; "(new)" means it must be created. Do not create a page unless a template and facts source are ready (see rule 3 in section 6).

## 2. Keyword map (120 rows)

Intent key: Referral = referral code / sign-up bonus; Fees; Vs = comparison; Trust = legit/safe; Availability = available/legal in a country.
Uniswap and Hyperliquid: Uniswap has no exchange-style referral programme to promote, so its rows are informational and build topical authority; Hyperliquid's referral is a fee discount (verified in its docs), not a cash bonus.

| # | Exchange | Query | Intent | Target URL (site) | Page type | Difficulty (guess) | Pri |
|---|---|---|---|---|---|---|---|
| 1 | Binance | binance referral code | Referral | `/exchanges/binance/referral-code (new)` | Referral explainer + CTA | Hard (official + affiliates + spam) | P0 |
| 2 | Binance | binance sign up bonus | Referral | `/exchanges/binance/referral-code (new)` | Referral explainer + CTA | Hard | P1 |
| 3 | Binance | binance fees | Fees | `/exchanges/binance/fees (new)` | Fee explainer | Hard (official fee page + coinbureau-class) | P1 |
| 4 | Binance | binance withdrawal fees | Fees | `/exchanges/binance/fees#withdrawal (new)` | Fee table | Medium | P2 |
| 5 | Binance | binance vs okx | Vs | `/compare/binance-vs-okx (exists)` | Comparison | Hard | P0 |
| 6 | Binance | binance vs bybit | Vs | `/compare/binance-vs-bybit (exists)` | Comparison | Hard | P0 |
| 7 | Binance | binance vs coinbase | Vs | `/compare/binance-vs-coinbase (new)` | Comparison | Hard | P1 |
| 8 | Binance | is binance legit | Trust | `/exchanges/binance/is-it-legit (new)` | Trust FAQ | Hard | P1 |
| 9 | Binance | is binance legal in brazil | Availability | `/br/binance-legalidade (new; locale hub /br exists)` | Availability FAQ | Medium | P0 |
| 10 | Binance | is binance available in the uk | Availability | `/exchanges/binance/availability/uk (new)` | Availability FAQ | Medium | P1 |
| 11 | OKX | okx referral code | Referral | `/exchanges/okx/referral-code (new)` | Referral explainer + CTA | Hard | P0 |
| 12 | OKX | okx sign up bonus | Referral | `/exchanges/okx/referral-code (new)` | Referral explainer + CTA | Hard | P1 |
| 13 | OKX | okx fees | Fees | `/exchanges/okx/fees (new)` | Fee explainer | Hard | P0 |
| 14 | OKX | okx vs bybit | Vs | `/compare/okx-vs-bybit (exists)` | Comparison | Hard | P0 |
| 15 | OKX | okx vs binance | Vs | `/compare/binance-vs-okx (exists)` | Comparison | Hard | P1 |
| 16 | OKX | okx vs mexc | Vs | `/compare/okx-vs-mexc (exists)` | Comparison | Medium | P1 |
| 17 | OKX | is okx legit | Trust | `/exchanges/okx/is-it-legit (new)` | Trust FAQ | Hard | P1 |
| 18 | OKX | is okx safe | Trust | `/exchanges/okx/is-it-legit (new)` | Trust FAQ | Hard | P2 |
| 19 | OKX | is okx available in the us | Availability | `/exchanges/okx/availability/us (new)` | Availability FAQ | Medium | P1 |
| 20 | OKX | is okx available in the uk | Availability | `/exchanges/okx/availability/uk (new)` | Availability FAQ | Medium | P2 |
| 21 | Bybit | bybit referral code | Referral | `/exchanges/bybit/referral-code (new)` | Referral explainer + CTA | Hard | P0 |
| 22 | Bybit | bybit sign up bonus | Referral | `/exchanges/bybit/referral-code (new)` | Referral explainer + CTA | Hard | P1 |
| 23 | Bybit | bybit fees | Fees | `/exchanges/bybit/fees (new)` | Fee explainer | Hard | P1 |
| 24 | Bybit | bybit vs bitget | Vs | `/compare/bybit-vs-bitget (exists)` | Comparison | Hard | P0 |
| 25 | Bybit | bybit vs okx | Vs | `/compare/okx-vs-bybit (exists)` | Comparison | Hard | P1 |
| 26 | Bybit | bybit vs binance | Vs | `/compare/binance-vs-bybit (exists)` | Comparison | Hard | P1 |
| 27 | Bybit | is bybit legit | Trust | `/exchanges/bybit/is-it-legit (new)` | Trust FAQ | Hard | P1 |
| 28 | Bybit | is bybit safe | Trust | `/exchanges/bybit/is-it-legit (new)` | Trust FAQ | Hard | P2 |
| 29 | Bybit | is bybit available in the us | Availability | `/exchanges/bybit/availability/us (new)` | Availability FAQ | Medium (many thin gts.ai/ufovpn pages, plus fool.com, benzinga, tradersunion) | P0 |
| 30 | Bybit | is bybit legal in the uk | Availability | `/exchanges/bybit/availability/uk (new)` | Availability FAQ | Medium | P0 |
| 31 | Bitget | bitget referral code | Referral | `/exchanges/bitget/referral-code (new)` | Referral explainer + CTA | Hard | P0 |
| 32 | Bitget | bitget sign up bonus | Referral | `/exchanges/bitget/referral-code (new)` | Referral explainer + CTA | Hard | P1 |
| 33 | Bitget | bitget fees | Fees | `/exchanges/bitget/fees (new)` | Fee explainer | Hard | P1 |
| 34 | Bitget | bitget vs bybit | Vs | `/compare/bybit-vs-bitget (exists)` | Comparison | Hard | P1 |
| 35 | Bitget | bitget vs binance | Vs | `/compare/binance-vs-bitget (new)` | Comparison | Hard | P1 |
| 36 | Bitget | bitget vs okx | Vs | `/compare/okx-vs-bitget (new)` | Comparison | Hard | P2 |
| 37 | Bitget | is bitget legit | Trust | `/exchanges/bitget/is-it-legit (new)` | Trust FAQ | Hard | P1 |
| 38 | Bitget | is bitget safe | Trust | `/exchanges/bitget/is-it-legit (new)` | Trust FAQ | Hard | P2 |
| 39 | Bitget | is bitget available in the us | Availability | `/exchanges/bitget/availability/us (new)` | Availability FAQ | Medium | P1 |
| 40 | Bitget | bitget copy trading fees | Fees | `/exchanges/bitget/fees#copy-trading (new)` | Fee explainer | Medium | P2 |
| 41 | Coinbase | coinbase referral code | Referral | `/exchanges/coinbase/referral-code (new)` | Referral explainer + CTA | Hard (official program page) | P1 |
| 42 | Coinbase | coinbase referral bonus | Referral | `/exchanges/coinbase/referral-code (new)` | Referral explainer + CTA | Hard | P2 |
| 43 | Coinbase | coinbase fees | Fees | `/exchanges/coinbase/fees (new)` | Fee explainer | Hard (official + nerdwallet/investopedia class) | P1 |
| 44 | Coinbase | coinbase advanced trade fees | Fees | `/exchanges/coinbase/fees#advanced (new)` | Fee table | Hard | P2 |
| 45 | Coinbase | coinbase vs kraken | Vs | `/compare/coinbase-vs-kraken (new)` | Comparison | Hard (finder, nasdaq, brokerchooser, shrimpy) | P0 |
| 46 | Coinbase | coinbase vs binance | Vs | `/compare/coinbase-vs-binance (new)` | Comparison | Hard | P1 |
| 47 | Coinbase | is coinbase legit | Trust | `/exchanges/coinbase/is-it-legit (new)` | Trust FAQ | Very hard | P2 |
| 48 | Coinbase | is coinbase safe | Trust | `/exchanges/coinbase/is-it-legit (new)` | Trust FAQ | Very hard | P2 |
| 49 | Coinbase | is coinbase available in the uk | Availability | `/exchanges/coinbase/availability/uk (new)` | Availability FAQ | Hard (official help) | P2 |
| 50 | Coinbase | coinbase withdrawal fees | Fees | `/exchanges/coinbase/fees#withdrawal (new)` | Fee table | Hard | P2 |
| 51 | Kraken | kraken referral code | Referral | `/exchanges/kraken/referral-code (new)` | Referral explainer + CTA | Hard | P1 |
| 52 | Kraken | kraken sign up bonus | Referral | `/exchanges/kraken/referral-code (new)` | Referral explainer + CTA | Hard | P2 |
| 53 | Kraken | kraken fees | Fees | `/exchanges/kraken/fees (new)` | Fee explainer | Hard (brokerchooser, nerdwallet, datawallet, cointelegraph) | P0 |
| 54 | Kraken | kraken pro fees | Fees | `/exchanges/kraken/fees#pro (new)` | Fee table | Medium | P1 |
| 55 | Kraken | kraken vs coinbase | Vs | `/compare/coinbase-vs-kraken (new)` | Comparison | Hard | P1 |
| 56 | Kraken | kraken vs binance | Vs | `/compare/binance-vs-kraken (exists)` | Comparison | Hard | P1 |
| 57 | Kraken | is kraken legit | Trust | `/exchanges/kraken/is-it-legit (new)` | Trust FAQ | Hard | P2 |
| 58 | Kraken | is kraken safe | Trust | `/exchanges/kraken/is-it-legit (new)` | Trust FAQ | Hard | P2 |
| 59 | Kraken | is kraken available in the us | Availability | `/exchanges/kraken/availability/us (new)` | Availability FAQ | Medium (official support page) | P1 |
| 60 | Kraken | kraken withdrawal fees | Fees | `/exchanges/kraken/fees#withdrawal (new)` | Fee table | Medium | P2 |
| 61 | Gate | gate.io referral code | Referral | `/exchanges/gate-io/referral-code (new)` | Referral explainer + CTA | Medium (UGC/AI-host pages) | P1 |
| 62 | Gate | gate.io sign up bonus | Referral | `/exchanges/gate-io/referral-code (new)` | Referral explainer + CTA | Medium | P2 |
| 63 | Gate | gate.io fees | Fees | `/exchanges/gate-io/fees (new)` | Fee explainer | Hard | P1 |
| 64 | Gate | gate.io vs mexc | Vs | `/compare/gate-io-vs-mexc (exists)` | Comparison | Medium | P1 |
| 65 | Gate | gate.io vs bybit | Vs | `/compare/gate-io-vs-bybit (new)` | Comparison | Medium | P2 |
| 66 | Gate | gate.io vs okx | Vs | `/compare/gate-io-vs-okx (new)` | Comparison | Medium | P2 |
| 67 | Gate | is gate.io legit | Trust | `/exchanges/gate-io/is-it-legit (new)` | Trust FAQ | Medium | P1 |
| 68 | Gate | is gate.io safe | Trust | `/exchanges/gate-io/is-it-legit (new)` | Trust FAQ | Medium | P2 |
| 69 | Gate | is gate.io available in the us | Availability | `/exchanges/gate-io/availability/us (new)` | Availability FAQ | Medium | P0 |
| 70 | Gate | gate.io withdrawal fees | Fees | `/exchanges/gate-io/fees#withdrawal (new)` | Fee table | Medium | P2 |
| 71 | MEXC | mexc referral code | Referral | `/exchanges/mexc/referral-code (new)` | Referral explainer + CTA | Medium | P1 |
| 72 | MEXC | mexc sign up bonus | Referral | `/exchanges/mexc/referral-code (new)` | Referral explainer + CTA | Medium | P2 |
| 73 | MEXC | mexc fees | Fees | `/exchanges/mexc/fees (new)` | Fee explainer | Medium | P1 |
| 74 | MEXC | mexc vs binance | Vs | `/compare/binance-vs-mexc (exists)` | Comparison | Medium | P0 |
| 75 | MEXC | mexc vs okx | Vs | `/compare/okx-vs-mexc (exists)` | Comparison | Medium | P1 |
| 76 | MEXC | mexc vs gate.io | Vs | `/compare/gate-io-vs-mexc (exists)` | Comparison | Medium | P2 |
| 77 | MEXC | is mexc legit | Trust | `/exchanges/mexc/is-it-legit (new)` | Trust FAQ | Hard (mexc.com own article ranks, plus scam-checker sites gridinsoft/offseq, FMA Liechtenstein warning) | P0 |
| 78 | MEXC | is mexc safe | Trust | `/exchanges/mexc/is-it-legit (new)` | Trust FAQ | Hard | P1 |
| 79 | MEXC | is mexc available in the us | Availability | `/exchanges/mexc/availability/us (new)` | Availability FAQ | Medium | P1 |
| 80 | MEXC | mexc kyc required | Availability | `/exchanges/mexc/kyc (new)` | FAQ | Medium | P2 |
| 81 | KuCoin | kucoin referral code | Referral | `/exchanges/kucoin/referral-code (new)` | Referral explainer + CTA | Medium | P1 |
| 82 | KuCoin | kucoin sign up bonus | Referral | `/exchanges/kucoin/referral-code (new)` | Referral explainer + CTA | Medium | P2 |
| 83 | KuCoin | kucoin fees | Fees | `/exchanges/kucoin/fees (new)` | Fee explainer | Medium | P1 |
| 84 | KuCoin | kucoin vs binance | Vs | `/compare/binance-vs-kucoin (new)` | Comparison | Hard | P1 |
| 85 | KuCoin | kucoin vs bybit | Vs | `/compare/bybit-vs-kucoin (new)` | Comparison | Medium | P2 |
| 86 | KuCoin | kucoin vs okx | Vs | `/compare/okx-vs-kucoin (new)` | Comparison | Medium | P2 |
| 87 | KuCoin | is kucoin safe | Trust | `/exchanges/kucoin/is-it-legit (new)` | Trust FAQ | Hard (coinledger, coinbureau, tradersunion, trustpilot) | P0 |
| 88 | KuCoin | is kucoin legit | Trust | `/exchanges/kucoin/is-it-legit (new)` | Trust FAQ | Hard | P1 |
| 89 | KuCoin | is kucoin available in the us | Availability | `/exchanges/kucoin/availability/us (new)` | Availability FAQ | Medium | P1 |
| 90 | KuCoin | kucoin withdrawal fees | Fees | `/exchanges/kucoin/fees#withdrawal (new)` | Fee table | Medium | P2 |
| 91 | HTX | htx referral code | Referral | `/exchanges/htx/referral-code (new; /exchanges/htx does not exist yet, only /factbook/htx)` | Referral explainer + CTA | Medium | P2 |
| 92 | HTX | htx sign up bonus | Referral | `/exchanges/htx/referral-code (new)` | Referral explainer + CTA | Medium | P2 |
| 93 | HTX | htx fees | Fees | `/exchanges/htx/fees (new)` | Fee explainer | Medium | P1 |
| 94 | HTX | htx vs binance | Vs | `/compare/binance-vs-htx (new)` | Comparison | Medium | P2 |
| 95 | HTX | htx vs okx | Vs | `/compare/okx-vs-htx (new)` | Comparison | Medium | P2 |
| 96 | HTX | htx vs bybit | Vs | `/compare/bybit-vs-htx (new)` | Comparison | Medium | P2 |
| 97 | HTX | is htx legit | Trust | `/exchanges/htx/is-it-legit (new)` | Trust FAQ | Medium | P1 |
| 98 | HTX | is htx safe | Trust | `/exchanges/htx/is-it-legit (new)` | Trust FAQ | Medium | P2 |
| 99 | HTX | is htx available in the us | Availability | `/exchanges/htx/availability/us (new)` | Availability FAQ | Medium | P2 |
| 100 | HTX | htx vs huobi difference | Trust | `/exchanges/htx/ (new)` | Explainer | Easy-Medium | P2 |
| 101 | Hyperliquid | hyperliquid fees | Fees | `/exchanges/hyperliquid (exists) + /exchanges/hyperliquid/fees (new)` | Fee explainer | Easy-Medium | P0 |
| 102 | Hyperliquid | hyperliquid referral code | Referral | `/exchanges/hyperliquid/referral-code (new)` | Referral explainer + CTA | Medium | P0 |
| 103 | Hyperliquid | hyperliquid referral discount | Referral | `/exchanges/hyperliquid/referral-code (new)` | Referral explainer + CTA | Medium | P0 |
| 104 | Hyperliquid | hyperliquid vs dydx | Vs | `/compare/hyperliquid-vs-dydx (exists)` | Comparison | Medium | P0 |
| 105 | Hyperliquid | hyperliquid vs binance futures | Vs | `/compare/binance-vs-hyperliquid (new)` | Comparison | Medium | P1 |
| 106 | Hyperliquid | hyperliquid vs bybit | Vs | `/compare/bybit-vs-hyperliquid (new)` | Comparison | Medium | P2 |
| 107 | Hyperliquid | is hyperliquid legit | Trust | `/exchanges/hyperliquid/is-it-legit (new)` | Trust FAQ | Medium | P1 |
| 108 | Hyperliquid | is hyperliquid safe | Trust | `/exchanges/hyperliquid/is-it-legit (new)` | Trust FAQ | Medium | P1 |
| 109 | Hyperliquid | is hyperliquid available in the us | Availability | `/exchanges/hyperliquid/availability/us (new)` | Availability FAQ | Medium | P1 |
| 110 | Hyperliquid | hyperliquid withdrawal fees | Fees | `/exchanges/hyperliquid/fees#withdrawal (new)` | Fee table | Easy-Medium | P2 |
| 111 | Uniswap | uniswap fees | Fees | `/exchanges/uniswap (exists) + /exchanges/uniswap/fees (new)` | Fee explainer | Medium (developers.uniswap.org docs rank; defillama; news) | P0 |
| 112 | Uniswap | uniswap interface fee | Fees | `/exchanges/uniswap/fees#interface (new)` | Fee explainer | Medium | P1 |
| 113 | Uniswap | uniswap v4 fees | Fees | `/exchanges/uniswap/fees#v4 (new)` | Fee explainer | Medium | P1 |
| 114 | Uniswap | uniswap testnet | Other (informational; GSC-observed) | `/exchanges/uniswap/testnet (new)` | How-to | Easy-Medium | P0 |
| 115 | Uniswap | uniswap vs jupiter | Vs | `/compare/uniswap-vs-jupiter (exists)` | Comparison | Medium | P1 |
| 116 | Uniswap | uniswap vs pancakeswap | Vs | `/compare/uniswap-vs-pancakeswap (new)` | Comparison | Medium | P2 |
| 117 | Uniswap | uniswap vs binance | Vs | `/compare/binance-vs-uniswap (new)` | Comparison (CEX vs DEX) | Medium | P2 |
| 118 | Uniswap | is uniswap safe | Trust | `/exchanges/uniswap/is-it-legit (new)` | Trust FAQ | Medium | P1 |
| 119 | Uniswap | is uniswap legit | Trust | `/exchanges/uniswap/is-it-legit (new)` | Trust FAQ | Medium | P2 |
| 120 | Uniswap | is uniswap available in the us | Availability | `/exchanges/uniswap/availability/us (new)` | Availability FAQ | Medium | P2 |

Totals: P0 = 24, P1 = 53, P2 = 43.

### Priority logic
- **P0**: already earning impressions (Hyperliquid fees, Uniswap testnet), or page already exists and head-to-head intent is clear, or high commercial intent with a verifiable, non-hype answer (referral explainers that state the actual benefit, availability answers backed by the exchange's own terms).
- **P1**: same structure, larger competitors or weaker facts.
- **P2**: long-tail, thin-value or low-fit.

## 3. Direct-answer draft stubs for the 24 P0 rows (40-60 words each)

Rules: facts only if verified against the source I fetched; the source is named in section 5. Anything in `[VERIFY ...]` or `[INSERT ...]` must be completed from the live official page and date-stamped before publishing. Each referral stub carries the commission disclosure; keep it visible next to the CTA, not only in the stub.

**#1 "binance referral code"** (Referral, Binance)
> A Binance referral code links your new account to the person who invited you. Offers such as fee rebates or vouchers vary by region and change without notice, and many online "bonus" claims are outdated. Check the offer inside Binance's own sign-up screen before registering. NexuAlpha earns a commission when you sign up through our link.

**#5 "binance vs okx"** (Vs, Binance)
> Binance and OKX differ most on where you can open an account, which products you can use, and fee schedules. OKX lists Canada, Hong Kong, India, Japan and Malaysia among its restricted locations, and Binance's list differs by entity. Confirm both official lists and fee pages for your country first. [VERIFY current Binance list]

**#6 "binance vs bybit"** (Vs, Binance)
> Both are large centralized exchanges, but access differs by country. Bybit stopped serving French residents on 2 August 2024 and relaunched in the UK on 19 December 2025 through an FCA-authorised firm's promotion approval, while stating it is not itself FCA-authorised. Check Binance's current restricted list and both fee pages before choosing.

**#9 "is binance legal in brazil"** (Availability, Binance)
> Legality depends on the entity serving you and current Banco Central rules. In 2020 Brazil's CVM barred Binance from offering derivatives, and in August 2024 Binance settled with the CVM for 9.6 million reais. Central-bank authorisation rules for virtual-asset providers took effect 2 February 2026. [VERIFY Binance's current Brazilian authorisation status before publishing]

**#11 "okx referral code"** (Referral, OKX)
> An OKX referral code ties your sign-up to a referrer, and any rebate or reward depends on your region and the current campaign. OKX does not serve several places, including Canada, Hong Kong, India, Japan and Malaysia. Read the offer terms inside the OKX sign-up flow. NexuAlpha is paid a commission if you register through our link.

**#13 "okx fees"** (Fees, OKX)
> OKX charges maker and taker fees that differ between spot, futures and options, and withdrawal fees depend on the network. Rates change, so read the live schedule on OKX's fee page before trading. [INSERT date-stamped tier-1 spot maker and taker rates from okx.com, after checking the live page; do not publish without them]

**#14 "okx vs bybit"** (Vs, OKX)
> OKX and Bybit overlap on spot and derivatives, but not on availability. OKX restricts Canada, Hong Kong, India, Japan and Malaysia, plus some UK products. Bybit excludes the United States, Singapore, Canada, mainland China and Hong Kong, among others. Compare each platform's official restricted list and fee page for your own country.

**#21 "bybit referral code"** (Referral, Bybit)
> A Bybit referral code links your account to a referrer, and rewards, if any, depend on the current campaign and your region. Bybit's excluded jurisdictions include the United States, Singapore, Canada, mainland China and Hong Kong. Confirm the active offer on Bybit's own sign-up page. NexuAlpha earns a commission when you register through our link.

**#24 "bybit vs bitget"** (Vs, Bybit)
> Neither exchange is available everywhere. Bybit's terms exclude the US, Canada, Singapore, mainland China and Hong Kong. Bitget's prohibited list includes the US, Canada, France, Germany, Austria, Japan and Singapore. Compare maker and taker fees and derivatives access on each official page, then check your country against both lists.

**#29 "is bybit available in the us"** (Availability, Bybit)
> No. Bybit's service-restricted list names the United States among its excluded jurisdictions, so US residents should not register. It also excludes Canada, Singapore, mainland China and Hong Kong, and Bybit stopped serving France on 2 August 2024. Bybit can change its list at any time, so check the current page.

**#30 "is bybit legal in the uk"** (Availability, Bybit)
> Bybit relaunched in the UK on 19 December 2025, after suspending UK services in September 2023 when the FCA's crypto marketing rules took effect. Bybit says it is not authorised, regulated or registered by the FCA, and that its crypto services are not covered by the FSCS or the Financial Ombudsman Service. Check the current UK offering.

**#31 "bitget referral code"** (Referral, Bitget)
> A Bitget referral code connects your sign-up to a referrer, and benefits, if any, depend on current campaigns and your region. Bitget's terms prohibit residents of the United States, Canada, France, Germany, Austria, Japan, Singapore and other listed places. Check the live offer on Bitget's own sign-up page. NexuAlpha earns a commission if you register through our link.

**#45 "coinbase vs kraken"** (Vs, Coinbase)
> Coinbase and Kraken are both widely used spot exchanges, but fees and country coverage differ. Kraken says it does not serve clients in Japan, Russia or Iran, among others, and its support page notes limits for some US states including New York and Maine. Compare each platform's live fee schedule and supported-country list for where you live. [VERIFY Coinbase availability]

**#53 "kraken fees"** (Fees, Kraken)
> Kraken's fees depend on the product (spot, futures, staking), your 30-day volume tier and how you fund the trade. Rates change, so read the live schedule before trading. [INSERT date-stamped tier-1 maker and taker rates from kraken.com/features/fee-schedule; one unconfirmed fetch showed 0.40 percent maker and 0.80 percent taker, which must be verified]

**#69 "is gate.io available in the us"** (Availability, Gate)
> No. Gate's user agreement lists the United States among its Restricted Locations, alongside the UK, Canada, India, Indonesia, Vietnam, Spain, Germany, France, the UAE, Singapore and others. The list is stated as non-exhaustive and can change without notice, so check Gate's current agreement before registering.

**#74 "mexc vs binance"** (Vs, MEXC)
> MEXC and Binance have different regulatory footprints. Liechtenstein's financial regulator, the FMA, has warned that the operator of mexc.com is not licensed or registered with it. Binance's status varies by country. Compare each exchange's official restricted list, fee schedule and local licensing for your country before registering. [VERIFY MEXC terms and Binance list]

**#77 "is mexc legit"** (Trust, MEXC)
> MEXC is a centralized exchange, and legitimacy depends on your country. Liechtenstein's FMA warned on 28 February 2024 that the operator of mexc.com is not licensed or registered there and advised against using the site for financial services. Check whether your own regulator has issued a warning, and keep only funds you can afford to lose.

**#87 "is kucoin safe"** (Trust, KuCoin)
> No exchange is risk-free. KuCoin's terms list restricted locations including the US, Singapore, mainland China, Hong Kong, France, the Netherlands, Ontario and British Columbia, and Brazil residents fall under separate KuCoin Brasil terms. Check your own regulator's warnings, and keep only funds you can afford to lose.

**#101 "hyperliquid fees"** (Fees, Hyperliquid)
> At tier 0, Hyperliquid's documented base fees are 0.045% taker and 0.015% maker on perpetuals, and 0.070% taker and 0.040% maker on spot. Fees fall with 14-day volume. A referral code gives 4% off fees on your first $25M of volume. Rates are from Hyperliquid's docs, checked [DATE]; confirm before trading.

**#102 "hyperliquid referral code"** (Referral, Hyperliquid)
> Hyperliquid's documented referral benefit is a fee discount, not a cash bonus: a code gives new users 4% off trading fees on their first $25M of volume. The referrer earns 10% of referred users' fees, minus the discount. Enter a code at app.hyperliquid.xyz/referrals. NexuAlpha earns the referrer share if you use our code.

**#103 "hyperliquid referral discount"** (Referral, Hyperliquid)
> Hyperliquid's referral discount is 4% off trading fees, applied to your first $25M of volume. Referrers earn 10% of referred users' fees minus that discount, on the first $1B of referred volume. The discount does not apply to vaults or sub-accounts. Enter a code at app.hyperliquid.xyz/referrals. Source: Hyperliquid docs, checked [DATE].

**#104 "hyperliquid vs dydx"** (Vs, Hyperliquid)
> Hyperliquid and dYdX are both perpetual-futures venues, so compare them on documented fees, collateral, and jurisdiction rules rather than headline volume. Hyperliquid's tier-0 perp fee is 0.045% taker and 0.015% maker. [INSERT dYdX's current schedule from its docs, date-stamped.] Neither is a licensed local broker; check your country's rules first.

**#111 "uniswap fees"** (Fees, Uniswap)
> On Uniswap v2, each swap pays a 0.30% fee: 0.25% to liquidity providers and 0.05% to the protocol. Uniswap v3 offers pool tiers of 0.01%, 0.05%, 0.30% and 1.00%. In v4, pool creators can set any fee from 0% to 100%. Network gas is paid separately. Source: Uniswap docs, checked [DATE].

**#114 "uniswap testnet"** (Other (informational; GSC-observed), Uniswap)
> A testnet lets you try Uniswap with valueless test tokens instead of real funds. Switch your wallet to a supported test network, get test ETH from a faucet, then swap as normal. Test tokens have no market value. [VERIFY supported networks and current steps in Uniswap's support docs before publishing]


## 4. SERP probe log (what the tool actually returned)

| Query | What the SERP probe showed |
|---|---|
| binance referral code | probed: query "binance referral code sign up bonus" returned UGC/AI-host spam pages (outlookindia, flux.ai, together.ai, kimi share); no official page in top 10 of tool |
| binance vs okx | probed: techjockey, coinbureau, capterra, getapp, iseoptions, madeonsol - no exchange-owned page |
| is binance legal in brazil | probed: forklog, spglobal, theblock, itiger news - news-heavy, no clear evergreen answer page |
| okx referral code | probed: results were flux.ai (x6), unitapedia wiki, intercom help clones, audible podcast page - thin/UGC; no official page in tool top 10 |
| okx vs binance | probed (see binance vs okx) |
| bybit vs bitget | probed: mexc.com/news, iseoptions, coinbureau, cryptoninjas, directionsmag, tradersunion x2 - a mix of exchange blog, affiliate reviewers and thin SEO pages |
| is bybit available in the us | probed: gts.ai x5, ufovpn, fool.com, benzinga, tradersunion - mostly thin pages; reviewers fool/benzinga are real competitors |
| is bybit legal in the uk | fresh fact: Bybit relaunched UK 19 Dec 2025 via Archax-approved promotions route (theblock) |
| bitget referral code | probed: flux.ai x6, together.ai, unitapedia, intercom clones - thin/UGC |
| bitget vs bybit | probed |
| coinbase vs kraken | probed: "coinbase vs kraken fees" -> shrimpy, finder x2, brokerchooser, nasdaq, spark.money, newcastleherald, iseoptions |
| kraken fees | probed: brokerchooser, cointelegraph x2, datawallet, nerdwallet, moneytothemasses x2, defirate - established reviewers; official kraken.com page not in tool top 9 |
| gate.io referral code | probed: flux.ai x4, spotify podcast page, together.ai, intercom clones, notion - thin |
| is gate.io available in the us | fresh fact: Gate user agreement (fetched) lists US, UK, India, Indonesia, Vietnam, UAE, Spain among Restricted Locations - high-value, easy-to-verify answer |
| mexc referral code | probed: result 2 for "is mexc legit" was a discourse referral-code thread - UGC |
| is mexc legit | probed: gridinsoft, discourse thread, phishdestroy, mexc.com/learn, fma-li.li x2, offseq, blog.mexc.com - exchange itself + scam-check domains |
| is kucoin safe | probed: coinledger (2 locales), coinbureau, tradersunion, techbullion, trustpilot - established reviewers; no official page |
| htx fees | probed: "htx huobi fees" -> cointelegraph ranking, coinmarketcap, jamesbachini, vitepromo - mixed/old |
| hyperliquid fees | probed: onekey.so x3, eco.com x3, cointelegraph, defillama; no gitbook docs page in the tool top 9. Also our top GSC query |
| hyperliquid referral code | probed: flux.ai x6, wokwi, intercom clone - thin/UGC |
| uniswap fees | probed: developers.uniswap.org x3, thedefiant x2, defillama, blockworks, fxstreet - official docs present, so win on plain-language + cost calculator |
| uniswap testnet | GSC: top-2 query in baseline (3-week window). No monetisation path, use for topical authority + internal links |

Probed but not mapped to a single row: "binance referral code sign up bonus" (outlookindia, flux.ai x2, together.ai, kimi share x3, audible.fr); "is bybit available in the US" (see row above); "htx huobi fees" (cointelegraph rankings, coinmarketcap x3, kinsta.page, jamesbachini, vitepromo).

## 5. Sources used for facts in stubs

- Hyperliquid fees: https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees (tier 0: perps 0.045% taker / 0.015% maker; spot 0.070% / 0.040%).
- Hyperliquid referrals: https://hyperliquid.gitbook.io/hyperliquid-docs/referrals (4% off first $25M; referrer 10% minus discount; rewards on first $1B; not for vaults/sub-accounts).
- Uniswap fees: https://developers.uniswap.org/docs/get-started/concepts/fees
- OKX restricted locations: https://www.okx.com/en-us/help/risk-compliance-disclosure
- Bybit excluded jurisdictions: https://www.bybit.com/en/help-center/article/Service-Restricted-Countries
- Bybit France exit (2 Aug 2024): https://coindesk.com/policy/2024/08/02/crypto-exchange-bybit-withdraws-from-france-in-response-to-regulations
- Bybit UK relaunch (19 Dec 2025): https://www.theblock.co/post/383291/bybit-relaunches-crypto-exchange-in-uk
- Bitget prohibited countries: https://www.bitget.com/support/articles/360014944032-terms-of-use
- Gate restricted locations (clause 2.5): https://www.gate.com/legal/user-agreement
- KuCoin restricted locations (Art. 17(5)): https://www.kucoin.com/legal/terms-of-use
- Kraken unsupported regions: https://support.kraken.com/articles/360001368823-which-countries-does-kraken-operate-in
- MEXC FMA warning: https://www.fma-li.li/en/news/20240228-warning-mexcdotcom.html
- Binance/CVM: https://www.theblock.co/post/311231/binance-and-brazils-sec-reach-agreement-years-after-the-regulator-banned-derivatives-products
- Brazil BCB Res. 519-521: https://lefosse.com/noticias/alerta/banco-central-regulamenta-o-uso-de-ativos-virtuais-e-o-funcionamento-das-prestadoras-de-servicos-de-ativos-virtuais/
- Not verifiable from official pages in this session (fetch returned empty/404 or JS shell): Binance current restricted list, Coinbase availability, HTX restricted list, Hyperliquid and MEXC terms, Kraken/OKX/Coinbase fee tables. These are marked VERIFY/INSERT.

## 6. How to use the map

1. **Template first.** Build four templates (referral explainer, fee explainer, trust/legit FAQ, availability-by-country) fed from one structured data file per exchange (restricted list, fee tier-1 rates, source URL, checked-on date). This repo already has `public/research/*.json` citation/verification assets that can seed it.
2. **Order of work**: (a) improve existing pages that already hold impressions (`/exchanges/hyperliquid`, `/exchanges/uniswap`) with the P0 fee stubs and a Q&A block; (b) the existing comparison URLs with P0 rows; (c) new referral and availability pages.
3. **Do not create a page without a verifiable fact source and a date stamp.** Thin AI-generated referral pages are exactly what the probe shows ranking, and exactly what a quality update removes.
4. **Every CTA page** follows the disclosure and gating patterns in `region-compliance-v1.md`.
5. **Measurement**: track each row in GSC as a query group; the success metric for the first 8 weeks is impressions and average position per group, not clicks (at 3 clicks, clicks are noise). Review P0 monthly.

## 7. Localising to pt-BR, es, vi, tr, id

Do not machine-translate the English table. For each locale: (1) take the 12 exchanges x 5 intents, (2) replace head terms with the native query forms below, (3) pull real query variants from GSC and autosuggest in that country, (4) apply that locale's compliance limits first (section 7.2), (5) publish under the existing locale hubs.

### 7.1 Native query patterns (to validate, not volume-proven)

| Locale | Hub URL | Referral | Fees | Vs | Trust | Availability |
|---|---|---|---|---|---|---|
| pt-BR | `/pt-br`, `/br` | "codigo de indicacao {ex}", "{ex} bonus de cadastro" | "taxas da {ex}", "{ex} taxa de saque Pix" | "{a} ou {b}", "{a} vs {b} qual melhor" | "{ex} e confiavel", "{ex} e seguro", "{ex} da golpe" | "{ex} funciona no Brasil", "{ex} aceita Pix", "{ex} precisa de CPF" |
| es | `/es`, `/mx` | "codigo de referido {ex}", "codigo de invitacion {ex}" | "comisiones de {ex}" | "{a} vs {b} cual es mejor" | "{ex} es confiable", "{ex} es seguro", "{ex} es una estafa" | "{ex} en Espana", "{ex} en Mexico", "{ex} en Argentina" |
| vi | `/vi` | "ma gioi thieu {ex}" | "phi giao dich {ex}" | "{a} hay {b}" | "{ex} co uy tin khong", "{ex} co lua dao khong" | "{ex} co dung duoc o Viet Nam khong" |
| tr | `/tr` | "referans kodu {ex}" (see caution) | "{ex} komisyon oranlari" | "{a} mi {b} mi" | "{ex} guvenilir mi" | "{ex} Turkiye'de yasal mi", "{ex} TL ile alim" |
| id | `/id`, `/id-id` | "kode referral {ex}" | "biaya trading {ex}", "fee {ex}" | "{a} vs {b} mana yang bagus" | "{ex} aman atau tidak", "{ex} legal di Indonesia" | "{ex} resmi OJK", "{ex} bisa deposit rupiah" |

(Use proper diacritics on-page; ASCII here only for table safety.)

### 7.2 Locale cautions that change the map

- **pt-BR**: Brazil's central bank regime for virtual-asset service providers took effect 2 Feb 2026 (Res. BCB 519/520), so "is it legal in Brazil" answers go stale; date-stamp them. Pix/CPF pages already exist (`/br/pix`, `/br/kyc-cpf`) and are the strongest local angle. Consumer-law and CONAR advertising rules apply (counsel).
- **es**: Spain's CNMV Circular 1/2022 covers mass crypto advertising in Spanish aimed at Spanish investors (100,000+ audience threshold, risk warning, 10-day prior notification). Gate lists Spain as a Restricted Location, so do not push Gate CTAs to Spanish users.
- **vi**: Vietnam's Resolution 05/2025/NQ-CP says only Ministry of Finance-licensed entities may provide and advertise crypto-asset services. Referral CTAs to offshore exchanges are the highest-risk item in the whole map; default to informational pages with no CTA until counsel clears.
- **tr**: Law 7518 prohibits benefits for bringing in or referring clients (licensed platforms), and unlicensed foreign platforms are treated as targeting Turkey if they have Turkish-language sites or promote through Turkey-based persons. Turkish-language referral CTAs to unlicensed exchanges are high risk; counsel before building.
- **id**: OJK took over from Bappebti on 10 Jan 2025 (POJK 27/2024). I could not confirm whether offshore exchanges are permitted to serve Indonesian users or any advertising rule; Gate lists Indonesia as restricted. Counsel before CTAs.

## 8. Open items for the owner

1. Provide the real GSC export (the baseline file is missing) so priorities can be re-cut by query.
2. Confirm which referral programmes NexuAlpha actually holds (links, codes, commission terms) so stubs can state them accurately; I invented no codes or bonus amounts.
3. Decide whether to build `/exchanges/htx` at all given HTX restriction and risk profile.

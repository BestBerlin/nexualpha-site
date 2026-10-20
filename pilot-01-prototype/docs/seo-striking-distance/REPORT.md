# Changed files

- `pilot-01-prototype/docs/seo-striking-distance/REPORT.md`
- `pilot-01-prototype/docs/seo-striking-distance/metadata-changes.md`
- `pilot-01-prototype/docs/seo-striking-distance/notes.md`
- `pilot-01-prototype/docs/seo-striking-distance/verification.md`
- `pilot-01-prototype/package.json`
- `pilot-01-prototype/public/llms-full.txt`
- `pilot-01-prototype/public/llms.txt`
- `pilot-01-prototype/scripts/prepare-sites-build.mjs`
- `pilot-01-prototype/src/components/v3/CleanFooter.jsx`
- `pilot-01-prototype/src/components/v3/VenueDetailPage.jsx`
- `pilot-01-prototype/src/components/v3/referral-native-answers.css`
- `pilot-01-prototype/src/data/compare-direct-answers.js`
- `pilot-01-prototype/src/data/home-search-copy.js`
- `pilot-01-prototype/src/data/referral-native.js`
- `pilot-01-prototype/src/data/referral-seo.js`
- `pilot-01-prototype/src/data/seo-injection.js`
- `pilot-01-prototype/src/data/striking-distance-venue-copy.js`
- `pilot-01-prototype/src/data/striking-page-overrides.js`
- `pilot-01-prototype/src/styles/v5/shell.css`
- `pilot-01-prototype/tests/brand-slogan.test.mjs`
- `pilot-01-prototype/tests/compare-decision-ssr.test.mjs`
- `pilot-01-prototype/tests/compare-direct-answers.test.mjs`
- `pilot-01-prototype/tests/compare-striking-distance.test.mjs`
- `pilot-01-prototype/tests/ctr-titles-2026-10-13.test.mjs`
- `pilot-01-prototype/tests/invite-code-consistency.test.mjs`
- `pilot-01-prototype/tests/locales-ur-uk.test.mjs`
- `pilot-01-prototype/tests/referral-native.test.mjs`
- `pilot-01-prototype/tests/seo-onpage-metadata-length.test.mjs`
- `pilot-01-prototype/tests/seo-onpage-venue-h1.test.mjs`
- `pilot-01-prototype/tests/seo-striking-distance.test.mjs`
- `pilot-01-prototype/tests/striking-answer-first-2026-10-18.test.mjs`
- `pilot-01-prototype/worker/index.js`

# What and why

# Scope and evidence notes

- Canonical slugs differ from three brief orderings: `bitget-vs-bybit` → `bybit-vs-bitget`, `bybit-vs-okx` → `okx-vs-bybit`, `dydx-vs-hyperliquid` → `hyperliquid-vs-dydx`. Existing 301 behavior is preserved; editorial links use canonical orders.
- The English home title is 70 characters: `NexuAlpha — Crypto Fee Comparison, Rebates & Referral Codes (Official)`. This compresses the proposed wording to meet the requested length while keeping brand, fee comparison, rebates, referral codes and official-source intent. zh-Hans uses the brief's wording. Deployed entity descriptions are unchanged; Open Graph titles follow the same metadata object.
- Venue answer paragraphs use `exchange-facts` checked rates. MEXC withholds a flat rate because official sources disagree; Backpack has no checked flat rate; Jupiter uses quote/route/network-cost facts rather than an invented maker/taker schedule. Gate.io/MEXC and Coinbase/Gate.io comparison leads explicitly cannot verify a fee winner when both checked schedules are unavailable. Hyperliquid/dYdX has split maker/taker advantages, not a single fee winner. Bybit/Bitget spot rates tie. Binance/OKX shows the lower maker rate and equal taker rate numerically.
- Deribit and Jupiter have no helper-provided real invite code in this context; their titles do not fabricate one. Backpack's known page-one fee intent remains fee-led.
- MEXC KYC article: `/news/how-to-register-mexc-account-complete-primary-kyc-and-secure-first-deposit`. Related page: `/news/how-to-enable-mexc-withdrawal-whitelist-and-kyc-safely`.
- Anti-phishing candidates: `/glossary/anti-phishing-code`, `/news/bybit-anti-phishing-code-setup-message-verification-tutorial`, `/news/okx-anti-phishing-code-setup-email-verification-tutorial`, `/news/how-to-set-up-binance-anti-phishing-code`. The brief does not include query→landing-page rows, so the exact GSC landing page cannot be identified from local content alone.
- Referral native copy now uses the shared question-first builder for the eight targeted venues in EN/zh-Hans. Other existing native templates and partner geo gates remain in place. Partner registry/code/link files were not changed; build-generated timestamp-only partner/publication/promotion changes were restored.
- The complete per-page EN/zh-Hans title/H1/description before→after table is in `metadata-changes.md`. It records actual metadata budgeting, including retained CJK comparison-title truncation.


# SEO striking-distance metadata changes

Before values come from the pre-change HEAD, imported from an isolated source archive. Titles and descriptions are actual Worker output after existing budgets; H1 values are React SSR output. Home hero code is unchanged.

Canonical route orders and reverse 301s are retained. Referral codes and commercial links are read through existing helpers; partner registries are unchanged.

## /exchanges/bybit (en)

| Field | Before | After |
|---|---|---|
| title | Bybit referral code: 48553 | Bybit fees, sign-up & KYC — referral code 48553 (2026) \| NexuAlpha |
| h1 | Bybit referral code: 48553 | Bybit sign-up, fees and KYC: what you get with code 48553 |
| description | Bybit referral code: 48553. No verified user benefit. | Bybit spot maker/taker 0.10%/0.10%. Official sign-up code 48553; no extra discount verified. |

## /exchanges/gate-io (en)

| Field | Before | After |
|---|---|---|
| title | How to Sign Up for Gate.io: Steps, KYC, Code nexubest | Gate.io fees, sign-up & KYC — referral code nexubest (2026) \| NexuAlpha |
| h1 | How to Sign Up for Gate.io: Steps, KYC, Code nexubest | Gate.io sign-up, fees and KYC: what you get with code nexubest |
| description | Register for Gate.io with code nexubest on the official site or app, then complete KYC: up to 40% of trading fees back, paid by Gate.io. | Gate.io spot maker/taker 0.10%/0.10%. Official sign-up code nexubest; up to 40% of fees back. |

## /exchanges/okx (en)

| Field | Before | After |
|---|---|---|
| title | OKX referral code: nexu888 | OKX fees, sign-up & KYC — referral code nexu888 (2026) \| NexuAlpha |
| h1 | OKX referral code: nexu888 | OKX sign-up, fees and KYC: what you get with code nexu888 |
| description | OKX referral code: nexu888. Up to 40% of fees back. | OKX spot maker/taker 0.08%/0.10%. Official sign-up code nexu888; up to 40% of fees back. |

## /exchanges/hyperliquid (en)

| Field | Before | After |
|---|---|---|
| title | Hyperliquid Fees, Code NEXU888 & Funded Accounts | Hyperliquid fees & wallet setup — referral code NEXU888 (2026) \| NexuAlpha |
| h1 | Should you use Hyperliquid after checking fees, funding, collateral and liquidation? | Hyperliquid fees and wallet setup: what you get with code NEXU888 |
| description | Trade on Hyperliquid from your own wallet: connect on the official app, deposit USDC and enter referral code NEXU888 for a 4% discount on trading fees. | Hyperliquid perps maker/taker 0.015%/0.045%; eligible referrals save 4% on fees. Referral code NEXU888. |

## /exchanges/deribit (en)

| Field | Before | After |
|---|---|---|
| title | Deribit Fees (2026): Perps 0.015%/0.035%, Options, 10% Off | Deribit fees, sign-up & KYC (2026) \| NexuAlpha |
| h1 | Deribit fees: perpetuals, options, margin and liquidation rules | Deribit sign-up, fees and KYC: what to check |
| description | Deribit fees: BTC perpetual 0.015% maker / 0.035% taker, spot 0.02% / 0.05% (official API, 2026-10-10), plus the six-month 10% referred-user discount. | Deribit spot maker/taker 0.02%/0.05%; USDC perps 0.015%/0.035% (official API, 2026-10-10). Check KYC and account eligibility. |

## /exchanges/jupiter (en)

| Field | Before | After |
|---|---|---|
| title | Jupiter Solana Swap Routes, Ultra Quotes and Fee Checks | Jupiter fees & wallet setup (2026) \| NexuAlpha |
| h1 | Jupiter fees and platform profile | Jupiter fees and wallet setup: what to check |
| description | Jupiter Swap and Ultra: Solana test quotes, no-route or failed-swap causes, platform fee boundaries, slippage, priority fees and route legs. | Jupiter routes Solana swaps; check the quote and network costs before signing. |

## /exchanges/mexc (en)

| Field | Before | After |
|---|---|---|
| title | How to Sign Up for MEXC: Steps, KYC, Code 4BRhe | MEXC fees, sign-up & KYC — referral code 4BRhe (2026) \| NexuAlpha |
| h1 | How to Sign Up for MEXC: Steps, KYC, Code 4BRhe | MEXC sign-up, fees and KYC: what you get with code 4BRhe |
| description | Register for MEXC with code 4BRhe on the official site or app, then complete KYC. Steps, documents and fees on one page. | MEXC fees vary by pair and region; conflicting official rates are withheld. Official sign-up code 4BRhe; no extra discount verified. |

## /exchanges/backpack (en)

| Field | Before | After |
|---|---|---|
| title | Backpack Exchange Fees (2026) & Referral Code LuckyBitcoin | Backpack fees, sign-up & KYC — referral code LuckyBitcoin (2026) \| NexuAlpha |
| h1 | Backpack Exchange Fees (2026) & Referral Code LuckyBitcoin | Backpack sign-up, fees and KYC: what you get with code LuckyBitcoin |
| description | Register for Backpack with code LuckyBitcoin on the official site or app, then complete KYC. Steps, documents and fees on one page. | Backpack spot and perpetual fees: check the official schedule. Official sign-up code LuckyBitcoin; no extra discount verified. |

## /compare/binance-vs-kraken (en)

| Field | Before | After |
|---|---|---|
| title | Binance vs Kraken: Trading Fees & Platform Comparison | Binance vs Kraken: fees, KYC & rebates (2026) \| NexuAlpha |
| h1 | Binance vs Kraken | Binance vs Kraken: how do fees, KYC and rebates compare? |
| description | Compare Binance vs Kraken by trading fees, products, account requirements and platform differences. | On spot fees, Binance has lower base fees (Binance 0.10% / 0.10%; Kraken 0.40% / 0.80%, maker / taker). |

## /compare/binance-vs-okx (en)

| Field | Before | After |
|---|---|---|
| title | Binance vs OKX: Fees, Products, KYC and Web3 Access Checks | Binance vs OKX: fees, KYC & rebates (2026) \| NexuAlpha |
| h1 | Should you choose Binance or OKX after checking fees, products, KYC and Web3 access? | Binance vs OKX: how do fees, KYC and rebates compare? |
| description | Compare Binance and OKX by published fee tables, spot and derivatives product scope, identity requirements, Web3 or DEX-style access and account eligibility. | On spot fees, OKX has lower base fees (Binance 0.10% / 0.10%; OKX 0.08% / 0.10%, maker / taker). |

## /compare/binance-vs-bybit (en)

| Field | Before | After |
|---|---|---|
| title | Binance vs Bybit: Fees, Futures, Earn and KYC Checks | Binance vs Bybit: fees, KYC & rebates (2026) \| NexuAlpha |
| h1 | Binance vs Bybit | Binance vs Bybit: how do fees, KYC and rebates compare? |
| description | Compare Binance and Bybit by published spot and futures fees, product scope, Earn or copy-trading boundaries, identity requirements… | On spot fees, the base schedules tie (Binance 0.10% / 0.10%; Bybit 0.10% / 0.10%, maker / taker). |

## /compare/bybit-vs-bitget (en)

| Field | Before | After |
|---|---|---|
| title | Bybit vs Bitget Stocks, Copy Trading, Fees and Account… | Bybit vs Bitget: fees, KYC & rebates (2026) \| NexuAlpha |
| h1 | Should you choose Bybit or Bitget for the product route you actually need? | Bybit vs Bitget: how do fees, KYC and rebates compare? |
| description | Compare Bybit and Bitget by product label first: UTA margin, xStocks fee schedule, stock futures, copy-trading profit sharing, KYC, region and signup limits. | On spot fees, the base schedules tie (Bybit 0.10% / 0.10%; Bitget 0.10% / 0.10%, maker / taker). |

## /compare/okx-vs-bybit (en)

| Field | Before | After |
|---|---|---|
| title | OKX vs Bybit: Fees, Web3, Derivatives and Account Checks | OKX vs Bybit: fees, KYC & rebates (2026) \| NexuAlpha |
| h1 | OKX vs Bybit | OKX vs Bybit: how do fees, KYC and rebates compare? |
| description | Compare OKX and Bybit by fee schedules, derivatives access, Web3 or wallet routes, copy-trading context, identity requirements… | On spot fees, OKX has lower base fees (OKX 0.08% / 0.10%; Bybit 0.10% / 0.10%, maker / taker). |

## /compare/gate-io-vs-mexc (en)

| Field | Before | After |
|---|---|---|
| title | Gate.io vs MEXC: Trading Fees & Platform Comparison | Gate.io vs MEXC: fees, KYC & rebates (2026) \| NexuAlpha |
| h1 | Gate.io vs MEXC | Gate.io vs MEXC: how do fees, KYC and rebates compare? |
| description | Compare Gate.io vs MEXC by trading fees, products, account requirements and platform differences. | No spot fee winner can be verified between Gate.io and MEXC: at least one checked base schedule is unavailable. |

## /compare/hyperliquid-vs-dydx (en)

| Field | Before | After |
|---|---|---|
| title | Hyperliquid vs dYdX: Perp Fees, Funding, Liquidation and… | Hyperliquid vs dYdX: fees, KYC & rebates (2026) \| NexuAlpha |
| h1 | Should you choose Hyperliquid or dYdX after checking fees, funding, liquidation and access risk? | Hyperliquid vs dYdX: how do fees, KYC and rebates compare? |
| description | Compare Hyperliquid and dYdX by fee schedules, funding, collateral, liquidation rules, oracle design, wallet signing… | On perpetual fees, neither venue wins both maker and taker fees (Hyperliquid 0.015% / 0.045%; dYdX 0.01% / 0.05%, maker / taker). |

## /compare/coinbase-vs-gate-io (en)

| Field | Before | After |
|---|---|---|
| title | Coinbase vs Gate.io: Fees, Products and KYC Compared | Coinbase vs Gate.io: fees, KYC & rebates (2026) \| NexuAlpha |
| h1 | Coinbase vs Gate.io: fees, products and KYC side by side | Coinbase vs Gate.io: how do fees, KYC and rebates compare? |
| description | Coinbase vs Gate.io compared from NexuAlpha's reviewed data: published spot and futures fees, products, KYC and official sources. No editorial verdict. | No spot fee winner can be verified between Coinbase and Gate.io: at least one checked base schedule is unavailable. |

## /exchanges/bybit (zh-Hans)

| Field | Before | After |
|---|---|---|
| title | Bybit 邀请码: 48553 | Bybit 手续费、注册与 KYC — 邀请码 48553（2026） \| NexuAlpha |
| h1 | Bybit 邀请码: 48553 | Bybit 注册、手续费与 KYC：邀请码 48553 有什么权益？ |
| description | Bybit 邀请码: 48553. 没有已验证的用户权益. | Bybit 现货 maker/taker 0.10%/0.10%。官方注册邀请码 48553；尚未核实额外折扣。 |

## /exchanges/gate-io (zh-Hans)

| Field | Before | After |
|---|---|---|
| title | Gate.io 怎么注册：邀请码 nexubest | Gate.io 手续费、注册与 KYC — 邀请码 nexubest（2026） \| NexuAlpha |
| h1 | Gate.io 怎么注册：邀请码 nexubest | Gate.io 注册、手续费与 KYC：邀请码 nexubest 有什么权益？ |
| description | Gate.io 注册步骤：先在官网或 App 填写邀请码 nexubest 并注册，再完成 KYC，手续费最高返还 40%，由 Gate.io 结算。 | Gate.io 现货 maker/taker 0.10%/0.10%。官方注册邀请码 nexubest；手续费最高返还 40%。 |

## /exchanges/okx (zh-Hans)

| Field | Before | After |
|---|---|---|
| title | OKX 邀请码: nexu888 | OKX 手续费、注册与 KYC — 邀请码 nexu888（2026） \| NexuAlpha |
| h1 | OKX 邀请码: nexu888 | OKX 注册、手续费与 KYC：邀请码 nexu888 有什么权益？ |
| description | OKX 邀请码: nexu888. 最高返还 40% 手续费. | OKX 现货 maker/taker 0.08%/0.10%。官方注册邀请码 nexu888；手续费最高返还 40%。 |

## /exchanges/hyperliquid (zh-Hans)

| Field | Before | After |
|---|---|---|
| title | Hyperliquid 邀请码 NEXU888 | Hyperliquid 手续费与钱包使用 — 邀请码 NEXU888（2026） \| NexuAlpha |
| h1 | 核对费率、资金费、抵押资产和清算后，Hyperliquid 是否适合你？ | Hyperliquid 手续费与钱包使用：邀请码 NEXU888 有什么权益？ |
| description | Hyperliquid 无需注册账户：在官方 App 连接自己的钱包、存入 USDC，填写邀请码 NEXU888 即可享受交易手续费 4% 折扣。 | Hyperliquid 永续 maker/taker 0.015%/0.045%；符合邀请条件享手续费 4% 折扣。 邀请码 NEXU888. |

## /exchanges/deribit (zh-Hans)

| Field | Before | After |
|---|---|---|
| title | Deribit 手续费：永续合约 0.015%/0.035% | Deribit 手续费、注册与 KYC（2026） \| NexuAlpha |
| h1 | Deribit 手续费：永续、期权、保证金与清算规则 | Deribit 注册、手续费与 KYC：需要核对什么？ |
| description | Deribit 手续费：BTC 永续合约挂单 0.015%、吃单 0.035%，现货 0.02% / 0.05%（官方 API，2026-10-10 读取）；受邀用户前六个月享 10% 交易手续费折扣，现货不适用，并附保证金模式与清算规则说明。 | Deribit 现货 maker/taker 0.02%/0.05%；USDC 永续 0.015%/0.035%（官方 API，2026-10-10）。注册前核对 KYC、账户实体与实际费率。 |

## /exchanges/jupiter (zh-Hans)

| Field | Before | After |
|---|---|---|
| title | Jupiter 评测、手续费与账户条件 | Jupiter 手续费与钱包使用（2026） \| NexuAlpha |
| h1 | Jupiter 手续费与平台档案 | Jupiter 手续费与钱包使用：需要核对什么？ |
| description | 独立整理 Jupiter 的现货费率、合约费率、账户条件与官方来源；用户权益、地区可用性和活动资格需在官方账户内核验。 | Jupiter 提供 Solana 报价与交易路由；签名前核对报价及网络成本。 |

## /exchanges/mexc (zh-Hans)

| Field | Before | After |
|---|---|---|
| title | MEXC 怎么注册：邀请码 4BRhe | MEXC 手续费、注册与 KYC — 邀请码 4BRhe（2026） \| NexuAlpha |
| h1 | MEXC 怎么注册：邀请码 4BRhe | MEXC 注册、手续费与 KYC：邀请码 4BRhe 有什么权益？ |
| description | MEXC 注册步骤：先在官网或 App 填写邀请码 4BRhe 并注册，再完成 KYC，附所需证件与手续费。 | MEXC 费率按交易对及地区变化，官方来源不一致，未发布统一费率。官方注册邀请码 4BRhe；尚未核实额外折扣。 |

## /exchanges/backpack (zh-Hans)

| Field | Before | After |
|---|---|---|
| title | Backpack 怎么注册：邀请码 LuckyBitcoin | Backpack 手续费、注册与 KYC — 邀请码 LuckyBitcoin（2026） \| NexuAlpha |
| h1 | Backpack 怎么注册：邀请码 LuckyBitcoin | Backpack 注册、手续费与 KYC：邀请码 LuckyBitcoin 有什么权益？ |
| description | Backpack 注册步骤：先在官网或 App 填写邀请码 LuckyBitcoin 并注册，再完成 KYC，附所需证件与手续费。 | Backpack 现货及永续费率需核对官方费率表。官方注册邀请码 LuckyBitcoin；尚未核实额外折扣。 |

## /compare/binance-vs-kraken (zh-Hans)

| Field | Before | After |
|---|---|---|
| title | Binance 对比 Kraken: 手续费与平台选择 | Binance vs Kraken：手续费、KYC… |
| h1 | Binance (币安) vs Kraken (海妖) | Binance vs Kraken：手续费、KYC 与返佣如何比较？ |
| description | Binance 对比 Kraken：比较手续费、产品、账户条件与平台差异。 | 现货手续费：Binance 的基础费率更低（Binance 0.10% / 0.10%；Kraken 0.40% / 0.80%，依次为 Maker / Taker）。 以上为已核验来源的基础费率快照；账户等级、代币折扣、返佣、资金费率与地区资格仍需在官方账户确认。 |

## /compare/binance-vs-okx (zh-Hans)

| Field | Before | After |
|---|---|---|
| title | Binance 对比 OKX: 手续费与平台选择 | Binance vs OKX：手续费、KYC… |
| h1 | Binance (币安) vs OKX (欧易) | Binance vs OKX：手续费、KYC 与返佣如何比较？ |
| description | Binance 对比 OKX：比较手续费、产品、账户条件与平台差异。 | 现货手续费：OKX 的基础费率更低（Binance 0.10% / 0.10%；OKX 0.08% / 0.10%，依次为 Maker / Taker）。 以上为已核验来源的基础费率快照；账户等级、代币折扣、返佣、资金费率与地区资格仍需在官方账户确认。 |

## /compare/binance-vs-bybit (zh-Hans)

| Field | Before | After |
|---|---|---|
| title | Binance 对比 Bybit: 手续费与平台选择 | Binance vs Bybit：手续费、KYC… |
| h1 | Binance (币安) vs Bybit | Binance vs Bybit：手续费、KYC 与返佣如何比较？ |
| description | Binance 对比 Bybit：比较手续费、产品、账户条件与平台差异。 | 现货手续费：双方基础费率相同（Binance 0.10% / 0.10%；Bybit 0.10% / 0.10%，依次为 Maker / Taker）。 以上为已核验来源的基础费率快照；账户等级、代币折扣、返佣、资金费率与地区资格仍需在官方账户确认。 |

## /compare/bybit-vs-bitget (zh-Hans)

| Field | Before | After |
|---|---|---|
| title | Bybit vs Bitget UTA、股票类产品、跟单… | Bybit vs Bitget：手续费、KYC… |
| h1 | 按你真正需要的产品路径，应该选 Bybit 还是 Bitget？ | Bybit vs Bitget：手续费、KYC 与返佣如何比较？ |
| description | 比较 Bybit 与 Bitget 时先确认产品标签：UTA 保证金、xStocks 费率、股票期货、跟单分润、费用、资金费、KYC 与开户注册路径限制。 | 现货手续费：双方基础费率相同（Bybit 0.10% / 0.10%；Bitget 0.10% / 0.10%，依次为 Maker / Taker）。 以上为已核验来源的基础费率快照；账户等级、代币折扣、返佣、资金费率与地区资格仍需在官方账户确认。 |

## /compare/okx-vs-bybit (zh-Hans)

| Field | Before | After |
|---|---|---|
| title | OKX 对比 Bybit: 手续费与平台选择 | OKX vs Bybit：手续费、KYC 与返佣对比（2026… |
| h1 | OKX (欧易) vs Bybit | OKX vs Bybit：手续费、KYC 与返佣如何比较？ |
| description | OKX 对比 Bybit：比较手续费、产品、账户条件与平台差异。 | 现货手续费：OKX 的基础费率更低（OKX 0.08% / 0.10%；Bybit 0.10% / 0.10%，依次为 Maker / Taker）。 以上为已核验来源的基础费率快照；账户等级、代币折扣、返佣、资金费率与地区资格仍需在官方账户确认。 |

## /compare/gate-io-vs-mexc (zh-Hans)

| Field | Before | After |
|---|---|---|
| title | Gate.io 对比 MEXC: 手续费与平台选择 | Gate.io vs MEXC：手续费、KYC… |
| h1 | Gate.io (芝麻开门) vs MEXC (抹茶) | Gate.io vs MEXC：手续费、KYC 与返佣如何比较？ |
| description | Gate.io 对比 MEXC：比较手续费、产品、账户条件与平台差异。 | 目前不能确认 Gate.io 与 MEXC 谁的现货手续费更低：双方尚未都有已核验的基础费率。 以上为已核验来源的基础费率快照；账户等级、代币折扣、返佣、资金费率与地区资格仍需在官方账户确认。 |

## /compare/hyperliquid-vs-dydx (zh-Hans)

| Field | Before | After |
|---|---|---|
| title | Hyperliquid 对比 dYdX: 手续费与平台选择 | Hyperliquid vs dYdX：手续费、KYC… |
| h1 | Hyperliquid vs dYdX | Hyperliquid vs dYdX：手续费、KYC 与返佣如何比较？ |
| description | Hyperliquid 对比 dYdX：比较手续费、产品、账户条件与平台差异。 | 永续合约手续费：Maker 与 Taker 各有优势，不能确定单一赢家（Hyperliquid 0.015% / 0.045%；dYdX 0.01% / 0.05%，依次为 Maker / Taker）。 以上为已核验来源的基础费率快照；账户等级、代币折扣、返佣、资金费率与地区资格仍需在官方账户确认。 |

## /compare/coinbase-vs-gate-io (zh-Hans)

| Field | Before | After |
|---|---|---|
| title | Coinbase 与 Gate.io 对比：手续费、产品与… | Coinbase vs Gate.io：手续费、KYC… |
| h1 | Coinbase vs Gate.io (芝麻开门)：手续费、产品与 KYC 并排对比 | Coinbase vs Gate.io：手续费、KYC 与返佣如何比较？ |
| description | 基于 NexuAlpha 已审核数据生成的 Coinbase 与 Gate.io 并排对比：公开现货与合约费率、产品范围、KYC 与官方来源，不含编辑结论。 | 目前不能确认 Coinbase 与 Gate.io 谁的现货手续费更低：双方尚未都有已核验的基础费率。 以上为已核验来源的基础费率快照；账户等级、代币折扣、返佣、资金费率与地区资格仍需在官方账户确认。 |

## / (en)

| Field | Before | After |
|---|---|---|
| title | Crypto Referral Codes: Up to 60% Fee Rebates — NexuAlpha | NexuAlpha — Crypto Fee Comparison, Rebates & Referral Codes (Official) |
| h1 | Unchanged (home hero) | Unchanged (home hero) |
| description | NexuAlpha compares crypto exchange fees and applicable rebates using official sources. Free, independent guidance funded by disclosed exchange referrals. | NexuAlpha compares crypto exchange fees and applicable rebates using official sources. Free, independent guidance funded by disclosed exchange referrals. |

## / (zh-Hans)

| Field | Before | After |
|---|---|---|
| title | 邀请码与手续费返佣｜全球交易所，一个官方入口 | NexuAlpha — 交易所手续费对比、返佣与邀请码（官方来源） |
| h1 | Unchanged (home hero) | Unchanged (home hero) |
| description | NexuAlpha 是独立的加密交易所手续费比较与返还指南，依据官方来源帮助交易者核对费率、注册链接和适用返还，降低交易成本。内容免费，由公开披露的交易所推荐计划资助。 | NexuAlpha 是独立的加密交易所手续费比较与返还指南，依据官方来源帮助交易者核对费率、注册链接和适用返还，降低交易成本。内容免费，由公开披露的交易所推荐计划资助。 |


# Tests

# Verification and limits

All commands ran from `pilot-01-prototype/`. Final supported-runtime checks used:

```sh
export PATH=/opt/homebrew/opt/node@24/bin:$PATH
```

Node: v24.19.0. The initial shell default was v26.0.0.

## Passing checks

```sh
npm run build
```

Exit 0 on Node 24; 2,689 prerender routes, critical CSS and server packaging completed. The first Node 26 attempt stopped at packaging because the isolated worktree lacked ignored `.openai/hosting.json`; the primary checkout's existing configuration was copied locally and remains untracked/ignored.

The final client was refreshed after the market-gating and disclosure-layout corrections. Only this task's generated `dist/client/assets` was removed first; existing generated prerender assets were retained:

```sh
node --input-type=module -e 'import {build} from "vite"; await build({build:{emptyOutDir:false}}); process.exit(0)'
node scripts/build-route-css.mjs
node scripts/build-critical-css.mjs
node scripts/prepare-sites-build.mjs
node scripts/verify-build-budget.mjs --strict
```

All exited 0. Entry static closure: **345,336 B gzip / 350,000 B maximum**. App shell: 102,155 B / 400,000 B; V3 route: 186,796 B / 320,000 B. Existing circular-chunk and >500 kB chunk warnings remain diagnostic warnings.

```sh
node --test tests/seo-striking-distance.test.mjs tests/compare-striking-distance.test.mjs tests/compare-direct-answers.test.mjs tests/compare-decision-ssr.test.mjs tests/referral-seo.test.mjs tests/referral-native.test.mjs tests/seo-onpage-venue-h1.test.mjs tests/striking-answer-first-2026-10-18.test.mjs tests/ctr-titles-2026-10-13.test.mjs tests/seo-onpage-metadata-length.test.mjs tests/clean-footer-locales-ssr.test.mjs tests/brand-slogan.test.mjs
```

62 passed, 0 failed. Covers EN/zh-Hans metadata parity, helper-bound codes, fee-led answers, reverse headings, body/footer links and all eight reverse 301s preserving locale/query context, plus forbidden-market Hyperliquid copy.

```sh
node --test tests/venue-graph.test.mjs tests/server-build-imports.test.mjs tests/invite-code-consistency.test.mjs
```

15 passed, 0 failed. Includes venue import/preload isolation, hydration, server dependency packaging and 2,692 built HTML documents across 17 locales.

```sh
node --test tests/seo-striking-distance.test.mjs tests/referral-native.test.mjs tests/clean-footer-locales-ssr.test.mjs
```

18 passed, 0 failed after the final disclosure CSS correction.

```sh
node --test tests/locales-ur-uk.test.mjs
```

9 passed, 0 failed. Draft translations retain their underlying numeric/source structure independently of the new EN/zh-Hans overlays.

```sh
npm run typecheck
git diff --check
```

Both passed.

Chrome + computer-use: home footer inspected at 390/768/1440 px; all 16 discovery links present without horizontal overflow. EN Hyperliquid inspected on mobile/desktop. zh-Hans Bybit inspected at 390/768/1440 px after fixing full-width disclosure grid placement; badges no longer squeeze and disclosure/referral details no longer overlap. These are sample visual checks, not a full visual sweep of every targeted route.

## Broader suite limitation

```sh
npm run test:sites
```

The initial Node 26 run recorded 1,820 completed top-level passes and 29 failures, then stalled without a final TAP summary. It ran while build artifacts were being regenerated, so it is not clean final-build evidence. Several old home/compare metadata expectations and the draft-translation assertion were subsequently updated and independently rerun successfully above. Remaining observed failures include academy generation, legacy home mockup/terminal expectations, Turkish content, attribution, prerender/package contracts, and unrelated content/retrieval expectations. No baseline comparison proves all remaining failures predate this task.

The stalled processes held `/tmp/seo-sites.log` (PIDs 26718 and 26733). Tool interruption attempts did not end the run; a direct process signal was refused by the filesystem/process sandbox. The local Vite preview was stopped. The broad suite's generated `tests/.tmp-audit-content-cz7sHl/` was left untracked because the stalled process may still own it. A supported-runtime broad rerun with a bounded process timeout remains open.

No deployment, Search Console mutation, ranking improvement, indexing or conversion result is claimed.

## Local commit blocker

`git add -u pilot-01-prototype` and explicit `git add` of the new files both failed:

```text
fatal: Unable to create '/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-seo-striking-distance/index.lock': Operation not permitted
```

The branch remains `codex/seo-striking-distance`. No changes were staged or committed. No existing lock file was removed. Recovery requires managed write access to the linked Git metadata directory, then staging the listed task files and creating the authorized local Lore-format commit. The worktree files and a complete patch are preserved locally.


# Open questions

- Local commit blocked by linked Git index.lock permissions; no commit was created.
- Broader test:sites run stalled and is not green final-build evidence.
- MEXC, Backpack and Jupiter lack a verified flat-rate lead; existing product/account/quote facts are used.
- Exact anti-phishing query landing page requires GSC query-page rows.

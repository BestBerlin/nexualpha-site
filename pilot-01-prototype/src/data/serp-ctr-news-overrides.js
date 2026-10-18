// Search-result title and description overrides for news articles that already rank but earn no clicks.
// One source for the Worker head (worker/index.js) and the client/prerender head (src/data/seo-injection.js).
//
// CTR pass 2026-10-13 (GSC 28 days to 2026-10-13, pages at position <= 15 with CTR < 3%): each title leads with the
// words people search with, adds a concrete number or date, and stays within 60 characters; each description gives the
// answer plus a reason to click in 120-155 characters, with no hype, guarantees or fine print.
// Articles whose content package is current (staging batch 20261011T2330) were also republished through the content
// lane with the same title and description; the older packages (September batches) predate the publisher's current
// gates, so their live feed rows keep their bodies and only the search snippet changes here.
//
// Shape: { [slug]: { title, description, question?, answer?, locales?: { [locale]: { title, description } } } }.
// The top-level title/description apply to the English edition; `locales` carries native snippets for other editions.
const BASE_OVERRIDES = {
  // Striking-distance pass 2026-10-15 (GSC 28 days to 2026-10-12): queries at positions 8-30 whose page still showed a
  // truncated title or the "source-mapped decision brief" template description.
  "optimism-usdt0-vs-opusdte-after-binance-contract-swap-user-controls": {
    title: "OPUSDTE vs USDT0 on Optimism: Binance's 1:1 USDT Swap",
    description: "After Binance's Optimism USDT swap, the new token is USDT0 and the old contract trades as OPUSDTE. Check the contract and network before you deposit.",
  },
  "how-to-register-mexc-account-complete-primary-kyc-and-secure-first-deposit": {
    title: "MEXC KYC Verification (2026): Register and Pass Primary KYC",
    description: "Does MEXC require KYC? Primary KYC asks for your ID-issuing country, an accepted ID type and clear photos. Register on the official domain, then verify.",
  },
  "how-to-create-gemini-account-verify-identity-and-set-withdrawal-protection": {
    title: "Gemini Identity Verification (2026): ID, Face Scan and 2FA",
    description: "Gemini verifies identity with a photo ID and may ask for a face scan. 2FA is required, and Withdrawal Protection holds new addresses for 7 days.",
  },
  "how-to-secure-a-kraken-account-passkeys-funding-2fa-verification": {
    title: "Kraken 2FA: Sign-in vs Funding 2FA, Passkeys and GSL",
    description: "Kraken separates sign-in 2FA from funding 2FA. Add a passkey or security key, turn on funding 2FA and Global Settings Lock before your first transfer.",
  },
  "okx-usd-to-usdc-spot-pair-migration": {
    title: "OKX USD to USDC Spot Pairs (2026): Orders, Bots, API Fixes",
    description: "OKX moved affected Crypto-USD spot pairs to Crypto-USDC in September 2026. See which orders, bots, API instId and tradeQuoteCcy settings to update.",
    question: "What should I check before the OKX USD to USDC spot-pair migration?",
    answer: "Check the official pair scope first, then inspect open orders, bots, API instrument identifiers, quote-currency handling and account balances before changing a live workflow.",
  },
  "hyperliquid-vs-dydx": {
    title: "Hyperliquid vs dYdX (2026): Fees, Funding and Liquidations",
    description: "Hyperliquid prices fees on 14-day volume and pays funding hourly; dYdX uses 30-day taker volume. Compare fees, funding, margin and liquidation.",
    question: "Should I choose Hyperliquid or dYdX for perp DEX trading?",
    answer: "Choose only after comparing fees and funding alongside collateral, liquidation, oracle, wallet recovery and regional access; no single quoted rate settles the decision.",
  },
  "tokenized-treasuries-structure-access-risks": {
    title: "Tokenized Treasuries: BUIDL, BENJI, Ownership and Redemption Checks",
    description: "Check what a tokenized Treasury legally represents before comparing yield: issuer, recordkeeper, custodian, redemption path, wallet controls and eligibility.",
    question: "What should I verify before comparing tokenized Treasury yield?",
  },
  "bybit-v5-api-rate-limit-header-retry-budget-checklist": {
    title: "Bybit API Rate Limits (V5): Headers, retCode 10006, Retries",
    description: "Bybit V5 limits are split by IP, by UID per endpoint and by WebSocket connections. Read the headers, handle retCode 10006 and 403 bans, retry safely.",
  },
  "bybit-vs-okx-api-key-ip-binding-expiry-withdraw-permission-controls": {
    title: "Bybit vs OKX API Keys: IP Binding, 90 vs 14-Day Expiry",
    description: "Bybit keys without a bound IP can expire after 90 days; OKX trade or withdraw keys after 14 inactive days. Compare permissions, IP limits and key rotation.",
  },
  "binance-sbe-vs-coinbase-websocket-market-data-schema-control-checklist": {
    title: "Binance SBE Market Data vs Coinbase WebSocket: Setup Checks",
    description: "What Binance SBE (Simple Binary Encoding) market data needs before going live: schema IDs, version pinning and a JSON fallback, vs Coinbase WebSocket.",
  },
  "okx-api-upcoming-changes-websocket-amend-cancel-order-controls": {
    title: "OKX API Docs: Upcoming WebSocket Amend & Cancel Changes",
    description: "What the OKX API upcoming-changes page means for WebSocket amend and cancel orders: rate-limit counters, clOrdId reconciliation and a safe rollout order.",
  },
  "bybit-tradfi-cfd-leverage-upgrade-margin-release-risk-radar": {
    title: "Bybit TradFi CFD Leverage 1:2000 (Sept 2026): Margin Changes",
    description: "From Sept 21, 2026 Bybit raised Gold and Forex CFD leverage to 1:2000 and moved 20 stock CFDs to tiers up to 1:100. What it does to your margin and stops.",
  },
  "okx-api-kyc-order-tagged-rate-limit-migration-checklist": {
    title: "OKX API Rate Limits & KYC: Order-Tagged Limits Explained",
    description: "OKX API order access and rate limits can change with KYC level, endpoint and request tag. Run these 8 checks before you route live orders through the API.",
  },
  "how-to-use-jupiter-connect-wallet-and-make-first-swap-safely": {
    title: "How to Use Jupiter (2026): Connect a Wallet, First Swap",
    description: "Jupiter needs no account: open the official site, connect a Solana wallet, check token mints, route and slippage, then make a small first swap.",
    locales: {
      "zh-Hans": {
        title: "Jupiter 怎么用（2026）：连接钱包与首次兑换",
        description: "Jupiter 无需注册账户：打开官方域名，连接 Solana 钱包，核对代币合约地址、路由与滑点，先用小额完成首次兑换，再在链上确认结果。本文按步骤说明每一步要看什么、在哪里停下，以及在钱包里签名之前必须逐项核对的交易提示、授权范围与代币合约地址。",
      },
    },
  },
  "binance-spot-api-rate-limit-websocket-order-control-checklist": {
    title: "Binance Spot API Rate Limits: 429, 418 Bans, 24h WebSocket",
    description: "Binance WebSocket API sessions end after 24 hours, a 429 means you hit a limit and repeats trigger 418 bans. Read rateLimits and budget orders safely.",
  },
  "bybit-vs-okx-subaccounts-risk-isolation-api-controls": {
    title: "Bybit vs OKX Subaccounts (2026): Transfers, API, Withdrawals",
    description: "Bybit subaccounts split P&L and route withdrawals through the main account; OKX scopes API keys per subaccount with Read, Trade and Withdraw rights.",
  },
  "circle-noble-usdc-cctp-v1-winddown-exit-redemption-timeline": {
    title: "Circle Noble USDC Exit: Key Dates to Jan 12, 2027 (CCTP V1)",
    description: "Circle stops new USDC minting on Noble on Oct 13, 2026; CCTP V1 burn limits shrink from Oct 31 and redemptions end Jan 12, 2027. Pick an exit path now.",
  },
  "binance-travel-rule-address-book-satoshi-test-checklist": {
    title: "Binance Satoshi Test: Verify Your Wallet for Travel Rule",
    description: "Binance's Satoshi Test proves you control a self-hosted wallet with a tiny transfer. How it fits the Travel Rule address book and what to check first.",
  },
  "coinbase-address-allowlist-setup-network-hold-tutorial": {
    title: "Coinbase Address Allowlist: Setup Steps and Hold Periods",
    description: "Turn on the Coinbase allowlist under Profile > Settings > Allow list, add one address, wait out the hold, then send a small test before relying on it.",
  },
  "crypto-exchange-websocket-sequence-checksum-gap-recovery-disclosure-radar": {
    title: "WebSocket Order Book Gaps: Sequence & Checksum by Exchange",
    description: "How Binance, OKX and Coinbase let you detect WebSocket gaps with sequence IDs and checksums, and when your bot must rebuild the order book from a snapshot.",
  },
  "bybit-brazil-entity-migration-kyc-liquidation-fiat-conversion-deadline-checklist": {
    title: "Bybit Brazil Migration (2026): KYC, BRL and Sept 21 Deadline",
    description: "Bybit moved eligible Brazilian users to a local entity: open positions could be force-closed on Sept 21, 2026 and unsupported fiat converted to USDT.",
  },
  "kraken-rest-authentication-api-signature-nonce-order-action-checklist": {
    title: "Kraken API Authentication: Signature, Nonce & Errors (2026)",
    description: "How Kraken REST API signing works: API-Key and API-Sign headers, an always-increasing nonce, and the checks to run before a bot places live orders.",
  },
};

// Striking-distance pass 2026-10-18 (GSC 28 days 2026-09-21..2026-10-18, average position 8-20; evidence in
// nx-agents/seo/striking-2026-10-18.json). Each entry leads with the words people searched with and answers them.
// `h1` replaces the visible headline and `intro` is the one-paragraph answer shown above the article body, both only on
// the edition they belong to. Every fact in an intro is taken from that article's own verified-source section.
const STRIKING_2026_10_18 = {
  "how-to-register-okx-account-verify-identity-safely": {
    // okx account (pos 15), okx register (22), okex verification (16)
    title: "OKX Account: How to Register and Verify Identity (2026)",
    description: "Open an OKX account on okx.com or the app: pick the region you live in, verify email and phone (one account each), set a password, then pass ID checks.",
    h1: "OKX Account: How to Register and Verify Your Identity (KYC)",
    intro: "To register an OKX account, use only okx.com or the official app and pick the country or region where you ordinarily live: OKX says residence can decide the service entity and the features you get. Verify your email and phone (each can register only one account), set a unique password, then start identity verification (KYC) from the signed-in verification page.",
    locales: {
      "zh-Hans": {
        title: "OKX 怎么注册？账户注册与身份认证（2026）",
        description: "OKX 注册开户：只用 okx.com 官网或官方 App，选择你实际居住的国家或地区，验证邮箱和手机号（各只能注册一个账户），设置唯一密码，再在登录后的认证页面完成身份认证（KYC），审核通过后先看账户实际开放的产品与限额，再小额入金测试。",
        h1: "OKX 怎么注册账户并完成身份认证（KYC）",
        intro: "注册 OKX 账户只用 okx.com 官网或官方 App，并选择你当前实际居住的国家或地区：OKX 表示居住地可能决定服务实体和可用功能。依次验证邮箱和手机号（每个只能注册一个账户）、设置唯一密码，然后在登录后的认证页面开始个人身份认证（KYC）。",
      },
    },
  },
  "okx-api-upcoming-changes-websocket-amend-cancel-order-controls": {
    // okx api doc (pos 22.8, 9 impressions), okx api docs (20)
    h1: "OKX API Docs: Upcoming Changes to WebSocket Amend and Cancel Orders",
    intro: "The OKX API docs keep an upcoming-changes page that lists endpoint and rate-limit changes before they go live. For WebSocket amend and cancel orders, record which endpoint changed, whether its rate limit changed and how order IDs and client order IDs reconcile, then stage the change before it touches production.",
    locales: {
      "zh-Hans": {
        title: "OKX API 文档：WebSocket 改单与撤单即将变更",
        description: "OKX API 文档的“即将变更”页面会提前列出接口与限频调整。处理 WebSocket 改单和撤单变更前，先记录哪个接口变了、限频计数是否变化、订单 ID 与客户端订单 ID 如何对账，在测试环境演练通过后再接入实盘交易，避免重复下单或漏撤单。",
        h1: "OKX API 文档：WebSocket 改单与撤单接口即将变更",
        intro: "OKX API 文档设有“即将变更”页面，会在上线前列出接口与限频调整。处理 WebSocket 改单和撤单时，先记录哪个接口变了、限频是否变化、订单 ID 与客户端订单 ID 如何对账，再在测试环境演练，确认无误后才接入实盘。",
      },
    },
  },
  "why-is-bitcoin-up-today-back-above-83k-shorts-squeezed-chip-perps": {
    // The feed title ran past 60 characters and was cut mid-sentence in results.
    title: "Why Is Bitcoin Up Today? BTC Back Above $83K (13 Oct 2026)",
    description: "BTC rebounded 3.3% from $81,033 to ~$83,700 on 13 Oct 2026 as $83M of shorts were liquidated in 4 hours, while SanDisk and SK Hynix perps kept falling.",
    locales: {
      "zh-Hans": {
        title: "比特币今天为什么涨？重回 8.3 万美元（10月13日）",
        description: "2026 年 10 月 13 日，BTC 从币安低点 81,033 美元反弹约 3.3%，回到 83,700 美元附近；四小时内币安和 OKX 记录 8,330 万美元强平，几乎全是空单，而闪迪、SK 海力士等芯片股永续合约当天仍在继续下跌。",
      },
    },
  },
  "how-to-register-mexc-account-complete-primary-kyc-and-secure-first-deposit": {
    // "mexc" "verification" "kyc" (pos 18.2), does mexc require kyc (75)
    h1: "MEXC KYC Verification: How to Register and Pass Primary KYC",
    intro: "Yes, MEXC uses KYC: MEXC says some features require completed identity verification. Primary KYC asks for the country that issued your ID, an accepted ID type and clear document photos, so register by email or phone on the official MEXC site first, then open the Identification page.",
  },
  "okx-api-kyc-order-tagged-rate-limit-migration-checklist": {
    // okx api doc (pos 21.5), okx rate limit (19)
    title: "OKX API Rate Limits: KYC Level and Order-Tagged Limits",
    h1: "OKX API Rate Limits and KYC: Order-Tagged Limit Checklist",
    intro: "OKX API rate limits are set per endpoint, and the OKX API docs show that order access and rate-limit keys can change with your account's KYC level and the request tag. Before routing live orders, record your KYC level, API key scope, each endpoint's limit and a stop rule for any 429 response.",
    locales: {
      "zh-Hans": {
        title: "OKX API 限频：KYC 等级与订单标签限频",
        description: "OKX API 的限频按接口设置；OKX API 文档显示，下单权限和限频键可能随账户 KYC 等级和请求标签变化。用 API 实盘下单前，先记录 KYC 等级、API Key 权限、各接口限频，以及遇到 429 错误时的停止规则，避免账户被限流。",
        h1: "OKX API 限频与 KYC：订单标签限频迁移清单",
        intro: "OKX API 的限频按接口设置，OKX API 文档显示下单权限和限频键可能随账户 KYC 等级和请求标签而变化。用 API 实盘下单前，先记录你的 KYC 等级、API Key 权限范围、每个接口的限频，以及收到 429 错误时的停止规则。",
      },
    },
  },
  "how-to-use-jupiter-connect-wallet-and-make-first-swap-safely": {
    h1: "How to Use Jupiter: Connect a Wallet and Make a First Swap",
    intro: "Jupiter needs no account: you connect a Solana wallet on jup.ag and sign each swap in that wallet. Jupiter's docs say its Metis routing engine powers swaps on jup.ag and every swap runs quote, build transaction, sign and send, so start with a small amount and check the token mint, route and slippage.",
    locales: {
      "zh-Hans": {
        h1: "Jupiter 怎么用：连接钱包并完成首次兑换",
        intro: "Jupiter 不需要注册账户：在官方站点 jup.ag 连接 Solana 钱包，每笔兑换都在钱包里签名。Jupiter 文档说明，jup.ag 上的兑换由 Metis 路由引擎完成，流程是报价、构建交易、签名、发送；第一次先用小额，并核对代币合约地址、路由和滑点。",
      },
    },
  },
  "coinbase-address-allowlist-setup-network-hold-tutorial": {
    h1: "Coinbase Address Allowlist: How to Set It Up and the 48-Hour Hold",
    intro: "Turn on the Coinbase allowlist under Profile > Settings > Allow list; you need access to your 2-step verification method. Coinbase says a newly added address can receive sends after 48 hours, and Coinbase Exchange uses a separate Address Book, so make a small test send before relying on the list.",
    locales: {
      "zh-Hans": {
        title: "Coinbase 地址允许名单：设置步骤与 48 小时等待",
        description: "在 Coinbase 的“个人资料 > 设置 > Allow list”开启地址允许名单，需要用到两步验证。Coinbase 表示新添加的地址 48 小时后才能用于发送；Coinbase Exchange 使用独立的 Address Book，两者不要混用，正式转账前先小额测试。",
        h1: "Coinbase 地址允许名单怎么设置：步骤与 48 小时等待期",
        intro: "在 Coinbase 的“个人资料 > 设置 > Allow list”开启地址允许名单，需要能使用你的两步验证。Coinbase 表示新添加的地址要 48 小时后才能用于发送，Coinbase Exchange 则使用独立的 Address Book；正式依赖允许名单之前，先做一笔小额测试转账。",
      },
    },
  },
  "how-to-onboard-hyperliquid-connect-wallet-enable-trading-and-test-deposit": {
    // hyperliquid deposit (pos 70); the feed title was cut mid-sentence at 60 characters.
    title: "Hyperliquid Deposit: Connect a Wallet, Enable Trading (2026)",
    description: "To deposit on Hyperliquid, connect a DeFi wallet or log in by email, sign the gasless Enable Trading action, then send a small test on a supported network.",
    h1: "Hyperliquid Deposit and Onboarding: Wallet, Enable Trading, First Transfer",
    intro: "To deposit on Hyperliquid, connect a DeFi wallet to the official app (or log in by email and receive a new address), sign the gasless Enable Trading action, then pick an officially supported asset and network. Send a small test amount first and check that it arrives before moving more.",
  },
  "how-to-set-up-coinbase-advanced-trade-api-key-portfolio-permissions-safely": {
    // coinbase advanced trade api docs (pos 56)
    title: "Coinbase Advanced Trade API Docs: Keys, JWT and Portfolios",
    description: "Coinbase Advanced Trade API docs cover REST and WebSocket access with CDP API keys and JWTs. Use one key per portfolio and test read-only calls first.",
    h1: "Coinbase Advanced Trade API Docs: Set Up a Portfolio API Key Safely",
    intro: "The Coinbase Advanced Trade API docs describe REST and WebSocket access authenticated with CDP API keys and JWT bearer tokens. Coinbase's portfolio guidance says each Advanced Trade portfolio should have its own dedicated API key to limit access, so create one key per portfolio and start with read-only calls.",
    locales: {
      "zh-Hans": {
        title: "Coinbase 高级交易 API 文档：密钥与权限",
        description: "Coinbase Advanced Trade API 文档说明，REST 与 WebSocket 接口通过 CDP API Key 和 JWT 令牌鉴权。Coinbase 建议每个 Advanced Trade 投资组合单独创建一个 API Key 以限制访问范围；先用只读接口测试，再开放交易权限。",
        h1: "Coinbase Advanced Trade API 文档：安全设置投资组合 API Key",
        intro: "Coinbase Advanced Trade API 文档说明，REST 和 WebSocket 接口使用 CDP API Key 与 JWT 令牌鉴权。Coinbase 的投资组合指南建议每个 Advanced Trade 投资组合使用专属 API Key 来限制访问范围：一个组合建一个 Key，先从只读接口开始测试。",
      },
    },
  },
  "how-to-unlock-kraken-pro-stock-trading-and-verify-equities-eligibility": {
    // The feed title was cut mid-sentence at 60 characters.
    title: "Kraken Pro Stock Trading: How to Check Eligibility (2026)",
    description: "Kraken Pro stock trading appears only when your signed-in account shows equities access. Check the broker entity, region notice, funding and fees first.",
    h1: "Kraken Pro Stock Trading: How to Check Eligibility and Unlock It",
    intro: "Kraken Pro stock trading is unlocked per account: it is available only when your signed-in Kraken account shows eligible equities access. Before your first order, confirm the legal entity, broker disclosure, jurisdiction message, cash funding route and fee schedule shown in the app.",
    locales: {
      "zh-Hans": {
        title: "Kraken Pro 股票交易：如何核验资格并开通",
        description: "Kraken Pro 股票交易按账户开放：只有登录后的 Kraken 账户显示可交易股票（equities）时才能使用。下第一笔单前，先核对法律实体、券商披露、地区提示、现金入金方式和手续费表，任何一项缺失就先停下观察，不要强行申请开通该功能。",
        h1: "Kraken Pro 股票交易怎么开通：先核验 Equities 资格",
        intro: "Kraken Pro 股票交易按账户开放：只有登录后的 Kraken 账户显示可交易股票（equities）时才能使用。下第一笔单之前，先在 App 里核对法律实体、券商披露、地区提示、现金入金方式和手续费表。",
      },
    },
  },
  "binance-travel-rule-address-book-satoshi-test-checklist": {
    // binance satoshi test (pos 10)
    h1: "Binance Satoshi Test: How to Verify Your Wallet for the Travel Rule",
    intro: "The Binance Satoshi Test proves you control a self-hosted wallet by sending a tiny transfer from it. It is part of Binance's Travel Rule flow, where crypto deposits and withdrawals can require sender or recipient details, and saved address-book entries can pre-validate future transfers.",
    locales: {
      "zh-Hans": {
        title: "币安 Satoshi Test：Travel Rule 钱包验证",
        description: "币安的 Satoshi Test 通过一笔极小额转账，证明你控制某个自托管钱包地址。它属于币安的 Travel Rule 流程：充值和提现可能要求填写汇款方或收款方信息，地址簿中保存的收款信息可用于预先验证之后的每一笔转账，减少重复填写信息。",
        h1: "币安 Satoshi Test 是什么：Travel Rule 钱包验证与地址簿",
        intro: "币安的 Satoshi Test 通过从自托管钱包发出一笔极小额转账，证明这个地址由你控制。它属于币安的 Travel Rule 流程：加密货币充值和提现可能要求填写汇款方或收款方信息，地址簿里保存的信息可以预先验证之后的转账。",
      },
    },
  },
  "how-to-use-uniswap-connect-wallet-and-make-first-swap-safely": {
    // "uniswap" + "connect wallet" / "verify wallet" / "sync wallet" (pos 6-21): people check whether a wallet
    // "verification" page is real. The feed title was cut at 60 characters.
    title: "How to Use Uniswap (2026): Connect a Wallet, First Swap",
    description: "Uniswap has no account to register: connect a self-custody wallet to the official app, check token contract, network, fees and slippage, then swap small.",
    h1: "How to Use Uniswap: Connect a Wallet and Make a First Swap",
    intro: "Uniswap has no sign-up: you connect a self-custody wallet to the official Uniswap web app and confirm each swap in that wallet. Uniswap never needs your recovery phrase, so stop if any page or wallet prompt asks you to enter it to \"verify\" or \"sync\" a wallet.",
    locales: {
      "zh-Hans": {
        title: "Uniswap 怎么用（2026）：连接钱包与首次兑换",
        description: "Uniswap 不需要注册账户：把自托管钱包连接到 Uniswap 官方网页应用，核对代币合约、网络、手续费、价格影响和滑点，先用小额完成首次兑换。任何页面要求输入助记词来“验证”或“同步”钱包，都应立即停止，绝对不要输入，这类页面都不是 Uniswap 官方。",
        h1: "Uniswap 怎么用：连接钱包并完成首次兑换",
        intro: "Uniswap 不需要注册：把自托管钱包连接到 Uniswap 官方网页应用，每笔兑换都在钱包里确认。Uniswap 从不需要你的助记词，任何页面或钱包弹窗要求输入助记词来“验证”或“同步”钱包，都应立即停止。",
      },
    },
  },
  "okx-websocket-orders-state-live-finality-checklist": {
    // okx rpi (pos 10)
    title: "OKX RPI & Post-Only Orders: WebSocket state live Change",
    description: "Since OKX's July 16, 2026 change, post_only, mmp_and_post_only and rpi orders push state live only after book entry, about 1 ms later. Update your bot.",
    h1: "OKX RPI and Post-Only Orders: The WebSocket \"state: live\" Change",
    intro: "OKX changed its WebSocket orders channel on July 16, 2026: for post_only, mmp_and_post_only and rpi orders, \"state: live\" now arrives only after the order enters the book, about one millisecond later. A post-only order that would cross the best bid or offer now pushes only \"state: canceled\".",
    locales: {
      "zh-Hans": {
        title: "OKX RPI 与只挂单订单：state live 推送变更",
        description: "OKX 于 2026 年 7 月 16 日调整 WebSocket 订单频道：post_only、mmp_and_post_only 和 rpi 订单的“state: live”改为成功挂入订单簿后才推送，约晚 1 毫秒；会穿越最优买卖价的只挂单订单只推送“state: canceled”。",
        h1: "OKX RPI 与只挂单订单：WebSocket“state: live”推送变更",
        intro: "OKX 于 2026 年 7 月 16 日调整 WebSocket 订单频道：post_only、mmp_and_post_only 和 rpi 订单的“state: live”改为在订单成功进入订单簿后才推送，大约晚 1 毫秒；会穿越最优买卖价而下单失败的只挂单订单，现在只推送“state: canceled”。",
      },
    },
  },
};

// The 2026-10-18 entries extend (and for shared slugs refine) the earlier passes; editions merge field by field.
function mergeOverrides(base, extra) {
  const out = { ...base };
  for (const [slug, entry] of Object.entries(extra)) {
    const prev = out[slug] || {};
    const locales = { ...(prev.locales || {}) };
    for (const [locale, fields] of Object.entries(entry.locales || {})) locales[locale] = Object.freeze({ ...(locales[locale] || {}), ...fields });
    out[slug] = Object.freeze({ ...prev, ...entry, ...(Object.keys(locales).length ? { locales: Object.freeze(locales) } : {}) });
  }
  return out;
}

export const SERP_CTR_NEWS_OVERRIDES = Object.freeze(mergeOverrides(BASE_OVERRIDES, STRIKING_2026_10_18));

/** Override for one article edition, or null. English uses the top-level fields; other editions use `locales`. */
export function serpCtrNewsOverride(slug, locale) {
  const entry = SERP_CTR_NEWS_OVERRIDES[slug];
  if (!entry) return null;
  if (locale === "en") return entry;
  const localized = entry.locales?.[locale];
  return localized ? { ...localized } : null;
}

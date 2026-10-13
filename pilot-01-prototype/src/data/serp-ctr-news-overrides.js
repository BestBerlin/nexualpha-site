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
export const SERP_CTR_NEWS_OVERRIDES = Object.freeze({
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
});

/** Override for one article edition, or null. English uses the top-level fields; other editions use `locales`. */
export function serpCtrNewsOverride(slug, locale) {
  const entry = SERP_CTR_NEWS_OVERRIDES[slug];
  if (!entry) return null;
  if (locale === "en") return entry;
  const localized = entry.locales?.[locale];
  return localized ? { ...localized } : null;
}

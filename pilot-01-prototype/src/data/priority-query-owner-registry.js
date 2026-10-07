const TOKENIZED_TREASURY_OWNER = Object.freeze({
  id: "tokenized-treasuries",
  canonicalOwnerPath: "/topics/tokenized-treasuries",
  supportPath: "/news/tokenized-treasuries-structure-access-risks",
  genericQueries: ["tokenized treasury", "tokenized treasuries", "what are tokenized treasuries"],
  supportOnlyQueries: [
    "BUIDL BENJI tokenized treasury comparison",
    "tokenized Treasury issuer custody redemption boundary",
    "tokenized treasury redemption risk",
    "tokenized assets custody proof",
    "RWA treasury transfer restrictions",
    "tokenized asset ownership redemption evidence",
  ],
  ownerBoundary:
    "Generic tokenized treasury and tokenized treasuries queries should land on the evergreen checklist owner. The dated article remains a support page for BUIDL, BENJI, ownership, redemption and source-trail reading.",
});

const HYPERLIQUID_OWNER = Object.freeze({
  id: "hyperliquid-decision",
  canonicalOwnerPath: "/exchanges/hyperliquid",
  supportPath: "/compare/hyperliquid-vs-dydx",
  genericQueries: ["hyperliquid fees", "hyperliquid funded account", "hyperliquid cashback"],
  supportOnlyQueries: [
    "Hyperliquid vs dYdX fees funding liquidation comparison",
    "Hyperliquid liquidation and collateral risk",
    "Hyperliquid referral discount source check",
  ],
  ownerBoundary:
    "Hyperliquid fee, cashback and funded-account queries should land on the venue owner because the owner answer separates published fees, funding, referral language, vault/sub-account exclusions and funded-account boundaries. The comparison page remains a support route for dYdX alternatives.",
});

const UNISWAP_OWNER = Object.freeze({
  id: "uniswap-testnet-mainnet",
  canonicalOwnerPath: "/exchanges/uniswap",
  supportPath: "/compare/uniswap-vs-jupiter",
  genericQueries: ["uniswap testnet", "uniswap testnet swap", "uniswap mainnet swap"],
  supportOnlyQueries: [
    "Uniswap vs Jupiter swap route comparison",
    "Uniswap Permit2 approval check",
    "Uniswap token approval revoke",
  ],
  ownerBoundary:
    "Uniswap testnet and mainnet swap queries should land on the Uniswap owner because the owner answer separates API/testnet research from live wallet signing, token contracts, Permit2, approvals, gas and transaction preview. The Jupiter comparison remains a support route.",
});

const BYBIT_BITGET_OWNER = Object.freeze({
  id: "bybit-vs-bitget-decision",
  canonicalOwnerPath: "/compare/bybit-vs-bitget",
  supportPath: "/topics/tokenized-stocks-vs-perpetuals",
  genericQueries: ["bybit vs bitget", "bybit vs bitget fees", "bitget 与 bybit uta对比", "bybit bitget uta"],
  supportOnlyQueries: [
    "Bybit xStocks vs Bitget stock futures",
    "Bybit and Bitget copy trading fee comparison",
    "Bybit Bitget unified trading account collateral liquidation",
  ],
  ownerBoundary:
    "Bybit vs Bitget and UTA queries should land on the comparison owner. Tokenized-stock and stock-perpetual pages support product-boundary searches but should not compete with the direct comparison query.",
});

const AERODROME_OWNER = Object.freeze({
  id: "aerodrome-base-dex",
  canonicalOwnerPath: "/exchanges/aerodrome",
  supportPath: "/factbook/aerodrome",
  genericQueries: ["aerodrome", "aerodrome fees", "aerodrome slipstream", "aerodrome veaero"],
  supportOnlyQueries: [
    "Aerodrome pool source record",
    "Aerodrome Base contract source trail",
  ],
  ownerBoundary:
    "Aerodrome, Base pool, Slipstream, veAERO and Aerodrome pool-fee queries should land on the venue owner. The factbook remains a support route for compact sourced facts rather than a competing decision page.",
});

const GATE_IO_OWNER = Object.freeze({
  id: "gate-io-decision",
  canonicalOwnerPath: "/exchanges/gate-io",
  supportPath: "/news/how-to-register-gate-account-complete-identity-verification-and-secure-access",
  genericQueries: ["gate.io fees", "gate io fees", "gate.io referral code", "gate.io kyc", "gate.io 紹介コード", "taxa gate io", "taxas gate io"],
  supportOnlyQueries: [
    "how to register Gate account",
    "Gate identity verification and secure access",
    "Gate.io vs Coinbase",
    "Gate.io vs MEXC",
  ],
  ownerBoundary:
    "Gate.io fee, KYC, regional-condition and referral-flow queries should land on the venue owner. Registration tutorials and named platform comparisons remain support routes and should link back without replacing the owner.",
});

const GMX_OWNER = Object.freeze({
  id: "gmx-v2-decision",
  canonicalOwnerPath: "/exchanges/gmx",
  supportPath: "/factbook/gmx",
  genericQueries: ["gmx v2", "gmx v2 perpetual dex", "gmx fees", "gmx funding fees", "gmx price impact"],
  supportOnlyQueries: [
    "GMX pool source record",
    "GMX vs Hyperliquid",
    "crypto perpetual platform comparison",
  ],
  ownerBoundary:
    "GMX brand, GM or GLV pool, price-impact, borrow-cost and funding queries should land on the GMX venue owner. The factbook and broad perpetual guides remain supporting context.",
});

const DERIBIT_OWNER = Object.freeze({
  id: "deribit-options-decision",
  canonicalOwnerPath: "/exchanges/deribit",
  supportPath: "/factbook/deribit",
  genericQueries: ["deribit", "deribit fees", "deribit options fees", "deribit margin", "deribit api", "deribit liquidation"],
  supportOnlyQueries: [
    "crypto derivatives platform",
    "crypto perpetual platform comparison",
    "tokenized stocks vs perpetuals",
  ],
  ownerBoundary:
    "Deribit brand, options-fee, margin, API and liquidation queries should land on the Deribit venue owner. Broad derivatives and perpetual-platform searches should remain with the evergreen derivatives topic.",
});

const DRIFT_OWNER = Object.freeze({
  id: "drift-protocol-decision",
  canonicalOwnerPath: "/exchanges/drift",
  supportPath: "/factbook/drift",
  genericQueries: ["drift", "drift protocol", "drift exchange", "drift protocol fees", "drift protocol review"],
  supportOnlyQueries: [
    "CEX vs DEX vs Perp DEX",
    "perpetual dex comparison",
    "crypto derivatives platform",
  ],
  ownerBoundary:
    "Drift brand and protocol-status queries should land on the Drift venue owner, where source status and stop conditions are explicit. Broad venue-model and perpetual-DEX comparisons should remain with the supporting guide.",
});

const DERIVATIVES_OWNER = Object.freeze({
  id: "crypto-perpetual-platform",
  canonicalOwnerPath: "/topics/derivatives",
  supportPath: "/news/cex-vs-dex-vs-perp-dex",
  genericQueries: ["crypto perpetual platform", "crypto perpetual platform comparison", "perpetual dex comparison", "crypto derivatives platform"],
  supportOnlyQueries: [
    "CEX vs DEX vs Perp DEX",
    "Hyperliquid vs dYdX",
    "GMX fees",
    "Deribit options fees",
  ],
  ownerBoundary:
    "Broad crypto perpetual-platform and derivatives-platform queries should land on the evergreen derivatives topic. Brand queries and named platform comparisons should remain with their venue or comparison owners.",
});

const NO_KYC_OWNER = Object.freeze({
  id: "no-kyc-access",
  canonicalOwnerPath: "/topics/no-kyc",
  supportPath: "/news/exchange-subaccount-kyc-api-restriction-disclosure-radar",
  genericQueries: ["no kyc crypto platform", "no kyc crypto exchange", "crypto without kyc", "no kyc perpetual dex"],
  supportOnlyQueries: [
    "exchange subaccount KYC restrictions",
    "does Hyperliquid require KYC",
    "does Uniswap require KYC",
  ],
  ownerBoundary:
    "Generic no-KYC access, wallet-access and withdrawal-identity queries should land on the evergreen no-KYC topic. Venue-specific access and dated restriction reports remain support pages.",
});

const MEME_COINS_OWNER = Object.freeze({
  id: "meme-coin-platform",
  canonicalOwnerPath: "/topics/meme-coins",
  supportPath: "/news/gate-vs-mexc-spot-order-types-control-boundaries",
  genericQueries: ["meme coin platform", "meme coin exchange", "best meme coins", "أفضل عملات الميم", "افضل عملات الميم", "밈코인 거래소"],
  supportOnlyQueries: [
    "Gate vs MEXC spot order types",
    "Raydium meme coin pool",
    "meme token contract check",
  ],
  ownerBoundary:
    "Generic meme-coin platform queries, including Arabic and Korean generic variants, should land on the localized evergreen meme-coin topic. Venue and pair-specific searches should remain with venue or comparison owners.",
});

export const PRIORITY_QUERY_OWNER_REGISTRY = Object.freeze({
  "hyperliquid-decision": HYPERLIQUID_OWNER,
  "uniswap-testnet-mainnet": UNISWAP_OWNER,
  "bybit-vs-bitget-decision": BYBIT_BITGET_OWNER,
  "tokenized-treasuries": TOKENIZED_TREASURY_OWNER,
  "aerodrome-base-dex": AERODROME_OWNER,
  "gate-io-decision": GATE_IO_OWNER,
  "gmx-v2-decision": GMX_OWNER,
  "deribit-options-decision": DERIBIT_OWNER,
  "drift-protocol-decision": DRIFT_OWNER,
  "crypto-perpetual-platform": DERIVATIVES_OWNER,
  "no-kyc-access": NO_KYC_OWNER,
  "meme-coin-platform": MEME_COINS_OWNER,
});

export const PRIORITY_QUERY_OWNER_ALIASES = Object.freeze(
  Object.fromEntries(
    Object.values(PRIORITY_QUERY_OWNER_REGISTRY).flatMap((owner) =>
      owner.genericQueries.map((query) => [query.toLowerCase(), owner.id])
    )
  )
);

export function priorityOwnerForQuery(query) {
  const ownerId = PRIORITY_QUERY_OWNER_ALIASES[String(query || "").trim().toLowerCase()];
  return ownerId ? PRIORITY_QUERY_OWNER_REGISTRY[ownerId] : null;
}

export function priorityOwnerForPath(pathname) {
  return Object.values(PRIORITY_QUERY_OWNER_REGISTRY).find((owner) =>
    owner.canonicalOwnerPath === pathname || owner.supportPath === pathname
  ) || null;
}

export function priorityCanonicalOwnerPath(pathnameOrQuery) {
  const value = String(pathnameOrQuery || "").trim();
  return priorityOwnerForPath(value)?.canonicalOwnerPath || priorityOwnerForQuery(value)?.canonicalOwnerPath || value;
}

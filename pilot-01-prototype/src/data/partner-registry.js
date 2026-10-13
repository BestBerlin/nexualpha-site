// NexuAlpha 真实平台注册与邀请码配置表
// 集中管理 21 家平台的官方主域名、完整注册链接、邀请码及透明返佣说明。

// ==========================================
// 💡 各交易所独立邀请码及注册直达配置中心
// 用户可根据自身在各交易所的渠道代理资质，随时替换为独立代码
// ==========================================
export const CUSTOM_INVITE_CODES = {
  binance: "11350287",           // 币安官方邀请码
  okx: "nexu888",               // 欧易官方邀请码
  bybit: "48553",               // Bybit官方合作码
  bitget: "nexu888",            // Bitget专属渠道码
  "gate-io": "nexubest",        // Gate.io专属邀请码
  kucoin: "NEXU_KUCOIN",        // KuCoin专属邀请码（待补充）
  mexc: "4BRhe",                // MEXC专属优惠码
  backpack: "LuckyBitcoin",     // Backpack专属推荐码
  hyperliquid: "NEXU888",       // Hyperliquid推荐码
  kraken: "7f97gkqw",           // Kraken推荐码
  deribit: "NEXU_DERIBIT",      // Deribit专属优惠码
  gmx: "NEXU_GMX",              // GMX推荐码
  drift: "NEXU_DRIFT",          // Drift推荐码
  htx: "nexu888",               // HTX专属邀请码
};

// 甲方提供的完整合作链接簇。registrationUrl 使用首选链接，
// alternateRegistrationUrls 保留同一平台的备用/地区渠道，避免只保留单一入口。
export const PARTNER_REGISTRATION_URLS = {
  // Owner instruction 2026-10-10: the official binance.com link is the primary route; bsmkweb.cc stays as an
  // alternate for regions where binance.com is blocked (same referral 11350287).
  binance: [
    "https://www.binance.com?ref=11350287",
    "https://www.binance.com/join?ref=11350287",
    "https://accounts.binance.com/register?ref=11350287",
    "https://www.bsmkweb.cc/join?ref=11350287&utm_medium=web_share_copy",
    "https://www.bsmkweb.cc/join?ref=11350287",
  ],
  bitget: [
    "https://partner.bitget.cafe/bg/C6PRAF",
    "https://partner.bitget.cafe/bg/neh7w5h9",
    "https://partner.bitget.cafe/bg/7nfg94491669857692277",
    "https://partner.bitget.cafe/bg/7nfg8123",
    "https://partner.bitget.cafe/bg/7nfg70121688265185866",
    "https://partner.bitget.cafe/bg/7nfg38641689775663839",
    "https://partner.bitget.com/bg/zc8pmupf",
    "https://www.bitget.com/expressly?channelCode=nexu888&vipCode=nexu888",
  ],
  okx: [
    "https://www.okx.com/join/nexu888",
    "https://www.topzhjdgxcb.net/join/CANDY007",
    "https://www.topzhjdgxcb.net/join/BESTBERLIN2024",
    "https://www.topzhjdgxcb.net/join/INS898",
    "https://www.topzhjdgxcb.net/join/1836370407",
    "https://www.topzhjdgxcb.net/join/QICYQ",
    "https://www.topzhjdgxcb.net/join/BL686",
  ],
  backpack: [
    "https://backpack.exchange/join/luckybitcoin",
    "https://backpack.exchange/refer/LuckyBitcoin",
  ],
};

export const partnerRegistry = {
  binance: {
    slug: "binance",
    name: "Binance",
    category: "CEX",
    officialDomain: "www.binance.com",
    hasReferral: true,
    inviteCode: CUSTOM_INVITE_CODES.binance,
    registrationUrl: PARTNER_REGISTRATION_URLS.binance[0],
    alternateRegistrationUrls: PARTNER_REGISTRATION_URLS.binance.slice(1),
    benefit: {
      en: "Exclusive trading fee rebate & welcome mystery box",
      "zh-Hans": "享专属手续费返还与新手盲盒奖励",
      "zh-Hant": "享專屬手續費返還與新手盲盒獎勵",
    },
    kycRequired: true,
    accountType: {
      en: "Account-based (Email / Mobile)",
      "zh-Hans": "账户托管式（邮箱 / 手机注册）",
      "zh-Hant": "帳戶託管式（郵箱 / 手機註冊）",
    },
    products: ["Spot", "Futures", "Margin", "Earn", "Web3 Wallet"],
  },
  okx: {
    slug: "okx",
    name: "OKX",
    category: "CEX",
    officialDomain: "www.okx.com",
    hasReferral: true,
    inviteCode: "nexu888",
    inviteCodes: ["LUCKX", "CANDY007", "INS898", "1836370407", "NEXU888"],
    registrationUrl: PARTNER_REGISTRATION_URLS.okx[0],
    alternateRegistrationUrls: PARTNER_REGISTRATION_URLS.okx.slice(1),
    benefit: {
      en: "Lifetime fee rebate & blind box rewards",
      "zh-Hans": "享终身手续费折扣与新手盲盒礼遇",
      "zh-Hant": "享終身手續費折扣與新手盲盒禮遇",
    },
    kycRequired: true,
    accountType: {
      en: "Account-based (Email / Mobile)",
      "zh-Hans": "账户托管式（邮箱 / 手机注册）",
      "zh-Hant": "帳戶託管式（郵箱 / 手機註冊）",
    },
    products: ["Spot", "Perpetuals", "Options", "Web3 Wallet"],
  },
  bybit: {
    slug: "bybit",
    name: "Bybit",
    category: "CEX",
    officialDomain: "www.bybit.com",
    hasReferral: true,
    inviteCode: CUSTOM_INVITE_CODES.bybit,
    registrationUrl: `https://www.bybit.com/register?affiliate_id=${CUSTOM_INVITE_CODES.bybit}`,
    benefit: {
      en: "Exclusive fee discount & airdrop/deposit perks",
      "zh-Hans": "享专属手续费减免与入金福利",
      "zh-Hant": "享專屬手續費減免與入金福利",
    },
    kycRequired: true,
    accountType: {
      en: "Account-based (Email / Mobile)",
      "zh-Hans": "账户托管式（邮箱 / 手机注册）",
      "zh-Hant": "帳戶託管式（郵箱 / 手機註冊）",
    },
    products: ["Spot", "Derivatives", "Copy Trading", "Earn"],
  },
  bitget: {
    slug: "bitget",
    name: "Bitget",
    category: "CEX",
    officialDomain: "www.bitget.com",
    hasReferral: true,
    inviteCode: CUSTOM_INVITE_CODES.bitget,
    registrationUrl: PARTNER_REGISTRATION_URLS.bitget[0],
    alternateRegistrationUrls: PARTNER_REGISTRATION_URLS.bitget.slice(1),
    benefit: {
      en: "Exclusive fee reduction & new trader gift pack",
      "zh-Hans": "享交易手续费减免与新手福利礼包",
      "zh-Hant": "享交易手續費減免與新手福利禮包",
    },
    kycRequired: true,
    accountType: {
      en: "Account-based (Email / Mobile)",
      "zh-Hans": "账户托管式（邮箱 / 手机注册）",
      "zh-Hant": "帳戶託管式（郵箱 / 手機註冊）",
    },
    products: ["Spot", "Futures", "Copy Trading", "Launchpool"],
  },
  coinbase: {
    slug: "coinbase",
    name: "Coinbase",
    category: "CEX",
    officialDomain: "www.coinbase.com",
    hasReferral: false,
    inviteCode: null,
    registrationUrl: "https://www.coinbase.com/signup",
    benefit: {
      en: "Official direct registration (No code required)",
      "zh-Hans": "官方注册直达（无需邀请码）",
      "zh-Hant": "官方註冊直達（無需邀請碼）",
    },
    kycRequired: true,
    accountType: {
      en: "Account-based (Strict KYC)",
      "zh-Hans": "账户托管式（严格 KYC / 合规）",
      "zh-Hant": "帳戶託管式（嚴格 KYC / 合規）",
    },
    products: ["Spot", "Advanced Trade", "Custody", "Base Ecosystem"],
  },
  kraken: {
    slug: "kraken",
    name: "Kraken",
    category: "CEX",
    officialDomain: "www.kraken.com",
    hasReferral: true,
    inviteCode: CUSTOM_INVITE_CODES.kraken,
    registrationUrl: `https://www.kraken.com/sign-up?ref=${CUSTOM_INVITE_CODES.kraken}`,
    benefit: {
      en: "Exclusive sign-up perks & low Pro fees",
      "zh-Hans": "享 Kraken 专属新手福利与 Pro 费率优惠",
      "zh-Hant": "享 Kraken 專屬新手福利與 Pro 費率優惠",
    },
    kycRequired: true,
    accountType: {
      en: "Account-based (Strict KYC)",
      "zh-Hans": "账户托管式（严格 KYC / 合规）",
      "zh-Hant": "帳戶託管式（嚴格 KYC / 合規）",
    },
    products: ["Spot", "Kraken Pro", "Futures", "Margin"],
  },
  "gate-io": {
    slug: "gate-io",
    name: "Gate.io",
    category: "CEX",
    officialDomain: "www.gate.com",
    hasReferral: true,
    inviteCode: CUSTOM_INVITE_CODES["gate-io"],
    registrationUrl: `https://www.gate.com/signup/${CUSTOM_INVITE_CODES["gate-io"]}`,
    benefit: {
      en: "Fee rebate & beginner point cards",
      "zh-Hans": "享手续费折扣与新手点卡权益",
      "zh-Hant": "享手續費折扣與新手點卡權益",
    },
    kycRequired: true,
    accountType: {
      en: "Account-based (Email / Mobile)",
      "zh-Hans": "账户托管式（邮箱 / 手机注册）",
      "zh-Hant": "帳戶託管式（郵箱 / 手機註冊）",
    },
    products: ["Spot", "Futures", "Startup", "Copy Trading"],
  },
  kucoin: {
    slug: "kucoin",
    name: "KuCoin",
    category: "CEX",
    officialDomain: "www.kucoin.com",
    hasReferral: true,
    inviteCode: CUSTOM_INVITE_CODES.kucoin,
    registrationUrl: `https://www.kucoin.com/ucenter/signup?rcode=${CUSTOM_INVITE_CODES.kucoin}`,
    benefit: {
      en: "Fee rebate & mystery box rewards",
      "zh-Hans": "享专属手续费折扣与新手礼包",
      "zh-Hant": "享專屬手續費折扣與新手禮包",
    },
    kycRequired: true,
    accountType: {
      en: "Account-based (Email / Mobile)",
      "zh-Hans": "账户托管式（邮箱 / 手机注册）",
      "zh-Hant": "帳戶託管式（郵箱 / 手機註冊）",
    },
    products: ["Spot", "Futures", "Trading Bot", "Earn"],
  },
  mexc: {
    slug: "mexc",
    name: "MEXC",
    category: "CEX",
    officialDomain: "www.mexc.com",
    hasReferral: true,
    inviteCode: CUSTOM_INVITE_CODES.mexc,
    registrationUrl: `https://www.mexc.com/register?inviteCode=${CUSTOM_INVITE_CODES.mexc}`,
    benefit: {
      en: "Lowest trading fee tiers & futures bonus",
      "zh-Hans": "享超低交易手续费与合约赠金",
      "zh-Hant": "享超低交易手續費與合約贈金",
    },
    kycRequired: true,
    accountType: {
      en: "Account-based (Email / Mobile)",
      "zh-Hans": "账户托管式（邮箱 / 手机注册）",
      "zh-Hant": "帳戶託管式（郵箱 / 手機註冊）",
    },
    products: ["Spot", "Futures", "Kickstarter", "Launchpool"],
  },
  htx: {
    slug: "htx",
    name: "HTX",
    category: "CEX",
    officialDomain: "www.htx.com",
    hasReferral: true,
    inviteCode: CUSTOM_INVITE_CODES.htx,
    registrationUrl: `https://www.htx.com/invite/en-us/1h?invite_code=${CUSTOM_INVITE_CODES.htx}`,
    benefit: {
      en: "20% Exclusive fee rebate & welcome mystery rewards",
      "zh-Hans": "享 20% 专属手续费减免与新人迎新礼包",
      "zh-Hant": "享 20% 專屬手續費減免與新人迎新禮包",
    },
    kycRequired: true,
    accountType: {
      en: "Account-based (Email / Mobile)",
      "zh-Hans": "账户托管式（邮箱 / 手机注册）",
      "zh-Hant": "帳戶託管式（郵箱 / 手機註冊）",
    },
    products: ["Spot", "Futures", "Earn", "PrimePool"],
  },
  backpack: {
    slug: "backpack",
    name: "Backpack",
    category: "CEX",
    officialDomain: "backpack.exchange",
    hasReferral: true,
    inviteCode: "luckybitcoin",
    registrationUrl: PARTNER_REGISTRATION_URLS.backpack[0],
    alternateRegistrationUrls: PARTNER_REGISTRATION_URLS.backpack.slice(1),
    benefit: {
      en: "Official referral tier & ecosystem perks",
      "zh-Hans": "官方推荐注册通道与生态权益",
      "zh-Hant": "官方推薦註冊通道與生態權益",
    },
    kycRequired: true,
    accountType: {
      en: "Account-based (Solana Ecosystem)",
      "zh-Hans": "账户托管式（Solana 生态合规）",
      "zh-Hant": "帳戶託管式（Solana 生態合規）",
    },
    products: ["Spot", "Perpetuals", "Integrated Wallet"],
  },
  deribit: {
    slug: "deribit",
    name: "Deribit",
    category: "CEX",
    officialDomain: "www.deribit.com",
    hasReferral: true,
    inviteCode: CUSTOM_INVITE_CODES.deribit,
    registrationUrl: `https://www.deribit.com/?reg=${CUSTOM_INVITE_CODES.deribit}`,
    benefit: {
      en: "10% fee discount on options and futures",
      "zh-Hans": "享 10% 期权与永续合约手续费优惠",
      "zh-Hant": "享 10% 期權與永續合約手續費優惠",
    },
    kycRequired: true,
    accountType: {
      en: "Account-based (Institutional / Pro)",
      "zh-Hans": "账户托管式（专业衍生品平台）",
      "zh-Hant": "帳戶託管式（專業衍生品平台）",
    },
    products: ["Options", "Perpetuals", "Futures", "Block Trade"],
  },
  uniswap: {
    slug: "uniswap",
    name: "Uniswap",
    category: "DEX",
    officialDomain: "app.uniswap.org",
    hasReferral: false,
    inviteCode: null,
    registrationUrl: "https://app.uniswap.org",
    benefit: {
      en: "On-chain wallet connect (No signup / No code)",
      "zh-Hans": "链上钱包直连（无需开户 / 无需邀请码）",
      "zh-Hant": "鏈上錢包直連（無需開戶 / 無需邀請碼）",
    },
    kycRequired: false,
    accountType: {
      en: "Non-custodial (Self-custody wallet)",
      "zh-Hans": "去中心化（自主掌控钱包私钥）",
      "zh-Hant": "去中心化（自主掌控錢包私鑰）",
    },
    products: ["On-chain Swap", "Liquidity Pools (v2/v3/v4)"],
  },
  pancakeswap: {
    slug: "pancakeswap",
    name: "PancakeSwap",
    category: "DEX",
    officialDomain: "pancakeswap.finance",
    hasReferral: false,
    inviteCode: null,
    registrationUrl: "https://pancakeswap.finance",
    benefit: {
      en: "On-chain wallet connect (No code required)",
      "zh-Hans": "链上钱包直连（多链支持 / 无需邀请码）",
      "zh-Hant": "鏈上錢包直連（多鏈支援 / 無需邀請碼）",
    },
    kycRequired: false,
    accountType: {
      en: "Non-custodial (Self-custody wallet)",
      "zh-Hans": "去中心化（自主掌控钱包私钥）",
      "zh-Hant": "去中心化（自主掌控錢包私鑰）",
    },
    products: ["Swap", "Farms", "Perpetuals", "Gaming"],
  },
  jupiter: {
    slug: "jupiter",
    name: "Jupiter",
    category: "DEX",
    officialDomain: "jup.ag",
    hasReferral: false,
    inviteCode: null,
    registrationUrl: "https://jup.ag",
    benefit: {
      en: "Solana premier aggregator (No code required)",
      "zh-Hans": "Solana 核心聚合兑换（链上直达）",
      "zh-Hant": "Solana 核心聚合兌換（鏈上直達）",
    },
    kycRequired: false,
    accountType: {
      en: "Non-custodial (Solana wallet)",
      "zh-Hans": "去中心化（Solana 链上自托管）",
      "zh-Hant": "去中心化（Solana 鏈上自託管）",
    },
    products: ["Swap Aggregator", "Perps", "DCA", "Limit Orders"],
  },
  raydium: {
    slug: "raydium",
    name: "Raydium",
    category: "DEX",
    officialDomain: "raydium.io",
    hasReferral: false,
    inviteCode: null,
    registrationUrl: "https://raydium.io",
    benefit: {
      en: "Solana on-chain AMM (No code required)",
      "zh-Hans": "Solana 链上原生 AMM（无需邀请码）",
      "zh-Hant": "Solana 鏈上原生 AMM（無需邀請碼）",
    },
    kycRequired: false,
    accountType: {
      en: "Non-custodial (Solana wallet)",
      "zh-Hans": "去中心化（Solana 链上自托管）",
      "zh-Hant": "去中心化（Solana 鏈上自託管）",
    },
    products: ["AMM Swap", "Concentrated Liquidity (CLMM)", "Pools"],
  },
  aerodrome: {
    slug: "aerodrome",
    name: "Aerodrome",
    category: "DEX",
    officialDomain: "aerodrome.finance",
    hasReferral: false,
    inviteCode: null,
    registrationUrl: "https://aerodrome.finance",
    benefit: {
      en: "Base ecosystem liquidity hub (No code required)",
      "zh-Hans": "Base 链上流动性中枢（无需邀请码）",
      "zh-Hant": "Base 鏈上流動性中樞（無需邀請碼）",
    },
    kycRequired: false,
    accountType: {
      en: "Non-custodial (EVM wallet)",
      "zh-Hans": "去中心化（EVM / Base 链上直连）",
      "zh-Hant": "去中心化（EVM / Base 鏈上直連）",
    },
    products: ["MetaDEX Swap", "Liquidity Incentives", "Lock & Vote"],
  },
  curve: {
    slug: "curve",
    name: "Curve",
    category: "DEX",
    officialDomain: "curve.finance",
    hasReferral: false,
    inviteCode: null,
    registrationUrl: "https://curve.finance",
    benefit: {
      en: "Deep stablecoin liquidity (No code required)",
      "zh-Hans": "深度稳定币与同质化资产兑换（无需邀请码）",
      "zh-Hant": "深度穩定幣與同質化資產兌換（無需邀請碼）",
    },
    kycRequired: false,
    accountType: {
      en: "Non-custodial (Multi-chain EVM)",
      "zh-Hans": "去中心化（多链自托管）",
      "zh-Hant": "去中心化（多鏈自託管）",
    },
    products: ["StableSwap", "CryptoSwap", "crvUSD"],
  },
  hyperliquid: {
    slug: "hyperliquid",
    name: "Hyperliquid",
    category: "Perp DEX",
    officialDomain: "app.hyperliquid.xyz",
    hasReferral: true,
    inviteCode: CUSTOM_INVITE_CODES.hyperliquid,
    registrationUrl: `https://app.hyperliquid.xyz/join/${CUSTOM_INVITE_CODES.hyperliquid}`,
    benefit: {
      en: "4% perpetual fee discount & points tracking",
      "zh-Hans": "享 4% 永续合约手续费减免与积分累计",
      "zh-Hant": "享 4% 永續合約手續費減免與積分累計",
    },
    kycRequired: false,
    accountType: {
      en: "Non-custodial (Arbitrum / L1 Bridge)",
      "zh-Hans": "去中心化 L1（独立高性能公链 / 自托管）",
      "zh-Hant": "去中心化 L1（獨立高性能公鏈 / 自託管）",
    },
    products: ["Perpetual Order Book", "Spot", "HLP Vaults"],
  },
  dydx: {
    slug: "dydx",
    name: "dYdX",
    category: "Perp DEX",
    officialDomain: "dydx.trade",
    hasReferral: false,
    inviteCode: null,
    registrationUrl: "https://dydx.trade",
    benefit: {
      en: "Standalone Cosmos chain order book (No code required)",
      "zh-Hans": "Cosmos 独立链订单簿（链上直连）",
      "zh-Hant": "Cosmos 獨立鏈訂單簿（鏈上直達）",
    },
    kycRequired: false,
    accountType: {
      en: "Non-custodial (dYdX Chain)",
      "zh-Hans": "去中心化（独立链自托管钱包）",
      "zh-Hant": "去中心化（獨立鏈自託管錢包）",
    },
    products: ["Perpetuals", "Megavault", "Native Staking"],
  },
  gmx: {
    slug: "gmx",
    name: "GMX",
    category: "Perp DEX",
    officialDomain: "gmx.io",
    hasReferral: true,
    inviteCode: CUSTOM_INVITE_CODES.gmx,
    registrationUrl: `https://app.gmx.io/#/trade/?ref=${CUSTOM_INVITE_CODES.gmx}`,
    benefit: {
      en: "10% fee discount on v2 perpetual trades",
      "zh-Hans": "享 10% 合约开平仓手续费折扣",
      "zh-Hant": "享 10% 合約開平倉手續費折扣",
    },
    kycRequired: false,
    accountType: {
      en: "Non-custodial (Arbitrum / Avalanche)",
      "zh-Hans": "去中心化（Arbitrum / Avalanche 自托管）",
      "zh-Hant": "去中心化（Arbitrum / Avalanche 自託管）",
    },
    products: ["v2 Perpetuals", "GLP / GM Pools", "Spot Swaps"],
  },
  drift: {
    slug: "drift",
    name: "Drift",
    category: "Perp DEX",
    officialDomain: "app.drift.trade",
    hasReferral: true,
    inviteCode: CUSTOM_INVITE_CODES.drift,
    registrationUrl: `https://app.drift.trade/ref/${CUSTOM_INVITE_CODES.drift}`,
    benefit: {
      en: "Solana perps fee rebate & ecosystem access",
      "zh-Hans": "享 Solana 永续合约手续费返还与生态通道",
      "zh-Hant": "享 Solana 永續合約手續費返還與生態通道",
    },
    kycRequired: false,
    accountType: {
      en: "Non-custodial (Solana wallet)",
      "zh-Hans": "去中心化（Solana 链上钱包直连）",
      "zh-Hant": "去中心化（Solana 鏈上錢包直連）",
    },
    products: ["Perpetuals", "Spot Margin", "Borrow / Lend", "BET Prediction"],
  },
};

export function getPartner(slug) {
  return partnerRegistry[slug] ?? null;
}

export function getAllPartners() {
  return Object.values(partnerRegistry);
}

const CHECKED_AT = "2026-09-04T19:59:35Z";
const UNISWAP_CHECKED_AT = "2026-09-16T00:00:00Z";
const COINW_CHECKED_AT = "2026-10-13T00:00:00Z";

const tr = (en, zhHans, zhHant = zhHans) => ({ en, "zh-Hans": zhHans, "zh-Hant": zhHant });

const supportedFactAxes = new Set(["products", "fees", "custody", "access", "execution"]);

const factAxisByLabel = {
  "Product map": "products",
  "Exchange/API lane": "products",
  "API product scope": "products",
  "Margin system": "products",
  "Fee model": "fees",
  "Fee tier clock": "fees",
  "Weighted fee tier": "fees",
  "HIP-3 fee boundary": "fees",
  "Fee source map": "fees",
  "Swap fee tiers": "fees",
  "Protocol fee boundary": "fees",
  "Spot fee model": "fees",
  "Futures fee components": "fees",
  "USDC funding route": "custody",
  "Wallet transfer boundary": "custody",
  "Deployment address check": "custody",
  "Supported chain scope": "products",
  "Testnet interface scope": "access",
  "Official app route": "access",
  "Official app and docs boundary": "access",
  "Token contract identity": "custody",
  "Pool and token contract boundary": "custody",
  "Router and approval roles": "custody",
  "Wallet authorization boundary": "access",
  "Permit2 deployment identity": "access",
  "Signature permission fields": "access",
  "Offchain signature boundary": "access",
  "Approval review and revocation": "access",
  "Identity gate": "access",
  "KYC levels": "access",
  "Identity flow": "access",
  "Identity boundary": "access",
  "Region boundary": "access",
  "Eligibility caution": "access",
  "Testnet faucet gate": "access",
  "Funded-account boundary": "access",
  "Funded-account ambiguity": "access",
  "Derivatives separation": "custody",
  "Exchange vs wallet": "custody",
  "Securities boundary": "custody",
  "Derivative product scope": "products",
  "Version architecture": "products",
  "Infinity architecture": "products",
  "Core architecture": "products",
  "Builder-deployed perps": "products",
  "Documentation scope": "products",
  "Market types": "products",
  "Announcement taxonomy": null,
  "Navigation taxonomy": null,
  "Official update lane": null,
  "Documentation redirect": null,
  "AMM model": "execution",
  "Wallet route test": "execution",
  "Production route checklist": "execution",
  "Gas and transaction preview boundary": "execution",
  "Testnet to production handoff": "execution",
  "Settlement layer": "execution",
  "Swap API": "execution",
  "Routing role": "execution",
  "Ultra execution mode": "execution",
  "Swap failure boundary": "execution",
  "Ultra compensation boundary": "execution",
  "Route liquidity boundary": "execution",
  "Query intent boundary": "execution",
  "CTA boundary": "access",
  "Platform fee boundary": "fees",
  "Token-list boundary": "access",
  "Approval spender check": "access",
  "Transaction build path": "execution",
  "Spot order model": "execution",
  "CLMM model": "execution",
  "Testnet research boundary": "execution",
  "Uniswap source map": "execution",
  "Base liquidity hub": "execution",
  "Pool fee boundary": "fees",
  "Voting incentive flow": "fees",
  "veAERO reward route": "fees",
  "Volume fee display": "fees",
  "Base network boundary": "custody",
  "Launch liquidity": "execution",
  "Pool-risk framing": "execution",
  "Oracle-linked liquidity": "execution",
  "Order-book architecture": "execution",
  "Funding mechanism": "execution",
  "Funding payment": "fees",
  "Funding and liquidation bundle": "fees",
  "Liquidation threshold": "execution",
  "Fee decision checklist": "fees",
  "Sub-account threshold": "access",
  "API wallet signing": "access",
  "Account mode collateral": "custody",
  "Funded-account source map": "access",
  "Liquidity model": "execution",
  "Pricing model": "execution",
  "Instrument lifecycle": "execution",
  "Liquidity sources": "execution",
  "Dynamic fee boundary": "fees",
  "Hook test environment": "execution",
  "Deployment feed": "custody",
  "Reserve disclosure": "custody",
};

const axisForLabel = (label) => {
  if (!Object.prototype.hasOwnProperty.call(factAxisByLabel, label)) {
    throw new Error(`EXCHANGE_RESEARCH_FACT_AXIS_UNMAPPED:${label}`);
  }
  const axis = factAxisByLabel[label];
  if (axis !== null && !supportedFactAxes.has(axis)) {
    throw new Error(`EXCHANGE_RESEARCH_FACT_AXIS_INVALID:${label}:${axis}`);
  }
  return axis;
};

const fact = (label, value, sourceUrl) => ({ axis: axisForLabel(label.en), label, value, sourceUrl });

const source = (title, url) => ({ title, url });

const makeRecord = ({ summary, facts, sources, tags, checkedAt = CHECKED_AT }) => ({
  summary,
  facts,
  sources,
  checkedAt,
  tags,
});

const rawExchangeResearch = {
  binance: makeRecord({
    summary: tr(
      "Large account-based exchange where fee tables, identity verification, product pages, and announcement notices should be read as separate source paths.",
      "大型账户式交易所；费用表、身份验证、产品页面和公告通知应作为不同来源分别阅读。",
      "大型帳戶式交易所；費用表、身份驗證、產品頁面和公告通知應作為不同來源分別閱讀。"
    ),
    facts: [
      fact(tr("Product map", "产品范围", "產品範圍"), tr("The public fee page separates Spot & Margin, NFT, P2P, and fiat-fee sections; derivative availability should be checked on product-specific Binance pages.", "公开费用页分列现货与杠杆、NFT、P2P 和法币费用；衍生品可用性应到 Binance 对应产品页单独核对。", "公開費用頁分列現貨與槓桿、NFT、P2P 和法幣費用；衍生品可用性應到 Binance 對應產品頁單獨核對。"), "https://www.binance.com/en/fee/trading"),
      fact(tr("Fee model", "费用模型", "費用模型"), tr("Spot fees are shown as maker/taker rates and tiered by 30-day trade volume and/or BNB balance.", "现货费用以 maker/taker 展示，并按 30 日交易量和/或 BNB 持仓分层。", "現貨費用以 maker/taker 展示，並按 30 日交易量和/或 BNB 持倉分層。"), "https://www.binance.com/en/fee/trading"),
      fact(tr("Identity gate", "身份门槛", "身份門檻"), tr("Binance says new users must complete Verified identity verification to access products including crypto deposits and trades.", "Binance 说明新用户需要完成基础身份验证，才能使用包括加密货币充值和交易在内的产品服务。", "Binance 說明新用戶需要完成基礎身份驗證，才能使用包括加密貨幣充值和交易在內的產品服務。"), "https://www.binance.com/en/support/faq/detail/360027287111"),
      fact(tr("Official update lane", "官方动态入口", "官方動態入口"), tr("The support announcement hub groups listings, campaigns, trading changes, and service notices for official update checks.", "支持公告中心集中展示上币、活动、交易调整和服务通知，适合核对官方动态。", "支援公告中心集中展示上幣、活動、交易調整和服務通知，適合核對官方動態。"), "https://www.binance.com/en/support/announcement"),
    ],
    sources: [
      source("Binance fees and product navigation", "https://www.binance.com/en/fee/trading"),
      source("Binance identity verification FAQ", "https://www.binance.com/en/support/faq/detail/360027287111"),
      source("Binance announcements", "https://www.binance.com/en/support/announcement"),
    ],
    tags: ["cex", "spot", "futures", "options", "kyc", "announcements"],
  }),
  coinbase: makeRecord({
    summary: tr(
      "Account-based exchange profile where spot exchange, Advanced/Exchange APIs, identity checks, and derivatives accounts need separate review.",
      "账户式交易所；现货交易、Advanced/Exchange API、身份验证和衍生品账户分属不同官方页面。",
      "帳戶式交易所；現貨交易、Advanced/Exchange API、身份驗證和衍生品帳戶分屬不同官方頁面。"
    ),
    facts: [
      fact(tr("Exchange/API lane", "交易与 API", "交易與 API"), tr("Coinbase Exchange presents direct access to spot exchange trading through FIX, REST APIs, and WebSocket feeds.", "Coinbase Exchange 提供面向现货交易的 FIX、REST API 和 WebSocket 数据/下单入口。", "Coinbase Exchange 提供面向現貨交易的 FIX、REST API 和 WebSocket 資料/下單入口。"), "https://www.coinbase.com/en-in/exchange"),
      fact(tr("Identity gate", "身份门槛", "身份門檻"), tr("Coinbase says identity verification is required at account creation and periodically for legal, compliance, and fraud-prevention purposes.", "Coinbase 说明开户及后续定期记录维护会要求身份验证，用于法律、合规和反欺诈目的。", "Coinbase 說明開戶及後續定期記錄維護會要求身份驗證，用於法律、合規和反欺詐目的。"), "https://help.coinbase.com/coinbase/managing-my-account/update-my-account/identity-verification-faq"),
      fact(tr("Region boundary", "地区边界", "地區邊界"), tr("Coinbase maintains a prohibited-regions help page, so availability should be checked as a current account and location question.", "Coinbase 维护受限地区帮助页，因此可用性应按当前账户与所在地逐项核对。", "Coinbase 維護受限地區幫助頁，因此可用性應按目前帳戶與所在地逐項核對。"), "https://help.coinbase.com/coinbase/managing-my-account/other/prohibited-regions"),
      fact(tr("Derivatives separation", "衍生品账户分离", "衍生品帳戶分離"), tr("Coinbase describes separate spot and derivatives accounts for derivatives users, with derivatives balances held separately and denominated in USD.", "Coinbase 说明衍生品用户有独立的现货账户和衍生品账户，衍生品余额单独持有并以 USD 计价。", "Coinbase 說明衍生品用戶有獨立的現貨帳戶和衍生品帳戶，衍生品餘額單獨持有並以 USD 計價。"), "https://help.coinbase.com/coinbase/derivatives/us-derivatives-cash-balance"),
    ],
    sources: [
      source("Coinbase Exchange", "https://www.coinbase.com/en-in/exchange"),
      source("Coinbase identity verification FAQ", "https://help.coinbase.com/coinbase/managing-my-account/update-my-account/identity-verification-faq"),
      source("Coinbase prohibited regions", "https://help.coinbase.com/coinbase/managing-my-account/other/prohibited-regions"),
      source("Coinbase derivatives cash balances", "https://help.coinbase.com/coinbase/derivatives/us-derivatives-cash-balance"),
    ],
    tags: ["cex", "spot", "api", "kyc", "derivatives"],
  }),
  bybit: makeRecord({
    summary: tr(
      "Account-based exchange profile for users comparing spot, derivatives, campaign, KYC, fee, and restricted-region checks before registration.",
      "账户式交易所；注册前重点看现货/衍生品页面、KYC、费用和受限地区说明。",
      "帳戶式交易所；註冊前重點看現貨/衍生品頁面、KYC、費用和受限地區說明。"
    ),
    facts: [
      fact(tr("Identity gate", "身份门槛", "身份門檻"), tr("Bybit states that at least Standard individual identity verification is mandatory for all Bybit products and services.", "Bybit 说明所有产品和服务至少强制要求 Standard 级个人身份验证。", "Bybit 說明所有產品和服務至少強制要求 Standard 級個人身份驗證。"), "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ"),
      fact(tr("KYC levels", "KYC 层级", "KYC 層級"), tr("The KYC FAQ separates Standard, Advanced, and Pro verification requirements, including proof of identity, proof of address, and enhanced due diligence.", "KYC FAQ 区分 Standard、Advanced、Pro，分别涉及身份证明、地址证明和增强尽调。", "KYC FAQ 區分 Standard、Advanced、Pro，分別涉及身份證明、地址證明和增強盡調。"), "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ"),
      fact(tr("Fee model", "费用模型", "費用模型"), tr("Bybit's trading-fee support page defines maker and taker roles and publishes separate fee tables by product type.", "Bybit 费用帮助页定义 maker/taker 角色，并按产品类型发布费用表。", "Bybit 費用幫助頁定義 maker/taker 角色，並按產品類型發布費用表。"), "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure"),
      fact(tr("Official update lane", "官方动态入口", "官方動態入口"), tr("The official announcement center is the review path for launch, listing, competition, and system-update content.", "官方公告中心是核对上线、上币、竞赛与系统更新内容的路径。", "官方公告中心是核對上線、上幣、競賽與系統更新內容的路徑。"), "https://announcements.bybit.com/en/"),
    ],
    sources: [
      source("Bybit individual KYC FAQ", "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ"),
      source("Bybit trading fee structure", "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure"),
      source("Bybit announcements", "https://announcements.bybit.com/en/"),
    ],
    tags: ["cex", "spot", "derivatives", "kyc", "fees", "announcements"],
  }),
  bitget: makeRecord({
    summary: tr(
      "Compare Bitget spot and futures trading, identity requirements and published fees before choosing an account.",
      "比较 Bitget 的现货、合约、身份要求及公开费用，再决定是否开户。",
      "比較 Bitget 的現貨、合約、身分要求及公開費用，再決定是否開戶。"
    ),
    facts: [
      fact(tr("Spot fee model", "现货费用模型", "現貨費用模型"), tr("Bitget's spot-fee article defines maker fees as adding liquidity and taker fees as removing liquidity.", "Bitget 现货费用文章把 maker 定义为增加流动性的订单，把 taker 定义为移除流动性的订单。", "Bitget 現貨費用文章把 maker 定義為增加流動性的訂單，把 taker 定義為移除流動性的訂單。"), "https://www.bitget.com/support/articles/12560603820584"),
      fact(tr("Futures fee components", "合约费用组成", "合約費用組成"), tr("Bitget's futures-fee guide separates transaction fees from funding fees and defines order value as quantity times price.", "Bitget 合约费用指南区分交易手续费和资金费，并把订单价值定义为数量乘以价格。", "Bitget 合約費用指南區分交易手續費和資金費，並把訂單價值定義為數量乘以價格。"), "https://www.bitget.com/support/articles/12560603817155"),
      fact(tr("Identity flow", "身份验证流程", "身份驗證流程"), tr("The identity guide starts from the account profile, then asks the user to select residence/issuing region and ID type.", "身份验证指南从账户资料入口开始，随后要求选择居住/签发地区和证件类型。", "身份驗證指南從帳戶資料入口開始，隨後要求選擇居住/簽發地區和證件類型。"), "https://www.bitget.com/support/articles/12560603795184"),
      fact(tr("Official update lane", "官方动态入口", "官方動態入口"), tr("Bitget's announcement center is organized into latest news, new listings, product updates, competitions, delistings, security, institutional services, API trading, fiat, and maintenance/system updates.", "Bitget 公告中心按最新消息、上新、产品更新、竞赛、下架、安全、机构服务、API 交易、法币和维护/系统更新分类。", "Bitget 公告中心按最新消息、上新、產品更新、競賽、下架、安全、機構服務、API 交易、法幣和維護/系統更新分類。"), "https://www.bitget.com/support/announcement-center"),
    ],
    sources: [
      source("Bitget spot trading fees, limits, and rules", "https://www.bitget.com/support/articles/12560603820584"),
      source("Bitget futures fees guide", "https://www.bitget.com/support/articles/12560603817155"),
      source("Bitget identity verification guide", "https://www.bitget.com/support/articles/12560603795184"),
      source("Bitget announcement center", "https://www.bitget.com/support/announcement-center"),
    ],
    tags: ["cex", "spot", "futures", "fees", "kyc", "announcements"],
  }),
  okx: makeRecord({
    summary: tr(
      "Multi-product account platform profile spanning spot, futures, options/events, DEX-style access, Earn, campaign, institutional, and proof-of-reserves source paths.",
      "多产品账户平台；现货、合约、期权/事件、DEX 式入口、Earn、活动、机构和储备证明分属不同官方区域。",
      "多產品帳戶平台；現貨、合約、期權/事件、DEX 式入口、Earn、活動、機構和儲備證明分屬不同官方區域。"
    ),
    facts: [
      fact(tr("Product map", "产品范围", "產品範圍"), tr("OKX navigation lists spot, futures, DEX, events/options, trading bots, copy trading, Earn, institutional APIs, and proof-of-reserves areas.", "OKX 导航列出现货、合约、DEX、事件/期权、交易机器人、跟单、Earn、机构 API 和储备证明等区域。", "OKX 導覽列出現貨、合約、DEX、事件/期權、交易機器人、跟單、Earn、機構 API 和儲備證明等區域。"), "https://www.okx.com/fees"),
      fact(tr("Fee model", "费用模型", "費用模型"), tr("The fees page separates spot, futures, options, and other trading instruments instead of using one blended fee claim.", "费用页按现货、合约、期权和其他交易工具分开呈现，而不是使用单一混合费用说法。", "費用頁按現貨、合約、期權和其他交易工具分開呈現，而不是使用單一混合費用說法。"), "https://www.okx.com/fees"),
      fact(tr("Announcement taxonomy", "公告分类", "公告分類"), tr("OKX announcements are categorized into latest announcements, new listings, delistings, events, trading updates, P2P, Web3, Earn/Loan, Jumpstart, API, OKB burn, and others.", "OKX 公告分为最新公告、上币、下架、活动、交易更新、P2P、Web3、Earn/Loan、Jumpstart、API、OKB 销毁和其他。", "OKX 公告分為最新公告、上幣、下架、活動、交易更新、P2P、Web3、Earn/Loan、Jumpstart、API、OKB 銷毀和其他。"), "https://www.okx.com/help/section/announcements-latest-announcements"),
      fact(tr("Identity boundary", "身份边界", "身份邊界"), tr("The identity-verification support path is a required source before making registration, review-time, or supported-document statements.", "关于注册、审核时间或支持文件的说法，需要先从身份验证帮助入口核对。", "關於註冊、審核時間或支援文件的說法，需要先從身份驗證幫助入口核對。"), "https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported"),
    ],
    sources: [
      source("OKX fees", "https://www.okx.com/fees"),
      source("OKX latest announcements", "https://www.okx.com/help/section/announcements-latest-announcements"),
      source("OKX identity verification eligibility", "https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported"),
    ],
    tags: ["cex", "spot", "futures", "options", "web3", "announcements"],
  }),
  kraken: makeRecord({
    summary: tr("Account-based exchange profile with separate retail, Pro, institutional, margin, futures, OTC, custody, API, and learning paths.", "账户式交易所；零售、Pro、机构、杠杆、合约、OTC、托管、API 和学习内容各有官方入口。", "帳戶式交易所；零售、Pro、機構、槓桿、合約、OTC、託管、API 和學習內容各有官方入口。"),
    facts: [
      fact(tr("Product map", "产品范围", "產品範圍"), tr("Kraken's features page lists Kraken Pro, margin, perpetuals/futures, OTC, staking, API, institutional, custody, and account-management services.", "Kraken 功能页列出 Kraken Pro、杠杆、永续/合约、OTC、质押、API、机构、托管和账户管理服务。", "Kraken 功能頁列出 Kraken Pro、槓桿、永續/合約、OTC、質押、API、機構、託管和帳戶管理服務。"), "https://www.kraken.com/features"),
      fact(tr("Eligibility caution", "资格核对", "資格核對"), tr("Kraken marks margin availability as subject to limitations and eligibility criteria, so margin should not be presented as universal access.", "Kraken 将杠杆可用性标注为受限制和资格条件约束，因此不能把杠杆写成普遍可用。", "Kraken 將槓桿可用性標註為受限制和資格條件約束，因此不能把槓桿寫成普遍可用。"), "https://www.kraken.com/features"),
    ],
    sources: [source("Kraken features", "https://www.kraken.com/features")],
    tags: ["cex", "spot", "futures", "margin", "institutional"],
  }),
  "gate-io": makeRecord({
    summary: tr("Account-based exchange where market-data APIs and fee help pages give safer product evidence than announcement navigation.", "账户式交易所；行情 API 与费用帮助页比公告导航更适合作为产品事实来源。", "帳戶式交易所；行情 API 與費用幫助頁比公告導覽更適合作為產品事實來源。"),
    facts: [
      fact(tr("API product scope", "API 产品范围", "API 產品範圍"), tr("Gate API documentation exposes spot and futures REST/WebSocket areas as separate integration surfaces.", "Gate API 文档把现货和合约 REST/WebSocket 区域作为独立集成入口列出。", "Gate API 文檔把現貨和合約 REST/WebSocket 區域作為獨立整合入口列出。"), "https://www.gate.com/docs/developers/apiv4/"),
      fact(tr("Fee model", "费用模型", "費用模型"), tr("Gate's fee help article defines spot trading fees as calculated from trade amount and fee rate, with maker/taker roles handled separately.", "Gate 费用帮助文章把现货交易手续费定义为交易额乘以费率，并区分 maker/taker 角色。", "Gate 費用幫助文章把現貨交易手續費定義為交易額乘以費率，並區分 maker/taker 角色。"), "https://www.gate.com/help/trade/spot/22550/gate-io-s-spot-trading-fee-rules"),
    ],
    sources: [
      source("Gate API documentation", "https://www.gate.com/docs/developers/apiv4/"),
      source("Gate spot trading fee rules", "https://www.gate.com/help/trade/spot/22550/gate-io-s-spot-trading-fee-rules"),
    ],
    tags: ["cex", "spot", "futures", "api", "fees"],
  }),
  kucoin: makeRecord({
    summary: tr("Account-based exchange profile where spot trading, futures, margin, bots, Earn, announcement, and API paths are visible but eligibility still needs official-account review.", "账户式交易所；现货、合约、杠杆、机器人、Earn、公告和 API 入口可见，但资格仍需在官方账户端确认。", "帳戶式交易所；現貨、合約、槓桿、機器人、Earn、公告和 API 入口可見，但資格仍需在官方帳戶端確認。"),
    facts: [
      fact(tr("Announcement taxonomy", "公告分类", "公告分類"), tr("KuCoin announcements are separated into latest announcements, events, new listings, product updates, institutions/VIPs, maintenance, delisting, Web3, others, and history.", "KuCoin 公告分为最新公告、活动、上币、产品更新、机构/VIP、系统维护、下架、Web3、其他和历史。", "KuCoin 公告分為最新公告、活動、上幣、產品更新、機構/VIP、系統維護、下架、Web3、其他和歷史。"), "https://www.kucoin.com/announcement"),
      fact(tr("Spot order model", "现货订单模型", "現貨訂單模型"), tr("KuCoin's spot guide explains limit, market, stop-limit, stop-market, OCO, and trailing-stop order types.", "KuCoin 现货指南解释限价、市价、止损限价、止损市价、OCO 和追踪止损订单。", "KuCoin 現貨指南解釋限價、市價、止損限價、止損市價、OCO 和追蹤止損訂單。"), "https://www.kucoin.com/support/360015207073"),
    ],
    sources: [
      source("KuCoin announcements", "https://www.kucoin.com/announcement"),
      source("KuCoin how to trade spot", "https://www.kucoin.com/support/360015207073"),
    ],
    tags: ["cex", "spot", "futures", "announcements", "orders"],
  }),
  mexc: makeRecord({
    summary: tr("Account-based exchange where official spot/futures API docs and help-center notices should be separated from campaign announcements.", "账户式交易所；官方现货/合约 API 文档和帮助中心通知应与活动公告分开阅读。", "帳戶式交易所；官方現貨/合約 API 文檔和幫助中心通知應與活動公告分開閱讀。"),
    facts: [
      fact(tr("API product scope", "API 产品范围", "API 產品範圍"), tr("MEXC spot API documentation exposes spot account, market, and trading endpoints separately from contract APIs.", "MEXC 现货 API 文档把现货账户、行情和交易端点与合约 API 分开列示。", "MEXC 現貨 API 文檔把現貨帳戶、行情和交易端點與合約 API 分開列示。"), "https://mexcdevelop.github.io/apidocs/spot_v3_en/"),
      fact(tr("Derivative product scope", "衍生品范围", "衍生品範圍"), tr("MEXC contract API documentation separately describes contract-market, account, order, and WebSocket interfaces.", "MEXC 合约 API 文档单独描述合约行情、账户、订单和 WebSocket 接口。", "MEXC 合約 API 文檔單獨描述合約行情、帳戶、訂單和 WebSocket 介面。"), "https://mexcdevelop.github.io/apidocs/contract_v1_en/"),
    ],
    sources: [
      source("MEXC spot API documentation", "https://mexcdevelop.github.io/apidocs/spot_v3_en/"),
      source("MEXC contract API documentation", "https://mexcdevelop.github.io/apidocs/contract_v1_en/"),
    ],
    tags: ["cex", "spot", "futures", "api"],
  }),
  backpack: makeRecord({
    summary: tr(
      "Newer account-based exchange profile where Backpack Exchange, self-custodial Wallet, API, futures/margin, and Backpack Securities must stay clearly separated.",
      "较新的账户式交易所；Backpack Exchange、自托管 Wallet、API、合约/保证金和 Backpack Securities 必须清楚分层。",
      "較新的帳戶式交易所；Backpack Exchange、自託管 Wallet、API、合約/保證金和 Backpack Securities 必須清楚分層。"
    ),
    facts: [
      fact(tr("Exchange vs wallet", "交易所与钱包边界", "交易所與錢包邊界"), tr("Backpack's official about page separates Backpack Exchange from Backpack Wallet, which is described as a self-custodial web3 app.", "Backpack 官方 About 页面把 Backpack Exchange 与 Backpack Wallet 分开，后者被描述为自托管 Web3 应用。", "Backpack 官方 About 頁面把 Backpack Exchange 與 Backpack Wallet 分開，後者被描述為自託管 Web3 應用。"), "https://learn.backpack.exchange/about"),
      fact(tr("API product scope", "API 产品范围", "API 產品範圍"), tr("Backpack's API FAQ says the same order and account endpoints support both spot and perpetual futures.", "Backpack API FAQ 说明同一订单与账户端点支持现货和永续合约。", "Backpack API FAQ 說明同一訂單與帳戶端點支援現貨和永續合約。"), "https://support.backpack.exchange/exchange/api-and-developer-docs/faqs"),
      fact(tr("Margin system", "保证金系统", "保證金系統"), tr("Backpack technical docs describe every subaccount as cross-margined, multi-currency, and able to access spot, futures, spot margin, borrow, and lending products.", "Backpack 技术文档描述每个子账户为跨保证金、多币种，并可访问现货、合约、现货保证金、借贷产品。", "Backpack 技術文檔描述每個子帳戶為跨保證金、多幣種，並可訪問現貨、合約、現貨保證金、借貸產品。"), "https://support.backpack.exchange/technical-docs/trading/margin"),
      fact(tr("Securities boundary", "证券产品边界", "證券產品邊界"), tr("Backpack Securities content distinguishes traditional securities holdings from tokenized securities on Solana, including a two-way withdrawal/redemption flow.", "Backpack Securities 内容区分传统证券持仓与 Solana 上的代币化证券，并说明双向提取/赎回流程。", "Backpack Securities 內容區分傳統證券持倉與 Solana 上的代幣化證券，並說明雙向提取/贖回流程。"), "https://learn.backpack.exchange/articles/access-us-securities-onchain"),
    ],
    sources: [
      source("About Backpack", "https://learn.backpack.exchange/about"),
      source("Backpack API FAQ", "https://support.backpack.exchange/exchange/api-and-developer-docs/faqs"),
      source("Backpack margin technical docs", "https://support.backpack.exchange/technical-docs/trading/margin"),
      source("Backpack Securities onchain access", "https://learn.backpack.exchange/articles/access-us-securities-onchain"),
    ],
    tags: ["cex", "spot", "perpetuals", "wallet", "tokenized-securities", "api"],
  }),
  coinw: makeRecord({
    summary: tr(
      "Account-based exchange founded in 2017 that runs spot, USDT perpetual futures, copy trading, Earn and trading bots in one account, with a public Merkle-tree proof of reserves.",
      "2017 年成立的账户式交易所，一个账户内提供现货、U 本位永续合约、跟单、理财与交易机器人，并公开默克尔树储备金证明。",
      "2017 年成立的帳戶式交易所，一個帳戶內提供現貨、U 本位永續合約、跟單、理財與交易機器人，並公開默克爾樹儲備金證明。"
    ),
    facts: [
      fact(tr("Product map", "产品范围", "產品範圍"), tr("CoinW's official site lists spot trading, USDT perpetual futures, futures and spot copy trading, Earn (savings and auto-invest), grid and martingale bots, and a crypto card.", "CoinW 官网列出现货交易、U 本位永续合约、合约与现货跟单、理财（活期与定投）、网格与马丁格尔机器人，以及加密卡。", "CoinW 官網列出現貨交易、U 本位永續合約、合約與現貨跟單、理財（活期與定投）、網格與馬丁格爾機器人，以及加密卡。"), "https://www.coinw.com/about-us"),
      fact(tr("Identity gate", "身份门槛", "身分門檻"), tr("CoinW's site configuration tells users without KYC that opening spot or futures orders, buying CoinW Earn and depositing are limited until identity verification is complete.", "CoinW 网站配置提示：未完成 KYC 的用户，现货/合约下单、购买理财与充值都会受限，完成身份认证后解除。", "CoinW 網站設定提示：未完成 KYC 的用戶，現貨/合約下單、購買理財與充值都會受限，完成身分認證後解除。"), "https://www.coinw.com/help-center/announcement-center/otc-news/otc-latest-news/2026-03-12/buy-crypto-earn-up-to-100-usdt/7539"),
      fact(tr("Reserve disclosure", "储备金披露", "儲備金揭露"), tr("CoinW's proof-of-reserves page states a 100% reserve commitment and lets users check their balance against monthly SHA-256 Merkle-tree snapshots with an open-source verifier.", "CoinW 储备金证明页面承诺 100% 储备，用户可用开源验证工具，按月度 SHA-256 默克尔树快照核对自己的资产。", "CoinW 儲備金證明頁面承諾 100% 儲備，用戶可用開源驗證工具，依月度 SHA-256 默克爾樹快照核對自己的資產。"), "https://www.coinw.com/proof-of-reserves"),
    ],
    sources: [
      source("About CoinW", "https://www.coinw.com/about-us"),
      source("CoinW site notice on KYC limits (Buy Crypto page)", "https://www.coinw.com/help-center/announcement-center/otc-news/otc-latest-news/2026-03-12/buy-crypto-earn-up-to-100-usdt/7539"),
      source("CoinW proof of reserves", "https://www.coinw.com/proof-of-reserves"),
    ],
    checkedAt: COINW_CHECKED_AT,
    tags: ["cex", "spot", "perpetuals", "copy-trading"],
  }),
  deribit: makeRecord({
    summary: tr("Derivatives-led exchange profile centered on options, futures, perpetuals, API market data, and separate spot-routing updates.", "以衍生品为核心的交易所；重点是期权、交割合约、永续、API 行情和独立的现货路由更新。", "以衍生品為核心的交易所；重點是期權、交割合約、永續、API 行情和獨立的現貨路由更新。"),
    facts: [
      fact(tr("Derivative product scope", "衍生品范围", "衍生品範圍"), tr("Deribit API docs describe the venue as offering futures, options, and perpetuals.", "Deribit API 文档将平台描述为提供交割合约、期权和永续合约。", "Deribit API 文檔將平台描述為提供交割合約、期權和永續合約。"), "https://docs.deribit.com/"),
      fact(tr("Instrument lifecycle", "合约生命周期", "合約生命週期"), tr("The public instruments endpoint filters by currency and instrument kind, and can include recently expired instruments when requested.", "公开 instruments 端点可按币种和工具类型过滤，并可在请求时包含近期过期合约。", "公開 instruments 端點可按幣種和工具類型過濾，並可在請求時包含近期過期合約。"), "https://docs.deribit.com/api-reference/market-data/public-get_instruments"),
    ],
    sources: [
      source("Deribit API documentation", "https://docs.deribit.com/"),
      source("Deribit public instruments endpoint", "https://docs.deribit.com/api-reference/market-data/public-get_instruments"),
    ],
    tags: ["cex", "derivatives", "options", "perpetuals", "api"],
  }),
  uniswap: makeRecord({
    summary: tr("Wallet-connected DEX profile built around AMM liquidity pools, self-custody, immutable protocol contracts, v3/v4 concentrated liquidity, and v4 hooks.", "钱包连接型 DEX；核心是 AMM 流动性池、自托管、不可升级协议合约、v3/v4 集中流动性和 v4 hooks。", "錢包連接型 DEX；核心是 AMM 流動性池、自託管、不可升級協議合約、v3/v4 集中流動性和 v4 hooks。"),
    facts: [
      fact(tr("AMM model", "AMM 模型", "AMM 模型"), tr("Uniswap docs describe the protocol as an AMM using smart contracts instead of order books.", "Uniswap 文档说明协议用智能合约 AMM 替代订单簿。", "Uniswap 文檔說明協議用智能合約 AMM 替代訂單簿。"), "https://developers.uniswap.org/docs/get-started/concepts/how-uniswap-works"),
      fact(tr("Version architecture", "版本架构", "版本架構"), tr("Uniswap v4 documentation points developers to hooks, flash accounting, dynamic fees, deployments, SDKs, and audit reports.", "Uniswap v4 文档把开发者引向 hooks、闪电记账、动态费用、部署、SDK 和审计报告。", "Uniswap v4 文檔把開發者引向 hooks、閃電記帳、動態費用、部署、SDK 和審計報告。"), "https://developers.uniswap.org/docs/protocols/v4/overview"),
      fact(tr("Swap fee tiers", "Swap 费用层级", "Swap 費用層級"), tr("Uniswap docs describe swap-fee mechanics by version: v2 uses 0.30%, v3 uses enabled fee tiers, and v4 pools may use a static fee set at creation or a dynamic fee managed by the attached hook.", "Uniswap 文档按版本说明 swap 费用机制：v2 使用 0.30%，v3 使用已启用费率层级，v4 池可使用创建时设定的静态费用，或由挂接 hook 管理的动态费用。", "Uniswap 文檔按版本說明 swap 費用機制：v2 使用 0.30%，v3 使用已啟用費率層級，v4 池可使用建立時設定的靜態費用，或由掛接 hook 管理的動態費用。"), "https://developers.uniswap.org/docs/get-started/concepts/fees"),
      fact(tr("Dynamic fee boundary", "动态费用边界", "動態費用邊界"), tr("Uniswap v4 dynamic-fee docs say whether a pool uses dynamic fees is fixed at pool creation; dynamic fees can be updated through PoolManager or by a beforeSwap hook rather than read as one static public rate.", "Uniswap v4 动态费用文档说明，池子是否使用动态费用在创建时确定；动态费用可通过 PoolManager 或 beforeSwap hook 更新，不能按单一静态公开费率理解。", "Uniswap v4 動態費用文檔說明，池子是否使用動態費用在建立時確定；動態費用可透過 PoolManager 或 beforeSwap hook 更新，不能按單一靜態公開費率理解。"), "https://developers.uniswap.org/docs/protocols/v4/concepts/dynamic-fees"),
      fact(tr("Wallet route test", "钱包路径测试", "錢包路徑測試"), tr("Uniswap quickstart for the official app URL tells integrators to build and test the link so it opens with the expected prefilled swap settings before using it in a CTA.", "Uniswap quickstart 要求集成方先构建并测试官方 App URL，确认能按预期打开预填 swap 设置后再用于 CTA。", "Uniswap quickstart 要求整合方先建立並測試官方 App URL，確認能按預期開啟預填 swap 設定後再用於 CTA。"), "https://developers.uniswap.org/docs/get-started/quickstart"),
      fact(tr("Hook test environment", "Hook 测试环境", "Hook 測試環境"), tr("Uniswap v4 hook docs start with a local development environment using foundry, PoolManager, utility routers and test tokens before developers move hook behavior toward live deployments.", "Uniswap v4 hook 文档要求先配置本地开发环境，例如 foundry、PoolManager、工具路由和测试代币，再把 hook 行为推进到线上部署。", "Uniswap v4 hook 文檔要求先配置本地開發環境，例如 foundry、PoolManager、工具路由和測試代幣，再把 hook 行為推進到線上部署。"), "https://developers.uniswap.org/docs/protocols/v4/guides/hooks/getting-started"),
      fact(tr("Supported chain scope", "支持链范围", "支援鏈範圍"), tr("At the review time, Uniswap's official swapping API table lists mainnet and testnet networks separately and publishes the Universal Router address by chain and router version. This is a dated integration map, not a promise that every token, route or interface feature is available on every listed network.", "在本次核验时间点，Uniswap 官方 swapping API 表把主网与测试网分开列出，并按链和 router 版本公布 Universal Router 地址。这是有日期的集成映射，不代表每个代币、路由或界面功能在所有列出网络上都可用。", "在本次核驗時間點，Uniswap 官方 swapping API 表把主網與測試網分開列出，並按鏈和 router 版本公布 Universal Router 地址。這是有日期的整合映射，不代表每個代幣、路由或介面功能在所有列出網路上都可用。"), "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains"),
      fact(tr("Testnet interface scope", "测试网界面范围", "測試網介面範圍"), tr("For the query uniswap testnet, the official supported-chains page lists Ethereum Sepolia, Unichain Sepolia and Base Sepolia for API access, while only Ethereum Sepolia and Unichain Sepolia are available as testnets in the Uniswap web interface. Testnet support can change and does not establish mainnet liquidity, execution or asset safety.", "针对 uniswap testnet 查询，官方支持链页面列出 Ethereum Sepolia、Unichain Sepolia 和 Base Sepolia 可通过 API 使用，而 Uniswap Web 界面仅提供 Ethereum Sepolia 与 Unichain Sepolia 测试网。测试网支持可能变化，也不能证明主网流动性、执行结果或资产安全。", "針對 uniswap testnet 查詢，官方支援鏈頁面列出 Ethereum Sepolia、Unichain Sepolia 和 Base Sepolia 可透過 API 使用，而 Uniswap Web 介面僅提供 Ethereum Sepolia 與 Unichain Sepolia 測試網。測試網支援可能變化，也不能證明主網流動性、執行結果或資產安全。"), "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains"),
      fact(tr("Official app route", "官方 App 路径", "官方 App 路徑"), tr("At the review time, the official Uniswap web app route is https://app.uniswap.org/. Users should re-check the full domain and the wallet request at the moment of use; reaching a recognizable interface is not a safety guarantee for a token, signature or swap route.", "在本次核验时间点，Uniswap 官方 Web App 路径为 https://app.uniswap.org/。使用时仍应重新核对完整域名与钱包请求；看到熟悉界面并不能保证代币、签名或 swap 路由安全。", "在本次核驗時間點，Uniswap 官方 Web App 路徑為 https://app.uniswap.org/。使用時仍應重新核對完整網域與錢包請求；看到熟悉介面並不能保證代幣、簽名或 swap 路由安全。"), "https://app.uniswap.org/"),
      fact(tr("Official app and docs boundary", "官方 App 与文档边界", "官方 App 與文檔邊界"), tr("A Uniswap search result should separate the official app route from developer docs: use app.uniswap.org for the wallet-facing interface, then use quickstart, supported-chains and deployments docs to verify whether the target network, router and integration path match the intended live action.", "Uniswap 搜索结果应区分官方 App 与开发者文档：钱包端界面以 app.uniswap.org 为准，再用 quickstart、supported-chains 和 deployments 文档核验目标网络、router 与集成路径是否匹配真实操作。", "Uniswap 搜尋結果應區分官方 App 與開發者文檔：錢包端介面以 app.uniswap.org 為準，再用 quickstart、supported-chains 和 deployments 文檔核驗目標網路、router 與整合路徑是否匹配真實操作。"), "https://developers.uniswap.org/docs/get-started/quickstart"),
      fact(tr("Testnet research boundary", "测试网研究边界", "測試網研究邊界"), tr("Uniswap testnet or local hook setup is a development verification path; before a live swap, users still need to re-check the official app URL, chain, token contract, fee tier, deployment mapping and wallet transaction.", "Uniswap 测试网或本地 hook 设置属于开发验证路径；进入真实 swap 前，用户仍需重新核验官方 App URL、链、代币合约、费率层级、部署映射和钱包交易。", "Uniswap 測試網或本地 hook 設定屬於開發驗證路徑；進入真實 swap 前，用戶仍需重新核驗官方 App URL、鏈、代幣合約、費率層級、部署映射和錢包交易。"), "https://developers.uniswap.org/docs/get-started/quickstart"),
      fact(tr("Testnet to production handoff", "测试到实盘交接", "測試到實盤交接"), tr("A Uniswap testnet result should be handed off to production only after the target chain, v4 deployment, pool version, token address, gas token and final wallet simulation match the live route. Never send value to a copied or unknown contract from a search result, chat or social post.", "Uniswap testnet 结果只有在目标链、v4 部署、池版本、代币地址、gas 资产和最终钱包模拟与真实路由一致后，才应进入生产使用。不要向搜索结果、聊天或社交媒体里复制来的未知合约发送价值。", "Uniswap testnet 結果只有在目標鏈、v4 部署、池版本、代幣地址、gas 資產和最終錢包模擬與真實路由一致後，才應進入生產使用。不要向搜尋結果、聊天或社交媒體裡複製來的未知合約發送價值。"), "https://developers.uniswap.org/docs/protocols/v4/deployments"),
      fact(tr("Token contract identity", "代币合约身份", "代幣合約身份"), tr("Uniswap Support defines a token contract address as the blockchain address for the token itself and shows users how to inspect it from the web app and block explorer. A token address is chain-specific asset identity; it is not the Universal Router, Permit2 contract or the spender named in an approval signature.", "Uniswap Support 将代币合约地址定义为该代币自身在区块链上的地址，并说明如何从 Web App 与区块浏览器核验。代币地址是对应链上的资产身份，不等同于 Universal Router、Permit2 合约或授权签名中列出的 spender。", "Uniswap Support 將代幣合約地址定義為該代幣自身在區塊鏈上的地址，並說明如何從 Web App 與區塊瀏覽器核驗。代幣地址是對應鏈上的資產身份，不等同於 Universal Router、Permit2 合約或授權簽名中列出的 spender。"), "https://support.uniswap.org/hc/en-us/articles/26757826138637-What-is-a-token-contract-address"),
      fact(tr("Pool and token contract boundary", "池子与代币合约边界", "池子與代幣合約邊界"), tr("For Uniswap mainnet or testnet research, a token contract address identifies the asset on one chain, while a pool or route determines liquidity and execution. A matching token symbol or testnet pool does not prove the intended mainnet token, pool depth, fee tier or hook behavior.", "研究 Uniswap 主网或测试网时，代币合约地址只标识某条链上的资产，池子或路由才决定流动性与执行。相同代币符号或测试网池子不能证明目标主网代币、池深度、费率层级或 hook 行为。", "研究 Uniswap 主網或測試網時，代幣合約地址只標識某條鏈上的資產，池子或路由才決定流動性與執行。相同代幣符號或測試網池子不能證明目標主網代幣、池深度、費率層級或 hook 行為。"), "https://support.uniswap.org/hc/en-us/articles/26757826138637-What-is-a-token-contract-address"),
      fact(tr("Router and approval roles", "路由与授权角色", "路由與授權角色"), tr("The official Universal Router overview says the router composes v2, v3 and v4 swaps and integrates Permit2 approvals. The input token contract, Universal Router, Permit2 contract and spender are separate roles: the token identifies the asset, the router executes commands, Permit2 manages delegated token permission, and the spender is the protocol address authorized by that permission.", "官方 Universal Router 概览说明 Router 组合执行 v2、v3 与 v4 swap，并集成 Permit2 授权。输入代币合约、Universal Router、Permit2 合约和 spender 属于不同角色：代币合约标识资产，Router 执行命令，Permit2 管理委托的代币权限，spender 是被该权限授权的协议地址。", "官方 Universal Router 概覽說明 Router 組合執行 v2、v3 與 v4 swap，並整合 Permit2 授權。輸入代幣合約、Universal Router、Permit2 合約和 spender 屬於不同角色：代幣合約標識資產，Router 執行命令，Permit2 管理委託的代幣權限，spender 是被該權限授權的協議地址。"), "https://developers.uniswap.org/docs/protocols/universal-router/overview"),
      fact(tr("Wallet authorization boundary", "钱包授权边界", "錢包授權邊界"), tr("Uniswap Permit2 docs separate one-time token approval of the Permit2 contract from granular token approvals and spender permissions, so a live swap check should include the wallet approval or Permit2 path before the final signed transaction.", "Uniswap Permit2 文档区分对 Permit2 合约的一次性 token 授权与更细粒度的 spender 权限，因此真实 swap 核验应在最终签名交易前包含钱包授权或 Permit2 路径。", "Uniswap Permit2 文件區分對 Permit2 合約的一次性 token 授權與更細粒度的 spender 權限，因此真實 swap 核驗應在最終簽名交易前包含錢包授權或 Permit2 路徑。"), "https://developers.uniswap.org/docs/protocols/permit2/overview"),
      fact(tr("Permit2 deployment identity", "Permit2 部署身份", "Permit2 部署身份"), tr("At the review time, Uniswap's Permit2 overview lists 0x000000000022D473030F116dDEE9F6B43aC78BA3 on supported chains except zkSync, where it lists 0x0000000000225e31D15943971F47aD3022F714Fa. This dated address check does not make an approval or signature safe; the target chain, token, spender, amount and expiration still need review.", "在本次核验时间点，Uniswap Permit2 概览列出受支持链使用 0x000000000022D473030F116dDEE9F6B43aC78BA3，zkSync 则列出 0x0000000000225e31D15943971F47aD3022F714Fa。这个有日期的地址核验不代表授权或签名安全；仍需检查目标链、代币、spender、金额和到期时间。", "在本次核驗時間點，Uniswap Permit2 概覽列出受支援鏈使用 0x000000000022D473030F116dDEE9F6B43aC78BA3，zkSync 則列出 0x0000000000225e31D15943971F47aD3022F714Fa。這個有日期的地址核驗不代表授權或簽名安全；仍需檢查目標鏈、代幣、spender、金額和到期時間。"), "https://developers.uniswap.org/docs/protocols/permit2/overview"),
      fact(tr("Approval spender check", "授权 spender 核验", "授權 spender 核驗"), tr("Before signing a Uniswap production swap, the approval spender or Permit2 route should be checked in the wallet along with token address, expected output, slippage and gas; a testnet hook result cannot replace this approval review.", "签署 Uniswap 实盘 swap 前，应在钱包内核验 approval spender 或 Permit2 路径，并同时核对代币地址、预期输出、滑点和 gas；测试网 hook 结果不能替代这一步授权审查。", "簽署 Uniswap 實盤 swap 前，應在錢包內核驗 approval spender 或 Permit2 路徑，並同時核對代幣地址、預期輸出、滑點和 gas；測試網 hook 結果不能替代這一步授權審查。"), "https://developers.uniswap.org/docs/protocols/permit2/overview"),
      fact(tr("Signature permission fields", "签名权限字段", "簽名權限欄位"), tr("Uniswap's signature-scam guidance says a Permit2 signature can identify the token owner, spending protocol, token contract, amount and expiration. Users should compare every displayed field with the intended swap instead of treating a recognizable domain or Permit2 address as sufficient proof.", "Uniswap 的签名诈骗指南说明，Permit2 签名可列出代币所有者、可支出的协议、代币合约、金额和到期时间。用户应把每个显示字段与预期 swap 对照，而不能把熟悉的域名或 Permit2 地址当作充分证明。", "Uniswap 的簽名詐騙指南說明，Permit2 簽名可列出代幣所有者、可支出的協議、代幣合約、金額和到期時間。用戶應把每個顯示欄位與預期 swap 對照，而不能把熟悉的網域或 Permit2 地址當作充分證明。"), "https://support.uniswap.org/hc/en-us/articles/40050562560781-Crypto-Wallet-Signature-Scams"),
      fact(tr("Offchain signature boundary", "链下签名边界", "鏈下簽名邊界"), tr("Uniswap warns that a completed Permit2 signature can remain offchain until another wallet broadcasts it later, so an apparently gas-free Sign prompt is still an authorization event. The page does not certify a signature, spender or route as safe.", "Uniswap 警告，完成的 Permit2 签名可能在链下保存，之后再由其他钱包广播，因此看似无需 gas 的 Sign 提示仍属于授权事件。本页不认证任何签名、spender 或路由为安全。", "Uniswap 警告，完成的 Permit2 簽名可能在鏈下保存，之後再由其他錢包廣播，因此看似無需 gas 的 Sign 提示仍屬於授權事件。本頁不認證任何簽名、spender 或路由為安全。"), "https://support.uniswap.org/hc/en-us/articles/40050562560781-Crypto-Wallet-Signature-Scams"),
      fact(tr("Approval review and revocation", "授权检查与撤销", "授權檢查與撤銷"), tr("Uniswap Support directs users to the approval checker for the active network to inspect or revoke token approvals. Revoking requires a network transaction and cost, and disconnecting a dapp is not the same as revoking its token approval.", "Uniswap Support 指引用户使用当前网络的 approval checker 检查或撤销代币授权。撤销需要链上交易并产生网络费用，断开 dapp 连接不等于撤销其代币授权。", "Uniswap Support 指引用戶使用目前網路的 approval checker 檢查或撤銷代幣授權。撤銷需要鏈上交易並產生網路費用，斷開 dapp 連線不等於撤銷其代幣授權。"), "https://support.uniswap.org/hc/en-us/articles/15724901841037-How-to-revoke-a-token-approval"),
      fact(tr("Deployment address check", "部署地址核验", "部署地址核驗"), tr("Uniswap v4 deployment docs warn integrators not to assume the same contract addresses across chains and to confirm the network-specific deployment mapping.", "Uniswap v4 部署文档提醒集成方不要假定各链合约地址相同，需核验对应网络的部署映射。", "Uniswap v4 部署文檔提醒整合方不要假定各鏈合約地址相同，需核驗對應網路的部署映射。"), "https://developers.uniswap.org/docs/protocols/v4/deployments"),
      fact(tr("Deployment feed", "部署 feed", "部署 feed"), tr("Uniswap v4 deployment docs point integrators to the unified deployments page and deployments.json feed for current core, periphery and Universal Router addresses by network.", "Uniswap v4 部署文档指向统一 Deployments 页面和 deployments.json feed，用于按网络核对当前 core、periphery 和 Universal Router 地址。", "Uniswap v4 部署文檔指向統一 Deployments 頁面和 deployments.json feed，用於按網路核對目前 core、periphery 和 Universal Router 地址。"), "https://developers.uniswap.org/docs/protocols/v4/deployments"),
      fact(tr("Uniswap source map", "Uniswap 来源地图", "Uniswap 來源地圖"), tr("A uniswap testnet query should map to official app, supported-chains table and deployments before any live wallet action. These are source checks, not deposit instructions, token-safety proof or permission to use an unknown contract.", "uniswap testnet 查询在任何真实钱包操作前，应先映射到官方 App、supported-chains 表和 deployments 文档。这些是来源核验，不是充值说明、代币安全证明，也不是使用未知合约的许可。", "uniswap testnet 查詢在任何真實錢包操作前，應先映射到官方 App、supported-chains 表和 deployments 文檔。這些是來源核驗，不是儲值說明、代幣安全證明，也不是使用未知合約的許可。"), "https://developers.uniswap.org/docs/get-started/quickstart"),
      fact(tr("Production route checklist", "真实路由检查清单", "真實路由檢查清單"), tr("Before moving from a Uniswap testnet or local hook path to production, check the app domain, chain, token contract, pool version, fee tier or dynamic-fee hook, gas token, wallet simulation and final signed transaction.", "从 Uniswap 测试网或本地 hook 路径进入生产环境前，应核验 App 域名、链、代币合约、池版本、费率层级或动态费用 hook、gas 资产、钱包模拟和最终签名交易。", "從 Uniswap 測試網或本地 hook 路徑進入生產環境前，應核驗 App 網域、鏈、代幣合約、池版本、費率層級或動態費用 hook、gas 資產、錢包模擬和最終簽名交易。"), "https://developers.uniswap.org/docs/protocols/v4/deployments"),
      fact(tr("Gas and transaction preview boundary", "Gas 与交易预览边界", "Gas 與交易預覽邊界"), tr("The last Uniswap decision point is the wallet preview: users should verify the gas asset, expected output, slippage, approval or Permit2 spender, token contract, route and final transaction details before signing. A quote or testnet transaction is not the same as an executed mainnet swap.", "Uniswap 最后的决策点是钱包预览：签名前应核验 gas 资产、预期输出、滑点、授权或 Permit2 spender、代币合约、路由和最终交易细节。报价或测试网交易不等同于已执行的主网 swap。", "Uniswap 最後的決策點是錢包預覽：簽名前應核驗 gas 資產、預期輸出、滑點、授權或 Permit2 spender、代幣合約、路由和最終交易細節。報價或測試網交易不等同於已執行的主網 swap。"), "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens"),
      fact(tr("Protocol fee boundary", "协议费边界", "協議費邊界"), tr("Uniswap distinguishes the swap fee paid by each trade from protocol fees and v4 hook fees. Protocol fees are active on all v2 pools and selected v3 pools, remain governance-configurable, and can coexist with v4 dynamic and hook fees, so a pool quote should be checked against the current pool and protocol configuration.", "Uniswap 将每笔交易支付的 swap 费用与协议费、v4 hook 费用分开说明。协议费已在全部 v2 池和部分 v3 池启用，仍可由治理调整，并可与 v4 动态费用及 hook 费用同时存在，因此池报价必须结合当前池和协议配置核验。", "Uniswap 將每筆交易支付的 swap 費用與協議費、v4 hook 費用分開說明。協議費已在全部 v2 池和部分 v3 池啟用，仍可由治理調整，並可與 v4 動態費用及 hook 費用同時存在，因此池報價必須結合目前池和協議配置核驗。"), "https://developers.uniswap.org/docs/get-started/concepts/fees"),
    ],
    sources: [
      source("How Uniswap works", "https://developers.uniswap.org/docs/get-started/concepts/how-uniswap-works"),
      source("Uniswap v4 overview", "https://developers.uniswap.org/docs/protocols/v4/overview"),
      source("Uniswap fees", "https://developers.uniswap.org/docs/get-started/concepts/fees"),
      source("Uniswap v4 dynamic fees", "https://developers.uniswap.org/docs/protocols/v4/concepts/dynamic-fees"),
      source("Uniswap quickstart", "https://developers.uniswap.org/docs/get-started/quickstart"),
      source("Uniswap swap support", "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens"),
      source("Uniswap v4 hooks getting started", "https://developers.uniswap.org/docs/protocols/v4/guides/hooks/getting-started"),
      source("Uniswap protocols overview", "https://developers.uniswap.org/docs/protocols/overview"),
      source("Uniswap Permit2 overview", "https://developers.uniswap.org/docs/protocols/permit2/overview"),
      source("Uniswap v4 deployments", "https://developers.uniswap.org/docs/protocols/v4/deployments"),
      source("Uniswap supported chains and router versions", "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains"),
      source("Uniswap Universal Router overview", "https://developers.uniswap.org/docs/protocols/universal-router/overview"),
      source("Uniswap web app", "https://app.uniswap.org/"),
      source("Uniswap Support: token contract addresses", "https://support.uniswap.org/hc/en-us/articles/26757826138637-What-is-a-token-contract-address"),
      source("Uniswap Support: crypto wallet signature scams", "https://support.uniswap.org/hc/en-us/articles/40050562560781-Crypto-Wallet-Signature-Scams"),
      source("Uniswap Support: checking wallet approvals", "https://support.uniswap.org/hc/en-us/articles/17523327223437-Checking-your-wallet-s-approvals"),
      source("Uniswap Support: revoking token approvals", "https://support.uniswap.org/hc/en-us/articles/15724901841037-How-to-revoke-a-token-approval"),
    ],
    tags: ["dex", "amm", "self-custody", "ethereum", "hooks"],
    checkedAt: UNISWAP_CHECKED_AT,
  }),
  pancakeswap: makeRecord({
    summary: tr("Wallet-connected multi-chain DEX profile with v2/v3 exchange, Infinity modular AMM architecture, concentrated liquidity, liquidity-book pools, and Universal Router paths.", "钱包连接型多链 DEX；包含 v2/v3 交易、Infinity 模块化 AMM 架构、集中流动性、Liquidity Book 池和 Universal Router。", "錢包連接型多鏈 DEX；包含 v2/v3 交易、Infinity 模組化 AMM 架構、集中流動性、Liquidity Book 池和 Universal Router。"),
    facts: [
      fact(tr("Infinity architecture", "Infinity 架构", "Infinity 架構"), tr("PancakeSwap Infinity documentation describes a modular architecture supporting Concentrated Liquidity Pools and Liquidity Book Pools.", "PancakeSwap Infinity 文档说明其模块化架构支持集中流动性池和 Liquidity Book 池。", "PancakeSwap Infinity 文檔說明其模組化架構支援集中流動性池和 Liquidity Book 池。"), "https://developer.pancakeswap.finance/contracts/infinity/faq/pancakeswap-infinity-vs-uniswap-v4"),
      fact(tr("Settlement layer", "结算层", "結算層"), tr("Infinity uses a Vault as an immutable accounting layer that records deposited or owed tokens for transaction settlement.", "Infinity 使用 Vault 作为不可变记账层，记录已存入或应付代币以完成交易结算。", "Infinity 使用 Vault 作為不可變記帳層，記錄已存入或應付代幣以完成交易結算。"), "https://developer.pancakeswap.finance/contracts/infinity/overview/accounting-layer-vault"),
    ],
    sources: [
      source("PancakeSwap Infinity vs Uniswap v4", "https://developer.pancakeswap.finance/contracts/infinity/faq/pancakeswap-infinity-vs-uniswap-v4"),
      source("PancakeSwap Infinity Vault", "https://developer.pancakeswap.finance/contracts/infinity/overview/accounting-layer-vault"),
    ],
    tags: ["dex", "amm", "multi-chain", "liquidity"],
  }),
  jupiter: makeRecord({
    summary: tr("Solana liquidity-routing profile centered on Swap, Ultra, token-list checks, transaction building, router competition, and API-based integration rather than a custodial exchange account.", "Solana 流动性路由；核心是 Swap、Ultra、Token 列表核验、交易构建、路由竞争和 API 集成，不是托管交易所账户。", "Solana 流動性路由；核心是 Swap、Ultra、Token 列表核驗、交易構建、路由競爭和 API 集成，不是託管交易所帳戶。"),
    facts: [
      fact(tr("Swap API", "Swap API", "Swap API"), tr("Jupiter Swap API is the quote-and-transaction path for apps that need to fetch routes and build Solana swap transactions before the user signs in a wallet.", "Jupiter Swap API 是应用获取报价路由并构建 Solana swap 交易的路径，用户仍需在钱包中签名。", "Jupiter Swap API 是應用取得報價路由並構建 Solana swap 交易的路徑，用戶仍需在錢包中簽名。"), "https://dev.jup.ag/docs/swap"),
      fact(tr("Routing role", "路由角色", "路由角色"), tr("Jupiter's developer platform describes Metis, JupiterZ, and third-party routers competing on swaps, so output should be treated as route selection rather than exchange custody.", "Jupiter 开发者平台说明 Metis、JupiterZ 和第三方路由会在 swap 中竞争，因此输出应理解为路由选择，而不是交易所托管。", "Jupiter 開發者平台說明 Metis、JupiterZ 和第三方路由會在 swap 中競爭，因此輸出應理解為路由選擇，而不是交易所託管。"), "https://dev.jup.ag/docs/get-started"),
      fact(tr("Ultra execution mode", "Ultra 执行模式", "Ultra 執行模式"), tr("Ultra should be checked as a separate execution path from legacy Swap because integrators may receive different routing, transaction, and order-handling behavior.", "Ultra 应作为不同于传统 Swap 的独立执行路径核对，因为集成方可能得到不同的路由、交易与订单处理行为。", "Ultra 應作為不同於傳統 Swap 的獨立執行路徑核對，因為整合方可能得到不同的路由、交易與訂單處理行為。"), "https://dev.jup.ag/docs/ultra"),
      fact(tr("Swap failure boundary", "Swap 失败边界", "Swap 失敗邊界"), tr("Jupiter Support says failed swaps can come from price movement, liquidity size, token restrictions or stale routes, so a failed quote should be treated as an execution condition rather than a platform custody issue.", "Jupiter Support 说明 swap 失败可能来自价格变化、流动性规模、代币限制或过期路由，因此失败报价应被视为执行条件问题，而不是平台托管问题。", "Jupiter Support 說明 swap 失敗可能來自價格變化、流動性規模、代幣限制或過期路由，因此失敗報價應被視為執行條件問題，而不是平台託管問題。"), "https://support.jup.ag/"),
      fact(tr("Ultra compensation boundary", "Ultra 补偿边界", "Ultra 補償邊界"), tr("Jupiter's public support text limits Ultra compensation review to defined routing, repeated failure or extreme slippage cases and says potential profit-and-loss is not compensated.", "Jupiter 公开支持说明把 Ultra 补偿审核限制在特定路由、连续失败或极端滑点情形，并说明不会赔付潜在盈亏。", "Jupiter 公開支援說明把 Ultra 補償審核限制在特定路由、連續失敗或極端滑點情形，並說明不會賠付潛在盈虧。"), "https://support.jup.ag/"),
      fact(tr("Route liquidity boundary", "路由流动性边界", "路由流動性邊界"), tr("The support FAQ says 'No routes found' usually reflects insufficient liquidity, unsuitable trade size, or token restrictions; users should verify real Solana DEX liquidity before treating a route as available.", "支持 FAQ 说明 No routes found 通常反映流动性不足、交易规模不合适或代币限制；把路由视为可用前应核验 Solana DEX 的真实流动性。", "支援 FAQ 說明 No routes found 通常反映流動性不足、交易規模不合適或代幣限制；把路由視為可用前應核驗 Solana DEX 的真實流動性。"), "https://support.jup.ag/"),
      fact(tr("Platform fee boundary", "平台费用边界", "平台費用邊界"), tr("Jupiter integrations must verify fee configuration in the official API docs; a quoted route does not prove that a separate platform fee, wallet fee, or network cost is absent.", "Jupiter 集成方必须按官方 API 文档核验费用配置；得到报价路由并不能证明没有额外平台费、钱包费或网络成本。", "Jupiter 整合方必須按官方 API 文檔核驗費用配置；得到報價路由並不能證明沒有額外平台費、錢包費或網路成本。"), "https://dev.jup.ag/docs/swap"),
      fact(tr("Token-list boundary", "Token 列表边界", "Token 列表邊界"), tr("Jupiter token-list and token API references should be used to verify mints and list status before treating a Solana asset route as safe or broadly available.", "在把 Solana 资产路由视为安全或广泛可用前，应使用 Jupiter Token 列表与 Token API 参考核验 mint 和列表状态。", "在把 Solana 資產路由視為安全或廣泛可用前，應使用 Jupiter Token 列表與 Token API 參考核驗 mint 和列表狀態。"), "https://dev.jup.ag/docs/tokens"),
      fact(tr("Transaction build path", "交易构建路径", "交易構建路徑"), tr("The user decision point is the built transaction shown by the wallet: network, mint addresses, slippage, price impact, and route legs must still be reviewed before signing.", "用户真正决策点是钱包展示的已构建交易：网络、mint 地址、滑点、价格影响和路由腿都需在签名前复核。", "用戶真正決策點是錢包展示的已構建交易：網路、mint 地址、滑點、價格影響和路由腿都需在簽名前複核。"), "https://dev.jup.ag/docs/swap"),
      fact(tr("Query intent boundary", "查询意图边界", "查詢意圖邊界"), tr("A Jupiter search should be sorted into test quote, live swap, token-list verification, Ultra execution review, or API/platform-fee integration before the page asks the user to open the official route.", "Jupiter 搜索应先分为测试报价、真实 swap、Token 列表核验、Ultra 执行复核或 API/平台费集成，再引导用户打开官方路径。", "Jupiter 搜尋應先分為測試報價、真實 swap、Token 列表核驗、Ultra 執行複核或 API/平台費整合，再引導用戶打開官方路徑。"), "https://dev.jup.ag/docs/swap"),
    ],
    sources: [
      source("Jupiter Swap API", "https://dev.jup.ag/docs/swap"),
      source("Jupiter developer platform", "https://dev.jup.ag/docs/get-started"),
      source("Jupiter Ultra API", "https://dev.jup.ag/docs/ultra"),
      source("Jupiter Tokens API", "https://dev.jup.ag/docs/tokens"),
      source("Jupiter Support Hub", "https://support.jup.ag/"),
    ],
    tags: ["dex", "solana", "aggregator", "api"],
  }),
  raydium: makeRecord({
    summary: tr("Solana DEX profile combining AMM v4, CPMM, CLMM, farms, LaunchLab, perps references, SDK/API documentation, and program-address checks.", "Solana DEX；组合 AMM v4、CPMM、CLMM、Farm、LaunchLab、Perps 参考、SDK/API 文档和程序地址。", "Solana DEX；組合 AMM v4、CPMM、CLMM、Farm、LaunchLab、Perps 參考、SDK/API 文檔和程式地址。"),
    facts: [
      fact(tr("Documentation scope", "文档范围", "文檔範圍"), tr("Raydium docs cover AMM v4, CPMM, CLMM, Farm, LaunchLab, Perps, on-chain accounts, math, instructions, fees, SDK, and runnable code.", "Raydium 文档覆盖 AMM v4、CPMM、CLMM、Farm、LaunchLab、Perps、链上账户、数学、指令、费用、SDK 和可运行代码。", "Raydium 文檔覆蓋 AMM v4、CPMM、CLMM、Farm、LaunchLab、Perps、鏈上帳戶、數學、指令、費用、SDK 和可運行代碼。"), "https://docs.raydium.io/"),
      fact(tr("CLMM model", "CLMM 模型", "CLMM 模型"), tr("Raydium describes CLMM as concentrated-liquidity AMM adapted to Solana's account model, with LPs choosing a price range.", "Raydium 将 CLMM 描述为适配 Solana 账户模型的集中流动性 AMM，LP 可选择价格范围。", "Raydium 將 CLMM 描述為適配 Solana 帳戶模型的集中流動性 AMM，LP 可選擇價格範圍。"), "https://docs.raydium.io/products/clmm"),
    ],
    sources: [
      source("Raydium documentation", "https://docs.raydium.io/"),
      source("Raydium CLMM", "https://docs.raydium.io/products/clmm"),
    ],
    tags: ["dex", "solana", "amm", "clmm"],
  }),
  aerodrome: makeRecord({
    summary: tr("Base-native DEX profile focused on Base-only routing, standard and Slipstream liquidity, pool-level fee checks, voting incentives, veAERO rewards, and launcher liquidity constraints.", "Base 原生 DEX；重点是 Base-only 路由、标准池与 Slipstream 流动性、池级费用核验、投票激励、veAERO 奖励和启动流动性约束。", "Base 原生 DEX；重點是 Base-only 路由、標準池與 Slipstream 流動性、池級費用核驗、投票激勵、veAERO 獎勵和啟動流動性約束。"),
    facts: [
      fact(tr("Base liquidity hub", "Base 流动性枢纽", "Base 流動性樞紐"), tr("Aerodrome's docs describe it as the trading and liquidity hub of Base, so the route should be evaluated as a Base DEX path rather than a multi-chain exchange account.", "Aerodrome 文档将其描述为 Base 的交易与流动性枢纽，因此应把它作为 Base DEX 路径评估，而不是多链交易所账户。", "Aerodrome 文檔將其描述為 Base 的交易與流動性樞紐，因此應把它作為 Base DEX 路徑評估，而不是多鏈交易所帳戶。"), "https://aerodrome.finance/docs"),
      fact(tr("Pool fee boundary", "池费用边界", "池費用邊界"), tr("Aerodrome pool costs should be checked at pool level because standard pools and Slipstream concentrated-liquidity pools can expose different fee and incentive mechanics.", "Aerodrome 成本应在池级核验，因为标准池和 Slipstream 集中流动性池可能有不同费用与激励机制。", "Aerodrome 成本應在池級核驗，因為標準池和 Slipstream 集中流動性池可能有不同費用與激勵機制。"), "https://aerodrome.finance/docs"),
      fact(tr("Volume fee display", "成交费用展示", "成交費用展示"), tr("Aerodrome's public interface surfaces volume and fees at pool level, so comparison content should point users to the exact pool rather than quote a site-wide DEX fee.", "Aerodrome 公开界面按池展示成交量和费用，因此比较内容应引导用户核对具体池，而不是引用全站统一 DEX 费率。", "Aerodrome 公開介面按池展示成交量和費用，因此比較內容應引導用戶核對具體池，而不是引用全站統一 DEX 費率。"), "https://aerodrome.finance/"),
      fact(tr("Voting incentive flow", "投票激励流程", "投票激勵流程"), tr("Aerodrome documentation describes voting incentives as deposits that are processed as exchange revenue and paid to veAERO holders who vote for the pool.", "Aerodrome 文档说明投票激励会作为交易收入处理，并支付给为该池投票的 veAERO 持有人。", "Aerodrome 文檔說明投票激勵會作為交易收入處理，並支付給為該池投票的 veAERO 持有人。"), "https://aerodrome.finance/docs"),
      fact(tr("veAERO reward route", "veAERO 奖励路径", "veAERO 獎勵路徑"), tr("Aerodrome reward review should distinguish swap execution from veAERO voting and reward claims; a swap route alone does not create a reward entitlement.", "Aerodrome 奖励核验应区分 swap 执行、veAERO 投票和奖励领取；单次 swap 路由本身不产生奖励资格。", "Aerodrome 獎勵核驗應區分 swap 執行、veAERO 投票和獎勵領取；單次 swap 路由本身不產生獎勵資格。"), "https://aerodrome.finance/docs"),
      fact(tr("Base network boundary", "Base 网络边界", "Base 網路邊界"), tr("Aerodrome is a Base-native path, so users should verify bridge route, Base gas asset, wallet network, token contract, and pool address before moving funds.", "Aerodrome 是 Base 原生路径，用户转入资金前应核验跨链路径、Base gas 资产、钱包网络、代币合约和池地址。", "Aerodrome 是 Base 原生路徑，用戶轉入資金前應核驗跨鏈路徑、Base gas 資產、錢包網路、代幣合約和池地址。"), "https://aerodrome.finance/docs"),
      fact(tr("Launch liquidity", "启动流动性", "啟動流動性"), tr("Aero Launch documentation says launched and locked liquidity displays on the dashboard like other deposits and can accept additional liquidity.", "Aero Launch 文档说明已启动并锁定的流动性会像其他存款一样显示在仪表盘，并可追加流动性。", "Aero Launch 文檔說明已啟動並鎖定的流動性會像其他存款一樣顯示在儀表板，並可追加流動性。"), "https://aerodrome.finance/docs/launcher"),
      fact(tr("CTA boundary", "CTA 边界", "CTA 邊界"), tr("An Aerodrome CTA should send users to inspect the official Base pool, network, token contract, pool type, liquidity and incentive terms; it must not imply route safety, regional availability or reward entitlement.", "Aerodrome CTA 应引导用户核验官方 Base 池、网络、代币合约、池类型、流动性和激励条款；不得暗示路径安全、地区可用或奖励资格。", "Aerodrome CTA 應引導用戶核驗官方 Base 池、網路、代幣合約、池類型、流動性和激勵條款；不得暗示路徑安全、地區可用或獎勵資格。"), "https://aerodrome.finance/docs"),
    ],
    sources: [
      source("Aerodrome docs", "https://aerodrome.finance/docs"),
      source("Aero Launch", "https://aerodrome.finance/docs/launcher"),
      source("Aerodrome public app", "https://aerodrome.finance/"),
    ],
    tags: ["dex", "base", "liquidity", "incentives"],
  }),
  curve: makeRecord({
    summary: tr("Wallet-connected DEX profile known for pool-level AMM design, stable/cryptoswap pool mechanics, liquidity risk notes, and source-bound pool review.", "钱包连接型 DEX；重点是池级 AMM 设计、稳定币/加密资产池机制和流动性风险说明。", "錢包連接型 DEX；重點是池級 AMM 設計、穩定幣/加密資產池機制和流動性風險說明。"),
    facts: [
      fact(tr("Pool-risk framing", "池子风险框架", "池子風險框架"), tr("Curve's risk documentation discusses pool-level impermanent-loss behavior and separates Cryptoswap V2 mechanics from a generic DEX claim.", "Curve 风险文档讨论池级无常损失行为，并把 Cryptoswap V2 机制与泛化 DEX 说法分开。", "Curve 風險文檔討論池級無常損失行為，並把 Cryptoswap V2 機制與泛化 DEX 說法分開。"), "https://resources.curve.finance/user/security/risks/pools"),
      fact(tr("Oracle-linked liquidity", "预言机相关流动性", "預言機相關流動性"), tr("Curve describes Cryptoswap V2 pools as using an internal oracle to concentrate liquidity around the current market price.", "Curve 描述 Cryptoswap V2 池使用内部预言机，把流动性集中在当前市场价附近。", "Curve 描述 Cryptoswap V2 池使用內部預言機，把流動性集中在目前市場價附近。"), "https://resources.curve.finance/user/security/risks/pools"),
    ],
    sources: [source("Curve liquidity-pool risks", "https://resources.curve.finance/user/security/risks/pools")],
    tags: ["dex", "amm", "stable-swap", "liquidity"],
  }),
  hyperliquid: makeRecord({
    summary: tr("On-chain order-book venue profile covering HyperCore spot/perp order books, HyperEVM interaction boundaries, funding, fees, and builder-deployed perps.", "链上订单簿平台；覆盖 HyperCore 现货/永续订单簿、HyperEVM 交互边界、资金费率、费用和 builder-deployed perps。", "鏈上訂單簿平台；覆蓋 HyperCore 現貨/永續訂單簿、HyperEVM 互動邊界、資金費率、費用和 builder-deployed perps。"),
    facts: [
      fact(tr("Core architecture", "核心架构", "核心架構"), tr("Hyperliquid docs describe HyperCore as including fully on-chain perpetual futures and spot order books.", "Hyperliquid 文档说明 HyperCore 包含完全链上的永续合约和现货订单簿。", "Hyperliquid 文檔說明 HyperCore 包含完全鏈上的永續合約和現貨訂單簿。"), "https://hyperliquid.gitbook.io/hyperliquid-docs"),
      fact(tr("Builder-deployed perps", "Builder 部署永续", "Builder 部署永續"), tr("HIP-3 documentation says the protocol supports permissionless builder-deployed perpetuals.", "HIP-3 文档说明协议支持无需许可的 builder-deployed 永续合约。", "HIP-3 文檔說明協議支援無需許可的 builder-deployed 永續合約。"), "https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals"),
      fact(tr("Fee tier clock", "费用阶梯周期", "費用階梯週期"), tr("Hyperliquid fees documentation says fees are based on rolling 14 day volume, assessed at the end of each UTC day, with separate schedules for perps and spot; sub-account volume counts toward the master account fee tier while vault volume is treated separately.", "Hyperliquid 费用文档说明费用基于滚动 14 日成交量，并在 UTC 每日结束时评估；永续和现货采用不同费率表；子账户成交量计入主账户费率阶梯，金库成交量则与主账户分开处理。", "Hyperliquid 費用文檔說明費用基於滾動 14 日成交量，並在 UTC 每日結束時評估；永續和現貨採用不同費率表；子帳戶成交量計入主帳戶費率階梯，金庫成交量則與主帳戶分開處理。"), "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees"),
      fact(tr("Fee source map", "费用来源地图", "費用來源地圖"), tr("A Hyperliquid fees search should split cost evidence into four official lanes: the fee schedule for maker/taker tiers, funding docs for hourly peer-to-peer funding, contract specifications for market mechanics, and liquidation docs for maintenance-margin failure paths.", "Hyperliquid fees 查询应把成本证据拆成四条官方来源：费用表用于 maker/taker 阶梯，funding 文档用于每小时点对点资金费，contract specifications 用于市场机制，liquidation 文档用于维持保证金失败路径。", "Hyperliquid fees 查詢應把成本證據拆成四條官方來源：費用表用於 maker/taker 階梯，funding 文檔用於每小時點對點資金費，contract specifications 用於市場機制，liquidation 文檔用於維持保證金失敗路徑。"), "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees"),
      fact(tr("Funding payment", "资金费支付", "資金費支付"), tr("Hyperliquid funding docs say funding is peer-to-peer, collected by neither side of the venue, paid every hour, and based on the difference between the perpetual contract price and the spot oracle price.", "Hyperliquid 资金费文档说明资金费为点对点支付，平台不从资金费付款中收费；资金费每小时支付，并基于永续合约价格与现货预言机价格的差异。", "Hyperliquid 資金費文檔說明資金費為點對點支付，平台不從資金費付款中收費；資金費每小時支付，並基於永續合約價格與現貨預言機價格的差異。"), "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"),
      fact(tr("Funding and liquidation bundle", "资金费与清算组合", "資金費與清算組合"), tr("A Hyperliquid fees query should be read as a bundle: maker/taker schedule, hourly funding, margin mode and liquidation threshold can all change the position cost before PnL is known.", "Hyperliquid fees 查询应作为组合阅读：maker/taker 费率、每小时资金费、保证金模式和清算阈值都会在盈亏确定前影响持仓成本。", "Hyperliquid fees 查詢應作為組合閱讀：maker/taker 費率、每小時資金費、保證金模式和清算閾值都會在盈虧確定前影響持倉成本。"), "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations"),
      fact(tr("Fee decision checklist", "费用决策清单", "費用決策清單"), tr("Before placing a Hyperliquid perp order, compare the quoted maker/taker tier, expected hourly funding direction, margin mode, maintenance margin, liquidation path, bridge or USDC movement cost, and whether the order belongs to main account, sub-account or API wallet flow.", "下 Hyperliquid 永续订单前，应对照 maker/taker 阶梯、预期每小时资金费方向、保证金模式、维持保证金、清算路径、桥接或 USDC 移动成本，以及订单属于主账户、子账户还是 API wallet 流程。", "下 Hyperliquid 永續訂單前，應對照 maker/taker 階梯、預期每小時資金費方向、保證金模式、維持保證金、清算路徑、橋接或 USDC 移動成本，以及訂單屬於主帳戶、子帳戶還是 API wallet 流程。"), "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"),
      fact(tr("USDC funding route", "USDC 入金路径", "USDC 入金路徑"), tr("Hyperliquid USDC docs describe native Hyperliquid L1 USDC and point users to Circle's Arbitrum-to-HyperCore CCTP transfer documentation.", "Hyperliquid USDC 文档说明 Hyperliquid L1 原生 USDC，并指向 Circle 的 Arbitrum 到 HyperCore CCTP 转账文档。", "Hyperliquid USDC 文檔說明 Hyperliquid L1 原生 USDC，並指向 Circle 的 Arbitrum 到 HyperCore CCTP 轉帳文檔。"), "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc"),
      fact(tr("Wallet transfer boundary", "钱包转账边界", "錢包轉帳邊界"), tr("Hyperliquid exchange-endpoint docs separate signed trading actions from user-signed Core USDC transfers, so wallet movement cost and transfer signing should be checked separately from maker/taker fees and funding.", "Hyperliquid exchange endpoint 文档把已签名交易动作与用户签名的 Core USDC transfer 分开，因此钱包转账成本和转账签名应与 maker/taker 费用、资金费分开核验。", "Hyperliquid exchange endpoint 文檔把已簽名交易動作與用戶簽名的 Core USDC transfer 分開，因此錢包轉帳成本和轉帳簽名應與 maker/taker 費用、資金費分開核驗。"), "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint"),
      fact(tr("Liquidation threshold", "清算阈值", "清算閾值"), tr("Hyperliquid liquidation docs say liquidation begins when account equity falls below maintenance margin, which varies by asset and maximum leverage.", "Hyperliquid 清算文档说明，当账户权益低于维持保证金时会触发清算；维持保证金随资产和最高杠杆变化。", "Hyperliquid 清算文檔說明，當帳戶權益低於維持保證金時會觸發清算；維持保證金隨資產和最高槓桿變化。"), "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations"),
      fact(tr("Testnet faucet gate", "测试网水龙头门槛", "測試網水龍頭門檻"), tr("Hyperliquid testnet faucet docs say users need a mainnet deposit with the same address before receiving mock USDC for testnet use.", "Hyperliquid 测试网水龙头文档说明用户需先用同一地址完成主网入金，之后才可领取测试网 mock USDC。", "Hyperliquid 測試網水龍頭文檔說明用戶需先用同一地址完成主網入金，之後才可領取測試網 mock USDC。"), "https://hyperliquid.gitbook.io/hyperliquid-docs/onboarding/testnet-faucet"),
      fact(tr("Funded-account boundary", "Funded account 边界", "Funded account 邊界"), tr("A Hyperliquid funded-account search should be split into wallet funding, USDC collateral, account modes, sub-accounts and API-wallet delegation; the official docs do not turn that phrase into a guaranteed prop-account allocation.", "搜索 Hyperliquid funded account 时，应拆成钱包入金、USDC 抵押、账户模式、子账户与 API wallet 授权；官方文档不能把这个词自动解释为保证获得 prop account 资金分配。", "搜尋 Hyperliquid funded account 時，應拆成錢包入金、USDC 抵押、帳戶模式、子帳戶與 API wallet 授權；官方文檔不能把這個詞自動解釋為保證獲得 prop account 資金分配。"), "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes"),
      fact(tr("Funded-account source map", "Funded account 来源地图", "Funded account 來源地圖"), tr("For a Hyperliquid funded-account query, use USDC docs for funding the wallet, account-abstraction docs for collateral mode, sub-account docs for account separation, API-wallet docs for delegated signing, and vault docs for vault participation; none of those sources proves a third-party prop account allocation.", "处理 Hyperliquid funded account 查询时，用 USDC 文档核验钱包入金，用账户抽象文档核验抵押模式，用子账户文档核验账户隔离，用 API wallet 文档核验授权签名，用 vault 文档核验金库参与；这些来源都不能证明第三方 prop account 资金分配。", "處理 Hyperliquid funded account 查詢時，用 USDC 文檔核驗錢包入金，用帳戶抽象文檔核驗抵押模式，用子帳戶文檔核驗帳戶隔離，用 API wallet 文檔核驗授權簽名，用 vault 文檔核驗金庫參與；這些來源都不能證明第三方 prop account 資金分配。"), "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/vaults"),
      fact(tr("Funded-account ambiguity", "Funded account 歧义", "Funded account 歧義"), tr("When the query is 'Hyperliquid funded account', NexuAlpha should not collapse wallet collateral, sub-accounts, vault deposits and outside prop-firm language into one CTA; each meaning requires a different official source check.", "当查询是 Hyperliquid funded account 时，NexuAlpha 不应把钱包抵押、子账户、金库存款和外部 prop firm 语义合并成一个 CTA；每种含义都需要不同的官方来源核对。", "當查詢是 Hyperliquid funded account 時，NexuAlpha 不應把錢包抵押、子帳戶、金庫存款和外部 prop firm 語義合併成一個 CTA；每種含義都需要不同的官方來源核對。"), "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts"),
      fact(tr("Sub-account threshold", "子账户门槛", "子帳戶門檻"), tr("Hyperliquid sub-account docs say up to 10 sub-accounts can be created only after reaching $100,000 in volume, and referral discounts do not apply to sub-accounts.", "Hyperliquid 子账户文档说明达到 100,000 美元成交量后最多可创建 10 个子账户，且推荐折扣不适用于子账户。", "Hyperliquid 子帳戶文檔說明達到 100,000 美元成交量後最多可建立 10 個子帳戶，且推薦折扣不適用於子帳戶。"), "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts"),
      fact(tr("API wallet signing", "API 钱包签名", "API 錢包簽名"), tr("Hyperliquid API wallet docs say API wallets sign on behalf of a master account or sub-account, but account data queries must use the actual account address, not the agent wallet.", "Hyperliquid API 钱包文档说明 API 钱包可代表主账户或子账户签名，但查询账户数据必须使用真实账户地址，而不是 agent wallet。", "Hyperliquid API 錢包文檔說明 API 錢包可代表主帳戶或子帳戶簽名，但查詢帳戶資料必須使用真實帳戶地址，而不是 agent wallet。"), "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets"),
      fact(tr("Account mode collateral", "账户模式抵押品", "帳戶模式抵押品"), tr("Hyperliquid account-abstraction docs separate unified, portfolio margin and manual/standard modes, which determine how spot and perps balances interact and whether assets are used as perps collateral.", "Hyperliquid 账户抽象文档区分统一账户、组合保证金和手动/标准模式，这些模式决定现货与永续余额如何交互，以及资产是否用于永续抵押。", "Hyperliquid 帳戶抽象文檔區分統一帳戶、組合保證金和手動/標準模式，這些模式決定現貨與永續餘額如何互動，以及資產是否用於永續抵押。"), "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes"),
      fact(tr("Weighted fee tier", "加权费用阶梯", "加權費用階梯"), tr("Hyperliquid combines perp and spot volume into one fee tier, with spot volume counting double in the published 14-day weighted-volume formula; the applicable maker or taker rate still depends on the current official tier and asset context.", "Hyperliquid 把永续与现货成交量合并用于同一费用阶梯，官方 14 日加权成交量公式中现货成交量按两倍计入；实际 maker 或 taker 费率仍取决于当前官方阶梯和资产条件。", "Hyperliquid 把永續與現貨成交量合併用於同一費用階梯，官方 14 日加權成交量公式中現貨成交量按兩倍計入；實際 maker 或 taker 費率仍取決於目前官方階梯和資產條件。"), "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees"),
      fact(tr("HIP-3 fee boundary", "HIP-3 费用边界", "HIP-3 費用邊界"), tr("HIP-3 perpetuals share the user's fee tier, but growth mode and deployer-configured fee shares can change all-in fees, rebates and volume contribution. Users should verify the specific HIP-3 market instead of applying one protocol-wide perp rate.", "HIP-3 永续合约共用用户的费用阶梯，但 growth mode 与部署方配置的费率分成会改变综合费用、返还和成交量贡献；用户应核验具体 HIP-3 市场，不能套用一个全协议统一的永续费率。", "HIP-3 永續合約共用用戶的費用階梯，但 growth mode 與部署方配置的費率分成會改變綜合費用、返還和成交量貢獻；用戶應核驗具體 HIP-3 市場，不能套用一個全協議統一的永續費率。"), "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees"),
    ],
    sources: [
      source("Hyperliquid docs", "https://hyperliquid.gitbook.io/hyperliquid-docs"),
      source("HIP-3 builder-deployed perpetuals", "https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals"),
      source("Hyperliquid fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees"),
      source("Hyperliquid funding", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"),
      source("Hyperliquid USDC", "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc"),
      source("Hyperliquid exchange endpoint", "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint"),
      source("Hyperliquid liquidations", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations"),
      source("Hyperliquid testnet faucet", "https://hyperliquid.gitbook.io/hyperliquid-docs/onboarding/testnet-faucet"),
      source("Hyperliquid sub-accounts", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts"),
      source("Hyperliquid API wallets", "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets"),
      source("Hyperliquid account abstraction modes", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes"),
      source("Hyperliquid vaults", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/vaults"),
    ],
    tags: ["perp-dex", "order-book", "on-chain", "hypercore"],
  }),
  dydx: makeRecord({
    summary: tr("On-chain perpetuals profile centered on dYdX Chain v4, in-memory order books, validator block proposal, indexer APIs, oracle prices, funding, and liquidations.", "链上永续档案；核心是 dYdX Chain v4、内存订单簿、验证者出块、Indexer API、预言机价格、资金费率和清算。", "鏈上永續檔案；核心是 dYdX Chain v4、內存訂單簿、驗證者出塊、Indexer API、預言機價格、資金費率和清算。"),
    facts: [
      fact(tr("Order-book architecture", "订单簿架构", "訂單簿架構"), tr("dYdX docs say each v4 full node maintains an in-memory order book and validators propose matched trades into blocks.", "dYdX 文档说明 v4 每个全节点维护内存订单簿，验证者把撮合交易提议进区块。", "dYdX 文檔說明 v4 每個全節點維護內存訂單簿，驗證者把撮合交易提議進區塊。"), "https://docs.dydx.xyz/concepts/onboarding-faqs"),
      fact(tr("Funding mechanism", "资金费率机制", "資金費率機制"), tr("dYdX funding docs state funding rates are used to keep perpetual market prices close to oracle prices.", "dYdX 资金费率文档说明资金费率用于让永续市场价格接近预言机价格。", "dYdX 資金費率文檔說明資金費率用於讓永續市場價格接近預言機價格。"), "https://docs.dydx.xyz/concepts/trading/funding"),
    ],
    sources: [
      source("dYdX onboarding FAQs", "https://docs.dydx.xyz/concepts/onboarding-faqs"),
      source("dYdX funding", "https://docs.dydx.xyz/concepts/trading/funding"),
    ],
    tags: ["perp-dex", "order-book", "funding", "oracle"],
  }),
  gmx: makeRecord({
    summary: tr("Wallet-connected perpetuals and swaps profile powered by GM/GLV liquidity pools, oracle pricing, order-management docs, liquidation mechanics, and API/SDK reads.", "钱包连接型永续与 swap；由 GM/GLV 流动性池、预言机定价、订单管理文档、清算机制和 API/SDK 读取支持。", "錢包連接型永續與 swap；由 GM/GLV 流動性池、預言機定價、訂單管理文檔、清算機制和 API/SDK 讀取支援。"),
    facts: [
      fact(tr("Liquidity model", "流动性模型", "流動性模型"), tr("GMX docs say trading is powered by GM and GLV liquidity pools and routes orders against those pools.", "GMX 文档说明交易由 GM 与 GLV 流动性池支持，并将订单路由到这些池。", "GMX 文檔說明交易由 GM 與 GLV 流動性池支援，並將訂單路由到這些池。"), "https://docs.gmx.io/docs/intro/"),
      fact(tr("Pricing model", "定价模型", "定價模型"), tr("GMX order docs state the protocol uses oracle-based pricing rather than an order-book model.", "GMX 订单文档说明协议使用预言机定价，而不是订单簿模型。", "GMX 訂單文檔說明協議使用預言機定價，而不是訂單簿模型。"), "https://docs.gmx.io/docs/trading/order-types/"),
    ],
    sources: [
      source("GMX introduction", "https://docs.gmx.io/docs/intro/"),
      source("GMX positions and order types", "https://docs.gmx.io/docs/trading/order-types/"),
    ],
    tags: ["perp-dex", "liquidity-pools", "oracle", "swaps"],
  }),
  drift: makeRecord({
    summary: tr("Solana trading venue profile with Drift-owned pages for exchange positioning and updates; redirected protocol docs should be treated as a source-bound migration caution.", "Solana 交易场所；Drift 自有页面可用于交易所定位和更新，重定向后的协议文档只能作为有来源的迁移提示。", "Solana 交易場所；Drift 自有頁面可用於交易所定位和更新，重定向後的協議文檔只能作為有來源的遷移提示。"),
    facts: [
      fact(tr("Product map", "产品范围", "產品範圍"), tr("Drift's own website positions the product around Solana trading, market data, points, stats, staking, governance, and developer entry points.", "Drift 自有网站把产品入口放在 Solana 交易、行情数据、积分、统计、质押、治理和开发者入口上。", "Drift 自有網站把產品入口放在 Solana 交易、行情數據、積分、統計、質押、治理和開發者入口上。"), "https://www.drift.trade/"),
      fact(tr("Documentation redirect", "文档重定向", "文檔重定向"), tr("The Drift updates page links to docs.drift.trade, but that documentation path currently resolves to Velocity-branded docs; do not restate those protocol mechanics as Drift facts without a migration note.", "Drift 更新页链接到 docs.drift.trade，但该文档路径当前解析到 Velocity 品牌文档；没有迁移说明时，不应把其中协议机制改写成 Drift 事实。", "Drift 更新頁連結到 docs.drift.trade，但該文檔路徑目前解析到 Velocity 品牌文檔；沒有遷移說明時，不應把其中協議機制改寫成 Drift 事實。"), "https://www.drift.trade/updates"),
    ],
    sources: [
      source("Drift", "https://www.drift.trade/"),
      source("Drift updates", "https://www.drift.trade/updates"),
    ],
    tags: ["perp-dex", "solana", "updates", "documentation-caution"],
  }),
};

const stableId = (slug, label) => `${slug}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

// Keep the established Uniswap decision-source indexes stable while appending
// newly reviewed facts. Other consumers cite these facts by their stable IDs.
const uniswapEstablishedFactLabels = [
  "AMM model",
  "Version architecture",
  "Swap fee tiers",
  "Dynamic fee boundary",
  "Wallet route test",
  "Hook test environment",
  "Official app and docs boundary",
  "Testnet research boundary",
  "Testnet to production handoff",
  "Pool and token contract boundary",
  "Wallet authorization boundary",
  "Approval spender check",
  "Deployment address check",
  "Deployment feed",
  "Uniswap source map",
  "Production route checklist",
  "Gas and transaction preview boundary",
  "Protocol fee boundary",
];

const orderedFactsForSlug = (slug, facts) => {
  if (slug !== "uniswap") return facts;
  const establishedOrder = new Map(uniswapEstablishedFactLabels.map((label, index) => [label, index]));
  return [...facts].sort((left, right) => {
    const leftIndex = establishedOrder.get(left.label.en);
    const rightIndex = establishedOrder.get(right.label.en);
    if (leftIndex === undefined && rightIndex === undefined) return 0;
    if (leftIndex === undefined) return 1;
    if (rightIndex === undefined) return -1;
    return leftIndex - rightIndex;
  });
};

export const exchangeResearch = Object.fromEntries(Object.entries(rawExchangeResearch).map(([slug, record]) => [
  slug,
  {
    ...record,
    facts: orderedFactsForSlug(slug, record.facts).map((item) => ({
      id: stableId(slug, item.label.en),
      ...item,
    })),
  },
]));

export function researchForVenue(slug, locale = "en") {
  const record = exchangeResearch[slug];
  if (!record) return null;
  const contentLocale = record.summary[locale] ? locale : "en";
  return {
    slug,
    contentLocale,
    summary: record.summary[contentLocale],
    facts: record.facts.map((item) => ({
      id: item.id,
      axis: item.axis,
      label: item.label[contentLocale] ?? item.label.en,
      value: item.value[contentLocale] ?? item.value.en,
      sourceUrl: item.sourceUrl,
    })),
    sources: record.sources,
    checkedAt: record.checkedAt,
    tags: record.tags,
  };
}

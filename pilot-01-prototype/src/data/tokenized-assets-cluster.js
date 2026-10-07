export const TOKENIZED_ASSET_CLUSTER_REVIEW_DATE = "2026-09-15";

export const TOKENIZED_ASSET_LOCALES = ["en", "zh-Hans"];

export const TOKENIZED_ASSET_SOURCE_URLS = Object.freeze({
  secTokenizationStatement: "https://www.sec.gov/newsroom/speeches-statements/peirce-tokenization-070925",
  securitizeBuidl: "https://securitize.io/",
  ondoDocs: "https://docs.ondo.finance/",
  franklinBenji: "https://digitalassets.franklintempleton.com/",
  coinbaseStockPerps: "https://www.coinbase.com/blog/coinbase-launches-stock-perpetual-futures",
  coinbaseTokenize: "https://www.coinbase.com/blog/system-update-the-future-of-finance-is-on-coinbase",
});

const sources = [
  {
    id: "sec-tokenization",
    name: "SEC tokenization statement",
    url: TOKENIZED_ASSET_SOURCE_URLS.secTokenizationStatement,
    role: {
      en: "Regulatory framing for securities tokenization; technology does not remove securities-law analysis.",
      "zh-Hans": "证券代币化的监管边界；技术形式不会替代证券法判断。",
    },
  },
  {
    id: "buidl-securitize",
    name: "BlackRock BUIDL via Securitize",
    url: TOKENIZED_ASSET_SOURCE_URLS.securitizeBuidl,
    role: {
      en: "Issuer and transfer-agent route for a public-chain tokenized fund reference.",
      "zh-Hans": "公链代币化基金的发行与登记路径参考。",
    },
  },
  {
    id: "ondo-docs",
    name: "Ondo Finance documentation",
    url: TOKENIZED_ASSET_SOURCE_URLS.ondoDocs,
    role: {
      en: "Product documentation for OUSG, USDY and tokenized stock access boundaries.",
      "zh-Hans": "OUSG、USDY 与股票代币化访问边界的产品文档。",
    },
  },
  {
    id: "franklin-benji",
    name: "Franklin Templeton Digital Assets",
    url: TOKENIZED_ASSET_SOURCE_URLS.franklinBenji,
    role: {
      en: "First-party BENJI and blockchain-powered fund recordkeeping context.",
      "zh-Hans": "BENJI 与链上基金登记的第一方信息。",
    },
  },
  {
    id: "coinbase-stock-perps",
    name: "Coinbase stock perpetual futures",
    url: TOKENIZED_ASSET_SOURCE_URLS.coinbaseStockPerps,
    role: {
      en: "First-party description of stock perpetual futures for eligible non-US users.",
      "zh-Hans": "Coinbase 面向合资格非美国用户的股票永续合约说明。",
    },
  },
  {
    id: "coinbase-tokenize",
    name: "Coinbase Tokenize plan",
    url: TOKENIZED_ASSET_SOURCE_URLS.coinbaseTokenize,
    role: {
      en: "First-party direction for institutional real-world asset tokenization infrastructure.",
      "zh-Hans": "机构 RWA 代币化基础设施方向的第一方说明。",
    },
  },
];

export const TOKENIZED_ASSET_PAGES = Object.freeze({
  "tokenized-assets": {
    slug: "tokenized-assets",
    parent: null,
    path: "/topics/tokenized-assets",
    type: "parent",
    title: {
      en: "Tokenized Assets Research Hub: Treasuries, Stocks and Perpetual Exposure",
      "zh-Hans": "代币化资产研究中心：美债、股票与永续合约敞口",
    },
    metaTitle: {
      en: "Tokenized Assets Research Hub: Treasuries, Stocks and Perps — NexuAlpha",
      "zh-Hans": "代币化资产研究中心：美债、股票与永续合约 — NexuAlpha",
    },
    description: {
      en: "A source-bound map for tokenized Treasuries, tokenized stock access and stock perpetuals. Start with legal form, custody, redemption, venue access and product eligibility before using any registration path.",
      "zh-Hans": "来源绑定的代币化资产地图，覆盖代币化美债、股票代币化访问与股票永续合约。注册前先核对法律形态、托管、赎回、平台准入和产品资格。",
    },
    directAnswer: {
      en: "Tokenized assets should be compared by what the token represents, who holds the underlying asset, how redemption works, which users are eligible, and whether the product is a security, fund share, note, derivative or synthetic exposure. NexuAlpha should not send a user straight to signup until those five checks are visible.",
      "zh-Hans": "判断代币化资产，先看它代表什么资产、底层资产由谁托管、赎回如何发生、哪些用户有资格访问，以及它属于证券、基金份额、票据、衍生品还是合成敞口。NexuAlpha 不应在这五项信息缺失时直接推动用户注册。",
    },
    nextAction: {
      label: {
        en: "Start with the tokenized Treasury checklist",
        "zh-Hans": "先打开代币化美债核对清单",
      },
      href: "/topics/tokenized-treasuries",
    },
    decisionRows: [
      {
        label: { en: "Tokenized Treasuries", "zh-Hans": "代币化美债" },
        bestFor: { en: "Cash-management research, collateral routes, fund share records", "zh-Hans": "现金管理研究、抵押品路径、基金份额登记" },
        verify: { en: "Issuer, transfer agent, eligibility, redemption window, chain coverage", "zh-Hans": "发行方、登记/转让代理、资格、赎回窗口、支持链" },
        route: "/topics/tokenized-treasuries",
      },
      {
        label: { en: "Tokenized Stocks", "zh-Hans": "股票代币化" },
        bestFor: { en: "Equity-like exposure where actual security entitlement must be checked", "zh-Hans": "类似股票的敞口，但必须核对真实证券权益" },
        verify: { en: "Broker or issuer model, shareholder rights, region, settlement and custody", "zh-Hans": "券商/发行模型、股东权利、地区、结算和托管" },
        route: "/topics/tokenized-stocks-vs-perpetuals",
      },
      {
        label: { en: "Stock Perpetuals", "zh-Hans": "股票永续合约" },
        bestFor: { en: "Leveraged synthetic exposure without owning the underlying stock", "zh-Hans": "不持有底层股票的杠杆合成敞口" },
        verify: { en: "Eligible jurisdiction, funding, liquidation, index source and platform rules", "zh-Hans": "合资格地区、资金费率、强平、指数来源和平台规则" },
        route: "/topics/tokenized-stocks-vs-perpetuals",
      },
    ],
    faqs: [
      {
        q: {
          en: "What is the first question before choosing a tokenized asset platform?",
          "zh-Hans": "选择代币化资产平台前，第一个问题是什么？",
        },
        a: {
          en: "Ask what the token legally represents. A fund share, note, security entitlement, derivative and synthetic perpetual can all look similar in a trading interface, but custody, redemption, investor rights and regional eligibility are different.",
          "zh-Hans": "先问这个代币在法律上代表什么。基金份额、票据、证券权益、衍生品和合成永续在交易界面上可能很像，但托管、赎回、投资者权利和地区资格完全不同。",
        },
      },
      {
        q: {
          en: "Can NexuAlpha recommend one venue for every tokenized asset user?",
          "zh-Hans": "NexuAlpha 能给所有代币化资产用户推荐同一个平台吗？",
        },
        a: {
          en: "No. The useful route depends on residence, investor status, product type, custody preference and whether the user wants cash-like exposure, stock-like exposure or leveraged derivative exposure.",
          "zh-Hans": "不能。合适路径取决于居住地、投资者身份、产品类型、托管偏好，以及用户想要现金类敞口、股票类敞口还是杠杆衍生品敞口。",
        },
      },
      {
        q: {
          en: "Why does this page link to Factbook and custody research before CTA?",
          "zh-Hans": "为什么这个页面在 CTA 前先链接事实库和托管研究？",
        },
        a: {
          en: "Tokenized assets are decision-heavy products. Factbook pages help verify venue identity, product scope and official-domain routing before a user leaves NexuAlpha for an account flow.",
          "zh-Hans": "代币化资产属于高决策成本产品。事实库页面先帮助用户核对平台身份、产品范围和官方域名，再决定是否离开 NexuAlpha 进入开户流程。",
        },
      },
      {
        q: {
          en: "Where should a tokenized Treasury search continue from the hub?",
          "zh-Hans": "从研究中心继续核对代币化美债时应去哪里？",
        },
        a: {
          en: "Use the tokenized Treasuries topic for the ongoing issuer, recordkeeper, custodian and redemption checklist, then use the dated news explainer for the source trail behind BUIDL, BENJI, OUSG-style exposure and access-risk terms.",
          "zh-Hans": "先用代币化美债主题页持续核对发行方、登记方、托管方与赎回清单，再用带日期的新闻解释页查看 BUIDL、BENJI、OUSG 类敞口与准入风险的来源链。",
        },
      },
    ],
    relatedLinks: ["/topics/tokenized-treasuries", "/news/tokenized-treasuries-structure-access-risks", "/topics/tokenized-stocks-vs-perpetuals", "/factbook/coinbase", "/factbook/kraken", "/methodology"],
    sources: ["sec-tokenization", "buidl-securitize", "ondo-docs", "franklin-benji", "coinbase-stock-perps", "coinbase-tokenize"],
  },
  "tokenized-treasuries": {
    slug: "tokenized-treasuries",
    parent: "tokenized-assets",
    path: "/topics/tokenized-treasuries",
    type: "child",
    title: {
      en: "Tokenized Treasuries Checklist: Issuer, Custody, Redemption and Eligibility",
      "zh-Hans": "代币化美债核对清单：发行方、托管、赎回与资格",
    },
    metaTitle: {
      en: "Tokenized Treasuries Checklist: BUIDL, OUSG, BENJI — NexuAlpha",
      "zh-Hans": "代币化美债核对清单：BUIDL、OUSG、BENJI — NexuAlpha",
    },
    description: {
      en: "Compare tokenized Treasury products by issuer, legal wrapper, official recordkeeper, custodian, investor eligibility, redemption process, transfer controls, permitted chains and collateral treatment before treating yield-bearing tokens as cash equivalents.",
      "zh-Hans": "按发行方、法律载体、官方登记方、托管方、投资者资格、赎回流程、转让限制、许可链和抵押品处理比较代币化美债产品，不把收益型代币简单当作现金等价物。",
    },
    directAnswer: {
      en: "Tokenized Treasuries are Treasury-linked fund shares, notes or recordkeeping tokens represented on-chain; they are not automatically the same as directly holding Treasury bills. BUIDL-style fund shares, OUSG-style Treasury exposure and BENJI-style blockchain recordkeeping need separate checks for legal wrapper, investor eligibility, official recordkeeper, custodian, redemption window, permitted chains, margin haircut and platform failure path.",
      "zh-Hans": "代币化美债不是单一产品。BUIDL 类基金份额、OUSG 类美债敞口和 BENJI 类链上登记，需要分别核对法律载体、投资者资格、转让代理记录、赎回窗口、允许使用的链、抵押折扣以及托管方或平台不可用时的处理路径。",
    },
    nextAction: {
      label: {
        en: "Open the dated source explainer",
        "zh-Hans": "打开带日期的来源解读",
      },
      href: "/news/tokenized-treasuries-structure-access-risks",
    },
    decisionRows: [
      {
        label: { en: "Issuer and legal wrapper", "zh-Hans": "发行方与法律载体" },
        bestFor: { en: "Determining whether the token is a fund share, note or platform claim", "zh-Hans": "判断代币是基金份额、票据还是平台债权" },
        verify: { en: "Offering documents, transfer agent, distribution limits", "zh-Hans": "发行文件、转让代理、分销限制" },
      },
      {
        label: { en: "Redemption path", "zh-Hans": "赎回路径" },
        bestFor: { en: "Understanding whether liquidity is issuer redemption, secondary transfer or DEX liquidity", "zh-Hans": "区分流动性来自发行方赎回、二级转让还是 DEX 池" },
        verify: { en: "Cutoff time, settlement, minimum size and account approval", "zh-Hans": "截止时间、结算、最低金额和账户审批" },
      },
      {
        label: { en: "Recordkeeper and official register", "zh-Hans": "登记方与官方记录" },
        bestFor: { en: "Separating wallet display from the legal ownership or fund-share record", "zh-Hans": "区分钱包显示与法律所有权或基金份额记录" },
        verify: { en: "Transfer agent, registrar, fund documents, token-address page and account statement", "zh-Hans": "转让代理、登记方、基金文件、官方 token 地址页和账户记录" },
      },
      {
        label: { en: "Custody and chain support", "zh-Hans": "托管与支持链" },
        bestFor: { en: "Checking operational risk before using tokenized funds as collateral", "zh-Hans": "作为抵押品使用前核对操作风险" },
        verify: { en: "Wallet whitelist, chain list, freeze controls and custodian role", "zh-Hans": "钱包白名单、支持链、冻结控制和托管方角色" },
      },
    ],
    faqs: [
      {
        q: { en: "Are tokenized Treasuries the same as holding Treasury bills directly?", "zh-Hans": "代币化美债等于直接持有美国国债吗？" },
        a: { en: "No. The user usually holds a tokenized claim, fund share, note or recordkeeping token governed by product documents. Direct Treasury ownership, fund shares and tokenized notes have different rights and redemption paths.", "zh-Hans": "不是。用户通常持有受产品文件约束的代币化权益、基金份额、票据或登记代币。直接持有国债、持有基金份额和持有代币化票据的权利与赎回路径不同。" },
      },
      {
        q: { en: "What should be verified before using a tokenized Treasury product as collateral?", "zh-Hans": "把代币化美债作为抵押品前要核对什么？" },
        a: { en: "Verify issuer approval, wallet eligibility, permitted chains, transfer restrictions, valuation method, margin haircut, redemption timing and what happens if the platform, custodian or chain is unavailable.", "zh-Hans": "要核对发行方审批、钱包资格、允许链、转让限制、估值方式、抵押折扣、赎回时间，以及平台、托管方或链不可用时的处理方式。" },
      },
      {
        q: { en: "Which sources should come before comparing tokenized Treasury yield?", "zh-Hans": "比较代币化美债收益前应先看哪些来源？" },
        a: { en: "Open the issuer or fund page, SEC or offering record, transfer-agent or recordkeeper source, official token-address list, redemption terms and account-eligibility screen before comparing yield, fees or collateral usefulness.", "zh-Hans": "先打开发行方或基金页面、SEC 或发行文件、转让代理或登记方来源、官方 token 地址列表、赎回条款和账户资格页面，再比较收益、费用或抵押用途。" },
      },
      {
        q: { en: "Are BUIDL and BENJI the same kind of tokenized Treasury exposure?", "zh-Hans": "BUIDL 和 BENJI 是同一种代币化美债敞口吗？" },
        a: { en: "No. They should be reviewed as separate issuer, fund, recordkeeper, eligibility and redemption structures. Similar wallet or token interfaces do not prove the same holder rights, transfer controls, chain support or account route.", "zh-Hans": "不是。它们应按发行方、基金、登记方、资格和赎回结构分别核验。钱包或 token 界面相似，并不能证明持有人权利、转让控制、支持链或账户路径相同。" },
      },
      {
        q: { en: "Should a tokenized Treasury query land on the article or the topic checklist?", "zh-Hans": "代币化美债查询应该看文章还是主题清单？" },
        a: { en: "Use the article for a dated source-reading explainer and use this topic page for the evergreen checklist. The article preserves the source trail; the topic page keeps issuer, recordkeeper, custody, redemption, chain and collateral checks grouped for comparison.", "zh-Hans": "文章用于带日期的来源解读，主题页用于长期清单。文章保留来源链，主题页把发行方、登记方、托管、赎回、支持链与抵押检查集中在一起便于比较。" },
      },
    ],
    relatedLinks: ["/topics/tokenized-assets", "/news/tokenized-treasuries-structure-access-risks", "/topics/tokenized-stocks-vs-perpetuals", "/factbook/coinbase", "/factbook/kraken", "/methodology"],
    sources: ["buidl-securitize", "ondo-docs", "franklin-benji", "sec-tokenization"],
  },
  "tokenized-stocks-vs-perpetuals": {
    slug: "tokenized-stocks-vs-perpetuals",
    parent: "tokenized-assets",
    path: "/topics/tokenized-stocks-vs-perpetuals",
    type: "child",
    title: {
      en: "Stock Tokenization Exposure Checklist: Rights, Perps and Venue Access",
      "zh-Hans": "股票代币化 vs 股票永续：所有权、合成敞口与强平风险",
    },
    metaTitle: {
      en: "Tokenized Stocks vs Stock Perps: Rights and Liquidation — NexuAlpha",
      "zh-Hans": "股票代币化 vs 股票永续：权益与风险核对 — NexuAlpha",
    },
    description: {
      en: "Compare tokenized stock entitlement claims with stock perpetual derivatives by ownership rights, custody, dividends, funding, margin, liquidation, regional eligibility and venue access.",
      "zh-Hans": "区分股票代币化权益和股票永续合约。选择平台前，先比较股东权利、托管、合资格地区、资金费率、杠杆、强平和指数构成。",
    },
    directAnswer: {
      en: "A tokenized stock may represent an issuer or broker entitlement linked to equity; a stock perpetual is a derivative with funding, margin and liquidation risk. Verify the legal claim before comparing price exposure.",
      "zh-Hans": "股票代币化和股票永续是两种不同决策。股票代币化可能映射到底层证券或权益；股票永续则是跟踪价格敞口的衍生品，并叠加强制平仓、保证金和资金费率风险。",
    },
    nextAction: {
      label: {
        en: "Compare Bybit vs Bitget product routes",
        "zh-Hans": "比较 Bybit vs Bitget 产品路径",
      },
      href: "/compare/bybit-vs-bitget",
    },
    decisionRows: [
      {
        label: { en: "Ownership or entitlement", "zh-Hans": "所有权或权益" },
        bestFor: { en: "Tokenized stock models", "zh-Hans": "股票代币化模型" },
        verify: { en: "Underlying share custody, shareholder rights, dividends, transfer restrictions", "zh-Hans": "底层股票托管、股东权利、股息、转让限制" },
      },
      {
        label: { en: "Synthetic price exposure", "zh-Hans": "合成价格敞口" },
        bestFor: { en: "Stock perpetual futures", "zh-Hans": "股票永续合约" },
        verify: { en: "Index source, funding interval, leverage, liquidation and eligible markets", "zh-Hans": "指数来源、资金费率周期、杠杆、强平和合资格市场" },
      },
      {
        label: { en: "CTA routing", "zh-Hans": "CTA 路由" },
        bestFor: { en: "Conversion pages", "zh-Hans": "转化页面" },
        verify: { en: "User's region and product access before showing a signup-forwarding path", "zh-Hans": "展示开户注册路径前，先核对用户地区和产品权限" },
      },
    ],
    faqs: [
      {
        q: { en: "Does a stock perpetual give me shareholder rights?", "zh-Hans": "股票永续会给我股东权利吗？" },
        a: { en: "No. A perpetual future gives derivative price exposure under the platform's contract rules. It does not normally create voting rights, share custody, dividend rights or a direct claim on the underlying stock.", "zh-Hans": "不会。永续合约只是在平台合约规则下提供衍生品价格敞口，通常不产生投票权、股票托管权、股息权或对底层股票的直接权利。" },
      },
      {
        q: { en: "When should NexuAlpha route users to a Factbook page instead of a signup CTA?", "zh-Hans": "什么时候 NexuAlpha 应该先导向事实库，而不是直接开户注册 CTA？" },
        a: { en: "Route to Factbook first when product eligibility, derivative status, custody model or regional access is uncertain. The CTA can appear after official-domain, KYC and product-scope checks are visible.", "zh-Hans": "当产品资格、衍生品属性、托管模型或地区准入不明确时，应先导向事实库。只有官方域名、KYC 和产品范围检查可见后，才适合展示 CTA。" },
      },
    ],
    relatedLinks: ["/topics/tokenized-assets", "/compare/bybit-vs-bitget", "/factbook/coinbase", "/factbook/bybit", "/factbook/bitget"],
    sources: ["coinbase-stock-perps", "coinbase-tokenize", "sec-tokenization"],
  },
});

export const TOKENIZED_ASSET_SLUGS = Object.keys(TOKENIZED_ASSET_PAGES);

export function tokenizedAssetPage(slug = "tokenized-assets") {
  return TOKENIZED_ASSET_PAGES[slug] || null;
}

export function tokenizedAssetSources(page) {
  const ids = page?.sources || [];
  return ids.map((id) => sources.find((source) => source.id === id)).filter(Boolean);
}

export function tokenizedAssetLocale(locale) {
  return TOKENIZED_ASSET_LOCALES.includes(locale) ? locale : "en";
}

export function tokenizedAssetLocalized(value, locale) {
  if (!value || typeof value !== "object") return value;
  const resolved = tokenizedAssetLocale(locale);
  return value[resolved] || value.en || value["zh-Hans"] || "";
}

const supportedLocales = new Set(["en", "zh-Hans", "zh-Hant", "es"]);

const normalizePriorityLocale = (locale = "en") => {
  const raw = String(locale || "en");
  const lower = raw.toLowerCase();
  if (raw === "zh-Hant" || lower.startsWith("zh-tw") || lower.startsWith("zh-hk") || lower.startsWith("zh-mo")) return "zh-Hant";
  if (raw === "zh-Hans" || lower.startsWith("zh-cn") || lower.startsWith("zh-sg") || lower === "zh") return "zh-Hans";
  if (lower === "en" || lower.startsWith("en-")) return "en";
  if (lower === "es" || lower.startsWith("es-")) return "es";
  return null;
};

const official = (label, href) => [label, href];
const internal = (label, href) => [label, href];
const faq = (question, answer, sourceUrls = []) => [question, answer, sourceUrls];

export const priorityVenueAnswerSlugs = ["hyperliquid", "uniswap", "gmx", "drift", "deribit"];

const ownerQuestionByVenue = {
  hyperliquid: {
    en: "Should you use Hyperliquid after checking fees, funding, collateral and liquidation?",
    "zh-Hans": "核对费率、资金费、抵押资产和清算后，Hyperliquid 是否适合你？",
    "zh-Hant": "核對費率、資金費、抵押資產和清算後，Hyperliquid 是否適合你？",
  },
  uniswap: {
    en: "Should you use Uniswap after checking chain, token contract, approval and wallet preview?",
    "zh-Hans": "核对链、代币合约、授权和钱包预览后，Uniswap 是否适合这笔 swap？",
    "zh-Hant": "核對鏈、代幣合約、授權和錢包預覽後，Uniswap 是否適合這筆 swap？",
  },
  gmx: {
    en: "Should you use GMX after checking pool liquidity, collateral, fees and liquidation risk?",
    "zh-Hans": "核对资金池流动性、抵押资产、费用和清算风险后，GMX 是否适合你？",
    "zh-Hant": "核對資金池流動性、抵押資產、費用和清算風險後，GMX 是否適合你？",
  },
  drift: {
    en: "Should you open Drift after checking its current site, updates and documentation route?",
    "zh-Hans": "核对 Drift 当前官网、更新公告和文档路径后，是否还应该继续？",
    "zh-Hant": "核對 Drift 目前官網、更新公告和文件路徑後，是否還應該繼續？",
  },
  deribit: {
    // Striking distance (GSC 2026-10-18: "deribit fees" ~34, "deribit mark price" ~32): the H1 opens with the query.
    en: "Deribit fees: perpetuals, options, margin and liquidation rules",
    "zh-Hans": "Deribit 手续费：永续、期权、保证金与清算规则",
    "zh-Hant": "核對產品、保證金、API 和清算邊界後，Deribit 是否適合你？",
  },
};

const primaryNextActionByVenue = {
  hyperliquid: {
    en: ["Compare Hyperliquid vs dYdX first", "/compare/hyperliquid-vs-dydx"],
    "zh-Hans": ["先比较 Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"],
    "zh-Hant": ["先比較 Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"],
  },
  uniswap: {
    en: ["Compare Uniswap vs Jupiter before signing", "/compare/uniswap-vs-jupiter"],
    "zh-Hans": ["签名前比较 Uniswap vs Jupiter", "/compare/uniswap-vs-jupiter"],
    "zh-Hant": ["簽名前比較 Uniswap vs Jupiter", "/compare/uniswap-vs-jupiter"],
  },
  gmx: {
    en: ["Open the derivatives cost dictionary", "/topics/derivatives#perp-cost-field-dictionary"],
    "zh-Hans": ["打开衍生品成本词典", "/topics/derivatives#perp-cost-field-dictionary"],
    "zh-Hant": ["打開衍生品成本詞典", "/topics/derivatives#perp-cost-field-dictionary"],
  },
  drift: {
    en: ["Open the dated source comparison first", "/compare/hyperliquid-vs-dydx"],
    "zh-Hans": ["先打开带来源的高速永续对比", "/compare/hyperliquid-vs-dydx"],
    "zh-Hant": ["先打開帶來源的高速永續對比", "/compare/hyperliquid-vs-dydx"],
  },
  deribit: {
    en: ["Read options vs perps context first", "/topics/tokenized-stocks-vs-perpetuals"],
    "zh-Hans": ["先阅读期权与永续背景", "/topics/tokenized-stocks-vs-perpetuals"],
    "zh-Hant": ["先閱讀期權與永續背景", "/topics/tokenized-stocks-vs-perpetuals"],
  },
};

export const priorityVenueAnswers = {
  binance: {
    es: {
      title: "Binance en español: revisa comisiones publicadas, KYC, producto y ruta oficial antes de abrir cuenta.",
      body: "Binance puede servir como cuenta CEX de referencia para spot, futuros y liquidez amplia, pero la decisión no debe basarse en una promesa genérica de coste bajo. Antes de registrarte, separa spot, futuros, fiat/P2P, Earn y Web3; confirma dominio oficial, nivel de identidad, región, método de entrada o salida, tabla de comisiones y producto necesario dentro del flujo oficial.",
      reviewedAt: "2026-09-22",
      reviewedLabel: "Fuentes oficiales de Binance revisadas el 22 de septiembre de 2026",
      costFormulaLabel: "Comprobación antes de abrir cuenta",
      costFormula: "comisión maker/taker + nivel de cuenta + regla de producto + entrada/salida + elegibilidad regional",
      checks: [
        "Comisiones: compara tabla oficial, producto, lado maker/taker y nivel de cuenta antes de estimar coste.",
        "Cuenta: confirma identidad, residencia, límites, fiat/P2P y permisos de producto en el flujo oficial.",
        "Ruta: usa NexuAlpha como comprobación de fuentes y enlaces relacionados; la aprobación final ocurre en Binance.",
      ],
      boundary: "Esta respuesta no confirma aprobación de cuenta, disponibilidad regional, bonus, beneficio de usuario, nivel VIP ni coste final. La pantalla oficial de Binance decide las condiciones aplicables.",
      sources: [
        official("Binance trading fee schedule", "https://www.binance.com/en/fee/trading"),
        official("Binance futures fee schedule", "https://www.binance.com/en/fee/futureFee"),
        official("Binance identity verification", "https://www.binance.com/en/support/faq/detail/360027287111"),
        official("Binance proof of reserves", "https://www.binance.com/en/proof-of-reserves"),
        official("Binance announcements", "https://www.binance.com/en/support/announcement"),
      ],
      internalLinks: [
        internal("Comparar Binance vs OKX", "/compare/binance-vs-okx"),
        internal("Abrir guía de derivados", "/topics/derivatives"),
        internal("Abrir factbook de Binance", "/factbook/binance"),
      ],
      faq: [
        faq("¿Qué debo revisar antes de abrir Binance desde NexuAlpha?", "Confirma dominio oficial, tabla de comisiones publicada, nivel KYC, residencia, producto que necesitas y ruta de entrada o salida. NexuAlpha reduce la decisión, pero no sustituye la comprobación de cuenta oficial.", ["https://www.binance.com/en/fee/trading", "https://www.binance.com/en/support/faq/detail/360027287111"]),
        faq("¿La comisión final de Binance es igual a la tabla pública?", "No necesariamente. La tabla pública es el punto de partida; producto, par, lado maker/taker, nivel VIP, condiciones de cuenta y pantalla oficial pueden cambiar el coste aplicable.", ["https://www.binance.com/en/fee/trading", "https://www.binance.com/en/fee/futureFee"]),
        faq("¿Binance vs OKX es el siguiente paso lógico?", "Sí, si aún estás eligiendo una cuenta CEX amplia. Usa la comparación Binance vs OKX para separar liquidez, producto, KYC, Web3 y límites regionales antes de abrir cualquier ruta de registro.", ["https://www.binance.com/en/fee/trading", "https://www.okx.com/fees"]),
        faq("¿Esta página promete bonus o aprobación?", "No. La página mantiene la frontera editorial: no promete bonus, aprobación, elegibilidad, VIP ni coste neto. Los términos actuales se verifican en el flujo oficial de Binance.", ["https://www.binance.com/en/support/announcement"]),
      ],
      seoTitle: "Binance España y LatAm: comisiones, KYC y ruta oficial antes de registrarte",
      seoDescription: "Respuesta en español para revisar Binance por comisiones publicadas, KYC, región, spot, futuros, prueba de reservas, anuncios oficiales y enlaces relacionados antes de abrir cuenta.",
    },
  },
  hyperliquid: {
    en: {
      title: "Hyperliquid fees, funded account and cashback checks: read referral discounts, funding and wallet permissions as one cost stack.",
      body: "Official fee-table check on 2026-10-01: Tier 0 base perps maker 0.015%, taker 0.045%; spot maker 0.040%, taker 0.070%. These are dated base rates, not live quotes or guaranteed account rates. Staking, referral eligibility, asset and HIP-3 conditions can change the applicable fee; funding is separate. Check collateral, margin, liquidation and wallet permissions before trading.",
      reviewedAt: "2026-09-22",
      reviewedLabel: "Official Hyperliquid sources reviewed September 22, 2026",
      queryOwner: {
        label: "Search intent",
        body: "The Hyperliquid page answers hyperliquid fees, hyperliquid funded account and hyperliquid cashback as source checks, not benefit promises or partner-side outcomes.",
      },
      costFormulaLabel: "Pre-trade cost stack",
      costFormula: "maker/taker fee ± hourly funding + spread/slippage + collateral transfer cost + liquidation/exit risk",
      checks: [
        "Fee tier: rolling 14-day weighted volume is perps volume plus twice spot volume, assessed at each UTC day-end; spot and perps have separate schedules.",
        "Single-side example: a hypothetical USD 1,000 perp taker fill at Tier 0 base 0.045% costs USD 0.45 in trading fees, before discounts, funding, spread/slippage or transfer costs.",
        "Referral/cashback searches: separate official referral discounts and rewards from unsupported cashback language.",
        "Funded-account searches: separate self-funded collateral, vault participation and third-party trader-funding claims.",
      ],
      fit: {
        label: "Best fit",
        items: ["Wallet-native perp or spot users who can read funding and margin risk before trading.", "Teams comparing Hyperliquid against dYdX or a centralized futures venue from published mechanics."],
      },
      avoid: {
        label: "Do not use as the only path when",
        items: ["The user wants fiat onboarding, custodial account recovery, or a funded-account outcome without source proof.", "The decision depends on a cashback, rebate or vault-return promise that is not visible in official terms."],
      },
      nextSteps: {
        label: "Decision order before leaving NexuAlpha",
        items: ["Compare Hyperliquid vs dYdX for account model, funding and margin mechanics.", "Open the derivatives cost dictionary to separate fees, funding, collateral, liquidation and referral discount language.", "Only then connect a wallet or inspect the app route with current collateral and signing permissions."],
      },
      boundary: "This answer does not promise account access, cashback, funded-account allocation, vault return, lower fees, referral benefits, bridge availability or final net trading cost.",
      sources: [
        official("Hyperliquid Fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees"),
        official("Hyperliquid Funding", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"),
        official("Hyperliquid Referrals", "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals"),
        official("Hyperliquid Liquidations", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations"),
        official("Hyperliquid USDC", "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc"),
        official("Hyperliquid account abstraction modes", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes"),
        official("Hyperliquid vaults", "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/vaults"),
        official("Hyperliquid sub-accounts", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts"),
        official("Hyperliquid nonces and API wallets", "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets"),
        official("Hyperliquid HIP-3 builder-deployed perpetuals", "https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals"),
      ],
      internalLinks: [
        internal("Compare Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"),
        internal("Open the derivatives cost dictionary", "/topics/derivatives#perp-cost-field-dictionary"),
        internal("Check no-KYC wallet-access boundaries", "/topics/no-kyc"),
      ],
      faq: [
        faq("Are hyperliquid fees cheaper than a centralized futures exchange?", "You cannot decide from a headline taker fee alone. Hyperliquid fees depend on a maker/taker fee tier based on rolling 14-day volume, separate spot and perp schedules, sub-account volume rules, vault-volume separation, HIP-3 market conditions and referral discount eligibility; hourly peer-to-peer funding is separate from maker/taker trading fees and can change the holding cost.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals", "https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"]),
        faq("Does Hyperliquid have cashback or a referral discount?", "Use official referral language, not a generic cashback promise. A hyperliquid cashback search should be checked against official referral discount and reward terms: Hyperliquid's docs describe referral rewards and a referral-code fee discount with volume boundaries; they also say referral discounts do not apply to vaults or sub-accounts. Verify the current app state before treating any code or link as a live benefit.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/referrals", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts"]),
        faq("How should I read Hyperliquid funding?", "Hyperliquid describes funding as peer-to-peer and paid every hour. A position can pay or receive funding depending on the premium and interest components, so it belongs in the pre-trade checklist rather than after-the-fact reporting.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"]),
        faq("What is the liquidation check on Hyperliquid?", "Check account equity against maintenance margin before relying on leverage. Hyperliquid states liquidation begins when equity falls below maintenance margin, and that maintenance margin varies by asset and maximum leverage.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations"]),
        faq("Does Hyperliquid offer a funded account?", "Not according to its own documentation: the full Hyperliquid docs (checked October 11, 2026) describe no funded-account or prop-trading programme run by Hyperliquid, and \"funded account\" offers on Hyperliquid come from third parties with their own terms. Official Hyperliquid docs can support checks around self-funded wallet collateral, vault participation, sub-accounts and API-wallet signing routes, but they do not prove third-party trader-funding offers, a third-party capital allocation offer or a promised trader-funding result.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes", "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/vaults", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts", "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets"]),
      ],
      seoTitle: "Hyperliquid fees, referral discount and funded-account checklist",
      seoDescription: "Source-backed Hyperliquid answer: rolling fee tiers, hourly funding, referral discount vs cashback language, liquidation checks and funded-account boundaries.",
    },
    "zh-Hans": {
      title: "Hyperliquid 决策检查：把费率、资金费、保证金和钱包权限放在一起看。",
      body: "2026-10-01 核验官方费率表：Tier 0 基础永续 maker 0.015%、taker 0.045%；现货 maker 0.040%、taker 0.070%。这是带日期的基础费率，不是实时报价，也不保证适用于你的账户。质押、邀请资格、资产及 HIP-3 条件可能改变实际费率；资金费另计。交易前仍需检查抵押资产、保证金、清算和钱包权限。",
      reviewedAt: "2026-09-22",
      reviewedLabel: "Hyperliquid 官方来源核验于 2026-09-22",
      costFormulaLabel: "下单前成本组合",
      costFormula: "maker/taker 费用 ± 每小时资金费 + 点差/滑点 + 抵押资产转移成本 + 清算/退出风险",
      checks: [
        "费率阶梯：滚动 14 日加权成交量为永续成交量加两倍现货成交量，每个 UTC 日末评估；现货与永续使用不同费率表。",
        "单边示例：假设 1,000 美元永续 taker 成交，按 Tier 0 基础 0.045% 计算，交易手续费为 0.45 美元，尚未计入折扣、资金费、点差/滑点或转移成本。",
        "返现/邀请搜索：只使用官方 referral discount 与 reward 表述，不把它改写成无条件 cashback。",
        "Funded account 搜索：区分自有抵押金、vault 参与和第三方资金账户宣传。",
      ],
      fit: {
        label: "更适合",
        items: ["已经理解钱包连接、永续资金费与保证金风险的用户。", "正在把 Hyperliquid 与 dYdX 或中心化合约平台做机制对比的用户。"],
      },
      avoid: {
        label: "不适合作为唯一路径",
        items: ["用户需要法币入金、托管账户恢复或被承诺的 funded-account 结果。", "决策依赖官方条款之外的返现、返点或 vault 收益宣传。"],
      },
      nextSteps: {
        label: "离开 NexuAlpha 前的顺序",
        items: ["先比较 Hyperliquid vs dYdX 的账户模式、资金费与保证金机制。", "再打开衍生品成本词典，把费用、资金费、抵押、清算和邀请折扣表述分开。", "最后才连接钱包，检查当前抵押资产和签名权限。"],
      },
      boundary: "这里不承诺开户成功、funded-account 资金分配、vault 收益、低费率、邀请优惠、跨链可用性或最终净交易成本。",
      sources: [
        official("Hyperliquid Fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees"),
        official("Hyperliquid Funding", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"),
        official("Hyperliquid Referrals", "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals"),
        official("Hyperliquid Liquidations", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations"),
        official("Hyperliquid USDC", "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc"),
        official("Hyperliquid account abstraction modes", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes"),
        official("Hyperliquid vaults", "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/vaults"),
        official("Hyperliquid sub-accounts", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts"),
        official("Hyperliquid nonces and API wallets", "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets"),
        official("Hyperliquid HIP-3 builder-deployed perpetuals", "https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals"),
      ],
      internalLinks: [
        internal("比较 Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"),
        internal("打开衍生品成本词典", "/topics/derivatives#perp-cost-field-dictionary"),
        internal("查看 No-KYC 钱包准入边界", "/topics/no-kyc"),
      ],
      faq: [
        faq("Hyperliquid 一定比中心化合约交易所便宜吗？", "不能只用表面 taker 费率判断。Hyperliquid 费用取决于滚动 14 日成交量、现货与永续的不同费率表、子账户成交量规则、vault 成交量单独处理、HIP-3 市场条件，以及仓位上的每小时资金费。", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"]),
        faq("Hyperliquid 有 cashback 或邀请折扣吗？", "应使用官方 referral 表述，而不是承诺通用 cashback。Hyperliquid 官方文档写明邀请奖励和邀请码费率折扣存在成交量边界，并说明邀请折扣不适用于 vault 或子账户。任何代码、链接或权益都应在当前官方 App 中再次核验，不能据此承诺无条件返现。", ["https://hyperliquid.gitbook.io/hyperliquid-docs/referrals", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts"]),
        faq("Hyperliquid 的资金费应该怎么看？", "官方文档把资金费描述为点对点结算，并且每小时支付。仓位可能支付或收到资金费，方向取决于溢价和利率组成，因此它应放在下单前检查清单里。", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"]),
        faq("Hyperliquid 的清算要检查什么？", "先看账户权益是否可能低于维持保证金。官方文档说明，当权益低于维持保证金时会开始清算，而维持保证金会随资产和最大杠杆变化。", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations"]),
        faq("Hyperliquid 是否提供 funded account？", "把 funded account 关键词当成单独研究路径。官方资料可用于核对抵押模式、vault 参与、子账户和 API 钱包签名路径，但不能证明第三方会给交易员分配资金或承诺结果。", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes", "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/vaults", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts", "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets"]),
      ],
      seoTitle: "Hyperliquid 费率、邀请折扣、资金费与清算检查清单",
      seoDescription: "Hyperliquid 官方来源答案：区分邀请折扣与 cashback，覆盖滚动费率阶梯、每小时资金费、保证金、清算和 funded-account 边界。",
    },
    "zh-Hant": {
      title: "Hyperliquid 決策檢查：把費率、資金費、保證金和錢包權限放在一起看。",
      body: "2026-10-01 核驗官方費率表：Tier 0 基礎永續 maker 0.015%、taker 0.045%；現貨 maker 0.040%、taker 0.070%。這是帶日期的基礎費率，不是即時報價，也不保證適用於你的帳戶。質押、邀請資格、資產及 HIP-3 條件可能改變實際費率；資金費另計。交易前仍需檢查抵押資產、保證金、清算和錢包權限。",
      reviewedAt: "2026-09-22",
      reviewedLabel: "Hyperliquid 官方來源核驗於 2026-09-22",
      costFormulaLabel: "下單前成本組合",
      costFormula: "maker/taker 費用 ± 每小時資金費 + 點差/滑點 + 抵押資產轉移成本 + 清算/退出風險",
      checks: [
        "費率階梯：滾動 14 日加權成交量為永續成交量加兩倍現貨成交量，每個 UTC 日末評估；現貨與永續使用不同費率表。",
        "單邊示例：假設 1,000 美元永續 taker 成交，按 Tier 0 基礎 0.045% 計算，交易手續費為 0.45 美元，尚未計入折扣、資金費、點差/滑點或轉移成本。",
        "返現/邀請搜尋：只使用官方 referral discount 與 reward 表述，不把它改寫成無條件 cashback。",
        "Funded account 搜尋：區分自有抵押金、vault 參與和第三方資金帳戶宣傳。",
      ],
      fit: {
        label: "更適合",
        items: ["已經理解錢包連接、永續資金費與保證金風險的用戶。", "正在把 Hyperliquid 與 dYdX 或中心化合約平台做機制對比的用戶。"],
      },
      avoid: {
        label: "不適合作為唯一路徑",
        items: ["用戶需要法幣入金、託管帳戶恢復或被承諾的 funded-account 結果。", "決策依賴官方條款之外的返現、返點或 vault 收益宣傳。"],
      },
      nextSteps: {
        label: "離開 NexuAlpha 前的順序",
        items: ["先比較 Hyperliquid vs dYdX 的帳戶模式、資金費與保證金機制。", "再打開衍生品成本詞典，把費用、資金費、抵押、清算和邀請折扣表述分開。", "最後才連接錢包，檢查目前抵押資產和簽名權限。"],
      },
      boundary: "這裡不承諾開戶成功、funded-account 資金分配、vault 收益、低費率、邀請優惠、跨鏈可用性或最終淨交易成本。",
      sources: [
        official("Hyperliquid Fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees"),
        official("Hyperliquid Funding", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"),
        official("Hyperliquid Referrals", "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals"),
        official("Hyperliquid Liquidations", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations"),
        official("Hyperliquid USDC", "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc"),
        official("Hyperliquid account abstraction modes", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes"),
        official("Hyperliquid vaults", "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/vaults"),
        official("Hyperliquid sub-accounts", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts"),
        official("Hyperliquid nonces and API wallets", "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets"),
        official("Hyperliquid HIP-3 builder-deployed perpetuals", "https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals"),
      ],
      internalLinks: [
        internal("比較 Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"),
        internal("打開衍生品成本詞典", "/topics/derivatives#perp-cost-field-dictionary"),
        internal("查看 No-KYC 錢包准入邊界", "/topics/no-kyc"),
      ],
      faq: [
        faq("Hyperliquid 一定比中心化合約交易所便宜嗎？", "不能只用表面 taker 費率判斷。Hyperliquid 費用取決於滾動 14 日成交量、現貨與永續的不同費率表、子帳戶成交量規則、vault 成交量單獨處理、HIP-3 市場條件，以及倉位上的每小時資金費。", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"]),
        faq("Hyperliquid 有 cashback 或邀請折扣嗎？", "應使用官方 referral 表述，而不是承諾通用 cashback。Hyperliquid 官方文檔寫明邀請獎勵和邀請碼費率折扣存在成交量邊界，並說明邀請折扣不適用於 vault 或子帳戶。任何代碼、連結或權益都應在目前官方 App 中再次核驗，不能據此承諾無條件返現。", ["https://hyperliquid.gitbook.io/hyperliquid-docs/referrals", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts"]),
        faq("Hyperliquid 的資金費應該怎麼看？", "官方文檔把資金費描述為點對點結算，並且每小時支付。倉位可能支付或收到資金費，方向取決於溢價和利率組成，因此它應放在下單前檢查清單裡。", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"]),
        faq("Hyperliquid 的清算要檢查什麼？", "先看帳戶權益是否可能低於維持保證金。官方文檔說明，當權益低於維持保證金時會開始清算，而維持保證金會隨資產和最大槓桿變化。", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations"]),
        faq("Hyperliquid 是否提供 funded account？", "把 funded account 關鍵詞當成單獨研究路徑。官方資料可用於核對抵押模式、vault 參與、子帳戶和 API 錢包簽名路徑，但不能證明第三方會給交易員分配資金或承諾結果。", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes", "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/vaults", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts", "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets"]),
      ],
      seoTitle: "Hyperliquid 費率、邀請折扣、資金費與清算檢查清單",
      seoDescription: "Hyperliquid 官方來源答案：區分邀請折扣與 cashback，覆蓋滾動費率階梯、每小時資金費、保證金、清算和 funded-account 邊界。",
    },
  },
  uniswap: {
    en: {
      title: "Uniswap testnet answer: verify the official app, API/web scope, network, token contract, approval and wallet preview before signing.",
      body: "Uniswap testnet guidance checked 2026-10-01: testnets let you practice with test cryptocurrency that has no real-world value. Uniswap Wallet/Extension has a testnet mode for practice without real funds; this differs from developer API integration. Before any mainnet swap, verify the official app and docs, chain, token contract, route, approval or Permit2 spender, gas and the wallet's final mainnet transaction preview. Do not connect a wallet or send value from an unverified link or contract.",
      reviewedAt: "2026-09-22",
      reviewedLabel: "Official Uniswap sources reviewed September 22, 2026",
      costFormulaLabel: "Swap route check",
      costFormula: "pool fee or hook fee + price impact + gas + approval/signature risk + token-contract risk",
      checks: [
        "Testnet intent: the API table can expose more testnet coverage than the public web app.",
        "Live swap intent: the real decision is chain, token contract, route, approval and wallet transaction.",
        "Safety boundary: do not treat a search result, social link or copied contract as a safe transfer route.",
        "Mainnet evidence: testnet support does not prove mainnet liquidity, safety or final execution.",
      ],
      fit: {
        label: "Best fit",
        items: ["Self-custody users who can verify token contracts, route previews, gas and permissions before signing.", "Researchers separating developer API coverage, public app routes and live mainnet execution."],
      },
      avoid: {
        label: "Do not use as the only path when",
        items: ["The user expects account support, fiat onboarding or custodial recovery.", "The decision depends on a token-safety claim, airdrop page or testnet result that is not confirmed in the wallet preview."],
      },
      nextSteps: {
        label: "Decision order before signing",
        items: ["Confirm the official app and docs, then choose the intended chain.", "Verify token contract, pool or route, spender and Permit2 or approval request.", "Read the wallet's final mainnet transaction preview before signing; disconnecting is not approval revocation."],
      },
      boundary: "This answer does not verify a token, guarantee liquidity, recommend a swap, promise execution, or turn a testnet/API result into a live trading signal.",
      sourceReviewedAt: {
        "https://developers.uniswap.org/docs/trading/swapping-api/faqs": "2026-10-02",
        "https://developers.uniswap.org/docs/trading/custom-interface-links": "2026-10-02",
      },
      sources: [
        official("Uniswap Swap API FAQ", "https://developers.uniswap.org/docs/trading/swapping-api/faqs"),
        official("Uniswap v2 Custom Linking", "https://developers.uniswap.org/docs/trading/custom-interface-links"),
        official("Uniswap official app", "https://app.uniswap.org/"),
        official("Uniswap quickstart", "https://developers.uniswap.org/docs/get-started/quickstart"),
        official("Uniswap supported chains", "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains"),
        official("Uniswap testnet support", "https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap"),
        official("Uniswap Wallet/Extension testnet mode", "https://support.uniswap.org/hc/en-us/articles/39884112333197-How-do-I-use-testnets-on-Uniswap"),
        official("Uniswap Universal Router", "https://developers.uniswap.org/docs/protocols/universal-router/overview"),
        official("Uniswap v4 deployments", "https://developers.uniswap.org/docs/protocols/v4/deployments"),
        official("Uniswap Permit2 overview", "https://developers.uniswap.org/docs/protocols/permit2/overview"),
        official("Uniswap swap support", "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens"),
        official("Uniswap revoke approvals support", "https://support.uniswap.org/hc/en-us/articles/25380237324685-How-to-revoke-token-approvals"),
      ],
      internalLinks: [
        internal("Compare Uniswap vs Jupiter", "/compare/uniswap-vs-jupiter"),
        internal("Open on-chain liquidity checks", "/onchain?product=swap"),
        internal("Compare CEX, DEX and Perp DEX models", "/news/cex-vs-dex-vs-perp-dex"),
      ],
      faq: [
        faq("What should I check before using Uniswap testnet or mainnet?", "Guidance checked 2026-10-01: open the official Uniswap app and docs first; separate API table coverage from the public web app. Test coins have no real-world value. Wallet/Extension only: open the app or extension, select the gear icon, Advanced, then turn on Testnet mode. These are not instructions for the ordinary web interface. Before mainnet use, verify network, token contract, approval or Permit2 spender, gas asset and final wallet transaction preview (the final mainnet transaction preview for live use). Testnet results do not prove mainnet liquidity, execution quality or token safety; do not connect a wallet or send value from an unverified link or contract.", ["https://app.uniswap.org/", "https://developers.uniswap.org/docs/get-started/quickstart", "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains", "https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap", "https://support.uniswap.org/hc/en-us/articles/39884112333197-How-do-I-use-testnets-on-Uniswap", "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens"]),
        faq("Do I need an exchange account to use Uniswap?", "No. Uniswap is a wallet-connected app route rather than a custodial exchange account. The practical check is whether the user is on the official app, using the intended wallet, chain, token contract, approval and swap route.", ["https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens"]),
        faq("What is the difference between Uniswap API testnets and the web app?", "Documentation checked 2026-10-01: the API table lists Ethereum Sepolia, Unichain Sepolia and Base Sepolia, and documents only Ethereum Sepolia and Unichain Sepolia as testnet options for web availability. Uniswap Support lists Sepolia and Unichain for the Interface. This documents support, not controls observed in your current web session; Wallet/Extension Testnet mode has separate instructions. Testnet support is not proof of mainnet liquidity or token safety.", ["https://developers.uniswap.org/docs/trading/swapping-api/supported-chains", "https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap"]),
        faq("What roles do token contract, Universal Router, Permit2 and spender play?", "The token contract identifies the asset, Universal Router can route the swap path, Permit2 can manage signature-based token permissions, and the spender is the address allowed to move tokens. Check each role before signing because a familiar page does not make every token or approval safe, and an unknown contract should not be treated as safe.", ["https://developers.uniswap.org/docs/protocols/universal-router/overview", "https://developers.uniswap.org/docs/protocols/permit2/overview"]),
        faq("Does disconnecting a wallet revoke Uniswap approvals?", "No. Disconnecting stops a site session, while token approvals remain on-chain until revoked or changed. Users should inspect active approvals and revoke unwanted permissions rather than relying on disconnect alone.", ["https://support.uniswap.org/hc/en-us/articles/25380237324685-How-to-revoke-token-approvals", "https://developers.uniswap.org/docs/protocols/permit2/overview"]),
        faq("Does a Uniswap affiliate program search prove consumer referral or cashback eligibility?", "Official documentation checked 2026-10-02: the Swap API FAQ describes an integrator fee, while the Custom Linking page documents prefilled interface links in a v2 documentation context. These are developer integration and interface-linking mechanics, not evidence that a consumer qualifies for a referral reward or cashback. They do not establish whether a consumer affiliate program exists or is available to a particular user. Verify any separate program terms and eligibility through current official sources; no reward or cashback is promised here.", ["https://developers.uniswap.org/docs/trading/swapping-api/faqs", "https://developers.uniswap.org/docs/trading/custom-interface-links"]),
      ],
      seoTitle: "Uniswap testnet, mainnet, Permit2 and swap preview checklist",
      seoDescription: "Source-backed Uniswap answer: testnet vs live mainnet swaps, app/docs, network, token contract, pool, Permit2, approval, gas and transaction-preview checks.",
    },
    "zh-Hans": {
      title: "Uniswap 决策检查：把测试网研究和真实钱包 swap 分开。",
      body: "2026-10-01 核对测试网说明：测试网用于练习，测试币没有现实价值。Uniswap Wallet/Extension 可用测试网模式在不使用真实资金的情况下练习，这与开发者 API 集成不同。任何主网 swap 前，仍要单独核对链、代币合约、路径、approval 或 Permit2 spender、gas 和最终钱包交易预览。",
      reviewedAt: "2026-09-22",
      reviewedLabel: "Uniswap 官方来源核验于 2026-09-22",
      costFormulaLabel: "Swap 路径检查",
      costFormula: "池子费用或 hook 费用 + 价格影响 + gas + 授权/签名风险 + 代币合约风险",
      checks: [
        "测试网意图：API 与开发者路径可能不同于公开 Web App 展示的网络范围。",
        "真实 swap 意图：真正要判断的是链、代币合约、路径、授权和钱包交易。",
        "主网证据：测试网支持不能证明主网流动性、安全性或最终执行结果。",
      ],
      fit: {
        label: "更适合",
        items: ["能够在签名前核对代币合约、路线预览、gas 与权限的自托管用户。", "需要区分开发者 API、公开 App 路由和主网真实执行的研究用户。"],
      },
      avoid: {
        label: "不适合作为唯一路径",
        items: ["用户需要账户客服、法币入金或托管账户恢复。", "决策依赖未在钱包预览中确认的代币安全、空投页面或测试网结果。"],
      },
      nextSteps: {
        label: "签名前的顺序",
        items: ["先确认官方 App 和文档，再选择目标链。", "核对代币合约、池子或路径、spender，以及 Permit2 或授权请求。", "阅读最终钱包交易预览再签名；断开连接不等于撤销授权。"],
      },
      boundary: "这里不验证任何代币，不保证流动性，不建议 swap，不承诺成交，也不把测试网/API 结果等同于真实交易信号。",
      sourceReviewedAt: {
        "https://developers.uniswap.org/docs/trading/swapping-api/faqs": "2026-10-02",
        "https://developers.uniswap.org/docs/trading/custom-interface-links": "2026-10-02",
      },
      sources: [
        official("Uniswap Swap API FAQ", "https://developers.uniswap.org/docs/trading/swapping-api/faqs"),
        official("Uniswap v2 Custom Linking", "https://developers.uniswap.org/docs/trading/custom-interface-links"),
        official("Uniswap official app", "https://app.uniswap.org/"),
        official("Uniswap quickstart", "https://developers.uniswap.org/docs/get-started/quickstart"),
        official("Uniswap supported chains", "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains"),
        official("Uniswap testnet support", "https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap"),
        official("Uniswap Wallet/Extension testnet mode", "https://support.uniswap.org/hc/en-us/articles/39884112333197-How-do-I-use-testnets-on-Uniswap"),
        official("Uniswap Universal Router", "https://developers.uniswap.org/docs/protocols/universal-router/overview"),
        official("Uniswap v4 deployments", "https://developers.uniswap.org/docs/protocols/v4/deployments"),
        official("Uniswap Permit2 overview", "https://developers.uniswap.org/docs/protocols/permit2/overview"),
        official("Uniswap swap support", "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens"),
        official("Uniswap revoke approvals support", "https://support.uniswap.org/hc/en-us/articles/25380237324685-How-to-revoke-token-approvals"),
      ],
      internalLinks: [
        internal("比较 Uniswap vs Jupiter", "/compare/uniswap-vs-jupiter"),
        internal("打开链上流动性检查", "/onchain?product=swap"),
        internal("比较 CEX、DEX 与 Perp DEX 模型", "/news/cex-vs-dex-vs-perp-dex"),
      ],
      faq: [
        faq("使用 Uniswap 测试网或主网前要检查什么？", "2026-10-01 核对说明：先打开官方 Uniswap App 和文档，区分 API 表的支持范围与普通 Web App。测试币没有现实价值。仅适用于 Wallet/Extension：打开应用或扩展，选择齿轮设置、Advanced，再开启 Testnet mode。这不是普通网页的操作步骤。使用主网前，要核对网络、代币合约、approval 或 Permit2 spender、gas 资产和最终钱包交易预览，并确认最终主网交易预览。测试网不能证明主网流动性、成交质量或代币安全；不要从未经核验的链接或合约连接钱包或发送资产。", ["https://app.uniswap.org/", "https://developers.uniswap.org/docs/get-started/quickstart", "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains", "https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap", "https://support.uniswap.org/hc/en-us/articles/39884112333197-How-do-I-use-testnets-on-Uniswap", "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens"]),
        faq("使用 Uniswap 需要交易所账户吗？", "不需要。Uniswap 是钱包连接型 App 路径，不是托管交易所账户。真正要检查的是官方 App、当前钱包、链、代币合约、授权和 swap 路径是否都正确。", ["https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens"]),
        faq("Uniswap API 测试网和 Web App 有什么区别？", "2026-10-01 核对官方文档：API 表列出 Ethereum Sepolia、Unichain Sepolia 和 Base Sepolia，并注明 Web 测试网仅支持 Ethereum Sepolia 与 Unichain Sepolia。Uniswap Support 的 Interface 支持说明列出 Sepolia 和 Unichain。这是文档支持范围，不代表已观察到当前网页会话的开关；Wallet/Extension 的 Testnet mode 有单独说明。测试网支持不能证明主网流动性或代币安全。", ["https://developers.uniswap.org/docs/trading/swapping-api/supported-chains", "https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap"]),
        faq("代币合约、Universal Router、Permit2 和 spender 分别是什么角色？", "代币合约用于确认资产，Universal Router 可以路由 swap 路径，Permit2 可以管理基于签名的代币权限，spender 是被允许移动代币的地址。签名前要分别检查这些角色，因为熟悉页面不代表每个代币或授权都安全。", ["https://developers.uniswap.org/docs/protocols/universal-router/overview", "https://developers.uniswap.org/docs/protocols/permit2/overview"]),
        faq("断开钱包连接会撤销 Uniswap 授权吗？", "不会。断开连接只是结束网站会话，代币授权仍会留在链上，直到用户撤销或修改。用户应检查当前授权并撤销不需要的权限，而不是只依赖断开连接。", ["https://support.uniswap.org/hc/en-us/articles/25380237324685-How-to-revoke-token-approvals", "https://developers.uniswap.org/docs/protocols/permit2/overview"]),
        faq("搜索 Uniswap affiliate program 能证明消费者推荐或返现资格吗？", "2026-10-02 核对官方文档：Swap API FAQ 说明 integrator fee（集成方费用），Custom Linking 页面在 v2 文档语境下说明预填界面链接。这些是开发者集成与界面链接机制，不是消费者具备推荐奖励或返现资格的证据，也不能据此判断消费者 affiliate 计划有无或是否适用于某位用户。任何独立计划的条款与资格都应另行核对当前官方来源；这里不承诺奖励或返现。", ["https://developers.uniswap.org/docs/trading/swapping-api/faqs", "https://developers.uniswap.org/docs/trading/custom-interface-links"]),
      ],
      seoTitle: "Uniswap 测试网、Permit2 与真实 swap 安全清单",
      seoDescription: "基于官方来源的 Uniswap 答案，区分 API/测试网研究与真实钱包 swap，并检查链、代币合约、Permit2、授权、路径和 gas。",
    },
    "zh-Hant": {
      title: "Uniswap 決策檢查：把測試網研究和真實錢包 swap 分開。",
      body: "2026-10-01 核對測試網說明：測試網用於練習，測試幣沒有現實價值。Uniswap Wallet/Extension 可用測試網模式在不使用真實資金的情況下練習，這與開發者 API 整合不同。任何主網 swap 前，仍要單獨核對鏈、代幣合約、路徑、approval 或 Permit2 spender、gas 和最終錢包交易預覽。",
      reviewedAt: "2026-09-22",
      reviewedLabel: "Uniswap 官方來源核驗於 2026-09-22",
      costFormulaLabel: "Swap 路徑檢查",
      costFormula: "池子費用或 hook 費用 + 價格影響 + gas + 授權/簽名風險 + 代幣合約風險",
      checks: [
        "測試網意圖：API 與開發者路徑可能不同於公開 Web App 展示的網路範圍。",
        "真實 swap 意圖：真正要判斷的是鏈、代幣合約、路徑、授權和錢包交易。",
        "主網證據：測試網支援不能證明主網流動性、安全性或最終執行結果。",
      ],
      fit: {
        label: "更適合",
        items: ["能夠在簽名前核對代幣合約、路線預覽、gas 與權限的自託管用戶。", "需要區分開發者 API、公開 App 路由和主網真實執行的研究用戶。"],
      },
      avoid: {
        label: "不適合作為唯一路徑",
        items: ["用戶需要帳戶客服、法幣入金或託管帳戶恢復。", "決策依賴未在錢包預覽中確認的代幣安全、空投頁面或測試網結果。"],
      },
      nextSteps: {
        label: "簽名前的順序",
        items: ["先確認官方 App 和文檔，再選擇目標鏈。", "核對代幣合約、池子或路徑、spender，以及 Permit2 或授權請求。", "閱讀最終錢包交易預覽再簽名；斷開連接不等於撤銷授權。"],
      },
      boundary: "這裡不驗證任何代幣，不保證流動性，不建議 swap，不承諾成交，也不把測試網/API 結果等同於真實交易訊號。",
      sourceReviewedAt: {
        "https://developers.uniswap.org/docs/trading/swapping-api/faqs": "2026-10-02",
        "https://developers.uniswap.org/docs/trading/custom-interface-links": "2026-10-02",
      },
      sources: [
        official("Uniswap Swap API FAQ", "https://developers.uniswap.org/docs/trading/swapping-api/faqs"),
        official("Uniswap v2 Custom Linking", "https://developers.uniswap.org/docs/trading/custom-interface-links"),
        official("Uniswap official app", "https://app.uniswap.org/"),
        official("Uniswap quickstart", "https://developers.uniswap.org/docs/get-started/quickstart"),
        official("Uniswap supported chains", "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains"),
        official("Uniswap testnet support", "https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap"),
        official("Uniswap Wallet/Extension testnet mode", "https://support.uniswap.org/hc/en-us/articles/39884112333197-How-do-I-use-testnets-on-Uniswap"),
        official("Uniswap Universal Router", "https://developers.uniswap.org/docs/protocols/universal-router/overview"),
        official("Uniswap v4 deployments", "https://developers.uniswap.org/docs/protocols/v4/deployments"),
        official("Uniswap Permit2 overview", "https://developers.uniswap.org/docs/protocols/permit2/overview"),
        official("Uniswap swap support", "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens"),
        official("Uniswap revoke approvals support", "https://support.uniswap.org/hc/en-us/articles/25380237324685-How-to-revoke-token-approvals"),
      ],
      internalLinks: [
        internal("比較 Uniswap vs Jupiter", "/compare/uniswap-vs-jupiter"),
        internal("打開鏈上流動性檢查", "/onchain?product=swap"),
        internal("比較 CEX、DEX 與 Perp DEX 模型", "/news/cex-vs-dex-vs-perp-dex"),
      ],
      faq: [
        faq("使用 Uniswap 測試網或主網前要檢查什麼？", "2026-10-01 核對說明：先打開官方 Uniswap App 和文檔，區分 API 表的支援範圍與普通 Web App。測試幣沒有現實價值。僅適用於 Wallet/Extension：打開應用或擴充功能，選擇齒輪設定、Advanced，再開啟 Testnet mode。這不是普通網頁的操作步驟。使用主網前，要核對網路、代幣合約、approval 或 Permit2 spender、gas 資產和最終錢包交易預覽，並確認最終主網交易預覽。測試網不能證明主網流動性、成交品質或代幣安全；不要從未經核驗的連結或合約連接錢包或發送資產。", ["https://app.uniswap.org/", "https://developers.uniswap.org/docs/get-started/quickstart", "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains", "https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap", "https://support.uniswap.org/hc/en-us/articles/39884112333197-How-do-I-use-testnets-on-Uniswap", "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens"]),
        faq("使用 Uniswap 需要交易所帳戶嗎？", "不需要。Uniswap 是錢包連接型 App 路徑，不是託管交易所帳戶。真正要檢查的是官方 App、當前錢包、鏈、代幣合約、授權和 swap 路徑是否都正確。", ["https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens"]),
        faq("Uniswap API 測試網和 Web App 有什麼區別？", "2026-10-01 核對官方文檔：API 表列出 Ethereum Sepolia、Unichain Sepolia 和 Base Sepolia，並註明 Web 測試網僅支援 Ethereum Sepolia 與 Unichain Sepolia。Uniswap Support 的 Interface 支援說明列出 Sepolia 和 Unichain。這是文檔支援範圍，不代表已觀察到目前網頁工作階段的開關；Wallet/Extension 的 Testnet mode 有單獨說明。測試網支援不能證明主網流動性或代幣安全。", ["https://developers.uniswap.org/docs/trading/swapping-api/supported-chains", "https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap"]),
        faq("代幣合約、Universal Router、Permit2 和 spender 分別是什麼角色？", "代幣合約用於確認資產，Universal Router 可以路由 swap 路徑，Permit2 可以管理基於簽名的代幣權限，spender 是被允許移動代幣的地址。簽名前要分別檢查這些角色，因為熟悉頁面不代表每個代幣或授權都安全。", ["https://developers.uniswap.org/docs/protocols/universal-router/overview", "https://developers.uniswap.org/docs/protocols/permit2/overview"]),
        faq("斷開錢包連接會撤銷 Uniswap 授權嗎？", "不會。斷開連接只是結束網站會話，代幣授權仍會留在鏈上，直到用戶撤銷或修改。用戶應檢查目前授權並撤銷不需要的權限，而不是只依賴斷開連接。", ["https://support.uniswap.org/hc/en-us/articles/25380237324685-How-to-revoke-token-approvals", "https://developers.uniswap.org/docs/protocols/permit2/overview"]),
        faq("搜尋 Uniswap affiliate program 能證明消費者推薦或返現資格嗎？", "2026-10-02 核對官方文檔：Swap API FAQ 說明 integrator fee（整合方費用），Custom Linking 頁面在 v2 文檔語境下說明預填介面連結。這些是開發者整合與介面連結機制，不是消費者具備推薦獎勵或返現資格的證據，也不能據此判斷消費者 affiliate 計劃有無或是否適用於某位用戶。任何獨立計劃的條款與資格都應另行核對目前官方來源；這裡不承諾獎勵或返現。", ["https://developers.uniswap.org/docs/trading/swapping-api/faqs", "https://developers.uniswap.org/docs/trading/custom-interface-links"]),
      ],
      seoTitle: "Uniswap 測試網、Permit2 與真實 swap 安全清單",
      seoDescription: "基於官方來源的 Uniswap 答案，區分 API/測試網研究與真實錢包 swap，並檢查鏈、代幣合約、Permit2、授權、路徑和 gas。",
    },
  },
  gmx: {
    en: {
      title: "GMX v2 is a pool-based perpetual and swap route, so check the complete cost and liquidation stack before signing.",
      body: "GMX v2 is a wallet-connected perpetual and swap route powered by GM or GLV liquidity pools rather than a conventional central order book. Before signing, check the official network and wallet route, selected pool, collateral, price impact, position and swap fees, borrow cost, funding, oracle-based execution, gas, referral-term scope and liquidation conditions.",
      reviewedAt: "2026-09-28",
      reviewedLabel: "Official GMX sources reviewed September 28, 2026",
      costFormulaLabel: "GMX route cost stack",
      costFormula: "position or swap fee + price impact + borrow/funding + network gas + collateral and liquidation risk",
      checks: [
        "Best-fit case: wallet-connected perp or swap route where pool, collateral and oracle mechanics are acceptable.",
        "Cost stack: position or swap fee, price impact, borrow, funding, gas and liquidation buffer need separate checks.",
        "Referral boundary: discounts apply only where official terms say so and do not remove liquidation, funding or market risk.",
      ],
      boundary: "This answer does not promise GMX availability, leverage access, trade outcome, referral discount, liquidity depth, liquidation level or final net cost.",
      sources: [
        official("GMX introduction", "https://docs.gmx.io/docs/intro/"),
        official("GMX fees", "https://docs.gmx.io/docs/trading/fees/"),
        official("GMX liquidations", "https://docs.gmx.io/docs/trading/liquidations/"),
        official("GMX order types", "https://docs.gmx.io/docs/trading/order-types/"),
        official("GMX referrals", "https://docs.gmx.io/docs/referrals/"),
      ],
      internalLinks: [
        internal("Open the derivatives cost dictionary", "/topics/derivatives#perp-cost-field-dictionary"),
        internal("Compare Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"),
        internal("Compare CEX, DEX and Perp DEX models", "/news/cex-vs-dex-vs-perp-dex"),
      ],
      faq: [
        faq("When is GMX a sensible next page to open?", "GMX is worth opening when the user wants a wallet-connected swap or perpetual route and is prepared to inspect pool selection, collateral, oracle-based execution, price impact, funding, borrow cost and liquidation before signing. It is not an ordinary order-book account decision.", ["https://docs.gmx.io/docs/intro/", "https://docs.gmx.io/docs/trading/order-types/"]),
        faq("Which GMX fees should I check first?", "Separate position fees, swap fees, price impact, borrow cost, funding payments and gas. A single displayed fee does not cover the full GMX route because funding and borrow accrual can keep changing while a position remains open.", ["https://docs.gmx.io/docs/trading/fees/"]),
        faq("How does GMX collateral affect liquidation risk?", "GMX documentation ties liquidation to remaining collateral after unrealized losses, accrued fees and capped negative price impact. Collateral token choice also changes exposure, so users should check collateral, leverage, accrued costs and market rules together.", ["https://docs.gmx.io/docs/trading/liquidations/", "https://docs.gmx.io/docs/trading/order-types/"]),
        faq("Does a GMX referral discount cover all costs?", "No. GMX referral docs describe trader discounts for eligible opening and closing fees and state that rewards and discounts do not apply to borrow fees or funding fees. They do not remove gas, price impact, slippage, liquidation or market risk.", ["https://docs.gmx.io/docs/referrals/", "https://docs.gmx.io/docs/trading/fees/"]),
      ],
      seoTitle: "GMX v2 Fees: Pools, Price Impact, Funding and Liquidation — NexuAlpha",
      seoDescription: "Source-backed GMX answer covering GM/GLV pools, oracle pricing, collateral, position and swap fees, price impact, borrow, funding and liquidation boundaries.",
    },
    "zh-Hans": {
      title: "GMX 决策检查：把它当成资金池型永续路径，而不是普通订单簿交易所。",
      body: "GMX 适合已经能判断钱包、资金池和抵押资产风险的用户。下单前先看 GM/GLV 流动性、预言机触发与执行价格、抵押币种、仓位或 swap 费用、价格影响、借贷与资金费累积、清算阈值，以及邀请折扣是否只覆盖官方条款列明的费用。",
      reviewedAt: "2026-09-28",
      reviewedLabel: "GMX 官方来源核验于 2026-09-28",
      costFormulaLabel: "GMX 路径成本组合",
      costFormula: "仓位或 swap 费用 + 价格影响 + 借贷/资金成本 + 网络 gas + 抵押资产与清算风险",
      checks: [
        "适用场景：钱包连接型永续或 swap，且能接受资金池、抵押和预言机机制。",
        "成本栈：仓位或 swap 费用、价格影响、借贷、资金费、gas 与清算缓冲分开检查。",
        "邀请边界：折扣只按官方条款适用，不能消除清算、资金费或市场风险。",
      ],
      boundary: "这里不承诺 GMX 可用性、杠杆权限、交易结果、邀请折扣、流动性深度、清算水平或最终净成本。",
      sources: [
        official("GMX introduction", "https://docs.gmx.io/docs/intro/"),
        official("GMX fees", "https://docs.gmx.io/docs/trading/fees/"),
        official("GMX liquidations", "https://docs.gmx.io/docs/trading/liquidations/"),
        official("GMX order types", "https://docs.gmx.io/docs/trading/order-types/"),
        official("GMX referrals", "https://docs.gmx.io/docs/referrals/"),
      ],
      internalLinks: [
        internal("打开衍生品成本词典", "/topics/derivatives#perp-cost-field-dictionary"),
        internal("比较 Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"),
        internal("比较 CEX、DEX 与 Perp DEX 模型", "/news/cex-vs-dex-vs-perp-dex"),
      ],
      faq: [
        faq("什么情况下适合继续打开 GMX？", "当用户需要钱包连接型 swap 或永续路径，并且愿意检查资金池选择、抵押资产、预言机执行、价格影响、资金费、借贷成本和清算条件时，GMX 才是合理的下一步。它不是普通订单簿开户注册问题。", ["https://docs.gmx.io/docs/intro/", "https://docs.gmx.io/docs/trading/order-types/"]),
        faq("GMX 要先检查哪些费用？", "把仓位费用、swap 费用、价格影响、借贷成本、资金费和 gas 分开看。单一显示费率不能覆盖 GMX 路径，因为资金费和借贷成本会在持仓期间继续变化。", ["https://docs.gmx.io/docs/trading/fees/"]),
        faq("GMX 抵押资产如何影响清算？", "GMX 文档把清算与扣除未实现亏损、已累计费用和负向价格影响后的剩余抵押品联系起来。抵押币种也会改变额外敞口，所以要把抵押、杠杆、费用和市场规则一起检查。", ["https://docs.gmx.io/docs/trading/liquidations/", "https://docs.gmx.io/docs/trading/order-types/"]),
        faq("GMX 邀请折扣覆盖全部成本吗？", "不覆盖。GMX referral 文档说明，交易者折扣适用于合格开仓和平仓费用，并且奖励和折扣不适用于借贷费用或资金费；它也不能抵消 gas、价格影响、滑点、清算或市场风险。", ["https://docs.gmx.io/docs/referrals/", "https://docs.gmx.io/docs/trading/fees/"]),
      ],
      seoTitle: "GMX 费用、资金费、流动性池与清算检查清单",
      seoDescription: "基于官方来源的 GMX 答案，覆盖 GM/GLV 池、预言机定价、抵押资产、仓位与 swap 费用、价格影响、资金费、借贷成本和清算边界。",
    },
    "zh-Hant": {
      title: "GMX 決策檢查：把它當成資金池型永續路徑，而不是普通訂單簿交易所。",
      body: "GMX 適合已經能判斷錢包、資金池和抵押資產風險的用戶。下單前先看 GM/GLV 流動性、預言機觸發與執行價格、抵押幣種、倉位或 swap 費用、價格影響、借貸與資金費累積、清算門檻，以及邀請折扣是否只覆蓋官方條款列明的費用。",
      reviewedAt: "2026-09-28",
      reviewedLabel: "GMX 官方來源核驗於 2026-09-28",
      costFormulaLabel: "GMX 路徑成本組合",
      costFormula: "倉位或 swap 費用 + 價格影響 + 借貸/資金成本 + 網路 gas + 抵押資產與清算風險",
      checks: [
        "適用場景：錢包連接型永續或 swap，且能接受資金池、抵押和預言機機制。",
        "成本棧：倉位或 swap 費用、價格影響、借貸、資金費、gas 與清算緩衝分開檢查。",
        "邀請邊界：折扣只按官方條款適用，不能消除清算、資金費或市場風險。",
      ],
      boundary: "這裡不承諾 GMX 可用性、槓桿權限、交易結果、邀請折扣、流動性深度、清算水準或最終淨成本。",
      sources: [
        official("GMX introduction", "https://docs.gmx.io/docs/intro/"),
        official("GMX fees", "https://docs.gmx.io/docs/trading/fees/"),
        official("GMX liquidations", "https://docs.gmx.io/docs/trading/liquidations/"),
        official("GMX order types", "https://docs.gmx.io/docs/trading/order-types/"),
        official("GMX referrals", "https://docs.gmx.io/docs/referrals/"),
      ],
      internalLinks: [
        internal("打開衍生品成本詞典", "/topics/derivatives#perp-cost-field-dictionary"),
        internal("比較 Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"),
        internal("比較 CEX、DEX 與 Perp DEX 模型", "/news/cex-vs-dex-vs-perp-dex"),
      ],
      faq: [
        faq("什麼情況下適合繼續打開 GMX？", "當用戶需要錢包連接型 swap 或永續路徑，並且願意檢查資金池選擇、抵押資產、預言機執行、價格影響、資金費、借貸成本和清算條件時，GMX 才是合理的下一步。它不是普通訂單簿開戶註冊問題。", ["https://docs.gmx.io/docs/intro/", "https://docs.gmx.io/docs/trading/order-types/"]),
        faq("GMX 要先檢查哪些費用？", "把倉位費用、swap 費用、價格影響、借貸成本、資金費和 gas 分開看。單一顯示費率不能覆蓋 GMX 路徑，因為資金費和借貸成本會在持倉期間繼續變化。", ["https://docs.gmx.io/docs/trading/fees/"]),
        faq("GMX 抵押資產如何影響清算？", "GMX 文檔把清算與扣除未實現虧損、已累計費用和負向價格影響後的剩餘抵押品聯繫起來。抵押幣種也會改變額外敞口，所以要把抵押、槓桿、費用和市場規則一起檢查。", ["https://docs.gmx.io/docs/trading/liquidations/", "https://docs.gmx.io/docs/trading/order-types/"]),
        faq("GMX 邀請折扣覆蓋全部成本嗎？", "不覆蓋。GMX referral 文檔說明，交易者折扣適用於合格開倉和平倉費用，並且獎勵和折扣不適用於借貸費用或資金費；它也不能抵消 gas、價格影響、滑點、清算或市場風險。", ["https://docs.gmx.io/docs/referrals/", "https://docs.gmx.io/docs/trading/fees/"]),
      ],
      seoTitle: "GMX 費用、資金費、流動性池與清算檢查清單",
      seoDescription: "基於官方來源的 GMX 答案，覆蓋 GM/GLV 池、預言機定價、抵押資產、倉位與 swap 費用、價格影響、資金費、借貸成本和清算邊界。",
    },
  },
  drift: {
    en: {
      title: "Drift decision check: treat the official site, updates and redirected docs as separate source layers before any deposit or trade.",
      body: "Drift is a source-bound Solana venue research path right now, not a page where NexuAlpha should imply normal access, a generic fee rebate or a sponsored registration CTA. Start with the Drift-owned home page and updates, then note that the public docs route has redirected to a different branded protocol destination. Stop before deposit, trade, fee, TVL, ranking or regional claims unless a current Drift-owned source states them clearly.",
      reviewedAt: "2026-09-29",
      reviewedLabel: "Drift-owned pages and documentation redirect reviewed September 29, 2026",
      costFormulaLabel: "Source boundary before action",
      costFormula: "official app state + current update notice + documentation destination + account-visible terms",
      checks: [
        "Owner source: use Drift-owned pages for positioning, updates and official entry points.",
        "Redirect boundary: docs.drift.trade resolving elsewhere is a caution, not proof of equivalent product terms.",
        "Commercial stop: do not infer a fee rebate, user reward, sponsored registration CTA or live deposit path from historical notices.",
      ],
      boundary: "This answer does not promise Drift availability, deposits, trading, rewards, sponsored registration, TVL, ranking, fee level, regional eligibility, documentation continuity or final account access.",
      sources: [
        official("Drift official site", "https://www.drift.trade/"),
        official("Drift updates", "https://www.drift.trade/updates"),
        official("Drift Recovery Update · June 2026", "https://www.drift.trade/updates/drift-recovery-update-june-3-2026"),
        official("Drift documentation route", "https://docs.drift.trade/"),
      ],
      internalLinks: [
        internal("Compare high-speed perp venues", "/compare/hyperliquid-vs-dydx"),
        internal("Open the derivatives cost dictionary", "/topics/derivatives#perp-cost-field-dictionary"),
        internal("Compare CEX, DEX and Perp DEX models", "/news/cex-vs-dex-vs-perp-dex"),
      ],
      faq: [
        faq("What should I verify before opening Drift?", "Start with Drift-owned pages: the official site, the updates page and the current app route. If the documentation path redirects to another branded protocol destination, treat that as a source-bound caution and do not restate redirected mechanics as current Drift terms without a fresh owner statement.", ["https://www.drift.trade/", "https://www.drift.trade/updates", "https://docs.drift.trade/"]),
        faq("Does the recovery update prove Drift is normally available?", "No. The reviewed recovery notice discusses outstanding user-loss recovery and a reboot path. It is not enough to prove normal current deposits, trading access, rewards, TVL, ranking, fees or regional eligibility.", ["https://www.drift.trade/updates/drift-recovery-update-june-3-2026"]),
        faq("How should I handle the Drift documentation redirect?", "Use the redirect as a documentation-status signal only. It can justify a caution in the research page, but it should not be rewritten into a rebrand claim, product guarantee, or equivalent user-protection statement unless a current Drift-owned source says so.", ["https://docs.drift.trade/", "https://www.drift.trade/updates"]),
        faq("When should NexuAlpha stop the Drift CTA path?", "Stop before sending a user to deposit, trade or a sponsored registration route when the current Drift-owned source does not clearly confirm app state, account terms, product availability, user benefit and risk notices. NexuAlpha can link to source review first, but should not present unverified action claims as a conversion step.", ["https://www.drift.trade/", "https://www.drift.trade/updates"]),
      ],
      seoTitle: "Drift source-boundary checklist: official site, updates and docs redirect",
      seoDescription: "Source-backed Drift answer: Drift-owned pages, recovery updates, docs redirect status and stop conditions before deposits, trading or sponsored registration.",
    },
    "zh-Hans": {
      title: "Drift 决策检查：先把官网、更新公告和文档重定向分开看，再考虑任何充值或交易动作。",
      body: "Drift 目前应作为有来源边界的 Solana 场所研究路径，而不是让 NexuAlpha 暗示正常可用、通用手续费优惠或 sponsored registration CTA。先看 Drift 自有官网和更新页，再记录公开文档路径已重定向到不同品牌的协议文档。只要没有 Drift 自有当前来源明确说明，就停在充值、交易、费率、TVL、排名或地区可用性声明之前。",
      reviewedAt: "2026-09-29",
      reviewedLabel: "Drift 自有页面与文档重定向核验于 2026-09-29",
      costFormulaLabel: "行动前来源边界",
      costFormula: "官方 App 状态 + 当前更新公告 + 文档目标 + 账户内可见条款",
      checks: [
        "所有者来源：用 Drift 自有页面核对定位、更新和官方入口。",
        "重定向边界：docs.drift.trade 解析到其他品牌目的地，只能作为提示，不能证明条款等同。",
        "商业停止条件：不要从历史公告推断手续费返还、用户奖励、sponsored registration CTA 或实时充值路径。",
      ],
      boundary: "这里不承诺 Drift 可用性、充值、交易、奖励、sponsored registration、TVL、排名、费率水平、地区资格、文档连续性或最终账户访问。",
      sources: [
        official("Drift official site", "https://www.drift.trade/"),
        official("Drift updates", "https://www.drift.trade/updates"),
        official("Drift Recovery Update · June 2026", "https://www.drift.trade/updates/drift-recovery-update-june-3-2026"),
        official("Drift documentation route", "https://docs.drift.trade/"),
      ],
      internalLinks: [
        internal("比较高速永续平台", "/compare/hyperliquid-vs-dydx"),
        internal("打开衍生品成本词典", "/topics/derivatives#perp-cost-field-dictionary"),
        internal("比较 CEX、DEX 与 Perp DEX 模型", "/news/cex-vs-dex-vs-perp-dex"),
      ],
      faq: [
        faq("打开 Drift 之前应该核对什么？", "先看 Drift 自有页面：官网、更新页和当前 App 入口。如果文档路径重定向到另一个品牌的协议文档，只把它当成来源边界提示；没有新的 Drift 自有说明时，不要把重定向后的机制改写成当前 Drift 条款。", ["https://www.drift.trade/", "https://www.drift.trade/updates", "https://docs.drift.trade/"]),
        faq("恢复公告能证明 Drift 已经正常可用吗？", "不能。已核验的恢复公告讨论的是未补偿用户损失的恢复和重启路径，不能证明当前充值、交易、奖励、TVL、排名、费率或地区资格正常可用。", ["https://www.drift.trade/updates/drift-recovery-update-june-3-2026"]),
        faq("Drift 文档重定向应该怎么处理？", "只把重定向作为文档状态信号。它可以支持研究页给出谨慎提示，但不能写成品牌更名、产品保证或同等用户保护，除非 Drift 自有当前来源明确这样说。", ["https://docs.drift.trade/", "https://www.drift.trade/updates"]),
        faq("NexuAlpha 什么时候应该停止 Drift 的 CTA 路径？", "当 Drift 自有当前来源没有明确确认 App 状态、账户条款、产品可用性、用户权益和风险提示时，应停在充值、交易或 sponsored registration 路径之前。NexuAlpha 可以先引导用户做来源核对，但不应把未验证行动声明做成转化步骤。", ["https://www.drift.trade/", "https://www.drift.trade/updates"]),
      ],
      seoTitle: "Drift 来源边界检查：官网、更新公告与文档重定向",
      seoDescription: "Drift 来源答案：区分 Drift 自有页面、恢复公告、文档重定向状态，以及充值、交易、sponsored registration 前的停止条件。",
    },
    "zh-Hant": {
      title: "Drift 決策檢查：先把官網、更新公告和文件重新導向分開看，再考慮任何儲值或交易動作。",
      body: "Drift 目前應作為有來源邊界的 Solana 場所研究路徑，而不是讓 NexuAlpha 暗示正常可用、通用手續費優惠或 sponsored registration CTA。先看 Drift 自有官網和更新頁，再記錄公開文件路徑已重新導向到不同品牌的協議文件。只要沒有 Drift 自有當前來源明確說明，就停在儲值、交易、費率、TVL、排名或地區可用性聲明之前。",
      reviewedAt: "2026-09-29",
      reviewedLabel: "Drift 自有頁面與文件重新導向核驗於 2026-09-29",
      costFormulaLabel: "行動前來源邊界",
      costFormula: "官方 App 狀態 + 當前更新公告 + 文件目標 + 帳戶內可見條款",
      checks: [
        "所有者來源：用 Drift 自有頁面核對定位、更新和官方入口。",
        "重新導向邊界：docs.drift.trade 解析到其他品牌目的地，只能作為提示，不能證明條款等同。",
        "商業停止條件：不要從歷史公告推斷手續費返還、用戶獎勵、sponsored registration CTA 或即時儲值路徑。",
      ],
      boundary: "這裡不承諾 Drift 可用性、儲值、交易、獎勵、sponsored registration、TVL、排名、費率水準、地區資格、文件連續性或最終帳戶訪問。",
      sources: [
        official("Drift official site", "https://www.drift.trade/"),
        official("Drift updates", "https://www.drift.trade/updates"),
        official("Drift Recovery Update · June 2026", "https://www.drift.trade/updates/drift-recovery-update-june-3-2026"),
        official("Drift documentation route", "https://docs.drift.trade/"),
      ],
      internalLinks: [
        internal("比較高速永續平台", "/compare/hyperliquid-vs-dydx"),
        internal("打開衍生品成本詞典", "/topics/derivatives#perp-cost-field-dictionary"),
        internal("比較 CEX、DEX 與 Perp DEX 模型", "/news/cex-vs-dex-vs-perp-dex"),
      ],
      faq: [
        faq("打開 Drift 之前應該核對什麼？", "先看 Drift 自有頁面：官網、更新頁和當前 App 入口。如果文件路徑重新導向到另一個品牌的協議文件，只把它當成來源邊界提示；沒有新的 Drift 自有說明時，不要把重新導向後的機制改寫成目前 Drift 條款。", ["https://www.drift.trade/", "https://www.drift.trade/updates", "https://docs.drift.trade/"]),
        faq("恢復公告能證明 Drift 已經正常可用嗎？", "不能。已核驗的恢復公告討論的是未補償用戶損失的恢復和重啟路徑，不能證明目前儲值、交易、獎勵、TVL、排名、費率或地區資格正常可用。", ["https://www.drift.trade/updates/drift-recovery-update-june-3-2026"]),
        faq("Drift 文件重新導向應該怎麼處理？", "只把重新導向作為文件狀態信號。它可以支援研究頁給出謹慎提示，但不能寫成品牌更名、產品保證或同等用戶保護，除非 Drift 自有當前來源明確這樣說。", ["https://docs.drift.trade/", "https://www.drift.trade/updates"]),
        faq("NexuAlpha 什麼時候應該停止 Drift 的 CTA 路徑？", "當 Drift 自有當前來源沒有明確確認 App 狀態、帳戶條款、產品可用性、用戶權益和風險提示時，應停在儲值、交易或 sponsored registration 路徑之前。NexuAlpha 可以先引導用戶做來源核對，但不應把未驗證行動聲明做成轉化步驟。", ["https://www.drift.trade/", "https://www.drift.trade/updates"]),
      ],
      seoTitle: "Drift 來源邊界檢查：官網、更新公告與文件重新導向",
      seoDescription: "Drift 來源答案：區分 Drift 自有頁面、恢復公告、文件重新導向狀態，以及儲值、交易、sponsored registration 前的停止條件。",
    },
  },
  deribit: {
    en: {
      title: "Deribit is a specialist options and futures venue; check fees, margin, affiliate entity and migration limits before choosing it.",
      body: "Use Deribit for an options, futures or perpetual route only after confirming the instrument, settlement currency, expiry, trading and delivery fees, margin mode, API environment, liquidation process and account entity. The public affiliate page supports a 10% user trading-fee discount for the first six months only for eligible new users under the covered DRB Panama route; spot is excluded and regional eligibility still decides access.",
      reviewedAt: "2026-09-29",
      reviewedLabel: "Deribit fees, affiliate and migration terms updated September 29, 2026",
      costFormulaLabel: "Deribit instrument and affiliate cost stack",
      costFormula: "instrument fee + eligible six-month user discount if supported + delivery/settlement fee when applicable + liquidation fee risk + margin/API/entity constraints",
      checks: [
        "Best-fit case: options, futures, perpetuals or API-led derivatives workflow where product scope is already understood.",
        "Affiliate boundary: the cited page supports a 10% user trading-fee discount for six months, excludes spot and depends on covered entity plus regional eligibility.",
        "Margin and settlement: standard, portfolio, segregated and cross-collateral modes change how risk is calculated.",
        "Migration boundary: new affiliate creation stops on 2026-09-09 and legacy affiliate onboarding for new users ends on 2027-01-01.",
      ],
      boundary: "This answer does not promise Deribit eligibility, derivatives permission, margin approval, options suitability, API access, fee tier, affiliate attribution, spot discount or final liquidation outcome. NexuAlpha partner economics stay out of public user-facing copy.",
      sources: [
        official("Deribit Fees", "https://support.deribit.com/hc/en-us/articles/25944746248989-Fees"),
        official("Deribit Affiliate Program and migration notice", "https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"),
        official("Deribit Liquidations", "https://support.deribit.com/hc/en-us/articles/25944769313309-Liquidations"),
        official("Deribit Margin Types", "https://support.deribit.com/hc/en-us/articles/25944811317149-Margin-types-and-usage"),
        official("Deribit API documentation", "https://docs.deribit.com/"),
      ],
      internalLinks: [
        internal("Open the derivatives cost dictionary", "/topics/derivatives#perp-cost-field-dictionary"),
        internal("Read options vs perps context", "/topics/tokenized-stocks-vs-perpetuals"),
        internal("Compare high-speed perp venues", "/compare/hyperliquid-vs-dydx"),
      ],
      faq: [
        faq("When is Deribit the right next page to open?", "Open Deribit when the query is about crypto options, futures, perpetuals, margin models, API execution or liquidation mechanics. Deribit documents WebSocket, HTTP and FIX interfaces; confirm the test-versus-production environment before moving an automated strategy to production. If the user wants basic spot buying, fiat onboarding or broad exchange selection, start from the exchange directory or comparison page instead.", ["https://docs.deribit.com/"]),
        faq("What Deribit affiliate benefit is source-supported?", "The cited Deribit affiliate page supports a 10% trading-fee discount for eligible referred users during the first six months, under the covered DRB Panama route. It says Deribit FZE accounts are outside that affiliate setup, spot is excluded and regional eligibility still has to be checked in the official account flow.", ["https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"]),
        faq("Which Deribit cost should I check before trading options?", "For options, compare the options fee rule, premium-based caps where shown, settlement or delivery cost, margin mode, any source-supported user discount and liquidation path. A futures, perpetual or spot fee does not describe the full options cost.", ["https://support.deribit.com/hc/en-us/articles/25944746248989-Fees", "https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"]),
        faq("How should I read Deribit liquidation risk?", "Deribit describes incremental auto-liquidation and says users do not control the account during the process. Treat liquidation fees, margin usage, collateral model and possible portfolio-margin hedges as separate risk checks from the entry order.", ["https://support.deribit.com/hc/en-us/articles/25944769313309-Liquidations", "https://support.deribit.com/hc/en-us/articles/25944811317149-Margin-types-and-usage"]),
        faq("What changes after the Deribit affiliate migration dates?", "Treat 2026-09-09 as the stop date for creating new affiliates and 2027-01-01 as the stop date for onboarding new users through legacy affiliate links, based on the cited notice. Recheck entity, region and attribution before treating an old readable link as current.", ["https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"]),
      ],
      // CTR pass 2026-10-13 (GSC 28 d: position 12.2, 17 impressions, 0 clicks; "deribit fees", "deribit mark price").
      seoTitle: "Deribit Fees (2026): Options, Futures and 10% Discount",
      seoDescription: "Deribit options and futures fees, the six-month 10% discount for referred users, DRB Panama vs FZE limits, margin modes and how liquidation works.",
    },
    "zh-Hans": {
      title: "Deribit 决策检查：先确认产品、保证金、affiliate 实体和迁移限制，再把它当作专业衍生品平台使用。",
      body: "Deribit 更适合研究期权、交割合约或永续等专业衍生品路径，而不是只做普通现货开户注册。公开 affiliate 页面支持的受邀用户权益，是适用 DRB Panama 路径的新用户前六个月 10% 交易手续费折扣；Deribit FZE、地区资格和账户流程仍需核对，现货不适用。",
      reviewedAt: "2026-09-29",
      reviewedLabel: "Deribit 费率、affiliate 与迁移条款更新于 2026-09-29",
      costFormulaLabel: "Deribit 工具与 affiliate 成本组合",
      costFormula: "工具交易费 + 来源支持的前六个月用户折扣 + 适用时的交割/结算费 + 清算费用风险 + 保证金/API/实体限制",
      checks: [
        "适用场景：期权、交割合约、永续或 API 衍生品流程，且已理解产品范围。",
        "Affiliate 边界：来源支持前六个月 10% 用户交易手续费折扣，排除现货，并取决于适用实体和地区资格。",
        "保证金与结算：标准、组合、逐仓隔离和跨抵押模式会改变风险计算。",
        "迁移边界：2026-09-09 停止创建新 affiliate；2027-01-01 起旧 affiliate 链接不再用于新用户归因开户。",
      ],
      boundary: "这里不承诺 Deribit 可用性、衍生品权限、保证金批准、期权适合性、API 访问、费率等级、affiliate 归因、现货折扣或最终清算结果；NexuAlpha 合作方经济条件不进入公开用户文案。",
      sources: [
        official("Deribit Fees", "https://support.deribit.com/hc/en-us/articles/25944746248989-Fees"),
        official("Deribit Affiliate Program and migration notice", "https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"),
        official("Deribit Liquidations", "https://support.deribit.com/hc/en-us/articles/25944769313309-Liquidations"),
        official("Deribit Margin Types", "https://support.deribit.com/hc/en-us/articles/25944811317149-Margin-types-and-usage"),
        official("Deribit API documentation", "https://docs.deribit.com/"),
      ],
      internalLinks: [
        internal("打开衍生品成本词典", "/topics/derivatives#perp-cost-field-dictionary"),
        internal("阅读期权与永续背景", "/topics/tokenized-stocks-vs-perpetuals"),
        internal("比较高速永续平台", "/compare/hyperliquid-vs-dydx"),
      ],
      faq: [
        faq("什么情况下适合继续打开 Deribit？", "当用户明确在研究期权、交割合约、永续、API 执行或专业衍生品风险控制时，Deribit 才是强相关下一页。Deribit 文档覆盖 WebSocket、HTTP 和 FIX 接口；把自动化策略迁移到生产环境前，应确认测试与生产环境。如果只是简单现货入金，Deribit 档案更多是背景，不是最短路径。", ["https://docs.deribit.com/"]),
        faq("Deribit affiliate 来源支持什么用户权益？", "已引用的 Deribit affiliate 页面支持合资格受邀用户前六个月 10% 交易手续费折扣，适用于覆盖的 DRB Panama 路径。页面同时说明 Deribit FZE 账户不在该 affiliate 设置内、现货不适用，地区资格仍需在官方账户流程里核对。", ["https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"]),
        faq("交易 Deribit 期权前要看哪些成本？", "期权要比较期权费用规则、页面列出的权利金上限、结算或交割成本、保证金模式、来源支持的用户折扣和清算路径。合约、永续或现货费率不能说明完整期权成本。", ["https://support.deribit.com/hc/en-us/articles/25944746248989-Fees", "https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"]),
        faq("Deribit 清算风险应该怎么理解？", "Deribit 说明其采用增量自动清算，并且清算期间用户不能控制账户。清算费用、保证金使用率、抵押模式和组合保证金下的对冲处理，都应作为独立风险检查。", ["https://support.deribit.com/hc/en-us/articles/25944769313309-Liquidations", "https://support.deribit.com/hc/en-us/articles/25944811317149-Margin-types-and-usage"]),
        faq("Deribit affiliate 迁移日期之后有什么变化？", "按已引用公告处理：2026-09-09 是停止创建新 affiliate 的日期，2027-01-01 是旧 affiliate 链接停止用于新用户归因开户的日期。旧页面仍可读取，不等于实体、地区和归因仍然有效。", ["https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"]),
      ],
      seoTitle: "Deribit 期权费用、10% 用户折扣、迁移日期与实体检查",
      seoDescription: "Deribit 决策清单，区分期权、合约费用、前六个月 10% 用户折扣、DRB Panama/FZE 实体、现货排除、迁移日期、保证金与清算边界。",
    },
    "zh-Hant": {
      title: "Deribit 決策檢查：先確認產品、保證金、affiliate 實體和遷移限制，再把它當作專業衍生品平台使用。",
      body: "Deribit 更適合研究期權、交割合約或永續等專業衍生品路徑，而不是只做普通現貨開戶註冊。公開 affiliate 頁面支援的受邀用戶權益，是適用 DRB Panama 路徑的新用戶前六個月 10% 交易手續費折扣；Deribit FZE、地區資格和帳戶流程仍需核對，現貨不適用。",
      reviewedAt: "2026-09-29",
      reviewedLabel: "Deribit 費率、affiliate 與遷移條款更新於 2026-09-29",
      costFormulaLabel: "Deribit 工具與 affiliate 成本組合",
      costFormula: "工具交易費 + 來源支援的前六個月用戶折扣 + 適用時的交割/結算費 + 清算費用風險 + 保證金/API/實體限制",
      checks: [
        "適用場景：期權、交割合約、永續或 API 衍生品流程，且已理解產品範圍。",
        "Affiliate 邊界：來源支援前六個月 10% 用戶交易手續費折扣，排除現貨，並取決於適用實體和地區資格。",
        "保證金與結算：標準、組合、逐倉隔離和跨抵押模式會改變風險計算。",
        "遷移邊界：2026-09-09 停止建立新 affiliate；2027-01-01 起舊 affiliate 連結不再用於新用戶歸因開戶。",
      ],
      boundary: "這裡不承諾 Deribit 可用性、衍生品權限、保證金批准、期權適合性、API 訪問、費率等級、affiliate 歸因、現貨折扣或最終清算結果；NexuAlpha 合作方經濟條件不進入公開用戶文案。",
      sources: [
        official("Deribit Fees", "https://support.deribit.com/hc/en-us/articles/25944746248989-Fees"),
        official("Deribit Affiliate Program and migration notice", "https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"),
        official("Deribit Liquidations", "https://support.deribit.com/hc/en-us/articles/25944769313309-Liquidations"),
        official("Deribit Margin Types", "https://support.deribit.com/hc/en-us/articles/25944811317149-Margin-types-and-usage"),
        official("Deribit API documentation", "https://docs.deribit.com/"),
      ],
      internalLinks: [
        internal("打開衍生品成本詞典", "/topics/derivatives#perp-cost-field-dictionary"),
        internal("閱讀期權與永續背景", "/topics/tokenized-stocks-vs-perpetuals"),
        internal("比較高速永續平台", "/compare/hyperliquid-vs-dydx"),
      ],
      faq: [
        faq("什麼情況下適合繼續打開 Deribit？", "當用戶明確在研究期權、交割合約、永續、API 執行或專業衍生品風險控制時，Deribit 才是強相關下一頁。Deribit 文件涵蓋 WebSocket、HTTP 和 FIX 介面；把自動化策略遷移到生產環境前，應確認測試與生產環境。如果只是簡單現貨入金，Deribit 檔案更多是背景，不是最短路徑。", ["https://docs.deribit.com/"]),
        faq("Deribit affiliate 來源支援什麼用戶權益？", "已引用的 Deribit affiliate 頁面支援合資格受邀用戶前六個月 10% 交易手續費折扣，適用於覆蓋的 DRB Panama 路徑。頁面同時說明 Deribit FZE 帳戶不在該 affiliate 設定內、現貨不適用，地區資格仍需在官方帳戶流程裡核對。", ["https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"]),
        faq("交易 Deribit 期權前要看哪些成本？", "期權要比較期權費用規則、頁面列出的權利金上限、結算或交割成本、保證金模式、來源支援的用戶折扣和清算路徑。合約、永續或現貨費率不能說明完整期權成本。", ["https://support.deribit.com/hc/en-us/articles/25944746248989-Fees", "https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"]),
        faq("Deribit 清算風險應該怎麼理解？", "Deribit 說明其採用增量自動清算，並且清算期間用戶不能控制帳戶。清算費用、保證金使用率、抵押模式和組合保證金下的對沖處理，都應作為獨立風險檢查。", ["https://support.deribit.com/hc/en-us/articles/25944769313309-Liquidations", "https://support.deribit.com/hc/en-us/articles/25944811317149-Margin-types-and-usage"]),
        faq("Deribit affiliate 遷移日期之後有什麼變化？", "按已引用公告處理：2026-09-09 是停止建立新 affiliate 的日期，2027-01-01 是舊 affiliate 連結停止用於新用戶歸因開戶的日期。舊頁面仍可讀取，不等於實體、地區和歸因仍然有效。", ["https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"]),
      ],
      seoTitle: "Deribit 期權費用、10% 用戶折扣、遷移日期與實體檢查",
      seoDescription: "Deribit 決策清單，區分期權、合約費用、前六個月 10% 用戶折扣、DRB Panama/FZE 實體、現貨排除、遷移日期、保證金與清算邊界。",
    },
  },
};

// Supplemental market-language pages can graduate independently from the
// canonical three-locale priority set above. Keep them addressable by slug
// without changing Object.keys(priorityVenueAnswers), which release tests use
// as the current fully-reviewed venue set.
Object.defineProperty(priorityVenueAnswers, "binance", {
  enumerable: false,
  configurable: false,
  writable: false,
  value: priorityVenueAnswers.binance,
});

export function priorityVenueAnswerFor(slug, locale = "en") {
  const record = priorityVenueAnswers[slug];
  const normalizedLocale = normalizePriorityLocale(locale);
  if (!record || !normalizedLocale || !supportedLocales.has(normalizedLocale)) return null;
  const answer = record[normalizedLocale];
  if (!answer) return null;
  return {
    slug,
    locale: normalizedLocale,
    ownerQuestion: ownerQuestionByVenue[slug]?.[normalizedLocale] || answer.title,
    primaryNextAction: primaryNextActionByVenue[slug]?.[normalizedLocale] || answer.internalLinks?.[0] || null,
    ...answer,
  };
}

export { normalizePriorityLocale };

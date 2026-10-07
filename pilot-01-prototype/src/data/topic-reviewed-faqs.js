// R100: reviewed source snapshots, not live eligibility or recovery evidence.
// Source timestamps come from the bounded source map and browser evidence.
export const REVIEWED_TOPIC_FAQS = {
  "meme-coins": [
    {
      "id": "r100-meme-coins-1",
      "qEn": "Why trade meme coins on MEXC and Gate.io instead of Binance?",
      "aEn": "Do not assume one venue is better because it lists a token earlier. Verify the token identity and usable pair, then inspect liquidity, deposit and withdrawal networks through the intended venue's official information. Check that venue's identity and regional terms before depositing; these checks do not establish that MEXC, Gate.io or Binance is best for your account.",
      "qZh": "交易迷因币时，为什么考虑 MEXC、Gate.io 而不是 Binance？",
      "aZh": "不要因为某个平台更早上线代币，就认定它更适合交易。先核验代币身份和可用交易对，再通过目标平台的官方信息检查流动性、充值及提现网络。充值前核对该平台的身份和地区条款；这些检查不能证明 MEXC、Gate.io 或 Binance 最适合你的账户。",
      "qHant": "交易迷因幣時，為什麼考慮 MEXC、Gate.io 而非 Binance？",
      "aHant": "不要因為某個平台較早上架代幣，就認定它更適合交易。先核實代幣身分與可用交易對，再透過目標平台的官方資訊，檢查流動性、入金與提領網路。入金前應查閱該平台的身分與所在地條款；這些檢查無法證明 MEXC、Gate.io 或 Binance 最適合你的帳戶。",
      "sources": [
        {
          "url": "https://www.mexc.com/announcements/article/user-agreement-360031501631",
          "label": "MEXC User Agreement",
          "reviewedAt": "2026-10-02T01:15:59Z",
          "updatedAt": "2023-08-22"
        },
        {
          "url": "https://docs.raydium.io/getting-started/first-swap",
          "label": "Raydium Your first swap",
          "reviewedAt": "2026-10-02T01:19:05Z",
          "updatedAt": null
        }
      ],
      "answerBoundary": "Read-source facts plus editorial verification advice; no live account eligibility, numeric fees, universal safety or demonstrated recovery claim. Original-answer status is unchanged. MEXC identity/region and Raydium mint checks supported; Gate/Binance pair, depth and network comparison not independently verified. Checklist is editorial guidance, not a comparative superiority finding."
    },
    {
      "id": "r100-meme-coins-2",
      "qEn": "How to avoid MEV sandwich attacks on DEXs like Raydium?",
      "aEn": "Raydium documents checks for quoted output, price impact, routing and slippage. It warns that excessive slippage tolerance can invite sandwich attacks, so review these details before signing. A selected tolerance does not remove MEV risk, and these sources establish no universal safe threshold.",
      "qZh": "在 Raydium 等去中心化交易所交易时，如何降低夹子攻击风险？",
      "aZh": "Raydium 官方文档要求检查报价中的预期到账数量、价格影响、交易路径和滑点。文档提醒，过大的滑点容忍度可能招致夹子攻击，因此签名前应核对这些信息。设置滑点容忍度不能消除交易排序套利风险，这些来源也没有给出普遍适用的安全阈值。",
      "qHant": "在 Raydium 等去中心化交易所交易時，如何降低夾擊交易的風險？",
      "aHant": "Raydium 官方文件列出預計收到的數量、價格衝擊、交易路徑與滑價的檢查項目。文件提醒，過大的滑價容許範圍可能招致夾擊交易，因此簽署前應確認這些資訊。設定滑價容許範圍無法消除交易排序套利風險，這些來源也未提供普遍適用的安全門檻。",
      "sources": [
        {
          "url": "https://docs.raydium.io/getting-started/first-swap",
          "label": "Raydium Your first swap",
          "reviewedAt": "2026-10-02T01:19:05Z",
          "updatedAt": null
        }
      ],
      "answerBoundary": "Read-source facts plus editorial verification advice; no live account eligibility, numeric fees, universal safety or demonstrated recovery claim. Original-answer status is unchanged. No universal threshold established. Private RPC or MEV tooling efficacy was not verified; omit that clause and numerical thresholds."
    },
    {
      "id": "r100-meme-coins-3",
      "qEn": "What risks should be checked before exiting a meme coin position?",
      "aEn": "Before selling, verify the token mint address, expected output, route, price impact and slippage using the official swap documentation and quote. If using a centralized venue afterward, separately review its withdrawal and identity terms. A swap quote does not establish a fiat cash-out route.",
      "qZh": "退出迷因币持仓前，应检查哪些风险？",
      "aZh": "卖出前，根据官方兑换文档和报价，核验代币铸造地址、预期到账数量、交易路径、价格影响及滑点。如果随后使用中心化平台，应另外核对该平台的提现和身份条款。兑换报价不能证明已经具备法币出金路径。",
      "qHant": "退出迷因幣持倉前，應檢查哪些風險？",
      "aHant": "賣出前，應依官方兌換文件與報價，核實代幣鑄造地址、預計收到的數量、交易路徑、價格衝擊及滑價。若之後使用中心化平台，應另外查閱該平台的提領與身分條款。兌換報價無法證明已具備法幣出金路徑。",
      "sources": [
        {
          "url": "https://docs.raydium.io/getting-started/first-swap",
          "label": "Raydium Your first swap",
          "reviewedAt": "2026-10-02T01:19:05Z",
          "updatedAt": null
        },
        {
          "url": "https://www.mexc.com/announcements/article/user-agreement-360031501631",
          "label": "MEXC User Agreement",
          "reviewedAt": "2026-10-02T01:15:59Z",
          "updatedAt": "2023-08-22"
        }
      ],
      "answerBoundary": "Read-source facts plus editorial verification advice; no live account eligibility, numeric fees, universal safety or demonstrated recovery claim. Original-answer status is unchanged. Bank approval, AML/source-of-funds requirements and all-venue exit conditions are not established by these sources. Remove specific bank claim until route-specific official material is read."
    }
  ],
  "derivatives": [
    {
      "id": "r100-derivatives-1",
      "qEn": "What is a crypto perpetual platform, and what should be compared first?",
      "aEn": "Perpetual contracts have no fixed expiry. Compare each venue's funding, collateral, margin and liquidation documentation. Then check its official fees and access terms before opening an account or connecting a wallet; those values and eligibility must be verified for your intended venue.",
      "qZh": "什么是加密永续合约平台，应该先比较什么？",
      "aZh": "永续合约没有固定到期日。应比较各平台关于资金费、抵押资产、保证金和清算机制的官方文档。开户或连接钱包前，再核对官方费用及使用条款；具体费率和资格需针对目标平台核验。",
      "qHant": "什麼是加密永續合約平台，應該先比較什麼？",
      "aHant": "永續合約沒有固定到期日。應比較各平台關於資金費、抵押資產、保證金與清算機制的官方文件。開戶或連接錢包前，再查閱官方費用與使用條款；具體費率及資格須針對目標平台核實。",
      "sources": [
        {
          "url": "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/contract-specifications",
          "label": "Hyperliquid Contract specifications",
          "reviewedAt": "2026-10-02T01:19:05Z",
          "updatedAt": null
        },
        {
          "url": "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations",
          "label": "Hyperliquid Liquidations",
          "reviewedAt": "2026-10-02T01:19:05Z",
          "updatedAt": null
        },
        {
          "url": "https://www.mexc.com/announcements/article/user-agreement-360031501631",
          "label": "MEXC User Agreement",
          "reviewedAt": "2026-10-02T01:15:59Z",
          "updatedAt": "2023-08-22"
        }
      ],
      "answerBoundary": "Read-source facts plus editorial verification advice; no live account eligibility, numeric fees, universal safety or demonstrated recovery claim. Original-answer status is unchanged. Definition/mechanics supported; fees and platform-wide identity eligibility remain checks, not verified values."
    },
    {
      "id": "r100-derivatives-2",
      "qEn": "Can Hyperliquid traders face socialized clawback or slippage?",
      "aEn": "Hyperliquid documents auto-deleveraging when an account or isolated position becomes negative: profitable positions on the opposite side may be closed according to ranking. This is position closure through ADL, not an indiscriminate cash-loss charge to every user. Its liquidation process also uses market orders, so order-book liquidity affects execution and slippage remains a risk. Review the official ADL and liquidation rules; neither mechanism removes trading risk.",
      "qZh": "Hyperliquid 交易者是否可能遇到穿仓损失分摊或滑点？",
      "aZh": "Hyperliquid 官方文档说明，当账户或逐仓仓位出现负值时，可能触发自动减仓：盈利的对侧仓位可能按排名被关闭。这是通过自动减仓关闭仓位，不是向所有用户无差别摊派现金损失。其清算流程还使用市价单，因此订单簿流动性会影响成交，滑点仍是风险。应核对官方自动减仓和清算规则；这两种机制都不能消除交易风险。",
      "qHant": "Hyperliquid 交易者是否可能遇到穿倉損失分攤或滑價？",
      "aHant": "Hyperliquid 官方文件說明，當帳戶或逐倉部位出現負值時，可能觸發自動減倉：獲利的對側部位可能依排名被平倉。這是透過自動減倉關閉部位，並非向所有使用者無差別分攤現金損失。其清算流程也使用市價單，因此委託簿流動性會影響成交，滑價仍是一項風險。應查閱官方自動減倉與清算規則；這兩種機制都無法消除交易風險。",
      "sources": [
        {
          "url": "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/auto-deleveraging",
          "label": "Hyperliquid Auto-deleveraging",
          "reviewedAt": "2026-10-02T01:19:05Z",
          "updatedAt": null
        },
        {
          "url": "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations",
          "label": "Hyperliquid Liquidations",
          "reviewedAt": "2026-10-02T01:19:05Z",
          "updatedAt": null
        }
      ],
      "answerBoundary": "Read-source facts plus editorial verification advice; no live account eligibility, numeric fees, universal safety or demonstrated recovery claim. Original-answer status is unchanged. Original omits direct ADL answer. ADL is not an indiscriminate cash clawback from every user. Slippage is an inference from market execution/book liquidity, not a quantified guarantee."
    },
    {
      "id": "r100-derivatives-3",
      "qEn": "Does funding-rate arbitrage eliminate risk?",
      "aEn": "No; Bybit's arbitrage documentation warns that partial fills can leave uneven exposure and liquidation risk, while market rebalancing can execute away from the intended price. Funding direction can also change, as Hyperliquid's funding documentation describes. Evaluate both legs, margin and execution costs, including how to close the positions, rather than assuming a neutral position will produce a profit.",
      "qZh": "资金费率套利是否消除了风险？",
      "aZh": "不能；Bybit 的套利文档提醒，部分成交可能导致两端敞口不平衡和强平风险，而以市价重新平衡仓位时，成交价可能偏离预期。Hyperliquid 的资金费文档也说明，资金费支付方向可能改变。应评估两端持仓、保证金和成交成本，包括如何平仓，不能假定中性持仓就会盈利。",
      "qHant": "資金費率套利是否消除了風險？",
      "aHant": "不能；Bybit 的套利文件提醒，部分成交可能造成兩端曝險不平衡與強制平倉風險，而以市價重新平衡部位時，成交價可能偏離預期。Hyperliquid 的資金費文件也說明，資金費支付方向可能改變。應評估兩端部位、保證金與成交成本，包括如何平倉，不能假設中性部位就會獲利。",
      "sources": [
        {
          "url": "https://www.bybit.com/en/help-center/article/Arbitrage-Trading",
          "label": "Bybit Introduction to Arbitrage",
          "reviewedAt": "2026-10-02T01:15:59Z",
          "updatedAt": "2026-09-14"
        },
        {
          "url": "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding",
          "label": "Hyperliquid Funding",
          "reviewedAt": "2026-10-02T01:16:18Z",
          "updatedAt": null
        },
        {
          "url": "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations",
          "label": "Hyperliquid Liquidations",
          "reviewedAt": "2026-10-02T01:19:05Z",
          "updatedAt": null
        }
      ],
      "answerBoundary": "Read-source facts plus editorial verification advice; no live account eligibility, numeric fees, universal safety or demonstrated recovery claim. Original-answer status is unchanged. Cross-venue transfer, custody and broad basis-risk list were not separately sourced. Narrow answer to documented execution, liquidation and variable funding mechanics."
    }
  ],
  "no-kyc": [
    {
      "id": "r100-no-kyc-1",
      "qEn": "Is capital truly safe on no-KYC DEXs like Hyperliquid?",
      "aEn": "Wallet signing does not establish the safety of capital. Hyperliquid's documentation covers compromised-key risks, oracle-dependent pricing and liquidations. Its native USDC, CCTP and legacy-bridge paths also differ, so identify your asset path and review the relevant official documentation before funding.",
      "qZh": "无需初始身份验证的去中心化交易所（如 Hyperliquid），本金真的安全吗？",
      "aZh": "钱包签名不能证明资金安全。Hyperliquid 官方文档说明了私钥泄露风险、依赖预言机的定价和清算机制。其原生 USDC、CCTP 与旧版跨链桥的资产路径也有所不同，因此转入资金前，应先确认所用资产路径并查阅相应官方文档。",
      "qHant": "不需初始身分驗證的去中心化交易所（如 Hyperliquid），本金真的安全嗎？",
      "aHant": "錢包簽署無法證明資金安全。Hyperliquid 官方文件說明了私鑰遭竊風險、依賴預言機的定價與清算機制。其原生 USDC、CCTP 與舊版跨鏈橋的資產路徑也有所不同，因此入金前應先確認所用資產路徑，並查閱相應的官方文件。",
      "sources": [
        {
          "url": "https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/i-got-scammed-hacked",
          "label": "Hyperliquid I got scammed/hacked",
          "reviewedAt": "2026-10-02T01:16:18Z",
          "updatedAt": null
        },
        {
          "url": "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/oracle",
          "label": "Hyperliquid Oracle",
          "reviewedAt": "2026-10-02T01:17:18Z",
          "updatedAt": null
        },
        {
          "url": "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations",
          "label": "Hyperliquid Liquidations",
          "reviewedAt": "2026-10-02T01:19:05Z",
          "updatedAt": null
        },
        {
          "url": "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc",
          "label": "Hyperliquid USDC",
          "reviewedAt": "2026-10-02T01:17:18Z",
          "updatedAt": null
        }
      ],
      "answerBoundary": "Read-source facts plus editorial verification advice; no live account eligibility, numeric fees, universal safety or demonstrated recovery claim. Original-answer status is unchanged. Self-custody relative-risk reduction is inference; smart-contract/frontend risk enumeration not comprehensively documented here. No security audit or capital-safety certification claimed."
    },
    {
      "id": "r100-no-kyc-2",
      "qEn": "Will an email-registered CEX suddenly demand KYC during withdrawal?",
      "aEn": "It can; MEXC's agreement allows requests for additional identity documents and changes to withdrawal controls. Email registration alone does not establish withdrawal eligibility. Check the official terms and the requirements displayed for your account before depositing; this documented example does not predict the outcome for every centralized exchange.",
      "qZh": "只用邮箱注册的中心化交易所，会在提现时要求身份验证吗？",
      "aZh": "有可能；MEXC 的协议允许平台要求补充身份证明材料，并调整提现控制。仅完成邮箱注册，不能证明具备提现资格。充值前应核对官方条款和账户显示的要求；这一有文档支持的例子不能预测所有中心化交易所的处理结果。",
      "qHant": "僅以電子郵件註冊的中心化交易所，會在提領時要求身分驗證嗎？",
      "aHant": "有可能；MEXC 的協議允許平台要求補充身分證明文件，並調整提領管制。僅完成電子郵件註冊，無法證明具備提領資格。入金前應查閱官方條款與帳戶顯示的要求；這項有文件支持的例子無法預測所有中心化交易所的處理結果。",
      "sources": [
        {
          "url": "https://www.mexc.com/announcements/article/user-agreement-360031501631",
          "label": "MEXC User Agreement",
          "reviewedAt": "2026-10-02T01:15:59Z",
          "updatedAt": "2023-08-22"
        }
      ],
      "answerBoundary": "Read-source facts plus editorial verification advice; no live account eligibility, numeric fees, universal safety or demonstrated recovery claim. Original-answer status is unchanged. MEXC-specific documented example supports may, not prediction that every CEX suddenly demands KYC. No live account eligibility or withdrawal limits verified."
    },
    {
      "id": "r100-no-kyc-3",
      "qEn": "How do I withdraw if a DEX frontend is blocked or goes down?",
      "aEn": "Recovery depends on the protocol and asset path. Hyperliquid documents a signed withdrawal flow involving validators and a bridge, but that does not establish availability during a frontend or infrastructure outage. Verify official addresses and signing instructions; do not assume a universal emergency withdrawal exists or apply the legacy flow to native USDC, CCTP or another DEX.",
      "qZh": "如果去中心化交易所前端被封锁或无法访问，如何提取资产？",
      "aZh": "恢复方式取决于协议和资产路径。Hyperliquid 文档说明了一种涉及验证者和跨链桥的签名提现流程，但这不能证明前端或基础设施故障期间该流程仍可用。应核验官方地址和签名说明；不能假设普遍存在紧急提现功能，也不能把旧版流程套用于原生 USDC、CCTP 或其他去中心化交易所。",
      "qHant": "若去中心化交易所的前端遭封鎖或無法使用，如何提領資產？",
      "aHant": "恢復方式取決於協議與資產路徑。Hyperliquid 文件說明了一種涉及驗證者與跨鏈橋的簽署提領流程，但這無法證明前端或基礎設施故障期間該流程仍可使用。應核實官方地址與簽署說明；不能假設普遍存在緊急提領功能，也不能將舊版流程套用至原生 USDC、CCTP 或其他去中心化交易所。",
      "sources": [
        {
          "url": "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint",
          "label": "Hyperliquid Exchange endpoint",
          "reviewedAt": "2026-10-02T01:16:18Z",
          "updatedAt": null
        },
        {
          "url": "https://hyperliquid.gitbook.io/hyperliquid-docs/support/faq/i-got-scammed-hacked",
          "label": "Hyperliquid I got scammed/hacked",
          "reviewedAt": "2026-10-02T01:16:18Z",
          "updatedAt": null
        },
        {
          "url": "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc",
          "label": "Hyperliquid USDC",
          "reviewedAt": "2026-10-02T01:17:18Z",
          "updatedAt": null
        }
      ],
      "answerBoundary": "Read-source facts plus editorial verification advice; no live account eligibility, numeric fees, universal safety or demonstrated recovery claim. Original-answer status is unchanged. No API request sent. No outage recovery tested. Legacy withdrawal flow cannot be generalized to native USDC/CCTP or other DEXs; no explorer-call recipe provided."
    },
    {
      "id": "r100-no-kyc-4",
      "qEn": "Does wallet access mean there are no risk controls or regional limits?",
      "aEn": "No; connecting a wallet does not establish eligibility to use Hyperliquid's official Interface. Its official Interface terms bind users when they connect a wallet and prohibit Restricted Persons from using the Interface. They also prohibit concealing location or circumventing restrictions. These are Interface terms; they do not establish identical restrictions across the underlying protocol, other frontends or your individual eligibility.",
      "qZh": "钱包连接是否意味着没有风控或地区限制？",
      "aZh": "不是；连接钱包不能证明具备使用 Hyperliquid 官方界面的资格。官方界面条款在用户连接钱包时对其生效，并禁止受限人员使用该界面。条款还禁止隐瞒所在地或规避限制。这些是界面条款，不能据此认定底层协议、其他前端均实行相同限制，也不能确认你的个人使用资格。",
      "qHant": "連接錢包是否代表沒有風險控管或地區限制？",
      "aHant": "不是；連接錢包無法證明具備使用 Hyperliquid 官方介面的資格。官方介面條款於使用者連接錢包時對其生效，並禁止受限人士使用該介面。條款也禁止隱瞞所在地或規避限制。這些是介面條款，不能據此認定底層協議、其他前端均實行相同限制，也不能確認你的個人使用資格。",
      "sources": [
        {
          "url": "https://app.hyperliquid.xyz/terms",
          "label": "Hyperliquid Terms — official interface, Chrome browser evidence",
          "reviewedAt": "2026-10-02T01:21:36.687Z",
          "updatedAt": "2026-06-15"
        }
      ],
      "answerBoundary": "Official Hyperliquid interface only; no country-list, personal eligibility, contract enforcement or universal protocol claim. Browser evidence supplied by root and read from the proof file. Official Interface terms are readable in the browser supplement. Interface restrictions cannot be generalized to the underlying protocol, other frontends or personal eligibility."
    }
  ]
};

const REVIEWED_FAQ_OWNERS = ["meme-coins", "derivatives", "no-kyc"];
const REVIEWED_FAQ_LOCALES = {
  en: ["qEn", "aEn"],
  "zh-Hans": ["qZh", "aZh"],
  "zh-Hant": ["qHant", "aHant"],
};

function requireText(value, field, id) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid reviewed FAQ ${id}: ${field} must be nonempty text`);
  }
}

function validUtcTimestamp(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 19) === value.slice(0, 19);
}

function validUpdatedAt(value) {
  if (value === null) return true;
  if (validUtcTimestamp(value)) return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

function validateRecord(record, slug, index) {
  if (!record || record.id !== `r100-${slug}-${index + 1}`) {
    throw new Error(`Invalid reviewed FAQ identifier for ${slug}:${index}`);
  }
  for (const field of ["qEn", "aEn", "qZh", "aZh", "qHant", "aHant", "answerBoundary"]) {
    requireText(record[field], field, record.id);
  }
  if (!Array.isArray(record.sources) || !record.sources.length) {
    throw new Error(`Invalid reviewed FAQ ${record.id}: sources are required`);
  }
  for (const source of record.sources) {
    if (!source || typeof source !== "object") throw new Error(`Invalid source for ${record.id}`);
    requireText(source.label, "source.label", record.id);
    requireText(source.url, "source.url", record.id);
    let url;
    try { url = new URL(source.url); } catch { throw new Error(`Invalid source URL for ${record.id}`); }
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
      throw new Error(`Invalid source URL for ${record.id}`);
    }
    if (!validUtcTimestamp(source.reviewedAt)) throw new Error(`Invalid reviewedAt for ${record.id}`);
    if (!validUpdatedAt(source.updatedAt)) throw new Error(`Invalid updatedAt for ${record.id}`);
  }
}

export function topicReviewedFaqRecords(slug, locale) {
  if (!REVIEWED_FAQ_OWNERS.includes(slug) || !Object.hasOwn(REVIEWED_FAQ_LOCALES, locale)) return [];
  const records = REVIEWED_TOPIC_FAQS[slug];
  if (!Array.isArray(records) || !records.length) throw new Error(`Missing reviewed FAQs for ${slug}`);
  const [questionField, answerField] = REVIEWED_FAQ_LOCALES[locale];
  return records.map((record, index) => {
    validateRecord(record, slug, index);
    return {
      id: record.id,
      question: record[questionField],
      answer: record[answerField],
      sources: record.sources.map(source => ({ ...source })),
      answerBoundary: record.answerBoundary,
    };
  });
}

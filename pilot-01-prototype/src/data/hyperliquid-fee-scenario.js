const feesSource = 'https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees';
// Independent read-only editorial snapshot; no account or partner configuration.
export const hyperliquidFeeSnapshot = Object.freeze({
  sourceHref: feesSource,
  reviewedAt: '2026-10-02T02:01:16Z',
  documentUpdatedAt: null,
  product: 'perpetuals',
  scope: 'validator-operated-tier-0',
  rates: Object.freeze({ maker: 0.00015, taker: 0.00045 }),
});

export function calculateHyperliquidFeeScenario({ amount, liquidity, fills } = {}, snapshot = hyperliquidFeeSnapshot) {
  if (!snapshot || snapshot.sourceHref !== feesSource || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(snapshot.reviewedAt || '') || !Number.isFinite(Date.parse(snapshot.reviewedAt)) || new Date(snapshot.reviewedAt).toISOString().replace('.000Z', 'Z') !== snapshot.reviewedAt || snapshot.product !== 'perpetuals' || snapshot.scope !== 'validator-operated-tier-0' || snapshot.rates?.maker !== 0.00015 || snapshot.rates?.taker !== 0.00045) return { status: 'unavailable' };
  if (typeof amount !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(amount) || !['maker', 'taker'].includes(liquidity) || ![1, 2].includes(fills)) return { status: 'invalid-input' };
  const notionalUsd = Number(amount);
  if (!Number.isFinite(notionalUsd) || notionalUsd <= 0 || notionalUsd > 1e9) return { status: 'invalid-input' };
  // Integer cents and integer millionths preserve the minimum USD cent scenario.
  const cents = Math.round(notionalUsd * 100);
  const rateMillionths = liquidity === 'maker' ? 150 : 450;
  return { status: 'ready', notionalUsd, liquidity, fills, rate: snapshot.rates[liquidity], feeUsd: cents * rateMillionths * fills / 100000000 };
}

export function formatHyperliquidFee(feeUsd, locale) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 8 }).format(feeUsd);
}

const copy = Object.freeze({
  en: Object.freeze({ title: 'Try a perpetual trading-fee scenario', intro: 'Hypothetical USD fill notional, not margin. This arithmetic uses standard validator-operated perpetuals at Tier 0: maker 0.015%, taker 0.045%. It is not an official worked example, live quote or account rate.', amount: 'Notional per fill (USD)', inputHelp: 'Greater than 0 and up to 1,000,000,000; at most two decimal places. Use a decimal point, without commas.', liquidity: 'Fill type', maker: 'Maker · 0.015%', taker: 'Taker · 0.045%', fills: 'Number of fills', one: 'One fill', two: 'Two fills at the same notional (assumption)', result: 'Trading fee only', invalid: 'Enter a USD amount greater than 0 and up to 1,000,000,000, with at most two decimal places; no commas or exponents.', unavailable: 'The reviewed fee source or rates are unavailable. No estimate can be shown.', formula: 'Notional per fill × rate × fill count', boundary: 'Funding, spread/slippage, transfers and liquidation costs are unknown here, not zero, and are excluded. HIP-3, growth/aligned markets, staking, referral discounts and builder fees are outside this scenario. Account-specific conditions can change the actual trading fee.', privacy: 'Your amount stays in this page: no account lookup, saving or amount tracking.', source: 'Official Fees · reviewed', dateNote: 'Review time belongs to this fee snapshot; the documentation update time is unknown.', compare: 'Compare Hyperliquid and dYdX perpetuals' }),
  'zh-Hans': Object.freeze({ title: '试算永续交易手续费', intro: '输入假设的单次成交名义金额（USD），不是保证金。按普通验证者运营的 Tier 0 永续基础费率计算：maker 0.015%、taker 0.045%。这是假设算术，不是官方算例、实时报价或账户费率。', amount: '每次成交名义金额（USD）', inputHelp: '大于 0 且不超过 1,000,000,000，最多两位小数。使用小数点，不加千位逗号。', liquidity: '成交类型', maker: 'Maker · 0.015%', taker: 'Taker · 0.045%', fills: '成交次数', one: '一次成交', two: '两次同额成交（用户假设）', result: '仅交易手续费', invalid: '请输入大于 0 且不超过 1,000,000,000 的 USD 金额，最多两位小数；不使用逗号或科学计数法。', unavailable: '已核对的费率或来源不可用，暂不显示估算。', formula: '每次成交名义金额 × 费率 × 成交次数', boundary: '资金费、买卖价差／滑点、转账及清算费用在此未知，不是零，均未计入。HIP-3、growth／aligned 市场、质押、推荐折扣及 builder 费用不在试算范围内。账户具体条件可能改变实际交易手续费。', privacy: '金额仅留在当前页面：不查询账户、不保存、不记录金额。', source: '官方 Fees · 核对时间', dateNote: '核对时间仅适用于本费率快照；文档更新时间未知。', compare: '比较 Hyperliquid 与 dYdX 永续合约' }),
  'zh-Hant': Object.freeze({ title: '試算永續交易手續費', intro: '輸入假設的單次成交名義金額（USD），不是保證金。按一般驗證者營運的 Tier 0 永續基礎費率計算：maker 0.015%、taker 0.045%。這是假設算術，不是官方算例、即時報價或帳戶費率。', amount: '每次成交名義金額（USD）', inputHelp: '大於 0 且不超過 1,000,000,000，最多兩位小數。使用小數點，不加千位逗號。', liquidity: '成交類型', maker: 'Maker · 0.015%', taker: 'Taker · 0.045%', fills: '成交次數', one: '一次成交', two: '兩次同額成交（使用者假設）', result: '僅交易手續費', invalid: '請輸入大於 0 且不超過 1,000,000,000 的 USD 金額，最多兩位小數；不使用逗號或科學記號。', unavailable: '已核對的費率或來源無法使用，暫不顯示估算。', formula: '每次成交名義金額 × 費率 × 成交次數', boundary: '資金費、買賣價差／滑價、轉帳及清算費用在此未知，不是零，均未計入。HIP-3、growth／aligned 市場、質押、推薦折扣及 builder 費用不在試算範圍內。帳戶具體條件可能改變實際交易手續費。', privacy: '金額僅留在目前頁面：不查詢帳戶、不儲存、不記錄金額。', source: '官方 Fees · 核對時間', dateNote: '核對時間僅適用於本費率快照；文件更新時間未知。', compare: '比較 Hyperliquid 與 dYdX 永續合約' }),
});
export function hyperliquidFeeScenarioCopy(locale) { return Object.hasOwn(copy, locale) ? copy[locale] : null; }

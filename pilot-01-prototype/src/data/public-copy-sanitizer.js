// Public copy must describe the research context without turning unverified
// rankings, outcomes, or commercial terms into product facts.
export function sanitizePublicText(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/World\s*#?\s*\d+|#\s*[1-9]\b|industry[- ]leading|global leader|premier|preferred|top[- ]tier|undisputed/gi, "source-linked research")
    .replace(/zero[- ]slippage|near[- ]zero slippage|zero[- ]gas|zero[- ]maker fee|zero[- ]fee/gi, "published execution terms")
    .replace(/ultra[- ]low latency|sub[- ]millisecond|millisecond execution|fastest|instant(?:ly)?/gi, "published timing terms")
    .replace(/lowest(?: trading)? fees?|best(?:-in-class)?|most liquid|widest market selection/gi, "published fee and market terms")
    .replace(/\$\s?\d+(?:\.\d+)?\s?(?:m|b|million|billion)\+?/gi, "published fund or scale figure")
    .replace(/\b\d+%\s*(?:fee\s*)?(?:rebate|cashback|off)\b/gi, "user benefit pending verification")
    .replace(/\b(?:up to|max(?:imum)?|最高)\s*(?:\$|USDT|USD)?\s?[\d,.]+\s*(?:USDT|USD|USDT)?/gi, "published reward terms")
    .replace(/\b\d{2,3}%\+/g, "published coverage figure")
    .replace(/seamless/gi, "documented")
    .replace(/\bguarantees?\b/gi, "stated terms")
    .replace(/全球(?:流动性|深度)?第一|全网最低|全网最快|业内第一|行业领跑|首选|天花板|绝对安全|零滑点|最低费率|超低延迟|毫秒级撮合|极速开户/g, "来源研究")
    .replace(/费率低至[^，。；;]+|全球第[一二三四五六七八九十\d]+|(?:全网|全球|行业|业内)(?:最深|最广|最全|最强|最大|领先|头部)/g, "公开费率与市场条件")
    .replace(/资金安全绝对顶级|绝对顶级|绝对安全|极其成熟|极度丰厚|极其流畅|极速抗压|零安全事故|全额刚性兑付|万无一失|媲美顶级|业内公认综合体验第一/g, "来源研究")
    .replace(/(?:支持|提供|拥有)\s*(?:永久|长期)?\s*0\s*手续费/g, "支持公开费率条件")
    .replace(/\d+%\s*返佣/g, "用户权益（待核验）")
    .replace(/\d+%\s*(?:实时)?返现/g, "用户权益（待核验）")
    .replace(/百倍/g, "高波动")
    .replace(/权威/g, "独立研究")
    .replace(/终身(?:最高\s*)?\d+%\s*(?:手续费)?(?:返佣|返还|折扣)/g, "用户权益（待核验）")
    .replace(/终身(?:手续费)?(?:返佣|返还|折扣)/g, "用户权益（待核验）")
    .replace(/终身净有效费率/g, "账户净费率待核验")
    .replace(/独家/g, "平台特定")
    .replace(/0\s*手续费/g, "公开费率条件")
    .replace(/秒级(?:交互|结算|确认)/g, "公开执行时序")
    .replace(/秒级/g, "公开时序")
    .replace(/终身最高/g, "")
    .replace(/100x/g, "high-volatility");
}

export function sanitizePublicValue(value) {
  if (Array.isArray(value)) return value.map(sanitizePublicValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizePublicValue(item)]));
  return sanitizePublicText(value);
}

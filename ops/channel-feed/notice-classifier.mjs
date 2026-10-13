const RISK_NOTICE_CATEGORIES = new Set(["delisting", "security"]);
const RISK_NOTICE_TITLE_EN = /\b(liquidations?|delist(?:ings?|ed)?|margin|borrow(?:ing)?|loans?|suspend(?:ed|ing)?|suspensions?|halt(?:ed|ing)?|outages?|maintenance|incidents?|risk|breach|exploit)\b/i;
const RISK_NOTICE_TITLE_CJK = /(漏洞|下架|爆仓|保证金|借贷|暂停|停用|中断|故障|安全)/;

export const isRiskNotice = (item) => {
  const title = String(item?.title || "");
  return RISK_NOTICE_CATEGORIES.has(item?.category) || RISK_NOTICE_TITLE_EN.test(title) || RISK_NOTICE_TITLE_CJK.test(title);
};

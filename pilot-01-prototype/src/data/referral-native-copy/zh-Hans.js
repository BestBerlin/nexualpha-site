const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "UTC",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const formatDate = (date) => {
  if (!date) return "";
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return dateFormatter.format(parsed);
};

export default {
  query: (name) => `${name} 邀请码`,
  labels: {
    code: "邀请码",
    benefit: "用户权益",
    entry: "注册时填写",
    later: "注册后补填",
    payout: "返佣到账",
    verified: "已验证",
    check: "核查",
    source: "来源",
    log: "验证记录",
    calculator: "计算器",
  },
  verifiedTitle: (name, code, benefit, date) =>
    `${name} 邀请码: ${code} — ${benefit}（验证日期 ${formatDate(date)}）`,
  share: (percent) => `最高返还 ${percent}% 手续费`,
  noBenefit: "没有已验证的用户权益",
  pending: "未验证",
  cadence: {
    hourly: "每小时",
    daily: "每日",
  },
  entryText: "请在完成注册前，把邀请码填入邀请/推荐码字段。",
  laterUnknown:
    "官方帮助没有确认注册后可以补填邀请码；不要假设可以事后添加。",
  laterBybit:
    "Bybit 仅支持主账户在注册后 14 天内补填附属代码，且当前不能已有附属/推荐人关联；普通邀请码不支持补填。需符合监管资格，做市商和机构账户不适用；代码添加后不能更改或取消。",
  laterBinance:
    "Binance 支持有条件的附属关系重新绑定，不是任意更换邀请码。要求主账户已完成 KYC、没有推荐人、最近 90 天交易量低于 5,000 美元，并通过地区和风险检查。附属申请要求 30 天内达到 150,000 美元合格交易量；零手续费交易对和子账户不计入。无交易历史的自助重新绑定是单独流程。本页不确认此邀请码符合资格；不要为了重新绑定而交易。",
  faqEntry: (name) => `${name} 邀请码在哪里填写？`,
  faqLater: (name) => `${name} 邀请码注册后还能补填吗？`,
  faqPayout: (name) => `${name} 返佣什么时候到账？`,
  payoutText: (name, cadence) =>
    `合作伙伴数据称 ${name} 按${cadence}支付；仍需满足资格条件。`,
  noPayout: "没有已验证的到账时间表",
};

// Venue-specific entry steps from the reviewed official help records.
// These supplement the shared interface copy without changing locale policy.
export const entryByVenue = {
  "bitget": "网页表单填写邮箱或手机号后，在点击 Next 前填写可选邀请码。",
  "okx": "完成注册前核对预填码。OKX 提醒：此前点击的邀请链接可能与设备关联 30 天。",
  "binance": "Binance App 在账户创建完成后、进入 KYC 前显示邀请码步骤；已绑定的码不能修改。",
  "bybit": "点击 Sign Up Now 前填写推荐码或联盟邀请码。",
  "coinw": "注册过程中填写推荐码，建立邀请关系。",
  "kraken": "创建 Kraken App 账户时填写代码；App 活动条款不等于已验证本合作代码的用户权益。"
};

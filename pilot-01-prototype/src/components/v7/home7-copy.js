// Home v7 copy. zh-Hans and en are written; every other locale falls back to English until translated.
export const H7_COPY = {
  "zh-Hans": {
    h1a: "通过我们开户，", h1b: "手续费最高返还", sub: "在交易所官方页面注册，带上我们的邀请码。返还的是你已付的手续费。",
    cta: (n) => `领取返佣，去 ${n} 开户`, calcLink: "算算我能省多少", cap: "各家比例不同，逐家公开披露，见下方。",
    t1: "官方域名已核验", t1b: "开户前先看地址栏，我们列出每家的官方域名。", t2: "返佣公开披露", t2b: "我们从交易所获得佣金，并公开返还比例。", t3: "不经手你的资金", t3b: "注册、认证、入金都在交易所官方页面完成。",
    storyH: "同一笔交易，带不带邀请码，一年差在这里。", gapNote: (n) => `一年之后，用我们的邀请码在 ${n} 少付的`, tagPaid: "实付", mo: "月", y0: "年初",
    calcH: "算算你一年能省多少。", perMonth: "/ 月", maker: "挂单", taker: "吃单", volLabel: "每月现货成交额（美元）",
    rate: "费率", code: "邀请码", rebate: "返", pending: "返佣待确认", open: "官方开户", detail: "查看详情", unchecked: "费率待核对",
    lowest: (n, v) => `${n} 用我们的码实付最低，一年 ${v}。`, most: (n, v) => `${n} 返还比例最高，一年返 ${v}。`,
    all: "查看全部交易所", foot: (d) => `费率为各平台公开的基础现货费率，数据日期 ${d}，不含 VIP 等级、平台币抵扣和地区差异。我们通过邀请链接从交易所获得佣金，并将其中一部分作为返佣返还给你。首页“最高 ${"{max}"}%”为合作交易所中的最高档位，各家实际比例不同，以逐家披露为准。返佣比例以交易所当期规则和你的账户为准，你的手续费不会因此增加。`,
  },
  en: {
    h1a: "Open through us.", h1b: "Get back up to", sub: "Register on the exchange's official page with our invite code. What comes back is part of the fees you already paid.",
    cta: (n) => `Claim rebate, open on ${n}`, calcLink: "See what I could save", cap: "Shares differ by exchange and are disclosed one by one below.",
    t1: "Official domains checked", t1b: "Check the address bar before signing up. We list every official domain.", t2: "Rebates disclosed", t2b: "We earn a commission from the exchange and publish the share we return.", t3: "We never touch your funds", t3b: "Sign-up, verification and deposits all happen on the exchange's own pages.",
    storyH: "Same trades, with or without the invite code. This is the yearly gap.", gapNote: (n) => `Paid less on ${n} after a year with our invite code`, tagPaid: "paid", mo: "mo", y0: "Start",
    calcH: "What could you save in a year?", perMonth: "/ month", maker: "Maker", taker: "Taker", volLabel: "Monthly spot volume (USD)",
    rate: "Fee", code: "Invite code", rebate: "Rebate", pending: "Rebate pending", open: "Open account", detail: "Details", unchecked: "Fee not yet checked",
    lowest: (n, v) => `${n} is cheapest with our code: ${v} a year.`, most: (n, v) => `${n} returns the largest share: ${v} a year.`,
    all: "See all exchanges", foot: (d) => `Fees are each exchange's published base spot rates as of ${d}, excluding VIP tiers, platform-token discounts and regional differences. We earn a commission from the exchange through invite links and return part of it to you as a rebate. The headline "up to {max}%" is the highest tier among partner exchanges; actual shares differ and are disclosed per exchange. Rebates follow each exchange's current rules and your account, and your fees do not increase.`,
  },
};
export const h7Copy = (locale) => H7_COPY[locale] || (String(locale || "").startsWith("zh") ? H7_COPY["zh-Hans"] : H7_COPY.en);

// Home v7 copy. zh-Hans and en are the source texts; the other locales live in home7-copy-i18n.js.
// "{max}" is replaced with HOME_REBATE_MAX_PCT at render time. Keep every locale's keys identical (tests/home7-copy.test.mjs).
import { H7_I18N } from "./home7-copy-i18n.js";

export const H7_COPY = {
  "zh-Hans": {
    kick: "NEXUALPHA · 交易所比价与返佣",
    h1a: "别再白送手续费，", h1b: "最高拿回 {max}%。",
    sub: "用我们的合作邀请链接在交易所官网开户，\n手续费按比例返还，主流交易所逐家比价。",
    lgShare: (n) => `${n} 最高返佣比例`, upTo: "最高", settleH: "每小时返佣", settleD: "每天返佣", lgAuto: "官方自动结算", lgGo: (n) => `前往 ${n} 官方开户`, lgLink: "链接已自带邀请码，无需手动填写。", heroGo: "立即开户，拿返佣", lgTop: "三家最高", lgBuilt: "已内置邀请码", dockGo: "立即开户", lgAd: "合作推广链接 · 佣金已披露",
    lgTitle: "返佣账本", lgEst: "按公开费率估算", lgVol: (v, m) => `每月成交 ${v} · ${m}`, perpL: "合约", spotL: "现货", sep: "", lgMax: "合作交易所\n最高返佣", lgPick: "选择交易所",
    lgWithout: "不用邀请码 · 一年手续费", lgBack: "通过 NexuAlpha · 一年最高返还", lgNet: "一年实付 · 按最高返佣后", basisBase: "每年 · 基础费率", basisNet: "每年 · 按最高返佣后", ratesGo: "按月对比同一场景（费率计算器）", copy: "复制", copied: "已复制邀请码 ✓",
    cta: (n) => `领取返佣，去 ${n} 开户`, calcLink: "算算一年能省多少",
    pw: (n) => `${n} 家合作交易所`,
    cap: (n) => `${n} 家合作交易所，返佣比例各不相同，最高 {max}%。\n点开任意一家，看比例和邀请码。`,
    t1: "官方域名已核验", t1b: "开户前先看地址栏，我们列出每家的官方域名。", t2: "返佣公开披露", t2b: "我们从交易所获得佣金，并公开返还比例。", t3: "不经手你的资金", t3b: "注册、认证、入金都在交易所官方页面完成。",
    howH: "三步拿到返佣",
    how: [["挑一家交易所", "官方费率、返佣比例、官方域名逐家公开，先比再选。"], ["一键直达官方开户", "链接已内置我们的邀请码，注册时无需手动填写。"], ["正常交易，返佣到账", "OKX、币安每小时、Bitget 每天由交易所官方自动结算，其余按各家规则发放。"]],
    calcEmpty: "输入每月成交额，看看一年能省多少。",
    calcH: "算算你一年能省多少。", perMonth: "/ 月", maker: "挂单", taker: "吃单", volLabel: "每月成交额（美元）",
    inH: "交易所最新公告", inSub: "取自交易所官方公告接口，点标题看原文。\n仅列公告本身，不代表任何优惠。", inAsOf: (d) => `获取于 ${d}`, inOpen: "官方原文",
    inCat: { listing: "上币", event: "活动", delisting: "下架", news: "公告", product: "产品", security: "安全" },
    inAgo: (ms) => { const h = Math.floor(ms / 36e5); return h < 1 ? "刚刚" : h < 24 ? `${h} 小时前` : `${Math.floor(h / 24)} 天前`; },
    inBtn: "比一比费率", shH: "想参与？先比一下手续费", shSpot: "按现货基础费率", shPerp: "按永续合约基础费率", shAfter: "返佣后约", shClose: "关闭", shSrc: "查看官方公告原文", shNote: "费率为各平台公开的基础费率，不含 VIP 等级和平台币抵扣。返佣比例以各交易所当期规则和你的账户为准。公告本身不代表任何优惠。",
    rate: "费率", code: "邀请码", rebate: "返", pending: "比例见详情", open: "开户拿返佣", detail: "查看详情", unchecked: "费率待核对",
    lowest: (n, v) => `${n} 用我们的码实付最低，一年 ${v}。`, most: (n, v) => `${n} 返还最多，一年返 ${v}。`,
    all: "查看全部交易所", foot: (d) => `费率为各平台公开的基础费率（默认按 USDT 永续合约，可切换现货），数据日期 ${d}，不含 VIP 等级、平台币抵扣和地区差异。我们通过邀请链接从交易所获得佣金，并将其中一部分作为返佣返还给你。首页“最高 {max}%”为合作交易所中的最高档位，各家最高比例不同（如币安 25%、OKX 40%、Bitget 60%），实际比例以逐家披露和你的账户为准，计算按最高比例估算。返佣比例以交易所当期规则和你的账户为准，你的手续费不会因此增加。`,
  },
  en: {
    kick: "NEXUALPHA · EXCHANGE FEES & REBATES",
    h1a: "Stop gifting fees.", h1b: "Get up to {max}% back.",
    sub: "Open on the exchange's official page using NexuAlpha's partner invite link.\nPart of every fee comes back, compared exchange by exchange.",
    lgShare: (n) => `${n} top rebate share`, upTo: "Up to", settleH: "paid hourly", settleD: "paid daily", lgAuto: "Settled by the exchange", lgGo: (n) => `Sign up on ${n}`, lgLink: "The link carries our invite code; nothing to type.", heroGo: "Open an account, get the rebate", lgTop: "Highest of three", lgBuilt: "Invite code built in", dockGo: "Sign up", lgAd: "Partner link · commission disclosed",
    lgTitle: "Rebate ledger", lgEst: "Estimate from published fees", lgVol: (v, m) => `${v} / month · ${m.toLowerCase()}`, perpL: "Perps", spotL: "Spot", sep: " ", lgMax: "Top partner\nrebate", lgPick: "Choose exchange",
    lgWithout: "Without invite code · fees a year", lgBack: "Through NexuAlpha · up to, a year", lgNet: "Paid a year · after max rebate", basisBase: "per year · base fees", basisNet: "per year · after max rebate", ratesGo: "Same scenario per month on the fee calculator", copy: "Copy", copied: "Invite code copied ✓",
    cta: (n) => `Claim rebate, open on ${n}`, calcLink: "See what I could save",
    pw: (n) => `${n} partner exchanges`,
    cap: (n) => `${n} partner exchanges, each with its own rebate share, up to {max}%.\nOpen any of them to see its share and invite code.`,
    t1: "Official domains checked", t1b: "Check the address bar before signing up. We list every official domain.", t2: "Rebates disclosed", t2b: "We earn a commission from the exchange and publish the share we return.", t3: "We never touch your funds", t3b: "Sign-up, verification and deposits all happen on the exchange's own pages.",
    howH: "Your rebate in three steps",
    how: [["Pick an exchange", "Official fees, rebate shares and domains are published for each exchange. Compare, then choose."], ["Sign up in one tap", "The link carries our invite code, so there is nothing to type."], ["Trade, get the rebate", "OKX and Binance pay out hourly, Bitget daily, automatically; others follow their own rules."]],
    calcEmpty: "Enter your monthly volume to see the yearly difference.",
    calcH: "What could you save in a year?", perMonth: "/ month", maker: "Maker", taker: "Taker", volLabel: "Monthly trading volume (USD)",
    inH: "Latest exchange notices", inSub: "Read from each exchange's official announcement endpoint. Titles open the official post. Announcements only; no offer is implied.", inAsOf: (d) => `Fetched ${d}`, inOpen: "Official post",
    inCat: { listing: "Listing", event: "Event", delisting: "Delisting", news: "News", product: "Product", security: "Security" },
    inAgo: (ms) => { const h = Math.floor(ms / 36e5); return h < 1 ? "just now" : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`; },
    inBtn: "Compare fees", shH: "Thinking of joining? Compare fees first", shSpot: "Base spot fees", shPerp: "Base perpetual fees", shAfter: "≈ after rebate", shClose: "Close", shSrc: "Read the official post", shNote: "Fees are each exchange's published base rates, excluding VIP tiers and platform-token discounts. Rebates follow each exchange's current rules and your account. The announcement itself implies no offer.",
    rate: "Fee", code: "Invite code", rebate: "Rebate", pending: "See details", open: "Sign up, get rebate", detail: "Details", unchecked: "Fee not yet checked",
    lowest: (n, v) => `${n} is cheapest with our code: ${v} a year.`, most: (n, v) => `${n} returns the most: ${v} a year.`,
    all: "See all exchanges", foot: (d) => `Fees are each exchange's published base rates (USDT perpetuals by default, spot on request) as of ${d}, excluding VIP tiers, platform-token discounts and regional differences. We earn a commission from the exchange through invite links and return part of it to you as a rebate. The headline "up to {max}%" is the highest tier among partner exchanges; top shares differ by exchange (for example Binance 25%, OKX 40%, Bitget 60%); actual shares follow each exchange's disclosure and your account, and estimates use the top share. Rebates follow each exchange's current rules and your account, and your fees do not increase.`,
  },
  ...H7_I18N,
};
// Missing keys fall back to English so a new key never breaks a locale before its translation lands.
export const h7Copy = (locale) => ({ ...H7_COPY.en, ...(H7_COPY[locale] || (String(locale || "").startsWith("zh") ? H7_COPY["zh-Hans"] : {})) });
// True when this locale renders the English fallback; the home block then declares lang="en" dir="ltr" so RTL shells do not mirror English prose.
export const h7IsFallback = (locale) => !H7_COPY[locale] && !String(locale || "").startsWith("zh");

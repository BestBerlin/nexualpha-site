import { selectResearch } from "../components/research/research-selection.js";

// Navigation and editorial context, not partner facts. Reuse established money pages rather than creating
// competing landing URLs. Only search-published articles with an actual edition enter these clusters.
export const MONEY_TOPIC_HUBS = Object.freeze([
  { id: "exchange-fees", path: "/rates", terms: ["fees", "fee", "maker", "taker", "trading costs", "手续费", "手續費", "费率", "費率"] },
  { id: "rebates-referrals", path: "/partners", terms: ["rebate", "rebates", "referral", "cashback", "返佣", "返还", "返還", "推荐码", "推薦碼"] },
  { id: "tokenized-stocks", path: "/tokenized-stocks", terms: ["tokenized stocks", "tokenized stock", "xstocks", "stock perpetuals", "代币化股票", "代幣化股票"] },
  { id: "funding-liquidations", path: "/topics/derivatives", terms: ["funding", "liquidation", "liquidations", "资金费率", "資金費率", "清算", "强平", "強平"] },
]);

const COPY = {
  en: [
    ["Exchange fees", "A published maker or taker rate is one part of trading cost. Compare spot and perpetual schedules separately, then check account tiers, spread, slippage and withdrawal costs against each venue’s official sources."],
    ["Rebates and referrals", "A referral code does not prove a fee rebate applies to an account. Separate the exchange’s published fee schedule, any verified user benefit and NexuAlpha’s disclosed referral commission; confirm region and account eligibility in the official flow."],
    ["Tokenized stocks", "Tokenized shares and stock perpetuals create different exposure. Check the issuer, holder rights, backing or settlement, trading hours, redemption route and regional eligibility before comparing venues or responding to a listing announcement."],
    ["Funding and liquidations", "Funding is a holding-cost mechanism, while liquidation depends on margin and the venue’s price and risk rules. Read the explainers alongside the funding and liquidation data pages; a rate or a liquidation total alone cannot establish a trading opportunity."],
  ],
  "zh-Hans": [
    ["交易所手续费", "公开的挂单或吃单费率只是交易成本的一部分。先分开比较现货和永续费率表，再按平台官方来源核对账户等级、价差、滑点和提币成本。"],
    ["返还与推荐计划", "推荐码不能证明某个账户可获得手续费返还。请区分交易所公开费率、已核验的用户权益和 NexuAlpha 披露的推荐佣金，并在官方流程中确认地区与账户资格。"],
    ["代币化股票", "代币化股票与股票永续合约提供的敞口不同。比较平台或阅读上币公告前，先核对发行方、持有人权利、支持资产或结算、交易时段、赎回路径和地区资格。"],
    ["资金费率与强平", "资金费率是持仓成本机制；强平取决于保证金以及平台的价格与风险规则。结合资金费率和清算数据页阅读解释文章，单一费率或清算总额不能证明交易机会。"],
  ],
  "zh-Hant": [
    ["交易所手續費", "公開的掛單或吃單費率只是交易成本的一部分。先分開比較現貨和永續費率表，再按平台官方來源核對帳戶等級、價差、滑點和提幣成本。"],
    ["返還與推薦計畫", "推薦碼不能證明某個帳戶可獲得手續費返還。請區分交易所公開費率、已核驗的用戶權益和 NexuAlpha 揭露的推薦佣金，並在官方流程中確認地區與帳戶資格。"],
    ["代幣化股票", "代幣化股票與股票永續合約提供的曝險不同。比較平台或閱讀上幣公告前，先核對發行方、持有人權利、支持資產或結算、交易時段、贖回路徑和地區資格。"],
    ["資金費率與強平", "資金費率是持倉成本機制；強平取決於保證金以及平台的價格與風險規則。結合資金費率和清算資料頁閱讀解釋文章，單一費率或清算總額不能證明交易機會。"],
  ],
};

export function moneyTopicCopy(topicId, locale = "en") {
  const index = MONEY_TOPIC_HUBS.findIndex(topic => topic.id === topicId);
  if (index < 0) return null;
  const language = COPY[locale] ? locale : "en";
  const [title, intro] = COPY[language][index];
  return { title, intro, language };
}

export function moneyTopicArticles(articles, topicId, locale = "en") {
  const topic = MONEY_TOPIC_HUBS.find(topic => topic.id === topicId);
  if (!topic) return [];
  return selectResearch((articles || []).filter(article => article?.seo?.noindex === false), { locale, terms: topic.terms, limit: 5 });
}

export function moneyTopicArticlePool(articles, locale = "en") {
  return [...new Map(MONEY_TOPIC_HUBS.flatMap(topic => moneyTopicArticles(articles, topic.id, locale)).map(article => [article.slug, article])).values()];
}

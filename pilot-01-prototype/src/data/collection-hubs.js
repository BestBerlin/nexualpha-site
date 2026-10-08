import { FACTBOOK_REGISTRY, FACTBOOK_SLUGS } from "./factbook-registry.js";
import { feeFact, discountFact, factsForVenue, feePair } from "./exchange-facts.js";
import { TOPIC_GUIDES, TOPIC_SLUGS } from "./topic-guides-data.js";

export const TOPIC_HUB_PATH = "/topics";
export const FACTBOOK_HUB_PATH = "/factbook";

export function topicHubItems(locale = "en") {
  const isZh = String(locale).startsWith("zh");
  return TOPIC_SLUGS.map((slug) => {
    const topic = TOPIC_GUIDES[slug];
    return {
      slug,
      href: `/topics/${slug}`,
      title: isZh ? topic.metaTitleZh : topic.metaTitleEn,
      description: isZh ? topic.descZh : topic.descEn,
      count: Array.isArray(topic.platforms) ? topic.platforms.length : 0,
    };
  });
}

// Each row says what its record actually holds, from exchange-facts.js (the one fee source): the checked
// spot / perpetual base fees, the token discount, and how many of the two fee fields are checked, with the date.
function factbookRowFacts(slug, name, isZh) {
  const spot = feeFact(slug, "spot");
  const perp = feeFact(slug, "perp");
  const checked = [spot, perp].filter((f) => f.state === "checked");
  const date = checked.map((f) => f.checkedOn).filter(Boolean).sort().at(-1) || null;
  const token = factsForVenue(slug)?.discount?.token || null;
  const spotOff = discountFact(slug, "spot");
  const fee = (f) => (f.state === "checked" ? feePair(f.maker, f.taker) : null);
  if (isZh) {
    const parts = [
      fee(spot) ? `现货 ${fee(spot)}（挂单 / 吃单）` : "现货费率尚未核对",
      fee(perp) ? `永续 ${fee(perp)}` : "永续费率尚未核对",
    ];
    if (token && spotOff != null) parts.push(`用 ${token} 支付现货手续费可减 ${spotOff}%`);
    return {
      description: `${parts.join("；")}。`,
      meta: date ? `费率核对 ${date} · ${checked.length}/2 个费率字段` : "费率尚未核对 · 0/2 个费率字段",
    };
  }
  const parts = [
    fee(spot) ? `spot ${fee(spot)} (maker / taker)` : "spot fees not yet checked",
    fee(perp) ? `perpetual ${fee(perp)}` : "perpetual fees not yet checked",
  ];
  if (token && spotOff != null) parts.push(`${spotOff}% off spot fees paid in ${token}`);
  return {
    description: `${name}: ${parts.join("; ")}.`,
    meta: date ? `Fees checked ${date} · ${checked.length}/2 fee fields` : "Fees not yet checked · 0/2 fee fields",
  };
}

export function factbookHubItems(locale = "en") {
  const isZh = String(locale).startsWith("zh");
  return FACTBOOK_SLUGS.map((slug) => {
    const venue = FACTBOOK_REGISTRY[slug];
    const facts = factbookRowFacts(slug, venue.name, isZh);
    return {
      slug,
      href: `/factbook/${slug}`,
      title: `${venue.name} Factbook`,
      description: facts.description,
      meta: facts.meta,
      category: venue.category,
      officialDomain: venue.officialDomain,
    };
  });
}

export function collectionHubCopy(kind, locale = "en") {
  const isZh = String(locale).startsWith("zh");
  if (kind === "factbook") {
    return isZh ? {
      eyebrow: "FACTBOOK COLLECTION",
      title: "来源审阅事实库",
      description: "按平台聚合公开来源、费率字段、账户条件、官方域名与核验边界。每个详情页仍需回到来源日期和官方流程确认。",
      itemLabel: "平台事实库",
      primaryCta: "先看 Binance 来源事实库",
      primaryHref: "/factbook/binance",
      secondaryCta: "查看平台黄页",
      secondaryHref: "/exchanges",
      cardCta: "打开事实记录",
    } : {
      eyebrow: "FACTBOOK COLLECTION",
      title: "Source Review Factbook",
      description: "A platform-level collection of published source records, fee fields, account conditions, official domains and verification limits. Each detail page remains a dated research record.",
      itemLabel: "Factbook records",
      primaryCta: "Start with Binance source record",
      primaryHref: "/factbook/binance",
      secondaryCta: "Browse platform directory",
      secondaryHref: "/exchanges",
      cardCta: "Open fact record",
    };
  }
  return isZh ? {
    eyebrow: "TOPIC COLLECTION",
    title: "主题研究聚合页",
    description: "按交易主题聚合平台比较、费用核验、地区条件、链上风险与来源记录。先选主题，再进入详情核对具体平台。",
    itemLabel: "主题研究",
    primaryCta: "先看衍生品决策路径",
    primaryHref: "/topics/derivatives",
    secondaryCta: "查看费用计算器",
    secondaryHref: "/rates",
    cardCta: "打开研究路径",
  } : {
    eyebrow: "TOPIC COLLECTION",
    title: "Topic Research Hubs",
    description: "A collection of trading-topic research paths covering platform comparisons, fee checks, regional conditions, on-chain risks and source records.",
    itemLabel: "Topic guides",
    primaryCta: "Start with derivatives decision path",
    primaryHref: "/topics/derivatives",
    secondaryCta: "Open fee calculator",
    secondaryHref: "/rates",
    cardCta: "Open research path",
  };
}

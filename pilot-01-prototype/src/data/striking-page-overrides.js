import { strikingDistanceVenueTitle, strikingDistanceVenueDescription } from './striking-distance-venue-copy.js';
// Search titles and descriptions for non-article pages in Google's striking distance (average position 8-20).
// Striking-distance pass 2026-10-18 (GSC sc-domain:nexualpha.com, 28 days 2026-09-21..2026-10-18; evidence file
// nx-agents/seo/striking-2026-10-18.json). Each title leads with the words people searched with and stays within the
// locale budget (60 Latin / 32 CJK characters); each description answers the query in 110-155 characters.
// Fee figures are read from exchange-facts.js (official fee pages, dated), never typed here.
// Applied last by both heads: worker/index.js routeMetadata and src/data/seo-injection.js computeRouteSeo.
// News articles use serp-ctr-news-overrides.js instead.
import { feeFact, primarySourceUrl } from "./exchange-facts.js";
import { formatFee } from "./format-fee.js";

const pct = (value) => formatFee(value, "en");
const host = (slug) => {
  try { return new URL(primarySourceUrl(slug)).hostname.replace(/^www\./, ""); } catch { return ""; }
};

function deribitCopy() {
  return Object.fromEntries(['en', 'zh-Hans'].map(locale => [locale, {
    title: strikingDistanceVenueTitle('deribit', locale),
    description: strikingDistanceVenueDescription('deribit', locale),
  }]));
}

function okxMexcCopy() {
  const spot = feeFact("okx", "spot");
  const perp = feeFact("okx", "perp");
  if (spot.state !== "checked" || perp.state !== "checked") return null;
  const source = host("okx");
  return {
    en: {
      // mexc vs okx (pos 51)
      title: "OKX vs MEXC (2026): Fees, Futures, Listings and KYC",
      description: `OKX vs MEXC: OKX charges ${pct(spot.maker)} / ${pct(spot.taker)} on spot and ${pct(perp.maker)} / ${pct(perp.taker)} on futures (${source}, ${spot.checkedOn}); MEXC sets fees per pair. Compare listings and KYC.`,
    },
    "zh-Hans": {
      title: "OKX 对比 MEXC（2026）：手续费、合约、上币与 KYC",
      description: `OKX 对比 MEXC：OKX 现货挂单 ${pct(spot.maker)}、吃单 ${pct(spot.taker)}，合约 ${pct(perp.maker)} / ${pct(perp.taker)}（${source} 官方费率页，${spot.checkedOn}）；MEXC 按交易对设定费率。再逐项比较上币范围、合约产品、KYC 要求与官方来源。`,
    },
  };
}

const STATIC_OVERRIDES = {
  "/telegram": {
    // research bot telegram (pos 7)
    en: {
      title: "NexuAlpha Telegram Bot: Price Alerts & Daily Research Digest",
      description: "The NexuAlpha Telegram research bot: set /alert price and move alerts, get a 21:00 SGT daily digest with flash news and an events calendar, plus campaigns.",
    },
    "zh-Hans": {
      title: "NexuAlpha Telegram 机器人：价格提醒与每日简报",
      description: "NexuAlpha Telegram 研究机器人：用 /alert 设置价格和异动提醒，每晚 21:00（SGT）收到含重要快讯和当日日历的每日简报，还有交易所活动推送。可以盯价格位、快速异动、爆仓潮、极端资金费率或新币上线，不用一直盯盘。",
    },
  },
  "/compare/uniswap-vs-jupiter": {
    // The previous title ran past 60 characters and was cut in results.
    en: {
      title: "Uniswap vs Jupiter (2026): Chains, Routing, Fees, Wallets",
      description: "Uniswap vs Jupiter: compare the chain, token contract or mint, route source, slippage, gas or priority fees and the wallet preview before your first swap.",
    },
  },
  "/topics": {
    en: {
      title: "Crypto Research Topics: Fees, KYC, Regions, On-Chain Risk",
      description: "Crypto research by topic: exchange comparisons, fee checks, KYC and regional access, tokenized stocks and on-chain risk, each linked to official sources.",
    },
  },
  "/eu": {
    en: {
      title: "Crypto Exchanges in the EU (2026): MiCA, SEPA and KYC Checks",
      description: "Which crypto exchanges serve your EU country: check the ESMA MiCA register, country scope, EUR and SEPA funding, KYC and product permissions at the source.",
    },
  },
  "/uk": {
    en: {
      title: "Crypto Exchanges in the UK (2026): FCA, GBP and KYC Checks",
      description: "UK crypto account checks: FCA registration, residence, identity and appropriateness tests, GBP funding and product scope, each verified at the source.",
    },
  },
};

let computed = null;
function overrides() {
  if (!computed) {
    computed = { ...STATIC_OVERRIDES };
    const deribit = deribitCopy();
    if (deribit) computed["/exchanges/deribit"] = deribit;
    const okxMexc = okxMexcCopy();
    if (okxMexc) computed["/compare/okx-vs-mexc"] = okxMexc;
  }
  return computed;
}

export function strikingPagePaths() {
  return Object.keys(overrides());
}

/** { title, description } for one indexable page edition, or null. `pathname` is the locale-free content path. */
export function strikingPageOverride(pathname, locale = "en") {
  const entry = overrides()[String(pathname || "").replace(/\/+$/, "") || "/"];
  return entry?.[locale] ? { ...entry[locale] } : null;
}

/** Applies the override to a head metadata object in place (status 200 only). Returns the same object. */
export function applyStrikingPageOverride(metadata, pathname, locale) {
  if (!metadata || typeof metadata !== "object" || (metadata.status && metadata.status !== 200)) return metadata;
  const override = strikingPageOverride(pathname, locale);
  if (!override) return metadata;
  metadata.title = override.title;
  metadata.description = override.description;
  return metadata;
}

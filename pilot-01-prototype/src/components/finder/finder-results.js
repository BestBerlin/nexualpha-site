import { researchForVenue } from "../../data/exchange-research.js";
import { localizedHref } from "../../data/locale-routing.js";
import { sanitizeAccountStage, sanitizeFunding, sanitizeMarket, sanitizeProduct } from "../../data/growth-context.js";

const supportedLocales = new Set(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"]);

// Search-only aliases preserve the official names displayed in every locale.
const venueSearchAliases = new Map([
  ["binance", ["币安", "幣安"]],
  ["okx", ["欧易", "歐易"]],
]);

const highIntentRoutes = [
  {
    groupKey: "exchanges",
    label: "Brazil Pix / BRL funding checklist",
    description: "Review Pix, BRL funding and account checks before choosing a venue.",
    href: "/br/pix",
    resultKind: "regional",
    routePattern: "/br/pix",
    keywords: ["br", "brazil", "brasil", "pix", "brl", "cpf", "deposit", "funding", "巴西", "入金"],
  },
  {
    groupKey: "compare",
    label: "Brazil BRL fee cost check",
    description: "Estimate BRL cost assumptions before leaving NexuAlpha.",
    href: "/br/custos",
    resultKind: "regional",
    routePattern: "/br/custos",
    keywords: ["br", "brazil", "brasil", "brl", "cost", "custos", "fee", "fees", "手续费", "費用"],
  },
  {
    groupKey: "exchanges",
    label: "Japan account and JPY funding research",
    description: "Check FSA context, JPY funding and account-name requirements.",
    href: "/jp",
    resultKind: "regional",
    routePattern: "/jp",
    keywords: ["japan", "jp", "jpy", "fsa", "jfsa", "日本", "日本語"],
  },
  {
    groupKey: "exchanges",
    label: "Korea KRW account research",
    description: "Check FSC context, KRW funding and real-name account requirements.",
    href: "/kr",
    resultKind: "regional",
    routePattern: "/kr",
    keywords: ["korea", "kr", "krw", "fsc", "real-name", "韩国", "韓國", "한국"],
  },
  {
    groupKey: "exchanges",
    label: "Türkiye TRY market research",
    description: "Check SPK context, TRY funding and product scope.",
    href: "/markets/turkiye",
    resultKind: "regional",
    routePattern: "/markets/turkiye",
    keywords: ["turkey", "türkiye", "turkiye", "tr", "try", "spk", "土耳其"],
  },
  {
    groupKey: "compare",
    label: "DEX wallet route comparison",
    description: "Compare Uniswap and Jupiter wallet-first routes.",
    href: "/compare/uniswap-vs-jupiter",
    resultKind: "compare",
    routePattern: "/compare/:pair",
    keywords: ["dex", "wallet", "onchain", "on-chain", "uniswap", "jupiter", "链上", "去中心化"],
  },
  {
    groupKey: "compare",
    label: "Perp DEX comparison",
    description: "Compare Hyperliquid and dYdX perpetual DEX routes.",
    href: "/compare/hyperliquid-vs-dydx",
    resultKind: "compare",
    routePattern: "/compare/:pair",
    keywords: ["perp", "perps", "perpetual", "perpetuals", "futures", "hyperliquid", "dydx", "永续", "合约"],
  },
  {
    groupKey: "compare",
    label: "Fee cost calculator",
    description: "Review published fee assumptions and cost mechanics.",
    href: "/rates",
    resultKind: "tool",
    routePattern: "/rates",
    keywords: ["fee", "fees", "cost", "calculator", "rate", "手续费", "費率", "成本"],
  },
];

const defaultComparisonPairs = [
  ["binance", "okx"],
  ["bybit", "bitget"],
  ["backpack", "bybit"],
  ["uniswap", "jupiter"],
  ["hyperliquid", "dydx"],
];

export function withLocale(locale, href) {
  return localizedHref(href, { locale });
}

export function compareSlug(slugs) {
  return slugs.filter(Boolean).join("-vs-");
}

function cleanLocale(value, fallback = "en") {
  return supportedLocales.has(value) ? value : fallback;
}

function safeSearchParams(search) {
  try {
    return new URLSearchParams(String(search || "").startsWith("?") ? String(search || "").slice(1) : String(search || ""));
  } catch {
    return new URLSearchParams();
  }
}

export function finderSafeContext(search = "", { locale = "en", market, product, accountStage, funding } = {}) {
  const params = safeSearchParams(search);
  const safeLocale = cleanLocale(locale || params.get("locale") || "en");
  const safeMarket = sanitizeMarket(market) || sanitizeMarket(params.get("market"));
  const safeProduct = sanitizeProduct(product) || sanitizeProduct(params.get("product"));
  const safeAccountStage = sanitizeAccountStage(accountStage) || sanitizeAccountStage(params.get("account_stage"));
  const safeFunding = sanitizeFunding(funding, safeMarket) || sanitizeFunding(params.get("funding"), safeMarket);
  return {
    locale: safeLocale,
    ...(safeMarket && safeMarket !== "unknown" ? { market: safeMarket } : {}),
    ...(safeProduct && safeProduct !== "unknown" ? { product: safeProduct } : {}),
    ...(safeAccountStage ? { accountStage: safeAccountStage } : {}),
    ...(safeFunding ? { funding: safeFunding } : {}),
  };
}

function contextParams(context = {}, venue) {
  return {
    ...(context.market ? { market: context.market } : {}),
    ...(context.product ? { product: context.product } : {}),
    ...(context.accountStage ? { account_stage: context.accountStage } : {}),
    ...(context.funding ? { funding: context.funding } : {}),
    ...(venue ? { venue } : {}),
  };
}

function finderHref(href, context = {}, venue) {
  return localizedHref(href, { locale: context.locale || "en", ...contextParams(context, venue) });
}

export function finderTrackPayload(result, context = {}) {
  return {
    resultKind: result?.resultKind || "route",
    routePattern: result?.routePattern || routePatternForHref(result?.href),
    ...(context.market ? { market: context.market } : {}),
    ...(context.product ? { product: context.product } : {}),
    locale: context.locale || "en",
  };
}

function routePatternForHref(href = "") {
  const path = String(href || "").split("?")[0].split("#")[0];
  if (/^\/(?:[a-z-]+\/)?exchanges\/[^/?#]+/.test(path)) return "/exchanges/:venue";
  if (/^\/(?:[a-z-]+\/)?compare\/[^/?#]+/.test(path)) return "/compare/:pair";
  return path || "/";
}

export function buildFinderResults({ copy, command, locale, context }) {
  const safeContext = {
    ...(context || finderSafeContext("", { locale })),
    locale: cleanLocale(context?.locale || locale || copy?.locale || "en"),
  };
  const venues = command?.venueCatalog ?? [];
  const bySlug = new Map(venues.map((venue) => [venue.slug, venue]));
  const entries = [
    {
      group: copy.nav.exchanges,
      label: copy.discovery.title,
      description: copy.home.exploreText,
      href: "/exchanges",
      resultKind: "directory",
      routePattern: "/exchanges",
      keywords: ["directory", "exchange", "platform", "交易所", "平台"],
    },
    {
      group: copy.nav.compare,
      label: copy.home.compareLabel,
      description: copy.home.compareText,
      href: "/#compare",
      resultKind: "compare",
      routePattern: "/#compare",
      keywords: ["compare", "versus", "comparison", "比较", "對比"],
    },
    {
      group: copy.nav.listings,
      label: copy.home.sourcesLabel,
      description: copy.home.sourcesText,
      href: "/activities",
      resultKind: "activity",
      routePattern: "/activities",
      keywords: ["activity", "listing", "launchpool", "上币", "活動"],
    },
    ...defaultComparisonPairs
      .map((pair) => pair.map((slug) => bySlug.get(slug)).filter(Boolean))
      .filter((pair) => pair.length >= 2)
      .map((pair) => ({
        group: copy.nav.compare,
        label: pair.map((venue) => venue.name).join(" vs "),
        description: pair.map((venue) => venue.category).join(" / "),
        href: `/compare/${compareSlug(pair.map((venue) => venue.slug))}`,
        resultKind: "compare",
        routePattern: "/compare/:pair",
        keywords: pair.flatMap((venue) => [venue.slug, venue.name, venue.category]),
      })),
    ...highIntentRoutes.map((route) => ({
      group: copy.nav[route.groupKey] || copy.nav.exchanges,
      label: route.label,
      description: route.description,
      href: route.href,
      resultKind: route.resultKind,
      routePattern: route.routePattern,
      keywords: route.keywords,
    })),
    ...venues.map((venue) => ({
      group: copy.nav.exchanges,
      label: `${venue.name} registration checklist`,
      description: "Review official terms and signup conditions before leaving NexuAlpha.",
      href: `/exchanges/${venue.slug}#registration-path`,
      resultKind: "registration_path",
      routePattern: "/exchanges/:venue#registration-path",
      venue: venue.slug,
      keywords: [
        venue.slug,
        venue.name,
        venue.officialDomain,
        "signup",
        "sign up",
        "register",
        "registration",
        "referral",
        "invite",
        "code",
        "link",
        "开户链接",
        "注册链接",
        "邀请码",
        "邀請碼",
      ],
    })),
    ...venues.map((venue) => {
      const research = researchForVenue(venue.slug, locale);
      return {
      group: copy.nav.exchanges,
      label: venue.name,
      description: venue.category,
      href: `/exchanges/${venue.slug}`,
      resultKind: "venue",
      routePattern: "/exchanges/:venue",
      keywords: [venue.slug, venue.name, venue.category, venue.officialDomain, ...(venueSearchAliases.get(venue.slug) ?? []), ...(research?.tags ?? []), research?.summary, ...(research?.facts.map((fact) => fact.value) ?? [])].filter(Boolean),
    }; }),
  ];
  return entries
    .filter((entry, index, all) => entry.href && all.findIndex((item) => item.href === entry.href) === index)
    .map((entry) => ({ ...entry, href: finderHref(entry.href, safeContext, entry.venue) }));
}

export function searchFinderResults(entries, query, locale, limit = 8) {
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  if (!normalizedQuery) return entries.slice(0, Math.max(1, limit));
  return entries
    .map((entry, index) => ({ entry, index, score: resultScore(entry, normalizedQuery, locale) }))
    .filter((item) => item.score !== null)
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((item) => item.entry)
    .slice(0, Math.max(1, limit));
}

function resultScore(entry, normalizedQuery, locale) {
  const label = entry.label.toLocaleLowerCase(locale);
  const description = entry.description?.toLocaleLowerCase(locale) ?? "";
  const keywords = (entry.keywords ?? []).map((value) => value.toLocaleLowerCase(locale));
  const hasRegistrationIntent = /signup|sign up|register|registration|referral|invite|code|link|开户链接|注册链接|邀请码|邀請碼/i.test(normalizedQuery);
  const rawTokens = normalizedQuery.split(/[\s/|,，、·:：]+/).filter((token) => token.length >= 2);
  const tokens = rawTokens.filter((token) => !/^https?$/.test(token) && !/^www\./.test(token) && !/^(?:nexu888|11350287|luckybitcoin)$/i.test(token) && !token.includes(".com"));
  const haystack = [label, description, ...keywords].join(" ");
  if (entry.resultKind === "registration_path" && hasRegistrationIntent && entry.venue && normalizedQuery.includes(entry.venue)) return 0.5;
  if (label === normalizedQuery) return 0;
  if (keywords.some((value) => value === normalizedQuery)) return 1;
  if (label.startsWith(normalizedQuery)) return 2;
  if (keywords.some((value) => value.startsWith(normalizedQuery))) return 3;
  if (label.includes(normalizedQuery)) return 4;
  if (keywords.some((value) => value.includes(normalizedQuery))) return 5;
  if (description.includes(normalizedQuery)) return 6;
  if (tokens.length && tokens.every((token) => haystack.includes(token))) return 7 + Math.max(0, tokens.length - 2);
  return null;
}

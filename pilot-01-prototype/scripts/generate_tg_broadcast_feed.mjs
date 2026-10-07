#!/usr/bin/env node
/**
 * NexuAlpha Telegram editorial broadcast feed builder.
 *
 * This generator prepares source-honest channel drafts for community distribution.
 * It does not post to Telegram, call the Telegram API, or claim that Telegram
 * links guarantee search indexing or ranking.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TELEGRAM_CONFIG, TELEGRAM_SEARCH_TOPIC_QUEUE, getTelegramDeepLink } from "../src/data/telegram-config.js";
import { localizedHref } from "../src/data/locale-routing.js";
import { priorityCanonicalOwnerPath } from "../src/data/priority-query-owner-registry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const defaultJsonOutputPath = path.join(rootDir, "src/data/generated-tg-broadcast-feed.json");
const defaultPublishPackDir = path.join(rootDir, "docs/strategy/telegram-manual-publish-pack-20260915-wave40");

const DEFAULT_BASE_URL = "https://nexualpha.com";
const TRACKING_PARAMS = {
  utm_source: "tg_channel",
  utm_medium: "broadcast",
};
const TELEGRAM_CONTEXT_PARAM_PREFIX = "tg_";
const TELEGRAM_TRACKING_REQUIRED_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "tg_market",
  "tg_locale",
  "tg_product",
  "tg_funnel",
  "tg_intent",
  "tg_theme",
  "tg_draft",
];

const FORBIDDEN_RAW_EXCHANGE_REGISTRATION_URLS =
  /(accounts\.binance\.com|binance\.com\/join|bsmkweb\.cc|partner\.bitget|bitget\.com\/expressly|okx\.com\/join|topzhjdgxcb\.net|backpack\.exchange\/join)/i;

const TYPE_CLASSIFICATION = {
  account_readiness: { funnelStage: "decision", searchIntent: "transactional-readiness" },
  compare_brief: { funnelStage: "consideration", searchIntent: "commercial-comparison" },
  dex_route_check: { funnelStage: "activation", searchIntent: "operational-safety" },
  fee_scenario: { funnelStage: "decision", searchIntent: "cost-estimation" },
  operational_guide: { funnelStage: "activation", searchIntent: "how-to-risk-reduction" },
  regional_compare: { funnelStage: "decision", searchIntent: "regional-commercial-comparison" },
  regional_decision: { funnelStage: "consideration", searchIntent: "regional-onboarding" },
  regional_research: { funnelStage: "awareness", searchIntent: "regional-research" },
  research_digest: { funnelStage: "awareness", searchIntent: "research-education" },
  search_demand_brief: { funnelStage: "awareness", searchIntent: "question-answer" },
};

const REGION_SEGMENTS = {
  BR: "Brazil local funding and account-readiness audience",
  MX: "Mexico local funding and platform-research audience",
  HK: "Hong Kong regulated-platform research audience",
  KR: "Korea local regulation, KRW funding and research audience",
  SG: "Singapore MAS, SGD funding and account-research audience",
  TR: "Turkey SPK, TRY funding and platform-research audience",
  ZH: "Chinese-language education and operational-risk audience",
  GLOBAL: "Global English research and comparison audience",
};

const RELATED_COMPARE_PATH_OVERRIDES = {
  "hong-kong-account-en": "/hk/comparar",
};

const GSC_VISIBLE_OPPORTUNITIES = {
  hyperliquid_fees: {
    query: "hyperliquid fees",
    visibleImpressions: 15,
    clicks: 0,
    landingPage: "/exchanges/hyperliquid",
    source: "gsc-visible-baseline-20260915",
    operatorAction: "turn fee curiosity into a NexuAlpha source-check and cost-readiness visit",
  },
  hyperliquid_funded_account: {
    query: "hyperliquid funded account",
    visibleImpressions: 6,
    clicks: 0,
    landingPage: "/exchanges/hyperliquid",
    source: "gsc-visible-baseline-20260915",
    operatorAction: "separate wallet funding, margin collateral, vaults and third-party prop-account language",
  },
  uniswap_testnet: {
    query: "uniswap testnet",
    visibleImpressions: 6,
    clicks: 0,
    landingPage: "/exchanges/uniswap",
    source: "gsc-visible-baseline-20260915",
    operatorAction: "send wallet users to official-domain, network and token-contract checks before connecting",
  },
  tokenized_treasury: {
    query: "tokenized treasury",
    relatedQueries: ["tokenized treasuries"],
    visibleImpressions: 5,
    clicks: 0,
    landingPage: priorityCanonicalOwnerPath("tokenized treasury"),
    source: "gsc-visible-baseline-20260915",
    operatorAction: "turn early RWA discovery into issuer, custodian, legal-claim and redemption research",
  },
  bitget_bybit_stocks: {
    query: "bitget vs bybit stocks",
    visibleImpressions: 2,
    clicks: 0,
    landingPage: "/compare/bybit-vs-bitget",
    source: "gsc-visible-baseline-20260915",
    operatorAction: "separate real stocks, tokenized stocks, stock perpetuals and copy-trading product scope before a signup route",
  },
  crypto_perpetual_platform: {
    query: "crypto perpetual platform",
    visibleImpressions: 2,
    clicks: 0,
    landingPage: "/topics/derivatives",
    source: "gsc-visible-query-page-pairs-20260915-wave23",
    operatorAction: "route perpetual-platform curiosity into collateral, custody, funding, liquidation and wallet checks",
  },
  hyperliquid_latest_news: {
    query: "hyperliquid latest news",
    visibleImpressions: 1,
    clicks: 0,
    landingPage: "/news/hyperliquid-vs-dydx",
    source: "gsc-visible-baseline-20260915",
    operatorAction: "turn latest-news searches into a dated research route without live-market or breaking-news claims",
  },
  hyperliquid_funding_hourly: {
    query: "site:hyperliquid.gitbook.io/hyperliquid-docs \"funding is paid hourly\"",
    visibleImpressions: 1,
    clicks: 0,
    landingPage: "/exchanges/hyperliquid",
    source: "gsc-visible-baseline-20260915",
    operatorAction: "explain funding-payment checks without quoting it as a real-time rate or trading recommendation",
  },
  tokenized_stock_margin_zh: {
    query: "代币化股票保证金",
    visibleImpressions: 1,
    clicks: 0,
    landingPage: "/compare/bybit-vs-bitget",
    source: "gsc-visible-baseline-20260915",
    operatorAction: "send Chinese margin-equity curiosity into tokenized-stock and stock-perp boundary checks",
  },
  okx_usd_usdc_migration: {
    query: "OKX USD to USDC spot pair migration",
    visibleImpressions: 11,
    clicks: 0,
    landingPage: "/news/okx-usd-to-usdc-spot-pair-migration",
    source: "gsc-visible-page-baseline-20260915",
    operatorAction: "route page-level migration demand into account, order, API instrument and bot checks",
  },
  no_kyc_crypto_exchange: {
    query: "no kyc crypto exchange",
    visibleImpressions: 4,
    clicks: 0,
    landingPage: "/topics/no-kyc",
    source: "gsc-visible-page-baseline-20260915",
    operatorAction: "separate non-custodial wallet routes from exchange-account claims before any platform handoff",
  },
};

const SEARCH_TOPIC_BY_ID = new Map(TELEGRAM_SEARCH_TOPIC_QUEUE.map((topic) => [topic.id, topic]));
const isSearchTopicWave = (wave = "") => /^wave\d+_search_topics$/.test(String(wave));
const inferVenueFromPath = (pathname = "") => {
  const match = String(pathname).match(/^\/exchanges\/([^/?#]+)/);
  return match?.[1] || null;
};
const inferComparePairFromPath = (pathname = "") => {
  const match = String(pathname).match(/^\/compare\/([^/?#]+)/);
  return match?.[1] || null;
};

export function escapeMarkdownV2(text) {
  if (typeof text !== "string") return "";
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

export const tgMd = {
  escape: escapeMarkdownV2,
  bold: (text) => `*${escapeMarkdownV2(text)}*`,
  italic: (text) => `_${escapeMarkdownV2(text)}_`,
  code: (text) => `\`${String(text).replace(/[`\\]/g, "\\$&")}\``,
  pre: (text, lang = "") => `\`\`\`${lang}\n${String(text).replace(/[`\\]/g, "\\$&")}\n\`\`\``,
  link: (text, url) => `[${escapeMarkdownV2(text)}](${String(url).replace(/[)\\]/g, "\\$&")})`,
};

function normalizeTrackingValue(value) {
  if (value === undefined || value === null || value === "") return "";
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function buildTelegramTrackingContext(template, derived) {
  const market = template.deepLinkAction?.market || derived.region || "GLOBAL";
  const product = template.deepLinkAction?.product || "research";
  return {
    market: normalizeTrackingValue(market),
    locale: normalizeTrackingValue(template.locale || "en"),
    product: normalizeTrackingValue(product),
    funnel: normalizeTrackingValue(derived.funnelStage),
    intent: normalizeTrackingValue(derived.searchIntent),
    theme: normalizeTrackingValue(derived.theme),
    draft: normalizeTrackingValue(template.id),
  };
}

function buildUtmReview(canonicalBacklink, trackingContext) {
  const url = new URL(canonicalBacklink);
  return {
    canonicalLandingUrl: canonicalBacklink,
    requiredPublicParams: ["utm_source", "utm_medium", "utm_campaign"],
    requiredTelegramContextParams: TELEGRAM_TRACKING_REQUIRED_PARAMS.filter((param) => param.startsWith("tg_")),
    publicParams: {
      utm_source: url.searchParams.get("utm_source"),
      utm_medium: url.searchParams.get("utm_medium"),
      utm_campaign: url.searchParams.get("utm_campaign"),
    },
    telegramContextParams: Object.fromEntries(
      Object.keys(trackingContext).map((key) => [`${TELEGRAM_CONTEXT_PARAM_PREFIX}${key}`, url.searchParams.get(`${TELEGRAM_CONTEXT_PARAM_PREFIX}${key}`)])
    ),
    reviewPolicy: "public_channel_attribution_only; no user identifiers, exchange account identifiers, private commissions or raw registration links",
  };
}

function buildLandingPageReview(template, canonicalBacklink, onsiteEntries) {
  const url = new URL(canonicalBacklink);
  const primaryCta = onsiteEntries[0];
  const secondaryCtas = onsiteEntries.slice(1);
  return {
    pagePath: url.pathname,
    locale: template.locale || "en",
    market: template.deepLinkAction?.market || regionByLocaleOrId(template),
    product: template.deepLinkAction?.product || "research",
    expectedFirstScreen: [
      "answer the Telegram question before any Bot handoff",
      "keep NexuAlpha onsite URL above Telegram Bot deep link",
      "show source, locale, market and product boundaries before external action",
    ],
    primaryOnsiteCta: primaryCta ? {
      label: primaryCta.label,
      url: primaryCta.url,
    } : null,
    secondaryOnsiteCtas: secondaryCtas.map((entry) => ({
      label: entry.label,
      url: entry.url,
    })),
    prePublishChecks: [
      "open canonical landing URL and confirm HTTP 200/rendered page in intended locale",
      "confirm first viewport has a clear onsite next step before Telegram or external handoff",
      "confirm CTA copy does not claim signup, approval, bonus, rebate, ranking, indexing or trading outcome",
      "confirm onsite CTAs stay on nexualpha.com and raw exchange registration links are absent from Telegram copy",
    ],
  };
}

function trackedUrl(baseUrl, pathname, campaign, locale, context = {}) {
  const url = new URL(localizedHref(pathname, { locale }), baseUrl);
  for (const [key, value] of Object.entries(TRACKING_PARAMS)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("utm_campaign", campaign);
  for (const [key, value] of Object.entries(context)) {
    if (value) url.searchParams.set(`${TELEGRAM_CONTEXT_PARAM_PREFIX}${key}`, value);
  }
  return url.toString();
}

function addDaysIso(nowIso, days) {
  const date = new Date(nowIso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

const regionByLocaleOrId = (item) => {
  if (item.id.startsWith("brazil-")) return "BR";
  if (item.id.startsWith("mexico-")) return "MX";
  if (item.id.startsWith("hong-kong-")) return "HK";
  if (item.id.startsWith("korea-")) return "KR";
  if (item.id.startsWith("singapore-")) return "SG";
  if (item.id.startsWith("turkey-")) return "TR";
  if (item.locale === "zh-Hans") return "ZH";
  return "GLOBAL";
};

const themeByType = (type) => {
  const themes = {
    account_readiness: "account-readiness",
    compare_brief: "platform-comparison",
    dex_route_check: "dex-source-check",
    fee_scenario: "fee-cost-check",
    operational_guide: "operational-risk",
    regional_compare: "regional-platform-choice",
    regional_decision: "regional-entry",
    regional_research: "regional-research",
    research_digest: "research-education",
    search_demand_brief: "search-demand-answer",
  };
  return themes[type] || "research";
};

function autoTemplateType(topic) {
  const id = String(topic.id || "");
  const primaryPath = String(topic.primaryPath || "");
  if (id.includes("uniswap") || id.includes("jupiter") || id.includes("perp-dex")) return "dex_route_check";
  if (id.includes("bybit-bitget") || primaryPath.startsWith("/compare/")) return "search_demand_brief";
  if (id.includes("hong-kong") || id.includes("korea") || id.includes("singapore") || id.includes("turkey")) return "regional_decision";
  if (id.includes("tokenized") || id.includes("rwa")) return "research_digest";
  return "search_demand_brief";
}

function autoTemplateRegionTitle(topic) {
  const id = String(topic.id || "");
  if (id.startsWith("hong-kong-")) return "Hong Kong";
  if (id.startsWith("korea-")) return "Korea";
  if (id.startsWith("singapore-")) return "Singapore";
  if (id.startsWith("turkey-")) return "Türkiye";
  return "Global";
}

function autoTemplateTitle(topic) {
  const region = autoTemplateRegionTitle(topic);
  const query = String(topic.query || "").trim();
  if (String(topic.id || "").startsWith("hong-kong-")) return `${region}: ${query} before any account route`;
  if (String(topic.id || "").startsWith("korea-")) return `${region}: ${query} before any account or wallet route`;
  if (String(topic.id || "").startsWith("singapore-")) return `${region}: ${query} before any account route`;
  if (String(topic.id || "").startsWith("turkey-")) return `${region}: ${query} before any account or wallet route`;
  return `${query}: use the NexuAlpha source path before acting`;
}

function autoTemplateDeepLinkAction(topic) {
  const pair = inferComparePairFromPath(topic.primaryPath);
  if (pair) return { action: "compare", pair, locale: topic.locale || "en", product: "research", campaign: topic.campaign };
  const venue = inferVenueFromPath(topic.primaryPath);
  if (venue) return { action: "verify_domain", venue, locale: topic.locale || "en", product: "research", campaign: topic.campaign };
  if (String(topic.id || "").startsWith("hong-kong-")) return { action: "partner_desk", market: "HK", locale: "en", product: "research", campaign: topic.campaign };
  if (String(topic.id || "").startsWith("korea-")) return { action: "partner_desk", market: "KR", locale: "ko", product: "research", campaign: topic.campaign };
  if (String(topic.id || "").startsWith("singapore-")) return { action: "partner_desk", market: "SG", locale: "en", product: "research", campaign: topic.campaign };
  if (String(topic.id || "").startsWith("turkey-")) return { action: "partner_desk", market: "TR", locale: "tr", product: "research", campaign: topic.campaign };
  return { action: "rates", venue: "all", locale: topic.locale || "en", product: "research", campaign: topic.campaign };
}

function searchTopicWaveLabel(topic) {
  const match = String(topic.wave || "").match(/^(wave\d+)_/);
  return match ? match[1].replace("wave", "Wave") : "Search-topic";
}

function autoTemplateFromSearchTopic(topic) {
  const locale = topic.locale || "en";
  const type = autoTemplateType(topic);
  const region = autoTemplateRegionTitle(topic);
  const waveLabel = searchTopicWaveLabel(topic);
  const venue = inferVenueFromPath(topic.primaryPath);
  const pair = inferComparePairFromPath(topic.primaryPath);
  const venues = pair ? pair.split("-vs-") : venue ? [venue] : [];
  const localizedBoundary =
    locale === "ko"
      ? "이 초안은 NexuAlpha 페이지로 먼저 보낸 뒤 공식 출처, 상품 범위와 계정 조건을 확인하게 합니다."
      : locale === "tr"
        ? "Bu taslak kullanıcıyı önce NexuAlpha sayfasına gönderir; resmi kaynak, ürün kapsamı ve hesap koşulları ayrıca kontrol edilir."
        : "This draft sends readers to NexuAlpha first so source boundaries, product scope and account conditions stay visible.";
  return {
    id: topic.id,
    type,
    locale,
    campaign: topic.campaign,
    path: topic.primaryPath,
    venues,
    title: autoTemplateTitle(topic),
    summary: `${region} ${waveLabel} draft for the search question "${topic.query}" with an onsite-first NexuAlpha answer path and manual review before reuse.`,
    sourceNotes: [
      localizedBoundary,
      "It does not include raw exchange registration URLs, invitation codes, private commission terms, bonus guarantees or eligibility promises.",
      "Refresh the onsite landing page and source notes before any manual Telegram post.",
    ],
    useCases: [
      "A community question matches this search topic and needs a source-bound NexuAlpha page before any external action.",
      "The operator wants to turn high-intent search language into an onsite comparison, regional or research visit.",
    ],
    discussionPrompt:
      locale === "ko"
        ? "질문: 이 주제에서 먼저 확인해야 하는 것은 공식 출처, 상품 범위, 계정 조건, 수수료, 지갑 경로 중 무엇인가요?"
        : locale === "tr"
          ? "Soru: Bu konuda önce neyi kontrol etmelisiniz: resmi kaynak, ürün kapsamı, hesap koşulu, ücret veya cüzdan yolu?"
          : "Poll idea: What should be checked first here: source, product scope, custody, redemption, fees, account route or wallet path?",
    botCta:
      locale === "ko"
        ? "NexuAlpha Bot에서 이 리서치 경로 열기"
        : locale === "tr"
          ? "NexuAlpha Bot'ta bu araştırma yolunu aç"
          : "Open this NexuAlpha research path in the Bot",
    deepLinkAction: autoTemplateDeepLinkAction(topic),
  };
}

function renderPlainText(item) {
  return [
    item.title,
    "--------------------------------------------------",
    item.summary,
    "",
    ...(item.manualReviewSummary ? ["Manual review summary:", `- ${item.manualReviewSummary}`, ""] : []),
    "Answer first:",
    `- ${item.answerFirst}`,
    "",
    "Onsite next steps:",
    ...item.onsiteEntries.map((entry) => `- ${entry.label}: ${entry.url}`),
    ...(item.updateCadence ? ["", "Update cadence:", `- ${item.updateCadence.label}`] : []),
    "",
    "Source and update notes:",
    ...item.sourceNotes.map((note) => `- ${note}`),
    "",
    "Use this when:",
    ...item.useCases.map((useCase) => `- ${useCase}`),
    "",
    "Operator routing:",
    `- Region: ${item.region}`,
    `- Funnel stage: ${item.funnelStage}`,
    `- Search intent: ${item.searchIntent}`,
    "",
    "Question for the community:",
    `- ${item.discussionPrompt}`,
    "",
    `Read the full NexuAlpha page: ${item.canonicalBacklink}`,
    "",
    "Continue in Telegram:",
    `- ${item.botCta}: ${item.deepLink}`,
  ].join("\n");
}

function renderMarkdownV2(item) {
  const lines = [
    tgMd.bold(item.title),
    "",
    tgMd.escape(item.summary),
    "",
    ...(item.manualReviewSummary ? [tgMd.bold("Manual review summary:"), `• ${tgMd.escape(item.manualReviewSummary)}`, ""] : []),
    tgMd.bold("Answer first:"),
    `• ${tgMd.escape(item.answerFirst)}`,
    "",
    tgMd.bold("Onsite next steps:"),
    ...item.onsiteEntries.map((entry) => `• ${tgMd.link(entry.label, entry.url)}`),
    ...(item.updateCadence ? ["", tgMd.bold("Update cadence:"), `• ${tgMd.escape(item.updateCadence.label)}`] : []),
    "",
    tgMd.bold("Source and update notes:"),
    ...item.sourceNotes.map((note) => `• ${tgMd.escape(note)}`),
    "",
    tgMd.bold("Use this when:"),
    ...item.useCases.map((useCase) => `• ${tgMd.escape(useCase)}`),
    "",
    tgMd.bold("Operator routing:"),
    `• ${tgMd.escape(`Region: ${item.region}`)}`,
    `• ${tgMd.escape(`Funnel stage: ${item.funnelStage}`)}`,
    `• ${tgMd.escape(`Search intent: ${item.searchIntent}`)}`,
    "",
    tgMd.bold("Question for the community:"),
    `• ${tgMd.escape(item.discussionPrompt)}`,
    "",
    `🔎 ${tgMd.link("Read the full NexuAlpha page", item.canonicalBacklink)}`,
    "",
    tgMd.bold("Continue in Telegram:"),
    `• ${tgMd.link(item.botCta, item.deepLink)}`,
  ];
  return lines.join("\n");
}

function buildAnswerFirst(template, { funnelStage, searchIntent }) {
  if (template.answerFirst) return template.answerFirst;
  const subject = template.venues?.length ? template.venues.join(" vs ") : "this topic";
  const postureByType = {
    account_readiness: "Confirm region, identity, funding rail, product access and visible account terms before treating a signup route as ready.",
    compare_brief: `Compare ${subject} on public terms first, then verify the account-specific route before opening an exchange page.`,
    dex_route_check: "Verify the official app, wallet route, network, token or market identifier and final transaction details before signing.",
    fee_scenario: "Model the published fee scenario first, then check spread, funding, withdrawal and account conditions separately.",
    operational_guide: "Use the dated checklist first, then review account impact, open orders, bots, balances and official deadlines.",
    regional_compare: "Compare local funding, KYC, fees and product access before leaving NexuAlpha for any account route.",
    regional_decision: "Check local funding, identity, costs and account eligibility as separate steps before any registration decision.",
    regional_research: "Use the regional research page to separate official availability, account checks and product scope before acting.",
    research_digest: "Read the source-bounded explanation first, then decide whether a comparison, detail page or tool is needed.",
    search_demand_brief: "Start with the exact question the search query implies, then use NexuAlpha pages to separate claims, costs and official-source checks.",
  };
  return postureByType[template.type] || `Use this as a ${funnelStage} / ${searchIntent} research route before any Telegram or exchange handoff.`;
}

function onsiteEntryLabel(pathname, template) {
  if (pathname.startsWith("/compare/")) return "Compare platforms on NexuAlpha";
  if (pathname.startsWith("/exchanges/")) return "Open the venue detail page";
  if (pathname.startsWith("/news/")) return "Read the dated research page";
  if (pathname.startsWith("/topics/")) return "Open the topic guide";
  if (pathname.startsWith("/br/custos")) return "Use the Brazil cost tool";
  if (pathname.startsWith("/br/comparar")) return "Compare Brazil platform routes";
  if (pathname.startsWith("/br")) return "Open the Brazil regional checklist";
  if (pathname === "/mx") return "Open the Mexico regional checklist";
  if (pathname === "/hk") return "Open the Hong Kong regional checklist";
  if (pathname === "/kr") return template.locale === "ko" ? "한국 지역 리서치 열기" : "Open the Korea regional checklist";
  if (pathname === "/sg") return "Open the Singapore regional checklist";
  if (pathname === "/tr/markets/turkiye") return "Türkiye pazar kontrol listesini aç";
  if (pathname === "/markets/turkiye") return "Türkiye pazar kontrol listesini aç";
  if (pathname === "/exchanges" && template.deepLinkAction?.market === "TR") return "Türkiye platform araştırmasını aç";
  if (pathname.startsWith("/exchanges") && template.locale === "tr") return "Platform araştırma sayfasını aç";
  return template.locale === "zh-Hans" ? "打开 NexuAlpha 站内入口" : "Open the NexuAlpha onsite path";
}

function searchTopicOnsiteEntries(topic) {
  if (!topic) return null;
  return [
    { label: onsiteEntryLabel(topic.primaryPath, { ...topic, locale: topic.locale || "en" }), path: topic.primaryPath },
    ...(topic.supportPaths || []).map((pathname) => ({ label: onsiteEntryLabel(pathname, { ...topic, locale: topic.locale || "en" }), path: pathname })),
  ];
}

function secondaryOnsiteEntries(template, searchTopic = null) {
  const searchTopicEntries = searchTopicOnsiteEntries(searchTopic);
  if (searchTopicEntries) return searchTopicEntries;
  const entries = [];
  if (template.path !== "/rates") entries.push({ label: "Use the public fee scenario tool", path: "/rates" });
  if (!template.path.startsWith("/compare/") && template.venues?.length >= 2) {
    entries.push({
      label: "Compare related platforms",
      path: RELATED_COMPARE_PATH_OVERRIDES[template.id] || `/compare/${template.venues[0]}-vs-${template.venues[1]}`,
    });
  }
  if (!template.path.startsWith("/exchanges/") && template.venues?.[0]) {
    entries.push({ label: "Open the main venue detail page", path: `/exchanges/${template.venues[0]}` });
  }
  if (template.path !== "/telegram") entries.push({ label: "Review the Telegram research hub", path: "/telegram" });
  return entries;
}

function buildOnsiteEntries(template, baseUrl, canonicalBacklink, searchTopic = null) {
  const seen = new Set();
  const entries = [
    { label: onsiteEntryLabel(template.path, template), url: canonicalBacklink },
    ...secondaryOnsiteEntries(template, searchTopic).map((entry) => ({
      label: entry.label,
      url: trackedUrl(baseUrl, entry.path, template.campaign, template.locale, {
        market: normalizeTrackingValue(template.deepLinkAction?.market || regionByLocaleOrId(template)),
        locale: normalizeTrackingValue(template.locale || "en"),
        product: normalizeTrackingValue(template.deepLinkAction?.product || "research"),
        funnel: "onsite_followup",
        intent: "answer_first",
        theme: "telegram_hub",
        draft: normalizeTrackingValue(template.id),
      }),
    })),
  ];
  return entries.filter((entry) => {
    const key = new URL(entry.url).pathname;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 3);
}

function buildSearchTopicReviewSummary(template, topic) {
  if (template.manualReviewSummary) return template.manualReviewSummary;
  if (!topic) return null;
  return `${topic.query}: answer the searcher's question on NexuAlpha first, confirm the onsite page still reflects source boundaries, then keep the Telegram Bot link as a follow-up route.`;
}

function buildUpdateCadence(template, topic, reviewBy) {
  if (template.updateCadence) return template.updateCadence;
  if (!topic) return null;
  return {
    cadence: topic.cadence,
    reviewTtlDays: topic.reviewTtlDays,
    reviewBy,
    label: `Weekly manual refresh; re-check search query, onsite landing page and source notes before ${reviewBy.slice(0, 10)}.`,
  };
}

function buildBroadcast(template, baseUrl, nowIso) {
  const searchTopic = SEARCH_TOPIC_BY_ID.get(template.id) || null;
  const deepLink = getTelegramDeepLink(template.deepLinkAction);
  const region = regionByLocaleOrId(template);
  const theme = themeByType(template.type);
  const typeClassification = TYPE_CLASSIFICATION[template.type] || {
    funnelStage: "awareness",
    searchIntent: "research",
  };
  const funnelStage = template.funnelStage || typeClassification.funnelStage;
  const searchIntent = template.searchIntent || typeClassification.searchIntent;
  const gscOpportunity = template.gscOpportunityKey ? GSC_VISIBLE_OPPORTUNITIES[template.gscOpportunityKey] : null;
  const trackingContext = buildTelegramTrackingContext(template, {
    region,
    funnelStage,
    searchIntent,
    theme,
  });
  const canonicalBacklink = trackedUrl(baseUrl, template.path, template.campaign, template.locale, trackingContext);
  const onsiteEntries = buildOnsiteEntries(template, baseUrl, canonicalBacklink, searchTopic);
  const reviewBy = addDaysIso(nowIso, template.reviewTtlDays || searchTopic?.reviewTtlDays || 14);
  const updateCadence = buildUpdateCadence(template, searchTopic, reviewBy);
  const item = {
    ...template,
    publishedAt: nowIso,
    region,
    regionSegment: REGION_SEGMENTS[region] || REGION_SEGMENTS.GLOBAL,
    theme,
    funnelStage,
    searchIntent,
    reviewBy,
    expiryPolicy: "review_before_reuse; refresh source notes and onsite page before reposting",
    trackingContext,
    trackingRequiredParams: TELEGRAM_TRACKING_REQUIRED_PARAMS,
    wave: searchTopic ? searchTopic.wave || "search_topics" : template.wave,
    searchTopic: searchTopic ? {
      id: searchTopic.id,
      query: searchTopic.query,
      campaign: searchTopic.campaign,
      primaryPath: searchTopic.primaryPath,
      supportPaths: searchTopic.supportPaths,
    } : null,
    manualReviewSummary: buildSearchTopicReviewSummary(template, searchTopic),
    updateCadence,
    answerFirst: searchTopic?.answer || buildAnswerFirst(template, { funnelStage, searchIntent }),
    onsiteEntries,
    canonicalLandingUrl: canonicalBacklink,
    canonicalBacklink,
    utmReview: buildUtmReview(canonicalBacklink, trackingContext),
    landingPageReview: buildLandingPageReview(template, canonicalBacklink, onsiteEntries),
    deepLink,
    distributionStatus: "draft_not_posted",
    sourcePosture: "source-honest; no guarantee of indexing, ranking, registrations, or trading outcome",
    gscOpportunity,
  };
  return {
    ...item,
    plainText: renderPlainText(item),
    markdownV2: renderMarkdownV2(item),
  };
}

export function validateTelegramBroadcastSystem(broadcasts = generateTelegramBroadcasts()) {
  const ids = new Set();
  const campaigns = new Set();
  const deepLinks = new Set();
  const problems = [];

  for (const item of broadcasts) {
    if (ids.has(item.id)) problems.push(`duplicate id: ${item.id}`);
    ids.add(item.id);
    if (campaigns.has(item.campaign)) problems.push(`duplicate campaign: ${item.campaign}`);
    campaigns.add(item.campaign);
    if (deepLinks.has(item.deepLink)) problems.push(`duplicate bot deep link: ${item.id}`);
    deepLinks.add(item.deepLink);
    if (!item.region || !item.funnelStage || !item.searchIntent || !item.theme) {
      problems.push(`missing operating classification: ${item.id}`);
    }
    if (!item.answerFirst || typeof item.answerFirst !== "string") {
      problems.push(`missing answer-first summary: ${item.id}`);
    }
    if (!Array.isArray(item.onsiteEntries) || item.onsiteEntries.length < 2) {
      problems.push(`missing onsite answer path entries: ${item.id}`);
    }
    for (const entry of item.onsiteEntries || []) {
      if (!entry.label || !entry.url) {
        problems.push(`invalid onsite entry: ${item.id}`);
        continue;
      }
      const entryUrl = new URL(entry.url);
      if (entryUrl.origin !== DEFAULT_BASE_URL) {
        problems.push(`non-NexuAlpha onsite entry: ${item.id}`);
      }
    }
    if (!item.reviewBy || Number.isNaN(Date.parse(item.reviewBy))) {
      problems.push(`missing reviewBy timestamp: ${item.id}`);
    }
    if (isSearchTopicWave(item.wave)) {
      if (!item.searchTopic?.query || item.searchTopic.campaign !== item.campaign) {
        problems.push(`missing search topic metadata: ${item.id}`);
      }
      if (!item.manualReviewSummary || !item.manualReviewSummary.includes(item.searchTopic.query)) {
        problems.push(`missing search topic manual review summary: ${item.id}`);
      }
      if (item.updateCadence?.cadence !== "weekly_review" || item.updateCadence?.reviewTtlDays !== 7) {
        problems.push(`bad search topic update cadence: ${item.id}`);
      }
    }
    if (FORBIDDEN_RAW_EXCHANGE_REGISTRATION_URLS.test(JSON.stringify(item))) {
      problems.push(`raw exchange registration URL leaked into Telegram draft: ${item.id}`);
    }
    const canonical = new URL(item.canonicalBacklink);
    if (canonical.origin !== DEFAULT_BASE_URL) problems.push(`non-NexuAlpha canonical origin: ${item.id}`);
    if (canonical.searchParams.get("utm_source") !== TRACKING_PARAMS.utm_source) problems.push(`bad utm_source: ${item.id}`);
    if (canonical.searchParams.get("utm_medium") !== TRACKING_PARAMS.utm_medium) problems.push(`bad utm_medium: ${item.id}`);
    if (canonical.searchParams.get("utm_campaign") !== item.campaign) problems.push(`bad utm_campaign: ${item.id}`);
    if (item.canonicalLandingUrl !== item.canonicalBacklink) {
      problems.push(`canonical landing URL mismatch: ${item.id}`);
    }
    if (item.utmReview?.canonicalLandingUrl !== item.canonicalBacklink) {
      problems.push(`missing UTM review canonical URL: ${item.id}`);
    }
    if (item.landingPageReview?.primaryOnsiteCta?.url !== item.onsiteEntries?.[0]?.url) {
      problems.push(`landing review primary CTA mismatch: ${item.id}`);
    }
    for (const requiredParam of TELEGRAM_TRACKING_REQUIRED_PARAMS) {
      if (!canonical.searchParams.get(requiredParam)) {
        problems.push(`missing Telegram tracking param ${requiredParam}: ${item.id}`);
      }
    }
    for (const [key, value] of Object.entries(item.trackingContext || {})) {
      if (canonical.searchParams.get(`${TELEGRAM_CONTEXT_PARAM_PREFIX}${key}`) !== value) {
        problems.push(`tracking context mismatch ${key}: ${item.id}`);
      }
    }
    if (item.plainText.indexOf(item.canonicalBacklink) > item.plainText.indexOf(item.deepLink)) {
      problems.push(`plain text link order is not onsite-first: ${item.id}`);
    }
    if (item.markdownV2.indexOf(item.canonicalBacklink) > item.markdownV2.indexOf(item.deepLink)) {
      problems.push(`markdown link order is not onsite-first: ${item.id}`);
    }
  }

  return {
    ok: problems.length === 0,
    problems,
    rawExchangeRegistrationLinks: broadcasts.some((item) => FORBIDDEN_RAW_EXCHANGE_REGISTRATION_URLS.test(JSON.stringify(item))),
    requiredUtmParams: broadcasts.every((item) => {
      const canonical = new URL(item.canonicalBacklink);
      return TELEGRAM_TRACKING_REQUIRED_PARAMS.every((param) => Boolean(canonical.searchParams.get(param)));
    }),
    humanAuthorizationRequired: true,
    counts: {
      broadcasts: broadcasts.length,
      ids: ids.size,
      campaigns: campaigns.size,
      deepLinks: deepLinks.size,
    },
  };
}

const broadcastTemplates = [
  {
    id: "compare-binance-vs-okx-en",
    type: "compare_brief",
    locale: "en",
    campaign: "compare_binance_okx_en",
    path: "/compare/binance-vs-okx",
    venues: ["binance", "okx"],
    title: "Binance vs OKX: compare the public terms before opening an account",
    summary: "A compact decision prompt for users choosing between the two flagship CEX routes.",
    sourceNotes: [
      "Fee, VIP, deposit, product and welcome terms vary by account, region and official update time.",
      "NexuAlpha compares published terms and official-route context; it does not expose private partner economics.",
      "User benefits must be checked in the official account flow before signup is treated as complete.",
    ],
    useCases: [
      "You want one page that separates spot fees, derivatives access, Web3 wallet paths and source notes.",
      "You already narrowed the choice to Binance or OKX and need a registration-readiness checklist.",
    ],
    discussionPrompt: "Poll idea: Which decision blocks you first: fees, KYC, deposits, product access, or official welcome terms?",
    botCta: "Open the Binance vs OKX research path in the NexuAlpha Bot",
    deepLinkAction: { action: "compare", pair: "binance-vs-okx", locale: "en", product: "spot", campaign: "compare_binance_okx_en" },
  },
  {
    id: "compare-bybit-vs-bitget-en",
    type: "compare_brief",
    locale: "en",
    campaign: "compare_bybit_bitget_en",
    path: "/compare/bybit-vs-bitget",
    venues: ["bybit", "bitget"],
    title: "Bybit vs Bitget: copy trading, derivatives and signup checks in one pass",
    summary: "A short broadcast for users who are comparing derivatives UX, copy-trading paths and onboarding terms.",
    sourceNotes: [
      "Published base rates do not include account-specific benefits, funding, slippage or regional restrictions.",
      "Referral and welcome terms should be verified in the official account route before the user relies on them.",
      "NexuAlpha is an independent comparison hub and does not operate either exchange.",
    ],
    useCases: [
      "You care about futures tools, copy trading and operational fit more than brand familiarity.",
      "You need a side-by-side checklist before deciding which official signup path to open.",
    ],
    discussionPrompt: "Poll idea: For derivatives users, what matters most before signup: fees, copy trading, liquidity, risk controls, or local access?",
    botCta: "Open the Bybit vs Bitget comparison in the NexuAlpha Bot",
    deepLinkAction: { action: "compare", pair: "bybit-vs-bitget", locale: "en", product: "perpetuals", campaign: "compare_bybit_bitget_en" },
  },
  {
    id: "hyperliquid-fees-en",
    type: "search_demand_brief",
    locale: "en",
    campaign: "hyperliquid_fees_en",
    path: "/exchanges/hyperliquid",
    venues: ["hyperliquid"],
    title: "Hyperliquid fees: check trading fees, funding and liquidation as separate costs",
    summary: "A source-bounded checklist for readers searching Hyperliquid fees before they bridge funds or open a Perp DEX position.",
    gscOpportunityKey: "hyperliquid_fees",
    sourceNotes: [
      "Published base fees are only one cost input; funding, margin, liquidation and wallet transfer conditions require separate checks.",
      "The page treats Hyperliquid as a Perp DEX research route, not as a guaranteed discount or signup-benefit page.",
      "Current conditions must be verified against the linked official sources and the live product interface.",
    ],
    useCases: [
      "You are comparing Perp DEX cost mechanics before depositing or bridging funds.",
      "You need one checklist for fees, funding, collateral, liquidation and official-domain verification.",
    ],
    discussionPrompt: "Poll idea: What is hardest to compare on a Perp DEX: trading fees, funding, margin, liquidation, wallet transfers or regional access?",
    botCta: "Open the Hyperliquid source-check path in the NexuAlpha Bot",
    deepLinkAction: { action: "verify_domain", venue: "hyperliquid", locale: "en", product: "perpetuals", campaign: "hyperliquid_fees_en" },
  },
  {
    id: "hyperliquid-funded-account-en",
    type: "search_demand_brief",
    locale: "en",
    campaign: "hyperliquid_funded_account_en",
    path: "/exchanges/hyperliquid",
    venues: ["hyperliquid"],
    title: "Hyperliquid funded account search: separate wallet funding from prop-account claims",
    summary: "A clarification draft for users who search funded account terms and need to distinguish deposits, margin funding, vaults and third-party prop trading language.",
    gscOpportunityKey: "hyperliquid_funded_account",
    sourceNotes: [
      "A funded account phrase can mean account deposits, collateral funding, vault participation or a third-party prop program; the page does not merge those meanings.",
      "NexuAlpha does not present Hyperliquid as a prop-funded account provider or promise account allocation, approval or profit split.",
      "Users should verify official docs, wallet route, regional access and risk terms before treating any funded-account claim as actionable.",
    ],
    useCases: [
      "You searched Hyperliquid funded account and need to know which meaning applies before clicking a route.",
      "You want to avoid confusing a self-custody Perp DEX wallet flow with a third-party trading-capital program.",
    ],
    discussionPrompt: "Poll idea: When people say funded account, do they mean deposit route, margin collateral, vault participation, prop capital or something else?",
    botCta: "Open the Hyperliquid funded-account clarification path in the NexuAlpha Bot",
    deepLinkAction: { action: "verify_domain", venue: "hyperliquid", locale: "en", product: "perpetuals", campaign: "hyperliquid_funded_account_en" },
  },
  {
    id: "uniswap-testnet-en",
    type: "search_demand_brief",
    locale: "en",
    campaign: "uniswap_testnet_en",
    path: "/exchanges/uniswap",
    venues: ["uniswap"],
    title: "Uniswap testnet research: verify the app, network and token contract first",
    summary: "A wallet-first route for readers researching Uniswap testnets, swaps and official domains before connecting a wallet.",
    gscOpportunityKey: "uniswap_testnet",
    sourceNotes: [
      "Testnet networks, faucets and deployment details change; the page points to official documentation rather than publishing an unverified token address.",
      "Gas, routing, price impact and pool liquidity are separate from the protocol fee label.",
      "NexuAlpha does not request seed phrases, custody funds or certify a token contract as safe.",
    ],
    useCases: [
      "You need to verify the official Uniswap app and documentation before connecting a wallet.",
      "You want a checklist for network, token contract, approval, gas and route conditions.",
    ],
    discussionPrompt: "Poll idea: Before a DEX swap, what do you verify first: app domain, network, token contract, approval, gas or price impact?",
    botCta: "Open the Uniswap domain-check path in the NexuAlpha Bot",
    deepLinkAction: { action: "verify_domain", venue: "uniswap", locale: "en", product: "spot", campaign: "uniswap_testnet_en" },
  },
  {
    id: "jupiter-swap-route-en",
    type: "dex_route_check",
    locale: "en",
    campaign: "jupiter_swap_route_en",
    path: "/exchanges/jupiter",
    venues: ["jupiter"],
    title: "Jupiter route check: review quote, mint, route legs and wallet transaction before signing",
    summary: "A Solana DEX draft for users comparing Jupiter Swap or Ultra routes before they approve a wallet-built transaction.",
    sourceNotes: [
      "Jupiter is treated as a self-custody routing path; NexuAlpha does not describe it as a custodial exchange account or signup-benefit page.",
      "Route output, token mint status, slippage, platform-fee configuration, wallet fees and Solana network costs must be checked separately.",
      "Current execution conditions should be verified against Jupiter docs, the live app and the final wallet transaction before signing.",
    ],
    useCases: [
      "You are about to use a Solana swap route and need a checklist before approving the transaction.",
      "You want to explain why a good quote does not prove token safety, zero fees or final execution quality.",
    ],
    discussionPrompt: "Poll idea: Before signing a Jupiter route, what do you check first: token mint, route legs, slippage, fees, wallet transaction or app domain?",
    botCta: "Open the Jupiter source-check path in the NexuAlpha Bot",
    deepLinkAction: { action: "verify_domain", venue: "jupiter", locale: "en", product: "spot", campaign: "jupiter_swap_route_en" },
  },
  {
    id: "aerodrome-base-pool-en",
    type: "dex_route_check",
    locale: "en",
    campaign: "aerodrome_base_pool_en",
    path: "/exchanges/aerodrome",
    venues: ["aerodrome"],
    title: "Aerodrome on Base: check network, pool fee type and reward boundary before swapping",
    summary: "A Base DEX draft for users checking Aerodrome routes without confusing a swap with veAERO voting or reward entitlement.",
    sourceNotes: [
      "Aerodrome is framed as a Base network DEX route; bridge, wallet, token contract and pool address checks remain user-side prerequisites.",
      "Standard pools, Slipstream liquidity, voting incentives and veAERO rewards are separate mechanics and should not be merged into one fee claim.",
      "The draft links to NexuAlpha research first; it does not include raw exchange signup links or promise rewards, eligibility or trading outcome.",
    ],
    useCases: [
      "You need to verify Base network readiness and pool-level cost mechanics before a swap.",
      "You want a clear boundary between swap execution, liquidity incentives, voting and reward claims.",
    ],
    discussionPrompt: "Poll idea: On Aerodrome, what is easiest to miss: Base network, bridge path, token contract, pool fee, incentive flow or veAERO reward rules?",
    botCta: "Open the Aerodrome source-check path in the NexuAlpha Bot",
    deepLinkAction: { action: "verify_domain", venue: "aerodrome", locale: "en", product: "spot", campaign: "aerodrome_base_pool_en" },
  },
  {
    id: "no-kyc-dex-check-en",
    type: "search_demand_brief",
    locale: "en",
    campaign: "no_kyc_dex_check_en",
    path: "/topics/no-kyc",
    venues: ["hyperliquid", "uniswap"],
    title: "No-KYC crypto exchange search: separate wallet routes from account claims",
    summary: "A NexuAlpha-first draft for users searching no-KYC access and needing a clean split between self-custody DEX paths, exchange accounts and regional limits.",
    gscOpportunityKey: "no_kyc_crypto_exchange",
    sourceNotes: [
      "No-KYC language can describe non-custodial wallet access, limited account tiers, regional restrictions or a marketing claim; those meanings must stay separate.",
      "NexuAlpha does not promise anonymous trading, fiat access, withdrawal limits, local eligibility or a lower-risk route.",
      "Users should check official domain, custody model, wallet signature, network, token route and account terms before taking action.",
    ],
    useCases: [
      "You searched no-KYC crypto exchange and need to know whether the route is a self-custody protocol or a custodial account.",
      "You want a safe checklist before comparing Hyperliquid, Uniswap, Jupiter or another wallet-based route.",
    ],
    discussionPrompt: "Poll idea: In no-KYC research, what should be checked first: custody, fiat access, withdrawal limits, region, wallet signature, bridge route or protocol risk?",
    botCta: "Open the no-KYC route checklist in the NexuAlpha Bot",
    deepLinkAction: { action: "verify_domain", venue: "hyperliquid", locale: "en", product: "research", campaign: "no_kyc_dex_check_en" },
  },
  {
    id: "tokenized-treasuries-en",
    type: "research_digest",
    locale: "en",
    campaign: "tokenized_treasuries_en",
    path: priorityCanonicalOwnerPath("tokenized treasury"),
    venues: [],
    title: "Tokenized treasuries: separate the token, issuer, custodian and redemption claim",
    summary: "A research digest for readers comparing tokenized Treasury structures without treating every token as direct ownership of U.S. government debt.",
    gscOpportunityKey: "tokenized_treasury",
    sourceNotes: [
      "A token may represent a fund share, note, beneficial interest or another contractual claim; the legal structure must be checked item by item.",
      "Issuer, custodian, reserve asset, transfer restrictions and redemption terms are separate evidence fields.",
      "The article is educational research and does not promise yield, liquidity, redemption or regulatory eligibility.",
    ],
    useCases: [
      "You need a structure checklist before comparing tokenized Treasury products.",
      "You want to distinguish the underlying asset from the token holder's actual legal claim.",
    ],
    discussionPrompt: "Poll idea: What is least clear in tokenized treasuries: issuer, custody, legal claim, yield source, transfer restrictions or redemption?",
    botCta: "Open the source-research path in the NexuAlpha Bot",
    deepLinkAction: { action: "rates", venue: "all", locale: "en", campaign: "tokenized_treasuries_en" },
  },
  {
    id: "bybit-bitget-stock-exposure-en",
    type: "search_demand_brief",
    locale: "en",
    campaign: "bybit_bitget_stock_exposure_en",
    path: "/compare/bybit-vs-bitget",
    venues: ["bybit", "bitget"],
    title: "Bybit vs Bitget stocks: separate real shares, tokenized stock exposure and stock perps",
    summary: "A decision draft for readers comparing Bybit and Bitget because a stock-related product appears in search, copy trading or derivatives research.",
    gscOpportunityKey: "bitget_bybit_stocks",
    sourceNotes: [
      "A stock keyword can refer to real shares, tokenized stocks, stock perpetuals, indices, copy-trading portfolios or regional product labels.",
      "The comparison page does not promise that either platform offers a specific stock product, margin mode or local eligibility.",
      "Users should verify product scope, account region, risk disclosures and official account terms before opening a route.",
    ],
    useCases: [
      "You searched Bybit vs Bitget with a stock-related phrase and need to know what exposure type is actually being compared.",
      "You want to avoid treating tokenized-stock or stock-perp language as the same thing as owning listed shares.",
    ],
    discussionPrompt: "Poll idea: In a crypto platform stock product, what needs the clearest label: real share, tokenized claim, stock perp, margin, copy-trading exposure or country access?",
    botCta: "Open the Bybit vs Bitget stock-exposure checklist in the NexuAlpha Bot",
    deepLinkAction: { action: "compare", pair: "bybit-vs-bitget", locale: "en", product: "perpetuals", campaign: "bybit_bitget_stock_exposure_en" },
  },
  {
    id: "crypto-perpetual-platform-en",
    type: "search_demand_brief",
    locale: "en",
    campaign: "crypto_perpetual_platform_en",
    path: "/topics/derivatives",
    venues: ["hyperliquid", "dydx"],
    title: "Crypto perpetual platform check: compare custody, collateral, funding and liquidation first",
    summary: "A NexuAlpha-first route for users searching broad perp-platform terms before choosing a wallet-based derivatives venue.",
    gscOpportunityKey: "crypto_perpetual_platform",
    sourceNotes: [
      "A perpetual platform comparison should separate custody model, collateral, margin, funding payments, liquidation logic and official app domain.",
      "NexuAlpha does not declare a universal best platform or a cheapest live route; current terms must be checked at the official source.",
      "The Telegram draft is for research handoff only and does not include exchange registration URLs.",
    ],
    useCases: [
      "You want a first-pass checklist before comparing Hyperliquid, dYdX or another crypto perpetual platform.",
      "You need to explain why wallet custody, leverage and funding are separate decisions from a simple fee label.",
    ],
    discussionPrompt: "Poll idea: When choosing a perp platform, what do you compare first: custody, collateral, funding, liquidation, fees, liquidity or regional access?",
    botCta: "Open the perpetual-platform research path in the NexuAlpha Bot",
    deepLinkAction: { action: "compare", pair: "hyperliquid-vs-dydx", locale: "en", product: "perpetuals", campaign: "crypto_perpetual_platform_en" },
  },
  {
    id: "hyperliquid-latest-news-en",
    type: "search_demand_brief",
    locale: "en",
    campaign: "hyperliquid_latest_news_en",
    path: "/news/hyperliquid-vs-dydx",
    venues: ["hyperliquid", "dydx"],
    title: "Hyperliquid latest news search: use dated research, not rumor or live-price claims",
    summary: "A cautious route for readers who arrive through Hyperliquid news searches and need source dates, product boundaries and comparison context.",
    gscOpportunityKey: "hyperliquid_latest_news",
    sourceNotes: [
      "This draft does not claim to be a live newswire, market alert or real-time price update.",
      "Research pages should show source dates, official-domain references and what changed before users act on a protocol comparison.",
      "Trading conditions, funding and eligibility can move after a post is drafted, so reuse requires review before posting.",
    ],
    useCases: [
      "You searched for Hyperliquid latest news and need a dated source trail before acting on social posts.",
      "You want to compare Hyperliquid and dYdX without treating a headline as a trading signal.",
    ],
    discussionPrompt: "Poll idea: For protocol news, what proof do you want first: source date, official link, product change, risk change, fee impact or account impact?",
    botCta: "Open the Hyperliquid news-research path in the NexuAlpha Bot",
    deepLinkAction: { action: "rates", venue: "hyperliquid", locale: "en", product: "perpetuals", campaign: "hyperliquid_latest_news_en" },
  },
  {
    id: "hyperliquid-funding-hourly-en",
    type: "search_demand_brief",
    locale: "en",
    campaign: "hyperliquid_funding_hourly_en",
    path: "/exchanges/hyperliquid",
    venues: ["hyperliquid"],
    title: "Hyperliquid funding payments: read the schedule separately from the trading fee",
    summary: "A short draft for users checking funding mechanics before holding a perpetual position on Hyperliquid.",
    gscOpportunityKey: "hyperliquid_funding_hourly",
    sourceNotes: [
      "Funding mechanics are not the same as maker/taker trading fees, collateral requirements or liquidation rules.",
      "The draft points to NexuAlpha's source-check page and does not quote a real-time funding rate.",
      "Users should confirm the current official docs, product interface and wallet route before holding a position.",
    ],
    useCases: [
      "You need to explain why funding payments can change the cost of a perp position after entry.",
      "You are checking Hyperliquid cost mechanics before connecting a wallet or increasing leverage.",
    ],
    discussionPrompt: "Poll idea: Before holding a perp, which cost do you check last: funding, maker/taker fee, liquidation, collateral, bridge cost or slippage?",
    botCta: "Open the Hyperliquid funding checklist in the NexuAlpha Bot",
    deepLinkAction: { action: "fee_calc", venue: "hyperliquid", locale: "en", product: "perpetuals", campaign: "hyperliquid_funding_hourly_en" },
  },
  {
    id: "tokenized-stock-margin-zh",
    type: "search_demand_brief",
    locale: "zh-Hans",
    campaign: "tokenized_stock_margin_zh",
    path: "/compare/bybit-vs-bitget",
    venues: ["bybit", "bitget"],
    title: "代币化股票保证金：先区分股票、代币化敞口和股票永续",
    summary: "这条给搜索“代币化股票保证金”的用户：不要把股票所有权、代币化凭证、股票永续和保证金规则混成一个承诺。",
    gscOpportunityKey: "tokenized_stock_margin_zh",
    sourceNotes: [
      "不同平台可能使用股票、代币化股票、股票永续、指数或跟单策略等不同标签。",
      "NexuAlpha 只把它作为产品边界核对问题，不承诺地区可用、保证金倍数、收益或持仓权益。",
      "开户、保证金、风险披露和产品准入必须以官方账户当期页面为准。",
    ],
    useCases: [
      "用户问 Bybit 与 Bitget 的股票相关产品到底是不是买股票。",
      "社群需要一条中文草稿，把保证金、代币化敞口、永续合约和真实股权拆开解释。",
    ],
    discussionPrompt: "投票问题：你最想先核对哪一项：真实股票、代币化凭证、股票永续、保证金规则、地区限制，还是账户风险披露？",
    botCta: "在 Bot 里打开股票敞口边界核对路径",
    deepLinkAction: { action: "compare", pair: "bybit-vs-bitget", locale: "zh-Hans", product: "perpetuals", campaign: "tokenized_stock_margin_zh" },
  },
  {
    id: "okx-usd-usdc-migration-en",
    type: "operational_guide",
    locale: "en",
    campaign: "okx_usd_usdc_migration_en",
    path: "/news/okx-usd-to-usdc-spot-pair-migration",
    venues: ["okx"],
    title: "OKX USD to USDC migration: check instruments, orders and bots before acting",
    summary: "An operations-focused draft for users who find the OKX migration article and need an account-safe checklist rather than a trading signal.",
    gscOpportunityKey: "okx_usd_usdc_migration",
    sourceNotes: [
      "The visible opportunity is page-level Search Console demand for the migration article, not proof of completed account action.",
      "API instrument IDs, open orders, margin positions, balances and bot settings should be checked against official OKX notices and the user's account.",
      "The draft does not promise execution quality, balance conversion, fee outcome or eligibility.",
    ],
    useCases: [
      "You use OKX spot, API or bots and need to identify what could change during a USD to USDC pair migration.",
      "You want to route a migration question back to a dated NexuAlpha checklist before touching live orders.",
    ],
    discussionPrompt: "Poll idea: In an exchange pair migration, what would you check first: instrument ID, open orders, bots, balances, margin, fees or official deadline?",
    botCta: "Open the OKX migration checklist in the NexuAlpha Bot",
    deepLinkAction: { action: "verify_domain", venue: "okx", locale: "en", product: "spot", campaign: "okx_usd_usdc_migration_en" },
  },
  {
    id: "brazil-pix-ptbr",
    type: "regional_decision",
    locale: "pt-BR",
    campaign: "br_pix_ptbr",
    path: "/br/pix",
    venues: ["binance", "okx", "bitget"],
    title: "Brasil: confira Pix, BRL e etapas de conta antes do cadastro",
    summary: "Um post curto para quem quer decidir a rota de entrada em BRL sem confundir publicidade com termos oficiais.",
    sourceNotes: [
      "Disponibilidade de Pix, CPF, KYC, tarifas e benefícios depende do produto, da região e da conta oficial.",
      "A página mostra um caminho de pesquisa; não promete aprovação, desconto, bônus ou resultado financeiro.",
      "Condições de usuário devem ser confirmadas no fluxo oficial antes do depósito ou da primeira negociação.",
    ],
    useCases: [
      "Você quer comparar a rota de entrada BRL/Pix antes de criar conta.",
      "Você precisa separar custo de depósito, trading spot e verificação de benefícios.",
    ],
    discussionPrompt: "Enquete: antes do cadastro, o que você confirma primeiro: domínio oficial, Pix/BRL, CPF/KYC, limites, tarifas ou benefício na conta?",
    botCta: "Abrir o caminho Brasil/Pix no Bot da NexuAlpha",
    deepLinkAction: { action: "compare", pair: "binance-vs-okx", market: "BR", locale: "pt-BR", product: "spot", campaign: "br_pix_ptbr" },
  },
  {
    id: "brazil-saque-pix-ptbr",
    type: "regional_decision",
    locale: "pt-BR",
    campaign: "br_saque_pix_ptbr",
    path: "/br/saque-pix",
    venues: ["binance", "okx", "bitget"],
    title: "Brasil: saque Pix exige conta no mesmo nome, limite e status confirmado",
    summary: "Um rascunho para quem ja tem rota de entrada e agora precisa evitar erro na saida em BRL.",
    sourceNotes: [
      "Saque Pix, TED, limite, horario, revisao manual e disponibilidade variam por plataforma, produto e conta.",
      "Nome, CPF e conta bancaria de titularidade propria devem ser tratados como verificacoes separadas antes da retirada.",
      "NexuAlpha organiza o checklist; confirmacao final fica sempre no fluxo oficial da plataforma.",
    ],
    useCases: [
      "Voce quer saber o que conferir antes de sacar BRL via Pix.",
      "Voce precisa explicar por que deposito, trading, KYC e saque podem ter regras diferentes.",
    ],
    discussionPrompt: "Enquete: antes do saque Pix, o que voce confere primeiro: nome, CPF, banco, limite, horario, taxa ou status da conta?",
    botCta: "Abrir o checklist de saque Pix Brasil no Bot da NexuAlpha",
    deepLinkAction: { action: "partner_desk", market: "BR", locale: "pt-BR", product: "spot", campaign: "br_saque_pix_ptbr" },
  },
  {
    id: "brazil-kyc-cpf-ptbr",
    type: "regional_decision",
    locale: "pt-BR",
    campaign: "br_kyc_cpf_ptbr",
    path: "/br/kyc-cpf",
    venues: ["binance", "okx", "bitget"],
    title: "Brasil: CPF, nome e KYC precisam bater antes da conta virar rota de trading",
    summary: "Um rascunho para reduzir erro de cadastro: verificar CPF, nome, residencia, banco proprio e produto antes do primeiro deposito.",
    sourceNotes: [
      "KYC, CPF, residencia, banco proprio, limites e produtos liberados dependem da plataforma e da analise da conta.",
      "A pagina nao promete aprovacao, bonus, desconto ou liberacao de saque.",
      "Beneficios publicos e codigos de convite so devem ser considerados depois de aparecerem ou serem confirmados no fluxo oficial.",
    ],
    useCases: [
      "Voce esta abrindo conta no Brasil e quer reduzir erro de CPF, nome ou banco.",
      "Voce precisa separar elegibilidade da conta, campanha, beneficio e produto spot.",
    ],
    discussionPrompt: "Enquete: no KYC, qual etapa mais trava: CPF, nome completo, residencia, documento, banco proprio, limite ou produto liberado?",
    botCta: "Abrir o checklist CPF/KYC Brasil no Bot da NexuAlpha",
    deepLinkAction: { action: "partner_desk", market: "BR", locale: "pt-BR", product: "spot", campaign: "br_kyc_cpf_ptbr" },
  },
  {
    id: "brazil-cost-ptbr",
    type: "fee_scenario",
    locale: "pt-BR",
    campaign: "br_costs_ptbr",
    path: "/br/custos",
    venues: ["binance", "okx", "bitget"],
    title: "Brasil: simule custo publicado antes de escolher a corretora",
    summary: "Um convite para usar o cenário de taxas publicado, sem tratar a simulação como benefício garantido.",
    sourceNotes: [
      "A simulação usa taxas públicas e premissas editáveis; ela não inclui todas as condições de conta.",
      "Funding, spread, saque, conversão, impostos e elegibilidade local precisam de revisão separada.",
      "Resultados reais de cadastro, comissão ou retenção não são inferidos pela página.",
    ],
    useCases: [
      "Você quer estimar custo de spot em BRL antes de abrir uma conta.",
      "Você precisa explicar por que a menor taxa publicada nem sempre é o menor custo total.",
    ],
    discussionPrompt: "Enquete: na sua escolha, pesa mais taxa spot publicada, spread, Pix/BRL, saque, VIP ou benefício confirmado na tela oficial?",
    botCta: "Abrir a calculadora Brasil no Bot da NexuAlpha",
    deepLinkAction: { action: "fee_calc", venue: "binance", market: "BR", locale: "pt-BR", product: "spot", campaign: "br_costs_ptbr" },
  },
  {
    id: "brazil-account-ptbr",
    type: "account_readiness",
    locale: "pt-BR",
    campaign: "br_account_ptbr",
    path: "/br/conta",
    venues: ["binance", "okx", "bitget"],
    title: "Brasil: confirme conta, produto e benefício antes de sair para o cadastro",
    summary: "A conclusão prática: o link parceiro abre a rota oficial, mas elegibilidade, código, bônus, tarifa e produto precisam aparecer ou ser confirmados dentro da própria conta oficial.",
    sourceNotes: [
      "A página separa link parceiro, código de convite, elegibilidade de campanha, tarefas de conta e tela final da plataforma.",
      "NexuAlpha não publica comissão privada nem trata benefício, aprovação ou desconto como garantido.",
      "Antes de negociar ou depositar, o usuário deve conferir domínio oficial, região, produto, KYC e termos visíveis na conta.",
    ],
    useCases: [
      "Você já escolheu uma corretora, mas quer reduzir erro de rota antes de criar conta.",
      "Você precisa explicar por que link, código e benefício final são etapas diferentes.",
    ],
    discussionPrompt: "Enquete: qual etapa mais causa dúvida antes do cadastro: link parceiro, código, KYC, campanha, produto ou confirmação final na conta?",
    botCta: "Abrir o checklist de conta Brasil no Bot da NexuAlpha",
    deepLinkAction: { action: "partner_desk", market: "BR", locale: "pt-BR", product: "spot", campaign: "br_account_ptbr" },
  },
  {
    id: "brazil-hub-ptbr",
    type: "regional_decision",
    locale: "pt-BR",
    campaign: "br_hub_ptbr",
    path: "/br",
    venues: ["binance", "okx", "bitget"],
    title: "Brasil: escolha o caminho de entrada antes de abrir a conta",
    summary: "Um post de topo de funil para usuários que ainda não sabem se devem começar por Pix, custo, comparação ou checklist de conta.",
    sourceNotes: [
      "A página organiza fontes oficiais sobre Pix, BRL, CPF, KYC e condições de conta; ela não substitui a tela oficial da plataforma.",
      "Link parceiro, código, campanha e benefício visível na conta continuam sendo etapas separadas.",
      "NexuAlpha não publica comissão privada nem promete aprovação, bônus, desconto ou resultado financeiro.",
    ],
    useCases: [
      "Você quer uma visão geral antes de comparar Binance, OKX ou Bitget no Brasil.",
      "Você precisa decidir se sua próxima etapa é Pix/BRL, custo total, comparação ou confirmação de conta.",
    ],
    discussionPrompt: "Enquete: no Brasil, qual pergunta vem primeiro para você: Pix/BRL, taxa total, KYC/CPF, plataforma, ou benefício visível na conta?",
    botCta: "Abrir o hub Brasil no Bot da NexuAlpha",
    deepLinkAction: { action: "partner_desk", market: "BR", locale: "pt-BR", product: "spot", campaign: "br_hub_ptbr" },
  },
  {
    id: "brazil-compare-ptbr",
    type: "regional_compare",
    locale: "pt-BR",
    campaign: "br_compare_ptbr",
    path: "/br/comparar",
    venues: ["binance", "okx"],
    title: "Brasil: compare Binance e OKX por Pix, custo e conta",
    summary: "Uma rota curta para quem já quer comparar duas plataformas antes de sair para o cadastro.",
    sourceNotes: [
      "A comparação usa fontes oficiais de entrada em BRL/Pix e conta; disponibilidade final depende do fluxo exibido ao usuário.",
      "Taxa spot, depósito, spread, saque, limite e campanha devem ser conferidos separadamente.",
      "A página não afirma benefício automático por link ou código parceiro.",
    ],
    useCases: [
      "Você está entre Binance e OKX e quer reduzir erro de rota antes de abrir conta.",
      "Você precisa explicar por que Pix, CPF, custo e condição de campanha podem mudar a escolha.",
    ],
    discussionPrompt: "Enquete: ao comparar Binance e OKX no Brasil, o que decide primeiro: Pix, taxa, saque, KYC, produto ou campanha?",
    botCta: "Abrir a comparação Brasil no Bot da NexuAlpha",
    deepLinkAction: { action: "compare", pair: "binance-vs-okx", market: "BR", locale: "pt-BR", product: "spot", campaign: "br_compare_ptbr" },
  },
  {
    id: "mexico-spei-es",
    type: "regional_research",
    locale: "es",
    campaign: "mx_spei_es",
    path: "/mx",
    venues: ["binance", "okx"],
    title: "México: revisa SPEI, Medá, identidad y producto antes de elegir una plataforma",
    summary: "Una entrada de investigación para usuarios mexicanos que necesitan separar la ruta documentada de Binance MXN/SPEI/Medá, la verificación de cuenta y el alcance del producto.",
    sourceNotes: [
      "Las fuentes enlazadas son guías oficiales y referencias regulatorias; no prueban elegibilidad individual ni beneficio de campaña.",
      "Binance publica una guía MXN/SPEI/Medá que sirve como punto de partida documentado; OKX u otra plataforma global debe verificarse dentro de su propio flujo oficial de cuenta.",
      "SPEI, MXN, Medá, identidad, residencia y producto deben verificarse en el flujo oficial de la cuenta.",
      "NexuAlpha envía primero a la página de investigación, no a un enlace directo de registro.",
    ],
    useCases: [
      "Quieres saber qué revisar sobre MXN/SPEI/Medá antes de abrir una cuenta cripto.",
      "Necesitas comparar condiciones de cuenta y producto sin asumir que la ruta documentada de una plataforma aplica a otra.",
    ],
    discussionPrompt: "Encuesta: antes de registrarte en México, ¿qué revisas primero: SPEI/MXN, identidad, residencia, producto, dominio oficial o costos?",
    botCta: "Abrir la ruta México en el Bot de NexuAlpha",
    deepLinkAction: { action: "partner_desk", market: "MX", locale: "es", product: "spot", campaign: "mx_spei_es" },
  },
  {
    id: "hong-kong-account-en",
    type: "regional_research",
    locale: "en",
    campaign: "hk_account_en",
    path: "/hk",
    venues: ["osl", "hashkey", "coinbase"],
    title: "Hong Kong: check platform status, account steps and funding before signup",
    summary: "A research-first note for users comparing Hong Kong platform status, identity checks and funding paths.",
    sourceNotes: [
      "Published SFC or platform references help with research; they do not guarantee suitability, approval or product access.",
      "Identity, address, bank verification and product scope remain account-specific and must be checked in the official flow.",
      "This draft keeps Telegram traffic on NexuAlpha before any exchange handoff.",
    ],
    useCases: [
      "You need a checklist for Hong Kong platform status and account conditions before choosing a route.",
      "You want to separate regulator records, platform onboarding and funding availability.",
    ],
    discussionPrompt: "Poll idea: For Hong Kong, what would you verify first: platform status, identity, address, bank funding, product scope or fees?",
    botCta: "Open the Hong Kong research path in the NexuAlpha Bot",
    deepLinkAction: { action: "partner_desk", market: "HK", locale: "en", product: "spot", campaign: "hk_account_en" },
  },
  {
    id: "korea-regulatory-context-ko",
    type: "regional_research",
    locale: "ko",
    campaign: "kr_regulatory_context_ko",
    path: "/kr",
    venues: ["upbit", "hyperliquid", "uniswap"],
    title: "한국: 플랫폼 비교 전 공식 규제 맥락과 계정 조건부터 확인하세요",
    summary: "한국 이용자를 위한 NexuAlpha 우선 리서치 경로입니다. FSC/KOFIU 맥락, 본인확인, KRW 입금, 글로벌 DEX 경로를 분리해서 봅니다.",
    sourceNotes: [
      "FSC/KOFIU 자료는 규제 맥락을 확인하는 출처이며, 특정 계정 승인이나 상품 접근을 보장하지 않습니다.",
      "Upbit 같은 현지 플랫폼 안내와 Hyperliquid/Uniswap 같은 글로벌 경로는 계정 구조와 리스크가 다릅니다.",
      "Telegram 초안은 NexuAlpha 페이지로 먼저 보내며 원시 거래소 가입 링크, 초대코드 또는 비공개 커미션을 포함하지 않습니다.",
    ],
    useCases: [
      "한국 이용자가 플랫폼을 고르기 전에 공식 출처와 계정 조건을 한 번에 정리해야 할 때.",
      "KRW 계정 경로와 글로벌 DEX/Perp DEX 리서치를 같은 기준으로 분리해 설명해야 할 때.",
    ],
    discussionPrompt: "질문: 한국에서 플랫폼 선택 전에 무엇을 먼저 확인하시나요? 규제 맥락, 본인확인, 원화 입금, 상품 범위, 수수료, 공식 도메인 중 하나를 골라주세요.",
    botCta: "NexuAlpha Bot에서 한국 리서치 경로 열기",
    deepLinkAction: { action: "partner_desk", market: "KR", locale: "ko", product: "spot", campaign: "kr_regulatory_context_ko" },
  },
  {
    id: "korea-krw-funding-ko",
    type: "regional_decision",
    locale: "ko",
    campaign: "kr_krw_funding_ko",
    path: "/kr",
    venues: ["upbit", "hyperliquid"],
    title: "원화 입금 전: 실명확인 계좌, 고객확인, 한도와 상품 범위를 따로 보세요",
    summary: "KRW 입금 의도가 있는 사용자를 NexuAlpha 한국 리서치로 되돌리는 초안입니다. 글로벌 비교와 현지 입금 조건을 섞지 않습니다.",
    sourceNotes: [
      "원화 입출금 안내는 플랫폼의 현재 공식 도움말과 앱 화면에서 다시 확인해야 합니다.",
      "파트너 링크나 글로벌 비교 페이지는 원화 입금 가능성, 계정 승인, 혜택 적용을 증명하지 않습니다.",
      "Hyperliquid/Uniswap은 지갑 또는 프로토콜 리서치 경로로 다루며 KRW 입금 대체 경로로 표현하지 않습니다.",
    ],
    useCases: [
      "사용자가 원화 입금 가능 여부를 묻고 아직 플랫폼을 선택하지 않았을 때.",
      "CEX 입금 조건과 DEX 지갑 경로를 분리해 CTA 이전의 판단을 줄이고 싶을 때.",
    ],
    discussionPrompt: "질문: 원화 입금 전에 가장 헷갈리는 것은 무엇인가요? 실명계좌, KYC, 입금한도, 수수료, 출금, 상품 접근 중 하나를 알려주세요.",
    botCta: "NexuAlpha Bot에서 KRW 입금 체크 경로 열기",
    deepLinkAction: { action: "partner_desk", market: "KR", locale: "ko", product: "spot", campaign: "kr_krw_funding_ko" },
  },
  {
    id: "turkey-spk-register-tr",
    type: "regional_research",
    locale: "tr",
    campaign: "tr_spk_register_tr",
    path: "/tr/markets/turkiye",
    venues: ["paribu", "hyperliquid", "uniswap"],
    title: "Türkiye: platform karşılaştırmadan önce SPK listesini ve hesap kapsamını ayırın",
    summary: "Türkiye araştırması için NexuAlpha öncelikli taslak: SPK listesi, tasfiye durumu, kimlik doğrulama, TRY yolu ve global DEX araştırması aynı şey değildir.",
    sourceNotes: [
      "SPK listesi ve tasfiye listesi güncel bağlam sağlar; her ürün, hesap veya işlem için uygunluk sonucu değildir.",
      "Paribu gibi yerel platform rehberleri ile Hyperliquid/Uniswap araştırması farklı hesap ve saklama modellerine aittir.",
      "Telegram metni önce NexuAlpha sayfasına döner; ham kayıt linki, davet kodu veya özel komisyon bilgisi içermez.",
    ],
    useCases: [
      "Türkiye'deki kullanıcı bir platform adını görüp resmî statü ve hesap koşulunu ayırmak istediğinde.",
      "TRY fonlama ile global DEX/Perp DEX araştırmasını tek mesajda ama doğru sınırlarla anlatmak gerektiğinde.",
    ],
    discussionPrompt: "Soru: Türkiye'de platform seçmeden önce önce neyi kontrol ediyorsunuz: SPK listesi, kimlik, TRY yatırma, ürün kapsamı, ücret veya resmî alan adı?",
    botCta: "NexuAlpha Bot'ta Türkiye araştırma yolunu aç",
    deepLinkAction: { action: "partner_desk", market: "TR", locale: "tr", product: "spot", campaign: "tr_spk_register_tr" },
  },
  {
    id: "turkey-try-funding-tr",
    type: "regional_decision",
    locale: "tr",
    campaign: "tr_try_funding_tr",
    path: "/tr/markets/turkiye",
    venues: ["paribu", "uniswap"],
    title: "TRY yatırmadan önce: banka hesabı, transfer yolu, limit ve ücretleri doğrulayın",
    summary: "TRY yatırma niyeti olan kullanıcıyı NexuAlpha Türkiye araştırmasına geri taşıyan taslak. Yerel banka koşulları ile cüzdan tabanlı DEX yollarını karıştırmaz.",
    sourceNotes: [
      "TRY yatırma koşulları resmî destek sayfası ve kullanıcının kendi hesap ekranında tekrar kontrol edilmelidir.",
      "Bir transfer rehberi, hesap onayı, bonus, ücret indirimi veya işlem sonucunu garanti etmez.",
      "Uniswap/Hyperliquid bağlantıları karşılaştırma ve güvenlik araştırması içindir; TRY banka transferi olarak sunulmaz.",
    ],
    useCases: [
      "Kullanıcı TRY yatırma yolunu soruyor ama kimlik veya banka hesabı koşulunu netleştirmemişse.",
      "Yerel fonlama sorusu ile global DEX yolunu aynı CTA içinde ama yanlış vaat olmadan taşımak istediğinizde.",
    ],
    discussionPrompt: "Soru: TRY yatırmadan önce en çok hangi noktada takılıyorsunuz: banka hesabı sahibi, kimlik, limit, ücret, süre, uygulama adımı veya ürün erişimi?",
    botCta: "NexuAlpha Bot'ta TRY fonlama kontrol yolunu aç",
    deepLinkAction: { action: "partner_desk", market: "TR", locale: "tr", product: "spot", campaign: "tr_try_funding_tr" },
  },
  {
    id: "hyperliquid-funding-decision-en",
    type: "search_demand_brief",
    locale: "en",
    campaign: "hyperliquid_funding_decision_en",
    path: "/exchanges/hyperliquid",
    venues: ["hyperliquid"],
    title: "Hyperliquid funding: review holding cost before opening a perp position",
    summary: "A Wave11 draft for users checking Hyperliquid funding mechanics before they connect a wallet or keep a perpetual position open.",
    sourceNotes: [
      "Funding is a position-holding cost and should not be merged with maker/taker fees, bridge fees, collateral requirements or liquidation rules.",
      "NexuAlpha does not publish real-time funding rates or treat a funding estimate as a trading signal.",
      "Users should check the current official docs and product interface before opening or holding a position.",
    ],
    useCases: [
      "You need a source-first answer for a user asking whether Hyperliquid is cheap to hold overnight.",
      "You want to route funding questions back to NexuAlpha before any wallet or perp action.",
    ],
    discussionPrompt: "Poll idea: Before holding a perp, what do you check first: funding, fees, collateral, liquidation, bridge cost or slippage?",
    botCta: "Open the Hyperliquid funding decision path in the NexuAlpha Bot",
    deepLinkAction: { action: "fee_calc", venue: "hyperliquid", locale: "en", product: "perpetuals", campaign: "hyperliquid_funding_decision_en" },
  },
  {
    id: "hyperliquid-dydx-risk-en",
    type: "search_demand_brief",
    locale: "en",
    campaign: "hyperliquid_dydx_risk_en",
    path: "/compare/hyperliquid-vs-dydx",
    venues: ["hyperliquid", "dydx"],
    title: "Hyperliquid vs dYdX: compare custody, collateral and liquidation risk first",
    summary: "A comparison draft for users choosing between two Perp DEX routes without reducing the decision to a single fee label.",
    sourceNotes: [
      "Custody model, margin collateral, funding mechanics, liquidation rules, app domain and regional access are separate checks.",
      "NexuAlpha does not declare a universal safest or cheapest route; current conditions must be reviewed at official sources.",
      "The draft keeps readers on NexuAlpha before any external account or wallet path.",
    ],
    useCases: [
      "You need a plain-language risk frame for Hyperliquid vs dYdX.",
      "You want a Telegram post that turns broad perp interest into an onsite comparison visit.",
    ],
    discussionPrompt: "Poll idea: In a Perp DEX comparison, which risk should be separated first: custody, funding, collateral, liquidation, domain or region?",
    botCta: "Open the Hyperliquid vs dYdX risk path in the NexuAlpha Bot",
    deepLinkAction: { action: "compare", pair: "hyperliquid-vs-dydx", locale: "en", product: "perpetuals", campaign: "hyperliquid_dydx_risk_en" },
  },
  {
    id: "uniswap-v4-deployment-check-en",
    type: "dex_route_check",
    locale: "en",
    campaign: "uniswap_v4_deployment_check_en",
    path: "/exchanges/uniswap",
    venues: ["uniswap"],
    title: "Uniswap v4 or deployment checks: verify the app, chain and contract before signing",
    summary: "A wallet-safety draft for readers who see Uniswap v4, pools or deployment language and need an official-source path.",
    sourceNotes: [
      "Network, app domain, pool or hook address, wallet approval, gas and final transaction details must be checked before signing.",
      "NexuAlpha does not certify token contracts, request seed phrases or present a wallet action as risk-free.",
      "Deployment language changes quickly, so the draft requires manual source review before reuse.",
    ],
    useCases: [
      "You want to explain why a DEX contract address needs verification before approval.",
      "You need a reusable Telegram draft for Uniswap v4 or deployment-related search demand.",
    ],
    discussionPrompt: "Poll idea: Before a Uniswap action, what do you verify first: app domain, chain, pool address, token contract, approval or gas?",
    botCta: "Open the Uniswap deployment-check path in the NexuAlpha Bot",
    deepLinkAction: { action: "verify_domain", venue: "uniswap", locale: "en", product: "spot", campaign: "uniswap_v4_deployment_check_en" },
  },
  {
    id: "jupiter-ultra-token-mint-en",
    type: "dex_route_check",
    locale: "en",
    campaign: "jupiter_ultra_token_mint_en",
    path: "/exchanges/jupiter",
    venues: ["jupiter"],
    title: "Jupiter Ultra and token mint checks: do not sign before route details are clear",
    summary: "A Solana DEX draft for users checking Jupiter Ultra, route legs and token mint details before approving a wallet transaction.",
    sourceNotes: [
      "The official app, token mint, route legs, slippage, platform fee, Solana network fee and wallet transaction are separate evidence fields.",
      "A quoted route does not prove token safety, final execution or zero-cost settlement.",
      "NexuAlpha routes readers to the onsite source-check first and then to the Bot for follow-up.",
    ],
    useCases: [
      "A user asks why the same token can have confusing Solana mint or route details.",
      "You want a CTA that reduces wallet-signing risk before any transaction.",
    ],
    discussionPrompt: "Poll idea: On Jupiter, what do you check first: token mint, route legs, slippage, fees, transaction simulation or app domain?",
    botCta: "Open the Jupiter Ultra token-check path in the NexuAlpha Bot",
    deepLinkAction: { action: "verify_domain", venue: "jupiter", locale: "en", product: "spot", campaign: "jupiter_ultra_token_mint_en" },
  },
  {
    id: "aerodrome-slipstream-incentives-en",
    type: "dex_route_check",
    locale: "en",
    campaign: "aerodrome_slipstream_incentives_en",
    path: "/exchanges/aerodrome",
    venues: ["aerodrome"],
    title: "Aerodrome Slipstream: separate pool execution, incentives and voting rewards",
    summary: "A Base DEX draft for readers checking Aerodrome Slipstream pools without turning incentives into a guaranteed reward claim.",
    sourceNotes: [
      "Base network readiness, bridge route, pool address, fee type, incentive schedule and veAERO voting mechanics must be checked separately.",
      "NexuAlpha does not promise reward eligibility, yield, liquidity or trading outcome.",
      "The draft sends readers to an onsite source-check before any wallet action.",
    ],
    useCases: [
      "You need to explain the boundary between swap execution and liquidity incentives.",
      "You want a search-aligned Telegram post for Aerodrome Slipstream queries.",
    ],
    discussionPrompt: "Poll idea: On Aerodrome, what is easiest to confuse: pool fee, incentive, vote, bridge path, token address or network cost?",
    botCta: "Open the Aerodrome Slipstream checklist in the NexuAlpha Bot",
    deepLinkAction: { action: "verify_domain", venue: "aerodrome", locale: "en", product: "spot", campaign: "aerodrome_slipstream_incentives_en" },
  },
  {
    id: "tokenized-treasury-buidl-benji-en",
    type: "research_digest",
    locale: "en",
    campaign: "tokenized_treasury_buidl_benji_en",
    path: priorityCanonicalOwnerPath("tokenized treasury"),
    venues: [],
    title: "BUIDL and BENJI research: separate token access from the underlying Treasury claim",
    summary: "A tokenized-treasury draft for users comparing product names, issuers and redemption language before treating a token as direct Treasury exposure.",
    sourceNotes: [
      "Fund structure, issuer, custodian, reserve asset, transfer rule and redemption claim are different facts.",
      "NexuAlpha does not promise yield, redemption, liquidity, regulatory eligibility or investment suitability.",
      "Readers should use the article as a source-bound research path before comparing any product.",
    ],
    useCases: [
      "A user asks whether tokenized Treasuries are the same as owning U.S. Treasury bills.",
      "You need a Telegram draft that can link RWA curiosity to a careful onsite explanation.",
    ],
    discussionPrompt: "Poll idea: In tokenized treasuries, what is least clear: issuer, custody, legal claim, transfer rule, yield source or redemption?",
    botCta: "Open the tokenized-treasury research path in the NexuAlpha Bot",
    deepLinkAction: { action: "rates", venue: "all", locale: "en", product: "research", campaign: "tokenized_treasury_buidl_benji_en" },
  },
  {
    id: "okx-usdc-api-check-en",
    type: "operational_guide",
    locale: "en",
    campaign: "okx_usdc_api_check_en",
    path: "/news/okx-usd-to-usdc-spot-pair-migration",
    venues: ["okx"],
    title: "OKX USDC migration: check API instruments, orders and bots before changing anything",
    summary: "A Wave11 operations draft for users who may have open orders, trading bots or API integrations affected by a migration notice.",
    sourceNotes: [
      "API identifiers, open orders, bots, balances, margin use and official deadlines should be checked against official OKX notices and the user's account.",
      "The draft is not a live account instruction and does not promise balance conversion or execution quality.",
      "Readers should review the NexuAlpha article before touching live account settings.",
    ],
    useCases: [
      "You need to route an OKX migration question to a dated checklist.",
      "You want users with API or bots to slow down before editing live trading settings.",
    ],
    discussionPrompt: "Poll idea: During a migration, what do you check first: API symbol, open order, bot, balance, margin, deadline or fees?",
    botCta: "Open the OKX API migration checklist in the NexuAlpha Bot",
    deepLinkAction: { action: "verify_domain", venue: "okx", locale: "en", product: "spot", campaign: "okx_usdc_api_check_en" },
  },
  {
    id: "brazil-pix-withdrawal-ptbr",
    type: "regional_decision",
    locale: "pt-BR",
    campaign: "br_pix_withdrawal_ptbr",
    path: "/br/saque-pix",
    venues: ["binance", "okx", "bitget"],
    title: "Brasil: saque Pix exige titularidade, CPF, limite e status confirmados",
    summary: "Um rascunho Wave11 para transformar pergunta de saque Pix em checklist de conta antes de qualquer rota externa.",
    sourceNotes: [
      "Titularidade, CPF, banco, limite, taxa, prazo e status da plataforma precisam aparecer ou ser confirmados na conta oficial.",
      "O texto nao promete aprovacao, bonus, desconto, retirada bem-sucedida ou resultado financeiro.",
      "NexuAlpha organiza a verificacao e envia primeiro para a pagina regional.",
    ],
    useCases: [
      "O usuario ja entende deposito Pix, mas ainda nao conferiu a saida em BRL.",
      "Voce quer reduzir erro de titularidade ou limite antes de uma CTA de conta.",
    ],
    discussionPrompt: "Enquete: antes de sacar por Pix, qual ponto mais trava: nome, CPF, banco, limite, taxa, prazo ou status da conta?",
    botCta: "Abrir o checklist de saque Pix no Bot da NexuAlpha",
    deepLinkAction: { action: "partner_desk", market: "BR", locale: "pt-BR", product: "spot", campaign: "br_pix_withdrawal_ptbr" },
  },
  {
    id: "brazil-kyc-cpf-check-ptbr",
    type: "account_readiness",
    locale: "pt-BR",
    campaign: "br_kyc_cpf_check_ptbr",
    path: "/br/kyc-cpf",
    venues: ["binance", "okx", "bitget"],
    title: "Brasil: CPF e KYC devem bater antes de tratar a conta como pronta",
    summary: "Um rascunho Wave11 para separar CPF, nome, residencia, banco proprio e produto liberado antes do cadastro ou deposito.",
    sourceNotes: [
      "CPF, nome, residencia, banco, limites e produto spot ou derivativos sao verificacoes diferentes.",
      "Link parceiro e codigo de convite nao provam KYC aprovado, beneficio aplicado ou saque liberado.",
      "A confirmacao final precisa ocorrer no fluxo oficial da plataforma.",
    ],
    useCases: [
      "O usuario brasileiro pergunta por erro de CPF, nome ou banco durante abertura de conta.",
      "Voce precisa levar a pessoa para a pagina de preparo de conta antes de sair do site.",
    ],
    discussionPrompt: "Enquete: no KYC Brasil, o que voce confere primeiro: CPF, nome, documento, residencia, banco proprio, limite ou produto?",
    botCta: "Abrir o checklist CPF/KYC no Bot da NexuAlpha",
    deepLinkAction: { action: "partner_desk", market: "BR", locale: "pt-BR", product: "spot", campaign: "br_kyc_cpf_check_ptbr" },
  },
  {
    id: "korea-official-account-check-ko",
    type: "regional_decision",
    locale: "ko",
    campaign: "kr_official_account_check_ko",
    path: "/kr",
    venues: ["upbit", "hyperliquid", "uniswap"],
    title: "한국: 계정 경로 전에 공식 맥락, 원화 입출금과 상품 범위를 분리하세요",
    summary: "한국 이용자를 위한 Wave11 초안입니다. 규제 맥락, 본인확인, KRW 경로, 수수료와 공식 도메인을 한 번에 분리합니다.",
    sourceNotes: [
      "공식 자료와 플랫폼 안내는 계정 승인, 혜택, 원화 입금 가능성 또는 상품 접근을 보장하지 않습니다.",
      "글로벌 DEX/Perp DEX 리서치와 현지 원화 계정 경로는 같은 CTA로 섞지 않습니다.",
      "Telegram 초안은 NexuAlpha 한국 페이지로 먼저 보냅니다.",
    ],
    useCases: [
      "한국 이용자가 플랫폼을 고르기 전에 공식 출처와 계정 조건을 확인해야 할 때.",
      "원화 입출금 질문을 글로벌 플랫폼 비교와 안전하게 분리하고 싶을 때.",
    ],
    discussionPrompt: "질문: 계정 만들기 전에 무엇을 먼저 확인하시나요? 공식 자료, 본인확인, 원화 입금, 상품 범위, 수수료, 도메인 중 하나를 골라주세요.",
    botCta: "NexuAlpha Bot에서 한국 계정 체크 경로 열기",
    deepLinkAction: { action: "partner_desk", market: "KR", locale: "ko", product: "spot", campaign: "kr_official_account_check_ko" },
  },
  {
    id: "turkey-market-account-check-tr",
    type: "regional_decision",
    locale: "tr",
    campaign: "tr_market_account_check_tr",
    path: "/tr/markets/turkiye",
    venues: ["paribu", "hyperliquid", "uniswap"],
    title: "Türkiye: hesap açmadan önce SPK bağlamı, TRY yolu ve ürün kapsamını ayırın",
    summary: "Türkiye pazarı için Wave11 taslağı. Planlanan ülke sayfasına döner ve kullanıcıyı ham kayıt linkine göndermeden karar kontrolü yaptırır.",
    sourceNotes: [
      "SPK bağlamı, kimlik doğrulama, TRY yatırma, banka hesabı sahipliği, ürün kapsamı ve ücretler ayrı ayrı kontrol edilmelidir.",
      "Bu taslak kayıt, bonus, ücret indirimi, hesap onayı veya işlem sonucu vaat etmez.",
      "Planlanan Türkiye sayfası yayına alınana kadar manuel inceleme gereklidir.",
    ],
    useCases: [
      "Türkiye kullanıcısı hesap açmadan önce yerel fonlama ve resmi kaynak kontrolü istiyor.",
      "TRY fonlama sorusunu global DEX araştırmasıyla karıştırmadan NexuAlpha içinde tutmak istiyorsunuz.",
    ],
    discussionPrompt: "Soru: Türkiye'de kayıt öncesi önce neyi kontrol ediyorsunuz: SPK bağlamı, kimlik, TRY yatırma, banka sahibi, ürün kapsamı veya ücret?",
    botCta: "NexuAlpha Bot'ta Türkiye hesap kontrol yolunu aç",
    deepLinkAction: { action: "partner_desk", market: "TR", locale: "tr", product: "spot", campaign: "tr_market_account_check_tr" },
  },
  {
    id: "fee-disclosure-audit-zh",
    type: "research_digest",
    locale: "zh-Hans",
    campaign: "fee_disclosure_audit_zh",
    path: "/news/crypto-exchange-fee-disclosure-audit",
    venues: ["binance", "okx", "bybit", "bitget"],
    title: "费率披露审计：不要只看广告里的最低费率",
    summary: "这条适合发给正在选平台的人：先把公开费率、账户等级、地区条件和抵扣规则拆开看。",
    sourceNotes: [
      "文章是公开披露方法论，不代表任何交易所当前账户给到用户的最终权益。",
      "NexuAlpha 不公开合作方佣金比例，也不把未核验优惠写成用户承诺。",
      "更新状态、来源与限制应以文章页面和官方账户流程为准。",
    ],
    useCases: [
      "用户问为什么相同交易量在不同平台成本不同。",
      "社群需要一篇解释 Maker/Taker、VIP、抵扣和实际成本差异的入口文。",
    ],
    discussionPrompt: "投票问题：你看费率时最容易漏掉哪一项：VIP 等级、抵扣规则、地区限制、充值提现成本，还是最终账户页面？",
    botCta: "在 Bot 里打开费率来源研究入口",
    deepLinkAction: { action: "rates", venue: "all", locale: "zh-Hans", campaign: "fee_disclosure_audit_zh" },
  },
  {
    id: "withdrawal-network-guide-zh",
    type: "operational_guide",
    locale: "zh-Hans",
    campaign: "withdrawal_network_guide_zh",
    path: "/news/how-to-choose-crypto-withdrawal-network",
    venues: ["binance", "okx", "bybit", "bitget"],
    title: "提现网络怎么选：先确认链、地址、Memo 和手续费",
    summary: "给新用户的低风险操作提醒：提现前先做网络与地址核对，避免把平台选择问题变成资产损失问题。",
    sourceNotes: [
      "提现网络、手续费、到账时间和 Memo/Tag 要求会按平台与资产变化。",
      "本文是操作教育内容，不构成投资、法务或交易建议。",
      "任何外部链接和官方入口都需要用户在当前页面二次核验。",
    ],
    useCases: [
      "用户准备从交易所提币，但不确定 ERC20、TRC20、BEP20 或 Memo 的差异。",
      "社群需要把开户转化后的第一笔操作风险降下来。",
    ],
    discussionPrompt: "投票问题：提现前你最担心哪一步：网络、地址、Memo/Tag、手续费、到账时间，还是平台状态？",
    botCta: "在 Bot 里打开提现网络核对路径",
    deepLinkAction: { action: "verify_domain", venue: "binance" },
  },
];

function activeBroadcastTemplates() {
  const existingIds = new Set(broadcastTemplates.map((template) => template.id));
  const autoTemplates = TELEGRAM_SEARCH_TOPIC_QUEUE
    .filter((topic) => !existingIds.has(topic.id))
    .map(autoTemplateFromSearchTopic);
  return [...broadcastTemplates, ...autoTemplates];
}

export function generateTelegramBroadcasts(options = {}) {
  const baseUrl = options.baseUrl || DEFAULT_BASE_URL;
  const nowIso = options.nowIso || new Date().toISOString();
  return activeBroadcastTemplates().map((template) => buildBroadcast(template, baseUrl, nowIso));
}

const publishQueuePlan = [
  ["brazil-hub-ptbr", "hyperliquid-fees-en", "fee-disclosure-audit-zh", "crypto-perpetual-platform-en", "korea-regulatory-context-ko", "hyperliquid-funding-decision-en", "tokenized-treasury-redemption-risk-en", "korea-tokenized-asset-boundary-ko", "wave58-hyperliquid-fees-funded-boundary-en"],
  ["brazil-pix-ptbr", "uniswap-testnet-en", "compare-binance-vs-okx-en", "bybit-bitget-stock-exposure-en", "turkey-spk-register-tr", "uniswap-v4-deployment-check-en", "tokenized-stock-vs-stock-perp-en", "turkey-tokenized-asset-boundary-tr", "wave58-uniswap-testnet-mainnet-safety-en"],
  ["brazil-saque-pix-ptbr", "jupiter-swap-route-en", "tokenized-treasuries-en", "hyperliquid-funding-hourly-en", "hyperliquid-dydx-risk-en", "jupiter-ultra-token-mint-en", "tokenized-assets-custody-proof-en", "korea-perp-dex-funding-check-ko", "wave58-bybit-bitget-stock-meaning-en"],
  ["brazil-kyc-cpf-ptbr", "aerodrome-base-pool-en", "withdrawal-network-guide-zh", "tokenized-stock-margin-zh", "korea-krw-funding-ko", "aerodrome-slipstream-incentives-en", "rwa-treasury-transfer-restrictions-en", "turkey-perp-dex-funding-check-tr", "wave58-derivatives-risk-stack-en"],
  ["brazil-cost-ptbr", "hyperliquid-funded-account-en", "compare-bybit-vs-bitget-en", "hyperliquid-latest-news-en", "tokenized-treasury-buidl-benji-en", "okx-usdc-api-check-en", "korea-uniswap-wallet-route-ko", "turkey-uniswap-wallet-route-tr"],
  ["brazil-account-ptbr", "mexico-spei-es", "hong-kong-account-en", "okx-usd-usdc-migration-en", "turkey-try-funding-tr", "brazil-pix-withdrawal-ptbr", "korea-bybit-bitget-stock-boundary-ko", "turkey-bybit-bitget-stock-boundary-tr"],
  ["brazil-compare-ptbr", "no-kyc-dex-check-en", "brazil-kyc-cpf-check-ptbr", "korea-official-account-check-ko", "turkey-market-account-check-tr", "perp-dex-cost-field-dictionary-en", "regional-funding-verification-matrix-en", "regional-funding-matrix-rollout-en", "aerodrome-jupiter-route-cost-check-en", "japan-mexico-funding-matrix-ja", "korea-onchain-route-localization-ko", "turkey-onchain-route-localization-tr", "hyperliquid-funding-fee-fr", "uniswap-wallet-route-fee-de", "hyperliquid-source-boundary-fr", "uniswap-approval-slippage-de", "binance-okx-fee-kyc-boundary-es", "binance-fee-kyc-source-ptbr", "okx-usd-usdc-migration-date-boundary-en", "hyperliquid-dydx-funding-fee-boundary-zh", "hyperliquid-fees-funded-boundary-en", "uniswap-testnet-mainnet-boundary-en", "tokenized-treasury-issuer-custody-redemption-en", "bitget-bybit-stocks-product-boundary-en", "crypto-perpetual-platform-risk-stack-en", "hyperliquid-latest-news-date-source-en", "ai-citation-source-methodology-en", "ai-citation-fee-evidence-boundary-en", "ai-citation-regional-funding-check-en", "ai-citation-tokenized-asset-ownership-redemption-en", "ai-citation-perp-risk-fields-en", "hk-vasp-account-check-en", "eu-mica-platform-access-en", "uk-fca-crypto-risk-access-en", "jp-fsa-jpy-funding-check-ja", "kr-krw-account-funding-check-ko", "tr-try-spk-funding-check-tr", "regional-funding-matrix-data-asset-en", "hk-kr-tr-official-verification-boundary-en", "hong-kong-funding-matrix-check-en", "korea-krw-funding-matrix-ko", "singapore-sgd-funding-matrix-en", "turkey-try-funding-matrix-tr", "priority-canonical-five-review-bundle-en", "cftc-self-custodial-wallet-boundary-en", "spot-listing-timeline-disclosure-en", "leveraged-etf-x-perp-risk-en", "okx-vvv-listing-preopen-en", "payment-stablecoin-margin-collateral-en"],
];

function dayLabel(startDate, dayIndex) {
  if (!startDate) return `Day ${dayIndex + 1}`;
  const date = new Date(`${startDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + dayIndex);
  return date.toISOString().slice(0, 10);
}

export function buildTelegramPublishQueue(broadcasts = generateTelegramBroadcasts(), options = {}) {
  const byId = new Map(broadcasts.map((item) => [item.id, item]));
  return publishQueuePlan.map((dayIds, dayIndex) => ({
    day: dayIndex + 1,
    label: dayLabel(options.startDate, dayIndex),
    status: "draft_only",
    posting: "manual_review_required",
    slots: dayIds.map((id, slotIndex) => {
      const item = byId.get(id);
      if (!item) throw new Error(`Missing Telegram draft for queue id: ${id}`);
      return {
        slot: slotIndex + 1,
        itemId: item.id,
        locale: item.locale,
        region: regionByLocaleOrId(item),
        theme: themeByType(item.type),
        funnelStage: item.funnelStage,
        searchIntent: item.searchIntent,
        gscOpportunity: item.gscOpportunity,
        regionSegment: item.regionSegment,
        reviewBy: item.reviewBy,
        campaign: item.campaign,
        trackingContext: item.trackingContext,
        trackingRequiredParams: item.trackingRequiredParams,
        wave: item.wave || null,
        searchTopic: item.searchTopic,
        manualReviewSummary: item.manualReviewSummary,
        updateCadence: item.updateCadence,
        answerFirst: item.answerFirst,
        onsiteEntries: item.onsiteEntries,
        canonicalLandingUrl: item.canonicalLandingUrl,
        utmReview: item.utmReview,
        landingPageReview: item.landingPageReview,
        title: item.title,
        onsiteUrl: item.canonicalBacklink,
        botDeepLink: item.deepLink,
        state: "draft_only",
        review: "manual_review_required",
        publishOrder: "onsite_link_before_bot_deep_link",
        postRecordId: `${dayLabel(options.startDate, dayIndex)}-slot-${slotIndex + 1}-${item.campaign}`,
        humanAuthorizationRequired: true,
        authorizationRecord: {
          status: "not_authorized",
          requiredBeforePost: true,
          approvedBy: null,
          approvedAt: null,
        },
      };
    }),
  }));
}

export function renderTelegramManualCopyPack(broadcasts, queue) {
  const byId = new Map(broadcasts.map((item) => [item.id, item]));
  const lines = [
    "# NexuAlpha Telegram 7-day manual publish pack",
    "",
    "Status: draft_only / manual_review_required",
    "Boundary: copy only after human review; do not call Telegram API from this repository; do not paste raw exchange registration links.",
    "Link order: every post sends readers to NexuAlpha first, then to the NexuAlpha Bot deep link.",
    "",
    "## 7-day queue",
    "",
    "| Day | Slot | Region | Locale | Funnel | Intent | Theme | GSC query | Draft | UTM campaign | Landing URL | Review by |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];

  for (const day of queue) {
    for (const slot of day.slots) {
      lines.push(`| ${day.label} | ${slot.slot} | ${slot.region} | ${slot.locale} | ${slot.funnelStage} | ${slot.searchIntent} | ${slot.theme} | ${slot.gscOpportunity?.query || "none"} | ${slot.itemId} | ${slot.campaign} | ${slot.canonicalLandingUrl} | ${slot.reviewBy.slice(0, 10)} |`);
    }
  }

  lines.push("", "## Copy blocks", "");

  for (const day of queue) {
    lines.push(`### ${day.label}`, "");
    for (const slot of day.slots) {
      const item = byId.get(slot.itemId);
      lines.push(`#### ${slot.slot}. ${item.id}`, "");
      lines.push(`Region: ${slot.region}  `);
      lines.push(`Locale: ${item.locale}  `);
      lines.push(`Theme: ${slot.theme}  `);
      lines.push(`Funnel: ${slot.funnelStage}  `);
      lines.push(`Intent: ${slot.searchIntent}  `);
      if (slot.gscOpportunity) {
        lines.push(`GSC query: ${slot.gscOpportunity.query} (${slot.gscOpportunity.visibleImpressions} visible impressions, ${slot.gscOpportunity.clicks} clicks)  `);
      }
      if (isSearchTopicWave(slot.wave)) {
        lines.push(`Wave: ${slot.wave}  `);
        lines.push(`Search topic: ${slot.searchTopic.query}  `);
        lines.push(`Update cadence: ${slot.updateCadence.label}  `);
        lines.push(`Manual review summary: ${slot.manualReviewSummary}  `);
      }
      lines.push(`Review by: ${slot.reviewBy.slice(0, 10)}  `);
      lines.push(`Canonical landing URL: ${slot.canonicalLandingUrl}  `);
      lines.push(`UTM review: ${slot.utmReview.publicParams.utm_source} / ${slot.utmReview.publicParams.utm_medium} / ${slot.utmReview.publicParams.utm_campaign}  `);
      lines.push(`Landing first-screen check: ${slot.landingPageReview.expectedFirstScreen.join("; ")}  `);
      lines.push(`Status: ${slot.state} / ${slot.review}`, "");
      lines.push("Plain text:", "");
      lines.push("```text");
      lines.push(item.plainText);
      lines.push("```", "");
      lines.push("MarkdownV2:", "");
      lines.push("```text");
      lines.push(item.markdownV2);
      lines.push("```", "");
    }
  }

  return `${lines.join("\n")}\n`;
}

export function renderTelegramPreflightChecklist(broadcasts, queue) {
  const campaigns = broadcasts.map((item) => item.campaign);
  return [
    "# Telegram publish preflight",
    "",
    "Run before any manual channel post. This is an operator checklist, not an API sender.",
    "",
    "## Automated invariants covered by tests",
    "",
    "- `distributionPolicy.status` stays `draft_only`.",
    "- `distributionPolicy.posting` stays `manual_review_required`.",
    "- Every post has `utm_source=tg_channel`, `utm_medium=broadcast`, one unique `utm_campaign` and the required Telegram context parameters.",
    "- Every post exposes `canonicalLandingUrl`, `utmReview` and `landingPageReview` so the operator can review the exact landing page before copying.",
    "- Every post has a region, funnel stage, search intent, theme and review-by date.",
    "- Every post includes an answer-first summary and at least two NexuAlpha onsite next-step entries before the Bot handoff.",
    "- GSC-priority posts carry a visible Search Console query, impression count and onsite landing page.",
    "- Wave7, Wave8, Wave9, Wave10, Wave11, Wave13, Wave25, Wave26, Wave27, Wave28, Wave29, Wave30, Wave31, Wave32, Wave33, Wave34, Wave35, Wave36, Wave37, Wave38, Wave39 and Wave57 search-topic posts carry their wave label, `searchTopic`, `manualReviewSummary`, weekly review cadence and a NexuAlpha landing page.",
    "- Every copy block contains the NexuAlpha onsite URL before the Bot deep link.",
    "- No draft contains raw exchange registration URLs or invitation-link alternates.",
    "- Bot links use `https://t.me/NexuAlphaAssistantBot?start=...` only.",
    "",
    "## Manual checks before posting",
    "",
    "- Open the onsite URL and confirm the target page loads in the intended locale.",
    "- Confirm the `canonicalLandingUrl` in the queue is the exact URL copied into the post.",
    "- Confirm the landing page first viewport points users to the answer/onsite next step before a Bot or external handoff.",
    "- Confirm the answer-first summary answers the Telegram user's question before asking them to click a Bot or channel link.",
    "- Confirm the onsite next-step links point only to NexuAlpha comparison, detail, regional, news or tool pages.",
    "- Confirm the post does not promise approval, bonus, fee discount, indexing, ranking, signup, retention, trading outcome or private commission economics.",
    "- Confirm no private partner economics, settlement terms or commercial rate appears in the post.",
    "- Confirm the Telegram post body keeps the NexuAlpha page above the Bot deep link.",
    "- Confirm the onsite URL keeps `tg_market`, `tg_locale`, `tg_product`, `tg_funnel`, `tg_intent`, `tg_theme` and `tg_draft` intact.",
    "- Confirm `reviewBy` has not passed; if it has passed, refresh source notes and onsite page before reuse.",
    "- Confirm the selected day/slot still matches the intended market conversation.",
    "- Complete the 24h review fields and 7d review fields after any authorized manual post.",
    "- For GSC-priority drafts, confirm the query still appears in the current Search Console or next weekly baseline before refreshing the post.",
    "- For search-topic drafts, confirm each topic still routes to its stated NexuAlpha landing page before reuse.",
    "",
    "## Queue coverage",
    "",
    `- Days: ${queue.length}`,
    `- Drafts: ${broadcasts.length}`,
    `- Campaigns: ${campaigns.join(", ")}`,
    `- Required URL params: ${TELEGRAM_TRACKING_REQUIRED_PARAMS.join(", ")}`,
    "",
  ].join("\n");
}

export function renderTelegramAttributionGuide(queue) {
  return [
    "# Telegram referral attribution guide",
    "",
    "Official exchange registration APIs are not available for this project, so Telegram attribution is measured inside NexuAlpha before the exchange handoff.",
    "",
    "## What can be measured",
    "",
    "- Sessions landing on NexuAlpha URLs with `utm_source=tg_channel` and `utm_medium=broadcast`.",
    "- Anonymous UTM sessions only; no user identifiers, Telegram user IDs or exchange account identifiers are collected by this pack.",
    "- Campaign-level traffic through `utm_campaign`, matched to the 7-day queue.",
    "- GSC-priority drafts can be reviewed by their attached query and landing page, while keeping search impressions separate from Telegram sessions.",
    "- Market, locale, product, funnel, intent, theme and draft-level traffic through `tg_market`, `tg_locale`, `tg_product`, `tg_funnel`, `tg_intent`, `tg_theme` and `tg_draft`.",
    "- Onsite engagement: target page view, scroll, comparison use, calculator use, registration-card view and qualified outbound CTA click.",
    "- Bot handoff intent through the Bot deep-link campaign payload.",
    "",
    "## What must remain unknown unless the owner supplies private aggregate data",
    "",
    "- Official exchange account creation.",
    "- KYC approval.",
    "- First deposit, first trade, rebate activation, retention and commission.",
    "",
    "## Naming rule",
    "",
    "- Keep `utm_source=tg_channel` and `utm_medium=broadcast` stable.",
    "- Keep each `utm_campaign` identical to the generated draft campaign.",
    "- Keep the `tg_*` parameters generated by the queue intact; they are for onsite Telegram segmentation only.",
    "- Do not add user PII, exchange account IDs, phone numbers, emails or private commission fields to URLs.",
    "",
    "## Queue map",
    "",
    "| Day | Draft | Campaign | Market | Locale | Product | Funnel | Intent | GSC query | Onsite URL |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...queue.flatMap((day) => day.slots.map((slot) => `| ${day.label} | ${slot.itemId} | ${slot.campaign} | ${slot.trackingContext.market} | ${slot.trackingContext.locale} | ${slot.trackingContext.product} | ${slot.funnelStage} | ${slot.searchIntent} | ${slot.gscOpportunity?.query || ""} | ${slot.onsiteUrl} |`)),
    "",
  ].join("\n");
}

export function renderTelegramPostLogTemplate(queue) {
  return [
    "# Telegram manual post log template",
    "",
    "Use this after a human posts a reviewed draft. Do not add Telegram user PII, exchange account IDs, emails, phone numbers, private commission terms or raw exchange registration links.",
    "",
    "| Field | Value |",
    "| --- | --- |",
    "| Post date/time UTC |  |",
    "| Operator |  |",
    "| Telegram surface | Channel / group / reply thread |",
    "| Draft id |  |",
    "| Campaign |  |",
    "| Market |  |",
    "| Locale |  |",
    "| Product |  |",
    "| Funnel / intent / theme |  |",
    "| GSC query monitored |  |",
    "| Onsite URL used |  |",
    "| Telegram message URL |  |",
    "| Manual checks completed | yes / no |",
    "| Edits made before posting |  |",
    "| 24h NexuAlpha sessions (`utm_campaign`) |  |",
    "| 24h landingVisits |  |",
    "| 24h onsiteNextStepClicks |  |",
    "| 24h comparisonOrToolClicks |  |",
    "| 24h protectedOutboundClicks |  |",
    "| 24h botStartsIfVisible |  |",
    "| 24h repliesOrDiscussionNotes |  |",
    "| 24h sourceLocaleOrCtaIssues |  |",
    "| 7d landingVisits |  |",
    "| 7d repeatVisits |  |",
    "| 7d onsiteNextStepClicks |  |",
    "| 7d comparisonOrToolClicks |  |",
    "| 7d protectedOutboundClicks |  |",
    "| 7d botStartsIfVisible |  |",
    "| 7d searchImpressionDeltaIfAvailable |  |",
    "| 7d decision | keep / refresh / pause / localize |",
    "| Notes for next post |  |",
    "",
    "## Queue lookup",
    "",
    "| Record id | Day | Draft | Campaign | Market | Locale | Product | Funnel | Intent | Review by |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...queue.flatMap((day) => day.slots.map((slot) => `| ${slot.postRecordId} | ${day.label} | ${slot.itemId} | ${slot.campaign} | ${slot.trackingContext.market} | ${slot.trackingContext.locale} | ${slot.trackingContext.product} | ${slot.funnelStage} | ${slot.searchIntent} | ${slot.reviewBy.slice(0, 10)} |`)),
    "",
  ].join("\n");
}

export function renderTelegramWeeklyReviewTemplate(queue) {
  const stages = [...new Set(queue.flatMap((day) => day.slots.map((slot) => slot.funnelStage)))].join(", ");
  const regions = [...new Set(queue.flatMap((day) => day.slots.map((slot) => slot.region)))].join(", ");
  return [
    "# Telegram weekly review template",
    "",
    "Goal: decide which Telegram topics deserve another post, a better onsite page, a different locale, or removal from the queue.",
    "",
    "## Coverage",
    "",
    `- Regions covered: ${regions}`,
    `- Funnel stages covered: ${stages}`,
    `- Drafts scheduled: ${queue.reduce((sum, day) => sum + day.slots.length, 0)}`,
    "",
    "## Metrics to fill manually",
    "",
    "- 24h evidence: landingVisits, onsiteNextStepClicks, comparisonOrToolClicks, protectedOutboundClicks, botStartsIfVisible, repliesOrDiscussionNotes, sourceLocaleOrCtaIssues.",
    "- 7d evidence: landingVisits, repeatVisits, onsiteNextStepClicks, comparisonOrToolClicks, protectedOutboundClicks, botStartsIfVisible, searchImpressionDeltaIfAvailable, decision.",
    "",
    "| Campaign | GSC query | Market | Locale | Product | Funnel | Intent | Sessions | Onsite CTA intent events | Qualified outbound CTA clicks | Bot starts | Replies/poll votes | Decision |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...queue.flatMap((day) => day.slots.map((slot) => `| ${slot.campaign} | ${slot.gscOpportunity?.query || ""} | ${slot.trackingContext.market} | ${slot.trackingContext.locale} | ${slot.trackingContext.product} | ${slot.funnelStage} | ${slot.searchIntent} |  |  |  |  |  | keep / refresh / pause / localize |`)),
    "",
    "## Decisions",
    "",
    "- Repeat only when onsite sessions or community replies show intent.",
    "- Refresh any draft past `reviewBy` before reposting.",
    "- Create a new onsite page only when a repeated question cannot be answered by the current landing page.",
    "- Keep exchange registration links inside NexuAlpha pages; Telegram copy remains onsite-first.",
    "",
  ].join("\n");
}

export async function writeTelegramManualPublishPack(outputDir = defaultPublishPackDir, options = {}) {
  const broadcasts = generateTelegramBroadcasts(options);
  const validation = validateTelegramBroadcastSystem(broadcasts);
  if (!validation.ok) {
    throw new Error(`Telegram broadcast validation failed:\n${validation.problems.join("\n")}`);
  }
  const queue = buildTelegramPublishQueue(broadcasts, options);
  const payload = {
    generator: "NexuAlpha Telegram Manual Publish Pack Builder",
    generatedAt: options.nowIso || new Date().toISOString(),
    distributionPolicy: {
      status: "draft_only",
      posting: "manual_review_required",
      sendMethod: "manual_copy_after_review_only",
      noTelegramApiCall: true,
      noRawExchangeRegistrationLinks: true,
      linkOrder: "nexualpha_onsite_url_before_bot_deep_link",
      operatingClassification: "region + funnelStage + searchIntent + theme + reviewBy",
      trackingRequiredParams: TELEGRAM_TRACKING_REQUIRED_PARAMS,
    },
    validation,
    queue,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "queue.json"), JSON.stringify(payload, null, 2), "utf8");
  fs.writeFileSync(path.join(outputDir, "copy-pack.md"), renderTelegramManualCopyPack(broadcasts, queue), "utf8");
  fs.writeFileSync(path.join(outputDir, "preflight-checklist.md"), renderTelegramPreflightChecklist(broadcasts, queue), "utf8");
  fs.writeFileSync(path.join(outputDir, "attribution-guide.md"), renderTelegramAttributionGuide(queue), "utf8");
  fs.writeFileSync(path.join(outputDir, "post-log-template.md"), renderTelegramPostLogTemplate(queue), "utf8");
  fs.writeFileSync(path.join(outputDir, "weekly-review-template.md"), renderTelegramWeeklyReviewTemplate(queue), "utf8");
  return { count: broadcasts.length, days: queue.length, outputDir };
}

export async function writeTelegramBroadcastFeed(outputPath = defaultJsonOutputPath, options = {}) {
  const broadcasts = generateTelegramBroadcasts(options);
  const validation = validateTelegramBroadcastSystem(broadcasts);
  if (!validation.ok) {
    throw new Error(`Telegram broadcast validation failed:\n${validation.problems.join("\n")}`);
  }
  const payload = {
    generator: "NexuAlpha Telegram Editorial Broadcast Feed Builder",
    channel: TELEGRAM_CONFIG.channelUsername,
    channelUrl: TELEGRAM_CONFIG.channelUrl,
    webPreviewUrl: TELEGRAM_CONFIG.webPreviewUrl,
    generatedAt: options.nowIso || new Date().toISOString(),
    totalBroadcasts: broadcasts.length,
    distributionPolicy: {
      status: "draft_only",
      posting: "manual_review_required",
      sourcePosture: "Telegram distribution can create referral traffic, but it is not presented as indexing or ranking proof.",
      tracking: "Each canonicalBacklink uses utm_source=tg_channel&utm_medium=broadcast and a unique utm_campaign.",
      operatingClassification: "Every item is classified by region, funnelStage, searchIntent and reviewBy for weekly operations.",
    },
    validation,
    targetPages: broadcasts.map((item) => ({
      id: item.id,
      locale: item.locale,
      path: item.path,
      region: item.region,
      funnelStage: item.funnelStage,
      searchIntent: item.searchIntent,
      theme: item.theme,
      gscOpportunity: item.gscOpportunity,
      reviewBy: item.reviewBy,
      campaign: item.campaign,
      canonicalBacklink: item.canonicalBacklink,
    })),
    broadcasts,
  };

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf8");
  return { count: broadcasts.length, outputPath };
}

export async function main() {
  const args = process.argv.slice(2);
  const isPreview = args.includes("--preview") || args.length === 0;

  process.stdout.write("====================================================================\n");
  process.stdout.write("NexuAlpha Telegram editorial broadcast feed builder\n");
  process.stdout.write("====================================================================\n");

  const broadcasts = generateTelegramBroadcasts();
  const { outputPath } = await writeTelegramBroadcastFeed();
  const publishPack = await writeTelegramManualPublishPack();

  process.stdout.write(`\nGenerated ${broadcasts.length} draft broadcasts.\n`);
  process.stdout.write(`Feed written to: ${path.relative(rootDir, outputPath)}\n\n`);
  process.stdout.write(`Manual publish pack written to: ${path.relative(rootDir, publishPack.outputDir)}\n\n`);

  if (isPreview) {
    process.stdout.write("--------------------------------------------------------------------\n");
    process.stdout.write("Draft preview. No Telegram API call was made.\n");
    process.stdout.write("--------------------------------------------------------------------\n\n");

    broadcasts.forEach((item, idx) => {
      process.stdout.write(`[${idx + 1}] ${item.id} (${item.locale}, ${item.type})\n`);
      process.stdout.write(`Bot deep link: ${item.deepLink}\n`);
      process.stdout.write(`Canonical backlink: ${item.canonicalBacklink}\n`);
      process.stdout.write("--- Plain text ---\n");
      process.stdout.write(`${item.plainText}\n\n`);
      process.stdout.write("--- MarkdownV2 ---\n");
      process.stdout.write(`${item.markdownV2}\n`);
      process.stdout.write("====================================================================\n\n");
    });

    process.stdout.write("Distribution note:\n");
    process.stdout.write(`Telegram channel posts may create useful referral traffic and shareable source trails via ${TELEGRAM_CONFIG.webPreviewUrl}.\n`);
    process.stdout.write("They are not treated as Google indexing, ranking, registration, or trading-outcome evidence.\n");
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}

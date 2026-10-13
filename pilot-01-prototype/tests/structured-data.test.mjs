import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { ACADEMY_EPISODES, ACADEMY_PATH, academyEpisodePath } from "../src/data/academy.js";
import { appDownloadPath } from "../src/data/app-download-path.js";
import { BINANCE_OCTOBER_PATH } from "../src/data/binance-october-path.js";
import { COINS_PATH, coinPath } from "../src/data/coins-routes.js";
import { CALENDAR_PATH } from "../src/data/intel-tools-routes.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { GLOSSARY_PATH, glossaryTermPath } from "../src/data/glossary-routes.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const distRoot = path.join(root, "dist");
const clientRoot = path.join(distRoot, "client");
const workerPath = path.join(distRoot, "server", "index.js");
const ssrPath = path.join(distRoot, "ssr", "entry-server.js");
const ORIGIN = "https://nexualpha.com";
const LOCALES = ["en", "zh-Hans", "zh-Hant"];
const PREFIX = { en: "", "zh-Hans": "/zh-hans", "zh-Hant": "/zh-hant" };
const BRAND_IMAGE = "/brand/nexualpha/nexualpha-round.svg";
const ORGANIZATION_ID = `${ORIGIN}/#organization`;
const WEBSITE_ID = `${ORIGIN}/#website`;
const NOW = Date.now();
const fixtureDate = (days = 0) => new Date(NOW + days * 86_400_000).toISOString();
const ACADEMY_LESSON_PATH = academyEpisodePath(ACADEMY_EPISODES.find((episode) => episode.ep === 4));
const NEWS_ARTICLE_PATH = "/news/hyperliquid-vs-dydx";

const activityUpdate = {
  id: "bybit:https://announcements.bybit.com/en-US/article/structured-data-audit/",
  venue: "bybit",
  category: "event",
  title: "Bybit Structured Data Campaign",
  url: "https://announcements.bybit.com/en-US/article/structured-data-audit/",
  publishedAt: fixtureDate(),
  startAt: fixtureDate(-1 / 24),
  endAt: fixtureDate(7),
};

const calendarFeed = {
  schema: "nexualpha.calendar.v1",
  generatedAt: fixtureDate(),
  status: "OK",
  sources: [{ name: "NexuAlpha audit fixture", url: `${ORIGIN}/calendar` }],
  events: [
    {
      id: "structured-data-audit-event",
      type: "macro",
      kind: "fomc",
      kind: "fomc",
      title: "Structured data audit event",
      start: fixtureDate(7),
      sourceName: "NexuAlpha audit fixture",
      sourceUrl: `${ORIGIN}/calendar`,
      pagePath: "/calendar",
    },
  ],
};

function updatePath(item) {
  const id = String(item?.id || item?.url || item?.officialSource?.url || "");
  let n = 2166136261;
  for (const c of id) {
    n ^= c.charCodeAt(0);
    n = Math.imul(n, 16777619);
  }
  const hash = (n >>> 0).toString(36);
  const slug = id.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 70) || "update";
  return `/activities/updates/${encodeURIComponent(item.venue)}/${slug}-${hash}`;
}


function assetType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
  if (file.endsWith(".xml")) return "application/xml; charset=utf-8";
  if (file.endsWith(".txt")) return "text/plain; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (file.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

async function readAsset(pathname) {
  const file = path.join(clientRoot, pathname.replace(/^\/+/, "") || "index.html");
  if (!file.startsWith(clientRoot) || !existsSync(file)) return null;
  return { body: await readFile(file), type: assetType(file) };
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}=["']([^"']*)["']`, "i"));
  return match ? decodeHtml(match[1]) : null;
}

function extractJsonLd(html) {
  const blocks = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (attr(match[0], "type") !== "application/ld+json") continue;
    const parsed = JSON.parse(match[2]);
    for (const block of Array.isArray(parsed) ? parsed : [parsed]) assert.equal(block["@context"], "https://schema.org", "JSON-LD uses the schema.org context");
    blocks.push(parsed);
  }
  assert.ok(blocks.length > 0, "page has at least one JSON-LD block");
  return blocks;
}

function flattenSchema(blocks) {
  return blocks.flatMap((block) => Array.isArray(block) ? block : block?.["@graph"] || [block]).filter(Boolean);
}

function schemaTypes(node) {
  return Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]].filter(Boolean);
}

function hasType(graph, type) {
  let found = false;
  visit(graph, (node) => { if (schemaTypes(node).includes(type)) found = true; });
  return found;
}

function firstType(graph, type) {
  return graph.find((node) => schemaTypes(node).includes(type));
}

function visit(value, visitor, pathName = "$") {
  visitor(value, pathName);
  if (Array.isArray(value)) value.forEach((item, index) => visit(item, visitor, `${pathName}[${index}]`));
  else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) visit(item, visitor, `${pathName}.${key}`);
}

function assertNoRatingsOrReviews(graph, label) {
  visit(graph, (value, pathName) => {
    if (!value || typeof value !== "object") return;
    const types = schemaTypes(value);
    assert.equal(types.includes("AggregateRating"), false, `${label}: ${pathName} must not emit AggregateRating`);
    assert.equal(types.includes("Review"), false, `${label}: ${pathName} must not emit Review`);
    assert.equal(Object.hasOwn(value, "aggregateRating"), false, `${label}: ${pathName} must not carry aggregateRating`);
    assert.equal(Object.hasOwn(value, "review"), false, `${label}: ${pathName} must not carry review`);
  });
}

function assertIsoDates(graph, label) {
  const dateKeys = new Set(["datePublished", "dateModified", "startDate", "endDate", "uploadDate", "dateCreated", "validFrom", "validThrough"]);
  visit(graph, (value, pathName) => {
    if (!pathName || !dateKeys.has(pathName.split(".").pop())) return;
    if (value === undefined || value === null) return;
    assert.equal(typeof value, "string", `${label}: ${pathName} is a string`);
    assert.match(value, /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?)?$/, `${label}: ${pathName} is ISO-like`);
    assert.ok(Number.isFinite(Date.parse(value)), `${label}: ${pathName} parses as a date`);
  });
}

function assertUrlValue(value, label, pathName) {
  const values = Array.isArray(value) ? value : [value];
  for (const item of values.filter((entry) => typeof entry === "string")) {
    assert.match(item, /^https?:\/\//, `${label}: ${pathName} is absolute (${item})`);
  }
}

function assertAbsoluteUrls(graph, label) {
  const urlKeys = new Set(["url", "item", "contentUrl", "embedUrl", "downloadUrl", "sameAs", "citation", "relatedLink", "thumbnailUrl"]);
  visit(graph, (value, pathName) => {
    const key = pathName.split(".").pop();
    if (key === "@id" && (typeof value === "string" || Array.isArray(value))) assertUrlValue(value, label, pathName);
    if (urlKeys.has(key)) assertUrlValue(value, label, pathName);
    if ((key === "image" || key === "logo") && (typeof value === "string" || Array.isArray(value))) assertUrlValue(value, label, pathName);
  });
}

function assertLocale(graph, sample, label) {
  const allowed = new Set(sample.allowedSchemaLanguages || [sample.schemaLanguage || sample.locale]);
  for (const node of graph) {
    if (node.inLanguage) assert.ok(allowed.has(node.inLanguage), `${label}: ${schemaTypes(node).join("/")} inLanguage ${node.inLanguage}`);
    if (sample.contentLanguageTypes?.some((type) => schemaTypes(node).includes(type))) {
      assert.equal(node.inLanguage, sample.contentLanguage, `${label}: ${schemaTypes(node).join("/")} content language`);
    }
  }
}

function assertSiteSchemas(graph, { label, nonHome }) {
  const organization = graph.find((node) => node?.["@id"] === ORGANIZATION_ID);
  const website = graph.find((node) => node?.["@id"] === WEBSITE_ID) || firstType(graph, "WebSite");
  assert.ok(organization, `${label}: Organization schema`);
  assert.ok(website, `${label}: WebSite schema`);
  assert.equal(organization.logo?.["@type"], "ImageObject", `${label}: Organization logo ImageObject`);
  assert.match(organization.logo?.url || "", new RegExp(`${BRAND_IMAGE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), `${label}: Organization logo URL`);
  for (const url of [
    "https://t.me/NexuAlphaClub",
    "https://t.me/NexuAlphaGlobal",
    "https://www.youtube.com/@NexuAlphaCN",
    "https://www.youtube.com/@NexuAlphaGlobal",
  ]) {
    assert.ok(organization.sameAs?.includes(url), `${label}: Organization sameAs includes ${url}`);
  }
  assert.ok(organization.sameAs?.some((url) => url === "https://twitter.com/NexuAlpha" || url === "https://x.com/NexuAlpha"), `${label}: Organization sameAs includes X/Twitter`);
  assert.equal(website.publisher?.["@id"], organization["@id"], `${label}: WebSite publisher references Organization`);
  if (nonHome) assert.ok(hasType(graph, "BreadcrumbList"), `${label}: non-home page has BreadcrumbList`);
}

function assertRequiredByType(graph, label, sample) {
  const typedNodes = [];
  visit(graph, (node) => { if (node && typeof node === "object" && schemaTypes(node).includes("Event")) typedNodes.push(node); });
  for (const node of [...graph.filter((node) => !schemaTypes(node).includes("Event")), ...typedNodes]) {
    const types = schemaTypes(node);
    if (types.includes("NewsArticle")) {
      for (const key of ["headline", "datePublished", "dateModified", "author", "publisher", "image", "inLanguage"]) assert.ok(node[key], `${label}: NewsArticle.${key}`);
    }
    if (types.includes("SoftwareApplication")) {
      assert.equal(node.operatingSystem, "iOS, Android", `${label}: SoftwareApplication operatingSystem`);
      assert.equal(node.applicationCategory, "FinanceApplication", `${label}: SoftwareApplication category`);
      assert.ok(Array.isArray(node.downloadUrl) && node.downloadUrl.every((url) => /^https:\/\/(?:apps\.apple\.com|play\.google\.com|www\.(?:okx|bitget|binance|bybit)\.com)\//.test(url)), `${label}: SoftwareApplication downloadUrl official domains`);
    }
    if (types.includes("Event")) {
      for (const key of ["startDate", "eventAttendanceMode", "organizer", "url"]) assert.ok(node[key], `${label}: Event.${key}`);
      if (sample.requireEventEndDate) assert.ok(node.endDate, `${label}: Event.endDate`);
      assert.equal(node.eventAttendanceMode, "https://schema.org/OnlineEventAttendanceMode", `${label}: Event attendance mode`);
    }
    if (types.includes("VideoObject")) {
      for (const key of ["name", "description", "thumbnailUrl", "uploadDate"]) assert.ok(node[key], `${label}: VideoObject.${key}`);
      assert.match(String(node.uploadDate), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)$/, `${label}: VideoObject.uploadDate needs a datetime with time zone`);
      assert.ok(node.contentUrl || node.embedUrl, `${label}: VideoObject contentUrl or embedUrl`);
    }
    if (types.includes("LearningResource")) {
      assert.ok(node.name, `${label}: LearningResource.name`);
      assert.ok(node.url, `${label}: LearningResource.url`);
    }
    if (types.includes("DefinedTerm")) {
      assert.ok(node.name, `${label}: DefinedTerm.name`);
      assert.ok(node.inDefinedTermSet || node.isPartOf, `${label}: DefinedTerm set reference`);
    }
    if (types.includes("BreadcrumbList")) {
      assert.ok(node.itemListElement?.length >= 2, `${label}: BreadcrumbList hierarchy`);
      node.itemListElement.forEach((item, index) => {
        assert.equal(item.position, index + 1);
        assert.ok(item.name && item.item, `${label}: breadcrumb name and URL`);
      });
    }
    if (types.includes("DefinedTermSet")) assert.ok(node.hasDefinedTerm || node.name, `${label}: DefinedTermSet content`);
    if (types.includes("FAQPage")) {
      assert.ok(Array.isArray(node.mainEntity) && node.mainEntity.length > 0, `${label}: FAQPage questions`);
      for (const question of node.mainEntity) {
        assert.equal(question["@type"], "Question");
        assert.ok(question.name && question.acceptedAnswer?.text, `${label}: FAQPage has answered questions`);
      }
    }
  }
}

function validateStructuredData(html, sample) {
  const blocks = extractJsonLd(html);
  const graph = flattenSchema(blocks);
  const label = `${sample.type} ${sample.locale} ${sample.path}`;
  assert.ok(graph.length > 0, `${label}: graph is non-empty`);
  assertNoRatingsOrReviews(graph, label);
  assertIsoDates(graph, label);
  assertAbsoluteUrls(graph, label);
  assertLocale(graph, sample, label);
  assertSiteSchemas(graph, { label, nonHome: sample.path !== "/" });
  assertRequiredByType(graph, label, sample);
  for (const type of sample.expectTypes) assert.ok(hasType(graph, type), `${label}: expected ${type}`);
  if (sample.forbidTypes) for (const type of sample.forbidTypes) assert.equal(hasType(graph, type), false, `${label}: forbidden ${type}`);
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0];
  assert.ok(canonical, `${label}: canonical link`);
  const canonicalHref = attr(canonical, "href");
  assertUrlValue(canonicalHref, label, "canonical");
  for (const match of html.matchAll(/<link\b[^>]*hreflang=["'][^"']+["'][^>]*>/gi)) {
    assertUrlValue(attr(match[0], "href"), label, "hreflang");
    assert.match(attr(match[0], "hreflang"), /^(?:x-default|[a-z]{2}(?:-[A-Za-z0-9]+)*)$/, `${label}: hreflang language tag`);
  }
  for (const node of graph) {
    const mainEntityOfPage = typeof node.mainEntityOfPage === "string" ? node.mainEntityOfPage : node.mainEntityOfPage?.["@id"];
    if (mainEntityOfPage) assert.equal(mainEntityOfPage, canonicalHref, `${label}: mainEntityOfPage canonical`);
  }
  const htmlLang = html.match(/<html\b[^>]*\slang=["']([^"']+)["']/i)?.[1];
  assert.equal(htmlLang, sample.htmlLanguage || sample.locale, `${label}: html lang`);
}

async function fetchBuiltPage(worker, env, sample) {
  const pathName = localizedPath(sample.path, sample.locale);
  const response = await worker.fetch(new Request(`${ORIGIN}${pathName}`, { headers: { accept: "text/html" } }), env);
  const html = await response.text();
  assert.equal(response.status, sample.status || 200, `${sample.type} ${sample.locale} ${pathName}: status`);
  return html;
}

async function loadBuiltArtifacts() {
  assert.ok(existsSync(workerPath), "run npm run build before this test: dist/server/index.js is missing");
  assert.ok(existsSync(ssrPath), "run npm run build before this test: dist/ssr/entry-server.js is missing");
  assert.ok(existsSync(clientRoot), "run npm run build before this test: dist/client is missing");
  return {
    worker: (await import(pathToFileURL(workerPath).href)).default,
    render: (await import(pathToFileURL(ssrPath).href)).render,
  };
}

test("built pages emit valid complete JSON-LD across page types and core locales", async (t) => {
  const { worker, render } = await loadBuiltArtifacts();
  const sourceFeed = JSON.parse(await readFile(path.join(root, "public", "content", "news-feed.json"), "utf8"));
  const sourceArticles = Array.isArray(sourceFeed) ? sourceFeed : sourceFeed.items || sourceFeed.articles || [];
  assert.ok(sourceArticles.some((article) => article.slug === NEWS_ARTICLE_PATH.slice("/news/".length) && article.seo?.noindex === false), `${NEWS_ARTICLE_PATH}: real search-published feed article`);

  const env = {
    ASSETS: {
      fetch: async (request) => {
        const pathname = new URL(request.url).pathname;
        const asset = await readAsset(pathname === "/" ? "/index.html" : pathname);
        if (!asset) return new Response("missing", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
        return new Response(asset.body, { headers: { "content-type": asset.type } });
      },
    },
    NEWS_SSR_RENDER: render,
    INTEL_READ: async () => ({ generatedAt: fixtureDate(), items: [activityUpdate] }),
    CALENDAR_READ: async () => calendarFeed,
  };

  const routeMatrix = [
    { type: "home", path: "/", expectTypes: ["Organization", "WebSite"] },
    { type: "legal", path: "/privacy", expectTypes: ["WebPage"] },
    { type: "about", path: "/about", expectTypes: ["AboutPage"] },
    { type: "exchangeDirectory", path: "/exchanges", expectTypes: ["ItemList"] },
    { type: "academyHub", path: ACADEMY_PATH, expectTypes: ["Course"] },
    { type: "glossaryHub", path: GLOSSARY_PATH, expectTypes: ["DefinedTermSet"] },
    { type: "coinHub", path: COINS_PATH, expectTypes: ["CollectionPage"] },
    { type: "newsListing", path: "/news", expectTypes: ["CollectionPage"] },
    { type: "comparison", path: "/compare/binance-vs-okx", expectTypes: ["WebPage", "FAQPage"] },
    { type: "comparisonHub", path: "/compare", expectTypes: ["WebPage"] },
    { type: "factbook", path: "/factbook/okx", expectTypes: ["Dataset"] },
    { type: "topic", path: "/topics/meme-coins", expectTypes: ["CollectionPage"] },
    { type: "topicHub", path: "/topics", expectTypes: ["CollectionPage"], allowedSchemaLanguages: ["en", "zh-Hans", "zh-Hant"], contentLanguage: "en", contentLanguageTypes: ["CollectionPage"] },
    { type: "factbookHub", path: "/factbook", expectTypes: ["CollectionPage"], allowedSchemaLanguages: ["en", "zh-Hans", "zh-Hant"], contentLanguage: "en", contentLanguageTypes: ["CollectionPage"] },
    { type: "fundingRates", path: "/funding-rates", expectTypes: ["Dataset"] },
    { type: "liquidations", path: "/liquidations", expectTypes: ["Dataset"] },
    { type: "onchain", path: "/onchain", expectTypes: ["WebPage"] },
    { type: "rates", path: "/rates", expectTypes: ["WebPage"] },
    { type: "methodology", path: "/methodology", expectTypes: ["WebPage"] },
    { type: "telegram", path: "/telegram", expectTypes: ["WebPage"] },
    { type: "activitiesHub", path: "/activities", expectTypes: ["CollectionPage"] },
    { type: "partners", path: "/partners", expectTypes: ["WebPage"] },
    { type: "partnerLanding", path: "/ref/okx", expectTypes: ["WebPage"] },
    { type: "newsArticle", path: NEWS_ARTICLE_PATH, expectTypes: ["NewsArticle"] },
    { type: "dataTool", path: CALENDAR_PATH, expectTypes: ["Event"] },
    { type: "exchangeProfile", path: "/exchanges/okx", expectTypes: ["Organization"] },
    { type: "dexProfile", path: "/exchanges/uniswap", expectTypes: ["Organization", "WebPage"] },
    { type: "perpDexProfile", path: "/exchanges/hyperliquid", expectTypes: ["Organization", "WebPage"] },
    { type: "exchangeApp", path: appDownloadPath("okx"), expectTypes: ["SoftwareApplication", "FAQPage"] },
    { type: "campaign", path: BINANCE_OCTOBER_PATH, expectTypes: ["WebPage", "FAQPage"], forbidTypes: ["Event"] },
    { type: "bybitCampaign", path: "/activities/bybit-stocks", expectTypes: ["WebPage", "FAQPage"] },
    { type: "bitgetCampaign", path: "/activities/bitget-alliance", expectTypes: ["WebPage", "FAQPage"] },
    { type: "krakenCampaign", path: "/activities/kraken-usdg-challenge", expectTypes: ["WebPage", "FAQPage"] },
    { type: "academyLesson", path: ACADEMY_LESSON_PATH, expectTypes: ["VideoObject", "LearningResource"] },
    { type: "glossaryTerm", path: glossaryTermPath("kyc"), expectTypes: ["DefinedTerm", "FAQPage"] },
    { type: "converter", path: "/convert/btc-to-usd", expectTypes: ["WebPage"] },
    { type: "coin", path: coinPath("bitcoin"), expectTypes: ["WebPage"] },
    { type: "flash", path: "/flash", expectTypes: ["LiveBlogPosting"] },
    { type: "activityUpdate", path: updatePath(activityUpdate), expectTypes: ["NewsArticle", "Event"], requireEventEndDate: true },
  ];

  const samples = routeMatrix.flatMap((route) => LOCALES.map((locale) => ({ ...route, locale })));
  let checked = 0;
  for (const sample of samples) {
    // The Traditional Chinese shell can display an explicitly English/Simplified content fallback.
    if (sample.locale === "zh-Hant" && ["legal", "glossaryHub", "glossaryTerm", "campaign", "bitgetCampaign", "krakenCampaign", "newsArticle", "newsListing"].includes(sample.type)) {
      const contentLanguage = ["newsArticle", "newsListing"].includes(sample.type) ? "zh-Hans" : "en";
      sample.allowedSchemaLanguages = [sample.locale, contentLanguage];
      sample.contentLanguage = contentLanguage;
      sample.contentLanguageTypes = ["CollectionPage", "NewsArticle", "DefinedTerm", "DefinedTermSet", "WebPage", "FAQPage"];
    }
    await t.test(`${sample.type} ${sample.locale}`, async () => {
      const html = await fetchBuiltPage(worker, env, sample);
      validateStructuredData(html, sample);
    });
    checked += 1;
  }
  assert.equal(checked, routeMatrix.length * LOCALES.length);
});

test("built noindex fallback locales keep JSON-LD locale-safe and do not advertise search-only hreflang", async () => {
  const { worker, render } = await loadBuiltArtifacts();
  const env = {
    ASSETS: {
      fetch: async (request) => {
        const pathname = new URL(request.url).pathname;
        const asset = await readAsset(pathname === "/" ? "/index.html" : pathname);
        if (!asset) return new Response("missing", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
        return new Response(asset.body, { headers: { "content-type": asset.type } });
      },
    },
    NEWS_SSR_RENDER: render,
  };
  const response = await worker.fetch(new Request(`${ORIGIN}/it${ACADEMY_LESSON_PATH}`, { headers: { accept: "text/html" } }), env);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /<meta name="robots" content="noindex,follow"/);
  validateStructuredData(html, {
    type: "academyFallback",
    path: ACADEMY_LESSON_PATH,
    locale: "it",
    htmlLanguage: "it",
    allowedSchemaLanguages: ["it", "en"],
    contentLanguage: "en",
    contentLanguageTypes: ["VideoObject", "LearningResource"],
    expectTypes: ["VideoObject", "LearningResource"],
  });
  assert.equal(/hreflang="it"/.test(html), false, "Italian fallback is noindex and not advertised as a search hreflang");
});

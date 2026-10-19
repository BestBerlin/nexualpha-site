import { finalizeDataset } from "./dataset-schema.js";
// Head of the linkable data assets and /press (Worker head, /api/route-seo via seo-injection.js, sitemap-data.xml):
// title, description, robots and JSON-LD. Indexable in en and zh-Hans; other UI locales render English noindex,follow.
// Dataset: license CC BY 4.0, creator = the NexuAlpha Organization (@id), temporalCoverage, distribution = CSV.
// dataAssetView() fills the page copy with figures from the data, so the page, the FAQ schema and the tests agree.
import { BRAND, BRAND_LOCALES, NEXUALPHA_PUBLISHER, ORGANIZATION_ID, WEBSITE_ID } from "./brand-entity.js";
import { DATA_ASSETS, DATA_ASSET_INDEX_LOCALES, DATA_ASSET_KEYS, DATA_ASSET_ROUTE_PATHS, PRESS_PATH, dataAssetKeyForPath, isDataAssetRoute } from "./data-assets-routes.js";
import {
  DATA_ASSET_LICENSE_URL, DATA_ASSETS_LAUNCH_DAY, FEE_INDEX_EDITION, dataAssetUrls, editionLabel, feeIndexRows, sgtStamp, feeIndexStats, formatUsdShort,
  tickerCoverage, tokenizedTrackerRows, tokenizedTrackerStats,
} from "./data-assets.js";
import { dataAssetsCopy, fillCopy } from "./data-assets-copy.js";
import { feePct } from "./exchange-facts.js";
import { titleBudgetForLocale } from "./meta-description.js";
import { hreflangAlternates } from "./news-feed-client.js";

const ORIGIN = "https://nexualpha.com";
const PAGE_KEY = { "exchange-fee-index": "fee", "tokenized-stock-tracker": "ts", "whale-accumulation-report": "whale" };
export const pageKeyForAsset = (key) => PAGE_KEY[key] || null;

const listText = (items, locale) => {
  try { return new Intl.ListFormat(locale === "zh-Hans" ? "zh" : "en", { style: "long", type: "conjunction" }).format(items); } catch { return items.join(", "); }
};

/** Copy of one asset page with its figures filled in. `report` is the whale report (null = unavailable). */
export function dataAssetView(key, locale = "en", { report = null, market } = {}) {
  const copy = dataAssetsCopy(locale);
  if (key === "exchange-fee-index") {
    const rows = feeIndexRows({ locale, market });
    const s = feeIndexStats(rows);
    const vars = { venues: s.venues, checked: s.checkedVenues, spot: feePct(s.medianSpotTaker, locale), perp: feePct(s.medianPerpTaker, locale), lowest: feePct(s.lowestPerpTaker, locale), lowestVenues: listText(s.lowestPerpTakerVenues, locale) };
    return { page: copy.fee, rows, stats: s, vars, lead: fillCopy(copy.fee.lead, vars), keyFinding: fillCopy(copy.fee.keyFinding, vars), faq: copy.fee.faq.map(([q, a]) => [q, fillCopy(a, vars)]) };
  }
  if (key === "tokenized-stock-tracker") {
    const rows = tokenizedTrackerRows({ locale, market });
    const s = tokenizedTrackerStats(rows);
    const coverage = tickerCoverage(rows);
    const spotNames = [...new Set(rows.filter((r) => r.lane === "spot").map((r) => r.exchange))];
    const vars = {
      exchanges: s.exchanges, checked: s.checkedOn, top: coverage[0]?.ticker || "", second: coverage[1]?.ticker || "", count: coverage[0]?.count || 0,
      families: listText(s.families, locale), spotList: listText(spotNames, locale), perpCount: s.perpExchanges,
    };
    return { page: copy.ts, rows, stats: s, coverage, vars, lead: fillCopy(copy.ts.lead, vars), keyFinding: fillCopy(copy.ts.keyFinding, vars), faq: copy.ts.faq.map(([q, a]) => [q, fillCopy(a, vars)]) };
  }
  if (key === "whale-accumulation-report") {
    const page = copy.whale;
    if (!report) return { page, report: null, vars: {}, lead: fillCopy(page.lead, { end: "—" }), keyFinding: "", faq: [] };
    const t = report.totals;
    const vars = {
      end: sgtStamp(report.windowEnd, locale), acc: formatUsdShort(t.accumulation.usd), dist: formatUsdShort(t.distribution.usd),
      sAdd: formatUsdShort(t.shortAdd.usd), sCover: formatUsdShort(t.shortCover.usd),
      topCoin: report.topAccumulation?.coin || "—", topUsd: report.topAccumulation ? formatUsdShort(report.topAccumulation.accumulation) : "—",
    };
    const faq = report.topAccumulation ? page.faq.map(([q, a]) => [q, fillCopy(a, vars)]) : page.faq.slice(1);
    return { page, report, vars, lead: fillCopy(page.lead, vars), keyFinding: report.topAccumulation ? fillCopy(page.keyFinding, vars) : "", faq };
  }
  return null;
}

function fitTitle(page, locale) {
  const budget = titleBudgetForLocale(locale);
  return [page.title, page.titleShort].find((t) => t && t.length <= budget) || page.titleShort;
}

const crumbs = (items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, item], index) => ({ "@type": "ListItem", position: index + 1, name, item })) });
const faqSchema = (faq, locale) => ({ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: locale, mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
const CREATOR = Object.freeze({ "@type": "Organization", "@id": ORGANIZATION_ID, name: BRAND.name, url: BRAND.url });

/** Dataset node of one asset (also listed on /press). */
export function datasetSchema(key, locale = "en", { url, report = null } = {}) {
  const view = dataAssetView(key, locale, { report });
  const urls = dataAssetUrls(key);
  const base = finalizeDataset({
    "@context": "https://schema.org", "@type": "Dataset", "@id": `${urls.page}#dataset`,
    name: view.page.datasetName, description: view.page.datasetDescription, url: url || urls.page, inLanguage: locale,
    isAccessibleForFree: true, license: DATA_ASSET_LICENSE_URL, creditText: "Source: NexuAlpha",
    creator: CREATOR, publisher: NEXUALPHA_PUBLISHER, copyrightHolder: { "@id": ORGANIZATION_ID },
    datePublished: DATA_ASSETS_LAUNCH_DAY,
    distribution: [{ "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: urls.csv, name: `${view.page.datasetName} (CSV)` }],
    image: urls.svg,
  });
  if (key === "exchange-fee-index") {
    const s = view.stats;
    return {
      ...base, version: FEE_INDEX_EDITION, dateModified: s.lastReviewed, temporalCoverage: `${s.firstReviewed}/${s.lastReviewed}`,
      keywords: ["crypto exchange fees", "maker fee", "taker fee", "perpetual futures fees", "spot trading fees", "fee index"],
      variableMeasured: ["spot maker fee (%)", "spot taker fee (%)", "perpetual maker fee (%)", "perpetual taker fee (%)", "review date"],
      measurementTechnique: "Base-tier fees read from each exchange's official fee page or fee endpoint",
      isBasedOn: view.rows.filter((r) => r.sourceUrl).map((r) => ({ "@type": "WebPage", name: `${r.name} fee schedule`, url: r.sourceUrl })),
    };
  }
  if (key === "tokenized-stock-tracker") {
    const s = view.stats;
    const used = [...new Map(view.rows.flatMap((r) => r.sources).map((src) => [src.url, src])).values()].slice(0, 40);
    return {
      ...base, dateModified: s.checkedOn, temporalCoverage: `${s.firstSource}/${s.checkedOn}`,
      keywords: ["tokenized stocks", "xStocks", "Ondo", "bStocks", "rToken", "stock perpetuals", "pre-IPO perpetuals"],
      variableMeasured: ["exchange", "product", "token family", "tickers", "restricted regions", "source date"],
      isBasedOn: used.map((src) => ({ "@type": "WebPage", name: src.title, url: src.url })),
    };
  }
  return {
    ...base, dateModified: report?.windowEnd || DATA_ASSETS_LAUNCH_DAY,
    temporalCoverage: report ? `${report.windowStart}/${report.windowEnd}` : `${DATA_ASSETS_LAUNCH_DAY}/..`,
    keywords: ["whale accumulation", "whale tracker", "Hyperliquid whales", "crypto whale flows", "on-chain data"],
    variableMeasured: ["accumulation (USD)", "distribution (USD)", "short added (USD)", "short covered (USD)", "wallets", "fills"],
    measurementTechnique: "Signals derived from public Hyperliquid fills of tracked wallets, summed over a rolling 7-day window",
    isBasedOn: [{ "@type": "WebPage", name: "Hyperliquid info endpoint", url: "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint" }],
  };
}

/** Head of an asset page or /press, or null for other paths. */
export function dataAssetRouteSeo(pathname, locale = "en", { urlFor, report = null } = {}) {
  if (!isDataAssetRoute(pathname)) return null;
  const copy = dataAssetsCopy(locale);
  const url = urlFor(pathname), homeUrl = urlFor("/"), pressUrl = urlFor(PRESS_PATH);
  const indexable = DATA_ASSET_INDEX_LOCALES.includes(locale);
  const common = { status: 200, indexable, alternatesLocales: DATA_ASSET_INDEX_LOCALES };
  if (pathname === PRESS_PATH) {
    const page = copy.press;
    return {
      ...common, title: fitTitle(page, locale), description: page.description, h1: page.h1,
      schemas: [
        {
          "@context": "https://schema.org", "@type": "WebPage", name: page.title, description: page.description, url, inLanguage: locale,
          isPartOf: { "@type": "WebSite", "@id": WEBSITE_ID }, about: { "@type": "Organization", "@id": ORGANIZATION_ID, name: BRAND.name },
          publisher: NEXUALPHA_PUBLISHER, dateModified: DATA_ASSETS_LAUNCH_DAY,
          hasPart: DATA_ASSET_KEYS.map((key) => datasetSchema(key, locale, { url: urlFor(DATA_ASSETS[key]), report })),
        },
        crumbs([[copy.common.home, homeUrl], [page.h1, url]]),
      ],
    };
  }
  const key = dataAssetKeyForPath(pathname);
  const view = dataAssetView(key, locale, { report });
  const page = view.page;
  return {
    ...common, title: fitTitle(page, locale), description: page.description, h1: page.h1,
    schemas: [
      datasetSchema(key, locale, { url, report }),
      ...(view.faq.length ? [faqSchema(view.faq, locale)] : []),
      crumbs([[copy.common.home, homeUrl], [copy.press.h1, pressUrl], [page.h1, url]]),
    ],
  };
}

/** Indexable URLs with their hreflang sets (sitemap-data.xml). */
export function dataAssetsSitemapEntries({ urlFor, lastmod = DATA_ASSETS_LAUNCH_DAY }) {
  return DATA_ASSET_ROUTE_PATHS.flatMap((pathname) => DATA_ASSET_INDEX_LOCALES.map((locale) => ({
    pathname, locale, loc: urlFor(pathname, locale), lastmod, changefreq: pathname === DATA_ASSETS["whale-accumulation-report"] ? "daily" : "monthly",
    alternates: hreflangAlternates(DATA_ASSET_INDEX_LOCALES, (hreflang) => urlFor(pathname, hreflang)),
  })));
}

export const PRESS_LANGUAGE_COUNT = BRAND_LOCALES.length;
export { editionLabel };

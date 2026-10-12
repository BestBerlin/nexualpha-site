// Server-side head of /etf-flows and /calendar (Worker head, /api/route-seo via seo-injection.js, sitemap): title,
// description, robots and JSON-LD. Indexable in INTEL_TOOL_INDEX_LOCALES; other UI locales render English as
// noindex,follow. The Dataset/Event schema is built from the snapshot the page renders with (null = no live numbers).
import { NEXUALPHA_PUBLISHER, RESEARCH_DESK } from "./brand-entity.js";
import { CALENDAR_ICS_PATH, CALENDAR_JSON_PATH, CALENDAR_PATH, ETF_FLOWS_JSON_PATH, ETF_FLOWS_PATH, INTEL_TOOL_INDEX_LOCALES, INTEL_TOOL_LIVE_PATHS, intelToolKey, isIntelToolLive } from "./intel-tools-routes.js";
import { fill, intelToolsCopy } from "./intel-tools-copy.js";
import { calendarEventLabel } from "./intel-tools-labels.js";
import { titleBudgetForLocale } from "./meta-description.js";
import { hreflangAlternates } from "./news-feed-client.js";

const ORIGIN = "https://nexualpha.com";
// Day the pages went live; temporalCoverage starts at the snapshot's first day when that is earlier.
export const INTEL_TOOLS_LAUNCH_DAY = "2026-10-13";

function fitTitle(page, locale) {
  const budget = titleBudgetForLocale(locale);
  return [page.title, page.titleShort].find((t) => t && t.length <= budget) || page.titleShort;
}

const crumbs = (items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, item], index) => ({ "@type": "ListItem", position: index + 1, name, item })) });
const faqSchema = (faq, locale) => ({ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: locale, mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });

function etfSchemas(locale, url, homeUrl, data) {
  const copy = intelToolsCopy(locale), page = copy.etf;
  const first = data?.days?.[0]?.date;
  return [
    {
      "@context": "https://schema.org", "@type": "Dataset", name: page.datasetName, description: page.datasetDescription, url, inLanguage: locale,
      isAccessibleForFree: true, license: `${ORIGIN}/methodology#data-license`, creator: RESEARCH_DESK, publisher: NEXUALPHA_PUBLISHER,
      temporalCoverage: `${first && first < INTEL_TOOLS_LAUNCH_DAY ? first : INTEL_TOOLS_LAUNCH_DAY}/..`,
      ...(data ? { dateModified: data.generatedAt } : {}),
      keywords: ["spot bitcoin ETF flows", "ETF inflows", "ETF outflows", "IBIT", "FBTC", "GBTC", "spot ether ETF"],
      variableMeasured: ["netFlowUsd", "sharesOutstanding", "navPerShare", "totalNetAssetsUsd", "coinHoldings"],
      measurementTechnique: "Daily net flow = change in issuer-reported shares outstanding x NAV per share",
      ...(data?.sources?.length ? { isBasedOn: data.sources.slice(0, 20).map((s) => ({ "@type": "CreativeWork", name: s.name, url: s.url })) } : {}),
      distribution: [{ "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${ORIGIN}${ETF_FLOWS_JSON_PATH}` }],
    },
    faqSchema(page.faq, locale),
    crumbs([[copy.common.home, homeUrl], [page.h1, url]]),
  ];
}

function calendarSchemas(locale, url, homeUrl, data, now) {
  const copy = intelToolsCopy(locale), page = copy.calendar;
  const from = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate());
  const upcoming = (data?.events || []).filter((e) => Date.parse(e.start) >= from).slice(0, 30);
  return [
    {
      "@context": "https://schema.org", "@type": "Dataset", name: page.datasetName, description: page.datasetDescription, url, inLanguage: locale,
      isAccessibleForFree: true, license: `${ORIGIN}/methodology#data-license`, creator: RESEARCH_DESK, publisher: NEXUALPHA_PUBLISHER,
      temporalCoverage: `${INTEL_TOOLS_LAUNCH_DAY}/..`, ...(data ? { dateModified: data.generatedAt } : {}),
      keywords: ["crypto calendar", "token unlocks", "FOMC", "CPI", "exchange listings", "delistings"],
      distribution: [
        { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${ORIGIN}${CALENDAR_JSON_PATH}` },
        { "@type": "DataDownload", encodingFormat: "text/calendar", contentUrl: `${ORIGIN}${CALENDAR_ICS_PATH}` },
      ],
    },
    ...(upcoming.length ? [{
      "@context": "https://schema.org", "@type": "ItemList", name: page.listTitle, numberOfItems: upcoming.length,
      itemListElement: upcoming.map((e, index) => ({
        "@type": "ListItem", position: index + 1,
        item: {
          "@type": "Event", name: calendarEventLabel(e, locale), startDate: e.allDay ? e.start.slice(0, 10) : e.start,
          eventStatus: "https://schema.org/EventScheduled", eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
          location: { "@type": "VirtualLocation", url: e.pagePath ? `${ORIGIN}${e.pagePath}` : e.sourceUrl },
          organizer: { "@type": "Organization", name: e.sourceName || "", url: e.sourceUrl },
          url: e.sourceUrl, description: `${page.types[e.type] || e.type}: ${calendarEventLabel(e, locale)}`,
        },
      })),
    }] : []),
    faqSchema(page.faq, locale),
    crumbs([[copy.common.home, homeUrl], [page.h1, url]]),
  ];
}

/**
 * Head of /etf-flows or /calendar, or null for other paths. `data` is the normalized snapshot (readEtfFlows /
 * readCalendar) the page renders with; `now` is the request time (upcoming events in the schema).
 */
export function intelToolRouteSeo(pathname, locale, { urlFor, data = null, now = Date.now() } = {}) {
  const key = intelToolKey(pathname);
  if (!key) return null;
  const copy = intelToolsCopy(locale);
  const page = key === "etf" ? copy.etf : copy.calendar;
  const url = urlFor(pathname), homeUrl = urlFor("/");
  return {
    status: 200, title: fitTitle(page, locale), description: page.description, h1: page.h1,
    indexable: isIntelToolLive(pathname) && INTEL_TOOL_INDEX_LOCALES.includes(locale), alternatesLocales: isIntelToolLive(pathname) ? INTEL_TOOL_INDEX_LOCALES : [],
    schemas: key === "etf" ? etfSchemas(locale, url, homeUrl, data) : calendarSchemas(locale, url, homeUrl, data, now),
  };
}

/** Every indexable URL with its hreflang set (sitemap-data.xml). */
export function intelToolsSitemapEntries({ urlFor, lastmod = INTEL_TOOLS_LAUNCH_DAY }) {
  return INTEL_TOOL_LIVE_PATHS.flatMap((pathname) => INTEL_TOOL_INDEX_LOCALES.map((locale) => ({
    pathname, locale, loc: urlFor(pathname, locale), lastmod, changefreq: "daily",
    alternates: hreflangAlternates(INTEL_TOOL_INDEX_LOCALES, (hreflang) => urlFor(pathname, hreflang)),
  })));
}
export { CALENDAR_PATH, ETF_FLOWS_PATH, calendarEventLabel };

import React from "react";
import { renderToString } from "react-dom/server";
import { App, routeState } from "./App.jsx";
import { neutralVenueCatalog } from "./data/market-command";
import { normalizeNewsArticlePool, normalizeNewsFeed, normalizeNewsFeedSummaries } from "./data/news-feed-client.js";
import { getBrazilPage } from "./data/brazil-market.js";
import { supportedLocales } from "./content/locale-manifest";
import { parsePublicRoute } from "./data/locale-routing.js";
import { rewritePartnerViewHtml } from "./data/partner-view.js";
import { withHomeHeroVariant } from "./components/v7/home7-hero-variants.js";
import { computeRouteSeo } from "./data/seo-injection.js";
import { withRequestMarket } from "./data/partner-geo-policy.js";

// heroVariant: home hero copy experiment (X5). "b" only for the build-time variant B prerender; default "a" = live copy.
export function render(url, { newsArticles, newsListing, marketEvents, liquidationLevels, fundingMatrix, funding, officialAnnouncements, toolArticles, heroVariant, flash, coins, fx, ticker, whales, radar, intelTool, seoAlternates, tsLive } = {}) {
  const parsedUrl = new URL(url, "https://nexualpha.com");
  const requestedLocale = parsedUrl.searchParams.get("locale");
  const publicRoute = parsePublicRoute(parsedUrl.pathname, parsedUrl.searchParams);
  const initialLocale = getBrazilPage(parsedUrl.pathname)
    ? "pt-BR"
    : supportedLocales.includes(requestedLocale)
      ? requestedLocale
      : supportedLocales.includes(publicRoute.locale)
        ? publicRoute.locale
        : "en";
  const normalizedNewsArticles = Array.isArray(newsArticles)
    ? (normalizeNewsFeed(newsArticles).length ? normalizeNewsArticlePool(newsArticles) : normalizeNewsFeedSummaries(newsArticles))
    : undefined;
  const newsSlug = publicRoute.contentPathname.match(/^\/news\/([a-z0-9-]+)$/)?.[1] || null;
  const initialArticle = newsSlug && Array.isArray(normalizedNewsArticles)
    ? normalizedNewsArticles.find((article) => article.slug === newsSlug)
    : undefined;
  const initialSeo = computeRouteSeo({
    url: parsedUrl.href,
    locale: initialLocale,
    newsArticles: normalizedNewsArticles || [],
    article: initialArticle,
    route: routeState(neutralVenueCatalog, parsedUrl.href),
  });
  const routeSeoAlternates = Array.isArray(seoAlternates) ? seoAlternates : (initialSeo?.alternates || []);
  // Türkiye rule (tr-market-gaps): an explicit ?market=TR applies to every policy check of this render, including the
  // components that only pass their locale.
  const html = withRequestMarket(parsedUrl.searchParams.get("market"), () => renderToString(withHomeHeroVariant(
    <React.StrictMode>
      <App
        initialUrl={parsedUrl.pathname + parsedUrl.search + parsedUrl.hash}
        initialLocale={initialLocale}
        initialSeoAlternates={routeSeoAlternates}
        initialCompareSelection={["binance", "okx"]}
        initialNewsArticles={normalizedNewsArticles}
        initialNewsListing={newsListing && typeof newsListing === "object" ? newsListing : undefined}
        initialFundingMatrix={fundingMatrix}
        initialFundingFeed={funding && typeof funding === "object" ? funding : undefined}
        initialMarketEvents={marketEvents && typeof marketEvents === "object" ? marketEvents : undefined}
        initialLiquidationLevels={liquidationLevels && typeof liquidationLevels === "object" ? liquidationLevels : undefined}
        initialOfficialAnnouncements={officialAnnouncements && typeof officialAnnouncements === "object" ? officialAnnouncements : undefined}
        initialToolArticles={toolArticles && typeof toolArticles === "object" ? toolArticles : undefined}
        initialFlash={flash && typeof flash === "object" ? flash : undefined}
        initialCoins={coins && typeof coins === "object" ? coins : undefined}
        initialIntelTool={intelTool && typeof intelTool === "object" ? intelTool : undefined}
        initialFx={fx && typeof fx === "object" ? fx : undefined}
        initialRadar={radar && typeof radar === "object" ? radar : undefined}
        initialTicker={ticker && typeof ticker === "object" ? ticker : undefined}
        initialWhales={whales && typeof whales === "object" ? whales : undefined}
        initialTsLive={tsLive && typeof tsLive === "object" ? tsLive : undefined}
      />
    </React.StrictMode>,
    heroVariant,
  )));
  return rewritePartnerViewHtml(html, parsedUrl.href, { locale: initialLocale });
}

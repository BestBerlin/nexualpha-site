import React from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App.jsx";
import { normalizeNewsArticlePool, normalizeNewsFeed, normalizeNewsFeedSummaries } from "./data/news-feed-client.js";
import { getBrazilPage } from "./data/brazil-market.js";
import { supportedLocales } from "./content/locale-manifest";
import { parsePublicRoute } from "./data/locale-routing.js";
import { withHomeHeroVariant } from "./components/v7/home7-hero-variants.js";

// heroVariant: home hero copy experiment (X5). "b" only for the build-time variant B prerender; default "a" = live copy.
export function render(url, { newsArticles, newsListing, marketEvents, liquidationLevels, fundingMatrix, officialAnnouncements, toolArticles, heroVariant, flash, coins, fx, ticker, movers, radar, intelTool } = {}) {
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
  return renderToString(withHomeHeroVariant(
    <React.StrictMode>
      <App
        initialUrl={parsedUrl.pathname + parsedUrl.search + parsedUrl.hash}
        initialLocale={initialLocale}
        initialCompareSelection={["binance", "okx"]}
        initialNewsArticles={normalizedNewsArticles}
        initialNewsListing={newsListing && typeof newsListing === "object" ? newsListing : undefined}
        initialFundingMatrix={fundingMatrix}
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
        initialMovers={movers && typeof movers === "object" ? movers : undefined}
      />
    </React.StrictMode>,
    heroVariant,
  ));
}

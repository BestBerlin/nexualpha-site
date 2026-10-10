import React from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App.jsx";
import { normalizeNewsArticlePool, normalizeNewsFeed, normalizeNewsFeedSummaries } from "./data/news-feed-client.js";
import { getBrazilPage } from "./data/brazil-market.js";
import { supportedLocales } from "./content/locale-manifest";
import { parsePublicRoute } from "./data/locale-routing.js";

export function render(url, { newsArticles } = {}) {
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
  return renderToString(
    <React.StrictMode>
      <App
        initialUrl={parsedUrl.pathname + parsedUrl.search + parsedUrl.hash}
        initialLocale={initialLocale}
        initialCompareSelection={["binance", "okx"]}
        initialNewsArticles={normalizedNewsArticles}
      />
    </React.StrictMode>,
  );
}

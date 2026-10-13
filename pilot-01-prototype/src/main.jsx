import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App, preloadCurrentRouteModulesForUrl } from "./App.jsx";
import { installCtaAnalytics } from "./data/cta-analytics.js";
import { installOutboundFeedback } from "./data/outbound-feedback.js";
import { installCtaClickBeacon } from "./data/cta-click-beacon.js";
import { signalRootHydrated } from "./data/hydration-readiness.js";
import { buildHydrationBootstrap } from "./data/hydration-bootstrap.js";
import { clientHomeHeroVariant } from "./data/home-hero-experiment.js";
import { withHomeHeroVariant } from "./components/v7/home7-hero-variants.js";
import { createHydrationOnceController, createHydrationRoutePreparer } from "./data/route-module-cache.js";
import "./font-faces.css";
import "./styles/tokens.css";
import "./styles/v2.css";
import "./styles/v2-refinement.css";
import "./styles/v2-interactive-refresh.css";
import "./styles/release-visual-gates.css";
import "./components/v3/v3.css";
import "./components/v3/v3-design-system.css";
import "./components/v3/decision-path-rail.css";
import "./components/v3/onsite-telegram-handoff.css";
import "./styles/v3-layout-stability.css";
import "./styles/brand-editorial.css";
import "./styles/fintech-premium.css";
import "./styles/breakpoints.css";
import "./styles/reader-foundation.css";
import "./styles/reader-material.css";
// Mid cascade, split by route (chunk names and link order: vite.config.mjs; per-route allow-list: worker).
import "./styles/split/home-mid1.css";
import "./styles/split/compare-mid1.css";
import "./styles/split/profile-mid1.css";
import "./styles/split/core-b.css";

// Capture once before any child effect can normalize the current history URL.
const capturedBrowserUrl = typeof window !== "undefined" ? window.location.href : undefined;

installCtaAnalytics();
installOutboundFeedback();
installCtaClickBeacon();

function ClientHydrationSignal() {
  React.useEffect(() => {
    signalRootHydrated();
  }, []);
  return null;
}

const root = document.getElementById("root");
const prerenderState = (() => {
  try {
    return JSON.parse(document.getElementById("nexualpha-prerender-state")?.textContent || "null");
  } catch {
    return null;
  }
})();
const bootstrap = buildHydrationBootstrap({
  browserUrl: capturedBrowserUrl,
  prerenderState,
  hasServerHtml: root?.hasChildNodes(),
  clientRender: root?.dataset.nexualphaClientRender === "true",
});

function HydrationBootstrap() {
  const [initialUrl, setInitialUrl] = React.useState(bootstrap.initialUrl);
  React.useEffect(() => {
    // The browser URL is authoritative after hydration, including query locale.
    setInitialUrl(bootstrap.browserUrl);
  }, []);
  return <>
    <App
      initialUrl={initialUrl}
      initialLocale={undefined}
      initialCompareSelection={prerenderState ? ["binance", "okx"] : undefined}
      initialNewsArticles={prerenderState?.newsArticles}
      initialNewsListing={prerenderState?.newsListing}
      initialMarketEvents={prerenderState?.marketEvents}
      initialOfficialAnnouncements={prerenderState?.officialAnnouncements}
      initialToolArticles={prerenderState?.toolArticles}
      initialFlash={prerenderState?.flash}
      initialCoins={prerenderState?.coins}
      initialFx={prerenderState?.fx}
      initialTicker={prerenderState?.ticker}
      initialRadar={prerenderState?.radar}
    />
    {initialUrl === bootstrap.browserUrl && <ClientHydrationSignal />}
  </>;
}

// Home hero copy experiment (X5): hydrate with exactly the variant the server rendered (prerender state); other pages
// use the worker-set assignment cookie for a later client-side visit to the home page. Never swapped after render.
const heroVariant = clientHomeHeroVariant({ prerenderState, cookie: typeof document !== "undefined" ? document.cookie : "" });
const app = withHomeHeroVariant(<React.StrictMode><HydrationBootstrap /></React.StrictMode>, heroVariant);
const routePreparer = createHydrationRoutePreparer({ preloadForUrl: preloadCurrentRouteModulesForUrl });
let hydrationController;

function clearHydrationFailureState() {
  delete document.documentElement.dataset.nexualphaHydration;
  try { delete window.nexualphaRetryHydration; } catch { window.nexualphaRetryHydration = undefined; }
}

function markHydrationPreloadFailure(error) {
  document.documentElement.dataset.nexualphaHydration = "route-preload-failed";
  window.nexualphaRetryHydration = () => hydrationController.retry();
  window.dispatchEvent(new CustomEvent("nexualpha:hydration-preload-failed", { detail: { message: error?.message || String(error) } }));
}

async function prepareCurrentRouteModules({ retry = false } = {}) {
  const urls = [bootstrap.initialUrl, bootstrap.browserUrl];
  await routePreparer.prepare(urls, { retry });
}

hydrationController = createHydrationOnceController({
  prepare: prepareCurrentRouteModules,
  hydrate: () => hydrateRoot(root, app),
  onFailure: markHydrationPreloadFailure,
  onSuccess: clearHydrationFailureState,
});

if (bootstrap.hydrate) {
  hydrationController.start().catch(() => {
    // Failure is surfaced through markHydrationPreloadFailure while the SSR DOM stays untouched.
  });
} else {
  createRoot(root).render(app);
}
import "./styles/split/home-mid2.css";
import "./styles/split/directory-mid2.css";
import "./styles/split/detail-mid2.css";
import "./styles/v6/index.css";
// Route-only layers (page-*-late chunks, see vite.config.mjs): after the shared layer in the cascade.
import "./styles/v6/home.css";
import "./styles/v6/pages-br.css";
import "./styles/v6/pages-rates.css";
import "./styles/v6/pages-factbook.css";
import "./styles/v6/pages-telegram.css";
// v8 signature layers (route-scoped selectors; last in the cascade).
import "./styles/v8/site-signature.css";
import "./styles/v8/news-signature.css";
import "./styles/v8/activities-telegram-signature.css";
import "./styles/v8/directory-compare-signature.css";
import "./styles/v8/rates-profile-signature.css";

import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App, preloadCurrentRouteModulesForUrl } from "./App.jsx";
import { installCtaAnalytics } from "./data/cta-analytics.js";
import { signalRootHydrated } from "./data/hydration-readiness.js";
import { buildHydrationBootstrap } from "./data/hydration-bootstrap.js";
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
import "./styles/home-refinement.css";
import "./styles/compare-refinement.css";
import "./styles/compare-motion-refinement.css";
import "./styles/profile-refinement.css";
import "./styles/home-lower.css";
import "./styles/home-first-screen.css";
import "./styles/directory-profile-r1.css";
import "./styles/r1-compare.css";
import "./styles/r1-content.css";
import "./styles/type-system.css";
import "./styles/v5/index.css";

// Capture once before any child effect can normalize the current history URL.
const capturedBrowserUrl = typeof window !== "undefined" ? window.location.href : undefined;

installCtaAnalytics();

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
    />
    {initialUrl === bootstrap.browserUrl && <ClientHydrationSignal />}
  </>;
}

const app = <React.StrictMode><HydrationBootstrap /></React.StrictMode>;
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
import "./styles/v5/detail.css";

// Shared harness for the request-time SSR tests (news listings, activities): renders through the real SSR entry via
// Vite, extracts the worker's hydration payload and hydrates the served HTML in jsdom with the same props the browser
// would use (src/main.jsx), collecting every console.error and React recoverable error (hydration mismatches).
import { createRequire } from "node:module";
import { createServer as createViteServer } from "vite";
import { JSDOM } from "jsdom";
import { buildHydrationBootstrap } from "../../src/data/hydration-bootstrap.js";
import { clientHomeHeroVariant } from "../../src/data/home-hero-experiment.js";

const require = createRequire(import.meta.url);

export async function createSsrHarness({ clientHome = false } = {}) {
  // These fixtures only load SSR modules. Client dependency discovery can keep
  // the test server alive after close() while scanning the full application.
  const vite = await createViteServer({
    plugins: clientHome ? [{ name: "test-home-client-branch", enforce: "pre", transform(code, id) {
      if (id.endsWith("/components/v7/HomeV7.jsx")) return code.replaceAll("import.meta.env.SSR", "false");
    } }] : [],
    optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom", logLevel: "error", server: { middlewareMode: true, hmr: false, ws: false },
  });
  const entry = await vite.ssrLoadModule("/src/entry-server.jsx");
  return { vite, render: entry.render, close: () => vite.close() };
}

export const SHELL_HTML = "<!doctype html><html><head><title>Shell</title></head><body><div id=\"root\"></div></body></html>";

export function prerenderState(html) {
  const payload = html.match(/<script type="application\/json" id="nexualpha-prerender-state">([\s\S]*?)<\/script>/)?.[1];
  return payload ? JSON.parse(payload) : null;
}

export function rootInnerHtml(html) {
  return html.match(/<div id="root">([\s\S]*?)<\/div><script type="application\/json" id="nexualpha-prerender-state">/)?.[1] ?? null;
}

export function h1Texts(html) {
  return [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((match) => decodeEntities(match[1].replace(/<[^>]+>/g, "")).trim());
}

export function decodeEntities(value) {
  return String(value).replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", "\"").replaceAll("&#x27;", "'").replaceAll("&#39;", "'");
}

const tick = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
const immediate = () => new Promise((resolve) => setImmediate(resolve));
const flushScheduledDomWork = async () => {
  await Promise.resolve();
  await immediate();
  await tick();
};

// Hydrates the SSR document in jsdom exactly like the browser entry: same bootstrap URL, same prerender-state props.
export async function hydrateInJsdom(vite, html, pageUrl, { timeoutMs = 400, inspect = null, until = null, settleMs = 50, browserUrlAsWindowUrl = false, fixedNow = null, fetchImpl, intersectionObserver } = {}) {
  const state = prerenderState(html);
  const bootstrap = buildHydrationBootstrap({ browserUrl: pageUrl, prerenderState: state, hasServerHtml: true, clientRender: false });
  const dom = new JSDOM(html, { url: browserUrlAsWindowUrl ? pageUrl : bootstrap.initialUrl, pretendToBeVisual: true });
  const { window } = dom;
  const errors = [];
  const stubs = {
    matchMedia: () => ({ matches: false, media: "", onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }),
    IntersectionObserver: intersectionObserver || class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } },
    ResizeObserver: class { observe() {} unobserve() {} disconnect() {} },
    scrollTo() {},
    fetch: fetchImpl || (async () => new Response("{}", { status: 404, headers: { "content-type": "application/json" } })),
  };
  for (const [key, value] of Object.entries(stubs)) if (!window[key]) window[key] = value;
  const globals = ["window", "document", "navigator", "location", "history", "localStorage", "sessionStorage", "HTMLElement", "Element", "Node", "Text", "Event", "CustomEvent", "MutationObserver", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame", "matchMedia", "IntersectionObserver", "ResizeObserver", "scrollTo", "fetch", "CSS"];
  const saved = new Map();
  for (const key of globals) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value: window[key] ?? stubs[key], configurable: true, writable: true });
  }
  const originalError = console.error;
  const originalDateNow = Date.now;
  if (fixedNow !== null) Date.now = () => fixedNow;
  console.error = (...args) => { errors.push(args.map((arg) => (arg instanceof Error ? arg.message : String(arg))).join(" ")); };
  try {
    const React = require("react");
    const { hydrateRoot } = require("react-dom/client");
    const { App } = await vite.ssrLoadModule("/src/App.jsx");
    const { withHomeHeroVariant } = await vite.ssrLoadModule("/src/components/v7/home7-hero-variants.js");
    // Same wrapper as src/main.jsx: the home hero variant comes from the prerender state (X5 hero experiment).
    const heroVariant = clientHomeHeroVariant({ prerenderState: state, cookie: window.document.cookie });
    const app = withHomeHeroVariant(React.createElement(React.StrictMode, null, React.createElement(App, {
      initialUrl: bootstrap.initialUrl,
      initialLocale: undefined,
      initialCompareSelection: ["binance", "okx"],
      initialNewsArticles: state?.newsArticles,
      initialNewsListing: state?.newsListing,
      initialMarketEvents: state?.marketEvents,
      initialFundingFeed: state?.funding,
      initialOfficialAnnouncements: state?.officialAnnouncements,
      initialToolArticles: state?.toolArticles,
      initialFlash: state?.flash,
      initialCoins: state?.coins,
      initialIntelTool: state?.intelTool,
      initialFx: state?.fx,
      initialTicker: state?.ticker,
      initialWhales: state?.whales,
      initialRadar: state?.radar,
      initialSeoAlternates: state?.seoAlternates,
      initialTsLive: state?.tsLive,
      initialTsPage: state?.tsPage,
    })), heroVariant);
    const root = window.document.getElementById("root");
    const reactRoot = hydrateRoot(root, app, { onRecoverableError: (error) => errors.push(`recoverable: ${error?.message || error}`) });
    const started = originalDateNow();
    while (originalDateNow() - started < timeoutMs && (!until || !until(window))) await tick(20);
    const text = root.textContent;
    // Optional: read the hydrated DOM (e.g. markup of one block) before unmounting.
    const inspected = typeof inspect === "function" ? inspect(window) : undefined;
    reactRoot.unmount();
    // Let React scheduler, microtasks, and unmount effect cleanups observe the jsdom globals before teardown.
    await flushScheduledDomWork();
    await tick(settleMs);
    await flushScheduledDomWork();
    return { errors, text, state, bootstrap, inspected };
  } finally {
    Date.now = originalDateNow;
    console.error = originalError;
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
    window.close();
  }
}

export function hydrationErrors(errors) {
  return errors.filter((message) => /hydrat|recoverable|#418|#423|#425|did not match|Minified React error/i.test(message));
}

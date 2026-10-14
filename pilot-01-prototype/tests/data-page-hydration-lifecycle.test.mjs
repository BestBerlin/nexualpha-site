import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { renderToString } from "react-dom/server";
import { createRoot, hydrateRoot } from "react-dom/client";
import { useClientNow } from "../src/components/data/useMarketEvents.js";
import { parsePublicRoute } from "../src/data/locale-routing.js";
import { routeMetadata } from "../worker/index.js";
import { createSsrHarness, hydrateInJsdom, hydrationErrors } from "./helpers/ssr-hydration-harness.mjs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("data-page client pollers use the shared hidden-tab polling controller", () => {
  for (const path of [
    "src/components/data/FundingMatrixPage.jsx",
    "src/components/data/LiquidationHeatmapPage.jsx",
    "src/components/intel-tools/shared.jsx",
    "src/components/v3/activity/LiveCampaigns.jsx",
    "src/components/v7/home7-funding.jsx",
  ]) {
    const text = source(path);
    assert.match(text, /startJsonPolling/, path);
    assert.doesNotMatch(text, /setInterval\s*\(/, `${path} should not hand-roll visible-tab polling`);
  }
});

function fakeIntervalClock() {
  let now = 0, id = 0;
  const timers = new Map();
  const setIntervalFake = (fn, delay) => {
    const key = ++id;
    timers.set(key, { fn, delay, next: now + delay });
    return key;
  };
  const clearIntervalFake = (key) => timers.delete(key);
  const advance = async (ms) => {
    const end = now + ms;
    for (;;) {
      let nextKey = null, nextTimer = null;
      for (const [key, timer] of timers) {
        if (timer.next <= end && (!nextTimer || timer.next < nextTimer.next)) {
          nextKey = key;
          nextTimer = timer;
        }
      }
      if (!nextTimer) break;
      now = nextTimer.next;
      nextTimer.next += nextTimer.delay;
      timers.set(nextKey, nextTimer);
      await act(async () => { nextTimer.fn(); });
    }
    now = end;
  };
  return { setIntervalFake, clearIntervalFake, advance, now: () => now, count: () => timers.size };
}

test("useClientNow clears its timer while the tab is hidden and resumes on visibility", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://nexualpha.com/funding-rates" });
  const clock = fakeIntervalClock();
  const seen = [];
  const saved = {
    window: Object.getOwnPropertyDescriptor(globalThis, "window"),
    document: Object.getOwnPropertyDescriptor(globalThis, "document"),
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
    actEnv: Object.getOwnPropertyDescriptor(globalThis, "IS_REACT_ACT_ENVIRONMENT"),
    dateNow: Date.now,
  };
  const setVisibility = (state) => {
    Object.defineProperty(dom.window.document, "visibilityState", { value: state, configurable: true });
    dom.window.document.dispatchEvent(new dom.window.Event("visibilitychange"));
  };
  function Probe() {
    const now = useClientNow(true, 1000);
    seen.push(now);
    return React.createElement("span", null, now ?? "pending");
  }
  let root;
  try {
    Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true, writable: true });
    Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true, writable: true });
    Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { value: true, configurable: true, writable: true });
    globalThis.setInterval = clock.setIntervalFake;
    globalThis.clearInterval = clock.clearIntervalFake;
    Date.now = clock.now;
    setVisibility("visible");
    root = createRoot(dom.window.document.getElementById("root"));
    await act(async () => { root.render(React.createElement(Probe)); });
    assert.equal(clock.count(), 1);
    await clock.advance(1000);
    assert.ok(seen.includes(1000));
    await act(async () => { setVisibility("hidden"); });
    assert.equal(clock.count(), 0, "hidden tabs must not keep the clock interval alive");
    await clock.advance(5000);
    assert.equal(seen.at(-1), 1000);
    await act(async () => { setVisibility("visible"); });
    assert.equal(clock.count(), 1);
    assert.equal(seen.at(-1), 6000);
  } finally {
    if (root) await act(async () => root.unmount());
    globalThis.setInterval = saved.setInterval;
    globalThis.clearInterval = saved.clearInterval;
    Date.now = saved.dateNow;
    if (saved.actEnv) Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", saved.actEnv); else delete globalThis.IS_REACT_ACT_ENVIRONMENT;
    if (saved.window) Object.defineProperty(globalThis, "window", saved.window); else delete globalThis.window;
    if (saved.document) Object.defineProperty(globalThis, "document", saved.document); else delete globalThis.document;
    dom.window.close();
  }
});

test("SSR venue, regional and tokenized routes hydrate without console or recoverable errors", async () => {
  const harness = await createSsrHarness();
  try {
    for (const path of ["/ar/exchanges/okx", "/ur/exchanges/okx", "/mx?locale=es", "/tw?locale=zh-Hant", "/tr/markets/turkiye", "/topics/tokenized-assets", "/zh-hans/topics/tokenized-assets"]) {
      const pageUrl = `https://nexualpha.com${path}`;
      const url = new URL(pageUrl);
      const publicRoute = parsePublicRoute(url.pathname, url.searchParams);
      const appHtml = await harness.render(pageUrl, {});
      const metadata = await routeMetadata(url, {});
      const state = { pathname: publicRoute.contentPathname, locale: publicRoute.locale, version: "hydration-route-regression", seoAlternates: metadata.alternates };
      const alternateLinks = metadata.alternates.map(({ hreflang, href }) => `<link rel="alternate" hreflang="${hreflang}" href="${href}">`).join("");
      const document = `<!doctype html><html><head><title>Hydration regression</title>${alternateLinks}<meta name="robots" content="${metadata.robots}"></head><body><div id="root">${appHtml}</div><script type="application/json" id="nexualpha-prerender-state">${JSON.stringify(state)}</script></body></html>`;
      const result = await hydrateInJsdom(harness.vite, document, pageUrl, { timeoutMs: 800, settleMs: 20,
        inspect: (window) => [...window.document.querySelectorAll('.tokenized-assets-route-nav a[href$="/topics/tokenized-stocks-vs-perpetuals"]')].map((node) => node.textContent),
      });
      assert.deepEqual(result.errors, [], `${path}: ${result.errors.join("\n")}`);
      assert.deepEqual(hydrationErrors(result.errors), [], path);
      if (path.endsWith("/topics/tokenized-assets")) {
        assert.equal(result.inspected.length, 2, "distinct stock/perpetual decisions sharing a destination must both remain");
        assert.equal(new Set(result.inspected).size, 2, "each decision retains its own label");
      }
    }
  } finally {
    await harness.close();
  }
});

test("onsite Telegram handoff adds a fresh return expiry after hydration without SSR drift", async () => {
  const harness = await createSsrHarness();
  const { OnsiteTelegramBotHandoff } = await harness.vite.ssrLoadModule("/src/components/v3/OnsiteTelegramBotHandoff.jsx");
  const futureNow = Date.UTC(2026, 10, 1, 12, 0, 0);
  const props = {
    canonicalPath: "/compare/binance-vs-okx",
    locale: "en",
    market: "BR",
    product: "spot",
    placement: "hydration-regression-telegram",
  };
  const savedDateNow = Date.now;
  Date.now = () => futureNow;
  const ssr = renderToString(React.createElement(OnsiteTelegramBotHandoff, props));
  assert.doesNotMatch(ssr, /data-telegram-return-href=/, "SSR must not publish a stale fixed-date return href");

  const dom = new JSDOM(`<div id="root">${ssr}</div>`, { url: "https://nexualpha.com/compare/binance-vs-okx", pretendToBeVisual: true });
  const saved = {
    window: Object.getOwnPropertyDescriptor(globalThis, "window"),
    document: Object.getOwnPropertyDescriptor(globalThis, "document"),
    navigator: Object.getOwnPropertyDescriptor(globalThis, "navigator"),
    HTMLElement: Object.getOwnPropertyDescriptor(globalThis, "HTMLElement"),
    Node: Object.getOwnPropertyDescriptor(globalThis, "Node"),
    Text: Object.getOwnPropertyDescriptor(globalThis, "Text"),
    actEnv: Object.getOwnPropertyDescriptor(globalThis, "IS_REACT_ACT_ENVIRONMENT"),
  };
  const errors = [];
  const originalError = console.error;
  let root;
  try {
    Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true, writable: true });
    Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true, writable: true });
    Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true, writable: true });
    Object.defineProperty(globalThis, "HTMLElement", { value: dom.window.HTMLElement, configurable: true, writable: true });
    Object.defineProperty(globalThis, "Node", { value: dom.window.Node, configurable: true, writable: true });
    Object.defineProperty(globalThis, "Text", { value: dom.window.Text, configurable: true, writable: true });
    Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { value: true, configurable: true, writable: true });
    console.error = (...args) => errors.push(args.map(String).join(" "));
    await act(async () => {
      root = hydrateRoot(dom.window.document.getElementById("root"), React.createElement(OnsiteTelegramBotHandoff, props), {
        onRecoverableError: (error) => errors.push(`recoverable: ${error?.message || error}`),
      });
    });
    await act(async () => {});
    assert.deepEqual(hydrationErrors(errors), [], errors.join("\n"));
    const href = dom.window.document.querySelector("[data-telegram-return-href]")?.getAttribute("data-telegram-return-href");
    assert.ok(href, "hydrated handoff should publish a live return href for clicks and analytics");
    const url = new URL(href, "https://nexualpha.com");
    assert.equal(url.searchParams.get("tg_pair"), "binance-vs-okx");
    assert.equal(Number(url.searchParams.get("tg_expires")), futureNow + 7 * 24 * 60 * 60 * 1000);
    await act(async () => { root.render(React.createElement(OnsiteTelegramBotHandoff, { canonicalPath: "", locale: "en" })); });
    assert.equal(dom.window.document.querySelector("aside"), null);
    await act(async () => { root.render(React.createElement(OnsiteTelegramBotHandoff, props)); });
    assert.ok(dom.window.document.querySelector("aside"), "the same component can become eligible again without changing hook order");
    assert.deepEqual(errors, [], errors.join("\n"));
  } finally {
    if (root) await act(async () => root.unmount());
    await harness.close();
    Date.now = savedDateNow;
    console.error = originalError;
    for (const [key, descriptor] of Object.entries(saved)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
    dom.window.close();
  }
});

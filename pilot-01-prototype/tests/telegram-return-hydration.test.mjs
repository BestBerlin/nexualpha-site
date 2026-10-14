import assert from "node:assert/strict";
import test from "node:test";
import { parsePublicRoute } from "../src/data/locale-routing.js";
import { createSsrHarness, hydrateInJsdom, hydrationErrors } from "./helpers/ssr-hydration-harness.mjs";

const SSR_NOW = Date.UTC(2026, 9, 14, 12, 0, 0);
const HYDRATE_NOW = Date.UTC(2026, 10, 1, 12, 0, 0);
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function documentFor(appHtml, pageUrl) {
  const url = new URL(pageUrl);
  const publicRoute = parsePublicRoute(url.pathname, url.searchParams);
  const state = {
    pathname: publicRoute.contentPathname,
    locale: publicRoute.locale,
    version: "telegram-return-hydration-regression",
  };
  return `<!doctype html><html><head><title>Telegram return hydration</title></head><body><div id="root">${appHtml}</div><script type="application/json" id="nexualpha-prerender-state">${JSON.stringify(state)}</script></body></html>`;
}

async function renderRoute(harness, path) {
  const pageUrl = `https://nexualpha.com${path}`;
  const originalNow = Date.now;
  Date.now = () => SSR_NOW;
  try {
    const appHtml = await harness.render(pageUrl, {});
    return { pageUrl, html: documentFor(appHtml, pageUrl) };
  } finally {
    Date.now = originalNow;
  }
}

function telegramReturnHrefs(window) {
  return [...window.document.querySelectorAll("[data-telegram-return-href]")]
    .map((node) => node.getAttribute("data-telegram-return-href"))
    .filter(Boolean);
}

test("Telegram hub return hrefs are omitted for SSR and first client render, then get a fresh live TTL", async () => {
  const harness = await createSsrHarness();
  try {
    const { pageUrl, html } = await renderRoute(harness, "/telegram");
    assert.doesNotMatch(html, /data-telegram-return-href="[^"]*tg_expires=/, "SSR must not publish transient Telegram return hrefs");
    const result = await hydrateInJsdom(harness.vite, html, pageUrl, {
      fixedNow: HYDRATE_NOW,
      timeoutMs: 1000,
      settleMs: 20,
      until: (window) => telegramReturnHrefs(window).length >= 2,
      inspect: (window) => telegramReturnHrefs(window),
    });
    assert.deepEqual(result.errors, [], result.errors.join("\n"));
    assert.deepEqual(hydrationErrors(result.errors), [], result.errors.join("\n"));
    assert.ok(result.inspected.length >= 2, "hydrated Telegram hub should publish live return hrefs for bot CTAs");
    for (const href of result.inspected) {
      const url = new URL(href, pageUrl);
      assert.equal(Number(url.searchParams.get("tg_expires")), HYDRATE_NOW + SEVEN_DAYS, href);
    }
  } finally {
    await harness.close();
  }
});

test("venue registration Telegram return hrefs hydrate cleanly with a future live TTL", async () => {
  const harness = await createSsrHarness();
  try {
    const { pageUrl, html } = await renderRoute(harness, "/exchanges/coinbase");
    assert.doesNotMatch(html, /data-telegram-return-href="[^"]*tg_expires=/, "SSR must not publish transient registration-card return hrefs");
    const result = await hydrateInJsdom(harness.vite, html, pageUrl, {
      fixedNow: HYDRATE_NOW,
      timeoutMs: 1000,
      settleMs: 20,
      until: (window) => telegramReturnHrefs(window).some((href) => href.includes("tg_venue=coinbase")),
      inspect: (window) => telegramReturnHrefs(window).filter((href) => href.includes("tg_venue=coinbase")),
    });
    assert.deepEqual(result.errors, [], result.errors.join("\n"));
    assert.deepEqual(hydrationErrors(result.errors), [], result.errors.join("\n"));
    assert.ok(result.inspected.length >= 1, "hydrated venue page should publish a live Coinbase Telegram return href");
    for (const href of result.inspected) {
      const url = new URL(href, pageUrl);
      assert.equal(Number(url.searchParams.get("tg_expires")), HYDRATE_NOW + SEVEN_DAYS, href);
    }
  } finally {
    await harness.close();
  }
});

test("regional, Brazil and rates Telegram funnel surfaces share hydration-safe live return hrefs", async () => {
  const harness = await createSsrHarness();
  const cases = [
    { path: "/rates", expected: "tg_route=%2Frates" },
    { path: "/br/conta", expected: "tg_pair=binance-vs-okx" },
    { path: "/us?locale=en", expected: "tg_venue=coinbase" },
  ];
  try {
    for (const { path, expected } of cases) {
      const { pageUrl, html } = await renderRoute(harness, path);
      assert.doesNotMatch(html, /data-telegram-return-href="[^"]*tg_expires=/, `${path}: SSR must not publish transient Telegram return hrefs`);
      const result = await hydrateInJsdom(harness.vite, html, pageUrl, {
        fixedNow: HYDRATE_NOW,
        timeoutMs: 1000,
        settleMs: 20,
        until: (window) => telegramReturnHrefs(window).some((href) => href.includes(expected)),
        inspect: (window) => telegramReturnHrefs(window).filter((href) => href.includes(expected)),
      });
      assert.deepEqual(result.errors, [], `${path}: ${result.errors.join("\n")}`);
      assert.deepEqual(hydrationErrors(result.errors), [], `${path}: ${result.errors.join("\n")}`);
      assert.ok(result.inspected.length >= 1, `${path}: hydrated page should publish a matching live Telegram return href`);
      for (const href of result.inspected) {
        const url = new URL(href, pageUrl);
        assert.equal(Number(url.searchParams.get("tg_expires")), HYDRATE_NOW + SEVEN_DAYS, `${path}: ${href}`);
      }
    }
  } finally {
    await harness.close();
  }
});

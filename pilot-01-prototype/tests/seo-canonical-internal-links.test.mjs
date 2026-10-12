import assert from "node:assert/strict";
import test from "node:test";

import { scrollToHash } from "../src/data/browser-state.js";
import { appendFragmentContext, contextualHref } from "../src/data/contextual-href.js";
import { decisionContextSearchFromUrl, readDecisionPassport } from "../src/data/decision-passport.js";
import { localizedHref } from "../src/data/locale-routing.js";
import { createSsrHarness, decodeEntities, hydrateInJsdom, hydrationErrors } from "./helpers/ssr-hydration-harness.mjs";

function anchorHrefs(html) {
  return [...html.matchAll(/<a\b[^>]*\shref="([^"]*)"/g)].map((match) => decodeEntities(match[1]));
}

function internalUrl(href) {
  const url = new URL(href, "https://nexualpha.com");
  return url.origin === "https://nexualpha.com" && !url.pathname.startsWith("/go/") ? url : null;
}

function hydrationDocument(fragment, state) {
  return `<!doctype html><html><head><title>NexuAlpha</title></head><body><div id="root">${fragment}</div><script type="application/json" id="nexualpha-prerender-state">${JSON.stringify(state)}</script></body></html>`;
}

async function withFixedNow(now, fn) {
  const originalDateNow = Date.now;
  Date.now = () => now;
  try {
    return await fn();
  } finally {
    Date.now = originalDateNow;
  }
}

function assertCleanInternalAnchors(html, label) {
  for (const href of anchorHrefs(html)) {
    const url = internalUrl(href);
    if (!url) continue;
    assert.equal(url.search, "", `${label}: ${href} carries internal query state`);
  }
}

test("canonical href helpers drop crawl-state params and normalize reverse compare pairs", () => {
  assert.equal(localizedHref("/compare/okx-vs-binance?market=BR&product=spot&utm_source=card", { locale: "fr" }), "/fr/compare/binance-vs-okx#nxa-context?market=BR&product=spot&utm_source=card");
  assert.equal(localizedHref("/exchanges/binance", { locale: "en", market: "BR", product: "spot" }), "/exchanges/binance#nxa-context?market=BR&product=spot");
  assert.equal(contextualHref("/exchanges/binance#registration-path", { locale: "en", market: "BR", product: "spot" }), "/exchanges/binance#registration-path?market=BR&product=spot");
  assert.equal(appendFragmentContext("/compare/binance-vs-okx", { market: "BR", product: "spot" }), "/compare/binance-vs-okx#nxa-context?market=BR&product=spot");
});

test("hash scrolling ignores fragment context after the section id", () => {
  let opened = false;
  let scrolled = false;
  const target = {
    tagName: "SPAN",
    parentElement: {
      tagName: "DETAILS",
      set open(value) { opened = value; },
      parentElement: null,
    },
    scrollIntoView() { scrolled = true; },
  };
  const doc = { getElementById: (id) => (id === "registration-path" ? target : null) };
  assert.equal(scrollToHash(doc, "#registration-path?market=BR&product=spot"), true);
  assert.equal(opened, true);
  assert.equal(scrolled, true);
});

test("browser URL fragment context round-trips into decision readers", () => {
  const href = contextualHref("/exchanges/binance#registration-path", { locale: "en", market: "BR", product: "spot" });
  const sourceSearch = decisionContextSearchFromUrl(`https://nexualpha.com${href}`);
  assert.equal(sourceSearch, "?market=BR&product=spot");
  assert.deepEqual(readDecisionPassport(sourceSearch), { market: "BR", product: "spot" });
});

test("calculator locale links keep canonical hrefs and move display locale into fragment context", () => {
  assert.equal(localizedHref("/embed/calculator", { locale: "ja" }), "/embed/calculator#nxa-context?locale=ja");
  assert.equal(localizedHref("/embed/calculator?locale=ko", { locale: "ko" }), "/embed/calculator#nxa-context?locale=ko");
  const params = new URLSearchParams(decisionContextSearchFromUrl("https://nexualpha.com/embed/calculator#nxa-context?locale=ja&market=BR&product=spot"));
  assert.equal(params.get("locale"), "ja");
  assert.equal(params.get("market"), "BR");
  assert.equal(params.get("product"), "spot");
});

test("SSR home, venue, compare, news and Brazil state anchors do not emit crawl-state query params", { timeout: 120_000 }, async (t) => {
  const harness = await createSsrHarness();
  t.after(() => harness.close());
  const routes = [
    ["/?market=BR&product=spot&utm_source=home", "home"],
    ["/exchanges/binance?market=BR&product=spot&utm_source=venue", "venue"],
    ["/compare/okx-vs-binance?market=BR&product=spot&utm_source=compare", "compare"],
    ["/news?market=BR&product=spot&utm_source=news", "news"],
    ["/br?locale=pt-BR&market=BR&product=spot&platform=binance&amount=1000&spot_fee_bps=10&deposit_fee_pct=0&deposit_fixed_brl=0", "brazil-home"],
    ["/br/comparar?locale=pt-BR&market=BR&product=spot&platform=okx&amount=2500&spot_fee_bps=8&deposit_fee_pct=0.5&deposit_fixed_brl=2", "brazil-compare"],
  ];
  for (const [url, label] of routes) {
    const html = await harness.render(`https://nexualpha.com${url}`);
    assertCleanInternalAnchors(html, label);
    if (label === "compare") {
      assert.equal(anchorHrefs(html).some((href) => href.includes("/compare/okx-vs-binance")), false, "reverse compare href is absent");
      assert.equal(anchorHrefs(html).some((href) => href.includes("/compare/binance-vs-okx")), true, "canonical compare href is present");
    }
  }
});

test("browser fragments restore decision and calculator context after canonical SSR hydration", { timeout: 120_000 }, async (t) => {
  const harness = await createSsrHarness();
  t.after(() => harness.close());

  const fixedNow = Date.UTC(2026, 9, 12, 0, 0, 0);
  const homeHtml = hydrationDocument(await withFixedNow(fixedNow, () => harness.render("https://nexualpha.com/")), { pathname: "/", locale: "en" });
  const homeHydration = await hydrateInJsdom(
    harness.vite,
    homeHtml,
    "https://nexualpha.com/#nxa-context?market=BR&product=spot",
    {
      browserUrlAsWindowUrl: true,
      timeoutMs: 700,
      fixedNow,
      inspect: (window) => ({
        languageHref: window.document.querySelector(".nx-lang__list a[hreflang='pt-BR']")?.getAttribute("href") || "",
      }),
    },
  );
  assert.deepEqual(hydrationErrors(homeHydration.errors), []);
  assert.equal(homeHydration.bootstrap.initialUrl, "https://nexualpha.com/?locale=en");
  assert.equal(homeHydration.inspected.languageHref, "/pt-br#nxa-context?market=BR&product=spot");

  const calculatorHtml = hydrationDocument(await withFixedNow(fixedNow, () => harness.render("https://nexualpha.com/embed/calculator")), { pathname: "/embed/calculator", locale: "en" });
  const calculatorHydration = await hydrateInJsdom(
    harness.vite,
    calculatorHtml,
    "https://nexualpha.com/embed/calculator#nxa-context?locale=ja&market=BR&product=spot&scenario=fees&venue=okx&instrument=spot&order=taker&volume=5000",
    {
      browserUrlAsWindowUrl: true,
      timeoutMs: 700,
      fixedNow,
      inspect: (window) => ({
        lang: window.document.documentElement.lang,
        href: window.location.href,
        market: window.document.querySelector("[data-growth-market]")?.getAttribute("data-growth-market"),
        product: window.document.querySelector("[data-growth-product]")?.getAttribute("data-growth-product"),
        volumeTier: window.document.querySelector(".bleed-slider")?.value,
        spotSelected: window.document.querySelectorAll(".bleed-type-btn")[1]?.classList.contains("bleed-type-btn--active"),
      }),
    },
  );
  assert.deepEqual(hydrationErrors(calculatorHydration.errors), []);
  assert.equal(calculatorHydration.bootstrap.initialUrl, "https://nexualpha.com/embed/calculator?locale=en");
  assert.equal(calculatorHydration.inspected.lang, "ja");
  assert.equal(calculatorHydration.inspected.market, "BR", JSON.stringify(calculatorHydration.inspected));
  assert.equal(calculatorHydration.inspected.product, "spot");
  assert.equal(calculatorHydration.inspected.volumeTier, "0");
  assert.equal(calculatorHydration.inspected.spotSelected, true);
  assert.match(calculatorHydration.inspected.href, /#nxa-context\?locale=ja&market=BR&product=spot&scenario=fees&venue=okx&instrument=spot&order=taker&volume=5000$/);
});

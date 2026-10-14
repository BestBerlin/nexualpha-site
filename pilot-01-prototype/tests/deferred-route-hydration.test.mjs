// Perf-fixes regression: route support islands are SSR-visible but client-lazy. The SSR and client wrappers must both
// include the same Suspense markers, otherwise hydration replaces the server HTML before the lazy gate opens.
import assert from "node:assert/strict";
import test from "node:test";
import { createSsrHarness, hydrateInJsdom, hydrationErrors } from "./helpers/ssr-hydration-harness.mjs";

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

function releasingIntersectionObserver({ releaseAfterMs = 120 } = {}) {
  let observed = 0;
  let released = 0;
  class ReleasingIntersectionObserver {
    constructor(callback) {
      this.callback = callback;
      this.elements = [];
      setTimeout(() => {
        if (!this.elements.length) return;
        released += this.elements.length;
        callback(this.elements.map((target) => ({
          target,
          isIntersecting: true,
          boundingClientRect: { bottom: 120 },
        })));
      }, releaseAfterMs);
    }
    observe(element) {
      observed += 1;
      this.elements.push(element);
    }
    unobserve(element) {
      this.elements = this.elements.filter((candidate) => candidate !== element);
    }
    disconnect() {
      this.elements = [];
    }
    takeRecords() {
      return [];
    }
  }
  return { IntersectionObserver: ReleasingIntersectionObserver, stats: () => ({ observed, released }) };
}

const routeCases = [
  {
    name: "venue-binance",
    url: "https://nexualpha.com/exchanges/binance",
    requiredHtml: [
      /id="quick-answers"/,
      /class="[^"]*v3-venue-coins/,
      /data-telegram-alerts-strip="venue-telegram-alerts"/,
    ],
    selectors: [
      "#quick-answers",
      ".v3-venue-coins",
      '[data-telegram-alerts-strip="venue-telegram-alerts"]',
    ],
  },
  {
    name: "venue-hyperliquid-keywords",
    url: "https://nexualpha.com/exchanges/hyperliquid",
    requiredHtml: [
      /data-keyword-section="hyperliquid"/,
    ],
    selectors: [
      '[data-keyword-section="hyperliquid"]',
    ],
  },
  {
    name: "compare-hub",
    url: "https://nexualpha.com/compare",
    requiredHtml: [
      /class="[^"]*compare-any/,
      /id="country-scorecards"/,
    ],
    selectors: [
      ".compare-any",
      "#country-scorecards",
    ],
  },
];

test("venue and compare lazy route sections hydrate without replacing SSR HTML while IO is held then released", async () => {
  for (const route of routeCases) {
    const fragment = await harness.render(route.url);
    for (const pattern of route.requiredHtml) assert.match(fragment, pattern, `${route.name}: SSR renders ${pattern}`);
    const document = `<!doctype html><html><head><title>${route.name}</title></head><body><div id="root">${fragment}</div></body></html>`;
    const gate = releasingIntersectionObserver({ releaseAfterMs: 120 });
    const hydrated = await hydrateInJsdom(harness.vite, document, route.url, {
      timeoutMs: 1000,
      intersectionObserver: gate.IntersectionObserver,
      inspect: (window) => Object.fromEntries(route.selectors.map((selector) => {
        const element = window.document.querySelector(selector);
        return [selector, {
          present: Boolean(element),
          textLength: (element?.textContent || "").replace(/\s+/g, " ").trim().length,
        }];
      })),
    });
    assert.deepEqual(hydrationErrors(hydrated.errors), [], `${route.name}: ${hydrated.errors.join("\n")}`);
    const stats = gate.stats();
    assert.ok(stats.observed >= route.selectors.length, `${route.name}: lazy targets observed (${JSON.stringify(stats)})`);
    assert.ok(stats.released >= route.selectors.length, `${route.name}: lazy targets released (${JSON.stringify(stats)})`);
    for (const selector of route.selectors) {
      assert.equal(hydrated.inspected[selector].present, true, `${route.name}: ${selector} remains after hydration`);
      assert.ok(hydrated.inspected[selector].textLength > 20, `${route.name}: ${selector} keeps SSR content`);
    }
  }
});

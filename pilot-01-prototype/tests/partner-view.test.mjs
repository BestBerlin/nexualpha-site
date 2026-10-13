import test from "node:test";
import assert from "node:assert/strict";
import { installPartnerViewPropagation, partnerGoHref, partnerViewContext, rewritePartnerViewHtml, venueGoHref } from "../src/data/partner-view.js";

const registry = Object.freeze([
  { id: "alpha_01", name: "Alpha", locales: ["en", "zh-Hans"], codes: { okx: "SUBOKX" } },
]);

test("partner view accepts only known partner IDs in promotable locales", () => {
  assert.equal(partnerViewContext("https://nexualpha.com/exchanges?p=alpha_01&locale=en", { registry })?.id, "alpha_01");
  assert.equal(partnerViewContext("https://nexualpha.com/exchanges?p=alpha_01&locale=ru", { registry }), null);
  assert.equal(partnerViewContext("https://nexualpha.com/exchanges?p=missing&locale=en", { registry }), null);
  assert.equal(partnerViewContext("https://nexualpha.com/exchanges?p=<script>&locale=en", { registry }), null);
});

test("partner view rewrites only /go links and registration CTAs with p plus locale", () => {
  const context = partnerViewContext("https://nexualpha.com/exchanges?p=alpha_01&locale=zh-Hans", { registry });
  assert.equal(partnerGoHref("/go/okx?src=card", context), "/go/okx?src=card&p=alpha_01&locale=zh-Hans");
  assert.equal(venueGoHref("okx", context, { src: "profile-card" }), "/go/okx?p=alpha_01&locale=zh-Hans&src=profile-card");
  assert.equal(venueGoHref("coinbase", context), null);
  assert.equal(partnerGoHref("https://example.com/go/okx", context), "https://example.com/go/okx");
});

test("SSR partner view carries p on /go anchors and converts direct registration CTAs", () => {
  const html = '<a href="/go/okx?src=hero">OKX</a><a data-cta-kind="registration" data-cta-platform="bybit" data-cta-placement="card" href="https://www.bybit.com/register?affiliate_id=48553">Bybit</a><a href="/exchanges/okx">Profile</a>';
  const rewritten = rewritePartnerViewHtml(html, "https://nexualpha.com/exchanges?p=alpha_01&locale=en", { registry });
  assert.match(rewritten, /href="\/go\/okx\?src=hero&amp;p=alpha_01&amp;locale=en"/);
  assert.match(rewritten, /href="\/go\/bybit\?p=alpha_01&amp;locale=en&amp;src=card"/);
  assert.match(rewritten, /href="\/exchanges\/okx"/);
});

test("browser propagation covers deferred anchors and direct registration CTAs", () => {
  const anchors = [];
  const listeners = new Map();
  const root = {
    nodeType: 1,
    matches: () => false,
    querySelectorAll: () => anchors,
  };
  const doc = {
    documentElement: root,
    addEventListener: (type, handler) => listeners.set(type, handler),
    removeEventListener: () => {},
    querySelectorAll: () => anchors,
  };
  const win = {
    location: { href: "https://nexualpha.com/exchanges?p=alpha_01&locale=en" },
  };
  globalThis.MutationObserver = class {
    constructor(callback) { this.callback = callback; }
    observe() {}
    disconnect() {}
  };
  function anchor(attrs) {
    return {
      attrs: { ...attrs },
      dataset: attrs.dataset || {},
      getAttribute(name) { return this.attrs[name]; },
      setAttribute(name, value) { this.attrs[name] = value; },
      matches(selector) { return selector === "a[href]"; },
      querySelectorAll() { return []; },
      closest() { return this; },
    };
  }
  const first = anchor({ href: "/go/okx?src=hero" });
  anchors.push(first);
  installPartnerViewPropagation({ window: win, document: doc, registry });
  assert.equal(first.attrs.href, "/go/okx?src=hero&p=alpha_01&locale=en");
  const later = anchor({ href: "https://www.okx.com/join/nexu888", dataset: { ctaKind: "registration", ctaPlatform: "okx", ctaPlacement: "late-card" } });
  listeners.get("click")({ target: later });
  assert.equal(later.attrs.href, "/go/okx?p=alpha_01&locale=en&src=late-card");
});

test("legacy locale redirect preserves sanitized partner query attribution", async () => {
  const { legacyLocaleRedirect } = await import("../src/data/locale-routing.js");
  const result = legacyLocaleRedirect(new URL("https://nexualpha.com/exchanges?locale=zh-Hans&p=alpha_01&src=community"));
  assert.match(String(result), /p=alpha_01/);
  assert.match(String(result), /src=community/);
  assert.doesNotMatch(String(legacyLocaleRedirect(new URL("https://nexualpha.com/exchanges?locale=zh-Hans&p=%3Cscript%3E"))), /script/);
});

test("Worker legacy locale redirect retains partner query attribution", async () => {
  const { default: worker } = await import("../worker/index.js");
  const response = await worker.fetch(new Request("https://nexualpha.com/exchanges?locale=zh-Hans&p=alpha_01&src=community"), {});
  assert.equal(response.status, 308);
  assert.match(response.headers.get("location"), /p=alpha_01/);
  assert.match(response.headers.get("location"), /src=community/);
});

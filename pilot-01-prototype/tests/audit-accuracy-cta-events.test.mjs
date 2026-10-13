import assert from "node:assert/strict";
import test from "node:test";

import { EVENT_SOURCE_STATES, eventSourceStateLabel, sharedOfficialEventItems, visibleEventSourceItems } from "../src/data/event-source.js";
import { homeSignupLabel } from "../src/data/home-cta-label.js";
import { H7_COPY } from "../src/components/v7/home7-copy.js";

const now = Date.parse("2026-10-13T12:00:00.000Z");
const approved = {
  id: "okx-approved",
  kind: "event",
  venue: "okx",
  platform: { slug: "okx", name: "OKX" },
  title: "OKX current event",
  officialSource: { type: "OFFICIAL_PRODUCT_NOTICE", url: "https://www.okx.com/help/current-event" },
  discoveredAt: "2026-10-13T08:00:00.000Z",
  verifiedAt: "2026-10-13T09:00:00.000Z",
  expiresAt: "2026-10-14T00:00:00.000Z",
  reviewStatus: "APPROVED",
  fixture: false,
};

test("home CTA copy stops promising rebate when the rebate share is pending while retaining the code carrier", () => {
  const pending = { slug: "bybit", name: "Bybit", share: null, code: "48553", open: true };
  const verified = { slug: "okx", name: "OKX", share: 0.4, code: "nexu888", open: true };
  assert.equal(homeSignupLabel(H7_COPY.en, pending), "Sign up on Bybit");
  assert.equal(homeSignupLabel(H7_COPY.en, verified), "Sign up, get rebate");
  assert.equal(homeSignupLabel(H7_COPY.en, { ...pending, open: false }), H7_COPY.en.detail);
});

test("shared event source distinguishes current, pending review, regional unavailable and no-news states", () => {
  assert.deepEqual(visibleEventSourceItems([approved], { locale: "en", venue: "okx", now }).items, [approved]);
  assert.equal(visibleEventSourceItems([{ ...approved, id: "pending", reviewStatus: "PENDING" }], { locale: "en", venue: "okx", now }).state, EVENT_SOURCE_STATES.PENDING_REVIEW);
  assert.equal(visibleEventSourceItems([{ ...approved, venue: "bitget", platform: { slug: "bitget", name: "Bitget" } }], { locale: "tr", venue: "bitget", now }).state, EVENT_SOURCE_STATES.REGION_UNAVAILABLE);
  assert.equal(visibleEventSourceItems([{ ...approved, id: "expired", expiresAt: "2026-10-12T00:00:00.000Z" }], { locale: "en", venue: "okx", now }).state, EVENT_SOURCE_STATES.NO_NEWS);
  assert.equal(visibleEventSourceItems([approved], { locale: "en", venue: "binance", now }).state, EVENT_SOURCE_STATES.NO_NEWS);
  assert.match(eventSourceStateLabel(EVENT_SOURCE_STATES.PENDING_REVIEW, "en"), /pending review/i);
});

test("event state labels exist for every supported public locale", () => {
  for (const locale of ["en", "zh-Hans", "zh-Hant", "ja", "ko", "tr", "ar", "es", "pt-BR", "fr", "de", "ru", "id", "vi", "it", "ur", "uk"]) {
    if (locale === "en") assert.equal(eventSourceStateLabel(EVENT_SOURCE_STATES.NO_NEWS, locale), eventSourceStateLabel(EVENT_SOURCE_STATES.NO_NEWS, "xx"));
    else assert.notEqual(eventSourceStateLabel(EVENT_SOURCE_STATES.NO_NEWS, locale), eventSourceStateLabel(EVENT_SOURCE_STATES.NO_NEWS, "xx"), `${locale} has localized no-news copy`);
    assert.ok(eventSourceStateLabel(EVENT_SOURCE_STATES.PENDING_REVIEW, locale));
    assert.ok(eventSourceStateLabel(EVENT_SOURCE_STATES.REGION_UNAVAILABLE, locale));
  }
});

test("shared official event feed keeps the home, compare and profile source filter identical", () => {
  const feed = { items: [{ id: "okx:https://www.okx.com/help/current-event", venue: "okx", category: "event", title: "OKX current event", url: "https://www.okx.com/help/current-event", publishedAt: "2026-10-13T08:00:00.000Z" }] };
  assert.equal(sharedOfficialEventItems(feed, { now }).length, 1);
  assert.equal(sharedOfficialEventItems({ items: [{ ...feed.items[0], url: "https://example.com/not-official" }] }, { now }).length, 0);
});

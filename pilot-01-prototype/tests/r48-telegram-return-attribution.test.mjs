import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { summarize } from "../server/growth-report.mjs";
import { firstTouchSource } from "../src/data/cta-analytics.js";
import {
  buildTelegramReturnContext,
  readTelegramReturnContext,
} from "../src/data/telegram-decision-return.js";

const NOW = Date.UTC(2026, 8, 29, 12, 0, 0);

function pageView(source) {
  return {
    version: 2,
    type: "page_view",
    eventId: randomUUID(),
    session: randomUUID(),
    page: "/exchanges/bitget",
    locale: "pt-BR",
    source,
    market: "BR",
    product: "spot",
    device: "mobile",
  };
}

test("validated Telegram return URLs carry a fixed anonymous source attribution", () => {
  const context = buildTelegramReturnContext({
    venue: "bitget",
    market: "BR",
    product: "spot",
    locale: "pt-BR",
    campaign: "r48_return_attribution",
    now: NOW,
  });
  const url = new URL(context.href, "https://nexualpha.com");

  assert.equal(context.status, "restored");
  assert.equal(url.searchParams.get("utm_source"), "telegram");
  assert.equal(url.searchParams.get("tg_return"), "bot");
  assert.equal(firstTouchSource({ search: url.search }), "telegram");

  const report = summarize([pageView(firstTouchSource({ search: url.search }))]);
  assert.equal(report.onsiteJourney.telegramReturn.sessions, 1);
  assert.equal(report.onsiteJourney.stages.find((stage) => stage.id === "telegram_return").sessions, 1);
  assert.equal(report.totals.confirmedRegistrations, null);
  assert.deepEqual(report.partnerSideOutcomes, {
    registrations: null,
    kyc: null,
    deposits: null,
    trades: null,
    commissions: null,
    status: "UNAVAILABLE",
    reason: "No official partner API, webhook or reviewed private import is connected to this first-party CTA report.",
  });
});

test("expired, tampered and duplicated return contexts never receive Telegram source attribution", () => {
  const invalidSearches = [
    `?tg_return=bot&tg_venue=bitget&tg_expires=${NOW - 1}`,
    `?tg_return=bot&tg_venue=unknown-venue&tg_expires=${NOW + 60_000}`,
    `?tg_return=bot&tg_venue=bitget&tg_venue=okx&tg_expires=${NOW + 60_000}`,
    `?tg_return=other&tg_venue=bitget&tg_expires=${NOW + 60_000}`,
  ];

  for (const search of invalidSearches) {
    const context = readTelegramReturnContext(search, { now: NOW });
    const url = new URL(context.href, "https://nexualpha.com");
    assert.equal(context.status, "fallback", search);
    assert.equal(url.searchParams.has("utm_source"), false, search);
    assert.notEqual(firstTouchSource({ search: url.search }), "telegram", search);
  }
});

test("an unvalidated tg_return parameter alone cannot upgrade a visit to Telegram source", () => {
  const source = firstTouchSource({
    search: `?tg_return=bot&tg_venue=bitget&tg_expires=${NOW + 60_000}`,
  });
  assert.equal(source, "direct");

  const report = summarize([pageView(source)]);
  assert.equal(report.onsiteJourney.telegramReturn.sessions, 0);
  assert.equal(report.totals.confirmedRegistrations, null);
  assert.equal(report.partnerSideOutcomes.commissions, null);
});

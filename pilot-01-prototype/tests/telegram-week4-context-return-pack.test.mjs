import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  TELEGRAM_WEEK4_CONTEXT_RETURN_PACK,
  getTelegramDeepLink,
  validateTelegramWeek4ContextReturnPackUrls,
} from "../src/data/telegram-config.js";
import {
  buildTelegramReturnContext,
  readTelegramReturnContext,
} from "../src/data/telegram-decision-return.js";

const NOW = Date.UTC(2026, 8, 29, 12, 0, 0);
const EXPECTED_PARTNER_HASH = "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a";
const rawExchangeRegistrationUrl =
  /accounts\.binance\.com|bsmkweb\.cc|partner\.bitget|bitget\.com\/(?:expressly|register|referral|signup)|okx\.com\/(?:join|register|referral)|topzhjdgxcb|backpack\.exchange\/join/i;
const inviteMaterial = /11350287|nexu888|luckybitcoin|LUCKX|CANDY007|INS898|1836370407|NEXU888/i;

const evidence = JSON.parse(
  await readFile(new URL("../docs/evidence/telegram-week4-context-return-review-pack-20260929.json", import.meta.url), "utf8"),
);
const markdown = await readFile(
  new URL("../docs/strategy/telegram-week4-context-return-review-pack-20260929.md", import.meta.url),
  "utf8",
);

test("Week4 Telegram context return pack is a 14-day manual-only contract", () => {
  assert.equal(TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.status, "manual_review_pack_only");
  assert.equal(TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.cadenceDays, 14);
  assert.equal(TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.slots.length, 14);
  assert.deepEqual(
    TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.slots.map((slot) => slot.day),
    Array.from({ length: 14 }, (_, index) => index + 1),
  );
  assert.equal(new Set(TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.slots.map((slot) => slot.id)).size, 14);

  assert.equal(TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.safetyBoundary.noTelegramApiCall, true);
  assert.equal(TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.safetyBoundary.noTelegramMessagesSent, true);
  assert.equal(TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.safetyBoundary.noExternalSubmission, true);
  assert.equal(TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.safetyBoundary.noPartnerRegistryEdit, true);
  assert.equal(TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.safetyBoundary.noRawExchangeRegistrationLinks, true);
  assert.deepEqual(TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.reviewWindows, ["24h", "7d"]);

  const serialized = JSON.stringify(TELEGRAM_WEEK4_CONTEXT_RETURN_PACK);
  assert.doesNotMatch(serialized, rawExchangeRegistrationUrl);
  assert.doesNotMatch(serialized, inviteMaterial);
  assert.doesNotMatch(serialized, /guaranteed signup|guaranteed rebate|commission payout|commission rate/i);
});

test("Week4 Telegram slots restore anonymous route, venue and comparison context", () => {
  const byType = { regional: 0, venue: 0, compare: 0 };
  for (const slot of TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.slots) {
    byType[slot.type] += 1;
    const context = buildTelegramReturnContext({ ...slot.returnContext, now: NOW });
    const url = new URL(context.href, "https://nexualpha.com");
    const restored = readTelegramReturnContext(url.search, { now: NOW });

    assert.equal(context.status, "restored", slot.id);
    assert.equal(restored.status, "restored", slot.id);
    assert.equal(restored.market, slot.market, slot.id);
    assert.equal(restored.locale, slot.locale, slot.id);
    assert.equal(restored.product, slot.product, slot.id);
    assert.equal(restored.campaign, slot.returnContext.campaign, slot.id);
    assert.equal(restored.webOnly, false, slot.id);

    for (const param of TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.requiredReturnParams) {
      assert.ok(url.searchParams.get(param), `${slot.id} missing ${param}`);
    }
    assert.equal(url.searchParams.has("referral"), false, slot.id);
    assert.equal(url.searchParams.has("inviteCode"), false, slot.id);
    assert.doesNotMatch(url.href, rawExchangeRegistrationUrl, slot.id);
    assert.doesNotMatch(url.href, inviteMaterial, slot.id);

    if (slot.type === "regional") {
      assert.equal(restored.object.kind, "route", slot.id);
      assert.ok(restored.object.route.startsWith("/"), slot.id);
    }
    if (slot.type === "venue") {
      assert.equal(restored.object.kind, "venue", slot.id);
    }
    if (slot.type === "compare") {
      assert.equal(restored.object.kind, "pair", slot.id);
    }

    const botDeepLink = getTelegramDeepLink(slot.botDeepLinkAction);
    assert.match(botDeepLink, /^https:\/\/t\.me\/NexuAlphaAssistantBot\?start=/, slot.id);
    assert.match(slot.firstOnsiteRoute, /^\//, slot.id);
    assert.doesNotMatch(slot.firstOnsiteRoute, /^\/\//, slot.id);
  }

  assert.equal(byType.regional, 11);
  assert.equal(byType.venue, 2);
  assert.equal(byType.compare, 1);
});

test("Week4 Telegram return pack automatically accepts first onsite route and return URL alignment", () => {
  const result = validateTelegramWeek4ContextReturnPackUrls({ now: NOW });

  assert.equal(result.status, "PASS_TELEGRAM_WEEK4_RETURN_URLS");
  assert.equal(result.checkedSlots, TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.slots.length);
  assert.equal(result.telegramApiCalls, 0);
  assert.equal(result.telegramMessagesSent, 0);
  assert.equal(result.externalSubmissions, 0);
  assert.equal(result.anonymousOnly, true);
  assert.deepEqual(result.problems, []);
  assert.equal(result.checks.every((check) => check.pass), true);

  for (const check of result.checks) {
    const slot = TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.slots.find((item) => item.id === check.id);
    assert.ok(slot, check.id);
    assert.equal(check.pass, true, check.id);
    assert.equal(new URL(check.firstOnsiteRoute, "https://nexualpha.com").origin, "https://nexualpha.com", check.id);
    assert.equal(new URL(check.generatedReturnHref, "https://nexualpha.com").origin, "https://nexualpha.com", check.id);
    assert.equal(check.market, slot.market, check.id);
    assert.equal(check.locale, slot.locale, check.id);
    assert.equal(check.product, slot.product, check.id);
    assert.equal(check.campaign, slot.returnContext.campaign, check.id);
  }

  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, rawExchangeRegistrationUrl);
  assert.doesNotMatch(serialized, inviteMaterial);
  assert.doesNotMatch(serialized, /Telegram API sent|message sent|commission payout|guaranteed signup/i);
});

test("Week4 Telegram return pack validator reports route drift without external calls", () => {
  const brokenPack = {
    ...TELEGRAM_WEEK4_CONTEXT_RETURN_PACK,
    slots: TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.slots.map((slot, index) => index === 0
      ? { ...slot, firstOnsiteRoute: "/br?locale=pt-BR&market=BR&product=spot" }
      : slot),
  };
  const result = validateTelegramWeek4ContextReturnPackUrls({ pack: brokenPack, now: NOW });

  assert.equal(result.status, "FAIL_TELEGRAM_WEEK4_RETURN_URLS");
  assert.equal(result.telegramApiCalls, 0);
  assert.equal(result.telegramMessagesSent, 0);
  assert.equal(result.problems.length, 1);
  assert.equal(result.problems[0].id, "mx-spei-account-readiness");
  assert.equal(result.problems[0].routeMatches, false);
});

test("Week4 review artifacts match the code contract and stay operator-only", () => {
  assert.equal(evidence.status, "PASS_MANUAL_REVIEW_PACK_ONLY");
  assert.equal(evidence.scope.cadenceDays, TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.cadenceDays);
  assert.equal(evidence.scope.selectedSlotCount, TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.slots.length);
  assert.equal(evidence.scope.telegramApiCalls, 0);
  assert.equal(evidence.scope.telegramMessagesSent, 0);
  assert.equal(evidence.scope.externalSubmissions, 0);
  assert.equal(evidence.scope.partnerRegistryEdited, false);
  assert.equal(evidence.scope.anonymousOnly, true);
  assert.deepEqual(evidence.requiredReturnParams, TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.requiredReturnParams);
  assert.deepEqual(evidence.reviewWindows, TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.reviewWindows);
  assert.deepEqual(evidence.anonymousMetrics, TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.anonymousMetrics);

  assert.deepEqual(
    evidence.slots.map((slot) => slot.id),
    TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.slots.map((slot) => slot.id),
  );
  assert.deepEqual(
    evidence.slots.map((slot) => slot.firstOnsiteRoute),
    TELEGRAM_WEEK4_CONTEXT_RETURN_PACK.slots.map((slot) => slot.firstOnsiteRoute),
  );

  const serialized = `${JSON.stringify(evidence)}\n${markdown}`;
  assert.doesNotMatch(serialized, rawExchangeRegistrationUrl);
  assert.doesNotMatch(serialized, inviteMaterial);
  assert.doesNotMatch(serialized, /Telegram API sent|message sent|commission payout|guaranteed signup/i);
  assert.match(markdown, /Use the onsite URL first in every manual post/);
});

test("Week4 Telegram regional route context rejects unsafe paths and preserves invite registry hash", async () => {
  for (const unsafeRoute of [
    "https://evil.example/mx",
    "//evil.example/mx",
    "/admin",
    "/exchanges/bitget",
    "/mx/../../secret",
  ]) {
    const context = buildTelegramReturnContext({
      route: unsafeRoute,
      market: "MX",
      locale: "es",
      product: "spot",
      campaign: "week4_unsafe_route_test",
      now: NOW,
    });
    assert.equal(context.object.kind, "hub", unsafeRoute);
    assert.match(context.href, /^\/(?:[a-z]{2}\/)?telegram\?/, unsafeRoute);
  }

  const partnerRegistry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
  assert.equal(createHash("sha256").update(partnerRegistry).digest("hex"), EXPECTED_PARTNER_HASH);
});

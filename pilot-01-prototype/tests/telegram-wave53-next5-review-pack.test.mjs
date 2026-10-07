import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createHash } from "node:crypto";

const evidence = JSON.parse(
  await readFile(new URL("../docs/evidence/telegram-wave53-next5-review-pack-20260916.json", import.meta.url), "utf8"),
);
const markdown = await readFile(
  new URL("../docs/strategy/telegram-wave53-next5-review-pack-20260916.md", import.meta.url),
  "utf8",
);
const partnerRegistry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));

const rawExchangeRegistrationUrl =
  /accounts\.binance\.com|bsmkweb\.cc|partner\.bitget|bitget\.com\/(expressly|register|referral|signup)|okx\.com\/(join|register|referral)|topzhjdgxcb|backpack\.exchange\/join/i;

test("Wave53 Telegram next-five pack keeps the queue manual-only and NexuAlpha-first", () => {
  assert.equal(evidence.status, "PASS_MANUAL_REVIEW_PACK_ONLY");
  assert.equal(evidence.scope.selectedDraftCount, 5);
  assert.equal(evidence.scope.newDraftsAdded, 0);
  assert.equal(evidence.scope.telegramApiCalls, 0);
  assert.equal(evidence.scope.telegramMessagesSent, 0);
  assert.equal(evidence.scope.externalSubmissions, 0);
  assert.equal(evidence.scope.partnerRegistryEdited, false);

  assert.deepEqual(evidence.nextFive.map((item) => item.wave51Rank), [6, 7, 8, 9, 10]);
  assert.deepEqual(evidence.nextFive.map((item) => item.draftId), [
    "aerodrome-base-pool-en",
    "hyperliquid-latest-news-en",
    "jupiter-swap-route-en",
    "compare-bybit-vs-bitget-en",
    "bybit-bitget-stock-exposure-en",
  ]);

  for (const item of evidence.nextFive) {
    const url = new URL(item.canonicalBacklink);
    assert.equal(url.origin, "https://nexualpha.com");
    for (const param of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "tg_market",
      "tg_locale",
      "tg_product",
      "tg_funnel",
      "tg_intent",
      "tg_theme",
      "tg_draft",
    ]) {
      assert.ok(url.searchParams.get(param), `${item.draftId} missing ${param}`);
    }
    assert.ok(item.shortCopy.includes("[onsite URL]"));
    assert.ok(item.longCopy.includes("[onsite URL]"));
    assert.ok(item.riskBoundary.length > 40);
    assert.ok(item.sendBeforeCheck.length >= 3);
  }

  assert.doesNotMatch(JSON.stringify(evidence), rawExchangeRegistrationUrl);
  assert.doesNotMatch(markdown, rawExchangeRegistrationUrl);
});

test("Wave53 live-link evidence and protected invitation registry invariant are recorded", () => {
  assert.equal(evidence.liveFirstPartyLinkValidation.checkedUrlCount, 5);
  assert.equal(evidence.liveFirstPartyLinkValidation.okUrlCount, 5);
  assert.equal(evidence.liveFirstPartyLinkValidation.failedUrlCount, 0);
  assert.equal(evidence.liveFirstPartyLinkValidation.rawExchangeRegistrationUrlCount, 0);
  for (const result of evidence.liveFirstPartyLinkValidation.results) {
    assert.equal(result.status, 200);
    assert.equal(result.origin, "https://nexualpha.com");
    assert.equal(result.rawExchangeRegistrationUrl, false);
  }

  const hash = createHash("sha256").update(partnerRegistry).digest("hex");
  assert.equal(hash, evidence.protectedInvariants.partnerRegistrySha256);
  assert.equal(hash, "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a");
});

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const evidence = JSON.parse(
  await readFile(new URL("../docs/evidence/telegram-wave57-latest-news-review-pack-20260916.json", import.meta.url), "utf8"),
);
const markdown = await readFile(
  new URL("../docs/strategy/telegram-wave57-latest-news-review-pack-20260916.md", import.meta.url),
  "utf8",
);
const partnerRegistry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
const generatedFeed = JSON.parse(
  await readFile(new URL("../src/data/generated-tg-broadcast-feed.json", import.meta.url), "utf8"),
);

const expectedDraftIds = [
  "cftc-self-custodial-wallet-boundary-en",
  "spot-listing-timeline-disclosure-en",
  "leveraged-etf-x-perp-risk-en",
  "okx-vvv-listing-preopen-en",
  "payment-stablecoin-margin-collateral-en",
];

const expectedNewsPaths = [
  "/news/cftc-self-custodial-wallet-no-action-letter-scope-user-boundary",
  "/news/crypto-spot-listing-timeline-deposit-trading-withdrawal-disclosure-radar",
  "/news/leveraged-etf-x-perp-vs-standard-equity-perpetual-stacked-leverage-risk",
  "/news/okx-vvv-usdt-spot-listing-preopen-price-limit-transfer-checklist",
  "/news/payment-stablecoin-margin-collateral-issuer-eligibility-custody-haircut-framework",
];

const requiredTelegramParams = [
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
];

const rawExchangeRegistrationUrl =
  /accounts\.binance\.com|bsmkweb\.cc|partner\.bitget|bitget\.com\/(expressly|register|referral|signup)|okx\.com\/(join|register|referral)|topzhjdgxcb|backpack\.exchange\/join|11350287|nexu888|LUCKX|CANDY007|INS898|1836370407|luckybitcoin/i;

function assertNexuAlphaUrl(value, message) {
  const url = new URL(value);
  assert.equal(url.origin, "https://nexualpha.com", message);
  return url;
}

test("Wave57 review pack is manual-only, new-draft scoped, and NexuAlpha-first", () => {
  assert.equal(evidence.status, "PASS_MANUAL_REVIEW_PACK_ONLY");
  assert.equal(evidence.scope.selectedDraftCount, 5);
  assert.equal(evidence.scope.newDraftsAdded, 5);
  assert.equal(evidence.scope.sourceInventoryCount, 97);
  assert.equal(evidence.scope.telegramApiCalls, 0);
  assert.equal(evidence.scope.telegramMessagesSent, 0);
  assert.equal(evidence.scope.externalSubmissions, 0);
  assert.equal(evidence.scope.deploymentPerformed, false);
  assert.equal(evidence.scope.partnerRegistryEdited, false);

  assert.deepEqual(evidence.selectedDrafts.map((item) => item.draftId), expectedDraftIds);
  assert.deepEqual(
    evidence.selectedDrafts.map((item) => new URL(item.canonicalBacklink).pathname),
    expectedNewsPaths,
  );

  for (const item of evidence.selectedDrafts) {
    assert.equal(item.wave, "wave57_search_topics");
    const url = assertNexuAlphaUrl(item.canonicalBacklink, `${item.draftId} must return to NexuAlpha first`);
    assert.ok(url.pathname.startsWith("/news/"), `${item.draftId} must use a news landing page`);
    for (const param of requiredTelegramParams) {
      assert.ok(url.searchParams.get(param), `${item.draftId} missing ${param}`);
    }
    assert.ok(item.botDeepLink.startsWith("https://t.me/NexuAlphaAssistantBot?start="));
    assert.ok(item.shortCopy.includes("[onsite URL]"));
    assert.ok(item.riskBoundary.length > 60);
    assert.ok(item.sendBeforeCheck.length >= 4);
  }

  assert.doesNotMatch(JSON.stringify(evidence), rawExchangeRegistrationUrl);
  assert.doesNotMatch(markdown, rawExchangeRegistrationUrl);
});

test("Wave57 return matrix keeps every path onsite before the Bot follow-up", () => {
  assert.equal(evidence.returnMatrix.length, 5);

  for (const row of evidence.returnMatrix) {
    const matchingDraft = evidence.selectedDrafts.find((item) => item.draftId === row.draftId);
    assert.ok(matchingDraft, `${row.draftId} missing selected draft`);
    assert.equal(row.firstReturn, matchingDraft.canonicalBacklink);
    const first = assertNexuAlphaUrl(row.firstReturn, `${row.draftId} first return must be onsite`);
    assert.ok(first.pathname.startsWith("/news/"));
    for (const secondary of row.secondaryReturns) {
      assertNexuAlphaUrl(secondary, `${row.draftId} secondary return must be onsite`);
    }
    assert.ok(row.botFollowUp.startsWith("https://t.me/NexuAlphaAssistantBot?start="));
    assert.match(row.rule, /NexuAlpha onsite URL first/);
  }
});

test("Wave57 generated feed includes the five latest-news drafts without exchange registration exposure", () => {
  assert.equal(generatedFeed.totalBroadcasts,  101);
  assert.equal(generatedFeed.broadcasts.length,  101);
  assert.equal(generatedFeed.validation.counts.broadcasts,  101);

  const byId = new Map(generatedFeed.broadcasts.map((item) => [item.id, item]));
  for (const id of expectedDraftIds) {
    const item = byId.get(id);
    assert.ok(item, `${id} missing from generated feed`);
    assert.equal(item.wave, "wave57_search_topics");
    assert.equal(item.distributionStatus, "draft_not_posted");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.updateCadence.reviewTtlDays, 7);
    assert.match(item.summary, /Wave57 draft/);

    const landing = assertNexuAlphaUrl(item.canonicalLandingUrl, `${id} landing must be onsite`);
    assert.ok(landing.pathname.startsWith("/news/"));
    for (const entry of item.onsiteEntries) {
      assertNexuAlphaUrl(entry.url, `${id} onsite entry must be onsite`);
    }

    assert.doesNotMatch(JSON.stringify(item), rawExchangeRegistrationUrl);
  }
});

test("Wave57 records live first-party checks and protected partner registry invariant", () => {
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
  assert.equal(evidence.protectedInvariants.partnerRegistrySha256, "224be8f328b4b780b96dc0580f3258e81395ded8b5d3640558ae65fad75249f2");
  assert.equal(evidence.protectedInvariants.expectedPartnerRegistrySha256, "224be8f328b4b780b96dc0580f3258e81395ded8b5d3640558ae65fad75249f2");
  assert.equal(hash, "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a");
});

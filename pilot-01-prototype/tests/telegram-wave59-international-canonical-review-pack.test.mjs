import {committedFileHash} from './r100-test-contracts.mjs';
import { existsSync } from 'node:fs';
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const reviewInputs=['../docs/evidence/telegram-wave59-international-canonical-review-pack-20260916.json', '../docs/strategy/telegram-wave59-international-canonical-review-pack-20260916.md'];
if(!reviewInputs.every(p=>existsSync(new URL(p,import.meta.url)))) test('archived review evidence available',{skip:'Requires archived operator review pack: '+reviewInputs.join(', ')},()=>{});
else {
const evidence = JSON.parse(
  await readFile(new URL("../docs/evidence/telegram-wave59-international-canonical-review-pack-20260916.json", import.meta.url), "utf8"),
);
const markdown = await readFile(
  new URL("../docs/strategy/telegram-wave59-international-canonical-review-pack-20260916.md", import.meta.url),
  "utf8",
);
const partnerRegistry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
const generatedFeed = JSON.parse(
  await readFile(new URL("../src/data/generated-tg-broadcast-feed.json", import.meta.url), "utf8"),
);

const expectedDraftIds = [
  "eu-mica-platform-access-en",
  "uk-fca-crypto-risk-access-en",
  "jp-fsa-jpy-funding-check-ja",
  "hong-kong-funding-matrix-check-en",
];

const expectedPaths = ["/eu", "/uk", "/jp", "/hk"];

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

test("Wave59 review pack is manual-only and reuses the 101-draft inventory", () => {
  assert.equal(evidence.status, "PASS_MANUAL_REVIEW_PACK_ONLY");
  assert.equal(evidence.scope.selectedDraftCount, 4);
  assert.equal(evidence.scope.newDraftsAdded, 0);
  assert.equal(evidence.scope.sourceInventoryCount, 101);
  assert.equal(evidence.scope.telegramApiCalls, 0);
  assert.equal(evidence.scope.telegramMessagesSent, 0);
  assert.equal(evidence.scope.externalSubmissions, 0);
  assert.equal(evidence.scope.deploymentPerformed, false);
  assert.equal(evidence.scope.partnerRegistryEdited, false);
  assert.equal(evidence.scope.partnerRegistryMutationAllowed, false);

  assert.deepEqual(evidence.selectedDrafts.map((item) => item.draftId), expectedDraftIds);
  assert.deepEqual(
    evidence.selectedDrafts.map((item) => new URL(item.canonicalBacklink).pathname),
    expectedPaths,
  );
});

test("Wave59 keeps NexuAlpha as every first hop and Bot as follow-up", () => {
  for (const item of evidence.selectedDrafts) {
    const url = assertNexuAlphaUrl(item.canonicalBacklink, `${item.draftId} must return to NexuAlpha first`);
    for (const param of requiredTelegramParams) {
      assert.ok(url.searchParams.get(param), `${item.draftId} missing ${param}`);
    }
    assert.ok(item.botDeepLink.startsWith("https://t.me/NexuAlphaAssistantBot?start="));
    assert.ok(item.shortCopy.includes("[onsite URL]"));
    assert.match(item.riskBoundary, /does not add new drafts/);
    assert.match(item.riskBoundary, /raw exchange registration URLs/);
    assert.ok(item.sendBeforeCheck.length >= 4);
  }

  assert.doesNotMatch(JSON.stringify(evidence), rawExchangeRegistrationUrl);
  assert.doesNotMatch(markdown, rawExchangeRegistrationUrl);
  assert.doesNotMatch(markdown, /\[object Object\]/);
});

test("Wave59 selection targets international canonical search intent without repeating Wave58 topics", () => {
  assert.deepEqual(evidence.internationalSearchIntents, [
    "EU MiCA platform access and funding checklist",
    "UK FCA risk-warning and GBP funding checklist",
    "Japan FSA registration and JPY funding checklist",
    "Hong Kong SFC/VASP funding matrix and account-route checklist",
  ]);

  const byId = Object.fromEntries(evidence.selectedDrafts.map((item) => [item.draftId, item]));
  assert.match(byId["eu-mica-platform-access-en"].answerFirst, /MiCA context/);
  assert.match(byId["uk-fca-crypto-risk-access-en"].answerFirst, /FCA-facing risk-warning context/);
  assert.match(byId["jp-fsa-jpy-funding-check-ja"].answerFirst, /FSA登録/);
  assert.match(byId["hong-kong-funding-matrix-check-en"].answerFirst, /SFC\/VASP context/);

  for (const item of evidence.selectedDrafts) {
    assert.notEqual(item.wave, "wave57_latest_news");
    assert.notEqual(item.wave, "wave58_search_topics");
  }
});

test("Wave59 selected drafts exist in the generated feed as draft_not_posted", () => {
  assert.equal(generatedFeed.totalBroadcasts, 101);
  assert.equal(generatedFeed.broadcasts.length, 101);
  assert.equal(generatedFeed.validation.counts.broadcasts, 101);

  const byId = new Map(generatedFeed.broadcasts.map((item) => [item.id, item]));
  for (const id of expectedDraftIds) {
    const item = byId.get(id);
    assert.ok(item, `${id} missing from generated feed`);
    assert.match(item.wave, /^wave3[68]_search_topics$/);
    assert.equal(item.distributionStatus, "draft_not_posted");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.updateCadence.reviewTtlDays, 7);

    assertNexuAlphaUrl(item.canonicalLandingUrl, `${id} landing must be onsite`);
    assert.ok(item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink));
    assert.ok(item.markdownV2.indexOf(item.canonicalBacklink) < item.markdownV2.indexOf(item.deepLink));
    for (const entry of item.onsiteEntries) {
      assertNexuAlphaUrl(entry.url, `${id} onsite entry must be onsite`);
    }

    assert.doesNotMatch(JSON.stringify(item), rawExchangeRegistrationUrl);
  }
});

test("Wave59 preserves the protected partner registry invariant", () => {
  const hash = createHash("sha256").update(partnerRegistry).digest("hex");
  assert.equal(hash, evidence.protectedInvariants.partnerRegistrySha256);
  assert.equal(hash, evidence.protectedInvariants.expectedPartnerRegistrySha256);
  assert.equal(hash, "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a");
});

}

test('independent current registry protection',async()=>{const bytes=await readFile(new URL('../src/data/partner-registry.js',import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),committedFileHash('src/data/partner-registry.js'));});

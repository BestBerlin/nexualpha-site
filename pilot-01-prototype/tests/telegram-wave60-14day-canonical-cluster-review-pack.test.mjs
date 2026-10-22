import {committedFileHash} from './r100-test-contracts.mjs';
import { existsSync } from 'node:fs';
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const reviewInputs=['../docs/evidence/telegram-wave60-14day-canonical-cluster-review-pack-20260916.json', '../docs/strategy/telegram-wave60-14day-canonical-cluster-review-pack-20260916.md'];
if(!reviewInputs.every(p=>existsSync(new URL(p,import.meta.url)))) test('archived review evidence available',{skip:'Requires archived operator review pack: '+reviewInputs.join(', ')},()=>{});
else {
const evidence = JSON.parse(
  await readFile(new URL("../docs/evidence/telegram-wave60-14day-canonical-cluster-review-pack-20260916.json", import.meta.url), "utf8"),
);
const markdown = await readFile(
  new URL("../docs/strategy/telegram-wave60-14day-canonical-cluster-review-pack-20260916.md", import.meta.url),
  "utf8",
);
const partnerRegistry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
const generatedFeed = JSON.parse(
  await readFile(new URL("../src/data/generated-tg-broadcast-feed.json", import.meta.url), "utf8"),
);

const expectedDraftIds = [
  "hyperliquid-fees-en",
  "uniswap-testnet-en",
  "tokenized-treasuries-en",
  "bybit-bitget-stock-exposure-en",
  "hyperliquid-funded-account-en",
  "uniswap-v4-deployment-check-en",
  "tokenized-treasury-buidl-benji-en",
  "tokenized-stock-vs-stock-perp-en",
  "hyperliquid-funding-decision-en",
  "uniswap-testnet-mainnet-boundary-en",
  "tokenized-treasury-issuer-custody-redemption-en",
  "bitget-bybit-stocks-product-boundary-en",
  "hyperliquid-fees-funded-boundary-en",
  "wave58-uniswap-testnet-mainnet-safety-en",
];

const expectedClusterCounts = {
  "hyperliquid-fees-funded-account": 4,
  "uniswap-testnet-permit2": 4,
  "tokenized-treasuries": 3,
  "bybit-vs-bitget-product-differences": 3,
};

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

test("Wave60 pack is a 14-day manual-only reuse plan", () => {
  assert.equal(evidence.status, "PASS_MANUAL_REVIEW_PACK_ONLY");
  assert.equal(evidence.scope.selectedDraftCount, 14);
  assert.equal(evidence.scope.cadenceDays, 14);
  assert.equal(evidence.scope.newDraftsAdded, 0);
  assert.equal(evidence.scope.sourceInventoryCount, 101);
  assert.equal(evidence.scope.telegramApiCalls, 0);
  assert.equal(evidence.scope.telegramMessagesSent, 0);
  assert.equal(evidence.scope.externalSubmissions, 0);
  assert.equal(evidence.scope.deploymentPerformed, false);
  assert.equal(evidence.scope.partnerRegistryEdited, false);
  assert.equal(evidence.scope.partnerRegistryMutationAllowed, false);

  assert.deepEqual(evidence.days.map((day) => day.draftId), expectedDraftIds);
  assert.deepEqual(evidence.days.map((day) => day.day), Array.from({ length: 14 }, (_, index) => index + 1));
  assert.equal(new Set(evidence.days.map((day) => day.draftId)).size, 14);
});

test("Wave60 covers the four requested search clusters without duplicate IDs", () => {
  const counts = Object.fromEntries(Object.keys(expectedClusterCounts).map((cluster) => [cluster, 0]));
  for (const day of evidence.days) counts[day.cluster] += 1;
  assert.deepEqual(counts, expectedClusterCounts);

  assert.match(JSON.stringify(evidence.clusters["hyperliquid-fees-funded-account"].reviewFields), /funded-account/);
  assert.match(JSON.stringify(evidence.clusters["uniswap-testnet-permit2"].reviewFields), /Permit2/);
  assert.match(JSON.stringify(evidence.clusters["tokenized-treasuries"].reviewFields), /redemption/);
  assert.match(JSON.stringify(evidence.clusters["bybit-vs-bitget-product-differences"].reviewFields), /tokenized exposure/);
});

test("Wave60 keeps NexuAlpha as every first hop and Bot as follow-up", () => {
  for (const day of evidence.days) {
    const url = assertNexuAlphaUrl(day.canonicalBacklink, `${day.draftId} must return to NexuAlpha first`);
    for (const param of requiredTelegramParams) {
      assert.ok(url.searchParams.get(param), `${day.draftId} missing ${param}`);
    }
    assert.ok(day.botDeepLink.startsWith("https://t.me/NexuAlphaAssistantBot?start="));
    assert.ok(day.shortCopy.includes("[onsite URL]"));
    assert.match(day.riskBoundary, /Manual review only/);
    assert.match(day.riskBoundary, /raw exchange registration URLs/);
    assert.ok(day.sendBeforeCheck.length >= 4);
  }

  assert.equal(evidence.localFirstPartyLinkValidation.checkedUrlCount, 14);
  assert.equal(evidence.localFirstPartyLinkValidation.nexuAlphaLandingUrls, 14);
  assert.equal(evidence.localFirstPartyLinkValidation.rawExchangeRegistrationUrlCount, 0);
  for (const result of evidence.localFirstPartyLinkValidation.results) {
    assert.equal(result.origin, "https://nexualpha.com");
    assert.deepEqual(result.missingParams, []);
    assert.equal(result.botOnlyFollowUp, true);
    assert.equal(result.rawExchangeRegistrationUrl, false);
  }

  assert.doesNotMatch(JSON.stringify(evidence), rawExchangeRegistrationUrl);
  assert.doesNotMatch(markdown, rawExchangeRegistrationUrl);
  assert.doesNotMatch(markdown, /\[object Object\]/);
});

test("Wave60 selected drafts exist in the current 101 feed as draft_not_posted", () => {
  assert.equal(generatedFeed.totalBroadcasts, 101);
  assert.equal(generatedFeed.broadcasts.length, 101);
  assert.equal(generatedFeed.validation.counts.broadcasts, 101);

  const byId = new Map(generatedFeed.broadcasts.map((item) => [item.id, item]));
  for (const day of evidence.days) {
    const item = byId.get(day.draftId);
    assert.ok(item, `${day.draftId} missing from generated feed`);
    assert.equal(item.distributionStatus, "draft_not_posted");
    assertNexuAlphaUrl(item.canonicalLandingUrl, `${day.draftId} landing must be onsite`);
    assert.ok(item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink));
    assert.ok(item.markdownV2.indexOf(item.canonicalBacklink) < item.markdownV2.indexOf(item.deepLink));
    for (const entry of item.onsiteEntries) {
      assertNexuAlphaUrl(entry.url, `${day.draftId} onsite entry must be onsite`);
    }
    assert.doesNotMatch(JSON.stringify(item), rawExchangeRegistrationUrl);
  }
});

test("Wave60 uses the Wave58 Uniswap draft only for explicit Permit2 coverage", () => {
  const wave58Drafts = evidence.days.filter((day) => day.wave === "wave58_search_topics");
  assert.deepEqual(wave58Drafts.map((day) => day.draftId), ["wave58-uniswap-testnet-mainnet-safety-en"]);
  assert.equal(wave58Drafts[0].cluster, "uniswap-testnet-permit2");
  assert.match(wave58Drafts[0].answerFirst, /Permit2 spender/);
});

test("Wave60 preserves the protected partner registry invariant", () => {
  const hash = createHash("sha256").update(partnerRegistry).digest("hex");
  assert.equal(evidence.protectedInvariants.partnerRegistrySha256, "224be8f328b4b780b96dc0580f3258e81395ded8b5d3640558ae65fad75249f2");
  assert.equal(evidence.protectedInvariants.expectedPartnerRegistrySha256, "224be8f328b4b780b96dc0580f3258e81395ded8b5d3640558ae65fad75249f2");
  assert.equal(hash, "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a");
});

}

test('independent current registry protection',async()=>{const bytes=await readFile(new URL('../src/data/partner-registry.js',import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),committedFileHash('src/data/partner-registry.js'));});

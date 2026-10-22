import { committedFileHash } from './r100-test-contracts.mjs';
import { existsSync } from 'node:fs';
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const reviewInputs=['../docs/evidence/wave56-tokenized-treasury-authority-review-pack-20260916.json', '../docs/strategy/wave56-tokenized-treasury-authority-review-pack-20260916.md', '../docs/strategy/telegram-wave56-tokenized-treasury-review-pack-20260916.md'];
if(!reviewInputs.every(p=>existsSync(new URL(p,import.meta.url)))) test('archived review evidence available',{skip:'Requires archived operator review pack: '+reviewInputs.join(', ')},()=>{});
else {
const evidence = JSON.parse(
  await readFile(new URL("../docs/evidence/wave56-tokenized-treasury-authority-review-pack-20260916.json", import.meta.url), "utf8"),
);
const authorityPack = await readFile(
  new URL("../docs/strategy/wave56-tokenized-treasury-authority-review-pack-20260916.md", import.meta.url),
  "utf8",
);
const telegramPack = await readFile(
  new URL("../docs/strategy/telegram-wave56-tokenized-treasury-review-pack-20260916.md", import.meta.url),
  "utf8",
);
const treasuryAsset = JSON.parse(
  await readFile(new URL("../public/research/wave48-tokenized-treasury-rights-ops.json", import.meta.url), "utf8"),
);
const partnerRegistry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));

const protectedPartnerRegistrySha = committedFileHash("src/data/partner-registry.js");
const rawExchangeRegistrationUrl =
  /accounts\.binance\.com|bsmkweb\.cc|partner\.bitget|bitget\.com\/(expressly|register|referral|signup)|okx\.com\/(join|register|referral)|topzhjdgxcb|backpack\.exchange\/join/i;
const positiveForbiddenClaims =
  /\b(is|are|will be|guarantees?|promises?|proves?)\b[^.\n]{0,80}\b(guaranteed yield|guaranteed redemption|guaranteed eligibility|AI citation lift|ranking boost|commission rate)\b/i;

test("Wave56 Treasury authority pack is local manual review only", () => {
  assert.equal(evidence.status, "PASS_LOCAL_MANUAL_REVIEW_PACK_ONLY");
  assert.equal(evidence.scope.externalSubmissions, 0);
  assert.equal(evidence.scope.telegramApiCalls, 0);
  assert.equal(evidence.scope.telegramMessagesSent, 0);
  assert.equal(evidence.scope.indexNowSubmissions, 0);
  assert.equal(evidence.scope.deploymentPerformed, false);
  assert.equal(evidence.scope.partnerRegistryEdited, false);
  assert.equal(evidence.scope.newIndexableUrls, 0);

  assert.doesNotMatch(authorityPack, rawExchangeRegistrationUrl);
  assert.doesNotMatch(telegramPack, rawExchangeRegistrationUrl);
  assert.doesNotMatch(JSON.stringify(evidence), rawExchangeRegistrationUrl);
  assert.doesNotMatch(`${authorityPack}\n${telegramPack}\n${JSON.stringify(evidence)}`, positiveForbiddenClaims);
});

test("Wave56 Treasury evidence matches the existing citation asset boundaries", () => {
  assert.equal(evidence.assetCoverage.products, treasuryAsset.products.length);
  assert.equal(evidence.assetCoverage.sourceGroups, treasuryAsset.sourceRegister.length);
  assert.deepEqual(evidence.assetCoverage.requiredFields, treasuryAsset.requiredFields);
  assert.equal(evidence.assetCoverage.correctionContact, treasuryAsset.correctionsContact);
  assert.equal(evidence.assetCoverage.preferredCitation, treasuryAsset.preferredCitation);

  for (const asset of evidence.canonicalAssets) {
    assert.equal(new URL(asset.url).origin, "https://nexualpha.com");
    assert.equal(asset.liveStatus, 200);
  }

  for (const product of treasuryAsset.products) {
    for (const field of evidence.assetCoverage.requiredFields) {
      assert.ok(product[field], `${product.id} missing ${field}`);
    }
  }
});

test("Wave56 Telegram Treasury pack keeps NexuAlpha-first UTM links and no send side effects", () => {
  assert.equal(evidence.telegramManualReview.status, "PASS_MANUAL_REVIEW_ONLY");
  assert.equal(evidence.telegramManualReview.selectedDraftCount, 3);
  assert.deepEqual(evidence.telegramManualReview.selectedDrafts.map((item) => item.draftId), [
    "tokenized-treasury-buidl-benji-en",
    "tokenized-treasury-redemption-risk-en",
    "rwa-treasury-transfer-restrictions-en",
  ]);

  for (const item of evidence.telegramManualReview.selectedDrafts) {
    const url = new URL(item.canonicalBacklink);
    assert.equal(url.origin, "https://nexualpha.com");
    assert.equal(url.pathname, item.landingPath);
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
    assert.ok(item.riskBoundary.length > 70);
  }
});

test("Wave56 preserves the protected invitation registry", () => {
  const hash = createHash("sha256").update(partnerRegistry).digest("hex");
  assert.equal(hash, protectedPartnerRegistrySha);
  assert.equal(hash, evidence.protectedInvariants.partnerRegistrySha256);
});

}

test('independent current registry protection',async()=>{const bytes=await readFile(new URL('../src/data/partner-registry.js',import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),committedFileHash('src/data/partner-registry.js'));});

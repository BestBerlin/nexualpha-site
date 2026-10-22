import {committedFileHash} from './r100-test-contracts.mjs';
import { existsSync } from 'node:fs';
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createHash } from "node:crypto";

const reviewInputs=['../docs/evidence/telegram-wave55-source-boundary-review-pack-20260916.json', '../docs/strategy/telegram-wave55-source-boundary-review-pack-20260916.md'];
if(!reviewInputs.every(p=>existsSync(new URL(p,import.meta.url)))) test('archived review evidence available',{skip:'Requires archived operator review pack: '+reviewInputs.join(', ')},()=>{});
else {
const evidence = JSON.parse(
  await readFile(new URL("../docs/evidence/telegram-wave55-source-boundary-review-pack-20260916.json", import.meta.url), "utf8"),
);
const markdown = await readFile(
  new URL("../docs/strategy/telegram-wave55-source-boundary-review-pack-20260916.md", import.meta.url),
  "utf8",
);
const partnerRegistry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));

const rawExchangeRegistrationUrl =
  /accounts\.binance\.com|bsmkweb\.cc|partner\.bitget|bitget\.com\/(expressly|register|referral|signup)|okx\.com\/(join|register|referral)|topzhjdgxcb|backpack\.exchange\/join/i;

test("Wave55 Telegram source-boundary pack is manual-only and uses existing drafts", () => {
  assert.equal(evidence.status, "PASS_MANUAL_REVIEW_PACK_ONLY");
  assert.equal(evidence.scope.selectedDraftCount, 5);
  assert.equal(evidence.scope.newDraftsAdded, 0);
  assert.equal(evidence.scope.telegramApiCalls, 0);
  assert.equal(evidence.scope.telegramMessagesSent, 0);
  assert.equal(evidence.scope.externalSubmissions, 0);
  assert.equal(evidence.scope.partnerRegistryEdited, false);

  assert.deepEqual(evidence.selectedDrafts.map((item) => item.draftId), [
    "uniswap-wallet-route-fee-de",
    "crypto-perpetual-platform-en",
    "perp-dex-cost-field-dictionary-en",
    "tokenized-treasury-issuer-custody-redemption-en",
    "ai-citation-tokenized-asset-ownership-redemption-en",
  ]);

  for (const item of evidence.selectedDrafts) {
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
    assert.ok(item.riskBoundary.length > 60);
    assert.ok(item.sendBeforeCheck.length >= 4);
  }

  assert.doesNotMatch(JSON.stringify(evidence), rawExchangeRegistrationUrl);
  assert.doesNotMatch(markdown, rawExchangeRegistrationUrl);
});

test("Wave55 records live first-party link checks and protected invitation registry invariant", () => {
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

test("Wave55 preserves source-boundary guardrails for Uniswap, perps and tokenized Treasuries", () => {
  const byId = Object.fromEntries(evidence.selectedDrafts.map((item) => [item.draftId, item]));

  assert.match(byId["uniswap-wallet-route-fee-de"].reason, /Permit2/);
  assert.match(byId["uniswap-wallet-route-fee-de"].riskBoundary, /German-language owner review/);
  assert.match(byId["crypto-perpetual-platform-en"].riskBoundary, /Do not declare a best, cheapest or safest platform/);
  assert.match(byId["perp-dex-cost-field-dictionary-en"].riskBoundary, /field explainer only/);
  assert.match(byId["tokenized-treasury-issuer-custody-redemption-en"].riskBoundary, /Do not imply direct U\.S\. Treasury ownership/);
  assert.match(byId["ai-citation-tokenized-asset-ownership-redemption-en"].riskBoundary, /Do not claim AI Overview/);
});

}

test('independent current registry protection',async()=>{const bytes=await readFile(new URL('../src/data/partner-registry.js',import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),committedFileHash('src/data/partner-registry.js'));});

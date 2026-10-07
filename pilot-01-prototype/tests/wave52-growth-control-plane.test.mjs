import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..");
const evidencePath = path.join(repoRoot, "docs/evidence/telegram-wave52-top5-review-pack-20260915.json");
const feedPath = path.join(repoRoot, "src/data/generated-tg-broadcast-feed.json");
const partnerRegistryPath = path.join(repoRoot, "src/data/partner-registry.js");

const RAW_EXCHANGE_REGISTRATION_URL_RE =
  /accounts\.binance\.com|partner\.bitget|okx\.com\/join|backpack\.exchange\/join|bybit\.com\/invite|weex\.com\/register/i;

test("Wave52 locks the top-five Telegram pack to onsite-first manual review", async () => {
  const evidence = JSON.parse(await fs.readFile(evidencePath, "utf8"));
  const feed = JSON.parse(await fs.readFile(feedPath, "utf8"));
  const broadcasts = feed.broadcasts;
  const byId = new Map(broadcasts.map((item) => [item.id, item]));
  const topFiveIds = evidence.topFive.map((item) => item.draftId);

  assert.equal(evidence.status, "PASS_MANUAL_REVIEW_PACK_ONLY");
  assert.equal(evidence.scope.selectedDraftCount, 5);
  assert.equal(evidence.scope.newDraftsAdded, 0);
  assert.equal(evidence.scope.telegramApiCalls, 0);
  assert.equal(evidence.scope.telegramMessagesSent, 0);
  assert.equal(evidence.scope.externalSubmissions, 0);
  assert.equal(evidence.liveFirstPartyLinkValidation.checkedUrlCount, 5);
  assert.equal(evidence.liveFirstPartyLinkValidation.okUrlCount, 5);
  assert.equal(evidence.liveFirstPartyLinkValidation.failedUrlCount, 0);
  assert.equal(evidence.liveFirstPartyLinkValidation.rawExchangeRegistrationUrlCount, 0);
  assert.deepEqual(topFiveIds, [
    "hyperliquid-fees-en",
    "tokenized-treasuries-en",
    "hyperliquid-funded-account-en",
    "uniswap-testnet-en",
    "okx-usd-usdc-migration-en",
  ]);

  for (const draftId of topFiveIds) {
    const draft = byId.get(draftId);
    assert.ok(draft, `${draftId} must exist in the generated Telegram feed`);
    assert.ok(draft.canonicalBacklink.startsWith("https://nexualpha.com/"), `${draftId} must be onsite-first`);
    assert.ok(draft.plainText.includes(draft.canonicalBacklink), `${draftId} plain text must contain onsite URL`);
    assert.ok(draft.plainText.indexOf(draft.canonicalBacklink) < draft.plainText.indexOf(draft.deepLink), `${draftId} must place onsite URL before Bot link`);
    assert.doesNotMatch(draft.plainText, RAW_EXCHANGE_REGISTRATION_URL_RE);
    assert.doesNotMatch(draft.markdownV2, RAW_EXCHANGE_REGISTRATION_URL_RE);
  }

  for (const result of evidence.liveFirstPartyLinkValidation.results) {
    assert.equal(result.status, 200, `${result.draftId} live check must pass`);
    assert.equal(result.origin, "https://nexualpha.com", `${result.draftId} must stay first-party`);
    assert.equal(result.rawExchangeRegistrationUrl, false, `${result.draftId} must not expose raw exchange registration URLs`);
  }

  const partnerRegistryHash = crypto
    .createHash("sha256")
    .update(await fs.readFile(partnerRegistryPath))
    .digest("hex");
  assert.equal(partnerRegistryHash, evidence.protectedInvariants.partnerRegistrySha256);
  assert.equal(evidence.protectedInvariants.rawExchangeRegistrationLinksExposedInPack, false);
});

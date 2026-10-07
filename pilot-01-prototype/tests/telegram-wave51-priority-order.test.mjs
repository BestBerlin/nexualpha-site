import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..");
const evidencePath = path.join(repoRoot, "docs/evidence/telegram-wave51-priority-order-20260915.json");
const feedPath = path.join(repoRoot, "src/data/generated-tg-broadcast-feed.json");
const partnerRegistryPath = path.join(repoRoot, "src/data/partner-registry.js");

const RAW_EXCHANGE_REGISTRATION_URL_RE =
  /accounts\.binance\.com|partner\.bitget|okx\.com\/join|backpack\.exchange\/join|bybit\.com\/invite|weex\.com\/register/i;

test("Wave51 Telegram priority artifact ranks existing drafts without unsafe links", async () => {
  const evidence = JSON.parse(await fs.readFile(evidencePath, "utf8"));
  const feed = JSON.parse(await fs.readFile(feedPath, "utf8"));
  const draftIds = new Set(feed.broadcasts.map((draft) => draft.id));
  const rankedIds = evidence.priorityOrder.map((entry) => entry.draftId);

  assert.equal(evidence.status, "PASS_EXISTING_DRAFT_PRIORITY_ONLY");
  assert.equal(evidence.queueDecision.currentDrafts, 92);
  assert.equal(evidence.queueDecision.newDraftsAdded, 0);
  assert.equal(evidence.liveFirstPartyLinkValidation.checkedUrlCount, 20);
  assert.equal(evidence.liveFirstPartyLinkValidation.okUrlCount, 20);
  assert.equal(evidence.liveFirstPartyLinkValidation.failedUrlCount, 0);
  assert.equal(evidence.protectedInvariants.telegramApiCalls, 0);
  assert.equal(evidence.protectedInvariants.telegramMessagesSent, 0);
  assert.equal(evidence.protectedInvariants.rawExchangeRegistrationLinksExposedInPriorityOrder, false);
  assert.equal(new Set(rankedIds).size, rankedIds.length);

  for (const rankedId of rankedIds) {
    assert.ok(draftIds.has(rankedId), `${rankedId} must exist in the generated Telegram feed`);
  }

  const serialized = JSON.stringify(evidence);
  assert.doesNotMatch(serialized, RAW_EXCHANGE_REGISTRATION_URL_RE);

  const partnerRegistryHash = crypto
    .createHash("sha256")
    .update(await fs.readFile(partnerRegistryPath))
    .digest("hex");
  assert.equal(partnerRegistryHash, evidence.protectedInvariants.partnerRegistrySha256);
});

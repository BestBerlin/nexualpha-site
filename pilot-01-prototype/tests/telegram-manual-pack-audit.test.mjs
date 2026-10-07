import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  auditTelegramManualPack,
  renderTelegramManualPackAuditMarkdown,
  TELEGRAM_ANONYMOUS_METRIC_WINDOWS,
  TELEGRAM_PACK_REQUIRED_PARAMS,
  writeTelegramManualPackAudit,
} from "../scripts/audit-telegram-manual-pack.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const wave15PackDir = path.join(repoRoot, "docs/strategy/telegram-manual-publish-pack-20260915-wave15");
const wave18PackDir = path.join(repoRoot, "docs/strategy/telegram-manual-publish-pack-20260915-wave18");
const wave19PackDir = path.join(repoRoot, "docs/strategy/telegram-manual-publish-pack-20260915-wave19");
const wave39PackDir = path.join(repoRoot, "docs/strategy/telegram-manual-publish-pack-20260915-wave39");
const wave40PackDir = path.join(repoRoot, "docs/strategy/telegram-manual-publish-pack-20260915-wave40");
const wave41PackDir = path.join(repoRoot, "docs/strategy/telegram-manual-publish-pack-20260915-wave41");
const wave44AuditMarkdown = path.join(repoRoot, "docs/evidence/telegram-wave44-audit-20260915.md");
const wave50AuditJson = path.join(repoRoot, "docs/evidence/telegram-wave50-distribution-review-20260915.json");
const wave50AuditMarkdown = path.join(repoRoot, "docs/evidence/telegram-wave50-distribution-review-20260915.md");

test("Wave18 Telegram manual pack passes offline NexuAlpha-first audit", async () => {
  const result = await auditTelegramManualPack({ packDir: wave18PackDir, waveLabel: "Wave18", expectedSlots: 6 });

  assert.equal(result.status, "PASS");
  assert.equal(result.waveLabel, "Wave18");
  assert.equal(result.expectedSlots, 6);
  assert.equal(result.noTelegramApiCall, true);
  assert.equal(result.totals.slots, 6);
  assert.equal(result.totals.nexuAlphaLandingUrls, 6);
  assert.deepEqual(result.missingDocs, []);
  assert.deepEqual(result.requiredParams, TELEGRAM_PACK_REQUIRED_PARAMS);
  assert.deepEqual(result.anonymousMetricWindows, TELEGRAM_ANONYMOUS_METRIC_WINDOWS);
  assert.equal(result.problems.length, 0);
  assert.ok(result.campaigns.includes("hyperliquid_fees_en"));
  assert.ok(result.campaigns.includes("compare_binance_okx_en"));
  assert.ok(result.campaigns.includes("br_pix_withdrawal_ptbr"));
});

test("Telegram manual pack audit reports missing docs and broken UTM", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "telegram-pack-audit-"));
  await fs.writeFile(path.join(tmp, "queue.json"), JSON.stringify({
    status: "draft_only",
    noTelegramApiCall: true,
    validation: { rawExchangeRegistrationLinks: false, requiredUtmParams: false },
    queue: [
      {
        label: "slot",
        slots: [
          {
            itemId: "broken",
            campaign: "broken_campaign",
            canonicalLandingUrl: "https://nexualpha.com/telegram?utm_source=tg_channel",
            botDeepLink: "https://t.me/NexuAlphaAssistantBot?start=broken",
          },
        ],
      },
    ],
  }), "utf8");
  await fs.writeFile(path.join(tmp, "copy-pack.md"), "Bot follow-up: https://t.me/NexuAlphaAssistantBot?start=broken\nLanding URL: https://nexualpha.com/telegram?utm_source=tg_channel\n", "utf8");
  await fs.writeFile(path.join(tmp, "preflight-checklist.md"), "NexuAlpha Bot 24h 7d utm_source\n", "utf8");

  const result = await auditTelegramManualPack({ packDir: tmp, waveLabel: "Wave18", expectedSlots: 6 });

  assert.equal(result.status, "NEEDS_REVIEW");
  assert.ok(result.missingDocs.includes("attribution-guide.md"));
  assert.ok(result.problems.some((problem) => problem.message.includes("Expected 6 Wave18 slots")));
  assert.ok(result.problems.some((problem) => problem.message.includes("Missing required public/Telegram URL parameter: utm_medium")));
  assert.ok(result.problems.some((problem) => problem.message.includes("Bot link appears before the NexuAlpha landing URL")));
  assert.ok(result.problems.some((problem) => problem.message.includes("explicit human authorization")));
});

test("Wave19 Telegram manual pack passes six-slot authorization audit", async () => {
  const result = await auditTelegramManualPack({ packDir: wave19PackDir, waveLabel: "Wave19", expectedSlots: 6 });

  assert.equal(result.status, "PASS");
  assert.equal(result.waveLabel, "Wave19");
  assert.equal(result.expectedSlots, 6);
  assert.equal(result.noTelegramApiCall, true);
  assert.equal(result.totals.slots, 6);
  assert.equal(result.totals.nexuAlphaLandingUrls, 6);
  assert.deepEqual(result.missingDocs, []);
  assert.equal(result.problems.length, 0);
  assert.ok(result.campaigns.includes("uniswap_testnet_en"));
  assert.ok(result.campaigns.includes("jupiter_swap_route_en"));
  assert.ok(result.campaigns.includes("aerodrome_base_pool_en"));
  assert.ok(result.campaigns.includes("no_kyc_dex_check_en"));
  assert.ok(result.campaigns.includes("kr_regulatory_context_ko"));
  assert.ok(result.campaigns.includes("tr_spk_register_tr"));
});

test("Wave39 Telegram manual pack passes minimal priority-canonical bundle audit", async () => {
  const result = await auditTelegramManualPack({ packDir: wave39PackDir, waveLabel: "Wave39", expectedSlots: 92 });

  assert.equal(result.status, "PASS");
  assert.equal(result.waveLabel, "Wave39");
  assert.equal(result.expectedSlots, 92);
  assert.equal(result.noTelegramApiCall, true);
  assert.equal(result.totals.slots, 92);
  assert.equal(result.totals.nexuAlphaLandingUrls, 92);
  assert.deepEqual(result.missingDocs, []);
  assert.equal(result.problems.length, 0);
  assert.ok(result.campaigns.includes("priority_canonical_five_review_bundle_en"));
});

test("Wave40 Telegram manual pack keeps the reviewed queue frozen without duplicate priority-canonical drafts", async () => {
  const result = await auditTelegramManualPack({ packDir: wave40PackDir, waveLabel: "Wave40", expectedSlots: 92 });

  assert.equal(result.status, "PASS");
  assert.equal(result.waveLabel, "Wave40");
  assert.equal(result.expectedSlots, 92);
  assert.equal(result.noTelegramApiCall, true);
  assert.equal(result.totals.slots, 92);
  assert.equal(result.totals.campaigns, 92);
  assert.equal(result.totals.nexuAlphaLandingUrls, 92);
  assert.equal(new Set(result.selectedIds).size, 92);
  assert.deepEqual(result.missingDocs, []);
  assert.equal(result.problems.length, 0);
  assert.equal(result.campaigns.filter((campaign) => campaign === "priority_canonical_five_review_bundle_en").length, 1);
});

test("Wave41 Telegram manual pack stays frozen when six OAI-labelled requests do not prove reader demand", async () => {
  const result = await auditTelegramManualPack({ packDir: wave41PackDir, waveLabel: "Wave41", expectedSlots: 92 });

  assert.equal(result.status, "PASS");
  assert.equal(result.waveLabel, "Wave41");
  assert.equal(result.expectedSlots, 92);
  assert.equal(result.noTelegramApiCall, true);
  assert.equal(result.totals.slots, 92);
  assert.equal(result.totals.campaigns, 92);
  assert.equal(result.totals.nexuAlphaLandingUrls, 92);
  assert.equal(new Set(result.selectedIds).size, 92);
  assert.deepEqual(result.missingDocs, []);
  assert.equal(result.problems.length, 0);
  assert.equal(result.campaigns.filter((campaign) => campaign === "priority_canonical_five_review_bundle_en").length, 1);
});

test("Wave44 Telegram audit keeps the 92-draft queue frozen while GMX evidence matures", async () => {
  const result = await auditTelegramManualPack({ packDir: wave41PackDir, waveLabel: "Wave44", expectedSlots: 92 });
  const markdown = await fs.readFile(wave44AuditMarkdown, "utf8");

  assert.equal(result.status, "PASS");
  assert.equal(result.waveLabel, "Wave44");
  assert.equal(result.expectedSlots, 92);
  assert.equal(result.noTelegramApiCall, true);
  assert.equal(result.totals.slots, 92);
  assert.equal(result.totals.campaigns, 92);
  assert.equal(result.totals.nexuAlphaLandingUrls, 92);
  assert.equal(new Set(result.selectedIds).size, 92);
  assert.deepEqual(result.missingDocs, []);
  assert.equal(result.problems.length, 0);
  assert.equal(result.campaigns.filter((campaign) => campaign === "priority_canonical_five_review_bundle_en").length, 1);
  assert.match(markdown, /0 new drafts/);
  assert.match(markdown, /GMX experiment is still waiting for a comparable GSC window/);
  assert.match(markdown, /Telegram API calls: \*\*0\*\*/);
});

test("Wave50 Telegram distribution review keeps Wave48 citation assets deduped", async () => {
  const result = await auditTelegramManualPack({ packDir: wave41PackDir, waveLabel: "Wave50", expectedSlots: 92 });
  const review = JSON.parse(await fs.readFile(wave50AuditJson, "utf8"));
  const markdown = await fs.readFile(wave50AuditMarkdown, "utf8");

  assert.equal(result.status, "PASS");
  assert.equal(result.totals.slots, 92);
  assert.equal(review.status, "PASS_NO_NEW_DRAFTS");
  assert.equal(review.queue.distinctNewDraftsAdded, 0);
  assert.equal(review.queue.rawExchangeRegistrationLinks, false);
  assert.equal(review.liveFirstPartyLinkValidation.checkedUrlCount, 102);
  assert.equal(review.liveFirstPartyLinkValidation.failedUrlCount, 0);
  assert.equal(review.protectedInvariants.partnerRegistrySha256, "224be8f328b4b780b96dc0580f3258e81395ded8b5d3640558ae65fad75249f2");
  assert.ok(review.coverage.perpDexCostAssetCoveredByDraftIds.includes("perp-dex-cost-field-dictionary-en"));
  assert.ok(review.coverage.perpDexCostAssetCoveredByDraftIds.includes("ai-citation-perp-risk-fields-en"));
  assert.ok(review.coverage.tokenizedTreasuryAssetCoveredByDraftIds.includes("tokenized-treasury-issuer-custody-redemption-en"));
  assert.ok(review.coverage.tokenizedTreasuryAssetCoveredByDraftIds.includes("ai-citation-tokenized-asset-ownership-redemption-en"));
  assert.match(markdown, /Status: PASS - 0 new drafts/);
  assert.match(markdown, /Result: 102 passed, 0 failed/);
  assert.match(markdown, /Manual publication, Telegram API send/);
  assert.doesNotMatch(markdown, /accounts\.binance\.com|partner\.bitget|okx\.com\/join|backpack\.exchange\/join/i);
});

test("Telegram manual pack audit is configurable by wave label and expected slot count", async () => {
  const result = await auditTelegramManualPack({
    packDir: wave18PackDir,
    waveLabel: "Wave18",
    expectedSlots: 6,
  });
  const markdown = renderTelegramManualPackAuditMarkdown(result);

  assert.equal(result.status, "PASS");
  assert.equal(result.waveLabel, "Wave18");
  assert.equal(result.expectedSlots, 6);
  assert.match(markdown, /# Wave18 Telegram manual pack audit/);
  assert.match(markdown, /6 Wave18 draft slots/);
});

test("Telegram manual pack audit writer emits JSON and markdown evidence without sending", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "telegram-pack-evidence-"));
  const jsonPath = path.join(tmp, "audit.json");
  const mdPath = path.join(tmp, "audit.md");

  const result = await writeTelegramManualPackAudit({ packDir: wave18PackDir, output: jsonPath, markdown: mdPath, waveLabel: "Wave18", expectedSlots: 6 });
  const json = JSON.parse(await fs.readFile(jsonPath, "utf8"));
  const markdown = await fs.readFile(mdPath, "utf8");
  const rendered = renderTelegramManualPackAuditMarkdown(result);

  assert.equal(result.status, "PASS");
  assert.equal(result.waveLabel, "Wave18");
  assert.equal(json.status, "PASS");
  assert.match(markdown, /No Telegram API call/);
  assert.match(markdown, /anonymous/i);
  assert.equal(markdown, rendered);
});

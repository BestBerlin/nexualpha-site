import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildTreasuryEvidenceChecklist,
  createTreasuryEvidenceStates,
  setTreasuryEvidenceStatus,
  summarizeTreasuryEvidenceStates,
  TREASURY_EVIDENCE_STEPS,
} from "../src/data/treasury-evidence-checklist.js";
import sourceAsset from "../public/research/wave48-tokenized-treasury-rights-ops.json" with { type: "json" };

const root = fileURLToPath(new URL("..", import.meta.url));
const sourcePath = new URL("../public/research/wave48-tokenized-treasury-rights-ops.json", import.meta.url);

test("Treasury evidence model preserves the historical source snapshot exactly", async () => {
  const before = await readFile(sourcePath, "utf8");
  const model = buildTreasuryEvidenceChecklist(sourceAsset, "zh-Hans");
  const after = await readFile(sourcePath, "utf8");

  assert.equal(before, after);
  assert.equal(model.available, true);
  assert.equal(model.products.length, 5);
  assert.equal(model.checkedAt, "2026-09-15");
  assert.equal(model.steps.length, 4);

  const ustb = model.products.find((product) => product.id === "superstate-invesco-ustb");
  assert.ok(ustb);
  assert.equal(ustb.checkedAt, "2026-09-15");
  assert.equal(ustb.sourceUrl, "https://superstate.com/assets/ustb");
  assert.equal(ustb.evidence.issuer.excerpt[0].field, "legalClaimOrIssuerSpv");
  assert.equal(ustb.evidence.issuer.excerpt[0].text, sourceAsset.products[0].legalClaimOrIssuerSpv);
  assert.equal(ustb.evidence.issuer.excerpt[1].field, "eligibilityJurisdiction");
  assert.equal(ustb.evidence.redemption.excerpt[0].text, sourceAsset.products[0].redemption);
  assert.equal(ustb.evidence.recordkeeper.excerpt[0].text, sourceAsset.products[0].recordkeeper);
  assert.deepEqual(ustb.evidence.custody.excerpt.filter((item) => item.field === "unknownsLimits").map((item) => item.text), sourceAsset.products[0].unknownsLimits);
  assert.match(ustb.evidence.issuer.excerpt[0].label, /英文历史原文/);
});

test("Treasury evidence states support legal transitions, undo, clear and product-switch reset", () => {
  const initial = createTreasuryEvidenceStates();
  assert.deepEqual(Object.values(initial), ["pending", "pending", "pending", "pending"]);
  assert.deepEqual(summarizeTreasuryEvidenceStates(initial), {
    total: 4,
    read: 0,
    pending: 4,
    uncertain: 0,
    allRead: false,
    nextStepId: "issuer",
  });

  const readIssuer = setTreasuryEvidenceStatus(initial, "issuer", "read");
  assert.equal(readIssuer.issuer, "read");
  assert.equal(summarizeTreasuryEvidenceStates(readIssuer).nextStepId, "redemption");

  const uncertainIssuer = setTreasuryEvidenceStatus(readIssuer, "issuer", "uncertain");
  assert.equal(uncertainIssuer.issuer, "uncertain");
  assert.equal(summarizeTreasuryEvidenceStates(uncertainIssuer).uncertain, 1);

  const undone = setTreasuryEvidenceStatus(uncertainIssuer, "issuer", "pending");
  assert.equal(undone.issuer, "pending");
  assert.deepEqual(createTreasuryEvidenceStates(), initial);

  const productSwitchReset = createTreasuryEvidenceStates();
  assert.deepEqual(productSwitchReset, initial);
});

test("Treasury evidence model fails closed for missing fields, invalid source/date and unsafe keys", () => {
  const [record] = sourceAsset.products;
  const badDate = buildTreasuryEvidenceChecklist([{ ...record, checkedAt: "2026-13-99" }]);
  const badSource = buildTreasuryEvidenceChecklist([{ ...record, sourceUrl: "http://example.com" }]);
  const badSourceWithHash = buildTreasuryEvidenceChecklist([{ ...record, sourceUrl: "https://example.com/path#fake-anchor" }]);
  const badSourceWithCredentials = buildTreasuryEvidenceChecklist([{ ...record, sourceUrl: "https://user:pass@example.com/path" }]);
  const emptyEvidence = buildTreasuryEvidenceChecklist([{ ...record, sourceEvidence: [] }]);
  const malformedScalarArray = buildTreasuryEvidenceChecklist([{ ...record, redemption: ["claim", 42] }]);
  const partialStringArray = buildTreasuryEvidenceChecklist([{ ...record, unknownsLimits: ["valid", 42] }]);
  const duplicateProductIds = buildTreasuryEvidenceChecklist([record, { ...sourceAsset.products[1], id: record.id }]);
  const missingField = buildTreasuryEvidenceChecklist([{ ...record, redemption: "" }]);
  const badKey = buildTreasuryEvidenceChecklist([{ ...record, constructor: "bad" }]);
  const noProducts = buildTreasuryEvidenceChecklist({ products: null });

  for (const model of [badDate, badSource, badSourceWithHash, badSourceWithCredentials, emptyEvidence, malformedScalarArray, partialStringArray, duplicateProductIds, missingField, badKey, noProducts]) {
    assert.equal(model.available, false);
    assert.equal(model.products.length, 0);
  }

  const allPendingEvenWhenAskedToRead = createTreasuryEvidenceStates("read");
  assert.deepEqual(Object.values(allPendingEvenWhenAskedToRead), ["pending", "pending", "pending", "pending"]);

  const partlyRead = setTreasuryEvidenceStatus(createTreasuryEvidenceStates(), "issuer", "read");
  assert.equal(setTreasuryEvidenceStatus(partlyRead, "issuer", "approved").issuer, "read");
  assert.equal(setTreasuryEvidenceStatus(partlyRead, "not-a-step", "read").issuer, "read");
  assert.equal(setTreasuryEvidenceStatus({ ...partlyRead, extra: "read" }, "redemption", "read").extra, undefined);
});

test("Treasury evidence component SSR appears only on tokenized Treasuries for exact EN/SC locales", async () => {
  const dir = await mkdtemp(path.join(root, "tests/.tmp-r102-treasury-"));
  try {
    const entry = path.join(dir, "entry.mjs");
    const bundle = path.join(dir, "bundle.cjs");
    await writeFile(entry, `import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server';
      import {TokenizedAssetsPage} from '../../src/components/v3/TokenizedAssetsPage.jsx';
      const cases = {
        en: renderToStaticMarkup(React.createElement(TokenizedAssetsPage, {slug: 'tokenized-treasuries', locale: 'en'})),
        zh: renderToStaticMarkup(React.createElement(TokenizedAssetsPage, {slug: 'tokenized-treasuries', locale: 'zh-Hans'})),
        frFallback: renderToStaticMarkup(React.createElement(TokenizedAssetsPage, {slug: 'tokenized-treasuries', locale: 'fr'})),
        parent: renderToStaticMarkup(React.createElement(TokenizedAssetsPage, {slug: 'tokenized-assets', locale: 'en'})),
        sibling: renderToStaticMarkup(React.createElement(TokenizedAssetsPage, {slug: 'tokenized-stocks-vs-perpetuals', locale: 'en'})),
      };
      console.log(JSON.stringify(cases));`);
    await build({
      entryPoints: [entry],
      bundle: true,
      platform: "node",
      format: "cjs",
      outfile: bundle,
      loader: { ".css": "empty", ".json": "json" },
      logLevel: "silent",
    });
    const rendered = JSON.parse(execFileSync(process.execPath, [bundle], { encoding: "utf8", maxBuffer: 6 * 1024 * 1024 }));

    assert.match(rendered.en, /Open Treasury evidence reading checklist/);
    assert.match(rendered.en, /2026-09-15 historical JSON snapshot/);
    assert.match(rendered.en, /USTB · Invesco Short Duration US Government Securities Fund/);
    assert.match(rendered.en, /name="treasury-evidence-product"/);
    assert.match(rendered.en, /autoComplete="off"|autocomplete="off"/i);
    assert.match(rendered.en, /Are tokenized Treasuries the same as holding Treasury bills directly/);
    assert.match(rendered.en, /Official and first-party citations/);
    assert.doesNotMatch(rendered.en, /approved|safe to invest|qualified to invest/i);

    assert.match(rendered.zh, /打开代币化美债证据阅读清单/);
    assert.match(rendered.zh, /英文历史原文/);
    assert.match(rendered.zh, /代币化美债等于直接持有美国国债吗/);

    assert.doesNotMatch(rendered.frFallback, /Treasury evidence reading checklist|代币化美债证据阅读清单/);
    assert.doesNotMatch(rendered.parent, /Treasury evidence reading checklist|代币化美债证据阅读清单/);
    assert.doesNotMatch(rendered.sibling, /Treasury evidence reading checklist|代币化美债证据阅读清单/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Treasury evidence steps remain the bounded four-dimension contract", () => {
  assert.deepEqual(TREASURY_EVIDENCE_STEPS.map((step) => [step.id, step.fields]), [
    ["issuer", ["legalClaimOrIssuerSpv", "eligibilityJurisdiction"]],
    ["redemption", ["redemption"]],
    ["recordkeeper", ["recordkeeper"]],
    ["custody", ["custody", "unknownsLimits"]],
  ]);
});

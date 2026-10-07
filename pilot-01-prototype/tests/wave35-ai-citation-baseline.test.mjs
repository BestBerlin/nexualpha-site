import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";

const artifactUrl = new URL("../docs/evidence/ai-citation-baseline-wave35-20260915.json", import.meta.url);
const markdownUrl = new URL("../docs/evidence/ai-citation-baseline-wave35-20260915.md", import.meta.url);
const expectedPartnerSha = "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a";

test("wave35 AI citation baseline records the fixed 20-question query set", async () => {
  const artifact = JSON.parse(await readFile(artifactUrl, "utf8"));

  assert.equal(artifact.id, "wave35-ai-citation-baseline-20260915");
  assert.equal(artifact.sourceQuerySet, "docs/strategy/aeo-first-20-publication-map-20260914.md");
  assert.equal(artifact.partnerRegistrySha256, expectedPartnerSha);
  assert.match(artifact.boundary, /does not claim Google Search Console impressions/);
  assert.match(artifact.boundary, /invitation-link alternates/);
  assert.equal(artifact.queries.length, 20);
  assert.equal(artifact.summary.queryCount, 20);
  assert.equal(artifact.summary.publicWebChecks, 20);
  assert.equal(artifact.summary.nexuAlphaAppearedInCapturedWebResults, 0);
  assert.equal(artifact.currentRouteInventory.buildId, "3.0-20260915T074534");

  const numbers = artifact.queries.map((entry) => entry.number);
  assert.deepEqual(numbers, Array.from({ length: 20 }, (_, index) => index + 1));

  for (const entry of artifact.queries) {
    assert.ok(entry.registryId, `missing registryId for #${entry.number}`);
    assert.ok(entry.query, `missing query for #${entry.number}`);
    assert.ok(entry.existingCarrierFromPublicationMap, `missing carrier for #${entry.number}`);
    assert.ok(Array.isArray(entry.checks), `missing checks for #${entry.number}`);
    assert.equal(entry.checks.length, 4, `expected web + three answer-engine checks for #${entry.number}`);

    const webCheck = entry.checks.find((check) => check.platform === "search_engine_web");
    assert.ok(webCheck, `missing web check for #${entry.number}`);
    assert.equal(webCheck.nexuAlphaCited, "no");
    assert.equal(webCheck.exactQuery, entry.query);
    assert.ok(webCheck.resultBoundary.includes("not a full rank"));
    assert.ok(webCheck.dominantSources.length >= 2, `expected multiple sources for #${entry.number}`);
    for (const source of webCheck.dominantSources) {
      assert.match(source.url, /^https:\/\//, `source URL must be public https for #${entry.number}`);
      assert.ok(source.domain, `missing source domain for #${entry.number}`);
      assert.ok(source.sourceType, `missing source type for #${entry.number}`);
      assert.ok(source.snippetBoundary, `missing snippet boundary for #${entry.number}`);
    }

    const unknownChecks = entry.checks.filter((check) => check.surface === "answer_engine");
    assert.equal(unknownChecks.length, 3, `expected three UNKNOWN answer engines for #${entry.number}`);
    for (const check of unknownChecks) {
      assert.equal(check.nexuAlphaCited, "unknown");
      assert.equal(check.availability, "UNKNOWN");
      assert.match(check.reason, /No public, reproducible citation surface/);
    }
  }

  const currentIndexedRegional = new Map([
    ["hk-residence-platform", ["/hk", "indexable: en"]],
    ["eu-mica-register", ["/eu", "indexable: en"]],
    ["uk-fca-register", ["/uk", "indexable: en"]],
    ["jp-fsa-register", ["/jp", "indexable: ja"]],
    ["kr-regulatory-context", ["/kr", "indexable: ko"]],
    ["tr-spk-register", ["/tr/markets/turkiye", "indexable: tr"]],
  ]);
  for (const [registryId, [carrier, status]] of currentIndexedRegional) {
    const entry = artifact.queries.find((query) => query.registryId === registryId);
    assert.equal(entry.currentCarrier, carrier);
    assert.equal(entry.currentIndexStatus, status);
  }
});

test("wave35 Markdown report mirrors the artifact boundary and summary", async () => {
  const markdown = await readFile(markdownUrl, "utf8");

  assert.match(markdown, /Wave35 AI citation baseline/);
  assert.match(markdown, /No production deployment/);
  assert.match(markdown, /NexuAlpha appearances in captured web results \| 0 \/ 20/);
  assert.match(markdown, /ChatGPT, Perplexity and Gemini/);
  assert.match(markdown, /\/hk`, `\/eu`, `\/uk`, `\/jp` and `\/kr` are now indexable/);
  assert.match(markdown, new RegExp(expectedPartnerSha));
});

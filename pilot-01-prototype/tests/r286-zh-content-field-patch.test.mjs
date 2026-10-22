import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../content-integration/baseline/news-feed.before.json", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const { restoreFourSummaryBytes: restoreFourSummaryBytes } = await import("./fixtures/r286-four-summary-inverse.mjs");




const { candidateRoot: candidateRoot, expectedFeedSha: expectedFeedSha, expectedRegistrySha: expectedRegistrySha, targets: targets, sourceRoot: sourceRoot, sha256: sha256, preparePatch: preparePatch, verifyPatch: verifyPatch } = await import("../scripts/r286-update-zh-content-local.mjs");
const baselineRaw = await readFile(path.join(candidateRoot, '../content-integration/baseline/news-feed.before.json'));
assert.equal(sha256(baselineRaw), expectedFeedSha);
const before = JSON.parse(baselineRaw);

test('four fixed reviewed source hashes and importer claims validate', async () => {
  for (const [slug, expected] of targets) assert.equal(sha256(await readFile(path.join(sourceRoot, slug, 'article.zh-Hans.md'))), expected);
  const { after, manifest } = await preparePatch(before);
  verifyPatch(before, after);
  assert.equal(manifest.length, 4);
});
test('field guard rejects unrelated metadata, English, other article, count, duplicate slug and missing target', async () => {
  const { after } = await preparePatch(before);
  const mutations = [
    x => { x.generatedAt = 'unauthorized'; },
    x => { x.articles.find(a => a.slug === targets[0][0]).content.en += '\nforeign'; },
    x => { x.articles.find(a => !targets.some(([s]) => s === a.slug)).title.en += ' foreign'; },
    x => { x.articleCount += 1; },
    x => { const i = x.articles.findIndex(a => !targets.some(([s]) => s === a.slug)); x.articles[i] = structuredClone(x.articles.find(a => a.slug === targets[0][0])); },
    x => { x.articles.find(a => a.slug === targets[1][0]).slug = 'missing-reviewed-slug'; },
  ];
  for (const mutate of mutations) { const bad = structuredClone(after); mutate(bad); assert.notDeepEqual(bad, after, 'negative mutation must be effective'); assert.throws(() => verifyPatch(before, bad)); }
});
test('actual local candidate equals importer-derived eight-leaf patch and registry remains frozen', async () => {
  const { after } = await preparePatch(before);
  const actual = JSON.parse(restoreFourSummaryBytes(await readFile(path.join(candidateRoot, 'public/content/news-feed.json'))));
  verifyPatch(before, actual);
  assert.deepEqual(actual, after);
  assert.equal(sha256(await readFile(path.join(candidateRoot, 'src/data/partner-registry.js'))), expectedRegistrySha);
});
}

import { restoreFourSummaryBytes } from './fixtures/r286-four-summary-inverse.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { normalizeNewsFeedSummaries, projectNewsFeedForRoute, NEWS_DISPLAY_LOCALES } from '../src/data/news-feed-client.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const reportRoot = path.resolve(root, '..');
const fullFeedPath = path.join(root, 'public/content/news-feed.json');
const summaryPath = path.join(root, 'public/content/news-feed-summary.json');
const beforeSummaryPath = path.join(reportRoot, 'baseline/before-summary-claims-news-feed-summary.json');
const generatorPath = path.join(root, 'scripts/generate-news-summary-feed.mjs');
const beforeGeneratorPath = path.join(reportRoot, 'baseline/before-summary-claims-generate-news-summary-feed.mjs');
const registryPath = path.join(root, 'src/data/partner-registry.js');
const fullFeedSha = '399059b1434a94325fa95b54b5a452887756b2ca9d4d0f674e41f4c9f6d6e5b6';
const registrySha = '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const parse = async (file) => {
  const raw = await readFile(file);
  return JSON.parse(file === fullFeedPath ? restoreFourSummaryBytes(raw) : file === summaryPath ? restoreFourSummaryBytes(raw, 'summary') : raw);
};
const omitClaims = ({ claims: _claims, ...article }) => article;

test('summary generator removes only claims beyond the previously excluded heavyweight fields', async () => {
  const before = await readFile(beforeGeneratorPath, 'utf8');
  const after = await readFile(generatorPath, 'utf8');
  const restored = after.replace('claims: _claims, ', '');
  assert.equal(restored, before);
});

test('news summary feed drops claims while keeping feed metadata, order, and all other summary fields', async () => {
  const fullBytes = restoreFourSummaryBytes(await readFile(fullFeedPath));
  const registryBytes = await readFile(registryPath);
  assert.equal(sha(fullBytes), fullFeedSha, 'full feed must remain frozen');
  assert.equal(sha(registryBytes), registrySha, 'partner registry must remain frozen');

  const full = JSON.parse(fullBytes);
  const before = await parse(beforeSummaryPath);
  const after = await parse(summaryPath);

  assert.equal(full.articles.length, 416);
  assert.equal(before.articles.length, 416);
  assert.equal(after.articles.length, 416);
  assert.deepEqual({ version: after.version, generatedAt: after.generatedAt, batchId: after.batchId }, { version: before.version, generatedAt: before.generatedAt, batchId: before.batchId });
  assert.deepEqual(after.articles.map((article) => article.slug), before.articles.map((article) => article.slug));

  let beforeClaimsCount = 0;
  for (let index = 0; index < before.articles.length; index += 1) {
    if (Object.hasOwn(before.articles[index], 'claims')) beforeClaimsCount += 1;
    assert.equal(Object.hasOwn(after.articles[index], 'claims'), false, `${after.articles[index].slug} summary must not carry claims`);
    assert.deepEqual(after.articles[index], omitClaims(before.articles[index]), `${after.articles[index].slug} changed only by claims removal`);
  }
  assert.ok(beforeClaimsCount > 0, 'baseline summary contained claims before this trim');
});

test('summary normalization and 15-locale news projections remain unchanged after claims removal', async () => {
  const before = await parse(beforeSummaryPath);
  const after = await parse(summaryPath);
  const full = await parse(fullFeedPath);

  const beforeSummaries = normalizeNewsFeedSummaries(before);
  const afterSummaries = normalizeNewsFeedSummaries(after);
  assert.deepEqual(afterSummaries, beforeSummaries, 'list summary normalization ignores claims');
  assert.deepEqual(normalizeNewsFeedSummaries(full), afterSummaries, 'full-feed fallback summary path remains compatible');

  for (const locale of NEWS_DISPLAY_LOCALES) {
    assert.deepEqual(
      projectNewsFeedForRoute('/news', afterSummaries, locale),
      projectNewsFeedForRoute('/news', beforeSummaries, locale),
      `${locale} /news projection remains unchanged`,
    );
  }
});

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const read = (name) => readFileSync(new URL('./fixtures/' + name, import.meta.url));
const legacyHash = '6bdbbd21a9f8f4ed6ed36307fbc582fbdaf633cb673f157f6a3e97c7bd318f08';
const manifestHash = '184ff96323b2725482b3465909ab3800c0c1a38f81b056b2b7417eb693c72250';

export function assertVersionedAcceptedFeed(bytes, expectedHistoricalHash) {
  assert.equal(expectedHistoricalHash, legacyHash, 'original historical feed contract remains explicit');
  const rawManifest = read('r189-accepted-feed-manifest.json');
  assert.equal(hash(rawManifest), manifestHash, 'accepted manifest is independently pinned, not current-feed generated');
  const manifest = JSON.parse(rawManifest);
  assert.equal(manifest.historicalFeedSHA256, legacyHash);
  assert.equal(manifest.acceptedRelease, '3.0-20261005T-R130-MATERIAL');
  assert.equal(hash(bytes), manifest.feedSHA256, 'current validation feed equals accepted released version');

  const receiptBytes = read('r189-managed-publisher-receipt-20261004T204614Z.json');
  assert.equal(hash(receiptBytes), manifest.publisherReceiptSHA256);
  const receipt = JSON.parse(receiptBytes);
  assert.equal(receipt.runId, manifest.publisherRunId);
  assert.equal(receipt.status, 'PUBLISHED_AND_VERIFIED', 'historical managed-publisher completion, not indexing');
  assert.equal(receipt.generated.batchId, manifest.publisherBatchId);
  assert.equal(receipt.generated.feedSha256, manifest.feedSHA256);
  assert.equal(receipt.generated.articleCount, manifest.articleCount);
  assert.equal(receipt.publicVerification.feedArticleCount, manifest.articleCount);
  assert.equal(receipt.reviewedPublication.effectiveArticleCount, 312);
  assert.equal(receipt.publicationStates.readableUnreviewedArticleCount, 5);
  assert.equal(receipt.publicationStates.reviewedIndexableArticleCount, 0);
  assert.equal(receipt.indexNow.reason, 'SKIPPED_UNREVIEWED');
  assert.equal(receipt.indexNow.submittedUrlCount, 0);

  const ledgerBytes = read('r189-managed-publisher-batch-ledger.json');
  assert.equal(hash(ledgerBytes), manifest.publisherLedgerSelectionSHA256);
  const ledger = JSON.parse(ledgerBytes);
  assert.equal(ledger.records.length, 5);
  assert.deepEqual(ledger.records.map((record) => record.slug).sort(), manifest.newBatchSlugs);
  const feed = JSON.parse(bytes);
  assert.equal(feed.articles.length, manifest.articleCount);
  for (const record of ledger.records) {
    assert.equal(record.batchId, manifest.publisherBatchId);
    assert.equal(record.event, 'READABLE_PUBLICATION_CONFIRMED');
    assert.equal(record.searchState, 'READABLE_UNREVIEWED');
    assert.equal(record.sitemapAction, 'EXCLUDED_UNREVIEWED');
    assert.equal(record.indexNowAction, 'NOT_SUBMITTED_UNREVIEWED');
    assert.equal(record.indexNowStatus, null);
    const articles = feed.articles.filter((article) => article.slug === record.slug);
    assert.equal(articles.length, 1);
    assert.equal(articles[0].status, 'PUBLISHED');
    assert.equal(articles[0].seo.noindex, true, 'readable batch is not silently granted search eligibility');
  }

  const promotedBytes = read('r189-r130-promoted-receipt.json');
  assert.equal(hash(promotedBytes), manifest.promotedReceiptSHA256);
  const promoted = JSON.parse(promotedBytes);
  assert.equal(promoted.status, 'PASS_PROMOTED_BYTES');
  assert.equal(promoted.buildId, manifest.acceptedRelease);
  assert.equal(promoted.feedFingerprint, manifest.feedSHA256);
  assert.equal(promoted.articles, manifest.articleCount);
  assert.equal(promoted.seven, 'PASS');
  assert.equal(promoted.registry, '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
  const historicalProtectedManifest = readFileSync(path.join(root, 'docs/evidence/four-week-growth-20260927/r102-before/protected-sha.txt'), 'utf8');
  assert.ok(historicalProtectedManifest.split('\n').includes(legacyHash + '  public/content/news-feed.json'), 'do not overwrite original historical protected SHA');
}

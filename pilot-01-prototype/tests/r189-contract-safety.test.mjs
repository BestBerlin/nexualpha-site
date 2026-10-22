import { existsSync as historicalFixtureExists } from 'node:fs';
// Only historical comparisons need this external review snapshot. Local checks run.
const historicalFixture = new URL("../../../../release-candidates/r128-home-mobile/candidate/src/components/v3/TopicGuidePage.jsx", import.meta.url);
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { acceptedTopicPresentation, assertApprovedResearchMove } from './r189-presentation-contract.mjs';
import { assertVersionedAcceptedFeed } from './r189-feed-contract.mjs';

const read = (relative) => readFileSync(new URL('../' + relative, import.meta.url));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('complete approved Topic presentation reconstructs original pinned source chain and current is exact accepted peer', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
  const accepted = acceptedTopicPresentation();
  assert.equal(read('src/components/v3/TopicGuidePage.jsx').toString(), accepted);
  assert.equal(hash(accepted), 'caa128a549fc3acb2dc598b3cae5afe9e56ee336480dcdc0446248127cb7b61d');
});

for (const locale of ['en', 'zh-Hans', 'zh-Hant']) {
  test(locale + ': only one approved three-link move is allowed; rewritten/missing/duplicated/unrelated reordered links fail', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
    const fixtures = JSON.parse(read('docs/evidence/four-week-growth-20260927/r96-before/topic-render-hrefs.json'));
    const original = fixtures[locale].map((href) => href.replace(/([?&]|&amp;)tg_expires=\d+/g, '$1tg_expires=DYNAMIC'));
    const current = [...original];
    const group = current.splice(7, 3);
    current.splice(19, 0, ...group);
    assertApprovedResearchMove(current, original, locale);
    const changed = [...current]; changed[20] += '?ref=changed';
    assert.throws(() => assertApprovedResearchMove(changed, original, locale));
    const missing = [...current]; missing.splice(19, 1);
    assert.throws(() => assertApprovedResearchMove(missing, original, locale));
    const duplicated = [...current, ...group];
    assert.throws(() => assertApprovedResearchMove(duplicated, original, locale));
    const reordered = [...current]; [reordered[1], reordered[2]] = [reordered[2], reordered[1]];
    assert.throws(() => assertApprovedResearchMove(reordered, original, locale));
    const wrongPlacement = [...original];
    assert.throws(() => assertApprovedResearchMove(wrongPlacement, original, locale));
  });
}

test('versioned feed requires original managed publisher receipt, unreviewed/search boundaries and accepted promotion identity', () => {
  const bytes = read('public/content/news-feed.json');
  const legacy = '6bdbbd21a9f8f4ed6ed36307fbc582fbdaf633cb673f157f6a3e97c7bd318f08';
  assertVersionedAcceptedFeed(bytes, legacy);
  assert.throws(() => assertVersionedAcceptedFeed(bytes, 'unproven historical hash'));
  const feed = JSON.parse(bytes); feed.articles[0].title += ' unauthorized';
  assert.throws(() => assertVersionedAcceptedFeed(Buffer.from(JSON.stringify(feed)), legacy));
  const eligibility = JSON.parse(bytes); eligibility.articles.find((item) => item.slug === 'coinbase-advanced-trade-create-order-auth-reconciliation-checklist').seo.noindex = false;
  assert.throws(() => assertVersionedAcceptedFeed(Buffer.from(JSON.stringify(eligibility)), legacy));
});

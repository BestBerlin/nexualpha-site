import { topicFaqSchemaEntries } from '../src/data/topic-source-registry.js';
import { budgetTitle } from '../src/data/meta-description.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeRouteSeo } from '../src/data/seo-injection.js';
import { TOPIC_GUIDES } from '../src/data/topic-guides-data.js';

const forbiddenCommercialClaims = /\b(guaranteed|lowest|best|risk-free|commission|rebate|entitlement|always available|highest leverage|返佣|稳赚|无风险|最低|最高)\b/i;

function schemaOf(seo, type) {
  return seo.schemas.find((schema) => schema['@type'] === type);
}

test('Wave24 derivatives topic owns broad crypto perpetual platform intent', () => {
  const seo = computeRouteSeo({ url: '/topics/derivatives' });
  const collection = schemaOf(seo, 'CollectionPage');
  const faq = schemaOf(seo, 'FAQPage');
  const serialized = JSON.stringify([collection, faq]);

  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.equal(seo.title, budgetTitle('Crypto Perpetual Platform Comparison: Fees, Funding and Liquidation Checks — NexuAlpha'));
  assert.match(seo.description, /published fees, funding, margin mode, liquidation rules, oracle route/i);
  assert.equal(collection.dateModified, '2026-09-22');
  assert.ok(collection.relatedLink.includes('https://nexualpha.com/compare/hyperliquid-vs-dydx'));
  assert.ok(collection.relatedLink.includes('https://nexualpha.com/news/hyperliquid-vs-dydx'));
  assert.ok(collection.relatedLink.includes('https://nexualpha.com/compare/binance-vs-okx'));
  assert.ok(collection.relatedLink.includes('https://nexualpha.com/compare/bybit-vs-bitget'));
  assert.ok(collection.relatedLink.includes('https://nexualpha.com/exchanges/hyperliquid'));
  assert.ok(collection.relatedLink.includes('https://nexualpha.com/exchanges/binance'));
  assert.deepEqual(faq.mainEntity, topicFaqSchemaEntries('derivatives', 'en'));
  assert.match(JSON.stringify(faq), /funding, collateral, margin and liquidation documentation/);
  assert.match(JSON.stringify(faq), /official fees and access terms/);
  assert.ok(faq.mainEntity.every(item => item.acceptedAnswer.citation?.length >= 1));
  assert.match(serialized, /https:\/\/www\.binance\.com/);
  assert.match(serialized, /https:\/\/www\.bybit\.com/);
  assert.match(serialized, /https:\/\/hyperliquid\.gitbook\.io\/hyperliquid-docs/);
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims);
});

test('Wave24 derivatives visible topic copy is a checklist, not a promise-led ranking page', () => {
  const topic = TOPIC_GUIDES.derivatives;
  const visibleDecisionText = JSON.stringify({
    titleEn: topic.titleEn,
    metaTitleEn: topic.metaTitleEn,
    descEn: topic.descEn,
    pillsEn: topic.pillsEn,
    quickStats: topic.quickStats.map((stat) => ({ labelEn: stat.labelEn, descEn: stat.descEn })),
    painPoints: topic.painPoints.map((point) => ({ titleEn: point.titleEn, descEn: point.descEn })),
    evaluationPillars: topic.evaluationPillars.map((pillar) => ({ titleEn: pillar.titleEn, descEn: pillar.descEn })),
    platformHighlights: topic.platforms.map((platform) => ({
      slug: platform.slug,
      badgeEn: platform.badgeEn,
      highlightEn: platform.highlightEn,
    })),
    searchAnswer: topic.searchAnswer,
    pitfalls: topic.pitfalls.map((pitfall) => ({ titleEn: pitfall.titleEn })),
    faqs: topic.faqs.map((faq) => ({ qEn: faq.qEn, aEn: faq.aEn })),
  });

  assert.match(topic.titleEn, /Crypto Perpetual Platform Comparison/);
  assert.match(topic.descEn, /published fees, funding, margin mode, liquidation rules, oracle route/i);
  assert.match(topic.searchAnswer.titleEn, /choose a crypto perpetual platform/i);
  assert.match(topic.searchAnswer.bodyEn, /CEX futures account, wallet-connected Perp DEX, options\/perps specialist venue, or GMX-style pool route/i);
  assert.match(topic.searchAnswer.bodyEn, /official account or wallet flow/i);
  assert.match(topic.searchAnswer.bodyEn, /entry, holding, exit and failure-path checks/i);
  assert.match(topic.searchAnswer.bulletsEn.join('\n'), /Spot is asset exchange; futures have expiry; options price a right; perpetuals roll exposure through funding and margin/);
  assert.match(topic.searchAnswer.bulletsEn.join('\n'), /Wallet routes add collateral, bridge, signature and front-end availability checks/);
  assert.match(topic.searchAnswer.sourceNoteEn, /canonical checklist/);
  assert.match(visibleDecisionText, /official fee table/);
  assert.match(visibleDecisionText, /identity requirements/);
  assert.match(visibleDecisionText, /Account, region and product eligibility/);
  assert.match(visibleDecisionText, /Compare with dYdX for wallet-connected perps/);
  assert.match(visibleDecisionText, /A public comparison cannot replace the official account flow/);
  assert.doesNotMatch(visibleDecisionText, forbiddenCommercialClaims);
});

test('Wave24 derivatives commands do not claim live fees or trading returns', () => {
  const commands = TOPIC_GUIDES.derivatives.telegramCommands
    .map((item) => `${item.descZh}\n${item.descEn}`)
    .join('\n');

  assert.doesNotMatch(commands, /real-time|APY|annualized return|年化收益|负费率/i);
  assert.match(commands, /published futures fee benchmarks|scenario calculator/);
});

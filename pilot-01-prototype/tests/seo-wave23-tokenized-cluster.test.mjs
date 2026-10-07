import test from 'node:test';
import assert from 'node:assert/strict';
import feed from '../public/content/news-feed.json' with { type: 'json' };
import { computeRouteSeo } from '../src/data/seo-injection.js';

const forbiddenCommercialClaims = /\b(guaranteed|lowest|best|free money|risk-free|always available|commission|返佣|direct ownership guarantee|yield guarantee)\b/i;

function schemaOf(seo, type) {
  return seo.schemas.find((schema) => schema['@type'] === type);
}

test('Wave23 tokenized assets hub routes Treasury demand to topic and dated article without title churn', () => {
  const seo = computeRouteSeo({ url: '/topics/tokenized-assets' });
  const collection = schemaOf(seo, 'CollectionPage');
  const faq = schemaOf(seo, 'FAQPage');
  const serialized = JSON.stringify([collection, faq]);

  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.equal(seo.title, 'Tokenized Assets Hub: Treasury, Stock and Perp Exposure Checks — NexuAlpha');
  assert.ok(collection.relatedLink.includes('https://nexualpha.com/topics/tokenized-treasuries'));
  assert.ok(collection.relatedLink.includes('https://nexualpha.com/news/tokenized-treasuries-structure-access-risks'));
  assert.match(serialized, /Where should a tokenized Treasury search continue from the hub/);
  assert.match(serialized, /dated news explainer/);
  assert.match(serialized, /BUIDL, BENJI, OUSG-style exposure/);
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims);
});

test('Wave23 tokenized Treasuries topic separates evergreen checklist from article intent', () => {
  const seo = computeRouteSeo({ url: '/topics/tokenized-treasuries' });
  const collection = schemaOf(seo, 'CollectionPage');
  const faq = schemaOf(seo, 'FAQPage');
  const serialized = JSON.stringify([collection, faq]);

  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.equal(seo.title, 'Tokenized Treasury Checklist: BUIDL, OUSG, BENJI, Redemption and Custody — NexuAlpha');
  assert.ok(collection.relatedLink.includes('https://nexualpha.com/news/tokenized-treasuries-structure-access-risks'));
  assert.ok(collection.relatedLink.includes('https://nexualpha.com/topics/tokenized-assets'));
  assert.match(serialized, /Should a tokenized Treasury query land on the article or the topic checklist/);
  assert.match(serialized, /evergreen checklist/);
  assert.match(serialized, /issuer, recordkeeper, custody, redemption, chain and collateral checks/);
  assert.match(serialized, /https:\/\/securitize\.io\//);
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims);
});

test('Wave23 tokenized Treasuries article points to the cluster and keeps source boundaries', () => {
  const article = feed.articles.find((item) => item.slug === 'tokenized-treasuries-structure-access-risks');
  assert.ok(article, 'tokenized Treasuries article exists');
  assert.equal(article.seo.title, 'Tokenized Treasuries: BUIDL, BENJI, Ownership and Redemption Risks');
  assert.match(article.summary.en, /BUIDL and BENJI ownership records, eligibility, fees, wallet controls and redemption conditions/i);
  assert.match(article.seo.description, /ownership records, eligibility, fees, wallet controls and redemption conditions/i);
  assert.ok(article.seo.internalLinkTargets.includes('/topics/tokenized-assets'));
  assert.ok(article.seo.internalLinkTargets.includes('/topics/tokenized-treasuries'));
  assert.ok(article.seo.internalLinkTargets.includes('/factbook/coinbase'));
  assert.ok(article.seo.internalLinkTargets.includes('/factbook/kraken'));
  assert.match(article.content.en, /## How this connects inside NexuAlpha/i);
  assert.match(article.content.en, /tokenized Treasuries topic\]\(\/topics\/tokenized-treasuries\)/i);
  assert.match(article.aeo.directAnswer, /not necessarily direct ownership of a Treasury security/i);
  assert.ok(article.aeo.answerBoundaries.includes('Use the topic checklist for evergreen comparison; use this article for the dated source trail behind BUIDL, BENJI and OUSG-style tokenized Treasury exposure.'));
  assert.ok(article.aeo.questions.includes('Should a tokenized Treasury searcher read the article or the topic checklist first?'));
  assert.match(article.geo.citationUse, /legal instrument, ownership register and redemption rights/i);
  assert.doesNotMatch(`${article.seo.title}\n${article.seo.description}\n${article.aeo.directAnswer}\n${article.content.en.slice(0, 1800)}`, forbiddenCommercialClaims);
});

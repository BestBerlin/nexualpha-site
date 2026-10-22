import { budgetTitle } from '../src/data/meta-description.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { routeMetadata } from '../worker/index.js';
import { computeRouteSeo } from '../src/data/seo-injection.js';

const forbiddenCommercialClaims = /\b(guaranteed|lowest|best|free money|risk-free|always available|guaranteed commission|guaranteed rebate|private commission|yield guarantee|direct ownership guarantee|返佣|稳赚|无风险)\b/i;

function faqSchema(seo) {
  return seo.schemas.find((schema) => schema['@type'] === 'FAQPage')
    || seo.schemas.find((schema) => schema.subjectOf?.['@type'] === 'FAQPage')?.subjectOf;
}

test('Wave26 Bybit vs Bitget owns stock-search decision intent without signup promises', () => {
  const seo = computeRouteSeo({ url: '/compare/bybit-vs-bitget?locale=en' });
  const page = seo.schemas.find((schema) => schema['@type'] === 'WebPage');
  const faq = faqSchema(seo);
  const serialized = JSON.stringify([page, faq]);

  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.match(seo.title, /Bybit vs Bitget: fees, KYC & rebates/);
  assert.match(serialized, /xStocks schedule/);
  assert.match(serialized, /Identity checks.*product permission/);
  assert.match(serialized, /Start by labeling the user path/);
  assert.match(serialized, /Bybit xStocks/);
  assert.match(serialized, /Bitget stock futures/);
  assert.match(serialized, /profit-sharing rules/);
  assert.ok(page.relatedLink.some((link) => link.endsWith('/topics/tokenized-stocks-vs-perpetuals')));
  assert.ok(page.relatedLink.some((link) => new URL(link).pathname === '/exchanges/bybit'));
  assert.ok(page.relatedLink.some((link) => new URL(link).pathname === '/exchanges/bitget'));
  assert.doesNotMatch(serialized, /nexu888|11350287|LUCKX|luckybitcoin|MOCK_EVENTS|"@type":"(?:Offer|FinancialProduct|AggregateRating)"/i);
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims);
});

test('Wave26 tokenized Treasury topic answers singular and plural demand with source boundaries', () => {
  const seo = computeRouteSeo({ url: '/topics/tokenized-treasuries' });
  const collection = seo.schemas.find((schema) => schema['@type'] === 'CollectionPage');
  const faq = faqSchema(seo);
  const serialized = JSON.stringify([collection, faq]);

  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.equal(seo.title, budgetTitle('Tokenized Treasury Checklist: BUIDL, OUSG, BENJI, Redemption and Custody — NexuAlpha'));
  assert.match(seo.description, /Tokenized treasury searches/i);
  assert.match(seo.description, /recordkeeper, custodian, redemption/);
  assert.match(serialized, /legal wrapper|recordkeeper|recordkeeping/);
  assert.match(serialized, /dated source trail behind BUIDL, BENJI and OUSG-style exposure/);
  assert.match(serialized, /issuer, custody, redemption, chain and collateral conditions/);
  assert.ok(collection.relatedLink.some((link) => link.endsWith('/news/tokenized-treasuries-structure-access-risks')));
  assert.ok(collection.relatedLink.some((link) => link.endsWith('/topics/tokenized-assets')));
  assert.match(serialized, /https:\/\/www\.sec\.gov\//);
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims);
});

test('Wave26 Worker metadata stays aligned for selected pages', async () => {
  for (const path of ['/compare/bybit-vs-bitget', '/topics/tokenized-treasuries']) {
    const client = computeRouteSeo({url:path});
    const worker = await routeMetadata(new URL(`https://nexualpha.com${path}`), {});
    assert.equal(worker.title, client.title, path);
    assert.equal(worker.description, client.description, path);
    const serialized = JSON.stringify(worker.schema);
    assert.match(serialized, path.startsWith('/compare') ? /copy trading/ : /legal wrapper|recordkeeper|recordkeeping/);
    assert.doesNotMatch(serialized, /private commission|guaranteed registration|guaranteed yield/i);
  }
});

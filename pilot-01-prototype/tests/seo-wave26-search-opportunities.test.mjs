import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { computeRouteSeo } from '../src/data/seo-injection.js';

const forbiddenCommercialClaims = /\b(guaranteed|lowest|best|free money|risk-free|always available|commission|rebate|private commission|yield guarantee|direct ownership guarantee|返佣|稳赚|无风险)\b/i;

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
  assert.match(seo.title, /Bybit vs Bitget Stocks, Copy Trading, Fees and Account Checks/);
  assert.match(seo.description, /xStocks fee schedule/);
  assert.match(seo.description, /account-route limits/);
  assert.match(serialized, /How should I compare Bybit and Bitget before choosing a platform/);
  assert.match(serialized, /Bybit xStocks/);
  assert.match(serialized, /Bitget stock futures/);
  assert.match(serialized, /profit-sharing rules/);
  assert.ok(page.relatedLink.some((link) => link.endsWith('/topics/tokenized-stocks-vs-perpetuals')));
  assert.ok(page.relatedLink.some((link) => link.endsWith('/factbook/bybit')));
  assert.ok(page.relatedLink.some((link) => link.endsWith('/factbook/bitget')));
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
  assert.equal(seo.title, 'Tokenized Treasury Checklist: BUIDL, OUSG, BENJI, Redemption and Custody — NexuAlpha');
  assert.match(seo.description, /tokenized treasury and tokenized treasuries searches/);
  assert.match(seo.description, /recordkeeper, custodian, redemption/);
  assert.match(serialized, /legal wrapper and recordkeeper/);
  assert.match(serialized, /dated source trail behind BUIDL, BENJI and OUSG-style exposure/);
  assert.match(serialized, /issuer, custody, redemption, chain and collateral conditions/);
  assert.ok(collection.relatedLink.some((link) => link.endsWith('/news/tokenized-treasuries-structure-access-risks')));
  assert.ok(collection.relatedLink.some((link) => link.endsWith('/topics/tokenized-assets')));
  assert.match(serialized, /https:\/\/www\.sec\.gov\//);
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims);
});

test('Wave26 Worker SEO mirror stays aligned for selected pages', async () => {
  const worker = await readFile(new URL('../worker/index.js', import.meta.url), 'utf8');
  const compareStart = worker.indexOf('Bybit vs Bitget Stocks, Copy Trading, Fees and Account Checks');
  const tokenizedStart = worker.indexOf('Tokenized Treasury Checklist: BUIDL, OUSG, BENJI, Redemption and Custody');
  assert.notEqual(compareStart, -1);
  assert.notEqual(tokenizedStart, -1);

  const compareSnippet = worker.slice(compareStart, compareStart + 4_000);
  const tokenizedSnippet = worker.slice(tokenizedStart, tokenizedStart + 3_000);

  assert.match(compareSnippet, /Bybit vs Bitget Stocks, Copy Trading, Fees and Account Checks/);
  assert.match(compareSnippet, /Start by labeling the product/);
  assert.match(compareSnippet, /\/topics\/tokenized-stocks-vs-perpetuals/);
  assert.match(compareSnippet, /\/factbook\/bybit/);
  assert.match(compareSnippet, /\/factbook\/bitget/);
  assert.match(tokenizedSnippet, /Tokenized Treasury Checklist: BUIDL, OUSG, BENJI, Redemption and Custody/);
  assert.match(tokenizedSnippet, /What should a tokenized treasury searcher check first/);
  assert.match(tokenizedSnippet, /When should I use the tokenized Treasuries article instead of this checklist/);
  assert.doesNotMatch(`${compareSnippet}
${tokenizedSnippet}`, /nexu888|11350287|LUCKX|luckybitcoin/);
});

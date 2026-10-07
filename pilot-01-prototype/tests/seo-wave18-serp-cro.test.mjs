import test from 'node:test';
import assert from 'node:assert/strict';
import { computeRouteSeo } from '../src/data/seo-injection.js';

const forbiddenCommercialClaims = /\b(guaranteed|lowest|best|free money|risk-free|always available|prop account allocation)\b/i;
const forbiddenSchema = /"@type":"(?:Offer|FinancialProduct|AggregateRating)"|SearchAction|MOCK_EVENTS|nexu888|11350287/i;

function faqSchema(seo) {
  return seo.schemas.find((schema) => schema['@type'] === 'FAQPage')
    || seo.schemas.find((schema) => schema.subjectOf?.['@type'] === 'FAQPage')?.subjectOf;
}

test('Wave18 on-chain venue pages expose deeper source-bound answers and next-step links', () => {
  const cases = [
    ['/exchanges/hyperliquid', '2026-09-22', /Fees, Funding, Funded Account and Vault Checks/, /account abstraction/, /liquidations|maintenance margin|vault-volume separation/, ['/compare/hyperliquid-vs-dydx', '/topics/no-kyc', '/exchanges/dydx']],
    ['/exchanges/uniswap', '2026-09-22', /Uniswap Testnet/, /official app and docs, API and web testnet scope/, /Ethereum Sepolia|official Uniswap app and docs first|token approvals remain on-chain/, ['/compare/uniswap-vs-jupiter', '/topics/no-kyc', '/exchanges/jupiter']],
    ['/exchanges/aerodrome', '2026-09-15', /Aerodrome Base DEX/, /Base bridge/, /standard or Slipstream/, ['/topics/no-kyc', '/exchanges/uniswap', '/exchanges/jupiter']],
    ['/exchanges/jupiter', '2026-09-15', /Jupiter Solana Swap Routes/, /priority fees/, /route legs/, ['/compare/uniswap-vs-jupiter', '/topics/no-kyc', '/exchanges/uniswap']],
  ];

  for (const [path, expectedDate, titlePattern, descriptionPattern, answerPattern, relatedPaths] of cases) {
    const seo = computeRouteSeo({ url: path });
    const page = seo.schemas.find((schema) => schema['@type'] === 'WebPage');
    const faq = faqSchema(seo);
    const serialized = JSON.stringify([page, faq]);

    assert.equal(seo.status, 200, path);
    assert.equal(seo.robots, 'index,follow', path);
    assert.match(seo.title, titlePattern, path);
    assert.match(seo.description, descriptionPattern, path);
    assert.equal(page.dateModified, expectedDate, path);
    assert.ok(faq.mainEntity.length >= (['/exchanges/hyperliquid', '/exchanges/uniswap'].includes(path) ? 4 : 5), path);
    assert.ok(faq.mainEntity.every((entry) => entry.acceptedAnswer.citation?.length >= 1), path);
    assert.match(serialized, answerPattern, path);
    for (const relatedPath of relatedPaths) {
      assert.ok(page.relatedLink.some((link) => link.endsWith(relatedPath)), `${path} -> ${relatedPath}`);
    }
    assert.doesNotMatch(serialized, forbiddenSchema, path);
    assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims, path);
  }
});

test('Wave18 Hyperliquid vs dYdX comparison covers funding, liquidation, outage and withdrawal boundaries', () => {
  const seo = computeRouteSeo({ url: '/compare/hyperliquid-vs-dydx' });
  const page = seo.schemas.find((schema) => schema['@type'] === 'WebPage');
  const serialized = JSON.stringify(page);

  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.match(seo.title, /Perp Fees, Funding, Liquidation/);
  assert.match(seo.description, /fee schedules, funding, collateral, liquidation rules/);
  assert.ok(page.subjectOf.mainEntity.length >= 5);
  assert.match(serialized, /outage or eligibility risk/);
  assert.match(serialized, /wallet screening/);
  assert.match(serialized, /withdrawal path/);
  assert.ok(page.relatedLink.some((link) => link.endsWith('/factbook/hyperliquid')));
  assert.ok(page.relatedLink.some((link) => link.endsWith('/factbook/dydx')));
  assert.doesNotMatch(serialized, forbiddenSchema);
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims);
});

test('Wave18 no-KYC topic keeps access language conditional and source-bound', () => {
  const seo = computeRouteSeo({ url: '/topics/no-kyc' });
  const topic = seo.schemas.find((schema) => schema['@type'] === 'CollectionPage');
  const faq = faqSchema(seo);
  const serialized = JSON.stringify([topic, faq]);

  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.match(seo.title, /Wallet, CEX, Perp and Withdrawal Checks/);
  assert.match(seo.description, /sanctions controls/);
  assert.equal(faq.mainEntity.length, 4);
  assert.match(serialized, /wallet screening/);
  assert.match(serialized, /bridge, withdrawal and regional conditions/);
  assert.ok(topic.relatedLink.some((link) => link.endsWith('/compare/hyperliquid-vs-dydx')));
  assert.ok(topic.relatedLink.some((link) => link.endsWith('/exchanges/hyperliquid')));
  assert.ok(faq.mainEntity.every((entry) => entry.acceptedAnswer.citation?.length >= 1));
  assert.doesNotMatch(serialized, forbiddenSchema);
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims);
});

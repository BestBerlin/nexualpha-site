import test from 'node:test';
import assert from 'node:assert/strict';
import { referralSeoFor } from '../src/data/referral-seo.js';
import { computeRouteSeo } from '../src/data/seo-injection.js';

const forbiddenCommercialClaims = /\b(guaranteed|lowest|best|free money|risk-free|always available|prop account allocation)\b/i;
const forbiddenSchema = /"@type":"(?:Offer|FinancialProduct|AggregateRating)"|SearchAction|MOCK_EVENTS/i;

function faqSchema(seo) {
  return seo.schemas.find((schema) => schema['@type'] === 'FAQPage')
    || seo.schemas.find((schema) => schema.subjectOf?.['@type'] === 'FAQPage')?.subjectOf;
}

test('Wave18 on-chain venue pages expose deeper source-bound answers and next-step links', () => {
  const cases = [
    ['/exchanges/hyperliquid', '2026-09-22', /Fees, Funding, Funded Account and Vault Checks/, /account abstraction/, /liquidations|maintenance margin|vault-volume separation/, ['/compare/hyperliquid-vs-dydx', '/topics/no-kyc', '/exchanges/dydx']],
    ['/exchanges/uniswap', '2026-09-22', /Uniswap Testnet/, /official app and docs, API and web testnet scope/, /Ethereum Sepolia|official Uniswap app and docs first|token approvals remain on-chain/, ['/compare/uniswap-vs-jupiter', '/topics/no-kyc', '/exchanges/jupiter']],
    ['/exchanges/aerodrome', '2026-09-15', /Aerodrome Review: Base DEX/, /Base bridge/, /standard or Slipstream/, ['/topics/no-kyc', '/exchanges/uniswap', '/exchanges/jupiter']],
    ['/exchanges/jupiter', '2026-09-15', /Jupiter fees & wallet setup/, /network costs/, /route legs/, ['/compare/uniswap-vs-jupiter', '/topics/no-kyc', '/exchanges/uniswap']],
  ];

  for (const [path, expectedDate, titlePattern, descriptionPattern, answerPattern, relatedPaths] of cases) {
    const seo = computeRouteSeo({ url: path });
    const page = seo.schemas.find((schema) => schema['@type'] === 'WebPage');
    const faq = faqSchema(seo);
    const serialized = JSON.stringify([page, faq]);

    assert.equal(seo.status, 200, path);
    assert.equal(seo.robots, 'index,follow', path);
    const referral = referralSeoFor(path.split('/').pop());
    if (referral) {
      assert.equal(seo.title, referral.title, path);
      assert.equal(seo.description, referral.description, path);
      assert.match(serialized, /account abstraction|wallet collateral/, path);
    } else {
      assert.match(seo.title, titlePattern, path);
      assert.match(seo.description, descriptionPattern, path);
    }
    assert.match(page.dateModified, /^\d{4}-\d{2}-\d{2}$/, path);
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
  assert.match(seo.title, /Hyperliquid vs dYdX: fees, KYC & rebates/);
  assert.match(serialized, /fee schedule, funding cadence, collateral, liquidation logic/);
  assert.ok(page.subjectOf.mainEntity.length >= 5);
  assert.match(serialized, /outage or eligibility risk/);
  assert.match(serialized, /wallet screening/);
  assert.match(serialized, /withdrawal path/);
  assert.ok(page.relatedLink.some((link) => new URL(link).pathname === '/exchanges/hyperliquid'));
  assert.ok(page.relatedLink.some((link) => new URL(link).pathname === '/exchanges/dydx'));
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
  assert.match(seo.title, /MEXC KYC vs Hyperliquid\/dYdX self-custody/);
  assert.match(seo.description, /sanctions controls/);
  assert.equal(faq.mainEntity.length, 5);
  assert.match(serialized, /Restricted Persons/);
  assert.match(serialized, /native USDC, CCTP and legacy-bridge paths/);
  assert.ok(topic.relatedLink.some((link) => link.endsWith('/compare/hyperliquid-vs-dydx')));
  assert.ok(topic.relatedLink.some((link) => link.endsWith('/exchanges/hyperliquid')));
  assert.ok(faq.mainEntity.every((entry) => entry.acceptedAnswer.citation?.length >= 1));
  assert.doesNotMatch(serialized, forbiddenSchema);
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims);
});

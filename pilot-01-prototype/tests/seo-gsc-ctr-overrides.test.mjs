import test from 'node:test';
import assert from 'node:assert/strict';
import { computeRouteSeo } from '../src/data/seo-injection.js';

const forbiddenCommercialClaims = /\b(guaranteed|lowest|best|free money|risk-free|always available|prop account allocation)\b/i;

function faqSchema(seo) {
  return seo.schemas.find((schema) => schema['@type'] === 'FAQPage')
    || seo.schemas.find((schema) => schema.subjectOf?.['@type'] === 'FAQPage')?.subjectOf;
}

test('GSC priority Hyperliquid metadata matches fees and funded-account queries without promises', () => {
  const seo = computeRouteSeo({ url: '/exchanges/hyperliquid' });
  const faq = faqSchema(seo);
  const serialized = JSON.stringify(faq);

  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.match(seo.title, /Hyperliquid Fees, Referral Discount and Funded Account Checks/);
  assert.match(seo.description, /fee tiers/i);
  assert.match(seo.description, /USDC collateral/i);
  assert.match(seo.description, /vault volume/i);
  assert.match(seo.description, /funded-account claim boundaries/i);
  assert.match(serialized, /rolling 14-day volume/);
  assert.match(serialized, /hourly peer-to-peer funding|paid every hour/);
  assert.match(serialized, /funded-account keywords/);
  assert.match(serialized, /sub-account volume rules/);
  assert.match(serialized, /vault-volume separation/);
  assert.match(serialized, /HIP-3 market conditions/);
  assert.match(serialized, /API-wallet signing routes/);
  assert.match(serialized, /maintenance margin/);
  assert.match(serialized, /third-party capital allocation offer/);
  assert.match(serialized, /https:\/\/hyperliquid\.gitbook\.io\/hyperliquid-docs\/trading\/fees/);
  const page = seo.schemas.find((schema) => schema['@type'] === 'WebPage');
  assert.ok(page.relatedLink.includes('https://nexualpha.com/news/hyperliquid-vs-dydx'));
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims);
});

test('GSC priority Binance metadata matches fees and KYC intent without entitlement claims', () => {
  const seo = computeRouteSeo({ url: '/exchanges/binance' });
  const faq = faqSchema(seo);
  const serialized = JSON.stringify(faq);

  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.match(seo.title, /Binance Fees, KYC and Product Scope Checks/);
  assert.match(seo.description, /BNB\/VIP tier conditions/);
  assert.match(serialized, /published spot and margin fee table/);
  assert.match(serialized, /identity-verification requirement/);
  assert.match(serialized, /https:\/\/www\.binance\.com\/en\/fee\/trading/);
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims);
});

test('Wave17 high-intent CEX profiles expose answer depth and comparison next steps', () => {
  const cases = [
    ['/exchanges/okx', /OKX Fees, KYC, Web3/, /proof-of-reserves/i, /OKX's published fee page/, /\/compare\/binance-vs-okx/, /https:\/\/www\.okx\.com\/fees/],
    ['/exchanges/bybit', /Bybit Fees, KYC, Derivatives/, /copy trading boundaries/i, /Bybit's trading-fee structure/, /\/compare\/bybit-vs-bitget/, /https:\/\/www\.bybit\.com\/en\/help-center\/article\/Trading-Fee-Structure/],
    ['/exchanges/bitget', /Bitget Fees, KYC, Futures/, /registration route/i, /Bitget's spot-fee article/, /\/compare\/bybit-vs-bitget/, /https:\/\/www\.bitget\.com\/support\/articles\/12560603820584/],
  ];

  for (const [path, titlePattern, descriptionPattern, answerPattern, relatedPattern, citationPattern] of cases) {
    const seo = computeRouteSeo({ url: path });
    const page = seo.schemas.find((schema) => schema['@type'] === 'WebPage');
    const faq = faqSchema(seo);
    const serialized = JSON.stringify([page, faq]);

    assert.equal(seo.status, 200, path);
    assert.equal(seo.robots, 'index,follow', path);
    assert.match(seo.title, titlePattern, path);
    assert.match(seo.description, descriptionPattern, path);
    assert.equal(page.dateModified, '2026-09-15', path);
    assert.ok(page.relatedLink.some((link) => relatedPattern.test(link)), path);
    assert.ok(faq.mainEntity.length >= 4, path);
    assert.match(serialized, answerPattern, path);
    assert.match(serialized, citationPattern, path);
    assert.doesNotMatch(serialized, /"@type":"(?:Offer|FinancialProduct|AggregateRating)"|SearchAction|MOCK_EVENTS|nexu888|11350287/i, path);
    assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims, path);
  }
});

test('GSC priority Uniswap metadata matches testnet intent without implying live route safety', () => {
  const seo = computeRouteSeo({ url: '/exchanges/uniswap' });
  const serialized = JSON.stringify(faqSchema(seo));

  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.match(seo.title, /Uniswap Testnet/);
  assert.match(seo.title, /Mainnet, Permit2/);
  assert.match(seo.description, /API and web testnet scope/i);
  assert.match(seo.description, /mainnet chain, token contract, pool route/i);
  assert.match(seo.description, /gas and wallet transaction preview/i);
  assert.match(serialized, /wallet-connected app route/);
  assert.match(serialized, /Ethereum Sepolia, Unichain Sepolia and Base Sepolia/);
  assert.match(serialized, /only Ethereum Sepolia and Unichain Sepolia/);
  assert.match(serialized, /not proof of mainnet liquidity or token safety/);
  assert.match(serialized, /token contract identifies the asset/);
  assert.match(serialized, /Universal Router can route the swap path/);
  assert.match(serialized, /Permit2 can manage signature-based token permissions/);
  assert.match(serialized, /spender is the address allowed to move tokens/);
  assert.match(serialized, /Disconnecting stops a site session/);
  assert.match(serialized, /token approvals remain on-chain until revoked or changed/);
  assert.match(serialized, /https:\/\/developers\.uniswap\.org\/docs\/trading\/swapping-api\/supported-chains/);
  assert.match(serialized, /https:\/\/developers\.uniswap\.org\/docs\/protocols\/universal-router\/overview/);
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims);
});

test('GSC priority Bybit vs Bitget metadata addresses stock exposure with official-source boundaries', () => {
  const seo = computeRouteSeo({ url: '/compare/bybit-vs-bitget' });
  const subjectFaq = seo.schemas.find((schema) => schema.subjectOf?.['@type'] === 'FAQPage')?.subjectOf;
  const serialized = JSON.stringify(subjectFaq);

  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.match(seo.title, /Bybit vs Bitget/);
  assert.match(seo.title, /Stocks, Copy Trading, Fees and Account Checks/);
  assert.match(seo.description, /UTA margin/);
  assert.match(seo.description, /product label first: UTA margin, xStocks fee schedule, stock futures, copy-trading profit sharing/i);
  assert.equal(subjectFaq.mainEntity.length, 6);
  assert.match(serialized, /product label/i);
  assert.match(serialized, /official account terms can change the practical route/);
  assert.match(serialized, /https:\/\/www\.bybit\.com/);
  assert.match(serialized, /https:\/\/www\.bitget\.com/);
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims);
});

test('GSC priority Binance vs OKX metadata adds source-bound comparison depth', () => {
  const seo = computeRouteSeo({ url: '/compare/binance-vs-okx' });
  const subjectFaq = seo.schemas.find((schema) => schema.subjectOf?.['@type'] === 'FAQPage')?.subjectOf;
  const page = seo.schemas.find((schema) => schema['@type'] === 'WebPage');
  const serialized = JSON.stringify(subjectFaq);

  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.match(seo.title, /Binance vs OKX: Fees, Products, KYC and Web3 Access Checks/);
  assert.match(seo.description, /identity requirements, Web3 or DEX-style access/);
  assert.equal(subjectFaq.mainEntity.length, 3);
  assert.match(serialized, /official fee tables/);
  assert.match(serialized, /not treat either public comparison as a current account entitlement/);
  assert.match(serialized, /https:\/\/www\.binance\.com\/en\/fee\/trading/);
  assert.match(serialized, /https:\/\/www\.okx\.com\/fees/);
  assert.match(JSON.stringify(page.relatedLink), /\/exchanges\/binance/);
  assert.match(JSON.stringify(page.relatedLink), /\/exchanges\/okx/);
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims);
});

test('Wave15 Hyperliquid vs dYdX comparison deepens CTR answer intent without eligibility promises', () => {
  const seo = computeRouteSeo({ url: '/compare/hyperliquid-vs-dydx' });
  const page = seo.schemas.find((schema) => schema['@type'] === 'WebPage');
  const serialized = JSON.stringify(page.subjectOf);

  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.match(seo.title, /Hyperliquid vs dYdX/);
  assert.match(seo.description, /no-KYC access assumptions/i);
  assert.equal(page.subjectOf.mainEntity.length, 6);
  assert.match(serialized, /collateral and liquidation/i);
  assert.match(serialized, /front-end availability/i);
  assert.match(serialized, /withdrawal path/i);
  assert.match(serialized, /dated source-reading explainer/i);
  assert.match(serialized, /https:\/\/hyperliquid\.gitbook\.io\/hyperliquid-docs\/trading\/liquidations/);
  assert.match(serialized, /https:\/\/docs\.dydx\.xyz\/concepts\/onboarding-faqs/);
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims);
});

test('Wave15 English no-KYC topic emits FAQ schema and route-specific next steps', () => {
  const seo = computeRouteSeo({ url: '/topics/no-kyc' });
  const topic = seo.schemas.find((schema) => schema['@type'] === 'CollectionPage');
  const faq = seo.schemas.find((schema) => schema['@type'] === 'FAQPage');
  const serialized = JSON.stringify(faq);

  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  // Class b: MEXC is now the KYC exchange contrast, not part of the no-KYC set.
  assert.match(seo.title, /No-KYC Self-Custody vs KYC Exchange/);
  assert.match(seo.description, /wallet access, CEX account flows, withdrawals/i);
  assert.ok(topic.relatedLink.some((link) => link.endsWith('/compare/hyperliquid-vs-dydx')));
  assert.ok(faq);
  assert.equal(faq.mainEntity.length, 4);
  assert.match(serialized, /separating wallet-connected protocols from centralized accounts/i);
  assert.match(serialized, /Hyperliquid vs dYdX comparison/i);
  assert.match(serialized, /Verify the current official account flow/i);
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims);
});

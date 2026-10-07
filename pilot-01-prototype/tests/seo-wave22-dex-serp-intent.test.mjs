import test from 'node:test';
import assert from 'node:assert/strict';
import { computeRouteSeo } from '../src/data/seo-injection.js';

const forbiddenCommercialClaims = /\b(guaranteed|lowest|best|risk-free|commission|返佣|signup entitlement|reward entitlement)\b/i;

function pageSchema(seo) {
  return seo.schemas.find((schema) => schema['@type'] === 'WebPage');
}

function faqText(seo) {
  return JSON.stringify(seo.schemas.find((schema) => schema['@type'] === 'FAQPage') || {});
}

test('Wave22 DEX exposure pages keep titles stable while deepening answer intent', () => {
  const cases = [
    {
      path: '/exchanges/uniswap',
      title: 'Uniswap Testnet, Mainnet, Permit2 and Swap Preview Checklist — NexuAlpha',
      direct: /official Uniswap app and docs first/i,
      faq: /API testnets and the web app/i,
      related: ['https://nexualpha.com/compare/uniswap-vs-jupiter', 'https://nexualpha.com/news/uniswap-v3-vs-pancakeswap-v3-concentrated-liquidity-controls'],
      source: 'https://developers.uniswap.org/docs/protocols/v4/deployments',
      extraSource: 'https://developers.uniswap.org/docs/protocols/permit2/overview',
    },
    {
      path: '/exchanges/aerodrome',
      title: 'Aerodrome Review: Base DEX Fees, Pools, Slipstream & veAERO — NexuAlpha',
      direct: /Aerodrome is a Base-native DEX.*token and pool contracts.*price impact/i,
      faq: /compare Aerodrome with Uniswap or Jupiter/i,
      related: ['https://nexualpha.com/compare/uniswap-vs-jupiter', 'https://nexualpha.com/exchanges/uniswap', 'https://nexualpha.com/exchanges/jupiter'],
      source: 'https://aerodrome.finance/docs',
    },
    {
      path: '/exchanges/jupiter',
      title: 'Jupiter Solana Swap Routes, Ultra Quotes and Fee Checks — NexuAlpha',
      direct: /For a Jupiter route query, first decide whether the task is a test quote, live swap, token-list check/i,
      faq: /compare Jupiter with Uniswap or Aerodrome/i,
      related: ['https://nexualpha.com/compare/uniswap-vs-jupiter', 'https://nexualpha.com/news/jupiter-vs-raydium-solana-swap-routing-execution-controls', 'https://nexualpha.com/exchanges/aerodrome'],
      source: 'https://dev.jup.ag/docs/ultra',
    },
  ];

  for (const item of cases) {
    const seo = computeRouteSeo({ url: item.path });
    const page = pageSchema(seo);
    const serializedFaq = faqText(seo);
    const serializedPage = JSON.stringify(page);

    assert.equal(seo.status, 200, item.path);
    assert.equal(seo.robots, 'index,follow', item.path);
    assert.equal(seo.title, item.title, item.path);
    assert.match(serializedFaq, item.direct, item.path);
    assert.match(serializedFaq, item.faq, item.path);
    assert.match(serializedPage, new RegExp(item.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), item.path);
    if (item.extraSource) {
      assert.match(serializedPage, new RegExp(item.extraSource.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), item.path);
    }
    for (const link of item.related) {
      assert.ok(page.relatedLink.includes(link), `${item.path} should link ${link}`);
    }
    assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serializedPage}`, forbiddenCommercialClaims, item.path);
  }
});

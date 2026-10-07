import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { computeRouteSeo } from '../src/data/seo-injection.js';
import { exchangeResearch } from '../src/data/exchange-research.js';

const forbiddenClaims = /\b(guaranteed|risk-free|real-time yield|live yield|safe route|route safety guaranteed|available in every region|regional availability guaranteed|commission|rebate|返佣|稳赚|无风险)\b/i;
const invitationTokens = /nexu888|11350287|LUCKX|CANDY007|INS898|luckybitcoin/i;

function pageSchema(seo) {
  return seo.schemas.find((schema) => schema['@type'] === 'WebPage');
}

function faqSchema(seo) {
  return seo.schemas.find((schema) => schema['@type'] === 'FAQPage');
}

test('Wave27 Aerodrome page deepens 7-impression search intent without reward or route promises', () => {
  const seo = computeRouteSeo({ url: '/exchanges/aerodrome?locale=en' });
  const page = pageSchema(seo);
  const faq = faqSchema(seo);
  const serialized = JSON.stringify([page, faq]);

  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.match(seo.title, /Aerodrome Review: Base DEX Fees, Pools, Slipstream & veAERO/);
  assert.match(seo.description, /Aerodrome search intent/);
  assert.match(seo.description, /Base-native DEX path/);
  assert.match(serialized, /Before swapping or adding liquidity, verify the official domain, Base network and bridge route/);
  assert.match(serialized, /Aerodrome is a Base-native DEX/);
  assert.match(serialized, /What is the compact Aerodrome CTA after this checklist/);
  assert.match(serialized, /source check, not a route-safety, availability or reward promise/);
  assert.match(serialized, /https:\/\/aerodrome\.finance\/docs/);
  assert.ok(page.relatedLink.some((link) => link.endsWith('/factbook/aerodrome')));
  assert.ok(page.relatedLink.some((link) => link.endsWith('/exchanges/jupiter')));
  assert.ok(page.relatedLink.some((link) => link.endsWith('/topics/no-kyc')));
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenClaims);
  assert.doesNotMatch(serialized, invitationTokens);
});

test('Wave27 Jupiter page deepens 6-impression Solana route intent without execution or safety promises', () => {
  const seo = computeRouteSeo({ url: '/exchanges/jupiter?locale=en' });
  const page = pageSchema(seo);
  const faq = faqSchema(seo);
  const serialized = JSON.stringify([page, faq]);

  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.match(seo.title, /Jupiter Solana Swap Routes/);
  assert.match(seo.description, /Jupiter search intent/);
  assert.match(seo.description, /token-list checks, Solana test quotes/);
  assert.match(serialized, /test quote, live swap, token-list check, Ultra route review, API integration or platform-fee review/);
  assert.match(serialized, /not a custodial account/);
  assert.match(serialized, /What is the compact Jupiter CTA after this checklist/);
  assert.match(serialized, /source check, not execution, safety or availability proof/);
  assert.match(serialized, /https:\/\/dev\.jup\.ag\/docs\/ultra/);
  assert.ok(page.relatedLink.some((link) => link.endsWith('/factbook/jupiter')));
  assert.ok(page.relatedLink.some((link) => link.endsWith('/exchanges/aerodrome')));
  assert.ok(page.relatedLink.some((link) => link.endsWith('/compare/uniswap-vs-jupiter')));
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenClaims);
  assert.doesNotMatch(serialized, invitationTokens);
});

test('Wave27 source research records expose query and CTA boundaries for DEX decision pages', () => {
  const jupiterFacts = exchangeResearch.jupiter.facts;
  const aerodromeFacts = exchangeResearch.aerodrome.facts;

  const jupiterQuery = jupiterFacts.find((fact) => fact.label.en === 'Query intent boundary');
  const aerodromeCta = aerodromeFacts.find((fact) => fact.label.en === 'CTA boundary');

  assert.equal(jupiterQuery?.axis, 'execution');
  assert.match(jupiterQuery?.value.en || '', /test quote, live swap, token-list verification, Ultra execution review, or API\/platform-fee integration/);
  assert.match(jupiterQuery?.sourceUrl || '', /dev\.jup\.ag\/docs\/swap/);

  assert.equal(aerodromeCta?.axis, 'access');
  assert.match(aerodromeCta?.value.en || '', /official Base pool, network, token contract, pool type, liquidity and incentive terms/);
  assert.match(aerodromeCta?.value.en || '', /must not imply route safety, regional availability or reward entitlement/);
  assert.match(aerodromeCta?.sourceUrl || '', /aerodrome\.finance\/docs/);

  assert.doesNotMatch([jupiterQuery?.value.en, aerodromeCta?.value.en].join('\n'), forbiddenClaims);
});

test('Wave27 worker mirror contains only selected SEO updates for Aerodrome and Jupiter snippets', async () => {
  const worker = await readFile(new URL('../worker/index.js', import.meta.url), 'utf8');
  const aerodromeStart = worker.indexOf('Review Aerodrome search intent as a Base-native DEX path');
  const jupiterStart = worker.indexOf('Review Jupiter search intent across Swap and Ultra');
  assert.notEqual(aerodromeStart, -1);
  assert.notEqual(jupiterStart, -1);

  const aerodromeSnippet = worker.slice(aerodromeStart, aerodromeStart + 2_800);
  const jupiterSnippet = worker.slice(jupiterStart, jupiterStart + 2_800);

  assert.match(aerodromeSnippet, /compact Aerodrome CTA/);
  assert.match(aerodromeSnippet, /not a route-safety, availability or reward promise/);
  assert.match(jupiterSnippet, /compact Jupiter CTA/);
  assert.match(jupiterSnippet, /not execution, safety or availability proof/);
  assert.doesNotMatch(`${aerodromeSnippet}\n${jupiterSnippet}`, invitationTokens);
});

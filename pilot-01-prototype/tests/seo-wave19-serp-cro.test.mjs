import test from 'node:test';
import assert from 'node:assert/strict';
import { computeRouteSeo } from '../src/data/seo-injection.js';
import feed from '../public/content/news-feed.json' with { type: 'json' };

const forbiddenCommercialClaims = /\b(guaranteed|lowest|best|free money|risk-free|always available|prop account allocation|commission|返佣)\b/i;

function faqSchema(seo) {
  return seo.schemas.find((schema) => schema['@type'] === 'FAQPage')
    || seo.schemas.find((schema) => schema.subjectOf?.['@type'] === 'FAQPage')?.subjectOf;
}

test('Wave19 Bybit vs Bitget comparison exposes source-bound stock and copy-trading checks', () => {
  const seo = computeRouteSeo({ url: '/compare/bybit-vs-bitget' });
  const page = seo.schemas.find((schema) => schema['@type'] === 'WebPage');
  const faq = faqSchema(seo);
  const serialized = JSON.stringify([page, faq]);

  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.match(serialized, /xStocks schedule.*copy trading needs the profit-sharing rules/i);
  assert.ok(page.relatedLink.some((link) => link.endsWith('/topics/tokenized-stocks-vs-perpetuals')));
  assert.ok(page.relatedLink.some((link) => link.endsWith('/factbook/bybit')));
  assert.ok(page.relatedLink.some((link) => link.endsWith('/factbook/bitget')));
  assert.match(serialized, /Bybit xStocks/);
  assert.match(serialized, /https:\/\/www\.bybit\.com\/en\/help-center\/article\/Individual-KYC-FAQ/);
  assert.match(serialized, /copy-trading profit share|lead-trader rules|带单规则/i);
  assert.match(serialized, /https:\/\/www\.bybit\.com\/en\/help-center\/article\/Trading-Fee-Structure/);
  assert.match(serialized, /https:\/\/www\.bitget\.com\/support\/articles\/12560603892733/);
  assert.doesNotMatch(serialized, /nexu888|11350287|MOCK_EVENTS|"@type":"(?:Offer|FinancialProduct|AggregateRating)"/i);
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims);
});

test('Wave19 tokenized Treasury topic gives collateral, source and related-path answers', () => {
  const seo = computeRouteSeo({ url: '/topics/tokenized-treasuries' });
  const collection = seo.schemas.find((schema) => schema['@type'] === 'CollectionPage');
  const faq = faqSchema(seo);
  const serialized = JSON.stringify([collection, faq]);

  assert.equal(seo.status, 200);
  assert.equal(seo.robots, 'index,follow');
  assert.match(seo.description, /legal wrapper/i);
  assert.match(seo.description, /collateral treatment/i);
  assert.ok(collection.relatedLink.some((link) => link.endsWith('/news/tokenized-treasuries-structure-access-risks')));
  assert.ok(collection.relatedLink.some((link) => link.endsWith('/topics/tokenized-stocks-vs-perpetuals')));
  assert.match(serialized, /official token-address list/);
  assert.match(serialized, /margin haircut/);
  assert.match(serialized, /https:\/\/www\.sec\.gov\//);
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenCommercialClaims);
});

test('Wave19 high-intent news feed keeps canonical pages answer-ready without registration claims', () => {
  const bySlug = Object.fromEntries(feed.articles.map((article) => [article.slug, article]));
  const okx = bySlug['okx-usd-to-usdc-spot-pair-migration'];
  const treasuries = bySlug['tokenized-treasuries-structure-access-risks'];

  assert.ok(okx, 'OKX migration article must exist at canonical slug');
  assert.equal(okx.seo.canonical, 'https://nexualpha.com/news/okx-usd-to-usdc-spot-pair-migration');
  assert.match(okx.seo.description, /API IDs/);
  assert.match(okx.seo.description, /Crypto-USDC pairs/);
  assert.match(okx.seo.description, /order impact/);
  assert.ok(okx.seo.internalLinkTargets.includes('/factbook/okx'));
  assert.ok(okx.seo.internalLinkTargets.includes('/compare/binance-vs-okx'));
  assert.match(okx.content.en, /Developer direct-answer block/);
  assert.match(okx.content.en, /instId/);
  assert.match(okx.content.en, /tradeQuoteCcy/);
  assert.match(okx.content.en, /WebSocket channel subscriptions/);
  assert.match(okx.content.en, /sub-account/);
  assert.ok(okx.aeo.questions.includes('Which OKX API identifiers should be mapped before the USD to USDC migration?'));
  assert.doesNotMatch(`${okx.seo.title}\n${okx.seo.description}\n${okx.aeo.directAnswer}\n${okx.aeo.questions.join('\n')}`, forbiddenCommercialClaims);

  assert.ok(treasuries, 'tokenized Treasuries article must exist at canonical slug');
  assert.equal(treasuries.seo.canonical, 'https://nexualpha.com/news/tokenized-treasuries-structure-access-risks');
  assert.match(treasuries.seo.description, /ownership records|legal instrument/i);
  assert.match(treasuries.seo.description, /eligibility|redemption/i);
  assert.ok(treasuries.seo.internalLinkTargets.includes('/topics/tokenized-treasuries'));
  assert.ok(treasuries.seo.internalLinkTargets.includes('/topics/tokenized-stocks-vs-perpetuals'));
  assert.match(treasuries.content.en, /The comparison that matters|真正需要比较的差异/i);
  assert.match(treasuries.content.en, /legal instrument|recordkeeper|redemption route/i);
  assert.ok(treasuries.aeo.questions.includes('What should be checked before using tokenized Treasuries as collateral or margin support?'));
  assert.doesNotMatch(`${treasuries.seo.title}\n${treasuries.seo.description}\n${treasuries.aeo.directAnswer}\n${treasuries.aeo.questions.join('\n')}`, forbiddenCommercialClaims);
});

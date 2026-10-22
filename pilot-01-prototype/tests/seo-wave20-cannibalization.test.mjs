import test from 'node:test';
import assert from 'node:assert/strict';
import { computeRouteSeo } from '../src/data/seo-injection.js';

const forbiddenCommercialClaims = /\b(guaranteed|lowest|best|free money|risk-free|always available|commission|返佣)\b/i;

function primarySchema(seo, type) {
  return seo.schemas.find((schema) => schema['@type'] === type);
}

test('Wave20 factbook pages are not internal-link dead ends in fee and KYC clusters', () => {
  const cases = [
    ['/factbook/binance', ['/exchanges/binance', '/compare/binance-vs-okx', '/news/crypto-exchange-fee-disclosure-audit', '/methodology']],
    ['/factbook/okx', ['/exchanges/okx', '/compare/binance-vs-okx', '/news/okx-usd-to-usdc-spot-pair-migration', '/news/crypto-exchange-fee-disclosure-audit', '/methodology']],
    ['/factbook/bybit', ['/exchanges/bybit', '/compare/bybit-vs-bitget', '/topics/tokenized-stocks-vs-perpetuals', '/news/crypto-exchange-fee-disclosure-audit', '/methodology']],
    ['/factbook/bitget', ['/exchanges/bitget', '/compare/bybit-vs-bitget', '/topics/tokenized-stocks-vs-perpetuals', '/news/crypto-exchange-fee-disclosure-audit', '/methodology']],
  ];

  for (const [path, expectedPaths] of cases) {
    const seo = computeRouteSeo({ url: path });
    const dataset = primarySchema(seo, 'Dataset');
    const related = dataset.mainEntityOfPage?.relatedLink || [];

    assert.equal(seo.status, 200, path);
    assert.equal(seo.robots, 'index,follow', path);
    assert.match(dataset.dateModified, /^\d{4}-\d{2}-\d{2}$/, path);
    for (const expectedPath of expectedPaths) {
      assert.ok(related.some(link => new URL(link).pathname === expectedPath), `${path} should link ${expectedPath}`);
    }
    assert.doesNotMatch(JSON.stringify(dataset), /nexu888|11350287|MOCK_EVENTS|"@type":"(?:Offer|FinancialProduct|AggregateRating)"/i, path);
    assert.doesNotMatch(`${seo.title}\n${seo.description}\n${JSON.stringify(dataset)}`, forbiddenCommercialClaims, path);
  }
});

test('Wave20 tokenized stock topic is positioned as hub, not article duplicate', () => {
  const topic = computeRouteSeo({ url: '/topics/tokenized-stocks-vs-perpetuals' });
  const article = computeRouteSeo({ url: '/news/tokenized-stocks-vs-stock-perpetuals', article: {
    slug: 'tokenized-stocks-vs-stock-perpetuals',
    status: 'PUBLISHED',
    title: { en: 'Tokenized Stocks vs Stock Perpetuals: What Do You Actually Own?' },
    summary: { en: 'A source-backed guide to tokenized stocks, xStocks, and stock perpetual futures: what users own, what rights may not pass through, and where leverage and liquidation risk enter.' },
    content: { en: 'Published body' },
    seo: { title: 'Tokenized Stocks vs Stock Perpetuals: Ownership and Risk', description: 'A source-backed guide to tokenized stocks, xStocks, and stock perpetual futures: what users own, what rights may not pass through, and where leverage and liquidation risk enter.', noindex: false },
    sources: [{ url: 'https://example.com/source' }],
    availableLocales: ['en'],
  }});

  assert.equal(topic.status, 200);
  assert.equal(topic.robots, 'index,follow');
  assert.match(topic.title, /Tokenized Stocks vs Stock Perps/);
  assert.match(topic.description, /tokenized stock claims|stock perpetuals/i);
  assert.notEqual(topic.title, article.title);
  assert.notEqual(topic.description, article.description);
  assert.doesNotMatch(`${topic.title}\n${topic.description}`, forbiddenCommercialClaims);
});

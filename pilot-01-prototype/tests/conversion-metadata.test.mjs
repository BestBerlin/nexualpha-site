import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeNewsArticle,
  normalizeNewsArticleSummary,
  projectNewsArticleForLocale,
} from '../src/data/news-feed-client.js';
import { articleVenueKeys } from '../src/components/v3/conversion/conversion-model.js';

const article = {
  slug: 'conversion-metadata-fixture', status: 'PUBLISHED', publishedAt: '2026-10-23T00:00:00Z',
  title: { en: 'Exchange account checks', 'zh-Hans': '交易平台账户核验' },
  summary: { en: 'Check current account conditions.', 'zh-Hans': '核对当前账户条件。' },
  content: { en: 'Check the official platform account conditions.', 'zh-Hans': '请核对平台官方账户条件。' },
  sources: [{ publisher: 'OKX', title: 'Official source', url: 'https://www.okx.com/help' }],
};

for (const [field, value, expected] of [
  ['subject', ' OKX ', 'okx'],
  ['subjects', ['exchange:OKX', ' bitget ', 'bitget'], ['exchange:okx', 'bitget']],
  ['entityKeys', ['venue:okx', 'coin:bitcoin'], ['venue:okx', 'coin:bitcoin']],
  ['entities', [{ slug: 'okx', unrelated: 'discard' }, { key: 'exchange:bitget' }], ['okx', 'exchange:bitget']],
]) test(`${field} survives normalization and article hydration projection`, () => {
  const input = { ...article, [field]: value };
  const normalized = normalizeNewsArticle(input);
  assert.deepEqual(normalized[field], expected);
  assert.deepEqual(normalizeNewsArticleSummary(input)[field], expected);
  const projected = projectNewsArticleForLocale(normalized, 'zh-Hans', { includeContent: true });
  assert.deepEqual(projected[field], expected);
  const hydrated = normalizeNewsArticle(projected);
  assert.deepEqual(hydrated[field], expected);
  assert.deepEqual(articleVenueKeys(hydrated), articleVenueKeys(normalized));
  assert.ok(articleVenueKeys(hydrated).includes('okx'));
  assert.deepEqual(input[field], value, 'normalization does not mutate source metadata');
});

test('object subject identifiers survive while unrelated properties do not', () => {
  const normalized = normalizeNewsArticle({ ...article, subject: { slug: 'OKX', label: 'Not an identifier' } });
  assert.equal(normalized.subject, 'okx');
});

test('invalid subject/entity values cannot crash conversion selection or create recommendations', () => {
  const normalized = normalizeNewsArticle({
    ...article,
    subject: { slug: 123 },
    subjects: [null, false, {}, { key: 123 }, '<script>', 'https://www.okx.com', ['okx']],
    entityKeys: [12, { key: 'venue:OKX' }, { slug: '', key: 'exchange:bitget' }],
    entities: { name: 'Binance' },
  });
  assert.equal('subject' in normalized, false);
  assert.equal('subjects' in normalized, false);
  assert.equal('entities' in normalized, false);
  assert.deepEqual(normalized.entityKeys, ['venue:okx', 'exchange:bitget']);
  assert.deepEqual(articleVenueKeys(normalized), ['okx', 'bitget']);
});

test('prose, labels and CTA metadata never become inferred entity keys', () => {
  const normalized = normalizeNewsArticle({
    ...article, title: { en: 'OKX and Bitget account checks' },
    content: { en: 'OKX and Bitget are mentioned in this body.' },
    cta: { venue: 'okx' }, entities: [{ name: 'Bitget' }],
  });
  assert.deepEqual(articleVenueKeys(normalized), []);
  assert.equal('subject' in normalized, false);
  assert.equal('entities' in normalized, false);
});

test('existing related venue eligibility remains unchanged without new metadata', () => {
  const normalized = normalizeNewsArticle({ ...article, relatedVenues: ['okx', 'bitget'] });
  assert.deepEqual(articleVenueKeys(normalized), ['okx', 'bitget']);
  for (const field of ['subject', 'subjects', 'entityKeys', 'entities']) assert.equal(field in normalized, false);
});

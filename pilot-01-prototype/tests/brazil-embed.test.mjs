import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBrazilEmbedCode, buildBrazilEmbedUrl } from '../src/data/embed-builder.js';

test('Brazil publisher widget code carries local context without altering exchange links', () => {
  const url = new URL(buildBrazilEmbedUrl('canal-br_1'));
  assert.equal(url.origin, 'https://nexualpha.com');
  assert.equal(url.pathname, '/embed/calculator');
  assert.equal(url.searchParams.get('market'), 'BR');
  assert.equal(url.searchParams.get('publisher'), 'canal-br_1');
  assert.equal(url.searchParams.get('product'), 'spot');
  const code = buildBrazilEmbedCode('canal-br_1');
  assert.match(code, /&amp;market=BR/);
  assert.match(code, /title="NexuAlpha: simular custos em BRL"/);
  assert.doesNotMatch(code, /register\?|join\/|affiliate_id/);
});

test('publisher tags reject URLs, markup and overlong or empty identifiers', () => {
  for (const input of ['', '<script>', 'a" onload="alert(1)', 'https://example.org', 'x'.repeat(61), null, {}]) {
    assert.equal(buildBrazilEmbedUrl(input), null);
    assert.equal(buildBrazilEmbedCode(input), null);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { priorityVenueAnswerFor } from '../src/data/priority-venue-answers.js';

const feeSource = 'https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees';
const locales = ['en', 'zh-Hans', 'zh-Hant'];

for (const locale of locales) {
  test(`Hyperliquid ${locale} distinguishes dated perp/spot base rates from actual account costs`, () => {
    const answer = priorityVenueAnswerFor('hyperliquid', locale);
    assert.match(answer.body, /2026-10-01/);
    assert.match(answer.body, /Tier 0/);
    // Each product has its own maker/taker schedule, not one universal rate.
    assert.match(answer.body, /maker 0\.015%.*taker 0\.045%/);
    assert.match(answer.body, /maker 0\.040%.*taker 0\.070%/);
    assert.ok(answer.sources.some(([, url]) => url === feeSource));
    assert.match(answer.body, locale === 'en' ? /not live quotes or guaranteed account rates/ : locale === 'zh-Hans' ? /不是实时报价.*不保证适用于你的账户/ : /不是即時報價.*不保證適用於你的帳戶/);
    assert.match(answer.body, locale === 'en' ? /funding is separate/ : /[资資]金[费費][另]計|资金费另计/);
    // Only fees were freshly checked; the broader source-list date must stay honest.
    assert.equal(answer.reviewedAt, '2026-09-22');
    const example = answer.checks[1];
    assert.match(example, /1,000/);
    assert.match(example, /0\.045%/);
    assert.match(example, /0\.45/);
    assert.match(example, locale === 'en' ? /hypothetical.*before discounts, funding/ : locale === 'zh-Hans' ? /假设.*尚未计入折扣、资金费/ : /假設.*尚未計入折扣、資金費/);
    assert.equal(1000 * (0.045 / 100), 0.45);
    assert.equal(answer.checks.length, 4, 'reuse the existing checklist without repeated modules');
  });
}

test('commercial destinations are unchanged by the fee-answer edit', () => {
  const expected = {
    'partner-registry.js': '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a',
    'venue-database.js': '0ce124afbe9f4758ce9ec093c79372550ce2e2e90a7342aa05ecc8d3482e1d52',
    'public-cta.js': '675875240d5fbb05498284a37f90a14488d6ace73d19b102caeb5add9e33f8e3',
    'regional-cta.js': 'a2542bb137b6b6ff123a0d3c6b3a01b09e1e3a785ee223e3b4e04a3fe8aab665',
  };
  for (const [file, hash] of Object.entries(expected)) {
    assert.equal(createHash('sha256').update(readFileSync(new URL(`../src/data/${file}`, import.meta.url))).digest('hex'), hash, file);
  }
});

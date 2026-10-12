import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enrichEvent, suggestEventFormat } from './event-plan.mjs';

const event = {
  id: 42,
  event_type: 'listing',
  title_internal: 'Bybit lists TEST token for spot trading',
  fact_summary: 'Bybit listed TEST for spot trading on 2026-10-13.',
  subject_entity: 'bybit',
  subjects: ['TEST'],
  credibility: 3,
  entities: [
    { id: 'bybit', kind: 'exchange', display_name: { en: 'Bybit', 'zh-Hans': 'Bybit' }, partner_slug: 'bybit', aliases: ['Bybit'] },
    { id: 'test', kind: 'coin', display_name: { en: 'TEST' }, aliases: ['TEST'] },
  ],
  evidence: [{ id: 'ev1', url: 'https://example.com/bybit-test', kind: 'official_notice', excerpt: 'Bybit lists TEST', confidence: 'high' }],
};

test('enrichEvent chooses format, angle, entities, cta hints and related history without codes', () => {
  const calls = [];
  const enriched = enrichEvent(event, {
    history: [{ slug: 'bybit-fees', title: { en: 'Bybit spot fees explained' }, publishedAt: '2026-10-12T00:00:00Z' }],
    locale: 'en',
    market: 'US',
    now: '2026-10-13T00:00:00Z',
    resolvePromotions(input) {
      calls.push(input);
      return [{ id: 'bybit-signup', kind: 'signup', name: 'Bybit', link: '/go/bybit?src=news-sponsored', inviteCode: 'SECRET', share: 0.3 }];
    },
  });
  assert.equal(enriched.suggested_format, 'flash');
  assert.match(enriched.suggested_angle, /Keep facts/);
  assert.equal(enriched.entities[0].partner_slug, 'bybit');
  assert.equal(enriched.cta_hints[0].commercial_allowed, true);
  assert.equal(enriched.cta_hints[0].fallback_href, '/compare');
  assert.equal(enriched.cta_hints[0].promotions[0].inviteCode, undefined);
  assert.equal(enriched.cta_hints[0].promotions[0].share, undefined);
  assert.equal(enriched.cta_hints[0].promotions[0].conditions, undefined);
  assert.ok(enriched.related_existing_articles.some(row => row.slug === 'bybit-fees'));
  assert.ok(calls[0].topicTags.includes('bybit'));
});

test('risky and dispute events stay neutral-only', () => {
  const enriched = enrichEvent({ ...event, event_type: 'hack_exploit' }, {
    resolvePromotions() {
      return [{ id: 'site-tool', kind: 'tool', name: 'Compare', link: '/compare' }];
    },
  });
  assert.equal(enriched.suggested_format, 'breakdown');
  assert.equal(enriched.cta_hints.every(hint => hint.commercial_allowed === false), true);
  assert.equal(enriched.cta_hints.every(hint => !hint.directive.includes('bybit')), true);
  assert.equal(enriched.cta_hints.every(hint => hint.promotions.every(p => p.kind === 'tool')), true);
  assert.ok(enriched.cta_hints.every(hint => hint.fallback_href));
});

test('format map covers dispute and quote-check cases', () => {
  assert.equal(suggestEventFormat({ event_type: 'key_person_statement' }), 'quote_check');
  assert.equal(suggestEventFormat({ event_type: 'viral_claim' }), 'dispute');
  assert.equal(suggestEventFormat({ event_type: 'followup' }), 'followup');
});

test('follow-up events are marked as followup format', () => {
  const enriched = enrichEvent({ ...event, parent_event_id: 41 }, {
    resolvePromotions() { return [{ id: 'site-tool', kind: 'tool', name: 'Compare', link: '/compare' }]; },
  });
  assert.equal(enriched.suggested_format, 'followup');
  assert.match(enriched.suggested_angle, /follow-up/);
});

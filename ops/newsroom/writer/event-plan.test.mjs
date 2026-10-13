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

test('plan summarizes primary evidence, cites it and explains retail relevance', () => {
  const enriched = enrichEvent({
    ...event, event_type: 'delisting', title_internal: 'Misleading headline',
    evidence: [
      { kind: 'media_report', url: 'https://media.test/story', excerpt: 'Speculation about a price crash.' },
      { kind: 'official_notice', url: 'https://bybit.test/notice', excerpt: 'Bybit will delist STG on 2026-10-14. Withdrawals remain available until 2026-11-14. A third sentence should stay out.' },
    ],
  });
  assert.equal(enriched.factual_summary, 'Bybit will delist STG on 2026-10-14. Withdrawals remain available until 2026-11-14.');
  assert.deepEqual(enriched.summary_source_urls, ['https://bybit.test/notice']);
  assert.match(enriched.why_it_matters, /withdrawal deadline/);
  assert.match(enriched.suggested_angle, /Which venues/);
});

test('single-sentence evidence gets provenance and missing evidence stays explicit', () => {
  const enriched = enrichEvent({ ...event, evidence: [{ kind: 'market_data', url: 'https://data.test', excerpt: 'BTC fell 3.5% in one hour.', published_at: '2026-10-13T12:00:00Z' }] });
  assert.equal(enriched.factual_summary, 'BTC fell 3.5% in one hour. The cited source records its publication time as 2026-10-13T12:00:00Z.');
  const unknown = enrichEvent({ ...event, evidence: [{ excerpt: 'delist' }] });
  assert.match(unknown.factual_summary, /No substantive evidence/);
  assert.doesNotMatch(unknown.factual_summary, /Bybit/);
});

test('mirror excerpts never enter the writer evidence bundle or factual summary', () => {
  const enriched = enrichEvent({ ...event, evidence: [
    { source_id: 'nexualpha-official-announcements', kind: 'official_notice', excerpt: 'A fabricated mirror claim.', url: 'https://nexualpha.com/updates/test' },
    ...event.evidence,
  ] });
  assert.equal(enriched.evidence.length, 1);
  assert.doesNotMatch(enriched.factual_summary, /fabricated/);
  const mirrorOnly = enrichEvent({ ...event, evidence: [{
    source_id: 'nexualpha-official-announcements', kind: 'official_notice',
    excerpt: 'Bybit lists TEST for spot trading.', url: 'https://nexualpha.com/updates/bybit-test',
  }] });
  assert.equal(mirrorOnly.cta_hints.every(hint => !hint.commercial_allowed), true);
});

test('grouped story summary includes notices from both venues without merging deadlines', () => {
  const enriched = enrichEvent({ ...event, event_type: 'delisting', venues: ['bybit', 'kucoin'], evidence: [
    { kind: 'official_notice', url: 'https://bybit.test/stg', excerpt: 'Bybit will delist STG on 2026-10-14. Withdrawals stop on 2026-11-14.' },
    { kind: 'official_notice', url: 'https://kucoin.test/stg', excerpt: 'KuCoin will delist STG on 2026-10-15. Withdrawals stop on 2026-11-15.' },
  ] });
  assert.equal(enriched.factual_summary, 'Bybit will delist STG on 2026-10-14. KuCoin will delist STG on 2026-10-15.');
  assert.deepEqual(enriched.summary_source_urls, ['https://bybit.test/stg', 'https://kucoin.test/stg']);
});

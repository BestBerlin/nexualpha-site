import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mergeRawItems, countIndependentSources } from './dedupe.mjs';
import { storyFacts, inferNarrativeType } from './facts.mjs';
import { buildDedupeSql, runVerify } from './pipeline.mjs';

const shadow = JSON.parse(readFileSync(new URL('./fixtures/shadow-1110.json', import.meta.url), 'utf8'));
const blockerEvent = shadow.plan.events.find(event => event.id === 3921);
const blockerText = [blockerEvent.title_internal, blockerEvent.factual_summary, ...blockerEvent.evidence.map(row => row.excerpt)].join(' ');
const blockerVenues = ['kucoin', 'mexc', 'bingx', 'phemex', 'xt', 'bitrue', 'coinw', 'poloniex', 'btcc', 'bitmart'];

test('regulator website-block stories classify as regulation and expose all named venues', () => {
  const facts = storyFacts({ title: blockerEvent.title_internal, excerpt: blockerText });
  assert.equal(facts.action, 'regulation');
  assert.equal(inferNarrativeType(blockerText), 'regulation');
  assert.deepEqual(facts.venues, blockerVenues);
});

test('new raw regulator blocking rows become regulation events with story venues', () => {
  const raw = {
    id: 54038,
    source_id: 'rsshub-telegram-wublockchainenglish',
    platform: 'telegram',
    tier: 2,
    url: blockerEvent.evidence[0].url,
    title: blockerEvent.title_internal,
    body_excerpt: blockerText,
    event_type_guess: 'unknown',
    published_at: '2026-10-13T01:36:17Z',
    entities: ['kucoin', 'mexc'],
  };
  const { events } = mergeRawItems([raw], {
    watchlist: blockerEvent.entities.map(entity => ({ id: entity.id, kind: entity.kind, aliases: entity.aliases, display_name: entity.display_name, status: entity.status })),
  });
  assert.equal(events.length, 1);
  assert.equal(events[0].event_type, 'regulation');

  const { sql } = buildDedupeSql({ events, irrelevantItems: [] }, [raw.id]);
  assert.match(sql, /'regulation'/);
  for (const venue of blockerVenues) assert.match(sql, new RegExp(`"${venue}"`));
});

test('verify reclassifies existing unknown regulator blocking events', () => {
  const calls = [];
  runVerify(sql => {
    calls.push(sql);
    if (calls.length === 1) {
      return JSON.stringify([{
        id: blockerEvent.id,
        last_update_at: '2026-10-13T03:00:00Z',
        title_internal: blockerEvent.title_internal,
        event_type: 'unknown',
        subjects: blockerEvent.entities.map(entity => entity.id),
        evidence: blockerEvent.evidence,
      }]);
    }
    if (calls.length === 2) return JSON.stringify(blockerEvent.entities);
    return '[]';
  });
  const updateSql = calls[3];
  assert.match(updateSql, /event_type='regulation'/);
  assert.match(updateSql, /story_action='regulation'/);
  for (const venue of blockerVenues) assert.match(updateSql, new RegExp(`"${venue}"`));
});

test('independent source counting dedupes reposted publisher identities', () => {
  assert.equal(countIndependentSources(blockerEvent.evidence), 3);
});

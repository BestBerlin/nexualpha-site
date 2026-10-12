import { test } from 'node:test';
import assert from 'node:assert/strict';
import { followupDecision, expiryDecision } from './lifecycle.mjs';

test('published event repeats append under existing slug; new fact types earn followup', () => {
  const event = { id: 12, state: 'published', main_question: 'What are the withdrawal conditions?' };
  assert.equal(followupDecision(event, { main_question: event.main_question }).action, 'append_evidence');
  for (const type of ['official_response', 'filing', 'repayment']) {
    assert.equal(followupDecision(event, { new_fact_types: [type] }).parent_event_id, 12);
  }
  assert.equal(followupDecision({ ...event, state: 'candidate' }, { new_fact_types: ['filing'] }).action, 'append_evidence');
  assert.equal(followupDecision(event, { main_question: 'How much money was repaid?' }).action, 'create_followup');
});
test('numeric followup threshold is strictly greater than 20%, never guesses missing baseline', () => {
  const event = { state: 'published' };
  assert.equal(followupDecision(event, { number_change: { previous: 100, current: 120 } }).action, 'append_evidence');
  assert.equal(followupDecision(event, { number_change: { previous: 100, current: 121 } }).action, 'create_followup');
  assert.equal(followupDecision(event, { number_change: { previous: 100, current: 79 } }).action, 'create_followup');
  assert.equal(followupDecision(event, { number_change: { previous: 0, current: 100 } }).action, 'append_evidence');
});
test('expiry respects flash/analysis/explainer windows and unknown timestamps', () => {
  const event = { state: 'new', source_published_at: '2026-10-10T00:00:00Z' };
  const now = '2026-10-12T01:00:00Z';
  assert.equal(expiryDecision(event, { now, format: 'flash' }).expired, true);
  assert.equal(expiryDecision(event, { now }).expired, true);
  assert.equal(expiryDecision(event, { now, format: 'data_explainer' }).expired, false);
  assert.equal(expiryDecision({ state: 'new' }, { now }).age_hours, null);
  assert.equal(expiryDecision({ ...event, state: 'claimed' }, { now }).expired, false);
  assert.equal(expiryDecision({ ...event, state: 'published' }, { now }).expired, false);
});

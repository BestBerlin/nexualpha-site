import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCalibrationQuery, runCalibration } from './calibration.mjs';

test('calibration query is read-only last-72h threshold report', () => {
  const sql = buildCalibrationQuery();
  assert.match(sql, /^WITH threshold_values/);
  assert.match(sql, /\(40\), \(45\), \(50\), \(55\)/);
  assert.match(sql, /interval '72 hours'/);
  assert.match(sql, /'target_per_day', 40/);
  assert.match(sql, /verification_status IN \('verified-primary','corroborated'\)/);
  assert.match(sql, /e\.state IN \('new','candidate','claimed','published','followup_watch'\)/);
  assert.match(sql, /e\.verified_at >= e\.last_update_at/);
  assert.match(sql, /s\.relevance > 0/);
  // Per-day rates divide by the hours the pool has actually collected (at most the window).
  assert.match(sql, /least\(72::numeric,/);
  assert.match(sql, /min\(fetched_at\) FROM raw_items/);
  assert.match(sql, /sum\(eligible\)::numeric \/ \(\(SELECT hours FROM coverage\) \/ 24\)/);
  assert.match(sql, /'coverage_hours'/);
  assert.match(sql, /AT TIME ZONE 'UTC'/);
  assert.doesNotMatch(sql, /\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bALTER\b/i);
});

test('calibration validates bounded knobs before SQL generation', () => {
  assert.throws(() => buildCalibrationQuery({ thresholds: [101] }), /threshold/);
  assert.throws(() => buildCalibrationQuery({ windowHours: 0 }), /window/);
  assert.throws(() => buildCalibrationQuery({ targetPerDay: 0 }), /target/);
});

test('runCalibration executes the generated report without mutating inputs', () => {
  const calls = [];
  const output = runCalibration(sql => {
    calls.push(sql);
    return '{"schema":"newsroom.calibration.v1"}';
  });
  assert.equal(output, '{"schema":"newsroom.calibration.v1"}');
  assert.equal(calls.length, 1);
  assert.match(calls[0], /newsroom\.calibration\.v1/);
});

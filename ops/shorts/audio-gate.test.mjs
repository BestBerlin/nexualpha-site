import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from './audio-gate.mjs';

test('no audio stream is blocked', () => {
  const r = evaluate({ audioStreams: 0, duration: 30 });
  assert.equal(r.ok, false);
  assert.deepEqual(r.reasons, ['no audio stream']);
});

test('a digitally silent AAC track (the 2026-10 YouTube Shorts) is blocked', () => {
  const r = evaluate({ audioStreams: 1, duration: 30, volumedetect: 'mean_volume: -91.0 dB\nmax_volume: -91.0 dB\nsilence_start: 0\nsilence_end: 30 | silence_duration: 30' });
  assert.equal(r.ok, false);
  assert.equal(r.reasons.length, 2);
});

test('-inf mean volume is blocked', () => {
  assert.equal(evaluate({ audioStreams: 1, duration: 10, volumedetect: 'mean_volume: -inf dB' }).ok, false);
});

test('quiet but audible track below -30 dB is blocked', () => {
  const r = evaluate({ audioStreams: 1, duration: 30, volumedetect: 'mean_volume: -34.2 dB\nmax_volume: -12.0 dB' });
  assert.deepEqual(r.reasons, ['mean volume -34.2 dB < -30 dB']);
});

test('more than 40% silence is blocked, trailing open silence counts to the end', () => {
  const r = evaluate({ audioStreams: 1, duration: 30, volumedetect: 'mean_volume: -20.0 dB\nsilence_start: 5\nsilence_end: 10\nsilence_start: 22' });
  assert.equal(r.silentRatio, 0.433);
  assert.equal(r.ok, false);
});

test('voiced track with music bed passes', () => {
  const r = evaluate({ audioStreams: 1, duration: 30, volumedetect: 'mean_volume: -18.5 dB\nmax_volume: -1.6 dB\nsilence_start: 29.2' });
  assert.equal(r.ok, true);
});

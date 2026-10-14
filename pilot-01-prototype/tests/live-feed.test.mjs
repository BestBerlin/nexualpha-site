import assert from 'node:assert/strict';
import test from 'node:test';
import { createLiveFeed } from '../server/live-feed.mjs';

test('combined feed coalesces simultaneous readers and refreshes once per 30 seconds', async () => {
  let now = 0, reads = 0;
  const feed = createLiveFeed({ now: () => now, readers: { ticker: async () => { reads++; return { rows: [1] }; }, flash: async (locale) => ({ locale }), funding: async () => { throw new Error('unavailable'); } } });
  const [a, b] = await Promise.all([feed('zh-Hans'), feed('zh-Hans')]);
  assert.equal(a, b);
  assert.equal(reads, 1);
  assert.equal(a.funding, null);
  assert.deepEqual(a.flash, { locale: 'zh-Hans' });
  now = 29999;
  assert.equal(await feed('zh-Hans'), a);
  now = 30000;
  assert.notEqual(await feed('zh-Hans'), a);
  assert.equal(reads, 2);
  await feed('en');
  assert.equal(reads, 3);
});

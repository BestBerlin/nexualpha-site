import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import viteConfig from '../vite.config.mjs';
import { createSsrHarness } from './helpers/ssr-hydration-harness.mjs';

test('referral answer first-paint CSS uses the venue-linked detail chunk', () => {
  const config = viteConfig({ command: 'build', mode: 'production', isSsrBuild: false });
  const getModuleInfo = () => ({ importedIds: [], importers: [], isExternal: false });
  for (const stylesheet of ['referral-native-answers.css', 'venue-page-slimming.css']) {
    assert.equal(config.build.rollupOptions.output.manualChunks(`/repo/pilot-01-prototype/src/components/v3/${stylesheet}`, { getModuleInfo }), 'route-v3-pages-detail');
  }
});

test('SSR omits unverified account tiles and DEX pending rebate pills while retaining reviewed fees', async () => {
  const harness = await createSsrHarness();
  try {
    for (const slug of ['binance', 'mexc', 'hyperliquid', 'uniswap']) {
      const dom = new JSDOM(await harness.render(`/zh-hans/exchanges/${slug}`));
      const document = dom.window.document;
      const tiles = [...document.querySelectorAll('.v3-venue-metrics-grid .v3-metric-tile')];
      assert.ok(document.querySelector('#fee-schedule'), `${slug}: research is server-rendered`);
      assert.equal(document.querySelectorAll('.v3-dex-fee-compact .v3-rebate-pill').length, 0, `${slug}: no pending DEX pill`);
      for (const tile of tiles) assert.doesNotMatch(tile.textContent, /尚未核验|待核验|N\/A|Pending/i, `${slug}: no placeholder metric`);
      if (slug === 'binance') assert.ok(tiles.some(tile => tile.textContent.includes('现货基准费率')), 'reviewed spot fees remain visible');
      if (slug === 'mexc') assert.ok(!tiles.some(tile => tile.textContent.includes('现货基准费率')), 'unreviewed spot fee tile is omitted');
      if (slug === 'uniswap') assert.ok(!tiles.some(tile => tile.textContent.includes('身份验证要求')), 'unchecked KYC requirement tile is omitted');
      dom.window.close();
    }
  } finally { await harness.close(); }
});

import assert from 'node:assert/strict';
import test from 'node:test';

test('funding SSR reserves countdown lines before the client clock starts', async () => {
  const { createServer } = await import('vite');
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { readFile } = await import('node:fs/promises');
  const vite = await createServer({ optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
  try {
    const { FundingRatesPage } = await vite.ssrLoadModule('/src/components/data/FundingRatesPage.jsx');
    const feed = JSON.parse(await readFile(new URL('./fixtures/market-data/market-events.sample.json', import.meta.url), 'utf8'));
    const html = renderToStaticMarkup(createElement(FundingRatesPage, { locale: 'en', initialFeed: feed }));
    const clocks = [...html.matchAll(/<span class="nxd-next"[^>]*>(.*?)<\/span>/g)];
    assert.ok(clocks.length > 0, 'fixture renders actual funding clocks');
    for (const [, clock] of clocks) {
      assert.match(clock, /<small aria-hidden="true" style="visibility:hidden">/);
      assert.match(clock, /00:00:00/);
    }
  } finally { await vite.close(); }
});

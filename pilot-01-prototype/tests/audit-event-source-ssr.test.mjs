import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import worker from '../worker/index.js';
import { createSsrHarness, SHELL_HTML, prerenderState, rootInnerHtml } from './helpers/ssr-hydration-harness.mjs';

const feed = { generatedAt: new Date().toISOString(), items: [{
  id: 'okx:accuracy-current', venue: 'okx', category: 'event',
  title: 'OKX shared source accuracy event', url: 'https://www.okx.com/help/accuracy-event',
  publishedAt: new Date(Date.now() - 3600000).toISOString(), sourceType: 'official_api',
}] };
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

test('the same official notice appears on homepage, comparison and profile SSR', async () => {
  for (const path of ['/', '/compare/binance-vs-okx', '/exchanges/okx']) {
    const html = await harness.render(`https://nexualpha.com${path}`, { officialAnnouncements: feed });
    assert.ok(html.includes(feed.items[0].title), `${path}: current notice must be visible`);
    if (path === "/exchanges/okx") assert.doesNotMatch(html, /Reviewed official updates|Only reviewed, current items from public official sources are published/);
  }
});

test('Worker replaces stale profile/compare notices and hydrates the same source with country context', async () => {
  const env = {
    INTEL_READ: async () => feed,
    NEWS_SSR_RENDER: harness.render,
    ASSETS: { fetch: async request => {
      const path = new URL(request.url).pathname;
      if (path === '/index.html') return new Response(SHELL_HTML, { headers: { 'content-type': 'text/html' } });
      return new Response('missing', { status: 404 });
    } },
  };
  for (const path of ['/compare/binance-vs-okx', '/exchanges/okx']) {
    const url = `https://nexualpha.com${path}?market=GB&product=spot`;
    const response = await worker.fetch(new Request(url), env);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.ok(html.includes(feed.items[0].title), path);
    const state = prerenderState(html);
    assert.deepEqual(state.officialAnnouncements, feed);
    assert.deepEqual(state.activityContext, { market: 'GB', product: 'spot' });
    const replay = await harness.render(url, { officialAnnouncements: state.officialAnnouncements });
    const mainText = (markup) => new JSDOM(markup).window.document.querySelector("main")?.textContent;
    assert.equal(mainText(rootInnerHtml(html)), mainText(replay), `${path}: hydrated source must reproduce SSR content`);
  }
});

test('homepage renders distinct pending-review and no-news notice states', async () => {
  const pending = { ...feed, items: [{ ...feed.items[0], reviewStatus: "PENDING", fixture: false }] };
  const pendingHtml = await harness.render("https://nexualpha.com/", { officialAnnouncements: pending });
  assert.match(pendingHtml, /Official notices are pending review before publication/);
  assert.ok(!pendingHtml.includes(feed.items[0].title));
  const emptyHtml = await harness.render("https://nexualpha.com/", { officialAnnouncements: { items: [] } });
  assert.match(emptyHtml, /No current exchange notice from the shared official feed/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { announcementSnapshot, announcementStatusLabel, ANNOUNCEMENT_MAX_AGE_MS } from '../src/components/shared/announcement-snapshot.js';
const now = Date.parse('2026-10-19T12:00:00Z');
const feed = { generatedAt: new Date(now).toISOString(), status: 'OK', sources: { x: { ok: true } }, items: [{ id: 'x' }] };
test('F05 announcement snapshot age, failures and recovery are explicit', () => {
  assert.equal(announcementSnapshot(feed, now).freshness, 'current');
  assert.equal(announcementSnapshot(feed, now + ANNOUNCEMENT_MAX_AGE_MS).freshness, 'current');
  assert.equal(announcementSnapshot(feed, now + ANNOUNCEMENT_MAX_AGE_MS + 1).freshness, 'stale');
  assert.equal(announcementSnapshot({ ...feed, status: 'DEGRADED' }, now).freshness, 'stale');
  assert.equal(announcementSnapshot({ ...feed, sources: { x: { ok: false } } }, now).freshness, 'stale');
  assert.equal(announcementSnapshot({ ...feed, stale: true }, now).freshness, 'stale');
  assert.equal(announcementSnapshot({ ...feed, sources: { x: { ok: true, at: new Date(now + 60_000).toISOString() } } }, now).freshness, 'current');
  assert.equal(announcementSnapshot({ ...feed, sources: { x: { ok: true, at: new Date(now + 60_001).toISOString() } } }, now).freshness, 'stale');
  assert.equal(announcementSnapshot({ ...feed, generatedAt: new Date(now + 60_001).toISOString() }, now).freshness, 'unavailable');
  assert.equal(announcementSnapshot(null, now).freshness, 'unavailable');
  assert.equal(announcementSnapshot(feed, now).freshness, 'current');
  assert.deepEqual(announcementSnapshot(feed, now).sources, feed.sources);
});
test('F05 serialized clock produces identical first hydration state', () => {
  const ssr = announcementSnapshot(feed, now);
  assert.deepEqual(announcementSnapshot(JSON.parse(JSON.stringify(ssr)), Date.parse(ssr.renderedAt)), ssr);
});
test('F05 all required locales have honest status labels', () => {
  for (const locale of ['en','zh-Hans','zh-Hant','es','pt-BR','fr','de','it','ja','ko','ru','tr','id','vi','ar']) {
    for (const freshness of ['current','stale','unavailable']) assert.ok(announcementStatusLabel(freshness, locale));
  }
});
test('F05 home SSR reads the request announcement snapshot and serializes it', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../worker/index.js', import.meta.url), 'utf8');
  const home = source.slice(source.indexOf('let renderedLiveHome = false;'), source.indexOf('// Live ticker bar (2026-10-13)'));
  assert.match(home, /await env\.INTEL_READ\(\)/);
  assert.match(home, /return turkeyAnnouncementFeed\(announcementSnapshot\(feed\), publicRoute, market\)/);
  assert.match(home, /const state = \{ heroVariant: routePayload.heroVariant, officialAnnouncements,/);
});

test('F05 build fallback preserves collector status and serializes its evaluation clock', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../scripts/generate-prerender-manifest.mjs', import.meta.url), 'utf8');
  assert.match(source, /officialAnnouncements: announcementSnapshot\(\{\s*\.\.\.officialAnnouncements,/);
});
test('F05 request-time home SSR and hydration receive exactly the same live snapshot', async () => {
  const { default: worker } = await import('../worker/index.js');
  let renderedState;
  const live = { ...feed, generatedAt: new Date().toISOString(), items: [], sources: { x: { ok: true } } };
  const baked = { ...feed, generatedAt: '2026-10-10T00:00:00Z', items: [{ id: 'baked-old' }] };
  const env = {
    INTEL_READ: async () => live,
    NEWS_SSR_RENDER: async (_url, state) => {
      renderedState = structuredClone(state);
      return '<main><h1>Home</h1><section id="h7-calc"></section><span id="live-announcement-status">' + state.officialAnnouncements.freshness + '</span></main>';
    },
    ASSETS: { fetch: async (request) => {
      const path = new URL(request.url).pathname;
      if (path === '/index.html') return new Response('<!doctype html><html><head><title>Home</title></head><body><div id="root"></div></body></html>', { headers: { 'content-type': 'text/html' } });
      if (path === '/prerender-manifest.json') return Response.json({ version: 'nexualpha-prerender-v1', routes: { '/|en': { pathname: '/', locale: 'en', html: '<main><h1>Baked home</h1></main>', officialAnnouncements: baked } } });
      return new Response('missing', { status: 404 });
    } },
  };
  const response = await worker.fetch(new Request('https://nexualpha.com/', { headers: { accept: 'text/html' } }), env);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.ok(renderedState, 'request-time renderer ran');
  assert.equal(renderedState.officialAnnouncements.generatedAt, live.generatedAt);
  assert.deepEqual(renderedState.officialAnnouncements.items, [], 'legitimate empty snapshot replaces baked rows');
  const state = JSON.parse(html.match(/id="nexualpha-prerender-state">([^<]+)<\/script>/)[1]);
  assert.deepEqual(state.officialAnnouncements, renderedState.officialAnnouncements);
  assert.equal(state.officialAnnouncements.freshness, 'current');
  assert.match(html, /id="live-announcement-status">current/);
  assert.doesNotMatch(html, /baked-old/);
});

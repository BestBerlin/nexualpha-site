import test from 'node:test';
import assert from 'node:assert/strict';
import { selectTargets, pageDecay, windows } from '../ops/seo-autopilot/measure.mjs';
import { guardProposal, applyProposals } from '../ops/seo-autopilot/overrides.mjs';
import { verify } from '../ops/seo-autopilot/verify.mjs';
import overrides from '../src/data/seo-autopilot-overrides.json' with { type: 'json' };
import { computeRouteSeo, applyAutopilotOverride } from '../src/data/seo-injection.js';
import worker, { routeMetadata, routeSeoPayload } from '../worker/index.js';
const row = (query, position, impressions = 3, page = '/exchanges/okx') => ({ keys: [query, `https://nexualpha.com${page}`], position, impressions });
test('selection reuses configurable striking band, best page and noise exclusions', () => {
  const result = selectTargets([row('okx fees', 20), row('okx fees', 12, 2, '/compare/binance-vs-okx'), row('blockchain', 90), row('nexualpha', 10), row('opusdte', 10), row('site:foo', 10), row('"okx"', 10), row('small', 10, 1), row('far', 71), row('boundary', 8)]);
  assert.deepEqual(result.targets.map((r) => r.query), ['boundary', 'okx fees']);
  assert.equal(result.targets[1].position, 12);
  assert.equal(result.excluded.find((r) => r.query === 'blockchain').reason, 'head-noise');
});
const good = { eligible: true, action: 'title', brand: 'NexuAlpha', locale: 'en', pathname: '/exchanges/okx', query: 'okx fees', position: 12, impressions: 3, proposedTitle: 'OKX trading fees explained | NexuAlpha' };
test('guards reject position, lengths, invented amount, missing brand, duplicates, noindex routes', () => {
  assert.deepEqual(guardProposal(good), []);
  for (const patch of [{ position: 8 }, { eligible: false }, { proposedTitle: 'short' }, { proposedTitle: 'x'.repeat(71) }, { proposedTitle: 'OKX fees $100 rewards | NexuAlpha' }, { proposedTitle: 'Exchange fees with no named entity' }]) assert.ok(guardProposal({ ...good, ...patch }).length);
  assert.ok(guardProposal(good, { '/other': { title: { en: good.proposedTitle } } }).includes('duplicate'));
  const a = applyProposals([good], {}, '2026-10-01');
  assert.equal(a.overrides[good.pathname].since, '2026-10-01');
  assert.equal(applyProposals([good], a.overrides, '2026-10-02').applied.length, 0);
});
test('weekly windows are disjoint and decay includes disappeared pages', () => {
  assert.deepEqual(windows('2026-10-21').current, { startDate: '2026-10-12', endDate: '2026-10-18' });
  assert.deepEqual(pageDecay([], [{ keys: ['page'], impressions: 20 }]), [{ page: 'page', before: 20, after: 0 }]);
});
test('final SSR override for venue and compare has route-seo payload parity', async () => {
  for (const pathname of ['/exchanges/okx', '/compare/binance-vs-okx']) {
    overrides[pathname] = { title: { en: good.proposedTitle }, description: { en: 'Fixture description '.repeat(5) } };
    try {
      const seo = computeRouteSeo({ url: `https://nexualpha.com${pathname}`, locale: 'en' });
      assert.equal(seo.title, good.proposedTitle);
      const url = new URL(`https://nexualpha.com${pathname}`);
      const payload = routeSeoPayload(await routeMetadata(url, {}), url);
      const response = await worker.fetch(new Request(`https://nexualpha.com/api/route-seo?path=${encodeURIComponent(pathname)}`), {}, {});
      assert.equal((await response.json()).title, seo.title);
      assert.equal(payload.title, seo.title);
      assert.equal(payload.description, seo.description);
    } finally { delete overrides[pathname]; }
  }
});
test('consumer excludes article bodies, noindex, locales without copy and revert', () => {
  const seo = { status: 200, robots: 'index,follow', title: 'before' };
  const fixture = { '/news/article': { title: { en: 'after' } }, '/exchanges/okx': { title: { en: 'after' } } };
  assert.equal(applyAutopilotOverride(seo, '/news/article', 'en', fixture).title, 'before');
  assert.equal(applyAutopilotOverride({ ...seo, robots: 'noindex,follow' }, '/exchanges/okx', 'en', fixture).title, 'before');
  assert.equal(applyAutopilotOverride(seo, '/exchanges/okx', 'ja', fixture).title, 'before');
  fixture['/exchanges/okx'].revert = true;
  assert.equal(applyAutopilotOverride(seo, '/exchanges/okx', 'en', fixture).title, 'before');
});
test('verification measures query+page and does not infer regression from missing data', async () => {
  const report = { date: '2026-10-21' }, fixture = { '/exchanges/okx': { since: '2026-10-01', query: 'okx fees', baselinePos: 20 } };
  await verify(report, fixture, { query: async (args) => { assert.equal(args.filters.length, 2); return [{ position: 12, impressions: 10 }]; } });
  assert.equal(report.verified[0].verdict, 'better');
  await verify(report, fixture, { query: async () => [] });
  assert.equal(report.verified[0].after, null);
});

test('description guards and explicit unmatched radar handoff stay conservative', async () => {
  const { unmatchedTopics } = await import('../ops/seo-autopilot/measure.mjs');
  const p = { ...good, action: 'description', proposedDescription: 'Compare OKX trading fees and account conditions using the source context published by NexuAlpha.' };
  assert.deepEqual(guardProposal(p), []);
  assert.ok(guardProposal({ ...p, proposedDescription: 'short' }).includes('length'));
  assert.equal(unmatchedTopics([{ query: 'fees guide', action: 'new-article' }, { query: 'nexu', action: 'new-article' }, { query: 'fees', action: 'new-article', url: '/news/fees' }]).length, 1);
});

test('fourteen consecutive observed regressions flag revert; missing days do not', async () => {
  const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
  const dir = await mkdtemp(new URL('../ops/seo-autopilot/history-test-', import.meta.url));
  const entry = { since: '2026-09-01', query: 'okx fees', baselinePos: 10 };
  const fixture = { '/exchanges/okx': entry };
  try {
    for (let i = 1; i <= 13; i++) {
      const date = new Date(Date.parse('2026-10-21') - i * 86400000).toISOString().slice(0, 10);
      await writeFile(`${dir}/${date}.json`, JSON.stringify({ date, verified: [{ pathname: '/exchanges/okx', ...entry, verdict: 'worse', after: { position: 20 } }] }));
    }
    const query = async () => [{ position: 20, impressions: 2 }];
    const flagged = await verify({ date: '2026-10-21' }, fixture, { dir, query });
    assert.equal(flagged['/exchanges/okx'].revert, true);
    await rm(`${dir}/2026-10-20.json`);
    const incomplete = await verify({ date: '2026-10-21' }, fixture, { dir, query });
    assert.equal(incomplete['/exchanges/okx'].revert, undefined);
    assert.equal(fixture['/exchanges/okx'].revert, undefined);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('atomic override IO supports external-volume Unicode paths', async () => {
  const { mkdtemp, rm } = await import('node:fs/promises');
  const { pathToFileURL } = await import('node:url');
  const { writeJson, readOverrides } = await import('../ops/seo-autopilot/overrides.mjs');
  const dir = await mkdtemp(new URL('../ops/seo-autopilot/io-test-', import.meta.url));
  try {
    const file = pathToFileURL(`${dir}/覆盖.json`);
    await writeJson(file, { '/exchanges/okx': { title: { en: good.proposedTitle } } });
    assert.equal((await readOverrides(file))['/exchanges/okx'].title.en, good.proposedTitle);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

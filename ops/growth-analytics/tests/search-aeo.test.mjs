import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { generateKeyPairSync } from 'node:crypto';
import { cohorts, summarize, normalizeRows, contentTasks, runSearch, fetchGsc, fetchBing } from '../search.mjs';
import { MONEY_QUERIES, buildAnswerChecks, collectProxy, runAeo, isoWeek, parsePublicWeb } from '../aeo.mjs';

test('search cohorts overlap and use impression-weighted positions, not average CTR', () => {
  assert.deepEqual(cohorts('NexuAlpha OKX 邀请码 返佣 deposit'), ['brand', 'referral', 'deposit']);
  assert.deepEqual(summarize([{ impressions: 90, clicks: 9, position: 10 }, { impressions: 10, clicks: 0, position: 20 }]), { impressions: 100, clicks: 9, ctr: 0.09, position: 11 });
  assert.equal(summarize([]).position, null);
  assert.equal(normalizeRows([{ Query: 'okx referral', Impressions: 3 }], 'bing')[0].position, null);
});
test('striking-distance tasks rank money cohorts first, keep non-cohort rows with evidence, retain unknown Bing landing pages', () => {
  const rows = normalizeRows([
    { keys: ['okx referral', 'https://nexualpha.com/exchanges/okx'], impressions: 100, clicks: 1, position: 8 },
    { keys: ['random topic', 'https://nexualpha.com/'], impressions: 100, clicks: 1, position: 9 },
    { keys: ['single impression topic', 'https://nexualpha.com/'], impressions: 1, clicks: 0, position: 9 },
    { keys: ['deposit', 'https://nexualpha.com/'], impressions: 0, clicks: 0, position: 20 },
    { keys: ['okx referral', 'https://nexualpha.com/exchanges/okx'], impressions: 50, clicks: 0, position: 30 },
  ], 'gsc');
  const tasks = contentTasks({ gsc: { rows }, bing: { rows: normalizeRows([{ Query: 'okx referral', Impressions: 4, Clicks: 0, AvgImpressionPosition: 20 }], 'bing') } });
  assert.equal(tasks.length, 3);
  assert.deepEqual(tasks.map(task => task.priority), ['P1', 'P1', 'P2']);
  assert.equal(tasks[0].status, 'READY_FOR_CONTENT_REVIEW');
  assert.equal(tasks[1].status, 'NEEDS_LANDING_PAGE_EVIDENCE');
  assert.equal(tasks[2].query, 'random topic');
  assert.deepEqual(cohorts('"mexc" "verification" "kyc"'), ['exchangeHowTo']);
});
test('daily search writes unavailable status safely, uses final-data lag and correct rolling window', async () => {
  const dir = await mkdtemp(path.join(process.cwd(), 'ops/growth-analytics/.test-search-'));
  try {
    const result = await runSearch({ date: '2026-10-15', outputDir: dir, gscClient: async window => {
      assert.equal(window.startDate, '2026-09-15'); assert.equal(window.endDate, '2026-10-12'); throw new Error('secret=DO_NOT_PRINT');
    }, bingClient: async () => ({ status: 'unavailable', reason: 'BING_CREDENTIALS_MISSING', rows: [] }) });
    assert.equal(result.sources.gsc.reason, 'REQUEST_OR_CREDENTIAL_ERROR');
    assert.doesNotMatch(await readFile(path.join(dir, 'search-2026-10-15.json'), 'utf8'), /DO_NOT_PRINT/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('30 distinct money queries (en, zh and local languages) generate 120 unknown engine checks without fabricated citations', () => {
  assert.equal(MONEY_QUERIES.length, 30);
  assert.equal(new Set(MONEY_QUERIES.map(q => q.query)).size, 30);
  const rows = buildAnswerChecks('2026-10-15');
  assert.equal(rows.length, 120);
  for (const lang of ['en', 'zh-Hans', 'es', 'pt-BR', 'id', 'tr', 'vi']) assert.ok(MONEY_QUERIES.some(q => q.lang === lang), lang);
  assert.ok(rows.every(row => row.cited === null && row.status === 'unavailable' && row.citations.length === 0));
});
test('manual answer evidence needs freshness, artifact, and sanitized citation URLs', () => {
  const evidence = { engine: 'chatgpt-search', queryId: MONEY_QUERIES[0].id, observedAt: '2026-10-15T01:00:00Z', answerEvidence: '/evidence/answer.png', citations: ['https://nexualpha.com/exchanges/okx'] };
  assert.equal(buildAnswerChecks('2026-10-15', [evidence])[0].cited, true);
  assert.equal(buildAnswerChecks('2026-10-15', [{ ...evidence, observedAt: '2026-10-01' }])[0].cited, null);
  assert.equal(buildAnswerChecks('2026-10-15', [{ ...evidence, citations: ['https://example.com/?token=secret'] }])[0].cited, null);
});
test('public proxy opens circuit after three failed requests and never asserts answer citations', async () => {
  let calls = 0;
  const rows = await collectProxy({ pauseMs: 0, fetcher: async () => { calls++; return { status: 'blocked', httpStatus: 403, nexualphaRank: null, top: [] }; } });
  assert.equal(calls, 3);
  assert.equal(rows.length, 30);
  assert.equal(rows[3].status, 'unavailable');
});
test('weekly recovery report labels missing Monday evidence honestly', async () => {
  const dir = await mkdtemp(path.join(process.cwd(), 'ops/growth-analytics/.test-aeo-'));
  try {
    const result = await runAeo({ date: '2026-10-15', outputDir: dir, fetchProxy: false, browserObserver: null });
    assert.equal(result.scheduledMonday, '2026-10-12');
    assert.equal(result.week, '2026-W42');
    assert.equal(result.recovery, true);
    const report = await readFile(path.join(dir, 'monday-2026-W42.md'), 'utf8');
    assert.match(report, /does not reconstruct historical Monday/);
    assert.match(report, /0\/120 observed/);
    assert.match(report, /unknown, not negative/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('ISO weeks retain correct year boundaries and first week', () => {
  assert.equal(isoWeek('2027-01-01'), '2026-W53');
  assert.equal(isoWeek('2027-01-04'), '2027-W01');
  assert.equal(isoWeek('2026-10-12'), '2026-W42');
});
test('public web parser unwraps URLs, excludes ads and strips tracking', () => {
  const html = '<div class="result result--ad"><a class="result__a" href="https://ad.example/">Ad</a></div>' +
    '<div class="result result--web"><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fnexualpha.com%2Fexchanges%2Fokx%3Futm_source%3Dddg">Hit</a></div>';
  assert.deepEqual(parsePublicWeb(html), { status: 'ok', top: [{ rank: 1, url: 'https://nexualpha.com/exchanges/okx', domain: 'nexualpha.com' }] });
  assert.equal(parsePublicWeb('<form class="challenge-form">captcha</form>').status, 'blocked');
});
test('native clients use read-only Google scope and preserve Bing provider buckets', async () => {
  const dir = await mkdtemp(path.join(process.cwd(), 'ops/growth-analytics/.test-clients-'));
  try {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    await writeFile(path.join(dir, 'sa.json'), JSON.stringify({ client_email: 'test@example.invalid', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) }));
    await writeFile(path.join(dir, 'gsc-api.env'), `GOOGLE_APPLICATION_CREDENTIALS="${path.join(dir, 'sa.json')}"`);
    await writeFile(path.join(dir, 'bing-webmaster-api.env'), "BING_WEBMASTER_API_KEY='test-value'");
    let requests = 0;
    const gsc = await fetchGsc({ startDate: '2026-09-15', endDate: '2026-10-12', privateDir: dir, fetchImpl: async (url, options) => {
      requests++;
      if (String(url).includes('oauth2')) {
        const claims = JSON.parse(Buffer.from(options.body.get('assertion').split('.')[1], 'base64url'));
        assert.equal(claims.scope, 'https://www.googleapis.com/auth/webmasters.readonly');
        return { ok: true, json: async () => ({ access_token: 'test-token' }) };
      }
      const body = JSON.parse(options.body);
      assert.equal(body.dataState, 'final'); assert.equal(body.rowLimit, 25000);
      return { ok: true, json: async () => ({ rows: [{ keys: ['okx referral', 'https://nexualpha.com/exchanges/okx'], impressions: 2, clicks: 1, position: 9 }] }) };
    } });
    assert.equal(requests, 2); assert.equal(gsc.status, 'ok'); assert.equal(gsc.rows[0].position, 9);
    const bing = await fetchBing({ privateDir: dir, fetchImpl: async url => {
      assert.equal(url.searchParams.get('apikey'), 'test-value');
      assert.equal(url.searchParams.get('siteUrl'), 'https://nexualpha.com/');
      return { ok: true, json: async () => ({ d: [{ Query: 'okx referral', Date: '/Date(1791763200000)/', Impressions: 12, Clicks: 1, AvgImpressionPosition: 13 }] }) };
    } });
    assert.equal(bing.window.type, 'provider-native-buckets'); assert.equal(bing.rows[0].providerDate, '/Date(1791763200000)/');
    assert.equal(bing.rows[0].page, null);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('browser evidence: explicit blocked/unavailable rows keep their reason; observed rows record mentions', () => {
  const q = MONEY_QUERIES[0];
  const rows = buildAnswerChecks('2026-10-18', [
    { engine: 'perplexity', queryId: q.id, status: 'unavailable', reason: 'ROBOTS_DISALLOWS_QUERY_URL' },
    { engine: 'google-ai-overview', queryId: q.id, status: 'blocked', reason: 'HUMAN_VERIFICATION_SERVED_NOT_SOLVED' },
    { engine: 'chatgpt-search', queryId: q.id, status: 'observed', observedAt: '2026-10-18T01:00:00Z', answerEvidence: '/tmp/a.png', mentioned: true, citations: ['https://www.okx.com/referral'] },
  ]).filter(row => row.queryId === q.id);
  const by = Object.fromEntries(rows.map(row => [row.engine, row]));
  assert.equal(by.perplexity.reason, 'ROBOTS_DISALLOWS_QUERY_URL');
  assert.equal(by['google-ai-overview'].status, 'blocked');
  assert.equal(by['chatgpt-search'].cited, false);
  assert.equal(by['chatgpt-search'].mentioned, true);
});

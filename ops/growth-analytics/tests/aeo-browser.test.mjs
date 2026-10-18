import assert from 'node:assert/strict';
import test from 'node:test';
import { robotsAllows, classifyPage, cleanCitation, mentionsUs, runBrowserAeo } from '../aeo-browser.mjs';

const perplexity = 'User-agent: *\nDisallow: /*?*q=\nDisallow: /search/new\n\nUser-agent: Googlebot\nDisallow: /search*\n';
const chatgpt = 'User-agent: PerplexityBot\nDisallow: /\n\nUser-agent: *\nAllow: /$\nAllow: /?*\nAllow: /search$\nDisallow: /\n';
const google = 'User-agent: *\nUser-agent: Yandex\nDisallow: /search\nAllow: /search/about\n';

test('robots matcher: longest match wins, wildcard and $ anchors, UA groups', () => {
  assert.equal(robotsAllows(perplexity, '/search?q=okx'), false);
  assert.equal(robotsAllows(chatgpt, '/?q=okx&hints=search'), true);
  assert.equal(robotsAllows(chatgpt, '/c/123'), false);
  assert.equal(robotsAllows(chatgpt, '/search'), true);
  assert.equal(robotsAllows(google, '/search?q=okx'), false);
  assert.equal(robotsAllows(google, '/search/about'), true);
  assert.equal(robotsAllows('', '/anything'), true);
});
test('human checks and rate limits are recorded as blocked, never as observations', () => {
  assert.equal(classifyPage({ httpStatus: 403, text: 'Verify you are human', answerText: '' }).reason, 'HUMAN_VERIFICATION_SERVED_NOT_SOLVED');
  assert.equal(classifyPage({ httpStatus: 200, text: '请验证您是真人', answerText: '' }).status, 'blocked');
  assert.equal(classifyPage({ httpStatus: 200, text: 'ok', answerText: "You've reached our limit of messages" }).reason, 'RATE_LIMITED');
  assert.equal(classifyPage({ httpStatus: 200, text: 'ok', answerText: '' }).status, 'unavailable');
  assert.equal(classifyPage({ httpStatus: 200, text: 'ok', answerText: 'x'.repeat(80), citations: [] }).status, 'observed');
});
test('citations drop tracking query strings and engine-internal links; brand mentions are detected', () => {
  assert.equal(cleanCitation('https://www.bitget.com/affiliates?utm_source=chatgpt.com'), 'https://www.bitget.com/affiliates');
  assert.equal(cleanCitation('https://chatgpt.com/auth/login'), null);
  assert.equal(cleanCitation('javascript:alert(1)'), null);
  assert.ok(mentionsUs('per NexuAlpha data')); assert.ok(!mentionsUs('Nexus DEX'));
});
test('engines disallowed by robots are recorded unavailable without launching a browser', async () => {
  const { mkdtemp, rm } = await import('node:fs/promises'); const path = await import('node:path');
  const dir = await mkdtemp(path.join(process.cwd(), 'ops/growth-analytics/.test-browser-'));
  try {
    const fetchImpl = async url => ({ ok: true, text: async () => String(url).includes('chatgpt') ? 'User-agent: *\nDisallow: /' : 'User-agent: *\nDisallow: /search\nDisallow: /*?*q=' });
    let launched = false;
    const { evidence } = await runBrowserAeo({ queries: [{ id: 'q1', query: 'okx', lang: 'en' }], date: '2026-10-18', outputDir: dir, fetchImpl, launch: async () => { launched = true; } });
    assert.equal(launched, false);
    assert.ok(Object.values(evidence.engineStatus).every(s => s.reason === 'ROBOTS_DISALLOWS_QUERY_URL'));
    assert.equal(evidence.results.length, 4);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

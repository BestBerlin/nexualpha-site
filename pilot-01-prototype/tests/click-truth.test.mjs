import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createClickClassifier, createBurstDetector } from '../server/click-metadata.mjs';
import { createGoRedirect } from '../server/go-redirect.mjs';
import { createCtaClickBeacon } from '../server/cta-click.mjs';
import { internalUserAgent } from '../scripts/lib/internal-http.mjs';

const browserUA = 'Mozilla/5.0 Chrome/130.0 Safari/537.36';
const ip = '203.0.113.7';
const time = new Date('2026-10-23T12:00:00Z');
async function fixture(t, overrides = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'click-truth-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'intel'));
  await writeFile(path.join(root, 'intel/partners.json'), JSON.stringify({ partners: [{ slug: 'okx', registrationUrl: 'https://www.okx.com/join/nexu888' }] }));
  const env = { CLICK_HASH_SECRET: 'test-only-key', ...overrides };
  const classify = createClickClassifier({ env, now: () => time.getTime(), burst: createBurstDetector({ limit: 2, now: () => time.getTime() }) });
  const eventFile = path.join(root, 'events.jsonl');
  const options = { clientRoot: root, eventFile, env, now: () => time, classify };
  return {
    go: createGoRedirect(options), site: createCtaClickBeacon(options), classify,
    raw: () => readFile(eventFile, 'utf8').catch(error => { if (error.code === 'ENOENT') return ''; throw error; }),
  };
}
const goRequest = (headers = {}) => new Request('https://nexualpha.com/go/okx?src=tg-test', { headers: { 'user-agent': browserUA, ...headers } });
const beacon = (headers = {}) => new Request('https://nexualpha.com/api/cta-click', { method: 'POST', headers: { origin: 'https://nexualpha.com', 'content-type': 'application/json', 'user-agent': browserUA, ...headers },
  body: JSON.stringify({ partner: 'okx', src: 'home-test', path: '/', cls: 'human', ipHash: ip }) });

test('routes share human/duplicate/burst classification and never write IP, full UA, secret or referrer query', async t => {
  const f = await fixture(t);
  const redirect = await f.go(goRequest({ referer: 'https://nexualpha.com/news?private=do-not-store', 'sec-fetch-site': 'same-origin', 'sec-fetch-user': '?1' }), ip);
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.get('location'), 'https://www.okx.com/join/nexu888');
  assert.equal((await f.site(beacon(), ip)).status, 204);
  await f.go(goRequest(), ip);
  const raw = await f.raw();
  const rows = raw.trim().split('\n').map(JSON.parse);
  assert.deepEqual(rows.map(row => row.cls), ['human', 'duplicate', 'burst']);
  assert.equal(new Set(rows.map(row => row.ipHash)).size, 1);
  assert.match(rows[0].ipHash, /^[a-f0-9]{64}$/);
  assert.deepEqual([rows[0].hasFetchSite, rows[0].hasFetchUser, rows[0].hasReferrerOrigin], [true, true, true]);
  assert.doesNotMatch(raw, /203\.0\.113|Mozilla|Chrome\/130|do-not-store|test-only-key/);
});

test('internal CTA requests and beacons write no row; browser QA sets a session-wide internal UA', async t => {
  const f = await fixture(t);
  const headers = { 'user-agent': internalUserAgent('qa-regression', browserUA) };
  assert.equal((await f.go(goRequest(headers), ip)).status, 302);
  assert.equal((await f.site(beacon(headers), ip)).status, 204);
  assert.equal(await f.raw(), '');
  const qa = await readFile(new URL('../scripts/qa-regression.mjs', import.meta.url), 'utf8');
  assert.match(qa, /page\.setUserAgent\(internalUserAgent\("qa-regression", device\.ua\)\)/);
  assert.match(qa, /ANALYTICS_BEACONS\.has\(pathname\).*req\.respond\(\{ status: 204/);
  for (const script of ['qa-browser-sweep.py', 'qa-flows.py']) {
    assert.match(await readFile(new URL(`../scripts/${script}`, import.meta.url), 'utf8'), /new_context\([^\n]*user_agent=[^\n]*NexuAlpha-internal\//);
  }
});

test('own-IP and authenticated internal header exclusions apply to both routes; spoofed header is counted', async t => {
  const f = await fixture(t, { CLICK_INTERNAL_IPS: ip, CLICK_INTERNAL_TOKEN: 'private-internal-token' });
  await f.go(goRequest(), ip);
  await f.site(beacon(), ip);
  await f.go(goRequest({ 'x-nexualpha-internal': 'private-internal-token' }), '192.0.2.1');
  await f.site(beacon({ 'x-nexualpha-internal': 'private-internal-token' }), '192.0.2.1');
  assert.equal(await f.raw(), '');
  await f.go(goRequest({ 'x-nexualpha-internal': '1', 'x-real-ip': ip, 'x-forwarded-for': ip }), '192.0.2.1');
  const rows = (await f.raw()).trim().split('\n').map(JSON.parse);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].cls, 'human');
});

test('bot and prefetch requests preserve redirects and persist excluded evidence on both routes', async t => {
  const f = await fixture(t);
  const response = await f.go(goRequest({ 'user-agent': 'TelegramBot' }), ip);
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), 'https://www.okx.com/join/nexu888');
  await f.site(beacon({ 'sec-purpose': 'prefetch' }), ip);
  assert.deepEqual((await f.raw()).trim().split('\n').map(JSON.parse).map(row => row.cls), ['bot', 'bot']);
});


test('IP-literal referring hosts are not written to click rows', async t => {
  const f = await fixture(t);
  for (const referer of ['https://203.0.113.7/private?q=hidden', 'https://[2001:db8::7]:8080/private']) {
    await f.go(goRequest({ referer }), ip);
  }
  const raw = await f.raw();
  const rows = raw.trim().split('\n').map(JSON.parse);
  assert.deepEqual(rows.map(row => row.ref), [null, null]);
  assert.ok(rows.every(row => row.hasReferrerOrigin));
  assert.doesNotMatch(raw, /203\.0\.113\.7|2001:db8|hidden/);
});


test('alternate route and site beacon use the same exchange identity for dedup', async t => {
  const f = await fixture(t);
  const response = await f.go(new Request('https://nexualpha.com/go/binance-page?to=/en/support', { headers: { 'user-agent': browserUA } }), ip);
  assert.equal(response.status, 302);
  const after = f.classify(beacon(), { clientIp: ip, partner: 'binance', at: time });
  assert.equal(after.cls, 'duplicate');
  const row = JSON.parse((await f.raw()).trim());
  assert.equal(row.partner, 'binance-page');
  assert.equal(row.venue, 'binance');
});

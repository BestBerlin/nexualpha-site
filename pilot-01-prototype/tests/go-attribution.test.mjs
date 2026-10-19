import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { attributedGoHref, installGoAttribution, partnerAttributionTarget } from '../src/data/go-attribution.js';
import { createGoRedirect } from '../server/go-redirect.mjs';

const location = new URL('https://nexualpha.com/zh-hans/exchanges/okx?utm_source=telegram&utm_campaign=october&email=alice%40example.com');

test('go source includes page and module, preserves safe UTMs and keeps route context', () => {
  const target = new URL(attributedGoHref('/go/okx?src=registration-card&locale=zh-Hans&p=publisher', location), location);
  assert.match(target.searchParams.get('src'), /^zh-hans-exchanges-okx--registration/);
  assert.equal(target.searchParams.get('page'), location.pathname);
  assert.equal(target.searchParams.get('module'), 'registration-card');
  assert.equal(target.searchParams.get('utm_source'), 'telegram');
  assert.equal(target.searchParams.get('utm_campaign'), 'october');
  assert.equal(target.searchParams.get('email'), null);
  assert.equal(target.searchParams.get('p'), 'publisher');
  assert.equal(target.searchParams.get('locale'), 'zh-Hans');
  assert.equal(attributedGoHref(target.href, location), `${target.pathname}${target.search}`, 'idempotent across pointerdown and click');
  assert.equal(attributedGoHref('https://evil.test/go/okx', location), 'https://evil.test/go/okx');
  assert.equal(attributedGoHref('/exchanges/okx', location), '/exchanges/okx');
});

test('live delegated listener decorates dynamic links and removes listeners on teardown', () => {
  const dom = new JSDOM('<main></main>', { url: location.href });
  const stop = installGoAttribution({ window: dom.window, document: dom.window.document });
  dom.window.document.querySelector('main').innerHTML = '<a href="/go/okx" data-cta-placement="hero"><span>Sign up</span></a>';
  const anchor = dom.window.document.querySelector('a');
  anchor.querySelector('span').dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true }));
  assert.equal(new URL(anchor.href).searchParams.get('module'), 'hero');
  stop();
  anchor.setAttribute('href', '/go/okx');
  anchor.dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true }));
  assert.equal(anchor.getAttribute('href'), '/go/okx');
  const reinstall = installGoAttribution({ window: dom.window, document: dom.window.document });
  dom.window.history.pushState({}, '', '/coins/bitcoin?tab=fees');
  anchor.dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true }));
  assert.equal(new URL(anchor.href).searchParams.get('utm_source'), 'telegram', 'landing UTM survives SPA navigation');
  reinstall();
  dom.window.close();
});

test('partner forwarding defaults closed and copies only approved safe parameters without touching codes', () => {
  const target = 'https://www.okx.com/join/nexu888?ref=owner&src=owner';
  const incoming = new URLSearchParams('src=home--hero&utm_source=telegram&utm_medium=broadcast&utm_campaign=alice%40example.com&ref=attacker&next=https://evil.test');
  assert.equal(partnerAttributionTarget(target, incoming), target);
  const result = new URL(partnerAttributionTarget(target, incoming, { 'www.okx.com': ['src', 'utm_source', 'utm_campaign', 'ref', 'next'] }));
  assert.equal(result.searchParams.get('ref'), 'owner');
  assert.equal(result.searchParams.get('src'), 'owner');
  assert.equal(result.searchParams.get('utm_source'), 'telegram');
  assert.equal(result.searchParams.get('utm_medium'), null);
  assert.equal(result.searchParams.get('utm_campaign'), null);
  assert.equal(result.searchParams.get('next'), null);
  assert.equal(partnerAttributionTarget('https://www.okx.com.evil.test/join/x', incoming, { 'www.okx.com': ['utm_source'] }), 'https://www.okx.com.evil.test/join/x');
});

test('actual redirect records sanitized page/module and forwards only explicit approved parameters', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'go-attribution-'));
  try {
    await mkdir(path.join(dir, 'intel'));
    await writeFile(path.join(dir, 'intel/partners.json'), JSON.stringify({ partners: [{ slug: 'okx', registrationUrl: 'https://www.okx.com/join/nexu888' }] }));
    const eventFile = path.join(dir, 'go.jsonl');
    const handle = createGoRedirect({ clientRoot: dir, eventFile, attributionPolicy: { 'www.okx.com': ['src', 'utm_source', 'utm_campaign'] } });
    const href = attributedGoHref('/go/okx?src=registration-card', location);
    const response = await handle(new Request(new URL(href, location), { headers: { 'user-agent': 'Mozilla/5.0' } }));
    const target = new URL(response.headers.get('location'));
    assert.equal(response.status, 302);
    assert.equal(target.pathname, '/join/nexu888');
    assert.equal(target.searchParams.get('utm_source'), 'telegram');
    assert.equal(target.searchParams.get('utm_campaign'), 'october');
    const [row] = (await readFile(eventFile, 'utf8')).trim().split('\n').map(JSON.parse);
    assert.equal(row.path, location.pathname);
    assert.equal(row.module, 'registration-card');
    assert.equal(row.src, target.searchParams.get('src'));
    assert.equal(row.locale, 'zh-Hans');
    assert.doesNotMatch(JSON.stringify(row), /alice|email|Mozilla/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('expired campaign fallback retains safe attribution and the decorated heatmap still enforces geo policy', async () => {
  const handle = createGoRedirect({ clientRoot: fileURLToPath(new URL('../public/', import.meta.url)), now: () => new Date('2026-11-01T00:00:00Z') });
  const href = attributedGoHref('/go/bitget-alliance?src=campaign-banner', location);
  const response = await handle(new Request(new URL(href, location)));
  const target = new URL(response.headers.get('location'), location);
  assert.equal(target.pathname, '/go/bitget');
  assert.equal(target.searchParams.get('utm_source'), 'telegram');
  assert.equal(target.searchParams.get('page'), location.pathname);
  assert.equal(target.searchParams.get('module'), 'campaign-banner');
  const heatmap = attributedGoHref('/go/okx?src=liq-heatmap&locale=en', location, 'card');
  const blocked = await handle(new Request(new URL(heatmap, location), { headers: { 'cf-ipcountry': 'JP' } }));
  assert.equal(blocked.status, 302, 'module attribution cannot erase existing territorial gates');
  assert.equal(blocked.headers.get('location'), '/exchanges/okx', 'denied attributed heatmap links stay on our venue page');
});

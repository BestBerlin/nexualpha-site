#!/usr/bin/env node
// Isolated LOCAL acceptance harness. Never attaches to the user's Chrome.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log('node scripts/verify-r74-cold-attribution-browser.mjs --origin http://127.0.0.1:PORT --output /absolute/evidence-dir --expected-build BUILD');
  process.exit(0);
}
const options = {};
for (let i = 0; i < args.length; i += 2) {
  assert(['--origin', '--output', '--expected-build'].includes(args[i]) && args[i + 1], 'Unexpected or missing argument');
  assert(!options[args[i]], 'Duplicate argument');
  options[args[i]] = args[i + 1];
}
assert(options['--origin'] && options['--output'] && options['--expected-build'], 'All three arguments are required; candidate must be frozen');
const origin = new URL(options['--origin']);
assert(origin.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname), 'Only local unauthenticated HTTP preview permitted');
assert(!origin.username && !origin.password && origin.pathname === '/' && !origin.search && !origin.hash, 'Origin only, without credentials/path/query');
const base = origin.origin;
const output = resolve(options['--output']);
const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hashes = {
  'partner-registry.js': '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a',
  'venue-database.js': '0ce124afbe9f4758ce9ec093c79372550ce2e2e90a7342aa05ecc8d3482e1d52',
  'public-cta.js': '675875240d5fbb05498284a37f90a14488d6ace73d19b102caeb5add9e33f8e3',
  'regional-cta.js': 'a2542bb137b6b6ff123a0d3c6b3a01b09e1e3a785ee223e3b4e04a3fe8aab665',
};
async function commercialBytes() {
  const result = {};
  for (const [name, expected] of Object.entries(hashes)) {
    result[name] = createHash('sha256').update(await readFile(join(project, 'src/data', name))).digest('hex');
    assert.equal(result[name], expected, `Protected commercial bytes changed: ${name}`);
  }
  return result;
}
async function version() {
  const response = await fetch(`${base}/version.json`, { redirect: 'error', signal: AbortSignal.timeout(10000) });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.buildId, options['--expected-build'], 'Served build differs from frozen candidate');
  return data;
}
const report = { startedAt: new Date().toISOString(), base, expectedBuild: options['--expected-build'], status: 'RUNNING', cases: [], boundary: 'Browser test only; no registration, Telegram send, collector ingestion or conversion claim' };
const keys = ['utm_source', 'utm_medium', 'utm_campaign'];
const standard = { locale: 'pt-BR', market: 'BR', product: 'spot' };
const cases = [
  { id: 'cold-valid-a', cold: true, input: { utm_source: 'tg_channel', utm_medium: 'manual_draft', utm_campaign: 'r74_cold_a' }, expected: ['tg_channel', 'manual_draft', 'r74_cold_a'] },
  { id: 'warm-valid-a', cold: false, input: { utm_source: 'tg_channel', utm_medium: 'manual_draft', utm_campaign: 'r74_cold_a' }, expected: ['tg_channel', 'manual_draft', 'r74_cold_a'] },
  // Unknown identity/referral fields intentionally select the non-prerender fallback.
  // Keep this native-SSR cold case inside the established query contract.
  { id: 'cold-invalid', cold: true, input: { utm_source: 'invalid/slash', utm_medium: 'email', utm_campaign: 'x'.repeat(61) }, expected: [null, null, null] },
  { id: 'cold-mixed-invalid-medium', cold: true, input: { utm_source: 'tg_channel', utm_medium: 'email', utm_campaign: 'r74_mixed' }, expected: ['tg_channel', null, 'r74_mixed'] },
  { id: 'cold-source-less-after-a', cold: true, input: {}, expected: [null, null, null] },
  { id: 'cold-valid-b', cold: true, input: { utm_source: 'site_b', utm_medium: 'broadcast', utm_campaign: 'r74_cold_b' }, expected: ['site_b', 'broadcast', 'r74_cold_b'] },
  { id: 'cold-source-less-after-b', cold: true, input: {}, expected: [null, null, null] },
];
function attribution(url) { const u = new URL(url); return keys.map(k => u.searchParams.get(k)); }
function assertTrackedCache(headers, requestedUrl) {
  const u = new URL(requestedUrl);
  if (!keys.some(key => u.searchParams.has(key))) return 'SOURCE_LESS_PUBLIC_ALLOWED';
  const directives = String(headers['cache-control'] || '').toLowerCase().split(',').map(value => value.trim().split('=')[0]);
  assert(directives.includes('private') && directives.includes('no-store'), 'Tracked document requires private, no-store Cache-Control');
  assert(!directives.includes('public'), 'Tracked document must not advertise public caching');
  return 'PASS';
}
function context(url, expectedPath, expected) {
  const u = new URL(url);
  assert.equal(u.origin, base);
  assert.equal(u.pathname, expectedPath);
  for (const [key, value] of Object.entries(standard)) assert.equal(u.searchParams.get(key), value, `Decision context ${key}`);
  assert.deepEqual(attribution(url), expected, 'Exact sanitized tracking triple');
  for (const key of ['email', 'ref', 'inviteCode']) assert(!u.searchParams.has(key), `Unreviewed parameter propagated: ${key}`);
}
async function snapshot(page) {
  return page.evaluate(() => {
    const a = document.querySelector('.br-chain__primary');
    return { url: location.href, readyState: document.readyState, rootReady: document.documentElement.dataset.nexualphaHydrated || '', pageReadiness: [...document.querySelectorAll('[data-nexualpha-scope-start="page-content"]')].map(e => e.dataset.nexualphaInteractionReady || ''), target: a ? { selector: '.br-chain__primary', tag: a.tagName, connected: a.isConnected, text: a.textContent.trim(), rawHref: a.getAttribute('href'), href: a.href } : null, scrollY, viewport: { width: innerWidth, height: innerHeight, rootFont: getComputedStyle(document.documentElement).fontSize }, h1: document.querySelector('h1')?.textContent, canonical: document.querySelector('link[rel="canonical"]')?.href, lang: document.documentElement.lang };
  });
}
async function warmReady(page) {
  await page.waitForFunction(() => document.documentElement.dataset.nexualphaHydrated === 'true' && [...document.querySelectorAll('[data-nexualpha-scope-start="page-content"]')].some(e => e.dataset.nexualphaInteractionReady === 'true') && document.querySelector('.br-chain__primary')?.isConnected, { timeout: 15000 });
}
let browser;
let profile;
await mkdir(output, { recursive: true });
try {
  report.versionBefore = await version();
  report.commercialBefore = await commercialBytes();
  const registry = await import(join(project, 'src/data/partner-registry.js'));
  report.protectedPartners = Object.fromEntries(['binance', 'bitget', 'okx', 'backpack'].map(slug => [slug, { code: registry.CUSTOM_INVITE_CODES[slug], urls: registry.PARTNER_REGISTRATION_URLS[slug], registrationUrl: registry.getPartner(slug)?.registrationUrl, inviteCode: registry.getPartner(slug)?.inviteCode }]));
  const requireShared = createRequire('/Users/bestberlin/.codex/shared-tools/web-quality/package.json');
  const puppeteer = requireShared('puppeteer-core');
  profile = await mkdtemp(join(tmpdir(), 'nexualpha-r74-cold-'));
  browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', userDataDir: profile, headless: true, args: ['--no-first-run', '--no-default-browser-check'] });
  for (const spec of cases) {
    const item = { id: spec.id, cold: spec.cold, isolation: { freshContext: true, cacheDisabled: true, bypassServiceWorker: true }, requests: [], passiveEvents: [], errors: [], console: [], steps: [], status: 'NOT_STARTED' };
    report.cases.push(item);
    const isolated = await browser.createBrowserContext();
    const page = await isolated.newPage();
    let hold = spec.cold;
    const pending = [];
    const completedAssets = [];
    const docs = [];
    try {
      await page.setViewport({ width: 390, height: 844 });
      await page.setCacheEnabled(false);
      await page.setBypassServiceWorker(true);
      await page.setRequestInterception(true);
      page.on('request', request => {
        const u = new URL(request.url());
        const script = u.pathname.startsWith('/assets/') && (request.resourceType() === 'script' || /\.(?:m?js)$/.test(u.pathname));
        const record = { time: new Date().toISOString(), url: request.url(), type: request.resourceType(), method: request.method(), disposition: '' };
        item.requests.push(record);
        if (u.origin !== base || request.method() !== 'GET') { record.disposition = 'blocked-boundary'; void request.abort().catch(() => {}); return; }
        if (hold && script) { record.disposition = 'held-app-module'; pending.push({ request, record }); return; }
        record.disposition = 'continued'; void request.continue().catch(() => {});
        if (request.isNavigationRequest() && request.frame() === page.mainFrame()) docs.push({ time: record.time, url: record.url });
      });
      page.on('requestfinished', request => { const u = new URL(request.url()); if (u.pathname.startsWith('/assets/') && (request.resourceType() === 'script' || /\.(?:m?js)$/.test(u.pathname))) completedAssets.push(request.url()); });
      page.on('pageerror', error => item.errors.push(String(error)));
      page.on('console', message => {
        if (message.text().startsWith('R74_PASSIVE:')) { try { item.passiveEvents.push(JSON.parse(message.text().slice(12))); } catch {} }
        else if (['error', 'warning'].includes(message.type())) item.console.push({ type: message.type(), text: message.text() });
      });
      await page.evaluateOnNewDocument(() => {
        for (const type of ['pointerdown', 'mouseup', 'click']) document.addEventListener(type, event => {
          const a = event.target?.closest?.('.br-chain__primary');
          if (a) console.debug('R74_PASSIVE:' + JSON.stringify({ type, time: Date.now(), url: location.href, connected: a.isConnected, href: a.href, defaultPreventedAtCapture: event.defaultPrevented, trusted: event.isTrusted }));
        }, { capture: true, passive: true });
      });
      const inputUrl = `${base}/br/pix?${new URLSearchParams({ ...standard, ...spec.input })}`;
      item.inputUrl = inputUrl;
      const response = await page.goto(inputUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      assert.equal(response.status(), 200);
      item.responseHeaders = response.headers();
      item.initialCacheVerdict = assertTrackedCache(item.responseHeaders, inputUrl);
      if (!spec.cold) await warmReady(page);
      for (const [index, path, text] of [[0, '/br/custos', 'Próximo: Custos'], [1, '/br/comparar', 'Próximo: Comparar']]) {
        if (!spec.cold) await warmReady(page);
        const step = { index, expectedPath: path, attempts: 0, navigation: 'NOT_STARTED', attribution: 'NOT_EVALUATED', docsBefore: docs.length };
        item.steps.push(step);
        step.before = await snapshot(page);
        assert(step.before.target?.connected && step.before.target.tag === 'A', 'Exact native chain anchor missing');
        assert.equal(step.before.target.text, text);
        if (spec.cold) {
          assert.notEqual(step.before.rootReady, 'true', 'Cold lane became root hydrated');
          assert.equal(completedAssets.length, 0, 'App JS completed before cold click');
        }
        step.completedAssetsBefore = [...completedAssets];
        step.heldAssetsBefore = pending.map(x => x.request.url());
        // Href attribution is recorded separately; navigation may be projected by an early native bridge.
        step.hrefAttribution = attribution(step.before.target.href);
        await page.screenshot({ path: join(output, `${spec.id}-${index}-before.png`) });
        const handle = await page.$('.br-chain__primary');
        const navigation = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).then(response => ({ response }), error => ({ error: String(error) }));
        step.clickAt = new Date().toISOString();
        step.attempts = 1;
        await handle.click();
        const result = await navigation;
        step.documentRequests = docs.slice(step.docsBefore);
        step.afterNative = await snapshot(page);
        step.navigation = result.error ? 'FAILED' : 'COMPLETED';
        step.navigationError = result.error || null;
        step.httpStatus = result.response?.status() ?? null;
        await page.screenshot({ path: join(output, `${spec.id}-${index}-native-destination.png`) });
        assert(!result.error, `Native navigation failed: ${result.error}`);
        assert.equal(step.httpStatus, 200, 'Destination HTTP status');
        assert(step.documentRequests.length >= 1, 'No actual main-frame document navigation observed');
        step.destinationResponseHeaders = result.response.headers();
        step.destinationCacheVerdict = assertTrackedCache(step.destinationResponseHeaders, step.documentRequests[0].url);
        if (spec.cold) {
          assert.notEqual(step.afterNative.rootReady, 'true', 'Destination hydrated before native capture');
          assert.equal(completedAssets.length, 0, 'App JS completed during held navigation');
        }
        // Verify first network URL independently of later browser/history rewriting.
        step.attribution = 'FAIL';
        context(step.documentRequests[0].url, path, spec.expected);
        context(step.afterNative.url, path, spec.expected);
        step.attribution = 'PASS';
        step.requestedAttribution = attribution(step.documentRequests[0].url);
        step.nativeAttribution = attribution(step.afterNative.url);
      }
      hold = false;
      await Promise.all(pending.splice(0).map(async ({ request, record }) => { try { await request.continue(); record.disposition = 'released-after-native-captures'; } catch { record.disposition = 'source-context-ended-before-release'; } }));
      await warmReady(page);
      item.finalHydrated = await snapshot(page);
      context(item.finalHydrated.url, '/br/comparar', spec.expected);
      await page.screenshot({ path: join(output, `${spec.id}-final-hydrated.png`) });
      item.hydration = item.errors.length === 0 && !item.console.some(e => /hydration|hydrating|Minified React error/i.test(e.text)) ? 'PASS' : 'FAIL';
      assert.equal(item.hydration, 'PASS', 'Runtime/hydration error');
      item.status = 'PASS';
    } catch (error) { item.status = item.steps.some(s => s.attempts) ? 'FAIL' : 'NOT_STARTED'; item.failure = String(error); }
    finally { await isolated.close(); }
    await writeFile(join(output, 'observations.json'), JSON.stringify(report, null, 2) + '\n');
  }
  report.commercialAfter = await commercialBytes();
  report.versionAfter = await version();
  report.status = report.cases.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL';
} catch (error) { report.status = 'FAIL'; report.failure = String(error); }
finally {
  if (browser) await browser.close();
  if (profile) await rm(profile, { recursive: true, force: true });
  report.finishedAt = new Date().toISOString();
  report.cleanup = { ownedBrowserClosed: !!browser, temporaryProfileRemoved: !!profile };
  await writeFile(join(output, 'observations.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ status: report.status, evidence: join(output, 'observations.json'), cases: report.cases.map(c => ({ id: c.id, status: c.status })) }));
process.exitCode = report.status === 'PASS' ? 0 : 1;

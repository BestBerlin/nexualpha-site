import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createCspReporter, reportOnlyPolicy, workerInlineScriptHashes } from '../server/csp-report.mjs';
import { createProductionServer } from '../server.mjs';

const request = (body, headers = { 'content-type': 'application/csp-report' }) => new Request('http://localhost/api/csp-report', { method: 'POST', headers, body });
test('CSP hashes trusted inline scripts without allowing inline or eval globally', () => {
  const hash = createHash('sha256').update('hello()').digest('base64');
  const policy = reportOnlyPolicy('<script>hello()</script><script src="/a.js"></script><script type="application/ld+json">{}</script>');
  assert.ok(policy.includes(`'sha256-${hash}'`));
  assert.ok(policy.includes("default-src 'self'; script-src 'self'"));
  assert.ok(policy.includes('report-uri /api/csp-report'));
  const scriptSrc = policy.split(';').find((part) => part.trim().startsWith('script-src'));
  assert.ok(!scriptSrc.includes('unsafe-inline') && !policy.includes('unsafe-eval'));
});
test('CSP allows inline styles so SSR critical CSS and style attributes stop firing reports', () => {
  const policy = reportOnlyPolicy('');
  assert.match(policy, /(?:^|; )style-src 'self' 'unsafe-inline'(?:;|$)/);
});
test('CSP reports discard all identifying strings and use a bounded global log budget', async () => {
  const rows = []; let clock = 0;
  const report = createCspReporter({ log: (row) => rows.push(row), now: () => clock, limit: 2 });
  const body = JSON.stringify({ 'csp-report': { 'effective-directive': 'script-src-elem', 'blocked-uri': 'https://secret.example/user?token=SECRET', 'document-uri': 'SECRET', 'script-sample': 'SECRET' } });
  assert.equal((await report(request(body))).status, 204);
  assert.deepEqual(rows, [{ event: 'csp-report-only', directive: 'script-src-elem', blocked: 'url-or-other' }]);
  assert.equal((await report(request('bad'))).status, 400);
  assert.equal((await report(request(body))).status, 204);
  clock = 60_000;
  assert.equal((await report(request(body))).status, 204);
});
test('CSP endpoint bounds streaming input and validates method/type and Reporting API shape', async () => {
  const rows = []; const report = createCspReporter({ log: (row) => rows.push(row) });
  assert.equal((await report(new Request('http://localhost'))).status, 405);
  assert.equal((await report(request('{}', { 'content-type': 'text/plain' }))).status, 415);
  assert.equal((await report(request('x'.repeat(16_385)))).status, 413);
  assert.equal((await report(request(JSON.stringify([{ body: { effectiveDirective: 'script-src', blockedURL: 'inline' } }]), { 'content-type': 'application/reports+json' }))).status, 204);
  assert.deepEqual(rows, [{ event: 'csp-report-only', directive: 'script-src', blocked: 'inline' }]);
});
test('production server adds report-only header and keeps enforced CSP unchanged', async () => {
  const server = await createProductionServer({ env: { INTEL_REFRESH: 'off', FX_REFRESH: 'off' }, worker: { fetch: () => new Response('<html>ok</html>', { headers: { 'content-type': 'text/html', 'content-security-policy': "frame-ancestors 'self'" } }) } });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const response = await fetch(base);
    assert.match(response.headers.get('content-security-policy-report-only'), /report-uri \/api\/csp-report/);
    assert.equal(response.headers.get('content-security-policy'), "frame-ancestors 'self'");
    assert.equal((await fetch(`${base}/api/csp-report`)).status, 405);
    assert.equal((await fetch(`${base}/api/csp-report`, { method: 'POST', headers: { 'content-type': 'application/csp-report' }, body: '{}' })).status, 204);
  } finally { await new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }); }
});
test('the worker\'s own inline scripts are hashed per response; look-alike or injected scripts are not', async () => {
  const bridge = '/* Prerendered content is already visible. */(()=>{let p;const s="/assets/index-AbC12345.js";p=1})();';
  const css = '(()=>{const l=[...document.querySelectorAll("link[data-nexualpha-deferred-css]")];l.length})();';
  const html = `<html><body><script>evil()</script><script data-nexualpha-deferred-hydration>${bridge}</script><script>${css}</script></body></html>`;
  const sha = (text) => `'sha256-${createHash('sha256').update(text).digest('base64')}'`;
  assert.deepEqual(workerInlineScriptHashes(html), [sha(bridge), sha(css)]);
  assert.deepEqual(workerInlineScriptHashes('<script data-nexualpha-deferred-hydration>evil()</script>'), []);
  const server = await createProductionServer({ env: { INTEL_REFRESH: 'off', FX_REFRESH: 'off' }, worker: { fetch: () => new Response(html, { headers: { 'content-type': 'text/html' } }) } });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/`);
    const policy = response.headers.get('content-security-policy-report-only');
    assert.ok(policy.includes(sha(bridge)) && policy.includes(sha(css)));
    assert.ok(!policy.includes(sha('evil()')));
    assert.equal(await response.text(), html);
  } finally { await new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }); }
});
test('versioned fonts and hashed assets are immutable for a year; unversioned fonts are not', async () => {
  const server = await createProductionServer({ env: { INTEL_REFRESH: 'off', FX_REFRESH: 'off' }, worker: { fetch: (request, env) => env.ASSETS.fetch(request) } });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const versioned = await fetch(`${base}/fonts/zh-Hans-400.woff2?v=fbb0aa7d1023`);
    assert.equal(versioned.status, 200);
    assert.equal(versioned.headers.get('cache-control'), 'public, max-age=31536000, immutable');
    await versioned.arrayBuffer();
    const plain = await fetch(`${base}/fonts/zh-Hans-400.woff2`);
    assert.equal(plain.headers.get('cache-control'), 'public, max-age=86400');
    await plain.arrayBuffer();
  } finally { await new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }); }
});

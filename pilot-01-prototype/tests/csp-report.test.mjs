import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createCspReporter, reportOnlyPolicy } from '../server/csp-report.mjs';
import { createProductionServer } from '../server.mjs';

const request = (body, headers = { 'content-type': 'application/csp-report' }) => new Request('http://localhost/api/csp-report', { method: 'POST', headers, body });
test('CSP hashes trusted inline scripts without allowing inline or eval globally', () => {
  const hash = createHash('sha256').update('hello()').digest('base64');
  const policy = reportOnlyPolicy('<script>hello()</script><script src="/a.js"></script><script type="application/ld+json">{}</script>');
  assert.ok(policy.includes(`'sha256-${hash}'`));
  assert.ok(policy.includes("default-src 'self'; script-src 'self'"));
  assert.ok(policy.includes('report-uri /api/csp-report'));
  assert.ok(!policy.includes('unsafe-inline') && !policy.includes('unsafe-eval'));
});
test('CSP reports discard all identifying strings and use a bounded global log budget', async () => {
  const rows = []; let clock = 0;
  const report = createCspReporter({ log: (row) => rows.push(row), now: () => clock, limit: 2 });
  const body = JSON.stringify({ 'csp-report': { 'effective-directive': 'script-src-elem', 'blocked-uri': 'https://secret.example/user?token=SECRET', 'document-uri': 'SECRET', 'script-sample': 'SECRET' } });
  assert.equal((await report(request(body))).status, 204);
  assert.deepEqual(rows, [{ event: 'csp-report-only', directive: 'script-src-elem', blocked: 'url-or-other' }]);
  assert.equal((await report(request('bad'))).status, 400);
  assert.equal((await report(request(body))).status, 429);
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

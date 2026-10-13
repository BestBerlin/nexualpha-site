// Run against the built local server with INTEL_REFRESH=off.
import assert from 'node:assert/strict';
import { LOCALE_PREFIX_BY_CODE, localizedPath } from '../src/data/locale-routing.js';
const base = process.argv[2] || 'http://127.0.0.1:48913';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'This smoke test targets a local preview.');
let pages = 0;
for (const locale of Object.keys(LOCALE_PREFIX_BY_CODE)) {
  for (const path of ['/long-short', '/whales']) {
    const response = await fetch(`${base}${localizedPath(path, locale)}`, { headers: { accept: 'text/html' } });
    assert.equal(response.status, 200, `${locale}${path}`);
    assert.equal(response.headers.get('cache-control'), 'no-store', `${locale}${path}`);
    const html = await response.text();
    assert.match(html, /data-testid="(?:long-short|whales)-page"/);
    assert.match(html, /route-radar/);
    assert.match(html, /nexualpha-prerender-state/);
    if (['ur', 'uk'].includes(locale)) assert.match(html, /noindex,follow/);
    pages += 1;
  }
}
for (const kind of ['long-short', 'whales']) {
  const response = await fetch(`${base}/api/${kind}.json`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const snapshot = await response.json();
  assert.equal(snapshot.kind, kind);
  assert.equal(snapshot.status, 'unavailable', 'Start the preview with INTEL_REFRESH=off.');
  assert.deepEqual(snapshot.rows, []);
  const head = await fetch(`${base}/api/${kind}.json`, { method: 'HEAD' });
  assert.equal(await head.text(), '');
}
console.log(`PASS: ${pages} compiled SSR locale pages, 2 unavailable APIs, and 2 HEAD responses`);

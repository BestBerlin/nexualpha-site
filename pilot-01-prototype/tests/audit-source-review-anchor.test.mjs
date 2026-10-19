import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('F11 source-review resolves to the real venue source section without losing the legacy hash', async () => {
  const source = await readFile(new URL('../src/components/v3/VenueDetailPage.jsx', import.meta.url), 'utf8');
  assert.match(source, /<section className="v2-section v3-profile-research-hub" id="source-review">/);
  assert.equal((source.match(/id="source-review"/g) || []).length, 1);
  assert.match(source, /<details className="v3-profile-sources-group" id="sources">/);
});

test('F11 both source hash targets reserve space for the sticky header', async () => {
  const css = await readFile(new URL('../src/components/v3/venue-detail-layout.css', import.meta.url), 'utf8');
  assert.match(css, /\.v3-profile-page :is\(#source-review, #sources\)\s*\{\s*scroll-margin-block-start:\s*6rem;\s*\}/);
});

test('F11 source-review and legacy source hashes survive venue hydration', async () => {
  const { createSsrHarness, hydrateInJsdom, hydrationErrors } = await import('./helpers/ssr-hydration-harness.mjs');
  const harness = await createSsrHarness();
  try {
    for (const slug of ['kucoin', 'gate-io', 'mexc', 'coinbase']) {
      const path = `/ja/exchanges/${slug}#source-review`;
      const html = await harness.render(path);
      assert.equal((html.match(/id="source-review"/g) || []).length, 1, `${slug}: SSR target`);
      const document = `<!doctype html><html><head><title>t</title></head><body><div id="root">${html}</div></body></html>`;
      const { errors, inspected } = await hydrateInJsdom(harness.vite, document, `https://nexualpha.com${path}`, {
        timeoutMs: 600,
        inspect(window) {
          const doc = window.document;
          return {
            count: doc.querySelectorAll('#source-review').length,
            realSection: doc.querySelector('#source-review')?.matches('section.v3-profile-research-hub'),
            legacy: doc.querySelector('#source-review > details#sources') !== null,
          };
        },
      });
      assert.deepEqual(hydrationErrors(errors), [], slug);
      assert.deepEqual(inspected, { count: 1, realSection: true, legacy: true }, slug);
    }
  } finally {
    await harness.close();
  }
});

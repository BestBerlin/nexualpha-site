import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyNewsCache, verifyPinnedInputs, prepareLocalRelease } from '../scripts/prepare-r118-local-release.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const pins = JSON.parse(readFileSync(path.join(root, 'ops/release/r118-local-input-pins.json'), 'utf8'));
const client = path.join(root, 'dist/client');
let originalSnapshotUnavailable;
try { verifyPinnedInputs(root, pins); } catch (error) { originalSnapshotUnavailable = `Original R118 pinned release snapshot unavailable: ${error.message}`; }
test('exact R118 current materials pass local preparation coherence gate', {skip: originalSnapshotUnavailable}, () => {
  verifyPinnedInputs(root, pins);
  assert.deepEqual(verifyNewsCache(client, pins), {
    fingerprint: '6315ca29bbdac98361156e6e1562df12190e5fc66464fb5a1d58771655e25259',
    routeCount: 2250, publishedCount: 861, noindexArticles: 24,
  });
});

for (const mutation of ['manifest-fingerprint', 'payload-fingerprint', 'missing-cache', 'missing-cache-file', 'source-change', 'feed-change']) {
  test(`local preparation refuses ${mutation} before generating an output`, async () => {
    const temp = mkdtempSync(path.join(tmpdir(), 'r118-negative-'));
    try {
      mkdirSync(path.join(temp, 'dist/client/content'), { recursive: true });
      let feed = readFileSync(path.join(client, 'content/news-feed.json'), 'utf8');
      const manifest = JSON.parse(readFileSync(path.join(client, 'prerender-manifest.json'), 'utf8'));
      if (mutation === 'manifest-fingerprint') manifest.routes['/news|en'].newsFeedFingerprint = 'invalid';
      if (mutation === 'missing-cache') delete manifest.routes['/news|en'];
      if (mutation === 'payload-fingerprint') {
        mkdirSync(path.join(temp, 'dist/client/prerender'), { recursive: true });
        manifest.routes['/news|en'].asset = '/prerender/corrupt.json';
        writeFileSync(path.join(temp, 'dist/client/prerender/corrupt.json'), JSON.stringify({ newsFeedFingerprint: 'invalid' }));
      }
      if (mutation === 'feed-change') feed += '\n';
      writeFileSync(path.join(temp, 'dist/client/content/news-feed.json'), feed);
      writeFileSync(path.join(temp, 'dist/client/prerender-manifest.json'), JSON.stringify(manifest));
      let localPins = { ...pins, hashes: {}, sourceFiles: undefined, publishedKeys: Object.entries(manifest.routes).filter(([, row]) => row.searchPublished).map(([key]) => key).sort(), noindexSlugs: [] };
      if (mutation === 'missing-cache') localPins.publishedKeys.push('/news|en');
      localPins.publishedKeys.sort();
      if (mutation === 'source-change') {
        writeFileSync(path.join(temp, 'changed-source.js'), 'unbuilt source change');
        localPins.hashes = { 'changed-source.js': 'not-the-expected-hash' };
      }
      const output = path.join(temp, 'must-not-exist.tgz');
      const matcher = mutation === 'source-change' ? /Pinned input changed/ : mutation === 'missing-cache' ? /Search publication authority changed/ : mutation === 'missing-cache-file' ? /ENOENT/ : /fingerprint mismatch/;
      await assert.rejects(prepareLocalRelease({ projectRoot: temp, output, pins: localPins }), matcher);
      assert.throws(() => readFileSync(output), /ENOENT/);
    } finally { rmSync(temp, { recursive: true, force: true }); }
  });
}

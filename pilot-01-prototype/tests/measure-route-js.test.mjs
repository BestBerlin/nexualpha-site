import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { gzipSync } from 'node:zlib';
import { compareSnapshots, localeCopyRoots, main, measureRoute, moduleAsset, publishedEnglishArticle, routeLocale, staticJavaScriptClosure } from '../scripts/measure-route-js.mjs';

const manifest = {
  'index.html': { isEntry: true, file: 'entry.js', imports: ['shared'], dynamicImports: ['other'] },
  route: { file: 'route.js', imports: ['shared', 'cycle', 'css'], dynamicImports: ['other'] },
  shared: { file: 'shared.js' },
  cycle: { file: 'cycle.js', imports: ['route'] },
  css: { file: 'route.css' },
  other: { file: 'deferred.js' },
};

test('news sampling uses an indexable English edition and preserves the baseline article', () => {
  const draft = { slug: 'draft', locale: 'en', seo: { noindex: true } };
  const english = { slug: 'english', title: { en: 'English' }, content: { en: 'Article' }, seo: { noindex: false } };
  const explicit = { slug: 'explicit', language: 'en', seo: { noindex: false } };
  const rows = [draft, english, explicit];
  assert.equal(publishedEnglishArticle(rows), english);
  assert.equal(publishedEnglishArticle(rows, '/news/explicit'), explicit);
  assert.equal(publishedEnglishArticle(rows, '/news/draft'), undefined);
  assert.equal(publishedEnglishArticle([{ slug: 'unpublished', locale: 'en' }]), undefined);
});

test('static closures deduplicate shared imports, terminate cycles, and exclude dynamic imports and CSS', () => {
  assert.deepEqual(staticJavaScriptClosure(manifest, ['entry.js', 'route.js']), ['cycle.js', 'entry.js', 'route.js', 'shared.js']);
  assert.deepEqual(staticJavaScriptClosure(manifest, ['entry.js']), ['entry.js', 'shared.js']);
});

test('module ownership resolves manual chunk aliases and explicit locale hydration roots', () => {
  const owners = { 'src/components/Page.jsx': { file: 'route.js' }, 'src/data/copy/en.js': { file: 'english.js' } };
  assert.equal(moduleAsset('./components/Page.jsx', owners), 'route.js');
  assert.equal(moduleAsset('/src/data/copy/en.js', owners), 'english.js');
  assert.throws(() => moduleAsset('./missing.js', owners), /No built module ownership/);
  assert.throws(() => moduleAsset('escape.js', { 'src/escape.js': { file: '../outside.js' } }), /Invalid JavaScript asset/);
});

test('missing manifest chunks and static edges fail closed', () => {
  assert.throws(() => staticJavaScriptClosure(manifest, ['unknown.js']), /missing from Vite manifest/);
  assert.throws(() => staticJavaScriptClosure({ entry: { file: 'entry.js', imports: ['missing'] } }, ['entry.js']), /Missing static import/);
});

test('locale copy roots count English fallback plus the route locale only when runtime is reachable', () => {
  const copies = { runtime: 'runtime.js', locales: { en: 'en.js', 'zh-Hans': 'zh.js', ja: 'ja.js' } };
  assert.deepEqual(localeCopyRoots(null, ['runtime.js'], 'en'), []);
  assert.deepEqual(localeCopyRoots(copies, ['entry.js'], 'zh-Hans'), []);
  assert.deepEqual(localeCopyRoots(copies, ['entry.js', 'runtime.js'], 'en'), ['en.js']);
  assert.deepEqual(localeCopyRoots(copies, ['runtime.js'], 'zh-Hans'), ['en.js', 'zh.js']);
  assert.throws(() => localeCopyRoots(copies, ['runtime.js'], 'ar'), /Missing mandatory locale copy pack: ar/);
  assert.throws(() => localeCopyRoots({ runtime: 'runtime.js', locales: {} }, ['runtime.js']), /Missing mandatory locale copy pack: en/);
});

test('route locales follow the app parser for canonical, alias, country, and English paths', () => {
  for (const [pathname, locale] of [['/', 'en'], ['/funding-rates', 'en'], ['/zh-hans', 'zh-Hans'], ['/zh-cn/exchanges/bitget', 'zh-Hans'], ['/pt-br/news/example', 'pt-BR'], ['/br', 'pt-BR'], ['/jp', 'ja'], ['/en/exchanges/bitget', 'en']]) assert.equal(routeLocale(pathname), locale, pathname);
});

test('mandatory dynamic locale payloads include their static dependencies without other locales', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'route-js-locales-'));
  try {
    const build = {
      entry: { file: 'entry.js', imports: ['runtime'] }, runtime: { file: 'runtime.js', dynamicImports: ['en', 'zh', 'fr'] },
      en: { file: 'en.js', imports: ['packShared'] }, zh: { file: 'zh.js', imports: ['packShared'] },
      fr: { file: 'fr.js' }, packShared: { file: 'pack-shared.js' },
    };
    for (const chunk of Object.values(build)) await writeFile(path.join(root, chunk.file), chunk.file.repeat(10));
    const options = { clientRoot: root, manifest: build, moduleOwners: {}, entryFile: 'entry.js', modulePaths: [],
      localeCopyManifest: { runtime: 'runtime.js', locales: { en: 'en.js', 'zh-Hans': 'zh.js', fr: 'fr.js' } } };
    const english = await measureRoute({ ...options, pathname: '/' });
    assert.deepEqual(english.files.map((file) => file.file), ['en.js', 'entry.js', 'pack-shared.js', 'runtime.js']);
    assert.deepEqual(english.localeCopyRoots, ['en.js']);
    const chinese = await measureRoute({ ...options, pathname: '/zh-hans' });
    assert.equal(chinese.jsRequests, 5);
    assert.deepEqual(chinese.localeCopyRoots, ['en.js', 'zh.js']);
    assert.ok(!chinese.files.some((file) => file.file === 'fr.js'));
    const withoutRuntime = await measureRoute({ ...options, manifest: { ...build, entry: { file: 'entry.js' } }, pathname: '/zh-hans' });
    assert.deepEqual(withoutRuntime.files.map((file) => file.file), ['entry.js']);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('measurements retain exact files and sum raw bytes and gzip level 6 per file', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'route-js-'));
  try {
    const contents = { 'entry.js': 'entry '.repeat(31), 'route.js': 'route '.repeat(51), 'shared.js': 'shared '.repeat(71), 'cycle.js': 'cycle '.repeat(91) };
    for (const [file, body] of Object.entries(contents)) await writeFile(path.join(root, file), body);
    const row = await measureRoute({ clientRoot: root, manifest, moduleOwners: { 'src/Page.jsx': { file: 'route.js' } }, entryFile: 'entry.js', pathname: '/example', modulePaths: ['./Page.jsx'] });
    assert.equal(row.jsRequests, 4);
    assert.deepEqual(row.files.map((item) => item.file), Object.keys(contents).sort());
    assert.equal(row.js.bytes, Object.values(contents).reduce((sum, text) => sum + Buffer.byteLength(text), 0));
    assert.equal(row.js.gzipBytes, Object.values(contents).reduce((sum, text) => sum + gzipSync(text, { level: 6 }).length, 0));
    await rm(path.join(root, 'route.js'));
    await assert.rejects(() => measureRoute({ clientRoot: root, manifest, moduleOwners: {}, entryFile: 'route.js', pathname: '/missing', modulePaths: [] }), /ENOENT/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

const row = (pathname, jsRequests, gzipBytes, bytes = gzipBytes * 3) => ({ pathname, jsRequests, js: { bytes, gzipBytes } });

test('both request count and gzip must fall at least 40%, with home reported as a control', () => {
  const before = { rows: [row('/target', 10, 100), row('/', 2, 20)] };
  const after = { rows: [row('/target', 6, 60), row('/', 3, 30)] };
  const result = compareSnapshots(before, after, ['/target']);
  assert.equal(result[0].passed, true);
  assert.equal(result[1].target, false);
  assert.equal(result[1].passed, true);
  assert.equal(compareSnapshots(before, { rows: [row('/target', 7, 50)] }, ['/target'])[0].passed, false);
  assert.equal(compareSnapshots(before, { rows: [row('/target', 5, 61)] }, ['/target'])[0].passed, false);
});

test('comparison rejects missing routes, duplicate routes, and nonpositive or malformed sizes', () => {
  const good = { rows: [row('/target', 10, 100)] };
  assert.throws(() => compareSnapshots(good, good, ['/missing']), /Missing required comparison route/);
  assert.throws(() => compareSnapshots({ rows: [row('/target', 0, 100)] }, good, ['/target']), /invalid sizes/);
  assert.throws(() => compareSnapshots({ rows: [row('/target', 10, NaN)] }, good, ['/target']), /invalid sizes/);
  assert.throws(() => compareSnapshots({ rows: [row('/target', 10, 100), row('/target', 10, 100)] }, good, ['/target']), /repeats/);
  assert.throws(() => compareSnapshots({ rows: [] }, good, []), /No baseline/);
});

test('CLI rejects malformed options and baseline overwrite before reading build files', async () => {
  await assert.rejects(() => main(['--unknown']), /Invalid option/);
  await assert.rejects(() => main(['--output']), /Invalid option/);
  await assert.rejects(() => main(['--strict']), /requires --compare/);
  await assert.rejects(() => main(['--route-module', '/route']), /expects/);
  await assert.rejects(() => main(['--compare', 'same.json', '--output', './same.json']), /must not overwrite/);
});

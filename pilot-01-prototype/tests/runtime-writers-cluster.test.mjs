import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createFlashMemory, persistFlashMemory } from '../server/flash-memory.mjs';
import { persistIntelArchive } from '../server/intel-feed.mjs';
import { createClickStorage } from '../server/click-storage.mjs';
import { createOgImageRoute } from '../server/og-image.mjs';

const run = promisify(execFile);
const now = Date.now();
const flashItem = (id) => ({ id, key: id, type: 'sharp-move', time: new Date(now).toISOString(), symbol: 'BTC' });
const announcement = (id) => ({
  id: `okx:${id}`, venue: 'okx', category: 'event', title: `OKX ${id}`,
  url: `https://www.okx.com/help/${id}`, publishedAt: new Date(now).toISOString(), sourceType: 'official_api',
});
const fixture = () => mkdtemp(path.join(tmpdir(), 'nexu-runtime-writers-'));
const rows = async (file) => (await readFile(file, 'utf8')).trim().split('\n').map(JSON.parse);

test('primary snapshot queues retain concurrent first sightings and recover after a failed write', async () => {
  const root = await fixture();
  try {
    const flash = path.join(root, 'flash.json');
    await Promise.all(Array.from({ length: 20 }, (_, id) => persistFlashMemory(flash, [flashItem(String(id))])));
    await persistFlashMemory(flash, [{ ...flashItem('0'), symbol: 'changed' }]);
    const saved = JSON.parse(await readFile(flash, 'utf8')).items;
    assert.equal(saved.length, 20);
    assert.equal(saved.find((item) => item.id === '0').symbol, 'BTC', 'first sighting survives stale worker snapshots');
    const intel = path.join(root, 'intel.json');
    await Promise.all(Array.from({ length: 20 }, (_, id) => persistIntelArchive(intel, { items: [announcement(String(id))] }, now)));
    assert.equal(JSON.parse(await readFile(intel, 'utf8')).items.length, 20);
    const blocked = path.join(root, 'blocked');
    await writeFile(blocked, 'not a directory');
    const failed = path.join(blocked, 'flash.json');
    await assert.rejects(persistFlashMemory(failed, [flashItem('retry')]));
    await rm(blocked);
    await persistFlashMemory(failed, [flashItem('retry')]);
    assert.equal(JSON.parse(await readFile(failed, 'utf8')).items.length, 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('flash flush persists throttled snapshots before shutdown', async () => {
  const root = await fixture();
  try {
    const file = path.join(root, 'flash.json');
    const memory = createFlashMemory({ file, minIntervalMs: 60_000 });
    await memory.save([flashItem('first')]);
    await memory.flush();
    await memory.save([flashItem('second')]);
    await memory.flush();
    assert.deepEqual((await memory.load()).map((row) => row.id).sort(), ['first', 'second']);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('click storage enforces the append bound in UTF-8 bytes including its newline', async () => {
  const calls = [], logs = [];
  const storage = createClickStorage({ append: async (...args) => calls.push(args), makeDirectory: async () => {}, log: (line) => logs.push(JSON.parse(line)) });
  assert.equal(await storage.write('/unused/events', { value: 'a'.repeat(4082) }, 'site'), true);
  assert.equal(Buffer.byteLength(calls[0][1]), 4095);
  assert.equal(calls[0][2].flag, 'a');
  assert.equal(await storage.write('/unused/events', { value: 'a'.repeat(4083) }, 'site'), false);
  assert.equal(await storage.write('/unused/events', { value: '漢'.repeat(1400) }, 'site'), false);
  assert.equal(calls.length, 1);
  assert.equal(logs[0].code, 'EVENT_TOO_LARGE');
});

test('two real cluster workers merge snapshots through IPC and append intact click/error JSONL', async () => {
  const root = await fixture();
  try {
    const imports = Object.fromEntries(['cluster-rpc', 'flash-memory', 'intel-feed', 'click-storage', 'error-monitor'].map((name) => [name, new URL(`../server/${name}.mjs`, import.meta.url).href]));
    const script = path.join(root, 'writers.mjs');
    await writeFile(script, `
      import cluster from 'node:cluster';
      import { mkdir, writeFile } from 'node:fs/promises';
      import path from 'node:path';
      import { servePrimaryCalls } from ${JSON.stringify(imports['cluster-rpc'])};
      import { createFlashMemory, persistFlashMemory } from ${JSON.stringify(imports['flash-memory'])};
      import { createIntelFeed, persistIntelArchive } from ${JSON.stringify(imports['intel-feed'])};
      import { createClickStorage } from ${JSON.stringify(imports['click-storage'])};
      import { createErrorMonitor } from ${JSON.stringify(imports['error-monitor'])};
      const root = ${JSON.stringify(root)};
      if (cluster.isPrimary) {
        let exits = 0;
        for (let n = 0; n < 2; n++) {
          const worker = cluster.fork();
          servePrimaryCalls(worker, {
            'flash-save': ({file, items}) => persistFlashMemory(file, items),
            'intel-save': ({file, archive, now}) => persistIntelArchive(file, archive, now),
          });
          worker.once('exit', (code) => { if (code) process.exitCode = code; if (++exits === 2) process.disconnect?.(); });
        }
      } else {
        const id = String(cluster.worker.id);
        const flash = createFlashMemory({file: path.join(root, 'flash.json')});
        await flash.save([{id, key:id, type:'sharp-move', time:new Date().toISOString(), symbol:'BTC'}]);
        await flash.flush();
        const client = path.join(root, id);
        await mkdir(path.join(client, 'intel'), {recursive:true});
        await writeFile(path.join(client, 'intel/official-announcements.json'), JSON.stringify({generatedAt:new Date().toISOString(),items:[{id:'okx:'+id,venue:'okx',category:'event',title:'OKX '+id,url:'https://www.okx.com/help/'+id,publishedAt:new Date().toISOString(),sourceType:'official_api'}]}));
        const intel = createIntelFeed(client, {enabled:false, archiveFile:path.join(root,'intel.json')});
        await intel.flush();
        const clicks = createClickStorage();
        const errors = createErrorMonitor(path.join(root, 'errors.jsonl'), {buildId:'3.0-cluster-test',environment:'test',dedupeMs:0});
        await Promise.all(Array.from({length:60}, async (_, n) => {
          if (!await clicks.write(path.join(root,'clicks.jsonl'),{worker:id,n,text:'漢'.repeat(100)},'test')) throw new Error('click write failed');
          if (!await errors.record({component:'web',errorCode:'SITE_REQUEST_UNAVAILABLE'})) throw new Error('error write failed');
        }));
        process.disconnect();
      }
    `);
    await run(process.execPath, [script], { timeout: 30_000 });
    assert.equal(JSON.parse(await readFile(path.join(root, 'flash.json'), 'utf8')).items.length, 2);
    assert.equal(JSON.parse(await readFile(path.join(root, 'intel.json'), 'utf8')).items.length, 2);
    const clicks = await rows(path.join(root, 'clicks.jsonl'));
    const errors = await rows(path.join(root, 'errors.jsonl'));
    assert.equal(clicks.length, 120);
    assert.equal(new Set(clicks.map(({ worker, n }) => `${worker}:${n}`)).size, 120);
    assert.equal(errors.length, 120);
    assert.equal(new Set(errors.map(({ eventId }) => eventId)).size, 120);
    for (const row of [...clicks, ...errors]) assert.ok(Buffer.byteLength(`${JSON.stringify(row)}\n`) < 4096);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('parallel same-key OG cache writes publish a complete image and leave no colliding temporary files', async () => {
  const root = await fixture();
  const logs = [];
  const png = Buffer.alloc(128, 42);
  class Renderer { render() { return { asPng: () => png }; } }
  try {
    const cacheDir = path.join(root, 'cache');
    const routes = Array.from({ length: 20 }, () => createOgImageRoute({ clientRoot: root, cacheDir, loadRenderer: async () => Renderer, log: (line) => logs.push(line) }));
    const responses = await Promise.all(routes.map((route) => route(new Request('https://nexualpha.com/og/default/site.png'))));
    for (const response of responses) {
      assert.equal(response.status, 200);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), png);
    }
    const files = await readdir(cacheDir);
    assert.equal(files.length, 1);
    assert.ok(files[0].endsWith('.png'));
    assert.deepEqual(await readFile(path.join(cacheDir, files[0])), png);
    assert.deepEqual(logs, []);
  } finally { await rm(root, { recursive: true, force: true }); }
});

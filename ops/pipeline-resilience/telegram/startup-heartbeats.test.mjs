import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repo = process.env.TELEGRAM_REPO || '/Users/bestberlin/Documents/ChatGPT/Telegram';
const localRequire = createRequire(join(repo, 'package.json'));
const ts = localRequire('typescript');
const bases = JSON.parse(readFileSync(new URL('./source-bases.json', import.meta.url)));
const patch = readFileSync(new URL('./startup-heartbeats.patch', import.meta.url), 'utf8');
function patched(path) {
  const source = readFileSync(join(repo, path), 'utf8');
  assert.equal(createHash('sha256').update(source).digest('hex'), bases[path], `Source drift: ${path}`);
  const diff = patch.split(`--- a/${path}\n+++ b/${path}\n`)[1].split('\n--- a/')[0];
  const lines = source.split('\n');
  const result = [];
  let cursor = 0;
  for (const hunk of diff.split(/^@@ /m).slice(1)) {
    const [header, ...changes] = hunk.split('\n');
    const start = Number(header.match(/^-(\d+)/)[1]) - 1;
    result.push(...lines.slice(cursor, start));
    cursor = start;
    for (const line of changes) {
      if (line.startsWith(' ')) { result.push(lines[cursor++]); }
      else if (line.startsWith('-')) cursor++;
      else if (line.startsWith('+')) result.push(line.slice(1));
    }
  }
  return [...result, ...lines.slice(cursor)].join('\n');
}
const workerPath = 'apps/worker/src/publication-worker.ts';
const pollerPath = 'apps/bot-community/src/polling-runner.ts';
const worker = patched(workerPath);
const poller = patched(pollerPath);
const transpile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.CommonJS } }).outputText;

test('patch applies to the exact dirty external source without modifying it', () => {
  execFileSync('git', ['apply', '--check', fileURLToPath(new URL('./startup-heartbeats.patch', import.meta.url))], { cwd: repo });
});

test('worker remains live across startup backend errors and records recovery atomically', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'worker-heartbeat-'));
  const health = join(dir, 'worker.json');
  let instance, interval;
  const backend = { status: 'reconnecting' };
  class Worker extends EventEmitter {
    constructor(_name, _processor, opts) {
      super(); instance = this; this.opts = opts;
      this.backend = { connection: { client: Promise.resolve(backend) } };
    }
    getBackend() { return this.backend; }
    async close() {}
  }
  try {
    vm.runInNewContext(transpile(worker), {
      require: name => name === 'bullmq' ? { Worker } : name.includes('publication-worker.js') ? { processPublicationJob: async () => {} } : localRequire(name),
      exports: {}, process: { pid: process.pid, env: { WORKER_HEALTH_SNAPSHOT_PATH: health }, once() {}, exit() { throw new Error('unexpected exit'); } },
      console: { info() {}, error() {} },
      setInterval: fn => { interval = fn; return 1; }, clearInterval() {},
    });
    await new Promise(resolve => setImmediate(resolve));
    instance.emit('error', new Error('sensitive endpoint'));
    let snapshot = JSON.parse(readFileSync(health));
    assert.equal(snapshot.backendConnectivity, 'unavailable');
    assert.equal(snapshot.status, 'reconnecting');
    assert.ok(snapshot.updatedAt);
    assert.equal(JSON.stringify(snapshot).includes('sensitive'), false);
    assert.equal(instance.opts.connection.maxRetriesPerRequest, null);
    assert.equal(instance.opts.connection.connectTimeout, 10000);
    assert.deepEqual([1, 2, 10].map(instance.opts.connection.retryStrategy), [1000, 2000, 30000]);
    backend.status = 'ready'; interval();
    snapshot = JSON.parse(readFileSync(health));
    assert.equal(snapshot.backendConnectivity, 'connected');
    instance.emit('completed');
    assert.equal(JSON.parse(readFileSync(health)).lastJobOutcome, 'completed');
    assert.equal(existsSync(`${health}.${process.pid}.tmp`), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('poller writes a fresh retry heartbeat during network failure without advancing the offset', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'poller-heartbeat-'));
  const health = join(dir, 'poll.json');
  try {
    const helper = poller.slice(poller.indexOf('const pollHealthPath'), poller.indexOf('\nlet offset = 0;'));
    const loop = poller.slice(poller.indexOf('while (!stopping) {'), poller.indexOf('\nconsole.info(JSON.stringify({ service: "telegram-community-poller", event: "stopped"'));
    const code = `${helper}\nlet offset=7, stopping=false, pollingPhase='get_updates', processingUpdateId;\nconst adapter={updateDeliveryState:()=>undefined};\nconst pollTimeoutSeconds=15;\nconst getUpdates=async()=>{throw new TypeError('secret token');};\nconst safePollFailure=()=>({error:'TypeError'});\nconst retryDelayMilliseconds=()=>2000;\nconst delay=async()=>{stopping=true;};\n${loop}\nreturn offset;`;
    const fs = localRequire('node:fs/promises');
    const outcome = await vm.runInNewContext(`(async()=>{${transpile(code)}})()`, {
      ...fs, dirname: localRequire('node:path').dirname,
      process: { pid: process.pid, env: { POLL_HEALTH_SNAPSHOT_PATH: health } },
      console: { error() {} },
    });
    assert.equal(outcome, 7);
    const snapshot = JSON.parse(readFileSync(health));
    assert.equal(snapshot.status, 'retrying');
    assert.equal(snapshot.consecutivePollFailures, 1);
    assert.equal(snapshot.backendConnectivity, 'degraded');
    assert.equal(snapshot.lastSuccessfulPollAt, null);
    assert.ok(snapshot.updatedAt);
    assert.equal(JSON.stringify(snapshot).includes('secret'), false);
    assert.equal(existsSync(`${health}.${process.pid}.tmp`), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('patched runtime entrypoints add no TypeScript errors against the current source baseline', t => {
  const options = { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, strict: true, noUncheckedIndexedAccess: true, exactOptionalPropertyTypes: true, esModuleInterop: true, skipLibCheck: true, noEmit: true, types: ['node'], typeRoots: [join(repo, 'node_modules/@types')] };
  const roots = [workerPath, pollerPath].map(path => join(repo, path));
  function diagnostics(overrides) {
    const host = ts.createCompilerHost(options);
    const read = host.readFile;
    host.readFile = name => overrides.get(name) ?? read(name);
    const program = ts.createProgram(roots, options, host);
    return ts.getPreEmitDiagnostics(program).map(d => `${d.file?.fileName}:${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`);
  }
  const baseline = new Set(diagnostics(new Map()));
  t.diagnostic(`Existing baseline TypeScript diagnostics: ${baseline.size}`);
  const added = diagnostics(new Map([[roots[0], worker], [roots[1], poller]])).filter(d => !baseline.has(d));
  assert.deepEqual(added, []);
});

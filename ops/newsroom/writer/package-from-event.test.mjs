import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { after, test } from 'node:test';
import { packageFromEvent, packageShapeFromEvent } from './package-from-event.mjs';

const execFileAsync = promisify(execFile);
const testFile = fileURLToPath(import.meta.url);
const writerDir = path.dirname(testFile);
const repoRoot = path.resolve(writerDir, '../../..');
const scratchRoot = path.join(writerDir, '.test-tmp');
const now = '2026-10-12T12:00:00Z';

after(async () => {
  await rm(scratchRoot, { recursive: true, force: true });
});

async function fixture(name, kind) {
  return JSON.parse(await readFile(path.join(writerDir, 'fixtures', `package-${name}-${kind}.json`), 'utf8'));
}

async function gateInputs(root) {
  const historyPath = path.join(root, 'history.json');
  const ledgerPath = path.join(root, 'article-ledger.jsonl');
  await writeFile(historyPath, '{"articles":[]}\n');
  await writeFile(ledgerPath, '');
  return { historyPath, ledgerPath };
}

test('package bridge writes publisher package and gets a pass from the exact T4 CLI', async () => {
  await mkdir(scratchRoot, { recursive: true });
  const root = await mkdtemp(path.join(scratchRoot, 'pass-'));
  const outDir = path.join(root, 'package');
  const result = await packageFromEvent({
    event: await fixture('pass', 'event'),
    articles: await fixture('pass', 'articles'),
    outDir,
    ...(await gateInputs(root)),
    now
  });

  assert.equal(result.status, 'pass', JSON.stringify(result.gate.reasons));
  assert.equal(result.publishAllowed, true);
  const meta = JSON.parse(await readFile(path.join(outDir, 'meta.json'), 'utf8'));
  assert.equal(meta.event_id, 42);
  assert.equal(meta.format, 'flash');
  assert.equal(meta.batchId, 'event-42');
  assert.equal(meta.contentType, 'market_structure');
  assert.equal(meta.pillar, 'decision_relevant_industry_news');
  assert.equal(meta.titles.en, 'Bybit launched custody accounts');
  assert.equal(meta.title.en, meta.titles.en);
  assert.equal(meta.bodyFiles.en, 'article.en.md');
  assert.equal(meta.suggestedPaths.en, '/news/bybit-custody-launch');
  assert.equal(meta.sources[0].url, 'https://example.com/bybit-custody-launch');
  assert.equal(meta.claims[0].sourceIds[0], 'e1');
  assert.ok(meta.seo.description);
  assert.ok(meta.aeo.directAnswer);
  assert.deepEqual(meta.geo.knownUnknowns, []);
  const claims = JSON.parse(await readFile(path.join(outDir, 'claims.json'), 'utf8'));
  assert.equal(claims.claims.length, 2);
  assert.equal(claims.claims[0].texts.en, 'Bybit launched 2 custody accounts on 2026-10-12.');
});

test('missing history and ledger stays needs-review instead of silently passing', async () => {
  await mkdir(scratchRoot, { recursive: true });
  const root = await mkdtemp(path.join(scratchRoot, 'history-'));
  const result = await packageFromEvent({
    event: await fixture('pass', 'event'),
    articles: await fixture('pass', 'articles'),
    outDir: path.join(root, 'package'),
    now
  });

  assert.equal(result.status, 'needs-review');
  assert.ok(result.gate.reasons.some(reason => reason.rule === 'DUP' && reason.severity === 'needs-review'));
});

test('unsupported optional locale returns needs-review and queues the T4 envelope', async () => {
  await mkdir(scratchRoot, { recursive: true });
  const root = await mkdtemp(path.join(scratchRoot, 'review-'));
  const queue = path.join(root, 'queue');
  const result = await packageFromEvent({
    event: await fixture('review', 'event'),
    articles: await fixture('review', 'articles'),
    outDir: path.join(root, 'package'),
    queue,
    ...(await gateInputs(root)),
    now
  });

  assert.equal(result.status, 'needs-review');
  assert.ok(result.gate.queue_file?.startsWith(queue));
  assert.ok(result.gate.reasons.some(reason => reason.rule === 'LOCALE' && reason.locale === 'tr'));
});

test('missing evidence fails through the T4 package gate', async () => {
  await mkdir(scratchRoot, { recursive: true });
  const root = await mkdtemp(path.join(scratchRoot, 'fail-'));
  const result = await packageFromEvent({
    event: await fixture('fail', 'event'),
    articles: await fixture('fail', 'articles'),
    outDir: path.join(root, 'package'),
    ...(await gateInputs(root)),
    now
  });

  assert.equal(result.status, 'fail');
  assert.ok(result.gate.reasons.some(reason => reason.rule === 'G1' && reason.severity === 'fail'));
});

test('bridge preserves unknown evidence fields and treats missing authored claims as legacy review', async () => {
  const event = await fixture('pass', 'event');
  delete event.claims;
  event.evidence = [{ id: 9, url: 'https://example.com/unknown', supports: 'Writer fact mapping, not a source excerpt' }];
  const shape = packageShapeFromEvent(event, await fixture('pass', 'articles'));
  assert.equal(shape.claimsDocument, undefined);
  assert.deepEqual(shape.evidence, [{ id: 9, url: 'https://example.com/unknown', supports: 'Writer fact mapping, not a source excerpt' }]);
  assert.equal(shape.evidence[0].excerpt, undefined);

  await mkdir(scratchRoot, { recursive: true });
  const root = await mkdtemp(path.join(scratchRoot, 'legacy-'));
  const result = await packageFromEvent({
    event,
    articles: await fixture('pass', 'articles'),
    outDir: path.join(root, 'package'),
    ...(await gateInputs(root)),
    now
  });
  assert.equal(result.status, 'needs-review');
  assert.ok(result.gate.legacy);
  assert.ok(result.gate.reasons.some(reason => reason.rule === 'LEGACY'));
});

test('writer-supplied titles win and a missing event id is rejected', async () => {
  const event = await fixture('pass', 'event');
  const articles = { ...(await fixture('pass', 'articles')), titles: { en: 'Writer supplied Bybit custody title', 'zh-Hans': 'Writer supplied Bybit 中文标题' } };
  assert.equal(packageShapeFromEvent(event, articles).meta.titles.en, 'Writer supplied Bybit custody title');
  delete event.id;
  assert.throws(() => packageShapeFromEvent(event, articles), /positive event id/);
});

test('CLI accepts locale:path article inputs and rejects unsafe locales and stale output dirs', async () => {
  await mkdir(scratchRoot, { recursive: true });
  const root = await mkdtemp(path.join(scratchRoot, 'cli-'));
  const eventPath = path.join(root, 'event.json');
  const enPath = path.join(root, 'article.en.md');
  const zhPath = path.join(root, 'article.zh-Hans.md');
  const outArg = path.relative(repoRoot, path.join(root, 'package'));
  const event = await fixture('pass', 'event');
  const articles = await fixture('pass', 'articles');
  const { historyPath, ledgerPath } = await gateInputs(root);
  await writeFile(eventPath, `${JSON.stringify(event)}\n`);
  await writeFile(enPath, articles.en);
  await writeFile(zhPath, articles['zh-Hans']);

  const ok = await execFileAsync(process.execPath, [
    path.join(writerDir, 'package-from-event.mjs'),
    '--event', eventPath,
    '--article', `en:${enPath}`,
    '--article', `zh-Hans:${zhPath}`,
    '--out', outArg,
    '--history', historyPath,
    '--ledger', ledgerPath,
    '--now', now
  ], { cwd: repoRoot });
  assert.equal(JSON.parse(ok.stdout).status, 'pass');

  await assert.rejects(execFileAsync(process.execPath, [
    path.join(writerDir, 'package-from-event.mjs'),
    '--event', eventPath,
    '--article', `../bad:${enPath}`,
    '--article', `zh-Hans:${zhPath}`,
    '--out', path.relative(repoRoot, path.join(root, 'bad-locale')),
    '--now', now
  ], { cwd: repoRoot }));

  await assert.rejects(execFileAsync(process.execPath, [
    path.join(writerDir, 'package-from-event.mjs'),
    '--event', eventPath,
    '--article', `en:${enPath}`,
    '--article', `zh-Hans:${zhPath}`,
    '--out', outArg,
    '--history', historyPath,
    '--ledger', ledgerPath,
    '--now', now
  ], { cwd: repoRoot }));
});

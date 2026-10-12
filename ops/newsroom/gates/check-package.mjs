#!/usr/bin/env node
import { readFile, readdir, mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { checkPackage } from './index.mjs';

const json = async file => JSON.parse(await readFile(file, 'utf8'));
async function optionalJson(file) {
  try { return await json(file); } catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
}

/** File adapter now; a DB adapter can consume this identical result envelope later. */
export async function enqueueReview(directory, envelope) {
  await mkdir(directory, { recursive: true });
  const digest = createHash('sha256').update(JSON.stringify(envelope)).digest('hex');
  const target = path.join(directory, `${digest}.json`);
  const temporary = `${target}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(envelope, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, target);
  return target;
}

export async function loadPackage(directory) {
  const meta = await json(path.join(directory, 'meta.json'));
  const files = (await readdir(directory)).filter(name => /^article\.[\w-]+\.md$/.test(name)).sort();
  const articles = Object.fromEntries(await Promise.all(files.map(async name => [name.slice(8, -3), await readFile(path.join(directory, name), 'utf8')])));
  for (const locale of new Set(['en', 'zh-Hans', ...(meta.availableLocales ?? meta.locales ?? [])])) {
    if (!articles[locale]?.trim()) throw new Error(`Missing article.${locale}.md`);
  }
  const claimsDocument = await optionalJson(path.join(directory, 'claims.json'));
  const evidenceDocument = await optionalJson(path.join(directory, 'evidence.json'));
  const evidence = evidenceDocument?.evidence ?? evidenceDocument ?? claimsDocument?.evidence ?? meta.event_evidence ?? [];
  return { meta, articles, claimsDocument, evidence };
}

async function main() {
  const [directory, ...args] = process.argv.slice(2);
  if (!directory || args.length % 2) throw new Error('Usage: check-package.mjs <packageDir> [--history summary.json --ledger ledger.jsonl --queue directory --now ISO --reviews trusted-records.json]');
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--history', '--ledger', '--queue', '--now', '--reviews'].includes(args[i]) || options[args[i]]) throw new Error(`Invalid/duplicate option ${args[i]}`);
    options[args[i]] = args[i + 1];
  }
  const input = await loadPackage(directory);
  const now = options['--now'] ?? new Date().toISOString();
  const historyFile = options['--history'] ?? process.env.NEWSROOM_HISTORY;
  const ledgerFile = options['--ledger'] ?? process.env.NEWSROOM_LEDGER;
  const history = [];
  if (historyFile) {
    const summary = await json(historyFile);
    const rows = Array.isArray(summary) ? summary : summary.articles;
    if (!Array.isArray(rows)) throw new Error('History must be an array or {articles:[]}');
    history.push(...rows);
  }
  if (ledgerFile) {
    const lines = (await readFile(ledgerFile, 'utf8')).split('\n').filter(l => l.trim());
    const rows = lines.map(line => JSON.parse(line));
    const packagePaths = new Map(rows.filter(row => row.slug && row.packagePath).map(row => [row.slug, row.packagePath]));
    for (const row of rows) {
      // Failed/unpublished ledger entries cannot prove a recent publication.
      if (row.publishedAt || row.published_at || /PUBLISHED/.test(row.status ?? '')) {
        const feedRow = history.find(item => item.slug === row.slug);
        const packagePath = row.packagePath ?? packagePaths.get(row.slug);
        const staged = packagePath ? await optionalJson(path.join(path.resolve(path.dirname(ledgerFile), '../../..'), packagePath, 'meta.json')) : undefined;
        history.push({ ...staged, ...feedRow, ...row });
      }
    }
  }
  const reviewsFile = options['--reviews'] ?? process.env.NEWSROOM_REVIEW_RECORDS;
  const humanReviews = reviewsFile ? await json(reviewsFile) : [];
  if (!Array.isArray(humanReviews)) throw new Error('Trusted human review records must be an array');
  const result = checkPackage({ ...input, history, humanReviews, now, historyComplete: Boolean(historyFile && ledgerFile) });
  const envelope = { version: 1, slug: input.meta.slug ?? path.basename(path.resolve(directory)), event_id: input.meta.event_id ?? null, checked_at: now, ...result };
  if (result.status === 'needs-review') {
    const queue = options['--queue'] ?? process.env.NEWSROOM_REVIEW_QUEUE ?? path.join(directory, 'review-queue');
    envelope.queue_file = await enqueueReview(queue, envelope);
  }
  process.stdout.write(`${JSON.stringify(envelope, null, 2)}\n`);
  process.exitCode = { pass: 0, fail: 1, 'needs-review': 2 }[result.status];
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stdout.write(`${JSON.stringify({ status: 'fail', publishAllowed: false, reasons: [{ rule: 'INPUT', severity: 'fail', message: error.message }] })}\n`);
    process.exitCode = 1;
  });
}

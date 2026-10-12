#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { exportTopQuery, runDedupe, runScore, statusQuery } from '../lib/pipeline.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
export const literal = value => `'${String(value).replaceAll("'", "''")}'`;
const json = value => `${literal(JSON.stringify(value))}::jsonb`;
const integer = (value, name, min = 0, max = 1000000) => {
  if (!/^\d+$/.test(String(value)) || Number(value) < min || Number(value) > max) throw new Error(`Invalid ${name}`);
  return Number(value);
};
function options(args, allowed) {
  const result = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    if (!args[i]?.startsWith('--') || !allowed.includes(key) || args[i + 1] === undefined || key in result) throw new Error('Invalid or duplicate option');
    result[key] = args[i + 1];
  }
  return result;
}
const changedRows = query => `WITH result AS (${query}) SELECT coalesce(jsonb_agg(to_jsonb(result)), '[]'::jsonb) FROM result;`;
const rows = query => `SELECT coalesce(jsonb_agg(to_jsonb(result)), '[]'::jsonb) FROM (${query}) result;`;
export function buildQuery(argv) {
  const [command, ...args] = argv;
  if (command === 'events:top') {
    const opts = options(args, ['limit']);
    const limit = integer(opts.limit ?? 10, 'limit', 1, 1000);
    return rows(`SELECT e.*, to_jsonb(s) AS score FROM events e JOIN LATERAL (SELECT * FROM event_scores WHERE event_id=e.id ORDER BY scored_at DESC LIMIT 1) s ON true WHERE e.state IN ('new','candidate') ORDER BY (s.priority_override='official_major') DESC NULLS LAST, s.editorial_score DESC, e.source_published_at DESC NULLS LAST, e.id LIMIT ${limit}`);
  }
  if (command === 'event:show') {
    if (args.length !== 1) throw new Error('event:show requires one id');
    const id = integer(args[0], 'event id', 1, Number.MAX_SAFE_INTEGER);
    return rows(`SELECT e.*, coalesce((SELECT jsonb_agg(to_jsonb(v) ORDER BY v.id) FROM event_evidence v WHERE v.event_id=e.id), '[]'::jsonb) evidence, coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.scored_at DESC) FROM event_scores s WHERE s.event_id=e.id), '[]'::jsonb) scores, coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.slug) FROM articles a WHERE a.event_id=e.id), '[]'::jsonb) articles FROM events e WHERE e.id=${id}`);
  }
  if (command === 'review:list') {
    if (args.length) throw new Error('review:list takes no options');
    return rows('SELECT * FROM review_queue WHERE resolved_at IS NULL ORDER BY created_at, id');
  }
  if (command === 'shortfall:log') {
    const opts = options(args, ['day', 'slot', 'wanted', 'eligible', 'published', 'note']);
    for (const key of ['slot', 'wanted', 'eligible', 'published', 'note']) if (opts[key] === undefined) throw new Error(`Missing --${key}`);
    // An explicit timezone prevents host-local interpretation of publication slots.
    if (!/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(opts.slot) || !Number.isFinite(Date.parse(opts.slot))) throw new Error('Invalid slot: ISO timestamp with timezone required');
    const slotDay = opts.slot.slice(0, 10);
    if (new Date(slotDay).toISOString().slice(0, 10) !== slotDay) throw new Error('Invalid slot calendar date');
    const day = opts.day ?? slotDay;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(Date.parse(day)) || new Date(day).toISOString().slice(0, 10) !== day) throw new Error('Invalid day');
    const values = ['wanted', 'eligible', 'published'].map(key => integer(opts[key], key));
    if (values[2] > values[1]) throw new Error('published exceeds eligible');
    return changedRows(`INSERT INTO shortfall_log(day,slot,wanted,eligible,published,note) VALUES (${literal(day)}::date,${literal(opts.slot)}::timestamptz,${values.join(',')},${literal(opts.note)}) ON CONFLICT(day,slot) DO UPDATE SET wanted=excluded.wanted,eligible=excluded.eligible,published=excluded.published,note=excluded.note RETURNING *`);
  }
  if (command === 'config:get') {
    if (args.length > 1) throw new Error('config:get accepts at most one key');
    return rows(`SELECT * FROM newsroom_config${args.length ? ` WHERE key=${literal(args[0])}` : ''} ORDER BY key`);
  }
  if (command === 'config:set') {
    if (args.length !== 2 || !args[0]) throw new Error('config:set requires key and JSON value');
    let value;
    try { value = JSON.parse(args[1]); } catch { throw new Error('Invalid JSON value'); }
    if (args[0] === 'weights') {
      const keys = ['relevance', 'heat', 'timeliness', 'new_info', 'impact'];
      if (!value || typeof value !== 'object' || Object.keys(value).length !== 5 || keys.some(key => !Number.isFinite(value[key]) || value[key] < 0) || keys.reduce((sum, key) => sum + value[key], 0) !== 100) throw new Error('weights must contain five non-negative factors totaling 100');
    }
    return `WITH result AS (INSERT INTO newsroom_config(key,value) VALUES (${literal(args[0])},${json(value)}) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=now() RETURNING *) SELECT to_jsonb(result) FROM result;`;
  }
  throw new Error('Unknown command');
}
export function runPsql(sql, env = process.env) {
  const result = spawnSync('psql', ['-X', '--quiet', '--no-password', '--set=ON_ERROR_STOP=1', '--tuples-only', '--no-align'], {
    input: `SET standard_conforming_strings=on;\n${sql}\n`, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
    env: { ...env, PGDATABASE: env.PGDATABASE || 'newsroom' },
  });
  if (result.error?.code === 'ENOENT') throw new Error('psql is required; install a PostgreSQL client or use the throwaway Docker test script');
  if (result.error || result.status !== 0) throw new Error('PostgreSQL command failed; inspect database connectivity, permissions and SQL locally (connection details suppressed)');
  return result.stdout.trim();
}
export async function main(argv, execute = runPsql) {
  if (argv.length === 0 || argv[0] === '--help') return 'newsroom: migrate | seed | events:top [--limit N] | event:show ID | review:list | shortfall:log --slot ISO --wanted N --eligible N --published N --note TEXT [--day YYYY-MM-DD] | config:get [KEY] | config:set KEY JSON | dedupe | score | status | export:top [--limit N]\nConnection: standard PGHOST/PGPORT/PGUSER/PGDATABASE/PGPASSFILE; default database newsroom.';
  if (['migrate', 'seed'].includes(argv[0])) {
    if (argv.length !== 1) throw new Error('Unexpected arguments');
    const dir = resolve(root, 'db', argv[0] === 'migrate' ? 'migrations' : 'seeds');
    const files = readdirSync(dir).filter(name => /^\d+.*\.sql$/.test(name)).sort();
    if (!files.length) throw new Error('No SQL files found');
    execute(`BEGIN;\nSELECT pg_advisory_xact_lock(20261012,1);\n${files.map(name => readFileSync(resolve(dir, name), 'utf8')).join('\n')}\nCOMMIT;`);
    return `${argv[0]}: ${files.length} SQL file(s) applied`;
  }
  // Deployment worker commands (T6): persistence for merge/scoring plus read-only status/export views.
  if (argv[0] === 'dedupe' || argv[0] === 'score') {
    if (argv.length !== 1) throw new Error('Unexpected arguments');
    return JSON.stringify(argv[0] === 'dedupe' ? runDedupe(execute) : runScore(execute));
  }
  if (argv[0] === 'status') {
    if (argv.length !== 1) throw new Error('status takes no options');
    return execute(statusQuery());
  }
  if (argv[0] === 'export:top') {
    const opts = options(argv.slice(1), ['limit']);
    return execute(exportTopQuery(integer(opts.limit ?? 50, 'limit', 1, 500)));
  }
  return execute(buildQuery(argv));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(output => console.log(output)).catch(error => { console.error(`newsroom: ${error.message}`); process.exitCode = 1; });
}

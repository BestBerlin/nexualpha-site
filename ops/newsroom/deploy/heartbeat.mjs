import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { atomicJson } from '../lib/runtime.mjs';

const jobs = ['collect', 'pipeline', 'daily'];
export function heartbeat(state, now = Date.now()) {
  const read = name => { try { return JSON.parse(readFileSync(join(state, name), 'utf8')); } catch { return null; } };
  const statuses = Object.fromEntries(jobs.map(job => [job, read(`${job}.heartbeat.json`)]));
  const sources = read('collect-sources.json');
  return { updatedAt: new Date(now).toISOString(), jobs: statuses, sources };
}
export function healthy(state, now = Date.now()) {
  let current;
  try { current = JSON.parse(readFileSync(join(state, 'heartbeat.json'), 'utf8')); } catch { return false; }
  const fresh = (stamp, limit = 600000) => Number.isFinite(Date.parse(stamp)) && now - Date.parse(stamp) >= 0 && now - Date.parse(stamp) < limit;
  return fresh(current.updatedAt) && jobs.every(job => fresh(current.jobs?.[job]?.updatedAt, 660000));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const state = process.env.NEWSROOM_STATE || '/state';
  const [command, job, status, exitCode] = process.argv.slice(2);
  if (command === 'check') process.exitCode = healthy(state) ? 0 : 1;
  else if (command === 'job' && jobs.includes(job)) atomicJson(join(state, `${job}.heartbeat.json`), { updatedAt: new Date().toISOString(), status, exitCode: exitCode === undefined ? null : Number(exitCode) });
  else if (command === 'write') atomicJson(join(state, 'heartbeat.json'), heartbeat(state));
  else throw new Error('Invalid heartbeat command');
}

#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { main as newsroomMain } from '../bin/newsroom.mjs';

function parseArgs(argv) {
  const out = { limit: '2' };
  const seen = new Set();
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i]?.startsWith('--') || argv[i + 1] === undefined) throw new Error('Expected --start ISO --writer ID [--limit N --out PATH --history PATH --locale LOCALE --market MARKET]');
    const key = argv[i].slice(2);
    if (!['start', 'writer', 'limit', 'out', 'history', 'locale', 'market'].includes(key) || seen.has(key)) throw new Error(`Invalid or duplicate --${key}`);
    seen.add(key);
    out[key] = argv[i + 1];
  }
  if (!out.start || !Number.isFinite(Date.parse(out.start))) throw new Error('shadow-run requires --start ISO');
  if (!out.writer?.trim()) throw new Error('shadow-run requires --writer');
  if (!/^\d+$/.test(String(out.limit)) || Number(out.limit) < 1 || Number(out.limit) > 20) throw new Error('Invalid --limit');
  return out;
}

function assertShadowWindow(start, now) {
  const from = Date.parse(start);
  const clock = Date.parse(now);
  if (!Number.isFinite(clock)) throw new Error('Invalid clock');
  const to = from + 7 * 24 * 60 * 60 * 1000;
  if (clock < from || clock >= to) throw new Error(`Shadow run outside one-week window [${new Date(from).toISOString()}, ${new Date(to).toISOString()})`);
}

function planFor(events, { writer, start, now }) {
  return {
    schema: 'newsroom.writer.shadow-plan.v1',
    generated_at: now,
    shadow_start: start,
    writer,
    publish: false,
    events: events.map(event => ({
      id: event.id,
      title_internal: event.title_internal,
      event_type: event.event_type,
      suggested_format: event.suggested_format,
      suggested_angle: event.suggested_angle,
      main_question: event.main_question,
      factual_summary: event.factual_summary,
      summary_source_urls: event.summary_source_urls,
      why_it_matters: event.why_it_matters,
      story_event_ids: event.story_event_ids,
      venues: event.venues,
      cta_hints: event.cta_hints,
      entities: event.entities,
      evidence: event.evidence,
      related_existing_articles: event.related_existing_articles,
    })),
  };
}

export async function shadowRun(argv = process.argv.slice(2), {
  cli = newsroomMain,
  files = { mkdir, writeFile },
  now = new Date().toISOString(),
} = {}) {
  const opts = parseArgs(argv);
  assertShadowWindow(opts.start, now);
  const claimArgs = ['claim', '--limit', opts.limit, '--writer', opts.writer];
  for (const key of ['history', 'locale', 'market']) if (opts[key]) claimArgs.push(`--${key}`, opts[key]);
  const events = JSON.parse(await cli(claimArgs));
  const releases = [];
  let plan;
  let planPath;
  let writeError;
  try {
    plan = planFor(events, { writer: opts.writer, start: opts.start, now });
    planPath = opts.out ?? path.join(path.dirname(fileURLToPath(import.meta.url)), `shadow-plan-${now.replace(/[:.]/g, '-')}.json`);
    await files.mkdir(path.dirname(planPath), { recursive: true });
    await files.writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`);
  } catch (error) {
    writeError = error;
  }
  const releaseErrors = [];
  try {
    for (const event of events) {
      try {
        const result = JSON.parse(await cli(['release', String(event.id), '--writer', opts.writer]));
        if (!Array.isArray(result) || !result.some(row => String(row.id) === String(event.id))) throw new Error('release returned no matching row');
        releases.push(event.id);
      } catch (error) {
        releaseErrors.push({ id: event.id, error: error.message });
      }
    }
  } finally {
    if (writeError || releaseErrors.length) {
      const error = new Error([
        writeError ? `plan write failed: ${writeError.message}` : null,
        releaseErrors.length ? `release failed for ${releaseErrors.map(row => row.id).join(', ')}` : null,
      ].filter(Boolean).join('; '));
      error.releaseErrors = releaseErrors;
      error.released = releases;
      throw error;
    }
  }
  return { planPath, claimed: events.length, released: releases.length, releaseErrors, plan };
}

export async function main(argv = process.argv.slice(2)) {
  return JSON.stringify(await shadowRun(argv), null, 2);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(output => console.log(output)).catch(error => { console.error(`shadow-run: ${error.message}`); process.exitCode = 1; });
}

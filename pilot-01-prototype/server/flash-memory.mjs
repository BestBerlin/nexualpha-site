// Flash market items on disk (2026-10-12). Liquidation spikes, sharp moves and funding extremes exist only in the
// collector snapshot they were seen in; the Worker keeps their first sighting in memory and saves it here so their
// /flash pages keep resolving after a restart or deploy. Read once, written atomically (tmp + rename), at most every 30 s.
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildFlashItems } from '../src/data/flash-feed.js';
import { isClusterWorker, primaryCall } from './cluster-rpc.mjs';

const writers = new Map();
// One primary owns read/merge/rename for all workers. PID-qualified temporary files alone prevent corruption,
// but cannot prevent two snapshots from replacing each other's unique first sightings.
export function persistFlashMemory(file, items) {
  file = path.resolve(file);
  const operation = (writers.get(file) || Promise.resolve()).then(async () => {
    let stored = [];
    try { stored = JSON.parse(await readFile(file, 'utf8'))?.items || []; } catch { /* first snapshot */ }
    const { marketItems } = buildFlashItems({ remembered: [...items, ...(Array.isArray(stored) ? stored : [])] });
    await mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.${randomUUID()}.tmp`;
    try {
      await writeFile(tmp, `${JSON.stringify({ version: 1, savedAt: new Date().toISOString(), items: marketItems })}\n`, { mode: 0o600 });
      await rename(tmp, file);
    } finally { await rm(tmp, { force: true }).catch(() => {}); }
    return marketItems;
  });
  const settled = operation.catch(() => {});
  writers.set(file, settled);
  settled.then(() => { if (writers.get(file) === settled) writers.delete(file); });
  return operation;
}

export function createFlashMemory({ file = null, minIntervalMs = 30 * 1000, log = () => {} } = {}) {
  let lastWrite = 0;
  let queued = null;
  let timer = null;
  let writing = Promise.resolve();
  const write = async (items) => {
    if (isClusterWorker()) await primaryCall('flash-save', { file, items });
    else await persistFlashMemory(file, items);
    lastWrite = Date.now();
  };
  const drain = () => {
    if (!queued) return writing;
    const next = queued; queued = null;
    writing = writing.then(() => write(next)).catch((error) => log(`flash memory write failed: ${error?.message || error}`));
    return writing;
  };
  return {
    async load() {
      if (!file) return [];
      try {
        const parsed = JSON.parse(await readFile(file, 'utf8'));
        return Array.isArray(parsed?.items) ? parsed.items : [];
      } catch { return []; }
    },
    async save(items) {
      if (!file || !Array.isArray(items)) return;
      queued = items;
      if (timer) return;
      const wait = Math.max(0, minIntervalMs - (Date.now() - lastWrite));
      timer = setTimeout(() => {
        timer = null;
        drain();
      }, wait);
      timer.unref?.();
    },
    flush() {
      if (timer) { clearTimeout(timer); timer = null; }
      return drain();
    },
  };
}

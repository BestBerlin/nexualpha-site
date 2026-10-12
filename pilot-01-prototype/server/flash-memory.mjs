// Flash market items on disk (2026-10-12). Liquidation spikes, sharp moves and funding extremes exist only in the
// collector snapshot they were seen in; the Worker keeps their first sighting in memory and saves it here so their
// /flash pages keep resolving after a restart or deploy. Read once, written atomically (tmp + rename), at most every 30 s.
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export function createFlashMemory({ file = null, minIntervalMs = 30 * 1000, log = () => {} } = {}) {
  let lastText = '';
  let lastWrite = 0;
  let queued = null;
  let timer = null;
  const write = async (items) => {
    const text = `${JSON.stringify({ version: 1, savedAt: new Date().toISOString(), items })}\n`;
    if (text === lastText) return;
    await mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, text, { mode: 0o600 });
    await rename(tmp, file);
    lastText = text;
    lastWrite = Date.now();
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
        const next = queued; queued = null;
        write(next).catch((error) => log(`flash memory write failed: ${error?.message || error}`));
      }, wait);
      timer.unref?.();
    },
  };
}

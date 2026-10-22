import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Process-local operational counters only: never expose event contents, paths or error messages.
export function createClickStorage({ append = appendFile, makeDirectory = mkdir, log = (line) => console.error(line) } = {}) {
  let failures = 0, writes = 0, degraded = false;
  return {
    status: () => ({ configured: true, ready: !degraded, writes, failures }),
    async write(file, event, source) {
      try {
        const line = `${JSON.stringify(event)}\n`;
        // One bounded O_APPEND write per row, including UTF-8 expansion and its newline.
        // Reject oversized events rather than truncate attribution or split a JSON record across writes.
        if (Buffer.byteLength(line) >= 4096) throw Object.assign(new Error('EVENT_TOO_LARGE'), { code: 'EVENT_TOO_LARGE' });
        await makeDirectory(path.dirname(file), { recursive: true });
        await append(file, line, { mode: 0o600, flag: 'a' });
        writes += 1; degraded = false;
        return true;
      } catch (error) {
        failures += 1; degraded = true;
        const code = ['EACCES', 'EROFS', 'ENOENT', 'ENOSPC', 'EDQUOT', 'EIO', 'ENOTDIR', 'EVENT_TOO_LARGE'].includes(error?.code) ? error.code : 'WRITE_FAILED';
        try { log(JSON.stringify({ event: 'click_storage_write_failed', source, code, failures })); } catch { /* logging must not break navigation */ }
        return false;
      }
    },
  };
}
export const clickStorage = createClickStorage();

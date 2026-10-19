import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Process-local operational counters only: never expose event contents, paths or error messages.
export function createClickStorage({ append = appendFile, makeDirectory = mkdir, log = (line) => console.error(line) } = {}) {
  let failures = 0, writes = 0, degraded = false;
  return {
    status: () => ({ configured: true, ready: !degraded, writes, failures }),
    async write(file, event, source) {
      try {
        await makeDirectory(path.dirname(file), { recursive: true });
        await append(file, `${JSON.stringify(event)}\n`, { mode: 0o600 });
        writes += 1; degraded = false;
        return true;
      } catch (error) {
        failures += 1; degraded = true;
        const code = ['EACCES', 'EROFS', 'ENOENT', 'ENOSPC', 'EDQUOT', 'EIO', 'ENOTDIR'].includes(error?.code) ? error.code : 'WRITE_FAILED';
        try { log(JSON.stringify({ event: 'click_storage_write_failed', source, code, failures })); } catch { /* logging must not break navigation */ }
        return false;
      }
    },
  };
}
export const clickStorage = createClickStorage();

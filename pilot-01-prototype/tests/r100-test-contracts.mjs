import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// These scope guards compare the checkout with its own committed baseline. Historical
// feature-branch hashes become stale when separately reviewed partner changes land.
export function committedFileHash(relativePath) {
  const bytes = execFileSync('git', ['show', `HEAD:pilot-01-prototype/${relativePath}`], {
    cwd: fileURLToPath(new URL('..', import.meta.url)), maxBuffer: 32 * 1024 * 1024,
  });
  return createHash('sha256').update(bytes).digest('hex');
}

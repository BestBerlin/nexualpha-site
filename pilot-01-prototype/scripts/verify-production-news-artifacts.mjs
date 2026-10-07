import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

// Nginx serves /content/ from a separate directory. A healthy app/version is
// insufficient: verify the public bytes against the frozen release as well.
const base = process.env.AUDIT_URL || 'https://nexualpha.com';
const files = ['news-feed.json', 'news-feed-summary.json', 'news-feed.sha256.txt', 'news-health.json'];
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const results = await Promise.all(files.map(async (name) => {
  try {
    const expected = await readFile(new URL(`../dist/client/content/${name}`, import.meta.url));
    const response = await fetch(new URL(`/content/${name}`, base), { signal: AbortSignal.timeout(30000) });
    const actual = Buffer.from(await response.arrayBuffer());
    return { file: name, status: response.status, matchesRelease: response.ok && hash(expected) === hash(actual) };
  } catch (error) {
    return { file: name, matchesRelease: false, error: error.message };
  }
}));
const pass = results.every((row) => row.matchesRelease);
console.log(JSON.stringify({ base, pass, results }, null, 2));
if (!pass) process.exitCode = 1;

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';

const source = readFileSync(new URL('./compose.snippets.yml', import.meta.url), 'utf8');
test('seven proposed container roles use executable CMD probes', () => {
  assert.deepEqual([...source.matchAll(/^  ([a-z-]+):$/gm)].map((m) => m[1]),
    ['web', 'api', 'worker', 'scheduler', 'alert-sender', 'community-poller', 'rsshub']);
  assert.equal([...source.matchAll(/test: \[CMD,/g)].length, 7);
});
// Extract and execute the actual snippet expressions. Fail if their format changes,
// rather than testing a separately copied implementation of the HTTP contract.
const commands = [...source.matchAll(/test: \[CMD, (?:node|[^,]+), -e, "(fetch\([^\n]+)"\]/g)].map((m) => m[1]);
test('HTTP health snippets require exact 200, reject redirects, outages and refused connections', async () => {
  assert.equal(commands.length, 2);
  for (const command of commands) {
    for (const status of [200, 302, 503, null]) {
      const server = createServer((_request, response) => {
        response.writeHead(status || 200, { location: '/' }); response.end();
      });
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      const port = server.address().port;
      try {
        if (status === null) await new Promise((resolve) => server.close(resolve));
        const expression = command.replace('+(process.env.PORT||8080)+', `+${port}+`)
          .replace('127.0.0.1:14322', `127.0.0.1:${port}`);
        const code = await new Promise((resolve, reject) => {
          const child = spawn(process.execPath, ['-e', expression], { stdio: 'ignore' });
          child.on('error', reject); child.on('exit', resolve);
        });
        assert.equal(code, status === 200 ? 0 : 1, `HTTP ${status}`);
      } finally { if (server.listening) await new Promise((resolve) => server.close(resolve)); }
    }
  }
});

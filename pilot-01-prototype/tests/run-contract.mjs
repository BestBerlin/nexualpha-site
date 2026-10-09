#!/usr/bin/env node
// Contract/unit test runner with an explicit quarantine.
//   node tests/run-contract.mjs            run every tests/*.test.mjs except files in tests/QUARANTINE.json
//   node tests/run-contract.mjs --all      include quarantined files
//   node tests/run-contract.mjs --list     print the quarantine (file, category, reason)
//   node tests/run-contract.mjs --only=cat run only quarantined files of one category (e.g. --only=real-bug)
// A file leaves the quarantine only together with the fix that makes it pass. See docs/qa/TESTPLAN.md.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.dirname(testsDir);
const q = JSON.parse(readFileSync(path.join(testsDir, 'QUARANTINE.json'), 'utf8')).files;
const args = process.argv.slice(2);
if (args.includes('--list')) {
  for (const [f, v] of Object.entries(q)) console.log(`${v.category.padEnd(14)} ${f}  ${v.reason}`);
  process.exit(0);
}
const only = args.find((a) => a.startsWith('--only='))?.slice(7);
const all = args.includes('--all');
const built = existsSync(path.join(appDir, 'dist', 'client', 'version.json'));
const files = readdirSync(testsDir).filter((f) => f.endsWith('.test.mjs')).filter((f) => {
  if (only) return q[f]?.category === only;
  return all || !q[f] || (built && q[f].category === 'needs-build');
}).sort();
const jobs = Math.max(1, Math.min(4, os.cpus().length));
console.log(`run-contract: ${files.length} files (${Object.keys(q).length} quarantined${all ? ', included' : ''}${built ? ', dist present: needs-build included' : ''}), concurrency ${jobs}`);
const r = spawnSync(process.execPath, ['--test', `--test-concurrency=${jobs}`, ...files.map((f) => path.join('tests', f))], { cwd: appDir, stdio: 'inherit' });
process.exit(r.status ?? 1);

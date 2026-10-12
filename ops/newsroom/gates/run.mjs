#!/usr/bin/env node
// Compatibility with the DESIGN.md build hook name.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const result = spawnSync(process.execPath, [fileURLToPath(new URL('./check-package.mjs', import.meta.url)), ...process.argv.slice(2)], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;

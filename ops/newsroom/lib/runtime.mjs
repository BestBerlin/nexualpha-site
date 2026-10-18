import { writeFileSync, renameSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

export function atomicWrite(path, value) {
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, value, { mode: 0o640 });
    renameSync(temporary, path);
  } finally { rmSync(temporary, { force: true }); }
}
export const atomicJson = (path, value) => atomicWrite(path, `${JSON.stringify(value)}\n`);

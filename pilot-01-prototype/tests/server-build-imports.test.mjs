import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The production server ships worker/index.js and the src/data tree prepared by scripts/prepare-sites-build.mjs.
// A data import missing from that list builds fine but the server cannot start (happened twice on 2026-10-10).
test("every src/data module the worker imports (transitively) is shipped with the server build", () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(/^\s*(?:import|export)[^"'`;]*?from\s*["'](\.{1,2}\/[^"']+)["']/gm)) {
      const target = path.resolve(path.dirname(file), m[1]);
      if (!target.includes(`${path.sep}src${path.sep}data${path.sep}`)) continue;
      const packaged = path.join(root, "dist", path.relative(root, target));
      assert.ok(existsSync(packaged), `${path.relative(root, file)} imports ${path.relative(root, target)}, which the server build does not ship`);
      assert.equal(readFileSync(packaged, "utf8"), readFileSync(target, "utf8"), `${path.relative(root, target)}: packaged source matches the current import`);
      visit(target);
    }
  };
  visit(path.join(root, "worker/index.js"));
});

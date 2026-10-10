import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The production server ships worker/index.js plus a fixed list of src/data files (scripts/prepare-sites-build.mjs).
// A data import missing from that list builds fine but the server cannot start (happened twice on 2026-10-10).
test("every src/data module the worker imports (transitively) is shipped with the server build", () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const prepare = readFileSync(path.join(root, "scripts/prepare-sites-build.mjs"), "utf8");
  const shipped = new Set([...prepare.matchAll(/"([a-z0-9.-]+\.js)"/g)].map((m) => m[1]));
  shipped.add("reviewed-news-publication.js");
  shipped.add("tracking-attribution.js");
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(/^\s*(?:import|export)[^"'`;]*?from\s*["'](\.{1,2}\/[^"']+)["']/gm)) {
      const target = path.resolve(path.dirname(file), m[1]);
      if (!target.includes(`${path.sep}src${path.sep}data${path.sep}`)) continue;
      assert.ok(shipped.has(path.basename(target)), `${path.relative(root, file)} imports ${path.basename(target)}, which prepare-sites-build.mjs does not ship`);
      visit(target);
    }
  };
  visit(path.join(root, "worker/index.js"));
});

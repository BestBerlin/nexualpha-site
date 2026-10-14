import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
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
  // Generated glossary content (2026-10-13) ships by pattern (readdir in prepare-sites-build.mjs), not by name.
  const shippedByPattern = prepare.includes("glossary-(?:index|shard)-") ? /^glossary-(?:index|shard)-[a-z0-9-]+\.js$/ : null;
  const referralCopySourceDir = path.join(root, "src/data/referral-native-copy");
  const referralCopyDistDir = path.join(root, "dist/src/data/referral-native-copy");
  const shipsReferralNativeCopyDir = /readdirSync\(path\.join\(root,\s*"src",\s*"data",\s*"referral-native-copy"\)\)/.test(prepare);
  const isShipped = (target) => {
    const basename = path.basename(target);
    const parent = path.basename(path.dirname(target));
    if (shipped.has(basename) || Boolean(shippedByPattern?.test(basename))) return true;
    return shipsReferralNativeCopyDir && parent === "referral-native-copy";
  };
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(/^\s*(?:import|export)[^"'`;]*?from\s*["'](\.{1,2}\/[^"']+)["']/gm)) {
      const target = path.resolve(path.dirname(file), m[1]);
      if (!target.includes(`${path.sep}src${path.sep}data${path.sep}`)) continue;
      assert.ok(isShipped(target) || (prepare.includes('cpSync(path.join(root, "src", "data", "beginner-copy")') && path.dirname(target) === path.join(root, "src", "data", "beginner-copy") && /\.json$/.test(target)), `${path.relative(root, file)} imports ${path.relative(path.join(root, "src/data"), target)}, which prepare-sites-build.mjs does not ship`);
      visit(target);
    }
  };
  visit(path.join(root, "worker/index.js"));
  if (existsSync(referralCopyDistDir)) {
    for (const name of readdirSync(referralCopySourceDir).filter((entry) => entry.endsWith(".js"))) {
      assert.ok(existsSync(path.join(referralCopyDistDir, name)), `dist/src/data/referral-native-copy/${name} is missing`);
    }
  }
});

test("every server module the worker imports is shipped with the server build", () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const prepare = readFileSync(path.join(root, "scripts/prepare-sites-build.mjs"), "utf8");
  const shipped = new Set([...prepare.matchAll(/"([a-z0-9.-]+\.mjs)"/g)].map((m) => m[1]));
  const worker = readFileSync(path.join(root, "worker/index.js"), "utf8");
  for (const m of worker.matchAll(/^\s*(?:import|export)[^"'`;]*?from\s*["']\.\.\/server\/([^"']+\.mjs)["']/gm)) {
    assert.ok(shipped.has(path.basename(m[1])), `worker/index.js imports ../server/${m[1]}, which prepare-sites-build.mjs does not ship`);
  }
});

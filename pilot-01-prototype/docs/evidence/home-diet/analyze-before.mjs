// Reproduce the pre-change module attribution without modifying the worktree or built output.
// The baseline config and changed data modules come from the task's starting commit.
import { execFileSync } from "node:child_process";
import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { build } from "vite";

const revision = "3bc0e9c78c05a9e81b959ea6c9dc40e157c02249";
const original = (file) => execFileSync("git", ["show", `${revision}:pilot-01-prototype/${file}`], { encoding: "utf8" });
const sources = new Map(["directory-context.js", "decision-passport.js", "regional-cta.js", "source-bound-cta.js"].map((name) => {
  const file = `src/data/${name}`;
  return [path.resolve(file), original(file)];
}));
const configFile = path.resolve(".home-diet-baseline.config.mjs");
await writeFile(configFile, original("vite.config.mjs"));
try {
  await build({
    configFile,
    build: { write: false },
    plugins: [{
      name: "home-diet-baseline-source",
      enforce: "pre",
      transform(_code, id) { return sources.has(id) ? { code: sources.get(id), map: null } : null; },
      async generateBundle(_options, bundle) {
        const modules = Object.values(bundle).filter((item) => item.type === "chunk").flatMap((chunk) =>
          Object.entries(chunk.modules).map(([id, module]) => ({ chunk: chunk.fileName, module: path.relative(process.cwd(), id), renderedBytes: module.renderedLength })));
        modules.sort((a, b) => b.renderedBytes - a.renderedBytes);
        await writeFile("docs/evidence/home-diet/modules-before.json", `${JSON.stringify({ revision, attribution: "Rollup renderedLength (before minification)", modules }, null, 2)}\n`);
      },
    }],
  });
} finally {
  await unlink(configFile);
}

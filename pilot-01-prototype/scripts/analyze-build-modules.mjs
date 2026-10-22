#!/usr/bin/env node
// Rollup's renderedLength is pre-minification attribution, not a per-module network/gzip cost.
// No dependencies beyond the existing Vite toolchain; write:false preserves the built release.
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { build } from "vite";

const output = process.argv[2];
if (!output) throw new Error("Usage: node scripts/analyze-build-modules.mjs <report.json>");
await build({
  build: { write: false },
  plugins: [{
    name: "nexualpha-module-size-report",
    async generateBundle(_options, bundle) {
      const modules = Object.values(bundle).filter((item) => item.type === "chunk").flatMap((chunk) =>
        Object.entries(chunk.modules).map(([id, module]) => ({
          chunk: chunk.fileName,
          module: path.relative(process.cwd(), id),
          renderedBytes: module.renderedLength,
        })));
      modules.sort((a, b) => b.renderedBytes - a.renderedBytes);
      await writeFile(output, `${JSON.stringify({ attribution: "Rollup renderedLength (before minification)", modules }, null, 2)}\n`);
    },
  }],
});

import { readdir, stat, readFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const root = path.resolve(process.env.REVIEW_ROOT || process.cwd());
const assetsDir = path.join(root, "dist", "client", "assets");
const strict = process.argv.includes("--strict");

const assetFiles = await readdir(assetsDir);
const files = assetFiles.filter((name) => name.endsWith(".js"));
const rows = await Promise.all(files.map(async (name) => ({ name, bytes: (await stat(path.join(assetsDir, name))).size })));
const rules = [
  { label: "app shell", pattern: /^index-[\w-]+\.js$/, maxBytes: 400_000 },
  // The V3 route now carries first-class copy for the international comparison
  // surfaces. Keep a hard ceiling while allowing the reviewed locale bundle.
  { label: "V3 route", pattern: /^route-v3-pages-[\w-]+\.js$/, maxBytes: 320_000 },
];
const checks = rules.map((rule) => {
  // The manual V3 main chunk shares its prefix with copy/state subchunks.
  // Unknown additional main candidates are ambiguous and must fail closed.
  const matches = rows.filter((row) => rule.pattern.test(row.name)
    && (rule.label !== "V3 route" || !/^route-v3-pages-(?:copy|state|strip)-/.test(row.name)));
  const match = matches.length === 1 ? matches[0] : null;
  return {
    label: rule.label,
    asset: match?.name ?? null,
    candidates: matches.map((row) => row.name),
    bytes: match?.bytes ?? null,
    maxBytes: rule.maxBytes,
    pass: Boolean(match && match.bytes <= rule.maxBytes),
  };
});
// A shared component stylesheet must be referenced by the HTML, not merely
// present inside another route's discarded CSS chunk.
const railAsset = assetFiles.find((name) => /^shared-decision-rail-[\w-]+\.css$/.test(name));
const railCss = railAsset ? await readFile(path.join(assetsDir, railAsset), "utf8") : "";
const indexHtml = await readFile(path.join(root, "dist", "client", "index.html"), "utf8");
checks.push({
  label: "shared decision navigation CSS",
  asset: railAsset ?? null,
  pass: Boolean(railAsset && indexHtml.includes(`/assets/${railAsset}`)
    && railCss.includes(".decision-path-rail{") && railCss.includes(".decision-path-rail__link{")),
});
const returnAsset = assetFiles.find((name) => /^shared-decision-return-[\w-]+\.css$/.test(name));
const returnCss = returnAsset ? await readFile(path.join(assetsDir, returnAsset), "utf8") : "";
checks.push({
  label: "shared scenario copy CSS",
  asset: returnAsset ?? null,
  pass: Boolean(returnAsset && indexHtml.includes(`/assets/${returnAsset}`)
    && returnCss.includes(".decision-return-link")),
});
// Home initial JS (perf lane 2026-10-11): every chunk the browser entry reaches through static imports, measured as
// gzip bytes (what nginx sends). The home route preloads no deferred module (modulePathsForRoute "home" is empty), so
// this closure is exactly what a home visit downloads before it can hydrate. Transitive imports are hoisted into the
// entry as bare `import"./x.js"` statements, so following `import ... from` and bare imports from the entry suffices.
export async function entryStaticClosure(assetsDirectory, html) {
  const entryMatch = html.match(/<script\b[^>]*type="module"[^>]*src="[^"]*\/assets\/(index-[\w-]+\.js)"/);
  if (!entryMatch) throw new Error("build budget: module entry script not found in index.html");
  const seen = new Map();
  const queue = [entryMatch[1]];
  while (queue.length) {
    const name = queue.shift();
    if (seen.has(name)) continue;
    const code = await readFile(path.join(assetsDirectory, name));
    seen.set(name, { bytes: code.length, gzipBytes: gzipSync(code, { level: 6 }).length });
    for (const match of code.toString("utf8").matchAll(/import(?:\s*[^;"']*?from\s*)?\s*"\.\/([\w-]+\.js)"/g)) queue.push(match[1]);
  }
  return seen;
}
const closure = await entryStaticClosure(assetsDir, indexHtml);
const closureRows = [...closure.entries()].map(([name, size]) => ({ name, ...size })).sort((a, b) => b.gzipBytes - a.gzipBytes);
const closureGzip = closureRows.reduce((sum, row) => sum + row.gzipBytes, 0);
const HOME_INITIAL_JS_GZIP_MAX = 350_000;
checks.push({
  label: "home initial JS (static closure of the entry, gzip)",
  asset: closureRows.map((row) => row.name).join(" "),
  bytes: closureGzip,
  maxBytes: HOME_INITIAL_JS_GZIP_MAX,
  chunks: closureRows,
  pass: closureGzip <= HOME_INITIAL_JS_GZIP_MAX,
});
const result = {
  status: checks.every((check) => check.pass) ? "PASS" : "FAIL",
  strict,
  assets: rows.sort((a, b) => b.bytes - a.bytes),
  checks,
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (strict && result.status !== "PASS") process.exitCode = 1;

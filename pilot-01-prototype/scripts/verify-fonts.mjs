#!/usr/bin/env node
/** Checks local font integrity, CSS paths, size budget and catalog-derived coverage metadata. */
import { createHash } from "node:crypto";
import { access, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const dir = resolve(root, "public/fonts");
const css = await readFile(resolve(root, "src/font-faces.css"), "utf8");
// Script faces (CJK, Korean, Arabic) are declared per page locale in src/data/locale-font-faces.js, versioned by SHA-256 prefix.
const { FONT_VERSIONS, localeFontFaceCss } = await import(new URL("../src/data/locale-font-faces.js", import.meta.url));
const localeCss = ["zh-Hans", "zh-Hant", "ja", "ko", "ar"].map(localeFontFaceCss).join("\n");
const manifest = JSON.parse(await readFile(resolve(dir, "manifest.json"), "utf8"));
const hash = (v) => createHash("sha256").update(v).digest("hex");
let total = 0;
for (const entry of manifest.files) {
  const path = resolve(dir, entry.file);
  const bytes = await readFile(path);
  if (hash(bytes) !== entry.outputSha256) throw new Error(`SHA-256 mismatch: ${entry.file}`);
  if (entry.license) { if (!bytes.toString("utf8").includes("Open Font License")) throw new Error(`Invalid license: ${entry.file}`); continue; }
  if (bytes.subarray(0, 4).toString("ascii") !== "wOF2") throw new Error(`Not WOFF2: ${entry.file}`);
  const versioned = `/fonts/${entry.file}?v=${hash(bytes).slice(0, 12)}`;
  if (FONT_VERSIONS[entry.file] !== hash(bytes).slice(0, 12)) throw new Error(`Stale ?v= version for ${entry.file} in src/data/locale-font-faces.js`);
  if (!css.includes(versioned) && !localeCss.includes(versioned)) throw new Error(`CSS does not reference ${versioned}`);
  // macOS Fontconfig in this environment lacks WOFF2 support. `file` uses its
  // installed font recognizer and confirms that the WOFF2 has a TrueType payload.
  const decoded = execFileSync("file", [path], { encoding: "utf8" });
  if (!decoded.includes("TrueType")) throw new Error(`Font payload is not decodable: ${entry.file}`);
  total += (await stat(path)).size;
}
for (const [locale, coverage] of Object.entries(manifest.localeCoverage)) {
  if (coverage.catalogCodepoints < 1) throw new Error(`No catalog coverage recorded for ${locale}`);
}
if (total > 3 * 1024 * 1024) throw new Error(`Font budget exceeded: ${total} bytes (limit 3 MiB)`);
console.log(`PASS: ${manifest.files.length} tracked files, ${(total / 1024).toFixed(1)} KiB WOFF2, licenses/SHA/CSS/decode/catalog metadata verified.`);

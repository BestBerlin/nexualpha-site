#!/usr/bin/env node
// Rejoin the ordered v6 segments into two route assets. Inner pages keep the
// complete original cascade; home downloads only shared segments. CSS-only
// chunks have no runtime import, so the split must not add stylesheet requests.
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist/client");
const files = await readdir(path.join(root, "assets"));
const segments = ["core-c", "page-inner-c1", "core-c2", "page-inner-c2", "core-c3", "page-inner-c3", "core-c4"];
const sheets = await Promise.all(segments.map(async (prefix) => {
  const matches = files.filter((name) => new RegExp(`^${prefix}-[\\w-]+\\.css$`).test(name));
  if (matches.length !== 1) throw new Error(`route CSS: expected one ${prefix} stylesheet`);
  return { name: matches[0], css: await readFile(path.join(root, "assets", matches[0]), "utf8"), shared: prefix.startsWith("core-") };
}));
// A future JS dependency on a segment would cause it to download independently.
for (const name of files.filter((name) => name.endsWith(".js"))) {
  const js = await readFile(path.join(root, "assets", name), "utf8");
  if (sheets.some((sheet) => js.includes(sheet.name))) throw new Error(`route CSS: ${name} imports a v6 segment`);
}
const emit = async (prefix, parts) => {
  const css = parts.map((sheet) => sheet.css.trim()).join("\n") + "\n";
  const hash = createHash("sha256").update(css).digest("hex").slice(0, 8);
  const href = `/assets/${prefix}-${hash}.css`;
  await writeFile(path.join(root, href), css);
  return { href, tag: `<link rel="stylesheet" crossorigin href="${href}">` };
};
const full = await emit("core-c", sheets);
const home = await emit("page-home-v6", sheets.filter((sheet) => sheet.shared));
let html = await readFile(path.join(root, "index.html"), "utf8");
let count = 0;
html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="\/assets\/([^"\n]+)"[^>]*>/g, (tag, name) => {
  if (!sheets.some((sheet) => sheet.name === name)) return tag;
  count += 1;
  return count === 1 ? `${full.tag}\n    ${home.tag}` : "";
});
if (count !== segments.length) throw new Error(`route CSS: expected ${segments.length} segment links, got ${count}`);
await writeFile(path.join(root, "index.html"), html);
console.log(`Route CSS: ${segments.length} v6 segments -> one full inner asset / one shared home asset`);

// Register post-Rollup assets for the per-route resource manifest.
const manifestPath = path.join(root, ".vite/manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
for (const [name, asset] of [["inner-v6", full], ["home-v6", home]]) {
  manifest[`route-css:${name}`] = { file: asset.href.slice(1), surface: name === "home-v6" ? "home" : "inner" };
}
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

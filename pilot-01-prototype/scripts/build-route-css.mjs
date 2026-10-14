#!/usr/bin/env node
// Rejoin the ordered v6 segments into two route assets. Inner pages keep the
// complete original cascade; home downloads only shared segments. CSS-only
// chunks have no runtime import, so the split must not add stylesheet requests.
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";
import { extractCriticalCss } from "./build-critical-css.mjs";

const root = path.resolve("dist/client");
const files = await readdir(path.join(root, "assets"));
const inputHtml = await readFile(path.join(root, "index.html"), "utf8");
const HOME_LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"];
const segments = ["core-c", "page-inner-c1", "core-c2", "page-inner-c2", "core-c3", "page-inner-c3", "core-c4"];
const sheets = await Promise.all(segments.map(async (prefix) => {
  const matches = files.filter((name) => new RegExp(`^${prefix}-[\\w-]+\\.css$`).test(name));
  const candidates = matches.length > 1 ? matches.filter((name) => !inputHtml.includes(`/assets/${name}`)) : matches;
  if (candidates.length !== 1) throw new Error(`route CSS: expected one ${prefix} stylesheet`);
  return { name: candidates[0], css: await readFile(path.join(root, "assets", candidates[0]), "utf8"), shared: prefix.startsWith("core-") };
}));
// A future JS dependency on a segment would cause it to download independently.
for (const name of files.filter((name) => name.endsWith(".js"))) {
  const js = await readFile(path.join(root, "assets", name), "utf8");
  if (sheets.some((sheet) => js.includes(sheet.name))) throw new Error(`route CSS: ${name} imports a v6 segment`);
}
const emit = async (prefix, parts, cssOverride = null) => {
  const css = (cssOverride ?? parts.map((sheet) => sheet.css.trim()).join("\n")) + "\n";
  const hash = createHash("sha256").update(css).digest("hex").slice(0, 8);
  const href = `/assets/${prefix}-${hash}.css`;
  await writeFile(path.join(root, href), css);
  return `<link rel="stylesheet" crossorigin href="${href}">`;
};
async function homeDocuments() {
  const documents = [];
  for (const locale of HOME_LOCALES) {
    const asset = path.join(root, "prerender", locale, "home.json");
    if (!existsSync(asset)) return null;
    const { html } = JSON.parse(await readFile(asset, "utf8"));
    const dir = ["ar", "ur"].includes(locale) ? "rtl" : "ltr";
    documents.push(new JSDOM(`<!doctype html><html lang="${locale}" dir="${dir}"><head></head><body><div id="root">${html}</div></body></html>`).window.document);
  }
  return documents;
}

const full = await emit("core-c", sheets);
const sharedSheets = sheets.filter((sheet) => sheet.shared);
const documents = await homeDocuments();
const homeCss = documents
  ? extractCriticalCss(sharedSheets.map((sheet) => sheet.css), documents).css
  : sharedSheets.map((sheet) => sheet.css.trim()).join("\n");
const home = await emit("page-home-v6", sharedSheets, homeCss);
for (const document of documents || []) document.defaultView?.close();
let html = inputHtml;
let count = 0;
const segmentNames = new Set(sheets.map((sheet) => sheet.name));
html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="\/assets\/([^"\n]+)"[^>]*>/g, (tag, name) => {
  if (!segmentNames.has(name)) return tag;
  count += 1;
  return count === 1 ? `${full}\n    ${home}` : "";
});
if (count === 0) {
  html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="\/assets\/(core-c|page-home-v6)-[\w-]+\.css"[^>]*>\n?\s*/g, (tag, prefix) => {
    count += 1;
    return count === 1 ? `${full}\n    ${home}\n    ` : "";
  });
  if (count !== 2) throw new Error(`route CSS: expected existing core-c/page-home-v6 links, got ${count}`);
} else if (count !== segments.length) {
  throw new Error(`route CSS: expected ${segments.length} segment links, got ${count}`);
}
await writeFile(path.join(root, "index.html"), html);
console.log(`Route CSS: ${segments.length} v6 segments -> one full inner asset / one HomeV7-sliced home asset${documents ? ` (${Math.round(homeCss.length / 1024)} KB home)` : ""}`);

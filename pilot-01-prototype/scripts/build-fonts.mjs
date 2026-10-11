#!/usr/bin/env node
/**
 * Mirrors text-subset WOFF2 files served by the official Google Fonts CSS API.
 * It never changes application code and has no npm dependencies.
 *
 * Run: node scripts/build-fonts.mjs
 */
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const localeDir = resolve(root, "src/content/locales");
const outputDir = resolve(root, "public/fonts");
const today = new Date().toISOString().slice(0, 10);
const chromeUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const fontApi = "https://fonts.googleapis.com/css2";

const families = {
  latin: { family: "Inter", css: "family=Inter:opsz,wght@14..32,400..700", locales: ["en", "es", "pt-BR", "fr", "de", "tr", "ru", "id", "vi", "it", "uk"] },
  "zh-Hans": { family: "Noto Sans SC", css: "family=Noto+Sans+SC:wght@400;500;600;700", locales: ["zh-Hans"] },
  "zh-Hant": { family: "Noto Sans TC", css: "family=Noto+Sans+TC:wght@400;500;600;700", locales: ["zh-Hant"] },
  ja: { family: "Noto Sans JP", css: "family=Noto+Sans+JP:wght@400;500;600;700", locales: ["ja"] },
  ko: { family: "Noto Sans KR", css: "family=Noto+Sans+KR:wght@400;500;600;700", locales: ["ko"] },
  ar: { family: "Noto Sans Arabic", css: "family=Noto+Sans+Arabic:wght@400;500;600;700", locales: ["ar", "ur"] },
};

const licenses = [
  ["Inter-OFL.txt", "https://raw.githubusercontent.com/rsms/inter/master/LICENSE.txt"],
  ["Noto-CJK-OFL.txt", "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/LICENSE"],
  ["Noto-Arabic-OFL.txt", "https://raw.githubusercontent.com/notofonts/arabic/main/OFL.txt"],
];

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function sourceText(ts) {
  // Locale catalogs are TypeScript object literals. Keeping literal values makes the
  // subset input reviewable, while ignoring identifiers, type names and imports.
  return [...ts.matchAll(/(["'])(?:\\.|(?!\1)[\s\S])*?\1/g)]
    .map((m) => m[0].slice(1, -1).replace(/\\([\\'"nrt])/g, (_, c) => ({ n: "\n", r: "\r", t: "\t" }[c] ?? c)))
    .join("");
}
function encodeText(value) {
  return [...new Set([...value])].sort((a, b) => a.codePointAt(0) - b.codePointAt(0)).join("");
}
async function fetchChecked(url) {
  const response = await fetch(url, { headers: { "user-agent": chromeUA } });
  if (!response.ok) throw new Error(`${response.status} from ${url}`);
  return Buffer.from(await response.arrayBuffer());
}
function cssUrl(css) {
  const url = css.match(/src: url\(([^)]+)\).*?format\('woff2'\)/s)?.[1];
  if (!url) throw new Error("Google Fonts did not return a WOFF2 source; use a current Chrome user agent.");
  return url;
}

await mkdir(outputDir, { recursive: true });
const localeText = Object.fromEntries(await Promise.all((await readdir(localeDir))
  .filter((file) => file.endsWith(".ts"))
  .map(async (file) => [file.replace(/\.ts$/, ""), sourceText(await readFile(resolve(localeDir, file), "utf8"))])));

const manifest = { schema: 1, generatedAt: today, provider: "Google Fonts CSS API (official)", files: [], localeCoverage: {} };
for (const [id, config] of Object.entries(families)) {
  const text = encodeText(config.locales.map((locale) => localeText[locale] ?? "").join(""));
  if (!text) throw new Error(`No catalog text found for ${id}`);
  const url = `${fontApi}?${config.css}&text=${encodeURIComponent(text)}`;
  const css = (await fetchChecked(url)).toString("utf8");
  const faceBlocks = css.match(/@font-face\s*\{[\s\S]*?\}/g) ?? [];
  const unicodeRange = css.match(/unicode-range:\s*([^;]+);/)?.[1] ?? "U+0-10FFFF";
  manifest.localeCoverage[id] = { locales: config.locales, catalogCodepoints: [...text].length, unicodeRange, fallback: "System UI fallback remains intentional for future catalog characters." };
  for (const block of faceBlocks) {
    const weight = block.match(/font-weight:\s*(\d+(?:\s+\d+)?)/)?.[1];
    if (!weight) continue;
    const upstream = cssUrl(block);
    const filename = `${id}-${weight.replace(/\s+/g, "-")}.woff2`;
    const target = resolve(outputDir, filename);
    await writeFile(target, await fetchChecked(upstream));
    const bytes = await readFile(target);
    if (bytes.subarray(0, 4).toString("ascii") !== "wOF2") throw new Error(`${filename} is not WOFF2`);
    manifest.files.push({ file: filename, family: config.family, weight: Number(weight), locales: config.locales, sourceCssUrl: url, sourceWoff2Url: upstream, sourceSha256: sha256(bytes), outputSha256: sha256(bytes), bytes: bytes.length, unicodeRange });
  }
}
for (const [filename, url] of licenses) {
  const value = await fetchChecked(url);
  await writeFile(resolve(outputDir, filename), value);
  manifest.files.push({ file: filename, license: true, sourceUrl: url, sourceSha256: sha256(value), outputSha256: sha256(value), bytes: value.length });
}
await writeFile(resolve(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Built ${manifest.files.filter((entry) => !entry.license).length} WOFF2 subsets in ${outputDir}`);

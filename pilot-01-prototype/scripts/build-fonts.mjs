#!/usr/bin/env node
/**
 * Mirrors text-subset WOFF2 files served by the official Google Fonts CSS API.
 * It never changes application code and has no npm dependencies.
 *
 * Run: node scripts/build-fonts.mjs
 * Run SC-only: node scripts/build-fonts.mjs --only zh-Hans
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const localeDir = resolve(root, "src/content/locales");
const outputDir = resolve(root, "public/fonts");
const today = new Date().toISOString().slice(0, 10);
const chromeUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const fontApi = "https://fonts.googleapis.com/css2";
const onlyFamily = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;

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

const scCorpusFiles = ["src/content/locales/zh-Hans.ts"];

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

function scRelevantText(value) {
  return [...String(value || "")].filter((char) => /[\u0020-\u007e\u00a0-\u00ff\u2010-\u2026\u2190-\u21ff\u25be\u2713\u2726\u3000-\u303f\u4e00-\u9fff\uff00-\uffef]/u.test(char)).join("");
}
function stripHtmlText(html) {
  return String(html || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ");
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
async function homeSsrText() {
  const entry = resolve(root, "dist/news-ssr/entry-server.js");
  if (!existsSync(entry)) return "";
  const { render } = await import(`${pathToFileURL(entry).href}?fontCorpus=${Date.now()}`);
  if (typeof render !== "function") return "";
  return ["a", "b"].map((heroVariant) => stripHtmlText(render("/zh-hans", { heroVariant }))).join("\n");
}
async function zhHansCorpus(localeText) {
  const sourceParts = [];
  for (const file of scCorpusFiles) {
    const target = resolve(root, file);
    if (existsSync(target)) sourceParts.push(sourceText(await readFile(target, "utf8")));
  }
  if (!sourceParts.length && localeText["zh-Hans"]) sourceParts.push(localeText["zh-Hans"]);
  const homeText = scRelevantText(await homeSsrText());
  const sourceTextValue = scRelevantText(sourceParts.join("\n"));
  const corpus = encodeText(`${sourceTextValue}\n${homeText}`);
  return {
    text: corpus,
    sourceCodepoints: encodeText(sourceTextValue).length,
    homeSsrCodepoints: encodeText(homeText).length,
    corpusCodepoints: corpus.length,
    corpusSources: ["src/content/locales/zh-Hans.ts", ...scCorpusFiles.filter((file) => file !== "src/content/locales/zh-Hans.ts"), ...(homeText ? ["dist/news-ssr render('/zh-hans') hero variants a,b"] : [])],
  };
}
async function fetchFontSubset({ id, config, text, cssOverride }) {
  const cssQuery = cssOverride || config.css;
  const url = `${fontApi}?${cssQuery}&text=${encodeURIComponent(text)}`;
  const css = (await fetchChecked(url)).toString("utf8");
  const faceBlocks = css.match(/@font-face\s*\{[\s\S]*?\}/g) ?? [];
  const unicodeRange = css.match(/unicode-range:\s*([^;]+);/)?.[1] ?? "U+0-10FFFF";
  const outputs = [];
  for (const block of faceBlocks) {
    const weight = block.match(/font-weight:\s*(\d+(?:\s+\d+)?)/)?.[1];
    if (!weight) continue;
    const upstream = cssUrl(block);
    const filename = `${id}-${weight.replace(/\s+/g, "-")}.woff2`;
    const bytes = await fetchChecked(upstream);
    if (bytes.subarray(0, 4).toString("ascii") !== "wOF2") throw new Error(`${filename} is not WOFF2`);
    outputs.push({ filename, weight, upstream, bytes, url, unicodeRange });
  }
  if (!outputs.length) throw new Error(`Google Fonts returned no WOFF2 faces for ${id}`);
  return outputs;
}
async function buildOnlyZhHans(localeText) {
  const id = "zh-Hans";
  const config = families[id];
  const corpus = await zhHansCorpus(localeText);
  if (!corpus.text) throw new Error("No zh-Hans corpus text found");
  const outputs = await fetchFontSubset({ id, config, text: corpus.text, cssOverride: "family=Noto+Sans+SC:wght@400" });
  if (outputs.length !== 1 || outputs[0].weight !== "400") throw new Error(`Expected one zh-Hans 400 face, got ${outputs.map((output) => output.weight).join(",")}`);
  const manifestPath = resolve(outputDir, "manifest.json");
  const manifest = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, "utf8")) : { schema: 1, generatedAt: today, provider: "Google Fonts CSS API (official)", files: [], localeCoverage: {} };
  manifest.schema = manifest.schema || 1;
  manifest.provider = manifest.provider || "Google Fonts CSS API (official)";
  manifest.generatedAt = today;
  manifest.files = Array.isArray(manifest.files) ? manifest.files : [];
  manifest.localeCoverage = manifest.localeCoverage && typeof manifest.localeCoverage === "object" ? manifest.localeCoverage : {};
  for (const output of outputs) {
    await writeFile(resolve(outputDir, output.filename), output.bytes);
    const hash = sha256(output.bytes);
    const entry = { file: output.filename, family: config.family, weight: Number(output.weight), locales: config.locales, sourceCssUrl: output.url, sourceWoff2Url: output.upstream, sourceSha256: hash, outputSha256: hash, bytes: output.bytes.length, unicodeRange: output.unicodeRange };
    const existingIndex = manifest.files.findIndex((item) => item.file === output.filename);
    if (existingIndex >= 0) manifest.files[existingIndex] = entry;
    else manifest.files.push(entry);
    manifest.localeCoverage[id] = { locales: config.locales, catalogCodepoints: corpus.sourceCodepoints, homeSsrCodepoints: corpus.homeSsrCodepoints, corpusCodepoints: corpus.corpusCodepoints, unicodeRange: output.unicodeRange, corpusSources: corpus.corpusSources, fallback: "System UI fallback remains intentional for future catalog characters." };
    console.log(`Built ${output.filename}: ${corpus.corpusCodepoints} corpus codepoints (${corpus.homeSsrCodepoints} from home SSR), ${output.bytes.length} bytes, sha256 ${hash}`);
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

await mkdir(outputDir, { recursive: true });
const localeText = Object.fromEntries(await Promise.all((await readdir(localeDir))
  .filter((file) => file.endsWith(".ts"))
  .map(async (file) => [file.replace(/\.ts$/, ""), sourceText(await readFile(resolve(localeDir, file), "utf8"))])));

if (onlyFamily) {
  if (onlyFamily !== "zh-Hans") throw new Error(`Unsupported --only ${onlyFamily}; this targeted mode only preserves other files while rebuilding zh-Hans.`);
  await buildOnlyZhHans(localeText);
} else {
  const manifest = { schema: 1, generatedAt: today, provider: "Google Fonts CSS API (official)", files: [], localeCoverage: {} };
  for (const [id, config] of Object.entries(families)) {
    const text = encodeText(config.locales.map((locale) => localeText[locale] ?? "").join(""));
    if (!text) throw new Error(`No catalog text found for ${id}`);
    const outputs = await fetchFontSubset({ id, config, text });
    manifest.localeCoverage[id] = { locales: config.locales, catalogCodepoints: [...text].length, unicodeRange: outputs[0]?.unicodeRange || "U+0-10FFFF", fallback: "System UI fallback remains intentional for future catalog characters." };
    for (const output of outputs) {
      await writeFile(resolve(outputDir, output.filename), output.bytes);
      const hash = sha256(output.bytes);
      manifest.files.push({ file: output.filename, family: config.family, weight: Number(output.weight), locales: config.locales, sourceCssUrl: output.url, sourceWoff2Url: output.upstream, sourceSha256: hash, outputSha256: hash, bytes: output.bytes.length, unicodeRange: output.unicodeRange });
    }
  }
  for (const [filename, url] of licenses) {
    const value = await fetchChecked(url);
    await writeFile(resolve(outputDir, filename), value);
    manifest.files.push({ file: filename, license: true, sourceUrl: url, sourceSha256: sha256(value), outputSha256: sha256(value), bytes: value.length });
  }
  await writeFile(resolve(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Built ${manifest.files.filter((entry) => !entry.license).length} WOFF2 subsets in ${outputDir}`);
}

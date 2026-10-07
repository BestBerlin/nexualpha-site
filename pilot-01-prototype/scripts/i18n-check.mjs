import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = new URL("..", import.meta.url);
const readJson = async (file) => JSON.parse(await readFile(new URL(file, root), "utf8"));
const settings = await readJson("project.inlang/settings.json");
const metadata = await readJson("i18n/review-metadata.json");
const limits = await readJson("i18n/length-limits.json");
const catalogDir = new URL("locales/", root);
const names = new Set(await readdir(catalogDir));
const placeholderNames = (message) => [...message.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map((match) => match[1]).sort();
const bracesBalanced = (message) => [...message].reduce((depth, character) => depth + (character === "{" ? 1 : character === "}" ? -1 : 0), 0) === 0;
const protectedEntities = /\b(?:NOVA|ORBIT|STELLAR|USDT|UTC|KYC|Binance(?: Spot)?|Bitget|Kraken|Bybit|OKX|dYdX|Singapore)\b/gi;
const englishWordCount = (value) => (value.replace(protectedEntities, "").match(/\b[A-Za-z]{3,}\b/g) ?? []).length;
const nonLatinLocales = new Set(["zh-Hans", "zh-Hant", "ja", "ko", "ar", "ru"]);
const base = await readJson("locales/en.json");
const baseKeys = Object.keys(base).sort();
const failures = [];

for (const locale of settings.locales) {
  if (!names.has(`${locale}.json`)) { failures.push(`${locale}: catalog missing`); continue; }
  const catalog = await readJson(`locales/${locale}.json`);
  const keys = Object.keys(catalog).sort();
  if (JSON.stringify(keys) !== JSON.stringify(baseKeys)) failures.push(`${locale}: catalog keys differ from en`);
  for (const key of baseKeys) {
    const value = catalog[key];
    if (typeof value !== "string" || value.trim() === "") failures.push(`${locale}:${key}: missing string`);
    if (!bracesBalanced(value)) failures.push(`${locale}:${key}: unbalanced ICU braces`);
    if (JSON.stringify(placeholderNames(value)) !== JSON.stringify(placeholderNames(base[key]))) failures.push(`${locale}:${key}: placeholder mismatch`);
    if (key in limits && [...value].length > limits[key]) failures.push(`${locale}:${key}: ${[...value].length}/${limits[key]} exceeds UI limit`);
    if (locale !== "en" && ((nonLatinLocales.has(locale) && englishWordCount(value) >= 2) || (!nonLatinLocales.has(locale) && value === base[key] && englishWordCount(value) >= 2))) failures.push(`${locale}:${key}: unapproved English natural-language sentence`);
  }
  const review = metadata.locales[locale];
  if (!review) failures.push(`${locale}: review metadata missing`);
  else {
    if (review.machineTranslation !== "not-used") failures.push(`${locale}: machine translation status must be explicit`);
    if (review.agentReview !== "complete") failures.push(`${locale}: agent review status missing`);
    if (review.qaStatus === "agent-linguistic-qa-complete" && review.translationStatus === "human-reviewed") failures.push(`${locale}: agent QA cannot set human-reviewed`);
    if (review.indexable && review.humanReview !== "verified") failures.push(`${locale}: indexable locale lacks human-review evidence`);
    if (locale === "ar" && review.direction !== "rtl") failures.push("ar: RTL metadata missing");
  }
}
if (settings.baseLocale !== "en" || !settings.locales.includes("en")) failures.push("settings: en must be the base locale");
assert.equal(new Set(settings.locales).size, settings.locales.length, "settings: duplicate locale");
if (failures.length) throw new Error(`i18n check failed:\n${failures.join("\n")}`);
console.log(`i18n check passed: ${settings.locales.length} catalogs, ${baseKeys.length} keys, placeholders, RTL metadata, review gates, and UI limits validated.`);

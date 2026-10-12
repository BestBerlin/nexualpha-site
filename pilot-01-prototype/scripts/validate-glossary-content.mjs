#!/usr/bin/env node
// Validates glossary content files (content-source/glossary/<locale>.json or writer part files) against the term index.
// Usage: node scripts/validate-glossary-content.mjs <file.json> [...more]   (exit 1 on any error)
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GLOSSARY_SLUGS } from "../src/data/glossary-terms.js";

const CJK_CHARS = { "zh-Hans": [280, 800], ja: [350, 950], ko: [280, 900] };
const WORDS = [140, 340];
const SLUGS = new Set(GLOSSARY_SLUGS);

export function measure(locale, text) {
  if (CJK_CHARS[locale]) return { unit: "chars", n: text.replace(/\s+/g, "").length, range: CJK_CHARS[locale] };
  return { unit: "words", n: text.split(/\s+/).filter(Boolean).length, range: WORDS };
}

export function validateTerm(locale, slug, entry) {
  const errors = [];
  const need = (cond, message) => { if (!cond) errors.push(`${locale}/${slug}: ${message}`); };
  need(SLUGS.has(slug), "unknown slug");
  need(entry && typeof entry === "object", "entry must be an object");
  if (!entry || typeof entry !== "object") return errors;
  const str = (v) => typeof v === "string" && v.trim().length > 0;
  need(str(entry.term) && entry.term.length <= 80, "term (<=80 chars)");
  need(Array.isArray(entry.aka) && entry.aka.every(str), "aka must be an array of strings (may be empty)");
  need(str(entry.short) && entry.short.length >= 40 && entry.short.length <= (CJK_CHARS[locale] ? 160 : 300), "short: one-sentence definition, 40-300 chars (CJK <=160)");
  need(Array.isArray(entry.body) && entry.body.length >= 2 && entry.body.length <= 5 && entry.body.every(str), "body: 2-5 paragraphs");
  need(str(entry.example) && /\d/.test(entry.example), "example: one paragraph with concrete numbers");
  need(Array.isArray(entry.mistakes) && entry.mistakes.length >= 2 && entry.mistakes.length <= 4 && entry.mistakes.every(str), "mistakes: 2-4 items");
  need(Array.isArray(entry.faq) && entry.faq.length >= 2 && entry.faq.length <= 4 && entry.faq.every((f) => str(f?.q) && str(f?.a)), "faq: 2-4 {q,a}");
  need(str(entry.title) && entry.title.length <= 70, "title <= 70 chars");
  need(str(entry.description) && entry.description.length >= 50 && entry.description.length <= 165, "description 50-165 chars");
  if (Array.isArray(entry.body) && str(entry.example)) {
    const m = measure(locale, [...entry.body, entry.example].join(" "));
    need(m.n >= m.range[0] && m.n <= m.range[1], `body+example length ${m.n} ${m.unit}, expected ${m.range[0]}-${m.range[1]}`);
  }
  const all = JSON.stringify(entry);
  need(!/https?:\/\/|www\./i.test(all), "no URLs in text");
  need(!/not (financial|investment) advice|DYOR|do your own research/i.test(all), "no fine-print disclaimers");
  need(!/[<>]/.test(all), "no HTML/markup");
  need(!/\*\*|__|\[[^\]]+\]\(/.test(all), "no markdown");
  return errors;
}

export function validateFile(json) {
  const locale = json?.locale;
  const errors = [];
  if (!locale) errors.push("missing locale");
  if (!json?.terms || typeof json.terms !== "object") errors.push("missing terms object");
  for (const [slug, entry] of Object.entries(json?.terms || {})) errors.push(...validateTerm(locale, slug, entry));
  return errors;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  let failed = 0;
  for (const file of process.argv.slice(2)) {
    let json;
    try { json = JSON.parse(await readFile(file, "utf8")); } catch (error) { console.log(`${file}: invalid JSON: ${error.message}`); failed++; continue; }
    const errors = validateFile(json);
    console.log(`${file}: ${Object.keys(json.terms || {}).length} terms, ${errors.length ? `${errors.length} errors` : "OK"}`);
    for (const e of errors) console.log(`  - ${e}`);
    if (errors.length) failed++;
  }
  process.exit(failed ? 1 : 0);
}

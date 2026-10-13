#!/usr/bin/env node
// NexuAlpha Academy, Season 1 ("Sam's First Crypto Lesson"): builds the site data from the production sources.
//
// Inputs (read-only; override with env vars when the sources move):
//   ACADEMY_V3_DIR      v3 episode scripts, English + Simplified Chinese (titles, goals, exercise, page_cta, cards)
//   ACADEMY_L10N_DIR    the same scripts localized into 12 more locales (dialogue, titles, goals, exercise)
//   ops/academy-v3/episodes/E##.json   aligned narration timings of the rendered English videos (in this repo)
//   content-source/academy/            study notes (takeaways + quiz) and UI strings per locale (in this repo)
//   content-source/academy/l10n-fixes/   reviewed lesson-text overrides keyed by the English source line
//   content-source/academy/shell-overrides.json   reviewed shell strings that differ from full-page UI copy
//   content-source/academy/vtt-fixes/    caption-only overrides preserving the published subtitle wording
//   content-source/academy/vtt-snapshots/ reviewed subtitle bytes preserving published cue timing/segmentation
// Outputs (committed):
//   src/data/academy-season1.js         episode index shared by the client, the Worker and the SEO head
//   src/data/academy-content-<locale>.js  per-locale lesson content (one lazy chunk per locale in the browser)
//   src/data/academy-content-all.js     server-only map of every content module (Worker, SEO head, tests)
//   src/data/academy-copy.js            UI strings for all 17 UI locales
//   public/captions/academy/s1/E##.<locale>.vtt   subtitle tracks from the aligned dialogue
//
// Owner rule 2026-10-12: no fine print on the academy pages (teaching-assumption labels, commission notes, availability
// caveats). Only dialogue is imported; on-screen labels are not. Conversion-card dialogue is left out of a locale whose
// site edition shows no sign-up for that card (neutral locales, partners not promotable there).
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { schedule } from "../../ops/academy-v3/contract.mjs";
import { isPartnerPromotableIn } from "../src/data/partner-geo-policy.js";
import { NEUTRAL_CTA_LOCALES } from "../src/data/locale-policy.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(root, "..");
const V3_DIR = process.env.ACADEMY_V3_DIR || "/Volumes/致态2TB/nx-agents/education/v3/episodes";
const L10N_DIR = process.env.ACADEMY_L10N_DIR || "/Users/bestberlin/Documents/ChatGPT/Crypto聚合/.gemini-v3/out";
const TIMING_DIR = path.join(repo, "ops", "academy-v3", "episodes");
const NOTES_DIR = path.join(root, "content-source", "academy");
const outputRootIndex = process.argv.indexOf("--output-root");
const outputRoot = outputRootIndex >= 0 ? path.resolve(process.argv[outputRootIndex + 1] || "") : root;
if (outputRootIndex >= 0 && !process.argv[outputRootIndex + 1]) throw new Error("--output-root requires a directory");
const DATA_DIR = path.join(outputRoot, "src", "data");
const VTT_DIR = path.join(outputRoot, "public", "captions", "academy", "s1");
const VTT_SNAPSHOT_DIR = path.join(root, "content-source", "academy", "vtt-snapshots");

// Rendered English video lengths (seconds), measured on the 720p web encodes.
const DURATIONS = [96.3, 95.9, 125.5, 138.2, 136.6, 126.2, 150.6, 141.7, 155.4, 126.2, 126.9, 166.8, 136.2, 124.8, 126.1, 141.5, 126.9, 125.0, 140.8, 141.7, 124.9, 156.3, 141.1, 182.4];
const UI_LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"];
// Locales with a localized lesson (dialogue + study notes). Others render the English lesson in their UI language.
const CONTENT_LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ru", "tr", "id", "vi", "ar"];
const L10N_KEY = (locale) => (locale === "zh-Hans" ? "zh" : locale);
const NEUTRAL_LOCALES = NEUTRAL_CTA_LOCALES;
const SPEAKERS = { sam: "sam", nexubo: "nexubo", narrator: "narrator" };
// Episodes grouped into the three parts shown on the hub.
const PART_OF = (ep) => (ep <= 12 ? 1 : ep <= 17 ? 2 : 3);

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const pad = (n) => String(n).padStart(2, "0");
const norm = (text) => String(text || "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
const NUMBER = /\d[\d,.]*(?:[\s\u00a0\u202f]?%)?/g;
const numbersOf = (text) => (String(text || "").match(NUMBER) || []).map((n) => n.replace(/[\s\u00a0\u202f]/g, "").replace(/[.,]$/, "")).sort().join("|");

const problems = [];
const warn = (message) => problems.push(message);
// Reviewed corrections of localized lesson lines (numbers written as digits exactly as in English), keyed by English text.
// content-source/academy/l10n-fixes/<locale>.json: { "<English text>": "<localized text>" }. A listed line is trusted
// as reviewed (e.g. "P2P" keeps its digit although the English line has none).
const FIXES_DIR = path.join(root, "content-source", "academy", "l10n-fixes");
const FIXES = loadFixDirectory(FIXES_DIR);
// Caption tracks are generated from the same dialogue, but they can intentionally lag a lesson-text review until captions
// receive their own QA. Keep those overrides separate so rebuilding does not rewrite already-published subtitle bytes.
const VTT_FIXES_DIR = path.join(root, "content-source", "academy", "vtt-fixes");
const VTT_FIXES = loadFixDirectory(VTT_FIXES_DIR);
const SHELL_OVERRIDES_FILE = path.join(root, "content-source", "academy", "shell-overrides.json");
const SHELL_OVERRIDES = existsSync(SHELL_OVERRIDES_FILE) ? readJson(SHELL_OVERRIDES_FILE) : {};
function loadFixDirectory(dir) {
  return Object.fromEntries(CONTENT_LOCALES_FOR_FIXES().map((locale) => {
    const file = path.join(dir, `${locale}.json`);
    return [locale, existsSync(file) ? Object.fromEntries(Object.entries(JSON.parse(readFileSync(file, "utf8"))).map(([en, text]) => [norm(en), text])) : {}];
  }));
}
function CONTENT_LOCALES_FOR_FIXES() { return ["zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ru", "tr", "id", "vi", "ar"]; }
const mismatches = [];
function localizedText(locale, english, value, where) {
  const fixed = FIXES[locale]?.[norm(english)];
  const text = fixed || value;
  if (!fixed && text && locale !== "en" && numbersOf(text) !== numbersOf(english)) {
    mismatches.push({ locale, where, en: norm(english), text: norm(text) });
    warn(`${where} ${locale}: numbers differ from English (${numbersOf(text)} vs ${numbersOf(english)})`);
  }
  return text;
}
function fixedText(fixes, locale, english, value) {
  return fixes[locale]?.[norm(english)] || value;
}

function loadSources(ep) {
  const id = `E${pad(ep)}`;
  const v3 = readJson(path.join(V3_DIR, `${id}.json`));
  const l10n = readJson(path.join(L10N_DIR, `${id}.json`));
  const timing = readJson(path.join(TIMING_DIR, `${id}.json`));
  if (v3.slug !== l10n.slug || v3.slug !== timing.slug) throw new Error(`${id}: slug mismatch between sources`);
  return { id, v3, l10n, timing };
}

// English dialogue -> localized dialogue, from every localized line of the script.
function dialogueMap(l10n) {
  const map = new Map();
  for (const shot of l10n.shots || []) for (const line of shot.lines || []) if (line.en) map.set(norm(line.en), line);
  if (l10n.end_hook?.en) map.set(norm(l10n.end_hook.en), l10n.end_hook);
  return map;
}

// Timed dialogue of the rendered video: every scene of the production schedule, absolute seconds.
function timedLines(timing) {
  const { scenes } = schedule(timing);
  const out = [];
  for (const scene of scenes) {
    const lines = scene.kind === "shot" ? scene.shot.lines || [] : scene.lines || [];
    for (const line of lines) {
      out.push({ kind: scene.kind, speaker: SPEAKERS[line.speaker] || "narrator", start: scene.start + line.start, end: scene.start + line.end, text: line.text, words: line.words?.en || null });
    }
  }
  return { lines: out, duration: scenes.reduce((sum, scene) => Math.max(sum, scene.start + scene.duration), 0) };
}

function conversionAllowed(locale, venues) {
  if (NEUTRAL_LOCALES.has(locale)) return false;
  return venues.some((slug) => isPartnerPromotableIn(slug, { locale }));
}

function localizedField(v3, l10n, field, locale) {
  if (locale === "en") return v3[`${field}_en`];
  if (locale === "zh-Hans") return v3[`${field}_zh`];
  return l10n[`${field}_${locale}`];
}

function transcriptFor(locale, { v3, l10n, timed, map, id }) {
  const venues = v3.conversion_card?.partners || [];
  const keepConversion = conversionAllowed(locale, venues);
  const rows = [];
  for (const line of timed.lines) {
    if (line.kind === "conversion" && !keepConversion) continue;
    const en = line.text.en;
    let text;
    if (locale === "en") text = en;
    else if (locale === "zh-Hans") text = line.text["zh-Hans"];
    else {
      const source = map.get(norm(en));
      text = source?.[L10N_KEY(locale)];
      if (!text) { warn(`${id} ${locale}: no localized line for "${en.slice(0, 60)}"`); text = null; }
    }
    if (!text) continue;
    const fixedLessonText = Boolean(FIXES[locale]?.[norm(en)]);
    const lessonText = localizedText(locale, en, text, `${id} dialogue`);
    const captionText = fixedText(VTT_FIXES, locale, en, fixedText(FIXES, locale, en, text));
    rows.push({
      t: Math.round(line.start * 100) / 100,
      e: Math.round(line.end * 100) / 100,
      who: line.speaker,
      text: fixedLessonText ? String(lessonText).trim() : norm(lessonText),
      captionText: norm(captionText),
      words: locale === "en" ? line.words : null,
    });
  }
  return rows;
}

// WebVTT: one cue per sentence group (<= 84 characters, CJK <= 36), timed by word timings in English and by
// character share inside the aligned line elsewhere.
const isCjk = (locale) => ["zh-Hans", "zh-Hant", "ja", "ko"].includes(locale);
function splitCaption(text, locale) {
  const limit = isCjk(locale) ? 36 : 84;
  const sentences = String(text).match(/[^.!?。！？]+[.!?。！？]*["”’)]?\s*/g) || [text];
  const chunks = [];
  for (const sentence of sentences.map((s) => s.trim()).filter(Boolean)) {
    if ([...sentence].length <= limit) { chunks.push(sentence); continue; }
    const parts = sentence.split(isCjk(locale) ? /(?<=[，、；])/ : /(?<=[,;:])\s+/);
    let current = "";
    for (const part of parts) {
      if (current && [...current].length + [...part].length + 1 > limit) { chunks.push(current.trim()); current = ""; }
      current += (current && !isCjk(locale) ? " " : "") + part;
    }
    if (current.trim()) chunks.push(current.trim());
  }
  const merged = [];
  for (const chunk of chunks) {
    const last = merged[merged.length - 1];
    if (last && [...last].length + [...chunk].length + 1 <= limit) merged[merged.length - 1] = `${last}${isCjk(locale) ? "" : " "}${chunk}`;
    else merged.push(chunk);
  }
  return merged;
}
const vttTime = (seconds) => {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000), r = ms % 1000;
  return `${pad(h)}:${pad(m)}:${pad(s)}.${String(r).padStart(3, "0")}`;
};
const vttText = (text) => String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
function buildVtt(rows, locale) {
  const cues = [];
  for (const row of rows) {
    const chunks = splitCaption(row.captionText || row.text, locale);
    const total = chunks.reduce((sum, chunk) => sum + [...chunk].length, 0) || 1;
    let cursor = row.t;
    const span = Math.max(0.5, row.e - row.t);
    chunks.forEach((chunk, index) => {
      let end = cursor + span * ([...chunk].length / total);
      if (index === chunks.length - 1) end = row.e;
      cues.push(`${vttTime(cursor)} --> ${vttTime(end)}\n${vttText(chunk)}`);
      cursor = end;
    });
  }
  return `WEBVTT\n\n${cues.join("\n\n")}\n`;
}

function studyNotes(locale) {
  const file = path.join(NOTES_DIR, `s1-study-notes.${locale}.json`);
  if (!existsSync(file)) { warn(`${locale}: study notes missing (${file})`); return null; }
  return readJson(file).episodes;
}

function uiCopy(locale) {
  const file = path.join(NOTES_DIR, "ui", `${locale}.json`);
  if (!existsSync(file)) { warn(`${locale}: UI strings missing, English used`); return null; }
  return readJson(file);
}

const js = (value) => JSON.stringify(value, null, 1).replace(/\n\s*/g, " ");
const HEADER = "// Generated by scripts/build-academy-data.mjs from the Season 1 production sources. Do not edit by hand.\n";

function main() {
  const sources = Array.from({ length: 24 }, (_, i) => loadSources(i + 1));
  const englishNotes = studyNotes("en");
  const episodes = sources.map(({ v3, timing, id }, index) => {
    const ep = index + 1;
    const timed = timedLines(timing);
    const measured = DURATIONS[index];
    if (Math.abs(timed.duration - measured) > 2) warn(`${id}: schedule ${timed.duration.toFixed(1)} s vs encode ${measured} s`);
    const pageCta = v3.page_cta || {};
    return {
      ep, id, slug: v3.slug, part: PART_OF(ep), duration: measured,
      conversion: Boolean(v3.conversion_card),
      venues: v3.conversion_card?.partners || [],
      next: pageCta.kind === "telegram" ? "telegram" : "compare",
    };
  });

  const content = {};
  for (const locale of CONTENT_LOCALES) {
    const notes = studyNotes(locale) || englishNotes;
    content[locale] = sources.map(({ v3, l10n, timing, id }, index) => {
      const timed = timedLines(timing);
      const map = dialogueMap(l10n);
      const transcript = transcriptFor(locale, { v3, l10n, timed, map, id });
      const note = notes?.[String(index + 1)] || englishNotes[String(index + 1)];
      const ex = v3.exercise || {};
      const exercise = {
        task: locale === "en" ? ex.task_en : locale === "zh-Hans" ? ex.task_zh : l10n.exercise?.[`task_${locale}`],
        answer: locale === "en" ? ex.answer_en : locale === "zh-Hans" ? ex.answer_zh : l10n.exercise?.[`answer_${locale}`],
      };
      const fields = { title: [localizedField(v3, l10n, "title", locale), v3.title_en], goal: [localizedField(v3, l10n, "goal", locale), v3.goal_en], task: [exercise.task, ex.task_en], answer: [exercise.answer, ex.answer_en] };
      for (const [field, [value, english]] of Object.entries(fields)) {
        if (!value) { warn(`${id} ${locale}: missing ${field}`); continue; }
        const fixedField = Boolean(FIXES[locale]?.[norm(english)]);
        const text = localizedText(locale, english, value, `${id} ${field}`);
        fields[field][0] = fixedField ? String(text).trim() : norm(text);
      }
      const title = fields.title[0], goal = fields.goal[0];
      exercise.task = fields.task[0]; exercise.answer = fields.answer[0];
      return {
        ep: index + 1,
        title, goal,
        task: exercise.task, answer: exercise.answer,
        takeaways: note.takeaways, quiz: note.quiz,
        transcript: transcript.map(({ t, who, text }) => ({ t, who, text })),
        _rows: transcript,
      };
    });
  }


  // Per-locale content modules + subtitle tracks
  mkdirSync(DATA_DIR, { recursive: true });
  for (const file of readdirSync(DATA_DIR)) if (/^academy-content-[a-z]{2}(?:-[a-z]+)?\.js$/i.test(file) && file !== "academy-content-all.js") rmSync(path.join(DATA_DIR, file));
  rmSync(VTT_DIR, { recursive: true, force: true });
  mkdirSync(VTT_DIR, { recursive: true });
  for (const locale of CONTENT_LOCALES) {
    const lessons = content[locale].map(({ _rows, ...lesson }) => lesson);
    writeFileSync(path.join(DATA_DIR, `academy-content-${locale.toLowerCase()}.js`), `${HEADER}export const ACADEMY_CONTENT = Object.freeze(${JSON.stringify({ locale, lessons })});\n`);
    content[locale].forEach((lesson, index) => {
      const vttName = `E${pad(index + 1)}.${locale}.vtt`;
      const vttSnapshot = path.join(VTT_SNAPSHOT_DIR, vttName);
      writeFileSync(path.join(VTT_DIR, vttName), existsSync(vttSnapshot) ? readFileSync(vttSnapshot, "utf8") : buildVtt(lesson._rows, locale));
    });
  }
  const ident = (locale) => locale.replace(/-/g, "_");
  writeFileSync(path.join(DATA_DIR, "academy-content-all.js"), `${HEADER}// Server-only (Worker, SEO head, tests): every locale's lesson content. The browser loads one locale at a time.\n`
    + CONTENT_LOCALES.map((locale) => `import { ACADEMY_CONTENT as ${ident(locale)} } from "./academy-content-${locale.toLowerCase()}.js";`).join("\n")
    + `\n\nexport const ACADEMY_CONTENT_BY_LOCALE = Object.freeze({ ${CONTENT_LOCALES.map((locale) => `"${locale}": ${ident(locale)}`).join(", ")} });\n`);

  // UI strings
  const english = uiCopy("en");
  const copy = {};
  for (const locale of UI_LOCALES) {
    const strings = uiCopy(locale) || english;
    for (const key of Object.keys(english)) if (!(key in strings)) { warn(`${locale}: UI key ${key} missing, English used`); strings[key] = english[key]; }
    copy[locale] = strings;
  }
  writeFileSync(path.join(DATA_DIR, "academy-copy.js"), `${HEADER}// UI strings of NexuAlpha Academy (hub, lesson pages, home teaser, navigation) for every UI locale.\n`
    + `export const ACADEMY_COPY = Object.freeze(${JSON.stringify(copy, null, 1)});\n`);

  // Episode index + the few shell strings (header/footer label, home teaser) every page needs.
  const SHELL_KEYS = ["nav", "brand", "homeTitle", "homeBody", "homeCta"];
  const shell = Object.fromEntries(UI_LOCALES.map((locale) => [locale, {
    ...Object.fromEntries(SHELL_KEYS.map((key) => [key, copy[locale][key]])),
    ...(SHELL_OVERRIDES[locale] || {}),
  }]));
  writeFileSync(path.join(DATA_DIR, "academy-season1.js"), `${HEADER}// Episode index of NexuAlpha Academy Season 1. Lesson content lives in academy-content-<locale>.js.\n`
    + `export const ACADEMY_CONTENT_LOCALES = Object.freeze(${JSON.stringify(CONTENT_LOCALES)});\n`
    + `export const ACADEMY_EPISODES = Object.freeze([\n${episodes.map((e) => `  ${js(e)},`).join("\n")}\n]);\n`
    + `// Header/footer label and home teaser (shell chunk: keep small).\n`
    + `export const ACADEMY_SHELL_COPY = Object.freeze(${JSON.stringify(shell)});\n`);

  if (process.env.ACADEMY_DUMP_MISMATCHES) writeFileSync(process.env.ACADEMY_DUMP_MISMATCHES, `${JSON.stringify(mismatches, null, 1)}\n`);
  for (const message of problems) console.warn(`[academy] ${message}`);
  console.log(`Academy data: ${episodes.length} episodes, ${CONTENT_LOCALES.length} content locales, ${UI_LOCALES.length} UI locales, ${problems.length} warnings`);
}

main();

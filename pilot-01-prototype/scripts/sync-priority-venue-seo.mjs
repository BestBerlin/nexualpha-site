#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { priorityVenueAnswers } from "../src/data/priority-venue-answers.js";
import { compareDirectAnswerSlugs, compareSeoOverrideFromDirectAnswer } from "../src/data/compare-direct-answers.js";
import { venueSeoOverrideFor } from "../src/data/seo-injection.js";
import { COMPARE_FAQ_LOCALES, compareFaqSchemaEntries } from "../src/data/compare-faq-locales.js";

// The deployment Worker must stay standalone. Generate this small scoped
// projection from the same data as the visible UI, instead of editing answers
// independently in two runtimes. --check never writes.
const file = new URL("../worker/index.js", import.meta.url);
const start = "// BEGIN GENERATED PRIORITY VENUE SEO";
const end = "// END GENERATED PRIORITY VENUE SEO";
const priorityVenueSeoLocales = ["en", "zh-Hans", "zh-Hant"];
const priorityCompareSeoLocales = ["en", "zh-Hans", "zh-Hant", "ja", "ko", "tr", "pt-BR"];
const projection = Object.fromEntries(Object.keys(priorityVenueAnswers).map((slug) => [
  slug,
  Object.fromEntries(priorityVenueSeoLocales.map((locale) => [locale, venueSeoOverrideFor(slug, locale)])),
]));
const compareProjection = Object.fromEntries(compareDirectAnswerSlugs.map((slug) => [
  slug,
  Object.fromEntries(priorityCompareSeoLocales.map((locale) => [locale, compareSeoOverrideFromDirectAnswer(slug, locale)])),
]));
const compareFaqProjection = Object.fromEntries(Object.keys(COMPARE_FAQ_LOCALES).map((locale) => [
  locale,
  compareFaqSchemaEntries(locale, { nameA: "{nameA}", nameB: "{nameB}" }),
]));
const block = `${start}\nconst PRIORITY_VENUE_SEO = ${JSON.stringify(projection, null, 2)};\nconst PRIORITY_COMPARE_SEO = ${JSON.stringify(compareProjection, null, 2)};\nconst WORKER_COMPARE_FAQ = ${JSON.stringify(compareFaqProjection, null, 2)};\n${end}`;
const source = readFileSync(file, "utf8");
const from = source.indexOf(start);
const to = source.indexOf(end);
if (from < 0 || to < from || source.indexOf(start, from + 1) !== -1) throw new Error("Priority SEO projection markers missing or ambiguous");
const updated = source.slice(0, from) + block + source.slice(to + end.length);
if (process.argv.includes("--check")) {
  if (source !== updated) throw new Error("Priority venue Worker projection is stale; run node scripts/sync-priority-venue-seo.mjs");
  console.log("Priority venue Worker projection matches visible answer data");
} else if (source !== updated) {
  writeFileSync(file, updated);
  console.log("Updated standalone priority venue SEO projection");
}

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  ACADEMY_CONTENT_LOCALES as FULL_CONTENT_LOCALES,
  ACADEMY_EPISODES,
  ACADEMY_SHELL_COPY as FULL_SHELL_COPY,
  academyContentLocale as fullContentLocale,
  academyContentModulePath as fullContentModulePath,
  academyShellCopy as fullShellCopy,
  parseAcademyPath as fullParseAcademyPath,
} from "../src/data/academy.js";
import {
  ACADEMY_CONTENT_LOCALES,
  ACADEMY_INDEX_LOCALES,
  ACADEMY_SHELL_COPY,
  academyContentLocale,
  academyContentModulePath,
  academyShellCopy,
} from "../src/data/academy-shell.js";
import { ACADEMY_EPISODE_SLUGS, isAcademyPath, parseAcademyPath } from "../src/data/academy-path.js";

test("academy shell helper preserves shell values without importing full season data", async () => {
  assert.deepEqual(ACADEMY_CONTENT_LOCALES, FULL_CONTENT_LOCALES);
  assert.deepEqual(ACADEMY_INDEX_LOCALES, FULL_CONTENT_LOCALES);
  assert.deepEqual(ACADEMY_SHELL_COPY, FULL_SHELL_COPY);
  for (const locale of ["en", "zh-Hans", "zh-Hant", "it", "uk", "unknown", "zh-TW"]) {
    assert.deepEqual(academyShellCopy(locale), fullShellCopy(locale), locale);
    assert.equal(academyContentLocale(locale), fullContentLocale(locale), locale);
    assert.equal(academyContentModulePath(locale), fullContentModulePath(locale), locale);
  }
  const source = await readFile(new URL("../src/data/academy-shell.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /academy-season1|academy\.js/, "shell imports must not pull the full academy episode index");
});

test("academy path helper preserves route validation with a slug-only index", async () => {
  assert.deepEqual(ACADEMY_EPISODE_SLUGS, ACADEMY_EPISODES.map((episode) => episode.slug));
  assert.deepEqual(parseAcademyPath("/academy"), { kind: "hub" });
  for (const episode of ACADEMY_EPISODES) {
    const light = parseAcademyPath(`/academy/${episode.slug}`);
    const full = fullParseAcademyPath(`/academy/${episode.slug}`);
    assert.equal(light.kind, full.kind, episode.slug);
    assert.equal(light.episode.slug, full.episode.slug, episode.slug);
    assert.equal(isAcademyPath(`/academy/${episode.slug}`), true, episode.slug);
  }
  assert.deepEqual(parseAcademyPath("/academy/nope"), { kind: "missing" });
  assert.equal(isAcademyPath("/academy/nope"), false);
  assert.equal(parseAcademyPath("/news"), null);
  const source = await readFile(new URL("../src/data/academy-path.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /academy-season1|academy\.js/, "path recognition must not pull the full academy episode index");
  assert.doesNotMatch(source, /duration|conversion|venues|next/, "path recognition keeps only route slugs");
});

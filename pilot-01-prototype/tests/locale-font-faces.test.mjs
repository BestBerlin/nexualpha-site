// Script fonts per page locale + versioned immutable font URLs (perf 2026-10-22: English pages downloaded 161 KB of CJK
// fonts for the language switcher; /zh-hans fetched SC, TC and JP; fonts were cached for one day only).
import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import worker from "../worker/index.js";
import { FONT_VERSIONS, fontUrl, localeFontFaceCss, localeFontKey } from "../src/data/locale-font-faces.js";

const read = (path) => readFileSync(new URL(path, import.meta.url));

test("every font version is the first 12 hex of the file's SHA-256", () => {
  for (const [file, version] of Object.entries(FONT_VERSIONS)) {
    assert.equal(createHash("sha256").update(read(`../public/fonts/${file}`)).digest("hex").slice(0, 12), version, file);
  }
});

test("the global stylesheet declares no CJK, Korean or Arabic face", () => {
  const css = read("../src/font-faces.css").toString("utf8");
  assert.doesNotMatch(css, /Pilot Noto (?:SC|TC|JP|KR|Arabic)";[^}]*src:/);
  assert.doesNotMatch(css, /(?:zh-Hans|zh-Hant|ja|ko|ar)-400\.woff2/);
  assert.match(css, new RegExp(fontUrl("latin-400-700.woff2").replace(/[.?]/g, "\\$&")));
});

test("each locale gets only its own script face", () => {
  assert.equal(localeFontFaceCss("en"), "");
  assert.equal(localeFontFaceCss("pt-BR"), "");
  assert.equal(localeFontKey("zh-CN"), "zh-Hans");
  assert.equal(localeFontKey("zh-TW"), "zh-Hant");
  for (const [locale, file] of [["zh-Hans", "zh-Hans-400"], ["zh-Hant", "zh-Hant-400"], ["ja", "ja-400"], ["ko", "ko-400"], ["ar", "ar-400"], ["ur", "ar-400"]]) {
    const css = localeFontFaceCss(locale);
    assert.equal((css.match(/@font-face/g) || []).length, 1, locale);
    assert.match(css, new RegExp(`/fonts/${file}\\.woff2\\?v=[0-9a-f]{12}`), locale);
  }
});

const shell = read("../index.html").toString("utf8");
const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
  if (pathname === "/index.html") return new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } });
  return new Response("missing", { status: 404 });
} };
const page = async (pathname) => (await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: assets })).text();

test("SSR head inlines the page locale's face only", async () => {
  const en = await page("/about");
  assert.doesNotMatch(en, /data-nexualpha-locale-fonts/);
  assert.doesNotMatch(en, /(?:zh-Hans|zh-Hant|ja|ko|ar)-400\.woff2/);
  const zh = await page("/zh-hans/about");
  assert.match(zh, /<style data-nexualpha-locale-fonts="zh-Hans">@font-face\{font-family:"Pilot Noto SC"/);
  assert.doesNotMatch(zh, /(?:zh-Hant|ja|ko|ar)-400\.woff2/);
  const ja = await page("/ja/about");
  assert.match(ja, /data-nexualpha-locale-fonts="ja"/);
  assert.doesNotMatch(ja, /zh-Hans-400\.woff2/);
});

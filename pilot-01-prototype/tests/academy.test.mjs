// NexuAlpha Academy (2026-10-12): /academy hub and /academy/<slug> lessons. Request-time SSR through the Worker with the
// component the browser hydrates, Course / VideoObject / LearningResource JSON-LD, the academy sitemap, sign-up gating
// (partner registry + geo policy, neutral locales get no sign-up), the owner's no-fine-print rule, and /starter -> /academy.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import test from "node:test";
import { fileURLToPath } from "node:url";
import worker from "../worker/index.js";
import { ACADEMY_EPISODES, ACADEMY_INDEX_LOCALES, academyEpisodePath, academySignupVenues, parseAcademyPath } from "../src/data/academy.js";
import { ACADEMY_CONTENT_BY_LOCALE } from "../src/data/academy-content-all.js";
import { ACADEMY_COPY } from "../src/data/academy-copy.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { publicCtaForVenue } from "../src/data/source-bound-cta.js";
import { titleBudgetForLocale } from "../src/data/meta-description.js";
import { buildAcademySitemap, buildSplitSitemaps, routeInventory } from "../scripts/generate-prerender-manifest.mjs";
import { createSsrHarness, SHELL_HTML, hydrateInJsdom, hydrationErrors, h1Texts } from "./helpers/ssr-hydration-harness.mjs";
// Shared neutral list (ru, ar, zh-Hant, ur, uk and, since 2026-10-13, vi): src/data/locale-policy.js.
import { NEUTRAL_CTA_LOCALE_LIST } from "../src/data/locale-policy.js";

const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
  if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  return new Response("missing", { status: 404 });
} };
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
const env = () => ({ ASSETS: assets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) });
const fetchPage = (path, e = env()) => worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: "text/html" } }), e);
const ldJson = (html) => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => { const v = JSON.parse(m[1]); return Array.isArray(v) ? v : (v["@graph"] || [v]); });
const mainHtml = (html) => (html.match(/<main\b[\s\S]*<\/main>/) || [""])[0];
const E05 = ACADEMY_EPISODES[4];
const PROJECT_ROOT = new URL("../", import.meta.url);

// Defensive fine print the owner removed from the academy (2026-10-12): it may live in the footer and legal pages only.
const FINE_PRINT = [
  /not (?:investment|financial) advice/i, /teaching assumption/i, /not (?:a )?live price/i, /real platform rate/i,
  /pays our commission/i, /affiliate commission/i, /availability depends/i, /terms (?:and conditions )?apply/i, /partner link ·/i,
  /非投资建议|不构成投资建议|教学假设|非实时|佣金由交易所支付|合作推广链接 ·|是否可用取决于/, /非投資建議|教學假設|傭金/,
];

test("episode index: 24 lessons, unique slugs, every content locale has every lesson", () => {
  assert.equal(ACADEMY_EPISODES.length, 24);
  assert.equal(new Set(ACADEMY_EPISODES.map((e) => e.slug)).size, 24);
  assert.deepEqual(ACADEMY_EPISODES.filter((e) => e.conversion).map((e) => e.ep), [4, 5, 7, 12, 13, 24]);
  for (const locale of ACADEMY_INDEX_LOCALES) {
    const lessons = ACADEMY_CONTENT_BY_LOCALE[locale].lessons;
    assert.equal(lessons.length, 24, locale);
    for (const lesson of lessons) {
      assert.ok(lesson.title && lesson.goal && lesson.task && lesson.answer, `${locale} E${lesson.ep}: text fields`);
      assert.ok(lesson.takeaways.length >= 3 && lesson.takeaways.length <= 5, `${locale} E${lesson.ep}: 3-5 takeaways`);
      assert.ok(lesson.quiz.options[lesson.quiz.answer], `${locale} E${lesson.ep}: quiz answer exists`);
      assert.ok(lesson.transcript.length >= 5, `${locale} E${lesson.ep}: transcript`);
    }
  }
  assert.equal(parseAcademyPath("/academy").kind, "hub");
  assert.equal(parseAcademyPath("/academy/kyc-who-gets-your-id").episode.ep, 5);
  assert.equal(parseAcademyPath("/academy/nope").kind, "missing");
});

test("numbers and codes in localized lessons match English", () => {
  // Separators are compared out (QA 2026-10-13: "0,002" in pt-BR/de/fr is the same figure as "0.002").
  const numbers = (text) => (String(text).match(/\d(?:[\d,.]|[\u202f\u00a0](?=\d))*(?:\s?%)?/g) || []).map((n) => n.replace(/[.,]$/, "").replace(/[\s.,\u202f\u00a0]/g, "")).sort().join("|");
  const en = ACADEMY_CONTENT_BY_LOCALE.en.lessons;
  for (const locale of ACADEMY_INDEX_LOCALES.filter((l) => l !== "en")) {
    ACADEMY_CONTENT_BY_LOCALE[locale].lessons.forEach((lesson, i) => {
      assert.equal(numbers(lesson.answer), numbers(en[i].answer), `${locale} E${i + 1} answer`);
      lesson.takeaways.forEach((item, k) => assert.equal(numbers(item), numbers(en[i].takeaways[k]), `${locale} E${i + 1} takeaway ${k}`));
      assert.equal(lesson.quiz.answer, en[i].quiz.answer, `${locale} E${i + 1} quiz answer index`);
    });
  }
});

test("academy data generator reproduces checked-in generated files", () => {
  const out = mkdtempSync(`${tmpdir()}/nxa-academy-build-`);
  const dataFiles = [
    "src/data/academy-season1.js",
    "src/data/academy-copy.js",
    "src/data/academy-content-all.js",
    ...readdirSync(new URL("src/data", PROJECT_ROOT)).filter((file) => /^academy-content-[a-z]{2}(?:-[a-z]+)?\.js$/i.test(file)).map((file) => `src/data/${file}`),
    ...readdirSync(new URL("public/captions/academy/s1", PROJECT_ROOT)).filter((file) => file.endsWith(".vtt")).map((file) => `public/captions/academy/s1/${file}`),
  ].sort();
  try {
    execFileSync(process.execPath, ["scripts/build-academy-data.mjs", "--output-root", out], { cwd: fileURLToPath(PROJECT_ROOT), encoding: "utf8" });
    const generatedFiles = [
      ...readdirSync(`${out}/src/data`).map((file) => `src/data/${file}`),
      ...readdirSync(`${out}/public/captions/academy/s1`).map((file) => `public/captions/academy/s1/${file}`),
    ].sort();
    assert.deepEqual(generatedFiles, dataFiles, "academy regeneration added or removed output files");
    for (const file of dataFiles) {
      assert.equal(readFileSync(new URL(file, `file://${out}/`), "utf8"), readFileSync(new URL(file, PROJECT_ROOT), "utf8"), `${file} changed after academy regeneration`);
    }
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("/academy and a lesson render at request time in en and zh-hans with the hydrated component, canonical and hreflang", async () => {
  for (const [path, locale, h1] of [
    ["/academy", "en", ACADEMY_COPY.en.series],
    ["/zh-hans/academy", "zh-Hans", ACADEMY_COPY["zh-Hans"].series],
    [`/academy/${E05.slug}`, "en", ACADEMY_CONTENT_BY_LOCALE.en.lessons[4].title],
    [`/zh-hans/academy/${E05.slug}`, "zh-Hans", ACADEMY_CONTENT_BY_LOCALE["zh-Hans"].lessons[4].title],
  ]) {
    const response = await fetchPage(path);
    const html = await response.text();
    assert.equal(response.status, 200, path);
    assert.deepEqual(h1Texts(html), [h1], `${path}: one h1`);
    assert.match(html, /<main class="nxa /, `${path}: academy body in the SSR HTML`);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://nexualpha.com${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), `${path}: self canonical`);
    assert.match(html, /<meta name="robots" content="index,follow"/, `${path}: indexable`);
    assert.equal((html.match(/rel="alternate" hreflang=/g) || []).length, ACADEMY_INDEX_LOCALES.length + 1, `${path}: hreflang set`);
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/)[1];
    assert.ok(title.length <= titleBudgetForLocale(locale), `${path}: title budget (${title})`);
  }
  const lesson = await (await fetchPage(`/zh-hans/academy/${E05.slug}`)).text();
  for (const row of ACADEMY_CONTENT_BY_LOCALE["zh-Hans"].lessons[4].transcript.slice(0, 3)) assert.ok(lesson.includes(row.text.slice(0, 12)), "transcript in SSR");
  for (const item of ACADEMY_CONTENT_BY_LOCALE["zh-Hans"].lessons[4].takeaways) assert.ok(lesson.includes(item), "takeaways in SSR");
  assert.match(lesson, /src="\/captions\/academy\/s1\/E05\.zh-Hans\.vtt"/, "localized subtitle track");
  assert.match(lesson, /<video[^>]*preload="metadata"/);
  assert.doesNotMatch(lesson, /<video[^>]*autoplay/i);
  assert.match(lesson, /media="\(max-width: 599px\) and \(orientation: portrait\)"[^>]*|E05-portrait\.mp4/);
});

test("JSON-LD: Course on the hub, VideoObject + LearningResource on a lesson", async () => {
  const hub = ldJson(await (await fetchPage("/academy")).text());
  const course = hub.find((item) => item["@type"] === "Course");
  assert.ok(course && course.provider?.name === "NexuAlpha" && course.hasPart.length === 24, "Course with 24 parts");
  const lesson = ldJson(await (await fetchPage(`/academy/${E05.slug}`)).text());
  const video = lesson.find((item) => item["@type"] === "VideoObject");
  assert.equal(video.contentUrl, "https://nexualpha.com/media/academy/s1/en/E05-landscape.mp4");
  assert.deepEqual(video.thumbnailUrl, ["https://nexualpha.com/media/academy/s1/en/E05-landscape.jpg", "https://nexualpha.com/media/academy/s1/en/E05-portrait.jpg"]);
  assert.equal(video.uploadDate, "2026-10-12T12:00:00+08:00");
  assert.equal(video.duration, "PT2M17S");
  assert.equal(video.inLanguage, "en");
  assert.ok(video.transcript.length > 400, "transcript text");
  const resource = lesson.find((item) => item["@type"] === "LearningResource");
  assert.equal(resource.position, 5);
  assert.equal(resource.associatedMedia["@id"], video["@id"]);
  assert.ok(lesson.some((item) => item["@type"] === "BreadcrumbList"));
  // The client head helper agrees with the Worker.
  const seo = computeRouteSeo({ url: `/zh-hans/academy/${E05.slug}` });
  assert.equal(seo.status, 200);
  assert.equal(seo.schemas.find((item) => item["@type"] === "VideoObject").inLanguage, "zh-Hans");
  assert.equal(seo.schemas.find((item) => item["@type"] === "LearningResource").inLanguage, "zh-Hans");
});

test("locales without a localized lesson are noindex; unknown lessons are 404", async () => {
  const it = await (await fetchPage("/it/academy")).text();
  assert.match(it, /<meta name="robots" content="noindex,follow"/);
  assert.match(it, /<main class="nxa /);
  const missing = await fetchPage("/academy/not-a-lesson");
  assert.equal(missing.status, 404);
});

test("sitemap-academy.xml lists the hub and 24 lessons in every indexable locale and is in the sitemap index", async () => {
  const academy = buildAcademySitemap();
  assert.equal(academy.count, 25 * ACADEMY_INDEX_LOCALES.length);
  assert.match(academy.xml, /<loc>https:\/\/nexualpha\.com\/zh-hans\/academy\/kyc-who-gets-your-id<\/loc>/);
  assert.match(academy.xml, /hreflang="x-default" href="https:\/\/nexualpha\.com\/academy"/);
  assert.doesNotMatch(academy.xml, /\/it\/academy|\/ur\/academy|\/uk-ua\/academy/);
  const split = buildSplitSitemaps(routeInventory([]), []);
  assert.match(split.index, /<loc>https:\/\/nexualpha\.com\/sitemap-academy\.xml<\/loc>/);
  assert.equal(split.academy.count, academy.count, "the build writes the same academy sitemap");
  // Same hreflang set as the page head.
  const head = await (await fetchPage(`/ja/academy/${E05.slug}`)).text();
  const headAlternates = [...head.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => `${m[1]} ${m[2]}`).sort();
  const entry = academy.xml.split("<url>").find((block) => block.includes(`<loc>https://nexualpha.com/ja/academy/${E05.slug}</loc>`));
  const siteAlternates = [...entry.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => `${m[1]} ${m[2]}`).sort();
  assert.deepEqual(siteAlternates, headAlternates);
  assert.match(await readFile(new URL("../public/robots.txt", import.meta.url), "utf8"), /Sitemap: https:\/\/nexualpha\.com\/sitemap-academy\.xml/);
});

test("sign-up CTA: conversion lessons only, registry codes via /go/, geo-gated, none in neutral locales", async () => {
  assert.deepEqual(academySignupVenues(E05, { locale: "en" }), ["okx"]);
  assert.deepEqual(academySignupVenues(ACADEMY_EPISODES[6], { locale: "en" }), ["bitget"]);
  assert.deepEqual(academySignupVenues(ACADEMY_EPISODES[6], { locale: "tr" }), ["okx"], "Bitget is not promoted in Türkiye; OKX instead");
  assert.deepEqual(academySignupVenues(ACADEMY_EPISODES[11], { locale: "en" }), ["okx", "bitget", "binance"]);
  for (const locale of NEUTRAL_CTA_LOCALE_LIST) assert.deepEqual(academySignupVenues(E05, { locale }), [], locale);
  assert.deepEqual(academySignupVenues(ACADEMY_EPISODES[0], { locale: "en" }), [], "non-conversion lesson");

  const bitget = mainHtml(await (await fetchPage(`/academy/${ACADEMY_EPISODES[6].slug}`)).text());
  assert.match(bitget, /href="\/go\/bitget\?src=academy-e07"/);
  assert.match(bitget, /Bitget\.com/);
  assert.ok(bitget.includes(publicCtaForVenue("bitget", "en").inviteCode), "code from the partner registry");
  assert.doesNotMatch(bitget, /bitget\.cafe/, "the raw partner domain is never shown");
  for (const path of [`/ru/academy/${E05.slug}`, `/zh-hant/academy/${E05.slug}`, `/ar/academy/${E05.slug}`]) {
    const html = mainHtml(await (await fetchPage(path)).text());
    assert.doesNotMatch(html, /href="\/go\/|data-offer-venue|nexu888|11350287/, `${path}: no sign-up in a neutral locale`);
    assert.match(html, /data-academy-next="(?:compare|telegram)"/, `${path}: soft next step`);
  }
  const soft = mainHtml(await (await fetchPage(`/academy/${ACADEMY_EPISODES[1].slug}`)).text());
  assert.match(soft, /data-academy-next="telegram"[\s\S]*https:\/\/t\.me\/NexuAlphaGlobal/);
  assert.doesNotMatch(soft, /href="\/go\//);
});

test("no fine print, commission notes or 'not investment advice' on academy pages (footer excluded)", async () => {
  const paths = ["/academy", "/zh-hans/academy", ...ACADEMY_EPISODES.map(academyEpisodePath)];
  for (const locale of ["en", "zh-Hans"]) {
    for (const path of paths) {
      const html = await harness.render(`https://nexualpha.com${path}?locale=${locale}`, {});
      const main = mainHtml(html);
      for (const pattern of FINE_PRINT) assert.doesNotMatch(main, pattern, `${path} (${locale}): ${pattern}`);
    }
  }
  for (const locale of ACADEMY_INDEX_LOCALES) {
    const blob = JSON.stringify(ACADEMY_CONTENT_BY_LOCALE[locale]) + JSON.stringify(ACADEMY_COPY[locale]);
    for (const pattern of FINE_PRINT) assert.doesNotMatch(blob, pattern, `${locale} content: ${pattern}`);
  }
});

test("hydration of the hub and a lesson has no mismatch (en, zh-hans, ar)", async () => {
  for (const path of ["/academy", `/zh-hans/academy/${E05.slug}`, `/ar/academy/${E05.slug}`]) {
    const html = await (await fetchPage(path)).text();
    const { errors } = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${path}`);
    assert.deepEqual(hydrationErrors(errors), [], `${path}: ${errors.join("\n")}`);
  }
});

test("header, footer and home link the academy; /starter 301s to the localized academy", async () => {
  const home = await harness.render("https://nexualpha.com/?locale=zh-Hans", {});
  assert.match(home, /class="h7-in h7-academy"[\s\S]*href="\/zh-hans\/academy"/, "home teaser");
  assert.match(home, /<nav class="nx-nav"[\s\S]*?href="\/zh-hans\/academy"[^>]*>学院</, "primary nav item");
  assert.match(home, /<footer[\s\S]*href="\/zh-hans\/academy"/, "footer link");
  const en = await worker.fetch(new Request("https://nexualpha.com/starter?market=JP"), env());
  assert.equal(en.status, 301);
  assert.equal(en.headers.get("location"), "https://nexualpha.com/academy?market=JP");
  const zh = await worker.fetch(new Request("https://nexualpha.com/zh-hans/starter"), env());
  assert.equal(zh.headers.get("location"), "https://nexualpha.com/zh-hans/academy");
});

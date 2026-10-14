import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { localizedPath } from "../src/data/locale-routing.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const builtEntry = path.join(projectRoot, "dist/ssr/entry-server.js");
const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"];
const textOfMain = (html) => new JSDOM(html).window.document.querySelector("main")?.textContent.replace(/\s+/g, " ").trim() || "";
const PUBLIC_DEBUG_COPY = /repo slice|Not in repo|app rating|app-rating data file|repository|debug/i;
const LABEL_SELECTORS = [
  ".v3-data-label",
  ".v3-profile-data-label",
  ".scorecard th",
  ".scorecard button",
  "[class*=scorecard] th",
  "[class*=scorecard] button",
  "[class*=scorecard] [class*=label]",
  "[class*=scorecard] [class*=title]",
  "[class*=decision] [class*=label]",
  "[class*=profile] [class*=label]",
];
const SCRIPT_BANS = Object.freeze({
  en: /[\u0400-\u04FF\u0600-\u06FF\u0750-\u077F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/u,
  es: /[\u0400-\u04FF\u0600-\u06FF\u0750-\u077F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/u,
  "pt-BR": /[\u0400-\u04FF\u0600-\u06FF\u0750-\u077F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/u,
  fr: /[\u0400-\u04FF\u0600-\u06FF\u0750-\u077F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/u,
  de: /[\u0400-\u04FF\u0600-\u06FF\u0750-\u077F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/u,
  it: /[\u0400-\u04FF\u0600-\u06FF\u0750-\u077F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/u,
  tr: /[\u0400-\u04FF\u0600-\u06FF\u0750-\u077F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/u,
  id: /[\u0400-\u04FF\u0600-\u06FF\u0750-\u077F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/u,
  vi: /[\u0400-\u04FF\u0600-\u06FF\u0750-\u077F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/u,
  ar: /[\u0400-\u04FF\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/u,
  ur: /[\u0400-\u04FF\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/u,
  ru: /[\u0600-\u06FF\u0750-\u077F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/u,
  uk: /[\u0600-\u06FF\u0750-\u077F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/u,
  "zh-Hans": /[\u0400-\u04FF\u0600-\u06FF\u0750-\u077F\uAC00-\uD7AF]/u,
  "zh-Hant": /[\u0400-\u04FF\u0600-\u06FF\u0750-\u077F\uAC00-\uD7AF]/u,
  ja: /[\u0400-\u04FF\u0600-\u06FF\u0750-\u077F\uAC00-\uD7AF]/u,
  ko: /[\u0400-\u04FF\u0600-\u06FF\u0750-\u077F\u3040-\u30FF]/u,
});


function labelTexts(html) {
  const document = new JSDOM(html).window.document;
  const seen = new Set();
  return LABEL_SELECTORS.flatMap((selector) => [...document.querySelectorAll(selector)])
    .map((element) => element.textContent.replace(/\s+/g, " ").trim())
    .filter((text) => text && text.length <= 120 && !seen.has(text) && seen.add(text));
}

async function builtRender(url) {
  await access(builtEntry);
  const { render } = await import(`${builtEntry}?audit=${Date.now()}-${Math.random()}`);
  assert.equal(typeof render, "function");
  return render(url);
}

test("built SSR public compare and exchange pages do not expose repo/debug copy", async (t) => {
  for (const route of ["/compare/binance-vs-okx", "/exchanges/okx"]) {
    for (const locale of locales) {
      await t.test(`${locale}${route}`, async () => {
        const html = await builtRender(`https://nexualpha.com${localizedPath(route, locale)}`);
        const main = textOfMain(html);
        assert.ok(main, "built route should render main content");
        assert.doesNotMatch(main, PUBLIC_DEBUG_COPY);
      });
    }
  }
});

test("built SSR English compare page keeps locale labels and punctuation in English", async () => {
  const html = await builtRender("https://nexualpha.com/compare/binance-vs-okx");
  const main = textOfMain(html);
  assert.doesNotMatch(main, /Модель доступу|。|：/);
  assert.doesNotMatch(main, PUBLIC_DEBUG_COPY);
});

test("built SSR English venue FAQ keeps fallback punctuation in English after rebuild", async () => {
  const html = await builtRender("https://nexualpha.com/exchanges/okx");
  const main = textOfMain(html);
  assert.doesNotMatch(main, /Модель доступу/);
  assert.doesNotMatch(main, /。|：/);
  assert.doesNotMatch(main, PUBLIC_DEBUG_COPY);
});

test("built SSR exchange pages do not leak the Ukrainian access label into other locales", async () => {
  for (const locale of locales.filter((item) => item !== "uk")) {
    const html = await builtRender(`https://nexualpha.com${localizedPath("/exchanges/okx", locale)}`);
    const main = textOfMain(html);
    assert.doesNotMatch(main, /Модель доступу/, `${locale}: Ukrainian access label leaked`);
  }
});

test("built SSR UI labels stay inside the locale script family", async () => {
  for (const route of ["/compare/binance-vs-okx", "/exchanges/okx"]) {
    for (const locale of locales) {
      const html = await builtRender(`https://nexualpha.com${localizedPath(route, locale)}`);
      const banned = SCRIPT_BANS[locale];
      for (const label of labelTexts(html)) {
        assert.doesNotMatch(label, banned, `${locale}${route}: wrong-script label ${JSON.stringify(label)}`);
      }
    }
  }
});


test("the built home carries the official notice hydration snapshot; no hero B prerender while the experiment is retired", async () => {
  const home = JSON.parse(await readFile(path.join(projectRoot, "dist/client/prerender/en/home.json"), "utf8"));
  assert.ok(Array.isArray(home.officialAnnouncements?.items));
  await assert.rejects(readFile(path.join(projectRoot, "dist/client/prerender/en/home-hero-b.json"), "utf8"), { code: "ENOENT" });
});

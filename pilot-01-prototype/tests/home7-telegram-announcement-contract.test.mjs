import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { H7_COPY } from "../src/components/v7/home7-copy.js";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("home announcement subtext is removed while as-of copy remains available", () => {
  for (const [locale, copy] of Object.entries(H7_COPY)) {
    assert.equal(copy.inSub, "", `${locale} announcement subtext removed`);
    assert.match(copy.inAsOf("2026-10-12 10:00"), /2026-10-12 10:00/, `${locale} as-of timestamp remains renderable`);
  }
});

test("home announcement open label is detail-page wording, not original-post wording", () => {
  const banned = /official post|original|原文|سرکاری پوسٹ|офіційна публікація|официальная публикация|publicación oficial|post oficial|publication officielle|offizieller beitrag|公式の原文|공식 원문|المنشور الرسمي|resmî gönderi|postingan resmi|bài đăng chính thức|post ufficiale/i;
  for (const [locale, copy] of Object.entries(H7_COPY)) {
    assert.ok(copy.inOpen.trim(), `${locale} inOpen non-empty`);
    assert.doesNotMatch(copy.inOpen, banned, `${locale} inOpen uses detail wording`);
  }
});

test("home Intel block skips the empty subtext and marks event chips as hot", async () => {
  const source = await read("src/components/v7/home7-below.jsx");
  assert.match(source, /\{t\.inSub \? <p>\{t\.inSub\}<\/p> : null\}/, "empty announcement subtext is not rendered");
  assert.match(source, /data-hot=\{i\.category === "event" \? "true" : undefined\}/, "event category chip carries data-hot");
  assert.match(source, /className="h7-it" href=\{updateHref\(i, locale, \{ market \}\)\}/, "announcement titles link to internal detail pages");
  assert.match(source, /className="h7-ln" href=\{updateHref\(item, locale, \{ market \}\)\}/, "announcement modal action links to internal details");
  assert.doesNotMatch(source, /className="h7-it" href=\{i\.url\}/, "announcement titles never link straight to the exchange");
});

test("Telegram block CSS has the requested responsive grid and bottom-aligned action contract", async () => {
  const css = await read("src/styles/v7/home7.src.css");
  assert.match(css, /\.h7-tg \.h7-ih\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/, "desktop header aligns title and subtitle in balanced columns");
  assert.match(css, /@media\(max-width:1023px\)\{\@ \.h7-tg \.h7-ih\{grid-template-columns:minmax\(0,1fr\)/, "subtitle wraps under the heading below 1024px");
  assert.match(css, /@media\(min-width:700px\)\{\@ \.h7-tg-list\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}\}/, "tablet grid is 2 columns");
  assert.match(css, /@media\(min-width:1100px\)\{\@ \.h7-tg-list\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)\}\}/, "wide grid is 4 columns");
  assert.match(css, /\.h7-tg-card\{[^}]*grid-template-rows:auto 1fr auto[^}]*width:100%[^}]*min-height:156px/, "cards share height and reserve a bottom action row");
  assert.match(css, /\.h7-tg-go\{[^}]*grid-column:2[^}]*align-self:end/, "Telegram action aligns to the card bottom");
});

test("activity/event hot chip reuses the nav shimmer names and respects reduced motion", async () => {
  const css = await read("src/styles/v7/home7.src.css");
  assert.match(css, /\.h7-ic-event\[data-hot\][^}]*animation:nx-gold-sweep 2\.6s linear 2,nx-chip-glow 2\.6s ease-out 2/, "event chip uses the same gold sweep/glow keyframes, two cycles then static (owner 2026-10-15: no idle work)");
  assert.match(css, /\.h7-ic-event\[data-hot\]::after[^}]*animation:nx-twinkle 1\.3s ease-in-out 4/, "event chip includes the same twinkle treatment, finite");
  assert.ok(css.includes("@media(prefers-reduced-motion:reduce){@ .h7-tg-card{transition:none}@ .h7-ic-event[data-hot],@ .h7-ic-event[data-hot]::after{animation:none}}"), "event hot motion is disabled for reduced-motion users");
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PARTNER_EMBED_LOCALIZED_LOCALES, partnerEmbedCopy } from "../src/data/partner-embed-copy.js";

test("priority partner embed routes have complete localized copy", () => {
  for (const locale of ["zh-Hans", "zh-Hant", "ja", "ko", "tr", "es", "pt-BR"]) {
    const copy = partnerEmbedCopy(locale);
    assert.ok(PARTNER_EMBED_LOCALIZED_LOCALES.includes(locale));
    assert.equal(copy.cards.length, 3, `${locale} cards`);
    for (const key of ["home", "breadcrumb", "badge", "heroTitle", "heroAccent", "heroDesc", "why", "select", "narrow", "wide", "publisher", "publisherHelp", "preview", "copy", "telegramTitle", "telegramBody", "telegramButton"]) {
      assert.ok(copy[key]?.trim(), `${locale}.${key}`);
    }
    assert.notEqual(copy.heroTitle, partnerEmbedCopy("en").heroTitle, `${locale} hero should not fall back to English`);
  }
});

test("partner embed copy describes the current iframe boundary without unsupported claims", () => {
  const combined = PARTNER_EMBED_LOCALIZED_LOCALES
    .map((locale) => JSON.stringify(partnerEmbedCopy(locale)))
    .join("\n");
  assert.doesNotMatch(combined, /24-exchange|real-time sync|proof-of-reserves solvency audit|WordPress shortcode|React component|attribute directly|top-tier settlement|50K\+|高比例分成|顶格返佣/i);
  assert.match(JSON.stringify(partnerEmbedCopy("en")), /iframe/i);
  assert.match(JSON.stringify(partnerEmbedCopy("zh-Hans")), /另行确认/);
});

test("locale aliases use the intended copy pack", () => {
  assert.equal(partnerEmbedCopy("pt-br").heroTitle, partnerEmbedCopy("pt-BR").heroTitle);
  assert.equal(partnerEmbedCopy("ja-JP").heroTitle, partnerEmbedCopy("ja").heroTitle);
  assert.equal(partnerEmbedCopy("unknown").heroTitle, partnerEmbedCopy("en").heroTitle);
});

test("partner embed controls preserve visible keyboard focus and reduced motion", async () => {
  const css = await readFile(new URL("../src/components/v3/partner-embed-guide.css", import.meta.url), "utf8");
  assert.match(css, /\.guide-type-btn:focus-visible/);
  assert.match(css, /\.guide-tg-btn:focus-visible/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(css, /transition:\s*all\b/);
});

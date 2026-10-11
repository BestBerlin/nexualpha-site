import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { compareDirectAnswerFor } from "../src/data/compare-direct-answers.js";
import { compareFaqEntries, compareFaqBadge, compareStickyAria } from "../src/data/compare-faq-locales.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const uiLocales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"];
const nonEnglishLocales = uiLocales.filter((locale) => locale !== "en");
const oldEnglishFallback = /Which has lower fees|Which is better for beginner crypto traders|Solvency & Liquidation|Dual-Exchange Strategies|Check Both Official Terms|For newcomers, ease-of-use|Welcome Packs|Running accounts on both may be possible|Show \d+ more questions|Compare sticky bar/;

async function renderComparePage(locale, selected = ["binance", "okx"]) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-compare-faq-locales-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { CompareDeepPage } from "../../src/components/v3/V3Pages.jsx";
      import { venueDatabase } from "../../src/data/venue-database.js";
      import { v3Copy } from "../../src/data/v3-product.js";
      const locale = ${JSON.stringify(locale)};
      const selected = ${JSON.stringify(selected)};
      const html = renderToStaticMarkup(React.createElement(CompareDeepPage, {
        copy: { ...v3Copy(locale), common: { dimension: "Dimension" }, assetCapabilities: { none: "None" } },
        locale,
        selected,
        venues: Object.values(venueDatabase),
        updates: [],
        market: "unknown",
        product: "unknown",
      }));
      console.log(html);
    `);

    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await access(esbuildBin);
    execFileSync(esbuildBin, [
      entryPath,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${bundlePath}`,
      "--loader:.css=empty",
      "--loader:.svg=text",
      "--loader:.webp=file",
      "--log-level=warning",
    ], { cwd: projectRoot, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });

    const bundle = await readFile(bundlePath, "utf8");
    return execFileSync("node", ["-"], { cwd: projectRoot, input: bundle, encoding: "utf8", maxBuffer: 12 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

const decodeHtml = (value) => value
  .replace(/&amp;/g, "&")
  .replace(/&#x27;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">");

const faqBlock = (html) => {
  const decoded = decodeHtml(html);
  const start = decoded.indexOf('id="compare-faq"');
  const end = decoded.indexOf('</section>', start);
  assert.ok(start > 0 && end > start, "FAQ section should render");
  return decoded.slice(start, end);
};

const faqSchemaEntries = (locale, slug = "binance-vs-okx") => {
  const seo = computeRouteSeo({ url: `/compare/${slug}?locale=${encodeURIComponent(locale)}` });
  const faq = seo.schemas.find((schema) => schema?.["@type"] === "FAQPage")
    || seo.schemas.find((schema) => schema?.subjectOf?.["@type"] === "FAQPage")?.subjectOf;
  assert.ok(faq, `${locale}/${slug}: compare FAQ schema should exist`);
  return faq.mainEntity.map((entry) => ({
    q: entry.name,
    a: entry.acceptedAnswer?.text || "",
  }));
};

const assertSchemaContainsEntries = (schemaEntries, expectedEntries, label) => {
  const schemaByQuestion = new Map(schemaEntries.map((entry) => [entry.q, entry.a]));
  assert.equal(schemaByQuestion.size, expectedEntries.length, `${label}: schema should expose the same number of FAQ entries`);
  for (const entry of expectedEntries) {
    assert.equal(schemaByQuestion.get(entry.q), entry.a, `${label}: schema answer should match visible/localized FAQ for ${entry.q}`);
  }
};

test("compare FAQ, sticky aria and badge stay aligned for support-owner and generic compare locales", async () => {
  const genericSelected = ["uniswap", "jupiter"];
  const genericSlug = "uniswap-vs-jupiter";
  for (const locale of uiLocales) {
    const html = decodeHtml(await renderComparePage(locale, genericSelected));
    const block = faqBlock(html);
    const supportOwnerAnswer = compareDirectAnswerFor(genericSlug, locale);
    const entries = supportOwnerAnswer
      ? [
          { q: supportOwnerAnswer.seoQuestion, a: supportOwnerAnswer.body },
          ...supportOwnerAnswer.faq.map(([q, a]) => ({ q, a })),
        ]
      : compareFaqEntries(locale, { nameA: "Uniswap", nameB: "Jupiter" });
    const schemaEntries = faqSchemaEntries(locale, genericSlug);

    assert.ok(html.includes(`aria-label="${compareStickyAria(locale)}"`), `${locale}: sticky aria should be localized`);

    for (const entry of entries) {
      assert.ok(block.includes(entry.q), `${locale}: localized FAQ question should render: ${entry.q}`);
      assert.ok(block.includes(entry.a), `${locale}: localized FAQ answer should render: ${entry.q}`);
    }
    assertSchemaContainsEntries(schemaEntries, entries, `${locale}/${genericSlug}`);

    assert.ok(!schemaEntries.some((entry) => entry.q === "How should I compare Binance and OKX before choosing an exchange?"), `${locale}: Uniswap/Jupiter compare schema should not expose stale Binance priority FAQ`);

    if (locale.startsWith("zh")) {
      assert.ok(html.includes(`>${compareFaqBadge(locale)}<`), `${locale}: Chinese curated badge should be localized`);
      assert.doesNotMatch(html, />COMPARE</, `${locale}: Chinese curated badge must not fall back to COMPARE`);
    }

    if (locale !== "en") {
      assert.doesNotMatch(block, oldEnglishFallback, `${locale}: FAQ and expand control should not fall back to old English copy`);
    }
  }
});

test("Bybit vs Bitget priority FAQ is visible and matches schema for en and Chinese locales", async () => {
  for (const locale of ["en", "zh-Hans", "zh-Hant"]) {
    const html = decodeHtml(await renderComparePage(locale, ["bybit", "bitget"]));
    const block = faqBlock(html);
    const priority = compareDirectAnswerFor("bybit-vs-bitget", locale);
    assert.ok(priority, `${locale}: priority answer should exist`);
    const entries = [
      { q: priority.seoQuestion, a: priority.body },
      ...priority.faq.map(([q, a]) => ({ q, a })),
    ];
    const genericProductQuestion = compareFaqEntries(locale, { nameA: "Bybit", nameB: "Bitget" })[1].q;
    const schemaEntries = faqSchemaEntries(locale, "bybit-vs-bitget");

    for (const entry of entries) {
      assert.ok(block.includes(entry.q), `${locale}: priority FAQ question should render: ${entry.q}`);
      assert.ok(block.includes(entry.a), `${locale}: priority FAQ answer should render: ${entry.q}`);
    }
    assert.ok(!block.includes(genericProductQuestion), `${locale}: priority compare should replace generic visible FAQ`);
    assertSchemaContainsEntries(schemaEntries, entries, `${locale}/bybit-vs-bitget`);
    assert.ok(!schemaEntries.some((entry) => entry.q === genericProductQuestion), `${locale}: priority compare schema should replace generic FAQ`);
  }
});

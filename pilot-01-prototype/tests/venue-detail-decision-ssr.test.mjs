import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"];
const slugs = ["binance", "okx", "bybit", "bitget", "backpack"];


const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#x27;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

test("core venue detail first screen renders reviewed decisions across all UI locales", async () => {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-venue-detail-decision-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { VenueDetailPage } from "../../src/components/v3/VenueDetailPageStatic.jsx";
      import { venueDatabase } from "../../src/data/venue-database.js";
      import { decisionForVenue } from "../../src/data/venue-decision-content.js";
      import { sanitizePublicText } from "../../src/data/public-copy-sanitizer.js";

      const pageCopy = {
        common: { dimension: "Dimension" },
        assetCapabilities: { none: "Pending source review" },
      };
      const venues = Object.values(venueDatabase);
      const pages = [];
      for (const locale of ${JSON.stringify(locales)}) {
        for (const slug of ${JSON.stringify(slugs)}) {
          const html = renderToStaticMarkup(React.createElement(VenueDetailPage, {
            copy: pageCopy,
            locale,
            venue: venueDatabase[slug],
            venues,
            updates: [],
            market: "unknown",
            product: "unknown",
          }));
          const start = html.indexOf('class="v3-venue-hero"');
          const end = html.indexOf('class="v3-profile-cost-conditions"', start);
          if (start < 0 || end < 0) throw new Error('Missing first-screen detail slice: ' + slug + '/' + locale);
          const decision = decisionForVenue(slug, locale);
          pages.push({
            locale,
            slug,
            firstScreen: html.slice(start, end),
            decision: {
              ...decision,
              fit: sanitizePublicText(decision.fit),
              why: sanitizePublicText(decision.why),
              avoid: sanitizePublicText(decision.avoid),
            },
          });
        }
      }
      console.log(JSON.stringify(pages));
    `);

    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [
      entryPath,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${bundlePath}`,
      "--loader:.css=empty",
      "--log-level=warning",
    ], { cwd: projectRoot, stdio: "pipe" });

    const pages = JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }));
    assert.equal(pages.length, locales.length * slugs.length);
    for (const { locale, slug, firstScreen, decision } of pages) {
      assert.equal(decision.contentLocale, locale, `${slug}/${locale}: no English decision fallback`);
      assert.equal(decision.editorialReviewed, true, `${slug}/${locale}: reviewed editorial gate`);
      const hasPriorityAnswer = firstScreen.includes(`data-priority-answer="${slug}"`);
      if (hasPriorityAnswer) {
        assert.match(firstScreen, /v3-venue-direct-answer__reviewed/, `${slug}/${locale}: priority answer review date`);
        assert.match(firstScreen, /v3-venue-direct-answer__sources/, `${slug}/${locale}: priority answer source package`);
      } else {
        assert.match(firstScreen, /v3-venue-summary/, `${slug}/${locale}: hero summary present`);
        const expectedHero = decision.fit.replace(/^Choose\s+[^ ]+\s+when\s+/i, "");
        assert.ok(firstScreen.includes(escapeHtml(expectedHero)), `${slug}/${locale}: reviewed hero summary`);
        for (const field of ["fit", "why", "avoid"]) {
          assert.ok(firstScreen.includes(escapeHtml(decision[field])), `${slug}/${locale}: visible ${field}`);
        }
      }
      assert.doesNotMatch(firstScreen, /Verify regional eligibility, product scope and official fees first|Only source-linked facts with a review date are publishable|Regional restrictions, account eligibility and campaign terms still need official verification/);
      if (locale !== "en") {
        assert.doesNotMatch(firstScreen, /Invitation summary|The primary route stays in the hero card and mobile sticky bar/, `${slug}/${locale}: invitation summary does not fall back to English`);
      }
      if (locale === "ar") assert.match(firstScreen, /dir="rtl"/);
      if (locale === "pt-BR") assert.match(firstScreen, /Resumo do convite/);
      if (locale === "ja") assert.match(firstScreen, /紹介情報の概要/);
      if (locale === "ko") assert.match(firstScreen, /추천 정보 요약/);
      if (locale === "tr") assert.match(firstScreen, /Referans özeti/);
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

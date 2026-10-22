import { budgetTitle, titleBudgetForLocale } from '../src/data/meta-description.js';
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { compareDirectAnswerFor, compareSeoOverrideFromDirectAnswer } from "../src/data/compare-direct-answers.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { priorityVenueAnswerFor } from "../src/data/priority-venue-answers.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const forbiddenPublicCopy = /private commission|invite code|referral link|nexu888|11350287|LUCKX|CANDY007|INS898|1836370407|luckybitcoin|risk-free|guaranteed/i;
const forbiddenEditorialPromise = /private commission|risk-free|guaranteed/i;

function faqOf(seo) {
  return seo.schemas.find((schema) => schema["@type"] === "FAQPage")
    || seo.schemas.find((schema) => schema.subjectOf?.["@type"] === "FAQPage")?.subjectOf;
}

async function renderTopicPage(locale, slug) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-week4-locale-depth-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { TopicGuidePage } from "../../src/components/v3/TopicGuidePage.jsx";
      console.log(renderToStaticMarkup(React.createElement(TopicGuidePage, {
        slug: ${JSON.stringify(slug)},
        locale: ${JSON.stringify(locale)},
        market: "unknown",
        product: "unknown",
        venues: [],
      })));
    `);

    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    const bundlePath=path.join(tempDir,"bundle.cjs");
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

    return execFileSync(process.execPath, [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 12 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("German Binance vs OKX comparison graduates from generic FAQ to source-backed direct answer", () => {
  const answer = compareDirectAnswerFor("binance-vs-okx", "de");
  const override = compareSeoOverrideFromDirectAnswer("binance-vs-okx", "de");
  const seo = computeRouteSeo({ url: "/de/compare/binance-vs-okx", locale: "de" });
  const faq = faqOf(seo);
  const serialized = JSON.stringify({ answer, override, seo });

  assert.equal(answer.locale, "de");
  assert.equal(answer.reviewedAt, "2026-09-22");
  assert.match(answer.title, /Binance vs OKX/);
  assert.match(answer.body, /Gebührentabelle/);
  assert.ok(answer.productTypes.length >= 3);
  assert.ok(answer.checks.length >= 3);
  assert.ok(answer.searchDemand.length >= 3);
  assert.ok(answer.nextSteps.length >= 3);
  assert.ok(answer.sourceLinks.length >= 4);
  assert.ok(answer.internalLinks.some(([, href]) => href === "/exchanges/binance"));
  assert.ok(answer.internalLinks.some(([, href]) => href === "/topics/derivatives"));
  assert.equal(override.completeFaq, true);
  assert.equal(seo.title, budgetTitle(answer.seoTitle,titleBudgetForLocale("de")));
  assert.match(JSON.stringify(faq), /Wie sollte ich Binance und OKX vor der Registrierung vergleichen/);
  assert.match(JSON.stringify(faq), /Gebühren sind wichtig/);
  assert.doesNotMatch(JSON.stringify(answer), forbiddenPublicCopy);
  assert.doesNotMatch(JSON.stringify(seo), forbiddenEditorialPromise);
});

test("Spanish Binance venue answer projects visible source package and related links into SEO", () => {
  const answer = priorityVenueAnswerFor("binance", "es");
  const seo = computeRouteSeo({ url: "/es/exchanges/binance", locale: "es" });
  const faq = faqOf(seo);
  const page = seo.schemas.find((schema) => schema["@type"] === "WebPage");
  const serialized = JSON.stringify({ answer, seo });

  assert.equal(answer.locale, "es");
  assert.match(answer.title, /Binance en español/);
  assert.ok(answer.sources.length >= 5);
  assert.ok(answer.internalLinks.some(([, href]) => href === "/compare/binance-vs-okx"));
  assert.ok(answer.internalLinks.some(([, href]) => href === "/topics/derivatives"));
  assert.match(JSON.stringify(faq), /Qué debo revisar antes de abrir Binance/);
  assert.match(JSON.stringify(faq), /La tabla pública es el punto de partida/);
  assert.match(JSON.stringify(page.relatedLink), /\/compare\/binance-vs-okx/);
  assert.match(JSON.stringify(page.relatedLink), /\/topics\/derivatives/);
  assert.match(JSON.stringify(page), /https:\/\/www\.binance\.com\/en\/fee\/trading/);
  assert.doesNotMatch(JSON.stringify(answer), forbiddenPublicCopy);
  assert.doesNotMatch(JSON.stringify(seo), forbiddenEditorialPromise);
});

test("Arabic derivatives topic renders localized visible FAQ and matching FAQ schema", async () => {
  const seo = computeRouteSeo({ url: "/ar/topics/derivatives", locale: "ar" });
  const faq = faqOf(seo);
  const html = await renderTopicPage("ar", "derivatives");
  const schemaQuestions = faq.mainEntity.map((entry) => entry.name);
  const schemaAnswers = faq.mainEntity.map((entry) => entry.acceptedAnswer.text);

  assert.equal(seo.locale, "ar");
  assert.equal(faq.inLanguage, "ar");
  assert.match(html, /كيف تختار منصة عقود دائمة للعملات الرقمية/);
  assert.match(html, /ما منصة العقود الدائمة للعملات الرقمية؟/);
  assert.match(html, /لا\. قارن رسوم maker\/taker/);
  assert.ok(schemaQuestions.includes("ما منصة العقود الدائمة للعملات الرقمية وكيف أقارنها؟"));
  assert.match(schemaAnswers.join("\n"), /منصة العقود الدائمة تتيح تداول عقود بلا تاريخ انتهاء ثابت/);
  assert.match(schemaAnswers.join("\n"), /المقارنة العامة تضيق مسار القرار/);
  assert.doesNotMatch(`${html}\n${JSON.stringify(seo.schemas)}`, forbiddenEditorialPromise);
});

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const forbiddenMemePromise = /100x|100\s*倍|百倍|20%\s*(?:fee\s*)?(?:rebate|cashback|off)|20%\s*返佣|返佣\s*20%|zero[- ]fee|zero[- ]maker|0\.00%|private commission|guaranteed signup|guaranteed approval|mexc-nexualpha|gate-nexualpha|mexc\.com\/register|gate\.io\/signup/i;
const rawReferralUrl = /href="https:\/\/(?:www\.)?(?:mexc\.com\/register|gate\.io\/signup)[^"]*"/i;

async function renderArabicMemeTopic() {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-r15-meme-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { TopicGuidePage } from "../../src/components/v3/TopicGuidePage.jsx";
      const html = renderToStaticMarkup(React.createElement(TopicGuidePage, {
        slug: "meme-coins",
        locale: "ar",
        market: "unknown",
        product: "spot",
        venues: [],
      }));
      console.log(html);
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
      "--loader:.svg=text",
      "--loader:.webp=file",
      "--log-level=warning",
    ], { cwd: projectRoot, stdio: "pipe" });

    return execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 12 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function faqSchema(metadata) {
  const graph = Array.isArray(metadata.schema)
    ? metadata.schema
    : Array.isArray(metadata.schema?.["@graph"])
      ? metadata.schema["@graph"]
      : [metadata.schema].filter(Boolean);
  return graph.find((entry) => entry?.["@type"] === "FAQPage");
}

test("R15 Arabic meme topic renders source-bound visible copy without stale commercial promises", async () => {
  const html = await renderArabicMemeTopic();

  assert.match(html, /فحص العقد والسيولة/);
  assert.match(html, /تفويض المحفظة/);
  assert.match(html, /مسار الخروج/);
  assert.match(html, /لا توجد نسبة انزلاق آمنة/);
  assert.doesNotMatch(html, forbiddenMemePromise);
  assert.doesNotMatch(html, rawReferralUrl);
});

test("R15 Arabic meme topic client SEO exposes answer-first FAQ without unsafe claims", () => {
  const seo = computeRouteSeo({ url: "/ar/topics/meme-coins" });
  const faq = faqSchema({ schema: seo.schemas });
  const serialized = JSON.stringify({ title: seo.title, description: seo.description, schemas: seo.schemas });

  assert.match(seo.title, /العقد والسيولة ومسار الخروج/);
  assert.match(seo.description, /تفويض المحفظة/);
  assert.ok(faq, "Arabic meme topic FAQPage schema should be present");
  assert.ok(faq.mainEntity.length >= 4, "direct answer plus FAQ entries should be present");
  assert.match(JSON.stringify(faq), /ما أول شيء يجب فحصه/);
  assert.doesNotMatch(serialized, forbiddenMemePromise);
});

test("R15 Arabic meme topic Worker metadata matches client answer boundaries", async () => {
  const metadata = await routeMetadata(new URL("https://nexualpha.com/ar/topics/meme-coins"), {});
  const faq = faqSchema(metadata);
  const serialized = JSON.stringify(metadata);

  assert.equal(metadata.status, 200);
  assert.match(metadata.title, /العقد والسيولة ومسار الخروج/);
  assert.match(metadata.description, /تفويض المحفظة/);
  assert.ok(faq, "Worker Arabic meme topic FAQPage schema should be present");
  assert.match(JSON.stringify(faq), /أي مسار تسجيل أو منفعة مستخدم يجب أن يأتي من سجل NexuAlpha التجاري المحمي/);
  assert.doesNotMatch(serialized, forbiddenMemePromise);
});

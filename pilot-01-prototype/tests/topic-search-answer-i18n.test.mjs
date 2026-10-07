import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));

test("derivatives answer-first rail is native in Japanese Korean and Turkish SSR", () => {
  const dir = mkdtempSync(path.join(root, "tests/.tmp-topic-answer-i18n-"));
  try {
    const entry = path.join(dir, "entry.jsx");
    writeFileSync(entry, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { TopicGuidePage } from "../../src/components/v3/TopicGuidePage.jsx";
      import { neutralVenueCatalog } from "../../src/data/market-command.js";
      const locales = ["ja", "ko", "tr"];
      console.log(JSON.stringify(Object.fromEntries(locales.map((locale) => [locale, renderToStaticMarkup(<TopicGuidePage slug="derivatives" locale={locale} market="unknown" product="perpetuals" venues={neutralVenueCatalog} />)]))));
    `);
    execFileSync(path.join(root, "node_modules/.bin/esbuild"), [entry, "--bundle", "--platform=node", "--format=cjs", `--outfile=${dir}/bundle.cjs`, "--loader:.css=empty", "--log-level=error"]);
    const pages = JSON.parse(execFileSync(process.execPath, [path.join(dir, "bundle.cjs")], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }));
    const blocked = /How to choose a crypto perpetual platform|Start by separating the route|Use this page as the canonical checklist/;
    for (const locale of ["ja", "ko", "tr"]) {
      const directAnswer = pages[locale].match(/<aside[^>]*data-aeo-direct-answer="true"[\s\S]*?<\/aside>/)?.[0] || "";
      assert.ok(directAnswer, `${locale}: direct answer exists`);
      assert.doesNotMatch(directAnswer, blocked, `${locale}: no English search-answer fallback`);
    }
    assert.match(pages.ja, /無期限契約プラットフォームを選ぶ手順/);
    assert.match(pages.ko, /무기한 계약 플랫폼을 고르는 방법/);
    assert.match(pages.tr, /perpetual platformu nasıl seçilir/i);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const readinessCss = await readFile(new URL("../src/components/v3/VenueReadinessChecklist.css", import.meta.url), "utf8");

async function renderVenueDetail({ locale = "en", slug = "bitget" } = {}) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-venue-readiness-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { VenueDetailPage } from "../../src/components/v3/V3Pages.jsx";
      import { venueDatabase } from "../../src/data/venue-database.js";

      const pageCopy = {
        common: { dimension: "Dimension" },
        assetCapabilities: { none: "Pending source review" },
      };
      const venues = Object.values(venueDatabase);
      const html = renderToStaticMarkup(React.createElement(VenueDetailPage, {
        copy: pageCopy,
        locale: ${JSON.stringify(locale)},
        venue: venueDatabase[${JSON.stringify(slug)}],
        venues,
        updates: [],
        market: "BR",
        product: "spot",
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
      "--log-level=warning",
    ], { cwd: projectRoot, stdio: "pipe" });

    return execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("venue detail renders a four-point readiness checklist before the compact route summary", async () => {
  const html = await renderVenueDetail();
  const checklistStart = html.indexOf('data-venue-readiness-checklist="bitget"');
  const summaryStart = html.indexOf('class="v3-rebate-route-summary"');
  const handoffStart = html.indexOf('id="registration-path"');

  assert.ok(checklistStart > 0, "readiness checklist is rendered");
  assert.ok(summaryStart > checklistStart, "readiness checklist is before the compact invite summary");
  assert.ok(handoffStart > checklistStart, "original readiness precedes the main registration handoff");
  assert.ok(summaryStart > handoffStart, "main registration precedes the secondary route summary");
  assert.equal((html.match(/id="registration-path"/g) || []).length, 1, "registration handoff ID remains unique");

  const checklistEnd = html.indexOf("</section>", checklistStart);
  const checklistHtml = html.slice(checklistStart, checklistEnd);
  assert.match(checklistHtml, /<details class="venue-readiness__disclosure"><summary class="venue-readiness__summary">/);
  assert.doesNotMatch(checklistHtml, /<details[^>]*\bopen(?:=|\s|>)/);
  assert.match(checklistHtml, /<h2 id="venue-readiness-bitget">[^<]+<\/h2><strong>0\/4[^<]*<\/strong>/);
  for (const item of ["region", "kyc", "funding", "products"]) {
    assert.match(checklistHtml, new RegExp(`data-readiness-item="${item}"`), `${item} readiness item`);
  }
  assert.match(readinessCss, /\.venue-readiness__summary \{[\s\S]*min-block-size: 44px;/);
  assert.match(readinessCss, /\.venue-readiness__summary:focus-visible/);
  assert.doesNotMatch(readinessCss, /data-mobile-expanded/);
  assert.doesNotMatch(checklistHtml, /data-cta-kind="registration"/);
  assert.doesNotMatch(checklistHtml, /KYC approved|registered|commission|rebate earned/i);
});

test("venue readiness checklist restores only bounded readiness state from URL and session storage", async () => {
  const source = await readFile(new URL("../src/components/v3/VenueReadinessChecklist.jsx", import.meta.url), "utf8");

  assert.match(source, /const READINESS_ITEMS = \[/);
  assert.match(source, /new URLSearchParams\(window\.location\.search\)/);
  assert.match(source, /sessionStorage\.getItem/);
  assert.match(source, /sessionStorage\.setItem/);
  assert.match(source, /history\.replaceState/);
  assert.match(source, /allowedIds\.has/);
  assert.doesNotMatch(source, /localStorage|fetch\(|navigator\.sendBeacon|data-cta-kind="registration"/);
});

test("venue readiness checklist renders localized account-readiness copy for international locales", async () => {
  const expectations = [
    { locale: "pt-BR", title: "Revise antes de abrir o fluxo oficial", item: "Região" },
    { locale: "ja", title: "公式フローを開く前に確認", item: "地域" },
    { locale: "ko", title: "공식 절차를 열기 전에 확인", item: "지역" },
    { locale: "tr", title: "Resmi akışı açmadan önce kontrol et", item: "Bölge" },
  ];

  for (const expectation of expectations) {
    const html = await renderVenueDetail({ locale: expectation.locale });
    const checklistStart = html.indexOf('data-venue-readiness-checklist="bitget"');
    const checklistEnd = html.indexOf("</section>", checklistStart);
    const checklistHtml = html.slice(checklistStart, checklistEnd);

    assert.ok(checklistStart > 0, `${expectation.locale} readiness checklist is rendered`);
    assert.match(checklistHtml, new RegExp(expectation.title), `${expectation.locale} readiness title is localized`);
    assert.match(checklistHtml, new RegExp(expectation.item), `${expectation.locale} readiness item is localized`);
    assert.doesNotMatch(checklistHtml, /Account readiness|Check before opening the official flow|Official country, residency and account availability checked/);
  }
});

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

const renderVenueDetails = async () => {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-r108-uniswap-"));
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
      const cases = [
        ["uniswap", "en"],
        ["uniswap", "zh-Hans"],
        ["uniswap", "zh-Hant"],
        ["uniswap", "ja"],
        ["hyperliquid", "en"],
      ];
      const pages = cases.map(([slug, locale]) => ({
        slug,
        locale,
        html: renderToStaticMarkup(React.createElement(VenueDetailPage, {
          copy: pageCopy,
          locale,
          venue: venueDatabase[slug],
          venues,
          updates: [],
          market: "unknown",
          product: "unknown",
          accountStage: "new_account",
          funding: "",
        })),
      }));
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

    const pages = JSON.parse(execFileSync("node", [bundlePath], {
      cwd: projectRoot,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    }));
    return Object.fromEntries(pages.map((page) => [`${page.slug}/${page.locale}`, page.html]));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};

const assertChecklist = (html, locale, expectedSummary) => {
  assert.match(html, /data-uniswap-short-checklist="true"/, `${locale}: short checklist is mounted`);
  assert.match(html, new RegExp(expectedSummary), `${locale}: summary explains the next step`);
  assert.match(html, /data-uniswap-check-stage="interface"/, `${locale}: interface stage`);
  assert.match(html, /data-uniswap-check-stage="network"/, `${locale}: network stage`);
  assert.match(html, /data-uniswap-check-stage="preview"/, `${locale}: wallet preview stage`);
  assert.match(html, /https:\/\/app\.uniswap\.org\//, `${locale}: official app source retained`);
  assert.match(html, /\/compare\/uniswap-vs-jupiter/, `${locale}: internal research CTA retained`);
  assert.match(html, /data-cta-kind="source"/, `${locale}: source CTA classified as source`);
  assert.match(html, /data-cta-kind="research"/, `${locale}: internal CTA classified as research`);
  assert.doesNotMatch(html, /data-uniswap-short-checklist="true"[\s\S]*data-cta-kind="registration"/, `${locale}: checklist does not introduce signup CTA`);
  assert.doesNotMatch(html, /data-uniswap-short-checklist="true"[\s\S]*(?:nexu888|11350287|partner\.bitget|bsmkweb|topzhjdgxcb|backpack\.exchange\/join)/i, `${locale}: checklist does not expose invitation links or codes`);

  const checklistStart = html.indexOf('data-uniswap-short-checklist="true"');
  const detailsStart = html.lastIndexOf("<details", checklistStart);
  const summaryStart = html.indexOf("<summary", detailsStart);
  assert.ok(detailsStart >= 0 && summaryStart > detailsStart, `${locale}: rendered as native details/summary`);
  assert.equal(html.slice(detailsStart, summaryStart).includes(" open"), false, `${locale}: details is closed by default`);

  const directAnswerIndex = html.indexOf('class="v3-venue-direct-answer"');
  const botIndex = html.indexOf("venue-onsite-bot-handoff-uniswap");
  assert.ok(directAnswerIndex >= 0 && directAnswerIndex < checklistStart, `${locale}: mounted after direct answer`);
  assert.ok(botIndex > checklistStart, `${locale}: mounted before Telegram handoff`);
};

test("Uniswap priority detail pages expose a closed three-stage short verification checklist", async () => {
  const pages = await renderVenueDetails();

  assertChecklist(pages["uniswap/en"], "en", "3 checks before signing on Uniswap");
  assertChecklist(pages["uniswap/zh-Hans"], "zh-Hans", "签名前先做 3 个短核验");
  assertChecklist(pages["uniswap/zh-Hant"], "zh-Hant", "簽名前先做 3 個短核驗");

  assert.doesNotMatch(pages["uniswap/ja"], /data-uniswap-short-checklist="true"/, "unsupported locale must not silently render English checklist");
  assert.doesNotMatch(pages["hyperliquid/en"], /data-uniswap-short-checklist="true"/, "non-Uniswap venue must not receive the checklist");
});

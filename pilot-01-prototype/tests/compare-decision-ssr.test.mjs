import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compareDirectAnswerFor } from "../src/data/compare-direct-answers.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const occurrenceCount = (source, pattern) => (source.match(pattern) || []).length;

test("Bybit vs Bitget compare renders reviewed editorial differences and no legacy fee bullet", async () => {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-compare-decision-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { CompareDeepPage } from "../../src/components/v3/V3Pages.jsx";
      import { venueDatabase } from "../../src/data/venue-database.js";

      const pageCopy = {
        common: { dimension: "Dimension" },
        assetCapabilities: { none: "Pending source review" },
      };

      const html = renderToStaticMarkup(React.createElement(CompareDeepPage, {
        copy: pageCopy,
        locale: "en",
        selected: ["bybit", "bitget"],
        venues: Object.values(venueDatabase),
        updates: [],
        market: "unknown",
        product: "unknown",
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

    const html = execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8" });
    const directAnswer = compareDirectAnswerFor("bybit-vs-bitget", "en");
    assert.ok(directAnswer?.seoQuestion && directAnswer.seoQuestion.length > 20, "priority comparison answer should expose a meaningful SEO question");
    const matrix = html.slice(html.indexOf('id="hardcore-matrix"'), html.indexOf('id="compare-faq"'));
    assert.ok(matrix.length > 0, "rendered comparison matrix exists");
    assert.doesNotMatch(matrix, /Strict KYC \(Face \+ ID\)|Basic KYC \(ID Only\)|Cross &amp; Isolated margin|>125x<|>100x<|★ Friction Free|★ Max Leverage/);
    assert.match(matrix, /Pending official-source verification/);
    assert.match(html, /Bybit/);
    assert.match(html, /Bitget/);
    assert.match(html, /derivatives, copy-trading checks and product-specific fee tables/);
    assert.match(html, /spot and futures fee mechanics plus copy-trading style workflows/);
    assert.match(html, /class="v3-versus-fit"/);
    assert.equal((html.match(/data-testid="compare-versus-stats-bybit"/g) || []).length, 1, "Bybit stats disclosure should have one stable hydration target");
    assert.equal((html.match(/data-testid="compare-versus-stats-bitget"/g) || []).length, 1, "Bitget stats disclosure should have one stable hydration target");
    assert.equal((html.match(/data-testid="compare-versus-sources-bybit"/g) || []).length, 1, "Bybit source disclosure should have one stable hydration target");
    assert.equal((html.match(/data-testid="compare-versus-sources-bitget"/g) || []).length, 1, "Bitget source disclosure should have one stable hydration target");
    assert.doesNotMatch(html, />Standard KYC</);
    assert.match(html, /VIP 0/);
    assert.match(html, /Standard non-VIP/);
    assert.match(html, /Adventure Zone/);
    assert.equal(occurrenceCount(html, /href="https:\/\/partner\.bitget\.cafe\/bg\/C6PRAF"/g), 3, "Bitget protected registration link should appear in sticky, command surface and supporting CTA only");
    assert.equal(occurrenceCount(html, /href="https:\/\/www\.bybit\.com\/register\?affiliate_id=48553"/g), 3, "Bybit protected registration link should appear in sticky, command surface and supporting CTA only");
    const stickyStart = html.indexOf('class="v3-compare-sticky-bar');
    const heroStart = html.indexOf('id="compare-hero"');
    assert.ok(stickyStart >= 0 && heroStart > stickyStart, "sticky compare CTA bar should render before the hero");
    const stickyBar = html.slice(stickyStart, heroStart);
    assert.match(stickyBar, /href="https:\/\/www\.bybit\.com\/register\?affiliate_id=48553"[\s\S]*data-cta-kind="registration"[\s\S]*data-cta-platform="bybit"[\s\S]*data-cta-placement="compare-sticky-registration"/);
    assert.match(stickyBar, /href="https:\/\/partner\.bitget\.cafe\/bg\/C6PRAF"[\s\S]*data-cta-kind="registration"[\s\S]*data-cta-platform="bitget"[\s\S]*data-cta-placement="compare-sticky-registration"/);
    const finalCardStart = html.indexOf('class="v3-compare-final-choice-card"');
    const versusStart = html.indexOf('id="compare-versus-card"');
    assert.ok(finalCardStart > 0 && versusStart > finalCardStart, "final choice card should render before versus cards");
    const finalCard = html.slice(finalCardStart, versusStart);
    assert.match(finalCard, /Final call before signup/);
    assert.match(finalCard, /Who it fits/);
    assert.match(finalCard, /Verify first/);
    assert.match(finalCard, /data-cta-placement="compare-final-choice-registration"/);
    assert.match(finalCard, /href="https:\/\/www\.bybit\.com\/register\?affiliate_id=48553"[\s\S]*data-cta-kind="registration"[\s\S]*data-cta-platform="bybit"/);
    assert.match(finalCard, /href="https:\/\/partner\.bitget\.cafe\/bg\/C6PRAF"[\s\S]*data-cta-kind="registration"[\s\S]*data-cta-platform="bitget"/);
    assert.match(finalCard, /data-cta-placement="compare-final-choice-detail"/);
    assert.match(finalCard, /href="\/exchanges\/bybit\?market=unknown&amp;product=unknown#registration-path"[\s\S]*data-cta-kind="research"[\s\S]*data-cta-platform="bybit"/);
    assert.match(finalCard, /href="\/exchanges\/bitget\?market=unknown&amp;product=unknown#registration-path"[\s\S]*data-cta-kind="research"[\s\S]*data-cta-platform="bitget"/);
    assert.match(finalCard, /href="#hardcore-matrix"/);
    assert.match(finalCard, /Full matrix/);
    assert.match(finalCard, new RegExp(`class="v3-compare-final-choice-card__evidence" data-mobile-evidence-default="collapsed" aria-label="${directAnswer.seoQuestion.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    assert.doesNotMatch(html, /<details class="v3-versus-stats-disclosure" open/);
    assert.doesNotMatch(html, /Regional restrictions, account eligibility and campaign terms need official verification/);
    assert.doesNotMatch(html, /Published fee reference: Spot 0\.10% \/ 0\.10%, Futures 0\.02% \/ 0\.055%/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("Binance vs OKX compare renders reviewed editorial differences without commercial unlock", async () => {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-compare-decision-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { CompareDeepPage } from "../../src/components/v3/V3Pages.jsx";
      import { venueDatabase } from "../../src/data/venue-database.js";

      const pageCopy = {
        common: { dimension: "Dimension" },
        assetCapabilities: { none: "Pending source review" },
      };

      const html = renderToStaticMarkup(React.createElement(CompareDeepPage, {
        copy: pageCopy,
        locale: "en",
        selected: ["binance", "okx"],
        venues: Object.values(venueDatabase),
        updates: [],
        market: "unknown",
        product: "unknown",
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

    const html = execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8" });
    assert.match(html, /Binance/);
    assert.match(html, /OKX/);
    assert.match(html, /broad account exchange with spot, margin, fiat, P2P/);
    assert.match(html, /Web3, DEX, bots, copy trading, Earn and proof-of-reserves/);
    assert.match(html, /BNB balance rules, identity verification and announcement checks/);
    assert.match(html, /navigation distinguishes exchange and Web3-style choices/);
    const finalCardStart = html.indexOf('class="v3-compare-final-choice-card"');
    const versusStart = html.indexOf('id="compare-versus-card"');
    assert.ok(finalCardStart > 0 && versusStart > finalCardStart, "final choice card should render before versus cards");
    const finalCard = html.slice(finalCardStart, versusStart);
    assert.match(finalCard, /Final call before signup/);
    assert.match(finalCard, /data-cta-placement="compare-final-choice-registration"/);
    assert.match(finalCard, /href="https:\/\/www\.bsmkweb\.cc\/join\?ref=11350287&amp;utm_medium=web_share_copy"[\s\S]*data-cta-kind="registration"[\s\S]*data-cta-platform="binance"/);
    assert.match(finalCard, /href="https:\/\/www\.okx\.com\/join\/nexu888"[\s\S]*data-cta-kind="registration"[\s\S]*data-cta-platform="okx"/);
    assert.match(finalCard, /href="\/exchanges\/binance\?market=unknown&amp;product=unknown#registration-path"[\s\S]*data-cta-kind="research"[\s\S]*data-cta-platform="binance"/);
    assert.match(finalCard, /href="\/exchanges\/okx\?market=unknown&amp;product=unknown#registration-path"[\s\S]*data-cta-kind="research"[\s\S]*data-cta-platform="okx"/);
    assert.match(finalCard, /href="#hardcore-matrix"/);
    assert.doesNotMatch(html, /Verify public products, regional eligibility and official fees first/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

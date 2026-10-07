import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const forbiddenCommercialTokens = /partner\.bitget|bsmkweb|topzhjdgxcb|11350287|nexu888|LUCKX|CANDY007|INS898|1836370407|luckybitcoin|referral code|invite code|guaranteed|bonus|cashback|commission|reward/i;
const forbiddenExchangeOutbound = /href="https:\/\/(?:www\.)?(?:binance|bitget|okx|coinbase|kraken|backpack)\./i;

async function renderUsDecisionDepth() {
  const dir = await mkdtemp(path.join(root, "tests/.tmp-r39-us-depth-"));
  try {
    const entry = path.join(dir, "entry.mjs");
    const bundle = path.join(dir, "bundle.cjs");
    await writeFile(entry, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { RegionalMarketDecisionDepth } from "../../src/components/v3/international/RegionalMarketDecisionDepth.jsx";
      console.log(JSON.stringify(renderToStaticMarkup(React.createElement(RegionalMarketDecisionDepth, { market: "US" }))));
    `);
    const esbuild = path.join(root, "node_modules/.bin/esbuild");
    await access(esbuild);
    execFileSync(esbuild, [
      entry,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${bundle}`,
      "--loader:.css=empty",
      "--log-level=warning",
    ], { cwd: root, stdio: "pipe" });
    return JSON.parse(execFileSync("node", [bundle], { cwd: root, encoding: "utf8" }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("R39 US decision depth renders funding, state, product and unknown boundaries", async () => {
  const html = await renderUsDecisionDepth();

  assert.match(html, /data-regional-decision-depth="US"/);
  assert.match(html, /lang="en"/);
  assert.match(html, /UNITED STATES ACCOUNT CHECK/);
  assert.match(html, /Separate USD funding, state support, identity and product scope before signup/);
  assert.match(html, /ACH|wire transfer|debit card/);
  assert.match(html, /legal-name bank ownership|bank-name/);
  assert.match(html, /state exclusions|US state availability/);
  assert.match(html, /spot access from futures, margin or other derivatives/);
  assert.match(html, /Does not prove account approval, US state availability, USD funding availability, ACH, wire, debit-card, on-chain transfer, spot trading, derivatives access/);
  assert.doesNotMatch(html, forbiddenCommercialTokens);
  assert.doesNotMatch(html, forbiddenExchangeOutbound);
});

test("R39 US decision depth hands off only to research routes with market and product context", async () => {
  const html = await renderUsDecisionDepth();

  assert.match(html, /aria-label="US research handoff"/);
  assert.match(html, /href="\/exchanges\?market=US&amp;product=spot"/);
  assert.match(html, /href="\/compare\/coinbase-vs-kraken\?market=US&amp;product=spot"/);
  assert.match(html, /href="\/rates\?market=US&amp;product=spot"/);
  assert.match(html, /href="https:\/\/t\.me\/NexuAlphaAssistantBot\?start=/);
  assert.match(html, /data-growth-market="US"/);
  assert.match(html, /data-growth-product="spot"/);
  assert.match(html, /data-telegram-return-href="\/exchanges\/coinbase\?market=US&amp;product=spot/);
  assert.match(html, /data-telegram-start="[^"]*m_US[^"]*t_spot/);
  assert.doesNotMatch(html, forbiddenCommercialTokens);
  assert.doesNotMatch(html, forbiddenExchangeOutbound);
});

test("R39 US decision depth handoff controls keep accessible touch targets", async () => {
  const css = await readFile(new URL("../src/components/v3/international/regional-market-decision-depth.css", import.meta.url), "utf8");

  assert.match(css, /\.regional-decision-depth__handoff a \{[\s\S]*min-height: 44px;/);
  assert.match(css, /\.regional-decision-depth__handoff a:focus-visible \{[\s\S]*outline: 2px solid var\(--blue-text, #53b1fd\);/);
});

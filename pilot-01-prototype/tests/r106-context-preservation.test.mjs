import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildNextDecisionBridge } from "../src/data/next-decision-bridge.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

async function renderFixture(source, tmpPrefix) {
  const tempDir = await mkdtemp(path.join(projectRoot, `tests/.tmp-${tmpPrefix}-`));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, source);

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

    return execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function renderFixtureWithDecisionReturnSpy(source, tmpPrefix) {
  const tempDir = await mkdtemp(path.join(projectRoot, `tests/.tmp-${tmpPrefix}-`));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const runnerPath = path.join(tempDir, "build-and-run.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, source);
    await writeFile(runnerPath, `
      import { build } from "esbuild";
      import { execFileSync } from "node:child_process";
      await build({
        entryPoints: [${JSON.stringify(entryPath)}],
        bundle: true,
        platform: "node",
        format: "cjs",
        outfile: ${JSON.stringify(bundlePath)},
        loader: { ".css": "empty" },
        logLevel: "warning",
        plugins: [{
          name: "decision-return-spy",
          setup(build) {
            build.onResolve({ filter: /DecisionReturnLink\\.jsx$/ }, () => ({ path: "decision-return-spy", namespace: "spy" }));
            build.onLoad({ filter: /.*/, namespace: "spy" }, () => ({
              loader: "jsx",
              resolveDir: ${JSON.stringify(projectRoot)},
              contents: "import React from 'react'; export function DecisionReturnLink({href}) { return <a data-spy-decision-return-href={href} href={href}>saved href spy</a>; }",
            }));
          },
        }],
      });
      process.stdout.write(execFileSync("node", [${JSON.stringify(bundlePath)}], { encoding: "utf8", maxBuffer: 33554432 }));
    `);

    return execFileSync("node", [runnerPath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function spyDecisionReturnUrl(html) {
  const match = html.match(/data-spy-decision-return-href="([^"]+)"/);
  assert.ok(match, "DecisionReturnLink should receive a saved href");
  return new URL(match[1].replaceAll("&amp;", "&"), "https://nexualpha.com");
}

test("rates calculator and decision rail preserve validated account stage and funding", async () => {
  const html = await renderFixture(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { FeeBenchmarkTerminal } from "../../src/components/v3/FeeBenchmarkTerminal.jsx";

    const html = renderToStaticMarkup(React.createElement(FeeBenchmarkTerminal, {
      locale: "es",
      market: "MX",
      product: "spot",
      accountStage: "another_platform",
      funding: "SPEI",
    }));
    console.log(html);
  `, "r106-rates-context");

  for (const placement of [
	    // Class b: the current equal-rate verdict uses the tie compare CTA while preserving passport context.
	    "cost-calculator-tie-compare",
    "cost-calculator-next-platform",
    "decision-rail-compare",
    "decision-rail-facts",
    "decision-rail-directory",
  ]) {
    const block = html.match(new RegExp(`href="([^"]+)"[^>]+data-cta-placement="${placement}"`));
    assert.ok(block, `${placement} should render`);
    assert.match(block[1], /market=MX/, `${placement} market`);
    assert.match(block[1], /product=spot/, `${placement} product`);
    assert.match(block[1], /account_stage=another_platform/, `${placement} account stage`);
    assert.match(block[1], /funding=SPEI/, `${placement} funding`);
  }
});

test("rates calculator and rail reject invalid account stage and cross-market funding", async () => {
  const html = await renderFixture(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { FeeBenchmarkTerminal } from "../../src/components/v3/FeeBenchmarkTerminal.jsx";

    const html = renderToStaticMarkup(React.createElement(FeeBenchmarkTerminal, {
      locale: "ja",
      market: "JP",
      product: "spot",
      accountStage: "admin_account",
      funding: "Pix",
    }));
    console.log(html);
  `, "r106-rates-invalid-context");

	  // Class b: the current equal-rate verdict uses the tie compare CTA while preserving passport context.
	  assert.match(html, /href="\/ja\/compare\/binance-vs-okx\?market=JP&amp;product=spot[^"]*"[^>]+data-cta-placement="cost-calculator-tie-compare"/);
  assert.match(html, /href="\/ja\/compare\/binance-vs-okx\?market=JP&amp;product=spot"[^>]+data-cta-placement="decision-rail-compare"/);
  assert.doesNotMatch(html, /account_stage=admin_account/);
  assert.doesNotMatch(html, /funding=Pix/);
});

test("cost decision saved return href keeps validated account stage and funding", async () => {
  const html = await renderFixtureWithDecisionReturnSpy(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { CostDecision } from "../../src/components/v3/CostDecision.jsx";

    const html = renderToStaticMarkup(React.createElement(CostDecision, {
      locale: "es",
      regionMarket: "MX",
      product: "spot",
      accountStage: "another_platform",
      funding: "SPEI",
    }));
    console.log(html);
  `, "r106-cost-return-context");

  const url = spyDecisionReturnUrl(html);
  assert.equal(url.pathname, "/es/rates");
  assert.equal(url.hash, "#cost-scenario");
  assert.equal(url.searchParams.get("scenario"), "cost");
  assert.equal(url.searchParams.get("instrument"), "spot");
  assert.equal(url.searchParams.get("order"), "taker");
  assert.equal(url.searchParams.get("volume"), "100000");
  assert.equal(url.searchParams.get("market"), "MX");
  assert.equal(url.searchParams.get("product"), "spot");
  assert.equal(url.searchParams.get("account_stage"), "another_platform");
  assert.equal(url.searchParams.get("funding"), "SPEI");
});

test("cost decision saved return href rejects invalid account stage and cross-market funding", async () => {
  const html = await renderFixtureWithDecisionReturnSpy(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { CostDecision } from "../../src/components/v3/CostDecision.jsx";

    const html = renderToStaticMarkup(React.createElement(CostDecision, {
      locale: "ja",
      regionMarket: "JP",
      product: "spot",
      accountStage: "admin_account",
      funding: "Pix",
    }));
    console.log(html);
  `, "r106-cost-return-invalid-context");

  const url = spyDecisionReturnUrl(html);
  assert.equal(url.pathname, "/ja/rates");
  assert.equal(url.hash, "#cost-scenario");
  assert.equal(url.searchParams.get("scenario"), "cost");
  assert.equal(url.searchParams.get("market"), "JP");
  assert.equal(url.searchParams.get("product"), "spot");
  assert.equal(url.searchParams.get("account_stage"), null);
  assert.equal(url.searchParams.get("funding"), null);
});

test("next decision bridge appends passport to all internal actions and keeps explicit target context", () => {
  const bridge = buildNextDecisionBridge({
    locale: "es",
    market: "MX",
    product: "spot",
    accountStage: "another_platform",
    funding: "SPEI",
    profileSlug: "binance",
    profileHref: "/exchanges/binance",
    compareHref: "/compare/bybit-vs-bitget?product=perpetuals",
    telegramHref: "/telegram",
  });

  const actions = Object.fromEntries(bridge.actions.map((action) => [action.id, new URL(action.href, "https://nexualpha.com")]));
  assert.equal(actions.profile.pathname, "/es/exchanges/binance");
  assert.equal(actions.profile.searchParams.get("market"), "MX");
  assert.equal(actions.profile.searchParams.get("product"), "spot");
  assert.equal(actions.profile.searchParams.get("account_stage"), "another_platform");
  assert.equal(actions.profile.searchParams.get("funding"), "SPEI");
  assert.equal(actions.compare.pathname, "/es/compare/bybit-vs-bitget");
  assert.equal(actions.compare.searchParams.get("market"), "MX");
  assert.equal(actions.compare.searchParams.get("product"), "perpetuals");
  assert.equal(actions.compare.searchParams.get("account_stage"), "another_platform");
  assert.equal(actions.compare.searchParams.get("funding"), "SPEI");
  assert.equal(actions.telegram.pathname, "/es/telegram");
  assert.equal(actions.telegram.searchParams.get("market"), "MX");
  assert.equal(actions.telegram.searchParams.get("product"), "spot");
  assert.equal(actions.telegram.searchParams.get("account_stage"), "another_platform");
  assert.equal(actions.telegram.searchParams.get("funding"), "SPEI");
});

test("next decision bridge filters funding against an explicit target market", () => {
  const bridge = buildNextDecisionBridge({
    locale: "en",
    market: "MX",
    product: "spot",
    accountStage: "another_platform",
    funding: "SPEI",
    profileSlug: "binance",
    profileHref: "/exchanges/binance?market=BR",
    compareHref: "/compare/binance-vs-okx?market=BR&product=spot",
    telegramHref: "/telegram?market=BR&product=spot",
  });

  for (const action of bridge.actions) {
    const url = new URL(action.href, "https://nexualpha.com");
    assert.equal(url.searchParams.get("market"), "BR", `${action.id} target market`);
    assert.equal(url.searchParams.get("product"), "spot", `${action.id} target product`);
    assert.equal(url.searchParams.get("account_stage"), "another_platform", `${action.id} account stage`);
    assert.equal(url.searchParams.get("funding"), null, `${action.id} funding filtered`);
  }
});

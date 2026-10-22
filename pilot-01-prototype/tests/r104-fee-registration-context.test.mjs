import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

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

test("fee benchmark answer links and regional fallback keep account stage and funding", async () => {
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
  `, "r104-fee-context");

  assert.match(html, /href="\/es\/compare\/binance-vs-okx#nxa-context\?market=MX&amp;product=spot&amp;account_stage=another_platform&amp;funding=SPEI"/);
  assert.match(html, /href="\/es\/compare\/bybit-vs-bitget#nxa-context\?market=MX&amp;product=perpetuals&amp;account_stage=another_platform&amp;funding=SPEI"/);
  assert.match(html, /data-cta-placement="rate-benchmark-row"[\s\S]{0,900}account_stage=another_platform/);
  assert.match(html, /data-cta-placement="rate-benchmark-row"[\s\S]{0,900}funding=SPEI/);
});

test("fee benchmark answer links reject invalid account stage and cross-market funding", async () => {
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
  `, "r104-fee-invalid-context");

  assert.match(html, /href="\/ja\/compare\/binance-vs-okx#nxa-context\?market=JP&amp;product=spot"/);
  assert.match(html, /href="\/ja\/compare\/bybit-vs-bitget#nxa-context\?market=JP&amp;product=perpetuals"/);
  assert.doesNotMatch(html, /account_stage=admin_account/);
  assert.doesNotMatch(html, /funding=Pix/);
});

test("registration card research recovery keeps the decision passport in the directory link", async () => {
  const html = await renderFixture(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { RegistrationCard } from "../../src/components/v3/RegistrationCard.jsx";

    const html = renderToStaticMarkup(React.createElement(RegistrationCard, {
      venueSlug: "unknown-venue",
      fallbackDomain: "",
      locale: "es",
      market: "MX",
      product: "spot",
      accountStage: "another_platform",
      funding: "SPEI",
    }));
    console.log(html);
  `, "r104-registration-context");

  const match = html.match(/<a href="([^"]+)" data-cta-kind="research" data-cta-placement="registration-card-compare"/);
  assert.ok(match, "registration compare recovery link should render");
  assert.match(match[1], /^\/es\/exchanges#nxa-context\?/);
  assert.match(match[1], /market=MX/);
  assert.match(match[1], /product=spot/);
  assert.match(match[1], /account_stage=another_platform/);
  assert.match(match[1], /funding=SPEI/);
});

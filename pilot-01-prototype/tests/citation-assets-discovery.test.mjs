import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const rootPath = fileURLToPath(new URL("..", import.meta.url));

test("AI discovery index exposes reusable citation assets with a non-live boundary", async () => {
  const generator = await readFile(new URL("../scripts/generate-public-llms.mjs", import.meta.url), "utf8");
  for (const path of [
    "/research/perp-dex-cost-field-dictionary.json",
    "/research/perp-dex-cost-field-dictionary.csv",
    "/research/wave48-tokenized-treasury-rights-ops.json",
    "/research/regional-funding-verification-matrix.json",
    "/research/regional-funding-verification-matrix.csv",
  ]) {
    assert.match(generator, new RegExp(path.replaceAll("/", "\\/")));
  }
  assert.match(generator, /dated research snapshots/i);
  assert.match(generator, /not live rates/i);
  assert.match(generator, /not.*eligibility/i);
  assert.match(generator, /methodology#data-license/);
  assert.match(generator, /does not grant redistribution, republication or sublicensing rights/);
});

test("AI discovery generator emits priority source-backed venue canonicals without public artifact mutation", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "nexualpha-llms-priority-venues-"));
  try {
    await execFileAsync(process.execPath, ["scripts/generate-public-llms.mjs"], {
      cwd: rootPath,
      env: { ...process.env, NEXUALPHA_LLMS_OUTPUT_DIR: outputDir },
    });
    const llms = await readFile(join(outputDir, "llms.txt"), "utf8");
    const full = await readFile(join(outputDir, "llms-full.txt"), "utf8");
    for (const text of [llms, full]) {
      const section = text.match(/## Source-backed venue detail canonicals[\s\S]*?(?=\n\n## International authority source packs)/)?.[0] ?? "";
      assert.ok(section, "missing source-backed venue detail canonical section");
      for (const [name, slug] of [
        ["Binance", "binance"],
        ["OKX", "okx"],
        ["Bybit", "bybit"],
        ["Bitget", "bitget"],
        ["Hyperliquid", "hyperliquid"],
        ["Uniswap", "uniswap"],
        ["GMX", "gmx"],
      ]) {
        assert.match(section, new RegExp(`\\[${name} venue detail\\]\\(https:\\/\\/nexualpha\\.com\\/exchanges\\/${slug}\\)`));
      }
      assert.match(section, /Spot fees are shown as maker\/taker rates/);
      assert.match(section, /Bitget's futures-fee guide separates transaction fees from funding fees/);
      assert.match(section, /Hyperliquid fees query should be read as a bundle/);
      assert.match(section, /Uniswap quickstart for the official app URL tells integrators to build and test the link/);
      assert.match(section, /GM\/GLV liquidity pools/);
      assert.match(section, /Boundary: verify fees, account permissions, regional availability and campaign terms/);
      assert.doesNotMatch(section, /NEXU_GMX|Referral Activation Code|commission rate|settlement amount|nexu888|11350287|LUCKX|CANDY007|INS898|luckybitcoin/i);
    }
    const small = await readFile(join(outputDir, "llms-small.txt"), "utf8");
    assert.match(small, /https:\/\/nexualpha\.com\/methodology#data-license/);
    assert.match(small, /does not grant redistribution, republication or sublicensing rights/);
    assert.match(small, /Source-backed venue detail canonicals: https:\/\/nexualpha\.com\/exchanges\/binance/);
    assert.match(small, /https:\/\/nexualpha\.com\/exchanges\/hyperliquid/);
    assert.match(small, /https:\/\/nexualpha\.com\/exchanges\/uniswap/);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

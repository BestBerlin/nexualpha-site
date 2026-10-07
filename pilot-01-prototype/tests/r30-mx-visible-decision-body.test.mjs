import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const expectedPartnerHash = "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a";
const forbiddenCommercialTokens = /https?:\/\/(?:www\.)?(?:bsmkweb|partner\.bitget|topzhjdgxcb)|nexu888|11350287|LUCKX|CANDY007|INS898|1836370407|luckybitcoin|private commission|commissionrate|payout|佣金比例|返给用户/i;

async function renderMxDecisionPages() {
  const dir = await mkdtemp(path.join(root, "tests/.tmp-r30-mx-visible-"));
  try {
    const entry = path.join(dir, "entry.mjs");
    const bundle = path.join(dir, "bundle.cjs");
    await writeFile(entry, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { RegionalMarketPreview } from "../../src/components/v3/international/RegionalMarketPreview.jsx";
      const pages = {};
      for (const decisionPath of ["comparar", "costos", "conta"]) {
        pages[decisionPath] = renderToStaticMarkup(React.createElement(RegionalMarketPreview, {
          market: "MX",
          locale: "es",
          decisionPath,
        }));
      }
      console.log(JSON.stringify(pages));
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
    ], { cwd: root });
    return JSON.parse(execFileSync("node", [bundle], { cwd: root, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("R30 Mexico decision pages render independent Spanish bodies", async () => {
  const pages = await renderMxDecisionPages();

  assert.match(pages.comparar, /Comparación de 4 pruebas antes del CTA/);
  assert.match(pages.comparar, /Cómo comparar plataformas cripto para México sin asumir acceso MXN/);
  assert.match(pages.comparar, /Comparar no equivale a prometer acceso/);
  assert.match(pages.comparar, /\/compare\/binance-vs-okx\?market=MX/);

  assert.match(pages.costos, /Cálculo de 4 capas antes del depósito/);
  assert.match(pages.costos, /Qué costes debe separar un usuario mexicano antes de depositar/);
  assert.match(pages.costos, /La página de costes ordena hipótesis/);

  assert.match(pages.conta, /Checklist de cuenta antes de salir de NexuAlpha/);
  assert.match(pages.conta, /Qué significa una ruta de partner para una cuenta mexicana/);
  assert.match(pages.conta, /Cuenta, partner, código, beneficio y aprobación son cosas diferentes/);

  assert.notEqual(pages.comparar, pages.costos);
  assert.notEqual(pages.costos, pages.conta);
  assert.doesNotMatch(`${pages.comparar}\n${pages.costos}\n${pages.conta}`, forbiddenCommercialTokens);
});

test("R30 Mexico visible-body work preserves partner registry immutability", async () => {
  const partnerRegistry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
  assert.equal(createHash("sha256").update(partnerRegistry).digest("hex"), expectedPartnerHash);
});

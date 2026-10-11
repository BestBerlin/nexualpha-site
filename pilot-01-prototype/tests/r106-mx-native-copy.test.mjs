import {assertVersionedAcceptedFeed} from './r189-feed-contract.mjs';
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { aeoQuestionsForMarket } from "../src/data/aeo-question-registry.js";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
// Class b: 84b6426 made the official binance.com referral route the accepted protected registry bytes.
const expectedPartnerHash = "e53261a6e7e39e64bd35bbedda4ef4a36c1521521750a77eaff3d26c52925d69";
const protectedHashes = new Map([
  ["src/data/partner-registry.js", expectedPartnerHash],
  ["src/data/venue-database.js", "0ce124afbe9f4758ce9ec093c79372550ce2e2e90a7342aa05ecc8d3482e1d52"],
  ["src/data/public-cta.js", "675875240d5fbb05498284a37f90a14488d6ace73d19b102caeb5add9e33f8e3"],
  ["src/data/regional-cta.js", "a2542bb137b6b6ff123a0d3c6b3a01b09e1e3a785ee223e3b4e04a3fe8aab665"],
  ["public/content/news-feed.json", "6bdbbd21a9f8f4ed6ed36307fbc582fbdaf633cb673f157f6a3e97c7bd318f08"],
  ["public/research/wave48-tokenized-treasury-rights-ops.json", "aabfccd32a94c53553854a631bda5ff40b37a072fad7c96ab168117ee41ee15d"],
]);

const oldSpanishFallback = /México: compara MXN, SPEI e identidad antes de abrir cuenta|Ruta local en español|Qué revisar en México antes de elegir una plataforma cripto|Verificación de 4 pasos antes del registro|Qué prueba y qué no prueba cada fuente|¿El flujo oficial muestra MXN\/SPEI o Medá para tu cuenta\?|Primera cuenta|Comparar opciones|Rutas de investigación para México/;
const spanishAuthorityFallback = /Banco de México,\s*CNBV y centros oficiales de ayuda de las plataformas|Fuentes de Banco de México/i;
const englishAuthorityCopy = /Banco de México, CNBV and official platform help centers/;
const commercialLeak = /https?:\/\/(?:www\.)?(?:bsmkweb|partner\.bitget|topzhjdgxcb)|nexu888|11350287|LUCKX|CANDY007|INS898|1836370407|luckybitcoin|private commission|commissionrate|payout|佣金比例|返给用户/i;

async function renderMxRegionalPages() {
  const dir = await mkdtemp(path.join(root, "tests/.tmp-r106-mx-native-"));
  try {
    const entry = path.join(dir, "entry.mjs");
    const bundle = path.join(dir, "bundle.cjs");
    await writeFile(entry, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { RegionalMarketPreview } from "../../src/components/v3/international/RegionalMarketPreview.jsx";

      const pages = {};
      for (const locale of ["es", "en"]) {
        for (const decisionPath of [null, "comparar", "costos", "conta"]) {
          const key = locale + ":" + (decisionPath || "root");
          pages[key] = renderToStaticMarkup(React.createElement(RegionalMarketPreview, {
            market: "MX",
            locale,
            decisionPath,
            decisionPassport: {
              market: "MX",
              product: "spot",
              accountStage: "another_platform",
              funding: "SPEI",
            },
          }));
        }
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
    ], { cwd: root, stdio: "pipe" });

    return JSON.parse(execFileSync("node", [bundle], { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("R106 Mexico English pages use native MX copy across root and decision routes", async () => {
  const pages = await renderMxRegionalPages();

  assert.match(pages["en:root"], /Mexico: compare MXN, SPEI and identity before opening an account/);
  assert.match(pages["en:root"], /What to check in Mexico before choosing a crypto platform/);
  assert.match(pages["en:root"], /What each source proves and does not prove/);
  assert.match(pages["en:root"], /Does the official flow show MXN\/SPEI or Meda for your account\?/);
  assert.match(pages["en:root"], /First account/);
  assert.match(pages["en:root"], /Mexico research paths/);

  assert.match(pages["en:comparar"], /Mexico: compare Binance, OKX and other candidates before registration/);
  assert.match(pages["en:comparar"], /4 comparison checks before the CTA/);
  assert.match(pages["en:comparar"], /How to compare crypto platforms for Mexico without assuming MXN access/);
  assert.match(pages["en:comparar"], /Next Mexico comparison steps/);

  assert.match(pages["en:costos"], /Mexico: separate spot fee, MXN\/SPEI, spread, withdrawal and account conditions/);
  assert.match(pages["en:costos"], /4 cost layers before deposit/);
  assert.match(pages["en:costos"], /Which costs a Mexico user should separate before depositing/);

  assert.match(pages["en:conta"], /Mexico: account, partner route, code, KYC and benefit before registration/);
  assert.match(pages["en:conta"], /Account checklist before leaving NexuAlpha/);
  assert.match(pages["en:conta"], /What a partner route means for a Mexico account/);

  for (const key of ["en:root", "en:comparar", "en:costos", "en:conta"]) {
    assert.doesNotMatch(pages[key], oldSpanishFallback, `${key} must not fall back to Spanish MX editorial copy`);
    assert.doesNotMatch(pages[key], spanishAuthorityFallback, `${key} must not render the Spanish MX authority description`);
    assert.match(pages[key], englishAuthorityCopy, `${key} must render the English MX authority description`);
    assert.doesNotMatch(pages[key], commercialLeak, `${key} must not leak invitation links, codes or private commission copy`);
  }
});

test("R106 Mexico Spanish pages preserve existing Spanish editorial owners", async () => {
  const pages = await renderMxRegionalPages();

  assert.match(pages["es:root"], /México: compara MXN, SPEI e identidad antes de abrir cuenta/);
  assert.match(pages["es:root"], /Qué revisar en México antes de elegir una plataforma cripto/);
  assert.match(pages["es:root"], /Qué prueba y qué no prueba cada fuente/);

  assert.match(pages["es:comparar"], /México: comparar Binance, OKX y otros candidatos antes del registro/);
  assert.match(pages["es:comparar"], /Comparación de 4 pruebas antes del CTA/);
  assert.match(pages["es:costos"], /México: separar coste spot, MXN\/SPEI, spread, retiro y cuenta/);
  assert.match(pages["es:costos"], /Cálculo de 4 capas antes del depósito/);
  assert.match(pages["es:conta"], /México: cuenta, partner, código, KYC y beneficio antes del registro/);
  assert.match(pages["es:conta"], /Checklist de cuenta antes de salir de NexuAlpha/);
});

test("R106 Mexico bridge context keeps account stage and funding attached in SSR", async () => {
  const pages = await renderMxRegionalPages();
  const bridge = pages["en:root"].match(/<aside class="next-decision-bridge[^"]*"[^>]*data-next-decision-bridge="true"[\s\S]*?<\/aside>/)?.[0] || "";
  assert.ok(bridge, "regional NextDecisionBridge must render");
  assert.match(bridge, /account_stage=another_platform/);
  assert.match(bridge, /funding=SPEI/);
  assert.doesNotMatch(bridge, commercialLeak);
});

test("R106 Mexico canonical question registry remains Spanish-owned in this bounded pass", () => {
  const questions = aeoQuestionsForMarket("MX");
  assert.equal(questions.length, 6);
  assert.ok(questions.every((item) => item.locale === "es"));
  assert.ok(questions.every((item) => /[¿áéíóúñ]/i.test(item.question)), "MX registry owners remain Spanish questions");
});

test("R106 protected commercial and source files remain immutable", async () => {
  for (const [relativePath, expectedHash] of protectedHashes) {
    const content = await readFile(path.join(root, relativePath));
    if (relativePath === "public/content/news-feed.json") assertVersionedAcceptedFeed(content, expectedHash);
    else assert.equal(createHash("sha256").update(content).digest("hex"), expectedHash, relativePath);
  }
});

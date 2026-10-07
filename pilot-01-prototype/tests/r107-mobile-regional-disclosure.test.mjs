import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const previewSource = readFileSync(path.join(root, "src/components/v3/international/RegionalMarketPreview.jsx"), "utf8");
const previewCss = readFileSync(path.join(root, "src/components/v3/international/regional-market-preview.css"), "utf8");

function renderPreview(props) {
  const dir = mkdtempSync(path.join(root, "tests/.tmp-r107-regional-disclosure-"));
  try {
    const entry = path.join(dir, "entry.jsx");
    writeFileSync(entry, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { RegionalMarketPreview } from "../../src/components/v3/international/RegionalMarketPreview.jsx";
      console.log(renderToStaticMarkup(<RegionalMarketPreview {...${JSON.stringify(props)}} />));
    `);
    execFileSync(path.join(root, "node_modules/.bin/esbuild"), [
      entry,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${dir}/bundle.cjs`,
      "--loader:.css=empty",
      "--log-level=error",
    ], { cwd: root, stdio: "pipe" });
    return execFileSync(process.execPath, [path.join(dir, "bundle.cjs")], { cwd: root, encoding: "utf8", maxBuffer: 12 * 1024 * 1024 });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function section(html, className) {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.match(new RegExp(`<[^>]+class="[^"]*${escaped}[^"]*"[\\s\\S]*?<\\/(?:section|details|div|aside)>`))?.[0] || "";
}

test("R107 MX EN/ES filters use a native disclosure while keeping the primary candidate CTA exposed", () => {
  const html = renderPreview({
    market: "MX",
    locale: "en",
    decisionPassport: { market: "MX", product: "spot", accountStage: "new_account", funding: "SPEI" },
  });
  const filterDisclosure = section(html, "regional-market-preview__shortlist-filter-disclosure");
  assert.ok(filterDisclosure, "mobile filter disclosure should render in MX EN SSR");
  assert.match(filterDisclosure, /<summary[\s\S]*?Change filters[\s\S]*?<\/summary>/);
  assert.match(filterDisclosure, /MX[\s\S]*spot[\s\S]*SPEI[\s\S]*new account/i);
  assert.match(filterDisclosure, /class="regional-market-preview__shortlist-controls"/);
  assert.match(previewSource, /window\.matchMedia\("\(max-width: 720px\)"\)/);
  assert.match(previewSource, /setShortlistFiltersOpen\(event\.currentTarget\.open\)/);
  assert.doesNotMatch(previewCss, /:has\(\.regional-market-preview__shortlist-filter-disclosure:not\(\[open\]\)\)/);

  const shortlistStart = html.indexOf('class="regional-market-preview__shortlist"');
  const controlsIndex = html.indexOf('class="regional-market-preview__shortlist-controls"', shortlistStart);
  const candidateIndex = html.indexOf('data-cta-placement="regional-shortlist-profile"', shortlistStart);
  const researchDisclosureIndex = html.indexOf('class="regional-market-preview__mobile-research-disclosure"', shortlistStart);
  assert.ok(candidateIndex > controlsIndex, "primary candidate remains after filters");
  assert.ok(researchDisclosureIndex > candidateIndex, "primary candidate CTA must stay outside the collapsed research evidence area");
});

test("R107 MX ES research evidence is grouped in one native disclosure without removing SSR source content", () => {
  const html = renderPreview({
    market: "MX",
    locale: "es",
    decisionPassport: { market: "MX", product: "spot", accountStage: "new_account", funding: "SPEI" },
  });
  const filterDisclosure = section(html, "regional-market-preview__shortlist-filter-disclosure");
  const researchDisclosure = section(html, "regional-market-preview__mobile-research-disclosure");
  assert.match(filterDisclosure, /Cambiar filtros/);
  assert.ok(researchDisclosure, "mobile research disclosure should render in MX ES SSR");
  assert.match(researchDisclosure, /<summary[\s\S]*?Evidencia y fuentes de investigación[\s\S]*?<\/summary>/i);
  assert.match(previewSource, /setResearchEvidenceOpen\(event\.currentTarget\.open\)/);
  assert.doesNotMatch(previewCss, /:has\(\.regional-market-preview__mobile-research-disclosure:not\(\[open\]\)\)/);

  const researchStackIndex = html.indexOf('class="regional-market-preview__research-stack"');
  const sourceIndex = html.indexOf('data-cta-placement="regional-official-source"');
  const directAnswerIndex = html.indexOf('data-aeo-direct-answer');
  assert.ok(researchStackIndex > -1, "research stack wrapper should exist");
  assert.ok(directAnswerIndex > researchStackIndex, "direct answer stays in SSR research stack");
  assert.ok(sourceIndex > researchStackIndex, "official sources stay in SSR research stack");
});


test("R107 MX ES filter summary uses localized product and funding labels without changing raw URL context", () => {
  const html = renderPreview({
    market: "MX",
    locale: "es",
    decisionPassport: { market: "MX", product: "spot", accountStage: "new_account", funding: "MXN bank transfer" },
  });
  const filterDisclosure = section(html, "regional-market-preview__shortlist-filter-disclosure");
  const summary = filterDisclosure.match(/<summary[\s\S]*?<\/summary>/)?.[0] || "";
  assert.match(summary, /Cambiar filtros/);
  assert.match(summary, /Transferencia bancaria MXN/);
  assert.doesNotMatch(summary, /MXN bank transfer/);
  assert.match(html, /funding=MXN\+bank\+transfer/);
});

test("R107 mobile compression is bounded to MX EN/ES and keeps commercial data modules untouched", () => {
  const jpHtml = renderPreview({
    market: "JP",
    locale: "ja",
    decisionPassport: { market: "JP", product: "spot", accountStage: "new_account", funding: "bank" },
  });
  assert.doesNotMatch(jpHtml, /regional-market-preview__shortlist-filter-disclosure/);
  assert.doesNotMatch(jpHtml, /regional-market-preview__mobile-research-disclosure/);
  assert.match(jpHtml, /class="regional-market-preview__shortlist-controls"/);

  assert.doesNotMatch(previewSource, /partnerRegistry\s*=|commissionrate|private commission|nexu888|11350287|LUCKX|CANDY007|INS898|1836370407|luckybitcoin/i);
  assert.match(previewSource, /<RegionalMobileDecisionDock[\s\S]*funding=\{shortlist\.funding\}/);
  assert.match(previewSource, /<NextDecisionBridge[\s\S]*accountStage=\{selectedAccountStage\}[\s\S]*funding=\{shortlist\.funding\}/);
});

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { AEO_QUESTION_REGISTRY } from "../src/data/aeo-question-registry.js";
import { BRAZIL_SOURCES, getBrazilPage } from "../src/data/brazil-market.js";
import { getBrazilSeo } from "../src/data/brazil-seo.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const expectedCommercialHashes = {
  "src/data/partner-registry.js": "e622416dde981867f390d31bc34fa7be707d7197b265c20453813f41b5728f79", // owner-authorized HTX 40% rebate + htx.net.in backup link 2026-10-13
  "src/data/venue-database.js": "09e89df6582641dbaedb73b20e86913f523c401ae2cf4fa80d663aa6ea19d81f", // owner-authorized HTX 40% rebate 2026-10-13
  "src/data/public-cta.js": "675875240d5fbb05498284a37f90a14488d6ace73d19b102caeb5add9e33f8e3",
  "src/data/regional-cta.js": "a2542bb137b6b6ff123a0d3c6b3a01b09e1e3a785ee223e3b4e04a3fe8aab665",
};

const recipientQuestion = "No depósito Pix, o CPF do pagador e o CNPJ do recebedor são a mesma verificação?";

function recipientFaq() {
  const page = getBrazilPage("/br/pix");
  const faq = page.faq.find((item) => item.question === recipientQuestion);
  assert.ok(faq, "recipient FAQ should live in the existing /br/pix FAQ array");
  return { page, faq };
}

async function renderBrazilPixPage() {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-r76-pix-recipient-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { BrazilDecisionPage } from "../../src/components/v3/international/BrazilDecisionPage.jsx";
      const html = renderToStaticMarkup(React.createElement(BrazilDecisionPage, {
        pathname: "/br/pix",
        initialUrl: "https://nexualpha.com/br/pix?market=BR&product=spot&platform=okx&locale=pt-BR",
        locale: "pt-BR",
        trackGrowthDecision: () => {},
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

    return execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function generateLlmsIntoTemp() {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-r76-llms-"));
  execFileSync("node", ["scripts/generate-public-llms.mjs"], {
    cwd: projectRoot,
    env: { ...process.env, NEXUALPHA_LLMS_OUTPUT_DIR: tempDir },
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  return tempDir;
}

test("R76 keeps Pix recipient copy inside the existing /br/pix FAQ and source boundary", () => {
  const { page, faq } = recipientFaq();
  const okxSource = BRAZIL_SOURCES.find((source) => source.id === "okx-brl-pix-deposit");
  assert.ok(okxSource);
  assert.equal(okxSource.checkedAt, "2026-10-02T00:00:00.000Z");
  assert.equal(okxSource.url, "https://www.okx.com/help/how-do-i-deposit-brl");
  assert.deepEqual(faq.sourceIds, ["okx-brl-pix-deposit"]);
  assert.ok(page.sourceIds.includes("okx-brl-pix-deposit"));
  assert.equal(page.sections.some((section) => /dados recebidos em mensagens|capturas antigas|A ajuda da OKX orienta/.test(JSON.stringify(section))), false);
  assert.match(faq.answer, /nome e o CPF do pagador/);
  assert.match(faq.answer, /nome e o CNPJ do recebedor/);
  assert.match(faq.answer, /A ajuda da OKX orienta essa conferência/);
  assert.match(faq.answer, /A NexuAlpha não fornece chave Pix nem recebe fundos/);
  assert.doesNotMatch(faq.answer, /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\b\d{14}\b/);
  assert.doesNotMatch(faq.answer, /Binance|Banco Central|processador|processor|merchant|PSP/i);
});

test("R76 emits the recipient FAQ through Brazil SEO schema and SSR", async () => {
  const { faq } = recipientFaq();
  const faqSchema = getBrazilSeo("/br/pix").schemas.find((schema) => schema["@type"] === "FAQPage");
  const schemaRow = faqSchema.mainEntity.find((item) => item.name === faq.question);
  assert.ok(schemaRow, "getBrazilSeo should emit the visible recipient FAQ");
  assert.equal(schemaRow.acceptedAnswer.text, faq.answer);

  const html = await renderBrazilPixPage();
  const faqStart = html.indexOf('<div class="br-faq">');
  assert.ok(faqStart > 0, "existing FAQ container should render");
  const faqHtml = html.slice(faqStart);
  assert.match(faqHtml, new RegExp(faq.question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(faqHtml, /nome e o CPF do pagador/);
  assert.match(faqHtml, /nome e o CNPJ do recebedor/);
  assert.doesNotMatch(faqHtml, /private commission|commissionrate|佣金比例|返给用户/i);
});

test("R76 isolated llms output mirrors the visible FAQ and recipient question inventory", async () => {
  const { faq } = recipientFaq();
  const tempDir = await generateLlmsIntoTemp();
  try {
    const llms = await readFile(path.join(tempDir, "llms.txt"), "utf8");
    const full = await readFile(path.join(tempDir, "llms-full.txt"), "utf8");
    const inventoryQuestion = AEO_QUESTION_REGISTRY.find((item) => item.id === "br-pix-recipient-check");
    assert.ok(inventoryQuestion);
    assert.equal(inventoryQuestion.question, faq.question);
    assert.equal(inventoryQuestion.canonicalPath, "/br/pix");
    assert.deepEqual(inventoryQuestion.sourceUrls, ["https://www.okx.com/help/how-do-i-deposit-brl"]);
    assert.match(llms, /No depósito Pix, o CPF do pagador e o CNPJ do recebedor são a mesma verificação\? — canonical: https:\/\/nexualpha\.com\/br\/pix/);

    const section = full.match(/## Brazil Pix recipient verification[\s\S]*?(?=\n\n## Reviewed news article answers)/)?.[0] || "";
    assert.match(section, /Canonical: https:\/\/nexualpha\.com\/br\/pix/);
    assert.match(section, new RegExp(faq.question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(section, new RegExp(faq.answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.ok(section.includes("[OKX — How do I deposit BRL with Pix transfer?](https://www.okx.com/help/how-do-i-deposit-brl)"));
    assert.doesNotMatch(section, /A NexuAlpha recebe ou processa Pix\?|Pix significa aprovação instantânea\?/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("R76 does not modify commercial registries or referral-bearing data", async () => {
  for (const [relativePath, expectedHash] of Object.entries(expectedCommercialHashes)) {
    const body = await readFile(path.join(projectRoot, relativePath));
    assert.equal(createHash("sha256").update(body).digest("hex"), expectedHash, relativePath);
  }
});

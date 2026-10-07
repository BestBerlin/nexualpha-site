import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { BRAZIL_PAGES, BRAZIL_SOURCES, getBrazilPage } from "../src/data/brazil-market.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const expectedPartnerHash = "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a";

const requiredSourceIds = [
  "bcb-pix-speed-availability",
  "bcb-pix-med",
  "okx-pix-deposit-learn",
  "receita-cripto-servico",
  "receita-irpf-2026-cripto",
];

const phrasesByPath = {
  "/br/pix": [
    /Pix no Brasil é rápido e funciona todos os dias/,
    /não prova que a sua conta cripto já pode receber BRL/,
    /research, not a transfer/,
    /不要直接转账/,
  ],
  "/br/saque-pix": [
    /Um depósito Pix aprovado não libera automaticamente todo saque BRL/,
    /Se eu consigo depositar por Pix, posso sacar para qualquer conta\?/,
    /Deposits and withdrawals have separate rules/,
    /入金和出金规则不同/,
  ],
  "/br/custos": [
    /limites, tarifas e prazo precisam vir da forma de pagamento exibida na sua conta/,
    /Registro fiscal/,
    /NexuAlpha não calcula imposto/,
    /account-specific cost/,
    /官方页面用于确认你账户实际适用的成本/,
  ],
  "/br/kyc-cpf": [
    /CPF e titularidade bancária são filtros de entrada/,
    /Pix de terceiros pode ser devolvido/,
    /CPF and account ownership are an entry filter/,
    /银行卡归属是准入条件/,
  ],
};

function jsonOf(pathname) {
  return JSON.stringify(getBrazilPage(pathname));
}

async function renderBrazilPage(pathname, search = "?market=BR&product=spot&platform=okx&locale=pt-BR") {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-brazil-content-depth-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { BrazilDecisionPage } from "../../src/components/v3/international/BrazilDecisionPage.jsx";
      const html = renderToStaticMarkup(React.createElement(BrazilDecisionPage, {
        pathname: ${JSON.stringify(pathname)},
        initialUrl: "https://nexualpha.com${pathname}${search}",
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

test("Brazil deep content adds reviewed source boundaries without changing invitation registry", async () => {
  const sources = new Map(BRAZIL_SOURCES.map((source) => [source.id, source]));
  for (const id of requiredSourceIds) {
    const source = sources.get(id);
    assert.ok(source, id);
    assert.match(source.url, /^https:\/\//, id);
    assert.equal(source.checkedAt, "2026-09-22T00:00:00.000Z", id);
    assert.doesNotMatch(source.url, /affiliate|ref=/i, id);
  }

  for (const [pathname, patterns] of Object.entries(phrasesByPath)) {
    const body = jsonOf(pathname);
    for (const pattern of patterns) assert.match(body, pattern, pathname);
  }

  const partnerRegistry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
  assert.equal(createHash("sha256").update(partnerRegistry).digest("hex"), expectedPartnerHash);
});

test("Brazil deep content stays integrated in existing AEO and FAQ surfaces", async () => {
  assert.deepEqual(BRAZIL_PAGES.map((page) => page.path), ["/br", "/br/comparar", "/br/pix", "/br/saque-pix", "/br/custos", "/br/conta", "/br/kyc-cpf"]);

  for (const page of BRAZIL_PAGES) {
    assert.equal(page.nextSteps.length, 3, page.path);
    assert.ok(page.nextSteps.some((step) => /^\/br\//.test(step.href)), page.path);
    assert.ok(page.nextSteps.some((step) => step.kind === "telegram" && step.href.startsWith("telegram:")), page.path);
    assert.doesNotMatch(JSON.stringify(page.nextSteps), /ref=|invite|affiliate_id|partner\.bitget|join\?/i, page.path);
  }

  const pix = getBrazilPage("/br/pix").aeoAnswers.find((answer) => answer.id === "br-pix-deposit");
  assert.deepEqual(Object.keys(pix.localized), ["en", "zh-Hans"]);
  assert.ok(pix.table.some((row) => row.sourceIds.includes("bcb-pix-speed-availability")));

  const costs = getBrazilPage("/br/custos").aeoAnswers.find((answer) => answer.id === "br-fee-estimate");
  assert.ok(costs.table.some((row) => row.item === "Registro fiscal"));
  assert.ok(costs.sourceIds.includes("receita-cripto-servico"));
  assert.ok(costs.sourceIds.includes("receita-irpf-2026-cripto"));

  const withdrawalFaq = getBrazilPage("/br/saque-pix").faq.find((item) => item.question === "Se eu consigo depositar por Pix, posso sacar para qualquer conta?");
  assert.ok(withdrawalFaq);
  assert.deepEqual(Object.keys(withdrawalFaq.localized), ["en", "zh-Hans"]);

  const kyc = getBrazilPage("/br/kyc-cpf").aeoAnswers.find((answer) => answer.id === "br-kyc-cpf-checklist");
  assert.ok(kyc.table.some((row) => row.sourceIds.includes("okx-pix-deposit-learn")));
});

test("Brazil SSR renders the strengthened Portuguese decision answers without extra route cards", async () => {
  for (const pathname of ["/br/pix", "/br/saque-pix", "/br/custos", "/br/kyc-cpf"]) {
    const html = await renderBrazilPage(pathname);
    assert.match(html, /class="br-content-disclosure v2-shell"/, pathname);
    assert.match(html, /class="br-aeo-answers"/, pathname);
    assert.match(html, /class="br-faq"/, pathname);
    assert.doesNotMatch(html, /private commission|commissionrate|佣金比例|返给用户/i, pathname);
    assert.doesNotMatch(html.replace(/<[^>]*>/g, ""), /payout/i, pathname);
    assert.match(html, /data-telegram-anonymous-metrics="[^"]*no partner conversion[^"]*payout[^"]*evidence"/, "anonymous measurement excludes payout evidence");
  }

  assert.match(await renderBrazilPage("/br/pix"), /não prova que a sua conta cripto já pode receber BRL/);
  assert.match(await renderBrazilPage("/br/saque-pix"), /Se eu consigo depositar por Pix, posso sacar para qualquer conta\?/);
  assert.match(await renderBrazilPage("/br/custos"), /Registro fiscal/);
  assert.match(await renderBrazilPage("/br/kyc-cpf"), /CPF e titularidade bancária são filtros de entrada/);
});

test("Brazil SSR exposes Pix to compare to CTA-check to Telegram return path", async () => {
  const html = await renderBrazilPage("/br/pix");
  assert.match(html, /class="br-next-steps v2-shell"/);
  assert.match(html, /Comparar Binance e OKX com BRL\/Pix/);
  assert.match(html, /href="\/br\/comparar\?locale=pt-BR&amp;market=BR&amp;product=spot&amp;platform=okx&amp;amount=1000/);
  assert.match(html, /Ver CTA e benefício antes do cadastro/);
  assert.match(html, /href="\/br\/conta\?locale=pt-BR&amp;market=BR&amp;product=spot&amp;platform=okx&amp;amount=1000/);
  assert.match(html, /Levar a dúvida para o Telegram/);
  assert.match(html, /href="https:\/\/t\.me\/NexuAlphaAssistantBot\?start=/);
  assert.match(html, /data-telegram-return-href="\/pt-br\/compare\/binance-vs-okx\?market=BR&amp;product=spot/);
  assert.match(html, /data-growth-decision="br_next_telegram"/);
  assert.doesNotMatch(html, /private commission|commissionrate|佣金比例|返给用户|partner\.bitget|affiliate_id/i);
  assert.doesNotMatch(html.replace(/<[^>]*>/g, ""), /payout/i);
  assert.match(html, /data-telegram-anonymous-metrics="[^"]*no partner conversion[^"]*payout[^"]*evidence"/);
});

test("Brazil first viewport shows a clear internal decision path before outbound registration", async () => {
  const undecided = await renderBrazilPage("/br/pix", "?market=BR&product=spot&locale=pt-BR");
  const undecidedPath = undecided.match(/<div class="br-decision-path"[\s\S]*?<\/ol><\/div>/)?.[0] || "";
  assert.match(undecided, /class="br-decision-path"/);
  assert.match(undecidedPath, /1\. Verificar Pix\/BRL/);
  assert.match(undecidedPath, /2\. Verificar CPF e elegibilidade/);
  assert.match(undecidedPath, /3\. Escolher plataforma do shortlist/);
  assert.match(undecidedPath, /Escolha Binance ou OKX no shortlist antes de sair da NexuAlpha/);
  assert.match(undecidedPath, /href="#br-shortlist-title"/);
  assert.match(undecidedPath, /data-cta-kind="internal"/);
  assert.doesNotMatch(undecidedPath, /data-cta-kind="registration"/);

  const selected = await renderBrazilPage("/br/pix");
  const selectedPath = selected.match(/<div class="br-decision-path"[\s\S]*?<\/ol><\/div>/)?.[0] || "";
  assert.match(selectedPath, /3\. Continuar cadastro ou pesquisa/);
  assert.match(selectedPath, /Shortlist selecionado: OKX/);
  // Pending BR eligibility follows the source-bound onsite verification route.
  assert.match(selectedPath, /Ver regras da conta primeiro/);
  const anchor = selectedPath.match(/<a[^>]*data-cta-placement="brazil-first-viewport-register"[^>]*>/)?.[0];
  assert.ok(anchor);
  const href = anchor.match(/href="([^"]+)"/)?.[1].replaceAll("&amp;", "&");
  const url = new URL(href, "https://nexualpha.com");
  assert.equal(url.origin, "https://nexualpha.com");
  assert.ok(["/exchanges/okx", "/pt-br/exchanges/okx"].includes(url.pathname));
  assert.equal(url.hash, "#registration-path");
  assert.equal(url.searchParams.get("market"), "BR");
  assert.equal(url.searchParams.get("product"), "spot");
  assert.equal(url.searchParams.get("locale"), "pt-BR");
  assert.match(anchor, /data-cta-kind="research"/);
  assert.doesNotMatch(anchor, /target="_blank"|rel="sponsored/);
  assert.doesNotMatch(selectedPath, /Abrir cadastro oficial|data-cta-kind="registration"/);
});

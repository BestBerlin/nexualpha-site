import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  buildCtaPayload,
  buildCtaVisibilityPayload,
  buildOutboundHandoffPayload,
} from "../src/data/cta-analytics.js";
import { decisionStateFromUrl, writeDecisionStateToUrl } from "../src/data/decision-state.js";
import { regionalVenueCta } from "../src/data/regional-cta.js";
import { createCtaCollector } from "../server/cta-collector.mjs";
import { summarize } from "../server/growth-report.mjs";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const session = "123e4567-e89b-42d3-a456-426614174000";
const eventId = () => randomUUID();

async function renderComponent(source) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-br-funnel-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, source, "utf8");
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

test("BR decision state preserves passport context through the local funnel URLs", async () => {
  const url = "https://nexualpha.com/br?locale=pt-BR&market=BR&product=spot&platform=binance&account_stage=new_account&funding=Pix";
  const state = decisionStateFromUrl(url);
  assert.equal(state.region, "BR");
  assert.equal(state.product, "spot");
  assert.equal(state.platform, "binance");
  assert.equal(state.accountStage, "new_account");
  assert.equal(state.funding, "Pix");

  assert.equal(
    writeDecisionStateToUrl("/br/comparar?locale=pt-BR", state),
    "/br/comparar#nxa-context?market=BR&product=spot&platform=binance&amount=1000&spot_fee_bps=10&deposit_fee_pct=0&deposit_fixed_brl=0&account_stage=new_account&funding=Pix&locale=pt-BR",
  );

  const brHtml = await renderComponent(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { BrazilDecisionPage } from "../../src/components/v3/international/BrazilDecisionPage.jsx";
    const html = renderToStaticMarkup(React.createElement(BrazilDecisionPage, {
      pathname: "/br",
      initialUrl: ${JSON.stringify(url)},
      locale: "pt-BR",
      trackGrowthDecision: () => {},
    }));
    console.log(html);
  `);
  assert.match(brHtml, /href="\/br\/comparar#nxa-context\?[^"]*platform=binance[^"]*amount=1000[^"]*account_stage=new_account[^"]*funding=Pix/);

  const compareHtml = await renderComponent(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { BrazilDecisionPage } from "../../src/components/v3/international/BrazilDecisionPage.jsx";
    const html = renderToStaticMarkup(React.createElement(BrazilDecisionPage, {
      pathname: "/br/comparar",
      initialUrl: "https://nexualpha.com/br/comparar?locale=pt-BR&market=BR&product=spot&platform=binance&account_stage=new_account&funding=Pix",
      locale: "pt-BR",
      trackGrowthDecision: () => {},
    }));
    console.log(html);
  `);
  assert.match(compareHtml, /href="\/rates#nxa-context\?[^"]*market=BR[^"]*product=spot[^"]*account_stage=new_account[^"]*funding=Pix[^"]*locale=pt-BR/);

  const ratesHtml = await renderComponent(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { FeeBenchmarkTerminal } from "../../src/components/v3/FeeBenchmarkTerminal.jsx";
    const html = renderToStaticMarkup(React.createElement(FeeBenchmarkTerminal, {
      locale: "pt-BR",
      market: "BR",
      product: "spot",
      accountStage: "new_account",
      funding: "Pix",
    }));
    console.log(html);
  `);
  assert.match(ratesHtml, /href="\/pt-br\/exchanges\/binance#registration-path\?[^"]*market=BR[^"]*product=spot[^"]*account_stage=new_account[^"]*funding=Pix/);
  assert.match(ratesHtml, /data-cta-placement="rate-benchmark-detail"[^>]*data-growth-account-stage="new_account"[^>]*data-growth-funding="Pix"/);
});

test("BR outbound CTA analytics and JSONL report aggregate passport fields", async () => {
  const cta = regionalVenueCta("binance", "pt-BR", "BR", "spot");
  const anchor = {
    href: cta.ctaHref,
    dataset: {
      ctaPlacement: "registration-card-primary",
      growthMarket: "BR",
      growthProduct: "spot",
      growthAccountStage: "new_account",
      growthFunding: "Pix",
    },
  };
  const location = {
    pathname: "/exchanges/binance",
    search: "?locale=pt-BR&market=BR&product=spot&account_stage=new_account&funding=Pix",
  };
  const document = { documentElement: { lang: "pt-BR" } };
  const common = { anchor, location, document, session, source: "creator.br-01" };
  const visible = buildCtaVisibilityPayload(common);
  const handoff = buildOutboundHandoffPayload(common);
  const click = buildCtaPayload(common);

  for (const payload of [visible, handoff, click]) {
    assert.equal(payload.locale, "pt-BR");
    assert.equal(payload.market, "BR");
    assert.equal(payload.product, "spot");
    assert.equal(payload.accountStage, "new_account");
    assert.equal(payload.funding, "Pix");
  }

  const file = path.join(await mkdtemp(path.join(os.tmpdir(), "br-cta-jsonl-")), "cta.jsonl");
  const collect = createCtaCollector(file, { environment: "test", origin: "https://nexualpha.com" });
  await collect.ready;
  const requestFor = (payload) => new Request("https://nexualpha.com/api/analytics/cta", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://nexualpha.com", "user-agent": "node-test" },
    body: JSON.stringify({ ...payload, eventId: eventId() }),
  });
  assert.equal((await collect(requestFor(visible), "https://nexualpha.com")).status, 204);
  assert.equal((await collect(requestFor(handoff), "https://nexualpha.com")).status, 204);
  assert.equal((await collect(requestFor(click), "https://nexualpha.com")).status, 204);

  const rows = (await readFile(file, "utf8")).trim().split("\n").map((line) => JSON.parse(line));
  const report = summarize(rows, file);
  assert.equal(report.byMarket.find((row) => row.market === "BR")?.outboundHandoffs, 1);
  assert.equal(report.byProduct.find((row) => row.product === "spot")?.outboundHandoffs, 1);
  assert.equal(report.byAccountStage.find((row) => row.accountStage === "new_account")?.outboundHandoffs, 1);
  assert.equal(report.byFunding.find((row) => row.funding === "Pix")?.outboundHandoffs, 1);
});

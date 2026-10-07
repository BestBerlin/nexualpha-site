import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { parsePublicRoute } from "../src/data/locale-routing.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { regionalAeoCoverageSummary } from "../src/data/regional-preview-copy.js";
import { routeInventory } from "../scripts/generate-prerender-manifest.mjs";
import worker, { routeMetadata } from "../worker/index.js";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const forbiddenCommercialTokens = /https?:\/\/(?:www\.)?(?:bsmkweb|partner\.bitget|topzhjdgxcb)|nexu888|11350287|LUCKX|CANDY007|INS898|1836370407|luckybitcoin/i;
const shell = '<!doctype html><html lang="en"><head><title>NexuAlpha</title><meta name="description" content="base"><meta name="robots" content="index,follow"></head><body><main>app</main></body></html>';

function assets() {
  return { fetch: async (request) => new URL(request.url).pathname === "/index.html"
    ? new Response(shell, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } })
    : new Response("missing", { status: 404 }) };
}
function schemas(value) { return Array.isArray(value) ? value : [value].filter(Boolean); }
function schemaOf(value, type) { return schemas(value).find((item) => item?.["@type"] === type); }

async function renderTaiwan() {
  const dir = await mkdtemp(path.join(root, "tests/.tmp-r20-tw-"));
  try {
    const entry = path.join(dir, "entry.mjs");
    const bundle = path.join(dir, "bundle.cjs");
    await writeFile(entry, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { RegionalMarketPreview } from "../../src/components/v3/international/RegionalMarketPreview.jsx";
      console.log(renderToStaticMarkup(React.createElement(RegionalMarketPreview, { market: "TW", locale: "zh-Hant" })));
    `);
    const esbuild = path.join(root, "node_modules/.bin/esbuild");
    await access(esbuild);
    execFileSync(esbuild, [entry, "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundle}`, "--loader:.css=empty", "--log-level=warning"], { cwd: root });
    return execFileSync("node", [bundle], { cwd: root, encoding: "utf8" });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("R20 /tw is a Traditional Chinese owner route and indexed prerender target", () => {
  assert.deepEqual(parsePublicRoute("/tw", new URLSearchParams()), {
    publicPathname: "/tw", contentPathname: "/tw", locale: "zh-Hant", localeSource: "market", isCountryRoute: true, canonicalPathname: "/tw",
  });
  const route = routeInventory([]).find((item) => item.pathname === "/tw");
  assert.deepEqual({ template: route?.template, index: route?.index, locales: route?.locales }, { template: "regionalPreview", index: true, locales: ["zh-Hant"] });
  for (const pathname of ["/tw/comparar", "/tw/costos", "/tw/conta"]) {
    assert.equal(routeInventory([]).find((item) => item.pathname === pathname)?.index, false);
  }
});

test("R20 /tw client and Worker metadata are source-backed, indexable and parity-safe", async () => {
  const client = computeRouteSeo({ url: "/tw", locale: "zh-Hant", route: { name: "regionalPreview", market: "TW" } });
  const server = await routeMetadata(new URL("https://nexualpha.com/tw"), { ASSETS: assets() });
  for (const [label, seo, structured] of [["client", client, client.schemas], ["server", server, server.schema]]) {
    assert.equal(seo.status, 200, label);
    assert.equal(seo.robots, "index,follow", label);
    assert.equal(seo.canonical, "https://nexualpha.com/tw", label);
    assert.equal(seo.locale, "zh-Hant", label);
    assert.match(seo.title, /台灣|金管會|VASP/, label);
    assert.match(seo.description, /公布|施行|登記|新台幣|本人銀行帳戶/, label);
    const page = schemaOf(structured, "WebPage");
    const faq = schemaOf(structured, "FAQPage");
    assert.equal(page?.url, "https://nexualpha.com/tw", label);
    assert.ok(page?.isBasedOn?.some((url) => /GL004301/.test(url)), label);
    assert.ok(page?.isBasedOn?.some((url) => /GL004000/.test(url)), label);
    assert.ok(page?.isBasedOn?.some((url) => /fsc\.gov\.tw\/userfiles/.test(url)), label);
    assert.ok(faq?.mainEntity?.length >= 3, label);
    assert.match(JSON.stringify(faq), /尚未施行|VASP|本人名義銀行帳戶|費用|限額/, label);
    assert.doesNotMatch(JSON.stringify(seo), forbiddenCommercialTokens, label);
  }
  assert.deepEqual(server.alternates, [
    { hreflang: "zh-Hant", href: "https://nexualpha.com/tw" },
    { hreflang: "x-default", href: "https://nexualpha.com/tw" },
  ]);
});

test("R20 /tw visible page explains law-effective and account-result boundaries", async () => {
  const html = await renderTaiwan();
  assert.match(html, /部分條文尚未施行/);
  assert.match(html, /AML／VASP 登記不是帳戶或商品保證/);
  assert.match(html, /新台幣入出金與本人銀行帳戶/);
  assert.match(html, /費用、限額、處理時間/);
  assert.doesNotMatch(html, forbiddenCommercialTokens);
});

test("R20 /tw is discoverable through prerender and LLM generation while deep tools stay noindex", async () => {
  const prerender = await readFile(new URL("../scripts/generate-prerender-manifest.mjs", import.meta.url), "utf8");
  const llms = await readFile(new URL("../scripts/generate-public-llms.mjs", import.meta.url), "utf8");
  assert.match(prerender, /"\/tw": \["zh-Hant"\]/);
  assert.match(llms, /Taiwan FSC, VASP-registration and TWD account-check owner page/);
  assert.match(llms, /tw-fsc-act-effective-boundary/);
  assert.match(llms, /tw-fsc-aml-registration-list/);
  for (const pathname of ["/tw/comparar", "/tw/costos", "/tw/conta"]) {
    const seo = await routeMetadata(new URL(`https://nexualpha.com${pathname}`), { ASSETS: assets() });
    assert.equal(seo.robots, "noindex,follow", pathname);
  }
  const summary = regionalAeoCoverageSummary({ market: "TW", locale: "zh-Hant" });
  assert.match(summary.publicationStatus, /Current public carrier: \/tw\./i);
  assert.doesNotMatch(summary.publicationStatus, /noindex preview/i);
});

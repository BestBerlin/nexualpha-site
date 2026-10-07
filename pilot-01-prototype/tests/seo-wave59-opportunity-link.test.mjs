import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";

const bybitProfileUrl = "https://nexualpha.com/exchanges/bybit";
const bitgetProfileUrl = "https://nexualpha.com/exchanges/bitget";
const protectedPartnerRegistrySha = "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a";

function assets() {
  return { fetch: async () => new Response("missing", { status: 404 }) };
}

function graph(schema) {
  return schema?.["@graph"] || (Array.isArray(schema) ? schema : [schema]);
}

test("Wave59 Bybit-vs-Bitget owner links both venue profiles without route changes", async () => {
  const client = computeRouteSeo({ url: "/compare/bybit-vs-bitget", locale: "en" });
  const worker = await routeMetadata(new URL("https://nexualpha.com/compare/bybit-vs-bitget"), { ASSETS: assets() });
  const clientPage = client.schemas.find((schema) => schema["@type"] === "WebPage");
  const workerPage = graph(worker.schema).find((schema) => schema["@type"] === "WebPage");

  assert.equal(client.status, 200);
  assert.equal(worker.status, 200);
  assert.equal(client.canonical, "https://nexualpha.com/compare/bybit-vs-bitget");
  assert.equal(worker.canonical, client.canonical);
  assert.equal(client.title, "Bybit vs Bitget Stocks, Copy Trading, Fees and Account Checks — NexuAlpha");
  assert.equal(worker.title, client.title);
  assert.equal(client.description, "Compare Bybit and Bitget by product label first: UTA margin, xStocks fee schedule, stock futures, copy-trading profit sharing, KYC, region and signup-route limits.");
  assert.equal(worker.description, client.description);
  assert.equal(client.robots, "index,follow");
  assert.equal(worker.robots, "index,follow");
  assert.ok(clientPage.relatedLink.includes(bybitProfileUrl));
  assert.ok(clientPage.relatedLink.includes(bitgetProfileUrl));
  assert.ok(workerPage.relatedLink.includes(bybitProfileUrl));
  assert.ok(workerPage.relatedLink.includes(bitgetProfileUrl));
  assert.deepEqual(workerPage.relatedLink, clientPage.relatedLink);
});

test("Wave59 internal-link fix preserves the protected partner registry", async () => {
  const source = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
  assert.equal(createHash("sha256").update(source).digest("hex"), protectedPartnerRegistrySha);
});

test("Wave59 Bybit-vs-Bitget first screen separates stock product types with dated sources and next steps", async () => {
  const component = await readFile(new URL("../src/components/v3/V3Pages.jsx", import.meta.url), "utf8");
  const finalChoice = await readFile(new URL("../src/components/v3/CompareFinalChoiceCard.jsx", import.meta.url), "utf8");
  const answers = await readFile(new URL("../src/data/compare-direct-answers.js", import.meta.url), "utf8");

  assert.match(answers, /Official Bybit and Bitget sources reviewed September 22, 2026/);
  assert.match(answers, /\["Bybit xStocks",/);
  assert.match(answers, /\["Bitget stock futures",/);
  assert.match(answers, /\["Copy trading",/);
  assert.match(answers, /FAQ-xStocks-on-Bybit/);
  assert.match(answers, /7700532076057/);
  assert.match(answers, /\/topics\/tokenized-stocks-vs-perpetuals/);
  assert.match(answers, /do not represent ownership of underlying shares/);
  assert.match(finalChoice, /v3-compare-direct-answer__reviewed/);
  assert.match(finalChoice, /v3-compare-direct-answer__product-types/);
});

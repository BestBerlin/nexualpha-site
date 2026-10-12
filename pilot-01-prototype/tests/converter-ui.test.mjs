import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createSsrHarness } from "./helpers/ssr-hydration-harness.mjs";
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
test("converter SSR exposes two labeled inputs, conversion table and buying guide", async () => {
  const result = await harness.render("https://nexualpha.com/convert/btc-to-usd");
  const html = typeof result === "string" ? result : result.html;
  const doc = new JSDOM(html).window.document;
  assert.equal(doc.querySelectorAll("[data-converter] input[type=number]").length, 2);
  assert.equal(doc.querySelectorAll("[data-converter] table tbody tr").length, 8);
  assert.match(doc.querySelector("[data-converter] h1").textContent, /Bitcoin.*USD/);
  assert.ok(doc.querySelector('a[href="/coins/bitcoin"]'));
  assert.ok(doc.querySelector('a[href^="/academy"]'));
  assert.equal(doc.querySelectorAll("[data-converter] details").length, 2);
});
test("foreign fiat SSR waits for FX and labels the source timestamps", async () => {
  const result = await harness.render("https://nexualpha.com/tr/convert/btc-to-try");
  const html = typeof result === "string" ? result : result.html;
  const doc = new JSDOM(html).window.document;
  assert.match(doc.querySelector("[data-converter] h1").textContent, /Bitcoin.*TRY/);
  assert.equal(doc.querySelectorAll("[data-converter] td").length, 8);
  assert.ok([...doc.querySelectorAll("[data-converter] td")].every((node) => node.textContent === "–"));
});

test("rendered referrals retain converter src attribution", async () => {
  const html = await harness.render("https://nexualpha.com/pt-br/convert/btc-to-brl");
  const doc = new JSDOM(html).window.document;
  const links = [...doc.querySelectorAll("[data-converter] a[data-offer-link=go]")];
  assert.ok(links.length > 0);
  for (const link of links) assert.match(link.getAttribute("href"), /^\/go\/(okx|binance)\?src=convert-btc-brl$/);
});

import assert from "node:assert/strict";
import test from "node:test";

import { aeoQuestionsForMarket } from "../src/data/aeo-question-registry.js";
import { internationalSourcesFor } from "../src/data/international-source-registry.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeInventory } from "../scripts/generate-prerender-manifest.mjs";
import { routeMetadata } from "../worker/index.js";

const protectedCommercialTokens = /https?:\/\/(?:www\.)?(?:bsmkweb|partner\.bitget|topzhjdgxcb)|nexu888|11350287|LUCKX|CANDY007|INS898|1836370407|luckybitcoin/i;
const mxDecisionPaths = ["/mx/comparar", "/mx/costos", "/mx/conta"];

function schemas(value) {
  return Array.isArray(value) ? value : [value].filter(Boolean);
}

function faqSchema(value) {
  return schemas(value).find((schema) => schema?.["@type"] === "FAQPage");
}

test("R22 Mexico source authority and AEO questions are natural Spanish and source-linked", () => {
  const registry = internationalSourcesFor("MX");
  const questions = aeoQuestionsForMarket("MX");
  const serialized = JSON.stringify({ registry, questions });

  assert.equal(registry.authority, "Banco de México, CNBV y centros oficiales de ayuda de las plataformas");
  assert.ok(questions.length >= 6);
  for (const path of mxDecisionPaths) {
    assert.ok(questions.some((question) => question.canonicalPath === path), path);
  }
  assert.doesNotMatch(serialized, /help centres|and official platform/i);
  assert.doesNotMatch(serialized, /¿[^?]*\./);
  assert.doesNotMatch(serialized, protectedCommercialTokens);
});

test("R22 Mexico decision pages retain source-backed metadata without premature indexing", () => {
  const inventory = routeInventory([]);

  for (const pathname of mxDecisionPaths) {
    const route = inventory.find((item) => item.pathname === pathname);
    assert.deepEqual({ index: route?.index, locales: route?.locales }, { index: false, locales: ["es"] }, pathname);

    const seo = computeRouteSeo({ url: pathname, locale: "es" });
    const faq = faqSchema(seo.schemas);
    const serialized = JSON.stringify(seo);

    assert.equal(seo.status, 200, pathname);
    assert.equal(seo.robots, "noindex,follow", pathname);
    assert.equal(seo.canonical, `https://nexualpha.com${pathname}`, pathname);
    assert.equal(seo.locale, "es", pathname);
    assert.deepEqual(seo.alternates, [], pathname);
    assert.ok(faq?.mainEntity?.length >= 3, pathname);
    assert.match(serialized, /Banco de México|CNBV|SPEI|MXN|cuenta oficial/, pathname);
    assert.match(serialized, /https:\/\/www\.banxico\.org\.mx\/servicios\/spei_/i, pathname);
    assert.doesNotMatch(serialized, protectedCommercialTokens, pathname);
    assert.doesNotMatch(serialized, /¿[^?]*\./, pathname);
  }
});

test("R22 Mexico decision pages keep Worker metadata in parity with client SEO", async () => {
  for (const pathname of mxDecisionPaths) {
    const metadata = await routeMetadata(new URL(`https://nexualpha.com${pathname}`), { ASSETS: { fetch: async () => new Response("missing", { status: 404 }) } });
    const faq = faqSchema(metadata.schema);
    const serialized = JSON.stringify(metadata);

    assert.equal(metadata.status, 200, pathname);
    assert.equal(metadata.robots, "noindex,follow", pathname);
    assert.equal(metadata.canonical, `https://nexualpha.com${pathname}`, pathname);
    assert.equal(metadata.locale, "es", pathname);
    assert.ok(faq?.mainEntity?.length >= 3, pathname);
    assert.match(serialized, /SPEI|MXN|cuenta oficial/, pathname);
    assert.doesNotMatch(serialized, protectedCommercialTokens, pathname);
    assert.doesNotMatch(serialized, /¿[^?]*\./, pathname);
  }
});

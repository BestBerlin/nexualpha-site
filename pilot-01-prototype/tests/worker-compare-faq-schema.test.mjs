import assert from "node:assert/strict";
import test from "node:test";

import worker from "../worker/index.js";
import { compareFaqSchemaEntries } from "../src/data/compare-faq-locales.js";
import { compareDirectAnswerFor } from "../src/data/compare-direct-answers.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";

const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"];
const shell = "<!doctype html><html><head><title>NexuAlpha</title></head><body><div id=\"root\"></div></body></html>";

const assets = () => ({
  fetch: async (request) => {
    const url = new URL(request.url);
    if (url.pathname === "/index.html") return new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } });
    if (url.pathname === "/prerender-manifest.json") return new Response("missing", { status: 404 });
    return new Response("missing", { status: 404 });
  },
});

async function workerGraph(pathname) {
  const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: assets() });
  assert.equal(response.status, 200, pathname);
  const html = await response.text();
  const json = html.match(/<script id="nexualpha-route-schema"[^>]*>(.*?)<\/script>/)?.[1];
  assert.ok(json, `${pathname}: route JSON-LD should be injected by the Worker`);
  const payload = JSON.parse(json);
  return payload["@graph"] || (Array.isArray(payload) ? payload : [payload]);
}

function faqPages(graph) {
  const pages = [];
  for (const node of graph) {
    if (node?.["@type"] === "FAQPage") pages.push(node);
    if (node?.subjectOf?.["@type"] === "FAQPage") pages.push(node.subjectOf);
  }
  return pages;
}

const qaPairs = (faq) => faq.mainEntity.map((entry) => [entry.name, entry.acceptedAnswer.text]);

test("Worker compare JSON-LD matches the visible support-owner or generic FAQ for every supported locale", async () => {
  for (const locale of locales) {
    const route = localizedPath("/compare/uniswap-vs-jupiter", locale);
    const graph = await workerGraph(route);
    const faqs = faqPages(graph);
    assert.ok(faqs.length >= 1, `${locale}: Worker JSON-LD should include FAQPage`);
    const supportAnswer = compareDirectAnswerFor("uniswap-vs-jupiter", locale);
    const expected = locale === "en" && supportAnswer
      ? [[supportAnswer.seoQuestion, supportAnswer.body], ...supportAnswer.faq]
      : compareFaqSchemaEntries(locale, { nameA: "Uniswap", nameB: "Jupiter" });
    for (const faq of faqs) {
      assert.deepEqual(qaPairs(faq), expected, `${locale}: Worker FAQ JSON-LD should match shared compareFaqSchemaEntries`);
    }
  }
});

test("Worker priority Bybit vs Bitget JSON-LD keeps complete source-backed FAQ for reviewed locales", async () => {
  for (const locale of ["en", "zh-Hans", "zh-Hant", "ja", "ko", "tr", "pt-BR"]) {
    const route = localizedPath("/compare/bybit-vs-bitget", locale);
    const graph = await workerGraph(route);
    const faqs = faqPages(graph);
    assert.ok(faqs.length >= 1, `${locale}: priority comparison should include FAQPage`);
    const answer = compareDirectAnswerFor("bybit-vs-bitget", locale);
    const expected = [[answer.seoQuestion, answer.body], ...answer.faq];
    for (const faq of faqs) {
      assert.deepEqual(qaPairs(faq), expected, `${locale}: priority Worker FAQ should use complete compare direct answer entries`);
      assert.equal(faq.mainEntity.length, expected.length, `${locale}: priority FAQ should not append generic or legacy entries`);
    }
  }
});

test("Worker R36 priority comparison JSON-LD matches direct-answer FAQ in expanded locales", async () => {
  for (const slug of ["binance-vs-okx", "bybit-vs-bitget", "hyperliquid-vs-dydx"]) {
    for (const locale of ["ja", "ko", "tr", "pt-BR"]) {
      const route = localizedPath(`/compare/${slug}`, locale);
      const graph = await workerGraph(route);
      const faqs = faqPages(graph);
      assert.ok(faqs.length >= 1, `${slug} ${locale}: priority comparison should include FAQPage`);
      const answer = compareDirectAnswerFor(slug, locale);
      const expected = [[answer.seoQuestion, answer.body], ...answer.faq];
      for (const faq of faqs) {
        assert.deepEqual(qaPairs(faq), expected, `${slug} ${locale}: Worker FAQ should use direct answer entries`);
        assert.equal(faq.mainEntity.length, expected.length, `${slug} ${locale}: Worker FAQ should not append generic entries`);
      }
    }
  }
});

test("Worker curated comparison JSON-LD uses the same FAQ source as the client", async () => {
  for (const route of ["/compare/binance-vs-okx", "/compare/hyperliquid-vs-dydx"]) {
    const client = computeRouteSeo({ url: route, locale: "en" });
    const clientPage = client.schemas.find((schema) => schema["@type"] === "WebPage");
    const expected = qaPairs(clientPage.subjectOf);
    const graph = await workerGraph(route);
    const workerPage = graph.find((schema) => schema["@type"] === "WebPage");
    const faqs = faqPages(graph);

    assert.deepEqual(qaPairs(workerPage.subjectOf), expected, `${route}: Worker subjectOf FAQ should match client`);
    assert.notEqual(workerPage.subjectOf.mainEntity[0].name, "Which fees should I compare first?", `${route}: Worker should use the complete compare FAQ override that also owns the client`);
    for (const faq of faqs) {
      assert.deepEqual(qaPairs(faq), expected, `${route}: every Worker FAQPage should match client`);
    }
  }
});

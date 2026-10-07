import test from "node:test";
import assert from "node:assert/strict";
import { buildPriorityOwnerReport, inspectPriorityOwnerPage, renderMarkdown, resolvePrerenderAsset } from "../scripts/priority-owner-page-contract.mjs";

const goodHtml = `
  <link rel="canonical" href="https://nexualpha.com/br/pix">
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Compare Pix e BRL antes do cadastro",
    url: "https://nexualpha.com/br/pix",
    inLanguage: "pt-BR",
    dateModified: "2026-09-22",
    author: { "@type": "Organization", name: "NexuAlpha Research Desk" },
    publisher: { "@type": "Organization", name: "NexuAlpha" },
    isBasedOn: [
      "https://www.binance.com/pt-BR/support/faq/detail/53636607eebc42dbb513863b49bba98f",
      "https://www.okx.com/help/how-do-i-deposit-brl",
      "https://www.bcb.gov.br/estabilidadefinanceira/perguntaserespostaspix",
    ],
  })}</script>
  <main><h1>Compare Pix e BRL antes do cadastro</h1><p>Compare cadastro, conta, taxa, fontes e decisão antes de escolher uma corretora para usar Pix no Brasil.</p>
  <time datetime="2026-09-22">22 set 2026</time>
  <a href="https://www.bcb.gov.br/pix">Fonte oficial</a>
  <a href="/br/comparar" data-cta-kind="internal" data-cta-placement="brazil-owner-next-action" data-growth-decision="compare">Comparar alternativas</a>
  <a href="/br/custos">Ver custos</a><a href="/br/conta">Ver conta</a>
  <a href="https://t.me/NexuAlphaAssistantBot?start=compare">Levar para o Telegram</a></main>`;

test("resolves a manifest asset without guessing a path", () => {
  const manifest = { routes: { "/br/pix|pt-BR": { asset: "/prerender/pt-BR/br/pix.json" } } };
  assert.equal(resolvePrerenderAsset({ pathname: "/br/pix", locale: "pt-BR", manifest }), "/prerender/pt-BR/br/pix.json");
  assert.equal(resolvePrerenderAsset({ pathname: "/missing", locale: "en", manifest }), null);
});

test("audits an answer-first Portuguese decision page", () => {
  const result = inspectPriorityOwnerPage({ url: "https://nexualpha.com/br/pix", html: goodHtml, locale: "pt-BR", published: true });
  assert.deepEqual(result.gaps, []);
  assert.equal(result.checks.methodExplanation, true);
  assert.equal(result.checks.englishFallbackAbsent, true);
  assert.equal(result.checks.portugueseContent, true);
});

test("detects JSON-LD owner attribution for priority owner pages", () => {
  const result = inspectPriorityOwnerPage({ url: "https://nexualpha.com/br/pix", html: goodHtml, locale: "pt-BR", published: true });
  assert.equal(result.checks.schemaOwnerAttribution, true);
});

test("requires a source-derived schema review date for priority owner pages", () => {
  const html = goodHtml.replace('"dateModified":"2026-09-22",', "");
  const result = inspectPriorityOwnerPage({ url: "https://nexualpha.com/br/pix", html, locale: "pt-BR", published: true });
  assert.ok(result.gaps.includes("schemaReviewDate"));
});

test("requires two to four main sources in WebPage schema for priority owner pages", () => {
  const html = goodHtml.replace(/"isBasedOn":\[[^\]]+\]/, '"isBasedOn":["https://www.binance.com/pt-BR/support/faq/detail/53636607eebc42dbb513863b49bba98f"]');
  const result = inspectPriorityOwnerPage({ url: "https://nexualpha.com/br/pix", html, locale: "pt-BR", published: true });
  assert.ok(result.gaps.includes("schemaMainSources"));
});

test("reports missing decision evidence rather than treating it as zero quality", () => {
  const result = inspectPriorityOwnerPage({ url: "https://nexualpha.com/exchanges/example", html: "<main><h1>Example</h1><p>Short.</p></main>", locale: "en", published: false });
  assert.ok(result.gaps.includes("indexablePublication"));
  assert.ok(result.gaps.includes("reviewDate"));
  assert.ok(result.gaps.includes("methodExplanation"));
  assert.equal(result.checks.portugueseContent, null);
});

test("builds a bounded report from priority-owner rows only", () => {
  const backlog = { rows: [
    { url: "https://nexualpha.com/br/pix", path: "/br/pix", bucket: "priority-owners" },
    { url: "https://nexualpha.com/exchanges/other", path: "/exchanges/other", bucket: "supporting-pages" },
  ] };
  const manifest = { routes: { "/br/pix|pt-BR": { asset: "/prerender/pt-BR/br/pix.json" } } };
  const report = buildPriorityOwnerReport({ backlog, manifest, readAsset: () => JSON.stringify({ html: goodHtml }), publishedUrls: new Set(["https://nexualpha.com/br/pix"]) });
  assert.equal(report.summary.pages, 1);
  assert.equal(report.summary.audited, 1);
  assert.match(renderMarkdown(report), /\/br\/pix/);
  assert.doesNotMatch(renderMarkdown(report), /exchanges\/other/);
});

test("builds owner schema checks from route metadata when prerendered HTML has no head", () => {
  const backlog = { rows: [
    { url: "https://nexualpha.com/br/pix", path: "/br/pix", bucket: "priority-owners" },
  ] };
  const manifest = { routes: { "/br/pix|pt-BR": { asset: "/prerender/pt-BR/br/pix.json" } } };
  const bodyOnlyHtml = goodHtml.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, "");
  const schemas = [{
    "@type": "WebPage",
    dateModified: "2026-09-22",
    author: { name: "NexuAlpha Research Desk" },
    publisher: { name: "NexuAlpha" },
    isBasedOn: [
      "https://www.binance.com/pt-BR/support/faq/detail/53636607eebc42dbb513863b49bba98f",
      "https://www.okx.com/help/how-do-i-deposit-brl",
    ],
  }];
  const report = buildPriorityOwnerReport({
    backlog,
    manifest,
    readAsset: () => JSON.stringify({ html: bodyOnlyHtml }),
    metadataForRoute: () => ({ schemas }),
    publishedUrls: new Set(["https://nexualpha.com/br/pix"]),
  });
  assert.equal(report.summary.pagesWithGaps, 0);
});

test("flags duplicated direct answers across priority owner pages", () => {
  const backlog = { rows: [
    { url: "https://nexualpha.com/br/pix", path: "/br/pix", bucket: "priority-owners" },
    { url: "https://nexualpha.com/br/saque-pix", path: "/br/saque-pix", bucket: "priority-owners" },
  ] };
  const manifest = { routes: {
    "/br/pix|pt-BR": { asset: "/prerender/pt-BR/br/pix.json" },
    "/br/saque-pix|pt-BR": { asset: "/prerender/pt-BR/br/saque-pix.json" },
  } };
  const report = buildPriorityOwnerReport({ backlog, manifest, readAsset: () => JSON.stringify({ html: goodHtml }), publishedUrls: new Set(["https://nexualpha.com/br/pix", "https://nexualpha.com/br/saque-pix"]) });
  assert.equal(report.summary.pagesWithGaps, 2);
  assert.equal(report.summary.gapCounts.differentiatedDirectAnswer, 2);
  assert.ok(report.pages.every((page) => page.gaps.includes("differentiatedDirectAnswer")));
});

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import worker, { routeMetadata } from "../worker/index.js";
import { BRAZIL_PAGES } from "../src/data/brazil-market.js";
import { getBrazilSeo } from "../src/data/brazil-seo.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";

const origin = "https://nexualpha.com";
const expectedPartnerHash = "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a";

function assets() {
  return {
    fetch: async (request) => {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/content/brazil-metadata.json") {
        return Response.json({
          version: 1,
          pages: Object.fromEntries(BRAZIL_PAGES.map((page) => [page.path, getBrazilSeo(page.path)])),
        });
      }
      return new Response("missing", { status: 404 });
    },
  };
}

test("Wave16 Japanese Binance metadata no longer falls back to English generic copy", async () => {
  const client = computeRouteSeo({ url: "/ja/exchanges/binance" });
  const server = await routeMetadata(new URL(`${origin}/ja/exchanges/binance`), { ASSETS: assets() });

  assert.equal(client.status, 200);
  assert.equal(server.status, 200);
  assert.equal(server.title, client.title);
  assert.equal(server.description, client.description);
  assert.equal(client.locale, "ja");
  assert.match(client.title, /日本向け手数料・本人確認/);
  assert.match(client.description, /公式手数料表/);
  assert.doesNotMatch(client.description, /trading fees, products, account requirements/i);

  const faq = client.schemas.find((schema) => schema["@type"] === "FAQPage");
  assert.ok(faq);
  assert.equal(faq.inLanguage, "ja");
  assert.match(JSON.stringify(faq.mainEntity), /Binanceを日本語で確認/);
  assert.match(JSON.stringify(client.schemas), /https:\/\/www\.binance\.com\/en\/fee\/trading/);
  assert.doesNotMatch(`${client.title}\n${client.description}\n${JSON.stringify(client.schemas)}`, /private commission|invite code|referral link|nexu888|11350287/i);
});

test("Wave16 Brazil AEO answers expose deposit, withdrawal, fee formula and benefit boundary in visible-data source", () => {
  const byPath = Object.fromEntries(BRAZIL_PAGES.map((page) => [page.path, page]));

  assert.match(byPath["/br/pix"].answer, /BRL\/Pix, CPF ou CNPJ, titularidade, limite, taxa, prazo e status/);
  assert.ok(byPath["/br/pix"].sections.some((section) => section.title === "Depósito e saque não são a mesma decisão"));
  assert.ok(byPath["/br/pix"].aeoAnswers.find((answer) => answer.id === "br-pix-deposit").table.some((row) => /tela final/.test(row.check)));

  assert.match(byPath["/br/custos"].answer, /valor × taxa spot em bps ÷ 10\.000/);
  assert.ok(byPath["/br/custos"].sections.some((section) => section.title === "O que a conta não cobre"));
  assert.ok(byPath["/br/custos"].aeoAnswers.find((answer) => answer.id === "br-fee-estimate").table.some((row) => row.item === "Diferença real"));

  assert.match(byPath["/br/conta"].answer, /link de parceiro, código de indicação, campanha e benefício/);
  assert.ok(byPath["/br/conta"].sections.some((section) => section.title === "Separar link, código e benefício"));
  assert.ok(byPath["/br/conta"].aeoAnswers.find((answer) => answer.id === "br-referral-boundary").table.some((row) => row.item === "Campanha"));
});

test("Wave16 Brazil FAQ schema stays aligned to visible AEO answers", () => {
  for (const pathname of ["/br/pix", "/br/custos", "/br/conta"]) {
    const page = BRAZIL_PAGES.find((row) => row.path === pathname);
    const seo = getBrazilSeo(pathname);
    const faq = seo.schemas.find((schema) => schema["@type"] === "FAQPage");
    const visibleQuestions = [...new Set([...(page.faq || []), ...(page.aeoAnswers || [])].map((row) => row.question))];

    assert.deepEqual(faq.mainEntity.map((row) => row.name), visibleQuestions, pathname);
    assert.doesNotMatch(JSON.stringify(seo.schemas), /private commission|nexu888|11350287/i, pathname);
  }
});

test("Wave16 keeps invitation registry immutable", async () => {
  const body = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
  const hash = createHash("sha256").update(body).digest("hex");
  assert.equal(hash, expectedPartnerHash);
});

test("Wave17 Korea regional AEO metadata is source-backed and public-safe", () => {
  const seo = computeRouteSeo({
    url: "https://nexualpha.com/kr?locale=ko",
    locale: "ko",
    route: { name: "regionalPreview", market: "KR" },
  });

  assert.equal(seo.robots, "index,follow");
  assert.equal(seo.canonical, "https://nexualpha.com/kr?locale=ko");
  assert.deepEqual(seo.alternates.map((item) => item.hreflang), ["ko", "x-default"]);
  assert.match(seo.title, /본인확인, 원화 입출금과 상품 범위/);
  assert.ok(seo.schemas.some((schema) => schema["@type"] === "FAQPage"));
  assert.match(JSON.stringify(seo.schemas), /금융위원회|금융정보분석원|실명확인 계좌/);
  assert.doesNotMatch(`${seo.title}\n${seo.description}\n${JSON.stringify(seo.schemas)}`, /private commission|invite code|referral link|nexu888|11350287/i);
});

test("Wave17 Worker publishes the Korean regional page as one Korean canonical", async () => {
  const metadata = await routeMetadata(new URL("https://nexualpha.com/kr?locale=ko"), { ASSETS: assets() });

  assert.equal(metadata.locale, "ko");
  assert.equal(metadata.robots, "index,follow");
  assert.equal(metadata.canonical, "https://nexualpha.com/kr?locale=ko");
  assert.deepEqual(metadata.alternates.map((item) => item.hreflang), ["ko", "x-default"]);
  assert.match(metadata.title, /본인확인, 원화 입출금과 상품 범위/);
  assert.match(JSON.stringify(metadata.schema), /금융위원회|금융정보분석원|실명확인 계좌/);
});

test("Wave17 Korea regional page keeps non-Korean variants out of the index", async () => {
  const clientSeo = computeRouteSeo({
    url: "https://nexualpha.com/kr?locale=en",
    locale: "en",
    route: { name: "regionalPreview", market: "KR" },
  });
  const workerSeo = await routeMetadata(new URL("https://nexualpha.com/kr?locale=en"), { ASSETS: assets() });

  assert.equal(clientSeo.robots, "noindex,follow");
  assert.equal(workerSeo.robots, "noindex,follow");
  assert.deepEqual(workerSeo.alternates, []);
});

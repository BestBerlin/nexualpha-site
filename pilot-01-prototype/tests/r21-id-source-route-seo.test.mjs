import assert from "node:assert/strict";
import test from "node:test";

import { aeoQuestionsForMarket } from "../src/data/aeo-question-registry.js";
import { directoryContext } from "../src/data/directory-context.js";
import { internationalSourcesFor } from "../src/data/international-source-registry.js";
import { resolveMarketPolicy } from "../src/data/market-policy.js";
import { regionalFundingRowsForMarket } from "../src/data/regional-funding-verification-matrix.js";
import { regionalAeoCoverageSummary } from "../src/data/regional-preview-copy.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeInventory } from "../scripts/generate-prerender-manifest.mjs";
import worker, { routeMetadata } from "../worker/index.js";

const forbiddenCommercialTokens = /https?:\/\/(?:www\.)?(?:bsmkweb|partner\.bitget|topzhjdgxcb)|nexu888|11350287|LUCKX|CANDY007|INS898|1836370407|luckybitcoin/i;

test("R21 Indonesia sources and funding row keep regulator, account and referral outcomes separate", () => {
  const pack = internationalSourcesFor("ID");
  const [funding] = regionalFundingRowsForMarket("ID");
  assert.match(pack.authority, /OJK.*Bappebti/);
  assert.ok(pack.sources.some((item) => /ojk\.go\.id/.test(item.url)));
  assert.ok(pack.sources.some((item) => /bappebti\.go\.id/.test(item.url)));
  assert.ok(pack.sources.some((item) => /support\.tokocrypto\.com/.test(item.url)));
  assert.equal(funding.id, "id-idr-va-qris");
  assert.equal(funding.locale, "id");
  assert.equal(funding.fiatCurrency, "IDR");
  assert.match(funding.accountScreenChecks.join(" "), /OJK\/Bappebti|VA bank|QRIS|deposit dan penarikan|spot, futures/);
  assert.match(funding.unknowns.join(" "), /KYC|VA bank|QRIS|biaya|batas|waktu proses|referral|promosi/);
  assert.match(funding.cannotPromise, /Tidak membuktikan persetujuan akun|atribusi pendaftaran/);
  assert.doesNotMatch(JSON.stringify({ pack, funding }), forbiddenCommercialTokens);
});

test("R21 Indonesia policy, questions and visible carrier are Indonesian and research-only", () => {
  const policy = resolveMarketPolicy({ market: "ID" });
  const context = directoryContext({ market: "ID" });
  const questions = aeoQuestionsForMarket("ID");
  const summary = regionalAeoCoverageSummary({ market: "ID", locale: "id", questions, registry: internationalSourcesFor("ID") });
  assert.equal(policy.defaultLocale, "id");
  assert.equal(policy.payment.applicable, false);
  assert.ok(policy.payment.modes.includes("IDR"));
  assert.ok(policy.payment.modes.includes("QRIS"));
  assert.equal(policy.offer.shareableToUsers, false);
  assert.equal(policy.offer.confidence, "research-only");
  assert.equal(context.locale, "id");
  assert.ok(context.terms.includes("ojk"));
  assert.ok(questions.length >= 2);
  assert.ok(questions.every((item) => item.locale === "id" && item.status === "source-linked"));
  assert.match(summary.publicationStatus, /Rute publik saat ini: \/id\./);
  assert.doesNotMatch(summary.publicationStatus, /noindex preview/i);
});

test("R21 /id is an Indonesian indexable owner page with client and Worker parity", async () => {
  const route = routeInventory([]).find((item) => item.pathname === "/id");
  assert.deepEqual({ template: route?.template, index: route?.index, locales: route?.locales }, { template: "regionalPreview", index: true, locales: ["id"] });
  const client = computeRouteSeo({ url: "/id", locale: "id", route: { name: "regionalPreview", market: "ID" } });
  const server = await routeMetadata(new URL("https://nexualpha.com/id"), { ASSETS: { fetch: async () => new Response("missing", { status: 404 }) } });
  for (const [label, seo] of [["client", client], ["server", server]]) {
    assert.equal(seo.status, 200, label);
    assert.equal(seo.robots, "index,follow", label);
    assert.equal(seo.canonical, "https://nexualpha.com/id", label);
    assert.equal(seo.locale, "id", label);
    assert.match(seo.title, /Indonesia|OJK|Bappebti|IDR/, label);
    assert.match(seo.description, /OJK|Bappebti|IDR|VA|QRIS|KYC/, label);
    assert.doesNotMatch(JSON.stringify(seo), forbiddenCommercialTokens, label);
  }
  assert.deepEqual(server.alternates, [
    { hreflang: "id", href: "https://nexualpha.com/id" },
    { hreflang: "x-default", href: "https://nexualpha.com/id" },
  ]);
});

test('restored country roots stay separate from retired locale prefixes in inventory and Worker HTML', async () => {
  const shell = '<!doctype html><html lang="en"><head><title>base</title></head><body><main>app</main></body></html>';
  const env = { ASSETS: { fetch: async () => new Response(shell, { headers: { 'content-type': 'text/html; charset=utf-8' } }) } };
  for (const [pathname, locale] of [['/id', 'id'], ['/jp', 'ja'], ['/kr', 'ko']]) {
    const route = routeInventory([]).find((item) => item.pathname === pathname);
    assert.equal(route?.template, 'regionalPreview');
    assert.equal(route.index, true);
    assert.deepEqual(route.locales, [locale]);
    const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: 'text/html' } }), env);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.ok(html.includes(`rel="canonical" href="https://nexualpha.com${pathname}"`), `${pathname} remains self canonical`);
    assert.match(html, /name="robots" content="index,follow"/);
    assert.ok(html.includes(`lang="${locale}"`), `${pathname} renders its owner locale`);
  }
});

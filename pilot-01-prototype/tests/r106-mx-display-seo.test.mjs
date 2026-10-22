import { budgetTitle, clampMetaDescription } from '../src/data/meta-description.js';
import assert from "node:assert/strict";
import test from "node:test";
import { computeRouteSeo } from "../src/data/seo-injection.js";

const englishCases = [
  // Class b: 3c54a66 budgets long head titles by removing the brand suffix.
  {
    url: "/mx?locale=en",
    route: { name: "regionalPreview", market: "MX" },
    title: "Mexico: compare MXN, SPEI and identity before opening an account",
    description: "A Mexico-specific research path that separates SPEI, bank-account ownership, identity checks, product scope and official account conditions before registration.",
    canonical: "https://nexualpha.com/mx",
  },
  {
    url: "/mx/comparar?locale=en",
    route: { name: "regionalDecision", market: "MX", decisionPath: "comparar" },
    title: "Mexico: compare Binance, OKX and other candidates before registration",
    description: "A Mexico comparison page that separates the documented MXN/SPEI route, official domain, identity checks, product scope and account conditions before any CTA.",
    canonical: "https://nexualpha.com/mx/comparar",
  },
  {
    url: "/mx/costos?locale=en",
    route: { name: "regionalDecision", market: "MX", decisionPath: "costos" },
    title: "Mexico: separate spot fee, MXN/SPEI, spread, withdrawal and account conditions",
    description: "A Mexico cost page that turns a registration decision into an editable cost hypothesis, with clear limits between published fees and final account costs.",
    canonical: "https://nexualpha.com/mx/costos",
  },
  {
    url: "/mx/conta?locale=en",
    route: { name: "regionalDecision", market: "MX", decisionPath: "conta" },
    title: "Mexico: account, partner route, code, KYC and benefit before registration",
    description: "A Mexico account page that separates partner link, visible code, benefit, KYC, residence, product and approval before continuing to official registration.",
    canonical: "https://nexualpha.com/mx/conta",
  },
];

const spanishCases = [
  // Class b: 3c54a66 budgets long head titles by removing the brand suffix.
  {
    url: "/mx?locale=es",
    route: { name: "regionalPreview", market: "MX" },
    title: "Investigación cripto en México: MXN y SPEI — NexuAlpha",
    description: "Analiza MXN, SPEI, identidad y condiciones regionales de la cuenta.",
    canonical: "https://nexualpha.com/mx",
    robots: "index,follow",
    schemaTypes: ["BreadcrumbList", "WebPage", "FAQPage"],
  },
  {
    url: "/mx/comparar?locale=es",
    route: { name: "regionalDecision", market: "MX", decisionPath: "comparar" },
    title: "Comparar exchanges en México: MXN, SPEI y cuenta oficial",
    description: "Compara Binance, OKX y otros candidatos para México separando MXN, SPEI, identidad, producto, dominio oficial y condiciones de cuenta antes del registro.",
    canonical: "https://nexualpha.com/mx/comparar",
    robots: "noindex,follow",
    schemaTypes: ["WebPage", "BreadcrumbList", "FAQPage", "WebPage"],
  },
  {
    url: "/mx/costos?locale=es",
    route: { name: "regionalDecision", market: "MX", decisionPath: "costos" },
    title: "Costos cripto en México: MXN, SPEI, spot y tarifa de cuenta",
    description: "Separa comisión spot, coste de entrada MXN/SPEI, spread, retiro, límites y condiciones de cuenta para México antes de registrarte o depositar.",
    canonical: "https://nexualpha.com/mx/costos",
    robots: "noindex,follow",
    schemaTypes: ["WebPage", "BreadcrumbList", "FAQPage", "WebPage"],
  },
  {
    url: "/mx/conta?locale=es",
    route: { name: "regionalDecision", market: "MX", decisionPath: "conta" },
    title: "Cuenta cripto en México: partner, código, beneficio y KYC",
    description: "Distingue enlace de partner, código, beneficio, KYC, residencia, producto y aprobación de cuenta para México antes de seguir una ruta oficial.",
    canonical: "https://nexualpha.com/mx/conta",
    robots: "noindex,follow",
    schemaTypes: ["WebPage", "BreadcrumbList", "FAQPage", "WebPage"],
  },
];

const spanishMetadata = /Comparar exchanges|Costos cripto|Cuenta cripto|Investigación cripto|Compara Binance|Separa comisión|Distingue enlace|¿|Qué|México/;
const spanishFaq = /¿Cómo comparar|¿Qué costes|¿Qué diferencia|¿La calculadora|¿Un enlace|usuario mexicano|cuenta oficial/;
const commercialLeak = /https?:\/\/(?:www\.)?(?:bsmkweb|partner\.bitget|topzhjdgxcb)|nexu888|11350287|LUCKX|CANDY007|INS898|1836370407|luckybitcoin|private commission|commissionrate|payout|佣金比例|返给用户/i;

function schemaTypes(seo) {
  return seo.schemas.filter(schema => !["Organization", "WebSite"].includes(schema["@type"])).map((schema) => schema["@type"]);
}

function schemaLanguages(seo) {
  return seo.schemas.filter(schema => !["Organization", "WebSite"].includes(schema["@type"])).map((schema) => schema.inLanguage).filter(Boolean);
}

function stringify(value) {
  return JSON.stringify(value);
}

test("R106 MX English display SEO is native English while preserving clean Spanish-owner canonicals", () => {
  for (const item of englishCases) {
    const seo = computeRouteSeo({ url: item.url, route: item.route });
    assert.equal(seo.status, 200, item.url);
    assert.equal(seo.robots, "noindex,follow", item.url);
    assert.equal(seo.locale, "en", item.url);
    assert.equal(seo.htmlLocale, "en", item.url);
    assert.equal(seo.title, budgetTitle(item.title), item.url);
    assert.equal(seo.description, clampMetaDescription(item.description), item.url);
    assert.equal(seo.canonical, item.canonical, item.url);
    assert.deepEqual(seo.alternates, [], item.url);
    assert.doesNotMatch(`${seo.title}\n${seo.description}`, spanishMetadata, item.url);
    assert.doesNotMatch(stringify(seo.schemas), spanishFaq, item.url);
    assert.doesNotMatch(`${seo.title}\n${seo.description}\n${stringify(seo.schemas)}`, commercialLeak, item.url);
  }
});

test("R106 MX English decision schemas include only English WebPage and Breadcrumb nodes", () => {
  for (const item of englishCases.filter((row) => row.url !== "/mx?locale=en")) {
    const seo = computeRouteSeo({ url: item.url, route: item.route });
    assert.deepEqual(schemaTypes(seo), ["WebPage", "BreadcrumbList"], item.url);
    assert.deepEqual(schemaLanguages(seo), ["en"], item.url);
    assert.ok(seo.schemas.every((schema) => schema["@type"] !== "FAQPage"), item.url);
    assert.ok(seo.schemas.filter(schema => !["Organization", "WebSite"].includes(schema["@type"])).every((schema) => stringify(schema).includes(item.canonical)), item.url);
  }
});

test("R106 MX Spanish SEO metadata remains unchanged", () => {
  for (const item of spanishCases) {
    const seo = computeRouteSeo({ url: item.url, route: item.route });
    assert.equal(seo.status, 200, item.url);
    assert.equal(seo.robots, item.robots, item.url);
    assert.equal(seo.locale, "es", item.url);
    assert.equal(seo.htmlLocale, "es", item.url);
    assert.equal(seo.title, budgetTitle(item.title), item.url);
    assert.equal(seo.description, clampMetaDescription(item.description), item.url);
    assert.equal(seo.canonical, item.canonical, item.url);
    assert.deepEqual(schemaTypes(seo), item.schemaTypes, item.url);
    assert.ok(schemaLanguages(seo).every((locale) => locale === "es"), item.url);
    assert.match(`${seo.title}\n${seo.description}\n${stringify(seo.schemas)}`, /México|MXN|SPEI/, item.url);
    assert.doesNotMatch(`${seo.title}\n${seo.description}\n${stringify(seo.schemas)}`, commercialLeak, item.url);
  }
});

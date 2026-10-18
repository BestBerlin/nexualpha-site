// Deposit & withdraw hub (出入金), country pages, /crypto-cards, directory filter and venue block (2026-10-15).
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FIAT_CHECKED, FIAT_SOURCES, FIAT_ROWS, FIAT_NEGATIVES, CRYPTO_CARDS } from "../src/data/fiat-rails.generated.js";
import { FIAT_SUMMARY } from "../src/data/fiat-rails-summary.generated.js";
import { FIAT_LABELS } from "../src/data/fiat-labels.js";
import { DEPOSIT_COPY } from "../src/data/deposit-copy.js";
import { DEPOSIT_COUNTRY_SLUGS, DEPOSIT_LOCALES, DEPOSIT_SLUGS, depositPath, parseDepositPath } from "../src/data/deposit-routes.js";
import { DEPOSIT_COUNTRIES, PUSH_ORDER, depositCards, depositCountryModel, depositHubModel, depositRows, depositSignup } from "../src/data/deposit.js";
import { depositRouteSeo, depositSitemapEntries } from "../src/data/deposit-seo.js";
import { localizedHref, localizedPath, parsePublicRoute } from "../src/data/locale-routing.js";
import { NEUTRAL_CTA_LOCALE_LIST } from "../src/data/locale-policy.js";
import { PARTNER_RESTRICTED_COUNTRIES } from "../src/data/partner-geo-policy.generated.js";
import worker from "../worker/index.js";
import { createSsrHarness, SHELL_HTML } from "./helpers/ssr-hydration-harness.mjs";

const PROMO_LOCALES = DEPOSIT_LOCALES.filter((locale) => !NEUTRAL_CTA_LOCALE_LIST.includes(locale));
const allLinks = (model) => [model.cta?.href, ...model.exchanges.map((entry) => entry.signup)].filter(Boolean);

test("every fiat fact has an official https source with a check date", () => {
  assert.ok(FIAT_ROWS.length > 100);
  for (const row of [...FIAT_ROWS, ...FIAT_NEGATIVES, ...CRYPTO_CARDS]) {
    assert.ok(row.s.length, JSON.stringify(row));
    for (const id of row.s) {
      const [url, , checked] = FIAT_SOURCES[id] || [];
      assert.match(url || "", /^https:\/\//, id);
      assert.match(checked || "", /^\d{4}-\d{2}-\d{2}$/, id);
    }
  }
  assert.equal(FIAT_CHECKED, "2026-10-15");
  for (const row of FIAT_ROWS) {
    assert.ok(["card", "bank", "ewallet", "qr", "p2p"].includes(row.k));
    if (row.f) assert.ok(["free", "pct", "flat"].includes(row.f.t));
    if (row.f?.t === "pct") assert.equal(typeof row.f.v, "number");
  }
});

test("generated fiat tables match the in-repo research inputs; the generator reads nothing outside the repo", () => {
  const script = new URL("../scripts/generate-fiat-rails.mjs", import.meta.url);
  const run = spawnSync(process.execPath, [fileURLToPath(script), "--check"], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  assert.doesNotMatch(readFileSync(script, "utf8"), /\/Volumes\/|\/Users\/|nx-agents/);
  const rails = JSON.parse(readFileSync(new URL("../data/research/fiat-rails/rails.json", import.meta.url), "utf8"));
  assert.equal(rails.researched_at, FIAT_CHECKED);
});

test("routes: localized hub slugs, English country slugs, cards path, wrong-locale slug is missing", () => {
  assert.deepEqual(parseDepositPath("/deposit", "en"), { kind: "hub" });
  assert.deepEqual(parseDepositPath("/churujin/brazil", "zh-Hans"), { kind: "country", country: "brazil" });
  assert.equal(parseDepositPath("/deposit", "zh-Hans").kind, "missing");
  assert.equal(parseDepositPath("/deposit/atlantis", "en").kind, "missing");
  assert.equal(parseDepositPath("/deposit/brazil/x", "en").kind, "missing");
  assert.deepEqual(parseDepositPath("/crypto-cards"), { kind: "cards" });
  assert.equal(parseDepositPath("/exchanges"), null);
  assert.equal(localizedHref("/deposit/brazil", { locale: "pt-BR" }), "/pt-br/depositar/brazil");
  assert.equal(localizedHref("/deposit", { locale: "zh-Hans" }), "/zh-hans/churujin");
  assert.equal(parsePublicRoute("/zh-hans/churujin").contentPathname, "/churujin");
  assert.equal(new Set(Object.values(DEPOSIT_SLUGS)).size >= 14, true);
  assert.deepEqual(DEPOSIT_COUNTRIES.map((country) => country.slug), [...DEPOSIT_COUNTRY_SLUGS]);
});

test("copy: every locale carries every key; directory/venue labels mirror the hub copy", () => {
  const keys = (value, prefix = "") => Object.entries(value).flatMap(([key, item]) => (item && typeof item === "object" ? keys(item, `${prefix}${key}.`) : [`${prefix}${key}`]));
  const reference = keys(DEPOSIT_COPY.en).sort();
  for (const locale of DEPOSIT_LOCALES) {
    assert.deepEqual(keys(DEPOSIT_COPY[locale]).sort(), reference, locale);
    const labels = FIAT_LABELS[locale];
    for (const kind of ["card", "bank", "p2p", "cryptoCard"]) assert.equal(labels.method[kind], DEPOSIT_COPY[locale].method[kind], `${locale} ${kind}`);
    assert.equal(labels.filterLabel, DEPOSIT_COPY[locale].filterLabel);
    assert.deepEqual(labels.homeItems, DEPOSIT_COPY[locale].homeItems);
  }
});

test("country rows drop exchanges whose own terms restrict the country", () => {
  for (const country of DEPOSIT_COUNTRIES) {
    for (const row of depositRows(country)) assert.ok(!(PARTNER_RESTRICTED_COUNTRIES[row.x] || []).includes(country.code), `${row.x} ${country.code}`);
  }
  assert.ok(!depositRows(DEPOSIT_COUNTRIES.find((c) => c.code === "JP")).some((row) => row.x === "bitget"));
});

test("sign-up links are code-carrying /go routes in the owner's push order", () => {
  for (const locale of PROMO_LOCALES) {
    for (const slug of DEPOSIT_COUNTRY_SLUGS) {
      for (const link of allLinks(depositCountryModel(slug, locale))) assert.match(link, /^\/go\/[a-z0-9-]+\?src=[a-z0-9_-]+/, `${locale} ${slug}`);
    }
    for (const card of depositCards(locale)) if (card.signup) assert.match(card.signup, /^\/go\/[a-z0-9-]+\?src=crypto-cards/);
  }
  const brazil = depositCountryModel("brazil", "en");
  assert.equal(brazil.cta.slug, "bitget", "Bitget first where it has a two-way local bank route");
  assert.deepEqual(brazil.exchanges.map((e) => e.slug), [...brazil.exchanges.map((e) => e.slug)].sort((a, b) => PUSH_ORDER.indexOf(a) - PUSH_ORDER.indexOf(b)));
  assert.equal(depositCountryModel("eu-sepa", "en").cta.slug, "okx", "EU: Bitget is restricted in member states, OKX next");
  assert.equal(depositSignup("gate-tr", { locale: "en", market: "TR" }), null, "Gate TR is a separate entity without our code");
});

test("neutral locales and Vietnam are information only", () => {
  for (const locale of NEUTRAL_CTA_LOCALE_LIST) {
    for (const slug of DEPOSIT_COUNTRY_SLUGS) {
      const model = depositCountryModel(slug, locale);
      assert.equal(model.cta, null, `${locale} ${slug}`);
      assert.deepEqual(allLinks(model), [], `${locale} ${slug}`);
      for (const note of model.notes) if (note.href) assert.ok(!note.href.startsWith("/go/"), `${locale} ${slug} citation`);
    }
    assert.ok(depositCards(locale).every((card) => !card.signup), locale);
  }
  for (const locale of DEPOSIT_LOCALES) {
    const vietnam = depositCountryModel("vietnam", locale);
    assert.equal(vietnam.cta, null, locale);
    assert.deepEqual(allLinks(vietnam), [], locale);
  }
});

test("Türkiye: no Bitget on the Türkiye page in any locale, nowhere in the tr locale", () => {
  for (const locale of DEPOSIT_LOCALES) {
    const model = depositCountryModel("turkiye", locale);
    assert.ok(!model.exchanges.some((entry) => entry.slug === "bitget"), locale);
    assert.ok(!JSON.stringify(model.answer).includes("Bitget"), locale);
  }
  for (const slug of DEPOSIT_COUNTRY_SLUGS) {
    const model = depositCountryModel(slug, "tr");
    assert.ok(!JSON.stringify({ a: model.answer, s: model.steps, f: model.faqs, e: model.exchanges.map((e) => e.slug), n: model.negatives.map((n) => n.x) }).match(/bitget/i), slug);
  }
  assert.ok(!depositCards("tr").some((card) => card.x === "bitget"));
  assert.ok(!JSON.stringify(depositHubModel("tr")).match(/bitget/i));
  assert.ok(!JSON.stringify(DEPOSIT_COPY.tr).match(/bitget/i));
});

test("unknown facts render nothing: no placeholders in models", () => {
  for (const locale of ["en", "zh-Hans", "pt-BR"]) {
    for (const slug of DEPOSIT_COUNTRY_SLUGS) {
      const text = JSON.stringify(depositCountryModel(slug, locale));
      assert.ok(!/undefined|null %|NaN|\{\w+\}/.test(text.replace(/"(?:href|note|since|published|cta|top|signup)":null/g, "")), `${locale} ${slug}`);
    }
  }
});

test("SEO: hub and cards indexable in every locale; thin or off-language country editions noindex without hreflang", () => {
  for (const locale of DEPOSIT_LOCALES) {
    const hub = depositRouteSeo(depositPath(locale), locale);
    assert.equal(hub.status, 200);
    assert.equal(hub.indexable, true);
    assert.equal(hub.alternates.filter((alt) => alt.hreflang !== "x-default").length, DEPOSIT_LOCALES.length);
    assert.ok(hub.schemas.some((schema) => schema["@type"] === "CollectionPage"));
    const cards = depositRouteSeo("/crypto-cards", locale);
    assert.ok(cards.schemas.some((schema) => schema["@type"] === "ItemList" && schema.itemListElement[0].item["@type"] === "PaymentCard"));
  }
  const nigeria = depositRouteSeo("/deposit/nigeria", "en");
  assert.equal(nigeria.indexable, false, "one sourced route is too thin to index");
  assert.deepEqual(nigeria.alternates, []);
  const brazil = depositRouteSeo("/pt-br/depositar/brazil".replace("/pt-br", ""), "pt-BR");
  assert.equal(brazil.indexable, true);
  assert.ok(brazil.alternates.some((alt) => alt.href === "https://nexualpha.com/pt-br/depositar/brazil"));
  assert.equal(depositRouteSeo("/depositar/brazil", "ja").status, 404);
  assert.ok(!depositRouteSeo("/nap-rut/brazil", "vi").indexable, "Brazil is not a Vietnamese-language page");
  const entries = depositSitemapEntries();
  assert.equal(new Set(entries.map((entry) => entry.loc)).size, entries.length);
  for (const entry of entries) assert.ok(entry.alternates.some((alt) => alt.href === entry.loc), entry.loc);
  assert.ok(entries.length < 120, "progressive rollout: under 120 indexable URLs");
});

test("directory badges and venue summary only use sourced kinds", () => {
  for (const [slug, entry] of Object.entries(FIAT_SUMMARY)) {
    for (const kind of entry.k) assert.ok(["card", "bank", "p2p", "cryptoCard"].includes(kind), slug);
    for (const code of entry.c) assert.ok(FIAT_ROWS.some((row) => row.x === slug && row.c === code), `${slug} ${code}`);
  }
});

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
const assets = { fetch: async (request) => {
  const path = new URL(request.url).pathname;
  if (path === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
  if (path === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  return new Response("missing", { status: 404 });
} };
const fetchPage = async (path) => worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: "text/html" } }), { ASSETS: assets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) });

test("worker serves hub, country and cards pages with SSR body, canonical and schema", async () => {
  for (const [path, page] of [["/deposit", "hub"], ["/zh-hans/churujin", "hub"], ["/pt-br/depositar/brazil", "country"], ["/deposit/eu-sepa", "country"], ["/crypto-cards", "cards"], ["/ja/crypto-cards", "cards"]]) {
    const response = await fetchPage(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, new RegExp(`data-deposit-page="${page}"`), path);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://nexualpha.com${path}"`), path);
    assert.match(html, /application\/ld\+json/, path);
    const doc = new JSDOM(html).window.document;
    for (const link of doc.querySelectorAll("a[href]")) {
      const href = link.getAttribute("href");
      if (/^https?:\/\/(?:www\.)?(?:bitget|okx|binance|bybit|mexc|gate|kraken|coinw|htx)\./.test(href)) assert.fail(`${path}: direct exchange link ${href}`);
    }
  }
  assert.equal((await fetchPage("/zh-hans/deposit")).status, 404);
  assert.equal((await fetchPage("/deposit/atlantis")).status, 404);
});

test("neutral-locale and Türkiye pages render no sign-up button; tr pages never mention Bitget", async () => {
  for (const path of ["/ru/popolnenie/brazil", "/vi/nap-rut/vietnam", "/ar/crypto-cards", "/deposit/vietnam"]) {
    const html = await (await fetchPage(path)).text();
    // The sitewide footer's "Official sites" row is outside the page body (and itself hidden on neutral locales).
    assert.ok(!/data-cta-kind="registration"/.test(html.split('<footer')[0]), path);
    assert.ok(!/href="\/go\//.test(html.split('<footer')[0]), path);
  }
  for (const path of ["/tr/para-yatirma", "/tr/para-yatirma/turkiye", "/tr/crypto-cards", "/deposit/turkiye"]) {
    const html = await (await fetchPage(path)).text();
    const main = new JSDOM(html).window.document.querySelector("main.nxd");
    assert.ok(main, path);
    assert.ok(!/bitget/i.test(main.innerHTML), path);
  }
});

test("exchange profile shows the deposits block; directory carries the method filter", async () => {
  const venue = harness.render("/exchanges/okx");
  assert.match(venue, /id="deposits"/);
  assert.match(venue, /SEPA/);
  const directory = harness.render("/exchanges");
  assert.match(directory, /class="mx-fiat"/);
  assert.match(directory, /nx-fiat-badge--bank/);
});

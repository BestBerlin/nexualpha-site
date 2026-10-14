// Brazil BCB 30-Oct-2026 deadline topic (owner plan 2026-10-12) and the MEXC no-KYC copy fix.
// Page: /pt-br/topics/prazo-banco-central-corretoras-cripto-2026 (Portuguese) and /topics/brazil-crypto-exchange-deadline-2026
// (English); other locales are noindex with translated chrome. Statuses only from official exchange or BCB pages.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { routeInventory } from "../scripts/generate-prerender-manifest.mjs";
import { sitemapLocalesForRoute } from "../scripts/sitemap-publication-policy.mjs";
import { BRAZIL_DEADLINE_PATH_EN, BRAZIL_DEADLINE_PATH_PT } from "../src/data/brazil-vasp-deadline-slugs.js";
import { BRAZIL_STATUS_KEYS, BRAZIL_VASP_STATUS, brazilDeadlineNotice, brazilPromotable, brazilStatusLabel } from "../src/data/brazil-vasp-status.js";
import { brazilDeadlineContent } from "../src/data/brazil-vasp-deadline.js";
import { BRAZIL_DEADLINE_CHROME_LOCALES, brazilDeadlineChrome } from "../src/data/brazil-vasp-deadline-chrome.js";
import { articleClusterLinks, clusterForQuery } from "../src/data/topic-clusters.js";
import { venueDatabase } from "../src/data/venue-database.js";
import { venueKycLevel, venueKycSummary } from "../src/data/venue-kyc-corrections.js";
import { bitgetVsMexc } from "../src/data/compare-pairs/bitget-vs-mexc.js";
import { bybitVsMexc } from "../src/data/compare-pairs/bybit-vs-mexc.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const ALL_LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar"];
const graph = (value) => value?.["@graph"] || (Array.isArray(value) ? value : [value]);
const faqOf = (schemas) => graph(schemas).find((schema) => schema?.["@type"] === "FAQPage");

function render(entries) {
  const dir = mkdtempSync(path.join(root, "tests/.tmp-brazil-deadline-"));
  try {
    writeFileSync(path.join(dir, "entry.jsx"), `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { BrazilDeadlinePage } from "../../src/components/v3/BrazilDeadlinePage.jsx";
      import { BrazilDeadlineNotice } from "../../src/components/v3/BrazilDeadlineNotice.jsx";
      const out = {};
      for (const [kind, locale, slug] of ${JSON.stringify(entries)}) {
        out[kind + ":" + locale + ":" + (slug || "")] = kind === "page"
          ? renderToStaticMarkup(React.createElement(BrazilDeadlinePage, { locale }))
          : renderToStaticMarkup(React.createElement(BrazilDeadlineNotice, { locale, slug, placement: slug ? "venue" : "directory" }));
      }
      console.log(JSON.stringify(out));
    `);
    execFileSync(path.join(root, "node_modules/.bin/esbuild"), [path.join(dir, "entry.jsx"), "--bundle", "--platform=node", "--format=cjs", `--outfile=${dir}/bundle.cjs`, "--loader:.css=empty", "--log-level=error"]);
    return JSON.parse(execFileSync(process.execPath, [path.join(dir, "bundle.cjs")], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("status rows: only allowed statuses, official sources with dates, unknown reads 'Não confirmado'", () => {
  assert.deepEqual(BRAZIL_VASP_STATUS.map((row) => row.slug), ["okx", "binance", "bybit", "bitget", "mexc", "gate-io", "kucoin", "kraken"]);
  const official = /^https:\/\/(www\.okx\.com|www\.binance\.com|announcements\.bybit\.com|www\.bitget\.com|www\.mexc\.com|www\.kucoin\.com|www\.kraken\.com|www\.bcb\.gov\.br|dadosabertos\.bcb\.gov\.br)\//;
  for (const row of BRAZIL_VASP_STATUS) {
    assert.ok(BRAZIL_STATUS_KEYS.includes(row.status), row.slug);
    if (row.source) assert.match(row.source, official, `${row.slug}: official source only`);
    if (row.status !== "unknown") assert.ok(row.source && row.sourceDate, `${row.slug}: a status needs a dated official source`);
    assert.ok(row.note.en && row.note["pt-BR"], row.slug);
  }
  assert.equal(brazilStatusLabel("unknown", "pt-BR"), "Não confirmado");
  for (const locale of ALL_LOCALES) for (const key of BRAZIL_STATUS_KEYS) assert.ok(brazilStatusLabel(key, locale), `${key}/${locale}`);
  assert.equal(brazilPromotable({ status: "leaving" }), false, "an exchange that is leaving is never promoted");
  assert.equal(brazilPromotable({ status: "unknown" }), false);
  assert.equal(brazilPromotable({ status: "authorized" }), true);
});

test("article: pt-BR and en carry the full text with 5-7 FAQs and dated sources; chrome exists in 15 locales", () => {
  for (const locale of ["pt-BR", "en"]) {
    const content = brazilDeadlineContent(locale);
    assert.equal(content.contentLocale, locale);
    assert.ok(content.faq.length >= 5 && content.faq.length <= 7, `${locale}: ${content.faq.length} FAQs`);
    assert.match(`${content.answer} ${content.sections.map((s) => JSON.stringify(s)).join(" ")}`, /30 (de )?outubro de 2026|30 October 2026/);
    for (const source of content.sources) {
      assert.match(source.date, /^\d{4}-\d{2}-\d{2}$/);
      assert.match(source.url, /^https:\/\/(www\.bcb\.gov\.br|dadosabertos\.bcb\.gov\.br|www\.planalto\.gov\.br|normasinternet2\.receita\.fazenda\.gov\.br)\//);
    }
  }
  assert.equal(brazilDeadlineContent("ja").contentLocale, "en");
  assert.deepEqual([...BRAZIL_DEADLINE_CHROME_LOCALES].sort(), [...ALL_LOCALES].sort());
  const english = brazilDeadlineChrome("en");
  for (const locale of ALL_LOCALES.filter((l) => l !== "en")) {
    const chrome = brazilDeadlineChrome(locale);
    assert.notEqual(chrome.tableTitle, english.tableTitle, `${locale}: translated table title`);
    assert.equal(chrome.cols.length, english.cols.length, locale);
  }
});

test("page renders in all 15 locales: one h1, one row per exchange, no partner link for unconfirmed or leaving rows", () => {
  const pages = render(ALL_LOCALES.map((locale) => ["page", locale, null]));
  for (const locale of ALL_LOCALES) {
    const html = pages[`page:${locale}:`];
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, locale);
    const rows = html.match(/<tbody>([\s\S]*?)<\/tbody>/)[1].split(/<tr\b/).slice(1);
    assert.equal(rows.length, BRAZIL_VASP_STATUS.length, locale);
    BRAZIL_VASP_STATUS.forEach((row, index) => {
      assert.ok(rows[index].includes(brazilStatusLabel(row.status, locale).replaceAll("’", "’")), `${locale}: ${row.slug} status label`);
      const hasCta = /data-cta-kind="registration"/.test(rows[index]);
      if (!brazilPromotable(row)) assert.equal(hasCta, false, `${locale}: ${row.slug} must not carry a partner link`);
    });
    if (/data-cta-kind="registration"/.test(html)) {
      assert.ok(html.indexOf("commission-disclosure-line") < html.indexOf("<table"), `${locale}: disclosure above the table`);
    }
    assert.doesNotMatch(html.replace(/<[^>]+>/g, " "), /(?<!\p{L})(best|top|#1|ranked|winner)(?!\p{L})/iu, `${locale}: no ranking words`);
    if (locale !== "en" && locale !== "pt-BR") assert.match(html, /<h1 lang="en"/, `${locale}: English article marked lang=en`);
  }
  assert.match(pages["page:pt-BR:"], /Não confirmado/);
  assert.match(pages["page:pt-BR:"], /href="\/topics\/brazil-crypto-exchange-deadline-2026"/, "pt-BR links the English edition");
  assert.match(pages["page:en:"], /href="\/pt-br\/topics\/prazo-banco-central-corretoras-cripto-2026"/, "en links the Portuguese edition");
});

test("SEO: one indexable edition per slug in both runtimes, cross-slug hreflang, canonical to the edition of the language", async () => {
  const cases = [];
  for (const locale of ALL_LOCALES) {
    cases.push([localizedPath(BRAZIL_DEADLINE_PATH_EN, locale), locale, locale === "en"]);
    cases.push([localizedPath(BRAZIL_DEADLINE_PATH_PT, locale), locale, locale === "pt-BR"]);
  }
  const ptUrl = "https://nexualpha.com/pt-br/topics/prazo-banco-central-corretoras-cripto-2026";
  const enUrl = "https://nexualpha.com/topics/brazil-crypto-exchange-deadline-2026";
  for (const [route, locale, indexable] of cases) {
    const client = computeRouteSeo({ url: route, locale });
    const worker = await routeMetadata(new URL(`https://nexualpha.com${route}`), {});
    assert.equal(client.status, 200, route);
    assert.equal(worker.status, 200, route);
    const robots = indexable ? "index,follow" : "noindex,follow";
    assert.equal(client.robots, robots, `${route} client`);
    assert.equal(worker.robots, robots, `${route} worker`);
    const canonical = locale === "pt-BR" ? ptUrl : enUrl;
    assert.equal(client.canonical, canonical, `${route} client canonical`);
    assert.equal(worker.canonical, canonical, `${route} worker canonical`);
    assert.equal(worker.title, client.title, route);
    assert.deepEqual(faqOf(worker.schema).mainEntity, faqOf(client.schemas).mainEntity, `${route}: FAQ drift`);
    if (indexable) {
      for (const alternates of [client.alternates, worker.alternates]) {
        assert.deepEqual(alternates.map((a) => [a.hreflang, a.href]), [["en", enUrl], ["pt-BR", ptUrl], ["x-default", enUrl]], route);
      }
    }
  }
  const inventory = routeInventory([]);
  const en = inventory.find((r) => r.pathname === BRAZIL_DEADLINE_PATH_EN);
  const pt = inventory.find((r) => r.pathname === BRAZIL_DEADLINE_PATH_PT);
  assert.ok(en?.index && pt?.index);
  assert.deepEqual(sitemapLocalesForRoute(en), ["en"]);
  assert.deepEqual(sitemapLocalesForRoute(pt), ["pt-BR"]);
  const app = readFileSync(path.join(root, "src/App.jsx"), "utf8");
  assert.match(app, /BRAZIL_DEADLINE_SLUGS\.includes\(topicMatch\[1\]\)/);
});

test("topic cluster: Brazil regulation articles and queries reach the edition of the reader's language", () => {
  assert.equal(clusterForQuery("bitget opera no brasil")?.id, "brazil-vasp-deadline");
  assert.equal(clusterForQuery("binance brasil cnpj")?.id, "brazil-vasp-deadline");
  const article = { slug: "x", title: { en: "Brazil central bank VASP authorization deadline explained" } };
  assert.equal(articleClusterLinks(article, "pt-BR").find((l) => l.id === "brazil-vasp-deadline")?.href, "/pt-br/topics/prazo-banco-central-corretoras-cripto-2026");
  assert.equal(articleClusterLinks(article, "en").find((l) => l.id === "brazil-vasp-deadline")?.href, "/topics/brazil-crypto-exchange-deadline-2026");
});

test("exchanges notice: pt-BR only, links the Portuguese edition, names the exchange's status", () => {
  const pages = render([["notice", "pt-BR", "okx"], ["notice", "en", "okx"], ["notice", "pt-BR", "hyperliquid"], ["notice", "pt-BR", null]]);
  assert.match(pages["notice:pt-BR:okx"], /data-brazil-deadline-notice="venue"/);
  assert.match(pages["notice:pt-BR:okx"], /OKX no Brasil: Não confirmado\./);
  assert.match(pages["notice:pt-BR:okx"], /href="\/pt-br\/topics\/prazo-banco-central-corretoras-cripto-2026"/);
  assert.doesNotMatch(pages["notice:pt-BR:okx"], /data-cta-kind="registration"/, "no partner link in the notice");
  assert.equal(pages["notice:en:okx"], "", "other locales show no notice");
  assert.equal(pages["notice:pt-BR:hyperliquid"], "", "venues outside the table show no notice");
  assert.match(pages["notice:pt-BR:"], /30 de outubro de 2026/);
  assert.ok(brazilDeadlineNotice("pt-BR", "kraken")?.venue);
  const venue = readFileSync(path.join(root, "src/components/v3/VenueDetailPage.jsx"), "utf8");
  const staticVenue = readFileSync(path.join(root, "src/components/v3/VenueDetailPageStatic.jsx"), "utf8");
  const notice = readFileSync(path.join(root, "src/components/v3/BrazilDeadlineNotice.jsx"), "utf8");
  assert.match(venue, /<SupportBrazilDeadlineNotice locale=\{locale\} slug=\{profile\.slug\}/);
  assert.match(venue, /<VenueLazyBoundary target=\{'\[data-brazil-deadline-notice="venue"\]'\} prefetch=\{loadBrazilDeadlineNotice\}>/);
  assert.match(staticVenue, /BrazilDeadlineNotice,/, "source SSR wrapper keeps the Brazil notice component wired statically");
  assert.match(notice, /placement = "directory"/);
});

test("MEXC KYC copy: identity verification is required, no numeric no-KYC limit anywhere outside articles", () => {
  // venue-database.js is hash-pinned (r76); the sourced correction is applied by the readers.
  assert.equal(venueKycLevel("mexc", venueDatabase.mexc), "mandatory");
  assert.match(venueKycSummary("mexc", venueDatabase.mexc).en, /mexc\.com\/terms/);
  assert.equal(venueKycLevel("okx", venueDatabase.okx), venueDatabase.okx.kycLevel, "other venues keep the registry value");
  for (const file of ["src/components/v3/VenueYellowPages.jsx", "src/components/v3/VenueFaqSection.jsx"]) {
    assert.match(readFileSync(path.join(root, file), "utf8"), /venue-kyc-corrections\.js/, `${file} applies the correction`);
  }
  const files = ["src/data/factbook-registry.js", "src/data/compare-pairs/bitget-vs-mexc.js", "src/data/compare-pairs/bybit-vs-mexc.js", "worker/index.js"];
  for (const file of files) {
    const text = readFileSync(path.join(root, file), "utf8");
    assert.doesNotMatch(text, /Unverified[^\n]{0,40}\d+\s?BTC|免实名提现\s?\d|KYC optional for standard crypto|小额提币可?免 ?KYC|Optional KYC for (crypto-only|basic)/, file);
  }
  for (const pair of [bitgetVsMexc, bybitVsMexc]) {
    for (const [locale, entry] of Object.entries(pair)) {
      const text = JSON.stringify(entry);
      assert.doesNotMatch(text, /optional for standard crypto|opcional para (el )?uso|facultativ[ae] pour|isteğe bağlı (kalır|kalıyor|tutar)|限额内可以不做|限額內可不做|任意のまま|선택 사항입니다|остаётся необязательной|opsional untuk penggunaan|tùy chọn cho sử dụng|facoltativa per l’uso|اختيارياً للاستخدام/, `${locale}: optional-KYC claim`);
      assert.match(text, /mexc\.com\/terms/, `${locale}: FAQ cites the MEXC User Agreement`);
    }
  }
});

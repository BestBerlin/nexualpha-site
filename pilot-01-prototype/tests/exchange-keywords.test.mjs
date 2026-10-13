// Owner exchange keyword plan 2026-10-11 (docs/company/exchange-keyword-map-2026-10-11.md): localized referral FAQ on
// the target profiles, "código de convite" for pt-BR, Hyperliquid fees / referral / funded-account answers, Backpack
// tokenized-stocks section and French "avis" answers, /topics/bybit-alternatives, and the Turkish SPK allow-list.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { REFERRAL_PARTNERS } from "../src/data/referral-partners.generated.js";
import { referralSeoFor, referralTitleAllowed } from "../src/data/referral-seo.js";
import { TURKEY_PROMOTED_PARTNERS } from "../src/data/partner-geo-restrictions.js";
import { PARTNER_VENUE_FAQ_LOCAL_TARGETS, partnerVenueFaqFor } from "../src/data/partner-venue-faq.js";
import { HYPERLIQUID_FEE_TIERS, VENUE_KEYWORD_SECTION_LOCALES, BACKPACK_STOCKS_LOCALES, backpackStocksCopy } from "../src/data/venue-keyword-sections.js";
import { VENUE_ALTERNATIVE_PAGES, venueAlternativePage, venueAlternativeRows } from "../src/data/venue-alternatives.js";
import { VENUE_ALTERNATIVE_SLUGS } from "../src/data/venue-alternative-slugs.js";
import { feeDisplay } from "../src/data/exchange-facts.js";
import { budgetTitle, titleBudgetForLocale } from "../src/data/meta-description.js";
import { buildSplitSitemaps, routeInventory } from "../scripts/generate-prerender-manifest.mjs";
import { loadSearchPublicationBaseline, sitemapLocalesForRoute } from "../scripts/sitemap-publication-policy.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const ALL_LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"];
const graph = (value) => value?.["@graph"] || (Array.isArray(value) ? value : [value]);
const faqOf = (schemas) => graph(schemas).find((schema) => schema?.["@type"] === "FAQPage");
const codeOf = (slug) => REFERRAL_PARTNERS.find((p) => p.slug === slug)?.inviteCode;
const decode = (v) => v.replaceAll("&amp;", "&").replaceAll("&#x27;", "'").replaceAll("&quot;", '"').replaceAll("&lt;", "<").replaceAll("&gt;", ">");
const text = (html) => decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const NEVER_SEC = /SEC[- ]approved|approved by the SEC|SEC[- ]licensed|licensed by the SEC|SEC[- ]registered exchange/i;

test("Turkish referral allow-list matches SPK's operating list (01 Oct 2026) and the owner's tr targets", () => {
  // SPK "Faaliyette Bulunanlar Listesi", temporary list dated 01 Ekim 2026, read 2026-10-11:
  // https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi
  // OKX TR (#38), Binance Turkey (#4), Bybit (#11) and Gate (#23) are listed. Bitget Teknoloji AŞ is on the
  // liquidation list. MEXC stays neutral in Turkish by owner decision 2026-10-11.
  assert.deepEqual([...TURKEY_PROMOTED_PARTNERS], ["okx", "binance", "bybit", "gate-io", "mexc"]);
  for (const slug of ["bitget", "backpack", "hyperliquid", "kraken", "htx"]) {
    assert.equal(referralTitleAllowed(slug, "tr"), false, slug);
    assert.equal(referralSeoFor(slug, "tr"), null, slug);
  }
  for (const slug of TURKEY_PROMOTED_PARTNERS) assert.ok(referralSeoFor(slug, "tr")?.title.includes(codeOf(slug)), slug);
});

test("pt-BR referral titles lead with 'código de convite' and keep 'indicação'", () => {
  for (const partner of REFERRAL_PARTNERS.filter((p) => p.inviteCode)) {
    const seo = referralSeoFor(partner.slug, "pt-BR");
    assert.match(seo.title, /^Código de convite /, partner.slug);
    assert.match(`${seo.title} ${seo.description}`, /indicação/, partner.slug);
  }
});

test("tr / vi / id target profiles carry the native referral long tail and official citations, with no in-answer disclosure", () => {
  const phrase = { tr: /referans kodu/i, vi: /mã giới thiệu/i, id: /kode referral/i };
  // Owner rule 2026-10-12: commission disclosure lives only in the footer and legal pages, not in FAQ answers.
  const disclosure = { tr: /Açıklama: .*komisyon/, vi: /Công bố: .*hoa hồng/, id: /Pengungkapan: .*komisi/ };
  const officialHost = /(^|\.)(okx\.com|bitget\.com|binance\.com|bybit\.com|spk\.gov\.tr|ojk\.go\.id)$/;
  for (const [locale, slugs] of Object.entries(PARTNER_VENUE_FAQ_LOCAL_TARGETS)) {
    for (const slug of slugs) {
      const faq = partnerVenueFaqFor(slug, locale);
      assert.equal(faq?.mode, "replace", `${slug}/${locale}`);
      assert.ok(faq.entries.length >= 5, `${slug}/${locale}: ${faq.entries.length} answers`);
      assert.ok(faq.entries.some((e) => phrase[locale].test(e.question)), `${slug}/${locale}: native referral phrase in a question`);
      // "where do I enter it" and "can I add / change it after sign-up" are both answered
      assert.ok(faq.entries.filter((e) => phrase[locale].test(e.question)).length >= 2, `${slug}/${locale}`);
      for (const e of faq.entries) {
        assert.doesNotMatch(e.question + e.answer, /\{code\}|\{name\}|\{disclosure\}|\{cadence\}/, `${slug}/${locale}: placeholder`);
        assert.doesNotMatch(e.answer, disclosure[locale], `${slug}/${locale}: no commission disclosure inside the answer`);
        assert.doesNotMatch(e.answer, /%\s?\d|\d\s?%/, `${slug}/${locale}: no rebate percentage inside the FAQ`);
        for (const href of e.citations) assert.match(new URL(href).host, officialHost, `${slug}/${locale}: ${href}`);
      }
    }
  }
  // Turkish local-entity answers cite SPK's list and never claim the code is confirmed on the TR entity.
  for (const slug of PARTNER_VENUE_FAQ_LOCAL_TARGETS.tr) {
    const entity = partnerVenueFaqFor(slug, "tr").entries.find((e) => /TR mi|global/.test(e.question));
    assert.ok(entity?.citations.some((href) => href.includes("spk.gov.tr")), slug);
    assert.match(entity.answer, /henüz doğrulamamıştır/, slug);
  }
});

test("localized referral FAQ schema is identical in client SSR and Worker, in the page language", async () => {
  for (const [locale, slugs] of Object.entries({ ...PARTNER_VENUE_FAQ_LOCAL_TARGETS, en: ["hyperliquid", "backpack"], fr: ["backpack"] })) {
    for (const slug of slugs) {
      const route = localizedPath(`/exchanges/${slug}`, locale);
      const client = faqOf(computeRouteSeo({ url: route, locale }).schemas);
      const worker = faqOf((await routeMetadata(new URL(`https://nexualpha.com${route}`), {})).schema);
      assert.deepEqual(worker.mainEntity, client.mainEntity, `${route}: drift`);
      const expected = partnerVenueFaqFor(slug, locale);
      for (const e of expected.entries) assert.ok(client.mainEntity.some((q) => q.name === e.question && q.acceptedAnswer.text === e.answer), `${route}: ${e.question}`);
    }
  }
});

test("Hyperliquid FAQ answers referral code and funded account without a rebate share", () => {
  const faq = partnerVenueFaqFor("hyperliquid", "en");
  const referral = faq.entries.find((e) => /referral code give/i.test(e.question));
  assert.match(referral.answer, /4% discount on your fees for your first \$25M/);
  assert.ok(referral.answer.includes(codeOf("hyperliquid")));
  assert.doesNotMatch(referral.answer, /Disclosure: .*commission/, "owner rule 2026-10-12: no disclosure inside FAQ answers");
  assert.match(referral.answer, /publishes no rebate share/);
  for (const href of faq.entries.flatMap((e) => e.citations)) assert.equal(new URL(href).host, "hyperliquid.gitbook.io");
  for (const locale of ["tr", "ru", "ar", "zh-Hant"]) assert.equal(partnerVenueFaqFor("hyperliquid", locale), null, locale);
});

test("Backpack FAQ (en, fr) restates Backpack's own pages and never calls it SEC-approved", () => {
  const fr = partnerVenueFaqFor("backpack", "fr");
  assert.equal(fr.mode, "replace");
  assert.ok(fr.entries.length >= 5);
  assert.ok(fr.entries.some((e) => /avis/i.test(e.question)));
  assert.match(referralSeoFor("backpack", "fr").title, /avis/);
  for (const locale of ["en", "fr"]) {
    for (const e of partnerVenueFaqFor("backpack", locale).entries) {
      assert.doesNotMatch(e.answer, NEVER_SEC);
      for (const href of e.citations) assert.match(new URL(href).host, /(^|\.)backpack\.exchange$/, href);
    }
  }
  for (const locale of BACKPACK_STOCKS_LOCALES) assert.doesNotMatch(JSON.stringify(backpackStocksCopy(locale)), NEVER_SEC, locale);
  assert.deepEqual([...BACKPACK_STOCKS_LOCALES].sort(), [...ALL_LOCALES].sort());
  assert.deepEqual([...VENUE_KEYWORD_SECTION_LOCALES].sort(), [...ALL_LOCALES].sort());
});

function renderProfiles(pairs) {
  const dir = mkdtempSync(path.join(root, "tests/.tmp-exchange-keywords-"));
  try {
    writeFileSync(path.join(dir, "entry.jsx"), `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { VenueDetailPage } from "../../src/components/v3/VenueDetailPageStatic.jsx";
      import { VenueAlternativesPage } from "../../src/components/v3/VenueAlternativesPage.jsx";
      import { venueDatabase } from "../../src/data/venue-database.js";
      const copy = { common: { dimension: "Dimension" }, assetCapabilities: { none: "Pending source review" } };
      const venues = Object.values(venueDatabase);
      const out = {};
      for (const [slug, locale] of ${JSON.stringify(pairs)}) {
        out[slug + ":" + locale] = slug === "bybit-alternatives"
          ? renderToStaticMarkup(React.createElement(VenueAlternativesPage, { slug, locale }))
          : renderToStaticMarkup(React.createElement(VenueDetailPage, { copy, locale, venue: venueDatabase[slug], venues, updates: [], market: "unknown", product: "unknown" }));
      }
      console.log(JSON.stringify(out));
    `);
    execFileSync(path.join(root, "node_modules/.bin/esbuild"), [path.join(dir, "entry.jsx"), "--bundle", "--platform=node", "--format=cjs", `--outfile=${dir}/bundle.cjs`, "--loader:.css=empty", "--log-level=error"]);
    return JSON.parse(execFileSync(process.execPath, [path.join(dir, "bundle.cjs")], { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 }));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("profiles render the keyword sections: Hyperliquid fee tiers + referral + funded account, Backpack tokenized stocks", () => {
  const pages = renderProfiles([
    ...ALL_LOCALES.map((l) => ["hyperliquid", l]), ...ALL_LOCALES.map((l) => ["backpack", l]),
    ["okx", "tr"], ["bitget", "vi"], ["bybit", "id"], ["binance", "pt-BR"], ["okx", "vi"], ["bybit", "tr"],
    ...ALL_LOCALES.map((l) => ["bybit-alternatives", l]),
  ]);
  for (const locale of ALL_LOCALES) {
    const hl = pages[`hyperliquid:${locale}`];
    const section = hl.match(/<section class="v3-kw" data-keyword-section="hyperliquid"[\s\S]*?<\/section>/)?.[0];
    assert.ok(section, `hyperliquid/${locale}: section`);
    assert.equal([...section.matchAll(/<tr>/g)].length, HYPERLIQUID_FEE_TIERS.length + 1, `hyperliquid/${locale}: tier rows`);
    for (const row of HYPERLIQUID_FEE_TIERS) assert.ok(section.includes(row.perpTaker) && section.includes(row.spotMaker), `hyperliquid/${locale}: tier ${row.tier}`);
    assert.match(section, /data-keyword-block="funded-account"/, `hyperliquid/${locale}`);
    const referral = /data-keyword-block="referral"/.test(section);
    const allowed = referralTitleAllowed("hyperliquid", locale) && !["ja", "ko"].includes(locale);
    assert.equal(referral, allowed, `hyperliquid/${locale}: referral block only where referral content is allowed`);
    if (referral) {
      const block = section.match(/data-keyword-block="referral"[\s\S]*?<\/div>/)[0];
      assert.ok(block.includes(`<code translate="no">${codeOf("hyperliquid")}</code>`), `hyperliquid/${locale}: feed code`);
      assert.doesNotMatch(block, /commission-disclosure-line|data-disclosure-placement=/, `hyperliquid/${locale}: no disclosure line next to the code`);
    } else {
      assert.ok(!section.includes(codeOf("hyperliquid")), `hyperliquid/${locale}: neutral section shows no code`);
    }
    assert.doesNotMatch(text(section), /\b\d{1,2}\s?% (rebate|cashback)/i, `hyperliquid/${locale}: no rebate share`);
    const bp = pages[`backpack:${locale}`].match(/<section class="v3-kw" data-keyword-section="backpack-stocks"[\s\S]*?<\/section>/)?.[0];
    assert.ok(bp, `backpack/${locale}: stocks section`);
    assert.match(bp, /Solana/);
    // Owner 2026-10-13: Backpack pages take no sitewide referral parameter, so the source is a plain label + domain.
    assert.doesNotMatch(bp, /href="https:\/\/learn\.backpack\.exchange/);
    assert.match(bp, /data-source-plain="learn\.backpack\.exchange"/);
    assert.doesNotMatch(text(bp), NEVER_SEC);
  }
  const h1 = (html) => text(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1]);
  assert.match(h1(pages["okx:tr"]), /^OKX referans kodu nexu888, ücretler ve iade \(\d{4}\)$/);
  assert.match(h1(pages["bybit:tr"]), /^Bybit referans kodu 48553 ve ücretler \(\d{4}\)$/, "no rebate word without a confirmed share");
  // vi is neutral since 2026-10-13 (Vietnam Resolution 05/2025/NQ-CP): the profile H1 carries no referral wording or code.
  assert.doesNotMatch(h1(pages["okx:vi"]), /nexu888|[Mm]ã giới thiệu|hoàn phí/);
  assert.doesNotMatch(h1(pages["bitget:vi"]), /nexu888|[Mm]ã giới thiệu|hoàn phí/);
  assert.match(h1(pages["bybit:id"]), /^Kode referral Bybit 48553 dan biaya \(\d{4}\)$/);
  assert.match(h1(pages["binance:pt-BR"]), /^Código de convite Binance 11350287, taxas e cashback \(\d{4}\)$/);

  // /topics/bybit-alternatives: one row per venue from the facts file, codes from the feed, no in-page disclosure line.
  const page = venueAlternativePage("bybit-alternatives");
  for (const locale of ALL_LOCALES) {
    const html = pages[`bybit-alternatives:${locale}`];
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, locale);
    const rows = venueAlternativeRows(page, locale);
    const rowHtml = html.match(/<tbody>([\s\S]*?)<\/tbody>/)[1].split(/<tr\b/).slice(1);
    assert.equal(rowHtml.length, rows.length, locale);
    rows.forEach((row, index) => {
      if (row.spot) assert.ok(decode(rowHtml[index]).includes(row.spot), `${locale}: ${row.slug} spot`);
      const shown = rowHtml[index].includes(`<code translate="no">${row.code}</code>`);
      if (row.code) assert.equal(shown, referralTitleAllowed(row.slug, locale), `${locale}: ${row.slug} code policy`);
    });
    assert.doesNotMatch(html, /commission-disclosure-line|data-disclosure-placement=/, `${locale}: no disclosure line above the table`);
    assert.doesNotMatch(text(html), /\b(best|top|#1|ranked|winner)\b/i, `${locale}: no ranking words`);
  }
  assert.equal(venueAlternativeRows(page, "en").find((r) => r.slug === "okx").spot, feeDisplay("okx", "spot", "en"));
  assert.equal(venueAlternativeRows(page, "en").find((r) => r.slug === "backpack").spot, null, "unchecked fees stay unchecked");
});

test("/topics/bybit-alternatives is indexable in English in both runtimes, in the inventory and the sitemap", async () => {
  assert.deepEqual(Object.keys(VENUE_ALTERNATIVE_PAGES), [...VENUE_ALTERNATIVE_SLUGS]);
  for (const locale of ALL_LOCALES) {
    const route = localizedPath("/topics/bybit-alternatives", locale);
    const client = computeRouteSeo({ url: route, locale });
    const worker = await routeMetadata(new URL(`https://nexualpha.com${route}`), {});
    assert.equal(client.status, 200, route);
    assert.equal(worker.status, 200, route);
    const expected = locale === "en" ? "index,follow" : "noindex,follow";
    assert.equal(client.robots, expected, `${route} client`);
    assert.equal(worker.robots, expected, `${route} worker`);
    assert.equal(worker.canonical, "https://nexualpha.com/topics/bybit-alternatives", route);
    assert.equal(worker.title, budgetTitle(client.title, titleBudgetForLocale(locale)), route);
    assert.deepEqual(faqOf(worker.schema).mainEntity, faqOf(client.schemas).mainEntity, `${route}: FAQ drift`);
  }
  const route = routeInventory([]).find((r) => r.pathname === "/topics/bybit-alternatives");
  assert.ok(route?.index, "prerender inventory lists the page as indexable");
  assert.deepEqual(sitemapLocalesForRoute(route), ["en"]);
  const split = buildSplitSitemaps(routeInventory([]), [], { policy: loadSearchPublicationBaseline() });
  assert.match(split.files.get("sitemap-topics-tools.xml")?.xml || "", /<loc>https:\/\/nexualpha\.com\/topics\/bybit-alternatives<\/loc>/);
  for (const [slug, locales] of Object.entries({ okx: ["vi", "id", "pt-BR"], bitget: ["vi", "id"], bybit: ["vi", "id"], binance: ["vi", "pt-BR"], backpack: ["fr"] })) {
    const venue = routeInventory([]).find((r) => r.pathname === `/exchanges/${slug}`);
    for (const locale of locales) assert.ok(sitemapLocalesForRoute(venue).includes(locale), `${slug}/${locale} in sitemap`);
  }
  const app = readFileSync(path.join(root, "src/App.jsx"), "utf8");
  assert.match(app, /VENUE_ALTERNATIVE_SLUGS\.includes\(topicMatch\[1\]\)/);
});

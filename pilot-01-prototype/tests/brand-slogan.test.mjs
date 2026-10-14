// Brand slogans (owner decision 2026-10-11, src/data/brand-slogan.js): Organization JSON-LD slogan in all 17 locales,
// home title/description parity between the Worker SSR head, /api/route-seo and computeRouteSeo, the 60-wide title
// budget, slogan B's share derived from HOME_REBATE_MAX_PCT, the footer line, the default social card and llms.txt.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import worker, { routeMetadata } from "../worker/index.js";
import { computeRouteSeo, HOME_SEARCH_COPY } from "../src/data/seo-injection.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { titleDisplayWidth, metaDescriptionLimit, budgetTitle, routeMetaDescription, titleBudgetForLocale } from "../src/data/meta-description.js";
import { HOME_REBATE_MAX_PCT } from "../src/data/home-rebate-tiers.js";
import { formatPercent } from "../src/data/format-percent.js";
import {
  BRAND_SLOGAN_PRIMARY, BRAND_SLOGAN_SECONDARY_TEMPLATE, SLOGAN_LOCALES, brandSlogan, brandSloganSecondary, sloganTitleFragment,
} from "../src/data/brand-slogan.js";
import { NEUTRAL_HOME_DESCRIPTION_LOCALES, TR_REBATE_MAX_PCT, homeTitleCarriesSlogan, HOME_TITLE_BUDGET } from "../src/data/home-search-copy.js";
import { organizationSchema, brandPageSchemas } from "../src/data/brand-entity.js";
import { defaultCardSvg, newsCardSvg, BRAND_MARK_PATHS } from "../server/og-image.mjs";
import { socialImagePathForRoute } from "../src/data/social-image.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"];
const ORIGIN = "https://nexualpha.com";
const SHELL = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Shell</title><meta name="description" content="shell" /></head><body><div id="root"></div></body></html>`;
const env = {
  ASSETS: {
    fetch: async (request) => new URL(request.url).pathname === "/index.html"
      ? new Response(SHELL, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } })
      : new Response("missing", { status: 404 }),
  },
};
const decode = (text) => text.replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const organizationIn = (schemas) => [schemas?.["@graph"] || schemas].flat().find((node) => node && node["@type"] === "Organization" && String(node["@id"] || "").endsWith("/#organization"));

test("both slogans exist in all 17 locales and slogan B carries no typed percentage", async () => {
  assert.deepEqual([...SLOGAN_LOCALES], LOCALES);
  for (const locale of LOCALES) {
    assert.ok(BRAND_SLOGAN_PRIMARY[locale]?.trim(), `${locale} slogan A`);
    assert.match(BRAND_SLOGAN_SECONDARY_TEMPLATE[locale], /\{max\}/, `${locale} slogan B uses the {max} placeholder`);
    assert.doesNotMatch(BRAND_SLOGAN_SECONDARY_TEMPLATE[locale], /\d/, `${locale} slogan B has no hard-coded number`);
  }
  assert.equal(BRAND_SLOGAN_PRIMARY.en, "One verified gateway to the world’s exchanges.");
  assert.equal(BRAND_SLOGAN_PRIMARY["zh-Hans"], "全球交易所，一个官方入口");
  assert.equal(brandSloganSecondary("en"), "Your fees, returned. Up to 60%.");
  assert.equal(brandSloganSecondary("zh-Hans"), "你的手续费，最高返还 60%");
  // Native-review markers for the five locales the owner flagged.
  const source = await readFile(path.join(root, "src/data/brand-slogan.js"), "utf8");
  for (const locale of ["ru", "tr", "id", "vi", "ar"]) {
    const lines = source.split("\n").filter((line) => line.trimStart().startsWith(`${locale}: "`));
    assert.equal(lines.length, 2, `${locale}: one line per slogan`);
    for (const line of lines) assert.match(line, /\/\/ l10n: needs native review$/, `${locale} marked for native review`);
  }
});

test("slogan B's share follows HOME_REBATE_MAX_PCT through formatPercent", () => {
  for (const locale of LOCALES) {
    assert.ok(brandSloganSecondary(locale).includes(formatPercent(locale, HOME_REBATE_MAX_PCT)), `${locale} uses the constant`);
    assert.ok(brandSloganSecondary(locale, 45).includes(formatPercent(locale, 45)), `${locale} follows a changed constant`);
    assert.ok(!brandSloganSecondary(locale, 45).includes(String(HOME_REBATE_MAX_PCT)), `${locale}: no leftover share`);
  }
  assert.equal(brandSloganSecondary("tr"), "Komisyonlarınız geri döner. En fazla %60.");
});

test("Organization JSON-LD carries slogan A in every locale, identical in the Worker head and computeRouteSeo", async () => {
  for (const locale of LOCALES) {
    const href = `${ORIGIN}${localizedPath("/", locale)}`;
    const metadata = await routeMetadata(new URL(href), env);
    const workerOrg = organizationIn(metadata.schema);
    const clientOrg = organizationIn(computeRouteSeo({ url: href, locale }).schemas);
    assert.ok(workerOrg && clientOrg, `${locale}: Organization node on the home page`);
    assert.equal(workerOrg.slogan, BRAND_SLOGAN_PRIMARY[locale], `${locale} worker slogan`);
    assert.equal(clientOrg.slogan, workerOrg.slogan, `${locale} client slogan`);
    assert.ok(workerOrg.description.startsWith(sloganTitleFragment(BRAND_SLOGAN_PRIMARY[locale])), `${locale}: description leads with slogan A`);
    assert.equal(organizationSchema(locale).slogan, BRAND_SLOGAN_PRIMARY[locale]);
    const about = brandPageSchemas("/about", locale)[0];
    assert.equal(about.mainEntity.slogan, BRAND_SLOGAN_PRIMARY[locale], `${locale} /about Organization`);
  }
});

test("home title and description match across the SSR head, /api/route-seo and computeRouteSeo in 17 locales", async () => {
  for (const locale of LOCALES) {
    const target = localizedPath("/", locale);
    const page = await worker.fetch(new Request(`${ORIGIN}${target}`, { headers: { accept: "text/html" } }), env);
    const html = await page.text();
    const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] || html;
    const ssrTitle = decode(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
    const ssrDescription = decode(head.match(/<meta name="description" content="([^"]*)"/)?.[1] || "");
    const api = await (await worker.fetch(new Request(`${ORIGIN}/api/route-seo?path=${encodeURIComponent(target)}`, { headers: { accept: "application/json" } }), env)).json();
    const client = computeRouteSeo({ url: `${ORIGIN}${target}`, locale });
    const [title, description] = HOME_SEARCH_COPY[locale];
    const servedTitle = budgetTitle(title, titleBudgetForLocale(locale));
    assert.equal(ssrTitle, servedTitle, `${locale} SSR title`);
    assert.equal(api.title, servedTitle, `${locale} route-seo title`);
    assert.equal(client.title, servedTitle, `${locale} client title`);
    const servedDescription = routeMetaDescription(servedTitle, description, locale);
    assert.equal(ssrDescription, servedDescription, `${locale} SSR description`);
    assert.equal(api.description, servedDescription, `${locale} route-seo description`);
    assert.equal(client.description, servedDescription, `${locale} client description`);
    assert.equal(organizationIn(api.schema)?.slogan, BRAND_SLOGAN_PRIMARY[locale], `${locale} route-seo slogan`);
  }
});

test("home title fits the 60-wide budget with the brand, and slogan A sits in the title or leads the description", () => {
  const disclosure = { en: /disclosed/, "zh-Hans": /披露/, "zh-Hant": /揭露/, es: /declarados/, "pt-BR": /informados/, fr: /signalés/, de: /offengelegt/, it: /dichiarati/, ja: /開示/, ko: /공개/, ru: /раскрыты/, tr: /belirtilir/, id: /diungkapkan/, vi: /Công bố/, ar: /مُفصح/, ur: /ظاہر|افشا|واضح|پارٹنر/, uk: /розкрит|позначен|партнерськ/i };
  for (const locale of LOCALES) {
    const [title, description] = HOME_SEARCH_COPY[locale];
    const servedTitle = budgetTitle(title, titleBudgetForLocale(locale));
    assert.ok(servedTitle.length <= titleBudgetForLocale(locale), `${locale}: served title length ${servedTitle.length}`);
    assert.ok(description.length <= metaDescriptionLimit(locale, description), `${locale}: description ${description.length}`);
    const sloganA = sloganTitleFragment(BRAND_SLOGAN_PRIMARY[locale]);
    if (homeTitleCarriesSlogan(locale)) {
      assert.ok(title.includes(sloganA), `${locale}: slogan A in title`);
      assert.ok(!description.includes(sloganA), `${locale}: slogan A not repeated`);
    } else {
      assert.ok(description.startsWith(sloganA), `${locale}: description leads with slogan A`);
    }
    if (NEUTRAL_HOME_DESCRIPTION_LOCALES.has(locale)) {
      assert.ok(!description.includes(brandSloganSecondary(locale)), `${locale}: neutral home copy keeps slogan B out`);
    } else {
      assert.ok(description.includes(brandSloganSecondary(locale, locale === "tr" ? TR_REBATE_MAX_PCT : undefined)), `${locale}: description carries slogan B`);
      assert.ok(description.includes(formatPercent(locale, locale === "tr" ? TR_REBATE_MAX_PCT : HOME_REBATE_MAX_PCT)), `${locale}: share from the constant`);
    }
    // Turkey does not promote Bitget (SPK liquidation list; owner 2026-10-11): OKX + Bybit instead.
    if (!NEUTRAL_HOME_DESCRIPTION_LOCALES.has(locale)) {
      for (const venue of locale === "tr" ? ["OKX", "Bybit"] : ["OKX", "Bitget"]) assert.ok(description.includes(venue), `${locale}: ${venue} fact`);
      assert.match(description, /Binance|币安|幣安/, `${locale}: Binance fact`);
    }
    // CTR pass 2026-10-13 (owner rule 2026-10-12): disclosure lives only in the footer and legal pages, so no home snippet
    // carries a disclosure sentence, and every description stays within 155 characters.
    assert.doesNotMatch(description, disclosure[locale], `${locale}: no disclosure line in the snippet`);
    assert.ok(description.length <= 155, `${locale}: description ${description.length} > 155`);
  }
  // Owner 2026-10-11 ("土耳其站照常写"): Turkish carries slogan B; ru, ar, ur and uk stay neutral pending local review.
  assert.deepEqual([...NEUTRAL_HOME_DESCRIPTION_LOCALES].sort(), ["ar", "ru", "uk", "ur", "vi", "zh-Hant"]);
  // Turkey promotes OKX/Binance/Bybit only (owner 2026-10-11), so slogan B uses the best of those shares (OKX 40%).
  assert.ok(HOME_SEARCH_COPY.tr[1].includes("En fazla %40."), "tr description carries slogan B with the Turkish percent");
  assert.doesNotMatch(HOME_SEARCH_COPY.tr[1], /Bitget/);
  // Chinese fits the full slogan in the title; English does not and leads the description with it.
  assert.equal(HOME_SEARCH_COPY["zh-Hans"][0], "邀请码与手续费返佣｜全球交易所，一个官方入口 — NexuAlpha");
  assert.equal(budgetTitle(HOME_SEARCH_COPY["zh-Hans"][0], titleBudgetForLocale("zh-Hans")), "邀请码与手续费返佣｜全球交易所，一个官方入口");
  assert.equal(homeTitleCarriesSlogan("en"), false);
});

test("footer renders slogan A under the brand mark in en, zh-Hans and ar", async () => {
  const temp = await mkdtemp(path.join(root, "tests/.tmp-slogan-footer-"));
  try {
    const entry = path.join(temp, "entry.mjs");
    const bundle = path.join(temp, "bundle.cjs");
    await writeFile(entry, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { CleanFooter } from '../../src/components/v3/CleanFooter.jsx';
      console.log(JSON.stringify(Object.fromEntries(["en", "zh-Hans", "ar"].map((locale) => [locale,
        renderToStaticMarkup(React.createElement(CleanFooter, { locale }))]))));
    `);
    execFileSync(path.join(root, "node_modules/.bin/esbuild"), [entry, "--bundle", "--platform=node", "--format=cjs",
      "--loader:.css=empty", "--log-level=warning", `--outfile=${bundle}`], { cwd: root });
    const rendered = JSON.parse(execFileSync(process.execPath, [bundle], { cwd: root, encoding: "utf8" }));
    for (const locale of ["en", "zh-Hans", "ar"]) {
      const html = rendered[locale];
      const brand = html.match(/<div class="nx-ftr__brand">([\s\S]*?)<\/div>/)?.[1] || "";
      const slogan = brand.match(/<p class="nx-ftr__slogan">([^<]*)<\/p>/)?.[1];
      assert.equal(decode(slogan || ""), BRAND_SLOGAN_PRIMARY[locale], `${locale} footer slogan`);
      assert.doesNotMatch(brand, /clean-footer__summary/, `${locale}: brand block has only the slogan`);
      // Owner 2026-10-14: no fine-print sentence anywhere in the footer; the legal row keeps only its links.
      assert.doesNotMatch(html, /clean-footer__summary/, `${locale}: no footer fine-print line`);
      assert.match(html, /nx-ftr__legal-row[\s\S]*href="[^"]*methodology#disclosure"/, `${locale}: disclosure link remains in the legal row`);
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
  const css = await readFile(path.join(root, "src/styles/v8/site-signature.css"), "utf8");
  assert.match(css, /\.nx-ftr__slogan[^{]*\{[^}]*text-align: center/, "footer slogan is styled in the global layer");
});

test("default and home social cards carry slogan A; article cards are unchanged", () => {
  for (const locale of LOCALES) {
    const svg = defaultCardSvg({ locale });
    const words = BRAND_SLOGAN_PRIMARY[locale].split(/\s+/).slice(0, 2).join(" ");
    const text = decode([...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join(" "));
    assert.ok(text.includes(/\s/.test(BRAND_SLOGAN_PRIMARY[locale]) ? words : BRAND_SLOGAN_PRIMARY[locale].slice(0, 5)), `${locale}: slogan on the default card`);
  }
  for (const locale of LOCALES) {
    const svg = defaultCardSvg({ locale });
    // RTL drops the kicker's final full stop and adds a right-to-left mark before the number (resvg bidi).
    const kicker = locale === "ar" ? brandSloganSecondary(locale).replace(/\.$/, "") : brandSloganSecondary(locale);
    assert.ok(decode(svg).replace(/\u200F/g, "").includes(`>${kicker}<`), `${locale}: slogan B is the default card kicker`);
    assert.ok(svg.includes(formatPercent(locale, HOME_REBATE_MAX_PCT)), `${locale}: kicker share from the constant`);
    assert.ok(BRAND_MARK_PATHS.every((p) => svg.includes(p)), `${locale}: real brand mark on the default card`);
    assert.ok(!svg.includes('stroke="#ffffff" stroke-width="4"'), `${locale}: generic N square removed from the default card`);
  }
  const news = newsCardSvg({ title: "Example headline", category: "News", date: "2026-10-11", locale: "en" });
  assert.ok(!news.includes("verified gateway"), "article cards keep their own headline");
  assert.equal(socialImagePathForRoute("/"), "/og/default/site.png");
  assert.equal(socialImagePathForRoute("/", "ar"), "/og/default/site.png?locale=ar");
});

test("the default card's inlined brand mark matches public/brand/nexualpha/nexualpha-round.svg", async () => {
  const file = await readFile(path.join(root, "public/brand/nexualpha/nexualpha-round.svg"), "utf8");
  assert.match(file, /viewBox="0 0 256 256"/);
  const shapes = [...file.matchAll(/<(?:circle|path)\b[^>]*\/>/g)].map((m) => m[0]);
  assert.deepEqual(shapes, [...BRAND_MARK_PATHS]);
});

test("llms.txt and llms-small.txt lead with slogan A", async () => {
  const script = await readFile(path.join(root, "scripts/generate-public-llms.mjs"), "utf8");
  // SEO audit 2026-10-11 #9 (owner-approved): brand H1 and a one-sentence summary that starts with slogan A.
  assert.match(script, /const SITE_SUMMARY = `\$\{brandSlogan\("en"\)\.replace\(/);
  assert.match(script, /const header = `# NexuAlpha\n\n> \$\{SITE_SUMMARY\}\n\n/);
  assert.match(script, /const small = `# NexuAlpha\n\n> \$\{SITE_SUMMARY\}\n\n/);
  assert.equal(brandSlogan("en"), BRAND_SLOGAN_PRIMARY.en);
});

import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import worker from "../worker/index.js";
import { APP_DOWNLOADS, APP_DOWNLOAD_YEAR, appDownloadContent, appDownloadRouteSeo, appDownloadSignupAllowed, verifiedAppApk } from "../src/data/app-downloads.js";
import { APP_DOWNLOAD_SLUGS, appDownloadPath, appDownloadSlugsFor, parseAppDownloadPath } from "../src/data/app-download-path.js";
import { publicCtaForVenue } from "../src/data/source-bound-cta.js";
import { APP_DOWNLOAD_COPY } from "../src/data/app-download-copy.js";
import { formatDate } from "../src/data/format-date.js";
import { LOCALE_PREFIX_BY_CODE, localizedPath } from "../src/data/locale-routing.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { buildAppsSitemap, buildSplitSitemaps } from "../scripts/generate-prerender-manifest.mjs";
import { modulePathsForRoute } from "../src/data/route-module-cache.js";
import { createSsrHarness, SHELL_HTML, h1Texts, hydrateInJsdom, hydrationErrors } from "./helpers/ssr-hydration-harness.mjs";
// Shared neutral list (ru, ar, zh-Hant, ur, uk and, since 2026-10-13, vi): src/data/locale-policy.js.
import { NEUTRAL_CTA_LOCALE_LIST } from "../src/data/locale-policy.js";
import { TURKEY_PROMOTED_PARTNERS } from "../src/data/partner-geo-restrictions.js";

const assets = { fetch: async (request) => {
  const path = new URL(request.url).pathname;
  if (path === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
  if (path === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html" } });
  if (path === "/sitemap-apps.xml") return new Response(buildAppsSitemap().xml);
  return new Response("missing", { status: 404 });
} };
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
const fetchPage = (path) => worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: "text/html" } }), { ASSETS: assets, NEWS_SSR_RENDER: harness.render });
const main = (html) => html.match(/<main\b[\s\S]*?<\/main>/)?.[0] || "";
const schemas = (html) => [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => { const v = JSON.parse(m[1]); return Array.isArray(v) ? v : v["@graph"] || [v]; });

test("app download venue lists use the shared priority order and filter Bitget for Turkish defaults", () => {
  assert.deepEqual(APP_DOWNLOAD_SLUGS.slice(0, 3), ["bitget", "okx", "binance"]);
  assert.deepEqual(appDownloadSlugsFor("tr").slice(0, 2), ["okx", "binance"]);
  assert.equal(appDownloadSlugsFor("tr").includes("bitget"), false);
  assert.equal(parseAppDownloadPath("/exchanges/bitget/app").valid, true, "Türkiye filtering does not remove the source-reviewed route");
});

// Route + Worker + hydration exercise the same page, not a static markup fixture.
test("four app routes SSR in English and Simplified Chinese with matching client SEO and hydration", async () => {
  for (const slug of APP_DOWNLOAD_SLUGS) for (const locale of ["en", "zh-Hans"]) {
    const path = localizedPath(appDownloadPath(slug), locale);
    const response = await fetchPage(path);
    const html = await response.text();
    const content = appDownloadContent(slug, locale);
    assert.equal(response.status, 200, path);
    assert.deepEqual(h1Texts(html), [content.text("title")]);
    assert.match(html, /class="nx-app-download /);
    assert.ok(html.includes(`rel="canonical" href="https://nexualpha.com${path}"`));
    assert.match(html, /name="robots" content="index,follow"/);
    const client = computeRouteSeo({ url: `https://nexualpha.com${path}`, locale });
    assert.equal(client.status, 200);
    assert.equal(html.match(/<title[^>]*>([^<]*)<\/title>/)?.[1], client.title);
    assert.equal((html.match(/rel="alternate" hreflang=/g) || []).length, 18);
    const ld = schemas(html);
    const software = ld.find((row) => row["@type"] === "SoftwareApplication");
    assert.equal(software.operatingSystem, "iOS, Android");
    assert.equal(software.applicationCategory, "FinanceApplication");
    assert.equal(software.dateModified, content.app.lastChecked);
    assert.deepEqual(software.downloadUrl, [content.app.appStore, content.app.googlePlay]);
    assert.deepEqual(software.sameAs, content.app.sources);
    const faq = ld.find((row) => row["@type"] === "FAQPage");
    assert.equal(faq.mainEntity.length, 3);
    assert.ok(ld.some((row) => row["@type"] === "BreadcrumbList"));
    for (const row of faq.mainEntity) { assert.ok(main(html).includes(row.name)); assert.ok(main(html).includes(row.acceptedAnswer.text)); }
    assert.doesNotMatch(main(html), /data-app-apk|Android APK<\/a>/);
    assert.ok(main(html).includes(`/go/${slug}?src=app-${encodeURIComponent(locale)}`));
    assert.equal(content.cta.inviteCode, publicCtaForVenue(slug, locale).inviteCode);
    assert.ok(main(html).includes(`>${content.cta.inviteCode}</strong>`));
    if (slug === "okx") {
      const hydrated = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${path}`);
      assert.deepEqual(hydrationErrors(hydrated.errors), [], path);
    }
  }
});

test("all locale editions are localized and indexable, neutral locales never contain a sign-up block", async () => {
  const locales = Object.keys(LOCALE_PREFIX_BY_CODE);
  assert.deepEqual(Object.keys(APP_DOWNLOAD_COPY).sort(), locales.sort());
  for (const locale of locales) {
    const path = localizedPath(appDownloadPath("okx"), locale);
    const html = await (await fetchPage(path)).text();
    assert.deepEqual(h1Texts(html), [appDownloadContent("okx", locale).text("title")]);
    assert.match(html, /name="robots" content="index,follow"/);
    assert.ok(APP_DOWNLOAD_COPY[locale].answer);
    assert.equal(APP_DOWNLOAD_COPY[locale].steps.length, 3);
    if (locale !== "en") assert.notEqual(APP_DOWNLOAD_COPY[locale].answer, APP_DOWNLOAD_COPY.en.answer);
    if (NEUTRAL_CTA_LOCALE_LIST.includes(locale)) assert.doesNotMatch(main(html), /data-app-registration|href="\/go\//);
    assert.doesNotMatch(main(html), /not (?:investment|financial) advice|affiliate commission|pays our commission|terms (?:and conditions )?apply|非投资建议|非投資建議|佣金|傭金/i);
  }
});

test("all app download locales render the source check date with locale-aware UI text", async () => {
  for (const locale of Object.keys(LOCALE_PREFIX_BY_CODE)) {
    const content = appDownloadContent("okx", locale);
    const html = await (await fetchPage(localizedPath(appDownloadPath("okx"), locale))).text();
    const sourceSection = main(html).match(/<section aria-labelledby="app-sources"[\s\S]*?<\/section>/)?.[0] || "";
    assert.match(sourceSection, new RegExp(`<time dateTime="${content.app.lastChecked}">`), locale);
    assert.ok(sourceSection.includes(formatDate(locale, content.app.lastChecked)), `${locale} formats the checked date`);
    if (!["en", "zh-Hans", "zh-Hant", "ja", "ko"].includes(locale)) assert.doesNotMatch(sourceSection, />2026-10-13</, `${locale} must not print the raw ISO date`);
  }
});

test("Turkey and explicit market context use partner geo gating, including SSR", async () => {
  for (const slug of APP_DOWNLOAD_SLUGS) {
    // Türkiye promotes only TURKEY_PROMOTED_PARTNERS (Bitget: SPK list; CoinW: SPK access ban).
    const turkeyAllowed = TURKEY_PROMOTED_PARTNERS.includes(slug);
    assert.equal(appDownloadSignupAllowed(slug, { locale: "tr" }), turkeyAllowed);
    const html = await (await fetchPage(`/tr${appDownloadPath(slug)}`)).text();
    assert.equal(main(html).includes("data-app-registration"), turkeyAllowed);
  }
  for (const [path, allowed] of [["/exchanges/bitget/app?market=TR", false], ["/exchanges/okx/app?market=CA", false], ["/exchanges/okx/app?market=BR", true]]) {
    const html = await (await fetchPage(path)).text();
    assert.equal(main(html).includes("data-app-registration"), allowed, path);
    const hydrated = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${path}`);
    assert.deepEqual(hydrationErrors(hydrated.errors), [], path);
  }
});

test("APK data fails closed and a reviewed separate-host build exposes its metadata", async () => {
  const apk = { url: "https://dl.nexualpha.com/okx/1.2.3.apk", sha256: "a".repeat(64), signerSha256: "b".repeat(64), version: "1.2.3" };
  assert.equal(verifiedAppApk(null), null);
  assert.equal(verifiedAppApk(apk), apk);
  for (const bad of [{ ...apk, sha256: "" }, { ...apk, signerSha256: "" }, { ...apk, version: "" }, { ...apk, url: "https://nexualpha.com/app.apk" }, { ...apk, url: "https://dl.nexualpha.com.evil.test/app.apk" }, { ...apk, url: "http://dl.nexualpha.com/app.apk" }, { ...apk, url: "https://user@dl.nexualpha.com/app.apk" }]) assert.equal(verifiedAppApk(bad), null);
  for (const app of Object.values(APP_DOWNLOADS)) assert.equal(app.apk, null);
  const ssrData = await harness.vite.ssrLoadModule("/src/data/app-downloads.js");
  try {
    ssrData.APP_DOWNLOADS.okx.apk = apk;
    APP_DOWNLOADS.okx.apk = apk;
    const html = harness.render("https://nexualpha.com/exchanges/okx/app");
    assert.match(html, /data-app-apk/);
    assert.ok(html.includes(apk.sha256) && html.includes(apk.signerSha256) && html.includes(apk.version));
    const seo = appDownloadRouteSeo("/exchanges/okx/app", "en", { urlFor: (path) => `https://nexualpha.com${path}` });
    assert.ok(!seo.schemas[0].downloadUrl.includes(apk.url), "downloadUrl stays limited to official store listings");
  } finally { APP_DOWNLOADS.okx.apk = null; ssrData.APP_DOWNLOADS.okx.apk = null; }
});

test("profile crosslinks, lazy route module, sitemap index and unsupported app routes", async () => {
  assert.deepEqual(modulePathsForRoute({ name: "appDownload" }), ["./components/apps/AppDownloadPage.jsx"]);
  assert.equal(parseAppDownloadPath("/exchanges/okx/app").valid, true);
  for (const slug of APP_DOWNLOAD_SLUGS) {
    const html = harness.render(`https://nexualpha.com/zh-hans/exchanges/${slug}`);
    assert.ok(html.includes(`href="/zh-hans/exchanges/${slug}/app`), slug);
  }
  const profileHtml = harness.render("https://nexualpha.com/exchanges/bitget?market=TR");
  const destination = profileHtml.match(/href="([^" ]*\/exchanges\/bitget\/app[^" ]*)"/)?.[1].replaceAll("&amp;", "&");
  assert.ok(destination?.includes("market=TR"), "profile link preserves explicit market");
  const appHtml = await (await fetchPage(destination)).text();
  const hydrated = await hydrateInJsdom(harness.vite, appHtml, `https://nexualpha.com${destination}`, { browserUrlAsWindowUrl: true, inspect: (window) => ({ signup: Boolean(window.document.querySelector("[data-app-registration]")), profileHref: window.document.querySelector(".nx-app-download > a")?.getAttribute("href") }) });
  assert.deepEqual(hydrationErrors(hydrated.errors), []);
  assert.equal(hydrated.inspected.signup, false, "profile fragment context gates the hydrated signup like other decision routes");
  assert.ok(hydrated.inspected.profileHref.includes("market=TR"), "return profile link retains market context");
  const profileShell = SHELL_HTML.replace('<div id="root"></div>', `<div id="root">${harness.render("https://nexualpha.com/exchanges/bitget?locale=en")}</div><script type="application/json" id="nexualpha-prerender-state">${JSON.stringify({ pathname: "/exchanges/bitget", locale: "en" })}</script>`);
  const profileHydrated = await hydrateInJsdom(harness.vite, profileShell, `https://nexualpha.com${hydrated.inspected.profileHref}`, { browserUrlAsWindowUrl: true, inspect: (window) => [...window.document.querySelectorAll('a[href^="/go/bitget"]')].length });
  assert.deepEqual(hydrationErrors(profileHydrated.errors), []);
  assert.equal(profileHydrated.inspected, 0, "return profile keeps Bitget blocked in TR");
  assert.equal((await fetchPage("/exchanges/kraken/app")).status, 404);
  assert.equal((await fetchPage("/exchanges/okx/app/nope")).status, 404);
  const sitemap = buildAppsSitemap();
  assert.equal(sitemap.count, APP_DOWNLOAD_SLUGS.length * 17);
  for (const locale of Object.keys(LOCALE_PREFIX_BY_CODE)) for (const slug of APP_DOWNLOAD_SLUGS) assert.ok(sitemap.xml.includes(`<loc>https://nexualpha.com${localizedPath(appDownloadPath(slug), locale)}</loc>`));
  assert.ok(buildSplitSitemaps([], []).index.includes("https://nexualpha.com/sitemap-apps.xml"));
  assert.equal(await (await fetchPage("/sitemap-apps.xml")).text(), sitemap.xml);
  const head = await worker.fetch(new Request("https://nexualpha.com/sitemap-apps.xml", { method: "HEAD" }), { ASSETS: assets });
  assert.equal(head.status, 200);
  const prepare = await readFile(new URL("../scripts/prepare-sites-build.mjs", import.meta.url), "utf8");
  for (const name of ["app-download-path.js", "app-downloads.js", "app-download-copy.js"]) assert.ok(prepare.includes(name));
  assert.equal(APP_DOWNLOAD_YEAR, 2026);
});

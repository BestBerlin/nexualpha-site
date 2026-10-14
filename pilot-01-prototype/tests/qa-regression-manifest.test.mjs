// The release gate (scripts/qa-regression.mjs) reads scripts/qa-regression-manifest.mjs. A malformed manifest would
// silently drop checks, so its shape is locked here; the expected values themselves come from the site's data modules.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { QA_MANIFEST, DEVICES, FINE_PRINT_STRINGS, deviceForWidth } from "../scripts/qa-regression-manifest.mjs";
import { HOME_REBATE_SHARE } from "../src/data/home-rebate-tiers.js";
import { partnerRegistry } from "../src/data/partner-registry.js";
import { LOCALE_PREFIX_BY_CODE } from "../src/data/locale-routing.js";
import { isNeutralCtaLocale } from "../src/data/locale-policy.js";

const isSelector = (value) => typeof value === "string" && value.trim().length > 0 && (() => { try { globalThis.document?.querySelector?.(value); return true; } catch { return false; } })();
const sectionList = (list, label) => {
  assert.ok(Array.isArray(list) && list.length > 0, `${label} must be a non-empty array`);
  const ids = new Set();
  for (const entry of list) {
    assert.equal(typeof entry.id, "string", `${label}: id must be a string`);
    assert.ok(isSelector(entry.selector), `${label}: ${entry.id} needs a selector`);
    assert.ok(!ids.has(entry.id), `${label}: duplicate id ${entry.id}`);
    ids.add(entry.id);
  }
};

test("devices: real user agents for every width the suites use, with a unique id", () => {
  const ids = new Set();
  for (const d of DEVICES) {
    assert.ok(Number.isInteger(d.width) && d.width >= 320, `${d.id}: width`);
    assert.ok(Number.isInteger(d.height) && d.height >= 480, `${d.id}: height`);
    assert.ok(d.dpr >= 1 && d.dpr <= 4, `${d.id}: dpr`);
    assert.equal(typeof d.mobile, "boolean");
    assert.equal(typeof d.touch, "boolean");
    assert.match(d.ua, /^Mozilla\/5\.0 \(/, `${d.id}: UA must be a real browser UA`);
    assert.doesNotMatch(d.ua, /Headless/i, `${d.id}: UA must not announce headless`);
    assert.ok(["iphone-safari", "android-chrome", "mac-chrome"].includes(d.family), `${d.id}: family`);
    assert.ok(!ids.has(d.id), `duplicate device id ${d.id}`);
    ids.add(d.id);
  }
  const families = new Set(DEVICES.map((d) => d.family));
  assert.deepEqual([...families].sort(), ["android-chrome", "iphone-safari", "mac-chrome"], "all three real UA families are covered");
  const used = new Set([...QA_MANIFEST.home.widths, ...QA_MANIFEST.exchanges.widths, QA_MANIFEST.venuePages.width, QA_MANIFEST.rates.width, QA_MANIFEST.news.width]);
  for (const width of used) assert.equal(deviceForWidth(width).width, width);
  assert.throws(() => deviceForWidth(1), /no device profile/);
});

test("budgets are the release-gate thresholds", () => {
  const b = QA_MANIFEST.budgets;
  assert.equal(b.sectionTimeoutMs, 5000);
  assert.equal(b.idleJsMsPer5s, 50);
  assert.equal(b.cls, 0.1);
  assert.equal(b.consoleErrors, 0);
  assert.equal(b.hydrationErrors, 0);
  assert.ok(b.navigationTimeoutMs >= 15000);
});

test("home: the required locales, widths and section lists", () => {
  const H = QA_MANIFEST.home;
  assert.deepEqual([...H.widths], [344, 390, 768, 1440]);
  const codes = H.locales.map((l) => l.code);
  assert.deepEqual(codes, ["zh-Hans", "en", "tr", "ru"]);
  for (const loc of H.locales) {
    assert.ok(loc.code in LOCALE_PREFIX_BY_CODE, `${loc.code} is a site locale`);
    const prefix = LOCALE_PREFIX_BY_CODE[loc.code];
    assert.equal(loc.path, prefix ? `/${prefix}` : "/", `${loc.code}: path matches locale routing`);
    assert.ok(["full", "neutral"].includes(loc.mode), `${loc.code}: mode`);
    assert.equal(loc.mode === "neutral", isNeutralCtaLocale(loc.code), `${loc.code}: mode must follow locale-policy.js`);
    for (const venue of loc.forbiddenVenues || []) assert.ok(venue in partnerRegistry, `${loc.code}: forbidden venue ${venue} is a registry venue`);
  }
  assert.deepEqual(H.locales.find((l) => l.code === "tr").forbiddenVenues, ["bitget"], "Türkiye: Bitget stays forbidden (owner 2026-10-13)");
  sectionList(H.sections, "home.sections");
  sectionList(H.fullSections, "home.fullSections");
  for (const [locale, list] of Object.entries(H.localeSections)) {
    assert.ok(codes.includes(locale), `localeSections.${locale} must be a tested locale`);
    sectionList(list, `home.localeSections.${locale}`);
  }
  const ids = H.sections.map((s) => s.id);
  for (const required of ["hero", "partner-strip", "how", "whales", "calculator", "funding", "intel", "footer"]) assert.ok(ids.includes(required), `home.sections includes ${required}`);
  for (const required of ["desk", "rebate-figure", "invite-code", "hero-cta"]) assert.ok(H.fullSections.some((s) => s.id === required), `home.fullSections includes ${required}`);
  for (const key of ["desk", "tabs", "rebateDigits", "rebatePercentSign", "code", "heroCta", "headline", "stripVenue", "stripVenueShare", "brandSlugAttr"]) assert.ok(isSelector(H.selectors[key]), `home.selectors.${key}`);
  assert.ok(Object.values(HOME_REBATE_SHARE).some(Boolean), "registry declares at least one rebate share for the figure check");
});

test("fine print: the owner's forbidden strings, checked outside the footer", () => {
  assert.deepEqual([...FINE_PRINT_STRINGS], ["已内置邀请码", "仅链接官方注册页", "部分链接为合作推广链接", "不构成投资建议", "not financial advice"]);
  assert.equal(QA_MANIFEST.home.finePrint, FINE_PRINT_STRINGS);
  assert.equal(QA_MANIFEST.home.finePrintExcludeSelector, "footer");
});

test("exchanges, venue pages, rates, news and go sections are complete", () => {
  const { exchanges: E, venuePages: V, rates: R, news: N, go: G } = QA_MANIFEST;
  assert.equal(E.path, "/zh-hans/exchanges");
  assert.deepEqual([...E.widths], [344, 884, 1440]);
  for (const key of ["rowSelector", "rowCodeTextSelector"]) assert.ok(isSelector(E[key]), `exchanges.${key}`);
  assert.match(E.rowSlugAttr, /^data-/); assert.match(E.rowCodeAttr, /^data-/);
  assert.ok(E.minRowsWithCode >= 1);

  assert.deepEqual([...V.slugs], ["bitget", "okx"]);
  for (const slug of V.slugs) assert.ok(partnerRegistry[slug]?.inviteCode, `${slug} has a registry code`);
  assert.ok(V.pathFor.includes("{slug}"));
  assert.ok(isSelector(V.primaryCtaSelector));
  assert.ok(V.codeSelectors.length >= 1 && V.codeSelectors.every(isSelector));
  assert.doesNotThrow(() => new RegExp(V.directSignupPattern, "i"));

  assert.equal(R.path, "/zh-hans/rates"); assert.equal(R.width, 344); assert.ok(isSelector(R.nameSelector)); assert.ok(R.minNames >= 1);

  assert.equal(N.listPath, "/zh-hans/news"); assert.ok(isSelector(N.articleLinkSelector)); assert.ok(isSelector(N.articleBodySelector));
  const article = new RegExp(N.articleHrefPattern);
  assert.ok(article.test("/zh-hans/news/binance-delist-epic-quick-october-28-what-holders-should-do"), "an article slug is an article");
  for (const hub of ["/zh-hans/news/category/guide", "/zh-hans/news/tag/btc", "/zh-hans/news/page/2"]) assert.ok(!article.test(hub), `${hub} is not an article`);
  assert.ok(N.brokenDomainPatterns.length >= 1);
  for (const p of N.brokenDomainPatterns) assert.doesNotThrow(() => new RegExp(p, "i"));
  const broken = N.brokenDomainPatterns.map((p) => new RegExp(p, "i"));
  assert.ok(broken.some((re) => re.test("visit www. binance. com today")), "catches 'www. x. com'");
  assert.ok(!broken.some((re) => re.test("visit www.binance.com today")), "does not flag an intact domain");

  assert.match(G.userAgent, /bot/i, "the /go probe must look like a bot so no click is recorded (server/go-redirect.mjs BOT_UA)");
  assert.match(G.src, /^[a-z0-9][a-z0-9_-]{0,47}$/);
  assert.ok(G.maxHops >= 2);
  assert.doesNotThrow(() => new RegExp(G.placeholderCodePattern));
  assert.ok(new RegExp(G.placeholderCodePattern).test("NEXU_KUCOIN"));
  assert.ok(!new RegExp(G.placeholderCodePattern).test("NEXU888"));
});

test("the manifest is frozen and the runner is wired into package.json", () => {
  assert.ok(Object.isFrozen(QA_MANIFEST));
  assert.ok(Object.isFrozen(QA_MANIFEST.home));
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.scripts["qa:regression"], "node scripts/qa-regression.mjs");
  assert.match(pkg.scripts["test:qa-manifest"], /qa-regression-manifest\.test\.mjs/);
});

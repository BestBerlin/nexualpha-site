import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = new URL("..", import.meta.url);

test("catalog tooling validates the 15-locale contract", async () => {
  const { stdout } = await execFileAsync(process.execPath, ["scripts/i18n-check.mjs"], { cwd: fileURLToPath(root) });
  assert.match(stdout, /15 catalogs/);
});

test("the catalog covers every visible Pilot 01 page surface", async () => {
  const catalog = JSON.parse(await readFile(new URL("../locales/en.json", import.meta.url), "utf8"));
  const required = [
    "ui.language", "ui.menu", "finder.loading", "finder.error", "finder.retry",
    "event.officialSource", "event.partnerLinkAvailable", "decision.evidenceLed",
    "opportunity.state.restricted", "opportunity.seeAvailableAlternatives",
    "opportunity.viewOtherScenarios", "opportunity.hideOtherScenarios",
    "listings.verificationPending", "markets.tokenizedEquityDescription",
    "markets.stockPerpetualDescription", "discovery.checkRegionalAvailability",
    "footer.disclosure", "review.draftPendingHuman",
  ];
  for (const key of required) assert.equal(typeof catalog[key], "string", `${key} must be catalogued`);
});

test("Paraglide compiles typed full-page messages for every locale", async () => {
  const messages = await import(new URL("../src/paraglide/messages.js", import.meta.url));
  assert.equal(messages.m["opportunity.eyebrow"]({ state: "Active" }, { locale: "en" }), "CURRENT OPPORTUNITY · Active");
  assert.match(messages.m["opportunity.eyebrow"]({ state: "نشط" }, { locale: "ar" }), /نشط/);
  assert.equal(messages.m["markets.stockPerpetual"]({}, { locale: "ja" }), "株式パーペチュアル");
});

test("selector locales, catalog locales, and compiled runtime locales remain aligned", async () => {
  const [settingsText, manifest, app] = await Promise.all([
    readFile(new URL("../project.inlang/settings.json", import.meta.url), "utf8"),
    readFile(new URL("../src/content/locale-manifest.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
  ]);
  const runtime = await import(new URL("../src/paraglide/runtime.js", import.meta.url));
  const settings = JSON.parse(settingsText);
  assert.deepEqual(runtime.locales, settings.locales);
  assert.match(manifest, /export const localeManifest/);
  assert.doesNotMatch(manifest, /import .*\.\/locales\/|localeCatalogs/);
  assert.match(app, /supportedLocales\.map/);
  for (const locale of settings.locales) await readFile(new URL(`../locales/${locale}.json`, import.meta.url), "utf8");
});

test("V2 has one locale synchronisation path and routes visible copy through Paraglide", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const copy = await readFile(new URL("../src/content/v2-copy.js", import.meta.url), "utf8");
  assert.match(source, /supportedLocales\.map/);
  assert.match(source, /document\.documentElement\.lang = intlLocale\(locale\)/);
  assert.match(source, /setParaglideLocale\(locale, \{ reload: false \}\)/);
  assert.match(source, /window\.history\.replaceState/);
  assert.match(source, /window\.location\.assign\(localizedHref\(`\$\{window\.location\.pathname\}\$\{window\.location\.search\}\$\{window\.location\.hash\}`/);
  assert.match(copy, /m\[key\]/);
  assert.match(copy, /"navigation\.signals"/);
  assert.match(copy, /"zh-Hans": \{ ready: "决策工作台已就绪"/);
  for (const locale of ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"]) assert.match(copy, new RegExp(`"?${locale.replace("-", "\\-")}"?: \{ ready:`));
  assert.match(copy, /home: homepageCopy/);
  for (const locale of ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"]) assert.match(copy, new RegExp(`"?${locale.replace("-", "\\-")}"?: \{ label:`));
  assert.doesNotMatch(source, /See what is live\. Compare the terms\. Choose the venue\./);
});

test("V2 decision workbench labels stay localized beyond the primary locales", async () => {
  const { v2Copy } = await import(new URL("../src/content/v2-copy.js", import.meta.url));
  const english = v2Copy("en").decisionWorkbench;
  for (const locale of ["es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"]) {
    const workbench = v2Copy(locale).decisionWorkbench;
    assert.notEqual(workbench.discovered, english.discovered, `${locale}.decisionWorkbench.discovered must not fall back to English`);
    assert.notEqual(workbench.openOfficial, english.openOfficial, `${locale}.decisionWorkbench.openOfficial must not fall back to English`);
  }
});

test("V3 interface copy reflects reviewed partner routes instead of pre-launch referral placeholders", async () => {
  const { interfaceCopyByLocale } = await import(new URL("../src/content/v3-interface-copy.js", import.meta.url));
  const staleLaunchCopy = /CTA pending|CTA 保留中|CTA 대기|CTA beklemede|CTA pendente|CTA en attente|CTA ausstehend|CTA ожидается|CTA tertunda|CTA đang chờ|CTA in sospeso|provide referral|provided|提供された後|추천 코드와 목적지를 제공|رموز الإحالة والوجهات|Referans kodları ve hedefleri|реферальных кодов|kode referral|mã giới thiệu|codici referral|launch pending|lancement en attente|Lansman|ローンチ|출시 핸드오프|peluncuran tertunda|ra mắt đang chờ/i;
  for (const [locale, copy] of Object.entries(interfaceCopyByLocale)) {
    const visibleCopy = [
      copy.conversionIntent,
      copy.conversionIntentBody,
      copy.handoffLabel,
      copy.handoffBody,
      ...(copy.activityMetrics ?? []),
    ].join(" ");
    assert.doesNotMatch(visibleCopy, staleLaunchCopy, `${locale} contains stale pre-launch referral placeholder copy`);
    assert.match(visibleCopy, /partner|socio|parceiro|partenaire|合作|パートナー|파트너|شركاء|ortağı|партнёр|mitra|đối tác/i, `${locale} should describe reviewed partner routes`);
  }
});

// Local market briefs (links-l10n lane 2026-10-11; scorecard M5) and localized hub records (M1).
// Every source in a brief is either in the repository's source-bound registers or a regulator's official site; no
// partner exchange is presented as available without regional eligibility evidence.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { LOCAL_MARKET_BRIEFS, localMarketBrief } from "../src/data/local-market-brief.js";
import { REGIONAL_ELIGIBILITY_EVIDENCE } from "../src/data/regional-eligibility-evidence.js";
import { factbookHubItems, topicHubItems, hubRecordsLocalized } from "../src/data/collection-hubs.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const registerText = ["src/data/international-source-registry.js", "src/data/regional-funding-verification-matrix.js"].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
const OFFICIAL_REGULATOR_SITES = new Set(["https://spk.gov.tr", "https://ojk.go.id", "https://mof.gov.vn", "https://www.sbv.gov.vn"]);

test("briefs exist for tr, vi and id only, each tied to its market", () => {
  assert.deepEqual(Object.keys(LOCAL_MARKET_BRIEFS).sort(), ["id", "tr", "vi"]);
  assert.equal(localMarketBrief("en"), null);
  assert.deepEqual(["tr", "id", "vi"].map((locale) => LOCAL_MARKET_BRIEFS[locale].market), ["TR", "ID", "VN"]);
});

test("every source URL is in a source-bound register or is a regulator's official site", () => {
  for (const [locale, brief] of Object.entries(LOCAL_MARKET_BRIEFS)) {
    for (const section of brief.sections) {
      if (section.regulator) assert.ok(OFFICIAL_REGULATOR_SITES.has(section.regulator.url), `${locale}: regulator ${section.regulator.url}`);
      for (const item of section.items) {
        if (!item.source) continue;
        assert.ok(registerText.includes(item.source.url) || OFFICIAL_REGULATOR_SITES.has(item.source.url), `${locale}: ${item.source.url} is source-bound`);
      }
    }
  }
});

test("no partner exchange is called available while the eligibility register has no row for the market", () => {
  for (const brief of Object.values(LOCAL_MARKET_BRIEFS)) {
    assert.equal(REGIONAL_ELIGIBILITY_EVIDENCE[brief.market], undefined, `${brief.market}: update the brief when evidence lands`);
    const text = JSON.stringify(brief.sections);
    assert.doesNotMatch(text, /registrationUrl|invite|referral|join\/|nexu888/i, "no partner link or code");
  }
  assert.doesNotMatch(JSON.stringify(LOCAL_MARKET_BRIEFS.vi.sections), /QRIS|VND bank|chuyển khoản ngân hàng/i, "Vietnam names no unsourced payment rail");
});

test("factbook and topic hub records are written in the page language in every UI locale", () => {
  const english = factbookHubItems("en");
  const englishTopics = topicHubItems("en");
  for (const locale of ["zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar"]) {
    assert.ok(hubRecordsLocalized("factbook", locale) && hubRecordsLocalized("topics", locale), locale);
    factbookHubItems(locale).forEach((item, index) => {
      assert.notEqual(item.description, english[index].description, `${locale}/${item.slug}: description`);
      assert.doesNotMatch(item.description, /not yet checked|^[^:]*: spot .*; perpetual |off spot fees/, `${locale}/${item.slug}: no English template words`);
    });
    topicHubItems(locale).forEach((item, index) => {
      for (const field of ["name", "title", "description"]) assert.notEqual(item[field], englishTopics[index][field], `${locale}/${item.slug}: ${field}`);
    });
  }
});

test("the home local-market section is on (owner approved 2026-10-11)", async () => {
  const { LOCAL_MARKET_BRIEF_ENABLED } = await import("../src/data/local-market-brief.js");
  assert.equal(LOCAL_MARKET_BRIEF_ENABLED, true);
});

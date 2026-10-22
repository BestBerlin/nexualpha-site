import { existsSync as historicalFixtureExists } from 'node:fs';
// Only historical comparisons need this external review snapshot. Local checks run.
const historicalFixture = new URL("../../../r212-activity-research-localization-v3/candidate", import.meta.url);
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import test from "node:test";
import { officialCampaignResearchLocalizations, OFFICIAL_CAMPAIGN_LOCALIZED_LOCALES } from "../src/data/official-campaign-localizations.js";

const localeSet = new Set(OFFICIAL_CAMPAIGN_LOCALIZED_LOCALES);
const nonEnglish = OFFICIAL_CAMPAIGN_LOCALIZED_LOCALES.filter((locale) => locale !== "en");
const get = (path) => path.split(".").reduce((node, key) => node?.[key], officialCampaignResearchLocalizations);

function localizedLeafPaths(root = officialCampaignResearchLocalizations) {
  const rows = [];
  const visit = (value, path = []) => {
    if (!value || typeof value !== "object") return;
    if (typeof value.en === "string") {
      rows.push(path.join("."));
      return;
    }
    for (const [key, child] of Object.entries(value)) visit(child, path.concat(key));
  };
  visit(root);
  return rows;
}

const correctedPaths = [
  "binance.signupReward.conditions.2",
  "bybit.sources.bybit-rewards-faq.summary",
  "bybit.sources.bybit-cpusdt-september.summary",
  "bitget.sources.bitget-hajimi-september.summary",
  "okx.sources.okx-fet-september.summary",
  "kraken.signupReward.summary",
  "kraken.evidenceRequirements.limitations",
  "kraken.evidenceRequirements.gaps.1",
  "kucoin.sources.kucoin-marscoin-september.summary",
  "mexc.sources.mexc-welcome-guide.summary",
  "backpack.signupReward.conditions.2",
  "backpack.evidenceRequirements.limitations",
  "deribit.signupReward.summary",
  "deribit.signupReward.conditions.1",
  "deribit.evidenceRequirements.trading",
  "deribit.evidenceRequirements.maximumConditions",
  "deribit.notices.0",
  "gmx.signupReward.summary",
  "gmx.evidenceRequirements.maximumConditions",
  "gmx.signupReward.conditions.1",
  "gmx.evidenceRequirements.trading",
];

test("R212v4 audits the full localization field surface and keeps registry/source files untouched", { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
  assert.equal(localizedLeafPaths().length, 304, "all 304 localized official-campaign fields remain present");
  for (const path of localizedLeafPaths()) {
    const field = get(path);
    assert.equal(typeof field.en, "string", `${path} keeps English source text`);
    for (const locale of nonEnglish) assert.ok(field[locale]?.trim(), `${path} has ${locale}`);
  }
  assert.equal(createHash("sha256").update(readFileSync(new URL("../src/data/partner-registry.js", import.meta.url))).digest("hex"), "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a");
  const researchNow = createHash("sha256").update(readFileSync(new URL("../src/data/official-campaign-research.js", import.meta.url))).digest("hex");
  const researchV3 = createHash("sha256").update(readFileSync(new URL("../../../r212-activity-research-localization-v3/candidate/src/data/official-campaign-research.js", import.meta.url))).digest("hex");
  assert.equal(researchNow, researchV3, "official source metadata remains byte-identical to v3");
});

test("R212v4 corrected paths retain English facts and complete locale coverage", () => {
  for (const path of correctedPaths) {
    const field = get(path);
    assert.ok(field?.en, `${path} exists`);
    for (const locale of OFFICIAL_CAMPAIGN_LOCALIZED_LOCALES) {
      assert.ok(localeSet.has(locale));
      assert.equal(typeof field[locale], "string", `${path} has ${locale}`);
      assert.ok(field[locale].trim().length > 0, `${path} has non-empty ${locale}`);
    }
  }
});

test("spot availability and spot exclusion are never translated as seats, place, or location", () => {
  const cpusdt = get("bybit.sources.bybit-cpusdt-september.summary");
  assert.match(cpusdt.ko, /현물 거래/);
  assert.doesNotMatch(cpusdt.ko, /좌석/);
  assert.match(cpusdt.es, /disponibilidad de spot/);
  assert.doesNotMatch(cpusdt.es, /plazas/);
  assert.match(cpusdt["pt-BR"], /mercado à vista/);
  assert.doesNotMatch(cpusdt["pt-BR"], /vagas/);
  assert.match(cpusdt.fr, /disponibilité au comptant/);
  assert.doesNotMatch(cpusdt.fr, /places/);
  assert.match(cpusdt.de, /Spot-Verfügbarkeit/);
  assert.doesNotMatch(cpusdt.de, /Plätzen/);
  assert.match(cpusdt.ru, /спотовой торговли/);
  assert.doesNotMatch(cpusdt.ru, /наличие мест/);
  assert.match(cpusdt.id, /perdagangan spot/);
  assert.doesNotMatch(cpusdt.id, /ketersediaan tempat/);
  assert.match(cpusdt.it, /disponibilità spot/);
  assert.doesNotMatch(cpusdt.it, /posti/);

  const deribit = get("deribit.signupReward.summary");
  assert.match(deribit.es, /trading spot está excluido/);
  assert.doesNotMatch(deribit.es, /lugar está excluido/);
  assert.match(deribit["pt-BR"], /negociação à vista está excluída/);
  assert.doesNotMatch(deribit["pt-BR"], /local (?:é|está) exclu/i);
  assert.match(deribit.ru, /спотовая торговля исключена/);
  assert.doesNotMatch(deribit.ru, /место исключено/);
  assert.match(deribit.vi, /giao dịch spot bị loại trừ/);
  assert.doesNotMatch(deribit.vi, /tại chỗ bị loại trừ/);
});

test("current exchange account wording is not translated as a bank current account", () => {
  const okx = get("okx.sources.okx-fet-september.summary");
  assert.match(okx.ko, /거래소 계정/);
  assert.doesNotMatch(okx.ko, /당좌 계좌/);
  assert.match(okx.es, /cuenta de exchange actual/);
  assert.doesNotMatch(okx.es, /cuenta corriente/);
  assert.match(okx.de, /Börsenkonto/);
  assert.doesNotMatch(okx.de, /Girokonto/);
  assert.match(okx.id, /akun exchange/);
  assert.doesNotMatch(okx.id, /rekening giro/);
  assert.match(okx.vi, /tài khoản sàn hiện tại/);
  assert.doesNotMatch(okx.vi, /tài khoản vãng lai/);
  const mexc = get("mexc.sources.mexc-welcome-guide.summary");
  assert.doesNotMatch(mexc["pt-BR"], /conta corrente/);
  assert.match(mexc["pt-BR"], /conta atual/);
});

test("perpetual contracts and attribution use the right domain, not permanent availability", () => {
  const okx = get("okx.sources.okx-fet-september.summary");
  assert.match(okx.es, /contratos perpetuos/);
  assert.match(okx.de, /Perpetual-Kontrakte/);
  assert.match(okx.ru, /бессрочных контрактов/);
  assert.doesNotMatch(okx.fr, /disponibilité permanente|perpétuelles FET/);
  const backpack = get("backpack.signupReward.conditions.2");
  assert.match(backpack.ja, /株式無期限契約/);
  assert.doesNotMatch(backpack.ja, /株式永久手数料/);
  assert.match(backpack.es, /contratos perpetuos sobre acciones/);
  assert.doesNotMatch(backpack.es, /capital perpetuas|perpetuas de capital/);
  const deribitNotice = get("deribit.notices.0");
  assert.match(deribitNotice.en, /perpetual attribution/);
  assert.match(deribitNotice.es, /atribución a largo plazo/);
  assert.doesNotMatch(deribitNotice.es, /perpetua/);
});

test("funding fee terminology avoids loan or fund-raising semantics where derivatives funding is meant", () => {
  const cpusdt = get("bybit.sources.bybit-cpusdt-september.summary");
  assert.match(cpusdt.ko, /펀딩비/);
  assert.match(cpusdt.tr, /fonlama ücreti/);
  assert.match(cpusdt.de, /Funding-Gebühren/);
  assert.match(cpusdt.ru, /фондирования/);
  assert.match(cpusdt.id, /biaya funding/);
  assert.match(cpusdt.vi, /phí funding/);
  const gmx = get("gmx.signupReward.summary");
  assert.match(gmx.de, /Borrowing-Gebühren und Funding-Gebühren/);
  assert.match(gmx.ru, /Комиссии за заимствование и комиссии фондирования/);
  assert.match(gmx.vi, /Phí vay và phí funding/);
  assert.doesNotMatch(gmx.ko, /자금 조달 수수료/);
  assert.doesNotMatch(gmx.tr, /finansman ücretleri/);
});

test("default-currency conflict keeps fixed 20 separate from USD claims", () => {
  const kraken = get("kraken.signupReward.summary");
  assert.match(kraken.ko, /기본 통화 기준 고정 20/);
  assert.doesNotMatch(kraken.ko, /20달러/);
  assert.match(kraken.de, /20 in der Standardwährung/);
  assert.doesNotMatch(kraken.de, /20 US-Dollar/);
  assert.match(kraken.ru, /20 в валюте по умолчанию/);
  assert.doesNotMatch(kraken.ru, /20 долларов/);
  assert.match(kraken.vi, /20 theo loại tiền mặc định/);
  assert.doesNotMatch(kraken.vi, /20 USD/);
  assert.match(kraken.ar, /20 ثابتًا بالعملة الافتراضية/);
});

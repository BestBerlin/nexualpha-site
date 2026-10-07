import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../src/components/v3/RegistrationCard.jsx", import.meta.url), "utf8");
const decisionStateSource = await readFile(new URL("../src/components/v3/registration-decision-state.js", import.meta.url), "utf8");
const start = source.indexOf("const copyDict = ");
const end = source.indexOf("function getCopy", start);
assert.ok(start >= 0 && end > start, "RegistrationCard copy dictionary boundary exists");

const copyDict = runInNewContext(
  `${source.slice(start, end).replace("const copyDict = ", "var copyDict = ")}\ncopyDict;`,
  {},
  { timeout: 1000 },
);

const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"];
const routeAndPreflightKeys = [
  "officialRouteState",
  "openOfficial",
  "continueCompare",
  "telegramResearch",
  "preflightTitle",
  "preflightWithCode",
  "preflightNoCode",
  "preflightOfficial",
  "preflightBlocked",
];
const stateAndDisclosureKeys = [
  "antiPhishingTip",
  "routeState",
  "routeReady",
  "routePending",
  "benefitState",
  "benefitVerified",
  "benefitPending",
  "regionState",
  "regionReady",
  "regionVerify",
  "regionBlocked",
  "disclosureTitle",
  "disclosureShort",
  "disclosureBody",
  "disclosureSummary",
  "unavailable",
];
const requiredKeys = [...routeAndPreflightKeys, ...stateAndDisclosureKeys];

function plain(value) {
  return String(value || "").replace(/[\s:：。.!！?؟]+/g, "").toLowerCase();
}

test("RegistrationCard priority route, state and disclosure copy is localized for every supported locale", () => {
  for (const locale of locales) {
    assert.ok(copyDict[locale], `${locale} copy exists`);
    for (const key of requiredKeys) {
      assert.equal(typeof copyDict[locale][key], "string", `${locale}.${key}`);
      assert.ok(copyDict[locale][key].trim(), `${locale}.${key} has text`);
    }
    assert.match(copyDict[locale].preflightWithCode, /\{code\}/, `${locale}.preflightWithCode preserves referral-code placeholder`);
    assert.notEqual(plain(copyDict[locale].disclosureTitle), plain(copyDict[locale].disclosureShort), `${locale} disclosure title and short text must not repeat`);
    assert.notEqual(plain(copyDict[locale].disclosureShort), plain(copyDict[locale].disclosureBody), `${locale} disclosure short and body must not repeat`);
  }

  for (const locale of locales.filter((value) => value !== "en")) {
    for (const key of requiredKeys) {
      assert.notEqual(copyDict[locale][key], copyDict.en[key], `${locale}.${key} must not fall back to English`);
    }
  }
});

test("RegistrationCard route and benefit state copy preserves configured versus pending semantics", () => {
  const readyMustNotContain = /pending|waiting|await|قيد|بانتظار|待|未設定|bekl|pendent|en attente|aussteh|ожида|menunggu|chờ|in attesa/i;
  const pendingMustNotContain = /configured|ready|verified|확인됨|確認済み|doğrulandı|تم التحقق|已审核|已核验/i;

  for (const locale of locales) {
    assert.doesNotMatch(copyDict[locale].routeReady, readyMustNotContain, `${locale}.routeReady must mean configured, not pending`);
    assert.doesNotMatch(copyDict[locale].benefitVerified, /guarantee|guaranteed|保証|보장|garanti|مضمون|garantizado|garantido|garantie/i, `${locale}.benefitVerified must not guarantee user benefit`);
    assert.doesNotMatch(copyDict[locale].benefitPending, pendingMustNotContain, `${locale}.benefitPending must require official confirmation`);
  }
});

test("RegistrationCard localized copy keeps official route and regional eligibility boundaries", () => {
  assert.match(copyDict.en.regionReady, /official flow/i);
  assert.match(copyDict.ja.regionReady, /公式/);
  assert.match(copyDict.tr.regionReady, /resmi/i);
  assert.match(copyDict.ar.regionReady, /الرسمية|رسمي/);

  for (const locale of locales) {
    assert.doesNotMatch(copyDict[locale].preflightWithCode, /guarantee|guaranteed|legal worldwide|globally legal|保证|保證|保証|보장|garanti|مضمون/i, `${locale}.preflightWithCode must not overpromise`);
    assert.doesNotMatch(copyDict[locale].regionReady, /legal worldwide|globally legal|全球合法|全世界合法|世界中で合法|전세계 합법|küresel yasal|قانوني عالمياً/i, `${locale}.regionReady must not imply global legality`);
  }
});

test("RegistrationCard localized preflight copy does not mutate outbound href or invite-code fields", () => {
  assert.match(decisionStateSource, /protectedHref: regionalCta\.ctaHref/);
  assert.match(source, /const primaryRegistrationHref = registrationDecision\.canOpenThirdParty \? registrationDecision\.protectedHref : null/);
  assert.match(source, /href=\{primaryRegistrationHref\}/);
  assert.match(source, /copy\.preflightWithCode\.replace\("\{code\}", visiblePartner\.inviteCode\)/);
  assert.doesNotMatch(source, /registrationUrl\s*=\s*|inviteCode\s*=/);
});

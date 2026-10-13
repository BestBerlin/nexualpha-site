import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

import { interfaceCopyByLocale } from "../src/content/v3-interface-copy.js";

const localeManifest = await readFile(new URL("../src/content/locale-manifest.ts", import.meta.url), "utf8");
const v3Product = await readFile(new URL("../src/data/v3-product.js", import.meta.url), "utf8");
const supportedLocales = [...localeManifest.matchAll(/^\s+"?([A-Za-z-]+)"?:\s*\{\s*language:/gm)].map((match) => match[1]);
// Execute the actual static copy objects/router without the unrelated venue
// asset import. This also catches later duplicate keys overriding a translation.
const copyBoundary = v3Product.indexOf("export const v3VenueSlugs");
assert.ok(copyBoundary > 0, "copy module boundary is present");
const runtimeCopy = runInNewContext(
  `${v3Product.slice(0, copyBoundary).replace(/^import .*;\s*$/m, "").replace("export function v3Copy", "function v3Copy")}\nv3Copy;`,
  {},
  { timeout: 1000 },
);

test("commercial disclosures describe existing partner links, not a future launch", () => {
  const obsolete = /will be disclosed|futuro|futur lien|spätere|将来の商業|향후 상업|مستقبلي|Gelecekteki|будущая|di masa depan|sau này|会在按钮|會在按鈕/iu;
  for (const locale of supportedLocales) {
    assert.doesNotMatch(runtimeCopy(locale).relationship, obsolete, locale);
  }
});

test("locale UI labels do not leak wrong-script labels or Chinese punctuation into English", () => {
  const expectedAccessModel = {
    en: "Access model",
    ur: "رسائی ماڈل",
    uk: "Модель доступу",
  };
  for (const [locale, expected] of Object.entries(expectedAccessModel)) {
    assert.equal(runtimeCopy(locale).accessModel, expected, `${locale}.accessModel`);
  }
  for (const value of flattenStrings(runtimeCopy("en"))) {
    assert.doesNotMatch(value, /[\u0400-\u04ff]/u, `English UI label leaked Cyrillic: ${value}`);
    assert.doesNotMatch(value, /。/u, `English UI label leaked Chinese full stop: ${value}`);
  }
});

const decisionStringKeys = [
  "registrationPrepCta", "registrationPrepHint", "compareVerdictEyebrow",
  "compareVerdictTitle", "compareVerdictLead", "verdictBestFor",
  "verdictRegistrationFit", "verdictAlternative", "detailBestFit",
  "detailWhyChoose", "detailNotFor", "detailPreKycFunding", "detailActivity",
  "detailCompare", "detailHandoff",
];

const requiredStringKeys = [
  ...decisionStringKeys,
  "independent",
  "relationship",
  "activities",
  "venueDetail",
  "deepCompare",
  "openDetail",
  "openActivities",
  "openActivityDetail",
  "activityDetail",
  "activityNotFound",
  "registrationLocked",
  "ctaLocked",
  "verifiedOnly",
  "funnelEyebrow",
  "funnelTitle",
  "funnelIntro",
  "conversionPreviewTitle",
  "conversionPreviewBody",
  "compareTitle",
  "compareIntro",
  "activityEmpty",
  "sourceIntake",
  "similar",
  "shortlist",
  "verifyBefore",
  "conversionPath",
  "comparisonMatrix",
  "noOfficial",
  "productFamily",
  "platformType",
  "accessModel",
  "researchScope",
  "officialDomain",
  "sourceState",
  "partnerState",
  "activityState",
  "notConfigured",
  "pendingReview",
  "viewCompare",
  "backToDirectory",
  "openOfficialSource",
  "trackedSources",
  "reviewedActivity",
  "noReviewedActivity",
  "sourceHost",
  "viewLabel",
  "cardsView",
  "listView",
  "sortLabel",
  "sortName",
  "sortType",
  "sortSource",
];

const categories = ["CEX", "DEX", "Perp DEX"];

function localeObjectSource(locale) {
  const constName = locale === "pt-BR" ? "ptBR" : locale.replace(/-([A-Za-z])/g, (_, letter) => letter.toUpperCase());
  const start = v3Product.indexOf(`const ${constName} = {`);
  assert.notEqual(start, -1, `${locale} copy object`);
  const end = v3Product.indexOf("\nconst ", start + 1);
  return v3Product.slice(start, end === -1 ? v3Product.length : end);
}

function explicitString(source, key, locale) {
  const match = source.match(new RegExp(`^  ${key}: ("(?:[^"\\\\]|\\\\.)*"),?$`, "m"));
  assert.ok(match, `${locale}.${key} must explicitly define localized UI text`);
  const value = JSON.parse(match[1]);
  assert.ok(value.trim(), `${locale}.${key} must not be empty`);
  return value;
}

function flattenStrings(value) {
  if (typeof value === "string") return [value];
  if (typeof value === "function") return [value("Binance", "CEX")];
  if (Array.isArray(value)) return value.flatMap(flattenStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(flattenStrings);
  return [];
}

for (const locale of supportedLocales.filter((value) => !["en", "zh-Hans", "zh-Hant"].includes(value))) {
  test(`${locale} comparison and detail UI cannot inherit English defaults`, () => {
    const source = localeObjectSource(locale);
    const english = localeObjectSource("en");
    for (const key of decisionStringKeys) {
      const localized = explicitString(source, key, locale);
      assert.notEqual(localized, explicitString(english, key, "en"), `${locale}.${key} is still English`);
      assert.equal(runtimeCopy(locale)[key], localized, `${locale}.${key} runtime must use its translation`);
      assert.notEqual(runtimeCopy(locale)[key], runtimeCopy("en")[key], `${locale}.${key} runtime fell back to English`);
    }
  });
}

test("every locale explicitly owns the full product copy schema, except the shared brand version", () => {
  const keys = Object.keys(runtimeCopy("en")).filter((key) => key !== "version");
  for (const locale of supportedLocales) {
    const source = localeObjectSource(locale);
    for (const key of keys) {
      assert.match(source, new RegExp(`^  ${key}:`, "m"), `${locale}.${key} needs an explicit value when the schema expands`);
      assert.equal(typeof runtimeCopy(locale)[key], typeof runtimeCopy("en")[key], `${locale}.${key} type`);
    }
  }
});

test("NexuAlpha 3.0 copy covers the required locale fields and category structure", () => {
  for (const locale of supportedLocales) {
    const constName = locale === "pt-BR" ? "ptBR" : locale.replace(/-([A-Za-z])/g, (_, letter) => letter.toUpperCase());
    assert.match(v3Product, new RegExp(`const ${constName} = \\{`), `${locale} copy object`);
    if (locale !== "en") assert.match(v3Product, new RegExp(`if \\(locale === "${locale.replace("-", "\\-")}"\\) return ${constName};`), `${locale} v3Copy route`);
    const objectStart = v3Product.indexOf(`const ${constName} = {`);
    const nextConst = v3Product.indexOf("\nconst ", objectStart + 1);
    const objectSource = v3Product.slice(objectStart, nextConst === -1 ? v3Product.length : nextConst);
    for (const key of requiredStringKeys) assert.match(objectSource, new RegExp(`\\b${key}:`), `${locale}.${key}`);
    assert.match(objectSource, /detailTitle:/, `${locale}.detailTitle`);
    assert.match(objectSource, /detailBody:/, `${locale}.detailBody`);
    assert.match(objectSource, /resultVenues:/, `${locale}.resultVenues`);
    assert.match(objectSource, /funnelSteps:\s*\[/, `${locale}.funnelSteps`);
    const readiness = objectSource.match(/readinessChecks:\s*\[([^\]]+)\]/);
    assert.ok(readiness, `${locale}.readinessChecks`);
    assert.equal((readiness[1].match(/"/g) ?? []).length / 2, 4, `${locale}.readinessChecks length`);
    for (const category of categories) {
      assert.ok(objectSource.includes(`${category}:`) || objectSource.includes(`"${category}":`), `${locale}.${category}`);
    }
    if (!["en", "zh-Hans", "zh-Hant"].includes(locale)) {
      assert.doesNotMatch(objectSource, /Shortlist first\. Registration handoff stays closed until launch inputs are verified\./, `${locale}.conversionPreviewTitle must not fall back to English`);
      assert.doesNotMatch(objectSource, /NexuAlpha turns exchanges, activities, listings, and multi-asset routes into comparable choices/, `${locale}.conversionPreviewBody must not fall back to English`);
      assert.doesNotMatch(objectSource, /Official domain labelled|Directory comparable|Activity hub prepared|CTA pending review/, `${locale}.readinessChecks must not fall back to English`);
    }
  }
});

test("Turkish product copy keeps native diacritics in high-intent controls", () => {
  const copy = runtimeCopy("tr");
  assert.equal(copy.sortLabel, "Sırala");
  assert.equal(copy.sortType, "Tür");
  assert.match(copy.detailBody("Binance", "CEX"), /bağımsız|Doğrulanabilir|erişim|kanıtsız|ücret|bölge/);
  assert.match(copy.accessByCategory.DEX, /Cüzdan|ağ|doğrula/);
  assert.match(copy.useCasesByCategory.CEX.join(" "), /platformları|karşılaştır|bölge|işlem|doğrula/);
  assert.match(copy.checksByCategory.CEX.join(" "), /Bölgende|uygunluğu|türev ürünün|şartları/);
});

test("Korean and Turkish interface copy does not leak generic English wallet or perpetual labels", () => {
  const disallowed = /\b(?:wallet|On-chain perpetuals)\b/i;
  for (const locale of ["ko", "tr"]) {
    const values = [...flattenStrings(runtimeCopy(locale)), ...flattenStrings(interfaceCopyByLocale[locale])];
    for (const value of values) assert.doesNotMatch(value, disallowed, `${locale}: ${value}`);
  }
});

test("Korean and Turkish high-intent CTA copy speaks in local signup decisions", () => {
  const ko = runtimeCopy("ko");
  assert.match(ko.conversionPreviewTitle, /가입하기 전에/);
  assert.equal(ko.registrationLocked, "공식 가입 조건 확인");
  assert.match(ko.ctaLocked, /파트너 가입 링크|공식 절차/);
  assert.match(ko.registrationPrepHint, /내 지역|본인확인|입금 방식|파트너 가입 링크|공식 절차/);
  assert.match(ko.compareVerdictTitle, /계정을 만들지/);
  assert.match(ko.detailPreKycFunding, /본인확인/);
  assert.match(interfaceCopyByLocale.ko.conversionIntentBody, /내 지역|본인확인|입금 방식/);
  assert.match(interfaceCopyByLocale.ko.handoffBody, /본인확인/);
  assert.doesNotMatch([ko.registrationPrepHint, ko.compareVerdictLead, interfaceCopyByLocale.ko.handoffBody].join(" "), /\bKYC\b/);

  const tr = runtimeCopy("tr");
  assert.match(tr.conversionPreviewTitle, /Kayıt olmadan önce/);
  assert.equal(tr.registrationLocked, "Resmi kayıt koşullarını kontrol et");
  assert.match(tr.ctaLocked, /Partner kayıt linki|resmi akış/);
  assert.match(tr.registrationPrepHint, /Bölgeni|kimlik doğrulama|para yatırma|Partner kayıt linki|resmi akış/);
  assert.match(tr.compareVerdictTitle, /Hesabı hangi platformda açacağını/);
  assert.match(tr.detailPreKycFunding, /kimlik doğrulama/);
  assert.match(interfaceCopyByLocale.tr.conversionIntentBody, /bölgeni|kimlik doğrulama|para yatırma/i);
  assert.match(interfaceCopyByLocale.tr.handoffBody, /kimlik doğrulama verisi/);
  assert.doesNotMatch([tr.registrationPrepHint, tr.compareVerdictLead, interfaceCopyByLocale.tr.handoffBody].join(" "), /\bKYC\b|funding/i);
});


test("venue shared and Telegram command copy avoid localized configured placeholders", async () => {
  const venueShared = await readFile(new URL("../src/components/v3/venue-detail-shared.jsx", import.meta.url), "utf8");
  const telegram = await readFile(new URL("../src/data/telegram-config.js", import.meta.url), "utf8");
  assert.doesNotMatch(venueShared, /non configuré|nicht konfiguriert|未設定|미설정|yapılandırılmadı|dikonfigurasi|non configurato|已配置|待配置|не настроен|chưa cấu hình|لم يضبط/i);
  assert.doesNotMatch(telegram, /設定済みの公式ソース|설정된 공식 출처|yapılandırılmış resmî kaynak|已配置的官方来源|已配置的官方來源/i);
  assert.match(venueShared, /コード不要または記録なし/);
  assert.match(venueShared, /코드 불필요 또는 기록 없음/);
  assert.match(venueShared, /Kein Code nötig oder verzeichnet/);
  assert.match(telegram, /記録済みの公式ソース/);
  assert.match(telegram, /기록된 공식 출처/);
  assert.match(telegram, /kayıtlı resmî kaynaklara/);
});

test("v3 notConfigured labels avoid internal configured-state wording", () => {
  const internalConfiguredPhrases = /待配置|待設定|Pending configuration|Pendiente|Pendente|En attente|Ausstehend|条件確認中|조건 확인 중|قيد الاعداد|Ожидает настройки|Menunggu|Đang chờ|In attesa|کنفیگریشن زیر التوا|Очікує налаштування/i;
  for (const locale of supportedLocales) {
    assert.doesNotMatch(runtimeCopy(locale).notConfigured, internalConfiguredPhrases, `${locale}.notConfigured`);
  }
});

test("Japanese, Korean, and Turkish registration copy verifies official signup conditions without stale launch states", () => {
  const ja = runtimeCopy("ja");
  assert.equal(ja.registrationLocked, "公式登録条件を確認");
  assert.match(ja.ctaLocked, /提携登録リンク|公式手続き/);
  assert.match(ja.registrationPrepHint, /提携登録リンク|公式手続き/);

  for (const locale of ["ja", "ko", "tr"]) {
    const text = runtimeCopy(locale);
    const visible = [text.registrationLocked, text.ctaLocked, text.notConfigured, text.registrationPrepHint].join(" ");
    assert.doesNotMatch(visible, /未設定|등록 이동 대기|Kayıt aktarımı bekliyor|ローンチ前|출시 전|lansman öncesi/);
  }
});

test("No-KYC topic localizes the Korean and Turkish decision rail copy", async () => {
  const source = await readFile(new URL("../src/components/v3/TopicGuidePage.jsx", import.meta.url), "utf8");
  assert.match(source, /지갑 연결형 프로토콜, CEX 계정, 무기한 계약 비교/);
  assert.match(source, /No-KYC 조건은 지역, 상품, 출금, 계정 단계/);
  assert.match(source, /Önce cüzdan erişimi, CEX hesabı ve perp karşılaştırmasını ayırın/);
  assert.match(source, /No-KYC koşulları bölge, ürün, çekim ve hesap aşaması/);
  assert.match(source, /거래 비용 계산/);
  assert.match(source, /İşlem maliyetini hesapla/);
});

test("3.0 localized profiles preserve English platform brand names and keep CTA closed", () => {
  assert.match(v3Product, /partnerCtaState: "CTA_NOT_CONFIGURED"/);
  assert.match(v3Product, /activityState: "PENDING_REVIEW"/);
  for (const brand of ["NexuAlpha", "Binance", "Bybit", "OKX", "Backpack"]) assert.match(v3Product, new RegExp(brand));
  assert.doesNotMatch(v3Product, /币安|歐易|欧易|拜比特|背包交易所/);
});

test("priority venue profiles have original decision content without enabling CTA", () => {
  const profileBlock = v3Product.slice(v3Product.indexOf("const priorityProfiles = {"), v3Product.indexOf("export function venueProfile"));
  for (const slug of ["binance", "coinbase", "okx", "bybit", "backpack"]) {
    for (const field of ["positioning", "useCases", "checks", "strengths", "limitations", "suggestedComparisons"]) {
      assert.match(profileBlock, new RegExp(`${slug}: \\{[\\s\\S]*?${field}:`), `${slug}.${field}`);
    }
  }
  assert.doesNotMatch(profileBlock, /href|开户链接|注册跳转:|ALLOW/);
});

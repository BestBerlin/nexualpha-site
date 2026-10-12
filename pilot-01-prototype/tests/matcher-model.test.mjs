import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  compareHref,
  detailHref,
  intentFromSelection,
  matcherDecisionDefaults,
  matcherCopy,
  matcherSupportedLocales,
  normalizeMatcherDecisionPassport,
  platformMatcherIntentKeys,
  platformMatcherModel,
  selectionForIntent,
} from "../src/components/v3/matcher-model.js";

const localeManifest = await readFile(new URL("../src/content/locale-manifest.ts", import.meta.url), "utf8");
const platformMatcher = await readFile(new URL("../src/components/v3/PlatformMatcher.jsx", import.meta.url), "utf8");
const supportedLocales = [...localeManifest.matchAll(/^\s+"?([A-Za-z-]+)"?:\s*\{\s*language:/gm)].map((match) => match[1]);

const venues = [
  { slug: "binance", name: "Binance", category: "CEX", officialDomain: "www.binance.com" },
  { slug: "okx", name: "OKX", category: "CEX", officialDomain: "www.okx.com" },
  { slug: "uniswap", name: "Uniswap", category: "DEX", officialDomain: "app.uniswap.org" },
  { slug: "jupiter", name: "Jupiter", category: "DEX", officialDomain: "jup.ag" },
  { slug: "hyperliquid", name: "Hyperliquid", category: "Perp DEX", officialDomain: "app.hyperliquid.xyz" },
  { slug: "dydx", name: "dYdX", category: "Perp DEX", officialDomain: "dydx.trade" },
];

test("matcher copy covers every supported locale without reusing the English object", () => {
  assert.deepEqual(matcherSupportedLocales().sort(), supportedLocales.sort());
  for (const locale of supportedLocales) {
    const copy = matcherCopy(locale);
    assert.equal(typeof copy.title, "string", `${locale}.title`);
    assert.equal(typeof copy.intents.accountCex.body, "string", `${locale}.accountCex.body`);
    assert.equal(typeof copy.intents.walletDex.risk, "string", `${locale}.walletDex.risk`);
    assert.equal(typeof copy.intents.onchainPerp.custody, "string", `${locale}.onchainPerp.custody`);
    assert.equal(typeof copy.decisionLabels.custody, "string", `${locale}.decisionLabels.custody`);
    assert.equal(typeof copy.decisionLabels.model, "string", `${locale}.decisionLabels.model`);
    assert.equal(typeof copy.decisionLabels.risk, "string", `${locale}.decisionLabels.risk`);
    if (locale !== "en") assert.notEqual(copy, matcherCopy("en"), `${locale} must not return English copy object`);
  }
});

test("matcher builds three intent routes with category-bound shortlists", () => {
  const model = platformMatcherModel({ locale: "zh-Hans", venues, intentKey: "walletDex", selected: ["uniswap"] });
  assert.deepEqual(platformMatcherIntentKeys, ["accountCex", "walletDex", "onchainPerp"]);
  assert.equal(model.activeIntentKey, "walletDex");
  assert.equal(model.activeIntent.category, "DEX");
  assert.deepEqual(model.shortlist.map((venue) => venue.slug), ["uniswap", "jupiter"]);
  assert.equal(model.shortlist[0].href, "/zh-hans/exchanges/uniswap");
  assert.equal(model.comparisonHref, "/zh-hans/compare/uniswap-vs-jupiter");
  assert.equal(model.canCompare, true);
});

test("compare selection intentionally picks the first two venues for the chosen intent", () => {
  assert.deepEqual(selectionForIntent(venues, "accountCex"), ["binance", "okx"]);
  assert.deepEqual(selectionForIntent(venues, "onchainPerp"), ["hyperliquid", "dydx"]);
  assert.equal(intentFromSelection(venues, ["jupiter"]), "walletDex");
});

test("given intent choice is not overwritten by selected prop category", () => {
  const model = platformMatcherModel({ locale: "en", venues, intentKey: "onchainPerp", selected: ["binance", "okx"] });
  assert.equal(model.activeIntentKey, "onchainPerp");
  assert.equal(model.activeIntent.category, "Perp DEX");
  assert.deepEqual(model.shortlist.map((venue) => venue.slug), ["hyperliquid", "dydx"]);
});

test("component has no prop-identity effect that resets chosen intent", () => {
  assert.doesNotMatch(platformMatcher, /useEffect/);
  assert.doesNotMatch(platformMatcher, /setIntentKey\(intentFromSelection\(venues, selected\)\)/);
  assert.match(platformMatcher, /useState\(\(\) => intentFromSelection\(venues, selected\)\)/);
});

test("links keep locale in app route query strings and fail closed without two venues", () => {
  assert.equal(detailHref("ar", "gate-io"), "/ar/exchanges/gate-io");
  assert.equal(compareHref("pt-BR", ["binance", "okx"]), "/pt-br/compare/binance-vs-okx");
  assert.equal(compareHref("en", ["binance"]), "");
  const sparse = platformMatcherModel({ locale: "en", venues: venues.slice(0, 1), intentKey: "accountCex" });
  assert.equal(sparse.canCompare, false);
  assert.equal(sparse.comparisonHref, "");
});

test("matcher can add regional decision context without leaking commercial invite material", () => {
  const model = platformMatcherModel({
    locale: "es",
    venues,
    intentKey: "accountCex",
    decisionPassport: { market: "MX", product: "spot", accountStage: "new_account", funding: "SPEI" },
  });

  assert.equal(model.regional.market, "MX");
  assert.equal(model.regional.product, "spot");
  assert.ok(model.regional.fundingOptions.includes("SPEI"));
  assert.ok(model.regional.candidates.length >= 1);
  assert.deepEqual(model.comparisonSlugs, model.regional.candidates.slice(0, 2).map((candidate) => candidate.slug));
  assert.equal(model.canCompare, false);
  assert.equal(model.comparisonHref, "");
  assert.equal(model.regional.compareHref, "");
  assert.match(model.regional.verifyHref, /market=MX/);
  assert.match(model.regional.verifyHref, /account_stage=new_account/);
  assert.match(model.regional.verifyHref, /funding=SPEI/);
  assert.match(model.regional.verifyHref, /usage_scale=regular_size/);
  assert.doesNotMatch(JSON.stringify(model.regional), /nexu888|11350287|LUCKX|CANDY007|INS898|luckybitcoin|partner\.bitget|accounts\.binance|bsmkweb/i);
});

test("regional context with no reviewed venue does not fall back to a generic global pair", () => {
  for (const market of ["JP", "KR"]) {
    const model = platformMatcherModel({
      locale: market === "JP" ? "ja" : "ko",
      venues,
      intentKey: "accountCex",
      decisionPassport: { market, product: "spot", accountStage: "new_account" },
    });
    assert.equal(model.regional.market, market);
    assert.deepEqual(model.regional.candidates, []);
    assert.deepEqual(model.comparisonSlugs, []);
    assert.equal(model.canCompare, false);
    assert.doesNotMatch(model.comparisonHref, /binance-vs-coinbase/);
    assert.equal(model.comparisonHref, "");
    assert.equal(model.regional.compareHref, "");
    assert.match(model.regional.verifyHref, /^\/(?:ja\/|ko\/)?exchanges#nxa-context\?/);
  }
});

test("matcher decision passport uses conservative tier defaults and sanitizes invalid values", () => {
  assert.deepEqual(normalizeMatcherDecisionPassport({
    market: "BR",
    kycPreference: "drop-table",
    usageFrequency: "hourly",
    usageScale: "100000-usd",
  }), {
    market: "BR",
    kycPreference: matcherDecisionDefaults.kycPreference,
    usageFrequency: matcherDecisionDefaults.usageFrequency,
    usageScale: matcherDecisionDefaults.usageScale,
  });
});

test("regional candidates are reviewed, sorted, scored and gated before compare", () => {
  const model = platformMatcherModel({
    locale: "en",
    venues,
    intentKey: "accountCex",
    decisionPassport: { market: "BR", product: "spot", accountStage: "new_account", kycPreference: "avoid_kyc", usageFrequency: "daily", usageScale: "larger_size" },
  });

  assert.deepEqual(model.regional.candidates.map((candidate) => candidate.slug), ["binance", "okx"]);
  assert.deepEqual(model.comparisonSlugs, ["binance", "okx"]);
  assert.equal(model.canCompare, true);
  assert.match(model.comparisonHref, /\/compare\/binance-vs-okx#nxa-context\?/);
  assert.match(model.comparisonHref, /market=BR/);
  assert.match(model.comparisonHref, /kyc=avoid_kyc/);
  assert.match(model.comparisonHref, /usage_frequency=daily/);
  assert.match(model.comparisonHref, /usage_scale=larger_size/);
  assert.ok(model.regional.candidates.every((candidate) => Number.isInteger(candidate.score)));
  assert.ok(model.regional.candidates.every((candidate) => candidate.reasons.some((reason) => /KYC|No-KYC/.test(reason))));
  assert.ok(model.regional.candidates.every((candidate) => candidate.nextSteps.map((step) => step.kind).join(",") === "profile,compare,verify"));
});

test("paused source context is excluded from matcher candidates", () => {
  const model = platformMatcherModel({
    locale: "en",
    venues,
    intentKey: "accountCex",
    decisionPassport: { market: "TR", product: "spot", accountStage: "new_account" },
  });

  assert.deepEqual(model.regional.candidates, []);
  assert.equal(model.canCompare, false);
  assert.equal(model.comparisonHref, "");
  assert.doesNotMatch(JSON.stringify(model), /matcher_regional_bitget|TR-bitget-stop-review/i);
});

test("component exposes regional controls and onsite research placement", () => {
  assert.match(platformMatcher, /regionalShortlistMarketOptions/);
  assert.match(platformMatcher, /regionalShortlistProductOptions\(locale\)/);
  assert.match(platformMatcher, /regionalShortlistAccountStageOptions\(locale\)/);
  assert.match(platformMatcher, /defaultOpen = false/);
  assert.match(platformMatcher, /const \[isOpen, setIsOpen\] = useState\(defaultOpen\)/);
  assert.match(platformMatcher, /<details className="platform-matcher__details" open=\{isOpen\} onToggle=\{\(event\) => setIsOpen\(event\.currentTarget\.open\)\}>/);
  assert.match(platformMatcher, /className="platform-matcher__summary"/);
  assert.match(platformMatcher, /className="platform-matcher__body"/);
  assert.match(platformMatcher, /data-regional-matcher-market/);
  assert.match(platformMatcher, /data-cta-placement="platform-matcher-regional"/);
  assert.match(platformMatcher, /model\.comparisonSlugs/);
  assert.match(platformMatcher, /!model\.regional/);
  assert.match(platformMatcher, /data-next-step-kind=\{step\.kind\}/);
  assert.match(platformMatcher, /matcherDecisionDefaults\.kycPreference/);
});

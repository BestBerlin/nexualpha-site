import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  matcherDecisionChoiceGroups,
  matcherDecisionCopy,
  platformMatcherModel,
} from "../src/components/v3/matcher-model.js";

const platformMatcher = await readFile(new URL("../src/components/v3/PlatformMatcher.jsx", import.meta.url), "utf8");
const matcherCss = await readFile(new URL("../src/components/v3/matcher.css", import.meta.url), "utf8");

const venues = [
  { slug: "binance", name: "Binance", category: "CEX", officialDomain: "www.binance.com" },
  { slug: "okx", name: "OKX", category: "CEX", officialDomain: "www.okx.com" },
  { slug: "uniswap", name: "Uniswap", category: "DEX", officialDomain: "app.uniswap.org" },
  { slug: "jupiter", name: "Jupiter", category: "DEX", officialDomain: "jup.ag" },
];

test("matcher upgrade copy covers the primary locales with short English fallback", () => {
  for (const locale of ["en", "zh-Hans", "zh-Hant"]) {
    const copy = matcherDecisionCopy(locale);
    assert.equal(typeof copy.filters.kycPreference, "string");
    assert.equal(typeof copy.candidateLabels.verify, "string");
    assert.equal(typeof copy.failClosed, "string");
  }

  assert.equal(matcherDecisionCopy("de"), matcherDecisionCopy("en"));
  assert.deepEqual(matcherDecisionChoiceGroups("zh-Hans").map((group) => group.key), ["kycPreference", "usageFrequency", "usageScale"]);
});

test("matcher uses tier labels rather than concrete amount inputs", () => {
  const groups = matcherDecisionChoiceGroups("en");
  assert.deepEqual(groups.find((group) => group.key === "usageScale").options.map((option) => option.value), [
    "small_size",
    "regular_size",
    "larger_size",
  ]);
  assert.doesNotMatch(JSON.stringify(groups), /\$|usd|usdt|amount|deposit|volume/i);
});

test("CTA gate keeps matcher on onsite profile compare and verification steps", () => {
  const model = platformMatcherModel({
    locale: "en",
    venues,
    intentKey: "accountCex",
    decisionPassport: { market: "BR", product: "spot", accountStage: "new_account" },
  });

  assert.equal(model.canCompare, true);
  assert.equal(model.regional.candidates.length, 2);
  assert.ok(model.regional.candidates.every((candidate) => candidate.nextSteps.length === 3));
  assert.ok(model.regional.candidates.every((candidate) => candidate.nextSteps.every((step) => /^\/(?:exchanges|compare)/.test(step.href))));
  assert.doesNotMatch(JSON.stringify(model.regional.candidates), /https?:|\/ref\/|invite|referral|partner\.|accounts\./i);

  assert.match(platformMatcher, /data-next-step-kind=\{step\.kind\}/);
  assert.doesNotMatch(platformMatcher, /candidate\.directHref|accounts\.binance|partner\.bitget|inviteCode|referral/i);
});

test("360px matcher layout contract keeps candidate controls single-column", () => {
  assert.match(matcherCss, /@media \(max-width: 360px\)/);
  assert.match(matcherCss, /@media \(max-width: 360px\)[\s\S]*\.platform-matcher__candidate-head,[\s\S]*\.platform-matcher__next-steps \{[\s\S]*display: grid;[\s\S]*grid-template-columns: 1fr;/);
  assert.match(matcherCss, /@media \(max-width: 360px\)[\s\S]*\.platform-matcher__next-steps a \{[\s\S]*inline-size: 100%;/);
  assert.match(matcherCss, /\.platform-matcher__candidate-reasons/);
});

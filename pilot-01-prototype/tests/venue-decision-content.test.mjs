import test from "node:test";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { exchangeResearch } from "../src/data/exchange-research.js";
import { decisionCopy, decisionForVenue, hasReviewedEditorialDecision, venueDecisionContent } from "../src/data/venue-decision-content.js";

const recheckEvidence = JSON.parse(await readFile(new URL("../../docs/review-inputs/unpublished-campaign-research/recheck-5231-evidence-20260907.json", import.meta.url), "utf8"));
const mexcEvidence = recheckEvidence.evidence.find((entry) => entry.sourceId === "mexc-pair-september");

test("all 21 research profiles have three distinct source-traceable decision notes", () => {
  assert.equal(Object.keys(venueDecisionContent).length, 21);
  assert.deepEqual(Object.keys(venueDecisionContent).sort(), Object.keys(exchangeResearch).sort());
  for (const slug of Object.keys(exchangeResearch)) {
    for (const locale of ["en", "zh-Hans", "zh-Hant"]) {
      const result = decisionForVenue(slug, locale);
      assert.equal(result.contentLocale, locale);
      assert.equal(new Set([result.fit, result.why, result.avoid]).size, 3);
      for (const value of [result.fit, result.why, result.avoid]) assert.ok(value.length >= 24, `${slug}/${locale}`);
      assert.equal(result.basisCheckedAt, exchangeResearch[slug].checkedAt, "editorial writing must not reset source verification dates");
      assert.ok(result.basisFactIds.length >= 2);
      for (const id of result.basisFactIds) assert.ok(exchangeResearch[slug].facts.some(fact => fact.id === id) || (slug === "mexc" && id === mexcEvidence.sourceId));
      for (const url of result.sourceUrls) assert.ok(exchangeResearch[slug].facts.some(fact => fact.sourceUrl === url) || (slug === "mexc" && url === mexcEvidence.url));
    }
  }
});

test("15 UI languages explicitly retain English content provenance for untranslated notes", () => {
  assert.equal(Object.keys(decisionCopy).length, 15);
  for (const [locale, labels] of Object.entries(decisionCopy)) {
    assert.equal(labels.length, 4);
    assert.ok(labels.every(label => typeof label === "string" && label.length > 0));
    const result = decisionForVenue("gmx", locale);
    assert.equal(result.contentLocale, ["en", "zh-Hans", "zh-Hant"].includes(locale) ? locale : "en");
  }
  assert.equal(decisionForVenue("missing", "en"), null);
});


test("five core platforms have reviewed editorial decisions in all 15 UI locales", () => {
  const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"];
  const slugs = ["binance", "okx", "bybit", "bitget", "backpack"];
  for (const slug of slugs) {
    assert.equal(hasReviewedEditorialDecision(slug), true, `${slug} should have an independent editorial decision review gate`);
    for (const locale of locales) {
      const result = decisionForVenue(slug, locale);
      assert.equal(result.contentLocale, locale, `${slug}/${locale} must not fall back to English`);
      assert.equal(result.editorialReviewed, true);
      assert.equal(new Set([result.fit, result.why, result.avoid]).size, 3);
      assert.ok(result.sourceUrls.length >= 2);
      for (const url of result.sourceUrls) assert.match(url, /^https:\/\//);
      assert.doesNotMatch([result.fit, result.why, result.avoid].join(" "), /strongest|best choice|industry-leading|zero-knowledge|self-custodial exchange|points yield|最强|第一|零知识|自托管交易所|积分收益|空投机会/i);
    }
  }
  for (const slug of ["coinbase", "kraken", "gate-io", "gmx"]) {
    assert.equal(hasReviewedEditorialDecision(slug), false, `${slug} should remain closed until separately reviewed`);
  }
});

test("DEX and perpetual decisions preserve mechanism differences and evidence limits", () => {
  assert.match(decisionForVenue("jupiter").fit, /Swap or Ultra quotes, token mints/);
  assert.match(decisionForVenue("uniswap").avoid, /order book/);
  assert.match(decisionForVenue("gmx").why, /GM\/GLV/);
  assert.match(decisionForVenue("dydx").avoid, /funding/);
  assert.match(decisionForVenue("backpack").avoid, /broad CEX replacement/);
  assert.match(decisionForVenue("drift").avoid, /redirected documentation path alone does not establish a product migration/);
  for (const slug of ["uniswap", "pancakeswap", "jupiter", "raydium", "aerodrome", "curve", "hyperliquid", "dydx", "gmx", "drift"]) {
    const result = decisionForVenue(slug);
    assert.doesNotMatch([result.fit, result.why, result.avoid].join(" "), /registration bonus|guaranteed|cashback/i);
  }
});

test("mounted comparison uses the shared decision fields and explicit language provenance", async () => {
  const source = await readFile(new URL("../src/components/v3/V3Pages.jsx", import.meta.url), "utf8");
  const verdict = source.slice(source.indexOf("function CompareVerdictPanel("), source.indexOf("function ConversionIntentPanel("));
  for (const field of ["fit", "why", "avoid"]) assert.match(verdict, new RegExp(`safeDecision\\?\\.${field}`));
  assert.match(verdict, /decisionUi\[1\]/);
  assert.match(verdict, /lang=\{safeDecision\?\.contentLocale \?\? locale\}/);
  const comparison = source.slice(source.indexOf("export function CompareDeepPage("), source.indexOf("export function ActivityCenterPage("));
  for (const field of ["fit", "why", "avoid"]) assert.ok(comparison.includes(`field="${field}"`));
  assert.match(comparison, /<CompareVerdictPanel/);
});

test("research gaps stay unresolved and cannot become negative venue capabilities", () => {
  for (const slug of ["gate-io", "kucoin", "deribit", "drift"]) {
    const result = decisionForVenue(slug);
    assert.equal(result.suitabilityUnresolved, true);
    assert.doesNotMatch(result.avoid, /poor fit|poor shortlist|keep it off|not suitable/i);
  }
  assert.equal(decisionForVenue("aerodrome").suitabilityUnresolved, false);
  assert.equal(decisionForVenue("gmx").suitabilityUnresolved, false);
  assert.match(decisionForVenue("drift").why, /insufficient/);
  assert.match(decisionForVenue("coinbase").avoid, /U\.S\. derivatives/);
  const coinbase = decisionForVenue("coinbase");
  assert.ok(coinbase.basisFactIds.includes(exchangeResearch.coinbase.facts[1].id), "the identity condition must retain its specific source basis");
});

test("MEXC restriction stays bounded to the read PAIR Innovation Zone notice and preserves source time", () => {
  const result = decisionForVenue("mexc");
  assert.match(result.avoid, /PAIRUSDT futures API/);
  assert.match(result.avoid, /does not establish the status of every MEXC market/);
  assert.match(mexcEvidence.evidenceQuote, /API Trading is currently unavailable for Innovation Zone pairs/);
  assert.equal(result.supplementalSources.length, 1);
  assert.deepEqual(result.supplementalSources[0], { id: mexcEvidence.sourceId, sourceUrl: mexcEvidence.url, checkedAt: mexcEvidence.checkedAt });
  assert.equal(result.basisCheckedAt, exchangeResearch.mexc.checkedAt);
  assert.notEqual(result.supplementalSources[0].checkedAt, result.basisCheckedAt);
});

test("Hyperliquid and Uniswap decisions cite the new pre-trade checklist facts", () => {
  const hyperliquid = decisionForVenue("hyperliquid");
  const uniswap = decisionForVenue("uniswap");

  for (const id of [
    "hyperliquid-fee-tier-clock",
    "hyperliquid-funding-payment",
    "hyperliquid-usdc-funding-route",
    "hyperliquid-wallet-transfer-boundary",
    "hyperliquid-liquidation-threshold",
    "hyperliquid-testnet-faucet-gate",
    "hyperliquid-sub-account-threshold",
    "hyperliquid-api-wallet-signing",
    "hyperliquid-account-mode-collateral",
  ]) {
    assert.ok(hyperliquid.basisFactIds.includes(id), `Hyperliquid decision should cite ${id}`);
  }

  for (const id of [
    "uniswap-swap-fee-tiers",
    "uniswap-dynamic-fee-boundary",
    "uniswap-wallet-route-test",
    "uniswap-hook-test-environment",
    "uniswap-wallet-authorization-boundary",
    "uniswap-deployment-address-check",
    "uniswap-deployment-feed",
  ]) {
    assert.ok(uniswap.basisFactIds.includes(id), `Uniswap decision should cite ${id}`);
  }

  assert.match(hyperliquid.fit, /Hyperliquid fees, funding payments, USDC funding, sub-account gates, API-wallet signing and liquidation margin/);
  assert.match(hyperliquid.why, /answer fee searches with a checklist/);
  assert.match(hyperliquid.avoid, /wallet transfer/);
  assert.match(hyperliquid.avoid, /funded-account guarantee/);
  assert.match(uniswap.fit, /official app, pool fee, hook behavior, token contract, network and wallet path/);
  assert.match(uniswap.why, /dynamic fee design, hook test environments/);
  assert.match(uniswap.avoid, /wallet approval/);
  assert.match(uniswap.avoid, /centralized order book depth/);
  assert.match(uniswap.avoid, /deployments feed/);
  assert.doesNotMatch([hyperliquid.fit, hyperliquid.why, hyperliquid.avoid, uniswap.fit, uniswap.why, uniswap.avoid].join(" "), /private commission|guaranteed discount|invite code|referral link/i);
});

test("Jupiter and Aerodrome decisions cite route, fee, token and network checklist facts", () => {
  const jupiter = decisionForVenue("jupiter");
  const aerodrome = decisionForVenue("aerodrome");

  for (const id of [
    "jupiter-swap-api",
    "jupiter-routing-role",
    "jupiter-ultra-execution-mode",
    "jupiter-platform-fee-boundary",
    "jupiter-token-list-boundary",
    "jupiter-transaction-build-path",
  ]) {
    assert.ok(jupiter.basisFactIds.includes(id), `Jupiter decision should cite ${id}`);
  }

  for (const id of [
    "aerodrome-base-liquidity-hub",
    "aerodrome-pool-fee-boundary",
    "aerodrome-voting-incentive-flow",
    "aerodrome-veaero-reward-route",
    "aerodrome-base-network-boundary",
    "aerodrome-launch-liquidity",
  ]) {
    assert.ok(aerodrome.basisFactIds.includes(id), `Aerodrome decision should cite ${id}`);
  }

  assert.match(jupiter.fit, /Swap or Ultra quotes, token mints, route legs, slippage, price impact and wallet-built transactions/);
  assert.match(jupiter.why, /route checklist instead of a custodial signup page/);
  assert.match(jupiter.avoid, /quote as proof that every token is safe/);
  assert.match(aerodrome.fit, /Base network, bridge path, token contract, pool address, pool fee type/);
  assert.match(aerodrome.why, /pool-level fees, voting incentives, veAERO reward claims/);
  assert.match(aerodrome.avoid, /multi-chain availability, reward entitlement, or uniform fees/);
  assert.doesNotMatch([jupiter.fit, jupiter.why, jupiter.avoid, aerodrome.fit, aerodrome.why, aerodrome.avoid].join(" "), /private commission|guaranteed discount|invite code|referral link/i);
});

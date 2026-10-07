import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { exchangeResearch, researchForVenue } from "../src/data/exchange-research.js";

const v3ProductSource = await readFile(new URL("../src/data/v3-product.js", import.meta.url), "utf8");
const v3VenueSlugsBlock = v3ProductSource.match(/export const v3VenueSlugs = \[([\s\S]*?)\];/);
assert.ok(v3VenueSlugsBlock, "v3VenueSlugs block");
const v3VenueSlugs = [...v3VenueSlugsBlock[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);

const prioritySlugs = ["binance", "okx", "bybit", "coinbase", "bitget", "backpack"];
const supportedContentLocales = ["en", "zh-Hans", "zh-Hant"];
const factAxes = new Set(["products", "fees", "custody", "access", "execution"]);
const intentionalNullAxisLabels = new Set(["Announcement taxonomy", "Navigation taxonomy", "Official update lane", "Documentation redirect"]);
const placeholderPattern = /\b(?:todo|tbd|placeholder|lorem|fake|example\.com|verify before|check official|coming soon)\b/i;
const announcementUrlPattern = /(?:\/announcement|announcements\.|\/support\/announcement)/i;

test("exchange research covers every V3 venue slug with no extras", () => {
  assert.deepEqual(Object.keys(exchangeResearch).sort(), [...v3VenueSlugs].sort());
});

test("exchange research has source-backed multilingual facts", () => {
  for (const slug of v3VenueSlugs) {
    const record = exchangeResearch[slug];
    assert.ok(record, `${slug} research record`);
    assert.match(record.checkedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, `${slug}.checkedAt`);
    assert.ok(record.tags.length >= 2, `${slug}.tags`);

    for (const locale of supportedContentLocales) {
      assert.ok(record.summary[locale]?.length > 20, `${slug}.summary.${locale}`);
      assert.doesNotMatch(record.summary[locale], placeholderPattern, `${slug}.summary.${locale} placeholder`);
    }

    assert.ok(record.facts.length >= (prioritySlugs.includes(slug) ? 4 : 2), `${slug}.facts count`);
    assert.equal(new Set(record.facts.map((item) => item.id)).size, record.facts.length, `${slug}.fact ids unique`);
    assert.ok(record.sources.length >= 1, `${slug}.sources count`);
    const sourceUrls = new Set(record.sources.map((source) => source.url));

    for (const item of record.facts) {
      assert.match(item.id, new RegExp(`^${slug}-[a-z0-9-]+$`), `${slug}.fact.id`);
      assert.ok(item.axis === null || factAxes.has(item.axis), `${slug}.fact.axis`);
      assert.match(item.sourceUrl, /^https:\/\//, `${slug}.fact.sourceUrl`);
      assert.ok(sourceUrls.has(item.sourceUrl), `${slug}.fact source listed`);
      if (item.axis === "products") {
        assert.doesNotMatch(item.sourceUrl, announcementUrlPattern, `${slug}.product fact must not cite announcement/navigation filler`);
      }
      for (const locale of supportedContentLocales) {
        assert.ok(item.label[locale]?.length >= 2, `${slug}.fact.label.${locale}`);
        assert.ok(item.value[locale]?.length > 20, `${slug}.fact.value.${locale}`);
        assert.doesNotMatch(item.value[locale], placeholderPattern, `${slug}.fact.value.${locale} placeholder`);
      }
    }

    for (const item of record.sources) {
      assert.ok(item.title.length > 4, `${slug}.source.title`);
      assert.match(item.url, /^https:\/\//, `${slug}.source.url`);
    }
  }
});

test("researchForVenue flattens localized strings and reports fallback locale", () => {
  const zh = researchForVenue("binance", "zh-Hans");
  assert.equal(zh.contentLocale, "zh-Hans");
  assert.equal(typeof zh.summary, "string");
  assert.equal(typeof zh.facts[0].label, "string");
  assert.equal(typeof zh.facts[0].value, "string");
  assert.match(zh.facts[0].id, /^binance-[a-z0-9-]+$/);
  assert.ok(zh.facts[0].axis === null || factAxes.has(zh.facts[0].axis));

  const fallback = researchForVenue("binance", "es");
  assert.equal(fallback.contentLocale, "en");
  assert.equal(fallback.summary, exchangeResearch.binance.summary.en);
  assert.equal(researchForVenue("unknown", "en"), null);
});

test("source-backed comparison axes stay explicit while taxonomy context remains ungrouped", () => {
  const kucoinSpotOrder = exchangeResearch.kucoin.facts.find((item) => item.label.en === "Spot order model");
  assert.equal(kucoinSpotOrder?.axis, "execution", "KuCoin spot-order fact should compare under execution");

  const okxIdentity = exchangeResearch.okx.facts.find((item) => item.label.en === "Identity boundary");
  assert.equal(okxIdentity?.axis, "access", "OKX identity-boundary fact should compare under access");

  const intentionallyUngrouped = [];
  for (const [slug, record] of Object.entries(exchangeResearch)) {
    for (const item of record.facts) {
      if (item.axis === null) intentionallyUngrouped.push(`${slug}:${item.label.en}`);
    }
  }

  assert.deepEqual(
    intentionallyUngrouped.sort(),
    [
      "binance:Official update lane",
      "bitget:Official update lane",
      "bybit:Official update lane",
      "drift:Documentation redirect",
      "kucoin:Announcement taxonomy",
      "okx:Announcement taxonomy",
    ].sort(),
  );
});

test("official source URLs are concrete and unique per venue source list", () => {
  for (const [slug, record] of Object.entries(exchangeResearch)) {
    const urls = record.sources.map((source) => source.url);
    assert.equal(new Set(urls).size, urls.length, `${slug}.sources unique`);
    for (const url of urls) {
      const parsed = new URL(url);
      assert.ok(parsed.hostname.includes(".") || parsed.hostname === "jup.ag", `${slug}.source host`);
      assert.doesNotMatch(url, /(?:referral|affiliate|invite|utm_|[?&](?:ref|aff)=)/i, `${slug}.source no commercial tracking`);
    }
  }
});

test("only intentional taxonomy labels may remain outside comparison axes", () => {
  for (const [slug, record] of Object.entries(exchangeResearch)) {
    for (const item of record.facts) {
      assert.ok(
        item.axis !== null || intentionalNullAxisLabels.has(item.label.en),
        `${slug}.${item.label.en} must declare a comparison axis or be an intentional ungrouped taxonomy label`,
      );
    }
  }
});

test("Hyperliquid and Uniswap expose source-limited pre-trade checklists", () => {
  const hyperliquid = exchangeResearch.hyperliquid;
  const uniswap = exchangeResearch.uniswap;

  assert.deepEqual(
    hyperliquid.facts.map((fact) => fact.label.en).filter((label) => [
      "Fee tier clock",
      "Funding and liquidation bundle",
      "Funding payment",
      "USDC funding route",
      "Wallet transfer boundary",
      "Liquidation threshold",
      "Testnet faucet gate",
      "Funded-account ambiguity",
      "Sub-account threshold",
      "API wallet signing",
      "Account mode collateral",
    ].includes(label)),
    ["Fee tier clock", "Funding payment", "Funding and liquidation bundle", "USDC funding route", "Wallet transfer boundary", "Liquidation threshold", "Testnet faucet gate", "Funded-account ambiguity", "Sub-account threshold", "API wallet signing", "Account mode collateral"],
  );
  assert.deepEqual(
    uniswap.facts.map((fact) => fact.label.en).filter((label) => [
      "Swap fee tiers",
      "Dynamic fee boundary",
      "Wallet route test",
      "Hook test environment",
      "Testnet to production handoff",
      "Wallet authorization boundary",
      "Approval spender check",
      "Deployment address check",
      "Deployment feed",
    ].includes(label)),
    ["Swap fee tiers", "Dynamic fee boundary", "Wallet route test", "Hook test environment", "Testnet to production handoff", "Wallet authorization boundary", "Approval spender check", "Deployment address check", "Deployment feed"],
  );

  assert.equal(hyperliquid.facts.find((fact) => fact.label.en === "Fee tier clock")?.axis, "fees");
  assert.equal(hyperliquid.facts.find((fact) => fact.label.en === "Weighted fee tier")?.axis, "fees");
  assert.equal(hyperliquid.facts.find((fact) => fact.label.en === "HIP-3 fee boundary")?.axis, "fees");
  assert.equal(hyperliquid.facts.find((fact) => fact.label.en === "Funding payment")?.axis, "fees");
  assert.equal(hyperliquid.facts.find((fact) => fact.label.en === "Funding and liquidation bundle")?.axis, "fees");
  assert.equal(hyperliquid.facts.find((fact) => fact.label.en === "USDC funding route")?.axis, "custody");
  assert.equal(hyperliquid.facts.find((fact) => fact.label.en === "Wallet transfer boundary")?.axis, "custody");
  assert.equal(hyperliquid.facts.find((fact) => fact.label.en === "Testnet faucet gate")?.axis, "access");
  assert.equal(hyperliquid.facts.find((fact) => fact.label.en === "Funded-account ambiguity")?.axis, "access");
  assert.equal(hyperliquid.facts.find((fact) => fact.label.en === "Sub-account threshold")?.axis, "access");
  assert.equal(hyperliquid.facts.find((fact) => fact.label.en === "API wallet signing")?.axis, "access");
  assert.equal(hyperliquid.facts.find((fact) => fact.label.en === "Account mode collateral")?.axis, "custody");
  assert.equal(hyperliquid.facts.find((fact) => fact.label.en === "Fee source map")?.axis, "fees");
  assert.equal(hyperliquid.facts.find((fact) => fact.label.en === "Fee decision checklist")?.axis, "fees");
  assert.equal(hyperliquid.facts.find((fact) => fact.label.en === "Funded-account source map")?.axis, "access");
  assert.equal(uniswap.facts.find((fact) => fact.label.en === "Swap fee tiers")?.axis, "fees");
  assert.equal(uniswap.facts.find((fact) => fact.label.en === "Protocol fee boundary")?.axis, "fees");
  assert.equal(uniswap.facts.find((fact) => fact.label.en === "Dynamic fee boundary")?.axis, "fees");
  assert.equal(uniswap.facts.find((fact) => fact.label.en === "Wallet route test")?.axis, "execution");
  assert.equal(uniswap.facts.find((fact) => fact.label.en === "Hook test environment")?.axis, "execution");
  assert.equal(uniswap.facts.find((fact) => fact.label.en === "Testnet to production handoff")?.axis, "execution");
  assert.equal(uniswap.facts.find((fact) => fact.label.en === "Wallet authorization boundary")?.axis, "access");
  assert.equal(uniswap.facts.find((fact) => fact.label.en === "Approval spender check")?.axis, "access");
  assert.equal(uniswap.facts.find((fact) => fact.label.en === "Deployment address check")?.axis, "custody");
  assert.equal(uniswap.facts.find((fact) => fact.label.en === "Deployment feed")?.axis, "custody");
  assert.equal(uniswap.facts.find((fact) => fact.label.en === "Uniswap source map")?.axis, "execution");
  assert.equal(uniswap.facts.find((fact) => fact.label.en === "Production route checklist")?.axis, "execution");
  assert.equal(
    uniswap.facts.find((fact) => fact.label.en === "Wallet authorization boundary")?.sourceUrl,
    "https://developers.uniswap.org/docs/protocols/permit2/overview",
  );
  assert.equal(
    uniswap.facts.find((fact) => fact.label.en === "Approval spender check")?.sourceUrl,
    "https://developers.uniswap.org/docs/protocols/permit2/overview",
  );
  assert.ok(uniswap.sources.some((source) => source.url === "https://developers.uniswap.org/docs/protocols/permit2/overview"));

  const copy = [hyperliquid, uniswap].flatMap((record) => record.facts.map((fact) => fact.value.en)).join("\n");
  assert.match(copy, /rolling 14 day volume/);
  assert.match(copy, /sub-account volume counts toward the master account fee tier/);
  assert.match(copy, /vault volume is treated separately/);
  assert.match(copy, /spot volume counting double/);
  assert.match(copy, /deployer-configured fee shares/);
  assert.match(copy, /maker\/taker tiers/);
  assert.match(copy, /funding is peer-to-peer/);
  assert.match(copy, /maker\/taker schedule, hourly funding, margin mode and liquidation threshold/);
  assert.match(copy, /user-signed Core USDC transfers/);
  assert.match(copy, /wallet movement cost and transfer signing/);
  assert.match(copy, /maintenance-margin failure paths/);
  assert.match(copy, /mainnet deposit with the same address/);
  assert.match(copy, /referral discounts do not apply to sub-accounts/);
  assert.match(copy, /account data queries must use the actual account address/);
  assert.match(copy, /vault participation/);
  assert.match(copy, /wallet collateral, sub-accounts, vault deposits/);
  assert.match(copy, /swap-fee mechanics/);
  assert.match(copy, /Protocol fees are active on all v2 pools and selected v3 pools/);
  assert.match(copy, /can coexist with v4 dynamic and hook fees/);
  assert.match(copy, /dynamic fees is fixed at pool creation/);
  assert.match(copy, /local development environment/);
  assert.match(copy, /token approvals/);
  assert.match(copy, /one-time token approval of the Permit2 contract/);
  assert.match(copy, /wallet approval or Permit2 path/);
  assert.match(copy, /approval spender or Permit2 route/);
  assert.match(copy, /target chain, v4 deployment, pool version/);
  assert.match(copy, /deployments.json feed/);
  assert.match(copy, /network-specific deployment mapping/);
  assert.match(copy, /quickstart for the official app URL/);
  assert.match(copy, /wallet simulation and final signed transaction/);
  assert.doesNotMatch(copy, /testnet token address|guaranteed discount|signup reward|private commission|funded account guarantee/i);
});

test("Jupiter and Aerodrome expose source-limited route and incentive checklists", () => {
  const jupiter = exchangeResearch.jupiter;
  const aerodrome = exchangeResearch.aerodrome;

  assert.deepEqual(
    jupiter.facts.map((fact) => fact.label.en).filter((label) => [
      "Swap API",
      "Routing role",
      "Ultra execution mode",
      "Platform fee boundary",
      "Token-list boundary",
      "Transaction build path",
    ].includes(label)),
    ["Swap API", "Routing role", "Ultra execution mode", "Platform fee boundary", "Token-list boundary", "Transaction build path"],
  );
  assert.deepEqual(
    aerodrome.facts.map((fact) => fact.label.en).filter((label) => [
      "Base liquidity hub",
      "Pool fee boundary",
      "Voting incentive flow",
      "veAERO reward route",
      "Base network boundary",
      "Launch liquidity",
    ].includes(label)),
    ["Base liquidity hub", "Pool fee boundary", "Voting incentive flow", "veAERO reward route", "Base network boundary", "Launch liquidity"],
  );

  assert.equal(jupiter.facts.find((fact) => fact.label.en === "Swap API")?.axis, "execution");
  assert.equal(jupiter.facts.find((fact) => fact.label.en === "Ultra execution mode")?.axis, "execution");
  assert.equal(jupiter.facts.find((fact) => fact.label.en === "Platform fee boundary")?.axis, "fees");
  assert.equal(jupiter.facts.find((fact) => fact.label.en === "Token-list boundary")?.axis, "access");
  assert.equal(jupiter.facts.find((fact) => fact.label.en === "Transaction build path")?.axis, "execution");
  assert.equal(aerodrome.facts.find((fact) => fact.label.en === "Pool fee boundary")?.axis, "fees");
  assert.equal(aerodrome.facts.find((fact) => fact.label.en === "Voting incentive flow")?.axis, "fees");
  assert.equal(aerodrome.facts.find((fact) => fact.label.en === "veAERO reward route")?.axis, "fees");
  assert.equal(aerodrome.facts.find((fact) => fact.label.en === "Base network boundary")?.axis, "custody");

  const copy = [jupiter, aerodrome].flatMap((record) => record.facts.map((fact) => fact.value.en)).join("\n");
  assert.match(copy, /route selection rather than exchange custody/);
  assert.match(copy, /fee configuration in the official API docs/);
  assert.match(copy, /verify mints and list status/);
  assert.match(copy, /wallet network, token contract, and pool address/);
  assert.match(copy, /paid to veAERO holders who vote for the pool/);
  assert.match(copy, /swap route alone does not create a reward entitlement/);
  assert.doesNotMatch(copy, /guaranteed discount|signup reward|private commission|reward guarantee|referral link/i);
});

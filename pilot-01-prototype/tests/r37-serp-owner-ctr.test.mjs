import { committedFileHash } from './r100-test-contracts.mjs';
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  PRIORITY_QUERY_OWNER_REGISTRY,
  priorityCanonicalOwnerPath,
  priorityOwnerForPath,
  priorityOwnerForQuery,
} from "../src/data/priority-query-owner-registry.js";
import { priorityVenueAnswerFor } from "../src/data/priority-venue-answers.js";
import { compareDirectAnswerFor } from "../src/data/compare-direct-answers.js";
import { tokenizedAssetPage } from "../src/data/tokenized-assets-cluster.js";

const protectedFiles = {
  "src/data/partner-registry.js": committedFileHash('src/data/partner-registry.js'),
  "src/data/venue-database.js": committedFileHash('src/data/venue-database.js'),
  "src/data/public-cta.js": committedFileHash('src/data/public-cta.js'),
  "src/data/regional-cta.js": committedFileHash('src/data/regional-cta.js'),
};

test("R37 maps observed zero-click SERP queries to one canonical owner each", () => {
  const cases = [
    ["hyperliquid fees", "/exchanges/hyperliquid"],
    ["hyperliquid funded account", "/exchanges/hyperliquid"],
    ["hyperliquid cashback", "/exchanges/hyperliquid"],
    ["uniswap testnet", "/exchanges/uniswap"],
    ["bitget 与 bybit uta对比", "/compare/bybit-vs-bitget"],
    ["bybit bitget uta", "/compare/bybit-vs-bitget"],
    ["what are tokenized treasuries", "/topics/tokenized-treasuries"],
  ];

  for (const [query, expectedPath] of cases) {
    assert.equal(priorityOwnerForQuery(query)?.canonicalOwnerPath, expectedPath, query);
    assert.equal(priorityCanonicalOwnerPath(query), expectedPath, query);
  }
});

test("R37 owner registry keeps support pages from competing with canonical owners", () => {
  const expectations = [
    ["hyperliquid-decision", "/exchanges/hyperliquid", "/compare/hyperliquid-vs-dydx"],
    ["uniswap-testnet-mainnet", "/exchanges/uniswap", "/compare/uniswap-vs-jupiter"],
    ["bybit-vs-bitget-decision", "/compare/bybit-vs-bitget", "/topics/tokenized-stocks-vs-perpetuals"],
    ["tokenized-treasuries", "/topics/tokenized-treasuries", "/news/tokenized-treasuries-structure-access-risks"],
  ];

  for (const [id, ownerPath, supportPath] of expectations) {
    const owner = PRIORITY_QUERY_OWNER_REGISTRY[id];
    assert.equal(owner.canonicalOwnerPath, ownerPath, id);
    assert.equal(owner.supportPath, supportPath, id);
    assert.equal(priorityOwnerForPath(ownerPath)?.canonicalOwnerPath, ownerPath, id);
    assert.equal(priorityOwnerForPath(supportPath)?.canonicalOwnerPath, ownerPath, id);
    assert.ok(owner.ownerBoundary.includes("should"), `${id}: boundary should explain ownership`);
  }
});

test("R37 owner pages expose extractable answers for the observed query language", () => {
  const hyperliquid = JSON.stringify(priorityVenueAnswerFor("hyperliquid", "en"));
  assert.match(hyperliquid, /rolling 14-day (?:weighted )?volume/i);
  assert.match(hyperliquid, /funded-account/i);
  assert.match(hyperliquid, /cashback|referral discount/i);
  assert.match(hyperliquid, /vaults or sub-accounts/i);

  const uniswap = JSON.stringify(priorityVenueAnswerFor("uniswap", "en"));
  assert.match(uniswap, /Uniswap testnet/i);
  assert.match(uniswap, /mainnet liquidity/i);
  assert.match(uniswap, /Permit2/i);
  assert.match(uniswap, /disconnecting a wallet revoke/i);

  const bybitBitget = JSON.stringify(compareDirectAnswerFor("bybit-vs-bitget", "zh-Hans"));
  assert.match(bybitBitget, /UTA|统一交易账户/);
  assert.match(bybitBitget, /支持抵押品/);
  assert.match(bybitBitget, /清算规则/);

  const tokenizedTreasuries = JSON.stringify(tokenizedAssetPage("tokenized-treasuries"));
  assert.match(tokenizedTreasuries, /issuer/i);
  assert.match(tokenizedTreasuries, /recordkeeper/i);
  assert.match(tokenizedTreasuries, /redemption/i);
});

test("R37 does not change protected invitation and CTA registries", async () => {
  for (const [relativePath, expectedSha] of Object.entries(protectedFiles)) {
    const source = await readFile(new URL(`../${relativePath}`, import.meta.url));
    assert.equal(createHash("sha256").update(source).digest("hex"), expectedSha, relativePath);
  }
});

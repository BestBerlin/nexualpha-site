import assert from "node:assert/strict";
import test from "node:test";

import { exchangeResearch, researchForVenue } from "../src/data/exchange-research.js";

const uniswap = exchangeResearch.uniswap;
const factByLabel = (label) => uniswap.facts.find((item) => item.label.en === label);
const englishFactCopy = uniswap.facts.map((item) => item.value.en).join("\n");
const sourceUrls = new Set(uniswap.sources.map((item) => item.url));

test("Wave58 Uniswap facts use a dated official-source scope", () => {
  assert.equal(uniswap.checkedAt, "2026-09-16T00:00:00Z");
  assert.equal(researchForVenue("uniswap", "zh-Hans")?.checkedAt, uniswap.checkedAt);

  for (const url of [
    "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains",
    "https://developers.uniswap.org/docs/protocols/v4/deployments",
    "https://developers.uniswap.org/docs/protocols/universal-router/overview",
    "https://developers.uniswap.org/docs/protocols/permit2/overview",
    "https://support.uniswap.org/hc/en-us/articles/26757826138637-What-is-a-token-contract-address",
    "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens",
    "https://support.uniswap.org/hc/en-us/articles/40050562560781-Crypto-Wallet-Signature-Scams",
    "https://support.uniswap.org/hc/en-us/articles/17523327223437-Checking-your-wallet-s-approvals",
    "https://support.uniswap.org/hc/en-us/articles/15724901841037-How-to-revoke-a-token-approval",
    "https://app.uniswap.org/",
  ]) {
    assert.ok(sourceUrls.has(url), `missing official Uniswap source: ${url}`);
  }
});

test("Wave58 separates supported API testnets from web-interface testnets", () => {
  const chains = factByLabel("Supported chain scope");
  const testnets = factByLabel("Testnet interface scope");
  const app = factByLabel("Official app route");

  assert.equal(chains?.axis, "products");
  assert.equal(testnets?.axis, "access");
  assert.equal(app?.axis, "access");
  assert.match(testnets.value.en, /Ethereum Sepolia, Unichain Sepolia and Base Sepolia for API access/);
  assert.match(testnets.value.en, /only Ethereum Sepolia and Unichain Sepolia.*web interface/);
  assert.match(testnets.value.en, /does not establish mainnet liquidity, execution or asset safety/);
  assert.match(app.value.en, /https:\/\/app\.uniswap\.org\//);
  assert.match(app.value.en, /not a safety guarantee/);
});

test("Wave58 keeps v4 deployments and wallet address roles network-specific", () => {
  const roles = factByLabel("Router and approval roles");
  const token = factByLabel("Token contract identity");
  const deployment = factByLabel("Deployment address check");
  const feed = factByLabel("Deployment feed");

  assert.equal(roles?.axis, "custody");
  assert.equal(token?.axis, "custody");
  assert.equal(deployment?.axis, "custody");
  assert.equal(feed?.axis, "custody");
  assert.match(roles.value.en, /input token contract, Universal Router, Permit2 contract and spender are separate roles/i);
  assert.match(token.value.en, /not the Universal Router, Permit2 contract or the spender/i);
  assert.match(deployment.value.en, /not to assume the same contract addresses across chains/);
  assert.match(feed.value.en, /deployments\.json feed/);
  assert.match(feed.value.en, /by network/);
});

test("Wave58 records Permit2 identity and signature fields without a safety promise", () => {
  const permit2 = factByLabel("Permit2 deployment identity");
  const fields = factByLabel("Signature permission fields");
  const offchain = factByLabel("Offchain signature boundary");

  assert.equal(permit2?.axis, "access");
  assert.match(permit2.value.en, /0x000000000022D473030F116dDEE9F6B43aC78BA3/);
  assert.match(permit2.value.en, /zkSync.*0x0000000000225e31D15943971F47aD3022F714Fa/);
  assert.match(permit2.value.en, /does not make an approval or signature safe/);
  assert.match(fields.value.en, /token owner, spending protocol, token contract, amount and expiration/);
  assert.match(offchain.value.en, /remain offchain until another wallet broadcasts it later/);
  assert.match(offchain.value.en, /gas-free Sign prompt is still an authorization event/);
});

test("Wave58 states the approval-review and revocation boundary", () => {
  const approval = factByLabel("Approval review and revocation");

  assert.equal(approval?.axis, "access");
  assert.match(approval.value.en, /approval checker for the active network/);
  assert.match(approval.value.en, /Revoking requires a network transaction and cost/);
  assert.match(approval.value.en, /disconnecting a dapp is not the same as revoking its token approval/);
  assert.doesNotMatch(englishFactCopy, /guaranteed safe|certified safe|risk[- ]free|testnet proves|guarantees mainnet/i);
});

test("Wave58 deepens the Uniswap official app, pool and transaction-preview boundaries", () => {
  const officialBoundary = factByLabel("Official app and docs boundary");
  const poolBoundary = factByLabel("Pool and token contract boundary");
  const transactionPreview = factByLabel("Gas and transaction preview boundary");

  assert.equal(officialBoundary?.axis, "access");
  assert.equal(poolBoundary?.axis, "custody");
  assert.equal(transactionPreview?.axis, "execution");
  assert.match(officialBoundary.value.en, /separate the official app route from developer docs/);
  assert.match(officialBoundary.value.en, /app\.uniswap\.org/);
  assert.match(officialBoundary.value.en, /quickstart, supported-chains and deployments docs/);
  assert.match(poolBoundary.value.en, /token contract address identifies the asset on one chain/);
  assert.match(poolBoundary.value.en, /pool or route determines liquidity and execution/);
  assert.match(poolBoundary.value.en, /does not prove the intended mainnet token, pool depth, fee tier or hook behavior/);
  assert.match(transactionPreview.value.en, /last Uniswap decision point is the wallet preview/);
  assert.match(transactionPreview.value.en, /gas asset, expected output, slippage, approval or Permit2 spender/);
  assert.match(transactionPreview.value.en, /quote or testnet transaction is not the same as an executed mainnet swap/);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  AEO_HIGH_INTENT_VISIBILITY_BASELINE,
  AEO_QUESTION_REGISTRY,
  aeoQuestionText,
  aeoQuestionsForMarket,
} from "../src/data/aeo-question-registry.js";

test("AEO question registry contains unique, bounded international targets", () => {
  assert.equal(AEO_QUESTION_REGISTRY.length, 140);
  assert.equal(new Set(AEO_QUESTION_REGISTRY.map((item) => item.id)).size, 140);
  for (const item of AEO_QUESTION_REGISTRY) {
    assert.match(item.canonicalPath, /^\//);
    assert.ok(item.question.length >= 20);
    assert.ok(["source-linked", "pending-source-review"].includes(item.status));
    assert.equal(item.status === "source-linked", item.sourceUrls.length > 0);
    assert.ok(item.answerBoundary.includes("do not infer eligibility"));
  }
});

test("high-intent AEO visibility baseline records unverifiable citation status conservatively", () => {
  assert.equal(AEO_HIGH_INTENT_VISIBILITY_BASELINE.length, 11);
  assert.equal(new Set(AEO_HIGH_INTENT_VISIBILITY_BASELINE.map((item) => item.id)).size, 11);
  const serialized = JSON.stringify(AEO_HIGH_INTENT_VISIBILITY_BASELINE);

  for (const item of AEO_HIGH_INTENT_VISIBILITY_BASELINE) {
    assert.match(item.query, /\w/);
    assert.match(item.targetUrl, /^https:\/\/nexualpha\.com\//);
    assert.equal(item.checkedAt, "2026-09-28");
    assert.equal(item.mentionedBrand, false);
    assert.deepEqual(item.citedUrls, []);
    assert.equal(item.accuracy, "not-observed");
    assert.ok(item.sourceUrls.length >= 3, item.id);
    assert.ok(item.sourceUrls.every((url) => /^https:\/\//.test(url)), item.id);
    assert.match(item.notes, /Track|visibility|queries|wallet|CPF/i);
  }

  assert.match(serialized, /Hyperliquid fees funding liquidation/);
  assert.match(serialized, /Uniswap token contract Universal Router Permit2/);
  assert.match(serialized, /GMX pool liquidity price impact/);
  assert.match(serialized, /Deribit options fees portfolio margin/);
  assert.match(serialized, /Bybit vs Bitget copy trading fees KYC/);
  assert.match(serialized, /Brazil Pix BRL crypto exchange/);
  assert.doesNotMatch(serialized, /AI Overview cited|ChatGPT cited|Perplexity cited|guaranteed citation|ranking achieved/i);
});

test("GSC comparison question wave deepens Bybit vs Bitget without signup claims", () => {
  const questions = aeoQuestionsForMarket("COMPARISON");
  const englishQuestions = questions.filter((item) => item.locale === "en");
  assert.equal(questions.length, 5);
  assert.equal(englishQuestions.length, 3);
  for (const item of englishQuestions) {
    assert.equal(item.locale, "en");
    assert.equal(item.status, "source-linked");
    assert.equal(item.canonicalPath, "/compare/bybit-vs-bitget");
    assert.ok(item.sourceUrls.length >= 2);
    assert.ok(item.sourceUrls.every((url) => /^https:\/\//.test(url)));
    assert.match(item.answerBoundary, /do not infer eligibility/);
    assert.doesNotMatch([item.question, ...item.sourceUrls].join(" "), /guaranteed discount|private commission|invite code|referral link/i);
  }
  assert.match(questions.map((item) => item.question).join(" "), /real stocks, tokenized stocks or stock perpetuals/);
});

test("AEO question registry covers the first international market wave", () => {
  for (const market of ["HK", "EU", "UK", "JP", "KR", "SG", "TR", "US", "BR", "MX", "TW", "ID", "OTHER"]) {
    assert.ok(aeoQuestionsForMarket(market).length > 0, market);
  }
  assert.equal(aeoQuestionsForMarket("unknown").length, 0);
  const mxPaths = new Set(aeoQuestionsForMarket("MX").map((item) => item.canonicalPath));
  assert.ok(mxPaths.has("/mx/comparar"));
  assert.ok(mxPaths.has("/mx/costos"));
  assert.ok(mxPaths.has("/mx/conta"));
});

test("Singapore research wave keeps source-linked questions on the source-backed route", () => {
  const questions = aeoQuestionsForMarket("SG");
  assert.equal(questions.length, 4);
  for (const item of questions) {
    assert.equal(item.locale, "en");
    assert.equal(item.status, "source-linked");
    assert.equal(item.canonicalPath, "/sg");
    assert.ok(item.sourceUrls.length >= 4);
    assert.ok(item.sourceUrls.every((url) => /^https:\/\//.test(url)));
    assert.match(item.answerBoundary, /do not infer eligibility/);
  }
  assert.match(questions.map((item) => item.question).join(" "), /MAS Digital Payment Token|SGD funding|product and benefit/);
});

test("localized EU and UK wave keeps official-source and route boundaries", () => {
  const ids = ["eu-product-availability-ja", "eu-jurisdiction-ko", "eu-register-tr", "uk-register-tr", "uk-product-ja", "uk-account-ko"];
  for (const id of ids) {
    const item = AEO_QUESTION_REGISTRY.find((entry) => entry.id === id);
    assert.ok(item, id);
    assert.equal(item.status, "source-linked");
    assert.ok(item.sourceUrls.every((url) => /^https:\/\//.test(url)));
    assert.match(item.canonicalPath, /^\/(eu|uk)\?locale=/);
    assert.ok(item.answerBoundary.includes("do not infer eligibility"));
  }
});

test("Turkish research wave keeps official-source and eligibility boundaries", () => {
  const questions = aeoQuestionsForMarket("TR");
  assert.equal(questions.length, 4);
  for (const item of questions) {
    assert.equal(item.locale, "tr");
    assert.equal(item.status, "source-linked");
    assert.equal(item.canonicalPath, "/tr/markets/turkiye");
    assert.ok(item.sourceUrls.length >= 2);
    assert.match(item.answerBoundary, /do not infer eligibility/);
  }
});

test("Turkey SPK publication map stays aligned with the registry and Schema question", async () => {
  const question = aeoQuestionText("tr-spk-register");
  const publicationMap = await readFile(new URL("../docs/strategy/aeo-first-20-publication-map-20260914.md", import.meta.url), "utf8");
  const seoInjection = await readFile(new URL("../src/data/seo-injection.js", import.meta.url), "utf8");

  assert.match(publicationMap, new RegExp(`\\| 16 \\| \`tr-spk-register\` \\| ${question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\|`));
  assert.match(seoInjection, /TR:\s*\{\s*tr:\s*\{\s*question:\s*aeoQuestionText\("tr-spk-register"\)/);
});

test("protocol question wave deepens GSC targets without promotion claims", () => {
  const allQuestions = aeoQuestionsForMarket("PROTOCOL");
  assert.equal(allQuestions.length, 37);
  // R93 adds three separately dated affiliate questions; keep this original
  // wave's locale and owner contracts exact rather than widening every row.
  const questions = allQuestions.filter(item => !item.id.startsWith("uniswap-affiliate-boundary-"));
  assert.equal(questions.length, 34);
  for (const item of questions) {
    assert.ok(["en", "ko", "tr"].includes(item.locale));
    assert.equal(item.status, "source-linked");
    assert.match(item.canonicalPath, /^(?:\/(?:ko|tr))?\/exchanges\/(?:hyperliquid|uniswap|jupiter|aerodrome)$/);
    assert.ok(item.sourceUrls.length >= 1);
    assert.ok(item.sourceUrls.every((url) => /^https:\/\//.test(url)));
    assert.match(item.answerBoundary, /do not infer eligibility/);
    assert.doesNotMatch([item.question, ...item.sourceUrls].join(" "), /signup reward|guaranteed discount|private commission|invite code|referral link/i);
  }

  const byId = Object.fromEntries(questions.map((item) => [item.id, item]));
  assert.match(byId["hyperliquid-referral-cashback-boundary"].question, /referral discount, a cashback offer, or both/);
  assert.ok(byId["hyperliquid-referral-cashback-boundary"].sourceUrls.includes("https://hyperliquid.gitbook.io/hyperliquid-docs/referrals"));
  assert.match(byId["hyperliquid-funded-account-boundary"].question, /sub-accounts, API wallets and account modes/);
  assert.match(byId["hyperliquid-funded-account-meaning"].question, /wallet collateral, sub-accounts, vault participation/);
  assert.ok(byId["hyperliquid-funded-account-meaning"].sourceUrls.includes("https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/vaults"));
  assert.match(byId["hyperliquid-vault-subaccount-discount-boundary"].question, /vaults and sub-accounts/);
  assert.ok(byId["hyperliquid-vault-subaccount-discount-boundary"].sourceUrls.includes("https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/vaults"));
  assert.match(byId["hyperliquid-fees-before-trading"].question, /connecting a wallet or placing a perp order/);
  assert.match(byId["hyperliquid-funding-payment"].question, /funding payments/);
  assert.match(byId["uniswap-fee-versions"].question, /v2, v3 and v4/);
  assert.match(byId["uniswap-v4-deployment-check"].question, /contract deployments/);
  assert.match(byId["uniswap-testnet-hook-path"].question, /test environment/);
  assert.match(byId["uniswap-testnet-production-boundary"].question, /production swap route/);
  assert.match(byId["uniswap-testnet-contract-route"].question, /contract deployment and network route/);
  assert.ok(byId["uniswap-wallet-route-test"].sourceUrls.includes("https://developers.uniswap.org/docs/protocols/permit2/overview"));
  assert.match(byId["uniswap-api-web-testnet-scope"].question, /API versus the official web interface/);
  assert.ok(byId["uniswap-api-web-testnet-scope"].sourceUrls.includes("https://developers.uniswap.org/docs/trading/swapping-api/supported-chains"));
  assert.match(byId["uniswap-mainnet-wallet-preview-boundary"].question, /mainnet wallet transaction preview/);
  assert.ok(byId["uniswap-mainnet-wallet-preview-boundary"].sourceUrls.includes("https://app.uniswap.org/"));
  assert.match(byId["uniswap-token-router-permit2-spender"].question, /token contract, Universal Router, Permit2 contract and spender/);
  assert.ok(byId["uniswap-token-router-permit2-spender"].sourceUrls.includes("https://support.uniswap.org/hc/en-us/articles/40050562560781-Crypto-Wallet-Signature-Scams"));
  assert.match(byId["uniswap-approval-revoke-boundary"].question, /disconnecting a wallet from Uniswap/);
  assert.ok(byId["uniswap-approval-revoke-boundary"].sourceUrls.includes("https://support.uniswap.org/hc/en-us/articles/25380237324685-How-to-revoke-token-approvals"));
  assert.match(byId["jupiter-swap-ultra-route"].question, /Swap and Ultra routes/);
  assert.match(byId["jupiter-token-mint-check"].question, /token mints and list status/);
  assert.match(byId["jupiter-platform-fee-boundary"].question, /platform fees, wallet fees or Solana network costs/);
  assert.match(byId["aerodrome-base-network-check"].question, /Base network, bridge and wallet conditions/);
  assert.match(byId["aerodrome-pool-fee-check"].question, /standard and Slipstream liquidity/);
  assert.match(byId["aerodrome-incentive-boundary"].question, /veAERO voting or reward entitlement/);
});

test("Wave12 Korean and Turkish AEO entries cover the 12 high-intent localized pages", () => {
  const expected = [
    ["/ko/exchanges/hyperliquid", "ko"],
    ["/tr/exchanges/hyperliquid", "tr"],
    ["/ko/exchanges/uniswap", "ko"],
    ["/tr/exchanges/uniswap", "tr"],
    ["/ko/exchanges/aerodrome", "ko"],
    ["/tr/exchanges/aerodrome", "tr"],
    ["/ko/exchanges/jupiter", "ko"],
    ["/tr/exchanges/jupiter", "tr"],
    ["/ko/compare/bybit-vs-bitget", "ko"],
    ["/tr/compare/bybit-vs-bitget", "tr"],
    ["/ko/topics/no-kyc", "ko"],
    ["/tr/topics/no-kyc", "tr"],
  ];
  for (const [canonicalPath, locale] of expected) {
    const item = AEO_QUESTION_REGISTRY.find((entry) => entry.canonicalPath === canonicalPath && entry.locale === locale);
    assert.ok(item, canonicalPath);
    assert.equal(item.status, "source-linked", canonicalPath);
    assert.ok(item.sourceUrls.length >= 2, canonicalPath);
    assert.match(item.answerBoundary, /do not infer eligibility/);
    assert.doesNotMatch([item.question, ...item.sourceUrls].join(" "), /guaranteed discount|private commission|invite code|referral link/i);
  }
});

test("article question wave maps GSC topics to canonical sources without conversion claims", () => {
  const questions = aeoQuestionsForMarket("ARTICLE");
  assert.equal(questions.length, 6);
  for (const item of questions) {
    assert.equal(item.locale, "en");
    assert.equal(item.status, "source-linked");
    assert.match(item.canonicalPath, /^(?:\/topics\/tokenized-treasuries|\/news\/(?:okx-usd-to-usdc-spot-pair-migration|hyperliquid-vs-dydx))$/);
    assert.ok(item.sourceUrls.length >= 5);
    assert.ok(item.sourceUrls.every((url) => /^https:\/\//.test(url)));
    assert.match(item.answerBoundary, /do not infer eligibility/);
    assert.doesNotMatch([item.question, ...item.sourceUrls].join(" "), /guaranteed yield|registration bonus|private commission|invite code|referral link/i);
  }

  const byId = Object.fromEntries(questions.map((item) => [item.id, item]));
  assert.equal(byId["tokenized-treasury-legal-claim"].canonicalPath, "/topics/tokenized-treasuries");
  assert.equal(byId["tokenized-treasury-buidl-benji-boundary"].canonicalPath, "/topics/tokenized-treasuries");
  assert.match(byId["tokenized-treasury-legal-claim"].question, /legal claim/);
  assert.match(byId["tokenized-treasury-buidl-benji-boundary"].question, /BUIDL and BENJI/);
  assert.match(byId["okx-usd-usdc-migration-instid"].question, /API users/);
  assert.match(byId["okx-usd-usdc-migration-orders-bots"].question, /open orders, margin positions and trading bots/);
  assert.match(byId["hyperliquid-dydx-perp-fee-funding"].question, /fees, funding and margin/);
  assert.match(byId["hyperliquid-dydx-liquidation-oracle-boundary"].question, /liquidation and oracle docs/);
});

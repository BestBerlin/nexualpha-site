import assert from "node:assert/strict";
import test from "node:test";
import { AEO_QUESTION_REGISTRY, aeoQuestionsForMarket } from "../src/data/aeo-question-registry.js";
import { directoryContext, directoryContextSearch, defaultDirectoryCategory } from "../src/data/directory-context.js";
import { internationalSourcesFor } from "../src/data/international-source-registry.js";
import {
  resolveMarketAccountStage,
  resolveMarketOffer,
  resolveMarketPayment,
  resolveMarketPolicy,
  resolveTargetMarket,
} from "../src/data/market-policy.js";

const forbiddenUrlTracking = /[?&](?:utm_|source=|campaign=|ref=|referral|invite|aff)/i;
const forbiddenPromise = /approved by FinCEN|guaranteed|guarantee|guaranteed reward|fixed reward|bonus|cashback|guaranteed yield|权益承诺|背书承诺/i;

test("R19 US official source pack is research-only and URL-clean", () => {
  const record = internationalSourcesFor("US");
  assert.match(record.authority, /FinCEN, SEC, CFTC, NMLS\/NYDFS/);
  assert.ok(record.sources.length >= 10);

  const byUrl = new Set(record.sources.map((source) => source.url));
  for (const expected of [
    "https://www.fincen.gov/resources/money-services-business-msb-registration",
    "https://www.fincen.gov/resources/statutes-regulations/guidance/application-fincens-regulations-persons-administering",
    "https://www.sec.gov/resources-small-businesses/capital-raising-building-blocks/crypto-assets-federal-securities-laws",
    "https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/understand_risks_of_virtual_currency.html",
    "https://www.nmlsconsumeraccess.org/",
    "https://www.dfs.ny.gov/virtual_currency_businesses",
    "https://help.coinbase.com/en/exchange/trading-and-funding/funding-your-account-with-usd",
    "https://support.kraken.com/in/articles/quick-start-for-clients-in-the-united-states",
    "https://support.kraken.com/hc/articles/4408922630676-ACH-withdrawals",
    "https://support.binance.us/en/articles/9842801-how-to-create-your-account-pass-identity-verification-basic-advanced",
    "https://support.binance.us/en/collections/10384430-deposits-withdrawals",
  ]) {
    assert.ok(byUrl.has(expected), expected);
  }

  for (const item of record.sources) {
    assert.match(item.url, /^https:\/\//);
    assert.doesNotMatch(item.url, forbiddenUrlTracking);
    assert.equal(item.status, "source-linked");
    assert.match(item.note, /Use|registration|context|account|official/i);
  }

  const notes = record.sources.map((item) => item.note).join(" ");
  assert.match(notes, /not FinCEN approval, endorsement/);
  assert.match(notes, /SEC context/);
  assert.match(notes, /CFTC context/);
  assert.match(notes, /NMLS Consumer Access/);
  assert.match(notes, /NYDFS BitLicense/);
  assert.match(notes, /Coinbase/);
  assert.match(notes, /Kraken/);
  assert.match(notes, /Binance\.US/);
});

test("R19 US policy defaults to spot and USD research checks without benefit promises", () => {
  const policy = resolveMarketPolicy({ market: "US" });
  assert.equal(policy.targetMarket, "US");
  assert.equal(policy.defaultLocale, "en");
  assert.equal(policy.product, "spot");
  assert.deepEqual(resolveMarketPayment({ market: "US" }).modes, ["USD", "ACH", "wire", "crypto_onchain"]);
  assert.deepEqual(resolveMarketPayment({ market: "US" }).accountCurrency, ["USD", "USDT"]);
  assert.equal(resolveMarketPayment({ market: "US" }).applicable, false);
  assert.equal(resolveMarketAccountStage({ market: "US" }).requiresKyc, true);
  assert.equal(resolveMarketAccountStage({ market: "US" }).requiresResidenceMatch, true);
  assert.equal(resolveMarketOffer({ market: "US" }).shareableToUsers, false);
  assert.equal(resolveMarketOffer({ market: "US" }).confidence, "research-only");
  assert.doesNotMatch(JSON.stringify(policy.offer), forbiddenPromise);
  assert.equal(resolveTargetMarket({ pathname: "/us" }), "US");
});

test("R19 US directory context keeps state, account and product search scoped", () => {
  const context = directoryContext({ market: "US" });
  assert.deepEqual(
    {
      market: context.market,
      product: context.product,
      locale: context.locale,
      label: context.label,
      scoped: context.scoped,
    },
    {
      market: "US",
      product: "spot",
      locale: "en",
      label: "United States",
      scoped: true,
    },
  );
  assert.ok(context.terms.includes("new york"));
  assert.ok(context.terms.includes("usd"));
  assert.equal(defaultDirectoryCategory({ market: "US" }), "CEX");

  const params = new URLSearchParams(directoryContextSearch({ market: "US", accountStage: "existing_account", funding: "USD" }));
  assert.equal(params.get("market"), "US");
  assert.equal(params.get("product"), "spot");
  assert.equal(params.get("account_stage"), "existing_account");
  assert.equal(params.get("funding"), null);
  assert.equal(params.get("utm_campaign"), "us-research-preview");
});

test("R19 US AEO questions are canonical, source-linked and account dependent", () => {
  const questions = aeoQuestionsForMarket("US");
  assert.equal(questions.length, 4);
  assert.deepEqual(
    questions.map((item) => item.id),
    [
      "us-fincen-msb-non-endorsement",
      "us-state-license-boundary",
      "us-usd-account-funding",
      "us-product-scope-spot",
    ],
  );

  for (const item of questions) {
    assert.equal(item.locale, "en");
    assert.equal(item.status, "source-linked");
    assert.equal(item.canonicalPath, "/us");
    assert.ok(item.sourceUrls.length >= 10);
    assert.ok(item.sourceUrls.every((url) => /^https:\/\//.test(url)));
    assert.ok(item.sourceUrls.every((url) => !forbiddenUrlTracking.test(url)));
    assert.match(item.answerBoundary, /do not infer eligibility/);
    assert.doesNotMatch([item.question, ...item.sourceUrls].join(" "), forbiddenPromise);
  }

  const text = AEO_QUESTION_REGISTRY.filter((item) => item.market === "US").map((item) => item.question).join(" ");
  assert.match(text, /FinCEN MSB registration/);
  assert.match(text, /NMLS or NYDFS state-license/);
  assert.match(text, /USD, ACH, wire, bank-name and withdrawal-hold/);
  assert.match(text, /staking, derivatives, rewards or every crypto asset/);
});

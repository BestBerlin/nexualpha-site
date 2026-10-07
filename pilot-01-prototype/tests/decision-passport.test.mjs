import test from "node:test";
import assert from "node:assert/strict";
import {
  ANONYMOUS_DECISION_RESUME_STORAGE_KEY,
  appendDecisionPassportQuery,
  buildAnonymousDecisionResumeQuery,
  buildAnonymousDecisionResumeSnapshot,
  buildDecisionPassportQuery,
  loadAnonymousDecisionResumeSnapshot,
  readAnonymousDecisionResumeSnapshot,
  readDecisionPassport,
  saveAnonymousDecisionResumeSnapshot,
  sanitizeDecisionFunding,
} from "../src/data/decision-passport.js";
import { directoryContextSearch } from "../src/data/directory-context.js";
import { buildRegionalShortlist } from "../src/data/regional-shortlist.js";

test("decision passport round-trips a reviewed Japan signup context", () => {
  const funding = "registered bank account in user's name";
  const query = buildDecisionPassportQuery({ market: "jp", product: "spot", accountStage: "new_account", funding });
  assert.deepEqual(readDecisionPassport(`?${query}`), {
    market: "JP",
    product: "spot",
    accountStage: "new_account",
    funding,
  });
});

test("decision passport drops unknown and cross-market funding values", () => {
  assert.equal(sanitizeDecisionFunding("Pix", "JP"), null);
  assert.equal(sanitizeDecisionFunding("<script>alert(1)</script>", "BR"), null);
  assert.deepEqual(readDecisionPassport("?market=JP&product=spot&funding=Pix&account_stage=new_account"), {
    market: "JP",
    product: "spot",
    accountStage: "new_account",
  });
});

test("decision passport appends controlled fields before a hash", () => {
  assert.equal(
    appendDecisionPassportQuery("/exchanges/bitflyer#registration-path", { market: "JP", product: "spot", accountStage: "new_account", funding: "JPY deposit" }),
    "/exchanges/bitflyer?market=JP&product=spot&account_stage=new_account&funding=JPY+deposit#registration-path",
  );
});

test("regional shortlist carries the reviewed passport into compare and venue handoffs", () => {
  const shortlist = buildRegionalShortlist({ market: "MX", locale: "es", product: "spot", funding: "SPEI", accountStage: "another_platform" });
  for (const href of [shortlist.compareHref, ...shortlist.candidates.map((candidate) => candidate.directHref).filter(Boolean)]) {
    const parsed = new URL(href, "https://nexualpha.com");
    assert.equal(parsed.searchParams.get("market"), "MX");
    assert.equal(parsed.searchParams.get("product"), "spot");
    assert.equal(parsed.searchParams.get("account_stage"), "another_platform");
    assert.equal(parsed.searchParams.get("funding"), "SPEI");
  }
});

test("comparison and venue directory context preserve the reviewed passport", () => {
  const query = directoryContextSearch({
    market: "HK",
    product: "spot",
    locale: "zh-Hant",
    accountStage: "new_account",
    funding: "HKD bank transfer",
  });
  const params = new URLSearchParams(query);

  assert.equal(params.get("market"), "HK");
  assert.equal(params.get("product"), "spot");
  assert.equal(params.get("account_stage"), "new_account");
  assert.equal(params.get("funding"), "HKD bank transfer");
  assert.equal(params.get("locale"), "zh-Hant");
});


test("anonymous decision resume snapshot stores only whitelisted public decision fields", () => {
  const snapshot = buildAnonymousDecisionResumeSnapshot({
    market: "br",
    product: "spot",
    accountStage: "new_account",
    funding: "Pix",
    scenario: "compare",
    venue: "bitget",
    pair: "binance-vs-okx",
    referral: "nexu888",
    identity: "telegram-user-123",
    protectedUrl: "https://accounts.binance.com/register?inviteCode=nexu888",
  });

  assert.deepEqual(snapshot, {
    version: 1,
    anonymousOnly: true,
    state: {
      market: "BR",
      product: "spot",
      accountStage: "new_account",
      funding: "Pix",
      scenario: "compare",
      venue: "bitget",
      pair: "binance-vs-okx",
    },
  });
  assert.doesNotMatch(JSON.stringify(snapshot), /telegram-user|referral|inviteCode|accounts\.binance|nexu888/i);

  const query = buildAnonymousDecisionResumeQuery(snapshot.state);
  assert.equal(query.get("market"), "BR");
  assert.equal(query.get("product"), "spot");
  assert.equal(query.get("account_stage"), "new_account");
  assert.equal(query.get("funding"), "Pix");
  assert.equal(query.get("scenario"), "compare");
  assert.equal(query.get("venue"), "bitget");
  assert.equal(query.get("pair"), "binance-vs-okx");
  assert.equal(query.has("referral"), false);
});

test("anonymous decision resume storage fails closed for tampered protected material", () => {
  assert.equal(readAnonymousDecisionResumeSnapshot(JSON.stringify({
    version: 1,
    anonymousOnly: true,
    state: { market: "BR", product: "spot", referral: "nexu888" },
  })), null);
  assert.equal(readAnonymousDecisionResumeSnapshot(JSON.stringify({
    version: 1,
    anonymousOnly: true,
    state: { market: "BR", venue: "https://accounts.binance.com/register?inviteCode=nexu888" },
  })), null);
  assert.equal(readAnonymousDecisionResumeSnapshot("not-json"), null);

  const memory = new Map();
  const storage = {
    getItem: (key) => memory.get(key) || null,
    setItem: (key, value) => memory.set(key, value),
  };
  assert.equal(saveAnonymousDecisionResumeSnapshot(storage, { market: "HK", product: "spot", accountStage: "new_account", funding: "HKD bank transfer", scenario: "venue", venue: "bitget" }), true);
  assert.equal(memory.has(ANONYMOUS_DECISION_RESUME_STORAGE_KEY), true);
  assert.deepEqual(loadAnonymousDecisionResumeSnapshot(storage)?.state, {
    market: "HK",
    product: "spot",
    accountStage: "new_account",
    funding: "HKD bank transfer",
    scenario: "venue",
    venue: "bitget",
  });
});

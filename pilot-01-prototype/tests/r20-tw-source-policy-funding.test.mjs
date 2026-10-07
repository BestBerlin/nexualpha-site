import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { aeoQuestionsForMarket } from "../src/data/aeo-question-registry.js";
import { directoryContext } from "../src/data/directory-context.js";
import { internationalSourcesFor } from "../src/data/international-source-registry.js";
import { resolveMarketPolicy } from "../src/data/market-policy.js";
import { regionalFundingRowsForMarket } from "../src/data/regional-funding-verification-matrix.js";

const unsafeCommercialPattern = /partner\.bitget|bsmkweb|topzhjdgxcb|affiliate_id|ref=11350287|invite code|邀請碼/i;

test("R20 Taiwan official-source pack distinguishes promulgation, effective AML registration and account outcomes", () => {
  const pack = internationalSourcesFor("TW");
  const serialized = JSON.stringify(pack);

  assert.match(pack.authority, /Taiwan Financial Supervisory Commission \(FSC\)/);
  assert.ok(pack.sources.length >= 6);
  assert.match(serialized, /Virtual Asset Service Act/);
  assert.match(serialized, /all or part of its provisions have not yet taken effect/);
  assert.match(serialized, /anti-money-laundering registration rules/);
  assert.match(serialized, /completed-registration list/);
  assert.match(serialized, /registration is not a NexuAlpha endorsement/i);
  assert.doesNotMatch(serialized, unsafeCommercialPattern);
});

test("R20 Taiwan AEO questions are Traditional Chinese, source-linked and answer the legal timing boundary", () => {
  const questions = aeoQuestionsForMarket("TW");
  const serialized = JSON.stringify(questions);

  assert.equal(questions.length, 6);
  assert.ok(questions.every((item) => item.locale === "zh-Hant"));
  assert.ok(questions.every((item) => item.status === "source-linked"));
  assert.ok(questions.every((item) => item.canonicalPath.startsWith("/tw")));
  assert.ok(questions.every((item) => item.sourceUrls.length >= 6));
  assert.match(serialized, /已公布但部分條文尚未施行/);
  assert.match(serialized, /完成洗錢防制登記的 VASP 名單/);
  assert.match(serialized, /不把登記誤認為帳戶或產品保證/);
  assert.doesNotMatch(serialized, unsafeCommercialPattern);
});

test("R20 Taiwan policy and directory context stay research-only with TWD personal-bank checks", () => {
  const policy = resolveMarketPolicy({ market: "TW" });
  const context = directoryContext({ market: "TW" });

  assert.equal(policy.defaultLocale, "zh-Hant");
  assert.equal(policy.payment.applicable, false);
  assert.deepEqual(policy.payment.modes, ["TWD", "personal_bank_transfer", "crypto_onchain"]);
  assert.deepEqual(policy.payment.accountCurrency, ["TWD", "USDT"]);
  assert.equal(policy.offer.shareableToUsers, false);
  assert.equal(policy.offer.confidence, "research-only");
  assert.match(policy.payment.notes.join(" "), /personal-bank-account name match|TWD deposit and withdrawal separately/);
  assert.match(policy.offer.notes.join(" "), /do not establish account or product availability/);
  assert.equal(context.locale, "zh-Hant");
  assert.equal(context.label, "台灣");
  assert.ok(context.terms.includes("twd"));
  assert.ok(context.terms.includes("vasp"));
});

test("R20 Taiwan funding row separates deposit, withdrawal, KYC, product and unknown fee outcomes", async () => {
  const [row] = regionalFundingRowsForMarket("TW");
  assert.ok(row);
  assert.equal(row.id, "tw-twd-personal-bank");
  assert.equal(row.locale, "zh-Hant");
  assert.equal(row.fiatCurrency, "TWD");
  assert.match(row.accountScreenChecks.join(" "), /KYC|本人銀行帳戶|入金與出金必須分開|現貨/);
  assert.match(row.feeOrTimingChecks.join(" "), /費用、限額、到帳時間與審核時間一律保持 unknown/);
  assert.match(row.unknowns.join(" "), /全部或部分條文尚未施行|新臺幣入金|新臺幣出金|衍生性商品/);
  assert.match(row.cannotPromise, /不保證特定業者、帳戶或產品在台灣可用/);
  assert.ok(row.officialSources.some((item) => item.role === "official-register"));
  assert.doesNotMatch(JSON.stringify(row), unsafeCommercialPattern);

  const [jsonText, csvText] = await Promise.all([
    readFile(new URL("../public/research/regional-funding-verification-matrix.json", import.meta.url), "utf8"),
    readFile(new URL("../public/research/regional-funding-verification-matrix.csv", import.meta.url), "utf8"),
  ]);
  assert.match(jsonText, /"id": "tw-twd-personal-bank"/);
  assert.match(jsonText, /Taiwan FSC Virtual Asset Service Act/);
  assert.match(csvText, /tw-twd-personal-bank,TW,Taiwan,zh-Hant,TWD/);
  assert.match(csvText, /全部或部分條文尚未施行/);
  assert.doesNotMatch(`${jsonText}\n${csvText}`, unsafeCommercialPattern);
});

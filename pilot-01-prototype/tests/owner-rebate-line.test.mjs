// QA 2026-10-10: the home sign-up desk and the exchange profiles must state the same owner-declared rebate terms.
import test from "node:test";
import assert from "node:assert/strict";
import { ownerRebateLine } from "../src/data/owner-rebate-line.js";
import { HOME_REBATE_SHARE, HOME_SETTLE, HOME_REBATE_MAX_PCT } from "../src/data/home-rebate-tiers.js";
import { H7_COPY } from "../src/components/v7/home7-copy.js";

test("every declared share appears on the profile line with its percentage and cadence", () => {
  for (const [slug, share] of Object.entries(HOME_REBATE_SHARE)) {
    const line = ownerRebateLine(slug, "zh-Hans", slug);
    if (!share) { assert.equal(line, null, `${slug} has no declared share and must keep the verify wording`); continue; }
    assert.match(line, new RegExp(`${Math.round(share * 100)}%`));
    if (HOME_SETTLE[slug]) assert.match(line, HOME_SETTLE[slug] === "hourly" ? /每小时/ : /每天/);
  }
});

test("undeclared venues get no rebate line", () => {
  for (const slug of ["kraken", "mexc", "htx", "hyperliquid"]) assert.equal(ownerRebateLine(slug, "en", slug), null);
});

test("the headline maximum is the highest declared share", () => {
  const top = Math.max(...Object.values(HOME_REBATE_SHARE).filter(Boolean)) * 100;
  assert.equal(HOME_REBATE_MAX_PCT, Math.round(top));
});

test("the line renders in every home locale without placeholders", () => {
  for (const locale of Object.keys(H7_COPY)) {
    const line = ownerRebateLine("bitget", locale, "Bitget");
    assert.ok(line && !/undefined|\{/.test(line), `${locale}: ${line}`);
  }
});

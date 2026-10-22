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
  // HTX moved to the declared list on 2026-10-14; MEXC, Kraken, Backpack, Hyperliquid and CoinW on 2026-10-22 (owner). Bybit is still undeclared.
  assert.equal(ownerRebateLine("bybit", "en", "Bybit"), null);
  for (const [slug, pct] of [["mexc", 30], ["kraken", 20], ["backpack", 30], ["hyperliquid", 30], ["coinw", 40]]) assert.match(ownerRebateLine(slug, "en", slug), new RegExp(`${pct}%`), slug);
});

test("the headline maximum is the highest declared share", () => {
  const top = Math.max(...Object.values(HOME_REBATE_SHARE).filter(Boolean)) * 100;
  assert.equal(HOME_REBATE_MAX_PCT, Math.round(top));
});

test("the line renders in every home locale without placeholders", () => {
  for (const locale of Object.keys(H7_COPY)) {
    // Türkiye: no Bitget rebate line at all (SPK list, owner 2026-10-13); OKX stands in for the placeholder check.
    const [slug, name] = locale === "tr" ? ["okx", "OKX"] : ["bitget", "Bitget"];
    const line = ownerRebateLine(slug, locale, name);
    assert.ok(line && !/undefined|\{/.test(line), `${locale}: ${line}`);
  }
});

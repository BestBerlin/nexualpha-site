import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildHomeRebateRuntimeSnapshot, renderHomeRebateRuntime } from "../scripts/generate-home-rebate-runtime.mjs";
import {
  HOME_AUTO_SETTLE,
  HOME_PARTNERS,
  HOME_PUSH,
  HOME_REBATE_MAX_PCT,
  HOME_REBATE_SHARE,
  HOME_SETTLE,
  homePartnersFor,
  homePushFor,
  homeRebateMaxPctFor,
} from "../src/data/home-rebate-tiers.js";
import {
  HOME_AUTO_SETTLE as RUNTIME_AUTO_SETTLE,
  HOME_PARTNERS as RUNTIME_PARTNERS,
  HOME_PUSH as RUNTIME_PUSH,
  HOME_REBATE_MAX_PCT as RUNTIME_MAX_PCT,
  HOME_REBATE_SHARE as RUNTIME_SHARE,
  HOME_SETTLE as RUNTIME_SETTLE,
  homePartnersFor as runtimePartnersFor,
  homePushFor as runtimePushFor,
  homeRebateMaxPctFor as runtimeMaxPctFor,
} from "../src/data/home-rebate-runtime.js";

const LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"];
const MARKETS = [undefined, "TR", "BR", "US"];

test("generated home rebate runtime constants are derived from registry-backed tiers", async () => {
  const snapshot = buildHomeRebateRuntimeSnapshot();
  assert.deepEqual(snapshot, {
    maxPct: HOME_REBATE_MAX_PCT,
    share: Object.fromEntries(Object.entries(HOME_REBATE_SHARE)),
    partners: [...HOME_PARTNERS],
    push: [...HOME_PUSH],
    autoSettle: [...HOME_AUTO_SETTLE],
    settle: Object.fromEntries(Object.entries(HOME_SETTLE)),
  });
  assert.equal(RUNTIME_MAX_PCT, HOME_REBATE_MAX_PCT);
  assert.deepEqual(RUNTIME_SHARE, HOME_REBATE_SHARE);
  assert.deepEqual(RUNTIME_PARTNERS, HOME_PARTNERS);
  assert.deepEqual(RUNTIME_PUSH, HOME_PUSH);
  assert.deepEqual(RUNTIME_AUTO_SETTLE, HOME_AUTO_SETTLE);
  assert.deepEqual(RUNTIME_SETTLE, HOME_SETTLE);
  const runtimeSource = await readFile(new URL("../src/data/home-rebate-runtime.js", import.meta.url), "utf8");
  assert.equal(runtimeSource, renderHomeRebateRuntime(snapshot));
  assert.doesNotMatch(runtimeSource, /^import .*partner-registry/m, "runtime must not import the partner registry");
  assert.doesNotMatch(runtimeSource, /HOME_VENUES|PLACEHOLDER_INVITE_CODE/, "runtime must stay a generated projection, not a hand-maintained registry clone");
});

test("generated home rebate runtime preserves locale and market gate parity", () => {
  for (const locale of LOCALES) {
    for (const market of MARKETS) {
      assert.deepEqual(runtimePartnersFor(locale, market), homePartnersFor(locale, market), `${locale}/${market || "default"}: partners`);
      assert.deepEqual(runtimePushFor(locale, market), homePushFor(locale, market), `${locale}/${market || "default"}: push`);
      assert.equal(runtimeMaxPctFor(locale, market), homeRebateMaxPctFor(locale, market), `${locale}/${market || "default"}: max pct`);
    }
  }
  assert.ok(!runtimePartnersFor("tr", "US").includes("bitget"), "Turkish locale keeps the Turkey gate even with a different market");
  assert.ok(!runtimePartnersFor("en", "TR").includes("bitget"), "explicit Turkey market gates non-promoted partners");
  assert.ok(runtimePartnersFor("pt-BR", "BR").includes("bitget"), "Brazil keeps the full home partner list");
  assert.ok(runtimePartnersFor("en", "US").includes("bitget"), "US keeps the full home partner list");
});

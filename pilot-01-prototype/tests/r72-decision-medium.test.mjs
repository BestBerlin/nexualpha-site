import test from "node:test";
import assert from "node:assert/strict";

import {
  DECISION_STORAGE_KEY,
  decisionStateFromSearch,
  decisionStateFromUrl,
  hasDecisionStateSearch,
  loadDecisionState,
  saveDecisionState,
  writeDecisionStateToUrl,
} from "../src/data/decision-state.js";

test("R72 Telegram manual draft medium survives decision URL and storage roundtrip", () => {
  const state = decisionStateFromUrl(
    "https://nexualpha.com/br/pix?locale=pt-BR&market=BR&product=spot&utm_source=tg_channel&utm_medium=manual_draft&utm_campaign=r72_br_pix_ownership_check&uid=private@example.com",
  );

  assert.equal(state.source, "tg_channel");
  assert.equal(state.medium, "manual_draft");
  assert.equal(state.campaign, "r72_br_pix_ownership_check");
  assert.equal(hasDecisionStateSearch("?utm_medium=manual_draft"), true);

  assert.equal(
    writeDecisionStateToUrl("/br/pix?locale=pt-BR&utm_medium=old&uid=private@example.com", state),
    "/br/pix?locale=pt-BR&market=BR&product=spot&amount=1000&spot_fee_bps=10&deposit_fee_pct=0&deposit_fixed_brl=0&utm_source=tg_channel&utm_medium=manual_draft&utm_campaign=r72_br_pix_ownership_check",
  );

  const values = new Map();
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  assert.equal(saveDecisionState(storage, state), true);
  assert.equal(JSON.parse(values.get(DECISION_STORAGE_KEY)).state.medium, "manual_draft");
  assert.equal(loadDecisionState(storage).medium, "manual_draft");
});

test("R72 broadcast medium is accepted but unsafe or unknown medium values are dropped", () => {
  assert.equal(decisionStateFromSearch("?utm_medium=broadcast").medium, "broadcast");
  assert.equal(decisionStateFromSearch("?utm_medium=manual_draft").medium, "manual_draft");
  assert.equal(decisionStateFromSearch("?utm_medium=https://evil.example/private").medium, "");
  assert.equal(decisionStateFromSearch("?utm_medium=email").medium, "");
  assert.equal(decisionStateFromSearch(`?utm_medium=${"a".repeat(61)}`).medium, "");
});

test("R72 decision URL writer keeps the helper onsite and does not copy arbitrary or partner query params", () => {
  const partnerInput = "https://partner.bitget.cafe/bg/C6PRAF?ref=nexu888&utm_medium=web_share_copy&secret=private";
  const state = decisionStateFromUrl(
    "https://nexualpha.com/br?market=BR&product=spot&utm_source=tg_channel&utm_medium=broadcast&utm_campaign=br_pix_ptbr&tg_draft=brazil_pix_ptbr",
  );

  assert.equal(
    writeDecisionStateToUrl(partnerInput, state),
    "/bg/C6PRAF?market=BR&product=spot&amount=1000&spot_fee_bps=10&deposit_fee_pct=0&deposit_fixed_brl=0&utm_source=tg_channel&utm_medium=broadcast&utm_campaign=br_pix_ptbr",
  );
});

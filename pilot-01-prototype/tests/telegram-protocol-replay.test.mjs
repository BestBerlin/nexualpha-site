import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  TELEGRAM_PROTOCOL_COMMAND_SEQUENCE,
  renderTelegramProtocolReplayMarkdown,
  runTelegramProtocolReplay,
  writeTelegramProtocolReplay,
} from "../scripts/replay-telegram-protocol.mjs";
import { TELEGRAM_WEEK1_RETENTION_LOOP } from "../src/data/telegram-config.js";

const PROTECTED_INVITE_RE =
  /(accounts\.binance\.com|bsmkweb\.cc|partner\.bitget|bitget\.com\/(?:expressly|register|referral|signup)|okx\.com\/(?:join|register|referral)|topzhjdgxcb|backpack\.exchange\/join|11350287|nexu888|luckybitcoin|LUCKX|CANDY007|INS898|1836370407|NEXU888)/i;

test("Telegram protocol replay covers local choice, stop and delete state transitions only", () => {
  const result = runTelegramProtocolReplay({ generatedAt: "2026-09-28T00:00:00.000Z" });

  assert.equal(result.status, "PASS_LOCAL_PROTOCOL_REPLAY");
  assert.equal(result.scope.telegramApiCalls, 0);
  assert.equal(result.scope.telegramMessagesSent, 0);
  assert.equal(result.scope.realAccountsOperated, 0);
  assert.equal(result.scope.realUserDataTouched, false);
  assert.equal(result.scope.partnerRegistryEdited, false);
  assert.deepEqual(result.scope.protectedUserCommandsExecuted, []);
  assert.deepEqual(result.scope.simulatedCommands, ["/choice save", "/choice view", "/choice change", "/choice clear", "/stop", "/delete"]);
  assert.deepEqual(
    result.contract.commandPhases,
    TELEGRAM_PROTOCOL_COMMAND_SEQUENCE.map((step) => step.phase),
  );
  assert.equal(result.scenarios.length, TELEGRAM_WEEK1_RETENTION_LOOP.scenarioMatrix.length);

  for (const scenario of result.scenarios) {
    assert.equal(scenario.commandReplay.length, TELEGRAM_PROTOCOL_COMMAND_SEQUENCE.length);
    assert.equal(scenario.localAcceptance.firstHopIsNexuAlphaOnsite, true);
    assert.equal(scenario.localAcceptance.subscriptionDefaultsOff, true);
    assert.equal(scenario.localAcceptance.protectedCommandsRemainRepresentational, true);
    assert.equal(scenario.localAcceptance.realUserDataTouched, false);
    assert.equal(scenario.localAcceptance.telegramApiCalls, 0);
    assert.equal(scenario.localAcceptance.telegramMessagesSent, 0);
    assert.match(scenario.botStartDeepLink, /^https:\/\/t\.me\/NexuAlphaAssistantBot\?start=/);
    assert.ok(scenario.botStartPayload.length <= 64);
    assert.ok(scenario.generatedStartPayload.length <= 64);
    assert.match(scenario.firstOnsiteReturnHref, /^\//);
    assert.doesNotMatch(scenario.firstOnsiteReturnHref, /^\/\//);
    assert.match(scenario.runtimeReturnHref, /^\//);
    assert.doesNotMatch(scenario.runtimeReturnHref, /^\/\//);
    assert.equal(scenario.runtimeReturnStatus, "restored");
    assert.equal(scenario.runtimeReplyKind, "onsite_return_link");
    assert.equal(scenario.localAcceptance.runtimeReturnIsNexuAlphaOnsite, true);

    const save = scenario.commandReplay.find((step) => step.phase === "choice_save");
    const view = scenario.commandReplay.find((step) => step.phase === "choice_view");
    const change = scenario.commandReplay.find((step) => step.phase === "choice_change");
    const clear = scenario.commandReplay.find((step) => step.phase === "choice_clear");
    const stop = scenario.commandReplay.find((step) => step.phase === "stop");
    const deletion = scenario.commandReplay.find((step) => step.phase === "delete");

    assert.equal(save.after.savedChoice.venue, scenario.candidateVenues[0]);
    assert.deepEqual(view.before, save.after);
    assert.deepEqual(view.after, view.before);
    assert.equal(change.after.savedChoice.venue, scenario.candidateVenues[1] || scenario.candidateVenues[0]);
    assert.equal(clear.after.savedChoice, null);
    assert.equal(stop.after.subscriptionState, "off_after_local_stop_replay");
    assert.equal(deletion.after.savedChoice, null);
    assert.equal(deletion.after.subscriptionState, "off_after_local_delete_replay");
    assert.equal(deletion.after.deletionState, "local_simulation_deleted");

    for (const step of scenario.commandReplay) {
      assert.equal(step.mode, "local_protocol_replay_only");
      assert.match(step.boundary, /does not call Telegram/);
      assert.equal(step.after.realUserDataTouched, false);
      assert.equal(step.after.telegramApiCalls, 0);
      assert.equal(step.after.telegramMessagesSent, 0);
    }
  }
});

test("Telegram protocol replay keeps invitation material and private outcomes out of evidence", () => {
  const result = runTelegramProtocolReplay({ generatedAt: "2026-09-28T00:00:00.000Z" });
  const markdown = renderTelegramProtocolReplayMarkdown(result);
  const serialized = `${JSON.stringify(result)}\n${markdown}`;

  assert.deepEqual(result.problems, []);
  assert.doesNotMatch(serialized, PROTECTED_INVITE_RE);
  assert.doesNotMatch(serialized, /commission payout|commission rate|registration:\s*true|kyc:\s*true|deposit:\s*true|firstTrade:\s*true/i);
  assert.match(markdown, /Telegram API calls: \*\*0\*\*/);
  assert.match(markdown, /Real user data touched: \*\*no\*\*/);
  assert.match(markdown, /Live \/stop unsubscribe behavior/);
  assert.match(markdown, /Live \/delete account-data deletion behavior/);
});

test("Telegram protocol replay writer emits local JSON and markdown evidence", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "telegram-protocol-replay-"));
  const jsonPath = path.join(tmp, "replay.json");
  const mdPath = path.join(tmp, "replay.md");

  const result = await writeTelegramProtocolReplay({
    output: jsonPath,
    markdown: mdPath,
    generatedAt: "2026-09-28T00:00:00.000Z",
  });
  const json = JSON.parse(await fs.readFile(jsonPath, "utf8"));
  const markdown = await fs.readFile(mdPath, "utf8");

  assert.equal(result.status, "PASS_LOCAL_PROTOCOL_REPLAY");
  assert.equal(json.status, "PASS_LOCAL_PROTOCOL_REPLAY");
  assert.equal(json.scenarios.length, TELEGRAM_WEEK1_RETENTION_LOOP.scenarioMatrix.length);
  assert.equal(markdown, renderTelegramProtocolReplayMarkdown(result));
});

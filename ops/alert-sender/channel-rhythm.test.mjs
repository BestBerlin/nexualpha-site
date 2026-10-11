import test from "node:test";
import assert from "node:assert/strict";
import { dueRhythmSlots, fundingOutliers, morningSnapshotMessage, runChannelRhythm, weeklyPollPayload } from "./channel-rhythm.mjs";
import { mk, partners } from "./fixtures/alert-fixture.mjs";

const market = {
  ...mk,
  funding: {
    rows: [
      { symbol: "BTC", binanceRate: 0.0001, okxRate: 0.0002 },
      { symbol: "DOGE", binanceRate: 0.0016, okxRate: 0.0009 },
      { symbol: "SOL", binanceRate: -0.0012, okxRate: null },
      { symbol: "XRP", binanceRate: null, okxRate: 0.0014 },
    ],
  },
};

test("morning snapshot builders cover zh/en/ru/tr/vi with prices, liquidations, funding outliers and disclosure", () => {
  const samples = {};
  for (const lang of ["zh", "en", "ru", "tr", "vi"]) {
    const msg = morningSnapshotMessage(market, lang, { disclosure: `<i>${lang} disclosure</i>` });
    samples[lang] = msg.text.split("\n").slice(0, 7).join("\n");
    assert.match(msg.text, /BTC/);
    assert.match(msg.text, /ETH/);
    assert.match(msg.text, /SOL/);
    assert.match(msg.text, /DOGE/);
    assert.match(msg.text, /24/);
    assert.match(msg.text, new RegExp(`${lang} disclosure`));
    assert.equal(msg.imageCard.kind, "morning-snapshot");
  }
  assert.match(samples.zh, /早间快照/);
  assert.match(samples.en, /morning snapshot/);
  assert.match(samples.ru, /Утренний обзор/);
  assert.match(samples.tr, /sabah özeti/);
  assert.match(samples.vi, /Bản tin sáng/);
});

test("funding outliers sort by largest absolute venue rate", () => {
  assert.deepEqual(fundingOutliers(market).map((r) => r.symbol), ["DOGE", "XRP", "SOL"]);
});

test("timezone slots fire at 08:00 local and Monday 12:00 local only", () => {
  assert.deepEqual(dueRhythmSlots(new Date("2026-10-12T00:15:00Z"), "zh").map((s) => s.kind), ["morning"]);
  assert.deepEqual(dueRhythmSlots(new Date("2026-10-12T08:15:00Z"), "en").map((s) => s.kind), ["morning"]);
  assert.deepEqual(dueRhythmSlots(new Date("2026-10-12T09:15:00Z"), "ru").map((s) => s.kind), ["weeklyPoll"]);
  assert.deepEqual(dueRhythmSlots(new Date("2026-10-12T12:15:00Z"), "en").map((s) => s.kind), ["weeklyPoll"]);
  assert.deepEqual(dueRhythmSlots(new Date("2026-10-13T12:15:00Z"), "en"), []);
});

test("weekly poll payloads are native non-anonymous polls", () => {
  const expected = {
    zh: ["上涨", "下跌", "横盘"],
    en: ["Up", "Down", "Sideways"],
    ru: ["Рост", "Снижение", "Боковик"],
    tr: ["Yukarı", "Aşağı", "Yatay"],
    vi: ["Tăng", "Giảm", "Đi ngang"],
  };
  for (const [lang, options] of Object.entries(expected)) {
    const poll = weeklyPollPayload(lang);
    assert.equal(poll.is_anonymous, false);
    assert.deepEqual(poll.options, options.map((text) => ({ text })));
  }
  assert.equal(weeklyPollPayload("en").question, "This week BTC: up / down / sideways");
});

test("runChannelRhythm saves successful chat slots immediately and retries only failures", async () => {
  let state = {};
  const saves = [];
  const sent = [];
  const save = async (s) => { state = structuredClone(s); saves.push(structuredClone(s.channelRhythm)); };
  await assert.rejects(runChannelRhythm({
    channels: [["en", "@en"], ["en", "@en2"]],
    state,
    now: new Date("2026-10-12T08:05:00Z"),
    market,
    partners,
    save,
    disclosureFor: () => "<i>d</i>",
    buttonsFor: () => [[{ text: "b", url: "https://nexualpha.com" }]],
    sendMessage: async (chat) => { if (chat === "@en2") throw new Error("blocked"); sent.push(chat); },
    sendPoll: async () => assert.fail("not poll time"),
  }), /@en2 morning: blocked/);
  assert.deepEqual(sent, ["@en"]);
  assert.equal(saves.length, 1);
  assert.equal(state.channelRhythm.morning["en:@en"], "2026-10-12:08");
  assert.equal(state.channelRhythm.morning["en:@en2"], undefined);

  await runChannelRhythm({
    channels: [["en", "@en"], ["en", "@en2"]],
    state,
    now: new Date("2026-10-12T08:10:00Z"),
    market,
    save,
    disclosureFor: () => "<i>d</i>",
    sendMessage: async (chat) => sent.push(chat),
    sendPoll: async () => assert.fail("not poll time"),
  });
  assert.deepEqual(sent, ["@en", "@en2"]);
  assert.equal(state.channelRhythm.morning["en:@en2"], "2026-10-12:08");
});

test("dry run does not write state or mark slots", async () => {
  const state = {};
  const sent = [];
  await runChannelRhythm({
    channels: [["en", "@en"]],
    state,
    now: new Date("2026-10-12T08:05:00Z"),
    market,
    dryRun: true,
    save: async () => assert.fail("dry run must not save"),
    sendMessage: async (chat) => sent.push(chat),
    sendPoll: async () => assert.fail("not poll time"),
  });
  assert.deepEqual(sent, ["@en"]);
  assert.deepEqual(state, {});
});

test("weekly poll uses sendPoll and marks the Monday noon slot", async () => {
  const state = {};
  const polls = [];
  const opts = {
    channels: [["en", "@en"]],
    state,
    now: new Date("2026-10-12T12:05:00Z"),
    market,
    save: async () => {},
    sendMessage: async () => assert.fail("not morning time"),
    sendPoll: async (chat, poll) => polls.push([chat, poll]),
  };
  await runChannelRhythm(opts);
  await runChannelRhythm(opts);
  assert.equal(polls[0][0], "@en");
  assert.equal(polls[0][1].is_anonymous, false);
  assert.deepEqual(polls[0][1].options, [{ text: "Up" }, { text: "Down" }, { text: "Sideways" }]);
  assert.equal(polls.length, 1);
  assert.equal(state.channelRhythm.weeklyPoll["en:@en"], "2026-10-12:12");
});

test("morning snapshot fails closed on missing required market metrics and corrupt rhythm maps", async () => {
  assert.throws(() => morningSnapshotMessage({ ...market, market: { majors: market.market.majors.slice(0, 2) } }, "en"), /SOLUSDT/);
  assert.throws(() => morningSnapshotMessage({ ...market, liquidations: { h24: { longUsd: 1 } } }, "en"), /liquidation/);
  await assert.rejects(runChannelRhythm({
    channels: [["en", "@en"]],
    state: { channelRhythm: { morning: [] } },
    now: new Date("2026-10-12T08:05:00Z"),
    market,
    save: async () => assert.fail("corrupt state must not save"),
    sendMessage: async () => assert.fail("corrupt state must not send"),
    sendPoll: async () => assert.fail("corrupt state must not poll"),
  }), /state maps are corrupt/);
  await assert.rejects(runChannelRhythm({
    channels: [["en", "@en"]],
    state: null,
    now: new Date("2026-10-12T08:05:00Z"),
    market,
    save: async () => assert.fail("corrupt root must not save"),
    sendMessage: async () => assert.fail("corrupt root must not send"),
    sendPoll: async () => assert.fail("corrupt root must not poll"),
  }), /state root is corrupt/);
  await assert.rejects(runChannelRhythm({
    channels: [["en", "@en"]],
    state: { channelRhythm: { morning: { "en:@en": true }, weeklyPoll: {} } },
    now: new Date("2026-10-12T08:05:00Z"),
    market,
    save: async () => assert.fail("corrupt record must not save"),
    sendMessage: async () => assert.fail("corrupt record must not send"),
    sendPoll: async () => assert.fail("corrupt record must not poll"),
  }), /morning record is corrupt/);
});

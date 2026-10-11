import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  GUIDE_LANGS,
  LOCK_FILE,
  buildGuideMessage,
  guidePreview,
  parseChatTargets,
  readState,
  runPinGuide,
} from "./pin-guide.mjs";

const env = {
  COMMUNITY_BOT_TOKEN: "token",
  CHANNEL_FEED_TARGETS: "zh:@NexuAlphaClub,en:@NexuAlphaGlobal",
  ALERT_CHANNELS: "ru:@NexuAlphaRU,tr:-100111,vi:@NexuAlphaVI",
};

const callsFetch = (responses) => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    const next = responses.shift() || { ok: true, result: true };
    return { status: next.status || 200, json: async () => next };
  };
  fetchImpl.calls = calls;
  return fetchImpl;
};

test("guide messages are localized, disclosed, and route exchange links through comparison pages", () => {
  for (const lang of GUIDE_LANGS) {
    const text = buildGuideMessage(lang);
    assert.match(text, /<b>.+<\/b>/, `${lang} has a title`);
    assert.match(text, /NexuAlpha/, `${lang} names NexuAlpha`);
    assert.doesNotMatch(text, /\/go\/|[?&]ref=|inviteCode|NEXUALPHA[0-9]/i, `${lang} has no hardcoded referral route or code`);
    assert.match(text, new RegExp(`https://nexualpha\\.com${lang === "zh" ? "/zh-hans" : lang === "en" ? "" : `/${lang}`}/exchanges/okx\\?src=tg-guide-${lang}`));
    assert.match(text, /<i>.*<\/i>$/s, `${lang} ends with listing disclosure`);
  }
  assert.match(buildGuideMessage("en"), /invite code is an exchange attribution method/);
  assert.match(buildGuideMessage("zh"), /邀请码只是交易所注册归因方式/);
  assert.match(buildGuideMessage("ru"), /инвайт-коды/);
  assert.match(buildGuideMessage("tr"), /Davet kodları/);
  assert.match(buildGuideMessage("vi"), /Mã mời/);
});

test("parseChatTargets accepts CHANNEL_FEED_TARGETS first and fills from ALERT_CHANNELS", () => {
  assert.deepEqual(parseChatTargets(env.CHANNEL_FEED_TARGETS, env.ALERT_CHANNELS), {
    zh: "@NexuAlphaClub",
    en: "@NexuAlphaGlobal",
    ru: "@NexuAlphaRU",
    tr: "-100111",
    vi: "@NexuAlphaVI",
  });
  assert.deepEqual(parseChatTargets("xx:@bad,zh:,en:@A", "en:@B,vi:@V"), { en: "@A", vi: "@V" });
});

test("dry-run prints without network or state mutation", async () => {
  const stateDir = mkdtempSync(path.join(os.tmpdir(), "pin-guide-dry-"));
  const logs = [];
  let called = false;
  const result = await runPinGuide({
    lang: "en",
    dryRun: true,
    env,
    stateDir,
    logger: { log: (msg) => logs.push(msg) },
    fetchImpl: async () => { called = true; throw new Error("network should not be used"); },
  });
  assert.equal(result.dryRun, true);
  assert.equal(called, false);
  assert.match(logs.join("\n"), /\[pin-guide\] dry-run lang=en chat=@NexuAlphaGlobal/);
  assert.equal(logs[0], guidePreview("en", "@NexuAlphaGlobal"));
  assert.equal(existsSync(path.join(stateDir, "pinned-guides.json")), false);
  assert.equal(existsSync(path.join(stateDir, LOCK_FILE)), false);
  rmSync(stateDir, { recursive: true, force: true });
});

test("send success followed by pin failure stores message id so the retry pins without reposting", async () => {
  const stateDir = mkdtempSync(path.join(os.tmpdir(), "pin-guide-retry-"));
  const stateFile = path.join(stateDir, "pinned-guides.json");
  const firstFetch = callsFetch([
    { ok: true, result: { message_id: 42 } },
    { ok: false, error_code: 400, description: "pin failed" },
  ]);

  await assert.rejects(
    runPinGuide({ lang: "zh", env, stateDir, fetchImpl: firstFetch, logger: { log() {} }, now: new Date("2026-10-12T00:00:00Z") }),
    /pinChatMessage: 400 pin failed/,
  );
  assert.deepEqual(firstFetch.calls.map((c) => c.url.split("/").pop()), ["sendMessage", "pinChatMessage"]);
  let state = JSON.parse(readFileSync(stateFile, "utf8"));
  assert.equal(state.guides["zh:@NexuAlphaClub"].messageId, 42);
  assert.equal(state.guides["zh:@NexuAlphaClub"].pinnedAt, null);

  const secondFetch = callsFetch([{ ok: true, result: true }]);
  await runPinGuide({ lang: "zh", env, stateDir, fetchImpl: secondFetch, logger: { log() {} }, now: new Date("2026-10-12T00:05:00Z") });
  assert.deepEqual(secondFetch.calls.map((c) => c.url.split("/").pop()), ["pinChatMessage"]);
  assert.deepEqual(secondFetch.calls[0].body, { chat_id: "@NexuAlphaClub", message_id: 42, disable_notification: true });
  state = JSON.parse(readFileSync(stateFile, "utf8"));
  assert.equal(state.guides["zh:@NexuAlphaClub"].pinnedAt, "2026-10-12T00:05:00.000Z");
  rmSync(stateDir, { recursive: true, force: true });
});

test("corrupt state fails closed before Telegram calls or writes", async () => {
  const stateDir = mkdtempSync(path.join(os.tmpdir(), "pin-guide-corrupt-"));
  const stateFile = path.join(stateDir, "pinned-guides.json");
  writeFileSync(stateFile, "{bad json");
  let called = false;
  await assert.rejects(
    runPinGuide({
      lang: "vi",
      env,
      stateDir,
      logger: { log() {} },
      fetchImpl: async () => { called = true; return { json: async () => ({ ok: true }) }; },
    }),
    /refusing to use corrupt guide state/,
  );
  assert.equal(called, false);
  assert.equal(readFileSync(stateFile, "utf8"), "{bad json");
  assert.equal(existsSync(path.join(stateDir, LOCK_FILE)), false);
  rmSync(stateDir, { recursive: true, force: true });
});

test("API send failures are not recorded as posted", async () => {
  const stateDir = mkdtempSync(path.join(os.tmpdir(), "pin-guide-send-fail-"));
  const fetchImpl = callsFetch([{ ok: false, error_code: 403, description: "bot was blocked" }]);
  await assert.rejects(
    runPinGuide({ lang: "ru", env, stateDir, fetchImpl, logger: { log() {} } }),
    /sendMessage: 403 bot was blocked/,
  );
  assert.equal(existsSync(path.join(stateDir, "pinned-guides.json")), false);
  assert.equal(existsSync(path.join(stateDir, LOCK_FILE)), false);
  rmSync(stateDir, { recursive: true, force: true });
});

test("token can come from BOT_ENV_FILE or CHANNEL_FEED_ENV", async () => {
  const stateDir = mkdtempSync(path.join(os.tmpdir(), "pin-guide-env-token-"));
  const botEnvFile = path.join(stateDir, "bot.env");
  writeFileSync(botEnvFile, "COMMUNITY_BOT_TOKEN=from-bot-env\n");
  const firstFetch = callsFetch([{ ok: true, result: { message_id: 7 } }, { ok: true, result: true }]);
  await runPinGuide({
    lang: "vi",
    env: { ALERT_CHANNELS: "vi:@NexuAlphaVI", BOT_ENV_FILE: botEnvFile },
    stateDir,
    fetchImpl: firstFetch,
    logger: { log() {} },
  });
  assert.match(firstFetch.calls[0].url, /botfrom-bot-env\/sendMessage$/);

  const stateDir2 = mkdtempSync(path.join(os.tmpdir(), "pin-guide-channel-env-token-"));
  const channelEnvFile = path.join(stateDir2, "channel.env");
  writeFileSync(channelEnvFile, "COMMUNITY_BOT_TOKEN=\"from-channel-env\"\n");
  const secondFetch = callsFetch([{ ok: true, result: { message_id: 8 } }, { ok: true, result: true }]);
  await runPinGuide({
    lang: "ru",
    env: { ALERT_CHANNELS: "ru:@NexuAlphaRU", CHANNEL_FEED_ENV: channelEnvFile },
    stateDir: stateDir2,
    fetchImpl: secondFetch,
    logger: { log() {} },
  });
  assert.match(secondFetch.calls[0].url, /botfrom-channel-env\/sendMessage$/);

  rmSync(stateDir, { recursive: true, force: true });
  rmSync(stateDir2, { recursive: true, force: true });
});

test("missing chat and missing token fail before Telegram network calls", async () => {
  let called = false;
  await assert.rejects(
    runPinGuide({ lang: "tr", env: { COMMUNITY_BOT_TOKEN: "token", CHANNEL_FEED_TARGETS: "en:@Only" }, fetchImpl: async () => { called = true; } }),
    /no Telegram chat configured for tr/,
  );
  assert.equal(called, false);

  await assert.rejects(
    runPinGuide({ lang: "en", env: { CHANNEL_FEED_TARGETS: "en:@Only" }, fetchImpl: async () => { called = true; } }),
    /COMMUNITY_BOT_TOKEN missing/,
  );
  assert.equal(called, false);
});

test("existing lock fails before reading state or calling Telegram", async () => {
  const stateDir = mkdtempSync(path.join(os.tmpdir(), "pin-guide-lock-"));
  writeFileSync(path.join(stateDir, LOCK_FILE), "123\n2026-10-12T00:00:00Z\n");
  let called = false;
  await assert.rejects(
    runPinGuide({ lang: "en", env, stateDir, fetchImpl: async () => { called = true; } }),
    /pin guide is already running; remove stale lock after manual verification/,
  );
  assert.equal(called, false);
  assert.match(readFileSync(path.join(stateDir, LOCK_FILE), "utf8"), /^123\n/);
  rmSync(stateDir, { recursive: true, force: true });
});

test("invalid existing records fail closed instead of reposting", async () => {
  const stateDir = mkdtempSync(path.join(os.tmpdir(), "pin-guide-bad-record-"));
  writeFileSync(path.join(stateDir, "pinned-guides.json"), JSON.stringify({
    guides: { "en:@NexuAlphaGlobal": { lang: "en", chat: "@NexuAlphaGlobal", messageId: null, pinnedAt: null } },
  }));
  let called = false;
  await assert.rejects(
    runPinGuide({ lang: "en", env, stateDir, fetchImpl: async () => { called = true; } }),
    /invalid messageId/,
  );
  assert.equal(called, false);
  rmSync(stateDir, { recursive: true, force: true });
});

test("already pinned records are a local no-op", async () => {
  const stateDir = mkdtempSync(path.join(os.tmpdir(), "pin-guide-already-"));
  writeFileSync(path.join(stateDir, "pinned-guides.json"), JSON.stringify({
    guides: {
      "en:@NexuAlphaGlobal": {
        lang: "en",
        chat: "@NexuAlphaGlobal",
        messageId: 9,
        postedAt: "2026-10-12T00:00:00.000Z",
        pinnedAt: "2026-10-12T00:01:00.000Z",
      },
    },
  }));
  let called = false;
  const logs = [];
  const result = await runPinGuide({
    lang: "en",
    env,
    stateDir,
    fetchImpl: async () => { called = true; },
    logger: { log: (msg) => logs.push(msg) },
  });
  assert.equal(called, false);
  assert.equal(result.messageId, 9);
  assert.match(logs[0], /already pinned en @NexuAlphaGlobal message_id=9/);
  assert.equal(existsSync(path.join(stateDir, LOCK_FILE)), false);
  rmSync(stateDir, { recursive: true, force: true });
});

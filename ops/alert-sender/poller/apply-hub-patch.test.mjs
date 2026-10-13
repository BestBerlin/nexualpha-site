import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { applyPollerPatch, SRC_DIR } from "./apply-poller-patch.mjs";
import { applyStartPatch } from "./apply-start-patch.mjs";
import { applyNeutralPatch, SERVICE } from "./apply-neutral-patch.mjs";
import { applyHubPatch, patchHubText, PATCHES } from "./apply-hub-patch.mjs";
import { menuLanguage, rememberStartLanguage, recalledStartLanguage } from "../bot-menu.mjs";
import { startMenu, isNeutralCtaLocale, langFromCode } from "../site-features.mjs";

function release() {
  const dir = mkdtempSync(path.join(tmpdir(), "nx-hub-"));
  writeFileSync(path.join(dir, "package.json"), '{"type":"module"}');
  for (const [from, to] of Object.entries({ "mock-community-service.js": SERVICE, "alert-subscriptions.js": `${SRC_DIR}/alert-subscriptions.js`, "contracts-telegram.js": "dist/packages/contracts/src/telegram.js", "update-decoder.js": "dist/packages/telegram/src/update-decoder.js" })) {
    mkdirSync(path.dirname(path.join(dir, to)), { recursive: true });
    cpSync(new URL(`../fixtures/poller/${from}`, import.meta.url), path.join(dir, to));
  }
  applyPollerPatch(dir); applyStartPatch(dir); applyNeutralPatch(dir);
  return dir;
}

test("hub patch backs up, parses, is idempotent and refuses broken anchors before writing", () => {
  const dir = release(), file = path.join(dir, SERVICE), before = readFileSync(file, "utf8");
  const result = applyHubPatch(dir);
  assert.equal(readFileSync(result.backup, "utf8"), before);
  const after = readFileSync(file, "utf8");
  execFileSync(process.execPath, ["--check", file]);
  execFileSync(process.execPath, ["--check", path.join(dir, SRC_DIR, "bot-menu.js")]);
  assert.equal(applyHubPatch(dir).status, "already");
  assert.equal(readFileSync(file, "utf8"), after);
  for (const [, anchor] of PATCHES) assert.throws(() => patchHubText(before.replace(anchor, "")), /anchor check failed/);
  assert.throws(() => patchHubText(after.replace(PATCHES[0][2], "// nx-hub-menu v1\n")), /patches are missing/);
  assert.throws(() => patchHubText("unpatched"), /apply-neutral-patch/);
});

test("start language persists across reads without enabling topics; deletion clears it", () => {
  const file = path.join(mkdtempSync(path.join(tmpdir(), "nx-hub-state-")), "subs.json");
  writeFileSync(file, JSON.stringify({ version: 1, users: { "1": { lang: "en", topics: ["moves"], createdAt: "kept" } } }));
  rememberStartLanguage(1, "vi", file);
  assert.equal(recalledStartLanguage(1, file), "vi");
  assert.deepEqual(JSON.parse(readFileSync(file)).users["1"], { lang: "en", topics: ["moves"], createdAt: "kept", nxStartLanguage: "vi" });
  rememberStartLanguage(2, "ru", file);
  assert.deepEqual(JSON.parse(readFileSync(file)).users["2"].topics, []);
  rememberStartLanguage(1, null, file);
  assert.equal(recalledStartLanguage(1, file), null);
  assert.deepEqual(JSON.parse(readFileSync(file)).users["1"].topics, ["moves"]);
});

test("registration intent uses any neutral chosen/start/UI language, otherwise English fallback", () => {
  for (const lang of ["ru", "vi", "ar", "zh-Hant", "ur", "uk"]) {
    assert.equal(menuLanguage("signup", undefined, lang, null, "en"), lang);
    assert.equal(menuLanguage("signup", undefined, "en", lang, "en"), lang);
    assert.equal(menuLanguage("signup", undefined, null, null, lang), lang);
  }
  assert.equal(menuLanguage("signup", undefined, null, null, "en"), "en");
  assert.equal(menuLanguage("hub", undefined, "es", "pt-BR", "en"), "es");
});

// Execute the actual generated response guard, including registration fallback and hub routing.
test("generated guard localizes hub and blocks English signup text/commands/callbacks for neutral context", () => {
  const dir = release(); applyHubPatch(dir);
  const source = readFileSync(path.join(dir, SERVICE), "utf8");
  const guard = source.slice(source.indexOf("        // nx-neutral-cta: information-only languages"), source.indexOf("        if (response && (event.isPrivateChat || groupReplyCommands.has(parsed.command)))"));
  const run = new Function("event", "parsed", "nxStartLang", "storedLangFor", "recalledStartLanguage", "menuLanguage", "startMenu", "isNeutralCtaLocale", "langFromCode", "navigationButton", "response", `const nxNeutralSignupText = undefined;\n${guard}\nreturn response;`);
  const card = { text: "REGISTRY CARD", replyMarkup: { inlineKeyboard: [[{ text: "Sign up", callbackData: "nav:signup" }]] } };
  const invoke = (command, lang, stored = null, remembered = null) => run({ userId: 1, languageCode: lang, isPrivateChat: true }, { command }, undefined, () => stored, () => remembered, menuLanguage, startMenu, isNeutralCtaLocale, langFromCode, (text, target) => ({ text, callbackData: `nav:${target}` }), card);
  for (const lang of ["en", "zh-Hans", "ru", "tr", "vi", "es", "pt-BR", "id", "unknown", "ar", "zh-Hant", "ur", "uk"]) {
    const hub = invoke("hub", lang);
    assert.equal(hub.text, startMenu(lang).text);
    assert.ok(hub.replyMarkup.inlineKeyboard.flat().some((b) => b.callbackData === "nav:alerts"));
    assert.equal(hub.replyMarkup.inlineKeyboard.flat().some((b) => b.callbackData === "nav:signup"), !isNeutralCtaLocale(lang));
  }
  for (const lang of ["ru", "vi", "ar", "zh-Hant", "ur", "uk"]) {
    for (const [stored, remembered] of [[lang, null], [null, lang], ["en", lang]]) {
      const reply = invoke("signup", "en", stored, remembered);
      assert.equal(reply.text, startMenu(lang).text);
      assert.doesNotMatch(JSON.stringify(reply), /nav:signup|\/go\/|nexu888|11350287|C6PRAF|48553|7f97gkqw/);
    }
  }
  assert.equal(invoke("signup", "en"), card, "promotable English card remains registry-owned");
});

test("patched event handler remembers neutral start links for later sign up/register and callbacks", async () => {
  const dir = release(); applyHubPatch(dir);
  const source = readFileSync(path.join(dir, SERVICE), "utf8");
  const handler = source.slice(source.indexOf("export async function handleMockCommunityEvent"), source.indexOf("export async function handleMockInlineQueryEvent")).replace("export ", "");
  const file = path.join(dir, "subscriptions.json");
  let stored = null;
  const card = { text: "REGISTRY CARD", replyMarkup: { inlineKeyboard: [[{ text: "Sign up", callbackData: "nav:signup" }]] } };
  const dependencies = {
    emptyShadowObservationSummary: () => ({}), unavailableRitualReadiness: {},
    updateDeliveryTracker: () => ({ track: (fn) => fn(), markFailed: () => {} }),
    privateStopCommand: () => undefined,
    parseCommand: (text) => { const m = /^\/(\w+)(?:\s+(.+))?$/.exec(text); return m ? { command: m[1], argument: m[2] } : undefined; },
    isSignupIntent: (text) => /^(sign up|register)$/i.test(text),
    isEntryRoute: () => false, groupReplyCommands: new Set(),
    responseFor: () => card,
    storedLangFor: () => stored,
    rememberStartLanguage: (uid, lang) => rememberStartLanguage(uid, lang, file),
    recalledStartLanguage: (uid) => recalledStartLanguage(uid, file),
    menuLanguage, startMenu, isNeutralCtaLocale, langFromCode,
    navigationButton: (text, target) => ({ text, callbackData: `nav:${target}` }),
    toOutboundMessage: (_event, response) => response,
  };
  const handle = new Function(...Object.keys(dependencies), `${handler}\nreturn handleMockCommunityEvent;`)(...Object.values(dependencies));
  let sent;
  const adapter = { accept: () => true, markStarted: () => {}, send: (reply) => { sent = reply; } };
  const send = async (text, userId = 1, extra = {}) => {
    sent = null;
    await handle(adapter, { text, userId, languageCode: "en", isPrivateChat: true, ...extra });
    return sent;
  };
  for (const lang of ["ru", "vi", "ar", "zh-Hant", "ur", "uk"]) {
    await send(`/start ${lang}`);
    assert.equal(isNeutralCtaLocale(recalledStartLanguage(1, file)), true);
    for (const text of ["sign up", "register", "/signup", "/start signup"]) {
      assert.equal((await send(text)).text, startMenu(lang).text, `${lang}: ${text}`);
    }
    assert.equal((await send("/signup", 1, { callbackQueryId: "callback" })).text, startMenu(lang).text);
    assert.equal((await send("/hub")).text, startMenu(lang).text);
  }
  assert.equal((await send("register", 99)).text, card.text);
  for (const lang of ["ru", "vi"]) {
    stored = lang;
    assert.equal((await send("register", 99)).text, startMenu(lang).text);
  }
  stored = null;
  for (const lang of ["en", "zh-Hans", "tr", "es", "pt-BR", "id"]) {
    assert.equal((await send(`/start ${lang}`)).text, startMenu(lang).text);
    assert.equal((await send("sign up")).text, card.text);
  }
});

test("unreadable language context fails closed instead of exposing the registration card", () => {
  const dir = release(); applyHubPatch(dir);
  const source = readFileSync(path.join(dir, SERVICE), "utf8");
  const guard = source.slice(source.indexOf("        // nx-neutral-cta: information-only languages"), source.indexOf("        if (response && (event.isPrivateChat || groupReplyCommands.has(parsed.command)))"));
  const run = new Function("startMenu", "menuLanguage", "isNeutralCtaLocale", "navigationButton", `
    const event = { userId: 1, languageCode: "en", isPrivateChat: true };
    const parsed = { command: "signup" }, nxStartLang = undefined, nxNeutralSignupText = undefined;
    const storedLangFor = () => null;
    const recalledStartLanguage = () => { throw new Error("unreadable context"); };
    const console = { warn() {} };
    let response = { text: "REGISTRY CARD" };
    ${guard}
    return response;
  `);
  const reply = run(startMenu, menuLanguage, isNeutralCtaLocale, (text, target) => ({ text, callbackData: `nav:${target}` }));
  assert.equal(reply.text, startMenu("ar").text);
  assert.doesNotMatch(JSON.stringify(reply), /REGISTRY CARD|nav:signup|\/go\//);
});

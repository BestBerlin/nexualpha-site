#!/usr/bin/env node
// Start-menu patch v2: information-only ("neutral") languages in the compiled bot-community poller (owner 2026-10-13,
// vi added for Vietnam Resolution 05/2025/NQ-CP). Run after apply-poller-patch.mjs and apply-start-patch.mjs:
//   node apply-neutral-patch.mjs <releaseDir>
// For a member whose language is neutral (NEUTRAL_CTA_LOCALE_LIST in ../site-features.mjs: ru, ar, zh-Hant, ur, uk, vi;
// language = /start?start=<lang> deep link, then the /alerts language, then Telegram's UI language):
//   1. the /start menu has no ⚙️ /hub button (the old Chinese hub leads with the sign-up / invite-code card);
//   2. a sign-up request — /signup, ?start=signup, the hub's 🎁 button or a "sign up"/"đăng ký"/"注册" text — answers
//      with the localized tools menu instead of the sign-up / invite-code card;
//   3. any other reply drops sign-up buttons (nav:signup, 注册交易所/邀请码) and /go/ partner links from its keyboard.
// Copies ../site-features.mjs to dist/apps/bot-community/src/site-features.js (it exports isNeutralCtaLocale).
// Same contract as apply-start-patch.mjs: every anchor must appear exactly once or nothing is written, an already
// patched file is left untouched, and the original is kept as <file>.bak-<timestamp> before the first write.
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { SRC_DIR } from "./apply-poller-patch.mjs";
import { MARKER as START_MARKER } from "./apply-start-patch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CANONICAL_VENUE_PRIORITY = path.join(HERE, "..", "..", "..", "pilot-01-prototype", "src", "data", "venue-priority.js");
const SITE_FEATURES_PRIORITY_IMPORT = 'from "../../pilot-01-prototype/src/data/venue-priority.js"';
const RELEASE_PRIORITY_IMPORT = 'from "./venue-priority.js"';
export const MARKER = "// nx-neutral-cta v1";
const I8 = " ".repeat(8), I12 = " ".repeat(12), I16 = " ".repeat(16), I20 = " ".repeat(20);
const warn = (event) => `console.warn(JSON.stringify({ service: "telegram-community-bot", event: "${event}", errorName: error instanceof Error ? error.name : "UnknownError" }));`;

// Sign-up words in the neutral languages themselves (Telegram text, max 40 chars like isSignupIntent).
const NEUTRAL_SIGNUP_WORDS = "đăng ký|đăng kí|dang ky|mã mời|mã giới thiệu|регистр|зарегистр|реферал|التسجيل|سجل|реєстр|رجسٹر";
// [name, anchor, replacement]; every replacement carries MARKER so a re-run can verify a complete patch.
export const PATCHES = [
  ["signup-intent",
    `${I8}const rawParsed = stopParsed ?? parseCommand(event.text) ?? (event.isPrivateChat && isSignupIntent(event.text) ? { command: "signup", argument: undefined } : undefined);\n`,
    `${I8}// nx-neutral-cta: sign-up words in a neutral language count as a sign-up request (answered with the tools menu). ${MARKER}\n`
    + `${I8}const nxNeutralSignupText = event.isPrivateChat && /^.{1,40}$/su.test(String(event.text ?? "").trim()) && /(${NEUTRAL_SIGNUP_WORDS})/iu.test(String(event.text ?? "")) ? (/[а-яіїєґ]/iu.test(String(event.text)) ? "ru" : /[\\u0600-\\u06ff]/u.test(String(event.text)) ? "ar" : "vi") : undefined;\n`
    + `${I8}const rawParsed = stopParsed ?? parseCommand(event.text) ?? (event.isPrivateChat && (isSignupIntent(event.text) || nxNeutralSignupText !== undefined) ? { command: "signup", argument: undefined } : undefined);\n`],
  ["import",
    `import { langFromCode, startMenu } from "./site-features.js"; import { storedLangFor } from "./alert-triggers.js"; ${START_MARKER}\n`,
    `import { langFromCode, startMenu } from "./site-features.js"; import { storedLangFor } from "./alert-triggers.js"; ${START_MARKER}\n`
    + `import { isNeutralCtaLocale } from "./site-features.js"; ${MARKER}\n`],
  ["start-menu-hub",
    `${I16}const menu = startMenu(nxStartLang ?? nxStored ?? langFromCode(event.languageCode) ?? "en");\n`
    + `${I16}response = { text: menu.text, replyMarkup: { inlineKeyboard: [...menu.rows, [navigationButton("🔔 /alerts", "alerts"), navigationButton("⚙️ /hub", "hub")]] } };\n`,
    `${I16}const nxMenuLang = nxStartLang ?? nxStored ?? (isNeutralCtaLocale(event.languageCode) ? event.languageCode : langFromCode(event.languageCode)) ?? "en";\n`
    + `${I16}const menu = startMenu(nxMenuLang);\n`
    + `${I16}// nx-neutral-cta: no /hub button for information-only languages (the hub leads with the sign-up card). ${MARKER}\n`
    + `${I16}response = { text: menu.text, replyMarkup: { inlineKeyboard: [...menu.rows, isNeutralCtaLocale(nxMenuLang) ? [navigationButton("🔔 /alerts", "alerts")] : [navigationButton("🔔 /alerts", "alerts"), navigationButton("⚙️ /hub", "hub")]] } };\n`],
  ["neutral-guard",
    `${I8}if (response && (event.isPrivateChat || groupReplyCommands.has(parsed.command))) {\n`,
    [
      `${I8}// nx-neutral-cta: information-only languages (ru, vi, ...) never get the sign-up / invite-code card. ${MARKER}`,
      `${I8}if (response) {`,
      `${I12}try {`,
      `${I16}let nxLang = null;`,
      `${I16}try { nxLang = storedLangFor(event.userId); } catch { nxLang = null; }`,
      `${I16}nxLang = nxStartLang ?? nxLang ?? (isNeutralCtaLocale(event.languageCode) ? event.languageCode : langFromCode(event.languageCode));`,
      `${I16}if (parsed.command === "signup" && nxNeutralSignupText !== undefined && !(nxLang && isNeutralCtaLocale(nxLang))) nxLang = nxNeutralSignupText;`,
      `${I16}if (nxLang && isNeutralCtaLocale(nxLang)) {`,
      `${I20}if (parsed.command === "signup") {`,
      `${I20}    const menu = startMenu(nxLang);`,
      `${I20}    response = { text: menu.text, replyMarkup: { inlineKeyboard: [...menu.rows, [navigationButton("🔔 /alerts", "alerts")]] } };`,
      `${I20}}`,
      `${I20}else if (Array.isArray(response.replyMarkup?.inlineKeyboard)) {`,
      `${I20}    const nxSignup = (b) => b?.callbackData === "nav:signup" || /注册交易所|邀请码|邀請碼/.test(String(b?.text ?? "")) || /\\/go\\//.test(String(b?.url ?? ""));`,
      `${I20}    response = { ...response, replyMarkup: { ...response.replyMarkup, inlineKeyboard: response.replyMarkup.inlineKeyboard.map((row) => row.filter((b) => !nxSignup(b))).filter((row) => row.length) } };`,
      `${I20}}`,
      `${I16}}`,
      `${I12}}`,
      `${I12}catch (error) {`,
      `${I16}${warn("neutral_cta_failed")}`,
      `${I12}}`,
      `${I8}}`,
      `${I8}if (response && (event.isPrivateChat || groupReplyCommands.has(parsed.command))) {`,
      "",
    ].join("\n")],
];
export const SERVICE = path.join(SRC_DIR, "mock-community-service.js");

/** Pure: {status: "patched"|"already", text}; throws when an anchor is missing/ambiguous or v1 is not applied. */
const count = (s, sub) => s.split(sub).length - 1;
export function patchNeutralText(src) {
  if (src.includes(MARKER)) {
    const missing = PATCHES.filter(([, , replacement]) => !src.includes(replacement)).map(([name]) => name);
    if (missing.length) throw new Error(`file carries ${MARKER} but these patches are missing: ${missing.join(", ")}`);
    return { status: "already", text: src };
  }
  if (!src.includes(START_MARKER)) throw new Error(`run apply-start-patch.mjs first (missing ${START_MARKER})`);
  const problems = PATCHES.filter(([, anchor]) => count(src, anchor) !== 1).map(([name, anchor]) => `${name} (found ${count(src, anchor)}x): ${anchor.trim().slice(0, 80)}`);
  if (problems.length) throw new Error(`anchor check failed, nothing changed:\n  ${problems.join("\n  ")}`);
  let text = src;
  for (const [, anchor, replacement] of PATCHES) text = text.replace(anchor, () => replacement);
  return { status: "patched", text };
}

export function applyNeutralPatch(releaseDir, { now = new Date(), featuresSource = path.join(HERE, "..", "site-features.mjs") } = {}) {
  const file = path.join(releaseDir, SERVICE);
  if (!existsSync(file)) throw new Error(`not a bot-community release (missing ${file})`);
  const plan = patchNeutralText(readFileSync(file, "utf8"));
  const helper = path.join(releaseDir, SRC_DIR, "site-features.js");
  const helperSrc = readFileSync(featuresSource, "utf8").replace(SITE_FEATURES_PRIORITY_IMPORT, RELEASE_PRIORITY_IMPORT);
  const priorityHelper = path.join(releaseDir, SRC_DIR, "venue-priority.js");
  const priorityHelperSrc = readFileSync(CANONICAL_VENUE_PRIORITY, "utf8");
  if (!helperSrc.includes("export const isNeutralCtaLocale")) throw new Error(`${featuresSource} does not export isNeutralCtaLocale`);
  const helperChanged = !existsSync(helper) || readFileSync(helper, "utf8") !== helperSrc;
  const priorityHelperChanged = !existsSync(priorityHelper) || readFileSync(priorityHelper, "utf8") !== priorityHelperSrc;
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  let helperBackup = null;
  if (helperChanged) {
    if (existsSync(helper)) { helperBackup = `${helper}.bak-${stamp}`; copyFileSync(helper, helperBackup); }
    writeFileSync(helper, helperSrc);
  }
  if (priorityHelperChanged) writeFileSync(priorityHelper, priorityHelperSrc);
  let backup = null;
  if (plan.status === "patched") {
    backup = `${file}.bak-${stamp}`;
    copyFileSync(file, backup);
    writeFileSync(file, plan.text);
  }
  return { file, status: plan.status, backup, helper, helperChanged, helperBackup, priorityHelper, priorityHelperChanged };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const releaseDir = process.argv[2];
  if (!releaseDir) { console.error("usage: node apply-neutral-patch.mjs <releaseDir>"); process.exit(2); }
  try {
    const r = applyNeutralPatch(path.resolve(releaseDir));
    console.log(r.status === "patched" ? `patched ${r.file} (backup ${r.backup})` : `already patched: ${r.file}`);
    console.log(r.helperChanged ? `wrote ${r.helper}${r.helperBackup ? ` (backup ${r.helperBackup})` : ""}` : `unchanged ${r.helper}`);
  } catch (error) {
    console.error(`apply-neutral-patch: ${error.message}`);
    process.exit(1);
  }
}

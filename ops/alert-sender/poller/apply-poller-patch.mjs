#!/usr/bin/env node
// Adds custom /alert rules to the compiled bot-community poller release (owner 2026-10-13).
//   node apply-poller-patch.mjs <releaseDir>
// Copies ../alert-triggers.mjs to dist/apps/bot-community/src/alert-triggers.js and patches mock-community-service.js:
//   a. import the alert-triggers helpers;
//   b. "/alert <rule>" in a private chat (not /alerts) is answered before the normal command routing;
//   c. the /alerts card lists the member's custom rules plus a one-line hint;
//   d. /stop (and the private "stop"/停止/退订 words) also clears custom rules and every /alerts topic.
// Every anchor must appear exactly once or nothing is written. Already-patched files are left untouched (idempotent),
// and the original is kept as <file>.bak-<timestamp> before the first write.
import { copyFileSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const MARKER = "// nx-alert-triggers v1";
export const SRC_DIR = "dist/apps/bot-community/src";

const I12 = " ".repeat(12), I8 = " ".repeat(8), I16 = " ".repeat(16);
const warn = (event) => `console.warn(JSON.stringify({ service: "telegram-community-bot", event: "${event}", errorName: error instanceof Error ? error.name : "UnknownError" }));`;

// [name, anchor, replacement]. Anchors are copied verbatim from the current compiled release.
export const PATCHES = [
  ["import",
    'import { alertsMarkup, alertsText, handleAlertsCommand } from "./alert-subscriptions.js";\n',
    'import { alertsMarkup, alertsText, handleAlertsCommand } from "./alert-subscriptions.js";\n'
    + `import { alertCardSuffix, alertErrorText, alertLangFor, clearUserTriggers, handleAlertCommand, stopAllText } from "./alert-triggers.js"; ${MARKER}\n`],
  ["alert-command",
    `${I8}const stopParsed = privateStopCommand(event);\n`,
    [
      `${I8}// nx-alert-triggers: "/alert <rule>" (custom price/move/liquidation/funding/listing alerts), private chat only.`,
      `${I8}// "/alert" must be followed by @bot, whitespace or the end, so "/alerts" keeps its own route.`,
      `${I8}const customAlert = event.isPrivateChat ? /^\\/alert(?:@\\w+)?(?:\\s+([\\s\\S]*))?$/i.exec(String(event.text ?? "").trim()) : null;`,
      `${I8}if (customAlert) {`,
      `${I12}let text;`,
      `${I12}try {`,
      `${I16}text = handleAlertCommand(event.userId, customAlert[1], { lang: alertLangFor(event.userId) }).text;`,
      `${I12}}`,
      `${I12}catch (error) {`,
      `${I16}${warn("custom_alert_failed")}`,
      `${I16}text = alertErrorText(alertLangFor(event.userId));`,
      `${I12}}`,
      `${I12}await updateDelivery.track(() => adapter.send(toOutboundMessage(event, { text }, "alerts")));`,
      `${I12}const customAlertCallbackId = event.callbackQueryId;`,
      `${I12}if (customAlertCallbackId !== undefined && adapter.answerCallbackQuery !== undefined)`,
      `${I16}await updateDelivery.track(() => adapter.answerCallbackQuery?.(customAlertCallbackId));`,
      `${I12}adapter.markUpdateCompleted?.(event);`,
      `${I12}return text;`,
      `${I8}}`,
      `${I8}const stopParsed = privateStopCommand(event);`,
      "",
    ].join("\n")],
  ["alerts-state-user",
    "memberOutcome = { kind: \"alerts\", state: handleAlertsCommand(event.userId, parsed.argument) };",
    "memberOutcome = { kind: \"alerts\", state: { ...handleAlertsCommand(event.userId, parsed.argument), nxUserId: event.userId } };"],
  ["alerts-card",
    "? { text: alertsText(memberOutcome?.state), replyMarkup: alertsMarkup(",
    "? { text: alertsText(memberOutcome?.state) + alertCardSuffix(memberOutcome?.state?.nxUserId, memberOutcome?.state?.lang), replyMarkup: alertsMarkup("],
  ["response-let",
    `${I8}const response = responseFor(parsed.command, parsed.argument, event.isPrivateChat,`,
    `${I8}let response = responseFor(parsed.command, parsed.argument, event.isPrivateChat,`],
  ["stop-all",
    `${I8}if (response && (event.isPrivateChat || groupReplyCommands.has(parsed.command))) {\n`,
    [
      `${I8}// nx-alert-triggers: /stop (or "stop"/停止/退订 in private chat) also clears custom /alert rules and every /alerts topic.`,
      `${I8}if (event.isPrivateChat && (stopParsed !== undefined || parsed.command === "stop")) {`,
      `${I12}try {`,
      `${I16}const stopLang = alertLangFor(event.userId);`,
      `${I16}clearUserTriggers(event.userId);`,
      `${I16}handleAlertsCommand(event.userId, "off");`,
      `${I16}if (response)`,
      `${I16}    response = { ...response, text: \`\${response.text}\\n\\n\${stopAllText(stopLang)}\` };`,
      `${I12}}`,
      `${I12}catch (error) {`,
      `${I16}${warn("custom_alert_stop_failed")}`,
      `${I12}}`,
      `${I8}}`,
      `${I8}if (response && (event.isPrivateChat || groupReplyCommands.has(parsed.command))) {`,
      "",
    ].join("\n")],
];

const count = (s, sub) => s.split(sub).length - 1;

/** Pure: returns {status: "patched"|"already", text} or throws when an anchor is missing or ambiguous. */
export function patchSource(src) {
  if (src.includes(MARKER)) {
    // a partially patched file would be a hand edit; refuse rather than guess
    const missing = PATCHES.filter(([, , replacement]) => !src.includes(replacement.trim().split("\n")[0])).map(([name]) => name);
    if (missing.length) throw new Error(`file carries ${MARKER} but these patches are missing: ${missing.join(", ")}`);
    return { status: "already", text: src };
  }
  const problems = PATCHES.filter(([, anchor]) => count(src, anchor) !== 1).map(([name, anchor]) => `${name} (found ${count(src, anchor)}x): ${anchor.trim().slice(0, 80)}`);
  if (problems.length) throw new Error(`anchor check failed, nothing changed:\n  ${problems.join("\n  ")}`);
  let text = src;
  for (const [, anchor, replacement] of PATCHES) text = text.replace(anchor, () => replacement);
  return { status: "patched", text };
}

export function applyPollerPatch(releaseDir, { now = new Date(), triggersSource = path.join(HERE, "..", "alert-triggers.mjs") } = {}) {
  const dir = path.join(releaseDir, SRC_DIR);
  const target = path.join(dir, "mock-community-service.js");
  if (!existsSync(target)) throw new Error(`not a bot-community release (missing ${target})`);
  if (!existsSync(path.join(dir, "alert-subscriptions.js"))) throw new Error(`release has no alert-subscriptions.js in ${dir}`);
  const src = readFileSync(target, "utf8");
  const result = patchSource(src); // throws before any write when an anchor is missing
  const helper = path.join(dir, "alert-triggers.js");
  const helperSrc = readFileSync(triggersSource, "utf8");
  const helperChanged = !existsSync(helper) || readFileSync(helper, "utf8") !== helperSrc;
  if (helperChanged) { mkdirSync(dir, { recursive: true }); writeFileSync(helper, helperSrc); }
  let backup = null;
  if (result.status === "patched") {
    backup = `${target}.bak-${now.toISOString().replace(/[:.]/g, "-")}`;
    copyFileSync(target, backup);
    writeFileSync(target, result.text);
  }
  return { status: result.status, helperChanged, backup, target, helper };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const releaseDir = process.argv[2];
  if (!releaseDir) { console.error("usage: node apply-poller-patch.mjs <releaseDir>"); process.exit(2); }
  try {
    const r = applyPollerPatch(path.resolve(releaseDir));
    console.log(r.status === "patched" ? `patched ${r.target} (backup ${r.backup})` : `already patched: ${r.target}`);
    console.log(r.helperChanged ? `wrote ${r.helper}` : `unchanged ${r.helper}`);
  } catch (error) {
    console.error(`apply-poller-patch: ${error.message}`);
    process.exit(1);
  }
}

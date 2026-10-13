#!/usr/bin/env node
// Localized /start menu for the compiled bot-community poller release (owner 2026-10-13). Run after apply-poller-patch.mjs:
//   node apply-start-patch.mjs <releaseDir>
// Copies ../site-features.mjs to dist/apps/bot-community/src/site-features.js and patches three compiled files:
//   1. packages/contracts/src/telegram.js: the inbound event schema keeps an optional `languageCode`;
//   2. packages/telegram/src/update-decoder.js: message updates carry Telegram's `from.language_code` as `languageCode`;
//   3. apps/bot-community/src/mock-community-service.js: a private /start (plain, ?start=<lang>, or a channel/group/
//      story/website entry route) answers with the start menu — /alert examples plus URL buttons to the site's tools —
//      in the member's language: deep-link lang, then the language they chose in /alerts, then Telegram's UI
//      language, then English. Other /start payloads (alerts, signup, hub topics) keep their own routes.
// Same contract as apply-poller-patch.mjs: every anchor must appear exactly once or nothing is written, already-patched
// files are left untouched, and each original is kept as <file>.bak-<timestamp> before the first write.
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MARKER as TRIGGERS_MARKER, SRC_DIR } from "./apply-poller-patch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const MARKER = "// nx-start-menu v1";
const I8 = " ".repeat(8), I12 = " ".repeat(12), I16 = " ".repeat(16);

const SERVICE_PATCHES = [
  ["import",
    `from "./alert-triggers.js"; ${TRIGGERS_MARKER}\n`,
    `from "./alert-triggers.js"; ${TRIGGERS_MARKER}\n`
    + `import { langFromCode, startMenu } from "./site-features.js"; import { storedLangFor } from "./alert-triggers.js"; ${MARKER}\n`],
  ["start-menu",
    `${I8}// nx-alert-triggers: /stop (or "stop"/停止/退订 in private chat) also clears custom /alert rules and every /alerts topic.\n`,
    [
      `${I8}// nx-start-menu: a private /start answers with the localized start menu (/alert examples + site tools).`,
      `${I8}const nxStartLang = /^(zh|en|ru|tr|vi|id|es|pt)$/.test(startTarget ?? "") ? startTarget : undefined;`,
      `${I8}if (parsed.command === "start" && event.isPrivateChat && response && (startTarget === undefined || startTarget === "" || nxStartLang !== undefined || isEntryRoute(startTarget))) {`,
      `${I12}try {`,
      `${I16}let nxStored = null;`,
      `${I16}try { nxStored = storedLangFor(event.userId); } catch { nxStored = null; }`,
      `${I16}const menu = startMenu(nxStartLang ?? nxStored ?? langFromCode(event.languageCode) ?? "en");`,
      `${I16}response = { text: menu.text, replyMarkup: { inlineKeyboard: [...menu.rows, [navigationButton("🔔 /alerts", "alerts"), navigationButton("⚙️ /hub", "hub")]] } };`,
      `${I12}}`,
      `${I12}catch (error) {`,
      `${I16}console.warn(JSON.stringify({ service: "telegram-community-bot", event: "start_menu_failed", errorName: error instanceof Error ? error.name : "UnknownError" }));`,
      `${I12}}`,
      `${I8}}`,
      `${I8}// nx-alert-triggers: /stop (or "stop"/停止/退订 in private chat) also clears custom /alert rules and every /alerts topic.`,
      "",
    ].join("\n")],
];
const CONTRACT_PATCHES = [
  ["contract-language",
    "    isPremium: z.boolean().optional(),\n    /**\n     * Telegram omits",
    `    isPremium: z.boolean().optional(),\n    /** Telegram UI language (from.language_code), used only to pick the reply language. ${MARKER} */\n    languageCode: z.string().max(35).optional(),\n    /**\n     * Telegram omits`],
];
const DECODER_PATCHES = [
  ["decoder-schema",
    "from: z.object({ id: z.number().int(), is_premium: z.boolean().optional(), first_name: z.string().optional(), username: z.string().optional() }).optional(),",
    "from: z.object({ id: z.number().int(), is_premium: z.boolean().optional(), first_name: z.string().optional(), username: z.string().optional(), language_code: z.string().max(35).optional() }).optional(),"],
  ["decoder-event",
    "        isPremium: sender.is_premium === true,\n        ...anonymousAdministratorMetadata(message),",
    `        isPremium: sender.is_premium === true,\n        ...(sender.language_code === undefined ? {} : { languageCode: sender.language_code }), ${MARKER}\n        ...anonymousAdministratorMetadata(message),`],
];
export const FILES = [
  ["service", path.join(SRC_DIR, "mock-community-service.js"), SERVICE_PATCHES],
  ["contracts", "dist/packages/contracts/src/telegram.js", CONTRACT_PATCHES],
  ["decoder", "dist/packages/telegram/src/update-decoder.js", DECODER_PATCHES],
];

const count = (s, sub) => s.split(sub).length - 1;

/** Pure: {status: "patched"|"already", text}; throws when an anchor is missing/ambiguous or a patch is half applied. */
export function patchText(src, patches, { requires } = {}) {
  if (src.includes(MARKER)) {
    const missing = patches.filter(([, , replacement]) => !src.includes(replacement)).map(([name]) => name);
    if (missing.length) throw new Error(`file carries ${MARKER} but these patches are missing: ${missing.join(", ")}`);
    return { status: "already", text: src };
  }
  if (requires && !src.includes(requires)) throw new Error(`run apply-poller-patch.mjs first (missing ${requires})`);
  const problems = patches.filter(([, anchor]) => count(src, anchor) !== 1).map(([name, anchor]) => `${name} (found ${count(src, anchor)}x): ${anchor.trim().slice(0, 80)}`);
  if (problems.length) throw new Error(`anchor check failed, nothing changed:\n  ${problems.join("\n  ")}`);
  let text = src;
  for (const [, anchor, replacement] of patches) text = text.replace(anchor, () => replacement);
  return { status: "patched", text };
}

export function applyStartPatch(releaseDir, { now = new Date(), featuresSource = path.join(HERE, "..", "site-features.mjs") } = {}) {
  // check every file before writing any of them
  const plans = FILES.map(([name, rel, patches]) => {
    const file = path.join(releaseDir, rel);
    if (!existsSync(file)) throw new Error(`not a bot-community release (missing ${file})`);
    return { name, file, ...patchText(readFileSync(file, "utf8"), patches, name === "service" ? { requires: TRIGGERS_MARKER } : {}) };
  });
  const helper = path.join(releaseDir, SRC_DIR, "site-features.js");
  const helperSrc = readFileSync(featuresSource, "utf8");
  const helperChanged = !existsSync(helper) || readFileSync(helper, "utf8") !== helperSrc;
  if (helperChanged) writeFileSync(helper, helperSrc);
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  const results = plans.map((p) => {
    if (p.status !== "patched") return { name: p.name, file: p.file, status: p.status, backup: null };
    const backup = `${p.file}.bak-${stamp}`;
    copyFileSync(p.file, backup);
    writeFileSync(p.file, p.text);
    return { name: p.name, file: p.file, status: p.status, backup };
  });
  return { results, helper, helperChanged };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const releaseDir = process.argv[2];
  if (!releaseDir) { console.error("usage: node apply-start-patch.mjs <releaseDir>"); process.exit(2); }
  try {
    const r = applyStartPatch(path.resolve(releaseDir));
    for (const f of r.results) console.log(f.status === "patched" ? `patched ${f.file} (backup ${f.backup})` : `already patched: ${f.file}`);
    console.log(r.helperChanged ? `wrote ${r.helper}` : `unchanged ${r.helper}`);
  } catch (error) {
    console.error(`apply-start-patch: ${error.message}`);
    process.exit(1);
  }
}

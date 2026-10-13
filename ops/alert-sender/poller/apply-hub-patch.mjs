#!/usr/bin/env node
// Incremental patch: run after poller, start, and neutral patches. No network or deployment.
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { SRC_DIR } from "./apply-poller-patch.mjs";
import { MARKER as NEUTRAL_MARKER, SERVICE } from "./apply-neutral-patch.mjs";
const HERE = path.dirname(fileURLToPath(import.meta.url));
export const MARKER = "// nx-hub-menu v1";
export const PATCHES = [
  ["import", `import { isNeutralCtaLocale } from "./site-features.js"; ${NEUTRAL_MARKER}\n`,
    `import { isNeutralCtaLocale } from "./site-features.js"; ${NEUTRAL_MARKER}\nimport { menuLanguage, rememberStartLanguage, recalledStartLanguage } from "./bot-menu.js"; ${MARKER}\n`],
  ["start-language", '        const nxStartLang = /^(zh|en|ru|tr|vi|id|es|pt)$/.test(startTarget ?? "") ? startTarget : undefined;\n',
    `        const nxStartLang = isNeutralCtaLocale(startTarget) ? startTarget : langFromCode(startTarget) ?? undefined; ${MARKER}\n`
    + '        if (event.isPrivateChat && nxStartLang) rememberStartLanguage(event.userId, nxStartLang);\n'
    + '        if (event.isPrivateChat && parsed.command === "delete_my_data") rememberStartLanguage(event.userId, null);\n'],
  ["start-recall", '                const nxMenuLang = nxStartLang ?? nxStored ?? (isNeutralCtaLocale(event.languageCode) ? event.languageCode : langFromCode(event.languageCode)) ?? "en";\n',
    `                const nxMenuLang = menuLanguage("start", nxStartLang, nxStored, recalledStartLanguage(event.userId), event.languageCode); ${MARKER}\n`],
  ["guard-language", '                nxLang = nxStartLang ?? nxLang ?? (isNeutralCtaLocale(event.languageCode) ? event.languageCode : langFromCode(event.languageCode));\n',
    `                nxLang = menuLanguage(parsed.command, nxStartLang, nxLang, recalledStartLanguage(event.userId), event.languageCode); ${MARKER}\n`
    + '                if (parsed.command === "hub" && event.isPrivateChat) {\n'
    + '                    const menu = startMenu(nxLang, `tg-bot-hub-${nxLang}`);\n'
    + '                    response = { text: menu.text, replyMarkup: { inlineKeyboard: [...menu.rows, [navigationButton("🔔 /alerts", "alerts")], ...(isNeutralCtaLocale(nxLang) ? [] : [[navigationButton({ zh: "🎁 注册交易所 · 邀请码", en: "🎁 Sign up · Invite codes", tr: "🎁 Kayıt ol · Davet kodları", es: "🎁 Registro · Códigos de invitación", pt: "🎁 Cadastro · Códigos de convite", id: "🎁 Daftar · Kode undangan" }[langFromCode(nxLang) || "en"], "signup")]])] } };\n'
    + '                }\n'],
  ["guard-failure", '                console.warn(JSON.stringify({ service: "telegram-community-bot", event: "neutral_cta_failed", errorName: error instanceof Error ? error.name : "UnknownError" }));\n',
    `                console.warn(JSON.stringify({ service: "telegram-community-bot", event: "neutral_cta_failed", errorName: error instanceof Error ? error.name : "UnknownError" })); ${MARKER}\n`
    + '                if (parsed.command === "signup" || parsed.command === "hub") {\n'
    + '                    const menu = startMenu("ar");\n'
    + '                    response = { text: menu.text, replyMarkup: { inlineKeyboard: [...menu.rows, [navigationButton("🔔 /alerts", "alerts")]] } };\n'
    + '                }\n'],
];
export function patchHubText(src) {
  if (src.includes(MARKER)) {
    const missing = PATCHES.filter(([, , replacement]) => !src.includes(replacement)).map(([name]) => name);
    if (missing.length) throw new Error(`file carries ${MARKER} but patches are missing: ${missing.join(", ")}`);
    return { status: "already", text: src };
  }
  if (!src.includes(NEUTRAL_MARKER)) throw new Error("run apply-neutral-patch.mjs first");
  const problems = PATCHES.filter(([, anchor]) => src.split(anchor).length !== 2).map(([name]) => name);
  if (problems.length) throw new Error(`anchor check failed, nothing changed: ${problems.join(", ")}`);
  let text = src;
  for (const [, anchor, replacement] of PATCHES) text = text.replace(anchor, () => replacement);
  return { status: "patched", text };
}
export function applyHubPatch(releaseDir, { now = new Date() } = {}) {
  const file = path.join(releaseDir, SERVICE);
  if (!existsSync(file)) throw new Error(`not a bot-community release (missing ${file})`);
  const plan = patchHubText(readFileSync(file, "utf8"));
  const helpers = [
    ["bot-menu.js", readFileSync(path.join(HERE, "..", "bot-menu.mjs"), "utf8").replace('from "./site-features.mjs"', 'from "./site-features.js"')],
    ["site-features.js", readFileSync(path.join(HERE, "..", "site-features.mjs"), "utf8")],
  ];
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  const results = helpers.map(([name, source]) => {
    const helper = path.join(releaseDir, SRC_DIR, name);
    const changed = !existsSync(helper) || readFileSync(helper, "utf8") !== source;
    let backup = null;
    if (changed) {
      if (existsSync(helper)) { backup = `${helper}.bak-${stamp}`; copyFileSync(helper, backup); }
      writeFileSync(helper, source);
    }
    return { helper, changed, backup };
  });
  let backup = null;
  if (plan.status === "patched") {
    backup = `${file}.bak-${stamp}`; copyFileSync(file, backup); writeFileSync(file, plan.text);
  }
  return { file, status: plan.status, backup, helpers: results };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (!process.argv[2]) throw new Error("usage: node apply-hub-patch.mjs <releaseDir>");
    console.log(JSON.stringify(applyHubPatch(path.resolve(process.argv[2])), null, 2));
  } catch (error) { console.error(`apply-hub-patch: ${error.message}`); process.exitCode = 1; }
}

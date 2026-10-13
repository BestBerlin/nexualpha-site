#!/usr/bin/env node
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { pinnedMenuMessage } from "../alert-sender/site-features.mjs";

export const GUIDE_LANGS = ["zh", "en", "ru", "tr", "vi"];
export const STATE_FILE = "pinned-guides.json";
export const LOCK_FILE = "pinned-guides.lock";
export const SITE = "https://nexualpha.com";
const DEFAULT_STATE_DIR = "/var/lib/nexualpha-channel-feed";
const DEFAULT_ENV_FILE = "/srv/agent/stacks/crypto-telegram-ops/community-poller.env";
// Owner 2026-10-13: the pinned post is a short native "start here" menu of the site's tools (links tagged
// ?src=tg-pin-<lang>), built in ../alert-sender/site-features.mjs with the tr (no Bitget) and ru (neutral) rules.
export function parseArgs(argv = process.argv.slice(2)) {
  const out = { dryRun: false, update: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--dry-run") out.dryRun = true;
    else if (argv[i] === "--update") out.update = true;
    else if (argv[i] === "--lang") out.lang = argv[++i];
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  if (!GUIDE_LANGS.includes(out.lang)) throw new Error(`--lang must be one of ${GUIDE_LANGS.join(", ")}`);
  return out;
}

export function parseChatTargets(...specs) {
  const chats = new Map();
  for (const spec of specs) {
    for (const part of String(spec || "").split(",")) {
      const trimmed = part.trim();
      const sep = trimmed.indexOf(":");
      if (sep <= 0) continue;
      const lang = trimmed.slice(0, sep).trim();
      const chat = trimmed.slice(sep + 1).trim();
      if (GUIDE_LANGS.includes(lang) && chat && !chats.has(lang)) chats.set(lang, chat);
    }
  }
  return Object.fromEntries(chats);
}

export function buildGuideMessage(lang) {
  return pinnedMenuMessage(lang).text;
}

export function buildGuideMarkup(lang) {
  return { inline_keyboard: pinnedMenuMessage(lang).buttons };
}

export const guideHash = (lang) => createHash("sha256").update(JSON.stringify([buildGuideMessage(lang), buildGuideMarkup(lang)])).digest("hex").slice(0, 16);

export function guidePreview(lang, chat) {
  return [
    `[pin-guide] dry-run lang=${lang} chat=${chat}`,
    buildGuideMessage(lang),
    `[buttons] ${buildGuideMarkup(lang).inline_keyboard.flat().map((b) => `${b.text} -> ${b.url}`).join(" | ")}`,
  ].join("\n");
}

export function readEnvFile(file) {
  if (!file || !existsSync(file)) return {};
  return Object.fromEntries(readFileSync(file, "utf8").split("\n")
    .map((line) => line.trim()).filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1).replace(/^["']|["']$/g, "")]));
}

export function readState(file) {
  if (!existsSync(file)) return { guides: {} };
  try {
    const state = JSON.parse(readFileSync(file, "utf8"));
    if (!state || typeof state !== "object" || Array.isArray(state)) throw new Error("not an object");
    state.guides ||= {};
    if (!state.guides || typeof state.guides !== "object" || Array.isArray(state.guides)) throw new Error("guides is not an object");
    for (const [key, record] of Object.entries(state.guides)) {
      if (!record || typeof record !== "object" || Array.isArray(record)) throw new Error(`${key} is not an object`);
      if (!GUIDE_LANGS.includes(record.lang)) throw new Error(`${key} has invalid lang`);
      if (typeof record.chat !== "string" || !record.chat) throw new Error(`${key} has invalid chat`);
      if (!Number.isInteger(record.messageId) || record.messageId <= 0) throw new Error(`${key} has invalid messageId`);
      if (record.pinnedAt !== null && typeof record.pinnedAt !== "string") throw new Error(`${key} has invalid pinnedAt`);
    }
    return state;
  } catch (error) {
    throw new Error(`refusing to use corrupt guide state ${file}: ${error.message}`);
  }
}

export function writeState(file, state) {
  mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify(state)}\n`);
  renameSync(tmp, file);
}

export function acquireLock(file) {
  mkdirSync(path.dirname(file), { recursive: true });
  let fd;
  try {
    fd = openSync(file, "wx");
    writeFileSync(fd, `${process.pid}\n${new Date().toISOString()}\n`);
    return () => {
      closeSync(fd);
      try { unlinkSync(file); } catch {}
    };
  } catch (error) {
    if (fd !== undefined) closeSync(fd);
    if (error?.code === "EEXIST") {
      throw new Error(`pin guide is already running; remove stale lock after manual verification: ${file}`);
    }
    throw error;
  }
}

export async function telegram(method, token, body, fetchImpl = fetch) {
  const res = await fetchImpl(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json().catch(() => ({}));
  if (!json.ok) throw new Error(`${method}: ${json.error_code || res.status} ${json.description || ""}`.trim());
  return json.result;
}

export async function runPinGuide({
  lang,
  dryRun = false,
  update = false,
  now = new Date(),
  env = process.env,
  fetchImpl = fetch,
  logger = console,
  stateDir = env.CHANNEL_FEED_STATE_DIR || DEFAULT_STATE_DIR,
  stateFile = path.join(stateDir, STATE_FILE),
  lockFile = path.join(stateDir, LOCK_FILE),
} = {}) {
  if (!GUIDE_LANGS.includes(lang)) throw new Error(`unsupported language: ${lang}`);
  const chats = parseChatTargets(env.CHANNEL_FEED_TARGETS, env.ALERT_CHANNELS);
  const chat = chats[lang];
  if (!chat) throw new Error(`no Telegram chat configured for ${lang}; set CHANNEL_FEED_TARGETS or ALERT_CHANNELS`);
  const text = buildGuideMessage(lang);

  if (dryRun) {
    logger.log(guidePreview(lang, chat));
    return { dryRun: true, chat, lang, text };
  }

  const tokenEnv = readEnvFile(env.CHANNEL_FEED_ENV || env.BOT_ENV_FILE || DEFAULT_ENV_FILE);
  const token = env.COMMUNITY_BOT_TOKEN || tokenEnv.COMMUNITY_BOT_TOKEN;
  if (!token) throw new Error("COMMUNITY_BOT_TOKEN missing from env, CHANNEL_FEED_ENV, or BOT_ENV_FILE");

  const releaseLock = acquireLock(lockFile);
  try {
    const state = readState(stateFile);
    const key = `${lang}:${chat}`;
    const record = state.guides[key] || {};
    let messageId = record.messageId;

    const hash = guideHash(lang);
    const post = async () => {
      const sent = await telegram("sendMessage", token, {
        chat_id: chat,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: buildGuideMarkup(lang),
      }, fetchImpl);
      if (!Number.isInteger(sent?.message_id)) throw new Error("sendMessage did not return message_id");
      state.guides[key] = { lang, chat, messageId: sent.message_id, postedAt: now.toISOString(), pinnedAt: null, hash };
      writeState(stateFile, state);
      return sent.message_id;
    };

    if (record.pinnedAt) {
      if (!update) {
        logger.log(`[pin-guide] already pinned ${lang} ${chat} message_id=${messageId}${record.hash === hash ? "" : " (content changed: rerun with --update)"}`);
        return record;
      }
      try {
        await telegram("editMessageText", token, {
          chat_id: chat,
          message_id: messageId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: buildGuideMarkup(lang),
        }, fetchImpl);
      } catch (error) {
        if (!/message is not modified/i.test(error.message)) {
          // The old post is gone or not editable (e.g. sent by another bot): post a fresh menu, pin it, unpin the old one.
          logger.log(`[pin-guide] edit failed for ${lang} ${chat} message_id=${messageId}: ${error.message}; reposting`);
          const oldId = messageId;
          messageId = await post();
          await telegram("pinChatMessage", token, { chat_id: chat, message_id: messageId, disable_notification: true }, fetchImpl);
          try { await telegram("unpinChatMessage", token, { chat_id: chat, message_id: oldId }, fetchImpl); } catch (e) { logger.log(`[pin-guide] unpin ${oldId}: ${e.message}`); }
          state.guides[key] = { ...state.guides[key], pinnedAt: now.toISOString(), replaced: oldId };
          writeState(stateFile, state);
          logger.log(`[pin-guide] reposted and pinned ${lang} ${chat} message_id=${messageId}`);
          return state.guides[key];
        }
      }
      state.guides[key] = { ...record, updatedAt: now.toISOString(), hash };
      writeState(stateFile, state);
      logger.log(`[pin-guide] updated ${lang} ${chat} message_id=${messageId}`);
      return state.guides[key];
    }

    if (!messageId) messageId = await post();

    await telegram("pinChatMessage", token, {
      chat_id: chat,
      message_id: messageId,
      disable_notification: true,
    }, fetchImpl);
    state.guides[key] = { ...(state.guides[key] || {}), lang, chat, messageId, pinnedAt: now.toISOString() };
    writeState(stateFile, state);
    logger.log(`[pin-guide] pinned ${lang} ${chat} message_id=${messageId}`);
    return state.guides[key];
  } finally {
    releaseLock();
  }
}

async function main() {
  const args = parseArgs();
  await runPinGuide({ lang: args.lang, dryRun: args.dryRun, update: args.update });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

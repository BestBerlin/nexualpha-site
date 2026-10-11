#!/usr/bin/env node
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { LOCALE_PATH, T } from "../alert-sender/alert-sender.mjs";

export const GUIDE_LANGS = ["zh", "en", "ru", "tr", "vi"];
export const STATE_FILE = "pinned-guides.json";
export const LOCK_FILE = "pinned-guides.lock";
export const SITE = "https://nexualpha.com";
const DEFAULT_STATE_DIR = "/var/lib/nexualpha-channel-feed";
const DEFAULT_ENV_FILE = "/srv/agent/stacks/crypto-telegram-ops/community-poller.env";
const EXCHANGES = ["okx", "binance", "bybit", "bitget"];
const EXCHANGE_LABELS = { okx: "OKX", binance: "Binance", bybit: "Bybit", bitget: "Bitget" };

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const localePath = (lang) => LOCALE_PATH[lang] ?? "";
const exchangeUrl = (lang, slug) => `${SITE}${localePath(lang)}/exchanges/${slug}?src=tg-guide-${lang}`;

const GUIDE_COPY = {
  zh: {
    title: "NexuAlpha 新手置顶指南",
    invite: "邀请码/返佣怎么理解：邀请码只是交易所注册归因方式；如果页面写有返佣或优惠，以交易所最终规则和到账为准。",
    links: "防钓鱼：不要从私信、群内陌生短链或搜索广告进入交易所。先打开 NexuAlpha 的交易所对比页，再从页面里的官方入口继续。",
    safety: "任何管理员都不会向你索要密码、2FA、助记词、API key 或远程控制权限。",
    compare: "常用官方入口（经 NexuAlpha 对比页）：",
  },
  en: {
    title: "NexuAlpha Beginner Guide",
    invite: "How invite codes and rebates work: an invite code is an exchange attribution method. If a page shows a rebate or perk, the exchange rules and settlement record are the source of truth.",
    links: "Anti-phishing: do not enter exchanges from DMs, random short links, or search ads. Open the NexuAlpha exchange comparison page first, then continue from its official entry.",
    safety: "No admin will ask for your password, 2FA code, seed phrase, API key, or remote control access.",
    compare: "Official entries via NexuAlpha comparison pages:",
  },
  ru: {
    title: "Гид для новичков NexuAlpha",
    invite: "Как работают инвайт-коды и ребейты: код нужен бирже для атрибуции регистрации. Если на странице указан ребейт или бонус, правила биржи и история начислений являются источником истины.",
    links: "Антифишинг: не переходите на биржи из личных сообщений, случайных коротких ссылок или поисковой рекламы. Сначала откройте страницу сравнения NexuAlpha, затем используйте официальный вход на ней.",
    safety: "Администраторы не просят пароль, 2FA-код, seed-фразу, API key или удалённый доступ.",
    compare: "Официальные входы через страницы сравнения NexuAlpha:",
  },
  tr: {
    title: "NexuAlpha Başlangıç Rehberi",
    invite: "Davet kodları ve iadeler: davet kodu borsanın kayıt atıf yöntemidir. Bir sayfada iade veya avantaj yazıyorsa, nihai kural ve ödeme kaydı borsadadır.",
    links: "Kimlik avına karşı: DM, rastgele kısa link veya arama reklamından borsaya girmeyin. Önce NexuAlpha borsa karşılaştırma sayfasını açın, sonra oradaki resmi girişten devam edin.",
    safety: "Hiçbir yönetici şifrenizi, 2FA kodunuzu, seed ifadenizi, API key'inizi veya uzaktan erişim izninizi istemez.",
    compare: "NexuAlpha karşılaştırma sayfaları üzerinden resmi girişler:",
  },
  vi: {
    title: "Hướng dẫn cho người mới NexuAlpha",
    invite: "Mã mời và hoàn phí hoạt động thế nào: mã mời là cách sàn ghi nhận đăng ký. Nếu trang hiển thị hoàn phí hoặc ưu đãi, quy tắc và lịch sử thanh toán của sàn là nguồn xác nhận cuối cùng.",
    links: "Chống phishing: đừng vào sàn từ DM, link rút gọn lạ hoặc quảng cáo tìm kiếm. Hãy mở trang so sánh sàn của NexuAlpha trước, rồi đi tiếp từ lối vào chính thức trên trang đó.",
    safety: "Không quản trị viên nào yêu cầu mật khẩu, mã 2FA, seed phrase, API key hoặc quyền điều khiển từ xa.",
    compare: "Lối vào chính thức qua trang so sánh NexuAlpha:",
  },
};

export function parseArgs(argv = process.argv.slice(2)) {
  const out = { dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--dry-run") out.dryRun = true;
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
  const copy = GUIDE_COPY[lang] || GUIDE_COPY.en;
  const links = EXCHANGES.map((slug) => `• <a href="${exchangeUrl(lang, slug)}">${EXCHANGE_LABELS[slug]}</a>`).join("\n");
  return [
    `<b>${esc(copy.title)}</b>`,
    "",
    esc(copy.invite),
    "",
    esc(copy.links),
    "",
    esc(copy.safety),
    "",
    esc(copy.compare),
    links,
    "",
    T(lang).listingDisclosure,
  ].join("\n");
}

export function guidePreview(lang, chat) {
  return [
    `[pin-guide] dry-run lang=${lang} chat=${chat}`,
    buildGuideMessage(lang),
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

    if (record.pinnedAt) {
      logger.log(`[pin-guide] already pinned ${lang} ${chat} message_id=${messageId}`);
      return record;
    }

    if (!messageId) {
      const sent = await telegram("sendMessage", token, {
        chat_id: chat,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }, fetchImpl);
      messageId = sent.message_id;
      if (!Number.isInteger(messageId)) throw new Error("sendMessage did not return message_id");
      state.guides[key] = { lang, chat, messageId, postedAt: now.toISOString(), pinnedAt: null };
      writeState(stateFile, state);
    }

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
  await runPinGuide({ lang: args.lang, dryRun: args.dryRun });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

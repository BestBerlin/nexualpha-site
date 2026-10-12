#!/usr/bin/env node
// NexuAlpha channel feed (owner 2026-10-10): posts NEW official exchange announcements from nexualpha.com to the
// Telegram channels, each with the exchange's sign-up route (invite code).
// Separate from the community bot runtime; uses the same bot token from the private env file. Idempotent: a state
// file records every posted id; the first run only records the current items (no backlog flood). Max 5 posts a run.
//   node channel-feed.mjs            post new items
//   node channel-feed.mjs --dry-run  print what would be posted, change nothing
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, rmdirSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { runArticleFeed } from "./article-feed.mjs";
// The Telegram runtime ships the ops bundle without the site tree. Keep this pure route contract local; parity tests lock it to the site helper.
function updateIdentity(item) {
  return String(item?.id || item?.url || item?.officialSource?.url || '');
}
function updateHash(value) {
  let n = 2166136261;
  for (const c of String(value)) { n ^= c.charCodeAt(0); n = Math.imul(n, 16777619); }
  return (n >>> 0).toString(36);
}

function updatePath(item) {
  const venue = item?.venue || item?.platform?.slug;
  const id = updateIdentity(item);
  const slug = id.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 70) || 'update';
  return `/activities/updates/${encodeURIComponent(venue)}/${slug}-${updateHash(id)}`;
}

const DRY = process.argv.includes("--dry-run");
const STATE_DIR = process.env.CHANNEL_FEED_STATE_DIR || "/var/lib/nexualpha-channel-feed";
const ENV_FILE = process.env.CHANNEL_FEED_ENV || "/srv/agent/stacks/crypto-telegram-ops/community-poller.env";
const SITE = "https://nexualpha.com";
const MAX_PER_RUN = 5;
const MAX_AGE_MS = 36 * 3600 * 1000; // never post anything older than 36 h
const CHANNELS = (process.env.CHANNEL_FEED_TARGETS || "zh:@NexuAlphaClub").split(",").map((x) => { const [lang, chat] = x.trim().split(":"); return { lang, chat }; }).filter((c) => c.lang && c.chat);
const LOCALE_PATH = { zh: "/zh-hans", en: "", ru: "/ru", tr: "/tr", vi: "/vi" };

const NAMES = { okx: "OKX", bitget: "Bitget", binance: "Binance", bybit: "Bybit", kucoin: "KuCoin", kraken: "Kraken", "gate-io": "Gate.io", hyperliquid: "Hyperliquid", mexc: "MEXC", htx: "HTX" };


const COPY = {
  zh: {
    cat: { listing: "上币", event: "活动", delisting: "下架", news: "公告", product: "产品", security: "安全" },
    terms: (p) => [p.share != null ? `最高返佣 ${Math.round(p.share * 100)}%` : null, p.autoSettle ? "官方自动结算" : null, p.settle === "hourly" ? "每小时到账" : p.settle === "daily" ? "每天到账" : null, p.inviteCode ? `邀请码 ${p.inviteCode}` : null].filter(Boolean).join(" · "),
    via: (n) => `通过 NexuAlpha 注册 ${n}：`,
    official: "查看官方公告", signUp: (n) => `注册 ${n} 拿返佣`, more: "费率对比",
    time: (iso) => new Date(iso).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) + "（北京时间）",
  },
  en: {
    cat: { listing: "Listing", event: "Event", delisting: "Delisting", news: "Notice", product: "Product", security: "Security" },
    terms: (p) => [p.share != null ? `up to ${Math.round(p.share * 100)}% back` : null, p.autoSettle ? "settled by the exchange" : null, p.settle === "hourly" ? "paid hourly" : p.settle === "daily" ? "paid daily" : null, p.inviteCode ? `code ${p.inviteCode}` : null].filter(Boolean).join(" · "),
    via: (n) => `Sign up on ${n} via NexuAlpha: `,
    official: "Official notice", signUp: (n) => `Sign up on ${n}`, more: "Compare fees",
    time: (iso) => new Date(iso).toUTCString().replace(/:\d\d GMT$/, " UTC"),
  },
  // ru/tr/vi channels (2026-10-11): same facts, local wording; time in UTC with the local date format.
  ru: {
    cat: { listing: "Листинг", event: "Акция", delisting: "Делистинг", news: "Объявление", product: "Продукт", security: "Безопасность" },
    terms: (p) => [p.share != null ? `до ${Math.round(p.share * 100)}% возврата` : null, p.autoSettle ? "начисляет биржа" : null, p.settle === "hourly" ? "выплата каждый час" : p.settle === "daily" ? "выплата ежедневно" : null, p.inviteCode ? `код ${p.inviteCode}` : null].filter(Boolean).join(" · "),
    via: (n) => `Регистрация на ${n} через NexuAlpha: `,
    official: "Официальное объявление", signUp: (n) => `Регистрация на ${n}`, more: "Сравнить комиссии",
    time: (iso) => new Date(iso).toLocaleString("ru-RU", { timeZone: "UTC", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) + " UTC",
  },
  tr: {
    cat: { listing: "Listeleme", event: "Kampanya", delisting: "Listeden çıkarma", news: "Duyuru", product: "Ürün", security: "Güvenlik" },
    terms: (p) => [p.share != null ? `en fazla %${Math.round(p.share * 100)} iade` : null, p.autoSettle ? "borsa tarafından ödenir" : null, p.settle === "hourly" ? "saatlik ödeme" : p.settle === "daily" ? "günlük ödeme" : null, p.inviteCode ? `kod ${p.inviteCode}` : null].filter(Boolean).join(" · "),
    via: (n) => `NexuAlpha üzerinden ${n} kaydı: `,
    official: "Resmî duyuru", signUp: (n) => `${n} hesabı aç`, more: "Komisyonları karşılaştır",
    time: (iso) => new Date(iso).toLocaleString("tr-TR", { timeZone: "UTC", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) + " UTC",
  },
  vi: {
    cat: { listing: "Niêm yết", event: "Sự kiện", delisting: "Hủy niêm yết", news: "Thông báo", product: "Sản phẩm", security: "Bảo mật" },
    terms: (p) => [p.share != null ? `hoàn tới ${Math.round(p.share * 100)}%` : null, p.autoSettle ? "sàn tự động thanh toán" : null, p.settle === "hourly" ? "trả mỗi giờ" : p.settle === "daily" ? "trả mỗi ngày" : null, p.inviteCode ? `mã ${p.inviteCode}` : null].filter(Boolean).join(" · "),
    via: (n) => `Đăng ký ${n} qua NexuAlpha: `,
    official: "Thông báo chính thức", signUp: (n) => `Đăng ký ${n}`, more: "So sánh phí",
    time: (iso) => new Date(iso).toLocaleString("vi-VN", { timeZone: "UTC", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }) + " UTC",
  },
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function readEnv(file) {
  return Object.fromEntries(readFileSync(file, "utf8").split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^["']|["']$/g, "")]));
}
async function getJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json", "user-agent": "NexuAlphaChannelFeed/1.0" }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return res.json();
}

// Turkey (owner 2026-10-11): no sign-up route for partners without an SPK "operating" listing (Bitget Teknoloji AŞ is on
// the liquidation list); the announcement itself still posts with its official link.
const NO_SIGNUP = { tr: new Set(["bitget", "backpack", "hyperliquid"]) };
export function buildMessage(item, partnerIn, lang) {
  const neutral = /^(ru|ar|ur|uk)$|^zh-(Hant|TW|HK)$/i.test(lang);
  const partner = neutral || NO_SIGNUP[lang]?.has(item.venue) ? null : partnerIn;
  const c = COPY[lang] || COPY.en;
  const name = NAMES[item.venue] || item.venue;
  const tag = lang === "zh" ? `【${esc(c.cat[item.category] || item.category)}｜${esc(name)}】` : `[${esc(c.cat[item.category] || item.category)} · ${esc(name)}] `;
  const lines = [`<b>${tag}</b>${esc(item.title)}`, `🕒 ${esc(c.time(item.publishedAt))}`];
  if (partner) {
    const terms = c.terms(partner);
    if (terms) lines.push("", `${esc(c.via(name))}${esc(terms)}`);
  }
  const row1 = [{ text: c.official, url: `${SITE}${LOCALE_PATH[lang] ?? ""}${updatePath(item)}` }];
  // tracked redirect (2026-10-10): lands on the same registration URL, attributes the click to this channel
  if (partner) row1.push({ text: c.signUp(name), url: `${SITE}/go/${partner.slug}?src=tg-channel-${lang}` });
  const row2 = [{ text: c.more, url: `${SITE}${LOCALE_PATH[lang] ?? ""}/exchanges/${item.venue}` }];
  return { text: lines.join("\n"), reply_markup: { inline_keyboard: [row1, row2] } };
}

async function send(token, chat, msg) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: msg.text, parse_mode: "HTML", disable_web_page_preview: true, reply_markup: msg.reply_markup }),
    signal: AbortSignal.timeout(15000),
  });
  const j = await res.json().catch(() => ({}));
  if (!j.ok) throw new Error(`sendMessage ${chat}: ${j.error_code || res.status} ${j.description || ""}`);
}

async function main() {
  if (!DRY) mkdirSync(STATE_DIR, { recursive: true });
  // Separate article state; announcement baselines/rate limits stay independent.
  const articlePath = path.join(STATE_DIR, "articles.json");
  try {
    const articleState = existsSync(articlePath) ? JSON.parse(readFileSync(articlePath, "utf8")) : {};
    await runArticleFeed({
      feed: await getJson(`${SITE}/content/news-feed-summary.json`), channels: CHANNELS, state: articleState, dryRun: DRY,
      send: async (chat, msg) => {
        if (DRY) { console.log(`--- ${chat}\n${msg.text}`); return; }
        const tok = process.env.COMMUNITY_BOT_TOKEN || readEnv(ENV_FILE).COMMUNITY_BOT_TOKEN;
        if (!tok) throw new Error("bot token missing in env file");
        await send(tok, chat, msg);
      },
      save: (data) => { const tmp = `${articlePath}.tmp`; writeFileSync(tmp, JSON.stringify(data)); renameSync(tmp, articlePath); },
    });
  } catch (e) { console.error(`article feed: ${e.message}`); process.exitCode = 1; }
  const statePath = path.join(STATE_DIR, "state.json");
  const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : { posted: {}, initialized: false };
  const [feed, partnersFeed] = await Promise.all([getJson(`${SITE}/intel/official-announcements.json`), getJson(`${SITE}/intel/partners.json`).catch(() => ({ partners: [] }))]);
  const partners = Object.fromEntries((partnersFeed.partners || []).map((p) => [p.slug, p]));
  const now = Date.now();
  const items = (feed.items || []).filter((i) => i?.id && i.url && Number.isFinite(Date.parse(i.publishedAt))).sort((a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt));
  const save = () => { if (DRY) return; const tmp = `${statePath}.tmp`; writeFileSync(tmp, JSON.stringify(state)); renameSync(tmp, statePath); };

  if (!state.initialized) {
    for (const i of items) state.posted[i.id] = "baseline";
    state.initialized = true; save();
    console.log(`initialized with ${items.length} existing items; nothing posted`);
    return;
  }
  const fresh = items.filter((i) => !state.posted[i.id] && now - Date.parse(i.publishedAt) < MAX_AGE_MS).slice(-MAX_PER_RUN);
  // anything unseen but too old is recorded so it is never posted late
  for (const i of items) if (!state.posted[i.id] && !fresh.includes(i)) state.posted[i.id] = "skipped-old";
  if (!fresh.length) { save(); console.log("no new items"); return; }
  const token = DRY ? "" : readEnv(ENV_FILE).COMMUNITY_BOT_TOKEN;
  if (!DRY && !token) throw new Error("bot token missing in env file");
  for (const item of fresh) {
    for (const { lang, chat } of CHANNELS) {
      const msg = buildMessage(item, partners[item.venue], lang);
      if (DRY) { console.log(`--- ${chat}\n${msg.text}\n${JSON.stringify(msg.reply_markup)}`); continue; }
      await send(token, chat, msg);
      await new Promise((r) => setTimeout(r, 1500));
    }
    state.posted[item.id] = new Date().toISOString(); save();
    console.log(`posted ${item.id}`);
  }
  // keep the state file small
  const ids = Object.keys(state.posted); if (ids.length > 3000) for (const id of ids.slice(0, ids.length - 2000)) delete state.posted[id];
  save();
}

// Scheduler invocations must not race the article state read/send/write transaction.
async function run() {
  if (DRY) return main();
  mkdirSync(STATE_DIR, { recursive: true });
  const lock = path.join(STATE_DIR, "channel-feed.lock");
  // A lock older than 15 min is left over from a killed run; clear it so the feed cannot stall forever.
  try { if (Date.now() - statSync(lock).mtimeMs > 15 * 60 * 1000) rmdirSync(lock); } catch {}
  try { mkdirSync(lock); } catch (e) { if (e.code === "EEXIST") { console.log("channel-feed already running (lock exists)"); return; } throw e; }
  try { await main(); } finally { rmdirSync(lock); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run().catch((e) => { console.error(String(e?.message || e)); process.exit(1); });

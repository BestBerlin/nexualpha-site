#!/usr/bin/env node
// NexuAlpha channel feed (owner 2026-10-10): posts NEW official exchange announcements from nexualpha.com to the
// Telegram channels, each with the exchange's sign-up route (invite code) and the commission disclosure.
// Separate from the community bot runtime; uses the same bot token from the private env file. Idempotent: a state
// file records every posted id; the first run only records the current items (no backlog flood). Max 5 posts a run.
//   node channel-feed.mjs            post new items
//   node channel-feed.mjs --dry-run  print what would be posted, change nothing
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from "node:fs";
import path from "node:path";

const DRY = process.argv.includes("--dry-run");
const STATE_DIR = process.env.CHANNEL_FEED_STATE_DIR || "/var/lib/nexualpha-channel-feed";
const ENV_FILE = process.env.CHANNEL_FEED_ENV || "/srv/agent/stacks/crypto-telegram-ops/community-poller.env";
const SITE = "https://nexualpha.com";
const MAX_PER_RUN = 5;
const MAX_AGE_MS = 36 * 3600 * 1000; // never post anything older than 36 h
const CHANNELS = (process.env.CHANNEL_FEED_TARGETS || "zh:@NexuAlphaClub").split(",").map((x) => { const [lang, chat] = x.split(":"); return { lang, chat }; });

const NAMES = { okx: "OKX", bitget: "Bitget", binance: "Binance", bybit: "Bybit", kucoin: "KuCoin", kraken: "Kraken", "gate-io": "Gate.io", hyperliquid: "Hyperliquid", mexc: "MEXC", htx: "HTX" };
const COPY = {
  zh: {
    cat: { listing: "上币", event: "活动", delisting: "下架", news: "公告", product: "产品", security: "安全" },
    terms: (p) => [p.share != null ? `最高返佣 ${Math.round(p.share * 100)}%` : null, p.autoSettle ? "官方自动结算" : null, p.settle === "hourly" ? "每小时到账" : p.settle === "daily" ? "每天到账" : null, p.inviteCode ? `邀请码 ${p.inviteCode}` : null].filter(Boolean).join(" · "),
    via: (n) => `通过 NexuAlpha 注册 ${n}：`,
    official: "查看官方公告", signUp: (n) => `注册 ${n} 拿返佣`, more: "费率对比",
    disclosure: "合作链接可能为 NexuAlpha 带来交易所支付的佣金，不增加你的交易成本。",
    time: (iso) => new Date(iso).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) + "（北京时间）",
  },
  en: {
    cat: { listing: "Listing", event: "Event", delisting: "Delisting", news: "Notice", product: "Product", security: "Security" },
    terms: (p) => [p.share != null ? `up to ${Math.round(p.share * 100)}% back` : null, p.autoSettle ? "settled by the exchange" : null, p.settle === "hourly" ? "paid hourly" : p.settle === "daily" ? "paid daily" : null, p.inviteCode ? `code ${p.inviteCode}` : null].filter(Boolean).join(" · "),
    via: (n) => `Sign up on ${n} via NexuAlpha: `,
    official: "Official notice", signUp: (n) => `Sign up on ${n}`, more: "Compare fees",
    disclosure: "Partner links may earn NexuAlpha a commission paid by the exchange, at no extra cost to you.",
    time: (iso) => new Date(iso).toUTCString().replace(/:\d\d GMT$/, " UTC"),
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

export function buildMessage(item, partner, lang) {
  const c = COPY[lang] || COPY.en;
  const name = NAMES[item.venue] || item.venue;
  const tag = lang === "zh" ? `【${esc(c.cat[item.category] || item.category)}｜${esc(name)}】` : `[${esc(c.cat[item.category] || item.category)} · ${esc(name)}] `;
  const lines = [`<b>${tag}</b>${esc(item.title)}`, `🕒 ${esc(c.time(item.publishedAt))}`];
  if (partner) {
    const terms = c.terms(partner);
    if (terms) lines.push("", `${esc(c.via(name))}${esc(terms)}`);
    lines.push(`<i>${esc(c.disclosure)}</i>`);
  }
  const row1 = [{ text: c.official, url: item.url }];
  // tracked redirect (2026-10-10): lands on the same registration URL, attributes the click to this channel
  if (partner) row1.push({ text: c.signUp(name), url: `${SITE}/go/${partner.slug}?src=tg-channel-${lang}` });
  const row2 = [{ text: c.more, url: `${SITE}/${lang === "zh" ? "zh-hans/" : ""}exchanges/${item.venue}` }];
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
  mkdirSync(STATE_DIR, { recursive: true });
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

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(String(e?.message || e)); process.exit(1); });

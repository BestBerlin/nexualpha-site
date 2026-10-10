#!/usr/bin/env node
// NexuAlpha Telegram alert sender (owner 2026-10-10). Reads public NexuAlpha data and sends:
//   - market alerts (liquidation spikes, longs-and-shorts liquidated, BTC/ETH sharp moves) to members who turned the
//     topic on in the bot (/alerts), and the high-severity ones to the zh/en channels;
//   - partner-venue listings and campaigns to members subscribed to "listings";
//   - a daily brief at 13:00 UTC (21:00 Beijing) to the channels and "digest" subscribers.
// Sign-up buttons go through https://nexualpha.com/go/<partner>?src=... so clicks are attributed; the redirect lands on
// the unchanged partner link. Idempotent via a state file; DMs are rate-limited; users who blocked the bot are removed.
import { readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import path from "node:path";

const SITE = "https://nexualpha.com";
const SUBS = process.env.ALERT_SUBSCRIPTIONS_FILE || "/var/lib/crypto-telegram-ops/alert-subscriptions.json";
const STATE = process.env.ALERT_STATE_FILE || "/var/lib/nexualpha-alerts/state.json";
const ENV_FILE = process.env.BOT_ENV_FILE || "/srv/agent/stacks/crypto-telegram-ops/community-poller.env";
const CHANNELS = { zh: "@NexuAlphaClub", en: "@NexuAlphaGlobal" };
const DRY = process.argv.includes("--dry-run");
const ONCE = process.argv.includes("--once");
const log = (m) => console.log(`[alerts] ${new Date().toISOString()} ${m}`);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const usd = (n) => (n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1e3)}K`);
const go = (slug, src) => `${SITE}/go/${slug}?src=${src}`;

function readJson(file, fallback) { try { return JSON.parse(readFileSync(file, "utf8")); } catch { return fallback; } }
function writeJson(file, data) { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(`${file}.tmp`, JSON.stringify(data)); renameSync(`${file}.tmp`, file); }
function token() {
  const line = readFileSync(ENV_FILE, "utf8").split("\n").find((l) => l.startsWith("COMMUNITY_BOT_TOKEN="));
  return line ? line.slice("COMMUNITY_BOT_TOKEN=".length).trim().replace(/^["']|["']$/g, "") : "";
}
async function getJson(url) {
  const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}r=${Date.now()}`, { headers: { "user-agent": "NexuAlphaAlerts/1.0" }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return res.json();
}
async function send(tok, chat, text, buttons) {
  if (DRY) { log(`DRY -> ${chat}: ${text.split("\n")[0]}`); return { ok: true }; }
  const res = await fetch(`https://api.telegram.org/bot${tok}/sendMessage`, {
    method: "POST", headers: { "content-type": "application/json" }, signal: AbortSignal.timeout(15000),
    body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true, reply_markup: buttons ? { inline_keyboard: buttons } : undefined }),
  });
  return res.json().catch(() => ({ ok: false }));
}

// ---------- message builders ----------
function partnerButtons(partners, lang, src) {
  const featured = partners.filter((p) => p.featured).slice(0, 3);
  return [
    featured.map((p) => ({ text: lang === "zh" ? `注册 ${p.name}（返佣）` : `Sign up on ${p.name}`, url: go(p.slug, src) })),
    [{ text: lang === "zh" ? "🔔 订阅告警" : "🔔 Get alerts", url: "https://t.me/NexuAlphaAssistantBot?start=alerts" },
     { text: lang === "zh" ? "📊 资金费率" : "📊 Funding rates", url: `${SITE}/${lang === "zh" ? "zh-hans/" : ""}rates` }],
  ];
}
const DISCLOSURE = { zh: "<i>合作链接可能为 NexuAlpha 带来交易所支付的佣金，不增加你的交易成本。数据为 Binance、OKX 公开数据下限估计，不构成投资建议。</i>", en: "<i>Partner links may earn NexuAlpha a commission paid by the exchange, at no extra cost to you. Binance + OKX public data, a lower bound. Not investment advice.</i>" };

function eventMessage(ev, mk, lang) {
  const L = mk.liquidations;
  const btc = mk.market.majors.find((m) => m.symbol === "BTCUSDT"), eth = mk.market.majors.find((m) => m.symbol === "ETHUSDT");
  const head = {
    "liquidation-spike": { zh: "💥 爆仓激增", en: "💥 Liquidation spike" },
    "both-sides-liquidated": { zh: "⚔️ 多空双杀", en: "⚔️ Longs and shorts both liquidated" },
    "sharp-move": { zh: "⚡ 急涨急跌", en: "⚡ Sharp move" },
  }[ev.type][lang];
  const lines = [`<b>${head}</b>`];
  if (lang === "zh") {
    lines.push(`1 小时爆仓：多 ${usd(L.h1.longUsd)} / 空 ${usd(L.h1.shortUsd)} 美元`, `24 小时爆仓：多 ${usd(L.h24.longUsd)} / 空 ${usd(L.h24.shortUsd)} 美元`);
    if (btc) lines.push(`BTC ${btc.price.toLocaleString("en-US")}（1h ${btc.change1hPct}%，24h ${btc.change24hPct}%）`);
    if (eth) lines.push(`ETH ${eth.price.toLocaleString("en-US")}（1h ${eth.change1hPct}%，24h ${eth.change24hPct}%）`);
    if (L.h1.largest) lines.push(`最大单笔：${esc(L.h1.largest.symbol)} ${L.h1.largest.side === "long" ? "多单" : "空单"} ${usd(L.h1.largest.usd)} 美元`);
    lines.push("", "降低杠杆、确认强平价，行情剧烈时资金费率也会跳变。");
  } else {
    lines.push(`1h liquidations: long ${usd(L.h1.longUsd)} / short ${usd(L.h1.shortUsd)} USD`, `24h liquidations: long ${usd(L.h24.longUsd)} / short ${usd(L.h24.shortUsd)} USD`);
    if (btc) lines.push(`BTC ${btc.price.toLocaleString("en-US")} (1h ${btc.change1hPct}%, 24h ${btc.change24hPct}%)`);
    if (eth) lines.push(`ETH ${eth.price.toLocaleString("en-US")} (1h ${eth.change1hPct}%, 24h ${eth.change24hPct}%)`);
    if (L.h1.largest) lines.push(`Largest: ${esc(L.h1.largest.symbol)} ${L.h1.largest.side} ${usd(L.h1.largest.usd)} USD`);
    lines.push("", "Lower leverage, check your liquidation price; funding rates jump in moves like this.");
  }
  lines.push("", DISCLOSURE[lang]);
  return lines.join("\n");
}

function digestMessage(mk, partners, articles, campaigns, lang) {
  const L = mk.liquidations.h24;
  const lines = [lang === "zh" ? "<b>🗞 NexuAlpha 每日市场简报</b>" : "<b>🗞 NexuAlpha daily brief</b>", ""];
  for (const m of mk.market.majors.slice(0, 4)) lines.push(`${m.symbol.replace("USDT", "")} ${m.price.toLocaleString("en-US")}  ${m.change24hPct > 0 ? "+" : ""}${m.change24hPct}%`);
  lines.push("", lang === "zh" ? `24h 爆仓（下限）：多 ${usd(L.longUsd)} / 空 ${usd(L.shortUsd)} 美元` : `24h liquidations (lower bound): long ${usd(L.longUsd)} / short ${usd(L.shortUsd)} USD`);
  if (mk.market.movers.length) lines.push((lang === "zh" ? "异动：" : "Movers: ") + mk.market.movers.slice(0, 3).map((m) => `${m.symbol.replace("USDT", "")} ${m.change24hPct > 0 ? "+" : ""}${m.change24hPct}%`).join(" · "));
  if (articles.length) {
    lines.push("", lang === "zh" ? "<b>今日文章</b>" : "<b>Today on NexuAlpha</b>");
    for (const a of articles.slice(0, 4)) lines.push(`• <a href="${SITE}${lang === "zh" ? "/zh-hans" : ""}/news/${a.slug}">${esc((lang === "zh" ? a.title?.["zh-Hans"] : a.title?.en) || a.title?.en || a.slug)}</a>`);
  }
  if (campaigns.length) {
    lines.push("", lang === "zh" ? "<b>交易所活动</b>" : "<b>Exchange campaigns</b>");
    for (const c of campaigns.slice(0, 3)) lines.push(`• ${esc(c.venue.toUpperCase())}: <a href="${c.url}">${esc(c.title.slice(0, 90))}</a>`);
  }
  lines.push("", DISCLOSURE[lang]);
  return { text: lines.join("\n"), buttons: partnerButtons(partners, lang, `tg-digest-${lang}`) };
}

function listingMessage(item, partner, lang) {
  const cat = { listing: { zh: "上币", en: "Listing" }, event: { zh: "活动", en: "Campaign" } }[item.category]?.[lang] || item.category;
  const text = [`<b>${lang === "zh" ? `【${cat}｜${esc(partner.name)}】` : `[${cat} · ${esc(partner.name)}] `}</b>${esc(item.title)}`, "", DISCLOSURE[lang].replace(/ 数据为.*?。|Binance \+ OKX public data, a lower bound\. /, "")].join("\n");
  return { text, buttons: [[{ text: lang === "zh" ? "官方公告" : "Official notice", url: item.url }, { text: lang === "zh" ? `注册 ${partner.name}` : `Sign up on ${partner.name}`, url: go(partner.slug, `tg-dm-listing-${lang}`) }]] };
}

// ---------- cycle ----------
async function cycle(tok) {
  const state = readJson(STATE, { sentEvents: {}, sentListings: {}, digestDates: [], initialized: false });
  const subs = readJson(SUBS, { users: {} });
  const users = Object.entries(subs.users || {});
  const [mk, partnersFeed, ann] = await Promise.all([getJson(`${SITE}/intel/market-events.json`), getJson(`${SITE}/intel/partners.json`), getJson(`${SITE}/intel/official-announcements.json`).catch(() => ({ items: [] }))]);
  const partners = partnersFeed.partners || [];
  const bySlug = Object.fromEntries(partners.map((p) => [p.slug, p]));
  const blocked = new Set();
  const dm = async (uid, text, buttons) => {
    const r = await send(tok, uid, text, buttons);
    if (!r.ok && /blocked|deactivated|chat not found/i.test(r.description || "")) blocked.add(uid);
    await new Promise((res) => setTimeout(res, 60));
  };

  // market events (one alert per type per 3 hours)
  const hourKey = (type) => `${type}:${Math.floor(Date.now() / (3 * 3600e3))}`;
  for (const ev of (mk.events || []).filter((e) => e.severity === "high")) {
    const key = hourKey(ev.type);
    if (state.sentEvents[key] || !state.initialized) { state.sentEvents[key] = state.sentEvents[key] || "baseline"; continue; }
    const topic = ev.type === "sharp-move" ? "moves" : "liquidation";
    for (const lang of ["zh", "en"]) await send(tok, CHANNELS[lang], eventMessage(ev, mk, lang), partnerButtons(partners, lang, `tg-alert-channel-${lang}`));
    for (const [uid, u] of users) if (u.topics?.includes(topic)) await dm(uid, eventMessage(ev, mk, u.lang === "en" ? "en" : "zh"), partnerButtons(partners, u.lang === "en" ? "en" : "zh", `tg-alert-dm-${u.lang === "en" ? "en" : "zh"}`));
    state.sentEvents[key] = new Date().toISOString();
    log(`event ${ev.type} sent`);
  }

  // partner listings and campaigns -> "listings" subscribers (channels already get them from channel-feed)
  const fresh = (ann.items || []).filter((i) => ["listing", "event"].includes(i.category) && bySlug[i.venue] && Date.now() - Date.parse(i.publishedAt) < 6 * 3600e3);
  for (const item of fresh) {
    if (state.sentListings[item.id]) continue;
    if (state.initialized) for (const [uid, u] of users) if (u.topics?.includes("listings")) { const m = listingMessage(item, bySlug[item.venue], u.lang === "en" ? "en" : "zh"); await dm(uid, m.text, m.buttons); }
    state.sentListings[item.id] = new Date().toISOString();
  }

  // daily brief at 13:00 UTC
  const today = new Date().toISOString().slice(0, 10);
  if (new Date().getUTCHours() === 13 && !state.digestDates.includes(today) && state.initialized) {
    const feed = await getJson(`${SITE}/content/news-feed-summary.json`).catch(() => ({ articles: [] }));
    const articles = (feed.articles || []).filter((a) => Date.now() - Date.parse(a.publishedAt) < 24 * 3600e3).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    const campaigns = (ann.items || []).filter((i) => i.category === "event" && bySlug[i.venue] && Date.now() - Date.parse(i.publishedAt) < 48 * 3600e3);
    for (const lang of ["zh", "en"]) { const d = digestMessage(mk, partners, articles, campaigns, lang); await send(tok, CHANNELS[lang], d.text, d.buttons); }
    for (const [uid, u] of users) if (u.topics?.includes("digest")) { const lang = u.lang === "en" ? "en" : "zh"; const d = digestMessage(mk, partners, articles, campaigns, lang); await dm(uid, d.text, d.buttons); }
    state.digestDates = [...state.digestDates.slice(-30), today];
    log("daily brief sent");
  }

  if (blocked.size) { const s2 = readJson(SUBS, { users: {} }); for (const uid of blocked) delete s2.users[uid]; writeJson(SUBS, s2); log(`removed ${blocked.size} blocked users`); }
  for (const k of Object.keys(state.sentListings)) if (Object.keys(state.sentListings).length > 2000) delete state.sentListings[k];
  state.initialized = true;
  if (!DRY) writeJson(STATE, state);
}

const tok = DRY ? "" : token();
if (!DRY && !tok) { console.error("bot token missing"); process.exit(1); }
const run = () => cycle(tok).catch((e) => log(`cycle failed: ${e.message}`));
await run();
if (!ONCE) setInterval(run, 2 * 60 * 1000);

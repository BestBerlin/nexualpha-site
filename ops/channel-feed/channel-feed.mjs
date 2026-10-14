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
import { officialSourceCta } from "./official-source.mjs";
export { isRiskNotice } from "./notice-classifier.mjs";
import { isRiskNotice } from "./notice-classifier.mjs";
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
const LOCALE_PATH = { zh: "/zh-hans", en: "", ru: "/ru", tr: "/tr", vi: "/vi" };
export const CHANNEL_LANGS = Object.freeze(["zh", "en", "ru", "tr", "vi"]);
export function parseChannelTargets(spec) {
  const seen = new Set();
  return String(spec || "").split(",").map((x) => {
    const trimmed = x.trim();
    const sep = trimmed.indexOf(":");
    if (sep <= 0) return null;
    const lang = trimmed.slice(0, sep).trim();
    const chat = trimmed.slice(sep + 1).trim();
    if (!CHANNEL_LANGS.includes(lang) || !/^(?:@[a-zA-Z0-9_]+|-?\d+)$/.test(chat)) return null;
    const key = `${lang}:${chat.toLowerCase()}`;
    if (seen.has(key)) return null;
    seen.add(key);
    return { lang, chat };
  }).filter(Boolean);
}
const CHANNELS = parseChannelTargets(process.env.CHANNEL_FEED_TARGETS || "zh:@NexuAlphaClub");

const NAMES = { okx: "OKX", bitget: "Bitget", binance: "Binance", bybit: "Bybit", kucoin: "KuCoin", kraken: "Kraken", "gate-io": "Gate.io", hyperliquid: "Hyperliquid", mexc: "MEXC", htx: "HTX" };


const COPY = {
  zh: {
    cat: { listing: "上币", event: "活动", delisting: "下架", news: "公告", product: "产品", security: "安全" },
    terms: (p) => [p.share != null ? `手续费最高返还 ${Math.round(p.share * 100)}%` : null, p.autoSettle ? "官方自动结算" : null, p.settle === "hourly" ? "每小时到账" : p.settle === "daily" ? "每天到账" : null, p.inviteCode ? `邀请码 ${p.inviteCode}` : null].filter(Boolean).join(" · "),
    via: (n) => `通过 NexuAlpha 注册 ${n}：`,
    listingGroup: (n) => `【上币】${n} 条新上币`,
    official: "查看官方公告", readExplainer: "阅读解读", riskAction: "查看风险说明", source: "官方来源", sourceText: (domain) => `官方来源：${domain}`, signUp: (n) => `注册 ${n}`, more: "费率对比",
    time: (iso) => new Date(iso).toLocaleString("zh-CN", { timeZone: "Asia/Singapore", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) + "（新加坡时间 SGT）",
  },
  en: {
    cat: { listing: "Listing", event: "Event", delisting: "Delisting", news: "Notice", product: "Product", security: "Security" },
    terms: (p) => [p.share != null ? `up to ${Math.round(p.share * 100)}% back` : null, p.autoSettle ? "settled by the exchange" : null, p.settle === "hourly" ? "paid hourly" : p.settle === "daily" ? "paid daily" : null, p.inviteCode ? `code ${p.inviteCode}` : null].filter(Boolean).join(" · "),
    via: (n) => `Sign up on ${n} via NexuAlpha: `,
    listingGroup: (n) => `[Listing] ${n} new listing notices`,
    official: "Official notice", readExplainer: "Read the explainer", riskAction: "Risk explainer", source: "Official source", sourceText: (domain) => `Official source: ${domain}`, signUp: (n) => `Join ${n}`, more: "Compare fees",
    time: (iso) => new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Singapore", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).replace(/,/g, "") + " SGT",
  },
  // ru/tr/vi channels (2026-10-11): same facts, local wording; time in SGT (site time, 2026-10-13) with the local date format.
  ru: {
    cat: { listing: "Листинг", event: "Акция", delisting: "Делистинг", news: "Объявление", product: "Продукт", security: "Безопасность" },
    terms: (p) => [p.share != null ? `до ${Math.round(p.share * 100)}% возврата` : null, p.autoSettle ? "начисляет биржа" : null, p.settle === "hourly" ? "выплата каждый час" : p.settle === "daily" ? "выплата ежедневно" : null, p.inviteCode ? `код ${p.inviteCode}` : null].filter(Boolean).join(" · "),
    via: (n) => `Регистрация на ${n} через NexuAlpha: `,
    listingGroup: (n) => `[Листинг] ${n} новых уведомлений`,
    official: "Объявление", readExplainer: "Прочитать разбор", riskAction: "Читать разбор риска", source: "Официальный источник", sourceText: (domain) => `Официальный источник: ${domain}`, signUp: (n) => `Регистрация на ${n}`, more: "Сравнить комиссии",
    time: (iso) => new Date(iso).toLocaleString("ru-RU", { timeZone: "Asia/Singapore", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) + " SGT",
  },
  tr: {
    cat: { listing: "Listeleme", event: "Kampanya", delisting: "Listeden çıkarma", news: "Duyuru", product: "Ürün", security: "Güvenlik" },
    terms: (p) => [p.share != null ? `komisyon iadesi en fazla %${Math.round(p.share * 100)}` : null, p.autoSettle ? "borsa tarafından ödenir" : null, p.settle === "hourly" ? "saatlik ödeme" : p.settle === "daily" ? "günlük ödeme" : null, p.inviteCode ? `kod ${p.inviteCode}` : null].filter(Boolean).join(" · "),
    via: (n) => `${n} hesabını NexuAlpha ile aç: `,
    listingGroup: (n) => `[Listeleme] ${n} yeni listeleme duyurusu`,
    official: "Resmî duyuru", readExplainer: "Açıklamayı oku", riskAction: "Risk açıklaması", source: "Resmî kaynak", sourceText: (domain) => `Resmî kaynak: ${domain}`, signUp: (n) => `${n} hesabı aç`, more: "Ücretleri kıyasla",
    time: (iso) => new Date(iso).toLocaleString("tr-TR", { timeZone: "Asia/Singapore", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) + " SGT",
  },
  vi: {
    cat: { listing: "Niêm yết", event: "Sự kiện", delisting: "Hủy niêm yết", news: "Thông báo", product: "Sản phẩm", security: "Bảo mật" },
    terms: (p) => [p.share != null ? `hoàn tới ${Math.round(p.share * 100)}%` : null, p.autoSettle ? "sàn tự động thanh toán" : null, p.settle === "hourly" ? "trả mỗi giờ" : p.settle === "daily" ? "trả mỗi ngày" : null, p.inviteCode ? `mã ${p.inviteCode}` : null].filter(Boolean).join(" · "),
    via: (n) => `Đăng ký ${n} qua NexuAlpha: `,
    listingGroup: (n) => `[Niêm yết] ${n} thông báo niêm yết mới`,
    official: "Thông báo chính thức", readExplainer: "Đọc phần giải thích", riskAction: "Giải thích rủi ro", source: "Nguồn chính thức", sourceText: (domain) => `Nguồn chính thức: ${domain}`, signUp: (n) => `Đăng ký ${n}`, more: "So sánh phí",
    time: (iso) => new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Singapore", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }) + " SGT",
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

// Turkey (owner 2026-10-14): no Bitget channel item in Turkish. Other non-SPK partners still publish as information
// notices, but without sign-up routes.
const BLOCKED_CHANNEL_VENUES = { tr: new Set(["bitget"]) };
const NO_SIGNUP = { tr: new Set(["bitget", "backpack", "hyperliquid"]) };
// Neutral (information-only) locales (owner 2026-10-13; vi: Vietnam Resolution 05/2025/NQ-CP): listings and notices
// post without any sign-up route; exchange campaigns ("event") are not posted at all (null). Kept local so this file
// runs standalone; channel-feed.test.mjs pins it to pilot-01-prototype/src/data/locale-policy.js.
export const NEUTRAL_CTA_LOCALE_LIST = Object.freeze(["ru", "ar", "zh-Hant", "ur", "uk", "vi"]);
export const isNeutralCtaLocale = (lang) => /^(ru|ar|ur|uk|vi)(-|$)|^zh-(Hant|TW|HK)(-|$)/i.test(String(lang || ""));
// Exchanges file many campaigns under "news" or "listing" ("... Futures Challenge", "... Share 150,000 USDC"), so a
// neutral channel also skips anything whose title reads like a promotion. Same pattern as ../alert-sender/alert-sender.mjs.
export const CAMPAIGN_TITLE = /\b(campaign|challenge|giveaway|airdrop|cashback|promotion|promo|bonus|rewards?|prize|leaderboard|competition|tournament|launchpool|launchpad|share\s+[\d,.]+|earn\s+up\s+to|win\s+up\s+to)\b/i;
export const isCampaignLike = (item) => item?.category === "event" || CAMPAIGN_TITLE.test(String(item?.title || ""));
export function buildMessage(item, partnerIn, lang) {
  if (BLOCKED_CHANNEL_VENUES[lang]?.has(item?.venue)) return null;
  const neutral = isNeutralCtaLocale(lang);
  if (neutral && isCampaignLike(item)) return null;
  const risk = isRiskNotice(item);
  const commercial = item?.category === "listing" || isCampaignLike(item);
  const partner = neutral || risk || !commercial || NO_SIGNUP[lang]?.has(item.venue) ? null : partnerIn;
  const c = COPY[lang] || COPY.en;
  const name = NAMES[item.venue] || item.venue;
  const tag = lang === "zh" ? `【${esc(c.cat[item.category] || item.category)}｜${esc(name)}】` : `[${esc(c.cat[item.category] || item.category)} · ${esc(name)}] `;
  const lines = [`<b>${tag}</b>${esc(item.title)}`, `🕒 ${esc(c.time(item.publishedAt))}`];
  if (partner) {
    const terms = c.terms(partner);
    if (terms) lines.push("", `${esc(c.via(name))}${esc(terms)}`);
  }
  const source = officialSourceCta(item.officialSource?.url || item.url, item.venue, { lang, src: `tg-channel-${lang}`, neutral });
  if (source?.textOnly) lines.push("", esc(c.sourceText(source.domain)));
  const row1 = [{ text: risk ? c.riskAction : (c.readExplainer || c.official), url: `${SITE}${LOCALE_PATH[lang] ?? ""}${updatePath(item)}` }];
  if (source?.buttonUrl) row1.push({ text: c.source, url: source.buttonUrl });
  // tracked redirect (2026-10-10): lands on the same registration URL, attributes the click to this channel
  if (partner) row1.push({ text: c.signUp(name), url: `${SITE}/go/${partner.slug}?src=tg-channel-${lang}` });
  const rows = [row1];
  if (!risk) rows.push([{ text: c.more, url: `${SITE}${LOCALE_PATH[lang] ?? ""}/exchanges/${item.venue}` }]);
  return { text: lines.join("\n"), reply_markup: { inline_keyboard: rows } };
}

export const channelStateKey = ({ lang, chat }) => `${lang}:${chat}`;
export const itemSentToChannel = (state, item, channel) => Boolean(state?.posted?.[item.id] || state?.sent?.[item.id]?.[channelStateKey(channel)]);
export const itemComplete = (state, item, channels) => Boolean(state?.posted?.[item.id] || channels.every((channel) => itemSentToChannel(state, item, channel)));

export function markItemChannelSent(state, item, channel, value = new Date().toISOString(), channels = CHANNELS) {
  state.sent ||= {};
  state.sent[item.id] ||= {};
  state.sent[item.id][channelStateKey(channel)] = value;
  if (itemComplete(state, item, channels)) state.posted[item.id] = value;
}

export function selectFreshItems(items, state, channels = CHANNELS, { now = Date.now(), maxPerRun = MAX_PER_RUN, maxAgeMs = MAX_AGE_MS } = {}) {
  const fresh = items.filter((i) => !itemComplete(state, i, channels) && now - Date.parse(i.publishedAt) < maxAgeMs);
  const urgent = fresh.filter(isRiskNotice);
  const routine = fresh.filter((i) => !isRiskNotice(i)).slice(-maxPerRun);
  return [...urgent, ...routine];
}

export function markOldItems(state, items, channels = CHANNELS, { now = Date.now(), maxAgeMs = MAX_AGE_MS } = {}) {
  for (const i of items) if (!itemComplete(state, i, channels) && now - Date.parse(i.publishedAt) >= maxAgeMs) state.posted[i.id] = "skipped-old";
}

export function groupRunItems(items) {
  const groups = [];
  for (const item of items) {
    const groupable = item.category === "listing" && !isRiskNotice(item);
    const last = groups[groups.length - 1];
    if (groupable && last?.type === "listing") last.items.push(item);
    else groups.push({ type: groupable ? "listing" : "single", items: [item] });
  }
  return groups;
}

export function buildListingGroupMessage(items, partnersByVenue, lang, detailLimit = 5) {
  const neutral = isNeutralCtaLocale(lang);
  items = items.filter((item) => !(neutral && isCampaignLike(item)) && !BLOCKED_CHANNEL_VENUES[lang]?.has(item?.venue));
  if (!items.length) return null;
  if (items.length === 1) return buildMessage(items[0], partnersByVenue[items[0].venue], lang);
  const c = COPY[lang] || COPY.en;
  const lines = [`<b>${esc(c.listingGroup(items.length))}</b>`];
  const seenPartners = new Set();
  const partnerButtons = [];
  const sourceButtons = [];
  const renderedItems = items.slice(0, detailLimit);
  for (const item of renderedItems) {
    const name = NAMES[item.venue] || item.venue;
    const updateUrl = `${SITE}${LOCALE_PATH[lang] ?? ""}${updatePath(item)}`;
    lines.push(`• <a href="${updateUrl}">${esc(name)}: ${esc(String(item.title || "").slice(0, 140))}</a> · ${esc(c.time(item.publishedAt))}`);
    const source = officialSourceCta(item.officialSource?.url || item.url, item.venue, { lang, src: `tg-channel-${lang}`, neutral });
    if (source?.buttonUrl && sourceButtons.length < 3) sourceButtons.push({ text: `📄 ${name}`, url: source.buttonUrl });
    else if (source?.url) lines.push(`  ${esc(c.sourceText(source.url))}`);
    const partner = partnersByVenue[item.venue];
    if (!neutral && partner && !NO_SIGNUP[lang]?.has(item.venue) && !seenPartners.has(partner.slug)) {
      seenPartners.add(partner.slug);
      if (partnerButtons.length < 3) partnerButtons.push({ text: c.signUp(name), url: `${SITE}/go/${partner.slug}?src=tg-channel-${lang}` });
    }
  }
  const rows = sourceButtons.length ? [sourceButtons] : [];
  if (partnerButtons.length) rows.push(partnerButtons);
  const feedUrl = `${SITE}${LOCALE_PATH[lang] ?? ""}/activities`;
  if (items.length > renderedItems.length) lines.push(`• <a href="${feedUrl}">${esc(c.listingGroup(items.length - renderedItems.length))} …</a>`);
  rows.push([{ text: c.cat.listing, url: feedUrl }]);
  const text = lines.join("\n");
  if (text.length > 3900 && renderedItems.length) return buildListingGroupMessage(items, partnersByVenue, lang, renderedItems.length - 1);
  return { text, reply_markup: { inline_keyboard: rows } };
}

export function pruneState(state, { max = 3000, keep = 2000 } = {}) {
  const ids = Object.keys(state.posted || {});
  if (ids.length <= max) return;
  for (const id of ids.slice(0, ids.length - keep)) {
    delete state.posted[id];
    delete state.sent?.[id];
  }
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
  const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : { posted: {}, sent: {}, initialized: false };
  state.posted ||= {};
  state.sent ||= {};
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
  const fresh = selectFreshItems(items, state, CHANNELS, { now });
  // anything unseen but too old is recorded so it is never posted late
  markOldItems(state, items, CHANNELS, { now });
  if (!fresh.length) { save(); console.log("no new items"); return; }
  const token = DRY ? "" : readEnv(ENV_FILE).COMMUNITY_BOT_TOKEN;
  if (!DRY && !token) throw new Error("bot token missing in env file");
  for (const group of groupRunItems(fresh)) {
    for (const { lang, chat } of CHANNELS) {
      const channel = { lang, chat };
      const pending = group.items.filter((item) => !itemSentToChannel(state, item, channel));
      if (!pending.length) continue;
      const msg = group.type === "listing" ? buildListingGroupMessage(pending, partners, lang) : buildMessage(pending[0], partners[pending[0].venue], lang);
      if (!msg) {
        if (!DRY) for (const item of pending) markItemChannelSent(state, item, channel, "skipped-null", CHANNELS);
        continue;
      }
      if (DRY) { console.log(`--- ${chat}\n${msg.text}\n${JSON.stringify(msg.reply_markup)}`); continue; }
      await send(token, chat, msg);
      for (const item of pending) markItemChannelSent(state, item, channel, undefined, CHANNELS);
      save();
      await new Promise((r) => setTimeout(r, 1500));
    }
    console.log(`posted ${group.items.map((item) => item.id).join(",")}`);
  }
  // keep the state file small
  pruneState(state);
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

#!/usr/bin/env node
// NexuAlpha Telegram alert sender (owner 2026-10-10). Reads public NexuAlpha data and sends:
//   - market alerts (liquidation spikes, longs-and-shorts liquidated, BTC/ETH sharp moves) to members who turned the
//     topic on in the bot (/alerts), in the member's language (zh, en, ru, tr, vi, id, es, pt; see LANGS), and the
//     high-severity ones to the zh/en channels;
//   - partner-venue listings and campaigns to members subscribed to "listings";
//   - a daily brief at 13:00 UTC (21:00 Beijing) to the channels and "digest" subscribers;
//   - a private funnel report for the owner at 13:05 UTC (OWNER_CHAT_ID; skipped when unset) built from the site's
//     click log (CLICK_EVENT_FILE, read-only mount of /data/private/nexualpha/clicks/go-clicks.jsonl).
// Every alert and the digest end with a "Read more / 查看详情" link back to the site tagged ?src=tg-….
// Sign-up buttons go through https://nexualpha.com/go/<partner>?src=... so clicks are attributed; the redirect lands on
// the unchanged partner link. Idempotent via a state file; DMs are rate-limited; users who blocked the bot are removed.
import { readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { runChannelRhythm } from "./channel-rhythm.mjs";
import { deliverOnce } from "../channel-feed/delivery-receipts.mjs";
export { deliverOnce, assertTelegramOk } from "../channel-feed/delivery-receipts.mjs";
import { countSubscribers, funnelReportMessage, parseClickLines, summarizeClicks } from "./funnel-report.mjs";
import { countTriggers, evaluateTriggers, loadTriggers, moveCoins } from "./alert-triggers.mjs";
import { isNeutralCtaLocale, orderVenues, todayBlock, todayTitle } from "./site-features.mjs";
import { isRiskNotice } from "../channel-feed/notice-classifier.mjs";
import { officialSourceCta, sourceUpdatePath } from "../channel-feed/official-source.mjs";

const SITE = "https://nexualpha.com";
const SUBS = process.env.ALERT_SUBSCRIPTIONS_FILE || "/var/lib/crypto-telegram-ops/alert-subscriptions.json";
const STATE = process.env.ALERT_STATE_FILE || "/var/lib/nexualpha-alerts/state.json";
// Custom /alert rules, written by the bot poller; mounted read-only here (missing file = no rules).
const TRIGGERS = process.env.ALERT_TRIGGERS_FILE || "/var/lib/crypto-telegram-ops/alert-triggers.json";
const ENV_FILE = process.env.BOT_ENV_FILE || "/srv/agent/stacks/crypto-telegram-ops/community-poller.env";
// Per-language channels (2026-10-11 owner approved ru/tr/vi): ALERT_CHANNELS="zh:@NexuAlphaClub,en:@NexuAlphaGlobal,ru:@NexuAlphaRU,tr:-100…"
// (private channels use their numeric -100 id). Unknown languages are dropped so a typo never posts English to a local channel.
export const parseChannels = (spec) => Object.fromEntries(String(spec || "").split(",").map((x) => x.trim()).filter(Boolean)
  .map((x) => [x.slice(0, x.indexOf(":")), x.slice(x.indexOf(":") + 1)]).filter(([lang, chat]) => LANGS.includes(lang) && chat));
const CHANNELS_SPEC = process.env.ALERT_CHANNELS || "zh:@NexuAlphaClub,en:@NexuAlphaGlobal";
const OWNER_CHAT_ID = (process.env.OWNER_CHAT_ID || "").trim();
const CLICKS = process.env.CLICK_EVENT_FILE || "";
// Message languages = the /alerts card languages (2026-10-11): zh, en, ru, tr, vi, id, es, pt. Anyone else gets English.
// Channels follow ALERT_CHANNELS (one channel per language); DMs follow state.lang from alert-subscriptions.json.
export const LANGS = ["zh", "en", "ru", "tr", "vi", "id", "es", "pt"];
const CHANNELS = parseChannels(CHANNELS_SPEC);
export const msgLang = (u) => (isNeutralCtaLocale(u?.lang) ? u.lang : LANGS.includes(u?.lang) ? u.lang : "en");
// Site locale path per message language (en is the unprefixed root) and the news-feed locale key for article editions.
export const LOCALE_PATH = { zh: "/zh-hans", en: "", ru: "/ru", tr: "/tr", vi: "/vi", id: "/id-id", es: "/es", pt: "/pt-br" };
export const ARTICLE_LOCALE = { zh: "zh-Hans", en: "en", ru: "ru", tr: "tr", vi: "vi", id: "id", es: "es", pt: "pt-BR" };
const FLASH_LOCALE = { zh: "zh-Hans", pt: "pt-BR" };
const INTL = { ru: "ru-RU", tr: "tr-TR", vi: "vi-VN", id: "id-ID", es: "es-ES", pt: "pt-BR" };
const DRY = process.argv.includes("--dry-run");
const ONCE = process.argv.includes("--once");
const log = (m) => console.log(`[alerts] ${new Date().toISOString()} ${m}`);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// zh/en keep their original formatting (120.0M, 100,000, -2.1%); the other languages format through Intl
// (ru "120 млн $", tr "$120 Mn" and "%60", pt-BR "US$ 120 mi"), so a Turkish reader sees -%2,1 rather than -2.1%.
const usd = (n) => (n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1e3)}K`);
export const fmt = {
  usd: (lang, n) => (INTL[lang] ? new Intl.NumberFormat(INTL[lang], { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(n) : usd(n)),
  num: (lang, n) => (INTL[lang] ? new Intl.NumberFormat(INTL[lang], { maximumFractionDigits: 2 }).format(n) : n.toLocaleString("en-US")),
  // signed: the digest prefixes "+" on gains (zh/en legacy); event lines print the raw number. Intl always signs non-zero values.
  pct: (lang, p, signed = false) => (INTL[lang] ? new Intl.NumberFormat(INTL[lang], { style: "percent", signDisplay: "exceptZero", maximumFractionDigits: 2 }).format(p / 100) : `${signed && p > 0 ? "+" : ""}${p}%`),
};
const go = (slug, src) => `${SITE}/go/${slug}?src=${src}`;
// Backlink to the site, locale-prefixed like the digest article links, with a src tag so the visit is attributable.
export const sitePath = (lang, p, src) => `${SITE}${LOCALE_PATH[lang] ?? ""}${p}?src=${src}`;
export const readMore = (lang, p, src) => `<a href="${sitePath(lang, p, src)}">${T(lang).readMore}</a>`;
export const BACKLINK_PATH = { "liquidation-spike": "/liquidations", "both-sides-liquidated": "/liquidations", "sharp-move": "/liquidations", listing: "/activities", digest: "/news" };

function readJson(file, fallback) { try { return JSON.parse(readFileSync(file, "utf8")); } catch { return fallback; } }
function readState(file, fallback) {
  try {
    const state = JSON.parse(readFileSync(file, "utf8"));
    if (!state || typeof state !== "object" || Array.isArray(state)) throw new Error("root is not an object");
    return state;
  }
  catch (error) {
    if (error.code === "ENOENT") return structuredClone(fallback);
    throw new Error(`state file unreadable; refusing to send: ${error.message}`);
  }
}
function writeJson(file, data) { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(`${file}.tmp`, JSON.stringify(data)); renameSync(`${file}.tmp`, file); }
export function token(file = ENV_FILE) {
  const line = readFileSync(file, "utf8").split("\n").find((l) => l.startsWith("COMMUNITY_BOT_TOKEN="));
  return line ? line.slice("COMMUNITY_BOT_TOKEN=".length).trim().replace(/^["']|["']$/g, "") : "";
}
export async function sendPhoto(tok, chat, png, caption, fetcher = fetch) {
  const form = new FormData();
  form.set("chat_id", chat);
  form.set("caption", caption);
  form.set("photo", new Blob([png], { type: "image/png" }), "daily.png");
  const res = await fetcher(`https://api.telegram.org/bot${tok}/sendPhoto`, {
    method: "POST", redirect: "error", signal: AbortSignal.timeout(15000), body: form,
  });
  const body = await res.json().catch(() => null);
  const ok = res.ok && body?.ok === true && Boolean(body.result?.message_id);
  // On failure keep the HTTP status and Telegram's description (never the request URL, which contains the token).
  return ok ? { ok, id: body.result.message_id } : { ok, id: body?.result?.message_id, status: res.status, error: String(body?.description || 'no message id returned').slice(0, 300) };
}
const sourceStatus = {};
async function getJson(url) {
  const key = new URL(url).pathname;
  try {
    const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}r=${Date.now()}`, { headers: { "user-agent": "NexuAlphaAlerts/1.0" }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
    const data = await res.json();
    sourceStatus[key] = { status: "ok", updatedAt: new Date().toISOString() };
    return data;
  } catch (error) {
    sourceStatus[key] = { status: "failed", updatedAt: new Date().toISOString() };
    throw error;
  }
}
// Binance public API without the cache-buster query (getJson adds ?r= for our CDN-cached site files only).
async function getBinance(url) {
  const res = await fetch(url, { headers: { "user-agent": "NexuAlphaAlerts/1.0" }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return res.json();
}
async function send(tok, chat, text, buttons) {
  if (DRY) { log(`DRY -> ${chat}: ${text.split("\n")[0]}`); return { ok: true }; }
  const res = await fetch(`https://api.telegram.org/bot${tok}/sendMessage`, {
    method: "POST", headers: { "content-type": "application/json" }, signal: AbortSignal.timeout(15000),
    body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true, reply_markup: buttons ? { inline_keyboard: buttons } : undefined }),
  });
  const body = await res.json().catch(() => ({}));
  return res.ok && body?.ok === true ? body : {
    ok: false,
    error_code: body?.error_code || res.status,
    description: String(body?.description || `HTTP ${res.status}`).slice(0, 300),
    parameters: body?.parameters,
  };
}
async function sendPoll(tok, chat, poll) {
  if (DRY) { log(`DRY poll -> ${chat}: ${poll.question}`); return { ok: true }; }
  const res = await fetch(`https://api.telegram.org/bot${tok}/sendPoll`, {
    method: "POST", headers: { "content-type": "application/json" }, signal: AbortSignal.timeout(15000),
    body: JSON.stringify({ chat_id: chat, question: poll.question, options: poll.options, is_anonymous: poll.is_anonymous }),
  });
  const body = await res.json().catch(() => ({}));
  return res.ok && body?.ok === true ? body : {
    ok: false,
    error_code: body?.error_code || res.status,
    description: String(body?.description || `HTTP ${res.status}`).slice(0, 300),
    parameters: body?.parameters,
  };
}

// ---------- texts ----------
// One table per language. zh and en reproduce the original wording byte for byte (fixtures/zh-en-baseline.json pins
// them); ru/tr/vi/id/es/pt were written as natural copy, informational tone, no referral solicitation (ru especially).
// `head` and the digest/listing labels are plain text. Owner 2026-10-12: no commission/data footer on channel messages.
const TEXTS = {
  zh: {
    head: { "liquidation-spike": "💥 爆仓激增", "both-sides-liquidated": "⚔️ 多空双杀", "sharp-move": "⚡ 急涨急跌" },
    liq1h: (l, s) => `1 小时爆仓：多 ${l} / 空 ${s} 美元`, liq24h: (l, s) => `24 小时爆仓：多 ${l} / 空 ${s} 美元`,
    major: (sym, price, p1, p24) => `${sym} ${price}（1h ${p1}，24h ${p24}）`,
    largest: (sym, side, usd) => `最大单笔：${sym} ${side === "long" ? "多单" : "空单"} ${usd} 美元`,
    advice: "降低杠杆、确认强平价，行情剧烈时资金费率也会跳变。",
    digestTitle: "<b>🗞 NexuAlpha 每日市场简报</b>", digestLiq: (l, s) => `24h 爆仓（下限）：多 ${l} / 空 ${s} 美元`, movers: "异动：",
    todayOn: "<b>今日文章</b>", campaigns: "<b>交易所活动</b>", cat: { listing: "上币", event: "活动" },
    listingHead: (cat, name) => `【${cat}｜${name}】`, officialNotice: "官方公告", readExplainer: "阅读解读", officialSource: "官方来源", sourceText: (url) => `官方来源：${url}`,
    signUp: (name) => `注册 ${name}（返佣）`, signUpListing: (name) => `注册 ${name}`, getAlerts: "🔔 订阅告警", fundingRates: "📊 资金费率", readMore: "查看详情 →",
    // unchanged from the original sender, whose strip pattern never matched the zh text: zh listing DMs keep the data clause
  },
  en: {
    head: { "liquidation-spike": "💥 Liquidation spike", "both-sides-liquidated": "⚔️ Longs and shorts both liquidated", "sharp-move": "⚡ Sharp move" },
    liq1h: (l, s) => `1h liquidations: long ${l} / short ${s} USD`, liq24h: (l, s) => `24h liquidations: long ${l} / short ${s} USD`,
    major: (sym, price, p1, p24) => `${sym} ${price} (1h ${p1}, 24h ${p24})`,
    largest: (sym, side, usd) => `Largest: ${sym} ${side} ${usd} USD`,
    advice: "Lower leverage, check your liquidation price; funding rates jump in moves like this.",
    digestTitle: "<b>🗞 NexuAlpha daily brief</b>", digestLiq: (l, s) => `24h liquidations (lower bound): long ${l} / short ${s} USD`, movers: "Movers: ",
    todayOn: "<b>Today on NexuAlpha</b>", campaigns: "<b>Exchange campaigns</b>", cat: { listing: "Listing", event: "Campaign" },
    listingHead: (cat, name) => `[${cat} · ${name}] `, officialNotice: "Official notice", readExplainer: "Read the explainer", officialSource: "Official source", sourceText: (url) => `Official source: ${url}`,
    signUp: (name) => `Sign up on ${name}`, signUpListing: (name) => `Sign up on ${name}`, getAlerts: "🔔 Get alerts", fundingRates: "📊 Funding rates", readMore: "Read more →",
  },
  ru: {
    head: { "liquidation-spike": "💥 Всплеск ликвидаций", "both-sides-liquidated": "⚔️ Ликвидированы и лонги, и шорты", "sharp-move": "⚡ Резкое движение" },
    liq1h: (l, s) => `Ликвидации за 1 ч: лонги ${l} / шорты ${s}`, liq24h: (l, s) => `Ликвидации за 24 ч: лонги ${l} / шорты ${s}`,
    major: (sym, price, p1, p24) => `${sym} ${price} (1 ч ${p1}, 24 ч ${p24})`,
    largest: (sym, side, usd) => `Крупнейшая: ${sym} ${side === "long" ? "лонг" : "шорт"} ${usd}`,
    advice: "Снизьте плечо и проверьте цену ликвидации: при таких движениях ставки финансирования тоже меняются скачками.",
    digestTitle: "<b>🗞 Ежедневная сводка NexuAlpha</b>", digestLiq: (l, s) => `Ликвидации за 24 ч (нижняя оценка): лонги ${l} / шорты ${s}`, movers: "Лидеры движения: ",
    todayOn: "<b>Сегодня на NexuAlpha</b>", campaigns: "<b>Акции бирж</b>", cat: { listing: "Листинг", event: "Акция" },
    listingHead: (cat, name) => `[${cat} · ${name}] `, officialNotice: "Официальное объявление", readExplainer: "Прочитать разбор", officialSource: "Официальный источник", sourceText: (url) => `Официальный источник: ${url}`,
    signUp: (name) => name, signUpListing: (name) => name, getAlerts: "🔔 Получать оповещения", fundingRates: "📊 Ставки финансирования", readMore: "Подробнее →",
  },
  tr: {
    head: { "liquidation-spike": "💥 Likidasyon patlaması", "both-sides-liquidated": "⚔️ Long ve short pozisyonlar birlikte likide edildi", "sharp-move": "⚡ Sert hareket" },
    liq1h: (l, s) => `1 saatlik likidasyon: long ${l} / short ${s}`, liq24h: (l, s) => `24 saatlik likidasyon: long ${l} / short ${s}`,
    major: (sym, price, p1, p24) => `${sym} ${price} (1 sa ${p1}, 24 sa ${p24})`,
    largest: (sym, side, usd) => `En büyük: ${sym} ${side} ${usd}`,
    advice: "Kaldıracı düşürün ve likidasyon fiyatınızı kontrol edin; böyle hareketlerde fonlama oranları da sıçrar.",
    digestTitle: "<b>🗞 NexuAlpha günlük özet</b>", digestLiq: (l, s) => `24 saatlik likidasyon (alt sınır): long ${l} / short ${s}`, movers: "Hareketliler: ",
    todayOn: "<b>Bugün NexuAlpha'da</b>", campaigns: "<b>Borsa kampanyaları</b>", cat: { listing: "Listeleme", event: "Kampanya" },
    listingHead: (cat, name) => `[${cat} · ${name}] `, officialNotice: "Resmi duyuru", readExplainer: "Açıklamayı oku", officialSource: "Resmî kaynak", sourceText: (url) => `Resmî kaynak: ${url}`,
    signUp: (name) => `${name} hesabı aç`, signUpListing: (name) => `${name} hesabı aç`, getAlerts: "🔔 Uyarı al", fundingRates: "📊 Fonlama oranları", readMore: "Devamını oku →",
  },
  vi: {
    head: { "liquidation-spike": "💥 Thanh lý tăng vọt", "both-sides-liquidated": "⚔️ Cả long và short đều bị thanh lý", "sharp-move": "⚡ Biến động mạnh" },
    liq1h: (l, s) => `Thanh lý 1 giờ: long ${l} / short ${s}`, liq24h: (l, s) => `Thanh lý 24 giờ: long ${l} / short ${s}`,
    major: (sym, price, p1, p24) => `${sym} ${price} (1h ${p1}, 24h ${p24})`,
    largest: (sym, side, usd) => `Lệnh lớn nhất: ${sym} ${side} ${usd}`,
    advice: "Hạ đòn bẩy và kiểm tra giá thanh lý; phí funding cũng nhảy mạnh trong những đợt biến động như thế này.",
    digestTitle: "<b>🗞 Bản tin hằng ngày NexuAlpha</b>", digestLiq: (l, s) => `Thanh lý 24 giờ (mức tối thiểu): long ${l} / short ${s}`, movers: "Biến động: ",
    todayOn: "<b>Hôm nay trên NexuAlpha</b>", campaigns: "<b>Sự kiện sàn giao dịch</b>", cat: { listing: "Niêm yết", event: "Sự kiện" },
    listingHead: (cat, name) => `[${cat} · ${name}] `, officialNotice: "Thông báo chính thức", readExplainer: "Đọc phần giải thích", officialSource: "Nguồn chính thức", sourceText: (url) => `Nguồn chính thức: ${url}`,
    signUp: (name) => `Đăng ký ${name}`, signUpListing: (name) => `Đăng ký ${name}`, getAlerts: "🔔 Nhận cảnh báo", fundingRates: "📊 Phí funding", readMore: "Xem chi tiết →",
  },
  id: {
    head: { "liquidation-spike": "💥 Lonjakan likuidasi", "both-sides-liquidated": "⚔️ Long dan short sama-sama terlikuidasi", "sharp-move": "⚡ Pergerakan tajam" },
    liq1h: (l, s) => `Likuidasi 1 jam: long ${l} / short ${s}`, liq24h: (l, s) => `Likuidasi 24 jam: long ${l} / short ${s}`,
    major: (sym, price, p1, p24) => `${sym} ${price} (1 jam ${p1}, 24 jam ${p24})`,
    largest: (sym, side, usd) => `Terbesar: ${sym} ${side} ${usd}`,
    advice: "Turunkan leverage dan cek harga likuidasi Anda; funding rate juga melonjak pada pergerakan seperti ini.",
    digestTitle: "<b>🗞 Ringkasan harian NexuAlpha</b>", digestLiq: (l, s) => `Likuidasi 24 jam (batas bawah): long ${l} / short ${s}`, movers: "Pergerakan: ",
    todayOn: "<b>Hari ini di NexuAlpha</b>", campaigns: "<b>Kampanye bursa</b>", cat: { listing: "Listing", event: "Kampanye" },
    listingHead: (cat, name) => `[${cat} · ${name}] `, officialNotice: "Pengumuman resmi", readExplainer: "Baca penjelasan", officialSource: "Sumber resmi", sourceText: (url) => `Sumber resmi: ${url}`,
    signUp: (name) => `Daftar di ${name}`, signUpListing: (name) => `Daftar di ${name}`, getAlerts: "🔔 Dapatkan notifikasi", fundingRates: "📊 Funding rate", readMore: "Baca selengkapnya →",
  },
  es: {
    head: { "liquidation-spike": "💥 Pico de liquidaciones", "both-sides-liquidated": "⚔️ Largos y cortos liquidados a la vez", "sharp-move": "⚡ Movimiento brusco" },
    liq1h: (l, s) => `Liquidaciones 1 h: largos ${l} / cortos ${s}`, liq24h: (l, s) => `Liquidaciones 24 h: largos ${l} / cortos ${s}`,
    major: (sym, price, p1, p24) => `${sym} ${price} (1 h ${p1}, 24 h ${p24})`,
    largest: (sym, side, usd) => `Mayor liquidación: ${sym} ${side === "long" ? "largo" : "corto"} ${usd}`,
    advice: "Baja el apalancamiento y revisa tu precio de liquidación; en movimientos así las tasas de financiación también saltan.",
    digestTitle: "<b>🗞 Resumen diario de NexuAlpha</b>", digestLiq: (l, s) => `Liquidaciones 24 h (mínimo estimado): largos ${l} / cortos ${s}`, movers: "Movimientos: ",
    todayOn: "<b>Hoy en NexuAlpha</b>", campaigns: "<b>Campañas de exchanges</b>", cat: { listing: "Listado", event: "Campaña" },
    listingHead: (cat, name) => `[${cat} · ${name}] `, officialNotice: "Aviso oficial", readExplainer: "Leer la explicación", officialSource: "Fuente oficial", sourceText: (url) => `Fuente oficial: ${url}`,
    signUp: (name) => `Regístrate en ${name}`, signUpListing: (name) => `Regístrate en ${name}`, getAlerts: "🔔 Recibir alertas", fundingRates: "📊 Tasas de financiación", readMore: "Leer más →",
  },
  pt: {
    head: { "liquidation-spike": "💥 Pico de liquidações", "both-sides-liquidated": "⚔️ Longs e shorts liquidados ao mesmo tempo", "sharp-move": "⚡ Movimento brusco" },
    liq1h: (l, s) => `Liquidações 1 h: long ${l} / short ${s}`, liq24h: (l, s) => `Liquidações 24 h: long ${l} / short ${s}`,
    major: (sym, price, p1, p24) => `${sym} ${price} (1 h ${p1}, 24 h ${p24})`,
    largest: (sym, side, usd) => `Maior liquidação: ${sym} ${side} ${usd}`,
    advice: "Reduza a alavancagem e confira seu preço de liquidação; em movimentos assim as taxas de funding também disparam.",
    digestTitle: "<b>🗞 Resumo diário NexuAlpha</b>", digestLiq: (l, s) => `Liquidações 24 h (estimativa mínima): long ${l} / short ${s}`, movers: "Destaques: ",
    todayOn: "<b>Hoje na NexuAlpha</b>", campaigns: "<b>Campanhas das corretoras</b>", cat: { listing: "Listagem", event: "Campanha" },
    listingHead: (cat, name) => `[${cat} · ${name}] `, officialNotice: "Aviso oficial", readExplainer: "Ler a explicação", officialSource: "Fonte oficial", sourceText: (url) => `Fonte oficial: ${url}`,
    signUp: (name) => `Cadastre-se na ${name}`, signUpListing: (name) => `Cadastre-se na ${name}`, getAlerts: "🔔 Receber alertas", fundingRates: "📊 Taxas de funding", readMore: "Saiba mais →",
  },
};
export const T = (lang) => TEXTS[lang] || TEXTS.en;
const RISK_ACTION = {
  zh: "💥 爆仓数据",
  en: "💥 Liquidations",
  ru: "💥 Ликвидации",
  tr: "💥 Likidasyonlar",
  vi: "💥 Thanh lý",
  id: "💥 Likuidasi",
  es: "💥 Liquidaciones",
  pt: "💥 Liquidações",
};

// ---------- message builders ----------
// Partner buttons are capped to one row: TG-05 keeps sign-up actions on commercial posts, but removes the old
// six-venue block from risk contexts.
// Turkey: only partners whose Turkish entity is on the SPK "operating" list (OKX TR, Binance Turkey, Bybit) — Bitget
// Teknoloji AŞ is on the liquidation list.
export const PARTNER_ROWS = { default: [null], tr: [["okx", "binance", "bybit"]] };
export const PARTNER_EXCLUDED = { tr: new Set(["bitget", "backpack", "hyperliquid"]) };
// Neutral locales (ru, vi, ...; owner 2026-10-13): the exchange name only, linking to the site's exchange page,
// never a /go/ sign-up route.
export const exchangePageUrl = (lang, slug, src) => `${SITE}${LOCALE_PATH[lang] ?? ""}/exchanges/${slug}?src=${src}`;
export function partnerButtons(partners, lang, src) {
  const t = T(lang);
  const bySlug = Object.fromEntries(partners.map((p) => [p.slug, p]));
  const excluded = PARTNER_EXCLUDED[lang] || new Set();
  const neutral = isNeutralCtaLocale(lang);
  const configuredRows = neutral ? [null, ["bybit", "hyperliquid", "backpack"]] : (PARTNER_ROWS[lang] || PARTNER_ROWS.default);
  // "(返佣)"-style wording only where a rebate share is confirmed in partners.json
  const button = (p) => (neutral ? { text: p.name, url: exchangePageUrl(lang, p.slug, src) }
    : { text: p.share === null ? t.signUpListing(p.name) : t.signUp(p.name), url: go(p.slug, src) });
  const rows = configuredRows.map((row) =>
    (row === null ? orderVenues(partners.filter((p) => p.featured && !excluded.has(p.slug)), lang).slice(0, 3) : row.map((slug) => bySlug[slug]).filter((p) => p && !excluded.has(p.slug)))
      .map(button)).filter((row) => row.length);
  return [
    ...rows,
    [{ text: t.getAlerts, url: "https://t.me/NexuAlphaAssistantBot?start=alerts" },
     { text: t.fundingRates, url: `${SITE}${LOCALE_PATH[lang] ?? ""}/funding-rates` }],
  ];
}

export function eventButtons(lang, src) {
  return [[
    { text: RISK_ACTION[lang] || RISK_ACTION.en, url: sitePath(lang, "/liquidations", src) },
  ]];
}

export function eventMessage(ev, mk, lang) {
  const t = T(lang);
  const L = mk.liquidations;
  const btc = mk.market.majors.find((m) => m.symbol === "BTCUSDT"), eth = mk.market.majors.find((m) => m.symbol === "ETHUSDT");
  const lines = [`<b>${t.head[ev.type]}</b>`, t.liq1h(fmt.usd(lang, L.h1.longUsd), fmt.usd(lang, L.h1.shortUsd)), t.liq24h(fmt.usd(lang, L.h24.longUsd), fmt.usd(lang, L.h24.shortUsd))];
  if (btc) lines.push(t.major("BTC", fmt.num(lang, btc.price), fmt.pct(lang, btc.change1hPct), fmt.pct(lang, btc.change24hPct)));
  if (eth) lines.push(t.major("ETH", fmt.num(lang, eth.price), fmt.pct(lang, eth.change1hPct), fmt.pct(lang, eth.change24hPct)));
  if (L.h1.largest) lines.push(t.largest(esc(L.h1.largest.symbol), L.h1.largest.side, fmt.usd(lang, L.h1.largest.usd)));
  lines.push("", t.advice, "", readMore(lang, BACKLINK_PATH[ev.type] || "/liquidations", "tg-alert"));
  return lines.join("\n");
}

// Article link for the digest: the reader's locale edition when the feed lists it in availableLocales (feeds without
// that field fall back to "a title in that locale exists"), otherwise the English URL and title.
export function articleLink(a, lang) {
  const loc = ARTICLE_LOCALE[lang] || "en";
  const hasEdition = Array.isArray(a.availableLocales) ? a.availableLocales.includes(loc) : Boolean(a.title?.[loc]);
  const localized = loc !== "en" && hasEdition;
  const fallbackLabel = lang === "ru" && !localized ? " (EN)" : "";
  const title = `${(localized ? a.title?.[loc] : null) || a.title?.en || a.slug}${fallbackLabel}`;
  return `• <a href="${SITE}${localized ? LOCALE_PATH[lang] : ""}/news/${a.slug}">${esc(title)}</a>`;
}

// Türkiye: no Bitget anywhere (titles, venues). Applies to digest articles and campaigns.
const noBitget = (lang, ...texts) => !(lang === "tr" && texts.some((s) => /bitget/i.test(String(s || ""))));

// `today` (owner 2026-10-13) = { now, flash, calendar }: adds the "today on NexuAlpha" block (1–2 rotating site
// features, top Important flash items of the last 24 h, today's calendar events in SGT) and caps articles at 2.
// Without it the digest is the original layout (fixtures/zh-en-baseline.json).
export function digestMessage(mk, partners, articles, campaigns, lang, today = null) {
  const t = T(lang);
  const L = mk.liquidations.h24;
  const lines = [t.digestTitle, ""];
  articles = articles.filter((a) => noBitget(lang, a.title?.[ARTICLE_LOCALE[lang]], a.title?.en, a.slug));
  // neutral locales (ru, vi, ...): no exchange campaigns in the digest
  campaigns = isNeutralCtaLocale(lang) ? [] : campaigns.filter((c) => noBitget(lang, c.venue, c.title));
  for (const m of mk.market.majors.slice(0, 4)) lines.push(`${m.symbol.replace("USDT", "")} ${fmt.num(lang, m.price)}  ${fmt.pct(lang, m.change24hPct, true)}`);
  lines.push("", t.digestLiq(fmt.usd(lang, L.longUsd), fmt.usd(lang, L.shortUsd)));
  if (mk.market.movers.length) lines.push(t.movers + mk.market.movers.slice(0, 3).map((m) => `${m.symbol.replace("USDT", "")} ${fmt.pct(lang, m.change24hPct, true)}`).join(" · "));
  if (today) {
    const recapLines = articles.slice(0, 2).map((a) => articleLink(a, lang));
    lines.push("", todayTitle(lang), ...todayBlock({ ...today, lang, recapLines }));
  } else if (articles.length) {
    lines.push("", t.todayOn);
    for (const a of articles.slice(0, 4)) lines.push(articleLink(a, lang));
  }
  if (campaigns.length) {
    lines.push("", t.campaigns);
    for (const c of campaigns.slice(0, 3)) {
      const source = officialSourceCta(c.url, c.venue, { lang, src: `tg-digest-${lang}`, neutral: isNeutralCtaLocale(lang) });
      if (source?.buttonUrl) lines.push(`• ${esc(c.venue.toUpperCase())}: <a href="${source.buttonUrl}">${esc(c.title.slice(0, 90))}</a>`);
      else lines.push(`• ${esc(c.venue.toUpperCase())}: ${esc(c.title.slice(0, 90))}${source?.url ? `\n  ${esc(t.sourceText(source.url))}` : ""}`);
    }
  }
  lines.push("", readMore(lang, BACKLINK_PATH.digest, "tg-digest"));
  return { text: lines.join("\n"), buttons: partnerButtons(partners, lang, `tg-digest-${lang}`) };
}

// Campaign-like titles filed as listings/news (same pattern as ../channel-feed/channel-feed.mjs).
export const CAMPAIGN_TITLE = /\b(campaign|challenge|giveaway|airdrop|cashback|promotion|promo|bonus|rewards?|prize|leaderboard|competition|tournament|launchpool|launchpad|share\s+[\d,.]+|earn\s+up\s+to|win\s+up\s+to)\b/i;
/** Listing/campaign DM; null for a campaign (category "event" or a promotion-like title) in a neutral locale. */
export function listingMessage(item, partner, lang) {
  const t = T(lang);
  const neutral = isNeutralCtaLocale(lang);
  if (neutral && (item.category === "event" || CAMPAIGN_TITLE.test(String(item.title || "")))) return null;
  const risk = isRiskNotice(item);
  const cat = t.cat[item.category] || item.category;
  const source = officialSourceCta(item.officialSource?.url || item.url, partner.slug, { lang, src: `tg-dm-listing-${lang}`, neutral });
  const lines = [`<b>${t.listingHead(cat, esc(partner.name))}</b>${esc(item.title)}`];
  if (source?.textOnly) lines.push("", esc(t.sourceText(source.url)));
  lines.push("", readMore(lang, neutral ? "/news" : BACKLINK_PATH.listing, "tg-listing"));
  const text = lines.join("\n");
  const first = { text: t.readExplainer || t.officialNotice, url: `${SITE}${LOCALE_PATH[lang] ?? ""}${sourceUpdatePath({ ...item, venue: item.venue || partner.slug })}?src=tg-dm-listing-${lang}` };
  const row = [first];
  if (source?.buttonUrl) row.push({ text: t.officialSource, url: source.buttonUrl });
  if (!risk) {
    const second = neutral ? { text: partner.name, url: exchangePageUrl(lang, partner.slug, `tg-dm-listing-${lang}`) }
      : { text: t.signUpListing(partner.name), url: go(partner.slug, `tg-dm-listing-${lang}`) };
    row.push(second);
  }
  return { text, buttons: [row] };
}

const GROUP_HEAD = {
  zh: (n) => `【上币】${n} 条新上币`,
  en: (n) => `[Listing] ${n} new listing notices`,
  ru: (n) => `[Листинг] ${n} новых уведомлений`,
  tr: (n) => `[Listeleme] ${n} yeni listeleme duyurusu`,
  vi: (n) => `[Niêm yết] ${n} thông báo niêm yết mới`,
  id: (n) => `[Listing] ${n} pengumuman listing baru`,
  es: (n) => `[Listado] ${n} nuevos avisos de listado`,
  pt: (n) => `[Listagem] ${n} novos avisos de listagem`,
};
const GROUP_MORE = {
  zh: (n) => `另有 ${n} 条，打开列表查看。`,
  en: (n) => `${n} more in the listing feed.`,
  ru: (n) => `Еще ${n} в ленте листингов.`,
  tr: (n) => `${n} duyuru daha listeleme akışında.`,
  vi: (n) => `Còn ${n} tin trong luồng niêm yết.`,
  id: (n) => `${n} lainnya di feed listing.`,
  es: (n) => `${n} más en el feed de listados.`,
  pt: (n) => `${n} mais no feed de listagens.`,
};
const GROUP_DETAIL_LIMIT = 5;
export function groupListingItems(items) {
  const groups = [];
  for (const item of items) {
    const grouped = item.category === "listing" && !CAMPAIGN_TITLE.test(String(item.title || "")) && !isRiskNotice(item);
    const last = groups[groups.length - 1];
    if (grouped && last?.type === "listing") last.items.push(item);
    else groups.push({ type: grouped ? "listing" : "single", items: [item] });
  }
  return groups;
}
export function listingGroupMessage(items, bySlug, lang, detailLimit = GROUP_DETAIL_LIMIT) {
  const t = T(lang);
  const neutral = isNeutralCtaLocale(lang);
  items = items.filter((item) => !(neutral && (item.category === "event" || CAMPAIGN_TITLE.test(String(item.title || "")))));
  if (!items.length) return null;
  if (items.length === 1) return listingMessage(items[0], bySlug[items[0].venue], lang);
  const lines = [`<b>${esc((GROUP_HEAD[lang] || GROUP_HEAD.en)(items.length))}</b>`];
  const renderedItems = items.slice(0, detailLimit);
  const sourceButtons = [];
  const actionButtons = [];
  const seen = new Set();
  for (const item of renderedItems) {
    const partner = bySlug[item.venue];
    if (!partner) continue;
    const update = `${SITE}${LOCALE_PATH[lang] ?? ""}${sourceUpdatePath({ ...item, venue: item.venue || partner.slug })}?src=tg-dm-listing-${lang}`;
    lines.push(`• <a href="${update}">${esc(partner.name)}: ${esc(String(item.title || "").slice(0, 140))}</a>`);
    const source = officialSourceCta(item.officialSource?.url || item.url, partner.slug, { lang, src: `tg-dm-listing-${lang}`, neutral });
    if (source?.buttonUrl && sourceButtons.length < 3) sourceButtons.push({ text: `${t.officialSource} · ${partner.name}`, url: source.buttonUrl });
    else if (source?.url) lines.push(`  ${esc(t.sourceText(source.url))}`);
    if (!seen.has(partner.slug) && actionButtons.length < 3) {
      seen.add(partner.slug);
      actionButtons.push(neutral
        ? { text: partner.name, url: exchangePageUrl(lang, partner.slug, `tg-dm-listing-${lang}`) }
        : { text: t.signUpListing(partner.name), url: go(partner.slug, `tg-dm-listing-${lang}`) });
    }
  }
  if (items.length > renderedItems.length) lines.push(`• ${esc((GROUP_MORE[lang] || GROUP_MORE.en)(items.length - renderedItems.length))}`);
  lines.push("", readMore(lang, neutral ? "/news" : BACKLINK_PATH.listing, "tg-listing"));
  const buttons = [];
  if (sourceButtons.length) buttons.push(sourceButtons);
  if (actionButtons.length) buttons.push(actionButtons);
  const text = lines.join("\n");
  // Long source URLs and HTML escaping also consume the payload budget. Keep the full count and feed link.
  if (text.length > 3900 && renderedItems.length) return listingGroupMessage(items, bySlug, lang, renderedItems.length - 1);
  return { text, buttons };
}

// Owner funnel DM: last 24 h / 7 d from the click log, subscriber count only (no user data leaves the box).
export function buildFunnelReport({ clicksText, subs, now = Date.now(), lang = "zh" }) {
  const summary = summarizeClicks(parseClickLines(clicksText || ""), now);
  return funnelReportMessage({ summary, subscribers: countSubscribers(subs), lang, fileReadable: typeof clicksText === "string", date: new Date(now).toISOString().slice(0, 10) });
}
export function funnelReportDue({ now = new Date(), sentDates = [], ownerChatId = OWNER_CHAT_ID } = {}) {
  if (!ownerChatId) return false;
  const today = now.toISOString().slice(0, 10);
  return now.getUTCHours() * 60 + now.getUTCMinutes() >= 13 * 60 + 5 && !sentDates.includes(today);
}

export function digestDue({ now = new Date(), sentDates = [], initialized = false } = {}) {
  return initialized && now.getUTCHours() >= 13 && !sentDates.includes(now.toISOString().slice(0, 10));
}

export function requireCurrentMarket(market) {
  if (market?.stale === true) throw new Error("market feed stale; waiting for recovery");
  for (const key of ["markets", "fapi.binance.com/fapi/v1/ticker/24hr"]) {
    const status = market?.sourceStatus?.[key]?.status;
    if (status !== undefined && status !== "ok") throw new Error(`market source ${key} unavailable; waiting for recovery`);
  }
}

// ---------- custom /alert rules ----------
const FAPI = "https://fapi.binance.com/fapi/v1";
const round2 = (n) => Math.round(n * 100) / 100;
let slugCache = { at: 0, map: {} };
/** COIN -> {price, change24hPct, change1hPct?}: one 24hr ticker call, plus 1h klines only for coins with move rules. */
export async function fetchTriggerPrices({ fetchJson = getBinance, coins = [], sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const prices = {};
  for (const t of await fetchJson(`${FAPI}/ticker/24hr`)) {
    if (!String(t.symbol).endsWith("USDT")) continue;
    prices[t.symbol.slice(0, -4)] = { price: Number(t.lastPrice), change24hPct: round2(Number(t.priceChangePercent)) };
  }
  // 1h change = last price vs the open of the current hourly candle, as ops/market-collector computes it
  for (const coin of [...new Set(coins)].slice(0, 40)) {
    if (!prices[coin]) continue;
    try {
      const k = await fetchJson(`${FAPI}/klines?symbol=${coin}USDT&interval=1h&limit=2`);
      const open = Number(k[k.length - 1][1]);
      if (open > 0) prices[coin].change1hPct = round2((prices[coin].price / open - 1) * 100);
    } catch (e) { log(`klines ${coin}: ${e.message}`); }
    await sleep(120);
  }
  return prices;
}
/** SYMBOL -> coin page slug from coins.json (first, i.e. highest-ranked, coin per symbol), cached for 6 h. */
export async function coinSlugs({ fetchJson = getJson, now = Date.now() } = {}) {
  if (now - slugCache.at < 6 * 3600e3) return slugCache.map;
  const map = {};
  try {
    for (const c of (await fetchJson(`${SITE}/intel/coins.json`)).coins || []) if (c?.symbol && c.slug && !map[String(c.symbol).toUpperCase()]) map[String(c.symbol).toUpperCase()] = c.slug;
    slugCache = { at: now, map };
  } catch (e) { log(`coins.json: ${e.message}`); return slugCache.map; }
  return map;
}
/**
 * Evaluates the custom rules and DMs each fired alert. Prices are only fetched when a price or move rule exists.
 * Returns the new state.triggers value (unchanged when nobody has a rule).
 */
export async function runTriggerAlerts({ doc, state, subs, market, announcements, dm, sendDelivery, checkpoint = async () => {}, blocked = new Set(), now = Date.now(), fetchBinance = getBinance, fetchSite = getJson, sleep }) {
  const pendingRuleKey = (delivery) => `${delivery.uid}:${delivery.triggerId}`;
  const liveRuleKeys = new Set(Object.entries(doc?.users || {}).flatMap(([uid, user]) => (user?.triggers || []).filter((t) => t?.id).map((t) => `${uid}:${t.id}`)));
  if (!countTriggers(doc)) {
    const next = { ...(state || {}) };
    if (next.pendingDeliveries && Object.keys(next.pendingDeliveries).length) { next.pendingDeliveries = {}; await checkpoint(next); }
    return next;
  }
  const needPrices = Object.values(doc.users).some((u) => (u?.triggers || []).some((t) => t.type === "price" || t.type === "move"));
  let prices = {};
  if (needPrices) {
    try { prices = await fetchTriggerPrices({ fetchJson: fetchBinance, coins: moveCoins(doc), sleep }); } catch (e) { log(`binance prices: ${e.message}`); }
  }
  const slugs = needPrices ? await coinSlugs({ fetchJson: fetchSite, now }) : {};
  const r = evaluateTriggers({ doc, state, now, prices, market, announcements, coinSlugs: slugs, subs });
  const pending = r.state.pendingDeliveries ||= {};
  // Only the poller writes the rules file, so a member who blocked the bot keeps rules there: pause them for 7 days
  // instead of retrying every cycle (a /stop or new rule after unblocking resumes them once the pause ends).
  const paused = Object.fromEntries(Object.entries(r.state.paused || {}).filter(([, until]) => until > now));
  for (const [id, delivery] of Object.entries(pending)) if (!liveRuleKeys.has(pendingRuleKey(delivery)) || paused[delivery.uid]) delete pending[id];
  for (const delivery of r.deliveries) if (!paused[delivery.uid] && !pending[delivery.deliveryId]) pending[delivery.deliveryId] = { ...delivery, at: now };
  r.state.paused = paused;
  // Persist cooldown/count/seen progress and the durable outbox before any Telegram request.
  await checkpoint(r.state);

  for (const [id, d] of Object.entries(pending)) {
    if (!liveRuleKeys.has(pendingRuleKey(d))) { delete pending[id]; await checkpoint(r.state); continue; }
    if (paused[d.uid]) continue;
    if (sendDelivery) await sendDelivery(d);
    else await dm(d.uid, d.text, d.buttons);
    if (blocked.has(d.uid) || blocked.has(String(d.uid))) paused[d.uid] = now + 7 * 24 * 3600e3;
    else log(`custom alert ${d.type} -> ${d.uid}`);
    r.state.paused = paused;
    delete pending[id];
    await checkpoint(r.state);
  }
  r.state.paused = paused;
  for (const d of r.dropped) log(`custom alert ${d.type} for ${d.uid} dropped: daily cap reached`);
  return r.state;
}

// ---------- cycle ----------
async function cycle(tok) {
  const state = readState(STATE, { sentEvents: {}, sentListings: {}, digestDates: [], initialized: false });
  const subs = readJson(SUBS, { users: {} });
  const users = Object.entries(subs.users || {});
  const [mk, partnersFeed, ann] = await Promise.all([getJson(`${SITE}/intel/market-events.json`), getJson(`${SITE}/intel/partners.json`), getJson(`${SITE}/intel/official-announcements.json`).catch(() => ({ items: [] }))]);
  try { requireCurrentMarket(mk); }
  catch (error) { sourceStatus["/intel/market-events.json"] = { status: "failed", updatedAt: new Date().toISOString() }; throw error; }
  const partners = partnersFeed.partners || [];
  const bySlug = Object.fromEntries(partners.map((p) => [p.slug, p]));
  const saveState = () => { if (!DRY) writeJson(STATE, state); };
  const blocked = new Set();
  const dm = async (uid, text, buttons) => {
    const r = await send(tok, uid, text, buttons);
    const unavailable = !r.ok && /blocked|deactivated|chat not found/i.test(r.description || "");
    if (unavailable) blocked.add(uid);
    await new Promise((res) => setTimeout(res, 60));
    return unavailable ? { ok: true, unavailable: true } : r;
  };
  const deliverStrict = (key, action) => deliverOnce({ state, ...(Array.isArray(key) ? { keys: key } : { key }), deliver: action, save: saveState });
  // One recipient's rejection or unknown outcome must never stall the rest of the cycle (digest, funnel, custom alerts):
  // log it and move on. Confirmed recipients are still skipped on a rerun; a pending receipt is never blindly replayed.
  const deliver = async (key, action) => {
    try { return await deliverStrict(key, action); }
    catch (error) { sourceStatus.telegram = { status: "failed", updatedAt: new Date().toISOString() }; log(`delivery ${key} not confirmed: ${error.message}`); if (ONCE) process.exitCode = 1; return { ok: false, description: error.message }; }
  };

  try {
    await runChannelRhythm({
      channels: Object.entries(CHANNELS),
      state,
      market: mk,
      partners,
      dryRun: DRY,
      buttonsFor: (lang, src) => partnerButtons(partners, lang, src),
      sendMessage: async (chat, text, buttons, { slot }) => {
        await deliverStrict(`rhythm:${slot.kind}:${slot.key}:message:${chat}`, () => send(tok, chat, text, buttons));
      },
      sendPoll: async (chat, poll, { slot }) => {
        await deliverStrict(`rhythm:${slot.kind}:${slot.key}:poll:${chat}`, () => sendPoll(tok, chat, poll));
      },
      save: saveState,
    });
  } catch (error) {
    sourceStatus.telegram = { status: "failed", updatedAt: new Date().toISOString() };
    log(error.message);
    if (ONCE) process.exitCode = 1;
  }

  // market events (one alert per type per 3 hours)
  const hourKey = (type) => `${type}:${Math.floor(Date.now() / (3 * 3600e3))}`;
  for (const ev of (mk.events || []).filter((e) => e.severity === "high")) {
    const key = hourKey(ev.type);
    if (state.sentEvents[key] || !state.initialized) { state.sentEvents[key] = state.sentEvents[key] || "baseline"; continue; }
    const topic = ev.type === "sharp-move" ? "moves" : "liquidation";
    let complete = true;
    for (const [lang, chat] of Object.entries(CHANNELS)) if (!(await deliver(`event:${key}:channel:${chat}`, () => send(tok, chat, eventMessage(ev, mk, lang), eventButtons(lang, `tg-alert-channel-${lang}`)))).ok) complete = false;
    for (const [uid, u] of users) if (u.topics?.includes(topic)) {
      const lang = msgLang(u);
      if (!(await deliver(`event:${key}:dm:${uid}`, () => dm(uid, eventMessage(ev, mk, lang), eventButtons(lang, `tg-alert-dm-${lang}`)))).ok) complete = false;
    }
    if (complete) state.sentEvents[key] = new Date().toISOString();
    log(`event ${ev.type} ${complete ? "sent" : "incomplete; retry remaining recipients"}`);
  }

  // partner listings and campaigns -> "listings" subscribers (channels already get them from channel-feed)
  const fresh = (ann.items || []).filter((i) => ["listing", "event"].includes(i.category) && bySlug[i.venue] && Date.now() - Date.parse(i.publishedAt) < 6 * 3600e3 && !state.sentListings[i.id]);
  for (const group of groupListingItems(fresh)) {
    let complete = true;
    if (state.initialized) for (const [uid, u] of users) if (u.topics?.includes("listings")) {
      const lang = msgLang(u);
      const receiptKey = (item) => `listing:${JSON.stringify([String(item.id), uid])}`;
      const unresolved = group.items.filter((item) => state.deliveryReceipts?.[receiptKey(item)]?.status !== "confirmed");
      const pending = unresolved.filter((item) => {
        const receipt = state.deliveryReceipts?.[receiptKey(item)];
        return receipt?.status !== "pending" && !(receipt?.retryAt > Date.now());
      });
      if (pending.length < unresolved.length) {
        complete = false;
        sourceStatus.telegram = { status: "failed", updatedAt: new Date().toISOString() };
        log(`listing recipient ${uid}: unresolved receipt/backoff retained for review; processing other items`);
      }
      if (!pending.length) continue;
      const m = group.type === "listing" ? listingGroupMessage(pending, bySlug, lang) : listingMessage(pending[0], bySlug[pending[0].venue], lang);
      if (m && !(await deliver(pending.map(receiptKey), () => dm(uid, m.text, m.buttons))).ok) complete = false;
    }
    if (complete) for (const item of group.items) state.sentListings[item.id] = new Date().toISOString();
  }

  // daily brief at 13:00 UTC
  const today = new Date().toISOString().slice(0, 10);
  if (digestDue({ sentDates: state.digestDates, initialized: state.initialized })) {
    const feed = await getJson(`${SITE}/content/news-feed-summary.json`).catch(() => ({ articles: [] }));
    const articles = (feed.articles || []).filter((a) => Date.now() - Date.parse(a.publishedAt) < 24 * 3600e3).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    const campaigns = (ann.items || []).filter((i) => i.category === "event" && bySlug[i.venue] && Date.now() - Date.parse(i.publishedAt) < 48 * 3600e3);
    const calendar = await getJson(`${SITE}/intel/calendar.json`).catch((e) => { log(`calendar.json: ${e.message}`); return { events: [] }; });
    const flashByLang = {};
    const todayFor = async (lang) => {
      if (!(lang in flashByLang)) flashByLang[lang] = await getJson(`${SITE}/api/flash.json?important=1&limit=20&locale=${FLASH_LOCALE[lang] || lang}`).catch((e) => { log(`flash ${lang}: ${e.message}`); return { items: [] }; });
      return { now: Date.now(), flash: flashByLang[lang], calendar };
    };
    let complete = true;
    for (const [lang, chat] of Object.entries(CHANNELS)) {
      const d = digestMessage(mk, partners, articles, campaigns, lang, await todayFor(lang));
      if (!(await deliver(`digest:${today}:channel:${chat}`, () => send(tok, chat, d.text, d.buttons))).ok) complete = false;
    }
    for (const [uid, u] of users) if (u.topics?.includes("digest")) { const lang = msgLang(u); const d = digestMessage(mk, partners, articles, campaigns, lang, await todayFor(lang)); if (!(await deliver(`digest:${today}:dm:${uid}`, () => dm(uid, d.text, d.buttons))).ok) complete = false; }
    if (complete) state.digestDates = [...state.digestDates.slice(-30), today];
    log(complete ? "daily brief sent" : "daily brief incomplete; remaining recipients retry next cycle");
  }

  // owner funnel report at 13:05 UTC (private DM; skipped silently without OWNER_CHAT_ID)
  state.funnelDates = state.funnelDates || [];
  if (funnelReportDue({ sentDates: state.funnelDates }) && state.initialized) {
    let clicksText = null;
    try { clicksText = CLICKS ? readFileSync(CLICKS, "utf8") : null; } catch { clicksText = null; }
    const r = await deliver(`funnel:${today}:${OWNER_CHAT_ID}`, () => send(tok, OWNER_CHAT_ID, buildFunnelReport({ clicksText, subs: readJson(SUBS, { users: {} }) })));
    if (r.ok) { state.funnelDates = [...state.funnelDates.slice(-30), today]; log("owner funnel report sent"); } else log(`owner funnel report failed: ${r.description || "unknown"}`);
  }

  // custom /alert rules (price, 1h move, liquidations, funding, listings); a failure here never blocks the rest
  try {
    const checkpointTriggers = async (triggers) => { state.triggers = triggers; saveState(); };
    state.triggers = await runTriggerAlerts({
      doc: loadTriggers({ file: TRIGGERS }), state: state.triggers, subs, market: mk, announcements: ann.items || [], dm, blocked, checkpoint: checkpointTriggers,
      // Rate-limit backoff keeps the outbox entry for the next cycle (the throw stops this cycle's loop); any other
      // failure is logged and the entry is dropped so one bad recipient cannot block everyone queued behind it.
      sendDelivery: async (delivery) => {
        try { return await deliverStrict(`custom:${delivery.deliveryId}:dm:${delivery.uid}`, () => dm(delivery.uid, delivery.text, delivery.buttons)); }
        catch (error) {
          sourceStatus.telegram = { status: "failed", updatedAt: new Date().toISOString() };
          if (/rate limit|\b429\b/i.test(error.message)) throw error;
          log(`custom alert ${delivery.deliveryId} not confirmed: ${error.message}`); if (ONCE) process.exitCode = 1; return null;
        }
      },
    });
  } catch (error) { sourceStatus.telegram = { status: "failed", updatedAt: new Date().toISOString() }; log(`custom alerts failed: ${error.message}`); if (ONCE) process.exitCode = 1; }

  if (blocked.size) { const s2 = readJson(SUBS, { users: {} }); for (const uid of blocked) delete s2.users[uid]; writeJson(SUBS, s2); log(`removed ${blocked.size} blocked users`); }
  for (const k of Object.keys(state.sentListings)) if (Object.keys(state.sentListings).length > 2000) delete state.sentListings[k];
  // Keep completed/rejected receipts for a week; pending outcomes require review and must never expire into a replay.
  for (const [key, receipt] of Object.entries(state.deliveryReceipts || {})) if (receipt.status !== "pending" && !(Date.now() - receipt.at <= 7 * 24 * 3600e3)) delete state.deliveryReceipts[key];
  state.initialized = true;
  saveState();
}

// Only run as a program; tests import the message builders above.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const tok = DRY ? "" : token();
  if (!DRY && !tok) { console.error("bot token missing"); process.exit(1); }
  let inFlight = false;
  const run = async () => {
    if (inFlight) { log("cycle skipped: previous cycle still running"); return; }
    inFlight = true;
    for (const key of Object.keys(sourceStatus)) delete sourceStatus[key];
    let status = "ok";
    try { await cycle(tok); }
    catch (e) { status = "failed"; log(`cycle failed: ${e.message}`); if (ONCE) process.exitCode = 1; }
    finally {
      try {
        if (!DRY) writeJson(process.env.ALERT_HEARTBEAT_FILE || path.join(path.dirname(STATE), "heartbeat.json"), {
          updatedAt: new Date().toISOString(), status: status === "ok" && Object.values(sourceStatus).some((s) => s.status === "failed") ? "degraded" : status, sources: sourceStatus,
        });
      } finally { inFlight = false; }
    }
    return status === "ok";
  };
  let backoff = 1000;
  do {
    const ok = await run();
    if (ONCE) break;
    await new Promise((resolve) => setTimeout(resolve, ok ? 2 * 60 * 1000 : backoff));
    backoff = ok ? 1000 : Math.min(5 * 60 * 1000, backoff * 2);
  } while (true);
}

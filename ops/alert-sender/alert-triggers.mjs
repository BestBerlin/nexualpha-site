// Custom Telegram alerts (/alert <rule>), owner 2026-10-13. One file shared by both sides:
//   - the bot poller copies it as alert-triggers.js (poller/apply-poller-patch.mjs) and is the only WRITER of the store;
//   - alert-sender.mjs only READS the store and evaluates the rules every cycle (evaluateTriggers is pure).
// Self-contained on purpose (node:fs + node:path only) so the poller release needs no extra dependency.
// Five rule kinds: price level crossing, 1h move, 1h liquidation total, extreme funding, new listing on a venue.
// Command replies are plain text (the poller sends without parse_mode); alert messages are HTML (the sender's DMs).
import { readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import path from "node:path";

const SITE = "https://nexualpha.com";
export const LANGS = ["zh", "en", "ru", "tr", "vi", "id", "es", "pt"];
export const LOCALE_PATH = { zh: "/zh-hans", en: "", ru: "/ru", tr: "/tr", vi: "/vi", id: "/id-id", es: "/es", pt: "/pt-br" };
export const MAX_TRIGGERS = 10;
export const DAILY_CAP = 20;
export const VENUES = { binance: "Binance", okx: "OKX", bitget: "Bitget", bybit: "Bybit", kucoin: "KuCoin", kraken: "Kraken" };
const VENUE_ALIAS = { binance: "binance", bn: "binance", 币安: "binance", okx: "okx", okex: "okx", 欧易: "okx", bitget: "bitget", bybit: "bybit", kucoin: "kucoin", 库币: "kucoin", kraken: "kraken" };
// Allowed ranges keep rules meaningful (a 0.1% move or a $1 liquidation total would fire every cycle).
export const RANGE = { move: [1, 50], liquidation: [5e6, 5e9], funding: [0.0001, 0.01] };
export const DEFAULTS = { liquidation: 50e6, funding: 0.0005 };
const H = 3600e3;
const COOLDOWN = { price: 6 * H, move: H, liquidation: 3 * H, funding: 8 * H };
const LISTING_WINDOW = 6 * H;

const triggersFile = (o) => o?.file || process.env.ALERT_TRIGGERS_FILE || "/var/lib/crypto-telegram-ops/alert-triggers.json";
const subsFile = (o) => o?.subsFile || process.env.ALERT_SUBSCRIPTIONS_FILE || "/var/lib/crypto-telegram-ops/alert-subscriptions.json";
const normLang = (l) => (LANGS.includes(l) ? l : undefined);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---------- store ----------
export function loadTriggers(opts) {
  try {
    const doc = JSON.parse(readFileSync(triggersFile(opts), "utf8"));
    return doc && typeof doc.users === "object" && doc.users ? doc : { version: 1, users: {} };
  } catch { return { version: 1, users: {} }; }
}
export function saveTriggers(doc, opts) {
  const file = triggersFile(opts);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(`${file}.tmp`, JSON.stringify(doc));
  renameSync(`${file}.tmp`, file);
}
// The /alerts card language is the member's chosen language; a member who never opened it falls back to the language
// stored with their triggers, then zh (the bot's default). Never throws: it runs inside the poller's error paths.
export function alertLangFor(userId, opts) {
  return storedLangFor(userId, opts) || "zh";
}
/** The member's chosen language (/alerts card, then their /alert rules), or null when they never chose one. */
export function storedLangFor(userId, opts) {
  try {
    const subs = JSON.parse(readFileSync(subsFile(opts), "utf8"));
    const l = normLang(subs?.users?.[String(userId)]?.lang);
    if (l) return l;
  } catch { /* no subscriptions file yet */ }
  try { return normLang(loadTriggers(opts).users[String(userId)]?.lang) || null; } catch { return null; }
}
export const readSubscriptionLang = alertLangFor;

// ---------- parser ----------
const ABOVE = new Set([">", "above", "over", "高于", "大于", "突破", "上破"]);
const BELOW = new Set(["<", "below", "under", "低于", "小于", "跌破", "下破"]);
const LIQ = new Set(["liq", "liqs", "liquidation", "liquidations", "爆仓"]);
const FUND = new Set(["funding", "fund", "fr", "资金费率", "费率"]);
const LISTING = new Set(["listing", "listings", "上币", "上新"]);
const MOVE = new Set(["move", "moves", "change", "波动", "涨跌"]);
const WINDOW_1H = new Set(["1h", "1hr", "60min", "1小时"]);
const MULT = { k: 1e3, m: 1e6, b: 1e9, w: 1e4, 万: 1e4, 亿: 1e8 };

const amount = (tok) => {
  const m = /^(\d+(?:\.\d+)?)(k|m|b|w|万|亿)?$/.exec(String(tok).replace(/[$,_]/g, ""));
  return m ? Number(m[1]) * (MULT[m[2]] || 1) : NaN;
};
const percent = (tok) => { const m = /^[±+-]?(\d+(?:\.\d+)?)%$/.exec(tok); return m ? Number(m[1]) : NaN; };
const coinOf = (tok) => {
  let c = String(tok).replace(/^\$/, "").toUpperCase();
  if (c.length > 4 && c.endsWith("USDT")) c = c.slice(0, -4);
  return /^[A-Z0-9]{2,12}$/.test(c) && !/^\d+$/.test(c) ? c : null;
};
const inRange = (type, v) => v >= RANGE[type][0] && v <= RANGE[type][1];
const fail = (error, extra) => ({ ok: false, error, ...extra });

export function tokenize(arg) {
  return String(arg ?? "").normalize("NFKC").toLowerCase()
    .replace(/≥/g, ">").replace(/≤/g, "<")
    .replace(/(高于|低于|大于|小于|突破|跌破|上破|下破|爆仓|资金费率|费率|上币|上新|波动|涨跌)/g, " $1 ")
    .replace(/[<>]=?/g, (m) => ` ${m[0]} `)
    .replace(/\s+%/g, "%").replace(/±\s+/g, "±")
    .trim().split(/\s+/).filter(Boolean);
}

/** Parses the text after /alert into a trigger: {ok:true, trigger} or {ok:false, error}. */
export function parseAlertArgument(arg) {
  const t = tokenize(arg);
  if (!t.length) return fail("bad_format");
  const [head, ...rest] = t;
  if (LIQ.has(head)) {
    if (rest.length > 1) return fail("bad_format");
    const minUsd = rest.length ? amount(rest[0]) : DEFAULTS.liquidation;
    if (!Number.isFinite(minUsd)) return fail("bad_format");
    return inRange("liquidation", minUsd) ? { ok: true, trigger: { type: "liquidation", minUsd } } : fail("out_of_range", { type: "liquidation" });
  }
  if (FUND.has(head)) {
    let coin = null, absRate = DEFAULTS.funding;
    for (const tok of rest) {
      const p = /%$/.test(tok) ? percent(tok) : amount(tok);
      if (Number.isFinite(p)) absRate = p / 100; // "0.1%" and a bare "0.1" both mean 0.1 % per interval
      else if (!coin && coinOf(tok)) coin = coinOf(tok);
      else return fail("bad_format");
    }
    return inRange("funding", absRate) ? { ok: true, trigger: { type: "funding", coin, absRate: Number(absRate.toFixed(6)) } } : fail("out_of_range", { type: "funding" });
  }
  if (LISTING.has(head)) {
    const venue = VENUE_ALIAS[rest[0]];
    if (rest.length !== 1 || !venue) return fail("unsupported_venue");
    return { ok: true, trigger: { type: "listing", venue } };
  }
  const coin = coinOf(head);
  if (!coin) return fail("bad_coin");
  if (!rest.length) return fail("bad_format");
  const [op, ...tail] = rest;
  if (ABOVE.has(op) || BELOW.has(op)) {
    const value = tail.length === 1 ? amount(tail[0]) : NaN;
    if (!(value > 0)) return fail("bad_format");
    return { ok: true, trigger: { type: "price", coin, op: ABOVE.has(op) ? "above" : "below", value } };
  }
  // move: [move] <pct>[%] [1h]; the keyword makes the % sign optional ("btc move 5")
  const words = MOVE.has(op) ? tail : rest;
  if (!words.length || words.length > 2 || (words[1] && !WINDOW_1H.has(words[1]))) return fail("bad_format");
  const pct = MOVE.has(op) && !/%$/.test(words[0]) ? amount(words[0]) : percent(words[0]);
  if (!Number.isFinite(pct)) return fail("bad_format");
  return inRange("move", pct) ? { ok: true, trigger: { type: "move", coin, pct } } : fail("out_of_range", { type: "move" });
}

// ---------- formatting ----------
const NUM_LOCALE = { zh: "en-US", en: "en-US", ru: "ru-RU", tr: "tr-TR", vi: "vi-VN", id: "id-ID", es: "es-ES", pt: "pt-BR" };
const nf = (lang, o) => new Intl.NumberFormat(NUM_LOCALE[lang] || "en-US", o);
export const fmt = {
  price: (lang, n) => nf(lang, { style: "currency", currency: "USD", ...(n >= 1000 ? { maximumFractionDigits: 0 } : n >= 1 ? { minimumFractionDigits: 0, maximumFractionDigits: 2 } : { maximumSignificantDigits: 4 }) }).format(n),
  usd: (lang, n) => nf(lang, { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(n),
  pct: (lang, p) => nf(lang, { style: "percent", signDisplay: "exceptZero", maximumFractionDigits: 2 }).format(p / 100),
  plainPct: (lang, p) => nf(lang, { style: "percent", maximumFractionDigits: 2 }).format(p / 100),
  rate: (lang, r, signed = false) => nf(lang, { style: "percent", maximumFractionDigits: 4, ...(signed ? { signDisplay: "exceptZero" } : {}) }).format(r),
  hhmm: (iso) => (Number.isFinite(Date.parse(iso)) ? new Date(iso).toISOString().slice(11, 16) : null),
};
const above = (op) => op === "above";

// ---------- copy ----------
// Short, informational, no fine print (owner 2026-10-13). Plain-text replies; the HTML alert heads escape their values.
const EX = "/alert btc > 70000, /alert eth 5%, /alert liq 50m, /alert funding btc, /alert listing binance";
const VENUE_LIST = Object.values(VENUES).join(", ");
const COPY = {
  zh: {
    usage: ["🔔 自定义提醒", "发送 /alert 加一条规则：", "• 价格：/alert btc > 70000 或 /alert eth 低于 2500", "• 1 小时波动：/alert btc 5%", "• 爆仓：/alert 爆仓 50m（1 小时合计）", "• 资金费率：/alert funding btc 0.1%", "• 新上币：/alert 上币 binance", `最多 ${MAX_TRIGGERS} 条规则，每天最多推送 ${DAILY_CAP} 条。`, "/alert list 查看 · /alert del 1 删除 · /alert off 清空", "在 /alerts 查看你的规则，/stop 关闭全部提醒。"].join("\n"),
    added: (r) => `✅ 已添加提醒：${r}\n查看全部：/alert list`, removed: (r) => `🗑 已删除：${r}`, cleared: (n) => `🗑 已清空全部自定义提醒（${n} 条）。`,
    listHead: "🎯 你的自定义提醒：", listFoot: "删除：/alert del 1 · 清空：/alert off", empty: "你还没有自定义提醒。示例：/alert btc > 70000",
    err: { bad_format: "没看懂这条规则。示例：/alert btc > 70000、/alert eth 5%、/alert 爆仓 50m、/alert funding btc、/alert 上币 binance", bad_coin: "币种代码不对，请用 BTC、ETH、SOL 这样的代码。", unsupported_venue: `上币提醒支持：${VENUE_LIST}。示例：/alert 上币 binance`, limit: `你已有 ${MAX_TRIGGERS} 条自定义提醒，请先删除一条：/alert del 1`, duplicate: "这条提醒已经存在。", not_found: "没有这个编号的提醒，发送 /alert list 查看。" },
    range: { move: "波动幅度需在 1% 到 50% 之间。", liquidation: "爆仓金额需在 500 万到 50 亿美元之间，例如 /alert 爆仓 50m。", funding: "资金费率阈值需在 0.01% 到 1% 之间。" },
    rule: { price: (c, op, v) => `${c} ${above(op) ? "高于" : "低于"} ${v}`, move: (c, p) => `${c} 1 小时涨跌超过 ±${p}`, liquidation: (u) => `1 小时爆仓超过 ${u}`, funding: (c, r) => `${c || "任意币种"} 资金费率超过 ±${r}`, listing: (v) => `${v} 新上币` },
    head: { price: (c, op, v) => `🔔 ${c} ${above(op) ? "突破" : "跌破"} ${v}`, move: (c, p) => `⚡ ${c} 1 小时 ${p}`, liquidation: (u) => `💥 过去 1 小时爆仓 ${u}`, funding: (c) => (c ? `📊 ${c} 资金费率进入极值` : "📊 资金费率出现极值"), listing: (v) => `🆕 ${v} 新上币` },
    now: (p) => `现价 ${p}`, h1: "1h", h24: "24h", split: (l, s) => `多单 ${l} · 空单 ${s}`, next: (t) => `下次结算 ${t} UTC`,
    more: "在 NexuAlpha 查看 →", manage: "管理：/alerts · 停止：/stop", cardHead: "🎯 自定义提醒：", cardHint: "自定义提醒：/alert btc > 70000 · /alert list",
    stopAll: "已关闭全部私信提醒（自定义 /alert 规则和 /alerts 主题）。", failed: "出了点问题，请稍后再试。",
  },
  en: {
    usage: ["🔔 Custom alerts", "Send /alert plus a rule:", "• Price: /alert btc > 70000 or /alert eth < 2500", "• 1h move: /alert btc 5%", "• Liquidations: /alert liq 50m (1h total)", "• Funding: /alert funding btc 0.1%", "• New listings: /alert listing binance", `Up to ${MAX_TRIGGERS} rules, at most ${DAILY_CAP} alerts a day.`, "/alert list · /alert del 1 · /alert off", "See your rules in /alerts; /stop turns everything off."].join("\n"),
    added: (r) => `✅ Alert added: ${r}\nSee all: /alert list`, removed: (r) => `🗑 Removed: ${r}`, cleared: (n) => `🗑 Cleared all custom alerts (${n}).`,
    listHead: "🎯 Your custom alerts:", listFoot: "Delete one: /alert del 1 · Clear: /alert off", empty: "You have no custom alerts yet. Example: /alert btc > 70000",
    err: { bad_format: `Couldn't read that rule. Examples: ${EX}`, bad_coin: "That doesn't look like a coin symbol. Use a ticker like BTC, ETH or SOL.", unsupported_venue: `Listing alerts cover ${VENUE_LIST}. Example: /alert listing binance`, limit: `You already have ${MAX_TRIGGERS} custom alerts. Remove one first: /alert del 1`, duplicate: "You already have this alert.", not_found: "No alert with that number. See /alert list" },
    range: { move: "Move size must be between 1% and 50%.", liquidation: "Liquidation size must be between $5M and $5B, e.g. /alert liq 50m.", funding: "Funding threshold must be between 0.01% and 1%." },
    rule: { price: (c, op, v) => `${c} ${above(op) ? "above" : "below"} ${v}`, move: (c, p) => `${c} moves ±${p} within 1h`, liquidation: (u) => `1h liquidations above ${u}`, funding: (c, r) => `${c || "Any coin"} funding beyond ±${r}`, listing: (v) => `New listings on ${v}` },
    head: { price: (c, op, v) => `🔔 ${c} crossed ${above(op) ? "above" : "below"} ${v}`, move: (c, p) => `⚡ ${c} ${p} in the past hour`, liquidation: (u) => `💥 ${u} liquidated in the past hour`, funding: (c) => (c ? `📊 ${c} funding rate at an extreme` : "📊 Extreme funding rates"), listing: (v) => `🆕 New listing on ${v}` },
    now: (p) => `Price ${p}`, h1: "1h", h24: "24h", split: (l, s) => `Longs ${l} · Shorts ${s}`, next: (t) => `next ${t} UTC`,
    more: "Details on NexuAlpha →", manage: "Manage: /alerts · Stop: /stop", cardHead: "🎯 Custom alerts:", cardHint: "Custom alerts: /alert btc > 70000 · /alert list",
    stopAll: "All private alerts are off (custom /alert rules and /alerts topics).", failed: "Something went wrong, please try again in a minute.",
  },
  ru: {
    usage: ["🔔 Свои оповещения", "Отправьте /alert и правило:", "• Цена: /alert btc > 70000 или /alert eth < 2500", "• Движение за 1 ч: /alert btc 5%", "• Ликвидации: /alert liq 50m (сумма за 1 ч)", "• Ставка финансирования: /alert funding btc 0.1%", "• Новые листинги: /alert listing binance", `До ${MAX_TRIGGERS} правил, не больше ${DAILY_CAP} оповещений в день.`, "/alert list · /alert del 1 · /alert off", "Ваши правила видны в /alerts; /stop отключает всё."].join("\n"),
    added: (r) => `✅ Оповещение добавлено: ${r}\nВсе правила: /alert list`, removed: (r) => `🗑 Удалено: ${r}`, cleared: (n) => `🗑 Все свои оповещения удалены (${n}).`,
    listHead: "🎯 Ваши оповещения:", listFoot: "Удалить: /alert del 1 · Очистить: /alert off", empty: "У вас пока нет своих оповещений. Пример: /alert btc > 70000",
    err: { bad_format: `Не удалось разобрать правило. Примеры: ${EX}`, bad_coin: "Это не похоже на тикер монеты. Используйте BTC, ETH или SOL.", unsupported_venue: `Оповещения о листингах доступны для ${VENUE_LIST}. Пример: /alert listing binance`, limit: `У вас уже ${MAX_TRIGGERS} оповещений. Сначала удалите одно: /alert del 1`, duplicate: "Такое оповещение уже есть.", not_found: "Оповещения с таким номером нет. Список: /alert list" },
    range: { move: "Размер движения — от 1% до 50%.", liquidation: "Сумма ликвидаций — от $5M до $5B, например /alert liq 50m.", funding: "Порог ставки финансирования — от 0,01% до 1%." },
    rule: { price: (c, op, v) => `${c} ${above(op) ? "выше" : "ниже"} ${v}`, move: (c, p) => `${c}: движение ±${p} за 1 ч`, liquidation: (u) => `Ликвидации за 1 ч больше ${u}`, funding: (c, r) => `${c || "Любая монета"}: ставка финансирования за пределами ±${r}`, listing: (v) => `Новые листинги на ${v}` },
    head: { price: (c, op, v) => `🔔 ${c} ${above(op) ? "поднялся выше" : "опустился ниже"} ${v}`, move: (c, p) => `⚡ ${c} ${p} за последний час`, liquidation: (u) => `💥 Ликвидации за последний час: ${u}`, funding: (c) => (c ? `📊 Экстремальная ставка финансирования ${c}` : "📊 Экстремальные ставки финансирования"), listing: (v) => `🆕 Новый листинг на ${v}` },
    now: (p) => `Цена ${p}`, h1: "1 ч", h24: "24 ч", split: (l, s) => `Лонги ${l} · Шорты ${s}`, next: (t) => `следующая выплата ${t} UTC`,
    more: "Подробнее на NexuAlpha →", manage: "Настроить: /alerts · Отключить: /stop", cardHead: "🎯 Свои оповещения:", cardHint: "Свои оповещения: /alert btc > 70000 · /alert list",
    stopAll: "Все личные оповещения отключены (правила /alert и темы /alerts).", failed: "Что-то пошло не так, попробуйте через минуту.",
  },
  tr: {
    usage: ["🔔 Özel uyarılar", "/alert ve ardından bir kural gönderin:", "• Fiyat: /alert btc > 70000 veya /alert eth < 2500", "• 1 saatlik hareket: /alert btc 5%", "• Likidasyonlar: /alert liq 50m (1 saatlik toplam)", "• Fonlama oranı: /alert funding btc 0.1%", "• Yeni listelemeler: /alert listing binance", `En fazla ${MAX_TRIGGERS} kural, günde en fazla ${DAILY_CAP} uyarı.`, "/alert list · /alert del 1 · /alert off", "Kurallarınızı /alerts içinde görürsünüz; /stop hepsini kapatır."].join("\n"),
    added: (r) => `✅ Uyarı eklendi: ${r}\nTümü: /alert list`, removed: (r) => `🗑 Silindi: ${r}`, cleared: (n) => `🗑 Tüm özel uyarılar silindi (${n}).`,
    listHead: "🎯 Özel uyarılarınız:", listFoot: "Silmek için: /alert del 1 · Temizlemek için: /alert off", empty: "Henüz özel uyarınız yok. Örnek: /alert btc > 70000",
    err: { bad_format: `Bu kuralı anlayamadım. Örnekler: ${EX}`, bad_coin: "Bu bir coin sembolüne benzemiyor. BTC, ETH veya SOL gibi bir sembol kullanın.", unsupported_venue: `Listeleme uyarıları şu borsalar için: ${VENUE_LIST}. Örnek: /alert listing binance`, limit: `Zaten ${MAX_TRIGGERS} özel uyarınız var. Önce birini silin: /alert del 1`, duplicate: "Bu uyarı zaten var.", not_found: "Bu numarada bir uyarı yok. Liste: /alert list" },
    range: { move: "Hareket eşiği %1 ile %50 arasında olmalı.", liquidation: "Likidasyon eşiği 5 Mn $ ile 5 Mr $ arasında olmalı, ör. /alert liq 50m.", funding: "Fonlama eşiği %0,01 ile %1 arasında olmalı." },
    rule: { price: (c, op, v) => `${c} ${v} ${above(op) ? "üzerinde" : "altında"}`, move: (c, p) => `${c} 1 saatte ±${p} hareket`, liquidation: (u) => `1 saatlik likidasyon ${u} üzerinde`, funding: (c, r) => `${c || "Tüm coinler"} fonlama oranı ±${r} dışında`, listing: (v) => `${v} yeni listelemeleri` },
    head: { price: (c, op, v) => `🔔 ${c} ${v} ${above(op) ? "seviyesinin üzerine çıktı" : "seviyesinin altına indi"}`, move: (c, p) => `⚡ ${c} son 1 saatte ${p}`, liquidation: (u) => `💥 Son 1 saatte ${u} likidasyon`, funding: (c) => (c ? `📊 ${c} fonlama oranı uç seviyede` : "📊 Fonlama oranları uç seviyede"), listing: (v) => `🆕 ${v} yeni listeleme` },
    now: (p) => `Fiyat ${p}`, h1: "1 sa", h24: "24 sa", split: (l, s) => `Long ${l} · Short ${s}`, next: (t) => `sonraki ödeme ${t} UTC`,
    more: "NexuAlpha'da ayrıntılar →", manage: "Yönet: /alerts · Durdur: /stop", cardHead: "🎯 Özel uyarılar:", cardHint: "Özel uyarılar: /alert btc > 70000 · /alert list",
    stopAll: "Tüm özel mesaj uyarıları kapatıldı (/alert kuralları ve /alerts konuları).", failed: "Bir sorun oluştu, lütfen bir dakika sonra tekrar deneyin.",
  },
  vi: {
    usage: ["🔔 Cảnh báo tùy chỉnh", "Gửi /alert kèm một quy tắc:", "• Giá: /alert btc > 70000 hoặc /alert eth < 2500", "• Biến động 1 giờ: /alert btc 5%", "• Thanh lý: /alert liq 50m (tổng 1 giờ)", "• Funding: /alert funding btc 0.1%", "• Niêm yết mới: /alert listing binance", `Tối đa ${MAX_TRIGGERS} quy tắc, tối đa ${DAILY_CAP} cảnh báo mỗi ngày.`, "/alert list · /alert del 1 · /alert off", "Xem quy tắc của bạn trong /alerts; /stop để tắt tất cả."].join("\n"),
    added: (r) => `✅ Đã thêm cảnh báo: ${r}\nXem tất cả: /alert list`, removed: (r) => `🗑 Đã xóa: ${r}`, cleared: (n) => `🗑 Đã xóa toàn bộ cảnh báo tùy chỉnh (${n}).`,
    listHead: "🎯 Cảnh báo tùy chỉnh của bạn:", listFoot: "Xóa: /alert del 1 · Xóa hết: /alert off", empty: "Bạn chưa có cảnh báo tùy chỉnh nào. Ví dụ: /alert btc > 70000",
    err: { bad_format: `Không đọc được quy tắc này. Ví dụ: ${EX}`, bad_coin: "Đây không giống mã coin. Hãy dùng mã như BTC, ETH hoặc SOL.", unsupported_venue: `Cảnh báo niêm yết hỗ trợ: ${VENUE_LIST}. Ví dụ: /alert listing binance`, limit: `Bạn đã có ${MAX_TRIGGERS} cảnh báo tùy chỉnh. Hãy xóa bớt một: /alert del 1`, duplicate: "Cảnh báo này đã tồn tại.", not_found: "Không có cảnh báo với số này. Xem /alert list" },
    range: { move: "Mức biến động phải từ 1% đến 50%.", liquidation: "Mức thanh lý phải từ 5 triệu đến 5 tỷ USD, ví dụ /alert liq 50m.", funding: "Ngưỡng funding phải từ 0,01% đến 1%." },
    rule: { price: (c, op, v) => `${c} ${above(op) ? "trên" : "dưới"} ${v}`, move: (c, p) => `${c} biến động ±${p} trong 1 giờ`, liquidation: (u) => `Thanh lý 1 giờ vượt ${u}`, funding: (c, r) => `Funding ${c || "mọi coin"} vượt ±${r}`, listing: (v) => `Niêm yết mới trên ${v}` },
    head: { price: (c, op, v) => `🔔 ${c} ${above(op) ? "vượt lên trên" : "giảm xuống dưới"} ${v}`, move: (c, p) => `⚡ ${c} ${p} trong 1 giờ qua`, liquidation: (u) => `💥 ${u} bị thanh lý trong 1 giờ qua`, funding: (c) => (c ? `📊 Funding ${c} ở mức cực đoan` : "📊 Funding ở mức cực đoan"), listing: (v) => `🆕 Niêm yết mới trên ${v}` },
    now: (p) => `Giá ${p}`, h1: "1h", h24: "24h", split: (l, s) => `Long ${l} · Short ${s}`, next: (t) => `kỳ tiếp theo ${t} UTC`,
    more: "Xem chi tiết trên NexuAlpha →", manage: "Quản lý: /alerts · Dừng: /stop", cardHead: "🎯 Cảnh báo tùy chỉnh:", cardHint: "Cảnh báo tùy chỉnh: /alert btc > 70000 · /alert list",
    stopAll: "Đã tắt mọi cảnh báo riêng (quy tắc /alert và chủ đề /alerts).", failed: "Đã có lỗi, vui lòng thử lại sau một phút.",
  },
  id: {
    usage: ["🔔 Peringatan kustom", "Kirim /alert diikuti aturan:", "• Harga: /alert btc > 70000 atau /alert eth < 2500", "• Pergerakan 1 jam: /alert btc 5%", "• Likuidasi: /alert liq 50m (total 1 jam)", "• Funding rate: /alert funding btc 0.1%", "• Listing baru: /alert listing binance", `Maksimal ${MAX_TRIGGERS} aturan, paling banyak ${DAILY_CAP} peringatan per hari.`, "/alert list · /alert del 1 · /alert off", "Lihat aturan Anda di /alerts; /stop mematikan semuanya."].join("\n"),
    added: (r) => `✅ Peringatan ditambahkan: ${r}\nLihat semua: /alert list`, removed: (r) => `🗑 Dihapus: ${r}`, cleared: (n) => `🗑 Semua peringatan kustom dihapus (${n}).`,
    listHead: "🎯 Peringatan kustom Anda:", listFoot: "Hapus: /alert del 1 · Kosongkan: /alert off", empty: "Anda belum punya peringatan kustom. Contoh: /alert btc > 70000",
    err: { bad_format: `Aturan ini tidak terbaca. Contoh: ${EX}`, bad_coin: "Itu tidak terlihat seperti simbol koin. Gunakan simbol seperti BTC, ETH, atau SOL.", unsupported_venue: `Peringatan listing tersedia untuk ${VENUE_LIST}. Contoh: /alert listing binance`, limit: `Anda sudah punya ${MAX_TRIGGERS} peringatan kustom. Hapus satu dulu: /alert del 1`, duplicate: "Peringatan ini sudah ada.", not_found: "Tidak ada peringatan dengan nomor itu. Lihat /alert list" },
    range: { move: "Besar pergerakan harus antara 1% dan 50%.", liquidation: "Nilai likuidasi harus antara US$5 juta dan US$5 miliar, misalnya /alert liq 50m.", funding: "Ambang funding harus antara 0,01% dan 1%." },
    rule: { price: (c, op, v) => `${c} ${above(op) ? "di atas" : "di bawah"} ${v}`, move: (c, p) => `${c} bergerak ±${p} dalam 1 jam`, liquidation: (u) => `Likuidasi 1 jam di atas ${u}`, funding: (c, r) => `Funding ${c || "semua koin"} melewati ±${r}`, listing: (v) => `Listing baru di ${v}` },
    head: { price: (c, op, v) => `🔔 ${c} ${above(op) ? "naik melewati" : "turun di bawah"} ${v}`, move: (c, p) => `⚡ ${c} ${p} dalam 1 jam terakhir`, liquidation: (u) => `💥 ${u} terlikuidasi dalam 1 jam terakhir`, funding: (c) => (c ? `📊 Funding rate ${c} di level ekstrem` : "📊 Funding rate di level ekstrem"), listing: (v) => `🆕 Listing baru di ${v}` },
    now: (p) => `Harga ${p}`, h1: "1 jam", h24: "24 jam", split: (l, s) => `Long ${l} · Short ${s}`, next: (t) => `berikutnya ${t} UTC`,
    more: "Detail di NexuAlpha →", manage: "Atur: /alerts · Hentikan: /stop", cardHead: "🎯 Peringatan kustom:", cardHint: "Peringatan kustom: /alert btc > 70000 · /alert list",
    stopAll: "Semua peringatan pribadi dimatikan (aturan /alert dan topik /alerts).", failed: "Terjadi kesalahan, coba lagi sebentar lagi.",
  },
  es: {
    usage: ["🔔 Alertas personalizadas", "Envía /alert y una regla:", "• Precio: /alert btc > 70000 o /alert eth < 2500", "• Movimiento en 1 h: /alert btc 5%", "• Liquidaciones: /alert liq 50m (total de 1 h)", "• Tasa de financiación: /alert funding btc 0.1%", "• Nuevos listados: /alert listing binance", `Hasta ${MAX_TRIGGERS} reglas y como máximo ${DAILY_CAP} alertas al día.`, "/alert list · /alert del 1 · /alert off", "Tus reglas aparecen en /alerts; /stop lo apaga todo."].join("\n"),
    added: (r) => `✅ Alerta añadida: ${r}\nVer todas: /alert list`, removed: (r) => `🗑 Eliminada: ${r}`, cleared: (n) => `🗑 Se eliminaron todas tus alertas personalizadas (${n}).`,
    listHead: "🎯 Tus alertas personalizadas:", listFoot: "Eliminar: /alert del 1 · Vaciar: /alert off", empty: "Aún no tienes alertas personalizadas. Ejemplo: /alert btc > 70000",
    err: { bad_format: `No pude entender esa regla. Ejemplos: ${EX}`, bad_coin: "Eso no parece un símbolo de moneda. Usa uno como BTC, ETH o SOL.", unsupported_venue: `Las alertas de listados cubren ${VENUE_LIST}. Ejemplo: /alert listing binance`, limit: `Ya tienes ${MAX_TRIGGERS} alertas personalizadas. Elimina una primero: /alert del 1`, duplicate: "Ya tienes esta alerta.", not_found: "No hay ninguna alerta con ese número. Consulta /alert list" },
    range: { move: "El movimiento debe estar entre 1% y 50%.", liquidation: "El umbral de liquidaciones debe estar entre 5 M y 5.000 M US$, p. ej. /alert liq 50m.", funding: "El umbral de financiación debe estar entre 0,01% y 1%." },
    rule: { price: (c, op, v) => `${c} ${above(op) ? "por encima de" : "por debajo de"} ${v}`, move: (c, p) => `${c} se mueve ±${p} en 1 h`, liquidation: (u) => `Liquidaciones en 1 h por encima de ${u}`, funding: (c, r) => `Financiación de ${c || "cualquier moneda"} fuera de ±${r}`, listing: (v) => `Nuevos listados en ${v}` },
    head: { price: (c, op, v) => `🔔 ${c} ${above(op) ? "superó" : "cayó por debajo de"} ${v}`, move: (c, p) => `⚡ ${c} ${p} en la última hora`, liquidation: (u) => `💥 ${u} liquidados en la última hora`, funding: (c) => (c ? `📊 Tasa de financiación de ${c} en nivel extremo` : "📊 Tasas de financiación en nivel extremo"), listing: (v) => `🆕 Nuevo listado en ${v}` },
    now: (p) => `Precio ${p}`, h1: "1 h", h24: "24 h", split: (l, s) => `Largos ${l} · Cortos ${s}`, next: (t) => `próximo cobro ${t} UTC`,
    more: "Ver en NexuAlpha →", manage: "Gestionar: /alerts · Detener: /stop", cardHead: "🎯 Alertas personalizadas:", cardHint: "Alertas personalizadas: /alert btc > 70000 · /alert list",
    stopAll: "Todas las alertas privadas están desactivadas (reglas /alert y temas /alerts).", failed: "Algo salió mal, inténtalo de nuevo en un minuto.",
  },
  pt: {
    usage: ["🔔 Alertas personalizados", "Envie /alert e uma regra:", "• Preço: /alert btc > 70000 ou /alert eth < 2500", "• Movimento em 1 h: /alert btc 5%", "• Liquidações: /alert liq 50m (total em 1 h)", "• Taxa de funding: /alert funding btc 0.1%", "• Novas listagens: /alert listing binance", `Até ${MAX_TRIGGERS} regras e no máximo ${DAILY_CAP} alertas por dia.`, "/alert list · /alert del 1 · /alert off", "Suas regras aparecem em /alerts; /stop desliga tudo."].join("\n"),
    added: (r) => `✅ Alerta criado: ${r}\nVer todos: /alert list`, removed: (r) => `🗑 Removido: ${r}`, cleared: (n) => `🗑 Todos os alertas personalizados foram removidos (${n}).`,
    listHead: "🎯 Seus alertas personalizados:", listFoot: "Remover: /alert del 1 · Limpar: /alert off", empty: "Você ainda não tem alertas personalizados. Exemplo: /alert btc > 70000",
    err: { bad_format: `Não entendi essa regra. Exemplos: ${EX}`, bad_coin: "Isso não parece o símbolo de uma moeda. Use algo como BTC, ETH ou SOL.", unsupported_venue: `Alertas de listagem cobrem ${VENUE_LIST}. Exemplo: /alert listing binance`, limit: `Você já tem ${MAX_TRIGGERS} alertas personalizados. Remova um antes: /alert del 1`, duplicate: "Você já tem este alerta.", not_found: "Não há alerta com esse número. Veja /alert list" },
    range: { move: "O movimento deve ficar entre 1% e 50%.", liquidation: "O limite de liquidações deve ficar entre US$ 5 mi e US$ 5 bi, ex.: /alert liq 50m.", funding: "O limite de funding deve ficar entre 0,01% e 1%." },
    rule: { price: (c, op, v) => `${c} ${above(op) ? "acima de" : "abaixo de"} ${v}`, move: (c, p) => `${c} variar ±${p} em 1 h`, liquidation: (u) => `Liquidações em 1 h acima de ${u}`, funding: (c, r) => `Funding de ${c || "qualquer moeda"} além de ±${r}`, listing: (v) => `Novas listagens na ${v}` },
    head: { price: (c, op, v) => `🔔 ${c} ${above(op) ? "passou de" : "caiu abaixo de"} ${v}`, move: (c, p) => `⚡ ${c} ${p} na última hora`, liquidation: (u) => `💥 ${u} liquidados na última hora`, funding: (c) => (c ? `📊 Taxa de funding de ${c} em nível extremo` : "📊 Taxas de funding em nível extremo"), listing: (v) => `🆕 Nova listagem na ${v}` },
    now: (p) => `Preço ${p}`, h1: "1 h", h24: "24 h", split: (l, s) => `Long ${l} · Short ${s}`, next: (t) => `próximo pagamento ${t} UTC`,
    more: "Ver na NexuAlpha →", manage: "Gerenciar: /alerts · Parar: /stop", cardHead: "🎯 Alertas personalizados:", cardHint: "Alertas personalizados: /alert btc > 70000 · /alert list",
    stopAll: "Todos os alertas privados foram desligados (regras /alert e temas /alerts).", failed: "Algo deu errado, tente de novo em um minuto.",
  },
};
export const copyFor = (lang) => COPY[lang] || COPY.zh;

/** Human-readable rule in the member's language, e.g. "BTC above $70,000". Plain text. */
export function describeTrigger(t, lang) {
  const c = copyFor(lang);
  switch (t.type) {
    case "price": return c.rule.price(t.coin, t.op, fmt.price(lang, t.value));
    case "move": return c.rule.move(t.coin, fmt.plainPct(lang, t.pct));
    case "liquidation": return c.rule.liquidation(fmt.usd(lang, t.minUsd));
    case "funding": return c.rule.funding(t.coin, fmt.rate(lang, t.absRate));
    case "listing": return c.rule.listing(VENUES[t.venue] || t.venue);
    default: return String(t.type);
  }
}

// ---------- commands (poller) ----------
const ruleKey = (t) => JSON.stringify(Object.entries(t).filter(([k]) => k !== "id" && k !== "createdAt").sort(([a], [b]) => a.localeCompare(b)));
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function triggerLines(userId, lang, opts) {
  return (loadTriggers(opts).users[String(userId)]?.triggers || []).map((t, i) => `${i + 1}. ${describeTrigger(t, lang)}`);
}
export function clearUserTriggers(userId, opts) {
  const doc = loadTriggers(opts);
  const n = doc.users[String(userId)]?.triggers?.length || 0;
  if (doc.users[String(userId)]) { delete doc.users[String(userId)]; saveTriggers(doc, opts); }
  return n;
}

/** /alert <argument> in a private chat -> {text} (plain text, member's language). */
export function handleAlertCommand(userId, argument, opts = {}) {
  const uid = String(userId);
  const lang = normLang(opts.lang) || "zh";
  const c = copyFor(lang);
  const arg = String(argument ?? "").trim();
  const low = arg.toLowerCase();
  if (!arg || ["help", "帮助", "?"].includes(low)) return { text: c.usage };
  const doc = loadTriggers(opts);
  const user = doc.users[uid];
  // keep the stored language in step with the member's current choice, so the sender writes in it too
  const touch = () => { if (doc.users[uid]) doc.users[uid].lang = lang; };
  if (["list", "ls", "列表", "查看"].includes(low)) {
    const lines = triggerLines(uid, lang, opts);
    if (user && user.lang !== lang) { touch(); saveTriggers(doc, opts); }
    return { text: lines.length ? [c.listHead, ...lines, "", c.listFoot].join("\n") : c.empty };
  }
  if (["off", "clear", "清空", "关闭"].includes(low)) {
    const n = clearUserTriggers(uid, opts);
    return { text: n ? c.cleared(n) : c.empty };
  }
  const del = /^(?:del|delete|remove|rm|删除)\s*#?(\d+)$/.exec(low);
  if (del) {
    const i = Number(del[1]) - 1;
    const list = user?.triggers || [];
    if (!(i >= 0 && i < list.length)) return { text: c.err.not_found };
    const [gone] = list.splice(i, 1);
    if (!list.length) delete doc.users[uid]; else touch();
    saveTriggers(doc, opts);
    return { text: c.removed(describeTrigger(gone, lang)) };
  }
  const parsed = parseAlertArgument(arg);
  if (!parsed.ok) return { text: parsed.error === "out_of_range" ? c.range[parsed.type] : c.err[parsed.error] || c.err.bad_format };
  const list = user?.triggers || [];
  if (list.some((t) => ruleKey(t) === ruleKey(parsed.trigger))) return { text: c.err.duplicate };
  if (list.length >= MAX_TRIGGERS) return { text: c.err.limit };
  const trigger = { id: newId(), ...parsed.trigger, createdAt: new Date().toISOString() };
  doc.users[uid] = { lang, triggers: [...list, trigger] };
  doc.version = 1;
  saveTriggers(doc, opts);
  return { text: c.added(describeTrigger(trigger, lang)) };
}

/** Text appended to the /alerts card: the member's custom rules (if any) and a one-line hint. Never throws. */
export function alertCardSuffix(userId, lang, opts) {
  try {
    const l = normLang(lang) || "zh";
    const c = copyFor(l);
    const lines = userId === undefined ? [] : triggerLines(userId, l, opts);
    return lines.length ? `\n\n${[c.cardHead, ...lines, c.cardHint].join("\n")}` : `\n\n${c.cardHint}`;
  } catch { return ""; }
}
export const stopAllText = (lang) => copyFor(lang).stopAll;
export const alertErrorText = (lang) => copyFor(lang).failed;

// ---------- evaluation (sender) ----------
const sitePath = (lang, p, src) => `${SITE}${LOCALE_PATH[lang] ?? ""}${p}?src=${src}`;
const pathFor = (type, slug) => (type === "price" || type === "move" ? (slug ? `/coins/${encodeURIComponent(slug)}` : "/coins") : { liquidation: "/liquidations", funding: "/funding-rates", listing: "/flash" }[type]);

/** HTML alert for one fired rule. `data` carries the facts observed when it fired. */
export function triggerMessage(type, data, lang) {
  const l = LANGS.includes(lang) ? lang : "zh";
  const c = copyFor(l);
  const lines = [];
  const priceFacts = (d) => [c.now(fmt.price(l, d.price)), Number.isFinite(d.change1hPct) ? `${c.h1} ${fmt.pct(l, d.change1hPct)}` : null, Number.isFinite(d.change24hPct) ? `${c.h24} ${fmt.pct(l, d.change24hPct)}` : null].filter(Boolean).map(esc).join(" · ");
  if (type === "price") lines.push(`<b>${esc(c.head.price(data.coin, data.op, fmt.price(l, data.value)))}</b>`, priceFacts(data));
  else if (type === "move") lines.push(`<b>${esc(c.head.move(data.coin, fmt.pct(l, data.change1hPct)))}</b>`, priceFacts(data));
  else if (type === "liquidation") lines.push(`<b>${esc(c.head.liquidation(fmt.usd(l, data.totalUsd)))}</b>`, esc(c.split(fmt.usd(l, data.longUsd || 0), fmt.usd(l, data.shortUsd || 0))));
  else if (type === "funding") {
    lines.push(`<b>${esc(c.head.funding(data.coin))}</b>`);
    for (const h of data.hits) lines.push(esc([`${h.symbol} ${fmt.rate(l, h.rate, true)} (${h.venue})`, fmt.hhmm(h.nextAt) && c.next(fmt.hhmm(h.nextAt))].filter(Boolean).join(" · ")));
  } else if (type === "listing") lines.push(`<b>${esc(c.head.listing(VENUES[data.venue] || data.venue))}</b>`, esc(String(data.title || "").slice(0, 200)));
  lines.push("", `<a href="${sitePath(l, pathFor(type, data.slug), `tg-alert-${type}`)}">${esc(c.more)}</a>`, c.manage);
  return lines.join("\n");
}

const getFrom = (m, k) => (m instanceof Map ? m.get(k) : m?.[k]);
// The rate that counts is the more extreme of Binance and OKX for the coin.
const fundingPick = (row) => [["Binance", row.binanceRate, row.binanceNextAt], ["OKX", row.okxRate, row.okxNextAt]]
  .filter(([, r]) => Number.isFinite(r)).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];

// Returns the fired payloads for one rule (most kinds fire at most one; listing can fire one per new announcement).
function check(t, s, uid, st, ctx) {
  const { now } = ctx;
  const cool = (ms) => now - (s.firedAt || 0) >= ms;
  if (t.type === "price") {
    const q = getFrom(ctx.prices, t.coin);
    if (!(q?.price > 0)) return [];
    const side = q.price >= t.value ? "above" : "below";
    const prev = s.side;
    s.side = side; // first observation only records the side; a level already beyond the line never fires
    if (!prev || prev === side || side !== t.op || !cool(COOLDOWN.price)) return [];
    s.firedAt = now;
    return [{ coin: t.coin, op: t.op, value: t.value, price: q.price, change1hPct: q.change1hPct, change24hPct: q.change24hPct, slug: getFrom(ctx.coinSlugs, t.coin) }];
  }
  if (t.type === "move") {
    const q = getFrom(ctx.prices, t.coin);
    if (!Number.isFinite(q?.change1hPct) || Math.abs(q.change1hPct) < t.pct || !cool(COOLDOWN.move)) return [];
    s.firedAt = now;
    return [{ coin: t.coin, price: q.price, change1hPct: q.change1hPct, change24hPct: q.change24hPct, slug: getFrom(ctx.coinSlugs, t.coin) }];
  }
  if (t.type === "liquidation") {
    const h1 = ctx.market?.liquidations?.h1;
    if (!(h1?.totalUsd >= t.minUsd) || !cool(COOLDOWN.liquidation)) return [];
    s.firedAt = now;
    return [{ totalUsd: h1.totalUsd, longUsd: h1.longUsd, shortUsd: h1.shortUsd }];
  }
  if (t.type === "funding") {
    s.coins = Object.fromEntries(Object.entries(s.coins || {}).filter(([, at]) => now - at < COOLDOWN.funding));
    const hits = (ctx.market?.funding?.rows || [])
      .filter((r) => (!t.coin || String(r.symbol).toUpperCase() === t.coin) && !s.coins[r.symbol])
      .map((r) => { const p = fundingPick(r); return p && { symbol: r.symbol, venue: p[0], rate: p[1], nextAt: p[2] }; })
      .filter((h) => h && Math.abs(h.rate) >= t.absRate)
      .sort((a, b) => Math.abs(b.rate) - Math.abs(a.rate)).slice(0, 5);
    if (!hits.length) return [];
    for (const h of hits) s.coins[h.symbol] = now;
    s.firedAt = now;
    return [{ coin: t.coin, hits }];
  }
  if (t.type === "listing") {
    const seen = (st.seen[uid] ||= {});
    const items = (ctx.announcements || []).filter((i) => i?.category === "listing" && i.venue === t.venue && i.id && now - Date.parse(i.publishedAt) < LISTING_WINDOW && !seen[i.id]);
    for (const i of items) seen[i.id] = now;
    if (!s.baselined) { s.baselined = true; return []; } // a new rule never floods the member with older listings
    return items.map((i) => ({ venue: t.venue, title: i.title, id: i.id }));
  }
  return [];
}

/**
 * Pure evaluation of every stored rule against one market snapshot.
 * prices: COIN -> {price, change1hPct?, change24hPct?}; coinSlugs: SYMBOL -> coin page slug; subs: alert-subscriptions doc
 * (language fallback). Returns {deliveries, dropped, state}; the caller stores `state` and sends `deliveries`.
 */
export function evaluateTriggers({ doc, state, now = Date.now(), prices = {}, market = {}, announcements = [], coinSlugs = {}, subs } = {}) {
  const st = { byId: {}, seen: {}, day: "", counts: {}, ...structuredClone(state || {}) };
  const today = new Date(now).toISOString().slice(0, 10);
  if (st.day !== today) { st.day = today; st.counts = {}; }
  const ctx = { now, prices, market, announcements, coinSlugs };
  const deliveries = [], dropped = [], live = new Set(), listingUsers = new Set();
  for (const [uid, user] of Object.entries(doc?.users || {})) {
    const lang = normLang(user?.lang) || normLang(subs?.users?.[uid]?.lang) || "zh";
    for (const t of user?.triggers || []) {
      if (!t?.id) continue;
      const key = `${uid}:${t.id}`;
      live.add(key);
      if (t.type === "listing") listingUsers.add(uid);
      const s = (st.byId[key] ||= {});
      for (const data of check(t, s, uid, st, ctx)) {
        // over the daily cap: dropped and logged by the caller, never queued for later
        if ((st.counts[uid] || 0) >= DAILY_CAP) { dropped.push({ uid, triggerId: t.id, type: t.type }); continue; }
        st.counts[uid] = (st.counts[uid] || 0) + 1;
        deliveries.push({ uid, lang, triggerId: t.id, type: t.type, text: triggerMessage(t.type, data, lang), buttons: null });
      }
    }
  }
  for (const key of Object.keys(st.byId)) if (!live.has(key)) delete st.byId[key];
  for (const uid of Object.keys(st.seen)) {
    if (!listingUsers.has(uid)) { delete st.seen[uid]; continue; }
    for (const [id, at] of Object.entries(st.seen[uid])) if (now - at > 7 * 24 * H) delete st.seen[uid][id];
  }
  for (const uid of Object.keys(st.counts)) if (!doc?.users?.[uid]) delete st.counts[uid];
  return { deliveries, dropped, state: st };
}

/** Coins whose 1h change the sender must fetch (move rules), deduplicated and capped. */
export function moveCoins(doc, cap = 40) {
  return [...new Set(Object.values(doc?.users || {}).flatMap((u) => (u?.triggers || []).filter((t) => t.type === "move").map((t) => t.coin)))].slice(0, cap);
}
export const countTriggers = (doc) => Object.values(doc?.users || {}).reduce((n, u) => n + (u?.triggers?.length || 0), 0);

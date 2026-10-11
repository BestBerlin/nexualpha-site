// Channel-local rhythm helpers for the Telegram alert sender.
// This module is intentionally independent from alert-sender.mjs so tests can import it without a circular dependency.
export const RHYTHM_LANGS = ["zh", "en", "ru", "tr", "vi"];
export const RHYTHM_TIMEZONE = {
  zh: "Asia/Shanghai",
  en: "UTC",
  ru: "Europe/Moscow",
  tr: "Europe/Istanbul",
  vi: "Asia/Ho_Chi_Minh",
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const SITE = "https://nexualpha.com";
const LOCALE_PATH = { zh: "/zh-hans", en: "", ru: "/ru", tr: "/tr", vi: "/vi" };
const INTL = { zh: "zh-CN", en: "en-US", ru: "ru-RU", tr: "tr-TR", vi: "vi-VN" };
const fmtUsdShort = (lang, n) => new Intl.NumberFormat(INTL[lang] || "en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(n);
const fmtPrice = (lang, n) => new Intl.NumberFormat(INTL[lang] || "en-US", { maximumFractionDigits: n >= 1000 ? 0 : 2 }).format(n);
const fmtPct = (lang, n) => new Intl.NumberFormat(INTL[lang] || "en-US", { style: "percent", signDisplay: "exceptZero", maximumFractionDigits: 2 }).format(n / 100);
const fmtFunding = (lang, rate) => new Intl.NumberFormat(INTL[lang] || "en-US", { style: "percent", signDisplay: "exceptZero", minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(rate);

const TEXT = {
  zh: {
    title: "<b>🌅 NexuAlpha 早间快照</b>",
    price: "价格 · 24h",
    liq: (l, s) => `24h 爆仓下限：多 ${l} / 空 ${s}`,
    funding: "资金费率异动",
    noFunding: "资金费率异动：暂无可用数据",
    read: "查看市场数据 →",
    pollQuestion: "本周 BTC：上涨 / 下跌 / 横盘？",
    pollOptions: ["上涨", "下跌", "横盘"],
  },
  en: {
    title: "<b>🌅 NexuAlpha morning snapshot</b>",
    price: "Price · 24h",
    liq: (l, s) => `24h liquidations lower bound: long ${l} / short ${s}`,
    funding: "Funding outliers",
    noFunding: "Funding outliers: no usable rows yet",
    read: "View market data →",
    pollQuestion: "This week BTC: up / down / sideways",
    pollOptions: ["Up", "Down", "Sideways"],
  },
  ru: {
    title: "<b>🌅 Утренний обзор NexuAlpha</b>",
    price: "Цена · 24ч",
    liq: (l, s) => `Ликвидации за 24ч, нижняя оценка: лонги ${l} / шорты ${s}`,
    funding: "Аномалии фандинга",
    noFunding: "Аномалии фандинга: данных пока нет",
    read: "Открыть рыночные данные →",
    pollQuestion: "BTC на этой неделе: рост / снижение / боковик?",
    pollOptions: ["Рост", "Снижение", "Боковик"],
  },
  tr: {
    title: "<b>🌅 NexuAlpha sabah özeti</b>",
    price: "Fiyat · 24s",
    liq: (l, s) => `24s likidasyon alt sınırı: long ${l} / short ${s}`,
    funding: "Fonlama uç değerleri",
    noFunding: "Fonlama uç değerleri: kullanılabilir veri yok",
    read: "Piyasa verilerini aç →",
    pollQuestion: "Bu hafta BTC: yukarı / aşağı / yatay?",
    pollOptions: ["Yukarı", "Aşağı", "Yatay"],
  },
  vi: {
    title: "<b>🌅 Bản tin sáng NexuAlpha</b>",
    price: "Giá · 24h",
    liq: (l, s) => `Thanh lý 24h mức tối thiểu: long ${l} / short ${s}`,
    funding: "Funding bất thường",
    noFunding: "Funding bất thường: chưa có dữ liệu dùng được",
    read: "Xem dữ liệu thị trường →",
    pollQuestion: "Tuần này BTC: tăng / giảm / đi ngang?",
    pollOptions: ["Tăng", "Giảm", "Đi ngang"],
  },
};

export function localSlot(now, lang) {
  const timeZone = RHYTHM_TIMEZONE[lang];
  if (!timeZone) return null;
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(now);
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour), minute: Number(parts.minute), weekday, timeZone };
}

export function dueRhythmSlots(now, lang) {
  const slot = localSlot(now, lang);
  if (!slot) return [];
  const out = [];
  if (slot.hour === 8) out.push({ kind: "morning", key: `${slot.date}:08`, local: slot });
  if (slot.weekday === "Mon" && slot.hour === 12) out.push({ kind: "weeklyPoll", key: `${slot.date}:12`, local: slot });
  return out;
}

export function fundingOutliers(market, limit = 3) {
  return (Array.isArray(market?.funding?.rows) ? market.funding.rows : [])
    .map((row) => {
      const rates = [
        ["Binance", Number.isFinite(row.binanceRate) ? row.binanceRate : null],
        ["OKX", Number.isFinite(row.okxRate) ? row.okxRate : null],
      ].filter(([, rate]) => rate !== null);
      const maxAbs = rates.reduce((m, [, rate]) => Math.max(m, Math.abs(rate)), 0);
      return { symbol: row.symbol, rates, maxAbs };
    })
    .filter((row) => row.symbol && row.rates.length)
    .sort((a, b) => b.maxAbs - a.maxAbs || String(a.symbol).localeCompare(String(b.symbol)))
    .slice(0, limit);
}

function requiredMorningMajors(market) {
  const majors = Array.isArray(market?.market?.majors) ? market.market.majors : [];
  return ["BTCUSDT", "ETHUSDT", "SOLUSDT"].map((symbol) => {
    const row = majors.find((m) => m?.symbol === symbol);
    if (!Number.isFinite(row?.price) || !Number.isFinite(row?.change24hPct)) throw new Error(`morning snapshot missing ${symbol} price/change`);
    return row;
  });
}

function requiredLiquidations(market) {
  const h24 = market?.liquidations?.h24 || {};
  if (!Number.isFinite(h24.longUsd) || !Number.isFinite(h24.shortUsd)) throw new Error("morning snapshot missing 24h liquidation long/short");
  return h24;
}

export function morningSnapshotMessage(market, lang, { disclosure = "" } = {}) {
  const t = TEXT[lang] || TEXT.en;
  const majors = requiredMorningMajors(market);
  const h24 = requiredLiquidations(market);
  const lines = [t.title, "", `<b>${t.price}</b>`];
  for (const m of majors) lines.push(`${m.symbol.replace("USDT", "")} ${fmtPrice(lang, m.price)}  ${fmtPct(lang, m.change24hPct)}`);
  lines.push("", t.liq(fmtUsdShort(lang, h24.longUsd), fmtUsdShort(lang, h24.shortUsd)));
  const outliers = fundingOutliers(market);
  if (outliers.length) {
    lines.push("", `<b>${t.funding}</b>`);
    for (const row of outliers) lines.push(`${esc(row.symbol)} ${row.rates.map(([venue, rate]) => `${venue} ${fmtFunding(lang, rate)}`).join(" / ")}`);
  } else {
    lines.push("", t.noFunding);
  }
  lines.push("", `<a href="${SITE}${LOCALE_PATH[lang] || ""}/liquidations?src=tg-morning-${lang}">${t.read}</a>`);
  if (disclosure) lines.push("", disclosure);
  // Image-card hook: callers can replace this text send with a rendered card using the same market payload and slot key.
  return { text: lines.join("\n"), imageCard: { kind: "morning-snapshot", lang, assets: ["BTC", "ETH", "SOL"] } };
}

export function weeklyPollPayload(lang) {
  const t = TEXT[lang] || TEXT.en;
  return { question: t.pollQuestion, options: t.pollOptions.map((text) => ({ text })), is_anonymous: false };
}

function validObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function validateExistingRhythmState(state) {
  if (!validObject(state)) throw new Error("channel rhythm state root is corrupt");
  if (state.channelRhythm === undefined) return;
  if (!validObject(state.channelRhythm)) throw new Error("channel rhythm state is corrupt");
  for (const name of ["morning", "weeklyPoll"]) {
    const map = state.channelRhythm[name];
    if (map === undefined) continue;
    if (!validObject(map)) throw new Error("channel rhythm state maps are corrupt");
    for (const [key, value] of Object.entries(map)) {
      if (typeof value !== "string") throw new Error(`channel rhythm ${name} record is corrupt: ${key}`);
    }
  }
}

function ensureRhythmState(state) {
  if (state.channelRhythm === undefined) state.channelRhythm = {};
  if (state.channelRhythm.morning === undefined) state.channelRhythm.morning = {};
  if (state.channelRhythm.weeklyPoll === undefined) state.channelRhythm.weeklyPoll = {};
  return state.channelRhythm;
}

export async function runChannelRhythm({ channels, state, now = new Date(), market, partners = [], sendMessage, sendPoll, save, dryRun = false, disclosureFor = () => "", buttonsFor = () => null }) {
  validateExistingRhythmState(state);
  const next = structuredClone(state);
  const rhythm = ensureRhythmState(next);
  const errors = [];
  for (const [lang, chat] of channels) {
    if (!RHYTHM_LANGS.includes(lang) || !chat) continue;
    const chatKey = `${lang}:${chat}`;
    for (const slot of dueRhythmSlots(now, lang)) {
      if (rhythm[slot.kind][chatKey] === slot.key) continue;
      try {
        if (slot.kind === "morning") {
          const msg = morningSnapshotMessage(market, lang, { disclosure: disclosureFor(lang) });
          await sendMessage(chat, msg.text, buttonsFor(lang, `tg-morning-${lang}`), { slot, partners });
        } else {
          await sendPoll(chat, weeklyPollPayload(lang), { slot });
        }
        rhythm[slot.kind][chatKey] = slot.key;
        if (!dryRun) {
          Object.assign(state, next);
          await save(state);
        }
      } catch (error) {
        errors.push(`${chatKey} ${slot.kind}: ${error.message}`);
      }
    }
  }
  if (dryRun) return state;
  if (errors.length) {
    Object.assign(state, next);
    throw new Error(`channel rhythm failed: ${errors.join("; ")}`);
  }
  Object.assign(state, next);
  return state;
}

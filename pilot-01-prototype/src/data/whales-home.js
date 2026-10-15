import { localizedHref } from "./locale-routing.js";
import { formatSgt } from "./local-time.js";
import { sentencePack } from "./whale-sentences.js";

export const WHALES_API_PATH = "/api/whales.json";

export const WHALES_HOME_ROWS_MOBILE = 6;
export const WHALES_HOME_ROWS_DESKTOP = 8;

const COPY = Object.freeze({
  en: { title: "Whale watch", all: "View all", live: "Live", unknown: "unknown wallet", whale: "Whales", whaleOne: "Whale", avg: "avg",
    tabs: { signals: "Quiet accumulation", positions: "Large positions", transfers: "Large transfers" },
    actions: { accumulation: "accumulating", distribution: "distributing", add: "adding", reduce: "reducing", open: "opened", close: "closed", increase: "increased", decrease: "decreased", long: "long", short: "short", coordinatedLong: "coordinated long", coordinatedShort: "coordinated short", liquidation: "liquidated", transfer: "moved" },
    wallets: (n) => `${n} whales`, period: (p) => `over ${p}` },
  "zh-Hans": { title: "巨鲸动向", all: "查看全部", live: "实时", unknown: "未知钱包", whale: "巨鲸", whaleOne: "巨鲸", avg: "均价",
    tabs: { signals: "悄悄建仓/布局", positions: "大额持仓", transfers: "大额转账" },
    actions: { accumulation: "建仓", distribution: "出货", add: "加仓", reduce: "减仓", open: "开仓", close: "平仓", increase: "加仓", decrease: "减仓", long: "做多", short: "做空", coordinatedLong: "同步做多", coordinatedShort: "同步做空", liquidation: "被强平", transfer: "转账" },
    wallets: (n) => `${n} 个巨鲸`, period: (p) => `${p} 内` },
  "zh-Hant": { title: "巨鯨動向", all: "查看全部", live: "即時", unknown: "未知錢包", whale: "巨鯨", whaleOne: "巨鯨", avg: "均價",
    tabs: { signals: "悄悄建倉/佈局", positions: "大額持倉", transfers: "大額轉帳" },
    actions: { accumulation: "建倉", distribution: "出貨", add: "加倉", reduce: "減倉", open: "開倉", close: "平倉", increase: "加倉", decrease: "減倉", long: "做多", short: "做空", coordinatedLong: "同步做多", coordinatedShort: "同步做空", liquidation: "被強平", transfer: "轉帳" },
    wallets: (n) => `${n} 個巨鯨`, period: (p) => `${p} 內` },
  es: { title: "Movimientos de ballenas", all: "Ver todo", live: "En vivo", unknown: "billetera desconocida", whale: "Ballenas", whaleOne: "Ballena", avg: "precio medio", tabs: { signals: "Acumulación discreta", positions: "Grandes posiciones", transfers: "Grandes transferencias" }, actions: { accumulation: "acumulan", distribution: "distribuyen", add: "aumentan", reduce: "reducen", open: "abren", close: "cierran", increase: "aumentan", decrease: "reducen", long: "largo", short: "corto", coordinatedLong: "largo coordinado", coordinatedShort: "corto coordinado", liquidation: "liquidadas", transfer: "mueven" }, wallets: (n) => `${n} ballenas`, period: (p) => `en ${p}` },
  "pt-BR": { title: "Movimentos de baleias", all: "Ver tudo", live: "Ao vivo", unknown: "carteira desconhecida", whale: "Baleias", whaleOne: "Baleia", avg: "preço médio", tabs: { signals: "Acumulação discreta", positions: "Grandes posições", transfers: "Grandes transferências" }, actions: { accumulation: "acumulam", distribution: "distribuem", add: "aumentam", reduce: "reduzem", open: "abrem", close: "fecham", increase: "aumentam", decrease: "reduzem", long: "long", short: "short", coordinatedLong: "long coordenado", coordinatedShort: "short coordenado", liquidation: "liquidadas", transfer: "movem" }, wallets: (n) => `${n} baleias`, period: (p) => `em ${p}` },
  fr: { title: "Mouvements des baleines", all: "Tout voir", live: "En direct", unknown: "wallet inconnu", whale: "Baleines", whaleOne: "Baleine", avg: "prix moyen", tabs: { signals: "Accumulation discrète", positions: "Grosses positions", transfers: "Gros transferts" }, actions: { accumulation: "accumulent", distribution: "distribuent", add: "renforcent", reduce: "réduisent", open: "ouvrent", close: "ferment", increase: "renforcent", decrease: "réduisent", long: "long", short: "short", coordinatedLong: "long coordonné", coordinatedShort: "short coordonné", liquidation: "liquidées", transfer: "déplacent" }, wallets: (n) => `${n} baleines`, period: (p) => `sur ${p}` },
  de: { title: "Whale-Bewegungen", all: "Alle ansehen", live: "Live", unknown: "unbekannte Wallet", whale: "Whales", whaleOne: "Whale", avg: "Durchschnitt", tabs: { signals: "Leiser Aufbau", positions: "Große Positionen", transfers: "Große Transfers" }, actions: { accumulation: "bauen auf", distribution: "verteilen", add: "stocken auf", reduce: "reduzieren", open: "eröffnen", close: "schließen", increase: "erhöhen", decrease: "reduzieren", long: "long", short: "short", coordinatedLong: "koordiniert long", coordinatedShort: "koordiniert short", liquidation: "liquidiert", transfer: "bewegen" }, wallets: (n) => `${n} Whales`, period: (p) => `über ${p}` },
  it: { title: "Movimenti delle balene", all: "Vedi tutto", live: "Live", unknown: "wallet sconosciuto", whale: "Balene", whaleOne: "Balena", avg: "prezzo medio", tabs: { signals: "Accumulo discreto", positions: "Grandi posizioni", transfers: "Grandi trasferimenti" }, actions: { accumulation: "accumulano", distribution: "distribuiscono", add: "aumentano", reduce: "riducono", open: "aprono", close: "chiudono", increase: "aumentano", decrease: "riducono", long: "long", short: "short", coordinatedLong: "long coordinato", coordinatedShort: "short coordinato", liquidation: "liquidate", transfer: "spostano" }, wallets: (n) => `${n} balene`, period: (p) => `in ${p}` },
  ja: { title: "クジラ動向", all: "すべて見る", live: "ライブ", unknown: "不明ウォレット", whale: "クジラ", whaleOne: "クジラ", avg: "平均", tabs: { signals: "静かな蓄積", positions: "大口ポジション", transfers: "大口送金" }, actions: { accumulation: "蓄積", distribution: "分配", add: "追加", reduce: "縮小", open: "新規", close: "決済", increase: "追加", decrease: "縮小", long: "ロング", short: "ショート", coordinatedLong: "協調ロング", coordinatedShort: "協調ショート", liquidation: "清算", transfer: "移動" }, wallets: (n) => `${n}頭のクジラ`, period: (p) => `${p}` },
  ko: { title: "고래 동향", all: "전체 보기", live: "실시간", unknown: "미확인 지갑", whale: "고래", whaleOne: "고래", avg: "평균가", tabs: { signals: "조용한 매집", positions: "대형 포지션", transfers: "대형 이체" }, actions: { accumulation: "매집", distribution: "분산", add: "추가", reduce: "축소", open: "신규", close: "종료", increase: "증가", decrease: "감소", long: "롱", short: "숏", coordinatedLong: "동시 롱", coordinatedShort: "동시 숏", liquidation: "청산", transfer: "이동" }, wallets: (n) => `${n}개 고래`, period: (p) => `${p}` },
  ru: { title: "Движения китов", all: "Все", live: "Онлайн", unknown: "неизвестный кошелек", whale: "Киты", whaleOne: "Кит", avg: "средняя", tabs: { signals: "Тихое накопление", positions: "Крупные позиции", transfers: "Крупные переводы" }, actions: { accumulation: "накапливают", distribution: "распределяют", add: "добавляют", reduce: "сокращают", open: "открывают", close: "закрывают", increase: "увеличивают", decrease: "сокращают", long: "лонг", short: "шорт", coordinatedLong: "синхронный лонг", coordinatedShort: "синхронный шорт", liquidation: "ликвидированы", transfer: "переводят" }, wallets: (n) => `${n} китов`, period: (p) => `за ${p}` },
  tr: { title: "Balina hareketleri", all: "Tümünü gör", live: "Canlı", unknown: "bilinmeyen cüzdan", whale: "Balinalar", whaleOne: "Balina", avg: "ortalama", tabs: { signals: "Sessiz birikim", positions: "Büyük pozisyonlar", transfers: "Büyük transferler" }, actions: { accumulation: "biriktiriyor", distribution: "dağıtıyor", add: "ekliyor", reduce: "azaltıyor", open: "açıyor", close: "kapatıyor", increase: "artırıyor", decrease: "azaltıyor", long: "long", short: "short", coordinatedLong: "eşzamanlı long", coordinatedShort: "eşzamanlı short", liquidation: "likide", transfer: "taşıyor" }, wallets: (n) => `${n} balina`, period: (p) => `${p} içinde` },
  id: { title: "Gerak whale", all: "Lihat semua", live: "Langsung", unknown: "dompet tidak dikenal", whale: "Whale", whaleOne: "Whale", avg: "rata-rata", tabs: { signals: "Akumulasi senyap", positions: "Posisi besar", transfers: "Transfer besar" }, actions: { accumulation: "mengakumulasi", distribution: "mendistribusi", add: "menambah", reduce: "mengurangi", open: "membuka", close: "menutup", increase: "menambah", decrease: "mengurangi", long: "long", short: "short", coordinatedLong: "long serempak", coordinatedShort: "short serempak", liquidation: "terlikuidasi", transfer: "memindahkan" }, wallets: (n) => `${n} whale`, period: (p) => `dalam ${p}` },
  vi: { title: "Dòng tiền cá voi", all: "Xem tất cả", live: "Trực tiếp", unknown: "ví chưa xác định", whale: "Cá voi", whaleOne: "Cá voi", avg: "giá bình quân", tabs: { signals: "Âm thầm gom", positions: "Vị thế lớn", transfers: "Chuyển khoản lớn" }, actions: { accumulation: "gom", distribution: "phân phối", add: "tăng thêm", reduce: "giảm", open: "mở", close: "đóng", increase: "tăng", decrease: "giảm", long: "long", short: "short", coordinatedLong: "cùng long", coordinatedShort: "cùng short", liquidation: "bị thanh lý", transfer: "chuyển" }, wallets: (n) => `${n} cá voi`, period: (p) => `trong ${p}` },
  ar: { title: "تحركات الحيتان", all: "عرض الكل", live: "مباشر", unknown: "محفظة غير معروفة", whale: "الحيتان", whaleOne: "حوت", avg: "متوسط", tabs: { signals: "تجميع هادئ", positions: "مراكز كبيرة", transfers: "تحويلات كبيرة" }, actions: { accumulation: "تجمع", distribution: "توزع", add: "تزيد", reduce: "تخفض", open: "فتح", close: "إغلاق", increase: "زيادة", decrease: "خفض", long: "شراء", short: "بيع", coordinatedLong: "شراء منسق", coordinatedShort: "بيع منسق", liquidation: "تصفية", transfer: "نقل" }, wallets: (n) => `${n} حيتان`, period: (p) => `خلال ${p}` },
  ur: { title: "وہیل سرگرمی", all: "سب دیکھیں", live: "لائیو", unknown: "نامعلوم والٹ", whale: "وہیلز", whaleOne: "وہیل", avg: "اوسط", tabs: { signals: "خاموش جمع آوری", positions: "بڑی پوزیشنز", transfers: "بڑی منتقلیاں" }, actions: { accumulation: "جمع کر رہے ہیں", distribution: "تقسیم کر رہے ہیں", add: "اضافہ کر رہے ہیں", reduce: "کم کر رہے ہیں", open: "کھول رہے ہیں", close: "بند کر رہے ہیں", increase: "بڑھا رہے ہیں", decrease: "کم کر رہے ہیں", long: "لانگ", short: "شارٹ", coordinatedLong: "ہم وقت لانگ", coordinatedShort: "ہم وقت شارٹ", liquidation: "لیکویڈیٹ", transfer: "منتقل" }, wallets: (n) => `${n} وہیلز`, period: (p) => `${p} میں` },
  uk: { title: "Рухи китів", all: "Усе", live: "Наживо", unknown: "невідомий гаманець", whale: "Кити", whaleOne: "Кит", avg: "середня", tabs: { signals: "Тихе накопичення", positions: "Великі позиції", transfers: "Великі перекази" }, actions: { accumulation: "накопичують", distribution: "розподіляють", add: "додають", reduce: "скорочують", open: "відкривають", close: "закривають", increase: "збільшують", decrease: "скорочують", long: "лонг", short: "шорт", coordinatedLong: "синхронний лонг", coordinatedShort: "синхронний шорт", liquidation: "ліквідовано", transfer: "переказують" }, wallets: (n) => `${n} китів`, period: (p) => `за ${p}` },
});

export const WHALES_COPY_LOCALES = Object.freeze(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"]);
export const whalesCopy = (locale = "en") => COPY[locale] || (String(locale || "").startsWith("zh") ? COPY["zh-Hans"] : COPY.en);

const esc = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const number = (value) => {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const safeHttpsUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
};
const formatUsd = (value) => {
  const n = number(value);
  if (n == null) return "—";
  const abs = Math.abs(n);
  const scaled = abs >= 1e9 ? [abs / 1e9, "B"] : abs >= 1e6 ? [abs / 1e6, "M"] : abs >= 1e3 ? [abs / 1e3, "K"] : [abs, ""];
  const digits = scaled[0] >= 100 ? 0 : scaled[0] >= 10 ? 1 : 2;
  return `${n < 0 ? "−" : ""}$${scaled[0].toFixed(digits)}${scaled[1]}`;
};
const formatAmount = (value, asset = "") => {
  const n = number(value);
  if (n == null) return "—";
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 0 : abs >= 10 ? 2 : 4;
  return `${n.toLocaleString("en-US", { maximumFractionDigits: digits })}${asset ? ` ${asset}` : ""}`;
};
const formatPrice = (value) => {
  const n = number(value);
  if (n == null) return "";
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 0 : abs >= 100 ? 1 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits })}`;
};
const upper = (value) => String(value || "").toUpperCase();
const STABLES = new Set(["USDT", "USDC"]);
const shortAddress = (value) => {
  const s = String(value || "");
  return s.length > 12 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
};
const explorerUrl = (value) => {
  const url = safeHttpsUrl(value);
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname;
    if (host === "app.hyperliquid.xyz" && /^\/explorer\/(address|tx)\//.test(path)) return url;
    if (host === "hypurrscan.io") return url;
    if (["mempool.space", "etherscan.io", "tronscan.org", "basescan.org"].includes(host)) return url;
    return "";
  } catch {
    return "";
  }
};
const eventTime = (row, snapshot) => row.time || row.updatedAt || snapshot?.updatedAt || snapshot?.generatedAt || "";
const stableId = (row, prefix, index) => String(row.id || row.txHash || `${prefix}-${index}`);
const signalAction = (row) => {
  const raw = String(row.signalType || row.type || row.signal || row.action || row.label || "").toLowerCase();
  if (/(coordinated|sync|同[步時时]).*(short|空)|(short|空).*(coordinated|sync|同[步時时])/.test(raw)) return "coordinatedShort";
  if (/(coordinated|sync|同[步時时]).*(long|多)|(long|多).*(coordinated|sync|同[步時时])/.test(raw)) return "coordinatedLong";
  if (/dist|sell|out|出货|減倉|减仓/.test(raw)) return "distribution";
  if (/reduce|decrease|减|減/.test(raw)) return "reduce";
  if (/short|空/.test(raw)) return "short";
  if (/add|increase|加/.test(raw)) return "add";
  if (/long|多/.test(raw)) return "long";
  return "accumulation";
};
const rowKind = (row) => row.homeKind || row.kind || row.eventKind || row.category || "transfer";
const isSignal = (row) => ["signal", "accumulation", "distribution", "smart_money"].includes(rowKind(row))
  || Boolean(row?.signalType);
const isPosition = (row) => ["position", "hyperliquid_position", "liquidation"].includes(rowKind(row))
  || /hyperliquid/i.test(String(row?.platform || row?.venue || ""));

const sideOf = (row) => {
  const raw = String(row.side || row.market || "").toLowerCase();
  if (raw.includes("spot")) return "spot";
  return raw.includes("short") ? "short" : "long";
};
const periodHoursOf = (row) => {
  const h = number(row.periodHours);
  if (h != null && h > 0) return h;
  const m = /^(\d+)\s*([hd])$/i.exec(String(row.period || ""));
  return m ? Number(m[1]) * (m[2].toLowerCase() === "d" ? 24 : 1) : 24;
};
const periodText = (row, pack) => pack.dur(Math.max(1, Math.round(periodHoursOf(row))));
const pricePart = (pack, value, key = "avg") => (number(value) != null && number(value) > 0 ? pack[key](formatPrice(value)) : "");
const levPart = (pack, value) => (number(value) && number(value) >= 1 ? pack.lev(Number(value).toFixed(Number(value) >= 10 ? 0 : 1).replace(/\.0$/, "")) : "");
const pnlPart = (pack, value) => (number(value) != null && Math.abs(number(value)) >= 1_000 ? pack.pnl(formatUsd(Math.abs(number(value))), number(value) > 0) : "");

function signalParts(row, pack) {
  const side = sideOf(row);
  const p = { who: pack.whale(shortAddress(row.address || row.addresses?.[0]) || ""), coin: upper(row.coin || row.asset || row.symbol || ""), side, sideWord: pack.side[side], days: number(row.days) || 0, n: number(row.walletsCount ?? row.walletCount) || 0, period: periodText(row, pack) };
  const amount = formatUsd(row.totalUsd ?? row.sizeUsd ?? row.amountUsd ?? row.usd);
  const type = String(row.signalType || row.type || "").toLowerCase();
  const mode = String(row.mode || "").toLowerCase();
  const stealth = stealthOf(row);
  if (stealth && pack.stealth && p.n <= 1) {
    const st = pack.stealth;
    const verb = stealth === "buy" ? (p.days >= 2 ? st.buyDays : st.buy24) : (p.days >= 2 ? st.sellDays : st.sell24);
    return [`${verb(p)}${pack.total}`, amount, pricePart(pack, stealth === "buy" ? (row.avgEntry ?? row.entryPx) : row.avgExit, stealth === "buy" ? "avg" : "exit")];
  }
  if (type.startsWith("coordinated") || mode === "cluster" || p.n > 1) return [`${pack.cluster({ ...p, side: /short/.test(type) ? "short" : side })}${pack.sum}`, amount, pricePart(pack, row.avgEntry ?? row.entryPx)];
  if (type === "exchange-withdrawal-accumulation") return [`${pack.withdraw({ ...p, who: pack.wallet(p.who.split(" ").pop()) })}${pack.total}`, amount, ""];
  if (type === "new-position" || mode === "new") return [pack.fresh(p), amount, `${levPart(pack, row.leverage)}${pricePart(pack, row.avgEntry)}`];
  const reducing = mode === "reduce" || /distribution|reduce/.test(type);
  if (reducing) return [`${side === "spot" ? pack.sell(p) : pack.reduce(p)}${pack.total}`, amount, pricePart(pack, row.avgExit, "exit")];
  if (!mode && !row.days) return [`${pack.addPeriod(p)}${pack.total}`, amount, pricePart(pack, row.avgEntry ?? row.entryPx)];
  return [`${side === "spot" ? pack.buy(p) : pack.add(p)}${pack.total}`, amount, pricePart(pack, row.avgEntry ?? row.entryPx)];
}

function eventAction(row) {
  const raw = String(row.eventType || row.type || row.action || row.kind || "").toLowerCase();
  if (/liquid/.test(raw)) return "liquidation";
  if (/close|closed|平/.test(raw)) return "close";
  if (/increase|add|加/.test(raw)) return "increase";
  if (/decrease|reduce|减|減/.test(raw)) return "decrease";
  if (/open|new|开|開/.test(raw)) return "open";
  return "hold";
}

function positionParts(row, pack) {
  const side = sideOf(row) === "short" ? "short" : "long";
  const p = { who: pack.whale(shortAddress(row.address || row.wallet || row.account) || ""), coin: upper(row.coin || row.asset || row.symbol || ""), side, sideWord: pack.side[side] };
  const action = eventAction(row);
  if (action === "close") return [pack.close(p), formatUsd(Math.max(number(row.previousNotionalUsd) || 0, number(row.sizeUsd) || 0, number(row.notionalUsd) || 0) || null), pnlPart(pack, row.closedPnlUsd ?? row.realizedPnlUsd)];
  if (action === "liquidation") return [pack.liquidation(p), formatUsd(row.sizeUsd ?? row.notionalUsd), ""];
  if (action === "increase" || action === "decrease") return [pack[action](p), formatUsd(row.notionalUsd ?? row.sizeUsd), `${levPart(pack, row.leverage)}${pricePart(pack, row.entryPx ?? row.avgEntry ?? row.entry)}`];
  const tail = `${levPart(pack, row.leverage)}${pricePart(pack, row.entryPx ?? row.avgEntry ?? row.entry)}`;
  return [action === "open" ? pack.open(p) : pack.hold(p), formatUsd(row.notionalUsd ?? row.sizeUsd), tail];
}

function transferParts(row, pack) {
  const asset = upper(row.asset || row.symbol || "");
  const from = row.fromLabel && row.fromLabel !== "unknown" ? row.fromLabel : pack.unknown;
  const to = row.toLabel && row.toLabel !== "unknown" ? row.toLabel : pack.unknown;
  const [before, after] = pack.transfer({ qty: formatAmount(row.amount, asset), from, to });
  if (number(row.amountUsd) == null && STABLES.has(asset)) {
    // Stablecoins show their face amount; no USD price is claimed for them.
    return ["", `${formatUsd(row.amount).replace("$", "")} ${asset}`, ` ${after.replace(/^[)）]\s*/, "")}`];
  }
  return [before, formatUsd(row.amountUsd), after];
}

function iconFor(row) {
  if (isSignal(row)) return "SM";
  if (isPosition(row) || String(row.venue || "").toLowerCase() === "hyperliquid") return "HL";
  return upper(row.chain || row.asset || "ON").slice(0, 3);
}

function toneFor(row) {
  const stealth = stealthOf(row);
  if (stealth) return stealth === "buy" ? "in" : "out";
  if (String(row.mode || "") === "reduce") return "out";
  if (String(row.mode || "") === "add" && String(row.side || "") !== "short") return "in";
  const direction = String(row.direction || row.side || row.signalType || row.type || row.signal || "").toLowerCase();
  if (/short|to_exchange|distribution|sell|out|reduce|减|減/.test(direction)) return "out";
  if (/long|from_exchange|accumulation|buy|add|加/.test(direction)) return "in";
  return "flat";
}

function normalizeHomeRows(snapshot) {
  const fallbackRows = Array.isArray(snapshot?.rows) ? snapshot.rows : [];
  const fallbackSignals = fallbackRows.filter(isSignal);
  const fallbackPositions = fallbackRows.filter(isPosition);
  const signals = (Array.isArray(snapshot?.signals) ? snapshot.signals : fallbackSignals).map((row, index) => ({ ...row, homeKind: "signal", id: stableId(row, "signal", index) }));
  const positions = (Array.isArray(snapshot?.positions) ? snapshot.positions : fallbackPositions).map((row, index) => ({ ...row, homeKind: row.kind || "position", id: stableId(row, "position", index) }));
  const normalizeTransferRows = (rows) => (Array.isArray(rows) ? rows : []).map((row, index) => ({
    id: stableId(row, "transfer", index),
    homeKind: "transfer",
    asset: upper(row.asset || row.symbol),
    chain: row.chain,
    amount: number(row.amount ?? row.value ?? row.tokenAmount),
    amountUsd: number(row.amountUsd ?? row.usd ?? row.valueUsd),
    fromLabel: row.fromLabel || row.from?.label || "unknown",
    toLabel: row.toLabel || row.to?.label || "unknown",
    fromExchange: row.from?.type === "exchange" || Boolean(row.fromLabel && row.fromLabel !== "unknown") || Boolean(row.from?.label && row.from.label !== "unknown"),
    toExchange: row.to?.type === "exchange" || Boolean(row.toLabel && row.toLabel !== "unknown") || Boolean(row.to?.label && row.to.label !== "unknown"),
    fromOwner: String(row.from?.owner || row.fromLabel || row.from?.label || "").toLowerCase(),
    toOwner: String(row.to?.owner || row.toLabel || row.to?.label || "").toLowerCase(),
    fromAddress: row.fromAddress || row.from?.address || "",
    toAddress: row.toAddress || row.to?.address || "",
    direction: String(row.direction || "unknown").replaceAll("-", "_"),
    time: row.time || row.at || row.timestamp,
    txHash: row.txHash || row.hash,
    explorerUrl: row.explorerUrl || row.url,
    source: row.source,
  })).filter((row) => row.asset && isMeaningfulWhaleTransfer(row));
  const normalizedTransfers = normalizeTransferRows(fallbackRows.filter((row) => !isSignal(row) && !isPosition(row)));
  const transfers = Array.isArray(snapshot?.transfers)
    ? normalizeTransferRows(snapshot.transfers)
    : normalizedTransfers;
  const complete = (row) => {
    const amount = number(row.totalUsd ?? row.sizeUsd ?? row.notionalUsd ?? row.amountUsd ?? row.usd);
    const symbol = row.coin || row.asset || row.symbol;
    if (isSignal(row)) return amount != null && amount >= 1_000_000 && Boolean(symbol);
    if (isPosition(row)) return amount != null && amount >= 1_000_000 && Boolean(symbol);
    const value = amount ?? (STABLES.has(upper(row.asset || row.symbol)) ? number(row.amount) : null);
    return value != null && value >= HOME_TRANSFER_MIN_USD && Boolean(row.asset || row.symbol) && Boolean(row.fromAddress || row.toAddress || row.txHash || row.explorerUrl);
  };
  const priority = (row) => isSignal(row) ? 0 : isPosition(row) ? 1 : 2;
  return [...signals, ...positions, ...transfers]
    .filter(complete)
    // Signals and positions keep the collector's ranking; transfers are newest first.
    .sort((a, b) => priority(a) - priority(b) || (priority(a) === 2 ? Date.parse(eventTime(b, snapshot) || 0) - Date.parse(eventTime(a, snapshot) || 0) : 0));
}

// Owner 2026-10-15: a transfer only matters when money enters or leaves an exchange. Unknown→unknown wallet moves and an
// exchange shuffling between its own wallets are noise and never shown (home or /whales).
export const HOME_TRANSFER_MIN_USD = 20_000_000;
export function isMeaningfulWhaleTransfer(row) {
  if (!row) return false;
  const fromEx = Boolean(row.fromExchange), toEx = Boolean(row.toExchange);
  if (!fromEx && !toEx) return false;
  if (fromEx && toEx && row.fromOwner && row.fromOwner === row.toOwner) return false;
  return true;
}

export function isWhalesSnapshot(value) {
  if (!value || typeof value !== "object") return false;
  return normalizeHomeRows(value).length > 0;
}

// Home order is strict: accumulation/distribution signals, then big positions and liquidations, then at most two
// exchange in/outflows of $20M+. Free slots go to more signals/positions only; with less real data the board is shorter.
const HOME_QUOTA = Object.freeze([["signal", 5], ["position", 3], ["transfer", 2]]);
export function whaleRowsForHome(snapshot, limit = WHALES_HOME_ROWS_DESKTOP) {
  if (!isWhalesSnapshot(snapshot)) return [];
  const rows = normalizeHomeRows(snapshot);
  const group = (row) => (isSignal(row) ? "signal" : isPosition(row) ? "position" : "transfer");
  const picked = [];
  for (const [name, quota] of HOME_QUOTA) picked.push(...rows.filter((row) => group(row) === name).slice(0, quota));
  const lead = (row) => (stealthOf(row) ? 0 : 1);
  for (const row of rows) {
    if (picked.length >= limit) break;
    if (group(row) !== "transfer" && !picked.includes(row)) picked.push(row);
  }
  const order = { signal: 0, position: 1, transfer: 2 };
  return picked.slice(0, limit).sort((a, b) => lead(a) - lead(b) || order[group(a)] - order[group(b)] || rows.indexOf(a) - rows.indexOf(b));
}

// The home page embeds only what its board renders (≤8 rows), not the whole collector feed.
const HOME_DROP_KEYS = ["rows", "limitations", "labelSources", "sourceDocs", "collector", "errors"];
export function homeWhalesSnapshot(snapshot) {
  if (!isWhalesSnapshot(snapshot)) return null;
  const picked = new Set(whaleRowsForHome(snapshot, WHALES_HOME_ROWS_DESKTOP).map((row) => row.id));
  const keep = (list, prefix) => (Array.isArray(list) ? list.filter((row, index) => picked.has(stableId(row, prefix, index))).map(({ text, ...rest }) => rest) : list);
  const out = { ...snapshot };
  const rowsOnly = !Array.isArray(snapshot.signals) && !Array.isArray(snapshot.positions) && !Array.isArray(snapshot.transfers);
  for (const key of HOME_DROP_KEYS) if (!(rowsOnly && key === "rows")) delete out[key];
  if ("signals" in out) out.signals = keep(snapshot.signals, "signal");
  if ("positions" in out) out.positions = keep(snapshot.positions, "position");
  if ("transfers" in out) out.transfers = keep(snapshot.transfers, "transfer");
  return isWhalesSnapshot(out) ? out : snapshot;
}

// 秘密建仓 / 秘密出货 highlight for repeated buying/selling of a non-major coin (collector field `stealth`).
export const stealthOf = (row) => (row && (row.stealth === "buy" || row.stealth === "sell") ? row.stealth : null);
export function whaleStealthLabel(row, locale = "en") {
  const kind = stealthOf(row);
  const st = sentencePack(locale).stealth;
  if (!kind || !st) return null;
  const days = number(row.days) || 0;
  const fills = number(row.fills);
  const meta = fills ? (days >= 2 ? st.metaDays(days, fills) : st.meta24(fills)) : "";
  return { kind, badge: kind === "buy" ? st.buyBadge : st.sellBadge, meta };
}

export function whaleSentenceParts(row, locale = "en") {
  const pack = sentencePack(locale);
  const value = row || {};
  const parts = isSignal(value) ? signalParts(value, pack) : isPosition(value) ? positionParts(value, pack) : transferParts(value, pack);
  return parts.map((part) => String(part || "").replace(/\s+/g, " "));
}

// Adds `text` = [before, amount, after] in one locale and `group` (signal | position | transfer) to each home row.
export function withWhaleText(snapshot, locale = "en") {
  const out = { ...snapshot, locale };
  const add = (list, group, view = (row) => row) => (Array.isArray(list) ? list.map((row) => ({ ...row, group, text: whaleSentenceParts(view(row), locale) })) : list);
  out.signals = Array.isArray(snapshot.signals) ? add(snapshot.signals, "signal").map((row) => { const st = whaleStealthLabel(row, locale); return st ? { ...row, highlight: st } : row; }) : snapshot.signals;
  out.positions = add(snapshot.positions, "position");
  out.transfers = add(snapshot.transfers, "transfer", (row) => ({ ...row, homeKind: "transfer", fromLabel: row.fromLabel || row.from?.label, toLabel: row.toLabel || row.to?.label }));
  return out;
}

export function whaleSentence(row, locale = "en") {
  return whaleSentenceParts(row, locale).join("").trim();
}

export function whaleExplorerHref(row) {
  if (!row || typeof row !== "object") return "";
  return explorerUrl(row.explorerUrl || row.url);
}

// Deterministic for SSR + hydration: compare with the snapshot time, never with the reader's clock.
const sameSgtDay = (a, b) => {
  const x = Date.parse(a || ""), y = Date.parse(b || "");
  if (!Number.isFinite(x) || !Number.isFinite(y)) return true;
  const day = (t) => Math.floor((t + 8 * 3_600_000) / 86_400_000);
  return day(x) === day(y);
};

function rowHtml(row, snapshot, locale) {
  const at = eventTime(row, snapshot);
  const href = explorerUrl(row.explorerUrl || row.url) || localizedHref("/whales", { locale });
  const [before, amount, after] = whaleSentenceParts(row, locale);
  const stealth = whaleStealthLabel(row, locale);
  const tag = stealth ? `<span class="h7-wh-tag" data-stealth="${stealth.kind}">${esc(stealth.badge)}${stealth.meta ? `<small>${esc(stealth.meta)}</small>` : ""}</span>` : "";
  return `<li data-kind="${esc(rowKind(row))}"${stealth ? ` data-stealth="${stealth.kind}"` : ""}><a href="${esc(href)}" ${href.startsWith("http") ? 'target="_blank" rel="nofollow noopener noreferrer"' : ""} data-mv-key="${esc(row.id)}">`
    + `<span class="h7-mv-mk" aria-hidden="true">${esc(iconFor(row))}</span>`
    + tag
    + `<span class="h7-wh-text">${esc(before.trimStart())}<b class="h7-wh-amt" data-tone="${esc(toneFor(row))}" dir="ltr">${esc(amount)}</b>${esc(after.trimEnd())}</span>`
    + (at ? `<time datetime="${esc(at)}" title="${esc(formatSgt(at, locale))}">${esc(formatSgt(at, locale, sameSgtDay(at, snapshot?.updatedAt) ? "clock" : "end"))}</time>` : "")
    + `</a></li>`;
}

export function whalesBodyHtml(snapshot, locale = "en") {
  const rows = whaleRowsForHome(snapshot, WHALES_HOME_ROWS_DESKTOP);
  if (!rows.length) return '<ol class="h7-wh-list"></ol><!--whales-end-->';
  return `<ol class="h7-wh-list">${rows.map((row) => rowHtml(row, snapshot, locale)).join("")}</ol><!--whales-end-->`;
}

const BODY_RE = /(<div class="h7-mv-body" data-mv="body">)[\s\S]*?<!--whales-end-->/;
export function spliceWhalesHtml(html, snapshot, locale = "en") {
  if (typeof html !== "string" || !isWhalesSnapshot(snapshot) || !BODY_RE.test(html)) return html;
  return html.replace(BODY_RE, (_match, open) => `${open}${whalesBodyHtml(snapshot, locale)}`);
}

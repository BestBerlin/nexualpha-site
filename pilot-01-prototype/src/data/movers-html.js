// Markup of the home "Today's movers" board body (headline line + gainers / losers lists), as one escaped HTML string.
// The same function renders the server frame (home7-movers.jsx through dangerouslySetInnerHTML), the Worker splice
// into the prerendered home (spliceMoversHtml) and every client refresh, so all three are byte-identical for the same
// snapshot and hydration never sees a different body. Strings only: no React, safe to import from the Worker.
import { localizedHref } from "./locale-routing.js";
import { formatSgt } from "./local-time.js";
import { FUNDING_RATES_PATH, LIQUIDATIONS_PATH } from "./market-data-pages-nav.js";
import { MOVERS_ROWS, isMoversSnapshot } from "./movers.js";

// liq(total, largest|null, side label), funding(base, "Binance … · OKX …"), updated("16:08 SGT")
const COPY = {
  en: { title: "Today's movers", up: "Top gainers", down: "Top losers", all: "All coins", long: "long", short: "short",
    liq: (t, l, s) => `Futures liquidations, last 24h: ${t}${l ? ` · largest single order: ${l.venue} ${l.base} ${s} ${l.usd}` : ""}`,
    funding: (b, p) => `${b} funding rate now: ${p}`, updated: (c) => `Updated ${c}` },
  "zh-Hans": { title: "今日异动", up: "涨幅榜", down: "跌幅榜", all: "查看全部币种", long: "多单", short: "空单",
    liq: (t, l, s) => `过去 24 小时合约爆仓 ${t}${l ? `，最大单笔 ${l.venue} ${l.base} ${s} ${l.usd}` : ""}`,
    funding: (b, p) => `${b} 当前资金费率 ${p}`, updated: (c) => `更新于 ${c}` },
  "zh-Hant": { title: "今日異動", up: "漲幅榜", down: "跌幅榜", all: "查看全部幣種", long: "多單", short: "空單",
    liq: (t, l, s) => `過去 24 小時合約爆倉 ${t}${l ? `，最大單筆 ${l.venue} ${l.base} ${s} ${l.usd}` : ""}`,
    funding: (b, p) => `${b} 當前資金費率 ${p}`, updated: (c) => `更新於 ${c}` },
  es: { title: "Los movimientos de hoy", up: "Más suben", down: "Más bajan", all: "Ver todas las monedas", long: "largo", short: "corto",
    liq: (t, l, s) => `Liquidaciones de futuros en 24 h: ${t}${l ? ` · mayor orden: ${l.venue} ${l.base} ${s} ${l.usd}` : ""}`,
    funding: (b, p) => `Funding de ${b} ahora: ${p}`, updated: (c) => `Actualizado ${c}` },
  "pt-BR": { title: "Destaques de hoje", up: "Maiores altas", down: "Maiores quedas", all: "Ver todas as moedas", long: "long", short: "short",
    liq: (t, l, s) => `Liquidações de futuros em 24 h: ${t}${l ? ` · maior ordem: ${l.venue} ${l.base} ${s} ${l.usd}` : ""}`,
    funding: (b, p) => `Funding do ${b} agora: ${p}`, updated: (c) => `Atualizado ${c}` },
  fr: { title: "Les mouvements du jour", up: "Plus fortes hausses", down: "Plus fortes baisses", all: "Voir toutes les cryptos", long: "long", short: "short",
    liq: (t, l, s) => `Liquidations de futures sur 24 h : ${t}${l ? ` · plus gros ordre : ${l.venue} ${l.base} ${s} ${l.usd}` : ""}`,
    funding: (b, p) => `Funding ${b} actuel : ${p}`, updated: (c) => `Mis à jour ${c}` },
  de: { title: "Größte Bewegungen heute", up: "Top-Gewinner", down: "Top-Verlierer", all: "Alle Coins ansehen", long: "Long", short: "Short",
    liq: (t, l, s) => `Futures-Liquidationen in 24 Std.: ${t}${l ? ` · größte Einzelorder: ${l.venue} ${l.base} ${s} ${l.usd}` : ""}`,
    funding: (b, p) => `${b}-Funding-Rate aktuell: ${p}`, updated: (c) => `Aktualisiert ${c}` },
  it: { title: "I movimenti di oggi", up: "Maggiori rialzi", down: "Maggiori ribassi", all: "Vedi tutte le monete", long: "long", short: "short",
    liq: (t, l, s) => `Liquidazioni futures nelle ultime 24 h: ${t}${l ? ` · ordine più grande: ${l.venue} ${l.base} ${s} ${l.usd}` : ""}`,
    funding: (b, p) => `Funding ${b} attuale: ${p}`, updated: (c) => `Aggiornato ${c}` },
  ja: { title: "今日の値動き", up: "値上がり上位", down: "値下がり上位", all: "すべての銘柄を見る", long: "ロング", short: "ショート",
    liq: (t, l, s) => `過去24時間の先物清算 ${t}${l ? `、最大の単発清算は ${l.venue} ${l.base} ${s} ${l.usd}` : ""}`,
    funding: (b, p) => `${b} の現在の資金調達率 ${p}`, updated: (c) => `${c} 更新` },
  ko: { title: "오늘의 급등락", up: "상승 상위", down: "하락 상위", all: "전체 코인 보기", long: "롱", short: "숏",
    liq: (t, l, s) => `최근 24시간 선물 청산 ${t}${l ? `, 최대 단일 청산 ${l.venue} ${l.base} ${s} ${l.usd}` : ""}`,
    funding: (b, p) => `${b} 현재 펀딩비 ${p}`, updated: (c) => `${c} 업데이트` },
  ru: { title: "Движения дня", up: "Лидеры роста", down: "Лидеры падения", all: "Все монеты", long: "лонг", short: "шорт",
    liq: (t, l, s) => `Ликвидации фьючерсов за 24 ч: ${t}${l ? ` · крупнейшая: ${l.venue} ${l.base} ${s} ${l.usd}` : ""}`,
    funding: (b, p) => `Фандинг ${b} сейчас: ${p}`, updated: (c) => `Обновлено ${c}` },
  tr: { title: "Bugünün hareketlileri", up: "En çok yükselenler", down: "En çok düşenler", all: "Tüm coinleri gör", long: "long", short: "short",
    liq: (t, l, s) => `Son 24 saatte vadeli tasfiyeler: ${t}${l ? ` · en büyük tek emir: ${l.venue} ${l.base} ${s} ${l.usd}` : ""}`,
    funding: (b, p) => `${b} fonlama oranı şu an: ${p}`, updated: (c) => `Güncellendi ${c}` },
  id: { title: "Penggerak hari ini", up: "Kenaikan teratas", down: "Penurunan teratas", all: "Lihat semua koin", long: "long", short: "short",
    liq: (t, l, s) => `Likuidasi futures 24 jam terakhir: ${t}${l ? ` · order tunggal terbesar: ${l.venue} ${l.base} ${s} ${l.usd}` : ""}`,
    funding: (b, p) => `Funding rate ${b} saat ini: ${p}`, updated: (c) => `Diperbarui ${c}` },
  vi: { title: "Biến động hôm nay", up: "Tăng mạnh nhất", down: "Giảm mạnh nhất", all: "Xem tất cả coin", long: "long", short: "short",
    liq: (t, l, s) => `Thanh lý hợp đồng tương lai 24 giờ qua: ${t}${l ? ` · lệnh lớn nhất: ${l.venue} ${l.base} ${s} ${l.usd}` : ""}`,
    funding: (b, p) => `Funding ${b} hiện tại: ${p}`, updated: (c) => `Cập nhật ${c}` },
  ar: { title: "تحركات اليوم", up: "الأكثر ارتفاعًا", down: "الأكثر انخفاضًا", all: "عرض كل العملات", long: "شراء", short: "بيع",
    liq: (t, l, s) => `تصفيات العقود الآجلة خلال 24 ساعة: ${t}${l ? ` · أكبر أمر منفرد: ${l.venue} ${l.base} ${s} ${l.usd}` : ""}`,
    funding: (b, p) => `معدل تمويل ${b} الآن: ${p}`, updated: (c) => `آخر تحديث ${c}` },
  // l10n: needs native review
  ur: { title: "آج کی بڑی حرکت", up: "سب سے زیادہ اضافہ", down: "سب سے زیادہ کمی", all: "تمام کوائنز دیکھیں", long: "لانگ", short: "شارٹ",
    liq: (t, l, s) => `پچھلے 24 گھنٹوں میں فیوچرز لیکویڈیشن: ${t}${l ? ` · سب سے بڑا آرڈر: ${l.venue} ${l.base} ${s} ${l.usd}` : ""}`,
    funding: (b, p) => `${b} فنڈنگ ریٹ ابھی: ${p}`, updated: (c) => `اپ ڈیٹ ${c}` },
  // l10n: needs native review
  uk: { title: "Рухи дня", up: "Лідери зростання", down: "Лідери падіння", all: "Усі монети", long: "лонг", short: "шорт",
    liq: (t, l, s) => `Ліквідації ф'ючерсів за 24 год: ${t}${l ? ` · найбільша: ${l.venue} ${l.base} ${s} ${l.usd}` : ""}`,
    funding: (b, p) => `Фандинг ${b} зараз: ${p}`, updated: (c) => `Оновлено ${c}` },
};
export const MOVERS_COPY_LOCALES = Object.freeze(Object.keys(COPY));
export const moversCopy = (locale) => COPY[locale] || (String(locale || "").startsWith("zh") ? COPY["zh-Hans"] : COPY.en);

const esc = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
// Letter mark tinted from the symbol (same idea as the coin pages: no third-party logo hotlinking).
export function markHue(sym) {
  let hash = 0;
  for (const ch of String(sym)) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return hash;
}

function rowHtml(row, locale) {
  const sym = esc(row.sym);
  return `<li><a href="${esc(localizedHref(`/coins/${row.slug}`, { locale }))}"><span class="h7-mv-mk" style="--h:${markHue(row.sym)}" aria-hidden="true">${esc(String(row.sym).slice(0, 1))}</span>`
    + `<b translate="no">${sym}</b><span class="h7-mv-p" dir="ltr">${esc(row.price)}</span><span class="h7-mv-c" data-dir="${esc(row.dir || "flat")}" dir="ltr">${esc(row.change)}</span></a></li>`;
}
const SKELETON = '<li class="h7-mv-sk" aria-hidden="true"><span></span><span></span><span></span></li>';
const PAD = '<li class="h7-mv-pad" aria-hidden="true"></li>';
function listHtml(rows, locale, loading) {
  const out = (rows || []).slice(0, MOVERS_ROWS).map((row) => rowHtml(row, locale));
  while (out.length < MOVERS_ROWS) out.push(loading ? SKELETON : PAD);
  return `<ol>${out.join("")}</ol>`;
}

// "$156.0M" inside Arabic/Urdu text: an LTR isolate keeps the dollar sign in front of the number.
const ltr = (value) => `\u2066${value}\u2069`;
function headlineHtml(snapshot, locale, c) {
  if (!snapshot) return '<p class="h7-mv-hl"><span class="h7-mv-hl-sk" aria-hidden="true"></span></p>';
  const h = snapshot.headline;
  let lead = "";
  if (h?.kind === "liquidations" && typeof h.total === "string") {
    const largest = h.largest ? { ...h.largest, usd: ltr(h.largest.usd) } : null;
    lead = `<a href="${esc(localizedHref(LIQUIDATIONS_PATH, { locale }))}">${esc(c.liq(ltr(h.total), largest, h.largest ? (h.largest.side === "short" ? c.short : c.long) : ""))}<span class="h7-mv-arrow" aria-hidden="true">→</span></a>`;
  } else if (h?.kind === "funding" && (h.binance || h.okx)) {
    const parts = [h.binance ? `Binance ${ltr(h.binance)}` : null, h.okx ? `OKX ${ltr(h.okx)}` : null].filter(Boolean).join(" · ");
    lead = `<a href="${esc(localizedHref(FUNDING_RATES_PATH, { locale }))}">${esc(c.funding(h.base || "BTC", parts))}<span class="h7-mv-arrow" aria-hidden="true">→</span></a>`;
  }
  const clock = formatSgt(snapshot.generatedAt, locale, "clock");
  return `<p class="h7-mv-hl">${lead}${clock ? `<time datetime="${esc(snapshot.generatedAt)}">${esc(c.updated(clock))}</time>` : ""}</p>`;
}

/** Inner HTML of `.h7-mv-body`: headline line, both lists and the end marker the Worker splice looks for. */
export function moversBodyHtml(snapshot, locale = "en") {
  const c = moversCopy(locale);
  const data = isMoversSnapshot(snapshot) ? snapshot : null;
  return headlineHtml(data, locale, c)
    + `<div class="h7-mv-cols"><div class="h7-mv-col h7-mv-up"><h3>${esc(c.up)}</h3>${listHtml(data?.up, locale, !data)}</div>`
    + `<div class="h7-mv-col h7-mv-dn"><h3>${esc(c.down)}</h3>${listHtml(data?.down, locale, !data)}</div></div><!--mv-end-->`;
}

const BODY_RE = /(<div class="h7-mv-body" data-mv="body">)[\s\S]*?<!--mv-end-->/;
/**
 * Writes a snapshot into prerendered home HTML that was rendered without one. The result is byte-identical to
 * rendering the board with that snapshot (tests/home-movers.test.mjs). Function replacer only: the values are data.
 */
export function spliceMoversHtml(html, snapshot, locale = "en") {
  if (typeof html !== "string" || !isMoversSnapshot(snapshot) || !BODY_RE.test(html)) return html;
  return html.replace(BODY_RE, (_match, open) => `${open}${moversBodyHtml(snapshot, locale)}`);
}

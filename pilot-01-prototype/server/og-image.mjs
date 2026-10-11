// Social "data cards": GET /og/<kind>/<id>.png renders a 1200x630 PNG per page so Google Discover, Telegram link
// previews and X cards show the page's own facts instead of a generic logo (2026-10-10).
//   news/<slug>            title, category, date            (feed: dist/client/content/news-feed.json)
//   venue/<slug>           name, logo, fees, rebate share   (src/data/exchange-facts.js + home-rebate-tiers.js)
//   compare/<a>-vs-<b>     both names, spot/perp headline fees
//   liquidations/24h       24h total, long/short, largest   (feed: /intel/market-events.json)
//   default/site           wordmark card
// Every figure comes from the same data the page reads; nothing is estimated and invite codes never reach an image.
// Rendering: SVG -> PNG through @resvg/resvg-js (native, no browser). Fonts: the repo's woff2 files are tiny
// per-page subsets (public/fonts/manifest.json) and resvg reads TTF/OTF only, so cards use TTF/OTF files from
// OG_FONT_DIR plus the host's system fonts by family name; see FONT_FAMILY below. Rendered PNGs are cached in memory
// (LRU 500) and, when OG_CACHE_DIR is set, on disk keyed by build id and data fingerprint.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, statSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { localizedNewsTitle } from "../src/data/news-feed-client.js";
import { newsCategoryCopy } from "../src/data/news-library.js";
import { FACTS_AS_OF, factsForVenue, feeDisplay, venueCheckedOn } from "../src/data/exchange-facts.js";
import { partnerRebateShare } from "../src/data/partner-benefit-status.js";
import { brandSlogan, brandSloganSecondary } from "../src/data/brand-slogan.js";
import { trPercentDative } from "../src/data/tr-percent.js";
export { socialImagePathForRoute } from "../src/data/social-image.js";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
export const OG_PATH_PREFIX = "/og/";
export const OG_KINDS = Object.freeze(["news", "venue", "compare", "liquidations", "default"]);
export const OG_LOCALES = Object.freeze(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar"]);
const RTL_LOCALES = new Set(["ar"]);
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,159}$/;
const MEMORY_LIMIT = 500;
const CACHE_CONTROL = "public, max-age=86400";
// Liquidation totals change every collector cycle (5 min); a day-long cache would show yesterday's number.
const LIVE_CACHE_CONTROL = "public, max-age=600";
const UNAVAILABLE_CACHE_CONTROL = "public, max-age=300";

// Brand tokens (src/styles/tokens.css): --market, --surface-2, --ink, --muted, --blue, --blue-text, --positive, --danger.
const COLOR = Object.freeze({ bg: "#070a0e", surface: "#121a24", ink: "#f5f7fa", muted: "#9aa5b5", blue: "#315ccf", blueText: "#6f90ff", positive: "#22c88a", danger: "#e65b5b", line: "rgba(180,196,211,0.16)" });
// Family names in preference order. Inter/Noto are what the site declares; PingFang/Hiragino/Geeza/Arial Unicode
// cover CJK + Arabic on macOS, Noto CJK/Arabic and DejaVu on Linux hosts that have fonts-noto installed.
const FONT_FAMILY = "Inter, 'Noto Sans', 'Noto Sans SC', 'Noto Sans TC', 'Noto Sans JP', 'Noto Sans KR', 'Noto Sans CJK SC', 'Noto Sans Arabic', 'WenQuanYi Micro Hei', 'WenQuanYi Zen Hei', 'PingFang SC', 'Hiragino Sans GB', 'Geeza Pro', 'Arial Unicode MS', 'DejaVu Sans', Arial, sans-serif";

// Labels printed on cards. All 15 UI locales (brief: every user-visible string ships in every locale).
const LABELS = {
  en: { feesChecked: "Fees checked {date}", rebate: "Rebate share up to {pct}", rebatePending: "Rebate share pending", spot: "Spot maker / taker", perp: "Perp maker / taker", notChecked: "Not yet checked", vs: "vs", compare: "Fee comparison", liquidations: "Futures liquidations · 24h", longs: "Longs", shorts: "Shorts", largest: "Largest single", lowerBound: "Binance + OKX, lower bound · {time} UTC", feedUpdating: "Liquidation feed is updating", tagline: "Independent crypto platform research", research: "Source-checked research" },
  "zh-Hans": { feesChecked: "费率核验于 {date}", rebate: "返佣比例最高 {pct}", rebatePending: "返佣比例待确认", spot: "现货 挂单 / 吃单", perp: "合约 挂单 / 吃单", notChecked: "尚未核验", vs: "对比", compare: "费率对比", liquidations: "合约爆仓 · 24 小时", longs: "多单", shorts: "空单", largest: "最大单笔", lowerBound: "Binance + OKX，下限值 · {time} UTC", feedUpdating: "爆仓数据正在更新", tagline: "独立加密交易平台研究", research: "源头核验研究" },
  "zh-Hant": { feesChecked: "費率核驗於 {date}", rebate: "返佣比例最高 {pct}", rebatePending: "返佣比例待確認", spot: "現貨 掛單 / 吃單", perp: "合約 掛單 / 吃單", notChecked: "尚未核驗", vs: "對比", compare: "費率比較", liquidations: "合約爆倉 · 24 小時", longs: "多單", shorts: "空單", largest: "最大單筆", lowerBound: "Binance + OKX，下限值 · {time} UTC", feedUpdating: "爆倉資料正在更新", tagline: "獨立加密交易平台研究", research: "來源核驗研究" },
  es: { feesChecked: "Comisiones verificadas {date}", rebate: "Reembolso hasta {pct}", rebatePending: "Reembolso pendiente", spot: "Spot maker / taker", perp: "Perp maker / taker", notChecked: "Sin verificar", vs: "vs", compare: "Comparación de comisiones", liquidations: "Liquidaciones de futuros · 24h", longs: "Largos", shorts: "Cortos", largest: "Mayor orden", lowerBound: "Binance + OKX, límite inferior · {time} UTC", feedUpdating: "El feed de liquidaciones se está actualizando", tagline: "Investigación independiente de plataformas cripto", research: "Investigación verificada por fuentes" },
  "pt-BR": { feesChecked: "Taxas verificadas {date}", rebate: "Reembolso de até {pct}", rebatePending: "Reembolso pendente", spot: "Spot maker / taker", perp: "Perp maker / taker", notChecked: "Ainda não verificado", vs: "vs", compare: "Comparação de taxas", liquidations: "Liquidações de futuros · 24h", longs: "Longs", shorts: "Shorts", largest: "Maior ordem", lowerBound: "Binance + OKX, limite inferior · {time} UTC", feedUpdating: "O feed de liquidações está sendo atualizado", tagline: "Pesquisa independente de plataformas cripto", research: "Pesquisa verificada por fontes" },
  fr: { feesChecked: "Frais vérifiés le {date}", rebate: "Remise jusqu'à {pct}", rebatePending: "Remise en attente", spot: "Spot maker / taker", perp: "Perp maker / taker", notChecked: "Pas encore vérifié", vs: "vs", compare: "Comparaison des frais", liquidations: "Liquidations futures · 24h", longs: "Longs", shorts: "Shorts", largest: "Plus grand ordre", lowerBound: "Binance + OKX, borne basse · {time} UTC", feedUpdating: "Le flux des liquidations se met à jour", tagline: "Recherche indépendante sur les plateformes crypto", research: "Recherche vérifiée par sources" },
  de: { feesChecked: "Gebühren geprüft am {date}", rebate: "Rückvergütung bis {pct}", rebatePending: "Rückvergütung offen", spot: "Spot Maker / Taker", perp: "Perp Maker / Taker", notChecked: "Noch nicht geprüft", vs: "vs", compare: "Gebührenvergleich", liquidations: "Futures-Liquidationen · 24h", longs: "Longs", shorts: "Shorts", largest: "Größte Order", lowerBound: "Binance + OKX, Untergrenze · {time} UTC", feedUpdating: "Liquidationsfeed wird aktualisiert", tagline: "Unabhängige Krypto-Plattform-Recherche", research: "Quellengeprüfte Recherche" },
  it: { feesChecked: "Commissioni verificate il {date}", rebate: "Rimborso fino al {pct}", rebatePending: "Rimborso in attesa", spot: "Spot maker / taker", perp: "Perp maker / taker", notChecked: "Non ancora verificato", vs: "vs", compare: "Confronto commissioni", liquidations: "Liquidazioni futures · 24h", longs: "Long", shorts: "Short", largest: "Ordine più grande", lowerBound: "Binance + OKX, limite inferiore · {time} UTC", feedUpdating: "Il feed delle liquidazioni si sta aggiornando", tagline: "Ricerca indipendente sulle piattaforme crypto", research: "Ricerca verificata dalle fonti" },
  ja: { feesChecked: "手数料確認日 {date}", rebate: "リベート最大 {pct}", rebatePending: "リベート率は確認中", spot: "現物 メイカー / テイカー", perp: "無期限 メイカー / テイカー", notChecked: "未確認", vs: "vs", compare: "手数料比較", liquidations: "先物ロスカット · 24時間", longs: "ロング", shorts: "ショート", largest: "最大単一注文", lowerBound: "Binance + OKX、下限値 · {time} UTC", feedUpdating: "ロスカットデータを更新中", tagline: "独立系暗号資産プラットフォーム調査", research: "出典確認済みリサーチ" },
  ko: { feesChecked: "수수료 확인일 {date}", rebate: "리베이트 최대 {pct}", rebatePending: "리베이트 비율 확인 중", spot: "현물 메이커 / 테이커", perp: "무기한 메이커 / 테이커", notChecked: "미확인", vs: "vs", compare: "수수료 비교", liquidations: "선물 청산 · 24시간", longs: "롱", shorts: "숏", largest: "최대 단일 주문", lowerBound: "Binance + OKX, 하한값 · {time} UTC", feedUpdating: "청산 데이터 업데이트 중", tagline: "독립 암호화폐 플랫폼 리서치", research: "출처 검증 리서치" },
  ru: { feesChecked: "Комиссии проверены {date}", rebate: "Возврат до {pct}", rebatePending: "Доля возврата уточняется", spot: "Спот мейкер / тейкер", perp: "Перп мейкер / тейкер", notChecked: "Ещё не проверено", vs: "vs", compare: "Сравнение комиссий", liquidations: "Ликвидации фьючерсов · 24ч", longs: "Лонги", shorts: "Шорты", largest: "Крупнейший ордер", lowerBound: "Binance + OKX, нижняя граница · {time} UTC", feedUpdating: "Лента ликвидаций обновляется", tagline: "Независимое исследование криптоплатформ", research: "Исследование с проверкой источников" },
  tr: { feesChecked: "Ücretler {date} tarihinde doğrulandı", rebate: "İade payı {pct} kadar", rebatePending: "İade payı bekleniyor", spot: "Spot maker / taker", perp: "Perp maker / taker", notChecked: "Henüz doğrulanmadı", vs: "vs", compare: "Ücret karşılaştırması", liquidations: "Vadeli tasfiyeler · 24s", longs: "Longlar", shorts: "Shortlar", largest: "En büyük emir", lowerBound: "Binance + OKX, alt sınır · {time} UTC", feedUpdating: "Tasfiye akışı güncelleniyor", tagline: "Bağımsız kripto platformu araştırması", research: "Kaynak doğrulamalı araştırma" },
  id: { feesChecked: "Biaya diverifikasi {date}", rebate: "Rebate hingga {pct}", rebatePending: "Rebate belum dikonfirmasi", spot: "Spot maker / taker", perp: "Perp maker / taker", notChecked: "Belum diverifikasi", vs: "vs", compare: "Perbandingan biaya", liquidations: "Likuidasi futures · 24 jam", longs: "Long", shorts: "Short", largest: "Order terbesar", lowerBound: "Binance + OKX, batas bawah · {time} UTC", feedUpdating: "Feed likuidasi sedang diperbarui", tagline: "Riset platform kripto independen", research: "Riset terverifikasi sumber" },
  vi: { feesChecked: "Phí được kiểm tra {date}", rebate: "Hoàn phí tới {pct}", rebatePending: "Tỷ lệ hoàn phí chờ xác nhận", spot: "Spot maker / taker", perp: "Perp maker / taker", notChecked: "Chưa kiểm tra", vs: "vs", compare: "So sánh phí", liquidations: "Thanh lý hợp đồng tương lai · 24h", longs: "Long", shorts: "Short", largest: "Lệnh lớn nhất", lowerBound: "Binance + OKX, giới hạn dưới · {time} UTC", feedUpdating: "Dữ liệu thanh lý đang được cập nhật", tagline: "Nghiên cứu nền tảng tiền mã hóa độc lập", research: "Nghiên cứu đã xác minh nguồn" },
  ar: { feesChecked: "تم التحقق من الرسوم {date}", rebate: "حصة الاسترداد حتى {pct}", rebatePending: "حصة الاسترداد قيد التأكيد", spot: "سبوت صانع / متداول", perp: "عقود دائمة صانع / متداول", notChecked: "لم يتم التحقق بعد", vs: "مقابل", compare: "مقارنة الرسوم", liquidations: "تصفيات العقود الآجلة · 24 ساعة", longs: "الشراء", shorts: "البيع", largest: "أكبر أمر منفرد", lowerBound: "Binance + OKX، حد أدنى · {time} UTC", feedUpdating: "يتم تحديث بيانات التصفية", tagline: "بحث مستقل في منصات العملات الرقمية", research: "بحث موثق بالمصادر" },
};

export function normalizeOgLocale(value) {
  if (!value) return "en";
  const lowered = String(value).toLowerCase();
  return OG_LOCALES.find((locale) => locale.toLowerCase() === lowered) || "en";
}

const labelsFor = (locale) => LABELS[locale] || LABELS.en;
const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_m, key) => String(values[key] ?? ""));
const escapeXml = (value) => String(value ?? "").replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]));
const isoDay = (value) => (value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString().slice(0, 10) : null);
const sha1 = (value) => createHash("sha1").update(value).digest("hex");

// Width heuristic in em for wrapping (no shaping engine before render). Overestimates slightly so lines never overflow.
function charWidth(ch) {
  const code = ch.codePointAt(0);
  if (code === 0x20) return 0.3;
  if (/[.,:;'’"!|·]/.test(ch)) return 0.3;
  if (/[()\-–\[\]/]/.test(ch)) return 0.4;
  if (code >= 0x0600 && code <= 0x06ff) return 0.56; // Arabic
  if (code >= 0x0400 && code <= 0x04ff) return /[а-яё]/.test(ch) ? 0.58 : 0.72; // Cyrillic
  if (code >= 0x1100 && code <= 0x11ff) return 1; // Hangul Jamo
  if ((code >= 0x2e80 && code <= 0x9fff) || (code >= 0xac00 && code <= 0xd7ff) || (code >= 0xf900 && code <= 0xfaff) || (code >= 0xff00 && code <= 0xffef) || code >= 0x20000) return 1.02; // CJK + fullwidth
  if (/[0-9]/.test(ch)) return 0.6;
  if (/[A-Z]/.test(ch)) return 0.7;
  if (/[a-z]/.test(ch)) return 0.55;
  if (/[mwMW]/.test(ch)) return 0.85;
  return 0.62;
}
export function measureText(text, fontSize) {
  let width = 0;
  for (const ch of String(text || "")) width += charWidth(ch) * fontSize;
  return width;
}

// Words for spaced scripts, single characters for CJK. Returns at most maxLines lines; a cut-off text ends in an ellipsis.
export function wrapText(text, { fontSize, maxWidth, maxLines = 3 }) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const cjk = /[\u2e80-\u9fff\uac00-\ud7ff\uf900-\ufaff\uff00-\uffef]/.test(clean) && !/\s/.test(clean.slice(0, 40));
  const units = cjk ? [...clean] : clean.split(" ");
  const joiner = cjk ? "" : " ";
  const lines = [];
  let current = "";
  let index = 0;
  while (index < units.length && lines.length < maxLines) {
    const unit = units[index];
    const candidate = current ? current + joiner + unit : unit;
    if (measureText(candidate, fontSize) <= maxWidth) { current = candidate; index += 1; continue; }
    if (!current) {
      // A single unit wider than the line: hard-break it and keep the rest for the next line.
      let cut = unit.length;
      while (cut > 1 && measureText(unit.slice(0, cut), fontSize) > maxWidth) cut -= 1;
      lines.push(unit.slice(0, cut));
      units[index] = unit.slice(cut);
      if (!units[index]) index += 1;
      continue;
    }
    lines.push(current);
    current = "";
  }
  if (current && lines.length < maxLines) { lines.push(current); current = ""; }
  if (index < units.length || current) {
    let last = lines[lines.length - 1].replace(/[\s.,;:·—-]+$/u, "");
    while (last.length > 1 && measureText(`${last}…`, fontSize) > maxWidth) last = last.slice(0, -1).replace(/[\s.,;:·—-]+$/u, "");
    lines[lines.length - 1] = `${last}…`;
  }
  return lines;
}

// Digits and symbols keep reading left-to-right inside an RTL line (dates, "$311M"): left-to-right marks around them.
// "40%" everywhere except Turkish ("%40").
// Turkish: percent sign first, and the label reads "{pct} kadar", so the dative suffix travels with the number.
const percentLabel = (pct, locale) => (locale === "tr" ? trPercentDative(pct) : `${pct}%`);
const ltrIsolate = (value, locale) => (RTL_LOCALES.has(locale) ? `\u200E${value}\u200E` : String(value));

export function formatUsdCompact(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return "–";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(n >= 1e10 ? 1 : 2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(n >= 1e8 ? 0 : 1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// ---------- SVG building blocks ----------
// x is measured from the reading-side edge: RTL locales mirror it and flip the anchor, so one layout serves both.
function textAttrs(locale, x, y, size, { weight = 400, color = COLOR.ink, family = FONT_FAMILY, align = "start", extra = "" } = {}) {
  const rtl = RTL_LOCALES.has(locale);
  const anchor = align === "end" ? (rtl ? "start" : "end") : (rtl ? "end" : "start");
  const dir = rtl ? ' direction="rtl" unicode-bidi="embed"' : "";
  const xx = rtl ? OG_WIDTH - x : x;
  return `x="${xx}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" font-family="${escapeXml(family)}" text-anchor="${anchor}"${dir} xml:lang="${escapeXml(locale)}"${extra ? ` ${extra}` : ""}`;
}
const textEl = (locale, x, y, size, text, options) => `<text ${textAttrs(locale, x, y, size, options)}>${escapeXml(text)}</text>`;

function frame(locale, { kicker, kickerColor = COLOR.blueText, brandMark = false }) {
  const l = labelsFor(locale);
  return `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${COLOR.bg}"/><stop offset="1" stop-color="${COLOR.surface}"/></linearGradient>
  <radialGradient id="glow" cx="${RTL_LOCALES.has(locale) ? "0.1" : "0.9"}" cy="0.1" r="0.7"><stop offset="0" stop-color="${COLOR.blue}" stop-opacity="0.35"/><stop offset="1" stop-color="${COLOR.blue}" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bg)"/>
<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#glow)"/>
<rect x="${RTL_LOCALES.has(locale) ? OG_WIDTH - 10 : 0}" y="0" width="10" height="${OG_HEIGHT}" fill="${COLOR.blue}"/>
${wordmark(locale, { brandMark })}
${kicker ? textEl(locale, 72, 180, 24, kicker, { weight: 600, color: kickerColor, extra: RTL_LOCALES.has(locale) ? "" : 'letter-spacing="1.5"' }) : ""}
<line x1="72" y1="${OG_HEIGHT - 88}" x2="${OG_WIDTH - 72}" y2="${OG_HEIGHT - 88}" stroke="${COLOR.line}" stroke-width="2"/>
${textEl(locale, 72, OG_HEIGHT - 44, 24, "nexualpha.com", { weight: 600, color: COLOR.muted })}
${textEl(locale, OG_WIDTH - 72, OG_HEIGHT - 44, 22, l.tagline, { color: COLOR.muted, align: "end" })}`;
}

// The real NexuAlpha mark (public/brand/nexualpha/nexualpha-round.svg, 256x256 viewBox), inlined as vector paths so
// resvg draws it without a file read: the server's release tarball and font mount need nothing extra, and the card
// renders the same on macOS and the Linux host. tests/brand-slogan.test.mjs keeps it identical to the public file.
export const BRAND_MARK_PATHS = Object.freeze([
  '<circle cx="128" cy="128" r="120" fill="#070A0E"/>',
  '<path fill="#315CFF" d="M42 207V53h29l84 109V53h37v154h-31L79 98v109z"/>',
  '<path fill="#0B192D" d="m77 70 25-20 100 128-27 24z"/>',
  '<path fill="#315CFF" d="m57 49 26-22 115 148-26 26z"/>',
  '<path fill="#1FE0C0" d="m89 184 22-22 18 17 53-70h-15l32-32 32 32h-17l-77 96-27-25-18 19z"/>',
]);

function wordmark(locale, { brandMark = false } = {}) {
  const rtl = RTL_LOCALES.has(locale);
  const x = rtl ? OG_WIDTH - 72 - 40 : 72;
  // Default/home card (owner review 2026-10-11): the real brand mark at the same 40x40 slot; other cards keep the
  // generic square until they are reviewed.
  const mark = brandMark
    ? `<svg x="${x}" y="68" width="40" height="40" viewBox="0 0 256 256">${BRAND_MARK_PATHS.join("")}</svg>`
    : `<rect x="${x}" y="68" width="40" height="40" rx="10" fill="${COLOR.blue}"/>
<path d="M${x + 11} ${68 + 29} L${x + 11} ${68 + 11} L${x + 29} ${68 + 29} L${x + 29} ${68 + 11}" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `${mark}
<text x="${rtl ? x - 16 : x + 56}" y="100" font-size="34" font-weight="700" fill="${COLOR.ink}" font-family="${escapeXml(FONT_FAMILY)}" text-anchor="${rtl ? "end" : "start"}" letter-spacing="-0.5">NexuAlpha</text>`;
}

function titleBlock(locale, title, { y = 290, size = 58, maxLines = 3, maxWidth = OG_WIDTH - 144 } = {}) {
  let fontSize = size;
  let lines = wrapText(title, { fontSize, maxWidth, maxLines });
  // Long titles step down one size before truncating.
  if (lines.length === maxLines && lines[maxLines - 1].endsWith("…") && size > 44) {
    fontSize = Math.max(44, size - 10);
    lines = wrapText(title, { fontSize, maxWidth, maxLines });
  }
  const lineHeight = Math.round(fontSize * 1.22);
  return lines.map((line, index) => textEl(locale, 72, y + index * lineHeight, fontSize, line, { weight: 700, extra: 'letter-spacing="-0.8"' })).join("\n");
}

function svgDocument(locale, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" xml:lang="${escapeXml(locale)}">\n${body}\n</svg>`;
}

// ---------- card builders: data in, SVG out ----------
export function newsCardSvg({ title, category, date, locale = "en" }) {
  const kicker = [category, date ? ltrIsolate(date, locale) : null].filter(Boolean).join("  ·  ");
  return svgDocument(locale, `${frame(locale, { kicker })}\n${titleBlock(locale, title)}`);
}

export function venueCardSvg({ name, logoPng, spot, perp, checkedOn, rebateShare, locale = "en" }) {
  const l = labelsFor(locale);
  const rtl = RTL_LOCALES.has(locale);
  const logo = logoPng
    ? `<clipPath id="logo"><rect x="${rtl ? OG_WIDTH - 72 - 112 : 72}" y="214" width="112" height="112" rx="24"/></clipPath><image href="data:image/png;base64,${logoPng.toString("base64")}" x="${rtl ? OG_WIDTH - 72 - 112 : 72}" y="214" width="112" height="112" clip-path="url(#logo)"/>`
    : "";
  const nameX = logoPng ? 72 + 140 : 72;
  const facts = [
    [l.spot, spot ? ltrIsolate(spot, locale) : l.notChecked],
    [l.perp, perp ? ltrIsolate(perp, locale) : l.notChecked],
    [checkedOn ? fill(l.feesChecked, { date: ltrIsolate(checkedOn, locale) }) : l.notChecked, Number.isFinite(rebateShare) ? fill(l.rebate, { pct: ltrIsolate(percentLabel(Math.round(rebateShare * 100), locale), locale) }) : l.rebatePending],
  ];
  const rows = facts.map(([label, value], index) => {
    const y = 400 + index * 52;
    return `${textEl(locale, 72, y, 22, label, { color: COLOR.muted })}${textEl(locale, 520, y, 28, value, { weight: 600, color: index === 2 ? COLOR.positive : COLOR.ink })}`;
  }).join("\n");
  return svgDocument(locale, `${frame(locale, { kicker: l.research })}\n${logo}\n${textEl(locale, nameX, 300, 72, name, { weight: 700, extra: 'letter-spacing="-1"' })}\n${rows}`);
}

export function compareCardSvg({ venues, locale = "en" }) {
  const l = labelsFor(locale);
  const columns = venues.length;
  const inner = OG_WIDTH - 144;
  const gap = 24;
  const colWidth = Math.floor((inner - gap * (columns - 1)) / columns);
  const rtl = RTL_LOCALES.has(locale);
  const cells = venues.map((venue, index) => {
    const left = rtl ? OG_WIDTH - 72 - colWidth - index * (colWidth + gap) : 72 + index * (colWidth + gap);
    const textX = rtl ? OG_WIDTH - (left + colWidth - 28) : left + 28;
    const nameSize = columns > 2 ? 40 : 48;
    return `<rect x="${left}" y="214" width="${colWidth}" height="296" rx="20" fill="rgba(255,255,255,0.04)" stroke="${COLOR.line}" stroke-width="2"/>
${textEl(locale, textX, 282, nameSize, venue.name, { weight: 700, extra: 'letter-spacing="-0.8"' })}
${textEl(locale, textX, 340, 20, l.spot, { color: COLOR.muted })}
${textEl(locale, textX, 378, columns > 2 ? 28 : 34, venue.spot ? ltrIsolate(venue.spot, locale) : l.notChecked, { weight: 600, color: venue.spot ? COLOR.ink : COLOR.muted })}
${textEl(locale, textX, 428, 20, l.perp, { color: COLOR.muted })}
${textEl(locale, textX, 466, columns > 2 ? 28 : 34, venue.perp ? ltrIsolate(venue.perp, locale) : l.notChecked, { weight: 600, color: venue.perp ? COLOR.ink : COLOR.muted })}`;
  }).join("\n");
  const vsMarks = venues.slice(1).map((_v, index) => {
    const cx = rtl ? OG_WIDTH - 72 - (index + 1) * (colWidth + gap) + gap / 2 : 72 + (index + 1) * (colWidth + gap) - gap / 2;
    return `<circle cx="${cx}" cy="362" r="26" fill="${COLOR.blue}"/><text x="${cx}" y="369" font-size="18" font-weight="700" fill="#fff" font-family="${escapeXml(FONT_FAMILY)}" text-anchor="middle">${escapeXml(l.vs)}</text>`;
  }).join("\n");
  const checked = venues.map((v) => v.checkedOn).filter(Boolean).sort().at(-1);
  const kicker = checked ? `${l.compare}  ·  ${fill(l.feesChecked, { date: ltrIsolate(checked, locale) })}` : l.compare;
  return svgDocument(locale, `${frame(locale, { kicker })}\n${cells}\n${vsMarks}`);
}

export function liquidationsCardSvg({ window: w, generatedAt, locale = "en" }) {
  const l = labelsFor(locale);
  if (!w) {
    return svgDocument(locale, `${frame(locale, { kicker: l.liquidations })}\n${titleBlock(locale, l.feedUpdating, { size: 52 })}`);
  }
  const longUsd = Number(w.longUsd) || 0;
  const shortUsd = Number(w.shortUsd) || 0;
  const share = longUsd + shortUsd > 0 ? longUsd / (longUsd + shortUsd) : 0.5;
  const barX = 72;
  const barW = OG_WIDTH - 144;
  const longW = Math.round(barW * share);
  const time = generatedAt && Number.isFinite(Date.parse(generatedAt)) ? new Date(generatedAt).toISOString().slice(11, 16) : "--:--";
  const largest = w.largest && Number.isFinite(Number(w.largest.usd))
    ? `${ltrIsolate(formatUsdCompact(w.largest.usd), locale)} · ${ltrIsolate(String(w.largest.symbol || "").replace(/^OKX:/, "OKX "), locale)} ${w.largest.side === "short" ? l.shorts : l.longs}`
    : "–";
  const money = (v) => ltrIsolate(formatUsdCompact(v), locale);
  const rtl = RTL_LOCALES.has(locale);
  return svgDocument(locale, `${frame(locale, { kicker: l.liquidations, kickerColor: COLOR.danger })}
${textEl(locale, 72, 318, 128, money(w.totalUsd), { weight: 700, extra: 'letter-spacing="-4"' })}
<rect x="${barX}" y="352" width="${barW}" height="16" rx="8" fill="rgba(255,255,255,0.08)"/>
<rect x="${rtl ? barX + barW - longW : barX}" y="352" width="${Math.max(8, longW)}" height="16" rx="8" fill="${COLOR.danger}"/>
<rect x="${rtl ? barX : barX + longW}" y="352" width="${Math.max(8, barW - longW)}" height="16" rx="8" fill="${COLOR.positive}"/>
${textEl(locale, 72, 408, 26, `${l.longs}  ${money(longUsd)}`, { weight: 600, color: COLOR.danger })}
${textEl(locale, OG_WIDTH - 72, 408, 26, `${l.shorts}  ${money(shortUsd)}`, { weight: 600, color: COLOR.positive, align: "end" })}
${textEl(locale, 72, 456, 22, l.largest, { color: COLOR.muted })}
${textEl(locale, 72, 492, 30, largest, { weight: 600 })}
${textEl(locale, 72, OG_HEIGHT - 104, 20, fill(l.lowerBound, { time: ltrIsolate(time, locale) }), { color: COLOR.muted })}`);
}

// Default / home card (owner 2026-10-11): the real brand mark, slogan B as the kicker (share from HOME_REBATE_MAX_PCT)
// and slogan A (src/data/brand-slogan.js) as the headline under the wordmark; the footer line keeps the research
// tagline. News, venue, compare and liquidation cards are unchanged.
export function defaultCardSvg({ locale = "en" }) {
  // resvg's bidi puts a number that follows Arabic text, and a full stop after it, at the wrong end of an RTL line. A
  // right-to-left mark before the number keeps "60%" at the line end (left), as a browser renders it; the kicker
  // drops its final full stop in RTL (a label, not a sentence) so nothing lands at the line start.
  const kicker = RTL_LOCALES.has(locale)
    ? brandSloganSecondary(locale).replace(/[.。]$/u, "").replace(/(?=\d)/u, "\u200F")
    : brandSloganSecondary(locale);
  return svgDocument(locale, `${frame(locale, { kicker, brandMark: true })}\n${titleBlock(locale, brandSlogan(locale), { size: 60 })}`);
}

// ---------- data: same sources the pages use ----------
async function readJsonFile(file) {
  try {
    const text = await readFile(file, "utf8");
    return { data: JSON.parse(text), fingerprint: sha1(text).slice(0, 16) };
  } catch {
    return null;
  }
}

function createNewsSource(clientRoot) {
  const file = path.join(clientRoot, "content", "news-feed.json");
  let cache = null; // { mtimeMs, articles, fingerprint }
  return async () => {
    let mtimeMs = 0;
    try { mtimeMs = statSync(file).mtimeMs; } catch { return { articles: [], fingerprint: "none" }; }
    if (cache && cache.mtimeMs === mtimeMs) return cache;
    const loaded = await readJsonFile(file);
    const articles = Array.isArray(loaded?.data?.articles) ? loaded.data.articles.filter((a) => a?.status === "PUBLISHED") : [];
    cache = { mtimeMs, articles, fingerprint: loaded?.fingerprint || "none" };
    return cache;
  };
}

export function venueCardData(slug, clientRoot, locale = "en") {
  const facts = factsForVenue(slug);
  if (!facts) return null;
  const logoFile = clientRoot ? path.join(clientRoot, "brands", `${slug}.png`) : null;
  return {
    name: facts.name,
    logoFile: logoFile && existsSync(logoFile) ? logoFile : null,
    // Same formatter as the pages (format-fee.js): exact reviewed precision, locale decimal/percent style.
    spot: feeDisplay(slug, "spot", locale),
    perp: feeDisplay(slug, "perp", locale),
    checkedOn: venueCheckedOn(slug),
    rebateShare: partnerRebateShare(slug),
  };
}

export function compareCardData(pair, locale = "en") {
  const slugs = String(pair || "").split("-vs-");
  if (slugs.length < 2 || slugs.length > 3 || new Set(slugs).size !== slugs.length) return null;
  const venues = slugs.map((slug) => {
    const facts = factsForVenue(slug);
    return facts ? { slug, name: facts.name, spot: feeDisplay(slug, "spot", locale), perp: feeDisplay(slug, "perp", locale), checkedOn: venueCheckedOn(slug) } : null;
  });
  return venues.every(Boolean) ? { venues } : null;
}

const LIQUIDATION_WINDOWS = Object.freeze({ "24h": "h24", "4h": "h4", "1h": "h1" });

// ---------- cache ----------
function createMemoryCache(limit = MEMORY_LIMIT) {
  const map = new Map();
  return {
    get(key) {
      const value = map.get(key);
      if (value === undefined) return undefined;
      map.delete(key);
      map.set(key, value);
      return value;
    },
    set(key, value) {
      map.delete(key);
      map.set(key, value);
      while (map.size > limit) map.delete(map.keys().next().value);
    },
    get size() { return map.size; },
  };
}

function fontFilesIn(dir) {
  if (!dir || !existsSync(dir)) return [];
  try {
    return readdirSync(dir).filter((name) => /\.(ttf|otf|ttc)$/i.test(name)).map((name) => path.join(dir, name)).sort();
  } catch {
    return [];
  }
}

async function defaultRendererLoader() {
  const mod = await import("@resvg/resvg-js");
  return mod.Resvg || mod.default?.Resvg;
}

/**
 * Builds the /og/<kind>/<id>.png handler.
 * @param {object} options
 * @param {string} options.clientRoot        dist/client (news feed, brand logos, intel feed live here)
 * @param {string} [options.buildId]         part of every cache key
 * @param {string} [options.cacheDir]        OG_CACHE_DIR; unset = memory cache only (the app mount is read-only)
 * @param {string} [options.fontDir]         OG_FONT_DIR with TTF/OTF files; system fonts are always loaded too
 * @param {string} [options.marketEventsFile] MARKET_EVENTS_FILE; default <clientRoot>/intel/market-events.json
 * @param {string} [options.fallbackImage]   static image served when the renderer cannot load
 */
export function createOgImageRoute({ clientRoot, buildId = "dev", cacheDir = null, fontDir = null, marketEventsFile = null, fallbackImage = null, log = () => {}, loadRenderer = defaultRendererLoader, now = () => new Date() } = {}) {
  const memory = createMemoryCache();
  const loadNews = createNewsSource(clientRoot);
  const marketFile = marketEventsFile || path.join(clientRoot, "intel", "market-events.json");
  const fonts = fontFilesIn(fontDir);
  let rendererPromise = null;
  let rendererFailed = false;
  const renderer = () => {
    if (!rendererPromise) {
      rendererPromise = loadRenderer().catch((error) => {
        rendererFailed = true;
        rendererPromise = null;
        log(`og-image renderer unavailable: ${error?.message || error}`);
        throw error;
      });
    }
    return rendererPromise;
  };

  async function renderPng(svg) {
    const Resvg = await renderer();
    const instance = new Resvg(svg, {
      fitTo: { mode: "width", value: OG_WIDTH },
      font: { loadSystemFonts: true, fontFiles: fonts, defaultFontFamily: "Inter" },
      background: COLOR.bg,
    });
    return Buffer.from(instance.render().asPng());
  }

  async function fromDisk(key) {
    if (!cacheDir) return null;
    try { return await readFile(path.join(cacheDir, `${sha1(key)}.png`)); } catch { return null; }
  }

  async function toDisk(key, png) {
    if (!cacheDir) return;
    try {
      await mkdir(cacheDir, { recursive: true });
      const file = path.join(cacheDir, `${sha1(key)}.png`);
      await writeFile(`${file}.${process.pid}.tmp`, png);
      await rename(`${file}.${process.pid}.tmp`, file);
    } catch (error) {
      log(`og-image disk cache write failed: ${error?.message || error}`);
    }
  }

  // Resolves the request to { svg, cacheKey, cacheControl, persist } or null (404).
  async function resolve(kind, id, locale) {
    if (kind === "news") {
      const feed = await loadNews();
      const article = feed.articles.find((item) => item.slug === id);
      if (!article) return null;
      const category = article.categoryName?.[locale] || newsCategoryCopy(article.category, locale)?.label || article.categoryName?.en || "";
      const title = localizedNewsTitle(article, locale) || article.seo?.title || id;
      return { svg: newsCardSvg({ title, category, date: isoDay(article.publishedAt), locale }), cacheKey: `${feed.fingerprint}:${isoDay(article.updatedAt) || ""}`, cacheControl: CACHE_CONTROL, persist: true };
    }
    if (kind === "venue") {
      const data = venueCardData(id, clientRoot, locale);
      if (!data) return null;
      const logoPng = data.logoFile ? await readFile(data.logoFile).catch(() => null) : null;
      return { svg: venueCardSvg({ ...data, logoPng, locale }), cacheKey: `${FACTS_AS_OF}:${data.logoFile ? "logo" : "nologo"}`, cacheControl: CACHE_CONTROL, persist: true };
    }
    if (kind === "compare") {
      const data = compareCardData(id, locale);
      if (!data) return null;
      return { svg: compareCardSvg({ ...data, locale }), cacheKey: FACTS_AS_OF, cacheControl: CACHE_CONTROL, persist: true };
    }
    if (kind === "liquidations") {
      const windowKey = LIQUIDATION_WINDOWS[id];
      if (!windowKey) return null;
      const feed = await readJsonFile(marketFile);
      const w = feed?.data?.liquidations?.[windowKey];
      if (!w || !Number.isFinite(Number(w.totalUsd))) {
        return { svg: liquidationsCardSvg({ window: null, locale }), cacheKey: "unavailable", cacheControl: UNAVAILABLE_CACHE_CONTROL, persist: false };
      }
      return { svg: liquidationsCardSvg({ window: w, generatedAt: feed.data.generatedAt, locale }), cacheKey: feed.fingerprint, cacheControl: LIVE_CACHE_CONTROL, persist: false };
    }
    if (kind === "default") {
      if (id !== "site") return null;
      return { svg: defaultCardSvg({ locale }), cacheKey: "site-slogan-v2", cacheControl: CACHE_CONTROL, persist: true };
    }
    return null;
  }

  const notFound = () => new Response("Not Found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300", "x-content-type-options": "nosniff" } });

  async function handle(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/og\/([a-z]+)\/([a-z0-9][a-z0-9-]{0,159})\.png$/);
    if (!match || !OG_KINDS.includes(match[1]) || !ID_PATTERN.test(match[2])) return notFound();
    const [, kind, id] = match;
    const locale = normalizeOgLocale(url.searchParams.get("locale"));
    const resolved = await resolve(kind, id, locale);
    if (!resolved) return notFound();
    const key = `${buildId}:${kind}:${id}:${locale}:${resolved.cacheKey}`;
    const headers = {
      "content-type": "image/png",
      "cache-control": resolved.cacheControl,
      "x-content-type-options": "nosniff",
      "x-robots-tag": "noindex",
      etag: `"${sha1(key).slice(0, 20)}"`,
    };
    if (request.headers.get("if-none-match") === headers.etag) return new Response(null, { status: 304, headers });
    let png = memory.get(key) || (resolved.persist ? await fromDisk(key) : null);
    if (!png) {
      try {
        png = await renderPng(resolved.svg);
      } catch {
        // Renderer missing (e.g. native binary absent on this host): keep the link working with the brand image.
        if (fallbackImage && existsSync(fallbackImage)) {
          const body = request.method === "HEAD" ? null : await readFile(fallbackImage);
          return new Response(body, { status: 200, headers: { ...headers, "content-type": fallbackImage.endsWith(".png") ? "image/png" : "image/jpeg", "cache-control": UNAVAILABLE_CACHE_CONTROL, "x-nexualpha-og": "fallback" } });
        }
        return new Response(JSON.stringify({ status: "unavailable", reasonCode: "OG_RENDERER_UNAVAILABLE" }), { status: 503, headers: { "content-type": "application/json", "cache-control": "no-store" } });
      }
      memory.set(key, png);
      if (resolved.persist) await toDisk(key, png);
    }
    headers["content-length"] = String(png.length);
    return new Response(request.method === "HEAD" ? null : png, { status: 200, headers });
  }

  handle.svgFor = async (kind, id, locale = "en") => (await resolve(kind, id, normalizeOgLocale(locale)))?.svg || null;
  handle.renderPng = renderPng;
  handle.cacheSize = () => memory.size;
  handle.rendererFailed = () => rendererFailed;
  return handle;
}

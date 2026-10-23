// Social "data cards": GET /og/<kind>/<id>.png renders a 1200x630 PNG per page so Google Discover, Telegram link
// previews and X cards show the page's own facts instead of a generic logo (2026-10-10).
//   news/<slug>            title, category, date            (feed: dist/client/content/news-feed.json)
//   venue/<slug>           name, logo, fees, rebate share   (src/data/exchange-facts.js + home-rebate-tiers.js)
//   compare/<a>-vs-<b>     both names, spot/perp headline fees
//   liquidations/24h       24h total, long/short, largest   (feed: /intel/market-events.json)
//   default/site           wordmark card
// Every figure comes from the same data the page reads; invite codes come only from publicCtaForVenue.
// Rendering: SVG -> PNG through @resvg/resvg-js (native, no browser). Fonts: the repo's woff2 files are tiny
// per-page subsets (public/fonts/manifest.json) and resvg reads TTF/OTF only, so cards use TTF/OTF files from
// OG_FONT_DIR plus the host's system fonts by family name; see FONT_FAMILY below. Rendered PNGs are cached in memory
// (LRU 500) and, when OG_CACHE_DIR is set, on disk keyed by build id and data fingerprint.
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readdirSync, statSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { localizedNewsTitle } from "../src/data/news-feed-client.js";
import { newsCategoryCopy } from "../src/data/news-library.js";
import { factsForVenue, feeDisplay, feeFact, venueCheckedOn } from "../src/data/exchange-facts.js";
import { partnerRebateShare } from "../src/data/partner-benefit-status.js";
import { brandSlogan, brandSloganSecondary } from "../src/data/brand-slogan.js";
import { trPercentDative } from "../src/data/tr-percent.js";
import { publicCtaForVenue } from "../src/data/public-cta.js";
import { dataPageCopy, readFunding, readLiquidationCoverage } from "../src/data/market-data-pages.js";
import { STOCK_LOGOS } from "../src/components/tokenized-stocks/stock-logo-manifest.js";
import { tsArticleTickers } from "../src/data/tokenized-stocks-news.js";
export { socialImagePathForRoute } from "../src/data/social-image.js";

export const OG_CARD_VERSION = "cards-v3-stock-logos";
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
export const OG_PATH_PREFIX = "/og/";
export const OG_KINDS = Object.freeze(["news", "venue", "compare", "liquidations", "funding", "default"]);
export const OG_LOCALES = Object.freeze(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"]);
const RTL_LOCALES = new Set(["ar", "ur"]);
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,159}$/;
const MEMORY_LIMIT = 500;
const CACHE_CONTROL = "public, max-age=86400";
// Liquidation totals change every collector cycle (5 min); a day-long cache would show yesterday's number.
const LIVE_CACHE_CONTROL = "public, max-age=600";
const UNAVAILABLE_CACHE_CONTROL = "public, max-age=300";

// Brand tokens (src/styles/tokens.css): --market, --surface-2, --ink, --muted, --blue, --blue-text, --positive, --danger.
const COLOR = Object.freeze({ bg: "#08090C", surface: "#14161B", ink: "#f5f7fa", muted: "#9aa5b5", blue: "#315ccf", blueText: "#1FE0C0", positive: "#22c88a", danger: "#e65b5b", line: "rgba(180,196,211,0.16)" });
// Family names in preference order. Geist is the site typeface; PingFang/Hiragino/Geeza/Arial Unicode
// cover CJK + Arabic on macOS, Noto CJK/Arabic and DejaVu on Linux hosts that have fonts-noto installed.
const FONT_FAMILY = "Geist, 'Noto Sans', 'Noto Sans SC', 'Noto Sans TC', 'Noto Sans JP', 'Noto Sans KR', 'Noto Sans CJK SC', 'Noto Sans Arabic', 'WenQuanYi Micro Hei', 'WenQuanYi Zen Hei', 'PingFang SC', 'Hiragino Sans GB', 'Geeza Pro', 'Arial Unicode MS', 'DejaVu Sans', Arial, sans-serif";

// Labels printed on cards. All 17 UI locales (brief: every user-visible string ships in every locale).
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
  // l10n: needs native review
  ur: { feesChecked: "فیس کی جانچ {date}", rebate: "ریبٹ حصہ زیادہ سے زیادہ {pct}", rebatePending: "ریبٹ حصہ زیرِ تصدیق", spot: "اسپاٹ میکر / ٹیکر", perp: "دائمی معاہدے میکر / ٹیکر", notChecked: "ابھی جانچ نہیں ہوئی", vs: "بمقابلہ", compare: "فیس کا موازنہ", liquidations: "فیوچر لیکویڈیشن · 24 گھنٹے", longs: "لانگ", shorts: "شارٹ", largest: "سب سے بڑی واحد", lowerBound: "Binance + OKX، کم از کم حد · {time} UTC", feedUpdating: "لیکویڈیشن فیڈ اپ ڈیٹ ہو رہی ہے", tagline: "کرپٹو پلیٹ فارمز کی آزاد تحقیق", research: "ذرائع کی جانچ پر مبنی تحقیق" },
  // l10n: needs native review
  uk: { feesChecked: "Комісії перевірено {date}", rebate: "Частка повернення до {pct}", rebatePending: "Частка повернення очікує перевірки", spot: "Спот мейкер / тейкер", perp: "Безстрокові мейкер / тейкер", notChecked: "Ще не перевірено", vs: "проти", compare: "Порівняння комісій", liquidations: "Ліквідації ф'ючерсів · 24 год", longs: "Лонги", shorts: "Шорти", largest: "Найбільша окрема", lowerBound: "Binance + OKX, нижня межа · {time} UTC", feedUpdating: "Стрічка ліквідацій оновлюється", tagline: "Незалежне дослідження криптоплатформ", research: "Дослідження з перевіркою джерел" },

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
  if (/[mwMW]/.test(ch)) return 1.0;
  if (/[A-Z]/.test(ch)) return 0.82;
  if (/[a-z]/.test(ch)) return 0.66;
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
function textAttrs(locale, x, y, size, { weight = 400, color = COLOR.ink, family = FONT_FAMILY, align = "start", direction = RTL_LOCALES.has(locale) ? "rtl" : null, extra = "" } = {}) {
  const rtl = RTL_LOCALES.has(locale);
  const anchor = align === "center" ? "middle" : align === "end" ? (rtl ? "start" : "end") : (rtl ? "end" : "start");
  const dir = direction ? ` direction="${direction}" unicode-bidi="embed"` : "";
  const xx = rtl ? OG_WIDTH - x : x;
  return `x="${xx}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" font-family="${escapeXml(family)}" text-anchor="${anchor}"${dir} xml:lang="${escapeXml(locale)}"${extra ? ` ${extra}` : ""}`;
}
const textEl = (locale, x, y, size, text, options) => `<text ${textAttrs(locale, x, y, size, options)}>${escapeXml(text)}</text>`;

function fittedText(locale, x, y, size, text, maxWidth, options = {}) {
  const line = wrapText(text, { fontSize: size, maxWidth, maxLines: 1 })[0] || "";
  return line ? textEl(locale, x, y, size, line, options) : "";
}

function frame(locale, { kicker, kickerColor = COLOR.blueText, brandMark = true } = {}) {
  const l = labelsFor(locale);
  return `<defs>
  <linearGradient id="accent"><stop stop-color="#1FE0C0"/><stop offset="1" stop-color="#315CFF"/></linearGradient>
  <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#9097A0" opacity=".15"/></pattern>
</defs>
<rect width="1200" height="630" fill="${COLOR.bg}"/>
<rect width="1200" height="630" fill="url(#dots)"/>
<rect width="1200" height="6" fill="url(#accent)"/>
${wordmark(locale, { brandMark })}
${kicker ? fittedText(locale, 64, 176, 24, kicker, 1072, { weight: 600, color: kickerColor }) : ""}
<line x1="64" y1="558" x2="1136" y2="558" stroke="${COLOR.line}"/>
${textEl(locale, 64, 601, 24, "nexualpha.com", { weight: 600, color: COLOR.ink })}
${fittedText(locale, 1136, 601, 20, l.tagline, 720, { color: COLOR.muted, align: "end" })}`;
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

function titleBlock(locale, title, { x = 64, y = 290, size = 58, maxLines = 2, maxWidth = 1072 } = {}) {
  const lines = wrapText(title, { fontSize: size, maxWidth, maxLines });
  return lines.map((line, index) => textEl(locale, x, y + index * Math.round(size * 1.22), size, line,
    { weight: 700, extra: 'letter-spacing="-0.8" data-og-title="true"' })).join("\n");
}

function svgDocument(locale, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" xml:lang="${escapeXml(locale)}">\n${body}\n</svg>`;
}

// Display-only logo accents; no partner facts or browser imports. Primary partner colours match home7.src.css.
const LOGO_ACCENTS = Object.freeze({
  binance: "#F0B90B", okx: "#FFFFFF", bitget: "#00E5FF", bybit: "#F7A600", kucoin: "#23AF91",
  coinbase: "#0052FF", kraken: "#7132F5", mexc: "#2D6EFF", "gate-io": "#2354E6", htx: "#2B61FF",
  uniswap: "#FF007A", pancakeswap: "#1FC7D4", hyperliquid: "#97FCE4", jupiter: "#C7F284", gmx: "#2D42FC",
});

function logoImage(locale, logoPng, x, y, size, { tile = false, slug } = {}) {
  if (!logoPng) return "";
  const xx = RTL_LOCALES.has(locale) ? OG_WIDTH - x - size : x;
  const mime = logoPng.toString("utf8", 0, 256).includes("<svg") ? "image/svg+xml" : "image/png";
  const image = `<image href="data:${mime};base64,${logoPng.toString("base64")}" x="${xx}" y="${y}" width="${size}" height="${size}"/>`;
  if (!tile) return image;
  const id = `logo-${xx}-${y}-${size}`;
  const accent = LOGO_ACCENTS[slug] || COLOR.blueText;
  // A radial halo avoids a blur filter on each request; clip the raster itself so its black corners disappear.
  return `<defs>
<clipPath id="${id}-clip"><rect x="${xx}" y="${y}" width="${size}" height="${size}" rx="24"/></clipPath>
<radialGradient id="${id}-glow"><stop offset=".3" stop-color="${accent}" stop-opacity=".24"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
</defs>
<rect x="${xx - 36}" y="${y - 36}" width="${size + 72}" height="${size + 72}" fill="url(#${id}-glow)"/>
<g data-og-logo-tile="true" clip-path="url(#${id}-clip)"><rect x="${xx}" y="${y}" width="${size}" height="${size}" fill="${COLOR.surface}"/>${image}</g>
<rect x="${xx}" y="${y}" width="${size}" height="${size}" rx="24" fill="none" stroke="${accent}" stroke-opacity=".28"/>`;
}

const CATEGORY_COLORS = Object.freeze({ guide: "#9EE8DE", comparison: "#73A6FF", "exchange-update": "#70D7E5", regulation: "#E9A93B", rwa: "#A6B8FF", research: "#1FE0C0" });

// Compact additions to the existing localized card labels. No registration URL is printed on a card.
const CARD_COPY = {
  en: ["Invite code", "We may earn a commission. Platform terms apply."],
  "zh-Hans": ["邀请码", "我们可能获得佣金，适用平台条款。"],
  "zh-Hant": ["邀請碼", "我們可能獲得佣金，適用平台條款。"],
  es: ["Código", "Podemos recibir comisión. Rigen los términos de la plataforma."],
  "pt-BR": ["Código", "Podemos receber comissão. Valem os termos da plataforma."],
  fr: ["Code", "Commission possible. Conditions de la plateforme applicables."],
  de: ["Einladungscode", "Wir erhalten ggf. Provision. Plattformbedingungen gelten."],
  it: ["Codice", "Possibile commissione. Si applicano i termini della piattaforma."],
  ja: ["紹介コード", "当サイトは報酬を受け取る場合があります。プラットフォーム規約が適用されます。"],
  ko: ["초대 코드", "당사는 수수료를 받을 수 있습니다. 플랫폼 약관이 적용됩니다."],
  ru: ["Код", "Возможна комиссия. Действуют условия платформы."],
  tr: ["Davet kodu", "Komisyon alabiliriz. Platform koşulları geçerlidir."],
  id: ["Kode undangan", "Kami dapat komisi. Ketentuan platform berlaku."],
  vi: ["Mã mời", "Chúng tôi có thể nhận hoa hồng. Áp dụng điều khoản sàn."],
  ar: ["رمز الدعوة", "قد نحصل على عمولة. تطبق شروط المنصة."],
  ur: ["دعوتی کوڈ", "ہمیں کمیشن مل سکتا ہے۔ پلیٹ فارم کی شرائط لاگو ہیں۔"],
  uk: ["Код", "Можлива комісія. Діють умови платформи."],
};

export function newsCardSvg({ title, category, categoryId, date, logoPng, locale = "en" }) {
  const color = CATEGORY_COLORS[categoryId] || COLOR.blueText;
  const markX = RTL_LOCALES.has(locale) ? 1128 : 64;
  return svgDocument(locale, `${frame(locale)}
<rect x="${markX}" y="170" width="8" height="28" fill="${color}"/>
${fittedText(locale, 88, 194, 26, category, logoPng ? 720 : 1048, { weight: 600, color })}
${titleBlock(locale, title, { y: 302, size: 60, maxWidth: logoPng ? 740 : 1072 })}
${logoImage(locale, logoPng, 876, 232, 260)}
${date ? textEl(locale, 64, 493, 26, ltrIsolate(date, locale), { color: COLOR.muted }) : ""}`);
}

export function venueCardSvg({ slug, name, logoPng, spot, perp, checkedOn, rebateShare, inviteCode, locale = "en" }) {
  const l = labelsFor(locale);
  const [codeLabel, disclosure] = CARD_COPY[locale] || CARD_COPY.en;
  return svgDocument(locale, `${frame(locale, { kicker: l.research })}
${logoImage(locale, logoPng, 896, 220, 240, { tile: true, slug })}
${fittedText(locale, 64, 268, 66, name, logoPng ? 780 : 1072, { weight: 700 })}
${Number.isFinite(rebateShare) ? fittedText(locale, 64, 338, 40, fill(l.rebate, { pct: ltrIsolate(percentLabel(Math.round(rebateShare * 100), locale), locale) }), 800, { weight: 600, color: COLOR.positive }) : ""}
${spot ? textEl(locale, 64, 397, 24, l.spot, { color: COLOR.muted }) + textEl(locale, 64, 442, 38, ltrIsolate(spot, locale), { weight: 600 }) : perp ? textEl(locale, 64, 397, 24, l.perp, { color: COLOR.muted }) + textEl(locale, 64, 442, 38, ltrIsolate(perp, locale), { weight: 600 }) : textEl(locale, 64, 416, 28, l.notChecked, { color: COLOR.muted })}
${inviteCode ? fittedText(locale, 64, 492, 28, `${codeLabel}  ${inviteCode}`, 1072, { weight: 600 }) : checkedOn ? textEl(locale, 64, 492, 24, fill(l.feesChecked, { date: ltrIsolate(checkedOn, locale) }), { color: COLOR.muted }) : ""}
${inviteCode ? fittedText(locale, 64, 532, 22, disclosure, 1072, { color: COLOR.muted }) : ""}
${inviteCode && checkedOn ? fittedText(locale, 1136, 100, 20, fill(l.feesChecked, { date: ltrIsolate(checkedOn, locale) }), 700, { color: COLOR.muted, align: "end" }) : ""}`);
}

// Each statement names the cheaper venue and fee type. Equal and missing data stay distinct.
const FEE_GAP_COPY = {
  en: ["Same spot fees", "{name} spot maker fee {gap} pp lower", "{name} spot taker fee {gap} pp lower"],
  "zh-Hans": ["现货手续费相同", "{name} 现货挂单费率低 {gap} 个百分点", "{name} 现货吃单费率低 {gap} 个百分点"],
  "zh-Hant": ["現貨手續費相同", "{name} 現貨掛單費率低 {gap} 個百分點", "{name} 現貨吃單費率低 {gap} 個百分點"],
  es: ["Mismas comisiones spot", "{name}: comisión maker spot {gap} pp menor", "{name}: comisión taker spot {gap} pp menor"],
  "pt-BR": ["Mesmas taxas spot", "{name}: taxa maker spot {gap} pp menor", "{name}: taxa taker spot {gap} pp menor"],
  fr: ["Mêmes frais spot", "{name} : frais maker spot inférieurs de {gap} point(s)", "{name} : frais taker spot inférieurs de {gap} point(s)"],
  de: ["Gleiche Spotgebühren", "{name}: Spot-Maker-Gebühr {gap} Prozentpunkte niedriger", "{name}: Spot-Taker-Gebühr {gap} Prozentpunkte niedriger"],
  it: ["Stesse commissioni spot", "{name}: commissione maker spot inferiore di {gap} pp", "{name}: commissione taker spot inferiore di {gap} pp"],
  ja: ["現物手数料は同じ", "{name} の現物メイカー手数料が {gap} ポイント低い", "{name} の現物テイカー手数料が {gap} ポイント低い"],
  ko: ["현물 수수료 동일", "{name} 현물 메이커 수수료 {gap}%p 낮음", "{name} 현물 테이커 수수료 {gap}%p 낮음"],
  ru: ["Одинаковые спотовые комиссии", "{name}: комиссия мейкера спот ниже на {gap} п.п.", "{name}: комиссия тейкера спот ниже на {gap} п.п."],
  tr: ["Spot ücretleri aynı", "{name} spot yapıcı ücreti {gap} yüzde puan daha düşük", "{name} spot alıcı ücreti {gap} yüzde puan daha düşük"],
  id: ["Biaya spot sama", "{name}: biaya maker spot {gap} poin persentase lebih rendah", "{name}: biaya taker spot {gap} poin persentase lebih rendah"],
  vi: ["Phí giao ngay bằng nhau", "{name}: phí maker giao ngay thấp hơn {gap} điểm phần trăm", "{name}: phí taker giao ngay thấp hơn {gap} điểm phần trăm"],
  ar: ["رسوم التداول الفوري متساوية", "{name}: رسوم صانع السوق الفوري أقل بـ {gap} نقطة مئوية", "{name}: رسوم آخذ السوق الفوري أقل بـ {gap} نقطة مئوية"],
  ur: ["اسپاٹ فیس یکساں ہے", "{name}: اسپاٹ میکر فیس {gap} فیصد پوائنٹ کم", "{name}: اسپاٹ ٹیکر فیس {gap} فیصد پوائنٹ کم"],
  uk: ["Однакові спотові комісії", "{name}: комісія мейкера спот нижча на {gap} в.п.", "{name}: комісія тейкера спот нижча на {gap} в.п."],
};

function compareFeeInsights(venues, locale) {
  if (venues.length !== 2 || !venues.every(v => Array.isArray(v.spotNumbers)
    && v.spotNumbers.length === 2 && v.spotNumbers.every(Number.isFinite))) return [];
  const copy = FEE_GAP_COPY[locale] || FEE_GAP_COPY.en;
  const gaps = venues[0].spotNumbers.map((value, i) => Number((value - venues[1].spotNumbers[i]).toFixed(6)));
  if (gaps.every(value => value === 0)) return [copy[0]];
  return gaps.flatMap((gap, i) => gap === 0 ? [] : [fill(copy[i + 1], {
    name: ltrIsolate(venues[gap > 0 ? 1 : 0].name, locale),
    gap: ltrIsolate(new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(Math.abs(gap)), locale),
  })]);
}

function comparePerpLine(locale, x, label, fees, maxWidth) {
  // Separate text nodes keep the numeric pair LTR in resvg, even alongside an RTL label.
  const value = String(fees).replace(/\p{Bidi_Control}/gu, "");
  // Label and value meet at the column centre so the secondary row lines up under the spot headline.
  return fittedText(locale, x - 10, 484, 16, label, maxWidth / 2 - 4, { align: "end", color: COLOR.muted })
    + textEl(locale, x + 10, 484, 20, value, { direction: "ltr", color: COLOR.muted });
}

export function compareCardSvg({ venues, locale = "en" }) {
  const l = labelsFor(locale);
  const cell = 1072 / venues.length;
  const logoSize = venues.length === 2 ? 128 : 112;
  const columnWidth = venues.length === 2 ? 440 : cell - 32;
  const centers = venues.map((_, i) => 64 + (i + .5) * cell);
  const cells = venues.map((venue, i) => {
    const x = centers[i];
    const centered = { align: "center" };
    return `${logoImage(locale, venue.logoPng, x - logoSize / 2, 208, logoSize, { tile: true, slug: venue.slug })}
${fittedText(locale, x, 380, 40, venue.name, columnWidth, { ...centered, weight: 700 })}
${fittedText(locale, x, 414, 20, l.spot, columnWidth, { ...centered, color: COLOR.muted })}
${venue.spot ? fittedText(locale, x, 452, 30, venue.spot.replace(/\p{Bidi_Control}/gu, ""), columnWidth, { ...centered, weight: 600, direction: "ltr" }) : ""}
${venue.perp ? comparePerpLine(locale, x, l.perp, venue.perp, columnWidth) : ""}`;
  }).join("\n");
  const insights = compareFeeInsights(venues, locale);
  const vs = centers.slice(1).map((center, i) => {
    const x = (centers[i] + center) / 2;
    const xx = RTL_LOCALES.has(locale) ? OG_WIDTH - x : x;
    const radius = venues.length === 2 ? 48 : 32;
    return `<g data-og-vs="true"><circle cx="${xx}" cy="272" r="${radius}" fill="${COLOR.surface}" stroke="url(#accent)" stroke-width="3"/>
${textEl(locale, x, 285, venues.length === 2 ? 38 : 30, "VS", { align: "center", weight: 700 })}</g>`;
  }).join("");
  const gapText = insights.map((text, i) => fittedText(locale, 600, insights.length === 1 ? 530 : 518 + i * 28, 24, text, 1072,
    { align: "center", color: COLOR.positive })).join("\n");
  return svgDocument(locale, `${frame(locale, { kicker: l.compare })}${cells}${vs}${gapText}`);
}

// Strict numeric parsing: null, empty strings and booleans are missing, never zero.
const finiteNumber = value => (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) && Number.isFinite(Number(value)) ? Number(value) : null;
const nonnegative = value => finiteNumber(value) !== null && Number(value) >= 0 ? Number(value) : null;
const stamp = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString().replace("T", " ").slice(0, 16) + " UTC" : null;

export function liquidationsCardSvg({ window: w, generatedAt, windowLabel = "24h", locale = "en" }) {
  const l = labelsFor(locale);
  const title = l.liquidations.replace(/24/g, windowLabel.replace("h", ""));
  if (!w || !stamp(generatedAt) || nonnegative(w.totalUsd) === null) {
    return svgDocument(locale, `${frame(locale, { kicker: title })}${titleBlock(locale, l.feedUpdating, { size: 52 })}`);
  }
  const long = nonnegative(w.longUsd), short = nonnegative(w.shortUsd);
  const max = Math.max(long ?? 0, short ?? 0);
  const chart = [[l.longs, long, COLOR.danger], [l.shorts, short, COLOR.positive]].map(([label, value, color], i) => {
    if (value === null) return "";
    const y = 300 + i * 108;
    const width = max > 0 ? 400 * value / max : 0;
    const x = RTL_LOCALES.has(locale) ? OG_WIDTH - 680 - width : 680;
    return `${textEl(locale, 680, y - 16, 26, `${label}  ${ltrIsolate(formatUsdCompact(value), locale)}`, { color })}
<rect data-og-chart="liquidations" x="${x}" y="${y}" width="${width}" height="22" rx="4" fill="${color}"/>`;
  }).join("");
  const largest = nonnegative(w.largest?.usd);
  const coverage = readLiquidationCoverage(w.coverage, [...(Array.isArray(w.topSymbols) ? w.topSymbols : []), ...(w.largest ? [w.largest] : [])]);
  return svgDocument(locale, `${frame(locale, { kicker: title, kickerColor: COLOR.danger })}
${fittedText(locale, 64, 318, 100, ltrIsolate(formatUsdCompact(w.totalUsd), locale), 570, { weight: 700 })}${chart}
${largest !== null ? fittedText(locale, 64, 410, 22, l.largest, 540, { color: COLOR.muted }) + fittedText(locale, 64, 454, 28, `${ltrIsolate(formatUsdCompact(largest), locale)} · ${w.largest.symbol || ""} ${w.largest.side === "short" ? l.shorts : w.largest.side === "long" ? l.longs : ""}`, 540, { weight: 600 }) : ""}
${fittedText(locale, 64, 514, 22, fill(l.lowerBound.replace("Binance + OKX", coverage.venues.join(" + ")), { time: stamp(generatedAt).replace(" UTC", "") }), 1072, { color: COLOR.muted })}`);
}

export function fundingCardSvg({ funding, locale = "en" }) {
  const copy = dataPageCopy(locale);
  const rows = (funding?.rows || []).filter(r => r.symbol && [r.binanceRate, r.okxRate].some(v => finiteNumber(v) !== null)).slice(0, 4);
  if (!rows.length || !stamp(funding?.generatedAt)) {
    return svgDocument(locale, `${frame(locale, { kicker: copy.funding.h1 })}${titleBlock(locale, copy.common.unavailableTitle, { size: 52 })}`);
  }
  const max = Math.max(...rows.flatMap(r => [r.binanceRate, r.okxRate].map(v => Math.abs(finiteNumber(v) ?? 0))));
  const axis = [380, 820].map(center => {
    const x = RTL_LOCALES.has(locale) ? OG_WIDTH - center : center;
    return `<line x1="${x}" y1="228" x2="${x}" y2="480" stroke="${COLOR.line}"/>`;
  }).join("");
  const bars = rows.map((row, i) => {
    const y = 240 + i * 68;
    return `${fittedText(locale, 64, y + 20, 28, row.symbol, 180, { weight: 600 })}` + [row.binanceRate, row.okxRate].map((raw, j) => {
      const rate = finiteNumber(raw);
      if (rate === null) return "";
      const width = max ? Math.abs(rate) / max * 130 : 0;
      const center = j ? 820 : 380;
      const start = rate < 0 ? center - width : center;
      const x = RTL_LOCALES.has(locale) ? 1200 - start - width : start;
      const value = new Intl.NumberFormat(locale === "ar" ? "ar-u-nu-latn" : locale, { style: "percent", maximumFractionDigits: 4 }).format(rate);
      return `<rect data-og-chart="funding" x="${x}" y="${y}" width="${width}" height="22" rx="3" fill="${j ? COLOR.blueText : "#73A6FF"}"/>
${textEl(locale, j ? 980 : 540, y + 20, 24, ltrIsolate(value, locale), { weight: 600 })}`;
    }).join("");
  }).join("");
  return svgDocument(locale, `${frame(locale, { kicker: copy.funding.h1 })}
${textEl(locale, 300, 212, 22, "Binance", { color: "#73A6FF" })}${textEl(locale, 740, 212, 22, "OKX", { color: COLOR.blueText })}
${axis}${bars}
${fittedText(locale, 64, 536, 22, `${copy.funding.perPeriod} · ${stamp(funding.generatedAt)}`, 1072, { color: COLOR.muted })}`);
}

export function defaultCardSvg({ locale = "en" }) {
  const kicker = RTL_LOCALES.has(locale)
    ? brandSloganSecondary(locale).replace(/[.。]$/u, "").replace(/(?=\d)/u, "\u200F")
    : brandSloganSecondary(locale);
  const globeX = RTL_LOCALES.has(locale) ? 260 : 940;
  return svgDocument(locale, `${frame(locale)}
<g transform="translate(${globeX} 350)" fill="none" stroke="url(#accent)" stroke-width="2" opacity=".65">
<circle r="172"/><ellipse rx="90" ry="172"/><ellipse rx="35" ry="172"/><ellipse rx="172" ry="62"/><path d="M-172 0H172M0-172V172"/></g>
${fittedText(locale, 64, 205, 25, kicker, 1072, { color: COLOR.blueText, weight: 600 })}
${titleBlock(locale, brandSlogan(locale), { y: 322, size: 58, maxWidth: 670, maxLines: 3 })}`);
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

function tileFile(root, slug) {
  if (!root || !/^[a-z0-9][a-z0-9-]{0,80}$/.test(slug || "")) return null;
  const tile = path.join(root, "brands", "tile", `${slug}-128.png`);
  const original = path.join(root, "brands", `${slug}.png`);
  return existsSync(tile) ? tile : existsSync(original) ? original : null;
}
async function readStockLogo(root, article) {
  const ticker = tsArticleTickers(article).find((symbol) => STOCK_LOGOS[symbol]);
  if (!ticker) return null;
  return readFile(path.join(root, STOCK_LOGOS[ticker].src.replace(/^\//, ""))).catch(() => null);
}
async function readLogo(root, slug) {
  const file = tileFile(root, slug);
  return file ? readFile(file).catch(() => null) : null;
}
function articleLogoSlug(article, root) {
  return [...(Array.isArray(article.relatedVenues) ? article.relatedVenues : []), article.cta?.venue, article.cta?.coin]
    .find(slug => typeof slug === "string" && /^[a-z0-9][a-z0-9-]{0,80}$/.test(slug) && tileFile(root, slug)) || null;
}

export function venueCardData(slug, clientRoot, locale = "en") {
  const facts = factsForVenue(slug);
  if (!facts) return null;
  const logoFile = tileFile(clientRoot, slug);
  return {
    slug,
    name: facts.name,
    logoFile: logoFile && existsSync(logoFile) ? logoFile : null,
    // Same formatter as the pages (format-fee.js): exact reviewed precision, locale decimal/percent style.
    spot: feeDisplay(slug, "spot", locale),
    perp: feeDisplay(slug, "perp", locale),
    checkedOn: venueCheckedOn(slug),
    rebateShare: partnerRebateShare(slug),
    inviteCode: publicCtaForVenue(slug, locale).inviteCode,
  };
}

export function compareCardData(pair, locale = "en") {
  const slugs = String(pair || "").split("-vs-");
  if (slugs.length < 2 || slugs.length > 3 || new Set(slugs).size !== slugs.length) return null;
  const venues = slugs.map((slug) => {
    const facts = factsForVenue(slug);
    return facts ? { slug, spotNumbers: feeFact(slug, "spot").state === "checked" ? facts.spot : null, name: facts.name, spot: feeDisplay(slug, "spot", locale), perp: feeDisplay(slug, "perp", locale), checkedOn: venueCheckedOn(slug) } : null;
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
      font: { loadSystemFonts: !fonts.length, fontFiles: fonts, defaultFontFamily: "DejaVu Sans" },
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
      // Workers have distinct PIDs; requests within one worker also need distinct temporary files.
      const tmp = `${file}.${process.pid}.${randomUUID()}.tmp`;
      try {
        await writeFile(tmp, png);
        await rename(tmp, file);
      } finally { await rm(tmp, { force: true }).catch(() => {}); }
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
      return { svg: newsCardSvg({ title, category, categoryId: article.category, logoPng: await readStockLogo(clientRoot, article) || await readLogo(clientRoot, articleLogoSlug(article, clientRoot)), date: isoDay(article.publishedAt), locale }), cacheKey: `${feed.fingerprint}:${isoDay(article.updatedAt) || ""}`, cacheControl: CACHE_CONTROL, persist: true };
    }
    if (kind === "venue") {
      const data = venueCardData(id, clientRoot, locale);
      if (!data) return null;
      const logoPng = data.logoFile ? await readFile(data.logoFile).catch(() => null) : null;
      return { svg: venueCardSvg({ ...data, logoPng, locale }), cacheKey: sha1(JSON.stringify(data) + (logoPng?.toString("base64") || "")), cacheControl: CACHE_CONTROL, persist: true };
    }
    if (kind === "compare") {
      const data = compareCardData(id, locale);
      if (!data) return null;
      data.venues = await Promise.all(data.venues.map(async v => ({ ...v, logoPng: await readLogo(clientRoot, v.slug) })));
      return { svg: compareCardSvg({ ...data, locale }), cacheKey: sha1(JSON.stringify(data)), cacheControl: CACHE_CONTROL, persist: true };
    }
    if (kind === "liquidations") {
      const windowKey = LIQUIDATION_WINDOWS[id];
      if (!windowKey) return null;
      const feed = await readJsonFile(marketFile);
      const w = feed?.data?.liquidations?.[windowKey];
      if (!w || nonnegative(w.totalUsd) === null || !stamp(feed?.data?.generatedAt)) {
        return { svg: liquidationsCardSvg({ window: null, windowLabel: id, locale }), cacheKey: "unavailable", cacheControl: UNAVAILABLE_CACHE_CONTROL, persist: false };
      }
      return { svg: liquidationsCardSvg({ window: w, generatedAt: feed.data.generatedAt, windowLabel: id, locale }), cacheKey: feed.fingerprint, cacheControl: LIVE_CACHE_CONTROL, persist: false };
    }
    if (kind === "funding") {
      if (id !== "rates") return null;
      const feed = await readJsonFile(marketFile);
      // The page reader accepts numeric prefixes; social cards reject malformed raw rates before projection.
      const raw = feed?.data?.funding;
      const safeRows = Array.isArray(raw?.rows) ? raw.rows.filter(r => r && typeof r === "object").map(r => ({ ...r,
        binanceRate: finiteNumber(r.binanceRate), okxRate: finiteNumber(r.okxRate),
      })) : [];
      const funding = readFunding({ ...feed?.data, funding: raw ? { ...raw, rows: safeRows } : null });
      return { svg: fundingCardSvg({ funding, locale }), cacheKey: feed?.fingerprint || "unavailable", cacheControl: funding ? LIVE_CACHE_CONTROL : UNAVAILABLE_CACHE_CONTROL, persist: false };
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
    const key = `${OG_CARD_VERSION}:${buildId}:${kind}:${id}:${locale}:${resolved.cacheKey}:${sha1(resolved.svg)}`;
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

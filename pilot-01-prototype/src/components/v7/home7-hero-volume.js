// Home hero v3 (owner 2026-10-14): "交易 1000万U，Bitget 自动返还你 $3,600".
// One honest sum, no time unit: rebate = traded volume × the venue's perpetual taker fee (exchange-facts.js) × the
// partner rebate share (partner-benefit-status.js). Nothing here holds a fee, share or code.
// Formatting is hand-written (not Intl compact) so SSR and the browser always print the same string.

/** 21 log-scale stops, 1万U → 10亿U: 1·2·3·5 per decade, then 1e9. Labelled snap points: 10万, 100万, 1000万, 1亿, 10亿. */
export const HERO_VOLUME_STEPS = Object.freeze((() => {
  const out = [];
  for (let e = 4; e < 9; e++) for (const m of [1, 2, 3, 5]) out.push(m * 10 ** e);
  out.push(1e9);
  return out;
})());
export const HERO_VOLUME_DEFAULT_STEP = HERO_VOLUME_STEPS.indexOf(1e7);
export const HERO_VOLUME_TICKS = Object.freeze([1e5, 1e6, 1e7, 1e8, 1e9].map((v) => HERO_VOLUME_STEPS.indexOf(v)));

/** Volume × perp taker (percent units) × share (0–1). null when any input is missing: never estimated. */
export function heroRebateAmount(volume, takerPct, share) {
  if (!(volume > 0) || !Number.isFinite(takerPct) || !(share > 0)) return null;
  return volume * (takerPct / 100) * share;
}

// Large-number units per script. CJK: 10^4 and 10^8; everyone else: thousand / million / billion.
const UNITS = Object.freeze({
  "zh-Hans": [[1e8, "亿"], [1e4, "万"]],
  "zh-Hant": [[1e8, "億"], [1e4, "萬"]],
  ja: [[1e8, "億"], [1e4, "万"]],
  ko: [[1e8, "억"], [1e4, "만"]],
  latin: [[1e9, "B"], [1e6, "M"], [1e3, "K"]],
});
const unitsFor = (locale) => UNITS[locale] || UNITS.latin;
const trim = (n) => String(+n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0));
const grouped = (n) => Math.round(n).toLocaleString("en-US");

/**
 * Money parts for the hero figure: { cur: "$", num: "3,600" | "3.6", unit: "" | "万" | "K" }.
 * Below 10,000 the full grouped figure ($3,600, $360, $3.6); from 10,000 the locale's unit ($3.6万, $36K).
 */
export function heroMoneyParts(value, locale) {
  if (!Number.isFinite(value) || value < 0) return null;
  if (value < 1e4) return { cur: "$", num: value < 100 ? trim(value) : grouped(value), unit: "" };
  for (const [size, unit] of unitsFor(locale)) if (value >= size) return { cur: "$", num: trim(value / size), unit };
  return { cur: "$", num: grouped(value), unit: "" };
}

export const heroMoneyText = (value, locale) => {
  const p = heroMoneyParts(value, locale);
  return p ? `${p.cur}${p.num}${p.unit}` : "";
};

/** Tick label without the asset: "1000万", "10M". */
export function heroVolumeShort(volume, locale) {
  for (const [size, u] of unitsFor(locale)) if (volume >= size) return `${trim(volume / size)}${u}`;
  return grouped(volume);
}

/** "1000万U" (zh), "1000万 USDT" (ja), "1000만 USDT" (ko), "$10M" (Latin and RTL scripts: USDT ≈ USD, shorter line). */
export function heroVolumeText(volume, locale) {
  let num = grouped(volume), unit = "";
  for (const [size, u] of unitsFor(locale)) if (volume >= size) { num = trim(volume / size); unit = u; break; }
  if (locale === "zh-Hans" || locale === "zh-Hant") return `${num}${unit}U`;
  return locale === "ja" || locale === "ko" ? `${num}${unit} USDT` : `$${num}${unit}`;
}

/** Width of the figure in em, for the CSS fit rule (digits .6, separators .3, currency .5, CJK unit .56, Latin .62). */
export function heroMoneyWidthEm(parts) {
  if (!parts) return 2;
  const digits = [...parts.num].reduce((sum, ch) => sum + (/[0-9]/.test(ch) ? 0.6 : 0.3), 0);
  const unit = !parts.unit ? 0 : /[A-Z]/.test(parts.unit) ? 0.4 : 0.56;
  return +(0.5 + digits + unit).toFixed(2);
}

// The live sentence, line 1 and line 2 (the figure follows); `screen`, `fee`, `back` label the desktop device screen. {vol} and {venue} are filled at render; "auto" lines are
// used only for venues the exchange settles automatically (HOME_AUTO_SETTLE).
export const HERO_SAY = Object.freeze({
  "zh-Hans": { l1: "交易 {vol}，", auto: "{venue} 自动返还你", manual: "{venue} 返还你", label: "交易量", screen: "交易 {vol} · 各交易所返还", fee: "手续费", back: "返还给你" },
  "zh-Hant": { l1: "交易 {vol}，", auto: "{venue} 自動返還你", manual: "{venue} 返還你", label: "交易量", screen: "交易 {vol} · 各交易所返還", fee: "手續費", back: "返還給你" },
  en: { l1: "Trade {vol} on {venue},", auto: "get back automatically", manual: "get back", label: "Trading volume", screen: "Trade {vol} · rebate by exchange", fee: "Fees", back: "Back to you" },
  es: { l1: "Opera {vol} en {venue}", auto: "y recupera automáticamente", manual: "y recupera", label: "Volumen de trading", screen: "Opera {vol} · reembolso por plataforma", fee: "Comisiones", back: "Te vuelve" },
  "pt-BR": { l1: "Negocie {vol} na {venue}", auto: "e receba de volta, automático", manual: "e receba de volta", label: "Volume negociado", screen: "Negocie {vol} · cashback por corretora", fee: "Taxas", back: "Volta para você" },
  fr: { l1: "Tradez {vol} sur {venue},", auto: "récupérez automatiquement", manual: "récupérez", label: "Volume de trading", screen: "Tradez {vol} · remise par plateforme", fee: "Frais", back: "Pour vous" },
  de: { l1: "{vol} auf {venue} handeln,", auto: "automatisch zurückerhalten", manual: "zurückerhalten", label: "Handelsvolumen", screen: "{vol} handeln · Rückvergütung je Börse", fee: "Gebühren", back: "Zurück an Sie" },
  it: { l1: "Fai {vol} di volume su {venue},", auto: "ti torna in automatico", manual: "ti torna", label: "Volume di trading", screen: "{vol} di volume · rimborso per piattaforma", fee: "Commissioni", back: "Ti torna" },
  ja: { l1: "{vol} の取引で、", auto: "{venue} から自動で還元", manual: "{venue} から還元", label: "取引量", screen: "{vol} の取引 · 取引所別の還元", fee: "手数料", back: "還元額" },
  ko: { l1: "{vol} 거래하면", auto: "{venue}에서 자동 환급", manual: "{venue}에서 환급", label: "거래량", screen: "{vol} 거래 · 거래소별 환급", fee: "수수료", back: "환급액" },
  ru: { l1: "Объём {vol} на {venue} —", auto: "автоматически вернётся", manual: "вернётся", label: "Объём торгов", screen: "Объём {vol} · возврат по биржам", fee: "Комиссии", back: "Вернётся вам" },
  tr: { l1: "{venue} üzerinde {vol} işlem,", auto: "otomatik geri alın", manual: "geri alın", label: "İşlem hacmi", screen: "{vol} işlem · borsaya göre iade", fee: "Ücretler", back: "Size dönen" },
  id: { l1: "Trading {vol} di {venue},", auto: "otomatis kembali ke Anda", manual: "kembali ke Anda", label: "Volume trading", screen: "Trading {vol} · rebate per bursa", fee: "Biaya", back: "Kembali ke Anda" },
  vi: { l1: "Giao dịch {vol} trên {venue},", auto: "tự động hoàn lại cho bạn", manual: "hoàn lại cho bạn", label: "Khối lượng giao dịch", screen: "Giao dịch {vol} · hoàn phí theo sàn", fee: "Phí", back: "Hoàn cho bạn" },
  ar: { l1: "تداول {vol} على {venue}،", auto: "يعود إليك تلقائيًا", manual: "يعود إليك", label: "حجم التداول", screen: "تداول {vol} · الاسترداد حسب المنصة", fee: "الرسوم", back: "يعود إليك" },
  ur: { l1: "{venue} پر {vol} ٹریڈ کریں،", auto: "خودکار طور پر واپس پائیں", manual: "واپس پائیں", label: "ٹریڈنگ حجم", screen: "{vol} ٹریڈ · ایکسچینج کے لحاظ سے واپسی", fee: "فیس", back: "آپ کو واپس" },
  uk: { l1: "Обсяг {vol} на {venue} —", auto: "автоматично повернеться", manual: "повернеться", label: "Обсяг торгів", screen: "Обсяг {vol} · повернення за біржами", fee: "Комісії", back: "Повернеться вам" },
});

export function heroSay(locale) {
  const raw = String(locale || "en");
  return HERO_SAY[raw] || HERO_SAY[raw.split("-")[0]] || HERO_SAY.en;
}

/** The sentence as two lines of tokens: plain strings, or "{vol}" / "{venue}" markers the caller renders as elements. */
export function heroSayTokens(locale, auto) {
  const s = heroSay(locale);
  const split = (text) => text.split(/(\{vol\}|\{venue\})/).filter(Boolean);
  return [split(s.l1), split(auto ? s.auto : s.manual)];
}

/** Text between the two lines: nothing after CJK punctuation, a space otherwise (the h1 renders it before its <br>). */
export const heroLineGap = (line) => (/[，、。：]$/.test(String(line[line.length - 1] || "")) ? "" : " ");

/** Plain-text sentence (tests, aria): "交易 1000万U，Bitget 自动返还你". */
export function heroSayText(locale, { vol, venue, auto }) {
  const fill = (part) => (part === "{vol}" ? vol : part === "{venue}" ? venue : part);
  const [l1, l2] = heroSayTokens(locale, auto);
  return `${l1.map(fill).join("")}${heroLineGap(l1)}${l2.map(fill).join("")}`;
}

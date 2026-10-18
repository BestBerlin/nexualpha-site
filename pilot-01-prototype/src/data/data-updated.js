// Visible data freshness stamp (freshness pass 2026-10-18): "Data updated YYYY-MM-DD HH:mm SGT" in every shipped locale.
// Live data passes the feed's own update time; data that is reviewed by hand passes its review date and prints the date
// only — a review date is never dressed up as a live clock. Times are Singapore Time (local-time.js SITE_TIME_ZONE).
import { formatSgt, readerDayKey } from "./local-time.js";

const LABEL = Object.freeze({
  en: "Data updated", "zh-Hans": "数据更新于", "zh-Hant": "資料更新於", es: "Datos actualizados el", "pt-BR": "Dados atualizados em",
  fr: "Données mises à jour le", de: "Daten aktualisiert am", it: "Dati aggiornati il", ja: "データ更新", ko: "데이터 업데이트",
  ru: "Данные обновлены", tr: "Veriler güncellendi", id: "Data diperbarui", vi: "Dữ liệu cập nhật", ar: "تحديث البيانات",
  ur: "ڈیٹا اپ ڈیٹ", uk: "Дані оновлено",
});
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function labelFor(locale) {
  const raw = String(locale || "en");
  if (LABEL[raw]) return LABEL[raw];
  if (/^zh-(hant|tw|hk|mo)/i.test(raw)) return LABEL["zh-Hant"];
  if (/^zh/i.test(raw)) return LABEL["zh-Hans"];
  if (/^pt/i.test(raw)) return LABEL["pt-BR"];
  return LABEL[raw.split(/[-_]/)[0]] || LABEL.en;
}

/** { text, dateTime } or null. `at` is an ISO timestamp (live data) or a YYYY-MM-DD review date (static data). */
export function dataUpdatedStamp(at, locale = "en") {
  if (!at) return null;
  const value = String(at);
  if (DAY.test(value)) return { text: `${labelFor(locale)} ${value} SGT`, dateTime: value, dateOnly: true };
  const day = readerDayKey(value);
  if (!day) return null;
  const clock = formatSgt(value, "en-GB", "clock");
  return { text: `${labelFor(locale)} ${day} ${clock}`, dateTime: new Date(value).toISOString(), dateOnly: false };
}

/** Latest of several dates/timestamps (ISO strings compare correctly once normalised to ISO). */
export function latestDate(...values) {
  const iso = values.flat().filter(Boolean).map((value) => (DAY.test(String(value)) ? String(value) : new Date(value).toISOString())).filter((value) => !value.startsWith("Invalid"));
  return iso.sort().at(-1) || null;
}

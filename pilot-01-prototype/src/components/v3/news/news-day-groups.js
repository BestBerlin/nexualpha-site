// News index day groups (editorial templates, 2026-10-11): rows grouped by their UTC publication day. Pure and
// deterministic, so the server render and the first client render are identical; "Today" / "Yesterday" are applied
// only after mount (the server never guesses the reader's clock).

const DAY = 86_400_000;
export const utcDay = (iso) => {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : "";
};

/** Consecutive rows that share a UTC day form one group; the feed order (newest first) is preserved. */
export function groupNewsByDay(rows = []) {
  const groups = [];
  for (const row of rows) {
    const day = utcDay(row?.publishedAt) || "undated";
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.rows.push(row);
    else groups.push({ day, rows: [row] });
  }
  return groups;
}

/** "today" | "yesterday" | null for a group day, given the reader's clock (null before mount). */
export function relativeDay(day, nowMs) {
  if (!nowMs || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const today = new Date(nowMs).toISOString().slice(0, 10);
  if (day === today) return "today";
  if (day === new Date(nowMs - DAY).toISOString().slice(0, 10)) return "yesterday";
  return null;
}

export const NEWS_DAY_COPY = {
  en: { latest: "Latest", today: "Today", yesterday: "Yesterday", stories: (n) => `${n} ${n === 1 ? "story" : "stories"}` },
  "zh-Hans": { latest: "最新", today: "今天", yesterday: "昨天", stories: (n) => `${n} 篇` },
  "zh-Hant": { latest: "最新", today: "今天", yesterday: "昨天", stories: (n) => `${n} 篇` },
  es: { latest: "Lo último", today: "Hoy", yesterday: "Ayer", stories: (n) => `${n} ${n === 1 ? "artículo" : "artículos"}` },
  "pt-BR": { latest: "Mais recente", today: "Hoje", yesterday: "Ontem", stories: (n) => `${n} ${n === 1 ? "artigo" : "artigos"}` },
  fr: { latest: "À la une", today: "Aujourd’hui", yesterday: "Hier", stories: (n) => `${n} ${n === 1 ? "article" : "articles"}` },
  de: { latest: "Neueste Meldung", today: "Heute", yesterday: "Gestern", stories: (n) => `${n} ${n === 1 ? "Beitrag" : "Beiträge"}` },
  it: { latest: "Ultima ora", today: "Oggi", yesterday: "Ieri", stories: (n) => `${n} ${n === 1 ? "articolo" : "articoli"}` },
  ja: { latest: "最新", today: "今日", yesterday: "昨日", stories: (n) => `${n} 件` },
  ko: { latest: "최신", today: "오늘", yesterday: "어제", stories: (n) => `${n}건` },
  ru: { latest: "Главное", today: "Сегодня", yesterday: "Вчера", stories: (n) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? "статья" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "статьи" : "статей"}` },
  tr: { latest: "Son haber", today: "Bugün", yesterday: "Dün", stories: (n) => `${n} haber` },
  id: { latest: "Terbaru", today: "Hari ini", yesterday: "Kemarin", stories: (n) => `${n} artikel` },
  vi: { latest: "Mới nhất", today: "Hôm nay", yesterday: "Hôm qua", stories: (n) => `${n} bài` },
  ar: { latest: "الأحدث", today: "اليوم", yesterday: "أمس", stories: (n) => `${n} ${n === 1 ? "مقال" : n === 2 ? "مقالان" : n <= 10 ? "مقالات" : "مقالًا"}` },
};
export const newsDayCopy = (locale) => NEWS_DAY_COPY[locale] || (String(locale || "").startsWith("zh") ? NEWS_DAY_COPY["zh-Hans"] : NEWS_DAY_COPY.en);

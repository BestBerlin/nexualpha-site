// Count phrases with CLDR plural categories (Intl.PluralRules) for the 15 UI locales (audit NX-07, 2026-10-11: the
// French venue page said "1 plateformes"). Each phrase lists the forms its language needs; "other" is the fallback.
const PLATFORM_COUNT = {
  en: { one: "{n} platform", other: "{n} platforms" },
  "zh-Hans": { other: "{n} 家平台" },
  "zh-Hant": { other: "{n} 家平台" },
  es: { one: "{n} plataforma", other: "{n} plataformas" },
  "pt-BR": { one: "{n} plataforma", other: "{n} plataformas" },
  fr: { one: "{n} plateforme", other: "{n} plateformes" },
  de: { one: "{n} Plattform", other: "{n} Plattformen" },
  it: { one: "{n} piattaforma", other: "{n} piattaforme" },
  ja: { other: "{n} 件のプラットフォーム" },
  ko: { other: "{n}개 플랫폼" },
  ru: { one: "{n} платформа", few: "{n} платформы", many: "{n} платформ", other: "{n} платформы" },
  tr: { other: "{n} platform" },
  id: { other: "{n} platform" },
  vi: { other: "{n} nền tảng" },
  // l10n: needs native review
  ur: { one: "{n} پلیٹ فارم", other: "{n} پلیٹ فارم" },
  // l10n: needs native review
  uk: { one: "{n} платформа", few: "{n} платформи", many: "{n} платформ", other: "{n} платформи" },
  ar: { zero: "لا توجد منصات", one: "منصة واحدة", two: "منصتان", few: "{n} منصات", many: "{n} منصة", other: "{n} منصة" },
};

const SHOW_MORE_PLATFORMS = {
  en: { one: "Show {n} more platform", other: "Show {n} more platforms" },
  "zh-Hans": { other: "展开其余 {n} 个平台" },
  "zh-Hant": { other: "展開其餘 {n} 個平台" },
  es: { one: "Mostrar {n} plataforma más", other: "Mostrar {n} plataformas más" },
  "pt-BR": { one: "Mostrar mais {n} plataforma", other: "Mostrar mais {n} plataformas" },
  fr: { one: "Afficher {n} autre plateforme", other: "Afficher {n} autres plateformes" },
  de: { one: "{n} weitere Plattform anzeigen", other: "{n} weitere Plattformen anzeigen" },
  it: { one: "Mostra {n} altra piattaforma", other: "Mostra altre {n} piattaforme" },
  ja: { other: "他 {n} 件のプラットフォームを表示" },
  ko: { other: "플랫폼 {n}개 더 보기" },
  ru: { one: "Показать ещё {n} платформу", few: "Показать ещё {n} платформы", many: "Показать ещё {n} платформ", other: "Показать ещё {n} платформы" },
  tr: { other: "{n} platform daha göster" },
  id: { other: "Tampilkan {n} platform lagi" },
  vi: { other: "Hiện thêm {n} nền tảng" },
  // l10n: needs native review
  ur: { one: "مزید {n} پلیٹ فارم دکھائیں", other: "مزید {n} پلیٹ فارم دکھائیں" },
  // l10n: needs native review
  uk: { one: "Показати ще {n} платформу", few: "Показати ще {n} платформи", many: "Показати ще {n} платформ", other: "Показати ще {n} платформи" },
  ar: { one: "عرض منصة أخرى", two: "عرض منصتين أخريين", few: "عرض {n} منصات أخرى", many: "عرض {n} منصة أخرى", other: "عرض {n} منصة أخرى" },
};

const SHOW_FEWER_PLATFORMS = {
  // l10n: needs native review
  ur: "کم پلیٹ فارم دکھائیں",
  // l10n: needs native review
  uk: "Показати менше платформ",
  en: "Show fewer platforms", "zh-Hans": "收起平台", "zh-Hant": "收起平台", es: "Mostrar menos plataformas", "pt-BR": "Mostrar menos plataformas",
  fr: "Afficher moins de plateformes", de: "Weniger Plattformen anzeigen", it: "Mostra meno piattaforme", ja: "表示を減らす", ko: "간단히 보기",
  ru: "Свернуть список", tr: "Daha az göster", id: "Tampilkan lebih sedikit", vi: "Thu gọn", ar: "عرض عدد أقل",
};

export const PLURAL_COPY_LOCALES = Object.freeze(Object.keys(PLATFORM_COUNT));

function copyLocale(locale) {
  const raw = String(locale || "en");
  if (PLATFORM_COUNT[raw]) return raw;
  if (raw === "zh-TW" || raw === "zh-HK") return "zh-Hant";
  if (raw.startsWith("zh")) return "zh-Hans";
  if (raw.startsWith("pt")) return "pt-BR";
  const language = raw.split("-")[0];
  return PLATFORM_COUNT[language] ? language : "en";
}

/** Picks the CLDR plural form of `forms` for `count` in `locale` and fills {n}. */
export function pluralPhrase(forms, count, locale = "en") {
  const code = copyLocale(locale);
  const table = forms[code] || forms.en;
  let category = "other";
  try { category = new Intl.PluralRules(code).select(Number(count)); } catch { /* keep "other" */ }
  const template = table[category] ?? table.other;
  return template.replace("{n}", String(count));
}

export const platformCount = (count, locale = "en") => pluralPhrase(PLATFORM_COUNT, count, locale);
export const showMorePlatforms = (count, locale = "en") => pluralPhrase(SHOW_MORE_PLATFORMS, count, locale);
export const showFewerPlatforms = (locale = "en") => SHOW_FEWER_PLATFORMS[copyLocale(locale)];

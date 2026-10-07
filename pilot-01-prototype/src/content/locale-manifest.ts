export type LocaleCode =
  | "en" | "zh-Hans" | "zh-Hant" | "es" | "pt-BR" | "fr" | "de"
  | "ja" | "ko" | "ar" | "tr" | "ru" | "id" | "vi" | "it";

// Retained for the legacy source modules' type-checking only. The V2 runtime
// uses Paraglide messages and must not import historical presentation copy.
export interface LocaleContent {
  code: LocaleCode;
  language: string;
  direction: "ltr" | "rtl";
  reviewStatus: "draft-review" | "reviewed";
  qaStatus: "agent-linguistic-qa-complete";
  qaNotes: string;
  navigation: { signals: string; exchanges: string; compare: string; listings: string; verificationPolicy: string };
  hero: { title: string; subtitle: string; searchPlaceholder: string; searchCta: string; compareCta: string };
  event: { liveListing: string; tradingOpens: string; availableIn: string; officialSource: string; conditionsCta: string };
  comparison: { title: string; bestFor: string; region: string; available: string; checkTerms: string; compareVenues: string };
}

export interface LocaleManifestEntry { language: string; direction: "ltr" | "rtl"; }

export const localeManifest: Record<LocaleCode, LocaleManifestEntry> = {
  en: { language: "English", direction: "ltr" },
  "zh-Hans": { language: "简体中文", direction: "ltr" },
  "zh-Hant": { language: "繁體中文", direction: "ltr" },
  es: { language: "Español", direction: "ltr" },
  "pt-BR": { language: "Português (Brasil)", direction: "ltr" },
  fr: { language: "Français", direction: "ltr" },
  de: { language: "Deutsch", direction: "ltr" },
  ja: { language: "日本語", direction: "ltr" },
  ko: { language: "한국어", direction: "ltr" },
  ar: { language: "العربية", direction: "rtl" },
  tr: { language: "Türkçe", direction: "ltr" },
  ru: { language: "Русский", direction: "ltr" },
  id: { language: "Bahasa Indonesia", direction: "ltr" },
  vi: { language: "Tiếng Việt", direction: "ltr" },
  it: { language: "Italiano", direction: "ltr" },
};

export const supportedLocales = Object.keys(localeManifest) as LocaleCode[];

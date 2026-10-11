// Which venue pairs have a published /compare/{a}-vs-{b} page.
// HTX, HashKey and Aevo are Factbook-only records: they have no venue profile and
// every compare route that names them 404s (or redirects away). This mirrors
// FACTBOOK_ONLY_LEGACY_SLUGS in scripts/generate-prerender-manifest.mjs and
// factbookOnlyDecisionSlugs in FactbookPage.jsx.
import { canonicalComparePairSlug } from "../../data/compare-slug.js";

export const NO_COMPARE_ROUTE = new Set(["htx", "hashkey", "aevo"]);

export const hasCompareRoute = (slug) => Boolean(slug) && !NO_COMPARE_ROUTE.has(slug);

export function comparePairHasRoute(slugs = []) {
  return slugs.length >= 2 && new Set(slugs).size === slugs.length && slugs.every(hasCompareRoute);
}

// Path (unlocalized, no query) for a selection: the compare page when it exists,
// otherwise the Factbook record of the first venue without a compare page.
export function comparePathFor(slugs = []) {
  // Two-venue selections open the canonical slug (curated order or alphabetical) so the handoff never hits the 301.
  if (comparePairHasRoute(slugs)) return { path: `/compare/${canonicalComparePairSlug(slugs)}`, fallback: false };
  const orphan = slugs.find((slug) => !hasCompareRoute(slug));
  return { path: orphan ? `/factbook/${orphan}` : "/exchanges", fallback: true };
}

const NO_COMPARE_COPY = {
  en: "No comparison page yet", "zh-Hans": "暂无对比页", "zh-Hant": "暫無比較頁", ja: "比較ページなし", ko: "비교 페이지 없음",
  tr: "Karşılaştırma sayfası yok", es: "Sin página de comparación", "pt-BR": "Sem página de comparação", fr: "Pas de page de comparaison",
  de: "Keine Vergleichsseite", ru: "Нет страницы сравнения", ar: "لا توجد صفحة مقارنة", id: "Belum ada halaman perbandingan",
  vi: "Chưa có trang so sánh", it: "Nessuna pagina di confronto",

 // l10n: needs native review
 ur: "ابھی موازنہ کا صفحہ نہیں",
 // l10n: needs native review
 uk: "Сторінки порівняння ще немає",
};
export function noCompareLabel(locale = "en") {
  const l = String(locale || "en");
  return NO_COMPARE_COPY[l] || NO_COMPARE_COPY[l === "zh-CN" ? "zh-Hans" : l === "zh-TW" ? "zh-Hant" : l.split("-")[0]] || NO_COMPARE_COPY.en;
}

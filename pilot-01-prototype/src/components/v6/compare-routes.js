// Which venue pairs have a published /compare/{a}-vs-{b} page.
// HTX, HashKey and Aevo are Factbook-only records: they have no venue profile and
// every compare route that names them 404s (or redirects away). This mirrors
// FACTBOOK_ONLY_LEGACY_SLUGS in scripts/generate-prerender-manifest.mjs and
// factbookOnlyDecisionSlugs in FactbookPage.jsx.
export const NO_COMPARE_ROUTE = new Set(["htx", "hashkey", "aevo"]);

export const hasCompareRoute = (slug) => Boolean(slug) && !NO_COMPARE_ROUTE.has(slug);

export function comparePairHasRoute(slugs = []) {
  return slugs.length >= 2 && new Set(slugs).size === slugs.length && slugs.every(hasCompareRoute);
}

// Path (unlocalized, no query) for a selection: the compare page when it exists,
// otherwise the Factbook record of the first venue without a compare page.
export function comparePathFor(slugs = []) {
  if (comparePairHasRoute(slugs)) return { path: `/compare/${slugs.join("-vs-")}`, fallback: false };
  const orphan = slugs.find((slug) => !hasCompareRoute(slug));
  return { path: orphan ? `/factbook/${orphan}` : "/exchanges", fallback: true };
}

const NO_COMPARE_COPY = {
  en: "No comparison page yet. See its Factbook record",
  "zh-Hans": "暂无对比页面，请查看其资料档案",
  "zh-Hant": "暫無比較頁面，請查看其資料檔案",
  ja: "比較ページはまだありません。ファクトブックをご覧ください",
  ko: "아직 비교 페이지가 없습니다. 팩트북을 확인하세요",
  tr: "Henüz karşılaştırma sayfası yok. Factbook kaydına bakın",
  es: "Aún no hay página de comparación. Consulta su ficha Factbook",
  "pt-BR": "Ainda sem página de comparação. Veja a ficha no Factbook",
  fr: "Pas encore de page de comparaison. Consultez sa fiche Factbook",
  de: "Noch keine Vergleichsseite. Siehe Factbook-Eintrag",
  ru: "Страницы сравнения пока нет. См. запись в Factbook",
  ar: "لا توجد صفحة مقارنة بعد. راجع سجل Factbook",
  id: "Belum ada halaman perbandingan. Lihat catatan Factbook",
  vi: "Chưa có trang so sánh. Xem hồ sơ Factbook",
  it: "Nessuna pagina di confronto per ora. Vedi la scheda Factbook",
};
export function noCompareLabel(locale = "en") {
  const l = String(locale || "en");
  return NO_COMPARE_COPY[l] || NO_COMPARE_COPY[l === "zh-CN" ? "zh-Hans" : l === "zh-TW" ? "zh-Hant" : l.split("-")[0]] || NO_COMPARE_COPY.en;
}

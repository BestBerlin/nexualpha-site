// Group by actual static consumers, rather than the order Rollup visits manual
// chunks. CSS retains its existing manual names and cascade in vite.config.mjs.
const ROOTS = [
  ["/src/main.jsx", "core-shared"],
  ["/src/components/v3/VenueDetailPage.jsx", "route-v3-venue-main"],
  ["/src/components/v3/V3Pages.jsx", "route-v3-pages-main"],
  ["/src/components/v3/news/NewsDetailPage.jsx", "route-news-detail-main"],
  ["/src/components/data/FundingRatesPage.jsx", "route-data-funding"],
];

export function createRouteJsChunks() {
  let owners;
  return {
    reset() { owners = null; },
    chunk(id, { getModuleIds, getModuleInfo }) {
      if (!getModuleIds || /\.css(?:\?|$)/.test(id)) return null;
      if (!owners) {
        owners = new Map();
        const ids = [...getModuleIds()];
        ROOTS.forEach(([suffix], index) => {
          const root = ids.find((candidate) => candidate.endsWith(suffix));
          const visited = new Set();
          const visit = (moduleId) => {
            if (visited.has(moduleId) || /\.css(?:\?|$)/.test(moduleId)) return;
            visited.add(moduleId);
            owners.set(moduleId, (owners.get(moduleId) || 0) | (1 << index));
            for (const dependency of getModuleInfo(moduleId)?.importedIds || []) visit(dependency);
          };
          if (root) visit(root);
        });
      }
      const mask = owners.get(id);
      if (!mask || !id.includes("/src/")) return null;
      // Keep the route loader table in the browser entry for the hydration
      // preloader and its graph regression tests.
      if (id.endsWith("/src/main.jsx") || id.endsWith("/src/App.jsx")) return null;
      if (mask & 1) return "core-shared";
      const root = ROOTS.find(([suffix], index) => index > 0 && id.endsWith(suffix));
      return root?.[1] || `shared-route-${mask}`;
    },
  };
}

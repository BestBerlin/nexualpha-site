const YELLOW_PAGES_URL_KEYS = ["category", "filters", "sort", "query", "selection", "account_stage"];
const CATEGORY_VALUES = new Set(["all", "CEX", "DEX", "Perp DEX"]);
const FILTER_KEYS = ["noKyc", "por", "fiat", "highLev"];
const SORT_VALUES = new Set(["default", "fee", "rebate"]);
const ACCOUNT_STAGE_VALUES = new Set(["new_account", "another_platform", "existing_account"]);

export const emptyYellowPagesFilters = () => ({ noKyc: false, por: false, fiat: false, highLev: false });

export function normalizeYellowPagesQuery(value) {
  return String(value || "").replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 80);
}

function venueSlugSet(venues = []) {
  return new Set(venues.map((venue) => venue.slug));
}

export function restoreYellowPagesStateFromUrl(search = "", { venues = [], defaultCategory = "all" } = {}) {
  const params = new URLSearchParams(search || "");
  const category = CATEGORY_VALUES.has(params.get("category")) ? params.get("category") : defaultCategory;
  const filters = emptyYellowPagesFilters();
  const requestedFilters = String(params.get("filters") || "").split(",").map((item) => item.trim()).filter(Boolean);
  for (const key of requestedFilters) {
    if (FILTER_KEYS.includes(key)) filters[key] = true;
  }
  const sort = SORT_VALUES.has(params.get("sort")) ? params.get("sort") : "default";
  const query = normalizeYellowPagesQuery(params.get("query"));
  const availableSlugs = venueSlugSet(venues);
  const selection = String(params.get("selection") || "")
    .split(",")
    .map((slug) => slug.trim())
    .filter((slug, index, all) => slug && availableSlugs.has(slug) && all.indexOf(slug) === index)
    .slice(0, 2);
  const accountStage = ACCOUNT_STAGE_VALUES.has(params.get("account_stage")) ? params.get("account_stage") : null;
  return { category, filters, sort, query, selection, accountStage };
}

export function appendYellowPagesParams(params, { category, filters, sort, query, selection, accountStage, defaultCategory }) {
  if (category && category !== defaultCategory) params.set("category", category);
  const activeFilters = FILTER_KEYS.filter((key) => filters?.[key]);
  if (activeFilters.length) params.set("filters", activeFilters.join(","));
  if (sort && sort !== "default") params.set("sort", sort);
  const normalizedQuery = normalizeYellowPagesQuery(query);
  if (normalizedQuery) params.set("query", normalizedQuery);
  const selected = Array.isArray(selection) ? selection.filter(Boolean).slice(0, 2) : [];
  if (selected.length) params.set("selection", selected.join(","));
  if (ACCOUNT_STAGE_VALUES.has(accountStage)) params.set("account_stage", accountStage);
}

export function writeYellowPagesStateToUrl(href, state) {
  const url = new URL(href, typeof window !== "undefined" ? window.location.origin : "https://nexualpha.local");
  for (const key of YELLOW_PAGES_URL_KEYS) url.searchParams.delete(key);
  appendYellowPagesParams(url.searchParams, state);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function appendAccountStageToSearch(search, accountStage) {
  const params = new URLSearchParams(search || "");
  if (ACCOUNT_STAGE_VALUES.has(accountStage)) params.set("account_stage", accountStage);
  return params.toString();
}

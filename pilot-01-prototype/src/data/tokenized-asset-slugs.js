// Tokenized-asset cluster slugs for route matching in the app shell. Mirrors Object.keys(TOKENIZED_ASSET_PAGES) in
// tokenized-assets-cluster.js (guarded by tests/perf-core-bundle.test.mjs) so App.jsx does not ship the cluster copy
// on every page (perf lane 2026-10-11). Add a slug here when a page is added there.
export const TOKENIZED_ASSET_SLUGS = Object.freeze(["tokenized-assets", "tokenized-treasuries", "tokenized-stocks-vs-perpetuals"]);

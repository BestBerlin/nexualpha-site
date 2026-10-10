// Topic guide slugs for route matching in the app shell. Mirrors Object.keys(TOPIC_GUIDES) in topic-guides-data.js
// (guarded by tests/perf-core-bundle.test.mjs) so App.jsx does not ship the whole guide text set on every page
// (perf lane 2026-10-11). Add a slug here when a guide is added there.
export const TOPIC_SLUGS = Object.freeze(["meme-coins", "derivatives", "compliant-exchanges", "no-kyc"]);

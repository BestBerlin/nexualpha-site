# Venue JavaScript loading plan

Scope: change client chunk ownership and locale loading for venue, compare,
article and funding pages. Keep the SSR tree, public facts, CTA policy, styling
and interactions intact. Do not add dependencies.

1. Capture the unchanged client entry/route static closures, gzip each file at
   level 6, and run venue-graph, compare, news and funding regressions.
2. Stop manual chunks from absorbing unassigned dependencies; separate shared
   helpers and route-specific modules. Preserve the existing stylesheet names
   and cascade and the venue research interaction gate.
3. Ship locale copy on demand, preserving synchronous SSR and fallbacks. Defer
   only sections whose complete SSR content can remain behind Suspense gates.
4. Compare the same route closures before/after, including the locale payload.
   Require at least 40% fewer JavaScript gzip bytes and requests for each target.
   Pin the exact baseline news article. Compare SSR root hashes, stylesheet
   content/cascade, emitted static chunk cycles and runtime initialization.
5. Run the build, strict budget, targeted regressions and typecheck. Restore
   generated public data before committing. Report validation gaps explicitly.

Initial regressions: `node --test tests/venue-graph.test.mjs
tests/compare-any.test.mjs tests/news-library.test.mjs
tests/funding-rates.test.mjs` — 30 passed, 0 failed.

The measurement describes offline initial hydration dependencies, not observed
production transfer, interaction latency or search-engine indexing.

Independent review identified CSS imports that could create chunk cycles when
CSS and an isolated JS entry shared a manual name. JavaScript route roots now
have distinct names; stylesheet names retain their original cascade slots.
The SSR-only SEO guard runs before all client chunk assignment.

Locale preparation runs before dynamic chunk evaluation using the emitted
static chunk graph, including manually merged routes. It uses promises rather
than top-level await, retaining Vite's original browser target. Home's static
entry does not load the copy runtime or packs. Failed pack requests can retry.
Cross-language history entries use a full document navigation, matching the
existing language menu, so module-level copy is initialized for that edition.

Regression coverage evaluates the actual emitted bootstrap and glob loaders
without manually preloading copy, and audits every emitted dynamic dependency
that reaches the copy runtime. This closes the merged-chunk first-visit case
identified by independent review.

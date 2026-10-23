# Route JavaScript loading evidence

Baseline: `ab3f70dd` on `codex/venue-js-diet`, rebuilt locally before source
changes. The numbers in the task brief came from another build; this comparison
uses the same local toolchain, compression and route selection on both sides.
The complete per-file inventories are in `venue-js-diet-before.json` and
`venue-js-diet-after.json`. KiB means 1,024 bytes.

| Route | JS requests before → after | Fewer requests | Gzip KiB before → after | Less gzip |
| --- | ---: | ---: | ---: | ---: |
| `/exchanges/bitget` | 50 → 15 | 70.0% | 1095.6 → 625.1 | 43.0% |
| `/news/api-failover-cancel-control-disclosure-radar` | 50 → 15 | 70.0% | 1124.4 → 516.3 | 54.1% |
| `/compare/binance-vs-okx` | 65 → 13 | 80.0% | 1707.1 → 792.1 | 53.6% |
| `/funding-rates` | 27 → 13 | 51.9% | 656.8 → 373.2 | 43.2% |

All four canonical English routes pass both 40% gates. Home is a control, with
five static JS requests and 317,220 gzip bytes, below the 350,000-byte
budget. Exact bytes and asset hashes in the after snapshot reflect the final
build ID and can vary slightly between builds.

## Why these graphs were large

Rollup's implicit manual-chunk dependency assignment and shared CSS/JS chunk
names made small shared imports pull unrelated routes into the static graph.
The compare route also re-exported activity pages. All-locale copy tables in
venue, news, funding and compare dependencies compounded the transfer cost.
The venue graph statically imported the Hyperliquid calculator even for Bitget.

The build now assigns target-route source modules by their actual static
consumers, uses explicit manual chunks, and separates JS names from existing
stylesheet names. Activity routes have their own loader. The Hyperliquid
calculator hydrates on disclosure interaction, retaining complete SSR content.
App-download data and copy share a data chunk, preventing a new page/data cycle
under explicit chunk ownership. The cycle audit covers the entire client graph.

A client-build-only transform extracts supported copy tables into locale
factory packs. It loads the requested edition and English fallback before
evaluating a dynamic chunk. Captured helpers remain local through getter
thunks; literal edition inheritance is flattened. Tables with eager value
enumeration, mutation or opaque constructors stay intact. The source facts,
copy and SSR modules are unchanged. Packs are grouped by locale, so a pack can
contain copy used by other routes; this is a bounded reduction, not complete
per-component copy sharding.

Preparation follows the **emitted chunk graph**, including manually merged
chunks. The bootstrap only registers a callback on home; it loads no runtime
or pack until needed. Runtime/pack imports are excluded from wrapping to prevent
recursion. Failed pack imports can retry. Promise chaining retains Vite's
original browser target without top-level await. Cross-language history entries
perform full document navigation, matching the existing language-menu behavior;
same-language history remains local.

The 135 original CSS source mappings retain identical output content hashes and
array order, recorded in `venue-js-diet-css-before.json`. Existing Worker CSS
allowlists and stylesheet cascade slots remain intact.

## Measurement and reproduction

Run from `pilot-01-prototype` with Node 24:

```sh
export PATH=/opt/homebrew/opt/node@24/bin:$PATH
npm run build
node scripts/verify-build-budget.mjs --strict
node scripts/measure-route-js.mjs --compare docs/venue-js-diet-before.json --output docs/venue-js-diet-after.json --strict
node scripts/verify-route-ssr-parity.mjs --baseline ab3f70dd
npm run typecheck
node --test tests/{venue-graph,r110-route-module-cache,r110-hydration-contract,news-library,news-feed,news-detail-copy-l10n,compare-any,compare-decision-ssr,compare-direct-answers,compare-faq-locales,funding-rates,funding-board-live,r101-hyperliquid-fee-scenario,activities-ssr,route-seo-payload,perf-home-budget,built-route-initialization,locale-copy-plugin,route-js-chunks,measure-route-js,dist-shell-contract,server-build-imports}.test.mjs
```

The measurement walks Vite manifest static imports from the browser entry and
`modulePathsForRoute` hydration roots, then includes mandatory locale packs and
their static dependencies. Source ownership comes from `style-modules.json`,
not chunk-name guesses. It counts each JS asset once and gzips each file at
level 6. Scroll/interaction imports remain excluded on both sides. The article
is pinned from the baseline and must still have a published English edition
with `seo.noindex === false`. Missing assets or either missed reduction fail
the strict gate.

SSR parity compares the original and current source renderers against identical
final assets and prerender state, both through the Worker and directly. Sixteen
cases cover four route types in English, Simplified Chinese, Italian and Arabic.
Only root HTML is compared; build assets/head identifiers naturally change.

The built-loader regression evaluates the actual emitted bootstrap and App
glob loaders in isolated DOM processes, without manually preparing packs. It
covers the four target module types and a manually merged alternatives route
in seven locales. A separate audit checks every emitted dynamic import whose
static closure needs copy. Source hydration regressions cover venue/home in
English, Italian and Arabic; factory-equivalence tests cover all 17 editions.

These are offline dependency estimates and local SSR/DOM checks. They do not
measure production request timing, lossy-link latency, scrolling waterfalls or
browser rendering. The lead's real-browser QA remains necessary before release.
The full site test suite was not run; the project directs bounded related tests.
No deployment, push, public-data update or CTA change is part of this work.

Final validation: full build and strict budget passed; the command above passed
159 tests with zero failures and zero skips. All 16 SSR cases passed, recorded
in `venue-js-diet-ssr-parity.json`. All client static chunks are cycle-free.
The build still reports SSR circular-chunk and large-chunk warnings;
these do not fail the build. No lint script is configured in this project.

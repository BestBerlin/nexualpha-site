# Inner visual v3 — local review evidence

Base: `36dadac6`, branch `codex/inner-visual-v3`. This is local evidence, not a deployment receipt.

## What changed

- Venue: the native referral definition list is an icon-led entry → code → settlement sequence. Existing code, partner-confirmed cadence, qualifications, later-add restrictions and dates remain helper-bound. A commission disclosure accompanies the benefit record. The audience panel retains the exact editorial summary; its feature chips are literal excerpts of that summary. Comparison cards reuse the footer's extracted paired-logo component and the same localized destinations.
- Compare: the four existing best-for verdicts have icons and winner logos. The original semantic table remains. Numeric values drive mirrored bars; maker and taker winners are evaluated separately with the existing region policy. Missing quantities stay missing. Boolean/category values remain chips. Dates, rules and sources remain in SSR and behind the original disclosure. Venue links reserve at least 44×44px.
- Articles: original category art and conditional numeric facts remain. Wide Markdown tables retain their headers and cells inside keyboard-focusable, horizontally scrolling panels. Authored resource lists, chronological neighbors, related research, partner links and topic/tool links have document or venue-logo cards. Labels, qualified text, link safety, tracking attributes and ordered-list starts are retained.

## Layout by breakpoint

| Width | Venue | Compare | Long article |
| --- | --- | --- | --- |
| 390 | Three stacked stages, connected on the inline-start edge; full-width benefit/exception records; wrapping feature chips; one comparison card per row. | Two-by-two verdict grid; two venue columns remain side by side; each row's label spans both columns; fee bars share a common axis. | Single-column resource cards; the 680px table scrolls within a 325px frame, without page overflow; numeric facts stack. |
| 768 | Three stages across; benefit and exception records span the flow; two comparison cards per row. | Two-by-two verdict grid; mirrored data cells and source disclosure retain their layout. | Two resource columns; the article expands its table frame to its available measure. |
| 1440 | Three stages in the reading column, existing registration rail beside it; audience and comparison cards follow below. | Four verdict cards across, full-width paired data rows. | Existing reading measure and sticky rail; tables scroll locally when their minimum width exceeds the reading measure. |
| 1728 | Same capped content/rail composition; extra viewport space stays outside the content. | Same four-card structure and two-sided bars. | Same capped reading measure and rail. |

English and Simplified Chinese were reviewed; Arabic comparison checks cover RTL at 390 and 1440. See `browser-metrics.json` and the named PNGs for exact geometry and observations.

## Reproduction and limits

All app commands run from `pilot-01-prototype/`, using Node 24:

```sh
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run build
PATH=/opt/homebrew/opt/node@24/bin:$PATH node scripts/verify-build-budget.mjs --strict
PATH=/opt/homebrew/opt/node@24/bin:$PATH node scripts/render-inner-visual-v3-evidence.mjs --browser-assets
python3 -m http.server 4179 --bind 127.0.0.1 --directory dist/client
```

The fresh worktree initially lacked ignored Inlang plugin caches and `.openai/hosting.json`. Existing local copies were reused; no dependency, secret or production configuration was changed or committed. The final normal build passes.

Node's normal preview server returned `listen EPERM`. Chrome therefore reviewed the exact built Worker SSR documents served through the available static preview, at their real route paths, with the built client scripts, fonts, images and CSS. This does not test the live Node server's APIs. The 11 archived `.html` documents are exact Worker responses and contain no added instrumentation. `--browser-assets` writes disposable copies into ignored `dist/client/`, adding a head-only PerformanceObserver to record CLS and source rectangles outside React's root. No product source or deployed page contains that observer.

Better Design principles/review-rules calls were attempted but timed out or returned an exhausted free-query quota. Comprehension passed its explanation/context checks and incorrectly treated the proper venue name “OKX” as an acronym requiring expansion; the existing brand name was preserved. Rendered spacing snapshots and actual completed spacing results are included. The capture script's HTML input/select constructor checks were adapted to tag names because Chrome's read-only evaluator does not expose those constructors.

The raw spacing check flags a deliberately hidden semantic “Dimension” header and the interior of a horizontally scrolled article table. Final visible-panel checks exclude those intentional cases, retain the outer scroll frame, and separately verify keyboard scrolling and page bounds. Existing off-scale spacing is reported as moderate, not hidden.

Raw-CDP permission for reduced-motion emulation was denied. It was not retried through another mechanism; reduced-motion support is verified through existing CSS and tests only.

Global CLS 0 is **not** claimed. Anchor-load observations include shifts in the unchanged shared header (`nx-brand`, `nx-nav`, related header controls); English article anchor loads also record the cluster-links container after its conversion to cards. The final browser metrics retain actual nonzero observations and source names. `shared-header-cls-observation.json` retains source rectangles from a repeat header observation. Review these against the lead's normal runtime before release; route-local source/hydration checks alone do not establish site-wide CLS 0.

Final results: 22 profiles, zero page overflow, minimum comparison-link width 44px; final-matrix max CLS 0.0373022222 and repeat article-anchor max 0.0451100194. The CLS-0 requirement remains unresolved. The local preview server was stopped and the browser viewport reset after QA. Git commit was blocked by the sandbox worktree index lock; see validation.md.

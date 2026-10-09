# v8 release blockers (2026-10-09)

Nothing below was deployed. Deploy rule (HANDOFF-LOCAL): only from `main` via `gh workflow run deploy.yml --ref main`, after owner approval.

## Needs an owner decision
| # | Item | Why it blocks | What is needed |
|---|---|---|---|
| 1 | Home headline "up to 50%" | Partner shares on the page are OKX 20 / Binance 20 / Bitget 30 / Bybit pending; the footer says 50% is the highest partner tier. HANDOFF requires written confirmation. | Written confirmation of the 50% tier, or a new number. Design capped the figure at 160px but did not change it. |
| 2 | Home H1 (SEO) | HANDOFF: owner sign-off on the new home H1 before any deploy. The H1 also ends "...up to" without the number. | Approve the H1 text (optionally move the figure into it). |
| 3 | 13 untranslated home locales | Non zh/en locales render the English home block (now marked `lang="en" dir="ltr"`). | Per-locale lead (rebate-first vs trust-first) and tier confirmation, then translation. |
| 4 | Missing evidence file | `tests/venue-decision-content.test.mjs` reads `docs/review-inputs/unpublished-campaign-research/recheck-5231-evidence-20260907.json`, present in the original repo but not in this copy. Copying "unpublished" research was blocked by the session's permission policy. | Owner copies the folder (or decides the test should not depend on it). |
| 5 | Folder is not a git checkout | Deploy runs from `main` of BestBerlin/nexualpha-site. This folder has no `.git`; changes are tracked in a side history at `/Volumes/致态2TB/.nexualpha-v7-history.git`. | Decide how these changes land on the real `v7-home` branch. |

## `npm test`: 57 failing, all pre-existing
Identical failure set before and after every v8 change (checked 5 times against the pre-change snapshot). Grouping:

| Group | Count | Nature | Suggested owner |
|---|---|---|---|
| Source-regex contract tests | 27 | Assert old component markup (e.g. `lean-hero__badge`, older compare/detail layouts) that later rounds replaced. | Engineering: update each assertion to the current component, keep the intent. |
| SSR / output drift | 23 | Rendered compare, detail, rates, bootstrap outputs differ from expectations (copy, order, FAQ sets). | Engineering + content review, case by case. |
| Fee data drift | 5 | Tests expect older reviewed fee records (e.g. Binance source `/fee/trading`, now `/fee/schedule`; Binance futures now "not yet checked"). | Fee data owner: confirm which record is true, then update data or test. Do not just edit tests to pass. |
| Environment | 2 | Missing evidence file (blocker 4); Sites packaging expects a full `npm run build` output. | Run the full build in CI, resolve blocker 4. |

Design work did not edit `src/data`, invite codes, registration URLs, `partner-registry` or `publicCtaForVenue` (0-line diff against the pre-change snapshot).

## Known remaining visual items
- Inner pages score 4-6 on motion and originality (news, activities, telegram): competent but generic.
- `/ar` profile `<title>` is English; inline arrows inside translated copy are not mirrored (needs copy edits).
- Profile hero logo for OKX is a white raster tile (needs a transparent official asset).
- Footer "事实库" link is 42x44 (shell).

# Rest R Test Hygiene Notes

## Changed files

| File | Change |
| --- | --- |
| `pilot-01-prototype/tests/r100-topic-faq-contract.test.mjs` | Class b: compare current topic SEO against the archived baseline with a narrow authorized transition for PR #58 brand-entity schema enrichment and the existing `budgetTitle` 60-display-title behavior. Old-shaped Research Desk source nodes remain under direct equality; enriched nodes assert exact `@id`, `url`, `parentOrganization`, and logo before normalization. |
| `pilot-01-prototype/tests/r101-hyperliquid-seo-preserve.test.mjs` | Class b: keep canonical/locale/status/alternate envelope checks and pin the exact current reviewed 15-locale Hyperliquid client/Worker SEO rows by SHA-256, while continuing to reject private/guaranteed commission claims. |
| `pilot-01-prototype/tests/r102-treasury-seo-preserve.test.mjs` | Class b: preserve the archived Treasury SEO baseline with the same narrow brand-entity/title-budget transition, and allow only the authorized current partner-registry hash while keeping archived evidence hashes explicit. |
| `pilot-01-prototype/tests/r106-mx-native-copy.test.mjs` | Class b: accept the current protected `partner-registry.js` hash from commit `84b6426` without changing partner data. |
| `pilot-01-prototype/tests/r108-treasury-news-handoff.test.mjs` | Class b: accept the same current protected `partner-registry.js` hash without changing protected commercial/source files. |
| `pilot-01-prototype/tests/r189-feed-contract.mjs` | Class b: pin the exact PR #76 repaired 416-article feed hash separately from the unchanged original accepted feed identity, while retaining manifest, receipt, ledger, article-count, and top-batch slug checks. |
| `pilot-01-prototype/tests/r189-presentation-contract.mjs` | Class b: model the approved compliant-topic transition where the old direct HashKey-vs-Kraken compare shortcut was removed, while HashKey and Telegram exits and the surrounding href order remain pinned. |
| `pilot-01-prototype/tests/r98-topic-truth-boundary.test.mjs` | Class b: update the `next-decision-bridge.js` hash to the current approved copy dictionary bytes; r98 still cannot load because the exact R128 presentation fixture is absent. |
| `pilot-01-prototype/tests/r95-telegram-review-index.test.mjs` | Class c: call the real production loader on a temporary root containing copied archived inputs and an explicitly synthetic lifecycle unit input; retain fail-closed and input immutability checks. Four tests pass. |

## Per-test table

| Test file / case | Class | Evidence / result |
| --- | --- | --- |
| `r100-topic-faq-contract` / `all sixty non-FAQ metadata contracts and all 51 outside-scope FAQ contracts preserve the frozen baseline` | b | Passed after a narrow normalizer that only maps exact PR #58 enriched brand nodes back to the archived shape and applies the real 60-display `budgetTitle` baseline behavior. |
| `r101-hyperliquid-seo-preserve` / `fee tool preserves exact serialized client and Worker SEO across all 15 owner locales` | b | Passed with exact current reviewed serialized rows pinned by SHA-256 `3430a238b702dfaaf2c779df828d243dde3bb2fe9f8a94aa3b13a0bb83be44d0` plus envelope/no-private-claim checks. |
| `r102-treasury-seo-preserve` / `Treasury checklist keeps serialized SEO for all 45 cluster locale routes` | b | Passed after the same exact brand-entity/title-budget transition handling. |
| `r102-treasury-seo-preserve` / `Treasury checklist preserves commercial files, newsfeed and original historical dataset bytes` | b | Passed with authorized current `partner-registry.js` hash and versioned feed contract retaining release manifest/receipt/ledger checks. |
| `r106-mx-native-copy` / `R106 protected commercial and source files remain immutable` | b | Passed with authorized current `partner-registry.js` hash `e53261a6e7e39e64bd35bbedda4ef4a36c1521521750a77eaff3d26c52925d69`. |
| `r108-treasury-news-handoff` / `R108 protected commercial and historical source files remain byte-stable` | b | Passed with the same authorized protected registry hash and current feed contract. |
| `r96-compliant-hant-render` / `all existing commercial, research and source hrefs survive unchanged` | b | Passed after preserving the approved removal of the old direct compare shortcut and asserting the remaining HashKey/Telegram research exits and surrounding href positions. |
| `r95-telegram-review-index` / module load and lifecycle claims | c | Real-loader temporary-root fixture repaired; all four lifecycle, fail-closed and immutability tests pass. |
| `r97-hant-render-parity` / module load | c blocker | Still fails because the exact historical R128 fixture is absent at `/Volumes/release-candidates/r128-home-mobile/candidate/src/components/v3/TopicGuidePage.jsx`. I searched git history and 122 `TopicGuidePage.jsx` files under `/Volumes/致态2TB`; no file matched the ledger's required R128 hash `828491938d1f6900167240a896035d5dd374c895559fed934083b62c318e874b`. The `gemini-acceptance-20260908/source-snapshot` file hash is `c41885425e80151f3f8d333548bb314ae28f40d151c50474a8551efb393766ec`, so it was not used as a substitute. |
| `r98-topic-truth-boundary` / module load | c blocker | Same exact R128 fixture blocker through `acceptedTopicPresentation`; `next-decision-bridge.js` hash transition is updated but cannot be exercised until the R128 fixture is recovered or an owner-approved in-repo fixture source is supplied. |

## Tests

| Command | Result |
| --- | --- |
| `cd pilot-01-prototype && node --test tests/r100-topic-faq-contract.test.mjs tests/r101-hyperliquid-seo-preserve.test.mjs tests/r102-treasury-seo-preserve.test.mjs tests/r96-compliant-hant-render.test.mjs tests/r106-mx-native-copy.test.mjs tests/r108-treasury-news-handoff.test.mjs > /tmp/rest-r-focused-no-r95-v7.log 2>&1` | PASS: 31 tests, 31 pass, 0 fail, duration 2094.995458 ms. |
| `cd pilot-01-prototype && node --test tests/r97-hant-render-parity.test.mjs tests/r98-topic-truth-boundary.test.mjs > /tmp/rest-r-r97-r98-blocked-v7.log 2>&1` | FAIL: 2 tests, 0 pass, 2 fail. Both fail at module load with `ENOENT` for `/Volumes/release-candidates/r128-home-mobile/candidate/src/components/v3/TopicGuidePage.jsx`. |
| `python3` hash scan over all `/Volumes/致态2TB/**/TopicGuidePage.jsx` files | BLOCKER EVIDENCE: scanned 122 files; no match for required R128 hash `828491938d1f6900167240a896035d5dd374c895559fed934083b62c318e874b`. |
| `node --test tests/r100-topic-faq-contract.test.mjs tests/r101-hyperliquid-seo-preserve.test.mjs tests/r102-treasury-seo-preserve.test.mjs tests/r95-telegram-review-index.test.mjs tests/r96-compliant-hant-render.test.mjs tests/r106-mx-native-copy.test.mjs tests/r108-treasury-news-handoff.test.mjs > /tmp/rest-r-fixed-without-r97-r98-v6.log 2>&1` | FAIL before final r100 narrowing: 34 pass, 1 fail. Superseded by `/tmp/rest-r-focused-no-r95-v7.log`; superseded by the final real-loader run (4 passed). |

## Notes

- I did not alter `src/data/meta-description.js`; `budgetTitle` remains at the owner-approved default of 60 display characters.
- I did not alter `scripts/generate-telegram-review-index.mjs`; the product generator still points at the real lifecycle manifest path and fails closed when it is absent.
- I did not rewrite archived baseline fixtures or substitute the non-matching `gemini-acceptance-20260908` snapshot for R128.
- I did not touch protected partner data files; protected hash changes are test-side acknowledgements of already-current bytes.
- Temporary `.tmp-r97-render-*` directories created during investigation were removed. The tracked `tests/.tmp-render-topic.asqbYY` artifact was left in place.

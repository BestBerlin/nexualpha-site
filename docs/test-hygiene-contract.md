# Test Hygiene Contract Review

Scope reviewed by this worker:

- `tests/compare-any.test.mjs`
- `tests/compare-compact-pending.test.mjs`
- `tests/compare-direct-answers.test.mjs`
- `tests/cost-decision-locales.test.mjs`
- `tests/decision-return-calculators.test.mjs`
- `tests/venue-decision-content.test.mjs`
- `tests/venue-detail-decision-ssr.test.mjs`
- `tests/venue-fee-summary.test.mjs`
- `tests/week2-mobile-shortpath-contract.test.mjs`
- `tests/detail-composition.test.mjs`
- `tests/compare-decision-ssr.test.mjs`
- `tests/compare-pairs-market-plan.test.mjs`

## Per-test classification

| Test file | Test name / group | Class | History / implementation evidence | Result |
| --- | --- | --- | --- | --- |
| `compare-any.test.mjs` | generated pair metadata title | b | `3c54a66` introduced the title-budget rule; served metadata uses `budgetTitle` while source copy keeps the brand suffix. | Pass |
| `compare-compact-pending.test.mjs` | compacted pending matrix and CTA rows | b | Current compare table has role/aria before the matrix class, maker/taker label order, and protected Binance URL `https://www.binance.com?ref=11350287`. | Pass |
| `compare-direct-answers.test.mjs` | metadata, localized final-choice, FAQ and aria labels | b | `3c54a66` title budgeting; R111 moved evidence into `v3-compare-final-choice-evidence` and the visible card starts with decision title/body instead of the eyebrow. | Pass |
| `cost-decision-locales.test.mjs` | localized cost calculator and tracked actions | b | `LOCALE_PREFIX_BY_CODE` is the route source of truth for public prefixes such as `zh-hans`, `pt-br`, and `id-id`; current calculator routes carry scenario and tracked CTA placements. | Pass |
| `decision-return-calculators.test.mjs` | restore state, source-backed rates and SSR defaults | b | Current cost restore state includes explicit `basis`; 2026-10-10 reviewed base-fee rows promote OKX spot and Bitget futures to source-backed rates. | Pass |
| `venue-decision-content.test.mjs` | MEXC evidence boundary | c | The unpublished campaign fixture is absent from this worktree; the test now pins deterministic MEXC evidence inline while preserving source URL, checked time and restriction text. | Pass |
| `venue-detail-decision-ssr.test.mjs` | first-screen reviewed decisions | b | `b16ef53` split venue detail into first-screen page plus lazy Sources group; first-screen slice now ends at the research hub. | Pass |
| `venue-fee-summary.test.mjs` | official fee rows | b | Current fee summary reads reviewed official rows from exchange-facts/reviewed base fees, rejects ad hoc venue-database numbers, and keeps exact rates/sources. | Pass |
| `week2-mobile-shortpath-contract.test.mjs` | venue, compare and rates mobile ordering | b | R110/R111 grouped venue sources and compare evidence; rates page now collapses pending venue payload in-table and keeps the table wrapper focusable. | Pass |
| `detail-composition.test.mjs` | venue split/static composition contracts | b | `b16ef53` split VenueDetailPage, VenueDetailResearch and shared dictionaries; current identity uses the `enter` modifier, account costs live in `v3-profile-account-cost`, and similar open actions use `v3Copy(locale).openDetail`. | Pass |
| `compare-decision-ssr.test.mjs` | Bybit/Bitget and Binance/OKX SSR decision cards | b | R111 added hero signup CTAs, moved final-choice evidence into the notes group, removed the eyebrow from the priority card, and kept protected partner routes exact. | Pass |
| `compare-pairs-market-plan.test.mjs` | four market-plan pairs metadata/sitemap/SSR | b | `74761ff` added the four pairs; `3c54a66` budgets served titles while the source SEO title keeps `-- NexuAlpha`. | Pass |

## Verification

Command:

```sh
cd pilot-01-prototype && node --test tests/compare-any.test.mjs tests/compare-compact-pending.test.mjs tests/compare-direct-answers.test.mjs tests/cost-decision-locales.test.mjs tests/decision-return-calculators.test.mjs tests/venue-decision-content.test.mjs tests/venue-detail-decision-ssr.test.mjs tests/venue-fee-summary.test.mjs tests/week2-mobile-shortpath-contract.test.mjs
```

Result:

```text
tests 49
pass 49
fail 0
duration_ms 3029.2605
```

Command:

```sh
cd pilot-01-prototype && node --test tests/detail-composition.test.mjs tests/compare-decision-ssr.test.mjs tests/compare-pairs-market-plan.test.mjs
```

Result:

```text
tests 23
pass 23
fail 0
duration_ms 1020.131375
```

## Weakened or dead assertions

No assertions were deleted to force a pass.

The public-copy guard in `compare-direct-answers.test.mjs` was narrowed so transparent partnership disclosures may say `commission` or `佣金`; it still blocks private economics, private commission, guarantees, risk-free language and private-commission Chinese wording.

The old `runtimeUi.similarOpen` assertion was replaced with the current localized equivalent, `text.openDetail`, because similar-platform open actions now reuse `v3Copy(locale)` instead of the removed runtime alias.

No class-d dead-feature checks remain in this reviewed scope.

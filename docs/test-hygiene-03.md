# Test hygiene 03 plan

Preserve the ten user-facing guarantees while replacing assertions about removed UI mechanisms with assertions about the current components. Inspect each replacement before editing; keep a failing assertion when the guarantee has no replacement. Use existing regression suites as the behavior boundary. Fee tests will exercise rendered ledger disclosure controls, localized labels, complete venue access and exact source-bound CTA destinations. Frontend tests retain route, hierarchy, disclosure and bounded comparison contracts. Homepage assertions follow the active HomeV7 decision desk and ClosingBand research slot rather than the inactive LeanHero slot.

Regenerate locale fixtures with repository scripts only after comparing their output against the pre-Urdu/Ukrainian version; accept only locale additions. Preserve R97/R98's missing external fixture failures. Run a completed-build baseline, targeted tests, both site batches, typecheck and strict build. Commit only tests and this plan; restore unrelated generated build outputs.

## Review findings

The directory card selection contract requires an interaction regression: passing `initial={compareSelection}` alone cannot prove a handoff because the picker initializes local state only at mount. Preserve the test failure if clicking two cards leaves the picker empty. Locale snapshot review must pin exact additions; broad removal of all Urdu/Ukrainian subtrees would hide later regressions.

## Fixture decisions

R99 accepts exactly eight added records: Urdu and Ukrainian copy for derivatives decision routes 0–3. Their paths and serialized hashes are pinned before those exact additions are removed for the historical whole-object comparison; the two approved English Meme description differences remain checked.

The fixed-route test preserves current homepage preview indexing for Urdu/Ukrainian while retaining exact status, canonical and robots checks for every route/locale.

R95 stays unchanged and failing. Both the current repository generator and its pre-locale version (`cbca87d^`) produced compact SHA-256 `cecf2946f2fc1bf60be32cbbff642bd9f67b24dfdeaaa77c7229413da5be4465` against current inputs; the frozen expectation is `1ff1305f683c0b54444e277138ab40c5cdea78d8923613c7696a731b2b9b4ece`. The generator's locale-only commit changes only `PUBLIC_LOCALES`, which is absent from the compact output template. This does not establish an ur/uk-only explanation for the hash change, so no new baseline is accepted. R97/R98 keep requiring their original external R128 fixture.

## Verification result

Completed-build baseline versus final:

| Batch | Before pass / fail / skip | After pass / fail / skip |
| --- | --- | --- |
| test:sites | 1135 / 10 / 1 | 1144 / 1 / 1 |
| whole-site-only | 483 / 5 / 0 | 485 / 3 / 0 |

Strict `npm run build`, `npm run typecheck`, syntax checks of all four modified test files and `git diff --check` pass. Sites retains the directory-card interaction failure; the remaining whole-site failures are R95 hash parity and the original missing R97/R98 external fixtures.

Normal Git cannot write this linked worktree’s index or HEAD lock under managed filesystem access. Use a temporary index, `git commit-tree`, and an explicit common-Git-directory update of `refs/heads/codex/test-hygiene-03` only. The ordinary index remains at the pre-task tree until its metadata becomes writable; compare the committed tree with the files using the temporary index. No push or deployment is authorized.

## Handoff inputs

The requested `docs/test-hygiene-02.md` and `pilot-01-prototype/AGENTS.md` are absent. The existing class-d comments record the replacement commits and the original tests reproduce the stated baseline. No fixture files were manually regenerated: R99 uses eight exact path/hash exceptions because no R99 snapshot generator exists in the repository; the fixed-route expectation changes only the two native-review homepage locales. R95 generator evidence does not satisfy the locale-only gate.

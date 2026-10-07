# R129 Final Candidate Test Report

## Scope

This report is for final candidate verification only. No source, registry, invitation URL, deployment script, or production state was edited during this pass.

The earlier `36 tests` integrated figure was a narrow worker-selected subset: R119-R129 increment files plus selected legacy guard files (`r97`, `r98`, `r100`, compare compact, and week2 mobile contract). It is not the full candidate test count and should not be reported as full-site coverage.

## Commands and results

### Typecheck

Command:

```bash
npm run typecheck > ../FINAL-TYPECHECK.log 2>&1
```

Result: PASS (`exit 0`)

Log: `../FINAL-TYPECHECK.log`

### Site test suite

Command:

```bash
npm run test:sites > ../FINAL-TEST-SITES.log 2>&1
```

Result: PASS (`exit 0`)

Node test summary from log:

```text
ℹ tests 724
ℹ suites 0
ℹ pass 723
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
```

Log: `../FINAL-TEST-SITES.log`

### R129 new tests

Command:

```bash
node --test \
  tests/r129-compare-task-grouping.test.mjs \
  tests/r129-meme-href-multiset.test.mjs \
  tests/r129-meme-native-content-ssr.test.mjs \
  tests/r129-news-source-reading.test.mjs \
  tests/r129-reader-foundation.test.mjs \
  > ../FINAL-R129-NEW-TESTS.log 2>&1
```

Result: PASS (`exit 0`)

Node test summary from log:

```text
ℹ tests 44
ℹ suites 0
ℹ pass 44
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Log: `../FINAL-R129-NEW-TESTS.log`

### Topic semantic and legacy guards

Command:

```bash
node --test \
  tests/r129-meme-native-content-ssr.test.mjs \
  tests/r129-meme-href-multiset.test.mjs \
  tests/r97-hant-render-parity.test.mjs \
  tests/r98-topic-truth-boundary.test.mjs \
  tests/r100-topic-faq-contract.test.mjs \
  > ../FINAL-TOPIC-SEMANTIC-44.log 2>&1
```

Result: PASS (`exit 0`)

Node test summary from log:

```text
ℹ tests 44
ℹ suites 0
ℹ pass 44
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Log: `../FINAL-TOPIC-SEMANTIC-44.log`

## Registry guard

Command:

```bash
shasum -a 256 src/data/partner-registry.js
```

Result:

```text
8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a  src/data/partner-registry.js
```

This matches the required protected registry hash.

## Notes

- `test:sites` is the broad candidate site suite used in this pass: 724 total node subtests, 723 passed, 1 skipped, 0 failed.
- R129 new tests and topic semantic guards each report 44 node subtests. These are overlapping verification groups, not additive full-site totals.
- The topic semantic guard verifies 15-locale meme native content, section heading/lead semantics, raw href multiset preservation versus R128, R97/R98 legacy boundaries, and R100 FAQ/source contract preservation.
- No deployment, production mutation, registry mutation, or invitation-link mutation was performed in this lane.

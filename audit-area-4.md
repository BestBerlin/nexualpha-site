# Area 4 i18n audit

Scope: locale/copy/format helpers and i18n regression tests. I did not edit `worker/index.js`, package lifecycle files, partner code values, venue commercial values, or deployment files.

| Finding | Severity | Evidence | Fixed |
| --- | --- | --- | --- |
| App download source check dates were printed as raw ISO date text on all 17 localized app pages, so non-English locales saw an English-style `2026-10-13` date instead of locale-aware UI text while the machine-readable `dateTime` stayed correct. | P1 user-visible i18n bug | `pilot-01-prototype/src/components/apps/AppDownloadPage.jsx:50` used `{app.lastChecked}` as visible text. | yes |
| i18n tooling tests still asserted the old selector implementation shape (`supportedLocales.map`) even though App now uses `supportedLocales.includes` and hreflang-derived `languageOptionsFromHreflang(pageAlternates)`. The stale assertion made `npm run test:i18n` fail while the runtime locale sync path was still present. | P2 test coverage drift | `pilot-01-prototype/tests/i18n-tooling.test.mjs:48`, `pilot-01-prototype/tests/i18n-tooling.test.mjs:57` now pin the current selector path and still require Paraglide runtime/catalog alignment. | yes |

## Fixes

- `pilot-01-prototype/src/components/apps/AppDownloadPage.jsx:5` imports the shared locale-aware `formatDate` helper.
- `pilot-01-prototype/src/components/apps/AppDownloadPage.jsx:23` computes the visible source-check date with the page locale.
- `pilot-01-prototype/src/components/apps/AppDownloadPage.jsx:50` keeps the original `dateTime` value but renders localized visible text, with raw value fallback only if formatting fails.
- `pilot-01-prototype/tests/app-downloads.test.mjs:94` adds a 17-locale SSR regression that verifies `dateTime` is preserved and non-English app pages no longer print raw ISO dates where locale formatting differs.
- `pilot-01-prototype/tests/i18n-tooling.test.mjs:48` and `pilot-01-prototype/tests/i18n-tooling.test.mjs:57` update the selector contract test to the current `supportedLocales.includes` plus hreflang-derived language options path.

## Verification

- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && npm run i18n:compile` -> passed; Paraglide compiled successfully.
- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && npm run i18n:check` -> passed; `i18n check passed: 17 catalogs, 116 keys, placeholders, RTL metadata, review gates, and UI limits validated.`
- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && npm run test:i18n` -> passed; 7 tests, 7 passed.
- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && node --test tests/app-downloads.test.mjs` -> passed; 7 tests, 7 passed.
- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && node --test tests/l10n-gaps.test.mjs tests/locales-ur-uk.test.mjs tests/app-downloads.test.mjs` -> passed; 24 tests, 24 passed.
- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && npm run typecheck` -> passed; `tsc -p tsconfig.json` exited 0.

Load gate emitted host-probe warnings (`sysctl`, `sysmon`, `pgrep`) in this sandbox on each run, but the guarded commands completed and returned exit 0.

## Coverage and gaps

- Covered: 17-locale catalog alignment, missing-key tooling, current selector locale contract, app download SSR/hydration route coverage, neutral CTA locale gates, RTL shell checks for Urdu, noindex/hreflang gates for native-review locales, l10n gap regressions, and TypeScript compile.
- Not run in this area lane: full `npm run build -- --strict` and full `npm run test:sites`; root/other lanes own full build and suite because this child was scoped to i18n and asked not to run full root checks.

# Area 3 audit - data and commercial integrity

## Findings

| Severity | File:line | Finding | Fixed |
| --- | --- | --- | --- |
| P1 | `pilot-01-prototype/src/data/venue-database.js:327` | Gate.io's visible venue record used `www.gate.io` and `https://www.gate.io/signup/nexubest`, while the protected partner registry and `/go/gate` redirect use `www.gate.com` and `https://www.gate.com/signup/nexubest`. That could present a different signup target from the tracked commercial route for the same code. | yes |

## Fix

- `pilot-01-prototype/src/data/venue-database.js:327` - aligned the Gate.io venue `officialDomain`, mirrors and `registrationUrl` to the protected partner registry target while preserving the existing invite code value.
- `pilot-01-prototype/tests/partners-feed.test.mjs:40` - added a regression that verifies every active, ungated referral venue row keeps its invite code, registration URL and official domain aligned with the partner registry.

## Commands and results

- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && node --test tests/partner-view.test.mjs tests/go-redirect.test.mjs tests/attribution-locale-gates.test.mjs tests/exchange-matrix-row-code-binding.test.mjs tests/partners-feed.test.mjs tests/public-cta.test.mjs tests/partner-program.test.mjs tests/vi-neutral-locale.test.mjs` - pass: 45 tests, 45 pass, 0 fail. The load gate printed host telemetry warnings (`sysctl`, `sysmon`, `pgrep`) but returned control and did not fail the test command.
- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && node --test tests/partners-feed.test.mjs tests/go-redirect.test.mjs tests/public-cta.test.mjs tests/attribution-locale-gates.test.mjs tests/exchange-matrix-row-code-binding.test.mjs` - pass: 25 tests, 25 pass, 0 fail. Same load-gate host telemetry warnings.
- Structured audit script over `partner-registry`, `venue-database`, `public/intel/{partners,promotions,partner-geo-restrictions}.json`, `buildPartnersFeed()` and neutral CTA locales - pass: `{"issueCount":0,"issues":[]}`.

## Coverage limits

- I did not run the full root `test:sites`, full build, SSR packaging repair, or deploy checks. The parent brief for this area said those heavy commands are owned elsewhere.
- I did not change any partner invite code values.

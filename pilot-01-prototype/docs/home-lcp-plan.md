# Home CSS delivery plan

1. Record the untouched branch's route stylesheet bytes and test failures.
2. Lock the v6 import cascade and prove the excluded inner revisions match no
   home SSR elements in all 17 locales before splitting the CSS.
3. Split inner-only v6 revisions into ordered route chunks. Keep shared segments
   between them so inner pages retain exactly the original cascade. Rejoin these
   build segments into one full inner asset and one shared-only home asset to
   preserve the existing v6 stylesheet request count.
4. Give news, directory/comparison and rates/profile signature sheets their own
   route chunks at their original entry-cascade position.
5. Limit inline critical CSS to the shell and hero, matching selectors against
   the complete SSR DOM. Keep the Geist preload and swap font behavior and
   assert the reported `.h7-num` LCP selector remains in inline CSS.
6. Run strict build, targeted regression checks, test:sites and typecheck; compare
   CSS delivery and SSR markup. Chrome is unavailable in this lane, so a new live
   Lighthouse run remains required to establish LCP below 2.5 seconds.

## Verified local results

Baseline: `origin/main` at `fa4ef05`. The comparison client build used the original
Vite configuration, entry imports and v6 CSS imports. Both Worker snapshots used
the same SSR runtime and data. No source component markup or CSS declarations
were changed. All seven SSR body SHA-256 hashes match; this establishes markup
parity, not browser geometry parity.

| Route | Linked CSS raw bytes, before → after | Estimated gzip bytes, before → after |
| --- | ---: | ---: |
| `/` | 1,196,056 → 1,052,759 | 195,538 → 179,314 |
| `/zh-hans` | 1,196,056 → 1,052,759 | 195,538 → 179,314 |
| `/exchanges/okx` | 871,203 → 845,786 | 137,959 → 135,650 |
| `/compare/binance-vs-kraken` | 784,502 → 760,752 | 122,093 → 119,687 |
| `/exchanges/okx/app` | 646,560 → 612,425 | 96,958 → 93,046 |
| `/activities/kraken-usdg-challenge` | 662,196 → 628,061 | 100,452 → 96,540 |
| `/flash` | 731,893 → 697,758 | 112,122 → 108,210 |

Home inline CSS: **182,761 → 59,057 raw bytes**. Home retains 26 stylesheet
requests. The split adds one signature stylesheet request on the venue and
comparison routes while reducing their total CSS bytes. Initial home JS:
315,242 → 315,258 gzip bytes, below the unchanged 350,000-byte strict limit.

Commands run from `pilot-01-prototype`:

- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && npm run build`: PASS,
  including strict budgets.
- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && npm run typecheck`: PASS.
- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && npm run test:sites`: 1,532
  passed, zero failed, one skipped. The initial baseline run had four failures
  caused by absent/incomplete build artifacts; there are no added failures.
- `node --test tests/dist-shell-contract.test.mjs`: 3 passed, zero failed.
- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && node scripts/measure-route-css.mjs --baseline`
  and `node scripts/measure-route-css.mjs`: seven successful HTTP/SSR snapshots,
  identical body hashes and reduced linked CSS on every sampled route.
- `git diff --check`: PASS.

The ignored `.openai/hosting.json` input was copied from the existing checkout
to complete local packaging. Generated content/partner changes were reverted.
Captured baseline assets, comparison JSON and command logs are retained locally
under ignored `dist/home-lcp-evidence/`.

The load gate was invoked as required, but sandbox restrictions prevent its
`sysctl`, `memory_pressure` and `pgrep` telemetry from working. Chrome was not
run. Live mobile LCP, browser geometry, early scrolling before deferred CSS has
loaded, and multilingual visual parity need verification in the lead's browser
lane. No deployment or production performance claim is made.

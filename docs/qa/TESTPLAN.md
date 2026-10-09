# NexuAlpha test plan (QA Lead, v6 round 10)

Owner: QA Lead. Scope: layout and invariant regressions that unit/contract tests cannot see (blank areas,
overflow, type drift, unstyled routes, CTA link/code changes), plus the existing `node --test` contract suite.
Rule from `docs/company/ORG.md`: a defect class found twice becomes an automated check.

## 1. What exists

| Layer | Where | Runs against |
|---|---|---|
| Pixel void scanner | `tools/voidscan.py` (copy also at `/home/claude/tools/voidscan.py`) | any URL list |
| e2e suite | `pilot-01-prototype/tests/e2e/run.py` + `checks.js` + `routes.json` | `BASE_URL` / `--base`, or a built package via `--serve DIR` |
| CTA golden | `pilot-01-prototype/tests/e2e/golden/cta-invariants.json` | captured from live build `398a043` |
| Metrics baseline | `pilot-01-prototype/tests/e2e/golden/metrics-baseline.json` | captured from live build `398a043` |
| Contract/unit tests | `pilot-01-prototype/tests/*.test.mjs` (`node --test`) | source tree |
| Contract runner with quarantine | `pilot-01-prototype/tests/run-contract.mjs` + `tests/QUARANTINE.json` | source tree |
| CI | `.github/workflows/qa-e2e.yml` | release package of each successful Build run |

## 2. Checks and thresholds

All page checks load each route in a fresh Chromium (`channel=chromium`, `--disable-gpu`, one page per
browser, 2 retries), wait for hydration, scroll top to bottom in 0.45-viewport steps so lazy and reveal content
mounts (late-armed `[data-phase=armed]` blocks are visited again), return to the top, then measure.
Default widths: 1440 and 390 (CI); the baseline run uses 1440, 1280, 1024, 768, 390.

| Check | What | Threshold | Gate |
|---|---|---|---|
| `cta` | every `a[data-cta-kind=registration]`, `a[rel~=sponsored]`, `a[data-cta-code]` as `href \| data-cta-code`, per route@width, after full scroll | exact match with golden (`tg_expires` normalised) | **blocking**. `ALLOW_CTA_CHANGE=1` downgrades to warning; `--update-golden` refuses to overwrite without it |
| `css` | h1 present, visible, Geist, >= 20px; header 1-200px tall; footer present; any `*-sr`, `sr-only`, `visually-hidden` element larger than 2x2 and not clipped | zero | blocking (release gate); body font not Geist = warning; DOM classes with no CSS rule listed as metric |
| `overflow` | `scrollWidth > clientWidth`, with offending elements outside scrollers | zero | blocking |
| `console` | `pageerror`, `console.error`, same-origin HTTP >= 400 (except `routes.json` `expected404`), failed same-origin requests | zero | blocking; third-party = warning |
| `jsoff` | JS disabled: visible h1, main text >= 200 chars, no overflow, no visible sr-only | zero | blocking; text invisible without JS (reveal classes) = warning |
| `void` | `voidscan` analyser on the full-page screenshot: horizontal bands with no pixel edges across the 1200 container taller than 128px (>= 1024 wide) / 72px (narrower); empty rectangles >= 160x160 inside rows that have content (symmetric gutters ignored); blocks still at opacity 0 after the scroll (reveal never fired) | no new voids vs baseline; target 0 | regression gate (with `--baseline`) |
| `type` | every visible text node: size in {12,14,16,20,28,44,72} (viewport <= 640px: {12,14,16,18,24,32,44}), weight in {400,500,600}, line-height/font-size in {1.05,1.15,1.55} (±0.01), first family `Geist*` | no increase vs baseline; target 0 | regression gate |
| `tap` | at widths < 600: interactive targets smaller than 44x44 (inline links inside running text exempt, sr-only skipped) | no increase vs baseline | regression gate |
| `collision` | overlapping text boxes from unrelated elements (fixed/sticky, clipped, closed `<details>` skipped; tight-leading line overlap ignored); rail (`.rr-dock`, `*rail*`) collisions counted separately | no increase vs baseline; rail = 0 | regression gate |
| `i18n` | `tools/i18naudit.py` (English leftovers in non-English locales) for `routes.json` `i18n` locales x paths | no increase vs baseline | regression gate |
| `clicklat` | `tools/clicklat.py` on home (Event Timing click duration) | <= 200ms | warning only |

Self-test hooks: `QA_CSS_STRIP='\.cl-sr'` strips matching CSS rules on the fly; with it the `css` check fails on
`/compare/*` exactly like round-9 B1 (verified). Editing one golden href makes `cta` fail on every route that
carries it (verified).

## 3. How to run

Prerequisites (local box): python3 with `playwright` (1.56), `numpy`, `pillow`; Chromium installed for Playwright.

```bash
cd pilot-01-prototype
# fast set (17 routes + 12 CTA routes, 1440+390) against a preview
BASE_URL=http://localhost:5031 python3 tests/e2e/run.py
# everything, all widths, write report + metrics
python3 tests/e2e/run.py --base https://nexualpha.com --set full --widths 1440,1280,1024,768,390 \
  --md /tmp/qa.md --json /tmp/qa.json --write-baseline /tmp/metrics.json
# gate a candidate: fail on any metric worse than the committed baseline
python3 tests/e2e/run.py --base http://localhost:5031 --baseline tests/e2e/golden/metrics-baseline.json
# a built package (dir with server.mjs + dist/), served on 127.0.0.1:5091 for the run
python3 tests/e2e/run.py --serve /path/to/pkg --port 5091
# single checks
python3 tests/e2e/run.py --base URL --checks cta            # invariants only (~3-4 min)
python3 tests/e2e/run.py --base URL --routes /,/rates --checks void,overflow --widths 1024
# approved CTA change (user OK required): refresh the golden
ALLOW_CTA_CHANGE=1 python3 tests/e2e/run.py --base URL --set cta --checks cta --update-golden
```

Void scanner alone (Layout leads): `python3 tools/voidscan.py --help`. Example:
`python3 tools/voidscan.py --base http://localhost:5031 --paths /,/exchanges --widths 1440,390 --shots /tmp/vs --shots-max 3`
(annotated JPEGs only for the worst pages; delete them when done).

Contract tests: `cd pilot-01-prototype && npm ci && NODE_USE_ENV_PROXY=1 npm run i18n:compile && node tests/run-contract.mjs`
(runs every `tests/*.test.mjs` not listed in `tests/QUARANTINE.json`; `--all` includes quarantined files;
`--list` prints the quarantine with reasons). On this box `npm ci` needs
`NO_PROXY= no_proxy= npm_config_noproxy=` because the registry is on the no-proxy list.

## 4. How it gates a release

ORG gate: build green -> contract tests green -> QA scan clean -> independent regression review GO -> deploy -> live verification.

1. **Build** (`build.yml`) must be green.
2. **Contract tests**: `node tests/run-contract.mjs` green (quarantined files excluded; a quarantined file comes
   back only with a fix).
3. **QA scan** on the candidate preview (`preview.sh <branch> 50xx`):
   - `run.py --base http://localhost:50xx --baseline tests/e2e/golden/metrics-baseline.json` exits 0:
     no blocking failure (cta, css, overflow, console, jsoff) and no metric worse than baseline.
   - CI (`qa-e2e.yml`) does the same against the Build package: the CTA invariants step is blocking,
     the layout scan step is non-blocking until the Layout leads clear the baseline defect list; the Release
     Manager then flips it to blocking by removing `continue-on-error`.
4. After a release that intentionally improves the numbers, refresh the baseline from live:
   `--write-baseline tests/e2e/golden/metrics-baseline.json` (metrics only go down; commit with the release).
5. **Live verification** after deploy: `run.py --base https://nexualpha.com --checks cta,css,overflow,console`.

## 5. Known limits

- Voids are measured on luma edges. A large flat colour panel with no text counts as empty (intended: it reads
  as blank), a decorative pattern or photo counts as content.
- Full-page screenshots render sticky/fixed elements once at their top-of-page position.
- `workflow_run` / `workflow_dispatch` only fire once `qa-e2e.yml` is on `main`.
- Timing on the shared dev box is noisy (load average > 30 during agent runs); clicklat is warning-only for that reason.

# Local validation — 2026-10-14

Branch: `codex/licence-20-countries`. Prepared baseline: the initial `origin/main` at `f26f906af2bfae41baeda2b5028b02716296bf3d`. No deployment.

## Passed lightweight checks

Commands from `pilot-01-prototype`:

```sh
node scripts/generate-license-research.mjs
node scripts/generate-license-sitemap.mjs
node scripts/generate-exchange-key-facts.mjs
node --test tests/licenses-expansion-contract.test.mjs
node --input-type=module -e "import {readFileSync} from 'node:fs'; import {transform} from 'esbuild'; await transform(readFileSync('src/components/licenses/LicensePages.jsx','utf8'),{loader:'jsx',jsx:'automatic'}); console.log('LicensePages.jsx transform: PASS');"
node --check src/data/licenses.js
node --check src/data/licenses-cta.js
node --check src/data/licenses-seo.js
node --check src/data/licenses-editorial.js
node --check src/data/licenses-research.js
node --check scripts/generate-license-research.mjs
node --check scripts/generate-license-sitemap.mjs
node --check tests/licenses.test.mjs
node --check tests/licenses-expansion-contract.test.mjs
```

Results: research generator produced 21 jurisdiction checks / 55 newly extracted rows; integrated dataset has 66 rows / 28 jurisdictions. Sitemap generator produced 266 URLs, lastmod 2026-10-14. Fact-sheet generator produced 25 sheets. Three data-contract tests passed, zero failed; latest rerun took 1.37 seconds. JSX transform and all syntax checks exited 0.

From checkout root: `git diff --check` exited 0 after removing an extra blank EOF line.

## Blocked heavy checks

Attempted from `.context-excluded/licence-baseline/pilot-01-prototype`:

```sh
zsh /Volumes/致态2TB/nx-agents/load-gate.sh && npm run build > ../../licence-validation/baseline-build.log 2>&1
```

The gate could not read its required system probes: `sysctl ... Operation not permitted`, `sysmon request failed ... sysmond service not found`, and `pgrep: Cannot get process list`. The attempt was interrupted (exit 130) before npm started. Independent `python3 -c 'import os; print(os.getloadavg())'` initially returned `(27.921875, 21.37353515625, 16.3818359375)` and later `(60.435546875, 39.27978515625, 25.20556640625)`, both above the required one-minute load limit of 10. The gate was not bypassed.

Required commands remain unrun for the candidate:

```sh
zsh /Volumes/致态2TB/nx-agents/load-gate.sh && npm run build
zsh /Volumes/致态2TB/nx-agents/load-gate.sh && npm run test:sites
zsh /Volumes/致态2TB/nx-agents/load-gate.sh && npm run typecheck
```

Baseline `test:sites` remains unrun too. Therefore strict build success, SSR/hydration correctness, typecheck success and “no new failures versus origin/main” are **not established**. Recovery requires an execution environment in which the original gate can read its probes and host load/memory/job count satisfy it. The remote-tracking main ref advanced during this task. Refresh the baseline archive from current origin/main before running its gated build and test:sites, then run the candidate commands above.

## Remaining evidence limits

All inaccessible and partial registers are documented in the jurisdiction JSON files and README. Empty research pages remain noindex and are excluded from sitemap/hreflang sets. Eleven retained national EU rows keep their 2026-10-13 check dates; this run did not refresh those individual national registers. Translated editorial text needs native-language review; unsupported country languages use the site's English edition. Coverage notes and entity-specific qualifiers deliberately remain English with explicit language/direction markup. No fiat rails were added without a sourced claim.

## Local commit blocked

`git add docs/licence-research pilot-01-prototype/package.json pilot-01-prototype/public/sitemap-licenses.xml pilot-01-prototype/public/sitemap.xml pilot-01-prototype/src/components/licenses/LicensePages.jsx pilot-01-prototype/src/data/exchange-key-facts.generated.js pilot-01-prototype/src/data/licenses-cta.js pilot-01-prototype/src/data/licenses-seo.js pilot-01-prototype/src/data/licenses.js pilot-01-prototype/src/data/licenses-editorial.js pilot-01-prototype/src/data/licenses-research.js pilot-01-prototype/scripts/generate-license-research.mjs pilot-01-prototype/scripts/generate-license-sitemap.mjs pilot-01-prototype/tests/licenses.test.mjs pilot-01-prototype/tests/licenses-expansion-contract.test.mjs` failed with:

```text
fatal: Unable to create '/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-licence-20-countries/index.lock': Operation not permitted
```

No commit was created. The work remains on `codex/licence-20-countries`; no deployment occurred. Recovery requires writable linked-worktree Git metadata in the execution sandbox, including index lock, objects and branch refs. The prepared Lore commit message is in `.context-excluded/licence-validation/commit-message.txt`. Do not substitute a different repository or bypass sandbox restrictions.

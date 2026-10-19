# Exact validation commands

Use `export PATH="$HOME/.nvm/versions/node/v24.14.0/bin:$PATH"`.
Npm/app commands were run from `pilot-01-prototype`; deployment commands from repository root.

```sh
node --version
npm run typecheck
npm run build
node scripts/verify-build-budget.mjs --strict
npm run test:sites
npm test
node scripts/node24-runtime-smoke.mjs
npm audit --json --package-lock-only --ignore-scripts --cache .npm-cache
npm ls vite @vitejs/plugin-react postcss browserslist baseline-browser-mapping nanoid source-map-js
node --test tests/server-build-imports.test.mjs tests/csp-report.test.mjs tests/og-image.test.mjs
```

From repository root:

```sh
node --test pilot-01-prototype/tests/csp-report.test.mjs deploy/healthchecks/healthchecks.test.mjs ops/pipeline-resilience/deploy/healthcheck.test.mjs
node --test --test-force-exit pilot-01-prototype/tests/bluegreen-release-contract.test.mjs pilot-01-prototype/tests/r95-standalone-worker-package.test.mjs
python3 -m unittest discover -s deploy/tests -q
bash -n deploy/deploy-local.sh
node --check pilot-01-prototype/server/csp-report.mjs
node --check pilot-01-prototype/scripts/node24-runtime-smoke.mjs
git diff --check
```

The later `test:whole-site` segment was run independently from the app directory
because the known academy failure short-circuits the npm chain:

```sh
node --input-type=module -e 'import fs from "node:fs"; import {spawnSync} from "node:child_process"; const command=JSON.parse(fs.readFileSync("package.json")).scripts["test:whole-site"].split(" && ").at(-1).split(" "); const result=spawnSync(process.execPath,command.slice(1),{stdio:"inherit"}); process.exit(result.status??1);'
```

The same extraction ran against an isolated `git archive HEAD` tree with original
shared dependencies and the same prepared dist. Candidate: 398 pass/94 fail;
unchanged HEAD: 397 pass/95 fail; no added failing name. See comparison JSON for
all names and the precise baseline boundary. The fixed package-isolation fixture
accounts for the one resolved failure.

YAML syntax was checked with Python PyYAML `yaml.safe_load` for build.yml,
deploy.yml and compose.snippets.yml. All three parsed. Test process retention
without `--test-force-exit` remains a teardown diagnostic gap, not a claim of
clean resource shutdown. Final npm test uses that flag, preserves all assertions,
and exits 1 only for the brief's explicitly excluded academy generator failure.

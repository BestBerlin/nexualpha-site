# Standby cutover and CTA guard

## Deploying from the Mac: `deploy/deploy-local.sh`

GitHub Actions is unavailable (billing), so production ships from the lead session's Mac with
`deploy/deploy-local.sh`. It is the local equivalent of `.github/workflows/build.yml` + `deploy.yml`
and uses the scripts below unchanged:

```sh
deploy/deploy-local.sh                       # build and ship origin/main
ALLOW_CTA_CHANGE=1 deploy/deploy-local.sh    # only when invite/registration links are meant to change
```

1. Takes the lock `/Volumes/致态2TB/.nx-deploy.lock` (a second run exits 2 with `REFUSED`).
2. Resets the worktree `/Volumes/致态2TB/.nx-deploy-build` to a clean detached `origin/main`. It keeps
   `node_modules`, `.openai/hosting.json` (copied into `pilot-01-prototype/.openai/`) and the 5 newest packages.
   It refuses a commit that is not on `origin/main` or that is older than the live build.
3. Live version gate, same as deploy.yml.
4. Build: `npm ci` (only when package-lock changed), `i18n:compile`, typecheck, `npm run build`
   (generators, vite, `scripts/build-route-css.mjs`, SSR, news SSR, prerender, critical CSS, sites prep,
   `verify-build-budget --strict`), the dist shell contract, the version.json buildId and campaign-brief validation.
   buildId `3.0-<Shanghai time>-GH-<sha7>`, release `gh-<time>-<sha7>`, the same as build.yml.
5. Packages like build.yml (plus the linux gnu/musl resvg binaries) and uploads to a `.part` file. Checks the
   server sha256, then renames the file.
6. `stage-remote.py` (with `ALLOW_CTA_CHANGE` passed through).
7. **Pre-cutover gate:** `npm run qa:regression -- --base http://127.0.0.1:<tunnel>` against the staged
   container through an SSH tunnel. A failure removes the standby; live is untouched.
8. `poll-cutover.py` wraps `cutover-remote.py`: the home page is polled every 200 ms and must stay 200.
9. **Post-cutover checks:** public buildId, 13 routes, invite codes on the pages (bare 11350287 / nexu888; Bitget is link-only, so its page must link `/go/bitget`), and the `/go` 302 targets
   (`okx` nexu888, `okx-apk` NEXU888, `binance` 11350287, `bitget` C6PRAF). Then `qa:regression` runs against
   production. Any failure runs `rollback-remote.py` and prints `ROLLED_BACK` (exit 3; exit 4 if the rollback itself failed).
10. Syncs `campaign-briefs.json` into the content mount and keeps the 5 newest releases on the server.
11. Runs `scripts/search-engines.mjs submit` with `NODE_OPTIONS=--dns-result-order=ipv4first`. Prints `LIVE <buildId>`.

Logs and QA reports go to `/Volumes/致态2TB/nx-agents/deploy-logs/`. Exit 5 means the release is live and
verified but a follow-up step (briefs, prune or sitemaps) failed. `/Volumes/致态2TB/nx-agents/deploy-local.sh`
is a copy of this file. Never keep the only copy of a deploy script in a session scratchpad.

These scripts remain self-contained because deployment streams each one to
`python3 -` over SSH. They use only the Python standard library and retain Python
3.6 syntax compatibility.

1. `stage-remote.py` creates and starts a separate container on an unused port.
   It checks every `ROUTES` entry, build identity, collector/error readiness and
   the live/standby CTA golden comparison. It records routes in release state.
2. `cutover-remote.py` starts the staged container if needed and repeats route and
   build checks before touching nginx. It writes the config through a
   same-directory atomic rename, runs `nginx -t`, then requests a graceful reload.
   Failed validation/reload restores the original config. It waits for the
   pre-reload worker PIDs to disappear, rechecks standby health, then stops the
   old container. If workers take over 60 seconds to drain, it keeps the old
   container running to serve their requests. Old container/files/state remain
   available for rollback; no container removal occurs here.
3. `rollback-remote.py` starts the retained old container, checks its routes and
   original build identity, and only then atomically restores the nginx backup.
   An unhealthy rollback target leaves the current config untouched.

The CTA check parses HTML attributes and displayed registration codes, decodes
HTML entities, and resolves each relative `/go/<partner>` using HEAD against
that page's own container port. Redirects are never followed. A missing redirect,
missing Location or non-HTTP(S)/relative destination fails closed. The exact
resolved destination (including referral query values) and displayed codes must
match; only the existing `tg_expires` build timestamp normalization is exempt.
The existing explicit `ALLOW_CTA_CHANGE=1` override still applies to differences;
it does not suppress resolution errors.

## Local checks

```sh
python3 -m unittest discover -s deploy/tests -v
PYTHONPYCACHEPREFIX="$PWD/deploy/__pycache__" python3 -m py_compile deploy/stage-remote.py deploy/cutover-remote.py deploy/rollback-remote.py deploy/poll-cutover.py
```

Tests use temporary files, local HTTP servers and mocked Docker/nginx calls.
They do not exercise a real nginx reload or Docker runtime.

## Next authorized real deploy

Complete staging with `ALLOW_CTA_CHANGE=0`. The existing cutover invocation can
be wrapped by the polling tool (run from this repo; substitute the staged release):

```sh
RELEASE=gh-REPLACE-WITH-STAGED-RELEASE
python3 deploy/poll-cutover.py 'https://nexualpha.com/?cutover_probe=1' -- \
  sh -c 'ssh prod "env RELEASE=$1 python3 -" < deploy/cutover-remote.py' sh "$RELEASE"
```

The tool requires a healthy baseline, polls home on a 200 ms schedule from one
second before the command through three seconds after completion, and fails for
any non-200/connection error or failed cutover command. Requests time out after
2 seconds; a slow request reduces actual sampling frequency, so retain the
printed timestamps. For origin evidence, use the origin URL with the correct
Host header/routing in a separate approved verification setup; a CDN response
alone may hide origin errors. Polling is evidence at sampled times, not a proof
of availability between samples.

Then run the existing public route/build checks. Verify the cutover log reports
old-container retirement or the drain-timeout fallback, inspect the expected
build publicly, and test rollback on a non-production clone before relying on
it. In the GitHub workflow the same polling command can wrap the existing
Switch traffic command. No production command was run for this change.

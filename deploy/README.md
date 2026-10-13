# Standby cutover and CTA guard

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

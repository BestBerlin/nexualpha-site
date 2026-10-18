#!/bin/bash
# deploy-local.sh — the local equivalent of .github/workflows/build.yml + deploy.yml for nexualpha.com.
#
# GitHub Actions is unavailable (billing), so the lead session ships from the Mac with this script. It builds a clean
# worktree of origin/main exactly like build.yml, then stages, gates, cuts over and verifies like deploy.yml, with two
# extra real-UA regression gates (scripts/qa-regression.mjs) around the cutover.
#
#   deploy/deploy-local.sh                       # deploy origin/main
#   ALLOW_CTA_CHANGE=1 deploy/deploy-local.sh    # only when registration/invite links are meant to change
#
# Steps (any failure stops the run; nothing after a failed step runs):
#   1. lock          one deploy at a time (/Volumes/致态2TB/.nx-deploy.lock)
#   2. checkout      clean detached worktree of origin/main at /Volumes/致态2TB/.nx-deploy-build (keeps node_modules,
#                    .openai/hosting.json and old packages); refuses a commit that is not on origin/main or older than live
#   3. live gate     live buildId must be BASELINE_BUILD_ID or a -GH- build (deploy.yml "Live version must be a known base")
#   4. build         npm ci (only when package-lock changed), i18n:compile, hosting manifest, typecheck, npm run build
#                    (generators + vite + build-route-css + SSR + news SSR + prerender + critical CSS + sites prep +
#                    verify-build-budget --strict), dist shell contract, version.json buildId, campaign-briefs validation
#   5. package       tgz of dist server server.mjs package.json src node_modules/@resvg (+ linux gnu/musl resvg), sha256
#   6. upload        scp to a .part file, server-side sha256 must match, atomic rename
#   7. stage         deploy/stage-remote.py (standby container, 13 routes, buildId, collector, CTA golden; live untouched)
#   8. pre gate      npm run qa:regression against the staged container through an SSH tunnel; failure removes standby
#   9. cutover       deploy/poll-cutover.py wrapping deploy/cutover-remote.py (home polled every 200 ms, must stay 200)
#  10. post gate     public buildId, 13 routes, invite codes on pages, /go 302 targets carry the codes, qa:regression
#                    against production. Any failure runs deploy/rollback-remote.py and prints ROLLED_BACK
#  11. after         campaign briefs synced to the content mount, keep the 5 newest releases on the server and locally
#  12. sitemaps      scripts/search-engines.mjs submit (NODE_OPTIONS=--dns-result-order=ipv4first)
#  13. LIVE <buildId>
#
# Exit codes: 0 live and verified; 1 failed before or during cutover (production unchanged or restored);
# 2 lock held; 3 post-cutover failure and ROLLED_BACK; 4 rollback itself failed (production needs a human);
# 5 deployed and verified but a follow-up step (briefs sync, prune, sitemap submit) failed.
#
# Secrets: none are read or printed here. SSH uses the nexualpha-prod alias key with host keys pinned in
# deploy/known_hosts; search-engines.mjs reads its own keys from ~/.codex/private. Never add `set -x`.
#
# The canonical copy is deploy/deploy-local.sh in the repo; /Volumes/致态2TB/nx-agents/deploy-local.sh is a copy.

set -Eeuo pipefail
umask 022
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export LC_ALL=en_US.UTF-8

REPO="${NX_REPO:-/Volumes/致态2TB/nexualpha-site-git}"
BUILD="${NX_BUILD_DIR:-/Volumes/致态2TB/.nx-deploy-build}"
LOCK="${NX_DEPLOY_LOCK:-/Volumes/致态2TB/.nx-deploy.lock}"
LOG_DIR="${NX_DEPLOY_LOG_DIR:-/Volumes/致态2TB/nx-agents/deploy-logs}"
LOAD_GATE="${NX_LOAD_GATE:-/Volumes/致态2TB/nx-agents/load-gate.sh}"
SSH_HOST="${NX_SSH_HOST:-nexualpha-prod}"
SITE="https://nexualpha.com"
REF="origin/main"
KEEP_RELEASES=5
ALLOW_CTA_CHANGE="${ALLOW_CTA_CHANGE:-0}"
PILOT="$BUILD/pilot-01-prototype"
ROUTES="/ /zh-hans /exchanges /exchanges/binance /exchanges/bitget /exchanges/okx /compare/binance-vs-okx /activities /news /rates /telegram /br /methodology"

case "$ALLOW_CTA_CHANGE" in 0|1) ;; *) echo "ABORT ALLOW_CTA_CHANGE must be 0 or 1" >&2; exit 1 ;; esac

STAGE="init"; RELEASE=""; BUILD_ID=""; NEW_PORT=""; TUNNEL_PID=""; LOCKED=""; CUT_OVER=""
step() { STAGE="$1"; printf '\n=== [%s] %s\n' "$(TZ=Asia/Singapore date '+%H:%M:%S SGT')" "$1"; }
die() { echo "ABORT [$STAGE] $*" >&2; exit 1; }

# perl alarm = portable timeout (macOS has no coreutils timeout).
with_timeout() { local secs="$1"; shift; perl -e 'alarm shift; exec @ARGV or die "exec: $!"' "$secs" "$@"; }

# Host keys are pinned to deploy/known_hosts of the commit being deployed (set after checkout).
SSH_OPTS=()
remote() { ssh "${SSH_OPTS[@]}" "$SSH_HOST" "$@"; }

cleanup() {
  local code=$?
  if [ -n "$TUNNEL_PID" ]; then kill "$TUNNEL_PID" 2>/dev/null || true; fi
  if [ -n "$LOCKED" ]; then rm -rf "$LOCK"; fi
  if [ "$code" -ne 0 ]; then echo "deploy-local: FAILED (exit $code) at step [$STAGE]${RELEASE:+ release $RELEASE}" >&2; fi
}
trap cleanup EXIT
trap 'echo "deploy-local: command failed at line $LINENO in step [$STAGE]" >&2' ERR
trap 'echo "deploy-local: interrupted" >&2; exit 1' INT TERM HUP

# ------------------------------------------------------------------------------------------------------------------
step "lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  holder="$(cat "$LOCK/pid" 2>/dev/null || true)"
  if [ -n "$holder" ] && kill -0 "$holder" 2>/dev/null; then
    echo "REFUSED another deploy-local.sh is running (pid $holder, since $(cat "$LOCK/started" 2>/dev/null || echo '?'))" >&2
    exit 2
  fi
  if [ -z "$holder" ] && [ -n "$(find "$LOCK" -maxdepth 0 -mmin -2 2>/dev/null)" ]; then
    echo "REFUSED lock $LOCK is being created by another run" >&2; exit 2
  fi
  echo "stale lock from dead pid ${holder:-?}; taking it over"
  rm -rf "$LOCK"; mkdir "$LOCK" || { echo "REFUSED could not take lock $LOCK" >&2; exit 2; }
fi
LOCKED=1
echo "$$" > "$LOCK/pid"; date -u +%FT%TZ > "$LOCK/started"

mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/deploy-$(date -u +%Y%m%dT%H%M%SZ).log"
exec > >(tee -a "$LOG") 2>&1
echo "log: $LOG"

for tool in git node npm ssh scp python3 curl shasum perl tar; do command -v "$tool" >/dev/null || die "missing tool $tool"; done
[ -d "$REPO/.git" ] || die "repo not found at $REPO"

# ------------------------------------------------------------------------------------------------------------------
step "checkout $REF -> $BUILD"
git -C "$REPO" fetch --prune origin
SHA="$(git -C "$REPO" rev-parse --verify "$REF^{commit}")"
git -C "$REPO" merge-base --is-ancestor "$SHA" origin/main || die "$SHA is not on origin/main"
git -C "$REPO" worktree prune
if [ -e "$BUILD" ]; then
  [ -f "$BUILD/.git" ] || die "$BUILD exists but is not a git worktree of $REPO"
  [ "$(git -C "$BUILD" rev-parse --git-common-dir)" = "$(git -C "$REPO" rev-parse --absolute-git-dir)" ] \
    || die "$BUILD is a worktree of another repository"
  git -C "$BUILD" checkout --quiet --force --detach "$SHA"
  git -C "$BUILD" reset --quiet --hard "$SHA"
else
  git -C "$REPO" worktree add --detach "$BUILD" "$SHA"
fi
# Clean everything else, ignored build output included; keep dependencies, the hosting manifest and local packages.
git -C "$BUILD" clean -ffdxq -e node_modules -e /.openai -e '/nexualpha-ui-*' -e /.nx-npm-ci.sha256
[ "$(git -C "$BUILD" rev-parse HEAD)" = "$SHA" ] || die "worktree HEAD is not $SHA"
[ -z "$(git -C "$BUILD" status --porcelain --untracked-files=no)" ] || die "worktree not clean after reset"
echo "commit $(git -C "$BUILD" log -1 --format='%h %s')"

STAMP="$(TZ=Asia/Shanghai date +%Y%m%dT%H%M)"
SHORT="$(git -C "$BUILD" rev-parse --short=7 HEAD)"
BUILD_ID="3.0-${STAMP}-GH-${SHORT}"
RELEASE="$(echo "gh-${STAMP}-${SHORT}" | tr 'T' 't')"
echo "$RELEASE" | grep -Eq '^gh-[0-9]{8}t[0-9]{4}-[0-9a-f]{7}$' || die "bad release name $RELEASE"
BASELINE="$(cat "$BUILD/BASELINE_BUILD_ID")"
SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=15 -o ServerAliveInterval=15 -o ServerAliveCountMax=4
          -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$BUILD/deploy/known_hosts")
remote true || die "ssh $SSH_HOST failed (host key must match deploy/known_hosts)"
echo "buildId $BUILD_ID  release $RELEASE"

# ------------------------------------------------------------------------------------------------------------------
step "live version gate"
public_build() { curl -fsS --max-time 15 -H 'cache-control: no-cache' "$SITE/version.json?ts=$(date +%s)" | sed -n 's/.*"buildId":"\([^"]*\)".*/\1/p'; }
LIVE_BUILD="$(public_build)" || die "cannot read live version.json"
[ -n "$LIVE_BUILD" ] || die "live version.json has no buildId"
echo "live: $LIVE_BUILD   repo baseline: $BASELINE"
case "$LIVE_BUILD" in
  "$BASELINE"|*-GH-*) ;;
  *) die "live build $LIVE_BUILD was not deployed from this repository; not overwriting it" ;;
esac
LIVE_SHA="${LIVE_BUILD##*-GH-}"
if [ "$LIVE_SHA" != "$LIVE_BUILD" ] && git -C "$REPO" cat-file -e "$LIVE_SHA^{commit}" 2>/dev/null; then
  git -C "$REPO" merge-base --is-ancestor "$LIVE_SHA" "$SHA" || die "live commit $LIVE_SHA is not an ancestor of $SHA (would deploy older code)"
fi

# ------------------------------------------------------------------------------------------------------------------
step "build"
cd "$PILOT"
grep -q 'build-route-css.mjs' package.json || die "npm run build no longer runs scripts/build-route-css.mjs"
grep -q 'verify-build-budget.mjs --strict' package.json || die "npm run build is no longer strict"
LOCK_SHA="$(shasum -a 256 package-lock.json | cut -d' ' -f1)"
if [ ! -d node_modules ] || [ "$(cat "$BUILD/.nx-npm-ci.sha256" 2>/dev/null)" != "$LOCK_SHA" ]; then
  echo "package-lock changed (or no node_modules): npm ci"
  rm -f "$BUILD/.nx-npm-ci.sha256"
  npm ci --no-audit --no-fund
  echo "$LOCK_SHA" > "$BUILD/.nx-npm-ci.sha256"
else
  echo "node_modules matches package-lock ($LOCK_SHA); npm ci skipped"
fi
npm run i18n:compile
# Hosting manifest: .openai/hosting.json is not in git; prepare-sites-build copies it into dist (build.yml "Hosting manifest").
mkdir -p .openai
if [ -s "$BUILD/.openai/hosting.json" ]; then cp "$BUILD/.openai/hosting.json" .openai/hosting.json; else echo '{}' > .openai/hosting.json; fi
node -e 'JSON.parse(require("fs").readFileSync(".openai/hosting.json","utf8"))' || die ".openai/hosting.json is not JSON"
if [ -f "$LOAD_GATE" ]; then zsh "$LOAD_GATE" || die "load gate gave up"; fi
npm run typecheck
BUILD_ID="$BUILD_ID" npm run build
node --test tests/dist-shell-contract.test.mjs
got="$(node -e 'console.log(require("./dist/client/version.json").buildId)')"
[ "$got" = "$BUILD_ID" ] || die "dist version.json buildId $got != $BUILD_ID"
BRIEFS="$PILOT/public/content/campaign-briefs.json"
[ -s "$BRIEFS" ] || die "missing $BRIEFS"
node scripts/validate-campaign-briefs.mjs "$BRIEFS"

# ------------------------------------------------------------------------------------------------------------------
step "package"
RESVG_VERSION="$(node -p 'require("./node_modules/@resvg/resvg-js/package.json").version')"
# Social cards need the linux resvg binaries on the server (gnu for node:*-bookworm, musl for Alpine); npm skips them on macOS.
npm install --no-save --no-audit --no-fund --force "@resvg/resvg-js-linux-x64-gnu@$RESVG_VERSION" "@resvg/resvg-js-linux-x64-musl@$RESVG_VERSION"
[ -d node_modules/@resvg/resvg-js-linux-x64-gnu ] && [ -d node_modules/@resvg/resvg-js-linux-x64-musl ] || die "linux resvg binaries missing"
PKG="$BUILD/nexualpha-ui-$RELEASE.tgz"
COPYFILE_DISABLE=1 tar --no-xattrs --no-mac-metadata -czf "$PKG" dist server server.mjs package.json src node_modules/@resvg
(cd "$BUILD" && shasum -a 256 "nexualpha-ui-$RELEASE.tgz" > "nexualpha-ui-$RELEASE.tgz.sha256")
PKG_SHA="$(cut -d' ' -f1 "$PKG.sha256")"
tar -tzf "$PKG" dist/client/version.json >/dev/null || die "package has no dist/client/version.json"
echo "package $(du -h "$PKG" | cut -f1) sha256 $PKG_SHA"

# ------------------------------------------------------------------------------------------------------------------
step "upload"
REMOTE_PKG="/data/wwwroot/nexualpha-ui-$RELEASE.tgz"
scp -q "${SSH_OPTS[@]}" "$PKG" "$SSH_HOST:$REMOTE_PKG.part"
remote_sha="$(remote "sha256sum $REMOTE_PKG.part" | cut -d' ' -f1)"
[ "$remote_sha" = "$PKG_SHA" ] || die "server sha256 $remote_sha != $PKG_SHA"
remote "mv -f $REMOTE_PKG.part $REMOTE_PKG"
echo "server sha256 matches"

# ------------------------------------------------------------------------------------------------------------------
step "stage standby (ALLOW_CTA_CHANGE=$ALLOW_CTA_CHANGE)"
STAGE_OUT="$LOG_DIR/stage-$RELEASE.out"
with_timeout 1200 ssh "${SSH_OPTS[@]}" "$SSH_HOST" \
  "env RELEASE=$RELEASE BUILD_ID=$BUILD_ID BASELINE_BUILD_ID=$BASELINE ALLOW_CTA_CHANGE=$ALLOW_CTA_CHANGE python3 -" \
  < "$BUILD/deploy/stage-remote.py" | tee "$STAGE_OUT"
NEW_PORT="$(sed -n 's/^STANDBY_READY .* on 127\.0\.0\.1:\([0-9][0-9]*\) buildId .*/\1/p' "$STAGE_OUT" | tail -1)"
[ -n "$NEW_PORT" ] || die "stage-remote did not report STANDBY_READY"

remove_standby() {
  # Only ever removes this run's standby, and never one nginx is pointing at.
  remote "set -e; C=/www/server/panel/vhost/nginx/nexualpha.com.conf
    if grep -q '127.0.0.1:$NEW_PORT;' \$C; then echo 'standby port is live in nginx; NOT removing'; exit 1; fi
    docker rm -f nexualpha-web-$RELEASE >/dev/null 2>&1 || true
    rm -rf -- /data/wwwroot/nexualpha-release-$RELEASE /data/wwwroot/nexualpha-release-$RELEASE.state.json
    echo 'standby nexualpha-web-$RELEASE removed; live untouched'"
}

# ------------------------------------------------------------------------------------------------------------------
step "pre-cutover regression gate (staged container via SSH tunnel)"
LPORT="$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1]); s.close()')"
ssh "${SSH_OPTS[@]}" -N -o ExitOnForwardFailure=yes -L "127.0.0.1:$LPORT:127.0.0.1:$NEW_PORT" "$SSH_HOST" &
TUNNEL_PID=$!
STAGED="http://127.0.0.1:$LPORT"
ok=""
for _ in $(seq 1 30); do
  b="$(curl -fsS --max-time 5 "$STAGED/version.json" 2>/dev/null | sed -n 's/.*"buildId":"\([^"]*\)".*/\1/p' || true)"
  [ "$b" = "$BUILD_ID" ] && { ok=1; break; }
  sleep 1
done
[ -n "$ok" ] || { remove_standby || true; die "tunnel to staged container did not serve $BUILD_ID"; }
QA_DIR="$LOG_DIR/qa/$RELEASE"
# Transport-only failures: every failed check is console-errors made only of net::ERR_* resets/empty responses, or a
# page load that failed with one of those errors through the tunnel, which
# is the SSH tunnel dropping connections, not the release. Prints the suites to re-run; exit 1 for any real failure.
tunnel_only_suites() {
  node -e '
    const j = require(process.argv[1]);
    const failed = j.results.filter((r) => !r.ok && !r.info);
    const codes = "(EMPTY_RESPONSE|INCOMPLETE_CHUNKED_ENCODING|CONNECTION_RESET|CONNECTION_CLOSED|CONNECTION_REFUSED)";
    const net = new RegExp(`^Failed to load resource: net::ERR_${codes}$`);
    const navigation = new RegExp(`^net::ERR_${codes} at http://127\\.0\\.0\\.1:`);
    const transport = (r) => (r.check === "console-errors" && Array.isArray(r.errors) && r.errors.length && r.errors.every((e) => net.test(e)))
      || (r.check === "load" && navigation.test(String(r.detail || "")));
    const ok = failed.length > 0 && failed.every(transport);
    if (!ok) process.exit(1);
    console.log([...new Set(failed.map((r) => r.suite))].join(","));' "$1"
}
if ! with_timeout 2400 npm run qa:regression -- --base "$STAGED" --out "$QA_DIR/pre-cutover"; then
  suites="$(tunnel_only_suites "$QA_DIR/pre-cutover/qa-regression.json" 2>/dev/null || true)"
  retried=""
  if [ -n "$suites" ]; then
    echo "pre-cutover gate: only tunnel transport errors (suites $suites); re-running those suites once on a fresh tunnel"
    kill "$TUNNEL_PID" 2>/dev/null || true; wait "$TUNNEL_PID" 2>/dev/null || true
    ssh "${SSH_OPTS[@]}" -N -o ExitOnForwardFailure=yes -L "127.0.0.1:$LPORT:127.0.0.1:$NEW_PORT" "$SSH_HOST" &
    TUNNEL_PID=$!
    for _ in $(seq 1 30); do curl -fsS --max-time 5 "$STAGED/version.json" >/dev/null 2>&1 && break; sleep 1; done
    if with_timeout 2400 npm run qa:regression -- --base "$STAGED" --only "$suites" --out "$QA_DIR/pre-cutover-retry"; then retried=1; fi
  fi
  if [ -z "$retried" ]; then
    remove_standby || true
    die "pre-cutover regression gate failed on the staged build (report $QA_DIR/pre-cutover/qa-regression.md); live untouched"
  fi
  echo "pre-cutover gate passed on retry of $suites (report $QA_DIR/pre-cutover-retry/qa-regression.md)"
fi
kill "$TUNNEL_PID" 2>/dev/null || true; TUNNEL_PID=""

# ------------------------------------------------------------------------------------------------------------------
step "cutover (zero downtime, polled)"
nginx_on_new() { remote "grep -q '127.0.0.1:$NEW_PORT;' /www/server/panel/vhost/nginx/nexualpha.com.conf"; }

rollback() {
  echo "POST-CUTOVER FAILURE: $1"
  echo "rolling back $RELEASE ..."
  if with_timeout 600 ssh "${SSH_OPTS[@]}" "$SSH_HOST" "env RELEASE=$RELEASE python3 -" < "$BUILD/deploy/rollback-remote.py"; then
    local back=""
    for _ in $(seq 1 20); do back="$(public_build || true)"; [ "$back" = "$LIVE_BUILD" ] && break; sleep 3; done
    if [ "$back" = "$LIVE_BUILD" ]; then
      echo "ROLLED_BACK $BUILD_ID -> $LIVE_BUILD (public version.json confirms)"
      exit 3
    fi
    echo "ROLLBACK RAN but public buildId is ${back:-unreachable}, expected $LIVE_BUILD — check production now" >&2
  else
    echo "ROLLBACK FAILED for $RELEASE — production needs a human: deploy/rollback-remote.py RELEASE=$RELEASE" >&2
  fi
  exit 4
}

if ! with_timeout 900 python3 "$BUILD/deploy/poll-cutover.py" "$SITE/?cutover_probe=1" -- \
     sh -c 'ssh "$@" < "$0"' "$BUILD/deploy/cutover-remote.py" "${SSH_OPTS[@]}" "$SSH_HOST" "env RELEASE=$RELEASE python3 -"; then
  if nginx_on_new; then
    CUT_OVER=1
    rollback "cutover reported a failure or a non-200 sample while nginx points at the new release"
  fi
  remove_standby || true
  die "cutover did not complete; nginx still on the previous release"
fi
CUT_OVER=1

# ------------------------------------------------------------------------------------------------------------------
step "post-cutover public checks"
ok=""; got=""
for _ in $(seq 1 20); do got="$(public_build || true)"; [ "$got" = "$BUILD_ID" ] && { ok=1; break; }; sleep 3; done
[ -n "$ok" ] || rollback "public version.json is ${got:-unreachable}, expected $BUILD_ID"
echo "public version $got"
for r in $ROUTES; do
  code="$(curl -s -o /dev/null --max-time 30 -w '%{http_code}' "$SITE$r" || true)"
  echo "$code $r"
  [ "$code" = "200" ] || rollback "$r returned $code"
done
page_has() { curl -fsS --max-time 30 "$SITE$1" | grep -q -- "$2"; }
# Pages link through /go/<venue> (every click carries the code), so they show the bare code; the referral URL itself
# is verified on the /go 302 targets below. (deploy.yml's 'ref=11350287' page grep predates /go and no longer matches.)
page_has /exchanges/binance '11350287' || rollback "Binance code 11350287 missing on /exchanges/binance"
page_has /exchanges/bitget 'C6PRAF' || rollback "Bitget code C6PRAF missing on /exchanges/bitget"
page_has /exchanges/okx 'nexu888' || rollback "OKX code nexu888 missing on /exchanges/okx"
echo "invite codes present on pages"
go_check() { # slug code — HEAD, never follow; 302 whose Location carries the code
  local slug="$1" code="$2" res status loc
  res="$(curl -sI -o /dev/null --max-time 20 -w '%{http_code} %{redirect_url}' "$SITE/go/$slug?src=deploy-probe" || true)"
  status="${res%% *}"; loc="${res#* }"
  echo "/go/$slug -> $status $loc"
  [ "$status" = "302" ] || rollback "/go/$slug returned $status, expected 302"
  case "$loc" in https://*"$code"*) ;; *) rollback "/go/$slug Location does not carry $code" ;; esac
}
go_check okx nexu888
go_check okx-apk NEXU888
go_check binance 11350287
go_check bitget C6PRAF

step "post-cutover regression gate (production)"
with_timeout 2400 npm run qa:regression -- --base "$SITE" --out "$QA_DIR/post-cutover" \
  || rollback "post-cutover regression gate failed on production (report $QA_DIR/post-cutover/qa-regression.md)"
echo "DEPLOYED $BUILD_ID (previous $LIVE_BUILD retained for rollback: RELEASE=$RELEASE deploy/rollback-remote.py)"

# ------------------------------------------------------------------------------------------------------------------
FOLLOWUP_FAILED=""
step "sync campaign briefs to the content mount"
MOUNT="$(remote "python3 -c 'import json,sys; print(json.load(open(\"/data/wwwroot/nexualpha-release-$RELEASE.state.json\")).get(\"content_mount\") or \"\")'")" || MOUNT=""
if [ -z "$MOUNT" ]; then
  echo "no content mount on the new container; briefs ship inside the release"
else
  case "$MOUNT" in /data/wwwroot/*/dist/client/content) ;; *) echo "unexpected content mount $MOUNT" >&2; FOLLOWUP_FAILED="$FOLLOWUP_FAILED briefs" ;; esac
  if [ -z "$FOLLOWUP_FAILED" ]; then
    local_sha="$(shasum -a 256 "$BRIEFS" | cut -d' ' -f1)"
    server_sha="$(remote "sha256sum $MOUNT/campaign-briefs.json 2>/dev/null | cut -d' ' -f1" || true)"
    if [ "$local_sha" = "$server_sha" ]; then
      echo "briefs synced (already identical, sha256 $local_sha)"
    elif scp -q "${SSH_OPTS[@]}" "$BRIEFS" "$SSH_HOST:$MOUNT/.campaign-briefs.json.$RELEASE.part" \
      && remote "set -e; cd $MOUNT; test \"\$(sha256sum .campaign-briefs.json.$RELEASE.part | cut -d' ' -f1)\" = $local_sha
        python3 -c 'import json; json.load(open(\".campaign-briefs.json.$RELEASE.part\"))'
        mkdir -p /data/backups/nexualpha/campaign-briefs
        if [ -f campaign-briefs.json ]; then cp -p campaign-briefs.json /data/backups/nexualpha/campaign-briefs/campaign-briefs.before-$RELEASE.json; fi
        chmod 644 .campaign-briefs.json.$RELEASE.part; mv -f .campaign-briefs.json.$RELEASE.part campaign-briefs.json"; then
      echo "briefs synced (sha256 $local_sha; previous copy in /data/backups/nexualpha/campaign-briefs)"
    else
      remote "rm -f $MOUNT/.campaign-briefs.json.$RELEASE.part" || true
      echo "briefs sync FAILED" >&2; FOLLOWUP_FAILED="$FOLLOWUP_FAILED briefs"
    fi
  fi
fi

step "keep the $KEEP_RELEASES newest releases"
if ! remote "env KEEP=$KEEP_RELEASES CURRENT=$RELEASE python3 -" <<'PY'
import glob, json, os, re, shutil, subprocess
keep_n = int(os.environ['KEEP']); current = os.environ['CURRENT']
conf = open('/www/server/panel/vhost/nginx/nexualpha.com.conf').read()
live_ports = set(re.findall(r'127\.0\.0\.1:(18\d{3});', conf))
names = sorted(os.path.basename(p)[len('nexualpha-release-'):] for p in glob.glob('/data/wwwroot/nexualpha-release-gh-*') if os.path.isdir(p))
running = set(subprocess.check_output(['docker', 'ps', '--format', '{{.Names}}'], universal_newlines=True).split())
keep = set(names[-keep_n:]) | {current}
state = '/data/wwwroot/nexualpha-release-%s.state.json' % current
if os.path.exists(state):
    keep.add(json.load(open(state))['old_container'][len('nexualpha-web-'):])
for rel in names:
    container = 'nexualpha-web-' + rel
    if rel in keep or container in running:
        continue
    st = '/data/wwwroot/nexualpha-release-%s.state.json' % rel
    if os.path.exists(st) and str(json.load(open(st)).get('new_port')) in live_ports:
        continue
    subprocess.run(['docker', 'rm', container], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    shutil.rmtree('/data/wwwroot/nexualpha-release-' + rel, ignore_errors=True)
    for f in [st, '/data/wwwroot/nexualpha-ui-%s.tgz' % rel, '/www/server/panel/vhost/nginx/nexualpha.com.conf.backup-' + rel]:
        if os.path.exists(f):
            os.remove(f)
    print('pruned ' + rel)
print('kept: ' + ' '.join(sorted(keep)))
PY
then echo "server prune FAILED" >&2; FOLLOWUP_FAILED="$FOLLOWUP_FAILED prune"; fi
# Local packages: the newest 5 stay next to the worktree.
ls -1t "$BUILD"/nexualpha-ui-*.tgz 2>/dev/null | tail -n +$((KEEP_RELEASES + 1)) | while read -r old; do rm -f -- "$old" "$old.sha256"; done

step "submit sitemaps"
SUBMIT_OUT="$LOG_DIR/sitemaps-$RELEASE.out"
if NODE_OPTIONS=--dns-result-order=ipv4first with_timeout 300 node scripts/search-engines.mjs submit | tee "$SUBMIT_OUT"; then
  # Lines are "<engine> <step> <status> <detail>"; every sitemap submission must answer 2xx.
  if awk '$2=="sitemap" { n++; if ($3 !~ /^2[0-9][0-9]$/) bad++ } END { exit (n > 0 && bad == 0) ? 0 : 1 }' "$SUBMIT_OUT"; then
    echo "sitemaps submitted"
  else
    echo "sitemap submit had failures (see above)" >&2; FOLLOWUP_FAILED="$FOLLOWUP_FAILED sitemaps"
  fi
else
  echo "sitemap submit FAILED" >&2; FOLLOWUP_FAILED="$FOLLOWUP_FAILED sitemaps"
fi

if [ -n "$FOLLOWUP_FAILED" ]; then
  echo "DEPLOYED $BUILD_ID and verified, but follow-up steps failed:$FOLLOWUP_FAILED" >&2
  STAGE="follow-up"; exit 5
fi
STAGE="done"
echo "LIVE $BUILD_ID"

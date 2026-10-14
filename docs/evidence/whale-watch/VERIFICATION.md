# Whale watch verification — 2026-10-14

Implementation is local only. No deployment, persistent service startup, or Telegram send was performed. Telegram integration is an unapplied patch because the external repository is outside the authorized write scope.

## Verified

Commands below ran from `pilot-01-prototype/`, preceded by `zsh /Volumes/致态2TB/nx-agents/load-gate.sh &&`:

- `npm run typecheck && npm run i18n:compile`: exit 0.
- `npm run build`: exit 0, including strict build budget.
- `npm run test:sites`: 1,873 tests; 1,871 passed, zero failed, two skipped.
- `node scripts/verify-whale-watch-browser.mjs tests/fixtures/whale-watch-layout.json --http-only`: all 17 built locale routes returned HTTP 200 with eight ItemList entries; empty home feed rendered zero rows. This fixture is synthetic layout evidence, not live activity.
- `node scripts/verify-build-budget.mjs --strict`: PASS; initial home JavaScript is 330,009 gzip bytes against the 350,000-byte limit.

From repository root, also behind the load gate:

`node --test pilot-01-prototype/tests/whale-collector.test.mjs pilot-01-prototype/tests/whales-source.test.mjs pilot-01-prototype/tests/position-radar.test.mjs pilot-01-prototype/tests/radar-api.test.mjs`: 43 passed, zero failed.

`node --check` passed for the collector, server radar, and browser QA script. `PYTHONPYCACHEPREFIX="$PWD/.private/whale-python-cache" python3 -m py_compile deploy/stage-remote.py` and `git diff --check` passed.

Local logs are ignored under `pilot-01-prototype/.private/whale-watch/`; HTTP/browser evidence is under `pilot-01-prototype/.private/whale-watch-browser/`.

## Gaps and recovery conditions

- The requested 360/390/1440 real-UA screenshot matrix was not completed. Shell Chrome launch failed; automatic approval review rejected browser viewport/UA emulation because permission was declined. No workaround was attempted after rejection. Read-only default-width browser evidence is not a substitute for that matrix or CLS/contrast verification.
- A public collector smoke produced transfers, but Hyperliquid timed out. Real Hyperliquid positions and mature multi-day accumulation require a successful source response and retained observations; first observation deliberately remains a baseline.
- SPL, token top-holder growth, and DEX-buy adapters are not implemented. Supported accumulation signals use observed Hyperliquid additions and repeated exchange withdrawals.
- Load-gate process/system probes emitted sandbox permission warnings; passing the gate does not establish verified host headroom.
- The shared checkout Git index cannot be written: `/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-whale-watch/index.lock` returns EPERM. A local recovery repository on branch `codex/whale-watch` plus a thin bundle/patch retains the commit without changing the inaccessible checkout index. Integration into the original branch requires restoring access to that Git metadata.

## Final Telegram-only follow-up

After the full site suite, locale/action handling changed only in the prepared Telegram artifacts. The final targeted command, behind the load gate, was `node --test ops/channel-feed/whale-alert-template.test.mjs ops/telegram-miniapp-whales/artifacts.test.mjs`: 12 passed, zero failed. The entire site suite was not repeated for this artifact-only follow-up.

`git -C /Users/bestberlin/Documents/ChatGPT/Telegram apply --check /Volumes/致态2TB/nx-wt-codex-whale-watch/ops/telegram-miniapp-whales/miniapp-home-integration.patch` passed. In the isolated worktree copy with external dependencies accessed read-only, `./node_modules/.bin/vitest run apps/miniapp/app/whale-board.test.tsx` passed eight tests. TypeScript verification passed with:

```sh
./node_modules/.bin/tsc --noEmit --jsx react-jsx --moduleResolution bundler --module esnext --target es2020 --lib dom,dom.iterable,esnext --allowJs --skipLibCheck --strict false --esModuleInterop --types vitest,node apps/miniapp/app/whale-board.tsx apps/miniapp/app/whale-board.test.tsx apps/miniapp/app/tg-bridge.ts apps/miniapp/app/market-policy.ts packages/contracts/src/official-resources.js
```

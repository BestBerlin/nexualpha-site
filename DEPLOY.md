# Deploying nexualpha.com

Source of truth for the site. `BASELINE_BUILD_ID` is the production build this source came from.

## How a release goes out

GitHub → Actions → **Deploy to production** → Run workflow. Nothing deploys on push.

1. **Build** – the same 7 steps as the hand-built releases (typecheck, client, SSR, news SSR,
   prerender manifest, sites prep, strict budget). buildId `3.0-<Shanghai time>-GH-<commit>`.
2. **Live-version gate** – live buildId must be `BASELINE_BUILD_ID` or a `-GH-` build. If someone
   released outside this repo, the deploy stops instead of overwriting their work.
3. **Standby** – new container on a free port next to the live one; 13 routes must return 200 and
   report the new buildId.
4. **CTA gate** – registration / invite links on home, directory, Binance, Bitget, OKX and
   compare pages must be identical to live (override only with `allow_cta_change`).
5. **Cutover** – one Nginx upstream port change, `nginx -t`, reload; restored on any error.
6. **Public checks** – version, 13 routes, invite codes `ref=11350287`, `C6PRAF`, `nexu888`.
   Any failure rolls back automatically. The old container keeps running.

Undo later with **Rollback production** and the release name from the deploy summary.

## One-time setup

- Secret `DEPLOY_SSH_KEY`: dedicated key created by `deploy/setup-deploy-key.sh` (run on the Mac).
- Optional secret `HOSTING_JSON`: contents of `.openai/hosting.json` (not used by the Docker server).
- Server address in `deploy/server.conf`; host keys pinned in `deploy/known_hosts`.

## Not in git

`node_modules`, `dist`, `.private` (local analytics), `.openai`, env/key files, two fixtures over
GitHub's size limit (`tests/fixtures/r276-*`, `r237-*`), and generated `src/paraglide`
(rebuilt by `npm run i18n:compile`).

# Local dev loop (CEO decision 2026-10-09) — replaces "push → wait for GitHub build → download preview"

Why: cloud builds took ~4 min + download; the user's Mac mini (linked via the device bridge) builds in ~7 s.

## Where things live
- Mac clone: `$HOME/mnt/Crypto聚合/_dev/nexualpha-site` (inside the VM bridge; real path `/Users/bestberlin/Documents/ChatGPT/Crypto聚合/_dev/nexualpha-site`). `pilot-01-prototype/node_modules` is installed (Linux aarch64, for bridge use).
- Cloud: `/home/claude/nexualpha-site` (has GitHub auth + Chromium + Playwright). Only the cloud can push/deploy.
- The bridge VM has NO browser (Playwright Chromium download is blocked) and NO GitHub auth.

## One iteration (≈1–2 min)
1. Work in your own Mac worktree: `cd $HOME/mnt/Crypto聚合/_dev/nexualpha-site && git worktree add ../wt-<name> -b v6rNN-<name> v6-merged10 && ln -s "$PWD/pilot-01-prototype/node_modules" ../wt-<name>/pilot-01-prototype/node_modules`. Edit files there with device_bash (or Edit via staged copy).
2. Build: `cd ../wt-<name>/pilot-01-prototype && (NODE_USE_ENV_PROXY=1 npm run i18n:compile) && npx vite build` (~8 s; client only).
3. Pack: `cd dist && tar czf ../../dist-<name>.tgz client`; then `mcp__remote-devices__device_stage_files` the tgz (lands in cloud `/mnt/user-data/uploads/Crypto聚合/_dev/...`).
4. Cloud: unpack to `/home/claude/localdist/<name>`, serve with `python3 /home/claude/localdist/serve.py <dir> <port>` (SPA fallback server; use ports 52xx–54xx, never 5060/5061), then run `tools/voidscan.py` / `tests/e2e/run.py --base http://127.0.0.1:<port>` / screenshots. This client-only build has no SSR/prerender: JS-off checks and per-route CSS chunk checks still need a GitHub build.
5. Commit on the Mac worktree. To deliver: `git bundle create ../<name>.bundle v6-merged10..v6rNN-<name>`, stage it, then in cloud `git fetch <bundle> v6rNN-<name>:v6rNN-<name> && git push origin v6rNN-<name>`.
6. Release path is unchanged: merge → GitHub build → e2e (`--serve`/`--base`) → regression review → deploy.yml.

## Rules
- Small tasks: one agent = one defect class, target ≤ 60 min. Max 4 agents in parallel.
- Never `pkill -f`; free ports with `fuser -k PORT/tcp`; delete scratch when done.
- Deletion in the Mac folder was approved for this session only inside `Crypto聚合/`; only delete your own worktree/scratch.

## Division of labour (decided 2026-10-09)

**Mac mini, local Claude Code (user's installed skills: frontend-design, impeccable, taste/redesign, design:*, modern-web-guidance):**
edit CSS/JSX in a worktree → `npm run i18n:compile` → `npx vite build` (~8s) → look at it → commit → `git bundle`.
Only touch layout, type, motion. Never touch `partner-registry.js`, invite codes, registration hrefs, `rel=sponsored`, or SEO fields (title, description, canonical, h1 text, JSON-LD).

**Cloud (CEO session):** merge branches (check `v6/index.css` imports resolve), GitHub build, e2e (`tests/e2e/run.py`, incl. JS-off/CSS/CTA gates), independent review, deploy from `main` via `deploy.yml`, verify live.

**Cloud skills now visible in the session:** design:design-critique, design:accessibility-review, impeccable, modern-web-guidance, searchfit-seo (report-only until SEO fields are approved).

Cloud disk: run e2e with `TMPDIR=/dev/shm`; delete preview dirs after each run; do not delete `/home/claude/nexu` (local-only repo, no remote).

# Verification scope

Vector boards, model views and sticker preview were rasterized with the installed `@resvg/resvg-js`, then visually inspected. Automated checks validate asset counts, SVG parseability/layer IDs, signals, local page references, export dimensions/transparency, and the actual GSAP timeline/controls in JSDOM. JSDOM SVG geometry is stubbed; its checks prove timeline/control logic, not browser rendering or CSS geometry.

Browser checks at 390 / 768 / 1440 could not run in this session:

- `python3 -c 'from playwright.sync_api import sync_playwright; p=sync_playwright().start(); b=p.chromium.launch(); print("Chromium launch OK"); b.close(); p.stop()'` failed with `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer.89738: Permission denied (1100)` and Chromium `SIGTRAP`.
- Chrome + computer-use rejected `file:///Volumes/.../ops/brand/mascot/board.html`: `Browser use cannot visit the requested page. The requested URL protocol is not allowed. Allowed protocols: "http:", "https:".` Its policy prohibits working around that refusal; no workaround was attempted.

Recovery: have the lead preview the HTML in a permitted browser context, verify board and demo at 390 / 768 / 1440, test real SVG transforms/blink/pause and reduced motion, and capture actual HTML screenshots if required. Current exported boards are explicitly vector-composed, not browser screenshots.

`visual-verdict` is installed but deprecated and says not to invoke it. Its replacement explicitly excludes deterministic SVG/code-native assets. A direct vector review record is retained instead of inventing a numerical fidelity score or starting an OMX runtime workflow.

## Site suite

`cd pilot-01-prototype && npm test` exited 1 after typecheck passed and the `test:sites` stage reported 1,137 tests: 1,129 passed, 3 failed, 5 skipped. Later chained whole-site stages did not execute. All three failures concern absent site build artifacts in this fresh worktree (`dist/news-ssr/entry-server.js`, `dist/client/index.html`, prerender inputs), outside the mascot asset scope. Their names were not in the supplied historical 57-failure list; do not call them baseline-matched failures or claim the full suite is green. No existing application file or test assertion was changed. See `site-tests.log` for exact output.

## Local commit blocker

`git add ops/brand/mascot` failed: `fatal: Unable to create '/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-mascot-a/index.lock': Operation not permitted`. Directory ownership appears normal, but the session sandbox refused the Git metadata write. Branch is `codex/mascot-a`; all task files remain untracked and uncommitted. `COMMIT-MESSAGE.txt` supplies the intended Lore-format message for the lead after permitted metadata writes are restored.

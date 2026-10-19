# Neutral hero validation

Worktree: `/Volumes/致态2TB/nx-wt-codex-neutral-hero`, branch `codex/neutral-hero`.
All commands run from `pilot-01-prototype/`.
For Node validation, `TMPDIR=/Volumes/致态2TB/nx-wt-codex-neutral-hero/.task-tmp` keeps temporary files on the external SSD (the internal volume was full).

## Verified

- `node scripts/build-home7-css.mjs`: generated the checked-in stylesheet.
- `node --test tests/neutral-hero.test.mjs tests/home-hero-volume.test.mjs tests/ticker.test.mjs`: 32 passed, 0 failed (`targeted-tests.log`). Includes all 17 copy locales, six neutral locale SSR pages, an English Vietnam jurisdiction ban, exact calculator data/order, no referral links/codes, seeded ticker HTML equality, promotional hero preservation, and a hydrated perpetual-to-spot product toggle.
- `node --test --test-name-pattern='homepage hero keeps registration primary' tests/frontend-contract.test.mjs`: 1 passed, 0 failed (`frontend-contract.log`). The prior file-wide prohibition of calculator anchors is now scoped to the promotional hero, with explicit neutral-hero assertions.
- `npm run build`: exit 0, including strict budget; final entry static closure is 341,256 bytes gzip / 350,000 allowed (`build.log`, `build-budget.json`). The worktree needed the existing ignored `.openai/hosting.json` copied from the main checkout; it is not committed.
- `git diff --check`: exit 0.

## Browser acceptance is blocked

Command: `BASE=http://127.0.0.1:5178 python3 qa/neutral-hero.py`.
The local server was started with `npx vite --host 127.0.0.1 --port 5178` and stopped after the checks.

Playwright's Chromium launch failed before opening a page:
`bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer…: Permission denied (1100)`.
See `playwright-blocked.log`. The connected Chrome tab exposed the expected localized content through its accessibility tree, but viewport setup timed out. Browser inventory subsequently returned no connected browsers, and the native Chrome app also timed out. This is not screenshot or geometry evidence.

No screenshots were captured. Pending screenshot matrix: `ru`, `vi`, `ar`, `zh-hant` × `390`, `768`, `1440` (12 images). No claim of visual approval, zero browser overflow, or completed Playwright acceptance is made.

The QA script is in this worktree at `qa/neutral-hero.py`; its default output directory is this evidence directory. The brief's external QA/archive paths were not written because the current task restricts writes to this worktree. `OUT` can select the requested archive directory when run in an authorized environment. The script checks all six neutral locales at all three widths (18 cases).

The chips reuse the existing shared BTC/ETH/SOL ticker subscription; missing market data renders dashes. No liquidation figure is fabricated. The card's update date comes from the existing fee verification dates, not the render clock.

## Full suite result

`npm test` exited 1 after typecheck passed and `test:sites` finished: 2,174 passed, 1 failed, 3 skipped (2,178 total). The only failing test is `academy data generator reproduces checked-in generated files`: missing `/Users/bestberlin/Documents/ChatGPT/Crypto聚合/.gemini-v3/out/E01.json` (`ENOENT`). Both the generator and its test match HEAD unchanged. This failure is absent from the supplied historical 57-name baseline, so a literal no-new-failing-name comparison cannot be claimed. No task-related assertion failed. The later whole-site stage was not reached. See `npm-test.log`, `academy-existing-failure.log`, and `suite-summary.json`.

`node scripts/verify-build-budget.mjs --strict` also passed independently (`budget.log`).

## Local commit is blocked

`git add <task files>` exits 128: Git cannot create `/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-neutral-hero/index.lock` (`Operation not permitted`). No commit was created. Changes remain on `codex/neutral-hero`. The worktree root contains `neutral-hero.patch` and `neutral-hero.commit-message.txt` for recovery once Git metadata writes are permitted. Generated public data was restored byte-for-byte from HEAD through read-only `git show`; no `src/data` file changed.

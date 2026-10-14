# Telegram Mini App whale-board artifacts

Write boundary note: `/Users/bestberlin/Documents/ChatGPT/Telegram` was inspected read-only. These files are the prepared replacement artifacts for `apps/miniapp/app/` in that external repository; this worktree does not apply them directly.

Expected external placement:

- `whale-board.tsx` -> `apps/miniapp/app/whale-board.tsx`
- `whale-board.css` -> `apps/miniapp/app/whale-board.css`
- `whale-board.test.tsx` -> `apps/miniapp/app/whale-board.test.tsx`
- `miniapp-home-integration.patch` -> apply from the external Telegram repository root after adding the files above

Home integration patch in the external Mini App should replace imports/usages of `MoversBoard` from `./movers-board` with `WhaleBoard` from `./whale-board`, and import `./whale-board.css` instead of `./movers-board.css`. A ready patch is included in `miniapp-home-integration.patch`.

Data contract used by the board matches the site collector handoff:

- Primary feed: `/api/site/whales`
- Fallback feed: `https://nexualpha.com/api/whales.json`
- Feed envelope: `schemaVersion: 2`, `status: "ok"`, `updatedAt`, and top-level `rows[]`
- Row fields supported for display: `id`, `category`, `signalType`, `eventType`, `platform`, `coin` or `asset`, `totalUsd`/`notionalUsd`/`amountUsd`, `periodHours`, `avgEntry`, `entryPx`, `pnlUsd`, `sentence` or `explanation`, `time`, optional whitelisted `explorerUrl`
- Legacy staging arrays are still tolerated: `signals[]` first, then `positions[]`, then `transfers[]`


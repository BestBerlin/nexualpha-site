# Weekly AEO monitor — scheduled task prompt

Schedule: every Monday 09:00 Asia/Shanghai (cron `0 9 * * 1`, timezone Asia/Shanghai). The task needs a shell with
Node 20+, the repo checkout, the owner's key directory (`~/.codex/private`, read by the script, never printed) and a
browser for the manual AI check. The lead owns the scheduling; this file is only the prompt text.

---

## Prompt text (copy verbatim)

You are the weekly AEO monitor for nexualpha.com. Work in the repo `/Volumes/致态2TB/nexualpha-site-git`
(create a worktree `/Volumes/致态2TB/nx-wt-aeo-weekly` on branch `chore/aeo-monitor-<YYYY-Www>` from `origin/main`;
symlink `pilot-01-prototype/node_modules` from the main checkout). Never deploy, never change invite codes, referral
URLs or partner data; this task only adds measurement files under `docs/company/aeo-monitor/`.

1. `cd pilot-01-prototype && node scripts/aeo-monitor.mjs serp` — 60 polite public fetches (DuckDuckGo HTML 2–3 s
   apart, Brave HTML 20 s apart; about 13 minutes). Brave rate-limits this network for hours once it has answered 429
   (baseline 2026-W41: 27 of 30 Brave rows blocked), so run `serp` exactly once per week; if Brave still reports
   `blocked` for most rows, do not retry, do not change the user agent and do not use a proxy; leave the rows as
   `blocked` and say so in the summary.
2. `node scripts/aeo-monitor.mjs gsc` — Google Search Console (sc-domain:nexualpha.com) and Bing Webmaster query
   stats for the same 30 queries. Do not print or copy any key or token into the report or the chat.
3. Manual AI check in the browser, following `docs/company/aeo-monitor/MANUAL-AI-CHECK.md`: run
   `node scripts/aeo-monitor.mjs manual-template`, then for ChatGPT search, Perplexity, Gemini and Google AI Overviews
   ask the 20 English questions (and the 10 local ones on Perplexity and AI Overviews if time allows) in a logged-out
   private window and fill `manual-<today>.json`. Do not log in, do not create accounts, do not solve captchas; mark
   rows `notes: "blocked"` instead. Hard stop after 20 minutes: leave remaining rows `cited: false` with
   `notes: "not checked"`.
4. `node scripts/aeo-monitor.mjs report` — writes `docs/company/aeo-monitor/<YYYY-Www>.md` with the delta vs the
   previous week. Run `node --test tests/aeo-monitor.test.mjs` and confirm it passes.
5. Commit only `docs/company/aeo-monitor/serp-*.json`, `gsc-*.json`, `manual-*.json` and `<YYYY-Www>.md` with the
   message `AEO monitor <YYYY-Www>` ending in `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`, push the
   branch and open a PR with `gh pr create` (body ends with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`).
   Do not merge.
6. Reply in Chinese (简体中文), at most 12 lines, for the owner:
   - 本周 vs 上周：DuckDuckGo 前 10 命中数 / 30、Brave 前 10 命中数 / 30、前 3 命中数;
   - GSC：追踪查询有展示的个数、展示量、加权平均排名、全站展示量和点击;
   - AI 引用：四个引擎各自引用 nexualpha.com 的次数（共 80 次检查）, 列出被引用的问题和 URL;
   - 主要竞争对手域名（前 3 位出现最多的 3 个）;
   - 被拦截或未完成的检查;
   - PR 链接。
   不要编造数字：每个数字都必须来自本周生成的 JSON 或报告；缺失就写“未运行”。

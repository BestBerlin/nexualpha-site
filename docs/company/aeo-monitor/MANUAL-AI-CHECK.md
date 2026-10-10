# Manual AI citation check (20 minutes, weekly)

Purpose: record whether ChatGPT search, Perplexity, Gemini and Google AI Overviews cite **nexualpha.com** for the fixed
20-question set. No automation, no login scripts: a person (or the scheduled task's browser) asks each question by hand
and fills one JSON file. The `report` command merges it with the SERP and Search Console numbers.

## Before you start (1 min)

```
cd pilot-01-prototype
node scripts/aeo-monitor.mjs manual-template          # writes docs/company/aeo-monitor/manual-<today>.json (80 rows)
node scripts/aeo-monitor.mjs questions                # the 20 questions (en + zh/tr/ru/vi/es)
```

Use a browser that is **logged out** of all four services, in a fresh private window per engine. Ask in English unless
the row's market is tr / vi / es / ru / id, then ask in that language (the `SERP local` line printed by `questions`).
Do not sign in, do not create accounts, do not solve captchas; if an engine demands either, record `notes: "blocked"`
for the remaining rows and move on.

## Where to ask

| engine key | Where | What counts as "cited" |
|---|---|---|
| `chatgpt-search` | chatgpt.com, logged out, toggle Search (globe icon) | nexualpha.com appears in the inline sources or the "Sources" drawer |
| `perplexity` | perplexity.ai, logged out | nexualpha.com appears in the numbered source list |
| `gemini` | gemini.google.com (needs a Google account: if you are not already signed in on the machine, skip Gemini and note `"notes": "not signed in"`) | nexualpha.com appears under "Sources"/"Related content" or as an inline chip |
| `google-ai-overview` | google.com search for the question (English: US results, local: switch the region at the bottom of the page) | nexualpha.com is one of the linked sources inside the AI Overview box (not the organic results below) |

`rank_of_citation` is the 1-based position of nexualpha.com among that answer's sources (1 = first source shown).
`competitor_domains` lists the domains that were cited instead or alongside (max 5, hostname only, no `www.`).

## Time budget

20 questions × 4 engines = 80 checks. Spend at most 15 seconds per check: ask, scan sources, record. Do the
English questions for all four engines first (about 14 minutes); do the 10 local-language variants only on
Perplexity and Google AI Overviews if time remains (they are the engines where locale changes the answer).

## Record

Edit `docs/company/aeo-monitor/manual-<YYYY-MM-DD>.json`. One row per engine × question:

```json
{
  "engine": "perplexity",
  "questionId": "okx-vs-binance-fees",
  "question": "OKX vs Binance fees",
  "cited": true,
  "rank_of_citation": 3,
  "cited_url": "https://nexualpha.com/compare/binance-vs-okx",
  "competitor_domains": ["okx.com", "binance.com", "bitdegree.org"],
  "notes": ""
}
```

Rules: `cited` is a boolean; `rank_of_citation` and `cited_url` are `null` when not cited; never guess a URL: copy it
from the source link. Fill `operator` and `durationMinutes` at the top of the file.

Then run `node scripts/aeo-monitor.mjs report` and commit the JSON and the report.

## Files in this folder

- `serp-<YYYY-Www>.json` — DuckDuckGo + Brave top-10 presence for 30 queries (`serp` command)
- `gsc-<YYYY-Www>.json` — Google Search Console + Bing Webmaster rows for the same queries (`gsc` command)
- `manual-<YYYY-MM-DD>.json` — this manual check
- `<YYYY-Www>.md` — the weekly report with deltas (`report` command)
- `TASK-PROMPT.md` — prompt for the weekly scheduled task

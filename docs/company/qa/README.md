# Full-site QA (started 2026-10-11)

Live version at start: 3.0-20261011T0729-GH-a3795ed. Scripts (run from `pilot-01-prototype/`):

- `node scripts/qa-http-sweep.mjs <urls.txt> <out.jsonl> --crawl` — status, canonical, robots, title/description budgets,
  H1 count, hreflang, placeholder smells, internal-link crawl + broken links. Input: the four sitemaps' URLs.
- `python3 scripts/qa-browser-sweep.py <urls.txt> <out.jsonl> 390,1440` — Chromium: console/page errors, failed
  requests, horizontal overflow, clipped text (sr-only spans are false positives), tap targets < 24px, broken images,
  CLS, H1 count. Template × locale list = `browser-list2.txt` (285 pages); template list at 320/768/1024.
- `python3 scripts/qa-flows.py` — key user paths with business assertions (search, filter, detail, compare, calculator,
  news search + empty state, language switch, deep link + back, 404, Telegram CTA, activities).

Coverage ledger: `coverage.md` (updated per batch). Issue log: `issues.md`.

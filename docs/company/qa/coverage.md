# Coverage ledger (updated 2026-10-11)

| Scope | Checked / total | Method | Result |
|---|---|---|---|
| Sitemap URLs (4 sitemaps) | 1,898 / 1,898 | HTTP sweep | 0 non-200; 6 sitemap-noindex (fixed); 706 zero-H1 compare pages (fixed by PR #60 policy) |
| Internal links discovered by crawl | 1,333 / 1,333 | HTTP sweep | 4 broken (`/compare/hashkey-vs-kraken`, fixed) |
| Template × locale pages in Chromium (390 + 1440) | 285 pages / 570 loads | browser sweep | 0 horizontal overflow, 0 broken images, 0 non-200, 0 H1 errors; 2 console errors (/tr/activities #418, open); CLS > 0.25 on 124 loads (news, activities, topics/factbook fallback locales, locale homes) — #1 #2 #10 #13 |
| Template pages at 320 / 768 / 1024 | 30 pages / 90 loads | browser sweep | 0 overflow; small tap targets on /about (fixed) |
| Key user paths (13 flows × 390 / 1440) | 26 / 26 pass (build 756b54e) | qa-flows.py | directory search + DEX filter, detail CTA, compare CTAs, calculator, news search + empty state, Turkish page, language menu (header / drawer), deep link + back, 404, Telegram CTA, activities official links, no page errors |
| Localization (14 locales × 18 templates) | 252 / 252 | l10n.py | Before: 132 pages with English UI copy. After PR #63 (live cbe22fb): identical-to-English segments 2,036 → 934 locally (agent), 1,147 on live by this script — remaining are data (official announcement titles, URLs, codes, article headlines) plus exchange-research fact notes (open) |
| Performance (settled JS, live) | 5 pages × 2 widths | settled.py | home 1802 → 340 KB; /news 8 → 27; /exchanges 456 → 1003 → 437 KB (regression found and fixed); /exchanges/okx 8 → 577 KB (now hydrates; #15 open) |

Not covered yet: physical devices (only Chromium emulation), Safari/Firefox, screen-reader run-through, slow-network throttling.

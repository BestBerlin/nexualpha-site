# Direction A: Editorial finance

## Concept
1. NexuAlpha reads like a printed financial weekly: a dated masthead with double rule, "edition" line, ranked ledger.
2. Rankings are a typeset table with hairline rules, not a grid of cards.
3. Serif carries voice (headlines, verdicts, big numerals); grotesque carries UI (labels, buttons, fees).
4. One vermilion accent marks only action and emphasis: CTA, rank 1, winning cell, italic keyword.
5. Referral codes are shown as dashed "coupon" tags; disclosure is always visible.

## Tokens
- Palette: paper #F4EFE4, paper-2 #EBE4D3, ink #16130F, ink-2 #4B443A, mute #857C6D, hairline ink at 18%, vermilion #C23B1B. Dark mode variant included.
- Type: Newsreader (display/verdicts) with Charter/Georgia fallback; Hanken Grotesk (UI) with Carlito fallback. Tabular lining numerals on all data.
- Scale (7 steps): 12 / 14 / 16 / 20 / 28 / 40 / 64 px, 4px baseline, 12-col grid, 24px gutter, 1344 max width. Mobile steps down 64->40, 40->32, 28->24.
- Labels: uppercase 12px, max two words.

## Distinct
- Double-rule masthead and dateline, no navbar chrome.
- Ranking as ledger rows with oversized serif numerals; no identical rounded cards.
- Single accent, used as a signal rather than decoration.
- Italic serif "vs" and "versus" as typographic devices.

Files: home.html, compare.html, binance.html (src/ holds parts, build.py assembles). Screenshots in shots/. Fees and asset counts are indicative placeholders to verify; Bybit/OKX/Binance link formats are assumed.

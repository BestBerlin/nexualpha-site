# Direction B - Precision Instrument (NexuAlpha)

**Concept.** A calm dark-graphite instrument panel. The comparison matrix is the hero object: 1px hairlines, tabular mono figures, step-line tier sparklines (small multiples), compact segmented controls, keyboard-hint chips. One signal accent (amber) marks selection, the primary CTA and "better" values; nothing else is coloured.

**Files.** home.html, compare.html, binance.html (single-file, inline CSS); shots/{page}-{1440,390}.png. Fonts: IBM Plex Sans + JetBrains Mono via Google Fonts, fallbacks Carlito / DejaVu Sans Mono.

**Tokens.** bg #0e0f10, panel #131415, line #25282a / #363a3d, ink #e9e7e2, mute #9a9da0, dim #666a6e, amber #f2a93b (ink-on-amber #1a1203). 4px unit; 12-col grid, 24px gutter, 32px (16px mobile) page pad. Type steps (7): 11 mono label, 12, 14, 16, 20, 28, 48 (28 on mobile H1). Labels are <=2 words, uppercase mono.

**Distinctiveness.** Data-first rows rather than cards; mono tabular alignment; step-curve sparklines per row and an overlay curve in compare; amber-tinted selected rows with a 2px tick; kbd chips as real affordance hints; referral code shown as a dashed "coupon" chip before the CTA. Mobile turns matrix rows into stacked spec blocks (no horizontal scroll, verified scrollWidth=390).

**Caveat.** Fee numbers, tier curves, pair counts and region notes are indicative placeholders; verify against official pages before shipping. Only Binance/OKX/Bybit/Bitget carry referral codes, others show "No code".

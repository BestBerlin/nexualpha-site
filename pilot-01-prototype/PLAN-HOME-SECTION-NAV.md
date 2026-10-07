# R286 HomeSectionNav mobile touch plan

Scope: only `src/styles/v3-layout-stability.css` HomeSectionNav mobile rules and one targeted regression test.

Observed issue from root evidence: DE 320px home section nav renders four links in one row with 27.59px height, 12px text and `overflow-wrap:anywhere`, causing broken words and sub-44px targets.

Change plan:
1. Preserve desktop/tablet behavior and bottom nav.
2. For `max-width:480px`, switch `.home-section-nav` to a two-column grid.
3. Give each anchor `min-height:44px`, start alignment, natural wrapping (`break-word`, `word-break:normal`), and remove the 28vw cap.
4. Keep original text, href order, colors, and registry unchanged.

Verification:
- Targeted source test protects href order, selector scope, exact inverse patch to the backup, and partner registry SHA.
- Typecheck only; root owns real browser geometry.

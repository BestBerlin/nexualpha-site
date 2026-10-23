# Inner visual v2 — lead browser review

These are full SSR documents exported through the actual Worker and built React renderer. They are **not screenshots or proof of browser geometry/CLS**. The same HTML serves every breakpoint; CSS selects its layout. Asset paths are absolute (`/assets`, `/brands`, fonts), so review against this worktree's matching `dist/client` build or normal preview origin, not an unserved `file://` document. Regenerate with `node scripts/render-inner-visual-evidence.mjs` after `npm run build`.

## Route inventory

- `venue-bitget-zh.html`: `/zh-hans/exchanges/bitget`
- `venue-okx-en.html`: `/exchanges/okx`
- `article-en.html`: `/news/how-to-onboard-gate-with-kyc-fund-password-whitelist-and-cooldown-checks`
- `article-zh.html`: `/zh-hans/news/how-to-onboard-gate-with-kyc-fund-password-whitelist-and-cooldown-checks`
- `compare-binance-okx-en.html`: `/compare/binance-vs-okx`

`ssr-manifest.json` records status and sizes. Both article editions come from the existing published feed. Figures repeat complete authored statements, never inferred fees or metrics. Unsupported/ambiguous numeric passages have no fact tile. Categorical compare cells have document markers rather than invented scores.

## Per-breakpoint layout description (CSS intent, pending rendered verification)

| Page | 390px | 768px | 1440px |
| --- | --- | --- | --- |
| Venue, en + zh | Existing mobile hero/signup order; one-column icon fact tiles, source/date inside each tile. Maker/taker rows keep side, mono value and median mini chart on one shared axis. Single-column requirement tiles; icon FAQ summaries remain native disclosures. Related art cards fill available width. | Existing tablet hero ordering; two-column fact and requirement tiles. Fee chart has separate product median/count labels. Related cards use auto-fill with a 300px minimum. Sources hub stays collapsed until opened. | Existing hero reading/sidebar structure; paired fact tiles, wide fee axis, two-column account tiles. Related cards fill available route width. Sources and app links have fixed SVG anchors. |
| Article, en + zh | Reserved 120px category art above title; original reading order and prose retained. Numeric cards stack with full context. Related cards use two columns (one below 360px). Tables scroll inside their own panels. | Reserved 160px banner; numeric cards auto-fit from 190px. Original reading measure and collapsed section index remain. Related art uses the existing grid with panel/card treatment. | Reserved 160px banner with category glyph or official exchange mark. Original 68ch editorial measure and sticky index at 1024px remain. Numeric facts, quotes, tables and related art form visual anchors; CTA retains its disclosure. |
| Compare | Two eager 64px official tiles face the mono fee gap. Mirrored numeric tracks preserve the existing mobile table presentation; categorical fields use document markers. Native FAQ cards have icon, question and expand affordance. | Two 96px hero logos; real maker/taker bars share the existing fixed fee scale. Table semantics/source links and all contextual controls remain. | Two 96px official logos flank the large measured gap. Two sides mirror numeric bars toward the center; categorical cells have document anchors. Existing hero actions, table controls, disclosures and FAQ show-more behavior remain. |

## Required browser states

At 390 / 768 / 1440: scroll every page fully; expand article analysis, sources hub, account details, all FAQ questions and compare show-more. Check keyboard focus, touch targets, long zh text, table-local overflow, sticky signup behavior and artwork crop. At least one Arabic venue/article/compare spot check should confirm logical-direction layout. Repeat with reduced motion and check CLS from initial navigation and after opening controls. Reserved art/logo geometry is implemented; CLS 0 is **not measured here**.

## Verification limits and recovery

Headless Chromium launch was blocked by the execution sandbox: `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)`, followed by SIGTRAP. No browser screenshots, axe sweep or DOM spacing measurements were produced. Better Design's UI/UX principle and review-rules tools returned the free-query quota error. Its spacing tool returned `needs-capture`; no completed measurement is claimed. A short-copy comprehension check passed after recognizing OKX as the product's proper brand name; that is not a full-page visual review.

The first normal build found a missing local Paraglide plugin cache; its failed fetch generated empty locale exports. The existing versioned plugin cache was copied from the main checkout into this worktree and hash-verified, then this worktree's failed generated compilation cache was invalidated. The ignored `.openai/hosting.json` build input was also copied from the main checkout. No checked-in locale, package, hosting or data configuration changed.

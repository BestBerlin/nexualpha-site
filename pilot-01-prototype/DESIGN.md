# Design

## Source of truth
- Status: R119 is the verified public release. R120 is an isolated local design candidate; production promotion requires fresh release evidence and preservation of live managed content.
- Last refreshed: 2026-10-05
- Primary product surfaces: homepage research funnel, exchange directory, deep comparison, venue detail pages, activities center
- Evidence reviewed: `src/App.jsx`, `src/components/v3/V3Pages.jsx`, `src/components/venue-explorer/VenueExplorer.jsx`, `src/components/compare/QuickCompare.jsx`, `src/components/brand/NexuAlphaWordmark.jsx`, `src/styles/v2-refinement.css`, `src/styles/release-visual-gates.css`, `src/components/v3/v3.css`, `src/data/v3-product.js`

## Brand
- Personality: independent, calm, credible, research-first, conversion-aware
- Trust signals: explicit disclosure, official-source links, verified-source states, no impersonation, no hidden KYC/login capture
- Avoid: official-exchange mimicry, generic AI templates, hidden brand text, misleading region filters, unlabeled affiliate behavior

## Product goals
- Goals: help users compare platforms, understand official source context, and move through a transparent handoff to registration or trading
- Non-goals: pretending to be an exchange, hiding commercial relationships, inventing fees/liquidity/region claims without evidence
- Success signals: clear directory comprehension, visible source provenance, strong brand legibility, no layout regressions across locales

## Personas and jobs
- Primary personas: users choosing a venue, users checking official announcements, users comparing access rules and product scope
- User jobs: shortlist venues, inspect official source context, compare platform conditions, decide whether to leave via a disclosed link
- Key contexts of use: mobile-first browsing, multilingual browsing, route-based deep links, local-locale verification during review

## Information architecture
- Primary navigation: signals, exchanges, compare, activities
- Core routes/screens: homepage, directory, platform profiles, comparison, activities and research, news, topics, Factbook, regional decisions, rates, on-chain tools, Telegram, methodology and embeds
- Content hierarchy: hero intent -> directory -> comparison -> detail -> official-source evidence

## Design principles
- Principle 1: every surface should explain its own purpose in one glance
- Principle 2: trusted information beats decorative density
- Principle 3: comparison and conversion affordances must remain visible without imitating official exchange flows
- Tradeoffs: slightly denser cards are acceptable if they improve clarity and reduce “PPT-like” emptiness; meaningful decision content should occupy space before decorative whitespace does

## Visual language
- Color: approved dark-finance palette — canvas `#070A0E`, raised surfaces `#0C1219` / `#121A24`, primary text `#F5F7FA`, muted text `#9AA5B5`, action blue `#315CCF` with highlight `#6F90FF`, verified green `#22C88A`, warning amber `#E9A93B`
- Typography: strong display hierarchy with compact data labels and readable body copy
- CJK typography contract: Simplified Chinese uses the native `PingFang SC` / `Microsoft YaHei` / `Noto Sans CJK SC` stack with self-hosted `Pilot Noto SC` fallback; Traditional Chinese uses the distinct `PingFang TC` / `Microsoft JhengHei` / `Noto Sans CJK TC` stack with self-hosted `Pilot Noto TC` fallback. Title weight is 600 for Chinese surfaces, body paragraphs stay 16–18px with relaxed 1.65–1.8 rhythm, auxiliary labels stay readable at 13–14px in the same CJK family rather than monospace, research tables/facts follow the same rhythm, homepage H1 rules are owned by the active layout-stability layer rather than older visual-gate CSS, desktop Simplified/Traditional home H1 copy may use a wider measure at 1100px+ so “选对平台，再去开户” remains one line without global nowrap, mobile hero copy may wrap naturally without overflow, mobile hero CTA buttons stay compact at normal control height, and the brand Latin font remains on NexuAlpha identity text.
- Spacing/layout rhythm: generous hero, tighter card grids, consistent gutters, no accidental horizontal overflow
- Enlarged CJK reading: body and auxiliary size bounds use rem, equivalent to their existing 16–18px and 13–14px defaults at a 16px root. A 32px root reading preference must enlarge those roles and reflow without page overflow; this is not a claim that every UI font scales or every browser/OS has been tested.
- Shape/radius/elevation: mostly squared or lightly rounded, subtle depth only; reserve larger radii and gradients for one primary decision panel rather than repeating them on every card
- Motion: restrained transitions, no decorative animation that competes with content
- Imagery/iconography: official brand assets where recorded, transparent backgrounds when possible, no white framing boxes around logos unless the source asset requires it

## Components
- Existing components to reuse: wordmark, venue cards, compare workbench, v3 detail pages, source lists, activity cards
- New/changed components: snapshot/status strips, richer venue cards, mobile-safe compare rows
- Variants and states: compact/desktop wordmark, verified/pending source states, locked CTA states, empty-state cards
- Token/component ownership: keep color, radius, and motion in existing token/system files; avoid ad hoc one-off values unless needed for a specific fix

## Accessibility
- Target standard: readable, keyboard-accessible, and screen-reader-meaningful production UI
- Keyboard/focus behavior: preserve native controls, visible focus, and escape-based dismissal where applicable
- Contrast/readability: keep label/value contrast strong on dark backgrounds
- Screen-reader semantics: use native headings, links, buttons, and descriptive `translate="no"` / `lang="en"` for brand names
- Reduced motion and sensory considerations: respect reduced-motion preference, avoid motion-only state changes

## Responsive behavior
- Supported breakpoints/devices: desktop, tablet, and mobile widths; narrow English/localized layouts must not overflow horizontally
- Layout adaptations: card grids collapse, compare tables must wrap or reflow on small screens, brand text must remain visible on mobile
- Touch/hover differences: touch targets stay large enough for tapping; hover enhancements must not be required to understand content

## Interaction states
- Loading: show clear loading states for data-backed sections
- Empty: empty states must explain why content is missing and how the page stays usable
- Error: data-source gaps should fail closed and label unavailable content explicitly
- Success: verified source and reviewed activity states should be visibly distinct
- Disabled: locked CTA remains present but inactive until verified handoff exists
- Offline/slow network, if applicable: source-backed data should degrade to pending/unavailable rather than fake content

## Content voice
- Tone: direct, calm, and research-led
- Terminology: official source, verified source, independent profile, deep comparison, registration handoff
- Microcopy rules: do not claim official status, do not translate brand names, and do not invent market claims without sources

## Implementation constraints
- Framework/styling system: existing React frontend and CSS modules/files already in repo
- Design-token constraints: reuse current tokens and component classes before adding new abstractions
- Performance constraints: keep images and card grids lightweight, avoid unnecessary extra wrappers
- Compatibility constraints: mobile-safe multilingual layout, no hidden logo text, no accidental horizontal overflow
- Test/screenshot expectations: changes should be covered by contract tests and checked in visible browser screenshots

## Open questions
- [ ] Which venue cards should show the richest facts first once official-source coverage expands?
- [ ] Should compare pages evolve toward stacked comparison cards on mobile or keep a wrapped matrix?
- [ ] Which additional brand assets are fully cleared for use beyond the currently recorded set?

## R120 editorial quality contract

- Eight independent review dimensions: typography, spacing, hierarchy, color, motion, microinteractions, responsive layout, and originality. Passing tests does not certify award quality.
- The primary task appears before export, technical metadata, internal operations, or repeated supporting explanations. Keep substantive evidence and user conditions reachable through clearly named disclosures.
- Use source-led visual grammar: product identity, concise decision answer, comparable differences, dated evidence, then the appropriate next action. Originality must come from information design, not fabricated live feeds, invented scores, or decorative motion.
- A long localized H1 may reflow naturally with a controlled mobile measure; never crop text or replace the search title merely for visual compactness.
- Reviewed, unknown, unavailable, and expired remain separate states. A static record identifier must not be presented as a computed checksum or proof of authenticity.
- Preserve the frozen partner registry and exact invitation URLs/codes. No Telegram sending, private commission disclosure, or publication authority expansion follows from a design task.
- Browser evidence must match the built asset hashes. Same-origin cached older assets are historical evidence, not a failed or passed final candidate.
- Representative route/locale/viewport samples define their own evidence boundary; they do not prove every article or language has been manually reviewed.

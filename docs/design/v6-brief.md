# NexuAlpha V6 — Creative brief (CEO decision, binding for all agents)

Goal: the homepage and shared system must read as an Awwwards/FWA-calibre site, not a template and not a slide deck.
The user's verdicts so far: "AI味浓", "大量留白", "有的字大有的字小", "没有交互感，像 PPT". Each is a defect to fix, not a taste note.

## Concept: "The Crossroads" (路线)
NexuAlpha is the last stop before you open an exchange account. The site is a **route map**: the visitor states what they want (intent), the map lights the route to the right official signup, and the page proves the route is safe (official domain, code, disclosure). Everything — hero, compare, verify, directory — is the same metaphor: nodes, routes, a destination.

## Homepage = five acts (one continuous composition, not stacked boxes)
1. **Route finder (hero).** H1 unchanged: "Compare crypto platforms and official account routes". Left: H1, one value line, primary CTA + secondary. Right/behind: an interactive SVG/canvas route map. Left column = 4 intents (Spot, Perps, Fiat on-ramp, On-chain/DEX) as a keyboard-accessible radio group; right column = exchange nodes (logos). Choosing an intent draws animated curved routes (stroke-dashoffset, 500ms expo-out) to the venues that offer that product (use `src/data/exchange-facts.js` + venue catalog; never invent rankings); the first/default node expands into the registration card (referral code + Official signup). Hover/focus a node previews spot/perp fee (count-up) and official domain. Idle: a slow ambient pulse travels along routes. Reduced motion: static routes.
2. **Compare lab.** Choose two venues (default Binance vs OKX): paired bars/ledger morph between them (FLIP-style transitions), verified figures only ('Not yet checked' otherwise), link into the existing /compare route. Scroll-linked reveal via CSS `animation-timeline: view()` with `@supports` fallback.
3. **Verify before you leave.** Three-step visual: official domain → code → disclosure. An animated "domain check" micro-sequence, honest affiliate disclosure shown prominently (this is a trust asset).
4. **Directory.** One fixed-grid dense list, filters as segmented control, rows identical in rhythm; logo, name, type, spot fee, code chip with copy, Sign up. No mono-gray domains as body text; domain only as small meta.
5. **Closing.** Large type CTA band + footer.
Keep in the DOM on `/`: all existing sponsored/registration hrefs and codes, `CrawlPriorityLinks`, Related research/Brazil entry/home research links (deploy gate + SEO). Reuse the legacy components' data/logic where they carry links, restyled or re-hosted inside the new acts; never edit partner-registry.js, hrefs or codes.

## System (non-negotiable; this is the "字大字小" fix)
- ONE type scale (px at 1440): 12 / 14 / 16 / 20 / 28 / 44 / 72(hero display only). Every text node must land on a scale step. Two families only: Geist (UI/display) and Geist Mono (numerals/codes). Weights: 400/500/600 only.
  - Tokens are discrete (r11; the old fluid clamps produced off-scale 19.5 / 27.5 / 41 px at tablet widths): `--t-12 --t-14 --t-16 --t-20 --t-28 --t-44 --t-72`.
  - Mobile set (viewport <= 640px), exact: **12 / 14 / 16 / 18 / 24 / 32 / 44**. The four upper tokens step down one notch: 20 -> 18, 28 -> 24, 44 -> 32, 72 -> 44; 12/14/16 never change. Above 640px only the desktop set is allowed. Never write a px/rem size; use the token.
  - Line-height (ratio to font-size), exactly three: `--lh-tight` 1.05 (display, hero numerals), `--lh-head` 1.15 (headings, card titles, buttons, labels, table heads), `--lh-body` 1.55 (running text, lists, notes, captions).
  - Enforced by `tests/e2e/run.py --checks type` (size per width, weight, line-height, family).
- ONE spacing scale, 4px base: 4 8 12 16 24 32 48 64 96 128. Section vertical padding = 128 desktop / 72 mobile, always, no exceptions. Container 1200 + 24 gutters (full-bleed allowed for the hero map and closing band).
- Colour: dark graphite neutrals, single signal accent (brand turquoise) ONLY on primary CTA, positive data, and the active route. Never a second accent.
- Alignment: every column starts on the 12-col grid; no orphan floating elements; text blocks have a max measure (≤ 62ch).
- No whitespace voids: no empty region larger than 160px that is not deliberate section padding. Verify with full-page screenshots after programmatically scrolling to trigger reveals.
- Motion: ≤ 3 signature moments + micro-interactions on every interactive element (hover, press, focus, copy-success, selection). Durations 120–400ms, expo-out. `prefers-reduced-motion` honoured. Content must NEVER be hidden if JS/IO fails (progressive enhancement: reveal classes only applied after IO is ready, with timeout fallback).
- Banned (impeccable refuse-list): kicker/eyebrow above headings, section numbers, hero-metric stat blocks, sparklines, identical card grids as structure, gradient text, aurora/blobs, decorative glass, emoji icons (draw SVG), Inter/Roboto/Arial.
- Accessibility: AA contrast, visible focus, keyboard path for the route finder, aria for custom widgets. RTL via logical properties. 15 locales: every new string needs all 15 (use `src/i18n` conventions as the existing copy objects do; fall back to English only where existing code does).
- Performance: new client JS ≤ 25KB gz total, no WebGL, no new runtime deps (npm is unavailable here), LCP < 2s, CLS 0.

## Quality gate (independent reviewers veto)
Each dimension scored 0–10 by an agent that did NOT build it, from screenshots at 1440 and 390 INCLUDING scrolled states and after interactions: typography, whitespace/rhythm, hierarchy, colour, motion, micro-interaction, responsive, originality. Any score < 8 sends the section back. Reviewers must also list every distinct computed font-size on the page and flag any that is off the scale.

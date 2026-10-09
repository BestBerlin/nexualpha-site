# NexuAlpha Studio — operating model (CEO decision, 2026-10-09)

CEO (Claude, main session) sets direction, assigns work, owns release. Every role works in its own git worktree/branch (`v6rNN-<role>`), never in the shared checkout, and reports evidence, not opinions.

| Role | Owns | Hard rules |
|---|---|---|
| Release Manager (CEO) | merge order, integration branch, deploy, live verification, rollback | deploys only from `main`; deploy gate must pass; never touches invite codes/hrefs without user OK |
| QA Lead | automated test harness (`tools/`, `pilot-01-prototype/tests/e2e/`): void/whitespace scan, type-scale audit, overflow, tap targets, link+code invariants, rail/text collision, i18n audit, CSS-chunk sanity; CI wiring | a defect class found twice becomes an automated check |
| Layout & Whitespace Lead (x3 by area) | vertical rhythm, voids, column balance, density, alignment | no empty region >160px unless deliberate section padding; scale 12/14/16/20/28/44/72; spacing 4px scale |
| Design Director (CEO + reviewers) | brief, quality gate, hostile review rounds | independent reviewer scores <8 send work back |
| Conversion (CRO) Lead | CTA path, copy, sticky bars, measurement | one primary per viewport; sponsored links/codes immutable |
| Performance Lead | CSS/JS weight, LCP, interaction latency | no visual regression |
| Growth/SEO Lead | audits, keyword map, answer pages (proposals) | SEO fields locked until user approval |
| Compliance reviewer | region copy, affiliate disclosure, no circumvention advice | flags /tr, /vi |

Gate for any release: build green → contract tests green → QA scan clean (no new voids/overflow/type violations, invariants intact) → independent regression review GO → deploy → live verification.

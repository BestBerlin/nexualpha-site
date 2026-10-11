# NexuAlpha unified design (v8, 2026-10-09)

One site, one dark system. The v7 home was a light page wrapped in the dark v6 shell (header, footer, bottom nav, every inner
page). v8 keeps the v7 home *structure* (announcements, scroll story, calculator, compare sheet) and re-renders it with the
v6 tokens below. Inner pages are not redesigned; they are polished against the same rules.

## Tokens (source: `src/styles/v6/components.css`, `src/styles/v6/base.css`)
| Role | Value |
|---|---|
| Canvas | `#07080A` |
| Surface / raised | `rgb(255 255 255 / .035)` / `rgb(255 255 255 / .06)`; solid card `#18191B` |
| Hairline / strong line | `rgb(255 255 255 / .12)` / `rgb(255 255 255 / .22)` |
| Ink 1 / 2 / 3 | `#EDEEF0` / `#B0B4BA` / `#9097A0` |
| Accent (only primary CTA, positive data, active state) | `#1FE0C0`, text on accent `#04130F`, hover `#4AEBD0` |
| Warning / danger | `#E9A93B` / `#F87171` |
| Type scale | 12 / 14 / 16 / 20 / 28 / 44 / 72 px (`--t-*`), Geist V5 + Geist Mono V5, weights 400/500/600 |
| Mobile type ramp (<= 640px, `v6/base.css`) | 20 -> 18, 28 -> 24, 44 -> 32; 12 / 14 / 16 unchanged. These three are the only sanctioned off-scale sizes. |
| Line height | 1.05 tight, 1.15 head, 1.55 body (CJK body 1.7) |
| Spacing | 4px grid: 4 8 12 16 24 32 48 64 96 128; section pad `clamp(72px, 9vw, 128px)` |
| Container / gutter | 1200px / 24px (mobile 16-20px) |
| Radius | 8 controls, 12 surfaces, 999 pills (chips only) |
| Control height | 44 (default, also min touch target), 36 (dense desktop only) |
| Motion | ease-out `cubic-bezier(.16,1,.3,1)`; 140 / 240 / 400 ms; respect `prefers-reduced-motion` |

## Product focus (owner correction, 2026-10-09)
- NexuAlpha is a product for users: compare exchanges, see what fees cost, sign up through us and get part of the fees back.
  Revenue comes from those referrals. It is not a channel for exchanges' news: their announcements are secondary
  reference only (one list near the bottom of the home), never the hero and never a site-wide ticker.
- The home hero is the animated rebate figure: a large shimmering "50%" (owner-confirmed "up to" marketing, footnote
  explains per-exchange shares) with the partner wall right under it — every partner with a real invite code
  (`HOME_PARTNERS`), official logo, name and disclosed share; each tile links to that exchange's detail page (code +
  disclosure). Particles stream from the tiles' top edges into the figure, never across text. The motion is the
  signature; do not replace it with static type. Never show only a hand-picked few partners.
- Home copy exists in all 15 locales (`home7-copy.js` + `home7-copy-i18n.js`); a new key must be added to every locale.
- Order: rebate hero → trust strip → yearly-gap story chart → calculator with per-exchange sign-up → notices → footnote.
- Kicker voice: "交易所比价与返佣" / "fees & rebates". Terminal frames, hairline ruling and mono figures stay as craft details.

## Rules
1. Accent is scarce: one primary CTA per viewport-sized block. Secondary actions are outline (`--line-2`) or text links.
2. Hierarchy by size and ink level, not by colour. Display numbers use Geist Mono tabular figures.
3. Every touch target >= 44x44 on mobile. No horizontal page scroll at 320-1440px. Logical properties only (RTL).
4. Venue logos: 28px in lists (32px allowed in the dense directory matrix), 20px inline/meta, 48px in the profile hero; radius 8; no white boxes; fallback initials; above-the-fold logos load eagerly (no fade-in).
5. Brand mark in header 34px (mobile 32, scrolled 28) with a 1px ring so the circle reads on the dark canvas.
6. Light surfaces are not used. The only full-bleed contrast change is a slightly lifted band (`#0C0D10`) for the scroll story.
7. Disclosures, referral codes and URLs are never edited by design work (`publicCtaForVenue`, `partner-registry` untouched).
8. Every block that shows a referral code or a sponsored link also shows a one-line commission disclosure within the same viewport (reuse existing localized wording).
9. Claims: the "up to 50%" headline is owner-confirmed marketing (chat, 2026-10-09); it must always be paired with the per-exchange disclosure footnote.

## Review dimensions (each 1-10, screenshot evidence at 390 / 768 / 1280 / 1440, zh-hans + en + ar)
typography, whitespace, hierarchy, colour, motion, microinteraction, responsive, originality.

## Editorial templates (v9 layer, 2026-10-11)
Article (`/news/<slug>`), news index (`/news`, categories, pages) and the topic / factbook hubs share one editorial
grammar on the tokens above. CSS stays in the route chunks (`news-detail-page.css`, `news-list-page.css`,
`CollectionHubPage.css` in `route-collection-hubs`); only the signature lives in `v8/site-signature.css`.

**Signature: the data rule** (`src/components/shared/DataRule.jsx`, `.nx-rule`). Every editorial section head is a
Geist Mono label, a 1px hairline (`rgb(255 255 255/.14)`) that fills the line, and a mono figure or UTC stamp at the end
(`The short answer ——— 2026-10-11 · 06:05 UTC`, `Sources ——— 14`, `Today ——— 2026-10-11 · 5 stories`,
`Centralized exchanges ——— 13 records · Fees checked 2026-10-10`). No colour, no motion; on phones the date part of a
stamp drops and the rule may wrap. Stamps are deterministic UTC strings (identical in SSR and hydration); dates inside
Arabic text sit in `<bdi dir="ltr">`. Use it for new editorial section heads instead of eyebrows or pills.

Article rules: one measure (68ch), body 17/1.7 (16 on phones; CJK 1.8), h2 24/1.25 (20 on phones), h3 18/1.35,
captions and table hints 13. The first H2 section is the lead answer block (2px accent start rule, ink-1 18px text).
Section index: sticky in the rail from 1024px (scroll-spy marks the current section), a collapsed disclosure below.
Sources are a footnote panel (`[01] Publisher · date / title`). Tables: tabular figures, figure cells (`is-num`)
end-aligned in mono, horizontal scroll inside their frame. Market context (BTC/ETH/SOL articles) reads
`/intel/market-events.json` after mount and renders nothing without data. Partner cards never sit between the title and
the lead answer; the disclosure stays inside each card.

Index rules: newest story leads (larger headline, dek, mentioned venues, read / compare); every other row of the page
sits in UTC day groups (time · headline · one-line dek · category), each row one link with a whole-row hit area.
"Today" / "Yesterday" are applied after mount. Hubs: featured row, grouped sections with a one-line description, counts
and review dates; headings localized in 15 locales, record text marked with its own language.

Accessibility: every interactive element on these templates has a 2px accent `:focus-visible` ring (rows ring the whole
row); `scripts/editorial-axe.py` runs axe-core (WCAG 2.1 AA) on the four templates in en and ar at 390/1440 and must
report 0 serious/critical; transitions drop to 0 ms under `prefers-reduced-motion`.

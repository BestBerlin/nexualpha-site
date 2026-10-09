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
- The home hero is the animated rebate figure: exchange chips (OKX 20%, Binance 20%, Bitget 30%, Bybit) stream particles
  into a large shimmering "50%" (owner-confirmed "up to" marketing, footnote explains per-exchange shares). The motion is
  the signature; do not replace it with static type. On phones the chips sit under the figure and stream upward.
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

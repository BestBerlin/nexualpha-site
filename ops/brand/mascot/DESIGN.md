# Character design notes

## Intent and shape language

An academy companion, not an investment signal or an exchange representative. The owner's selected Direction A overrides the earlier Nodi round-node concept in the research file: this character has a mouth, tiny mitten hands and a belly coin.

The silhouette is a bottom-heavy, soft pebble: a single continuous head/body volume, big unequal oval eyes, no ears, horns, fur, muzzle, wings or tail. A crooked single antenna and off-center eye rhythm supply the slight quirkiness. A warm cheek mark, short feet and a gentle closed/open smile keep the character approachable. The right-facing turnaround compresses the far eye and belly coin; the side view shows the coin edge; the back carries a subtle curved seam and one small mint detail, with no rear face/coin.

All paths were constructed for this kit. No silhouettes or traced elements from Duo, Wumpus, Labubu, Pokémon or Octocat were used. Original authorship is not a guarantee of legal exclusivity or universal absence of resemblance.

## Palette and signals

| Token | Hex | Use |
|---|---|---|
| Blue | `#4f7cff` | Body / neutral explaining signal |
| Blue shade | `#3658c5` | Lower body / feet |
| Blue highlight | `#86a5ff` | Body and antenna highlight |
| Mint | `#3ddc97` | Happy / OK signal and shield |
| Amber | `#f8bb6a` | Thinking / careful signal |
| Risk red | `#ed5969` | Warning signal |
| Coral | `#ff7a59` | Cheeks / tongue / confetti |
| Ink | `#0b0d10` | Rounded outline / pupils / board ground |
| Gold | `#ffd875` | Unbranded belly coin |

The recessed belly coin has a generic diamond engraving and two short shine rays, giving a glow impression without a blurry raster effect. It is a learning badge, not a token logo or promised reward. No money bags, price charts or profit gestures. Warning is conveyed by brows and mouth as well as the red light; other moods similarly pair signal color with expression/gesture.

The requested skills informed the work: brand consistency and asset naming; banner safe-zone/illustration guidance; primitive → semantic → component CSS tokens; ui-ux-pro-max accessibility, responsiveness and reduced-motion guidance. Its generic education palette was overridden by the owner-specified NexuAlpha blue. System fonts avoid network dependence.

## Rig contract

512 × 512 coordinates, 6-unit rounded ink outlines (eyes 5 units). Every standalone character has unique groups: `shadow`, `character`, `body`, `eyes`, `mouth`, `arms`, `legs`, `antenna`, `antenna-light`, `coin`, plus `props`, `effects` and `cheeks`. Limbs have individual `arm-left/right` and `leg-left/right` groups; visible eyes have individual eye groups. Hidden layers in back/side views remain empty where needed. The shadow stays outside `character` so a bounce does not move the ground.

Use scoped selectors per SVG instance. Inline turnaround/presentation IDs are namespaced. With direct inline copies, prefix IDs and `aria-labelledby` references or animate one SVG at a time.

Suggested GSAP pivots: body `256 408`, eyes `256 220`, light `284 53`; left shoulder about `144 270`, right shoulder about `370 270`, feet about `212 405` and `301 405`. The idle timeline is exactly two seconds: rise and return, blink at 1.28–1.48 seconds, soft light scale/opacity pulse. Pause/resume is keyboard operable; reduced motion initially and dynamically resets the rig to stillness.

## Naming proposals and screening · 2026-10-12

| Proposal | Pronunciation | Rationale | Search outcome |
|---|---|---|---|
| Nexubo | nek-SOO-bo | Brand-family association and a rounded ending | No well-known brand/character collision identified in returned exact-name results; a text occurrence in a Zapotec Bible surfaced. |
| Bopinu | bo-PEE-noo | Buoyant, friendly rhythm | No well-known brand/character collision identified; an unrelated similarly prefixed domain and OCR/noise surfaced. |
| Pibolu | pee-BO-loo | Soft playful syllables | Existing personal handles/customer label surfaced; no well-known character/brand identified in returned results. |

Searches used `"Nexubo"`, `"Bopinu"`, `"Pibolu"` and combinations with `brand`, `character`, `mascot`. Relevant returned occurrences: [Nexubo text occurrence](https://www.scriptureearth.org/data/zpc/PDF/zpc-00-WNT-web.pdf), [Bopinu-prefixed domain entry](https://www.scamadviser.com/check-website/bopinu-vodore.eu), [Pibolu customer-label listing](https://shopee.tw/%F0%9F%90%BE%E5%AE%A2%E8%A8%82-Pibolu%F0%9F%90%BE-i.8258368.5603027407). These are collision-screening observations, not endorsements of those sites or trademark clearance.

Rejected during screening: Nexumi (existing messaging app), Lumexo (existing DeFi and other brands), Lumibu (children's products and an art toy), Mipavo (existing brand listings), Zunepi (existing game top-up store). Names remain proposals rather than an approved final identity.

All three avoid diacritics and use simple consonant/vowel syllables, making transliteration feasible. Actual suitability, connotations and pronunciation across all target languages require native-speaker review; that was not verified. Retain Latin spelling for asset IDs until a name and localized spellings are approved.

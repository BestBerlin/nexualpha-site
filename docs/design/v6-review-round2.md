# V6 independent review, round 2 (build 3.0-20261008T1457-GH-7217dc3). Gate: every score >= 8. Previous round scored 5-6.5.

Scores: home desktop typography 6.5, whitespace 5.5, hierarchy 6, colour 6.5, motion 5.5, micro-interaction 6.5, originality 5 | mobile responsive 6.5, typography 5.5, rhythm 6, micro 6.5 | inner consistency 5.5, typography 6, whitespace 5, polish 5.
Verdict: 'a very well-made dark fintech template with one good widget (the hero finder), not an SOTD.'

## Home desktop (R2a)
1 Teal row-lines bleed past the container to viewport edge in the directory (.dir6 -> overflow:clip; keep pulse inside row).
2 TRUST BUG: directory fee numbers count up from zero and show WRONG values mid-flight (Binance 0.08/0.07; hero node showed 0.099%). Verified data must never display a wrong figure: render the final value; animate only opacity/translate/digit-mask, never intermediate numbers (also check CompareLab delta, ExchangeMatrix, detail strip, rates).
3 Referral-code chips overflow: KuCoin/Deribit icons collide with text; 'luckybitcoin' overflows. .code min-width:max-content, gap 8px, column 168px.
4 Closing band teal route stroke ends INSIDE the 'Browse the directory' button (looks like a bug): end 16px short or draw behind with a marker.
5 Closing band animation unobservable (identical frames). Drive with animation-timeline: view() or IO with a visible 600ms wipe; never hide content when unsupported.
6 Hero cramped at 1280x720 (intents at fold edge, card cut off); layout jumps 21px when 'On-chain' chosen: reserve intents block height.
7 'Fiat on-ramp' intent shows spot fees (wrong data). Show 'Not yet checked' or real on-ramp fields.
8 Verify domain typewriter sits on a single 'w' at 150ms and again later: start on scroll-in, use ch width so field is never empty.
9 Footer container x=65 vs page 120: use the shared container.
10 Compare lab / Popular matchups / fee-check row look like 3 systems; 128px padding with no content on right of compare+research; 'Open the fee cost check' bare row with '+'.
Also: 138px headline (7 nodes) + 56px hero H1 off the 12/14/16/20/28/44/72 scale (document hero 56 and closing 138 as the only two display steps or conform); voids 256px after a.dir6-all (y~5599) and 217px in .v6-close__note.
Originality levers: (1) route as ONE continuous SVG rail persisting through the page (fixed, docks at each act, closing CTA = destination); (2) direct manipulation in compare/verify instead of pill chips (drag one venue onto another; magnetic cursor; live count-up delta — but count-ups must never show wrong figures: see #2, use delta animation of a clearly-labelled difference, not of verified fees); (3) Verify as real URL-bar simulation with a lookalike-domain diff highlight (e.g. bínance.com vs binance.com); give type a cut (mono numerals bleeding off container).
Not verified: directory filter change didn't visibly change list in one capture (mobile reviewer confirmed it works: Perp DEX -> 5 of 24).

## Mobile 390/360 + locales (R2b)
1 ja: hero CTA '30秒プラットフォーム診断' clipped both sides, 'あなた' chip overflows circle, H1 breaks mid-word (overflow-wrap:anywhere, min-width:0, padding-inline, keep-all for CJK).
2 /exchanges 390 spot-fee cell digits break '0./0.%': white-space:nowrap + tabular-nums + wider track.
3 Intents tap changes nothing visible above fold (card 600px+ below): scroll card into view / sticky '<N> venues' pill.
4 Chip rows (.vb__venue, compare chips, /compare 'Jump to') cut off with no hint: mask-image fade + scroll-snap.
5 Route card collapsed accordion has ~50px dead space under it; 'Preview' links detached/indented in Popular matchups: inline at row end.
6 i18n leftovers: English in tr/ar/zh-hans ('Verified Crypto Platforms Directory · 24 Venues', '13 Flagship CEXs', 'BRL, Pix, spot shortlist'), /br 'Register at Binance', 'Offer & eligibility'; vi chips lose diacritics; ru 'Сборы'/'Перпы' wrong; ru 'Spot Maker / taker' wraps to 3 lines.
7 Bottom dock: random labels underlined; zh dock shows '搜索 ⌘K' desktop shortcut: text-decoration:none; hide kbd on touch.
8 Directory filter chrome ~330px before first row; chips have no visible state: collapse chips into the accordion or one scroll row.
9 Inner 390 tap targets 16-34px: a.mx-id__name 21px, /methodology link lists 22px, JSON/CSV 18px, /compare fee-source links 16-18px, 'Verified first' checkbox 18px, 'Read full disclosure' summary 40px, narrow CJK '比較' 28px: min-height 44.
10 /methodology 390: card inside card, text touches inner right edge.
Also 10 distinct font sizes on / at 390 (18.17, 24, 32.6, 45.1, 56 off-scale).

## Inner pages (R2c)
1 /de/br and any untranslated locale route returns 404 'This update is not currently publishable' (also live; decide: redirect to /br or EN fallback with hreflang; do NOT change hreflang/canonical logic without evidence).
2 Container/left edge drift: /exchanges h1 x=112; /exchanges/binance main 1200 with h1 x=204 beside logo; compare/news/rates x=120; factbook content x~120 but tables in inset boxes. One .v6-container (1200, padding-inline 24) on every main.
3 H1 scale: 44 inner, 56 home, 72 /br and factbook. Inner h1 = 44; hero only bigger.
4 Accent discipline fails: blue rgb(111,144,255) compare/binance; sky rgb(56,189,248) telegram/news/activities; sky rgb(125,211,252) news 'Read Article'; amber rgb(253,176,34) compare; emerald (52,211,153)/(16,185,129) binance; red (255,99,105) factbook 'Pending' row. Links = --text + underline; turquoise only CTA/positive/active; red row neutral.
5 Buttons: heights 36/44/48/57/63/70/72, radii 4/6/8/10/50%, secondaries transparent/rgba(255,255,255,.04)/solid #18191b: sm 36 / md 44, radius 8, ONE outline-secondary.
6 /exchanges rows 43-68px (Kraken tall due to region note): td vertical-align:middle; height 56; ~110px dead band before 'Related research', ~100px before footer.
7 /exchanges/binance: right sticky card ends y~360 leaving blank right gutter; Products/Regions columns uneven with hole y~1050-1080; scattered 48-64px gaps; 'Reviewed official updates' row has bare inline link 'Open official source': grid align-items:start, 48px stack gap, real button.
8 Disclosure rows each styled differently (28px stacked titles vs 16/20px single lines); FAQ rows carry Q1/Q2 badges (numbered labels, must go): one .disclosure row (min-height 56, 16px/500, trailing plus); same on /compare.
9 /compare y~1450-1520: gap after FAQ 'Show 1 more', three indents/widths, 'Continue research' bold inline, 'Metrics' label duplicates select text, unexplained 'Show fewer metrics' under 'Show pending fields'.
10 /rates: terminal card ~12 text styles, 72px count-up beside small text, 'Base rate 0.1%' kicker-like label, four-button row + link row with inconsistent arrows; chips wrap 'Perp DEX' to 2 lines (nowrap); Binance row taller; '7D Trend' chip odd.
11 /factbook: h1 not in main, 72px title beside 5-wide logo block; each section an inset box (heading baselines differ); 'Major asset reserve coverage' row is a clipped table fragment (y~925-965, visibly broken); mono code block stray darker bg; Backpack and Binance identical heights (templated, thin).
12 /news: article titles 28px with separate 12px chip/date column; US date '10/4/2026' (use ISO) under boxed chip; ~60% empty right side; CTA trio sits on 'Research index' row at 0px gap + 120px dead space after.
Worst inner pages: /exchanges/{slug}, /factbook/{slug}, /compare/..., then /rates.
Consistent now: same header/footer, Geist only, no emoji/section numbers seen.

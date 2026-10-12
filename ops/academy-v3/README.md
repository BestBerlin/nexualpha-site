# Academy v3 kit — Season 1 ("Sam's First Crypto Lesson")

Season 1 production (all 24 English episodes, landscape + portrait) runs on the same pipeline as the approved E05/E09/E21 samples; see **Season 1 production** at the end. The sample notes below remain for history.

## Samples (history)

Internal E05 / E09 / E21 samples from the merged v3 scripts. No site changes, publication, registry edits, installs or model downloads. The original `sample-e05.json` remains a legacy 120-second kit fixture; the new `episodes/E05.json` is 135 seconds with the supplied conversion card. E09 is 155 seconds; E21 is 124.9 seconds (source targets 130/154/124 s; cards grew to fit measured narration).

## Build and review

Run from this repository's `ops/academy-v3` directory, reusing the existing `node_modules` symlink:

```sh
bash build-samples.sh
npm test
python3 -m http.server 4573 --bind 127.0.0.1
```

`from-v3.mjs` reads the frozen `episodes/source/` copies by default, preserves dialogue and source timecodes, maps teaching widgets and character actions, and separates open/conversion/hook/close so the kit never inserts them twice. To refresh from a reviewed script directory, use `node from-v3.mjs --source-root /absolute/path/to/episodes`. All commercial copy comes from the supplied source unchanged.

Eight compositions: E05/E09/E21 English, plus E05 Simplified Chinese on-screen text, each in 1920×1080 and 1080×1920. Outputs are `build/<episode>-<locale>-<format>/`; contact sheets are `evidence/contact-<episode>-<locale>-<format>.html`. Each shot is sampled, including all ten E05 scenes. `contact-chrome-*.png` and `samples-browser-geometry.json` are Chrome HTML-timeline evidence, not MP4 evidence. Stop the preview server after review.

## Lead narration and render handoff

```sh
bash narrate.sh --plan-only
bash narrate.sh
node align-narration.mjs measure   # trims wavs, writes episodes/narration-timing.json
node from-v3.mjs                   # regenerates episodes/*.json with measured line/word timing
export HYPERFRAMES_BROWSER_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
bash build-samples.sh --render
```

`narrate.sh` uses the existing v2 mlx virtualenv with offline model flags. Nexubo/narrator use the owner's exact female CLONE command and reference wav. Sam uses a separate VoiceDesign profile, as explicitly requested by this task's newer brief. The recorded instruction is: **a friendly adult American man new to crypto, natural and conversational, clear diction, curious but not cartoonish**. The installed CLI has no seed flag. No model download is attempted; missing cached models fail closed. Outputs stay under this worktree.

`narration-plan.mjs` plans all source scenes and 28 spoken lines, including conversion, hooks and closes. This sandbox cannot access Metal; `evidence/narration-generation-manifest.json` records the blocked generation. No narration wav was delivered. Run on a Metal-capable Mac with the existing cached models, review voice consistency, measure/align the wavs, update the estimated scene-local timing, and validate again before muxing.

`render.sh` performs strict HyperFrames lint and renders silent masters to `renders/<episode>-<locale>-<format>.mp4`. It generates contact sheets from every actual video scene only on successful rendering. This sandbox fails before capture with `uv_os_setpriority returned EPERM`. Logs are retained; use the lead runner where process priority and Chrome creation are permitted. Do not weaken lint. Replace silent SFX cues with approved audio and mux narration after alignment. Long conversion/hook scripts may exceed their 6s/4s windows at natural speech speed; real audio is required to resolve this before master approval.

## Visual direction

Shared layouts alternate close-up reactions, wide UI demonstrations and full-screen details with a small pointer. Primary character rigs occupy roughly 35–50% of frame height in teaching character shots; the official mascot artwork remains unchanged. Every shot includes gestures/reactions, line-timed mouth motion and blinks. Sets have windows, shelves, lamps, desks and foreground floor layers. UI text uses a 34px minimum; KYC specimens stamp rejection then correction, checklists tick in sequence, and the auto-add diagram animates a balance pipe. E21's values are explicitly a teaching model and its switch is an illustrative state, never a claimed platform default. The hook uses an enlarged pointing/teasing Nexubo and large text.

E05 shows the supplied partner name, code, source URL, disclosure and regional availability on one designed card. Its QR follows the existing kit contract and leads to the source-slug lesson page, not a receiving address. The restricted variant remains preserved in JSON metadata; this task renders only the requested en/zh-Hans variants. A production restricted-language rendition remains a separate gate.

## Components

| Component | Contract |
| --- | --- |
| Nexubo / 小纳 | Original layered Bitcoin mascot source rig; wave, point, hold-phone, shield, thumbs-up, facepalm (+ rest); neutral, happy, thinking, surprised, warning, celebrating, confused; per-shot blue/green/amber/red antenna |
| Sam / 小白 | Original adult chibi learner; neutral/happy/confused/worried/surprised; rest/point/wave/hold-phone |
| Talking | Line-timed bounce and mouth squash/open-close; no lip-sync claim |
| Ding | Antenna red + short shake + explicit `! STOP` chip, without a separate warning character |
| Sets | Layered study-desk, trading-desk, transfer-station with reusable room/floor/desk/decor SVG |
| Data UI | price-board, order-ticket market/limit, balance-ledger, address-form with network/address/memo, risk-meter, candlestick-chart OHLC, margin isolated box/cross pool, checklist, identity, warning |
| Brand | Always-present official mark + wordmark; 0–6s problem, 6–9s brand/series/EP/title; 4–6s branded close and Nexubo wave |
| Cards | Optional conversion followed by mandatory 3–5s next-lesson hook, then close |
| Captions | Timed, escaped word spans; supplied word timing or explicitly estimated segmentation; caption gaps clear correctly; exported WebVTT |
| SFX | `sfx-cues.json` / `window.academySfx` hooks: open-sting, ding, intentionally silent placeholders |

Financial values, fees, addresses, pool scope and position amounts come from props. SVG geometry and risk-meter normalization constants are layout values, not financial assumptions. The widgets are visual illustrations, not clickable course controls or real transaction interfaces. The specimen gallery uses separately supplied fictional values; it is not live market data. Candle OHLC labels and margin mode labels supplement color cues.

## Episode JSON contract (version 1)

`episodes/*.json` are the adapted bilingual v3 inputs. `sample-e05.json` is the older kit test fixture.

- `version: 1`, `episode: 1..24`, `slug: lower-case-kebab`, `title: {en, "zh-Hans"}`, optional `direction: "ltr" | "rtl"`.
- `shots[]`: unique CSS-safe `id`, `duration` in seconds aligned to 30fps, `set`, `visual_en` storyboard description, `onscreen_text_en` / `onscreen_text_zh-Hans` (or localized `onscreen_text`), `antenna`, optional `ding`, `nexubo: {pose, expression}`, `sam: {pose, expression}`, `widgets[]`, `lines[]`.
- First shot lasts exactly 6 seconds. Builder inserts the 3-second brand shot after it; other shots follow. Shot-local line times do **not** include the brand insertion. The demo retains E05's learning boundaries and adjusts the recap to accommodate a 4-second next hook within 120s.
- `lines[]`: `speaker: "sam" | "nexubo" | "narrator"`, localized `text`, `start`, `end` in **shot-local** seconds, ordered and nonoverlapping. Optional `words: {en: [{text,start,end}], "zh-Hans": [...]}` (or single-language word array). Words use the same shot-local clock, preserve all spoken text, and may contain gaps. Missing words are estimated with `Intl.Segmenter`; replace them using real alignment before voiced delivery.
- `end_hook: {duration: 3..5, text: {en, "zh-Hans"}, pose?}`. `close_duration: 4..6` (defaults to 4). Optional `lines` carry estimated card narration; `close_lines` carries the close narration.
- `conversion_card: null` or `{duration: 4..10, partner_name?, code?, rebate_line?, disclosure}`. All copy can be localized. Commercial values appear only when supplied; code/rebate require a partner name. Disclosure is mandatory on the same card. The QR always encodes `https://nexualpha.com/starter/<slug>?src=academy-video`; there is no partner-link override. The legacy fixture supplies no commercial data; the adapted E05 preserves the source card.
- `visual_en` is retained as storyboard metadata, not passed to an image generator or guessed into financial data. `widgets` and rig props are the deterministic visual instructions. A localized widget string is `{en, "zh-Hans"}`; numeric values remain numbers or preformatted strings as appropriate.

Widget props (all copy escaped):

| `type` | Props |
| --- | --- |
| `price-board` | `rows: [{symbol, price, change}]` |
| `order-ticket` | `orderType: "market" | "limit"`, `side`, `quantity`, limit `price` |
| `balance-ledger` | `rows: [{asset, available, locked}]` |
| `address-form` | `network`, `address`, `memo` |
| `risk-meter` | `level: 0..100` |
| `candlestick-chart` | nonempty `ohlc: [{open, high, low, close}]`, finite coherent OHLC |
| `margin` | `mode: "isolated" | "cross"`, `balance`, `positions: [{label, amount}]`, `autoAdd`, `poolScope` |
| `identity` | `steps: [{label, status}]`, `photos` boolean, `fictionalNote` |
| `checklist` | `items: [{label, done}]` |
| `warning` | `message` |

Optional `title` labels any widget. For production, keep one primary widget per shot; split dense diagrams into separate shots and recheck safe areas. Arbitrarily long copy or unbounded row counts are not automatically fitted.

## Composition and production gates

CSS uses primitive/semantic/component tokens. Portrait rearranges teaching above characters and reserves 300px at the bottom; it does not crop landscape. All text and figures are editable DOM/SVG. Logical CSS properties and explicit `direction` make layout RTL-ready; only en/zh-Hans have reviewed UI strings here, and no Arabic/RTL production validation is claimed. Characters are guides at the side/below the teaching layer, never over the data.

The kit reuses the existing mascot as required and creates Sam locally without third-party character images. System fonts use local fallbacks (no font download); the lead must confirm intended fonts and commercial asset/audio licensing before final production. The deprecated `visual-verdict` skill explicitly says not to invoke it; manual Chrome review and saved geometry evidence were used without activating an unavailable OMX runtime.

## Narration alignment and mux

`episodes/narration-timing.json` holds the measured (edge-trimmed) duration of every generated line. `from-v3.mjs` applies it through `align-narration.mjs`: lines start 0.25 s into their scene with 0.3 s between lines and 0.25 s tail, scenes only grow (0.1 s steps, frame-aligned), word timings are spread proportionally inside each measured line, and each line records `narration: {id, atempo, seconds}`. Fixed windows (problem 6 s, hook 3..5 s, close 4..6 s, conversion 4..10 s) tighten padding to 0.15 s and then use atempo (≤1.08; ≤1.12 is recorded in `narration_alignment.compromises`; beyond that the build fails). `convertEpisode()` itself stays source-exact.

```sh
bash render.sh en episodes/E05.json        # silent masters (likewise E09/E21 en, E05 zh-Hans)
node mux-narration.mjs E05 E09 E21          # one -16 LUFS track per episode -> renders/final/<EP>-<locale>-<format>.mp4
node final-contact-sheets.mjs               # renders/final/contact-*.jpg, one frame per scene midpoint
```

The zh-Hans E05 variant carries the English narration under Simplified Chinese captions; no Mandarin voice was generated.

## Season 1 production (2026-10-12)

Every script defaults to all 24 episodes (`season.mjs`); pass ids to work in batches.

```sh
bash narrate.sh [--episodes E01,E02]          # skips existing wavs unless --force
/usr/bin/python3 verify-narration.py          # faster-whisper small (cached): every line vs script
node retake-narration.mjs <line-id> ...       # re-take failed lines (same voice profile), re-verified
node align-narration.mjs measure [E01 ...]    # merges into episodes/narration-timing.json
node from-v3.mjs [E01 ...]                    # converts + aligns
bash render.sh en episodes/E01.json           # silent masters, workers 2
node mux-narration.mjs E01                    # -16 LUFS narration track
node final-contact-sheets.mjs                 # renders/final/contact-*.jpg
```

- **Visual direction per episode** lives in `episode-config.mjs`: set, shot ids, heading/framing/pose overrides and one primary teaching widget per content shot. `t(i)` pulls the source on-screen text verbatim; numbers are the scripts' own teaching numbers.
- **Widgets added for Season 1** (`widgets.mjs`, styled in `style.css`, staged in `motion.js`): `formula` (equation rows, emphasis, note), `cards` (tiles with ✓/✗/! marks, optional separator), `flow` (steps with arrows and states), `quiz` (question + options; answer marks and verdict stamp appear at the answer beat), `compare` (two-sided), `order-book` (levels, fills, average/last), `buffer-gauge` (equity shrinking toward the maintenance line). `order-ticket` accepts `amount`; `candlestick-chart` is redrawn at readable size with an `annotate` mode labelling open/high/low/close; checklists with 6+ items run in two columns in landscape.
- **No fine print (owner rule).** `fine-print.mjs` lists the forbidden caveat patterns (not investment advice, fictional/teaching-model data, commission, availability, partner-link, terms) for every locale. `from-v3.mjs` refuses configured headings/widgets that contain them and `build.mjs` fails the build if any reaches a frame (spoken captions are dialogue and are not filtered).
- **Conversion card** (E04, E05, E07, E12, E13, E24 only): exchange name, code, QR and `nexualpha.com/go/<venue>` per venue plus one CTA sentence, with Nexubo thumbs-up beside the card. Bitget is shown as "Bitget.com" and linked via `/go/bitget`. The source disclosure/availability strings stay in JSON as metadata (`disclosure_rendered: false`) and are never drawn. The QR still encodes the lesson page `nexualpha.com/starter/<slug>?src=academy-video`.
- **Contract revision approved by the lead (2026-10-12):** `end_hook` window 3..7 s (was 3..5) and conversion card 4..12 s (was 4..10), so every scripted hook/card line is spoken at natural speed. Alignment atempo is capped at 1.08 with no compromise band (`ATEMPO_COMPROMISE = 1.08`).

# Academy v3 shared animation kit

Internal authoring kit, built in the assigned worktree. No website changes, publication, partner-registry edits or dependency downloads. The English E05 sample adapts the owner's 2026-10-12 manual; it is a silent 120-second demo with estimated word timing, not a narrated or approved master.

## Run from the repository root

Reuse the **existing** HyperFrames pilot dependency directory. The local session uses the sibling worktree because neither this checkout nor the main checkout has the pilot's dependencies. Set the path to whichever existing pilot dependency directory the lead retains; do not run a network install.

```sh
cd ops/academy-v3
ln -s /Volumes/致态2TB/nx-wt-codex-hyperframes-pilot/ops/academy-v2/hyperframes-l4/node_modules node_modules
npm test
node build.mjs sample-e05.json en
node build.mjs sample-e05.json zh-Hans
node gallery.mjs
node contact-sheets.mjs en
node contact-sheets.mjs zh-Hans
python3 -m http.server 4571 --bind 127.0.0.1
```

Skip `ln -s` if `node_modules` already exists. Tests also reuse the site's existing `pilot-01-prototype/node_modules/jsdom`; no new dependency is added to the site. Dependencies: existing HyperFrames 0.8.149, GSAP 3.15.0, QRCode 1.5.4. GSAP's original license header is preserved in copied runtime assets. The official logo is copied unmodified from `pilot-01-prototype/public/brand/nexualpha/nexualpha-round.svg`. Missing logo/source rigs fail the build.

Open `http://127.0.0.1:4571/evidence/contact-en-landscape.html`, `contact-en-portrait.html`, the corresponding `zh-Hans` pages, or `build/gallery/index.html`. A composition can be inspected at a deterministic time via `build/en-portrait/index.html?at=35`. Stop the preview server when finished. Build outputs and video masters are ignored; source and review evidence are tracked.

### Lead render commands

```sh
cd ops/academy-v3
# Optional: select an ALREADY installed browser; no automatic browser download is authorized.
export HYPERFRAMES_BROWSER_PATH=/absolute/path/to/existing/chrome-or-headless-shell
bash render.sh en sample-e05.json
bash render.sh zh-Hans sample-e05.json
```

`render.sh` builds, performs strict HyperFrames lint, then renders **silent** 1920×1080 and independently composed 1080×1920, 30fps masters. Files: `renders/<locale>-landscape.mp4`, `renders/<locale>-portrait.mp4`. It then extracts nine actual MP4 frames into `evidence/contact-video-*.png`. HTML contact sheets and Chrome JPGs are explicitly HTML-timeline evidence, never encoded-video evidence. Render logs are retained even on failure. This sandbox failed before capture with `uv_os_setpriority returned EPERM`; the lead needs a runtime that permits HyperFrames process creation/priority, not weaker content lint. Voice recording, forced alignment, SFX replacement, muxing, final phone/video playback review and content/brand approval remain lead production gates.

### Lead narration commands

```sh
cd ops/academy-v3
node narration-plan.mjs --out build/narration/narration-plan.json
bash narrate.sh
```

`narration-plan.mjs` reads the reviewed v3 episode files for E05, E09 and E21, adapts their `tc` timecodes into global seconds, and includes every scene: problem shot, open, lesson shots, conversion card where supplied, end hook and close. The plan routes Sam to the separate Qwen3 VoiceDesign profile with the recorded instruction text, and routes Nexubo/narrator lines through the owner-approved English clone command from `OWNER-NOTE.txt`.

`narrate.sh` uses the existing `/Volumes/致态2TB/nx-agents/education/v2/.venv` only, sets Hugging Face/Transformers offline flags, writes one wav per spoken line, and writes `build/narration/generation-manifest.json`. In a headless sandbox without Metal it stops with a `blocked-metal-unavailable` manifest; that is expected and is not narrated delivery. After the lead generates wavs, replace estimated timings with measured alignment before muxing narration and approved SFX into rendered videos.

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

`sample-e05.json` is the complete bilingual reference. The incoming episode directory did not exist at implementation time, so the lead must adapt those scripts to this explicit contract before bulk production.

- `version: 1`, `episode: 1..24`, `slug: lower-case-kebab`, `title: {en, "zh-Hans"}`, optional `direction: "ltr" | "rtl"`.
- `shots[]`: unique CSS-safe `id`, `duration` in seconds aligned to 30fps, `set`, `visual_en` storyboard description, `onscreen_text_en` / `onscreen_text_zh-Hans` (or localized `onscreen_text`), `antenna`, optional `ding`, `nexubo: {pose, expression}`, `sam: {pose, expression}`, `widgets[]`, `lines[]`.
- First shot lasts exactly 6 seconds. Builder inserts the 3-second brand shot after it; other shots follow. Shot-local line times do **not** include the brand insertion. The demo retains E05's learning boundaries and adjusts the recap to accommodate a 4-second next hook within 120s.
- `lines[]`: `speaker: "sam" | "nexubo" | "narrator"`, localized `text`, `start`, `end` in **shot-local** seconds, ordered and nonoverlapping. Optional `words: {en: [{text,start,end}], "zh-Hans": [...]}` (or single-language word array). Words use the same shot-local clock, preserve all spoken text, and may contain gaps. Missing words are estimated with `Intl.Segmenter`; replace them using real alignment before voiced delivery.
- `end_hook: {duration: 3..5, text: {en, "zh-Hans"}, pose?}`. `close_duration: 4..6` (defaults to 4). Neither includes real narration in this demo.
- `conversion_card: null` or `{duration: 4..10, partner_name?, code?, rebate_line?, disclosure}`. All copy can be localized. Commercial values appear only when supplied; code/rebate require a partner name. Disclosure is mandatory on the same card. The QR always encodes `https://nexualpha.com/starter/<slug>?src=academy-video`; there is no partner-link override. E05 supplies no conversion or commercial data.
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

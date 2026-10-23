# Footer redesign — lead review handoff

This is a local source/SSR handoff on `codex/footer-redesign`. No browser was opened, no deployment or push was performed. Browser appearance, geometry, accessibility-tree behavior and measured CLS still require the lead's review.

## Layout intent by breakpoint

| Width | Closing panel | Related research | Footer |
| --- | --- | --- | --- |
| 390px (also safe-width rules for 320px) | Centred short heading and supporting line; two full-width, 52px-minimum buttons stacked; partner tiles in two columns. | Six paired-logo comparison cards in two columns; tools/assets use icon cards; extra research is in native details. | Brand/tagline, labelled social icon tiles, 3×2 official-entry logo grid; four navigation sections in two columns; logo strip wraps; language chips and extra comparisons expand natively. Legal row centres and wraps. |
| 768px | Centred panel; buttons side by side when their native labels fit, wrapping when needed; partner row wraps without clipping. | Three comparison columns; other groups in two columns; language chips wrap. | Brand/socials beside official-entry tiles, then four navigation columns. |
| 1440px (same container at 1728px) | 1200px-max hairline panel, reserved logo dimensions, static grid and teal/blue glow. | 1200px shell; three comparison columns and two secondary group columns. | 4:8 brand/navigation split; compact centred discovery/language/legal rows. |

Arabic/Urdu inherit RTL and use logical spacing; paired exchange marks preserve their LTR identity. Long native button labels wrap. The decorative dot and hover effects use CSS only; reduced motion disables them. All content is visible before hydration. Image dimensions and SSR-linked CSS reserve logo space; this is not a measured CLS claim.

## Preserved behavior

- Closing GET actions remain the localized `/exchanges` and `/compare/binance-vs-okx` destinations.
- Every former footer and related-research href remains a real SSR anchor, including native-details contents. The frozen fixture records 141 cases / 3,353 href entries from baseline `ab3f70dd292ea33f070ee1856cde84b47598d122`.
- Official-entry routes, social URLs, disclosure wording and partner facts are unchanged. The existing organization/disclosure text now sits directly in the official-entry panel. Neutral/Vietnam gates suppress promotion; Türkiye restrictions use the effective home market.
- Closing tiles use the same partner order, rebate-share source, localized “up to” label and percentage formatter as the existing home strip. No fee-gap number is invented: the existing related-link dataset has no fee-gap field or scenario.
- Footer/closing styles stay in `src/styles/v5/shell.css`, already linked site-wide. Related research keeps its existing lazy component stylesheet. No dependency or data module was added, and no interactive footer JavaScript was introduced.

## SSR evidence

Run from `pilot-01-prototype` after a successful build:

```sh
node scripts/render-footer-redesign-evidence.mjs
```

This saves `home-en.html` (`/`), `home-zh-hans.html` (`/zh-hans`), `home-ar.html` (`/ar`), `venue-bitget.html` (`/exchanges/bitget`), and `article-en.html` (a real published English article selected from the checked-in feed). `ssr-manifest.json` records the article URL, hashes and linked stylesheets. Captures use the production SSR renderer plus the built shell and route CSS selector. External hydration scripts are removed for static review. Asset URLs refer to the same build's `dist/client`; these are layout evidence, not a production HTTP/SEO capture. The script also verifies footer CSS before hydration on every captured route and the built Vietnam promotion gate.

## Verification and environment

Logs in this folder hold the exact command results. The final Node 24 build and strict budget pass; home entry gzip is 317,517 bytes / 350,000. Typecheck passes. Component/href tests pass 45/45; market SSR tests 2/2; home/news/venue route tests 28/28; built-shell/venue tests 9/9; the updated home-contract test 1/1. The final report lists exact commands. Build-generated tracked public files were restored byte-for-byte from HEAD. Local staging/commit is blocked by the sandbox: Git cannot create `.git/worktrees/nx-wt-codex-footer-redesign/index.lock` (Operation not permitted). The scoped changes remain on the assigned branch for lead extraction; `COMMIT_MESSAGE.txt` holds the required Lore/Co-Authored-By message.

The sandbox initially lacked two ignored build prerequisites. Existing SDK-supported Paraglide caches were copied from the main checkout's `project.inlang/cache/plugins/{v09uaobkx31q,3bu267kwao0k}` into this worktree, then `npm run i18n:compile` restored real localized messages. The main checkout's empty `.openai/hosting.json` was copied into this worktree's ignored `.openai/`. No dependencies, source config or credentials were changed. Builds use the installed supported Node 24 via `PATH="/opt/homebrew/opt/node@24/bin:$PATH"`.

The related Vite SSR tests can log an HMR `listen EPERM` warning in this sandbox while completing successfully; no listening service is required by these tests. The normal build also logs existing circular chunk warnings.

Better Design UI/UX-principles and review-rules requests returned the free-query quota error. Its text-only comprehension check passed; spacing returned `needs-capture`, with no geometry measured. The installed `visual-verdict` skill is hard-deprecated. The brief explicitly prohibits browser use, so no visual verdict or browser/CLS approval is claimed. A separate source review found the missing market prop, which was fixed and covered with full-App SSR tests.

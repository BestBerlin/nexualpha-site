# Starter Path

The English `/starter` and Simplified Chinese `/zh-hans/starter` routes share the twelve build-time lesson JSON files under `src/data/starter/levels`. Other locale routes render the English lesson body; only the English and Simplified Chinese editions have hreflang links.

Browser progress is stored under `nexualpha-starter-v1`. Checklist positions and quiz option indexes are shared across language editions. A lesson is completed after every checklist item is checked or all three quiz answers are correct. Storage failures leave the current visit usable. The Telegram checklist appears after every public lesson is completed.

Level 7 is withheld from public navigation and remains noindex by default. Its map position contains only an unlinked review placeholder. Set the server environment variable `STARTER_LEVEL7_REVIEWED=true` only after owner review; the Worker passes the same review state into React SSR, and the browser reads the SSR marker during hydration. Sensitive lessons have no partner CTA even after review.

Partner destinations are resolved from `publicCtaForVenue` and `regionalVenueCta`, gated through `isPartnerPromotableIn`. The CTA uses the existing source validator for `src=starter-<slug>` and the existing commission disclosure component. Blocked destinations retain the regional research URL. Explicit market context is preserved between lessons.

No video IDs are currently supplied. A valid `meta.video_youtube_id` enables the click-to-load YouTube privacy embed; its schema is emitted only when the same ID validation passes. Video upload dates should come from `meta.video_upload_date`, rather than the lesson modification date.

Verification commands (from `pilot-01-prototype`):

```sh
npm run typecheck
node --test tests/starter-data-progress.test.mjs tests/starter-routes-ssr.test.mjs tests/starter-interaction.test.mjs
npm run build
npm run test:sites
PORT=4173 npm run preview
python3 scripts/verify-starter-browser.py --base-url http://127.0.0.1:4173 --paths /starter,/starter/what-am-i-buying,/zh-hans/starter,/zh-hans/starter/what-am-i-buying --widths 390,768,1440
```

Browser evidence is kept in `docs/evidence/starter-module/runtime-final/`. This change is for local review; it does not deploy the site or contact Telegram.

Visible Chrome verification used one origin (`http://127.0.0.1:4173`) and waited for hydration before reading progress. Completion survived reload and hub navigation; completing all eleven public lessons exposed the Telegram checklist. The automated headless browser launcher was unavailable in this sandbox, so the recorded screenshots and interactions use visible Chrome.

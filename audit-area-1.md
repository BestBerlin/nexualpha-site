# Audit area 1: Routing + SSR worker

| Finding | File:line | Severity | Fixed? | Evidence / notes |
| --- | --- | --- | --- | --- |
| Attribution query HTML (`?src=`, `?p=`) was shared-cacheable even though locale redirects preserve those parameters, so one visitor's attribution-context HTML could be reused by another visitor. | `pilot-01-prototype/worker/index.js:9433` | P1 user-visible/cache integrity | Yes | Added `src` and `p` to `HTML_PRIVATE_CONTEXT_PARAMS`; `tests/sites-worker.test.mjs:153` and `tests/sites-worker.test.mjs:393` assert both direct and redirected attribution routes return `private, no-store, max-age=0`. |
| Regional market roots `/id`, `/jp`, and `/kr` were swallowed by retired-locale alias redirects before country-route handling; `/jp?locale=ja` returned 301 to `/ja` instead of the indexable Japan regional page. | `pilot-01-prototype/src/data/locale-routing.js:53` | P1 user-visible SEO/routing | Yes | `localeAliasRedirect` now exempts country-route roots while retaining deeper legacy redirects such as `/jp/exchanges/... -> /ja/exchanges/...`; `tests/locale-routing.test.mjs:122` and `tests/locale-routing.test.mjs:175` cover the root/deeper split. |
| Country-root contract tests still treated `/id`, `/jp`, and `/kr` as retired locale aliases, so the regression suite would reject the intended regional pages and miss empty-shell SSR on runtime-only roots. | `pilot-01-prototype/tests/prerender-contract.test.mjs:28`, `pilot-01-prototype/tests/prerender-contract.test.mjs:185`, `pilot-01-prototype/tests/prerender-contract.test.mjs:241` | P1 test coverage / SSR correctness | Yes | Added a real `NEWS_SSR_RENDER` harness for country-root Worker.fetch cases; tests now assert `/id`, `/jp`, `/kr` return 200, full SSR `<main><h1>`, prerender state, and delayed hydration while deeper `/id|/jp|/kr/exchanges/...` aliases still 301 to canonical locale paths. |
| Finder and Telegram tests conflated country routes with language homes. Finder regional intent must return `/jp` and `/kr`; Japanese language HOME must remain `/ja`. | `pilot-01-prototype/tests/finder-behavior.test.mjs:53`, `pilot-01-prototype/tests/finder-behavior.test.mjs:123`, `pilot-01-prototype/tests/telegram-ecosystem.test.mjs:1419`, `pilot-01-prototype/tests/telegram-ecosystem.test.mjs:2207` | P2 contract/test coverage | Yes | Finder high-intent regional results now assert `/jp` and `/kr`; Telegram keeps `localizedHref("/", { locale: "ja" }) -> /ja` and pins regional campaign backlinks to `/jp`/`/kr` where the source topic is a country page. |
| Flash metadata could throw when all feed sources and stale snapshots were absent; the first fallback also risked masking feed outage as an indexable empty stream and rendering an item URL with the stream component. | `pilot-01-prototype/worker/index.js:4781`, `pilot-01-prototype/worker/index.js:8424`, `pilot-01-prototype/src/components/flash/FlashPages.jsx:120`, `pilot-01-prototype/src/components/flash/FlashPages.jsx:263`, `pilot-01-prototype/src/data/flash.js:81`, `pilot-01-prototype/tests/flash.test.mjs:186` | P1 user-visible SSR availability / hydration correctness | Yes | Flash no-source/no-stale now returns explicit 503 `no-store`, `Retry-After: 300`, `noindex,follow`, no redirect, no synthetic `generatedAt`, and route-matched SSR for both stream and item payloads. The Flash components render localized unavailable copy instead of the normal empty state and do not poll/refetch from an unavailable prerender. Regression hydrates both `/flash` and one `/flash/<item>` 503 response with zero hydration errors and verifies no internal reason text leaks. |
| Representative route-template × locale Worker.fetch matrix with real dist assets and `NEWS_SSR_RENDER` covers `/flash` and 16 other canonical templates without throws, empty roots, missing prerender state, or client-render fallback. | probe only | P2 audit coverage | N/A | Final matrix checked 17 templates × 17 locales = 289 responses, all 200 with full SSR. A first exploratory run using retired `/factbook/binance` correctly found 17 expected 301 redirects; the reproducible matrix uses canonical `/factbook` as the factbook template. |
| HeadlessChrome vs normal-UA home HTML parity was probed under forced home-hero experiment mode in the earlier area1 pass. The HTML body length/content matched in the assets-only shell probe; headers differed as designed (`set-cookie` only for non-bot). | probe only | P2 audit coverage | N/A | Root later took ownership of the actual hero-experiment UA parity fix/test; no area1 file change made there. |

## Tests / limits

- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && node --test tests/locale-routing.test.mjs tests/seo-route-boundaries.test.mjs` -> pass, 24/24.
- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && node --test --test-name-pattern "referral and campaign|redirected locale URLs" tests/sites-worker.test.mjs` -> pass, 2/2.
- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && node --test --test-name-pattern "worker prerenders Taiwan|regional JP KR" tests/prerender-contract.test.mjs` -> pass, 2/2.
- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && cd pilot-01-prototype && node --test tests/flash.test.mjs` -> pass, 29/29.
- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && cd pilot-01-prototype && node --test tests/flash.test.mjs tests/finder-behavior.test.mjs tests/prerender-contract.test.mjs tests/telegram-ecosystem.test.mjs tests/locale-routing.test.mjs tests/sites-worker.test.mjs` -> pass, 168/168.
- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && cd pilot-01-prototype && npm run typecheck` -> pass (`tsc -p tsconfig.json`).
- Route-template matrix command (run from `pilot-01-prototype`):

```sh
zsh /Volumes/致态2TB/nx-agents/load-gate.sh && node --input-type=module <<'NODE'
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import worker from './worker/index.js';
import { createSsrHarness } from './tests/helpers/ssr-hydration-harness.mjs';
import { localizedHref } from './src/data/locale-routing.js';
import { PRERENDER_LOCALES } from './scripts/generate-prerender-manifest.mjs';
import { normalizeNewsFeed } from './src/data/news-feed-client.js';
const root = process.cwd();
const indexHtml = await readFile(path.join(root, 'dist/client/index.html'), 'utf8');
const prerenderManifest = await readFile(path.join(root, 'dist/client/prerender-manifest.json'), 'utf8');
const newsFeedText = await readFile(path.join(root, 'dist/client/content/news-feed.json'), 'utf8');
const now = Date.now();
const ago = (ms) => new Date(now - ms).toISOString();
const flashAssets = {
  '/intel/official-announcements.json': { generatedAt: ago(0), items: [{ id: 'okx:matrix-ct', venue: 'okx', category: 'listing', title: 'OKX to list CT/USDT (Concrete) for spot trading', url: 'https://www.okx.com/help/okx-to-list-ct-usdt', publishedAt: ago(7200000), sourceType: 'official_api' }] },
  '/intel/official-announcements-archive.json': { items: [] },
  '/content/campaign-briefs.json': { items: [] },
  '/intel/market-events.json': { generatedAt: ago(300000), history: { hourly: [] }, market: { majors: [], movers: [] }, funding: { generatedAt: ago(300000), rows: [] } },
};
const firstArticle = normalizeNewsFeed(JSON.parse(newsFeedText))[0]?.slug;
const assets = { fetch: async (request) => { const pathname = new URL(request.url).pathname; if (pathname === '/index.html') return new Response(indexHtml, { headers: { 'content-type': 'text/html; charset=utf-8' } }); if (pathname === '/prerender-manifest.json') return new Response(prerenderManifest, { headers: { 'content-type': 'application/json; charset=utf-8' } }); if (pathname === '/content/news-feed.json') return new Response(newsFeedText, { headers: { 'content-type': 'application/json; charset=utf-8' } }); if (flashAssets[pathname]) return Response.json(flashAssets[pathname]); if (pathname.startsWith('/prerender/')) { try { return new Response(await readFile(path.join(root, 'dist/client', pathname), 'utf8'), { headers: { 'content-type': 'application/json; charset=utf-8' } }); } catch { return new Response('missing', { status: 404 }); } } return new Response('missing', { status: 404 }); } };
const templates = ['/', '/exchanges', '/exchanges/binance', '/compare/binance-vs-okx', '/activities', '/rates', '/onchain', '/methodology', '/partners', '/telegram', '/topics/derivatives', '/factbook', '/news', `/news/${firstArticle}`, '/flash', '/markets/turkiye', '/funding-rates/matrix'];
const harness = await createSsrHarness();
const env = { ASSETS: assets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) };
const failures = [];
let checked = 0;
for (const template of templates) for (const locale of PRERENDER_LOCALES) { const href = localizedHref(template, { locale }); const response = await worker.fetch(new Request(`https://nexualpha.com${href}`, { headers: { accept: 'text/html', 'user-agent': 'Mozilla/5.0 MatrixAudit/1.0' } }), env); const body = await response.text(); checked += 1; if (response.status !== 200) failures.push(`${template}|${locale}|${href}: status ${response.status}`); if (!/<main\b[\s\S]*<h1\b/i.test(body)) failures.push(`${template}|${locale}|${href}: missing main/h1 SSR`); if (!/id="nexualpha-prerender-state"/.test(body)) failures.push(`${template}|${locale}|${href}: missing prerender state`); if (/data-nexualpha-client-render="true"/.test(body)) failures.push(`${template}|${locale}|${href}: client-render fallback`); }
await harness.close();
console.log(JSON.stringify({ templates: templates.length, locales: PRERENDER_LOCALES.length, checked, failures: failures.length }, null, 2));
if (failures.length) { console.error(failures.slice(0, 60).join('\n')); process.exit(1); }
NODE
```

Result: pass with `{"templates":17,"locales":17,"checked":289,"failures":0}`.

- Full build and full `test:sites` were not run because root owns those commands in this deep audit split.

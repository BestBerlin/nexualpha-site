import { readFile } from "node:fs/promises";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

const generatedBuildId = `3.0-${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}`;
const requestedBuildId = process.env.BUILD_ID?.trim();
if (requestedBuildId && !/^3\.0-[0-9A-Za-z._-]{6,64}$/.test(requestedBuildId)) {
  throw new Error("BUILD_ID must use the 3.0- prefix and contain only letters, numbers, dots, underscores or hyphens");
}
const buildId = requestedBuildId || generatedBuildId;
const ssrLazyChunkWarningModules = [
  "/src/components/finder/CommandFinder.jsx",
  "/src/components/finder/SearchDialog.jsx",
  "/src/components/v3/CampaignRadar.jsx",
  "/src/components/v7/home7-below.jsx",
  "/src/components/v6/closing-index.jsx",
];

// Client builds: `import.meta.env.SSR ? import.meta.glob([...], { eager: true }) : {}` kept every page module statically
// reachable from the browser entry, because Vite expands the eager glob into static imports before the dead SSR branch
// is dropped (every page downloaded ~1.7 MB of route chunks after hydration, perf lane 2026-10-11). The browser
// transform replaces that eager glob with an empty object; the SSR transform (options.ssr) keeps it.
const SSR_EAGER_GLOB_PATTERN = /import\.meta\.env\.SSR\s*\?\s*import\.meta\.glob\((?:\[[^\]]*\]|"[^"]*")\s*,\s*\{\s*eager:\s*true\s*\}\)\s*:\s*\{\}/g;
export function dropSsrEagerGlobForClient(code) {
  if (!code.includes("eager: true")) return null;
  const next = code.replace(SSR_EAGER_GLOB_PATTERN, "import.meta.env.SSR ? {} : {}");
  return next === code ? null : next;
}
export const clientDropsSsrEagerGlobPlugin = () => ({
  name: "nexualpha-client-drops-ssr-eager-glob",
  enforce: "pre",
  transform(code, id, options) {
    if (options?.ssr || !/\.[jt]sx?(?:\?|$)/.test(id)) return null;
    const next = dropSsrEagerGlobForClient(code);
    return next === null ? null : { code: next, map: null };
  },
});

function isExpectedSsrLazyChunkWarning(warning) {
  const message = String(warning?.message || "");
  return message.includes("is dynamically imported by")
    && message.includes("but also statically imported by")
    && message.includes("dynamic import will not move module into another chunk")
    && ssrLazyChunkWarningModules.some((modulePath) => message.includes(modulePath));
}

const CLIENT_ENTRY_SUFFIX = "/src/main.jsx";
const reachabilityCache = new Map();
// True when `id` is reached from the module ending in `rootSuffix` through static imports only (dynamic imports do not
// count). Used to keep always-loaded modules together and to give the lazily imported SEO injector its own closure.
function isStaticallyReachableFrom(id, rootSuffix, getModuleInfo) {
  if (!id.includes("/src/") || id.endsWith(rootSuffix) || /\.css(?:\?|$)/.test(id)) return false;
  const info = getModuleInfo(id);
  if (!info || info.isExternal) return false;
  if (info.importedIds.some((imported) => /\.css(?:\?|$)/.test(imported))) return false;
  const visit = (moduleId, trail) => {
    if (moduleId.endsWith(rootSuffix)) return true;
    const cacheKey = `${rootSuffix}|${moduleId}`;
    if (reachabilityCache.has(cacheKey)) return reachabilityCache.get(cacheKey);
    if (trail.has(moduleId)) return false;
    trail.add(moduleId);
    const importers = getModuleInfo(moduleId)?.importers || [];
    const reachable = importers.some((importer) => visit(importer, trail));
    trail.delete(moduleId);
    if (reachable) reachabilityCache.set(cacheKey, true);
    return reachable;
  };
  return visit(id, new Set());
}
const isStaticallyReachableFromClientEntry = (id, getModuleInfo) => isStaticallyReachableFrom(id, CLIENT_ENTRY_SUFFIX, getModuleInfo);

// Stylesheet link order of index.html. Route chunks are reached through dynamic imports since 2026-10-11, so Vite no
// longer links their CSS in index.html; the worker's per-route stylesheet filter (and SSR pages styled before any JS
// runs) depend on every route stylesheet being linked there in a stable cascade order. nexualpha-link-route-stylesheets
// re-links every emitted stylesheet in this order (the order Vite produced while the chunks were static), then
// nexualpha-ordered-route-stylesheets positions the early/mid/late layers around the entry stylesheet as before.
export const STYLESHEET_LINK_ORDER = Object.freeze([
  // Shared component styles split out of a route stylesheet keep that route's name prefix, so the worker's per-route
  // allow-list applies them on exactly the routes it did before (e.g. the disclosure line stays news-only in SSR and
  // .mx-disclosure keeps winning on the directory).
  "route-news-commission", "route-topic-guide-bridge",
  "route-v3-registration", "route-kol", "route-v3-wizard", "route-v3-calculators", "shared-decision-return", "route-v3-home",
  "route-factbook", "shared-decision-rail", "route-embed", "route-rates", "route-v3-social-proof", "route-market",
  "route-methodology", "route-onchain", "route-partners", "route-topic-guide", "route-v3-decision-articles", "route-activity",
  "route-v3-research-panels", "route-v3-readiness", "route-v3-pages-strip", "route-v3-pages", "route-news-shared",
  "route-telegram", "route-tokenized-assets", "route-international", "route-data",
  "page-home-early", "index", "page-home-mid1", "page-compare-mid1", "page-profile-mid1", "core-b", "page-home-mid2",
  "page-directory-mid2", "page-detail-mid2", "core-c", "page-home-late", "page-br-late", "page-rates-late",
  "page-factbook-late", "page-telegram-late",
]);
export const stylesheetChunkName = (fileName) => fileName.split("/").pop().replace(/-[\w-]{8}\.css$/, "");
export function orderStylesheetFiles(fileNames) {
  const firstPage = STYLESHEET_LINK_ORDER.indexOf("page-home-early");
  const rank = (fileName) => {
    const index = STYLESHEET_LINK_ORDER.indexOf(stylesheetChunkName(fileName));
    // A chunk this list does not know yet is a route stylesheet: it joins the route group, before the page layers.
    return index === -1 ? firstPage - 0.5 : index;
  };
  return [...fileNames].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}
export function relinkStylesheets(html, cssFileNames) {
  const existing = new Set();
  let stripped = html.replace(/\s*<link\b[^>]*rel="stylesheet"[^>]*href="[^"]*\/(assets\/[\w-]+\.css)"[^>]*>/g, (_tag, file) => { existing.add(file); return ""; });
  const files = orderStylesheetFiles([...new Set([...existing, ...cssFileNames])]);
  const links = files.map((file) => `<link rel="stylesheet" crossorigin href="/${file}">`).join("\n    ");
  if (!/<\/head>/i.test(stripped)) throw new Error("link route stylesheets: </head> not found");
  // Keep the links where Vite put them: right after the entry module script when it exists, else before </head>.
  const anchor = /<script\b[^>]*type="module"[^>]*><\/script>(?:\s*<link\b[^>]*rel="modulepreload"[^>]*>)*/i;
  if (anchor.test(stripped)) return stripped.replace(anchor, (match) => `${match}\n    ${links}`);
  return stripped.replace(/<\/head>/i, `    ${links}\n  </head>`);
}

export default defineConfig(({ isSsrBuild = false }) => ({
  define: { __NEXUALPHA_BUILD_ID__: JSON.stringify(buildId) },
  build: {
    outDir: "dist/client",
    rollupOptions: {
      onwarn(warning, warn) {
        if (isExpectedSsrLazyChunkWarning(warning)) return;
        warn(warning);
      },
      output: {
        // Keep the large route/editorial surface cacheable independently from
        // the app shell. This reduces repeat navigation cost without changing
        // SSR output or hiding indexable content behind a client-only loader.
        manualChunks(id, { getModuleInfo }) {
          // This navigation is shared by several lazy routes. Otherwise Rollup
          // assigns its CSS to Factbook and route-specific HTML drops the style.
          if (id.endsWith("/src/components/v3/decision-path-rail.css")) return "shared-decision-rail";
          // The entry stylesheet is split into ordered chunks (re-linked in cascade order by
          // nexualpha-ordered-route-stylesheets below); the worker allow-lists each "page-*-" prefix per route.
          // Shared cascade layers after the entry stylesheet (always linked; "core-" prefix).
          if (id.endsWith("/src/styles/split/core-b.css")) return "core-b";
          if (id.endsWith("/src/styles/v6/index.css")) return "core-c";
          // Route-only layers of the mid cascade (slot 1: before core-b, slot 2: between core-b and core-c).
          if (id.endsWith("/src/styles/split/home-mid1.css")) return "page-home-mid1";
          if (id.endsWith("/src/styles/split/compare-mid1.css")) return "page-compare-mid1";
          if (id.endsWith("/src/styles/split/profile-mid1.css")) return "page-profile-mid1";
          if (id.endsWith("/src/styles/split/home-mid2.css")) return "page-home-mid2";
          if (id.endsWith("/src/styles/split/directory-mid2.css")) return "page-directory-mid2";
          if (id.endsWith("/src/styles/split/detail-mid2.css")) return "page-detail-mid2";
          if (id.endsWith("/src/styles/v6/home.css")) return "page-home-late";
          if (id.endsWith("/src/components/v3/matcher.css") || id.endsWith("/src/components/v3/campaign-radar.css")) return "page-home-early";
          if (id.endsWith("/src/styles/v6/pages-br.css")) return "page-br-late";
          if (id.endsWith("/src/styles/v6/pages-rates.css")) return "page-rates-late";
          if (id.endsWith("/src/styles/v6/pages-factbook.css")) return "page-factbook-late";
          if (id.endsWith("/src/styles/v6/pages-telegram.css")) return "page-telegram-late";
          if (id.endsWith("/src/components/v3/decision-return-link.css")) return "shared-decision-return";
          if (id.includes("/node_modules/react/") || id.includes("/node_modules/react-dom/")) return "vendor-react";
          if (id.includes("/node_modules/@inlang/") || id.includes("/node_modules/@paraglide/")) return "vendor-i18n";
          // Rollup folds the unassigned static dependencies of a manual chunk into that chunk. Before 2026-10-11 that
          // dragged data every page needs (locale routing, CTA copy, exchange facts...) into route chunks, so the
          // browser entry pulled route-international, route-activity, data-telegram and more on every page. Data,
          // content and helper modules that the browser entry reaches through static imports now share one chunk that
          // is always loaded first; components keep their place so their stylesheets keep their link position.
          if (!isSsrBuild && /\/src\/(?:data|content|lib|hooks|utils|paraglide)\//.test(id) && isStaticallyReachableFromClientEntry(id, getModuleInfo)) return "core-shared";
          // Home copy is read by the first screen and by the registration card: keep it with the always-loaded data.
          if (!isSsrBuild && id.includes("/src/components/v7/home7-copy")) return "core-shared";
          // Home first screen: the alerts strip (and the alerts copy it shares with article footers) must not drag the V3
          // page or news chunks in. Its stylesheet keeps the "route-v3-pages-" prefix it had inside the V3 page chunk, so
          // the worker links it on the same routes as before.
          if (!isSsrBuild && (id.includes("/src/components/v3/TelegramAlertsStrip") || id.endsWith("/src/components/v3/telegram-signal-strip.css")
            || id.includes("/src/components/v3/news/NewsTelegramAlerts"))) return "route-v3-pages-strip";
          // Modules shared by two route chunks used to be absorbed into one of them and formed circular chunks
          // (route-topic-guide <-> route-international, route-v3-pages -> route-v3-calculators -> route-news-shared ->
          // route-v3-pages). Loaded statically from the entry that happened to work; loaded on demand it threw
          // "Cannot access ... before initialization". Shared pieces get their own chunk, named with the prefix of the
          // stylesheet they came from so the worker links their CSS on the same routes as before.
          if (!isSsrBuild) {
            if (id.includes("/src/components/v3/NextDecisionBridge") || id.endsWith("/src/components/v3/next-decision-bridge.css")) return "route-topic-guide-bridge";
            if (id.includes("/src/components/v3/CommissionDisclosureLine") || id.endsWith("/src/components/v3/commission-disclosure-line.css")) return "route-news-commission";
            if (id.includes("/src/components/v3/OnsiteTelegramBotHandoff")) return "shared-onsite-telegram-handoff";
            if (id.includes("/src/data/referral-seo.js") || id.includes("/src/data/referral-partners.generated.js")) return "data-referral-seo";
            if (id.includes("/src/data/aeo-question-registry.js") || id.includes("/src/data/topic-reviewed-faqs.js") || id.includes("/src/data/international-source-registry.js")) return "data-aeo-questions";
          }
          // CSS-free components shared by the shell and route modules (otherwise a route chunk absorbs them).
          if (!isSsrBuild && (id.includes("/src/components/brand/BrandMark") || id.includes("/src/components/brand/NexuAlphaWordmark")
            || id.includes("/src/components/v3/CleanFooter") || id.includes("/src/components/v7/home7-shared")
            || id.includes("/src/components/shared/DeferUntilVisible"))) return "core-ui";
          // Keep infrequently visited editorial and regional surfaces out of
          // the first route payload. They remain statically imported for SSR,
          // but can be cached and fetched as separate browser chunks.
          if (id.includes("/src/components/data/")) return "route-data";
          if (id.includes("/src/components/v3/MethodologyPage")) return "route-methodology";
          if (id.includes("/src/components/v3/brand-pages/")) return "route-brand-pages";
          if (id.includes("/src/components/v3/TokenizedAssetsPage")) return "route-tokenized-assets";
          if (id.includes("/src/components/v3/TopicGuidePage")) return "route-topic-guide";
          if (id.includes("/src/components/v3/FactbookPage")) return "route-factbook";
          if (id.includes("/src/components/v3/international/")) return "route-international";
          if (id.includes("/src/components/v3/activity/")) return "route-activity";
          if (id.includes("/src/components/v3/news/NewsListPage")) return "route-news-list";
          if (id.includes("/src/components/v3/news/NewsDetailPage")) return "route-news-detail";
          if (id.includes("/src/components/v3/news/")) return "route-news-shared";
          if (id.includes("/src/components/v3/CollectionHubPage")) return "route-collection-hubs";
          if (id.includes("/src/components/v3/KolLandingPage")) return "route-kol";
          if (id.includes("/src/components/v3/TelegramBotHub")) return "route-telegram";
          if (id.includes("/src/data/seo-injection.js")) return "data-seo-injection";
          // Scroll-loaded home sections (DeferUntilVisible): own chunks, so a route module that shares a helper with them
          // cannot absorb them into its chunk.
          if (!isSsrBuild && /\/src\/components\/v7\/home7-(?:below|funding|telegram)\.jsx$/.test(id)) return "home-below-fold";
          if (!isSsrBuild && id.includes("/src/components/v6/closing-index")) return "home-closing-index";
          if (id.includes("/src/components/v3/FeeBenchmarkTerminal")) return "route-rates";
          if (id.includes("/src/components/v3/MarketFearGreedPanel")) return "route-market";
          if (id.includes("/src/components/v3/OnChainLiquidityBoard")) return "route-onchain";
          if (id.includes("/src/components/v3/EmbedCalculator")) return "route-embed";
          if (id.includes("/src/components/v3/PartnerEmbedGuide")) return "route-partners";
          if (id.includes("/src/components/v3/TraderWizardModal")) return "route-v3-wizard";
          if (id.includes("/src/components/v3/TradingBleedAnalyzer")) return "route-v3-calculators";
          if (id.includes("/src/components/v3/FeeRebateCalculator")) return "route-v3-calculators";
          if (id.includes("/src/components/v3/RegistrationCard")) return "route-v3-registration";
          if (id.includes("/src/components/v3/VenueFaqSection")) return "route-v3-venue-faq";
          if (id.includes("/src/components/v3/CompareFinalChoiceCard")) return "route-v3-compare-final-choice";
          if (id.includes("/src/components/v3/ResearchPanels")) return "route-v3-research-panels";
          if (id.includes("/src/components/v3/VenueDecisionArticles")) return "route-v3-decision-articles";
          if (id.includes("/src/components/v3/VenueReadinessChecklist")) return "route-v3-readiness";
          // Shared by the home closing band and the regional rails: keep the copy out of the deferred hero chunk.
          if (id.includes("/src/components/v3/LeanHeroCopy")) return "shared-hero-copy";
          if (id.includes("/src/components/v3/LeanHero")) return "route-v3-home";
          if (id.includes("/src/components/v3/TopIntelligenceHub")) return "route-v3-home";
          if (id.includes("/src/components/v3/AntiPhishingVerifier")) return "route-v3-security";
          if (id.includes("/src/components/v3/LiveConversionProof")) return "route-v3-social-proof";
          if (id.includes("/src/components/v3/RebateTickerBar")) return "route-v3-social-proof";
          if (id.includes("/src/data/topic-guides-data.js")) return "data-topic-guides";
          if (id.includes("/src/data/factbook-registry.js")) return "data-factbook";
          if (id.includes("/src/data/venue-database.js")) return "data-venue";
          if (id.includes("/src/data/exchange-research.js")) return "data-research";
          if (id.includes("/src/data/official-campaign-research.js")) return "data-official-research";
          if (id.includes("/src/data/venue-decision-content.js")) return "data-decision-content";
          if (id.includes("/src/data/priority-venue-answers.js")) return "data-priority-venue-answers";
          if (id.includes("/src/data/compare-direct-answers.js")) return "data-compare-direct-answers";
          if (id.includes("/src/data/compare-faq-locales.js")) return "data-compare-faq-locales";
          if (id.includes("/src/data/telegram-config.js")) return "data-telegram";
          if (id.includes("/src/data/directory-context.js")) return "data-directory-context";
          if (id.includes("/src/data/partner-registry.js")) return "data-partner-registry";
          if (id.includes("/src/data/v3-product.js")) return "data-v3-product";
          if (id.includes("/src/content/v3-interface-copy.js")) return "data-v3-interface-copy";
          if (id.includes("/src/components/v3/venue-yellow-pages-copy.js")) return "route-v3-pages-copy";
          if (id.includes("/src/components/v3/venue-yellow-pages-state.js")) return "route-v3-pages-state";
          if (id.endsWith("/src/components/v3/venue-yellow-pages.css")) return "route-v3-pages";
          if (id.includes("/src/components/v3/VenueYellowPages")) return "route-v3-directory";
          if (id.includes("/src/components/v3/V3Pages")) return "route-v3-pages";
          return undefined;
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    fs: {
      // The frontend consumes the generated Shared Core client directly from the sibling backend package.
      allow: [".."],
    },
    proxy: {
      "/api/v1": {
        target: process.env.CORE_API_ORIGIN ?? "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [
    { name: "nexualpha-build-identity", generateBundle() {
      this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ version: "3.0.0", buildId }) });
    } },
    {
      name: "nexualpha-link-route-stylesheets",
      transformIndexHtml: {
        order: "post",
        handler(html, ctx) {
          const bundle = ctx?.bundle;
          if (!bundle) return html;
          const css = Object.values(bundle).filter((item) => item.type === "asset" && /^assets\/[\w-]+\.css$/.test(item.fileName)).map((item) => item.fileName);
          return relinkStylesheets(html, css);
        },
      },
    },
    {
      // The old single entry stylesheet is now a sequence of chunks. Vite links every imported chunk's CSS in module
      // order (before, or for some chunks after, the entry link), so re-link them in cascade order around the entry:
      //   *-early-*  index-*  *-mid1-*  core-b-*  *-mid2-*  core-c-*  *-late-*
      // Every rule keeps its original position; the worker drops the page-* chunks a route does not use.
      name: "nexualpha-ordered-route-stylesheets",
      transformIndexHtml: {
        order: "post",
        handler(html) {
          const pick = (pattern) => {
            const tags = [];
            html = html.replace(new RegExp(`\\s*<link\\b[^>]*rel="stylesheet"[^>]*href="[^"]*/assets/${pattern}-[\\w-]+\\.css"[^>]*>`, "g"), (tag) => { tags.push(tag.trim()); return ""; });
            return tags;
          };
          const slots = ["[\\w-]+-early", "[\\w-]+-mid1", "core-b", "[\\w-]+-mid2", "core-c", "[\\w-]+-late"].map(pick);
          if (!slots.some((tags) => tags.length)) return html;
          const entry = /<link\b[^>]*rel="stylesheet"[^>]*href="[^"]*\/assets\/index-[\w-]+\.css"[^>]*>/;
          if (!entry.test(html)) throw new Error("ordered route stylesheets: entry stylesheet link not found");
          const [early, ...after] = slots;
          return html.replace(entry, (tag) => [...early, tag, ...after.flat()].join("\n    "));
        },
      },
    },
    {
      // Dev only: /liquidations and /funding-rates read /intel/market-events.json, which nginx serves in production
      // from the market collector. Serve a local copy (MARKET_EVENTS_FILE) or proxy the public feed.
      name: "nexualpha-dev-market-events",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use("/intel/market-events.json", async (req, res) => {
          try {
            const body = process.env.MARKET_EVENTS_FILE
              ? await readFile(process.env.MARKET_EVENTS_FILE, "utf8")
              : await (await fetch("https://nexualpha.com/intel/market-events.json", { signal: AbortSignal.timeout(8000) })).text();
            res.setHeader("content-type", "application/json; charset=utf-8");
            res.setHeader("cache-control", "no-store");
            res.end(body);
          } catch {
            res.statusCode = 503;
            res.end("{}");
          }
        });
      },
    },
    clientDropsSsrEagerGlobPlugin(),
    react(),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/paraglide",
      emitTsDeclarations: true,
    }),
  ],
}));

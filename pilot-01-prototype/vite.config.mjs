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
];

function isExpectedSsrLazyChunkWarning(warning) {
  const message = String(warning?.message || "");
  return message.includes("is dynamically imported by")
    && message.includes("but also statically imported by")
    && message.includes("dynamic import will not move module into another chunk")
    && ssrLazyChunkWarningModules.some((modulePath) => message.includes(modulePath));
}

export default defineConfig({
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
        manualChunks(id) {
          // This navigation is shared by several lazy routes. Otherwise Rollup
          // assigns its CSS to Factbook and route-specific HTML drops the style.
          if (id.endsWith("/src/components/v3/decision-path-rail.css")) return "shared-decision-rail";
          if (id.endsWith("/src/components/v3/decision-return-link.css")) return "shared-decision-return";
          if (id.includes("/node_modules/react/") || id.includes("/node_modules/react-dom/")) return "vendor-react";
          if (id.includes("/node_modules/@inlang/") || id.includes("/node_modules/@paraglide/")) return "vendor-i18n";
          // Keep infrequently visited editorial and regional surfaces out of
          // the first route payload. They remain statically imported for SSR,
          // but can be cached and fetched as separate browser chunks.
          if (id.includes("/src/components/v3/MethodologyPage")) return "route-methodology";
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
    react(),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/paraglide",
      emitTsDeclarations: true,
    }),
  ],
});

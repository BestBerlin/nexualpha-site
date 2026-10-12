import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const nexuAlphaWordmark = await readFile(new URL("../src/components/brand/NexuAlphaWordmark.jsx", import.meta.url), "utf8");
const main = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
const pendingDecisionCopySource = await readFile(new URL("../src/data/pending-decision-copy.js", import.meta.url), "utf8");
const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const designSystem = await readFile(new URL("../src/components/DesignSystem.jsx", import.meta.url), "utf8");
const finder = await readFile(new URL("../src/components/finder/CommandFinder.jsx", import.meta.url), "utf8");
const featured = await readFile(new URL("../src/components/opportunity/FeaturedOpportunity.jsx", import.meta.url), "utf8");
const compare = await readFile(new URL("../src/components/compare/QuickCompare.jsx", import.meta.url), "utf8");
const venueExplorer = await readFile(new URL("../src/components/venue-explorer/VenueExplorer.jsx", import.meta.url), "utf8");
const brandMark = await readFile(new URL("../src/components/brand/BrandMark.jsx", import.meta.url), "utf8");
const officialUpdates = await readFile(new URL("../src/components/official-updates/OfficialUpdates.jsx", import.meta.url), "utf8");
const methodology = await readFile(new URL("../src/components/methodology/Methodology.jsx", import.meta.url), "utf8");
const methodologyPage = await readFile(new URL("../src/components/v3/MethodologyPage.jsx", import.meta.url), "utf8");
const methodologyPageCss = await readFile(new URL("../src/components/v3/methodology-page.css", import.meta.url), "utf8");
const cryptoSentiment = await readFile(new URL("../src/components/market-rail/CryptoSentiment.jsx", import.meta.url), "utf8");
const cryptoSentimentCss = await readFile(new URL("../src/components/market-rail/crypto-sentiment.css", import.meta.url), "utf8");
const routes = await readFile(new URL("../src/components/tradfi/MarketRoutes.jsx", import.meta.url), "utf8");
const searchDialog = await readFile(new URL("../src/components/finder/SearchDialog.jsx", import.meta.url), "utf8");
const marketData = await readFile(new URL("../src/data/market-command.js", import.meta.url), "utf8");
const v2Copy = await readFile(new URL("../src/content/v2-copy.js", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles/v2.css", import.meta.url), "utf8");
const refinement = await readFile(new URL("../src/styles/v2-refinement.css", import.meta.url), "utf8");
const releaseVisualGates = await readFile(new URL("../src/styles/release-visual-gates.css", import.meta.url), "utf8");
const tokens = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const v3LayoutStability = await readFile(new URL("../src/styles/v3-layout-stability.css", import.meta.url), "utf8");
const homeV7 = await readFile(new URL("../src/components/v7/HomeV7.jsx", import.meta.url), "utf8");
const closingBand = await readFile(new URL("../src/components/v6/ClosingBand.jsx", import.meta.url), "utf8");
const profileRefinement = await readFile(new URL("../src/styles/profile-refinement.css", import.meta.url), "utf8");
const commandData = await readFile(new URL("../src/data/market-command.js", import.meta.url), "utf8");
const siteData = await readFile(new URL("../src/data/site-data.ts", import.meta.url), "utf8");
const rail = await readFile(new URL("../src/components/market-rail/MarketRail.jsx", import.meta.url), "utf8");
// venue-graph lane 2026-10-11: V3Pages.jsx keeps the compare pages; the venue detail moved to VenueDetailPage.jsx
// (+ VenueDetailResearch.jsx for the collapsed sources hub, venue-detail-shared.jsx and v3-pages-shared.jsx for shared
// helpers). `v3Pages` is the concatenation of all of them, `venueDetailSource` the venue page body followed by the hub.
const v3PagesOnly = await readFile(new URL("../src/components/v3/V3Pages.jsx", import.meta.url), "utf8");
const venuePage = await readFile(new URL("../src/components/v3/VenueDetailPage.jsx", import.meta.url), "utf8");
const venueResearch = await readFile(new URL("../src/components/v3/VenueDetailResearch.jsx", import.meta.url), "utf8");
const venueShared = await readFile(new URL("../src/components/v3/venue-detail-shared.jsx", import.meta.url), "utf8");
const pagesShared = await readFile(new URL("../src/components/v3/v3-pages-shared.jsx", import.meta.url), "utf8");
const v3Pages = [v3PagesOnly, pagesShared, venueShared, venueResearch, venuePage].join("\n");
const venueDetailSource = `${venuePage.slice(venuePage.indexOf("export function VenueDetailPage"))}\n${venueResearch}`;
const compareFinalChoiceCard = await readFile(new URL("../src/components/v3/CompareFinalChoiceCard.jsx", import.meta.url), "utf8");
const venueFaqSection = await readFile(new URL("../src/components/v3/VenueFaqSection.jsx", import.meta.url), "utf8");
const v3InterfaceCopy = await readFile(new URL("../src/content/v3-interface-copy.js", import.meta.url), "utf8");
const compareFaqLocales = await readFile(new URL("../src/data/compare-faq-locales.js", import.meta.url), "utf8");
const researchPanels = await readFile(new URL("../src/components/v3/ResearchPanels.jsx", import.meta.url), "utf8");
const activityPages = await readFile(new URL("../src/components/v3/activity/ActivityPages.jsx", import.meta.url), "utf8");
const activityCenterV3 = await readFile(new URL("../src/components/v3/activity/ActivityCenterV3.jsx", import.meta.url), "utf8");
const activityCenterV3Css = await readFile(new URL("../src/components/v3/activity/ActivityCenterV3.css", import.meta.url), "utf8");
const officialResearchPage = await readFile(new URL("../src/components/v3/activity/OfficialResearch.jsx", import.meta.url), "utf8");
const v3Product = await readFile(new URL("../src/data/v3-product.js", import.meta.url), "utf8");
const v3Css = await readFile(new URL("../src/components/v3/v3.css", import.meta.url), "utf8");
const platformMatcher = await readFile(new URL("../src/components/v3/PlatformMatcher.jsx", import.meta.url), "utf8");
const matcherCss = await readFile(new URL("../src/components/v3/matcher.css", import.meta.url), "utf8");
const factbookPage = await readFile(new URL("../src/components/v3/FactbookPage.jsx", import.meta.url), "utf8");
const factbookCss = await readFile(new URL("../src/components/v3/factbook-page.css", import.meta.url), "utf8");
const fintechPremiumCss = await readFile(new URL("../src/styles/fintech-premium.css", import.meta.url), "utf8");
const cleanFooter = await readFile(new URL("../src/components/v3/CleanFooter.jsx", import.meta.url), "utf8");
const leanHero = await readFile(new URL("../src/components/v3/LeanHero.jsx", import.meta.url), "utf8");
const leanHeroCss = await readFile(new URL("../src/components/v3/lean-hero.css", import.meta.url), "utf8");
const traderWizardModal = await readFile(new URL("../src/components/v3/TraderWizardModal.jsx", import.meta.url), "utf8");
const venueYellowPages = await readFile(new URL("../src/components/v3/VenueYellowPages.jsx", import.meta.url), "utf8");
const venueYellowPagesCopy = await readFile(new URL("../src/components/v3/venue-yellow-pages-copy.js", import.meta.url), "utf8");
const venueYellowPagesState = await readFile(new URL("../src/components/v3/venue-yellow-pages-state.js", import.meta.url), "utf8");
const venueDecisionArticles = await readFile(new URL("../src/components/v3/VenueDecisionArticles.jsx", import.meta.url), "utf8");
const venueYellowPagesCss = await readFile(new URL("../src/components/v3/venue-yellow-pages.css", import.meta.url), "utf8");
const rebateTicker = await readFile(new URL("../src/components/v3/RebateTickerBar.jsx", import.meta.url), "utf8");
const rebateTickerCss = await readFile(new URL("../src/components/v3/rebate-ticker-bar.css", import.meta.url), "utf8");
const feeBenchmarkTerminal = await readFile(new URL("../src/components/v3/FeeBenchmarkTerminal.jsx", import.meta.url), "utf8");
const feeBenchmarkTerminalCss = await readFile(new URL("../src/components/v3/fee-benchmark-terminal.css", import.meta.url), "utf8");
const decisionPathRail = await readFile(new URL("../src/components/v3/DecisionPathRail.jsx", import.meta.url), "utf8");
const kolLandingPage = await readFile(new URL("../src/components/v3/KolLandingPage.jsx", import.meta.url), "utf8");
const decisionPathRailCss = await readFile(new URL("../src/components/v3/decision-path-rail.css", import.meta.url), "utf8");
const crossroadsCompareCss = await readFile(new URL("../src/components/v3/crossroads-compare.css", import.meta.url), "utf8");
const compareAnyPicker = await readFile(new URL("../src/components/compare/CompareAnyPicker.jsx", import.meta.url), "utf8");
const compareAnyPickerCss = await readFile(new URL("../src/components/compare/compare-any-picker.css", import.meta.url), "utf8");
const partnerEmbedGuide = await readFile(new URL("../src/components/v3/PartnerEmbedGuide.jsx", import.meta.url), "utf8");
const partnerEmbedGuideCss = await readFile(new URL("../src/components/v3/partner-embed-guide.css", import.meta.url), "utf8");
const costDecision = await readFile(new URL("../src/components/v3/CostDecision.jsx", import.meta.url), "utf8");
const costDecisionCss = await readFile(new URL("../src/components/v3/cost-decision.css", import.meta.url), "utf8");
const regionalPreview = await readFile(new URL("../src/components/v3/international/RegionalMarketPreview.jsx", import.meta.url), "utf8");
const regionalPreviewCss = await readFile(new URL("../src/components/v3/international/regional-market-preview.css", import.meta.url), "utf8");
const regionalPreviewCopy = await readFile(new URL("../src/data/regional-preview-copy.js", import.meta.url), "utf8");
const venueYellowPagesSource = venueYellowPages;
const crossroadsCompare = await readFile(new URL("../src/components/v3/CrossroadsCompare.jsx", import.meta.url), "utf8");
const registrationCard = await readFile(new URL("../src/components/v3/RegistrationCard.jsx", import.meta.url), "utf8");
const mobileBottomNav = await readFile(new URL("../src/components/v3/MobileBottomNav.jsx", import.meta.url), "utf8");
const mobileBottomNavCss = await readFile(new URL("../src/components/v3/mobile-bottom-nav.css", import.meta.url), "utf8");
const registrationCardCss = await readFile(new URL("../src/components/v3/registration-card.css", import.meta.url), "utf8");
const brazilDecisionPage = await readFile(new URL("../src/components/v3/international/BrazilDecisionPage.jsx", import.meta.url), "utf8");
const brazilDecisionCss = await readFile(new URL("../src/components/v3/international/brazil-decision-page.css", import.meta.url), "utf8");
const telegramHub = await readFile(new URL("../src/components/v3/TelegramBotHub.jsx", import.meta.url), "utf8");
const telegramHubCss = await readFile(new URL("../src/components/v3/telegram-bot-hub.css", import.meta.url), "utf8");
const onsiteTelegramHandoff = await readFile(new URL("../src/components/v3/OnsiteTelegramBotHandoff.jsx", import.meta.url), "utf8");
const onsiteTelegramHandoffCss = await readFile(new URL("../src/components/v3/onsite-telegram-handoff.css", import.meta.url), "utf8");
const telegramReturnBanner = await readFile(new URL("../src/components/v3/TelegramReturnBanner.jsx", import.meta.url), "utf8");
const telegramReturnBannerCss = await readFile(new URL("../src/components/v3/telegram-return-banner.css", import.meta.url), "utf8");
const liveConversionProof = await readFile(new URL("../src/components/v3/LiveConversionProof.jsx", import.meta.url), "utf8");
const liveConversionProofCss = await readFile(new URL("../src/components/v3/live-conversion-proof.css", import.meta.url), "utf8");
const topicGuidePage = await readFile(new URL("../src/components/v3/TopicGuidePage.jsx", import.meta.url), "utf8");
const topicGuideCss = await readFile(new URL("../src/components/v3/topic-guide.css", import.meta.url), "utf8");
const newsDetailPage = await readFile(new URL("../src/components/v3/news/NewsDetailPage.jsx", import.meta.url), "utf8");
const topDecisionBox = await readFile(new URL("../src/components/v3/TopDecisionBox.jsx", import.meta.url), "utf8");
const topDecisionBoxCss = await readFile(new URL("../src/components/v3/top-decision-box.css", import.meta.url), "utf8");
const newsListPage = await readFile(new URL("../src/components/v3/news/NewsListPage.jsx", import.meta.url), "utf8");
const newsListPageCss = await readFile(new URL("../src/components/v3/news/news-list-page.css", import.meta.url), "utf8");
const newsDetailCss = await readFile(new URL("../src/components/v3/news/news-detail-page.css", import.meta.url), "utf8");
const v3PagesSource = v3Pages;
const feeRebateCalculator = await readFile(new URL("../src/components/v3/FeeRebateCalculator.jsx", import.meta.url), "utf8");
const campaignRadar = await readFile(new URL("../src/components/v3/CampaignRadar.jsx", import.meta.url), "utf8");
const tradingBleedAnalyzer = await readFile(new URL("../src/components/v3/TradingBleedAnalyzer.jsx", import.meta.url), "utf8");
const tradingBleedCopy = await readFile(new URL("../src/data/trading-bleed-copy.js", import.meta.url), "utf8");
const viteConfig = await readFile(new URL("../vite.config.mjs", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const v3Data = v3Product;

test("mobile conversion pages keep compact first decision sections", () => {
  assert.match(leanHeroCss, /@media \(max-width: 640px\)[\s\S]*\.lean-hero \{[\s\S]*padding: 1rem 0 1\.25rem;/);
  assert.match(leanHeroCss, /@media \(max-width: 640px\)[\s\S]*\.lean-hero__container \{[\s\S]*gap: 1rem;/);
  assert.match(leanHeroCss, /@media \(max-width: 640px\)[\s\S]*\.telemetry-panel__cell \{[\s\S]*padding: 8px 10px;/);
  assert.match(venueYellowPagesCss, /@media \(max-width: 680px\)[\s\S]*\.yellow-pages \{[\s\S]*gap: 0\.7rem;[\s\S]*padding-block: 0\.65rem 0\.9rem;/);
  assert.match(venueYellowPagesCss, /@media \(max-width: 680px\)[\s\S]*\.yellow-card \{[\s\S]*padding: 0\.78rem;[\s\S]*contain-intrinsic-size: 0 220px;/);
  assert.match(venueYellowPagesCss, /@media \(max-width: 480px\)[\s\S]*\.yellow-pages__grid--compact \.yellow-card \{[\s\S]*padding: 0\.72rem;/);
});

// Class b: 244ad6f replaces numeric body rhythm with the shared token and 1.55 fallback.
test("news mobile pages reduce repeated vertical scanning without removing CTAs", () => {
  assert.match(newsListPageCss, /@media \(max-width: 640px\)[\s\S]*\.news-grid-section \{[\s\S]*padding-top: 0\.25rem;/);
  assert.match(newsListPageCss, /@media \(max-width: 640px\)[\s\S]*\.news-grid \{[\s\S]*gap: 0\.85rem;/);
  assert.match(newsListPageCss, /@media \(max-width: 640px\)[\s\S]*\.news-article-card \{[\s\S]*padding: 0\.85rem;[\s\S]*contain-intrinsic-size: 0 240px;/);
  assert.match(newsListPageCss, /\.news-tab \{[\s\S]*min-block-size: 44px;/);
  assert.match(newsListPageCss, /@media \(max-width: 640px\)[\s\S]*\.news-tab \{[\s\S]*min-block-size: 44px;/);
  assert.match(newsListPageCss, /\.news-article-card__read-link \{[\s\S]*min-block-size: 44px;/);
  assert.match(newsListPageCss, /\.news-article-card__compare-link \{[\s\S]*min-block-size: 44px;/);
  assert.match(newsListPageCss, /@media \(max-width: 640px\)[\s\S]*\.news-article-card__venue-chip \{[\s\S]*min-block-size: 44px;/);
  assert.match(newsListPageCss, /\.news-research-index__summary \{[\s\S]*min-block-size: 44px;/);
  assert.match(newsListPageCss, /\.news-research-index__links a \{[\s\S]*min-block-size: 44px;/);
  assert.doesNotMatch(newsListPageCss, /min-block-size:\s*40px/);
  assert.match(newsDetailCss, /@media \(max-width: 640px\)[\s\S]*\.news-detail__partners-box \{[\s\S]*margin-bottom: 0\.9rem;[\s\S]*padding: 0\.72rem;[\s\S]*contain-intrinsic-size: 0 190px;/);
  assert.match(newsDetailCss, /@media \(max-width: 640px\)[\s\S]*\.news-detail__article-disclosure \{[\s\S]*margin-top: 0\.9rem;[\s\S]*contain-intrinsic-size: 0 420px;/);
  assert.match(newsDetailCss, /@media \(max-width: 640px\)[\s\S]*\.news-detail__prose \{[\s\S]*font-size: 0\.96rem;[\s\S]*line-height: var\(--lh-body, 1\.55\);/);
  assert.match(newsDetailCss, /\.news-detail__back \{[\s\S]*min-block-size: 44px;/);
  assert.match(topDecisionBoxCss, /\.top-decision-box__actions a \{[\s\S]*min-block-size: 44px;/);
  assert.match(topDecisionBoxCss, /@media \(max-width: 640px\)[\s\S]*\.top-decision-box \{[\s\S]*grid-template-columns: 1fr;/);
  assert.match(newsDetailCss, /@import "\.\.\/top-decision-box\.css";/, "news route must own the shared decision-box CSS chunk");
  // The complete context row is now the research link; its label is a span,
  // so touch size and focus belong to the row rather than the former button.
  const contextRowCss = newsDetailCss.match(/\.news-partner-card\s*\{([^}]+)\}/)?.[1];
  assert.ok(contextRowCss, "mentioned venue research links must have their own touch target rules");
  const contextRowMinHeight = contextRowCss.match(/min-block-size:\s*(\d+(?:\.\d+)?)px;/)?.[1];
  assert.ok(Number(contextRowMinHeight) >= 44, "the full research link must remain at least 44px high");
  assert.match(contextRowCss, /grid-template-columns:\s*minmax\(0, 1fr\) auto;/);
  assert.match(contextRowCss, /background:\s*transparent;/);
  assert.match(newsDetailCss, /\.news-partner-card:focus-visible\s*\{[^}]*outline:\s*2px solid/);
  assert.match(newsDetailCss, /\.news-detail__decision-links a \{[\s\S]*min-block-size: 44px;/);
  assert.doesNotMatch(newsDetailCss, /min-(?:block-)?size:\s*3[6-9]px/);
  assert.match(newsListPage, /data-cta-placement="news-card-read"/);
  assert.match(newsDetailPage, /data-cta-placement="news-detail-venue-card"/);
});

test("V2 uses a conversion-led finder, venue directory, and comparison hierarchy", () => {
  assert.match(app, /v2Copy\(locale\)/);
  assert.match(app, /marketCommand\(copy, model\.venues\)/);
  assert.match(app, /<CommandFinder/);
  assert.match(app, /<LeanHero/);
  assert.match(app, /<VenueYellowPages/);
  assert.match(app, /<VenueYellowPages[\s\S]*compact \/>/);
  assert.match(app, /<CrossroadsCompare/);
  assert.match(app, /<CleanFooter/);
  assert.match(leanHero, /href: "\/methodology#disclosure"/);
  assert.doesNotMatch(app, /<MarketRail|<OfficialUpdates|<Methodology|<MarketRoutes|<ListingsStream/);
  assert.match(main, /v2-interactive-refresh\.css/);
  assert.doesNotMatch(app, /hero-curve|A market signal is only useful/);
  assert.match(css, /grid-template-columns:minmax\(0,7fr\) minmax\(340px,5fr\)/);
});

test("international comparison cards do not reuse English pair descriptions", () => {
  assert.match(crossroadsCompare, /const localizedPairDescriptions = \{/);
  for (const locale of ["es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru"]) {
    assert.ok(
      crossroadsCompare.includes(`${locale}: [`) || crossroadsCompare.includes(`"${locale}": [`),
      `${locale} pair descriptions`,
    );
  }
  for (const phrase of [
    "Global flagship CEX comparison",
    "Derivatives & copy trading comparison",
    "Ethereum vs Solana DEX comparison",
    "High-performance Perp DEX comparison",
  ]) {
    const occurrences = crossroadsCompare.match(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || [];
    assert.equal(occurrences.length, 1, `${phrase} should remain only in the English baseline`);
  }
  assert.match(crossroadsCompare, /pairDescriptions\?\.\[index\]/);
});

test("hydration restores an explicit browser locale after matching the server first pass", () => {
  assert.match(main, /buildHydrationBootstrap/);
  assert.match(main, /setInitialUrl\(bootstrap\.browserUrl\)/);
  assert.match(main, /initialLocale=\{undefined\}/);
  assert.match(main, /browser URL is authoritative after hydration/);
});

test("directory route keeps non-directory surfaces out of the browser app shell", () => {
  assert.match(app, /const deferredPageModules = import\.meta\.env\.SSR \? \{\} : import\.meta\.glob/);
  assert.match(app, /const ssrDeferredPageModules = import\.meta\.env\.SSR \? import\.meta\.glob/);
  assert.match(app, /readRouteModuleExport\(path, exportName\)/);
  assert.match(app, /registerRouteModuleLoaders\(deferredPageModules\)/);
  assert.doesNotMatch(app, /React\.lazy\(/);
  assert.match(app, /<React\.Suspense fallback=\{null\}>/);
  assert.match(app, /route\.name === "directory"[\s\S]*deferContent: false/);
  for (const modulePath of [
    "./components/v3/V3Pages",
    "./components/v3/FeeBenchmarkTerminal",
    "./components/v3/TelegramBotHub",
    "./components/v3/TradingBleedAnalyzer",
    "./components/v3/international/BrazilDecisionPage",
    "./components/v3/news/NewsListPage",
  ]) {
    assert.doesNotMatch(app, new RegExp(`import \\\\{[^;]+\\\\} from "${modulePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  }
});

test("Traditional Chinese keeps its dedicated homepage copy", () => {
  assert.match(leanHero, /\(\?:tw\|hant\)/i);
  assert.match(leanHero, /locale === "zh-Hant"/);
});

test("regional research previews expose bounded AEO questions and source freshness", () => {
  assert.match(regionalPreview, /data-aeo-question/);
  assert.match(regionalPreview, /data-source-reviewed-at/);
  assert.match(regionalPreview, /regionalPageBoundary/);
  assert.match(regionalPreview, /questionNextSteps\[index\]/);
  assert.match(regionalPreviewCopy, /official account flow/);
  assert.match(regionalPreview, /data-decision-stage/);
  assert.match(regionalPreview, /regional-account-stage/);
  assert.match(venueYellowPages, /data-regional-decision-toggle/);
  assert.match(venueYellowPages, /yellow-pages__decision-card--mobile-collapsed/);
  assert.match(venueYellowPagesCss, /\.yellow-pages__decision-card--mobile-collapsed \{ display: none; \}/);
});

// The active HomeV7 decision desk precedes the research drawer hosted by ClosingBand.
test("homepage keeps primary decisions above a collapsible research drawer", () => {
  const activeHome = app.slice(app.lastIndexOf('return <main key={`locale-${locale}`}'));
  assert.match(activeHome, /<HomeV7 locale=\{locale\} market=\{route\.market\} \/>/);
  assert.match(activeHome, /<ClosingBand locale=\{locale\} legacy=\{homeSlots\.closing\} \/>/);
  assert.ok(activeHome.indexOf("<HomeV7") < activeHome.indexOf("<ClosingBand"), "primary decision desk precedes secondary research");
  const closingSlot = app.slice(app.indexOf("closing: <>"), app.indexOf("const homeCtx"));
  assert.match(closingSlot, /<HomeResearchDrawer locale=\{locale\} \/>/);
  assert.match(closingBand, /className="v6-close__index v6-wrap"[^>]*>\{legacy\}/);
  assert.match(homeV7, /<aside className="h7-lg" id="h7-desk" aria-label=\{t\.lgTitle\}/);
  assert.match(homeV7, /className="h7-lg-tabs" role="group" aria-label=\{t\.lgPick\}/);
  assert.match(homeV7, /aria-pressed=\{r\.slug === sel\.slug\} onClick=\{\(\) => setPick\(r\.slug\)\}/);
  assert.match(homeV7, /<Cta v=\{sel\} locale=\{locale\}[^>]*placement="home-v7-hero"/);
  assert.match(homeV7, /href="#h7-desk"/);
  assert.match(homeV7, /href="#h7-calc"/);
  assert.match(app, /return <details className="home-research-drawer" id="research-tools"/);
  assert.doesNotMatch(app, /<details className="home-research-drawer"[^>]*\bopen[=\s>]/, "secondary research starts collapsed");
  assert.match(app, /<summary><strong>\{text\.summary\}<\/strong>/);
  assert.match(app, /className="home-research-drawer__body"/);
  for (const component of ["CampaignRadar", "FeeBenchmarkTerminal", "OnChainLiquidityBoard", "TelegramBotHub", "MarketFearGreedPanel"]) {
    assert.match(app.slice(app.indexOf('className="home-research-drawer__body"'), app.indexOf("const crawlPriorityLinks")), new RegExp(`<${component} locale=\\{locale\\}`));
  }
  assert.match(v3LayoutStability, /\.home-research-drawer:not\(\[open\]\) > \.home-research-drawer__body \{ display: none; \}/);
});

// Class d retarget: the removed public manual-review queue is now an answer-first topic gateway plus collapsed ops pack.
test("Telegram research hub answers first and keeps command depth expandable", () => {
  assert.match(telegramHub, /TELEGRAM_RESEARCH_PATHS/);
  assert.match(telegramHub, /import \{ localizedHref \} from "\.\.\/\.\.\/data\/locale-routing\.js"/);
  assert.match(telegramHub, /TelegramAlertsHero/);
  assert.match(telegramHub, /export function TelegramBotHub\(\{ locale = "en", headingLevel = 2, market, product \}\)/);
  assert.match(telegramHub, /const withTelegramContext = \(target, campaign\) =>/);
  assert.match(telegramHub, /tg-topic-gateway/);
  assert.match(telegramHub, /telegram-topic-onsite/);
  assert.match(telegramHub, /telegram-topic-bot/);
  assert.match(telegramHub, /telegram-search-topic-onsite/);
  assert.match(telegramHub, /const growthContextAttrs = \(campaign\) =>/);
  assert.match(telegramHub, /"data-growth-market": telegramContext\.market/);
  assert.match(telegramHub, /"data-growth-product": telegramContext\.product/);
  assert.match(telegramHub, /href=\{localizedHref\(entry\.href, \{ locale, market: telegramContext\.market, product: telegramContext\.product \}\)\}/);
  assert.match(telegramHub, /href=\{localizedHref\(topic\.primaryPath, \{ locale, market: telegramContext\.market, product: telegramContext\.product \}\)\}/);
  assert.match(telegramHub, /withTelegramContext\(cmd\.deepLinkAction, `telegram_command_\$\{cmd\.id\}`\)/);
  assert.match(telegramHub, /\.\.\.growthContextAttrs\("telegram_hub_directory"\)/);
  assert.match(telegramHub, /\.\.\.growthContextAttrs\(`telegram_topic_\$\{topic\.id\}`\)/);
  assert.match(telegramHub, /\.\.\.growthContextAttrs\(topic\.campaign\)/);
  assert.match(telegramHub, /\.\.\.growthContextAttrs\(`onsite_return_\$\{decision\}`\)/);
  assert.match(telegramHub, /data-cta-kind="internal" data-cta-placement="onsite-return-rail"/);
  assert.match(telegramHub, /\.\.\.growthContextAttrs\(`telegram_command_\$\{cmd\.id\}`\)/);
  assert.match(telegramHub, /tg-topic-card--mobile-collapsed/);
  assert.match(telegramHub, /aria-expanded=\{showAllTopics\}/);
  assert.match(telegramHub, /data-telegram-command-toggle/);
  assert.match(telegramHub, /tg-cmd-card--mobile-collapsed/);
  assert.ok(telegramHub.indexOf('tg-topic-gateway') < telegramHub.indexOf('tg-hub__cta-box'));
  assert.ok(telegramHub.indexOf('tg-hub__cta-box') < telegramHub.indexOf('tg-ops-pack'));
  assert.match(telegramHub, /<details className="tg-ops-pack tg-public-topics-disclosure">/);
  assert.ok(telegramHub.indexOf('tg-hub__cta-box') < telegramHub.indexOf('tg-deck'));
  assert.match(telegramHub, /data-cta-kind="telegram"/);
  assert.match(telegramHub, /data-cta-placement="telegram-topic-bot"/);
  assert.match(telegramHub, /data-cta-placement="telegram-command-deep-link"/);
  assert.match(telegramHub, /data-growth-placement="telegram-command"/);
  assert.match(telegramHub, /tg-return-rail/);
  assert.match(telegramHub, /data-growth-decision=\{decision\}/);
  assert.match(telegramHub, /保存比较|Save comparison/);
  assert.doesNotMatch(telegramHubCss, /\.tg-inbound-summary\s*\{[^}]*\border:\s*\d/, "inbound summary should follow source order instead of a stale flex order override");
  assert.doesNotMatch(telegramHubCss, /\.tg-topic-gateway\s*\{[^}]*\border:\s*\d/, "topic gateway should follow source order instead of a stale flex order override");
  assert.ok(telegramHub.indexOf('tg-hub__cta-box') < telegramHub.indexOf('tg-ops-pack'), "ops details stay after the primary Telegram handoff");
  assert.match(telegramHubCss, /\.tg-ops-pack/);
  assert.match(telegramHubCss, /\.tg-hub__cta-box/);
  assert.match(telegramHubCss, /\.tg-topic-gateway__grid/);
  assert.match(telegramHubCss, /\.tg-command-disclosure/);
  assert.match(telegramHubCss, /\.tg-topic-card--mobile-collapsed \{ display: none; \}/);
  assert.match(telegramHubCss, /\.tg-cmd-card--mobile-collapsed \{ display: none; \}/);
  assert.match(telegramHubCss, /\.tg-return-rail__grid/);
  assert.match(telegramHubCss, /\.tg-ops-pack > summary:focus-visible/);
  assert.match(telegramHubCss, /\.tg-command-disclosure > summary:focus-visible/);
  assert.match(telegramHubCss, /\.tg-topic-gateway__toggle:focus-visible/);
  assert.match(telegramHubCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(telegramHubCss, /\.tg-cmd-card:hover,[\s\S]*transform: none;/);
});

test("rate and Telegram routes expose a localized SSR heading", () => {
  assert.match(app, /route\.name === "telegram"[\s\S]*<TelegramBotHub locale=\{locale\} headingLevel=\{1\} \/>/);
  assert.match(app, /route\.name === "rateTerminal"[\s\S]*<h1>\{\(\{[\s\S]*ja:[^\n]+取引所手数料ベンチマーク/);
  assert.match(telegramHub, /headingLevel === 1 \? <h1 className="tg-hub__title">\{t\.title\}<\/h1>/);
  assert.match(app, /取引所手数料ベンチマーク/);
});

test("venue Telegram handoff preserves market context and records distinct placements", () => {
  assert.match(v3Pages, /buildTelegramWebsiteFunnelContext\(\{ intent: "monitor", venue: venue\.slug, market, locale, product/);
  assert.match(v3Pages, /data-cta-placement="venue-hero-telegram"/);
  assert.match(v3Pages, /data-cta-placement="venue-telegram-monitor"/);
  assert.match(v3Pages, /data-growth-placement="venue-telegram"/);
  assert.match(v3Pages, /data-telegram-return-href=\{heroTelegramFunnel\.returnHref\}/);
  assert.match(v3Pages, /<VenueTelegramMonitorSection[\s\S]*market=\{market\}/);
  assert.match(v3Pages, /<VenueTelegramMonitorSection[\s\S]*product=\{product\}/);
  assert.match(v3Pages, /data-telegram-return-href=\{telegramFunnel\.returnHref\}/);
  const profileSummaryRule = v3Css.match(/\.v3-profile-page \.v3-venue-summary \{([^}]*)\}/)?.[1];
  assert.ok(profileSummaryRule, "existing precise mobile profile summary rule remains");
  assert.match(profileSummaryRule, /display: block;/);
  assert.match(profileSummaryRule, /overflow: visible;/);
  assert.doesNotMatch(profileSummaryRule, /-webkit-line-clamp|-webkit-box-orient/);
  assert.match(v3Pages, /const detailCtaLabel = \(locale, \{ direct, hasReferral \}\)/);
  assert.match(v3Pages, /Verificar elegibilidad regional/);
  assert.match(v3Pages, /Verificar elegibilidade regional/);
});

test("Wave23 onsite Bot handoff is visible on priority pages without registration links", () => {
  assert.match(onsiteTelegramHandoff, /TELEGRAM_WAVE22_ONSITE_BOT_HANDOFFS/);
  assert.match(onsiteTelegramHandoff, /buildTelegramWebsiteFunnelContext\(\{/);
  assert.match(onsiteTelegramHandoff, /campaign: campaign \|\| \(handoff \? "wave23-onsite-visible-handoff" : "r40-contextual-telegram-return"\)/);
  assert.match(onsiteTelegramHandoff, /const copy = copyForLocale\(context\.locale\)/);
  assert.match(onsiteTelegramHandoff, /aria-label=\{copy\.ariaLabel\}/);
  assert.match(onsiteTelegramHandoff, /ja: \{ eyebrow: "サイト内 → Bot"/);
  assert.match(onsiteTelegramHandoff, /"pt-BR": \{ eyebrow: "Site → Bot"/);
  assert.match(onsiteTelegramHandoff, /data-cta-kind="telegram"/);
  assert.match(onsiteTelegramHandoff, /data-cta-placement=\{placement\}/);
  assert.match(onsiteTelegramHandoff, /data-growth-decision="onsite_bot_handoff"/);
  assert.match(onsiteTelegramHandoff, /data-growth-placement="onsite-bot-handoff"/);
  assert.match(onsiteTelegramHandoff, /data-telegram-canonical=\{canonicalPath\}/);
  assert.match(onsiteTelegramHandoff, /data-telegram-market=\{context\.market\}/);
  assert.match(onsiteTelegramHandoff, /data-telegram-locale=\{context\.locale\}/);
  assert.match(onsiteTelegramHandoff, /data-telegram-product=\{context\.product\}/);
  assert.match(onsiteTelegramHandoff, /data-telegram-return-href=\{funnel\.returnHref\}/);
  assert.match(onsiteTelegramHandoff, /data-growth-decision="onsite_bot_handoff_launch"/);
  assert.match(onsiteTelegramHandoff, /data-telegram-review-cadence="24h-7d"/);
  assert.match(onsiteTelegramHandoff, /data-telegram-anonymous-metrics=\{handoff\?\.measurement\?\.policy \|\| "anonymous onsite Telegram handoff clicks only;/);
  assert.match(onsiteTelegramHandoffCss, /\.v3-onsite-telegram-handoff/);
  assert.match(v3Pages, /import \{ OnsiteTelegramBotHandoff \} from "\.\/OnsiteTelegramBotHandoff\.jsx"/);
  assert.match(v3Pages, /canonicalPath=\{`\/exchanges\/\$\{profile\.slug\}`\}/);
  assert.match(v3Pages, /placement=\{`venue-onsite-bot-handoff-\$\{profile\.slug\}`\}/);
  assert.match(v3Pages, /canonicalPath=\{`\/compare\/\$\{compareSlugKey\}`\}/);
  assert.match(v3Pages, /placement=\{`compare-onsite-bot-handoff-\$\{compareSlugKey\}`\}/);
  assert.match(newsDetailPage, /import \{ OnsiteTelegramBotHandoff \} from "\.\.\/OnsiteTelegramBotHandoff\.jsx"/);
  assert.match(newsDetailPage, /canonicalPath=\{`\/news\/\$\{article\.slug\}`\}/);
  assert.match(newsDetailPage, /placement=\{`news-onsite-bot-handoff-\$\{article\.slug\}`\}/);
  assert.match(topicGuidePage, /import \{ OnsiteTelegramBotHandoff \} from "\.\/OnsiteTelegramBotHandoff\.jsx"/);
  assert.match(topicGuidePage, /const topicCanonicalPath = `\/topics\/\$\{topic\.slug\}`/);
  assert.match(topicGuidePage, /canonicalPath=\{topicCanonicalPath\}/);
  assert.match(topicGuidePage, /placement=\{`topic-onsite-bot-handoff-\$\{topic\.slug\}`\}/);
  assert.doesNotMatch(onsiteTelegramHandoff, /accounts\.binance\.com|bsmkweb\.cc|partner\.bitget|bitget\.com\/(expressly|register|referral|signup)|okx\.com\/(join|register|referral)|topzhjdgxcb|backpack\.exchange\/join/i);
});

test("Telegram return banner restores only current venue and compare context", () => {
  assert.match(telegramReturnBanner, /resolveTelegramReturnBannerState/);
  assert.match(telegramReturnBanner, /data-telegram-return-banner="restored"/);
  assert.match(telegramReturnBanner, /data-growth-decision="telegram_resume"/);
  assert.match(telegramReturnBanner, /data-growth-placement="telegram-return-banner"/);
  assert.match(telegramReturnBanner, /window\.history\.replaceState/);
  assert.match(telegramReturnBanner, /copyByLocale/);
  assert.match(telegramReturnBannerCss, /\.v3-telegram-return-banner/);
  assert.match(v3Pages, /import \{ TelegramReturnBanner \} from "\.\/TelegramReturnBanner\.jsx"/);
  assert.match(v3Pages, /<TelegramReturnBanner[\s\S]*expectedKind="venue"[\s\S]*expectedId=\{profile\.slug\}/);
  assert.match(v3Pages, /<TelegramReturnBanner[\s\S]*expectedKind="pair"[\s\S]*expectedId=\{compareSlugKey\}/);
  assert.doesNotMatch(telegramReturnBanner, /https:\/\/t\.me|TELEGRAM_CONFIG|sendMessage|fetch\(/);
  assert.doesNotMatch(telegramReturnBanner, /accounts\.binance\.com|bsmkweb\.cc|partner\.bitget|topzhjdgxcb|nexu888|11350287|luckybitcoin/i);
});

test("activity and news cards keep a measured next step after the content", () => {
  assert.match(activityCenterV3, /data-cta-placement="activity-channel-banner"/);
  assert.match(activityCenterV3, /data-cta-placement="activity-card-detail"/);
  assert.match(activityCenterV3, /data-cta-placement="activity-card-research-alternative"/);
  assert.match(newsListPage, /data-cta-placement="news-card-read"/);
  assert.match(newsListPage, /data-cta-placement="news-card-venue"/);
});

test("topic Telegram CTA carries the topic and regional research context", () => {
  assert.doesNotMatch(topicGuidePage, /LuckyCryptoClupManagerBot/);
  assert.match(topicGuidePage, /getTelegramDeepLink\(\{ action: "topic_review", project: topic\.slug, market, locale, product \}\)/);
  assert.match(topicGuidePage, /href=\{telegramHref\}/);
  assert.match(topicGuidePage, /data-cta-placement="topic-telegram-source-review"/);
  assert.match(topicGuidePage, /data-growth-market=\{market\}/);
  assert.match(topicGuidePage, /data-growth-product=\{product\}/);
});

// Class b/d retarget: regional docks and route-owned sticky bars must prevent a duplicate shared mobile layer.
test("detail and comparison routes keep one mobile action layer", () => {
  assert.match(app, /const regionalDecisionDockOwnsMobileNav = \["regionalPreview", "regionalDecision"\]\.includes\(route\.name\)[\s\S]*&& REGIONAL_DECISION_DOCK_MARKETS\.has\(route\.market\)/);
  assert.match(app, /const showSharedMobileNav = route\.name !== "venue" && route\.name !== "compare" && !regionalDecisionDockOwnsMobileNav;/);
  assert.doesNotMatch(app, /<MobileBottomNav/);
  assert.match(venuePage, /<aside className=\{`v3-mobile-sticky-bar\$\{mobileStickyActive \? " is-active" : ""\}`\}/);
  assert.match(venuePage, /href=\{`\/exchanges\/\$\{profile\.slug\}\?\$\{contextSearch\}#registration-path`\}/);
  assert.match(v3Pages, /className="v3-compare-quick-actions__item"/);
  assert.match(fintechPremiumCss, /\.v3-mobile-sticky-bar \{[\s\S]*bottom: 0;/);
  assert.match(mobileBottomNavCss, /body:has\([^)]*mobile-bottom-nav[\s\S]*padding-bottom:/);
  assert.match(mobileBottomNavCss, /body:has\(> #root > main\.v3-profile-page\) \.mobile-bottom-nav,[\s\S]*body:has\(> #root > main\.v3-compare-page\) \.mobile-bottom-nav \{[\s\S]*display: none;/);
  assert.match(mobileBottomNavCss, /body:has\(> #root > main\.v3-profile-page\),[\s\S]*body:has\(> #root > main\.v3-compare-page\) \{[\s\S]*--mobile-bottom-nav-reserve: 0px;/);
});

// Class b: 8a062bf groups secondary research paths in the shared similar-pairs disclosure.
test("comparison keeps the matrix before repeated verdict chrome on direct-answer pairs and consolidates secondary research paths", () => {
  const compare = v3Pages.slice(v3Pages.indexOf("export function CompareDeepPage"), v3Pages.indexOf("export function NotFoundPage"));
  assert.doesNotMatch(compare, /className="v3-compare-telegram-handoff"/);
  assert.match(compare, /className="v2-section v3-similar v3-similar-disclosure"[\s\S]*<CompareGoldMatrixNav[\s\S]*<OnsiteTelegramBotHandoff/);
  assert.match(compare, /isPriorityTwoVenueDirectAnswer && <CompareDecisionNav/);
  assert.match(compare, /isPriorityTwoVenueDirectAnswer && <HardcoreMetricMatrix/);
  assert.match(compare, /v3-compare-section-disclosure--secondary-verdict[\s\S]*<CompareVerdictPanel/);
  assert.match(compare, /!isPriorityTwoVenueDirectAnswer && <CompareDecisionNav/);
});

test("venue detail exposes a compact decision strip before the long research sections", () => {
  assert.match(v3Pages, /<VenueDecisionStrip text=\{text\} profile=\{profile\} decision=\{reviewedDecision\} locale=\{locale\} \/>/);
  assert.match(v3Pages, /function VenueDecisionStrip\(\{ text, profile, decision, locale \}\)/);
  assert.match(v3Pages, /const reviewedDecision = hasReviewedEditorialDecision\(profile\.slug\) \? detailDecision : null/);
  assert.match(v3Pages, /const venueHeroSummary = reviewedDecision/);
  assert.match(v3Css, /\.v3-venue-decision-strip/);
});

test("venue detail mobile decision cards collapse into compact full-width rows", () => {
  assert.match(v3LayoutStability, /@media \(max-width: 520px\)[\s\S]*\.v3-venue-decision-strip \{[\s\S]*grid-template-columns: 1fr !important;/);
  assert.match(v3LayoutStability, /@media \(max-width: 520px\)[\s\S]*\.v3-venue-decision-strip article,[\s\S]*\.v3-venue-decision-strip article:last-child \{[\s\S]*grid-template-columns: minmax\(72px, \.34fr\) minmax\(0, 1fr\);/);
  assert.match(v3LayoutStability, /@media \(max-width: 520px\)[\s\S]*\.v3-venue-decision-strip strong \{[\s\S]*overflow-wrap: anywhere;/);
  assert.match(v3LayoutStability, /@media \(max-width: 520px\)[\s\S]*\.v3-profile-decision article \{[\s\S]*padding: 12px;/);
  assert.match(v3LayoutStability, /@media \(max-width: 520px\)[\s\S]*\.v3-registration-notes > summary \{[\s\S]*min-height: 50px;/);
});

test("venue detail renders source-bound direct answers for GSC priority venue pages", () => {
  const detail = venueDetailSource;
  assert.match(v3Pages, /const venueDirectAnswerOverrides = \{[\s\S]*en:[\s\S]*hyperliquid:[\s\S]*rolling maker\/taker tier, referral discount, hourly funding, collateral route[\s\S]*funded-account search should separate self-funded collateral[\s\S]*uniswap:[\s\S]*Uniswap testnet and mainnet checks start with the official app, docs, token contract, approval and wallet preview/);
  assert.match(v3Pages, /de:[\s\S]*uniswap:[\s\S]*Uniswap in Deutschland prüfen:[\s\S]*Offizielle App und v4-Deployments/);
  assert.match(v3Pages, /keine klassische CEX-Anmeldung mit Euro-Einzahlung oder verwahrtem Konto/);
  assert.match(v3Pages, /Keine Verwahrung, keine Euro-Einzahlung, kein Renditeversprechen/);
  assert.match(v3Pages, /https:\/\/developers\.uniswap\.org\/docs\/protocols\/v4\/deployments/);
  assert.match(v3Pages, /https:\/\/support\.uniswap\.org\/hc\/en-us\/articles\/8370549680909-How-to-swap-tokens/);
  assert.match(v3Pages, /\["Uniswap vs Jupiter vergleichen", "\/compare\/uniswap-vs-jupiter"\]/);
  assert.match(v3Pages, /\["Gebührenrechner öffnen", "\/rates\?product=swap&market=DE"\]/);
  assert.match(v3Pages, /\["On-chain Liquidität prüfen", "\/onchain\?market=DE&product=swap"\]/);
  assert.doesNotMatch(v3Pages.slice(v3Pages.indexOf('de: {'), v3Pages.indexOf('const detailCtaLabel')), /nexu888|11350287|private commission|MOCK_EVENTS|Register on Official Site/i);
  assert.match(detail, /const priorityAnswer = priorityVenueAnswerFor\(venue\.slug, locale\);/);
  assert.match(detail, /const venueDirectAnswer = priorityAnswer \|\| venueDirectAnswerFor\(locale, venue\.slug\);/);
  assert.match(detail, /className="v3-venue-direct-answer"/);
  assert.match(detail, /venueDirectAnswer\.checks\.map/);
  assert.match(detail, /venueDirectAnswer\.sources\?\.map/);
  assert.match(detail, /venueDirectAnswer\.internalLinks\?\.slice\(0, 1\)/);
  assert.match(detail, /priorityAnswer\.internalLinks\?\.slice\(1\)\.map/);
  assert.ok(detail.indexOf('className="v3-venue-direct-answer"') > detail.indexOf('className="v3-venue-context"'));
  assert.ok(detail.indexOf("<VenueDecisionStrip") > detail.indexOf('className="v3-venue-direct-answer"'));
  assert.match(v3Css, /\.v3-venue-direct-answer/);
  assert.match(v3Css, /\.v3-venue-direct-answer__links/);
});


// Class b: the final-choice card now defers priority-pair evidence to the shared disclosure.
test("Wave31 priority Binance and Binance vs OKX pages expose compact decision answers without hardcoded invites", () => {
  const detail = venueDetailSource;
  const comparePage = v3Pages.slice(v3Pages.indexOf("export function CompareDeepPage"));

  assert.match(v3Pages, /binance-vs-okx[\s\S]*Binance vs OKX: decide by fee schedule, KYC, fiat route and product fit/);
  assert.match(v3Pages, /Fees: published spot and derivatives schedules/);
  assert.match(v3Pages, /KYC: identity, residence and account review/);
  assert.match(v3Pages, /Fiat route: card, bank or local rail must be verified in-account/);
  assert.match(v3Pages, /Best for: broad CEX product comparison before signup/);
  assert.match(v3Pages, /Not for: users expecting guaranteed approval, bonus or net fee/);
  assert.match(v3Pages, /Next step: compare details, then use the protected registration CTA/);
  assert.match(v3Pages, /Binance Trading Fees/);
  assert.match(v3Pages, /OKX Identity Verification/);
  assert.match(comparePage, /<CompareFinalChoiceCard directAnswer=\{directAnswer\} profiles=\{profiles\} locale=\{locale\} market=\{market\} product=\{product\} accountStage=\{accountStage\} funding=\{funding\} evidence=\{isPriorityTwoVenueDirectAnswer \? "none" : "inline"\} \/>/);
  assert.match(compareFinalChoiceCard, /profiles\.slice\(0, 2\)\.map/);
  assert.match(compareFinalChoiceCard, /const detailHref = \(slug\) => appendDecisionPassportQuery\(`\/exchanges\/\$\{slug\}/);
  assert.match(compareFinalChoiceCard, /data-mobile-evidence-default="collapsed"/);
  assert.match(compareFinalChoiceCard, /data-cta-placement="compare-final-choice-detail"/);
  assert.match(compareFinalChoiceCard, /data-cta-kind="research"/);
  const finalChoiceActionRow = compareFinalChoiceCard.slice(compareFinalChoiceCard.indexOf('className="v3-compare-final-choice-card__action-row"'), compareFinalChoiceCard.indexOf('className="v3-compare-final-choice-card__actions"'));
  assert.doesNotMatch(finalChoiceActionRow, /<a[\s\S]*data-cta-placement="compare-final-choice-detail"/);
  assert.match(compareFinalChoiceCard, /<LocalLink key=\{href\} locale=\{locale\} href=\{contextualInternalHref\(href, pageContext\)\} data-cta-kind="research" data-cta-placement="compare-direct-answer-internal"/);

  assert.match(v3Pages, /binance:[\s\S]*Binance decision check: verify fees, KYC, fiat route and product scope before registration/);
  assert.match(v3Pages, /Fees: published spot, futures and account-tier schedule/);
  assert.match(v3Pages, /Compare Binance vs OKX/);
  assert.match(detail, /const venueDirectAnswerCta = venueDirectAnswer\?\.registrationSlug[\s\S]*regionalVenueCta\(venueDirectAnswer\.registrationSlug, locale, market, product, \{ accountStage, funding \}\)/);
  assert.match(detail, /data-cta-placement="venue-direct-answer-protected-cta"/);
  assert.match(detail, /data-cta-kind=\{venueDirectAnswerCta\.direct \? "registration" : "research"\}/);

  const wave31Block = v3Pages.slice(v3Pages.indexOf('"binance-vs-okx"'), v3Pages.indexOf('hyperliquid:', v3Pages.indexOf('"binance-vs-okx"')));
  assert.doesNotMatch(wave31Block, /11350287|nexu888|bsmkweb|topzhjdgxcb|partner\.bitget|accounts\.binance\.com|okx\.com\/join|bitget\.com\/expressly/i);
  assert.doesNotMatch(compareFinalChoiceCard, /11350287|nexu888|bsmkweb|topzhjdgxcb|partner\.bitget|accounts\.binance\.com|okx\.com\/join|bitget\.com\/expressly/i);
  assert.match(v3Css, /\.v3-compare-direct-answer/);
  assert.match(v3Css, /\.v3-compare-direct-answer__links/);
  assert.match(v3Css, /@media \(max-width:\s*780px\)[\s\S]*\.v3-compare-direct-answer__links[\s\S]*grid-template-columns:\s*1fr/);
});

test("comparison snapshot prioritizes pair, eligibility, and next step", () => {
  assert.match(v3Pages, /label: isZhLoc \? zhText\(locale, "比较对象", "比較對象"\) :/);
  assert.match(v3Pages, /value: profiles\.map\(\(profile\) => getLocalizedVenueName\(profile, locale\)\)\.join\(" vs "\)/);
  assert.match(v3Pages, /value: isZhLoc \? zhText\(locale, "地区 · 产品 · 账户等级", "地區 · 產品 · 帳戶等級"\) : compareDetailPhrase\(locale, "region", "Region · product · account tier"\)/);
  assert.match(v3Pages, /value: text\.openDetail/);
  assert.doesNotMatch(v3Pages, /label: text\.activityState, value: String\(updates\.filter/);
});

test("Factbook exposes a source-bound direct answer and a venue decision handoff", () => {
  assert.match(factbookPage, /factbook-answer-card/);
  assert.match(factbookPage, /answerSteps/);
  assert.match(factbookPage, /#registration-path/);
  assert.match(factbookPage, /final terms|最终条件/);
  assert.match(factbookCss, /\.factbook-answer-card/);
});

test("regional market previews always disclose source-pack state", () => {
  assert.match(regionalPreview, /regional-market-preview__source-status/);
  assert.match(regionalPreview, /data-source-reviewed-at=\{registry\.sources\.length/);
  assert.match(regionalPreview, /does not promise eligibility or benefits|不把地区资格或优惠写成承诺/);
  assert.match(regionalPreview, /regional-market-preview__cta/);
});

test("international regional previews provide localized controls beyond the five primary locales", () => {
  assert.match(regionalPreview, /const UI_COPY =/);
  for (const locale of ["pt-BR", "fr", "de", "ja", "ko", "ar", "ru", "tr", "vi", "it"]) {
    assert.match(regionalPreview, new RegExp(`(?:['\"])?${locale.replace("-", "\\-")}(?:['\"])?\\s*:`));
  }
  assert.match(regionalPreview, /NextDecisionBridge/);
  assert.match(regionalPreview, /ui\.sourceStatus/);
  assert.match(regionalPreview, /pageBoundary/);
  assert.match(regionalPreviewCopy, /Source pack pending/);
  assert.match(regionalPreview, /dir=\{\["ar", "ur"\]\.includes\(locale\) \? "rtl" : "ltr"\}/);
});

test("regional locale tags preserve pt-BR detail labels instead of collapsing to pt", () => {
  assert.match(v3Pages, /const localeBase = String\(locale \|\| ""\)\.toLowerCase\(\) === "pt-br" \? "pt-BR"/);
  assert.match(v3Pages, /"pt-BR": \["Taxa base spot", "Prova de reservas \(PoR\)", "Requisito de KYC"/);
});

test("regional previews keep official-source evidence behind an explicit compact disclosure", () => {
  assert.match(regionalPreview, /regional-market-preview__sources-disclosure/);
  assert.match(regionalPreview, /regional-market-preview__sources-body/);
  assert.match(regionalPreview, /regional-market-preview__sources-disclosure.*summary/s);
  assert.match(regionalPreviewCss, /regional-market-preview__sources-disclosure/);
});

test("homepage directory cards use progressive disclosure for repeated detail fields", () => {
  assert.match(venueYellowPages, /yellow-card--compact/);
  assert.match(venueYellowPagesCss, /\.yellow-pages__grid--compact \.yellow-card__meta-grid/);
  assert.match(venueYellowPagesCss, /\.yellow-pages__grid--compact \.yellow-card__perk-row/);
});

test("ticker source notes have a single static accessible presentation", () => {
  assert.doesNotMatch(rebateTicker, /rebate-ticker__loop-copy|tabIndex=\{-1\}/);
  assert.match(rebateTicker, /Source notes/);
  assert.doesNotMatch(rebateTicker, /LIVE FEED|aria-live/);
  assert.match(rebateTicker, /Source status notes/);
  assert.match(rebateTickerCss, /\.rebate-ticker__item:focus-visible/);
  assert.match(rebateTickerCss, /\.rebate-ticker__summary:focus-visible/);
  assert.doesNotMatch(rebateTickerCss, /animation\s*:|@keyframes|mask-image/);
});

test("homepage source notes use native disclosure without removing source links", () => {
  assert.match(rebateTicker, /<details className="rebate-ticker__details">/);
  assert.doesNotMatch(rebateTicker, /open=|useState|onToggle|mobileExpanded/);
  assert.match(rebateTicker, /<summary className="rebate-ticker__summary" aria-label=\{sourceFullLabel \|\| undefined\}>/);
  assert.match(rebateTicker, /href=\{sourceNoteDestination\(role, context\)\}/);
  assert.match(rebateTickerCss, /\.rebate-ticker__summary \{[\s\S]*?display: list-item;[\s\S]*?min-height: 44px;/);
  assert.match(rebateTickerCss, /\.rebate-ticker__item \{[\s\S]*?min-height: 44px;/);
  assert.doesNotMatch(rebateTickerCss, /display:\s*none|overflow:\s*(hidden|clip)/);
});

test("topic guide CTAs use the public projection and disclose verified referral links", () => {
  assert.match(topicGuidePage, /publicCtaForTopicPlatform/);
  assert.match(topicGuidePage, /publicCtaForVenue\(platform\.slug, locale, market\)/);
  assert.match(topicGuidePage, /usePartnerRoute = p\.hasPartnerRoute && p\.claimStatus === "verified"/);
  assert.match(topicGuidePage, /usePartnerRoute \? \(p\.hasReferral \? "sponsored noopener noreferrer" : "noopener noreferrer"\) : undefined/);
  assert.match(topicGuidePage, /usePartnerRoute \? p\.affiliateUrl : profileHref\(p\.slug\)/);
  assert.match(topicGuidePage, /data-cta-kind=\{usePartnerRoute \? "registration" : "research"\}/);
  assert.match(topicGuidePage, /data-cta-placement="topic-showdown"/);
  assert.match(topicGuidePage, /data-cta-status=\{p\.claimStatus\}/);
});

test("topic guide puts a profile-first decision rail before long research blocks", () => {
  assert.match(topicGuidePage, /topic-decision-rail/);
  assert.match(topicGuidePage, /ctaPlacement="topic-top-decision"/);
  assert.match(topicGuidePage, /topicTopActions = publicPlatforms\.slice\(0, 2\)/);
  assert.match(topicGuidePage, /topicSourceAction = reviewedTopicSource/);
  assert.match(topicGuidePage, /topic-section-disclosure/);
  // A reader's retained closed state must have a reachable desktop summary.
  assert.match(topicGuideCss, /\.topic-section-disclosure > summary \{\s*display: flex;\s*\}/);
  assert.doesNotMatch(topicGuideCss, /\.topic-section-disclosure\[open\] > summary \{\s*display: none;/);
  assert.match(topicGuideCss, /@media \(max-width: 640px\)/);
  assert.match(topDecisionBox, /slice\(0, limit\)/);
  assert.match(topDecisionBox, /\[\.\.\.internalActions, \.\.\.sourceActions\]\.slice\(0, 3\)/);
});

test("topic guide keeps the secondary topic matrix behind a mobile disclosure", () => {
  assert.match(topicGuidePage, /topic-matrix-disclosure/);
  assert.match(topicGuidePage, /Explore more topic tracks/);
  assert.match(topicGuideCss, /\.topic-matrix-disclosure/);
  assert.match(topDecisionBoxCss, /\.top-decision-box__actions/);
  assert.match(topDecisionBoxCss, /@media \(max-width: 640px\)[\s\S]*\.top-decision-box\s*\{[\s\S]*grid-template-columns: 1fr/);
});

test("no-KYC topic keeps access intent while routing Hyperliquid latest-news intent to news paths", () => {
  assert.match(topicGuidePage, /topic\.slug === "no-kyc"/);
  assert.match(topicGuidePage, /data-gsc-query-intent="hyperliquid-latest-news"/);
  assert.match(topicGuidePage, /If you are looking for Hyperliquid latest news or announcements/);
  assert.match(topicGuidePage, /this No-KYC page is only the access-boundary guide/);
  assert.match(topicGuidePage, /"\/news", "hyperliquid_news_hub"/);
  assert.match(topicGuidePage, /"\/news\/hyperliquid-vs-dydx", "hyperliquid_news_article"/);
  assert.match(topicGuidePage, /"\/exchanges\/hyperliquid", "hyperliquid_profile"/);
  assert.match(topicGuidePage, /data-cta-placement="topic-no-kyc-news-intent"/);
  assert.match(topicGuideCss, /\.topic-intent-redirect\s*\{/);
  assert.doesNotMatch(topicGuidePage, /Hyperliquid latest news.*guaranteed|breaking live announcement|real-time news feed/i);
});

test("news detail keeps a post-reading decision path inside the site", () => {
  assert.match(newsDetailPage, /NextDecisionBridge/);
  assert.match(newsDetailPage, /placement="news-detail-next-decision-bridge"/);
  assert.match(newsDetailPage, /profileSlug=\{article\.relatedVenues\[0\]\}/);
  assert.match(newsDetailPage, /compareSlugs=\{article\.relatedVenues\}/);
  assert.match(newsDetailPage, /decision=\{article\.slug\}/);
  assert.match(newsDetailPage, /data-cta-placement="news-detail-venue-card"/);
});

// Class b: PR #77 renders source headings through DataRule, keeping h2, label and locale semantics.
test("news detail adds compact first-decision summaries for priority CTR articles", () => {
  assert.match(newsDetailPage, /const priorityNewsDecisionSummaries/);
  assert.match(newsDetailPage, /okx-usd-to-usdc-spot-pair-migration/);
  assert.match(newsDetailPage, /hyperliquid-vs-dydx/);
  assert.match(newsDetailPage, /Before you act on the OKX USD to USDC migration/);
  assert.match(newsDetailPage, /Before you choose a perpetual venue/);
  assert.match(newsDetailPage, /href: "\/exchanges\/okx"/);
  assert.match(newsDetailPage, /href: "\/compare\/binance-vs-okx"/);
  assert.match(newsDetailPage, /href: "\/compare\/hyperliquid-vs-dydx"/);
  assert.match(newsDetailPage, /href: "\/exchanges\/hyperliquid"/);
  assert.match(newsDetailPage, /href: "\/exchanges\/dydx"/);
  assert.match(newsDetailPage, /ctaPlacement="news-detail-first-decision"/);
  assert.match(newsDetailPage, /originalSource = article\.sources\?\.find/);
  assert.match(newsDetailPage, /sourceAction = originalSource/);
  assert.match(newsDetailPage, /<DataRule[\s\S]*as="h2"[\s\S]*label=\{t\.sourcesTitle\}[\s\S]*labelId="article-sources"[\s\S]*lang: t\.sourcesTitle === copy\.en\.sourcesTitle \? "en" : locale, dir: \["ar", "ur"\]\.includes\(locale\) \? "rtl" : "ltr"/);
  assert.match(newsDetailPage, /const fallbackCopy = copy\.en/);
  assert.ok(
    newsDetailPage.indexOf("<ArticleDecisionSummary") < newsDetailPage.indexOf("news-detail__partners-box"),
    "first decision summary should appear before mentioned exchange cards",
  );
  // SEO audit 2026-10-11 #5 (owner-approved): the lead answer comes first in the document; the decision rail follows the body.
  assert.ok(
    newsDetailPage.indexOf('<section className="news-detail__content"') < newsDetailPage.indexOf("<ArticleDecisionSummary"),
    "first decision summary follows the article body in the DOM",
  );
  assert.doesNotMatch(
    newsDetailPage,
    /news-detail__first-decision[\s\S]*(11350287|nexu888|bsmkweb|accounts\.binance\.com|okx\.com\/join|partner\.bitget|bitget\.com\/expressly|topzhjdgxcb)/i,
  );
  assert.match(topDecisionBoxCss, /\.top-decision-box\s*\{/);
  assert.match(topDecisionBoxCss, /@media \(max-width: 640px\)[\s\S]*\.top-decision-box\s*\{[\s\S]*grid-template-columns: 1fr/);
});

async function renderTokenizedTreasuryNewsHtml(locale = "en") {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const pathModule = await import("node:path");
  const { execFileSync } = await import("node:child_process");
  const root = pathModule.resolve(import.meta.dirname, "..");
  const dir = await mkdtemp(pathModule.join(root, "tests/.tmp-frontend-contract-news-"));
  try {
    const entry = pathModule.join(dir, "entry.mjs");
    const bundle = pathModule.join(dir, "bundle.cjs");
    await writeFile(entry, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import feed from '../../public/content/news-feed.json' with { type: 'json' };
      import { NewsDetailPage } from '../../src/components/v3/news/NewsDetailPage.jsx';
      const html = renderToStaticMarkup(React.createElement(NewsDetailPage, {
        slug: 'tokenized-treasuries-structure-access-risks',
        locale: '${locale}',
        initialArticles: feed.articles,
      }));
      console.log(JSON.stringify({ html }));
    `);
    execFileSync(pathModule.join(root, "node_modules/.bin/esbuild"), [
      entry,
      "--bundle",
      "--format=cjs",
      "--platform=node",
      `--outfile=${bundle}`,
      "--loader:.css=empty",
      "--loader:.svg=text",
      "--loader:.png=dataurl",
      "--loader:.jpg=dataurl",
      "--loader:.jpeg=dataurl",
      "--log-level=warning",
      "--define:import.meta.env.DEV=false",
      "--define:import.meta.env.PROD=true",
      "--define:import.meta.env.SSR=true",
      "--define:import.meta.env.VITE_DATA_SOURCE=\"local-research\"",
    ], { cwd: root, stdio: "pipe" });
    return JSON.parse(execFileSync(process.execPath, [bundle], { cwd: root, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 })).html;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("tokenized Treasury news detail surfaces a source-bound first answer without invite links", async () => {
  assert.match(newsDetailPage, /tokenized-treasuries-structure-access-risks/);
  assert.match(newsDetailPage, /Before comparing tokenized Treasury yield/);
  assert.match(newsDetailPage, /token label, issuer, recordkeeper, custodian, redemption counterparty/);
  assert.match(newsDetailPage, /href: "\/topics\/tokenized-treasuries#treasury-evidence-checklist"/);
  assert.match(newsDetailPage, /href: "\/topics\/tokenized-assets"/);
  assert.match(newsDetailPage, /href: "\/methodology#disclosure"/);
  assert.match(newsDetailPage, /Jump to official sources/);
  const tokenizedBlock = newsDetailPage.slice(
    newsDetailPage.indexOf('"tokenized-treasuries-structure-access-risks"'),
    newsDetailPage.indexOf("function ArticleDecisionSummary"),
  );
  assert.doesNotMatch(tokenizedBlock, /11350287|nexu888|bsmkweb|accounts\.binance\.com|okx\.com\/join|partner\.bitget|bitget\.com\/expressly|topzhjdgxcb/i);

  const html = await renderTokenizedTreasuryNewsHtml("en");
  const decisionStart = html.indexOf('class="top-decision-box news-detail__first-decision"');
  assert.ok(decisionStart >= 0, "tokenized Treasury first decision is server-rendered");
  const decisionEnd = html.indexOf('class="news-detail__partners-box"', decisionStart);
  assert.ok(decisionEnd > decisionStart, "first decision appears before mentioned exchange cards");
  // Scope to the decision box itself: since NX-10 the article body below it renders its own Markdown links
  // (including /topics/tokenized-treasuries), which this check is not about.
  const firstDecision = html.slice(decisionStart, html.indexOf("</aside>", decisionStart));
  assert.ok(firstDecision.length > 0 && decisionStart + firstDecision.length < decisionEnd);
  assert.match(firstDecision, /href="\/topics\/tokenized-treasuries#treasury-evidence-checklist"/);
  assert.match(firstDecision, /Open tokenized Treasury checklist/);
  assert.doesNotMatch(firstDecision, /href="\/topics\/tokenized-treasuries"/);
});

test("news detail keeps mentioned venue context compact on mobile", () => {
  const venueContext = newsDetailPage.slice(
    newsDetailPage.indexOf("{/* Mentioned exchanges stay internal;"),
    newsDetailPage.indexOf("<OnsiteTelegramBotHandoff", newsDetailPage.indexOf("{/* Mentioned exchanges stay internal;")),
  );
  assert.match(venueContext, /article\.relatedVenues\.map\(\(vSlug\)/, "all mentioned venues must remain present");
  assert.match(venueContext, /<a\s+key=\{vSlug\}[\s\S]*className="news-partner-card"/, "the entire compact row is the research link");
  assert.ok(venueContext.includes('href={withContext(`/exchanges/${encodeURIComponent(vSlug)}#registration-path`)}'), "profile anchors must preserve locale/market/product context");
  assert.match(venueContext, /data-cta-kind="research"/);
  assert.match(venueContext, /data-cta-platform=\{vSlug\}/);
  assert.match(venueContext, /data-cta-placement="news-detail-venue-card"/);
  assert.match(venueContext, /data-growth-decision=\{vSlug\}/);
  assert.match(venueContext, /data-growth-placement="news-detail-venue-card"/);
  for (const text of ["t.partnerSectionTitle", "db.name || vSlug", "db.officialDomain", "t.verifiedDomain", "t.claimBtn"]) {
    assert.ok(venueContext.includes(text), `compact context must retain ${text}`);
  }
  assert.match(venueContext, /<span className="news-partner-card__cta">\{t\.claimBtn\}<\/span>/);
  const partnerCardAnchor = venueContext.slice(
    venueContext.indexOf("return ("),
    venueContext.indexOf("</a>", venueContext.indexOf("return (")) + 4,
  );
  assert.equal((partnerCardAnchor.match(/<a\b/g) || []).length, 1, "one link per venue card, without nested controls");
  assert.match(newsDetailCss, /@media \(max-width: 640px\)\s*\{\s*\.news-detail__partners-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);[^}]*gap:\s*\.25rem;/);
  assert.match(newsDetailCss, /\.news-partner-card__brand\s*\{[^}]*min-width:\s*0;/);
  assert.match(newsDetailCss, /\.news-partner-card__domain,\s*\.news-partner-card__code-box\s*\{[^}]*overflow-wrap:\s*anywhere;/);
  assert.match(newsDetailCss, /\.news-partner-card__cta\s*\{[^}]*max-width:\s*8rem;[^}]*overflow-wrap:\s*anywhere;/);
});

test("news detail keeps the lead decision visible and puts the long analysis behind a mobile disclosure", () => {
  assert.match(newsDetailPage, /news-detail__article-disclosure/);
  assert.match(newsDetailPage, /showFullArticle/);
  assert.match(newsDetailPage, /news-detail__prose--lead/);
  assert.match(newsDetailPage, /news-detail__prose--deep/);
  assert.match(newsDetailCss, /\.news-detail__article-disclosure > summary/);
  assert.match(newsDetailCss, /@media \(max-width: 640px\)[\s\S]*news-detail__article-disclosure/);
  assert.match(newsDetailPage, /href=\{withContext\("\/news"\)\}/);
});

test("activity detail surfaces source-bound profile actions before the long matrix", () => {
  assert.match(activityPages, /v3-activity-decision-strip/);
  assert.match(activityPages, /data-cta-placement="activity-detail-hero"/);
  assert.match(activityPages, /data-cta-placement="activity-detail-hero-research"/);
  assert.match(activityPages, /data-growth-decision=\{venue\.slug\}/);
  assert.match(activityPages, /export function ActivityDetailPage\(\{ copy, locale, market, product/);
  assert.match(activityPages, /contextualHref\(`\/exchanges\/\$\{venue\.slug\}`, \{ locale, market, product \}\)/);
  assert.match(activityPages, /contextualHref\(`\/activities\/research\/\$\{venue\.slug\}`, \{ locale, market, product \}\)/);
  assert.match(v3Css, /\.v3-activity-decision-strip/);
});

test("official research preserves regional context through its profile and comparison handoffs", () => {
  assert.match(app, /researchRoute\(pathname, venues\);[\s\S]*return \{ \.\.\.officialResearch, \.\.\.contextParams\(\) \};/);
  assert.match(app, /<OfficialResearchPage locale=\{locale\} market=\{route\.market\} product=\{route\.product\}/);
  assert.match(officialResearchPage, /export function OfficialResearchPage\(\{ locale = 'en', market, product/);
  assert.match(officialResearchPage, /const withContext = \(path\) => contextualHref\(path, \{ locale, market, product \}\)/);
  assert.match(officialResearchPage, /href=\{withContext\(`\/exchanges\/\$\{venue\.slug\}`\)\}/);
});

test("activity reward research uses a responsive card grid without removing source actions", () => {
  assert.match(activityCenterV3, /activity-center-v3__reward-grid/);
  assert.match(activityCenterV3, /activity-card-v3__conditions/);
  assert.match(activityCenterV3, /activity-center-v3__conditions-disclosure/);
  assert.match(activityCenterV3, /firstReadableSource\(record\).url/);
  assert.match(activityCenterV3Css, /\.activity-center-v3__reward-grid \{/);
  assert.match(activityCenterV3Css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(activityCenterV3Css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(activityCenterV3Css, /activity-center-v3__reward-grid \.activity-center-v3__source-actions/);
});

test("deep comparison actions preserve bounded growth attribution", () => {
  assert.match(v3PagesSource, /data-growth-placement="compare-sticky-registration"/);
  assert.match(v3PagesSource, /data-cta-placement="compare-sticky-registration"/);
  assert.match(v3PagesSource, /data-cta-kind=\{pCta\.direct \? "registration" : "research"\}/);
  assert.match(v3PagesSource, /data-growth-placement="compare-hero-versus"/);
  assert.match(v3PagesSource, /data-growth-placement="compare-source-detail"/);
  assert.match(v3PagesSource, /data-growth-placement="compare-decision-guide"/);
  assert.match(v3PagesSource, /data-growth-placement="curated-comparison"/);
  assert.match(v3PagesSource, /const \[stickyCtaActive, setStickyCtaActive\] = useState\(false\)/);
  assert.match(v3PagesSource, /document\.getElementById\("compare-versus-card"\)/);
  assert.match(v3PagesSource, /getBoundingClientRect\(\)\.bottom <= 80/);
  assert.match(v3PagesSource, /window\.addEventListener\("scroll", updateStickyState, \{ passive: true \}\)/);
  assert.match(v3PagesSource, /id="compare-hero"/);
  assert.match(v3PagesSource, /id="compare-versus-card"/);
  assert.match(fintechPremiumCss, /\.v3-compare-sticky-bar\.is-active[\s\S]*pointer-events: auto;/);
});

test("venue detail mobile CTA density keeps one primary route plus compact support blocks", () => {
  const detail = venueDetailSource;
  const rebateBlock = detail.slice(detail.indexOf('className="v3-venue-rebate-card"'), detail.indexOf('className="v3-profile-cost-conditions"'));

  assert.match(detail, /data-cta-placement="venue-hero-quick-registration"/);
  assert.match(detail, /data-cta-placement="venue-mobile-sticky"/);
  assert.match(rebateBlock, /className="v3-rebate-route-summary"/);
  assert.doesNotMatch(rebateBlock, /href=\{venueCta\.ctaHref\}/);
  assert.doesNotMatch(rebateBlock, /data-cta-placement="venue-hero-card"/);
  assert.doesNotMatch(rebateBlock, /className="v3-rebate-cta-btn"/);
  assert.match(fintechPremiumCss, /\.v3-rebate-route-summary \{/);
  assert.match(v3PagesSource, /<VenueReadinessChecklist/);
});

test("deep comparison exposes a compact decision jump rail without removing evidence", () => {
  assert.match(v3PagesSource, /function CompareDecisionNav\(/);
  assert.match(v3PagesSource, /href=\{`#\$\{id\}`\}/);
  assert.match(v3PagesSource, /id="compare-snapshot"/);
  assert.match(v3PagesSource, /id="hardcore-matrix"/);
  assert.match(v3PagesSource, /id="decision-guide"/);
  assert.match(v3PagesSource, /id="compare-faq"/);
  assert.match(v3PagesSource, /id="compare-sources"/);
  assert.match(v3PagesSource, /className="v3-compare-decision-nav"/);
  assert.match(crossroadsCompareCss, /@media \(max-width: 680px\)[\s\S]*\.v3-compare-decision-nav \{[\s\S]*flex-direction: column;[\s\S]*overflow-x: visible;/);
  assert.match(crossroadsCompareCss, /@media \(max-width: 680px\)[\s\S]*\.v3-compare-decision-nav__links \{[\s\S]*display: grid;[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(crossroadsCompareCss, /@media \(max-width: 680px\)[\s\S]*\.v3-compare-decision-nav a \{[\s\S]*min-block-size: 44px;[\s\S]*white-space: normal;[\s\S]*overflow: visible;[\s\S]*overflow-wrap: anywhere;/);
  assert.doesNotMatch(crossroadsCompareCss, /\.v3-compare-decision-nav a:nth-last-child\(-n \+ 2\) \{[\s\S]*display: none;/);
  assert.match(crossroadsCompareCss, /\.v3-compare-final-choice-card__actions > a\[data-cta-placement="compare-final-choice-matrix"\] \{[\s\S]*display: none;/);
  assert.match(crossroadsCompareCss, /@media \(min-width: 781px\) and \(max-width: 1100px\)[\s\S]*\.v3-compare-page \.v3-page-hero \{[\s\S]*width: min\(980px, calc\(100% - 32px\)\);/);
  assert.match(crossroadsCompareCss, /\.v3-compare-page \.v3-venue-hero,[\s\S]*\.v3-compare-page \.v3-versus-card,[\s\S]*inline-size: 100%;/);
  assert.match(v3Css, /@media \(max-width: 600px\)[\s\S]*\.v3-compare-snapshot \.v3-snapshot-strip \{[\s\S]*display: grid;/);
});

test("deep comparison classifies unresolved regional exits as research", () => {
  assert.match(v3PagesSource, /data-cta-kind=\{pCta\.direct \? "registration" : "research"\}/);
  assert.match(v3PagesSource, /data-cta-placement="compare-decision-guide"[\s\S]*data-growth-placement="compare-decision-guide"/);
  assert.match(v3PagesSource, /data-cta-kind="research"/);
  assert.doesNotMatch(v3PagesSource, /data-cta-kind=\{ctaA\.direct \? "registration" : "research"\}/);
  assert.doesNotMatch(v3PagesSource, /data-cta-kind=\{ctaB\.direct \? "registration" : "research"\}/);
  assert.match(v3PagesSource, /function HardcoreMetricMatrix\(\{ profiles, locale, market, product, accountStage, funding \}\)/);
  assert.match(v3PagesSource, /data-cta-placement="compare-hero-versus"/);
  assert.match(v3PagesSource, /data-cta-kind="research"/);
  assert.match(v3PagesSource, /data-cta-placement="compare-metric-matrix-detail"/);
});

test("deep comparison verdict detail links preserve regional context and placement attribution", () => {
  assert.match(v3Pages, /data-cta-placement="compare-verdict-detail"/);
  assert.match(v3Pages, /data-growth-placement="compare-verdict-detail"/);
  assert.match(v3Pages, /directoryContextSearch\(\{ market, product, locale, accountStage, funding \}\)/);
  assert.match(v3Pages, /CompareVerdictPanel text=\{text\} ui=\{ui\} locale=\{locale\} profiles=\{profiles\} market=\{market\} product=\{product\} accountStage=\{accountStage\} funding=\{funding\}/);
  assert.match(v3Pages, /v3-compare-verdict__pending-details/);
  assert.match(v3LayoutStability, /v3-compare-verdict__pending-details/);
});

test("Factbook preserves regional context through direct answer and venue switching", () => {
  assert.match(app, /name: "factbook", slug, \.\.\.contextParams\(\)/);
  assert.match(app, /<FactbookPage slug=\{route\.slug\} locale=\{locale\} market=\{route\.market\} product=\{route\.product\}/);
  assert.match(factbookPage, /localizedHref/);
  assert.match(factbookPage, /factbook-direct-answer[\s\S]*data-growth-market=\{market\}/);
  assert.match(factbookPage, /localizedHref\(`\/factbook\/\$\{encodeURIComponent\(s\)\}`/);
});

// Class b: 4a31e90 puts follow-up actions after results; CTA ownership checks remain.
test("rate benchmark and calculator paths preserve context with distinct research and registration placements", () => {
  assert.ok(feeBenchmarkTerminal.indexOf('fee-terminal__answer-block') < feeBenchmarkTerminal.indexOf('<CostDecision'), "rates answer block should be SSR-visible before the calculator");
  assert.match(feeBenchmarkTerminal, /answerHref\("\/compare\/binance-vs-okx", "spot"\)/);
  assert.match(feeBenchmarkTerminal, /answerHref\("\/compare\/bybit-vs-bitget", "perpetuals"\)/);
  assert.match(feeBenchmarkTerminal, /answerHref\("\/topics\/derivatives", "perpetuals"\)/);
  assert.ok(feeBenchmarkTerminal.indexOf('fee-terminal__next-step') < feeBenchmarkTerminal.indexOf('<CostDecision'), "rates next-step CTA should appear before the calculator on mobile");
  assert.match(feeBenchmarkTerminal, /data-cta-placement="rates-next-step-directory"[\s\S]*data-growth-market=\{market\}[\s\S]*data-growth-product=\{product\}/);
  assert.doesNotMatch(feeBenchmarkTerminal, /data-cta-placement="rates-next-step-telegram"/, "Telegram appears once on /rates (the Bot handoff block)");
  assert.match(feeBenchmarkTerminal, /data-cta-placement="rate-benchmark-row"/);
  assert.match(feeBenchmarkTerminal, /data-growth-market=\{market\}/);
  assert.match(costDecision, /cost-calculator-eligibility/);
  assert.match(costDecision, /data-cta-placement="cost-calculator"/);
  assert.match(costDecision, /const primaryCta=primarySlug\?regionalVenueCta\(primarySlug, locale, regionMarket, selectedProduct, \{ accountStage, funding \}\):null/);
  assert.match(costDecision, /data-cta-placement="cost-calculator-next-compare"/);
  assert.match(costDecision, /data-cta-placement="cost-calculator-next-platform"/);
  assert.match(costDecision, /data-cta-placement="cost-calculator-next-registration"/);
  assert.ok(costDecision.indexOf('cost-decision__results') >= 0, "results grid exists");
  assert.ok(costDecision.indexOf('cost-decision__results') < costDecision.indexOf('cost-decision__next-actions'), "calculator follow-up actions appear after results");
  assert.ok(!costDecision.includes('cost-decision__telegram'), "The calculator carries no second Telegram link (the page has one Telegram route)");
  assert.match(costDecision, /data-growth-decision="compare_binance_okx"/);
  assert.match(feeBenchmarkTerminal, /data-cta-kind=\{row\.ctaDirect \? "registration" : "research"\}/);
  assert.match(costDecision, /data-cta-kind=\{cta\.direct \? 'registration' : 'research'\}/);
  assert.match(costDecision, /researchHref\('\/compare\/binance-vs-okx',market === 'futuresFee' \? 'perpetuals' : 'spot'\)/);
  assert.match(costDecision, /appendDecisionPassportQuery\([\s\S]*localizedHref\(path,\{locale\}\)[\s\S]*\{ market:regionMarket, product:selectedProduct, accountStage, funding \}/);
});

test("regional account-stage cards use mobile progressive disclosure without removing CTAs", () => {
  assert.match(regionalPreview, /accountStagesOpen/);
  assert.match(regionalPreview, /regional-market-preview__decision-card--secondary/);
  assert.match(regionalPreview, /regional-account-stages/);
  assert.match(regionalPreview, /data-cta-placement="regional-account-stage"/);
  assert.match(regionalPreviewCss, /regional-market-preview__decision-grid\.is-open \.regional-market-preview__decision-card--secondary/);
  assert.match(regionalPreviewCss, /regional-market-preview__decision-toggle/);
});

test("news cards provide a direct comparison handoff when two venues are mentioned", () => {
  assert.match(newsListPage, /compareSlugs = \(article\.relatedVenues \|\| \[\]\)\.slice\(0, 2\)/);
  assert.match(newsListPage, /news-card-compare/);
  assert.match(newsListPage, /data-growth-decision=\{`\$\{compareSlugs\[0\]\}_vs_\$\{compareSlugs\[1\]\}`\}/);
  assert.match(newsListPageCss, /news-article-card__compare-link/);
  assert.match(newsListPage, /contextualHref/);
  assert.match(newsDetailPage, /contextualHref/);
});

test("news list uses summary data and progressive batch rendering instead of hidden full-card DOM", () => {
  assert.match(newsListPage, /loadNewsArticleSummaries/);
  assert.match(newsListPage, /normalizeNewsFeedSummaries\(initialArticles\)/);
  // Editorial index (2026-10-11): a listing page shows all of its rows (lead story + day groups); search loads page-sized batches.
  assert.match(newsListPage, /const NEWS_INITIAL_VISIBLE_COUNT = NEWS_PAGE_SIZE/);
  assert.match(newsListPage, /const NEWS_BATCH_SIZE = NEWS_PAGE_SIZE/);
  assert.match(newsListPage, /visibleArticles = articles\.slice\(0, visibleArticleCount\)/);
  assert.match(newsListPage, /listRows = leadArticle \? visibleArticles\.slice\(1\) : visibleArticles/);
  assert.match(newsListPage, /groupNewsByDay\(listRows\)\.map/);
  assert.match(newsListPage, /setVisibleArticleCount\(\(count\) => Math\.min\(count \+ NEWS_BATCH_SIZE, articles\.length\)\)/);
  assert.doesNotMatch(newsListPage, /showAllArticles/);
  assert.doesNotMatch(newsListPageCss, /nth-child\(n \+ 4\)[\s\S]*display:\s*none/);
  assert.doesNotMatch(newsListPageCss, /\.news-article-card \{[^}]*content-visibility:\s*auto;/);
  assert.match(newsListPageCss, /\.news-research-index \{[\s\S]*content-visibility:\s*auto;[\s\S]*contain-intrinsic-size:\s*0 220px;/);
  assert.match(newsListPageCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(newsListPageCss, /transition:\s*all\b/);
});

test("activity cards provide direct venue-profile handoffs alongside research sources", () => {
  assert.match(activityCenterV3, /activity-card-venue-profile/);
  assert.match(activityCenterV3, /activity-reward-venue-profile/);
  assert.match(activityCenterV3, /activity-reward-research/);
  assert.match(activityCenterV3, /\/exchanges\/\$\{encodeURIComponent\(record\.platform\.slug\)\}/);
  assert.match(activityCenterV3, /contextualHref/);
  assert.match(activityCenterV3, /activity-footer-comparison/);
});

test("topic comparison and showdown links use honest research or registration attribution", () => {
  assert.match(topicGuidePage, /data-cta-kind="research" data-cta-placement="topic-derivatives-route-primary"/);
  assert.match(topicGuidePage, /data-cta-kind="research" data-cta-placement="topic-derivatives-route-more"/);
  assert.match(topicGuidePage, /data-cta-kind=\{usePartnerRoute \? "registration" : "research"\}/);
  assert.match(topicGuidePage, /data-growth-placement="topic-showdown"/);
});

// Class d retarget: the full matrix is rendered expanded; unknown metrics move into the pending disclosure.
test("deep comparison keeps high-intent metrics visible with pending metrics disclosed on mobile", () => {
  assert.match(v3PagesSource, /const compactPendingRows = metricRows\.filter\(\(row\) => !row\.hasKnown\)/);
  assert.match(v3PagesSource, /const shouldRenderMetricRow = \(key\) => !compactPendingKeys\.has\(key\)/);
  assert.match(v3PagesSource, /<div className="v3-matrix-table-wrap is-expanded"/);
  for (const key of ["spot", "futures", "benefit", "net"]) {
    assert.match(v3PagesSource, new RegExp(`shouldRenderMetricRow\\("${key}"\\)`));
  }
  assert.match(v3PagesSource, /<details className="v3-matrix-pending-disclosure">/);
  assert.match(v3PagesSource, /View full quantitative matrix/);
  assert.doesNotMatch(v3PagesSource, /showAllMetrics/);
});

test("deep comparison snapshot cards use a compact, bounded mobile grid", () => {
  assert.match(v3Css, /\.v3-compare-snapshot \.v3-snapshot-strip/);
  assert.match(v3Css, /grid-template-columns: 1fr/);
  assert.match(v3Css, /-webkit-line-clamp: 2/);
  assert.match(v3Css, /font-size: 16px/);
  assert.match(v3Css, /font-size: 12px/);
});

test("fee calculator fails closed when partner benefits are not source-reviewed", () => {
  assert.match(feeRebateCalculator, /benefitVerified = topRow\.claimStatus === "verified"/);
  assert.match(feeRebateCalculator, /当前没有已核验的用户权益节省声明/);
  assert.match(feeRebateCalculator, /No verified user-benefit claim is available/);
  assert.doesNotMatch(feeRebateCalculator, /使用官方专属合作码 \[NEXUALPHA\]/);
  assert.doesNotMatch(feeRebateCalculator, /topRow\.inviteCode \|\| "NEXUALPHA"/);
});

test("homepage fee analyzer describes a base-rate scenario and uses the source-bound regional CTA projection", () => {
  assert.match(tradingBleedAnalyzer, /regionalVenueCta/);
  assert.match(tradingBleedAnalyzer, /tradingBleedCopy\(locale\)/);
  assert.match(tradingBleedCopy, /Annual user benefit when verified/);
  assert.match(tradingBleedCopy, /Base-rate scenario: account tier, slippage, funding and user benefits are not included/);
  assert.match(tradingBleedAnalyzer, /data-cta-placement="bleed-analyzer"/);
  assert.match(tradingBleedAnalyzer, /data-cta-status=\{commercialClaim\.status\}/);
  assert.doesNotMatch(tradingBleedAnalyzer, /How Much Are You Overpaying Your Current Exchange\?/);
  assert.doesNotMatch(tradingBleedAnalyzer, /Claim Rebate & Open Account Now/);
});

test("campaign radar uses the public CTA projection for activity handoffs", () => {
  assert.match(campaignRadar, /publicCtaForVenue/);
  assert.match(campaignRadar, /registrationUrl: publicCta\.registrationUrl/);
  assert.match(campaignRadar, /item\.hasReferral/);
  assert.match(campaignRadar, /item\.registrationUrl/);
  assert.match(campaignRadar, /data-cta-placement="campaign-radar"/);
  assert.match(campaignRadar, /data-cta-status=\{item\.commercialClaim\.status\}/);
});

test("illustrative conversion paths are visibly and semantically separated from live user proof", () => {
  assert.match(liveConversionProof, /MOCK_EVENTS/);
  assert.match(liveConversionProof, /非实时用户事件/);
  assert.match(liveConversionProof, /aria-label=\{exampleLabel\}/);
  assert.match(liveConversionProof, /conversion-proof__label/);
  assert.match(liveConversionProofCss, /不表示实时用户活动/);
  assert.match(liveConversionProofCss, /background: #64748b;/);
  assert.doesNotMatch(liveConversionProofCss, /box-shadow: 0 0 8px #34d399/);
});

test("hero telemetry does not claim an unverified live whitelist or interception service", () => {
  assert.match(leanHero, /来源状态可用/);
  assert.match(leanHero, /SOURCE STATUS AVAILABLE/);
  assert.match(leanHero, /Source-reviewed routes/);
  assert.doesNotMatch(leanHero, /Active Whitelist/);
  assert.doesNotMatch(leanHero, /Official Gateways Verified & Active/);
  assert.doesNotMatch(leanHero, /即時攔截/);
});

test("topic guide keeps all quantitative quick stats pending without item-level evidence", () => {
  assert.match(topicGuidePage, /const topicFactsVerified = false/);
  assert.match(topicGuidePage, /topicFactsVerified \|\| topicOffersVerified/);
  assert.match(topicGuidePage, /Verify official sources and current account terms/);
});

test("NexuAlpha is the visible site identity without assuming a logo asset or public domain URL", () => {
  assert.match(index, /<meta name="google" content="notranslate" \/>/);
  assert.match(index, /<title translate="no" lang="en">NexuAlpha — Independent platform research<\/title>/);
  assert.match(index, /name="application-name" content="NexuAlpha"/);
  assert.match(index, /independent platform research and comparison experience/);
  assert.doesNotMatch(index, /rel="canonical"|og:|twitter:|https?:\/\//);
  assert.match(nexuAlphaWordmark, /aria-label="NexuAlpha" translate="no" lang="en"/);
  assert.match(nexuAlphaWordmark, /dir="ltr"/);
  assert.match(nexuAlphaWordmark, /alt=""/);
  assert.match(nexuAlphaWordmark, /data-brand-slot="nexualpha-logo">NexuAlpha/);
  assert.match(nexuAlphaWordmark, /nexualpha-round\.svg/);
  assert.match(nexuAlphaWordmark, /aria-hidden="true"/);
  assert.match(index, /nexualpha-round\.svg/);
  assert.match(cleanFooter, /<NexuAlphaWordmark variant="footer"/);
  assert.match(designSystem, /<NexuAlphaWordmark href="\/"/);
  assert.match(releaseVisualGates, /\.nexualpha-wordmark__mark \{[^}]*object-fit: contain;/s);
  assert.doesNotMatch(releaseVisualGates, /\.nexualpha-wordmark__mark \{[^}]*display: none;/s);
  assert.match(refinement, /color: #F5F7FA/);
  assert.match(refinement, /color: #4B76FF/);
  assert.match(releaseVisualGates, /nexualpha-wordmark \{[^}]*direction: ltr;[^}]*unicode-bidi: isolate;/);
  assert.match(releaseVisualGates, /\.v2-page \{ overflow: visible; \}/);
  assert.doesNotMatch(releaseVisualGates, /overflow-x: clip/);
  assert.doesNotMatch(css, /\.v2-page\{[^}]*overflow:hidden/);
  assert.match(releaseVisualGates, /localized native selects/);
  assert.match(releaseVisualGates, /\.finder-rows label \{ grid-template-columns: minmax\(0, 112px\) minmax\(0, 1fr\); \}/);
  assert.match(releaseVisualGates, /\.finder-rows select \{ inline-size: 100%; min-inline-size: 0; max-inline-size: 100%; \}/);
  assert.match(releaseVisualGates, /\.mobile-menu-trigger \{[\s\S]*min-width: 43px;[\s\S]*background: rgba\(255, 255, 255, \.04\);/);
  assert.match(releaseVisualGates, /\.mobile-search-overlay select:focus-visible/);
  assert.match(releaseVisualGates, /\.mobile-search-overlay a,[\s\S]*\.mobile-search-overlay label \{[\s\S]*display: flex;[\s\S]*padding: 0 14px;/);
  assert.match(releaseVisualGates, /\.mobile-search-overlay select \{[\s\S]*background: #101722;[\s\S]*color: #f5f7fa;/);
  assert.match(releaseVisualGates, /\.v2-footer \.nexualpha-wordmark__label \{ display: inline-flex; [^}]*color: #f5f7fa;/);
  assert.doesNotMatch(app, />PILOT 01</);
});

test("homepage Telegram CTA preserves locale and regional context", () => {
  assert.match(leanHero, /getTelegramDeepLink\(\{/);
  assert.match(leanHero, /market: telegramParams\?\.get\("market"\)/);
  assert.match(leanHero, /locale,\n\s+product: telegramParams\?\.get\("product"\)/);
  assert.match(leanHero, /href=\{telegramHref\}/);
});

test("Japanese homepage gives the JP AEO page a compact internal entry", () => {
  assert.match(leanHero, /function heroPillsForLocale\(ui, locale\)/);
  assert.match(leanHero, /locale !== "ja"/);
  assert.match(leanHero, /日本の口座条件/);
  assert.match(leanHero, /href: "\/jp\?locale=ja"/);
  assert.match(leanHero, /const heroPills = heroPillsForLocale\(ui, locale\)/);
  assert.match(leanHero, /heroPills\.map\(\(pill\)/);
});

test("homepage moves from the hero into venue comparison before the directory", () => {
  assert.doesNotMatch(app, /function ResearchPath|function ActiveOpportunities/);
  assert.match(app, /<LeanHero/);
  assert.match(app, /<VenueYellowPages/);
  assert.match(app, /<CrossroadsCompare/);
  assert.doesNotMatch(app, /<ScenarioRouter/);
  assert.doesNotMatch(app, /href="https?:\/\/[^"}]+"/);
  const home = app.slice(app.lastIndexOf("顶级转化漏斗首页"));
  assert.ok(home.indexOf("<LeanHero") < home.indexOf("<CrossroadsCompare"));
  assert.ok(home.indexOf("<CrossroadsCompare") < home.indexOf("<VenueYellowPages"));
});

test("NexuAlpha 3.0 adds exchange profiles, deep comparison, activities, and a visible conversion path", () => {
  assert.equal(packageJson.version, "3.0.0");
  assert.match(app, /pathname\.match\(\/\^\\\/exchanges/);
  assert.match(app, /pathname\.match\(\/\^\\\/compare/);
  assert.match(app, /pathname === "\/activities"/);
  assert.match(app, /const activityMatch = pathname\.match/);
  assert.match(app, /<VenueDetailPage/);
  assert.match(app, /<CompareDeepPage/);
  assert.match(app, /<ActivityCenterPage/);
  assert.match(app, /<ActivityDetailPage/);
  assert.doesNotMatch(app, /<ConversionFunnel/);
  // venue-graph lane 2026-10-11: ResearchPanel renders in the venue research hub, ResearchComparison in the compare page.
  assert.match(venueResearch, /import \{ ResearchPanel \} from "\.\/ResearchPanels"/);
  assert.match(v3PagesOnly, /import \{ ResearchComparison \} from "\.\/ResearchPanels"/);
  assert.match(v3Pages, /<ResearchPanel slug=\{profile\.slug\} locale=\{locale\}/);
  assert.match(v3Pages, /<ResearchComparison profiles=\{profiles\} locale=\{locale\}/);
  assert.match(v3Pages, /SnapshotStrip/);
  assert.match(v3Css, /\.v3-snapshot-strip/);
  assert.match(venueExplorer, /href=\{withLocale\(locale, `\/exchanges\/\$\{venue\.slug\}`\)\}/);
  assert.match(v3Pages, /text\.funnelTitle/);
  assert.match(v3Pages, /text\.compareTitle/);
  assert.match(activityPages, /text\.activities/);
  assert.match(activityPages, /export function ActivityDetailPage/);
  assert.match(activityPages, /text\.activityNotFound/);
  assert.match(v3Css, /\.v3-page-hero/);
});

// Class d retarget: evidence is now grouped into visible research chapters inside the sources hub.
test("3.0 secondary pages stay visibly independent and keep commercial handoffs explicit", () => {
  assert.match(v3Product, /not an exchange website/);
  assert.match(v3Product, /不是交易所官网/);
  assert.match(v3Product, /Configured partner routes open|已配置合作链接/);
  assert.match(v3Pages, /data-cta-kind=\{/);
  assert.match(v3Pages, /"registration"/);
  assert.match(v3Pages, /rel=\{[^}]*sponsored noopener noreferrer/);
  assert.match(v3Pages, /text\.relationship/);
  assert.match(venuePage, /className="v3-profile-sources-group"/);
  assert.match(venueResearch, /v3-profile-research-chapter/);
  assert.match(venueResearch, /v3-profile-evidence-block/);
  assert.match(venueResearch, /v3-profile-account-section/);
  assert.match(profileRefinement, /\.v3-profile-page \.v3-profile-research-hub \.v3-profile-research-chapter/);
  assert.match(profileRefinement, /\.v3-profile-page \.v3-profile-research-hub \.v3-profile-account-section/);
  assert.doesNotMatch(v3Pages, /login|password|kycUpload/i);
  assert.doesNotMatch(v3Product, /Global high-liquidity|Regulated-market|Derivatives-focused/);
});

test("venue FAQ stays neutral until a dated source review is present", () => {
  assert.match(venueFaqSection, /if \(!db\.faqSourceReviewedAt\)/);
  assert.match(venueFaqSection, /current official requirements/);
  assert.match(venueFaqSection, /never share seed phrases or 2FA codes/);
  assert.match(v3Pages, /decisionSourceReviewedAt/);
});

test("factbook keeps the rate matrix visible while lower-priority research sections are responsive disclosures", () => {
  assert.match(factbookPage, /factbook-section-disclosure/);
  assert.match(factbookPage, /factbook-por-body/);
  assert.match(factbookPage, /expandedFactbookSections/);
  assert.match(factbookCss, /factbook-section-disclosure:not\(\.is-open\).*factbook-section-disclosure__body/);
  assert.match(factbookCss, /factbook-section-disclosure\.is-open.*factbook-section-disclosure__body/);
});

test("factbook keeps the high-intent fee tiers visible while making the full matrix expandable on mobile", () => {
  assert.match(factbookPage, /showAllFeeTiers/);
  assert.match(factbookPage, /factbook-fee-tiers-toggle/);
  assert.match(factbookPage, /factbook-fee-tier-row/);
  assert.match(factbookCss, /factbook-table-wrapper:not\(\.is-expanded\).*factbook-fee-tier-row:nth-child\(n \+ 5\)/);
});

test("factbook keeps the mobile source header compact without removing the decision card", () => {
  assert.match(factbookCss, /@media \(max-width: 560px\)/);
  assert.match(factbookCss, /factbook-audit-box__text/);
  assert.match(factbookCss, /factbook-answer-card/);
  assert.match(factbookPage, /factbook-direct-answer/);
});

test("factbook decision and activation paths expose bounded growth attribution", () => {
  assert.match(factbookPage, /data-growth-placement="factbook-direct-answer"/);
  assert.match(factbookPage, /data-growth-placement="factbook-official-domain"/);
  assert.match(factbookPage, /data-growth-placement="factbook-switch"/);
  assert.match(factbookPage, /data-growth-placement="factbook-activation"/);
});

test("3.0 locale links preserve state fragments while default anchors stay canonical", () => {
  assert.match(app, /import \{ localizedHref, localizedLanguageHref, parsePublicRoute \} from "\.\/data\/locale-routing\.js"/);
  assert.match(app, /const withLocale = \(locale, href\) => localizedHref\(href, \{ locale \}\)/);
  assert.match(v3Pages, /href=\{localizedHref\(href, \{ locale \}\)\}/);
  assert.doesNotMatch(venueYellowPages, /href=\{`\/exchanges[^`]*\$\{contextSearch\}/);
  assert.match(venueYellowPages, /localizedHref\(`\/exchanges\/\$\{venue\.slug\}\?\$\{contextSearch\}`/);
});

// Class a: validated account/funding context reaches CTAs and children; raw values remain inputs only.
test("rates route preserves regional CTA context into the benchmark and calculator", () => {
  assert.equal((app.match(/pathname === \"\/rates\"/g) || []).length, 1);
  assert.match(app, /name: "rateTerminal", \.\.\.contextParams\(\)/);
  assert.match(app, /<FeeBenchmarkTerminal locale=\{locale\} market=\{route\.market\} product=\{route\.product\} accountStage=\{route\.accountStage\} funding=\{route\.funding\} \/>/);
  assert.match(feeBenchmarkTerminal, /regionalVenueCta\(slug, locale, market, product, \{ accountStage: safeAccountStage, funding: safeFunding \}\)/);
  assert.match(costDecision, /regionalVenueCta\(slug, locale, regionMarket, product, \{ accountStage, funding \}\)/);
  // Owner 2026-10-10: the URL product still passes through; without one the calculator defaults to perpetuals.
  assert.match(feeBenchmarkTerminal, /<CostDecision locale=\{locale\} regionMarket=\{market\} product=\{productParam \|\| "perpetuals"\} accountStage=\{safeAccountStage\} funding=\{safeFunding\} \/>/);
  assert.match(feeBenchmarkTerminal, /product: productParam, accountStage, funding \}\) \{\n  const product = productParam \|\| "spot";/);
  assert.match(costDecision, /export function CostDecision\(\{locale='en', regionMarket, product='perpetuals', accountStage, funding\}\)/);
  assert.match(costDecision, /useState\(product === 'spot' \? 'spotFee' : 'futuresFee'\)/);
});

// Class d retarget: the checked ledger keeps verified rows visible and groups only fully pending venues.
test("rate benchmark keeps the mobile table progressive without removing full venue access", () => {
  assert.match(feeBenchmarkTerminal, /const checkedRows = rows\.filter\(\(r\) => !isPending\(r\)\)/);
  assert.match(feeBenchmarkTerminal, /const pendingRows = rows\.filter\(isPending\)/);
  assert.match(feeBenchmarkTerminal, /<table className="fee-terminal__table ft-table" id="rate-terminal-table" data-cols=\{colCount\}>/);
  assert.match(feeBenchmarkTerminal, /\{checkedRows\.map\(\(row\) => \{/);
  assert.match(feeBenchmarkTerminal, /<tr className="ft-pending">/);
  assert.match(feeBenchmarkTerminal, /<summary><strong className="ft-pending__count">\{pendingGroup\(pendingRows\.length\)\}<\/strong>/);
  assert.match(feeBenchmarkTerminal, /pendingRows\.map\(\(row\) => \(/);
  assert.match(feeBenchmarkTerminal, /venueLink\(row\)/);
  assert.match(feeBenchmarkTerminal, /ctaLink\(row\)/);
  assert.match(feeBenchmarkTerminalCss, /\.fee-terminal__table-wrapper/);
  assert.match(feeBenchmarkTerminalCss, /\.fee-terminal__unknown-chip/);
  assert.doesNotMatch(feeBenchmarkTerminal, /showAllRows/);
  assert.doesNotMatch(feeBenchmarkTerminal, /rows\.slice\(0, 6\)/);
});

test("rate calculator keeps mobile result cards compact while preserving both handoffs", () => {
  assert.match(costDecision, /data-cta-placement="cost-calculator-eligibility"/);
  assert.match(costDecision, /data-cta-placement="cost-calculator"/);
  assert.match(costDecisionCss, /grid-template-columns:1fr auto/);
  assert.match(costDecisionCss, /grid-column:1\/-1;margin-top:4px/);
});

// Class a: rates forwards sanitized passport fields to the contextual rail.
test("rates and Factbook share a compact contextual decision path", () => {
  assert.match(feeBenchmarkTerminal, /<DecisionPathRail locale=\{locale\} market=\{market\} product=\{product\} accountStage=\{safeAccountStage\} funding=\{safeFunding\} current="rates" \/>/);
  assert.match(factbookPage, /<DecisionPathRail locale=\{locale\} market=\{market\} product=\{product\} current="factbook" \/>/);
  assert.match(decisionPathRail, /currentDecisionContext/);
  assert.match(decisionPathRail, /compareSlugFor\(selectedVenue, selectedShortlist\)/);
  assert.match(decisionPathRail, /decisionHref\(`\/factbook\/\$\{selectedVenue\}#rates`/);
  assert.match(decisionPathRail, /decisionHref\("\/exchanges"/);
  assert.match(decisionPathRail, /decision-rail-\$\{link\.id\}/);
  assert.match(decisionPathRail, /data-growth-decision=\{selectedVenue\}/);
  assert.match(decisionPathRailCss, /@media \(max-width: 640px\)/);
  assert.match(decisionPathRailCss, /grid-template-columns: 1fr/);
  assert.match(decisionPathRailCss, /\.decision-path-rail__link \{[\s\S]*min-height: 44px;/);
  assert.match(v3Css, /\.decision-path-rail__links > \.decision-path-rail__link \{[\s\S]*min-height: 2\.75rem !important;/);
});

test("News and Activities expose the same contextual decision path before long content", () => {
  assert.match(newsListPage, /<DecisionPathRail locale=\{locale\} market=\{market\} product=\{product\} current="news" \/>/);
  assert.match(activityCenterV3, /<DecisionPathRail locale=\{locale\} market=\{market\} product=\{product\} current="activities" \/>/);
  assert.match(newsListPage, /news-page__decision-rail/);
  assert.match(decisionPathRail, /data-cta-kind="research"/);
  assert.match(decisionPathRail, /data-growth-market=\{market\}/);
});

test("decision path rail owns localized labels for every supported locale", () => {
  for (const locale of ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"]) {
    assert.match(decisionPathRail, new RegExp(`(?:[\\\"']?${locale.replace("-", "[-]")}[\\\"']?)\\s*:`));
  }
  assert.match(decisionPathRail, /const t = copy\[locale\] \|\|/);
  assert.doesNotMatch(decisionPathRail, /locale\.startsWith\("zh"\) \? copy\.zh : copy\.en/);
});

test("partner guide keeps the embed builder visible while collapsing repeated value cards on mobile", () => {
  assert.match(partnerEmbedGuide, /guide-values-disclosure/);
  assert.match(partnerEmbedGuide, /showValueDetails/);
  assert.match(partnerEmbedGuide, /guide-values-grid/);
  assert.match(partnerEmbedGuideCss, /\.guide-values-disclosure > summary/);
  assert.match(partnerEmbedGuideCss, /@media \(max-width: 640px\)/);
  assert.match(partnerEmbedGuide, /guide-builder-section/);
  assert.match(partnerEmbedGuide, /guide-telegram-cta/);
});

test("international market preview routes keep the shared research path", () => {
  assert.match(app, /mx\|tw\|id\|vn\|hk\|eu\|uk\|us\|jp\|kr\|sg\|int/);
  assert.match(app, /regionalPreview/);
  assert.match(feeBenchmarkTerminal, /Pending source review/);
  assert.match(regionalPreview, /NextDecisionBridge/);
  assert.match(regionalPreview, /placement="regional-preview-next-decision-bridge"/);
  assert.match(regionalPreview, /decision=\{`regional_\$\{selectedMarket\}`\}/);
  assert.match(regionalPreview, /profileSlug=\{bridgeCandidate\?\.slug\}/);
  assert.match(regionalPreview, /compareHref=\{compareHref\}/);
  assert.match(regionalPreview, /data-cta-kind="research" data-cta-placement="regional-account-stage"/);
  assert.match(regionalPreview, /shortlist\.telegramHref/);
  assert.match(regionalPreview, /regionalToolHref/);
  assert.match(regionalPreview, /data-cta-kind="source" data-cta-placement="regional-official-source"/);
  assert.match(regionalPreview, /rel="noopener noreferrer"/);
  assert.match(regionalPreview, /regional-market-preview__questions-toggle/);
  assert.match(regionalPreview, /data-aeo-question=\{question\}/);
  assert.match(venueYellowPagesSource, /data-growth-placement="directory-card-eligibility"/);
  assert.match(venueYellowPagesSource, /data-cta-placement="directory-card"/);
  assert.match(venueYellowPagesSource, /data-growth-placement=\{index === 0 \? "regional-directory-primary" : "regional-directory-alternative"\}/);
  assert.match(venueYellowPagesSource, /data-growth-placement="directory-card-detail"/);
  assert.match(registrationCard, /data-registration-context/);
  assert.match(registrationCardCss, /scroll-margin-top/);
});

test("homepage CTA hierarchy keeps registration as the primary selected-platform action", () => {
  assert.match(leanHero, /en:\s*"Open Partner Signup Link"/);
  assert.match(leanHero, /ja:\s*"提携登録リンクを開く"/);
  assert.match(leanHero, /openDetail:\s*"Review Account Conditions"/);
  assert.match(leanHero, /openDetail:\s*"口座条件を見る"/);
  assert.match(leanHero, /data-r37-cro="home-partner-route-nudge"/);
  assert.match(leanHero, /<RegistrationCard[\s\S]+?venueSlug=\{selected\.slug\}[\s\S]+?compact/);
  assert.match(leanHero, /market=\{contextMarket\}[\s\S]+?product=\{contextProduct\}[\s\S]+?accountStage=\{contextAccountStage\}[\s\S]+?funding=\{contextFunding\}/);
});

test("directory card registration labels clarify partner signup without changing link ownership", () => {
  assert.match(venueYellowPages, /openSignup:\s*"Open Partner Signup ↗"/);
  assert.match(venueYellowPages, /openSignup:\s*"提携登録リンクを開く ↗"/);
  assert.match(venueYellowPages, /href=\{registrationUrl\}/);
  assert.match(venueYellowPages, /data-cta-placement="directory-card"/);
  assert.match(venueYellowPages, /rel="sponsored noopener noreferrer"/);
});

test("crypto sentiment remains source-bound and collapses instead of showing an unavailable homepage block", () => {
  assert.match(cryptoSentiment, /window\.fetch\("\/api\/v1\/market\/crypto-sentiment"/);
  assert.match(cryptoSentiment, /copy\.sentiment\.title/);
  assert.match(cryptoSentiment, /copy\.sentiment\.context/);
  assert.match(cryptoSentiment, /copy\.sentiment\.source/);
  assert.match(cryptoSentiment, /aria-label=\{`\$\{copy\.sentiment\.source\}: Alternative\.me Crypto Fear & Greed Index`\}/);
  assert.match(cryptoSentiment, /translate="no">Alternative\.me<\/span>/);
  assert.match(cryptoSentiment, /lang="en" dir="ltr" translate="no"/);
  assert.match(cryptoSentiment, /import "\.\/crypto-sentiment\.css"/);
  assert.match(cryptoSentimentCss, /\.crypto-sentiment__eyebrow \{[^}]*color: var\(--blue-text\);/s);
  assert.doesNotMatch(releaseVisualGates, /\.crypto-sentiment\s*\{/);
  assert.doesNotMatch(cryptoSentimentCss, /max-width:\s*420px/);
  for (const locale of ["en", "zh-Hans", "ja", "ar"]) assert.match(v2Copy, new RegExp(`sentimentCopy[\\s\\S]+?${locale.replace("-", "\\-")}`));
  assert.match(cryptoSentiment, /import \{ readableCryptoSentiment as readable \} from "\.\.\/\.\.\/data\/market-intelligence-view\.js"/);
  assert.match(cryptoSentiment, /if \(!live\) return null/);
  assert.doesNotMatch(cryptoSentiment, /api\.alternative\.me|coinmarketcap|coingecko/);
});

test("platform summaries remain readable instead of being cut to a mobile line budget", () => {
  const summaryRules = [...v3LayoutStability.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selectors]) => selectors.split(",").some((selector) => selector.trim() === ".venue-card__route strong"));
  for (const [, , declarations] of summaryRules) {
    assert.doesNotMatch(declarations, /overflow:\s*hidden|-webkit-line-clamp:\s*\d/);
  }
});

test("command finder has keyboard navigation, unique result IDs, and honest recovery copy", () => {
  for (const key of ["ArrowDown", "ArrowUp", "Enter", "Escape"]) assert.match(finder, new RegExp(`"${key}"`));
  assert.match(finder, /role="combobox"/);
  assert.match(finder, /role="listbox"/);
  assert.match(finder, /copy\.finder\.empty/);
  assert.match(finder, /useId\(\)/);
  assert.doesNotMatch(finder, /finderFilters|setSaved|filtersSaved/);
});

test("command finder searches venue catalog destinations including OKX", () => {
  assert.match(finder, /finderSafeContext\(window\.location\.search, \{ locale: copy\.locale \}\)/);
  assert.match(finder, /buildFinderResults\(\{ copy, command, locale: copy\.locale, context: finderContext \}\)/);
  assert.match(finder, /searchFinderResults\(allResults, query, copy\.locale\)/);
  assert.match(finder, /finderTrackPayload\(result, finderContext\)/);
  assert.match(finder, /window\.location\.assign\(destination\)/);
  assert.match(commandData, /\["okx", "OKX", "CEX", "www\.okx\.com"\]/);
  assert.match(venueExplorer, /href=\{withLocale\(locale, `\/exchanges\/\$\{venue\.slug\}`\)\}/);
});

test("feature opportunity fails closed and labels neutral preview data", () => {
  assert.match(featured, /copy\.listings\.pending/);
  assert.match(featured, /copy\.opportunity\.noOffer/);
  assert.doesNotMatch(featured, /<a\s+className="button-primary"|href=|opportunity_cta_click|partner_link_click/);
  assert.match(featured, /copy\.opportunity\.alternatives/);
  assert.match(marketData, /copy\.opportunity\.disclosure/);
});

test("fixture and unavailable opportunities are absent from the homepage", () => {
  assert.doesNotMatch(app, /<FeaturedOpportunity/);
  assert.doesNotMatch(app, /function ActiveOpportunities|opportunity-ledger/);
  assert.match(featured, /model\.preview \|\| featured\.state !== "Active"/);
});

test("compare and market routes have working stateful controls", () => {
  assert.match(compare, /selected, onSelectionChange, onAdjustSelection/);
  assert.match(compare, /useState\(false\)/);
  assert.match(compare, /decision-workbench/);
  assert.match(compare, /comparison-drawer/);
  assert.match(compare, /event\.key === "Escape"/);
  assert.doesNotMatch(compare, /copy\.assetCapabilities\.coverage/);
  assert.doesNotMatch(compare, /feeSignal|regionAvailability|currentOffer/);
  assert.match(compare, /compare_cta_click/);
  assert.match(v3Pages, /v3-versus-sources-disclosure/);
  assert.match(v3Pages, /Official References & Sources/);
  assert.match(fintechPremiumCss, /v3-versus-sources-disclosure:not\(\[open\]\)/);
  assert.match(compare, /is-different/);
  assert.match(venueExplorer, /is-selected-for-compare/);
  assert.match(venueExplorer, /aria-pressed=\{chosen\}/);
  assert.match(venueExplorer, /selected\.length < 3/);
  assert.match(routes, /useState\("equity"\)/);
  assert.match(routes, /tradfi_open/);
  assert.match(routes, /role="tablist"/);
});

test("deep comparison versus cards use localized labels and CTA copy", () => {
  const versusStatsBlock = v3Pages.match(/<div className="v3-versus-side__stats">[\s\S]*?<\/details>/)?.[0] ?? "";
  assert.match(versusStatsBlock, /compareLabels\.spotFee/);
  assert.match(versusStatsBlock, /compareLabels\.por/);
  assert.match(versusStatsBlock, /compareLabels\.kyc/);
  assert.doesNotMatch(versusStatsBlock, />Spot Fee<|>Reserves<|>KYC</);
  const versusCtaBlock = v3Pages.match(/className="v3-versus-btn"[\s\S]*?<\/a>/)?.[0] ?? "";
  assert.match(versusCtaBlock, /detailCtaLabel\(locale, \{ direct: false, hasReferral: pAccess\.hasReferral \}\)/);
  assert.doesNotMatch(versusCtaBlock, /Verify regional eligibility first/);
});

test("deep comparison decision guide and FAQ use the active pair locale copy", () => {
  const decisionGuideBlock = v3Pages.match(/export function CompareDecisionGuide[\s\S]*?export function CompareFaqSection/)?.[0] ?? "";
  assert.match(decisionGuideBlock, /detailCtaLabel\(locale, \{ direct: false, hasReferral: accessA\.hasReferral \}\)/);
  assert.match(decisionGuideBlock, /detailCtaLabel\(locale, \{ direct: false, hasReferral: accessB\.hasReferral \}\)/);
  assert.doesNotMatch(decisionGuideBlock, /Verify regional eligibility first|Join \$\{pA\.name\}|Join \$\{pB\.name\}/);

  assert.match(v3Pages, /import \{ compareFaqBadge, compareFaqEntries, compareFaqText, compareStickyAria \} from "\.\.\/\.\.\/data\/compare-faq-locales\.js"/);
  assert.match(v3Pages, /const localizedFaqs = compareFaqEntries\(locale, \{ nameA, nameB \}\)/);
  assert.match(v3Pages, /\{compareFaqText\(locale, "title", \{ nameA, nameB \}\)\}/);
  assert.match(compareFaqLocales, /title: "\{nameA\} vs \{nameB\}: fees, product access and account checks"/);
  assert.match(compareFaqLocales, /title: "\{nameA\} vs \{nameB\}: 手数料、商品、口座条件"/);
  assert.doesNotMatch(compareFaqLocales, /Binance vs OKX/);
});

test("venue explorer now reads like a card-based directory instead of a plain table", () => {
  assert.match(venueExplorer, /venue-grid/);
  assert.match(venueExplorer, /venue-card/);
  assert.match(featured, /venues = \[\]/);
  assert.match(venueExplorer, /useState\("ALL"\)/);
  assert.match(venueExplorer, /filter === "ALL" \|\| venue\.category === filter/);
  assert.match(venueExplorer, /translate="no" lang="en"/);
  assert.match(venueExplorer, /venue-card__decision/);
  assert.match(venueExplorer, /venue-card__facts/);
  assert.match(venueExplorer, /venue-card__route/);
  assert.doesNotMatch(compare, /copy\.assetCapabilities\.coverage/);
});

test("directory keeps the mobile first decision set short while preserving explicit expansion", () => {
  assert.match(venueYellowPages, /yellow-pages__expand-count--mobile/);
  assert.match(venueYellowPages, /Math\.max\(filteredVenues\.length - 3, 0\)/);
  assert.match(venueYellowPagesCss, /yellow-pages__grid--collapsed \.yellow-card:nth-child\(n \+ 4\)/);
  assert.match(venueYellowPagesCss, /yellow-pages__expand-count--desktop\s*\{\s*display: none;/);
  assert.match(venueYellowPagesCss, /yellow-pages__expand-count--mobile\s*\{\s*display: inline;/);
});

test("full exchange directory uses compact expandable rows without changing homepage compact cards", () => {
  assert.match(venueYellowPages, /const compactDirectory = !compact/);
  assert.match(venueYellowPages, /yellow-pages__grid--directory/);
  assert.match(venueYellowPages, /yellow-card--directory/);
  assert.match(venueYellowPages, /\(expandedVenueDetails \|\| \[\]\)\.includes\(venue\.slug\)/);
  assert.match(venueYellowPages, /aria-controls=\{`yellow-card-details-\$\{venue\.slug\}`\}/);
  assert.match(venueYellowPages, /className="yellow-card__btn-toggle"/);
  assert.match(venueYellowPages, /className="yellow-card__directory-details"/);
  assert.match(venueYellowPages, /publicCtaForVenue\(venue\.slug, locale, market\)/);
  assert.match(venueYellowPages, /href=\{registrationUrl\}/);
  assert.match(venueYellowPages, /data-cta-placement="directory-card"/);
  assert.match(venueYellowPages, /data-cta-placement="directory-compare-select"/);
  assert.match(venueYellowPagesCss, /\.yellow-pages__grid--directory \{[\s\S]*grid-template-columns: 1fr;/);
  assert.doesNotMatch(venueYellowPagesCss, /grid-template-columns:\s*minmax\(0, 1\.15fr\) minmax\(23rem, 0\.85fr\);/);
  assert.match(venueYellowPagesCss, /\.yellow-card--directory \{[\s\S]*grid-template-columns:\s*minmax\(0, 1\.15fr\) minmax\(0, 0\.85fr\);/);
  assert.doesNotMatch(venueYellowPagesCss, /grid-template-columns:\s*minmax\(7rem, 0\.8fr\) minmax\(8rem, 1fr\) minmax\(9rem, 1\.1fr\) minmax\(7rem, 0\.8fr\);/);
  assert.match(venueYellowPagesCss, /\.yellow-card--directory \.yellow-card__actions \{[\s\S]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\);/);
  assert.match(venueYellowPagesCss, /\.yellow-card__btn-toggle \{[\s\S]*min-block-size: 44px;/);
  assert.match(venueYellowPagesCss, /\.yellow-card__directory-details\[hidden\] \{[\s\S]*display: none;/);
  assert.match(venueYellowPagesCss, /@media \(max-width: 680px\)[\s\S]*\.yellow-card--directory \.yellow-card__actions \{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(venueYellowPagesCss, /\.yellow-pages__grid--compact \.yellow-card:nth-child\(n \+ 7\)/);
  assert.match(venueYellowPagesCss, /\.yellow-pages__grid--compact \.yellow-card__facts-disclosure/);
});

test("mobile long pages defer offscreen repeated modules without removing content", () => {
  assert.match(venueYellowPagesCss, /\.yellow-card \{[\s\S]*content-visibility:\s*auto;[\s\S]*contain-intrinsic-size:\s*0 320px;/);
  assert.match(venueYellowPagesCss, /@media \(max-width: 680px\)[\s\S]*\.yellow-card \{[\s\S]*contain-intrinsic-size:\s*0 220px;/);
  assert.match(newsListPageCss, /\.news-research-index \{[\s\S]*content-visibility:\s*auto;[\s\S]*contain-intrinsic-size:\s*0 220px;/);
  assert.match(newsListPageCss, /@media \(max-width: 640px\)[\s\S]*\.news-hero \{[\s\S]*margin-bottom:\s*1rem;/);
  assert.match(newsDetailCss, /\.news-detail__partners-box \{[\s\S]*content-visibility:\s*auto;[\s\S]*contain-intrinsic-size:\s*0 260px;/);
  assert.match(newsDetailCss, /\.news-detail__article-disclosure,[\s\S]*\.news-detail__decision-box \{[\s\S]*content-visibility:\s*auto;/);
  assert.match(newsDetailCss, /\.news-detail__article-disclosure \{[\s\S]*contain-intrinsic-size:\s*0 680px;/);
  assert.match(v3Css, /\.v3-fee-matrix-section \{[\s\S]*content-visibility:\s*auto;[\s\S]*contain-intrinsic-size:\s*0 520px;/);
  assert.match(v3Css, /\.v3-por-section \{[\s\S]*content-visibility:\s*auto;[\s\S]*contain-intrinsic-size:\s*0 480px;/);
  assert.match(v3Css, /\.v3-security-section \{[\s\S]*content-visibility:\s*auto;[\s\S]*contain-intrinsic-size:\s*0 460px;/);
  assert.match(v3Css, /\.v3-tg-monitor-section \{[\s\S]*content-visibility:\s*auto;[\s\S]*contain-intrinsic-size:\s*0 240px;/);
  assert.match(v3Css, /\.v3-similar-disclosure \{[\s\S]*content-visibility:\s*auto;[\s\S]*contain-intrinsic-size:\s*0 260px;/);
  assert.doesNotMatch(venueYellowPages, /partnerRegistry\s*=|registrationUrl\s*=\s*["']https?:/);
});

test("directory search narrows platform choices without changing the bounded CTA cards", () => {
  assert.match(venueYellowPages, /id="yellow-pages-search"/);
  assert.match(venueYellowPages, /searchQuery\.trim\(\)\.toLocaleLowerCase/);
  assert.match(venueYellowPages, /getLocalizedVenueName\(venue, locale\)/);
  assert.match(venueYellowPages, /yellow-pages__search-clear/);
  assert.match(venueYellowPagesCss, /\.yellow-pages__search-control input/);
});

// Class d retarget: card selection feeds the CompareAnyPicker and canonical /compare handoff; the old tray is disabled.
test("directory cards can form a bounded two-platform comparison handoff", async () => {
  assert.match(venueYellowPages, /compareSelection/);
  assert.match(venueYellowPages, /import \{ CompareAnyPicker \} from "\.\.\/compare\/CompareAnyPicker\.jsx"/);
  assert.match(venueYellowPages, /comparePathFor\(compareSelection\)\.path/);
  assert.match(venueYellowPages, /<CompareAnyPicker locale=\{locale\} venues=\{venues\} initial=\{compareSelection\} placement="exchange-directory" compact \/>/);
  assert.match(venueYellowPages, /data-cta-placement="directory-compare-select"/);
  assert.match(venueYellowPages, /aria-pressed=\{compareSelection\.includes\(venue\.slug\)\}/);
  assert.match(venueYellowPages, /disabled=\{!compareSelection\.includes\(venue\.slug\) && compareSelection\.length >= 2\}/);
  assert.match(venueYellowPages, /onClick=\{\(\) => toggleCompareSelection\(venue\.slug\)\}/);
  assert.match(compareAnyPicker, /method="get"/);
  assert.match(compareAnyPicker, /action=\{action\}/);
  assert.match(compareAnyPicker, /window\.location\.assign\(localizedHref\(canonicalComparePath\(\[a, b\]\), \{ locale \}\)\)/);
  assert.match(v3Pages, /<CompareAnyPicker locale=\{locale\} venues=\{venues\} placement="compare-hub" \/>/);
  assert.match(venueYellowPagesCss, /\.yellow-card__btn-compare/);
  assert.match(compareAnyPickerCss, /\.compare-any__field select[\s\S]*min-height: 44px/);
  assert.match(venueYellowPages, /\{false && !compact && compareSelection\.length > 0 && \(/);
  assert.match(venueYellowPagesCss, /@media \(max-width: 480px\)[\s\S]*\.yellow-card__actions[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(factbookCss, /factbook-section-disclosure:not\(\.is-open\)[\s\S]*padding: 0\.9rem 1rem/);
  assert.match(factbookCss, /factbook-section-disclosure:not\(\.is-open\) \.factbook-section__sub[\s\S]*-webkit-line-clamp: 2/);
  assert.match(regionalPreviewCss, /regional-market-preview__gate article[\s\S]*gap: 0\.2rem[\s\S]*padding: 0\.6rem/);
  assert.match(regionalPreviewCss, /regional-market-preview__gate small[\s\S]*text-overflow: ellipsis[\s\S]*white-space: nowrap/);
  const [{ JSDOM }, React, { createRoot }, { createServer }] = await Promise.all([
    import("jsdom"),
    import("react"),
    import("react-dom/client"),
    import("vite"),
  ]);
  const dom = new JSDOM("<!doctype html><html><body><div id=\"root\"></div></body></html>", { url: "https://nexualpha.com/exchanges" });
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const previousHTMLElement = globalThis.HTMLElement;
  const previousHTMLSelectElement = globalThis.HTMLSelectElement;
  const previousHTMLButtonElement = globalThis.HTMLButtonElement;
  const previousEvent = globalThis.Event;
  const previousActEnv = globalThis.IS_REACT_ACT_ENVIRONMENT;
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.HTMLSelectElement = dom.window.HTMLSelectElement;
  globalThis.HTMLButtonElement = dom.window.HTMLButtonElement;
  globalThis.Event = dom.window.Event;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
  let root;
  try {
    const [{ VenueYellowPages }, { venueDatabase }] = await Promise.all([
      server.ssrLoadModule("/src/components/v3/VenueYellowPages.jsx"),
      server.ssrLoadModule("/src/data/venue-database.js"),
    ]);
    root = createRoot(document.getElementById("root"));
    await React.act(async () => {
      root.render(React.createElement(VenueYellowPages, { locale: "en", venues: Object.values(venueDatabase).slice(0, 8), compact: false }));
    });
    const buttons = [...document.querySelectorAll('[data-cta-placement="directory-compare-select"]')];
    assert.ok(buttons.length >= 2, "directory must render at least two compare-select buttons");
    const clickedSlugs = buttons.slice(0, 2).map((button) => button.getAttribute("data-cta-platform"));
    await React.act(async () => buttons[0].dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })));
    await React.act(async () => buttons[1].dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })));
    const selectedValues = [...document.querySelectorAll(".compare-any select")].map((select) => select.value).filter(Boolean);
    assert.deepEqual(selectedValues, clickedSlugs, "card compare selections must populate CompareAnyPicker before opening the canonical comparison");
  } finally {
    if (root) {
      await React.act(async () => root.unmount());
    }
    await server.close();
    dom.window.close();
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
    if (previousNavigator) Object.defineProperty(globalThis, "navigator", previousNavigator);
    else delete globalThis.navigator;
    globalThis.HTMLElement = previousHTMLElement;
    globalThis.HTMLSelectElement = previousHTMLSelectElement;
    globalThis.HTMLButtonElement = previousHTMLButtonElement;
    globalThis.Event = previousEvent;
    globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnv;
  }
});

test("directory URL state restores only shareable research controls", () => {
  assert.match(venueYellowPagesState, /YELLOW_PAGES_URL_KEYS/);
  for (const key of ["category", "filters", "sort", "query", "selection", "account_stage"]) {
    assert.match(venueYellowPagesState, new RegExp(`["']${key}["']`));
  }
  assert.match(venueYellowPages, /restoreYellowPagesStateFromUrl\(window\.location\.search, \{ venues, defaultCategory: defaultDirectoryCategory\(\{ market, product \}\) \}\)/);
  assert.match(venueYellowPages, /writeYellowPagesStateToUrl\(window\.location\.href, \{/);
  assert.match(venueYellowPages, /window\.history\.replaceState\(\{ \.\.\.\(window\.history\.state \|\| \{\}\), nexuYellowPages: true \}/);
  assert.match(venueYellowPages, /window\.addEventListener\("popstate", onPop\)/);
  assert.match(venueYellowPagesState, /new Set\(venues\.map\(\(venue\) => venue\.slug\)\)/);
  assert.match(venueYellowPagesState, /slice\(0, 2\)/);
  assert.match(venueYellowPagesState, /ACCOUNT_STAGE_VALUES/);
  assert.match(venueYellowPages, /effectiveAccountStage/);
  assert.doesNotMatch(venueYellowPages, /set\(["']registrationUrl["']/);
  assert.doesNotMatch(venueYellowPages, /set\(["']cta["']/);
});

test("venue identity consumes recorded local assets before the neutral fallback", () => {
  assert.match(brandMark, /brand\?\.preferredSquare/);
  assert.match(brandMark, /<img className=/);
  assert.match(brandMark, /src=\{src\}/);
  assert.match(brandMark, /width=\{compact \? 28 : 40\}/);
  assert.match(brandMark, /height=\{compact \? 28 : 40\}/);
  assert.match(brandMark, /data-brand-fallback/);
  assert.match(releaseVisualGates, /\.v2-brand \{/);
  assert.match(releaseVisualGates, /background: transparent/);
});

test("neutral venue directory remains visible across locales without a capability claim", () => {
  assert.match(marketData, /export const neutralVenueCatalog/);
  for (const slug of ["binance", "bybit", "okx", "bitget", "backpack", "uniswap", "hyperliquid", "dydx", "drift"]) assert.match(marketData, new RegExp(`"${slug}"`));
  assert.match(marketData, /venueCatalog: mergeVenueCatalog\(venueCatalog\)/);
  assert.match(marketData, /"binance", "Binance", "CEX", "www\.binance\.com"/);
  assert.match(marketData, /"gate-io", "Gate\.io", "CEX", "www\.gate\.com"/);
  assert.match(marketData, /officialDomain, availability: "unavailable"/);
  assert.match(venueExplorer, /const filterIds = \["ALL", "CEX", "DEX", "Perp DEX"\]/);
  assert.doesNotMatch(venueExplorer, /assetCapabilities\.some/);
});

test("official update surface is traceable and closed when nothing is approved", () => {
  assert.match(officialUpdates, /visibleOfficialUpdates\(updates\)/);
  assert.match(officialUpdates, /role="dialog"/);
  assert.match(officialUpdates, /event\.key === "Escape"/);
  assert.match(officialUpdates, /update\.discoveredAt/);
  assert.match(officialUpdates, /copy\.listings\.verificationPending/);
  assert.match(officialUpdates, /officialSource\.url/);
  assert.doesNotMatch(officialUpdates, /partner_link_click|opportunity_cta_click|affiliate|referral|reviewerId|audit|contentFingerprint|destinationSecretRef/);
});

test("methodology remains available in code without occupying the conversion homepage", () => {
  assert.doesNotMatch(app, /<Methodology|href="#methodology"/);
  assert.match(methodology, /copy\.common\.verifiedSource/);
  assert.match(methodology, /copy\.listings\.verificationPending/);
  assert.match(methodology, /copy\.listings\.verificationPending \|\| copy\.common\.sourceRequired/);
  assert.match(methodology, /copy\.opportunity\.noOffer/);
  assert.doesNotMatch(methodology, /href=|partner_link_click|opportunity_cta_click|affiliate|referral/);
});

// Class b: v5/v6 home classes were added to the same locale-keyed main landmark.
test("locale state and the fixed default market cover the application root without a region selector", () => {
  assert.match(app, /<main key=\{`locale-\$\{locale\}`\} className="v2-page home-refinement v5 v6" id="top" dir=\{getTextDirection\(locale\)\}>/);
  assert.match(app, /document\.documentElement\.dir = getTextDirection\(locale\)/);
  assert.match(app, /supportedLocales\.map\(\(code\) => \(\{ code, label: localeManifest\[code\]\.language \}\)\)\.filter\(\(option\) => !brazil \|\| option\.code === "pt-BR"\)/);
  assert.match(app, /const region = "Global"/);
  assert.doesNotMatch(app, /aria-label=\{copy\.ui\.marketRegion\}/);
  assert.match(app, /const readLocale = \(initialUrl\) =>/);
  assert.match(app, /sourceUrl\.searchParams\.get\("locale"\)/);
  assert.match(app, /getBrazilPage\(publicRoute\.contentPathname \|\| sourceUrl\.pathname\)\) return "pt-BR"/);
  assert.match(app, /window\.history\.replaceState/);
  assert.match(app, /setParaglideLocale\(locale, \{ reload: false \}\)/);
  assert.match(app, /popstate/);
  assert.match(app, /initialCompareSelection/);
  assert.match(app, /useState\(\(\) => initialCompareSelection \|\| readComparison\(\)\)/);
  assert.match(app, /selected=\{compareSelection\}/);
  assert.match(app, /window\.sessionStorage\.setItem\("nexualpha-comparison"/);
  assert.match(app, /<LanguageMenu locale=\{locale\} options=\{localeOptions\} label=\{copy\.ui\.language\} disabled=\{brazil\} onSelect=\{onLocaleChange\} inline \/>/);
  assert.doesNotMatch(app, /See what is live\. Compare the terms\. Choose the venue\./);
});

test("hero note cannot become a vertical spacer and detail content is not duplicated", () => {
  assert.match(v3LayoutStability, /\.hero-copy > \.hero-disclosure\s*\{\s*flex: none;/);
  const detail = venueDetailSource;
  assert.doesNotMatch(detail, /<RegistrationActionMap|<SnapshotStrip|<RouteReadiness/);
  assert.match(detail, /<OutboundHandoff/);
  assert.equal((detail.match(/id="registration-path"/g) || []).length, 0);
  assert.match(registrationCard, /id="registration-path"/);
  assert.match(detail, /<SourceList/);
});

test("dark-market tokens, responsive grid, and reduced-motion handling are explicit", () => {
  for (const token of ["#070a0e", "#0c1219", "#f4f1ea", "#315ccf", "#22c88a", "#e65b5b"]) assert.match(tokens, new RegExp(token, "i"));
  assert.match(css, /@media\(max-width:780px\)/);
  assert.match(tokens, /prefers-reduced-motion:reduce/);
  assert.doesNotMatch(css, /border-radius:2[4-9]px/);
});

test("component-state catalog is isolated to a development-only route", () => {
  assert.match(app, /import\.meta\.env\.DEV && typeof window !== "undefined" && window\.location\.pathname === "\/dev\/design-system"/);
  assert.match(app, /<DesignSystem \/>/);
});

test("local interaction notifications do not write a third-party analytics queue", () => {
  for (const event of ["hero_search_focus", "compare_add_venue", "listing_open", "tradfi_open", "region_restricted", "alternative_click"]) assert.match(commandData, new RegExp(`"${event}"`));
  assert.doesNotMatch(commandData, /window\.dataLayer|opportunity_cta_click|partner_link_click/);
  assert.match(commandData, /window\.dispatchEvent\(new CustomEvent\("pilot01:analytics"/);
  assert.match(commandData, /pilot01:analytics/);
});

test("market rail rotates at a readable cadence, pauses, drags, and respects reduced motion", () => {
  assert.match(rail, /6500/);
  assert.match(rail, /prefers-reduced-motion: reduce/);
  assert.match(rail, /onPointerDown=\{startDrag\}/);
  assert.match(rail, /onMouseEnter=\{\(\) => setPaused\(true\)\}/);
  assert.match(rail, /onFocus=\{\(\) => setPaused\(true\)\}/);
});

test("content visibility is not gated by a viewport animation threshold", () => {
  assert.doesNotMatch(app, /IntersectionObserver|classList\.add\("v2-reveal"/);
  assert.match(app, /prefers-reduced-motion: reduce/);
  assert.match(rail, /prefers-reduced-motion: reduce/);
  assert.match(rail, /window\.setInterval/);
  assert.match(refinement, /v2-reveal/);
});

test("V2 copy exposes locale-aware compact terms for every selector locale", () => {
  for (const locale of ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"]) {
    assert.match(v2Copy, new RegExp(`"?${locale.replace("-", "\\-")}"?: \\[`));
  }
});

// Class d retarget: venue registration prep now lives in visible account sections, while compare pages keep locked handoffs.
test("V3 adds first-class conversion routes without exchange impersonation", () => {
  assert.match(app, /const venueMatch = pathname\.match/);
  assert.match(app, /const compareMatch = pathname\.match/);
  assert.match(app, /\/exchanges/);
  assert.match(app, /\/compare/);
  assert.match(app, /pathname === "\/activities"/);
  assert.match(app, /route\.name === "activity"/);
  assert.match(app, /<VenueDetailPage/);
  assert.match(app, /<CompareDeepPage/);
  assert.match(app, /<ActivityCenterPage/);
  assert.match(app, /<ActivityDetailPage/);
  assert.doesNotMatch(app, /<ConversionFunnel/);
  assert.match(v3Pages, /<ResearchPanel slug=\{profile\.slug\} locale=\{locale\}/);
  assert.match(v3Pages, /<ResearchComparison profiles=\{profiles\} locale=\{locale\}/);
  assert.match(venueExplorer, /href=\{withLocale\(locale, `\/exchanges\/\$\{venue\.slug\}`\)\}/);
  assert.match(compare, /comparisonHref/);
  assert.match(v3Pages, /text\.registrationLocked/);
  assert.match(v3Data, /Open official registration route|查看官方注册入口/);
  assert.match(v3Pages, /v3-decision-brief/);
  assert.match(venueResearch, /v3-registration-notes__body/);
  assert.match(venueResearch, /v3-profile-account-section v3-profile-account-cost/);
  assert.match(venueResearch, /v3-profile-account-section v3-profile-account-decision/);
  assert.match(venuePage, /#registration-path/);
  assert.match(venuePage, /#registration-checklist/);
  assert.match(v3Data, /Review pre-registration checklist/);
  assert.match(profileRefinement, /\.v3-profile-page \.v3-profile-research-hub \.v3-profile-account-section/);
  assert.match(v3Data, /NexuAlpha 3\.0/);
  assert.match(v3Data, /not an exchange website|不是交易所官网/);
  assert.match(siteData, /officialDomain: venue\.officialDomains\[0\] \?\? ""/);
  assert.match(v3Data, /sourceHubs/);
  assert.match(v3Data, /https:\/\/www\.binance\.com\/en\/support\/announcement/);
  assert.doesNotMatch(v3Data, /bonus guaranteed|guaranteed/i);
  assert.match(v3Pages, /data-cta-kind=\{/);
  assert.match(v3Pages, /"registration"/);
  assert.doesNotMatch(v3Pages, /connect wallet|log in to .*exchange|sign up on NexuAlpha/i);
  assert.match(v3Css, /v3-page-hero/);
});

test("venue directory locale copy uses directory semantics and registration-link labels", () => {
  const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"];
  assert.doesNotMatch(venueYellowPages, /sectionTitle:\s*text\.productFamily/);
  assert.doesNotMatch(venueYellowPages, /detailBody\?\.\("NexuAlpha"/);
  assert.doesNotMatch(venueYellowPages, /openSignup:\s*text\.registrationPrepCta/);
  assert.match(venueYellowPages, /暗号資産プラットフォームディレクトリ/);
  assert.match(venueYellowPages, /提携登録リンクを開く ↗/);
  assert.doesNotMatch(venueYellowPages, /openSignup:.*(?:official|官方|官方|公式|공식|الرسمي|Resmî|официальн|resmi|oficial|officielle|offizielle|ufficiale)/i);

  for (const locale of locales) {
    const localeKey = locale.replace("-", "\\-");
    assert.match(venueYellowPages, new RegExp(`["']?${localeKey}["']?: \\{[\\s\\S]*?sectionTitle:`, "m"));
    assert.match(venueYellowPages, new RegExp(`["']?${localeKey}["']?: \\{[\\s\\S]*?sectionLead:`, "m"));
    assert.match(venueYellowPages, new RegExp(`["']?${localeKey}["']?: \\{[\\s\\S]*?openSignup:`, "m"));
  }
});

test("hero registration CTA names a registration link without claiming the partner route is the official domain", () => {
  assert.match(leanHero, /const registrationLinkCopy = \{/);
  assert.match(leanHero, /ja: "提携登録リンクを開く"/);
  assert.match(leanHero, /ko: "파트너 가입 링크 열기"/);
  assert.match(leanHero, /tr: "Partner kayıt bağlantısını aç"/);
  assert.match(leanHero, /const KO_UI = \{/);
  assert.match(leanHero, /가입 전에 지역, 본인확인, 입금 방식과 공식 조건을 확인하세요/);
  assert.match(leanHero, /const TR_UI = \{/);
  assert.match(leanHero, /Kayıt öncesi bölge, kimlik doğrulama, para yatırma ve resmi koşulları kontrol edin/);
  assert.doesNotMatch(leanHero, /openRegister:\s*text\.openOfficialSource/);
  assert.doesNotMatch(leanHero, /openRegister: "公式サイトで確認する"/);
  assert.doesNotMatch(leanHero, /openRegister: "Register on official site"/);
});

test("priority locale visible copy avoids internal operations vocabulary", () => {
  const priorityTelegramCopy = telegramHub.slice(
    telegramHub.indexOf("inboundBadge: \"サイト内回答を優先\""),
    telegramHub.indexOf("inboundBadge: \"RESPUESTA PRIMERO EN EL SITIO\""),
  );
  assert.doesNotMatch(priorityTelegramCopy, /WAVE14|NexuAlpha-first|landing|drafts|taslak|초안|草稿/);
  assert.match(telegramHub, /Página de destino/);
  assert.match(telegramHub, /Parâmetros obrigatórios/);
  assert.match(venueYellowPages, /Koşulları kapat/);
  assert.match(venueYellowPages, /Ver condições/);
});

test("V3 research panels stay source-bound and comparison-native", () => {
  assert.match(researchPanels, /researchForVenue\(slug, locale\)/);
  assert.match(researchPanels, /fact\.sourceUrl/);
  assert.match(researchPanels, /target="_blank" rel="noopener noreferrer"/);
  assert.match(researchPanels, /<input type="checkbox" checked=\{differences\}/);
  assert.match(researchPanels, /onChange=\{\(event\) => setDifferences\(event\.target\.checked\)\}/);
  assert.match(researchPanels, /<table className="research-table">/);
  assert.match(researchPanels, /<thead><tr><th scope="col">/);
  assert.match(researchPanels, /<tbody>\{rows\.map/);
  assert.match(researchPanels, /<th scope="row">/);
  assert.doesNotMatch(researchPanels, /rating:\s*|score:\s*|stars:\s*|numericRating|\/10|out of 10/i);
});

test("methodology copy keeps reserve and update claims source-gated", () => {
  assert.match(methodologyPage, /Traceable Sources|来源可追溯/);
  assert.doesNotMatch(methodologyPage, /100% Traceable Sources|mandating ≥ 100%|within 24 hours|24 小时内/);
  assert.match(methodologyPage, /pending when no reproducible source is available|未能找到可复核来源/);
});

test("Wave35 methodology exposes localized research identity and reusable citation assets", () => {
  assert.match(methodologyPage, /Published by NexuAlpha Research Desk/);
  assert.match(methodologyPage, /NexuAlpha Research Desk が公開/);
  assert.match(methodologyPage, /페이지 검토일/);
  assert.match(methodologyPage, /dateTime="2026-09-15"/);
  assert.match(methodologyPage, /\/research\/perp-dex-cost-field-dictionary\.json/);
  assert.match(methodologyPage, /\/research\/perp-dex-cost-field-dictionary\.csv/);
  assert.match(methodologyPage, /\/research\/regional-funding-verification-matrix\.json/);
  assert.match(methodologyPage, /\/research\/regional-funding-verification-matrix\.csv/);
  assert.match(methodologyPage, /https:\/\/t\.me\/NexuAlphaAssistantBot/);
  assert.doesNotMatch(methodologyPage, /NexuAlpha_Bot/);
  assert.doesNotMatch(methodologyPage, /guaranteed citation|guaranteed ranking|AI citation guaranteed/i);
});

test("methodology exposes regional funding route answer without registration promises", () => {
  assert.match(methodologyPage, /REGIONAL_FUNDING_ROUTE_COPY/);
  assert.match(methodologyPage, /id="regional-funding-routes"/);
  assert.match(methodologyPage, /data-aeo-extractable-answer/);
  assert.match(methodologyPage, /How should international users verify crypto funding routes\?/);
  assert.match(methodologyPage, /Hong Kong/);
  assert.match(methodologyPage, /European Union/);
  assert.match(methodologyPage, /United Kingdom/);
  assert.match(methodologyPage, /Japan/);
  assert.match(methodologyPage, /Korea/);
  assert.match(methodologyPage, /Singapore/);
  assert.match(methodologyPage, /Türkiye/);
  assert.match(methodologyPage, /Brazil/);
  assert.match(methodologyPage, /Mexico/);
  assert.match(methodologyPage, /\/compare\/binance-vs-okx/);
  assert.match(methodologyPage, /\/compare\/bybit-vs-bitget/);
  assert.match(methodologyPage, /\/compare\/hyperliquid-vs-dydx/);
  assert.doesNotMatch(methodologyPage, /nexu888|11350287|partner\.bitget|guaranteed signup|guaranteed account|bonus guaranteed/i);
  assert.match(methodologyPageCss, /methodology-page__funding-answer/);
  assert.match(methodologyPageCss, /grid-template-columns: minmax\(0, 0\.9fr\) minmax\(0, 1\.1fr\)/);
});

// Class b: the shared v6 class decorates the existing accessible main landmark.
test("methodology owns the page main landmark so its header and sections remain accessible", () => {
  assert.match(methodologyPage, /<main className="v6 methodology-page v2-page" id="top" lang=\{locale\} dir=\{getTextDirection\(locale\)\}>/);
  assert.match(methodologyPage, /import \{ getTextDirection \} from "\.\.\/\.\.\/paraglide\/runtime\.js";/);
  assert.match(app, /if \(route\.name === "methodology"\) return pageShell\(<AuditMethodologyPage locale=\{locale\} \/>\);/);
  assert.match(methodologyPage, /<header className="methodology-page__header">/);
  assert.doesNotMatch(methodologyPage, /<div className="(?:v6 )?methodology-page v2-page">/);
  assert.match(methodologyPage, /<section className="methodology-page__section" aria-labelledby="methodology-pillars-title">/);
  assert.match(methodologyPage, /<h2 className="methodology-page__sec-title" id="methodology-pillars-title">/);
  assert.match(methodologyPage, /<section className="methodology-page__wall-card" id="disclosure" aria-labelledby="methodology-disclosure-title">/);
  assert.match(methodologyPage, /<div className="methodology-page__wall-icon" aria-hidden="true">/);
  assert.match(methodologyPage, /id="methodology-data-license-title"/);
  assert.match(methodologyPage, /<div className="methodology-page__funding-assets" role="group" aria-label=\{fundingRoute\.datasetLabel\}>/);
  assert.match(methodologyPage, /aria-labelledby="methodology-feedback-title"/);
  assert.match(methodologyPageCss, /\.methodology-pillars-disclosure > summary \{[\s\S]*min-height: 44px;/);
  assert.match(methodologyPageCss, /\.methodology-pillars-disclosure > summary:focus-visible/);
  assert.match(methodologyPageCss, /\.methodology-page__feedback-left h2 \{/);
  assert.match(methodologyPageCss, /\.methodology-page__feedback-actions a \{[\s\S]*min-height: 44px;/);
  assert.match(methodologyPageCss, /@media \(prefers-reduced-motion: reduce\)/);
});

test("comparison winner labels stay closed without pair-specific source review", () => {
  assert.match(v3Pages, /function hasReviewedDecisionSource\(slug\)/);
  assert.match(v3Pages, /comparisonSourceReviewed = venueData\.every/);
  assert.match(v3Pages, /CURATED PLATFORM COMPARISONS|精选平台对比路径/);
  assert.match(v3Pages, /<span className="v3-gold-matrix-card__badge">\{matrixText\.compareBadge \|\| compareFaqBadge\(locale\)\}<\/span>/);
});

test("comparison decision cards use neutral candidate labels", () => {
  assert.match(v3Pages, /候选平台 A/);
  assert.match(v3Pages, /候选平台 B/);
  assert.doesNotMatch(v3Pages, /首选推荐 A|首选推荐 B/);
});

test("public venue decision copy has an editorial gate separate from commercial claim status", () => {
  assert.match(v3Pages, /import \{ decisionCopy, decisionForVenue, hasReviewedEditorialDecision \}/);
  assert.match(v3Pages, /const safeDecision = hasReviewedEditorialDecision\(profile\.slug\) \? decision : null/);
  assert.match(v3Pages, /const reviewed = hasReviewedEditorialDecision\(slug\)/);
  assert.doesNotMatch(v3Pages, /claimState === "verified" && hasReviewedDecisionSource\(profile\.slug\)/);
  assert.match(v3Pages, /comparisonSourceReviewed = venueData\.every\(\(d\) => hasReviewedDecisionSource\(d\.slug\)\)/);
  assert.match(venueDecisionArticles, /decisionSourceReviewedAt/);
  // QA 2026-10-10: the pending copy moved to one shared module covering all 15 locales.
  assert.match(venueDecisionArticles, /const pending = pendingDecisionCopy\(locale\)/);
  assert.match(pendingDecisionCopySource, /Only source-linked facts with a review date are publishable/);
  assert.match(venueYellowPages, /const sourceReviewed = Boolean\(db\.decisionSourceReviewedAt\)/);
  assert.match(topicGuidePage, /全球流动性断层第一/);
  assert.match(topicGuidePage, /注册条件待核验/);
});

test("venue detail CTA uses the source-bound public projection while preserving approved invite codes", () => {
  assert.match(v3Pages, /import \{ publicCtaForVenue \} from "\.\.\/\.\.\/data\/source-bound-cta\.js"/);
  assert.match(v3Pages, /function publicVenueAccess\(slug, locale = "en", market\)/);
  assert.match(v3Pages, /const publicCta = publicCtaForVenue\(slug, locale, market\)/);
  assert.match(v3Pages, /inviteCode: publicCta\.inviteCode/);
  assert.match(v3Pages, /registrationUrl: publicCta\.registrationUrl/);
  assert.match(v3Pages, /benefitText: publicCta\.benefit/);
  assert.doesNotMatch(v3Pages, /publicInviteCode/);
  assert.doesNotMatch(v3Pages, /commercialClaim\.status === "verified" \? inviteCode : null/);
});

test("SearchDialog handles native Escape, focus trap, and restoration", () => {
  assert.match(searchDialog, /role="dialog" aria-modal="true" aria-label=\{label\}/);
  assert.match(searchDialog, /document\.activeElement/);
  assert.match(searchDialog, /querySelector\("input, button, a\[href\]"\)\?\.focus\(\)/);
  assert.match(searchDialog, /event\.key === "Escape"/);
  assert.match(searchDialog, /event\.key !== "Tab"/);
  assert.match(searchDialog, /event\.shiftKey && document\.activeElement === first/);
  assert.match(searchDialog, /document\.activeElement === last/);
  assert.match(searchDialog, /const target = returnFocusRef\?\.current\?\.isConnected \? returnFocusRef\.current : previous/);
  assert.match(searchDialog, /target\.focus\(\{ preventScroll: true \}\)/);
  assert.match(searchDialog, /returnFocusRef\.current = null/);
  assert.match(app, /<SearchDialog label=\{copy\.common\.openFinder\} onClose=\{closeSearchDialog\} returnFocusRef=\{searchReturnFocusRef\}/);
  assert.doesNotMatch(app, /mobile-search-overlay" role="dialog"/);
});

test("TraderWizardModal uses accessible modal behavior and condition-based CTA context", () => {
  assert.match(traderWizardModal, /useEffect, useRef/);
  assert.match(traderWizardModal, /role="dialog"[\s\S]*aria-modal="true"[\s\S]*aria-labelledby="wizard-modal-title"/);
  assert.match(traderWizardModal, /document\.activeElement/);
  assert.match(traderWizardModal, /event\.key === "Escape"/);
  assert.match(traderWizardModal, /event\.key !== "Tab"/);
  assert.match(traderWizardModal, /previousFocusRef\.current\?\.isConnected/);
  assert.match(traderWizardModal, /previousFocusRef\.current\.focus\(\)/);
  assert.match(traderWizardModal, /productFromWizardChoice\(ans2, contextProduct\)/);
  assert.match(traderWizardModal, /marketFromWizardChoice\(ans1, contextMarket\)/);
  assert.match(traderWizardModal, /initialResidencyChoice\(contextMarket\)/);
  assert.match(traderWizardModal, /toUpperCase\(\) === "CN" \? "cn" : "overseas"/);
  assert.match(traderWizardModal, /regionalVenueCta\(topSlug, locale, derivedMarket, derivedProduct\)/);
  assert.match(traderWizardModal, /data-cta-placement="wizard-result-primary"/);
  assert.match(traderWizardModal, /data-cta-platform=\{matchResult\.slug\}/);
  assert.match(traderWizardModal, /matchResult\.fitLabel/);
  assert.doesNotMatch(traderWizardModal, /score\s*=\s*9[789]/);
  assert.doesNotMatch(traderWizardModal, /matchResult\.score/);
  assert.doesNotMatch(traderWizardModal, /精确匹配最省手续费|across 21 verified platforms/);
});

test("TraderWizardModal localizes step guidance instead of leaking English into non-English flows", () => {
  for (const locale of ["ja", "ko", "tr", "es", "pt-BR", "fr", "de", "ru", "ar", "id", "vi", "it"]) {
    const keyPattern = locale === "pt-BR" ? '"pt-BR"' : locale;
    assert.match(traderWizardModal, new RegExp(`${keyPattern}: \\[`, "u"));
  }
  assert.match(traderWizardModal, /const translatedDesc = \(wizardStepDescUi\[locale\] \|\| wizardStepDescUi\[localeKey\]\)\?\.\[i\]/);
  assert.match(traderWizardModal, /\.\.\.\(translatedDesc \? \{ desc: translatedDesc \} : \{\}\)/);
});

test("Brazil venue cards use progressive disclosure for repeated decision criteria", () => {
  assert.match(brazilDecisionPage, /className="br-venue-card__details"/);
  assert.match(brazilDecisionPage, /copy\.readCriteria/);
  assert.match(brazilDecisionPage, /<summary>\{copy\.readCriteria\}<\/summary>/);
  assert.match(brazilDecisionCss, /\.br-venue-card__details > summary/);
  assert.match(brazilDecisionCss, /min-height: 44px/);
  assert.match(brazilDecisionCss, /\.br-venue-card__details\[open\] > summary::after/);
});

test("Brazil comparison page puts a three-question decision rail before the shortlist", () => {
  assert.match(brazilDecisionPage, /const isComparisonPage = page\.path === "\/br\/comparar"/);
  assert.match(brazilDecisionPage, /br-decision-rail-title/);
  assert.match(brazilDecisionPage, /brazil-compare-cost-tool/);
  assert.match(brazilDecisionPage, /Compare em três perguntas/);
  assert.match(brazilDecisionPage, /Como entra o dinheiro\?/);
  assert.match(brazilDecisionPage, /Qual é o custo total\?/);
  assert.match(brazilDecisionPage, /A conta é elegível\?/);
  assert.match(brazilDecisionCss, /\.br-decision-rail__grid/);
  assert.match(brazilDecisionCss, /grid-template-columns: repeat\(3/);
});

test("Vite build identity is defined in build config and CleanFooter provides clean policy navigation without diagnostic console", () => {
  assert.match(viteConfig, /const generatedBuildId = `3\.0-\$\{new Date\(\)\.toISOString\(\)/);
  assert.match(viteConfig, /define: \{ __NEXUALPHA_BUILD_ID__: JSON\.stringify\(buildId\) \}/);
  assert.match(viteConfig, /const requestedBuildId = process\.env\.BUILD_ID\?\.trim\(\)/);
  assert.match(viteConfig, /const buildId = requestedBuildId \|\| generatedBuildId/);
  assert.match(viteConfig, /fileName: "version\.json"/);
  assert.match(viteConfig, /JSON\.stringify\(\{ version: "3\.0\.0", buildId \}\)/);
  assert.match(app, /document\.documentElement\.dataset\.build = __NEXUALPHA_BUILD_ID__/);
  assert.match(app, /<CleanFooter locale=\{locale\} brazil=\{route\.name === "brazil"\} \/>/);
  assert.match(app, /const footer = <CleanFooter/);
  assert.doesNotMatch(app, /<small className="build-identity"/);
  assert.doesNotMatch(app, /className="data-connection"/);
});

test("CleanFooter navigation labels match their destinations in every supported locale", () => {
  for (const locale of ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"]) {
    const key = /^[a-z]+$/.test(locale) ? locale : `"${locale}"`;
    assert.match(cleanFooter, new RegExp(`${key}: \\{[\\s\\S]*?directory:`), `${locale} footer labels`);
  }
  assert.match(cleanFooter, /directory: "Platform directory"/);
  assert.match(cleanFooter, /contact: "お問い合わせ"/);
  assert.match(cleanFooter, /contact: "문의"/);
  assert.match(cleanFooter, /contact: "İletişim"/);
  assert.match(cleanFooter, /href=\{href\("\/exchanges"\)\}>\{labels\.directory\}/);
  assert.match(cleanFooter, /href=\{href\("\/topics"\)\}>\{labels\.topics\}/);
  assert.match(cleanFooter, /href=\{href\("\/factbook"\)\}>\{labels\.factbook\}/);
  // 2026-10-11 brand entity: the footer group gains About and Editorial policy; the methodology link keeps its own label.
  assert.match(cleanFooter, /href=\{href\("\/about"\)\}>\{labels\.about\}/);
  assert.match(cleanFooter, /href=\{href\("\/editorial-policy"\)\}>\{labels\.editorial\}/);
  assert.match(cleanFooter, /href=\{href\("\/methodology"\)\}>\{labels\.methodology\}/);
  assert.match(cleanFooter, /href=\{brazil \? "\/br\/custos" : href\("\/embed\/calculator"\)\}>\{labels\.calculator\}/);
  assert.match(cleanFooter, /href=\{href\("\/partners"\)\}>\{labels\.embedGuide\}/);
  assert.match(cleanFooter, /href=\{href\("\/methodology#disclosure"\)\}>\{labels\.disclosure\}/);
  // Public policy/contact destinations replace the former anchor and email-only navigation.
  for (const label of ["privacy", "terms", "contact"]) {
    assert.ok(cleanFooter.includes(`href={href("/${label}")}>{labels.${label}}`));
  }
  assert.doesNotMatch(cleanFooter, /contact:\s*text\.detailHandoff/);
  assert.doesNotMatch(cleanFooter, /about:\s*text\.home/);
  assert.doesNotMatch(cleanFooter, />\{copy\.(?:about|editorial|calculator|embedGuide|privacy|terms|disclosure|contact)\}<\/a>/);
});

test("CleanFooter preserves locale-specific footer semantics instead of status words", () => {
  assert.doesNotMatch(cleanFooter, /跳转|跳轉|상태|출시 핸드오프|Lansman yönlendirmesi|Handoff peluncuran|ra mắt đang chờ/);
  assert.match(cleanFooter, /privacy: "プライバシー通知"/);
  assert.match(cleanFooter, /terms: "이용 조건 및 위험 고지"/);
  assert.match(cleanFooter, /disclosure: "İş ortaklığı açıklaması"/);
});

test("Vite keeps editorial, regional, and source dictionaries in cacheable chunks", () => {
  assert.match(viteConfig, /route-topic-guide/);
  assert.match(viteConfig, /route-factbook/);
  assert.match(viteConfig, /route-international/);
  assert.match(viteConfig, /route-activity/);
  assert.match(viteConfig, /data-topic-guides/);
  assert.match(viteConfig, /data-factbook/);
  assert.match(viteConfig, /data-venue/);
  assert.match(viteConfig, /data-research/);
  assert.match(viteConfig, /data-v3-product/);
  assert.match(viteConfig, /route-v3-compare-final-choice/);
  assert.match(viteConfig, /route-collection-hubs/);
  assert.match(viteConfig, /route-v3-research-panels/);
  assert.match(viteConfig, /route-v3-decision-articles/);
  assert.match(viteConfig, /route-v3-readiness/);
  assert.match(viteConfig, /data-priority-venue-answers/);
  assert.match(viteConfig, /data-compare-direct-answers/);
  assert.match(viteConfig, /data-compare-faq-locales/);
});

test("yellow pages URL state stays outside the strict V3 pages route chunk", () => {
  assert.match(venueYellowPages, /from "\.\/venue-yellow-pages-copy\.js"/);
  assert.match(venueYellowPages, /from "\.\/venue-yellow-pages-state\.js"/);
  assert.match(venueYellowPagesCopy, /accountStageCopy/);
  assert.match(venueYellowPagesCopy, /decisionCopy/);
  assert.match(venueYellowPagesCopy, /productPathLabel/);
  assert.match(venueYellowPagesState, /restoreYellowPagesStateFromUrl/);
  assert.match(venueYellowPagesState, /writeYellowPagesStateToUrl/);
  assert.match(venueYellowPagesState, /appendAccountStageToSearch/);
  assert.match(viteConfig, /venue-yellow-pages-copy\.js"\)\) return "route-v3-pages-copy"/);
  assert.match(viteConfig, /venue-yellow-pages-state\.js"\)\) return "route-v3-pages-state"/);
  assert.ok(
    viteConfig.indexOf("venue-yellow-pages-state.js") < viteConfig.indexOf("/src/components/v3/VenueYellowPages"),
    "state chunk rule must run before the broad VenueYellowPages rule",
  );
  assert.ok(
    viteConfig.indexOf("venue-yellow-pages-copy.js") < viteConfig.indexOf("/src/components/v3/VenueYellowPages"),
    "copy chunk rule must run before the broad VenueYellowPages rule",
  );
});

test("SSR build keeps eager route loading separate from client lazy chunks", () => {
  assert.match(app, /const deferredPageModules = import\.meta\.env\.SSR \? \{\} : import\.meta\.glob\(\[/);
  assert.match(app, /const ssrDeferredPageModules = import\.meta\.env\.SSR \? import\.meta\.glob\(\[[\s\S]*\], \{ eager: true \}\) : \{\}/);
  assert.match(viteConfig, /ssrLazyChunkWarningModules = \[/);
  assert.match(viteConfig, /CommandFinder\.jsx/);
  assert.match(viteConfig, /SearchDialog\.jsx/);
  assert.match(viteConfig, /CampaignRadar\.jsx/);
  assert.match(viteConfig, /isExpectedSsrLazyChunkWarning\(warning\)/);
  assert.match(viteConfig, /if \(isExpectedSsrLazyChunkWarning\(warning\)\) return;\s*warn\(warning\);/);
});

test("Vite does not force CTA projection into a separate manual chunk from route components", () => {
  assert.match(campaignRadar, /import \{ publicCtaForVenue \} from "\.\.\/\.\.\/data\/source-bound-cta\.js"/);
  assert.doesNotMatch(viteConfig, /CampaignRadar[^]*return "route-v3-campaigns"/);
  assert.doesNotMatch(viteConfig, /route-v3-campaigns/);
  assert.doesNotMatch(viteConfig, /public-cta\.js[^]*return "data-commercial-cta"/);
  assert.doesNotMatch(viteConfig, /regional-cta\.js[^]*return "data-commercial-cta"/);
  assert.doesNotMatch(viteConfig, /data-commercial-cta/);
});

test("build script enforces the measured app and V3 route budgets", () => {
  const scripts = JSON.stringify(packageJson.scripts);
  assert.match(scripts, /verify-build-budget\.mjs --strict/);
  assert.match(scripts, /verify:build-budget/);
});

test("V3 source intake covers every visible venue with parseable HTTPS official hubs", () => {
  const expectedSlugs = ["binance", "coinbase", "bybit", "bitget", "okx", "kraken", "gate-io", "kucoin", "mexc", "backpack", "deribit", "uniswap", "pancakeswap", "jupiter", "raydium", "aerodrome", "curve", "hyperliquid", "dydx", "gmx", "drift"];
  const expectedBrandNames = ["Binance", "Coinbase", "Bybit", "Bitget", "OKX", "Kraken", "Gate.io", "KuCoin", "MEXC", "Backpack", "Deribit", "Uniswap", "PancakeSwap", "Jupiter", "Raydium", "Aerodrome", "Curve", "Hyperliquid", "dYdX", "GMX", "Drift"];
  for (const slug of expectedSlugs) assert.match(v3Data, new RegExp(`["']?${slug}["']?:\\s*\\[\\s*\\{ label: "[^"]+", url: "https://`));
  for (const name of expectedBrandNames) assert.match(marketData, new RegExp(`"${name.replace(".", "\\.")}"`));
  const urls = [...v3Data.matchAll(/url: "(https:\/\/[^"]+)"/g)].map((match) => match[1]);
  const hosts = urls.map((value) => new URL(value).host);
  assert.ok(urls.length >= expectedSlugs.length);
  assert.ok(new Set(hosts).size >= expectedSlugs.length);
  assert.equal(new Set(urls).size, urls.length);
  assert.match(v3Data, /sourceHubs\[venue\.slug\] \?\? \[\]/);
  assert.match(v3Pages, /translate="no" lang="en"/);
});

test("activity center stays compact, source-bound, and fail-closed", () => {
  const activityCenter = activityPages.slice(activityPages.indexOf("export function ActivityCenterPage"), activityPages.indexOf("export function ActivityDetailPage"));
  assert.match(activityCenter, /const profiles = venues\.map\(\(venue\) => venueProfile\(venue, locale\)\)/);
  assert.match(activityCenter, /<ActivityCenterV3/);
  assert.match(activityCenterV3, /visibleOfficialUpdates\(publicUpdates, now\)/);
  assert.match(activityCenterV3, /const publishable = discoveredAt !== null/);
  assert.match(activityCenterV3, /const feedItemList = useMemo\(\(\) => publishableUpdates/);
  assert.match(activityCenterV3, /const visibleResearchCards = showAllResearch/);
  assert.match(activityCenterV3, /const visibleResearchCards = showAllResearch \? (?:researchCards|researchItemList) : (?:researchCards|researchItemList)\.slice\(0, 6\)/);
  assert.match(activityCenterV3, /activity-center-v3__empty-actions/);
  assert.match(activityCenterV3, /\/compare\/binance-vs-okx/);
  assert.match(activityCenterV3, /activityCenterCopy\(locale\)/);
  assert.match(activityCenterV3, /href=\{updateHref\(update, locale, \{ market, product \}\)\}/);
  assert.match(activityCenterV3, /detailCopy\.openActivityDetail/);
  assert.match(activityPages, /toLocaleString\(locale\)/);
  assert.doesNotMatch(activityCenterV3, /Tracked official sources|Only six sources|中心已经准备好|正在跟踪|默认只展示|跟蹤中/);
  assert.doesNotMatch(activityCenter, /<SourceList/);
});

test("official research keeps the decision summary visible while collapsing deep reward facts", () => {
  assert.match(officialResearchPage, /official-research-page__reward-details/);
  assert.match(officialResearchPage, /<summary>\{text\.conditions\}<\/summary>/);
  assert.match(officialResearchPage, /official-research-page__reward-details/);
});

test("venue fee matrix keeps mobile evidence dense without removing the table", () => {
  assert.doesNotMatch(v3Css, /\.v3-fee-matrix-sub\s*\{[^}]*-webkit-line-clamp:/);
  assert.match(v3Css, /\.v3-fee-table th,[\s\S]*?\.v3-fee-table td\s*\{[\s\S]*?padding-block: 9px;/);
  assert.match(v3Pages, /className="v3-fee-table"/);
});

test("venue FAQ keeps the first decision questions visible and expands the remainder", () => {
  assert.match(v3Pages, /import \{ VenueFaqSection \} from "\.\/VenueFaqSection\.jsx"/);
  assert.match(v3Pages, /export \{ VenueFaqSection \} from "\.\/VenueFaqSection\.jsx"/);
  assert.doesNotMatch(v3Pages, /function getVenueFaqs/);
  assert.match(venueFaqSection, /export function VenueFaqSection[\s\S]*?const \[showAllFaqs, setShowAllFaqs\] = useState\(false\)/);
  assert.match(venueFaqSection, /hidden=\{idx >= 2 && !showAllFaqs\}/);
  assert.match(venueFaqSection, /aria-expanded=\{showAllFaqs\}/);
  assert.match(venueFaqSection, /className="v3-faq-list__expand"/);
});

test("focus and touch stability layer is loaded for the V3 surface", () => {
  assert.match(main, /import "\.\/styles\/v3-layout-stability\.css"/);
  assert.match(v3LayoutStability, /\.command-input:focus-within \{[^}]*outline: 2px solid var\(--blue-text\);[^}]*outline-offset: 2px;/s);
  assert.match(v3LayoutStability, /\.command-input input \{[^}]*min-height: 44px;/s);
  assert.match(v3LayoutStability, /\.v2-nav a,\s*\.v2-header__tools button \{[^}]*min-height: 36px;/s);
  assert.match(v3LayoutStability, /\.v3-back-link,\s*\.v3-source-board article > a,\s*\.v3-action-map__grid a,\s*\.v3-action-map__footer a \{[^}]*min-height: 28px;/s);
  assert.match(v3LayoutStability, /@media \(max-width: 900px\) \{[\s\S]*\.v3-page \.v3-source-board,[\s\S]*grid-template-columns: 1fr;/);
  assert.match(v3LayoutStability, /@media \(max-width: 480px\) \{[\s\S]*\.v3-source-list__meta p \{[\s\S]*grid-template-columns: 1fr;/);
});

test("KOL landing routes unresolved partner terms through research first", () => {
  assert.match(app, /name: "kolLanding", kol: refParam, \.\.\.contextParams\(\)/);
  assert.match(app, /name: "kolLanding", kol: refMatch\[1\], \.\.\.contextParams\(\)/);
  assert.match(kolLandingPage, /const directRoute = cta\.hasReferral/);
  assert.match(kolLandingPage, /contextualHref\(`\/exchanges\/\$\{slug\}#registration-path`/);
  assert.match(kolLandingPage, /data-cta-kind=\{directRoute \? "registration" : "research"\}/);
  assert.match(kolLandingPage, /Review official terms first/);
  assert.doesNotMatch(kolLandingPage, /Sign Up via Partner Link/);
});

test("campaign radar does not classify unverified partner terms as registration", () => {
  assert.match(campaignRadar, /item\.hasReferral/);
  assert.match(campaignRadar, /contextualHref\(`\/exchanges\/\$\{item\.slug\}#registration-path`/);
  assert.match(campaignRadar, /data-cta-kind=\{item\.hasReferral/);
});

test("fee bleed analyzer routes unresolved benefits through research first", () => {
  assert.match(tradingBleedAnalyzer, /regionalVenueCta\(selectedSlug, locale, market, product\)/);
  assert.match(tradingBleedAnalyzer, /const directRoute = Boolean\(regionalCta\.direct && \/\^https:/);
  assert.match(tradingBleedAnalyzer, /const regUrl = regionalCta\.ctaHref/);
  assert.match(tradingBleedAnalyzer, /data-cta-kind=\{directRoute \? "registration" : "research"\}/);
  assert.match(tradingBleedAnalyzer, /data-growth-market=\{market\}/);
  assert.match(tradingBleedAnalyzer, /data-growth-product=\{product\}/);
  assert.match(tradingBleedAnalyzer, /directRoute \? ui\.ctaReclaim : ui\.reviewOfficial/);
  assert.match(tradingBleedCopy, /reviewOfficial: "Review official terms first ↗"/);
});

test("Brazil decision CTAs require a verified public claim before registration", () => {
  assert.match(brazilDecisionPage, /publicCtaForVenue/);
  assert.match(brazilDecisionPage, /activeCta\?\.hasReferral/);
  assert.match(brazilDecisionPage, /data-cta-kind="registration" data-cta-status=\{activeCta\.claim\.status\}/);
  assert.match(brazilDecisionPage, /data-cta-kind="research" data-cta-status=\{cta\.claim\.status\}/);
  assert.match(brazilDecisionPage, /appendFragmentContextParams/);
  assert.match(brazilDecisionPage, /market: state\.region/);
  assert.match(brazilDecisionPage, /product: state\.product/);
  assert.match(brazilDecisionPage, /const globalDirectoryUrl = withBrazilPassport\("\/exchanges", state, pageLocale\)/);
});

test("Brazil decision renders AEO answers inside the collapsed evidence area", () => {
  assert.match(brazilDecisionPage, /function BrazilAeoAnswers\(\{ answers = \[\], sources \}\)/);
  assert.match(brazilDecisionPage, /<BrazilAeoAnswers answers=\{page\.aeoAnswers\} sources=\{sources\} \/>/);
  assert.match(brazilDecisionPage, /<details className="br-aeo-answer" key=\{item\.id \|\| item\.question\}>/);
  assert.match(brazilDecisionPage, /<summary>\{item\.question\}<\/summary>/);
  assert.match(brazilDecisionPage, /item\.steps\.slice\(0, 5\)\.map/);
  assert.match(brazilDecisionPage, /<table className="br-aeo-table">/);
  assert.match(brazilDecisionPage, /data-label=\{table\.headers\[cellIndex\]\.label\}/);
  assert.match(brazilDecisionPage, /className="br-aeo-sources"/);
  assert.match(brazilDecisionPage, /source\.url/);
});

test("Brazil AEO answer tables are mobile-safe without horizontal scrolling", () => {
  assert.match(brazilDecisionCss, /\.br-aeo-answer > summary\s*\{[\s\S]*?min-height: 44px;/);
  assert.match(brazilDecisionCss, /\.br-aeo-answer > summary:focus-visible,/);
  assert.match(brazilDecisionCss, /\.br-aeo-table\s*\{[\s\S]*?table-layout: fixed;/);
  assert.match(brazilDecisionCss, /@media \(max-width: 560px\) \{[\s\S]*\.br-aeo-table,[\s\S]*?display: block;/);
  assert.match(brazilDecisionCss, /\.br-aeo-table td::before\s*\{[\s\S]*?content: attr\(data-label\);/);
  assert.doesNotMatch(brazilDecisionCss, /\.br-aeo-[^{]+overflow-x:\s*auto/);
});

test("Brazil unsupported locale fallback is visible in client-only previews", () => {
  assert.match(brazilDecisionPage, /const BRAZIL_PAGE_LOCALE = "pt-BR"/);
  assert.match(brazilDecisionPage, /const requestedLocale = locale/);
  assert.match(brazilDecisionPage, /const pageLocale = BRAZIL_PAGE_LOCALE/);
  assert.match(brazilDecisionPage, /const copy = copyFor\(pageLocale\)/);
  assert.match(brazilDecisionPage, /function currentLocation\(initialUrl\)/);
  assert.match(brazilDecisionPage, /nonBr:/);
  assert.match(brazilDecisionPage, /lang=\{pageLocale\}/);
  assert.match(brazilDecisionPage, /dir="ltr"/);
  assert.match(brazilDecisionPage, /data-requested-locale=\{requestedLocale === pageLocale \? undefined : requestedLocale\}/);
  assert.match(brazilDecisionPage, /data-locale-fallback=\{requestedLocale === pageLocale \? undefined : pageLocale\}/);
  assert.match(brazilDecisionPage, /publicCtaForVenue\(state\.platform, pageLocale, state\.region\)/);
  assert.match(brazilDecisionPage, /publicCtaForVenue\(venue\.slug, pageLocale, state\.region\)/);
  assert.match(brazilDecisionPage, /venueBenefit\(partner, pageLocale\)/);
  assert.match(brazilDecisionPage, /formatCurrency\(pageLocale, estimate\.total\)/);
  assert.match(brazilDecisionPage, /locale: pageLocale/);
  assert.match(brazilDecisionPage, /className="br-decision-panel__status"/);
  assert.match(brazilDecisionCss, /\.br-decision-panel__status/);
});

test("fee rebate calculator keeps unresolved benefits in the research path", () => {
  assert.match(feeRebateCalculator, /calcRow\(slug, monthlyVol, mode, locale\)/);
  assert.match(feeRebateCalculator, /\}, \[monthlyVol, mode, locale\]\);/);
  assert.match(feeRebateCalculator, /row\.hasReferral/);
  assert.match(feeRebateCalculator, /row\.registrationUrl/);
  assert.match(feeRebateCalculator, /contextualHref\(`\/exchanges\/\$\{slug\}#registration-path`/);
  assert.match(feeRebateCalculator, /data-cta-kind="research"/);
  assert.match(feeRebateCalculator, /Review official terms first/);
});

test("homepage decision panel keeps unverified partner terms in the research path", () => {
  assert.match(leanHero, /publicCtaForVenue\(slug, locale\)/);
  assert.match(leanHero, /directRoute: publicCta\.hasPartnerRoute/);
  assert.match(leanHero, /inviteCode: publicCta\.inviteCode/);
  assert.doesNotMatch(leanHero, /verifiedInviteCode/);
  assert.match(leanHero, /<RegistrationCard[\s\S]+?venueSlug=\{selected\.slug\}/);
  assert.match(registrationCard, /const registrationDecision = buildRegistrationDecisionState/);
  assert.match(registrationCard, /const primaryRegistrationHref = registrationDecision\.canOpenThirdParty \? registrationDecision\.protectedHref : null/);
  assert.match(registrationCard, /data-registration-decision-state=\{registrationDecision\.state\}/);
  assert.match(registrationCard, /data-cta-kind="registration"/);
  assert.match(leanHero, /reviewTerms: "Review official terms first"/);
});

test("matcher wizard separates partner route, benefit verification, and regional eligibility", () => {
  assert.match(traderWizardModal, /regionalVenueCta\(topSlug, locale, derivedMarket, derivedProduct\)/);
  assert.match(traderWizardModal, /productFromWizardChoice\(ans2, contextProduct\)/);
  assert.match(traderWizardModal, /marketFromWizardChoice\(ans1, contextMarket\)/);
  assert.match(traderWizardModal, /const directRoute = cta\.direct/);
  assert.match(traderWizardModal, /contextualHref\(`\/exchanges\/\$\{topSlug\}#registration-path`, wizardContext\)/);
  assert.match(traderWizardModal, /data-cta-kind=\{matchResult\.directRoute \? "registration" : "research"\}/);
  assert.match(traderWizardModal, /hasPartnerRoute: cta\.hasPartnerRoute/);
  assert.match(traderWizardModal, /benefitVerified: cta\.benefitVerified/);
  assert.match(traderWizardModal, /regionEligible: cta\.regionEligible/);
  assert.match(traderWizardModal, /initialTradingChoice\(contextProduct\)/);
  assert.match(traderWizardModal, /contextualHref\(`\/exchanges\/\$\{matchResult\.slug\}`, wizardContext\)/);
});

// Class b: protocol entries have contextual pending text while verified benefits retain their own state.
test("registration card displays route, benefit, and regional status independently", () => {
  assert.match(registrationCard, /regionalVenueCta\(venueSlug, locale, market, product, \{ accountStage, funding \}\)/);
  assert.match(registrationCard, /publicCta\.hasPartnerRoute \? copy\.routeState/);
  assert.match(registrationCard, /publicCta\.benefitVerified \? copy\.benefitVerified : showProtocolContext \? entryContext\.body : copy\.benefitPending/);
  assert.match(registrationCard, /regionalCta\.ctaState === "blocked"/);
  assert.match(registrationCard, /registration-card__state-list/);
  assert.match(registrationCard, /data-registration-preflight=\{primaryRegistrationHref \? "partner-route"/);
  assert.match(registrationCard, /data-registration-decision-state=\{registrationDecision\.state\}/);
  assert.match(registrationCard, /data-growth-decision-state=\{registrationDecision\.state\}/);
  assert.match(registrationCard, /copy\.preflightWithCode\.replace\("\{code\}", visiblePartner\.inviteCode\)/);
  assert.match(registrationCard, /if it is not prefilled, enter it before submitting/);
  assert.match(registrationCard, /data-cta-kind="registration"/);
  assert.match(registrationCard, /data-cta-placement="registration-card-primary"/);
  assert.match(registrationCard, /data-growth-placement="registration-card-primary"/);
  assert.match(registrationCardCss, /\.registration-card__preflight/);
});

test("comparison decision fallback never invents fee, leverage or benefit defaults", () => {
  const start = v3Pages.indexOf("export function CompareDecisionGuide");
  const end = v3Pages.indexOf("export function CompareFaqSection", start);
  const guide = v3Pages.slice(start, end);

  assert.match(guide, /const guideCopy = compareDecisionGuideCopy\(locale\)/);
  assert.match(guide, /guideCopy\.feeReference\(spotRate\?\.display \|\| feeCopy\.pendingRate, futuresRate\?\.display \|\| feeCopy\.pendingRate, feeCopy\.sourceBound\)/);
  assert.match(guide, /guideCopy\.feePending\(feeCopy\.sourceBound\)/);
  assert.match(guide, /const decisionFeeBullet = \(profile, name, db\) =>/);
  assert.match(guide, /buildVenueFeeSummary\(db, researchForVenue\(profile\.slug, locale\) \|\| \{\}\)/);
  assert.match(guide, /publishableFeeRate\(feeSummary, "spot", locale\)/);
  assert.match(guide, /publishableFeeRate\(feeSummary, "futures", locale\)/);
  assert.match(guide, /feeCopy\.sourceBound/);
  assert.doesNotMatch(guide, /db[AB]\.spotFee\?\.display|db[AB]\.futuresFee\?\.display/);
  assert.match(guide, /guideCopy\.leverage/);
  assert.match(guide, /guideCopy\.reserves/);
  assert.match(guide, /guideCopy\.productSources\(nameA\)/);
  assert.match(guide, /guideCopy\.productSources\(nameB\)/);
  // l10n 2026-10-11: the lead eyebrow/title/subtitle moved from inline zh/en ternaries into a 15-locale copy map.
  assert.match(guide, /const leadCopy = compareDecisionLeadCopy\(locale\)/);
  assert.match(v3Pages, /compareDecisionLeadCopyByLocale = \{[^]*?eyebrow: "PRE-SIGNUP DECISION CHECKLIST"/);
  assert.doesNotMatch(guide, /access[AB]\.rebatePercent/);
  assert.doesNotMatch(guide, /\|\| "0\.10%"/);
  assert.doesNotMatch(guide, /\|\| "100x"/);
  assert.doesNotMatch(v3Pages, /GOLDEN_DECISION_MAP|NexuAlpha 20%|World #1 in social copy/);
});


test("comparison fee surfaces never publish unverified default rates or net-cost winners", () => {
  const faqStart = v3Pages.indexOf("export function CompareFaqSection");
  const faqEnd = v3Pages.indexOf("function DecisionComparisonValue", faqStart);
  const faq = v3Pages.slice(faqStart, faqEnd);
  const matrixStart = v3Pages.indexOf("function HardcoreMetricMatrix");
  const matrixEnd = v3Pages.indexOf("function VersusCtaBlock", matrixStart);
  const matrix = v3Pages.slice(matrixStart, matrixEnd);

  assert.match(faq, /compareDirectAnswerFor\(compareSlugKey, locale\)/);
  assert.match(faq, /compareFaqEntries\(locale, \{ nameA, nameB \}\)/);
  assert.match(faq, /priorityAnswer\.faq\.map/);
  assert.doesNotMatch(faq, /buildVenueFeeSummary\(db[AB]|claimVerified[AB]|access[AB]\.rebatePercent/);
  assert.doesNotMatch(faq, /0\.10% \/ 0\.10%|0\.02% \/ 0\.05%|\?\? 0\.001|\?\? 0\.0005/);
  assert.doesNotMatch(faq, /Net Effective Cost after NexuAlpha Rebates/);

  assert.match(matrix, /buildVenueFeeSummary\(pDb/);
  assert.match(matrix, /const commercialVerified = access\.commercialClaim\.status === "verified"/);
  assert.match(v3Pages, /const publishableFeeRate = \(summary, product, locale = "en"\) => \{[\s\S]*summary\.rates\.find\(\(item\) => item\.product === product\)/);
  assert.match(matrix, /const spot = publishableFeeRate\(feeSummary, "spot", locale\)/);
  assert.match(matrix, /const futures = publishableFeeRate\(feeSummary, "futures", locale\)/);
  assert.match(matrix, /d\.spot\?\.publishable/);
  assert.match(matrix, /d\.futures\?\.publishable/);
  assert.match(matrix, /d\.netCostPublishable/);
  assert.match(matrix, /const matrixLeadByLocale = \{/);
  assert.match(matrix, /const matrixLeadCopy = matrixLeadByLocale\[locale\] \|\| matrixLeadByLocale\[localeKey\(locale\)\] \|\| matrixLeadByLocale\.en/);
  // Owner 2026-10-10: plain words instead of the internal term "pending".
  assert.match(matrix, /Compare source-linked fee schedules, reserve disclosures, KYC, product limits and user-benefit status; anything we have not verified is marked “not yet checked”\./);
  assert.match(matrix, /"zh-Hans": "按官方来源逐项核对费率、储备金、KYC、产品限制与用户权益；未完成核验的项目保持待确认。"/);
  assert.match(matrix, /"zh-Hant": "按官方來源逐項核對費率、儲備金、KYC、產品限制與用戶權益；未完成核驗的項目保持待確認。"/);
  assert.doesNotMatch(matrix, /Direct quantitative comparison based on official fee schedules, Merkle-tree reserve audits, and verified channel rebate rates/);
  assert.doesNotMatch(matrix, /严格基于官方最新公开费率标准、默克尔树链上储备金报告与真实渠道返佣比例/);
  assert.match(matrix, /const rebateKnown = Number\.isFinite\(d\.rebate\) && d\.rebate > 0/);
  assert.match(matrix, /\{rebateKnown \? <>\{d\.rebate\}<span className="v3-matrix-rebate-unit">%<\/span><\/> : localePending\(locale\)\}/);
  assert.match(matrix, /const hasKnownWelcomeReward = Boolean/);
  assert.match(matrix, /hasKnownWelcomeReward[\s\S]*Check the rewards hub after signup[\s\S]*compareFeeSurfaceCopy\(locale\)\.pendingBenefit/);
  assert.doesNotMatch(matrix, /Claim via rewards hub upon signup/);
  assert.doesNotMatch(matrix, /makerRate: 0\.0010|takerRate: 0\.0010|makerRate: 0\.0002|takerRate: 0\.0005/);
  assert.doesNotMatch(matrix, /const hasReferral = access\.hasReferral|hasReferral \? access\.rebatePercent/);
  assert.match(v3Pages, /const pFeeSummary = buildVenueFeeSummary\(pDb, researchForVenue\(p\.slug, locale\) \|\| \{\}\)/);
  assert.match(v3Pages, /const pFee = pSpotRate\?\.display \|\| localePending\(locale\)/);
  assert.doesNotMatch(matrix, /★ Lowest Cost[\s\S]*d\.effectiveFuturesTaker === minNetFutures/);
});

test("single venue FAQ uses the actual localized platform name instead of comparison placeholders", () => {
  const sourceStart = venueFaqSection.indexOf("function getVenueFaqs");
  const renderStart = venueFaqSection.indexOf("export function VenueFaqSection", sourceStart);
  const renderEnd = venueFaqSection.indexOf("export default VenueFaqSection", renderStart);
  const venueFaqSource = venueFaqSection.slice(sourceStart, renderStart);
  const venueFaqRender = venueFaqSection.slice(renderStart, renderEnd);

  assert.match(venueFaqSource, /const name = locName \|\| venue\.name \|\| profile\.name/);
  assert.match(venueFaqSource, /ja: `\$\{name\} の現物・先物手数料はどこで確認できますか？`/);
  assert.match(venueFaqRender, /<span className="v3-faq-q-text">\{faq\.q\}<\/span>/);
  assert.match(venueFaqRender, /<div className="v3-faq-content">\{faq\.a\}<\/div>/);
  assert.doesNotMatch(venueFaqRender, /compareFaqQuestion\(locale, idx, faq\.q\)/);
  assert.doesNotMatch(venueFaqRender, /compareFaqAnswerNotice\(locale\) \|\| faq\.a/);
  assert.match(venueFaqSource, /benefitVerified && rebate > 0 && inviteCode/);
  assert.match(venueFaqSource, /buildVenueFeeSummary\(db, researchForVenue\(venue\.slug, locale\)/);
  assert.doesNotMatch(venueFaqSource + venueFaqRender, /Platform A|Platform B/);
  assert.doesNotMatch(venueFaqSource, /const rebate = access\.rebatePercent/);
});

test("mobile navigation owns localized labels for the first international wave", () => {
  for (const locale of ["ja", "ko", "tr", "es", "fr", "de", "ru", "ar", "id", "vi", "it", "pt-BR", "zh-Hant"]) {
    assert.match(mobileBottomNav, new RegExp(`(?:[\\"'])?${locale.replace("-", "[-]")}(?:[\\"'])?:\\s*\\{`));
  }
  assert.match(mobileBottomNav, /labels\.directory/);
  assert.match(mobileBottomNav, /label: homeCopy\([\s\S]*?\)\.compareDimensionLabels\[1\]/);
  assert.match(mobileBottomNav, /href: brazil \? "\/br\/custos" : homeHref\("#bleed-analyzer"\)/);
  assert.match(mobileBottomNav, /labels\.campaigns/);
  assert.match(mobileBottomNav, /labels\.compare/);
  assert.match(mobileBottomNav, /labels\.search/);
  assert.match(mobileBottomNav, /data-cta-kind="research"/);
  assert.match(mobileBottomNav, /mobile-nav-\$\{item\.id\}/);
});

// Test the actual bootstrap component with a deterministic hook runner. Browser
// acceptance still proves React hydration; this locks its first/second URL passes.
async function runBootstrapFrames(browserUrl, prerenderState, { clientRender = false, serverHtml = true } = {}) {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const path = await import("node:path");
  const { execFileSync } = await import("node:child_process");
  const root = path.resolve(import.meta.dirname,"..");
  const dir = await mkdtemp(path.join(root,"tests/.tmp-bootstrap-passes-"));
  try {
    await writeFile(path.join(dir,"react.mjs"), `
      let cells=[], cursor=0, pass=0, effects=[];
      export const useState=initial=>{const i=cursor++;if(!(i in cells))cells[i]=typeof initial==='function'?initial():initial;return[cells[i],value=>{cells[i]=value}];};
      export const useEffect=fn=>{if(pass===0)effects.push(fn)};
      const React={useState,useEffect,StrictMode:'strict',createElement:(type,props,...children)=>({type,props:{...props,children}})};
      function walk(node){if(!node)return;if(Array.isArray(node)){node.forEach(walk);return}if(typeof node.type==='function'){walk(node.type(node.props));return}walk(node.props?.children)}
      export function run(app){cursor=0;walk(app);effects.reverse().forEach(fn=>fn());pass=1;cursor=0;walk(app)}
      export default React;
    `);
    await writeFile(path.join(dir,"dom.mjs"), `import {run} from './react.mjs';export const hydrateRoot=(root,app)=>{globalThis.__mode='hydrate';run(app)};export const createRoot=()=>({render:app=>{globalThis.__mode='client';run(app)}});`);
    await writeFile(path.join(dir,"app.mjs"), `import React from './react.mjs';export function App(props){globalThis.__frames.push(props);React.useEffect(()=>{window.location.href='https://nexualpha.com/child-effect-mutated-url'});return null}export function preloadCurrentRouteModulesForUrl(){return undefined}`);
    let source=main.replace('import React from "react";','import React from "./react.mjs";')
      .replace('from "react-dom/client"','from "./dom.mjs"').replace('from "./App.jsx"','from "./app.mjs"')
      .replace(/import \{ installCtaAnalytics \}[^;]+;/,'const installCtaAnalytics=()=>{};')
      .replace(/import \{ signalRootHydrated \}[^;]+;/,'const signalRootHydrated=()=>{};')
      .replace(/import "[^"\n]+\.css";/g,"")
      // Class c: PR #78 added a real hero context dependency to the copied bootstrap source.
      .replace('from "./components/v7/home7-hero-variants.js"', `from ${JSON.stringify(path.join(root,"src/components/v7/home7-hero-variants.js"))}`)
      .replace(/from "(\.\/data\/[^"\n]+)"/g,(_,rel)=>`from ${JSON.stringify(path.resolve(root,"src",rel))}`);
    await writeFile(path.join(dir,"main.jsx"),source);
    await writeFile(path.join(dir,"entry.mjs"), `
      globalThis.__frames=[];globalThis.window={location:{href:${JSON.stringify(browserUrl)}}};
      const root={hasChildNodes:()=>${serverHtml},dataset:{nexualphaClientRender:${JSON.stringify(clientRender?"true":"")}}};
      // Class c: the fixture supplies browser listener APIs used by the real click installers.
      globalThis.document={addEventListener(){},removeEventListener(){},documentElement:{dataset:{}},getElementById:id=>id==='root'?root:{textContent:${JSON.stringify(JSON.stringify(prerenderState))}}};
      import('./main.jsx').then(()=>setTimeout(()=>console.log(JSON.stringify({mode:globalThis.__mode,frames:globalThis.__frames})),0)).catch(e=>{console.error(e);process.exitCode=1});
    `);
    const bundle=path.join(dir,"bundle.cjs");
    execFileSync(path.join(root,"node_modules/.bin/esbuild"),[path.join(dir,"entry.mjs"),"--bundle","--format=cjs","--platform=node",`--outfile=${bundle}`,"--log-level=warning"],{cwd:root,stdio:"pipe"});
    return JSON.parse(execFileSync("node",[bundle],{cwd:root,encoding:"utf8"}));
  }finally{await rm(dir,{recursive:true,force:true});}
}

test("bootstrap matches neutral SSR first, then restores the captured decision URL despite child effects", async()=>{
  const url="https://nexualpha.com/pt-br/exchanges/bitget?market=BR&product=spot&account_stage=new_account&funding=Pix#registration-path";
  const result=await runBootstrapFrames(url,{pathname:"/exchanges/bitget",locale:"pt-BR",version:"nexualpha-prerender-v1"});
  assert.equal(result.mode,"hydrate");
  assert.equal(result.frames[0].initialUrl,"https://nexualpha.com/exchanges/bitget?locale=pt-BR");
  assert.equal(result.frames[1].initialUrl,url);
  assert.equal(result.frames[0].initialLocale,undefined);
});

test("bootstrap forces explicit SSR English before restoring Japanese query locale",async()=>{
  const url="https://nexualpha.com/?locale=ja";
  const result=await runBootstrapFrames(url,{pathname:"/",locale:"en",version:"nexualpha-prerender-v1"});
  assert.equal(result.frames[0].initialUrl,"https://nexualpha.com/?locale=en");
  assert.equal(result.frames[1].initialUrl,url);
});

test("bootstrap fallback and explicit client-render keep the full browser URL from their first pass",async()=>{
  const url="https://nexualpha.com/br?platform=okx&amount=2500&spot_fee_bps=8&deposit_fee_pct=0.5&deposit_fixed_brl=2";
  for(const options of [{serverHtml:false},{clientRender:true}]){
    const result=await runBootstrapFrames(url,{pathname:"/br",locale:"pt-BR",version:"nexualpha-prerender-v1"},options);
    assert.equal(result.mode,"client");assert.equal(result.frames[0].initialUrl,url);
  }
});

test("two-pass bootstrap preserves all 15 locale venue/comparison contexts and neutral tracking routes",async()=>{
  const { buildHydrationBootstrap }=await import("../src/data/hydration-bootstrap.js");
  const { localizedHref, LOCALE_PREFIX_BY_CODE }=await import("../src/data/locale-routing.js");
  for(const locale of Object.keys(LOCALE_PREFIX_BY_CODE))for(const pathname of ["/exchanges/bitget","/compare/bybit-vs-bitget"]){
    const browserUrl=`https://nexualpha.com${localizedHref(pathname,{locale,market:"BR",product:"spot",account_stage:"new_account",funding:"Pix"})}`;
    const result=buildHydrationBootstrap({browserUrl,prerenderState:{pathname,locale},hasServerHtml:true});
    const neutral=new URL(result.initialUrl);assert.equal(neutral.pathname,pathname);assert.equal(neutral.search,`?locale=${encodeURIComponent(locale)}`);
    assert.equal(result.browserUrl,browserUrl);assert.equal(result.hydrate,true);
  }
  for(const search of ["","?locale=ja","?utm_source=test&gclid=test"]){
    const browserUrl=`https://nexualpha.com/exchanges/bitget${search}`;
    const result=buildHydrationBootstrap({browserUrl,prerenderState:{pathname:"/exchanges/bitget",locale:"en"},hasServerHtml:true});
    assert.equal(result.hydrate,true);assert.equal(result.browserUrl,browserUrl);
  }
});

test("captured BR widget URL switches from generic neutral embed and restores amount, platform and fee inputs",async()=>{
  const url="https://nexualpha.com/embed/calculator?market=BR&product=spot&platform=okx&amount=2500&spot_fee_bps=8&deposit_fee_pct=0.5&deposit_fixed_brl=2";
  const result=await runBootstrapFrames(url,{pathname:"/embed/calculator",locale:"en",version:"nexualpha-prerender-v1"});
  const condition=app.match(/const isBrazilWidget = ([\s\S]*?);/)[1];
  const choosesBrazil=new Function("embedUrl",`return ${condition}`);
  assert.equal(choosesBrazil(new URL(result.frames[0].initialUrl)),false);
  assert.equal(choosesBrazil(new URL(result.frames[1].initialUrl)),true,"different component type mounts with captured full URL");
  const { decisionStateFromUrl }=await import("../src/data/decision-state.js");
  const restored=decisionStateFromUrl(result.frames[1].initialUrl);
  assert.equal(restored.platform,"okx");assert.equal(restored.amount,2500);assert.equal(restored.spotFeeBps,8);assert.equal(restored.depositFeePercent,0.5);assert.equal(restored.depositFixedBrl,2);
  const { mkdtemp,writeFile,rm }=await import("node:fs/promises");const path=await import("node:path");const {execFileSync}=await import("node:child_process");
  const root=path.resolve(import.meta.dirname,"..");const dir=await mkdtemp(path.join(root,"tests/.tmp-br-bootstrap-inputs-"));
  try{
    const entry=path.join(dir,"entry.mjs"),bundle=path.join(dir,"bundle.cjs");
    await writeFile(entry,`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {BrazilCostEmbed} from '../../src/components/v3/international/BrazilCostEmbed.jsx';import {BrazilDecisionPage} from '../../src/components/v3/international/BrazilDecisionPage.jsx';console.log(JSON.stringify({embed:renderToStaticMarkup(React.createElement(BrazilCostEmbed,{initialUrl:${JSON.stringify(result.frames[1].initialUrl)}})),page:renderToStaticMarkup(React.createElement(BrazilDecisionPage,{initialUrl:${JSON.stringify(url.replace('/embed/calculator','/br/custos'))},pathname:'/br/custos'}))}));`);
    execFileSync(path.join(root,"node_modules/.bin/esbuild"),[entry,"--bundle","--format=cjs","--platform=node",`--outfile=${bundle}`,"--loader:.css=empty","--log-level=warning"],{cwd:root,stdio:"pipe"});
    const rendered=JSON.parse(execFileSync("node",[bundle],{cwd:root,encoding:"utf8"}));
    for(const html of Object.values(rendered))for(const [name,value] of [["amount","2500"],["spot_fee_bps","8"],["deposit_fee_pct","0.5"],["deposit_fixed_brl","2"]])assert.match(html,new RegExp(`<input[^>]*name="${name}"[^>]*value="${value}"`));
    assert.match(rendered.page,/<option value="okx" selected="">/);
  }finally{await rm(dir,{recursive:true,force:true});}
});

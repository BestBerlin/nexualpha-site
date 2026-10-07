import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { localeManifest, supportedLocales } from "./content/locale-manifest";
import { intlLocale, v2Copy } from "./content/v2-copy";
import { getTextDirection, localStorageKey, setLocale as setParaglideLocale } from "./paraglide/runtime.js";
import { loadSiteView } from "./data/site-data.ts";
import { marketCommand, presentationModel, neutralVenueCatalog } from "./data/market-command";
import { DesignSystem } from "./components/DesignSystem";
import { NexuAlphaWordmark } from "./components/brand/NexuAlphaWordmark";
import { researchRoute } from "./data/official-campaign-model";
import { v3Copy } from "./data/v3-product";
import { storedLocale, validComparison, cleanSelection, installHashNavigation } from "./data/browser-state";
import { VenueYellowPages } from "./components/v3/VenueYellowPages";
import { CrossroadsCompare } from "./components/v3/CrossroadsCompare";
import { PlatformMatcher } from "./components/v3/PlatformMatcher";
import { CleanFooter } from "./components/v3/CleanFooter";
import { headerNavigationState } from "./data/header-navigation-state.js";
import { MobileBottomNav } from "./components/v3/MobileBottomNav";
import { venueDatabase } from "./data/venue-database.js";
import { TOPIC_SLUGS } from "./data/topic-guides-data.js";
import { TOKENIZED_ASSET_SLUGS } from "./data/tokenized-assets-cluster.js";
import { injectSeoMetadata } from "./data/seo-injection.js";
import { getBrazilPage } from "./data/brazil-market.js";
import { trackGrowthDecision } from "./data/cta-analytics.js";
import { readDecisionPassport } from "./data/decision-passport.js";
import { resolveMarketLocale } from "./data/market-policy.js";
import { localizedHref, parsePublicRoute } from "./data/locale-routing.js";
import { NewsListPage as EagerNewsListPage } from "./components/v3/news/NewsListPage.jsx";
import { signalInteractionReady } from "./data/hydration-readiness.js";
import {
  modulePathsForRoute,
  preloadRouteModules,
  readRouteModuleExport,
  registerRouteModuleLoaders,
} from "./data/route-module-cache.js";

const deferredPageModules = import.meta.env.SSR ? {} : import.meta.glob([
  "./components/finder/CommandFinder.jsx",
  "./components/finder/SearchDialog.jsx",
  "./components/v3/V3Pages.jsx",
  "./components/v3/activity/OfficialResearch.jsx",
  "./components/v3/news/NewsDetailPage.jsx",
  "./components/v3/LeanHero.jsx",
  "./components/v3/RebateTickerBar.jsx",
  "./components/v3/CampaignRadar.jsx",
  "./components/v3/FeeBenchmarkTerminal.jsx",
  "./components/v3/OnChainLiquidityBoard.jsx",
  "./components/v3/MarketFearGreedPanel.jsx",
  "./components/v3/KolLandingPage.jsx",
  "./components/v3/TradingBleedAnalyzer.jsx",
  "./components/v3/TelegramBotHub.jsx",
  "./components/v3/LiveConversionProof.jsx",
  "./components/v3/MethodologyPage.jsx",
  "./components/v3/EmbedCalculator.jsx",
  "./components/v3/PartnerEmbedGuide.jsx",
  "./components/v3/TopicGuidePage.jsx",
  "./components/v3/FactbookPage.jsx",
  "./components/v3/CollectionHubPage.jsx",
  "./components/v3/TokenizedAssetsPage.jsx",
  "./components/v3/international/BrazilDecisionPage.jsx",
  "./components/v3/international/BrazilCostEmbed.jsx",
  "./components/v3/international/RegionalMarketPreview.jsx",
]);

if (!import.meta.env.SSR) registerRouteModuleLoaders(deferredPageModules);

const ssrDeferredPageModules = import.meta.env.SSR ? import.meta.glob([
  "./components/finder/CommandFinder.jsx",
  "./components/finder/SearchDialog.jsx",
  "./components/v3/V3Pages.jsx",
  "./components/v3/activity/OfficialResearch.jsx",
  "./components/v3/news/NewsDetailPage.jsx",
  "./components/v3/LeanHero.jsx",
  "./components/v3/RebateTickerBar.jsx",
  "./components/v3/CampaignRadar.jsx",
  "./components/v3/FeeBenchmarkTerminal.jsx",
  "./components/v3/OnChainLiquidityBoard.jsx",
  "./components/v3/MarketFearGreedPanel.jsx",
  "./components/v3/KolLandingPage.jsx",
  "./components/v3/TradingBleedAnalyzer.jsx",
  "./components/v3/TelegramBotHub.jsx",
  "./components/v3/LiveConversionProof.jsx",
  "./components/v3/MethodologyPage.jsx",
  "./components/v3/EmbedCalculator.jsx",
  "./components/v3/PartnerEmbedGuide.jsx",
  "./components/v3/TopicGuidePage.jsx",
  "./components/v3/FactbookPage.jsx",
  "./components/v3/CollectionHubPage.jsx",
  "./components/v3/TokenizedAssetsPage.jsx",
  "./components/v3/international/BrazilDecisionPage.jsx",
  "./components/v3/international/BrazilCostEmbed.jsx",
  "./components/v3/international/RegionalMarketPreview.jsx",
], { eager: true }) : {};

function deferredComponent(path, exportName) {
  if (import.meta.env.SSR) {
    const module = ssrDeferredPageModules[path];
    if (!module?.[exportName]) throw new Error(`Missing SSR component export ${exportName} from ${path}`);
    return module[exportName];
  }
  const DeferredComponent = (props) => {
    const Component = readRouteModuleExport(path, exportName);
    return <Component {...props} />;
  };
  DeferredComponent.displayName = `DeferredComponent(${exportName})`;
  return DeferredComponent;
}

const CommandFinder = deferredComponent("./components/finder/CommandFinder.jsx", "CommandFinder");
const SearchDialog = deferredComponent("./components/finder/SearchDialog.jsx", "SearchDialog");
const ActivityCenterPage = deferredComponent("./components/v3/V3Pages.jsx", "ActivityCenterPage");
const ActivityDetailPage = deferredComponent("./components/v3/V3Pages.jsx", "ActivityDetailPage");
const CompareDeepPage = deferredComponent("./components/v3/V3Pages.jsx", "CompareDeepPage");
const NotFoundPage = deferredComponent("./components/v3/V3Pages.jsx", "NotFoundPage");
const VenueDetailPage = deferredComponent("./components/v3/V3Pages.jsx", "VenueDetailPage");
const OfficialResearchPage = deferredComponent("./components/v3/activity/OfficialResearch.jsx", "OfficialResearchPage");
const NewsListPage = EagerNewsListPage;
const NewsDetailPage = deferredComponent("./components/v3/news/NewsDetailPage.jsx", "NewsDetailPage");
const LeanHero = deferredComponent("./components/v3/LeanHero.jsx", "LeanHero");
const RebateTickerBar = deferredComponent("./components/v3/RebateTickerBar.jsx", "RebateTickerBar");
const CampaignRadar = deferredComponent("./components/v3/CampaignRadar.jsx", "CampaignRadar");
const FeeBenchmarkTerminal = deferredComponent("./components/v3/FeeBenchmarkTerminal.jsx", "FeeBenchmarkTerminal");
const OnChainLiquidityBoard = deferredComponent("./components/v3/OnChainLiquidityBoard.jsx", "OnChainLiquidityBoard");
const MarketFearGreedPanel = deferredComponent("./components/v3/MarketFearGreedPanel.jsx", "MarketFearGreedPanel");
const KolLandingPage = deferredComponent("./components/v3/KolLandingPage.jsx", "KolLandingPage");
const TradingBleedAnalyzer = deferredComponent("./components/v3/TradingBleedAnalyzer.jsx", "TradingBleedAnalyzer");
const TelegramBotHub = deferredComponent("./components/v3/TelegramBotHub.jsx", "TelegramBotHub");
const LiveConversionProof = deferredComponent("./components/v3/LiveConversionProof.jsx", "LiveConversionProof");
const AuditMethodologyPage = deferredComponent("./components/v3/MethodologyPage.jsx", "MethodologyPage");
const EmbedCalculator = deferredComponent("./components/v3/EmbedCalculator.jsx", "EmbedCalculator");
const PartnerEmbedGuide = deferredComponent("./components/v3/PartnerEmbedGuide.jsx", "PartnerEmbedGuide");
const TopicGuidePage = deferredComponent("./components/v3/TopicGuidePage.jsx", "TopicGuidePage");
const FactbookPage = deferredComponent("./components/v3/FactbookPage.jsx", "FactbookPage");
const CollectionHubPage = deferredComponent("./components/v3/CollectionHubPage.jsx", "CollectionHubPage");
const TokenizedAssetsPage = deferredComponent("./components/v3/TokenizedAssetsPage.jsx", "TokenizedAssetsPage");
const BrazilDecisionPage = deferredComponent("./components/v3/international/BrazilDecisionPage.jsx", "BrazilDecisionPage");
const BrazilEntryLink = deferredComponent("./components/v3/international/BrazilDecisionPage.jsx", "BrazilEntryLink");
const BrazilCostEmbed = deferredComponent("./components/v3/international/BrazilCostEmbed.jsx", "BrazilCostEmbed");
const RegionalMarketPreview = deferredComponent("./components/v3/international/RegionalMarketPreview.jsx", "RegionalMarketPreview");
const REGIONAL_DECISION_DOCK_MARKETS = new Set(["JP", "KR", "TR", "MX", "ID"]);

function InteractionReadySignal({ scope }) {
  useEffect(() => {
    signalInteractionReady(scope);
  }, [scope]);
  return null;
}

function ScopedContent({ children, scope = "page-content", defer = true }) {
  return <>
    <template data-nexualpha-scope-start={scope} />
    {defer ? <React.Suspense fallback={null}>{children}<InteractionReadySignal scope={scope} /></React.Suspense> : <>{children}<InteractionReadySignal scope={scope} /></>}
    <template data-nexualpha-scope-end={scope} />
  </>;
}

function DeferredBoundary({ children, scope = "page-content" }) {
  return <ScopedContent scope={scope}>{children}</ScopedContent>;
}

const normalizeRequestedLocale = (requested) => {
  if (!requested) return null;
  if (supportedLocales.includes(requested)) return requested;
  const base = String(requested).split(/[-_]/)[0].toLowerCase();
  const alias = { zh: "zh-Hans", pt: "pt-BR" }[base] || base;
  return supportedLocales.includes(alias) ? alias : null;
};

const readLocale = (initialUrl) => {
  const sourceUrl = initialUrl
    ? new URL(initialUrl, "https://nexualpha.com")
    : (typeof window !== "undefined" ? new URL(window.location.href) : null);
  if (!sourceUrl) return "en";
  const requested = sourceUrl.searchParams.get("locale");
  const publicRoute = parsePublicRoute(sourceUrl.pathname, sourceUrl.searchParams);
  // Brazil decision routes are original pt-BR pages. Letting an arbitrary UI
  // locale override them creates a mixed-language page and can even apply RTL
  // to Portuguese content, so the route language owns the interface here.
  if (getBrazilPage(publicRoute.contentPathname || sourceUrl.pathname)) return "pt-BR";
  if (publicRoute.localeSource === "path") return publicRoute.locale;
  const normalized = normalizeRequestedLocale(requested);
  if (normalized) return normalized;
  if (publicRoute.localeSource === "default" && isGenericEnglishDefaultRoute(publicRoute.contentPathname)) return "en";
  const policyLocale = resolveMarketLocale({ pathname: sourceUrl.pathname, locale: normalized || requested, market: sourceUrl.searchParams.get("market") });
  if (supportedLocales.includes(policyLocale)) return policyLocale;
  if (typeof window === "undefined") return "en";
  try { return storedLocale(window.localStorage, localStorageKey, supportedLocales); }
  catch { return "en"; }
};

const readComparison = () => {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem("nexualpha-comparison") || "null");
    if (Array.isArray(saved)) return cleanSelection(saved, neutralVenueCatalog);
  } catch { /* A blocked session store must not prevent browsing. */ }
  return ["binance", "okx"];
};

const withLocale = (locale, href) => localizedHref(href, { locale });

const GENERIC_ENGLISH_DEFAULT_EXACT_ROUTES = new Set(["/", "/rates", "/onchain", "/methodology", "/partners", "/telegram"]);
const GENERIC_ENGLISH_DEFAULT_PREFIXES = ["/exchanges", "/compare", "/topics", "/factbook", "/activities", "/news", "/markets"];

const isGenericEnglishDefaultRoute = (pathname = "/") => {
  const normalized = String(pathname || "/").split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  return GENERIC_ENGLISH_DEFAULT_EXACT_ROUTES.has(normalized)
    || GENERIC_ENGLISH_DEFAULT_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
};

const homeNavigationCopy = (locale) => {
  if (locale === "zh-Hant" || locale === "zh-TW") return {
    label: "本頁導覽",
    compare: "比較",
    analyzer: "費用體檢",
    venues: "平台目錄",
    research: "研究工具",
  };
  if (locale.startsWith("zh")) return {
    label: "本页导航",
    compare: "比较",
    analyzer: "费用体检",
    venues: "平台目录",
    research: "研究工具",
  };
  const localized = {
    ja: { label: "このページ", compare: "比較", analyzer: "手数料チェック", venues: "プラットフォーム", research: "調査ツール" },
    ko: { label: "이 페이지", compare: "비교", analyzer: "수수료 확인", venues: "플랫폼", research: "리서치 도구" },
    tr: { label: "Bu sayfada", compare: "Karşılaştır", analyzer: "Ücret kontrolü", venues: "Platformlar", research: "Araştırma araçları" },
    ru: { label: "На этой странице", compare: "Сравнить", analyzer: "Проверка комиссий", venues: "Платформы", research: "Инструменты исследования" },
    de: { label: "Auf dieser Seite", compare: "Vergleichen", analyzer: "Gebühren prüfen", venues: "Plattformen", research: "Recherchetools" },
    fr: { label: "Sur cette page", compare: "Comparer", analyzer: "Vérifier les frais", venues: "Plateformes", research: "Outils de recherche" },
    es: { label: "En esta página", compare: "Comparar", analyzer: "Revisar comisiones", venues: "Plataformas", research: "Herramientas de investigación" },
    "pt-BR": { label: "Nesta página", compare: "Comparar", analyzer: "Verificar taxas", venues: "Plataformas", research: "Ferramentas de pesquisa" },
    it: { label: "In questa pagina", compare: "Confronta", analyzer: "Controllo commissioni", venues: "Piattaforme", research: "Strumenti di ricerca" },
    id: { label: "Di halaman ini", compare: "Bandingkan", analyzer: "Cek biaya", venues: "Platform", research: "Alat riset" },
    vi: { label: "Trên trang này", compare: "So sánh", analyzer: "Kiểm tra phí", venues: "Nền tảng", research: "Công cụ nghiên cứu" },
    ar: { label: "في هذه الصفحة", compare: "مقارنة", analyzer: "فحص الرسوم", venues: "المنصات", research: "أدوات البحث" },
  };
  if (localized[locale]) return localized[locale];
  return { label: "On this page", compare: "Compare", analyzer: "Fee check", venues: "Platforms", research: "Research tools" };
};

function HomeSectionNav({ locale }) {
  const text = homeNavigationCopy(locale);
  return <nav className="home-section-nav v2-shell" aria-label={text.label}>
    <span className="home-section-nav__label">{text.label}</span>
    <a href="#compare">{text.compare}</a>
    <a href="#bleed-analyzer">{text.analyzer}</a>
    <a href="#exchanges">{text.venues}</a>
    <a href="#research-tools">{text.research}</a>
  </nav>;
}

function HomeResearchDrawer({ locale }) {
  const [researchOpen, setResearchOpen] = useState(false);
  const researchDrawerRef = useRef(null);
  useEffect(() => {
    setResearchOpen(Boolean(researchDrawerRef.current?.open));
  }, []);
  const isHant = locale === "zh-Hant" || locale === "zh-TW";
  const isZh = locale.startsWith("zh");
  const text = isHant
    ? { summary: "展開研究工具", note: "費率、鏈上流動性、Telegram 與市場狀態集中在這裡" }
    : isZh
      ? { summary: "展开研究工具", note: "费率、链上流动性、Telegram 与市场状态集中在这里" }
      : ({
        ja: { summary: "調査ツールを開く", note: "手数料、オンチェーン流動性、Telegram、市場状況をまとめて確認" },
        ko: { summary: "리서치 도구 열기", note: "수수료, 온체인 유동성, Telegram과 시장 상태를 한곳에서 확인" },
        tr: { summary: "Araştırma araçlarını aç", note: "Ücretler, zincir üstü likidite, Telegram ve piyasa durumu" },
        ru: { summary: "Открыть инструменты исследования", note: "Комиссии, ончейн-ликвидность, Telegram и состояние рынка" },
        de: { summary: "Recherchetools öffnen", note: "Gebühren, On-Chain-Liquidität, Telegram und Marktstatus" },
        fr: { summary: "Ouvrir les outils de recherche", note: "Frais, liquidité on-chain, Telegram et état du marché" },
        es: { summary: "Abrir herramientas de investigación", note: "Comisiones, liquidez on-chain, Telegram y estado del mercado" },
        "pt-BR": { summary: "Abrir ferramentas de pesquisa", note: "Taxas, liquidez on-chain, Telegram e estado do mercado" },
        it: { summary: "Apri strumenti di ricerca", note: "Commissioni, liquidità on-chain, Telegram e stato del mercato" },
        id: { summary: "Buka alat riset", note: "Biaya, likuiditas on-chain, Telegram, dan kondisi pasar" },
        vi: { summary: "Mở công cụ nghiên cứu", note: "Phí, thanh khoản on-chain, Telegram và trạng thái thị trường" },
        ar: { summary: "فتح أدوات البحث", note: "الرسوم والسيولة على السلسلة وTelegram وحالة السوق" },
      }[locale] || { summary: "Open research tools", note: "Fees, on-chain liquidity, Telegram and market state in one section" });
  return <details className="home-research-drawer" id="research-tools" ref={researchDrawerRef} onToggle={(event) => {
    if (event.target === event.currentTarget) setResearchOpen(event.currentTarget.open);
  }}>
    <summary><strong>{text.summary}</strong><span>{text.note}</span><b aria-hidden="true">＋</b></summary>
    <div className="home-research-drawer__body">
      {researchOpen && <LiveConversionProof locale={locale} />}
      <CampaignRadar locale={locale} />
      <FeeBenchmarkTerminal locale={locale} />
      <OnChainLiquidityBoard locale={locale} />
      <TelegramBotHub locale={locale} />
      <MarketFearGreedPanel locale={locale} />
    </div>
  </details>;
}

const crawlPriorityLinks = Object.freeze({
  brazil: [
    ["/br/comparar", "Brazil platform comparison"],
    ["/br/conta", "Brazil account route"],
    ["/br/custos", "Brazil cost check"],
    ["/br/kyc-cpf", "Brazil KYC and CPF"],
    ["/br/pix", "Brazil Pix deposit route"],
    ["/br/saque-pix", "Brazil Pix withdrawal route"],
  ],
  compare: [
    ["/compare/binance-vs-kraken", "Binance vs Kraken"],
    ["/compare/binance-vs-mexc", "Binance vs MEXC"],
    ["/compare/binance-vs-okx", "Binance vs OKX"],
    ["/compare/bybit-vs-bitget", "Bybit vs Bitget"],
    ["/compare/hyperliquid-vs-dydx", "Hyperliquid vs dYdX"],
    ["/compare/okx-vs-bybit", "OKX vs Bybit"],
    ["/compare/okx-vs-mexc", "OKX vs MEXC"],
  ],
  tools: [
    ["/rates", "Exchange fee benchmark"],
  ],
  tokenized: [
    ["/topics/tokenized-assets", "Tokenized assets hub"],
    ["/topics/tokenized-stocks-vs-perpetuals", "Tokenized stocks vs perpetuals"],
    ["/topics/tokenized-treasuries", "Tokenized Treasuries checklist"],
  ],
});

function CrawlPriorityLinks({ locale = "en", scope = "home" }) {
  const copy = ({
    "zh-Hans": { label: "相关研究", note: "继续比较地区、平台、费率与资产结构", brazil: "巴西决策", compare: "平台比较", tools: "费率工具", tokenized: "代币化资产" },
    "zh-Hant": { label: "相關研究", note: "繼續比較地區、平台、費率與資產結構", brazil: "巴西決策", compare: "平台比較", tools: "費率工具", tokenized: "代幣化資產" },
    "pt-BR": { label: "Pesquisas relacionadas", note: "Compare regiões, plataformas, taxas e estruturas de ativos", brazil: "Decisão Brasil", compare: "Comparações", tools: "Taxas", tokenized: "Ativos tokenizados" },
    es: { label: "Investigación relacionada", note: "Sigue comparando regiones, plataformas, comisiones y estructuras de activos", brazil: "Decisiones de Brasil", compare: "Comparaciones", tools: "Herramientas de comisiones", tokenized: "Activos tokenizados" },
    fr: { label: "Recherches associées", note: "Poursuivez la comparaison des régions, plateformes, frais et structures d’actifs", brazil: "Décisions Brésil", compare: "Comparaisons", tools: "Outils de frais", tokenized: "Actifs tokenisés" },
    de: { label: "Verwandte Analysen", note: "Vergleichen Sie Regionen, Plattformen, Gebühren und Asset-Strukturen weiter", brazil: "Brasilien-Entscheidungen", compare: "Vergleiche", tools: "Gebühren-Tools", tokenized: "Tokenisierte Assets" },
    ja: { label: "関連リサーチ", note: "地域、プラットフォーム、手数料、資産構造を続けて比較できます", brazil: "ブラジルの選択肢", compare: "比較", tools: "手数料ツール", tokenized: "トークン化資産" },
    ko: { label: "관련 리서치", note: "지역, 플랫폼, 수수료와 자산 구조를 계속 비교하세요", brazil: "브라질 선택지", compare: "비교", tools: "수수료 도구", tokenized: "토큰화 자산" },
    ar: { label: "أبحاث ذات صلة", note: "تابع مقارنة المناطق والمنصات والرسوم وهياكل الأصول", brazil: "خيارات البرازيل", compare: "المقارنات", tools: "أدوات الرسوم", tokenized: "الأصول المرمّزة" },
    tr: { label: "İlgili araştırmalar", note: "Bölgeleri, platformları, ücretleri ve varlık yapılarını karşılaştırmaya devam edin", brazil: "Brezilya seçenekleri", compare: "Karşılaştırmalar", tools: "Ücret araçları", tokenized: "Tokenleştirilmiş varlıklar" },
    ru: { label: "Связанные исследования", note: "Продолжайте сравнивать регионы, платформы, комиссии и структуры активов", brazil: "Решения для Бразилии", compare: "Сравнения", tools: "Инструменты комиссий", tokenized: "Токенизированные активы" },
    id: { label: "Riset terkait", note: "Lanjutkan perbandingan wilayah, platform, biaya, dan struktur aset", brazil: "Pilihan Brasil", compare: "Perbandingan", tools: "Alat biaya", tokenized: "Aset tertokenisasi" },
    vi: { label: "Nghiên cứu liên quan", note: "Tiếp tục so sánh khu vực, nền tảng, phí và cấu trúc tài sản", brazil: "Lựa chọn Brazil", compare: "So sánh", tools: "Công cụ phí", tokenized: "Tài sản mã hóa" },
    it: { label: "Ricerche correlate", note: "Continua a confrontare regioni, piattaforme, commissioni e strutture degli asset", brazil: "Scelte per il Brasile", compare: "Confronti", tools: "Strumenti commissioni", tokenized: "Asset tokenizzati" },
  })[locale] || { label: "Related research", note: "Continue across regions, platforms, fees and asset structures", brazil: "Brazil decisions", compare: "Comparisons", tools: "Fee tools", tokenized: "Tokenized assets" };
  const localizedLabels = {
    "zh-Hans": ["交易平台费率基准", "代币化资产中心", "代币化股票与永续合约", "代币化美债核对清单"],
    "zh-Hant": ["交易平台費率基準", "代幣化資產中心", "代幣化股票與永續合約", "代幣化美債核對清單"],
    "pt-BR": ["Comparador de taxas", "Central de ativos tokenizados", "Ações tokenizadas e perpétuos", "Checklist de títulos tokenizados"],
    es: ["Comparador de comisiones", "Centro de activos tokenizados", "Acciones tokenizadas y perpetuos", "Lista de bonos tokenizados"],
    fr: ["Comparateur de frais", "Centre des actifs tokenisés", "Actions tokenisées et perpétuels", "Liste des bons tokenisés"],
    de: ["Gebührenvergleich", "Zentrum für tokenisierte Vermögenswerte", "Tokenisierte Aktien und Perpetuals", "Prüfliste für tokenisierte Staatsanleihen"],
    ja: ["手数料比較", "トークン化資産ハブ", "トークン化株式と無期限先物", "トークン化国債チェックリスト"],
    ko: ["수수료 비교", "토큰화 자산 허브", "토큰화 주식과 무기한 선물", "토큰화 국채 점검표"],
    ar: ["مقارنة الرسوم", "مركز الأصول المرمّزة", "الأسهم المرمّزة والعقود الدائمة", "قائمة تحقق للخزانة المرمّزة"],
    tr: ["Ücret karşılaştırması", "Tokenleştirilmiş varlık merkezi", "Tokenleştirilmiş hisseler ve sürekli vadeli işlemler", "Tokenleştirilmiş tahvil kontrol listesi"],
    ru: ["Сравнение комиссий", "Центр токенизированных активов", "Токенизированные акции и бессрочные контракты", "Проверка токенизированных казначейских бумаг"],
    id: ["Perbandingan biaya", "Pusat aset tertokenisasi", "Saham tertokenisasi dan kontrak perpetual", "Daftar periksa obligasi pemerintah tertokenisasi"],
    vi: ["So sánh phí", "Trung tâm tài sản mã hóa", "Cổ phiếu mã hóa và hợp đồng vĩnh cửu", "Danh sách kiểm tra trái phiếu kho bạc mã hóa"],
    it: ["Confronto commissioni", "Centro degli asset tokenizzati", "Azioni tokenizzate e perpetui", "Checklist dei titoli di Stato tokenizzati"],
  }[locale] || ["Exchange fee benchmark", "Tokenized assets hub", "Tokenized stocks vs perpetuals", "Tokenized Treasuries checklist"];
  const labelOverrides = new Map([
    ["/rates", localizedLabels[0]],
    ["/topics/tokenized-assets", localizedLabels[1]],
    ["/topics/tokenized-stocks-vs-perpetuals", localizedLabels[2]],
    ["/topics/tokenized-treasuries", localizedLabels[3]],
  ]);
  const groupsByScope = {
    home: ["brazil", "compare", "tools", "tokenized"],
    directory: ["compare", "tools", "tokenized"],
    rates: ["compare", "tokenized"],
    compare: ["tools", "tokenized"],
    tokenized: ["compare", "tools"],
  };
  const groups = (groupsByScope[scope] || groupsByScope.home)
    .filter((group) => group !== "brazil" || locale === "pt-BR" || locale === "en");
  return <nav className="crawl-priority-links v2-shell" data-crawl-priority-links={scope} aria-label={copy.label}>
    <details className="crawl-priority-links__details">
      <summary className="crawl-priority-links__intro">
        <strong>{copy.label}</strong>
        <span>{copy.note}</span>
        <b aria-hidden="true">＋</b>
      </summary>
      <div className="crawl-priority-links__groups">
        {groups.map((group) => (
          <div className="crawl-priority-links__group" key={group}>
            <span>{copy[group]}</span>
            {crawlPriorityLinks[group].map(([href, label]) => (
              <a key={href} href={href.startsWith("/br") ? href : localizedHref(href, { locale })}>{labelOverrides.get(href) || label}</a>
            ))}
          </div>
        ))}
      </div>
    </details>
  </nav>;
}

function routeState(venues, initialUrl) {
  const sourceUrl = initialUrl
    ? new URL(initialUrl, "https://nexualpha.com")
    : (typeof window !== "undefined" ? new URL(window.location.href) : null);
  if (!sourceUrl) return { name: "home" };
  const publicRoute = parsePublicRoute(sourceUrl.pathname, sourceUrl.searchParams);
  const pathname = publicRoute.contentPathname;
  const search = sourceUrl.search;
  if (getBrazilPage(pathname)) return { name: "brazil", pathname };
  // Market-specific decision routes reuse the audited global tools while
  // preserving the user's market and locale context.
  const regionalDecisionPath = pathname.match(/^\/(mx|tw|hk)\/(comparar|costos|conta)$/);
  if (regionalDecisionPath) {
    const market = regionalDecisionPath[1].toUpperCase();
    const marketContext = new URLSearchParams(search);
    marketContext.set("market", market);
    const locale = marketContext.get("locale") || (market === "TW" ? "zh-Hant" : market === "HK" ? "en" : "es");
    if (market === "MX") return { name: "regionalDecision", market, locale, decisionPath: regionalDecisionPath[2] };
    if (regionalDecisionPath[2] === "comparar") return { name: "compare", slugs: ["binance", "okx"], market, product: "spot", locale };
    if (regionalDecisionPath[2] === "costos") return { name: "rateTerminal", market, product: "spot", locale };
    return { name: "directory", market, product: "spot", locale };
  }
  if (pathname === "/markets/turkiye") {
    return { name: "regionalPreview", market: "TR" };
  }
  const regionalPath = pathname.match(/^\/(mx|tw|id|vn|hk|eu|uk|us|jp|kr|sg|int)$/);
  if (regionalPath) {
    const market = regionalPath[1] === "int" ? "OTHER" : regionalPath[1].toUpperCase();
    return { name: "regionalPreview", market };
  }
  const searchParams = new URLSearchParams(search);
  const contextParams = () => ({
    market: searchParams.get("market") || undefined,
    product: searchParams.get("product") || undefined,
    campaign: searchParams.get("utm_campaign") || undefined,
    source: searchParams.get("utm_source") || undefined,
    accountStage: searchParams.get("account_stage") || undefined,
    funding: searchParams.get("funding") || undefined,
  });
  const refParam = searchParams.get("ref");
  if (refParam) {
    return { name: "kolLanding", kol: refParam, ...contextParams() };
  }
  const refMatch = pathname.match(/^\/ref\/([a-z0-9-]+)$/);
  if (refMatch) return { name: "kolLanding", kol: refMatch[1], ...contextParams() };
  if (searchParams.get("page") === "newsDetail" && searchParams.get("slug")) {
    return { name: "newsDetail", slug: searchParams.get("slug"), ...contextParams() };
  }
  if (pathname === "/news") return { name: "newsList", ...contextParams() };
  if (pathname === "/onchain") return { name: "onchainBoard" };
  if (pathname === "/methodology") return { name: "methodology" };
  if (pathname === "/embed/calculator") return { name: "embedCalculator" };
  if (pathname === "/partners" || pathname === "/partners/embed-guide") return { name: "partners" };
  if (pathname === "/telegram") return { name: "telegram" };
  if (pathname === "/topics") return { name: "topicCollection", ...contextParams() };
  const topicMatch = pathname.match(/^\/topics\/([a-z0-9-]+)$/);
  if (topicMatch && TOKENIZED_ASSET_SLUGS.includes(topicMatch[1])) return { name: "tokenizedAssets", slug: topicMatch[1], ...contextParams() };
  if (topicMatch) return TOPIC_SLUGS.includes(topicMatch[1]) ? { name: "topic", slug: topicMatch[1], ...contextParams() } : { name: "notFound" };
  if (pathname === "/factbook") return { name: "factbookCollection", ...contextParams() };
  const factbookMatch = pathname.match(/^\/factbook\/([a-z0-9-]+)$/);
  if (factbookMatch) {
    const slug = factbookMatch[1];
    const venue = venues.find((v) => v.slug === slug) || venueDatabase[slug];
    return venue ? { name: "factbook", slug, ...contextParams() } : { name: "notFound" };
  }
  const newsMatch = pathname.match(/^\/news\/([a-z0-9-]+)$/);
  if (newsMatch) return { name: "newsDetail", slug: newsMatch[1], ...contextParams() };
  if (pathname === "/rates") return { name: "rateTerminal", ...contextParams() };
  if (pathname === "/exchanges") return { name: "directory", ...contextParams() };
  const venueMatch = pathname.match(/^\/exchanges\/([a-z0-9-]+)$/);
  if (venueMatch) return { name: "venue", slug: venueMatch[1], ...contextParams() };
  const compareMatch = pathname.match(/^\/compare\/([a-z0-9-]+(?:-vs-[a-z0-9-]+){1,2})$/);
  if (compareMatch) {
    const slugs = validComparison(compareMatch[1], venues);
    return slugs ? { name: "compare", slugs, ...contextParams() } : { name: "notFound" };
  }
  const officialResearch = researchRoute(pathname, venues);
  if (officialResearch) return { ...officialResearch, ...contextParams() };
  const activityMatch = pathname.match(/^\/activities\/([^/]+)$/);
  if (activityMatch) {
      try { return { name: "activity", id: decodeURIComponent(activityMatch[1]), ...contextParams() }; } catch { return { name: "notFound" }; }
  }
  if (pathname === "/activities") return { name: "activities", ...contextParams() };
  return pathname === "/" || pathname === "/index.html" ? { name: "home" } : { name: "notFound" };
}

export async function preloadCurrentRouteModulesForUrl(initialUrl, options = {}) {
  if (import.meta.env.SSR) return;
  const route = routeState(neutralVenueCatalog, initialUrl);
  await preloadRouteModules(modulePathsForRoute(route, initialUrl), options);
}

// Native modal ownership keeps the covered page inert and Tab inside the menu.
function activateMobileMenu(dialog, trigger, header, onClose) {
  const desktop = window.matchMedia("(min-width: 781px)");
  const restoreFocus = () => {
    const target = desktop.matches
      ? header?.querySelector(".v2-nav a[href], .nexualpha-wordmark[href]")
      : trigger;
    if (target?.isConnected) target.focus({ preventScroll: true });
  };
  if (desktop.matches) {
    onClose();
    restoreFocus();
    return () => {};
  }
  const oldOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  const cancel = (event) => { event.preventDefault(); onClose(); };
  const breakpoint = (event) => { if (event.matches) onClose(); };
  dialog.addEventListener("cancel", cancel);
  desktop.addEventListener("change", breakpoint);
  dialog.showModal();
  dialog.querySelector("button")?.focus({ preventScroll: true });
  return () => {
    dialog.removeEventListener("cancel", cancel);
    desktop.removeEventListener("change", breakpoint);
    if (dialog.open) dialog.close();
    document.body.style.overflow = oldOverflow;
    restoreFocus();
  };
}

function Header({ copy, locale, onLocaleChange, onSearch, brazil = false }) {
  const [navigationUrl, setNavigationUrl] = useState(null);
  useEffect(() => {
    const update = () => setNavigationUrl(window.location.href);
    update();
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    return () => {
      window.removeEventListener("hashchange", update);
      window.removeEventListener("popstate", update);
    };
  }, [locale, brazil]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const mobileTriggerRef = useRef(null);
  const headerRef = useRef(null);
  const text = v3Copy(locale);
  const nav = brazil ? [
    ["Comparar plataformas", "/br/comparar"],
    ["Pix", "/br/pix"],
    ["Saque Pix", "/br/saque-pix"],
    ["Calcular custos", "/br/custos"],
    ["KYC e CPF", "/br/kyc-cpf"],
    ["Conta e benefícios", "/br/conta"],
  ] : [
    [copy.nav.exchanges, withLocale(locale, "/#exchanges")],
    [copy.nav.compare, withLocale(locale, "/#compare")],
    [text.activities, withLocale(locale, "/activities")],
    [locale === "zh-Hant" || locale === "zh-TW" ? "新聞與研究" : locale.startsWith("zh") ? "新闻与研究" : ({ ja: "マーケットニュース", ko: "시장 뉴스", tr: "Piyasa Haberleri", ru: "Новости рынка", de: "Marktnachrichten", fr: "Actualités du marché", es: "Noticias del mercado", "pt-BR": "Notícias do mercado", it: "Notizie di mercato", id: "Berita pasar", vi: "Tin thị trường", ar: "أخبار السوق" }[locale] || "Market News"), withLocale(locale, "/news")],
    [locale === "zh-Hant" || locale === "zh-TW" ? "賽道選型" : locale.startsWith("zh") ? "赛道选型" : ({ ja: "トピックガイド", ko: "주제 가이드", tr: "Konu Rehberleri", ru: "Тематические гиды", de: "Themen-Guides", fr: "Guides thématiques", es: "Guías temáticas", "pt-BR": "Guias temáticos", it: "Guide tematiche", id: "Panduan topik", vi: "Hướng dẫn chủ đề", ar: "أدلة المواضيع" }[locale] || "Topic Guides"), withLocale(locale, "/topics/meme-coins")],
    [locale.startsWith("zh") ? "Telegram" : ({ ja: "Telegram調査", ko: "Telegram 리서치", tr: "Telegram araştırma", ru: "Исследование в Telegram", de: "Telegram-Recherche", fr: "Recherche Telegram", es: "Investigación en Telegram", "pt-BR": "Pesquisa no Telegram", it: "Ricerca Telegram", id: "Riset Telegram", vi: "Nghiên cứu Telegram", ar: "بحث Telegram" }[locale] || "Telegram Research"), withLocale(locale, "/telegram")],
  ];
  useEffect(() => {
    if (!mobileOpen) return;
    return activateMobileMenu(mobileMenuRef.current, mobileTriggerRef.current, headerRef.current, () => setMobileOpen(false));
  }, [mobileOpen]);
  const handleLocaleInput = (event) => onLocaleChange(event.target.value);
  const languagePicker = <select value={locale} aria-label={copy.ui.language} disabled={brazil} onChange={handleLocaleInput}>
    {supportedLocales.map((code) => brazil && code !== "pt-BR" ? null : <option value={code} key={code}>{localeManifest[code].language}</option>)}
  </select>;
  return <>
    <header ref={headerRef} className="v2-header v2-shell">
      <NexuAlphaWordmark href={withLocale(locale, "/")} />
      <nav className="v2-nav" aria-label={copy.ui.menu}>{nav.map(([label, href]) => <a key={href} href={href} aria-current={headerNavigationState(href, navigationUrl).current} data-active={headerNavigationState(href, navigationUrl).active ? "true" : undefined} data-cta-kind={href.includes("/telegram") ? "telegram" : undefined} data-cta-placement={href.includes("/telegram") ? "header-telegram" : undefined} data-growth-decision={href.includes("/telegram") ? "telegram_hub" : undefined} data-growth-placement={href.includes("/telegram") ? "header" : undefined}>{label}</a>)}</nav>
      <div className="v2-header__tools"><button type="button" onClick={onSearch}>{copy.hero.search} ⌘K</button>{languagePicker}</div>
      <button ref={mobileTriggerRef} className="mobile-menu-trigger" type="button" aria-expanded={mobileOpen} aria-controls={mobileOpen ? "v2-mobile-menu" : undefined} onClick={() => setMobileOpen((value) => !value)}>{copy.ui.menu}</button>
    </header>
    {mobileOpen && <dialog ref={mobileMenuRef} id="v2-mobile-menu" className="mobile-search-overlay" aria-label={copy.ui.menu} onKeyDown={(event) => event.stopPropagation()}>
      <nav aria-label={copy.ui.menu}>
      <button type="button" onClick={() => setMobileOpen(false)}>{copy.actions.close}</button>
      {nav.map(([label, href]) => <a key={href} href={href} aria-current={headerNavigationState(href, navigationUrl).current} data-active={headerNavigationState(href, navigationUrl).active ? "true" : undefined} onClick={() => setMobileOpen(false)} data-cta-kind={href.includes("/telegram") ? "telegram" : undefined} data-cta-placement={href.includes("/telegram") ? "mobile-menu-telegram" : undefined} data-growth-decision={href.includes("/telegram") ? "telegram_hub" : undefined} data-growth-placement={href.includes("/telegram") ? "mobile-menu" : undefined}>{label}</a>)}
      <label>{copy.ui.language}{languagePicker}</label>
      <button type="button" onClick={() => { setMobileOpen(false); onSearch({ currentTarget: mobileTriggerRef.current }); }}>{copy.hero.search}</button>
      </nav>
    </dialog>}
  </>;
}

export function App({ initialUrl, initialLocale, initialCompareSelection, initialNewsArticles } = {}) {
  const [locale, setLocale] = useState(() => initialLocale || readLocale(initialUrl));
  const region = "Global";
  const [siteView, setSiteView] = useState(null);
  const [dataStatus, setDataStatus] = useState("loading");
  const [dataRevision, setDataRevision] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchReturnFocusRef = useRef(null);

  // Hydration can begin from the server's default locale while the browser URL
  // already carries an explicit locale query. Reconcile once on the client so
  // legacy V3 children cannot remain on the English default after hydration.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlLocale = readLocale(window.location.href);
    if (urlLocale && urlLocale !== locale) setLocale(urlLocale);
  }, [locale]);
  const closeSearchDialog = useCallback(() => setSearchOpen(false), []);
  const openSearchDialog = useCallback((event) => {
    const candidate = event?.currentTarget;
    if (candidate?.focus && candidate.isConnected !== false) {
      searchReturnFocusRef.current = candidate;
    } else if (typeof document !== "undefined") {
      const active = document.activeElement;
      searchReturnFocusRef.current = active && active !== document.body ? active : null;
    }
    setSearchOpen(true);
  }, []);
  const [compareSelection, setCompareSelection] = useState(() => initialCompareSelection || readComparison());
  const copy = useMemo(() => v2Copy(locale), [locale]);
  const changeLocale = useCallback((nextLocale) => {
    if (!supportedLocales.includes(nextLocale)) return;
    // A full locale navigation is intentional: it guarantees that SSR, the
    // prerendered route tree, and every legacy child component start from the
    // same locale. A client-only state swap could leave an English subtree
    // mounted after changing the selector.
    if (typeof window === "undefined") {
      setLocale(nextLocale);
      return;
    }
    window.location.assign(localizedHref(`${window.location.pathname}${window.location.search}${window.location.hash}`, { locale: nextLocale }));
  }, []);

  useEffect(() => {
    try { setParaglideLocale(locale, { reload: false }); } catch { /* URL and React state remain authoritative if persistence is denied. */ }
    try {
      window.localStorage.setItem(localStorageKey, locale);
      document.cookie = `${localStorageKey}=${encodeURIComponent(locale)}; path=/; max-age=34560000; samesite=lax`;
    } catch { /* Locale changes remain usable without browser persistence. */ }
    const localizedUrl = localizedHref(`${window.location.pathname}${window.location.search}${window.location.hash}`, { locale });
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== localizedUrl) window.history.replaceState(window.history.state, "", localizedUrl);
    document.documentElement.lang = intlLocale(locale);
    document.documentElement.dir = getTextDirection(locale);
    document.documentElement.dataset.build = __NEXUALPHA_BUILD_ID__;
  }, [locale]);
  useEffect(() => { const syncFromHistory = () => setLocale(readLocale()); window.addEventListener("popstate", syncFromHistory); return () => window.removeEventListener("popstate", syncFromHistory); }, []);
  useEffect(() => installHashNavigation(document, window), []);
  useEffect(() => {
    let alive = true;
    setDataStatus("loading");
    setSiteView(null);
    loadSiteView(locale).then((result) => {
      if (!alive) return;
      setSiteView(result.view ?? null);
      setDataStatus(result.status);
    }).catch(() => {
      if (!alive) return;
      setSiteView(null);
      setDataStatus("error");
    });
    return () => { alive = false; };
  }, [locale, dataRevision]);

  useEffect(() => {
    document.documentElement.dataset.dataSource = siteView?.source ?? "local-research";
  }, [siteView]);

  useEffect(() => {
    try { window.sessionStorage.setItem("nexualpha-comparison", JSON.stringify(compareSelection)); } catch { /* Selection remains usable in memory. */ }
  }, [compareSelection]);

  useEffect(() => {
    const openSearch = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);

  const model = presentationModel(siteView, region, copy);
  const command = useMemo(() => marketCommand(copy, model.venues), [copy, model.venues]);
  const route = routeState(command.venueCatalog, initialUrl);
  useEffect(() => {
    const text = v3Copy(locale);
    if (route.name === "newsDetail") {
      // The article component owns metadata after its feed resolves, including
      // locale switches and missing articles. Preserve the server head meanwhile.
      return;
    }
    if (route.name === "tokenizedAssets") {
      // Tokenized asset cluster metadata is owned by Worker/prerender until the
      // shared SEO injector is coordinated for this new route family.
      return;
    }
    const currentRoutedVenue = (route.name === "venue" || route.name === "factbook")
      ? (command.venueCatalog.find((venue) => venue.slug === route.slug) || venueDatabase[route.slug])
      : null;
    injectSeoMetadata({
      route,
      locale,
      venue: currentRoutedVenue,
      venues: command.venueCatalog,
      updates: model.officialUpdates ?? [],
    });
  }, [command.venueCatalog, copy.discovery.title, copy.hero.title, locale, model.officialUpdates, route]);

  if (import.meta.env.DEV && typeof window !== "undefined" && window.location.pathname === "/dev/design-system") return <DesignSystem />;
  const selectedFromRoute = route.name === "compare" && route.slugs.length >= 2 ? route.slugs : compareSelection;
  const sourceSearch = initialUrl
    ? new URL(initialUrl, "https://nexualpha.com").search
    : (typeof window !== "undefined" ? window.location.search : "");
  const decisionPassport = readDecisionPassport(sourceSearch, route);
  const routedVenue = route.name === "venue" ? command.venueCatalog.find((venue) => venue.slug === route.slug) : null;
  const searchDialog = searchOpen && <DeferredBoundary scope="search-dialog"><SearchDialog label={copy.common.openFinder} onClose={closeSearchDialog} returnFocusRef={searchReturnFocusRef}><h2>{copy.common.openFinder}</h2><CommandFinder copy={copy} command={command} autoFocus onClose={closeSearchDialog} /><button type="button" onClick={closeSearchDialog}>{copy.common.closeFinder}</button></SearchDialog></DeferredBoundary>;
  const footer = <CleanFooter locale={locale} brazil={route.name === "brazil"} />;
  const regionalDecisionDockOwnsMobileNav = ["regionalPreview", "regionalDecision"].includes(route.name)
    && REGIONAL_DECISION_DOCK_MARKETS.has(route.market);
  const showSharedMobileNav = route.name !== "venue" && route.name !== "compare" && !regionalDecisionDockOwnsMobileNav;
  // Locale changes must remount the complete route subtree. Several legacy
  // sections keep derived copy in child state; reusing those nodes can leave
  // an English body below a translated header after a client-side switch.
  const pageShell = (content, { deferContent = true, crawlScope = null } = {}) => <React.Fragment key={`locale-${locale}`}><Header copy={copy} locale={locale} brazil={route.name === "brazil"} onLocaleChange={changeLocale} onSearch={openSearchDialog} />{deferContent ? <DeferredBoundary scope="page-content">{content}</DeferredBoundary> : <ScopedContent scope="page-content" defer={false}>{content}</ScopedContent>}{crawlScope ? <CrawlPriorityLinks locale={locale} scope={crawlScope} /> : null}{footer}{searchDialog}{showSharedMobileNav && <MobileBottomNav locale={locale} brazil={route.name === "brazil"} onSearch={openSearchDialog} />}</React.Fragment>;

  const adjustSelection = () => document.querySelector("#exchanges")?.scrollIntoView({ behavior: typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  if (route.name === "embedCalculator") {
    const embedUrl = new URL(initialUrl || (typeof window !== "undefined" ? window.location.href : "/embed/calculator"), "https://nexualpha.com");
    const isBrazilWidget = embedUrl.searchParams.get("scenario") !== "fees"
      && embedUrl.searchParams.get("market") === "BR"
      && (!embedUrl.searchParams.has("product") || embedUrl.searchParams.get("product") === "spot");
    return <DeferredBoundary scope="embed-content">{isBrazilWidget ? <BrazilCostEmbed initialUrl={initialUrl} locale="pt-BR" /> : <EmbedCalculator locale={locale} market={embedUrl.searchParams.get("market")} product={embedUrl.searchParams.get("product")} />}</DeferredBoundary>;
  }
  if (route.name === "brazil") return pageShell(<BrazilDecisionPage pathname={route.pathname} initialUrl={initialUrl} locale={locale} trackGrowthDecision={trackGrowthDecision} />);
  if (route.name === "regionalPreview") return pageShell(<RegionalMarketPreview market={route.market} locale={locale} decisionPassport={decisionPassport} />);
  if (route.name === "regionalDecision") return pageShell(<RegionalMarketPreview market={route.market} locale={route.locale || locale} decisionPath={route.decisionPath} decisionPassport={decisionPassport} />);
  if (route.name === "methodology") return pageShell(<AuditMethodologyPage locale={locale} />);
  if (route.name === "partners") return pageShell(<PartnerEmbedGuide locale={locale} />);
  if (route.name === "telegram") return pageShell(<main className="v2-page v3-page r1-telegram-page" id="top" dir={getTextDirection(locale)}><TelegramBotHub locale={locale} headingLevel={1} /></main>);
  if (route.name === "topicCollection") return pageShell(<CollectionHubPage kind="topics" locale={locale} />);
  if (route.name === "factbookCollection") return pageShell(<CollectionHubPage kind="factbook" locale={locale} />);
  if (route.name === "tokenizedAssets") return pageShell(<TokenizedAssetsPage slug={route.slug} locale={locale} />, { crawlScope: "tokenized" });
  if (route.name === "topic") return pageShell(<TopicGuidePage slug={route.slug} locale={locale} market={route.market} product={route.product} venues={command.venueCatalog} />);
  if (route.name === "factbook") return pageShell(<FactbookPage slug={route.slug} locale={locale} market={route.market} product={route.product} />);
  if (route.name === "kolLanding") return pageShell(<KolLandingPage kolHandle={route.kol} locale={locale} market={route.market} product={route.product} />);
  if (route.name === "rateTerminal") return pageShell(<main className="v2-page v3-page r1-rates-page" id="top">
    <section className="v2-section v2-shell">
      <span className="v3-independent-badge">{({ "zh-Hant": "手續費計算", ja: "手数料比較", ko: "수수료 비교", tr: "Ücret karşılaştırması", ar: "مقارنة الرسوم", "pt-BR": "Comparação de taxas", es: "Comparación de comisiones", fr: "Comparaison des frais", de: "Gebührenvergleich", ru: "Сравнение комиссий", id: "Perbandingan biaya", vi: "Đối chiếu phí", it: "Confronto delle commissioni" }[locale] || (locale.startsWith("zh") ? "手续费计算" : "Fee benchmark"))}</span>
      <h1>{({
        "zh-Hant": "交易所手續費基準終端",
        ja: "取引所手数料ベンチマーク", ko: "거래소 수수료 벤치마크", tr: "Borsa ücret karşılaştırma terminali",
        ar: "مقارنة رسوم منصات التداول", "pt-BR": "Painel de referência de taxas", es: "Panel de referencia de comisiones",
        fr: "Référentiel des frais des plateformes", de: "Gebühren-Benchmark für Handelsplattformen", ru: "Сравнение комиссий платформ",
        id: "Tolok ukur biaya platform", vi: "Bảng đối chiếu phí nền tảng", it: "Benchmark delle commissioni"
      }[locale] || (locale.startsWith("zh") ? "交易所手续费基准终端" : "Crypto Exchange Fee Benchmark Terminal"))}</h1>
    </section>
    <FeeBenchmarkTerminal locale={locale} market={route.market} product={route.product} accountStage={route.accountStage} funding={route.funding} />
  </main>, { crawlScope: "rates" });
  if (route.name === "onchainBoard") return pageShell(<main className="v2-page v3-page" id="top"><OnChainLiquidityBoard locale={locale} headingLevel={1} /></main>);
  if (route.name === "newsList") return pageShell(<NewsListPage locale={locale} market={route.market} product={route.product} initialArticles={initialNewsArticles} />);
  if (route.name === "newsDetail") return pageShell(<NewsDetailPage slug={route.slug} locale={locale} market={route.market} product={route.product} initialArticles={initialNewsArticles} />);
  if (route.name === "venue" && !routedVenue) return pageShell(<NotFoundPage locale={locale} />);
  if (route.name === "venue" && routedVenue) return pageShell(<VenueDetailPage copy={copy} locale={locale} venue={routedVenue} venues={command.venueCatalog} updates={model.officialUpdates ?? []} market={route.market} product={route.product} accountStage={route.accountStage} funding={route.funding} />);
  if (route.name === "compare" && selectedFromRoute.length < 2) return pageShell(<NotFoundPage locale={locale} />);
  if (route.name === "compare" && selectedFromRoute.length >= 2) return pageShell(<CompareDeepPage copy={copy} locale={locale} selected={selectedFromRoute} venues={command.venueCatalog} updates={model.officialUpdates ?? []} market={route.market} product={route.product} accountStage={route.accountStage} funding={route.funding} />, { crawlScope: "compare" });
  if (route.name === "research") return pageShell(<OfficialResearchPage locale={locale} market={route.market} product={route.product} venue={command.venueCatalog.find((venue) => venue.slug === route.slug)} venues={command.venueCatalog} />);
  if (route.name === "activity") return pageShell(<ActivityDetailPage copy={copy} locale={locale} market={route.market} product={route.product} update={(model.officialUpdates ?? []).find((update) => update.id === route.id)} venues={command.venueCatalog} />);
  if (route.name === "activities") return pageShell(<ActivityCenterPage copy={copy} locale={locale} market={route.market} product={route.product} venues={command.venueCatalog} updates={model.officialUpdates ?? []} />);
  if (route.name === "directory") return pageShell(<main className="v2-page v3-page" id="top" dir={getTextDirection(locale)}><VenueYellowPages venues={command.venueCatalog} locale={locale} market={route.market} product={route.product} accountStage={route.accountStage} funding={route.funding} headingLevel={1} /></main>, { deferContent: false, crawlScope: "directory" });
  if (route.name === "notFound") return pageShell(<NotFoundPage locale={locale} />);

  // 顶级转化漏斗首页：跑马灯 -> LeanHero首屏 -> 横向对比决策 -> 交易暗亏体检仪 -> 核心黄页开户 -> 辅助情报模块 -> 实时社交证明浮窗
  return <main key={`locale-${locale}`} className="v2-page home-refinement" id="top" dir={getTextDirection(locale)}>
    <Header copy={copy} locale={locale} onLocaleChange={changeLocale} onSearch={openSearchDialog} />
    <DeferredBoundary scope="home-hero">
      <RebateTickerBar locale={locale} />
      <LeanHero locale={locale} />
      <BrazilEntryLink locale={locale} />
    </DeferredBoundary>
    <HomeSectionNav locale={locale} />
    <CrossroadsCompare locale={locale} selected={compareSelection} onSelectionChange={setCompareSelection} />
    <details className="home-analyzer-drawer" id="bleed-analyzer">
      <summary>
        <strong>{({
          "zh-Hans": "展开交易成本体检", "zh-Hant": "展開交易成本檢查", en: "Open the fee cost check",
          ja: "取引コストを確認", ko: "거래 비용 확인", tr: "İşlem maliyetini kontrol et",
          fr: "Vérifier les frais de transaction", de: "Handelskosten prüfen", es: "Revisar los costes de operación",
          "pt-BR": "Verificar custos de negociação", ru: "Проверить торговые издержки", ar: "تحقق من تكاليف التداول",
          id: "Periksa biaya perdagangan", vi: "Kiểm tra chi phí giao dịch", it: "Controlla i costi di trading",
        }[locale] || v3Copy(locale).comparisonMatrix || "Open the fee cost check")}</strong>
        <span>{({
          "zh-Hans": "用公开基础费率估算，再决定是否深入核对", "zh-Hant": "用公開基礎費率估算，再決定是否深入核對", en: "Estimate from published base rates before going deeper",
          ja: "公開基準手数料を見積もり、詳しい確認に進みます", ko: "공개 기본 수수료를 추정한 뒤 자세히 확인하세요", tr: "Yayınlanan temel oranlarla tahmin yapın, sonra ayrıntıları doğrulayın",
          fr: "Estimez avec les taux publiés avant d'aller plus loin", de: "Schätzen Sie anhand veröffentlichter Basissätze, bevor Sie weiterprüfen", es: "Estima con las tarifas base publicadas antes de profundizar",
          "pt-BR": "Estime pelas taxas base publicadas antes de avançar", ru: "Оцените по опубликованным базовым ставкам перед подробной проверкой", ar: "قدّر التكلفة بالأسعار الأساسية المنشورة قبل التعمق",
          id: "Perkirakan dari biaya dasar yang dipublikasikan sebelum menelusuri lebih jauh", vi: "Ước tính theo mức phí cơ bản đã công bố trước khi xem chi tiết", it: "Stima con le tariffe base pubblicate prima di approfondire",
        }[locale] || v3Copy(locale).conversionPreviewBody || "Estimate from published base rates before going deeper")}</span>
        <b aria-hidden="true">＋</b>
      </summary>
      <div className="home-analyzer-drawer__body"><DeferredBoundary scope="home-fees"><TradingBleedAnalyzer locale={locale} market={decisionPassport.market} product={decisionPassport.product} /></DeferredBoundary></div>
    </details>
    <PlatformMatcher locale={locale} venues={command.venueCatalog} selected={compareSelection} decisionPassport={decisionPassport} defaultOpen={false} onSelectionChange={setCompareSelection} />
    <VenueYellowPages venues={command.venueCatalog} locale={locale} selected={compareSelection} onSelectionChange={setCompareSelection} compact />
    <DeferredBoundary scope="home-research"><HomeResearchDrawer locale={locale} /></DeferredBoundary>
    <CrawlPriorityLinks locale={locale} scope="home" />
    {footer}
    {searchDialog}
    <MobileBottomNav locale={locale} onSearch={openSearchDialog} />
  </main>;
}

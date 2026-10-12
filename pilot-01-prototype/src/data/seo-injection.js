import { fundingMatrixSeo } from "./funding-matrix-seo.js";
import { isLegalPagePath, legalPageSeo } from "./legal-pages.js";
import { isReviewedNewsSearchArticle, selectReviewedNewsSearchSlugs } from "./reviewed-news-publication.js";
/** Route metadata mirrors the standalone Worker; UI-only locale fallbacks share their content canonical. */
import { venueDatabase } from "./venue-database.js";
import { mergePriorityVenueSeo } from "./priority-venue-seo.js";
import { referralSeoFor, geoSafeVenueSeoOverride } from "./referral-seo.js";
import { applyPartnerVenueFaqSchema } from "./partner-venue-faq.js";
import { VENUE_ALTERNATIVES_INDEX_LOCALES, venueAlternativePage, venueAlternativesContent, venueAlternativesSchemas } from "./venue-alternatives.js";
import { brazilDeadlineAlternates, brazilDeadlineContentLocale, brazilDeadlineIndexLocales, brazilDeadlineIndexable, brazilDeadlinePathFor, isBrazilDeadlineSlug } from "./brazil-vasp-deadline-slugs.js";
import { brazilDeadlineContent, brazilDeadlineSchemas } from "./brazil-vasp-deadline.js";
import { neutralVenueCatalog } from "./market-command.js";
import { TOPIC_GUIDES } from "./topic-guides-data.js";
import { TOPIC_SOURCE_REVIEW_DATE, topicSourcesFor, topicFaqSchemaEntries } from "./topic-source-registry.js";
import { getBrazilPage } from "./brazil-market.js";
const INDEXABLE_LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"];
import { getBrazilSeo } from "./brazil-seo.js";
import { sanitizePublicText } from "./public-copy-sanitizer.js";
import { articleMetaDescription, budgetTitle, clampMetaDescription, routeMetaDescription, titleBudgetForLocale } from "./meta-description.js";
import { HOME_SEARCH_COPY } from "./home-search-copy.js";
import { onchainGuideSchema, onchainGuideSeo } from "./onchain-guide.js";
import { NEWS_HUB_SEO_EN } from "./news-list-copy.js";
import { socialImageObject } from "./social-image.js";
import { newsHumanReview, newsListingIndexableLocales, newsListingPublishedLocales, newsArticleAvailableLocales, newsArticleSeoLocales, newsArticleExtraFaqEntries, newsArticleFaqEntries, resolveNewsContentLocale, localizedNewsTitle, localizedNewsSummary } from "./news-feed-client.js";
import { LOCALE_PREFIX_BY_CODE, localizedPath, parsePublicRoute } from "./locale-routing.js";
import { noKycMetaTitle } from "./no-kyc-meta-title.js";
import { ACADEMY_INDEX_LOCALES, parseAcademyPath } from "./academy.js";
import { appDownloadRouteSeo } from "./app-downloads.js";
import { parseAppDownloadPath } from "./app-download-path.js";
import { academyRouteSeo } from "./academy-seo.js";
import { parseCoinsPath } from "./coins-routes.js";
import { coinsRouteSeo } from "./coins-seo.js";
import { parseConverterPath } from "./converter-routes.js";
import { converterRouteSeo } from "./converter-seo.js";
import { parseGlossaryPath } from "./glossary-routes.js";
import { glossaryRouteSeo } from "./glossary-seo.js";
import { BINANCE_OCTOBER_INDEX_LOCALES, parseBinanceOctoberPath } from "./binance-october.js";
import { binanceOctoberRouteSeo } from "./binance-october-seo.js";
import { BYBIT_STOCKS_INDEX_LOCALES, parseBybitStocksPath } from "./bybit-stocks.js";
import { bybitStocksRouteSeo } from "./bybit-stocks-seo.js";
import { ABOUT_PATH, BRAND_PAGE_PATHS, BRAND_PAGE_SEO, EDITORIAL_POLICY_PATH, NEXUALPHA_PUBLISHER, RESEARCH_DESK, brandPageSchemas, isBrandPagePath, organizationSchema, websiteSchema } from "./brand-entity.js";
import { aeoQuestionText } from "./aeo-question-registry.js";
import { compareSeoOverrideFromDirectAnswer } from "./compare-direct-answers.js";
import { CURATED_COMPARISON_SLUGS, compareIndexCopy, generatedCompareCopy, generatedCompareDataDate, generatedCompareLocales, generatedComparePolicy, parseComparePair } from "./compare-generated.js";
import { compareFaqSchemaEntries } from "./compare-faq-locales.js";
import { AUDIT_DATE as FACTBOOK_SOURCE_REVIEW_DATE } from "./factbook-registry.js";
import { factbookDates } from "./factbook-dates.js";
import { collectionHubCopy, factbookHubItems, topicHubItems } from "./collection-hubs.js";
import {
  TOKENIZED_ASSET_CLUSTER_REVIEW_DATE,
  TOKENIZED_ASSET_LOCALES,
  tokenizedAssetLocale,
  tokenizedAssetLocalized,
  tokenizedAssetPage,
  tokenizedAssetSources,
} from "./tokenized-assets-cluster.js";
import { PRIORITY_QUERY_OWNER_REGISTRY, priorityOwnerForPath } from "./priority-query-owner-registry.js";

const PUBLIC_ORIGIN = "https://nexualpha.com";
const NEXUALPHA_DATA_LICENSE_URL = `${PUBLIC_ORIGIN}/methodology#data-license`;
// Publisher and editorial-team references come from brand-entity.js so every page shares one Organization @id.
const DEFAULT_SOCIAL_IMAGE = `${PUBLIC_ORIGIN}/brand/nexualpha/nexualpha-social-v1.jpg`;
const REGIONAL_FUNDING_MATRIX_REVIEWED_AT = "2026-09-15";
const REGIONAL_FUNDING_MATRIX_URLS = Object.freeze({
  json: `${PUBLIC_ORIGIN}/research/regional-funding-verification-matrix.json`,
  csv: `${PUBLIC_ORIGIN}/research/regional-funding-verification-matrix.csv`,
  methodology: `${PUBLIC_ORIGIN}/methodology`,
});
const REGIONAL_FUNDING_MATRIX_COVERAGE = "Reviewed funding checklist rows currently cover BR, MX, TW, ID, EU, UK, US, JP, HK, KR, SG and TR; every rail and account outcome still requires confirmation in the official logged-in account flow.";
const REGIONAL_FUNDING_MATRIX_LIMITATIONS = "The matrix is a dated research checklist, not a live-rate feed, account approval decision, funding availability promise, product-access promise, user-benefit promise or registration outcome.";
const WAVE48_PERP_DEX_COST_CITATION_URLS = Object.freeze({
  json: `${PUBLIC_ORIGIN}/research/wave48-perp-dex-cost-citations.json`,
  csv: `${PUBLIC_ORIGIN}/research/wave48-perp-dex-cost-citations.csv`,
  canonicalOwner: `${PUBLIC_ORIGIN}/topics/derivatives#perp-cost-field-dictionary`,
});
const WAVE48_PERP_DEX_COST_FINDING = "Wave56 finding: across the four reviewed Perp DEX venues, all 24 required venue-field records are source-backed as known, but every venue still requires cost review across fee, funding, collateral, margin, oracle and liquidation rather than a single static fee or live funding quote.";
const WAVE48_TOKENIZED_TREASURY_RIGHTS_OPS_URL = `${PUBLIC_ORIGIN}/research/wave48-tokenized-treasury-rights-ops.json`;
const WAVE57_TOKENIZED_TREASURY_FINDING = "Wave57 finding: the reviewed tokenized Treasury matrix covers five products across four distinct product types; compare issuer/legal wrapper, recordkeeper, custody, redemption, eligibility jurisdiction and yield basis before comparing yield, token addresses or venue access.";
const WAVE48_TOKENIZED_TREASURY_RIGHTS_OPS_LIMITATIONS = "This asset is a dated source-review matrix, not legal advice, investment advice, live yield data, account eligibility, signup eligibility, registration outcome, ownership guarantee or redemption guarantee.";
const TOKENIZED_TREASURY_OWNER = PRIORITY_QUERY_OWNER_REGISTRY["tokenized-treasuries"];
const NEWS_OWNER_RELATED_LINKS = Object.freeze({
  "tokenized-treasuries-structure-access-risks": [
    TOKENIZED_TREASURY_OWNER.canonicalOwnerPath,
    TOKENIZED_TREASURY_OWNER.supportPath,
    "/research/wave48-tokenized-treasury-rights-ops.json",
    "/topics/tokenized-assets",
    "/topics/tokenized-stocks-vs-perpetuals",
    "/methodology",
  ],
  "bybit-vs-bitget-fees-products-risk-controls": [
    "/compare/bybit-vs-bitget",
    "/topics/tokenized-stocks-vs-perpetuals",
    "/factbook/bybit",
    "/factbook/bitget",
    TOKENIZED_TREASURY_OWNER.supportPath,
    "/news/crypto-exchange-fee-disclosure-audit",
    "/methodology",
  ],
  "uniswap-v3-vs-pancakeswap-v3-concentrated-liquidity-controls": [
    "/exchanges/uniswap",
    "/compare/uniswap-vs-jupiter",
    "/factbook/uniswap",
    "/factbook/pancakeswap",
    "/topics/no-kyc",
    "/methodology",
  ],
});
const MACHINE_READABLE_CITATION_ASSETS = Object.freeze([
  { name: "NexuAlpha public source review index", url: `${PUBLIC_ORIGIN}/llms.txt`, encodingFormat: "text/plain" },
  { name: "NexuAlpha full source review records", url: `${PUBLIC_ORIGIN}/llms-full.txt`, encodingFormat: "text/plain" },
  { name: "Perp DEX cost-field dictionary JSON", url: `${PUBLIC_ORIGIN}/research/perp-dex-cost-field-dictionary.json`, encodingFormat: "application/json" },
  { name: "Perp DEX cost-field dictionary CSV", url: `${PUBLIC_ORIGIN}/research/perp-dex-cost-field-dictionary.csv`, encodingFormat: "text/csv" },
  { name: "Wave48 Perp DEX cost citations JSON", url: WAVE48_PERP_DEX_COST_CITATION_URLS.json, encodingFormat: "application/json" },
  { name: "Wave48 Perp DEX cost citations CSV", url: WAVE48_PERP_DEX_COST_CITATION_URLS.csv, encodingFormat: "text/csv" },
  { name: "Regional funding verification matrix JSON", url: REGIONAL_FUNDING_MATRIX_URLS.json, encodingFormat: "application/json" },
  { name: "Regional funding verification matrix CSV", url: REGIONAL_FUNDING_MATRIX_URLS.csv, encodingFormat: "text/csv" },
]);
function uniqueUrls(values = []) {
  return [...new Set(values.filter(Boolean))];
}
function publicRelatedUrl(link, locale = "en") {
  if (String(link).startsWith("/research/")) return `${PUBLIC_ORIGIN}${link}`;
  return `${PUBLIC_ORIGIN}${localizedPath(link, locale)}`;
}
function regionalFundingMatrixDatasetSchema() {
  return {
    "@type": "Dataset",
    name: "Regional funding verification matrix",
    url: REGIONAL_FUNDING_MATRIX_URLS.json,
    sameAs: REGIONAL_FUNDING_MATRIX_URLS.csv,
    dateModified: REGIONAL_FUNDING_MATRIX_REVIEWED_AT,
    creator: RESEARCH_DESK,
    publisher: NEXUALPHA_PUBLISHER,
    license: NEXUALPHA_DATA_LICENSE_URL,
    isAccessibleForFree: true,
    inLanguage: "en",
    description: `${REGIONAL_FUNDING_MATRIX_COVERAGE} ${REGIONAL_FUNDING_MATRIX_LIMITATIONS}`,
    about: ["fiat funding verification", "regional payment rails", "crypto platform account checks"],
    measurementTechnique: "Official source review of regulator, payment-system and platform support pages; account-specific outcomes remain pending until shown in the official logged-in account flow.",
    variableMeasured: ["market", "fiatCurrency", "paymentRails", "accountScreenChecks", "feeOrTimingChecks", "officialSources", "unknowns", "cannotPromise"],
    distribution: [
      { "@type": "DataDownload", name: "Regional funding verification matrix JSON", contentUrl: REGIONAL_FUNDING_MATRIX_URLS.json, encodingFormat: "application/json" },
      { "@type": "DataDownload", name: "Regional funding verification matrix CSV", contentUrl: REGIONAL_FUNDING_MATRIX_URLS.csv, encodingFormat: "text/csv" },
    ],
    citation: [REGIONAL_FUNDING_MATRIX_URLS.methodology, REGIONAL_FUNDING_MATRIX_URLS.json, REGIONAL_FUNDING_MATRIX_URLS.csv],
    conditionsOfAccess: REGIONAL_FUNDING_MATRIX_LIMITATIONS,
  };
}
const REGIONAL_FUNDING_ROUTE_LINKS = Object.freeze([
  ["/hk", "Hong Kong funding route checklist"],
  ["/eu", "European Union funding route checklist"],
  ["/uk", "United Kingdom funding route checklist"],
  ["/us", "United States funding route checklist"],
  ["/jp?locale=ja", "Japan funding route checklist"],
  ["/kr?locale=ko", "Korea funding route checklist"],
  ["/sg", "Singapore funding route checklist"],
  ["/tr/markets/turkiye", "Türkiye funding route checklist"],
  ["/br", "Brazil funding route checklist"],
  ["/mx", "Mexico funding route checklist"],
  ["/tw", "Taiwan funding route checklist"],
  ["/compare/binance-vs-okx", "Binance vs OKX comparison"],
  ["/compare/bybit-vs-bitget", "Bybit vs Bitget comparison"],
  ["/compare/hyperliquid-vs-dydx", "Hyperliquid vs dYdX comparison"],
]);
function regionalFundingRouteSchemas(locale = "en") {
  const routeUrls = REGIONAL_FUNDING_ROUTE_LINKS.map(([url, name], index) => ({
    "@type": "ListItem",
    position: index + 1,
    name,
    url: `${PUBLIC_ORIGIN}${url}`,
  }));
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: schemaLocale(locale),
      mainEntity: [{
        "@type": "Question",
        name: "How should international users verify crypto funding routes?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Start from the regional funding matrix, then open the market page for residence, identity, local rail and official-account checks. Use comparison pages only after the region, product and funding path are clear. The matrix is a dated research checklist, not a live fee quote, account approval promise, funding guarantee, user-benefit promise or registration outcome.",
          citation: [REGIONAL_FUNDING_MATRIX_URLS.json, REGIONAL_FUNDING_MATRIX_URLS.csv, REGIONAL_FUNDING_MATRIX_URLS.methodology],
        },
      }],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Regional crypto funding route entry points",
      inLanguage: schemaLocale(locale),
      itemListElement: routeUrls,
    },
  ];
}
function wave48PerpDexCostCitationsDatasetSchema() {
  return {
    "@type": "Dataset",
    name: "Wave48 Perp DEX cost citations",
    url: WAVE48_PERP_DEX_COST_CITATION_URLS.json,
    sameAs: WAVE48_PERP_DEX_COST_CITATION_URLS.csv,
    dateModified: "2026-09-15",
    creator: RESEARCH_DESK,
    publisher: NEXUALPHA_PUBLISHER,
    license: NEXUALPHA_DATA_LICENSE_URL,
    isAccessibleForFree: true,
    inLanguage: "en",
    abstract: WAVE48_PERP_DEX_COST_FINDING,
    description: `${WAVE48_PERP_DEX_COST_FINDING} Dated research snapshot; not a live quote, trading recommendation, referral route, campaign eligibility claim or venue ranking.`,
    about: ["Perp DEX costs", "funding", "margin", "oracle", "liquidation"],
    isPartOf: WAVE48_PERP_DEX_COST_CITATION_URLS.canonicalOwner,
    variableMeasured: ["venue", "fee", "funding", "collateral", "margin", "oracle", "liquidation", "sourceUrl", "unknowns"],
    distribution: [
      { "@type": "DataDownload", name: "Wave48 Perp DEX cost citations JSON", contentUrl: WAVE48_PERP_DEX_COST_CITATION_URLS.json, encodingFormat: "application/json" },
      { "@type": "DataDownload", name: "Wave48 Perp DEX cost citations CSV", contentUrl: WAVE48_PERP_DEX_COST_CITATION_URLS.csv, encodingFormat: "text/csv" },
    ],
    citation: [WAVE48_PERP_DEX_COST_CITATION_URLS.canonicalOwner, WAVE48_PERP_DEX_COST_CITATION_URLS.json, WAVE48_PERP_DEX_COST_CITATION_URLS.csv],
    conditionsOfAccess: "Dated research snapshot for citation and comparison; not a live quote, trading recommendation, referral route, campaign eligibility claim or venue ranking.",
  };
}
function wave48TokenizedTreasuryRightsOpsDatasetSchema() {
  return {
    "@type": "Dataset",
    name: "Wave48 tokenized Treasury rights and operations",
    url: WAVE48_TOKENIZED_TREASURY_RIGHTS_OPS_URL,
    dateModified: "2026-09-16",
    creator: RESEARCH_DESK,
    publisher: NEXUALPHA_PUBLISHER,
    license: NEXUALPHA_DATA_LICENSE_URL,
    isAccessibleForFree: true,
    inLanguage: "en",
    abstract: WAVE57_TOKENIZED_TREASURY_FINDING,
    description: `${WAVE57_TOKENIZED_TREASURY_FINDING} ${WAVE48_TOKENIZED_TREASURY_RIGHTS_OPS_LIMITATIONS}`,
    about: ["tokenized Treasuries", "legal claim", "recordkeeper", "custody", "redemption", "eligibility"],
    isPartOf: `${PUBLIC_ORIGIN}/topics/tokenized-treasuries`,
    variableMeasured: ["productType", "legalClaimOrIssuerSpv", "recordkeeper", "custody", "redemption", "eligibilityJurisdiction", "yieldBasis", "sourceUrl", "unknownsLimits"],
    distribution: [
      { "@type": "DataDownload", name: "Wave48 tokenized Treasury rights and operations JSON", contentUrl: WAVE48_TOKENIZED_TREASURY_RIGHTS_OPS_URL, encodingFormat: "application/json" },
    ],
    citation: [`${PUBLIC_ORIGIN}/topics/tokenized-treasuries`, WAVE48_TOKENIZED_TREASURY_RIGHTS_OPS_URL],
    conditionsOfAccess: WAVE48_TOKENIZED_TREASURY_RIGHTS_OPS_LIMITATIONS,
  };
}
function citationAssetSchemas() {
  return [
    ...MACHINE_READABLE_CITATION_ASSETS.map((asset) => ({ "@type": "DigitalDocument", ...asset })),
    wave48PerpDexCostCitationsDatasetSchema(),
    regionalFundingMatrixDatasetSchema(),
  ];
}
function researchAttribution(sourceUrls = []) {
  return {
    author: RESEARCH_DESK,
    publisher: NEXUALPHA_PUBLISHER,
    reviewedBy: RESEARCH_DESK,
    isAccessibleForFree: true,
    citation: uniqueUrls([`${PUBLIC_ORIGIN}/methodology`, `${PUBLIC_ORIGIN}/llms.txt`, `${PUBLIC_ORIGIN}/llms-full.txt`, ...sourceUrls]),
    hasPart: citationAssetSchemas(),
  };
}
function newsArticleAuthor(article) {
  const name = String(article?.author || "").trim() || RESEARCH_DESK.name;
  if (name === RESEARCH_DESK.name) return RESEARCH_DESK;
  return { "@type": "Organization", name };
}
function tokenizedTreasuryArticleFaqCitations(article, question) {
  const sourceUrls = Array.isArray(article?.sources) ? article.sources.map((source) => source?.url).filter(Boolean) : [];
  const matching = (patterns) => sourceUrls.filter((url) => patterns.some((pattern) => pattern.test(url)));
  const patterns = /BUIDL|BENJI|same kind of claim/i.test(question)
    ? [/2013810/, /2094496/, /franklin-on-chain/, /9001-PSUM/, /securitize\.io\/blackrock\/buidl/]
    : /lose money|yield/i.test(question)
      ? [/treasury-bills/, /franklin-on-chain/, /9001-PSUM/, /blackrock.*product-screener/]
      : /transfer|wallet/i.test(question)
        ? [/tokenized-securities/, /2094496/, /blackrock-token-addresses/]
        : /stablecoin/i.test(question)
          ? [/tokenized-securities/, /crypto-assets/, /franklin-on-chain/, /securitize\.io\/blackrock\/buidl/]
          : [/buying-a-marketable-security/, /treasury-bills/, /tokenized-securities/];
  return uniqueUrls([WAVE48_TOKENIZED_TREASURY_RIGHTS_OPS_URL, ...matching(patterns)]).slice(0, 6);
}
function tokenizedTreasuryGscFaqEntry(articleLocale) {
  if (articleLocale !== "en") return null;
  return {
    question: "What are tokenized Treasuries?",
    answer: "Tokenized Treasuries are blockchain-recorded products that reference Treasury-bill or Treasury-fund exposure, but the token label alone does not prove direct Treasury ownership. Check the issuer or legal wrapper, recordkeeper, custodian, redemption path, transfer controls, permitted chain, eligibility and yield basis before comparing products.",
  };
}
const CURATED_COMPARISONS = new Set(CURATED_COMPARISON_SLUGS);
const SEARCH_CORE_STATIC_PATHS = new Set(["/", "/exchanges", "/activities", "/rates", "/onchain", "/methodology", "/telegram"]);
// Owner 2026-10-10 (search growth): these pages are fully translated in all 15 locales (measured English share of the
// visible text under 20% per locale), so every locale edition is published to search, not only en/zh/ja/ko/tr.
// /methodology and /telegram stay on the short list (still partly English), as do the venue profiles below whose
// localized editions are still 25%+ English.
const SEARCH_ALL_LOCALE_STATIC_PATHS = new Set(["/exchanges", "/compare", "/activities", "/rates", "/onchain", "/liquidations", "/funding-rates", "/funding-rates/matrix", ...BRAND_PAGE_PATHS]);
const SEARCH_ALL_LOCALE_VENUE_EXCLUSIONS = new Set(["hyperliquid", "htx", "hashkey", "uniswap", "aevo", "jupiter"]);
const SEARCH_SECONDARY_STATIC_PATHS = new Set(["/partners"]);
const SEARCH_PRIORITY_VENUES = new Set(["binance", "okx", "bybit", "bitget", "backpack", "coinbase", "kraken", "hyperliquid", "uniswap"]);
const SEARCH_REVIEWED_TRILINGUAL_VENUES = new Set(["drift", "deribit"]);
const SEARCH_PRIORITY_FACTBOOK = new Set(["binance", "okx", "bybit", "bitget", "coinbase", "kraken", "hyperliquid", "uniswap"]);
const SEARCH_PRIORITY_COMPARISONS = new Set(["binance-vs-okx", "binance-vs-bybit", "okx-vs-bybit", "bybit-vs-bitget", "hyperliquid-vs-dydx", "uniswap-vs-jupiter", "coinbase-vs-kraken", "binance-vs-bitget", "bitget-vs-okx", "bybit-vs-mexc", "bitget-vs-mexc"]);
const SEARCH_PRIORITY_TOPICS = new Set(["meme-coins", "derivatives", "compliant-exchanges", "no-kyc", "tokenized-assets"]);
const ACTIVE_VENUES = new Set(neutralVenueCatalog.map((venue) => venue.slug));
const UI_LOCALES = new Set(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"]);
const NATIVE_REVIEW_PENDING_LOCALES = new Set(["ur", "uk"]);
const COMPARE_FAQ_COPY = {
  en: ["Which published terms should I compare?", "Compare product fees, account tiers, identity requirements, regional availability and source dates. Verify final terms on the official platform."],
  "zh-Hans": ["比较时应先核对哪些公开条件？", "比较分产品费率、账户层级、身份要求、地区可用性和来源日期，并在官方流程中核验最终条件。"],
  "zh-Hant": ["比較時應先核對哪些公開條件？", "比較分產品費率、帳戶層級、身份要求、地區可用性與來源日期，並在官方流程中核對最終條件。"],
  es: ["¿Qué condiciones publicadas debo comparar?", "Compara comisiones por producto, cuenta, identidad, disponibilidad regional y fecha de la fuente. Confirma las condiciones finales en la plataforma oficial."],
  "pt-BR": ["Quais condições publicadas devo comparar?", "Compare taxas por produto, conta, identidade, disponibilidade regional e data da fonte. Confirme as condições finais na plataforma oficial."],
  fr: ["Quelles conditions publiées comparer ?", "Comparez les frais, le compte, l’identité, la disponibilité régionale et la date de la source. Vérifiez les conditions finales sur la plateforme officielle."],
  de: ["Welche veröffentlichten Bedingungen sollte ich vergleichen?", "Vergleichen Sie Gebühren, Konto, Identität, regionale Verfügbarkeit und Quelldatum. Prüfen Sie die endgültigen Bedingungen auf der offiziellen Plattform."],
  ja: ["どの公開条件を比較すべきですか？", "商品別手数料、アカウント、本人確認、地域利用可否、出典日を比較し、最終条件を公式で確認します。"],
  ko: ["어떤 공개 조건을 비교해야 하나요?", "상품별 수수료, 계정, 본인확인, 지역 이용 가능 여부와 출처 날짜를 비교하고 최종 조건을 공식 절차에서 확인하세요."],
  ar: ["ما الشروط المنشورة التي ينبغي مقارنتها؟", "قارن الرسوم والحساب والهوية والتوفر الإقليمي وتاريخ المصدر، ثم تحقق من الشروط النهائية عبر المنصة الرسمية."],
  tr: ["Hangi yayımlanmış koşullar karşılaştırılmalı?", "Ücretleri, hesabı, kimlik şartlarını, bölgesel uygunluğu ve kaynak tarihini karşılaştırın; son koşulları resmî platformda doğrulayın."],
  ru: ["Какие опубликованные условия сравнивать?", "Сравните комиссии, аккаунт, личность, доступность по регионам и дату источника. Итоговые условия проверяйте на официальной платформе."],
  id: ["Ketentuan publik apa yang perlu dibandingkan?", "Bandingkan biaya, akun, identitas, ketersediaan regional, dan tanggal sumber. Verifikasi ketentuan akhir di platform resmi."],
  vi: ["Nên so sánh những điều kiện công bố nào?", "So sánh phí, tài khoản, danh tính, khả dụng theo khu vực và ngày nguồn. Xác minh điều kiện cuối cùng trên nền tảng chính thức."],
  it: ["Quali condizioni pubblicate confrontare?", "Confronta commissioni, account, identità, disponibilità regionale e data della fonte. Verifica le condizioni finali sulla piattaforma ufficiale."],
  // l10n: needs native review
  ur: ["کن شائع شدہ شرائط کا موازنہ کرنا چاہیے؟", "مصنوعات کی فیس، اکاؤنٹ کی سطحیں، شناختی تقاضے، علاقائی دستیابی اور ماخذ کی تاریخیں موازنہ کریں۔ آخری شرائط سرکاری پلیٹ فارم پر تصدیق کریں۔"],
  // l10n: needs native review
  uk: ["Які опубліковані умови варто порівнювати?", "Порівнюйте комісії за продуктами, рівні акаунта, вимоги до ідентифікації, регіональну доступність і дати джерел. Остаточні умови перевіряйте на офіційній платформі."],
};

function searchPublicationLocales(pathname, options = {}) {
  if (getBrazilPage(pathname)) return ["pt-BR"];
  if (pathname === "/") return INDEXABLE_LOCALES;
  const regionalLocales = {
    "/mx": ["es"],
    "/tw": ["zh-Hant"],
    "/id": ["id"],
    "/hk": ["zh-Hant"],
    "/eu": ["en"],
    "/uk": ["en"],
    "/us": ["en"],
    "/jp": ["ja"],
    "/kr": ["ko"],
    "/sg": ["en"],
    "/markets/turkiye": ["tr"],
  }[pathname];
  if (regionalLocales) return regionalLocales;
  if (pathname === "/topics" || pathname === "/factbook") return ["en"];
  // /embed/* are iframe widgets: noindex,follow (meta + X-Robots-Tag) and in no sitemap (SEO audit 2026-10-11 #13).
  if (pathname === "/embed" || pathname.startsWith("/embed/")) return [];
  // Academy (mirror of the Worker): the locales with a localized lesson.
  if (parseAppDownloadPath(pathname)?.valid) return Object.keys(LOCALE_PREFIX_BY_CODE);
  if (parseAcademyPath(pathname) && parseAcademyPath(pathname).kind !== "missing") return ACADEMY_INDEX_LOCALES;
  // Where to buy <coin> (mirror of the Worker): the coin's indexable editions.
  if (parseCoinsPath(pathname) && parseCoinsPath(pathname).kind !== "missing") return coinsRouteSeo(pathname, "en", { urlFor: (path) => path })?.alternatesLocales || [];
  if (parseConverterPath(pathname) && parseConverterPath(pathname).kind !== "missing") return converterRouteSeo(pathname, "en", { urlFor: (path) => path })?.alternatesLocales || [];
  // Crypto glossary (mirror of the Worker): the hub's and each term's written editions.
  if (parseGlossaryPath(pathname) && parseGlossaryPath(pathname).kind !== "missing") return glossaryRouteSeo(pathname, "en", { urlFor: (path) => path })?.alternatesLocales || [];
  // Binance October campaigns page (mirror of the Worker): its written editions.
  if (parseBinanceOctoberPath(pathname)) return BINANCE_OCTOBER_INDEX_LOCALES;
  // Bybit Stocks campaign page (mirror of the Worker): its written editions.
  if (parseBybitStocksPath(pathname)) return BYBIT_STOCKS_INDEX_LOCALES;
  if (pathname === "/news") return newsListingIndexableLocales(options.newsArticles);
  if (options.article) {
    if (!Array.isArray(options.newsArticles)) return isReviewedNewsSearchArticle(options.article) ? newsArticleSeoLocales(options.article) : [];
    return selectReviewedNewsSearchSlugs(options.newsArticles).has(options.article.slug) ? newsArticleSeoLocales(options.article) : [];
  }
  if (tokenizedAssetPage(pathname.replace(/^\/topics\//, ""))) return TOKENIZED_ASSET_LOCALES;
  if (venueAlternativePage(pathname.replace(/^\/topics\//, ""))) return VENUE_ALTERNATIVES_INDEX_LOCALES;
  if (isBrazilDeadlineSlug(pathname.replace(/^\/topics\//, ""))) return brazilDeadlineIndexLocales(pathname);
  if (SEARCH_ALL_LOCALE_STATIC_PATHS.has(pathname)) return INDEXABLE_LOCALES;
  if (SEARCH_CORE_STATIC_PATHS.has(pathname)) return ["en", "zh-Hans", "ja", "ko", "tr"];
  if (SEARCH_SECONDARY_STATIC_PATHS.has(pathname)) return ["en", "zh-Hans"];
  const venueSlug = pathname.match(/^\/exchanges\/([a-z0-9-]+)$/)?.[1];
  if (venueSlug && ACTIVE_VENUES.has(venueSlug)) {
    if (SEARCH_REVIEWED_TRILINGUAL_VENUES.has(venueSlug)) return ["en", "zh-Hans", "zh-Hant"];
    if (!SEARCH_ALL_LOCALE_VENUE_EXCLUSIONS.has(venueSlug)) return INDEXABLE_LOCALES;
    return SEARCH_PRIORITY_VENUES.has(venueSlug) ? ["en", "zh-Hans", "ja", "ko", "tr"] : ["en", "zh-Hans"];
  }
  const factbookSlug = pathname.match(/^\/factbook\/([a-z0-9-]+)$/)?.[1];
  if (factbookSlug && venueDatabase[factbookSlug]) return SEARCH_PRIORITY_FACTBOOK.has(factbookSlug) ? ["en", "zh-Hans"] : ["en"];
  const comparisonSlug = pathname.match(/^\/compare\/([a-z0-9-]+(?:-vs-[a-z0-9-]+){1,2})$/)?.[1];
  if (comparisonSlug && CURATED_COMPARISONS.has(comparisonSlug)) return SEARCH_PRIORITY_COMPARISONS.has(comparisonSlug) && !comparisonSlug.split("-vs-").some((v) => SEARCH_ALL_LOCALE_VENUE_EXCLUSIONS.has(v)) ? INDEXABLE_LOCALES : ["en", "zh-Hans"];
  if (comparisonSlug && parseComparePair(comparisonSlug)?.length === 2) return generatedComparePolicy(comparisonSlug).indexable ? generatedCompareLocales(comparisonSlug) : [];
  const topicSlug = pathname.match(/^\/topics\/([a-z0-9-]+)$/)?.[1];
  if (topicSlug && TOPIC_GUIDES[topicSlug]) return SEARCH_PRIORITY_TOPICS.has(topicSlug) ? ["en", "zh-Hans", "ja", "ko", "tr"] : ["en", "zh-Hans"];
  return [];
}
// Home title/description (owner 2026-10-10 search intent + 2026-10-11 brand slogans): one table shared with the
// Worker head and /api/route-seo, built in src/data/home-search-copy.js from src/data/brand-slogan.js.
export { HOME_SEARCH_COPY };
const STATIC_COPY = {
  "/": [HOME_SEARCH_COPY.en[0], HOME_SEARCH_COPY["zh-Hans"][0]],
  "/exchanges": ["Crypto Exchanges Directory & Fee Comparison — NexuAlpha", "交易平台黄页与手续费对比 — NexuAlpha"],
  "/compare": [compareIndexCopy("en").title, compareIndexCopy("zh-Hans").title],
  "/activities": ["Official Crypto Campaigns — NexuAlpha", "官方活动中心 — NexuAlpha"],
  "/news": [NEWS_HUB_SEO_EN.title, "市场新闻与研究 — NexuAlpha"],
  "/rates": ["Crypto Exchange Fee Benchmark Terminal — NexuAlpha", "交易所手续费基准终端 — NexuAlpha"],
  "/onchain": [onchainGuideSeo("en").title, onchainGuideSeo("zh-Hans").title],
  "/methodology": ["Research Methodology & Editorial Policy — NexuAlpha", "研究方法与编辑政策 — NexuAlpha"],
  [ABOUT_PATH]: [BRAND_PAGE_SEO[ABOUT_PATH].en[0], BRAND_PAGE_SEO[ABOUT_PATH]["zh-Hans"][0]],
  [EDITORIAL_POLICY_PATH]: [BRAND_PAGE_SEO[EDITORIAL_POLICY_PATH].en[0], BRAND_PAGE_SEO[EDITORIAL_POLICY_PATH]["zh-Hans"][0]],
  "/embed/calculator": ["Embeddable Trading Fee Calculator — NexuAlpha", "可嵌入交易手续费计算器 — NexuAlpha"],
  "/partners": ["Partner Embeds & Distribution — NexuAlpha", "合作嵌入与内容分发 — NexuAlpha"],
};
const STATIC_COPY_LOCALIZED = {
  "zh-Hans": { "/": HOME_SEARCH_COPY["zh-Hans"][0], "/exchanges": "加密交易平台目录与费率对比 — NexuAlpha", "/activities": "官方活动与上新 — NexuAlpha", "/news": "市场新闻与研究 — NexuAlpha", "/rates": "加密交易平台费率基准 — NexuAlpha" },
  "zh-Hant": { "/": HOME_SEARCH_COPY["zh-Hant"][0], "/exchanges": "加密交易平台目錄與費率比較 — NexuAlpha", "/activities": "官方活動與上新 — NexuAlpha", "/news": "市場新聞與研究 — NexuAlpha", "/rates": "加密交易平台費率基準 — NexuAlpha" },
  ja: { "/": HOME_SEARCH_COPY["ja"][0], "/exchanges": "暗号資産取引所一覧と手数料比較 — NexuAlpha", "/activities": "公式キャンペーン・新規特典 — NexuAlpha", "/news": "市場ニュースと調査 — NexuAlpha", "/rates": "暗号資産取引所の手数料ベンチマーク — NexuAlpha" },
  ko: { "/": HOME_SEARCH_COPY["ko"][0], "/exchanges": "암호화폐 거래소 목록 및 수수료 비교 — NexuAlpha", "/activities": "공식 캠페인 및 신규 혜택 — NexuAlpha", "/news": "시장 뉴스 및 리서치 — NexuAlpha", "/rates": "암호화폐 거래소 수수료 벤치마크 — NexuAlpha" },
  tr: { "/": HOME_SEARCH_COPY["tr"][0], "/exchanges": "Kripto borsaları dizini ve ücret karşılaştırması — NexuAlpha", "/activities": "Resmî kampanyalar ve yeni üye fırsatları — NexuAlpha", "/news": "Piyasa haberleri ve araştırma — NexuAlpha", "/rates": "Kripto borsa ücretleri kıyaslama terminali — NexuAlpha" },
  es: { "/": HOME_SEARCH_COPY["es"][0], "/exchanges": "Directorio de exchanges cripto y comparación de comisiones — NexuAlpha", "/activities": "Campañas oficiales y ventajas para nuevos usuarios — NexuAlpha", "/news": "Noticias del mercado e investigación — NexuAlpha", "/rates": "Terminal de comparación de comisiones cripto — NexuAlpha" },
  "pt-BR": { "/": HOME_SEARCH_COPY["pt-BR"][0], "/exchanges": "Diretório de exchanges cripto e comparação de taxas — NexuAlpha", "/activities": "Campanhas oficiais e benefícios para novos usuários — NexuAlpha", "/news": "Notícias de mercado e pesquisa — NexuAlpha", "/rates": "Terminal de comparação de taxas cripto — NexuAlpha" },
  fr: { "/": HOME_SEARCH_COPY["fr"][0], "/exchanges": "Annuaire des plateformes crypto et comparaison des frais — NexuAlpha", "/activities": "Campagnes officielles et avantages nouveaux utilisateurs — NexuAlpha", "/news": "Actualités du marché et recherche — NexuAlpha", "/rates": "Terminal de comparaison des frais crypto — NexuAlpha" },
  de: { "/": HOME_SEARCH_COPY["de"][0], "/exchanges": "Krypto-Plattformverzeichnis und Gebührenvergleich — NexuAlpha", "/activities": "Offizielle Kampagnen und Vorteile für neue Nutzer — NexuAlpha", "/news": "Marktnachrichten und Recherche — NexuAlpha", "/rates": "Terminal für Krypto-Gebührenvergleiche — NexuAlpha" },
  ar: { "/": HOME_SEARCH_COPY["ar"][0], "/exchanges": "دليل منصات العملات الرقمية ومقارنة الرسوم — NexuAlpha", "/activities": "الحملات الرسمية ومزايا المستخدمين الجدد — NexuAlpha", "/news": "أخبار السوق والأبحاث — NexuAlpha", "/rates": "محطة مقارنة رسوم منصات العملات الرقمية — NexuAlpha" },
  ru: { "/": HOME_SEARCH_COPY["ru"][0], "/exchanges": "Каталог криптоплатформ и сравнение комиссий — NexuAlpha", "/activities": "Официальные кампании и бонусы для новых пользователей — NexuAlpha", "/news": "Новости рынка и исследования — NexuAlpha", "/rates": "Терминал сравнения комиссий криптоплатформ — NexuAlpha" },
  id: { "/": HOME_SEARCH_COPY["id"][0], "/exchanges": "Direktori platform kripto dan perbandingan biaya — NexuAlpha", "/activities": "Kampanye resmi dan manfaat pengguna baru — NexuAlpha", "/news": "Berita pasar dan riset — NexuAlpha", "/rates": "Terminal perbandingan biaya kripto — NexuAlpha" },
  vi: { "/": HOME_SEARCH_COPY["vi"][0], "/exchanges": "Danh mục nền tảng tiền mã hóa và so sánh phí — NexuAlpha", "/activities": "Chiến dịch chính thức và ưu đãi người dùng mới — NexuAlpha", "/news": "Tin tức thị trường và nghiên cứu — NexuAlpha", "/rates": "Thiết bị so sánh phí nền tảng tiền mã hóa — NexuAlpha" },
  it: { "/": HOME_SEARCH_COPY["it"][0], "/exchanges": "Directory delle piattaforme crypto e confronto delle commissioni — NexuAlpha", "/activities": "Campagne ufficiali e vantaggi per nuovi utenti — NexuAlpha", "/news": "Notizie di mercato e ricerca — NexuAlpha", "/rates": "Terminale di confronto delle commissioni crypto — NexuAlpha" },
  // l10n: needs native review
  ur: { "/": "کرپٹو ایکسچینج موازنہ، فیس اور سرکاری ماخذ کی جانچ — NexuAlpha", "/exchanges": "کرپٹو ایکسچینج ڈائریکٹری اور فیس موازنہ — NexuAlpha", "/activities": "سرکاری مہمات اور نئے صارف کے فوائد — NexuAlpha", "/news": "مارکیٹ خبریں اور تحقیق — NexuAlpha", "/rates": "کرپٹو فیس موازنے کا بنچ مارک ٹرمینل — NexuAlpha" },
  // l10n: needs native review
  uk: { "/": "Порівняння криптобірж, комісій і перевірок офіційних джерел — NexuAlpha", "/exchanges": "Довідник криптобірж і порівняння комісій — NexuAlpha", "/activities": "Офіційні кампанії та переваги для нових користувачів — NexuAlpha", "/news": "Ринкові новини й дослідження — NexuAlpha", "/rates": "Термінал порівняння комісій криптобірж — NexuAlpha" },
};
for (const [locale, title] of Object.entries({
  ar: "منهجية البحث والسياسة التحريرية — NexuAlpha", ru: "Методология исследований и редакционная политика — NexuAlpha", id: "Metodologi riset dan kebijakan editorial — NexuAlpha", vi: "Phương pháp nghiên cứu và chính sách biên tập — NexuAlpha", it: "Metodologia di ricerca e politica editoriale — NexuAlpha",
  es: "Metodología de investigación y política editorial — NexuAlpha", "pt-BR": "Metodologia de pesquisa e política editorial — NexuAlpha", fr: "Méthodologie de recherche et politique éditoriale — NexuAlpha", de: "Forschungsmethodik und redaktionelle Richtlinie — NexuAlpha", ja: "調査方法論と編集方針 — NexuAlpha", ko: "조사 방법론 및 편집 정책 — NexuAlpha", tr: "Araştırma yöntemi ve editoryal politika — NexuAlpha", "zh-Hans": "研究方法与编辑政策 — NexuAlpha", "zh-Hant": "研究方法與編輯政策 — NexuAlpha",

  // l10n: needs native review
  ur: "تحقیقی طریقۂ کار اور ادارتی پالیسی — NexuAlpha",
  // l10n: needs native review
  uk: "Методологія досліджень і редакційна політика — NexuAlpha"
})) STATIC_COPY_LOCALIZED[locale]["/methodology"] = title;

const REVIEW_PENDING_COMPARE_INDEX_COPY = Object.freeze({
  // l10n: needs native review
  ur: ["کرپٹو ایکسچینجز کا پہلو بہ پہلو موازنہ — NexuAlpha", "دو کرپٹو پلیٹ فارمز کو فیس، مصنوعات، اکاؤنٹ کی شرائط اور ماخذی جانچ کے لحاظ سے موازنہ کریں؛ آخری شرائط سرکاری پلیٹ فارم پر تصدیق کریں۔"],
  // l10n: needs native review
  uk: ["Порівняння криптобірж поруч — NexuAlpha", "Порівнюйте дві криптоплатформи за комісіями, продуктами, вимогами до акаунта й перевірками джерел; остаточні умови перевіряйте на офіційній платформі."],
});
const compareIndexSeoCopy = (locale) => REVIEW_PENDING_COMPARE_INDEX_COPY[locale] || [compareIndexCopy(locale).title, compareIndexCopy(locale).description];

const STATIC_PAGE_COPY_LOCALIZED = {
  "/": { ...HOME_SEARCH_COPY },
  // Compare hub (compare-any, 2026-10-11): templates live in compare-generated.js; review-pending locales carry SEO-only copy here.
  "/compare": Object.fromEntries([...UI_LOCALES].map((locale) => [locale, compareIndexSeoCopy(locale)])),
  [ABOUT_PATH]: { ...BRAND_PAGE_SEO[ABOUT_PATH] },
  [EDITORIAL_POLICY_PATH]: { ...BRAND_PAGE_SEO[EDITORIAL_POLICY_PATH] },
  "/rates": {
    en: ["Crypto Exchange Fee Benchmark Terminal — NexuAlpha", "Compare published maker and taker fee references across CEX, DEX and perpetual platforms. Use the page as a scenario checklist, then verify VIP tier, funding, withdrawal and account terms on the official platform."],
    "zh-Hans": ["交易所手续费基准终端 — NexuAlpha", "对比中心化交易所、DEX 与永续合约平台公开的 Maker、Taker 手续费基准。"],
    "zh-Hant": ["交易所手續費基準終端 — NexuAlpha", "比較中心化交易所、DEX 與永續合約平台公開的 Maker、Taker 手續費基準。"],
    es: ["Terminal de comparación de comisiones cripto — NexuAlpha", "Compara comisiones maker y taker publicadas en exchanges centralizados, DEX y plataformas perpetuas."],
    "pt-BR": ["Terminal de comparação de taxas cripto — NexuAlpha", "Compare taxas maker e taker publicadas por CEXs, DEXs e plataformas perpétuas."],
    fr: ["Terminal de comparaison des frais crypto — NexuAlpha", "Comparez les frais maker et taker publiés par les CEX, DEX et plateformes perpétuelles."],
    de: ["Terminal für Krypto-Gebührenvergleiche — NexuAlpha", "Vergleichen Sie veröffentlichte Maker- und Taker-Gebühren von CEXs, DEXs und Perpetual-Plattformen."],

    // l10n: needs native review
    ur: ["کرپٹو فیس موازنے کا بنچ مارک ٹرمینل — NexuAlpha", "CEX، DEX اور پرپیچوئل پلیٹ فارمز کی شائع شدہ maker اور taker فیس حوالہ جات موازنہ کریں؛ آخری اکاؤنٹ شرائط سرکاری پلیٹ فارم پر تصدیق کریں۔"],

    // l10n: needs native review
    uk: ["Термінал порівняння комісій криптобірж — NexuAlpha", "Порівнюйте опубліковані довідкові комісії maker і taker для CEX, DEX і безстрокових платформ; остаточні умови акаунта перевіряйте на офіційній платформі."],
  },
  "/methodology": {
    "zh-Hant": ["研究方法與編輯政策 — NexuAlpha", "了解 NexuAlpha 如何核驗來源、區分事實與估算，並披露商業合作關係。"],
    es: ["Metodología de investigación y política editorial — NexuAlpha", "Cómo NexuAlpha verifica fuentes, separa hechos de estimaciones y declara relaciones comerciales."],
    "pt-BR": ["Metodologia de pesquisa e política editorial — NexuAlpha", "Como a NexuAlpha verifica fontes, separa fatos de estimativas e declara relações comerciais."],
    fr: ["Méthodologie de recherche et politique éditoriale — NexuAlpha", "Comment NexuAlpha vérifie les sources, sépare faits et estimations et déclare les relations commerciales."],
    de: ["Forschungsmethodik und redaktionelle Richtlinie — NexuAlpha", "Wie NexuAlpha Quellen prüft, Fakten von Schätzungen trennt und kommerzielle Beziehungen offenlegt."],

    // l10n: needs native review
    ur: ["تحقیقی طریقۂ کار اور ادارتی پالیسی — NexuAlpha", "NexuAlpha ماخذوں کی تصدیق، حقائق کو اندازوں سے الگ کرنے اور تجارتی تعلقات ظاہر کرنے کا طریقہ۔"],

    // l10n: needs native review
    uk: ["Методологія досліджень і редакційна політика — NexuAlpha", "Як NexuAlpha перевіряє джерела, відокремлює факти від оцінок і розкриває комерційні зв’язки."],
  },
  "/embed/calculator": {
    "zh-Hant": ["可嵌入交易手續費計算器 — NexuAlpha", "嵌入帶透明假設與披露說明的 NexuAlpha 交易手續費比較計算器。"],
    es: ["Calculadora de comisiones de trading integrable — NexuAlpha", "Inserta una calculadora de comisiones con supuestos transparentes y divulgaciones visibles."],
    "pt-BR": ["Calculadora de taxas de trading incorporável — NexuAlpha", "Incorpore uma calculadora de comparação de taxas com premissas e divulgações transparentes."],
    fr: ["Calculateur de frais de trading intégrable — NexuAlpha", "Intégrez un calculateur de frais avec hypothèses transparentes et informations visibles."],
    de: ["Einbettbarer Trading-Gebührenrechner — NexuAlpha", "Binden Sie einen Gebührenrechner mit transparenten Annahmen und Offenlegungen ein."],
    ja: ["埋め込み可能な取引手数料計算機 — NexuAlpha", "透明な前提と開示を備えた手数料比較計算機を埋め込みます。"],
    ko: ["임베드 가능한 거래 수수료 계산기 — NexuAlpha", "투명한 가정과 고지를 포함한 수수료 비교 계산기를 삽입합니다."],
    tr: ["Gömülebilir işlem ücreti hesaplayıcısı — NexuAlpha", "Şeffaf varsayımlar ve açıklamalar içeren ücret karşılaştırma aracını gömün."],

    // l10n: needs native review
    ur: ["ایمبیڈ کے قابل ٹریڈنگ فیس کیلکولیٹر — NexuAlpha", "شفاف مفروضات اور افشا بیانات کے ساتھ فیس موازنہ کیلکولیٹر ایمبیڈ کریں۔"],

    // l10n: needs native review
    uk: ["Калькулятор торгових комісій для вбудовування — NexuAlpha", "Вбудуйте калькулятор порівняння комісій із прозорими припущеннями та розкриттями."],
  },
  "/partners": {
    "zh-Hant": ["合作嵌入與內容分發 — NexuAlpha", "面向使用 NexuAlpha 研究與比較元件的發布者提供接入說明。"],
    es: ["Embeds para socios y distribución — NexuAlpha", "Guía de integración para editores que usan investigación y comparaciones de NexuAlpha."],
    "pt-BR": ["Embeds de parceiros e distribuição — NexuAlpha", "Orientação de integração para editores que usam pesquisas e comparações da NexuAlpha."],
    fr: ["Intégrations partenaires et distribution — NexuAlpha", "Guide d’intégration pour les éditeurs utilisant les recherches et comparaisons NexuAlpha."],
    de: ["Partner-Einbettungen und Distribution — NexuAlpha", "Integrationshinweise für Publisher, die NexuAlpha-Recherche und Vergleichsmodule nutzen."],
    ja: ["パートナー埋め込みと配信 — NexuAlpha", "NexuAlphaの調査と比較モジュールを使う発行者向けの導入ガイドです。"],
    ko: ["파트너 임베드와 배포 — NexuAlpha", "NexuAlpha 리서치와 비교 모듈을 사용하는 게시자를 위한 연동 안내입니다."],
    tr: ["Partner embedleri ve dağıtım — NexuAlpha", "NexuAlpha araştırma ve karşılaştırma modüllerini kullanan yayıncılar için entegrasyon rehberi."],

    // l10n: needs native review
    ur: ["پارٹنر ایمبیڈز اور تقسیم — NexuAlpha", "NexuAlpha کی تحقیق اور موازنہ ماڈیولز استعمال کرنے والے ناشرین کے لیے انضمام کی رہنمائی۔"],

    // l10n: needs native review
    uk: ["Партнерські вбудовування й дистрибуція — NexuAlpha", "Інструкції з інтеграції для видавців, які використовують дослідження й модулі порівняння NexuAlpha."],
  },
};

const STATIC_DESCRIPTION_LOCALIZED = {
  "zh-Hant": "NexuAlpha 獨立整理加密平台公開費率、儲備來源、地區條件與官方路徑。帳戶條款與用戶權益需以官方流程核驗。",
  es: "Base independiente de plataformas cripto con comisiones publicadas, condiciones regionales y rutas oficiales. Verifica siempre los términos de tu cuenta.",
  "pt-BR": "Base independente de plataformas cripto com taxas publicadas, condições regionais e rotas oficiais. Confirme sempre os termos da sua conta.",
  fr: "Base indépendante de plateformes crypto avec frais publiés, conditions régionales et accès officiels. Vérifiez toujours les conditions de votre compte.",
  de: "Unabhängige Datenbank für Krypto-Plattformen mit veröffentlichten Gebühren, regionalen Bedingungen und offiziellen Wegen. Prüfe die Bedingungen deines Kontos.",
  ar: "قاعدة مستقلة لمنصات العملات الرقمية تتضمن الرسوم المنشورة والشروط الإقليمية والروابط الرسمية. تحقق دائماً من شروط حسابك.",
  ru: "Независимая база криптоплатформ с опубликованными комиссиями, региональными условиями и официальными маршрутами. Всегда проверяйте условия своего аккаунта.",
  id: "Basis independen platform kripto dengan biaya yang dipublikasikan, ketentuan regional, dan jalur resmi. Selalu periksa ketentuan akun Anda.",
  vi: "Cơ sở dữ liệu độc lập về nền tảng tiền mã hóa với phí công bố, điều kiện khu vực và đường dẫn chính thức. Luôn kiểm tra điều khoản tài khoản của bạn.",
  it: "Database indipendente delle piattaforme crypto con commissioni pubblicate, condizioni regionali e percorsi ufficiali. Verifica sempre i termini del tuo account.",
  ja: "公開手数料、地域条件、公式ルートを整理した独立暗号資産プラットフォームデータベース。アカウント条件は必ず確認してください。",
  ko: "공개 수수료, 지역 조건, 공식 경로를 정리한 독립 암호화폐 플랫폼 데이터베이스입니다. 계정 조건을 반드시 확인하세요.",
  tr: "Yayınlanmış ücretleri, bölgesel koşulları ve resmî yolları sunan bağımsız kripto platformu veritabanı. Hesap koşullarınızı mutlaka doğrulayın.",

  // l10n: needs native review
  ur: "شائع شدہ فیس، علاقائی شرائط اور سرکاری راستوں کے ساتھ آزاد کرپٹو پلیٹ فارم ڈیٹابیس۔ اپنے اکاؤنٹ کی شرائط ہمیشہ سرکاری عمل میں تصدیق کریں۔",

  // l10n: needs native review
  uk: "Незалежна база криптоплатформ з опублікованими комісіями, регіональними умовами й офіційними маршрутами. Умови акаунта завжди перевіряйте в офіційному процесі.",
};
const COMPARE_DESCRIPTION_LOCALIZED = {
  en: (name) => `Compare ${name} by trading fees, products, account requirements and platform differences.`,
  "zh-Hans": (name) => `比较 ${name} 的手续费、产品、账户条件与平台差异。`,
  "zh-Hant": (name) => `比較 ${name} 的手續費、產品、帳戶條件與平台差異。`,
  es: (name) => `Compara ${name} por comisiones, productos, requisitos de cuenta y diferencias entre plataformas.`,
  "pt-BR": (name) => `Compare ${name} por taxas, produtos, requisitos de conta e diferenças entre plataformas.`,
  fr: (name) => `Comparez ${name} selon les frais, les produits, les exigences du compte et les différences entre plateformes.`,
  de: (name) => `Vergleichen Sie ${name} nach Gebühren, Produkten, Kontobedingungen und Plattformunterschieden.`,
  ja: (name) => `${name} を手数料、商品、アカウント条件、プラットフォームの違いで比較します。`,
  ko: (name) => `${name}을 거래 수수료, 상품, 계정 조건과 플랫폼 차이로 비교하세요.`,
  ar: (name) => `قارن ${name} حسب الرسوم والمنتجات وشروط الحساب والفروق بين المنصات.`,
  tr: (name) => `${name} için ücretleri, ürünleri, hesap koşullarını ve platform farklarını karşılaştırın.`,
  ru: (name) => `Сравните ${name} по комиссиям, продуктам, условиям аккаунта и различиям платформ.`,
  id: (name) => `Bandingkan ${name} berdasarkan biaya, produk, ketentuan akun, dan perbedaan platform.`,
  vi: (name) => `So sánh ${name} theo phí, sản phẩm, điều kiện tài khoản và khác biệt nền tảng.`,
  it: (name) => `Confronta ${name} per commissioni, prodotti, requisiti dell’account e differenze tra piattaforme.`,

  // l10n: needs native review
  ur: (name) => `${name} کو ٹریڈنگ فیس، مصنوعات، اکاؤنٹ کی شرائط اور پلیٹ فارم کے فرق کے لحاظ سے موازنہ کریں۔`,

  // l10n: needs native review
  uk: (name) => `Порівняйте ${name} за торговими комісіями, продуктами, вимогами до акаунта й відмінностями платформ.`,
};

const SERP_CTR_NEWS_OVERRIDES = {
  "okx-usd-to-usdc-spot-pair-migration": {
    title: "OKX USD to USDC Migration (Sept 2026): API, Orders and Bots",
    description: "OKX moved affected Crypto-USD spot pairs to Crypto-USDC in September 2026. Check open orders, bots, API instId and tradeQuoteCcy before a live change.",
    question: "What should I check before the OKX USD to USDC spot-pair migration?",
    answer: "Check the official pair scope first, then inspect open orders, bots, API instrument identifiers, quote-currency handling and account balances before changing a live workflow.",
  },
  "hyperliquid-vs-dydx": {
    title: "Hyperliquid vs dYdX: Fees, Funding and Liquidation",
    description: "Compare Hyperliquid and dYdX fees, funding, collateral, liquidation, oracle, wallet and recovery mechanics before opening a perpetual position.",
    question: "Should I choose Hyperliquid or dYdX for perp DEX trading?",
    answer: "Choose only after comparing fees and funding alongside collateral, liquidation, oracle, wallet recovery and regional access; no single quoted rate settles the decision.",
  },
  "tokenized-treasuries-structure-access-risks": {
    title: "Tokenized Treasuries: BUIDL, BENJI, Ownership and Redemption Checks",
    description: "Check what a tokenized Treasury legally represents before comparing yield: issuer, recordkeeper, custodian, redemption path, wallet controls and eligibility.",
    question: "What should I verify before comparing tokenized Treasury yield?",
  },
};

function serpCtrNewsOverride(slug, locale) {
  return locale === "en" ? SERP_CTR_NEWS_OVERRIDES[slug] || null : null;
}

const VENUE_SEO_OVERRIDES = {
  "gate-io": {
    title: "Gate.io Fees, KYC, Listings and Referral Code Checks — NexuAlpha",
    description: "Check Gate.io spot and futures fee sources, KYC and regional conditions, withdrawal and listing risks, API scope, and whether the referral code appears in the official signup flow.",
    directAnswer: {
      question: "What should I verify before opening a Gate.io account?",
      answer: "Before opening a Gate.io account, verify the official regional domain, current identity requirements, the product-specific spot or futures fee schedule, withdrawal conditions, listing and delisting risk, API scope, and whether any referral code is visible in the official signup flow. Public fee, listing or referral information does not prove account eligibility, a final fee tier, withdrawal availability or a referral benefit for a specific user.",
    },
    faq: [
      ["Where should Gate.io fees be checked?", "Use Gate's current product-specific fee pages and the final account flow. Spot maker and taker rules, futures costs, VIP tiers, payment routes and withdrawal charges should not be collapsed into one universal fee."],
      ["Does a Gate.io referral code guarantee a benefit?", "No. Confirm that the code is visible in the official signup flow and review the current terms. A public code or link does not prove attribution, eligibility, reward value, account approval or commission."],
      ["What should be checked before trading a newly listed token on Gate.io?", "Verify the official listing announcement, exact pair, deposit and withdrawal state, liquidity, order type, price impact and any delisting or regional restriction before trading."],
      ["How should Gate.io API access be reviewed?", "Treat spot and futures REST or WebSocket surfaces as separate integrations. Verify the current API documentation, permissions, rate limits, account scope and product eligibility before enabling keys."],
    ],
    sourceUrls: [
      "https://www.gate.com/",
      "https://www.gate.com/docs/developers/apiv4/",
      "https://www.gate.com/help/trade/spot/22550/gate-io-s-spot-trading-fee-rules",
      "https://www.gate.com/announcements",
    ],
    relatedLinks: ["/compare/gate-io-vs-coinbase", "/compare/gate-io-vs-mexc", "/topics/meme-coins", "/topics/derivatives", "/rates", "/methodology"],
  },
  binance: {
    title: "Binance Fees, KYC and Product Scope Checks — NexuAlpha",
    description: "Review Binance spot and margin fee tables, BNB/VIP tier conditions, identity verification, product scope and official announcement paths before choosing an account route.",
    directAnswer: {
      question: "What should I check on Binance before comparing it with another exchange?",
      answer: "Start with Binance's published spot and margin fee table, VIP or BNB discount conditions, identity-verification requirement, product-specific availability and official announcement path. NexuAlpha treats these as source checks, not as a promise that every account receives the same fees, products or regional access.",
    },
    faq: [
      ["Are Binance fees the same for every user?", "No. Binance publishes maker and taker fee tables with tier conditions, and final costs can vary by product, account tier, BNB use, region, order type and current official terms."],
      ["Does a Binance profile prove account eligibility?", "No. The profile points to official fee, identity and announcement sources. Identity verification, regional rules and product access still need to be checked in the official account flow."],
    ],
    sourceUrls: [
      "https://www.binance.com/en/fee/trading",
      "https://www.binance.com/en/support/faq/detail/360027287111",
      "https://www.binance.com/en/support/announcement",
    ],
    relatedLinks: ["/compare/binance-vs-okx", "/topics/derivatives", "/factbook/binance"],
  },
  okx: {
    title: "OKX Fees, KYC, Web3 and Product Scope Checks — NexuAlpha",
    description: "Review OKX published fees, spot and derivatives product scope, Web3 access, identity requirements, announcements and proof-of-reserves before choosing an account route.",
    directAnswer: {
      question: "What should I check on OKX before choosing a trading route?",
      answer: "Start with OKX's published fee page, identity-verification support path, product scope, Web3 or DEX-style access, announcement taxonomy and proof-of-reserves source. NexuAlpha treats these as pre-signup checks, not as a promise that every account receives the same products, benefits or regional access.",
    },
    faq: [
      ["Are OKX fees one blended exchange fee?", "No. OKX separates spot, futures, options and other instrument fee areas. Compare the product-specific fee page with the account level, region, order type and current official account flow."],
      ["What should I verify after comparing OKX with Binance?", "Open the OKX profile, the Binance vs OKX comparison and the factbook, then verify the official domain, identity route, product permissions, fee page and current announcement source before registration."],
      ["Does Web3 or DEX-style access remove account checks?", "No. Web3 access, account-based trading, campaign eligibility and regional availability are separate surfaces. Check the official flow for the product and account you intend to use."],
    ],
    sourceUrls: [
      "https://www.okx.com/fees",
      "https://www.okx.com/help/section/announcements-latest-announcements",
      "https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported",
      "https://www.okx.com/proof-of-reserves",
    ],
    relatedLinks: ["/compare/binance-vs-okx", "/factbook/okx", "/exchanges/binance", "/activities"],
  },
  bybit: {
    title: "Bybit Fees, KYC, Derivatives and Copy Trading Checks — NexuAlpha",
    description: "Review Bybit trading-fee structure, KYC levels, derivatives access, copy trading boundaries, announcements and regional product conditions before choosing a signup path.",
    directAnswer: {
      question: "What should I check on Bybit before comparing it with Bitget?",
      answer: "Start with Bybit's trading-fee structure, individual KYC FAQ, product scope, derivatives permissions, copy-trading rules, announcements and regional restrictions. Treat a public profile as a source checklist before using any registration path, not as eligibility or product-access proof.",
    },
    faq: [
      ["Does Bybit require identity verification for products?", "Bybit's KYC material should be checked before product decisions because account level, region, product permissions and risk controls can change what an account can use."],
      ["What should I compare before using a copy-trading account route?", "Compare KYC level, product permissions, lead-trader rules, fee structure, risk controls and regional account availability. Public comparison content should narrow the checklist, not promise access."],
      ["Which page should I open after the Bybit profile?", "Use the Bybit vs Bitget comparison for copy trading, derivatives and stock-like exposure boundaries, then open the factbook and official fee or KYC pages for account-level confirmation."],
    ],
    sourceUrls: [
      "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ",
      "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure",
      "https://announcements.bybit.com/en/",
      "https://www.bybit.com/en/proof-of-reserves",
    ],
    relatedLinks: ["/compare/bybit-vs-bitget", "/factbook/bybit", "/exchanges/bitget", "/topics/derivatives"],
  },
  bitget: {
    title: "Bitget Fees, KYC, Futures and Copy Trading Checks — NexuAlpha",
    description: "Review Bitget spot fees, futures fee components, identity verification, copy trading, announcements and account conditions before choosing a registration route.",
    directAnswer: {
      question: "What should I check on Bitget before opening a registration route?",
      answer: "Start with Bitget's spot-fee article, futures-fee guide, identity-verification path, announcement center, copy-trading surface and current account conditions. A public profile can organize the decision path, but final eligibility and benefits must be checked in the official flow.",
    },
    faq: [
      ["Are Bitget spot and futures fees checked the same way?", "No. Bitget spot material defines maker and taker roles, while futures material separates transaction fees from funding fees. Compare the product you plan to use instead of reading one blended fee."],
      ["What should I compare before choosing Bitget over Bybit?", "Compare published fees, futures access, copy-trading workflow, KYC level, regional availability, product permissions and current official announcements before using a registration route."],
      ["Does a Bitget profile prove user benefits are available?", "No. The profile points to fee, identity and announcement sources. Benefits, tasks, account limits and product access remain subject to the current official account flow."],
    ],
    sourceUrls: [
      "https://www.bitget.com/support/articles/12560603820584",
      "https://www.bitget.com/support/articles/12560603817155",
      "https://www.bitget.com/support/articles/12560603795184",
      "https://www.bitget.com/support/announcement-center",
    ],
    relatedLinks: ["/compare/bybit-vs-bitget", "/factbook/bitget", "/exchanges/bybit", "/activities"],
  },
  hyperliquid: {
    title: "Hyperliquid Fees, Referral Discount and Funded Account Checks — NexuAlpha",
    description: "Review Hyperliquid 14-day fee tiers, hourly funding, referral discount vs cashback language, USDC collateral, sub-accounts, vaults and funded-account claims.",
    directAnswer: {
      question: "Is Hyperliquid a funded account or cashback platform, and what fees should I check before trading?",
      answer: "Hyperliquid fees should be read as a stack: rolling 14-day maker/taker fee tier, separate perp and spot schedules, hourly peer-to-peer funding, referral discount eligibility, USDC collateral route, margin mode, liquidation rules, sub-account or API-wallet permissions, and vault context. A Hyperliquid funded account search should separate self-funded wallet collateral, sub-accounts, API-wallet delegation and vault participation from third-party trader-funding offers; a cashback search should be checked against official referral discount and reward terms rather than treated as a guaranteed payout.",
      citations: [
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/vaults",
      ],
    },
    faq: [
      ["How are Hyperliquid fees reviewed?", "Use the official fee page first: Hyperliquid says fees are based on rolling 14 day volume and assessed at the end of each UTC day, with separate perp and spot schedules. Then check hourly funding, referral discount status, margin mode, liquidation mechanics, vault context and the collateral route before treating a quoted maker/taker rate as the whole cost.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding", "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals"]],
      ["What source map should I use for Hyperliquid fees?", "Use the fee schedule for maker/taker tiers and volume counting, the referrals page for discount and reward boundaries, funding docs for hourly peer-to-peer payments, contract specifications for market mechanics, USDC docs for collateral movement, vault docs for pooled strategy context and liquidation docs for maintenance-margin failure paths.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding", "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations"]],
      ["Does Hyperliquid have cashback or a referral discount?", "Use official referral language, not a generic cashback promise. Hyperliquid's docs describe referral rewards and a referral-code fee discount with volume boundaries; they also say referral discounts do not apply to vaults or sub-accounts. Verify the current app state before treating any code or link as a live benefit.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/referrals", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts"]],
      ["What does a Hyperliquid funded account search need to separate?", "Separate wallet funding, USDC collateral, account abstraction mode, sub-accounts, API-wallet delegation and vault participation. Hyperliquid's official docs do not turn the phrase into a Hyperliquid-operated funded account program, account-opening result, signup entitlement or third-party capital allocation.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/vaults", "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets"]],
      ["What should I verify before using a Hyperliquid CTA?", "Confirm the official app route, wallet network, collateral asset, account mode, sub-account or API-wallet permission, margin setting, funding cadence, vault context and liquidation rule before depositing or opening a position.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margining", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations", "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets"]],
      ["How does Hyperliquid funding change the cost calculation?", "Funding is separate from maker/taker trading fees. Hyperliquid documentation describes funding as a peer-to-peer payment every hour, so a pre-trade cost check should include likely funding direction and interval, not only the entry fee tier.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees"]],
      ["Why can a Hyperliquid funded-account answer be misleading?", "The phrase can mean several different things: adding personal USDC collateral, using account-abstraction modes, creating sub-accounts, delegating signing to an API wallet, joining a vault or evaluating an outside prop-firm offer. Each meaning needs a different official source check, so NexuAlpha keeps the answer as a source map instead of a single signup claim.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts", "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/vaults"]],
      ["Which Hyperliquid account details can change the final fee read?", "Sub-account volume can count toward a master account tier, vault volume is treated separately, spot volume is weighted differently from perp volume, and HIP-3 markets can add deployer or growth-mode fee conditions. Check the current official tier, account mode and market before treating any base rate as final.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/vaults", "https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals"]],
    ],
    sourceUrls: [
      "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
      "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding",
      "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals",
      "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc",
      "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margining",
      "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations",
      "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts",
      "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes",
      "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/vaults",
      "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets",
      "https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals",
    ],
    relatedLinks: ["/compare/hyperliquid-vs-dydx", "/news/hyperliquid-vs-dydx", "/topics/no-kyc", "/topics/derivatives#perp-cost-field-dictionary", "/topics/derivatives", "/factbook/hyperliquid", "/exchanges/dydx"],
  },
  dydx: {
    relatedLinks: ["/compare/hyperliquid-vs-dydx", "/topics/derivatives#perp-cost-field-dictionary", "/topics/derivatives", "/topics/no-kyc", "/factbook/dydx", "/exchanges/hyperliquid"],
    sourceUrls: [
      "https://docs.dydx.xyz/concepts/trading/rewards_fees_and_parameters",
      "https://docs.dydx.xyz/concepts/trading/funding",
      "https://docs.dydx.xyz/concepts/trading/margin",
      "https://docs.dydx.xyz/concepts/trading/liquidations",
    ],
  },
  uniswap: {
    reviewedAt: "2026-09-16",
    title: "Uniswap Testnet, Mainnet, Permit2 and Swap Preview Checklist — NexuAlpha",
    description: "Check Uniswap official app and docs, API and web testnet scope, mainnet chain, token contract, pool route, Permit2 spender, gas and wallet transaction preview.",
    directAnswer: {
      question: "How should I research Uniswap testnet or v4 hook routes before using a live swap?",
      answer: "For a Uniswap testnet query, first decide whether the task is developer testing, v4 hook review or a live-wallet route check, then separate API support from the official web interface. The reviewed source lists Ethereum Sepolia, Unichain Sepolia and Base Sepolia for API access, while the web interface lists only Ethereum Sepolia and Unichain Sepolia. Before a live swap, verify the official app URL, network-specific v4 deployment, token contract, Universal Router, Permit2 contract, spender, amount, expiration, gas asset, wallet simulation and final signed transaction. Testnet support and recognizable contract addresses do not prove mainnet liquidity, execution or signature safety.",
      citations: ["https://developers.uniswap.org/docs/trading/swapping-api/supported-chains", "https://developers.uniswap.org/docs/protocols/v4/deployments", "https://developers.uniswap.org/docs/protocols/universal-router/overview", "https://developers.uniswap.org/docs/protocols/permit2/overview", "https://support.uniswap.org/hc/en-us/articles/40050562560781-Crypto-Wallet-Signature-Scams"],
    },
    faq: [
      ["Does Uniswap testnet research prove a live swap route is safe?", "No. Testnet and local hook guides are developer research paths using test assets or local state. A live route still requires checking the official app URL, network, token contract, deployment mapping, gas cost and the final wallet transaction."],
      ["Is Uniswap testnet the same as mainnet real-money trading?", "No. A testnet or local hook setup is not a mainnet real-money environment. Treat it as a way to inspect contract behavior, deployment assumptions and signing flow before separately checking the live app, live network and wallet transaction."],
      ["What source map should I use for a Uniswap testnet query?", "Use the quickstart for official app URL behavior, v4 hook docs for local or test behavior, deployments for network-specific contract addresses and fee docs for static or dynamic fee mechanics."],
      ["What Uniswap fee versions should be compared?", "Compare the relevant v2, v3 or v4 fee model and pool behavior instead of assuming one DEX fee. v4 dynamic-fee or hook behavior should be verified against current Uniswap documentation and deployment data."],
      ["What should I verify before signing a Uniswap transaction?", "Check the app domain, chain, token address, pool route, approval spender or Permit2 route, expected output, slippage, gas token, wallet simulation and the final transaction data shown by the wallet."],
      ["What is the 60-second Uniswap testnet source check?", "Open the official Uniswap docs for fees, v4 deployments and hook behavior, confirm the target chain and contract address, then separate developer test evidence from any live swap route. A testnet result does not prove live liquidity, final gas cost, mainnet execution or wallet safety."],
      ["Which Uniswap testnets are available through the API versus the web interface?", "At the 2026-09-16 source review, Uniswap lists Ethereum Sepolia, Unichain Sepolia and Base Sepolia for API access. Its official supported-chains page says only Ethereum Sepolia and Unichain Sepolia are available as testnets in the web interface. This is dated availability evidence, not proof of mainnet liquidity or execution.", ["https://developers.uniswap.org/docs/trading/swapping-api/supported-chains"]],
      ["How are the token contract, Universal Router, Permit2 and spender different?", "The token contract identifies the asset on one chain; the Universal Router composes swap commands; Permit2 manages delegated token permission; and the spender is the protocol address authorized by that permission. Review them as separate fields with the chain, amount and expiration. A familiar domain or Permit2 address does not certify a signature as safe, and disconnecting a dapp does not revoke token approval.", ["https://developers.uniswap.org/docs/protocols/universal-router/overview", "https://developers.uniswap.org/docs/protocols/permit2/overview", "https://support.uniswap.org/hc/en-us/articles/26757826138637-What-is-a-token-contract-address", "https://support.uniswap.org/hc/en-us/articles/40050562560781-Crypto-Wallet-Signature-Scams", "https://support.uniswap.org/hc/en-us/articles/15724901841037-How-to-revoke-a-token-approval"]],
    ],
    sourceUrls: [
      "https://developers.uniswap.org/docs/get-started/concepts/fees",
      "https://developers.uniswap.org/docs/protocols/v4/concepts/dynamic-fees",
      "https://developers.uniswap.org/docs/protocols/v4/deployments",
      "https://developers.uniswap.org/docs/protocols/v4/guides/hooks/getting-started",
      "https://developers.uniswap.org/docs/protocols/permit2/overview",
      "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains",
      "https://developers.uniswap.org/docs/protocols/universal-router/overview",
      "https://support.uniswap.org/hc/en-us/articles/26757826138637-What-is-a-token-contract-address",
      "https://support.uniswap.org/hc/en-us/articles/40050562560781-Crypto-Wallet-Signature-Scams",
      "https://support.uniswap.org/hc/en-us/articles/15724901841037-How-to-revoke-a-token-approval",
    ],
    relatedLinks: ["/compare/uniswap-vs-jupiter", "/news/uniswap-v3-vs-pancakeswap-v3-concentrated-liquidity-controls", "/topics/meme-coins", "/topics/no-kyc", "/factbook/uniswap", "/exchanges/jupiter"],
  },
  aerodrome: {
    title: "Aerodrome Review: Base DEX Fees, Pools, Slipstream & veAERO — NexuAlpha",
    description: "Aerodrome as a Base-native DEX path: pool-level fees, Slipstream routing, Base bridge, token contracts, gas, incentives and veAERO reward boundaries.",
    directAnswer: {
      question: "How should I check Aerodrome route and pool fee plus veAERO conditions?",
      answer: "Aerodrome is a Base-native DEX. Before swapping or adding liquidity, verify the official domain, Base network and bridge route, gas asset, token and pool contracts, standard or Slipstream pool type, displayed pool fee, liquidity, price impact and whether any incentive requires separate veAERO voting or locking. A pool route does not prove execution safety, regional availability or reward eligibility.",
    },
    faq: [
      ["Does Aerodrome have one universal DEX fee?", "No. Aerodrome routes should be checked at pool level because standard pools, Slipstream concentrated-liquidity pools, incentives and veAERO voting can change the practical cost or reward context."],
      ["What should I verify before using Aerodrome on Base?", "Confirm the official Aerodrome domain, Base wallet network, bridge route, gas asset, token contract, pool address, pool type, pool-level fees, liquidity and any veAERO voting or incentive terms."],
      ["Does an Aerodrome swap create veAERO rewards?", "No. A swap route and veAERO voting or reward claims are separate flows. A pool trade alone should not be treated as a reward entitlement."],
      ["Which decision path follows an Aerodrome pool check?", "After checking the pool, compare Base network funding, token contract, liquidity, route preview, gas, incentive terms and whether the user is swapping, adding liquidity or voting."],
      ["What is the compact Aerodrome CTA after this checklist?", "Open the official Aerodrome route only after the Base network, token contract, pool address, pool type, pool fee display and incentive terms match your task. This CTA is a source check, not a route-safety, availability or reward promise."],
      ["How should I compare Aerodrome with Uniswap or Jupiter?", "Use Aerodrome for Base-native pool and veAERO checks, Uniswap for multi-chain pool and hook checks, and Jupiter for Solana routing checks. Do not treat one quoted route, incentive display or pool page as a universal DEX winner."],
    ],
    sourceUrls: [
      "https://aerodrome.finance/",
      "https://aerodrome.finance/docs",
      "https://aerodrome.finance/docs/launcher",
    ],
    relatedLinks: ["/compare/uniswap-vs-jupiter", "/topics/no-kyc", "/topics/meme-coins", "/factbook/aerodrome", "/exchanges/uniswap", "/exchanges/jupiter"],
  },
  jupiter: {
    title: "Jupiter Solana Swap Routes, Ultra Quotes and Fee Checks — NexuAlpha",
    description: "Jupiter Swap and Ultra: Solana test quotes, no-route or failed-swap causes, platform fee boundaries, slippage, priority fees and route legs.",
    directAnswer: {
      question: "How should I check Jupiter route, test quote and platform fee conditions?",
      answer: "For a Jupiter route query, first decide whether the task is a test quote, live swap, token-list check, Ultra route review, API integration or platform-fee review, plus failed-swap diagnosis. Use Jupiter as a Solana routing and transaction-building path, not a custodial account. Check Swap or Ultra route output, token mint status, liquidity, platform fee configuration, slippage, price impact, network cost and every route leg in the wallet before signing; a quote is not custody, route-safety proof or a final-cost promise.",
    },
    faq: [
      ["Why can a Jupiter swap fail even after a quote appears?", "Jupiter Support says swaps can fail because price moves before execution, a pair lacks enough liquidity, trade size is unsuitable, token restrictions apply or route pricing becomes stale."],
      ["Does Jupiter Ultra compensation cover trading losses?", "Jupiter's support language limits Ultra review to defined bad-routing, repeated-failure or extreme-slippage cases and does not treat potential profit-and-loss as compensated."],
      ["What does 'No routes found' mean on Jupiter?", "It usually points to insufficient liquidity, unsuitable trade size or token restrictions. Verify real Solana DEX liquidity and token mint status before treating a route as available."],
      ["What should I check before signing a Jupiter route?", "Check token mint status, route legs, platform fee configuration, slippage, price impact, priority fee, wallet simulation and whether the final transaction matches the quote context."],
      ["What is the compact Jupiter CTA after this checklist?", "Open Jupiter only after the token mint, route legs, liquidity, platform-fee setting, slippage, priority fee and wallet transaction match the quote context. This CTA is a source check, not execution, safety or availability proof."],
      ["How should I compare Jupiter with Uniswap or Aerodrome?", "Use Jupiter for Solana route construction and quote checks, Uniswap for multi-chain pool and hook checks, and Aerodrome for Base pool and veAERO checks. The comparison should start with chain, token mint, liquidity source, route legs and wallet signing evidence."],
    ],
    sourceUrls: [
      "https://dev.jup.ag/docs/swap",
      "https://dev.jup.ag/docs/ultra",
      "https://dev.jup.ag/docs/tokens",
      "https://support.jup.ag/",
    ],
    relatedLinks: ["/compare/uniswap-vs-jupiter", "/news/jupiter-vs-raydium-solana-swap-routing-execution-controls", "/topics/no-kyc", "/topics/meme-coins", "/factbook/jupiter", "/exchanges/uniswap", "/exchanges/aerodrome"],
  },
  gmx: {
    title: "GMX v2 Fees: Pools, Price Impact, Funding and Liquidation — NexuAlpha",
    directAnswer: {
      question: "What should I check on GMX v2 before using a perpetual DEX route?",
      answer: "GMX v2 is a wallet-connected perpetual and swap route powered by GM or GLV liquidity pools rather than a conventional central order book. Before signing, check the official network and wallet route, selected pool, collateral, price impact, position and swap fees, borrow cost, funding, oracle-based execution, gas, referral-term scope and liquidation conditions.",
    },
    faq: [
      ["Is GMX v2 an order-book exchange?", "No. GMX documentation describes trading as powered by GM and GLV liquidity pools, while the order-type documentation describes oracle-based pricing rather than a central limit order book."],
      ["Does a GMX referral discount remove all trading costs?", "No. GMX referral documentation should be checked for the current v2 discount scope. It does not remove network costs, price impact, funding, liquidation risk, wallet-signing risk or regional front-end restrictions."],
      ["What should I verify before opening a GMX position?", "Verify the official GMX route, wallet network, collateral asset, pool context, order type, fee and referral terms, liquidation parameters, oracle-pricing boundary and final wallet transaction before depositing or trading."],
    ],
    sourceUrls: [
      "https://docs.gmx.io/docs/intro/",
      "https://docs.gmx.io/docs/trading/order-types/",
      "https://docs.gmx.io/docs/referrals/",
      "https://docs.gmx.io/docs/trading/liquidations/",
    ],
    relatedLinks: ["/factbook/gmx", "/compare/hyperliquid-vs-dydx", "/topics/derivatives#perp-cost-field-dictionary", "/topics/derivatives", "/topics/no-kyc", "/exchanges/hyperliquid", "/exchanges/dydx"],
  },
};
const COMPARE_SEO_OVERRIDES = {
  "binance-vs-okx": {
    title: "Binance vs OKX: Fees, Products, KYC and Web3 Access Checks — NexuAlpha",
    description: "Compare Binance and OKX by published fee tables, spot and derivatives product scope, identity requirements, Web3 or DEX-style access and account eligibility.",
    completeFaq: true,
    directAnswer: {
      question: "How should I compare Binance and OKX before choosing an exchange?",
      answer: "Compare Binance and OKX by their official fee tables, product-specific availability, identity requirements, regional restrictions, Web3 or DEX-style access paths and announcement sources. Do not treat either public comparison as a current account entitlement, fee guarantee or eligibility decision.",
    },
    faq: [
      ["Is Binance vs OKX mainly a fee comparison?", "Fees matter, but the safer comparison also checks product scope, KYC, regional eligibility, Web3 wallet or DEX-style routing, official announcements and the source date for each claim."],
      ["Can this page decide whether my account can trade a product?", "No. It can narrow what to verify. Final access depends on the current official account flow, user region, verification status, product rules and platform terms."],
    ],
    relatedLinks: ["/exchanges/binance", "/exchanges/okx", "/topics/derivatives", "/factbook/binance", "/factbook/okx"],
    sourceUrls: [
      "https://www.binance.com/en/fee/trading",
      "https://www.binance.com/en/support/faq/detail/360027287111",
      "https://www.okx.com/fees",
      "https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported",
    ],
  },
  "binance-vs-bybit": {
    title: "Binance vs Bybit: Fees, Futures, Earn and KYC Checks — NexuAlpha",
    description: "Compare Binance and Bybit by published spot and futures fees, product scope, Earn or copy-trading boundaries, identity requirements, regional limits and official account terms.",
    completeFaq: true,
    directAnswer: {
      question: "How should I compare Binance and Bybit before choosing a trading platform?",
      answer: "Compare Binance and Bybit by product category first: spot, futures, options, Earn-style products and copy-trading routes can have separate fee tables, identity checks, regional limits and risk terms. Use the comparison to decide what to verify on the official account screen, not as a fee, access or benefit promise.",
    },
    faq: [
      ["Is Binance vs Bybit only a lower-fee decision?", "No. Compare published maker and taker fees beside futures funding, product permissions, KYC, regional availability, withdrawal route, copy-trading terms and current official notices."],
      ["What should I verify before using a registration route?", "Confirm official domain, product name, fee schedule date, account tier, identity status, region and whether the product you need is enabled for your account."],
      ["Which NexuAlpha pages support this comparison?", "Use the venue profiles for account and source checks, the rates terminal for scenario cost context, and derivatives topic pages for funding, liquidation and margin mechanics."],
    ],
    relatedLinks: ["/exchanges/binance", "/exchanges/bybit", "/rates", "/topics/derivatives", "/factbook/binance", "/factbook/bybit"],
    sourceUrls: [
      "https://www.binance.com/en/fee/trading",
      "https://www.binance.com/en/support/faq/detail/360027287111",
      "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure",
      "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ",
    ],
  },
  "okx-vs-bybit": {
    title: "OKX vs Bybit: Fees, Web3, Derivatives and Account Checks — NexuAlpha",
    description: "Compare OKX and Bybit by fee schedules, derivatives access, Web3 or wallet routes, copy-trading context, identity requirements, regional limits and official account terms.",
    completeFaq: true,
    directAnswer: {
      question: "How should I compare OKX and Bybit before opening an account?",
      answer: "Compare OKX and Bybit by separating exchange-account products from wallet or Web3 routes, then check published fees, derivatives access, copy-trading conditions, identity requirements, regional restrictions and official account terms. A public comparison cannot prove your final account cost or product eligibility.",
    },
    faq: [
      ["What makes OKX vs Bybit different from a generic fee page?", "OKX includes exchange and Web3-style routes, while Bybit searches often include derivatives, copy trading and tokenized exposure. Compare the actual product path before comparing fees."],
      ["Should derivatives funding decide the choice?", "No. Funding is only one field. Compare maker and taker fees, margin mode, liquidation terms, collateral, account permissions and withdrawal route together."],
      ["What should happen before a CTA click?", "The visitor should see the official-domain path, source date, account checks and product-scope limits before leaving NexuAlpha for the platform flow."],
    ],
    relatedLinks: ["/exchanges/okx", "/exchanges/bybit", "/rates", "/topics/derivatives", "/factbook/okx", "/factbook/bybit"],
    sourceUrls: [
      "https://www.okx.com/fees",
      "https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported",
      "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure",
      "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ",
    ],
  },
  "binance-vs-mexc": {
    title: "Binance vs MEXC: Fees, Listings, KYC and Region Checks — NexuAlpha",
    description: "Compare Binance and MEXC by published fee tables, futures and spot scope, listing breadth, identity requirements, regional limits, withdrawal routes and official source dates.",
    completeFaq: true,
    directAnswer: {
      question: "How should I compare Binance and MEXC for fees and listing access?",
      answer: "Compare Binance and MEXC by separating broad exchange depth from listing access. Check published spot and futures fees, product permissions, KYC requirements, regional availability, withdrawal networks and official source dates before treating either platform as the right registration route.",
    },
    faq: [
      ["Is MEXC listing breadth enough to choose it over Binance?", "No. Listing breadth must be checked with liquidity, withdrawal network, account permissions, regional conditions and token-specific risk before it becomes a platform decision."],
      ["What fee fields should be compared?", "Compare maker and taker fees by product, futures funding, withdrawal network costs, spread or slippage context and the account tier shown by the official platform."],
      ["Can this page promise account access?", "No. Final product access, KYC, region, asset availability and fee tier depend on the official platform flow and current account status."],
    ],
    relatedLinks: ["/exchanges/binance", "/exchanges/mexc", "/rates", "/topics/meme-coins", "/factbook/binance", "/factbook/mexc"],
    sourceUrls: [
      "https://www.binance.com/en/fee/trading",
      "https://www.binance.com/en/support/faq/detail/360027287111",
      "https://www.mexc.com/fee",
      "https://www.mexc.com/support",
    ],
  },
  "okx-vs-mexc": {
    title: "OKX vs MEXC: Fees, Wallet Routes, Listings and KYC Checks — NexuAlpha",
    description: "Compare OKX and MEXC by published fees, exchange versus wallet routes, listing access, futures scope, identity requirements, regional limits and official account terms.",
    completeFaq: true,
    directAnswer: {
      question: "How should I compare OKX and MEXC before choosing a route?",
      answer: "Compare OKX and MEXC by asking whether the task is exchange trading, Web3-style access, listing discovery or futures execution. Then verify published fee schedules, KYC, regional restrictions, withdrawal route, product availability and official account terms before leaving NexuAlpha.",
    },
    faq: [
      ["Is OKX vs MEXC a CEX versus DEX decision?", "Not exactly. OKX can involve exchange and Web3-style routes, while MEXC is often searched for listing breadth. The route should be separated before fees are compared."],
      ["What should be checked for high-intent listing searches?", "Confirm token contract, listing pair, liquidity, withdrawal network, risk notice, account permission and regional availability on the official platform."],
      ["Does this comparison include a registration promise?", "No. It keeps the source trail and account checks visible; registration, KYC, deposits and trading happen only under current official terms."],
    ],
    relatedLinks: ["/exchanges/okx", "/exchanges/mexc", "/rates", "/topics/meme-coins", "/factbook/okx", "/factbook/mexc"],
    sourceUrls: [
      "https://www.okx.com/fees",
      "https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported",
      "https://www.mexc.com/fee",
      "https://www.mexc.com/support",
    ],
  },
  "bybit-vs-bitget": {
    relatedLinks: ["/exchanges/bybit", "/exchanges/bitget", "/topics/tokenized-stocks-vs-perpetuals", "/topics/derivatives", "/factbook/bybit", "/factbook/bitget", "/news/bybit-vs-bitget-fees-products-risk-controls", "/news/crypto-exchange-fee-disclosure-audit"],
    sourceUrls: [
      "https://www.bybit.com/en/help-center/article/FAQ-xStocks-on-Bybit",
      "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure",
      "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ",
      "https://www.bitget.com/support/articles/7700532076057",
      "https://www.bitget.com/support/articles/12560603892733",
      "https://www.bitget.com/support/articles/12560603892734",
      "https://www.bitget.com/support/articles/12560603817155",
      "https://www.bitget.com/support/articles/12560603795184",
    ],
  },
  "hyperliquid-vs-dydx": {
    title: "Hyperliquid vs dYdX: Perp Fees, Funding, Liquidation and Access Checks — NexuAlpha",
    description: "Compare Hyperliquid and dYdX by fee schedules, funding, collateral, liquidation rules, oracle design, wallet signing, no-KYC access assumptions and official documentation.",
    directAnswer: {
      question: "How should I compare Hyperliquid and dYdX as crypto perpetual platforms?",
      answer: "Compare Hyperliquid and dYdX by execution model, fee schedule, funding cadence, collateral, liquidation logic, oracle design, wallet-signing route, network dependency, regional limits and official documentation. A lower quoted cost or faster interface does not remove liquidation, bridge, outage or eligibility risk.",
    },
    faq: [
      ["Which risk check matters first on Hyperliquid vs dYdX?", "Start with collateral and liquidation. Confirm what asset backs the position, how margin is maintained, how liquidations are triggered, what oracle or price source is used and what happens if the wallet, network, indexer or front end is unavailable."],
      ["Is Hyperliquid vs dYdX a no-KYC comparison?", "Only partly. Wallet connection can reduce account friction, but no-KYC access still depends on front-end availability, regional restrictions, sanctions controls, product rules, wallet screening and current official terms. Treat it as an access-risk comparison, not an eligibility promise."],
      ["Should funding rates decide the platform choice?", "Funding is one input, not the whole decision. Compare funding cadence, maker and taker fees, liquidity, collateral movement, liquidation rules, oracle route, withdrawal path and operational recovery before choosing a perpetual venue."],
      ["Should I read the news explainer or this comparison page?", "Use the news article for the dated source-reading explainer. Use this comparison page for the current decision checklist across fees, funding, collateral, liquidation, wallet route, account access and operational recovery."],
      ["What dYdX onboarding detail belongs beside the fee comparison?", "Check dYdX onboarding, wallet screening, regional access, bridge route and withdrawal path beside fees and funding. Those source checks can change whether a wallet-connected route is usable before the trade cost is even relevant."],
    ],
    relatedLinks: ["/news/hyperliquid-vs-dydx", "/topics/no-kyc", "/topics/derivatives#perp-cost-field-dictionary", "/topics/derivatives", "/exchanges/hyperliquid", "/exchanges/dydx", "/factbook/hyperliquid", "/factbook/dydx"],
    sourceUrls: [
      "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
      "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding",
      "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations",
      "https://docs.dydx.xyz/concepts/onboarding-faqs",
      "https://docs.dydx.xyz/concepts/trading/rewards_fees_and_parameters",
    ],
  },
};
const TOKENIZED_ASSET_SEO_OVERRIDES = {
  "tokenized-assets": {
    en: {
      title: "Tokenized Assets Hub: Treasury, Stock and Perp Exposure Checks — NexuAlpha",
      description: "Compare tokenized assets by legal claim, issuer or broker model, custody, redemption, eligibility, settlement path and derivative risk.",
      extraFaq: [
        ["What should a broad tokenized assets search compare first?", "Start by classifying the product as a fund share, security entitlement, note, tokenized claim, stock perpetual or other synthetic exposure. The next checks are issuer, recordkeeper, custodian, redemption, eligibility and venue access."],
        ["Why does NexuAlpha split tokenized Treasuries from tokenized stocks and stock perps?", "The legal claim, custody record, redemption process, shareholder rights, funding and liquidation mechanics differ. A single tokenized-asset label is too broad for registration or trading decisions."],
      ],
      relatedLinks: ["/topics/tokenized-treasuries", "/news/tokenized-treasuries-structure-access-risks", "/topics/tokenized-stocks-vs-perpetuals", "/factbook/coinbase", "/factbook/kraken", "/methodology"],
    },
  },
  "tokenized-treasuries": {
    en: {
      title: "Tokenized Treasury Checklist: BUIDL, OUSG, BENJI, Redemption and Custody — NexuAlpha",
      description: "Tokenized treasury searches: issuer, legal wrapper, recordkeeper, custodian, redemption, transfer, permitted-chain, collateral treatment and eligibility checks.",
      extraFaq: [
        ["What should a tokenized treasury searcher check first?", "Start with the legal wrapper and recordkeeper: identify whether the token represents a fund share, note, platform claim or bookkeeping token, then verify issuer, transfer agent, custodian, eligibility and redemption route."],
        ["When should I use the tokenized Treasuries article instead of this checklist?", "Use the article for the dated source trail behind BUIDL, BENJI and OUSG-style exposure; use this checklist when comparing ongoing issuer, custody, redemption, chain and collateral conditions."],
      ],
      relatedLinks: ["/topics/tokenized-assets", "/news/tokenized-treasuries-structure-access-risks", "/topics/tokenized-stocks-vs-perpetuals", "/research/wave48-tokenized-treasury-rights-ops.json", "/factbook/coinbase", "/factbook/kraken", "/methodology"],
    },
  },
  "tokenized-stocks-vs-perpetuals": {
    en: {
      title: "Tokenized Stocks vs Stock Perps: Rights and Liquidation — NexuAlpha",
      description: "Compare tokenized stock claims with stock perpetuals by ownership rights, custody, dividends, funding, margin, liquidation, eligibility and venue access.",
      directAnswer: {
        question: "Are tokenized stocks and stock perpetuals the same product?",
        answer: "No. A tokenized stock may represent an issuer or broker entitlement linked to equity; a stock perpetual is a derivative with funding, margin and liquidation risk. Verify the legal claim before comparing price exposure, and treat xStocks, stock futures and copy-trading labels as separate products.",
      },
      faq: [
        ["What should I check first for tokenized stock searches?", "Start with whether the product claims shareholder rights, broker custody, issuer-backed entitlement, dividend handling, transfer controls and regional eligibility. Then compare those facts with the official product screen."],
        ["What should I check first for stock perpetual searches?", "Start with the index or reference market, funding cadence, leverage, margin mode, liquidation rules, trading hours, eligible jurisdiction and venue-specific risk disclosures."],
      ],
      extraFaq: [
        ["What is the fastest way to separate tokenized stocks from stock perps?", "Ask whether the product claims a security entitlement or only tracks price through a derivative contract. Then compare custody or broker records for tokenized stocks against funding, margin and liquidation terms for stock perpetuals."],
        ["Why does the Bybit vs Bitget comparison link here?", "Stock-related searches around Bybit and Bitget can mix xStocks, stock futures, copy trading and ordinary derivatives. This topic keeps ownership, synthetic exposure and account-route checks separate before any CTA path."],
      ],
      relatedLinks: ["/topics/tokenized-assets", "/compare/bybit-vs-bitget", "/news/tokenized-stocks-vs-stock-perpetuals", "/news/tokenized-treasuries-structure-access-risks", "/factbook/coinbase", "/factbook/bybit", "/factbook/bitget", "/methodology"],
    },
  },
};
const LOCALIZED_VENUE_SEO_OVERRIDES = {
  ja: {
    binance: {
      title: "Binance 日本向け手数料・本人確認・商品範囲チェック — NexuAlpha",
      description: "Binanceで登録や比較に進む前に、公式手数料表、BNB/VIP条件、本人確認、地域条件、商品範囲、公式告知を確認します。",
      directAnswer: {
        question: "Binanceを日本語で確認するとき、登録前に何を見るべきですか？",
        answer: "まず公式手数料表、BNBまたはVIP条件、本人確認、地域ごとの商品範囲、公式告知を分けて確認します。NexuAlphaの日本語ページは登録導線の前に確認項目を整理するもので、すべてのアカウントに同じ手数料、商品、地域アクセスが適用されるとは約束しません。",
      },
      faq: [
        ["Binanceの手数料は全ユーザーで同じですか？", "いいえ。公開されるmaker/taker手数料、VIPティア、BNB利用、商品、注文タイプ、地域、アカウント条件によって最終コストは変わる可能性があります。"],
        ["日本語ページを見るだけで登録資格は確認できますか？", "いいえ。本人確認、地域制限、商品アクセス、キャンペーン条件は、公式ドメイン上の現在のアカウント画面と告知で確認する必要があります。"],
        ["比較後に何を開くべきですか？", "Binance vs OKXの比較で手数料と商品範囲を見た後、公式ドメイン、本人確認、対象商品、手数料表、登録画面の条件を順番に確認してください。"],
      ],
    },
  },
  ko: {
    hyperliquid: {
      title: "Hyperliquid 수수료, 펀딩 및 계정 구조 확인 — NexuAlpha",
      description: "Hyperliquid의 롤링 수수료, 시간별 펀딩, 청산 위험, USDC 담보, 하위 계정, API 지갑 위임, 볼트 참여와 funded account 표현의 경계를 확인하세요.",
      directAnswer: {
        question: "Hyperliquid를 사용하기 전에 어떤 수수료와 계정 조건을 먼저 확인해야 하나요?",
        answer: "Hyperliquid는 공식 수수료표, 시간별 펀딩, 청산 구조, USDC 담보 경로, 계정 모드, 하위 계정, API 지갑 위임과 볼트 문서를 함께 확인해야 합니다. funded account 검색어는 지갑 담보, 계정 권한, 볼트 참여와 제3자 배정 주장으로 나누어 읽어야 합니다.",
      },
      faq: [
        ["Hyperliquid 수수료는 어떻게 확인하나요?", "공식 수수료 페이지에서 14일 거래량 기준, UTC 일별 산정, perp와 spot 수수료표를 먼저 확인한 뒤 펀딩, 마진 모드와 청산 조건을 같이 확인하세요."],
        ["Hyperliquid funded account 검색어는 무엇을 구분해야 하나요?", "지갑 담보, USDC 이동, 계정 모드, 하위 계정, API 지갑 위임과 볼트 참여를 분리해야 합니다. 공식 문서만으로 prop-style 배정이나 가입 혜택을 추정하면 안 됩니다."],
      ],
    },
    uniswap: {
      title: "Uniswap 테스트넷, v4 훅과 스왑 경로 확인 — NexuAlpha",
      description: "Uniswap 테스트넷, v4 배포, 공식 앱 URL, 토큰 컨트랙트, 풀 수수료, 가스, 지갑 시뮬레이션과 서명 전 검토를 확인하세요.",
      directAnswer: {
        question: "Uniswap 테스트넷이나 v4 훅 경로를 실거래 전에 어떻게 확인해야 하나요?",
        answer: "Uniswap 테스트넷과 로컬 훅 자료는 개발자 연구용입니다. 실제 지갑으로 스왑하기 전에는 공식 앱 URL, 네트워크, 토큰 컨트랙트, v4 배포 주소, 풀 버전, 수수료 티어 또는 dynamic-fee 훅, 가스 토큰, 지갑 시뮬레이션과 최종 서명 내용을 확인해야 합니다.",
      },
      faq: [
        ["Uniswap 테스트넷 검증이 실거래 안전을 뜻하나요?", "아니요. 테스트넷과 로컬 훅은 개발 환경입니다. 실거래는 공식 앱 URL, 네트워크, 배포 주소, 토큰 컨트랙트, 가스와 최종 지갑 트랜잭션을 다시 확인해야 합니다."],
        ["Uniswap 수수료는 무엇을 비교해야 하나요?", "v2, v3, v4의 수수료 모델과 풀 동작이 다릅니다. v4 dynamic-fee 또는 훅 동작은 현재 Uniswap 문서와 배포 데이터로 확인해야 합니다."],
      ],
    },
    aerodrome: {
      title: "Aerodrome Base DEX 풀 수수료와 veAERO 조건 확인 — NexuAlpha",
      description: "Aerodrome(Base DEX) 풀별 수수료, Slipstream 경로, 토큰 컨트랙트, 가스, veAERO 보상 경계를 확인하세요.",
      directAnswer: {
        question: "Aerodrome 경로와 풀 수수료 조건은 어떻게 확인해야 하나요?",
        answer: "Aerodrome은 Base 네트워크의 DEX 경로로 확인해야 합니다. Base 브리지, 지갑 네트워크, 토큰 컨트랙트, 풀 주소, 표준 풀 또는 Slipstream 풀 유형, 풀별 거래량과 수수료 표시, veAERO 인센티브나 보상 조건을 자금 이동이나 서명 전에 따로 확인하세요.",
      },
      faq: [
        ["Aerodrome에는 하나의 고정 DEX 수수료가 있나요?", "아니요. 표준 풀, Slipstream 집중 유동성 풀, 인센티브와 veAERO 투표 조건이 실제 비용이나 보상 맥락을 바꿀 수 있으므로 풀 단위로 확인해야 합니다."],
        ["Aerodrome 스왑만으로 veAERO 보상이 생기나요?", "아니요. 스왑 경로와 veAERO 투표 또는 보상 청구는 별도 흐름입니다. 풀 거래만으로 보상 자격을 추정하면 안 됩니다."],
      ],
    },
    jupiter: {
      title: "Jupiter Solana 스왑 경로, 테스트 견적과 수수료 확인 — NexuAlpha",
      description: "Jupiter Swap과 Ultra 경로, 토큰 목록, 경로 실패 원인, 플랫폼 수수료 경계, 슬리피지와 route leg를 확인하세요.",
      directAnswer: {
        question: "Jupiter 경로, 테스트 견적과 플랫폼 수수료는 어떻게 확인해야 하나요?",
        answer: "Jupiter는 Solana 라우팅과 트랜잭션 생성 경로로 보아야 합니다. Swap 또는 Ultra 출력, 토큰 mint 상태, 유동성, 플랫폼 수수료 설정, 슬리피지, 가격 영향, 네트워크 비용과 지갑에 표시되는 모든 route leg를 서명 전에 확인하세요.",
      },
      faq: [
        ["Jupiter 견적이 보인 뒤에도 스왑이 실패할 수 있나요?", "네. 가격 변동, 유동성 부족, 거래 크기, 토큰 제한 또는 오래된 경로 가격 때문에 실패할 수 있습니다."],
        ["Jupiter 견적은 최종 비용 보장인가요?", "아니요. 견적은 보관, 실행 또는 최종 비용 보장이 아닙니다. 지갑에서 네트워크 비용, 슬리피지와 route leg를 다시 확인해야 합니다."],
      ],
    },
  },
  tr: {
    hyperliquid: {
      title: "Hyperliquid ücretleri, funding ve hesap yapısı kontrolü — NexuAlpha",
      description: "Hyperliquid ücretlerini, saatlik funding'i, likidasyon riskini, USDC teminatını, alt hesapları, vault katılımını ve funded account sınırlarını inceleyin.",
      directAnswer: {
        question: "Hyperliquid kullanmadan önce hangi ücret ve hesap koşulları kontrol edilmeli?",
        answer: "Hyperliquid için resmi rolling ücret çizelgesi, saatlik funding kuralları, likidasyon mantığı, USDC teminat yolu, hesap modu, alt hesaplar, API cüzdan yetkisi ve vault dokümantasyonu birlikte okunmalıdır. Funded account araması cüzdan teminatı, hesap izinleri, vault katılımı ve üçüncü taraf tahsis iddialarını ayırmalıdır.",
      },
      faq: [
        ["Hyperliquid ücretleri nasıl okunmalı?", "Önce resmi ücret sayfasındaki 14 günlük hacim, UTC gün değerlendirmesi ve perp/spot çizelgelerini kontrol edin; ardından funding, marjin modu ve likidasyon koşullarını birlikte değerlendirin."],
        ["Hyperliquid funded account ifadesi neyi ayırmalı?", "Cüzdan teminatı, USDC hareketi, hesap modu, alt hesaplar, API cüzdan yetkisi ve vault katılımı ayrılmalıdır. Resmi dokümanlar bu ifadeyi prop-style tahsis veya kayıt hakkına dönüştürmez."],
      ],
    },
    uniswap: {
      title: "Uniswap testnet, v4 hook ve swap rota kontrolleri — NexuAlpha",
      description: "Uniswap testnet, v4 dağıtımları, resmi uygulama URL'si, token kontratları, pool ücretleri, gas, cüzdan simülasyonu ve imza öncesi kontrolleri inceleyin.",
      directAnswer: {
        question: "Uniswap testnet veya v4 hook rotası canlı swap öncesi nasıl araştırılmalı?",
        answer: "Uniswap testnet ve yerel hook materyali geliştirici araştırmasıdır; canlı cüzdan rotasının güvenli olduğunu kanıtlamaz. Resmi uygulama URL'si, ağ, token kontratı, v4 dağıtım haritası, pool sürümü, ücret seviyesi veya dynamic-fee hook, gas tokenı, cüzdan simülasyonu ve son imza ekranı ayrı kontrol edilmelidir.",
      },
      faq: [
        ["Uniswap testnet araştırması canlı swap güvenliği sağlar mı?", "Hayır. Testnet ve yerel hook rehberleri geliştirici yollarıdır. Canlı rota için resmi app URL'si, ağ, dağıtım adresi, token kontratı, gas ve son cüzdan işlemi yeniden kontrol edilmelidir."],
        ["Uniswap ücretlerinde hangi sürümler karşılaştırılmalı?", "v2, v3 ve v4 ücret modeli ve pool davranışı ayrıdır. v4 dynamic-fee veya hook davranışı güncel Uniswap dokümantasyonu ve dağıtım verisiyle doğrulanmalıdır."],
      ],
    },
    aerodrome: {
      title: "Aerodrome Base DEX pool ücretleri ve veAERO kontrolleri — NexuAlpha",
      description: "Aerodrome'u Base-native DEX olarak inceleyin: pool bazlı ücretler, Slipstream rotası, hacim, token kontratları, Base gas, teşvikler ve veAERO ödül sınırları.",
      directAnswer: {
        question: "Aerodrome rota ve pool ücret koşulları nasıl kontrol edilmeli?",
        answer: "Aerodrome bir Base-native DEX rotası olarak kontrol edilmelidir. Base bridge yolu, cüzdan ağı, token kontratı, pool adresi, standart veya Slipstream pool tipi, pool bazlı hacim ve ücret görünümü ile veAERO teşvik veya ödül koşulları fon taşımadan ya da imza atmadan önce doğrulanmalıdır.",
      },
      faq: [
        ["Aerodrome'da tek bir DEX ücreti var mı?", "Hayır. Standart pool, Slipstream yoğun likidite pool'u, teşvikler ve veAERO oylaması pratik maliyet veya ödül bağlamını değiştirebilir; kontrol pool düzeyinde yapılmalıdır."],
        ["Aerodrome swap işlemi veAERO ödülü doğurur mu?", "Hayır. Swap rotası ile veAERO oylama veya ödül hakları ayrı akışlardır. Bir pool işlemi tek başına ödül hakkı sayılmamalıdır."],
      ],
    },
    jupiter: {
      title: "Jupiter Solana swap rotaları, test quote ve ücret kontrolleri — NexuAlpha",
      description: "Jupiter Swap ve Ultra rotalarını, token listesini, rota hata nedenlerini, platform ücreti sınırlarını, slippage'i ve rota bacaklarını inceleyin.",
      directAnswer: {
        question: "Jupiter rota, test quote ve platform ücretleri nasıl kontrol edilmeli?",
        answer: "Jupiter bir Solana rota ve işlem oluşturma yoludur. Swap veya Ultra çıktısı, token mint durumu, likidite, platform ücreti yapılandırması, slippage, fiyat etkisi, ağ maliyeti ve cüzdandaki her rota bacağı imza öncesinde kontrol edilmelidir; quote saklama veya nihai maliyet garantisi değildir.",
      },
      faq: [
        ["Jupiter quote göründükten sonra swap neden başarısız olabilir?", "Fiyatın yürütmeden önce değişmesi, likiditenin yetersiz olması, işlem boyutunun uygun olmaması, token kısıtları veya rota fiyatının bayatlaması başarısızlığa yol açabilir."],
        ["Jupiter quote nihai maliyet garantisi midir?", "Hayır. Quote saklama, yürütme veya nihai maliyet garantisi değildir. Ağ maliyeti, slippage ve rota bacakları cüzdanda yeniden kontrol edilmelidir."],
      ],
    },
  },
  ar: {
    "meme-coins": {
      title: "مقارنة منصات عملات الميم: العقد والسيولة ومسار الخروج — NexuAlpha",
      description: "قارن MEXC وGate.io وRaydium حسب عقد الرمز والسيولة والتكاليف المنشورة وتفويض المحفظة وشروط الخروج، مع التحقق من الحساب والمنطقة في المصدر الرسمي.",
      directAnswer: {
        question: "ما أول شيء يجب فحصه عند اختيار منصة لعملة ميم؟",
        answer: "ابدأ بعقد الرمز وزوج التداول والسيولة أو دفتر الأوامر وشبكات الإيداع والسحب. بعد ذلك تحقق من KYC والمنطقة وشروط الحساب والرسوم المنشورة في الصفحة الرسمية الحالية. لا تجعل سرعة الإدراج أو عنواناً تسويقياً بديلاً عن فحص العقد والسيولة ومسار الخروج.",
      },
      faq: [
        ["كيف أقارن MEXC وGate.io وRaydium لعملات الميم؟", "افصل مسار CEX عن مسار DEX. في CEX تحقق من الإعلان والزوج وعمق دفتر الأوامر والحساب والمنطقة. في DEX تحقق من عنوان الرمز والمجمع والتفويض وتأثير السعر ومسار الخروج."],
        ["هل يوجد انزلاق آمن ثابت لتداول عملات الميم على DEX؟", "لا. لا توجد نسبة واحدة آمنة لكل مجمع. تحقق من عنوان الرمز والمجمع ونتيجة التسعير وتأثير السعر والمسار وحالة الشبكة قبل توقيع الصفقة."],
        ["هل تعرض هذه الصفحة رابط تسجيل أو وعد خصم لعملات الميم؟", "لا. هذه الصفحة تبقي المقارنة بحثية. أي مسار تسجيل أو منفعة مستخدم يجب أن يأتي من سجل NexuAlpha التجاري المحمي وأن يتم التحقق منه في الشروط الرسمية الحالية."],
      ],
    },
    "derivatives": {
      title: "مقارنة منصات العقود الدائمة: الرسوم والتمويل والتصفية — NexuAlpha",
      description: "قارن منصات العقود الدائمة حسب نموذج الحساب والرسوم المنشورة والتمويل والهامش والتصفية وoracle والوصول الإقليمي قبل التسجيل أو ربط المحفظة.",
      directAnswer: {
        question: "ما منصة العقود الدائمة للعملات الرقمية وكيف أقارنها؟",
        answer: "منصة العقود الدائمة تتيح تداول عقود بلا تاريخ انتهاء ثابت. ابدأ بفصل النوع: حساب CEX للعقود مثل Binance أو Bybit يحتاج فحص الرسوم والتمويل والهامش وKYC والمنطقة وصلاحيات المنتج، بينما بروتوكول متصل بالمحفظة مثل Hyperliquid يحتاج فحص الضمان وoracle والجسر والتصفية وتوفر الواجهة.",
      },
      faq: [
        ["أي صفحة أستخدم بعد بحث عام عن منصة عقود دائمة؟", "استخدم موضوع المشتقات كقائمة تحقق دائمة، ثم انتقل إلى Binance vs OKX لحسابات CEX، أو Bybit vs Bitget للمشتقات وcopy trading، أو Hyperliquid vs dYdX لآليات العقود المتصلة بالمحفظة."],
        ["هل يجب أن تحسم معدلات التمويل اختيار المنصة؟", "لا. التمويل عنصر واحد فقط. قارن رسوم maker وtaker، وتواتر التمويل، والسيولة، وحركة الضمان، ونمط الهامش، وقواعد التصفية، ومسار oracle، والسحب، والمنطقة، ومتطلبات الهوية."],
        ["ما الآليات التي يجب أن تغطيها كل قائمة تحقق للعقود الدائمة؟", "افحص تواتر التمويل، والهامش isolated أو cross، والضمان المقبول، ومسار oracle أو mark price، وقواعد التصفية، وإفصاحات التأمين أو ADL، ومسار الإيداع والسحب، والوصول للمنتج حسب المنطقة."],
        ["هل تثبت المقارنة العامة أن حسابي يستطيع تداول العقود؟", "لا. المقارنة العامة تضيق مسار القرار. الوصول النهائي للمنتج وKYC والبلد والمزايا والرافعة ومستوى الرسوم يجب التحقق منها في الحساب الرسمي أو مسار المحفظة."],
      ],
    },
  },
};
const LOCALIZED_COMPARE_SEO_OVERRIDES = {
  ja: {
    "bybit-vs-bitget": {
      title: "Bybit vs Bitget：株式型商品、コピー取引、手数料と口座確認 — NexuAlpha",
      description: "Bybit と Bitget を商品ラベル、xStocks、株式先物、コピー取引、手数料、KYC、地域条件、登録画面で比較します。",
      directAnswer: {
        question: "登録前に Bybit と Bitget をどう比較すべきですか？",
        answer: "まず通常の暗号資産デリバティブ、xStocks 型エクスポージャー、株式先物、コピー取引、初回口座開設ルートを分け、商品別手数料表、KYC、地域条件、公式登録画面を確認してください。",
      },
      faq: [
        ["Bybit vs Bitget は実際の株式を買えるという意味ですか？", "いいえ。証券、トークン化エクスポージャー、株式先物、コピー取引、地域別アカウント権限を分けて確認してください。"],
        ["最初に比較すべき手数料は何ですか？", "商品別の公式手数料表です。xStocks、先物、コピー取引は普通の暗号資産現物手数料だけでは判断できません。"],
      ],
    },
  },
  ko: {
    "bybit-vs-bitget": {
      title: "Bybit vs Bitget: 수수료, 카피트레이딩과 주식형 노출 확인 — NexuAlpha",
      description: "Bybit과 Bitget의 수수료, 파생상품, 카피트레이딩, tokenized stock 또는 stock-perp 노출, KYC, 지역 접근성과 가입 조건을 비교하세요.",
      directAnswer: {
        question: "가입 전에 Bybit과 Bitget을 어떻게 비교해야 하나요?",
        answer: "Bybit과 Bitget은 공개 수수료표, 파생상품 도구, 카피트레이딩 흐름, 주식 토큰·tokenized stock·stock perp 노출 경계, KYC, 지역 이용 가능성, 공식 가입 조건으로 비교해야 합니다. 주식 관련 검색은 공식 계정 경로를 열기 전 현재 계정 조건으로 다시 확인하세요.",
      },
      faq: [
        ["Bybit vs Bitget 비교가 실제 주식 거래 가능성을 뜻하나요?", "아니요. 실제 증권, tokenized stock, stock perpetual, 카피트레이딩 상품과 지역 계정 가능성을 분리해서 확인해야 합니다."],
        ["카피트레이딩 등록 경로 전 무엇을 확인해야 하나요?", "KYC 수준, 지역, 상품 권한, 수수료표, lead trader 규칙과 공식 가입 조건을 확인하세요. 공개 비교는 동일한 접근성을 보장하지 않습니다."],
      ],
    },
  },
  tr: {
    "bybit-vs-bitget": {
      title: "Bybit vs Bitget: ücretler, copy trading ve hisse benzeri ürün kontrolleri — NexuAlpha",
      description: "Bybit ve Bitget ücretlerini, türevleri, copy trading'i, tokenized stock veya stock-perp maruziyetini, KYC'yi, bölgesel erişimi ve kayıt koşullarını karşılaştırın.",
      directAnswer: {
        question: "Kayıt olmadan önce Bybit ve Bitget nasıl karşılaştırılmalı?",
        answer: "Bybit ve Bitget; yayımlanmış ücret çizelgeleri, türev araçları, copy trading akışı, hisse tokenı, tokenized stock veya stock-perp ürün sınırları, KYC, bölgesel uygunluk ve resmi kayıt koşullarıyla karşılaştırılmalıdır. Hisseyle ilgili bir arama, resmî hesap rotası açılmadan önce güncel hesap koşullarıyla kontrol edilmelidir.",
      },
      faq: [
        ["Bybit vs Bitget gerçek hisse erişimi anlamına gelir mi?", "Hayır. Gerçek menkul kıymet, tokenized stock, stock perpetual, copy trading ürünü ve bölgesel hesap erişimi ayrı ayrı kontrol edilmelidir."],
        ["Copy trading registration route'sı öncesi hangi kontroller gerekir?", "KYC seviyesi, bölge, ürün izinleri, ücret çizelgesi, lead trader kuralları ve resmi kayıt koşulları kontrol edilmelidir. Kamuya açık karşılaştırma aynı erişimi garanti etmez."],
      ],
    },
  },
  ar: {
    "bybit-vs-bitget": {
      title: "Bybit مقابل Bitget: المنتجات الشبيهة بالأسهم ونسخ التداول والرسوم — NexuAlpha",
      description: "قارن Bybit وBitget حسب مسار المنتج، xStocks، عقود الأسهم، نسخ التداول، الرسوم، KYC، المنطقة وشاشة التسجيل الرسمية.",
      directAnswer: {
        question: "كيف أقارن Bybit وBitget قبل التسجيل؟",
        answer: "افصل بين عقود العملات المشفرة والتعرض الشبيه بالأسهم وعقود الأسهم ونسخ التداول، ثم راجع جدول الرسوم حسب المنتج وKYC والمنطقة وشاشة التسجيل الرسمية.",
      },
      faq: [
        ["هل تعني مقارنة Bybit وBitget أن الأسهم الحقيقية متاحة؟", "لا. افصل بين الأوراق المالية، التعرض المرمز، عقود الأسهم، نسخ التداول وصلاحيات الحساب حسب المنطقة."],
        ["ما الرسوم التي يجب مقارنتها أولاً؟", "ابدأ بجدول الرسوم الرسمي حسب المنتج. xStocks والعقود ونسخ التداول لا تكفي لها رسوم spot العامة وحدها."],
      ],
    },
  },
};
const LOCALIZED_TOPIC_SEO_OVERRIDES = {
  en: {
    "derivatives": {
      title: "Crypto Perpetual Platform Comparison: Fees, Funding and Liquidation Checks — NexuAlpha",
      description: "Perpetual platform checks: published fees, funding, margin mode, liquidation rules, oracle route, collateral movement, regional access and product permissions.",
      directAnswer: {
        question: "What is a crypto perpetual platform, and how should I compare one?",
        answer: "A crypto perpetual platform lets users trade contracts with no fixed expiry. Compare platform type first: account-based CEX futures such as Binance or Bybit require fee, funding, margin mode, KYC, region and product-permission checks, while wallet-connected perpetual protocols such as Hyperliquid require collateral, oracle, bridge, liquidation and front-end checks.",
      },
      faq: [
        ["Which page should I use after a broad crypto perpetual platform search?", "Use this derivatives topic as the evergreen checklist, then continue to Binance vs OKX for account-based CEX futures, Bybit vs Bitget for derivatives and copy-trading conditions, or Hyperliquid vs dYdX for wallet-connected perpetual mechanics."],
        ["Should funding rates decide the perpetual platform choice?", "No. Funding is one input. Compare maker and taker fees, funding cadence, liquidity, collateral movement, margin mode, liquidation rules, oracle route, withdrawal path, region and identity requirements before choosing a route."],
        ["Which mechanics should every perpetual checklist cover?", "Check funding cadence, isolated or cross margin, accepted collateral, oracle or mark-price route, liquidation rules, insurance or ADL disclosures, deposit and withdrawal path, and product access by region before treating a platform as usable."],
        ["Does a public comparison prove my account can trade perpetuals?", "No. Public comparison narrows the decision path. Final product access, KYC, country availability, benefits, leverage and fee tier must be verified in the official platform account or wallet flow."],
      ],
    },
    "no-kyc": {
      title: "No-KYC Self-Custody vs KYC Exchange (2026): Hyperliquid, dYdX and MEXC — NexuAlpha",
      description: "Compare wallet access, CEX account flows, withdrawals, regional limits, sanctions controls, front-end availability and liquidation risk before treating any crypto platform as no-KYC.",
      directAnswer: {
        question: "What should I check before using a no-KYC crypto platform?",
        answer: "Start by separating wallet-connected protocols from centralized accounts. Check whether access depends on a front end, smart contract, bridge, liquidity route, withdrawal limit, regional restriction, sanctions control, wallet screening, product type or later identity review. No-KYC is a current access condition, not a permanent account promise.",
      },
      faq: [
        ["Does wallet connection mean no KYC forever?", "No. Wallet connection describes how a user signs transactions. A protocol, front end, bridge, region rule, sanctions screen or risk control can still limit access, and centralized platforms may request identity checks later."],
        ["Which page should I use after the no-KYC overview?", "Use the Hyperliquid vs dYdX comparison for perpetual mechanics, then open each venue profile to verify official domains, collateral, liquidation, bridge, withdrawal and regional conditions."],
        ["Can a centralized exchange be treated as no-KYC?", "Only with caution. Email or low-friction onboarding can change by region, limit, product, withdrawal route, account age and risk review. Verify the current official account flow before depositing or trading."],
      ],
    },
  },
  ko: {
    "no-kyc": {
      title: "KYC 없는 셀프 커스터디 vs KYC 필수 거래소(2026): Hyperliquid, dYdX, MEXC 비교 — NexuAlpha",
      description: "지갑 연결, 계정 가입, 본인확인 가능성, 출금, 지역 제한과 리스크 경계를 Hyperliquid, dYdX, MEXC 기준으로 비교하세요.",
      directAnswer: {
        question: "No-KYC 암호화폐 플랫폼을 비교할 때 무엇을 먼저 확인해야 하나요?",
        answer: "No-KYC 비교는 로그인 방식보다 넓게 봐야 합니다. 지갑 연결, 계정 가입, 추가 본인확인 가능성, 출금 제한, 지역 차단, 프런트엔드 접근, 스마트 컨트랙트, 브리지, 유동성과 복구 경로를 함께 확인하세요.",
      },
      faq: [
        ["지갑 연결은 KYC와 지역 제한이 없다는 뜻인가요?", "아니요. 지갑 연결은 로그인 경로일 뿐입니다. 프런트엔드, 프로토콜, 제재 규칙, 유동성, 브리지와 계정 상태가 접근과 출금을 제한할 수 있습니다."],
        ["이메일 가입 CEX는 출금 때 KYC가 없나요?", "항상 그렇지 않습니다. 지역, 한도, 계정 상태와 리스크 관리에 따라 추가 신원 또는 보안 확인이 요구될 수 있습니다."],
      ],
    },
  },
  tr: {
    "no-kyc": {
      title: "KYC’siz öz saklama vs KYC zorunlu borsa (2026): Hyperliquid, dYdX ve MEXC — NexuAlpha",
      description: "Cüzdan bağlantısı, hesap kaydı, kimlik kontrolü olasılığı, çekim, bölgesel sınırlamalar ve risk sınırlarını Hyperliquid, dYdX ve MEXC üzerinden karşılaştırın.",
      directAnswer: {
        question: "No-KYC kripto platformları karşılaştırılırken önce ne kontrol edilmeli?",
        answer: "No-KYC karşılaştırması yalnızca giriş yönteminden ibaret değildir. Cüzdan bağlantısı, hesap kaydı, ek kimlik kontrolü olasılığı, çekim limitleri, bölgesel bloklar, frontend erişimi, akıllı kontratlar, bridge, likidite ve kurtarma yolu birlikte kontrol edilmelidir.",
      },
      faq: [
        ["Cüzdan bağlantısı KYC veya bölge sınırı olmadığı anlamına gelir mi?", "Hayır. Cüzdan bağlantısı yalnızca giriş ve imza yolunu anlatır. Frontend, protokol, yaptırım kuralları, likidite, bridge ve hesap durumu erişimi veya çekimi etkileyebilir."],
        ["E-posta ile kayıt olunan CEX çekimde KYC istemez mi?", "Her zaman değil. Bölge, limit, hesap durumu ve risk kontrollerine göre ek kimlik veya güvenlik doğrulaması istenebilir."],
      ],
    },
  },
  ar: {
    "meme-coins": {
      title: "مقارنة منصات عملات الميم: العقد والسيولة ومسار الخروج — NexuAlpha",
      description: "قارن MEXC وGate.io وRaydium حسب عقد الرمز والسيولة والتكاليف المنشورة وتفويض المحفظة وشروط الخروج، مع التحقق من الحساب والمنطقة في المصدر الرسمي.",
      directAnswer: {
        question: "ما أول شيء يجب فحصه عند اختيار منصة لعملة ميم؟",
        answer: "ابدأ بعقد الرمز وزوج التداول والسيولة أو دفتر الأوامر وشبكات الإيداع والسحب. بعد ذلك تحقق من KYC والمنطقة وشروط الحساب والرسوم المنشورة في الصفحة الرسمية الحالية. لا تجعل سرعة الإدراج أو عنواناً تسويقياً بديلاً عن فحص العقد والسيولة ومسار الخروج.",
      },
      faq: [
        ["كيف أقارن MEXC وGate.io وRaydium لعملات الميم؟", "افصل مسار CEX عن مسار DEX. في CEX تحقق من الإعلان والزوج وعمق دفتر الأوامر والحساب والمنطقة. في DEX تحقق من عنوان الرمز والمجمع والتفويض وتأثير السعر ومسار الخروج."],
        ["هل يوجد انزلاق آمن ثابت لتداول عملات الميم على DEX؟", "لا. لا توجد نسبة واحدة آمنة لكل مجمع. تحقق من عنوان الرمز والمجمع ونتيجة التسعير وتأثير السعر والمسار وحالة الشبكة قبل توقيع الصفقة."],
        ["هل تعرض هذه الصفحة رابط تسجيل أو وعد خصم لعملات الميم؟", "لا. هذه الصفحة تبقي المقارنة بحثية. أي مسار تسجيل أو منفعة مستخدم يجب أن يأتي من سجل NexuAlpha التجاري المحمي وأن يتم التحقق منه في الشروط الرسمية الحالية."],
      ],
    },
    "derivatives": {
      title: "مقارنة منصات العقود الدائمة: الرسوم والتمويل والتصفية — NexuAlpha",
      description: "قارن منصات العقود الدائمة حسب نموذج الحساب والرسوم المنشورة والتمويل والهامش والتصفية وoracle والوصول الإقليمي قبل التسجيل أو ربط المحفظة.",
      directAnswer: {
        question: "ما منصة العقود الدائمة للعملات الرقمية وكيف أقارنها؟",
        answer: "منصة العقود الدائمة تتيح تداول عقود بلا تاريخ انتهاء ثابت. ابدأ بفصل النوع: حساب CEX للعقود مثل Binance أو Bybit يحتاج فحص الرسوم والتمويل والهامش وKYC والمنطقة وصلاحيات المنتج، بينما بروتوكول متصل بالمحفظة مثل Hyperliquid يحتاج فحص الضمان وoracle والجسر والتصفية وتوفر الواجهة.",
      },
      faq: [
        ["أي صفحة أستخدم بعد بحث عام عن منصة عقود دائمة؟", "استخدم موضوع المشتقات كقائمة تحقق دائمة، ثم انتقل إلى Binance vs OKX لحسابات CEX، أو Bybit vs Bitget للمشتقات وcopy trading، أو Hyperliquid vs dYdX لآليات العقود المتصلة بالمحفظة."],
        ["هل يجب أن تحسم معدلات التمويل اختيار المنصة؟", "لا. التمويل عنصر واحد فقط. قارن رسوم maker وtaker، وتواتر التمويل، والسيولة، وحركة الضمان، ونمط الهامش، وقواعد التصفية، ومسار oracle، والسحب، والمنطقة، ومتطلبات الهوية."],
        ["ما الآليات التي يجب أن تغطيها كل قائمة تحقق للعقود الدائمة؟", "افحص تواتر التمويل، والهامش isolated أو cross، والضمان المقبول، ومسار oracle أو mark price، وقواعد التصفية، وإفصاحات التأمين أو ADL، ومسار الإيداع والسحب، والوصول للمنتج حسب المنطقة."],
        ["هل تثبت المقارنة العامة أن حسابي يستطيع تداول العقود؟", "لا. المقارنة العامة تضيق مسار القرار. الوصول النهائي للمنتج وKYC والبلد والمزايا والرافعة ومستوى الرسوم يجب التحقق منها في الحساب الرسمي أو مسار المحفظة."],
      ],
    },
  },
};
function mergeLocalizedOverride(base, localizedOverride) {
  return localizedOverride && base ? { ...localizedOverride, sourceUrls: base.sourceUrls, relatedLinks: base.relatedLinks } : null;
}
export function venueSeoOverrideFor(slug, locale, market) {
  const base = VENUE_SEO_OVERRIDES[slug];
  const existing = locale === "en" ? base || null : mergeLocalizedOverride(base, LOCALIZED_VENUE_SEO_OVERRIDES[locale]?.[slug]);
  const merged = mergePriorityVenueSeo(slug, locale, existing);
  // Owner 2026-10-10: partner profiles lead with the real invite code ("<exchange> referral code" searches).
  const referral = referralSeoFor(slug, locale, market);
  return referral ? { ...(merged || {}), title: referral.title, description: referral.description } : geoSafeVenueSeoOverride(merged, slug, { locale, market });
}
function compareSeoOverrideFor(pair, locale) {
  const directAnswerOverride = compareSeoOverrideFromDirectAnswer(pair, locale);
  if (directAnswerOverride) return directAnswerOverride;
  const base = COMPARE_SEO_OVERRIDES[pair];
  return locale === "en" ? base || null : mergeLocalizedOverride(base, LOCALIZED_COMPARE_SEO_OVERRIDES[locale]?.[pair]);
}
const TOPIC_RELATED_LINKS = {
  "derivatives": ["/compare/binance-vs-okx", "/compare/bybit-vs-bitget", "/compare/hyperliquid-vs-dydx", "/news/hyperliquid-vs-dydx", "/exchanges/binance", "/exchanges/bybit", "/exchanges/hyperliquid", "/topics/no-kyc", "/topics/tokenized-stocks-vs-perpetuals"],
  "no-kyc": ["/compare/hyperliquid-vs-dydx", "/exchanges/hyperliquid", "/exchanges/dydx", "/exchanges/mexc"],
};

const TOPIC_METADATA_LOCALIZED_PACK = {
  "zh-Hant": {
    "meme-coins": ["迷因幣平台比較：MEXC、Gate.io、Raydium — NexuAlpha", "比較迷因幣平台的上幣節奏、流動性、池子檢查、交易成本、合約地址和地區帳戶條件。"],
    "compliant-exchanges": ["法幣通道與帳戶資格：HashKey、Kraken、OKX — NexuAlpha", "比較地區資格、身份核驗、同名銀行要求、法幣通道和官方規則來源，並區分銀行、平台和監管條件。"],
    "derivatives": ["加密永續合約平台比較：費率、資金費與清算檢查 — NexuAlpha", "按帳戶模式、公開費率、資金費、保證金模式、清算規則、預言機、地區限制與身份要求比較永續合約平台。"],
    "no-kyc": ["2026 免實名自託管 vs 實名交易所：Hyperliquid、dYdX 與 MEXC 比較 — NexuAlpha", "比較錢包連接、中心化帳戶流程、出金、地區限制、制裁控制、前端可用性和清算風險。"],
  },
  es: {
    "meme-coins": ["Comparación de plataformas meme coin: MEXC, Gate.io y Raydium — NexuAlpha", "Compara acceso, liquidez, costes, contratos de tokens, rutas de pools y condiciones de cuenta para operar meme coins."],
    "compliant-exchanges": ["Acceso fiat y elegibilidad de cuenta: HashKey, Kraken y OKX — NexuAlpha", "Compara elegibilidad regional, identidad, banca a mismo nombre, rutas fiat y fuentes oficiales antes de elegir plataforma."],
    derivatives: ["Comparación de plataformas perpetuas cripto: comisiones, funding y liquidación — NexuAlpha", "Compara plataformas perpetuas por modelo de cuenta, comisiones publicadas, funding, margen, liquidación, oráculos y acceso regional."],
    "no-kyc": ["Autocustodia sin KYC vs exchange con KYC (2026): Hyperliquid, dYdX y MEXC — NexuAlpha", "Compara acceso con wallet, cuentas CEX, retiros, límites regionales, controles de sanciones, front ends y riesgo de liquidación."],
  },
  "pt-BR": {
    "meme-coins": ["Comparação de plataformas meme coin: MEXC, Gate.io e Raydium — NexuAlpha", "Compare acesso, liquidez, custos, contratos de token, rotas de pools e condições de conta para meme coins."],
    "compliant-exchanges": ["Acesso fiat e elegibilidade de conta: HashKey, Kraken e OKX — NexuAlpha", "Compare elegibilidade regional, identidade, banco em mesmo nome, rotas fiat e fontes oficiais antes de escolher uma plataforma."],
    derivatives: ["Comparação de plataformas perpétuas cripto: taxas, funding e liquidação — NexuAlpha", "Compare plataformas perpétuas por modelo de conta, taxas publicadas, funding, margem, liquidação, oráculos e acesso regional."],
    "no-kyc": ["Autocustódia sem KYC vs exchange com KYC (2026): Hyperliquid, dYdX e MEXC — NexuAlpha", "Compare acesso por carteira, contas CEX, saques, limites regionais, controles de sanções, front ends e risco de liquidação."],
  },
  fr: {
    "meme-coins": ["Comparatif des plateformes meme coin : MEXC, Gate.io et Raydium — NexuAlpha", "Comparez accès, liquidité, frais, contrats de tokens, pools et conditions de compte pour les meme coins."],
    "compliant-exchanges": ["Accès fiat et éligibilité de compte : HashKey, Kraken et OKX — NexuAlpha", "Comparez éligibilité régionale, identité, banque au même nom, rails fiat et sources officielles avant de choisir."],
    derivatives: ["Comparatif des plateformes perpétuelles crypto : frais, funding et liquidation — NexuAlpha", "Comparez les plateformes perpétuelles par compte, frais publiés, funding, marge, liquidation, oracle et accès régional."],
    "no-kyc": ["Auto-garde sans KYC vs exchange avec KYC (2026) : Hyperliquid, dYdX et MEXC — NexuAlpha", "Comparez l’accès wallet, les comptes CEX, retraits, limites régionales, contrôles de sanctions, front ends et risque de liquidation."],
  },
  de: {
    "meme-coins": ["Meme-Coin-Plattformvergleich: MEXC, Gate.io und Raydium — NexuAlpha", "Vergleichen Sie Zugang, Liquidität, Kosten, Token-Verträge, Pool-Routen und Kontobedingungen für Meme Coins."],
    "compliant-exchanges": ["Fiat-Zugang und Kontoeignung: HashKey, Kraken und OKX — NexuAlpha", "Vergleichen Sie regionale Eignung, Identität, gleichnamige Bankkonten, Fiat-Wege und offizielle Quellen vor der Wahl."],
    derivatives: ["Krypto-Perpetual-Plattformen: Gebühren, Funding und Liquidation — NexuAlpha", "Vergleichen Sie Perpetual-Plattformen nach Kontomodell, Gebühren, Funding, Margin, Liquidation, Oracle und regionalem Zugang."],
    "no-kyc": ["Selbstverwahrung ohne KYC vs Börse mit KYC (2026): Hyperliquid, dYdX und MEXC — NexuAlpha", "Vergleichen Sie Wallet-Zugang, CEX-Konten, Auszahlungen, regionale Grenzen, Sanktionsprüfungen, Frontends und Liquidationsrisiko."],
  },
  ja: {
    "meme-coins": ["ミームコイン取引プラットフォーム比較：MEXC、Gate.io、Raydium — NexuAlpha", "ミームコインの上場、流動性、手数料、トークンコントラクト、プール経路、口座条件を比較します。"],
    "compliant-exchanges": ["法定通貨アクセスと口座適格性：HashKey、Kraken、OKX — NexuAlpha", "地域適格性、本人確認、同名義銀行、法定通貨ルート、公式ルール情報を比較します。"],
    derivatives: ["暗号資産パーペチュアル比較：手数料、資金調達率、清算チェック — NexuAlpha", "口座モデル、公開手数料、資金調達率、証拠金、清算、オラクル、地域条件で比較します。"],
    "no-kyc": ["本人確認なしの自己管理 vs 本人確認必須の取引所（2026）：Hyperliquid、dYdX、MEXC比較 — NexuAlpha", "ウォレット接続、CEX口座、出金、地域制限、制裁チェック、フロントエンド、清算リスクを比較します。"],
  },
  ko: {
    "meme-coins": ["밈코인 플랫폼 비교: MEXC, Gate.io, Raydium — NexuAlpha", "밈코인 상장, 유동성, 비용, 토큰 계약, 풀 경로와 계정 조건을 비교하세요."],
    "compliant-exchanges": ["법정화폐 접근성과 계정 자격: HashKey, Kraken, OKX — NexuAlpha", "지역 자격, 본인확인, 동일 명의 은행, 법정화폐 경로와 공식 규칙 출처를 비교하세요."],
    derivatives: ["크립토 무기한 계약 플랫폼 비교: 수수료, 펀딩과 청산 — NexuAlpha", "계정 모델, 공개 수수료, 펀딩, 마진, 청산, 오라클, 지역 접근과 신원 요구 사항을 비교하세요."],
  },
  ar: {
    "meme-coins": ["مقارنة منصات عملات الميم: MEXC وGate.io وRaydium — NexuAlpha", "قارن الوصول والسيولة والتكاليف وعقود الرموز ومسارات المجمعات وشروط الحساب لعملات الميم."],
    "compliant-exchanges": ["الوصول إلى العملات التقليدية وأهلية الحساب: HashKey وKraken وOKX — NexuAlpha", "قارن الأهلية الإقليمية والهوية ومتطلبات الحساب البنكي ومسارات العملات التقليدية والمصادر الرسمية."],
    derivatives: ["مقارنة منصات العقود الدائمة: الرسوم والتمويل والتصفية — NexuAlpha", "قارن منصات العقود الدائمة حسب نموذج الحساب والرسوم المنشورة والتمويل والهامش والتصفية والأوراكل والوصول الإقليمي."],
    "no-kyc": ["حفظ ذاتي دون KYC مقابل منصة تتطلب KYC (2026): Hyperliquid وdYdX وMEXC — NexuAlpha", "قارن اتصال المحفظة وحسابات CEX والسحب والحدود الإقليمية وفحص العقوبات والواجهات ومخاطر التصفية."],
  },
  tr: {
    "meme-coins": ["Meme coin platform karşılaştırması: MEXC, Gate.io ve Raydium — NexuAlpha", "Meme coin erişimini, likiditeyi, maliyetleri, token kontratlarını, pool rotalarını ve hesap koşullarını karşılaştırın."],
    "compliant-exchanges": ["Fiat erişimi ve hesap uygunluğu: HashKey, Kraken ve OKX — NexuAlpha", "Bölgesel uygunluk, kimlik, aynı isimli banka, fiat yolları ve resmi kural kaynaklarını karşılaştırın."],
    derivatives: ["Kripto perpetual platform karşılaştırması: ücretler, funding ve likidasyon — NexuAlpha", "Perpetual platformları hesap modeli, yayınlanmış ücretler, funding, marjin, likidasyon, oracle ve bölgesel erişime göre karşılaştırın."],
  },
  ru: {
    "meme-coins": ["Сравнение платформ для meme coin: MEXC, Gate.io и Raydium — NexuAlpha", "Сравните доступ, ликвидность, комиссии, контракты токенов, маршруты пулов и условия аккаунта для meme coin."],
    "compliant-exchanges": ["Фиатный доступ и условия аккаунта: HashKey, Kraken и OKX — NexuAlpha", "Сравните региональную доступность, идентификацию, одноимённый банк, фиатные маршруты и официальные источники."],
    derivatives: ["Сравнение крипто-перпетуалов: комиссии, funding и ликвидация — NexuAlpha", "Сравните perpetual-платформы по модели аккаунта, комиссиям, funding, марже, ликвидации, oracle и региональному доступу."],
    "no-kyc": ["Самостоятельное хранение без KYC vs биржа с KYC (2026): Hyperliquid, dYdX и MEXC — NexuAlpha", "Сравните wallet-доступ, CEX-аккаунты, вывод, региональные лимиты, санкционные проверки, фронтенды и риск ликвидации."],
  },
  id: {
    "meme-coins": ["Perbandingan platform meme coin: MEXC, Gate.io, dan Raydium — NexuAlpha", "Bandingkan akses, likuiditas, biaya, kontrak token, rute pool, dan ketentuan akun untuk meme coin."],
    "compliant-exchanges": ["Akses fiat dan kelayakan akun: HashKey, Kraken, dan OKX — NexuAlpha", "Bandingkan kelayakan regional, identitas, bank atas nama sama, jalur fiat, dan sumber aturan resmi."],
    derivatives: ["Perbandingan platform perpetual kripto: biaya, funding, dan likuidasi — NexuAlpha", "Bandingkan platform perpetual menurut model akun, biaya publik, funding, margin, likuidasi, oracle, dan akses regional."],
    "no-kyc": ["Swakelola tanpa KYC vs bursa dengan KYC (2026): Hyperliquid, dYdX, dan MEXC — NexuAlpha", "Bandingkan akses dompet, akun CEX, penarikan, batas regional, kontrol sanksi, front end, dan risiko likuidasi."],
  },
  vi: {
    "meme-coins": ["So sánh nền tảng meme coin: MEXC, Gate.io và Raydium — NexuAlpha", "So sánh quyền truy cập, thanh khoản, chi phí, hợp đồng token, tuyến pool và điều kiện tài khoản cho meme coin."],
    "compliant-exchanges": ["Truy cập fiat và điều kiện tài khoản: HashKey, Kraken và OKX — NexuAlpha", "So sánh điều kiện khu vực, danh tính, ngân hàng cùng tên, tuyến fiat và nguồn quy tắc chính thức."],
    derivatives: ["So sánh nền tảng perpetual crypto: phí, funding và thanh lý — NexuAlpha", "So sánh nền tảng perpetual theo mô hình tài khoản, phí công bố, funding, ký quỹ, thanh lý, oracle và truy cập khu vực."],
    "no-kyc": ["Tự lưu ký không KYC vs sàn yêu cầu KYC (2026): Hyperliquid, dYdX và MEXC — NexuAlpha", "So sánh kết nối ví, tài khoản CEX, rút tiền, giới hạn khu vực, kiểm soát trừng phạt, front end và rủi ro thanh lý."],
  },
  it: {
    "meme-coins": ["Confronto piattaforme meme coin: MEXC, Gate.io e Raydium — NexuAlpha", "Confronta accesso, liquidità, costi, contratti token, pool e condizioni account per le meme coin."],
    "compliant-exchanges": ["Accesso fiat e idoneità account: HashKey, Kraken e OKX — NexuAlpha", "Confronta idoneità regionale, identità, banca con stesso nome, percorsi fiat e fonti ufficiali."],
    derivatives: ["Confronto piattaforme perpetual crypto: commissioni, funding e liquidazione — NexuAlpha", "Confronta piattaforme perpetual per modello account, commissioni pubblicate, funding, margine, liquidazione, oracle e accesso regionale."],
    "no-kyc": ["Autocustodia senza KYC vs exchange con KYC (2026): Hyperliquid, dYdX e MEXC — NexuAlpha", "Confronta accesso wallet, account CEX, prelievi, limiti regionali, controlli sanzioni, front end e rischio di liquidazione."],
  },
};
for (const [locale, topics] of Object.entries(TOPIC_METADATA_LOCALIZED_PACK)) {
  LOCALIZED_TOPIC_SEO_OVERRIDES[locale] ||= {};
  for (const [slug, [title, description]] of Object.entries(topics)) {
    LOCALIZED_TOPIC_SEO_OVERRIDES[locale][slug] ||= { title, description };
    LOCALIZED_TOPIC_SEO_OVERRIDES[locale][slug].title ||= title;
    LOCALIZED_TOPIC_SEO_OVERRIDES[locale][slug].description ||= description;
  }
}

const DETAIL_TITLE_LOCALIZED = {
  "zh-Hant": { profile: "平台檔案與手續費", compare: "手續費與平台選擇" },
  ja: { profile: "プラットフォーム概要と手数料", compare: "取引手数料とプラットフォーム比較" },
  ko: { profile: "플랫폼 프로필 및 수수료", compare: "거래 수수료 및 플랫폼 비교" },
  tr: { profile: "Platform profili ve ücretler", compare: "İşlem ücretleri ve platform karşılaştırması" },
};
const DETAIL_DESCRIPTION_LOCALIZED = {
  "zh-Hant": {
    profile: (name) => `${name} 手續費、產品、帳戶條件與官方來源的獨立資料。用戶權益、地區可用性和活動資格需在官方帳戶內核驗。`,
  },
};
const FACTBOOK_TITLE_LOCALIZED = {
  "zh-Hans": "来源审阅事实库 (Factbook)",
  "zh-Hant": "來源審閱事實庫 (Factbook)",
  ja: "出典ファクトブック",
  ko: "출처 팩트북",
  tr: "Kaynak factbook",
  es: "Ficha de fuentes",
  "pt-BR": "Ficha de fontes",
  fr: "Fiche des sources",
  de: "Quellen-Factbook",
  ar: "سجل المصادر",
  ru: "Досье источников",
  id: "Factbook sumber",
  vi: "Hồ sơ nguồn",
  it: "Factbook delle fonti",
};

const FACTBOOK_DESCRIPTION_LOCALIZED = {
  "zh-Hans": (name) => `${name} 来源审阅事实库：基础费率、地区资格、KYC 参考与官方域名核验。用户权益和储备数据须逐项核对来源与更新时间。`,
  "zh-Hant": (name) => `${name} 來源審閱事實庫：基礎費率、地區資格、KYC 參考與官方網域核驗。用戶權益和儲備資料須逐項核對來源與更新時間。`,
  es: (name) => `Ficha de fuentes de ${name}: comisiones base, acceso regional, referencias KYC y dominios oficiales. Beneficios y reservas requieren verificación por fuente.`,
  "pt-BR": (name) => `Ficha de fontes da ${name}: taxas base, acesso regional, referências de KYC e domínios oficiais. Benefícios e reservas exigem verificação por fonte.`,
  fr: (name) => `Factbook des sources pour ${name} : frais de base, accès régional, KYC et domaines officiels. Avantages et réserves exigent une vérification par source.`,
  de: (name) => `Quellen-Factbook für ${name}: Basisgebühren, regionaler Zugang, KYC-Hinweise und offizielle Domains. Vorteile und Reserven brauchen Quellenprüfung.`,
  ja: (name) => `${name}の基本手数料、地域アクセス、KYC情報、公式ドメインを確認する出典ファクトブック。特典と準備金は項目ごとの確認が必要です。`,
  ko: (name) => `${name}의 기본 수수료, 지역 접근성, KYC 정보와 공식 도메인을 확인하는 출처 팩트북입니다. 혜택과 준비금은 항목별 확인이 필요합니다.`,
  ar: (name) => `سجل مصادر ${name}: الرسوم الأساسية، الوصول الإقليمي، مراجع KYC والنطاقات الرسمية. تتطلب المزايا والاحتياطيات تحققاً لكل مصدر.`,
  tr: (name) => `${name} için kaynak factbook: temel ücretler, bölgesel erişim, KYC referansları ve resmî alan adları. Avantajlar ve rezervler kaynak bazında doğrulanmalıdır.`,
  ru: (name) => `Досье источников ${name}: базовые комиссии, региональный доступ, KYC и официальные домены. Преимущества и резервы проверяются по источникам.`,
  id: (name) => `Factbook sumber ${name}: biaya dasar, akses regional, referensi KYC, dan domain resmi. Manfaat dan cadangan harus diverifikasi per sumber.`,
  vi: (name) => `Hồ sơ nguồn của ${name}: phí cơ sở, quyền truy cập theo khu vực, KYC và tên miền chính thức. Quyền lợi và dự trữ cần kiểm tra theo nguồn.`,
  it: (name) => `Factbook delle fonti per ${name}: commissioni base, accesso regionale, KYC e domini ufficiali. Vantaggi e riserve richiedono verifica per fonte.`,
};

const REGIONAL_PREVIEW_SEO = {
  MX: ["México: preparación para MXN y SPEI — NexuAlpha", "Ruta de investigación para MXN, SPEI y la preparación de una cuenta de pagos local."],
  TW: ["台灣：新台幣開戶條件研究 — NexuAlpha", "繁體中文研究路徑，整理新台幣、銀行驗證與帳戶條件。"],
  ID: ["Indonesia: IDR deposit path research — NexuAlpha", "Research path for IDR deposits, local payment methods and account conditions."],
  VN: ["Việt Nam crypto account research checklist — NexuAlpha", "Noindex research path for Vietnam crypto account checks: official domain, identity, VND or USDT funding, fees, limits and product scope, each verified in official sources."],
  HK: ["Hong Kong Crypto Account Eligibility Research — NexuAlpha", "Direct answer hub for Hong Kong crypto account checks: SFC platform status, HKD funding, identity, proof-of-address and product scope, verified in official sources."],
  EU: ["European Union Crypto Platform Eligibility Research — NexuAlpha", "EU crypto platform checks: ESMA MiCA register, country scope, EUR or SEPA funding, identity and product permissions must be verified in official sources."],
  UK: ["United Kingdom Crypto Account Eligibility Research — NexuAlpha", "Direct answer hub for UK crypto account checks: FCA registration, residence, identity or appropriateness checks, GBP funding and product scope, verified in official sources."],
  US: ["United States Crypto Account Verification Research — NexuAlpha", "Direct answer hub for U.S. crypto account checks: FinCEN MSB context, state licenses, USD funding, identity, residence and product scope, verified in official sources."],
  JP: ["日本の暗号資産プラットフォーム調査 — NexuAlpha", "金融庁の登録情報、本人確認、日本円入金、本人名義口座、商品範囲を公式情報で確認するための直接回答ハブです。"],
  KR: ["한국 암호화폐 플랫폼 조사 — NexuAlpha", "금융위원회·금융정보분석원 맥락, 본인확인, 실명확인 계좌, 원화 입출금과 상품 범위를 공식 자료로 확인하는 직접 답변 허브입니다."],
  SG: ["Singapore Crypto Account Verification Checklist — NexuAlpha", "Answer-first checklist for Singapore crypto accounts: verify MAS DPT context, SGD funding, PayNow, FAST and product scope only inside the official account flow."],
  TR: ["Türkiye kripto platformu araştırması: SPK, TRY ve hesap kapsamı — NexuAlpha", "SPK geçici faaliyet ve tasfiye listeleri, kimlik adımları, TRY yatırma yolu ve ürün kapsamı için resmi kaynaklara dayalı doğrudan cevap merkezi."],
  OTHER: ["International Crypto Account Checklist — NexuAlpha", "Set residence, product, funding route and account stage before choosing a crypto platform or following any registration path."],
};
const INDEXABLE_REGIONAL_PREVIEWS = new Set(["MX", "TW", "ID", "HK", "EU", "UK", "US", "JP", "KR", "SG", "TR"]);
function regionalPreviewIsIndexable(market, locale) {
  if (!INDEXABLE_REGIONAL_PREVIEWS.has(market)) return false;
  return ({ MX: "es", TW: "zh-Hant", ID: "id", HK: "zh-Hant", EU: "en", UK: "en", US: "en", JP: "ja", KR: "ko", SG: "en", TR: "tr" })[market] === locale;
}
function regionalPreviewCanonicalLocale(market, locale) {
  if (market === "MX") return "es";
  return market === "TR" ? "tr" : locale;
}
const CLEAN_REGIONAL_ROOTS = new Set(["/br", "/mx", "/tw", "/id", "/vn", "/hk", "/eu", "/uk", "/us", "/jp", "/kr", "/sg", "/tr", "/int"]);
function regionalPreviewCanonicalUrl(pathname, market, locale) {
  return CLEAN_REGIONAL_ROOTS.has(pathname)
    ? `${PUBLIC_ORIGIN}${pathname}`
    : canonical(pathname, regionalPreviewCanonicalLocale(market, locale));
}
const REGIONAL_PREVIEW_FAQ = {
  TW: {
    "zh-Hant": {
      question: "台灣用戶選擇加密貨幣平台前，應如何理解金管會法規與洗錢防制登記？",
      answer: "先確認金管會公布的現行法規、施行日期與服務主體。已公布的法律可能仍有部分條文尚未施行；完成洗錢防制或 VASP 登記也不等於金管會保證帳戶獲批、平台安全、新台幣入出金或任何商品可用。最後仍要在官方帳戶流程核對身分、本人銀行帳戶、費用、限額與商品範圍。",
    },
  },
  MX: {
    es: {
      question: aeoQuestionText("mx-spei-route"),
      answer: "Un usuario mexicano debe empezar por SPEI y MXN como ruta de pago, después confirmar identidad, residencia, producto y condiciones de cuenta en el flujo oficial de la plataforma. Banxico, Binance y CNBV ayudan a delimitar la investigación, pero no garantizan apertura, depósito, producto o beneficio para una cuenta concreta.",
    },
  },
  ID: {
    id: {
      question: aeoQuestionText("id-va-qris-route"),
      answer: "Pengguna Indonesia harus mulai dari konteks resmi OJK/Bappebti, lalu memeriksa nama badan usaha, domain resmi, verifikasi identitas, domisili, jalur IDR seperti VA bank atau QRIS, biaya, batas, waktu proses dan produk di alur akun resmi. Daftar regulator atau panduan deposit tidak membuktikan akun, produk, manfaat, referral, atau hasil pendaftaran untuk pengguna tertentu.",
    },
  },
  JP: {
    ja: {
      question: aeoQuestionText("jp-fsa-register"),
      answer: "日本の利用者は、金融庁の登録情報、公式プラットフォームの本人確認、日本円入金、本人名義口座、利用できる商品範囲を確認してください。登録情報は口座資格や特典を保証しません。",
    },
  },
  KR: {
    ko: {
      question: aeoQuestionText("kr-regulatory-context"),
      answer: "한국 이용자는 금융위원회와 금융정보분석원 자료로 규제 맥락을 확인한 뒤 공식 플랫폼 화면에서 본인확인, 실명확인 계좌, 원화 입출금, 상품 범위와 혜택 조건을 따로 확인해야 합니다. 이 자료는 계정 승인이나 혜택 보장이 아닙니다.",
    },
  },
  SG: {
    en: {
      question: aeoQuestionText("sg-mas-dpt-directory"),
      answer: "For Singapore, use MAS Digital Payment Token service context, SGD, PayNow and FAST only as account-screen verification inputs. Confirm the platform's official account flow, identity and residence checks, service entity, payment rail visibility, fees, limits and product scope before acting; a listing or Singapore-facing page does not prove account approval, funding access, product access or benefits.",
    },
  },
  HK: {
    "zh-Hant": {
      question: aeoQuestionText("hk-sfc-platform-status-zh-hant"),
      answer: "先查閱 SFC 虛擬資產交易平台名單及平台官方資料，再在官方帳戶流程核對居住地、身分、地址證明、2FA、本人銀行帳戶、HKD 銀行轉帳、eDDA、鏈上轉帳、費用、hold 與產品範圍。這些資料不保證開戶批准、產品適用性、費用結果、用戶權益或註冊歸因。",
    },
  },
  EU: {
    en: {
      question: aeoQuestionText("eu-mica-register"),
      answer: "Start with ESMA MiCA register context, then confirm the service entity, country of residence, identity checks, EUR or SEPA funding route and product scope inside the official account flow. A register entry or payment guide does not guarantee account approval, product access or user benefits.",
    },
  },
  UK: {
    en: {
      question: aeoQuestionText("uk-fca-register"),
      answer: "Start with FCA cryptoasset registration guidance, then confirm UK residence, identity or appropriateness checks, GBP funding, bank-name matching, product scope and current onboarding terms in the official platform account flow. Public sources do not guarantee registration, funding or benefits for a specific user.",
    },
  },
  US: {
    en: {
      question: aeoQuestionText("us-fincen-msb-non-endorsement"),
      answer: "Start with FinCEN MSB registration as BSA context, then check NMLS or NYDFS state records, SEC and CFTC risk context, identity, residence, USD funding rails, bank-name matching, holds, state exclusions and product scope in the official account flow. Public sources do not prove account approval, endorsement, USD availability, product access, benefit eligibility or registration attribution for a specific user.",
    },
  },
  TR: {
    tr: {
      question: aeoQuestionText("tr-spk-register"),
      answer: "SPK'nın geçici faaliyet listesi ve tasfiye listesi ayrı okunmalıdır. Tasfiye listesinde görünen bir ad, Bitget Teknoloji AŞ dahil, kullanılabilir Türkiye kayıt veya TRY fonlama yolu sayılmaz. Bir adın listede görünmesi hesap uygunluğu, ürün erişimi, kayıt sonucu veya kullanıcı faydası anlamına gelmez; kimlik, TRY yatırma ve ürün kapsamı resmi hesap akışında doğrulanmalıdır.",
    },
  },
};
const REGIONAL_PREVIEW_SOURCE_URLS = {
  TW: ["https://law.fsc.gov.tw/LawContent.aspx?id=GL004301", "https://law.fsc.gov.tw/LawContent.aspx?id=GL004000", "https://www.fsc.gov.tw/userfiles/file/1141114%E5%AE%8C%E6%88%90%E6%B4%97%E9%8C%A2%E9%98%B2%E5%88%B6%E7%99%BB%E8%A8%98%E4%B9%8BVASP%E6%A5%AD%E8%80%85%E5%90%8D%E5%96%AE%28%E6%9B%B4%E6%8B%93%E8%8D%92%E8%B3%87%E6%9C%AC%E9%A1%8D.pdf", "https://support.maicoin.com/zh-TW/support/solutions/articles/32000026522-max-%E6%96%B0%E5%8F%B0%E5%B9%A3%E5%85%A5%E9%87%91%E6%95%99%E5%AD%B8", "https://support.maicoin.com/zh-TW/support/solutions/articles/32000027069-%E8%A8%BB%E5%86%8A%E6%95%99%E5%AD%B8", "https://support.maicoin.com/zh-TW/support/solutions/articles/32000016129-%E5%A6%82%E4%BD%95%E9%A9%97%E8%AD%89%E9%8A%80%E8%A1%8C%E5%B8%B3%E8%99%9F-"],
  ID: ["https://ojk.go.id/id/berita-dan-kegiatan/siaran-pers/Pages/Bappebti-Kemendag-Alihkan-Tugas-Aset-Keuangan-Digital-termasuk-Aset-Kripto-serta-Derivatif-Keuangan-kepada-OJK-dan-BI.aspx", "https://bappebti.go.id/calon_pedagang_aset_kripto", "https://support.tokocrypto.com/hc/en-us/articles/31314362562829-Tokocrypto-Deposit-Guide", "https://support.tokocrypto.com/hc/en-us/articles/19368690221069-Understanding-Referral-Codes-on-Tokocrypto"],
  MX: ["https://www.banxico.org.mx/servicios/spei_-informacion-banco-mex.html", "https://www.binance.com/es-MX/support/faq/detail/c45b457e73a14580ab6be95f10bef5b5", "https://www.binance.com/es-MX/support/faq/detail/588ca3bd6b214a17bf1070a8189fb809", "https://www.gob.mx/cnbv/acciones-y-programas/sector-fintech"],
  HK: ["https://www.sfc.hk/en/Welcome-to-the-Fintech-Contact-Point/Virtual-assets/Virtual-asset-trading-platforms-operators/Lists-of-virtual-asset-trading-platforms", "https://www.sfc.hk/en/Welcome-to-the-Fintech-Contact-Point/Virtual-assets/Virtual-asset-trading-platforms-operators", "https://support.hashkey.com/hc/en-gb/articles/25794717042585-HashKey-Exchange-fiat-currency-deposit-guidelines-General", "https://support.hashkey.com/hc/en-gb/articles/48860678459801-Deposit-Guide-for-eDDA", "https://www.osl.com/hk-en/bits/article/osl-account-opening-and-2fa-setup-guide", "https://www.osl.com/hk-en/support/article/kA0fv00000002BVCAY?channel=PPXtZS"],
  EU: ["https://www.esma.europa.eu/et/node/200055", "https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mica/article-109-register-crypto-asset-white", "https://help.coinbase.com/en-gb/coinbase/getting-started/add-a-payment-method/add-and-verify-pm-emea"],
  UK: ["https://www.fca.org.uk/firms/cryptoassets/who-needs-register", "https://www.fca.org.uk/firms/cryptoassets/how-apply-registration", "https://help.coinbase.com/en-gb/coinbase/trading-and-funding/depositing-or-withdrawing-fiat-money/funding-your-account-emea"],
  US: ["https://www.fincen.gov/resources/money-services-business-msb-registration", "https://www.fincen.gov/resources/statutes-regulations/guidance/application-fincens-regulations-persons-administering", "https://www.sec.gov/resources-small-businesses/capital-raising-building-blocks/crypto-assets-federal-securities-laws", "https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/understand_risks_of_virtual_currency.html", "https://www.nmlsconsumeraccess.org/", "https://www.dfs.ny.gov/virtual_currency_businesses", "https://help.coinbase.com/en/exchange/trading-and-funding/funding-your-account-with-usd", "https://support.kraken.com/in/articles/quick-start-for-clients-in-the-united-states", "https://support.binance.us/en/collections/10384430-deposits-withdrawals"],
  JP: ["https://www.fsa.go.jp/en/regulated/licensed/en_kasoutuka.pdf", "https://bitflyer.com/en-jp/s/how-to-start", "https://bitflyer.com/en-jp/faq"],
  KR: ["https://www.fsc.go.kr/eng/pr010101/81698", "https://www.kofiu.go.kr/eng/legislation/legislation.do", "https://support.upbit.com/hc/ko/articles/900006825383-%ED%9A%8C%EC%9B%90-%EA%B0%80%EC%9E%85%EC%9D%80-%EC%96%B4%EB%96%BB%EA%B2%8C-%ED%95%98%EB%82%98%EC%9A%94"],
  SG: ["https://eservices.mas.gov.sg/fid/institution?activity=Digital+Payment+Token+Service", "https://www.mas.gov.sg/regulation/payments/licensing-for-payment-service-providers/types-of-payment-services", "https://www.coinbase.com/en-sg", "https://www.independentreserve.com/"],
  TR: ["https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi", "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/tasfiye-surecinde-olanlar-listesi", "https://www.paribu.com/destek/try-transactions/try-deposit"],
};
const REGIONAL_PREVIEW_RELATED_LINKS = {
  TW: ["/methodology", "/exchanges?market=TW&product=spot", "/rates?market=TW&product=spot", "/compare/binance-vs-okx?market=TW&product=spot"],
  ID: ["/methodology", "/exchanges?market=ID&product=spot", "/rates?market=ID&product=spot", "/compare/binance-vs-okx?market=ID&product=spot"],
  MX: ["/methodology", "/exchanges", "/compare/binance-vs-okx", "/rates"],
  HK: ["/methodology", "/exchanges?market=HK&product=spot&locale=zh-Hant", "/rates?market=HK&product=spot&locale=zh-Hant", "/compare/binance-vs-okx?market=HK&product=spot&locale=zh-Hant", "/factbook/hashkey"],
  EU: ["/methodology", "/news/esma-mica-register-how-to-check-casp-issuer-status", "/factbook/coinbase"],
  UK: ["/methodology", "/exchanges", "/factbook/coinbase"],
  US: ["/methodology", "/exchanges?market=US&product=spot", "/rates?market=US&product=spot", "/compare/coinbase-vs-kraken?market=US&product=spot"],
  JP: ["/methodology", "/exchanges"],
  KR: ["/methodology", "/exchanges"],
  SG: ["/exchanges?market=SG&product=spot", "/rates?market=SG&product=spot", "/compare/binance-vs-okx?market=SG&product=spot"],
  TR: ["/methodology", "/exchanges", "/markets/turkiye"],
};
const REGIONAL_PREVIEW_EXTRA_FAQ = {
  TW: { "zh-Hant": [["洗錢防制或 VASP 登記是否代表帳戶與商品一定可用？", "不是。登記只提供特定監理脈絡，不是帳戶核准、平台背書、資產安全、新台幣入出金或商品權限的保證。"], ["台灣用戶在入金前要核對哪些帳戶條件？", "在官方帳戶畫面逐項確認身分驗證、本人名義銀行帳戶、新台幣入金與出金、費用、限額、處理時間及目標商品；公開資料不能代替帳戶結果。"]] },
  MX: { es: [[aeoQuestionText("mx-account-es"), "No. Las fuentes oficiales permiten revisar identidad, residencia, MXN, SPEI, producto y marco regulatorio, pero la disponibilidad final se decide dentro de la cuenta oficial."], [aeoQuestionText("mx-product-scope-es"), "Debe abrir el flujo oficial del producto que quiere usar y comprobar entidad, dominio, permisos, comisiones y restricciones regionales antes de depositar o registrarse."]] },
  ID: { id: [[aeoQuestionText("id-account-stage"), "Tidak. Konteks OJK/Bappebti dan panduan platform hanya menjadi peta verifikasi. Pengguna tetap harus membuka alur akun resmi untuk mengecek identitas, domisili, VA bank, QRIS, wallet, biaya, batas, waktu proses, referral dan produk."], ["Apakah daftar Bappebti atau panduan deposit berarti semua produk tersedia?", "Tidak. Daftar atau panduan tidak membuktikan persetujuan akun, deposit IDR, penarikan, spot, futures, promosi atau manfaat pengguna. Semua hasil tetap bergantung pada layar akun resmi saat tindakan."]] },
  HK: { "zh-Hant": [
    [aeoQuestionText("hk-hkd-edda-bank-zh-hant"), "不能。請把 SFC 與平台官方資料當作核驗地圖，並在官方帳戶流程確認本人銀行帳戶、HKD 銀行轉帳、eDDA、最低金額、費用、hold、銀行處理時間與退回規則。"],
    [aeoQuestionText("hk-proof-address-product-scope-zh-hant"), "提交身分與地址證明後，仍要在官方帳戶畫面核對帳戶狀態、2FA、銀行驗證、鏈上轉帳、現貨或其他產品範圍；公開來源不能替代帳戶結果。"],
  ] },
  EU: { en: [[aeoQuestionText("eu-member-state"), "No. Register context must be paired with the service entity, Member State, identity checks, EUR or SEPA route and the exact product permission shown in the official account flow."]] },
  UK: { en: [[aeoQuestionText("uk-product-scope"), "No. FCA context is a starting point. The user still needs UK residence checks, identity or appropriateness steps, GBP funding conditions, bank-name matching and official product-scope confirmation."]] },
  US: { en: [[aeoQuestionText("us-state-license-boundary"), "No. FinCEN MSB registration, NMLS records, NYDFS context, SEC materials and CFTC risk guidance are research inputs. A U.S. user still needs state, identity, USD rail, bank-name, hold, product and account-stage checks in the official account flow."], [aeoQuestionText("us-usd-account-funding"), "ACH, wire, debit-card, crypto transfer, cash-out and withdrawal permissions can differ by state, platform, identity status and current account controls. Treat every USD rail as account-specific until the official screen confirms it."]] },
  JP: { ja: [[aeoQuestionText("jp-jpy-funding"), "金融庁の登録情報は確認の出発点です。本人確認、本人名義口座、日本円入金、商品範囲、公式アプリや口座画面の条件を別々に確認してください。"]] },
  KR: { ko: [[aeoQuestionText("kr-product-scope"), "아닙니다. FSC·KoFIU 맥락은 출발점입니다. 본인확인, 실명확인 계좌, 원화 입출금, 상품 범위와 계정별 조건은 공식 계정 화면에서 별도로 확인해야 합니다."]] },
  SG: { en: [[aeoQuestionText("sg-sgd-funding"), "No. SGD, PayNow and FAST are account-screen checks, not public promises. Keep the market, product and locale context attached while moving from directory to rates to comparison checks."]] },
  TR: { tr: [[aeoQuestionText("tr-platform-status"), "Hayır. SPK listesi durum kontrolü sağlar; kimlik, adres, yatırımcı profili, TRY banka transferi ve ürün kapsamı resmi platform akışında ayrı ayrı doğrulanmalıdır."]] },
};
function regionalPreviewFaqEntries(market, locale) {
  const primary = REGIONAL_PREVIEW_FAQ[market]?.[locale];
  const extras = REGIONAL_PREVIEW_EXTRA_FAQ[market]?.[locale] || [];
  return [
    ...(primary ? [{ question: primary.question, answer: primary.answer }] : []),
    ...extras.map(([question, answer]) => ({ question, answer })),
  ];
}
const MX_DECISION_SOURCE_URLS = REGIONAL_PREVIEW_SOURCE_URLS.MX;
const MX_DECISION_LINKS = {
  "/mx/comparar": ["/mx", "/mx/costos", "/mx/conta", "/compare/binance-vs-okx?market=MX&product=spot&locale=es", "/exchanges?market=MX&product=spot&locale=es"],
  "/mx/costos": ["/mx", "/mx/comparar", "/mx/conta", "/rates?market=MX&product=spot&locale=es", "/methodology"],
  "/mx/conta": ["/mx", "/mx/comparar", "/mx/costos", "/exchanges?market=MX&product=spot&locale=es", "/methodology#disclosure"],
};
const MX_DECISION_SEO = {
  "/mx/comparar": {
    title: "Comparar exchanges en México: MXN, SPEI y cuenta oficial — NexuAlpha",
    description: "Compara Binance, OKX y otros candidatos para México separando MXN, SPEI, identidad, producto, dominio oficial y condiciones de cuenta antes del registro.",
    faq: [
      [aeoQuestionText("mx-platform-comparison"), "Empieza por la ruta documentada de Binance para MXN/SPEI y compara OKX u otros candidatos solo desde su dominio y flujo oficial de cuenta. Ninguna comparación externa prueba que todos tengan MXN, SPEI, el mismo producto o una promoción activa para México."],
      ["¿Qué enlaces internos debe revisar un usuario mexicano antes del CTA?", "Usa la página principal de México para el mapa de fuentes, la página de costes para separar comisiones y la página de cuenta para distinguir partner, código, beneficio y aprobación de cuenta antes de abrir el enlace oficial."],
      ["¿Una comparación pública demuestra que una plataforma acepta mi depósito?", "No. La comparación reduce la lista de candidatos, pero el método de fondeo, identidad, residencia, límites, producto y condiciones finales se confirman dentro de la cuenta oficial."],
    ],
  },
  "/mx/costos": {
    title: "Costos cripto en México: MXN, SPEI, spot y tarifa de cuenta — NexuAlpha",
    description: "Separa comisión spot, coste de entrada MXN/SPEI, spread, retiro, límites y condiciones de cuenta para México antes de registrarte o depositar.",
    faq: [
      [aeoQuestionText("mx-cost-scenario"), "Separa comisión maker/taker, coste del método de entrada, spread, retiro, límites, tiempo de proceso, nivel de cuenta y producto. SPEI o MXN en una fuente pública no sustituyen la tarifa final mostrada por la cuenta oficial."],
      ["¿La calculadora de costes sustituye la tabla oficial?", "No. Sirve para comparar hipótesis antes del registro. La comisión aplicable, el método disponible, los límites y cualquier coste de transferencia deben venir del flujo oficial de la plataforma."],
      ["¿Qué debe pasar antes de depositar MXN?", "El usuario debe ver el método de fondeo, la cuenta bancaria, el importe, la comisión, el límite, el tiempo y el estado de la orden en la pantalla oficial de su propia cuenta."],
    ],
  },
  "/mx/conta": {
    title: "Cuenta cripto en México: partner, código, beneficio y KYC — NexuAlpha",
    description: "Distingue enlace de partner, código, beneficio, KYC, residencia, producto y aprobación de cuenta para México antes de seguir una ruta oficial.",
    faq: [
      [aeoQuestionText("mx-account-benefit-boundary"), "El enlace de partner es una ruta de registro; el código o beneficio son condiciones que solo la plataforma puede mostrar como aplicables. KYC, residencia, producto, campaña, depósito, operación y atribución de registro deben verificarse en la cuenta oficial."],
      ["¿Un enlace con partner garantiza bono o descuento en México?", "No. Puede identificar una ruta de registro, pero no prueba aprobación de cuenta, elegibilidad, beneficio, comisión final, producto disponible ni atribución hasta que el flujo oficial lo muestre."],
      ["¿Qué debe guardar el usuario antes de continuar?", "Debe guardar o revisar la pantalla oficial con dominio, código cuando aparezca, tareas, producto, plazo, KYC, método de fondeo y condiciones aplicables a su cuenta."],
    ],
  },
};
const MX_DECISION_SEO_EN = {
  "/mx/comparar": {
    title: "Mexico: compare Binance, OKX and other candidates before registration — NexuAlpha",
    description: "A Mexico comparison page that separates the documented MXN/SPEI route, official domain, identity checks, product scope and account conditions before any CTA.",
  },
  "/mx/costos": {
    title: "Mexico: separate spot fee, MXN/SPEI, spread, withdrawal and account conditions — NexuAlpha",
    description: "A Mexico cost page that turns a registration decision into an editable cost hypothesis, with clear limits between published fees and final account costs.",
  },
  "/mx/conta": {
    title: "Mexico: account, partner route, code, KYC and benefit before registration — NexuAlpha",
    description: "A Mexico account page that separates partner link, visible code, benefit, KYC, residence, product and approval before continuing to official registration.",
  },
};
function mxDecisionDisplaySchemas(pathname, title, locale) {
  const canonicalUrl = `${PUBLIC_ORIGIN}${pathname}`;
  return [
    pageSchema(title, canonicalUrl, locale),
    breadcrumbs(title, canonicalUrl, locale),
  ];
}
function mxDecisionSchemas(pathname, title, locale) {
  const canonicalUrl = `${PUBLIC_ORIGIN}${pathname}`;
  const config = MX_DECISION_SEO[pathname];
  return [
    pageSchema(title, canonicalUrl, locale),
    breadcrumbs(title, canonicalUrl, locale),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: schemaLocale(locale),
      mainEntity: config.faq.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer, citation: MX_DECISION_SOURCE_URLS.slice(0, 4) },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      url: canonicalUrl,
      inLanguage: schemaLocale(locale),
      dateModified: "2026-09-29",
      isBasedOn: MX_DECISION_SOURCE_URLS,
      relatedLink: MX_DECISION_LINKS[pathname].map((link) => `${PUBLIC_ORIGIN}${link}`),
      about: [
        { "@type": "Thing", name: "MXN and SPEI account checks" },
        { "@type": "Thing", name: "Mexico crypto platform comparison" },
        { "@type": "Thing", name: "Referral and account eligibility boundary" },
      ],
    },
  ];
}
const REGIONAL_PREVIEW_SEO_LOCALIZED = {
  MX: {
    en: ["Mexico: compare MXN, SPEI and identity before opening an account — NexuAlpha", "A Mexico-specific research path that separates SPEI, bank-account ownership, identity checks, product scope and official account conditions before registration."],
    es: ["Investigación cripto en México: MXN y SPEI — NexuAlpha", "Analiza MXN, SPEI, identidad y condiciones regionales de la cuenta."],
    ja: ["メキシコの暗号資産調査：MXN・SPEI — NexuAlpha", "MXN、SPEI、本人確認、地域ごとのアカウント条件を確認します。"],
    ko: ["멕시코 암호화폐 조사: MXN·SPEI — NexuAlpha", "MXN, SPEI, 본인확인 및 지역별 계정 조건을 확인합니다."],
    tr: ["Meksika kripto araştırması: MXN ve SPEI — NexuAlpha", "MXN, SPEI, kimlik doğrulama ve bölgesel hesap koşullarını inceler."],
    fr: ["Recherche crypto au Mexique : MXN et SPEI — NexuAlpha", "Vérifiez MXN, SPEI, l’identité et les conditions de compte régionales."],
    de: ["Krypto-Recherche Mexiko: MXN und SPEI — NexuAlpha", "Prüfen Sie MXN, SPEI, Identität und regionale Kontobedingungen."],
    "pt-BR": ["Pesquisa cripto no México: MXN e SPEI — NexuAlpha", "Verifique MXN, SPEI, identidade e condições regionais da conta."],
  },
  TW: {
    "zh-Hant": ["台灣加密貨幣平台核對：金管會、VASP 登記與新台幣入金 — NexuAlpha", "以繁體中文核對金管會法規的公布與施行狀態、洗錢防制或 VASP 登記邊界、本人銀行帳戶、新台幣入出金、身分驗證、費用限額與商品範圍。"],
    ja: ["台湾の暗号資産調査：TWD入金条件 — NexuAlpha", "台湾ドル入金、銀行確認、本人確認、商品範囲を確認します。"],
    ko: ["대만 암호화폐 조사: TWD 입금 조건 — NexuAlpha", "TWD 입금, 은행 확인, 본인확인 및 상품 범위를 확인합니다."],
    tr: ["Tayvan kripto araştırması: TWD fonlama koşulları — NexuAlpha", "TWD fonlama, banka doğrulaması, kimlik ve ürün kapsamını inceler."],
    fr: ["Recherche crypto à Taïwan : conditions TWD — NexuAlpha", "Vérifiez les dépôts TWD, la banque, l’identité et les produits."],
    de: ["Krypto-Recherche Taiwan: TWD-Einzahlungsbedingungen — NexuAlpha", "Prüfen Sie TWD-Einzahlungen, Bankprüfung, Identität und Produkte."],
    "pt-BR": ["Pesquisa cripto em Taiwan: condições de depósito em TWD — NexuAlpha", "Verifique depósitos em TWD, banco, identidade e produtos."],
    es: ["Investigación cripto en Taiwán: depósitos TWD — NexuAlpha", "Analiza depósitos TWD, verificación bancaria, identidad y productos."],
  },
  HK: { "zh-Hans": ["香港加密平台账户资格研究 — NexuAlpha", "整理港币入金、身份核验与平台产品适用范围的研究路径。"],
    ar: ["بحث شروط حسابات منصات العملات الرقمية في هونغ كونغ — NexuAlpha", "تحقق من إيداعات HKD والهوية وإتاحة المنتجات حسب المنصة."], ru: ["Исследование условий криптоаккаунтов в Гонконге — NexuAlpha", "Проверьте пополнение в HKD, личность и доступ к продуктам."], "pt-BR": ["Pesquisa de contas cripto em Hong Kong — NexuAlpha", "Verifique depósitos em HKD, identidade e acesso a produtos por plataforma."], vi: ["Nghiên cứu điều kiện tài khoản crypto tại Hong Kong — NexuAlpha", "Kiểm tra nạp HKD, danh tính và quyền dùng sản phẩm theo nền tảng."], it: ["Ricerca sui conti crypto a Hong Kong — NexuAlpha", "Verifica depositi HKD, identità e accesso ai prodotti per piattaforma."], id: ["Riset ketentuan akun kripto Hong Kong — NexuAlpha", "Periksa deposit HKD, identitas, dan akses produk menurut platform."],
    "zh-Hant": ["香港加密平台帳戶核對：SFC、HKD、eDDA 與產品範圍 — NexuAlpha", "以繁體中文核對 SFC 平台狀態、HKD 銀行轉帳、eDDA、身分與地址證明、本人銀行帳戶、費用 hold、鏈上轉帳與產品範圍；結果以官方帳戶流程為準。"],
    ja: ["香港の暗号資産口座条件調査 — NexuAlpha", "香港ドル入金、本人確認、プラットフォームごとの商品利用条件を確認します。"],
    ko: ["홍콩 암호화폐 계정 조건 조사 — NexuAlpha", "홍콩달러 입금, 본인확인 및 플랫폼별 상품 이용 조건을 확인합니다."],
    tr: ["Hong Kong kripto hesap koşulları araştırması — NexuAlpha", "HKD fonlama, kimlik kontrolleri ve platforma göre ürün erişimini inceler."],
    es: ["Investigación de cuentas cripto en Hong Kong — NexuAlpha", "Analiza depósitos en HKD, identidad y acceso a productos según la plataforma."],
    fr: ["Étude des comptes crypto à Hong Kong — NexuAlpha", "Analyse des dépôts en HKD, de l’identité et de l’accès aux produits."],
    de: ["Krypto-Kontobedingungen in Hongkong — NexuAlpha", "Recherche zu HKD-Einzahlungen, Identität und plattformabhängigem Produktzugang."],
  },
  EU: { "zh-Hans": ["欧盟加密平台账户条件研究 — NexuAlpha", "整理欧元、SEPA 和各国账户条件的研究路径。"], "zh-Hant": ["歐盟加密平台帳戶條件研究 — NexuAlpha", "整理歐元、SEPA 與各國帳戶條件的研究路徑。"],
    ar: ["بحث شروط منصات العملات الرقمية في الاتحاد الأوروبي — NexuAlpha", "تحقق من EUR وSEPA وشروط الحساب حسب الدولة."], ru: ["Исследование условий криптоплатформ в ЕС — NexuAlpha", "Проверьте EUR, SEPA и условия аккаунта по странам."], "pt-BR": ["Pesquisa de plataformas cripto na UE — NexuAlpha", "Verifique EUR, SEPA e condições de conta por país."], vi: ["Nghiên cứu nền tảng crypto tại EU — NexuAlpha", "Kiểm tra EUR, SEPA và điều kiện tài khoản theo quốc gia."], it: ["Ricerca sulle piattaforme crypto nell’UE — NexuAlpha", "Verifica EUR, SEPA e condizioni dell’account per paese."], id: ["Riset platform kripto di Uni Eropa — NexuAlpha", "Periksa EUR, SEPA, dan ketentuan akun menurut negara."],
    de: ["Krypto-Plattformen in der EU: Konto- und Länderbedingungen — NexuAlpha", "Recherche zu EUR, SEPA und länderspezifischen Bedingungen für Plattformkonten."],
    ja: ["EU暗号資産プラットフォームの口座条件調査 — NexuAlpha", "EUR、SEPA、国別の本人確認と口座条件を確認します。"],
    ko: ["EU 암호화폐 플랫폼 계정 조건 조사 — NexuAlpha", "EUR, SEPA 및 국가별 플랫폼 계정 조건을 확인합니다."],
    tr: ["AB kripto platformu hesap koşulları araştırması — NexuAlpha", "EUR, SEPA ve ülkeye göre platform hesap koşullarını inceler."],
    es: ["Investigación de plataformas cripto en la UE — NexuAlpha", "Analiza EUR, SEPA y las condiciones de cuenta específicas de cada país."],
    fr: ["Étude des plateformes crypto dans l’UE — NexuAlpha", "Recherche sur l’EUR, SEPA et les conditions de compte propres à chaque pays."],
  },
  UK: { "zh-Hans": ["英国加密账户条件研究 — NexuAlpha", "整理英镑入金、居住验证和平台产品范围。"], "zh-Hant": ["英國加密帳戶條件研究 — NexuAlpha", "整理英鎊入金、居住驗證與平台產品範圍。"],
    ar: ["بحث شروط الحسابات الرقمية في المملكة المتحدة — NexuAlpha", "تحقق من تمويل GBP والإقامة ونطاق المنتجات."], ru: ["Исследование условий криптоаккаунтов в Великобритании — NexuAlpha", "Проверьте пополнение в GBP, резидентство и доступность продуктов."], "pt-BR": ["Pesquisa de contas cripto no Reino Unido — NexuAlpha", "Verifique depósitos em GBP, residência e escopo dos produtos."], vi: ["Nghiên cứu điều kiện tài khoản crypto tại Vương quốc Anh — NexuAlpha", "Kiểm tra nạp GBP, cư trú và phạm vi sản phẩm."], it: ["Ricerca sui conti crypto nel Regno Unito — NexuAlpha", "Verifica depositi GBP, residenza e ambito dei prodotti."], id: ["Riset ketentuan akun kripto Inggris — NexuAlpha", "Periksa deposit GBP, domisili, dan cakupan produk."],
    ja: ["英国の暗号資産口座条件調査 — NexuAlpha", "GBP入金、居住確認、プラットフォームごとの商品範囲を確認します。"],
    ko: ["영국 암호화폐 계정 조건 조사 — NexuAlpha", "GBP 입금, 거주지 확인 및 플랫폼별 상품 범위를 확인합니다."],
    tr: ["Birleşik Krallık kripto hesap koşulları araştırması — NexuAlpha", "GBP fonlama, ikamet kontrolleri ve platform ürün kapsamını inceler."],
    es: ["Investigación de cuentas cripto en Reino Unido — NexuAlpha", "Analiza depósitos en GBP, residencia y alcance de productos."],
    fr: ["Étude des comptes crypto au Royaume-Uni — NexuAlpha", "Analyse des dépôts en GBP, de la résidence et du périmètre des produits."],
    de: ["Krypto-Kontobedingungen im Vereinigten Königreich — NexuAlpha", "Recherche zu GBP-Einzahlungen, Wohnsitzprüfung und Produktumfang."],
  },
  US: {
    en: ["United States crypto account checks: FinCEN, state licenses, USD rails — NexuAlpha", "Research-only U.S. checklist for FinCEN MSB context, NMLS or NYDFS state checks, USD funding rails, identity, residence, holds and spot product scope."],
  },
  ID: { id: ["Riset platform kripto Indonesia: OJK, Bappebti, IDR, VA dan QRIS — NexuAlpha", "Panduan Bahasa Indonesia untuk memeriksa konteks OJK/Bappebti, badan usaha, domain resmi, KYC, jalur IDR, VA bank, QRIS, biaya, batas dan cakupan produk sebelum membuka akun."] },
  SG: {
    en: ["Singapore crypto account checks: MAS DPT, SGD, PayNow and FAST — NexuAlpha", "Answer-first Singapore checklist: MAS DPT, SGD, PayNow and FAST are account-screen checks; market, product and locale carry through the directory, rates and compare pages."],
  },
  KR: {
    ko: ["한국 암호화폐 플랫폼 조사: 본인확인, 원화 입출금과 상품 범위 — NexuAlpha", "금융위원회와 금융정보분석원 공식 맥락, 본인확인, 실명확인 계좌, 원화 입출금과 상품 범위를 따로 확인하세요."],
  },
  TR: {
    tr: ["Türkiye kripto platformu araştırması: SPK, TRY ve hesap kapsamı — NexuAlpha", "SPK geçici listesi, tasfiye listesi, Paribu hesap doğrulaması ve TRY yatırma kaynaklarını ayrı ayrı kontrol edin."],
  },
};

function contentLocale(locale, pathname = "") {
  if (getBrazilPage(pathname)) return "pt-BR";
  // Traditional Chinese is a distinct published interface and must keep its
  // own canonical/hreflang URL; only the generic zh aliases collapse to the
  // Simplified Chinese content route.
  if (locale === "zh-Hant") return "zh-Hant";
  return UI_LOCALES.has(locale) ? (String(locale).startsWith("zh") ? "zh-Hans" : locale) : "en";
}
function canonical(pathname, locale) {
  const resolved = contentLocale(locale, pathname);
  return `${PUBLIC_ORIGIN}${localizedPath(pathname, resolved)}`;
}
function localized(value, locale) { return typeof value === "string" ? value : value?.[contentLocale(locale)] || value?.en || ""; }
function aliases(pathname) {
  return ({ "/index.html": "/", "/partners/embed-guide": "/partners" })[pathname] || pathname;
}
function schemaLocale(locale) {
  if (locale === "zh-Hant") return "zh-Hant";
  return UI_LOCALES.has(locale) ? locale : contentLocale(locale);
}
function pageSchema(name, url, locale, type = "WebPage") {
  return { "@context": "https://schema.org", "@type": type, name, url, inLanguage: schemaLocale(locale), ...(type === "Dataset" ? { license: NEXUALPHA_DATA_LICENSE_URL } : {}) };
}
function breadcrumbs(name, url, locale) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "NexuAlpha", item: canonical("/", locale) },
    { "@type": "ListItem", position: 2, name: "Exchanges", item: canonical("/exchanges", locale) },
    { "@type": "ListItem", position: 3, name, item: url },
  ] };
}
function rootBreadcrumb(name, url, locale) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "NexuAlpha", item: canonical("/", locale) },
    { "@type": "ListItem", position: 2, name, item: url },
  ] };
}
function sectionBreadcrumb(sectionName, sectionPath, name, url, locale) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "NexuAlpha", item: canonical("/", locale) },
    { "@type": "ListItem", position: 2, name: sectionName, item: canonical(sectionPath, locale) },
    { "@type": "ListItem", position: 3, name, item: url },
  ] };
}
function collectionHubSchemas(kind, locale, canonicalUrl) {
  const copy = collectionHubCopy(kind, locale);
  const items = kind === "factbook" ? factbookHubItems() : topicHubItems(locale);
  const path = kind === "factbook" ? "/factbook" : "/topics";
  return [
    rootBreadcrumb(copy.title, canonicalUrl, locale),
    {
      ...pageSchema(copy.title, canonicalUrl, locale, "CollectionPage"),
      description: copy.description,
      dateModified: kind === "factbook" ? FACTBOOK_SOURCE_REVIEW_DATE : TOPIC_SOURCE_REVIEW_DATE,
      ...researchAttribution([]),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: copy.itemLabel,
      url: canonical(path, locale),
      inLanguage: schemaLocale(locale),
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.title,
        url: canonical(item.href, locale),
      })),
    },
  ];
}
function routeQuestion(question, answer, citations = []) {
  return {
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
      ...(citations.length ? { citation: citations } : {}),
    },
  };
}
function venueProfileFaq(venue, locale) {
  const name = venue.name;
  const official = `https://${venue.officialDomain}`;
  const copy = locale === "zh-Hans"
    ? [[`${name} 的最终手续费和账户条件在哪里确认？`, `应在 ${name} 官方账户流程中确认最终手续费、身份验证、地区可用性、产品和账户条件。NexuAlpha 页面只整理公开资料。`], [`NexuAlpha 是否保证 ${name} 的优惠或邀请权益？`, `不保证。优惠、邀请权益和账户条件会随地区、账户、产品和官方当前条款变化，必须以官方页面为准。`]]
    : [[`Where should ${name} fees and account terms be confirmed?`, `Confirm final fees, identity checks, regional availability, products and account terms in the ${name} official account flow. NexuAlpha only organizes published sources.`], [`Does NexuAlpha guarantee a ${name} benefit or referral entitlement?`, `No. Benefits, referral terms and account conditions can vary by region, account, product and current official terms. Verify them on the official platform.`]];
  return { "@context": "https://schema.org", "@type": "FAQPage", inLanguage: schemaLocale(locale), mainEntity: copy.map(([question, answer]) => routeQuestion(question, answer, [official])) };
}
function ratesRouteSchemas(title, description, canonicalUrl, locale) {
  const feeSources = neutralVenueCatalog
    .filter((venue) => venue.officialDomain)
    .slice(0, 12)
    .map((venue) => `https://${venue.officialDomain}`);
  const venueItems = neutralVenueCatalog.slice(0, 12).map((venue, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: `${venue.name} ${venue.category}`,
    url: `${PUBLIC_ORIGIN}${localizedPath(`/exchanges/${venue.slug}`, locale)}`,
  }));
  return [
    rootBreadcrumb("Fee Benchmark Terminal", canonicalUrl, locale),
    {
      ...pageSchema(title, canonicalUrl, locale),
      description,
      dateModified: "2026-09-21",
      ...researchAttribution(feeSources),
      about: [
        { "@type": "Thing", name: "Published maker and taker fee benchmarks" },
        { "@type": "Thing", name: "CEX, DEX and Perp DEX fee comparison" },
        { "@type": "Thing", name: "Account-specific terms require official verification" },
      ],
      mainEntity: {
        "@type": "ItemList",
        name: "Platforms covered by the published-fee benchmark",
        itemListElement: venueItems,
      },
      relatedLink: [
        `${PUBLIC_ORIGIN}${localizedPath("/exchanges", locale)}`,
        `${PUBLIC_ORIGIN}${localizedPath("/compare/binance-vs-okx", locale)}`,
        `${PUBLIC_ORIGIN}${localizedPath("/compare/bybit-vs-bitget", locale)}`,
        `${PUBLIC_ORIGIN}${localizedPath("/telegram", locale)}`,
      ],
      isBasedOn: feeSources,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Rates route decision steps",
      inLanguage: schemaLocale(locale),
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Compare published base fees by venue category" },
        { "@type": "ListItem", position: 2, name: "Estimate scenario cost before registration" },
        { "@type": "ListItem", position: 3, name: "Confirm final account terms in the official platform flow" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: schemaLocale(locale),
      mainEntity: [
        routeQuestion("Does the NexuAlpha rates page publish live account fees?", "No. It compares published base fee references and scenario assumptions. Final maker, taker, VIP, funding, withdrawal, spread and user-benefit terms must be verified inside the official account flow.", feeSources.slice(0, 4)),
        routeQuestion("What should a trader check after the fee benchmark?", "Use the benchmark to shortlist platforms, then compare product fit, KYC, regional access, funding rail, withdrawal network and official-domain route before opening or using an account."),
        routeQuestion("Does a public fee comparison prove a fixed user benefit?", "No. User benefits, net rates and campaign eligibility can vary by platform, country, account, product and current official terms."),
      ],
    },
  ];
}
function telegramRouteSchemas(title, description, canonicalUrl, locale) {
  return [
    rootBreadcrumb("Telegram Research Hub", canonicalUrl, locale),
    {
      ...pageSchema(title, canonicalUrl, locale),
      description,
      dateModified: "2026-09-21",
      about: [
        { "@type": "Thing", name: "Telegram research bot" },
        { "@type": "Thing", name: "Source-review command deck" },
        { "@type": "Thing", name: "NexuAlpha-first Telegram return paths" },
      ],
      relatedLink: [
        "https://t.me/NexuAlphaAssistantBot",
        "https://t.me/NexuAlphaClub",
        "https://t.me/NexuAlphaWorld",
        `${PUBLIC_ORIGIN}${localizedPath("/rates", locale)}`,
        `${PUBLIC_ORIGIN}${localizedPath("/exchanges", locale)}`,
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Telegram research handoff destinations",
      inLanguage: schemaLocale(locale),
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Assistant Bot", url: "https://t.me/NexuAlphaAssistantBot" },
        { "@type": "ListItem", position: 2, name: "Official Research Channel", url: "https://t.me/NexuAlphaClub" },
        { "@type": "ListItem", position: 3, name: "Trader Community", url: "https://t.me/NexuAlphaWorld" },
        { "@type": "ListItem", position: 4, name: "Onsite Fee Scenario Tool", url: `${PUBLIC_ORIGIN}${localizedPath("/rates", locale)}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: schemaLocale(locale),
      mainEntity: [
        routeQuestion("What does the NexuAlpha Telegram hub do?", "It gives users a follow-up path for platform comparisons, fee scenarios, official-source checks and return visits after they have an onsite NexuAlpha answer path."),
        routeQuestion("Does the Telegram hub send raw exchange registration links?", "No. Telegram operations use NexuAlpha-first landing pages and manual review. The hub does not publish raw signup links, invite codes, account outcomes or private commission terms."),
        routeQuestion("Are Telegram reminders live trading or reward guarantees?", "No. Reminders depend on connected and checked research inputs. Missing feeds stay labelled unavailable, and account terms must be verified on official platforms."),
      ],
    },
  ];
}
function tokenizedSeoOverrideFor(page, locale) {
  return TOKENIZED_ASSET_SEO_OVERRIDES[page.slug]?.[locale] || TOKENIZED_ASSET_SEO_OVERRIDES[page.slug]?.en || null;
}

function tokenizedAssetSchemas(page, locale, canonicalUrl, seoOverride = null) {
  const resolvedLocale = tokenizedAssetLocale(locale);
  const sources = tokenizedAssetSources(page);
  const sourceUrls = sources.map((source) => source.url);
  const overrideFaqs = resolvedLocale === "en" && seoOverride?.directAnswer
    ? [
        { q: { en: seoOverride.directAnswer.question }, a: { en: seoOverride.directAnswer.answer } },
        ...(Array.isArray(seoOverride?.faq)
          ? seoOverride.faq.map(([question, answer]) => ({ q: { en: question }, a: { en: answer } }))
          : []),
      ]
    : [];
  const extraFaqs = resolvedLocale === "en" && Array.isArray(seoOverride?.extraFaq)
    ? seoOverride.extraFaq.map(([question, answer]) => ({ q: { en: question }, a: { en: answer } }))
    : [];
  const faqEntries = [...overrideFaqs, ...(page.faqs || []), ...extraFaqs].map((entry) => ({
    question: tokenizedAssetLocalized(entry.q, resolvedLocale),
    answer: tokenizedAssetLocalized(entry.a, resolvedLocale),
  }));
  const relatedLinks = seoOverride?.relatedLinks || page.relatedLinks || [];
  const tokenizedTreasuryAsset = page.slug === "tokenized-treasuries" ? wave48TokenizedTreasuryRightsOpsDatasetSchema() : null;
  const tokenizedTreasuryAssetParts = tokenizedTreasuryAsset
    ? [
        tokenizedTreasuryAsset,
      ]
    : [];
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "NexuAlpha", item: canonical("/", resolvedLocale) },
        { "@type": "ListItem", position: 2, name: resolvedLocale === "zh-Hans" ? "主题研究" : "Topic Research", item: canonical("/topics", resolvedLocale) },
        { "@type": "ListItem", position: 3, name: tokenizedAssetLocalized(page.title, resolvedLocale), item: canonicalUrl },
      ],
    },
    {
      ...pageSchema(tokenizedAssetLocalized(page.title, resolvedLocale), canonicalUrl, resolvedLocale, "CollectionPage"),
      description: tokenizedAssetLocalized(page.description, resolvedLocale),
      dateModified: TOKENIZED_ASSET_CLUSTER_REVIEW_DATE,
      ...researchAttribution(sourceUrls),
      ...(tokenizedTreasuryAsset ? { hasPart: [...researchAttribution(sourceUrls).hasPart, ...tokenizedTreasuryAssetParts] } : {}),
      about: (page.decisionRows || []).map((row) => ({ "@type": "Thing", name: tokenizedAssetLocalized(row.label, resolvedLocale) })),
      ...(tokenizedTreasuryAsset ? { subjectOf: tokenizedTreasuryAsset } : {}),
      isBasedOn: sourceUrls,
      mainEntity: { '@type': 'ItemList', itemListElement: (page.decisionRows || []).map((row, index) => ({
        '@type': 'ListItem', position: index + 1,
        name: tokenizedAssetLocalized(row.label, resolvedLocale), description: tokenizedAssetLocalized(row.verify, resolvedLocale),
        url: row.route ? publicRelatedUrl(row.route, resolvedLocale) : canonicalUrl,
      })) },
      relatedLink: relatedLinks.map((link) => publicRelatedUrl(link, resolvedLocale)),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: schemaLocale(resolvedLocale),
      mainEntity: faqEntries.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
          ...(sourceUrls.length ? { citation: sourceUrls.slice(0, 4) } : {}),
        },
      })),
    },
  ];
}
function venueDirectAnswerSchema(venue, override, locale) {
  if (!override?.directAnswer) return null;
  const entries = [override.directAnswer, ...(override.faq || []).map((entry) => {
    if (!Array.isArray(entry)) return entry;
    const [question, answer, citations] = entry;
    return { question, answer, citations };
  })];
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: schemaLocale(locale),
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
        ...((entry.citations?.length || override.sourceUrls?.length) ? { citation: entry.citations?.length ? entry.citations : override.sourceUrls.slice(0, 4) } : {}),
      },
    })),
    about: { "@type": "Organization", name: venue.name, url: `https://${venue.officialDomain}` },
  };
}
export function factbookRelatedLinks(slug) {
  const pairRoutes = {
    binance: ["/compare/binance-vs-okx", "/news/crypto-exchange-fee-disclosure-audit"],
    okx: ["/compare/binance-vs-okx", "/news/okx-usd-to-usdc-spot-pair-migration", "/news/crypto-exchange-fee-disclosure-audit"],
    bybit: ["/compare/bybit-vs-bitget", "/topics/tokenized-stocks-vs-perpetuals", "/news/crypto-exchange-fee-disclosure-audit"],
    bitget: ["/compare/bybit-vs-bitget", "/topics/tokenized-stocks-vs-perpetuals", "/news/crypto-exchange-fee-disclosure-audit"],
    hyperliquid: ["/compare/hyperliquid-vs-dydx", "/topics/derivatives#perp-cost-field-dictionary", "/topics/derivatives", "/news/hyperliquid-vs-dydx"],
    uniswap: ["/exchanges/uniswap", "/compare/uniswap-vs-jupiter", "/news/uniswap-v3-vs-pancakeswap-v3-concentrated-liquidity-controls", "/topics/no-kyc"],
  };
  return [`/exchanges/${slug}`, ...(pairRoutes[slug] || []), "/methodology"];
}
export function buildFactbookSchemas(venue, locale = "en", canonicalUrl = canonical(`/factbook/${venue.slug}`, locale)) {
  return [sectionBreadcrumb("Factbook", "/factbook", venue.name, canonicalUrl, locale), {
    ...pageSchema(`${venue.name} Platform Factbook`, canonicalUrl, locale, "Dataset"),
    "@id": `${canonicalUrl}#dataset`,
    description: "Platform fee, custody and access reference. Consult the page for source dates, assumptions and limitations.",
    // Latest real review date of the data on the page (fees checked / benefit terms confirmed / dossier compiled).
    dateModified: factbookDates(venue.slug).latestReviewOn,
    ...researchAttribution([`https://${venue.officialDomain}`]),
    creator: { "@type": "Organization", name: "NexuAlpha", url: `${PUBLIC_ORIGIN}/` },
    about: { "@type": "Organization", name: venue.name, url: `https://${venue.officialDomain}` },
    isBasedOn: `https://${venue.officialDomain}`,
    relatedLink: factbookRelatedLinks(venue.slug).map((link) => `${PUBLIC_ORIGIN}${localizedPath(link, locale)}`),
    variableMeasured: ["Spot Maker Fee", "Spot Taker Fee", "Futures Maker Fee", "Futures Taker Fee", "KYC Requirements"],
  }];
}

// Same title budget as the Worker head (meta-description.js budgetTitle).
export function computeRouteSeo(options = {}) {
  const legalUrl = new URL(options.url || options.pathname || "/", PUBLIC_ORIGIN);
  const legalRoute = parsePublicRoute(legalUrl.pathname, legalUrl.searchParams);
  if (isLegalPagePath(legalRoute.contentPathname)) return legalPageSeo(legalRoute.contentPathname, options.locale || legalRoute.locale || "en");
  const seo = computeRouteSeoUnbudgeted(options);
  if (!seo) return seo;
  const title = typeof seo.title === "string" ? budgetTitle(seo.title, titleBudgetForLocale(seo.locale)) : seo.title;
  const description = typeof seo.description === "string" ? routeMetaDescription(title, seo.description, seo.locale) : seo.description;
  return { ...seo, title, description };
}

function computeRouteSeoUnbudgeted(options = {}) {
  const url = new URL(options.url || options.pathname || (typeof window !== "undefined" ? window.location.href : "/"), PUBLIC_ORIGIN);
  const publicRoute = parsePublicRoute(url.pathname, url.searchParams);
  const contentPathname = publicRoute.contentPathname;
  const brazil = getBrazilSeo(contentPathname);
  if (brazil && options.route?.name !== "notFound") return brazil;
  const rawLocale = options.locale || (publicRoute.localeSource === "path" ? publicRoute.locale : url.searchParams.get("locale")) || "en";
  const locale = contentLocale(rawLocale, contentPathname);
  const isZh = locale === "zh-Hans";
  let pathname = aliases(contentPathname);
  const route = options.route || {};
  const ref = url.searchParams.get("ref") || (route.name === "kolLanding" ? route.kol : null);
  let title = isZh ? "页面不存在 — NexuAlpha" : "Page Not Found — NexuAlpha";
  let description = isZh ? "请求的页面不存在或未发布。" : "The requested page does not exist or is not published.";
  let status = 404;
  let robots = "noindex,nofollow";
  let newsCanonicalOverride = null; // T10: canonical URL of the stronger article for a canonicalized duplicate
  let schemas = [];
  let ogType = "website";
  const accept = () => { status = 200; robots = "index,follow"; };
  const venueMatch = pathname.match(/^\/(exchanges|factbook)\/([a-z0-9-]+)$/);
  const compareMatch = pathname.match(/^\/compare\/([a-z0-9-]+(?:-vs-[a-z0-9-]+){1,2})$/);
  const topicMatch = pathname.match(/^\/topics\/([a-z0-9-]+)$/);
  const researchMatch = pathname.match(/^\/activities\/research\/([a-z0-9-]+)$/);
  const newsMatch = pathname.match(/^\/news\/([a-z0-9-]+)$/);
  const brazilPage = getBrazilPage(pathname);

  if (route.name === "notFound") {
    // A component-level 404 must never receive homepage metadata.
  } else if (ref || /^\/ref\/[a-z0-9-]+$/.test(pathname)) {
    if (ref && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(ref)) pathname = `/ref/${ref}`;
    accept(); robots = "noindex,follow";
    title = "NexuAlpha Partner Page";
    description = "Platform choices for this partner entry.";
  } else if (brazilPage) {
    const brazilSeo = getBrazilSeo(pathname);
    if (brazilSeo) {
      accept();
      title = brazilSeo.title;
      description = brazilSeo.description;
      schemas = brazilSeo.schemas;
    }
  } else if (parseAppDownloadPath(pathname)?.valid) {
    const app = appDownloadRouteSeo(pathname, locale, { urlFor: (path) => canonical(path, locale) });
    accept();
    title = app.title; description = app.description; schemas = app.schemas;
  } else if (parseAcademyPath(pathname) && parseAcademyPath(pathname).kind !== "missing") {
    // NexuAlpha Academy: same helper as the Worker head (src/data/academy-seo.js).
    const academy = academyRouteSeo(pathname, locale, { urlFor: (path) => canonical(path, locale) });
    accept();
    title = academy.title;
    description = academy.description;
    schemas = academy.schemas;
    ogType = pathname === "/academy" ? "website" : "video.other";
    if (!academy.indexable) robots = "noindex,follow";
  } else if (parseCoinsPath(pathname) && coinsRouteSeo(pathname, locale, { urlFor: (path) => canonical(path, locale) })?.status === 200) {
    // Where to buy <coin>: same helper as the Worker head (src/data/coins-seo.js).
    const coins = coinsRouteSeo(pathname, locale, { urlFor: (path) => canonical(path, locale) });
    accept();
    title = coins.title;
    description = coins.description;
    schemas = coins.schemas;
    ogType = "website";
    if (!coins.indexable) robots = "noindex,follow";
  } else if (parseConverterPath(pathname) && converterRouteSeo(pathname, locale, { urlFor: (path) => canonical(path, locale) })?.status === 200) {
    const converter = converterRouteSeo(pathname, locale, { urlFor: (path) => canonical(path, locale) });
    accept();
    title = converter.title;
    description = converter.description;
    schemas = converter.schemas;
    ogType = "website";
    if (!converter.indexable) robots = "noindex,follow";
  } else if (parseGlossaryPath(pathname) && glossaryRouteSeo(pathname, locale, { urlFor: (path) => canonical(path, locale) })?.status === 200) {
    // Crypto glossary: same helper as the Worker head (src/data/glossary-seo.js).
    const glossary = glossaryRouteSeo(pathname, locale, { urlFor: (path) => canonical(path, locale) });
    accept();
    title = glossary.title;
    description = glossary.description;
    schemas = glossary.schemas;
    ogType = pathname === "/glossary" ? "website" : "article";
    if (!glossary.indexable) robots = "noindex,follow";
  } else if (parseBinanceOctoberPath(pathname)) {
    // Binance October campaigns page: same helper as the Worker head (src/data/binance-october-seo.js).
    const campaign = binanceOctoberRouteSeo(pathname, locale, { urlFor: (path) => canonical(path, locale), market: url.searchParams.get("market") || undefined });
    accept();
    title = campaign.title;
    description = campaign.description;
    schemas = campaign.schemas;
    if (!campaign.indexable) robots = "noindex,follow";
  } else if (parseBybitStocksPath(pathname)) {
    // Bybit Stocks campaign page: same helper as the Worker head (src/data/bybit-stocks-seo.js).
    const campaign = bybitStocksRouteSeo(pathname, locale, { urlFor: (path) => canonical(path, locale), market: url.searchParams.get("market") || undefined });
    accept();
    title = campaign.title;
    description = campaign.description;
    schemas = campaign.schemas;
    if (!campaign.indexable) robots = "noindex,follow";
  } else if (route.name === "telegram" || pathname === "/telegram") {
    accept();
    const telegramSeo = {
      "zh-Hans": ["Telegram 研究机器人与平台情报中心 — NexuAlpha", "在 Telegram 中继续平台比较、费率研究、官方来源核对和回访路径。"],
      "zh-Hant": ["Telegram 研究機器人與平台情報中心 — NexuAlpha", "在 Telegram 中繼續平台比較、費率研究、官方來源核對與回訪路徑。"],
      ja: ["Telegram 調査ボットとプラットフォーム情報センター — NexuAlpha", "Telegramでプラットフォーム比較、手数料調査、公式ソース確認を続けます。"],
      ko: ["Telegram 리서치 봇 및 플랫폼 정보 센터 — NexuAlpha", "Telegram에서 플랫폼 비교, 수수료 조사와 공식 출처 확인을 이어갑니다."],
      tr: ["Telegram araştırma botu ve platform bilgi merkezi — NexuAlpha", "Telegram'da platform karşılaştırması, ücret araştırması ve resmi kaynak kontrolüne devam edin."],

      // l10n: needs native review
      ur: ["Telegram تحقیقی بوٹ اور پلیٹ فارم معلوماتی مرکز — NexuAlpha", "Telegram میں پلیٹ فارم موازنہ، فیس تحقیق، سرکاری ماخذ کی جانچ اور واپسی کے راستے جاری رکھیں۔"],

      // l10n: needs native review
      uk: ["Telegram-бот для досліджень і центр даних про платформи — NexuAlpha", "Продовжуйте в Telegram порівняння платформ, дослідження комісій, перевірки офіційних джерел і маршрути повернення."],
    }[locale] || ["Telegram Research Bot & Platform Intelligence Hub — NexuAlpha", "Continue platform comparisons, fee research, official-source checks and return paths in Telegram."];
    [title, description] = telegramSeo;
    schemas = telegramRouteSchemas(title, description, canonical(pathname, locale), locale);
  } else if (route.name === "regionalPreview" && REGIONAL_PREVIEW_SEO[route.market]) {
    accept();
    robots = regionalPreviewIsIndexable(route.market, locale) ? "index,follow" : "noindex,follow";
    [title, description] = REGIONAL_PREVIEW_SEO_LOCALIZED[route.market]?.[locale]
      || REGIONAL_PREVIEW_SEO[route.market];
    const faqEntries = regionalPreviewFaqEntries(route.market, locale);
    const sourceUrls = REGIONAL_PREVIEW_SOURCE_URLS[route.market] || [];
    const relatedLinks = REGIONAL_PREVIEW_RELATED_LINKS[route.market] || ["/methodology", "/exchanges"];
    const regionalCanonical = regionalPreviewCanonicalUrl(pathname, route.market, locale);
    schemas = [breadcrumbs(title, regionalCanonical, locale), {
      ...pageSchema(title, regionalCanonical, locale),
      dateModified: "2026-09-15",
      ...researchAttribution(sourceUrls),
      isBasedOn: sourceUrls,
      relatedLink: relatedLinks.map((link) => `${PUBLIC_ORIGIN}${link}`),
    }].concat(faqEntries.length ? [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: schemaLocale(locale),
      mainEntity: faqEntries.map((entry) => ({ "@type": "Question", name: entry.question, acceptedAnswer: { "@type": "Answer", text: entry.answer, ...(sourceUrls.length ? { citation: sourceUrls.slice(0, 4) } : {}) } })),
    }] : []);
  } else if (/^\/(mx|tw|hk)\/(comparar|costos|conta)$/.test(pathname)) {
    // Regional decision pages are research-only until dated eligibility
    // evidence exists. They remain crawlable for discovery but must not enter
    // the index or hreflang graph prematurely.
    robots = "noindex,follow";
    const mx = pathname.startsWith("/mx/");
    const tw = pathname.startsWith("/tw/");
    const hk = pathname.startsWith("/hk/");
    const regionalCopy = mx
      ? (locale === "en" && MX_DECISION_SEO_EN[pathname]
          ? [MX_DECISION_SEO_EN[pathname].title, MX_DECISION_SEO_EN[pathname].description]
          : [MX_DECISION_SEO[pathname].title, MX_DECISION_SEO[pathname].description])
      : hk
      ? {
          "/hk/comparar": ["Hong Kong crypto platform comparison: funding, identity and product scope — NexuAlpha", "Compare Hong Kong funding routes, identity checks, residence eligibility and product scope before the official account flow."],
          "/hk/costos": ["Hong Kong crypto trading costs and fee references — NexuAlpha", "Compare published fee assumptions for Hong Kong users; final account terms must be checked on the official platform."],
          "/hk/conta": ["Hong Kong crypto platforms and account conditions — NexuAlpha", "Review residence, identity, funding and product conditions before continuing to the official platform."],
        }[pathname]
      : tw
      ? {
          "/tw/comparar": ["台灣交易平台比較：新台幣、銀行驗證與帳戶條件 — NexuAlpha", "比較台灣用戶在新台幣、銀行驗證、身份條件與產品適用性上的研究路徑。"],
          "/tw/costos": ["台灣加密貨幣交易成本比較 — NexuAlpha", "用公開費率假設比較交易成本；最終條件以你的官方帳戶為準。"],
          "/tw/conta": ["台灣可用交易平台與開戶條件 — NexuAlpha", "核對居住地、身份驗證、入金方式與產品範圍，再前往官方流程。"],
        }[pathname]
      : null;
    if (regionalCopy) {
      accept();
      [title, description] = regionalCopy;
      if (mx) {
        // These routes still reuse the generic comparison, rates and directory
        // bodies. Keep their richer metadata crawlable, but do not publish them
        // until the visible page body is independently market-owned.
        robots = "noindex,follow";
        schemas = locale === "en" ? mxDecisionDisplaySchemas(pathname, title, locale) : mxDecisionSchemas(pathname, title, locale);
      } else {
      const twFaq = hk ? {
        "/hk/comparar": [["What should Hong Kong users check before comparing platforms?", "Check the funding route, identity requirements, residence eligibility and product scope in the official account flow."], ["Are platform conditions identical in Hong Kong?", "No. Service entity, account level, funding method and product availability can differ by platform and account."]],
        "/hk/costos": [["Does a published fee comparison replace official account fees?", "No. It is a research scenario; confirm final fees in the official account before trading."]],
        "/hk/conta": [["What should Hong Kong users verify before signup?", "Verify the official domain, residence, identity documents, funding route and intended product."]],
      }[pathname] || [] : {
        "/tw/comparar": [["台灣用戶比較交易平台時要先確認什麼？", "先確認新台幣或銀行入金方式、身份驗證、居住地與產品適用性，最後再以官方帳戶流程核對。"], ["不同平台在台灣的條件會完全一樣嗎？", "不一定。服務主體、帳戶層級、入金方式與產品範圍可能不同，不能只看全球頁面的通用說明。"]],
        "/tw/costos": [["費用比較可以取代官方費率嗎？", "不可以。頁面只整理公開費率假設，實際費用仍需在你的官方帳戶中確認。"]],
        "/tw/conta": [["台灣用戶註冊前應檢查哪些條件？", "請檢查官方網域、居住地、身份文件、入金方式與需要的產品是否適用。"]],
      }[pathname] || [];
      schemas = [pageSchema(title, canonical(pathname, locale), locale), breadcrumbs(title, canonical(pathname, locale), locale), { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: twFaq.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }];
      robots = "noindex,follow";
      }
    }
  } else if (/^\/mx\/(comparar|costos|conta)$/.test(pathname)) {
    robots = "noindex,follow";
    accept();
    robots = "noindex,follow";
    const mxCopy = {
      "/mx/comparar": ["Comparar exchanges en México: MXN, SPEI y condiciones de cuenta — NexuAlpha", "Compara Binance y OKX para México con foco en MXN, SPEI, identidad y condiciones de cuenta. Verifica siempre el flujo oficial."],
      "/mx/costos": ["Costos de trading cripto en México: calculadora y referencias — NexuAlpha", "Consulta escenarios de comisiones publicados para comparar plataformas desde México. Las condiciones finales dependen de tu cuenta y del flujo oficial."],
      "/mx/conta": ["Exchanges disponibles para México: directorio y condiciones — NexuAlpha", "Explora plataformas cripto y sus rutas oficiales para México. Revisa residencia, identidad, producto y método de fondeo antes de registrarte."],
    }[pathname];
    [title, description] = mxCopy;
    const mxFaq = {
      "/mx/comparar": [
        ["¿Qué debe comprobar un usuario mexicano antes de abrir una cuenta?", "Compara MXN o SPEI, requisitos de identidad, producto disponible y condiciones de tu residencia en el flujo oficial."],
        ["¿Binance y OKX tienen las mismas condiciones en México?", "No necesariamente. La disponibilidad, los métodos de depósito y los productos pueden variar por cuenta y residencia."],
      ],
      "/mx/costos": [
        ["¿La estimación de costes sustituye la tarifa oficial?", "No. Es una comparación de escenarios basada en términos publicados; la tarifa final debe verificarse en la cuenta oficial."],
      ],
      "/mx/conta": [
        ["¿Qué debo revisar antes de registrarme desde México?", "Confirma el dominio oficial, residencia aceptada, identidad, método de fondeo y producto que realmente necesitas."],
      ],
    }[pathname];
    schemas = [pageSchema(title, canonical(pathname, locale), locale), breadcrumbs(title, canonical(pathname, locale), locale), {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: mxFaq.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
    }];
  } else if (pathname === "/funding-rates/matrix") {
    accept();
    const matrix = fundingMatrixSeo(locale);
    title = matrix.title; description = matrix.description; schemas = matrix.schema;
  } else if (STATIC_COPY[pathname]) {
    accept();
    const staticPageCopy = STATIC_PAGE_COPY_LOCALIZED[pathname]?.[rawLocale] || STATIC_PAGE_COPY_LOCALIZED[pathname]?.[locale];
    title = staticPageCopy?.[0] || STATIC_COPY_LOCALIZED[rawLocale]?.[pathname] || STATIC_COPY[pathname][isZh ? 1 : 0];
    description = staticPageCopy?.[1] || STATIC_DESCRIPTION_LOCALIZED[rawLocale] || (isZh ? "NexuAlpha 交易平台、手续费、账户条件与来源说明。" : "NexuAlpha platform research, trading fees, account requirements and source context.");
    if (pathname === "/news") {
      // Listing editions: the core locales plus every locale with a search-published native article in the feed.
      const listingLocales = newsListingPublishedLocales(options.newsArticles);
      const content = resolveNewsContentLocale(locale, listingLocales);
      const display = UI_LOCALES.has(locale) ? locale : content;
      // Indexable only with >= NEWS_LISTING_MIN_NATIVE_ARTICLES native editions (audit 2026-10-11 #4, worker parity).
      const published = listingLocales.includes(locale) && content === locale && newsListingIndexableLocales(options.newsArticles).includes(locale);
      const canonicalLocale = published || NATIVE_REVIEW_PENDING_LOCALES.has(display) ? display : content;
      title = STATIC_COPY_LOCALIZED[display]?.[pathname] || STATIC_COPY_LOCALIZED[content]?.[pathname] || STATIC_COPY[pathname][content === "zh-Hans" ? 1 : 0];
      description = STATIC_DESCRIPTION_LOCALIZED[display] || STATIC_DESCRIPTION_LOCALIZED[content] || (content === "zh-Hans" ? "NexuAlpha 交易平台、手续费、账户条件与来源说明。" : NEWS_HUB_SEO_EN.description);
      robots = published ? "index,follow" : "noindex,follow";
      schemas = [pageSchema(title, canonical(pathname, canonicalLocale), canonicalLocale)];
    } else {
      const staticSchema = pageSchema(title, canonical(pathname, locale), locale);
      if (pathname === "/methodology") {
        Object.assign(staticSchema, {
          dateModified: REGIONAL_FUNDING_MATRIX_REVIEWED_AT,
          ...researchAttribution([REGIONAL_FUNDING_MATRIX_URLS.json, REGIONAL_FUNDING_MATRIX_URLS.csv]),
          hasPart: citationAssetSchemas(),
          about: regionalFundingMatrixDatasetSchema(),
        });
      }
      schemas = pathname === "/methodology"
        ? [staticSchema, ...regionalFundingRouteSchemas(locale)]
        : isBrandPagePath(pathname)
        ? brandPageSchemas(pathname, locale, { canonical: canonical(pathname, locale) })
        : pathname === "/rates"
        ? ratesRouteSchemas(title, description, canonical(pathname, locale), locale)
        : [staticSchema];
    }
    if (pathname === "/onchain") {
      // Verification guide (audit NX-05): one copy source shared with the Worker head; WebPage schema, no Dataset.
      ({ title, description } = onchainGuideSeo(rawLocale));
      schemas = [onchainGuideSchema(schemaLocale(locale), { canonical: canonical(pathname, locale) })];
    }
    if (pathname === "/") {
      const featuredVenues = neutralVenueCatalog.slice(0, 6).map((venue, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: venue.name,
        url: `${PUBLIC_ORIGIN}${localizedPath(`/exchanges/${venue.slug}`, locale)}`,
      }));
      schemas = [
        { "@context": "https://schema.org", ...websiteSchema(locale, { url: canonical("/", locale) }) },
        { "@context": "https://schema.org", ...organizationSchema(locale) },
        { "@context": "https://schema.org", "@type": "ItemList", "@id": `${PUBLIC_ORIGIN}${localizedPath("/", locale)}#featured-platforms`, name: "Featured crypto platforms", itemListElement: featuredVenues },
      ];
    }
  } else if (pathname === "/topics" || pathname === "/factbook") {
    accept();
    const kind = pathname === "/factbook" ? "factbook" : "topics";
    const publishedLocale = locale === "en" ? "en" : null;
    const copy = collectionHubCopy(kind, publishedLocale || locale);
    title = `${copy.title} — NexuAlpha`;
    description = copy.description;
    const hubCanonicalUrl = canonical(pathname, "en");
    robots = publishedLocale ? "index,follow" : "noindex,follow";
    schemas = collectionHubSchemas(kind, publishedLocale || "en", hubCanonicalUrl);
  } else if (venueMatch) {
    const [, type, slug] = venueMatch;
    const venue = venueDatabase[slug];
    if (venue && (type === "factbook" || ACTIVE_VENUES.has(slug))) {
      accept();
      const venueSeoOverride = type === "exchanges" ? venueSeoOverrideFor(slug, locale, url.searchParams.get("market")) : null;
      const factbookLabel = FACTBOOK_TITLE_LOCALIZED[rawLocale] || "Source Review Factbook";
      title = venueSeoOverride?.title || `${venue.name} ${type === "factbook" ? factbookLabel : DETAIL_TITLE_LOCALIZED[rawLocale]?.profile || DETAIL_TITLE_LOCALIZED[locale]?.profile || (isZh ? "平台档案与手续费" : "Review, Fee Conditions & Official Route")} — NexuAlpha`;
      const profileDescription = DETAIL_DESCRIPTION_LOCALIZED[rawLocale]?.profile?.(venue.name) || DETAIL_DESCRIPTION_LOCALIZED[locale]?.profile?.(venue.name);
      description = venueSeoOverride?.description || (type === "factbook"
        ? (FACTBOOK_DESCRIPTION_LOCALIZED[rawLocale] || FACTBOOK_DESCRIPTION_LOCALIZED[locale] || ((name) => `Source-aware Factbook for ${name}: base fee schedules, regional access, KYC references, and official-domain checks. User benefits and reserve figures require item-level source verification.`))(venue.name)
        : (profileDescription || (isZh ? `${venue.name} 的手续费、产品、账户条件与平台资料。` : `Independent ${venue.name} profile covering fee schedules, account conditions and official sources. User benefits, regional availability and campaign eligibility must be verified in the official account.`)));
      const directAnswerSchema = venueDirectAnswerSchema(venue, venueSeoOverride, locale);
      schemas = type === "factbook" ? buildFactbookSchemas(venue, locale, canonical(pathname, locale)) : [
        breadcrumbs(venue.name, canonical(pathname, locale), locale),
        { ...pageSchema(title, canonical(pathname, locale), locale), dateModified: venueSeoOverride?.reviewedAt || "2026-09-15", ...researchAttribution([`https://${venue.officialDomain}`, ...(venueSeoOverride?.sourceUrls || [])]), about: { "@type": "Organization", name: venue.name, url: `https://${venue.officialDomain}` }, isBasedOn: [...new Set([`https://${venue.officialDomain}`, ...(venueSeoOverride?.sourceUrls || [])])], ...(venueSeoOverride?.relatedLinks ? { relatedLink: venueSeoOverride.relatedLinks.map((link) => `${PUBLIC_ORIGIN}${link}`) } : {}) },
      ].concat([applyPartnerVenueFaqSchema(directAnswerSchema || venueProfileFaq(venue, locale), slug, locale, url.searchParams.get("market"))]);
    }
  } else if (compareMatch) {
    const slugs = compareMatch[1].split("-vs-");
    if (slugs.length >= 2 && slugs.length <= 3 && new Set(slugs).size === slugs.length && slugs.every((slug) => ACTIVE_VENUES.has(slug))) {
      accept();
      const compareNames = slugs.map((slug) => venueDatabase[slug].name);
      const name = compareNames.join(" vs ");
      const compareSeoOverride = compareSeoOverrideFor(compareMatch[1], locale);
      title = compareSeoOverride?.title || `${name}: ${DETAIL_TITLE_LOCALIZED[rawLocale]?.compare || DETAIL_TITLE_LOCALIZED[locale]?.compare || (isZh ? "手续费与平台选择" : "Trading Fees & Platform Comparison")} — NexuAlpha`;
      description = compareSeoOverride?.description || (COMPARE_DESCRIPTION_LOCALIZED[rawLocale] || COMPARE_DESCRIPTION_LOCALIZED[locale] || COMPARE_DESCRIPTION_LOCALIZED.en)(name);
      // Compare-any (2026-10-11): generated two-venue pairs use the shared index policy and templated copy.
      const generatedPolicy = !CURATED_COMPARISONS.has(compareMatch[1]) && slugs.length === 2 ? generatedComparePolicy(compareMatch[1]) : null;
      if (generatedPolicy?.generated) {
        const generatedCopy = generatedCompareCopy(rawLocale, { nameA: compareNames[0], nameB: compareNames[1], date: generatedCompareDataDate(slugs) });
        title = generatedCopy.title;
        description = generatedCopy.description;
      }
      robots = generatedPolicy ? generatedPolicy.robots : CURATED_COMPARISONS.has(compareMatch[1]) ? "index,follow" : "noindex,follow";
      const comparisonUrl = canonical(pathname, locale);
      const hasCompleteFaqOverride = compareSeoOverride?.completeFaq === true;
      const directAnswer = hasCompleteFaqOverride ? compareSeoOverride?.directAnswer : null;
      const answerEntries = hasCompleteFaqOverride
        ? [
            ...(directAnswer ? [directAnswer] : []),
            ...(compareSeoOverride?.faq || []).map(([question, answer]) => ({ question, answer })),
          ]
        : compareFaqSchemaEntries(locale, { nameA: compareNames[0], nameB: compareNames[1] }).map(([question, answer]) => ({ question, answer }));
      schemas = [breadcrumbs(name, comparisonUrl, locale), {
        ...pageSchema(name, comparisonUrl, locale),
        dateModified: compareSeoOverride?.reviewedAt || "2026-09-22",
        ...researchAttribution([...slugs.map((slug) => `https://${venueDatabase[slug].officialDomain}`), ...(compareSeoOverride?.sourceUrls || [])]),
        about: slugs.map((slug) => ({ "@type": "Organization", name: venueDatabase[slug].name, url: `https://${venueDatabase[slug].officialDomain}` })),
        mainEntity: {
          "@type": "ItemList",
          name: `${name} comparison subjects`,
          itemListElement: slugs.map((slug, index) => ({ "@type": "ListItem", position: index + 1, name: venueDatabase[slug].name, url: `${PUBLIC_ORIGIN}/factbook/${slug}` })),
        },
        isBasedOn: slugs.map((slug) => `https://${venueDatabase[slug].officialDomain}`),
        ...(compareSeoOverride?.relatedLinks ? { relatedLink: compareSeoOverride.relatedLinks.map((link) => `${PUBLIC_ORIGIN}${link}`) } : {}),
        ...(answerEntries.length ? { subjectOf: { "@type": "FAQPage", inLanguage: locale, mainEntity: [
          ...answerEntries.map((entry) => ({ "@type": "Question", name: entry.question, acceptedAnswer: { "@type": "Answer", text: entry.answer, ...(compareSeoOverride?.sourceUrls?.length ? { citation: compareSeoOverride.sourceUrls } : {}) } })),
        ] } } : {}),
      }].concat(answerEntries.length ? [{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        inLanguage: locale,
        mainEntity: [
          ...answerEntries.map((entry) => ({ "@type": "Question", name: entry.question, acceptedAnswer: { "@type": "Answer", text: entry.answer } })),
        ],
      }] : []);
    }
  } else if (topicMatch && isBrazilDeadlineSlug(topicMatch[1])) {
    // Brazil BCB deadline topic (owner plan 2026-10-12): English slug indexable in en, Portuguese slug in pt-BR; every
    // other locale/slug pair is noindex with a canonical to the edition of its language (overridden below).
    accept();
    const content = brazilDeadlineContent(locale);
    title = `${content.metaTitle} — NexuAlpha`;
    description = content.metaDescription;
    robots = brazilDeadlineIndexable(pathname, locale) ? "index,follow" : "noindex,follow";
    schemas = brazilDeadlineSchemas(locale, canonical(brazilDeadlinePathFor(locale), brazilDeadlineContentLocale(locale)), PUBLIC_ORIGIN);
  } else if (topicMatch && venueAlternativePage(topicMatch[1])) {
    // /topics/<exchange>-alternatives (exchange keyword plan 2026-10-11): indexable in English; other locales render
    // translated chrome with noindex and an English canonical, like the tokenized-asset cluster.
    accept(); const page = venueAlternativePage(topicMatch[1]);
    const indexable = VENUE_ALTERNATIVES_INDEX_LOCALES.includes(locale);
    const content = venueAlternativesContent(page, locale);
    title = `${content.metaTitle} — NexuAlpha`;
    description = content.metaDescription;
    robots = indexable ? "index,follow" : "noindex,follow";
    schemas = venueAlternativesSchemas(page, locale, canonical(pathname, indexable ? locale : "en"), PUBLIC_ORIGIN);
  } else if (topicMatch && tokenizedAssetPage(topicMatch[1])) {
    accept(); const page = tokenizedAssetPage(topicMatch[1]);
    const resolvedLocale = tokenizedAssetLocale(locale);
    const tokenizedOverride = tokenizedSeoOverrideFor(page, resolvedLocale);
    const isPublishedLocale = TOKENIZED_ASSET_LOCALES.includes(locale) && resolvedLocale === locale;
    title = tokenizedOverride?.title || tokenizedAssetLocalized(page.metaTitle || page.title, resolvedLocale);
    description = tokenizedOverride?.description || tokenizedAssetLocalized(page.description, resolvedLocale);
    robots = isPublishedLocale ? "index,follow" : "noindex,follow";
    const tokenizedCanonical = canonical(pathname, resolvedLocale);
    schemas = tokenizedAssetSchemas(page, resolvedLocale, tokenizedCanonical, tokenizedOverride);
  } else if (topicMatch && TOPIC_GUIDES[topicMatch[1]]) {
    accept(); const topic = TOPIC_GUIDES[topicMatch[1]];
    const topicSeoOverride = LOCALIZED_TOPIC_SEO_OVERRIDES[locale]?.[topic.slug];
    const rawTitle = topicSeoOverride?.title || (isZh ? topic.metaTitleZh : topic.metaTitleEn);
    const rawDescription = topicSeoOverride?.description || (isZh ? topic.descZh : topic.descEn);
    const publicTopicTitle = sanitizePublicText(rawTitle);
    const publicTopicDescription = sanitizePublicText(rawDescription)
      .replace(/20%\s*(fee\s*)?rebate/gi, "user benefits pending official verification")
      .replace(/零手续费/g, "费率条件待官方核验")
      .replace(/0\.00%/g, "published base fee terms")
      .replace(/100x/gi, "high-volatility");
    title = topic.slug === "no-kyc" ? noKycMetaTitle(locale) : publicTopicTitle;
    description = publicTopicDescription;
    const topicSchema = pageSchema(publicTopicTitle, canonical(pathname, locale), locale, "CollectionPage");
    topicSchema.dateModified = topic.slug === "derivatives" ? topic.lastUpdated : TOPIC_SOURCE_REVIEW_DATE;
    Object.assign(topicSchema, researchAttribution([...new Set(topicSourcesFor(topic.slug).flatMap((record) => record.sources.map((source) => source.url)))].slice(0, 12)));
    topicSchema.about = topic.platforms.map((platform) => ({ "@type": "Thing", name: platform.name }));
    topicSchema.isBasedOn = [...new Set(topicSourcesFor(topic.slug).flatMap((record) => record.sources.map((source) => source.url)))].slice(0, 12);
    if (TOPIC_RELATED_LINKS[topic.slug]) topicSchema.relatedLink = TOPIC_RELATED_LINKS[topic.slug].map((link) => `${PUBLIC_ORIGIN}${link}`);
    schemas = [sectionBreadcrumb(publicTopicTitle, "/topics", publicTopicTitle, canonical(pathname, locale), locale), topicSchema].concat(topicSeoOverride?.directAnswer ? [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: schemaLocale(locale),
      mainEntity: [topicSeoOverride.directAnswer, ...(topicSeoOverride.faq || []).map(([question, answer]) => ({ question, answer }))].map((entry) => ({
        "@type": "Question",
        name: entry.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: entry.answer,
          ...(topicSchema.isBasedOn?.length ? { citation: topicSchema.isBasedOn.slice(0, 4) } : {}),
        },
      })),
    }] : []);
    const visibleTopicFaqs = topicFaqSchemaEntries(topic.slug, locale);
    if (visibleTopicFaqs.length) {
      schemas = schemas.filter(schema => schema['@type'] !== 'FAQPage');
      schemas.push({ '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: schemaLocale(locale), mainEntity: visibleTopicFaqs });
    }
  } else if (researchMatch && ACTIVE_VENUES.has(researchMatch[1])) {
    accept(); robots = "noindex,follow";
    title = `${venueDatabase[researchMatch[1]].name} Official Source Research — NexuAlpha`;
    description = "Public-source research with its own publication and review context.";
  } else if (newsMatch && options.article?.slug === newsMatch[1] && options.article.status === "PUBLISHED") {
    accept(); const article = options.article; ogType = "article";
    const articleLocales = newsArticleAvailableLocales(article);
    const articleLocale = resolveNewsContentLocale(locale, articleLocales);
    const isPublishedLocale = articleLocales.includes(locale) && articleLocale === locale;
    const articleTitle = localized(article.title, articleLocale);
    const serpOverride = serpCtrNewsOverride(article.slug, articleLocale);
    title = `${serpOverride?.title || (articleLocale === "en" && article.seo?.title ? article.seo.title : articleTitle)} — NexuAlpha`;
    description = serpOverride?.description || (articleLocale === "en" && article.seo?.description
      ? article.seo.description
      : localized(article.summary, articleLocale));
    const schemaDescription = articleMetaDescription(article, articleLocale, description);
    if (!isPublishedLocale) {
      title = `${localizedNewsTitle(article, locale)} — NexuAlpha`;
      description = localizedNewsSummary(article, locale);
    }
    // Meta/og/twitter descriptions use the same article-specific source text as the Worker head.
    description = isPublishedLocale
      ? articleMetaDescription(article, articleLocale, description)
      : clampMetaDescription(description, articleLocale); // same locale argument as the Worker (metadata.locale)
    robots = article.seo?.noindex === false && isPublishedLocale ? "index,follow" : "noindex,follow";
    // T10 (same rule as the Worker): a canonicalized duplicate is index,follow with its canonical on the stronger
    // article's edition in the same language; an edition the stronger article lacks stays noindex,follow.
    if (article.canonicalSlug && isPublishedLocale) {
      const target = Array.isArray(options.newsArticles) ? options.newsArticles.find((item) => item?.slug === article.canonicalSlug) : null;
      if (!target || newsArticleAvailableLocales(target).includes(articleLocale)) {
        newsCanonicalOverride = canonical(`/news/${article.canonicalSlug}`, articleLocale);
        robots = "index,follow";
      }
    }
    const isTokenizedTreasuryArticle = article.slug === "tokenized-treasuries-structure-access-risks";
    const tokenizedTreasuryGscFaq = isTokenizedTreasuryArticle ? tokenizedTreasuryGscFaqEntry(articleLocale) : null;
    const articleFaq = [
      ...(serpOverride?.question && serpOverride?.answer ? [{ question: serpOverride.question, answer: serpOverride.answer }] : []),
      ...(tokenizedTreasuryGscFaq ? [tokenizedTreasuryGscFaq] : []),
      ...newsArticleExtraFaqEntries(article, articleLocale),
      ...newsArticleFaqEntries(article, articleLocale),
    ];
    const articleRelatedLinks = Array.isArray(article.seo?.internalLinkTargets)
      ? article.seo.internalLinkTargets.filter((link) => typeof link === "string" && link.startsWith("/"))
      : [];
    for (const link of NEWS_OWNER_RELATED_LINKS[article.slug] || []) {
      if (!articleRelatedLinks.includes(link)) articleRelatedLinks.push(link);
    }
    if (isTokenizedTreasuryArticle && !articleRelatedLinks.includes("/research/wave48-tokenized-treasury-rights-ops.json")) articleRelatedLinks.push("/research/wave48-tokenized-treasury-rights-ops.json");
    const articleAttribution = researchAttribution(Array.isArray(article.sources) ? article.sources.map((source) => source?.url).filter(Boolean) : []);
    // Same as the Worker: no reviewer is claimed on an article unless a human review record exists.
    delete articleAttribution.reviewedBy;
    const humanReview = newsHumanReview(article);
    if (humanReview) articleAttribution.reviewedBy = { "@type": "Person", name: humanReview.by };
    if (isTokenizedTreasuryArticle) articleAttribution.hasPart = [...articleAttribution.hasPart, wave48TokenizedTreasuryRightsOpsDatasetSchema()];
    const articleCanonical = newsCanonicalOverride || canonical(pathname, articleLocale);
    const owner = priorityOwnerForPath(pathname);
    schemas = [
      { ...pageSchema(articleTitle, articleCanonical, articleLocale, "NewsArticle"), headline: articleTitle, description: schemaDescription, mainEntityOfPage: { "@type": "WebPage", "@id": articleCanonical }, image: [socialImageObject(pathname, rawLocale, PUBLIC_ORIGIN)].filter(Boolean), datePublished: article.publishedAt, dateModified: article.updatedAt || article.publishedAt, ...articleAttribution, author: newsArticleAuthor(article), ...(owner ? { isPartOf: `${PUBLIC_ORIGIN}${owner.canonicalOwnerPath}`, articleSection: "Dated source trail" } : {}), ...(articleRelatedLinks.length ? { relatedLink: articleRelatedLinks.map((link) => publicRelatedUrl(link, articleLocale)) } : {}), ...(serpOverride?.question ? { about: { "@type": "Thing", name: serpOverride.question } } : {}) },
      sectionBreadcrumb("News", "/news", articleTitle, articleCanonical, articleLocale),
      ...(articleFaq.length ? [{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        inLanguage: articleLocale,
        mainEntity: articleFaq.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer, ...(isTokenizedTreasuryArticle ? { citation: tokenizedTreasuryArticleFaqCitations(article, question) } : {}) },
        })),
      }] : []),
    ];
  } else if (/^\/activities\/[^/]+$/.test(pathname) && route.name === "activity") {
    const activity = (options.updates || []).find((update) => update.id === route.id);
    if (activity) { accept(); robots = "noindex,follow"; title = `${localized(activity.title, locale)} — NexuAlpha`; description = localized(activity.summary, locale); }
  }
  const newsClientLocale = pathname === "/news"
    ? (NATIVE_REVIEW_PENDING_LOCALES.has(locale) ? locale : resolveNewsContentLocale(locale, newsListingPublishedLocales(options.newsArticles)))
    : null;
  const newsArticleClientLocale = newsMatch && options.article ? resolveNewsContentLocale(locale, newsArticleSeoLocales(options.article)) : null;
  const tokenizedClientLocale = topicMatch && tokenizedAssetPage(topicMatch[1]) ? tokenizedAssetLocale(locale) : topicMatch && venueAlternativePage(topicMatch[1]) && !VENUE_ALTERNATIVES_INDEX_LOCALES.includes(locale) ? "en" : null;
  const collectionHubLocale = pathname === "/topics" || pathname === "/factbook" ? "en" : null;
  const canonicalLocale = collectionHubLocale || newsArticleClientLocale || newsClientLocale || tokenizedClientLocale || locale;
  const regionalPreviewCanonical = route.name === "regionalPreview"
    ? regionalPreviewCanonicalUrl(pathname, route.market, locale)
    : null;
  const mxDecisionPath = Boolean(MX_DECISION_SEO[pathname]);
  const mxDecisionIndexable = mxDecisionPath && locale === "es";
  const brazilDeadlineRoute = Boolean(topicMatch && isBrazilDeadlineSlug(topicMatch[1]));
  const canonicalUrl = newsCanonicalOverride
    ? newsCanonicalOverride
    : brazilDeadlineRoute
    ? canonical(brazilDeadlinePathFor(locale), brazilDeadlineContentLocale(locale))
    : mxDecisionPath
    ? `${PUBLIC_ORIGIN}${pathname}`
    : route.name === "regionalPreview"
    ? (regionalPreviewIsIndexable(route.market, locale) ? regionalPreviewCanonical : `${PUBLIC_ORIGIN}${pathname}`)
    : canonical(pathname, canonicalLocale);
  const publishedSearchLocales = searchPublicationLocales(pathname, { article: options.article, newsArticles: options.newsArticles });
  if (status === 200 && robots === "index,follow" && !newsCanonicalOverride && !publishedSearchLocales.includes(locale)) {
    robots = "noindex,follow";
  }
  const alternateLocales = robots !== "index,follow" || newsCanonicalOverride
    ? []
    : brazilDeadlineRoute
    ? brazilDeadlineAlternates(canonical)
    : getBrazilPage(pathname)
    ? [{ hreflang: "pt-BR", href: canonical(pathname, "pt-BR") }, { hreflang: "x-default", href: canonical(pathname, "pt-BR") }]
    : route.name === "regionalPreview" && regionalPreviewIsIndexable(route.market, locale)
    ? [{ hreflang: regionalPreviewCanonicalLocale(route.market, locale), href: regionalPreviewCanonical }, { hreflang: "x-default", href: regionalPreviewCanonical }]
    : pathname === "/news"
    ? [
      ...newsListingIndexableLocales(options.newsArticles).map((hreflang) => ({ hreflang, href: canonical(pathname, hreflang) })),
      { hreflang: "x-default", href: canonical(pathname, "en") },
    ]
    : newsMatch && options.article
    ? [
      ...newsArticleSeoLocales(options.article).map((hreflang) => ({ hreflang, href: canonical(pathname, hreflang) })),
      { hreflang: "x-default", href: canonical(pathname, newsArticleSeoLocales(options.article)[0] || "en") },
    ]
    : tokenizedClientLocale
    ? [
      ...TOKENIZED_ASSET_LOCALES.map((hreflang) => ({ hreflang, href: canonical(pathname, hreflang) })),
      { hreflang: "x-default", href: canonical(pathname, "en") },
    ]
    : collectionHubLocale
    ? [
      { hreflang: "en", href: canonical(pathname, "en") },
      { hreflang: "x-default", href: canonical(pathname, "en") },
    ]
    : mxDecisionIndexable
    ? [
      { hreflang: "es", href: `${PUBLIC_ORIGIN}${pathname}` },
      { hreflang: "x-default", href: `${PUBLIC_ORIGIN}${pathname}` },
    ]
    : publishedSearchLocales.length
    ? [
      ...publishedSearchLocales.map((hreflang) => ({ hreflang, href: canonical(pathname, hreflang) })),
      { hreflang: "x-default", href: canonical(pathname, publishedSearchLocales[0] || "en") },
    ]
    : [
      ...INDEXABLE_LOCALES.map((hreflang) => ({ hreflang, href: canonical(pathname, hreflang) })),
      { hreflang: "x-default", href: canonical(pathname, "en") },
    ];
  const returnedLocale = newsArticleClientLocale || newsClientLocale || tokenizedClientLocale || locale;
  const returnedHtmlLocale = (pathname === "/news" || Boolean(newsMatch && options.article)) && UI_LOCALES.has(locale)
    ? locale
    : UI_LOCALES.has(rawLocale) && !newsClientLocale && !newsArticleClientLocale && !tokenizedClientLocale
      ? rawLocale
      : returnedLocale;
  return { title, description, canonical: canonicalUrl, locale: returnedLocale, htmlLocale: returnedHtmlLocale, status, robots, ogType, schemas,
    alternates: alternateLocales,
  };
}

let preservedServerKey = null;
export function injectSeoMetadata(options = {}) {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const seo = computeRouteSeo(options);
  const currentKey = `${window.location.pathname}|${seo.locale}`;
  const hasServerMarker = Boolean(document.querySelector('[data-nexualpha-route-seo="marker"]'));
  // Retain article metadata while the feed loads and on the first hydration pass.
  if (hasServerMarker && !options.force && (preservedServerKey === null || preservedServerKey === currentKey)) {
    preservedServerKey = currentKey;
    return;
  }
  preservedServerKey = currentKey;
  document.title = seo.title;
  document.querySelectorAll('[data-nexualpha-seo], [data-nexualpha-route-seo], #nexualpha-route-schema, link[rel="canonical"], link[rel="alternate"][hreflang], meta[property^="og:"], meta[name^="twitter:"]').forEach((element) => element.remove());
  const append = (tag, attrs) => {
    const element = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
    element.dataset.nexualphaSeo = "route";
    document.head.appendChild(element);
    return element;
  };
  const meta = (name, content) => {
    let element = document.querySelector(`meta[name="${name}"]`);
    if (!element) element = append("meta", { name });
    element.content = content;
  };
  append("link", { rel: "canonical", href: seo.canonical });
  seo.alternates.forEach((alternate) => append("link", { rel: "alternate", ...alternate }));
  meta("description", seo.description); meta("robots", seo.robots);
  for (const [property, content] of Object.entries({ "og:type": seo.ogType, "og:site_name": "NexuAlpha", "og:title": seo.title, "og:description": seo.description, "og:url": seo.canonical, "og:image": DEFAULT_SOCIAL_IMAGE })) append("meta", { property, content });
  for (const [name, content] of Object.entries({ "twitter:card": "summary_large_image", "twitter:site": "@NexuAlpha", "twitter:title": seo.title, "twitter:description": seo.description, "twitter:image": DEFAULT_SOCIAL_IMAGE })) append("meta", { name, content });
  for (const schema of seo.schemas) append("script", { type: "application/ld+json" }).textContent = JSON.stringify(schema);
}

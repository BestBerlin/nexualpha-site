import { feeFact, feePair, factsForVenue, FACTS_AS_OF } from "./exchange-facts.js";
import { compareDirectAnswerDrafts } from "./compare-direct-answer-drafts.js";
import { comparePairAnswers, comparePairAnswerSlugs } from "./compare-pair-answers.js";

// 2026-10-10: the four market-plan pairs carry all 15 UI locales; the older pairs keep their reviewed subset.
const supportedLocales = new Set(["en", "zh-Hans", "zh-Hant", "ja", "ko", "ar", "tr", "de", "pt-BR", "es", "fr", "it", "ru", "id", "vi", "ur", "uk"]);

const normalizeCompareAnswerLocale = (locale = "en") => {
  const raw = String(locale || "en");
  const lower = raw.toLowerCase();
  if (raw === "zh-Hant" || lower.startsWith("zh-tw") || lower.startsWith("zh-hk") || lower.startsWith("zh-mo")) return "zh-Hant";
  if (raw === "zh-Hans" || lower.startsWith("zh-cn") || lower.startsWith("zh-sg") || lower === "zh") return "zh-Hans";
  if (lower === "en" || lower.startsWith("en-")) return "en";
  if (lower === "ja" || lower.startsWith("ja-")) return "ja";
  if (lower === "ko" || lower.startsWith("ko-")) return "ko";
  if (lower === "ar" || lower.startsWith("ar-")) return "ar";
  if (lower === "tr" || lower.startsWith("tr-")) return "tr";
  if (lower === "de" || lower.startsWith("de-")) return "de";
  if (lower === "pt" || lower.startsWith("pt-")) return "pt-BR";
  for (const code of ["es", "fr", "it", "ru", "id", "vi", "ur", "uk"]) if (lower === code || lower.startsWith(`${code}-`)) return code;
  return null;
};

const source = (label, href) => [label, href];
const internal = (label, href) => [label, href];
const faq = (question, answer) => [question, answer];
const searchDemand = (label, detail) => [label, detail];

const BYBIT_BITGET_SOURCE_LINKS = [
  source("Bybit xStocks FAQ", "https://www.bybit.com/en/help-center/article/FAQ-xStocks-on-Bybit"),
  source("Bybit Trading Fee Structure", "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure"),
  source("Bybit Individual KYC FAQ", "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ"),
  source("Bybit Copy Trading Profit Sharing", "https://www.bybit.com/en/help-center/article/Copy-Trading-Profit-Sharing-Explained"),
  source("Bybit Unified Trading Account", "https://www.bybit.com/en/help-center/article/Unified-Trading-Account-Asset-Page"),
  source("Bybit UTA FAQ", "https://www.bybit.com/en/help-center/article/FAQ-Unified-Trading-Account"),
  source("Bitget Futures Services Agreement", "https://www.bitget.com/support/articles/7700532076057"),
  source("Bitget Product Fees FAQ", "https://www.bitget.com/support/articles/12560603892733"),
  source("Bitget Trading Fees FAQ", "https://www.bitget.com/support/articles/12560603892734"),
  source("Bitget Futures Fees Guide", "https://www.bitget.com/support/articles/12560603817155"),
  source("Bitget Identity Verification", "https://www.bitget.com/support/articles/12560603795184"),
  source("Bitget Copy Trading Profit-Sharing", "https://www.bitget.com/support/articles/9083311039641"),
  source("Bitget Unified Trading Account", "https://www.bitget.com/support/articles/12560603885783"),
  source("Bitget UTA API FAQ", "https://www.bitget.com/support/articles/12560603890654"),
];

const BINANCE_OKX_SOURCE_LINKS = [
  source("Binance trading fee schedule", "https://www.binance.com/en/fee/trading"),
  source("Binance identity verification", "https://www.binance.com/en/support/faq/detail/360027287111"),
  source("OKX fees", "https://www.okx.com/fees"),
  source("OKX identity verification", "https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported"),
];

const HYPERLIQUID_DYDX_SOURCE_LINKS = [
  source("Hyperliquid fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees"),
  source("Hyperliquid funding", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"),
  source("Hyperliquid liquidations", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations"),
  source("dYdX onboarding FAQs", "https://docs.dydx.xyz/concepts/onboarding-faqs"),
  source("dYdX trading fees and parameters", "https://docs.dydx.xyz/concepts/trading/rewards_fees_and_parameters"),
];

const UNISWAP_JUPITER_SOURCE_LINKS = [
  source("Uniswap official app", "https://app.uniswap.org/"),
  source("Uniswap supported chains", "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains"),
  source("Uniswap Universal Router", "https://developers.uniswap.org/docs/protocols/universal-router/overview"),
  source("Uniswap Permit2", "https://developers.uniswap.org/docs/protocols/permit2/overview"),
  source("Jupiter Swap API", "https://dev.jup.ag/docs/swap"),
  source("Jupiter Ultra API", "https://dev.jup.ag/docs/ultra"),
  source("Jupiter Tokens API", "https://dev.jup.ag/docs/tokens"),
  source("Jupiter Support Hub", "https://support.jup.ag/"),
];

const BYBIT_BITGET_INTERNAL_LINKS = {
  en: [
    internal("Review Bybit profile", "/exchanges/bybit"),
    internal("Review Bitget profile", "/exchanges/bitget"),
    internal("Use the derivatives checklist", "/topics/derivatives"),
    internal("Open the stock exposure guide", "/topics/tokenized-stocks-vs-perpetuals"),
    internal("Open the tokenized assets hub", "/topics/tokenized-assets"),
    internal("Open Bybit factbook", "/factbook/bybit"),
    internal("Open Bitget factbook", "/factbook/bitget"),
  ],
  "zh-Hans": [
    internal("查看 Bybit 档案", "/exchanges/bybit"),
    internal("查看 Bitget 档案", "/exchanges/bitget"),
    internal("打开股票敞口指南", "/topics/tokenized-stocks-vs-perpetuals"),
    internal("打开 Bybit Factbook", "/factbook/bybit"),
    internal("打开 Bitget Factbook", "/factbook/bitget"),
  ],
  "zh-Hant": [
    internal("查看 Bybit 檔案", "/exchanges/bybit"),
    internal("查看 Bitget 檔案", "/exchanges/bitget"),
    internal("打開股票敞口指南", "/topics/tokenized-stocks-vs-perpetuals"),
    internal("打開 Bybit Factbook", "/factbook/bybit"),
    internal("打開 Bitget Factbook", "/factbook/bitget"),
  ],
  ja: [
    internal("Bybit プロフィールを見る", "/exchanges/bybit"),
    internal("Bitget プロフィールを見る", "/exchanges/bitget"),
    internal("株式型エクスポージャーガイドを開く", "/topics/tokenized-stocks-vs-perpetuals"),
    internal("Bybit Factbook を開く", "/factbook/bybit"),
    internal("Bitget Factbook を開く", "/factbook/bitget"),
  ],
  ko: [
    internal("Bybit 프로필 보기", "/exchanges/bybit"),
    internal("Bitget 프로필 보기", "/exchanges/bitget"),
    internal("주식형 노출 가이드 열기", "/topics/tokenized-stocks-vs-perpetuals"),
    internal("Bybit Factbook 열기", "/factbook/bybit"),
    internal("Bitget Factbook 열기", "/factbook/bitget"),
  ],
  ar: [
    internal("مراجعة ملف Bybit", "/exchanges/bybit"),
    internal("مراجعة ملف Bitget", "/exchanges/bitget"),
    internal("فتح دليل التعرض الشبيه بالأسهم", "/topics/tokenized-stocks-vs-perpetuals"),
    internal("فتح Factbook Bybit", "/factbook/bybit"),
    internal("فتح Factbook Bitget", "/factbook/bitget"),
  ],
  tr: [
    internal("Bybit profilini incele", "/exchanges/bybit"),
    internal("Bitget profilini incele", "/exchanges/bitget"),
    internal("Hisse benzeri ürün rehberini aç", "/topics/tokenized-stocks-vs-perpetuals"),
    internal("Bybit factbook aç", "/factbook/bybit"),
    internal("Bitget factbook aç", "/factbook/bitget"),
  ],
  "pt-BR": [
    internal("Revisar perfil Bybit", "/exchanges/bybit"),
    internal("Revisar perfil Bitget", "/exchanges/bitget"),
    internal("Abrir guia de exposição a ações", "/topics/tokenized-stocks-vs-perpetuals"),
    internal("Abrir factbook Bybit", "/factbook/bybit"),
    internal("Abrir factbook Bitget", "/factbook/bitget"),
  ],
};

const BINANCE_OKX_INTERNAL_LINKS = [
  internal("Review Binance profile", "/exchanges/binance"),
  internal("Review OKX profile", "/exchanges/okx"),
  internal("Open derivatives guide", "/topics/derivatives"),
  internal("Open Binance factbook", "/factbook/binance"),
  internal("Open OKX factbook", "/factbook/okx"),
];

const BINANCE_OKX_INTERNAL_LINKS_DE = [
  internal("Binance-Profil ansehen", "/exchanges/binance"),
  internal("OKX-Profil ansehen", "/exchanges/okx"),
  internal("Derivate-Leitfaden öffnen", "/topics/derivatives"),
  internal("Binance-Factbook öffnen", "/factbook/binance"),
  internal("OKX-Factbook öffnen", "/factbook/okx"),
];

const HYPERLIQUID_DYDX_INTERNAL_LINKS = [
  internal("Read the dated source explainer", "/news/hyperliquid-vs-dydx"),
  internal("Open no-KYC access guide", "/topics/no-kyc"),
  internal("Open derivatives guide", "/topics/derivatives"),
  internal("Review Hyperliquid profile", "/exchanges/hyperliquid"),
  internal("Review dYdX profile", "/exchanges/dydx"),
];

const UNISWAP_JUPITER_INTERNAL_LINKS = [
  internal("Review the Uniswap owner page first", "/exchanges/uniswap"),
  internal("Review the Jupiter owner page", "/exchanges/jupiter"),
  internal("Open no-KYC wallet access checks", "/topics/no-kyc"),
  internal("Use the on-chain liquidity board", "/onchain?product=swap"),
];

export const compareDirectAnswerSlugs = ["binance-vs-okx", "bybit-vs-bitget", "hyperliquid-vs-dydx", "uniswap-vs-jupiter"];

const ownerQuestionByCompare = {
  "bybit-vs-bitget": {
    en: "Should you choose Bybit or Bitget for the product route you actually need?",
    "zh-Hans": "按你真正需要的产品路径，应该选 Bybit 还是 Bitget？",
    "zh-Hant": "按你真正需要的產品路徑，應該選 Bybit 還是 Bitget？",
    ja: "必要な商品ルートでは Bybit と Bitget のどちらを選ぶべきですか？",
    ko: "필요한 상품 경로 기준으로 Bybit과 Bitget 중 무엇을 선택해야 하나요?",
    ar: "هل تختار Bybit أم Bitget حسب مسار المنتج الذي تحتاجه فعلاً؟",
    tr: "Gerçekten ihtiyaç duyduğunuz ürün rotasına göre Bybit mi Bitget mi?",
  },
  "hyperliquid-vs-dydx": {
    en: "Should you choose Hyperliquid or dYdX after checking fees, funding, liquidation and access risk?",
  },
  "uniswap-vs-jupiter": {
    // Striking distance 2026-10-18 (position ~18): the H1 names both DEXs and the checks in plain words.
    en: "Uniswap vs Jupiter: chain, routing, fees and wallet checks before you swap",
  },
  "binance-vs-okx": {
    en: "Should you choose Binance or OKX after checking fees, products, KYC and Web3 access?",
    de: "Sollten Sie Binance oder OKX wählen, nachdem Gebühren, Produkte, KYC und Web3-Zugang geprüft wurden?",
  },
};

const primaryNextActionByCompare = {
  "bybit-vs-bitget": {
    en: ["Open the product-specific evidence first", "/topics/tokenized-stocks-vs-perpetuals"],
    "zh-Hans": ["先打开产品差异证据", "/topics/tokenized-stocks-vs-perpetuals"],
    "zh-Hant": ["先打開產品差異證據", "/topics/tokenized-stocks-vs-perpetuals"],
    ja: ["商品差異の根拠を先に開く", "/topics/tokenized-stocks-vs-perpetuals"],
    ko: ["상품 차이 근거 먼저 보기", "/topics/tokenized-stocks-vs-perpetuals"],
    ar: ["افتح دليل اختلاف المنتج أولاً", "/topics/tokenized-stocks-vs-perpetuals"],
    tr: ["Önce ürün farkı kanıtını aç", "/topics/tokenized-stocks-vs-perpetuals"],
  },
  "hyperliquid-vs-dydx": {
    en: ["Read the dated source explainer first", "/news/hyperliquid-vs-dydx"],
  },
  "uniswap-vs-jupiter": {
    en: ["Review the Uniswap owner page first", "/exchanges/uniswap"],
  },
  "binance-vs-okx": {
    en: ["Review Binance and OKX official-source checks", "/topics/derivatives"],
    de: ["Offizielle Binance- und OKX-Quellen zuerst prüfen", "/topics/derivatives"],
  },
};

export const compareDirectAnswers = {
  "binance-vs-okx": {
    en: {
      title: "Binance vs OKX: compare fees, product scope, KYC and Web3 access before choosing.",
      body: "Compare Binance and OKX by their official fee tables, product-specific availability, identity requirements, regional restrictions, Web3 or DEX-style access paths and announcement sources. Do not treat either public comparison as a current account entitlement, fee guarantee or eligibility decision.",
      reviewedAt: "2026-09-22",
      reviewedLabel: "Official Binance and OKX sources reviewed September 22, 2026",
      decisionCard: {
        eyebrow: "Final call before signup",
        title: "Choose Binance for broad exchange depth; choose OKX when Web3-style routing and tools matter more.",
        suitedForLabel: "Who it fits",
        verifyLabel: "Verify first",
        matrixLabel: "Full matrix",
        evidenceLabel: "Review sources and decision notes",
        picks: {
          binance: {
            fit: "Users who want the broadest CEX product shelf, large liquidity, fiat/P2P routes and a familiar account flow.",
            verify: "KYC eligibility, local fiat rails, BNB fee rules, product access and the official fee tier shown inside the account.",
          },
          okx: {
            fit: "Users comparing a CEX account with Web3 wallet, DEX-style discovery, bots, Earn and proof-of-reserves checks.",
            verify: "Regional eligibility, KYC level, Web3 route boundaries, product permissions and current OKX fee table.",
          },
        },
      },
      productTypes: [],
      checks: [],
      searchDemand: [],
      nextSteps: [],
      boundary: "This comparison cannot confirm product access, regional eligibility, KYC approval, user benefit or final trading cost. Use the official logged-in account flow for the final check.",
      sourceLinks: BINANCE_OKX_SOURCE_LINKS,
      internalLinks: BINANCE_OKX_INTERNAL_LINKS,
      faq: [
        faq("Is Binance vs OKX mainly a fee comparison?", "Fees matter, but the safer comparison also checks product scope, KYC, regional eligibility, Web3 wallet or DEX-style routing, official announcements and the source date for each claim."),
        faq("Can this page decide whether my account can trade a product?", "No. It can narrow what to verify. Final access depends on the current official account flow, user region, verification status, product rules and platform terms."),
      ],
      seoTitle: "Binance vs OKX: Fees, Products, KYC and Web3 Access Checks — NexuAlpha",
      seoDescription: "Compare Binance and OKX by published fee tables, spot and derivatives product scope, identity requirements, Web3 or DEX-style access and account eligibility.",
      seoQuestion: "How should I compare Binance and OKX before choosing an exchange?",
    },
    de: {
      title: "Binance vs OKX: Gebühren, Produktzugang, KYC und Web3-Route vor der Registrierung prüfen.",
      body: "Vergleichen Sie Binance und OKX zuerst nach Kontomodell, offizieller Gebührentabelle, Spot- und Derivateumfang, Identitätsprüfung, regionaler Verfügbarkeit, Web3- oder Wallet-Funktionen und aktuellen offiziellen Quellen. Eine öffentliche Vergleichsseite ersetzt weder die eingeloggte Kontoansicht noch eine aktuelle Eignungsprüfung.",
      reviewedAt: "2026-09-22",
      reviewedLabel: "Offizielle Binance- und OKX-Quellen geprüft am 22. September 2026",
      decisionCard: {
        eyebrow: "Letzte Prüfung vor der Registrierung",
        title: "Binance passt besser für breite CEX-Tiefe; OKX passt besser, wenn Web3-Wallet, DEX-nahe Tools und Konto-/Wallet-Grenzen wichtiger sind.",
        suitedForLabel: "Passt für",
        verifyLabel: "Vorher prüfen",
        matrixLabel: "Vollständige Matrix",
        evidenceLabel: "Quellen und Entscheidungsnotizen prüfen",
        picks: {
          binance: {
            fit: "Nutzer, die breite CEX-Liquidität, viele Produkte, Fiat- oder P2P-Routen und einen klassischen Kontoablauf vergleichen.",
            verify: "KYC-Eignung, lokale Fiat-Routen, BNB-Gebührenregeln, Produktzugang und die offizielle Gebührentabelle in der Kontoansicht.",
          },
          okx: {
            fit: "Nutzer, die ein CEX-Konto mit Web3-Wallet, DEX-naher Suche, Bots, Earn und Reservenprüfung vergleichen.",
            verify: "Regionale Eignung, KYC-Level, Web3-Routengrenzen, Produktrechte und die aktuelle OKX-Gebührentabelle.",
          },
        },
      },
      productTypes: [
        ["CEX-Konto", "Gebühren, KYC, Ein- und Auszahlung, Produktrechte und Risikokontrollen hängen von Konto, Region und Produkt ab."],
        ["Derivate", "Futures- oder Perpetual-Zugang muss getrennt von Spot, Earn, Bots und Web3-Routen geprüft werden."],
        ["Web3- oder Wallet-Route", "OKX-ähnliche Web3-Funktionen sind keine automatische Konto- oder Produkterlaubnis; Wallet-Signatur, Netzwerk und Produktgrenze separat prüfen."],
      ],
      checks: [
        "Gebühren: offizielle Spot- und Futures-Tabellen, Konto-/VIP-Stufe und mögliche BNB- oder Plattformbedingungen prüfen.",
        "Konto: Identitätsprüfung, Wohnsitz, lokale Ein- und Auszahlung und Produktrechte im offiziellen Ablauf bestätigen.",
        "Route: CEX-Konto, Web3-Wallet, DEX-nahe Funktionen und Derivate nicht als austauschbare Pfade behandeln.",
      ],
      searchDemand: [
        searchDemand("Wenn Sie niedrigere Gebühren suchen", "Erst Produkt, Markt, Maker/Taker-Seite und Kontostufe festlegen; öffentliche Tabellen sind eine Prüfliste, kein finales Kontoangebot."),
        searchDemand("Wenn Sie Web3-Zugang suchen", "OKX-Wallet- oder DEX-nahe Funktionen getrennt von CEX-Konto, KYC, Einzahlungen und Derivatezugang prüfen."),
        searchDemand("Wenn Sie vor der Registrierung entscheiden", "Erst offizielle Domain, Quellenstand, Produktzugang und regionale Bedingungen prüfen, dann die passende Plattformseite öffnen."),
      ],
      nextSteps: [
        "Wählen Sie zuerst die Route: Spot-Konto, Futures-Konto, Web3-Wallet oder Research-only.",
        "Öffnen Sie die offiziellen Gebühren- und KYC-Quellen, bevor Sie Kosten oder Produktzugang als bekannt behandeln.",
        "Nutzen Sie die NexuAlpha-Profile und Factbooks für Quellenprüfung; die Registrierung folgt erst nach der offiziellen Konto- oder Wallet-Prüfung.",
      ],
      boundary: "Dieser Vergleich bestätigt keinen Produktzugang, keine regionale Eignung, keine KYC-Freigabe, keinen Nutzerbonus und keine finalen Handelskosten. Entscheidend ist der offizielle Konto- oder Wallet-Ablauf.",
      sourceLinks: BINANCE_OKX_SOURCE_LINKS,
      internalLinks: BINANCE_OKX_INTERNAL_LINKS_DE,
      faq: [
        faq("Ist Binance vs OKX vor allem ein Gebührenvergleich?", "Gebühren sind wichtig, reichen aber nicht aus. Prüfen Sie Produktumfang, KYC, regionale Eignung, Web3- oder Wallet-Routen, offizielle Ankündigungen und das Quelldatum jeder Aussage."),
        faq("Kann diese Seite entscheiden, ob mein Konto ein Produkt handeln darf?", "Nein. Die Seite grenzt die Prüfung ein. Finaler Zugang hängt vom aktuellen offiziellen Kontoablauf, Region, Verifizierungsstatus, Produktregeln und Plattformbedingungen ab."),
        faq("Wann sollte ich den Registrierungsweg öffnen?", "Erst nachdem offizielle Domain, benötigtes Produkt, Gebührenquelle, KYC-Anforderung und regionale Bedingungen geprüft wurden. Ein Partnerpfad garantiert keine Freigabe oder endgültige Kosten."),
      ],
      seoTitle: "Binance vs OKX: Gebühren, Produkte, KYC und Web3-Zugang prüfen — NexuAlpha",
      seoDescription: "Vergleichen Sie Binance und OKX nach offiziellen Gebühren, Spot- und Derivateumfang, Identitätsprüfung, regionalen Bedingungen, Web3-Zugang und Konto-Eignungsgrenzen.",
      seoQuestion: "Wie sollte ich Binance und OKX vor der Registrierung vergleichen?",
    },
  },
  "bybit-vs-bitget": {
    en: {
      title: "Bybit vs Bitget: choose by product route, UTA model and account screen before signup.",
      body: "Start by labeling the user path: ordinary crypto futures, xStocks-style exposure, stock futures, copy trading, UTA or a first-time account route. Bybit xStocks, Bybit TradFi derivatives, Bitget stock futures, Bitget stock-product pages, UTA margin and crypto copy trading are different paths. Compare the product-specific official fee table first: xStocks uses the Adventure Zone & xStocks schedule, not ordinary crypto spot fees; copy trading needs the profit-sharing rules and the selected trader/account page.",
      reviewedAt: "2026-09-22",
      reviewedLabel: "Official Bybit and Bitget sources reviewed September 22, 2026",
      searchIntent: {
        label: "Search Console signal",
        detail: "32 impressions on the Bybit vs Bitget comparison page were reviewed in the R41 GSC queue, including UTA comparison, Bybit alternatives and signup-path intent. The page answers the searcher's choice problem first, then routes to official sources and account checks.",
      },
      decisionCard: {
        eyebrow: "Final call before signup",
        title: "Choose Bybit for product breadth and xStocks checks; choose Bitget when futures, copy-trading style workflows and protected Bitget onboarding fit better.",
        suitedForLabel: "Who it fits",
        verifyLabel: "Verify first",
        matrixLabel: "Full matrix",
        evidenceLabel: "Review sources and decision notes",
        picks: {
          bybit: {
            fit: "Users comparing derivatives, xStocks-style exposure, VIP fee tiers and a Bybit account route before funding.",
            verify: "xStocks eligibility, product-specific fee schedule, KYC region, funding path and copy-trading terms if used.",
          },
          bitget: {
            fit: "Users focused on futures, copy-trading style workflows, protected Bitget onboarding and account-level fee checks.",
            verify: "Futures access, stock-futures boundaries, identity verification, current account terms and the referral code shown on the official signup screen.",
          },
        },
      },
      productTypes: [
        ["First-time account route", "Use this only after the official signup screen still shows the expected region, identity requirement, account terms and referral-code field; a comparison page is not account approval."],
        ["Unified Trading Account (UTA)", "Both platforms publish UTA material, but the structures are not interchangeable. Bybit documents spot, spot margin, perpetuals, futures and options with isolated, cross and portfolio-margin behavior; Bitget documents a shared multi-asset pool across spot, margin and futures. Verify the live account mode, supported collateral, collateral value or haircut, borrowing and liquidation rules before treating either UTA as equivalent."],
        ["Bybit xStocks", "Tokenized representations with separate eligibility, rights and fee tables; xStocks are restricted in the U.S., UK, EEA, Japan, Brazil, India, Indonesia, Turkey, Vietnam and other official-list regions."],
        ["Bitget stock futures", "Derivatives exposure; Bitget says stock futures do not represent ownership of underlying shares, stock tokens or indices."],
        ["Copy trading", "A follower-strategy workflow; read each platform's profit-sharing rules and the selected trader/account page before treating cost as known."],
      ],
      checks: [
        "Product: distinguish tokenized exposure, stock futures, ordinary derivatives and copy trading.",
        "Cost: do not reuse ordinary crypto spot fees for xStocks; compare xStocks, futures, funding, withdrawal or network cost and copy-trading profit share by product.",
        "Account: confirm KYC level, issuing country or region, product permission and live official terms.",
      ],
      searchDemand: [
        searchDemand("If you mean stock access", "Do not treat the comparison as proof that real shares are available. First separate xStocks, stock futures, stock-like product pages and ordinary crypto derivatives."),
        searchDemand("If you mean copy trading", "Compare profit sharing, trader eligibility, account permissions and current lead-trader rules before opening either route."),
        searchDemand("If you mean UTA, unified margin or Bybit alternatives", "Compare the products inside each unified account, margin mode, supported collateral, collateral valuation, borrowing and liquidation rules before treating Bitget as an alternative to Bybit. The same UTA label does not prove the same risk model or product access."),
        searchDemand("If you mean lower fees", "Use the product-specific official table, account tier and region. Public fee rows are a starting checklist, not the final logged-in cost."),
        searchDemand("If you mean signup path", "Open the venue detail page first, confirm the official route still matches region and account screen, then use the protected onboarding path without changing referral parameters."),
      ],
      nextSteps: [
        "Choose the product label you actually need: spot, futures, stock-like exposure or copy trading.",
        "Open the matching official source before funding or trading; region, KYC and account tier can change the result.",
        "Use the derivatives checklist when the decision is ordinary futures or perpetual access; use the tokenized-stock guide when the query is about stock-like exposure.",
        "Use NexuAlpha venue profiles for the research path, confirm the official signup screen still shows the expected account route and referral field, then use the protected registration path.",
      ],
      boundary: "This comparison cannot confirm product access, regional eligibility, KYC approval, account fee tier, user benefit or final trading cost. Use the official logged-in account flow for the final check.",
      sourceLinks: BYBIT_BITGET_SOURCE_LINKS,
      internalLinks: BYBIT_BITGET_INTERNAL_LINKS.en,
      faq: [
        faq("Does Bybit vs Bitget mean real stocks are available?", "No. Separate ordinary securities, tokenized exposure, stock futures, stock-product pages, copy trading and regional account permissions before treating a stock-related search as an eligible route."),
        faq("Which fees should I compare first?", "Start with the product-specific official table. Bybit xStocks follow the Adventure Zone & xStocks fee schedule, not the ordinary crypto spot row; copy trading also needs the selected trader's profit-sharing rules and account display."),
        faq("How should I compare Bybit and Bitget UTA accounts?", "Do not compare the UTA label alone. Bybit documents spot, spot margin, perpetuals, futures and options plus isolated, cross and portfolio-margin behavior; Bitget documents spot, margin and futures sharing a multi-asset margin pool. Check the live account mode, supported collateral, collateral valuation, borrowing, interest and liquidation rules in the official account before moving funds."),
        faq("Which account conditions can change the result?", "Identity checks, issuing country or region, product permission, account tier, lead-trader rules and official account terms can change the practical route."),
        faq("What should I verify before leaving NexuAlpha?", "Confirm the product label, source date, fee tier, KYC requirement and account route on the official platform. A public comparison is a checklist, not approval or a benefit promise."),
      ],
      seoTitle: "Bybit vs Bitget Stocks, Copy Trading, Fees and Account Checks — NexuAlpha",
      seoDescription: "Compare Bybit and Bitget by product label first: UTA margin, xStocks fee schedule, stock futures, copy-trading profit sharing, KYC, region and signup limits.",
      seoQuestion: "How should I compare Bybit and Bitget before choosing a platform?",
    },
    "zh-Hans": {
      title: "Bybit vs Bitget：先确认产品类型、费用、KYC 与账户路径。",
      body: "先给产品贴准标签。Bybit xStocks、Bybit TradFi 衍生品、Bitget 股票期货、Bitget 股票相关产品页面和加密跟单，是不同路径。先看具体产品的官方费率表：xStocks 走 Adventure Zone & xStocks 费率，不套普通加密现货费率；跟单还要看分润规则和所选交易员/账户页面。",
      reviewedAt: "2026-09-22",
      reviewedLabel: "Bybit 与 Bitget 官方来源核对于 2026-09-22",
      searchIntent: {
        label: "Search Console 信号",
        detail: "本次更新参考了 R41 GSC 队列中 Bybit vs Bitget 对比页的 32 次展示，并覆盖 UTA 对比、Bybit alternatives 和开户注册路径意图。页面先回答用户的选择问题，再引导到官方来源和账户条件核对。",
      },
      decisionCard: {
        eyebrow: "注册前最终怎么选",
        title: "偏产品宽度和 xStocks 核验先看 Bybit；偏合约、跟单流程和 Bitget 专属开户链接，先看 Bitget。",
        suitedForLabel: "适合谁",
        verifyLabel: "先核验什么",
        matrixLabel: "查看详细矩阵",
        evidenceLabel: "展开来源与判断依据",
        picks: {
          bybit: {
            fit: "适合先比较衍生品、xStocks 类敞口、VIP 费率层级和 Bybit 账户路径的用户。",
            verify: "先核验 xStocks 资格、具体产品费率表、KYC 地区、出入金路径，以及是否使用跟单规则。",
          },
          bitget: {
            fit: "适合更关注合约、跟单流程、Bitget 受保护开户注册路径和账户费率条件的用户。",
            verify: "先核验合约权限、股票期货边界、身份认证、当前账户条款，以及官网注册页是否显示对应邀请码。",
          },
        },
      },
      productTypes: [
        ["统一交易账户（UTA）", "两家都发布了 UTA 资料，但结构不能直接视为相同。Bybit 官方资料覆盖现货、现货杠杆、永续、交割和期权，并区分逐仓、全仓与组合保证金；Bitget 官方资料说明现货、杠杆和合约共用多资产保证金池。需在登录账户核对实际模式、支持抵押品、抵押估值或折扣、借贷和清算规则。"],
        ["Bybit xStocks", "属于带有资格、权利和费率边界的代币化表述；xStocks 当前限制美国、英国、EEA、日本、巴西、印度、印尼、土耳其、越南等官方名单地区。"],
        ["Bitget 股票期货", "属于衍生品敞口；Bitget 文件说明股票期货不代表底层股票、股票代币或指数所有权。"],
        ["跟单", "这是跟随策略的账户流程；需查看各平台分润规则，以及所选交易员/账户页面显示的具体成本。"],
      ],
      checks: [
        "产品：区分代币化敞口、股票期货、普通衍生品和跟单。",
        "成本：不要把普通加密现货费率套到 xStocks；按产品分别比较 xStocks、合约、资金费、提现或网络成本、跟单分润。",
        "账户：确认 KYC 等级、证件签发国家或地区、产品权限和实时官方条款。",
      ],
      searchDemand: [
        searchDemand("如果你关心股票类访问", "不要把本对比理解为真实股票可用证明。先区分 xStocks、股票期货、股票相关产品页面和普通加密衍生品。"),
        searchDemand("如果你关心跟单", "先比较分润、交易员资格、账户权限和当前带单规则，再打开任一注册路径。"),
        searchDemand("如果你关心 UTA、统一保证金或 Bybit 替代选择", "先比较统一账户包含的产品、保证金模式、支持抵押品、抵押估值、借贷与清算规则，再判断 Bitget 是否能作为 Bybit 替代选择。相同的 UTA 名称不能证明两家的风险模型或产品权限相同。"),
        searchDemand("如果你关心低费率", "按具体产品的官方费率表、账户等级和地区核对。公开费率行只是检查清单，不是登录后的最终成本。"),
      ],
      nextSteps: [
        "先选准实际需要的产品标签：现货、合约、股票类敞口或跟单。",
        "入金或交易前打开对应官方来源；地区、KYC 和账户等级都会改变结果。",
        "先用 NexuAlpha 平台档案完成研究路径，确认官方路径仍匹配账户且注册页仍显示对应邀请码后，再使用受保护的开户注册路径。",
      ],
      boundary: "本对比不能确认产品可用、地区资格、KYC 通过、账户费率等级、用户权益或最终交易成本；最终以官方登录账户流程为准。",
      sourceLinks: BYBIT_BITGET_SOURCE_LINKS,
      internalLinks: BYBIT_BITGET_INTERNAL_LINKS["zh-Hans"],
      faq: [
        faq("Bybit vs Bitget 是否代表可以买真实股票？", "不是。先区分普通证券、代币化敞口、股票期货、股票相关产品页面、跟单和地区账户权限，再判断是否适合继续。"),
        faq("应该先比较哪些费用？", "先看具体产品的官方费率表。Bybit xStocks 使用 Adventure Zone & xStocks 费率，不是普通加密现货费率；跟单还要看所选交易员的分润规则和账户页面。"),
        faq("Bybit 与 Bitget 的 UTA 应该怎样比较？", "不要只比较 UTA 名称。Bybit 官方资料覆盖现货、现货杠杆、永续、交割和期权，并区分逐仓、全仓与组合保证金；Bitget 官方资料说明现货、杠杆和合约共用多资产保证金池。转入资金前，应在官方登录账户核对实际模式、支持抵押品、抵押估值、借贷利息和清算规则。"),
        faq("哪些账户条件会改变结果？", "身份认证、证件签发国家或地区、产品权限、账户等级、带单规则和官方账户条款，都会改变实际路径。"),
        faq("离开 NexuAlpha 前要确认什么？", "先在官方平台确认产品名称、来源日期、费率等级、KYC 要求和账户路径。公开对比是检查清单，不是批准或权益承诺。"),
      ],
      seoTitle: "Bybit vs Bitget UTA、股票类产品、跟单、费用与账户检查 — NexuAlpha",
      seoDescription: "比较 Bybit 与 Bitget 时先确认产品标签：UTA 保证金、xStocks 费率、股票期货、跟单分润、费用、资金费、KYC 与开户注册路径限制。",
      seoQuestion: "选择平台前应该怎样比较 Bybit 与 Bitget？",
    },
    "zh-Hant": {
      title: "Bybit vs Bitget：先確認產品類型、費用、KYC 與帳戶路徑。",
      body: "先給產品貼準標籤。Bybit xStocks、Bybit TradFi 衍生品、Bitget 股票期貨、Bitget 股票相關產品頁面和加密跟單，是不同路徑。先看具體產品的官方費率表：xStocks 走 Adventure Zone & xStocks 費率，不套普通加密現貨費率；跟單還要看分潤規則和所選交易員/帳戶頁面。",
      reviewedAt: "2026-09-22",
      reviewedLabel: "Bybit 與 Bitget 官方來源核對於 2026-09-22",
      searchIntent: {
        label: "Search Console 訊號",
        detail: "本次更新參考了 R41 GSC 隊列中 Bybit vs Bitget 對比頁的 32 次曝光，並覆蓋 UTA 對比、Bybit alternatives 和開戶註冊路徑意圖。頁面先回答用戶的選擇問題，再引導到官方來源和帳戶條件核對。",
      },
      decisionCard: {
        eyebrow: "註冊前最終怎麼選",
        title: "偏產品寬度和 xStocks 核驗先看 Bybit；偏合約、跟單流程和 Bitget 專屬註冊連結，先看 Bitget。",
        suitedForLabel: "適合誰",
        verifyLabel: "先核驗什麼",
        matrixLabel: "查看詳細矩陣",
        evidenceLabel: "展開來源與判斷依據",
        picks: {
          bybit: {
            fit: "適合先比較衍生品、xStocks 類敞口、VIP 費率層級和 Bybit 帳戶路徑的用戶。",
            verify: "先核驗 xStocks 資格、具體產品費率表、KYC 地區、出入金路徑，以及是否使用跟單規則。",
          },
          bitget: {
            fit: "適合更關注合約、跟單流程、Bitget 受保護開戶註冊路徑和帳戶費率條件的用戶。",
            verify: "先核驗合約權限、股票期貨邊界、身份認證、目前帳戶條款，以及官網註冊頁是否顯示對應邀請碼。",
          },
        },
      },
      productTypes: [
        ["統一交易帳戶（UTA）", "兩家都發布了 UTA 資料，但結構不能直接視為相同。Bybit 官方資料覆蓋現貨、現貨槓桿、永續、交割和期權，並區分逐倉、全倉與組合保證金；Bitget 官方資料說明現貨、槓桿和合約共用多資產保證金池。需在登入帳戶核對實際模式、支援抵押品、抵押估值或折扣、借貸和清算規則。"],
        ["Bybit xStocks", "屬於帶有資格、權利和費率邊界的代幣化表述；xStocks 目前限制美國、英國、EEA、日本、巴西、印度、印尼、土耳其、越南等官方名單地區。"],
        ["Bitget 股票期貨", "屬於衍生品敞口；Bitget 文件說明股票期貨不代表底層股票、股票代幣或指數所有權。"],
        ["跟單", "這是跟隨策略的帳戶流程；需查看各平台分潤規則，以及所選交易員/帳戶頁面顯示的具體成本。"],
      ],
      checks: [
        "產品：區分代幣化敞口、股票期貨、普通衍生品和跟單。",
        "成本：不要把普通加密現貨費率套到 xStocks；按產品分別比較 xStocks、合約、資金費、提現或網路成本、跟單分潤。",
        "帳戶：確認 KYC 等級、證件簽發國家或地區、產品權限和即時官方條款。",
      ],
      searchDemand: [
        searchDemand("如果你關心股票類訪問", "不要把本對比理解為真實股票可用證明。先區分 xStocks、股票期貨、股票相關產品頁面和普通加密衍生品。"),
        searchDemand("如果你關心跟單", "先比較分潤、交易員資格、帳戶權限和目前帶單規則，再打開任一註冊路徑。"),
        searchDemand("如果你關心 UTA、統一保證金或 Bybit 替代選擇", "先比較統一帳戶包含的產品、保證金模式、支援抵押品、抵押估值、借貸與清算規則，再判斷 Bitget 是否能作為 Bybit 替代選擇。相同的 UTA 名稱不能證明兩家的風險模型或產品權限相同。"),
        searchDemand("如果你關心低費率", "按具體產品的官方費率表、帳戶等級和地區核對。公開費率列只是檢查清單，不是登入後的最終成本。"),
      ],
      nextSteps: [
        "先選準實際需要的產品標籤：現貨、合約、股票類敞口或跟單。",
        "入金或交易前打開對應官方來源；地區、KYC 和帳戶等級都會改變結果。",
        "先用 NexuAlpha 平台檔案完成研究路徑，確認官方路徑仍匹配帳戶且註冊頁仍顯示對應邀請碼後，再使用受保護的開戶註冊路徑。",
      ],
      boundary: "本對比不能確認產品可用、地區資格、KYC 通過、帳戶費率等級、用戶權益或最終交易成本；最終以官方登入帳戶流程為準。",
      sourceLinks: BYBIT_BITGET_SOURCE_LINKS,
      internalLinks: BYBIT_BITGET_INTERNAL_LINKS["zh-Hant"],
      faq: [
        faq("Bybit vs Bitget 是否代表可以買真實股票？", "不是。先區分普通證券、代幣化敞口、股票期貨、股票相關產品頁面、跟單和地區帳戶權限，再判斷是否適合繼續。"),
        faq("應該先比較哪些費用？", "先看具體產品的官方費率表。Bybit xStocks 使用 Adventure Zone & xStocks 費率，不是普通加密現貨費率；跟單還要看所選交易員的分潤規則和帳戶頁面。"),
        faq("Bybit 與 Bitget 的 UTA 應該怎樣比較？", "不要只比較 UTA 名稱。Bybit 官方資料覆蓋現貨、現貨槓桿、永續、交割和期權，並區分逐倉、全倉與組合保證金；Bitget 官方資料說明現貨、槓桿和合約共用多資產保證金池。轉入資金前，應在官方登入帳戶核對實際模式、支援抵押品、抵押估值、借貸利息和清算規則。"),
        faq("哪些帳戶條件會改變結果？", "身份認證、證件簽發國家或地區、產品權限、帳戶等級、帶單規則和官方帳戶條款，都會改變實際路徑。"),
        faq("離開 NexuAlpha 前要確認什麼？", "先在官方平台確認產品名稱、來源日期、費率等級、KYC 要求和帳戶路徑。公開對比是檢查清單，不是批准或權益承諾。"),
      ],
      seoTitle: "Bybit vs Bitget UTA、股票類產品、跟單、費用與帳戶檢查 — NexuAlpha",
      seoDescription: "比較 Bybit 與 Bitget 時先確認產品標籤：UTA 保證金、xStocks 費率、股票期貨、跟單分潤、費用、資金費、KYC 與開戶註冊路徑限制。",
      seoQuestion: "選擇平台前應該怎樣比較 Bybit 與 Bitget？",
    },
    ja: {
      title: "Bybit vs Bitget：登録前に商品ルート、手数料、KYC、アカウント画面を確認。",
      body: "まずユーザーの目的を通常の暗号資産デリバティブ、xStocks 型エクスポージャー、株式先物、コピー取引、初回口座開設ルートに分けます。Bybit xStocks、Bybit TradFi デリバティブ、Bitget 株式先物、Bitget の株式関連ページ、暗号資産コピー取引は同じ経路ではありません。公式の商品別手数料表、KYC、地域条件、実際の登録画面を確認してから進めてください。",
      reviewedAt: "2026-09-22",
      reviewedLabel: "Bybit と Bitget の公式ソース確認日：2026-09-22",
      searchIntent: {
        label: "Search Console シグナル",
        detail: "Bybit vs Bitget 比較クラスターの表示データを確認し、選択問題、公式ソース、アカウント条件の順で回答を整理しました。",
      },
      decisionCard: {
        eyebrow: "登録前の最終判断",
        title: "商品幅と xStocks の確認を重視するなら Bybit、先物・コピー取引型ワークフローと保護された Bitget 登録経路を重視するなら Bitget。",
        suitedForLabel: "向いている人",
        verifyLabel: "先に確認",
        matrixLabel: "詳細マトリクス",
        evidenceLabel: "出典と判断根拠",
        picks: {
          bybit: {
            fit: "デリバティブ、xStocks 型エクスポージャー、VIP 手数料階層、Bybit の口座ルートを入金前に比較したいユーザー。",
            verify: "xStocks の利用資格、商品別手数料表、KYC 対象地域、入出金経路、コピー取引を使う場合の条件。",
          },
          bitget: {
            fit: "先物、コピー取引型ワークフロー、保護された Bitget 登録経路、口座レベルの手数料確認を重視するユーザー。",
            verify: "先物アクセス、株式先物の境界、本人確認、現在のアカウント条件、公式登録画面に表示される紹介コード。",
          },
        },
      },
      productTypes: [],
      checks: [],
      searchDemand: [],
      nextSteps: [],
      boundary: "この比較は、商品アクセス、地域資格、KYC 承認、口座手数料階層、ユーザー特典、最終取引コストを確定しません。最終確認は公式ログイン済みアカウントで行ってください。",
      sourceLinks: BYBIT_BITGET_SOURCE_LINKS,
      internalLinks: BYBIT_BITGET_INTERNAL_LINKS.ja,
      faq: [
        faq("Bybit vs Bitget は実際の株式を買えるという意味ですか？", "いいえ。証券、トークン化エクスポージャー、株式先物、コピー取引、地域別アカウント権限を分けて確認してください。"),
        faq("最初に比較すべき手数料は何ですか？", "商品別の公式手数料表です。xStocks、先物、コピー取引は普通の暗号資産現物手数料だけでは判断できません。"),
      ],
      seoTitle: "Bybit vs Bitget：株式型商品、コピー取引、手数料と口座確認 — NexuAlpha",
      seoDescription: "Bybit と Bitget を商品ラベル、xStocks、株式先物、コピー取引、手数料、KYC、地域条件、登録画面で比較します。",
      seoQuestion: "登録前に Bybit と Bitget をどう比較すべきですか？",
    },
    ko: {
      title: "Bybit vs Bitget: 가입 전 수수료, 카피트레이딩과 주식형 노출 확인.",
      body: "Bybit과 Bitget은 공개 수수료표, 파생상품 도구, 카피트레이딩 흐름, 주식 토큰·tokenized stock·stock perp 노출 경계, KYC, 지역 이용 가능성, 공식 가입 조건으로 비교해야 합니다. 주식 관련 검색은 공식 계정 경로를 열기 전 현재 계정 조건으로 다시 확인하세요.",
      reviewedAt: "2026-09-22",
      reviewedLabel: "Bybit 및 Bitget 공식 출처 확인: 2026-09-22",
      productTypes: [],
      checks: [],
      searchDemand: [],
      nextSteps: [],
      boundary: "이 비교는 제품 접근성, 지역 자격, KYC 승인, 계정 수수료 등급, 사용자 혜택 또는 최종 거래 비용을 확인하지 않습니다.",
      sourceLinks: BYBIT_BITGET_SOURCE_LINKS,
      internalLinks: BYBIT_BITGET_INTERNAL_LINKS.ko,
      faq: [
        faq("Bybit vs Bitget 비교가 실제 주식 거래 가능성을 뜻하나요?", "아니요. 실제 증권, tokenized stock, stock perpetual, 카피트레이딩 상품과 지역 계정 가능성을 분리해서 확인해야 합니다."),
        faq("카피트레이딩 등록 경로 전 무엇을 확인해야 하나요?", "KYC 수준, 지역, 상품 권한, 수수료표, lead trader 규칙과 공식 가입 조건을 확인하세요. 공개 비교는 동일한 접근성을 보장하지 않습니다."),
      ],
      seoTitle: "Bybit vs Bitget: 수수료, 카피트레이딩과 주식형 노출 확인 — NexuAlpha",
      seoDescription: "Bybit과 Bitget의 수수료, 파생상품, 카피트레이딩, tokenized stock 또는 stock-perp 노출, KYC, 지역 접근성과 가입 조건을 비교하세요.",
      seoQuestion: "가입 전에 Bybit과 Bitget을 어떻게 비교해야 하나요?",
    },
    ar: {
      title: "Bybit مقابل Bitget: تحقق من مسار المنتج والرسوم وKYC وشاشة الحساب قبل التسجيل.",
      body: "ابدأ بتحديد مسار المستخدم: عقود عملات مشفرة عادية، تعرض شبيه بالأسهم مثل xStocks، عقود أسهم، نسخ تداول، أو فتح حساب لأول مرة. صفحات Bybit xStocks ومشتقات Bybit وBitget stock futures ونسخ التداول ليست مساراً واحداً. راجع جدول الرسوم الرسمي حسب المنتج، ومتطلبات KYC، والمنطقة، وشاشة التسجيل الرسمية قبل المتابعة.",
      reviewedAt: "2026-09-22",
      reviewedLabel: "تمت مراجعة مصادر Bybit وBitget الرسمية في 2026-09-22",
      searchIntent: {
        label: "إشارة Search Console",
        detail: "تمت مراجعة إشارات مجموعة المقارنة Bybit vs Bitget، ولذلك تبدأ الصفحة بمشكلة الاختيار ثم توجه إلى المصادر الرسمية وفحوصات الحساب.",
      },
      decisionCard: {
        eyebrow: "القرار الأخير قبل التسجيل",
        title: "اختر Bybit عند أولوية تنوع المنتجات وفحص xStocks؛ واختر Bitget عندما تناسبك العقود ونسخ التداول ومسار التسجيل المحمي.",
        suitedForLabel: "يناسب من",
        verifyLabel: "تحقق أولاً",
        matrixLabel: "المصفوفة الكاملة",
        evidenceLabel: "مراجعة المصادر وملاحظات القرار",
        picks: {
          bybit: {
            fit: "مستخدمون يقارنون المشتقات، التعرض الشبيه بالأسهم، مستويات رسوم VIP ومسار حساب Bybit قبل الإيداع.",
            verify: "أهلية xStocks، جدول الرسوم حسب المنتج، منطقة KYC، مسار التمويل وشروط نسخ التداول إن وُجدت.",
          },
          bitget: {
            fit: "مستخدمون يركزون على العقود، نسخ التداول، مسار تسجيل Bitget المحمي وفحص رسوم الحساب.",
            verify: "إتاحة العقود، حدود stock futures، التحقق من الهوية، شروط الحساب الحالية وظهور رمز الدعوة في شاشة التسجيل الرسمية.",
          },
        },
      },
      productTypes: [],
      checks: [],
      searchDemand: [],
      nextSteps: [],
      boundary: "هذه المقارنة لا تؤكد الوصول إلى المنتج أو الأهلية الإقليمية أو قبول KYC أو مستوى رسوم الحساب أو مزايا المستخدم أو التكلفة النهائية. استخدم مسار الحساب الرسمي لتأكيد ذلك.",
      sourceLinks: BYBIT_BITGET_SOURCE_LINKS,
      internalLinks: BYBIT_BITGET_INTERNAL_LINKS.ar,
      faq: [
        faq("هل تعني مقارنة Bybit وBitget أن الأسهم الحقيقية متاحة؟", "لا. افصل بين الأوراق المالية، التعرض المرمز، عقود الأسهم، نسخ التداول وصلاحيات الحساب حسب المنطقة."),
        faq("ما الرسوم التي يجب مقارنتها أولاً؟", "ابدأ بجدول الرسوم الرسمي حسب المنتج. xStocks والعقود ونسخ التداول لا تكفي لها رسوم spot العامة وحدها."),
      ],
      seoTitle: "Bybit مقابل Bitget: المنتجات الشبيهة بالأسهم ونسخ التداول والرسوم — NexuAlpha",
      seoDescription: "قارن Bybit وBitget حسب مسار المنتج، xStocks، عقود الأسهم، نسخ التداول، الرسوم، KYC، المنطقة وشاشة التسجيل الرسمية.",
      seoQuestion: "كيف أقارن Bybit وBitget قبل التسجيل؟",
    },
    tr: {
      title: "Bybit vs Bitget: kayıt öncesi ücret, copy trading ve hisse benzeri ürün kontrolleri.",
      body: "Bybit ve Bitget; yayımlanmış ücret çizelgeleri, türev araçları, copy trading akışı, hisse tokenı, tokenized stock veya stock-perp ürün sınırları, KYC, bölgesel uygunluk ve resmi kayıt koşullarıyla karşılaştırılmalıdır. Hisseyle ilgili bir arama, resmî hesap rotası açılmadan önce güncel hesap koşullarıyla kontrol edilmelidir.",
      reviewedAt: "2026-09-22",
      reviewedLabel: "Bybit ve Bitget resmi kaynakları 22 Eylül 2026 tarihinde incelendi",
      productTypes: [],
      checks: [],
      searchDemand: [],
      nextSteps: [],
      boundary: "Bu karşılaştırma ürün erişimini, bölgesel uygunluğu, KYC onayını, hesap ücret seviyesini, kullanıcı avantajını veya nihai işlem maliyetini doğrulamaz.",
      sourceLinks: BYBIT_BITGET_SOURCE_LINKS,
      internalLinks: BYBIT_BITGET_INTERNAL_LINKS.tr,
      faq: [
        faq("Bybit vs Bitget gerçek hisse erişimi anlamına gelir mi?", "Hayır. Gerçek menkul kıymet, tokenized stock, stock perpetual, copy trading ürünü ve bölgesel hesap erişimi ayrı ayrı kontrol edilmelidir."),
        faq("Copy trading registration route'sı öncesi hangi kontroller gerekir?", "KYC seviyesi, bölge, ürün izinleri, ücret çizelgesi, lead trader kuralları ve resmi kayıt koşulları kontrol edilmelidir. Kamuya açık karşılaştırma aynı erişimi garanti etmez."),
      ],
      seoTitle: "Bybit vs Bitget: ücretler, copy trading ve hisse benzeri ürün kontrolleri — NexuAlpha",
      seoDescription: "Bybit ve Bitget ücretlerini, türevleri, copy trading'i, tokenized stock veya stock-perp maruziyetini, KYC'yi, bölgesel erişimi ve kayıt koşullarını karşılaştırın.",
      seoQuestion: "Kayıt olmadan önce Bybit ve Bitget nasıl karşılaştırılmalı?",
    },
  },
  "hyperliquid-vs-dydx": {
    en: {
      title: "Hyperliquid vs dYdX: compare perp fees, funding, liquidation and access checks.",
      body: "Compare Hyperliquid and dYdX by execution model, fee schedule, funding cadence, collateral, liquidation logic, oracle design, wallet-signing route, network dependency, regional limits and official documentation. A lower quoted cost or faster interface does not remove liquidation, bridge, outage or eligibility risk.",
      reviewedAt: "2026-09-22",
      reviewedLabel: "Official Hyperliquid and dYdX sources reviewed September 22, 2026",
      productTypes: [],
      checks: [],
      searchDemand: [],
      nextSteps: [],
      boundary: "This comparison cannot confirm wallet access, regional eligibility, liquidation risk, bridge safety or final trading cost.",
      sourceLinks: HYPERLIQUID_DYDX_SOURCE_LINKS,
      internalLinks: HYPERLIQUID_DYDX_INTERNAL_LINKS,
      faq: [
        faq("Which risk check matters first on Hyperliquid vs dYdX?", "Start with collateral and liquidation. Confirm what asset backs the position, how margin is maintained, how liquidations are triggered, what oracle or price source is used and what happens if the wallet, network, indexer or front end is unavailable."),
        faq("Is Hyperliquid vs dYdX a no-KYC comparison?", "Only partly. Wallet connection can reduce account friction, but no-KYC access still depends on front-end availability, regional restrictions, sanctions controls, product rules, wallet screening and current official terms. Treat it as an access-risk comparison, not an eligibility promise."),
        faq("Should funding rates decide the platform choice?", "Funding is one input, not the whole decision. Compare funding cadence, maker and taker fees, liquidity, collateral movement, liquidation rules, oracle route, withdrawal path and operational recovery before choosing a perpetual venue."),
        faq("Should I read the news explainer or this comparison page?", "Use the news article for the dated source-reading explainer. Use this comparison page for the current decision checklist across fees, funding, collateral, liquidation, wallet route, account access and operational recovery."),
        faq("What dYdX onboarding detail belongs beside the fee comparison?", "Check dYdX onboarding, wallet screening, regional access, bridge route and withdrawal path beside fees and funding. Those source checks can change whether a wallet-connected route is usable before the trade cost is even relevant."),
      ],
      seoTitle: "Hyperliquid vs dYdX: Perp Fees, Funding, Liquidation and Access Checks — NexuAlpha",
      seoDescription: "Compare Hyperliquid and dYdX by fee schedules, funding, collateral, liquidation rules, oracle design, wallet signing, no-KYC access assumptions and official documentation.",
      seoQuestion: "How should I compare Hyperliquid and dYdX as crypto perpetual platforms?",
    },
  },
  "uniswap-vs-jupiter": {
    en: {
      title: "Uniswap vs Jupiter: compare chain, router, token mint, fees and wallet preview before signing.",
      body: "Compare Uniswap and Jupiter as wallet-connected swap routes, not as exchange accounts. Start with chain identity, official app domain, token contract or mint, pool or route source, quote freshness, slippage, price impact, priority fees, approval or Permit2 scope, and the final wallet transaction preview. A working quote or testnet result does not prove mainnet liquidity, token safety, execution quality or regional front-end access.",
      reviewedAt: "2026-09-22",
      reviewedLabel: "Official Uniswap and Jupiter sources reviewed September 22, 2026",
      decisionCard: {
        eyebrow: "Wallet route check",
        title: "Use Uniswap for Ethereum and multichain pool checks; use Jupiter for Solana route aggregation only after mint, route and wallet preview match the intended swap.",
        suitedForLabel: "Who it fits",
        verifyLabel: "Verify first",
        matrixLabel: "Open the source matrix",
        evidenceLabel: "Review source-bound support",
        picks: {
          uniswap: {
            fit: "Users checking Ethereum, Unichain, Base or other Uniswap-supported routes with token contract, router, Permit2 and pool context visible before signing.",
            verify: "Official app domain, selected chain, token contract, pool or route, fee tier, approval spender, gas asset and final wallet simulation.",
          },
          jupiter: {
            fit: "Users checking Solana swaps where the route can span multiple DEX legs and must be verified by mint, route quote, priority fee and built transaction.",
            verify: "Official jup.ag route, token mint, route legs, price impact, slippage, priority fee, platform-fee configuration and final wallet transaction.",
          },
        },
      },
      productTypes: [
        searchDemand("Uniswap route", "Official app, supported chain, token contract, pool version, Universal Router or Permit2 approval, gas and wallet preview."),
        searchDemand("Jupiter route", "Solana mint, route legs, quote freshness, Ultra or Swap API path, priority fee, platform-fee configuration and wallet preview."),
        searchDemand("Not an account comparison", "Neither route is a CEX account opening flow; eligibility, fiat funding and custody claims must stay outside this comparison."),
      ],
      checks: [
        "Chain and token identity before price comparison",
        "Router, pool, route legs, slippage and price-impact checks before signing",
        "Approval, Permit2, priority fee, gas and wallet preview checks before leaving NexuAlpha",
      ],
      searchDemand: [
        searchDemand("If you mean Ethereum or multichain swaps", "Open the Uniswap source trail, then verify the chain, token contract, pool or route and wallet permission."),
        searchDemand("If you mean Solana routing", "Open the Jupiter source trail, then verify the mint, quote, route legs, priority fee and built transaction."),
        searchDemand("If you mean cheapest route", "Do not compare one headline fee. Compare gas, priority fee, slippage, price impact, route reliability and wallet approval scope together."),
      ],
      nextSteps: [
        "Open the Uniswap owner page and confirm the official app, docs, token contract, router or Permit2 scope before any wallet signature.",
      ],
      boundary: "This comparison cannot confirm token safety, route execution, final cost, wallet eligibility, regional front-end availability, approval safety or mainnet liquidity. Treat source links as a pre-signing checklist, not a trading recommendation.",
      sourceLinks: UNISWAP_JUPITER_SOURCE_LINKS,
      internalLinks: UNISWAP_JUPITER_INTERNAL_LINKS,
      faq: [
        faq("Is Uniswap vs Jupiter mainly an Ethereum versus Solana choice?", "Chain is the first split, but the safer comparison also checks token contract or mint, pool or route source, fee tier, slippage, price impact, gas or priority fee and final wallet preview."),
        faq("Does a successful quote prove the swap is safe?", "No. A quote can be stale or point through a route the user should not sign. Verify the official app domain, token identity, route legs, approval scope and wallet transaction before acting."),
        faq("Why does this page link back to the Uniswap owner page?", "The Uniswap owner page carries the deeper source-bound checklist for official app, supported-chain, Universal Router, Permit2, token contract and approval boundaries. It is the primary next step before a live signature."),
      ],
      seoTitle: "Uniswap vs Jupiter: Chain, Route, Fees and Wallet Preview Checks — NexuAlpha",
      seoDescription: "Compare Uniswap and Jupiter by chain, token contract or mint, route source, slippage, gas or priority fees, approval scope and final wallet preview before signing.",
      seoQuestion: "How should I compare Uniswap and Jupiter before signing a swap?",
    },
  },
};
// Market-plan pairs (2026-10-10) share the same shape and resolve through the same helpers below.
Object.assign(compareDirectAnswers, comparePairAnswers);
export { comparePairAnswerSlugs };

const sharedBinanceOkxLinks = {
  ja: [
    internal("Binance プロフィールを見る", "/exchanges/binance"),
    internal("OKX プロフィールを見る", "/exchanges/okx"),
    internal("デリバティブガイドを開く", "/topics/derivatives"),
    internal("Binance Factbook を開く", "/factbook/binance"),
    internal("OKX Factbook を開く", "/factbook/okx"),
  ],
  ko: [
    internal("Binance 프로필 보기", "/exchanges/binance"),
    internal("OKX 프로필 보기", "/exchanges/okx"),
    internal("파생상품 가이드 열기", "/topics/derivatives"),
    internal("Binance Factbook 열기", "/factbook/binance"),
    internal("OKX Factbook 열기", "/factbook/okx"),
  ],
  tr: [
    internal("Binance profilini incele", "/exchanges/binance"),
    internal("OKX profilini incele", "/exchanges/okx"),
    internal("Türev rehberini aç", "/topics/derivatives"),
    internal("Binance factbook aç", "/factbook/binance"),
    internal("OKX factbook aç", "/factbook/okx"),
  ],
  "pt-BR": [
    internal("Revisar perfil Binance", "/exchanges/binance"),
    internal("Revisar perfil OKX", "/exchanges/okx"),
    internal("Abrir guia de derivativos", "/topics/derivatives"),
    internal("Abrir factbook Binance", "/factbook/binance"),
    internal("Abrir factbook OKX", "/factbook/okx"),
  ],
};

const sharedHyperliquidDydxLinks = {
  ja: [
    internal("日付付きソース解説を読む", "/news/hyperliquid-vs-dydx"),
    internal("No-KYC アクセスガイドを開く", "/topics/no-kyc"),
    internal("デリバティブガイドを開く", "/topics/derivatives"),
    internal("Hyperliquid プロフィールを見る", "/exchanges/hyperliquid"),
    internal("dYdX プロフィールを見る", "/exchanges/dydx"),
  ],
  ko: [
    internal("날짜가 있는 출처 해설 읽기", "/news/hyperliquid-vs-dydx"),
    internal("No-KYC 접근 가이드 열기", "/topics/no-kyc"),
    internal("파생상품 가이드 열기", "/topics/derivatives"),
    internal("Hyperliquid 프로필 보기", "/exchanges/hyperliquid"),
    internal("dYdX 프로필 보기", "/exchanges/dydx"),
  ],
  tr: [
    internal("Tarihli kaynak açıklamasını oku", "/news/hyperliquid-vs-dydx"),
    internal("No-KYC erişim rehberini aç", "/topics/no-kyc"),
    internal("Türev rehberini aç", "/topics/derivatives"),
    internal("Hyperliquid profilini incele", "/exchanges/hyperliquid"),
    internal("dYdX profilini incele", "/exchanges/dydx"),
  ],
  "pt-BR": [
    internal("Ler explicador com data e fontes", "/news/hyperliquid-vs-dydx"),
    internal("Abrir guia de acesso sem KYC", "/topics/no-kyc"),
    internal("Abrir guia de derivativos", "/topics/derivatives"),
    internal("Revisar perfil Hyperliquid", "/exchanges/hyperliquid"),
    internal("Revisar perfil dYdX", "/exchanges/dydx"),
  ],
};

Object.assign(ownerQuestionByCompare["binance-vs-okx"], {
  ja: "Binance と OKX は、手数料・商品・KYC・Web3 ルートを確認したうえでどう比較すべきですか？",
  ko: "Binance와 OKX는 수수료, 상품, KYC, Web3 경로를 확인한 뒤 어떻게 비교해야 하나요?",
  tr: "Binance ve OKX ücret, ürün, KYC ve Web3 rotası kontrolünden sonra nasıl karşılaştırılmalı?",
  "pt-BR": "Como comparar Binance e OKX depois de verificar taxas, produtos, KYC e rota Web3?",
});

Object.assign(ownerQuestionByCompare["bybit-vs-bitget"], {
  "pt-BR": "Você deve escolher Bybit ou Bitget pelo produto que realmente precisa?",
});

Object.assign(ownerQuestionByCompare["hyperliquid-vs-dydx"], {
  ja: "Hyperliquid と dYdX は、手数料・資金調達・清算・アクセスリスクを確認した後どう比較すべきですか？",
  ko: "Hyperliquid와 dYdX는 수수료, 펀딩, 청산, 접근 리스크를 확인한 뒤 어떻게 비교해야 하나요?",
  tr: "Hyperliquid ve dYdX ücret, funding, likidasyon ve erişim riski kontrolünden sonra nasıl karşılaştırılmalı?",
  "pt-BR": "Como comparar Hyperliquid e dYdX após revisar taxas, funding, liquidação e risco de acesso?",
});

Object.assign(primaryNextActionByCompare["binance-vs-okx"], {
  ja: ["Binance と OKX の公式ソース確認を先に見る", "/topics/derivatives"],
  ko: ["Binance와 OKX 공식 출처 확인 먼저 보기", "/topics/derivatives"],
  tr: ["Önce Binance ve OKX resmi kaynak kontrollerini incele", "/topics/derivatives"],
  "pt-BR": ["Revisar primeiro as fontes oficiais de Binance e OKX", "/topics/derivatives"],
});

Object.assign(primaryNextActionByCompare["bybit-vs-bitget"], {
  "pt-BR": ["Abrir primeiro a evidência do produto", "/topics/tokenized-stocks-vs-perpetuals"],
});

Object.assign(primaryNextActionByCompare["hyperliquid-vs-dydx"], {
  ja: ["日付付きソース解説を先に読む", "/news/hyperliquid-vs-dydx"],
  ko: ["날짜가 있는 출처 해설 먼저 읽기", "/news/hyperliquid-vs-dydx"],
  tr: ["Önce tarihli kaynak açıklamasını oku", "/news/hyperliquid-vs-dydx"],
  "pt-BR": ["Ler primeiro o explicador com data e fontes", "/news/hyperliquid-vs-dydx"],
});

Object.assign(compareDirectAnswers["binance-vs-okx"], {
  ja: {
    title: "Binance vs OKX：手数料、商品範囲、KYC、Web3 ルートを確認してから選ぶ。",
    body: "Binance と OKX は、公式手数料表、現物・デリバティブの商品範囲、本人確認、地域条件、法定通貨ルート、Web3 ウォレットや DEX 型導線、公式告知の新しさで比較します。公開比較はアカウント権利、手数料保証、地域資格、ユーザー特典を確定しません。",
    reviewedAt: "2026-09-22",
    reviewedLabel: "Binance と OKX の公式ソース確認日：2026-09-22",
    decisionCard: {
      eyebrow: "登録前の最終確認",
      title: "幅広い CEX 深度を重視するなら Binance、Web3 ウォレットや DEX 型ツールの境界確認を重視するなら OKX。",
      suitedForLabel: "向いている人",
      verifyLabel: "先に確認",
      matrixLabel: "詳細マトリクス",
      evidenceLabel: "出典と判断根拠",
      picks: {
        binance: { fit: "流動性、現物・デリバティブ、法定通貨または P2P ルート、標準的な口座フローを比較したいユーザー。", verify: "本人確認の対象地域、入出金ルート、BNB 手数料条件、商品権限、ログイン後の公式手数料階層。" },
        okx: { fit: "CEX アカウントに加え、Web3 ウォレット、DEX 型探索、ボット、Earn、準備金確認を比較したいユーザー。", verify: "地域資格、KYC レベル、Web3 ルートの境界、商品権限、現在の OKX 手数料表。" },
      },
    },
    productTypes: [
      ["CEX アカウント", "手数料、KYC、入出金、商品権限、リスク制御はアカウント、地域、商品ごとに変わります。"],
      ["デリバティブ", "先物や無期限契約の利用可否は、現物、Earn、ボット、Web3 ルートとは別に確認します。"],
      ["Web3 ウォレット", "ウォレット接続、ネットワーク、署名、DEX 型導線は、CEX アカウントの承認や商品権限を意味しません。"],
    ],
    checks: [
      "手数料：公式の現物・先物表、アカウント階層、BNB またはプラットフォーム条件を確認する。",
      "アカウント：本人確認、居住地、地域の入出金、商品権限を公式フローで確認する。",
      "ルート：CEX 口座、Web3 ウォレット、DEX 型機能、デリバティブを同じ経路として扱わない。",
    ],
    searchDemand: [
      searchDemand("低い手数料を探している場合", "商品、マーケット、maker/taker、アカウント階層を先に決めます。公開表は確認リストであり、最終条件ではありません。"),
      searchDemand("Web3 アクセスを探している場合", "OKX ウォレットや DEX 型機能を、CEX 口座、KYC、入金、デリバティブ権限とは分けて確認します。"),
      searchDemand("登録前に決めたい場合", "公式ドメイン、商品範囲、地域条件、本人確認を先に確認し、その後に該当プロフィールを開きます。"),
    ],
    nextSteps: [
      "まず目的を選ぶ：現物口座、先物口座、Web3 ウォレット、または調査のみ。",
      "費用や商品権限を既知として扱う前に、公式の手数料と KYC ソースを開く。",
      "NexuAlpha のプロフィールと Factbook で出典を確認し、公式画面で地域・商品・本人確認を再確認する。",
    ],
    boundary: "この比較は商品アクセス、地域資格、本人確認承認、ユーザー特典、最終取引コストを確定しません。最終確認は公式アカウントまたはウォレット手続きで行ってください。",
    sourceLinks: BINANCE_OKX_SOURCE_LINKS,
    internalLinks: sharedBinanceOkxLinks.ja,
    faq: [
      faq("Binance vs OKX は主に手数料比較ですか？", "手数料は重要ですが、商品範囲、KYC、地域資格、Web3 ルート、公式告知、出典日も同時に確認する必要があります。"),
      faq("このページで自分のアカウントが商品を取引できるか分かりますか？", "いいえ。確認すべき項目を絞るページです。最終的な可否は地域、本人確認、商品ルール、公式アカウント条件で決まります。"),
      faq("登録ルートを開く前に何を確認しますか？", "公式ドメイン、必要な商品、手数料ソース、KYC 要件、地域条件を確認します。パートナー経路は承認や最終コストを保証しません。"),
    ],
    seoTitle: "Binance vs OKX：手数料、商品、KYC、Web3 アクセス確認 — NexuAlpha",
    seoDescription: "Binance と OKX を公式手数料、商品範囲、本人確認、地域条件、Web3 ルート、口座資格の境界で比較します。",
    seoQuestion: "Binance と OKX は登録前にどう比較すべきですか？",
  },
  ko: {
    title: "Binance vs OKX: 수수료, 상품 범위, KYC, Web3 경로를 확인한 뒤 선택.",
    body: "Binance와 OKX는 공식 수수료표, 현물·파생상품 범위, 본인 확인, 지역 제한, 법정화폐 경로, Web3 지갑 또는 DEX형 접근, 공식 공지 출처로 비교해야 합니다. 공개 비교는 계정 권한, 수수료 보장, 지역 자격 또는 사용자 혜택을 확정하지 않습니다.",
    reviewedAt: "2026-09-22",
    reviewedLabel: "Binance 및 OKX 공식 출처 확인: 2026-09-22",
    decisionCard: {
      eyebrow: "가입 전 최종 확인",
      title: "넓은 CEX 깊이가 필요하면 Binance, Web3 지갑과 DEX형 도구의 경계 확인이 중요하면 OKX를 먼저 검토하세요.",
      suitedForLabel: "적합한 사용자",
      verifyLabel: "먼저 확인",
      matrixLabel: "전체 매트릭스",
      evidenceLabel: "출처와 판단 근거",
      picks: {
        binance: { fit: "유동성, 현물·파생상품, 법정화폐 또는 P2P 경로, 익숙한 계정 흐름을 비교하려는 사용자.", verify: "본인 확인 가능 지역, 입출금 경로, BNB 수수료 규칙, 상품 권한, 로그인 후 공식 수수료 등급." },
        okx: { fit: "CEX 계정과 Web3 지갑, DEX형 탐색, 봇, Earn, 준비금 확인을 함께 비교하려는 사용자.", verify: "지역 이용 가능성, KYC 단계, Web3 경로 경계, 상품 권한, 최신 OKX 수수료표." },
      },
    },
    productTypes: [
      ["CEX 계정", "수수료, KYC, 입출금, 상품 권한, 위험 통제는 계정, 지역, 상품에 따라 달라집니다."],
      ["파생상품", "선물 또는 perpetual 접근성은 현물, Earn, 봇, Web3 경로와 분리해 확인해야 합니다."],
      ["Web3 지갑 경로", "지갑 연결, 네트워크, 서명, DEX형 기능은 CEX 계정 승인이나 상품 권한을 의미하지 않습니다."],
    ],
    checks: [
      "수수료: 공식 현물·선물표, 계정/VIP 등급, BNB 또는 플랫폼 조건을 확인합니다.",
      "계정: 본인 확인, 거주 지역, 현지 입출금, 상품 권한을 공식 흐름에서 확인합니다.",
      "경로: CEX 계정, Web3 지갑, DEX형 기능, 파생상품을 같은 경로로 취급하지 않습니다.",
    ],
    searchDemand: [
      searchDemand("낮은 수수료를 찾는 경우", "상품, 시장, maker/taker 방향, 계정 등급을 먼저 정하세요. 공개표는 확인 목록이지 최종 계정 조건이 아닙니다."),
      searchDemand("Web3 접근을 찾는 경우", "OKX 지갑 또는 DEX형 기능을 CEX 계정, KYC, 입금, 파생상품 접근과 분리해 확인하세요."),
      searchDemand("가입 전에 결정하려는 경우", "공식 도메인, 상품 접근, 지역 조건, 본인 확인을 확인한 뒤 해당 플랫폼 프로필을 여세요."),
    ],
    nextSteps: [
      "먼저 경로를 선택합니다: 현물 계정, 선물 계정, Web3 지갑, 또는 조사 전용.",
      "비용이나 상품 접근을 확정하기 전에 공식 수수료와 KYC 출처를 엽니다.",
      "NexuAlpha 프로필과 Factbook으로 출처를 확인하고, 공식 화면에서 지역·상품·본인 확인을 다시 확인합니다.",
    ],
    boundary: "이 비교는 상품 접근성, 지역 자격, 본인 확인 승인, 사용자 혜택 또는 최종 거래 비용을 확정하지 않습니다. 최종 확인은 공식 계정 또는 지갑 절차에서 해야 합니다.",
    sourceLinks: BINANCE_OKX_SOURCE_LINKS,
    internalLinks: sharedBinanceOkxLinks.ko,
    faq: [
      faq("Binance vs OKX는 주로 수수료 비교인가요?", "수수료는 중요하지만 상품 범위, KYC, 지역 자격, Web3 경로, 공식 공지, 출처 날짜도 함께 확인해야 합니다."),
      faq("이 페이지가 내 계정의 거래 가능 여부를 결정하나요?", "아니요. 확인해야 할 항목을 좁혀 줍니다. 최종 접근성은 지역, 인증 상태, 상품 규칙, 공식 계정 조건에 따라 달라집니다."),
      faq("가입 경로를 열기 전 무엇을 확인해야 하나요?", "공식 도메인, 필요한 상품, 수수료 출처, KYC 요구 사항, 지역 조건을 확인하세요. 파트너 경로는 승인이나 최종 비용을 보장하지 않습니다."),
    ],
    seoTitle: "Binance vs OKX: 수수료, 상품, KYC, Web3 접근 확인 — NexuAlpha",
    seoDescription: "Binance와 OKX를 공식 수수료, 상품 범위, 본인 확인, 지역 조건, Web3 경로와 계정 자격 경계로 비교하세요.",
    seoQuestion: "가입 전 Binance와 OKX를 어떻게 비교해야 하나요?",
  },
  tr: {
    title: "Binance vs OKX: ücretleri, ürünleri, KYC'yi ve Web3 rotasını kontrol ederek seçin.",
    body: "Binance ve OKX; resmi ücret tabloları, spot ve türev ürün kapsamı, kimlik doğrulama, bölgesel koşullar, fiat rotaları, Web3 cüzdanı veya DEX benzeri erişim ve resmi duyuru kaynaklarıyla karşılaştırılmalıdır. Açık karşılaştırma hesap hakkı, ücret garantisi, bölgesel uygunluk veya kullanıcı avantajı doğrulamaz.",
    reviewedAt: "2026-09-22",
    reviewedLabel: "Binance ve OKX resmi kaynakları 22 Eylül 2026 tarihinde incelendi",
    decisionCard: {
      eyebrow: "Kayıt öncesi son kontrol",
      title: "Geniş CEX derinliği için Binance; Web3 cüzdanı ve DEX benzeri araç sınırları önemliyse OKX daha önce incelenmeli.",
      suitedForLabel: "Kime uygun",
      verifyLabel: "Önce doğrula",
      matrixLabel: "Tam matris",
      evidenceLabel: "Kaynakları ve karar notlarını incele",
      picks: {
        binance: { fit: "Likidite, spot ve türev ürünler, fiat veya P2P rotaları ve alışılmış hesap akışı arayan kullanıcılar.", verify: "Kimlik doğrulama uygunluğu, yerel fiat rotaları, BNB ücret kuralları, ürün erişimi ve hesap içindeki resmi ücret seviyesi." },
        okx: { fit: "CEX hesabını Web3 cüzdanı, DEX benzeri keşif, botlar, Earn ve rezerv kontrolleriyle birlikte karşılaştıran kullanıcılar.", verify: "Bölgesel uygunluk, KYC seviyesi, Web3 rota sınırları, ürün izinleri ve güncel OKX ücret tablosu." },
      },
    },
    productTypes: [
      ["CEX hesabı", "Ücretler, KYC, yatırma-çekme, ürün izinleri ve risk kontrolleri hesap, bölge ve ürüne göre değişir."],
      ["Türevler", "Vadeli veya perpetual erişimi spot, Earn, botlar ve Web3 rotalarından ayrı doğrulanmalıdır."],
      ["Web3 cüzdan rotası", "Cüzdan bağlantısı, ağ, imza ve DEX benzeri işlevler CEX hesap onayı veya ürün izni anlamına gelmez."],
    ],
    checks: [
      "Ücret: resmi spot ve futures tablolarını, hesap/VIP seviyesini ve BNB ya da platform koşullarını kontrol edin.",
      "Hesap: kimlik doğrulama, ikamet, yerel yatırma-çekme ve ürün izinlerini resmi akışta doğrulayın.",
      "Rota: CEX hesabı, Web3 cüzdanı, DEX benzeri işlevler ve türevleri aynı yol gibi ele almayın.",
    ],
    searchDemand: [
      searchDemand("Daha düşük ücret arıyorsanız", "Önce ürün, piyasa, maker/taker tarafı ve hesap seviyesini belirleyin. Kamuya açık tablolar son hesap teklifi değil, kontrol listesidir."),
      searchDemand("Web3 erişimi arıyorsanız", "OKX cüzdanı veya DEX benzeri işlevleri CEX hesabı, KYC, yatırma ve türev erişiminden ayrı kontrol edin."),
      searchDemand("Kayıt öncesi karar veriyorsanız", "Resmi domain, ürün erişimi, bölgesel koşullar ve kimlik doğrulama gereğini kontrol edip sonra platform profilini açın."),
    ],
    nextSteps: [
      "Önce rotayı seçin: spot hesabı, futures hesabı, Web3 cüzdanı veya yalnızca araştırma.",
      "Maliyet veya ürün erişimini biliniyor saymadan önce resmi ücret ve KYC kaynaklarını açın.",
      "NexuAlpha profilleri ve factbook ile kaynakları kontrol edin; resmi ekranda bölge, ürün ve kimlik koşulunu yeniden doğrulayın.",
    ],
    boundary: "Bu karşılaştırma ürün erişimini, bölgesel uygunluğu, KYC onayını, kullanıcı avantajını veya nihai işlem maliyetini doğrulamaz. Son kontrol resmi hesap veya cüzdan akışında yapılmalıdır.",
    sourceLinks: BINANCE_OKX_SOURCE_LINKS,
    internalLinks: sharedBinanceOkxLinks.tr,
    faq: [
      faq("Binance vs OKX temelde ücret karşılaştırması mı?", "Ücretler önemlidir, ancak ürün kapsamı, KYC, bölgesel uygunluk, Web3 rotası, resmi duyurular ve kaynak tarihi de kontrol edilmelidir."),
      faq("Bu sayfa hesabımın bir ürünü kullanıp kullanamayacağını belirler mi?", "Hayır. Sadece kontrol edilmesi gereken alanları daraltır. Nihai erişim resmi hesap akışı, bölge, doğrulama durumu, ürün kuralları ve platform şartlarına bağlıdır."),
      faq("Kayıt rotasını açmadan önce ne doğrulanmalı?", "Resmi domain, gerekli ürün, ücret kaynağı, KYC koşulu ve bölgesel şartlar kontrol edilmelidir. Partner rotası onay veya nihai maliyet garantisi değildir."),
    ],
    seoTitle: "Binance vs OKX: ücret, ürün, KYC ve Web3 erişim kontrolleri — NexuAlpha",
    seoDescription: "Binance ve OKX'i resmi ücretler, ürün kapsamı, kimlik doğrulama, bölgesel koşullar, Web3 rotası ve hesap uygunluğu sınırlarıyla karşılaştırın.",
    seoQuestion: "Kayıt öncesi Binance ve OKX nasıl karşılaştırılmalı?",
  },
  "pt-BR": {
    title: "Binance vs OKX: compare taxas, produtos, KYC e acesso Web3 antes de escolher.",
    body: "Compare Binance e OKX por tabelas oficiais de taxa, disponibilidade por produto, verificação de identidade, restrições regionais, rotas fiat, acesso Web3 ou estilo DEX e fontes de anúncio. Uma comparação pública não confirma direito de conta, custo final, elegibilidade regional ou benefício do usuário.",
    reviewedAt: "2026-09-22",
    reviewedLabel: "Fontes oficiais de Binance e OKX revisadas em 22 de setembro de 2026",
    decisionCard: {
      eyebrow: "Última checagem antes do cadastro",
      title: "Use Binance quando precisar de profundidade CEX ampla; use OKX quando carteira Web3 e ferramentas estilo DEX forem mais relevantes.",
      suitedForLabel: "Para quem serve",
      verifyLabel: "Verificar primeiro",
      matrixLabel: "Matriz completa",
      evidenceLabel: "Revisar fontes e notas de decisão",
      picks: {
        binance: { fit: "Usuários que comparam liquidez, produtos spot e derivativos, fiat/P2P e um fluxo de conta CEX tradicional.", verify: "Elegibilidade de identidade, rotas fiat locais, regras de taxa com BNB, acesso a produtos e tabela oficial exibida na conta." },
        okx: { fit: "Usuários que comparam conta CEX com carteira Web3, descoberta estilo DEX, bots, Earn e prova de reservas.", verify: "Elegibilidade regional, nível KYC, limites da rota Web3, permissões de produto e tabela atual de taxas OKX." },
      },
    },
    productTypes: [
      ["Conta CEX", "Taxas, KYC, depósito, saque, permissões de produto e controles de risco variam por conta, região e produto."],
      ["Derivativos", "Acesso a futures ou perpetual deve ser verificado separadamente de spot, Earn, bots e rotas Web3."],
      ["Rota Web3 ou carteira", "Conexão de carteira, rede, assinatura e funções estilo DEX não equivalem a aprovação de conta CEX ou permissão de produto."],
    ],
    checks: [
      "Taxas: confira tabelas oficiais de spot e futures, nível da conta e condições de BNB ou da plataforma.",
      "Conta: confirme identidade, residência, depósito/saque local e permissões de produto no fluxo oficial.",
      "Rota: não trate conta CEX, carteira Web3, funções estilo DEX e derivativos como caminhos intercambiáveis.",
    ],
    searchDemand: [
      searchDemand("Se você procura taxas menores", "Defina produto, mercado, lado maker/taker e nível da conta. Tabelas públicas são checklist, não oferta final da conta."),
      searchDemand("Se você procura acesso Web3", "Revise carteira OKX ou funções estilo DEX separadamente de conta CEX, KYC, depósito e acesso a derivativos."),
      searchDemand("Se você decide antes do cadastro", "Confira domínio oficial, acesso ao produto, condições regionais e identidade antes de abrir a página da plataforma."),
    ],
    nextSteps: [
      "Escolha primeiro a rota: conta spot, conta futures, carteira Web3 ou pesquisa sem cadastro.",
      "Abra as fontes oficiais de taxas e KYC antes de tratar custo ou acesso como conhecido.",
      "Use perfis e factbooks da NexuAlpha para revisar fontes; confirme região, produto e identidade na tela oficial.",
    ],
    boundary: "Esta comparação não confirma acesso a produto, elegibilidade regional, aprovação KYC, benefício do usuário ou custo final de trading. A checagem final acontece no fluxo oficial da conta ou carteira.",
    sourceLinks: BINANCE_OKX_SOURCE_LINKS,
    internalLinks: sharedBinanceOkxLinks["pt-BR"],
    faq: [
      faq("Binance vs OKX é principalmente uma comparação de taxas?", "Taxas importam, mas a decisão segura também verifica escopo de produto, KYC, elegibilidade regional, rota Web3, anúncios oficiais e data das fontes."),
      faq("Esta página decide se minha conta pode operar um produto?", "Não. Ela reduz o que deve ser verificado. O acesso final depende do fluxo oficial da conta, região, status de verificação, regras do produto e termos da plataforma."),
      faq("O que revisar antes de abrir a rota de cadastro?", "Confira domínio oficial, produto necessário, fonte de taxa, exigência de KYC e condições regionais. Uma rota parceira não confirma aprovação nem custo final."),
    ],
    seoTitle: "Binance vs OKX: taxas, produtos, KYC e acesso Web3 — NexuAlpha",
    seoDescription: "Compare Binance e OKX por taxas oficiais, escopo spot e derivativos, identidade, condições regionais, acesso Web3 e limites de elegibilidade da conta.",
    seoQuestion: "Como comparar Binance e OKX antes de escolher uma exchange?",
  },
});

Object.assign(compareDirectAnswers["bybit-vs-bitget"], {
  ja: {
    ...compareDirectAnswers["bybit-vs-bitget"].ja,
    productTypes: [
      ["初回口座開設ルート", "公式登録画面に地域、本人確認要件、口座条件、紹介コード欄が表示されることを確認してから使います。比較ページは口座承認ではありません。"],
      ["統一取引アカウント（UTA）", "Bybit と Bitget はどちらも UTA を説明しますが、証拠金モード、対応担保、担保評価、借入、清算ルールは別物です。ログイン後の実口座で確認してください。"],
      ["Bybit xStocks", "トークン化された株式型エクスポージャーで、資格、権利、商品別手数料が分かれます。対象外地域は公式リストで確認します。"],
      ["Bitget 株式先物", "デリバティブ型のエクスポージャーです。Bitget の説明では、原資産株式、株式トークン、指数の所有権を意味しません。"],
      ["コピー取引", "フォロー型の取引フローです。利益分配ルール、選択したトレーダー、アカウント条件を見てから判断します。"],
    ],
    checks: [
      "商品：トークン化エクスポージャー、株式先物、通常デリバティブ、コピー取引を分ける。",
      "費用：xStocks、先物、資金調達、出金・ネットワーク費用、コピー取引の分配条件を商品別に見る。",
      "アカウント：KYC レベル、証明書発行国・地域、商品権限、公式登録画面を確認する。",
    ],
    searchDemand: [
      searchDemand("株式型アクセスを探している場合", "実際の株式を買える証明として扱わず、xStocks、株式先物、株式関連ページ、通常の暗号資産デリバティブを分けます。"),
      searchDemand("コピー取引を探している場合", "利益分配、トレーダー資格、アカウント権限、現在のリードトレーダールールを確認してから開きます。"),
      searchDemand("UTA や統一証拠金を探している場合", "含まれる商品、証拠金モード、対応担保、担保評価、借入、清算ルールを比較します。同じ UTA 名称は同じリスクモデルを意味しません。"),
      searchDemand("低い手数料を探している場合", "商品別の公式表、アカウント階層、地域で確認します。公開行は最終ログイン後コストではありません。"),
    ],
    nextSteps: [
      "必要な商品ラベルを選ぶ：現物、先物、株式型エクスポージャー、コピー取引。",
      "入金や取引前に該当する公式ソースを開く。地域、KYC、アカウント階層で結果が変わります。",
      "デリバティブならチェックリスト、株式型検索ならトークン化株式ガイドを使う。",
      "NexuAlpha のプロフィールで調査し、公式画面で地域と紹介コード欄を確認してから保護された登録経路を使う。",
    ],
    faq: [
      ...compareDirectAnswers["bybit-vs-bitget"].ja.faq,
      faq("Bybit と Bitget の UTA は同じですか？", "いいえ。名称は似ていますが、担保、証拠金、借入、清算、商品権限は異なります。資金移動前に公式アカウントで確認してください。"),
    ],
  },
  ko: {
    title: "Bybit vs Bitget: 가입 전 수수료, 카피트레이딩과 주식형 노출 확인.",
    body: "Bybit과 Bitget은 공개 수수료표, 파생상품 도구, 카피트레이딩 흐름, 주식형 노출 경계, KYC, 지역 이용 가능성, 공식 가입 조건으로 비교해야 합니다. 주식 관련 검색은 공식 계정 경로를 열기 전 현재 계정 조건으로 다시 확인하세요.",
    reviewedAt: "2026-09-22",
    reviewedLabel: "Bybit 및 Bitget 공식 출처 확인: 2026-09-22",
    searchIntent: { label: "Search Console 신호", detail: "Bybit vs Bitget 비교 클러스터의 노출 신호를 검토해 선택 문제, 공식 출처, 계정 조건 순서로 정리했습니다." },
    decisionCard: {
      eyebrow: "가입 전 최종 판단",
      title: "상품 폭과 xStocks 확인은 Bybit, futures·copy trading 흐름과 Bitget 보호 가입 경로는 Bitget을 먼저 검토하세요.",
      suitedForLabel: "적합한 사용자",
      verifyLabel: "먼저 확인",
      matrixLabel: "전체 매트릭스",
      evidenceLabel: "출처와 판단 근거",
      picks: {
        bybit: { fit: "파생상품, xStocks형 노출, VIP 수수료 등급, Bybit 계정 경로를 입금 전 비교하려는 사용자.", verify: "xStocks 자격, 상품별 수수료표, KYC 지역, 입출금 경로, 카피트레이딩 조건." },
        bitget: { fit: "futures, copy trading형 워크플로, 보호된 Bitget 온보딩, 계정별 수수료 확인을 중시하는 사용자.", verify: "futures 접근, 주식 선물 경계, 본인 확인, 현재 계정 조건, 지역 이용 가능 여부 확인." },
      },
    },
    productTypes: [
      ["첫 계정 경로", "공식 가입 화면의 지역, 본인 확인, 계정 조건, 추천 코드 입력란을 확인한 뒤 사용합니다. 비교 페이지는 계정 승인이 아닙니다."],
      ["통합 거래 계정 UTA", "두 플랫폼 모두 UTA를 설명하지만 담보, 마진 모드, 차입, 청산 규칙은 다릅니다. 실제 로그인 계정에서 확인해야 합니다."],
      ["Bybit xStocks", "자격, 권리, 상품별 수수료가 분리된 주식형 토큰 노출입니다. 제한 지역은 공식 목록으로 확인합니다."],
      ["Bitget 주식 선물", "파생상품 노출입니다. 기초 주식, 주식 토큰 또는 지수 소유권을 의미하지 않습니다."],
      ["카피트레이딩", "팔로워 전략 흐름입니다. 수익 배분, 트레이더 조건, 계정 권한을 확인해야 합니다."],
    ],
    checks: [
      "상품: 토큰형 노출, 주식 선물, 일반 파생상품, 카피트레이딩을 구분합니다.",
      "비용: xStocks, futures, funding, 출금·네트워크 비용, 카피트레이딩 배분을 상품별로 확인합니다.",
      "계정: KYC 단계, 지역, 상품 권한, 실시간 공식 조건을 확인합니다.",
    ],
    searchDemand: [
      searchDemand("주식형 접근을 찾는 경우", "실제 주식 이용 가능성으로 해석하지 말고 xStocks, 주식 선물, 주식 관련 페이지, 일반 암호화폐 파생상품을 분리하세요."),
      searchDemand("카피트레이딩을 찾는 경우", "수익 배분, 트레이더 자격, 계정 권한, 현재 리드 트레이더 규칙을 먼저 비교하세요."),
      searchDemand("UTA 또는 통합 마진을 찾는 경우", "계정 안의 상품, 마진 모드, 지원 담보, 담보 평가, 차입, 청산 규칙을 비교하세요. 같은 UTA 명칭은 같은 리스크 모델을 의미하지 않습니다."),
      searchDemand("낮은 수수료를 찾는 경우", "상품별 공식표, 계정 등급, 지역으로 확인하세요. 공개 수수료표는 최종 로그인 비용이 아닙니다."),
    ],
    nextSteps: [
      "먼저 실제 필요한 상품 라벨을 선택합니다: spot, futures, 주식형 노출, 카피트레이딩.",
      "입금 또는 거래 전 해당 공식 출처를 여세요. 지역, KYC, 계정 등급이 결과를 바꿀 수 있습니다.",
      "일반 futures라면 파생상품 체크리스트를, 주식형 노출이라면 토큰화 주식 가이드를 사용하세요.",
      "NexuAlpha 프로필로 조사하고 공식 가입 화면의 계정 경로와 지역 이용 가능 여부 확인 후 보호된 경로를 사용하세요.",
    ],
    boundary: "이 비교는 상품 접근성, 지역 자격, KYC 승인, 계정 수수료 등급, 사용자 혜택 또는 최종 거래 비용을 확인하지 않습니다. 최종 확인은 공식 로그인 계정에서 해야 합니다.",
    sourceLinks: BYBIT_BITGET_SOURCE_LINKS,
    internalLinks: BYBIT_BITGET_INTERNAL_LINKS.ko,
    faq: [
      faq("Bybit vs Bitget 비교가 실제 주식 거래 가능성을 뜻하나요?", "아니요. 실제 증권, 토큰형 노출, 주식 선물, 카피트레이딩 상품과 지역 계정 가능성을 분리해서 확인해야 합니다."),
      faq("어떤 수수료를 먼저 비교해야 하나요?", "상품별 공식 수수료표부터 보세요. xStocks, futures, 카피트레이딩은 일반 암호화폐 spot 수수료만으로 판단할 수 없습니다."),
      faq("Bybit과 Bitget UTA는 어떻게 비교해야 하나요?", "UTA 명칭만 비교하지 마세요. 담보, 마진 모드, 차입, 이자, 청산 규칙과 상품 권한을 공식 계정에서 확인해야 합니다."),
      faq("카피트레이딩 등록 경로 전 무엇을 확인해야 하나요?", "KYC 수준, 지역, 상품 권한, 수수료표, lead trader 규칙과 공식 가입 조건을 확인하세요. 공개 비교는 동일한 접근성을 보장하지 않습니다."),
    ],
    seoTitle: "Bybit vs Bitget: 수수료, 카피트레이딩과 주식형 노출 확인 — NexuAlpha",
    seoDescription: "Bybit과 Bitget의 수수료, 파생상품, 카피트레이딩, xStocks 또는 주식 선물 노출, KYC, 지역 접근성과 가입 조건을 비교하세요.",
    seoQuestion: "가입 전에 Bybit과 Bitget을 어떻게 비교해야 하나요?",
  },
  tr: {
    title: "Bybit vs Bitget: kayıt öncesi ücret, copy trading ve hisse benzeri ürün kontrolleri.",
    body: "Bybit ve Bitget; yayımlanmış ücret çizelgeleri, türev araçları, copy trading akışı, hisse benzeri ürün sınırları, KYC, bölgesel uygunluk ve resmi kayıt koşullarıyla karşılaştırılmalıdır. Hisseyle ilgili bir arama, resmî hesap rotası açılmadan önce güncel hesap koşullarıyla kontrol edilmelidir.",
    reviewedAt: "2026-09-22",
    reviewedLabel: "Bybit ve Bitget resmi kaynakları 22 Eylül 2026 tarihinde incelendi",
    searchIntent: { label: "Search Console sinyali", detail: "Bybit vs Bitget karşılaştırma kümesi için görünürlük sinyalleri incelendi; yanıt seçim problemi, resmi kaynaklar ve hesap koşulları sırasıyla düzenlendi." },
    decisionCard: {
      eyebrow: "Kayıt öncesi son karar",
      title: "Ürün genişliği ve xStocks kontrolü için Bybit; futures, copy trading akışı ve korumalı Bitget kayıt rotası için Bitget önce incelenmeli.",
      suitedForLabel: "Kime uygun",
      verifyLabel: "Önce doğrula",
      matrixLabel: "Tam matris",
      evidenceLabel: "Kaynakları ve karar notlarını incele",
      picks: {
        bybit: { fit: "Türevleri, xStocks benzeri maruziyeti, VIP ücret seviyelerini ve Bybit hesap rotasını fonlama öncesi karşılaştıran kullanıcılar.", verify: "xStocks uygunluğu, ürün özel ücret çizelgesi, KYC bölgesi, fonlama rotası ve copy trading koşulları." },
        bitget: { fit: "Futures, copy trading iş akışı, korumalı Bitget onboarding ve hesap seviyesi ücret kontrollerine odaklanan kullanıcılar.", verify: "Futures erişimi, stock futures sınırları, kimlik doğrulama, güncel hesap koşulları ve Bölgesel uygunluğu doğrula." },
      },
    },
    productTypes: [
      ["İlk hesap rotası", "Resmi kayıt ekranında bölge, kimlik koşulu, hesap şartları ve referral-code alanı görünmeden bu rota tamamlanmış sayılmaz."],
      ["Unified Trading Account UTA", "İki platform da UTA anlatır; fakat teminat, marjin modu, borçlanma ve likidasyon kuralları aynı değildir."],
      ["Bybit xStocks", "Uygunluk, haklar ve ürün özel ücretleri ayrı olan hisse benzeri token maruziyetidir; kısıtlı bölgeler resmi listeden kontrol edilir."],
      ["Bitget stock futures", "Türev maruziyetidir; dayanak hisse, hisse tokenı veya endeks sahipliği anlamına gelmez."],
      ["Copy trading", "Takipçi stratejisi akışıdır; kâr paylaşımı, trader koşulları ve hesap izinleri kontrol edilmelidir."],
    ],
    checks: [
      "Ürün: tokenized exposure, stock futures, normal türevler ve copy trading ayrılmalıdır.",
      "Maliyet: xStocks, futures, funding, çekim-ağ maliyeti ve copy trading paylaşımı ürün bazında kontrol edilmelidir.",
      "Hesap: KYC seviyesi, bölge, ürün izni ve Resmi kaynak doğrulaması bekleniyor durumları resmi akışta doğrulanmalıdır.",
    ],
    searchDemand: [
      searchDemand("Hisse benzeri erişim arıyorsanız", "Bunu gerçek hisse erişimi kanıtı saymayın; xStocks, stock futures, hisse ürün sayfaları ve normal kripto türevlerini ayırın."),
      searchDemand("Copy trading arıyorsanız", "Kâr paylaşımı, trader uygunluğu, hesap izinleri ve güncel lead-trader kurallarını karşılaştırın."),
      searchDemand("UTA veya unified margin arıyorsanız", "Ürün kapsamı, marjin modu, desteklenen teminat, teminat değerlemesi, borçlanma ve likidasyon kurallarını karşılaştırın."),
      searchDemand("Düşük ücret arıyorsanız", "Ürün özel resmi tablo, hesap seviyesi ve bölge ile kontrol edin. Kamuya açık satırlar final hesap maliyeti değildir."),
    ],
    nextSteps: [
      "Önce gerçek ürün etiketini seçin: spot, futures, hisse benzeri maruziyet veya copy trading.",
      "Fonlama veya işlem öncesi ilgili resmi kaynağı açın; bölge, KYC ve hesap seviyesi sonucu değiştirebilir.",
      "Normal futures için türev kontrol listesini, hisse benzeri arama için tokenized stock rehberini kullanın.",
      "NexuAlpha profiliyle araştırın, resmi kayıt ekranını kontrol edin ve sonra korumalı kayıt rotasını kullanın.",
    ],
    boundary: "Bu karşılaştırma ürün erişimini, bölgesel uygunluğu, KYC onayını, hesap ücret seviyesini, kullanıcı avantajını veya nihai işlem maliyetini doğrulamaz. Son kontrol resmi hesaptadır.",
    sourceLinks: BYBIT_BITGET_SOURCE_LINKS,
    internalLinks: BYBIT_BITGET_INTERNAL_LINKS.tr,
    faq: [
      faq("Bybit vs Bitget gerçek hisse erişimi anlamına gelir mi?", "Hayır. Gerçek menkul kıymet, tokenized exposure, stock futures, copy trading ürünü ve bölgesel hesap erişimi ayrı ayrı kontrol edilmelidir."),
      faq("Önce hangi ücretler karşılaştırılmalı?", "Ürün özel resmi ücret çizelgesiyle başlayın. xStocks, futures ve copy trading, normal kripto spot ücretleriyle tek başına değerlendirilemez."),
      faq("Bybit ve Bitget UTA nasıl karşılaştırılmalı?", "Sadece UTA adını karşılaştırmayın. Teminat, marjin modu, borçlanma, faiz, likidasyon ve ürün izinleri resmi hesapta kontrol edilmelidir."),
      faq("Copy trading registration route'sı öncesi hangi kontroller gerekir?", "KYC seviyesi, bölge, ürün izinleri, ücret çizelgesi, lead trader kuralları ve resmi kayıt koşulları kontrol edilmelidir."),
    ],
    seoTitle: "Bybit vs Bitget: ücretler, copy trading ve hisse benzeri ürün kontrolleri — NexuAlpha",
    seoDescription: "Bybit ve Bitget ücretlerini, türevleri, copy trading'i, xStocks veya stock futures maruziyetini, KYC'yi, bölgesel erişimi ve kayıt koşullarını karşılaştırın.",
    seoQuestion: "Kayıt olmadan önce Bybit ve Bitget nasıl karşılaştırılmalı?",
  },
  "pt-BR": {
    title: "Bybit vs Bitget: escolha pela rota do produto e depois verifique taxas, KYC e tela da conta.",
    body: "Comece nomeando a rota: futures cripto comuns, exposição estilo xStocks, stock futures, copy trading ou primeira conta. Bybit xStocks, derivativos TradFi da Bybit, stock futures da Bitget, páginas de produtos de ações da Bitget e copy trading cripto são caminhos diferentes. Compare primeiro a tabela oficial específica do produto, KYC, região e a tela oficial de cadastro.",
    reviewedAt: "2026-09-22",
    reviewedLabel: "Fontes oficiais de Bybit e Bitget revisadas em 22 de setembro de 2026",
    searchIntent: { label: "Sinal do Search Console", detail: "O cluster Bybit vs Bitget foi revisado para responder primeiro ao problema de escolha, depois encaminhar para fontes oficiais e checagens da conta." },
    decisionCard: {
      eyebrow: "Última decisão antes do cadastro",
      title: "Escolha Bybit para amplitude de produtos e xStocks; escolha Bitget quando futures, copy trading e onboarding protegido fizerem mais sentido.",
      suitedForLabel: "Para quem serve",
      verifyLabel: "Verificar primeiro",
      matrixLabel: "Matriz completa",
      evidenceLabel: "Revisar fontes e notas de decisão",
      picks: {
        bybit: { fit: "Usuários comparando derivativos, exposição estilo xStocks, níveis VIP de taxa e rota de conta Bybit antes de depositar.", verify: "Elegibilidade xStocks, tabela de taxa do produto, região KYC, rota de depósito e termos de copy trading se usados." },
        bitget: { fit: "Usuários focados em futures, fluxo de copy trading, onboarding protegido da Bitget e checagens de taxa na conta.", verify: "Acesso a futures, limites de stock futures, identidade, termos atuais da conta e código exibido na tela oficial." },
      },
    },
    productTypes: [
      ["Primeira conta", "Use apenas depois que a tela oficial mostrar região, identidade, termos da conta e campo de código; uma comparação não aprova a conta."],
      ["Conta unificada UTA", "As duas plataformas publicam material de UTA, mas margem, colateral, empréstimo e liquidação não são equivalentes."],
      ["Bybit xStocks", "Exposição tokenizada com elegibilidade, direitos e taxa específica do produto; regiões restritas devem ser checadas na fonte oficial."],
      ["Bitget stock futures", "Exposição derivativa; não representa propriedade da ação, token de ação ou índice subjacente."],
      ["Copy trading", "Fluxo de seguir estratégia; revise partilha de resultado, trader escolhido e permissões da conta."],
    ],
    checks: [
      "Produto: separe exposição tokenizada, stock futures, derivativos comuns e copy trading.",
      "Custo: não use taxa spot comum para xStocks; compare taxa do produto, funding, saque, rede e partilha do copy trading.",
      "Conta: confirme nível KYC, região, permissão do produto e termos oficiais atuais.",
    ],
    searchDemand: [
      searchDemand("Se você procura acesso a ações", "Não trate como prova de ações reais disponíveis. Separe xStocks, stock futures, páginas de produto de ação e derivativos cripto comuns."),
      searchDemand("Se você procura copy trading", "Compare partilha de resultado, elegibilidade do trader, permissões da conta e regras atuais antes de abrir a rota."),
      searchDemand("Se você procura UTA ou margem unificada", "Compare produtos dentro da conta, modo de margem, colateral aceito, avaliação, empréstimo e liquidação. O mesmo nome UTA não prova o mesmo risco."),
      searchDemand("Se você procura taxas menores", "Use a tabela oficial do produto, nível da conta e região. Linhas públicas são checklist, não custo final logado."),
    ],
    nextSteps: [
      "Escolha o produto real: spot, futures, exposição tipo ação ou copy trading.",
      "Abra a fonte oficial correspondente antes de depositar ou operar; região, KYC e nível da conta mudam o resultado.",
      "Use o checklist de derivativos para futures comuns e o guia de ações tokenizadas para exposição tipo ação.",
      "Use perfis NexuAlpha para pesquisa, confirme a tela oficial de cadastro e só então use a rota protegida.",
    ],
    boundary: "Esta comparação não confirma acesso a produto, elegibilidade regional, aprovação KYC, nível de taxa da conta, benefício do usuário ou custo final. A checagem final ocorre na conta oficial logada.",
    sourceLinks: BYBIT_BITGET_SOURCE_LINKS,
    internalLinks: BYBIT_BITGET_INTERNAL_LINKS["pt-BR"],
    faq: [
      faq("Bybit vs Bitget significa que ações reais estão disponíveis?", "Não. Separe valores mobiliários, exposição tokenizada, stock futures, páginas de produto, copy trading e permissões regionais da conta."),
      faq("Quais taxas comparar primeiro?", "Comece pela tabela oficial específica do produto. xStocks, futures e copy trading não podem ser avaliados apenas pela taxa spot cripto comum."),
      faq("Como comparar contas UTA de Bybit e Bitget?", "Não compare só o rótulo UTA. Verifique colateral, modo de margem, empréstimo, juros, liquidação e permissões de produto na conta oficial."),
      faq("O que verificar antes de sair da NexuAlpha?", "Confirme produto, data da fonte, nível de taxa, KYC e rota da conta na plataforma oficial. A comparação pública é checklist, não aprovação."),
    ],
    seoTitle: "Bybit vs Bitget: ações tokenizadas, copy trading, taxas e conta — NexuAlpha",
    seoDescription: "Compare Bybit e Bitget por rótulo do produto: xStocks, stock futures, copy trading, taxas, funding, KYC, região e limites da rota de conta.",
    seoQuestion: "Como comparar Bybit e Bitget antes de escolher uma plataforma?",
  },
});

Object.assign(compareDirectAnswers["hyperliquid-vs-dydx"], {
  ja: {
    title: "Hyperliquid vs dYdX：Perp 手数料、資金調達、清算、アクセスリスクを比較。",
    body: "Hyperliquid と dYdX は、実行モデル、手数料表、資金調達の頻度、担保、清算ロジック、オラクル設計、ウォレット署名、ネットワーク依存、地域制限、公式ドキュメントで比較します。表示コストが低い、または画面が速いことは、清算、ブリッジ、障害、地域資格のリスクを消しません。",
    reviewedAt: "2026-09-22",
    reviewedLabel: "Hyperliquid と dYdX の公式ソース確認日：2026-09-22",
    decisionCard: {
      eyebrow: "ウォレット接続前の最終確認",
      title: "高速なオンチェーン風 Perp 体験を重視するなら Hyperliquid、dYdX の文書化されたオンボーディングとチェーン構造を確認したいなら dYdX。",
      suitedForLabel: "向いている人",
      verifyLabel: "先に確認",
      matrixLabel: "詳細マトリクス",
      evidenceLabel: "出典と判断根拠",
      picks: {
        hyperliquid: { fit: "ウォレット接続、低摩擦の Perp 画面、担保と清算ルールを自分で確認できるユーザー。", verify: "手数料、資金調達、担保、清算、フロントエンド可用性、地域制限。" },
        dydx: { fit: "dYdX のオンボーディング、ブリッジ、手数料パラメータ、チェーン依存を文書で確認したいユーザー。", verify: "ウォレットスクリーニング、地域アクセス、ブリッジ、出金経路、公式パラメータ。" },
      },
    },
    productTypes: [
      ["ウォレット接続 Perp", "アカウント登録が軽くても、ウォレット、フロントエンド、地域制限、制裁チェック、商品ルールは残ります。"],
      ["担保と証拠金", "ポジションを支える資産、担保評価、維持証拠金、清算条件を先に確認します。"],
      ["資金調達と手数料", "maker/taker、資金調達頻度、流動性、出金経路を一緒に見ます。"],
    ],
    checks: [
      "清算：担保、維持証拠金、価格ソース、清算トリガーを確認する。",
      "アクセス：ウォレット、地域、制裁チェック、フロントエンド、ネットワーク障害時の復旧を確認する。",
      "コスト：手数料、資金調達、スリッページ、ブリッジまたは出金経路を分けて確認する。",
    ],
    searchDemand: [
      searchDemand("No-KYC を探している場合", "ウォレット接続は摩擦を下げますが、地域制限、スクリーニング、公式条件を消しません。"),
      searchDemand("低い Perp 手数料を探している場合", "maker/taker、資金調達、流動性、出金経路を一緒に比較します。"),
      searchDemand("清算リスクを調べている場合", "担保、オラクル、価格ソース、ネットワーク停止時の動作を先に確認します。"),
    ],
    nextSteps: [
      "担保、清算、資金調達を読んでからウォレット接続を判断する。",
      "地域制限、制裁チェック、フロントエンド可用性を確認する。",
      "日付付きニュース解説でソース文脈を読み、この比較ページで現在のチェックリストに戻る。",
    ],
    boundary: "この比較はウォレットアクセス、地域資格、本人確認不要の可否、清算リスク、ブリッジ安全性、最終取引コストを確定しません。",
    sourceLinks: HYPERLIQUID_DYDX_SOURCE_LINKS,
    internalLinks: sharedHyperliquidDydxLinks.ja,
    faq: [
      faq("Hyperliquid vs dYdX で最初に見るリスクは何ですか？", "担保と清算です。どの資産がポジションを支え、証拠金がどう維持され、どの価格ソースで清算されるかを確認します。"),
      faq("Hyperliquid vs dYdX は No-KYC 比較ですか？", "一部だけです。ウォレット接続でも地域制限、スクリーニング、商品ルール、公式条件は残ります。"),
      faq("資金調達率だけで選べますか？", "いいえ。資金調達は一要素です。手数料、流動性、担保移動、清算、オラクル、出金と復旧を合わせて比較します。"),
    ],
    seoTitle: "Hyperliquid vs dYdX：Perp 手数料、資金調達、清算、アクセス確認 — NexuAlpha",
    seoDescription: "Hyperliquid と dYdX を手数料、資金調達、担保、清算、オラクル、ウォレット署名、No-KYC 前提、公式ドキュメントで比較します。",
    seoQuestion: "暗号資産 Perp プラットフォームとして Hyperliquid と dYdX をどう比較すべきですか？",
  },
  ko: {
    title: "Hyperliquid vs dYdX: perp 수수료, funding, 청산, 접근 리스크 비교.",
    body: "Hyperliquid와 dYdX는 실행 모델, 수수료표, funding 주기, 담보, 청산 로직, oracle 설계, 지갑 서명 경로, 네트워크 의존성, 지역 제한, 공식 문서로 비교해야 합니다. 낮은 표시 비용이나 빠른 인터페이스가 청산, 브리지, 장애, 지역 자격 리스크를 없애지는 않습니다.",
    reviewedAt: "2026-09-22",
    reviewedLabel: "Hyperliquid 및 dYdX 공식 출처 확인: 2026-09-22",
    decisionCard: {
      eyebrow: "지갑 연결 전 최종 확인",
      title: "빠른 perp 실행 경험은 Hyperliquid, 문서화된 onboarding·브리지·체인 구조 확인은 dYdX를 먼저 보세요.",
      suitedForLabel: "적합한 사용자",
      verifyLabel: "먼저 확인",
      matrixLabel: "전체 매트릭스",
      evidenceLabel: "출처와 판단 근거",
      picks: {
        hyperliquid: { fit: "지갑 연결, 빠른 perp 화면, 담보와 청산 규칙을 직접 확인할 수 있는 사용자.", verify: "수수료, funding, 담보, 청산, 프런트엔드 가용성, 지역 제한." },
        dydx: { fit: "dYdX onboarding, 브리지, 수수료 파라미터, 체인 의존성을 문서로 확인하려는 사용자.", verify: "지갑 스크리닝, 지역 접근, 브리지, 출금 경로, 공식 파라미터." },
      },
    },
    productTypes: [
      ["지갑 연결 perp", "계정 마찰이 낮아도 지갑, 프런트엔드, 지역 제한, 제재 확인, 상품 규칙은 남아 있습니다."],
      ["담보와 마진", "포지션을 뒷받침하는 자산, 담보 평가, 유지 증거금, 청산 조건을 먼저 확인합니다."],
      ["Funding과 수수료", "maker/taker, funding 주기, 유동성, 출금 경로를 함께 봅니다."],
    ],
    checks: [
      "청산: 담보, 유지 마진, 가격 소스, 청산 트리거를 확인합니다.",
      "접근: 지갑, 지역, 스크리닝, 프런트엔드, 네트워크 장애 시 복구를 확인합니다.",
      "비용: 수수료, funding, 슬리피지, 브리지 또는 출금 경로를 분리해 확인합니다.",
    ],
    searchDemand: [
      searchDemand("No-KYC를 찾는 경우", "지갑 연결은 마찰을 낮추지만 지역 제한, 스크리닝, 공식 조건을 제거하지 않습니다."),
      searchDemand("낮은 perp 수수료를 찾는 경우", "maker/taker, funding, 유동성, 출금 경로를 함께 비교하세요."),
      searchDemand("청산 리스크를 확인하는 경우", "담보, oracle, 가격 소스, 네트워크 중단 시 동작을 먼저 확인하세요."),
    ],
    nextSteps: [
      "담보, 청산, funding을 읽은 뒤 지갑 연결 여부를 결정합니다.",
      "지역 제한, 스크리닝, 프런트엔드 가용성을 확인합니다.",
      "날짜가 있는 뉴스 해설로 출처 맥락을 읽고 이 비교 페이지의 체크리스트로 돌아옵니다.",
    ],
    boundary: "이 비교는 지갑 접근, 지역 자격, KYC 면제 가능성, 청산 리스크, 브리지 안전성 또는 최종 거래 비용을 확정하지 않습니다.",
    sourceLinks: HYPERLIQUID_DYDX_SOURCE_LINKS,
    internalLinks: sharedHyperliquidDydxLinks.ko,
    faq: [
      faq("Hyperliquid vs dYdX에서 먼저 볼 리스크는 무엇인가요?", "담보와 청산입니다. 어떤 자산이 포지션을 뒷받침하고, 마진이 어떻게 유지되며, 어떤 가격 소스로 청산되는지 확인하세요."),
      faq("Hyperliquid vs dYdX는 No-KYC 비교인가요?", "부분적으로만 그렇습니다. 지갑 연결이라도 지역 제한, 스크리닝, 상품 규칙, 공식 조건은 남아 있습니다."),
      faq("Funding rate만으로 선택해도 되나요?", "아니요. funding은 하나의 입력입니다. 수수료, 유동성, 담보 이동, 청산, oracle, 출금과 복구를 함께 비교하세요."),
    ],
    seoTitle: "Hyperliquid vs dYdX: perp 수수료, funding, 청산과 접근 확인 — NexuAlpha",
    seoDescription: "Hyperliquid와 dYdX를 수수료, funding, 담보, 청산 규칙, oracle, 지갑 서명, No-KYC 가정과 공식 문서로 비교하세요.",
    seoQuestion: "암호화폐 perpetual 플랫폼으로 Hyperliquid와 dYdX를 어떻게 비교해야 하나요?",
  },
  tr: {
    title: "Hyperliquid vs dYdX: perp ücretleri, funding, likidasyon ve erişim kontrolleri.",
    body: "Hyperliquid ve dYdX; yürütme modeli, ücret çizelgesi, funding sıklığı, teminat, likidasyon mantığı, oracle tasarımı, cüzdan imzalama rotası, ağ bağımlılığı, bölgesel sınırlar ve resmi belgelerle karşılaştırılmalıdır. Daha düşük görünen maliyet veya hızlı arayüz likidasyon, köprü, kesinti ya da uygunluk riskini kaldırmaz.",
    reviewedAt: "2026-09-22",
    reviewedLabel: "Hyperliquid ve dYdX resmi kaynakları 22 Eylül 2026 tarihinde incelendi",
    decisionCard: {
      eyebrow: "Cüzdan bağlamadan önce son kontrol",
      title: "Hızlı perp deneyimi için Hyperliquid; belgelenmiş onboarding, köprü ve zincir yapısı için dYdX önce incelenmeli.",
      suitedForLabel: "Kime uygun",
      verifyLabel: "Önce doğrula",
      matrixLabel: "Tam matris",
      evidenceLabel: "Kaynakları ve karar notlarını incele",
      picks: {
        hyperliquid: { fit: "Cüzdan bağlantısı, hızlı perp ekranı, teminat ve likidasyon kurallarını kendisi kontrol edebilen kullanıcılar.", verify: "Ücret, funding, teminat, likidasyon, frontend erişimi ve bölgesel sınırlama." },
        dydx: { fit: "dYdX onboarding, köprü, ücret parametreleri ve zincir bağımlılığını belgeyle kontrol etmek isteyen kullanıcılar.", verify: "Cüzdan taraması, bölgesel erişim, köprü, çekim rotası ve resmi parametreler." },
      },
    },
    productTypes: [
      ["Cüzdan bağlantılı perp", "Hesap sürtünmesi düşük olsa da cüzdan, frontend, bölgesel sınır, yaptırım kontrolü ve ürün kuralları kalır."],
      ["Teminat ve marjin", "Pozisyonu destekleyen varlık, teminat değerlemesi, sürdürme marjini ve likidasyon şartları önce kontrol edilir."],
      ["Funding ve ücret", "Maker/taker, funding sıklığı, likidite ve çekim rotası birlikte değerlendirilir."],
    ],
    checks: [
      "Likidasyon: teminat, sürdürme marjini, fiyat kaynağı ve tetikleyiciler kontrol edilir.",
      "Erişim: cüzdan, bölge, tarama, frontend ve ağ kesintisinde kurtarma yolu kontrol edilir.",
      "Maliyet: ücret, funding, slippage, köprü veya çekim rotası ayrı ayrı doğrulanır.",
    ],
    searchDemand: [
      searchDemand("No-KYC arıyorsanız", "Cüzdan bağlantısı sürtünmeyi azaltır; bölgesel sınırlar, tarama ve resmi koşullar devam eder."),
      searchDemand("Düşük perp ücreti arıyorsanız", "Maker/taker, funding, likidite ve çekim rotasını birlikte karşılaştırın."),
      searchDemand("Likidasyon riski araştırıyorsanız", "Teminat, oracle, fiyat kaynağı ve ağ durduğunda ne olduğu önce kontrol edilmelidir."),
    ],
    nextSteps: [
      "Cüzdan bağlamadan önce teminat, likidasyon ve funding kaynaklarını okuyun.",
      "Bölgesel sınır, tarama ve frontend erişilebilirliğini kontrol edin.",
      "Tarihli haber açıklamasında kaynak bağlamını okuyup bu sayfadaki karar listesine dönün.",
    ],
    boundary: "Bu karşılaştırma cüzdan erişimini, bölgesel uygunluğu, KYC muafiyetini, likidasyon riskini, köprü güvenliğini veya nihai işlem maliyetini doğrulamaz.",
    sourceLinks: HYPERLIQUID_DYDX_SOURCE_LINKS,
    internalLinks: sharedHyperliquidDydxLinks.tr,
    faq: [
      faq("Hyperliquid vs dYdX'te ilk risk kontrolü nedir?", "Teminat ve likidasyondur. Pozisyonu hangi varlık destekliyor, marjin nasıl korunuyor ve hangi fiyat kaynağıyla likidasyon tetikleniyor kontrol edilmelidir."),
      faq("Hyperliquid vs dYdX bir No-KYC karşılaştırması mı?", "Kısmen. Cüzdan bağlantısı hesap sürtünmesini azaltabilir, fakat bölge, tarama, ürün kuralları ve resmi şartlar devam eder."),
      faq("Funding rate platform seçimini belirler mi?", "Hayır. Funding sadece bir girdidir. Ücret, likidite, teminat hareketi, likidasyon, oracle, çekim ve kurtarma birlikte karşılaştırılmalıdır."),
    ],
    seoTitle: "Hyperliquid vs dYdX: perp ücretleri, funding, likidasyon ve erişim — NexuAlpha",
    seoDescription: "Hyperliquid ve dYdX'i ücretler, funding, teminat, likidasyon kuralları, oracle, cüzdan imzası, No-KYC varsayımı ve resmi belgelerle karşılaştırın.",
    seoQuestion: "Kripto perpetual platformu olarak Hyperliquid ve dYdX nasıl karşılaştırılmalı?",
  },
  "pt-BR": {
    title: "Hyperliquid vs dYdX: compare taxas perp, funding, liquidação e risco de acesso.",
    body: "Compare Hyperliquid e dYdX por modelo de execução, tabela de taxas, cadência de funding, colateral, lógica de liquidação, oracle, rota de assinatura da carteira, dependência de rede, limites regionais e documentação oficial. Custo aparente menor ou interface mais rápida não remove risco de liquidação, bridge, indisponibilidade ou elegibilidade.",
    reviewedAt: "2026-09-22",
    reviewedLabel: "Fontes oficiais de Hyperliquid e dYdX revisadas em 22 de setembro de 2026",
    decisionCard: {
      eyebrow: "Última checagem antes de conectar carteira",
      title: "Use Hyperliquid para uma experiência perp rápida; use dYdX quando onboarding documentado, bridge e estrutura de rede forem prioridade.",
      suitedForLabel: "Para quem serve",
      verifyLabel: "Verificar primeiro",
      matrixLabel: "Matriz completa",
      evidenceLabel: "Revisar fontes e notas de decisão",
      picks: {
        hyperliquid: { fit: "Usuários que aceitam conexão de carteira, tela perp rápida e checagem própria de colateral e liquidação.", verify: "Taxas, funding, colateral, liquidação, disponibilidade do front end e limites regionais." },
        dydx: { fit: "Usuários que querem revisar onboarding dYdX, bridge, parâmetros de taxas e dependência de rede em documentação.", verify: "Triagem da carteira, acesso regional, bridge, saque e parâmetros oficiais." },
      },
    },
    productTypes: [
      ["Perp conectado à carteira", "Menos fricção de conta não elimina carteira, front end, restrição regional, triagem e regras do produto."],
      ["Colateral e margem", "Revise ativo que sustenta a posição, avaliação do colateral, margem de manutenção e condições de liquidação."],
      ["Funding e taxa", "Avalie maker/taker, cadência de funding, liquidez e rota de saque juntos."],
    ],
    checks: [
      "Liquidação: confirme colateral, margem de manutenção, fonte de preço e gatilhos.",
      "Acesso: revise carteira, região, triagem, front end e recuperação em falha de rede.",
      "Custo: separe taxa, funding, slippage, bridge e rota de saque.",
    ],
    searchDemand: [
      searchDemand("Se você procura no-KYC", "Conexão de carteira reduz fricção, mas limites regionais, triagem e termos oficiais continuam valendo."),
      searchDemand("Se você procura menor taxa perp", "Compare maker/taker, funding, liquidez e rota de saque juntos."),
      searchDemand("Se você procura risco de liquidação", "Confira colateral, oracle, fonte de preço e comportamento em indisponibilidade de rede ou interface."),
    ],
    nextSteps: [
      "Leia colateral, liquidação e funding antes de conectar a carteira.",
      "Verifique limites regionais, triagem e disponibilidade do front end.",
      "Use o explicador com data para contexto das fontes e volte a esta checklist de decisão.",
    ],
    boundary: "Esta comparação não confirma acesso de carteira, elegibilidade regional, isenção de KYC, risco de liquidação, segurança de bridge ou custo final de trading.",
    sourceLinks: HYPERLIQUID_DYDX_SOURCE_LINKS,
    internalLinks: sharedHyperliquidDydxLinks["pt-BR"],
    faq: [
      faq("Qual risco vem primeiro em Hyperliquid vs dYdX?", "Comece por colateral e liquidação. Confirme o ativo que sustenta a posição, manutenção da margem, gatilhos e fonte de preço."),
      faq("Hyperliquid vs dYdX é uma comparação no-KYC?", "Apenas em parte. Conexão de carteira pode reduzir fricção, mas acesso depende de região, triagem, regras do produto e termos oficiais atuais."),
      faq("Funding rate decide a escolha?", "Não. Funding é um fator. Compare taxas, liquidez, movimento de colateral, liquidação, oracle, saque e recuperação operacional."),
    ],
    seoTitle: "Hyperliquid vs dYdX: taxas perp, funding, liquidação e acesso — NexuAlpha",
    seoDescription: "Compare Hyperliquid e dYdX por taxas, funding, colateral, liquidação, oracle, assinatura de carteira, premissas no-KYC e documentação oficial.",
    seoQuestion: "Como comparar Hyperliquid e dYdX como plataformas perp cripto?",
  },
});

// Search-demand pairs use the same checked fee facts as the visible comparison matrix.
// A fee winner is scoped to the base schedule, never to account eligibility or net cost.
export const strikingDistanceComparePairs = Object.freeze([
  "binance-vs-kraken", "binance-vs-okx", "binance-vs-bybit", "bybit-vs-bitget",
  "okx-vs-bybit", "gate-io-vs-mexc", "hyperliquid-vs-dydx", "coinbase-vs-gate-io",
]);
function strikingDistanceAnswer(slug, locale, existing) {
  if (!strikingDistanceComparePairs.includes(slug) || !["en", "zh-Hans"].includes(locale)) return existing;
  const [a, b] = slug.split("-vs-");
  const left = factsForVenue(a), right = factsForVenue(b);
  const nameA = a === "gate-io" ? "Gate.io" : left?.name || a;
  const nameB = b === "gate-io" ? "Gate.io" : right?.name || b;
  const product = slug === "hyperliquid-vs-dydx" ? "perp" : "spot";
  const fa = feeFact(a, product), fb = feeFact(b, product);
  const zh = locale === "zh-Hans";
  const label = product === "perp" ? (zh ? "永续合约" : "perpetual") : (zh ? "现货" : "spot");
  const checked = [fa, fb].every((f) => f.state === "checked" && Number.isFinite(f.maker) && Number.isFinite(f.taker));
  let verdict, outcome;
  if (!checked) verdict = zh ? `目前不能确认 ${nameA} 与 ${nameB} 谁的${label}手续费更低：双方尚未都有已核验的基础费率。` : `No ${label} fee winner can be verified between ${nameA} and ${nameB}: at least one checked base schedule is unavailable.`;
  else {
    const aLower = fa.maker <= fb.maker && fa.taker <= fb.taker;
    const bLower = fb.maker <= fa.maker && fb.taker <= fa.taker;
    outcome = aLower && bLower ? (zh ? "双方基础费率相同" : "the base schedules tie") : aLower || bLower ? (zh ? `${aLower ? nameA : nameB} 的基础费率更低` : `${aLower ? nameA : nameB} has lower base fees`) : (zh ? "Maker 与 Taker 各有优势，不能确定单一赢家" : "neither venue wins both maker and taker fees");
    verdict = zh ? `${label}手续费：${outcome}（${nameA} ${feePair(fa.maker, fa.taker, locale)}；${nameB} ${feePair(fb.maker, fb.taker, locale)}，依次为 Maker / Taker）。` : `On ${label} fees, ${outcome} (${nameA} ${feePair(fa.maker, fa.taker, locale)}; ${nameB} ${feePair(fb.maker, fb.taker, locale)}, maker / taker).`;
  }
  const boundary = zh ? "以上为已核验来源的基础费率快照；账户等级、代币折扣、返佣、资金费率与地区资格仍需在官方账户确认。" : "These are checked base-fee snapshots; verify account tiers, token discounts, rebates, funding and regional eligibility in the official account.";
  const title = zh ? `${nameA} vs ${nameB}：手续费、KYC 与返佣对比（2026）— NexuAlpha` : `${nameA} vs ${nameB}: fees, KYC & rebates (2026) | NexuAlpha`;
  const heading = zh ? `${nameB} vs ${nameA}：谁的手续费更低？` : `${nameB} vs ${nameA}: who has lower fees?`;
  const sourceLinks = [...new Set([...(left?.sourceUrls || []), ...(right?.sourceUrls || [])])].map((href) => [zh ? "官方费率来源" : "Official fee source", href]);
  // 2026-10-22 GSC: retain the canonical URL while putting the observed query order first.
  const query = locale === 'en' ? ({
    'binance-vs-kraken': 'Kraken vs Binance',
    'binance-vs-bybit': 'Binance vs Bybit',
    'okx-vs-bybit': 'OKX vs Bybit',
  })[slug] : null;
  const queryAnswer = query ? `${query}: ${verdict.charAt(0).toLowerCase()}${verdict.slice(1)} ${boundary}` : null;
  const queryFaq = query ? [[`${query}: can account tiers change the fee comparison?`, boundary]] : [];
  if (query && slug === 'binance-vs-kraken') queryFaq.push([
    'Kraken ou Binance: how do their spot fees compare?',
    `The search “Kraken ou Binance” asks the same comparison. ${verdict} ${boundary}`,
  ]);
  return {
    checks: [], nextSteps: [], faq: [], productTypes: [],
    internalLinks: [[nameA, `/exchanges/${a}`], [nameB, `/exchanges/${b}`]],
    sourceLinks, reviewedAt: FACTS_AS_OF, ...existing,
    title: query ? `${query}: who has lower spot fees?` : heading,
    body: `${queryAnswer || `${verdict} ${boundary}`}${existing?.body ? ` ${existing.body}` : ""}`,
    shortAnswer: queryAnswer,
    boundary: existing?.boundary || boundary,
    ownerQuestion: query ? `${query}: fees, KYC and account checks` : zh ? `${nameA} vs ${nameB}：手续费、KYC 与返佣如何比较？` : `${nameA} vs ${nameB}: how do fees, KYC and rebates compare?`,
    decisionCard: { ...existing?.decisionCard, title: query ? `${query}: who has lower spot fees?` : heading },
    faq: [...(existing?.faq || []), ...queryFaq],
    seoTitle: query ? `${query}: spot fees & KYC (2026)` : title,
    seoDescription: query && checked ? `${query}: ${nameA} ${feePair(fa.maker, fa.taker, locale)}; ${nameB} ${feePair(fb.maker, fb.taker, locale)} spot maker/taker. ${outcome.charAt(0).toUpperCase()}${outcome.slice(1)}; verify tiers and region.` : `${verdict} ${boundary}`,
    seoQuestion: query ? `${query}: who has lower spot fees?` : heading,
  };
}

export function compareDirectAnswerFor(slug, locale = "en") {
  const normalizedLocale = normalizeCompareAnswerLocale(locale);
  const record = compareDirectAnswers[slug];
  if (!normalizedLocale || !supportedLocales.has(normalizedLocale)) return null;
  const answer = strikingDistanceAnswer(slug, normalizedLocale, record?.[normalizedLocale] || compareDirectAnswerDrafts[slug]?.[normalizedLocale]);
  if (!answer) return null;
  return {
    slug,
    locale: normalizedLocale,
    ownerQuestion: ownerQuestionByCompare[slug]?.[normalizedLocale] || answer.seoQuestion || answer.title,
    primaryNextAction: primaryNextActionByCompare[slug]?.[normalizedLocale] || answer.internalLinks?.[0] || null,
    ...answer,
  };
}

export function compareSeoOverrideFromDirectAnswer(slug, locale = "en") {
  const answer = compareDirectAnswerFor(slug, locale);
  if (!answer) return null;
  return {
    title: answer.seoTitle,
    completeFaq: true,
    description: answer.seoDescription,
    reviewedAt: answer.reviewedAt,
    directAnswer: {
      question: answer.seoQuestion,
      answer: answer.body,
    },
    faq: answer.faq,
    relatedLinks: answer.internalLinks.map(([, href]) => href),
    sourceUrls: answer.sourceLinks.map(([, href]) => href),
  };
}

export { normalizeCompareAnswerLocale };

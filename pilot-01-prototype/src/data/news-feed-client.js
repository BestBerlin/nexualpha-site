import { localizedHref } from "./locale-routing.js";
import { stripPlainMarkdown } from "./news-content-repair.js";
import { newsReadTimes } from "./news-read-time.js";
import { withoutNeutralReferralEditions } from "./neutral-referral-topic.js";

export const NEWS_FEED_URL = "/content/news-feed.json";
export const NEWS_FEED_SUMMARY_URL = "/content/news-feed-summary.json";

const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PUBLISHABLE_STATUSES = new Set(["PUBLISHED"]);
// Localized news lane (2026-10-10): an article may carry a natively written body in any UI locale. The English
// body is always required (it is the canonical edition); every other locale is optional and becomes a published,
// indexable edition only when title, summary and body exist for that locale. `en` and `zh-Hans` are the two core
// editions the content lane always writes; the listing pages are published in them even when the feed is empty.
export const NEWS_CORE_LOCALES = ["en", "zh-Hans"];
export const NEWS_INDEXABLE_LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar"];
export const NEWS_DISPLAY_LOCALES = ["en", "zh-Hans", "zh-Hant", "ja", "ko", "tr", "es", "pt-BR", "fr", "de", "ar", "ru", "id", "vi", "it", "ur", "uk"];

/** Google News sitemap <news:language> value for an edition locale (ISO 639-1; zh-cn / zh-tw are the documented exceptions). */
export function newsSitemapLanguage(locale = "en") {
  const special = { "zh-Hans": "zh-cn", "zh-Hant": "zh-tw", "pt-BR": "pt" };
  return special[locale] || String(locale || "en").split("-")[0].toLowerCase();
}

// Small, explicitly reviewed seed pack for the highest-intent article. These
// are concise decision summaries, not machine-translated claims; the full
// source-backed body remains available in English and Simplified Chinese.
const REVIEWED_NEWS_LOCALE_OVERRIDES = Object.freeze({
  "coinbase-vs-kraken-stock-and-etf-trading-boundary-comparison": {
    title: {
      ja: "CoinbaseとKrakenの株式・ETF取引の境界を比較",
      ko: "Coinbase와 Kraken의 주식·ETF 거래 범위 비교",
      tr: "Coinbase ve Kraken hisse senedi ile ETF işlem sınırları karşılaştırması",
      es: "Comparación de los límites de acciones y ETF entre Coinbase y Kraken",
      "pt-BR": "Comparação dos limites de ações e ETFs entre Coinbase e Kraken",
      ar: "مقارنة حدود تداول الأسهم وصناديق ETF بين Coinbase وKraken",
    },
    summary: {
      ja: "公式情報を基に、株式・ETFアクセス、地域条件、口座内で確認すべき表示を整理します。",
      ko: "공식 자료를 기준으로 주식·ETF 접근, 지역 조건과 계정에서 확인할 표시를 정리합니다.",
      tr: "Resmi kaynaklara göre hisse senedi ve ETF erişimi, bölgesel koşullar ve hesapta kontrol edilmesi gereken göstergeleri özetler.",
      es: "Resume, según fuentes oficiales, el acceso a acciones y ETF, las condiciones regionales y las señales que deben verificarse en la cuenta.",
      "pt-BR": "Resume, com base em fontes oficiais, o acesso a ações e ETFs, as condições regionais e os sinais que devem ser verificados na conta.",
      ar: "يلخص، استناداً إلى المصادر الرسمية، الوصول إلى الأسهم وصناديق ETF والشروط الإقليمية وما يجب التحقق منه داخل الحساب.",
    },
  },
  "crypto-platform-stock-access-disclosure-radar-brokerage-tokenized-perp-boundaries": {
    title: {
      ja: "暗号資産プラットフォームの株式アクセスと開示境界を確認",
      ko: "암호화폐 플랫폼의 주식 접근과 공시 경계 점검",
      tr: "Kripto platformlarında hisse erişimi ve açıklama sınırlarını inceleme",
      es: "Revisión del acceso a acciones y de los límites de divulgación en plataformas cripto",
      "pt-BR": "Revisão do acesso a ações e dos limites de divulgação em plataformas cripto",
      ar: "مراجعة الوصول إلى الأسهم وحدود الإفصاح في منصات العملات الرقمية",
    },
    summary: {
      ja: "株式アクセス、トークン化資産、無期限契約を同一の商品とみなさず、公式開示と地域条件を分けて確認します。",
      ko: "주식 접근, 토큰화 자산과 무기한 계약을 같은 상품으로 보지 않고 공식 공시와 지역 조건을 분리해 확인합니다.",
      tr: "Hisse erişimi, tokenleştirilmiş varlıklar ve perpetual sözleşmeleri aynı ürün saymadan resmi açıklamaları ve bölgesel koşulları ayrı ayrı kontrol eder.",
      es: "Separa el acceso a acciones, los activos tokenizados y los perpetuos, y verifica por separado las divulgaciones oficiales y las condiciones regionales.",
      "pt-BR": "Separa o acesso a ações, ativos tokenizados e contratos perpétuos, verificando à parte as divulgações oficiais e as condições regionais.",
      ar: "يفصل بين الوصول إلى الأسهم والأصول المرمّزة والعقود الدائمة، مع التحقق بشكل مستقل من الإفصاحات الرسمية والشروط الإقليمية.",
    },
  },
  "direct-stock-brokerage-vs-tokenized-equities-vs-tradfi-perps-rights-map": {
    title: {
      ja: "現物株式、トークン化株式、TradFiパーペチュアルの権利を比較",
      ko: "현물 주식·토큰화 주식·TradFi 무기한 계약의 권리 비교",
      tr: "Gerçek hisseler, tokenleştirilmiş hisseler ve TradFi perpetual hakları karşılaştırması",
      es: "Mapa de derechos: acciones directas, tokenizadas y perpetuos TradFi",
      "pt-BR": "Mapa de direitos: ações diretas, tokenizadas e perpétuos TradFi",
      ar: "خريطة الحقوق: الأسهم المباشرة والمرمّزة وعقود TradFi الدائمة",
    },
    summary: {
      ja: "所有権、償還、カストディ、清算条件を分けて比較し、商品名だけで同等と判断しないための確認項目を示します。",
      ko: "소유권, 상환, 보관과 청산 조건을 나눠 비교하고 상품명만으로 동일하다고 판단하지 않도록 확인 항목을 제시합니다.",
      tr: "Mülkiyet, itfa, saklama ve tasfiye koşullarını ayrı karşılaştırır; yalnızca ürün adına bakarak eşdeğerlik varsayılmaması için kontrol noktaları sunar.",
      es: "Compara por separado propiedad, reembolso, custodia y liquidación para evitar tratar productos como equivalentes solo por su nombre.",
      "pt-BR": "Compara separadamente propriedade, resgate, custódia e liquidação para evitar tratar produtos como equivalentes apenas pelo nome.",
      ar: "يقارن الملكية والاسترداد والحفظ وشروط التصفية بشكل منفصل لتجنب اعتبار المنتجات متكافئة اعتماداً على الاسم فقط.",
    },
  },
  "how-to-unlock-kraken-pro-stock-trading-and-verify-equities-eligibility": {
    title: {
      ja: "Kraken Proの株式取引資格を確認する方法",
      ko: "Kraken Pro 주식 거래 자격 확인 방법",
      tr: "Kraken Pro hisse senedi işlem uygunluğu nasıl kontrol edilir",
      es: "Cómo verificar la elegibilidad para operar acciones en Kraken Pro",
      "pt-BR": "Como verificar a elegibilidade para negociar ações no Kraken Pro",
      ar: "كيفية التحقق من أهلية تداول الأسهم في Kraken Pro",
    },
    summary: {
      ja: "株式取引が有効かどうかを、地域資格とログイン後の口座表示で確認する手順を整理します。",
      ko: "주식 거래가 활성화됐는지 지역 자격과 로그인 후 계정 표시를 기준으로 확인하는 절차를 정리합니다.",
      tr: "Hisse işleminin etkin olup olmadığını bölgesel uygunluk ve giriş sonrası hesap göstergeleriyle kontrol etme adımlarını özetler.",
      es: "Resume cómo comprobar la activación de acciones mediante la elegibilidad regional y las señales visibles tras iniciar sesión.",
      "pt-BR": "Resume como verificar a ativação de ações usando a elegibilidade regional e os sinais visíveis após o login.",
      ar: "يلخص كيفية التحقق من تفعيل تداول الأسهم عبر الأهلية الإقليمية والمؤشرات الظاهرة بعد تسجيل الدخول.",
    },
  },
  "kraken-coinbase-stock-trading-expansion-crypto-exchange-brokerage-readiness": {
    title: {
      ja: "KrakenとCoinbaseの株式取引拡大と証券サービス対応を比較",
      ko: "Kraken과 Coinbase의 주식 거래 확대와 브로커리지 준비도 비교",
      tr: "Kraken ve Coinbase hisse işlemi genişlemesi ve aracılık hazırlığı karşılaştırması",
      es: "Comparación de la expansión bursátil y preparación de corretaje de Kraken y Coinbase",
      "pt-BR": "Comparação da expansão de ações e da preparação de corretagem de Kraken e Coinbase",
      ar: "مقارنة توسع تداول الأسهم واستعداد الوساطة لدى Kraken وCoinbase",
    },
    summary: {
      ja: "株式・ETF機能を利便性だけで判断せず、地域、規制、口座資格と商品境界を確認します。",
      ko: "주식·ETF 기능을 편의성만으로 판단하지 않고 지역, 규제, 계정 자격과 상품 경계를 확인합니다.",
      tr: "Hisse ve ETF özelliklerini yalnızca kolaylık olarak değerlendirmeden bölge, düzenleme, hesap uygunluğu ve ürün sınırlarını kontrol eder.",
      es: "Verifica región, regulación, elegibilidad de la cuenta y límites del producto antes de interpretar las funciones de acciones y ETF como una ventaja.",
      "pt-BR": "Verifica região, regulação, elegibilidade da conta e limites do produto antes de tratar recursos de ações e ETFs como vantagem.",
      ar: "يتحقق من المنطقة والتنظيم وأهلية الحساب وحدود المنتج قبل اعتبار ميزات الأسهم وصناديق ETF ميزة بحد ذاتها.",
    },
  },
});

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanLocalizedText(value) {
  if (!isRecord(value)) return null;
  const en = cleanString(value.en);
  // English is the canonical edition and stays required; every other locale (zh-Hans included) is carried when present.
  if (!en) return null;
  return NEWS_INDEXABLE_LOCALES.reduce((result, locale) => {
    const text = cleanString(value[locale]);
    if (text) result[locale] = text;
    return result;
  }, {});
}

// Plain-text fields (title, summary) are rendered literally: Markdown markers never reach the page (scorecard C4).
function cleanPlainLocalizedText(value, clean) {
  const localized = clean(value);
  return localized ? Object.fromEntries(Object.entries(localized).map(([locale, text]) => [locale, stripPlainMarkdown(text)])) : localized;
}

function cleanCompactLocalizedText(value) {
  if (!isRecord(value)) return null;
  const entries = NEWS_DISPLAY_LOCALES.flatMap((locale) => {
    const text = cleanString(value[locale]);
    return text ? [[locale, text]] : [];
  });
  return entries.length ? Object.fromEntries(entries) : null;
}

export function dedupeRepeatedLongSentences(markdown) {
  const seen = new Set();
  return String(markdown || "")
    .replace(/[^.!?。！？\n]+[.!?。！？]/g, (sentence) => {
      const normalized = sentence.replace(/\s+/g, " ").trim().toLowerCase();
      if (normalized.length < 80) return sentence;
      if (seen.has(normalized)) return "";
      seen.add(normalized);
      return sentence;
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanLocalizedContent(value) {
  const localized = cleanLocalizedText(value);
  if (!localized) return null;
  return Object.fromEntries(
    Object.entries(localized).map(([locale, content]) => [locale, dedupeRepeatedLongSentences(content)]),
  );
}

function cleanSources(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((source) => {
    if (!isRecord(source)) return [];
    const url = cleanString(source.url);
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return [];
    } catch {
      return [];
    }
    const title = cleanString(source.title);
    const publisher = cleanString(source.publisher);
    if (!title || !publisher) return [];
    return [{
      id: cleanString(source.id) || `${publisher}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      url,
      title,
      publisher,
      accessedAt: cleanString(source.accessedAt) || null,
      publishedAt: cleanString(source.publishedAt) || null,
      primary: source.primary !== false,
    }];
  });
}

function cleanVenueSlugs(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.flatMap((slug) => {
    const cleanSlug = cleanString(slug).toLowerCase();
    if (!VALID_SLUG.test(cleanSlug) || seen.has(cleanSlug)) return [];
    seen.add(cleanSlug);
    return [cleanSlug];
  });
}

export function localizedValue(value, locale = "en") {
  if (!isRecord(value)) return "";
  if (locale.startsWith("zh")) return cleanString(value[locale]) || cleanString(value["zh-Hans"]) || cleanString(value.en);
  return cleanString(value[locale]) || cleanString(value.en) || cleanString(value["zh-Hans"]);
}

const INTERNATIONAL_NEWS_COPY = {
  ja: {
    titlePrefix: "出典確認済みリサーチ",
    summary: "{venues}について、公式ソース、手数料、地域条件、次に確認すべき項目を整理します。本文は確認済み原文で表示します。",
  },
  ko: {
    titlePrefix: "출처 검증 리서치",
    summary: "{venues}에 대한 공식 출처, 수수료, 지역 조건과 다음 확인 항목을 정리합니다. 본문은 검증된 원문으로 표시됩니다.",
  },
  tr: {
    titlePrefix: "Kaynak doğrulamalı araştırma",
    summary: "{venues} için resmi kaynakları, ücretleri, bölgesel koşulları ve sonraki kontrol adımlarını özetler. Gövde doğrulanmış kaynak dilinde gösterilir.",
  },
  es: {
    titlePrefix: "Investigación verificada por fuentes",
    summary: "Resume fuentes oficiales, tarifas, condiciones regionales y próximos controles para {venues}. El cuerpo se muestra en el idioma fuente verificado.",
  },
  "pt-BR": {
    titlePrefix: "Pesquisa verificada por fontes",
    summary: "Resume fontes oficiais, taxas, condições regionais e próximos passos de verificação para {venues}. O corpo aparece no idioma fonte verificado.",
  },
  fr: {
    titlePrefix: "Recherche vérifiée par sources",
    summary: "Résume les sources officielles, les frais, les conditions régionales et les prochains contrôles pour {venues}. Le corps reste dans la langue source vérifiée.",
  },
  de: {
    titlePrefix: "Quellengeprüfte Recherche",
    summary: "Fasst offizielle Quellen, Gebühren, regionale Bedingungen und nächste Prüfschritte für {venues} zusammen. Der Artikeltext bleibt in der geprüften Quellsprache.",
  },
  ar: {
    titlePrefix: "بحث موثق بالمصادر",
    summary: "يلخص المصادر الرسمية والرسوم والشروط الإقليمية وخطوات التحقق التالية لـ {venues}. يظهر نص المقال بلغة المصدر الموثقة.",
  },
  ru: {
    titlePrefix: "Исследование с проверкой источников",
    summary: "Сводит официальные источники, комиссии, региональные условия и следующие проверки для {venues}. Текст показан на проверенном исходном языке.",
  },
  id: {
    titlePrefix: "Riset terverifikasi sumber",
    summary: "Merangkum sumber resmi, biaya, ketentuan regional, dan langkah pemeriksaan berikutnya untuk {venues}. Isi tetap memakai bahasa sumber terverifikasi.",
  },
  vi: {
    titlePrefix: "Nghiên cứu đã kiểm chứng nguồn",
    summary: "Tóm tắt nguồn chính thức, phí, điều kiện khu vực và bước kiểm tra tiếp theo cho {venues}. Nội dung giữ theo ngôn ngữ nguồn đã xác minh.",
  },
  it: {
    titlePrefix: "Ricerca verificata da fonti",
    summary: "Riassume fonti ufficiali, commissioni, condizioni regionali e prossimi controlli per {venues}. Il corpo resta nella lingua fonte verificata.",
  },
  // l10n: needs native review
  ur: { titlePrefix: "ذرائع کی جانچ پر مبنی تحقیق", summary: "{venues} کے سرکاری ذرائع، فیس، علاقائی شرائط اور اگلی جانچوں کا خلاصہ۔ مضمون کا متن تصدیق شدہ اصل زبان میں دکھایا گیا ہے۔" },
  // l10n: needs native review
  uk: { titlePrefix: "Дослідження з перевіркою джерел", summary: "Огляд офіційних джерел, комісій, регіональних умов і наступних перевірок для {venues}. Текст статті подано перевіреною мовою оригіналу." },

};

function localeCopy(locale = "en") {
  return INTERNATIONAL_NEWS_COPY[locale] || INTERNATIONAL_NEWS_COPY[String(locale || "").split("-")[0]] || null;
}

function humanizeNewsSlugPart(value) {
  const lower = String(value || "").trim().toLowerCase();
  const special = {
    okx: "OKX",
    bybit: "Bybit",
    bitget: "Bitget",
    binance: "Binance",
    coinbase: "Coinbase",
    kraken: "Kraken",
    dydx: "dYdX",
    gmx: "GMX",
    jupiter: "Jupiter",
    raydium: "Raydium",
    uniswap: "Uniswap",
    hyperliquid: "Hyperliquid",
  };
  if (special[lower]) return special[lower];
  return lower
    .split("-")
    .filter(Boolean)
    .map((part) => part.length <= 4 ? part.toUpperCase() : `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function articleVenueLabel(article) {
  const venues = Array.isArray(article?.relatedVenues) && article.relatedVenues.length
    ? article.relatedVenues.slice(0, 3).map(humanizeNewsSlugPart)
    : [];
  if (venues.length) return venues.join(" / ");
  const slugParts = String(article?.slug || "")
    .split("-")
    .slice(0, 4)
    .map(humanizeNewsSlugPart)
    .filter(Boolean);
  return slugParts.join(" ") || "crypto platform";
}

export function hasLocalizedNewsText(article, field, locale = "en") {
  return Boolean(cleanString(article?.[field]?.[locale]));
}

export function localizedNewsTitle(article, locale = "en") {
  const direct = localizedValue(article?.title, locale);
  if (!article || hasLocalizedNewsText(article, "title", locale) || locale === "en" || String(locale).startsWith("zh")) return direct;
  const copy = localeCopy(locale);
  return copy ? `${copy.titlePrefix}: ${articleVenueLabel(article)}` : direct;
}

export function localizedNewsSummary(article, locale = "en") {
  const direct = localizedValue(article?.summary, locale);
  if (!article || hasLocalizedNewsText(article, "summary", locale) || locale === "en" || String(locale).startsWith("zh")) return direct;
  const copy = localeCopy(locale);
  return copy ? copy.summary.replace("{venues}", articleVenueLabel(article)) : direct;
}

function plainMarkdownText(value) {
  return cleanString(value)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/^\s*(?:[-*+] |\d+[.)]\s+)/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function newsArticleFaqEntries(article, locale = "en") {
  const content = localizedValue(article?.content, locale);
  if (!content) return [];
  const faqHeading = /^##\s+(?:frequently asked questions|faq|常见问题|常見問題)\s*$/im;
  const match = faqHeading.exec(content);
  if (!match) return [];
  const faqBody = content.slice(match.index + match[0].length).split(/^##\s+/m, 1)[0];
  const headings = [...faqBody.matchAll(/^###\s+(.+?[?？])\s*$/gm)];
  return headings.flatMap((heading, index) => {
    const start = heading.index + heading[0].length;
    const end = headings[index + 1]?.index ?? faqBody.length;
    const question = plainMarkdownText(heading[1]);
    const answer = plainMarkdownText(faqBody.slice(start, end));
    return question && answer ? [{ question, answer }] : [];
  });
}

export const OKX_USD_USDC_OWNER_CHECKLIST = Object.freeze({
  slug: "okx-usd-to-usdc-spot-pair-migration",
  reviewedAt: "2026-09-15",
  eyebrow: "ACCOUNT OPERATIONS CHECKLIST",
  title: "OKX USD to USDC migration: check pairs, API symbols, orders and bots first",
  summary: "Check the official pair scope first, then inspect open orders, bots, API instrument identifiers, quote-currency handling and balances before changing a live workflow. The notice does not prove account-specific impact or safe execution.",
  checklist: [
    "Pair and date scope: affected Crypto-USD spot pairs, replacement Crypto-USDC pairs and the historical announced schedule for September 23 launch and September 30 delisting.",
    "API fields: instId, instIdCode, instrument discovery, WebSocket subscriptions, cached instruments and historical-data calls.",
    "Quote behavior: tradeQuoteCcy defaults, tradeQuoteCcyList support and USDC order book activation for the main account and sub-accounts.",
    "Account exposure: open orders, margin positions, strategy orders, grid or DCA bots and portfolio accounting that still references USD books.",
    "Stablecoin boundary: balances and USDC books are separate from Circle issuer terms, redemption eligibility and third-party-platform price risk.",
  ],
  faq: [
    {
      id: "okx-usd-usdc-migration-instid",
      question: "What must OKX API users change when USD spot pairs migrate to USDC instruments?",
      answer: "API users should map affected Crypto-USD instruments to replacement Crypto-USDC instruments, then review instId, instIdCode, WebSocket subscriptions, cached instrument lists, historical-data calls, tradeQuoteCcy defaults and tradeQuoteCcyList handling. Treat September dates as migration markers, not proof that a private integration is production-safe.",
    },
    {
      id: "okx-usd-usdc-migration-orders-bots",
      question: "What should OKX users check about open orders, margin positions and trading bots before the USD to USDC migration deadline?",
      answer: "The September 30 delisting window is a historical announced schedule. Users should now inspect current affected open orders, margin positions, strategy orders, grid bots, DCA bots, balances, USDC order books and sub-accounts inside the logged-in account. The public notice is an operations checklist; it does not confirm account-specific impact, eligibility, completion or execution outcome.",
    },
  ],
});

export function newsArticleExtraFaqEntries(article, locale = "en") {
  if (locale !== "en") return [];
  if (article?.slug === OKX_USD_USDC_OWNER_CHECKLIST.slug) {
    return OKX_USD_USDC_OWNER_CHECKLIST.faq.map(({ question, answer }) => ({ question, answer }));
  }
  if (article?.slug === "bybit-vs-bitget-fees-products-risk-controls") {
    return [{
      question: "Does a Bybit vs Bitget stock query prove either platform offers real shares or tokenized stocks to every user?",
      answer: "No. Stock wording can refer to ordinary shares, tokenized exposure, equity perpetuals, index-style products or copy-trading labels. The canonical owner remains /compare/bybit-vs-bitget, where product scope, region, fee source date and account route are checked before any CTA path.",
    }];
  }
  if (article?.slug === "uniswap-v3-vs-pancakeswap-v3-concentrated-liquidity-controls") {
    return [{
      question: "Does a Uniswap v3 vs PancakeSwap v3 comparison prove a liquidity position is safe or profitable?",
      answer: "No. Concentrated-liquidity mechanics must be checked by official app, chain, pool deployment, fee tier, tick spacing, routing, incentive rules and wallet transaction. The owner routes are the Uniswap profile, Uniswap vs Jupiter comparison and PancakeSwap factbook/source pages, not a profit or safety claim.",
    }];
  }
  return [];
}


const NEWS_ARTICLE_ROUTE_PROJECTION_SOURCE = "nexualpha-news-route-projection-v1";

function projectionLocales(article) {
  const projection = isRecord(article?.routeProjection) ? article.routeProjection : null;
  if (projection?.source !== NEWS_ARTICLE_ROUTE_PROJECTION_SOURCE) return [];
  const locales = Array.isArray(projection.availableLocales)
    ? projection.availableLocales.map(cleanString).filter(Boolean)
    : [];
  return withoutNeutralReferralEditions(article, NEWS_INDEXABLE_LOCALES.filter((locale) => locales.includes(locale)));
}

function routeProjection(article, locale = undefined) {
  const locales = projectionLocales(article);
  if (!locales.length) return null;
  const sourceLocale = cleanString(locale) || cleanString(article?.routeProjection?.locale);
  return {
    source: NEWS_ARTICLE_ROUTE_PROJECTION_SOURCE,
    ...(sourceLocale ? { locale: sourceLocale } : {}),
    availableLocales: locales,
  };
}

/** Locales whose title, summary and body are all present: the editions the article can be read and indexed in. */
export function newsArticleAvailableLocales(article) {
  if (!isRecord(article)) return [];
  const explicit = Array.isArray(article.availableLocales)
    ? article.availableLocales.map(cleanString).filter(Boolean)
    : [];
  const candidates = explicit.length ? explicit : NEWS_INDEXABLE_LOCALES;
  const locales = candidates.filter((locale) => {
    if (!NEWS_INDEXABLE_LOCALES.includes(locale)) return false;
    return cleanString(article.title?.[locale])
      && cleanString(article.summary?.[locale])
      && cleanString(article.content?.[locale]);
  });
  return withoutNeutralReferralEditions(article, NEWS_INDEXABLE_LOCALES.filter((locale) => locales.includes(locale)));
}

/**
 * Locales a summary row declares an edition for. Summary rows carry no body, so the feed's `availableLocales` (written
 * by the publisher only for locales with a full body) or the carried route projection is the authority; a row without
 * either falls back to the core editions that every article has.
 */
export function newsArticleDeclaredLocales(article) {
  if (!isRecord(article)) return [];
  const explicit = Array.isArray(article.availableLocales)
    ? article.availableLocales.map(cleanString).filter((locale) => NEWS_INDEXABLE_LOCALES.includes(locale))
    : [];
  const projected = projectionLocales(article);
  const declared = explicit.length ? explicit : projected.length ? projected : newsArticleAvailableLocales(article);
  return withoutNeutralReferralEditions(article, NEWS_INDEXABLE_LOCALES.filter((locale) => declared.includes(locale)));
}

/** True when the article has its own edition (title + summary, body when the row carries one) in `locale`. */
export function hasNewsArticleLocale(article, locale) {
  if (!isRecord(article) || !NEWS_INDEXABLE_LOCALES.includes(locale)) return false;
  if (isRecord(article.content)) return newsArticleAvailableLocales(article).includes(locale);
  return newsArticleDeclaredLocales(article).includes(locale)
    && Boolean(cleanString(article.title?.[locale]) && cleanString(article.summary?.[locale]));
}

/**
 * Locales the news listing pages (/news, pagination, categories) are published in: the core editions plus every
 * locale at least one search-published article has an edition for. Rows without `seo` (summary rows) count by their
 * declared locales; full rows must be search-published (`seo.noindex === false`).
 */
export function newsListingPublishedLocales(articles = []) {
  const counts = newsListingNativeArticleCounts(articles);
  return NEWS_INDEXABLE_LOCALES.filter((locale) => NEWS_CORE_LOCALES.includes(locale) || counts[locale] > 0);
}

/** Search-published native editions per locale (same row rules as newsListingPublishedLocales). */
export function newsListingNativeArticleCounts(articles = []) {
  const counts = {};
  for (const article of Array.isArray(articles) ? articles : []) {
    if (!isRecord(article)) continue;
    if (article.status && article.status !== "PUBLISHED") continue;
    if (isRecord(article.seo) && article.seo.noindex !== false) continue;
    for (const locale of newsArticleDeclaredLocales(article)) counts[locale] = (counts[locale] || 0) + 1;
  }
  return counts;
}

// SEO audit 2026-10-11 #4 / scorecard M3: a locale news index (/<locale>/news, its pages and categories) is indexable
// only once that locale has at least this many native, search-published article editions. Below it the listing still
// renders (newsListingPublishedLocales) but is noindex,follow, carries no hreflang and stays out of every sitemap; at the
// threshold it becomes index,follow automatically. English is the default edition and is always indexable.
export const NEWS_LISTING_MIN_NATIVE_ARTICLES = 5;

/** Locales whose news listing pages are index,follow (and listed in sitemaps / hreflang). */
export function newsListingIndexableLocales(articles = [], minimum = NEWS_LISTING_MIN_NATIVE_ARTICLES) {
  const counts = newsListingNativeArticleCounts(articles);
  return newsListingPublishedLocales(articles).filter((locale) => locale === "en" || (counts[locale] || 0) >= minimum);
}

/**
 * hreflang alternates for a set of indexable editions: one link per locale plus x-default on the first edition.
 * The page head (worker routeAlternates), /api/route-seo and every sitemap writer use this shape.
 */
export function hreflangAlternates(locales = [], hrefFor = (locale) => locale) {
  const list = Array.isArray(locales) ? locales.filter(Boolean) : [];
  if (!list.length) return [];
  return [
    ...list.map((hreflang) => ({ hreflang, href: hrefFor(hreflang) })),
    { hreflang: "x-default", href: hrefFor(list[0]) },
  ];
}

function newsArticleSummaryAvailableLocales(article) {
  if (!isRecord(article)) return [];
  const explicit = Array.isArray(article.availableLocales)
    ? article.availableLocales.map(cleanString).filter(Boolean)
    : [];
  const candidates = explicit.length ? explicit : NEWS_INDEXABLE_LOCALES;
  const locales = candidates.filter((locale) => {
    if (!NEWS_INDEXABLE_LOCALES.includes(locale)) return false;
    return cleanString(article.title?.[locale]) && cleanString(article.summary?.[locale]);
  });
  return NEWS_INDEXABLE_LOCALES.filter((locale) => locales.includes(locale));
}


export function newsArticleSeoLocales(article) {
  // Readable editions are not publication authority: every SEO consumer shares the page robots gate.
  if (!isRecord(article) || article.status !== "PUBLISHED" || article.seo?.noindex !== false) return [];
  const fullLocales = newsArticleAvailableLocales(article);
  if (!Array.isArray(article.sources) || article.sources.length === 0) return fullLocales;
  const projectedLocales = projectionLocales(article);
  return projectedLocales.length > fullLocales.length ? projectedLocales : fullLocales;
}

export function resolveNewsContentLocale(requestedLocale = "en", articleOrLocales = NEWS_INDEXABLE_LOCALES) {
  const available = Array.isArray(articleOrLocales)
    ? articleOrLocales
    : newsArticleAvailableLocales(articleOrLocales);
  if (available.includes(requestedLocale)) return requestedLocale;
  if (String(requestedLocale).startsWith("zh") && available.includes("zh-Hans")) return "zh-Hans";
  return available.includes("en") ? "en" : available[0] || "en";
}

export function newsArticleUrl(slug, locale = "en", article = null) {
  const pathname = `/news/${encodeURIComponent(slug)}`;
  // Internal article anchors must stay canonical for crawlers: link to the locale article only when that edition exists;
  // otherwise send readers to the locale news home instead of creating /news/<slug>?locale=<locale> variants.
  if (locale !== "en" && locale !== "zh-Hans" && !hasNewsArticleLocale(article, locale)) {
    return localizedHref("/news", { locale });
  }
  return localizedHref(pathname, { locale });
}

export function exchangeUrl(slug, locale = "en") {
  return localizedHref(`/exchanges/${encodeURIComponent(slug)}`, { locale });
}

/**
 * A real human review record on a feed row: `humanReviewedBy` (reviewer name) and `humanReviewedAt` (ISO date).
 * Without one, article pages say "Updated <date>" and their schema names no reviewer (AUDIT 2026-10-12).
 */
export function newsHumanReview(article) {
  if (!isRecord(article)) return null;
  const by = cleanString(article.humanReviewedBy);
  const at = cleanString(article.humanReviewedAt);
  if (!by || !at || !Number.isFinite(Date.parse(at))) return null;
  return { by, at: new Date(Date.parse(at)).toISOString() };
}

const SEARCH_STATES = new Set(["noindex-thin", "canonicalized"]);

// Only claim text crosses into summary/hub payloads; source arrays and article bodies stay on detail pages.
export function compactResearchClaims(article) {
  const strings = value => typeof value === "string" ? [value.trim()] : value && typeof value === "object" ? Object.values(value).flatMap(strings) : [];
  return [...new Set(strings(article?.researchClaims || article?.claims).filter(Boolean))];
}

export function normalizeNewsArticle(article) {
  if (!isRecord(article)) return null;
  const slug = cleanString(article.slug).toLowerCase();
  if (!VALID_SLUG.test(slug)) return null;
  const status = cleanString(article.status) || "PUBLISHED";
  if (!PUBLISHABLE_STATUSES.has(status)) return null;

  const override = REVIEWED_NEWS_LOCALE_OVERRIDES[slug] || {};
  // A policy-filtered route projection may retain only its native edition.
  const cleanText = routeProjection(article) ? cleanCompactLocalizedText : cleanLocalizedText;
  const title = cleanPlainLocalizedText({ ...(article.title || {}), ...(override.title || {}) }, cleanText);
  const summary = cleanPlainLocalizedText({ ...(article.summary || {}), ...(override.summary || {}) }, cleanText);
  const rawContent = cleanText(article.content);
  const content = rawContent ? Object.fromEntries(Object.entries(rawContent).map(([locale, text]) => [locale, dedupeRepeatedLongSentences(text)])) : null;
  const categoryName = cleanLocalizedText(article.categoryName);
  const sources = cleanSources(article.sources);
  const publishedTime = Date.parse(article.publishedAt);

  if (!title || !summary || !content || (sources.length === 0 && !routeProjection(article)) || Number.isNaN(publishedTime)) return null;
  // Reading time measured on each edition's own body (SEO audit 2026-10-11 #7), so stored values from older imports
  // (English pages showed the Chinese edition's time) are corrected wherever the full article is loaded.
  const readTimeByLocale = newsReadTimes(content);

  return {
    slug,
    status,
    category: cleanString(article.category) || "research",
    categoryName: categoryName || { en: "Research", "zh-Hans": "研究文章", "zh-Hant": "研究文章" },
    publishedAt: new Date(publishedTime).toISOString(),
    updatedAt: cleanString(article.updatedAt) || null,
    readTime: readTimeByLocale.en || cleanString(article.readTime) || "6 min",
    readTimeByLocale,
    author: cleanString(article.author) || "NexuAlpha Research Desk",
    title,
    summary,
    content,
    sources,
    relatedVenues: cleanVenueSlugs(article.relatedVenues),
    ...(compactResearchClaims(article).length ? { researchClaims: compactResearchClaims(article) } : {}),
    topicTags: cleanVenueSlugs(article.topicTags || article.tags),
    ...(isRecord(article.cta) ? { cta: { venue: cleanString(article.cta.venue), topic: cleanString(article.cta.topic), coin: cleanString(article.cta.coin) } } : {}),
    availableLocales: newsArticleAvailableLocales(article),
    ...(routeProjection(article) ? { routeProjection: routeProjection(article) } : {}),
    seo: isRecord(article.seo) ? article.seo : {},
    aeo: isRecord(article.aeo) ? article.aeo : {},
    geo: isRecord(article.geo) ? article.geo : {},
    // T10 search state set by the Worker / build overlay (src/data/news-search-state.js); review record if one exists.
    ...(SEARCH_STATES.has(article.searchState) ? { searchState: article.searchState } : {}),
    ...(VALID_SLUG.test(cleanString(article.canonicalSlug)) ? { canonicalSlug: cleanString(article.canonicalSlug) } : {}),
    ...(newsHumanReview(article) ? { humanReviewedBy: newsHumanReview(article).by, humanReviewedAt: newsHumanReview(article).at } : {}),
  };
}

export function normalizeNewsArticleSummary(article) {
  if (!isRecord(article)) return null;
  const slug = cleanString(article.slug).toLowerCase();
  if (!VALID_SLUG.test(slug)) return null;
  const status = cleanString(article.status) || "PUBLISHED";
  if (!PUBLISHABLE_STATUSES.has(status)) return null;
  const override = REVIEWED_NEWS_LOCALE_OVERRIDES[slug] || {};
  const title = cleanPlainLocalizedText({ ...(article.title || {}), ...(override.title || {}) }, cleanCompactLocalizedText);
  const summary = cleanPlainLocalizedText({ ...(article.summary || {}), ...(override.summary || {}) }, cleanCompactLocalizedText);
  const categoryName = cleanCompactLocalizedText(article.categoryName);
  const publishedTime = Date.parse(article.publishedAt);
  if (!title || !summary || Number.isNaN(publishedTime)) return null;

  return {
    slug,
    status,
    category: cleanString(article.category) || "research",
    categoryName: categoryName || { en: "Research", "zh-Hans": "研究文章", "zh-Hant": "研究文章" },
    publishedAt: new Date(publishedTime).toISOString(),
    updatedAt: cleanString(article.updatedAt) || null,
    readTime: cleanString(article.readTime) || "6 min",
    ...(isRecord(article.readTimeByLocale) ? { readTimeByLocale: Object.fromEntries(Object.entries(article.readTimeByLocale).filter(([key, value]) => NEWS_INDEXABLE_LOCALES.includes(key) && /^\d{1,3} min$/.test(String(value)))) } : {}),
    author: cleanString(article.author) || "NexuAlpha Research Desk",
    title,
    summary,
    relatedVenues: cleanVenueSlugs(article.relatedVenues),
    ...(compactResearchClaims(article).length ? { researchClaims: compactResearchClaims(article) } : {}),
    topicTags: cleanVenueSlugs(article.topicTags || article.tags),
    ...(isRecord(article.cta) ? { cta: { venue: cleanString(article.cta.venue), topic: cleanString(article.cta.topic), coin: cleanString(article.cta.coin) } } : {}),
    availableLocales: newsArticleSummaryAvailableLocales(article),
    // Do not turn a full noindex row into an implicitly published summary during library projection.
    ...(typeof article.seo?.noindex === "boolean" ? { seo: { noindex: article.seo.noindex } } : {}),
    ...(routeProjection(article) ? { routeProjection: routeProjection(article) } : {}),
  };
}

export function normalizeNewsFeed(feed) {
  const rows = Array.isArray(feed) ? feed : isRecord(feed) && Array.isArray(feed.articles) ? feed.articles : [];
  return rows
    .map(normalizeNewsArticle)
    .filter(Boolean)
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt));
}

export function normalizeNewsFeedSummaries(feed) {
  const rows = Array.isArray(feed) ? feed : isRecord(feed) && Array.isArray(feed.articles) ? feed.articles : [];
  return rows
    .map(normalizeNewsArticleSummary)
    .filter(Boolean)
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt));
}

// Full articles plus summary rows (related / linked articles) in one newest-first pool for article pages.
export function normalizeNewsArticlePool(feed) {
  const full = normalizeNewsFeed(feed);
  const seen = new Set(full.map((article) => article.slug));
  const summaries = normalizeNewsFeedSummaries(feed).filter((article) => !seen.has(article.slug));
  return [...full, ...summaries].sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt));
}

function compactLocalizedRecord(value, locale = "en") {
  if (!isRecord(value)) return value;
  const requested = NEWS_DISPLAY_LOCALES.includes(locale) ? locale : "en";
  const keep = new Set(["en"]);
  if (requested.startsWith("zh")) keep.add("zh-Hans");
  keep.add(requested);
  return Object.fromEntries([...keep].flatMap((key) => {
    const text = cleanString(value[key]);
    return text ? [[key, text]] : [];
  }));
}

export function projectNewsArticleForLocale(article, locale = "en", { includeContent = false } = {}) {
  if (!isRecord(article)) return null;
  const verifiedLocales = newsArticleAvailableLocales(article);
  const carriedLocales = projectionLocales(article);
  const seoLocales = carriedLocales.length > verifiedLocales.length ? carriedLocales : verifiedLocales;
  const projected = {
    slug: article.slug,
    status: article.status,
    category: article.category,
    categoryName: compactLocalizedRecord(article.categoryName, locale),
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt || null,
    readTime: article.readTime,
    ...(isRecord(article.readTimeByLocale) ? { readTimeByLocale: compactLocalizedRecord(article.readTimeByLocale, locale) } : {}),
    author: article.author,
    title: compactLocalizedRecord(article.title, locale),
    summary: compactLocalizedRecord(article.summary, locale),
    relatedVenues: Array.isArray(article.relatedVenues) ? article.relatedVenues : [],
    topicTags: cleanVenueSlugs(article.topicTags || article.tags),
    ...(isRecord(article.cta) ? { cta: { venue: cleanString(article.cta.venue), topic: cleanString(article.cta.topic), coin: cleanString(article.cta.coin) } } : {}),
    availableLocales: Array.isArray(article.availableLocales) ? article.availableLocales : [],
    routeProjection: {
      source: NEWS_ARTICLE_ROUTE_PROJECTION_SOURCE,
      locale,
      availableLocales: seoLocales,
    },
  };
  if (includeContent) {
    const contentLocale = resolveNewsContentLocale(locale, article);
    projected.content = compactLocalizedRecord(article.content, contentLocale);
    projected.sources = Array.isArray(article.sources) ? article.sources : [];
    projected.seo = isRecord(article.seo) ? article.seo : {};
    projected.aeo = isRecord(article.aeo) ? article.aeo : {};
    projected.geo = isRecord(article.geo) ? article.geo : {};
    if (SEARCH_STATES.has(article.searchState)) projected.searchState = article.searchState;
    if (VALID_SLUG.test(cleanString(article.canonicalSlug))) projected.canonicalSlug = cleanString(article.canonicalSlug);
    const review = newsHumanReview(article);
    if (review) { projected.humanReviewedBy = review.by; projected.humanReviewedAt = review.at; }
  }
  return projected;
}

export function projectNewsFeedForRoute(pathname = "/news", articles = [], locale = "en") {
  const includeContent = String(pathname).startsWith("/news/");
  return (Array.isArray(articles) ? articles : [])
    .map((article) => projectNewsArticleForLocale(article, locale, { includeContent }))
    .filter(Boolean);
}

export async function loadNewsArticles(fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== "function") return [];
  try {
    const response = await fetchImpl(NEWS_FEED_URL, { cache: "no-store" });
    if (!response?.ok) return [];
    return normalizeNewsFeed(await response.json());
  } catch {
    return [];
  }
}

/** One article (and compact summaries of articles it links to); falls back to the full feed on older servers. */
export async function loadNewsArticleBySlug(slug, fetchImpl = globalThis.fetch, { locale } = {}) {
  if (typeof fetchImpl !== "function") return [];
  try {
    const localeQuery = locale && NEWS_DISPLAY_LOCALES.includes(locale) ? `?locale=${encodeURIComponent(locale)}` : "";
    const response = await fetchImpl(`/api/news/article/${encodeURIComponent(slug)}${localeQuery}`, { cache: "no-store" });
    if (response?.status === 404) return [];
    if (response?.ok) return normalizeNewsArticlePool(await response.json());
  } catch {
    // fall through to the full feed
  }
  return loadNewsArticles(fetchImpl);
}

export async function loadNewsArticleSummaries(fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== "function") return [];
  try {
    let response = await fetchImpl(NEWS_FEED_SUMMARY_URL, { cache: "no-store" });
    // Keep compatibility with older deployments and test fixtures while the
    // compact feed rolls out across the edge cache.
    if (!response?.ok) response = await fetchImpl(NEWS_FEED_URL, { cache: "no-store" });
    if (!response?.ok) return [];
    return normalizeNewsFeedSummaries(await response.json());
  } catch {
    return [];
  }
}

/**
 * One page of the news library from the Worker (/api/news/search): a newest-first archive page without a query, or
 * ranked full-library search results with one. Returns null when the endpoint is unavailable (e.g. a static host),
 * so callers can fall back to the compact summary feed.
 */
export async function loadNewsLibraryPage({ query = "", category = null, page = 1, locale = "en", limit } = {}, fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== "function") return null;
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  params.set("locale", locale);
  try {
    const response = await fetchImpl(`/api/news/search?${params}`, { headers: { accept: "application/json" } });
    if (!response?.ok) return null;
    const payload = await response.json();
    if (!payload || payload.version !== 1 || !Array.isArray(payload.articles)) return null;
    return {
      ...payload,
      // Keep the server ranking: summary normalization without the date sort.
      articles: payload.articles.map(normalizeNewsArticleSummary).filter(Boolean),
    };
  } catch {
    return null;
  }
}

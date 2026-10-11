// Article embed directive (scorecard D3, 2026-10-11). A paragraph that is exactly one line
//
//   ::embed liquidations          ::embed funding          ::embed funding BTC
//
// renders the matching live data widget (server/embed-widgets.mjs, /embed/<kind>) inside the article as a lazy iframe in
// a fixed-height box (no layout shift), with a title attribute and a localized caption linking to the full tool page.
// Unknown widget names render nothing. Shared by the React article renderer (NewsDetailPage.jsx) and the Worker's
// fallback article HTML so both produce the same block. Plain-text consumers (summaries, FAQ schema) drop the line.
// Self-contained on purpose: the article chunk must not import the data-page module (market-data-pages.js).

export const ARTICLE_EMBED_LINE = /^::embed[ \t]+([A-Za-z][A-Za-z0-9-]{0,31})(?:[ \t]+([A-Za-z0-9]{1,15}))?[ \t]*$/;
const ANY_EMBED_LINE = /^[ \t]*::embed\b.*$/;

// Widget kinds: iframe height = the widget's fixed height (EMBED_KINDS in market-data-pages.js; pinned by
// tests/article-embeds.test.mjs), tool page = the data page the widget mirrors.
export const ARTICLE_EMBED_KINDS = Object.freeze({
  liquidations: Object.freeze({ height: 360, toolPath: "/liquidations", symbolParam: false }),
  "funding-rates": Object.freeze({ height: 400, toolPath: "/funding-rates", symbolParam: true }),
});
const ALIASES = Object.freeze({
  liquidations: "liquidations", liquidation: "liquidations", liqs: "liquidations",
  funding: "funding-rates", "funding-rates": "funding-rates", "funding-rate": "funding-rates", fundingrates: "funding-rates",
});

// Path prefixes of the 17 UI locales (localizedHref; English has none).
const LOCALE_PREFIX = Object.freeze({ en: "", "zh-Hans": "/zh-hans", "zh-Hant": "/zh-hant", es: "/es", "pt-BR": "/pt-br", fr: "/fr", de: "/de", it: "/it", ja: "/ja", ko: "/ko", ru: "/ru", tr: "/tr", id: "/id-id", vi: "/vi", ar: "/ar", ur: "/ur", uk: "/uk-ua" });

export const ARTICLE_EMBED_COPY = Object.freeze({
  en: { liquidations: "Crypto liquidations today", "funding-rates": "Crypto funding rates: Binance vs OKX", live: "Live NexuAlpha data, refreshed every few minutes.", open: "Open the full page" },
  "zh-Hans": { liquidations: "今日加密货币爆仓", "funding-rates": "加密货币资金费率：Binance vs OKX", live: "NexuAlpha 实时数据，每隔几分钟刷新。", open: "打开完整页面" },
  "zh-Hant": { liquidations: "今日加密貨幣爆倉", "funding-rates": "加密貨幣資金費率：Binance vs OKX", live: "NexuAlpha 即時數據，每隔幾分鐘更新。", open: "開啟完整頁面" },
  es: { liquidations: "Liquidaciones cripto de hoy", "funding-rates": "Tasas de funding cripto: Binance vs OKX", live: "Datos en vivo de NexuAlpha, actualizados cada pocos minutos.", open: "Abrir la página completa" },
  "pt-BR": { liquidations: "Liquidações cripto de hoje", "funding-rates": "Taxas de funding cripto: Binance vs OKX", live: "Dados ao vivo da NexuAlpha, atualizados a cada poucos minutos.", open: "Abrir a página completa" },
  fr: { liquidations: "Liquidations crypto aujourd'hui", "funding-rates": "Taux de funding crypto : Binance vs OKX", live: "Données NexuAlpha en direct, actualisées toutes les quelques minutes.", open: "Ouvrir la page complète" },
  de: { liquidations: "Krypto-Liquidationen heute", "funding-rates": "Krypto-Funding-Raten: Binance vs. OKX", live: "Live-Daten von NexuAlpha, alle paar Minuten aktualisiert.", open: "Ganze Seite öffnen" },
  it: { liquidations: "Liquidazioni crypto di oggi", "funding-rates": "Tassi di funding crypto: Binance vs OKX", live: "Dati NexuAlpha in tempo reale, aggiornati ogni pochi minuti.", open: "Apri la pagina completa" },
  ja: { liquidations: "本日の暗号資産清算", "funding-rates": "暗号資産の資金調達率：Binance vs OKX", live: "NexuAlpha のライブデータ（数分ごとに更新）。", open: "ページ全体を開く" },
  ko: { liquidations: "오늘의 암호화폐 청산", "funding-rates": "암호화폐 펀딩비: 바이낸스 vs OKX", live: "NexuAlpha 실시간 데이터, 몇 분마다 갱신됩니다.", open: "전체 페이지 열기" },
  ru: { liquidations: "Ликвидации криптовалют сегодня", "funding-rates": "Ставки финансирования крипто: Binance и OKX", live: "Живые данные NexuAlpha, обновляются каждые несколько минут.", open: "Открыть полную страницу" },
  tr: { liquidations: "Bugünkü kripto tasfiyeleri", "funding-rates": "Kripto fonlama oranları: Binance vs OKX", live: "Canlı NexuAlpha verisi, birkaç dakikada bir yenilenir.", open: "Sayfanın tamamını aç" },
  id: { liquidations: "Likuidasi kripto hari ini", "funding-rates": "Funding rate kripto: Binance vs OKX", live: "Data langsung NexuAlpha, diperbarui setiap beberapa menit.", open: "Buka halaman lengkap" },
  vi: { liquidations: "Thanh lý crypto hôm nay", "funding-rates": "Funding rate crypto: Binance vs OKX", live: "Dữ liệu trực tiếp của NexuAlpha, cập nhật vài phút một lần.", open: "Mở trang đầy đủ" },
  ar: { liquidations: "تصفيات العملات الرقمية اليوم", "funding-rates": "أسعار التمويل للعملات الرقمية: Binance مقابل OKX", live: "بيانات NexuAlpha المباشرة، تُحدَّث كل بضع دقائق.", open: "افتح الصفحة الكاملة" },
  // l10n: needs native review
  ur: { liquidations: "آج کی کرپٹو لیکویڈیشنز", "funding-rates": "کرپٹو فنڈنگ ریٹس: Binance vs OKX", live: "NexuAlpha کا لائیو ڈیٹا، ہر چند منٹ بعد تازہ ہوتا ہے۔", open: "مکمل صفحہ کھولیں" },
  // l10n: needs native review
  uk: { liquidations: "Криптоліквідації сьогодні", "funding-rates": "Ставки фінансування криптодеривативів: Binance vs OKX", live: "Живі дані NexuAlpha, оновлюються кожні кілька хвилин.", open: "Відкрити повну сторінку" },
});

const LINK_SEPARATOR = Object.freeze({ "zh-Hans": "：", "zh-Hant": "：", ja: "：", fr: " : " });

export function isArticleEmbedLine(line) {
  return ANY_EMBED_LINE.test(String(line ?? ""));
}

/**
 * null: not a directive. { kind: null }: a directive with an unknown widget (renders nothing).
 * { kind, symbol }: a known widget; symbol (funding only) is an upper-case ticker such as "BTC".
 */
export function parseArticleEmbed(block) {
  const text = String(block ?? "").trim();
  if (!isArticleEmbedLine(text) || text.includes("\n")) return null;
  const match = text.match(ARTICLE_EMBED_LINE);
  const kind = match ? ALIASES[match[1].toLowerCase()] || null : null;
  if (!kind) return { kind: null, symbol: null };
  const symbol = ARTICLE_EMBED_KINDS[kind].symbolParam && match[2] ? match[2].toUpperCase() : null;
  return { kind, symbol };
}

const embedLocale = (locale) => (Object.hasOwn(ARTICLE_EMBED_COPY, locale) ? locale : String(locale || "").startsWith("zh") ? "zh-Hans" : "en");

/** Everything the renderers need for one embed block, or null when nothing should render. */
export function articleEmbedModel(directive, locale = "en") {
  const kind = directive?.kind;
  const spec = kind ? ARTICLE_EMBED_KINDS[kind] : null;
  if (!spec) return null;
  const loc = embedLocale(locale);
  const copy = ARTICLE_EMBED_COPY[loc];
  const query = new URLSearchParams({ locale: loc, theme: "dark" }); // articles render on the dark editorial system
  if (directive.symbol) query.set("symbol", directive.symbol);
  return {
    kind,
    symbol: directive.symbol || null,
    src: `/embed/${kind}?${query.toString()}`,
    height: spec.height,
    title: `${copy[kind]} — NexuAlpha`,
    caption: copy.live,
    toolHref: `${LOCALE_PREFIX[loc]}${spec.toolPath}`,
    toolLabel: copy.open,
    toolName: copy[kind],
    // "Open the full page: <tool>" with the locale's colon (full-width in CJK, spaced in French).
    toolLinkText: `${copy.open}${LINK_SEPARATOR[loc] || ": "}${copy[kind]}`,
  };
}

const esc = (value) => String(value ?? "").replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]));

// Static HTML for the Worker's fallback article body; same structure and attributes as the React block.
export function articleEmbedHtml(model) {
  if (!model) return "";
  return `<figure class="news-embed" data-embed-kind="${esc(model.kind)}"><div class="news-embed__frame" style="height:${model.height}px"><iframe src="${esc(model.src)}" title="${esc(model.title)}" loading="lazy" width="100%" height="${model.height}" scrolling="no" referrerpolicy="strict-origin-when-cross-origin"></iframe></div><figcaption class="news-embed__caption"><span>${esc(model.caption)}</span> <a href="${esc(model.toolHref)}">${esc(model.toolLinkText)}</a></figcaption></figure>`;
}

/** Removes directive lines from text bound for plain-text surfaces (summaries, FAQ answers, excerpts). */
export function stripArticleEmbedDirectives(text) {
  return String(text ?? "").split("\n").filter((line) => !isArticleEmbedLine(line)).join("\n");
}

/** Puts every directive line in a paragraph of its own (a writer may forget the blank lines around it). */
export function isolateArticleEmbedDirectives(markdown) {
  const lines = String(markdown ?? "").split("\n");
  if (!lines.some((line) => isArticleEmbedLine(line))) return String(markdown ?? "");
  const out = [];
  for (const line of lines) {
    if (isArticleEmbedLine(line)) {
      if (out.length && out[out.length - 1].trim() !== "") out.push("");
      out.push(line.trim(), "");
    } else {
      if (line.trim() === "" && out.length && out[out.length - 1] === "") continue;
      out.push(line);
    }
  }
  return out.join("\n");
}

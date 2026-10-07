import { buildTelegramWebsiteFunnelContext, TELEGRAM_WAVE22_ONSITE_BOT_HANDOFFS } from "../../data/telegram-config.js";

const safeContext = (value, fallback) => String(value || fallback || "").trim();

const handoffCopy = {
  "zh-Hans": { eyebrow: "站内 → Bot", title: "把当前研究带到 NexuAlpha Bot 继续核对", body: "先看完本页的来源路径，再把市场、产品和语言上下文带到 Bot。Bot 只用于来源核对、费用背景和后续记录。", button: "打开 NexuAlpha Bot ↗", ariaLabel: "把当前站内研究带到 NexuAlpha Bot" },
  "zh-Hant": { eyebrow: "站內 → Bot", title: "把當前研究帶到 NexuAlpha Bot 繼續核對", body: "先看完本頁的來源路徑，再把市場、產品與語言脈絡帶到 Bot。Bot 只用於來源核對、費用背景與後續記錄。", button: "打開 NexuAlpha Bot ↗", ariaLabel: "把當前站內研究帶到 NexuAlpha Bot" },
  ja: { eyebrow: "サイト内 → Bot", title: "この調査を NexuAlpha Bot で続ける", body: "まずこのページの出典ルートを確認し、市場・商品・言語の文脈を Bot に引き継ぎます。Bot は出典確認、手数料の文脈、追跡メモに使います。", button: "NexuAlpha Bot を開く ↗", ariaLabel: "このサイト内調査を NexuAlpha Bot で続ける" },
  ko: { eyebrow: "사이트 → Bot", title: "현재 리서치를 NexuAlpha Bot에서 이어가기", body: "먼저 이 페이지의 출처 경로를 확인한 뒤 시장, 상품, 언어 맥락을 Bot으로 넘깁니다. Bot은 출처 확인, 수수료 맥락, 후속 메모용입니다.", button: "NexuAlpha Bot 열기 ↗", ariaLabel: "현재 사이트 리서치를 NexuAlpha Bot에서 이어가기" },
  tr: { eyebrow: "Site → Bot", title: "Bu araştırmaya NexuAlpha Bot ile devam edin", body: "Önce bu sayfadaki kaynak yolunu inceleyin; ardından piyasa, ürün ve dil bağlamını Bot'a taşıyın. Bot kaynak kontrolü, ücret bağlamı ve takip notları içindir.", button: "NexuAlpha Bot'u aç ↗", ariaLabel: "Bu site araştırmasına NexuAlpha Bot ile devam edin" },
  es: { eyebrow: "Sitio → Bot", title: "Continúa esta investigación en NexuAlpha Bot", body: "Revisa primero la ruta de fuentes de esta página y conserva el contexto de mercado, producto e idioma en el Bot. El Bot sirve para verificar fuentes, contexto de comisiones y notas de seguimiento.", button: "Abrir NexuAlpha Bot ↗", ariaLabel: "Continuar esta investigación del sitio en NexuAlpha Bot" },
  "pt-BR": { eyebrow: "Site → Bot", title: "Continue esta pesquisa no NexuAlpha Bot", body: "Revise primeiro o caminho de fontes desta página e leve contexto de mercado, produto e idioma para o Bot. O Bot serve para checagem de fontes, contexto de taxas e notas de acompanhamento.", button: "Abrir NexuAlpha Bot ↗", ariaLabel: "Continuar esta pesquisa do site no NexuAlpha Bot" },
  fr: { eyebrow: "Site → Bot", title: "Continuer cette recherche dans NexuAlpha Bot", body: "Consultez d'abord les sources de cette page, puis conservez le marché, le produit et la langue dans le Bot. Le Bot sert aux vérifications de sources, au contexte des frais et aux notes de suivi.", button: "Ouvrir NexuAlpha Bot ↗", ariaLabel: "Continuer cette recherche du site dans NexuAlpha Bot" },
  de: { eyebrow: "Site → Bot", title: "Diese Recherche im NexuAlpha Bot fortsetzen", body: "Prüfen Sie zuerst die Quellen auf dieser Seite und übernehmen Sie Markt-, Produkt- und Sprachkontext in den Bot. Der Bot dient Quellenchecks, Gebührenkontext und Follow-up-Notizen.", button: "NexuAlpha Bot öffnen ↗", ariaLabel: "Diese Recherche im NexuAlpha Bot fortsetzen" },
  ru: { eyebrow: "Сайт → Bot", title: "Продолжить проверку в NexuAlpha Bot", body: "Сначала проверьте источники на этой странице, затем передайте в Bot контекст рынка, продукта и языка. Bot нужен для проверки источников, контекста комиссий и заметок.", button: "Открыть NexuAlpha Bot ↗", ariaLabel: "Продолжить исследование сайта в NexuAlpha Bot" },
  ar: { eyebrow: "الموقع → Bot", title: "تابع هذا البحث في NexuAlpha Bot", body: "راجع مسار المصادر في هذه الصفحة أولاً، ثم انقل سياق السوق والمنتج واللغة إلى Bot. يستخدم Bot لفحص المصادر وسياق الرسوم وملاحظات المتابعة.", button: "فتح NexuAlpha Bot ↗", ariaLabel: "تابع هذا البحث من الموقع في NexuAlpha Bot" },
  id: { eyebrow: "Situs → Bot", title: "Lanjutkan riset ini di NexuAlpha Bot", body: "Tinjau jalur sumber di halaman ini dahulu, lalu bawa konteks pasar, produk, dan bahasa ke Bot. Bot dipakai untuk cek sumber, konteks biaya, dan catatan lanjutan.", button: "Buka NexuAlpha Bot ↗", ariaLabel: "Lanjutkan riset situs ini di NexuAlpha Bot" },
  vi: { eyebrow: "Trang → Bot", title: "Tiếp tục nghiên cứu này trong NexuAlpha Bot", body: "Hãy xem đường dẫn nguồn trên trang này trước, rồi chuyển ngữ cảnh thị trường, sản phẩm và ngôn ngữ sang Bot. Bot dùng để kiểm tra nguồn, bối cảnh phí và ghi chú tiếp theo.", button: "Mở NexuAlpha Bot ↗", ariaLabel: "Tiếp tục nghiên cứu trên trang này trong NexuAlpha Bot" },
  it: { eyebrow: "Sito → Bot", title: "Continua questa ricerca in NexuAlpha Bot", body: "Prima controlla il percorso delle fonti in questa pagina, poi porta nel Bot contesto di mercato, prodotto e lingua. Il Bot serve per verifiche delle fonti, contesto sulle commissioni e note di follow-up.", button: "Apri NexuAlpha Bot ↗", ariaLabel: "Continua questa ricerca del sito in NexuAlpha Bot" },
  en: { eyebrow: "ONSITE → BOT", title: "Continue this research in the NexuAlpha Bot", body: "Keep the same market, product and locale context in the Bot after reviewing this page. The Bot route is for source checks, fee context and follow-up notes only.", button: "Open NexuAlpha Bot ↗", ariaLabel: "Continue this onsite research in the NexuAlpha Bot" },
};

const copyForLocale = (locale) => {
  const normalized = String(locale || "en");
  if (handoffCopy[normalized]) return handoffCopy[normalized];
  const base = normalized.split("-")[0];
  return handoffCopy[base] || handoffCopy.en;
};

function contextFromCanonicalPath(canonicalPath = "") {
  const path = String(canonicalPath || "").split("?")[0].split("#")[0];
  const exchangeMatch = path.match(/^\/exchanges\/([a-z0-9-]+)$/i);
  if (exchangeMatch) return { intent: "monitor", venue: exchangeMatch[1], route: path };
  const compareMatch = path.match(/^\/compare\/([a-z0-9-]+-vs-[a-z0-9-]+(?:-vs-[a-z0-9-]+)?)$/i);
  if (compareMatch) return { intent: "compare", pair: compareMatch[1], route: path };
  if (path === "/rates") return { intent: "fees", venue: "all", route: "/rates" };
  if (path === "/br" || path.startsWith("/br/")) return { intent: "compare", pair: "binance-vs-okx", route: path };
  return { intent: "monitor", route: path };
}

export function OnsiteTelegramBotHandoff({
  canonicalPath,
  locale = "en",
  market,
  product,
  placement,
  intent,
  venue,
  pair,
  returnRoute,
  campaign,
  queries,
  compact = true,
}) {
  const handoff = TELEGRAM_WAVE22_ONSITE_BOT_HANDOFFS[canonicalPath];
  const inferred = contextFromCanonicalPath(canonicalPath);
  const explicitContext = Boolean(intent || venue || pair || returnRoute || campaign || queries?.length);
  if (!handoff && !explicitContext && !inferred.venue && !inferred.pair && !inferred.route) return null;
  if (handoff && (handoff.onsiteFirst !== true || !handoff.botDeepLinkAction)) return null;

  const context = {
    market: safeContext(market, handoff?.context?.market),
    locale: safeContext(locale, handoff?.context?.locale),
    product: safeContext(product, handoff?.context?.product),
  };
  const botAction = handoff?.botDeepLinkAction || {};
  const resolvedIntent = intent || inferred.intent || (botAction.action === "compare" ? "compare" : botAction.action === "fee_calc" ? "fees" : "monitor");
  const resolvedRoute = returnRoute || inferred.route;
  const funnel = buildTelegramWebsiteFunnelContext({
    intent: resolvedIntent,
    ...botAction,
    venue: venue || botAction.venue || inferred.venue,
    pair: pair || botAction.pair || inferred.pair,
    returnRoute: (returnRoute || resolvedIntent === "fees" || inferred.route?.startsWith("/br")) ? resolvedRoute : undefined,
    market: context.market,
    locale: context.locale,
    product: context.product,
    campaign: campaign || (handoff ? "wave23-onsite-visible-handoff" : "r40-contextual-telegram-return"),
  });
  const visibleQueries = (queries || handoff?.queries || []).slice(0, 2);
  const copy = copyForLocale(context.locale);

  return (
    <aside
      className={`v3-onsite-telegram-handoff${compact ? " v3-onsite-telegram-handoff--compact" : ""}`}
      aria-label={copy.ariaLabel}
      data-cta-kind="telegram"
      data-cta-placement={placement}
      data-growth-decision="onsite_bot_handoff"
      data-growth-placement="onsite-bot-handoff"
      data-r40-contextual-telegram="true"
      data-telegram-owner-level="true"
      data-telegram-canonical={canonicalPath}
      data-telegram-intent={resolvedIntent}
      data-telegram-market={context.market}
      data-telegram-locale={context.locale}
      data-telegram-product={context.product}
      data-telegram-return-route={resolvedRoute}
      data-telegram-return-href={funnel.returnHref}
      data-telegram-web-only-fallback="false"
      data-telegram-review-cadence="24h-7d"
      data-telegram-anonymous-metrics={handoff?.measurement?.policy || "anonymous onsite Telegram handoff clicks only; no partner conversion, KYC, account, payout or message-send evidence"}
    >
      <div className="v3-onsite-telegram-handoff__copy">
        <span className="v3-onsite-telegram-handoff__eyebrow">{copy.eyebrow}</span>
        <h2>{copy.title}</h2>
        <p>{copy.body}</p>
        {visibleQueries.length > 0 && (
          <ul>
            {visibleQueries.map((query) => <li key={query}>{query}</li>)}
          </ul>
        )}
      </div>
      <a
        href={funnel.deepLink}
        target="_blank"
        rel="noopener noreferrer"
        className="v3-onsite-telegram-handoff__button"
        data-cta-kind="telegram"
        data-cta-placement={`${placement}-launch`}
        data-growth-decision="onsite_bot_handoff_launch"
        data-growth-placement="onsite-bot-handoff-launch"
        data-growth-market={context.market}
        data-growth-product={context.product}
        data-telegram-start={funnel.startPayload}
        data-telegram-return-href={funnel.returnHref}
        data-telegram-web-only-fallback="false"
        data-r40-contextual-telegram="true"
      >
        {copy.button}
      </a>
    </aside>
  );
}

export default OnsiteTelegramBotHandoff;

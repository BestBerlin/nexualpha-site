// "Get alerts on Telegram" for the data surfaces (2026-10-13): /flash, coin pages, /liquidations and /funding-rates. One line that
// names the personal triggers the bot now takes in a private chat (price level, 1h move, liquidation spike, funding
// extreme, new listing) and opens @NexuAlphaAssistantBot on its /alerts card in the reader's language; subscribing
// there is the explicit opt-in. CSS-free on purpose: each route styles `.nx-tgcta` in its own stylesheet, so this
// module can be shared by three route chunks without a shared stylesheet (vite.config.mjs pins it).

// Same language set as the bot's /alerts card (NewsTelegramAlerts.jsx telegramAlertsUrl); others open the plain card.
const CARD_LANG = { en: "en", "zh-Hans": "zh", "zh-Hant": "zh", ru: "ru", tr: "tr", vi: "vi", id: "id", es: "es", "pt-BR": "pt" };
export const TELEGRAM_TRIGGER_BOT_URL = "https://t.me/NexuAlphaAssistantBot?start=alerts";
export const telegramTriggerUrl = (locale = "en") => (CARD_LANG[locale] ? `${TELEGRAM_TRIGGER_BOT_URL}-${CARD_LANG[locale]}` : TELEGRAM_TRIGGER_BOT_URL);

// [line, button]
const COPY = {
  en: ["Price levels, 1-hour moves, liquidation spikes, funding extremes and new listings, sent to you in Telegram.", "Get alerts on Telegram"],
  "zh-Hans": ["价格到价、1 小时大幅异动、爆仓激增、资金费率极值与新币上线，通过 Telegram 机器人私信实时提醒你。", "订阅 Telegram 实时提醒"],
  "zh-Hant": ["價格到位、1 小時異動、爆倉激增、資金費率極值和新幣上線，在 Telegram 私訊提醒你。", "在 Telegram 接收提醒"],
  es: ["Niveles de precio, movimientos en 1 hora, picos de liquidaciones, financiación extrema y nuevos listados, directo a tu Telegram.", "Recibe alertas en Telegram"],
  "pt-BR": ["Níveis de preço, movimentos em 1 hora, picos de liquidação, financiamento extremo e novas listagens, direto no seu Telegram.", "Receba alertas no Telegram"],
  fr: ["Niveaux de prix, mouvements sur 1 heure, pics de liquidations, financement extrême et nouvelles cotations, envoyés sur Telegram.", "Recevoir les alertes sur Telegram"],
  de: ["Kursmarken, 1-Stunden-Bewegungen, Liquidationsspitzen, extremes Funding und neue Listings, direkt in Telegram.", "Alerts auf Telegram erhalten"],
  it: ["Livelli di prezzo, movimenti a 1 ora, picchi di liquidazioni, funding estremi e nuovi listing, direttamente su Telegram.", "Ricevi gli avvisi su Telegram"],
  ja: ["価格到達、1時間の急変、清算の急増、極端な資金調達率、新規上場をTelegramでお知らせします。", "Telegramでアラートを受け取る"],
  ko: ["목표가 도달, 1시간 급등락, 대규모 청산, 이상 펀딩비, 신규 상장 소식을 텔레그램으로 받아 보세요.", "텔레그램 실시간 알림 받기"],
  ru: ["Ценовые уровни, движения за 1 час, всплески ликвидаций, экстремальное финансирование и новые листинги — в Telegram.", "Получать оповещения в Telegram"],
  tr: ["Fiyat seviyeleri, 1 saatlik hareketler, likidasyon sıçramaları, uç fonlama oranları ve yeni listelemeler Telegram'da.", "Uyarıları Telegram'da al"],
  id: ["Level harga, pergerakan 1 jam, lonjakan likuidasi, funding ekstrem, dan listing baru, langsung ke Telegram Anda.", "Dapatkan peringatan di Telegram"],
  vi: ["Mốc giá, biến động 1 giờ, thanh lý tăng vọt, funding cực đoan và niêm yết mới, gửi thẳng qua Telegram.", "Nhận cảnh báo qua Telegram"],
  ar: ["مستويات الأسعار وتحركات الساعة وقفزات التصفيات ومعدلات التمويل القصوى والإدراجات الجديدة، تصلك على Telegram.", "احصل على التنبيهات عبر Telegram"],
  // l10n: needs native review
  ur: ["قیمت کی سطحیں، 1 گھنٹے کی حرکت، لیکویڈیشن میں اضافہ، غیر معمولی فنڈنگ اور نئی لسٹنگ، Telegram پر۔", "Telegram پر الرٹس حاصل کریں"],
  // l10n: needs native review
  uk: ["Цінові рівні, рухи за 1 годину, сплески ліквідацій, екстремальне фінансування та нові лістинги — у Telegram.", "Отримувати сповіщення в Telegram"],
};
export const telegramTriggerCopy = (locale = "en") => COPY[locale] || (String(locale).startsWith("zh") ? COPY["zh-Hans"] : COPY.en);
export const TELEGRAM_TRIGGER_PLACEMENTS = Object.freeze(["flash-telegram-alerts", "coin-telegram-alerts", "liquidations-telegram-alerts", "funding-telegram-alerts"]);

function BellIcon() {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>;
}

export function TelegramTriggerCta({ locale = "en", placement, className = "" }) {
  const [line, action] = telegramTriggerCopy(locale);
  return <aside className={`nx-tgcta${className ? ` ${className}` : ""}`} dir={["ar", "ur"].includes(locale) ? "rtl" : "ltr"} data-telegram-alerts-strip={placement}>
    <span className="nx-tgcta__icon"><BellIcon /></span>
    <span className="nx-tgcta__text">{line}</span>
    <a className="nx-tgcta__btn" href={telegramTriggerUrl(locale)} target="_blank" rel="noopener" data-cta-kind="telegram" data-cta-placement={placement}>{action} <span aria-hidden="true">→</span></a>
  </aside>;
}

export default TelegramTriggerCta;

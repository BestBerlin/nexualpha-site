// Quiet "get alerts in Telegram" line under each article (owner 2026-10-10: close the loop site -> Telegram).
// The deep link opens the bot's /alerts card directly; subscribing there is the reader's explicit opt-in.
export const TELEGRAM_ALERTS_URL = "https://t.me/NexuAlphaAssistantBot?start=alerts";
// The bot's /alerts card speaks zh, en, ru, tr, vi, id, es, pt (release 2026-10-11-alerts-i18n-01); ?start=alerts-<lang>
// opens it in that language. Locales the bot does not have fall back to the plain link (the card defaults to Chinese,
// with a language row).
const ALERT_CARD_LANG = { en: "en", "zh-Hans": "zh", "zh-Hant": "zh", ru: "ru", tr: "tr", vi: "vi", id: "id", es: "es", "pt-BR": "pt" };
export function telegramAlertsUrl(locale = "en") {
  const lang = ALERT_CARD_LANG[locale];
  return lang ? `${TELEGRAM_ALERTS_URL}-${lang}` : TELEGRAM_ALERTS_URL;
}

// One copy source for every "get alerts" line on the site (article footer, home / venue / news-list strips).
export const TELEGRAM_ALERTS_COPY = {
  en: ["Get liquidation and sharp-move alerts in Telegram", "Open the bot"],
  "zh-Hans": ["在 Telegram 接收爆仓与急涨急跌告警", "打开机器人"],
  "zh-Hant": ["在 Telegram 接收爆倉與急漲急跌提醒", "打開機器人"],
  es: ["Recibe alertas de liquidaciones y movimientos bruscos en Telegram", "Abrir el bot"],
  "pt-BR": ["Receba alertas de liquidações e movimentos bruscos no Telegram", "Abrir o bot"],
  fr: ["Recevez les alertes de liquidations et de mouvements brusques sur Telegram", "Ouvrir le bot"],
  de: ["Liquidations- und Kurssprung-Alarme in Telegram erhalten", "Bot öffnen"],
  it: ["Ricevi su Telegram gli avvisi di liquidazioni e movimenti bruschi", "Apri il bot"],
  ja: ["清算と急変動のアラートを Telegram で受け取る", "ボットを開く"],
  ko: ["청산·급등락 알림을 텔레그램으로 받기", "봇 열기"],
  ru: ["Получайте уведомления о ликвидациях и резких движениях в Telegram", "Открыть бота"],
  tr: ["Tasfiye ve sert fiyat hareketi uyarılarını Telegram'da alın", "Botu aç"],
  id: ["Dapatkan peringatan likuidasi dan pergerakan tajam di Telegram", "Buka bot"],
  vi: ["Nhận cảnh báo thanh lý và biến động mạnh trên Telegram", "Mở bot"],
  ar: ["احصل على تنبيهات التصفية والتحركات الحادة على تيليجرام", "افتح البوت"],

 // l10n: needs native review
 ur: ["Telegram میں لیکویڈیشن اور تیز اتار چڑھاؤ کے الرٹس حاصل کریں","بوٹ کھولیں"],
 // l10n: needs native review
 uk: ["Отримуйте сповіщення про ліквідації та різкі зміни в Telegram","Відкрити бота"],
};
const COPY = TELEGRAM_ALERTS_COPY;

export const telegramAlertsCopy = (locale) => COPY[locale] || (String(locale || "").startsWith("zh") ? COPY["zh-Hans"] : COPY.en);

export function NewsTelegramAlerts({ locale = "en" }) {
  const [text, action] = COPY[locale] || COPY.en;
  return (
    <aside className="news-tg-alerts" dir={["ar", "ur"].includes(locale) ? "rtl" : "ltr"}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 4 3 11l6 2m12-9-4 16-8-7m12-9L9 13" /></svg>
      <span>{text}</span>
      <a href={telegramAlertsUrl(locale)} target="_blank" rel="noopener" data-cta-placement="news-telegram-alerts">{action} →</a>
    </aside>
  );
}

// Quiet "get alerts in Telegram" line under each article (owner 2026-10-10: close the loop site -> Telegram).
// The deep link opens the bot's /alerts card directly; subscribing there is the reader's explicit opt-in.
const ALERTS_URL = "https://t.me/NexuAlphaAssistantBot?start=alerts";

const COPY = {
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
};

export function NewsTelegramAlerts({ locale = "en" }) {
  const [text, action] = COPY[locale] || COPY.en;
  return (
    <aside className="news-tg-alerts" dir={locale === "ar" ? "rtl" : "ltr"}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 4 3 11l6 2m12-9-4 16-8-7m12-9L9 13" /></svg>
      <span>{text}</span>
      <a href={ALERTS_URL} target="_blank" rel="noopener" data-cta-placement="news-telegram-alerts">{action} →</a>
    </aside>
  );
}

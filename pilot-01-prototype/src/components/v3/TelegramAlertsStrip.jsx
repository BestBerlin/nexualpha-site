// Compact site-wide "get alerts in Telegram" strip (owner 2026-10-10): one line — icon, text, button — reusing the
// article-footer copy source so every placement says the same thing. The deep link opens the bot's /alerts card;
// subscribing there is the reader's explicit opt-in. Placements: home-telegram-alerts (under the home hero),
// venue-telegram-alerts (below the registration card), news-list-telegram-alerts (top of the news list).
import { TELEGRAM_ALERTS_URL, telegramAlertsCopy } from "./news/NewsTelegramAlerts.jsx";
import "./telegram-signal-strip.css";

export const TELEGRAM_ALERTS_STRIP_PLACEMENTS = Object.freeze(["home-telegram-alerts", "venue-telegram-alerts", "news-list-telegram-alerts"]);

function PlaneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M21 4 3 11l6 2m12-9-4 16-8-7m12-9L9 13" />
    </svg>
  );
}

export function TelegramAlertsStrip({ locale = "en", placement, className = "" }) {
  const [text, action] = telegramAlertsCopy(locale);
  return (
    <aside className={`tg-signal-strip${className ? ` ${className}` : ""}`} dir={locale === "ar" ? "rtl" : "ltr"} data-telegram-alerts-strip={placement}>
      <span className="tg-signal-strip__icon"><PlaneIcon /></span>
      <span className="tg-signal-strip__text">{text}</span>
      <a className="tg-signal-strip__btn" href={TELEGRAM_ALERTS_URL} target="_blank" rel="noopener" data-cta-kind="telegram" data-cta-placement={placement}>{action} →</a>
    </aside>
  );
}

export default TelegramAlertsStrip;

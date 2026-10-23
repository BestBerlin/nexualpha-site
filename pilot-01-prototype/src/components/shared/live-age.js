// One page clock, subscribed only by visible rails. No React renders per tick.
import { scheduleVisible } from './visibility-scheduler.js';
const listeners = new Set();
let stop = null;
export function subscribeLiveAge(fn) {
  listeners.add(fn); fn(Date.now());
  // relativeFeedTime displays whole minutes, never seconds.
  stop ??= scheduleVisible(now => { for (const listener of listeners) listener(now); }, 60_000);
  return () => { listeners.delete(fn); if (!listeners.size) { stop?.(); stop = null; } };
}
export function relativeFeedTime(iso, locale, now) {
  const age = Math.max(0, Math.floor((now - Date.parse(iso)) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale || 'en', { numeric: 'auto' });
  if (age < 60) return rtf.format(0, 'second');
  if (age < 3600) return rtf.format(-Math.floor(age / 60), 'minute');
  if (age < 86400) return rtf.format(-Math.floor(age / 3600), 'hour');
  return new Intl.DateTimeFormat(locale || 'en', { timeZone: 'Asia/Singapore', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
}

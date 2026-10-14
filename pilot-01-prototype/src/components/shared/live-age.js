// One page clock, subscribed only by visible rails. No React renders per tick.
const listeners = new Set();
let timer = null;
function sync() {
  const active = listeners.size && document.visibilityState === 'visible';
  if (active && timer === null) timer = setInterval(() => { const now = Date.now(); for (const fn of listeners) fn(now); }, 1000);
  if (!active && timer !== null) { clearInterval(timer); timer = null; }
}
export function subscribeLiveAge(fn) {
  if (!listeners.size) document.addEventListener('visibilitychange', sync);
  listeners.add(fn); fn(Date.now()); sync();
  return () => { listeners.delete(fn); sync(); if (!listeners.size) document.removeEventListener('visibilitychange', sync); };
}
export function relativeFeedTime(iso, locale, now) {
  const age = Math.max(0, Math.floor((now - Date.parse(iso)) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale || 'en', { numeric: 'auto' });
  if (age < 60) return rtf.format(0, 'second');
  if (age < 3600) return rtf.format(-Math.floor(age / 60), 'minute');
  if (age < 86400) return rtf.format(-Math.floor(age / 3600), 'hour');
  return new Intl.DateTimeFormat(locale || 'en', { timeZone: 'Asia/Singapore', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
}

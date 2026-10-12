// Flash stream alerts (2026-10-13): opt-in browser notifications and a soft chime for new "Important" items, only
// while the /flash page is open (Notification API, no service worker, no push subscription). Every browser API is
// feature-checked and wrapped: private windows, blocked storage or a missing AudioContext simply turn the feature off.
const PREF_PREFIX = "nexualpha:flash:";

export function readFlashPref(name) {
  try { return globalThis.localStorage?.getItem(`${PREF_PREFIX}${name}`) === "1"; } catch { return false; }
}
export function writeFlashPref(name, on) {
  try { globalThis.localStorage?.setItem(`${PREF_PREFIX}${name}`, on ? "1" : "0"); } catch { /* storage blocked: session only */ }
}

/** "granted" | "denied" | "default" | "unsupported" */
export function notificationPermission() {
  try { return typeof Notification === "function" ? Notification.permission : "unsupported"; } catch { return "unsupported"; }
}
export async function requestNotifications() {
  const current = notificationPermission();
  if (current !== "default") return current;
  try { return await Notification.requestPermission(); } catch { return notificationPermission(); }
}

/** One notification per new important item (max 3 per refresh; `tag` stops duplicates across tabs). */
export function notifyImportant(items, { label = "Important", hrefFor = (item) => item.path } = {}) {
  if (notificationPermission() !== "granted") return 0;
  let shown = 0;
  for (const item of items.slice(0, 3)) {
    try {
      const note = new Notification(`${label}: ${item.headline}`, { body: item.body || "", tag: `nexualpha-flash-${item.id}`, lang: item.lang || undefined, icon: "/favicon.ico" });
      note.onclick = () => { try { window.focus(); window.location.assign(hrefFor(item)); } catch { /* ignore */ } note.close(); };
      shown += 1;
    } catch { /* some mobile browsers only allow notifications from a service worker */ }
  }
  return shown;
}

let audio = null;
/** Short, quiet two-tone chime (Web Audio, ~0.35 s, gain 0.06). Off unless the reader turned sound on. */
export function chime() {
  try {
    const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Ctx) return false;
    audio = audio || new Ctx();
    if (audio.state === "suspended") audio.resume().catch(() => {});
    const start = audio.currentTime + 0.01;
    [[880, 0], [1320, 0.12]].forEach(([freq, offset]) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(0.06, start + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.22);
      osc.connect(gain).connect(audio.destination);
      osc.start(start + offset);
      osc.stop(start + offset + 0.24);
    });
    return true;
  } catch { return false; }
}

import { startJsonPolling } from "./json-polling.js";

export const LIVE_HUB_URL = "/api/live.json";
export const LIVE_HUB_REFRESH_MS = 30 * 1000;

const listeners = new Map();
let latest = null;
let stopPolling = null;
let pollingLocale = null;
let pollingOptions = null;
let stopLifecycle = null;
const sliceSignatures = new Map();

const defaultDocument = () => (typeof document === "undefined" ? null : document);
const defaultWindow = () => (typeof window === "undefined" ? null : window);

function publish(payload) {
  latest = payload;
  for (const [slice, sliceListeners] of listeners) {
    const value = payload?.[slice] ?? (slice === "ticker" && Array.isArray(payload?.items) ? payload : undefined);
    if (value == null) continue;
    const signature = JSON.stringify(value);
    if (sliceSignatures.get(slice) === signature) continue;
    sliceSignatures.set(slice, signature);
    for (const listener of [...sliceListeners]) listener(value, payload);
  }
}

function stopActivePolling() {
  stopPolling?.();
  stopPolling = null;
}

function attachLifecycle(options) {
  stopLifecycle?.();
  const doc = options.documentRef ?? defaultDocument();
  const win = options.windowRef ?? defaultWindow();
  let paused = doc?.visibilityState === "hidden";
  const resume = () => {
    if (!paused || doc?.visibilityState === "hidden" || !listeners.size || !pollingOptions) return;
    paused = false;
    stopActivePolling();
    startPolling(pollingOptions);
  };
  const pause = () => { paused = true; stopActivePolling(); };
  const onVisibility = () => {
    if (doc?.visibilityState === "visible") resume();
    else pause();
  };
  doc?.addEventListener?.("visibilitychange", onVisibility);
  win?.addEventListener?.("pagehide", pause);
  win?.addEventListener?.("pageshow", resume);
  stopLifecycle = () => {
    doc?.removeEventListener?.("visibilitychange", onVisibility);
    win?.removeEventListener?.("pagehide", pause);
    win?.removeEventListener?.("pageshow", resume);
    stopLifecycle = null;
  };
}

function startPolling(options) {
  const { locale, everyMs, fetchImpl, documentRef, setTimer, clearTimer, now } = options;
  stopPolling = startJsonPolling({
    request: () => `${LIVE_HUB_URL}?${new URLSearchParams({ locale })}`,
    intervalMs: everyMs,
    isData: (value) => Boolean(value && typeof value === "object"),
    onData: publish,
    fetchImpl,
    documentRef,
    setTimer,
    clearTimer,
    now,
    cache: "no-cache",
  });
}

function ensurePolling({ locale = "en", everyMs = LIVE_HUB_REFRESH_MS, fetchImpl, documentRef, windowRef, setTimer, clearTimer, now } = {}) {
  const options = { locale, everyMs, fetchImpl, documentRef, windowRef, setTimer, clearTimer, now };
  if (stopPolling && pollingLocale === locale) return;
  stopActivePolling();
  pollingLocale = locale;
  pollingOptions = options;
  startPolling(options);
  attachLifecycle(options);
}

export function subscribeLiveHub(slice, listener, options = {}) {
  if (!slice || typeof listener !== "function") throw new TypeError("subscribeLiveHub requires a slice and listener");
  const sliceListeners = listeners.get(slice) || new Set();
  sliceListeners.add(listener);
  listeners.set(slice, sliceListeners);
  if (latest?.[slice] != null) listener(latest[slice], latest);
  ensurePolling(options);
  return () => {
    const current = listeners.get(slice);
    current?.delete(listener);
    if (current && current.size === 0) listeners.delete(slice);
    if (listeners.size === 0) {
      stopActivePolling();
      stopLifecycle?.();
      pollingLocale = null;
      pollingOptions = null;
      sliceSignatures.clear();
      latest = null;
    }
  };
}

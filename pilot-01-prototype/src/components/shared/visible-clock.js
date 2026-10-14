import { useEffect, useState } from "react";

const listeners = new Set();
let timer = null;
let intervalMs = 60 * 1000;
let installed = false;

const canUseDocument = () => typeof document !== "undefined" && typeof document.addEventListener === "function";
const canUseWindow = () => typeof window !== "undefined" && typeof window.addEventListener === "function";
const isVisible = () => typeof document === "undefined" || document.visibilityState === "visible";

function publish(value = Date.now()) {
  for (const listener of [...listeners]) listener(value);
}

function clearTimer() {
  if (timer !== null) clearInterval(timer);
  timer = null;
}

function sync({ refresh = false } = {}) {
  if (listeners.size && isVisible()) {
    if (refresh) publish();
    if (timer === null) timer = setInterval(() => publish(), intervalMs);
    return;
  }
  clearTimer();
}

function onVisibilityChange() {
  sync({ refresh: isVisible() });
}

function onPageHide() {
  clearTimer();
}

function onPageShow() {
  sync({ refresh: true });
}

function install() {
  if (installed) return;
  installed = true;
  if (canUseDocument()) document.addEventListener("visibilitychange", onVisibilityChange);
  if (canUseWindow()) {
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
  }
}

function uninstall() {
  if (!installed || listeners.size) return;
  installed = false;
  if (canUseDocument()) document.removeEventListener("visibilitychange", onVisibilityChange);
  if (canUseWindow()) {
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onPageShow);
  }
}

export function subscribeVisibleClock(listener, { everyMs = 60 * 1000 } = {}) {
  if (typeof listener !== "function") throw new TypeError("subscribeVisibleClock requires a listener");
  intervalMs = Math.max(intervalMs, everyMs);
  install();
  listeners.add(listener);
  listener(Date.now());
  sync();
  return () => {
    listeners.delete(listener);
    sync();
    uninstall();
  };
}

export function useVisibleClock(seed = null, { everyMs = 60 * 1000 } = {}) {
  const [now, setNow] = useState(() => {
    if (typeof seed === "number" && Number.isFinite(seed)) return seed;
    if (typeof seed === "string" && Number.isFinite(Date.parse(seed))) return Date.parse(seed);
    return null;
  });
  useEffect(() => subscribeVisibleClock(setNow, { everyMs }), [everyMs]);
  return now;
}

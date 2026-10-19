// Ticker polling (lazy chunk, loaded by TickerBar after first paint): one shared subscription store for all live market
// widgets. It polls our cached endpoint with a slower hidden-tab cadence. Never an exchange URL from the browser.
import { tickerChanges } from "./ticker-changes.js";
import { startJsonPolling } from "../shared/json-polling.js";

const TICKER_URL = "/api/ticker.json";
// Match the server refresh window; the shared helper bounds fetch and decoding with a deadline.
export const TICKER_REFRESH_MS = 6 * 1000;

const validSnapshot = (value) => Boolean(value && Array.isArray(value.items) && value.items.length);
const listeners = new Set();
let latest = null;
let stopPolling = null;

function publish(next) {
  latest = next;
  for (const listener of [...listeners]) listener(next);
}

function ensurePolling({ everyMs = TICKER_REFRESH_MS, fetchImpl, documentRef, setTimer, clearTimer, now } = {}) {
  if (stopPolling) return;
  const doc = documentRef || (typeof document === 'undefined' ? null : document);
  let active = null;
  const restart = () => {
    active?.();
    active = startJsonPolling({
      request: TICKER_URL, intervalMs: doc?.visibilityState === "hidden" ? 30_000 : everyMs,
      shouldPoll: () => true, onData: publish, isData: validSnapshot,
      fetchImpl, documentRef: doc, setTimer, clearTimer, now, cache: "no-cache",
    });
  };
  doc?.addEventListener('visibilitychange', restart);
  restart();
  stopPolling = () => { active?.(); doc?.removeEventListener('visibilitychange', restart); };
}

export function subscribe(fn, options = {}) {
  if (typeof fn !== "function") throw new TypeError("subscribe requires a function");
  listeners.add(fn);
  if (latest) fn(latest);
  ensurePolling(options);
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0) {
      stopPolling?.();
      stopPolling = null;
    }
  };
}

export function startTickerPolling(onData, options = {}) {
  return subscribe(onData, options);
}

// All measurement, interpolation and subscriptions stay in this idle-loaded chunk.
export function startTickerMotion(root, onData, initial = null) {
  if (!root) return () => {};
  const doc = root.ownerDocument;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const list = root.querySelector('.nx-ticker__list');
  const measure = () => root.style.setProperty('--ticker-duration', `${list.getBoundingClientRect().width / 55}s`);
  measure();
  const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
  observer?.observe(list);
  let held = false;
  const pause = () => root.toggleAttribute('data-paused', held || doc.hidden);
  const down = () => { held = true; pause(); };
  const up = () => { held = false; pause(); };
  root.addEventListener('pointerdown', down);
  doc.addEventListener('pointerup', up);
  doc.addEventListener('pointercancel', up);
  doc.addEventListener('visibilitychange', pause);
  pause();
  const timers = new Set();
  const frames = new Set();
  let previous = initial;
  const stop = startTickerPolling(next => {
    const before = new Map([...root.querySelectorAll('[data-tk]')].map(el => [el.dataset.tk, el.textContent]));
    const changes = previous ? tickerChanges(previous, next) : new Map();
    previous = next;
    onData(next);
    const frame = requestAnimationFrame(() => {
      frames.delete(frame);
      for (const el of root.querySelectorAll('[data-tk]')) {
        const direction = changes.get(el.dataset.tk);
        if (!direction) continue;
        el.dataset.flash = direction;
        const target = el.textContent;
        const old = before.get(el.dataset.tk);
        const parse = value => Number(String(value).replace(/−/g, '-').replace(/[$,%+\s]/g, ''));
        const from = parse(old), to = parse(target);
        if (!reduced() && el.classList.contains('nx-ticker__p') && Number.isFinite(from) && Number.isFinite(to)) {
          const decimals = target.split('.')[1]?.length || 0;
          const start = window.performance.now();
          const tick = now => {
            if (reduced() || doc.hidden) { el.textContent = target; return; }
            const progress = Math.min(1, (now - start) / 400);
            el.textContent = progress === 1 ? target : '$' + (from + (to - from) * progress).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
            if (progress < 1) { const id = requestAnimationFrame(time => { frames.delete(id); tick(time); }); frames.add(id); }
          };
          tick(start);
        }
        const timer = setTimeout(() => { delete el.dataset.flash; timers.delete(timer); }, 650);
        timers.add(timer);
      }
    });
    frames.add(frame);
  });
  return () => {
    stop(); observer?.disconnect(); timers.forEach(clearTimeout); frames.forEach(cancelAnimationFrame);
    root.removeEventListener('pointerdown', down); doc.removeEventListener('pointerup', up);
    doc.removeEventListener('pointercancel', up); doc.removeEventListener('visibilitychange', pause);
  };
}

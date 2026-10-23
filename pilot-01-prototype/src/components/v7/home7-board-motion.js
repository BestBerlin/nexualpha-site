import { whaleAgoLabel } from "../../data/whales-home.js";
import { scheduleVisible } from "../shared/visibility-scheduler.js";

// Minutes below one hour, then hours, then days ("394分钟前" → "6小时前").
export const relativeWhaleTime = (at, now, locale) => whaleAgoLabel(at, now, locale);

// Owner 2026-10-23: the board must feel alive. At most three rows beat at once: the largest buy/sell rows of $5M+
// (data-tier ≥ 1) that are actually displayed (mobile hides rows 7–8). CSS animates only transform/opacity/filter on
// pseudo-elements, and only while the board is on screen, the tab is visible and motion is allowed (root[data-live]).
export const WHALE_PULSE_MAX = 3;
export function pickPulseRows(rows, max = WHALE_PULSE_MAX, visibleCount = rows.length) {
  // CSS hides rows 7+ on narrow screens. Use that same limit instead of reading layout for each row.
  const ranked = rows.slice(0, visibleCount)
    .filter(a => Number(a.dataset?.tier) >= 1 && (a.dataset.dir === "in" || a.dataset.dir === "out"))
    .sort((a, b) => Number(b.dataset.usd) - Number(a.dataset.usd))
    .slice(0, max);
  for (const a of rows) {
    const rank = ranked.indexOf(a);
    if (!a.dataset) continue;
    if (rank < 0) delete a.dataset.pulse;
    else if (a.dataset.pulse !== String(rank + 1)) a.dataset.pulse = String(rank + 1);
  }
  return ranked;
}

export function startBoardMotion(root, locale, schedule = scheduleVisible) {
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let keys = new Set([...root.querySelectorAll("[data-mv-key]")].map(row => row.dataset.mvKey));
  const amounts = new Map();
  const animations = new Map();
  const rememberAmounts = rows => {
    for (const row of rows) {
      const node = row.querySelector?.(".h7-wh-amt");
      if (!node) continue;
      const label = node.textContent;
      const match = label.match(/^(.*?)([\d,]+(?:\.\d+)?)([^\d]*)$/);
      if (!match) continue;
      const value = Number(match[2].replaceAll(",", ""));
      const previous = amounts.get(row.dataset.mvKey);
      if (previous && previous.label !== label && previous.prefix === match[1] && previous.suffix === match[3]) {
        animations.get(row.dataset.mvKey)?.();
        const digits = match[2].split(".")[1]?.length || 0;
        animations.set(row.dataset.mvKey, tweenValue(node, previous.value, value, n => match[1] + n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: match[2].includes(",") }) + match[3]));
      }
      amounts.set(row.dataset.mvKey, { label, value, prefix: match[1], suffix: match[3] });
    }
  };
  rememberAmounts([...root.querySelectorAll("[data-mv-key]")]);
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const narrowQuery = window.matchMedia("(max-width: 760px)");
  let onScreen = typeof IntersectionObserver !== "function";
  const syncLive = () => {
    const live = onScreen && document.visibilityState !== "hidden" && !motionQuery.matches;
    if (root.dataset) live ? (root.dataset.live = "") : delete root.dataset.live;
  };
  const repick = () => pickPulseRows([...root.querySelectorAll("[data-mv-key]")], WHALE_PULSE_MAX, narrowQuery.matches ? 6 : Infinity);
  const refreshTimes = () => {
    if (!onScreen || document.visibilityState === "hidden") return;
    const now = Date.now();
    for (const time of root.querySelectorAll("time[datetime]")) {
      const label = relativeWhaleTime(time.dateTime, now, locale);
      if (label && time.textContent !== label) time.textContent = label;
    }
  };
  const seen = typeof IntersectionObserver === "function" ? new IntersectionObserver((entries) => {
    onScreen = entries.some(e => e.isIntersecting);
    syncLive();
    if (onScreen) refreshTimes();
  }) : null;
  seen?.observe(root);
  motionQuery.addEventListener?.("change", syncLive);
  narrowQuery.addEventListener?.("change", repick);
  document.addEventListener?.("visibilitychange", syncLive);
  repick();
  syncLive();
  const timers = new Set();
  const observer = new MutationObserver(() => {
    const rows = [...root.querySelectorAll("[data-mv-key]")];
    const next = new Set(rows.map(row => row.dataset.mvKey));
    for (const row of rows) {
      if (!keys.size || keys.has(row.dataset.mvKey) || reduced()) continue;
      row.classList.add("h7-wh-new");
      const timer = setTimeout(() => { row.classList.remove("h7-wh-new"); timers.delete(timer); }, 1400);
      timers.add(timer);
    }
    rememberAmounts(rows);
    repick();
    keys = next;
  });
  // Watch list replacement only; updating time text must not retrigger the observer.
  const body = root.querySelector('[data-mv="body"]');
  if (body) observer.observe(body, { childList: true });
  refreshTimes();
  const stopTimes = schedule(refreshTimes, 30000);
  return () => {
    observer.disconnect(); stopTimes(); seen?.disconnect();
    motionQuery.removeEventListener?.("change", syncLive);
    narrowQuery.removeEventListener?.("change", repick);
    document.removeEventListener?.("visibilitychange", syncLive);
    if (root.dataset) delete root.dataset.live; for (const timer of timers) clearTimeout(timer); for (const stop of animations.values()) stop(); };
}

export function tweenValue(node, before, after, format) {
  if (!Number.isFinite(before) || before === after || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const start = (window.performance || performance).now();
  let frame;
  const tick = (now) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.visibilityState === "hidden") { node.textContent = format(after); return; }
    const progress = Math.min(1, (now - start) / 400);
    node.textContent = format(before + (after - before) * (1 - (1 - progress) ** 3));
    if (progress < 1) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(frame); node.textContent = format(after); };
}

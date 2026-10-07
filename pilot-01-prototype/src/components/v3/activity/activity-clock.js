// No network polling. Wake at a known date boundary, otherwise at most once a
// minute; visibility/focus resumes immediately after a suspended tab.
export function scheduleActivityClock(onTick, deadlines = [], clock = {}) {
  const now = clock.now ?? Date.now;
  const setTimer = clock.setTimer ?? setTimeout;
  const clearTimer = clock.clearTimer ?? clearTimeout;
  const target = clock.target ?? (typeof window === "undefined" ? null : window);
  const visibility = clock.visibility ?? (typeof document === "undefined" ? null : document);
  const boundaries = deadlines.map((value) => Date.parse(value ?? "")).filter(Number.isFinite);
  let timer;
  let stopped = false;
  const tick = () => {
    if (stopped) return;
    clearTimer(timer);
    const current = now();
    onTick(current);
    const future = boundaries.filter((value) => value > current);
    const delay = future.length ? Math.min(60000, Math.min(...future) - current + 1) : 60000;
    timer = setTimer(tick, Math.max(1, delay));
  };
  tick();
  target?.addEventListener("focus", tick);
  visibility?.addEventListener("visibilitychange", tick);
  return () => {
    stopped = true;
    clearTimer(timer);
    target?.removeEventListener("focus", tick);
    visibility?.removeEventListener("visibilitychange", tick);
  };
}

export function visibilityClock(initialTime = 0) {
  let time = initialTime, id = 0, callbacks = 0;
  const timers = new Map(), listeners = new Set();
  const documentRef = {
    visibilityState: "visible",
    addEventListener: (_, fn) => listeners.add(fn),
    removeEventListener: (_, fn) => listeners.delete(fn),
  };
  const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
  return {
    documentRef, timers, listeners, now: () => time, callbacks: () => callbacks,
    setTimer(fn, delay) { timers.set(++id, { fn, at: time + delay }); return id; },
    clearTimer: key => timers.delete(key),
    visibility(state) { documentRef.visibilityState = state; for (const fn of [...listeners]) fn(); },
    async advance(ms) {
      const end = time + ms;
      for (;;) {
        const next = [...timers].filter(([, job]) => job.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        time = next[1].at;
        timers.delete(next[0]); callbacks++;
        next[1].fn(); await flush();
      }
      time = end; await flush();
    },
  };
}

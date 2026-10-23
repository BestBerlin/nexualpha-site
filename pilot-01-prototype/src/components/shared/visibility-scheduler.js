// One nearest-deadline timer for page clocks and polling. Hidden pages keep due
// times but do not wake up for visible-only work; overdue jobs run once on return.
export function createVisibilityScheduler({ documentRef = null, setTimer = setTimeout, clearTimer = clearTimeout, now = Date.now } = {}) {
  const jobs = new Set();
  let timer = null, listening = false;
  const allowed = (job) => !job.visibleOnly || documentRef?.visibilityState !== "hidden";
  function arm() {
    if (timer !== null) clearTimer(timer);
    timer = null;
    let due = Infinity;
    for (const job of jobs) if (allowed(job)) due = Math.min(due, job.due);
    if (due !== Infinity) timer = setTimer(run, Math.max(0, due - now()));
    if (!jobs.size && listening) {
      documentRef?.removeEventListener?.("visibilitychange", arm);
      listening = false;
    }
  }
  function run() {
    timer = null;
    const time = now();
    try {
      for (const job of [...jobs]) {
        if (!jobs.has(job) || !allowed(job) || job.due > time) continue;
        if (job.repeat) job.due = time + job.repeat;
        else jobs.delete(job);
        job.callback(time);
      }
    } finally { arm(); }
  }
  return {
    schedule(callback, delay, { repeat = 0, visibleOnly = true } = {}) {
      const job = { callback, repeat, visibleOnly, due: now() + delay };
      jobs.add(job);
      if (!listening) {
        documentRef?.addEventListener?.("visibilitychange", arm);
        listening = true;
      }
      arm();
      return () => { jobs.delete(job); arm(); };
    },
  };
}

const schedulers = new WeakMap();
export function visibilityScheduler(doc = typeof document === "undefined" ? globalThis : document) {
  if (!schedulers.has(doc)) schedulers.set(doc, createVisibilityScheduler({ documentRef: doc }));
  return schedulers.get(doc);
}
export function scheduleVisible(callback, intervalMs) {
  return visibilityScheduler().schedule(callback, intervalMs, { repeat: intervalMs });
}

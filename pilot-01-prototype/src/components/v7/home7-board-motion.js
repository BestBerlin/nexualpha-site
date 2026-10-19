export function relativeWhaleTime(at, now, locale) {
  const elapsed = now - Date.parse(at);
  if (!Number.isFinite(elapsed)) return null;
  const minutes = Math.max(0, Math.floor(elapsed / 60000));
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" }).format(minutes ? -minutes : 0, minutes ? "minute" : "second");
}

export function startBoardMotion(root, locale) {
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
  const timers = new Set();
  const refreshTimes = () => {
    if (document.visibilityState === "hidden") return;
    for (const time of root.querySelectorAll("time[datetime]")) {
      const label = relativeWhaleTime(time.dateTime, Date.now(), locale);
      if (label) time.textContent = label;
    }
  };
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
    keys = next;
  });
  // Watch list replacement only; updating time text must not retrigger the observer.
  const body = root.querySelector('[data-mv="body"]');
  if (body) observer.observe(body, { childList: true });
  refreshTimes();
  const interval = setInterval(refreshTimes, 30000);
  return () => { observer.disconnect(); clearInterval(interval); for (const timer of timers) clearTimeout(timer); for (const stop of animations.values()) stop(); };
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

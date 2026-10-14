import { subscribe as subscribeTicker } from "../ticker/ticker-live.js";

const SYMBOLS = Object.freeze(["BTC", "ETH", "SOL", "BNB", "XRP"]);
const DEPTH_INTERVAL_MS = 1400;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function numberFromText(value) {
  const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function chartPath(values, actualSamples = values.length) {
  const points = values.length ? values.slice(-48) : [0, 0];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const pad = Math.max((max - min) * 0.08, max ? Math.abs(max) * 0.002 : 1);
  const low = min - pad;
  const high = max + pad;
  const span = high - low || 1;
  const step = points.length > 1 ? 400 / (points.length - 1) : 400;
  const coords = points.map((value, index) => {
    const x = Math.round(index * step * 100) / 100;
    const y = Math.round((150 - ((value - low) / span) * 150) * 100) / 100;
    return [x, y];
  });
  const line = coords.map(([x, y], index) => `${index ? "L" : "M"}${x} ${y}`).join("");
  const last = coords[coords.length - 1] || [400, 75];
  return {
    line,
    area: `${line}L400 150L0 150Z`,
    tip: last,
    mature: actualSamples >= 6,
  };
}

function rowsFromDom(root) {
  return [...root.querySelectorAll(".ht-tick li")].map((node) => ({
    sym: node.querySelector("b")?.textContent?.trim(),
    price: node.querySelector(".ht-p")?.textContent?.trim(),
    change: node.querySelector(".ht-c")?.textContent?.trim(),
    dir: node.getAttribute("data-dir") || "flat",
  })).filter((row) => SYMBOLS.includes(row.sym));
}

function findRows(snapshot, root) {
  const items = Array.isArray(snapshot?.items) ? snapshot.items : rowsFromDom(root);
  return SYMBOLS.map((sym) => items.find((item) => item?.sym === sym) || { sym, price: "—", change: "—", dir: "flat" });
}

function updateText(node, value) {
  if (node && node.textContent !== value) node.textContent = value;
}

function renderTicker(root, snapshot) {
  const rows = findRows(snapshot, root);
  for (const item of rows) {
    const row = root.querySelector(`.ht-tick li[data-sym="${item.sym}"]`);
    if (!row) continue;
    row.setAttribute("data-dir", item.dir || "flat");
    updateText(row.querySelector(".ht-p"), item.price || "—");
    updateText(row.querySelector(".ht-c"), item.change || "—");
  }
  const btc = rows.find((item) => item.sym === "BTC") || rows[0];
  root.querySelector(".ht-badge")?.setAttribute("data-dir", btc?.dir || "flat");
  updateText(root.querySelector(".ht-big"), btc?.price || "—");
  updateText(root.querySelector(".ht-badge"), btc?.change || "—");
  return numberFromText(btc?.price);
}

function renderChart(root, samples, latestPrice) {
  const actual = samples.slice(-48);
  const drawing = actual.length >= 2 ? actual : [latestPrice || 0, latestPrice || 0];
  const path = chartPath(drawing, actual.length);
  const series = root.querySelector(".ht-series");
  if (series) {
    series.dataset.samples = String(actual.length);
    series.dataset.mature = path.mature ? "true" : "false";
  }
  root.querySelector(".ht-area")?.setAttribute("d", path.area);
  root.querySelector(".ht-line")?.setAttribute("d", path.line);
  for (const node of root.querySelectorAll(".ht-tip,.ht-ring")) {
    node.setAttribute("cx", String(path.tip[0]));
    node.setAttribute("cy", String(path.tip[1]));
  }
}

function randomWalkDepth(root) {
  for (const bar of root.querySelectorAll(".ht-depth i")) {
    const current = Number.parseFloat(bar.style.getPropertyValue("--w")) || 0.5;
    const next = clamp(current + (Math.random() * 0.36 - 0.18), 0.15, 1);
    bar.style.setProperty("--w", next.toFixed(2));
  }
}

export function initHeroTerminal(root) {
  if (!root || root.__heroTerminal) return root?.__heroTerminal;
  const reducedQuery = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  const state = {
    visible: true,
    documentVisible: typeof document === "undefined" || document.visibilityState === "visible",
    reduced: Boolean(reducedQuery?.matches),
    stopTicker: null,
    depthTimer: null,
    samples: [],
  };

  const motionPaused = () => !state.visible || !state.documentVisible || state.reduced;
  const shouldSubscribe = () => state.visible && state.documentVisible;

  function syncPause() {
    root.toggleAttribute("data-paused", motionPaused());
    if (shouldSubscribe() && !state.stopTicker) {
      state.stopTicker = subscribeTicker((snapshot) => {
        const price = renderTicker(root, snapshot);
        const sampleAt = Date.parse(snapshot?.generatedAt);
        // A repeated stale cache frame is not another historical observation.
        if (price != null && Number.isFinite(sampleAt) && (state.lastSampleAt === undefined || sampleAt > state.lastSampleAt)) {
          state.lastSampleAt = sampleAt;
          state.samples.push(price);
          if (state.samples.length > 48) state.samples = state.samples.slice(-48);
          renderChart(root, state.samples, price);
        }
      });
    } else if (!shouldSubscribe() && state.stopTicker) {
      state.stopTicker();
      state.stopTicker = null;
    }
    if (!motionPaused() && !state.depthTimer) {
      randomWalkDepth(root);
      state.depthTimer = setInterval(() => randomWalkDepth(root), DEPTH_INTERVAL_MS);
    } else if (motionPaused() && state.depthTimer) {
      clearInterval(state.depthTimer);
      state.depthTimer = null;
    }
  }

  const initialPrice = renderTicker(root, null);
  renderChart(root, [], initialPrice);

  const observer = typeof IntersectionObserver === "function"
    ? new IntersectionObserver(([entry]) => {
      state.visible = Boolean(entry && entry.intersectionRatio >= 0.1);
      syncPause();
    }, { threshold: [0, 0.1] })
    : null;
  observer?.observe(root);

  const onVisibility = () => {
    state.documentVisible = document.visibilityState === "visible";
    syncPause();
  };
  const onMotion = () => {
    state.reduced = Boolean(reducedQuery?.matches);
    syncPause();
  };
  document.addEventListener?.("visibilitychange", onVisibility);
  reducedQuery?.addEventListener?.("change", onMotion);
  syncPause();

  root.__heroTerminal = {
    destroy() {
      observer?.disconnect();
      document.removeEventListener?.("visibilitychange", onVisibility);
      reducedQuery?.removeEventListener?.("change", onMotion);
      state.stopTicker?.();
      if (state.depthTimer) clearInterval(state.depthTimer);
      delete root.__heroTerminal;
    },
  };
  return root.__heroTerminal;
}

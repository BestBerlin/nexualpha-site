(() => {
  window.__qa = { ls: [], errs: [], flashLog: [], removed: [] };
  addEventListener('error', (e) => window.__qa.errs.push('error: ' + (e.message || e.error)));
  addEventListener('unhandledrejection', (e) => window.__qa.errs.push('rejection: ' + e.reason));
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__qa.ls.push({ v: +e.value.toFixed(5), t: Math.round(e.startTime), hir: e.hadRecentInput, src: (e.sources || []).map((s) => s.node ? (s.node.tagName + '.' + String(s.node.className?.baseVal ?? s.node.className).slice(0, 60) + ' ' + JSON.stringify(s.previousRect) + '->' + JSON.stringify(s.currentRect)) : '?') }); }).observe({ type: 'layout-shift', buffered: true });
  } catch {}
  const mo = new MutationObserver((muts) => {
    for (const m of muts) for (const n of m.removedNodes) if (n.nodeType === 1 && (n.id === 'h7-flash' || n.id === 'h7-movers' || n.querySelector?.('#h7-flash'))) window.__qa.removed.push({ t: Math.round(performance.now()), id: n.id || n.className, stack: new Error().stack.split('\n').slice(1, 6).join(' | ') });
  });
  document.addEventListener('DOMContentLoaded', () => mo.observe(document.body, { childList: true, subtree: true }));
})();

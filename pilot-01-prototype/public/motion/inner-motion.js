/* NexuAlpha V6 inner-page motion (R5). Loaded with `defer` outside the app-shell bundle; never on the homepage.
 * 1. Route rail: the homepage's Crossroads rail carried onto inner pages. A start node at the h1, docks at each
 *    section heading, the destination at the page's primary action; the traversed part fills turquoise on scroll.
 * 2. Scroll reveal: blocks below the fold fade/rise in once (IntersectionObserver). Progressive: nothing is hidden
 *    until the observer is live, a scroll check reveals anything the observer missed, print reveals all.
 * 3. Copy feedback: a short confirmation pulse on copy/share controls (the components keep their own text state).
 * prefers-reduced-motion: rail drawn statically, no reveal, no pulse. Decorative nodes are aria-hidden. */
(function () {
  "use strict";
  if (typeof window === "undefined" || !document.documentElement) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var BLOCKS = [
    "main.v6 > section", "main.v6 > details", "main.v6 > article", "main.v6 > .v2-shell > section",
    ".methodology-page__inner > section", ".methodology-pillar-card", ".tg-hub__container > *", ".tg-topic-card", ".tg-return-card",
    ".mx-row", ".news-card", ".news-list-item", "[class*='news-index'] article", ".activity-center-v3 > *", ".activity-center-v3__reward-grid > article",
    ".br-section", ".br-venue-card", ".br-source-list li", ".v3-compare-support-disclosure", ".v3-metric-matrix-section", ".v3-compare-final-choice-card"
  ].join(",");
  var state = null;

  function innerMain() {
    var m = document.querySelector("main.v6");
    return m && !m.classList.contains("home-refinement") ? m : null;
  }
  function visible(el) {
    if (!el || el.closest("details:not([open]) > :not(summary)")) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  function teardown() {
    if (!state) return;
    if (state.io) state.io.disconnect();
    if (state.ro) state.ro.disconnect();
    window.removeEventListener("scroll", state.onScroll, true);
    window.removeEventListener("resize", state.onResize);
    if (state.rail && state.rail.parentNode) state.rail.parentNode.removeChild(state.rail);
    state = null;
  }

  /* ---------- 1. route rail ---------- */
  function buildRail(main, s) {
    var rail = document.createElement("div");
    rail.className = "v6r";
    rail.setAttribute("aria-hidden", "true");
    document.body.appendChild(rail); /* outside the React tree: never touches hydration */
    s.rail = rail;
    s.measure = function () {
      var mr = main.getBoundingClientRect();
      var top0 = mr.top + window.scrollY;
      var h1 = main.querySelector("h1");
      if (!h1 || !visible(h1)) { rail.removeAttribute("data-ready"); return; }
      var rtl = getComputedStyle(main).direction === "rtl";
      var w = main.clientWidth;
      var inset = Math.max(16, (w - 1200) / 2);
      var x = inset >= 76 ? inset - 24 : Math.max(6, Math.round(inset / 2) - 2);
      var px = rtl ? mr.left + w - x : mr.left + x; /* physical page x of the rail */
      var hr = h1.getBoundingClientRect();
      var start = hr.top - mr.top + Math.min(hr.height / 2, 26);
      var headEdge = rtl ? mr.right - hr.right : hr.left - mr.left;
      var heads = main.querySelectorAll("h2");
      var docks = [];
      for (var i = 0; i < heads.length && docks.length < 9; i++) {
        var h = heads[i];
        if (!visible(h) || h.closest(".v6r, [role='dialog'], nav")) continue;
        var r = h.getBoundingClientRect();
        var y = r.top - mr.top + Math.min(r.height / 2, 18);
        if (y > start + 48 && (!docks.length || y - docks[docks.length - 1] > 64)) docks.push(Math.round(y));
      }
      var dest = null;
      var primaries = main.querySelectorAll("a[rel~='sponsored'][class*='cta'], a[rel~='sponsored'][class*='btn'], .button-primary, [class*='--primary'], [class*='__primary']");
      for (var j = primaries.length - 1; j >= 0; j--) {
        if (visible(primaries[j])) { var pr = primaries[j].getBoundingClientRect(); var py = pr.top - mr.top + pr.height / 2; if (py > start + 48) { dest = py; break; } }
      }
      var end = Math.max(dest || 0, docks.length ? docks[docks.length - 1] + 1 : 0, mr.height - 96);
      if (dest && dest >= end - 1) end = dest;
      docks = docks.filter(function (d) { return d < end - 32; });
      var sig = [px, Math.round(top0), Math.round(start), Math.round(end), rtl].concat(docks).join(",");
      if (sig === s.sig) return;
      s.sig = sig;
      s.start = start; s.total = end - start; s.docks = docks;
      var html = '<i class="v6r__track"></i><i class="v6r__fill"></i><i class="v6r__stub"></i><b class="v6r__node v6r__node--start"></b>';
      for (var k = 0; k < docks.length; k++) html += '<b class="v6r__node" data-y="' + docks[k] + '" style="--v6r-ny:' + docks[k] + 'px"></b>';
      html += '<b class="v6r__node v6r__node--dest" data-y="' + Math.round(end) + '" style="--v6r-ny:' + Math.round(end) + 'px"></b>';
      rail.innerHTML = html;
      rail.style.top = Math.round(top0) + "px";
      rail.style.left = Math.round(px) + "px";
      rail.toggleAttribute("data-rtl", rtl);
      rail.style.setProperty("--v6r-y", Math.round(start) + "px");
      rail.style.setProperty("--v6r-h", Math.max(0, Math.round(end - start)) + "px");
      rail.style.setProperty("--v6r-stub", Math.max(0, Math.round(headEdge - x - 12)) + "px");
      rail.setAttribute("data-ready", "");
      s.fill();
    };
    s.fill = function () {
      s.raf = 0;
      if (!s.total) return;
      var mr = main.getBoundingClientRect();
      var atEnd = window.innerHeight - mr.bottom >= -4 || (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 4;
      var f = reduce || atEnd ? s.total : Math.max(0, Math.min(s.total, window.innerHeight * 0.62 - mr.top - s.start));
      rail.style.setProperty("--v6r-s", (f / s.total).toFixed(4));
      var nodes = rail.querySelectorAll("[data-y]");
      for (var i = 0; i < nodes.length; i++) {
        var on = Number(nodes[i].getAttribute("data-y")) - s.start <= f + 0.5 && f > 0 ? "1" : "0";
        if (nodes[i].getAttribute("data-on") !== on) nodes[i].setAttribute("data-on", on);
      }
    };
  }

  /* ---------- 2. scroll reveal ---------- */
  function buildReveal(main, s) {
    if (reduce || typeof IntersectionObserver !== "function") return;
    var list = main.querySelectorAll(BLOCKS);
    var fold = window.innerHeight;
    var pending = [];
    var lastParent = null, n = 0;
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.hasAttribute("data-rv") || el.querySelector("h1") || el.closest("[data-rv]") || el.closest(".v6r")) continue;
      var r = el.getBoundingClientRect();
      if (!r.height || r.top < fold - 8) continue; /* above the fold: never touched */
      n = el.parentNode === lastParent ? n + 1 : 0; lastParent = el.parentNode;
      if (n) el.style.setProperty("--rv-d", Math.min(n, 5) * 40 + "ms");
      pending.push(el);
    }
    if (!pending.length) return;
    s.io = new IntersectionObserver(function (entries) {
      for (var j = 0; j < entries.length; j++) {
        if (entries[j].isIntersecting) { entries[j].target.setAttribute("data-rv", "1"); s.io.unobserve(entries[j].target); }
      }
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.01 });
    for (var k = 0; k < pending.length; k++) { pending[k].setAttribute("data-rv", "0"); s.io.observe(pending[k]); }
    s.pending = pending;
  }
  function sweep(s) { /* anything the observer missed that is already on screen (or above it) is shown */
    if (!s.pending) return;
    var h = window.innerHeight;
    for (var i = 0; i < s.pending.length; i++) {
      var el = s.pending[i];
      if (el.getAttribute("data-rv") === "0" && el.getBoundingClientRect().top < h) el.setAttribute("data-rv", "1");
    }
  }

  function setup() {
    teardown();
    var main = innerMain();
    if (!main) return;
    var s = state = { sig: "", raf: 0 };
    buildRail(main, s);
    buildReveal(main, s);
    var mq = 0;
    s.onScroll = function () {
      if (!s.raf) s.raf = requestAnimationFrame(function () { s.fill(); sweep(s); });
    };
    s.onResize = function () { cancelAnimationFrame(mq); mq = requestAnimationFrame(s.measure); };
    window.addEventListener("scroll", s.onScroll, { passive: true, capture: true });
    window.addEventListener("resize", s.onResize);
    if (typeof ResizeObserver === "function") { s.ro = new ResizeObserver(s.onResize); s.ro.observe(main); }
    s.measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(s.onResize);
    setTimeout(s.onResize, 1600);
  }

  /* ---------- 3. copy feedback ---------- */
  document.addEventListener("click", function (e) {
    if (reduce) return;
    var t = e.target && e.target.closest && e.target.closest("main.v6 button, main.v6 a");
    if (!t || !innerMain()) return;
    var label = ((t.className && t.className.baseVal === undefined ? t.className : "") + " " + (t.getAttribute("aria-label") || "")).toLowerCase();
    if (!/copy|share|mx-code|copiar|复制|複製/.test(label)) return;
    t.removeAttribute("data-v6-copied");
    void t.offsetWidth;
    t.setAttribute("data-v6-copied", "");
    setTimeout(function () { t.removeAttribute("data-v6-copied"); }, 900);
  }, true);

  window.addEventListener("beforeprint", function () {
    var els = document.querySelectorAll("[data-rv='0']");
    for (var i = 0; i < els.length; i++) els[i].setAttribute("data-rv", "1");
  });

  /* client-side route/locale changes replace <main>: re-run on a new main element */
  var current = null, pend = 0;
  function check() {
    pend = 0;
    var m = document.querySelector("main.v6");
    if (m !== current) { current = m; setup(); }
    else if (state && state.measure) state.measure();
  }
  function start() {
    var go = function () { if (started) return; started = true; check(); observe(); };
    if (document.documentElement.getAttribute("data-nexualpha-hydrated") === "true") go();
    else { window.addEventListener("nexualpha:hydrated", go); setTimeout(go, 5000); }
  }
  var started = false;
  function observe() {
    var root = document.getElementById("root") || document.body;
    if (typeof MutationObserver === "function") new MutationObserver(function () { if (!pend) pend = setTimeout(check, 120); }).observe(root, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

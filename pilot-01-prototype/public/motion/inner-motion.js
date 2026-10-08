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
  /* Geometry is anchored to the content column, not to <main>: the rail sits 25px before the h1's inline-start edge
   * (x = 95 when content starts at 120), the same on every template. If that gutter is narrower than 48px the rail
   * would touch content, so it becomes a 2px top progress bar instead. Docks sit only on h2s and carry the heading as a
   * 12px label (shown for the section being read); the destination stub draws horizontally into the page's primary
   * action when the path to it is clear of text, otherwise it stops 8px short of the content edge. */
  function textRects(main) {
    var out = [];
    var w = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    var n, rg = document.createRange();
    while ((n = w.nextNode())) {
      if (!n.textContent.trim()) continue;
      var p = n.parentElement;
      if (!p || p.closest(".v6r, script, style, [aria-hidden='true'] svg")) continue;
      rg.selectNodeContents(n);
      var rs = rg.getClientRects();
      for (var i = 0; i < rs.length; i++) if (rs[i].width > 0 && rs[i].height > 0) out.push(rs[i]);
    }
    return out;
  }
  function label(h) {
    var t = (h.textContent || "").replace(/\s+/g, " ").trim();
    return t.length > 34 ? t.slice(0, 32).replace(/[\s,.:;·-]+$/, "") + "…" : t;
  }
  function esc(t) { return t.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
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
      var vw = document.documentElement.clientWidth;
      var hr = h1.getBoundingClientRect();
      /* the content column's inline-start edge: the h1, or a visible h2 that starts further out */
      var edgeOf = function (r) { return rtl ? vw - r.right : r.left; };
      var cEdge = edgeOf(hr);
      var heads = main.querySelectorAll("h2");
      for (var e = 0; e < heads.length; e++) { if (visible(heads[e]) && !heads[e].closest("nav, [role='dialog']")) { var er = heads[e].getBoundingClientRect(); if (er.width > 40) cEdge = Math.min(cEdge, edgeOf(er)); } }
      var bar = cEdge < 48;
      rail.toggleAttribute("data-bar", bar);
      var x = cEdge - 25; /* distance from the viewport's inline-start edge */
      var px = rtl ? vw - x : x;
      var start = hr.top - mr.top + Math.min(hr.height / 2, 26);
      var docks = [];
      for (var i = 0; i < heads.length && docks.length < 9; i++) {
        var h = heads[i];
        if (!visible(h) || h.closest(".v6r, [role='dialog'], nav")) continue;
        var r = h.getBoundingClientRect();
        var y = r.top - mr.top + Math.min(r.height / 2, 14);
        if (y > start + 48 && (!docks.length || y - docks[docks.length - 1].y > 64)) docks.push({ y: Math.round(y), t: label(h) });
      }
      var dest = null, destEl = null;
      var primaries = main.querySelectorAll("a[rel~='sponsored'][class*='cta'], a[rel~='sponsored'][class*='btn'], a[rel~='sponsored'][class*='primary'], .button-primary, [class*='--primary'], [class*='__primary']");
      for (var j = primaries.length - 1; j >= 0; j--) {
        if (visible(primaries[j])) { var pr = primaries[j].getBoundingClientRect(); var py = pr.top - mr.top + pr.height / 2; if (py > start + 48) { dest = py; destEl = primaries[j]; break; } }
      }
      var end = Math.max(dest || 0, docks.length ? docks[docks.length - 1].y + 1 : 0, mr.height - 96);
      if (dest && dest >= end - 1) end = dest;
      else { dest = null; destEl = null; }
      docks = docks.filter(function (d) { return d.y < end - 32; });
      /* destination stub: into the primary action when the horizontal path is clear of text, else to the content edge */
      var stub = Math.max(0, 25 - 8);
      if (destEl && !bar) {
        var dr = destEl.getBoundingClientRect();
        var target = edgeOf(dr) - x - 6;
        var lineY = dr.top + dr.height / 2;
        var lo = x, clear = target > 0;
        if (clear) {
          var rects = textRects(main);
          for (var q = 0; q < rects.length && clear; q++) {
            var tr = rects[q];
            var tx0 = rtl ? vw - tr.right : tr.left, tx1 = rtl ? vw - tr.left : tr.right;
            if (tr.top - 2 < lineY && tr.bottom + 2 > lineY && tx1 > lo && tx0 < x + target) clear = false;
          }
        }
        if (clear) stub = Math.round(target);
      }
      var sig = [px, Math.round(top0), Math.round(start), Math.round(end), rtl, bar, stub].concat(docks.map(function (d) { return d.y; })).join(",");
      if (sig === s.sig) return;
      s.sig = sig;
      s.start = start; s.total = end - start; s.docks = docks;
      var html = '<i class="v6r__track"></i><i class="v6r__fill"></i><b class="v6r__node v6r__node--start"></b>';
      for (var k = 0; k < docks.length; k++) html += '<b class="v6r__node" data-y="' + docks[k].y + '" style="--v6r-ny:' + docks[k].y + 'px"><em class="v6r__lab">' + esc(docks[k].t) + "</em></b>";
      html += '<b class="v6r__node v6r__node--dest" data-y="' + Math.round(end) + '" style="--v6r-ny:' + Math.round(end) + 'px"><i class="v6r__stub" style="--v6r-stub:' + stub + 'px"></i></b>';
      rail.innerHTML = html;
      rail.style.top = Math.round(top0) + "px";
      rail.style.left = Math.round(px) + "px";
      rail.toggleAttribute("data-rtl", rtl);
      rail.style.setProperty("--v6r-y", Math.round(start) + "px");
      rail.style.setProperty("--v6r-h", Math.max(0, Math.round(end - start)) + "px");
      rail.style.setProperty("--v6r-x", Math.round(x) + "px");
      rail.style.setProperty("--v6r-lab", Math.max(0, Math.round(x - 16)) + "px");
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
      var cur = -1;
      for (var i = 0; i < nodes.length; i++) {
        var on = Number(nodes[i].getAttribute("data-y")) - s.start <= f + 0.5 && f > 0 ? "1" : "0";
        if (on === "1") cur = i;
        if (nodes[i].getAttribute("data-on") !== on) nodes[i].setAttribute("data-on", on);
      }
      for (var c = 0; c < nodes.length; c++) {
        var isCur = c === cur ? "1" : "0";
        if (nodes[c].getAttribute("data-cur") !== isCur) nodes[c].setAttribute("data-cur", isCur);
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

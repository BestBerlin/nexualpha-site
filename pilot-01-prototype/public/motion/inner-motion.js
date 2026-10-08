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
  /* Two placements, one route:
   * - column: a page with a docked destination column (venue profile) runs the rail down the gap between the reading
   *   column and the registration card. The route turns into the card through a curved elbow aimed at the card's
   *   signup button; the elbow lives in the card's coordinate space (it follows the sticky card), so it never crosses
   *   text, and the traversed route always ends exactly at the signup.
   * - gutter: every other page runs the rail in the inline-start gutter (25px before the content edge, 16px when the
   *   gutter is narrower than 64px, so 1280px laptops keep it). Below a 32px gutter it becomes a 2px top progress bar.
   *   The branch into the page's destination (compare decision card, /rates result) is the same curved elbow, on the
   *   first horizontal line, nearest the destination's primary action, that crosses no text, control or border.
   * Docks sit on h2s (and [data-route-label] marks) and carry the full heading as a 12px vertical label beside the rail,
   * shown for the section being read and kept below the 56px header while that section is current. */
  var HEADER = 64;
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
  /* things a horizontal route may not touch: text, replaced elements and controls, and visible horizontal borders */
  function obstacles(main) {
    var out = textRects(main).slice();
    var els = main.querySelectorAll("img, svg, input, button, select, textarea, video, canvas, hr, *");
    for (var i = 0; i < els.length; i++) {
      var e = els[i];
      if (e.closest(".v6r")) continue;
      var r = e.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (/^(IMG|SVG|INPUT|BUTTON|SELECT|TEXTAREA|VIDEO|CANVAS|HR)$/i.test(e.tagName)) { out.push(r); continue; }
      var cs = getComputedStyle(e);
      if (cs.visibility === "hidden") continue;
      if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none") out.push({ left: r.left, right: r.right, top: r.top, bottom: r.top + 1 });
      if (parseFloat(cs.borderBottomWidth) > 0 && cs.borderBottomStyle !== "none") out.push({ left: r.left, right: r.right, top: r.bottom - 1, bottom: r.bottom });
    }
    return out;
  }
  function label(h) { return (h.getAttribute("data-route-label") || h.textContent || "").replace(/\s+/g, " ").trim(); }
  function esc(t) { return t.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  /* quarter-radius elbow: down the rail, then a curve into the horizontal run toward the destination (homepage route curve) */
  function elbow(len, rtl) {
    var r = Math.max(6, Math.min(16, Math.round(len / 3)));
    var w = Math.max(len, r + 2);
    var d = rtl
      ? "M" + w + " 0 C" + w + " " + (r * 0.55) + " " + (w - r * 0.45) + " " + r + " " + (w - r) + " " + r + " L0 " + r
      : "M0 0 C0 " + (r * 0.55) + " " + (r * 0.45) + " " + r + " " + r + " " + r + " L" + w + " " + r;
    return '<svg class="v6r__branch" width="' + w + '" height="' + (r + 2) + '" viewBox="0 -1 ' + w + " " + (r + 2) + '" style="--v6r-r:' + r + 'px" aria-hidden="true" focusable="false"><path d="' + d + '" pathLength="1"/></svg>';
  }
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
      var edgeOf = function (r) { return rtl ? vw - r.right : r.left; };
      var farOf = function (r) { return rtl ? vw - r.left : r.right; };
      /* placement */
      var col = main.querySelector(".v3-profile-action-column"), colMode = false, x, cr = null;
      if (col && visible(col)) {
        cr = col.getBoundingClientRect();
        var ro = main.querySelector(".v3-profile-reading-overview") || h1;
        var gap = edgeOf(cr) - farOf(ro.getBoundingClientRect());
        if (gap >= 40 && cr.top - mr.top < hr.bottom - mr.top + 200) { colMode = true; x = farOf(ro.getBoundingClientRect()) + gap / 2; }
      }
      var cEdge = edgeOf(hr);
      var heads = main.querySelectorAll("h2, [data-route-label]");
      if (!colMode) {
        for (var e = 0; e < heads.length; e++) { if (visible(heads[e]) && !heads[e].closest("nav, [role='dialog']")) { var er = heads[e].getBoundingClientRect(); if (er.width > 40) cEdge = Math.min(cEdge, edgeOf(er)); } }
        x = cEdge - (cEdge >= 64 ? 25 : 16);
      }
      var bar = !colMode && cEdge < 32;
      rail.toggleAttribute("data-bar", bar);
      rail.toggleAttribute("data-col", colMode);
      var px = rtl ? vw - x : x;
      var start = hr.top - mr.top + Math.min(hr.height / 2, 26);
      var docks = [];
      for (var i = 0; i < heads.length && docks.length < 10; i++) {
        var h = heads[i];
        if (!visible(h) || h.getBoundingClientRect().width < 40 || h.closest(".v6r, [role='dialog'], nav, .v3-profile-action-column, .mx-dock")) continue;
        var r = h.getBoundingClientRect();
        var y = r.top - mr.top + Math.min(r.height / 2, 14);
        if (y > start + 48 && (!docks.length || y - docks[docks.length - 1].y > 48)) docks.push({ y: Math.round(y), t: label(h) });
      }
      var dest = null, end;
      if (colMode) {
        end = cr.bottom - mr.top - 24;
      } else {
        var primaries = main.querySelectorAll("a[rel~='sponsored'][class*='cta'], a[rel~='sponsored'][class*='btn'], a[rel~='sponsored'][class*='primary'], .button-primary, [class*='--primary'], [class*='__primary']");
        for (var j = primaries.length - 1; j >= 0; j--) {
          if (visible(primaries[j]) && !primaries[j].closest(".mx-dock")) { var pr = primaries[j].getBoundingClientRect(); var py = pr.top - mr.top + pr.height / 2; if (py > start + 48) { dest = py; break; } }
        }
        end = Math.max(dest || 0, docks.length ? docks[docks.length - 1].y + 1 : 0, mr.height - 96);
        if (dest && dest >= end - 1) end = dest;
      }
      docks = docks.filter(function (d) { return d.y < end - 32; });
      /* branch */
      var branch = null;
      if (colMode) {
        var btn = col.querySelector(".registration-card__primary-btn, a[rel~='sponsored'][class*='primary'], a[rel~='sponsored']");
        s.branchEl = btn && visible(btn) ? btn : col.querySelector(".registration-card") || col;
        branch = { len: Math.round(edgeOf(cr) - x - 2), live: true };
      } else if (!bar) {
        var BR = [".v3-compare-final-choice-card", "#cost-scenario .rt-result", "a[rel~='sponsored'][class*='primary']"];
        var box = null;
        for (var bi = 0; bi < BR.length && !box; bi++) {
          var cands = main.querySelectorAll(BR[bi]);
          for (var bj = 0; bj < cands.length; bj++) {
            var cs = cands[bj];
            if (visible(cs) && !/fixed|sticky/.test(getComputedStyle(cs).position)) { box = cs; break; }
          }
        }
        if (box) {
          var br = box.getBoundingClientRect();
          var len = edgeOf(br) - x - 6;
          var bkey = [Math.round(mr.height), Math.round(br.top - mr.top), Math.round(br.height), vw, Math.round(x)].join(":");
          if (bkey === s.bkey) branch = s.branch;
          else {
            if (len >= 8) {
              var rects = obstacles(main);
              var cta = box.querySelector("a[rel~='sponsored'], [class*='primary'], [class*='cta']");
              var crr = cta ? cta.getBoundingClientRect() : null;
              var mid = crr && crr.height ? crr.top + crr.height / 2 : br.top + Math.min(br.height / 2, 120);
              var ys = [];
              for (var off = 0; off <= br.height / 2; off += 6) { ys.push(mid + off); if (off) ys.push(mid - off); }
              for (var yi = 0; yi < ys.length && !branch; yi++) {
                var ly = ys[yi];
                if (ly < br.top + 16 || ly > br.bottom - 16) continue;
                var ok = true;
                for (var q = 0; q < rects.length && ok; q++) {
                  var tr = rects[q];
                  var tx0 = rtl ? vw - tr.right : tr.left, tx1 = rtl ? vw - tr.left : tr.right;
                  if (tx0 >= edgeOf(br) - 1 && tx1 <= edgeOf(br) + br.width + 1) continue; /* inside the destination itself */
                  if (tr.top - 24 < ly && tr.bottom + 10 > ly && tx1 > x - 2 && tx0 < x + len + 2) ok = false; /* the elbow rises 16px */
                }
                if (ok) branch = { y: Math.round(ly - mr.top), len: Math.round(len) };
              }
            }
            s.bkey = bkey; s.branch = branch;
          }
        }
        if (branch && (branch.y <= start + 40 || branch.y >= end)) branch = null;
      }
      var labs = !bar && x - 6 >= 17;
      var sig = [px, Math.round(top0), Math.round(start), Math.round(end), rtl, bar, colMode, labs, branch ? (branch.y || "live") + ":" + branch.len : ""].concat(docks.map(function (d) { return d.y + d.t; })).join(",");
      if (sig === s.sig) { s.fill(); return; }
      s.sig = sig;
      s.start = start; s.end = end; s.total = end - start; s.docks = docks; s.col = colMode; s.rtl = rtl;
      var html = '<i class="v6r__track"></i><i class="v6r__fill"></i><b class="v6r__node v6r__node--start"></b>';
      for (var k = 0; k < docks.length; k++) html += '<b class="v6r__node" data-y="' + docks[k].y + '" style="--v6r-ny:' + docks[k].y + 'px">' + (labs ? '<em class="v6r__lab">' + esc(docks[k].t) + "</em>" : "") + "</b>";
      if (branch) {
        var by = branch.live ? Math.round(start) : branch.y;
        html += '<b class="v6r__node v6r__node--branch' + (branch.live ? " v6r__node--live" : "") + '" data-y="' + by + '" style="--v6r-ny:' + by + 'px"' + (branch.live ? ' data-on="1"' : "") + ">" + elbow(branch.len, rtl) + "</b>";
      }
      html += '<b class="v6r__node v6r__node--dest" data-y="' + Math.round(end) + '" style="--v6r-ny:' + Math.round(end) + 'px"></b>';
      rail.innerHTML = html;
      s.live = branch && branch.live ? rail.querySelector(".v6r__node--live") : null;
      rail.style.top = Math.round(top0) + "px";
      rail.style.left = Math.round(px) + "px";
      rail.toggleAttribute("data-rtl", rtl);
      rail.style.setProperty("--v6r-y", Math.round(start) + "px");
      rail.style.setProperty("--v6r-h", Math.max(0, Math.round(end - start)) + "px");
      rail.setAttribute("data-ready", "");
      s.labs = rail.querySelectorAll(".v6r__lab");
      s.fill();
    };
    s.fill = function () {
      s.raf = 0;
      if (!s.total) return;
      var mr = main.getBoundingClientRect();
      var f;
      if (s.live && s.branchEl) {
        /* column: the traversed route ends at the signup button's centre (the elbow follows the sticky card) */
        var b = s.branchEl.getBoundingClientRect();
        var by = Math.max(s.start, Math.min(s.end, b.top + Math.min(b.height / 2, 120) - mr.top));
        s.live.style.setProperty("--v6r-ny", Math.round(by) + "px");
        f = by - s.start;
      } else {
        var atEnd = window.innerHeight - mr.bottom >= -4 || (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 4;
        f = reduce || atEnd ? s.total : Math.max(0, Math.min(s.total, window.innerHeight * 0.62 - mr.top - s.start));
      }
      rail.style.setProperty("--v6r-s", (f / s.total).toFixed(4));
      var nodes = rail.querySelectorAll("[data-y]:not(.v6r__node--live)");
      var cur = -1;
      for (var i = 0; i < nodes.length; i++) {
        var on = Number(nodes[i].getAttribute("data-y")) - s.start <= f + 0.5 && f > 0 ? "1" : "0";
        if (on === "1" && nodes[i].firstChild && nodes[i].firstChild.className === "v6r__lab") cur = i;
        if (nodes[i].getAttribute("data-on") !== on) nodes[i].setAttribute("data-on", on);
      }
      for (var c = 0; c < nodes.length; c++) {
        var isCur = c === cur ? "1" : "0";
        if (nodes[c].getAttribute("data-cur") !== isCur) nodes[c].setAttribute("data-cur", isCur);
      }
      /* the current label stays readable below the fixed header, and never runs past the end of the route */
      if (cur >= 0) {
        var node = nodes[cur], lab = node.firstChild;
        var ny = Number(node.getAttribute("data-y"));
        var vy = mr.top + ny + 14;
        var room = s.end - ny - 14 - lab.offsetHeight;
        var dy = Math.max(0, Math.min(HEADER - vy, room));
        lab.style.setProperty("--v6r-dy", Math.round(dy) + "px");
        /* a label longer than the rest of its route fades out instead of sliding under the header */
        lab.toggleAttribute("data-gone", HEADER - vy > room);
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

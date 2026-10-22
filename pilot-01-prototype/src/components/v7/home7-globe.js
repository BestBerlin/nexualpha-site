// Hero globe (owner 2026-10-22): a dotted sphere that turns slowly, one lifted arc from every partner on it to "you" (the
// hub on the front of the sphere) and pulses that run along the arcs toward you: rebates flowing back. Canvas 2D, no
// dependencies, loaded after first paint by RebateStage (HomeV7.jsx); the server-rendered SVG globe and venue chips stay
// underneath, so nothing moves when this arrives. Draws at most ~30 fps, stops while off-screen or the tab is hidden, and
// paints a single still frame under prefers-reduced-motion.
const TEAL = "31,224,192", ICE = "127,231,255";
// Partner positions on the sphere (lat, lon in degrees), by chip slot: spread so each faces the viewer in turn.
const SPOTS = [[34, -52], [26, 58], [-20, -128], [-28, 118], [-44, 4]];
const TILT = -0.38; // the sphere leans toward the viewer
const HUB = (() => { const v = [-0.16, -0.26, 1]; const l = Math.hypot(...v); return v.map((n) => n / l); })();

const vec = ([lat, lon]) => {
  const a = (lat * Math.PI) / 180, b = (lon * Math.PI) / 180;
  return [Math.cos(a) * Math.sin(b), -Math.sin(a), Math.cos(a) * Math.cos(b)];
};

export function mountGlobe(host, stage, still) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext?.("2d");
  if (!ctx) return null;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;inline-size:100%;block-size:100%;opacity:0;transition:opacity .6s cubic-bezier(.16,1,.3,1);pointer-events:none";
  host.append(canvas);

  let w = 0, h = 0, cx = 0, cy = 0, r = 0, dpr = 1, count = 0, pts = new Float32Array(0);
  let chips = [], anchors = [], selected = null, raf = 0, last = 0, visible = true, angle = 0.35;
  const dots = (n) => {
    // Fibonacci sphere: even spacing without poles bunching up.
    const out = new Float32Array(n * 3), g = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i += 1) {
      const y = 1 - (2 * (i + 0.5)) / n, k = Math.sqrt(1 - y * y), t = g * i;
      out[i * 3] = Math.cos(t) * k; out[i * 3 + 1] = y; out[i * 3 + 2] = Math.sin(t) * k;
    }
    return out;
  };
  const spin = (v, a) => {
    // Turn about the vertical axis, then lean toward the viewer.
    const ca = Math.cos(a), sa = Math.sin(a), x = v[0] * ca + v[2] * sa, z = -v[0] * sa + v[2] * ca;
    const ct = Math.cos(TILT), st = Math.sin(TILT);
    return [x, v[1] * ct - z * st, v[1] * st + z * ct];
  };

  const measure = () => {
    const box = host.getBoundingClientRect();
    const ring = stage.querySelector(".hx-globe-svg circle")?.getBoundingClientRect();
    w = box.width; h = box.height;
    if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    // Same circle as the server-rendered SVG, so the canvas lands exactly on it.
    if (ring?.width) { r = ring.width / 2; cx = ring.left - box.left + r; cy = ring.top - box.top + r; }
    else { r = Math.min(w, h) * 0.34; cx = w / 2; cy = h / 2; }
    const n = Math.round(Math.min(1100, Math.max(560, r * 5.6)));
    if (n !== count) { count = n; pts = dots(n); }
    chips = [...stage.querySelectorAll(".hx-stage-node")];
    anchors = chips.map((chip) => {
      const c = chip.getBoundingClientRect();
      const x = Math.min(Math.max(cx, c.left - box.left), c.right - box.left);
      const y = Math.min(Math.max(cy, c.top - box.top), c.bottom - box.top);
      return { x, y, slug: chip.dataset.venue };
    });
  };

  const draw = (now) => {
    if (!w || !h) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    // Dots, drawn in four depth bands so the canvas changes fill state only four times a frame.
    const ca = Math.cos(angle), sa = Math.sin(angle), ct = Math.cos(TILT), st = Math.sin(TILT);
    const size = r > 150 ? 2 : 1.6;
    for (let band = 0; band < 4; band += 1) {
      ctx.fillStyle = `rgba(${band === 3 ? ICE : TEAL},${[0.1, 0.36, 0.64, 0.95][band]})`;
      ctx.beginPath();
      for (let i = 0; i < count; i += 1) {
        const px = pts[i * 3], py = pts[i * 3 + 1], pz = pts[i * 3 + 2];
        const x = px * ca + pz * sa, z0 = -px * sa + pz * ca, y = py * ct - z0 * st, z = py * st + z0 * ct;
        const b = z < -0.2 ? -1 : z < 0.15 ? 0 : z < 0.5 ? 1 : z < 0.82 ? 2 : 3;
        if (b !== band) continue;
        ctx.rect(cx + x * r - size / 2, cy + y * r - size / 2, size, size);
      }
      ctx.fill();
    }

    // Wireframe: six meridians and three parallels turning with the dots (front half only), the same lines the
    // server-rendered SVG shows, so the hand-over from the still globe is seamless.
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${TEAL},0.16)`;
    ctx.beginPath();
    for (let m = 0; m < 9; m += 1) {
      let pen = false;
      for (let k = 0; k <= 48; k += 1) {
        const u = (k / 48) * Math.PI * 2;
        const v = m < 6
          ? spin([Math.cos(u) * Math.sin((m * Math.PI) / 6), Math.sin(u), Math.cos(u) * Math.cos((m * Math.PI) / 6)], angle)
          : spin([Math.cos(u) * Math.cos(((m - 7) * Math.PI) / 5), -Math.sin(((m - 7) * Math.PI) / 5), Math.sin(u) * Math.cos(((m - 7) * Math.PI) / 5)], angle);
        if (v[2] < 0) { pen = false; continue; }
        if (pen) ctx.lineTo(cx + v[0] * r, cy + v[1] * r); else ctx.moveTo(cx + v[0] * r, cy + v[1] * r);
        pen = true;
      }
    }
    ctx.stroke();

    const hx = cx + HUB[0] * r, hy = cy + HUB[1] * r;
    ctx.lineCap = "round";
    anchors.forEach((anchor, index) => {
      const spot = SPOTS[index % SPOTS.length];
      const node = spin(vec(spot), angle);
      const on = anchor.slug === selected;
      const nx = cx + node[0] * r, ny = cy + node[1] * r, front = node[2];
      // Leader from the chip to its point on the sphere while that point faces the viewer.
      if (front > 0.05) {
        ctx.strokeStyle = `rgba(${on ? ICE : TEAL},${(on ? 0.5 : 0.22) * Math.min(1, front * 2)})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath(); ctx.moveTo(anchor.x, anchor.y); ctx.lineTo(nx, ny); ctx.stroke();
        ctx.setLineDash([]);
      }
      // Arc from the partner to the hub, lifted off the surface (slerp + height), hidden where the sphere covers it.
      const dot = Math.max(-1, Math.min(1, node[0] * HUB[0] + node[1] * HUB[1] + node[2] * HUB[2]));
      const omega = Math.acos(dot), sin = Math.sin(omega) || 1, lift = 0.05 + omega * 0.07, steps = 28;
      const path = [];
      for (let k = 0; k <= steps; k += 1) {
        const t = k / steps, a = Math.sin((1 - t) * omega) / sin, b = Math.sin(t * omega) / sin, m = 1 + lift * Math.sin(Math.PI * t);
        const x = (node[0] * a + HUB[0] * b) * m, y = (node[1] * a + HUB[1] * b) * m, z = (node[2] * a + HUB[2] * b) * m;
        path.push([cx + x * r, cy + y * r, z < 0 && x * x + y * y < 1 ? 0 : Math.min(1, 0.35 + Math.max(0, z))]);
      }
      ctx.lineWidth = on ? 1.6 : 1;
      for (let k = 1; k < path.length; k += 1) {
        const alpha = Math.min(path[k - 1][2], path[k][2]);
        if (!alpha) continue;
        ctx.strokeStyle = `rgba(${on ? ICE : TEAL},${(on ? 0.85 : 0.38) * alpha})`;
        ctx.beginPath(); ctx.moveTo(path[k - 1][0], path[k - 1][1]); ctx.lineTo(path[k][0], path[k][1]); ctx.stroke();
      }
      // Pulses run partner → you; the selected partner sends two.
      if (!still) {
        for (let p = 0; p < (on ? 2 : 1); p += 1) {
          const t = ((now / (on ? 1900 : 2600)) + index * 0.23 + p * 0.5) % 1;
          const at = path[Math.min(steps, Math.round(t * steps))];
          if (!at[2]) continue;
          ctx.fillStyle = `rgba(${ICE},${0.22 * at[2]})`;
          ctx.beginPath(); ctx.arc(at[0], at[1], on ? 5 : 4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgba(255,255,255,${0.9 * at[2]})`;
          ctx.beginPath(); ctx.arc(at[0], at[1], on ? 2 : 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }
      if (front > 0) {
        ctx.fillStyle = `rgba(${on ? ICE : TEAL},${Math.min(1, 0.3 + front)})`;
        ctx.beginPath(); ctx.arc(nx, ny, on ? 3.2 : 2.4, 0, Math.PI * 2); ctx.fill();
      }
    });
    // The hub: where the rebates land.
    const beat = still ? 0.4 : (now % 2400) / 2400;
    ctx.strokeStyle = `rgba(${ICE},${0.6 * (1 - beat)})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(hx, hy, 4 + beat * 14, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#EFFFFC";
    ctx.beginPath(); ctx.arc(hx, hy, 3.4, 0, Math.PI * 2); ctx.fill();
  };

  const frame = (now) => {
    raf = 0;
    if (!visible || document.hidden) return;
    if (now - last >= 32) {
      angle += Math.min(64, now - (last || now)) * 0.00011; // one turn in about a minute
      last = now;
      draw(now);
    }
    raf = requestAnimationFrame(frame);
  };
  const run = () => {
    if (still) { draw(0); return; }
    if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); }
  };
  const halt = () => { cancelAnimationFrame(raf); raf = 0; };
  const sync = () => { stage.dataset.paused = String(!visible || document.hidden); if (stage.dataset.paused === "true") halt(); else run(); };

  const io = typeof IntersectionObserver === "function" ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }) : null;
  io?.observe(stage);
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => { measure(); if (still || !raf) draw(performance.now()); }) : null;
  ro?.observe(host);
  stage.querySelectorAll(".hx-stage-node").forEach((chip) => ro?.observe(chip));
  document.addEventListener("visibilitychange", sync);

  measure();
  draw(performance.now());
  stage.setAttribute("data-live", "");
  requestAnimationFrame(() => { canvas.style.opacity = "1"; });
  sync();

  return {
    select(slug) { selected = slug; measure(); if (still || !raf) draw(performance.now()); },
    destroy() {
      halt(); io?.disconnect(); ro?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      stage.removeAttribute("data-live");
      canvas.remove();
    },
  };
}

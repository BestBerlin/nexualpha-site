// Hero globe (owner 2026-10-22, Earth pass 2026-10-23): a slowly turning Earth drawn as dotted continents — a fixed sun
// gives it a day side, a soft terminator and a night side where the land still reads faintly — with an atmosphere rim and
// a faint ocean glint, plus one lifted arc from every partner to "you" (the hub on the front of the sphere) and pulses that
// run along the arcs toward you: rebates flowing back. Canvas 2D, no dependencies, loaded after first paint by RebateStage
// (HomeV7.jsx); the server-rendered SVG globe and venue chips stay underneath, so nothing moves when this arrives. Draws at
// most ~30 fps, stops while off-screen or the tab is hidden, and paints a single still frame under prefers-reduced-motion.
const TEAL = "31,224,192", ICE = "127,231,255";
// Partner positions on the sphere (lat, lon in degrees), by chip slot: spread so each faces the viewer in turn.
const SPOTS = [[34, -52], [26, 58], [-20, -128], [-28, 118], [-44, 4]];
const TILT = -0.38; // the sphere leans toward the viewer
const unit = (v) => { const l = Math.hypot(...v); return v.map((n) => n / l); };
const HUB = unit([-0.16, -0.26, 1]);
// The sun sits up and to the left, a little in front: day on the left, the terminator crossing the right third.
const SUN = unit([-0.76, -0.4, 0.44]);
const GLINT = unit([SUN[0], SUN[1], SUN[2] + 1]); // where the sun reflects toward the viewer

// Coastlines, hand-traced at about 1-2 degrees (enough for a 200-600 px dotted globe): flat [lon, lat, lon, lat, ...] rings.
// LAKES are cut back out of the land (enclosed seas). Points inside a ring become land dots once, when the globe mounts.
const LAND = [
  // North America
  [-168,66,-162,70,-156,71.3,-141,69.6,-128,70,-115,68.6,-95,68,-92,72,-82,73.5,-80,69,-87,66,-94,60,-93,58.7,-87,55.5,-82,52.5,-79,51.5,-79,56,-77,60.5,-73,62,-69,58.5,-64,60,-61,56,-56,52,-60,50,-66,49.2,-64,47,-60,46,-64.5,45,-67,44.5,-70,43.5,-70,41.7,-74,40.5,-76,38,-76,35,-81,31.5,-80,27,-80.5,25.2,-82,26.5,-83,29.5,-85,30,-89,30.3,-90.5,29,-94,29.6,-97.4,27.5,-97.5,24,-97.7,21.8,-96,19,-94.5,18.2,-91,18.6,-90.5,21,-87,21.5,-87.8,18,-88.5,16,-84,15.8,-83.3,14,-83.7,11,-81.5,9,-79,9.5,-77.4,8.6,-78,7.5,-80,7.4,-82,8.2,-85.8,10.5,-87.6,13.2,-91.5,14,-94.5,16,-96.5,15.7,-101,17.3,-105.5,20,-105.6,23,-109.5,26.6,-112.5,30.5,-114.7,31.7,-112,28.5,-110,24,-109.5,23,-112,25,-114.5,27.8,-115.6,30,-117.2,32.6,-120.6,34.5,-122.5,37.5,-124.2,40.5,-124,46,-124.6,48.4,-127,50.5,-130.5,54,-134,57.5,-138,59,-142,60,-147,60.8,-152,59,-154,57.2,-158,56.6,-163,54.8,-158,58.5,-162,60,-165,62.5,-164.5,64.5,-168,65.7],
  [-73,78,-66,81.5,-45,82.5,-22,82.5,-18,79,-20,75,-22,70.5,-30,68,-40,65,-43,60,-48,61,-51,64,-53,67,-54,70.5,-56,73,-62,76,-70,77], // Greenland
  [-80,73.5,-72,72,-67,69.5,-62,66.5,-65,63,-73,64.5,-78,65,-74,68,-82,70], // Baffin
  [-118,73,-105,73,-101,69.5,-114,68.5,-118,70.5], // Victoria Island
  [-90,81,-70,82.8,-62,82,-75,79,-84,77,-90,78], // Ellesmere
  [-85,21.8,-82,23.2,-77,22,-74.2,20.2,-77.5,19.9,-80,21.6], // Cuba
  [-74.5,18.4,-72.8,19.9,-68.4,18.6,-71,18], // Hispaniola
  // South America
  [-77.4,8.6,-75.5,10.5,-72,12,-71.5,10.8,-68,10.5,-62,10.7,-60,8.5,-57,6,-52,5,-50,1.8,-48,-1,-44,-2.5,-39,-3.5,-35.2,-5.5,-35,-9,-37.5,-12.5,-39,-15,-39.7,-19.5,-41,-22,-44.5,-23.3,-48.5,-26,-48.7,-28.5,-52,-32,-54,-34.5,-57,-35,-57.5,-38,-62,-39,-63,-41,-65,-43,-67.5,-46,-66,-48,-69,-51,-68.5,-53,-71,-54.5,-74.5,-52.5,-75.5,-48,-74,-44,-73.5,-38,-71.5,-30,-70.3,-18.5,-71.5,-17,-76,-14,-78,-10,-81,-6,-81,-4,-80,-2,-80.5,0,-78.8,1.5,-77.5,4,-77.4,7],
  // Eurasia: Atlantic and Arctic coasts east, Pacific south, Indian Ocean west, then the Mediterranean back to Gibraltar
  [-5.6,36,-9,37,-9.5,39,-8.8,42.5,-1.8,43.4,-1.2,46,-4.5,48,-1.5,48.8,1.5,50.2,4,51.4,5,53.4,8.5,53.6,8.6,57,10.5,57.7,10.5,54.5,13,54.3,14,54,18,54.8,21,55,21,57,24,58,28,59.5,23,60,21.5,61,21.3,63.5,25,65,21.5,66,17.5,63,17.8,60.5,19,59.5,16.5,56.5,14.2,55.4,12.5,56.3,11,58.8,8,58,5.5,58.5,5,60,5.5,62,10,64,13,67,15,68.5,20,70,25,71,30,70,33,69.3,41,67,38,64.5,44,66,44,68.5,50,68,54,68.5,59,68.8,66,69.5,69,73,73,72.5,72,66.5,75,68,73,71.5,80,73.5,87,74.5,99,76,104,77.7,113,74,123,73,129,72.5,140,72.5,150,71.5,160,70,170,70,180,69,180,65.5,177,62.5,170,60,163,59,162,56,159,53,156.5,51,156,57.5,160,61.5,154,59.3,143,59.3,138,56,141,53,141,49,135,43.5,132,43,129.5,41,129,37,129.3,35.2,126.5,34.5,126.5,37.5,125,39.5,121.5,40,122,40.8,119,39.2,118,38.3,119,37,122.5,37.3,120.5,36,119,35,120.8,32.5,122,30,121.5,28,119.5,25.5,117,23.5,113.5,22.3,110.5,21,109.5,21.5,107.5,21.5,106.5,20,106,18.5,108.8,15.5,109,12,107,10.5,105,8.6,104.8,10.5,103,11,100.5,13.5,99.2,10,100.5,7,103.5,1.5,101,2.5,98.5,8,98.5,12.5,97.5,16.5,94.5,16,94,19,92,21.5,90,21.8,87,21.5,86.5,20,84,18,80.2,15.5,80,10.5,77.5,8,76.3,9.8,73.5,16,72.8,21,70,22.5,68.5,23.5,66.8,25,61.5,25.2,57.5,25.7,56.5,27,54,26.7,51,28,48.5,30,47.8,29.5,48.5,28,50,26,50.8,24.8,51.6,24,54,24.2,56.4,26.2,56.5,24.5,58.8,22.8,59.8,22.4,57.8,19,55,17,52,16,45,12.8,43.3,12.7,42.8,15,42.5,16.7,40,20,39,22,38.4,24,35.5,28,34.9,29.5,34.3,27.8,32.6,29.9,32.4,31.2,34.3,31.3,35,33,36,34.6,36,36.6,32,36.2,29,36.6,27.3,37,26.3,38.3,26.5,40.3,24,40.8,23,40,23.8,38.2,22.5,36.5,21.7,36.8,21,38.5,19.5,40,19.5,41.8,16,43.5,13.7,45.6,12.3,45.3,12.5,44,14,42.5,16.2,41.3,18.5,40.2,16.6,38.8,15.7,38,16.1,39.5,15,40.2,12.5,41.5,10.5,43,8.8,44.4,7,43.6,4.5,43.5,3,43,3.2,41.8,0.8,40.8,-0.3,39.3,0.2,38.7,-0.8,37.6,-2.2,36.7,-4.5,36.6],
  [-5.7,50,1.4,51.2,1.7,52.7,0,53.5,-0.5,54.5,-2,55.9,-1.8,57.5,-3.2,58.6,-5,58.6,-6.2,57.5,-5.5,56,-4.8,54.8,-3.2,54.5,-3,53.4,-4.6,52.8,-5.2,51.7,-3,51.4], // Great Britain
  [-6,52,-6,53.8,-5.5,55.2,-7.5,55.3,-10,54.2,-10.3,52,-8,51.5], // Ireland
  [-22.5,64,-24,65.5,-22,66.4,-16,66.5,-13.6,65.2,-15,64.2,-18.5,63.4], // Iceland
  [11,78.8,17,80.5,27,80.2,22,77.5,16,76.5], // Svalbard
  [52,71.5,57,70.6,60,72,69,76.8,60,76.8,55,74.5], // Novaya Zemlya
  [142,46,143.5,46,143,49,144.5,49,143,53,142.5,54.3,141.8,52,142,49], // Sakhalin
  [130,31.2,131.5,31.5,132,33.8,135,33.5,136.8,34.3,139,34.7,140.8,35.7,141,38.3,142,39.5,141.5,41.4,140,40.6,140,39,139,38,137,37,136.5,36.5,133,35.5,131,34.5,130,33.5], // Japan
  [140,41.5,141.5,42.5,143.5,42,145.5,43.3,144.5,44,141.8,45.4,141.2,43.2], // Hokkaido
  [120.2,22.5,121,22,122,25,121.5,25.3,120.1,23.5], // Taiwan
  [79.8,6.2,81.8,6.8,81.3,8.6,80,9.8], // Sri Lanka
  [95.3,5.6,98,4,100.5,1.5,104,-1.5,106,-3.5,106,-5.8,104.5,-5.9,102,-4,100.5,-1.5,98.5,1.7,96.5,3.8], // Sumatra
  [105.2,-6.8,108,-6.3,111,-6.4,114.5,-7.7,114.4,-8.7,111,-8.2,106.5,-7.4], // Java
  [109,1.5,109.6,-1,110.5,-3,114.5,-3.9,116.5,-2.5,117.5,0.5,118.8,1,117.7,4.2,119.2,5.3,117,7,115.4,5,113,3.2,111,1.8], // Borneo
  [119.4,-5.5,120.4,-5.5,121,-2.8,123.3,-0.9,120.5,-1,120.5,0.6,124.5,1,125,1.6,121,1.3,119.8,0,119,-3.5], // Sulawesi
  [120,16,120.6,18.5,122.3,18.5,122,16.5,124,13,121.5,13.8,120.6,14.5], // Luzon
  [122,7,124,6,126.2,6.3,126.5,8.5,125.5,9.8,123.5,8.6], // Mindanao
  [131,-1,134,-0.8,138,-1.5,141,-2.6,145.8,-4.8,147.5,-6,147.3,-7.8,150,-10.3,146,-8.4,143.5,-9,142.5,-9.4,141,-9.1,138,-8.3,137.8,-5.2,134.5,-3.8,132,-2.6], // New Guinea
  // Africa
  [-5.9,35.8,-2,35.1,1,36.5,5,36.8,10,37.3,11,35.5,10.2,34,11.5,33,15,32.3,19,30.3,20,32,23,32.6,25,31.7,29,30.9,32.3,31.3,32.5,29.9,33.6,27.5,35.5,24,37,21,38.5,18,39.5,15.5,41.5,13.8,43.3,12.5,45,10.6,51.2,11.8,51,10,49,6,46,2,43,-1,40,-3,39.3,-6,39.5,-8,40.5,-10.5,40.5,-15,37,-17.5,35.2,-21,35.5,-24,32.8,-26,32.4,-29,30,-31.5,27.5,-33.5,25,-34,22,-34.2,18.5,-34.2,17.8,-32,15.3,-27,14.4,-23,13,-20,11.8,-17,12.3,-13,13.7,-11,12.2,-6,11.8,-3.5,9.5,-1,9.5,1,9.8,3.5,8.5,4.5,6,4.3,4.5,6.3,2,6.2,-1,5,-4,5.2,-7.5,4.4,-10.5,6.5,-13,8,-15.5,11,-16.8,13,-17.5,14.7,-16.5,16.5,-16.2,19.5,-17,21,-15.5,24,-13.5,27.5,-10,29.5,-9.5,32.5,-6.8,34],
  [49.3,-12,50.5,-15.5,49.5,-18,48,-22.5,47,-25,45,-25.5,43.6,-23.5,43.3,-21.5,44.4,-19,44,-17,46.3,-15.7,48,-13.5], // Madagascar
  // Australia and New Zealand
  [113.5,-22,114,-26.5,115,-30,115,-33.6,117.8,-35,123,-33.9,126,-32.3,131,-31.5,134,-32.6,136,-34.8,137.8,-32.6,138,-34.5,139.8,-37.4,143.5,-38.8,146.3,-39,150,-37.5,151.2,-34,153,-31,153.6,-28,153,-25,150.8,-22.6,149,-20.5,146.2,-18.8,145.3,-15,143.5,-14,142.5,-10.8,141.5,-13,141.6,-17,140,-17.7,137,-15.8,135.5,-14.8,136.8,-12.2,133,-11.3,130.3,-12.4,129.5,-15,127,-14,125,-15,122.2,-17.5,121,-19.5,117,-20.7,114.5,-21.8],
  [144.6,-40.7,148.3,-40.9,148,-43.2,146.5,-43.6,145.2,-42.2], // Tasmania
  [172.7,-34.4,174.5,-36,176,-37.6,178.5,-37.7,177.9,-39.2,176.8,-39.9,175.2,-41.6,174.6,-41.3,175,-39.8,173.8,-39.2,174.6,-37.2], // North Island
  [172.7,-40.5,174.3,-41.7,173.2,-43,171.2,-44.4,169.5,-46.6,166.5,-46,168.4,-44,170.8,-42.7], // South Island
  // Antarctica
  [-180,-90,-180,-78,-160,-78,-150,-76,-130,-74,-100,-73,-75,-73,-62,-64,-57,-63.5,-60,-68,-62,-74,-40,-78,-20,-73.5,0,-70,30,-69.5,60,-67,90,-66.5,120,-66.5,150,-68,165,-71,170,-77,180,-78,180,-90],
];
const LAKES = [
  [28,41.6,28,43.3,29.6,45,30.5,46.5,33.5,46,33.5,44.5,36.5,45.2,38.5,47,39.5,47,38,44.5,41.5,41.5,36,41.7,33,42,29,41.2], // Black Sea
  [47,44.8,47.5,43,48.5,41.8,49.5,40.2,49,38.3,50.5,37,54,37,53.9,40,53,42,51,43,52.7,45,51.5,47,49,46.5], // Caspian Sea
];
// Scanline table: for every half-degree band of latitude, the longitudes where a coastline crosses its centre line. A
// point is inside when an odd number of crossings lie west of it (a few ms for 9,000 dots instead of a full
// point-in-polygon test per ring).
const ROWS = 360;
const crossings = (rings) => {
  const rows = Array.from({ length: ROWS }, () => []);
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
      const x0 = ring[j], y0 = ring[j + 1], x1 = ring[i], y1 = ring[i + 1];
      const lo = Math.max(0, Math.ceil((Math.min(y0, y1) + 90) * 2 - 0.5)), hi = Math.min(ROWS - 1, Math.floor((Math.max(y0, y1) + 90) * 2 - 0.5));
      for (let k = lo; k <= hi; k += 1) {
        const lat = (k + 0.5) / 2 - 90;
        if ((y0 > lat) !== (y1 > lat)) rows[k].push(x0 + ((x1 - x0) * (lat - y0)) / (y1 - y0));
      }
    }
  }
  return rows;
};
const odd = (row, lon) => { let n = 0; for (const x of row) if (x < lon) n += 1; return n % 2 === 1; };
// Unit vectors of the land dots: a Fibonacci sphere (even spacing, no bunching at the poles) filtered by the coastlines.
function landDots(n) {
  const land = crossings(LAND), lakes = crossings(LAKES), out = [], g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i += 1) {
    const y = 1 - (2 * (i + 0.5)) / n, k = Math.sqrt(1 - y * y), t = g * i;
    const x = Math.cos(t) * k, z = Math.sin(t) * k;
    const lat = (Math.asin(-y) * 180) / Math.PI, lon = (Math.atan2(x, z) * 180) / Math.PI;
    const row = Math.min(ROWS - 1, Math.max(0, Math.floor((lat + 90) * 2)));
    if (odd(land[row], lon) && !odd(lakes[row], lon)) out.push(x, y, z);
  }
  return new Float32Array(out);
}

const vec = ([lat, lon]) => {
  const a = (lat * Math.PI) / 180, b = (lon * Math.PI) / 180;
  return [Math.cos(a) * Math.sin(b), -Math.sin(a), Math.cos(a) * Math.cos(b)];
};
// Dot shades, dim night side to lit day side: one fill per band per frame.
const BANDS = [
  `rgba(${TEAL},0.13)`, `rgba(${TEAL},0.22)`, `rgba(${TEAL},0.36)`, `rgba(${TEAL},0.52)`,
  `rgba(${TEAL},0.7)`, `rgba(96,236,214,0.86)`, `rgba(168,246,236,0.95)`,
];

export function mountGlobe(host, stage, still) {
  const canvas = document.createElement("canvas");
  let ctx = canvas.getContext?.("2d");
  // The Earth itself (air, sea, land dots) is drawn into its own layer and only redrawn once the globe has turned about a
  // third of a degree (~17 fps at one turn a minute); arcs and pulses on top keep the ~30 fps frame. Keeps idle JS low.
  const layer = document.createElement("canvas"), lctx = layer.getContext?.("2d");
  let drawnAt = NaN;
  if (!ctx) return null;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;inline-size:100%;block-size:100%;opacity:0;transition:opacity .6s cubic-bezier(.16,1,.3,1);pointer-events:none";
  host.append(canvas);

  let w = 0, h = 0, cx = 0, cy = 0, r = 0, dpr = 1, count = 0, pts = new Float32Array(0), shade = new Uint8Array(0), px = pts;
  // Start with Asia facing the viewer; the globe then turns west to east like the Earth (about one turn a minute).
  let chips = [], anchors = [], selected = null, raf = 0, last = 0, visible = true, angle = -1.9;
  const spin = (v, a) => {
    // Turn about the vertical axis, then lean toward the viewer.
    const ca = Math.cos(a), sa = Math.sin(a), x = v[0] * ca + v[2] * sa, z = -v[0] * sa + v[2] * ca;
    const ct = Math.cos(TILT), st = Math.sin(TILT);
    return [x, v[1] * ct - z * st, v[1] * st + z * ct];
  };

  const measure = () => {
    const rect = host.getBoundingClientRect();
    const ring = stage.querySelector(".hx-globe-svg circle")?.getBoundingClientRect();
    w = rect.width; h = rect.height;
    if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = layer.width = Math.round(w * dpr); canvas.height = layer.height = Math.round(h * dpr);
    drawnAt = NaN;
    // Same circle as the server-rendered SVG, so the canvas lands exactly on it.
    if (ring?.width) { r = ring.width / 2; cx = ring.left - rect.left + r; cy = ring.top - rect.top + r; }
    else { r = Math.min(w, h) * 0.34; cx = w / 2; cy = h / 2; }
    // About 5-6 px between dots at any size; the land keeps roughly 30 % of them.
    const n = Math.round(Math.min(9000, Math.max(3600, r * r * 0.36)) / 400) * 400;
    if (n !== count) { count = n; pts = landDots(n); shade = new Uint8Array(pts.length / 3); px = new Float32Array(pts.length); }
    chips = [...stage.querySelectorAll(".hx-stage-node")];
    anchors = chips.map((chip) => {
      const c = chip.getBoundingClientRect();
      const x = Math.min(Math.max(cx, c.left - rect.left), c.right - rect.left);
      const y = Math.min(Math.max(cy, c.top - rect.top), c.bottom - rect.top);
      return { x, y, slug: chip.dataset.venue };
    });
  };

  const disc = (fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); };
  const drawEarth = () => {
    // Atmosphere: a soft rim that is brighter on the sunlit side, drawn behind the sphere.
    const ax = cx + SUN[0] * r * 0.08, ay = cy + SUN[1] * r * 0.08;
    const air = ctx.createRadialGradient(ax, ay, r * 0.92, ax, ay, r * 1.2);
    air.addColorStop(0, `rgba(${ICE},0.3)`); air.addColorStop(0.35, `rgba(${TEAL},0.12)`); air.addColorStop(1, `rgba(${TEAL},0)`);
    ctx.fillStyle = air; ctx.beginPath(); ctx.arc(cx, cy, r * 1.2, 0, Math.PI * 2); ctx.fill();
    // Ocean body, lit from the sun's side: deep teal by day, near-black by night.
    const sx = cx + SUN[0] * r * 0.55, sy = cy + SUN[1] * r * 0.55;
    const sea = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 1.55);
    sea.addColorStop(0, "#133a43"); sea.addColorStop(0.4, "#0b2229"); sea.addColorStop(0.72, "#060d11"); sea.addColorStop(1, "#040608");
    disc(sea);

    // Faint graticule (every 30 degrees) turning with the land, front half only.
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${TEAL},0.07)`;
    ctx.beginPath();
    for (let m = 0; m < 11; m += 1) {
      let pen = false;
      for (let k = 0; k <= 60; k += 1) {
        const u = (k / 60) * Math.PI * 2;
        const lat = ((m - 8) * Math.PI) / 6; // m 6..10: parallels at -60..60
        const v = m < 6
          ? spin([Math.cos(u) * Math.sin((m * Math.PI) / 6), Math.sin(u), Math.cos(u) * Math.cos((m * Math.PI) / 6)], angle)
          : spin([Math.cos(lat) * Math.cos(u), -Math.sin(lat), Math.cos(lat) * Math.sin(u)], angle);
        if (v[2] < 0) { pen = false; continue; }
        if (pen) ctx.lineTo(cx + v[0] * r, cy + v[1] * r); else ctx.moveTo(cx + v[0] * r, cy + v[1] * r);
        pen = true;
      }
    }
    ctx.stroke();

    // Land dots, shaded by the sun (soft terminator) and by how squarely they face the viewer.
    const ca = Math.cos(angle), sa = Math.sin(angle), ct = Math.cos(TILT), st = Math.sin(TILT);
    const base = r > 150 ? 2.1 : r > 100 ? 1.8 : 1.5, top = BANDS.length - 1;
    for (let i = 0, j = 0; i < pts.length; i += 3, j += 1) {
      const ox = pts[i], oy = pts[i + 1], oz = pts[i + 2];
      const x = ox * ca + oz * sa, z0 = -ox * sa + oz * ca, y = oy * ct - z0 * st, z = oy * st + z0 * ct;
      if (z <= 0.02) { shade[j] = 255; continue; }
      const lit = x * SUN[0] + y * SUN[1] + z * SUN[2];
      const day = Math.min(1, Math.max(0, (lit + 0.12) / 0.4)); // terminator about 13 degrees wide
      const level = (0.12 + 0.88 * day * day * (3 - 2 * day)) * (0.45 + 0.55 * Math.min(1, z * 1.6));
      shade[j] = Math.min(top, Math.floor(level * BANDS.length));
      px[j * 3] = cx + x * r; px[j * 3 + 1] = cy + y * r; px[j * 3 + 2] = base * (0.55 + 0.45 * z);
    }
    for (let band = 0; band <= top; band += 1) {
      ctx.fillStyle = BANDS[band];
      ctx.beginPath();
      for (let j = 0; j < shade.length; j += 1) {
        if (shade[j] !== band) continue;
        const s = px[j * 3 + 2];
        ctx.rect(px[j * 3] - s / 2, px[j * 3 + 1] - s / 2, s, s);
      }
      ctx.fill();
    }

    // Ocean glint where the sun reflects toward the viewer, and a fresnel rim that wraps the edge in air.
    const gx = cx + GLINT[0] * r, gy = cy + GLINT[1] * r;
    const glint = ctx.createRadialGradient(gx, gy, 0, gx, gy, r * 0.42);
    glint.addColorStop(0, "rgba(190,250,255,0.13)"); glint.addColorStop(1, "rgba(190,250,255,0)");
    disc(glint);
    const rim = ctx.createRadialGradient(cx, cy, r * 0.72, cx, cy, r);
    rim.addColorStop(0, `rgba(${ICE},0)`); rim.addColorStop(0.82, `rgba(${ICE},0.05)`); rim.addColorStop(1, `rgba(${ICE},0.22)`);
    disc(rim);
    // Night side: a shadow over the far half so the terminator reads as a curve, not just dimmer dots.
    const nx = cx - SUN[0] * r * 1.05, ny = cy - SUN[1] * r * 1.05;
    const night = ctx.createRadialGradient(nx, ny, 0, nx, ny, r * 1.3);
    night.addColorStop(0, "rgba(2,4,6,0.62)"); night.addColorStop(0.5, "rgba(2,4,6,0.34)"); night.addColorStop(0.8, "rgba(2,4,6,0.08)"); night.addColorStop(1, "rgba(2,4,6,0)");
    disc(night);
  };

  const draw = (now) => {
    if (!w || !h) return;
    if (lctx && !(Math.abs(angle - drawnAt) < 0.006)) {
      const main = ctx;
      ctx = lctx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      drawEarth();
      ctx = main;
      drawnAt = angle;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (lctx) ctx.drawImage(layer, 0, 0, w, h); else drawEarth();

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
        ctx.strokeStyle = `rgba(${on ? ICE : TEAL},${(on ? 0.85 : 0.42) * alpha})`;
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

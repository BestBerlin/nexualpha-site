// Deterministic source-derived review images. This is deliberately not a browser screenshot or a performance test.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { Resvg } from '@resvg/resvg-js';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'docs/evidence/globe-css');
const baseline = 'b497d6ea';
const size = 600;
const modulePath = 'src/components/v7/home7-globe.js';
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const number = (value) => Number(value.toFixed(4));
const rect = (x, y, width, height) => ({ x, y, left: x, top: y, width, height, right: x + width, bottom: y + height });

// Only the drawing calls actually used by the old renderer are supported. Unknown calls fail instead of silently
// producing an incomplete baseline. dpr=1 keeps setTransform an identity; all old radial gradients are concentric.
function recordingCanvas(window) {
  const definitions = [];
  const contexts = new WeakMap();
  window.HTMLCanvasElement.prototype.getContext = function getContext(kind) {
    assert.equal(kind, '2d');
    if (contexts.has(this)) return contexts.get(this);
    let commands = [], current = [], dash = [];
    const paint = (value) => typeof value === 'string' ? value : `url(#${value.id})`;
    const context = {
      fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, lineCap: 'butt',
      beginPath() { current = []; },
      moveTo(x, y) { current.push(`M${number(x)},${number(y)}`); },
      lineTo(x, y) { current.push(`L${number(x)},${number(y)}`); },
      rect(x, y, width, height) { current.push(`M${number(x)},${number(y)}h${number(width)}v${number(height)}h${number(-width)}z`); },
      arc(x, y, radius, start, end) {
        assert.equal(start, 0);
        assert.ok(Math.abs(end - Math.PI * 2) < 1e-8, 'adapter only supports full circles');
        current.push(`M${number(x + radius)},${number(y)}a${number(radius)},${number(radius)} 0 1 0 ${number(-2 * radius)},0a${number(radius)},${number(radius)} 0 1 0 ${number(2 * radius)},0`);
      },
      fill() { commands.push(`<path d="${current.join(' ')}" fill="${escape(paint(this.fillStyle))}"/>`); },
      stroke() {
        commands.push(`<path d="${current.join(' ')}" fill="none" stroke="${escape(paint(this.strokeStyle))}" stroke-width="${this.lineWidth}" stroke-linecap="${this.lineCap}"${dash.length ? ` stroke-dasharray="${dash.join(' ')}"` : ''}/>`);
      },
      setLineDash(value) { dash = value; },
      setTransform(...values) { assert.deepEqual(values, [1, 0, 0, 1, 0, 0]); },
      clearRect(x, y, width, height) { assert.deepEqual([x, y, width, height], [0, 0, size, size]); commands = []; },
      drawImage(canvas, x, y, width, height) {
        assert.deepEqual([x, y, width, height], [0, 0, size, size]);
        commands.push(contexts.get(canvas).serialize());
      },
      createRadialGradient(x0, y0, r0, x1, y1, r1) {
        assert.deepEqual([x0, y0], [x1, y1]);
        const id = `canvas-gradient-${definitions.length}`;
        const stops = [];
        const gradient = { id, addColorStop(offset, color) { stops.push({ offset, color }); } };
        // The first stop extends inward to the inner circle, as Canvas2D specifies.
        definitions.push(() => `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${x1}" cy="${y1}" r="${r1}"><stop offset="0" stop-color="${escape(stops[0].color)}"/>${stops.map(({ offset, color }) => `<stop offset="${(r0 + offset * (r1 - r0)) / r1}" stop-color="${escape(color)}"/>`).join('')}</radialGradient>`);
        return gradient;
      },
      serialize() { return commands.join(''); },
    };
    contexts.set(this, context);
    return context;
  };
  return { definitions, contexts };
}

async function stageHtml() {
  // middleware mode: module evaluation only, no listening socket, browser, or network request.
  const vite = await createServer({ root, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, ws: false } });
  try {
    const { render } = await vite.ssrLoadModule('/src/entry-server.jsx');
    const page = new JSDOM(await render('/?locale=en'));
    const stage = page.window.document.querySelector('.hx-stage');
    assert.ok(stage, 'real home SSR must contain the stage');
    return stage.outerHTML;
  } finally { await vite.close(); }
}

function mount(source, html, old = false) {
  const dom = new JSDOM(html);
  const { window } = dom;
  const { document } = window;
  const stage = document.querySelector('.hx-stage');
  const host = stage.querySelector('.hx-globe');
  host.getBoundingClientRect = () => rect(0, 0, size, size);
  // Explicit synthetic geometry; this is a normalized art crop, not a CSS viewport/layout measurement.
  for (const circle of stage.querySelectorAll('.hx-globe-svg circle')) {
    const radius = Number(circle.getAttribute('r')) * size / 100;
    circle.getBoundingClientRect = () => rect(size / 2 - radius, size / 2 - radius, radius * 2, radius * 2);
  }
  const chipBoxes = [rect(0, 0, 100, 45), rect(500, 0, 100, 45), rect(0, 555, 100, 45), rect(500, 555, 100, 45), rect(250, 555, 100, 45)];
  const chips = [...stage.querySelectorAll('.hx-stage-node')];
  assert.ok(chips.length >= 3 && chips.length <= 5);
  chips.forEach((chip, index) => { chip.getBoundingClientRect = () => chipBoxes[index]; });
  window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  const recorder = old ? recordingCanvas(window) : null;
  const context = vm.createContext({
    window, document, performance: { now: () => 0 },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    IntersectionObserver: class { observe() {} disconnect() {} },
    ResizeObserver: class { observe() {} disconnect() {} },
  });
  vm.runInContext(`${source.replace('export function mountGlobe', 'function mountGlobe')}\nthis.mountGlobe = mountGlobe;`, context);
  const handle = context.mountGlobe(host, stage, true);
  assert.ok(handle);
  // HomeV7 calls select immediately after mounting; use its SSR selection, not an invented venue.
  const selected = stage.querySelector('.hx-stage-node[data-on]')?.dataset.venue;
  if (selected) handle.select(selected);
  return { dom, host, stage, handle, recorder, chips };
}

const wrap = (body, definitions = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="600" height="600" fill="#07080a"/><defs>${definitions}</defs>${body}</svg>`;

function beforeSvg(source, html) {
  const mounted = mount(source, html, true);
  const canvas = mounted.host.querySelector('canvas');
  const body = mounted.recorder.contexts.get(canvas).serialize();
  const definitions = mounted.recorder.definitions.map((definition) => definition()).join('');
  assert.ok(body.length > 10000, 'baseline must include actual dotted land and routes');
  mounted.handle.destroy();
  mounted.dom.window.close();
  return wrap(body, definitions);
}

function afterSvg(source, html) {
  const mounted = mount(source, html);
  const disc = mounted.host.querySelector('.hx-earth-disc');
  const image = disc.querySelector('.hx-earth-map');
  const texture = decodeURIComponent(image.getAttribute('src').split(',')[1]);
  assert.match(texture, /<use href="#land" x="720"/);
  const x = parseFloat(disc.style.left), y = parseFloat(disc.style.top), diameter = parseFloat(disc.style.width), radius = diameter / 2;
  const cx = x + radius, cy = y + radius;
  const circle = (fill) => `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="url(#${fill})"/>`;
  const gradient = (id, px, py, stops) => {
    const gx = x + diameter * px, gy = y + diameter * py;
    const reach = Math.max(...[x, x + diameter].flatMap((xx) => [y, y + diameter].map((yy) => Math.hypot(xx - gx, yy - gy))));
    return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${gx}" cy="${gy}" r="${reach}">${stops.map(([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`).join('')}</radialGradient>`;
  };
  const definitions = `<clipPath id="disc"><circle cx="${cx}" cy="${cy}" r="${radius}"/></clipPath>`
    + gradient('ocean', .3, .28, [[0, '#12323a'], [.5, '#091c26'], [1, '#05090f']])
    + gradient('glint', .28, .25, [[0, 'rgba(190,250,255,.15)'], [.35, 'rgba(190,250,255,0)'], [1, 'rgba(190,250,255,0)']])
    + gradient('night', .9, .7, [[0, 'rgba(2,4,6,.88)'], [.36, 'rgba(2,4,6,.6)'], [.7, 'rgba(2,4,6,0)'], [1, 'rgba(2,4,6,0)']])
    + gradient('limb', .5, .5, [[0, 'rgba(2,6,10,0)'], [.55, 'rgba(2,6,10,0)'], [1, 'rgba(2,6,10,.66)']])
    + `<radialGradient id="air"><stop offset=".82" stop-color="#1fe0c0" stop-opacity="0"/><stop offset=".88" stop-color="#1fe0c0" stop-opacity=".14"/><stop offset="1" stop-color="#1fe0c0" stop-opacity="0"/></radialGradient>`
    + `<radialGradient id="rim"><stop offset=".94" stop-color="#7fe7ff" stop-opacity="0"/><stop offset="1" stop-color="#7fe7ff" stop-opacity=".26"/></radialGradient>`;
  const textureBody = texture.match(/<svg[^>]*>([\s\S]*)<\/svg>/)[1];
  // img is 400% of the disc; preserveAspectRatio is explicit because the emitted viewBox is a texture strip.
  const map = `<svg x="${x}" y="${y}" width="${diameter * 4}" height="${diameter}" viewBox="0 0 1440 360" preserveAspectRatio="none">${textureBody}</svg>`;
  const grid = disc.querySelector('.hx-earth-grid').cloneNode(true);
  grid.setAttribute('x', x); grid.setAttribute('y', y); grid.setAttribute('width', diameter); grid.setAttribute('height', diameter);
  grid.setAttribute('fill', 'none'); grid.setAttribute('stroke', '#1fe0c0'); grid.setAttribute('stroke-opacity', '.09'); grid.setAttribute('stroke-width', '.25');
  const routes = mounted.host.querySelector('.hx-earth-routes').cloneNode(true);
  routes.setAttribute('width', size); routes.setAttribute('height', size);
  // Reduced motion is used for both captures, so travelling pulses are hidden by the real stylesheet.
  routes.querySelectorAll('.hx-earth-pulse').forEach((pulse) => pulse.remove());
  for (const item of routes.querySelectorAll('path,circle')) {
    const selected = item.closest('[data-on="true"]');
    const color = selected ? '#7fe7ff' : '#1fe0c0';
    const name = item.getAttribute('class');
    item.setAttribute('fill', name === 'hx-earth-node' ? color : name === 'hx-earth-hub' ? '#effffc' : 'none');
    item.setAttribute('stroke', name === 'hx-earth-node' || name === 'hx-earth-hub' ? 'none' : name === 'hx-earth-beat' ? '#7fe7ff' : color);
    item.setAttribute('stroke-width', name === 'hx-earth-arc' && selected ? '1.6' : '1');
    if (name === 'hx-earth-leader') { item.setAttribute('stroke-opacity', '.22'); item.setAttribute('stroke-dasharray', '2 4'); }
    if (name === 'hx-earth-arc') item.setAttribute('stroke-opacity', selected ? '.85' : '.42');
  }
  const result = wrap(`<circle cx="${cx}" cy="${cy}" r="${radius + 24}" fill="url(#air)"/>${circle('ocean')}<g clip-path="url(#disc)">${map}${grid.outerHTML}${circle('limb')}${circle('night')}${circle('glint')}${circle('rim')}</g><circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#7fe7ff" stroke-opacity=".4"/>${routes.outerHTML}`, definitions);
  mounted.handle.destroy();
  mounted.dom.window.close();
  return result;
}

await mkdir(output, { recursive: true });
const html = await stageHtml();
const before = execFileSync('git', ['show', `${baseline}:pilot-01-prototype/${modulePath}`], { cwd: root, encoding: 'utf8' });
const after = await readFile(path.join(root, modulePath), 'utf8');
const assets = {};
for (const [name, svg] of [['before-canvas', beforeSvg(before, html)], ['after-css', afterSvg(after, html)]]) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  await writeFile(path.join(output, `${name}.svg`), svg);
  await writeFile(path.join(output, `${name}.png`), png);
  assets[name] = { svgBytes: Buffer.byteLength(svg), pngBytes: png.length, pngSha256: createHash('sha256').update(png).digest('hex') };
  console.log(`${name}: ${size}x${size}; SVG ${Buffer.byteLength(svg)} bytes; PNG ${png.length} bytes`);
}
await writeFile(path.join(output, 'render-manifest.json'), `${JSON.stringify({ baseline, modulePath, afterModuleSha256: createHash('sha256').update(after).digest('hex'), normalizedArtSize: size, reducedMotion: true, assets }, null, 2)}\n`);
console.log(`Baseline ${baseline}; normalized 600px art crop; reduced motion; real SSR route slots; chips omitted.`);

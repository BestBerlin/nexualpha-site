// Promo Short builder: one spec -> HyperFrames compositions per locale and format.
// Usage: node build.mjs <spec.json> <locale> [vertical|square ...]
// Output: build/<id>-<locale>-<format>/index.html (+ assets), and timing.json for the muxer.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { nexubo } from '../../academy-v3/characters.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const academy = join(root, '../../academy-v3');
const require = createRequire(join(academy, 'package.json'));
const QRCode = require('qrcode');

export const FORMATS = { vertical: [1080, 1920], square: [1080, 1080] };
const FPS = 30;

// Owner rules for promo frames: no fine print, no regulator claims, no rebate percentages.
const BANNED = [
  /capital (?:is )?at risk/i, /not (?:investment|financial) advice/i, /terms (?:and conditions )?apply/i,
  /\bSEC\b/, /approved by/i, /\d+\s?%/, /rebate|cashback|返佣|返还/i,
];
export function assertPromoCopy(text, where) {
  const hit = BANNED.find(p => p.test(String(text)));
  if (hit) throw new Error(`Banned promo copy in ${where}: "${String(text).match(hit)[0]}"`);
}

const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const frames = s => Math.round(s * FPS) / FPS;

export function schedule(spec) {
  let t = 0;
  const scenes = spec.scenes.map(s => {
    const out = { ...s, start: frames(t), duration: frames(s.duration) };
    t += out.duration;
    return out;
  });
  return { scenes, total: frames(t) };
}

function sceneContent(scene, copy, spec) {
  switch (scene.id) {
    case 'hook':
      return `<h1 class="fit hook-title" data-max="3">${esc(copy.hook)}</h1><div class="hook-q" aria-hidden="true">?</div>`;
    case 'product':
      return `<p class="fit lead" data-max="2">${esc(copy.lead)}</p><div class="fit count" data-max="1">${esc(copy.count)}</div><p class="fit what" data-max="2">${esc(copy.what)}</p><p class="fit tail" data-max="1">${esc(copy.tail)}</p><div class="chips">${spec.tickers.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>`;
    case 'facts':
      return `<ul class="facts">${copy.facts.map((f, i) => `<li class="fact"><span class="tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="fit fact-text" data-max="2">${esc(f)}</span></li>`).join('')}</ul>`;
    case 'shares':
      return `<h1 class="fit real" data-max="2">${esc(copy.real)}</h1><div class="share-card"><div class="share-row"><span class="chip">AAPL</span><span class="bar"></span></div><p class="fit real-sub" data-max="2">${esc(copy.real_sub)}</p></div>`;
    case 'cta':
      return `<p class="fit cta-line" data-max="2">${esc(copy.cta)}</p><div class="code">${esc(spec.code)}</div><div class="qr-card"><img src="assets/qr.svg" alt=""></div><p class="fit url" data-max="1">${esc(spec.url)}</p>`;
    default:
      throw new Error(`Unknown scene id: ${scene.id}`);
  }
}

export async function build(spec, locale, formats = Object.keys(FORMATS), { speech = {} } = {}) {
  const copy = spec.copy[locale];
  if (!copy) throw new Error(`Spec has no copy for locale ${locale}`);
  for (const [k, v] of Object.entries(copy)) assertPromoCopy([].concat(v).join(' '), `${locale}.${k}`);
  const { scenes, total } = schedule(spec);
  const css = await readFile(join(root, 'style.css'), 'utf8');
  const runtime = await readFile(join(root, 'motion.js'), 'utf8');
  const logo = join(root, '../../../pilot-01-prototype/public/brand/nexualpha/nexualpha-round.svg');
  const qr = await QRCode.toString(spec.qr, { type: 'svg', errorCorrectionLevel: 'M', margin: 2, color: { dark: '#0b0d10', light: '#ffffff' } });
  const dirs = [];
  for (const format of formats) {
    const [width, height] = FORMATS[format] ?? [];
    if (!width) throw new Error(`Unknown format ${format}`);
    const dir = join(root, 'build', `${spec.id}-${locale}-${format}`);
    await mkdir(join(dir, 'assets'), { recursive: true });
    await copyFile(logo, join(dir, 'assets/logo.svg'));
    await copyFile(join(academy, 'node_modules/gsap/dist/gsap.min.js'), join(dir, 'assets/gsap.min.js'));
    await copyFile(join(root, '../fonts/InterVariable.ttf'), join(dir, 'assets/InterVariable.ttf'));
    await writeFile(join(dir, 'assets/qr.svg'), qr);
    const sections = [];
    for (const [i, s] of scenes.entries()) {
      const host = await nexubo({ id: `promo-${s.id}`, pose: s.pose, expression: s.expression, antenna: s.antenna });
      sections.push(`<section id="scene-${i}" class="scene scene-${s.id}" data-scene="${s.id}"><div class="copy">${sceneContent(s, copy, spec)}</div><div class="host" data-pose="${s.pose}">${host}</div></section>`);
    }
    const voiced = spec.narration_locale === locale && Object.keys(speech).length > 0;
    const timeline = scenes.map(({ id, start, duration, pose, narration }) => {
      const speechDuration = voiced ? speech[id] ?? null : null;
      if (speechDuration && (spec.lead_in ?? 0.3) + speechDuration > duration - 0.15) throw new Error(`Narration for ${id} (${speechDuration}s) does not fit scene ${duration}s`);
      return { id, start, duration, pose, speech: speechDuration ? narration : null, speechDuration };
    });
    const serialized = JSON.stringify(timeline).replace(/</g, '\\u003c');
    const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>NexuAlpha promo ${spec.id} ${locale} ${format}</title><style>@font-face{font-family:'Inter Promo';src:url(assets/InterVariable.ttf) format('truetype');font-weight:100 900}${css}</style></head><body><main id="promo" class="${format}" data-composition-id="promo" data-start="0" data-duration="${total}" data-width="${width}" data-height="${height}" data-fps="${FPS}" style="width:${width}px;height:${height}px"><div class="progress-track"><div class="progress"></div></div><div class="brand"><img id="brand-corner" data-start="0" data-duration="${total}" src="assets/logo.svg" alt="NexuAlpha logo"><span>NexuAlpha</span></div>${sections.join('')}</main><script src="assets/gsap.min.js"></script><script>const SCENES=${serialized};const TOTAL=${total};const LEAD_IN=${spec.lead_in ?? 0.3};${runtime}</script></body></html>`;
    await writeFile(join(dir, 'index.html'), html);
    await writeFile(join(dir, 'timing.json'), JSON.stringify({ id: spec.id, locale, format, width, height, fps: FPS, total, lead_in: spec.lead_in ?? 0.3, scenes: timeline }, null, 2) + '\n');
    dirs.push(dir);
    console.log(`Built ${dir}: ${width}x${height}, ${total}s`);
  }
  return dirs;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [specPath, locale, ...formats] = process.argv.slice(2);
  if (!specPath || !locale) { console.error('Usage: node build.mjs <spec.json> <locale> [vertical|square ...]'); process.exit(2); }
  const spec = JSON.parse(await readFile(resolve(specPath), 'utf8'));
  await build(spec, locale, formats.length ? formats : undefined);
}

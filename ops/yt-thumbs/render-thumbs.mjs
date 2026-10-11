#!/usr/bin/env node
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(here, '../../pilot-01-prototype/package.json'));
const { Resvg } = require('@resvg/resvg-js');
const fontRoot = '/System/Library/AssetsV2/com_apple_MobileAsset_Font8';
const fontFile = process.env.YT_THUMB_FONT || (existsSync(fontRoot) ? readdirSync(fontRoot)
  .map(name => join(fontRoot, name, 'AssetData/PingFang.ttc')).find(existsSync) : undefined);
if (!fontFile || !existsSync(fontFile)) throw new Error('PingFang font not found; set YT_THUMB_FONT to PingFang.ttc');
const options = { font: { loadSystemFonts: false, fontFiles: [fontFile, '/System/Library/Fonts/Apple Symbols.ttf'].filter(existsSync), defaultFontFamily: 'PingFang SC' } };
const logo = readFileSync(resolve(here, '../../pilot-01-prototype/public/brand/nexualpha/nexualpha-round.svg')).toString('base64');
const esc = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[ch]);
const text = (value, size, x = 0, y = 200, fill = '#fff', weight = 600) => `<text x="${x}" y="${y}" font-family="PingFang SC" font-weight="${weight}" font-size="${size}" fill="${fill}">${esc(value)}</text>`;
const wrapSvg = body => `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">${body}</svg>`;
const cache = new Map();
const widthModel = (value, size) => Array.from(value).reduce((sum, ch) => sum + (/\s/u.test(ch) ? .35 : /[ilI.,:;!'|]/u.test(ch) ? .4 : /[A-Za-z0-9]/u.test(ch) ? .78 : 1.06), 0) * size;
export function measure(value, size, weight = 600) {
  const key = `${weight}:${value}`;
  if (!cache.has(key)) {
    const bbox = new Resvg(wrapSvg(text(value, 100, 0, 200, '#fff', weight)), options).getBBox();
    cache.set(key, bbox ? { x: bbox.x, y: bbox.y - 200, width: bbox.width, height: bbox.height } : { x: 0, y: 0, width: 0, height: 0 });
  }
  return Object.fromEntries(Object.entries(cache.get(key)).map(([key, value]) => [key, value * size / 100]));
}
// Keep contiguous CJK phrases intact: without a dictionary, shrinking is safer
// than guessing word boundaries. Number+unit groups provide semantic breaks.
const numberGroup = String.raw`\d[\d,.]*(?:\s*[万亿兆千百])?(?:\s*(?:美元|美金|%|％))?`;
export function tokens(value) {
  return value.match(new RegExp(`${numberGroup}|[A-Za-z]+(?:[-'][A-Za-z]+)*|[\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}]+|[^\\s]|\\s+`, 'gu')) || [];
}
export function accentFor(value) {
  const down = value.match(/暴跌|下跌|跌破|失守|破位|下行|回调|走弱|领跌|跌|破|down|fall/iu);
  const up = value.match(/反弹|回升|上涨|上攻|重回|创新高|新高|走强|涨|up|rebound/iu);
  const match = down || up || value.match(new RegExp(numberGroup, 'u')) || value.match(/[A-Za-z]+|[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+|[^\s]/u);
  return { word: match?.[0] || '', index: match?.index || 0, color: down ? '#ff5c5c' : up ? '#3ddc97' : '#4f7cff' };
}
export function fit(value, maxSize, width, maxLines = 2, minSize = 12) {
  for (let size = maxSize; size >= minSize; size--) {
    const lines = []; let line = ''; let failed = false;
    for (const token of tokens(value)) {
      const candidate = line + token;
      if (widthModel(candidate.trim(), size) <= width - 8) { line = candidate; continue; }
      if (line.trim()) lines.push(line.trim());
      line = token.trimStart();
      if (widthModel(line.trim(), size) > width - 8 || lines.length >= maxLines) { failed = true; break; }
    }
    if (!failed) {
      if (line.trim()) lines.push(line.trim());
      if (lines.length && lines.length <= maxLines && lines.every(line => measure(line, size).width <= width - 8)) return { size, lines };
    }
  }
  throw new Error(`Text cannot fit without splitting a word or number: ${value}`);
}
const badges = { btc: ['₿', '#f7931a'], eth: ['Ξ', '#8a92b2'], alt: ['ALT', '#4f7cff'], macro: ['DXY', '#4f7cff'], 'us-stock': ['US', '#4f7cff'], strategy: ['策略', '#4f7cff'], exchange: ['交易所', '#4f7cff'], other: ['$', '#4f7cff'] };
export function buildThumbnail(item) {
  const hero = fit(item.thumb_main, 170, 835);
  const subtitle = item.thumb_sub.replace(/\s*(?:·\s*)?\d{4}([.-])\d{2}\1\d{2}\s*$/u, '').trim();
  const sub = subtitle ? fit(subtitle, 54, 835, 1) : { size: 54, lines: [] };
  const accent = accentFor(item.thumb_main);
  const [glyph, color] = badges[item.topic] || badges.other;
  const date = item.title.match(/【(\d{4}-\d{2}-\d{2})(?:[^】]*)】/u)?.[1];
  const bounds = [];
  function boundedText(value, size, x, y, fill, weight = 600, region = [0, 0, 1280, 720]) {
    const box = measure(value, size, weight);
    const rect = { x: x + box.x, y: y + box.y, width: box.width, height: box.height };
    if (rect.x < region[0] || rect.y < region[1] || rect.x + rect.width > region[2] || rect.y + rect.height > region[3]) throw new Error(`Text overflow: ${value}`);
    if (rect.x + rect.width > 1060 && rect.y + rect.height > 640) throw new Error(`Duration overlay collision: ${value}`);
    bounds.push({ text: value, ...rect });
    return text(value, size, x, y, fill, weight);
  }
  let body = '<rect width="1280" height="720" fill="#0b0d10"/>';
  for (let x = 40; x < 1280; x += 80) body += `<path d="M${x} 0V720" stroke="#aab3c0" opacity=".045"/>`;
  for (let y = 40; y < 720; y += 80) body += `<path d="M0 ${y}H1280" stroke="#aab3c0" opacity=".045"/>`;
  body += '<path d="M0 556L90 524L160 540L250 482L320 505L405 436L485 469L575 390L650 425L740 340L815 376L900 288L975 320L1050 238L1140 267L1280 173" fill="none" stroke="#4f7cff" stroke-width="2" opacity=".13"/>';
  body += `<rect x="48" y="38" width="356" height="62" rx="31" fill="#171d28"/><image href="data:image/svg+xml;base64,${logo}" x="59" y="47" width="44" height="44"/>`;
  body += boundedText('NexuAlpha 中文', 32, 115, 80, '#fff');
  body += boundedText('不喊单，只讲数据', 26, 48, 141, '#aab3c0');
  const baselines = hero.lines.length === 1 ? [385] : [330, 330 + hero.size * 1.14];
  let consumed = 0;
  hero.lines.forEach((line, i) => {
    const start = item.thumb_main.indexOf(line, consumed); consumed = start + line.length;
    const local = accent.index - start;
    // Keep the whole line in one shaping run; only one detected expression is coloured.
    const parts = local >= 0 && local + accent.word.length <= line.length
      ? `${esc(line.slice(0, local))}<tspan fill="${accent.color}">${esc(accent.word)}</tspan>${esc(line.slice(local + accent.word.length))}` : esc(line);
    boundedText(line, hero.size, 48, baselines[i], '#fff', 600, [48, 170, 890, 565]);
    body += `<text x="48" y="${baselines[i]}" font-family="PingFang SC" font-weight="600" font-size="${hero.size}" fill="#fff">${parts}</text>`;
  });
  if (sub.lines.length) body += boundedText(sub.lines[0], sub.size, 48, 590, '#aab3c0', 400, [48, 530, 890, 615]);
  body += `<rect x="936" y="206" width="296" height="296" rx="58" fill="${color}" fill-opacity=".1" stroke="${color}" stroke-opacity=".55" stroke-width="3"/>`;
  if (glyph === '₿') {
    // Vector Bitcoin glyph: the system PingFang font has no U+20BF outline.
    body += `<g stroke="${color}" fill="none" stroke-linecap="square"><path d="M1040 277V431M1023 277H1092C1150 277 1150 347 1092 347H1040M1092 347C1158 347 1158 431 1092 431H1023" stroke-width="23"/><path d="M1060 253V454M1085 253V454" stroke-width="10"/></g>`;
    bounds.push({ text: glyph, x: 1011, y: 248, width: 150, height: 211 });
  } else {
  const badgeSize = fit(glyph, glyph.length === 1 ? 208 : 112, 260, 1).size;
  const gb = measure(glyph, badgeSize);
  body += boundedText(glyph, badgeSize, 1084 - gb.width / 2 - gb.x, 354 - gb.height / 2 - gb.y, color, 600, [946, 216, 1222, 492]);
  }
  if (date) {
    body += '<rect x="48" y="640" width="232" height="46" rx="12" fill="#171d28"/>';
    body += boundedText(date, 28, 66, 674, '#aab3c0');
  }
  return { svg: wrapSvg(body), layout: { id: item.id, hero, sub, accent, bounds, date, glyph } };
}
function jpeg(png, path) {
  const result = spawnSync(process.env.FFMPEG || 'ffmpeg', ['-hide_banner', '-loglevel', 'error', '-threads', '1', '-f', 'image2pipe', '-i', 'pipe:0', '-frames:v', '1', '-q:v', '2', '-y', path], {
    input: png, env: { ...process.env, DYLD_LIBRARY_PATH: ['/opt/homebrew/Cellar/x265/4.2/lib', process.env.DYLD_LIBRARY_PATH].filter(Boolean).join(':') }, maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) throw new Error(`ffmpeg failed: ${result.error || result.stderr.toString()}`);
  const bytes = readFileSync(path).length;
  if (bytes >= 1_500_000) throw new Error(`JPEG exceeds 1.5 MB: ${path} (${bytes})`);
  return bytes;
}
export function validateItems(items) {
  if (!Array.isArray(items) || !items.length) throw new Error('Expected a nonempty JSON array');
  const ids = new Set();
  for (const item of items) {
    if (!item || !/^[A-Za-z0-9_-]+$/.test(item.id) || ids.has(item.id) || item.id.startsWith('contact-sheet-')) throw new Error(`Invalid or duplicate ID: ${item?.id}`);
    ids.add(item.id);
    for (const key of ['title', 'thumb_main', 'thumb_sub', 'topic']) if (typeof item[key] !== 'string' || !item[key].trim() || item[key].length > 500) throw new Error(`Invalid ${key} for ${item.id}`);
  }
}
export function renderCatalogue(items, out) {
  validateItems(items);
  // Check every layout before writing any thumbnails.
  const layouts = items.map(buildThumbnail);
  mkdirSync(out, { recursive: true });
  const manifest = layouts.map(({ svg, layout }) => ({ ...layout, bytes: jpeg(new Resvg(svg, options).render().asPng(), join(out, `${layout.id}.jpg`)) }));
  for (let offset = 0; offset < items.length; offset += 12) {
    const images = items.slice(offset, offset + 12).map((item, i) => `<image x="${(i % 4) * 320}" y="${Math.floor(i / 4) * 180}" width="320" height="180" href="data:image/jpeg;base64,${readFileSync(join(out, `${item.id}.jpg`)).toString('base64')}"/>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="540"><rect width="1280" height="540" fill="#0b0d10"/>${images}</svg>`;
    jpeg(new Resvg(svg, options).render().asPng(), join(out, `contact-sheet-${String(offset / 12 + 1).padStart(3, '0')}.jpg`));
  }
  writeFileSync(join(out, 'manifest.json'), JSON.stringify({ font: fontFile, count: items.length, items: manifest }, null, 2) + '\n');
  return manifest;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [input = join(here, 'fixture.json'), out = join(here, 'out')] = process.argv.slice(2);
  const result = renderCatalogue(JSON.parse(readFileSync(input, 'utf8')), resolve(out));
  console.log(`Rendered ${result.length} thumbnails and ${Math.ceil(result.length / 12)} contact sheets to ${resolve(out)}; largest JPEG ${Math.max(...result.map(item => item.bytes))} bytes.`);
}

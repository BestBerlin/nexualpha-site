import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { createOgImageRoute, newsCardSvg, venueCardSvg, compareCardSvg, liquidationsCardSvg, fundingCardSvg, defaultCardSvg, OG_LOCALES, wrapText, measureText } from '../server/og-image.mjs';
import { socialImagePathForRoute } from '../src/data/social-image.js';
import { publicCtaForVenue } from '../src/data/public-cta.js';
import { readFunding } from '../src/data/market-data-pages.js';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const snapshot = JSON.parse(await readFile(new URL('./fixtures/market-data/market-events.live-v2-2026-10-13.json', import.meta.url)));
const route = createOgImageRoute({ clientRoot: root, marketEventsFile: fileURLToPath(new URL('./fixtures/market-data/market-events.live-v2-2026-10-13.json', import.meta.url)) });
const logoPng = await readFile(new URL('../public/brands/tile/okx-128.png', import.meta.url));

const fontFiles = process.env.OG_FONT_DIR
  ? readdirSync(process.env.OG_FONT_DIR).filter(n => /\.(ttf|otf|ttc)$/i.test(n)).map(n => path.join(process.env.OG_FONT_DIR, n))
  : ['/System/Library/Fonts/Helvetica.ttc', '/System/Library/Fonts/STHeiti Medium.ttc', '/System/Library/Fonts/GeezaPro.ttc'].filter(existsSync);
const measureOptions = { font: { loadSystemFonts: !fontFiles.length, fontFiles, defaultFontFamily: 'Helvetica' } };

// Measure shaped ink with the actual renderer, independently of the wrapping heuristic.
function assertLayout(svg, label) {
  const runs = [...svg.matchAll(/<text\b[^>]*>[\s\S]*?<\/text>/g)].map(([node]) => {
    const box = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">${node}</svg>`, measureOptions).getBBox();
    assert.ok(box, `${label}: visible text ink: ${node}`);
    assert.ok(box.x >= 56 && box.x + box.width <= 1144, `${label}: horizontal safe area: ${[box.x, box.y, box.width, box.height]} ${node}`);
    assert.ok(box.y >= 48 && box.y + box.height <= 612, `${label}: vertical safe area: ${node}`);
    return { node, box };
  });
  for (let i = 0; i < runs.length; i++) for (let j = i + 1; j < runs.length; j++) {
    const a = runs[i].box, b = runs[j].box;
    const overlap = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 2
      && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 2;
    assert.equal(overlap, false, `${label}: overlapping text: ${runs[i].node} / ${runs[j].node}`);
  }
  return runs.length;
}

test('six distinct non-empty 1200x630 PNGs; warm cached requests below 150ms', async () => {
  const feed = JSON.parse(await readFile(path.join(root, 'content/news-feed.json')));
  const article = feed.articles.find(a => a.status === 'PUBLISHED' && a.relatedVenues?.length);
  assert.ok(article);
  const hashes = new Set();
  for (const [kind, id] of [['news', article.slug], ['venue', 'okx'], ['compare', 'binance-vs-okx'], ['liquidations', '24h'], ['funding', 'rates'], ['default', 'site']]) {
    const url = `https://nexualpha.com/og/${kind}/${id}.png`;
    const response = await route(new Request(url));
    assert.equal(response.status, 200);
    const png = Buffer.from(await response.arrayBuffer());
    assert.equal(png.readUInt32BE(16), 1200);
    assert.equal(png.readUInt32BE(20), 630);
    assert.ok(png.length > 10_000, `${kind}: visible content`);
    hashes.add(png.toString('base64'));
    const times = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      assert.ok(Buffer.from(await (await route(new Request(url))).arrayBuffer()).equals(png));
      times.push(performance.now() - start);
    }
    assert.ok(Math.max(...times) < 150, `${kind}: ${times}`);
    console.log(`${kind}: max warm request ${Math.max(...times).toFixed(2)}ms`);
    const svg = await route.svgFor(kind, id);
    const renderStart = performance.now();
    const raster = new Resvg(svg, measureOptions).render();
    const freshPng = raster.asPng();
    const renderMs = performance.now() - renderStart;
    assert.ok(freshPng.length > 10_000);
    if (fontFiles.length) assert.ok(renderMs < 150, `${kind}: warm native render with explicit fonts ${renderMs}ms`);
    console.log(`${kind}: warm native render + PNG encode ${renderMs.toFixed(2)}ms (${fontFiles.length ? 'explicit fonts' : 'system fonts'})`);
    const pixels = raster.pixels;
    const colors = new Set();
    for (let i = 0; i < pixels.length; i += 400) colors.add(pixels.subarray(i, i + 4).toString('hex'));
    assert.ok(colors.size > 12, `${kind}: pixel variation`);
  }
  assert.equal(hashes.size, 6);
});

test('17 locales × 6 types measure inside safe areas without text collisions', () => {
  let count = 0;
  for (const locale of OG_LOCALES) {
    const cards = [
      ['article', newsCardSvg({ locale, title: locale.startsWith('zh') ? '比特币 BTC 与 OKX 交易手续费核验：混合文字标题正确换行'.repeat(3) : locale === 'ar' ? 'كيفية التحقق من موقع منصة العملات الرسمي قبل النقر أو تسجيل الدخول أو الإيداع' : 'WWWW Ethereum exchange fees: a long mixed-script 交易所 title with word boundaries', category: 'Research', date: '2026-10-23', logoPng })],
      ['venue', venueCardSvg({ locale, name: 'OKX', logoPng, spot: '0.08% / 0.10%', rebateShare: 0.4, inviteCode: publicCtaForVenue('okx', locale).inviteCode, checkedOn: '2026-10-10' })],
      ['compare', compareCardSvg({ locale, venues: [{ name: 'Binance', logoPng, spot: '0.10% / 0.10%', perp: '0.02% / 0.05%', spotNumbers: [0.1, 0.1] }, { name: 'OKX', logoPng, spot: '0.08% / 0.10%', perp: '0.02% / 0.05%', spotNumbers: [0.08, 0.1] }] })],
      ['liquidations', liquidationsCardSvg({ locale, window: snapshot.liquidations.h24, generatedAt: snapshot.generatedAt })],
      ['funding', fundingCardSvg({ locale, funding: readFunding(snapshot) })],
      ['default', defaultCardSvg({ locale })],
    ];
    for (const [kind, svg] of cards) count += assertLayout(svg, `${kind}/${locale}`);
  }
  console.log(`Measured ${count} text runs in 102 layouts with resvg ink bounds.`);
});

test('CJK, wide Latin and unbroken titles use at most two measured lines', () => {
  for (const title of ['W'.repeat(160), '比特币手续费 BTC 与交易所数据'.repeat(20), '価格検証と手数料'.repeat(30), '<script>&"'.repeat(40)]) {
    const lines = wrapText(title, { fontSize: 60, maxWidth: 740, maxLines: 2 });
    assert.ok(lines.length <= 2);
    assert.ok(lines.every(line => measureText(line, 60) <= 740));
    const svg = newsCardSvg({ title, logoPng });
    assert.equal((svg.match(/data-og-title/g) || []).length, 2);
    assertLayout(svg, title.slice(0, 8));
    assert.doesNotMatch(svg, /<script>/);
  }
});

test('snapshot charts preserve signed rates, real coverage and timestamp; compare gap uses reviewed percent points', async () => {
  const liq = await route.svgFor('liquidations', '1h');
  assert.match(liq, /1h/);
  assert.match(liq, /2026-10-13 15:56 UTC/);
  assert.match(liq, /data-og-chart="liquidations"/);
  const svg = fundingCardSvg({ funding: { generatedAt: snapshot.generatedAt, rows: [{ symbol: 'BTC', binanceRate: -0.0001, okxRate: null }, { symbol: 'ETH', binanceRate: 0, okxRate: 0.0002 }] } });
  assert.match(svg, /-0.01%/);
  assert.match(svg, /0.02%/);
  assert.equal((svg.match(/data-og-chart="funding"/g) || []).length, 3);
  assert.match(svg, /width="0"/);
  const noSide = liquidationsCardSvg({ window: { totalUsd: 0, longUsd: null, shortUsd: 0 }, generatedAt: snapshot.generatedAt });
  assert.equal((noSide.match(/data-og-chart/g) || []).length, 1);
  const oneVenue = liquidationsCardSvg({ window: { totalUsd: 10, coverage: { venues: ['OKX'] } }, generatedAt: snapshot.generatedAt });
  assert.doesNotMatch(oneVenue, /Binance \+/);
  const compare = await route.svgFor('compare', 'binance-vs-okx');
  assert.match(compare, /OKX spot maker fee 0.02 pp lower/);
  assert.doesNotMatch(compare, /Δ|0 pp/);
  assert.equal((compare.match(/data:image\/png;base64/g) || []).length, 2);
});

test('missing market numbers fail closed; metadata selects the versioned funding chart', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'og-v2-missing-'));
  try {
    await mkdir(path.join(dir, 'intel'));
    const r = createOgImageRoute({ clientRoot: dir });
    for (const data of [{}, { generatedAt: snapshot.generatedAt, liquidations: { h24: { totalUsd: null } }, funding: { rows: [] } }, { generatedAt: snapshot.generatedAt, funding: { rows: [null, { symbol: 'BTC', binanceRate: '0.01junk', okxRate: false }] } }, { generatedAt: 'invalid', liquidations: { h24: { totalUsd: 12 } } }]) {
      await writeFile(path.join(dir, 'intel/market-events.json'), JSON.stringify(data));
      for (const [kind, id] of [['funding', 'rates'], ['liquidations', '24h']]) {
        const response = await r(new Request(`https://nexualpha.com/og/${kind}/${id}.png`));
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('cache-control'), 'public, max-age=300');
        assert.doesNotMatch(await r.svgFor(kind, id), /data-og-chart|\$0|NaN|undefined/);
      }
    }
    assert.equal(await r.svgFor('funding', 'bad'), null);
  } finally { await rm(dir, { recursive: true, force: true }); }
  assert.equal(socialImagePathForRoute('/funding-rates'), '/og/funding/rates.png?v=2');
  assert.equal(socialImagePathForRoute('/news/a', 'zh-Hans'), '/og/news/a.png?v=2&locale=zh-Hans');
  assert.doesNotMatch(venueCardSvg({ name: 'Unknown' }), /Rebate|Invite code|NaN|undefined/);
});


test('article categories differ and every existing WebP tile has a renderable PNG equivalent', async () => {
  const colors = new Set(['guide', 'comparison', 'exchange-update', 'regulation', 'rwa', 'research'].map(categoryId =>
    newsCardSvg({ title: 'Headline', category: categoryId, categoryId }).match(/y="170" width="8" height="28" fill="([^"]+)"/)[1]));
  assert.equal(colors.size, 6);
  const dir = path.join(root, 'brands/tile');
  const tiles = readdirSync(dir).filter(n => n.endsWith('-128.webp'));
  assert.ok(tiles.length > 0);
  for (const tile of tiles) {
    const png = await readFile(path.join(dir, tile.replace('.webp', '.png')));
    assert.equal(png.subarray(1, 4).toString(), 'PNG', tile);
    assert.equal(png.readUInt32BE(16), 128, tile);
    assert.equal(png.readUInt32BE(20), 128, tile);
  }
});

test('compare columns mirror symmetrically with equal rounded tiles and a centered gradient VS ring', async () => {
  for (const locale of ['en', 'zh-Hans', 'ar']) {
    const svg = await route.svgFor('compare', 'binance-vs-okx', locale);
    const images = [...svg.matchAll(/<image[^>]+x="([\d.]+)" y="208" width="(\d+)" height="(\d+)"/g)];
    assert.equal(images.length, 2);
    assert.deepEqual(images.map(m => [m[2], m[3]]), [['128', '128'], ['128', '128']]);
    const centers = images.map(m => Number(m[1]) + Number(m[2]) / 2);
    assert.equal(centers[0] + centers[1], 1200);
    assert.match(svg, /data-og-vs="true"><circle cx="600" cy="272" r="48"[^>]+stroke="url\(#accent\)"/);
    assert.match(svg, /text-anchor="middle"[^>]*>VS<\/text>/);
    assert.equal((svg.match(/data-og-logo-tile="true"/g) || []).length, 2);
    assert.equal((svg.match(/rx="24"/g) || []).length, 4);
    assert.match(svg, /stop-color="#F0B90B" stop-opacity=".24"/);
    assert.match(svg, /stop-color="#FFFFFF" stop-opacity=".24"/);
    assert.match(svg, /y="452"[^>]*direction="ltr"[^>]*>0\.10% \/ 0\.10%<\/text>/);
    assert.match(svg, /y="486"[^>]*direction="ltr"[^>]*>0\.02% \/ 0\.05%<\/text>/);
    assertLayout(svg, `compare-symmetric/${locale}`);
  }
  const venue = await route.svgFor('venue', 'okx');
  assert.match(venue, /clip-path="url\(#logo-896-220-240-clip\)"/);
  assert.match(venue, /rx="24"/);
  assert.match(venue, /stop-color="#FFFFFF" stop-opacity=".24"/);
});

test('fee insights name the actual cheaper side, suppress missing data, and localize all supported editions', () => {
  const card = (left, right, locale = 'en') => compareCardSvg({ locale, venues: [
    { name: 'Binance', spotNumbers: left }, { name: 'OKX', spotNumbers: right },
  ] });
  assert.match(card([.1, .1], [.08, .1]), /OKX spot maker fee 0.02 pp lower/);
  assert.match(card([.08, .1], [.1, .08]), /Binance spot maker fee 0.02 pp lower/);
  assert.match(card([.08, .1], [.1, .08]), /OKX spot taker fee 0.02 pp lower/);
  assert.match(card([.1, .1], [.1, .1]), /Same spot fees/);
  assert.match(card([0, 0], [0, 0]), /Same spot fees/);
  assert.match(card([-.01, .1], [0, .1]), /Binance spot maker fee 0.01 pp lower/);
  assert.doesNotMatch(card([.1, .1], [.10000001, .1]), /0 pp lower/);
  for (const missing of [null, [], [.1], [null, .1], [NaN, .1], [Infinity, .1], ['0.1', .1]]) {
    assert.doesNotMatch(card(missing, [.1, .1]), /Same spot fees|pp lower|NaN|undefined/);
  }
  for (const locale of OG_LOCALES) {
    const svg = card([.08, .1], [.1, .08], locale);
    assertLayout(svg, `two-fee-insights/${locale}`);
    if (locale !== 'en') assert.doesNotMatch(svg, /pp lower|Same spot fees/);
    assert.doesNotMatch(svg, /Δ|\{name\}|\{gap\}/);
    assertLayout(card([.1, .1], [.1, .1], locale), `same-fees/${locale}`);
  }
  assert.match(card([.1, .1], [.08, .1], 'zh-Hans'), /OKX 现货挂单费率低 0.02 个百分点/);
  assert.match(card([.1, .1], [.08, .1], 'de'), /0,02 Prozentpunkte/);
  assertLayout(compareCardSvg({ venues: [{ name: 'OKX', logoPng }, { name: 'Bitget', logoPng }, { name: 'Bybit', logoPng }] }), 'three-venue-compatibility');
});

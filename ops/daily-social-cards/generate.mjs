#!/usr/bin/env node
import { readFileSync, mkdirSync, writeFileSync, openSync, closeSync, unlinkSync, renameSync, statSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { weightedLength, loadCredentials, xClient, keywordContext } from '../x-poster/x-poster.mjs';
import { composeWithTags, dailyKeywords } from '../x-poster/hashtags.mjs';
import { buildMoversSnapshot } from '../../pilot-01-prototype/src/data/movers.js';
import { token, sendPhoto, requireCurrentMarket } from '../alert-sender/alert-sender.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const HERE = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(new URL('../../pilot-01-prototype/package.json', import.meta.url));
const SITE = 'https://nexualpha.com';
export const CHANNELS = Object.freeze({ 'zh-Hans': '@NexuAlphaClub', en: '@NexuAlphaGlobal' });
export function channelFor(locale) {
  if (!Object.hasOwn(CHANNELS, locale)) throw new Error('Only zh-Hans and en channels allowed');
  return CHANNELS[locale];
}
export const sgtDay = (at) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(at));
export function dailySlotDue(at = Date.now()) {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Singapore', hour: '2-digit', hourCycle: 'h23' }).format(new Date(at))) >= 9;
}
const money = (n) => '$' + new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(n);
const pct = (n) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}%`;
const rate = (n) => `${n >= 0 ? '+' : '−'}${Math.abs(n * 100).toFixed(4)}%`;
const numeric = (v, name) => { if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) throw new Error(`Invalid ${name}`); return v; };
// The market collector rewrites its feed every 5 minutes; 20 minutes tolerates a slow or skipped cycle, not a dead one.
export const MAX_SOURCE_AGE_MS = 20 * 60000;
function fresh(at, now, name) {
  const t = Date.parse(at);
  const why = !Number.isFinite(t) ? 'missing' : t > now ? 'in the future' : now - t > MAX_SOURCE_AGE_MS ? `stale (${Math.round((now - t) / 60000)} min old)` : null;
  if (why) throw new Error(`Missing, future or stale ${name}: generatedAt ${at ?? 'absent'} is ${why}`);
}
export function normalize(movers, market, now) {
  if (movers?.stale === true) throw new Error('movers feed stale; waiting for recovery');
  requireCurrentMarket(market);
  fresh(movers?.generatedAt, now, 'movers');
  fresh(market?.generatedAt, now, 'market');
  const seen = new Set();
  const board = (rows, up) => {
    // One-sided markets are normal (e.g. a red day has one gainer): accept 0-5
    // rows per side and require five rows in total below.
    if (!Array.isArray(rows)) throw new Error('Mover board missing');
    return rows.map((r) => {
      if (!/^[A-Z0-9]{1,15}$/.test(r?.sym || '') || seen.has(r.sym)) throw new Error('Invalid or duplicate symbol');
      seen.add(r.sym);
      if (typeof r.change !== 'string' || !/^[+−-]?\d+(?:\.\d+)?%$/.test(r.change)) throw new Error('Invalid change');
      const change = Number(r.change.replace('−', '-').replace('%', ''));
      if (!Number.isFinite(change) || (up ? change <= 0 : change >= 0)) throw new Error('Invalid mover direction');
      return { sym: r.sym, change };
    }).sort((a, b) => up ? b.change - a.change : a.change - b.change).slice(0, 5);
  };
  const up = board(movers.up, true), down = board(movers.down, false);
  if (up.length + down.length < 5) throw new Error('At least five movers required');
  const liq = market?.liquidations?.h24;
  const total = numeric(liq?.totalUsd, '24h liquidations');
  let largest = null;
  if (liq.largest != null) {
    const item = liq.largest;
    if (!/^(?:(?:BINANCE|OKX):)?[A-Z0-9]{1,15}USDT$/i.test(item.symbol || '') || !['long', 'short'].includes(item.side)) throw new Error('Invalid largest liquidation');
    largest = { sym: item.symbol.split(':').at(-1).replace(/USDT$/i, '').toUpperCase(), side: item.side, usd: numeric(item.usd, 'largest liquidation') };
    if (largest.usd > total) throw new Error('Largest liquidation exceeds total');
  }
  fresh(market?.funding?.generatedAt, now, 'funding');
  const btc = market.funding.rows?.find((r) => r.symbol === 'BTC');
  const funding = ['binanceRate', 'okxRate'].map((key) => {
    const n = btc?.[key];
    if (n === null) return null;
    if (typeof n !== 'number' || !Number.isFinite(n) || Math.abs(n) > 0.05) throw new Error('Invalid BTC funding');
    return n;
  });
  if (funding.every((n) => n === null)) throw new Error('BTC funding unavailable');
  return { day: sgtDay(now), up, down, total, largest, funding,
    sourceTimes: { movers: movers.generatedAt, market: market.generatedAt, funding: market.funding.generatedAt } };
}
// X only: 2-4 hashtags (coins inline as cashtags, today's hot keyword, rotated evergreen), shared with ops/x-poster.
// `tagging` = { keywords, now } from keywordContext/dailyKeywords; without it the X text still gets 2 tags.
export function postText(data, locale, platform, tagging = null) {
  channelFor(locale);
  if (!['x', 'tg'].includes(platform)) throw new Error('Invalid platform');
  const zh = locale === 'zh-Hans';
  const url = `${SITE}/${zh ? 'zh-hans' : 'en'}?src=${platform}-daily`;
  const text = [zh ? `今日异动 · ${data.day} SGT` : `Today's movers · ${data.day} SGT`,
    [data.up[0] && `${zh ? '领涨' : 'Top gainer'} ${data.up[0].sym} ${pct(data.up[0].change)}`,
      data.down[0] && `${zh ? '领跌' : 'Top loser'} ${data.down[0].sym} ${pct(data.down[0].change)}`].filter(Boolean).join(' · '),
    zh ? `24h 已观测爆仓 ≥${money(data.total)}` : `24h observed liquidations ≥${money(data.total)}`, url].join('\n');
  if (weightedLength(text) > 280) throw new Error('Text exceeds X weighted limit');
  if (platform !== 'x') return text;
  const out = composeWithTags({ body: text, fit: null, max: 280, weightedLength, key: `daily-social:${data.day}`, locale,
    keywords: tagging?.keywords || [], extraTickers: [...data.up, ...data.down].map((r) => r.sym), now: tagging?.now ?? Date.parse(`${data.day}T01:00:00Z`) });
  return out.text;
}
// Card labels. zh-Hans glyphs come from the bundled Noto Sans SC subset (fonts/); symbols, numbers and venue names stay Inter.
export const CARD_LABELS = Object.freeze({
  en: { title: "Today's movers", gainers: (n) => n ? `TOP ${n} GAINERS · 24H` : 'GAINERS · 24H', losers: (n) => n ? `TOP ${n} LOSERS · 24H` : 'LOSERS · 24H',
    none: 'None in the tracked set', liquidations: (v) => `24h observed liquidations ≥${v}`, largest: (v) => `Largest single: ${v}`, noneObserved: 'None observed',
    side: { long: 'long', short: 'short' }, funding: (v) => `BTC funding / period: ${v}`, unavailable: 'unavailable' },
  'zh-Hans': { title: '今日异动', gainers: (n) => n ? `涨幅前 ${n} · 24H` : '涨幅 · 24H', losers: (n) => n ? `跌幅前 ${n} · 24H` : '跌幅 · 24H',
    none: '追踪范围内暂无', liquidations: (v) => `24 小时已观测爆仓 ≥${v}`, largest: (v) => `最大单笔：${v}`, noneObserved: '暂无',
    side: { long: '多单', short: '空单' }, funding: (v) => `BTC 资金费率 / 周期：${v}`, unavailable: '暂无' },
});
export const CJK_FONT = path.join(HERE, 'fonts/NotoSansSC-daily-subset.ttf');
const esc = (s) => String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
export function cardSvg(data, locale = 'en') {
  channelFor(locale);
  const L = CARD_LABELS[locale];
  const css = readFileSync(path.join(ROOT, 'pilot-01-prototype/src/styles/tokens.css'), 'utf8');
  const color = (key) => { const value = css.match(new RegExp(`--${key}:(#[0-9a-fA-F]{3,8})(?:;|})`))?.[1]; if (!value) throw new Error(`Missing brand token ${key}`); return value; };
  const logo = readFileSync(path.join(ROOT, 'pilot-01-prototype/public/brand/nexualpha/nexualpha-round.svg')).toString('base64');
  const text = (x, y, label, size = 26, fill = color('ink'), anchor = 'start') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${esc(label)}</text>`;
  const columns = [[data.up, 56, L.gainers, 'positive'], [data.down, 648, L.losers, 'danger']].map(([rows, x, title, key]) =>
    text(x, 209, title(rows.length), 18, color('muted')) +
    (rows.length ? '' : text(x, 255, L.none, 24, color('muted'))) + rows.map((r, i) => text(x, 255 + i * 49, `${i + 1}  ${r.sym}`, 28) + text(x + 490, 255 + i * 49, pct(r.change), 28, color(key), 'end')).join('')).join('');
  const largest = data.largest ? `${data.largest.sym} ${L.side[data.largest.side]} ${money(data.largest.usd)}` : L.noneObserved;
  const funding = data.funding.map((n, i) => `${['Binance', 'OKX'][i]} ${n === null ? L.unavailable : rate(n)}`).join(' / ');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="675" viewBox="0 0 1200 675">
  <rect width="1200" height="675" fill="${color('market')}"/>
  <g font-family="Inter, Noto Sans SC" font-weight="500"><image x="48" y="34" width="60" height="60" xlink:href="data:image/svg+xml;base64,${logo}"/>
  ${text(124, 73, 'NexuAlpha', 29)}${text(1144, 73, `${data.day} · SGT`, 22, color('muted'), 'end')}
  ${text(56, 150, L.title, 44)}
  <path d="M56 174H1144M608 199V470" stroke="${color('surface-3')}" stroke-width="2"/>${columns}
  <rect x="40" y="502" width="1120" height="137" rx="12" fill="${color('surface-2')}"/>
  ${text(56, 541, L.liquidations(money(data.total)), 28)}
  ${text(56, 579, L.largest(largest), 22, color('muted'))}
  ${text(56, 615, L.funding(funding), 22, color('muted'))}
  </g></svg>`;
}
export function renderCard(data, locale = 'en') {
  const { Resvg } = require('@resvg/resvg-js');
  return new Resvg(cardSvg(data, locale), { font: { loadSystemFonts: false, fontFiles: [path.join(ROOT, 'ops/shorts/fonts/InterVariable.ttf'), CJK_FONT], defaultFontFamily: 'Inter' } }).render().asPng();
}
const CARD_FILES = Object.freeze({ en: 'card.png', 'zh-Hans': 'card-zh-Hans.png' });
function writeSummary(file, summary) {
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(summary, null, 2) + '\n'); renameSync(tmp, file);
}
export function generate({ movers, market, now, out, tagging = null }) {
  const data = normalize(movers, market, now), dir = path.join(out, data.day);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const pngs = Object.fromEntries(Object.keys(CHANNELS).map((locale) => [locale, renderCard(data, locale)])), texts = {};
  for (const [locale, png] of Object.entries(pngs)) writeFileSync(path.join(dir, CARD_FILES[locale]), png);
  for (const locale of Object.keys(CHANNELS)) for (const platform of ['x', 'tg']) {
    const name = `${platform}-${locale}.txt`;
    texts[name] = postText(data, locale, platform, tagging);
    writeFileSync(path.join(dir, name), texts[name] + '\n');
  }
  const summary = { day: data.day, mode: 'dry-run', directory: dir, card: path.join(dir, CARD_FILES.en), width: 1200, height: 675,
    cards: Object.fromEntries(Object.entries(CARD_FILES).map(([locale, name]) => [locale, path.join(dir, name)])),
    texts: Object.fromEntries(Object.entries(texts).map(([name, text]) => [name, { file: path.join(dir, name), weightedLength: weightedLength(text) }])), sourceTimes: data.sourceTimes };
  writeSummary(path.join(dir, 'summary.json'), summary);
  return { summary, png: pngs.en, pngs, texts };
}
// Error text for logs: message plus the low-level cause (e.g. ECONNRESET), with tokens/OAuth values removed.
const describe = (e) => [e?.message ?? String(e), e?.cause?.code || e?.cause?.message].filter(Boolean).join(' / cause: ');
export function redact(message, secrets = []) {
  let out = String(message ?? '');
  for (const v of secrets) if (typeof v === 'string' && v.length >= 6) out = out.split(v).join('<redacted>');
  return out.replace(/(?<!\d)\d{5,}:[A-Za-z0-9_-]{25,}/g, '<redacted>')
    .replace(/(oauth_[a-z_]+=)"[^"]*"/g, '$1"<redacted>"').replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer <redacted>').slice(0, 600);
}
export async function postDaily({ bundle, stateDir, xLocale = 'en', client, telegramSend, secrets = [] }) {
  channelFor(xLocale);
  mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  const lockPath = path.join(stateDir, 'run.lock');
  // A reboot can leave the lock behind. Every transport is bounded and the
  // scheduler caps the full job at 120s; receipts survive a stale-lock cleanup.
  try { if (Date.now() - statSync(lockPath).mtimeMs > 10 * 60000) unlinkSync(lockPath); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const lock = openSync(lockPath, 'wx', 0o600);
  try {
    const file = path.join(stateDir, `${bundle.summary.day}.json`);
    let state;
    try { state = JSON.parse(readFileSync(file, 'utf8')); }
    catch (e) { if (e.code !== 'ENOENT') throw e; state = {}; }
    if (!state || typeof state !== 'object' || Array.isArray(state) || Object.entries(state).some(([k, v]) => !['x', 'zh-Hans', 'en'].includes(k) || !['pending', 'sent', 'unknown'].includes(v?.status))) throw new Error('Invalid daily journal');
    const save = () => { writeFileSync(`${file}.tmp`, JSON.stringify(state, null, 2), { mode: 0o600 }); renameSync(`${file}.tmp`, file); };
    const send = async (key, operation) => {
      if (state[key]) return; // Never retry a potentially delivered post.
      state[key] = { status: 'pending', at: new Date().toISOString() }; save();
      // Any failure stays 'unknown' (never auto-retried) but the journal and the error carry the redacted cause.
      const fail = (cause) => {
        const why = redact(cause, secrets);
        state[key] = { ...state[key], status: 'unknown', error: why }; save();
        throw new Error(`Daily ${key} delivery unconfirmed (${why}); inspect journal before retry`);
      };
      let result;
      try { result = await operation(); } catch (e) { fail(describe(e)); }
      if (!result?.ok || !result.id) fail(`send not confirmed: HTTP ${result?.status ?? 'n/a'}${result?.error ? ` ${result.error}` : ''}`);
      state[key] = { ...state[key], status: 'sent', id: result.id }; save();
    };
    const pngFor = (locale) => bundle.pngs?.[locale] ?? bundle.png;
    if (!state.x) {
      await client.verifyAccount();
      await send('x', async () => client.send(bundle.texts[`x-${xLocale}.txt`], [await client.uploadImage(pngFor(xLocale))]));
    }
    for (const locale of Object.keys(CHANNELS)) await send(locale, () => telegramSend(channelFor(locale), pngFor(locale), bundle.texts[`tg-${locale}.txt`]));
    return state;
  } finally { closeSync(lock); unlinkSync(lockPath); }
}
// The web /api/movers.json can be stale (2026-10-16..18 it froze on an old frame). When it is, rebuild the same board
// from the collector's market-events file with the site's own builder (coins.json universe), if that file is fresh.
export async function moversWithFallback({ movers, market, now, readCoins }) {
  const age = (v) => now - Date.parse(v?.generatedAt);
  const ok = (v) => v && v.stale !== true && Number.isFinite(age(v)) && age(v) >= 0 && age(v) <= MAX_SOURCE_AGE_MS;
  if (ok(movers)) return { movers, source: 'web' };
  if (!ok(market)) return { movers, source: 'web' }; // nothing better; normalize() reports the stale feed
  let coins = null;
  try { coins = await readCoins(); } catch { return { movers, source: 'web' }; }
  const snap = buildMoversSnapshot({ coins, marketEvents: market, now });
  return snap && snap.up.length + snap.down.length >= 5 ? { movers: snap, source: 'market-events-fallback' } : { movers, source: 'web' };
}
export function feedSources(env = {}) {
  const movers = env.DAILY_SOCIAL_MOVERS_URL || `${SITE}/api/movers.json`;
  if (!/^https?:\/\/[^/]+\/api\/movers\.json$/.test(movers)) throw new Error('DAILY_SOCIAL_MOVERS_URL must end in /api/movers.json');
  return { movers, market: `${SITE}/intel/market-events.json`, marketFile: env.DAILY_SOCIAL_MARKET_FILE || null };
}
const SECRETS = []; // filled only when --post loads credentials; used to scrub logged errors
export async function main(args = process.argv.slice(2), env = process.env) {
  const opts = { out: path.join(HERE, 'output'), xLocale: 'en' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--post') opts.post = true;
    else if (args[i] === '--dry-run') opts.dry = true;
    else if (args[i] === '--catch-up') opts.catchUp = true;
    else {
      const key = { '--fixture': 'fixture', '--out': 'out', '--at': 'at', '--x-locale': 'xLocale' }[args[i]];
      if (!key || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Usage: generate.mjs [--fixture FILE --at ISO] [--out DIR] [--catch-up] [--post] [--x-locale en|zh-Hans]');
      opts[key] = args[++i];
    }
  }
  if (opts.post && (opts.fixture || opts.at || opts.dry)) throw new Error('--post cannot use fixtures, an artificial clock or --dry-run');
  if (opts.at && !opts.fixture) throw new Error('--at requires --fixture');
  channelFor(opts.xLocale);
  const fixtureClock = opts.at ? Date.parse(opts.at) : null;
  if (fixtureClock !== null && !Number.isFinite(fixtureClock)) throw new Error('Invalid clock');
  if (opts.catchUp && !dailySlotDue(fixtureClock ?? Date.now())) return { day: sgtDay(fixtureClock ?? Date.now()), mode: 'not-due' };
  const get = async (url) => { const r = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000) }); if (!r.ok) throw new Error(`Feed fetch failed: ${new URL(url).pathname} HTTP ${r.status}`); return r.json(); };
  // Production reads the local origin (no public DNS/CDN cache): DAILY_SOCIAL_MARKET_FILE is the collector's state
  // file, DAILY_SOCIAL_MOVERS_URL the web container's loopback /api/movers.json. Unset = public site URLs.
  const sources = feedSources(env);
  const [movers, market] = opts.fixture ? (() => { const f = JSON.parse(readFileSync(opts.fixture, 'utf8')); return [f.movers, f.market]; })()
    : await Promise.all([get(sources.movers), sources.marketFile ? JSON.parse(readFileSync(sources.marketFile, 'utf8')) : get(sources.market)]);
  // A snapshot can be generated while its HTTP request is in flight. Compare
  // against the completion clock, not a time captured before the requests.
  const at = fixtureClock ?? Date.now();
  const board = opts.fixture ? { movers, source: 'fixture' }
    : await moversWithFallback({ movers, market, now: at, readCoins: () => get(env.DAILY_SOCIAL_COINS_URL || `${SITE}/intel/coins.json`) });
  // Today's keywords: fixtures stay offline and deterministic; production uses the X poster's sources (fail soft).
  const tagging = opts.fixture ? { keywords: dailyKeywords({ market }, at), now: at } : { ...(await keywordContext({ env, market, now: at })), now: at };
  const bundle = generate({ movers: board.movers, market, now: at, out: opts.out, tagging });
  bundle.summary.moversSource = board.source;
  if (tagging.keywords) bundle.summary.keywords = tagging.keywords.slice(0, 5).map((k) => k.key);
  if (opts.post) {
    if (!env.DAILY_SOCIAL_STATE_DIR) throw new Error('DAILY_SOCIAL_STATE_DIR required for --post');
    const botToken = token(env.BOT_ENV_FILE);
    if (!botToken) throw new Error('Community bot token missing');
    const credentials = loadCredentials(env.X_ENV_FILE);
    SECRETS.push(botToken, ...Object.values(credentials));
    const client = xClient(credentials);
    const deliveries = await postDaily({ bundle, stateDir: env.DAILY_SOCIAL_STATE_DIR, xLocale: opts.xLocale, client, secrets: SECRETS,
      telegramSend: (chat, png, caption) => sendPhoto(botToken, chat, png, caption) });
    bundle.summary.mode = 'post'; bundle.summary.deliveries = deliveries;
    writeSummary(path.join(bundle.summary.directory, 'summary.json'), bundle.summary);
  }
  console.log(JSON.stringify(bundle.summary));
  return bundle.summary;
}
export function failureLine(e, secrets = SECRETS, at = new Date()) {
  return `${at.toISOString()} Daily social generation/post failed: ${redact(describe(e), secrets)}. Inspect feeds, configuration and private journal. Unconfirmed deliveries are not replayed.`;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => {
  console.error(failureLine(e)); process.exitCode = 1;
});

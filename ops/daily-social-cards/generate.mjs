#!/usr/bin/env node
import { readFileSync, mkdirSync, writeFileSync, openSync, closeSync, unlinkSync, renameSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { weightedLength, loadCredentials, xClient } from '../x-poster/x-poster.mjs';
import { token, sendPhoto } from '../alert-sender/alert-sender.mjs';

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
const money = (n) => '$' + new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(n);
const pct = (n) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}%`;
const rate = (n) => `${n >= 0 ? '+' : '−'}${Math.abs(n * 100).toFixed(4)}%`;
const numeric = (v, name) => { if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) throw new Error(`Invalid ${name}`); return v; };
function fresh(at, now, name) {
  const t = Date.parse(at);
  if (!Number.isFinite(t) || t > now || now - t > 15 * 60000) throw new Error(`Missing, future or stale ${name}`);
}
export function normalize(movers, market, now) {
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
export function postText(data, locale, platform) {
  channelFor(locale);
  if (!['x', 'tg'].includes(platform)) throw new Error('Invalid platform');
  const zh = locale === 'zh-Hans';
  const url = `${SITE}/${zh ? 'zh-hans' : 'en'}?src=${platform}-daily`;
  const text = [zh ? `今日异动 · ${data.day} SGT` : `Today's movers · ${data.day} SGT`,
    [data.up[0] && `${zh ? '领涨' : 'Top gainer'} ${data.up[0].sym} ${pct(data.up[0].change)}`,
      data.down[0] && `${zh ? '领跌' : 'Top loser'} ${data.down[0].sym} ${pct(data.down[0].change)}`].filter(Boolean).join(' · '),
    zh ? `24h 已观测爆仓 ≥${money(data.total)}` : `24h observed liquidations ≥${money(data.total)}`, url].join('\n');
  if (weightedLength(text) > 280) throw new Error('Text exceeds X weighted limit');
  return text;
}
const esc = (s) => String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
export function cardSvg(data) {
  const css = readFileSync(path.join(ROOT, 'pilot-01-prototype/src/styles/tokens.css'), 'utf8');
  const color = (key) => { const value = css.match(new RegExp(`--${key}:(#[0-9a-fA-F]{3,8})(?:;|})`))?.[1]; if (!value) throw new Error(`Missing brand token ${key}`); return value; };
  const logo = readFileSync(path.join(ROOT, 'pilot-01-prototype/public/brand/nexualpha/nexualpha-round.svg')).toString('base64');
  const text = (x, y, label, size = 26, fill = color('ink'), anchor = 'start') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${esc(label)}</text>`;
  const columns = [[data.up, 56, 'GAINERS', 'positive'], [data.down, 648, 'LOSERS', 'danger']].map(([rows, x, title, key]) =>
    text(x, 209, rows.length ? `TOP ${rows.length} ${title} · 24H` : `${title} · 24H`, 18, color('muted')) +
    (rows.length ? '' : text(x, 255, 'None in the tracked set', 24, color('muted'))) + rows.map((r, i) => text(x, 255 + i * 49, `${i + 1}  ${r.sym}`, 28) + text(x + 490, 255 + i * 49, pct(r.change), 28, color(key), 'end')).join('')).join('');
  const largest = data.largest ? `${data.largest.sym} ${data.largest.side} ${money(data.largest.usd)}` : 'None observed';
  const funding = data.funding.map((n, i) => `${['Binance', 'OKX'][i]} ${n === null ? 'unavailable' : rate(n)}`).join(' / ');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="675" viewBox="0 0 1200 675">
  <rect width="1200" height="675" fill="${color('market')}"/>
  <g font-family="Inter" font-weight="500"><image x="48" y="34" width="60" height="60" xlink:href="data:image/svg+xml;base64,${logo}"/>
  ${text(124, 73, 'NexuAlpha', 29)}${text(1144, 73, `${data.day} · SGT`, 22, color('muted'), 'end')}
  ${text(56, 150, "Today's movers", 44)}
  <path d="M56 174H1144M608 199V470" stroke="${color('surface-3')}" stroke-width="2"/>${columns}
  <rect x="40" y="502" width="1120" height="137" rx="12" fill="${color('surface-2')}"/>
  ${text(56, 541, `24h observed liquidations ≥${money(data.total)}`, 28)}
  ${text(56, 579, `Largest single: ${largest}`, 22, color('muted'))}
  ${text(56, 615, `BTC funding / period: ${funding}`, 22, color('muted'))}
  </g></svg>`;
}
export function renderCard(data) {
  const { Resvg } = require('@resvg/resvg-js');
  return new Resvg(cardSvg(data), { font: { loadSystemFonts: false, fontFiles: [path.join(ROOT, 'ops/shorts/fonts/InterVariable.ttf')], defaultFontFamily: 'Inter' } }).render().asPng();
}
export function generate({ movers, market, now, out }) {
  const data = normalize(movers, market, now), dir = path.join(out, data.day);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const png = renderCard(data), texts = {};
  writeFileSync(path.join(dir, 'card.png'), png);
  for (const locale of Object.keys(CHANNELS)) for (const platform of ['x', 'tg']) {
    const name = `${platform}-${locale}.txt`;
    texts[name] = postText(data, locale, platform);
    writeFileSync(path.join(dir, name), texts[name] + '\n');
  }
  const summary = { day: data.day, mode: 'dry-run', directory: dir, card: path.join(dir, 'card.png'), width: 1200, height: 675,
    texts: Object.fromEntries(Object.entries(texts).map(([name, text]) => [name, { file: path.join(dir, name), weightedLength: weightedLength(text) }])), sourceTimes: data.sourceTimes };
  writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  return { summary, png, texts };
}
export async function postDaily({ bundle, stateDir, xLocale = 'en', client, telegramSend }) {
  channelFor(xLocale);
  mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  const lockPath = path.join(stateDir, 'run.lock');
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
      try {
        const result = await operation();
        if (!result?.ok || !result.id) throw new Error('Send not confirmed');
        state[key] = { ...state[key], status: 'sent', id: result.id }; save();
      } catch { state[key].status = 'unknown'; save(); throw new Error(`Daily ${key} delivery unconfirmed; inspect journal before retry`); }
    };
    if (!state.x) {
      await client.verifyAccount();
      await send('x', async () => client.send(bundle.texts[`x-${xLocale}.txt`], [await client.uploadImage(bundle.png)]));
    }
    for (const locale of Object.keys(CHANNELS)) await send(locale, () => telegramSend(channelFor(locale), bundle.png, bundle.texts[`tg-${locale}.txt`]));
    return state;
  } finally { closeSync(lock); unlinkSync(lockPath); }
}
export async function main(args = process.argv.slice(2), env = process.env) {
  const opts = { out: path.join(HERE, 'output'), xLocale: 'en' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--post') opts.post = true;
    else if (args[i] === '--dry-run') opts.dry = true;
    else {
      const key = { '--fixture': 'fixture', '--out': 'out', '--at': 'at', '--x-locale': 'xLocale' }[args[i]];
      if (!key || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Usage: generate.mjs [--fixture FILE --at ISO] [--out DIR] [--post] [--x-locale en|zh-Hans]');
      opts[key] = args[++i];
    }
  }
  if (opts.post && (opts.fixture || opts.at || opts.dry)) throw new Error('--post cannot use fixtures, an artificial clock or --dry-run');
  if (opts.at && !opts.fixture) throw new Error('--at requires --fixture');
  channelFor(opts.xLocale);
  const fixtureClock = opts.at ? Date.parse(opts.at) : null;
  if (fixtureClock !== null && !Number.isFinite(fixtureClock)) throw new Error('Invalid clock');
  const get = async (url) => { const r = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000) }); if (!r.ok) throw new Error(`Feed fetch failed: ${new URL(url).pathname} HTTP ${r.status}`); return r.json(); };
  const [movers, market] = opts.fixture ? (() => { const f = JSON.parse(readFileSync(opts.fixture, 'utf8')); return [f.movers, f.market]; })()
    : await Promise.all([get(`${SITE}/api/movers.json`), get(`${SITE}/intel/market-events.json`)]);
  // A snapshot can be generated while its HTTP request is in flight. Compare
  // against the completion clock, not a time captured before the requests.
  const bundle = generate({ movers, market, now: fixtureClock ?? Date.now(), out: opts.out });
  if (opts.post) {
    if (!env.DAILY_SOCIAL_STATE_DIR) throw new Error('DAILY_SOCIAL_STATE_DIR required for --post');
    const botToken = token(env.BOT_ENV_FILE);
    if (!botToken) throw new Error('Community bot token missing');
    const client = xClient(loadCredentials(env.X_ENV_FILE));
    const deliveries = await postDaily({ bundle, stateDir: env.DAILY_SOCIAL_STATE_DIR, xLocale: opts.xLocale, client,
      telegramSend: (chat, png, caption) => sendPhoto(botToken, chat, png, caption) });
    bundle.summary.mode = 'post'; bundle.summary.deliveries = deliveries;
    writeFileSync(path.join(bundle.summary.directory, 'summary.json'), JSON.stringify(bundle.summary, null, 2) + '\n');
  }
  console.log(JSON.stringify(bundle.summary));
  return bundle.summary;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(() => {
  console.error('Daily social generation/post failed; inspect feeds, configuration and private journal. No automatic retry.'); process.exitCode = 1;
});

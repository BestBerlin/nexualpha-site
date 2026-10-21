// Single-run X publisher. No dependencies, no retries of ambiguous requests.
import { createHmac, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, renameSync, openSync, closeSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { composeWithTags, dailyKeywords, readJsonSafe, CASHTAG } from './hashtags.mjs';

const SITE = 'https://nexualpha.com';
export const TELEGRAM_GROUP_URL = 'https://t.me/NexuAlphaGlobal';
const API = 'https://api.x.com/2';
const HOUR = 3600000;
const encode = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
export function oauthHeader(method, url, credentials, { nonce = randomBytes(18).toString('hex'), timestamp = Math.floor(Date.now() / 1000), form = {} } = {}) {
  const oauth = { oauth_consumer_key: credentials.consumerKey, oauth_nonce: nonce, oauth_signature_method: 'HMAC-SHA1', oauth_timestamp: String(timestamp), oauth_token: credentials.accessToken, oauth_version: '1.0' };
  const u = new URL(url);
  const pairs = [...u.searchParams, ...Object.entries(form), ...Object.entries(oauth)].map(([k, v]) => [encode(k), encode(v)]);
  pairs.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0);
  const base = [method.toUpperCase(), `${u.origin}${u.pathname}`, pairs.map((p) => p.join('=')).join('&')].map(encode).join('&');
  oauth.oauth_signature = createHmac('sha1', `${encode(credentials.consumerSecret)}&${encode(credentials.accessSecret)}`).update(base).digest('base64');
  return 'OAuth ' + Object.entries(oauth).sort().map(([k, v]) => `${encode(k)}="${encode(v)}"`).join(', ');
}

// Conservative domain detection also classifies bare domains as paid links. Protocol URLs
// and domains are indivisible when truncating. Do not use this to validate arbitrary URLs.
const urlPattern = /(?:https?:\/\/[^\s<>]+|(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?\.)+(?:[\p{L}]{2,63}|xn--[a-z0-9-]+)(?::\d+)?(?:[/?#][^\s<>]*)?)/giu;
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
function units(text) {
  text = String(text).normalize('NFC');
  const result = [];
  const chars = (s) => {
    for (const { segment } of segmenter.segment(s)) {
      const emoji = /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20e3/u.test(segment);
      const weight = emoji ? 2 : [...segment].reduce((n, c) => {
        const p = c.codePointAt(0);
        return n + (p <= 0x10ff || (p >= 0x2000 && p <= 0x200d) || (p >= 0x2010 && p <= 0x201f) || (p >= 0x2032 && p <= 0x2037) ? 1 : 2);
      }, 0);
      result.push({ text: segment, weight });
    }
  };
  let end = 0;
  for (const m of text.matchAll(urlPattern)) {
    chars(text.slice(end, m.index));
    const url = m[0].replace(/[.,!?;:。！？]+$/u, '');
    result.push({ text: url, weight: 23, url: true });
    chars(m[0].slice(url.length));
    end = m.index + m[0].length;
  }
  chars(text.slice(end));
  return result;
}
export const weightedLength = (text) => units(text).reduce((n, u) => n + u.weight, 0);
export const costClass = (text) => units(text).some((u) => u.url) ? 'link' : 'plain';
export function truncate(text, max = 280) {
  if (weightedLength(text) <= max) return text.normalize('NFC');
  let out = '', length = 0;
  for (const u of units(text)) {
    if (length + u.weight + weightedLength('…') > max) break;
    out += u.text; length += u.weight;
  }
  const boundary = [...out.matchAll(/[.!?](?=\s)|\s+/g)].at(-1);
  if (boundary && boundary.index > out.length / 2) out = out.slice(0, boundary.index + (/^[.!?]/.test(boundary[0]) ? 1 : 0));
  return out.trimEnd() + '…';
}
// Rebate/code/referral wording is never sent (owner rule: no commission talk, no disclaimer footers).
const partnerMention = (s) => /\brebates?\b|\bpartner (?:links?|codes?)\b|\breferral\b|\b(?:registration|invite|invitation|referral|promo|bonus) codes?\b|\bcommissions?\b|\bkickbacks?\b|\bcashback\b/i.test(s);
const unsafe = (s) => /\btax (?:avoidance|evasion|avoid\w*)\b|\bavoid\w* tax\b|\b(?:will|could|expected to|set to|predicted to) (?:rise|fall|rally|surge|crash|reach|hit)\b|\bprice (?:prediction|target)\b/i.test(s);
function clean(s) {
  return String(s).replace(/<[^>]*>/g, '').replace(urlPattern, '[URL omitted]').replace(/\s+/g, ' ').trim();
}
// Drop whole sentences that talk about rebates/codes/commission rather than adding a disclosure line.
const dropPartnerSentences = (s) => s.split(/(?<=[.!?。！？])\s+/).filter((x) => !partnerMention(x)).join(' ').trim();
function guard(text, { link = false } = {}) {
  if (unsafe(text)) throw new Error('content policy: prohibited wording');
  if ((text.match(CASHTAG) || []).length > 1) throw new Error('X allows one cashtag per post');
  if (!link && costClass(text) !== 'plain') throw new Error('plain post contains a URL');
  return text;
}
// Tag context: { keywords, extraTickers, now, locale, key }. Missing context still yields 2 tags.
function tagged(body, max, fit, ctx = {}, { link = false } = {}) {
  const out = composeWithTags({ body, fit, max, weightedLength, top: Boolean(ctx.top), key: ctx.key || '', locale: ctx.locale || 'en',
    keywords: ctx.keywords || [], extraTickers: ctx.extraTickers || [], now: ctx.now ?? Date.now() });
  guard(out.text, { link });
  if (weightedLength(out.text) > max) throw new Error('post exceeds weighted limit');
  return out.text;
}
export function englishArticles(feed) {
  if (!Array.isArray(feed?.articles)) throw new Error('invalid articles feed');
  const unique = new Map();
  for (const a of feed.articles) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a?.slug || '') ||
        (a.availableLocales && !a.availableLocales.includes('en')) ||
        (a.status && a.status !== 'PUBLISHED') || !a.title?.en?.trim() || !a.summary?.en?.trim() || !Number.isFinite(Date.parse(a.publishedAt))) continue;
    unique.set(a.slug, a);
  }
  return [...unique.values()].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.slug.localeCompare(b.slug));
}
export function articleMessage(a, max = 1200, ctx = {}) {
  const hook = truncate(clean(a.title.en).replace(/\?+$/, '.').replace(/\s*\([^)]*2026[^)]*\)$/, ''), 120);
  // Claude-authored summary and mapped claims supply the copy; no generated factual filler.
  const summary = dropPartnerSentences(clean(a.summary.en));
  const facts = (a.claims || []).filter((c) => c.sourceIds?.length && !c.sourceIds.some((id) => /partner/i.test(id)) && !partnerMention(c.text) && !unsafe(c.text)).map((c) => clean(c.text)).filter(Boolean).slice(0, 5);
  const raw = [hook, '', summary, '', ...facts.map((s) => `• ${s}`)].join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (unsafe(raw)) throw new Error('content policy: prohibited wording');
  const watch = '\n\nWhat to watch: follow the source updates and the data behind these findings.';
  const fit = (budget) => truncate(raw, budget - weightedLength(watch)) + watch;
  // Long (Premium) posts put the tag line under the hook so it shows before "Show more"; ≤280 posts keep it last.
  return tagged(fit(max), max, fit, { ...ctx, top: max > 280, key: ctx.key || `article:${a.slug}` });
}
export function linkMessage(a, ctx = {}) {
  const url = `${SITE}/news/${a.slug}?src=x`;
  const text = `${clean(a.title.en)}\n\n${dropPartnerSentences(clean(a.summary.en))}`.trim();
  if (unsafe(text)) throw new Error('content policy: prohibited wording');
  // The canonical URL is never truncated; tags follow it on the last line.
  // Owner 2026-10-22: every post that already carries a link also carries the Telegram group (one more URL costs nothing
  // extra: X bills per post). Plain posts stay link-free, so the daily budget is unchanged.
  const group = `Telegram: ${TELEGRAM_GROUP_URL}`;
  const fit = (budget) => `${truncate(text, budget - weightedLength(`\n${url}\n${group}`))}\n${url}\n${group}`;
  return tagged(fit(280), 280, fit, { ...ctx, key: ctx.key || `link:${a.slug}` }, { link: true });
}
const number = (n) => { if (!Number.isFinite(n)) throw new Error('missing market number'); return n; };
const usd = (n) => '$' + number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
const compact = (n) => '$' + (number(n) / 1e6).toFixed(2) + 'M';
const pct = (n) => `${number(n) >= 0 ? '+' : ''}${n.toFixed(2)}%`;
export function marketMessage(event, mk, ctx = {}) {
  const h1 = mk.liquidations.h1, h24 = mk.liquidations.h24;
  const headings = { 'sharp-move': clean(event.text), 'liquidation-spike': 'Liquidation spike', 'both-sides-liquidated': 'Longs and shorts liquidated' };
  if (!headings[event.type]) throw new Error('unsupported market event');
  const body = `${headings[event.type]}\nObserved liquidations:\n1h long ${compact(h1.longUsd)} / short ${compact(h1.shortUsd)}\n24h long ${compact(h24.longUsd)} / short ${compact(h24.shortUsd)}`;
  return tagged(guard(body), 280, null, { ...ctx, key: ctx.key || `market:${event.type}` });
}
export function dailyMessage(mk, ctx = {}) {
  const rows = ['NexuAlpha daily brief'];
  for (const symbol of ['BTC', 'ETH', 'SOL']) {
    const m = mk.market.majors.find((r) => r.symbol === `${symbol}USDT`);
    if (!m) throw new Error('missing daily major');
    rows.push(`${symbol} ${usd(m.price)} (${pct(m.change24hPct)} 24h)`);
  }
  const l = mk.liquidations.h24;
  rows.push(`24h observed liquidations: long ${compact(l.longUsd)} / short ${compact(l.shortUsd)}`);
  const mover = mk.market.movers?.[0];
  if (!mover) throw new Error('missing top mover');
  rows.push(`Top mover: ${mover.symbol.replace(/USDT$/, '')} ${pct(mover.change24hPct)}`);
  const text = rows.join('\n');
  if (weightedLength(text) > 280) throw new Error('daily brief exceeds 280; required numbers cannot be truncated');
  const movers = (mk.market.movers || []).map((m) => m.symbol);
  return tagged(guard(text), 280, null, { ...ctx, key: ctx.key || 'daily', extraTickers: [...(ctx.extraTickers || []), ...movers] });
}
export function config(env = process.env) {
  const integer = (key, fallback, min, max) => {
    const n = env[key] === undefined ? fallback : Number(env[key]);
    if (!Number.isInteger(n) || n < min || n > max) throw new Error(`invalid ${key}`);
    return n;
  };
  return { plain: integer('MAX_PLAIN_PER_DAY', 10, 0, 10000), link: integer('MAX_LINK_PER_DAY', 2, 0, 10000),
    max: integer('X_MAX_WEIGHTED', 1200, 280, 25000), maxAge: integer('X_MARKET_MAX_AGE_MS', 15 * 60000, 1, 3600000) };
}
export const newState = () => ({ version: 1, initialized: false, baseline: [], posts: {}, lastArticle: null, events: {}, days: {} });
export function validateState(s) {
  const obj = (x) => x && typeof x === 'object' && !Array.isArray(x);
  if (s?.version !== 1 || typeof s.initialized !== 'boolean' || !Array.isArray(s.baseline) || !s.baseline.every((x) => typeof x === 'string') ||
      !obj(s.posts) || !obj(s.events) || !obj(s.days) || !(s.lastArticle === null || Number.isFinite(s.lastArticle))) throw new Error('corrupt X state');
  for (const d of Object.values(s.days)) if (!obj(d) || !['plain', 'link'].every((k) => Number.isInteger(d[k]) && d[k] >= 0)) throw new Error('corrupt X budget');
  for (const t of Object.values(s.events)) if (!Number.isFinite(t)) throw new Error('corrupt X event state');
  for (const p of Object.values(s.posts)) if (!obj(p) || !['plain', 'link'].includes(p.costClass) || !['pending', 'sent', 'rejected', 'unknown'].includes(p.status)) throw new Error('corrupt X post state');
  return s;
}
export const budgetAvailable = (state, day, cls, cfg) => (state.days[day]?.[cls] || 0) < cfg[cls];
const priority = (a) => ({ 'market-event': 0, news: 1, tokenization: 2, explainer: 3, rwa: 2 }[a.type || a.category] ?? 1);
export function planPosts({ feed, market, state, now = Date.now(), cfg = config(), tagging = {} }) {
  validateState(state);
  const articles = englishArticles(feed).filter((a) => Date.parse(a.publishedAt) <= now);
  if (!state.initialized) return { baseline: articles.map((a) => a.slug), posts: [] };
  const day = new Date(now).toISOString().slice(0, 10), posts = [];
  const ctx = (key) => ({ keywords: tagging.keywords || [], extraTickers: tagging.extraTickers || [], now, locale: 'en', key });
  const freshMarket = Number.isFinite(Date.parse(market?.generatedAt)) && now >= Date.parse(market.generatedAt) && now - Date.parse(market.generatedAt) <= cfg.maxAge;
  if (freshMarket && new Date(now).getUTCHours() === 13 && !state.posts[`daily:${day}`]) posts.push({ key: `daily:${day}`, kind: 'daily', text: dailyMessage(market, ctx(`daily:${day}`)) });
  if (freshMarket) for (const ev of market.events || []) {
    if (ev.severity !== 'high' || !['sharp-move', 'liquidation-spike', 'both-sides-liquidated'].includes(ev.type) ||
        (state.events[ev.type] !== undefined && now - state.events[ev.type] < 3 * HOUR) || posts.some((p) => p.eventType === ev.type)) continue;
    posts.push({ key: `market:${ev.type}:${Math.floor(now / (3 * HOUR))}`, kind: 'market', eventType: ev.type, text: marketMessage(ev, market, ctx(`market:${ev.type}:${Math.floor(now / (3 * HOUR))}`)) });
  }
  const eligible = articles.filter((a) => !state.baseline.includes(a.slug));
  const article = eligible.find((a) => !state.posts[`article:${a.slug}`]);
  if (article && (state.lastArticle === null || now - state.lastArticle >= HOUR)) {
    const text = articleMessage(article, cfg.max, ctx(`article:${article.slug}`));
    posts.push({ key: `article:${article.slug}`, kind: 'article', text, ...(weightedLength(text) > 280 ? { fallbackText: articleMessage(article, 280, ctx(`article:${article.slug}`)) } : {}) });
  }
  const top = eligible.filter((a) => new Date(a.publishedAt).toISOString().slice(0, 10) === day).sort((a, b) => priority(a) - priority(b) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0];
  if (top && !state.posts[`link:${day}`]) posts.push({ key: `link:${day}`, kind: 'link', text: linkMessage(top, ctx(`link:${day}`)) });
  const counts = { plain: state.days[day]?.plain || 0, link: state.days[day]?.link || 0 };
  return { posts: posts.map((p) => ({ ...p, costClass: costClass(p.text), weightedLength: weightedLength(p.text) })).filter((p) => counts[p.costClass]++ < cfg[p.costClass]) };
}

// Reservations are durably written BEFORE any request. A timeout/crash is never retried:
// X create-post has no client idempotency key. This favors missed posts over duplicates.
export async function runCycle({ feed, market, state, now = Date.now(), cfg = config(), send, save, log = console.log, dryRun = false, tagging = {} }) {
  const plan = planPosts({ feed, market, state, now, cfg, tagging });
  if (plan.baseline) {
    log(JSON.stringify({ baselineArticles: plan.baseline.length, dryRun }));
    if (!dryRun) { state.baseline = plan.baseline; state.initialized = true; await save(state); }
    return;
  }
  const day = new Date(now).toISOString().slice(0, 10);
  for (const p of plan.posts) {
    if (dryRun) { log(JSON.stringify({ ...p, dryRun: true })); continue; }
    const attempt = async (text) => {
      const cls = costClass(text);
      if (!budgetAvailable(state, day, cls, cfg)) return null;
      state.days[day] ||= { plain: 0, link: 0 };
      state.days[day][cls]++;
      const previousAttempt = state.posts[p.key];
      state.posts[p.key] = { ...(previousAttempt ? { previousAttempt } : {}), status: 'pending', at: new Date(now).toISOString(), costClass: cls, weightedLength: weightedLength(text) };
      if (p.kind === 'article') state.lastArticle = now;
      if (p.eventType) state.events[p.eventType] = now;
      await save(state);
      let r;
      try { r = await send(text); }
      catch { r = { ok: false, ambiguous: true }; }
      const record = state.posts[p.key];
      record.status = r.ok ? 'sent' : r.ambiguous ? 'unknown' : 'rejected';
      if (r.id) record.id = r.id;
      if (r.status) record.httpStatus = r.status;
      await save(state);
      log(JSON.stringify({ key: p.key, ...record, estimatedCostUsd: cls === 'link' ? 0.20 : 0.015 }));
      return r;
    };
    const r = await attempt(p.text);
    // Explicit brief exception: one NEW, short payload only for a length-specific 403.
    if (r?.status === 403 && r.lengthRejected && p.kind === 'article' && p.weightedLength > 280 && p.fallbackText) {
      await attempt(p.fallbackText);
    }
    if (r && !r.ok) break; // stop this cycle on any error; never retry in later cycles
  }
}

export function loadCredentials(file) {
  if (!file) throw new Error('X_ENV_FILE required');
  const env = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  const credentials = { consumerKey: env.X_API_KEY || env.X_CONSUMER_KEY, consumerSecret: env.X_API_SECRET || env.X_API_KEY_SECRET || env.X_CONSUMER_SECRET,
    accessToken: env.X_ACCESS_TOKEN, accessSecret: env.X_ACCESS_TOKEN_SECRET };
  if (Object.values(credentials).some((v) => !v)) throw new Error('OAuth credentials missing in X_ENV_FILE');
  return credentials;
}
// Human-readable X API error (status text, detail, error messages) for logs. Never includes request headers.
export const apiDetail = (body) => [body?.title, body?.detail, ...(Array.isArray(body?.errors) ? body.errors.map((e) => e?.message || e?.detail) : [])]
  .filter((v) => typeof v === 'string' && v).join('; ').slice(0, 300);
export function xClient(credentials, fetcher = fetch) {
  const request = (method, endpoint, body) => fetcher(`${API}${endpoint}`, { method, redirect: 'error', signal: AbortSignal.timeout(30000),
    headers: { Authorization: oauthHeader(method, `${API}${endpoint}`, credentials), 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return {
    async uploadImage(png) {
      // Images only. Video must never use this path: any video upload has to pass ops/shorts/audio-gate.mjs
      // (assertAudible) first — owner rule 2026-10-14, no silent videos on any platform.
      if (!Buffer.isBuffer(png) && !(png instanceof Uint8Array)) throw new Error('X media upload refused: expected PNG bytes');
      if (!(png[0] === 0x89 && png[1] === 0x50 && png[2] === 0x4e && png[3] === 0x47)) throw new Error('X media upload refused: only PNG images go through uploadImage; videos need the audio gate');
      // Keep media on the scheduler's OAuth1 user credentials. Multipart fields
      // are excluded from the OAuth signature base (unlike form-urlencoded).
      const url = 'https://upload.twitter.com/1.1/media/upload.json';
      const form = new FormData();
      form.set('media', new Blob([png], { type: 'image/png' }), 'daily.png');
      form.set('media_category', 'tweet_image');
      const r = await fetcher(url, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
        headers: { Authorization: oauthHeader('POST', url, credentials) }, body: form });
      const body = await r.json().catch(() => null);
      if (!r.ok || !/^\d+$/.test(body?.media_id_string || '')) throw new Error(`X image upload failed: HTTP ${r.status}${apiDetail(body) ? ` ${apiDetail(body)}` : ''}`);
      return body.media_id_string;
    },
    async verifyAccount() {
      const r = await request('GET', '/users/me');
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(`X account verification failed: HTTP ${r.status}${apiDetail(data) ? ` ${apiDetail(data)}` : ''}`);
      if (data?.data?.username?.toLowerCase() !== 'nexualpha') throw new Error('X account verification failed; only @NexuAlpha allowed');
    },
    async send(text, mediaIds = []) {
      const r = await request('POST', '/tweets', { text, ...(mediaIds.length ? { media: { media_ids: mediaIds } } : {}) });
      let body; try { body = await r.json(); } catch { return { ok: false, status: r.status, ambiguous: r.ok || r.status >= 500 }; }
      const detail = [body.detail, body.title, ...(body.errors || []).map((e) => e.message || e.detail)].join(' ');
      return { ok: r.ok && Boolean(body.data?.id), id: body.data?.id, status: r.status, ambiguous: r.status >= 500 || (r.ok && !body.data?.id),
        ...(r.ok && body.data?.id ? {} : { error: apiDetail(body) || 'no post id returned' }),
        lengthRejected: r.status === 403 && /(?:text|tweet|post).*(?:too long|exceeds|length)|(?:too long|length).*(?:text|tweet|post)/i.test(detail) };
    },
  };
}
const HERE = path.dirname(fileURLToPath(import.meta.url));
// Fetch the day's keyword sources: /intel/calendar.json, /api/whales.json, newsroom top-events
// (host-synced copy in the state dir), keyword-radar snapshot (shipped next to this file) and
// CoinGecko trending. Any failure just drops that source; posting never depends on it.
export async function keywordContext({ env = process.env, market, now = Date.now(), fetcher = fetch } = {}) {
  const errors = [];
  const get = async (name, url, timeout = 10000) => {
    try { const r = await fetcher(url, { signal: AbortSignal.timeout(timeout) }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return await r.json(); }
    catch (e) { errors.push(`${name}: ${String(e?.message || e).slice(0, 80)}`); return null; }
  };
  const [calendar, whales, cg] = await Promise.all([get('calendar', `${SITE}/intel/calendar.json`), get('whales', `${SITE}/api/whales.json`),
    env.X_TRENDING === 'off' ? null : get('trending', 'https://api.coingecko.com/api/v3/search/trending', 8000)]);
  const topFile = env.X_TOP_EVENTS_FILE || (env.X_STATE_DIR ? path.join(env.X_STATE_DIR, 'top-events.json') : null);
  const topEvents = topFile ? readJsonSafe(topFile) : null;
  if (topFile && !topEvents) errors.push('top-events: unavailable');
  // Radar: the Mac's daily radar job pushes radar-terms.json into the state dir; the shipped copy is the fallback.
  const radarFiles = [env.X_RADAR_FILE, env.X_STATE_DIR && path.join(env.X_STATE_DIR, 'radar-terms.json'), path.join(HERE, 'radar-terms.json')].filter(Boolean);
  const radar = radarFiles.map(readJsonSafe).find((r) => r?.terms && typeof r.terms === 'object') || null;
  if (!radar) errors.push('radar: unavailable');
  const trending = Array.isArray(cg?.coins) ? cg.coins.map((c) => c?.item?.symbol).filter((x) => typeof x === 'string') : [];
  const keywords = dailyKeywords({ calendar, topEvents, whales, market, radar, trending }, now);
  const extraTickers = [...new Set([...(market?.market?.movers || []).map((m) => m.symbol), ...(whales?.rows || []).map((r) => r.coin)].filter((x) => typeof x === 'string'))];
  return { keywords, extraTickers, errors };
}
export async function main(args = process.argv.slice(2), env = process.env) {
  if (args.some((a) => !['--once', '--dry-run'].includes(a))) throw new Error('usage: x-poster.mjs [--once] [--dry-run]');
  const dryRun = args.includes('--dry-run'), cfg = config(env), dir = env.X_STATE_DIR;
  if (!dir) throw new Error('X_STATE_DIR required');
  const file = path.join(dir, 'state.json');
  let lock;
  if (!dryRun) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    try { lock = openSync(path.join(dir, 'run.lock'), 'wx', 0o600); }
    catch (e) { if (e.code === 'EEXIST') throw new Error('X run locked; check previous job before removing run.lock'); throw e; }
    writeFileSync(lock, String(process.pid));
  }
  try {
    let state;
    try { state = validateState(JSON.parse(readFileSync(file, 'utf8'))); }
    catch (e) { if (e.code === 'ENOENT') state = newState(); else throw e; }
    const json = async (url) => { const r = await fetch(url, { signal: AbortSignal.timeout(30000) }); if (!r.ok) throw new Error('public feed fetch failed'); return r.json(); };
    const [feed, market] = await Promise.all([json(`${SITE}/content/news-feed-summary.json`), json(`${SITE}/intel/market-events.json`)]);
    // No billable identity lookup when there is no eligible post (including baseline).
    const now = Date.now();
    const hasPosts = planPosts({ feed, market, state, cfg, now }).posts.length > 0;
    const client = dryRun || !hasPosts ? null : xClient(loadCredentials(env.X_ENV_FILE));
    if (client) await client.verifyAccount();
    // Keyword sources are fetched only when something may be posted (or previewed); all fail soft.
    const tagging = hasPosts || dryRun ? await keywordContext({ env, market, now }) : {};
    if (tagging.keywords) console.log(JSON.stringify({ keywords: tagging.keywords.slice(0, 6).map((k) => `${k.key}:${k.score}`), keywordSourceErrors: tagging.errors }));
    await runCycle({ feed, market, state, cfg, now, dryRun, tagging, send: (t) => client.send(t), save: (s) => {
      const tmp = `${file}.tmp`; writeFileSync(tmp, JSON.stringify(s, null, 2) + '\n', { mode: 0o600 }); renameSync(tmp, file);
    } });
  } finally {
    if (lock !== undefined) { closeSync(lock); unlinkSync(path.join(dir, 'run.lock')); }
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { console.error('X cycle failed; check configuration, account, feeds, state and lock. No automatic retry.'); process.exitCode = 1; });
}

// Single-run X publisher. No dependencies, no retries of ambiguous requests.
import { createHmac, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, renameSync, openSync, closeSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SITE = 'https://nexualpha.com';
const API = 'https://api.x.com/2';
const HOUR = 3600000;
const DISCLOSURE = 'Partner links disclosed.';
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
const partnerMention = (s) => /\brebates?\b|\bpartner(?:\s+(?:links?|codes?))?\b|\breferral\b|\b(?:registration |invite )?codes?\b/i.test(s);
const unsafe = (s) => /\btax (?:avoidance|evasion|avoid\w*)\b|\bavoid\w* tax\b|\b(?:will|could|expected to|set to|predicted to) (?:rise|fall|rally|surge|crash|reach|hit)\b|\bprice (?:prediction|target)\b/i.test(s);
function clean(s) {
  return String(s).replace(/<[^>]*>/g, '').replace(urlPattern, '[URL omitted]').replace(/\s+/g, ' ').trim();
}
function finish(text, max, { link = false, disclosure = false } = {}) {
  if (unsafe(text)) throw new Error('content policy: prohibited wording');
  const disclose = disclosure || partnerMention(text);
  const suffix = disclose ? `\n\n${DISCLOSURE}` : '';
  const out = truncate(text, max - weightedLength(suffix)) + suffix;
  if (!link && costClass(out) !== 'plain') throw new Error('plain post contains a URL');
  return out;
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
export function articleMessage(a, max = 1200) {
  const hook = truncate(clean(a.title.en).replace(/\?+$/, '.').replace(/\s*\([^)]*2026[^)]*\)$/, ''), 120);
  // Claude-authored summary and mapped claims supply the copy; no generated factual filler.
  const summary = clean(a.summary.en);
  const facts = (a.claims || []).filter((c) => c.sourceIds?.length && !c.sourceIds.some((id) => /partner/i.test(id)) && !partnerMention(c.text) && !unsafe(c.text)).map((c) => clean(c.text)).filter(Boolean).slice(0, 5);
  const lines = [hook, '', summary, '', ...facts.map((s) => `• ${s}`)];
  if (/liquidat/i.test(lines.join(' '))) lines.push('', 'NexuAlpha liquidation figures are lower bounds for the covered venues.');
  const watch = '\n\nWhat to watch: follow the source updates and the data behind these findings.';
  const tags = /bitcoin|\bBTC\b/i.test(hook + summary) ? '#Bitcoin #crypto' : /tokeniz/i.test(hook + summary) ? '#Tokenization #crypto' : '#crypto';
  const raw = lines.join('\n');
  const disclosure = partnerMention(raw) ? `\n\n${DISCLOSURE}` : '';
  if (unsafe(raw)) throw new Error('content policy: prohibited wording');
  let text = finish(truncate(raw, max - weightedLength(watch + disclosure)) + watch, max, { disclosure: Boolean(disclosure) });
  const suffix = text.endsWith(DISCLOSURE) ? `\n\n${DISCLOSURE}` : '';
  const body = suffix ? text.slice(0, -suffix.length) : text;
  if (weightedLength(`${body}\n\n${tags}${suffix}`) <= max) text = `${body}\n\n${tags}${suffix}`;
  return text;
}
export function linkMessage(a) {
  const url = `${SITE}/news/${a.slug}?src=x`;
  const text = `${clean(a.title.en)}\n\n${clean(a.summary.en)}`;
    if (unsafe(text)) throw new Error('content policy: prohibited wording');
  // Preserve the entire canonical URL and put disclosure last when needed.
  const disclosure = partnerMention(text) ? `\n${DISCLOSURE}` : '';
  return `${truncate(text, 280 - weightedLength(`\n${url}${disclosure}`))}\n${url}${disclosure}`;
}
const number = (n) => { if (!Number.isFinite(n)) throw new Error('missing market number'); return n; };
const usd = (n) => '$' + number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
const compact = (n) => '$' + (number(n) / 1e6).toFixed(2) + 'M';
const pct = (n) => `${number(n) >= 0 ? '+' : ''}${n.toFixed(2)}%`;
export function marketMessage(event, mk) {
  const h1 = mk.liquidations.h1, h24 = mk.liquidations.h24;
  const headings = { 'sharp-move': clean(event.text), 'liquidation-spike': 'Liquidation spike', 'both-sides-liquidated': 'Longs and shorts liquidated' };
  if (!headings[event.type]) throw new Error('unsupported market event');
  return finish(`${headings[event.type]}\nLiquidations (lower bound):\n1h long ${compact(h1.longUsd)} / short ${compact(h1.shortUsd)}\n24h long ${compact(h24.longUsd)} / short ${compact(h24.shortUsd)}`, 280);
}
export function dailyMessage(mk) {
  const rows = ['NexuAlpha daily brief'];
  for (const symbol of ['BTC', 'ETH', 'SOL']) {
    const m = mk.market.majors.find((r) => r.symbol === `${symbol}USDT`);
    if (!m) throw new Error('missing daily major');
    rows.push(`${symbol} ${usd(m.price)} (${pct(m.change24hPct)} 24h)`);
  }
  const l = mk.liquidations.h24;
  rows.push(`24h liquidations (lower bound): long ${compact(l.longUsd)} / short ${compact(l.shortUsd)}`);
  const mover = mk.market.movers?.[0];
  if (!mover) throw new Error('missing top mover');
  rows.push(`Top mover: ${mover.symbol.replace(/USDT$/, '')} ${pct(mover.change24hPct)}`);
  const text = rows.join('\n');
  if (weightedLength(text) > 280) throw new Error('daily brief exceeds 280; required numbers cannot be truncated');
  return finish(text, 280);
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
export function planPosts({ feed, market, state, now = Date.now(), cfg = config() }) {
  validateState(state);
  const articles = englishArticles(feed).filter((a) => Date.parse(a.publishedAt) <= now);
  if (!state.initialized) return { baseline: articles.map((a) => a.slug), posts: [] };
  const day = new Date(now).toISOString().slice(0, 10), posts = [];
  const freshMarket = Number.isFinite(Date.parse(market?.generatedAt)) && now >= Date.parse(market.generatedAt) && now - Date.parse(market.generatedAt) <= cfg.maxAge;
  if (freshMarket && new Date(now).getUTCHours() === 13 && !state.posts[`daily:${day}`]) posts.push({ key: `daily:${day}`, kind: 'daily', text: dailyMessage(market) });
  if (freshMarket) for (const ev of market.events || []) {
    if (ev.severity !== 'high' || !['sharp-move', 'liquidation-spike', 'both-sides-liquidated'].includes(ev.type) ||
        (state.events[ev.type] !== undefined && now - state.events[ev.type] < 3 * HOUR) || posts.some((p) => p.eventType === ev.type)) continue;
    posts.push({ key: `market:${ev.type}:${Math.floor(now / (3 * HOUR))}`, kind: 'market', eventType: ev.type, text: marketMessage(ev, market) });
  }
  const eligible = articles.filter((a) => !state.baseline.includes(a.slug));
  const article = eligible.find((a) => !state.posts[`article:${a.slug}`]);
  if (article && (state.lastArticle === null || now - state.lastArticle >= HOUR)) posts.push({ key: `article:${article.slug}`, kind: 'article', text: articleMessage(article, cfg.max) });
  const top = eligible.filter((a) => new Date(a.publishedAt).toISOString().slice(0, 10) === day).sort((a, b) => priority(a) - priority(b) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0];
  if (top && !state.posts[`link:${day}`]) posts.push({ key: `link:${day}`, kind: 'link', text: linkMessage(top) });
  const counts = { plain: state.days[day]?.plain || 0, link: state.days[day]?.link || 0 };
  return { posts: posts.map((p) => ({ ...p, costClass: costClass(p.text), weightedLength: weightedLength(p.text) })).filter((p) => counts[p.costClass]++ < cfg[p.costClass]) };
}

// Reservations are durably written BEFORE any request. A timeout/crash is never retried:
// X create-post has no client idempotency key. This favors missed posts over duplicates.
export async function runCycle({ feed, market, state, now = Date.now(), cfg = config(), send, save, log = console.log, dryRun = false }) {
  const plan = planPosts({ feed, market, state, now, cfg });
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
    if (r?.status === 403 && r.lengthRejected && p.kind === 'article' && p.weightedLength > 280) {
      await attempt(finish(p.text.replace(/\n\nPartner links disclosed\.$/, ''), 280, { disclosure: p.text.endsWith(DISCLOSURE) }));
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
export function xClient(credentials, fetcher = fetch) {
  const request = (method, endpoint, body) => fetcher(`${API}${endpoint}`, { method, redirect: 'error', signal: AbortSignal.timeout(30000),
    headers: { Authorization: oauthHeader(method, `${API}${endpoint}`, credentials), 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return {
    async verifyAccount() {
      const r = await request('GET', '/users/me');
      const data = await r.json();
      if (!r.ok || data?.data?.username?.toLowerCase() !== 'nexualpha') throw new Error('X account verification failed; only @NexuAlpha allowed');
    },
    async send(text) {
      const r = await request('POST', '/tweets', { text });
      let body; try { body = await r.json(); } catch { return { ok: false, status: r.status, ambiguous: r.ok || r.status >= 500 }; }
      const detail = [body.detail, body.title, ...(body.errors || []).map((e) => e.message || e.detail)].join(' ');
      return { ok: r.ok && Boolean(body.data?.id), id: body.data?.id, status: r.status, ambiguous: r.status >= 500 || (r.ok && !body.data?.id),
        lengthRejected: r.status === 403 && /(?:text|tweet|post).*(?:too long|exceeds|length)|(?:too long|length).*(?:text|tweet|post)/i.test(detail) };
    },
  };
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
    await runCycle({ feed, market, state, cfg, now, dryRun, send: (t) => client.send(t), save: (s) => {
      const tmp = `${file}.tmp`; writeFileSync(tmp, JSON.stringify(s, null, 2) + '\n', { mode: 0o600 }); renameSync(tmp, file);
    } });
  } finally {
    if (lock !== undefined) { closeSync(lock); unlinkSync(path.join(dir, 'run.lock')); }
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { console.error('X cycle failed; check configuration, account, feeds, state and lock. No automatic retry.'); process.exitCode = 1; });
}

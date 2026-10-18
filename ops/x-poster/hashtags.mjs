// Daily keyword set + per-post tag selection for @NexuAlpha. Pure and deterministic:
// the same inputs (sources, text, key, now) always give the same tags. No network here;
// x-poster.mjs/preview.mjs fetch the sources and pass them in. Every source is optional.
import { readFileSync } from 'node:fs';

// Curated coins: only these may become a #hashtag "hot keyword" (keeps random trending
// microcaps and scam tickers out). Cashtags in a post can also use coins that appear
// in our own market data (movers/whales) because those are exchange-listed.
export const COINS = Object.freeze({
  BTC: ['bitcoin'], ETH: ['ethereum', 'ether'], SOL: ['solana'], XRP: ['ripple'], BNB: [], DOGE: ['dogecoin'],
  ADA: ['cardano'], TRX: ['tron'], TON: ['toncoin'], AVAX: ['avalanche'], LINK: ['chainlink'], DOT: ['polkadot'],
  LTC: ['litecoin'], BCH: ['bitcoin cash'], SUI: [], NEAR: [], APT: ['aptos'], ARB: ['arbitrum'], OP: ['optimism'],
  HYPE: [], PEPE: [], SHIB: ['shiba inu'], UNI: ['uniswap'], AAVE: [], TAO: ['bittensor'], ZEC: ['zcash'], XMR: ['monero'],
  ENA: ['ethena'], ONDO: [], SEI: [], TIA: ['celestia'], INJ: ['injective'], WLD: ['worldcoin'], FIL: ['filecoin'],
  ATOM: ['cosmos'], HBAR: ['hedera'], XLM: ['stellar'], ETC: ['ethereum classic'], STRK: ['starknet'], PENGU: [],
  BGB: [], OKB: [], USDT: ['tether'], USDC: [],
});
const STABLES = new Set(['USDT', 'USDC']); // never worth a tag on their own
// Topic tags (not coins). `match` runs on post text; zh gives the Chinese-post form.
export const TOPICS = Object.freeze({
  FOMC: { tag: '#FOMC', match: /\bFOMC\b|\bFed(?:eral Reserve)?\b|\brate (?:cut|hike|decision)s?\b|美联储|议息/i },
  CPI: { tag: '#CPI', match: /\bCPI\b|\binflation\b|通胀/i },
  NFP: { tag: '#NFP', match: /\bNFP\b|\bnon-?farm\b|\bjobs report\b|非农/i },
  PCE: { tag: '#PCE', match: /\bPCE\b/ },
  ETF: { tag: '#ETF', match: /\bETFs?\b/i },
  Hyperliquid: { tag: '#Hyperliquid', match: /\bHyperliquid\b/i },
  TokenizedStocks: { tag: '#TokenizedStocks', zh: '#美股代币化', match: /\btokeni[sz]ed (?:stocks?|equit(?:y|ies)|shares)\b|\bxStocks\b|\bstock tokens?\b|代币化(?:美股|股票)|美股代币/i },
  NVDA: { tag: '#NVDA', match: /\bNVDA\b|\bNvidia\b|英伟达/i },
  TSLA: { tag: '#TSLA', match: /\bTSLA\b|\bTesla\b|特斯拉/i },
  RWA: { tag: '#RWA', match: /\bRWAs?\b|\breal[- ]world assets?\b/i },
  Stablecoins: { tag: '#Stablecoins', zh: '#稳定币', match: /\bstablecoins?\b|稳定币/i },
  Liquidations: { tag: '#Liquidations', zh: '#爆仓', match: /\bliquidations?\b|爆仓/i },
});
// Venue topic tags, in the owner's push order (Bitget > OKX > Binance), then others.
export const VENUES = Object.freeze([['Bitget', /\bBitget\b/i], ['OKX', /\bOKX\b/i], ['Binance', /\bBinance\b|币安/i],
  ['Bybit', /\bBybit\b/i], ['Gate', /\bGate(?:\.io)?\b(?= |$|[,.:;])/], ['HTX', /\bHTX\b/], ['KuCoin', /\bKuCoin\b/i], ['Kraken', /\bKraken\b/i], ['Coinbase', /\bCoinbase\b/i]]);
// Evergreen brand/category tags, rotated deterministically.
export const EVERGREEN = Object.freeze({ en: ['#crypto', '#Bitcoin', '#CryptoNews', '#Web3'], zh: ['#加密货币', '#比特币', '#crypto', '#CryptoNews'] });
// Never emitted, whatever the sources say (spam, gambling, giveaways, price calls, tax, sanctioned topics).
export const BANNED = /^(?:giveaway|airdrops?|freecrypto|100x|1000x|moon|tothemoon|lambo|pump|pumpanddump|gem|gems|signals?|casino|gambling|bet|nsfw|porn|tax|taxfree|scam|rugpull|presale|nft giveaway|pricepredictions?)$/i;
export const MAX_TAGS = 4, MIN_TAGS = 2;
// Coins that may carry the hot-keyword slot on a post that does not mention them.
export const HOT_MAJORS = new Set(['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE', 'HYPE']);

const MACRO = { fomc: 'FOMC', cpi: 'CPI', nfp: 'NFP', pce: 'PCE' };
const SGT = 8 * 3600000;
const sgtDay = (t) => Math.floor((t + SGT) / 86400000);
const symbolOf = (s) => String(s || '').toUpperCase().split(':').at(-1).replace(/(?:USDT|USDC|USD|PERP)$/, '');
const curated = (s) => Object.hasOwn(COINS, s) && !STABLES.has(s);
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.codePointAt(0), 16777619) >>> 0; return h; };
const bannedTag = (tag) => BANNED.test(tag.replace(/^[#$]/, ''));
// Aliases used to read free text (radar queries, event titles) into canonical keys.
const ALIASES = [
  ...Object.entries(COINS).flatMap(([sym, names]) => [[new RegExp(`(?:^|[^A-Za-z0-9$#])${sym}(?![A-Za-z0-9])`), sym], ...names.map((n) => [new RegExp(`\\b${n}\\b`, 'i'), sym])]),
  ...Object.entries(TOPICS).map(([k, t]) => [t.match, k]),
  [/\bbtc\b|比特币/i, 'BTC'], [/以太坊/, 'ETH'], [/狗狗币/, 'DOGE'],
];
export function termsIn(text) {
  const out = new Set();
  for (const [re, key] of ALIASES) if (re.test(text)) out.add(key);
  for (const s of STABLES) out.delete(s);
  return [...out];
}

/**
 * Daily keyword set. Inputs (all optional): calendar (/intel/calendar.json), topEvents
 * (newsroom top-events.json), whales (/api/whales.json), market (/intel/market-events.json),
 * radar (radar-terms.json snapshot), trending (array of symbols, e.g. CoinGecko trending).
 * Returns [{ key, score, sources }] sorted by score desc, key asc (deterministic).
 */
export function dailyKeywords({ calendar, topEvents, whales, market, radar, trending } = {}, now = Date.now()) {
  const score = new Map();
  const add = (key, n, source) => {
    if (!key || !Number.isFinite(n) || n <= 0 || (!curated(key) && !Object.hasOwn(TOPICS, key))) return;
    const cur = score.get(key) || { key, score: 0, sources: [] };
    cur.score += n; if (!cur.sources.includes(source)) cur.sources.push(source);
    score.set(key, cur);
  };
  add('BTC', 10, 'prior'); // fallback: there is always a hot keyword
  const today = sgtDay(now);
  for (const e of Array.isArray(calendar?.events) ? calendar.events : []) {
    const key = MACRO[e?.kind]; const t = Date.parse(e?.start);
    if (!key || !Number.isFinite(t)) continue;
    const d = sgtDay(t) - today;
    add(key, { [-1]: 90, 0: 160, 1: 130, 2: 70, 3: 50 }[d] || 0, 'calendar'); // macro days beat everyday coin chatter
    if (key === 'FOMC' && d >= 0 && d <= 7) add('FOMC', 20, 'calendar'); // FOMC week
  }
  for (const e of Array.isArray(topEvents?.events) ? topEvents.events.slice(0, 20) : []) {
    const weight = Math.max(5, Math.min(60, Number(e?.score?.editorial_score ?? e?.score) || 20));
    const asset = symbolOf(e?.story_asset ?? e?.asset);
    if (curated(asset)) add(asset, weight * 0.8, 'newsroom');
    const title = String(e?.title_internal ?? e?.title ?? '');
    for (const k of termsIn(`${title} ${e?.event_type || ''}`)) if (Object.hasOwn(TOPICS, k)) add(k, weight * 0.6, 'newsroom');
  }
  const whaleUsd = new Map(); let hl = 0;
  for (const r of Array.isArray(whales?.rows) ? whales.rows : []) {
    const usd = Number(r?.totalUsd ?? r?.sizeUsd ?? r?.positionUsd) || 0, sym = symbolOf(r?.coin);
    if (usd > 0 && curated(sym)) whaleUsd.set(sym, (whaleUsd.get(sym) || 0) + usd);
    if (/hyperliquid/i.test(`${r?.platform} ${r?.source}`)) hl += usd;
  }
  [...whaleUsd].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 3).forEach(([s], i) => add(s, [24, 16, 10][i], 'whales'));
  if (hl >= 50e6) add('Hyperliquid', 12, 'whales');
  for (const m of [...(market?.market?.majors || []), ...(market?.market?.movers || []).slice(0, 10)]) {
    const s = symbolOf(m?.symbol), ch = Math.abs(Number(m?.change24hPct) || 0);
    if (curated(s) && ch >= 3) add(s, Math.min(40, ch * 4), 'market');
  }
  const r24 = market?.liquidations?.h24?.totalUsd;
  if (Number(r24) >= 500e6) add('Liquidations', 30, 'market');
  const terms = radar?.terms && typeof radar.terms === 'object' ? radar.terms : {};
  for (const [k, n] of Object.entries(terms)) add(k, Math.min(20, 4 * Math.log2(1 + Number(n))), 'radar');
  (Array.isArray(trending) ? trending : []).slice(0, 10).forEach((s, i) => add(symbolOf(s), Math.max(4, 22 - 3 * i), 'trending'));
  return [...score.values()].map((v) => ({ ...v, score: Math.round(v.score * 100) / 100 }))
    .sort((a, b) => b.score - a.score || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

const tagFor = (key, locale, form = '#') => {
  if (Object.hasOwn(TOPICS, key)) return (locale === 'zh' && TOPICS[key].zh) || TOPICS[key].tag;
  return `${form}${key}`;
};
// Coins in the text: curated names/tickers, plus extra exchange-listed tickers (from our data) used as tickers.
export function coinsIn(text, extraTickers = []) {
  const found = [];
  const push = (sym, idx) => { if (idx >= 0 && !STABLES.has(sym) && !found.some((f) => f.sym === sym)) found.push({ sym, idx }); };
  for (const [sym, names] of Object.entries(COINS)) {
    const m = new RegExp(`(?:^|[^A-Za-z0-9$#/])(${sym})(?![A-Za-z0-9])`).exec(text);
    if (m) push(sym, m.index + m[0].length - sym.length);
    for (const n of names) { const i = text.search(new RegExp(`\\b${n}\\b`, 'i')); if (i >= 0) push(sym, i); }
    if (sym === 'BTC' && /比特币/.test(text)) push('BTC', text.indexOf('比特币'));
    if (sym === 'ETH' && /以太坊/.test(text)) push('ETH', text.indexOf('以太坊'));
  }
  for (const t of extraTickers) {
    const sym = symbolOf(t); if (!/^[A-Z][A-Z0-9]{1,9}$/.test(sym)) continue;
    const m = new RegExp(`(?:^|[^A-Za-z0-9$#/])(${sym})(?![A-Za-z0-9])`).exec(text);
    if (m) push(sym, m.index + m[0].length - sym.length);
  }
  // Earlier mention first; ties keep curated order.
  return found.sort((a, b) => a.idx - b.idx).map((f) => f.sym);
}

/**
 * Pick 2–4 tags for one post.
 * Returns { inline: [syms to turn into $SYM in the text], cashtags: [$SYM appended], hashtags: [...], all: [...] }.
 */
export function selectTags({ text, key = '', locale = 'en', keywords = [], extraTickers = [], now = Date.now() }) {
  const lang = locale.startsWith('zh') ? 'zh' : 'en';
  const used = new Set();
  const norm = (t) => t.replace(/^[#$]/, '').toLowerCase();
  const take = (t) => { if (!t || bannedTag(t) || used.has(norm(t))) return false; used.add(norm(t)); return true; };
  // 1) Topic tags tied to the content (max 2): coins first (cashtags), then topics, then one venue.
  const coins = coinsIn(text, extraTickers);
  const topics = [];
  for (const sym of coins) { if (topics.length >= 2) break; if (take(`$${sym}`)) topics.push({ coin: sym, tag: `$${sym}` }); }
  for (const [k, t] of Object.entries(TOPICS)) {
    if (topics.length >= 2) break;
    if (t.match.test(text) && take(tagFor(k, lang))) topics.push({ topic: k, tag: tagFor(k, lang) });
  }
  if (topics.length < 2) for (const [name, re] of VENUES) if (re.test(text)) { if (take(`#${name}`)) topics.push({ venue: name, tag: `#${name}` }); break; }
  // 2) The day's hottest keyword: prefer the highest-ranked daily keyword this post touches.
  const inPost = new Set([...coins, ...termsIn(text)]);
  const free = (k) => { const t = tagFor(k.key, lang); return !bannedTag(t) && !used.has(norm(t)); };
  const ranked = keywords.filter((k) => k && typeof k.key === 'string' && (curated(k.key) || Object.hasOwn(TOPICS, k.key)));
  // a) a top daily keyword this post touches; b) if the #1 keyword is already tagged here, that covers it;
  // c) otherwise the highest-ranked macro/topic/major keyword (never a random alt on an unrelated post).
  let pick = ranked.slice(0, 8).find((k) => inPost.has(k.key) && free(k));
  if (!pick && ranked[0] && !free(ranked[0])) pick = null;
  else if (!pick) pick = ranked.find((k) => (Object.hasOwn(TOPICS, k.key) || HOT_MAJORS.has(k.key)) && free(k));
  const hotTag = pick && take(tagFor(pick.key, lang)) ? tagFor(pick.key, lang) : null;
  // 3) One evergreen tag, rotated by day + post key; skip duplicates (#Bitcoin vs $BTC is fine, exact dupes are not).
  const pool = EVERGREEN[lang];
  const start = hash(`${sgtDay(now)}:${key}`) % pool.length;
  let ever = null;
  for (let i = 0; i < pool.length && !ever; i++) { const t = pool[(start + i) % pool.length]; if (take(t)) ever = t; }
  const all = [...topics.map((t) => t.tag), hotTag, ever].filter(Boolean);
  // Never fewer than MIN_TAGS: top up from the evergreen pool.
  for (let i = 0; all.length < MIN_TAGS && i < pool.length; i++) { const t = pool[(start + i) % pool.length]; if (take(t)) all.push(t); }
  all.splice(MAX_TAGS);
  return { topics, hot: hotTag, evergreen: ever, all };
}

// Turn the first plain mention of each coin ticker into a cashtag, in place. URLs untouched.
export function inlineCashtags(text, syms) {
  const done = [];
  let out = text;
  for (const sym of syms) {
    const re = new RegExp(`(^|[^A-Za-z0-9$#/.\\-])(${sym})(?![A-Za-z0-9])`);
    const m = re.exec(out);
    if (!m) continue;
    // Skip if the match sits inside a URL token.
    const before = out.slice(0, m.index + m[1].length), token = before.split(/\s/).at(-1);
    if (/https?:|\.\w+\//.test(token)) continue;
    out = `${before}$${sym}${out.slice(m.index + m[0].length)}`;
    done.push(sym);
  }
  return { text: out, inlined: done };
}

/**
 * Compose the final post: cashtags inline where the ticker already appears, everything else
 * on one trailing tag line. `fit(bodyBudget)` must return the body truncated to that weighted
 * budget (so URLs/required parts stay intact). Drops tags (never below MIN_TAGS) before
 * truncating bodies that cannot shrink. Returns { text, tags }.
 */
export function composeWithTags({ body, fit, max, weightedLength, ...sel }) {
  const chosen = selectTags({ text: body, ...sel });
  let tags = chosen.all;
  const coinTags = chosen.topics.filter((t) => t.coin).map((t) => t.coin);
  const build = (list, b) => {
    const inl = inlineCashtags(b, coinTags.filter((c) => list.includes(`$${c}`)));
    const trailing = list.filter((t) => !(t.startsWith('$') && inl.inlined.includes(t.slice(1))));
    return { text: trailing.length ? `${inl.text}\n\n${trailing.join(' ')}` : inl.text, tags: list };
  };
  for (;;) {
    let out = build(tags, body);
    if (weightedLength(out.text) <= max) return out;
    const lineLen = weightedLength(`\n\n${tags.join(' ')}`) + tags.filter((t) => t.startsWith('$')).length; // + '$' inline
    const shrunk = fit ? fit(max - lineLen) : null;
    if (shrunk != null) { out = build(tags, shrunk); if (weightedLength(out.text) <= max) return out; }
    if (tags.length <= MIN_TAGS) throw new Error('post cannot fit body plus minimum tags');
    // Drop the second topic first, then anything but hot + evergreen.
    const drop = tags.length > 3 ? 1 : 0;
    tags = tags.filter((_, i) => i !== drop);
  }
}

// Build the radar snapshot from a keyword-radar CSV (query column + priority).
export function radarTermsFromCsv(csv) {
  const lines = String(csv).split(/\r?\n/).filter(Boolean);
  const header = lines.shift()?.split(',') || [];
  const qi = header.indexOf('query'), pi = header.indexOf('priority');
  if (qi < 0) throw new Error('radar CSV missing query column');
  const terms = {};
  for (const line of lines) {
    const cols = line.split(',');
    const q = cols[qi] || '', w = Math.max(1, 4 - (Number(cols[pi]) || 3));
    for (const k of termsIn(q)) terms[k] = (terms[k] || 0) + w;
  }
  return Object.fromEntries(Object.entries(terms).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)));
}
export function readJsonSafe(file) {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
}

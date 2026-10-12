// Deterministic story identity. Missing facts never stand in for captured facts.
import coins from '../db/coin-universe.json' with { type: 'json' };
import { itemEntities, normalizeText, commonValues, trigramSimilarity } from './normalization.mjs';
const venues = ['binance', 'okx', 'bybit', 'bitget', 'coinbase', 'kucoin', 'kraken'];
const stop = new Set('will to the a an on in of for and with new trading pairs pair spot token tokens usd usdt usdc api utc ceo sec etf nft new will announcement support'.split(' '));
const tickerStop = new Set([...stop].filter(token => !['usdt', 'usdc'].includes(token)));
// Generic acronyms (regulators, places, finance jargon) are never asset tickers; treating them as tickers
// made two reports of one story "conflict" when only one mentioned e.g. the DOJ.
const acronymStop = new Set('us usa uk eu un hk sg uae sec cftc doj fbi irs fed fomc imf ecb boj pboc sfc mas fca esma mica bis occ fdic finra ceo cfo cto coo ai ipo etf etfs nft nfts dao api utc gmt otc kyc aml dex cex tvl ath atl cpi gdp ppi pce q1 q2 q3 q4 h1 h2 yoy qoq l1 l2 defi rwa ama faq breaking update new official live vip apy apr pos pow p2p'.split(' '));
const venueAliases = [['binance', /币安|幣安/u], ['okx', /欧易|歐易/u], ['bybit', /\bbybit\b/iu], ['bitget', /\bbitget\b/iu], ['coinbase', /\bcoinbase\b/iu], ['kucoin', /库币|庫幣/u], ['kraken', /\bkraken\b/iu]];
const LISTING_ACTIONS = new Set(['listing', 'delisting']);
const actions = [
  ['delisting', /\bdelist(?:s|ed|ing)?\b|下架|退市/iu],
  ['listing', /\blist(?:s|ed|ing)?\b|\bavailable for trading\b|\btrading (?:starts|opens)\b|上线|上線|上币|上幣/iu],
  ['withdrawal_resume', /(?:resum\w*|return\w*|restart\w*|恢复|恢復).{0,24}(?:withdraw|提款|提现|提現)|(?:withdraw\w*|提款|提现|提現).{0,24}(?:resum|return|restart|恢复|恢復)/iu],
  ['withdrawal_halt', /(?:suspend\w*|halt\w*|paus\w*|暂停|暫停).{0,24}(?:withdraw|提款|提现|提現)|(?:withdraw\w*|提款|提现|提現).{0,24}(?:suspend|halt|paus|暂停|暫停)/iu],
  ['hack_exploit', /\bhack\w*|\bexploit\w*|被盗|被盜|遭攻击|遭攻擊/iu],
  ['price_rise', /\b(?:surge|jump|rall|spik|gain)\w*|大涨|大漲|上涨|上漲/iu],
  ['price_fall', /\b(?:plunge|crash|drop|fall)\w*|大跌|下跌/iu],
  ['whale_transfer', /\btransfer\w*|转移|轉移|转账|轉賬/iu],
  ['enforcement', /\b(?:charges?|charged|enforcement|fines?|fined)\b|执法|執法|处罚|處罰/iu],
  ['lawsuit', /\b(?:sues?|sued|lawsuit|litigation)\b|诉讼|訴訟|起诉|起訴/iu],
  ['bankruptcy_filing', /\bbankrupt\w*|破产|破產/iu],
];
const same = (a, b) => a.length === b.length && a.every(value => b.includes(value));
export function storyFacts(item, watchlist = []) {
  const title = item.title ?? item.title_internal ?? '';
  const text = [title, item.excerpt, item.body_excerpt, item.bodyExcerpt].filter(Boolean).join(' ').normalize('NFKC');
  const normalized = normalizeText(text);
  const entities = itemEntities({ ...item, title: text }, watchlist);
  for (const venue of venues) if (new RegExp(`\\b${venue}\\b`, 'i').test(text) && !entities.includes(venue)) entities.push(venue);
  for (const [venue, re] of venueAliases) if (re.test(text) && !entities.includes(venue)) entities.push(venue);
  const tickers = new Set();
  for (const coin of coins) {
    const symbol = coin.symbol.toUpperCase();
    if (tickerStop.has(symbol.toLowerCase()) || acronymStop.has(symbol.toLowerCase())) continue;
    if (new RegExp(`(?:^|[^A-Za-z0-9])\\$?${symbol}(?:$|[^A-Za-z0-9])`).test(text)
      || (coin.name.length >= 5 && new RegExp(`\\b${coin.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text))) tickers.add(symbol);
  }
  for (const match of text.matchAll(/\(([A-Z][A-Z0-9]{1,11})\)|\$([A-Z][A-Z0-9]{1,11})\b|\b([A-Z][A-Z0-9]{1,11})(?:USDT|USDC|USD)\b/g)) {
    const symbol = match[1] ?? match[2] ?? match[3];
    if (!tickerStop.has(symbol.toLowerCase()) && !acronymStop.has(symbol.toLowerCase())) tickers.add(symbol);
  }
  for (const match of text.matchAll(/\b(?:lists?|delists?|listing|delisting)\s+([A-Z][A-Z0-9]{1,11})\b/gi)) if (match[1] === match[1].toUpperCase() && !tickerStop.has(match[1].toLowerCase())) tickers.add(match[1]);
  for (const m of text.matchAll(/\b([A-Z][A-Z0-9]{1,11})\s+(?:token|trading|withdraw|spot|perpetual)|(?:上线|上線|下架)\s*([A-Z][A-Z0-9]{1,11})/g)) {
    const symbol = m[1] ?? m[2];
    if (!tickerStop.has(symbol.toLowerCase()) && !acronymStop.has(symbol.toLowerCase())) tickers.add(symbol);
  }
  // Explicit uppercase symbols cover multi-asset listing announcements only; elsewhere they are mostly acronyms.
  if (actions.slice(0, 2).some(([, re]) => re.test(text))) {
    for (const m of text.matchAll(/\b[A-Z][A-Z0-9]{1,11}\b/g)) {
      const token = m[0].toLowerCase();
      if (!tickerStop.has(token) && !acronymStop.has(token) && !venues.includes(token)) tickers.add(m[0]);
    }
  }
  const dates = [...text.matchAll(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b|(20\d{2})年(\d{1,2})月(\d{1,2})日/g)].map(m => `${m[1] ?? m[4]}-${(m[2] ?? m[5]).padStart(2, '0')}-${(m[3] ?? m[6]).padStart(2, '0')}`);
  const amounts = [];
  const withoutDates = text.replace(/20\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2}日?/g, '');
  for (const m of withoutDates.matchAll(/(?:US\$|\$|USD\s*)?(\d[\d,]*(?:\.\d+)?)\s*((?:billion|million|thousand|bn|[mbk])(?![A-Za-z])|亿|億|万|萬)?\s*(%|美元|USD)?/gi)) {
    if (!m[2] && !m[3] && !/^(?:US\$|\$|USD)/i.test(m[0]) && !/^\s*(?:BTC|ETH|tokens?|coins?|users?|枚|人)\b/i.test(withoutDates.slice(m.index + m[0].length))) continue;
    const scale = { billion: 1e9, bn: 1e9, b: 1e9, million: 1e6, m: 1e6, thousand: 1e3, k: 1e3, 亿: 1e8, 億: 1e8, 万: 1e4, 萬: 1e4 }[m[2]?.toLowerCase()] ?? 1;
    amounts.push(`${Number(m[1].replaceAll(',', '')) * scale}${m[3] === '%' ? '%' : ''}`);
  }
  const action = actions.find(([, re]) => re.test(text))?.[0] ?? item.event_type_guess ?? item.event_type ?? 'unknown';
  return { entities: entities.sort(), venues: venues.filter(venue => entities.includes(venue)), action, tickers: [...tickers].sort(), amounts: [...new Set(amounts)].sort(), dates: [...new Set(dates)].sort(), normalized };
}
// "SEC sues X" and "SEC charges X" describe one legal action.
const actionFamily = action => (action === 'lawsuit' ? 'enforcement' : action);
const disjoint = (a, b) => a.length > 0 && b.length > 0 && !a.some(value => b.includes(value));
export function conflictingFacts(left, right) {
  if (left.action !== 'unknown' && right.action !== 'unknown' && actionFamily(left.action) !== actionFamily(right.action)) return true;
  if (disjoint(left.venues, right.venues) || disjoint(left.dates, right.dates)) return true;
  const pct = list => list.filter(value => value.endsWith('%'));
  const abs = list => list.filter(value => !value.endsWith('%'));
  if (disjoint(abs(left.amounts), abs(right.amounts)) || disjoint(pct(left.amounts), pct(right.amounts))) return true;
  // Listing/delisting notices are per-asset: any different symbol set is a different event.
  // Media reports of other stories often mention extra coins, so there only disjoint symbol sets conflict.
  const listing = LISTING_ACTIONS.has(left.action) || LISTING_ACTIONS.has(right.action);
  if (listing) return ['venues', 'tickers'].some(key => left[key].length && right[key].length && !same(left[key], right[key]));
  return disjoint(left.tickers, right.tickers);
}
export function titleSimilarity(left, right) {
  const tokens = value => new Set(normalizeText(value).split(' ').filter(v => v && !stop.has(v)));
  const a = tokens(left), b = tokens(right);
  const shared = [...a].filter(v => b.has(v)).length;
  return Math.max(trigramSimilarity(left, right), shared / Math.max(1, new Set([...a, ...b]).size));
}
export function factsMatch(left, right) {
  if (conflictingFacts(left, right) || !commonValues(left.entities, right.entities) || left.action === 'unknown' || actionFamily(left.action) !== actionFamily(right.action)) return false;
  // Cross-language attachment needs a captured discriminator beyond entity/action.
  return ['tickers', 'amounts', 'dates'].some(key => left[key].length && same(left[key], right[key]));
}

import defaultCoinUniverse from '../db/coin-universe.json' with { type: 'json' };
import { itemEntities, normalizeText, sourcePlatform } from './normalization.mjs';

const COLLIDING_SYMBOLS = new Set([
  'A', 'AI', 'AND', 'API', 'ARE', 'ARK', 'AS', 'AT', 'ATM', 'BANK', 'BEST', 'BIG', 'BIT', 'CAT', 'CEO',
  'CFO', 'COIN', 'DOG', 'FOR', 'GAS', 'GOLD', 'HOT', 'IN', 'IT', 'KEY', 'LAW', 'MAY', 'NEW', 'NO', 'NOT',
  'ONE', 'OPEN', 'OR', 'PAY', 'SEC', 'SET', 'STOCK', 'SUN', 'THE', 'TO', 'TON', 'TOP', 'TRY', 'US', 'USD',
  'W', 'WAR', 'WIN',
]);

const CRYPTO_CONTEXT = /\b(bitcoin|btc|ether|ethereum|eth|crypto|cryptocurrency|blockchain|web3|defi|dex|cex|perp|stablecoin|airdrop|wallet|staking|on-chain|onchain|usdt|usdc|solana|sol)\b|加密|区块链|區塊鏈|稳定币|穩定幣|代币|代幣/iu;
const CROSS_ASSET_CONTEXT = /\b(usd|dollar|rates?|fed|treasury|yield|gold|oil|fx|forex|cpi|inflation|etf|stock|shares|equity|earnings?|listed company|public company|bitcoin treasury|crypto treasury)\b|美元|利率|黄金|黃金|原油|上市公司|美股/iu;
const CROSS_ASSET_EVENT_CONTEXT = /\b(spike|surge|jump|rally|crash|plunge|fall|drop|selloff|cut|hike|record|breaks?|flows?|outflows?|inflows?|earnings|filing|holds?|buys?|sells?)\b|大涨|大跌|突破|下调|上调|流入|流出|持有|买入|賣出|卖出/iu;
const MARKET_CHANNEL_PATTERNS = [
  ['oil', /\b(oil|crude|brent|wti)\b|原油/iu],
  ['gold', /\b(gold|xau)\b|黄金|黃金/iu],
  ['rates', /\b(rates?|fed|treasury|yield|cpi|inflation)\b|利率/iu],
  ['fx', /\b(usd|dollar|fx|forex)\b|美元/iu],
  ['equity', /\b(stock|shares|equity|earnings?|listed company|public company)\b|上市公司|美股/iu],
];
const EXCHANGE_NAMES = new Set(['binance', 'okx', 'bybit', 'bitget', 'coinbase', 'kraken', 'gate', 'mexc', 'htx', 'backpack', 'hyperliquid']);
const CROSS_ASSET_TYPES = new Set(['fx_macro', 'equity_event', 'earnings_flows', 'crypto_treasury_company', 'politics_market']);
const CRYPTO_MARKET_TYPES = new Set(['price_move', 'liquidity_anomaly', 'stablecoin_depeg', 'flows', 'listing', 'delisting', 'product_launch', 'market_structure', 'whale_transfer', 'exchange_flow', 'institutional_trade', 'liquidation_wave', 'withdrawal_halt', 'hack_exploit', 'loss_repayment']);

function itemText(item) {
  return [item.title, item.body_excerpt, item.bodyExcerpt, item.author, item.author_account, item.authorAccount].filter(Boolean).join(' ');
}

function relevantWatchlistEntities(item, watchlist) {
  const ids = itemEntities(item, watchlist);
  const byId = new Map(watchlist.map(entity => [entity.id, entity]));
  return ids.map(id => byId.get(id) ?? { id }).filter(entity => {
    if (entity.status && entity.status !== 'active') return false;
    return entity.kind !== 'regulator' && entity.kind !== 'policy';
  });
}

function keywordMatches(text, keywords = [], watchlist = []) {
  const normalized = normalizeText(text);
  const byId = new Map(watchlist.map(entity => [entity.id, entity]));
  return keywords.filter(keyword => {
    if (keyword.status && keyword.status !== 'active') return false;
    const term = String(keyword.term ?? '').trim();
    if (!term || !normalized.includes(normalizeText(term))) return false;
    const entity = keyword.entity_id ? byId.get(keyword.entity_id) : null;
    return Boolean(entity && entity.kind !== 'regulator' && entity.kind !== 'policy') || CRYPTO_CONTEXT.test(term);
  });
}

function exchangeMatches(text, watchlist = []) {
  const normalized = normalizeText(text);
  const names = new Set(EXCHANGE_NAMES);
  for (const entity of watchlist) {
    if (entity.status && entity.status !== 'active') continue;
    if (entity.kind !== 'exchange') continue;
    for (const label of [entity.id, entity.display_name?.en, entity.display_name?.['zh-Hans'], ...(entity.aliases ?? [])].filter(Boolean)) {
      names.add(normalizeText(label));
    }
  }
  return [...names].filter(name => name && normalized.split(' ').includes(name));
}

function inferMarketChannel(text) {
  return MARKET_CHANNEL_PATTERNS.find(([, pattern]) => pattern.test(text))?.[0] ?? 'macro';
}

function coinMatches(text, coinUniverse = defaultCoinUniverse) {
  const raw = String(text ?? '');
  const normalized = normalizeText(raw);
  const tokens = new Set(normalized.split(' ').filter(Boolean));
  const matches = [];
  for (const coin of coinUniverse ?? []) {
    const symbol = String(coin.symbol ?? '').toUpperCase();
    const name = normalizeText(coin.name);
    if (name && name.length >= 5 && normalized.includes(name)) {
      matches.push(coin);
      continue;
    }
    if (!symbol || COLLIDING_SYMBOLS.has(symbol)) continue;
    const lower = symbol.toLowerCase();
    const pair = new RegExp(`\\b${symbol}(?:USDT|USDC|USD|BTC|ETH)\\b`);
    const marked = new RegExp(`[$#]${symbol}\\b`);
    const exactUpper = new RegExp(`\\b${symbol}\\b`);
    if (pair.test(raw) || marked.test(raw) || (symbol.length >= 3 && exactUpper.test(raw)) || (['BTC', 'ETH', 'SOL', 'XRP', 'BNB'].includes(symbol) && tokens.has(lower))) {
      matches.push(coin);
    }
  }
  return matches;
}

export function relevanceForItem(item, { watchlist = [], keywords = [], coinUniverse = defaultCoinUniverse } = {}) {
  const text = itemText(item);
  const platform = sourcePlatform(item);
  const eventType = item.event_type_guess ?? item.eventTypeGuess ?? item.event_type ?? item.eventType ?? null;
  const watchlistMatches = relevantWatchlistEntities(item, watchlist);
  const cryptoKeywords = keywordMatches(text, keywords, watchlist);
  const coins = coinMatches(text, coinUniverse);
  const exchanges = exchangeMatches(text, watchlist);
  const hasDirectCryptoContext = CRYPTO_CONTEXT.test(text);
  const hasCryptoContext = hasDirectCryptoContext || (CRYPTO_MARKET_TYPES.has(eventType) && ['exchange', 'onchain', 'market'].includes(platform));
  const hasCrossAssetMove = CROSS_ASSET_CONTEXT.test(text) && CROSS_ASSET_EVENT_CONTEXT.test(text);
  const hasCrossAssetScope = (CROSS_ASSET_TYPES.has(eventType) || !eventType || eventType === 'unknown') && hasCrossAssetMove;
  const inferredMarketChannel = hasCrossAssetScope ? (item.market_channel ?? item.marketChannel ?? inferMarketChannel(text)) : null;
  const relevant = Boolean(
    watchlistMatches.length ||
    coins.length ||
    exchanges.length ||
    hasDirectCryptoContext ||
    (cryptoKeywords.length && hasCryptoContext) ||
    hasCrossAssetScope
  );
  return {
    relevant,
    reasons: [
      ...watchlistMatches.map(entity => `watchlist:${entity.id}`),
      ...cryptoKeywords.map(keyword => `keyword:${keyword.term}`),
      ...coins.map(coin => `coin:${coin.symbol}`),
      ...exchanges.map(exchange => `exchange:${exchange}`),
      ...(hasDirectCryptoContext ? ['crypto-context'] : []),
      ...(hasCrossAssetScope ? ['owner-cross-asset-scope'] : []),
    ],
    inferred_event_type: hasCrossAssetScope && (!eventType || eventType === 'unknown') ? 'fx_macro' : null,
    inferred_market_channel: inferredMarketChannel,
  };
}

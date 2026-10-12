import { CollectorError, digest, normalizeItem, plain } from './common.mjs';

const FEED_ACCESS = new Set(['rss', 'rsshub']);
const BLOOMBERG_IDS = new Set(['bloomberg-markets-rss']);
const RSSHUB_DEFAULT_BASE = 'http://127.0.0.1:1200';
const DEFAULT_GOOGLE_NEWS_QUERY_LIMIT = 24;
const BLOOMBERG_CRYPTO_TERMS = [
  'bitcoin',
  'blockchain',
  'crypto',
  'ether',
  'ethereum',
  'stablecoin',
  'token',
];

const decodeEntities = value => String(value ?? '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (match, dec, hex, named) => {
    if (dec) return String.fromCodePoint(Number(dec));
    if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
    return ({
      amp: '&',
      apos: "'",
      gt: '>',
      lt: '<',
      nbsp: ' ',
      quot: '"',
    })[named.toLowerCase()] ?? match;
  });

const tagPattern = name => new RegExp(`<${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b[^>]*>([\\s\\S]*?)<\\/${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}>`, 'i');

function assertWellFormed(xml) {
  const source = String(xml ?? '').trim();
  if (!source) throw new Error('Malformed feed XML: empty document');
  if (!/<(?:rss|feed)\b/i.test(source)) throw new Error('Malformed feed XML: missing RSS or Atom root');
  const stack = [];
  const scan = source.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
  const tags = scan.matchAll(/<(?!\?xml\b|!--|!DOCTYPE\b|!doctype\b)(\/?)([A-Za-z_][\w:.-]*)([^<>]*?)(\/?)>/g);
  for (const match of tags) {
    const closing = Boolean(match[1]);
    const name = match[2].toLowerCase();
    const selfClosing = Boolean(match[4]) || /\/\s*$/.test(match[3]);
    if (selfClosing) continue;
    if (!closing) {
      stack.push(name);
      continue;
    }
    const last = stack.pop();
    if (last !== name) throw new Error(`Malformed feed XML: expected </${last ?? 'none'}> before </${name}>`);
  }
  if (stack.length) throw new Error(`Malformed feed XML: unclosed <${stack.at(-1)}>`);
}

function attrs(fragment) {
  const values = {};
  for (const match of String(fragment ?? '').matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    values[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? '');
  }
  return values;
}

function blocks(xml, name) {
  return [...String(xml ?? '').matchAll(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'gi'))].map(match => match[1]);
}

function child(block, names) {
  for (const name of names) {
    const match = String(block ?? '').match(tagPattern(name));
    if (match) return text(match[1]);
  }
  return null;
}

function atomAuthor(block) {
  const author = child(block, ['author']);
  if (!author) return null;
  const authorBlock = String(block ?? '').match(tagPattern('author'))?.[1] ?? '';
  return child(authorBlock, ['name', 'email', 'uri']) ?? author;
}

function atomLink(block) {
  let fallback = null;
  for (const match of String(block ?? '').matchAll(/<link\b([^>]*)\/?>/gi)) {
    const linkAttrs = attrs(match[1]);
    if (!linkAttrs.href) continue;
    if (!fallback) fallback = linkAttrs.href;
    if (!linkAttrs.rel || linkAttrs.rel === 'alternate') return linkAttrs.href;
  }
  return fallback;
}

function text(value) {
  return plain(decodeEntities(value).replace(/<[^>]*>/g, ' '));
}

function isoDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function externalId(item) {
  return item.guid || item.id || item.url || digest(`${item.title ?? ''}\n${item.published_at ?? ''}`).slice(0, 32);
}

function parseRssItem(block) {
  const url = child(block, ['link']);
  const item = {
    guid: child(block, ['guid']),
    url,
    title: child(block, ['title']),
    body_excerpt: child(block, ['description', 'content:encoded', 'media:description']),
    published_at: isoDate(child(block, ['pubDate', 'dc:date', 'published', 'updated'])),
    author: child(block, ['dc:creator', 'author', 'itunes:author']),
  };
  item.external_id = externalId(item);
  return item;
}

function parseAtomEntry(block) {
  const item = {
    id: child(block, ['id']),
    url: atomLink(block),
    title: child(block, ['title']),
    body_excerpt: child(block, ['summary', 'content']),
    published_at: isoDate(child(block, ['published', 'updated'])),
    author: atomAuthor(block),
  };
  item.external_id = externalId(item);
  return item;
}

export function parseFeed(xml) {
  assertWellFormed(xml);
  const source = String(xml);
  const itemBlocks = blocks(source, 'item');
  if (itemBlocks.length) return itemBlocks.map(parseRssItem).filter(item => item.url && item.title);
  const entryBlocks = blocks(source, 'entry');
  if (entryBlocks.length) return entryBlocks.map(parseAtomEntry).filter(item => item.url && item.title);
  return [];
}

function maxQueries(ctx) {
  const value = ctx.config?.google_news_max_queries ?? ctx.env?.NEWSROOM_GOOGLE_NEWS_MAX_QUERIES ?? DEFAULT_GOOGLE_NEWS_QUERY_LIMIT;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, 100) : DEFAULT_GOOGLE_NEWS_QUERY_LIMIT;
}

function markPartial(ctx, message) {
  ctx.partial = [ctx.partial, message].filter(Boolean).join('; ');
}

function termText(keyword) {
  return String(keyword?.term ?? '').trim();
}

function entityLabels(entity) {
  const display = entity.display_name ?? {};
  const names = [
    display.en,
    display['zh-Hans'],
    entity.id,
    entity.partner_slug,
    ...(entity.aliases ?? []),
  ].filter(Boolean).map(value => String(value).replace(/^@/, '').trim()).filter(Boolean);
  return [...new Set(names)].slice(0, 3);
}

function activeEntities(ctx) {
  return (ctx.entities ?? [])
    .filter(entity => !entity.status || entity.status === 'active')
    .sort((left, right) => (left.priority ?? 2) - (right.priority ?? 2) || String(left.id).localeCompare(String(right.id)));
}

function activeKeywords(ctx) {
  const byLang = new Map();
  for (const keyword of (ctx.keywords ?? [])
    .filter(keyword => (!keyword.status || keyword.status === 'active') && termText(keyword))
    .sort((left, right) => (right.weight ?? 1) - (left.weight ?? 1) || termText(left).localeCompare(termText(right)))) {
    const lang = keyword.lang ?? 'und';
    byLang.set(lang, [...(byLang.get(lang) ?? []), keyword]);
  }
  const langs = [...byLang.keys()].sort();
  const result = [];
  let index = 0;
  while (langs.some(lang => index < byLang.get(lang).length)) {
    for (const lang of langs) {
      const keyword = byLang.get(lang)[index];
      if (keyword) result.push(keyword);
    }
    index += 1;
  }
  return result;
}

function googleNewsUrls(source, ctx) {
  const limit = maxQueries(ctx);
  const keywords = activeKeywords(ctx);
  const entities = activeEntities(ctx);
  const urls = [];
  const pairs = [];
  for (const entity of entities) {
    for (const label of entityLabels(entity)) {
      for (const keyword of keywords) {
        pairs.push({ label, keyword });
      }
    }
  }
  if (!pairs.length) return [source.url];
  const rotation = Math.floor((ctx.now ?? new Date()).getTime() / 3600000) % pairs.length;
  const selected = Array.from({ length: Math.min(limit, pairs.length) }, (_, index) => pairs[(rotation + index) % pairs.length]);
  if (selected.length < pairs.length) markPartial(ctx, `Google News query window ${selected.length}/${pairs.length}; rotated hourly`);
  for (const { label, keyword } of selected) {
    const url = new URL('https://news.google.com/rss/search');
    url.searchParams.set('q', `"${label}" "${termText(keyword)}" when:1d`);
    if (keyword.lang) url.searchParams.set('hl', keyword.lang);
    urls.push(url.href);
  }
  return urls;
}

function matchTerms(ctx) {
  const terms = [
    ...activeEntities(ctx).flatMap(entityLabels),
    ...activeKeywords(ctx).map(termText),
  ].map(value => value.toLowerCase()).filter(Boolean);
  return [...new Set(terms)];
}

function matchesWatchlist(item, ctx) {
  const terms = matchTerms(ctx);
  if (!terms.length) return false;
  const haystack = `${item.title ?? ''} ${item.body_excerpt ?? ''}`.toLowerCase();
  return terms.some(term => haystack.includes(term.toLowerCase()));
}

function matchesBloombergCrypto(item, ctx) {
  const haystack = `${item.title ?? ''} ${item.body_excerpt ?? ''}`.toLowerCase();
  if (BLOOMBERG_CRYPTO_TERMS.some(term => haystack.includes(term))) return true;
  return activeEntities(ctx)
    .filter(entity => ['coin', 'exchange', 'project', 'stablecoin'].includes(entity.kind))
    .flatMap(entityLabels)
    .some(label => haystack.includes(label.toLowerCase()));
}

function telegramChannel(source) {
  if (source.verified_official !== true) return null;
  const candidate =
    source.channel ??
    source.account ??
    source.url?.match(/\/telegram\/channel\/([A-Za-z0-9_]+)\/?$/)?.[1] ??
    source.url?.match(/^https:\/\/t\.me\/s\/([A-Za-z0-9_]+)\/?$/)?.[1];
  return /^[A-Za-z0-9_]{5,32}$/.test(candidate ?? '') ? candidate : null;
}

function rsshubUrl(source, ctx) {
  const channel = telegramChannel(source);
  if (!channel) throw new CollectorError('RSSHub Telegram source is not a verified valid channel', 'partial');
  const base = new URL(ctx.env?.RSSHUB_BASE_URL ?? RSSHUB_DEFAULT_BASE);
  base.pathname = `/telegram/channel/${channel}`;
  base.search = '';
  return base.href;
}

function feedUrls(source, ctx) {
  if (source.platform === 'google_news') return googleNewsUrls(source, ctx);
  if (isTelegramFeed(source)) return [rsshubUrl(source, ctx)];
  return [source.url];
}

function isAfterSince(item, since) {
  if (!since || !item.published_at) return true;
  return new Date(item.published_at).getTime() > new Date(since).getTime();
}

export function supports(source) {
  if (!source || source.enabled === false) return false;
  if (source.platform === 'google_news' || source.platform === 'google_trends') return true;
  if (isTelegramFeed(source)) return Boolean(telegramChannel(source));
  if (source.access_method === 'rsshub') return false;
  if (source.status === 'missing-authorization') return FEED_ACCESS.has(source.access_method) && /^https?:\/\//.test(source.url ?? '');
  return FEED_ACCESS.has(source.access_method) && Boolean(source.url);
}

function isTelegramFeed(source) {
  return ['telegram', 'media'].includes(source?.platform) && ['rsshub', 'html'].includes(source?.access_method) && Boolean(telegramChannel(source));
}

export async function poll(source, since, ctx = {}) {
  if (!supports(source)) throw new CollectorError(`Unsupported feed source: ${source?.id ?? 'unknown'}`, 'partial');
  const rows = [];
  for (const url of feedUrls(source, ctx)) {
    let xml;
    let items;
    try {
      xml = await ctx.request(url, { format: 'text' });
      items = parseFeed(xml);
    } catch (error) {
      if (source.platform !== 'google_news') throw error;
      markPartial(ctx, 'Google News query failed');
      continue;
    }
    for (const item of items) {
      const candidate = {
        ...item,
        body_excerpt: BLOOMBERG_IDS.has(source.id) ? null : item.body_excerpt,
      };
      if (BLOOMBERG_IDS.has(source.id) && !matchesBloombergCrypto(item, ctx)) continue;
      if (source.platform === 'google_trends' && !matchesWatchlist(candidate, ctx)) continue;
      if (!isAfterSince(candidate, since)) continue;
      rows.push(normalizeItem(candidate, source, {
        entities: ctx.entities ?? [],
        keywords: ctx.keywords ?? [],
        now: ctx.now ?? new Date(),
      }));
    }
  }
  return rows;
}

import { CollectorError, plain } from './common.mjs';
import { parseFeed } from './feeds.mjs';
import { normalizeText } from '../lib/normalization.mjs';

const SEC_HEADERS = Object.freeze({ 'User-Agent': 'NexuAlpha newsroom ops@nexualpha.com' });

const RSS_SOURCES = Object.freeze(new Set([
  'sec-press',
  'sec-litigation',
  'cftc-rss',
  'esma-rss',
  'japan-fsa-rss',
  'fed-press-all',
]));

const LEGAL_SOURCES = Object.freeze(new Set([
  ...RSS_SOURCES,
  'courtlistener-search',
  'sec-edgar-full-text',
  'sec-edgar-submissions',
]));

const EDGAR_ALLOWED_FORMS = Object.freeze(new Set(['8-K', '10-Q', '10-K', 'S-1', '13F']));
const EDGAR_CRYPTO_TERMS = Object.freeze(['bitcoin', 'btc', 'ether', 'ethereum', 'stablecoin', 'digital asset', 'crypto', 'cryptocurrency', 'crypto treasury', 'blockchain']);

const ENDPOINTS = Object.freeze({
  'sec-press': { host: 'www.sec.gov', path: '/news/pressreleases.rss' },
  'sec-litigation': { host: 'www.sec.gov', path: '/enforcement-litigation/litigation-releases/rss' },
  'cftc-rss': { host: 'www.cftc.gov', path: '/RSS/RSSGP/rssgp.xml' },
  'esma-rss': { host: 'www.esma.europa.eu', path: '/rss.xml' },
  'japan-fsa-rss': { host: 'www.fsa.go.jp', path: '/fsaEnNewsList_rss2.xml' },
  'fed-press-all': { host: 'www.federalreserve.gov', path: '/feeds/press_all.xml' },
  'courtlistener-search': { host: 'www.courtlistener.com', path: '/api/rest/v4/search/' },
  'sec-edgar-full-text': { host: 'efts.sec.gov', path: '/LATEST/search-index' },
  'sec-edgar-submissions': { host: 'data.sec.gov', path: '/submissions/' },
});

export function supports(source) {
  return LEGAL_SOURCES.has(source?.id);
}

export async function poll(source, since = null, ctx = {}) {
  assertSource(source);
  const request = requestFromContext(ctx);
  const now = dateFromContext(ctx);
  const sinceMs = since == null ? null : dateMs(since);
  let items;
  if (RSS_SOURCES.has(source.id)) items = mapRss(await request(source.url, requestOptions(source, { format: 'text' })), source);
  else if (source.id === 'courtlistener-search') items = mapCourtListener(await request(courtListenerUrl(source.url, ctx), requestOptions(source)), source);
  else if (source.id === 'sec-edgar-full-text') items = mapEdgarFullText(await request(source.url, edgarSearchOptions(ctx, since)), source, ctx);
  else if (source.id === 'sec-edgar-submissions') items = await pollEdgarSubmissions(source, request, ctx);
  else throw new CollectorError(`Unsupported legal source: ${source.id}`);
  return items.filter(item => withinBounds(item, sinceMs, now));
}

async function pollEdgarSubmissions(source, request, ctx) {
  const entities = ctx.entities ?? [];
  const sourceCompany = filingCompanyFromSource(source);
  const explicit = filingCompaniesFromEntities(entities);
  let discovered = [];
  if (!sourceCompany) {
    const tickerRows = await request('https://www.sec.gov/files/company_tickers.json', requestOptions(source));
    discovered = matchCompanyTickers(tickerRows, entities);
  }
  const allCompanies = dedupeCompanies([sourceCompany, ...explicit, ...discovered].filter(Boolean));
  const companies = allCompanies.slice(0, 20);
  if (!companies.length) {
    markPartial(ctx, 'SEC submissions skipped: no watchlist companies resolved to CIK');
    return [];
  }
  if (allCompanies.length > companies.length) markPartial(ctx, `SEC submissions company polling capped ${companies.length}/${allCompanies.length}`);
  const out = [];
  for (const company of companies) {
    try {
      const url = sourceCompany ? source.url : `${submissionsBaseUrl(source.url)}${cikFile(company.cik)}`;
      const payload = await request(url, requestOptions(source));
      out.push(...mapEdgarSubmissions(payload, source, company));
    } catch (error) {
      markPartial(ctx, `SEC submissions company failed: ${company.cik}`);
    }
  }
  return out;
}

function mapRss(xml, source) {
  let rows;
  try {
    rows = parseFeed(xml);
  } catch (error) {
    throw new CollectorError(`${source.id} malformed RSS payload`);
  }
  return rows.map(row => buildItem({
    external_id: `${source.id}:${row.external_id}`,
    url: row.url,
    title: row.title,
    body_excerpt: row.body_excerpt,
    published_at: row.published_at,
    author: row.author ?? source.name,
    event_type_guess: eventTypeForSource(source, row),
  }, source)).filter(Boolean);
}

function mapCourtListener(payload, source) {
  if (!Array.isArray(payload?.results)) throw new CollectorError(`${source.id} malformed payload`);
  return payload.results.map(row => {
    const url = row.absolute_url
      ? new URL(row.absolute_url, 'https://www.courtlistener.com').href
      : row.docket_absolute_url
        ? new URL(row.docket_absolute_url, 'https://www.courtlistener.com').href
        : row.resource_uri
          ? new URL(row.resource_uri, 'https://www.courtlistener.com').href
          : null;
    const title = row.caseName ?? row.case_name ?? row.caption ?? row.docketNumber;
    const id = row.id ?? row.docket_id;
    return buildItem({
      external_id: id ? `courtlistener:${id}` : url,
      url,
      title,
      body_excerpt: row.snippet ?? row.suitNature ?? row.docketNumber,
      published_at: row.dateFiled ?? row.date_filed ?? row.dateCreated ?? row.date_created ?? row.meta?.timestamp ?? row.meta?.date_created,
      author: row.court ?? source.name,
      event_type_guess: legalEventType(`${title ?? ''} ${row.snippet ?? ''} ${row.suitNature ?? ''}`),
      metrics: {
        ...(payload.count == null ? {} : { result_count: payload.count }),
        ...(row.docket_id == null ? {} : { docket_id: row.docket_id }),
        ...(row.meta?.score?.bm25 == null ? {} : { bm25: row.meta.score.bm25 }),
      },
    }, source);
  }).filter(Boolean);
}

function mapEdgarFullText(payload, source, ctx = {}) {
  const hits = Array.isArray(payload?.hits?.hits) ? payload.hits.hits : Array.isArray(payload?.hits) ? payload.hits : null;
  if (!hits) throw new CollectorError(`${source.id} malformed payload`);
  return hits.filter(hit => {
    const row = hit?._source ?? hit;
    return allowedEdgarForm(row) && edgarRowInScope(row, ctx);
  }).map(hit => {
    const row = hit?._source ?? hit;
    const accession = row.adsh ?? row.accession_no ?? row.accessionNumber;
    const cik = firstValue(row.ciks ?? row.cik);
    return buildItem({
      external_id: accession ? `edgar-fts:${accession}` : hit?._id,
      url: row.url ?? filingUrl(cik, accession),
      title: [row.form, row.company_name ?? row.display_names?.[0] ?? row.entity, accession].filter(Boolean).join(' '),
      body_excerpt: edgarExcerpt(row),
      published_at: row.file_date ?? row.filing_date ?? row.period_ending,
      author: row.company_name ?? firstValue(row.display_names) ?? source.name,
      event_type_guess: edgarEventType(row),
      metrics: { ...(hit?._score == null ? {} : { search_score: hit._score }), form: row.form ?? row.file_type ?? null },
    }, source);
  }).filter(Boolean);
}

function mapEdgarSubmissions(payload, source, company) {
  const recent = payload?.filings?.recent;
  if (!recent || !Array.isArray(recent.accessionNumber)) throw new CollectorError(`${source.id} malformed submissions payload`);
  const out = [];
  for (let i = 0; i < recent.accessionNumber.length; i += 1) {
    if (!allowedEdgarForm({ form: recent.form?.[i] })) continue;
    const accession = recent.accessionNumber[i];
    out.push(buildItem({
      external_id: accession ? `edgar-submission:${accession}` : null,
      url: filingUrl(company.cik, accession),
      title: [company.name, recent.form?.[i], recent.primaryDocDescription?.[i] ?? recent.primaryDocument?.[i]].filter(Boolean).join(' '),
      body_excerpt: recent.items?.[i] ?? recent.primaryDocDescription?.[i] ?? null,
      published_at: recent.filingDate?.[i] ?? recent.acceptanceDateTime?.[i],
      author: company.name,
      event_type_guess: edgarEventType({ form: recent.form?.[i], items: recent.items?.[i], file_description: recent.primaryDocDescription?.[i], company_name: company.name }),
      metrics: { form: recent.form?.[i] ?? null, cik: company.cik },
    }, source));
  }
  return out.filter(Boolean);
}

function buildItem(item, source) {
  const title = plain(item.title).slice(0, 600);
  const url = officialUrl(item.url);
  const publishedAt = isoDate(item.published_at);
  if (!item.external_id || !url || !title || !publishedAt) return null;
  return {
    external_id: String(item.external_id),
    url,
    title,
    body_excerpt: item.body_excerpt ? plain(item.body_excerpt).slice(0, 600) : null,
    published_at: publishedAt,
    author: item.author ?? source.name,
    lang: 'en',
    event_type_guess: item.event_type_guess ?? null,
    ...(item.metrics ? { metrics: item.metrics } : {}),
  };
}

function requestOptions(source, options = {}) {
  return source.id.startsWith('sec-') ? { ...options, headers: { ...SEC_HEADERS, ...options.headers } } : options;
}

function edgarSearchOptions(ctx, since) {
  const query = legalQuery(ctx);
  const from = isoDate(since)?.slice(0, 10);
  return {
    method: 'POST',
    headers: { ...SEC_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: query,
      dateRange: from ? 'custom' : 'all',
      startdt: from,
      forms: [...EDGAR_ALLOWED_FORMS],
      from: 0,
      size: 50,
      sort: [{ file_date: { order: 'desc' } }],
    }),
  };
}

function allowedEdgarForm(row) {
  const authoritativeForms = [row?.form, row?.file_type].filter(Boolean).map(normalizeEdgarForm);
  if (authoritativeForms.length) return authoritativeForms.some(form => EDGAR_ALLOWED_FORMS.has(form));
  const rootForms = (Array.isArray(row?.root_forms) ? row.root_forms : [row?.root_forms]).filter(Boolean).map(normalizeEdgarForm);
  return rootForms.some(form => EDGAR_ALLOWED_FORMS.has(form));
}

function normalizeEdgarForm(form) {
  const value = String(form ?? '').toUpperCase().trim();
  return value.startsWith('13F') ? '13F' : value;
}

function edgarRowInScope(row, ctx) {
  return edgarRowMatchesWatchlistCompany(row, ctx.entities ?? []) || edgarRowMatchesCryptoKeyword(row, ctx.keywords ?? []);
}

function edgarRowMatchesWatchlistCompany(row, entities) {
  const ciks = new Set([...(Array.isArray(row?.ciks) ? row.ciks : [row?.ciks ?? row?.cik])]
    .filter(Boolean)
    .map(value => String(value).replace(/^0+/, ''))
    .filter(Boolean));
  const rowNames = [row?.company_name, firstValue(row?.display_names), row?.entity].filter(Boolean).map(normalizeText);
  for (const entity of entities ?? []) {
    if (entity?.status && entity.status !== 'active') continue;
    const cik = entity?.cik ?? entity?.cik_str ?? entity?.accounts?.sec_cik ?? entity?.accounts?.cik;
    if (cik && ciks.has(String(cik).replace(/^0+/, ''))) return true;
    const aliases = entityAliases(entity).map(normalizeText).filter(Boolean);
    if (rowNames.some(name => aliases.some(alias => name === alias || name.includes(alias)))) return true;
  }
  return false;
}

function edgarRowMatchesCryptoKeyword(row, keywords) {
  const text = edgarRowText(row).toLowerCase();
  const terms = new Set(EDGAR_CRYPTO_TERMS);
  for (const keyword of keywords ?? []) {
    if (keyword.status && keyword.status !== 'active') continue;
    const term = String(keyword.term ?? '').trim();
    if (term && EDGAR_CRYPTO_TERMS.some(cryptoTerm => normalizeText(term).includes(normalizeText(cryptoTerm)))) terms.add(term.toLowerCase());
  }
  return [...terms].some(term => text.includes(term));
}

function edgarRowText(row) {
  return [
    row?.form,
    row?.company_name,
    firstValue(row?.display_names),
    row?.entity,
    ...(Array.isArray(row?.items) ? row.items : [row?.items]),
    ...(Array.isArray(row?.root_forms) ? row.root_forms : [row?.root_forms]),
    row?.file_description,
    row?.highlight,
  ].filter(Boolean).join(' ');
}

function edgarExcerpt(row) {
  return [
    ...(Array.isArray(row?.items) ? row.items : [row?.items]),
    row?.file_description,
    row?.highlight,
  ].filter(Boolean).join(' ');
}

function courtListenerUrl(base, ctx) {
  const url = new URL(base);
  url.searchParams.set('q', legalQuery(ctx));
  url.searchParams.set('type', 'r');
  url.searchParams.set('order_by', 'dateFiled desc');
  return url.href;
}

function legalQuery(ctx) {
  const entityTerms = (ctx.entities ?? []).flatMap(entityAliases).slice(0, 24);
  const eventTerms = (ctx.keywords ?? [])
    .filter(row => row.status !== 'retired' && ['lawsuit', 'enforcement', 'regulation', 'bankruptcy_filing', 'crypto_treasury_company'].includes(row.event_type))
    .map(row => row.term)
    .filter(Boolean)
    .slice(0, 16);
  const terms = [...new Set([...entityTerms, ...eventTerms, 'bitcoin', 'ether', 'stablecoin', 'digital asset'])];
  return terms.map(term => /\s/.test(term) ? `"${term}"` : term).join(' OR ');
}

function filingCompaniesFromEntities(entities) {
  return entities.flatMap(entity => {
    const cik = entity?.cik ?? entity?.cik_str ?? entity?.accounts?.sec_cik ?? entity?.accounts?.cik;
    return cik ? [{ cik: String(cik).replace(/^0+/, ''), name: displayName(entity), ticker: entity?.ticker ?? entity?.accounts?.ticker ?? null }] : [];
  });
}

function filingCompanyFromSource(source) {
  const match = source.url.match(/\/submissions\/CIK(\d{10})\.json$/);
  return match ? { cik: match[1].replace(/^0+/, ''), name: source.name, ticker: null } : null;
}

function matchCompanyTickers(payload, entities) {
  const rows = Array.isArray(payload) ? payload : Object.values(payload ?? {});
  if (!rows.length) throw new CollectorError('SEC company ticker payload is malformed');
  const matchers = new Set((entities ?? []).flatMap(entity => entityAliases(entity).map(normalizeText)).filter(Boolean));
  return rows.filter(row => {
    const title = normalizeText(row.title ?? row.name);
    const ticker = normalizeText(row.ticker);
    return (title && matchers.has(title)) || (ticker && matchers.has(ticker));
  }).map(row => ({ cik: String(row.cik_str ?? row.cik).replace(/^0+/, ''), name: row.title ?? row.name, ticker: row.ticker ?? null })).filter(row => row.cik && row.name);
}

function dedupeCompanies(companies) {
  const byCik = new Map();
  for (const company of companies) if (company?.cik && !byCik.has(company.cik)) byCik.set(company.cik, company);
  return [...byCik.values()];
}

function entityAliases(entity) {
  return [
    entity?.id,
    entity?.ticker,
    entity?.symbol,
    entity?.partner_slug,
    entity?.display_name?.en,
    entity?.display_name?.['zh-Hans'],
    entity?.name,
    entity?.org,
    entity?.organization,
    entity?.legal_name,
    entity?.current_role,
    entity?.accounts?.ticker,
    entity?.accounts?.sec_ticker,
    ...(entity?.symbols ?? []),
    ...(entity?.topics ?? []),
    ...(entity?.aliases ?? []),
  ].filter(value => typeof value === 'string' && value.trim()).map(value => value.replace(/^@/, '').trim());
}

function displayName(entity) {
  return entity?.display_name?.en ?? entity?.name ?? entity?.id ?? String(entity?.cik ?? entity?.cik_str);
}

function eventTypeForSource(source, row) {
  const text = `${row.title} ${row.body_excerpt}`.toLowerCase();
  if (source.id === 'sec-litigation' || text.includes('litigation') || text.includes('charges')) return 'enforcement';
  if (text.includes('lawsuit') || text.includes('court')) return 'lawsuit';
  if (source.id === 'fed-press-all') return 'fx_macro';
  return 'regulation';
}

function legalEventType(textValue) {
  const text = String(textValue ?? '').toLowerCase();
  if (/\b(lawsuit|complaint|v\.|versus|litigation|docket)\b/.test(text)) return 'lawsuit';
  if (/\b(charges|charged|enforcement|settlement|penalty|sanction)\b/.test(text)) return 'enforcement';
  if (/\b(bankrupt|chapter 11|insolvency)\b/.test(text)) return 'bankruptcy_filing';
  return null;
}

function edgarEventType(row) {
  const text = [
    row?.form,
    row?.company_name,
    firstValue(row?.display_names),
    row?.items,
    row?.root_forms,
    row?.file_description,
    row?.highlight,
  ].filter(Boolean).join(' ').toLowerCase();
  if (/\b(bitcoin|btc|ether|ethereum|stablecoin|digital asset|crypto treasury|cryptocurrency)\b/.test(text)) return 'crypto_treasury_company';
  if (/\b(bankrupt|chapter 11|insolvency)\b/.test(text)) return 'bankruptcy_filing';
  if (/\b(lawsuit|litigation|complaint)\b/.test(text)) return 'lawsuit';
  return null;
}

function assertSource(source) {
  if (!supports(source)) throw new CollectorError(`Unsupported legal source: ${source?.id ?? 'unknown'}`);
  const expected = ENDPOINTS[source.id];
  let url;
  try {
    url = new URL(source.url);
  } catch {
    throw new CollectorError(`${source.id} endpoint is not a valid URL`);
  }
  const pathOk = source.id === 'sec-edgar-submissions'
    ? url.pathname === expected.path || /^\/submissions\/CIK\d{10}\.json$/.test(url.pathname)
    : url.pathname === expected.path;
  if (url.hostname !== expected.host || !pathOk) {
    throw new CollectorError(`${source.id} endpoint does not match registry contract`);
  }
}

function requestFromContext(ctx) {
  if (typeof ctx.request !== 'function') throw new CollectorError('Collector context is missing request(url, options)');
  return ctx.request;
}

function dateFromContext(ctx) {
  const date = ctx.now instanceof Date ? ctx.now : ctx.now ? new Date(ctx.now) : new Date();
  if (!Number.isFinite(date.getTime())) throw new CollectorError('Collector context now is invalid');
  return date;
}

function withinBounds(item, sinceMs, now) {
  const ms = dateMs(item.published_at);
  return ms != null && (sinceMs == null || ms > sinceMs) && ms <= now.getTime() + 60 * 60 * 1000;
}

function isoDate(value) {
  const ms = dateMs(value);
  return ms == null ? null : new Date(ms).toISOString();
}

function dateMs(value) {
  if (value == null || value === '') return null;
  const date = new Date(Number.isFinite(Number(value)) && String(value).trim() !== '' ? Number(value) : value);
  const ms = date.getTime();
  return Number.isFinite(ms) && ms > 0 ? ms : null;
}

function officialUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value), 'https://www.sec.gov');
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function submissionsBaseUrl(value) {
  const url = new URL(value);
  url.pathname = '/submissions/';
  url.search = '';
  url.hash = '';
  return url.href;
}

function markPartial(ctx, message) {
  ctx.partial = [ctx.partial, message].filter(Boolean).join('; ');
}

function cikFile(cik) {
  return `CIK${String(cik).padStart(10, '0')}.json`;
}

function filingUrl(cik, accession) {
  if (!cik || !accession) return null;
  const compact = String(accession).replace(/-/g, '');
  return `https://www.sec.gov/Archives/edgar/data/${String(cik).replace(/^0+/, '')}/${compact}/${accession}-index.html`;
}

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

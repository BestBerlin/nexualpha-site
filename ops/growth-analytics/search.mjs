import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { createSign } from 'node:crypto';

export async function privateEnv(name, privateDir = path.join(homedir(), '.codex/private')) {
  try {
    return Object.fromEntries((await readFile(path.join(privateDir, name), 'utf8')).split('\n')
      .map(line => line.trim()).filter(line => line && !line.startsWith('#') && line.includes('='))
      .map(line => { const cut = line.indexOf('='); return [line.slice(0, cut).trim(), line.slice(cut + 1).trim().replace(/^(['"])(.*)\1$/, '$2')]; }));
  } catch { return {}; }
}
const shift = (date, days) => new Date(Date.parse(`${date}T12:00:00Z`) + days * 864e5).toISOString().slice(0, 10);
const number = value => Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
export function cohorts(query) {
  const q = String(query).toLowerCase();
  return Object.entries({
    brand: /nexualpha|nexu alpha|nexuα/,
    referral: /邀请码|返佣|返利|referral|referido|referans|реферал|giới thiệu|hoàn phí|rebate/,
    tokenizedStocks: /tokeni[sz]ed stock|tokeni[sz]ed equit|股票代币|代币化股票|xstocks|\b(?:aapl|tsla|nvda|spy|qqq)x\b/,
    deposit: /deposit|入金|充值|出金|出入金|withdraw|on.?ramp|fiat|nạp tiền|para yatır|depósito|setor|tarik/,
    exchangeHowTo: /regist|sign.?up|signup|kyc|verif|注册|認證|认证|实名|kayıt|daftar|cadastr|đăng ký|login|2fa|passkey|api key|api doc|join/,
  }).filter(([, regex]) => regex.test(q)).map(([name]) => name);
}
export function summarize(rows) {
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const positioned = rows.filter(row => row.position !== null);
  const positionImpressions = positioned.reduce((sum, row) => sum + row.impressions, 0);
  return { impressions, clicks, ctr: impressions ? clicks / impressions : null,
    position: positionImpressions ? positioned.reduce((sum, row) => sum + row.impressions * row.position, 0) / positionImpressions : null };
}
export function normalizeRows(rows, engine) {
  return rows.map(row => {
    const impressions = number(engine === 'gsc' ? row.impressions : row.Impressions);
    const clicks = number(engine === 'gsc' ? row.clicks : row.Clicks);
    const rawPosition = engine === 'gsc' ? row.position : row.AvgImpressionPosition;
    const query = String(engine === 'gsc' ? row.keys?.[0] || '' : row.Query || '');
    return { query, page: engine === 'gsc' ? row.keys?.[1] || null : null,
      providerDate: engine === 'bing' ? row.Date || null : null, impressions, clicks,
      ctr: impressions ? clicks / impressions : null,
      position: number(rawPosition) > 0 ? number(rawPosition) : null, cohorts: cohorts(query) };
  }).filter(row => row.query);
}
// Striking distance = positions 8-20. Money cohorts are P1; any other row with >=2 impressions is P2 so a
// young site with no money-query impressions still gets a non-empty, evidence-backed review queue.
export function contentTasks(sources, { limit = 60 } = {}) {
  return Object.entries(sources).flatMap(([engine, source]) => (source.rows || [])
    .filter(row => row.position >= 8 && row.position <= 20 && row.impressions > 0 && (row.cohorts.length || row.impressions >= 2))
    .map(row => ({ engine, query: row.query, page: row.page, cohorts: row.cohorts, priority: row.cohorts.length ? 'P1' : 'P2', metrics: summarize([row]), window: source.window,
      status: row.page ? 'READY_FOR_CONTENT_REVIEW' : 'NEEDS_LANDING_PAGE_EVIDENCE',
      title: `Review title against the exact intent: ${row.query}`,
      meta: 'Clarify the supported benefit and constraints; do not invent incentives, freshness, or official status.',
      intro: 'Answer the query in the opening paragraph, cite current primary evidence, and preserve neutral comparison.',
      acceptance: ['Verify the landing page and existing intent owner before editing.', 'Review title, meta description, and intro together.', 'Human/content review required before publication; no automated live edits.'] })))
    .sort((a, b) => a.priority.localeCompare(b.priority) || b.metrics.impressions - a.metrics.impressions)
    .slice(0, limit);
}
async function jsonRequest(url, options, fetchImpl) {
  const response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(25_000) });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  return response.json();
}
// API contract: https://developers.google.com/webmaster-tools/v1/searchanalytics/query
export async function fetchGsc({ startDate, endDate, privateDir, fetchImpl = fetch }) {
  const env = await privateEnv('gsc-api.env', privateDir);
  if (!env.GOOGLE_APPLICATION_CREDENTIALS) return { status: 'unavailable', reason: 'GSC_CREDENTIALS_MISSING', rows: [] };
  const key = JSON.parse(await readFile(env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  const b64 = object => Buffer.from(JSON.stringify(object)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const assertion = `${payload}.${createSign('RSA-SHA256').update(payload).sign(key.private_key, 'base64url')}`;
  const auth = await jsonRequest('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }) }, fetchImpl);
  if (!auth.access_token) throw new Error('AUTH_NO_TOKEN');
  const rows = [];
  for (let startRow = 0; ; startRow += 25000) {
    const data = await jsonRequest('https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Anexualpha.com/searchAnalytics/query', {
      method: 'POST', headers: { authorization: `Bearer ${auth.access_token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, dataState: 'final', dimensions: ['query', 'page'], rowLimit: 25000, startRow }),
    }, fetchImpl);
    rows.push(...(data.rows || []));
    if ((data.rows || []).length < 25000) break;
  }
  return { status: 'ok', window: { startDate, endDate, type: 'requested-final-data', timeZone: 'America/Los_Angeles' }, rows: normalizeRows(rows, 'gsc'), limitation: 'Query/page rows omit anonymized and provider-truncated queries; totals below cover returned rows only.' };
}
// Only siteUrl is accepted: https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi.getquerystats
export async function fetchBing({ privateDir, fetchImpl = fetch } = {}) {
  const env = await privateEnv('bing-webmaster-api.env', privateDir);
  if (!env.BING_WEBMASTER_API_KEY) return { status: 'unavailable', reason: 'BING_CREDENTIALS_MISSING', rows: [] };
  const url = new URL('https://ssl.bing.com/webmaster/api.svc/json/GetQueryStats');
  url.searchParams.set('apikey', env.BING_WEBMASTER_API_KEY);
  url.searchParams.set('siteUrl', 'https://nexualpha.com/');
  const json = await jsonRequest(url, {}, fetchImpl);
  if (!Array.isArray(json.d)) throw new Error('BING_INVALID_RESPONSE');
  return { status: 'ok', window: { type: 'provider-native-buckets', requestedStartDate: null, requestedEndDate: null }, rows: normalizeRows(json.d, 'bing'),
    limitation: 'GetQueryStats has no requested date window or landing page dimension. Preserve each providerDate; do not compare its totals to the GSC window as like-for-like.' };
}
export async function runSearch({ date, outputDir, gscClient = fetchGsc, bingClient = fetchBing }) {
  const endDate = shift(date, -3), startDate = shift(endDate, -27);
  const sources = {};
  await Promise.all(Object.entries({ gsc: gscClient, bing: bingClient }).map(async ([engine, client]) => {
    try { sources[engine] = await client({ startDate, endDate }); }
    catch (error) { sources[engine] = { status: 'unavailable', reason: /^HTTP_\d+$/.test(error.message) ? error.message : 'REQUEST_OR_CREDENTIAL_ERROR', rows: [] }; }
    if (sources[engine].status === 'ok') {
      sources[engine].returnedRowsTotals = summarize(sources[engine].rows);
      sources[engine].cohorts = Object.fromEntries(['brand', 'referral', 'tokenizedStocks', 'deposit', 'exchangeHowTo'].map(name => [name, summarize(sources[engine].rows.filter(row => row.cohorts.includes(name)))]));
    }
  }));
  const status = Object.values(sources).every(source => source.status === 'ok') ? 'ok' : Object.values(sources).some(source => source.status === 'ok') ? 'partial' : 'unavailable';
  const result = { schema: 'nexualpha.growth-search.v1', status, date, sources, cohortNote: 'Cohorts overlap; do not sum their totals.', tasks: contentTasks(sources) };
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, `search-${date}.json`), JSON.stringify(result, null, 2) + '\n');
  await writeFile(path.join(outputDir, `content-tasks-${date}.json`), JSON.stringify({ date, tasks: result.tasks }, null, 2) + '\n');
  return result;
}

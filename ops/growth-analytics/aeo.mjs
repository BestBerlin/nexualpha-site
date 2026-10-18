import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// A new versioned set; historical weekly question sets and evidence stay intact.
export const MONEY_QUERY_VERSION = '2026-10-15.v1';
export const MONEY_QUERIES = [
  {
    "id": "okx-referral-code",
    "query": "best OKX referral code",
    "lang": "en",
    "targetPath": "/exchanges/okx"
  },
  {
    "id": "okx-vs-binance-fees",
    "query": "OKX vs Binance fees",
    "lang": "en",
    "targetPath": "/compare/binance-vs-okx"
  },
  {
    "id": "bitget-referral-rebate",
    "query": "Bitget referral code rebate",
    "lang": "en",
    "targetPath": "/exchanges/bitget"
  },
  {
    "id": "binance-vs-bybit-cheaper",
    "query": "Binance vs Bybit which is cheaper",
    "lang": "en",
    "targetPath": "/compare/binance-vs-bybit"
  },
  {
    "id": "bitget-signup-referral",
    "query": "how to sign up on Bitget with a referral code",
    "lang": "en",
    "targetPath": "/exchanges/bitget"
  },
  {
    "id": "mexc-vs-bybit-kyc",
    "query": "MEXC vs Bybit KYC",
    "lang": "en",
    "targetPath": "/compare/bybit-vs-mexc"
  },
  {
    "id": "lowest-perp-fees",
    "query": "which exchange has the lowest perp fees",
    "lang": "en",
    "targetPath": "/derivatives"
  },
  {
    "id": "bitget-cafe-official",
    "query": "is bitget.cafe an official Bitget domain",
    "lang": "en",
    "targetPath": "/exchanges/bitget"
  },
  {
    "id": "tr-okx-referans-nerede",
    "query": "okx referans kodu nerede yazar",
    "lang": "tr",
    "targetPath": "/tr/exchanges/okx"
  },
  {
    "id": "tr-okx-kayit",
    "query": "okx tr nasıl kayıt olunur",
    "lang": "tr",
    "targetPath": "/tr/exchanges/okx"
  },
  {
    "id": "vi-okx-ma-gioi-thieu",
    "query": "mã giới thiệu okx lấy ở đâu",
    "lang": "vi",
    "targetPath": "/vi/exchanges/okx"
  },
  {
    "id": "vi-okx-dang-ky",
    "query": "cách đăng ký okx",
    "lang": "vi",
    "targetPath": "/vi/exchanges/okx"
  },
  {
    "id": "vi-okx-hoan-phi",
    "query": "okx có hoàn phí giao dịch không",
    "lang": "vi",
    "targetPath": "/vi/exchanges/okx"
  },
  {
    "id": "es-okx-codigo-referido",
    "query": "okx codigo de referido",
    "lang": "es",
    "targetPath": "/es/exchanges/okx"
  },
  {
    "id": "es-okx-registrarse",
    "query": "como registrarse en okx",
    "lang": "es",
    "targetPath": "/es/exchanges/okx"
  },
  {
    "id": "es-okx-confiable-mexico",
    "query": "okx es confiable en mexico",
    "lang": "es",
    "targetPath": "/mx"
  },
  {
    "id": "ru-bybit-komissii",
    "query": "bybit комиссии за торговлю",
    "lang": "ru",
    "targetPath": "/ru/exchanges/bybit"
  },
  {
    "id": "id-bitget-ojk",
    "query": "bitget terdaftar di ojk",
    "lang": "id",
    "targetPath": "/id-id/exchanges/bitget"
  },
  {
    "id": "binance-referral",
    "query": "Binance referral code trading fee discount",
    "targetPath": "/exchanges/binance",
    "lang": "en"
  },
  {
    "id": "bybit-referral",
    "query": "Bybit referral code fee rebate",
    "targetPath": "/exchanges/bybit",
    "lang": "en"
  },
  {
    "id": "mexc-referral",
    "query": "MEXC referral code trading fees",
    "targetPath": "/exchanges/mexc",
    "lang": "en"
  },
  {
    "id": "okx-deposit",
    "query": "how to deposit USDT on OKX network fees",
    "targetPath": "/exchanges/okx",
    "lang": "en"
  },
  {
    "id": "bitget-deposit",
    "query": "Bitget USDT deposit supported networks",
    "targetPath": "/exchanges/bitget",
    "lang": "en"
  },
  {
    "id": "bybit-deposit",
    "query": "Bybit fiat deposit fees",
    "targetPath": "/exchanges/bybit",
    "lang": "en"
  },
  {
    "id": "binance-deposit",
    "query": "Binance minimum USDT deposit",
    "targetPath": "/exchanges/binance",
    "lang": "en"
  },
  {
    "id": "tokenized-stock-fees",
    "query": "tokenized stocks trading fees comparison",
    "targetPath": "/tokenized-stocks",
    "lang": "en"
  },
  {
    "id": "xstocks-availability",
    "query": "where can I buy xStocks eligibility",
    "targetPath": "/tokenized-stocks",
    "lang": "en"
  },
  {
    "id": "tokenized-stock-risks",
    "query": "tokenized stocks redemption custody risks",
    "targetPath": "/tokenized-stocks",
    "lang": "en"
  },
  {
    "id": "hyperliquid-fees",
    "query": "Hyperliquid perpetual trading fees",
    "targetPath": "/exchanges/hyperliquid",
    "lang": "en"
  },
  {
    "id": "okx-rebate-terms",
    "query": "OKX referral fee rebate eligibility terms",
    "targetPath": "/exchanges/okx",
    "lang": "en"
  }
];
export const ANSWER_ENGINES = ['chatgpt-search', 'perplexity'];
export function isoWeek(ymd) {
  const date = new Date(`${ymd}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const year = date.getUTCFullYear();
  const week = Math.ceil(((date - Date.UTC(year, 0, 1)) / 864e5 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}
const isOurDomain = value => {
  try { const host = new URL(value).hostname; return host === 'nexualpha.com' || host.endsWith('.nexualpha.com'); }
  catch { return false; }
};
export function parsePublicWeb(html) {
  if (/anomaly-modal|challenge-form|captcha|verify you are human/i.test(html) && !/result__a/.test(html)) return { status: 'blocked', top: [] };
  const top = [];
  for (const block of html.split(/<div class="result\s/).slice(1)) {
    if (/result--ad|result--more|result__sponsored/.test(block.slice(0, 200))) continue;
    const match = block.match(/class="result__a"[^>]*href="([^"]+)"/);
    if (!match) continue;
    try {
      const link = new URL(match[1].replace(/&amp;/g, '&'), 'https://duckduckgo.com');
      const url = new URL(link.searchParams.get('uddg') || link.href);
      if (!['https:', 'http:'].includes(url.protocol) || url.hostname.endsWith('duckduckgo.com')) continue;
      // Queries/fragments may contain tracking identifiers; citations retain stable public URLs only.
      url.search = ''; url.hash = ''; url.username = ''; url.password = '';
      top.push({ rank: top.length + 1, url: url.href, domain: url.hostname });
    } catch { /* Malformed result URL is not evidence. */ }
    if (top.length === 10) break;
  }
  return { status: top.length ? 'ok' : 'no-results', top };
}
async function fetchSerp(engine, row) {
  const fetchedAt = new Date().toISOString();
  try {
    const url = new URL('https://html.duckduckgo.com/html/');
    url.searchParams.set('q', row.query);
    const response = await fetch(url, { headers: { 'user-agent': 'NexuAlphaMonitor/1.0 (+https://nexualpha.com/)' }, signal: AbortSignal.timeout(15_000) });
    if (response.status !== 200) return { ...row, engine, fetchedAt, status: [403, 429].includes(response.status) ? 'blocked' : 'error', httpStatus: response.status, nexualphaRank: null, top: [] };
    const parsed = parsePublicWeb(await response.text());
    return { ...row, engine, fetchedAt, httpStatus: response.status, ...parsed, nexualphaRank: parsed.top.find(hit => isOurDomain(hit.url))?.rank ?? null };
  } catch { return { ...row, engine, fetchedAt, status: 'error', reason: 'NETWORK_REQUEST_FAILED', nexualphaRank: null, top: [] }; }
}
const safeUrl = value => {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash ? url.href : null; }
  catch { return null; }
};
/** Optional operator-collected evidence is accepted only with observed time + answer artifact reference. */
export function buildAnswerChecks(date, evidence = []) {
  return MONEY_QUERIES.flatMap(query => ANSWER_ENGINES.map(engine => {
    const observed = evidence.find(row => row.engine === engine && row.queryId === query.id);
    const base = { queryId: query.id, query: query.query, engine, status: 'unavailable', reason: 'NO_VERIFIED_ANSWER_ENGINE_ACCESS', cited: null, citations: [] };
    if (!observed) return base;
    const observedDate = String(observed.observedAt || '').slice(0, 10);
    const age = Date.parse(`${date}T12:00:00Z`) - Date.parse(`${observedDate}T12:00:00Z`);
    const citations = observed.citations?.map(safeUrl);
    if (!Number.isFinite(age) || age < 0 || age >= 7 * 864e5 || typeof observed.answerEvidence !== 'string' || !/^https:\/\/|^\//.test(observed.answerEvidence)
      || !Array.isArray(citations) || citations.some(value => value === null) || typeof observed.observedAt !== 'string') {
      return { ...base, reason: 'INVALID_OR_STALE_OPERATOR_EVIDENCE' };
    }
    return { ...base, status: 'observed', reason: null, observedAt: observed.observedAt, answerEvidence: observed.answerEvidence,
      cited: citations.some(isOurDomain), citations };
  }));
}
export async function collectProxy({ queries = MONEY_QUERIES, fetcher = fetchSerp, pauseMs = 2200 } = {}) {
  const rows = [];
  let consecutiveFailures = 0;
  for (const query of queries) {
    const row = { questionId: query.id, query: query.query, lang: query.lang, targetPath: query.targetPath };
    if (consecutiveFailures >= 3) {
      rows.push({ ...row, engine: 'ddg', status: 'unavailable', reason: 'CIRCUIT_OPEN_AFTER_3_FAILED_REQUESTS', nexualphaRank: null, top: [] });
      continue;
    }
    const result = await fetcher('ddg', row);
    // Existing parser does not reject all HTTP failures; a server error is never a no-results observation.
    if (result.httpStatus && result.httpStatus !== 200 && !['blocked', 'error'].includes(result.status)) result.status = 'error';
    rows.push(result);
    consecutiveFailures = ['blocked', 'error'].includes(result.status) ? consecutiveFailures + 1 : 0;
    if (pauseMs && rows.length < queries.length && consecutiveFailures < 3) await new Promise(resolve => setTimeout(resolve, pauseMs));
  }
  return rows;
}
export function mondayReport(result) {
  const observed = result.answerChecks.filter(row => row.status === 'observed');
  const cited = observed.filter(row => row.cited).length;
  const successfulProxies = result.publicWebProxy.rows.filter(row => row.status === 'ok');
  const escape = value => String(value).replace(/\|/g, '\\|').replace(/[\r\n]/g, ' ');
  return [
    `# AEO Monday report — ${result.week}`,
    '', `Report generated ${result.date}; planned Monday ${result.scheduledMonday}. ${result.recovery ? 'Recovery run after the scheduled Monday; this does not reconstruct historical Monday observations.' : 'Scheduled weekly run.'}`,
    '', `Query set ${MONEY_QUERY_VERSION}: ${MONEY_QUERIES.length} distinct money queries.`,
    `Answer engines: ${observed.length}/${result.answerChecks.length} observed; ${cited} observed checks cite nexualpha.com. Unavailable checks are unknown, not negative citations.`,
    'ChatGPT-search and Perplexity checks require visible/manual answer evidence; this runner uses no paid API and does not equate public SERP results with answer-engine citations.',
    '', `Public web proxy: DuckDuckGo; ${successfulProxies.length}/${result.publicWebProxy.rows.length} successful result pages. Proxy ranks and result URLs below are search evidence only.`,
    '', '| Query | Engine | Status | Citation URLs / reason |', '| --- | --- | --- | --- |',
    ...result.answerChecks.map(row => `| ${escape(row.query)} | ${row.engine} | ${row.status} | ${escape(row.status === 'observed' ? row.citations.join(', ') || 'No citations in observed answer' : row.reason)} |`),
    '', '## Public web proxy result log', '', '| Query | Status | Our rank | Observed result URLs |', '| --- | --- | --- | --- |',
    ...result.publicWebProxy.rows.map(row => `| ${escape(row.query)} | ${row.status} | ${row.nexualphaRank ?? 'unknown'} | ${escape((row.top || []).map(hit => hit.url).join(', ') || row.reason || '')} |`),
    '', '## Next actions', '',
    '- Restore weekly collection each Monday; keep failures visible and retry on the next scheduled run.',
    '- Obtain visible ChatGPT-search and Perplexity answer evidence for unavailable checks; preserve answer artifact, observation time, and citation URLs.',
    '- Route evidence-backed query/page opportunities through content review. Do not publish from monitoring output.', '',
  ].join('\n');
}
export async function runAeo({ date, outputDir, fetchProxy = true, evidenceFile = process.env.NEXU_AEO_EVIDENCE_FILE, proxyCollector = collectProxy }) {
  const week = isoWeek(date);
  const day = new Date(`${date}T12:00:00Z`).getUTCDay() || 7;
  const scheduledMonday = new Date(Date.parse(`${date}T12:00:00Z`) - (day - 1) * 864e5).toISOString().slice(0, 10);
  let evidence = [], evidenceStatus = 'not-configured';
  if (evidenceFile) {
    try { const data = JSON.parse(await readFile(evidenceFile, 'utf8')); evidence = Array.isArray(data.results) ? data.results : []; evidenceStatus = 'loaded'; }
    catch { evidenceStatus = 'unavailable'; }
  }
  const proxyRows = fetchProxy ? await proxyCollector() : MONEY_QUERIES.map(q => ({ query: q.query, questionId: q.id, status: 'unavailable', reason: 'PROXY_DISABLED', nexualphaRank: null, top: [] }));
  const answerChecks = buildAnswerChecks(date, evidence);
  const status = answerChecks.every(row => row.status === 'observed') ? 'ok' : answerChecks.some(row => row.status === 'observed') ? 'partial' : 'unavailable';
  const result = { schema: 'nexualpha.growth-aeo.v1', status, date, week, scheduledMonday, recovery: date !== scheduledMonday,
    querySetVersion: MONEY_QUERY_VERSION, queries: MONEY_QUERIES, evidenceStatus,
    answerChecks, publicWebProxy: { engine: 'ddg', isAnswerEngineEvidence: false, rows: proxyRows } };
  await mkdir(outputDir, { recursive: true });
  // Per-run evidence is immutable with respect to other dates; the weekly report is the current summary.
  await writeFile(path.join(outputDir, `aeo-${date}.json`), JSON.stringify(result, null, 2) + '\n');
  await writeFile(path.join(outputDir, `monday-${week}.md`), mondayReport(result));
  return result;
}

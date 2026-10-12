import { createHash } from 'node:crypto';
import { canonicalizeUrl, itemEntities, normalizeText } from '../lib/normalization.mjs';

export class CollectorError extends Error {
  constructor(message, status = 'temporarily-failing', retryable = false) {
    super(message); this.status = status; this.retryable = retryable;
  }
}
export const digest = value => createHash('sha256').update(String(value)).digest('hex');
export function plain(value) {
  return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
export function normalizeItem(item, source, { entities = [], keywords = [], now = new Date() } = {}) {
  if (!item.external_id || !item.url) throw new CollectorError('Item missing external_id or URL');
  const url = new URL(item.url);
  if (!['https:', 'http:'].includes(url.protocol)) throw new CollectorError('Item URL must use HTTP(S)');
  const title = plain(item.title).slice(0, 600);
  const body = plain(item.body_excerpt).slice(0, 600);
  const timestamp = item.published_at == null ? null : new Date(item.published_at);
  if (timestamp && !Number.isFinite(timestamp.getTime())) throw new CollectorError('Invalid item publication time');
  const text = normalizeText(`${title} ${body}`);
  const keyword = keywords.filter(k => k.status === 'active' && k.event_type && text.includes(normalizeText(k.term))).sort((a,b) => b.term.length-a.term.length)[0];
  return {
    source_id: source.id, external_id: String(item.external_id), url: url.href,
    canonical_url: canonicalizeUrl(url.href), author: item.author ?? null,
    author_account: item.author_account ?? null, title, body_excerpt: body || null,
    lang: item.lang ?? null, published_at: timestamp?.toISOString() ?? null,
    fetched_at: now.toISOString(), metrics: item.metrics ?? null,
    metrics_at: item.metrics == null ? null : now.toISOString(),
    entities: itemEntities({ ...item, title, body_excerpt: body }, entities),
    event_type_guess: item.event_type_guess ?? keyword?.event_type ?? null,
    content_hash: digest(`${title}\n${body}`),
  };
}

// No URL, response body or credential is included in errors persisted to the DB.
export function makeRequest({ fetchImpl = fetch, signal, timeoutMs = 10000, retries = 2, sleep = ms => new Promise(r => setTimeout(r, ms)) } = {}) {
  let lastSecRequest = 0;
  return async (url, options = {}) => {
    const target = new URL(url);
    const sec = /(^|\.)sec\.gov$/.test(target.hostname);
    const { format = 'json', retry = true, ...init } = options;
    for (let attempt = 0; ; attempt++) {
      if (signal?.aborted) throw new CollectorError('Source timeout');
      if (sec) {
        await sleep(Math.max(0, 150 - (Date.now() - lastSecRequest)));
        lastSecRequest = Date.now();
      }
      try {
        const requestSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);
        const response = await fetchImpl(target.href, { ...init, signal: requestSignal, headers: { 'User-Agent': 'NexuAlpha newsroom ops@nexualpha.com', ...init.headers } });
        if (!response.ok) throw new CollectorError(`HTTP ${response.status}`, [401,403].includes(response.status) ? 'missing-authorization' : 'temporarily-failing', response.status === 429 || response.status >= 500);
        return format === 'text' ? await response.text() : await response.json();
      } catch (error) {
        const failure = error instanceof CollectorError ? error : new CollectorError('Transport or response parse failure', 'temporarily-failing', error instanceof TypeError || error.name === 'TimeoutError');
        if (!retry || !failure.retryable || attempt >= retries || signal?.aborted) throw failure;
        await sleep(Math.min(4000, 250 * 2 ** attempt));
      }
    }
  };
}

import { isAutomatedAnalyticsRequest } from './analytics-bots.mjs';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { partnerRegistry } from '../src/data/partner-registry.js';
import { sanitizeAccountStage, sanitizeFunding, sanitizeGrowthSlug, sanitizeMarket, sanitizeProduct } from '../src/data/growth-context.js';
import { experimentRegistry, validateExperimentEventContext } from '../src/data/experiment-registry.js';
import { ANALYTICS_EVENT_TYPE_SET, referralClickPersistenceIdentity } from '../src/data/analytics-event-contract.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const jsonContentType = /^application\/json(?:\s*;.*)?$/i;
const BASE_KEYS = ['version','type','eventId','session','page','locale','source','market','product','campaign','publisher','device','experiment','variant','accountStage','funding'];
const DEVICE_CLASSES = new Set(['mobile', 'tablet', 'desktop', 'unknown']);
const TELEGRAM_TARGETS = new Set(['bot', 'telegram', 'unknown']);
const TELEGRAM_RETURN_KINDS = new Set(['none', 'hub', 'route', 'venue', 'pair', 'activity']);
export const CTA_ENVIRONMENTS = new Set(['local-preview', 'production', 'smoke', 'test']);
export function validateCta(value, registry = experimentRegistry) {
  if (!value || typeof value !== 'object') return false;
  if (value.version === 1) return validateReferralClickV1(value);
  if (value.version !== 2 || !ANALYTICS_EVENT_TYPE_SET.has(value.type)) return false;
  if (!uuid.test(value.eventId) || !uuid.test(value.session)) return false;
  if (typeof value.page !== 'string' || !/^\/[a-zA-Z0-9/_-]{0,199}$/.test(value.page)) return false;
  if (typeof value.locale !== 'string' || !/^[a-z]{2,3}(?:-[A-Za-z]{2,8}){0,2}$/.test(value.locale)) return false;
  if (typeof value.source !== 'string' || !/^[a-zA-Z0-9._-]{1,60}$/.test(value.source)) return false;
  if (sanitizeMarket(value.market) !== value.market) return false;
  if (sanitizeProduct(value.product) !== value.product) return false;
  if ('device' in value && !DEVICE_CLASSES.has(value.device)) return false;
  if ('experiment' in value && sanitizeGrowthSlug(value.experiment) !== value.experiment) return false;
  if ('variant' in value && sanitizeGrowthSlug(value.variant) !== value.variant) return false;
  if ('campaign' in value && sanitizeGrowthSlug(value.campaign) !== value.campaign) return false;
  if ('publisher' in value && sanitizeGrowthSlug(value.publisher) !== value.publisher) return false;
  if ('accountStage' in value && sanitizeAccountStage(value.accountStage) !== value.accountStage) return false;
  if ('funding' in value && sanitizeFunding(value.funding, value.market) !== value.funding) return false;
  if (!validateExperimentEventContext(value, registry)) return false;
  if (value.type === 'page_view') return exactKeys(value, BASE_KEYS);
  if (value.type === 'decision_impression' || value.type === 'decision_select') {
    return sanitizeGrowthSlug(value.decision) === value.decision
      && sanitizeGrowthSlug(value.placement) === value.placement
      && exactKeys(value, [...BASE_KEYS, 'decision', 'placement']);
  }
  if (value.type === 'telegram_handoff') {
    return sanitizeGrowthSlug(value.decision) === value.decision
      && sanitizeGrowthSlug(value.placement) === value.placement
      && TELEGRAM_TARGETS.has(value.telegramTarget)
      && TELEGRAM_RETURN_KINDS.has(value.telegramReturnKind)
      && typeof value.telegramReturnPath === 'string'
      && /^\/[a-zA-Z0-9/_-]{0,199}$/.test(value.telegramReturnPath)
      && exactKeys(value, [...BASE_KEYS, 'decision', 'placement', 'telegramTarget', 'telegramReturnKind', 'telegramReturnPath']);
  }
  return partnerRegistry[value.platform]?.hasReferral
    && sanitizeGrowthSlug(value.placement) === value.placement
    && exactKeys(value, [...BASE_KEYS, 'platform', 'placement']);
}

export function createCtaCollector(file, { environment = 'local-preview', origin: configuredOrigin, registry = experimentRegistry, env = process.env, now = Date.now } = {}) {
  if (!CTA_ENVIRONMENTS.has(environment)) throw new Error('CTA_ENVIRONMENT_INVALID');
  if (environment !== 'local-preview' && (!path.isAbsolute(file || '') || !configuredOrigin)) throw new Error('CTA_EXPLICIT_CONFIG_REQUIRED');
  if (configuredOrigin) {
    const url = new URL(configuredOrigin);
    if (url.origin !== configuredOrigin || url.username || url.password || !['http:', 'https:'].includes(url.protocol)
      || (environment === 'production' && url.protocol !== 'https:')) throw new Error('CTA_ORIGIN_INVALID');
  }
  // Server configuration only; absent provenance remains explicitly unknown.
  const collectorRelease = env.CTA_COLLECTOR_RELEASE ?? null;
  if (collectorRelease !== null && (typeof collectorRelease !== 'string'
    || collectorRelease.length < 1 || collectorRelease.length > 120
    || /[^A-Za-z0-9._-]/.test(collectorRelease))) throw new Error('CTA_COLLECTOR_RELEASE_INVALID');
  const keys = new Map();
  const eventIds = new Map();
  const experimentAssignments = new Map();
  const retentionMs = 30 * 86400000;
  let pruneAt = 0;
  const prune = () => {
    const current = now();
    if (current < pruneAt) return;
    const cutoff = current - retentionMs;
    for (const [key, at] of keys) if (at < cutoff) keys.delete(key);
    for (const [id, at] of eventIds) if (at < cutoff) eventIds.delete(id);
    for (const [key, assignment] of experimentAssignments) if (assignment.at < cutoff) experimentAssignments.delete(key);
    pruneAt = current + 60000;
  };
  // Stream recovery rather than retaining the entire historical log and its split lines at startup.
  const ready = (async () => {
    const stream = createReadStream(file, { encoding: 'utf8' });
    let lastCharacter = '';
    stream.on('data', chunk => { if (chunk.length) lastCharacter = chunk.slice(-1); });
    const lines = createInterface({ input: stream, crlfDelay: Infinity });
    try {
      for await (const line of lines) {
        let row;
        try { row = JSON.parse(line); } catch { continue; }
        if ((row.environment || 'local-preview') !== environment) throw new Error('CTA_ENVIRONMENT_FILE_MISMATCH');
        const at = Date.parse(row.receivedAt);
        if (at >= now() - retentionMs) {
          keys.set(dedupeKey(row), at);
          eventIds.set(row.eventId, at);
          if (row.experiment && row.variant) experimentAssignments.set(`${row.session}:${row.experiment}`, { variant: row.variant, at });
        }
      }
      if (lastCharacter && lastCharacter !== '\n') await appendFile(file, '\n', { mode: 0o600 });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    } finally {
      lines.close();
      stream.destroy();
    }
  })();
  // Expose startup readiness without an unhandled rejection for legacy callers.
  ready.catch(() => {});
  let serial = Promise.resolve();
  const collect = async (request, origin, { clientIp } = {}) => {
    await ready;
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
    const expectedOrigin = configuredOrigin || origin;
    if (!expectedOrigin || request.headers.get('origin') !== expectedOrigin) return new Response(null, { status: 403 });
    if (environment === 'production' && (new URL(request.url).searchParams.has('analytics_test')
      || request.headers.has('x-nexualpha-analytics-mode'))) return new Response(null, { status: 400 });
    // Crawlers may execute the hydrated client and POST a page_view. Treat the
    // request as accepted but never persist it so bot traffic cannot pollute
    // first-party intent reports or create noisy 4xx retries in access logs.
    if (!['smoke', 'test'].includes(environment) && isAutomatedAnalyticsRequest(request, { env, clientIp })) {
      return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    }
    if (!jsonContentType.test(request.headers.get('content-type') || '')) return new Response(null, { status: 415 });
    const reader = request.body?.getReader();
    if (!reader) return new Response(null, { status: 400 });
    let bytes = 0;
    const chunks = [];
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 2048) { await reader.cancel(); return new Response(null, { status: 413 }); }
      chunks.push(value);
    }
    let data;
    try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return new Response(null, { status: 400 }); }
    if (!validateCta(data, registry)) return new Response(null, { status: 400 });
    const key = dedupeKey(data);
    const operation = serial.then(async () => {
      prune();
      const assignmentKey = data.experiment ? `${data.session}:${data.experiment}` : null;
      if (assignmentKey && experimentAssignments.has(assignmentKey) && experimentAssignments.get(assignmentKey).variant !== data.variant) return 'variant_conflict';
      if (keys.has(key) || eventIds.has(data.eventId)) return 'duplicate';
      await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
      await appendFile(file, JSON.stringify({ ...data, receivedAt: new Date(now()).toISOString(), environment, collectorRelease }) + '\n', { mode: 0o600 });
      const at = now();
      keys.set(key, at);
      eventIds.set(data.eventId, at);
      if (assignmentKey) experimentAssignments.set(assignmentKey, { variant: data.variant, at });
      return 'written';
    });
    serial = operation.catch(() => {});
    const outcome = await operation;
    if (outcome === 'variant_conflict') return new Response(null, { status: 409 });
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  };
  collect.ready = ready;
  return collect;
}

function validateReferralClickV1(value) {
  if (value.type !== 'referral_click') return false;
  if (!uuid.test(value.eventId) || !uuid.test(value.session)) return false;
  if (!partnerRegistry[value.platform]?.hasReferral) return false;
  if (typeof value.page !== 'string' || !/^\/[a-zA-Z0-9/_-]{0,199}$/.test(value.page)) return false;
  if (typeof value.locale !== 'string' || !/^[a-z]{2,3}(?:-[A-Za-z]{2,8}){0,2}$/.test(value.locale)) return false;
  if (typeof value.source !== 'string' || !/^[a-zA-Z0-9._-]{1,60}$/.test(value.source)) return false;
  if (sanitizeGrowthSlug(value.placement) !== value.placement) return false;
  return exactKeys(value, ['version','type','eventId','session','platform','page','locale','source','placement']);
}

function exactKeys(value, allowed) {
  const allowedSet = new Set(allowed);
  return Object.keys(value).every((key) => allowedSet.has(key));
}

function dedupeKey(row) {
  const experiment = row.experiment ? `:${row.experiment}:${row.variant}` : '';
  const decisionContext = `${row.accountStage || 'unknown'}:${row.funding || 'unknown'}`;
  if (row.version === 2 && row.type === 'page_view') return `${row.session}:page_view:${row.page}:${row.market}:${row.product}:${decisionContext}${experiment}`;
  if (row.version === 2 && row.type === 'decision_impression') return `${row.session}:decision_impression:${row.page}:${row.market}:${row.product}:${decisionContext}:${row.placement}:${row.decision}${experiment}`;
  if (row.version === 2 && row.type === 'decision_select') return `${row.session}:decision_select:${row.page}:${row.market}:${row.product}:${decisionContext}:${row.placement}:${row.decision}${experiment}`;
  if (row.version === 2 && row.type === 'telegram_handoff') return `${row.session}:telegram_handoff:${row.page}:${row.market}:${row.product}:${decisionContext}:${row.placement}:${row.decision}:${row.telegramReturnKind}:${row.telegramReturnPath}${experiment}`;
  if (row.version === 2 && row.type === 'cta_visible') return `${row.session}:cta_visible:${row.page}:${row.market}:${row.product}:${decisionContext}:${row.platform}:${row.placement}${experiment}`;
  if (row.version === 2 && row.type === 'outbound_handoff') return `${row.session}:outbound_handoff:${row.page}:${row.market}:${row.product}:${decisionContext}:${row.platform}:${row.placement}${experiment}`;
  return `referral_click:${referralClickPersistenceIdentity(row)}`;
}

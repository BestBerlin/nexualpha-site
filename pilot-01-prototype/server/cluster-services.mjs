import { createClickWindowClassifier } from './click-metadata.mjs';
import { createRateLimiter } from './cta-click.mjs';
import { createCtaCollector, ctaRequestPreflight } from './cta-collector.mjs';
import { isClusterWorker, primaryCall } from './cluster-rpc.mjs';
import { persistFlashMemory } from './flash-memory.mjs';
import { persistIntelArchive } from './intel-feed.mjs';

export function createPrimaryServices(env = process.env) {
  const classify = createClickWindowClassifier();
  const allow = createRateLimiter();
  const collectors = new Map();
  const collector = ({ file, environment, origin, registry }) => {
    // Startup/recovery is shared too: only the owner may repair an incomplete trailing log row.
    if (!collectors.has(file)) collectors.set(file, createCtaCollector(file, { env, environment, origin, ...(registry ? { registry } : {}) }));
    return collectors.get(file);
  };
  return {
    'click-window': ({ key }) => classify(key),
    'click-allow': ({ key }) => allow(key),
    'flash-save': ({ file, items }) => persistFlashMemory(file, items),
    'intel-save': ({ file, archive, now }) => persistIntelArchive(file, archive, now),
    'cta-init': async (config) => { await collector(config).ready; return true; },
    'cta-collect': async ({ config, url, method, headers, body, origin, clientIp }) => {
      const response = await collector(config)(new Request(url, { method, headers, body }), origin, { clientIp });
      return { status: response.status, headers: [...response.headers] };
    },
  };
}

// Direct collector configurations retain event/session/variant uniqueness across workers.
// The usual production CTA_ANALYTICS_ORIGIN proxy path needs no IPC.
export function createWebCtaCollector(file, options) {
  if (!isClusterWorker()) return createCtaCollector(file, options);
  const config = { file, environment: options.environment, origin: options.origin, ...(options.registry ? { registry: options.registry } : {}) };
  const ready = primaryCall('cta-init', config);
  ready.catch(() => {});
  const collect = async (request, origin, { clientIp } = {}) => {
    await ready;
    const preflight = ctaRequestPreflight(request, { env: options.env, environment: options.environment, origin: options.origin || origin, clientIp });
    if (preflight) return preflight;
    const reader = request.body?.getReader();
    let bytes = 0;
    const chunks = [];
    if (reader) while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 2048) { await reader.cancel(); return new Response(null, { status: 413 }); }
      chunks.push(value);
    }
    const result = await primaryCall('cta-collect', { config, url: request.url, method: request.method,
      headers: [...request.headers], body: chunks.length ? Buffer.concat(chunks).toString('utf8') : undefined, origin, clientIp });
    return new Response(null, result);
  };
  collect.ready = ready;
  return collect;
}

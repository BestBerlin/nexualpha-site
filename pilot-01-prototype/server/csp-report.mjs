import { createHash } from 'node:crypto';

// Hash only the trusted build template, never attacker-controlled response HTML.
export function reportOnlyPolicy(template = '') {
  const hashes = [...template.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
    .filter(([, attrs, text]) => !/\bsrc\s*=/i.test(attrs) && text.trim() && !/\btype\s*=\s*["']application\/(?:ld\+)?json["']/i.test(attrs))
    .map(([, , text]) => `'sha256-${createHash('sha256').update(text).digest('base64')}'`);
  return `default-src 'self'; script-src 'self' ${[...new Set(hashes)].join(' ')}; object-src 'none'; base-uri 'self'; report-uri /api/csp-report`.replace('  ', ' ');
}

// Global budget, rather than IP keys: no PII or attacker-controlled map growth.
export function createCspReporter({ log = (row) => console.log(JSON.stringify(row)), now = Date.now, limit = 20 } = {}) {
  let windowStart = now();
  let accepted = 0;
  return async (request) => {
    const reply = (status) => new Response(null, { status, headers: { 'cache-control': 'no-store' } });
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { allow: 'POST' } });
    if (now() - windowStart >= 60_000) { windowStart = now(); accepted = 0; }
    if (accepted >= limit) { await request.body?.cancel(); return reply(204); }
    accepted++;
    if (!/^(application\/csp-report|application\/reports\+json|application\/json)(?:;|$)/i.test(request.headers.get('content-type') || '')) return reply(415);
    const reader = request.body?.getReader();
    if (!reader) return reply(400);
    let size = 0;
    const chunks = [];
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 16_384) { await reader.cancel(); return reply(413); }
        chunks.push(Buffer.from(value));
      }
      const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const reports = Array.isArray(input) ? input.slice(0, 5).map((r) => r?.body) : [input?.['csp-report']];
      for (const report of reports) {
        if (!report || typeof report !== 'object') continue;
        const directive = report['effective-directive'] ?? report.effectiveDirective;
        // Keep only finite categories. URLs, samples, referrers, line numbers,
        // user agents and request addresses are deliberately discarded.
        const raw = report['blocked-uri'] ?? report.blockedURL;
        const blocked = ['inline', 'eval', 'data', 'blob'].includes(raw) ? raw : 'url-or-other';
        const allowed = ['default-src', 'script-src', 'script-src-elem', 'script-src-attr', 'style-src', 'img-src', 'connect-src', 'font-src', 'object-src', 'base-uri', 'frame-src', 'media-src', 'worker-src', 'manifest-src'];
        log({ event: 'csp-report-only', directive: allowed.includes(directive) ? directive : 'other', blocked });
      }
      return reply(204);
    } catch { return reply(400); }
    finally { reader.releaseLock(); }
  };
}

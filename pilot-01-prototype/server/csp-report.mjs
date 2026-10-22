import { createHash } from 'node:crypto';

const scriptHash = (text) => `'sha256-${createHash('sha256').update(text).digest('base64')}'`;

// Hash only the trusted build template, never attacker-controlled response HTML.
export function reportOnlyPolicy(template = '', extraHashes = []) {
  const hashes = [...template.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
    .filter(([, attrs, text]) => !/\bsrc\s*=/i.test(attrs) && text.trim() && !/\btype\s*=\s*["']application\/(?:ld\+)?json["']/i.test(attrs))
    .map(([, , text]) => scriptHash(text));
  // style-src: SSR pages inline their critical CSS and React renders style="" attributes. Without it every page fired
  // 2-5 report POSTs to /api/csp-report (perf diagnosis 2026-10-22). img-src data:/blob: covers inline data icons.
  return `default-src 'self'; script-src 'self' ${[...new Set([...hashes, ...extraHashes])].join(' ')}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; object-src 'none'; base-uri 'self'; report-uri /api/csp-report`.replace('  ', ' ');
}

// The two inline scripts the worker itself adds to SSR HTML (worker/index.js protectPrerenderInteraction and
// DEFERRED_CSS_SWITCH). Matched by their exact fixed opening, first occurrence only, so feed or article text can never
// get a script of its own allowlisted. The bridge embeds the build's entry URL, so its hash is per build: memoised.
const WORKER_INLINE_SCRIPTS = [
  /<script data-nexualpha-deferred-hydration>(\/\* Prerendered content is already visible\. \*\/\(\(\)=>\{let p;const s="\/assets\/[^"<]+";[\s\S]*?)<\/script>/,
  /<script>(\(\(\)=>\{const l=\[\.\.\.document\.querySelectorAll\("link\[data-nexualpha-deferred-css\]"\)\];[\s\S]*?)<\/script>/,
];
const workerHashMemo = new Map();
export function workerInlineScriptHashes(html = '') {
  const hashes = [];
  for (const pattern of WORKER_INLINE_SCRIPTS) {
    const text = pattern.exec(html)?.[1];
    if (!text) continue;
    let hash = workerHashMemo.get(text);
    if (!hash) {
      if (workerHashMemo.size >= 32) workerHashMemo.clear();
      hash = scriptHash(text);
      workerHashMemo.set(text, hash);
    }
    hashes.push(hash);
  }
  return hashes;
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

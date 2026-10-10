// Tracked partner redirect (owner 2026-10-10): /go/<partner>?src=<source> records one click and redirects to the
// partner's registration URL from the build's partner feed (intel/partners.json), unchanged, so invite codes and
// links stay exactly what the registry says. Only time, partner, source and the referring host are recorded;
// no IP, no cookie, no user id. Crawlers are not counted and the route is noindex.
import { readFile, appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|telegrambot|whatsapp|curl|wget|python|headless|lighthouse/i;
const SRC = /^[a-z0-9][a-z0-9_-]{0,47}$/;

export function createGoRedirect({ clientRoot, eventFile = null, now = () => new Date() } = {}) {
  let partners = null;
  let loadedAt = 0;
  const partnerMap = async () => {
    if (!partners || Date.now() - loadedAt > 5 * 60 * 1000) {
      const feed = JSON.parse(await readFile(path.join(clientRoot, 'intel', 'partners.json'), 'utf8'));
      partners = new Map((feed.partners || []).filter((p) => /^https:\/\//.test(p.registrationUrl || '')).map((p) => [p.slug, p.registrationUrl]));
      loadedAt = Date.now();
    }
    return partners;
  };
  if (eventFile) mkdir(path.dirname(eventFile), { recursive: true }).catch(() => {});

  return async function handle(request) {
    const url = new URL(request.url);
    const slug = url.pathname.slice('/go/'.length).toLowerCase();
    const headers = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'no-referrer-when-downgrade' };
    let target;
    try { target = (await partnerMap()).get(slug); } catch { target = undefined; }
    if (!target) return new Response('Not Found', { status: 404, headers });
    const src = SRC.test(url.searchParams.get('src') || '') ? url.searchParams.get('src') : 'unknown';
    const ua = request.headers.get('user-agent') || '';
    if (eventFile && !BOT_UA.test(ua) && request.method === 'GET') {
      let refHost = null;
      try { refHost = new URL(request.headers.get('referer')).host; } catch { /* none */ }
      appendFile(eventFile, `${JSON.stringify({ t: now().toISOString(), partner: slug, src, ref: refHost })}\n`, { mode: 0o600 }).catch(() => {});
    }
    return new Response(null, { status: 302, headers: { ...headers, location: target } });
  };
}

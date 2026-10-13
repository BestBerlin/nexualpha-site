// Tracked partner redirect (owner 2026-10-10): /go/<partner>?src=<source> records one click and redirects to the
// partner's registration URL from the build's partner feed (intel/partners.json), unchanged, so invite codes and
// links stay exactly what the registry says. Only time, partner, source, referring host and sanitized attribution
// metadata are recorded (plus the home hero experiment id and a/b bucket while that experiment runs); no IP, no cookie
// value, no user id. Crawlers are not counted and the route is noindex.
import { readFile, appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { partnerRegistry } from '../src/data/partner-registry.js';
import { clickMetadata } from './click-metadata.mjs';
import { partnerPromotionGate } from '../src/data/partner-geo-policy.js';
import { homeHeroClickContext } from '../src/data/home-hero-experiment.js';
import { BINANCE_OCTOBER_GO_SLUGS, binanceCampaignActive, binanceCampaignUrl } from '../src/data/binance-october.js';
import { BITGET_ALLIANCE_GO_SLUG, bitgetAllianceActive, bitgetAllianceUrl } from '../src/data/bitget-alliance.js';
import { KRAKEN_USDG_GO_SLUG, krakenUsdgRegisterUrl, krakenUsdgActive } from '../src/data/kraken-usdg.js';
import { sitewideReferral } from '../src/data/exchange-outbound.js';
import { BACKUP_SIGNUP_URLS, backupSignupVenue } from '../src/data/backup-signup.js';

// Older campaign route names some pages, posts or bots used; they resolve to the live tracked route (same code).
export const GO_ALIASES = Object.freeze({ 'bybit-stocks': 'bybit', 'binance-october-gifts': 'binance-gifts', 'binance-october': 'binance-gifts' });

/**
 * /go/<venue>-page?to=<path>: an official page of a venue whose referral parameter works sitewide (Binance, Bybit,
 * Kraken), with the registry code set. Only a site path on the venue's main host is accepted (no open redirect).
 */
export function venuePageTarget(slug, to) {
  const match = /^([a-z0-9-]+)-page$/.exec(slug);
  const referral = match ? sitewideReferral(match[1]) : null;
  if (!referral) return null;
  const path = String(to || '/');
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || path.length > 600 || /[\u0000-\u001f]/.test(path)) return null;
  let url;
  try { url = new URL(path, `https://${referral.host}`); } catch { return null; }
  if (url.hostname !== referral.host) return null;
  url.searchParams.set(referral.param, referral.code);
  return url.href;
}

// Mirror health (owner 2026-10-13): a backup route must answer 2xx/3xx, else the official registration link with the
// code is used. Cached per URL for 10 minutes; a check failure (DNS, timeout) falls back, never breaks.
export function createMirrorHealth({ fetchImpl = globalThis.fetch, ttlMs = 10 * 60 * 1000, timeoutMs = 3000 } = {}) {
  const cache = new Map();
  return async (href) => {
    const hit = cache.get(href);
    if (hit && Date.now() - hit.at < ttlMs) return hit.ok;
    let ok = false;
    try {
      const response = await fetchImpl(href, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(timeoutMs), headers: { 'user-agent': 'Mozilla/5.0 (NexuAlpha link health)' } });
      ok = response.status >= 200 && response.status < 400 || response.type === 'opaqueredirect';
    } catch { ok = false; }
    cache.set(href, { ok, at: Date.now() });
    return ok;
  };
}

export const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|telegrambot|whatsapp|curl|wget|python|headless|lighthouse/i;
export const SRC = /^[a-z0-9][a-z0-9_-]{0,47}$/;

// Shared by /go/<partner> and the site click beacon (/api/cta-click): slug -> https registration URL, refreshed every 5 min.
export function createPartnerMapLoader(clientRoot) {
  let partners = null;
  let loadedAt = 0;
  return async () => {
    if (!partners || Date.now() - loadedAt > 5 * 60 * 1000) {
      const feed = JSON.parse(await readFile(path.join(clientRoot, 'intel', 'partners.json'), 'utf8'));
      partners = new Map((feed.partners || []).filter((p) => /^https:\/\//.test(p.registrationUrl || '')).map((p) => [p.slug, p.registrationUrl]));
      // Official-only routes need NexuAlpha click tracking too. Use the unchanged owner URL;
      // never revive a referral venue omitted by the feed's verification/placeholder gates.
      for (const [slug, partner] of Object.entries(partnerRegistry)) {
        if (partner.hasReferral === false && /^https:\/\//.test(partner.registrationUrl || '')) partners.set(slug, partner.registrationUrl);
      }
      loadedAt = Date.now();
    }
    return partners;
  };
}

export function createGoRedirect({ clientRoot, eventFile = null, now = () => new Date(), heroForce = null, registry, mirrorHealth = createMirrorHealth() } = {}) {
  const partnerMap = createPartnerMapLoader(clientRoot);
  if (eventFile) mkdir(path.dirname(eventFile), { recursive: true }).catch(() => {});

  return async function handle(request) {
    const url = new URL(request.url);
    const requested = url.pathname.slice('/go/'.length).toLowerCase();
    const slug = GO_ALIASES[requested] || requested;
    const headers = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'no-referrer-when-downgrade' };
    const src = SRC.test(url.searchParams.get('src') || '') ? url.searchParams.get('src') : 'unknown';
    // Heatmap offers use the same territorial policy as their visible card.
    // Cloudflare supplies CF-IPCountry at the trusted edge; locale remains a
    // conservative fallback for deployments without a country signal.
    if (src === 'liq-heatmap') {
      const locale = url.searchParams.get('locale') || 'en';
      const country = request.headers.get('cf-ipcountry') || '';
      const context = { locale, ...(/^[A-Z]{2}$/.test(country) && !['XX', 'T1'].includes(country) ? { market: country } : {}) };
      if (partnerPromotionGate(slug, context)) return new Response('Unavailable in this region', { status: 403, headers });
    }
    let target;
    let campaign = null;
    // Binance October campaign links (owner 2026-10-12): /go/binance-gifts, /go/binance-refer2earn, /go/binance-tournament
    // open the official binance.com campaign page in the visitor's language; after the campaign end date they fall back
    // to the regular /go/binance route (which records its own click).
    const campaignKey = BINANCE_OCTOBER_GO_SLUGS[slug];
    let venue = 'binance';
    if (slug === BITGET_ALLIANCE_GO_SLUG) {
      // Bitget Alliance (owner 2026-10-13): the official www.bitget.com campaign page with the campaign code (never the
      // mirror domain), in the visitor's language; after 26 Oct 16:00 UTC+8 it falls back to the regular /go/bitget.
      if (!bitgetAllianceActive(now())) {
        return new Response(null, { status: 302, headers: { ...headers, location: `/go/bitget?src=${encodeURIComponent(`${src}-expired`.slice(0, 48))}` } });
      }
      target = bitgetAllianceUrl(url.searchParams.get('lang') || 'en');
      campaign = 'alliance';
      venue = 'bitget';
    } else if (slug === KRAKEN_USDG_GO_SLUG) {
      // Kraken 5M USDG Challenge (owner 2026-10-13): step 2 of the funnel, Kraken's official challenge page with our Kraken
      // ref code (owner 2026-10-13; the sign-up with our code is /go/kraken, the primary button). Counted so step-2 clicks can be measured; after the
      // end (11 Dec 07:59:59 SGT) it falls back to our Kraken profile.
      if (!krakenUsdgActive(now())) {
        return new Response(null, { status: 302, headers: { ...headers, location: '/exchanges/kraken' } });
      }
      target = krakenUsdgRegisterUrl();
      campaign = 'usdg-challenge';
      venue = 'kraken';
    } else if (/-page$/.test(slug)) {
      target = venuePageTarget(slug, url.searchParams.get('to'));
      venue = slug.replace(/-page$/, '');
      campaign = 'page';
    } else if (backupSignupVenue(slug)) {
      venue = backupSignupVenue(slug);
      campaign = 'alt';
      const mirror = BACKUP_SIGNUP_URLS[venue];
      let official;
      try { official = (await partnerMap()).get(venue); } catch { official = undefined; }
      target = (await mirrorHealth(mirror).catch(() => false)) ? mirror : official;
    } else if (campaignKey) {
      if (!binanceCampaignActive(campaignKey, now())) {
        return new Response(null, { status: 302, headers: { ...headers, location: `/go/binance?src=${encodeURIComponent(`${src}-expired`.slice(0, 48))}` } });
      }
      target = binanceCampaignUrl(campaignKey, url.searchParams.get('lang') || 'en');
      campaign = campaignKey;
    } else {
      try { target = (await partnerMap()).get(slug); } catch { target = undefined; }
    }
    if (!target) return new Response('Not Found', { status: 404, headers });
    const ua = request.headers.get('user-agent') || '';
    if (eventFile && !BOT_UA.test(ua) && request.method === 'GET') {
      let refHost = null;
      const referer = request.headers.get('referer');
      try { refHost = new URL(referer).host; } catch { /* none */ }
      const metadata = clickMetadata({ ref: referer, src });
      // Home hero experiment (X5): the visitor's one-bit bucket cookie, only while the experiment runs.
      const hero = homeHeroClickContext({ cookieHeader: request.headers.get('cookie') || '', userAgent: ua, force: heroForce, ...(registry ? { registry } : {}) });
      appendFile(eventFile, `${JSON.stringify({ t: now().toISOString(), partner: slug, src, ref: refHost, ...(campaign ? { venue, campaign } : {}), ...Object.fromEntries(Object.entries(metadata).filter(([, value]) => value)), ...(hero || {}) })}\n`, { mode: 0o600 }).catch(() => {});
    }
    return new Response(null, { status: 302, headers: { ...headers, location: target } });
  };
}

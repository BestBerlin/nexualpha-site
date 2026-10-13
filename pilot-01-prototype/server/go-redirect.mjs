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
import { KRAKEN_USDG_GO_SLUG, KRAKEN_USDG_OFFICIAL_URL, krakenUsdgActive } from '../src/data/kraken-usdg.js';

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

export function createGoRedirect({ clientRoot, eventFile = null, now = () => new Date(), heroForce = null, registry } = {}) {
  const partnerMap = createPartnerMapLoader(clientRoot);
  if (eventFile) mkdir(path.dirname(eventFile), { recursive: true }).catch(() => {});

  return async function handle(request) {
    const url = new URL(request.url);
    const slug = url.pathname.slice('/go/'.length).toLowerCase();
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
      // Kraken 5M USDG Challenge (owner 2026-10-13): step 2 of the funnel, Kraken's official challenge page (it carries no
      // referral parameter; the sign-up with our code is /go/kraken). Counted so step-2 clicks can be measured; after the
      // end (11 Dec 07:59:59 SGT) it falls back to our Kraken profile.
      if (!krakenUsdgActive(now())) {
        return new Response(null, { status: 302, headers: { ...headers, location: '/exchanges/kraken' } });
      }
      target = KRAKEN_USDG_OFFICIAL_URL;
      campaign = 'usdg-challenge';
      venue = 'kraken';
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

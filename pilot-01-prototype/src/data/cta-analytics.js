import { partnerRegistry } from './partner-registry.js';
import { getGrowthContext, sanitizeGrowthSlug, sanitizeMarket, sanitizeProduct } from './growth-context.js';
import { resolveExperimentContext } from './experiment-registry.js';
import { homeHeroEventContext } from './home-hero-experiment.js';
import { referralClickPersistenceIdentity } from './analytics-event-contract.js';

const partners = Object.values(partnerRegistry).filter((partner) => partner.hasReferral);
const CLICK_ID_SOURCES = new Map([
  ['gclid', 'google-ads'],
  ['msclkid', 'microsoft-ads'],
  ['fbclid', 'facebook-ads'],
]);
const SOURCE_RE = /^[a-zA-Z0-9._-]{1,60}$/;
const DEVICE_CLASSES = new Set(['mobile', 'tablet', 'desktop', 'unknown']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const lastDecisionBySession = new Map();
const sentPageViewBySession = new Set();
let analyticsSuppressedForPage = false;

function resolvedAnalyticsLocale(location = globalThis.location, document = globalThis.document) {
  const pathname = String(location?.pathname || "");
  if (pathname === "/br" || pathname.startsWith("/br/")) return "pt-BR";
  const requested = new URLSearchParams(location?.search || "").get("locale");
  if (requested) return requested === "zh" ? "zh-Hans" : requested;
  return document?.documentElement?.lang || "en";
}

export function referralPlatform(href) {
  try {
    const target = new URL(href);
    return partners.find((partner) => {
      const urls = [partner.registrationUrl, ...(partner.alternateRegistrationUrls || [])];
      return urls.some((url) => new URL(url).href === target.href);
    })?.slug ?? null;
  } catch { return null; }
}

export function sanitizeCtaSource(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return SOURCE_RE.test(trimmed) ? trimmed : null;
}

// Device analytics are deliberately coarse. The raw user-agent and viewport
// are never sent to the collector; only this four-value classification is.
export function detectDeviceClass({ navigator: nav = globalThis.navigator, window: win = globalThis.window } = {}) {
  const userAgent = typeof nav?.userAgent === 'string' ? nav.userAgent : '';
  if (/ipad|tablet|playbook|silk|kindle|android(?!.*mobile)/i.test(userAgent)) return 'tablet';
  if (/mobi|iphone|ipod|android|windows phone/i.test(userAgent)) return 'mobile';
  if (userAgent || win?.matchMedia?.('(min-width: 769px)')?.matches) return 'desktop';
  return 'unknown';
}

export function getExperimentContext(search = '', { pathname = '/', market = 'unknown', registry } = {}) {
  const params = new URLSearchParams(search || '');
  const experiment = sanitizeGrowthSlug(params.get('experiment') || params.get('utm_experiment'));
  const variant = sanitizeGrowthSlug(params.get('variant') || params.get('utm_variant'));
  if (!experiment || !variant) {
    // Home hero copy experiment (X5): the worker-assigned bucket cookie tags v2 events on the home routes while it runs,
    // so growth-report splits page views, CTA visibility and referral clicks by variant.
    const hero = homeHeroEventContext({ pathname, ...(registry ? { registry } : {}) });
    return hero.experiment ? resolveExperimentContext({ ...hero, pathname, market, registry }).context : {};
  }
  return resolveExperimentContext({ experiment, variant, pathname, market, registry }).context;
}

export function firstTouchSource({ search = '', referrer = '', origin = '' } = {}) {
  const params = new URLSearchParams(search);
  const utmSource = sanitizeCtaSource(params.get('utm_source'));
  if (utmSource) return utmSource;
  for (const [key, source] of CLICK_ID_SOURCES) {
    if (params.has(key)) return source;
  }
  try {
    const referrerUrl = referrer ? new URL(referrer) : null;
    const source = referrerUrl && referrerUrl.origin !== origin ? sanitizeCtaSource(referrerUrl.hostname) : null;
    return source || 'direct';
  } catch { return 'direct'; }
}

export function buildCtaPayload({ anchor, location, document, session, source }) {
  return buildReferralPayload({ anchor, location, document, session, source, type: 'referral_click' });
}

export function buildCtaVisibilityPayload({ anchor, location, document, session, source }) {
  return buildReferralPayload({ anchor, location, document, session, source, type: 'cta_visible' });
}

export function buildOutboundHandoffPayload({ anchor, location, document, session, source }) {
  return buildReferralPayload({ anchor, location, document, session, source, type: 'outbound_handoff' });
}

export function buildTelegramHandoffPayload({ anchor, location, document, session, source }) {
  if (!isTelegramCta(anchor)) return null;
  const growth = getGrowthContext(location.search, {
    pathname: location.pathname,
    market: anchor.dataset.growthMarket,
    product: anchor.dataset.growthProduct,
    campaign: anchor.dataset.growthCampaign,
    publisher: anchor.dataset.growthPublisher,
    accountStage: anchor.dataset.growthAccountStage,
    funding: anchor.dataset.growthFunding,
  });
  const experiment = getExperimentContext(location.search, { pathname: location.pathname, market: growth.market });
  const safeDecision = sanitizeGrowthSlug(anchor.dataset.growthDecision) || 'telegram';
  const safePlacement = sanitizeGrowthSlug(anchor.dataset.growthPlacement || anchor.dataset.ctaPlacement || 'telegram-handoff');
  const returnContext = safeTelegramReturnContext(anchor.dataset.telegramReturnHref);
  return {
    version: 2, type: 'telegram_handoff', eventId: crypto.randomUUID(), session,
    page: location.pathname,
    locale: resolvedAnalyticsLocale(location, document),
    source,
    market: growth.market,
    product: growth.product,
    device: detectDeviceClass(),
    ...experiment,
    decision: safeDecision,
    placement: safePlacement,
    telegramTarget: safeTelegramTarget(anchor.href),
    telegramReturnKind: returnContext.kind,
    telegramReturnPath: returnContext.path,
    ...(growth.campaign ? { campaign: growth.campaign } : {}),
    ...(growth.publisher ? { publisher: growth.publisher } : {}),
    ...(growth.accountStage ? { accountStage: growth.accountStage } : {}),
    ...(growth.funding ? { funding: growth.funding } : {}),
  };
}

function isTelegramCta(anchor) {
  if (!anchor?.href || anchor.dataset?.analyticsExclude) return false;
  return anchor.dataset?.ctaKind === 'telegram' || safeTelegramTarget(anchor.href) !== 'unknown';
}

function safeTelegramTarget(href) {
  try {
    const target = new URL(href, 'https://nexualpha.com');
    if (target.hostname === 't.me' || target.hostname === 'telegram.me') return 'bot';
    if (/telegram/i.test(target.hostname)) return 'telegram';
    return 'unknown';
  } catch { return 'unknown'; }
}

function safeTelegramReturnContext(rawHref) {
  const fallback = { kind: 'none', path: '/' };
  if (typeof rawHref !== 'string' || !rawHref.trim()) return fallback;
  try {
    const target = new URL(rawHref, 'https://nexualpha.com');
    if (target.origin !== 'https://nexualpha.com') return fallback;
    const path = /^\/[a-zA-Z0-9/_-]{0,199}$/.test(target.pathname) ? target.pathname : '/';
    const params = target.searchParams;
    const kind = params.has('tg_venue') ? 'venue'
      : params.has('tg_pair') ? 'pair'
        : params.has('tg_activity') ? 'activity'
          : params.has('tg_route') ? 'route'
            : 'hub';
    return { kind, path };
  } catch { return fallback; }
}

function buildReferralPayload({ anchor, location, document, session, source, type }) {
  const platform = referralPlatform(anchor?.href);
  if (!platform) return null;
  const growth = getGrowthContext(location.search, {
    pathname: location.pathname,
    market: anchor.dataset.growthMarket,
    product: anchor.dataset.growthProduct,
    campaign: anchor.dataset.growthCampaign,
    publisher: anchor.dataset.growthPublisher,
    accountStage: anchor.dataset.growthAccountStage,
    funding: anchor.dataset.growthFunding,
  });
  const experiment = getExperimentContext(location.search, { pathname: location.pathname, market: growth.market });
  return {
    version: 2, type, eventId: crypto.randomUUID(), session,
    platform, page: location.pathname,
    locale: resolvedAnalyticsLocale(location, document), source,
    placement: anchor.dataset.ctaPlacement || 'existing-link',
    market: growth.market,
    product: growth.product,
    device: detectDeviceClass(),
    ...experiment,
    ...(growth.campaign ? { campaign: growth.campaign } : {}),
    ...(growth.publisher ? { publisher: growth.publisher } : {}),
    ...(growth.accountStage ? { accountStage: growth.accountStage } : {}),
    ...(growth.funding ? { funding: growth.funding } : {}),
  };
}

export function buildGrowthPageView({ location, document, session, source }) {
  const growth = getGrowthContext(location.search, { pathname: location.pathname });
  const experiment = getExperimentContext(location.search, { pathname: location.pathname, market: growth.market });
  return {
    version: 2, type: 'page_view', eventId: crypto.randomUUID(), session,
    page: location.pathname,
    locale: resolvedAnalyticsLocale(location, document),
    source,
    market: growth.market,
    product: growth.product,
    device: detectDeviceClass(),
    ...experiment,
    ...(growth.campaign ? { campaign: growth.campaign } : {}),
    ...(growth.publisher ? { publisher: growth.publisher } : {}),
    ...(growth.accountStage ? { accountStage: growth.accountStage } : {}),
    ...(growth.funding ? { funding: growth.funding } : {}),
  };
}

export function buildGrowthDecisionPayload({ location, document, session, source, market, product, campaign, publisher, accountStage, funding, decision, placement }) {
  return buildDecisionEventPayload({ type: 'decision_select', location, document, session, source, market, product, campaign, publisher, accountStage, funding, decision, placement });
}

export function buildDecisionImpressionPayload({ target, location, document, session, source }) {
  if (!target?.dataset) return null;
  const fallbackDecision = isTelegramCta(target) ? 'telegram' : null;
  return buildDecisionEventPayload({
    type: 'decision_impression',
    location,
    document,
    session,
    source,
    market: target.dataset.growthMarket,
    product: target.dataset.growthProduct,
    campaign: target.dataset.growthCampaign,
    publisher: target.dataset.growthPublisher,
    accountStage: target.dataset.growthAccountStage,
    funding: target.dataset.growthFunding,
    decision: target.dataset.growthDecision || fallbackDecision,
    placement: target.dataset.growthPlacement || target.dataset.ctaPlacement || 'decision-impression',
  });
}

function buildDecisionEventPayload({ type, location, document, session, source, market, product, campaign, publisher, accountStage, funding, decision, placement }) {
  const growth = getGrowthContext(location.search, { pathname: location.pathname, market, product, campaign, publisher, accountStage, funding });
  const experiment = getExperimentContext(location.search, { pathname: location.pathname, market: growth.market });
  const safeDecision = sanitizeGrowthSlug(decision);
  const safePlacement = sanitizeGrowthSlug(placement || 'decision');
  if (!safeDecision || !safePlacement) return null;
  return {
    version: 2, type, eventId: crypto.randomUUID(), session,
    page: location.pathname,
    locale: resolvedAnalyticsLocale(location, document),
    source,
    market: growth.market,
    product: growth.product,
    device: detectDeviceClass(),
    ...experiment,
    decision: safeDecision,
    placement: safePlacement,
    ...(growth.campaign ? { campaign: growth.campaign } : {}),
    ...(growth.publisher ? { publisher: growth.publisher } : {}),
    ...(growth.accountStage ? { accountStage: growth.accountStage } : {}),
    ...(growth.funding ? { funding: growth.funding } : {}),
  };
}

function analyticsAllowed() {
  if (analyticsSuppressedForPage) return false;
  if (typeof window === 'undefined') return false;
  if (typeof navigator !== 'undefined' && navigator.webdriver) return false;
  if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') return false;
  if (typeof window !== 'undefined' && window.doNotTrack === '1') return false;
  if (typeof navigator !== 'undefined' && navigator.globalPrivacyControl) return false;
  if (typeof navigator !== 'undefined' && /bot|crawler|spider|headless/i.test(navigator.userAgent || '')) return false;
  if (typeof location !== 'undefined' && new URLSearchParams(location.search || '').has('analytics_test')) return false;
  return true;
}

export function sendGrowthEvent(payload, fetcher = fetch) {
  if (!payload || !uuid.test(payload.eventId) || !uuid.test(payload.session)) return Promise.resolve(false);
  return fetcher('/api/analytics/cta', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload), keepalive: true, credentials: 'same-origin',
  }).then((response) => response.ok).catch(() => false);
}

// An outgoing referral click is not an exchange registration or commission.
// No API keys, account IDs, commission amounts, click IDs, complete referrer URLs,
// or arbitrary query strings are sent.
export function installCtaAnalytics() {
  if (typeof window === 'undefined' || window.__nexuCtaInstalled) return;
  window.__nexuCtaInstalled = true;
  if (!analyticsAllowed()) { analyticsSuppressedForPage = true; return; }
  let session;
  let source = 'direct';
  try {
    session = sessionStorage.getItem('nexu-cta-session') || crypto.randomUUID();
    sessionStorage.setItem('nexu-cta-session', session);
    source = sanitizeCtaSource(sessionStorage.getItem('nexu-cta-source'));
    if (!source) {
      source = firstTouchSource({ search: location.search, referrer: document.referrer, origin: location.origin });
      sessionStorage.setItem('nexu-cta-source', source);
    }
  } catch { session = crypto.randomUUID(); source = source || 'direct'; }
  const sent = new Set();
  const visible = new Set();
  const visibleGrowthSurfaces = new Set();
  const visibleDecisionImpressions = new Set();
  const sendPageView = (input = {}) => sendGrowthPageViewOnce({ session, source, market: input.market, product: input.product, campaign: input.campaign, publisher: input.publisher, accountStage: input.accountStage, funding: input.funding });
  const collect = (event) => {
    if (!analyticsAllowed() || !event.isTrusted || event.defaultPrevented || (event.type === 'auxclick' && event.button !== 1)) return;
    const anchor = event.target?.closest?.('a[href]');
    if (!anchor || anchor.closest('[data-analytics-exclude]')) return;
    const platform = referralPlatform(anchor.href);
    if (!platform) return;
    const payload = buildCtaPayload({ anchor, location, document, session, source });
    if (!payload) return;
    const sentKey = referralClickPersistenceIdentity(payload);
    if (sent.has(sentKey)) return;
    sent.add(sentKey);
    const handoff = buildOutboundHandoffPayload({ anchor, location, document, session, source });
    sendGrowthEvent(payload).then((ok) => { if (!ok) sent.delete(sentKey); });
    sendGrowthEvent(handoff).then((ok) => { if (!ok) sent.delete(sentKey); });
  };
  const collectTelegram = (event) => {
    if (!analyticsAllowed() || !event.isTrusted || event.defaultPrevented || (event.type === 'auxclick' && event.button !== 1)) return;
    const anchor = event.target?.closest?.('a[href]');
    if (!anchor || anchor.closest('[data-analytics-exclude]') || !isTelegramCta(anchor)) return;
    const payload = buildTelegramHandoffPayload({ anchor, location, document, session, source });
    if (!payload) return;
    sendGrowthEvent(payload);
  };
  const observeVisible = (anchor) => {
    const payload = buildCtaVisibilityPayload({ anchor, location, document, session, source });
    if (!payload) return;
    const visibleKey = ctaVisibilityIdentity(payload);
    if (visible.has(visibleKey)) return;
    visible.add(visibleKey);
    sendGrowthEvent(payload).then((ok) => { if (!ok) visible.delete(visibleKey); });
  };
  const observeGrowthSurface = (target) => {
    if (!isGrowthSurface(target) || target.closest?.('[data-analytics-exclude]')) return;
    const growth = getGrowthContext(location.search, {
      pathname: location.pathname,
      market: target.dataset.growthMarket,
      product: target.dataset.growthProduct,
      campaign: target.dataset.growthCampaign,
      publisher: target.dataset.growthPublisher,
      accountStage: target.dataset.growthAccountStage,
      funding: target.dataset.growthFunding,
    });
    const placement = sanitizeGrowthSlug(target.dataset.growthPlacement || target.dataset.ctaPlacement || 'surface') || 'surface';
    const key = `${location.pathname}:${growth.market}:${growth.product}:${growth.campaign || 'unknown'}:${growth.publisher || 'unknown'}:${growth.accountStage || 'unknown'}:${growth.funding || 'unknown'}:${placement}`;
    if (visibleGrowthSurfaces.has(key)) return;
    visibleGrowthSurfaces.add(key);
    trackGrowthPageView({
      session,
      source,
      sendPageView,
      market: growth.market,
      product: growth.product,
      campaign: growth.campaign,
      publisher: growth.publisher,
      accountStage: growth.accountStage,
      funding: growth.funding,
    });
    const impression = buildDecisionImpressionPayload({ target, location, document, session, source });
    if (!impression) return;
    const impressionKey = `${impression.session}:${impression.page}:${impression.market}:${impression.product}:${impression.campaign || 'unknown'}:${impression.publisher || 'unknown'}:${impression.accountStage || 'unknown'}:${impression.funding || 'unknown'}:${impression.placement}:${impression.decision}`;
    if (visibleDecisionImpressions.has(impressionKey)) return;
    visibleDecisionImpressions.add(impressionKey);
    sendGrowthEvent(impression).then((ok) => { if (!ok) visibleDecisionImpressions.delete(impressionKey); });
  };
  window.nexuTrackGrowthPageView = (input = {}) => trackGrowthPageView({ ...input, session, source, sendPageView });
  window.nexuTrackGrowthDecision = (input = {}) => trackGrowthDecision({ ...input, session, source });
  const collectDecision = (event) => {
    if (!event.isTrusted || event.defaultPrevented) return;
    const target = event.target?.closest?.('[data-growth-decision]');
    if (!target) return;
    trackGrowthDecision({
      session,
      source,
      decision: target.dataset.growthDecision,
      placement: target.dataset.growthPlacement || target.dataset.ctaPlacement || 'decision',
      market: target.dataset.growthMarket,
      product: target.dataset.growthProduct,
      campaign: target.dataset.growthCampaign,
      publisher: target.dataset.growthPublisher,
      accountStage: target.dataset.growthAccountStage,
      funding: target.dataset.growthFunding,
    });
  };
  sendPageView();
  if (typeof IntersectionObserver === 'function') {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        observeVisible(entry.target);
        observeGrowthSurface(entry.target);
      }
    }), { threshold: 0.25 });
    const observeTargets = (root) => root.querySelectorAll?.('a[href], [data-growth-decision]').forEach((target) => {
      if (referralPlatform(target.href) || isGrowthSurface(target)) observer.observe(target);
    });
    observeTargets(document);
    if (typeof MutationObserver === 'function' && document.body) {
      const mutations = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          if (node.matches?.('a[href], [data-growth-decision]')) observeTargets(node.parentElement || document);
          observeTargets(node);
        }
      })));
      mutations.observe(document.body, { childList: true, subtree: true });
    }
  }
  document.addEventListener('click', collectDecision);
  document.addEventListener('click', collectTelegram);
  document.addEventListener('auxclick', collectTelegram);
  document.addEventListener('click', collect);
  document.addEventListener('auxclick', collect);
}

function ctaVisibilityIdentity(payload) {
  return [
    payload.session,
    payload.page,
    payload.market || 'unknown',
    payload.product || 'unknown',
    payload.accountStage || 'unknown',
    payload.funding || 'unknown',
    payload.platform || 'unknown',
    payload.placement || 'existing-link',
    payload.experiment || 'none',
    payload.variant || 'control',
  ].join(':');
}

function isGrowthSurface(target) {
  if (!target?.dataset) return false;
  return Boolean(target.dataset.growthDecision || target.dataset.growthCampaign || target.dataset.growthMarket || target.dataset.growthProduct || isTelegramCta(target));
}

function sendGrowthPageViewOnce({ session, source, market, product, campaign, publisher, accountStage, funding } = {}) {
  if (!analyticsAllowed() || !session) return false;
  const growth = getGrowthContext(location.search, { pathname: location.pathname, market, product, campaign, publisher, accountStage, funding });
  const key = `${session}:${location.pathname}:${growth.market}:${growth.product}:${growth.campaign || 'unknown'}:${growth.publisher || 'unknown'}:${growth.accountStage || 'unknown'}:${growth.funding || 'unknown'}`;
  if (sentPageViewBySession.has(key)) return false;
  sentPageViewBySession.add(key);
  const payload = buildGrowthPageView({ location, document, session, source });
  payload.market = growth.market;
  payload.product = growth.product;
  if (growth.campaign) payload.campaign = growth.campaign;
  if (growth.publisher) payload.publisher = growth.publisher;
  if (growth.accountStage) payload.accountStage = growth.accountStage;
  if (growth.funding) payload.funding = growth.funding;
  sendGrowthEvent(payload).then((ok) => { if (!ok) sentPageViewBySession.delete(key); });
  return true;
}

export function trackGrowthDecision({ market, product, campaign, publisher, accountStage, funding, decision, placement, session, source } = {}) {
  if (!analyticsAllowed()) return false;
  const activeSession = session || (() => {
    try { return sessionStorage.getItem('nexu-cta-session'); } catch { return null; }
  })();
  if (!activeSession) return false;
  const activeSource = sanitizeCtaSource(source) || (() => {
    try { return sanitizeCtaSource(sessionStorage.getItem('nexu-cta-source')) || 'direct'; } catch { return 'direct'; }
  })();
  const safeMarket = sanitizeMarket(market) || getGrowthContext(location.search, { pathname: location.pathname }).market;
  const safeProduct = sanitizeProduct(product) || getGrowthContext(location.search, { pathname: location.pathname }).product;
  const safeDecision = sanitizeGrowthSlug(decision);
  const safePlacement = sanitizeGrowthSlug(placement || 'decision');
  if (!safeDecision || !safePlacement) return false;
  const growth = getGrowthContext(location.search, { pathname: location.pathname, market: safeMarket, product: safeProduct, campaign, publisher, accountStage, funding });
  sendGrowthPageViewOnce({ session: activeSession, source: activeSource, market: safeMarket, product: safeProduct, campaign, publisher, accountStage, funding });
  const key = `${activeSession}:${location.pathname}:${safeMarket}:${safeProduct}:${growth.accountStage || 'unknown'}:${growth.funding || 'unknown'}:${safePlacement}`;
  if (lastDecisionBySession.get(key)?.decision === safeDecision) return false;
  const attempt = { decision: safeDecision };
  lastDecisionBySession.set(key, attempt);
  const payload = buildGrowthDecisionPayload({
    location, document, session: activeSession, source: activeSource,
    market: safeMarket, product: safeProduct, campaign, publisher, accountStage, funding, decision: safeDecision, placement: safePlacement,
  });
  sendGrowthEvent(payload).then((ok) => {
    if (!ok && lastDecisionBySession.get(key) === attempt) lastDecisionBySession.delete(key);
  });
  return true;
}

export function trackGrowthPageView({ market, product, campaign, publisher, accountStage, funding, session, source, sendPageView } = {}) {
  if (!analyticsAllowed()) return false;
  if (typeof sendPageView === 'function') {
    sendPageView({ market, product, campaign, publisher, accountStage, funding });
    return true;
  }
  const activeSession = session || (() => {
    try { return sessionStorage.getItem('nexu-cta-session'); } catch { return null; }
  })();
  if (!activeSession) return false;
  const activeSource = sanitizeCtaSource(source) || (() => {
    try { return sanitizeCtaSource(sessionStorage.getItem('nexu-cta-source')) || 'direct'; } catch { return 'direct'; }
  })();
  return sendGrowthPageViewOnce({ session: activeSession, source: activeSource, market, product, campaign, publisher, accountStage, funding });
}

import test from 'node:test';
import { loopbackListenSkip } from './helpers/environment.mjs';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, mkdir, readdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createServer as createHttpServer } from 'node:http';
import { createCtaCollector, validateCta } from '../server/cta-collector.mjs';
import { createProductionServer } from '../server.mjs';
import { buildCtaPayload, buildCtaVisibilityPayload, buildDecisionImpressionPayload, buildOutboundHandoffPayload, buildGrowthDecisionPayload, buildGrowthPageView, buildTelegramHandoffPayload, detectDeviceClass, firstTouchSource, getExperimentContext, installCtaAnalytics, referralPlatform, sanitizeCtaSource, trackGrowthDecision } from '../src/data/cta-analytics.js';

const event = () => ({version:1,type:'referral_click',eventId:randomUUID(),session:randomUUID(),platform:'binance',page:'/exchanges/binance',locale:'zh-Hans',source:'google.com',placement:'detail-primary'});
const pageView = () => ({version:2,type:'page_view',eventId:randomUUID(),session:randomUUID(),page:'/markets/br',locale:'pt-BR',source:'creator_a',market:'BR',product:'spot',campaign:'br_pix',publisher:'creator_a'});
const impression = () => ({version:2,type:'decision_impression',eventId:randomUUID(),session:randomUUID(),page:'/markets/br',locale:'pt-BR',source:'creator_a',market:'BR',product:'spot',campaign:'br_pix',publisher:'creator_a',decision:'binance-vs-okx',placement:'market-card'});
const decision = () => ({version:2,type:'decision_select',eventId:randomUUID(),session:randomUUID(),page:'/markets/br',locale:'pt-BR',source:'creator_a',market:'BR',product:'spot',campaign:'br_pix',publisher:'creator_a',decision:'binance-vs-okx',placement:'market-card'});
const click = () => ({version:2,type:'referral_click',eventId:randomUUID(),session:randomUUID(),platform:'binance',page:'/markets/br',locale:'pt-BR',source:'creator_a',placement:'market-primary',market:'BR',product:'spot',campaign:'br_pix',publisher:'creator_a'});
const request = (data, origin='http://localhost:4199', contentType='application/json') => new Request('http://localhost:4199/api/analytics/cta',{method:'POST',headers:{origin,'content-type':contentType,'user-agent':'Mozilla/5.0'},body:JSON.stringify(data)});
test('exact partner URLs only; editorial and Telegram links excluded', () => {
 assert.equal(referralPlatform('https://accounts.binance.com/register?ref=11350287'),'binance');
 assert.equal(referralPlatform('https://accounts.binance.com/register?ref=wrong'),null);
 assert.equal(referralPlatform('https://www.binance.com/en/fee'),null);
 assert.equal(referralPlatform('https://t.me/LuckyCryptoClupManagerBot'),null);
});

test('first-touch source prefers safe campaign source without storing click IDs', () => {
 assert.equal(firstTouchSource({search:'?utm_source=telegram',origin:'https://nexualpha.com'}),'telegram');
 assert.equal(firstTouchSource({search:'?utm_source=tg_channel&utm_medium=broadcast',origin:'https://nexualpha.com'}),'tg_channel');
 assert.equal(firstTouchSource({search:'?gclid=secret-click-id',origin:'https://nexualpha.com'}),'google-ads');
 assert.equal(firstTouchSource({search:'?fbclid=secret-click-id',origin:'https://nexualpha.com'}),'facebook-ads');
 assert.equal(firstTouchSource({search:'?msclkid=secret-click-id',origin:'https://nexualpha.com'}),'microsoft-ads');
 assert.equal(firstTouchSource({search:'?utm_source=https://evil.example/path?token=x&gclid=raw',referrer:'https://t.co/x',origin:'https://nexualpha.com'}),'google-ads');
 assert.equal(firstTouchSource({search:'?utm_source=https://evil.example/path?token=x',referrer:'https://t.co/x',origin:'https://nexualpha.com'}),'t.co');
 assert.equal(firstTouchSource({search:'',referrer:'https://nexualpha.com/page',origin:'https://nexualpha.com'}),'direct');
 assert.equal(sanitizeCtaSource('x'.repeat(61)),null);
});

test('event payload records safe campaign source and never includes raw query fields', () => {
 const payload = buildCtaPayload({
  anchor: { href: 'https://accounts.binance.com/register?ref=11350287', dataset: { ctaPlacement: 'hero_primary' } },
  location: { pathname: '/exchanges/binance', search: '?utm_source=telegram&gclid=secret-click-id' },
  document: { documentElement: { lang: 'zh-Hans' } },
  session: randomUUID(),
  source: firstTouchSource({search:'?utm_source=telegram&gclid=secret-click-id',origin:'https://nexualpha.com'}),
 });
 assert.equal(payload.source, 'telegram');
 assert.equal(payload.page, '/exchanges/binance');
 assert.equal(payload.platform, 'binance');
 assert.equal(payload.market, 'unknown');
 assert.equal(payload.product, 'unknown');
 assert.equal(validateCta(payload), true);
 assert.deepEqual(Object.keys(payload).sort(), ['device','eventId','locale','market','page','placement','platform','product','session','source','type','version'].sort());
});

test('CTA visibility and outbound handoff payloads preserve the same safe referral context', () => {
 const anchor = { href: 'https://accounts.binance.com/register?ref=11350287', dataset: { ctaPlacement: 'hero_primary' } };
 const input = { anchor, location: { pathname: '/exchanges/binance', search: '?market=BR&product=spot' }, document: { documentElement: { lang: 'pt-BR' } }, session: randomUUID(), source: 'telegram' };
 const visible = buildCtaVisibilityPayload(input);
 const handoff = buildOutboundHandoffPayload(input);
 assert.equal(visible.type, 'cta_visible');
 assert.equal(handoff.type, 'outbound_handoff');
 assert.equal(validateCta(visible), true);
 assert.equal(validateCta(handoff), true);
 assert.equal(visible.platform, handoff.platform);
 assert.equal(visible.placement, handoff.placement);
});

test('Telegram handoff payload is anonymous and keeps only website return contract fields', () => {
 const payload = buildTelegramHandoffPayload({
  anchor: {
   href: 'https://t.me/NexuAlphaAssistantBot?start=monitor_bitget_m_BR_l_ptBR_t_spot_c_secret',
   dataset: {
    ctaKind: 'telegram',
    ctaPlacement: 'venue-telegram-monitor',
    growthDecision: 'telegram_bitget',
    growthPlacement: 'venue-telegram',
    growthMarket: 'BR',
    growthProduct: 'spot',
    growthCampaign: 'week4_br_pix_return',
    telegramReturnHref: '/pt-br/exchanges/bitget?tg_return=bot&tg_venue=bitget&tg_expires=1790596800000&tg_market=BR&tg_locale=pt-BR&tg_product=spot&tg_campaign=week4_br_pix_return',
   },
  },
  location: { pathname: '/br/conta', search: '?market=BR&product=spot&utm_source=telegram' },
  document: { documentElement: { lang: 'pt-BR' } },
  session: randomUUID(),
  source: 'telegram',
 });

 assert.equal(payload.type, 'telegram_handoff');
 assert.equal(payload.market, 'BR');
 assert.equal(payload.product, 'spot');
 assert.equal(payload.campaign, 'week4_br_pix_return');
 assert.equal(payload.decision, 'telegram_bitget');
 assert.equal(payload.placement, 'venue-telegram');
 assert.equal(payload.telegramTarget, 'bot');
 assert.equal(payload.telegramReturnKind, 'venue');
 assert.equal(payload.telegramReturnPath, '/pt-br/exchanges/bitget');
 assert.equal(validateCta(payload), true);
 assert.deepEqual(Object.keys(payload).sort(), [
  'campaign',
  'decision',
  'device',
  'eventId',
  'locale',
  'market',
  'page',
  'placement',
  'product',
  'session',
  'source',
  'telegramReturnKind',
  'telegramReturnPath',
  'telegramTarget',
  'type',
  'version',
 ].sort());
 assert.doesNotMatch(JSON.stringify(payload), /start=|secret|11350287|nexu888|partner\.bitget/i);
});

test('collector accepts telegram handoff but rejects raw Telegram or invite material', () => {
 const payload = {
  version: 2,
  type: 'telegram_handoff',
  eventId: randomUUID(),
  session: randomUUID(),
  page: '/telegram',
  locale: 'en',
  source: 'telegram',
  market: 'global',
  product: 'spot',
  decision: 'telegram_start',
  placement: 'telegram-hub-bot',
  telegramTarget: 'bot',
  telegramReturnKind: 'route',
  telegramReturnPath: '/telegram',
 };
 assert.equal(validateCta(payload), true);
 assert.equal(validateCta({ ...payload, telegramReturnPath: '/telegram?start=secret' }), false);
 assert.equal(validateCta({ ...payload, telegramReturnPath: 'https://t.me/NexuAlphaAssistantBot' }), false);
 assert.equal(validateCta({ ...payload, telegramTarget: 'https://t.me/NexuAlphaAssistantBot' }), false);
 assert.equal(validateCta({ ...payload, inviteCode: 'nexu888' }), false);
});

test('sensitive and simulated payloads rejected', () => {
 assert.equal(validateCta(event()),true);
 assert.equal(validateCta(pageView()),true);
 assert.equal(validateCta(decision()),true);
 assert.equal(validateCta(click()),true);
 for (const change of [{commission:12},{type:'mock'},{page:'/?token=secret'},{source:'https://a.com/private'},{source:'x'.repeat(61)},{platform:'missing'}]) assert.equal(validateCta({...event(),...change}),false);
 for (const change of [{market:'Brazil'},{product:'all'},{publisher:'https://creator.example'},{rawUrl:'https://nexualpha.com'},{decision:'x'.repeat(61)}]) assert.equal(validateCta({...decision(),...change}),false);
 assert.equal(validateCta({...decision(), market:'OTHER'}),true);
 assert.equal(validateCta({...pageView(), platform:'binance'}),false);
});

test('device analytics is a coarse enum and never exposes raw user-agent', () => {
 assert.equal(detectDeviceClass({ navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' } }), 'mobile');
 assert.equal(detectDeviceClass({ navigator: { userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' } }), 'tablet');
 assert.equal(detectDeviceClass({ navigator: { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' } }), 'desktop');
 assert.equal(detectDeviceClass({ navigator: {} }), 'unknown');
});

test('experiment context rejects unregistered or inactive query attribution', () => {
 assert.deepEqual(getExperimentContext('?utm_experiment=hero_copy&utm_variant=b', { pathname: '/br', market: 'BR' }), {});
 assert.deepEqual(getExperimentContext('?utm_experiment=br_compare_entry_v1&utm_variant=control', { pathname: '/br', market: 'BR' }), {});
 assert.deepEqual(getExperimentContext('?utm_experiment=https%3A%2F%2Fevil.example&utm_variant=x'), {});
});

test('collector rejects unregistered, inactive, partial or mismatched experiment contexts', () => {
 const base = pageView();
 assert.equal(validateCta({ ...base, experiment: 'unregistered', variant: 'control' }), false);
 assert.equal(validateCta({ ...base, experiment: 'br_compare_entry_v1', variant: 'control' }), false);
 assert.equal(validateCta({ ...base, experiment: 'br_compare_entry_v1' }), false);
 assert.equal(validateCta({ ...base, variant: 'control' }), false);
});

test('collector locks one experiment variant per session and restores the lock after restart', async () => {
 const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-experiment-lock-'));
 const file = path.join(dir, 'events.jsonl');
 const registry = { br_compare_entry_v1: { ...((await import('../src/data/experiment-registry.js')).experimentRegistry.br_compare_entry_v1), status: 'ACTIVE' } };
 const base = { ...pageView(), page: '/br', market: 'BR', experiment: 'br_compare_entry_v1', variant: 'control' };
 const origin = 'https://nexualpha.com';
 try {
  let collector = createCtaCollector(file, { environment: 'production', origin, registry });
  assert.equal((await collector(request(base, origin), origin)).status, 204);
  assert.equal((await collector(request({ ...base, eventId: randomUUID(), variant: 'comparison' }, origin), origin)).status, 409);
  collector = createCtaCollector(file, { environment: 'production', origin, registry });
  await collector.ready;
  assert.equal((await collector(request({ ...base, eventId: randomUUID(), variant: 'comparison' }, origin), origin)).status, 409);
  const rows = (await readFile(file, 'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].variant, 'control');
 } finally { await rm(dir, { recursive: true, force: true }); }
});

test('v2 builders carry market context without raw identifiers', () => {
 const session = randomUUID();
 const page = buildGrowthPageView({
  location: { pathname: '/markets/br', search: '?market=BR&product=spot&utm_campaign=br_pix&publisher=creator_a&gclid=raw' },
  document: { documentElement: { lang: 'pt-BR' } },
  session,
  source: 'telegram',
 });
 assert.deepEqual({type:page.type,market:page.market,product:page.product,campaign:page.campaign,publisher:page.publisher}, {type:'page_view',market:'BR',product:'spot',campaign:'br_pix',publisher:'creator_a'});
 assert.equal('gclid' in page, false);
 const picked = buildGrowthDecisionPayload({
  location: { pathname: '/markets/br', search: '?market=BR&product=spot' },
  document: { documentElement: { lang: 'pt-BR' } },
  session,
  source: 'telegram',
  decision: 'binance',
  placement: 'home-platform-selector',
 });
 assert.equal(validateCta(picked), true);
 assert.equal(picked.decision, 'binance');
 const seen = buildDecisionImpressionPayload({
  target: { dataset: { growthDecision: 'binance', growthPlacement: 'home-platform-selector', growthMarket: 'BR', growthProduct: 'spot' } },
  location: { pathname: '/markets/br', search: '?market=BR&product=spot' },
  document: { documentElement: { lang: 'pt-BR' } },
  session,
  source: 'telegram',
 });
 assert.equal(validateCta(seen), true);
 assert.deepEqual({ type: seen.type, decision: seen.decision, placement: seen.placement, market: seen.market, product: seen.product }, {
  type: 'decision_impression',
  decision: 'binance',
  placement: 'home-platform-selector',
  market: 'BR',
  product: 'spot',
 });
 const homeIntent = buildGrowthDecisionPayload({
  location: { pathname: '/', search: '' },
  document: { documentElement: { lang: 'zh-Hans' } },
  session,
  source: 'direct',
  decision: 'compare_first',
  placement: 'home-intent-switch',
  market: 'unknown',
  product: 'spot',
 });
 assert.equal(validateCta(homeIntent), true);
	 assert.deepEqual({ decision: homeIntent.decision, placement: homeIntent.placement, source: homeIntent.source }, {
	  decision: 'compare_first',
	  placement: 'home-intent-switch',
	  source: 'direct',
	 });
 const funded = buildGrowthPageView({
  location: { pathname: '/mx', search: '?market=MX&product=spot&account_stage=new_account&funding=SPEI' },
  document: { documentElement: { lang: 'es-MX' } },
  session,
  source: 'creator',
 });
 assert.equal(validateCta(funded), true);
 assert.deepEqual({ market: funded.market, product: funded.product, accountStage: funded.accountStage, funding: funded.funding }, {
  market: 'MX',
  product: 'spot',
  accountStage: 'new_account',
  funding: 'SPEI',
 });
	 const brazil = buildGrowthPageView({
  location: { pathname: '/br', search: '?locale=pt-BR' },
  document: { documentElement: { lang: 'pt-BR' } },
  session,
  source: 'direct',
 });
 assert.equal(brazil.market, 'BR');
 assert.equal(brazil.product, 'spot');
});


test('direct growth decisions create one page-view denominator per market state', async () => {
 const previous = {
  window: globalThis.window,
  location: globalThis.location,
  document: globalThis.document,
  sessionStorage: globalThis.sessionStorage,
  fetch: globalThis.fetch,
 };
 const session = randomUUID();
 const rows = [];
 try {
  globalThis.window = {};
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0', doNotTrack: '0', webdriver: false, globalPrivacyControl: false }, configurable: true });
  globalThis.location = { pathname: '/br', search: '', origin: 'http://localhost:4199' };
  globalThis.document = { documentElement: { lang: 'pt-BR' }, referrer: '' };
  globalThis.sessionStorage = { getItem: (key) => key === 'nexu-cta-session' ? session : key === 'nexu-cta-source' ? 'telegram' : null };
  globalThis.fetch = async (_url, init) => { rows.push(JSON.parse(init.body)); return { ok: true }; };
  assert.equal(trackGrowthDecision({ decision: 'binance', placement: 'brazil-selector', market: 'BR', product: 'spot' }), true);
  assert.equal(trackGrowthDecision({ decision: 'binance', placement: 'brazil-selector', market: 'BR', product: 'spot' }), false);
  assert.equal(trackGrowthDecision({ decision: 'other', placement: 'brazil-selector', market: 'OTHER', product: 'unknown' }), true);
  assert.equal(trackGrowthDecision({ decision: 'perps', placement: 'brazil-selector', market: 'BR', product: 'perpetuals' }), true);
  assert.equal(trackGrowthDecision({ decision: 'spei', placement: 'brazil-selector', market: 'MX', product: 'spot', accountStage: 'new_account', funding: 'SPEI' }), true);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(rows.map((row) => `${row.type}:${row.market}:${row.product}:${row.accountStage || 'unknown'}:${row.funding || 'unknown'}`), [
    'page_view:BR:spot:unknown:unknown',
    'decision_select:BR:spot:unknown:unknown',
    'page_view:OTHER:unknown:unknown:unknown',
    'decision_select:OTHER:unknown:unknown:unknown',
    'page_view:BR:perpetuals:unknown:unknown',
    'decision_select:BR:perpetuals:unknown:unknown',
    'page_view:MX:spot:new_account:SPEI',
    'decision_select:MX:spot:new_account:SPEI',
  ]);
  assert.equal(rows.every(validateCta), true);
 } finally {
  for (const [key, value] of Object.entries(previous)) {
   if (key === 'navigator') {
    if (value) Object.defineProperty(globalThis, 'navigator', value); else delete globalThis.navigator;
   } else if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
 }
});

test('visible internal decisions and Telegram CTAs add bounded first-party page-view denominators', async () => {
 const previous = {
  window: globalThis.window,
  location: globalThis.location,
  document: globalThis.document,
  sessionStorage: globalThis.sessionStorage,
  fetch: globalThis.fetch,
  navigator: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
  IntersectionObserver: globalThis.IntersectionObserver,
  MutationObserver: globalThis.MutationObserver,
 };
 const session = randomUUID();
 const rows = [];
 const observers = [];
 const decisionSurface = {
  href: undefined,
  dataset: {
   growthDecision: 'binance',
   growthPlacement: 'home-selector',
   growthMarket: 'BR',
   growthProduct: 'spot',
   growthCampaign: 'internal_selector_impression',
   growthPublisher: 'onsite',
  },
  closest: () => null,
  matches: () => false,
  nodeType: 1,
 };
 const telegramCta = {
  href: 'https://t.me/NexuAlphaAssistantBot',
  dataset: {
   ctaKind: 'telegram',
   growthDecision: 'telegram_research',
   growthPlacement: 'telegram-hub',
   growthMarket: 'BR',
   growthProduct: 'spot',
   growthCampaign: 'telegram_hub_impression',
   growthPublisher: 'telegram',
  },
  closest: () => null,
  matches: () => true,
  nodeType: 1,
 };
 try {
  globalThis.window = {};
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0', doNotTrack: '0', webdriver: false, globalPrivacyControl: false }, configurable: true });
  globalThis.location = { pathname: '/br', search: '', origin: 'http://localhost:4199' };
  globalThis.document = {
   documentElement: { lang: 'pt-BR' },
   referrer: '',
   body: {},
   querySelectorAll: (selector) => {
    if (selector === 'a[href], [data-growth-decision]') return [decisionSurface, telegramCta];
    return [];
   },
   addEventListener: () => {},
  };
  globalThis.sessionStorage = {
   getItem: (key) => key === 'nexu-cta-session' ? session : key === 'nexu-cta-source' ? 'direct' : null,
   setItem: () => {},
  };
  globalThis.fetch = async (_url, init) => { rows.push(JSON.parse(init.body)); return { ok: true }; };
  globalThis.IntersectionObserver = class {
   constructor(callback) { this.callback = callback; observers.push(this); }
   observe(target) { this.targets = [...(this.targets || []), target]; }
  };
  globalThis.MutationObserver = class { observe() {} };
  installCtaAnalytics();
  assert.equal(observers.length, 1);
  observers[0].callback([
   { isIntersecting: true, target: decisionSurface },
   { isIntersecting: true, target: telegramCta },
  ]);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(rows.map((row) => [row.type, row.campaign, row.publisher]), [
   ['page_view', undefined, undefined],
   ['page_view', 'internal_selector_impression', 'onsite'],
   ['decision_impression', 'internal_selector_impression', 'onsite'],
   ['page_view', 'telegram_hub_impression', 'telegram'],
   ['decision_impression', 'telegram_hub_impression', 'telegram'],
  ]);
  assert.deepEqual(rows.filter((row) => row.type === 'decision_impression').map((row) => [row.decision, row.placement]), [
   ['binance', 'home-selector'],
   ['telegram_research', 'telegram-hub'],
  ]);
  assert.ok(rows.every((row) => validateCta(row)));
  assert.equal(rows.some((row) => 'platform' in row), false);
 } finally {
  if (globalThis.window) delete globalThis.window.__nexuCtaInstalled;
  for (const [key, value] of Object.entries(previous)) {
   if (key === 'navigator') {
    if (value) Object.defineProperty(globalThis, 'navigator', value); else delete globalThis.navigator;
   } else if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
 }
});

test('CTA visibility dedupes by semantic payload so same platform can report distinct placements', async () => {
 const previous = {
  window: globalThis.window,
  location: globalThis.location,
  document: globalThis.document,
  sessionStorage: globalThis.sessionStorage,
  fetch: globalThis.fetch,
  navigator: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
  IntersectionObserver: globalThis.IntersectionObserver,
  MutationObserver: globalThis.MutationObserver,
 };
 const session = randomUUID();
 const rows = [];
 const observers = [];
 const primary = {
  href: 'https://accounts.binance.com/register?ref=11350287',
  dataset: { ctaPlacement: 'home-primary' },
  closest: () => null,
  matches: () => true,
  nodeType: 1,
 };
 const secondary = {
  href: 'https://accounts.binance.com/register?ref=11350287',
  dataset: { ctaPlacement: 'home-secondary' },
  closest: () => null,
  matches: () => true,
  nodeType: 1,
 };
 try {
  globalThis.window = {};
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0', doNotTrack: '0', webdriver: false, globalPrivacyControl: false }, configurable: true });
  globalThis.location = { pathname: '/br', search: '?market=BR&product=spot&account_stage=new_account&funding=Pix', origin: 'http://localhost:4199' };
  globalThis.document = {
   documentElement: { lang: 'pt-BR' },
   referrer: '',
   body: {},
   querySelectorAll: (selector) => selector === 'a[href], [data-growth-decision]' ? [primary, secondary] : [],
   addEventListener: () => {},
  };
  globalThis.sessionStorage = {
   getItem: (key) => key === 'nexu-cta-session' ? session : key === 'nexu-cta-source' ? 'direct' : null,
   setItem: () => {},
  };
  globalThis.fetch = async (_url, init) => { rows.push(JSON.parse(init.body)); return { ok: true }; };
  globalThis.IntersectionObserver = class {
   constructor(callback) { this.callback = callback; observers.push(this); }
   observe(target) { this.targets = [...(this.targets || []), target]; }
  };
  globalThis.MutationObserver = class { observe() {} };

  installCtaAnalytics();
  assert.equal(observers.length, 1);
  observers[0].callback([
   { isIntersecting: true, target: primary },
   { isIntersecting: true, target: secondary },
   { isIntersecting: true, target: primary },
  ]);
  await new Promise((resolve) => setImmediate(resolve));

  const visibleRows = rows.filter((row) => row.type === 'cta_visible');
  assert.deepEqual(visibleRows.map((row) => [row.platform, row.placement, row.market, row.product, row.accountStage, row.funding]), [
   ['binance', 'home-primary', 'BR', 'spot', 'new_account', 'Pix'],
   ['binance', 'home-secondary', 'BR', 'spot', 'new_account', 'Pix'],
  ]);
  assert.equal(rows.filter((row) => row.type === 'page_view').length, 1);
  assert.ok(rows.every((row) => validateCta(row)));
 } finally {
  if (globalThis.window) delete globalThis.window.__nexuCtaInstalled;
  for (const [key, value] of Object.entries(previous)) {
   if (key === 'navigator') {
    if (value) Object.defineProperty(globalThis, 'navigator', value); else delete globalThis.navigator;
   } else if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
 }
});



test('direct growth decisions stop when privacy flags are enabled mid-session', async () => {
 const previous = {
  window: globalThis.window,
  location: globalThis.location,
  document: globalThis.document,
  sessionStorage: globalThis.sessionStorage,
  fetch: globalThis.fetch,
  navigator: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
 };
 const session = randomUUID();
 const rows = [];
 try {
  globalThis.window = {};
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0', doNotTrack: '0', webdriver: false, globalPrivacyControl: false }, configurable: true });
  globalThis.location = { pathname: '/br', search: '', origin: 'http://localhost:4199' };
  globalThis.document = { documentElement: { lang: 'pt-BR' }, referrer: '' };
  globalThis.sessionStorage = { getItem: (key) => key === 'nexu-cta-session' ? session : key === 'nexu-cta-source' ? 'direct' : null };
  globalThis.fetch = async (_url, init) => { rows.push(JSON.parse(init.body)); return { ok: true }; };
  assert.equal(trackGrowthDecision({ decision: 'binance', placement: 'privacy-selector', market: 'BR', product: 'spot' }), true);
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0', doNotTrack: '1', webdriver: false, globalPrivacyControl: false }, configurable: true });
  assert.equal(trackGrowthDecision({ decision: 'okx', placement: 'privacy-selector', market: 'OTHER', product: 'unknown' }), false);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(rows.map((row) => row.decision || row.type), ['page_view', 'binance']);
 } finally {
  for (const [key, value] of Object.entries(previous)) {
   if (key === 'navigator') {
    if (value) Object.defineProperty(globalThis, 'navigator', value); else delete globalThis.navigator;
   } else if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
 }
});

test('persists once through concurrent duplicates and restart, rejects foreign origin', async () => {
 const dir=await mkdtemp(path.join(os.tmpdir(),'nexu-cta-test-'));
 try {
  const file=path.join(dir,'test.jsonl'); const collect=createCtaCollector(file);const value=event();
  const responses=await Promise.all([collect(request(value),'http://localhost:4199'),collect(request({...value,eventId:randomUUID()}),'http://localhost:4199')]);
  assert.deepEqual(responses.map(r=>r.status),[204,204]);
  await createCtaCollector(file)(request(value),'http://localhost:4199');
  await collect(request({...value,session:randomUUID()}),'http://localhost:4199');
  assert.equal((await readFile(file,'utf8')).trim().split('\n').length,1);
  assert.equal((await collect(request(event(),'https://foreign.example'),'http://localhost:4199')).status,403);
  assert.equal((await collect(request({...event(),source:'tg_channel'},'http://localhost:4199','application/json; charset=utf-8'),'http://localhost:4199')).status,204);
  assert.equal((await collect(request(event(),'http://localhost:4199','application/json-bad'),'http://localhost:4199')).status,415);
  assert.equal((await collect(request({...event(),source:'x'.repeat(3000)}),'http://localhost:4199')).status,413);
 } finally {await rm(dir,{recursive:true,force:true});}
});

test('collector persists bounded decision impressions independently from selections', async () => {
 const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-decision-impression-'));
 try {
  const file = path.join(dir, 'test.jsonl');
  const collect = createCtaCollector(file);
  const session = randomUUID();
  const value = { ...impression(), session };
  assert.equal(validateCta(value), true);
  assert.equal((await collect(request(value), 'http://localhost:4199')).status, 204);
  assert.equal((await collect(request({ ...value, eventId: randomUUID() }), 'http://localhost:4199')).status, 204);
  assert.equal((await collect(request({ ...decision(), session }), 'http://localhost:4199')).status, 204);
  const rows = (await readFile(file, 'utf8')).trim().split('\n').map(JSON.parse);
  assert.deepEqual(rows.map((row) => row.type), ['decision_impression', 'decision_select']);
 } finally { await rm(dir, { recursive: true, force: true }); }
});

test('accepts controlled account-stage context without accepting arbitrary values', async () => {
  const file = path.join(await mkdtemp(path.join(os.tmpdir(), 'nexu-cta-stage-')), 'events.jsonl');
  const collector = createCtaCollector(file);
  const valid = pageView();
  valid.accountStage = 'existing_account';
  valid.market = 'MX';
  valid.funding = 'SPEI';
  const request = (body) => new Request('https://nexualpha.com/api/analytics/cta', { method: 'POST', headers: { origin: 'https://nexualpha.com', 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0' }, body: JSON.stringify(body) });
  assert.equal((await collector(request(valid), 'https://nexualpha.com')).status, 204);
  const rows = (await readFile(file, 'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(rows[0].accountStage, 'existing_account');
  assert.equal(rows[0].funding, 'SPEI');
  const invalid = { ...valid, eventId: randomUUID(), accountStage: 'email=leak' };
  assert.equal((await collector(request(invalid), 'https://nexualpha.com')).status, 400);
  const wrongMarketFunding = { ...valid, eventId: randomUUID(), funding: 'Pix' };
  assert.equal((await collector(request(wrongMarketFunding), 'https://nexualpha.com')).status, 400);
});

test('v2 page views dedupe by session page market product and referral clicks by session platform', async () => {
 const dir=await mkdtemp(path.join(os.tmpdir(),'nexu-growth-test-'));
 try {
  const file=path.join(dir,'test.jsonl'); const collect=createCtaCollector(file); const session=randomUUID();
  await collect(request({...pageView(),session,page:'/markets/br',market:'BR'}),'http://localhost:4199');
  await collect(request({...pageView(),eventId:randomUUID(),session,page:'/markets/br',market:'BR'}),'http://localhost:4199');
  await collect(request({...pageView(),eventId:randomUUID(),session,page:'/markets/br',market:'TW'}),'http://localhost:4199');
  await collect(request({...pageView(),eventId:randomUUID(),session,page:'/markets/br',market:'BR',product:'perpetuals'}),'http://localhost:4199');
  await collect(request({...click(),session,platform:'binance'}),'http://localhost:4199');
  await collect(request({...click(),eventId:randomUUID(),session,platform:'okx'}),'http://localhost:4199');
  await collect(request({...click(),eventId:randomUUID(),session,platform:'okx'}),'http://localhost:4199');
  assert.equal((await readFile(file,'utf8')).trim().split('\n').length,5);
 } finally {await rm(dir,{recursive:true,force:true});}
});

test('referral persistence keeps distinct page and placement context while deduping exact repeats', async () => {
 const dir=await mkdtemp(path.join(os.tmpdir(),'nexu-referral-context-'));
 try {
  const file=path.join(dir,'test.jsonl'); const collect=createCtaCollector(file); const session=randomUUID();
  const first={...click(),session,page:'/rates',placement:'rates-primary'};
  await collect(request(first),'http://localhost:4199');
  await collect(request({...first,eventId:randomUUID()}),'http://localhost:4199');
  await collect(request({...first,eventId:randomUUID(),placement:'rates-secondary'}),'http://localhost:4199');
  await collect(request({...first,eventId:randomUUID(),page:'/exchanges/binance',placement:'venue-primary'}),'http://localhost:4199');
  const rows=(await readFile(file,'utf8')).trim().split('\n').map(JSON.parse);
  assert.deepEqual(rows.map((row)=>[row.page,row.placement]),[
   ['/rates','rates-primary'],
   ['/rates','rates-secondary'],
   ['/exchanges/binance','venue-primary'],
  ]);
 } finally {await rm(dir,{recursive:true,force:true});}
});

test('page-view locale inference follows URL before React language hydration', () => {
  const session = randomUUID();
  const make = (pathname, search, lang = 'en') => buildGrowthPageView({
    location: { pathname, search },
    document: { documentElement: { lang } },
    session,
    source: 'creator',
  });
  assert.equal(make('/br', '?utm_source=creator').locale, 'pt-BR');
  assert.equal(make('/eu', '?locale=ja').locale, 'ja');
  assert.equal(make('/hk', '?locale=zh-Hant').locale, 'zh-Hant');
});

test('production collector requires explicit HTTPS origin and prevents environment mixing', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-production-cta-'));
  try {
    const file = path.join(dir, 'production.jsonl');
    assert.throws(() => createCtaCollector(file, { environment: 'production' }), /CTA_EXPLICIT_CONFIG_REQUIRED/);
    assert.throws(() => createCtaCollector(file, { environment: 'production', origin: 'http://nexualpha.com' }), /CTA_ORIGIN_INVALID/);
    const collect = createCtaCollector(file, { environment: 'production', origin: 'https://nexualpha.com' });
    assert.equal((await collect(request({ ...pageView(), market: 'MX', accountStage: 'new_account', funding: 'SPEI' }, 'https://nexualpha.com'), 'http://internal:8080')).status, 204);
    assert.equal((await collect(request(pageView(), 'https://foreign.example'), 'https://foreign.example')).status, 403);
    const row = JSON.parse((await readFile(file, 'utf8')).trim());
    assert.equal(row.environment, 'production');
    assert.equal(row.market, 'MX');
    assert.equal(row.accountStage, 'new_account');
    assert.equal(row.funding, 'SPEI');
    const marked = request(pageView(), 'https://nexualpha.com');
    marked.headers.set('x-nexualpha-analytics-mode', 'smoke');
    assert.equal((await collect(marked)).status, 400);
    const wrongEnvironment = createCtaCollector(file, { environment: 'smoke', origin: 'https://nexualpha.com' });
    await assert.rejects(wrongEnvironment.ready, /CTA_ENVIRONMENT_FILE_MISMATCH/);
    await assert.rejects(wrongEnvironment(request(pageView(), 'https://nexualpha.com')), /CTA_ENVIRONMENT_FILE_MISMATCH/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('production collector acknowledges crawler analytics without persisting intent events', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-production-crawler-'));
  try {
    const file = path.join(dir, 'production.jsonl');
    const collect = createCtaCollector(file, { environment: 'production', origin: 'https://nexualpha.com' });
    const crawlerRequest = request(pageView(), 'https://nexualpha.com');
    crawlerRequest.headers.set('user-agent', 'Mozilla/5.0 (Linux; Android 6.0.1) AppleWebKit/537.36 (compatible; GoogleOther)');
    const response = await collect(crawlerRequest, 'https://nexualpha.com');
    assert.equal(response.status, 204);
    await assert.rejects(readFile(file, 'utf8'), { code: 'ENOENT' });
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('production health endpoints separate live, web, CTA and Core readiness', { skip: await loopbackListenSkip() }, async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-health-http-'));
  const appRoot = path.join(dir, 'app');
  await mkdir(appRoot);
  let server;
  try {
    server = await createProductionServer({ appRoot, env: {}, worker: { fetch: async () => new Response('site-ok') } });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const health = await fetch(`${base}/healthz`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: 'ok', service: 'nexualpha-web' });
    const apiHealth = await fetch(`${base}/api/health`);
    assert.equal(apiHealth.status, 200);
    assert.deepEqual(await apiHealth.json(), { status: 'ok', service: 'nexualpha-web' });
    const liveHealth = await fetch(`${base}/health/live`);
    assert.equal(liveHealth.status, 200);
    assert.deepEqual(await liveHealth.json(), { status: 'live', service: 'nexualpha-web' });
    const apiLiveHealth = await fetch(`${base}/api/v1/health/live`);
    assert.equal(apiLiveHealth.status, 200);
    assert.deepEqual(await apiLiveHealth.json(), { status: 'live', service: 'nexualpha-web' });
    const webReady = await fetch(`${base}/health/web-ready`);
    assert.equal(webReady.status, 200);
    assert.deepEqual(await webReady.json(), { status: 'ready', service: 'nexualpha-web' });
    const apiWebReady = await fetch(`${base}/api/v1/health/web-ready`);
    assert.equal(apiWebReady.status, 200);
    assert.deepEqual(await apiWebReady.json(), { status: 'ready', service: 'nexualpha-web' });
    const readiness = await fetch(`${base}/readiness`);
    assert.equal(readiness.status, 200);
    assert.deepEqual(await readiness.json(), { status: 'ready', service: 'nexualpha-web' });
    const apiReady = await fetch(`${base}/api/ready`);
    assert.equal(apiReady.status, 200);
    assert.deepEqual(await apiReady.json(), { status: 'ready', service: 'nexualpha-web' });
    const operationalReady = await fetch(`${base}/health/ready`);
    assert.equal(operationalReady.status, 200);
    assert.deepEqual(await operationalReady.json(), { status: 'ready', service: 'nexualpha-web' });
    const ctaReady = await fetch(`${base}/health/cta-ready`);
    assert.equal(ctaReady.status, 503);
    assert.deepEqual(await ctaReady.json(), {
      status: 'unavailable',
      service: 'nexualpha-cta',
      configured: false,
      ready: false,
      reasonCode: 'CTA_COLLECTOR_NOT_CONFIGURED',
    });
    const dependencies = await fetch(`${base}/health/dependencies`);
    assert.equal(dependencies.status, 200);
    assert.deepEqual(await dependencies.json(), {
      status: 'degraded',
      dependencies: {
        web: { ready: true, status: 'ready' },
        cta: { ready: false, configured: false, status: 'unavailable', reasonCode: 'CTA_COLLECTOR_NOT_CONFIGURED' },
        core: { ready: false, configured: false, status: 'unavailable', reasonCode: 'CORE_API_ORIGIN_NOT_CONFIGURED' },
      },
    });
    const apiReadiness = await fetch(`${base}/api/v1/health/ready`);
    assert.equal(apiReadiness.status, 503);
    assert.deepEqual(await apiReadiness.json(), {
      status: 'unavailable',
      coreApi: 'not_configured',
      reasonCode: 'CORE_API_ORIGIN_NOT_CONFIGURED',
      dependencies: { coreApi: { configured: false, ready: false } },
      remediation: 'Configure CORE_API_ORIGIN or CORE_API_BASE_URL before enabling shared-core data routes.',
    });
    const readinessDetails = await fetch(`${base}/api/v1/health/readiness/details`);
    assert.equal(readinessDetails.status, 503);
    assert.deepEqual(await readinessDetails.json(), {
      status: 'unavailable',
      coreApi: 'not_configured',
      reasonCode: 'CORE_API_ORIGIN_NOT_CONFIGURED',
      dependencies: { coreApi: { configured: false, ready: false } },
      remediation: 'Configure CORE_API_ORIGIN or CORE_API_BASE_URL before enabling shared-core data routes.',
    });
  } finally { if (server?.listening) await new Promise((resolve) => server.close(resolve)); await rm(dir, { recursive: true, force: true }); }
});

test('production Core readiness probes the configured upstream with a timeout boundary', { skip: await loopbackListenSkip() }, async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-health-core-'));
  const appRoot = path.join(dir, 'app');
  await mkdir(appRoot);
  let core;
  let server;
  try {
    core = createHttpServer((req, res) => {
      if (req.url === '/api/v1/health/ready') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'ready', buildId: 'core-test', dependencies: { repository: { ready: true, source: 'prisma' } } }));
      } else {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'missing' }));
      }
    });
    await new Promise((resolve) => core.listen(0, '127.0.0.1', resolve));
    const coreOrigin = `http://127.0.0.1:${core.address().port}`;
    server = await createProductionServer({ appRoot, env: { CORE_API_ORIGIN: coreOrigin }, worker: { fetch: async () => new Response('site-ok') } });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;

    const ready = await fetch(`${base}/api/v1/health/ready`);
    assert.equal(ready.status, 200);
    assert.deepEqual(await ready.json(), {
      status: 'ready',
      coreApi: 'ready',
      dependencies: { coreApi: { configured: true, ready: true, upstreamStatus: 200 } },
    });
    const dependencies = await fetch(`${base}/health/dependencies`);
    assert.equal(dependencies.status, 200);
    const body = await dependencies.json();
    assert.equal(body.status, 'degraded');
    assert.equal(body.dependencies.web.ready, true);
    assert.equal(body.dependencies.core.ready, true);
    assert.equal(body.dependencies.core.upstreamStatus, 200);
  } finally {
    if (server?.listening) await new Promise((resolve) => server.close(resolve));
    if (core?.listening) await new Promise((resolve) => core.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('production HTTP entry records external private data, isolates smoke, and retains dedupe after restart', { skip: await loopbackListenSkip() }, async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-production-http-'));
  const appRoot = path.join(dir, 'app');
  await mkdir(appRoot);
  const env = { NODE_ENV: 'production', CTA_ENVIRONMENT: 'production', CTA_COLLECTOR_RELEASE: 'R58-injected-test', CTA_ALLOWED_ORIGIN: 'https://nexualpha.com',
    CTA_DATA_FILE: path.join(dir, 'private', 'production.jsonl'), CTA_SMOKE_DATA_FILE: path.join(dir, 'private', 'smoke.jsonl') };
  const worker = { fetch: async (_request, bindings) => new Response(bindings.CTA_ANALYTICS_ORIGIN || 'site-ok') };
  let server;
  const start = async () => {
    server = await createProductionServer({ env, appRoot, worker });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    return `http://127.0.0.1:${server.address().port}`;
  };
  const stop = () => new Promise((resolve) => { server.close(resolve); server.closeIdleConnections(); });
  try {
    let base = await start();
    const value = { ...pageView(), accountStage: 'new_account' };
    const post = (headers = {}, body = value, query = '') => fetch(`${base}/api/analytics/cta${query}`, { method: 'POST',
      headers: { origin: 'https://nexualpha.com', 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0', ...headers }, body: JSON.stringify(body) });
    assert.equal((await post()).status, 204);
    assert.equal((await post({ origin: 'http://internal:8080' })).status, 403);
    assert.equal((await post({ 'x-nexualpha-analytics-mode': 'smoke', 'user-agent': 'HeadlessChrome' })).status, 204);
    assert.equal((await post({}, { ...value, eventId: randomUUID(), session: randomUUID() }, '?analytics_test=1')).status, 204);
    assert.equal((await post({ 'x-nexualpha-analytics-mode': 'fake' })).status, 400);
    assert.equal(await (await fetch(base)).text(), 'site-ok');
    assert.equal((await fetch(`${base}/api/analytics/cta`)).status, 405);
    await stop();
    base = await start();
    assert.equal((await post()).status, 204);
    const live = (await readFile(env.CTA_DATA_FILE, 'utf8')).trim().split('\n').map(JSON.parse);
    const smoke = (await readFile(env.CTA_SMOKE_DATA_FILE, 'utf8')).trim().split('\n').map(JSON.parse);
    assert.equal(live.length, 1);
    assert.equal(smoke.length, 2);
    assert.ok(live.every((row) => row.environment === 'production'));
    assert.ok(smoke.every((row) => row.environment === 'smoke'));
    assert.ok(live.every((row) => row.collectorRelease === 'R58-injected-test'));
    assert.ok(smoke.every((row) => row.collectorRelease === 'R58-injected-test'));
    assert.deepEqual(await readdir(appRoot), []);
  } finally { if (server?.listening) await stop(); await rm(dir, { recursive: true, force: true }); }
});

test('production server rejects ambiguous storage/config', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-production-config-'));
  const appRoot = path.join(dir, 'app');
  await mkdir(appRoot);
  const env = { NODE_ENV: 'production', CTA_ENVIRONMENT: 'production', CTA_ALLOWED_ORIGIN: 'https://nexualpha.com', CTA_DATA_FILE: path.join(dir, 'private', 'production.jsonl') };
  const worker = { fetch: async (_request, bindings) => new Response(bindings.CTA_ANALYTICS_ORIGIN || 'missing') };
  try {
    await assert.rejects(createProductionServer({ appRoot, worker, env: { CTA_DATA_FILE: env.CTA_DATA_FILE } }), /CTA_EXPLICIT_CONFIG_REQUIRED/);
    await assert.rejects(createProductionServer({ appRoot, worker, env: { ...env, CTA_DATA_FILE: path.join(appRoot, 'events.jsonl') } }), /CTA_DATA_MUST_BE_OUTSIDE_APP/);
    await assert.rejects(createProductionServer({ appRoot, worker, env: { ...env, CTA_SMOKE_DATA_FILE: env.CTA_DATA_FILE } }), /CTA_SMOKE_FILE_MUST_BE_SEPARATE/);
    await assert.rejects(createProductionServer({ appRoot, worker, env: { ...env, CTA_ANALYTICS_ORIGIN: 'http://collector:8081' } }), /CTA_MULTIPLE_COLLECTORS_CONFIGURED/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('production server supports the existing proxy-only mode', { skip: await loopbackListenSkip() }, async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-production-proxy-'));
  const appRoot = path.join(dir, 'app');
  await mkdir(appRoot);
  const worker = { fetch: async (_request, bindings) => new Response(bindings.CTA_ANALYTICS_ORIGIN || 'missing') };
  let server;
  try {
    server = await createProductionServer({ appRoot, worker, env: { CTA_ANALYTICS_ORIGIN: 'http://collector:8081' } });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/analytics/cta`);
    assert.equal(await response.text(), 'http://collector:8081');
  } finally {
    if (server?.listening) await new Promise((resolve) => { server.close(resolve); server.closeIdleConnections(); });
    await rm(dir, { recursive: true, force: true });
  }
});

test('collector recovery preserves the first event after an incomplete trailing record', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-cta-tail-'));
  try {
    const file = path.join(dir, 'events.jsonl');
    await writeFile(file, '{"incomplete":');
    const collect = createCtaCollector(file);
    assert.equal((await collect(request(pageView()), 'http://localhost:4199')).status, 204);
    const lines = (await readFile(file, 'utf8')).trim().split('\n');
    assert.equal(lines.length, 2);
    assert.equal(JSON.parse(lines[1]).type, 'page_view');
  } finally { await rm(dir, { recursive: true, force: true }); }
});


test('collector release is a validated server-owned snapshot and cannot be forged by clients', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-collector-release-'));
  try {
    const file = path.join(dir, 'production.jsonl');
    const env = { CTA_COLLECTOR_RELEASE: 'R58-INTENT_TRUTH.20261001' };
    const collect = createCtaCollector(file, { env });
    env.CTA_COLLECTOR_RELEASE = 'later-mutated-value';
    assert.equal((await collect(request({ ...pageView(), collectorRelease: 'client-forged' }), 'http://localhost:4199')).status, 400);
    const value = pageView();
    assert.equal((await collect(request(value), 'http://localhost:4199')).status, 204);
    const row = JSON.parse((await readFile(file, 'utf8')).trim());
    assert.equal(row.collectorRelease, 'R58-INTENT_TRUTH.20261001');
    assert.ok(!('ip' in row));
    assert.ok(!('userAgent' in row));
    // Changing collector release never changes idempotency across restarts.
    const restart = createCtaCollector(file, { env: { CTA_COLLECTOR_RELEASE: 'R59' } });
    assert.equal((await restart(request(value), 'http://localhost:4199')).status, 204);
    assert.equal((await readFile(file, 'utf8')).trim().split('\n').length, 1);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('collector release has strict bounded syntax and missing provenance remains null', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-release-validation-'));
  try {
    const file = path.join(dir, 'unknown.jsonl');
    for (const invalid of ['', 'contains space', 'line\nbreak', 'R58\n', 'R58\r', 'token=value', 'x'.repeat(121), 123, false]) {
      assert.throws(() => createCtaCollector(file, { env: { CTA_COLLECTOR_RELEASE: invalid } }), /CTA_COLLECTOR_RELEASE_INVALID/);
    }
    const boundary = createCtaCollector(path.join(dir, 'boundary.jsonl'), { env: { CTA_COLLECTOR_RELEASE: 'x'.repeat(120) } });
    await boundary.ready;
    const collect = createCtaCollector(file, { env: {} });
    assert.equal((await collect(request(pageView()), 'http://localhost:4199')).status, 204);
    assert.equal(JSON.parse((await readFile(file, 'utf8')).trim()).collectorRelease, null);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('adding release provenance leaves historical records untouched and labels only new records', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-release-history-'));
  try {
    const file = path.join(dir, 'history.jsonl');
    const historical = JSON.stringify({ ...pageView(), receivedAt: new Date().toISOString(), environment: 'local-preview' }) + '\n';
    await writeFile(file, historical);
    const collect = createCtaCollector(file, { env: { CTA_COLLECTOR_RELEASE: 'R58' } });
    assert.equal((await collect(request(pageView()), 'http://localhost:4199')).status, 204);
    const text = await readFile(file, 'utf8');
    assert.ok(text.startsWith(historical));
    const rows = text.trim().split('\n').map(JSON.parse);
    assert.equal(Object.hasOwn(rows[0], 'collectorRelease'), false);
    assert.equal(rows[1].collectorRelease, 'R58');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('collector expires runtime idempotency keys using the same 30-day recovery window', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-cta-retention-'));
  try {
    const file = path.join(dir, 'events.jsonl');
    let clock = Date.parse('2026-10-14T00:00:00Z');
    const collect = createCtaCollector(file, { now: () => clock });
    const data = event();
    assert.equal((await collect(request(data), 'http://localhost:4199')).status, 204);
    clock += 29 * 86400000;
    assert.equal((await collect(request(data), 'http://localhost:4199')).status, 204);
    assert.equal((await readFile(file, 'utf8')).trim().split('\n').length, 1);
    clock += 2 * 86400000;
    assert.equal((await collect(request(data), 'http://localhost:4199')).status, 204);
    assert.equal((await readFile(file, 'utf8')).trim().split('\n').length, 2);
    const restarted = createCtaCollector(file, { now: () => clock });
    assert.equal((await restarted(request(data), 'http://localhost:4199')).status, 204);
    assert.equal((await readFile(file, 'utf8')).trim().split('\n').length, 2);
  } finally { await rm(dir, { recursive: true, force: true }); }
});


test('production collector excludes explicit QA user agents without storing them', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-qa-collector-'));
  try {
    const file = path.join(dir, 'events.jsonl');
    const collect = createCtaCollector(file, { environment: 'production', origin: 'https://nexualpha.com', env: { ANALYTICS_QA_UAS: 'internal-release-check', ANALYTICS_QA_IPS: '192.0.2.2' } });
    for (const ua of ['Playwright', 'NexuAlpha QA', 'Mozilla/5.0 internal-release-check']) {
      const req = request(pageView(), 'https://nexualpha.com');
      req.headers.set('user-agent', ua);
      assert.equal((await collect(req)).status, 204);
    }
    assert.equal((await collect(request(pageView(), 'https://nexualpha.com'), undefined, { clientIp: '192.0.2.2' })).status, 204);
    await assert.rejects(readFile(file, 'utf8'), { code: 'ENOENT' });
  } finally { await rm(dir, { recursive: true, force: true }); }
});

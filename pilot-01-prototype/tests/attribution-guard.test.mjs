import { APPROVED_CAMPAIGNS } from "../src/data/campaign-autodraft.generated.js";
import { campaignSignup, campaignTarget } from "../src/data/campaign-autodraft.js";
import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { parse } from 'parse5';
import ts from 'typescript';
import { partnerRegistry } from '../src/data/partner-registry.js';
import { publicCtaForVenue } from '../src/data/source-bound-cta.js';
import { EXCHANGE_FACTS } from '../src/data/exchange-facts.js';
import { BINANCE_OCTOBER_CAMPAIGNS, binanceCampaignUrl } from '../src/data/binance-october.js';
import { bitgetAllianceUrl } from '../src/data/bitget-alliance.js';
import { createGoRedirect, GO_ALIASES, SOURCE_BOUND_GO_SLUGS } from '../server/go-redirect.mjs';
import { KRAKEN_USDG_GO_SLUG } from '../src/data/kraken-usdg.js';
import { EXCHANGE_APK_BY_GO_SLUG } from '../src/data/exchange-apk.js';
import { SITEWIDE_PARAM_VENUES, sitewideReferral, exchangeVenueForUrl } from '../src/data/exchange-outbound.js';
import { BACKUP_SIGNUP_URLS } from '../src/data/backup-signup.js';
import { LEGAL_PAGE_PATHS } from '../src/data/legal-pages.js';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { ACADEMY_EPISODES } from '../src/data/academy.js';
import { COINS } from '../src/data/coins.js';
import { APP_DOWNLOAD_SLUGS, appDownloadPath } from '../src/data/app-download-path.js';
import { parsePublicRoute, localizedPath, LOCALE_PREFIX_BY_CODE } from '../src/data/locale-routing.js';
import { ATTRIBUTION_ALLOWLIST } from './helpers/attribution-allowlist.mjs';
import { NEUTRAL_CTA_LOCALE_LIST } from "../src/data/locale-policy.js";

const root = resolve(import.meta.dirname, '..');
const sourceHrefPattern = /(?:https?:\/\/[^\s<>"'`\\)\]}，。；）]+|\/go\/[a-z0-9-]+(?:\?[^\s<>"'`\\)\]}，。；）]*)?)/g;
const neutral = new Set(NEUTRAL_CTA_LOCALE_LIST);
const domains = new Map();
const targets = [];
const addDomain = (host, venue) => domains.set(host.replace(/^www\./, '').replace(/^app\./, ''), venue);
for (const [venue, partner] of Object.entries(partnerRegistry)) {
  addDomain(partner.officialDomain, venue);
  for (const href of [partner.registrationUrl, ...(partner.alternateRegistrationUrls || [])]) {
    const url = new URL(href);
    addDomain(url.hostname, venue);
    if (partner.hasReferral) targets.push({ venue, url });
  }
}
for (const [venue, facts] of Object.entries(EXCHANGE_FACTS)) {
  for (const href of facts.sourceUrls || []) addDomain(new URL(href).hostname, venue);
}
for (const [host, venue] of Object.entries({ 'gate.io': 'gate-io', 'gate.com': 'gate-io', 'gate.us': 'gate-io', 'bitget.com': 'bitget' })) addDomain(host, venue);
for (const key of Object.keys(BINANCE_OCTOBER_CAMPAIGNS)) targets.push({ venue: 'binance', url: new URL(binanceCampaignUrl(key)) });
targets.push({ venue: 'bitget', url: new URL(bitgetAllianceUrl()) });
for (const campaign of APPROVED_CAMPAIGNS) targets.push({ venue: campaign.venue, url: new URL(campaignTarget(campaign)) });
const goVenues = new Map([...Object.keys(partnerRegistry), ...SOURCE_BOUND_GO_SLUGS].map(venue => [venue, venue]));
for (const campaign of Object.values(BINANCE_OCTOBER_CAMPAIGNS)) goVenues.set(campaign.slug, 'binance');
for (const campaign of APPROVED_CAMPAIGNS) goVenues.set(`campaign-${campaign.id}`, campaign.venue);
goVenues.set('bitget-alliance', 'bitget');
goVenues.set(KRAKEN_USDG_GO_SLUG, 'kraken');
for (const venue of SITEWIDE_PARAM_VENUES) if (sitewideReferral(venue)) goVenues.set(`${venue}-page`, venue);
for (const venue of Object.keys(BACKUP_SIGNUP_URLS)) goVenues.set(`${venue}-alt`, venue);
// Official Android APK routes (/go/okx-apk, /go/binance-apk): tracked internal routes to the exchange's own APK host
// (host-locked and probed in server/exchange-apk-probe.mjs, covered by tests/exchange-apk.test.mjs). OKX's channel APK
// binds the code; Binance's does not, so its button sits next to the code. They are not code-carrying URL redirects.
const APK_GO_SLUGS = new Set(Object.keys(EXCHANGE_APK_BY_GO_SLUG));
for (const [slug, apk] of Object.entries(EXCHANGE_APK_BY_GO_SLUG)) goVenues.set(slug, apk.venue);
for (const [alias, slug] of Object.entries(GO_ALIASES)) if (goVenues.has(slug)) goVenues.set(alias, goVenues.get(slug));
// Owner 2026-10-14: rendered exchange registration links must use /go, even when the raw URL carries the code.
// Real external exchange links are allowed only on the legal and methodology pages; the reviewed
// allowlist below still covers non-referral venues and source literals stored in data (rendering rewrites those).
const DIRECT_LINK_PAGES = new Set([...LEGAL_PAGE_PATHS, '/methodology']);

function venueFor(url) {
  return [...domains].sort((a, b) => b[0].length - a[0].length)
    .find(([host]) => url.hostname === host || url.hostname.endsWith(`.${host}`))?.[1] || (/^(?:.*\.)?gate\.[a-z.]+$/.test(url.hostname) ? 'gate-io' : null);
}
function attributed(url, venue) {
  if (![...domains].some(([host, owner]) => owner === venue && (url.hostname === host || url.hostname.endsWith(`.${host}`)))) return false;
  const partner = partnerRegistry[venue];
  const codes = new Set([partner?.inviteCode, ...(partner?.inviteCodes || [])].filter(Boolean));
  for (const { venue: owner, url: registered } of targets) if (owner === venue) {
    for (const [key, value] of registered.searchParams) if (!key.startsWith('utm_')) codes.add(value);
  }
  if (venue === 'kraken' && codes.has(url.searchParams.get('referralCode'))) return true;
  if (/\/(?:join|signup|ref|refer|b|af)\//.test(url.pathname) && codes.has(url.pathname.split('/').at(-1))) return true;
  return targets.some(({ venue: owner, url: registered }) => {
    if (owner !== venue) return false;
    // A registered query parameter must have its exact registered value, not just a code substring.
    const params = [...registered.searchParams].filter(([key]) => !key.startsWith('utm_'));
    const hashParams = [...new URLSearchParams(registered.hash.split('?')[1] || '')];
    if (params.length || hashParams.length) return params.every(([key, value]) => url.searchParams.get(key) === value)
      && hashParams.every(([key, value]) => new URLSearchParams(url.hash.split('?')[1] || '').get(key) === value);
    // Opaque partner path codes are accepted only on their registered host and complete path.
    return url.hostname === registered.hostname && url.pathname === registered.pathname;
  });
}
function classify(href, attrs = {}, { rendered = false, directAllowed = false } = {}) {
  let url;
  try { url = new URL(href, 'https://nexualpha.com'); } catch { return null; }
  if (!['http:', 'https:'].includes(url.protocol)) return null;
  if (url.hostname === 'nexualpha.com') {
    if (!url.pathname.startsWith('/go/')) return null;
    const venue = goVenues.get(url.pathname.slice(4));
    return { venue: venue || 'unknown', signup: true, valid: Boolean(venue) };
  }
  const venue = venueFor(url);
  if (!venue) return null;
  if (attributed(url, venue)) return { venue, signup: true, valid: !rendered || directAllowed };
  const conversion = ['register', 'registration', 'signup', 'campaign'].includes(attrs['data-cta-kind']) || attrs.sourceKey === 'affiliateUrl';
  const unregisteredCode = ['ref', 'referralCode', 'inviteCode', 'invite_code', 'affiliate_id', 'channelCode', 'vipCode', 'rcode', 'reg', 'clacCode'].some(key => url.searchParams.has(key));
  // Strict for the venue's own domains (exchange-outbound.js); third-party doc hosts (GitBook) keep the reviewed allowlist.
  const strict = rendered && !directAllowed && partnerRegistry[venue]?.hasReferral && exchangeVenueForUrl(url) === venue;
  const allowed = !strict && !conversion && !unregisteredCode && ATTRIBUTION_ALLOWLIST.some(entry => entry.matches(url, attrs));
  return { venue, signup: !allowed, valid: allowed };
}
function files(dir, extensions) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? files(path, extensions) : extensions.some(ext => path.endsWith(ext)) ? [path] : [];
  });
}
function anchors(html) {
  const result = [];
  function walk(node) {
    if (node.tagName === 'a' || node.tagName === 'area') {
      const attrs = Object.fromEntries(node.attrs.map(attr => [attr.name, attr.value]));
      let parent = node.parentNode;
      while (parent) {
        const sourceClass = parent.attrs?.find(attr => attr.name === 'class' && ['research-references', 'research-facts', 'news-detail__footnote-list', 'activity-center-v3__source-actions', 'v3-versus-sources__links', 'official-research__source-head'].includes(attr.value))?.value;
        if (sourceClass) attrs.sourceContext = sourceClass;
        parent = parent.parentNode;
      }
      if (attrs.href) result.push(attrs);
    }
    for (const child of node.childNodes || []) walk(child);
    if (node.content) walk(node.content);
  }
  walk(parse(html));
  return result;
}
function violations(attrs, locale, options = {}) {
  const item = classify(attrs.href, attrs, options);
  const errors = [];
  if (item && !item.valid) errors.push('missing attribution or unreviewed source');
  if (locale === 'tr' && item?.venue === 'bitget') errors.push('Türkiye Bitget link');
  const registration = ['register', 'registration', 'signup', 'campaign'].includes(attrs['data-cta-kind']) || /#registration-path\b/.test(attrs.href);
  if (neutral.has(locale) && (item?.signup || registration)) errors.push('neutral-locale sign-up CTA');
  return { item, errors };
}

test('guard rejects bare/wrong-code links and enforces locale gates', () => {
  for (const href of ['https://www.binance.com/register', 'https://www.binance.com/register?ref=wrong&next=11350287', 'https://binance.com.evil.test/register?ref=11350287']) {
    if (href.includes('evil.test')) assert.equal(classify(href), null);
    else assert.equal(classify(href).valid, false, href);
  }
  for (const { url } of targets) assert.equal(classify(url.href)?.valid, true, url.href);
  for (const { url } of targets) {
    assert.equal(classify(url.href, {}, { rendered: true }).valid, false, `Rendered exchange links must use /go: ${url.href}`);
    assert.equal(classify(url.href, {}, { rendered: true, directAllowed: true }).valid, true, 'Legal/methodology direct-link exception');
  }
  assert.equal(classify('/go/okx?src=directory-card', {}, { rendered: true }).valid, true);
  assert.equal(classify('/go/not-registered').valid, false);
  assert.equal(classify('https://www.binance.com', { lang: 'en', 'aria-label': 'Sign up' }).valid, false);
  assert.equal(classify('https://www.gate.example/signup/nexubest').valid, false);
  assert.equal(classify('https://www.coinbase.com/signup', { 'data-cta-kind': 'source' }).valid, false);
  assert.equal(classify('https://www.binance.com', { sourceLiteral: true, sourceKey: 'affiliateUrl' }).valid, false);
  assert.equal(classify('https://www.binance.com', { sourceLiteral: true, sourceKey: 'href' }).valid, false);
  assert.equal(classify('https://www.binance.com/en/rewards-hub', { 'data-cta-kind': 'registration', class: 'campaign-card__source-link' }).valid, false);
  assert.equal(classify('https://www.binance.com/register?clacCode=11350287').valid, false);
  assert.equal(classify('https://www.binance.com/register?ref=113502870').valid, false);
  assert.equal(classify('https://www.binance.com/en/fee/trading?ref=wrong', { 'data-cta-kind': 'source' }).valid, false);
  assert.ok(violations({ href: '/go/bitget' }, 'tr').errors.length);
  for (const locale of neutral) for (const href of ['/go/binance-gifts', 'https://www.binance.com?ref=11350287', '/exchanges/okx#registration-path']) assert.ok(violations({ href }, locale).errors.length);
  assert.equal(classify('https://www.binance.com/en/fee/trading').valid, true, 'data literal: reviewed source');
  assert.equal(classify('https://www.binance.com/en/fee/trading', {}, { rendered: true }).valid, false, 'rendered body link without the code fails');
  assert.equal(classify('https://www.okx.com/help/x', { 'data-cta-kind': 'source' }, { rendered: true }).valid, false);
  assert.equal(classify('https://www.binance.com/en/fee/trading', {}, { rendered: true, directAllowed: true }).valid, true, 'legal/methodology pages keep real external links');
  assert.equal(classify('/go/binance-page?to=%2Fen%2Ffee%2Ftrading').valid, true);
  assert.equal(classify('/go/okx-page?to=%2Fhelp').valid, false, 'no sitewide referral route for OKX');
  assert.equal(classify('https://www.coinbase.com/fees', { 'data-cta-kind': 'source' }, { rendered: true }).valid, false, 'unreviewed non-referral path still fails');
  for (const locale of neutral) assert.ok(violations({ href: '/go/binance-page?to=%2F' }, locale).errors.length, 'no attributed citation links in neutral locales');
  assert.ok(violations({ href: '/go/bitget-alt' }, 'tr').errors.length, 'no Bitget backup link in Türkiye');
});

// Every /go route the site can emit resolves to a destination that carries the venue's code or campaign id.
test('every /go route in the registries redirects with the venue code or campaign id', async () => {
  const dir = await mkdtemp(resolve(tmpdir(), 'go-attr-'));
  await mkdir(resolve(dir, 'intel'), { recursive: true });
  const partners = Object.entries(partnerRegistry).filter(([, p]) => p.hasReferral).map(([slug, p]) => ({ slug, registrationUrl: p.registrationUrl }));
  await writeFile(resolve(dir, 'intel', 'partners.json'), JSON.stringify({ partners }));
  const now = () => new Date('2026-10-14T00:00:00Z'); // every October campaign running
  const up = createGoRedirect({ clientRoot: dir, now, mirrorHealth: async () => true });
  const down = createGoRedirect({ clientRoot: dir, now, mirrorHealth: async () => false });
  const campaignIds = { binance: Object.values(BINANCE_OCTOBER_CAMPAIGNS).map(c => c.ref), bitget: [new URL(bitgetAllianceUrl()).searchParams.get('clacCode')] };
  const carries = (location, venue) => {
    const url = new URL(location);
    if (attributed(url, venue)) return true;
    const partner = partnerRegistry[venue];
    const codes = [partner.inviteCode, ...(campaignIds[venue] || [])].filter(Boolean).map(code => String(code).toLowerCase());
    return [...url.searchParams.values()].some(value => codes.includes(value.toLowerCase()))
      || codes.includes(url.pathname.split('/').filter(Boolean).at(-1)?.toLowerCase())
      || [partner.registrationUrl, ...(partner.alternateRegistrationUrls || [])].includes(url.href);
  };
  const routes = [...goVenues].filter(([slug]) => !APK_GO_SLUGS.has(slug)).map(([slug, venue]) => [slug, venue, slug.endsWith('-page') ? '?to=%2Fen%2Fsupport%2Ffaq' : '']);
  const report = [];
  for (const [slug, venue, query] of routes) for (const [label, handle] of [['mirror-up', up], ['mirror-down', down]]) {
    if (label === 'mirror-down' && !slug.endsWith('-alt')) continue;
    const campaign = APPROVED_CAMPAIGNS.find(c => `campaign-${c.id}` === slug);
    const candidateMarkets = campaign?.allowedCountries.length ? campaign.allowedCountries : [undefined];
    const market = campaign ? candidateMarkets.find(market => campaignSignup(campaign, { market, now: Date.parse(campaign.startAt) + 1 })) : undefined;
    const campaignQuery = market ? `?market=${market}` : query;
    const routeHandle = campaign ? createGoRedirect({ clientRoot: dir, now: () => new Date(Date.parse(campaign.startAt) + 1) }) : handle;
    const response = await routeHandle(new Request(`https://nexualpha.com/go/${slug}${campaignQuery}`, { headers: { 'user-agent': 'Mozilla/5.0' } }));
    if (campaign && !campaignSignup(campaign, { market, now: Date.parse(campaign.startAt) + 1 })) {
      assert.equal(response.status, 302, `/go/${slug} remains gated when no permitted campaign market exists`);
      assert.equal(response.headers.get('location'), `/exchanges/${venue}`, 'denied campaigns return to the neutral venue profile');
      continue;
    }
    assert.equal(response.status, 302, `/go/${slug} resolves`);
    const location = response.headers.get('location');
    report.push(`/go/${slug}${query} (${label}) -> ${location}`);
    // The raw registry fixture deliberately includes placeholder/source-review routes that the public UI closes.
    // Their final redirect must enforce that same gate, even when a feed supplies an external target.
    if (publicCtaForVenue(venue, 'en').actionGate) {
      assert.equal(location, `/exchanges/${venue}`, 'UI-gated routes return to their neutral venue profile');
      continue;
    }
    if (SOURCE_BOUND_GO_SLUGS.includes(venue)) {
      const cta = publicCtaForVenue(venue, 'en');
      assert.equal(location, new URL(cta.registrationUrl).href, 'source-bound destination matches the public route');
      if (cta.hasReferral) assert.ok(cta.inviteCode && location.includes(encodeURIComponent(cta.inviteCode)), 'source-bound redirect retains its referral code');
      else {
        assert.equal(cta.inviteCode, null);
        assert.ok(!location.includes('NEXUALPHA'), 'official-only redirect never invents a code');
      }
      continue;
    }
    if (!partnerRegistry[venue]?.hasReferral) continue;
    assert.ok(carries(location, venue), `/go/${slug} (${label}) must carry the ${venue} code: ${location}`);
  }
  assert.equal((await up(new Request('https://nexualpha.com/go/binance-page?to=%2F%2Fevil.test'))).status, 404, 'no open redirect');
  assert.equal((await up(new Request('https://nexualpha.com/go/okx-page?to=%2Fhelp'))).status, 404, 'OKX has no sitewide referral parameter');
  console.log(`Resolved /go routes:\n${report.join('\n')}`);
});

test('built SSR and content/data exchange links retain attribution', async () => {
  const htmlFiles = files(resolve(root, 'dist/client'), ['.html']);
  assert.ok(htmlFiles.length > 1, 'Run npm run build first; SSR HTML inventory must exist');
  const manifest = JSON.parse(readFileSync(resolve(root, 'dist/client/prerender-manifest.json'), 'utf8'));
  assert.ok(Object.keys(manifest.routes).length > 100, 'Full prerender route inventory must exist');
  const routes = Object.values(manifest.routes);
  for (const prefix of ['/compare/', '/news/']) {
    assert.ok(routes.some(route => route.pathname.startsWith(prefix)), `Missing built page family: ${prefix}`);
  }
  for (const locale of ['tr', ...neutral]) assert.ok(routes.some(route => route.locale === locale), `Missing built locale: ${locale}`);
  const failures = [];
  const counts = new Map();
  const emittedGoLinks = new Set();
  let inspected = 0;
  let configDeclarations = 0;
  function check(path, attrs, locale, routeLabel = '', page = null) {
    const contentPath = page ? parsePublicRoute(page.split('?')[0]).contentPathname : null;
    const options = page ? { rendered: true, directAllowed: DIRECT_LINK_PAGES.has(contentPath) } : {};
    const { item, errors } = violations(attrs, locale, options);
    if (locale && item?.valid && attrs.href.startsWith('/go/')) emittedGoLinks.add(attrs.href);
    if (item) counts.set(item.venue, (counts.get(item.venue) || 0) + 1);
    for (const error of errors) failures.push(`${relative(root, path)}${routeLabel ? ` (${routeLabel})` : ""}: ${attrs.href} — ${error}`);
    inspected++;
  }
  for (const path of htmlFiles) {
    const page = '/' + relative(resolve(root, 'dist/client'), path).replace(/(?:\/)?index\.html$/, '').replace(/\.html$/, '');
    const html = readFileSync(path, 'utf8');
    const locale = parsePublicRoute(page).locale;
    for (const attrs of anchors(html)) check(path, attrs, locale, '', page || '/');
  }
  for (const route of Object.values(manifest.routes)) {
    for (const asset of [route.asset, ...Object.values(route.heroVariants || {})]) {
      const path = resolve(root, 'dist/client', asset.replace(/^\//, ''));
      const { html } = JSON.parse(readFileSync(path, 'utf8'));
      assert.ok(html?.includes('<h1'), `SSR content missing: ${asset}`);
      for (const attrs of anchors(html)) check(path, attrs, route.locale, '', route.pathname);
    }
  }
  // These families are request-time SSR, not prerender assets. Exercise the built renderer for their full
  // source inventory in every UI locale, rather than letting their absence from the manifest silently skip them.
  const { render } = await import('../dist/ssr/entry-server.js');
  const runtimePaths = ['/exchanges', '/activities', '/rates', '/funding-rates', '/embed/calculator',
    ...Object.keys(partnerRegistry).map(slug => `/exchanges/${slug}`),
    '/academy', ...ACADEMY_EPISODES.map(episode => `/academy/${episode.slug}`),
    ...APP_DOWNLOAD_SLUGS.map(appDownloadPath), '/coins', ...COINS.map(coin => `/coins/${coin.slug}`),
    '/activities/binance-october-gifts', '/activities/bitget-alliance', '/activities/bybit-stocks',
    ...APPROVED_CAMPAIGNS.map(c => `/activities/${c.id}`)];
  let runtimePages = 0;
  for (const locale of Object.keys(LOCALE_PREFIX_BY_CODE)) for (const pathname of runtimePaths) {
    const page = localizedPath(pathname, locale);
    const html = render(`https://nexualpha.com${page}`);
    const expectedMarkup = pathname === '/embed/calculator' ? 'embed-container--calculator' : '<h1';
    assert.ok(html.includes(expectedMarkup) && html.length > 2000, `Request-time SSR missing: ${page}`);
    for (const attrs of anchors(html)) check(resolve(root, 'dist/ssr/entry-server.js'), attrs, locale, page, page);
    runtimePages++;
  }
  const redirect = createGoRedirect({ clientRoot: resolve(root, 'dist/client'), mirrorHealth: async () => false });
  for (const href of emittedGoLinks) {
    const response = await redirect(new Request(`https://nexualpha.com${href}`));
    assert.equal(response.status, 302, `Emitted tracked link must resolve: ${href}`);
  }
  const sourceFiles = [...files(resolve(root, 'src/content'), ['.json', '.js', '.ts', '.tsx', '.jsx', '.md', '.mdx', '.html']), ...files(resolve(root, 'src/data'), ['.json', '.js', '.ts', '.tsx', '.jsx'])];
  for (const path of sourceFiles) {
    const source = readFileSync(path, 'utf8');
    if (/\.(?:md|mdx|html)$/.test(path)) {
      for (const match of source.matchAll(sourceHrefPattern)) check(path, { href: match[0].replaceAll('&amp;', '&').replace(/[.,;]+$/, '') }, null);
      continue;
    }
    // Parse literals, not comments or unfinished templates; SSR checks resolved dynamic hrefs.
    const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, path.endsWith('.json') ? ts.ScriptKind.JSON : /\.tsx?$/.test(path) ? ts.ScriptKind.TS : ts.ScriptKind.JS);
    function visit(node) {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        const ancestry = [];
        for (let ancestor = node.parent, depth = 0; ancestor && depth < 6; ancestor = ancestor.parent, depth++) {
          if (ts.isPropertyAssignment(ancestor)) ancestry.push(ancestor.name.getText(ast).replace(/^["']|["']$/g, ''));
          if (ts.isCallExpression(ancestor)) ancestry.push(ancestor.expression.getText(ast));
        }
        const sourceContext = ancestry.some(key => ['source', 'official', 'fact', 'faq', 'sources', 'sourceUrls', 'citations', 'references', 'merkleUrl', 'porAuditUrl', 'officialVerifyUrl', 'home', 'about', 'officialPage', 'unretainedDirectUrl'].includes(key));
        const sourceKey = ts.isPropertyAssignment(node.parent) ? node.parent.name.getText(ast).replace(/^["']|["']$/g, '') : null;
        for (const match of node.text.matchAll(sourceHrefPattern)) {
          const href = match[0].replaceAll('&amp;', '&').replace(/[.,;]+$/, '');
          // Non-referral registry registrationUrl declarations are configuration, not outbound links.
          // Their rendered buttons must still pass the guard; preserve owner configuration unchanged.
          const definition = ['src/data/partner-registry.js', 'src/data/venue-database.js'].includes(relative(root, path))
            && sourceKey === 'registrationUrl' && Object.values(partnerRegistry).some(p => !p.hasReferral && p.registrationUrl === href);
          if (definition) configDeclarations++;
          else check(path, { href, sourceLiteral: true, sourceKey, sourceContext }, null);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
  console.log(`Attribution guard: ${htmlFiles.length} HTML files, ${Object.keys(manifest.routes).length} prerender routes, ${runtimePages} request-time SSR pages, ${sourceFiles.length} source files, ${inspected} links inspected`);
  console.log(`  ${configDeclarations} non-referral registry declarations inventoried as configuration; their rendered links are checked`);
  for (const [venue, count] of [...counts].sort()) console.log(`  ${venue}: ${count}`);
  console.log(`Attribution failures: ${failures.length}\n${[...new Set(failures)].join('\n')}`);
  assert.equal(failures.length, 0, 'Exchange link violations are listed above with page path and href');
});

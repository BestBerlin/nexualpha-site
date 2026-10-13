import assert from 'node:assert/strict';
import test from 'node:test';
import {pickNewsOfferVenue} from '../src/data/news-offer.js';
import {renderPartnerGeoPolicy} from '../scripts/generate-partner-geo-policy.mjs';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import { PARTNER_GEO_RESTRICTIONS, buildPartnerGeoRestrictionsFeed, isPartnerPromotableIn, promotionCountries, unverifiedPartnerRestrictions, TURKEY_PROMOTED_PARTNERS } from '../src/data/partner-geo-restrictions.js';
import { publicCtaForVenue, regionalVenueCta } from '../src/data/source-bound-cta.js';
import { referralSeoFor, referralTitleAllowed } from '../src/data/referral-seo.js';

test('restrictions snapshot carries provenance and unverified entries', () => {
  assert.equal(readFileSync(new URL('../src/data/partner-geo-policy.generated.js', import.meta.url),'utf8'),renderPartnerGeoPolicy());
  assert.deepEqual(buildPartnerGeoRestrictionsFeed(), JSON.parse(readFileSync(new URL('./partner-geo-restrictions.snapshot.json', import.meta.url))));
  for (const entries of Object.values(PARTNER_GEO_RESTRICTIONS)) for (const row of entries) {
    assert.match(row.country, /^[A-Z]{2}(?:-[A-Z]{2})?$/);
    assert.match(row.source, /^https:\/\//);
    assert.equal(row.checked, '2026-10-11');
    assert.ok(row.reason);
    assert.equal(typeof row.verified, 'boolean');
  }
  assert.ok(unverifiedPartnerRestrictions().some(row => row.slug === 'bybit' && row.country === 'UZ'));
});
test('all documented countries block public and regional actions and referral titles', () => {
  for (const [slug, entries] of Object.entries(PARTNER_GEO_RESTRICTIONS)) for (const {country} of entries) {
    assert.equal(isPartnerPromotableIn(slug, {market: country}), false, `${slug}/${country}`);
    const cta = publicCtaForVenue(slug, 'en', country);
    assert.equal(cta.inviteCode, null);
    assert.equal(cta.registrationUrl, null);
    assert.equal(cta.hasPartnerRoute, false);
    assert.equal(regionalVenueCta(slug, 'en', country, 'spot').ctaState, 'blocked');
    assert.equal(referralSeoFor(slug, 'en', country), null);
  }
});
test('locale and country mapping distinguishes multi-country languages and UK from Ukrainian', () => {
  for (const locale of ['en','zh-Hans','zh-Hant','es','fr','de','it','ar']) assert.deepEqual(promotionCountries({locale}), []);
  for (const [locale,country] of [['tr','TR'],['vi','VN'],['id','ID'],['id-id','ID'],['ru','RU'],['ur','PK'],['uk','UA'],['uk-ua','UA'],['pt-BR','BR']]) assert.deepEqual(promotionCountries({locale}), [country]);
  assert.deepEqual(promotionCountries({locale:'uk',market:'/uk'}), ['GB']);
  assert.equal(isPartnerPromotableIn('gate-io', {locale:'es'}), true);
  assert.equal(isPartnerPromotableIn('gate-io', {locale:'es',market:'/ar-country'}), false);
  assert.equal(isPartnerPromotableIn('gate-io', {market:'/in'}), false);
  assert.equal(isPartnerPromotableIn('hyperliquid', {market:'CA'}), true);
  assert.equal(isPartnerPromotableIn('hyperliquid', {market:'CA-ON'}), false);
  assert.equal(isPartnerPromotableIn('gate-io', {locale:'uk'}), true);
  assert.equal(isPartnerPromotableIn('hyperliquid', {market:'SANCTIONED'}), false);
  assert.equal(isPartnerPromotableIn('kucoin', {market:'OCCUPIED_UKRAINE'}), false);
  assert.equal(isPartnerPromotableIn('binance', {market:'EU'}), false);
  assert.equal(isPartnerPromotableIn('binance', {market:'FR'}), false);
  // Vietnam (owner 2026-10-13, Resolution 05/2025/NQ-CP): vi pages and VN markets promote no partner, whatever market is named.
  assert.equal(isPartnerPromotableIn('gate-io', {locale:'vi',market:'/int'}), false);
  for (const slug of ['okx','bitget','binance','bybit','kraken']) for (const ctx of [{locale:'vi'},{locale:'vi',market:'/int'},{locale:'en',market:'VN'},{locale:'en',market:'/vn'},{locale:'zh-Hans',market:'VN'}]) assert.equal(isPartnerPromotableIn(slug, ctx), false, `${slug} ${JSON.stringify(ctx)}`);
  assert.equal(isPartnerPromotableIn('gate-io', {market:'/eu'}), false);
});
test('news offers carry their article market and skip restricted destinations', () => {
  assert.equal(pickNewsOfferVenue(['hyperliquid'], 'en', 'US'), null);
  assert.equal(pickNewsOfferVenue(['gate-io'], 'en', 'AR'), null);
  assert.ok(pickNewsOfferVenue(['hyperliquid'], 'en'));
  assert.equal(pickNewsOfferVenue(['gate-io','bitget'], 'en', 'AR').slug, 'bitget');
});

test('Turkey retains five promoted partners and Brazil and English remain ungated', () => {
  for (const slug of ['okx','binance','bybit','gate-io','mexc','bitget','htx','kucoin','kraken','hyperliquid','backpack']) {
    assert.equal(referralTitleAllowed(slug,'tr'), TURKEY_PROMOTED_PARTNERS.includes(slug), slug);
    assert.equal(isPartnerPromotableIn(slug,{locale:'en'}), true);
    assert.equal(isPartnerPromotableIn(slug,{locale:'pt-BR'}), true);
  }
});
// Codes are attribution tokens, not substrings of unrelated expiry timestamps.
function containsCodeToken(html, code) {
  if (!code) return false;
  const escaped = String(code).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, 'i').test(html);
}
test('geo code checks distinguish referral tokens from unrelated timestamps', () => {
  assert.equal(containsCodeToken('tg_expires=1792533648553', '48553'), false);
  assert.equal(containsCodeToken('<code>48553</code>', '48553'), true);
  assert.equal(containsCodeToken('href="/join/48553?src=beginner"', '48553'), true);
});
test('SSR venue and registration cards hide gated codes and destinations while retaining neutral facts', () => {
  const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const dir = mkdtempSync(path.join(root, 'tests/.tmp-geo-'));
  try {
    writeFileSync(path.join(dir,'entry.jsx'), `
      import React from 'react';
      import {renderToStaticMarkup} from 'react-dom/server';
      import {VenueDetailPage} from '../../src/components/v3/VenueDetailPageStatic.jsx';
      import {RegistrationCard} from '../../src/components/v3/RegistrationCard.jsx';
      import {NewsVenueOffer} from '../../src/components/v3/news/NewsVenueOffer.jsx';
      import {venueDatabase} from '../../src/data/venue-database.js';
      const cases = [['tr','bitget'],['vi','gate-io'],['id','gate-io'],['id','mexc'],['en','gate-io','AR'],['en','hyperliquid','US'],['pt-BR','gate-io'],['en','gate-io'], ...${JSON.stringify(Object.entries(PARTNER_GEO_RESTRICTIONS).flatMap(([slug,entries])=>entries.filter(()=>publicCtaForVenue(slug,'en').inviteCode).map(row=>['en',slug,row.country])))}];
      console.log(JSON.stringify(cases.map(([locale,slug,market])=>({locale,slug,market, html:renderToStaticMarkup(React.createElement(VenueDetailPage,{locale,venue:venueDatabase[slug],venues:Object.values(venueDatabase),updates:[],copy:{common:{dimension:'Dimension'},assetCapabilities:{none:'Pending'}},market:market || 'unknown',product:'spot'})),card:renderToStaticMarkup(React.createElement(RegistrationCard,{locale,venueSlug:slug,market:market || 'unknown',product:'spot'})),offer:renderToStaticMarkup(React.createElement(NewsVenueOffer,{venues:[slug],locale,market,articleSlug:'geo-test'}))}))));
    `);
    execFileSync(path.join(root,'node_modules/.bin/esbuild'),[path.join(dir,'entry.jsx'),'--bundle','--platform=node','--format=cjs','--loader:.css=empty','--log-level=error',`--outfile=${dir}/bundle.cjs`]);
    const cases=JSON.parse(execFileSync('node',[path.join(dir,'bundle.cjs')],{encoding:'utf8',maxBuffer:32*1024*1024}));
    for (const row of cases) {
      const access=publicCtaForVenue(row.slug,'en');
      for (const html of [row.html,row.card,row.offer]) {
        if (!isPartnerPromotableIn(row.slug,row)) {
          assert.ok(!containsCodeToken(html, access.inviteCode), `${row.locale}/${row.slug}: code leaked: ${html.slice(Math.max(0,html.indexOf(access.inviteCode)-100),html.indexOf(access.inviteCode)+150)}`);
          assert.ok(!html.includes(access.registrationUrl?.replaceAll('&','&amp;')), `${row.locale}/${row.slug}: referral leaked`);
        } else assert.ok(containsCodeToken(html, access.inviteCode), `${row.locale}/${row.slug}: code retained`);
      }
      assert.ok(row.html.includes(access.officialDomain), `${row.slug}: official facts retained`);
    }
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('Worker and SSR metadata hide gated codes including partner FAQ schema', async () => {
  const {routeMetadata} = await import('../worker/index.js');
  const {computeRouteSeo} = await import('../src/data/seo-injection.js');
  for (const route of ['/tr/exchanges/bitget','/vi/exchanges/gate-io','/id-id/exchanges/gate-io','/exchanges/hyperliquid?market=US']) {
    const slug=route.split('/exchanges/')[1].split('?')[0];
    const code=publicCtaForVenue(slug,'en').inviteCode;
    const url=new URL(route,'https://nexualpha.com');
    const worker=await routeMetadata(url,{});
    const ssr=computeRouteSeo({url:url.href});
    assert.ok(!JSON.stringify(worker).includes(code), `${route}: Worker metadata code leak: ${JSON.stringify(worker).slice(Math.max(0,JSON.stringify(worker).indexOf(code)-80),JSON.stringify(worker).indexOf(code)+160)}`);
    assert.ok(!JSON.stringify(ssr).includes(code), `${route}: SSR metadata code leak`);
  }
  const metadata=await routeMetadata(new URL('https://nexualpha.com/pt-br/exchanges/gate-io'),{});
  assert.ok(metadata.title.includes(publicCtaForVenue('gate-io','en').inviteCode));
});

test('served Worker HTML preserves explicit country context instead of using unscoped prerender codes', async () => {
  const {default: worker} = await import('../worker/index.js');
  const {render} = await import('../dist/news-ssr/entry-server.js');
  const assets = { fetch: async request => {
    const pathname = new URL(request.url).pathname;
    try {
      const body = readFileSync(new URL(`../dist/client${pathname === '/' ? '/index.html' : pathname}`, import.meta.url));
      return new Response(body, {headers:{'content-type':pathname.endsWith('.json') ? 'application/json' : 'text/html'}});
    } catch { return new Response('missing', {status:404}); }
  }};
  for (const [slug,market] of [['hyperliquid','US'],['gate-io','AR'],['bitget','TR'],['mexc','ID']]) {
    let renderedUrl;
    const request = new Request(`https://nexualpha.com/exchanges/${slug}?market=${market}&product=spot`);
    const response = await worker.fetch(request, {ASSETS:assets, NEWS_SSR_RENDER:(url,options)=>{renderedUrl=url; return render(url,options);}});
    const html=await response.text();
    assert.equal(response.status,200);
    assert.equal(new URL(renderedUrl).searchParams.get('market'),market);
    assert.equal(new URL(renderedUrl).searchParams.get('product'),'spot');
    assert.ok(!html.includes(publicCtaForVenue(slug,'en').inviteCode), `${slug}/${market}: served code leak`);
    assert.match(html, /<main\b/);
  }
  const noRenderer=await worker.fetch(new Request('https://nexualpha.com/exchanges/hyperliquid?market=US'),{ASSETS:assets});
  assert.ok(!(await noRenderer.text()).includes(publicCtaForVenue('hyperliquid','en').inviteCode), 'no renderer must not fall back to ungated snapshot');
});

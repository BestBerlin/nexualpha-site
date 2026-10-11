import {topicFaqSchemaEntries} from "../src/data/topic-source-registry.js";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { normalizeNewsFeed, localizedNewsSummary } from "../src/data/news-feed-client.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { routeInventory, buildSitemap, INDEXABLE_LOCALES } from "../scripts/generate-prerender-manifest.mjs";
import { assertSitemapPublicationBudget, buildSearchPublicationEligibility, selectSitemapPublicationEntries } from "../scripts/sitemap-publication-policy.mjs";

const brazilMetadata = await readFile(new URL("../dist/client/content/brazil-metadata.json", import.meta.url), "utf8");

const shell = '<!doctype html><html lang="en"><head><title>Base</title><meta name="description" content="Base"></head><body><div id="root"></div></body></html>';
const feedText = await readFile(new URL('../public/content/news-feed.json',import.meta.url), 'utf8');
const articles = normalizeNewsFeed(JSON.parse(feedText));
const inventory = routeInventory(articles);
const publication = selectSitemapPublicationEntries(inventory, articles, { allLocales: INDEXABLE_LOCALES });
const publicationEligibility = buildSearchPublicationEligibility(publication);
const fingerprint = createHash('sha256').update(feedText).digest('hex');
function assets({ manifest, bodies = {}, feed = feedText } = {}) {
  return { async fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === '/index.html') return new Response(shell, {headers:{'content-type':'text/html'}});
    if (path === '/content/brazil-metadata.json') return new Response(brazilMetadata, {headers:{'content-type':'application/json'}});
    if (path === '/content/news-feed.json') return new Response(feed, {headers:{'content-type':'application/json'}});
    if (path === '/prerender-manifest.json' && manifest) return Response.json(manifest);
    if (bodies[path]) return Response.json({html:bodies[path]});
    return new Response('missing',{status:404});
  } };
}
async function page(path, assetOptions) {
  const response=await worker.fetch(new Request(`https://nexualpha.com${path}`,{headers:{accept:'text/html'}}),{ASSETS: assets(assetOptions)});
  return {status:response.status, html:await response.text()};
}
function canonical(html) { return html.match(/rel="canonical" href="([^"]+)"/)?.[1]; }

const retiredVenueFactbooks = Object.freeze({
  htx: "htx",
  hashkey: "hashkey",
  aevo: "aevo",
});

function retiredVenueSlug(pathname) {
  return pathname.match(/^\/exchanges\/(htx|hashkey|aevo)$/)?.[1] || null;
}

function absoluteLocalized(pathname, locale) {
  return `https://nexualpha.com${localizedPath(pathname, locale)}`;
}

async function redirect(path) {
  const response = await worker.fetch(new Request(`https://nexualpha.com${path}`, {
    headers: { accept: "text/html" },
  }), { ASSETS: assets() });
  return { status: response.status, location: response.headers.get("location") };
}

test('every fixed route has matching status, canonical and indexing policy in its published content languages', async () => {
  for (const route of inventory) {
    for (const locale of route.locales || ['en','zh-Hans']) {
      const path=localizedPath(route.pathname, locale);
      const {status,html}=await page(path);
      const retiredSlug = retiredVenueSlug(route.pathname);
      if (route.pathname.startsWith('/activities/research/') && ['htx','hashkey','aevo'].some((slug) => route.pathname.endsWith(`/${slug}`))) {
        assert.equal(status, 404, path);
        continue;
      }
      if (retiredSlug) {
        assert.equal(status, 301, path);
        const target = absoluteLocalized(`/factbook/${retiredVenueFactbooks[retiredSlug]}`, locale);
        const response = await redirect(path);
        assert.equal(response.location, target, path);
        continue;
      }
      assert.equal(status,200,path);
      // News currently publishes Traditional Chinese as a display fallback while
      // its reviewed article corpus is Simplified Chinese. Keep the canonical
      // contract aligned with the published content language until a reviewed
      // zh-Hant article corpus exists.
      const newsUnpublishedLocale = route.pathname === '/news' && !['en', 'zh-Hans'].includes(locale);
      const newsCanonicalFallback = route.pathname === '/news' && locale === 'zh-Hant'
        ? localizedPath(route.pathname, 'zh-Hans')
        : newsUnpublishedLocale ? ' /news'.trim() : localizedPath(route.pathname, locale === 'zh-Hant' ? 'zh-Hant' : locale.startsWith('zh') ? 'zh-Hans' : locale);
      const expectedPath = route.pathname === '/mx' ? '/mx'
        : route.pathname.startsWith('/br') ? route.pathname
        : route.pathname.startsWith('/mx/') ? route.pathname
        : ['/tw', '/id', '/vn', '/hk', '/eu', '/uk', '/jp', '/kr', '/sg', '/int'].includes(route.pathname) ? route.pathname
        : route.pathname.startsWith('/tw/') || route.pathname.startsWith('/hk/') ? localizedPath(route.pathname, locale === 'en' ? 'zh-Hant' : locale)
        : newsCanonicalFallback;
      assert.equal(canonical(html),`https://nexualpha.com${expectedPath}`,path);
      const searchPublished = publicationEligibility.has(route.pathname, locale);
      assert.match(html,new RegExp(`name="robots" content="${searchPublished?'index':'noindex'},follow"`),path);
    }
  }
});

test('unknown or unsupported nested routes cannot become indexable soft 404 pages',async()=>{
  const paths=['/exchanges/unknown','/activities/research/htx','/activities/research/binance/source-note','/activities/missing','/activities/research/unknown','/topics/unknown','/factbook/unknown','/news/unknown','/compare/binance-vs-binance','/compare/binance-vs-okx-vs-missing','/compare/binance-vs-okx-vs-bybit-vs-bitget','/ref/partner/unknown','/unknown'];
  for(const path of paths){
    const {status,html}=await page(path);
    assert.equal(status,404,path);
    assert.match(html,/name="robots" content="noindex,nofollow"/,path);
    const client=computeRouteSeo({url:path,route:{name:'notFound'}});
    assert.equal(client.status,404,path);assert.equal(client.schemas.length,0,path);
  }
});

test('retired exchange profile URLs preserve indexed equity through factbook redirects', async () => {
  for (const slug of ['htx', 'hashkey', 'aevo']) {
    const response = await worker.fetch(new Request(`https://nexualpha.com/exchanges/${slug}`, {
      headers: { accept: 'text/html' },
    }), { ASSETS: assets() });
    assert.equal(response.status, 301, slug);
    assert.equal(response.headers.get('location'), `https://nexualpha.com/factbook/${slug}`, slug);
  }
});

test('retired comparison URLs preserve a bounded directory destination', async () => {
  for (const slug of ['aevo-vs-binance', 'hashkey-vs-binance', 'htx-vs-binance']) {
    const response = await worker.fetch(new Request(`https://nexualpha.com/compare/${slug}?locale=ja&market=JP`, {
      headers: { accept: 'text/html' },
    }), { ASSETS: assets() });
    assert.equal(response.status, 301, slug);
    assert.equal(response.headers.get('location'), 'https://nexualpha.com/ja/exchanges?market=JP', slug);
  }
});

test('valid three-venue comparison includes all participants and stays out of combinatorial indexing',async()=>{
  const path='/compare/binance-vs-okx-vs-bybit';
  const {status,html}=await page(path);
  assert.equal(status,200);assert.match(html,/<title[^>]*>Binance vs OKX vs Bybit/);
  assert.match(html,/"name":"Bybit"/);assert.match(html,/name="robots" content="noindex,follow"/);
  const graph=JSON.parse(html.match(/<script id="nexualpha-route-schema"[^>]*>(.*?)<\/script>/)[1])['@graph'];
  const pageSchema=graph.find(schema=>schema['@type']==='WebPage');
  assert.equal(pageSchema.dateModified,'2026-09-22');
  assert.equal(pageSchema.mainEntity['@type'],'ItemList');
  assert.equal(pageSchema.mainEntity.itemListElement.length,3);
  assert.deepEqual(pageSchema.isBasedOn,["https://www.binance.com","https://www.okx.com","https://www.bybit.com"]);
  const client=computeRouteSeo({url:path});assert.equal(client.status,200);assert.match(client.title,/Bybit/);
});

test('alias and UI locale canonical policies agree between Worker and browser',async()=>{
  const expectedHreflangByPath = {
    '/topics': ['en'],
    '/factbook': ['en'],
    '/partners/embed-guide': ['en', 'zh-Hans'],
    '/index.html': ['en','zh-Hans','zh-Hant','es','pt-BR','fr','de','ja','ko','ar','tr','ru','id','vi','it'],
  };
  for(const path of ['/topics','/factbook','/partners/embed-guide','/index.html']){
    for(const locale of ['en','zh-Hans','zh-Hant','es','pt-BR','fr','de','ja','ko','ar','tr','ru','id','vi','it']){
      const url=localizedPath(path, locale);
      const {status,html}=await page(url);const client=computeRouteSeo({url});
      assert.equal(status,200,url);assert.equal(canonical(html),client.canonical,url);
      assert.equal((html.match(/rel="canonical"/g)||[]).length,1,url);
      const expectedHreflangs = html.includes('name="robots" content="index,follow"')
        ? expectedHreflangByPath[path]
        : [];
      for (const hreflang of expectedHreflangs) {
        assert.match(html, new RegExp(`hreflang="${hreflang.replace('-', '[-]')}"`), `${url} exposes ${hreflang}`);
      }
      if (path === '/topics' || path === '/factbook') {
        assert.doesNotMatch(html, /hreflang="zh[-]Hans"/, `${url} keeps hub publication English-only`);
      }
    }
  }
});

test('UTM traffic receives the same body while referral traffic keeps its distinct noindex page',async()=>{
  const manifest={routes:{'/exchanges/binance|en':{asset:'/prerender/en/exchanges/binance.json'},'/ref/crypto-zhang|en':{html:'<h1>Partner</h1>'}}};
  const options={manifest,bodies:{'/prerender/en/exchanges/binance.json':'<h1>Binance profile</h1><a href="/exchanges">Directory</a>'}};
  const tracked=await page('/exchanges/binance?utm_source=telegram&gclid=test',options);
  assert.match(tracked.html,/<h1>Binance profile<\/h1>/);assert.equal(canonical(tracked.html),'https://nexualpha.com/exchanges/binance');
  const ref=await page('/?ref=crypto-zhang&utm_source=telegram',options);
  assert.match(ref.html,/<h1>Partner<\/h1>/);assert.match(ref.html,/name="robots" content="noindex,follow"/);
  assert.equal(canonical(ref.html),'https://nexualpha.com/ref/crypto-zhang');
});

test('manifest cache is isolated by asset binding',async()=>{
  const first=await page('/rates',{manifest:{routes:{'/rates|en':{html:'<h1>First binding</h1>'}}}});
  const second=await page('/rates',{manifest:{routes:{'/rates|en':{html:'<h1>Second binding</h1>'}}}});
  assert.match(first.html,/First binding/);assert.match(second.html,/Second binding/);assert.doesNotMatch(second.html,/First binding/);
});

test('news prerender carries hydration data and is discarded when publication changes',async()=>{
  const pathname=`/news/${articles[0].slug}`;
  const route={html:'<h1>Published snapshot</h1>',newsArticles:articles,newsFeedFingerprint:fingerprint};
  const manifest={routes:{[`${pathname}|en`]:route}};
  const fresh=await page(pathname,{manifest});assert.match(fresh.html,/Published snapshot/);assert.match(fresh.html,/"newsArticles":\[/);
  const changed=JSON.parse(feedText);
  const changedArticle=changed.articles.find((article)=>article.slug===articles[0].slug);
  assert.ok(changedArticle,`${articles[0].slug} must exist in the raw feed fixture`);
  changedArticle.title.en='Updated publication';
  const stale=await page(pathname,{manifest,feed:JSON.stringify(changed)});
  assert.doesNotMatch(stale.html,/Published snapshot/);
  const state = JSON.parse(stale.html.match(/<script type="application\/json" id="nexualpha-prerender-state">([^<]+)<\/script>/)[1]);
  assert.equal(state.newsArticles?.[0]?.title?.en, 'Updated publication');
  assert.match(stale.html,/<div id="root"[^>]*>[\s\S]*<h1[^>]*>Updated publication/);
});

test('news list runtime feed and prerender state use summary-only articles', async () => {
  const response = await worker.fetch(new Request('https://nexualpha.com/content/news-feed.json', {
    headers: { accept: 'application/json' },
  }), { ASSETS: assets() });
  assert.equal(response.status, 200);
  const publicFeed = await response.json();
  assert.ok(publicFeed.articles.length >= articles.length);
  assert.equal(publicFeed.articles[0].content, undefined);
  assert.equal(publicFeed.articles[0].sources, undefined);
  assert.ok(publicFeed.articles[0].summary?.en);

  const manifest = { routes: { '/news|en': { html: '<main><h1>News list</h1></main>', newsArticles: articles, newsFeedFingerprint: fingerprint } } };
  const result = await page('/news', { manifest });
  const state = JSON.parse(result.html.match(/<script type="application\/json" id="nexualpha-prerender-state">([^<]+)<\/script>/)[1]);
  assert.equal(state.newsArticles[0].content, undefined);
  assert.equal(state.newsArticles[0].sources, undefined);
  assert.ok(state.newsArticles[0].summary?.en);
});

test('news collection schema exposes an extractable reviewed article list without commercial tokens', async () => {
  const { status, html } = await page('/news');
  assert.equal(status, 200);
  const schema = JSON.parse(html.match(/<script id="nexualpha-route-schema"[^>]*>(.*?)<\/script>/)[1]);
  assert.equal(schema['@type'], 'CollectionPage');
  assert.equal(schema.mainEntity?.['@type'], 'ItemList');
  assert.equal(schema.mainEntity.numberOfItems, 12);
  assert.equal(schema.mainEntity.itemListElement[0].item['@type'], 'NewsArticle');
  assert.equal(schema.mainEntity.itemListElement[0].item.headline, articles[0].title.en);
  assert.equal(schema.mainEntity.itemListElement[0].item.description, articles[0].summary.en);
  assert.equal(schema.mainEntity.itemListElement[0].item.url, `https://nexualpha.com/news/${articles[0].slug}`);
  assert.equal(schema.dateModified, articles[0].updatedAt || articles[0].publishedAt);
  assert.doesNotMatch(JSON.stringify(schema), /nexu888|11350287|LUCKX|CANDY007|INS898|luckybitcoin|commission|rebate|referral code/i);
});

test('news routes remain readable server HTML when prerender assets are unavailable',async()=>{
  const article=articles[0];
  const list=await page('/news');
  assert.equal(list.status,200);
  assert.doesNotMatch(list.html,/<div id="root"><\/div>/);
  assert.match(list.html,/<div id="root"[^>]*>[\s\S]*<h1\b/);
  assert.match(list.html,new RegExp(`/news/${article.slug}`));

  const detail=await page(`/news/${article.slug}`,{manifest:{routes:{}}});
  assert.equal(detail.status,200);
  assert.doesNotMatch(detail.html,/<div id="root"><\/div>/);
  assert.match(detail.html,new RegExp(`<h1[^>]*>${article.title.en.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`));
  assert.match(detail.html,/<section class="news-detail__content">/);
});

test('news fallback cleans markdown links, repeated boilerplate and missing onsite next steps', async () => {
  const article = articles.find((item) => item.slug === 'how-to-create-backpack-exchange-account-complete-kyc-and-secure-first-funding');
  assert.ok(article, 'Backpack onboarding fixture should exist');
  const detail = await page(`/news/${article.slug}`, { manifest: { routes: {} } });
  assert.equal(detail.status, 200);
  assert.doesNotMatch(detail.html, /\[[^\]]+\]\(https?:\/\/[^)]+\)/);
  const visibleHtml = detail.html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  assert.ok((visibleHtml.match(/Never copy a password, one-time code/g) || []).length <= 1);
  assert.match(detail.html, /Continue checking/);
  assert.match(detail.html, /href="https:\/\/nexualpha\.com\/exchanges\/backpack"/);
});

test('non-indexable news locales render localized fallback instead of a loading shell or long English body', async () => {
  const article = articles.find((item) => item.content?.en && item.summary?.en && item.content.en.length > item.summary.en.length + 120);
  assert.ok(article, 'fixture should include a longer English article body');

  const list = await page('/ja/news', { manifest: { routes: {} } });
  assert.equal(list.status, 200);
  assert.match(list.html, /市場ニュースと出典付きリサーチ/);
  assert.doesNotMatch(list.html, /Loading Reviewed Articles|確認済み記事を読み込み中/);

  const detail = await page(`/ja/news/${article.slug}`, { manifest: { routes: {} } });
  assert.equal(detail.status, 200);
  const visibleHtml = detail.html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  assert.match(visibleHtml, /ニュースとレポートに戻る/);
  assert.match(visibleHtml, /本文は確認済みの英語原文で表示しています/);
  assert.ok(visibleHtml.includes(localizedNewsSummary(article, 'ja').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')), 'owned Japanese summary follows the existing display helper');
  assert.doesNotMatch(visibleHtml, new RegExp(article.content.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(120, 240)));
  const state = JSON.parse(detail.html.match(/<script[^>]*id="nexualpha-prerender-state"[^>]*>(.*?)<\/script>/s)[1]);
  // Class b: current fallback state includes the compact detail article plus bounded related/search context rows.
  assert.equal(state.newsArticles.length, 7);
  assert.equal(state.newsArticles[0].slug, article.slug);
  assert.match(state.newsArticles[0].content.en, /## Verified Fact Boundary/);
  assert.doesNotMatch(state.newsArticles[0].content.en, /\[[^\]]+\]\(https?:\/\/[^)]+\)/);
});

test('Brazil decision URLs with share state keep SSR body and canonical path',async()=>{
  const body='<main class="v2-page v3-page" id="top"><h1>Brasil SSR decision body</h1><p>Pix, BRL and spot fee context.</p></main>';
  const manifest={routes:{'/br|pt-BR':{html:body}}};
  const result=await page('/br?market=BR&product=spot&amount=1000&spot_fee_bps=10&deposit_fee_pct=0&deposit_fixed_brl=0&locale=pt-BR',{manifest});
  assert.equal(result.status,200);
  assert.equal(canonical(result.html),'https://nexualpha.com/br');
  assert.match(result.html,/<div id="root">[\s\S]*Brasil SSR decision body/);
  assert.ok(result.html.includes(body), 'crawler-readable neutral body stays intact');
  const stateText=result.html.match(/id="nexualpha-prerender-state">([^<]+)<\/script>/)?.[1];
  assert.ok(stateText, 'BR share query must expose the actual neutral SSR first-pass state');
  assert.deepEqual(JSON.parse(stateText), {pathname:'/br',locale:'pt-BR',version:'nexualpha-prerender-v1'});
  assert.doesNotMatch(stateText,/market|product|amount|spot_fee_bps|deposit_fee_pct|deposit_fixed_brl|account_stage|funding|referral|invite|identity|email/i, 'neutral payload must not inline browser decision or private query fields');
  assert.doesNotMatch(result.html,/data-nexualpha-client-render="true"/);

});

test('whole-site SEO verifier recognizes bounded Brazil decision-state query fields',async()=>{
  const source=await readFile(new URL('../scripts/verify-whole-site-seo.mjs',import.meta.url),'utf8');
  for(const key of ['platform','amount','spot_fee_bps','deposit_fee_pct','deposit_fixed_brl']){
    assert.match(source,new RegExp(`['"]${key}['"]`));
  }
});

test('document schema does not promote simulated conversions or default commercial entitlements',async()=>{
  for(const path of ['/','/exchanges/binance','/compare/binance-vs-okx','/factbook/binance','/activities']){
    const {html}=await page(path);
    const schema=html.match(/<script id="nexualpha-route-schema"[^>]*>(.*?)<\/script>/)?.[1]||'';
    assert.doesNotMatch(schema,/"@type":"(?:Offer|FinancialProduct|AggregateRating)"|SearchAction|MOCK_EVENTS|nexu888/,path);
  }
});

test('GSC priority DEX detail pages expose CTR-focused metadata and source-bound FAQ answers',async()=>{
  const cases = [
    // Class b: owner exchange-keyword/referral-code titles are the intended current venue SEO copy.
    ['binance', /Binance Referral Code 11350287: Up to 25% Fee Rebate/, /up to 25% of fees back/, /Binance before comparing it with another exchange/i, /compare\/binance-vs-okx/],
    ['okx', /OKX Referral Code nexu888: Up to 40% Fee Rebate/, /up to 40% of fees back/, /OKX before choosing a trading route/i, /compare\/binance-vs-okx/],
    ['bybit', /Bybit Referral Code 48553: Sign-up, Fees (?:&|&amp;) Official Route/, /official sign-up link checked by NexuAlpha/, /Bybit before comparing it with Bitget/i, /compare\/bybit-vs-bitget/],
    ['bitget', /Bitget Referral Code nexu888: Up to 60% Fee Rebate/, /up to 60% of fees back/, /Bitget before opening a registration route/i, /compare\/bybit-vs-bitget/],
    ['hyperliquid', /Hyperliquid Fees (?:&|&amp;) Referral Code NEXU888: Funded Account Checks/, /official sign-up link checked by NexuAlpha/, /centralized futures exchange/i, /compare\/hyperliquid-vs-dydx/],
    ['uniswap', /Uniswap Testnet, Mainnet, Permit2/, /official app and docs, API and web testnet scope/, /before using Uniswap testnet or mainnet/i],
    ['aerodrome', /Aerodrome Review: Base DEX Fees, Pools, Slipstream (?:&|&amp;) veAERO/, /pool-level fees, Slipstream routing/, /Aerodrome route and pool fee/i, /topics\/no-kyc/],
    ['jupiter', /Jupiter Solana Swap Routes/, /Swap and Ultra: Solana test quotes, no-route or failed-swap causes/, /Jupiter route, test quote and platform fee/i, /topics\/no-kyc/],
  ];
  for (const [slug, titlePattern, descriptionPattern, questionPattern, relatedPattern] of cases) {
    const path = `/exchanges/${slug}`;
    const client = computeRouteSeo({url:path});
    assert.equal(client.canonical,`https://nexualpha.com${path}`,slug);
    assert.match(client.title,titlePattern,slug);
    assert.match(client.description,descriptionPattern,slug);
    const clientFaq = client.schemas.find((schema)=>schema['@type']==='FAQPage');
    assert.ok(clientFaq,`${slug} client FAQ schema`);
    assert.match(clientFaq.mainEntity[0].name,questionPattern,slug);
    if (['okx', 'bybit', 'bitget', 'hyperliquid', 'uniswap'].includes(slug)) {
      assert.ok(clientFaq.mainEntity.length >= 3, `${slug} answer-engine FAQ depth`);
      assert.ok(clientFaq.mainEntity.every((entry) => entry.acceptedAnswer.citation?.length >= 1), `${slug} answer citations`);
      assert.equal(client.schemas.find((schema)=>schema['@type']==='WebPage').dateModified, ['hyperliquid', 'uniswap'].includes(slug) ? '2026-09-22' : '2026-09-15', slug);
    }
    if (relatedPattern) assert.match(JSON.stringify(client.schemas), relatedPattern, slug);
    assert.doesNotMatch(JSON.stringify(client.schemas),/"@type":"(?:Offer|FinancialProduct|AggregateRating)"|SearchAction|MOCK_EVENTS|private commission/i,slug);

    const {status,html}=await page(path);
    assert.equal(status,200,slug);
    assert.equal(canonical(html),`https://nexualpha.com${path}`,slug);
    assert.match(html,titlePattern,slug);
    assert.match(html,descriptionPattern,slug);
    const graph=JSON.parse(html.match(/<script id="nexualpha-route-schema"[^>]*>(.*?)<\/script>/)[1])['@graph'];
    const faq=graph.find((schema)=>schema['@type']==='FAQPage');
    assert.ok(faq,`${slug} worker FAQ schema`);
    assert.match(faq.mainEntity[0].name,questionPattern,slug);
    assert.doesNotMatch(JSON.stringify(graph),/"@type":"(?:Offer|FinancialProduct|AggregateRating)"|SearchAction|MOCK_EVENTS|private commission/i,slug);
  }
});


test('German Uniswap detail route remains readable without entering the published index graph', async () => {
  const invalid = await page('/de/exchanges/uniswap');
  assert.equal(invalid.status, 200);
  const path = '/de/exchanges/uniswap';
  const { status, html } = await page(path);
  assert.equal(status, 200);
  assert.equal(canonical(html), 'https://nexualpha.com/de/exchanges/uniswap');
  assert.match(html, /name="robots" content="noindex,follow"/);
  assert.doesNotMatch(html, /rel="alternate"/);
  assert.doesNotMatch(html, /nexu888|11350287|private commission|MOCK_EVENTS/i);
});

test('GSC priority venue overrides do not replace localized route metadata',async()=>{
  const japanese = computeRouteSeo({url:'/ja/exchanges/hyperliquid'});
  // Class b: localized referral-code title copy is now the approved route metadata.
  assert.match(japanese.title,/招待コード NEXU888/);
  assert.doesNotMatch(japanese.title,/Hyperliquid Fees, Funding/);
  assert.equal(japanese.canonical,'https://nexualpha.com/ja/exchanges/hyperliquid');
});

test('GSC priority comparison pages expose intent-specific metadata and FAQ answers', async () => {
  const cases = [
    ['/compare/binance-vs-okx', /Binance vs OKX: Fees, Products, KYC and Web3 Access Checks/, /identity requirements, Web3 or DEX-style access/, /compare Binance and OKX before choosing an exchange/i, /official account flow|partner route does not guarantee/i, [/exchanges\/binance/, /exchanges\/okx/]],
    ["/compare/bybit-vs-bitget", /Bybit vs Bitget Stocks, Copy Trading, Fees/, /xStocks fee schedule, stock futures, copy-trading profit sharing/, /compare Bybit and Bitget before choosing a platform/i, /Adventure Zone & xStocks|copy-trading profit sharing|Copy-Trading-Profit-Sharing-Explained|9083311039641/i, [/exchanges\/bybit/, /exchanges\/bitget/]],
    ['/compare/hyperliquid-vs-dydx', /Hyperliquid vs dYdX: Perp Fees, Funding, Liquidation/, /fee schedules, funding, collateral, liquidation rules/, /compare Hyperliquid and dYdX as crypto perpetual platforms/i, null, [/topics\/no-kyc/]],
  ];
  for (const [path, titlePattern, descriptionPattern, questionPattern, extraQuestionPattern, relatedPatterns] of cases) {
    const client = computeRouteSeo({url:path});
    assert.equal(client.canonical,`https://nexualpha.com${path}`,path);
    assert.match(client.title,titlePattern,path);
    assert.match(client.description,descriptionPattern,path);
    assert.equal(client.robots,'index,follow',path);
    const clientPage = client.schemas.find((schema)=>schema['@type']==='WebPage');
    assert.match(clientPage.subjectOf.mainEntity[0].name,questionPattern,path);
    if (extraQuestionPattern) {
      assert.equal(clientPage.dateModified, '2026-09-22', path);
      assert.ok(clientPage.subjectOf.mainEntity.length >= 3, path);
      assert.match(JSON.stringify(clientPage.subjectOf.mainEntity), extraQuestionPattern, path);
    }
    for (const relatedPattern of relatedPatterns || []) assert.match(JSON.stringify(clientPage.relatedLink), relatedPattern, path);
    assert.doesNotMatch(JSON.stringify(client.schemas),/"@type":"(?:Offer|FinancialProduct|AggregateRating)"|SearchAction|MOCK_EVENTS|nexu888|11350287/i,path);

    const {status,html}=await page(path);
    assert.equal(status,200,path);
    assert.equal(canonical(html),`https://nexualpha.com${path}`,path);
    assert.match(html,titlePattern,path);
    assert.match(html,descriptionPattern,path);
    const graph=JSON.parse(html.match(/<script id="nexualpha-route-schema"[^>]*>(.*?)<\/script>/)[1])['@graph'];
    const workerPage=graph.find((schema)=>schema['@type']==='WebPage');
    assert.match(workerPage.subjectOf.mainEntity[0].name,questionPattern,path);
    for (const relatedPattern of relatedPatterns || []) assert.match(JSON.stringify(workerPage.relatedLink), relatedPattern, path);
    assert.doesNotMatch(JSON.stringify(graph),/"@type":"(?:Offer|FinancialProduct|AggregateRating)"|SearchAction|MOCK_EVENTS|nexu888|11350287/i,path);
  }
});

test('localized comparison pages keep locale-owned metadata boundaries', async () => {
  for (const [locale, path, expectedTitleFragment, forbiddenEnglish] of [
    ['ja', '/ja/compare/bybit-vs-bitget', '株式型商品、コピー取引、手数料と口座確認', /Fees, Copy Trading, Stocks/],
    ['ko', '/ko/compare/bybit-vs-bitget', 'Bybit vs Bitget: 수수료', /Fees, Copy Trading, Stocks/],
    ['tr', '/tr/compare/bybit-vs-bitget', 'Bybit vs Bitget: ücretler', /Fees, Copy Trading, Stocks/],
  ]) {
    const client = computeRouteSeo({ url: path });
    const { status, html } = await page(path);
    const serverTitle = html.match(/<title[^>]*>(.*?)<\/title>/)?.[1] || '';
    const graph = JSON.parse(html.match(/<script id="nexualpha-route-schema"[^>]*>(.*?)<\/script>/)[1])['@graph'];
    const serverPage = graph.find((schema) => schema['@type'] === 'WebPage');

    assert.equal(status, 200, locale);
    assert.equal(canonical(html), client.canonical, locale);
    assert.match(serverTitle, new RegExp(expectedTitleFragment), locale);
    assert.match(client.title, new RegExp(expectedTitleFragment), locale);
    assert.doesNotMatch(serverTitle, forbiddenEnglish, locale);
    assert.doesNotMatch(client.title, forbiddenEnglish, locale);
    assert.equal(serverPage.inLanguage, locale, locale);
    assert.equal(client.schemas.find((schema) => schema['@type'] === 'WebPage').inLanguage, locale, locale);
  }
});

test('Wave12 Korean and Turkish high-intent pages expose localized AEO metadata and schemas', async () => {
  const cases = [
    // Class b: localized referral-code title copy is now the approved route metadata.
    ['ko', '/ko/exchanges/hyperliquid', /Hyperliquid 추천 코드 NEXU888/, /Hyperliquid를 사용하기 전에 어떤 수수료와 계정 조건을 먼저 확인해야 하나요/, 'FAQPage'],
    ['tr', '/tr/exchanges/hyperliquid', /Hyperliquid ücretleri, funding ve hesap yapısı kontrolü/, /Hyperliquid kullanmadan önce hangi ücret ve hesap koşulları kontrol edilmeli/, 'FAQPage'],
    ['ko', '/ko/exchanges/uniswap', /Uniswap 테스트넷/, /v4 훅 경로/, 'FAQPage'],
    ['tr', '/tr/exchanges/uniswap', /Uniswap testnet/, /v4 hook rotası/, 'FAQPage'],
    ['ko', '/ko/exchanges/aerodrome', /Aerodrome Base DEX/, /풀 수수료 조건/, 'FAQPage'],
    ['tr', '/tr/exchanges/aerodrome', /Aerodrome Base DEX/, /pool ücret koşulları/, 'FAQPage'],
    ['ko', '/ko/exchanges/jupiter', /Jupiter Solana/, /플랫폼 수수료/, 'FAQPage'],
    ['tr', '/tr/exchanges/jupiter', /Jupiter Solana/, /platform ücretleri/, 'FAQPage'],
    ['ko', '/ko/compare/bybit-vs-bitget', /Bybit vs Bitget: 수수료/, /가입 전에 Bybit과 Bitget을 어떻게 비교해야 하나요|공식 가입 조건/, 'subjectOf'],
    ['tr', '/tr/compare/bybit-vs-bitget', /Bybit vs Bitget: ücretler/, /Kayıt olmadan önce Bybit ve Bitget nasıl karşılaştırılmalı|resmi kayıt koşulları/, 'subjectOf'],
    ['ko', '/ko/topics/no-kyc', /No-KYC 암호화폐 접근 비교/, /No-KYC 암호화폐 플랫폼/, 'FAQPage'],
    ['tr', '/tr/topics/no-kyc', /No-KYC kripto erişim karşılaştırması/, /No-KYC kripto platformları/, 'FAQPage'],
  ];
  for (const [locale, path, titlePattern, questionPattern, faqShape] of cases) {
    const client = computeRouteSeo({ url: path });
    const { status, html } = await page(path);
    const graph = JSON.parse(html.match(/<script id="nexualpha-route-schema"[^>]*>(.*?)<\/script>/)[1])['@graph'];
    const pageSchema = graph.find((schema) => schema['@type'] === 'WebPage' || schema['@type'] === 'CollectionPage');
    const faq = faqShape === 'subjectOf'
      ? pageSchema.subjectOf
      : graph.find((schema) => schema['@type'] === 'FAQPage');

    assert.equal(status, 200, path);
    assert.equal(canonical(html), `https://nexualpha.com${path}`, path);
    assert.match(client.title, titlePattern, path);
    assert.match(html.match(/<title[^>]*>(.*?)<\/title>/)?.[1] || '', titlePattern, path);
    assert.equal(pageSchema.inLanguage, locale, path);
    assert.ok(faq, `${path} FAQ schema`);
    assert.equal(faq.inLanguage, locale, path);
    assert.match(JSON.stringify(faq.mainEntity), questionPattern, path);
    assert.match(JSON.stringify(pageSchema.relatedLink || faq), /https:\/\/nexualpha\.com|https:\/\//, path);
    assert.doesNotMatch(`${client.title}\n${client.description}\n${JSON.stringify(graph)}`, /private commission|guaranteed registration|guaranteed approval/i, path);
  }
});

test('Japanese, Korean and Turkish path migrations redirect legacy query URLs and serve self canonicals', async () => {
  for (const [locale, market, expectedPath] of [
    ['ja', 'JP', '/ja/exchanges/binance'],
    ['ko', 'KR', '/ko/exchanges/binance'],
    ['tr', 'TR', '/tr/exchanges/binance'],
  ]) {
    const legacy = await worker.fetch(new Request(`https://nexualpha.com/exchanges/binance?locale=${locale}&utm_source=telegram&market=${market}&product=spot&account_stage=kyc&x=drop`, { headers: { accept: 'text/html' } }), { ASSETS: assets() });
    assert.equal(legacy.status, 308, locale);
    assert.equal(legacy.headers.get('location'), `https://nexualpha.com${expectedPath}?utm_source=telegram&market=${market}&product=spot&account_stage=kyc`, locale);

    const {status, html} = await page(expectedPath);
    assert.equal(status, 200, locale);
    assert.equal(canonical(html), `https://nexualpha.com${expectedPath}`, locale);
    assert.match(html, new RegExp(`<html lang="${locale}"`), locale);
  }

  const blocked = await page('/ja/api/v1/venues');
  assert.equal(blocked.status, 404);
  assert.equal(canonical(blocked.html), 'https://nexualpha.com/ja/api/v1/venues');
});

test('Wave10 locale indexing keeps Japanese, Korean and Turkish on path canonicals', async () => {
  const route = '/exchanges/binance';

  for (const [locale, expected] of [
    ['ja', 'https://nexualpha.com/ja/exchanges/binance'],
    ['ko', 'https://nexualpha.com/ko/exchanges/binance'],
    ['tr', 'https://nexualpha.com/tr/exchanges/binance'],
  ]) {
    const path = localizedPath(route, locale);
    const { status, html } = await page(path);
    const client = computeRouteSeo({ url: path });

    assert.equal(status, 200, locale);
    assert.equal(canonical(html), expected, locale);
    assert.equal(client.canonical, expected, locale);
    assert.match(html, new RegExp(`hreflang="${locale}" href="${expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), locale);
  }

  const sitemap = buildSitemap(routeInventory(articles), articles);
  assert.match(sitemap, /<loc>https:\/\/nexualpha\.com\/ja\/exchanges\/binance<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/nexualpha\.com\/ko\/exchanges\/binance<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/nexualpha\.com\/tr\/exchanges\/binance<\/loc>/);
  assert.doesNotMatch(sitemap, /https:\/\/nexualpha\.com\/exchanges\/binance\?locale=(?:ko|tr)/);
});

test('sitemap publishes only canonical indexable routes and real article dates',()=>{
  const inventory=routeInventory(articles);
  const publication=selectSitemapPublicationEntries(inventory,articles,{allLocales:INDEXABLE_LOCALES});
  const sitemap=buildSitemap(inventory,articles);
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(new Set(locs).size, locs.length);
  assert.deepEqual(assertSitemapPublicationBudget(publication), []);
  assert.equal(locs.length, publication.stats.totalUrls);
  assert.equal(locs.filter((url) => url.includes("?locale=")).length, publication.stats.queryLocaleUrls);
  assert.ok(locs.every((url) => !/(?:\/ref\/|\/exchanges\/(?:htx|hashkey|aevo)|\/partners\/embed-guide)/.test(url)));
  const articleEntries = publication.urls.filter((entry) => entry.route?.template === "article");
  assert.equal(articleEntries.length, publication.stats.urlsByTemplate.article);
  assert.ok(articleEntries.every((entry) => entry.route?.index === true));
  assert.ok(articleEntries.every((entry) => !new URL(entry.loc).searchParams.has("locale")));
  assert.ok(articleEntries.every((entry) => {
    const slug = entry.route.pathname.replace(/^\/news\//, "");
    const article = articles.find((item) => item.slug === slug);
    return article?.seo?.noindex === false
      && Number.isFinite(Date.parse(article.publishedAt))
      && (!article.updatedAt || Number.isFinite(Date.parse(article.updatedAt)));
  }));
  assert.match(sitemap,/<loc>https:\/\/nexualpha.com\/methodology<\/loc>/);
  assert.match(sitemap,/<loc>https:\/\/nexualpha.com\/hk<\/loc>/);
  assert.doesNotMatch(sitemap,/<loc>https:\/\/nexualpha.com\/hk\?locale=/);
  assert.doesNotMatch(sitemap,/\/news\/[^<]*locale=ja/);
  assert.doesNotMatch(sitemap,/\/news\/[^<]*locale=ko/);
});

test("sitemap first wave keeps GSC-visible and conversion-critical canonicals", () => {
  const sitemap = buildSitemap(routeInventory(articles), articles);
  const locs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
  for (const url of [
    "https://nexualpha.com/",
    "https://nexualpha.com/exchanges/hyperliquid",
    "https://nexualpha.com/exchanges/uniswap",
    "https://nexualpha.com/exchanges/backpack",
    "https://nexualpha.com/exchanges/aerodrome",
    "https://nexualpha.com/exchanges/jupiter",
    "https://nexualpha.com/compare/bybit-vs-bitget",
    "https://nexualpha.com/topics/no-kyc",
    "https://nexualpha.com/news/tokenized-treasuries-structure-access-risks",
    "https://nexualpha.com/news/hyperliquid-vs-dydx",
    "https://nexualpha.com/br",
    "https://nexualpha.com/ja/exchanges/binance",
    "https://nexualpha.com/ko/exchanges/binance",
    "https://nexualpha.com/tr/exchanges/binance",
  ]) {
    assert.ok(locs.has(url), url);
  }
});


test('HEAD uses the same route status policy as GET even when the asset response has no body', async () => {
  const binding = { async fetch(request) { return new Response(null, {status: new URL(request.url).pathname === '/index.html' ? 200 : 404, headers:{'content-type':'text/html'}}); } };
  for (const [path,status] of [['/rates',200],['/unknown',404],['/activities/research/binance/extra',404]]) {
    const response=await worker.fetch(new Request(`https://nexualpha.com${path}`,{method:'HEAD'}),{ASSETS:binding});
    assert.equal(response.status,status,path); assert.equal(await response.text(),'');
  }
});

test('article-owned client metadata follows loaded content, locale and missing-article state',()=>{
  const article=articles.find((entry)=>entry.slug==='verify-official-crypto-exchange-website');
  assert.ok(article, 'accepted reviewed article fixture exists');
  const url=`/news/${article.slug}`;
  for(const locale of ['en','zh-Hans']){
    const seo=computeRouteSeo({url,article,locale,force:true});
    assert.equal(seo.status,200);assert.equal(seo.robots,'index,follow');
    assert.ok(seo.title.length > 0);
    assert.equal(seo.schemas[0]['@type'],'NewsArticle');
    assert.equal(seo.canonical,`https://nexualpha.com${localizedPath(url, locale)}`);
  }
  for (const [requested, expectedLocale, expectedCanonical] of [
    ['zh-Hant', 'zh-Hans', `https://nexualpha.com${localizedPath(url, 'zh-Hans')}`],
    ['ja', 'en', `https://nexualpha.com${url}`],
  ]) {
    const seo=computeRouteSeo({url,article,locale:requested,force:true});
    assert.equal(seo.status,200,requested);
    assert.equal(seo.robots,'noindex,follow',requested);
    assert.equal(seo.locale,expectedLocale,requested);
    assert.equal(seo.canonical,expectedCanonical,requested);
    assert.equal(seo.schemas[0].inLanguage,expectedLocale,requested);
    assert.equal(seo.alternates.length,0,requested);
  }
  const unknownArticle={...article,slug:'unknown-unreviewed-article'};
  const unknown=computeRouteSeo({url:`/news/${unknownArticle.slug}`,article:unknownArticle,locale:'en',force:true});
  assert.equal(unknown.status,200);
  // Class b: b4c9051 allows sourced, published article metadata outside the old frozen roster.
  assert.equal(unknown.robots,'index,follow');
  assert.ok(unknown.title.length>0);
  assert.equal(unknown.schemas[0]['@type'],'NewsArticle');
  assert.equal(unknown.alternates.length,3);
  const missing=computeRouteSeo({url,route:{name:'notFound'},locale:'en',force:true});
  assert.equal(missing.status,404);assert.equal(missing.robots,'noindex,nofollow');assert.equal(missing.schemas.length,0);
});

test('unsupported news locales stay readable without entering the index graph', async () => {
  const article=articles[0];
  for (const [path, expectedCanonical, expectedHtmlLanguage, expectedSchemaLanguage] of [
    [`/ja/news`, 'https://nexualpha.com/news', 'ja', 'en'],
    [`/ja/news/${article.slug}`, `https://nexualpha.com/news/${article.slug}`, 'ja', 'en'],
    [`/zh-hant/news/${article.slug}`, `https://nexualpha.com${localizedPath(`/news/${article.slug}`, 'zh-Hans')}`, 'zh-Hant', 'zh-Hans'],
  ]) {
    const {status,html}=await page(path);
    assert.equal(status,200,path);
    assert.equal(canonical(html),expectedCanonical,path);
    assert.match(html,new RegExp(`<html lang="${expectedHtmlLanguage}"`),path);
    assert.match(html,/name="robots" content="noindex,follow"/,path);
    assert.doesNotMatch(html,/hreflang="ja"/,path);
    const payload=JSON.parse(html.match(/<script id="nexualpha-route-schema"[^>]*>(.*?)<\/script>/)[1]);
    const graph=payload['@graph'] || [payload];
    assert.ok(graph.some((schema)=>schema.inLanguage===expectedSchemaLanguage),path);
  }
});


test('unsupported Chinese aliases follow the current App fallback instead of inventing valid locales',async()=>{
  for(const locale of ['zh-TW','zh-CN','zh','zh-foo','EN','not-a-locale']){
    const path=`/exchanges/binance?locale=${locale}`;
    const response=await page(path);const client=computeRouteSeo({url:path});
    assert.equal(response.status,200,path);
    assert.equal(canonical(response.html),'https://nexualpha.com/exchanges/binance',path);
    assert.equal(client.canonical,'https://nexualpha.com/exchanges/binance',path);
    assert.equal(client.htmlLocale,'en',path);
    assert.match(response.html,/<html lang="en"/,path);
  }
});


test('topic breadcrumbs use their localized canonical including the root topic alias',async()=>{
  for(const path of ['/topics/meme-coins','/topics/derivatives','/topics/compliant-exchanges','/topics/no-kyc','/topics']){
    for(const locale of ['en','zh-Hans']){
      const response=await page(locale === 'en' ? path : localizedPath(path, locale));
      const graph=JSON.parse(response.html.match(/<script id="nexualpha-route-schema"[^>]*>(.*?)<\/script>/)[1])['@graph'];
      const breadcrumb=graph.find(schema=>schema['@type']==='BreadcrumbList');
      assert.equal(breadcrumb.itemListElement.at(-1).item,canonical(response.html),`${path}|${locale}`);
    }
  }
});

test('GSC priority no-KYC topic exposes direct inbound paths to perp comparison and venue profiles',async()=>{
  const client = computeRouteSeo({url:'/topics/no-kyc'});
  const topicPage = client.schemas.find((schema)=>schema['@type']==='CollectionPage');
  const faq = client.schemas.find((schema)=>schema['@type']==='FAQPage');
  assert.match(JSON.stringify(topicPage.relatedLink), /\/compare\/hyperliquid-vs-dydx/);
  assert.match(JSON.stringify(topicPage.relatedLink), /\/exchanges\/hyperliquid/);
  assert.match(JSON.stringify(topicPage.relatedLink), /\/exchanges\/dydx/);
  assert.match(JSON.stringify(topicPage.relatedLink), /\/exchanges\/mexc/);
  assert.ok(faq);
  assert.deepEqual(faq.mainEntity, topicFaqSchemaEntries("no-kyc","en"));
  // Class b: r100 added a fifth selected reviewed no-KYC answer while preserving exact source parity.
  assert.equal(faq.mainEntity.length,5);

  const {status,html}=await page('/topics/no-kyc');
  assert.equal(status,200);
  assert.equal(canonical(html),'https://nexualpha.com/topics/no-kyc');
  const graph=JSON.parse(html.match(/<script id="nexualpha-route-schema"[^>]*>(.*?)<\/script>/)[1])['@graph'];
  const workerTopic=graph.find((schema)=>schema['@type']==='CollectionPage');
  const workerFaq=graph.find((schema)=>schema['@type']==='FAQPage');
  assert.match(JSON.stringify(workerTopic.relatedLink), /\/compare\/hyperliquid-vs-dydx/);
  assert.ok(workerFaq);
  assert.deepEqual(workerFaq.mainEntity, topicFaqSchemaEntries("no-kyc","en"));

  const topicComponent = await readFile(new URL('../src/components/v3/TopicGuidePage.jsx', import.meta.url), 'utf8');
  assert.match(topicComponent, /topic\.slug === "no-kyc"/);
  assert.match(topicComponent, /\/compare\/hyperliquid-vs-dydx/);
  assert.match(topicComponent, /No-KYC is not one single promise/);
});

test('all missing-document branches preserve the requested content language canonical',async()=>{
  for(const path of ['/exchanges/unknown','/factbook/unknown','/topics/unknown','/news/unknown']){
    const response=await page(localizedPath(path, 'zh-Hans'));
    assert.equal(response.status,404,path);
    assert.equal(canonical(response.html),`https://nexualpha.com${localizedPath(path, 'zh-Hans')}`,path);
    assert.equal(canonical(response.html),computeRouteSeo({url:`${path}?locale=zh-Hans`,route:{name:'notFound'}}).canonical,path);
  }
});

test('localized route schemas preserve the rendered interface language', async () => {
  for (const locale of ['ja', 'ko', 'tr', 'ar', 'pt-BR']) {
    const { html } = await page(localizedPath('/', locale));
    const schemaText = html.match(/<script id="nexualpha-route-schema"[^>]*>(.*?)<\/script>/)?.[1] || '';
    assert.match(schemaText, new RegExp(`"inLanguage":"${locale.replace('-', '\\-')}"`), locale);
  }
});

test('topic schemas expose source-backed entities for AEO discovery', async () => {
  const { html } = await page('/ja/topics/meme-coins');
  const graph = JSON.parse(html.match(/<script id="nexualpha-route-schema"[^>]*>(.*?)<\/script>/)?.[1] || '{}')['@graph'] || [];
  const topic = graph.find((schema) => schema['@type'] === 'CollectionPage');
  assert.ok(topic);
  assert.equal(topic.inLanguage, 'ja');
  assert.equal(topic.dateModified, '2026-09-04T19:59:35Z');
  assert.ok(Array.isArray(topic.about) && topic.about.length >= 3);
  assert.ok(Array.isArray(topic.isBasedOn) && topic.isBasedOn.length > 0);
  assert.ok(topic.isBasedOn.every((url) => /^https:\/\//.test(url)));
});

test('tokenized asset topics stay indexable in client metadata and sitemap', () => {
  const paths = ['/topics/tokenized-assets', '/topics/tokenized-treasuries', '/topics/tokenized-stocks-vs-perpetuals'];
  const sitemap = buildSitemap(routeInventory(articles), articles);

  for (const path of paths) {
    const english = computeRouteSeo({ url: path });
    const chinese = computeRouteSeo({ url: localizedPath(path, 'zh-Hans') });
    const unsupported = computeRouteSeo({ url: `/ja${path}` });

    assert.equal(english.status, 200, path);
    assert.equal(english.robots, 'index,follow', path);
    assert.equal(english.canonical, `https://nexualpha.com${path}`, path);
    assert.match(sitemap, new RegExp(`<loc>https://nexualpha\\.com${path.replaceAll('/', '\\/')}<\\/loc>`), path);
    assert.ok(english.schemas.some((schema) => schema['@type'] === 'CollectionPage'), path);
    assert.ok(english.schemas.some((schema) => schema['@type'] === 'FAQPage'), path);

    assert.equal(chinese.robots, 'index,follow', `${path}:zh-Hans`);
    assert.equal(chinese.canonical, `https://nexualpha.com${localizedPath(path, 'zh-Hans')}`, `${path}:zh-Hans`);

    assert.equal(unsupported.status, 200, `${path}:ja`);
    assert.equal(unsupported.robots, 'noindex,follow', `${path}:ja`);
    assert.equal(unsupported.canonical, `https://nexualpha.com${path}`, `${path}:ja`);
    assert.equal(unsupported.alternates.length, 0, `${path}:ja`);
  }
});

test('factbook and exchange profile titles do not compete in migrated locales', () => {
  for (const locale of ['ja', 'ko', 'tr']) {
    const exchange = computeRouteSeo({ url: localizedPath('/exchanges/binance', locale) });
    const factbook = computeRouteSeo({ url: localizedPath('/factbook/binance', locale) });

    assert.equal(exchange.status, 200, locale);
    assert.equal(factbook.status, 200, locale);
    assert.notEqual(exchange.title, factbook.title, locale);
    assert.match(factbook.title, /Factbook|ファクトブック|팩트북|factbook/i, locale);
  }
});

test('core international routes do not fall back to English metadata titles', async () => {
  const routes = ['/exchanges', '/activities', '/topics/meme-coins', '/telegram'];
  const locales = ['zh-Hant', 'es', 'pt-BR', 'fr', 'de', 'ar', 'ru', 'id', 'vi', 'it'];
  const forbidden = /Crypto Exchanges Directory|Official Crypto Campaigns|published fee and market terms|Telegram Research Bot & Platform Intelligence Hub/;
  for (const route of routes) for (const locale of locales) {
    const requestPath = localizedPath(route, locale);
    const { status, html } = await page(requestPath);
    assert.equal(status, 200, `${route}:${locale}`);
    const title = html.match(/<title[^>]*>(.*?)<\/title>/)?.[1] || '';
    assert.doesNotMatch(title, forbidden, `${route}:${locale} title must be localized`);
  }
});

#!/usr/bin/env node
/** Read-only HTTP verification against one local candidate. Never follows external registration links. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { localizedPath, parsePublicRoute } from '../src/data/locale-routing.js';
import { assertSitemapPublicationBudget, buildSearchPublicationEligibility, selectSitemapPublicationEntries } from './sitemap-publication-policy.mjs';

const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const arg=(name,fallback)=>{const i=args.indexOf(name);return i>=0?args[i+1]:fallback;};
const base=new URL(arg('--base',process.env.AUDIT_URL||'http://127.0.0.1:4199'));
const defaultInventory=path.join(projectRoot,'dist','client','route-inventory.json');
const evidenceInventory=path.join(projectRoot,'..','docs','evidence','nexualpha-whole-site-route-inventory-20260908.json');
const inventoryPath=path.resolve(arg('--inventory',existsSync(defaultInventory)?defaultInventory:evidenceInventory));
const outDir=path.resolve(arg('--out',path.join(projectRoot,'..','artifacts','whole-site','seo-final')));
if(!['localhost','127.0.0.1','[::1]'].includes(base.hostname)) throw new Error('This verifier is limited to the local candidate; pass --base http://127.0.0.1:PORT');
const origin='https://nexualpha.com';
const buildId=arg('--build-id',null);
const inventory=JSON.parse(await readFile(inventoryPath,'utf8'));
const rows=inventory.rows||inventory.routes;
const publication=selectSitemapPublicationEntries(rows.map(row=>({ ...row, pathname: row.path||row.pathname })), []);
const publicationEligibility=buildSearchPublicationEligibility(publication);
const localesForRow=(row)=>row.locales||(String(row.path||row.pathname).startsWith('/br')?['pt-BR']:(inventory.locales||['en','zh-Hans']));
const results=[],issues=[],linkResults=[];
const publicLinks=new Map();
const requestCanonicalKeys=new Map();
const requests=new Map();

function decode(value){return String(value??'').replace(/&(?:#(x[0-9a-f]+|\d+)|(amp|quot|apos|lt|gt|nbsp));/gi,(_,n,s)=>{
  if(n){const code=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):parseInt(n,10);return code>0&&code<=0x10ffff?String.fromCodePoint(code):'�';}
  return {amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '}[s.toLowerCase()];
});}
function attrs(tag){const out={};for(const match of tag.matchAll(/([a-z_:][-a-z0-9_:]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi))out[match[1].toLowerCase()]=decode(match[2]??match[3]??match[4]);return out;}
function tags(html,name){return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`,'gi'))].map(m=>attrs(m[0]));}
function visibleText(html){return decode(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();}
function textFingerprint(value){return createHash('sha256').update(String(value||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim()).digest('hex');}
function canonicalUrl(pathname,locale){
  if(['/br','/mx','/tw','/id','/hk','/eu','/uk','/jp','/kr','/sg','/int'].includes(pathname)||pathname.startsWith('/br/'))return `${origin}${pathname}`;
  const value=locale==='zh'?'zh-Hans':(locale||'en');
  return `${origin}${localizedPath(pathname,value)}`;
}
function sitemapUrl(pathname,locale){
  // Brazil's original Portuguese content owns clean regional URLs. The
  // locale is part of the route contract there, so adding ?locale=pt-BR
  // would create a false missing/unexpected sitemap pair.
  if(pathname==='/br'||pathname.startsWith('/br/'))return `${origin}${pathname}`;
  return `${origin}${localizedPath(pathname,locale)}`;
}
function internalKeyFromUrl(url){return `${url.pathname}${url.search}`;}
function stripTrackingParams(searchParams){
  const kept=new URLSearchParams(searchParams);
  for(const key of [...kept.keys()]){
    const lower=key.toLowerCase();
    if(lower.startsWith('utm_')||['gclid','fbclid','msclkid','yclid','igshid'].includes(lower))kept.delete(key);
  }
  const value=kept.toString();
  return value?`?${value}`:'';
}
function canonicalComparableKey(url){
  const kept=new URLSearchParams(url.searchParams);
  for(const key of [...kept.keys()]){
    const lower=key.toLowerCase();
    if(lower.startsWith('utm_')||['gclid','fbclid','msclkid','yclid','igshid','market','product','account_stage'].includes(lower))kept.delete(key);
  }
  if(kept.get('locale')==='en'||url.pathname==='/br'||url.pathname.startsWith('/br/'))kept.delete('locale');
  kept.sort();
  const value=kept.toString();
  return `${url.pathname}${value?`?${value}`:''}`;
}
function nonCanonicalQueryKeys(searchParams){
  // Bounded public decision-state fields used by the Brazil flow. They do not
  // alter the clean canonical URL; arbitrary query keys remain reportable.
  const allowed=new Set(['locale','market','product','platform','amount','spot_fee_bps','deposit_fee_pct','deposit_fixed_brl','account_stage','gclid','fbclid','msclkid','yclid','igshid']);
  return [...new Set([...searchParams.keys()].filter((key)=>!key.toLowerCase().startsWith('utm_')&&!allowed.has(key.toLowerCase())))];
}
function isStaticAssetPath(pathname){return pathname.startsWith('/assets/')||pathname.startsWith('/brand/')||pathname.startsWith('/content/')||/\.(?:avif|css|gif|ico|jpe?g|js|json|map|png|svg|txt|webmanifest|webp|woff2?)$/i.test(pathname);}
const canonicalInternalKeys=new Map();
const indexableInternalKeys=new Map();
for(const row of rows){
  const expectedStatus=row.expectedStatus??200;
  if(!row.index||row.alias||expectedStatus!==200)continue;
  const pathname=row.path||row.pathname;
  for(const locale of localesForRow(row)){
    if(!publicationEligibility.has(pathname,locale))continue;
    const canonicalPath=row.canonical||pathname;
    const canonical=new URL(canonicalUrl(canonicalPath,locale));
    const key=internalKeyFromUrl(canonical);
    canonicalInternalKeys.set(key,{scope:`${pathname}|${locale}`,pathname,locale});
    indexableInternalKeys.set(key,{scope:`${pathname}|${locale}`,pathname,locale});
  }
}
function recordIssue(scope,code,detail){issues.push({scope,code,detail});}
async function request(relative){
  const local=new URL(relative,base);
  if(local.origin!==base.origin)throw new Error(`External request blocked: ${local.origin}`);
  local.hash='';
  if(!requests.has(local.href))requests.set(local.href,(async()=>{
    try{const response=await fetch(local,{redirect:'manual',headers:{accept:'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'},signal:AbortSignal.timeout(15000)});
      return {url:local.href,status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()};
    }catch(error){return {url:local.href,status:null,headers:{},body:'',error:String(error)};}
  })());
  return requests.get(local.href);
}
async function mapConcurrent(items,fn,concurrency=6){let cursor=0;await Promise.all(Array.from({length:Math.min(concurrency,items.length)},async()=>{while(cursor<items.length){const item=items[cursor++];await fn(item);}}));}
function collectLinks(html,pagePath){
  for(const a of tags(html,'a')){
    if(!a.href)continue;
    const relTokens=new Set(String(a.rel||'').toLowerCase().split(/\s+/).filter(Boolean));
    if(relTokens.has('nofollow'))continue;
    try{
      const target=new URL(a.href,new URL(pagePath,origin));
      if(['mailto:','tel:'].includes(target.protocol))continue;
      if(!['http:','https:'].includes(target.protocol)){recordIssue(pagePath,'UNSAFE_LINK_SCHEME',a.href);continue;}
      const isInternal=[origin,base.origin].includes(target.origin);
      if(!isInternal)continue; // External partner links are not requested during local acceptance.
      if(target.pathname.startsWith('/api/'))continue; // Calling a handoff API can create attribution state.
      if(isStaticAssetPath(target.pathname))continue;
      if(target.searchParams.has('page'))recordIssue(pagePath,'LEGACY_QUERY_INTERNAL_LINK',`${target.pathname}${target.search}; linked from ${pagePath}`);
      const unknownQueryKeys=nonCanonicalQueryKeys(target.searchParams);
      if(unknownQueryKeys.length)recordIssue(pagePath,'NON_CANONICAL_INTERNAL_LINK',`${target.pathname}${target.search}; unknown params ${unknownQueryKeys.join(', ')}; linked from ${pagePath}`);
      const key=target.pathname+target.search;
      if(!publicLinks.has(key))publicLinks.set(key,{sources:new Set(),hashes:new Set()});
      publicLinks.get(key).sources.add(pagePath);
      if(target.hash && target.hash!=="#")publicLinks.get(key).hashes.add(target.hash.slice(1));
    }catch{recordIssue(pagePath,'MALFORMED_LINK',a.href);}
  }
}
async function verifyPage(row,locale){
  const pathname=row.path||row.pathname;
  const relative=localizedPath(pathname,locale);
  const response=await request(relative);
  const scope=`${pathname}|${locale}`;
  const expectedStatus=row.expectedStatus??200;
  const page={scope,path:pathname,locale,template:row.template,status:response.status,expectedStatus};
  if(response.status!==expectedStatus)recordIssue(scope,'STATUS',`${response.status} != ${expectedStatus}`);
  if(response.error)recordIssue(scope,'REQUEST_ERROR',response.error);
  const html=response.body;
  const titleMatches=[...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
  const links=tags(html,'link');const meta=tags(html,'meta');
  const canonicals=links.filter(link=>link.rel==='canonical');
  const alternates=links.filter(link=>link.rel==='alternate'&&link.hreflang);
  const robots=meta.filter(tag=>tag.name==='robots');
  page.titleCount=titleMatches.length;page.canonicalCount=canonicals.length;page.robotsCount=robots.length;page.alternateCount=alternates.length;
  for(const [name,count] of [['TITLE',page.titleCount],['CANONICAL',page.canonicalCount],['ROBOTS',page.robotsCount]])if(count!==1)recordIssue(scope,`${name}_COUNT`,String(count));
  page.title=visibleText(titleMatches[0]?.[1]||'');page.description=meta.find(tag=>tag.name==='description')?.content||'';page.canonical=canonicals[0]?.href;page.robots=robots[0]?.content;
  const canonicalPath=row.canonical||pathname;
  const expectedCanonical=canonicalUrl(canonicalPath,locale);
  if(page.canonical!==expectedCanonical)recordIssue(scope,'CANONICAL_MISMATCH',`${page.canonical} != ${expectedCanonical}`);
  if(page.canonical){
    try{requestCanonicalKeys.set(relative,internalKeyFromUrl(new URL(page.canonical)));}
    catch{requestCanonicalKeys.set(relative,`${canonicalPath}${locale==='en'?'':`?locale=${encodeURIComponent(locale)}`}`);}
  }
  const searchPublished=publicationEligibility.has(pathname,locale);
  const expectedRobots=expectedStatus===404?'noindex,nofollow':searchPublished?'index,follow':'noindex,follow';
  if(page.robots!==expectedRobots)recordIssue(scope,'ROBOTS_MISMATCH',`${page.robots} != ${expectedRobots}`);
  if(!searchPublished&&alternates.length)recordIssue(scope,'HREFLANG_ON_UNPUBLISHED_LOCALE',`${alternates.length} alternate links on route-locale outside sitemap publication eligibility`);
  if(searchPublished){
    for(const alternate of alternates){
      if(alternate.hreflang==='x-default')continue;
      try{
        const alternateUrl=new URL(alternate.href,origin);
        const alternatePublic=parsePublicRoute(alternateUrl.pathname,alternateUrl.searchParams);
        if(!publicationEligibility.has(alternatePublic.contentPathname,alternate.hreflang)){
          recordIssue(scope,'HREFLANG_POINTS_TO_UNPUBLISHED_LOCALE',`${alternate.hreflang}: ${alternate.href}`);
        }
      }catch{
        recordIssue(scope,'MALFORMED_HREFLANG',String(alternate.href));
      }
    }
  }
  const ogUrl=meta.find(tag=>tag.property==='og:url')?.content;
  if(ogUrl!==page.canonical)recordIssue(scope,'OG_CANONICAL_MISMATCH',String(ogUrl));
  const schemas=[];
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
    if(attrs(match[1]).type!=='application/ld+json')continue;
    try{const parsed=JSON.parse(match[2]);schemas.push(...(Array.isArray(parsed)?parsed:parsed['@graph']||[parsed]));}
    catch(error){recordIssue(scope,'INVALID_JSONLD',String(error));}
  }
  page.schemaTypes=schemas.map(schema=>schema['@type']);
  for(const schema of schemas){
    if(schema.inLanguage&&schema.inLanguage!==locale)recordIssue(scope,'SCHEMA_LANGUAGE',`${schema['@type']}: ${schema.inLanguage}`);
    if(['WebPage','CollectionPage','Dataset'].includes(schema['@type'])&&schema.url&&schema.url!==page.canonical)recordIssue(scope,'SCHEMA_URL',`${schema['@type']}: ${schema.url}`);
    if(schema['@type']==='NewsArticle'){
      if(schema.mainEntityOfPage&&schema.mainEntityOfPage!==page.canonical)recordIssue(scope,'ARTICLE_CANONICAL',schema.mainEntityOfPage);
      // A search-focused <title> may intentionally be shorter than the visible
      // article headline. Require the structured headline to exist in rendered
      // page copy instead of forcing it to be embedded in the title tag.
      if(schema.headline&&!visibleText(html).includes(schema.headline))recordIssue(scope,'ARTICLE_HEADLINE',schema.headline);
    }
    if(schema['@type']==='BreadcrumbList'){
      const last=schema.itemListElement?.at(-1);if(last?.item&&last.item!==page.canonical)recordIssue(scope,'BREADCRUMB_CANONICAL',last.item);
    }
  }
  const body=html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1]||'';
  const h1Matches=[...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  const main=body.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||body;
  const mainText=visibleText(main);
  page.h1Count=h1Matches.length;
  page.h1=visibleText(h1Matches[0]?.[1]||'');
  page.textLength=visibleText(body).length;
  page.mainTextLength=mainText.length;
  page.mainTextFingerprint=textFingerprint(mainText);
  page.hasPrerenderState=/id="nexualpha-prerender-state"/.test(html);
  if(expectedStatus===200&&(row.index||row.alias)){
    if(page.h1Count<1)recordIssue(scope,'MISSING_H1','Indexable document has no raw HTML H1');
    if(page.textLength<80)recordIssue(scope,'MISSING_BODY',`Visible body length ${page.textLength}`);
    if(!page.hasPrerenderState)recordIssue(scope,'MISSING_PRERENDER','Indexable content fell back to the client shell');
  }
  if(expectedStatus===200)collectLinks(html,relative);
  results.push(page);
}

await mapConcurrent(rows.flatMap(row=>localesForRow(row).map(locale=>({row,locale}))),item=>verifyPage(item.row,item.locale));
const sitemapResponse=await request('/sitemap.xml');
const sitemapUrls=[...sitemapResponse.body.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>decode(m[1]));
if(sitemapResponse.status!==200)recordIssue('sitemap','STATUS',String(sitemapResponse.status));
const sitemapSet=new Set(sitemapUrls);
if(sitemapSet.size!==sitemapUrls.length)recordIssue('sitemap','DUPLICATE_URLS',`${sitemapUrls.length-sitemapSet.size}`);
const expectedSitemap=new Set(publication.urls.map(entry=>entry.loc));
for(const url of expectedSitemap)if(!sitemapSet.has(url))recordIssue('sitemap','MISSING_URL',url);
for(const url of sitemapSet)if(!expectedSitemap.has(url))recordIssue('sitemap','UNEXPECTED_URL',url);
for(const issue of assertSitemapPublicationBudget(publication))recordIssue('sitemap','PUBLICATION_BUDGET',issue);

await mapConcurrent([...publicLinks],async([relative,{sources,hashes}])=>{
  let current=relative;const visited=new Set();const redirects=[];let terminal;
  for(let hop=0;hop<6;hop++){
    if(visited.has(current)){recordIssue(relative,'REDIRECT_LOOP',current);break;}visited.add(current);
    terminal=await request(current);
    if([301,302,303,307,308].includes(terminal.status)){
      const location=terminal.headers.location;
      if(!location){recordIssue(relative,'MISSING_REDIRECT_LOCATION',String(terminal.status));break;}
      const target=new URL(location,new URL(current,base));
      if(![base.origin,origin].includes(target.origin)){recordIssue(relative,'INTERNAL_LINK_EXTERNAL_REDIRECT',target.origin);break;}
      redirects.push({status:terminal.status,location});current=target.pathname+target.search;continue;
    }
    if(terminal.status!==200)recordIssue(relative,'BROKEN_INTERNAL_LINK',`${terminal.status}; linked from ${[...sources].slice(0,3).join(', ')}`);
    break;
  }
  if(redirects.length>=6)recordIssue(relative,'REDIRECT_LIMIT','More than five internal redirects');
  if(terminal?.status===200 && /id="nexualpha-prerender-state"/.test(terminal.body)) {
    const ids = new Set([...terminal.body.matchAll(/\bid=(?:"([^"]*)"|'([^']*)')/g)].map(match=>decode(match[1]??match[2])));
    for(const hash of hashes){let id;try{id=decodeURIComponent(hash);}catch{id=hash;}
      if(!ids.has(id))recordIssue(relative,'MISSING_LINK_FRAGMENT',id);
    }
  }
  linkResults.push({path:relative,status:terminal?.status,redirects,sourceCount:sources.size,fragments:[...hashes]});
});

for(const [canonicalKey,{scope}] of indexableInternalKeys){
  if(canonicalKey==='/')continue;
  let inbound=0;
  for(const [targetKey,{sources}] of publicLinks){
    const targetUrl=new URL(targetKey,origin);
    const normalizedTarget=canonicalComparableKey(targetUrl);
    if(normalizedTarget!==canonicalKey)continue;
    for(const source of sources){
      const sourceCanonical=requestCanonicalKeys.get(source)??source;
      if(sourceCanonical!==canonicalKey)inbound++;
    }
  }
  if(inbound===0)recordIssue(scope,'ZERO_INTERNAL_INBOUND','Indexable canonical page has no internal inbound links');
}

for(const path of ['/','/exchanges/binance','/compare/binance-vs-okx','/news']){
  let response=await request(`${path}?locale=zh-Hans&utm_source=seo_verification&utm_medium=local`);
  if([301,302,303,307,308].includes(response.status)&&response.headers.location){
    const target=new URL(response.headers.location,new URL(path,base));
    response=await request(target.pathname+target.search);
  }
  if(response.status!==200||!/<h1\b/i.test(response.body)||!/id="nexualpha-prerender-state"/.test(response.body))recordIssue(path,'UTM_LOST_PRERENDER',String(response.status));
}
const articlePath = rows.find(row=>row.template==='article')?.path;
if(articlePath){
  const slug=articlePath.split('/').at(-1);
  const legacy=await request(`/?page=newsDetail&slug=${encodeURIComponent(slug)}&locale=zh-Hans`);
  if(legacy.status!==301||legacy.headers.location!==canonicalUrl(articlePath,'zh-Hans'))recordIssue('legacy-news','BAD_REDIRECT',`${legacy.status}: ${legacy.headers.location}`);
}
const triple=await request('/compare/binance-vs-okx-vs-bybit');
const tripleH1=[...triple.body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m=>visibleText(m[1])).join(' ');
if(triple.status!==200||!['Binance','OKX','Bybit'].every(name=>tripleH1.includes(name)))recordIssue('three-way','THIRD_VENUE_MISSING',tripleH1);
let buildIdVerifiedFromBundle = null;
if(buildId){
  const version=await request('/version.json');
  let publishedBuildId=null;
  try{publishedBuildId=JSON.parse(version.body).buildId??null;}catch{}
  if(version.status!==200||publishedBuildId!==buildId)recordIssue('build','VERSION_JSON_BUILD_ID_MISMATCH',`${version.status}: ${publishedBuildId}`);
  const home=await request('/');
  const moduleScripts=tags(home.body,'script').filter(script=>script.type==='module'&&script.src).map(script=>new URL(script.src,base));
  for(const match of home.body.matchAll(/\bimport\((?:"|')([^"']+)(?:"|')\)/g)){
    moduleScripts.push(new URL(match[1],base));
  }
  for(const match of home.body.matchAll(/(?:"|')(\/assets\/index-[^"']+\.js)(?:"|')/g)){
    moduleScripts.push(new URL(match[1],base));
  }
  buildIdVerifiedFromBundle=false;
  for(const scriptUrl of moduleScripts){
    if(scriptUrl.origin!==base.origin)continue;
    const bundle=await request(scriptUrl.pathname+scriptUrl.search);
    if(bundle.status===200&&bundle.body.includes(buildId)){buildIdVerifiedFromBundle=true;break;}
  }
  if(!buildIdVerifiedFromBundle)recordIssue('build','BUILD_ID_NOT_FOUND_IN_ENTRY_BUNDLE',buildId);
}
const summary={checkedAt:new Date().toISOString(),buildId,buildIdVerifiedFromBundle,base:base.href,inventory:inventoryPath,pages:results.length,templates:[...new Set(results.map(r=>r.template))],indexableCanonicalPaths:expectedSitemap.size, sitemapUrls:sitemapUrls.length,sitemapQueryLocaleUrls:publication.stats.queryLocaleUrls,protectedPublishedCount:publication.stats.protectedPublishedCount,excludedIndexedNoindex:publication.stats.excludedIndexedNoindex.length,excludedIndexedMissing:publication.stats.excludedIndexedMissing.length,internalLinks:linkResults.length,requests:requests.size,issues:issues.length,pass:issues.length===0,scope:'Read-only local candidate HTTP. External partner/registration destinations are not requested.'};
await mkdir(outDir,{recursive:true});
await writeFile(path.join(outDir,'results.json'),JSON.stringify({summary,issues,pages:results,links:linkResults},null,2)+'\n');
console.log(JSON.stringify({...summary,evidence:path.join(outDir,'results.json'),firstIssues:issues.slice(0,15)},null,2));
if(issues.length)process.exitCode=1;

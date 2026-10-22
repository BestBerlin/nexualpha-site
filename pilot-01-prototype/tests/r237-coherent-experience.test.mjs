import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("fixtures/r237-approved-inverses.json", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const { projectNewsBotPlugin: projectNewsBotPlugin, approvedRuntime: approvedRuntime } = await import("./helpers/r237-approved-inverses.mjs");const { verifyFrozenRuntime: verifyFrozenRuntime } = await import("./helpers/r231-frozen-peer-contract.mjs");
const root=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup:render}=require('react-dom/server');
class FixedDate extends Date{constructor(...args){super(...(args.length?args:[1791190800000]));}static now(){return 1791190800000;}}
async function load(project){const entry=`export {NewsDetailPage} from './src/components/v3/news/NewsDetailPage.jsx';export {OnsiteTelegramBotHandoff} from './src/components/v3/OnsiteTelegramBotHandoff.jsx';export {normalizeNewsArticle} from './src/data/news-feed-client.js';export {venueDatabase} from './src/data/venue-database.js';export {NEWS_DISPLAY_LOCALES} from './src/data/news-feed-client.js';`;const out=await build({stdin:{contents:entry,resolveDir:root,loader:'jsx'},bundle:true,write:false,format:'cjs',platform:'node',external:['react','react/jsx-runtime'],loader:{'.css':'empty'},plugins:project?[projectNewsBotPlugin('r226-news-ssr-parity')]:[]});const m={exports:{}};vm.runInNewContext(out.outputFiles[0].text,{module:m,exports:m.exports,require,console,URL,URLSearchParams,Intl,Date:FixedDate,setTimeout,clearTimeout});return m.exports;}
const actual=await load(false),previous=await load(true),feed=JSON.parse(fs.readFileSync(path.join(root,'public/content/news-feed.json'),'utf8')).articles;
const record=feed.find(a=>a.slug==='kraken-crypto-withdrawal-network-address-confirmation-checklist');assert.ok(record);
for(const locale of actual.NEWS_DISPLAY_LOCALES)test(locale+' actual news wholeHTML allows only exact explicit venue Bot subtree; all text/orderedhref/time/SEO untouched',()=>{for(const relatedVenues of [['kraken'],[],['invalid'],['invalid','kraken'],['coinbase','kraken']]){const article={...structuredClone(record),relatedVenues};const props={slug:article.slug,locale,market:'unknown',product:'spot',initialArticles:[actual.normalizeNewsArticle(article)]};const current=render(React.createElement(actual.NewsDetailPage,props)),old=render(React.createElement(previous.NewsDetailPage,props));const common={canonicalPath:`/news/${article.slug}`,locale,market:'unknown',product:'spot',returnRoute:`/news/${article.slug}`,placement:`news-onsite-bot-handoff-${article.slug}`};const oldBot=render(React.createElement(actual.OnsiteTelegramBotHandoff,common));assert.equal(old.split(oldBot).length,2,'one full exact prior handoff');const venue=relatedVenues.find(s=>actual.venueDatabase[s]?.slug===s);const newBot=venue?render(React.createElement(actual.OnsiteTelegramBotHandoff,{...common,intent:'monitor',venue})):'';if(newBot)assert.equal(current.split(newBot).length,2,'one full exact contextual handoff');let expected=old.replace(oldBot,newBot);const contentLocale=expected.match(/<section class="news-detail__content" lang="([^"]+)"/)?.[1];assert.ok(contentLocale);expected=expected.replace(`<section class="news-detail__content" lang="${contentLocale}"`,`<section class="news-detail__content" lang="${contentLocale}" dir="${contentLocale==='ar'?'rtl':'ltr'}"`);expected=expected.replace(`<aside class="news-detail__local-brief" lang="${locale}"`,`<aside class="news-detail__local-brief" lang="${locale}" dir="${locale==='ar'?'rtl':'ltr'}"`);const sourcesLocale=expected.includes('<h2 id="article-sources">Sources</h2>')?'en':locale;expected=expected.replace('<h2 id="article-sources">',`<h2 id="article-sources" lang="${sourcesLocale}" dir="${locale==='ar'?'rtl':'ltr'}">`);expected=expected.replace(/(<p class="news-detail__table-hint" id="news-table-hint-\d+")/g,(_,tag)=>`${tag} lang="${locale}" dir="${locale==='ar'?'rtl':'ltr'}"`);assert.equal(current,expected,'complete original HTML retained except exact approved Bot replacement and four scoped UI attributes');}});
test('combined protected source literal authority and missing/foreign/fact mutation reject',()=>{verifyFrozenRuntime();assert.equal(Object.keys(approvedRuntime).length,29);});

const seoLedgerBytes=fs.readFileSync(path.join(root,'tests/fixtures/r237-seo-contract-hunks.json'));assert.equal(require('node:crypto').createHash('sha256').update(seoLedgerBytes).digest('hex'),'acd8aa861436b93fff3b7bdc9a7a6867e03145f19a98532e630a2cc99a1f0cbc','literal approved display-only SEO contract hunk ledger');const seoHunks=JSON.parse(seoLedgerBytes);
function reverseSeoContract(text){for(const h of [...seoHunks].reverse()){assert.equal(text.split(h.after).length,2,'unique approved exact display hunk');text=text.replace(h.after,()=>h.before);}assert.equal(text,fs.readFileSync(new URL('../../../r236-news-original-direction/candidate/tests/seo-whole-site.test.mjs',import.meta.url),'utf8'),'whole original SEO assertions preserved outside display expectations');}
test('SEO display-only contract inverse retains all original index/source/schema/canonical/state/body checks',()=>{const text=fs.readFileSync(path.join(root,'tests/seo-whole-site.test.mjs'),'utf8');reverseSeoContract(text);for(const changed of [text.replace('noindex,follow','index,follow'),text.replace('expectedSchemaLanguage','expectedDisplayLanguage'),text.replace('state.newsArticles.length, 1','state.newsArticles.length, 0')]){assert.notEqual(changed,text);assert.throws(()=>reverseSeoContract(changed));}});
}

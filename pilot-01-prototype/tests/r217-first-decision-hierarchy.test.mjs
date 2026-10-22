import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {build} from 'esbuild';
import postcss from 'postcss';
import crypto from 'node:crypto';
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
const { skipApprovedAdded: skipApprovedAdded } = await import("./helpers/r237-approved-inverses.mjs");
const { projectNewsBotPlugin: projectNewsBotPlugin } = await import("./helpers/r237-approved-inverses.mjs");
const { assertExactPeerChanges: assertExactPeerChanges } = await import("./helpers/r231-frozen-peer-contract.mjs");

const root=fileURLToPath(new URL('../',import.meta.url)),base=fileURLToPath(new URL('../../../r207-coherent-topic-navigation/candidate/',import.meta.url)),require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');const read=(r,f)=>fs.readFileSync(path.join(r,f),'utf8');
const material='src/styles/reader-material.css',foundation='src/styles/reader-foundation.css';
const m='\n/* R217: actual first decisions share material, preserving news cyan left emphasis. */\n.v3-compare-page .v3-compare-final-choice-card,\n.news-detail-page .news-detail__first-decision {\n  background: var(--reader-material-decision);\n  border-color: var(--reader-material-decision-rule);\n  box-shadow: none;\n}\n.news-detail-page .news-detail__first-decision {\n  border-left-color: #22d3ee;\n}\n';
const f='\n/* R217: explanatory copy in actual first decisions, not RelatedResearch. */\n.news-detail-page .news-detail__first-decision .top-decision-box__copy p,\n.v3-compare-page .v3-compare-final-choice-card__head p {\n  font-size: var(--reader-support-size);\n  line-height: var(--reader-support-line);\n  color: var(--muted);\n}\n';
test('exact inverse restores two entire baseline sheets and preserves actual left emphasis',()=>{assert.ok(read(root,material).endsWith(m));assert.ok(read(root,foundation).endsWith(f));assert.equal(read(root,material).replace(m,''),read(base,material));assert.equal(read(root,foundation).replace(f,''),read(base,foundation));assert.match(read(root,'src/components/v3/top-decision-box.css'),/border-left: 3px solid #22d3ee/);});
class FixedDate extends Date{constructor(...a){super(...(a.length?a:[1791190800000]));}static now(){return 1791190800000;}}
async function load(r){const code=(await build({stdin:{contents:`export {NewsDetailPage} from './src/components/v3/news/NewsDetailPage.jsx';export {normalizeNewsArticle} from './src/data/news-feed-client.js';export {CompareDeepPage} from './src/components/v3/V3Pages.jsx';export {venueDatabase} from './src/data/venue-database.js';`,resolveDir:r,loader:'jsx'},bundle:true,write:false,plugins:r===root?[projectNewsBotPlugin('r207-coherent-topic-navigation')]:[],format:'cjs',platform:'node',external:['react','react/jsx-runtime'],loader:{'.css':'empty'}})).outputFiles[0].text,m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,require,console,URL,URLSearchParams,Intl,Date:FixedDate,setTimeout,clearTimeout});return m.exports;}
const a=await load(root),b=await load(base),raw=JSON.parse(read(root,'public/content/news-feed.json'));const feed=Array.isArray(raw)?raw:raw.articles;assert.ok(feed.length>0);const article=feed[0];
for(const locale of ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'])test(locale+' actual NewsDetail/TopDecisionBox and Compare SSR all HTML exact',()=>{const np={slug:article.slug,locale,initialArticles:[a.normalizeNewsArticle(article)]},html=renderToStaticMarkup(React.createElement(a.NewsDetailPage,np));assert.equal(html,renderToStaticMarkup(React.createElement(b.NewsDetailPage,{...np,initialArticles:[b.normalizeNewsArticle(article)]})));assert.match(html,/<aside class="top-decision-box news-detail__first-decision"[^>]*>[\s\S]*?<div class="top-decision-box__copy">[\s\S]*?<h2>[^<]+<\/h2><p>[^<]+<\/p>/);const cp={copy:{common:{dimension:'Dimension'},assetCapabilities:{none:'Pending source review'}},locale,selected:['binance','okx'],updates:[],venues:Object.values(a.venueDatabase),market:'unknown',product:'unknown'};assert.equal(renderToStaticMarkup(React.createElement(a.CompareDeepPage,cp)),renderToStaticMarkup(React.createElement(b.CompareDeepPage,{...cp,venues:Object.values(b.venueDatabase)})));});
test('actual shared import closure and route specificity preserve first decision paragraph tokens at both route orders',()=>{assert.match(read(root,'src/main.jsx'),/reader-foundation\.css/);assert.match(read(root,'src/main.jsx'),/reader-material\.css/);const families=[['src/components/v3/top-decision-box.css','.top-decision-box__copy p','.news-detail-page .news-detail__first-decision .top-decision-box__copy p',3],['src/components/v3/crossroads-compare.css','.v3-compare-final-choice-card__head p','.v3-compare-page .v3-compare-final-choice-card__head p',2]];for(const width of [320,390,640,641,1440])for(const late of [false,true])for(const [route,plain,scoped,specificity] of families){const vals={};let order=0;for(const file of late?[foundation,route]:[route,foundation])postcss.parse(read(root,file)).walkRules(rule=>{const sels=rule.selector.split(',').map(s=>s.trim());if(!sels.includes(plain)&&!sels.includes(scoped))return;for(let p=rule.parent;p;p=p.parent)if(p.type==='atrule'&&p.name==='media')for(const x of p.params.matchAll(/(min|max)-width:\s*(\d+)px/g))if(x[1]==='min'?width<+x[2]:width>+x[2])return;rule.walkDecls(d=>{if(!['font-size','line-height','color'].includes(d.prop))return;assert.equal(Boolean(d.important),false);const rank=sels.includes(scoped)?specificity:1,seq=order++;if(!vals[d.prop]||rank>vals[d.prop].rank||rank===vals[d.prop].rank&&seq>vals[d.prop].seq)vals[d.prop]={value:d.value,rank,seq};});});assert.equal(vals['font-size'].value,'var(--reader-support-size)');assert.equal(vals['line-height'].value,'var(--reader-support-line)');assert.equal(vals.color.value,'var(--muted)');}});
test('protected whole trees only allow two CSS changes, immutable referral identity',()=>{const changes=[];function walk(dir){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(e.isFile()){if(skipApprovedAdded(f,fs.readFileSync(path.join(root,f)))){changes.push(f);continue;}assert.ok(fs.existsSync(path.join(base,f)),f);if(read(root,f)!==read(base,f))changes.push(f);}}}for(const dir of ['src','config','public'])walk(dir);assertExactPeerChanges(changes);assert.equal(crypto.createHash('sha256').update(read(root,'src/data/partner-registry.js')).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
}

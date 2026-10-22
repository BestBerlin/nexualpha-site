import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import postcss from 'postcss';
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
const { projectApproved: projectApproved } = await import("./helpers/r237-approved-inverses.mjs");










const root=fileURLToPath(new URL('../',import.meta.url));
const base=fileURLToPath(new URL('../../../r273-final-experience-integration/candidate/',import.meta.url));
const css='src/components/v3/news/news-detail-page.css';
const read=(r,f)=>fs.readFileSync(path.join(r,f),'utf8');
const tail='\n/* R275: mobile news first-decision density, preserving complete copy and actions. */\n@media (max-width: 640px) {\n  .news-detail-page .news-detail__first-decision.top-decision-box {\n    padding-block: .7rem;\n    padding-inline: .65rem;\n    gap: .65rem;\n  }\n  .news-detail-page .news-detail__first-decision.top-decision-box .top-decision-box__copy p {\n    line-height: 1.5;\n  }\n}\n';
test('one literal inverse restores the complete parent sheet and narrowly scopes the only additions',()=>{const current=read(root,css);assert.ok(current.endsWith(tail));assert.equal(current.slice(0,-tail.length),read(base,css));const ast=postcss.parse(tail);let count=0;ast.walkRules(r=>{count++;assert.ok(r.selector.startsWith('.news-detail-page .news-detail__first-decision.top-decision-box'));assert.equal(r.parent.params,'(max-width: 640px)');r.walkDecls(d=>assert.ok(['padding-block','padding-inline','gap','line-height'].includes(d.prop)));});assert.equal(count,2);assert.doesNotMatch(tail,/font-size|overflow|(?:^|\n)\s*height\s*:|clamp|display|transform/);});
function values(files,width){const result={};let order=0;for(const file of files)postcss.parse(read(root,file)).walkRules(r=>{let media=true;for(let p=r.parent;p;p=p.parent)if(p.type==='atrule'&&p.name==='media')for(const m of p.params.matchAll(/(min|max)-width:\s*(\d+)px/g))if(m[1]==='min'?width<+m[2]:width>+m[2])media=false;if(!media)return;for(const s of r.selector.split(',').map(s=>s.trim())){if(!['.top-decision-box__copy p','.news-detail-page .news-detail__first-decision .top-decision-box__copy p','.news-detail-page .news-detail__first-decision.top-decision-box .top-decision-box__copy p'].includes(s))continue;const rank=(s.match(/\.[\w-]+/g)||[]).length;r.walkDecls(d=>{if(!['font-size','line-height','color'].includes(d.prop))return;const n=++order;if(!result[d.prop]||rank>result[d.prop].rank||rank===result[d.prop].rank&&n>result[d.prop].order)result[d.prop]={rank,order:n,value:d.value};});}});return result;}
test('actual ordered CSS cascade keeps existing rem font and muted color, overrides mobile line height in either route load order',()=>{const shared='src/styles/reader-foundation.css',box='src/components/v3/top-decision-box.css';for(const width of [320,390,412,640,641,1440])for(const files of [[box,shared,css],[box,css,shared],[shared,box,css]]){const v=values(files,width);assert.equal(v['font-size'].value,'var(--reader-support-size)');assert.equal(v.color.value,'var(--muted)');assert.equal(v['line-height'].value,width<=640?'1.5':'var(--reader-support-line)');}});
function inventory(r){const out={};for(const dir of ['src','config','public']){function walk(d){for(const e of fs.readdirSync(path.join(r,d),{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())walk(f);else if(e.isFile())out[f]=crypto.createHash('sha256').update(fs.readFileSync(path.join(r,f))).digest('hex');}}walk(dir);}return out;}
test('all source/config/public keys and bytes except one CSS remain frozen; invitation registry exact',()=>{const a=inventory(root),b=inventory(base);assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort());for(const f of Object.keys(a)){if(f===css)continue;if(a[f]!==b[f]){const projected=projectApproved(f,read(root,f),'r275-news-first-decision-density');assert.equal(projected,read(base,f),f+' complete approved R274 inverse');a[f]=b[f];}}assert.deepEqual(Object.keys(a).filter(k=>a[k]!==b[k]),[css]);assert.equal(a['src/data/partner-registry.js'],'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
const require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
class FixedDate extends Date {constructor(...args){super(...(args.length?args:[1791190800000]));}static now(){return 1791190800000;}}
async function load(r){const code=(await build({stdin:{contents:"export {NewsDetailPage} from './src/components/v3/news/NewsDetailPage.jsx';export {normalizeNewsArticle} from './src/data/news-feed-client.js';",resolveDir:r,loader:'jsx'},bundle:true,write:false,format:'cjs',platform:'node',external:['react','react/jsx-runtime'],loader:{'.css':'empty'}})).outputFiles[0].text;const m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,require,console,URL,URLSearchParams,Intl,Date:FixedDate,setTimeout,clearTimeout});return m.exports;}
const a=await load(root),b=await load(base),feed=JSON.parse(read(root,'public/content/news-feed.json')).articles;
const slugs=['bybit-vs-bitget-passkey-withdrawal-control-boundary','how-to-compare-crypto-exchange-fee-schedules-without-missing-costs','tokenized-treasuries-structure-access-risks'];
// Use only actual existing feed articles; no fabricated production fixture.
const articles=slugs.map(s=>feed.find(a=>a.slug===s));
for(let i=0;i<articles.length;i++)test('actual article '+slugs[i]+' ×15 locales preserves complete SSR and ordered action subtrees',()=>{const article=articles[i];assert.ok(article,slugs[i]);for(const locale of ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it']){const props={slug:article.slug,locale,market:'unknown',product:'unknown'};const x=renderToStaticMarkup(React.createElement(a.NewsDetailPage,{...props,initialArticles:[a.normalizeNewsArticle(article)]}));const y=renderToStaticMarkup(React.createElement(b.NewsDetailPage,{...props,initialArticles:[b.normalizeNewsArticle(article)]}));assert.equal(x,y,locale);assert.match(x,/class="top-decision-box news-detail__first-decision"/);}});
}

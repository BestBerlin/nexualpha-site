import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {buildSync} from 'esbuild';
const root=fileURLToPath(new URL('../',import.meta.url)), require=createRequire(import.meta.url), React=require('react'), {renderToStaticMarkup}=require('react-dom/server');
const sourcePath=path.join(root,'src/components/v3/news/NewsListPage.jsx'),source=fs.readFileSync(sourcePath,'utf8'),baseline=fs.readFileSync(path.join(root,'baseline/NewsListPage.before-reading-copy.jsx'),'utf8'),fixture=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/r286-news-reading-copy.json'))),rawFeed=fs.readFileSync(path.join(root,'public/content/news-feed.json')),feed=JSON.parse(rawFeed).articles;
const sha=v=>createHash('sha256').update(v).digest('hex');
class FixedDate extends Date {constructor(...a){super(...(a.length?a:[1791190800000]));}static now(){return 1791190800000;}}
function load(s){const code=buildSync({stdin:{contents:s+'\nexport {copy};',resolveDir:path.dirname(sourcePath),loader:'jsx'},bundle:true,write:false,format:'cjs',platform:'node',external:['react','react/jsx-runtime'],loader:{'.css':'empty'}}).outputFiles[0].text,m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,require,console,URL,URLSearchParams,Intl,Date:FixedDate,setTimeout,clearTimeout});return m.exports;}
const current=load(source),before=load(baseline),esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
function render(m,locale,initialArticles){return renderToStaticMarkup(React.createElement(m.NewsListPage,{locale,market:'BR',product:'spot',initialArticles}));}
test('all 30 approved UI literals change while exact inverse and protected inputs remain frozen',()=>{assert.equal(sha(baseline),fixture.baselineSha);let restored=source;for(const h of fixture.hunks){assert.equal(current.copy[h.locale][h.field],fixture.copy[h.locale][h.field]);assert.equal(restored.split(h.after).length-1,1);restored=restored.replace(h.after,h.before);}assert.equal(fixture.hunks.length,30);assert.equal(restored,baseline);assert.equal(sha(rawFeed),fixture.feedSha);assert.equal(sha(fs.readFileSync(path.join(root,'src/data/partner-registry.js'))),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
for(const locale of Object.keys(fixture.copy))test(locale+' real component SSR ready/empty/loading differs only in visible heading and subtitle',()=>{for(const initialArticles of [feed,[],undefined]){const h=render(current,locale,initialArticles),old=render(before,locale,initialArticles);let inverse=h;for(const [field,tag]of [['title','h1'],['subtitle','p']]){const cls=field==='title'?'news-hero__title':'news-hero__subtitle',a=`<${tag} class="${cls}">${esc(fixture.copy[locale][field])}</${tag}>`,b=`<${tag} class="${cls}">${esc(before.copy[locale][field])}</${tag}>`;assert.equal(inverse.split(a).length-1,1);inverse=inverse.replace(a,b);}assert.equal(inverse,old);assert.deepEqual([...h.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]),[...old.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]));}});
test('inverse refuses unrelated runtime text mutation',()=>{let restored=source;for(const h of fixture.hunks)restored=restored.replace(h.after,h.before);const changed=restored.replace('NEWS_BATCH_SIZE = 4','NEWS_BATCH_SIZE = 5');assert.notEqual(changed,restored);assert.notEqual(changed,baseline);});

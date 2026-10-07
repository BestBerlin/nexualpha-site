import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const req=createRequire(new URL('../../../../pilot-01-prototype/package.json',import.meta.url));
const React=req('react'),{renderToStaticMarkup}=req('react-dom/server'),{buildSync}=req('esbuild');
const currentFile=new URL('../src/components/v3/LeanHero.jsx',import.meta.url);
function load(text){const output=buildSync({stdin:{contents:text,resolveDir:path.dirname(fileURLToPath(currentFile)),sourcefile:'LeanHero.jsx',loader:'jsx'},bundle:true,write:false,format:'cjs',platform:'node',external:['react','react-dom','react/jsx-runtime'],loader:{'.css':'empty'}}).outputFiles[0].text;const module={exports:{}};vm.runInNewContext(output,{module,exports:module.exports,require:req,URL,URLSearchParams,Intl,Date,console,setTimeout,clearTimeout});return module.exports.LeanHero;}
const oldSource=readFileSync(new URL('../../hero-copy-before/LeanHero.jsx',import.meta.url),'utf8'),newSource=readFileSync(currentFile,'utf8');
const Before=load(oldSource),After=load(newSource);
const hrefs=html=>[...html.matchAll(/href="([^"]*)"/g)].map(m=>m[1]).sort();
const reg=html=>html.slice(html.indexOf('<div class="growth-selected-route__registration"'),html.indexOf('</aside>'));
for(const locale of ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'])test(`${locale}: remove one duplicate benefit sentence and retain exact registration HTML, code, hrefs`,()=>{
 const render=P=>renderToStaticMarkup(React.createElement(P,{locale})),before=render(Before),after=render(After);
 const benefit=before.match(/class="growth-selected-route__identity"[\s\S]*?<strong[^>]*>[^<]*<\/strong><span>([\s\S]*?)<\/span>/)?.[1];assert.ok(benefit);
 const count=(html)=>html.split(benefit).length-1;assert.ok(count(before)>=2,'same benefit also present inside registration');assert.equal(count(after),count(before)-1);
 assert.deepEqual(hrefs(after),hrefs(before));assert.equal(reg(after),reg(before));assert.match(after,/class="registration-card__code-value"[^>]*>11350287<\/span>/);
});
test('source change is exactly one outer benefit span deletion, no locale or registry changes',()=>{
 const line='                <span>{selected.benefit || (zh ? "官方直达入口，按平台当前条件执行" : "Official route with current platform terms")}</span>\n';assert.equal(newSource,oldSource.replace(line,''));
});

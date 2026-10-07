import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import * as data from '../src/data/tokenized-assets-cluster.js';
import * as routing from '../src/data/locale-routing.js';
const compiler=createRequire(new URL('../../../../pilot-01-prototype/package.json',import.meta.url))('esbuild');
const current=fs.readFileSync(new URL('../src/components/v3/TokenizedAssetsPage.jsx',import.meta.url),'utf8');
const before=fs.readFileSync(new URL('../../tokenized-before/TokenizedAssetsPage.jsx',import.meta.url),'utf8');
function render(source,slug,locale){
 const React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity).filter(x=>x!==null&&x!==false&&x!==undefined)})};
 const module={exports:{}};
 vm.runInNewContext(compiler.transformSync(source,{loader:'jsx',format:'cjs'}).code,{module,exports:module.exports,require:name=>name==='react'?React:{...data,...routing,TreasuryEvidenceChecklist:()=>null}});
 return module.exports.TokenizedAssetsPage({slug,locale});
}
function nodes(n){return !n||typeof n!=='object'?[]:[n,...(n.children||[]).flatMap(nodes)];}
function text(n){return typeof n==='object'?(n.children||[]).map(text).join(' '):String(n);}
function byClass(n,c){return nodes(n).find(x=>(x.props.className||'').split(' ').includes(c));}
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ru','ar','id','vi','it'];
for(const slug of Object.keys(data.TOKENIZED_ASSET_PAGES))for(const locale of locales)test(`${slug}/${locale}: original headline, answers, citations and exact unique destinations survive`,()=>{
 const old=render(before,slug,locale),now=render(current,slug,locale);
 const linkset=n=>[...new Set(nodes(n).filter(x=>x.type==='a').map(x=>x.props.href))].sort();
 assert.deepEqual(linkset(now),linkset(old));
 assert.equal(text(nodes(now).find(x=>x.type==='h1')),text(nodes(old).find(x=>x.type==='h1')));
 for(const c of ['tokenized-assets-answer','tokenized-assets-hero__date','tokenized-assets-sources','tokenized-assets-faq'])assert.equal(text(byClass(now,c)),text(byClass(old,c)));
 const rows=n=>nodes(n).filter(x=>x.props.className==='tokenized-assets-table__row').map(x=>x.children.map(y=>text(y)).join('|'));
 // Mobile labels add UI text only; each original cell value remains unchanged in its corresponding cell.
 const oldRows=nodes(old).filter(x=>x.props.className==='tokenized-assets-table__row'),newRows=nodes(now).filter(x=>x.props.className==='tokenized-assets-table__row');
 assert.equal(newRows.length,oldRows.length);
 oldRows.forEach((r,i)=>r.children.forEach((cell,j)=>assert.ok(text(newRows[i].children[j]).includes(text(cell)))));
});
for(const locale of ['en','zh-Hans'])test(`${locale}: three existing parent routes precede complete answer, with readable native navigation`,()=>{
 const tree=render(current,'tokenized-assets',locale),nav=byClass(tree,'tokenized-assets-route-nav'),answer=byClass(tree,'tokenized-assets-answer');
 assert.equal(nav.type,'nav');assert.ok(nav.props['aria-label']);
 const links=nodes(nav).filter(x=>x.type==='a');assert.equal(links.length,3);
 assert.deepEqual(links.map(x=>x.props.href),data.TOKENIZED_ASSET_PAGES['tokenized-assets'].decisionRows.filter(x=>x.route).map(x=>routing.localizedHref(x.route,{locale})));
 assert.ok(nodes(tree).indexOf(nav)<nodes(tree).indexOf(answer));
 assert.ok(links.every(x=>text(x).length>8));
 assert.doesNotMatch(text(tree),/AEO Direct Questions|AEO 直接问答|choosing the CTA|再决定 CTA|search and AI systems can parse|方便搜索和 AI 引擎/);
 const cells=nodes(tree).filter(x=>x.props.className==='tokenized-assets-cell-label');assert.equal(cells.length,6);
 assert.ok(cells.every(x=>x.props['aria-hidden']==='true'));
});
test('child pages preserve their original flow and supported language boundaries',()=>{
 assert.deepEqual(data.TOKENIZED_ASSET_LOCALES,['en','zh-Hans']);
 for(const slug of ['tokenized-treasuries','tokenized-stocks-vs-perpetuals'])assert.equal(byClass(render(current,slug,'en'),'tokenized-assets-route-nav'),undefined);
});
test('mobile title has bounded readable scale and routes are 44px without clipping',()=>{
 const css=fs.readFileSync(new URL('../src/components/v3/tokenized-assets-page.css',import.meta.url),'utf8');
 assert.match(css,/font-size: clamp\(28px, 7\.5vw, 32px\)/);
 assert.match(css,/text-wrap: balance/);
 assert.match(css,/\.tokenized-assets-route-nav a \{[^}]*min-height: 44px/s);
 assert.match(css,/\.tokenized-assets-route-nav a:focus-visible/);
 assert.match(css,/\.tokenized-assets-table__row \.tokenized-assets-cell-label \{\s*display: block/s);
});

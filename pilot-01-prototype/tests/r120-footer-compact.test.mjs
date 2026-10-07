import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import * as routing from '../src/data/locale-routing.js';
const compiler=createRequire(new URL('../../../../pilot-01-prototype/package.json',import.meta.url))('esbuild');
const dataModule={exports:{}};
vm.runInNewContext(compiler.buildSync({entryPoints:[fileURLToPath(new URL('../src/data/v3-product.js',import.meta.url))],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text,{module:dataModule,exports:dataModule.exports});
const data=dataModule.exports;
const current=fs.readFileSync(new URL('../src/components/v3/CleanFooter.jsx',import.meta.url),'utf8');
const baseline=fs.readFileSync(new URL('../../footer-before/CleanFooter.jsx',import.meta.url),'utf8');
function render(source,locale,brazil=false){const React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity).filter(x=>x!==null&&x!==false&&x!==undefined)})};const module={exports:{}};vm.runInNewContext(compiler.transformSync(source,{loader:'jsx',format:'cjs'}).code,{module,exports:module.exports,React,require:()=>({...data,...routing,NexuAlphaWordmark:'wordmark'})});return module.exports.CleanFooter({locale,brazil});}
function nodes(n){return !n||typeof n!=='object'?[]:[n,...(n.children||[]).flatMap(nodes)];}
function text(n){return typeof n==='object'?(n.children||[]).map(text).join(' '):String(n);}
function cls(n,c){return nodes(n).find(x=>(x.props.className||'').split(' ').includes(c));}
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ru','ar','id','vi','it'];
for(const locale of locales)test(`${locale}: all original destinations and full disclosures remain in server render`,()=>{
 for(const brazil of [false,true]){
 const old=render(baseline,locale,brazil),now=render(current,locale,brazil);
 const links=n=>nodes(n).filter(x=>x.props.href).map(x=>x.props.href).sort();
 assert.deepEqual(links(now),links(old));
 assert.equal(text(cls(now,'clean-footer__statement')),text(cls(old,'clean-footer__statement')));
 assert.equal(text(cls(now,'clean-footer__disclaimer')),text(cls(old,'clean-footer__disclaimer')));
 assert.equal(text(cls(now,'clean-footer__copyright')),text(cls(old,'clean-footer__copyright')));
 }
});
for(const locale of locales)test(`${locale}: compact default keeps six main routes and native policies contain original long copy`,()=>{
 const tree=render(current,locale),policies=cls(tree,'clean-footer__policies');
 assert.equal(policies.type,'details');assert.equal(policies.props.open,undefined);
 assert.equal(policies.children[0].type,'summary');
 assert.equal(nodes(cls(tree,'clean-footer__nav--primary')).filter(x=>x.type==='a').length,6);
 assert.equal(nodes(cls(tree,'clean-footer__nav--policies')).filter(x=>x.type==='a').length,5);
 assert.ok(nodes(policies).includes(cls(tree,'clean-footer__statement')));
 assert.ok(nodes(policies).includes(cls(tree,'clean-footer__disclaimer')));
 assert.equal(cls(tree,'clean-footer__intro'), undefined);
 assert.equal(cls(tree,'clean-footer__affiliate'), undefined);
 assert.ok(text(cls(tree,'clean-footer__summary')).length>20);
 if(locale!=='en')assert.notEqual(text(cls(tree,'clean-footer__summary')),text(cls(render(current,'en'),'clean-footer__summary')));
 if(locale!=='en')assert.notEqual(text(policies.children[0]),text(cls(render(current,'en'),'clean-footer__policies').children[0]));
});
test('actual SSR retains risk/policy body while native details has no open attribute or JS dependency',()=>{
 const req=createRequire(new URL('../../../../pilot-01-prototype/package.json',import.meta.url));
 const React=req('react'),{renderToStaticMarkup}=req('react-dom/server');
 const module={exports:{}};
 vm.runInNewContext(compiler.transformSync(current,{loader:'jsx',format:'cjs'}).code,{module,exports:module.exports,React,require:()=>({...data,...routing,NexuAlphaWordmark:({href})=>React.createElement('a',{href},'NexuAlpha')})});
 for(const locale of locales){
  const html=renderToStaticMarkup(React.createElement(module.exports.CleanFooter,{locale}));
  assert.match(html,/<details class="clean-footer__policies">/);
  assert.doesNotMatch(html,/<details[^>]*\bopen\b/);
  assert.match(html,/clean-footer__statement/);assert.match(html,/clean-footer__disclaimer/);
  assert.equal((html.match(/<a /g)||[]).length,12);
 }
});
test('compact footer uses one default statement, wrapping and 44px controls without hard-height clipping',()=>{
 const css=fs.readFileSync(new URL('../src/components/v3/clean-footer.css',import.meta.url),'utf8');
 assert.match(css,/min-height: 44px/);assert.match(css,/summary:focus-visible/);
 assert.match(css,/clean-footer__summary/);
 assert.match(css,/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
 assert.doesNotMatch(css,/overflow:\s*hidden|max-height:|line-clamp|(?:^|[;{]\s*)height:\s*\d+px/);
});

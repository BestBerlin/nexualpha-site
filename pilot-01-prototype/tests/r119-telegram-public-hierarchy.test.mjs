import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import * as config from '../src/data/telegram-config.js';
import * as returns from '../src/data/telegram-decision-return.js';
import * as routing from '../src/data/locale-routing.js';
const compiler=createRequire(new URL('../../../../pilot-01-prototype/package.json',import.meta.url))('esbuild');
const current=fs.readFileSync(new URL('../src/components/v3/TelegramBotHub.jsx',import.meta.url),'utf8');
const baseline=fs.readFileSync(new URL('../../../r118-r110-visual/promotion-runtime-r118-20261005/src/components/v3/TelegramBotHub.jsx',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/components/v3/telegram-bot-hub.css',import.meta.url),'utf8');
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ru','ar','id','vi','it'];
function mount(source,{locale='en',search=''}={}) {
  let cursor=0;const slots=[],effects=[];
  const React={Fragment:'fragment',createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity).filter(x=>x!==false&&x!==null&&x!==undefined)}),
    useState(value){const key=cursor++;slots[key]??={value:typeof value==='function'?value():value};return[slots[key].value,v=>slots[key].value=typeof v==='function'?v(slots[key].value):v];},
    useCallback(fn){cursor++;return fn;},useEffect(fn){cursor++;if(!mounted)effects.push(fn);}};
  let mounted=false;const module={exports:{}};
  const mocks={...config,...returns,...routing,buildTelegramReturnContext:input=>returns.buildTelegramReturnContext({...input,now:1760000000000})};
  const compiled=compiler.transformSync(source,{loader:'jsx',format:'cjs'}).code;
  vm.runInNewContext(compiled,{module,exports:module.exports,require:name=>name==='react'?React:mocks,window:{innerWidth:390,location:{search},addEventListener(){},removeEventListener(){}},navigator:{},setTimeout(){}});
  const render=()=>{cursor=0;return module.exports.TelegramBotHub({locale,headingLevel:1});};
  return {render,flush(){mounted=true;for(const effect of effects)effect();}};
}
function nodes(root){const result=[];function visit(n){if(!n||typeof n!=='object')return;result.push(n);for(const child of n.children||[])visit(child);}visit(root);return result;}
function byClass(root,name){return nodes(root).find(n=>(n.props.className||'').split(' ').includes(name));}
function hrefs(root){return [...new Set(nodes(root).filter(n=>n.type==='a').map(n=>n.props.href))].sort();}
for(const locale of locales)test(`${locale}: purpose precedes CTA; ops metadata is collapsed and all unique links are retained`,()=>{
  const h=mount(current,{locale});let tree=h.render();h.flush();tree=h.render();
  const container=byClass(tree,'tg-hub__container');
  assert.equal(container.children[0].type,'header');
  assert.equal(container.children[0].props.className,'tg-hub__header');
  assert.equal(container.children[1].props.className,'tg-hub__quick-cta');
  assert.equal(nodes(tree).filter(n=>n.type==='h1').length,1);
  assert.equal(byClass(tree,'tg-return-context'),undefined);
  const ops=byClass(tree,'tg-ops-pack');assert.equal(ops.type,'details');assert.equal(ops.props.open,undefined);
  assert.ok(byClass(ops,'tg-inbound-summary'));
  assert.equal(container.children.some(n=>n.props?.className==='tg-inbound-summary'),false);
  const old=mount(baseline,{locale});old.render();old.flush();assert.deepEqual(hrefs(tree),hrefs(old.render()));
  const summary=ops.children[0];assert.equal(summary.type,'summary');assert.ok(summary.children[0]);
  if(locale!=='en')assert.notEqual(summary.children[0],'Editorial notes and publication review');
});
test('missing ordinary context does not show fallback; actual invalid return context does',()=>{
  const h=mount(current,{search:'?tg_return=unknown_source'});h.render();h.flush();
  const notice=byClass(h.render(),'tg-return-context');assert.ok(notice);
  assert.equal(notice.props['data-telegram-context-status'],'fallback');
});
test('valid Telegram return remains restored and preserves its exact entry URL',()=>{
  const context=returns.buildTelegramReturnContext({venue:'bitget',locale:'en',market:'GLOBAL',product:'spot'});
  const search=new URL(context.href,'https://nexualpha.com').search;
  const expected=returns.readTelegramReturnContext(search);
  assert.equal(expected.status,'restored');
  const h=mount(current,{search});h.render();h.flush();
  const notice=byClass(h.render(),'tg-return-context');assert.equal(notice.props['data-telegram-context-status'],'restored');
  assert.equal(nodes(notice).find(n=>n.type==='a').props.href,expected.href);
});
test('visual order follows DOM order; quick CTA keeps 44px and permits long localized copy wrapping',()=>{
  assert.ok(!/\border\s*:/.test(css));
  assert.match(css,/\.tg-hub__quick-cta \.tg-btn \{ min-height: 44px; white-space: normal;/);
});

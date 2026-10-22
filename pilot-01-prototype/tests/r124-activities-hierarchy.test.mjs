import { committedFileHash } from './r100-test-contracts.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

import { existsSync } from 'node:fs';

if (existsSync(new URL('../../../r123-interaction-repair/candidate/src/components/v3/activity/ActivityCenterV3.jsx', import.meta.url))) {
const req=createRequire(new URL('../package.json',import.meta.url)), compiler=req('esbuild');
const source=readFileSync(new URL('../src/components/v3/activity/ActivityCenterV3.jsx',import.meta.url),'utf8');
const baseline=readFileSync(new URL('../../../r123-interaction-repair/candidate/src/components/v3/activity/ActivityCenterV3.jsx',import.meta.url),'utf8');
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ru','ar','id','vi','it'];
function data(path){const module={exports:{}};vm.runInNewContext(compiler.buildSync({entryPoints:[fileURLToPath(new URL('../src/'+path,import.meta.url))],bundle:true,write:false,platform:'node',format:'cjs'}).outputFiles[0].text,{module,exports:module.exports,URL,URLSearchParams});return module.exports;}
const deps=Object.assign({},...['components/v3/activity/activity-copy.js','components/v3/activity/campaign-copy.js','data/v3-product.js','data/official-campaign-research.js','data/official-campaign-model.js','components/v3/matcher-model.js','data/telegram-config.js','data/contextual-href.js','components/v3/activity/activity-eligibility.js','components/official-updates/official-updates-model.js'].map(data));
const now=Date.parse('2026-10-05T00:00:00Z');
const venues=[{slug:'binance',name:'Binance',category:'CEX',sourceHubs:[{url:'https://www.binance.com/en/support/announcement'}]}];
const update={id:'listing-fixture',kind:'listing',title:'Preserved listing fixture',summary:'Original source-backed summary',platform:{slug:'binance',name:'Binance'},reviewStatus:'APPROVED',fixture:false,officialSource:{url:'https://www.binance.com/en/support/announcement'},discoveredAt:'2026-10-04T00:00:00Z',verifiedAt:'2026-10-04T01:00:00Z',expiresAt:'2026-10-06T00:00:00Z'};
function mount(src,locale,updates=[]){let cursor=0;const slots=[];const React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity).filter(x=>x!==false&&x!==null&&x!==undefined)}),Fragment:'fragment',useMemo:fn=>fn(),useState(initial){const i=cursor++;slots[i]??={value:typeof initial==='function'?initial():initial};return[slots[i].value,v=>slots[i].value=typeof v==='function'?v(slots[i].value):v];}};
 const mocks={...deps,OFFICIAL_EXCHANGE_ACTIVITIES:[],useActivityNow:()=>now,BrandMark:'brand',DecisionPathRail:'rail',OfficialResearchIndex:'official-index'};const module={exports:{}};
 vm.runInNewContext(compiler.transformSync(src,{loader:'jsx',format:'cjs'}).code,{module,exports:module.exports,React,require:name=>name==='react'?React:mocks,URL,Intl,Date});
 return {render(){cursor=0;return module.exports.ActivityCenterV3({locale,market:'BR',product:'spot',venues,publicUpdates:updates});}};
}
function nodes(node){return !node||typeof node!=='object'?[]:[node,...(node.children||[]).flatMap(nodes)];}
function byClass(tree,name){return nodes(tree).find(n=>(n.props.className||'').split(' ').includes(name));}
function texts(tree){if(typeof tree!=='object')return[String(tree)];return(tree.children||[]).flatMap(texts);}
function links(tree){return nodes(tree).filter(n=>n.props.href).map(n=>n.props.href).sort();}
for(const locale of locales)test(`${locale}: heading, filters and real result state precede secondary notes with all original content intact`,()=>{
 for(const updates of [[],[update]]){
  const tree=mount(source,locale,updates).render(),old=mount(baseline,locale,updates).render();
  assert.deepEqual(links(tree),links(old));const newTexts=texts(tree);for(const text of texts(old))assert.ok(newTexts.includes(text),`${locale}: preserved original text ${text}`);
  const support=nodes(tree).find(n=>n.props.className==='activity-center-v3__support-details');assert.ok(support);assert.equal(support.type,'details');assert.equal(support.props.open,undefined);assert.equal(support.children[0].type,'summary');
  for(const cls of ['activity-center-v3__gate','activity-center-v3__snapshot','activity-center-v3__tg-banner'])assert.ok(byClass(support,cls));assert.ok(nodes(support).some(n=>n.type==='rail'));
  const filters=byClass(tree,'activity-center-v3__filters'),state=byClass(tree,updates.length?'activity-center-v3__grid':'activity-center-v3__empty');
  if(updates.length){
   assert.ok(tree.children.indexOf(filters)>tree.children.indexOf(byClass(tree,'activity-center-v3__head')));assert.ok(tree.children.indexOf(filters)<tree.children.indexOf(state));
  }else{
   const drawer=byClass(tree,'activity-center-v3__empty-filter-details');assert.ok(drawer);assert.equal(drawer.type,'details');assert.equal(drawer.props.open,undefined);assert.equal(drawer.children[0].type,'summary');assert.ok(texts(drawer.children[0]).join('').trim());assert.ok(nodes(drawer).includes(filters));assert.ok(tree.children.indexOf(state)<tree.children.indexOf(drawer));assert.ok(tree.children.indexOf(drawer)<tree.children.indexOf(support));
  }
  assert.ok(tree.children.indexOf(state)<tree.children.indexOf(support));
  assert.equal(nodes(tree).filter(n=>n.type==='h1').length,1);
  if(locale!=='en')assert.notDeepEqual(texts(support.children[0]),texts(nodes(mount(source,'en',updates).render()).find(n=>n.props.className==='activity-center-v3__support-details').children[0]));
 }
});
test('real review, deadline and eligibility gates survive reordered filters and empty/list states',()=>{
 const h=mount(source,'en',[update,{...update,id:'unreviewed',title:'Must not publish unreviewed',reviewStatus:'PENDING'},{...update,id:'expired',title:'Must not publish expired',expiresAt:'2026-10-04T00:00:00Z'}]);let tree=h.render();
 assert.equal(nodes(tree).filter(n=>n.props.className==='activity-card-v3').length,1);
 assert.ok(texts(tree).includes(update.title));assert.ok(!texts(tree).includes('Must not publish unreviewed'));assert.ok(!texts(tree).includes('Must not publish expired'));
 assert.ok(!links(tree).some(href=>href.includes('/activities/listing-fixture')),'missing eligibility does not unlock activity CTA');
 const buttons=byClass(tree,'activity-center-v3__filters').children;buttons[2].props.onClick();tree=h.render();assert.ok(byClass(tree,'activity-center-v3__empty'));assert.equal(byClass(tree,'activity-center-v3__filters').children[2].props['aria-pressed'],true);
 buttons[0].props.onClick();assert.ok(byClass(h.render(),'activity-center-v3__grid'));
 const sha=createHash('sha256').update(readFileSync(new URL('../src/data/partner-registry.js',import.meta.url))).digest('hex');assert.equal(sha,committedFileHash('src/data/partner-registry.js'));
});

test('actual server markup keeps complete closed native notes without JS or deleting source/Telegram routes',()=>{
 const React=req('react'),{renderToStaticMarkup}=req('react-dom/server');const module={exports:{}};
 const mocks={...deps,OFFICIAL_EXCHANGE_ACTIVITIES:[],useActivityNow:()=>now,BrandMark:()=>React.createElement('span'),DecisionPathRail:()=>React.createElement('nav',{'data-test-rail':true}),OfficialResearchIndex:()=>React.createElement('div',{'data-test-index':true})};
 vm.runInNewContext(compiler.transformSync(source,{loader:'jsx',format:'cjs'}).code,{module,exports:module.exports,React,require:name=>name==='react'?React:mocks,URL,Intl,Date});
 for(const locale of locales){
  const html=renderToStaticMarkup(React.createElement(module.exports.ActivityCenterV3,{locale,market:'BR',product:'spot',venues,publicUpdates:[]}));
  assert.match(html,/<details class="activity-center-v3__support-details">/);
  assert.ok(html.indexOf('activity-center-v3__empty') < html.indexOf('activity-center-v3__filters'));
  assert.match(html,/<details class="activity-center-v3__support-details activity-center-v3__empty-filter-details"><summary>[^<]+<\/summary>/);
  assert.ok(html.indexOf('activity-center-v3__empty-filter-details') < html.indexOf('<details class="activity-center-v3__support-details">'));
  assert.ok(html.indexOf('activity-center-v3__empty') < html.indexOf('activity-center-v3__support-details'));
  const support=html.slice(html.indexOf('<details class="activity-center-v3__support-details">'));
  assert.ok(!/^<details[^>]*\bopen\b/.test(support));
  for(const cls of ['activity-center-v3__gate','activity-center-v3__snapshot','activity-center-v3__tg-banner'])assert.ok(support.includes(cls));
  assert.ok(support.includes(deps.TELEGRAM_CONFIG.channelUrl));
 }
});

} else {
  test('historical regression requires original archived checkout', { skip: 'Original historical source snapshot is absent from a fresh checkout; current-source tests run separately.' }, () => {});
}

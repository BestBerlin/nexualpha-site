import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { buildSync } from 'esbuild';
import { nextDecisionBridgeCopy } from '../src/data/next-decision-bridge.js';
const req=createRequire(import.meta.url),React=req('react'),{renderToStaticMarkup}=req('react-dom/server'),postcss=req('postcss');
const root=fileURLToPath(new URL('../',import.meta.url)),base=fileURLToPath(new URL('../../../r198-coherent-reader-integration/candidate/',import.meta.url));
const read=(r,p)=>readFileSync(path.join(r,p),'utf8'),file='src/components/v3/TopicGuidePage.jsx';
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];
class FixedDate extends Date{constructor(...a){super(...(a.length?a:[1791190800000]));}static now(){return 1791190800000;}}
function load(r,react=React,jsxRuntime){const o=buildSync({stdin:{contents:read(r,file)+'\nexport {TopicDisclosure};',resolveDir:path.dirname(path.join(r,file)),sourcefile:path.join(r,file),loader:'jsx'},bundle:true,write:false,platform:'node',format:'cjs',loader:{'.css':'empty'},external:['react','react/jsx-runtime']}).outputFiles[0].text,m={exports:{}};vm.runInNewContext(o,{module:m,exports:m.exports,require:n=>n==='react'?react:n==='react/jsx-runtime'&&jsxRuntime?jsxRuntime:req(n),URL,URLSearchParams,Intl,Date:FixedDate,console,setTimeout,clearTimeout});return m.exports;}
const Before=load(base),After=load(root);
const anchors=h=>[...h.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]);
function wrapper(html){const start=html.indexOf('<details class="topic-disclosure topic-telegram-disclosure"');assert.ok(start>=0,'new native Telegram disclosure exists');const tail=html.slice(start);let depth=0;for(const t of tail.matchAll(/<details\b[^>]*>|<\/details>/g)){depth+=t[0].startsWith('</')?-1:1;if(!depth)return tail.slice(0,t.index+t[0].length);}assert.fail('unclosed disclosure');}
const text=h=>h.replace(/<[^>]*>/g,'');
for(const locale of locales)test(locale+': two distinct original Bot modules/contexts remain intact in one closed continuation while main research remains outside',()=>{
 for(const slug of ['meme-coins','derivatives','compliant-exchanges','no-kyc']){
  const props={slug,locale,market:'BR',product:'perp'},before=renderToStaticMarkup(React.createElement(Before.TopicGuidePage,props)),after=renderToStaticMarkup(React.createElement(After.TopicGuidePage,props)),w=wrapper(after);
  const label=nextDecisionBridgeCopy(locale).telegram;assert.ok(label.trim());if(locale!=='en')assert.notEqual(label,nextDecisionBridgeCopy('en').telegram);
  const escapedLabel=renderToStaticMarkup(React.createElement('span',null,label)).slice(6,-7);
  const prefix=`<details class="topic-disclosure topic-telegram-disclosure"><summary>${escapedLabel}<span aria-hidden="true">+</span></summary><div class="topic-disclosure__body">`,suffix='</div></details>';
  assert.ok(w.startsWith(prefix));assert.ok(w.endsWith(suffix));const original=w.slice(prefix.length,-suffix.length);
  assert.equal(after.replace(w,original),before,'whole original topic HTML exactly preserved outside added native wrapper and label');
  assert.deepEqual(anchors(after),anchors(before),'complete ordered anchors and duplicate hrefs/text/attrs survive');
  assert.equal(text(after.replace(w,original)),text(before),'complete prior visible text order unchanged');
  assert.ok(original.includes('topic-tg-box'));assert.ok(original.includes('topic-onsite-bot-handoff-'+slug));
  assert.equal((original.match(/class="topic-tg-box"/g)||[]).length,1);assert.equal((after.match(/topic-telegram-disclosure/g)||[]).length,1);
  assert.ok(after.indexOf('topic-next-decision-bridge')<after.indexOf(w),'main NextDecisionBridge stays visible before optional Bot context');
 }
});

test('source inverse allows only wrapper, pure existing copy import and default-preserving optional disclosure policy',()=>{
 const before=read(base,file),after=read(root,file),open='        <TopicDisclosure title={nextDecisionBridgeCopy(locale).telegram} className="topic-telegram-disclosure" desktopDefaultOpen={false}>\n',end='        </TopicDisclosure>\n\n        {/* 底部全赛道矩阵快速导航 (Topic Matrix Switcher) */}';
 assert.equal(after.split(open).length,2);assert.equal(after.split(end).length,2);
 const restored=after.replace(open,'').replace(end,'        {/* 底部全赛道矩阵快速导航 (Topic Matrix Switcher) */}').replace('import { nextDecisionBridgeCopy } from "../../data/next-decision-bridge.js";\n','').replace('function TopicDisclosure({ title, children, className = "", desktopDefaultOpen = true })','function TopicDisclosure({ title, children, className = "" })').replace('Boolean(detailsRef.current?.open) || (desktopDefaultOpen && viewportWidth > 640)','Boolean(detailsRef.current?.open) || viewportWidth > 640');
 assert.equal(restored,before,'all original source facts/FAQ/state/SEO/copy/links outside tiny policy remain exact');
 for(const p of ['src/data/partner-registry.js','src/data/topic-guides-data.js','src/data/topic-source-registry.js','src/data/topic-reviewed-faqs.js','src/components/v3/OnsiteTelegramBotHandoff.jsx','src/components/v3/NextDecisionBridge.jsx','src/data/next-decision-bridge.js'])assert.equal(read(root,p),read(base,p),p);
 assert.equal(createHash('sha256').update(read(root,'src/data/partner-registry.js')).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});

test('continuation summary is scoped 44px/focus-visible and whole CSS inverse has no hidden content/new motion/typography changes',()=>{
 const css=read(root,'src/components/v3/topic-guide.css'),old=read(base,'src/components/v3/topic-guide.css'),marker='\n/* R203: optional Telegram research is a compact native continuation. */\n';assert.ok(css.includes(marker));assert.equal(css.slice(0,css.indexOf(marker)),old);
 const suffix=css.slice(css.indexOf(marker)),ast=postcss.parse(suffix),rules=[];ast.walkRules(r=>rules.push(r));assert.ok(rules.every(r=>r.selector.startsWith('.topic-telegram-disclosure')));
 const summary=rules.find(r=>r.selector==='.topic-telegram-disclosure > summary');assert.ok(summary);assert.equal(summary.nodes.find(d=>d.prop==='min-height')?.value,'44px');assert.ok(rules.some(r=>r.selector.includes(':focus-visible')));
 assert.doesNotMatch(suffix,/font-size|font-family|text-overflow|overflow:\s*hidden|display:\s*none|animation|transition|transform|left:|right:/);
});

test('real TopicDisclosure controlled effect honors closed desktop policy and native open/close choices across viewport rerenders',()=>{
 let width=1440,state=false,refs=[],ri=0,effect,sets=[],node={open:false};
 const fake={...React,useRef:init=>refs[ri++]??(refs[ri-1]={current:init}),useState:init=>[state,n=>{state=n;sets.push(n);}],useEffect:(fn,deps)=>{assert.deepEqual(Array.from(deps),[]);effect=fn;}};
 // Controlled real effect execution; actual mounted/browser behavior remains a separate acceptance.
 const source=read(root,file);const start=source.indexOf('function TopicDisclosure('),end=source.indexOf('\nexport function TopicGuidePage',start);assert.ok(start>=0&&end>start);
 const h=buildSync({stdin:{contents:'import React,{useEffect,useRef,useState} from "react";\n'+source.slice(start,end)+'\nexport {TopicDisclosure};',loader:'jsx'},bundle:false,write:false,format:'cjs'}).outputFiles[0].text,m={exports:{}};
 vm.runInNewContext(h,{module:m,exports:m.exports,require:n=>n==='react'?fake:req(n),window:{get visualViewport(){return {width};},get innerWidth(){return width;}},document:{documentElement:{get clientWidth(){return width;}}}});const D=m.exports.TopicDisclosure;
 function step(props){ri=0;const t=D({title:'Research',children:'Original',...props});t.props.ref.current=node;return t;}
 step({desktopDefaultOpen:false});effect();assert.equal(state,false,'closed Bot section stays closed after desktop hydration');assert.deepEqual(sets,[false]);
 node.open=true;step({desktopDefaultOpen:false}).props.onToggle({currentTarget:node});assert.equal(state,true);width=320;effect();assert.equal(step({desktopDefaultOpen:false}).props.open,true,'resize cannot reset native expanded intent');
 node.open=false;step({desktopDefaultOpen:false}).props.onToggle({currentTarget:node});width=1440;effect();assert.equal(step({desktopDefaultOpen:false}).props.open,false,'native closed intent remains on desktop');
 refs=[];state=false;sets=[];node={open:true};step({desktopDefaultOpen:false});effect();assert.equal(state,true,'native prehydration open is adopted');
 refs=[];state=false;sets=[];node={open:false};step({});effect();assert.equal(state,true,'all old default disclosures retain original desktop open policy');
 refs=[];state=false;sets=[];node={open:false};width=320;step({});effect();assert.equal(state,false,'old mobile default stays closed');width=1440;effect();assert.equal(step({}).props.open,false,'existing mobile reading choice is not overridden by resize');
});

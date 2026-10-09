import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const req=createRequire(new URL('../package.json',import.meta.url));
const {transformSync}=req('esbuild');
const source=readFileSync(new URL('../src/components/v3/TopicGuidePage.jsx',import.meta.url),'utf8');
const begin=source.indexOf('function TopicDisclosure('),end=source.indexOf('\nexport function TopicGuidePage',begin);
const component=source.slice(begin,end);
// Existing mounted-hook harness pattern: execute actual JSX function and effects,
// attach a retained native details model before effects; not browser/React DOM QA.
function mount({width=390,nativeOpen=false}={}){
 let cursor=0,tree;const slots=[],effects=[],listeners=new Set();
 const details={open:nativeOpen};
 const React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)})};
 const useState=initial=>{const i=cursor++;slots[i]??={value:initial};return[slots[i].value,v=>slots[i].value=typeof v==='function'?v(slots[i].value):v];};
 const useRef=initial=>{const i=cursor++;slots[i]??={current:initial};return slots[i];};
 const useEffect=(fn,deps)=>{const i=cursor++,old=slots[i];if(!old||deps.some((v,j)=>!Object.is(v,old.deps[j])))effects.push(()=>{old?.cleanup?.();slots[i]={deps,fn,cleanup:fn()};});};
 const window={innerWidth:width,visualViewport:{width,addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)},addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)};
 const module={exports:{}};vm.runInNewContext(transformSync(component+'\nmodule.exports=TopicDisclosure;',{loader:'jsx',format:'cjs'}).code,{module,React,useState,useRef,useEffect,window,document:{documentElement:{clientWidth:width}}});
 function render(retain=false){cursor=0;tree=module.exports({title:'Read source',children:'Original content'});tree.props.ref.current=details;if(!retain)details.open=tree.props.open;return tree;}
 render(true);while(effects.length)effects.shift()();render();
 return{details,get tree(){return tree;},get listeners(){return listeners.size;},choose(open){details.open=open;tree.props.onToggle({currentTarget:details});render();},resize(next){window.innerWidth=window.visualViewport.width=next;for(const fn of [...listeners])fn();render();},rerender:()=>render(),strictReplay(){for(const slot of slots){if(slot?.fn){slot.cleanup?.();slot.cleanup=slot.fn();}}render();},unmount(){for(const slot of slots)slot?.cleanup?.();}};
}
test('prehydration native open on mobile is adopted instead of closed by initial default',()=>{const h=mount({nativeOpen:true});assert.equal(h.details.open,true);assert.equal(h.tree.props.open,true);});
test('mobile user opens content and retains it across 640 breakpoint round trip',()=>{const h=mount();assert.equal(h.details.open,false);h.choose(true);h.resize(900);h.resize(390);assert.equal(h.details.open,true);});
test('initial desktop default open and explicit close remain stable across widths',()=>{const h=mount({width:900});assert.equal(h.details.open,true);h.choose(false);h.resize(390);h.resize(900);assert.equal(h.details.open,false);});
test('fresh mobile defaults closed; fresh desktop defaults open; native open wins on either',()=>{for(const width of [390,900])for(const nativeOpen of [false,true]){const h=mount({width,nativeOpen});assert.equal(h.details.open,nativeOpen||width>640);}});
test('parent rerender and strict effect replay do not reset user intent',()=>{const h=mount();h.choose(true);h.rerender();h.strictReplay();assert.equal(h.details.open,true);h.choose(false);h.strictReplay();assert.equal(h.details.open,false);});
test('no resize subscription or leaked cleanup remains after initialization',()=>{const h=mount();assert.equal(h.listeners,0);h.unmount();assert.equal(h.listeners,0);});
test('all source bytes outside bounded disclosure component and registry remain frozen',()=>{const old=readFileSync(new URL('../../topic-before.jsx',import.meta.url),'utf8');const strip=s=>{const a=s.indexOf('function TopicDisclosure('),b=s.indexOf('\nexport function TopicGuidePage',a);return s.slice(0,a)+s.slice(b);};assert.equal(strip(source),strip(old));assert.equal(createHash('sha256').update(readFileSync(new URL('../src/data/partner-registry.js',import.meta.url))).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');assert.match(component,/<summary>\{title\}/);assert.match(component,/\{children\}/);});
test('closed desktop disclosure keeps a reachable summary while default-open desktop stays compact',()=>{
 const css=readFileSync(new URL('../src/components/v3/topic-guide.css',import.meta.url),'utf8');
 const postcss=req('postcss');
 function display(width,open){let value='list-item';postcss.parse(css).walkRules(rule=>{if(!['.topic-section-disclosure > summary','.topic-section-disclosure[open] > summary'].includes(rule.selector)||rule.selector.includes('[open]')&&!open)return;let active=true;for(let p=rule.parent;p;p=p.parent){if(p.type==='atrule'&&p.name==='media'){const min=p.params.match(/min-width:\s*(\d+)px/),max=p.params.match(/max-width:\s*(\d+)px/);if(min&&width<+min[1]||max&&width>+max[1])active=false;}}if(active)rule.walkDecls('display',d=>value=d.value);});return value;}
 assert.equal(display(900,false),'flex');assert.equal(display(900,true),'flex');assert.equal(display(390,false),'flex');assert.equal(display(390,true),'flex');
});

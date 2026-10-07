import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const req=createRequire(new URL('../../../../pilot-01-prototype/package.json',import.meta.url));
const {transformSync}=req('esbuild');
const source=readFileSync(new URL('../src/components/v3/LiveConversionProof.jsx',import.meta.url),'utf8');
function events() {
  const listeners = new Map();
  return {
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    dispatch(type) { for (const fn of [...(listeners.get(type) || [])]) fn({ type }); },
    count() { return [...listeners.values()].reduce((n, list) => n + list.size, 0); }
  };
}
function clock() {
  let now = 0, id = 0;
  const tasks = new Map();
  const add = (fn, delay, interval) => { tasks.set(++id, { fn, due: now + delay, interval }); return id; };
  return {
    setInterval: (fn, delay) => add(fn, delay, delay),
    setTimeout: (fn, delay) => add(fn, delay, 0),
    clearInterval: value => tasks.delete(value),
    clearTimeout: value => tasks.delete(value),
    count: () => tasks.size,
    advance(ms) {
      const end = now + ms;
      for (;;) {
        const next = [...tasks].sort((a, b) => a[1].due - b[1].due)[0];
        if (!next || next[1].due > end) break;
        const [key, task] = next; now = task.due;
        if (task.interval) task.due += task.interval; else tasks.delete(key);
        task.fn();
      }
      now = end;
    }
  };
}

function mount({width=1024,height=900,reduced=false,hidden=false,legacy=false}={}){
 const motion={...events(),matches:reduced},narrow={...events(),matches:width<=780},short={...events(),matches:height<=500};
 if(legacy)for(const media of [motion,narrow,short]){media.addListener=fn=>media.on.addEventListener('change',fn);media.removeListener=fn=>media.on.removeEventListener('change',fn);media.on={...media};media.addEventListener=undefined;media.removeEventListener=undefined;}
 const document={...events(),hidden},window={matchMedia:query=>{if(query==='(prefers-reduced-motion: reduce)')return motion;if(query==='(max-width: 780px)')return narrow;if(query==='(max-height: 500px)')return short;throw Error(query);}};
 const timers=clock(),slots=[],pending=[];let dirty=false,tree;let cursor=0,props={locale:'en'};
 const React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)}),useState(initial){const i=cursor++;slots[i]??={value:initial};return[slots[i].value,v=>{const next=typeof v==='function'?v(slots[i].value):v;if(next!==slots[i].value){slots[i].value=next;dirty=true;}}];},useRef(initial){const i=cursor++;slots[i]??={current:initial};return slots[i];},useEffect(fn,deps){const i=cursor++,previous=slots[i];if(!previous||deps.some((v,j)=>v!==previous.deps[j]))pending.push(()=>{previous?.cleanup?.();slots[i]={deps,fn,cleanup:fn()};});}};
 const module={exports:{}};vm.runInNewContext(transformSync(source,{loader:'jsx',format:'cjs'}).code,{module,exports:module.exports,require:name=>name==='react'?React:{},window,document,...timers});
 const render=()=>{cursor=0;tree=module.exports.LiveConversionProof(props);};
 const draw=()=>{for(let round=0;round<20;round++){dirty=false;render();while(pending.length)pending.shift()();if(!dirty)return tree;}throw Error('unsettled hooks');};draw();
 const find=(node,predicate)=>predicate(node)?node:node.children?.map(child=>child&&typeof child==='object'?find(child,predicate):null).find(Boolean);
 return{draw,timers,motion,narrow,short,document,button:()=>find(draw(),node=>node.type==='button'),click(){this.button().props.onClick();return draw();},resize(w){narrow.matches=w<=780;narrow.dispatch('change');draw();},unmount(){for(const slot of slots)slot?.cleanup?.();},replay(){for(const slot of slots)if(slot?.fn){slot.cleanup?.();slot.cleanup=slot.fn();}return draw();},locale(l){props={locale:l};return draw();}};

}

const action=tree=>JSON.stringify(tree);
test('CSS-hidden mobile panel creates no timer, including exact 780px boundary',()=>{
 for(const width of [320,390,780]){const h=mount({width});const before=action(h.draw());assert.equal(h.timers.count(),0);h.timers.advance(30000);assert.equal(action(h.draw()),before);h.click();assert.equal(h.timers.count(),0);h.unmount();assert.equal(h.motion.count()+h.narrow.count()+h.short.count()+h.document.count(),0);}
});
test('visible 781px requires Play; resize cancels fade and restoring width does not resume',()=>{
 const h=mount({width:781});assert.equal(h.timers.count(),0);h.click();assert.equal(h.timers.count(),1);h.timers.advance(4500);assert.equal(h.timers.count(),2);assert.match(action(h.draw()),/conversion-proof__example--out/);h.resize(780);assert.equal(h.timers.count(),0);assert.match(action(h.draw()),/conversion-proof__example--in/);const before=action(h.draw());h.timers.advance(30000);assert.equal(action(h.draw()),before);h.resize(1024);assert.equal(h.timers.count(),0);h.click();const playing=action(h.draw());h.timers.advance(4499);assert.equal(action(h.draw()),playing);h.timers.advance(401);assert.notEqual(action(h.draw()),playing);h.unmount();assert.equal(h.timers.count(),0);
});
test('mobile, background and reduced gates remain independent and require new consent',()=>{
 const h=mount({width:390});h.document.hidden=true;h.document.dispatch('visibilitychange');h.resize(1000);h.click();assert.equal(h.timers.count(),0);h.document.hidden=false;h.document.dispatch('visibilitychange');h.draw();assert.equal(h.timers.count(),0);h.click();assert.equal(h.timers.count(),1);h.motion.matches=true;h.motion.dispatch('change');h.draw();assert.equal(h.timers.count(),0);h.resize(390);h.motion.matches=false;h.motion.dispatch('change');h.draw();assert.equal(h.timers.count(),0);h.resize(1000);assert.equal(h.timers.count(),0);h.click();h.timers.advance(4500);h.document.hidden=true;h.document.dispatch('visibilitychange');h.draw();assert.equal(h.timers.count(),0);h.unmount();assert.equal(h.motion.count()+h.narrow.count()+h.short.count()+h.document.count(),0);
});
test('effect replay and repeated events never leave duplicate cycles or listeners',()=>{
 const h=mount();h.replay();h.replay();assert.equal(h.timers.count(),0);h.click();h.replay();h.replay();assert.equal(h.timers.count(),1);assert.equal(h.motion.count(),1);assert.equal(h.narrow.count(),1);assert.equal(h.document.count(),1);h.resize(1000);h.document.dispatch('visibilitychange');h.draw();assert.equal(h.timers.count(),1);h.timers.advance(4500);h.unmount();assert.equal(h.timers.count(),0);assert.equal(h.motion.count()+h.narrow.count()+h.short.count()+h.document.count(),0);
});
test('legacy media listeners react to resize/motion and are removed',()=>{
 const h=mount({width:390,legacy:true});assert.equal(h.timers.count(),0);h.resize(1000);assert.equal(h.timers.count(),0);h.click();assert.equal(h.timers.count(),1);h.motion.matches=true;h.motion.dispatch('change');h.draw();assert.equal(h.timers.count(),0);h.unmount();assert.equal(h.motion.count()+h.narrow.count()+h.short.count()+h.document.count(),0);
});
test('all localized disclaimer, full example data and registry stay unchanged',()=>{
 const baseline=readFileSync(new URL('../../../r125-reading-hierarchy/candidate/src/components/v3/LiveConversionProof.jsx',import.meta.url),'utf8');
 const data=text=>text.slice(text.indexOf('const MOCK_EVENTS'),text.indexOf('export function LiveConversionProof')).split('const examplePlaybackCopy')[0].trim();assert.equal(data(source),data(baseline));assert.equal(source.match(/  const exampleLabel =[^\n]+/)[0],baseline.match(/  const exampleLabel =[^\n]+/)[0]);
 const h=mount({width:390});for(const l of ['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ru','ar','id','vi','it']){const tree=h.locale(l);assert.ok(tree.props['aria-label']);assert.equal(tree.props['aria-live'],'off');assert.equal(h.timers.count(),0);}h.unmount();
 assert.equal(createHash('sha256').update(readFileSync(new URL('../src/data/partner-registry.js',import.meta.url))).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
 const css=readFileSync(new URL('../src/components/v3/live-conversion-proof.css',import.meta.url),'utf8');assert.match(css,/@media \(max-width: 780px\)[\s\S]*\.conversion-proof-toast \{ display: none;/);
});

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
 return{draw,timers,motion,narrow,short,document,button:()=>find(draw(),node=>node.type==='button'),click(){this.button().props.onClick();return draw();},resize(w){narrow.matches=w<=780;narrow.dispatch('change');draw();},unmount(){for(const slot of slots)slot?.cleanup?.();},locale(l){props={locale:l};return draw();}};

}

const snapshot=h=>JSON.stringify(h.draw());
test('default static, no live announcements; only explicit Play starts rotation',()=>{const h=mount();assert.equal(h.timers.count(),0);assert.equal(h.draw().props['aria-live'],'off');assert.equal(h.button().props['aria-pressed'],false);h.timers.advance(30000);assert.equal(h.timers.count(),0);h.click();assert.equal(h.timers.count(),1);assert.equal(h.button().props['aria-pressed'],true);const before=snapshot(h);h.timers.advance(4900);assert.notEqual(snapshot(h),before);h.unmount();});
test('Pause cancels pending fade before index advances; control remains visible',()=>{const h=mount();h.click();h.timers.advance(4500);assert.equal(h.timers.count(),2);assert.match(h.draw().props.className,/--in/);h.click();assert.equal(h.timers.count(),0);const before=snapshot(h);h.timers.advance(30000);assert.equal(snapshot(h),before);h.unmount();});
test('pointer and keyboard focus pause without resuming on departure',()=>{for(const handler of ['onPointerEnter','onFocusCapture']){const h=mount();h.click();h.timers.advance(4500);h.draw().props[handler]();h.draw();assert.equal(h.timers.count(),0);assert.equal(h.button().props['aria-pressed'],false);h.unmount();}});
test('hidden/reduced/mobile guards stop pending transition and need explicit resume',()=>{for(const gate of ['hidden','motion','narrow']){const h=mount();h.click();h.timers.advance(4500);if(gate==='hidden'){h.document.hidden=true;h.document.dispatch('visibilitychange');}else{h[gate].matches=true;h[gate].dispatch('change');}h.draw();assert.equal(h.timers.count(),0);if(gate==='hidden'){h.document.hidden=false;h.document.dispatch('visibilitychange');}else{h[gate].matches=false;h[gate].dispatch('change');}h.draw();assert.equal(h.timers.count(),0);h.click();assert.equal(h.timers.count(),1);h.unmount();}});
test('Play cannot override reduced/mobile/hidden guards including exact 780 boundary',()=>{for(const opts of [{width:780},{reduced:true},{hidden:true}]){const h=mount(opts);h.click();assert.equal(h.timers.count(),0);assert.equal(h.button().props['aria-pressed'],false);h.unmount();}});
test('locale change cancels pending transition, resets example and needs reader consent',()=>{const h=mount();h.click();h.timers.advance(4500);h.locale('ja');assert.equal(h.timers.count(),0);assert.equal(h.button().props['aria-pressed'],false);assert.match(snapshot(h),/OKX/);h.click();assert.equal(h.timers.count(),1);h.unmount();});
test('unmount clears interval and transition timeout plus modern/legacy listeners',()=>{for(const legacy of [false,true]){const h=mount({legacy});h.click();h.timers.advance(4500);assert.equal(h.timers.count(),2);h.unmount();assert.equal(h.timers.count(),0);assert.equal(h.motion.count()+h.narrow.count()+h.short.count()+h.document.count(),0);}});
test('15 native controls preserve existing example data/disclaimer and registry',()=>{const baseline=readFileSync(new URL('../../reader-example-baseline/LiveConversionProof.jsx',import.meta.url),'utf8');const data=s=>s.slice(s.indexOf('const MOCK_EVENTS'),s.indexOf('export function LiveConversionProof'));assert.equal(data(source).split('const examplePlaybackCopy')[0].trim(),data(baseline).trim());const label=s=>s.match(/  const exampleLabel =[^\n]+/)[0];assert.equal(label(source),label(baseline));const h=mount();const labels=[];for(const locale of ['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ru','ar','id','vi','it']){h.locale(locale);labels.push(h.button().children.join(''));assert.ok(h.draw().props['aria-label']);assert.equal(h.timers.count(),0);}assert.equal(new Set(labels).size,15);h.unmount();assert.equal(createHash('sha256').update(readFileSync(new URL('../src/data/partner-registry.js',import.meta.url))).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
test('control CSS preserves fixed position, mobile guard and accessible focus target',()=>{const css=readFileSync(new URL('../src/components/v3/live-conversion-proof.css',import.meta.url),'utf8');assert.match(css,/min-height: 44px/);assert.match(css,/conversion-proof__control:focus-visible/);assert.match(css,/pointer-events: auto/);assert.match(css,/@media \(max-width: 780px\)/);});

test('actual React SSR preserves all original text/markup except authorized control wrapper and live mode',()=>{
 const React=req('react'),{renderToStaticMarkup}=req('react-dom/server');
 const baseline=readFileSync(new URL('../../reader-example-baseline/LiveConversionProof.jsx',import.meta.url),'utf8');
 const load=text=>{const module={exports:{}};vm.runInNewContext(transformSync(text,{loader:'jsx',format:'cjs'}).code,{module,exports:module.exports,require:name=>name==='react'?React:{}});return module.exports.LiveConversionProof;};
 const Before=load(baseline),After=load(source);
 for(const locale of ['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ru','ar','id','vi','it']){
  const before=renderToStaticMarkup(React.createElement(Before,{locale}));
  const after=renderToStaticMarkup(React.createElement(After,{locale}));
  assert.equal((after.match(/<button/g)||[]).length,1);
  const restored=after.replace('aria-live="off"','aria-live="polite"').replace('<div class="conversion-proof__example conversion-proof__example--in">','').replace(/<\/div><button type="button" class="conversion-proof__control" aria-pressed="false">[^<]+<\/button>/,'');
  assert.equal(restored,before,locale);
 }
});
test('repeated Play/Pause and duplicate visibility events do not multiply timers/listeners',()=>{
 const h=mount();for(let i=0;i<4;i++){h.click();assert.equal(h.timers.count(),1);h.document.dispatch('visibilitychange');h.document.dispatch('visibilitychange');assert.equal(h.timers.count(),1);h.click();assert.equal(h.timers.count(),0);}
 assert.equal(h.motion.count(),1);assert.equal(h.narrow.count(),1);assert.equal(h.document.count(),1);h.unmount();
});

test('CSS edit is additive, scoped to illustrative content/control; fixed layout and all old media bytes remain',()=>{
 const before=readFileSync(new URL('../../reader-example-baseline/live-conversion-proof.css',import.meta.url),'utf8');
 const after=readFileSync(new URL('../src/components/v3/live-conversion-proof.css',import.meta.url),'utf8');
 assert.ok(after.startsWith(before));
 const addition=after.slice(before.length);
 assert.doesNotMatch(addition,/position:\s*(fixed|absolute)|display:\s*none|animation:|!important/);
 assert.match(addition,/\.conversion-proof__example--out \{ opacity: 0; \}/);
 assert.match(addition,/\.conversion-proof__control:focus-visible/);
});

test('CSS-hidden height 500 inclusive blocks Play; resize cancels pending fade without automatic resume',()=>{
 for(const height of [390,500]){const h=mount({height});h.click();assert.equal(h.timers.count(),0);assert.equal(h.button().props['aria-pressed'],false);h.unmount();assert.equal(h.short.count(),0);}
 const h=mount({height:501});h.click();assert.equal(h.timers.count(),1);h.timers.advance(4500);assert.equal(h.timers.count(),2);h.short.matches=true;h.short.dispatch('change');h.draw();assert.equal(h.timers.count(),0);const before=snapshot(h);h.timers.advance(30000);assert.equal(snapshot(h),before);h.short.matches=false;h.short.dispatch('change');h.draw();assert.equal(h.timers.count(),0);h.click();assert.equal(h.timers.count(),1);assert.equal(h.short.count(),1);h.unmount();assert.equal(h.timers.count(),0);assert.equal(h.short.count(),0);
});

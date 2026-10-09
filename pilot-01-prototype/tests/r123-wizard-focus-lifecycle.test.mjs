import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const req=createRequire(new URL('../package.json',import.meta.url));
const {transformSync}=req('esbuild');
function mount(){
 let cursor=0,id=0;const slots=[],effects=[],frames=new Map(),listeners=new Set();
 const document={activeElement:null,addEventListener:(type,fn)=>listeners.add(fn),removeEventListener:(type,fn)=>listeners.delete(fn)};
 class HTMLElement { constructor(name){this.name=name;this.calls=0;this.isConnected=true;}focus(){this.calls++;document.activeElement=this;}hasAttribute(){return false;}getAttribute(){return null;} }
 const trigger=new HTMLElement('trigger'),close=new HTMLElement('close'),option=new HTMLElement('privacy option'),next=new HTMLElement('next');trigger.focus();
 const modal={querySelector:()=>close,querySelectorAll:()=>[close,option,next]};
 const window={location:{search:''},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:key=>frames.delete(key)};
 const React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)}),
 useState(initial){const i=cursor++;slots[i]??={value:typeof initial==='function'?initial():initial};return[slots[i].value,v=>slots[i].value=typeof v==='function'?v(slots[i].value):v];},
 useRef(initial){const i=cursor++;slots[i]??={current:initial};return slots[i];},
 useMemo(fn){return fn();},
 useEffect(fn,deps){const i=cursor++,old=slots[i];if(!old||deps.some((v,j)=>!Object.is(v,old.deps[j])))effects.push(()=>{old?.cleanup?.();slots[i]={deps,cleanup:fn()};});}
 };
 const mocks={BrandMark:()=>null,partnerRegistry:{},venueDatabase:{},contextualHref:path=>path,regionalVenueCta:()=>({claim:{status:'pending'},ctaState:'research',benefitVerified:false})};
 const module={exports:{}};
 vm.runInNewContext(transformSync(readFileSync(new URL('../src/components/v3/TraderWizardModal.jsx',import.meta.url),'utf8'),{loader:'jsx',format:'cjs'}).code,{module,exports:module.exports,require:name=>name==='react'?React:mocks,window,document,HTMLElement,URLSearchParams});
 function refs(node){if(!node||typeof node!=='object')return;if(node.props?.className==='wizard-modal')node.props.ref.current=modal;for(const child of node.children||[])refs(child);}
 return{trigger,close,option,next,document,frames,listeners,
 render(onClose,isOpen=true){cursor=0;const tree=module.exports.TraderWizardModal({isOpen,onClose,locale:'en'});refs(tree);while(effects.length)effects.shift()();return tree;},
 runFrames(){const tasks=[...frames.values()];frames.clear();tasks.forEach(fn=>fn());},
 key(key,shiftKey=false){let prevented=false;for(const fn of listeners)fn({key,shiftKey,preventDefault(){prevented=true;}});return prevented;},
 unmount(){for(const slot of slots)slot?.cleanup?.();}
 };
}
test('parent callback changes do not restore/regrab focus; Escape uses newest callback and close restores original trigger',()=>{
 const h=mount();let first=0,latest=0;h.render(()=>first++);h.runFrames();assert.equal(h.document.activeElement,h.close);
 h.option.focus();const initialTriggerCalls=h.trigger.calls,initialCloseCalls=h.close.calls;
 for(let i=0;i<5;i++){h.render(()=>latest++);h.runFrames();assert.equal(h.document.activeElement,h.option);}
 assert.equal(h.trigger.calls,initialTriggerCalls);assert.equal(h.close.calls,initialCloseCalls);assert.equal(h.listeners.size,1);
 assert.equal(h.key('Escape'),true);assert.equal(first,0);assert.equal(latest,1);
 h.render(()=>latest++,false);assert.equal(h.document.activeElement,h.trigger);assert.equal(h.listeners.size,0);h.unmount();
});
test('Tab/ShiftTab wrap still hold after parent rerender and unmount returns focus once',()=>{
 const h=mount();h.render(()=>{});h.runFrames();h.render(()=>{});
 h.close.focus();assert.equal(h.key('Tab',true),true);assert.equal(h.document.activeElement,h.next);
 assert.equal(h.key('Tab'),true);assert.equal(h.document.activeElement,h.close);
 const before=h.trigger.calls;h.unmount();assert.equal(h.document.activeElement,h.trigger);assert.equal(h.trigger.calls,before+1);assert.equal(h.listeners.size,0);
});
test('rapid close cancels queued initial autofocus rather than refocusing a removed modal',()=>{
 const h=mount();h.render(()=>{});assert.equal(h.frames.size,1);h.render(()=>{},false);h.runFrames();assert.equal(h.document.activeElement,h.trigger);assert.equal(h.frames.size,0);assert.equal(h.close.calls,0);
});

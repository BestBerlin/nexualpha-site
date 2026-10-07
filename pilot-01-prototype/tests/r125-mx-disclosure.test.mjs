import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const source=readFileSync(new URL('../src/components/v3/international/RegionalMarketPreview.jsx',import.meta.url),'utf8');
const start=source.indexOf('  useEffect(() => {',source.indexOf('const mxMobileCompressionEnabled ='));
const end=source.indexOf('  const directoryProduct =',start);
const effectSource=source.slice(start,end);
function mounted({narrow=true,enabled=true,browser=true,legacy=false}={}){
 let states=[true,true],calls=0,registered=0,previous,queued;
 const listeners=new Set();
 const media={matches:narrow,addEventListener:legacy?undefined:(_,fn)=>{registered++;listeners.add(fn);},removeEventListener:(_,fn)=>listeners.delete(fn),addListener:fn=>{registered++;listeners.add(fn);},removeListener:fn=>listeners.delete(fn)};
 const context={mxMobileCompressionEnabled:enabled,setShortlistFiltersOpen:v=>states[0]=v,setResearchEvidenceOpen:v=>states[1]=v,useEffect:(fn,deps)=>{if(!previous||deps.some((v,i)=>v!==previous.deps[i]))queued={fn,deps};}};
 if(browser)context.window={matchMedia:query=>{assert.equal(query,'(max-width: 720px)');calls++;return media;}};
 function render(){vm.runInNewContext(effectSource,context);if(queued){previous?.cleanup?.();previous={deps:queued.deps,cleanup:queued.fn()};queued=null;}}
 render();
 return{get states(){return [...states];},get calls(){return calls;},get registered(){return registered;},get listeners(){return listeners.size;},choose:(filters,research)=>states=[filters,research],resize:matches=>{media.matches=matches;for(const fn of [...listeners])fn({matches});},render,unmount:()=>previous?.cleanup?.()};
}
test('MX mobile defaults closed then reader choices survive breakpoint crossings and parent renders',()=>{
 const h=mounted();assert.deepEqual(h.states,[false,false]);h.choose(true,false);h.resize(false);h.render();assert.deepEqual(h.states,[true,false]);h.resize(true);h.render();assert.deepEqual(h.states,[true,false]);assert.equal(h.calls,1);h.unmount();assert.equal(h.listeners,0);
});
test('MX desktop defaults open then explicitly closed remains closed after mobile and desktop resize',()=>{
 const h=mounted({narrow:false});assert.deepEqual(h.states,[true,true]);h.choose(false,true);h.resize(true);h.render();assert.deepEqual(h.states,[false,true]);h.resize(false);assert.deepEqual(h.states,[false,true]);
});
test('legacy matchMedia keeps reader state and requires no ongoing subscription',()=>{
 const h=mounted({legacy:true});h.choose(true,true);h.resize(false);h.resize(true);assert.deepEqual(h.states,[true,true]);assert.equal(h.registered,0);h.unmount();assert.equal(h.listeners,0);
});
test('disabled compression and SSR retain expanded state without browser access',()=>{
 for(const options of [{enabled:false},{browser:false}]){const h=mounted(options);assert.deepEqual(h.states,[true,true]);assert.equal(h.calls,0);assert.equal(h.registered,0);}
});
test('existing SSR initialization, locale gate and native reader toggle handlers stay intact',()=>{
 assert.match(source,/const \[shortlistFiltersOpen, setShortlistFiltersOpen\] = useState\(true\)/);
 assert.match(source,/const \[researchEvidenceOpen, setResearchEvidenceOpen\] = useState\(true\)/);
 assert.match(source,/policy.targetMarket === "MX" && \(localeKey === "en" \|\| localeKey === "es"\)/);
 assert.match(source,/open=\{shortlistFiltersOpen\} onToggle=\{\(event\) => setShortlistFiltersOpen\(event.currentTarget.open\)\}/);
 assert.match(source,/open=\{researchEvidenceOpen\} onToggle=\{\(event\) => setResearchEvidenceOpen\(event.currentTarget.open\)\}/);
});

test('every source byte outside the bounded effect and the frozen partner registry remains unchanged',()=>{
 const baseline=readFileSync(new URL('../../../r124-page-hierarchy/candidate/src/components/v3/international/RegionalMarketPreview.jsx',import.meta.url),'utf8');
 const stripEffect=text=>{const begin=text.indexOf('  useEffect(() => {',text.indexOf('const mxMobileCompressionEnabled ='));const finish=text.indexOf('  const directoryProduct =',begin);return text.slice(0,begin)+text.slice(finish);};
 assert.equal(stripEffect(source),stripEffect(baseline));
 const registry=readFileSync(new URL('../src/data/partner-registry.js',import.meta.url));
 assert.equal(createHash('sha256').update(registry).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});

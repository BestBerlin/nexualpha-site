import test from 'node:test';
import assert from 'node:assert/strict';
import {scrollToHash} from '../src/data/browser-state.js';

test('nested research anchor opens only its ancestor disclosures before scrolling',()=>{
 const unrelated={tagName:'DETAILS',open:false};
 const outer={tagName:'DETAILS',open:false,parentElement:null};
 const inner={tagName:'DETAILS',open:false,parentElement:outer};
 const target={tagName:'SECTION',parentElement:inner,scrollIntoView(options){assert.equal(inner.open,true);assert.equal(outer.open,true);assert.equal(options.block,'start');}};
 assert.equal(scrollToHash({getElementById:id=>id==='registration-checklist'?target:null},'#registration-checklist'),true);
 assert.equal(unrelated.open,false);
});
test('an anchor that is itself a disclosure reveals its contents',()=>{
 const target={tagName:'DETAILS',open:false,parentElement:null,scrollIntoView(){assert.equal(this.open,true);}};
 assert.equal(scrollToHash({getElementById:()=>target},'#sources'),true);
});

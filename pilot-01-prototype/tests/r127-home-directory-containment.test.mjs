import { committedFileHash } from './r100-test-contracts.mjs';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
// Browser geometry contract. Root can point this to its final built-preview evidence.
const evidence=process.env.DIRECTORY_GEOMETRY_JSON;
test('mobile categories/filters and all card CTA text fit without hidden horizontal choices',{skip:!evidence?'Set DIRECTORY_GEOMETRY_JSON to real Chrome geometry evidence':false},()=>{
 const records=JSON.parse(readFileSync(evidence,'utf8'));assert.deepEqual(records.map(r=>r.width),[320,375,390,430]);
 for(const r of records){assert.ok(r.documentScroll<=r.documentWidth+1,`document overflow ${r.width}`);const shell=r.elements.find(e=>e.class==='yellow-pages v2-shell');assert.ok(shell);const controls=r.elements.filter(e=>['yellow-pages__tabs','yellow-pages__filter-chips'].includes(e.class));assert.equal(controls.length,2);for(const e of controls){assert.equal(e.overflow,'visible');assert.ok(e.scroll<=e.client+1,`choice rail needs horizontal scrolling ${r.width} ${e.class}`);}
  const choices=r.elements.filter(e=>e.class==='yellow-pages__tab'||e.class.startsWith('yellow-pages__chip'));assert.ok(choices.length>=8);for(const e of choices){assert.ok(e.left>=shell.left-1&&e.right<=shell.right+1,`${r.width} unreachable ${e.text}`);assert.ok(e.height>=44);assert.ok(e.scroll<=e.client+1,`${r.width} clipped ${e.text}`);}
  const actions=r.elements.filter(e=>e.class.includes('yellow-card__btn'));assert.ok(actions.length>=6);for(const e of actions){assert.ok(e.right<=shell.right+1&&e.left>=shell.left-1,`${r.width} CTA outside`);assert.ok(e.scroll<=e.client+1,`${r.width} CTA text clipped`);}
 }
});
test('directory component and complete CTA/invitation machinery remain byte-identical to R126', { skip: !existsSync(new URL('../../../r126-visible-motion/candidate/src/components/v3/VenueYellowPages.jsx', import.meta.url)) && 'Original historical source snapshot is absent from a fresh checkout' }, ()=>{
 const current=readFileSync(new URL('../src/components/v3/VenueYellowPages.jsx',import.meta.url));const prior=readFileSync(new URL('../../../r126-visible-motion/candidate/src/components/v3/VenueYellowPages.jsx',import.meta.url));assert.deepEqual(current,prior);
 assert.equal(createHash('sha256').update(readFileSync(new URL('../src/data/partner-registry.js',import.meta.url))).digest('hex'),committedFileHash('src/data/partner-registry.js'));
});

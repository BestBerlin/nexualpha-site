import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import postcss from 'postcss';
const peer=new URL('../../../r198-coherent-reader-integration/candidate/',import.meta.url);
const file='src/components/v3/crossroads-compare.css';
const css=fs.readFileSync(file,'utf8'), before=fs.readFileSync(new URL(file,peer),'utf8');
const original=before.slice(before.indexOf('  .v3-compare-decision-nav {',before.indexOf('@media (max-width: 680px)')),before.indexOf('  .v3-compare-final-choice-card {',before.indexOf('@media (max-width: 680px)')));
const current=css.slice(css.indexOf('  .v3-compare-decision-nav {',css.indexOf('@media (max-width: 680px)')),css.indexOf('  .v3-compare-final-choice-card {',css.indexOf('@media (max-width: 680px)')));
const ast=postcss.parse(css);
const declarations=(selector)=>{const out={};ast.walkRules(selector,r=>{if(r.parent.type==='atrule'&&r.parent.params==='(max-width: 680px)')r.walkDecls(d=>out[d.prop]=d.value);});return out;};
test('mobile exposes all five anchors in two readable columns without clipping',()=>{
 assert.equal(declarations('.v3-compare-decision-nav__links')['grid-template-columns'],'repeat(2, minmax(0, 1fr))');
 const link=declarations('.v3-compare-decision-nav a'); assert.equal(link['white-space'],'normal');assert.equal(link.overflow,'visible');assert.equal(link['min-block-size'],'44px');assert.equal(link['border-radius'],'8px');
 assert.ok(!current.includes('nth-last-child')); assert.ok(!current.includes('font-size'));assert.equal(declarations('.v3-compare-decision-nav')['flex-direction'],'column');
});
test('exact inverse restores entire baseline stylesheet and desktop declaration values',()=>assert.equal(css.replace(current,original),before));
test('navigation labels, ordered anchors, ID semantics and commercial sources are unchanged',()=>{
 for(const f of ['src/components/v3/V3Pages.jsx','src/data/partner-registry.js'])assert.equal(fs.readFileSync(f,'utf8'),fs.readFileSync(new URL(f,peer),'utf8'));
 const jsx=fs.readFileSync('src/components/v3/V3Pages.jsx','utf8');const block=jsx.slice(jsx.indexOf('function CompareDecisionNav('),jsx.indexOf('export function CompareDecisionGuide('));
 assert.deepEqual([...block.matchAll(/\["(compare-snapshot|hardcore-matrix|decision-guide|compare-faq|compare-sources)",/g)].map(x=>x[1]),['compare-snapshot','hardcore-matrix','decision-guide','compare-faq','compare-sources']);
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('src/data/partner-registry.js')).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});

import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{createRequire}from'node:module';const postcss=createRequire(import.meta.url)('postcss');const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8'),old=p=>readFileSync(new URL('../../../r158-home-hierarchy/candidate/'+p,import.meta.url),'utf8');
const p='src/components/v3/growth-conversion.css',selector='.growth-decision-explanation__summary';
test('R162 actual new summary restores native marker, natural wrap and44 target',()=>{
 const rules=[];postcss.parse(read(p)).walkRules(r=>{if(r.selector===selector)rules.push(r);});assert.equal(rules.length,1);const values=Object.fromEntries(rules[0].nodes.filter(n=>n.type==='decl').map(d=>[d.prop,d.value]));assert.equal(values.display,'list-item');assert.equal(values['list-style-position'],'inside');assert.equal(values['min-height'],'44px');assert.equal(values.padding,'0.4rem 0');assert.equal(values['overflow-wrap'],'anywhere');assert.ok(!values['list-style']&&!values['list-style-type']);
 assert.doesNotMatch(read(p),/growth-decision-explanation__summary::(?:marker|before|after|\-webkit-details-marker)/);
});
test('R162 one actual JSX target only, existing secondary custom plus/minus untouched',()=>{
 const hero=read('src/components/v3/LeanHero.jsx');assert.equal([...hero.matchAll(/<summary className="growth-decision-explanation__summary"/g)].length,1);assert.equal(hero,old('src/components/v3/LeanHero.jsx'));assert.match(read(p),/\.lean-hero__secondary > summary::after \{ content: "\+"/);assert.match(read(p),/\.lean-hero__secondary\[open\] > summary::after \{ content: "-"/);
});
test('R162 exact two CSS declarations only; focus and all remaining bytes unchanged',()=>{
 const before='.growth-decision-explanation__summary {\n  display: flex;',after='.growth-decision-explanation__summary {\n  display: list-item;\n  list-style-position: inside;';assert.equal(read(p),old(p).replace(before,after));for(const path of['src/components/v3/RegistrationCard.jsx','src/components/v3/registration-card.css','src/data/partner-registry.js','src/styles/breakpoints.css'])assert.equal(read(path),path==='src/styles/breakpoints.css'?readFileSync(new URL('../../../r161-landscape-route/candidate/'+path,import.meta.url),'utf8'):old(path));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import postcss from 'postcss';
const root=new URL('../',import.meta.url);
const sha=value=>createHash('sha256').update(value).digest('hex');
const raw=await readFile(new URL('tests/fixtures/r287-home-comparison-index.json',root));
assert.equal(sha(raw),'c71ddaacc4fc514812a9dddf22f0626940d2ad9ab29b9b2c140b05202f5d382a');
const {hunk}=JSON.parse(raw),beforeSha='b370b90f2932f692a6af356a5f1e8938a57e0e0aa0cc242553bd047dbb7eaf69';
function inverse(source){assert.equal(source.split(hunk).length,2);assert.ok(source.endsWith(hunk));const restored=source.slice(0,-hunk.length);assert.equal(sha(restored),beforeSha);return restored;}
test('only home scoped index suffix changes with byte-fixed original compare rules',async()=>{
 const css=await readFile(new URL('src/components/v3/crossroads-compare.css',root),'utf8');
 const backup=await readFile(new URL('../../comparison-index-fix/crossroads-compare.before.css',import.meta.url),'utf8');
 assert.equal(inverse(css),backup);
 for(const rogue of[css+'\n/* rogue */',css.replace('.home-refinement .crossroads__card:focus-visible','.crossroads__card:focus-visible'),css.replace('min-width: 1100px) {\n  .home-refinement','min-width: 780px) {\n  .home-refinement'),css.replace('min-height: 64px;','min-height: 30px;')])assert.throws(()=>inverse(rogue));
 const tree=postcss.parse(hunk);tree.walkRules(rule=>assert.ok(rule.selector.startsWith('.home-refinement ')));
 assert.ok(hunk.includes('text-align: start;'));assert.ok(hunk.includes('margin-inline: 0;'));assert.ok(hunk.includes('border-block-end:'));
});
test('single research list stays single at mobile/tablet/desktop while header has desktop-only split',()=>{
 const tree=postcss.parse(hunk);
 for(const width of[320,390,780,1024,1099,1100,1280,1440]){
  let headerColumns,listColumns;
  tree.walkRules(rule=>{
   for(let p=rule.parent;p;p=p.parent)if(p.type==='atrule'&&p.name==='media'&&p.params.includes('min-width: 1100px')&&width<1100)return;
   rule.walkDecls('grid-template-columns',d=>{if(rule.selector==='.home-refinement .crossroads')headerColumns=d.value;if(rule.selector==='.home-refinement .crossroads__grid')listColumns=d.value;});
  });
  assert.equal(listColumns,'minmax(0, 1fr)');assert.equal(headerColumns,width<1100?'minmax(0, 1fr)':'minmax(0, 0.8fr) minmax(0, 1.2fr)');
 }
});
test('all localized comparison markup links brands and invitation registry are byte unchanged',async()=>{
 assert.equal(sha(await readFile(new URL('src/components/v3/CrossroadsCompare.jsx',root))),'80bb3610e4660f51e07dd9a0711c29339d7ac28d17a6bdc0ebebe0c454b8cad9');
 assert.equal(sha(await readFile(new URL('src/data/partner-registry.js',root))),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});

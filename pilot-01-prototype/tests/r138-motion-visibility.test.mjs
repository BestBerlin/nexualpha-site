import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),postcss=require('postcss');
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const baseline=p=>readFileSync(new URL('../../../r134-reader-decisions/candidate/'+p,import.meta.url),'utf8');
function reducedDeclarations(css,selector){const declarations={};postcss.parse(css).walkRules(rule=>{if(!rule.selector.split(',').map(s=>s.trim()).includes(selector))return;let reduced=false;for(let p=rule.parent;p;p=p.parent)if(p.type==='atrule'&&p.name==='media'&&p.params==='(prefers-reduced-motion: reduce)')reduced=true;if(reduced)rule.walkDecls(d=>declarations[d.prop]=d.value);});return declarations;}
test('R138 reduced motion stops actual Hero/wizard decorative infinite animation and preserves visible static identity',()=>{
 for(const [file,selector]of [['src/components/v3/lean-hero.css','.status-indicator::after'],['src/components/v3/trader-wizard.css','.wizard-modal__pulse']]){const d=reducedDeclarations(read(file),selector);assert.equal(d.animation,'none',selector);assert.ok(!('display'in d)&&!('visibility'in d)&&!('opacity'in d),'cannot hide identity');}
});
test('R138 all non-effect Hero bytes, localized copy, full CTA markup and commercial sources remain exact',()=>{
 const strip=s=>{const a=s.indexOf('  useEffect(() => {',s.indexOf('export function LeanHero(')),b=s.indexOf('  const proof =',a);return s.slice(0,a)+s.slice(b);};assert.equal(strip(read('src/components/v3/LeanHero.jsx')),strip(baseline('src/components/v3/LeanHero.jsx')));
 for(const p of ['src/data/partner-registry.js','src/data/source-bound-cta.js','src/components/v3/TraderWizardModal.jsx'])assert.equal(read(p),baseline(p),p);
 assert.equal(createHash('sha256').update(read('src/data/partner-registry.js')).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});

test('R138 CSS only appends the local reduced-motion rules; normal presentation stays unchanged',()=>{
 for(const [file,selector]of [['src/components/v3/lean-hero.css','.status-indicator::after'],['src/components/v3/trader-wizard.css','.wizard-modal__pulse']]){
  const addition='\n/* Keep decorative status identity static when reduced motion is requested. */\n@media (prefers-reduced-motion: reduce) {\n  '+selector+' { animation: none; }\n}\n';
  assert.equal(read(file),baseline(file)+addition,file);
 }
 const css=read('src/components/v3/lean-hero.css');assert.match(css,/@media \(max-width: 640px\)[\s\S]*?\.lean-hero__social-proof \{\s*display: none;/);
});

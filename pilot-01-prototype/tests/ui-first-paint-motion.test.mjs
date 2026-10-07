import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const read=p=>readFile(new URL(p,import.meta.url),'utf8');
const hero=await read('../src/components/v3/lean-hero.css'),home=await read('../src/styles/home-refinement.css');
const heroBefore=await read('../../motion-evidence/iteration-2/lean-hero.before.css'),homeBefore=await read('../../motion-evidence/iteration-2/home-refinement.before.css'),removed=await read('../../motion-evidence/iteration-2/REMOVED-HERO.css');
const override=`/* Core research and account actions are visible before optional motion. */
.home-refinement .lean-hero__content > *,
.home-refinement .lean-hero__telemetry { animation: none !important; opacity: 1 !important; transform: none !important; }
`;
test('route root removes only core entrance block, delays and keyframes',()=>{assert.equal(hero,heroBefore.replace(removed,''));assert.ok(!/hero-content-in|hero-panel-in/.test(hero));});
test('late redundant override removed with all other feedback unchanged',()=>{assert.equal(home,homeBefore.replace(override,''));assert.ok(!home.includes('Core research and account'));for(const t of ['registration-card__primary-btn:hover','registration-card__copy-btn','focus-visible','prefers-reduced-motion'])assert.ok(home.includes(t));});
test('immutable partner registry',async()=>{const b=await readFile(new URL('../src/data/partner-registry.js',import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});

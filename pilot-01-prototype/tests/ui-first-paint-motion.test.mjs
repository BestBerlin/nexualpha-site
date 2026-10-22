import {existsSync} from 'node:fs';
import { committedFileHash } from './r100-test-contracts.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const read=p=>readFile(new URL(p,import.meta.url),'utf8');
const hero=await read('../src/components/v3/lean-hero.css'),home=await read('../src/styles/home-refinement.css');
const historicalAvailable=['lean-hero.before.css','home-refinement.before.css','REMOVED-HERO.css'].every(f=>existsSync(new URL('../../motion-evidence/iteration-2/'+f,import.meta.url)));
const heroBefore=historicalAvailable?await read('../../motion-evidence/iteration-2/lean-hero.before.css'):null,homeBefore=historicalAvailable?await read('../../motion-evidence/iteration-2/home-refinement.before.css'):null,removed=historicalAvailable?await read('../../motion-evidence/iteration-2/REMOVED-HERO.css'):null;
const override=`/* Core research and account actions are visible before optional motion. */
.home-refinement .lean-hero__content > *,
.home-refinement .lean-hero__telemetry { animation: none !important; opacity: 1 !important; transform: none !important; }
`;
test('route root removes only core entrance block, delays and keyframes',{skip:historicalAvailable?false:'Requires motion-evidence/iteration-2 historical snapshots'},()=>{assert.equal(hero,heroBefore.replace(removed,''));assert.ok(!/hero-content-in|hero-panel-in/.test(hero));});
test('late redundant override removed with all other feedback unchanged',{skip:historicalAvailable?false:'Requires motion-evidence/iteration-2 historical snapshots'},()=>{assert.equal(home,homeBefore.replace(override,''));assert.ok(!home.includes('Core research and account'));for(const t of ['registration-card__primary-btn:hover','registration-card__copy-btn','focus-visible','prefers-reduced-motion'])assert.ok(home.includes(t));});
test('immutable partner registry',async()=>{const b=await readFile(new URL('../src/data/partner-registry.js',import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),committedFileHash("src/data/partner-registry.js"));});

test('current core hero has no entrance keyframes and preserves accessible feedback',()=>{assert.doesNotMatch(hero,/hero-content-in|hero-panel-in/);for(const token of ['registration-card__primary-btn:hover','registration-card__copy-btn','focus-visible','prefers-reduced-motion'])assert.ok(home.includes(token),token);});

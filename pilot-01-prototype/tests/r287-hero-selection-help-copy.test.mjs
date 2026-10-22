import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../research-entry-copy/LITERALS.json", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const source=readFileSync(new URL('../src/components/v3/LeanHero.jsx',import.meta.url),'utf8');
const evidence=new URL('../../research-entry-copy/',import.meta.url);
const pins=JSON.parse(readFileSync(new URL('LITERALS.json',evidence),'utf8'));
const before=readFileSync(new URL('LeanHero.before.jsx',evidence),'utf8');
const match=source.match(/className="lean-hero__secondary-toggle"[^\n]*?\{\(\{(.*?)\}\)\[locale\] \|\| "Platform selection help"\}/);
assert.ok(match,'real secondary toggle inline dictionary exists');
const actual=JSON.parse('{'+match[1]+'}');
test('all fifteen task labels name platform selection help',()=>{
 assert.deepEqual(actual,pins.after);
 assert.equal(Object.keys(actual).length,15);
 for(const label of Object.values(actual)) assert.ok(label.trim().length>0);
});
test('only exact inline dictionary changes; entire remaining source stays frozen',()=>{
 assert.equal(createHash('sha256').update(before).digest('hex'),pins.baselineSha256);
 const current='{'+match[1]+'}';
 const old=JSON.stringify(pins.before).replaceAll(':', ': ').replaceAll(',', ', ');
 assert.equal(source.split(current).length,2,'dictionary occurs once');
 const inverse=source.replace(current,old).replace(')[locale] || "Platform selection help"}</button>', ')[locale] || "More research tools"}</button>');
 assert.equal(inverse,before);
 assert.notEqual(inverse.replace('aria-controls="lean-hero-support"','aria-controls="wrong"'),before);
 assert.notEqual(source.replace(current,old).replace('aria-controls="lean-hero-support"','aria-controls="wrong"'),before);
});

test('partner registry remains byte-for-byte protected',()=>{
 const registry=readFileSync(new URL('../src/data/partner-registry.js',import.meta.url));
 assert.equal(createHash('sha256').update(registry).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
}

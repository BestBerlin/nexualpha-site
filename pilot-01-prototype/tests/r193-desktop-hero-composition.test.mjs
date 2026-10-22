import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../../r188-editorial-reader-integration/candidate/src/components/v3/growth-conversion.css", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const base = '../../../r188-editorial-reader-integration/candidate/';
const current = fs.readFileSync('src/components/v3/growth-conversion.css', 'utf8');
const original = fs.readFileSync(new URL(base+'src/components/v3/growth-conversion.css', import.meta.url),'utf8');
const marker = '\n/* R193: desktop editorial composition; DOM and mobile order stay intact. */';
test('desktop composition is one isolated addition with baseline exact inverse',()=>{
 assert.ok(current.includes(marker));
 assert.equal(current.slice(0,current.indexOf(marker)),original);
 assert.match(current.slice(current.indexOf(marker)),/@media \(min-width: 1280px\)/);
 assert.doesNotMatch(current.slice(current.indexOf(marker)),/font-size|display:\s*none|!important|max-width:/);
});
test('runtime and commercial decision sources remain byte exact',()=>{
 for(const file of ['src/components/v3/LeanHero.jsx','src/components/v3/RegistrationCard.jsx','src/data/partner-registry.js'])
 assert.equal(fs.readFileSync(file,'utf8'),fs.readFileSync(new URL(base+file,import.meta.url),'utf8'));
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('src/data/partner-registry.js')).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
}

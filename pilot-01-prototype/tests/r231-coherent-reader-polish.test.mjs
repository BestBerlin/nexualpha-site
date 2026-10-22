import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("fixtures/r237-approved-inverses.json", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const { skipApprovedAdded: skipApprovedAdded } = await import("./helpers/r237-approved-inverses.mjs");
const { assertExactPeerChanges: assertExactPeerChanges, withoutR213: withoutR213, verifyFrozenRuntime: verifyFrozenRuntime } = await import("./helpers/r231-frozen-peer-contract.mjs");
const base=new URL('../../../r207-coherent-topic-navigation/candidate/',import.meta.url),pins=JSON.parse(fs.readFileSync(new URL('../../PEER-INPUT-IDENTITY.json',import.meta.url),'utf8'));
test('fixed accepted combined runtime exact and all other src/config/public including commercial metadata unchanged',()=>{const changes=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(e.isFile()){if(skipApprovedAdded(f,fs.readFileSync(f))){changes.push(f);continue;}assert.ok(fs.existsSync(new URL(f,base)),f+' no unknown source addition');if(!fs.readFileSync(f).equals(fs.readFileSync(new URL(f,base))))changes.push(f);}}}for(const area of ['src','config','public'])walk(area);assertExactPeerChanges(changes);assert.equal(crypto.createHash('sha256').update(fs.readFileSync('src/data/partner-registry.js')).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
test('strict R227 two tests remain exact original accepted peer bytes',()=>{for(const pin of pins.filter(x=>x.peer==='r227-legacy-contract-repair'))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pin.file)).digest('hex'),pin.sha256);});
test('peer normalization rejects missing runtime/foreign path/tampered CSS and malformed tail',()=>{verifyFrozenRuntime();const files=pins.filter(p=>p.file.startsWith('src/')).map(p=>p.file),css=fs.readFileSync('src/components/v3/crossroads-compare.css','utf8');assert.throws(()=>assertExactPeerChanges(files.slice(1)));assert.throws(()=>assertExactPeerChanges([...files,'src/data/partner-registry.js']));assert.throws(()=>withoutR213(css.replace('min-block-size: 44px','min-block-size: 43px')));assert.throws(()=>withoutR213(css.replace('/* R213:', '/* UNKNOWN:')));});
}

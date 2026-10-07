import {approvedRuntime} from './helpers/r237-approved-inverses.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import {tmpdir} from 'node:os';import {fileURLToPath,pathToFileURL} from 'node:url';import crypto from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));const baseline=fileURLToPath(new URL('../../../r207-coherent-topic-navigation/candidate/',import.meta.url));
const manifest=JSON.parse(await fs.readFile(new URL('../../PEER-INPUT-IDENTITY.json',import.meta.url),'utf8'));
const sourcePins=manifest.filter(p=>p.file.startsWith('src/'));assert.equal(sourcePins.length,6);
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
async function fixture(change){const temp=await fs.mkdtemp(path.join(tmpdir(),'r235-real-guard-'));const candidate=path.join(temp,'r235/candidate'),base=path.join(temp,'r207-coherent-topic-navigation/candidate');
try{for(const folder of ['src','config','public'])for(const dir of [candidate,base])await fs.mkdir(path.join(dir,folder),{recursive:true});
for(const pin of Object.entries(approvedRuntime).map(([file,sha256])=>({file,sha256})))for(const [from,to] of [[root,candidate],[baseline,base]]){await fs.mkdir(path.dirname(path.join(to,pin.file)),{recursive:true});if(from===baseline&&pin.file==='src/data/official-campaign-localizations.js')continue;await fs.copyFile(path.join(from,pin.file),path.join(to,pin.file));}
for(const dir of [candidate,base]){await fs.writeFile(path.join(dir,'public/llms.txt'),'protected original llms');await fs.writeFile(path.join(dir,'config/policy.json'),'protected original policy');}
await fs.mkdir(path.join(candidate,'tests/helpers'),{recursive:true});await fs.copyFile(path.join(root,'tests/helpers/r231-frozen-peer-contract.mjs'),path.join(candidate,'tests/helpers/r231-frozen-peer-contract.mjs'));
await fs.copyFile(path.join(root,'tests/helpers/r237-approved-inverses.mjs'),path.join(candidate,'tests/helpers/r237-approved-inverses.mjs'));await fs.mkdir(path.join(candidate,'tests/fixtures'),{recursive:true});await fs.copyFile(path.join(root,'tests/fixtures/r237-approved-inverses.json'),path.join(candidate,'tests/fixtures/r237-approved-inverses.json'));
const pins=structuredClone(manifest);await change({candidate,base,pins});await fs.writeFile(path.join(temp,'r235/PEER-INPUT-IDENTITY.json'),JSON.stringify(pins,null,2)+'\n');
// Preserve byte-exact original JSON where caller has not mutated it.
if(JSON.stringify(pins)===JSON.stringify(manifest))await fs.copyFile(new URL('../../PEER-INPUT-IDENTITY.json',import.meta.url),path.join(temp,'r235/PEER-INPUT-IDENTITY.json'));
const module=await import(pathToFileURL(path.join(candidate,'tests/helpers/r231-frozen-peer-contract.mjs')).href);return await module.verifyFrozenRuntime();
}finally{await fs.rm(temp,{recursive:true,force:true});}}
test('real frozen authority accepts exact six peers and immutable unchanged protected files',()=>fixture(async()=>{}));
test('real filesystem omitted protected file is rejected',async()=>{await assert.rejects(fixture(async({candidate})=>{await fs.unlink(path.join(candidate,'public/llms.txt'));}),/keyset|missing|protected/i);});
test('real filesystem foreign addition is rejected',async()=>{await assert.rejects(fixture(async({candidate})=>{await fs.writeFile(path.join(candidate,'public/foreign.txt'),'not approved');}),/keyset|added|protected/i);});
test('modified source plus modified peer SHA cannot redefine accepted authority',async()=>{await assert.rejects(fixture(async({candidate,pins})=>{const pin=pins.find(p=>p.file==='src/styles/reader-foundation.css');const p=path.join(candidate,pin.file);await fs.appendFile(p,'\n/* unapproved mutation */');pin.sha256=hash(await fs.readFile(p));}),/manifest|authority/i);});
test('foreign path plus matching SHA in mutable manifest is rejected',async()=>{await assert.rejects(fixture(async({candidate,pins})=>{const file='src/foreign.js',bytes='unapproved';await fs.writeFile(path.join(candidate,file),bytes);pins.push({file,peer:'unapproved',sha256:hash(bytes)});}),/manifest|authority/i);});
test('combined inverse ledger cannot redefine literal approval when its JSON is changed',async()=>{await assert.rejects(fixture(async({candidate})=>{await fs.appendFile(path.join(candidate,'tests/fixtures/r237-approved-inverses.json'),'\n ');}),/immutable|ledger/i);});

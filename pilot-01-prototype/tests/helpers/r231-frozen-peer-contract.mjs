import {approvedRuntime,projectApproved} from './r237-approved-inverses.mjs';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),base=fileURLToPath(new URL('../../../../r207-coherent-topic-navigation/candidate/',import.meta.url));
const manifestFile=fileURLToPath(new URL('../../../PEER-INPUT-IDENTITY.json',import.meta.url));
const ACCEPTED_MANIFEST_SHA='83f0ca9810d66d71896c73aac1c52c76f00a43bf736c4d1f3793ed2fdc48d2a3';
const APPROVED_RUNTIME=Object.freeze({
  "src/components/v3/V3Pages.jsx": "60f70061723c7e56f9f3f78bf9f0e16a146dd4555d5b009f5af806e6753d9689",
  "src/components/v3/VenueReadinessChecklist.css": "a6afce105abf3ccc09d13dc1e4764fed49172c6835039f74bf0469ad5ab795da",
  "src/components/v3/VenueReadinessChecklist.jsx": "4cc00e1e820109cf63ab07272c737ae9cd1006acec35f75244b08cf9970c2c2d",
  "src/components/v3/crossroads-compare.css": "38b8917ae33aa16e46f3ff5c3d55ff656925b35d5f63d7d50f506bce8d72c8e9",
  "src/styles/reader-foundation.css": "89394f33143168fcc1a41ab80c9d861d2e138d6c9374d8995c43b004e3a0c3a9",
  "src/styles/reader-material.css": "94060c1f4e6aee0728655316c32d361c5959ca4e4e92da68f0b5dfa6db4be374"
});
const originalPins=Object.entries(APPROVED_RUNTIME).map(([file,sha256])=>({file,sha256}));
const pins=Object.entries(approvedRuntime).map(([file,sha256])=>({file,sha256}));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function verifyAuthority(){
 const bytes=fs.readFileSync(manifestFile);assert.equal(sha(bytes),ACCEPTED_MANIFEST_SHA,'immutable accepted peer manifest authority');
 const declared=JSON.parse(bytes).filter(pin=>pin.file.startsWith('src/')).map(({file,sha256})=>({file,sha256})).sort((a,b)=>a.file.localeCompare(b.file));
 assert.deepEqual(declared,[...originalPins].sort((a,b)=>a.file.localeCompare(b.file)),'literal six peer path and whole SHA authority');
}
// Reject modified authority even when a test runner selects only one consumer.
verifyAuthority();
function protectedKeys(directory){const keys=[];function walk(area){for(const entry of fs.readdirSync(path.join(directory,area),{withFileTypes:true})){const file=path.join(area,entry.name);if(entry.isDirectory())walk(file);else if(entry.isFile())keys.push(file);else assert.fail(file+' unsupported protected entry');}}for(const area of ['src','config','public'])walk(area);return keys.sort();}
export function verifyFrozenRuntime(){
 verifyAuthority();const previous=protectedKeys(base),current=protectedKeys(root);
 assert.deepEqual(current,[...previous,'src/data/official-campaign-localizations.js'].sort(),'bidirectional protected keyset: only literal approved localization addition');
 const changes=[];for(const file of current){const bytes=fs.readFileSync(path.join(root,file));if(approvedRuntime[file])assert.equal(sha(bytes),approvedRuntime[file],file+' literal exact frozen runtime');if(!fs.existsSync(path.join(base,file))||!bytes.equals(fs.readFileSync(path.join(base,file))))changes.push(file);}
 assert.deepEqual(changes.sort(),Object.keys(approvedRuntime).sort(),'only six literal accepted protected changes');
}
export function assertExactPeerChanges(changes){assert.deepEqual([...changes].sort(),Object.keys(approvedRuntime).sort());verifyFrozenRuntime();}
export function peerBaseline(file){assert.ok(Object.hasOwn(approvedRuntime,file),file+' explicitly approved peer');verifyFrozenRuntime();return fs.readFileSync(path.join(base,file),'utf8');}
export function withoutR213(text){text=projectApproved('src/components/v3/crossroads-compare.css',text,'r231-coherent-reader-polish');assert.equal(sha(text),APPROVED_RUNTIME['src/components/v3/crossroads-compare.css'],'exact frozen R213v2 whole CSS');const marker='\n/* R213: tablet comparison navigation keeps all five labels readable. */';assert.equal(text.split(marker).length,2,'one exact tablet tail');const previous=text.slice(0,text.indexOf(marker));assert.equal(sha(previous),'cfba31fa3a32e08f683d02255174c4d5c4c8b6dfa14e962694508342df89b205','exact frozen R208 prefix');return previous;}

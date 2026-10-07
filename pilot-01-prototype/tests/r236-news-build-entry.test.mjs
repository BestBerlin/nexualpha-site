import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const before=fs.readFileSync(new URL('../../../r226-news-ssr-parity/candidate/package.json',import.meta.url),'utf8');
const current=fs.readFileSync(new URL('../package.json',import.meta.url),'utf8');
const step='node scripts/build-news-ssr.mjs',ssr='vite build --ssr src/entry-server.jsx --outDir dist/ssr';
function verify(text){const value=JSON.parse(text),old=JSON.parse(before),commands=value.scripts.build.split(' && ');
 assert.equal(commands.filter(s=>s===step).length,1,'one runtime build required');
 assert.equal(commands.indexOf(step),commands.indexOf(ssr)+1,'runtime build immediately follows existing SSR');
 assert.equal(text.replace(ssr+' && '+step,ssr),before,'all other package bytes and scripts immutable');
 assert.deepEqual(commands.filter(s=>s!==step),old.scripts.build.split(' && '));
 const suffix=commands.slice(commands.indexOf('vite build'));
 assert.deepEqual(suffix,['vite build',ssr,step,'node scripts/generate-prerender-manifest.mjs','node scripts/prepare-sites-build.mjs','node scripts/verify-build-budget.mjs --strict']);return suffix;
}
test('actual package standard chain contains exactly one portable-news step, original scripts byte-identical',()=>verify(current));
test('actual standard clean offline suffix keeps client/SSR/runtime/manifest/prepare/strict order',()=>{const commands=verify(current);assert.equal(commands.length,6);assert.ok(!commands.some(c=>c.includes('fetch-exchange')));});
test('entry contract rejects omitted/duplicate/moved runtime step and unrelated package change',()=>{
 assert.throws(()=>verify(current.replace(ssr+' && '+step,ssr)));
 assert.throws(()=>verify(current.replace(step,step+' && '+step)));
 assert.throws(()=>verify(current.replace(ssr+' && '+step,step+' && '+ssr)));
 assert.throws(()=>verify(current.replace('"dev": "vite"','"dev": "vite --host"')));
});

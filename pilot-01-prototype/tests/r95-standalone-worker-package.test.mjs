import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, copyFile, writeFile, unlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const shared = ['topic-reviewed-faqs.js','topic-source-registry.js','topic-guides-data.js','exchange-research.js','tokenized-assets-cluster.js','news-feed-client.js','locale-routing.js'];
const runtimeData = [...shared,'reviewed-news-publication.js','tracking-attribution.js'];
async function importWorker(entry) {
 const code = `globalThis.fetch=()=>{throw new Error('External network forbidden');};
  const {default:worker}=await import(${JSON.stringify(pathToFileURL(entry).href)});
  if(typeof worker?.fetch!=='function')throw new Error('Worker fetch entry absent');
  console.log('STANDALONE_IMPORT_PASS');`;
 return run(process.execPath,['--input-type=module','-e',code],{cwd:tmpdir(),timeout:10000});
}

test('fresh dist Worker and five shared schema dependencies are byte-identical to source',async()=>{
 assert.deepEqual(await readFile(path.join(root,'dist/server/index.js')),await readFile(path.join(root,'worker/index.js')));
 for(const name of shared) {
  assert.deepEqual(await readFile(path.join(root,'dist/src/data',name)),await readFile(path.join(root,'src/data',name)),name);
 }
 const result=await importWorker(path.join(root,'dist/server/index.js'));
 assert.match(result.stdout,/STANDALONE_IMPORT_PASS/);
});

test('isolated dist package imports without repository fallback and missing transitive data fails',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'r95-standalone-worker-'));
 try {
  await mkdir(path.join(dir,'server'));await mkdir(path.join(dir,'src/data'),{recursive:true});
  await writeFile(path.join(dir,'package.json'),'{"type":"module"}\n');
  const entry=path.join(dir,'server/index.js');
  await copyFile(path.join(root,'dist/server/index.js'),entry);
  for(const name of runtimeData)await copyFile(path.join(root,'dist/src/data',name),path.join(dir,'src/data',name));
  assert.match((await importWorker(entry)).stdout,/STANDALONE_IMPORT_PASS/);
  await unlink(path.join(dir,'src/data/topic-reviewed-faqs.js'));
  await assert.rejects(importWorker(entry),error=>{assert.match(error.stderr,/topic-reviewed-faqs\.js/);return true;});
  await copyFile(path.join(root,'dist/src/data/topic-reviewed-faqs.js'),path.join(dir,'src/data/topic-reviewed-faqs.js'));
  // Reproduce the transitive packaging failure outside the project tree.
  await unlink(path.join(dir,'src/data/exchange-research.js'));
  await assert.rejects(importWorker(entry),error=>{
   assert.match(error.stderr,/ERR_MODULE_NOT_FOUND/);
   assert.match(error.stderr,/exchange-research\.js/);
   return true;
  });
 } finally {await rm(dir,{recursive:true,force:true});}
});

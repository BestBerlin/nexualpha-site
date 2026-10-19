import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createCtaClickBeacon } from '../server/cta-click.mjs';

const payload = JSON.stringify({partner:'okx',src:'home',path:'/'});
test('F06 rejects cross-site simple posts before writing and permits same-origin beacons', async () => {
 const root=await mkdtemp(path.join(tmpdir(),'click-audit-'));
 try {
 await mkdir(path.join(root,'intel')); await writeFile(path.join(root,'intel/partners.json'),JSON.stringify({partners:[{slug:'okx',registrationUrl:'https://www.okx.com/'}]}));
 const file=path.join(root,'events'); const handle=createCtaClickBeacon({clientRoot:root,eventFile:file});
 const post=(headers)=>new Request('https://nexualpha.com/api/cta-click',{method:'POST',body:payload,headers});
 assert.equal((await handle(post({origin:'https://untrusted.example','content-type':'text/plain'}))).status,403);
 assert.equal((await handle(post({'sec-fetch-site':'cross-site'}))).status,403);
 assert.equal((await handle(post({}))).status,403);
 assert.equal((await handle(post({origin:'null','sec-fetch-site':'same-origin'}))).status,403);
 assert.equal((await handle(post({'sec-fetch-site':'same-origin'}))).status,204);
 assert.equal((await handle(post({origin:'https://nexualpha.com'}))).status,204);
 await new Promise(r=>setTimeout(r,30));
 assert.equal((await readFile(file,'utf8')).trim().split('\n').length,2);
 } finally {await rm(root,{recursive:true,force:true});}
});

test('F07 storage faults are counted, sanitized, and recover; missing directories are created', async () => {
 const { createClickStorage } = await import('../server/click-storage.mjs');
 const root=await mkdtemp(path.join(tmpdir(),'click-fault-')); const logs=[];
 try {
  let fault=null;
  const { appendFile }=await import('node:fs/promises');
  const storage=createClickStorage({log:line=>logs.push(JSON.parse(line)),append:async (...args)=>{if(fault)throw Object.assign(new Error('private-path'),{code:fault});return appendFile(...args);}});
  const file=path.join(root,'missing','events');
  assert.equal(await storage.write(file,{t:'test'},'site'),true);
  for(const code of ['EROFS','EACCES','ENOENT','ENOSPC']) { fault=code; assert.equal(await storage.write(file,{},'go'),false); }
  assert.deepEqual(storage.status(),{configured:true,ready:false,writes:1,failures:4});
  assert.equal(logs.length,4); assert.doesNotMatch(JSON.stringify(logs),/private-path|events/);
  fault=null; assert.equal(await storage.write(file,{},'go'),true);
  assert.deepEqual(storage.status(),{configured:true,ready:true,writes:2,failures:4});
 } finally {await rm(root,{recursive:true,force:true});}
});

test('F07 beacon reports a failed count instead of success', async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'click-response-'));
 try {
 await mkdir(path.join(root,'intel'));await writeFile(path.join(root,'intel/partners.json'),JSON.stringify({partners:[{slug:'okx',registrationUrl:'https://www.okx.com/'}]}));
 const handle=createCtaClickBeacon({clientRoot:root,eventFile:path.join(root,'events'),storage:{write:async()=>false}});
 assert.equal((await handle(new Request('https://nexualpha.com/api/cta-click',{method:'POST',body:payload,headers:{origin:'https://nexualpha.com'}}))).status,503);
 } finally{await rm(root,{recursive:true,force:true});}
});

test('F07 redirect still wins when counting fails', async()=>{
 const { createGoRedirect }=await import('../server/go-redirect.mjs');
 const root=await mkdtemp(path.join(tmpdir(),'go-fault-'));
 try{
 await mkdir(path.join(root,'intel'));await writeFile(path.join(root,'intel/partners.json'),JSON.stringify({partners:[{slug:'okx',registrationUrl:'https://www.okx.com/'}]}));
 let calls=0; const handle=createGoRedirect({clientRoot:root,eventFile:path.join(root,'events'),storage:{write:async()=>{calls++;return false;}}});
 const res=await handle(new Request('https://nexualpha.com/go/okx',{headers:{'user-agent':'Mozilla/5.0'}}));
 assert.equal(res.status,302); assert.equal(res.headers.get('location'),'https://www.okx.com/');assert.equal(calls,1);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('F07 real read-only directory failure is observable and recovers after permissions restore', async()=>{
 const { chmod }=await import('node:fs/promises');
 const { createClickStorage }=await import('../server/click-storage.mjs');
 const root=await mkdtemp(path.join(tmpdir(),'click-readonly-'));
 const storage=createClickStorage({log:()=>{}});
 try{
  await chmod(root,0o500);
  assert.equal(await storage.write(path.join(root,'events'),{},'site'),false);
  assert.equal(storage.status().failures,1);
  await chmod(root,0o700);
  assert.equal(await storage.write(path.join(root,'events'),{},'site'),true);
  assert.equal(storage.status().ready,true);
 }finally{await chmod(root,0o700);await rm(root,{recursive:true,force:true});}
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {collect,dryStore,parseCollectArgs,runCollect} from './runner.mjs';
import {normalizeItem,makeRequest,CollectorError} from './common.mjs';
import {loadSeeds,normalizeSeeds} from './seeds.mjs';
import {databaseStore} from './store.mjs';
const now=new Date('2026-10-12T12:00:00Z');
const row={external_id:'1',url:'https://example.com/news?utm_source=test',title:'Binance withdrawals suspended',body_excerpt:'x'.repeat(900),published_at:'2026-10-12T11:00:00Z'};
function memory(){const writes=[];return {writes,reserve:async()=>false,persist:async(source,items,health)=>writes.push({source,items,health})};}
test('normalization limits excerpts, canonicalizes URL, matches entities and rejects bad dates',()=>{
 const item=normalizeItem(row,{id:'a'},{now,entities:[{id:'binance',display_name:{en:'Binance'},status:'active'}],keywords:[{term:'withdrawals suspended',event_type:'withdrawal_halt',status:'active'}]});
 assert.equal(item.body_excerpt.length,600);assert.equal(item.canonical_url,'https://example.com/news');assert.deepEqual(item.entities,['binance']);assert.equal(item.event_type_guess,'withdrawal_halt');assert.equal(item.metrics,null);
 assert.throws(()=>normalizeItem({...row,published_at:'bad'},{id:'a'}),/publication/);
 assert.throws(()=>normalizeItem({...row,url:'file:///private/test'},{id:'a'}),/HTTP/);
});
test('one failure or timeout never stops the next source; errors cannot leak credential details',async()=>{
 const store=memory();let aborted=false;
 const modules=[{supports:()=>true,poll:async(source,since,ctx)=>{
   if(source.id==='fail')throw new Error('Bearer secret');
   if(source.id==='timeout')return new Promise(resolve=>ctx.signal.addEventListener('abort',()=>{aborted=true;resolve([]);}));
   return [row,row];
 }}];
 const reports=await collect({sources:[{id:'fail'},{id:'timeout'},{id:'ok'}],modules,store,now,timeoutMs:20});
 assert.equal(reports[0].status,'temporarily-failing');assert.equal(reports[1].last_error,'Source timeout');assert.equal(reports[2].count,1);assert.equal(aborted,true);assert.ok(!JSON.stringify(store.writes).includes('secret'));
});
test('circuit breaker uses fallback once and disabled sources stay disabled',async()=>{
 const store=memory();const sources=[{id:'failed',consecutive_failures:3,last_error_at:now.toISOString(),fallback_source_id:'good'},{id:'good'},{id:'off',enabled:false}];
 const reports=await collect({sources,store,now,modules:[{supports:()=>true,poll:async()=>[row]}]});
 assert.equal(reports[0].skipped,'circuit-backoff');assert.equal(reports[1].fallback,true);assert.equal(store.writes.length,1);
});
test('authorization status persists separately; persistence failure is isolated',async()=>{
 const store=memory();store.persist=async(source,items,health)=>{if(source.id==='db-error')throw Error('DB unavailable');store.writes.push(health);};
 const reports=await collect({sources:[{id:'auth'},{id:'db-error'},{id:'good'}],store,now,modules:[{supports:()=>true,poll:async s=>{if(s.id==='auth')throw new CollectorError('Credential missing','missing-authorization');return [row];}}]});
 assert.equal(reports[0].status,'missing-authorization');assert.equal(reports[1].last_error,'Persistence failed');assert.equal(reports[2].count,1);
});
test('bounded transport retry, contact SEC UA, 403 no retry, parse failure sanitized',async()=>{
 let calls=0;const sleeps=[];
 const request=makeRequest({fetchImpl:async(url,opts)=>{assert.equal(opts.headers['User-Agent'],'NexuAlpha newsroom ops@nexualpha.com');return ++calls===1?{ok:false,status:503}:{ok:true,json:async()=>({items:[]})};},sleep:async ms=>sleeps.push(ms)});
 assert.deepEqual(await request('https://www.sec.gov/feed'),{items:[]});assert.equal(calls,2);assert.ok(sleeps.includes(250));
 let denied=0;await assert.rejects(makeRequest({fetchImpl:async()=>{denied++;return {ok:false,status:403};}})('https://example.com'),e=>e.status==='missing-authorization');assert.equal(denied,1);
 await assert.rejects(makeRequest({fetchImpl:async()=>({ok:true,json:async()=>{throw new SyntaxError('secret body');}})})('https://example.com'),/response parse failure/);
});
test('dry-run NDJSON and status output are path-safe and paid APIs cannot dispatch',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'newsroom-collectors-'));
 try {const store=dryStore(dir);assert.equal(await store.reserve('x',10,100),false);await collect({sources:[{id:'../escape'}],store,now,modules:[{supports:()=>true,poll:async()=>[row]}]});
 const name=Buffer.from('../escape').toString('hex');assert.equal(JSON.parse(readFileSync(join(dir,`${name}.ndjson`),'utf8')).source_id,'../escape');assert.equal(JSON.parse(readFileSync(join(dir,`${name}.status.json`),'utf8')).status,'connected');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('verified import preserves multilingual phrases, merges duplicate entity, rejects fake handles',()=>{
 const seeds=loadSeeds();assert.equal(seeds.entities.length,133);assert.equal(seeds.keywords.length,711);assert.equal(new Set(seeds.keywords.map(k=>k.lang)).size,10);
 assert.equal(seeds.entities.filter(e=>e.id==='lookonchain').length,1);assert.equal(seeds.entities.find(e=>e.id==='jerome-powell').accounts.x,undefined);
 assert.ok(!seeds.entities.find(e=>e.id==='jerome-powell').aliases.includes('Federal Reserve System'));
 const value=normalizeSeeds([{type:'person',name:'Test',accounts:{x:'unverified - via @other'}}],{event_words:{en:['hacked','hacked']}});assert.deepEqual(value.entities[0].accounts,{});assert.equal(value.keywords.length,1);
});
test('non-paid feeds overlap publication cursors without dropping late items',async()=>{
 const store=memory();let since;
 const source={id:'late',platform:'media',last_success_at:now.toISOString()};
 const reports=await collect({sources:[source],store,now,modules:[{supports:()=>true,poll:async(s,cursor)=>{since=cursor;return [row];}}]});
 assert.equal(since,'2026-10-11T12:00:00.000Z');assert.equal(reports[0].count,1);
});
test('DB batches are transactional idempotent and quota reservations lock before dispatch',()=>{
 const sql=[];const literal=v=>`'${String(v).replaceAll("'","''")}'`;const store=databaseStore(q=>{sql.push(q);return '1';},literal);
 store.seed(loadSeeds());assert.match(sql[0],/ON CONFLICT\(term,lang\) DO NOTHING/);assert.match(sql[0],/'x_daily_read_budget','0'/);
 store.persist({id:"owner's"},[normalizeItem(row,{id:"owner's"},{now})],{status:'connected',last_success_at:now.toISOString(),consecutive_failures:0,at:now.toISOString()});assert.match(sql[1],/ON CONFLICT\(source_id,external_id\)/);assert.match(sql[1],/owner''s/);
 assert.equal(store.reserve('x',10,20,'2026-10-12'),true);assert.match(sql[2],/pg_advisory_xact_lock/);assert.match(sql[2],/collector_usage:x:2026-10-12/);assert.match(sql[2],/x_daily_read_budget/);assert.equal(store.reserve('x',10,-1,'2026-10-12'),false);
});
test('collect options reject ambiguous selections and dry-run never reads Postgres',async()=>{
 for(const args of [[],['--all','--source','a'],['--source'],['--all','--all'],['--all','--timeout-ms','NaN']])assert.throws(()=>parseCollectArgs(args));
 const dir=mkdtempSync(join(tmpdir(),'newsroom-cli-'));try {
 const reports=await runCollect(['--source','x-api-v2','--dry-run',dir],new Proxy({}, {get:()=>assert.fail('DB accessed')}),{fetchImpl:async()=>assert.fail('network accessed')});assert.equal(reports[0].status,'partial');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('first-run archives are not backfilled: items published more than seven days ago are dropped',async()=>{
 const store=memory();
 const old={...row,external_id:'old',published_at:'2019-01-01T00:00:00Z'};const undated={...row,external_id:'undated',published_at:null};
 const reports=await collect({sources:[{id:'archive'}],store,now,modules:[{supports:()=>true,poll:async()=>[row,old,undated]}]});
 assert.equal(reports[0].count,2);assert.deepEqual(store.writes[0].items.map(i=>i.external_id).sort(),['1','undated']);
});

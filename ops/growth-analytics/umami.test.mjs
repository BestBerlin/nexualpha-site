import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { classifyTraffic, AUTOMATED_ANALYTICS_UA as nightlyUa } from './bots.mjs';
import { dayBounds, runUmami, summarizeUmami, umamiChineseReport } from './umami.mjs';
import { isAutomatedAnalyticsRequest, AUTOMATED_ANALYTICS_UA as serverUa } from '../../pilot-01-prototype/server/analytics-bots.mjs';
test('bot, QA and uncertain network/no-JS/burst signals remain separate', () => {
  for (const userAgent of ['HeadlessChrome','NexuAlpha QA','Playwright','GoogleOther','GPTBot','curl/8','wget','python-requests','Slurp','WhatsApp','node','undici']) assert.equal(classifyTraffic({userAgent}).classification,'bot_or_qa');
  assert.equal(classifyTraffic({ip:'192.0.2.2'},[],{ANALYTICS_QA_IPS:'192.0.2.2'}).classification,'bot_or_qa');
  for (const signal of [{asn:16509},{javascript:false}]) assert.equal(classifyTraffic(signal).classification,'unknown');
  assert.equal(classifyTraffic({},Array.from({length:120},(_,i)=>({createdAt:new Date(i*10).toISOString()}))).classification,'unknown');
  assert.equal(classifyTraffic({browser:'Chrome',device:'desktop'}).classification,'human_candidate');
});
test('server excludes known QA but does not trust forged forwarding headers', () => {
  const request = new Request('https://nexualpha.com',{headers:{'user-agent':'Mozilla/5.0','x-real-ip':'192.0.2.2'}});
  assert.equal(isAutomatedAnalyticsRequest(request,{env:{ANALYTICS_QA_IPS:'192.0.2.2'}}),false);
  assert.equal(isAutomatedAnalyticsRequest(request,{env:{ANALYTICS_QA_IPS:'192.0.2.2'},clientIp:'::ffff:192.0.2.2'}),true);
  request.headers.set('user-agent','Codex audit');
  assert.equal(isAutomatedAnalyticsRequest(request),true);
});
test('aggregate excludes bots and orphan events and retains unknown source', () => {
  const data=summarizeUmami([{id:'h',country:'US',device:'mobile'},{id:'b',userAgent:'GPTBot'}],[{sessionId:'h',eventType:1,urlPath:'/go/okx',urlQuery:'src=home.hero'},{sessionId:'h',eventType:2,eventName:'copy_code'},{sessionId:'h',eventType:2,eventName:'telegram_click'},{sessionId:'b',eventType:1,urlPath:'/bot'},{sessionId:'missing',eventType:1,urlPath:'/orphan'}]);
  assert.equal(data.humanCandidates.visitors,1);
  assert.deepEqual(data.humanCandidates.goClicksByVenueAndSrc,[{key:'okx | home.hero',count:1}]);
  assert.equal(data.humanCandidates.copyCodeEvents[0].count,1);
  assert.equal(data.orphanEvents,1);
  assert.equal(data.coverage.rawUa,1);
  assert.ok(!JSON.stringify(data).includes('GPTBot'));
});
test('strict calendar day uses Shanghai midnight', () => {
  assert.equal(dayBounds('2026-10-14').startAt,Date.parse('2026-10-13T16:00:00Z'));
  assert.throws(()=>dayBounds('2026-02-30'),/INVALID_DATE/);
});
test('paginated live adapter writes aggregates only and never secrets',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'umami-test-'));
  const env={UMAMI_URL:'https://example.com/insights',UMAMI_USERNAME:'private-user',UMAMI_PASSWORD:'private-password',UMAMI_WEBSITE_ID:'site'};
  const calls=[];
  const fetchImpl=async(url, options)=>{
    calls.push(url);
    assert.equal(options.redirect,'error');
    if(url.endsWith('/auth/login')) return Response.json({token:'private-token'});
    if(url.includes('/sessions?')) return Response.json({data:[{id:'private-session',country:'CN'}],count:1});
    const page=new URL(url).searchParams.get('page');
    return Response.json({data:[{sessionId:'private-session',eventType:1,urlPath:page==='1'?'/one':'/two'}],count:2});
  };
  try {
    const result=await runUmami({date:'2026-10-14',outputDir:dir,env,fetchImpl});
    assert.equal(result.status,'ok');
    assert.equal(result.metrics.humanCandidates.topPages.length,2);
    assert.equal(calls.length,4);
    const json=await readFile(path.join(dir,'umami','2026-10-14.json'),'utf8');
    for(const secret of ['private-user','private-password','private-token','private-session']) assert.ok(!json.includes(secret));
    assert.match(await readFile(path.join(dir,'umami','2026-10-14.md'),'utf8'),/候选真人/);
  } finally { await rm(dir,{recursive:true,force:true}); }
});
test('failed/unconfigured sources remain blocked rather than invented zero',async()=>{
  const missing=await runUmami({date:'2026-10-14',env:{}});
  assert.equal(missing.status,'blocked');
  assert.equal(missing.metrics,undefined);
  assert.match(umamiChineseReport(missing),/不报告为零流量/);
  const result=await runUmami({date:'2026-10-14',env:{UMAMI_URL:'https://example.com',UMAMI_USERNAME:'u',UMAMI_PASSWORD:'p',UMAMI_WEBSITE_ID:'w'},fetchImpl:async()=>{throw new Error('private-password');}});
  assert.equal(result.reason,'UMAMI_FETCH_FAILED');
  assert.ok(!JSON.stringify(result).includes('private-password'));
});

test('portable nightly classifier retains exact parity with server bot UA exclusions',()=>assert.equal(nightlyUa.toString(),serverUa.toString()));

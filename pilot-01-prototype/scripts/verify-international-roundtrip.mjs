import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {buildGrowthReport} from '../server/growth-report.mjs';
const require=createRequire('/Users/bestberlin/.codex/shared-tools/web-quality/package.json');
const puppeteer=require('puppeteer-core');
const root=process.env.REVIEW_ROOT||process.cwd();
const temp=await mkdtemp(path.join(os.tmpdir(),'nexu-roundtrip-'));const file=path.join(temp,'events.jsonl');
const child=spawn(process.execPath,['server/local-sites-preview.mjs'],{cwd:root,env:{...process.env,HOST:'127.0.0.1',PORT:'4213',CTA_DATA_FILE:file},stdio:['ignore','pipe','pipe']});
let browser;
try{
await new Promise((resolve,reject)=>{child.stdout.on('data',b=>{if(b.toString().includes('listening'))resolve();});child.once('exit',c=>reject(new Error(`preview exited ${c}`)));setTimeout(()=>reject(new Error('Preview start timeout')),5000).unref();});
browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage();await page.setUserAgent((await browser.userAgent()).replace('HeadlessChrome','Chrome'));await page.evaluateOnNewDocument(()=>Object.defineProperty(navigator,'webdriver',{get:()=>false}));
await page.setRequestInterception(true);page.on('request',req=>{if(req.url().startsWith('http://127.0.0.1:4213/')||req.url().startsWith('data:'))req.continue();else req.abort();});
await page.goto('http://127.0.0.1:4213/br?utm_source=qa_fixture&publisher=qa_roundtrip&utm_campaign=qa_only',{waitUntil:'networkidle2'});
await page.select('[data-testid="brazil-platform"]','okx');
await page.$eval('.br-decision-primary a',e=>e.target='_self');
await page.click('.br-decision-primary a');
let rows=[];
for(let i=0;i<20;i++){rows=(await readFile(file,'utf8').catch(()=>'' )).trim().split('\n').filter(Boolean).map(x=>JSON.parse(x));if(rows.some(e=>e.type==='decision_select'))break;await new Promise(r=>setTimeout(r,100));}
assert.ok(rows.some(e=>e.type==='page_view'&&e.market==='BR'&&e.product==='spot'));
assert.ok(rows.some(e=>e.type==='decision_select'&&e.decision==='select_okx'));
// OKX is currently a research handoff in the Brazil flow until its commercial
// terms are verified. The roundtrip must therefore prove fail-closed behavior:
// selection is recorded, but no referral click is emitted.
assert.equal(rows.filter(e=>e.type==='referral_click'&&e.platform==='okx'&&e.publisher==='qa_roundtrip').length,0);
const {report}=await buildGrowthReport({inputFile:file,outputDir:path.join(temp,'reports')});assert.equal(report.totals.uniqueVisitors,1);assert.equal(report.totals.clickingSessions,0);assert.equal(report.totals.confirmedRegistrations,null);
const out='../artifacts/international-cta/roundtrip';await mkdir(out,{recursive:true});const result={status:'pass',scope:'isolated local browser to real HTTP collector to JSONL to private report; synthetic QA, not production traffic',build:JSON.parse(await readFile(path.join(root,'dist/client/version.json'),'utf8')),events:rows.map(({type,market,product,platform,decision,publisher})=>({type,market,product,platform,decision,publisher})),totals:report.totals};await writeFile(path.join(out,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{if(browser)await browser.close();child.kill('SIGTERM');await rm(temp,{recursive:true,force:true});}
